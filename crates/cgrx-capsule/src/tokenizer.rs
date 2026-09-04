use std::fmt;
use std::sync::OnceLock;

use rustc_hash::FxHashMap;
use tiktoken_rs::{CoreBPE, O200K_BASE_PAT_STR};

const PACK: &[u8] = include_bytes!("../resources/o200k_base.cgrxtok");
const MAGIC: &[u8; 8] = b"CGRXTOK1";
const SOURCE_SIZE: u64 = 3_613_922;
const SOURCE_SHA256: &str = "446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d";

static O200K: OnceLock<Result<CoreBPE, String>> = OnceLock::new();

#[derive(Clone, Copy)]
pub struct Tokenizer {
    core: &'static CoreBPE,
}

impl Tokenizer {
    pub fn o200k_base() -> Result<Self, TokenizerError> {
        let result = O200K.get_or_init(load_o200k);
        result
            .as_ref()
            .map(|core| Self { core })
            .map_err(|message| TokenizerError(message.clone()))
    }

    #[must_use]
    pub fn count(&self, text: &str) -> u32 {
        u32::try_from(self.core.encode_ordinary(text).len()).unwrap_or(u32::MAX)
    }

    #[must_use]
    pub const fn name(&self) -> &'static str {
        "o200k_base"
    }

    #[must_use]
    pub const fn source_size(&self) -> u64 {
        SOURCE_SIZE
    }

    #[must_use]
    pub const fn source_sha256(&self) -> &'static str {
        SOURCE_SHA256
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenizerError(String);

impl fmt::Display for TokenizerError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "invalid compiled tokenizer pack: {}", self.0)
    }
}

impl std::error::Error for TokenizerError {}

fn load_o200k() -> Result<CoreBPE, String> {
    if PACK.get(..MAGIC.len()) != Some(MAGIC) {
        return Err("magic mismatch".to_owned());
    }
    let mut offset = MAGIC.len();
    let count = read_u32(PACK, &mut offset)? as usize;
    let mut encoder = FxHashMap::with_capacity_and_hasher(count, Default::default());
    for _ in 0..count {
        let rank = read_u32(PACK, &mut offset)?;
        let length = read_u32(PACK, &mut offset)? as usize;
        let end = offset
            .checked_add(length)
            .ok_or_else(|| "token length overflow".to_owned())?;
        let token = PACK
            .get(offset..end)
            .ok_or_else(|| "truncated token bytes".to_owned())?;
        if encoder.insert(token.to_vec(), rank).is_some() {
            return Err("duplicate token bytes".to_owned());
        }
        offset = end;
    }
    if offset != PACK.len() || encoder.len() != 199_998 {
        return Err("pack length or token count mismatch".to_owned());
    }
    let special = FxHashMap::from_iter([
        ("<|endoftext|>".to_owned(), 199_999),
        ("<|endofprompt|>".to_owned(), 200_018),
    ]);
    CoreBPE::new(encoder, special, O200K_BASE_PAT_STR).map_err(|error| error.to_string())
}

fn read_u32(bytes: &[u8], offset: &mut usize) -> Result<u32, String> {
    let end = offset
        .checked_add(4)
        .ok_or_else(|| "offset overflow".to_owned())?;
    let value = bytes
        .get(*offset..end)
        .ok_or_else(|| "truncated integer".to_owned())?;
    *offset = end;
    Ok(u32::from_le_bytes(value.try_into().expect("four bytes")))
}
