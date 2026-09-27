from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CyberMemoryUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    attack_type: str | None = Field(default=None, max_length=100)
    summary: str | None = None
    investigation_findings: str | None = None
    final_solution: str | None = None
    lessons_learned: str | None = None


class CyberMemoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_id: int
    attack_type: str | None
    summary: str | None
    investigation_findings: str | None
    final_solution: str | None
    lessons_learned: str | None
    created_at: datetime


class CyberMemoryCreatedResponse(CyberMemoryResponse):
    message: str = "Cyber Memory created from closed incident"


class CyberMemorySearchResponse(BaseModel):
    keyword: str
    total_results: int
    results: list[CyberMemoryResponse]


class AttackTypeSearchResponse(BaseModel):
    attack_type: str
    total_results: int
    results: list[CyberMemoryResponse]
