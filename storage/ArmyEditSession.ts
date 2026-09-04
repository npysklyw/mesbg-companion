import type { PersistedArmy } from "./ArmyRepository.ts";

export type ArmyEditSnapshot = {
  army: PersistedArmy;
  editableName: string;
};

const cloneArmy = (army: PersistedArmy): PersistedArmy =>
  JSON.parse(JSON.stringify(army)) as PersistedArmy;

export function createArmyEditSnapshot(
  army: PersistedArmy,
  editableName = army.name,
): ArmyEditSnapshot {
  return { army: cloneArmy(army), editableName };
}

export function isArmyEditDirty(
  army: PersistedArmy,
  editableName: string,
  snapshot: ArmyEditSnapshot,
): boolean {
  return (
    editableName !== snapshot.editableName ||
    JSON.stringify(army) !== JSON.stringify(snapshot.army)
  );
}

export function discardArmyEdit(snapshot: ArmyEditSnapshot): PersistedArmy {
  return cloneArmy(snapshot.army);
}

export function prepareArmyEditSave(
  army: PersistedArmy,
  editableName: string,
  snapshot: ArmyEditSnapshot,
): PersistedArmy {
  return { ...army, id: snapshot.army.id, name: editableName };
}

