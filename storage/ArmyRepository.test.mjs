import assert from "node:assert/strict";
import test from "node:test";
import {
  JsonArmyRepository,
  SAVED_ARMIES_FILENAME,
  WORK_IN_PROGRESS_FILENAME,
} from "./ArmyRepository.ts";

class MemoryStorage {
  files = new Map();
  writes = [];

  async exists(filename) { return this.files.has(filename); }
  async read(filename) { return this.files.get(filename); }
  async write(filename, content) {
    this.files.set(filename, content);
    this.writes.push({ filename, content });
  }
  async delete(filename) { this.files.delete(filename); }
}

const ids = [
  "00000000-0000-4000-8000-000000000001",
  "00000000-0000-4000-8000-000000000002",
  "00000000-0000-4000-8000-000000000003",
];
const idFactory = () => {
  let index = 0;
  return () => ids[index++];
};
const army = (name, id) => ({
  ...(id ? { id } : {}),
  name,
  faction: "Good",
  heroes: [],
});

test("creating an army assigns and preserves one UUID", async () => {
  const repository = new JsonArmyRepository(new MemoryStorage(), idFactory());
  const created = await repository.createOrUpdateArmy(army("First"));
  assert.match(created.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
  const updated = await repository.createOrUpdateArmy({ ...created, name: "Updated" });
  assert.equal(updated.id, created.id);
  assert.deepEqual(await repository.listSavedArmies(), [updated]);
});

test("legacy armies receive unique IDs and persist in order", async () => {
  const storage = new MemoryStorage();
  storage.files.set(SAVED_ARMIES_FILENAME, JSON.stringify([army("First"), army("Second")]));
  const repository = new JsonArmyRepository(storage, idFactory());
  const migrated = await repository.listSavedArmies();
  assert.deepEqual(migrated.map(({ name }) => name), ["First", "Second"]);
  assert.deepEqual(migrated.map(({ id }) => id), ids.slice(0, 2));
  assert.deepEqual(JSON.parse(storage.files.get(SAVED_ARMIES_FILENAME)), migrated);
  assert.equal(storage.writes.length, 1);
});

test("legacy single-object format is identified and normalized", async () => {
  const storage = new MemoryStorage();
  storage.files.set(SAVED_ARMIES_FILENAME, JSON.stringify(army("Solo")));
  const repository = new JsonArmyRepository(storage, idFactory());
  const migrated = await repository.listSavedArmies();
  assert.equal(migrated[0].id, ids[0]);
  assert.ok(Array.isArray(JSON.parse(storage.files.get(SAVED_ARMIES_FILENAME))));
});

test("retrieves, updates, and deletes by UUID without reordering", async () => {
  const repository = new JsonArmyRepository(new MemoryStorage(), idFactory());
  const first = await repository.createOrUpdateArmy(army("First"));
  const second = await repository.createOrUpdateArmy(army("Second"));
  const third = await repository.createOrUpdateArmy(army("Third"));
  assert.deepEqual((await repository.listSavedArmies()).map(({ id }) => id), [first.id, second.id, third.id]);
  assert.equal((await repository.getSavedArmy(second.id)).name, "Second");
  await repository.createOrUpdateArmy({ ...second, name: "Updated second" });
  assert.deepEqual((await repository.listSavedArmies()).map(({ name }) => name), ["First", "Updated second", "Third"]);
  await repository.deleteSavedArmy(second.id);
  assert.deepEqual((await repository.listSavedArmies()).map(({ name }) => name), ["First", "Third"]);
});

test("missing UUID lookup and deletion are harmless", async () => {
  const repository = new JsonArmyRepository(new MemoryStorage(), idFactory());
  const created = await repository.createOrUpdateArmy(army("First"));
  assert.equal(await repository.getSavedArmy(ids[2]), null);
  await repository.deleteSavedArmy(ids[2]);
  assert.deepEqual(await repository.listSavedArmies(), [created]);
});

test("deleting the final army removes the saved file", async () => {
  const storage = new MemoryStorage();
  const repository = new JsonArmyRepository(storage, idFactory());
  const created = await repository.createOrUpdateArmy(army("First"));
  await repository.deleteSavedArmy(created.id);
  assert.equal(storage.files.has(SAVED_ARMIES_FILENAME), false);
});

test("draft identity is assigned, migrated, and preserved", async () => {
  const storage = new MemoryStorage();
  const repository = new JsonArmyRepository(storage, idFactory());
  const firstSave = await repository.saveWorkInProgress(army("Draft"));
  const secondSave = await repository.saveWorkInProgress(army("Draft"));
  assert.equal(secondSave.id, firstSave.id);
  assert.equal((await repository.loadWorkInProgress()).id, firstSave.id);
  storage.files.set(WORK_IN_PROGRESS_FILENAME, JSON.stringify(army("Legacy draft")));
  const migrated = await repository.loadWorkInProgress();
  assert.equal(migrated.id, ids[1]);
  assert.equal(JSON.parse(storage.files.get(WORK_IN_PROGRESS_FILENAME)).id, ids[1]);
  await repository.clearWorkInProgress();
  assert.equal(await repository.loadWorkInProgress(), null);
});

test("saving a draft as a new army reuses the draft UUID", async () => {
  const repository = new JsonArmyRepository(new MemoryStorage(), idFactory());
  const draft = await repository.saveWorkInProgress(army("Draft"));
  const saved = await repository.createOrUpdateArmy(army("Draft"));
  assert.equal(saved.id, draft.id);
});
