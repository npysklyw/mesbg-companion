import uuid
from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class WargearSelection(BaseModel):
    name: str
    cost: int
    model_config = ConfigDict(extra="allow")


class WarriorPayload(BaseModel):
    name: str
    baseCost: int
    availableWargear: list[WargearSelection] = Field(default_factory=list)
    wargearCounts: dict[str, int] = Field(default_factory=dict)
    model_config = ConfigDict(extra="allow")


class HeroPayload(BaseModel):
    name: str
    points: int
    tier: Literal["legend", "valour", "fortitude", "minor", "independent"]
    selected: bool
    wargear: list[WargearSelection] = Field(default_factory=list)
    wargearChecks: dict[str, bool] = Field(default_factory=dict)
    warband: list[WarriorPayload] = Field(default_factory=list)
    model_config = ConfigDict(extra="allow")


class ArmyPayload(BaseModel):
    name: str
    faction: str
    heroes: list[HeroPayload]
    model_config = ConfigDict(extra="allow")


class ArmyWrite(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    faction: str = Field(min_length=1, max_length=200)
    payload: ArmyPayload
    schema_version: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def names_match_payload(self) -> "ArmyWrite":
        if self.payload.name != self.name or self.payload.faction != self.faction:
            raise ValueError("name and faction must match the complete army payload")
        return self


class ArmyResponse(BaseModel):
    id: uuid.UUID
    name: str
    faction: str
    payload: dict[str, Any]
    schema_version: int
    revision: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
