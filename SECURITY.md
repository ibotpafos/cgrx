# Security

Do not post secrets or private-repository vulnerability details in public issues.
Use GitHub private vulnerability reporting when available on this repository.

CGRX is a local stdio tool and trusts its client. It is not an authentication or
filesystem sandbox. Run with appropriate OS permissions. Repository indexes
and optional logs are sensitive local data. Do not expose the server through
an unauthenticated network bridge.
