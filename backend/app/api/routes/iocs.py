from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...schemas.ioc import IOCCreate, IOCResponse, IOCUpdate
from ...services.ioc_service import (
    IncidentNotFoundError,
    create_ioc,
    delete_ioc,
    get_ioc,
    list_iocs,
    update_ioc,
)

router = APIRouter(prefix="/iocs", tags=["iocs"])


@router.post("", response_model=IOCResponse, status_code=status.HTTP_201_CREATED)
def create_ioc_endpoint(
    payload: IOCCreate, db: Session = Depends(get_db)
) -> IOCResponse:
    try:
        return create_ioc(db, payload)
    except IncidentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced incident not found",
        ) from exc


@router.get("", response_model=list[IOCResponse])
def list_iocs_endpoint(db: Session = Depends(get_db)) -> list[IOCResponse]:
    return list_iocs(db)


@router.get("/{ioc_id}", response_model=IOCResponse)
def get_ioc_endpoint(ioc_id: int, db: Session = Depends(get_db)) -> IOCResponse:
    ioc = get_ioc(db, ioc_id)
    if ioc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IOC not found",
        )
    return ioc


@router.put("/{ioc_id}", response_model=IOCResponse)
def update_ioc_endpoint(
    ioc_id: int,
    payload: IOCUpdate,
    db: Session = Depends(get_db),
) -> IOCResponse:
    ioc = get_ioc(db, ioc_id)
    if ioc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IOC not found",
        )
    try:
        return update_ioc(db, ioc, payload)
    except IncidentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referenced incident not found",
        ) from exc


@router.delete("/{ioc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ioc_endpoint(ioc_id: int, db: Session = Depends(get_db)) -> Response:
    ioc = get_ioc(db, ioc_id)
    if ioc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="IOC not found",
        )
    delete_ioc(db, ioc)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
