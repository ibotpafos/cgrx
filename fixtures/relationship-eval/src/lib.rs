mod private_child;
mod rust_other;
mod rust_target;

pub fn rust_caller() -> i32 {
    rust_target::rust_target()
}

pub fn rust_target_shadow() -> i32 {
    0
}

pub fn rust_noise() -> i32 {
    rust_target_shadow()
}

pub fn rust_private_caller() -> i32 {
    private_child::private_target()
}

use crate::rust_target as rust_api;

pub fn rust_alias_caller() -> i32 {
    rust_api::rust_target()
}

use crate::{rust_target as grouped_api, rust_other as grouped_other};
pub fn rust_grouped_caller() -> i32 {
    grouped_api::rust_target()
}

use crate::rust_target::{self as self_api};
pub fn rust_self_import_caller() -> i32 {
    self_api::rust_target()
}
