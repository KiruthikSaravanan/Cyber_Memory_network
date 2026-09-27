from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AlertSeverity(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class AlertStatus(StrEnum):
    OPEN = "Open"
    INVESTIGATING = "Investigating"
    RESOLVED = "Resolved"
    CLOSED = "Closed"


class AlertCreate(BaseModel):
    alert_type: str = Field(min_length=1, max_length=100)
    severity: AlertSeverity
    timestamp: datetime
    source: str | None = Field(default=None, max_length=255)
    description: str | None = None
    status: AlertStatus
    incident_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="before")
    @classmethod
    def reject_null_required_values(cls, value: Any) -> Any:
        if isinstance(value, dict):
            for field in ("alert_type", "severity", "timestamp", "status"):
                if field in value and value[field] is None:
                    raise ValueError(f"{field} cannot be null")
        return value


class AlertUpdate(BaseModel):
    alert_type: str | None = Field(default=None, min_length=1, max_length=100)
    severity: AlertSeverity | None = None
    timestamp: datetime | None = None
    source: str | None = Field(default=None, max_length=255)
    description: str | None = None
    status: AlertStatus | None = None
    incident_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="before")
    @classmethod
    def reject_null_required_values(cls, value: Any) -> Any:
        if isinstance(value, dict):
            for field in ("alert_type", "severity", "timestamp", "status"):
                if field in value and value[field] is None:
                    raise ValueError(f"{field} cannot be null")
        return value


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    alert_type: str
    severity: str
    timestamp: datetime
    source: str | None
    description: str | None
    status: str
    incident_id: int | None
