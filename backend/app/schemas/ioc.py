from enum import StrEnum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class IOCType(StrEnum):
    IP = "IP"
    DOMAIN = "Domain"
    HASH = "Hash"
    URL = "URL"


class ThreatLevel(StrEnum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class IOCCreate(BaseModel):
    type: IOCType
    value: str = Field(min_length=1, max_length=512)
    threat_level: ThreatLevel
    description: str | None = None
    incident_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="before")
    @classmethod
    def reject_null_required_values(cls, value: Any) -> Any:
        if isinstance(value, dict):
            for field in ("type", "value", "threat_level"):
                if field in value and value[field] is None:
                    raise ValueError(f"{field} cannot be null")
        return value


class IOCUpdate(BaseModel):
    type: IOCType | None = None
    value: str | None = Field(default=None, min_length=1, max_length=512)
    threat_level: ThreatLevel | None = None
    description: str | None = None
    incident_id: int | None = Field(default=None, gt=0)

    @model_validator(mode="before")
    @classmethod
    def reject_null_required_values(cls, value: Any) -> Any:
        if isinstance(value, dict):
            for field in ("type", "value", "threat_level"):
                if field in value and value[field] is None:
                    raise ValueError(f"{field} cannot be null")
        return value


class IOCResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    type: str
    value: str
    threat_level: str
    description: str | None
    incident_id: int | None
