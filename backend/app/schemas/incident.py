from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class IncidentSeverity(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class IncidentStatus(StrEnum):
    OPEN = "Open"
    INVESTIGATING = "Investigating"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class IncidentCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    severity: IncidentSeverity
    status: IncidentStatus
    attack_type: str | None = Field(default=None, max_length=100)
    source: str | None = Field(default=None, max_length=255)
    detection_time: datetime | None = None
    assigned_analyst: str | None = Field(default=None, max_length=255)
    investigation_notes: str | None = None
    final_solution: str | None = None
    lessons_learned: str | None = None


class IncidentUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    severity: IncidentSeverity | None = None
    status: IncidentStatus | None = None
    attack_type: str | None = Field(default=None, max_length=100)
    source: str | None = Field(default=None, max_length=255)
    detection_time: datetime | None = None
    assigned_analyst: str | None = Field(default=None, max_length=255)
    investigation_notes: str | None = None
    final_solution: str | None = None
    lessons_learned: str | None = None

    @model_validator(mode="before")
    @classmethod
    def reject_null_required_values(cls, value: Any) -> Any:
        if isinstance(value, dict):
            for field in ("title", "severity", "status"):
                if field in value and value[field] is None:
                    raise ValueError(f"{field} cannot be null")
        return value


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    severity: str
    status: str
    attack_type: str | None
    source: str | None
    detection_time: datetime | None
    assigned_analyst: str | None
    investigation_notes: str | None
    final_solution: str | None
    lessons_learned: str | None
    created_at: datetime
