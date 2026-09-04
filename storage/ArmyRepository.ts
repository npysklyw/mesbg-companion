import type { Army, Hero } from "../domain/army";

export type PersistedHero = Hero & {
  might?: number;
  will?: number;
  fate?: number;
  wounds?: number;
  maxMight?: number;
  maxWill?: number;
  maxFate?: number;
  maxWounds?: number;
};

export type PersistedArmy = Omit<Army, "heroes"> & {
  heroes: PersistedHero[];
  points?: number;
  modelCount?: number;
};

export interface ArmyRepository {
  listSavedArmies(): Promise<PersistedArmy[]>;
  getSavedArmy(index: number): Promise<PersistedArmy | null>;
  createOrUpdateArmy(
    army: PersistedArmy,
    index?: number,
  ): Promise<number>;
  deleteSavedArmy(index: number): Promise<void>;
  loadWorkInProgress(): Promise<PersistedArmy | null>;
  saveWorkInProgress(army: PersistedArmy): Promise<void>;
  clearWorkInProgress(): Promise<void>;
}

export interface ArmyFileStorage {
  exists(filename: string): Promise<boolean>;
  read(filename: string): Promise<string>;
  write(filename: string, content: string): Promise<void>;
  delete(filename: string): Promise<void>;
}

export const SAVED_ARMIES_FILENAME = "saved-army.json";
export const WORK_IN_PROGRESS_FILENAME = "wip-army.json";

export class JsonArmyRepository implements ArmyRepository {
  private readonly storage: ArmyFileStorage;

  constructor(storage: ArmyFileStorage) {
    this.storage = storage;
  }

  async listSavedArmies(): Promise<PersistedArmy[]> {
    if (!(await this.storage.exists(SAVED_ARMIES_FILENAME))) return [];
    const parsed: unknown = JSON.parse(
      await this.storage.read(SAVED_ARMIES_FILENAME),
    );
    return (Array.isArray(parsed) ? parsed : [parsed]) as PersistedArmy[];
  }

  async getSavedArmy(index: number): Promise<PersistedArmy | null> {
    if (!Number.isInteger(index) || index < 0) return null;
    return (await this.listSavedArmies())[index] ?? null;
  }

  async createOrUpdateArmy(
    army: PersistedArmy,
    index?: number,
  ): Promise<number> {
    const armies = await this.listSavedArmies();
    if (index !== undefined && Number.isInteger(index) && armies[index]) {
      armies[index] = army;
      await this.writeSavedArmies(armies);
      return index;
    }

    if (index !== undefined) {
      throw new RangeError(`Saved army index ${index} does not exist.`);
    }

    armies.push(army);
    await this.writeSavedArmies(armies);
    return armies.length - 1;
  }

  async deleteSavedArmy(index: number): Promise<void> {
    const armies = await this.listSavedArmies();
    if (!Number.isInteger(index) || index < 0 || !armies[index]) return;
    armies.splice(index, 1);
    if (armies.length === 0) {
      await this.storage.delete(SAVED_ARMIES_FILENAME);
      return;
    }
    await this.writeSavedArmies(armies);
  }

  async loadWorkInProgress(): Promise<PersistedArmy | null> {
    if (!(await this.storage.exists(WORK_IN_PROGRESS_FILENAME))) return null;
    return JSON.parse(
      await this.storage.read(WORK_IN_PROGRESS_FILENAME),
    ) as PersistedArmy;
  }

  async saveWorkInProgress(army: PersistedArmy): Promise<void> {
    await this.storage.write(
      WORK_IN_PROGRESS_FILENAME,
      JSON.stringify(army, null, 2),
    );
  }

  async clearWorkInProgress(): Promise<void> {
    await this.storage.delete(WORK_IN_PROGRESS_FILENAME);
  }

  private async writeSavedArmies(armies: PersistedArmy[]): Promise<void> {
    await this.storage.write(
      SAVED_ARMIES_FILENAME,
      JSON.stringify(armies, null, 2),
    );
  }
}
