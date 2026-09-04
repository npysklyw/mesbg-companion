import assert from "node:assert/strict";
import test from "node:test";
import {
  createArmyEditSnapshot,
  discardArmyEdit,
  isArmyEditDirty,
  prepareArmyEditSave,
} from "./ArmyEditSession.ts";
import { JsonArmyRepository } from "./ArmyRepository.ts";

const saved = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Iron Hills",
  faction: "Good",
  heroes: [],
};

class MemoryStorage {
  files = new Map();
  async exists(filename) { return this.files.has(filename); }
  async read(filename) { return this.files.get(filename); }
  async write(filename, content) { this.files.set(filename, content); }
  async delete(filename) { this.files.delete(filename); }
}

test("a clean edit can exit without a warning", () => {
  const snapshot = createArmyEditSnapshot(saved);
  assert.equal(isArmyEditDirty(saved, saved.name, snapshot), false);
});

test("army or name changes make an existing edit dirty", () => {
  const snapshot = createArmyEditSnapshot(saved);
  assert.equal(isArmyEditDirty({ ...saved, points: 1 }, saved.name, snapshot), true);
  assert.equal(isArmyEditDirty(saved, "Renamed", snapshot), true);
});

test("discard restores the last explicitly saved copy", () => {
  const snapshot = createArmyEditSnapshot(saved);
  const restored = discardArmyEdit(snapshot);
  assert.deepEqual(restored, saved);
  assert.notEqual(restored, snapshot.army);
});

test("saving applies changes while preserving the saved UUID", () => {
  const snapshot = createArmyEditSnapshot(saved);
  const prepared = prepareArmyEditSave(
    { ...saved, id: "replacement", points: 250 },
    "Updated",
    snapshot,
  );
  assert.equal(prepared.id, saved.id);
  assert.equal(prepared.name, "Updated");
  assert.equal(prepared.points, 250);
});

test("working-copy edits persist only after an explicit repository save", async () => {
  const repository = new JsonArmyRepository(new MemoryStorage());
  const original = await repository.createOrUpdateArmy(saved);
  const snapshot = createArmyEditSnapshot(original);
  const workingCopy = { ...original, points: 250 };

  assert.equal((await repository.getSavedArmy(original.id)).points, undefined);
  const prepared = prepareArmyEditSave(workingCopy, "Updated", snapshot);
  await repository.createOrUpdateArmy(prepared);
  const persisted = await repository.getSavedArmy(original.id);
  assert.equal(persisted.id, original.id);
  assert.equal(persisted.name, "Updated");
  assert.equal(persisted.points, 250);
});
