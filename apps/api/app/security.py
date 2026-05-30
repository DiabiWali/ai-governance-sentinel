import os
from typing import Iterable

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.models import SecurityPrincipal

api_key_header = APIKeyHeader(
    name="X-API-Key",
    auto_error=False,
)


def _get_configured_keys() -> dict[str, SecurityPrincipal]:
    analyst_key = os.getenv("API_KEY", "dev-analyst-key")
    admin_key = os.getenv("ADMIN_API_KEY", "dev-admin-key")

    return {
        analyst_key: SecurityPrincipal(actor="demo-analyst", role="analyst"),
        admin_key: SecurityPrincipal(actor="demo-admin", role="admin"),
    }


def require_api_key(api_key: str | None = Security(api_key_header)) -> SecurityPrincipal:
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key",
        )

    principals = _get_configured_keys()
    principal = principals.get(api_key)

    if principal is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )

    return principal


def require_roles(
    principal: SecurityPrincipal,
    allowed_roles: Iterable[str],
) -> SecurityPrincipal:
    if principal.role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )

    return principal


def require_admin(principal: SecurityPrincipal = Security(require_api_key)) -> SecurityPrincipal:
    return require_roles(principal, ["admin"])


def require_analyst_or_admin(
    principal: SecurityPrincipal = Security(require_api_key),
) -> SecurityPrincipal:
    return require_roles(principal, ["analyst", "admin"])
