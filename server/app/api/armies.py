import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories import ArmyRepository
from app.schemas import ArmyResponse, ArmyWrite
from app.services import ArmyService

router = APIRouter(prefix="/armies", tags=["armies"])


def get_service(session: Session = Depends(get_db)) -> ArmyService:
    return ArmyService(ArmyRepository(session))


@router.get("", response_model=list[ArmyResponse])
def list_armies(service: ArmyService = Depends(get_service)) -> list[ArmyResponse]:
    return service.list_armies()


@router.get("/{army_id}", response_model=ArmyResponse)
def get_army(army_id: uuid.UUID, service: ArmyService = Depends(get_service)) -> ArmyResponse:
    return service.get_army(army_id)


@router.post("", response_model=ArmyResponse, status_code=status.HTTP_201_CREATED)
def create_army(data: ArmyWrite, service: ArmyService = Depends(get_service)) -> ArmyResponse:
    return service.create_army(data)


@router.put("/{army_id}", response_model=ArmyResponse)
def update_army(
    army_id: uuid.UUID,
    data: ArmyWrite,
    service: ArmyService = Depends(get_service),
) -> ArmyResponse:
    return service.update_army(army_id, data)


@router.delete("/{army_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_army(
    army_id: uuid.UUID,
    service: ArmyService = Depends(get_service),
) -> Response:
    service.delete_army(army_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
