from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...schemas.mitre import MitreMappingCreate, MitreMappingResponse
from ...services.mitre_service import (
    DuplicateMitreMappingError,
    IncidentNotFoundError,
    create_mitre_mapping,
    delete_mitre_mapping,
    get_mitre_mapping,
    list_incident_mitre_mappings,
    list_mitre_mappings,
)

router = APIRouter(tags=["MITRE ATT&CK"])


@router.post(
    "/mitre",
    response_model=MitreMappingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_mitre_mapping_endpoint(
    payload: MitreMappingCreate,
    db: Session = Depends(get_db),
) -> MitreMappingResponse:
    try:
        return create_mitre_mapping(db, payload)
    except IncidentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        ) from exc
    except DuplicateMitreMappingError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This technique is already mapped to this incident",
        ) from exc


@router.get("/mitre", response_model=list[MitreMappingResponse])
def list_mitre_mappings_endpoint(
    db: Session = Depends(get_db),
) -> list[MitreMappingResponse]:
    return list_mitre_mappings(db)


@router.get("/mitre/{mapping_id}", response_model=MitreMappingResponse)
def get_mitre_mapping_endpoint(
    mapping_id: int, db: Session = Depends(get_db)
) -> MitreMappingResponse:
    mapping = get_mitre_mapping(db, mapping_id)
    if mapping is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MITRE mapping not found",
        )
    return mapping


@router.get(
    "/incidents/{incident_id}/mitre",
    response_model=list[MitreMappingResponse],
)
def list_incident_mitre_mappings_endpoint(
    incident_id: int,
    db: Session = Depends(get_db),
) -> list[MitreMappingResponse]:
    mappings = list_incident_mitre_mappings(db, incident_id)
    if mappings is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    return mappings


@router.delete("/mitre/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mitre_mapping_endpoint(
    mapping_id: int, db: Session = Depends(get_db)
) -> Response:
    mapping = get_mitre_mapping(db, mapping_id)
    if mapping is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MITRE mapping not found",
        )
    delete_mitre_mapping(db, mapping)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
