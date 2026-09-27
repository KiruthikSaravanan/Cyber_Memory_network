from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...schemas.incident import IncidentCreate, IncidentResponse, IncidentUpdate
from ...services.incident_service import (
    create_incident,
    delete_incident,
    get_incident,
    list_incidents,
    update_incident,
)

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_incident_endpoint(
    payload: IncidentCreate, db: Session = Depends(get_db)
) -> IncidentResponse:
    return create_incident(db, payload)


@router.get("", response_model=list[IncidentResponse])
def list_incidents_endpoint(db: Session = Depends(get_db)) -> list[IncidentResponse]:
    return list_incidents(db)


@router.get("/{incident_id}", response_model=IncidentResponse)
def get_incident_endpoint(
    incident_id: int, db: Session = Depends(get_db)
) -> IncidentResponse:
    incident = get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    return incident


@router.put("/{incident_id}", response_model=IncidentResponse)
def update_incident_endpoint(
    incident_id: int,
    payload: IncidentUpdate,
    db: Session = Depends(get_db),
) -> IncidentResponse:
    incident = get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    return update_incident(db, incident, payload)


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident_endpoint(
    incident_id: int, db: Session = Depends(get_db)
) -> Response:
    incident = get_incident(db, incident_id)
    if incident is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    delete_incident(db, incident)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
