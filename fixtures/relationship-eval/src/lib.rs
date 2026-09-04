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
