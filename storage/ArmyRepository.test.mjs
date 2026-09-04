import assert from "node:assert/strict";
import test from "node:test";
import {
  JsonArmyRepository,
  SAVED_ARMIES_FILENAME,
  WORK_IN_PROGRESS_FILENAME,
} from "./ArmyRepository.ts";

class MemoryStorage {
  files = new Map();

  async exists(filename) {
    return this.files.has(filename);
  }

  async read(filename) {
    return this.files.get(filename);
  }

  async write(filename, content) {
    this.files.set(filename, content);
  }

  async delete(filename) {
    this.files.delete(filename);
  }
}

const army = (name) => ({ name, faction: "Good", heroes: [] });

test("lists no armies when the saved file is absent", async () => {
  const repository = new JsonArmyRepository(new MemoryStorage());
  assert.deepEqual(await repository.listSavedArmies(), []);
  assert.equal(await repository.getSavedArmy(0), null);
});

test("reads the legacy single-object saved format without rewriting it", async () => {
  const storage = new MemoryStorage();
  storage.files.set(SAVED_ARMIES_FILENAME, JSON.stringify(army("Solo")));
  const repository = new JsonArmyRepository(storage);
  assert.deepEqual(await repository.listSavedArmies(), [army("Solo")]);
  assert.equal(storage.files.get(SAVED_ARMIES_FILENAME)[0], "{");
});

test("creates and retrieves saved armies by index", async () => {
  const repository = new JsonArmyRepository(new MemoryStorage());
  assert.equal(await repository.createOrUpdateArmy(army("First")), 0);
  assert.equal(await repository.createOrUpdateArmy(army("Second")), 1);
  assert.deepEqual(await repository.getSavedArmy(1), army("Second"));
});

test("updates an existing army at the same index", async () => {
  const repository = new JsonArmyRepository(new MemoryStorage());
  await repository.createOrUpdateArmy(army("Before"));
  assert.equal(await repository.createOrUpdateArmy(army("After"), 0), 0);
  assert.deepEqual(await repository.listSavedArmies(), [army("After")]);
});

test("does not turn an invalid update index into a new army", async () => {
  const repository = new JsonArmyRepository(new MemoryStorage());
  await assert.rejects(
    repository.createOrUpdateArmy(army("Unexpected"), 4),
    RangeError,
  );
  assert.deepEqual(await repository.listSavedArmies(), []);
});

test("deleting preserves index order and removes an empty saved file", async () => {
  const storage = new MemoryStorage();
  const repository = new JsonArmyRepository(storage);
  await repository.createOrUpdateArmy(army("First"));
  await repository.createOrUpdateArmy(army("Second"));
  await repository.deleteSavedArmy(0);
  assert.deepEqual(await repository.listSavedArmies(), [army("Second")]);
  await repository.deleteSavedArmy(0);
  assert.equal(storage.files.has(SAVED_ARMIES_FILENAME), false);
});

test("loads, saves, and clears the work-in-progress army", async () => {
  const storage = new MemoryStorage();
  const repository = new JsonArmyRepository(storage);
  assert.equal(await repository.loadWorkInProgress(), null);
  await repository.saveWorkInProgress(army("Draft"));
  assert.deepEqual(await repository.loadWorkInProgress(), army("Draft"));
  assert.ok(storage.files.get(WORK_IN_PROGRESS_FILENAME).includes("Draft"));
  await repository.clearWorkInProgress();
  assert.equal(await repository.loadWorkInProgress(), null);
});
