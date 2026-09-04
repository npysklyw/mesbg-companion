import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ArmyRecord
from app.schemas import ArmyCreate, ArmyWrite


class ArmyRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list(self) -> list[ArmyRecord]:
        statement = select(ArmyRecord).order_by(ArmyRecord.created_at, ArmyRecord.id)
        return list(self.session.scalars(statement))

    def get(self, army_id: uuid.UUID) -> ArmyRecord | None:
        return self.session.get(ArmyRecord, army_id)

    def create(self, data: ArmyCreate) -> ArmyRecord:
        record = ArmyRecord(
            id=data.id,
            name=data.name,
            faction=data.faction,
            payload=data.payload.model_dump(mode="json"),
            schema_version=data.schema_version,
        )
        self.session.add(record)
        self.session.commit()
        self.session.refresh(record)
        return record

    def update(self, record: ArmyRecord, data: ArmyWrite) -> ArmyRecord:
        record.name = data.name
        record.faction = data.faction
        record.payload = data.payload.model_dump(mode="json")
        record.schema_version = data.schema_version
        record.revision += 1
        self.session.commit()
        self.session.refresh(record)
        return record

    def delete(self, record: ArmyRecord) -> None:
        self.session.delete(record)
        self.session.commit()
