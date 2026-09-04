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
  id: string;
  heroes: PersistedHero[];
  points?: number;
  modelCount?: number;
};

export type PersistableArmy = Omit<PersistedArmy, "id"> & { id?: string };

export interface ArmyRepository {
  listSavedArmies(): Promise<PersistedArmy[]>;
  getSavedArmy(id: string): Promise<PersistedArmy | null>;
  createOrUpdateArmy(army: PersistableArmy): Promise<PersistedArmy>;
  deleteSavedArmy(id: string): Promise<void>;
  loadWorkInProgress(): Promise<PersistedArmy | null>;
  saveWorkInProgress(army: PersistableArmy): Promise<PersistedArmy>;
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
  private readonly createId: () => string;

  constructor(storage: ArmyFileStorage, createId: () => string = createUuid) {
    this.storage = storage;
    this.createId = createId;
  }

  async listSavedArmies(): Promise<PersistedArmy[]> {
    if (!(await this.storage.exists(SAVED_ARMIES_FILENAME))) return [];
    const parsed: unknown = JSON.parse(
      await this.storage.read(SAVED_ARMIES_FILENAME),
    );
    const armies = (Array.isArray(parsed) ? parsed : [parsed]) as PersistableArmy[];
    let migrated = false;
    const identifiedArmies = armies.map((army) => {
      if (army.id) return army as PersistedArmy;
      migrated = true;
      return { ...army, id: this.createId() };
    });
    if (migrated) await this.writeSavedArmies(identifiedArmies);
    return identifiedArmies;
  }

  async getSavedArmy(id: string): Promise<PersistedArmy | null> {
    return (await this.listSavedArmies()).find((army) => army.id === id) ?? null;
  }

  async createOrUpdateArmy(army: PersistableArmy): Promise<PersistedArmy> {
    const armies = await this.listSavedArmies();
    let id = army.id;
    if (!id) {
      const draft = await this.loadWorkInProgress();
      id =
        draft && draft.name === army.name && draft.faction === army.faction
          ? draft.id
          : this.createId();
    }
    const identifiedArmy: PersistedArmy = { ...army, id };
    const index = armies.findIndex((candidate) => candidate.id === id);
    if (index >= 0) {
      armies[index] = identifiedArmy;
      await this.writeSavedArmies(armies);
      return identifiedArmy;
    }

    armies.push(identifiedArmy);
    await this.writeSavedArmies(armies);
    return identifiedArmy;
  }

  async deleteSavedArmy(id: string): Promise<void> {
    const armies = await this.listSavedArmies();
    const index = armies.findIndex((army) => army.id === id);
    if (index < 0) return;
    armies.splice(index, 1);
    if (armies.length === 0) {
      await this.storage.delete(SAVED_ARMIES_FILENAME);
      return;
    }
    await this.writeSavedArmies(armies);
  }

  async loadWorkInProgress(): Promise<PersistedArmy | null> {
    if (!(await this.storage.exists(WORK_IN_PROGRESS_FILENAME))) return null;
    const parsed = JSON.parse(
      await this.storage.read(WORK_IN_PROGRESS_FILENAME),
    ) as PersistableArmy;
    if (parsed.id) return parsed as PersistedArmy;
    const migrated = { ...parsed, id: this.createId() };
    await this.writeWorkInProgress(migrated);
    return migrated;
  }

  async saveWorkInProgress(army: PersistableArmy): Promise<PersistedArmy> {
    let id = army.id;
    if (!id) {
      const existing = await this.loadWorkInProgress();
      id =
        existing &&
        existing.name === army.name &&
        existing.faction === army.faction
          ? existing.id
          : this.createId();
    }
    const identifiedArmy = { ...army, id };
    await this.writeWorkInProgress(identifiedArmy);
    return identifiedArmy;
  }

  private async writeWorkInProgress(army: PersistedArmy): Promise<void> {
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

function createUuid(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    },
  );
}
