from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...database import get_db
from ...schemas.alert_generation import AlertGenerationResponse
from ...schemas.detection import DetectionRunResponse
from ...services.alert_generation_service import run_detection_and_create_alerts
from ...services.detection_service import run_detection

router = APIRouter(prefix="/detection", tags=["detection"])


@router.post("/run", response_model=DetectionRunResponse)
def run_detection_endpoint(
    db: Session = Depends(get_db),
) -> DetectionRunResponse:
    detections = run_detection(db)
    return DetectionRunResponse(
        detections=detections,
        total_detections=len(detections),
    )


@router.post(
    "/run-and-create-alerts",
    response_model=AlertGenerationResponse,
)
def run_detection_and_create_alerts_endpoint(
    db: Session = Depends(get_db),
) -> AlertGenerationResponse:
    detections_found, alerts = run_detection_and_create_alerts(db)
    return AlertGenerationResponse(
        detections_found=detections_found,
        alerts_created=len(alerts),
        alerts=alerts,
    )
