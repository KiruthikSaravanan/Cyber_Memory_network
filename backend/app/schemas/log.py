from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class LogIngestEntry(BaseModel):
    model_config = ConfigDict(extra="allow")

    timestamp: datetime
    username: str | None = None
    source_ip: str | None = None
    event_type: str = Field(min_length=1, max_length=100)


class LogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    timestamp: datetime
    username: str | None
    source_ip: str | None
    event_type: str | None
    raw_data: dict[str, Any] | list[Any] | None


class LogIngestResponse(BaseModel):
    inserted: int
