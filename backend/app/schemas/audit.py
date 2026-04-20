from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity: str
    entity_id: Optional[int] = None
    timestamp: datetime
    # Il modello ORM espone `metadata_` (il nome `metadata` è riservato da
    # SQLAlchemy DeclarativeBase). Lo rinominiamo in output.
    audit_metadata: Optional[dict[str, Any]] = Field(
        default=None,
        validation_alias="metadata_",
    )

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
