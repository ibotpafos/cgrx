use std::fs::{self, File, OpenOptions};
use std::io::{self, Write};
use std::path::Path;

use cgrx_core::Hash32;
use serde::{Deserialize, Serialize};

pub(crate) const REQUIRED_SEGMENTS: [&str; 3] = ["nodes.seg", "edges.seg", "terms.fst"];

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub(crate) struct SegmentManifest {
    pub name: String,
    pub size: u64,
    pub hash: Hash32,
}

pub(crate) fn valid_name(name: &str) -> bool {
    REQUIRED_SEGMENTS.contains(&name)
}

pub(crate) fn write_synced(path: &Path, bytes: &[u8]) -> io::Result<()> {
    let mut file = OpenOptions::new().create_new(true).write(true).open(path)?;
    file.write_all(bytes)?;
    file.sync_all()
}

pub(crate) fn inspect(path: &Path, name: &str) -> io::Result<SegmentManifest> {
    let bytes = fs::read(path)?;
    Ok(SegmentManifest {
        name: name.to_owned(),
        size: bytes.len() as u64,
        hash: Hash32(*blake3::hash(&bytes).as_bytes()),
    })
}

pub(crate) fn verify(path: &Path, expected: &SegmentManifest) -> io::Result<()> {
    let actual = inspect(path, &expected.name)?;
    if &actual != expected {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!("segment validation failed: {}", expected.name),
        ));
    }
    Ok(())
}

pub(crate) fn sync_dir(path: &Path) -> io::Result<()> {
    File::open(path)?.sync_all()
}
