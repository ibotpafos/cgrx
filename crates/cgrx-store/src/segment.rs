use std::fs::{File, OpenOptions};
use std::io::{self, Read, Write};
use std::path::Path;

use cgrx_core::Hash32;
use serde::{Deserialize, Serialize};

pub(crate) const REQUIRED_SEGMENTS: [&str; 3] = ["nodes.seg", "edges.seg", "terms.fst"];

/// Minimum size (bytes) above which segments are zstd-compressed on write.
const COMPRESS_THRESHOLD: usize = 4096;

/// 4-byte magic header identifying zstd-compressed segments.
const COMPRESSED_MAGIC: &[u8; 4] = b"CZST";

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub(crate) struct SegmentManifest {
    pub name: String,
    pub size: u64,
    pub hash: Hash32,
}

pub(crate) fn valid_name(name: &str) -> bool {
    REQUIRED_SEGMENTS.contains(&name)
}

/// Write bytes to disk, compressing with zstd if above threshold.
/// A 4-byte magic header identifies compressed segments.
pub(crate) fn write_synced(path: &Path, bytes: &[u8]) -> io::Result<()> {
    let mut file = OpenOptions::new().create_new(true).write(true).open(path)?;
    if bytes.len() >= COMPRESS_THRESHOLD {
        let compressed = zstd::encode_all(bytes, 3).map_err(io::Error::other)?;
        if compressed.len() < bytes.len() {
            file.write_all(COMPRESSED_MAGIC)?;
            file.write_all(&compressed)?;
            file.sync_all()?;
            return Ok(());
        }
    }
    file.write_all(bytes)?;
    file.sync_all()
}

/// Read bytes from disk, decompressing if the file starts with the magic header.
pub(crate) fn read_decompressed(path: &Path) -> io::Result<Vec<u8>> {
    let mut file = File::open(path)?;
    let mut header = [0u8; 4];
    let header_read = file.read(&mut header)?;
    if header_read == 4 && header == *COMPRESSED_MAGIC {
        let mut compressed = Vec::new();
        file.read_to_end(&mut compressed)?;
        zstd::decode_all(&compressed[..]).map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))
    } else {
        let mut bytes = Vec::with_capacity(header_read + 4096);
        bytes.extend_from_slice(&header[..header_read]);
        file.read_to_end(&mut bytes)?;
        Ok(bytes)
    }
}

/// Inspect a segment file: read it, decompress if needed, and return manifest.
pub(crate) fn inspect(path: &Path, name: &str) -> io::Result<SegmentManifest> {
    let bytes = read_decompressed(path)?;
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
