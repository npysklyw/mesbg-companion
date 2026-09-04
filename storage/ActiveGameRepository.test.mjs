import assert from "node:assert/strict";
import test from "node:test";
import {
  ACTIVE_GAME_FILENAME,
  JsonActiveGameRepository,
} from "./ActiveGameRepository.ts";

class MemoryStorage {
  files = new Map();
  async exists(filename) { return this.files.has(filename); }
  async read(filename) { return this.files.get(filename); }
  async write(filename, content) { this.files.set(filename, content); }
  async delete(filename) { this.files.delete(filename); }
}

test("active game survives repository reloads", async () => {
  const storage = new MemoryStorage();
  await new JsonActiveGameRepository(storage).save({
    savedArmyIdx: 2,
    resetToMax: false,
  });
  assert.deepEqual(await new JsonActiveGameRepository(storage).load(), {
    savedArmyIdx: 2,
    resetToMax: false,
  });
});

test("confirmed end clears active game without touching other files", async () => {
  const storage = new MemoryStorage();
  storage.files.set("saved-army.json", "saved army");
  const repository = new JsonActiveGameRepository(storage);
  await repository.save({ savedArmyIdx: 0, resetToMax: true });
  await repository.clear();
  assert.equal(await repository.load(), null);
  assert.equal(storage.files.get("saved-army.json"), "saved army");
});

test("an unconfirmed end leaves the active game unchanged", async () => {
  const storage = new MemoryStorage();
  storage.files.set(
    ACTIVE_GAME_FILENAME,
    JSON.stringify({ savedArmyIdx: 1, resetToMax: false }),
  );
  assert.deepEqual(await new JsonActiveGameRepository(storage).load(), {
    savedArmyIdx: 1,
    resetToMax: false,
  });
});

