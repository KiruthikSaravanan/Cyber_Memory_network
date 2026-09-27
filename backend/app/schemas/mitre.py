from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field


class TechniqueId(StrEnum):
    T1110 = "T1110"
    T1566 = "T1566"
    T1059 = "T1059"
    T1071 = "T1071"


class TechniqueSeed(BaseModel):
    technique_id: TechniqueId
    technique_name: str = Field(min_length=1, max_length=255)
    tactic: str = Field(min_length=1, max_length=100)
    description: str


class MitreMappingCreate(BaseModel):
    technique_id: TechniqueId
    incident_id: int = Field(gt=0)


class MitreMappingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    technique_id: str
    technique_name: str
    tactic: str | None
    description: str | None
    incident_id: int
