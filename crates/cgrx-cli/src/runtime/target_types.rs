//! Target type structs for arc resolution.
//!
//! These structs represent resolved call targets for various languages.

use cgrx_core::ByteRange;
use serde::{Deserialize, Serialize};


#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
pub(super) struct GoFieldTarget {
    pub(super) package: String,
    pub(super) caller: ByteRange,
    pub(super) receiver_type: ByteRange,
    pub(super) field: ByteRange,
    pub(super) field_type: ByteRange,
    pub(super) target: ByteRange,
}

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
pub(super) struct GoLocalConstructorTarget {
    pub(super) package: String,
    pub(super) caller: ByteRange,
    pub(super) binding: String,
    pub(super) constructor: String,
    pub(super) target: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
pub(super) struct JavaConstructorTarget {
    pub(super) caller: ByteRange,
    pub(super) target: ByteRange,
}

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
pub(super) struct RustSelfTarget {
    pub(super) owner: ByteRange,
    pub(super) implementation: ByteRange,
    #[serde(default)]
    pub(super) target_implementation: Option<ByteRange>,
    pub(super) caller: ByteRange,
    pub(super) target: ByteRange,
}

#[derive(Clone, Debug, Serialize, Deserialize, Eq, PartialEq)]
pub(super) struct TsLexicalTarget {
    pub(super) target: ByteRange,
    pub(super) caller: ByteRange,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub(super) struct GoReceiverTarget {
    pub(super) package: String,
    pub(super) receiver_type: String,
    pub(super) path: String,
    pub(super) symbol: String,
    pub(super) span_start: usize,
    pub(super) span_end: usize,
}

