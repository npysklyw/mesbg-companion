import uuid

from fastapi import HTTPException, status

from app.models import ArmyRecord
from app.repositories import ArmyRepository
from app.schemas import ArmyCreate, ArmyWrite


class ArmyService:
    def __init__(self, repository: ArmyRepository) -> None:
        self.repository = repository

    def list_armies(self) -> list[ArmyRecord]:
        return self.repository.list()

    def get_army(self, army_id: uuid.UUID) -> ArmyRecord:
        record = self.repository.get(army_id)
        if record is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Army not found")
        return record

    def create_army(self, data: ArmyCreate) -> ArmyRecord:
        if self.repository.get(data.id) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Army with this ID already exists",
            )
        return self.repository.create(data)

    def update_army(self, army_id: uuid.UUID, data: ArmyWrite) -> ArmyRecord:
        return self.repository.update(self.get_army(army_id), data)

    def delete_army(self, army_id: uuid.UUID) -> None:
        self.repository.delete(self.get_army(army_id))
