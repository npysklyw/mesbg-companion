import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  auditCatalogueReachability,
  getSelectableCatalogueWarriors,
  resolveCatalogueArmy,
} from "./catalogue.ts";

const activeFiles = [
  ["Good", "../app/data/good/dwarves.json"],
  ["Good", "../app/data/good/elves.json"],
  ["Good", "../app/data/good/hobbits_and_the_shire.json"],
  ["Good", "../app/data/good/men_of_the_west.json"],
  ["Good", "../app/data/good/other_good.json"],
  ["Good", "../app/data/good/rohan.json"],
  ["Evil", "../app/data/evil/angmar_and_northern_evil.json"],
  ["Evil", "../app/data/evil/dol_guldur_and_mirkwood_evil.json"],
  ["Evil", "../app/data/evil/gundabad,_moria,_goblins,_and_orcs.json"],
  ["Evil", "../app/data/evil/harad,_umbar,_khand,_east.json"],
  ["Evil", "../app/data/evil/isengard_and_allies.json"],
  ["Evil", "../app/data/evil/mordor_and_sauron-aligned.json"],
  ["Evil", "../app/data/evil/shire_invaders.json"],
];

const sources = activeFiles.map(([side, relativeFile]) => ({
  side,
  file: relativeFile,
  armies: JSON.parse(
    fs.readFileSync(path.resolve(import.meta.dirname, relativeFile), "utf8"),
  ),
}));
const catalogues = sources.map((source) => source.armies);

test("Army of Dale exposes its established standard warrior profiles", () => {
  const army = resolveCatalogueArmy(catalogues, "The Army of Dale");
  const garrison = resolveCatalogueArmy(catalogues, "Garrison of Dale");
  assert.ok(army);
  assert.ok(garrison);
  assert.deepEqual(
    getSelectableCatalogueWarriors(army, false).map((warrior) => warrior.name),
    ["Warrior of Dale", "Knight of Dale"],
  );
  assert.deepEqual(
    army.warbandOptions.slice(0, 2),
    garrison.warbandOptions.slice(0, 2),
    "the restored profiles must remain exact copies of the existing Garrison of Dale records",
  );
});

test("an unknown army never falls back to an unrelated catalogue", () => {
  assert.equal(resolveCatalogueArmy(catalogues, "Not a real army"), undefined);
});

test("every active Good and Evil army resolves through the builder resolver", () => {
  for (const source of sources) {
    for (const army of source.armies) {
      assert.equal(resolveCatalogueArmy(catalogues, army.name), army);
    }
  }
});

test("every warrior is reachable or explicitly classified for review", () => {
  const result = auditCatalogueReachability(sources);
  assert.equal(result.errors.length, 0);
  const classified = new Set(
    result.warnings
      .filter((issue) => issue.profile)
      .map((issue) => `${issue.army}\0${issue.profile}`),
  );
  for (const source of sources) {
    for (const army of source.armies) {
      for (const warrior of army.warbandOptions) {
        const selectable = getSelectableCatalogueWarriors(army, false).includes(warrior);
        const hasLeader = army.heroes.some(
          (hero) => !hero.legacy && hero.tier !== "independent",
        );
        assert.ok(selectable && hasLeader || classified.has(`${army.name}\0${warrior.name}`));
      }
    }
  }
});

test("new definite resolution failures make the reachability audit fail", () => {
  const duplicate = sources[0].armies[0];
  const result = auditCatalogueReachability([
    ...sources,
    { side: "Good", file: "introduced.json", armies: [duplicate] },
  ]);
  assert.ok(result.errors.some((issue) => issue.code === "ARMY_UNRESOLVABLE"));
  assert.ok(result.counts.failures > 0);
});
