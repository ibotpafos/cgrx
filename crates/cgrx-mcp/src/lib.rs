//! Synchronous, offline MCP surface for CGRX.
#![recursion_limit = "256"]

mod presets;
mod protocol;
mod sarif;
mod tools;

pub use presets::{ResponseProfile, Toolset, resolve_response_profile, resolve_toolset};
pub use protocol::{JsonRpcError, JsonRpcRequest, JsonRpcResponse};
pub use sarif::{
    LineResolver, SarifResult, gate_to_sarif, severity_level, to_sarif, verdict_level,
};
pub use tools::{
    BackendError, Server, ToolBackend, model_visible_schema_json, revision_bound_handle,
};
