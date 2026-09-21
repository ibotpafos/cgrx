# Release hygiene

## Versioning rules

- `RELEASE_VERSION` is the only release candidate input.
- A tag or GitHub Release that already exists must never be retargeted.
- Release automation must verify the tag commit, artifact names, and checksums.
- Historical releases remain immutable.

## Cleanup checklist

Before publishing:

- run workspace CI;
- run experimental feature validation when applicable;
- verify release notes match the exact version;
- verify installer/docs references;
- verify generated artifacts and SHA256SUMS.

## Experimental features

Experimental language packs remain outside the production registry until evidence contracts and regression fixtures are complete.
