import * as FileSystem from "expo-file-system/legacy";
import type { ArmyFileStorage } from "./ArmyRepository";
import { JsonActiveGameRepository } from "./ActiveGameRepository";

const storage: ArmyFileStorage = {
  async exists(filename) {
    return (await FileSystem.getInfoAsync(FileSystem.documentDirectory + filename))
      .exists;
  },
  async read(filename) {
    return FileSystem.readAsStringAsync(FileSystem.documentDirectory + filename);
  },
  async write(filename, content) {
    await FileSystem.writeAsStringAsync(
      FileSystem.documentDirectory + filename,
      content,
    );
  },
  async delete(filename) {
    await FileSystem.deleteAsync(FileSystem.documentDirectory + filename, {
      idempotent: true,
    });
  },
};

export const localActiveGameRepository = new JsonActiveGameRepository(storage);

