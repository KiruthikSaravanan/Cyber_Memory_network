from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ...database import get_db
from ...schemas.response_action import (
    ResponseActionCreate,
    ResponseActionResponse,
    ResponseActionUpdate,
)
from ...services.response_action_service import (
    IncidentNotFoundError,
    create_response_action,
    delete_response_action,
    get_response_action,
    list_incident_response_actions,
    list_response_actions,
    update_response_action,
)

router = APIRouter(tags=["response actions"])


@router.post(
    "/response-actions",
    response_model=ResponseActionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_response_action_endpoint(
    payload: ResponseActionCreate,
    db: Session = Depends(get_db),
) -> ResponseActionResponse:
    try:
        return create_response_action(db, payload)
    except IncidentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        ) from exc


@router.get(
    "/response-actions",
    response_model=list[ResponseActionResponse],
)
def list_response_actions_endpoint(
    db: Session = Depends(get_db),
) -> list[ResponseActionResponse]:
    return list_response_actions(db)


@router.get(
    "/response-actions/{response_action_id}",
    response_model=ResponseActionResponse,
)
def get_response_action_endpoint(
    response_action_id: int,
    db: Session = Depends(get_db),
) -> ResponseActionResponse:
    response_action = get_response_action(db, response_action_id)
    if response_action is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response action not found",
        )
    return response_action


@router.get(
    "/incidents/{incident_id}/response-actions",
    response_model=list[ResponseActionResponse],
)
def list_incident_response_actions_endpoint(
    incident_id: int,
    db: Session = Depends(get_db),
) -> list[ResponseActionResponse]:
    response_actions = list_incident_response_actions(db, incident_id)
    if response_actions is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    return response_actions


@router.put(
    "/response-actions/{response_action_id}",
    response_model=ResponseActionResponse,
)
def update_response_action_endpoint(
    response_action_id: int,
    payload: ResponseActionUpdate,
    db: Session = Depends(get_db),
) -> ResponseActionResponse:
    response_action = get_response_action(db, response_action_id)
    if response_action is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response action not found",
        )
    try:
        return update_response_action(db, response_action, payload)
    except IncidentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        ) from exc


@router.delete(
    "/response-actions/{response_action_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_response_action_endpoint(
    response_action_id: int,
    db: Session = Depends(get_db),
) -> Response:
    response_action = get_response_action(db, response_action_id)
    if response_action is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response action not found",
        )
    delete_response_action(db, response_action)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
