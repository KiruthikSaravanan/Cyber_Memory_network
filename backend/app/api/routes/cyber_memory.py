from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi import Query
from sqlalchemy.orm import Session

from ...database import get_db
from ...schemas.cyber_memory import (
    AttackTypeSearchResponse,
    CyberMemoryCreatedResponse,
    CyberMemoryResponse,
    CyberMemorySearchResponse,
    CyberMemoryUpdate,
)
from ...services.cyber_memory_service import (
    CyberMemoryAlreadyExistsError,
    IncidentNotClosedError,
    IncidentNotFoundError,
    create_from_incident,
    delete_cyber_memory,
    get_cyber_memory,
    get_incident_cyber_memory,
    list_cyber_memories,
    search_cyber_memories,
    search_cyber_memories_by_attack_type,
    update_cyber_memory,
)

router = APIRouter(prefix="/cyber-memory", tags=["cyber memory"])
incident_router = APIRouter(tags=["cyber memory"])


@router.post(
    "/from-incident/{incident_id}",
    response_model=CyberMemoryCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_from_incident_endpoint(
    incident_id: int,
    db: Session = Depends(get_db),
) -> CyberMemoryCreatedResponse:
    try:
        return create_from_incident(db, incident_id)
    except IncidentNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        ) from exc
    except IncidentNotClosedError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cyber Memory can only be created from a Closed incident",
        ) from exc
    except CyberMemoryAlreadyExistsError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cyber Memory already exists for this incident",
        ) from exc


@router.get("", response_model=list[CyberMemoryResponse])
def list_cyber_memories_endpoint(
    db: Session = Depends(get_db),
) -> list[CyberMemoryResponse]:
    return list_cyber_memories(db)


@router.get("/search", response_model=CyberMemorySearchResponse)
def search_cyber_memories_endpoint(
    keyword: str = Query(min_length=1),
    db: Session = Depends(get_db),
) -> CyberMemorySearchResponse:
    normalized_keyword = keyword.strip()
    if not normalized_keyword:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="keyword must not be empty or whitespace-only",
        )
    normalized_keyword = normalized_keyword.lower()
    results = search_cyber_memories(db, normalized_keyword)
    return CyberMemorySearchResponse(
        keyword=normalized_keyword,
        total_results=len(results),
        results=results,
    )


@router.get(
    "/search/attack-type/{attack_type}",
    response_model=AttackTypeSearchResponse,
)
def search_cyber_memories_by_attack_type_endpoint(
    attack_type: str,
    db: Session = Depends(get_db),
) -> AttackTypeSearchResponse:
    normalized_attack_type = attack_type.strip()
    if not normalized_attack_type:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="attack_type must not be empty or whitespace-only",
        )
    results = search_cyber_memories_by_attack_type(db, normalized_attack_type)
    return AttackTypeSearchResponse(
        attack_type=normalized_attack_type,
        total_results=len(results),
        results=results,
    )


@router.get("/{memory_id}", response_model=CyberMemoryResponse)
def get_cyber_memory_endpoint(
    memory_id: int,
    db: Session = Depends(get_db),
) -> CyberMemoryResponse:
    memory = get_cyber_memory(db, memory_id)
    if memory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cyber Memory not found",
        )
    return memory


@incident_router.get(
    "/incidents/{incident_id}/cyber-memory",
    response_model=CyberMemoryResponse,
)
def get_incident_cyber_memory_endpoint(
    incident_id: int,
    db: Session = Depends(get_db),
) -> CyberMemoryResponse:
    incident_exists, memory = get_incident_cyber_memory(db, incident_id)
    if not incident_exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incident not found",
        )
    if memory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cyber Memory not found for this incident",
        )
    return memory


@router.put("/{memory_id}", response_model=CyberMemoryResponse)
def update_cyber_memory_endpoint(
    memory_id: int,
    payload: CyberMemoryUpdate,
    db: Session = Depends(get_db),
) -> CyberMemoryResponse:
    memory = get_cyber_memory(db, memory_id)
    if memory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cyber Memory not found",
        )
    return update_cyber_memory(db, memory, payload)


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cyber_memory_endpoint(
    memory_id: int,
    db: Session = Depends(get_db),
) -> Response:
    memory = get_cyber_memory(db, memory_id)
    if memory is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cyber Memory not found",
        )
    delete_cyber_memory(db, memory)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
