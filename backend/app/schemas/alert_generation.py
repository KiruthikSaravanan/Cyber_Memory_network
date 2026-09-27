from pydantic import BaseModel


class GeneratedAlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    status: str


class AlertGenerationResponse(BaseModel):
    detections_found: int
    alerts_created: int
    alerts: list[GeneratedAlertResponse]
