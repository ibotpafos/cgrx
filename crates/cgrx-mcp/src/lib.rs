//! Synchronous, offline MCP surface for CGRX.
#![recursion_limit = "256"]

mod protocol;
mod tools;

pub use protocol::{JsonRpcError, JsonRpcRequest, JsonRpcResponse};
pub use tools::{
    BackendError, Server, ToolBackend, model_visible_schema_json, revision_bound_handle,
};
