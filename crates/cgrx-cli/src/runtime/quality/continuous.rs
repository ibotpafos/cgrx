//! Bounded producer lifecycle, cross-process locks and source-independent triage.
use super::*;
use std::{
    fs::{File, OpenOptions},
    path::PathBuf,
    sync::{
        Arc, Condvar, Mutex,
        atomic::{AtomicBool, Ordering},
    },
    thread,
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}
pub struct QualityWorker {
    stop: Arc<AtomicBool>,
    wake: Arc<(Mutex<()>, Condvar)>,
    join: Option<thread::JoinHandle<()>>,
}
impl Drop for QualityWorker {
    fn drop(&mut self) {
        self.stop.store(true, Ordering::Release);
        self.wake.1.notify_all();
        if let Some(join) = self.join.take() {
            let _ = join.join();
        }
    }
}
impl Runtime {
    pub fn quality_graph_guard(&self) -> Result<File, RuntimeError> {
        self.quality_file_lock("quality-runtime.lock")
    }
    pub(super) fn quality_file_lock(&self, name: &str) -> Result<File, RuntimeError> {
        let file = OpenOptions::new()
            .create(true)
            .truncate(false)
            .read(true)
            .write(true)
            .open(self.state_root.join(name))
            .map_err(|_| error("cgrx.quality_state_io", "cannot open quality state lock"))?;
        loop {
            self.quality_check_cancel()?;
            match file.try_lock() {
                Ok(()) => return Ok(file),
                Err(std::fs::TryLockError::WouldBlock) => thread::sleep(Duration::from_millis(10)),
                Err(std::fs::TryLockError::Error(_)) => {
                    return Err(error("cgrx.quality_state_io", "cannot lock quality state"));
                }
            }
        }
    }
    pub(super) fn quality_write_json(
        &self,
        path: &Path,
        value: &Value,
    ) -> Result<(), RuntimeError> {
        let bytes = serde_json::to_vec(value)
            .map_err(|_| error("cgrx.quality_state_io", "cannot serialize quality state"))?;
        if bytes.len() > 16 * 1024 * 1024 {
            return Err(error(
                "cgrx.quality_state_budget",
                "quality state exceeds 16 MiB",
            ));
        }
        let tmp = path.with_extension(format!("{}.tmp", std::process::id()));
        fs::write(&tmp, bytes)
            .and_then(|_| fs::rename(&tmp, path))
            .map_err(|_| {
                error(
                    "cgrx.quality_state_io",
                    "cannot atomically write quality state",
                )
            })
    }
    pub(super) fn quality_check_cancel(&self) -> Result<(), RuntimeError> {
        if self
            .quality_cancel
            .as_ref()
            .is_some_and(|s| s.load(Ordering::Acquire))
            || self.quality_deadline.is_some_and(|d| Instant::now() >= d)
        {
            return Err(error(
                "cgrx.quality_cancelled",
                "quality analysis cancelled or exceeded its time budget",
            ));
        }
        Ok(())
    }
    pub fn start_quality_worker(&self, root: &Path, scip: Option<PathBuf>) -> QualityWorker {
        let stop = Arc::new(AtomicBool::new(false));
        let wake = Arc::new((Mutex::new(()), Condvar::new()));
        let stopped = stop.clone();
        let signaled = wake.clone();
        let state = self.state_root.clone();
        let root = root.to_path_buf();
        let interval = std::env::var("CGRX_QUALITY_POLL_MS")
            .ok()
            .and_then(|v| v.parse::<u64>().ok())
            .unwrap_or(2000)
            .clamp(100, 60000);
        let join=thread::Builder::new().name("cgrx-quality-index".into()).spawn(move || {
            let mut runtime:Option<Runtime>=None;let mut lease:Option<File>=None;
            while !stopped.load(Ordering::Acquire) {
                if lease.is_none()&& let Ok(f)=OpenOptions::new().create(true).truncate(false).read(true).write(true).open(state.join("quality-worker.lease"))&& f.try_lock().is_ok(){lease=Some(f);}
                if lease.is_some() {
                    let attempt=(||->Result<Value,RuntimeError>{
                        if runtime.is_none(){runtime=Some(Runtime::open(&state)?);}
                        let r=runtime.as_mut().unwrap();r.quality_cancel=Some(stopped.clone());r.quality_deadline=None;
                        {
                            let _guard=r.quality_graph_guard()?;
                            if let Ok(reader)=cgrx_store::GenerationReader::open_current(&state)
                                && reader.snapshot()!=&r.base_snapshot {
                                *r=Runtime::open(&state)?;r.quality_cancel=Some(stopped.clone());
                            }

                            match r.refresh(&root) {
                                Ok(_)=>{},
                                Err(e) if e.code()=="revision_changed"=>{
                                    if let Some(scip)=scip.as_ref(){Runtime::index_committed_head_with_scip(&root,&state,scip)?;}else{Runtime::index_committed_head(&root,&state)?;}
                                    *r=Runtime::open(&state)?;r.quality_cancel=Some(stopped.clone());r.refresh(&root)?;
                                },
                                Err(e)=>return Err(e),
                            }
                        }
                        r.quality_deadline=Some(Instant::now()+Duration::from_secs(10));
                        let mut index=r.quality_index(&root)?;
                        r.quality_attach_states(&mut index)?;
                        Ok(json!({"phase":"ready","snapshot":index["snapshot"],"analysis":index["analysis"],"candidate_count":index["candidates"].as_array().map(Vec::len),"partial":index["partial"],"poll_ms":interval,"updated_at_unix":now(),"producer_pid":std::process::id()}))
                    })();
                    let report=match attempt {Ok(v)=>v,Err(e)=>json!({"phase":"error","code":e.code(),"updated_at_unix":now(),"poll_ms":interval,"producer_pid":std::process::id()})};
                    if let Some(r)=runtime.as_ref(){let _=r.quality_write_json(&state.join("quality-worker-status.json"),&report);}
                }
                let guard=signaled.0.lock().unwrap();let _wait=signaled.1.wait_timeout_while(guard,Duration::from_millis(interval),|_|!stopped.load(Ordering::Acquire));
            }
            if lease.is_some()&& let Some(r)=runtime.as_ref(){let _=r.quality_write_json(&state.join("quality-worker-status.json"),&json!({"phase":"stopped","updated_at_unix":now(),"producer_pid":std::process::id()}));}
        }).ok();
        if join.is_none() {
            let _ = self.quality_write_json(
                &self.state_root.join("quality-worker-status.json"),
                &json!({"phase":"error","code":"worker_spawn_failed"}),
            );
        }
        QualityWorker { stop, wake, join }
    }
    pub(super) fn quality_worker_status(&self) -> Result<Value, RuntimeError> {
        let mut status = fs::read(self.state_root.join("quality-worker-status.json"))
            .ok()
            .and_then(|b| serde_json::from_slice::<Value>(&b).ok())
            .unwrap_or(json!({"phase":"not_started"}));
        status["fresh"] = json!(status["snapshot"] == json!(self.snapshot()));
        status["requested_snapshot"] = json!(self.snapshot());
        Ok(status)
    }
    pub(super) fn quality_states(&self) -> Result<Value, RuntimeError> {
        let path = self.state_root.join("quality-finding-states-v1.json");
        match fs::read(path) {
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                Ok(json!({"version":1,"records":{}}))
            }
            Err(_) => Err(error("cgrx.quality_state_io", "cannot read triage state")),
            Ok(bytes) => {
                if bytes.len() > 16 * 1024 * 1024 {
                    return Err(error(
                        "cgrx.quality_state_budget",
                        "triage state exceeds 16 MiB",
                    ));
                }
                let value: Value = serde_json::from_slice(&bytes).map_err(|_| {
                    error(
                        "cgrx.quality_state_corrupt",
                        "invalid triage JSON; existing file preserved",
                    )
                })?;
                if value["version"] != 1 || !value["records"].is_object() {
                    return Err(error(
                        "cgrx.quality_state_corrupt",
                        "unsupported triage state; existing file preserved",
                    ));
                }
                Ok(value)
            }
        }
    }
    pub(super) fn quality_attach_states(&self, index: &mut Value) -> Result<(), RuntimeError> {
        let _lock = self.quality_file_lock("quality-triage.lock")?;
        let mut db = self.quality_states()?;
        let mut changed = false;
        for c in index["candidates"].as_array_mut().unwrap() {
            let id = c["finding_id"].as_str().unwrap().to_owned();
            let old = &mut db["records"][&id];
            if !old.is_object() {
                *old = json!({"finding_id":id,"status":"new","reason":null,"version":0,"content_fingerprint":c["content_fingerprint"],"kind":c["kind"],"last_candidate_id":c["id"],"path":c["evidence"].get("path").or_else(||c["evidence"].pointer("/symbol/path")).or_else(||c["evidence"].pointer("/left/path")),"verification":"not_reviewed","history":[]});
                changed = true;
            }
            if old.is_object() && old["content_fingerprint"] != c["content_fingerprint"] {
                let previous = old["status"].clone();
                let version = old["version"].as_u64().unwrap_or(0) + 1;
                let mut history = old["history"].as_array().cloned().unwrap_or_default();
                history.push(json!({"status":"new","reason":"content_changed","previous_status":previous,"at_unix":now(),"version":version}));
                if history.len() > 20 {
                    history.remove(0);
                }
                old["status"] = json!("new");
                old["verification"] = json!("not_reviewed");
                old["reason"] = json!("content_changed");
                old["version"] = json!(version);
                old["content_fingerprint"] = c["content_fingerprint"].clone();
                old["history"] = json!(history);
                changed = true;
            }
            c["triage"] = if old.is_object() {
                old.clone()
            } else {
                json!({"status":"new","version":0,"reason":null,"history":[]})
            };
            c["triage"]["still_detected"] = json!(true);
        }
        if changed {
            db["records"]
                .as_object_mut()
                .unwrap()
                .retain(|_, v| v.is_object());
            self.quality_write_json(&self.state_root.join("quality-finding-states-v1.json"), &db)?;
        }
        Ok(())
    }
    pub(super) fn quality_update_state(
        &self,
        c: &Value,
        args: &Value,
    ) -> Result<Value, RuntimeError> {
        let status = args["status"]
            .as_str()
            .filter(|s| matches!(*s, "new" | "confirmed" | "dismissed" | "fixed"))
            .ok_or_else(|| {
                error(
                    "cgrx.invalid_arguments",
                    "status must be new, confirmed, dismissed or fixed",
                )
            })?;
        let reason = args
            .get("reason")
            .and_then(Value::as_str)
            .unwrap_or("")
            .trim();
        if reason.len() > 1000 || (matches!(status, "dismissed" | "fixed") && reason.is_empty()) {
            return Err(error(
                "cgrx.invalid_arguments",
                "reason required for dismissed/fixed; at most 1000 UTF-8 bytes",
            ));
        }
        let expected = args["expected_version"]
            .as_u64()
            .ok_or_else(|| error("cgrx.invalid_arguments", "expected_version required"))?;
        let _lock = self.quality_file_lock("quality-triage.lock")?;
        let mut db = self.quality_states()?;
        let id = c["finding_id"].as_str().unwrap();
        let old = &db["records"][id];
        let version = old["version"].as_u64().unwrap_or(0);
        if version != expected {
            return Err(error(
                "cgrx.quality_status_conflict",
                "finding version changed; fetch details before retrying",
            ));
        }
        let mut history = old["history"].as_array().cloned().unwrap_or_default();
        history.push(json!({"status":status,"reason":reason,"version":version+1,"at_unix":now()}));
        if history.len() > 20 {
            history.remove(0);
        }
        let record = json!({"finding_id":id,"status":status,"reason":reason,"version":version+1,"content_fingerprint":c["content_fingerprint"],"kind":c["kind"],"last_candidate_id":c["id"],"path":c["evidence"].get("path").or_else(||c["evidence"].pointer("/symbol/path")).or_else(||c["evidence"].pointer("/left/path")),"verification":"user_reported","history":history});
        db["records"][id] = record.clone();
        self.quality_write_json(&self.state_root.join("quality-finding-states-v1.json"), &db)?;
        Ok(
            json!({"finding":record,"still_detected":c["inactive"]!=true,"presence":if c["inactive"]==true {"not_in_current_bounded_index"} else {"current_detection"},"snapshot":self.snapshot(),"source_modified":false}),
        )
    }
    pub(super) fn quality_saved_finding(&self, id: &str) -> Result<Value, RuntimeError> {
        let _lock = self.quality_file_lock("quality-triage.lock")?;
        let db = self.quality_states()?;
        db["records"]
            .get(id)
            .filter(|r| r.is_object())
            .cloned()
            .ok_or_else(|| {
                error(
                    "cgrx.quality_finding_not_found",
                    "unknown stable finding_id",
                )
            })
    }
    pub(super) fn quality_inactive_states(&self, index: &Value) -> Result<Value, RuntimeError> {
        let _lock = self.quality_file_lock("quality-triage.lock")?;
        let db = self.quality_states()?;
        let current = index["candidates"]
            .as_array()
            .unwrap()
            .iter()
            .filter_map(|c| c["finding_id"].as_str())
            .collect::<BTreeSet<_>>();
        Ok(json!(db["records"].as_object().unwrap().iter().filter(|(key,_)|!current.contains(key.as_str())).take(300).map(|(_,v)|json!({"finding":v,"presence":"not_in_current_bounded_index","automatically_verified_fixed":false})).collect::<Vec<_>>()))
    }
}
