from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None = None
    action: str
    entity: str
    entity_id: int | None = None
    timestamp: datetime
    # Il modello ORM espone `metadata_` (il nome `metadata` è riservato da
    # SQLAlchemy DeclarativeBase). Lo rinominiamo in output.
    audit_metadata: dict[str, Any] | None = Field(
        default=None,
        validation_alias="metadata_",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
