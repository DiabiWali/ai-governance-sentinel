from sqlalchemy.orm import Session

from app.db_models import AuditLog
from app.models import AuditLogRead, SecurityPrincipal


def write_audit_log(
    db: Session,
    principal: SecurityPrincipal,
    action: str,
    resource_type: str | None = None,
    resource_id: str | None = None,
    status: str = "success",
    details: dict | None = None,
) -> AuditLog:
    audit_log = AuditLog(
        actor=principal.actor,
        role=principal.role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        status=status,
        details=details or {},
    )

    db.add(audit_log)
    db.commit()
    db.refresh(audit_log)

    return audit_log


def to_audit_log_read(audit_log: AuditLog) -> AuditLogRead:
    return AuditLogRead(
        id=audit_log.id,
        actor=audit_log.actor,
        role=audit_log.role,
        action=audit_log.action,
        resource_type=audit_log.resource_type,
        resource_id=audit_log.resource_id,
        status=audit_log.status,
        details=audit_log.details or {},
        created_at=audit_log.created_at,
    )
