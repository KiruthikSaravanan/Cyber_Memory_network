from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...schemas.alert import AlertCreate, AlertResponse, AlertUpdate
from ...services.alert_service import (
    IncidentNotFoundError,
    create_alert,
    delete_alert,
    get_alert,
    list_alerts,
    update_alert,
)

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
def create_alert_endpoint(
    payload: AlertCreate, db: Session = Depends(get_db)
) -> AlertResponse:
    try:
        return create_alert(db, payload)
    except IncidentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced incident not found",
        ) from exc


@router.get("", response_model=list[AlertResponse])
def list_alerts_endpoint(db: Session = Depends(get_db)) -> list[AlertResponse]:
    return list_alerts(db)


@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert_endpoint(alert_id: int, db: Session = Depends(get_db)) -> AlertResponse:
    alert = get_alert(db, alert_id)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )
    return alert


@router.put("/{alert_id}", response_model=AlertResponse)
def update_alert_endpoint(
    alert_id: int,
    payload: AlertUpdate,
    db: Session = Depends(get_db),
) -> AlertResponse:
    alert = get_alert(db, alert_id)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )
    try:
        return update_alert(db, alert, payload)
    except IncidentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced incident not found",
        ) from exc


@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert_endpoint(alert_id: int, db: Session = Depends(get_db)) -> Response:
    alert = get_alert(db, alert_id)
    if alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )
    delete_alert(db, alert)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
