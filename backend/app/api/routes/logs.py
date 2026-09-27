from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...schemas.log import LogIngestResponse, LogResponse
from ...services.log_service import (
    LogFileError,
    LogValidationError,
    get_log,
    ingest_logs,
    list_logs,
)

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("/ingest", response_model=LogIngestResponse)
def ingest_logs_endpoint(db: Session = Depends(get_db)) -> LogIngestResponse:
    try:
        inserted = ingest_logs(db)
    except LogValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors,
        ) from exc
    except LogFileError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(exc),
        ) from exc
    return LogIngestResponse(inserted=inserted)


@router.get("", response_model=list[LogResponse])
def list_logs_endpoint(db: Session = Depends(get_db)) -> list[LogResponse]:
    return list_logs(db)


@router.get("/{log_id}", response_model=LogResponse)
def get_log_endpoint(log_id: int, db: Session = Depends(get_db)) -> LogResponse:
    log = get_log(db, log_id)
    if log is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Log not found",
        )
    return log
