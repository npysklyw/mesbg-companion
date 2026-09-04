import type { ArmyFileStorage } from "./ArmyRepository.ts";

export const ACTIVE_GAME_FILENAME = "active-game.json";

export type ActiveGame = {
  savedArmyIdx: number;
  resetToMax: boolean;
};

export class JsonActiveGameRepository {
  private readonly storage: ArmyFileStorage;

  constructor(storage: ArmyFileStorage) {
    this.storage = storage;
  }

  async load(): Promise<ActiveGame | null> {
    if (!(await this.storage.exists(ACTIVE_GAME_FILENAME))) return null;
    const parsed = JSON.parse(
      await this.storage.read(ACTIVE_GAME_FILENAME),
    ) as Partial<ActiveGame>;
    const savedArmyIdx = Number(parsed.savedArmyIdx);
    if (!Number.isInteger(savedArmyIdx) || savedArmyIdx < 0) return null;
    return { savedArmyIdx, resetToMax: parsed.resetToMax === true };
  }

  async save(game: ActiveGame): Promise<void> {
    await this.storage.write(
      ACTIVE_GAME_FILENAME,
      JSON.stringify(game, null, 2),
    );
  }

  async clear(): Promise<void> {
    await this.storage.delete(ACTIVE_GAME_FILENAME);
  }
}
