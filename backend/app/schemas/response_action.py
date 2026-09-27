from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ResponseActionStatus(StrEnum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class ResponseActionCreate(BaseModel):
    action: str = Field(min_length=1, max_length=255)
    description: str | None = None
    status: ResponseActionStatus
    incident_id: int = Field(gt=0)

    @model_validator(mode="before")
    @classmethod
    def reject_null_required_values(cls, value: Any) -> Any:
        if isinstance(value, dict):
            for field in ("action", "status", "incident_id"):
                if field in value and value[field] is None:
                    raise ValueError(f"{field} cannot be null")
        return value


class ResponseActionUpdate(BaseModel):
    action: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    status: ResponseActionStatus | None = None
    incident_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="before")
    @classmethod
    def reject_null_required_values(cls, value: Any) -> Any:
        if isinstance(value, dict):
            for field in ("action", "status", "incident_id"):
                if field in value and value[field] is None:
                    raise ValueError(f"{field} cannot be null")
        return value


class ResponseActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    action: str
    description: str | None
    status: str
    incident_id: int
    created_at: datetime
