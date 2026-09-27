from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field


class BruteForceDetection(BaseModel):
    detection_type: Literal["Brute Force"] = "Brute Force"
    severity: Literal["High"] = "High"
    username: str
    source_ip: str
    number_of_failed_attempts: int
    first_attempt: datetime
    last_attempt: datetime
    description: str


class SuspiciousIPDetection(BaseModel):
    detection_type: Literal["Suspicious IP"] = "Suspicious IP"
    severity: Literal["Medium"] = "Medium"
    source_ip: str
    description: str


class MaliciousHashDetection(BaseModel):
    detection_type: Literal["Malicious File Hash"] = "Malicious File Hash"
    severity: Literal["Critical"] = "Critical"
    hash: str
    description: str


Detection = Annotated[
    BruteForceDetection | SuspiciousIPDetection | MaliciousHashDetection,
    Field(discriminator="detection_type"),
]


class DetectionRunResponse(BaseModel):
    detections: list[Detection]
    total_detections: int
