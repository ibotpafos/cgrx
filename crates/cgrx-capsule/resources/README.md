# o200k tokenizer pack

`o200k_base.cgrxtok` is a deterministic, offline `CGRXTOK1` compilation of
OpenAI's `o200k_base.tiktoken`. The pinned upstream object is 3,613,922 bytes
with SHA-256 `446a9538cb6c348e3516120d7c08b09f57c36495e2acfffe59a5bf8b0cfb1a2d`.

The binary layout is little-endian:

1. eight bytes `CGRXTOK1`;
2. `u32` token count;
3. rank-sorted entries of `u32 rank`, `u32 byte_length`, and raw token bytes.

Runtime code uses only this checked-in compiled object and has no network path.
`SHA256SUMS` pins both the upstream source identity and compiled object.
