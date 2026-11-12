use super::*;

/// Validate memory arguments before loading an index or acquiring shared resources.
/// Source, revision and version checks still run against the refreshed repository.
pub fn validate_memory_arguments(name: &str, value: &Value) -> Result<(), JsonRpcError> {
    match name {
        "memory_record" => validate_record(&from_value(value.clone())?, ""),
        "memory_update" => {
            let args: MemoryUpdateArguments = from_value(value.clone())?;
            validate_identity(&args.id, args.expected_version)?;
            text(&args.reason, "reason", 1024)?;
            validate_record(&args.record, "record.")
        }
        "memory_forget" => {
            let args: MemoryForgetArguments = from_value(value.clone())?;
            validate_identity(&args.id, args.expected_version)
        }
        "memory_recall" => {
            let args: MemoryRecallArguments = from_value(value.clone())?;
            if args.include_history && args.id.is_none() {
                return Err(invalid("include_history", "include_history requires id"));
            }
            if let Some(id) = &args.id {
                validate_identity(id, 1)?;
            }
            for (value, field, max) in [
                (args.query.as_deref(), "query", cgrx_store::MAX_FACT_CHARS),
                (args.path.as_deref(), "path", 1024),
                (args.symbol.as_deref(), "symbol", 1024),
            ] {
                if let Some(value) = value {
                    text(value, field, max)?;
                }
            }
            if !(1..=50).contains(&args.limit.unwrap_or(20))
                || args.min_confidence.unwrap_or(0) > MAX_CONFIDENCE
                || !(256..=16000).contains(&args.budget.unwrap_or(2048))
            {
                return Err(invalid(
                    "recall",
                    "limit must be 1..50; min_confidence 0..1000; budget 256..16000",
                ));
            }
            Ok(())
        }
        _ => Ok(()),
    }
}

fn validate_record(args: &MemoryRecordArguments, prefix: &str) -> Result<(), JsonRpcError> {
    text(
        &args.fact,
        &format!("{prefix}fact"),
        cgrx_store::MAX_FACT_CHARS,
    )?;
    if args.confidence > MAX_CONFIDENCE {
        return Err(invalid(
            &format!("{prefix}confidence"),
            "confidence must be 0..1000",
        ));
    }
    for (value, field, max) in [
        (args.source_ref.as_deref(), "source_ref", 1024),
        (args.task_id.as_deref(), "task_id", 1024),
        (args.event_id.as_deref(), "event_id", 1024),
        (args.privacy_tag.as_deref(), "privacy_tag", 64),
    ] {
        if let Some(value) = value {
            text(value, &format!("{prefix}{field}"), max)?;
        }
    }
    if args.memory_kind == cgrx_store::MemoryKind::Working && args.task_id.is_none() {
        return Err(invalid(
            &format!("{prefix}task_id"),
            "working memory requires task_id; updates replace the complete record",
        ));
    }
    if args.memory_kind == cgrx_store::MemoryKind::Episodic && args.event_id.is_none() {
        return Err(invalid(
            &format!("{prefix}event_id"),
            "episodic memory requires event_id",
        ));
    }
    if args.source_kind != MemorySourceKind::Code {
        if args.source_ref.is_none() {
            return Err(invalid(
                &format!("{prefix}source_ref"),
                "non-code memory requires source_ref",
            ));
        }
        if args.path.as_ref().is_some_and(|p| !p.is_empty())
            || args.span.is_some()
            || args.symbol.is_some()
            || args.symbol_ref.is_some()
        {
            return Err(invalid(
                &format!("{prefix}source_kind"),
                "path, span and symbols are only valid for code sources; omit them for tool/user/agent sources",
            ));
        }
    }
    Ok(())
}

fn validate_identity(id: &str, version: u32) -> Result<(), JsonRpcError> {
    if id.len() != 32
        || !id
            .bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
    {
        return Err(invalid("id", "id must be 32 lowercase hex characters"));
    }
    if version == 0 {
        return Err(invalid(
            "expected_version",
            "expected_version must be positive",
        ));
    }
    Ok(())
}

fn invalid(field: &str, detail: &str) -> JsonRpcError {
    let mut error = JsonRpcError::typed(-32602, "cgrx.invalid_arguments", detail);
    let data = error.data.as_mut().expect("typed error");
    data["field"] = json!(field);
    data["mutation_applied"] = json!(false);
    error
}

fn text(value: &str, field: &str, max: usize) -> Result<(), JsonRpcError> {
    let chars = value.chars().count();
    if value.trim().is_empty() || chars > max || value.contains('\0') {
        let mut error = invalid(
            field,
            &format!("{field} must be 1..{max} characters without NUL; received {chars}"),
        );
        let data = error.data.as_mut().expect("typed error");
        data["actual_chars"] = json!(chars);
        data["max_chars"] = json!(max);
        if field.ends_with("fact") {
            data["recovery"] = json!(
                "Keep a concise conclusion and next step in fact; put detailed evidence in source_ref. Do not truncate evidence or retry the same oversized record."
            );
        }
        return Err(error);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unicode_limits_and_complete_replacement_errors_are_actionable_and_private() {
        let record = json!({"fact":"я".repeat(4000),"confidence":990,"source_kind":"tool","source_ref":"report"});
        validate_memory_arguments("memory_record", &record).unwrap();
        let mut update = json!({"id":"0123456789abcdef0123456789abcdef","expected_version":1,"reason":"Correction","record":record});
        update["record"]["fact"] = json!("я".repeat(4001));
        let error = validate_memory_arguments("memory_update", &update).unwrap_err();
        let data = error.data.unwrap();
        assert_eq!(data["field"], "record.fact");
        assert_eq!(data["actual_chars"], 4001);
        assert_eq!(data["max_chars"], 4000);
        assert_eq!(data["mutation_applied"], false);
        assert!(!data.to_string().contains("яя"));
        update["record"]["fact"] = json!("Save only the next step");
        update["record"]["memory_kind"] = json!("working");
        assert_eq!(
            validate_memory_arguments("memory_update", &update)
                .unwrap_err()
                .data
                .unwrap()["field"],
            "record.task_id"
        );
        update["record"]["task_id"] = json!("task");
        update["record"]["path"] = json!("src/lib.rs");
        assert_eq!(
            validate_memory_arguments("memory_update", &update)
                .unwrap_err()
                .data
                .unwrap()["field"],
            "record.source_kind"
        );
        update["record"].as_object_mut().unwrap().remove("path");
        validate_memory_arguments("memory_update", &update).unwrap();
    }
}
