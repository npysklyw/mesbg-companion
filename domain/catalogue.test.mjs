import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  auditCatalogueReachability,
  getInitialCatalogueHeroRequirements,
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

test("Army of Dale exposes the source-listed profiles", () => {
  const army = resolveCatalogueArmy(catalogues, "The Army of Dale");
  assert.ok(army);
  assert.deepEqual(
    army.heroes.map((hero) => hero.name),
    ["Brand, King of Dale", "Bard II, Prince of Dale", "Captain of Dale"],
  );
  assert.deepEqual(
    army.heroes.slice(0, 2).map(({ name, points, tier, wargear, wounds, might, will, fate }) => ({
      name,
      points,
      tier,
      wargear: wargear.map((item) => item.name),
      wounds,
      might,
      will,
      fate,
    })),
    [
      {
        name: "Brand, King of Dale",
        points: 110,
        tier: "legend",
        wargear: ["Heavy armour", "Shield", "Hand weapon"],
        wounds: 3,
        might: 3,
        will: 3,
        fate: 1,
      },
      {
        name: "Bard II, Prince of Dale",
        points: 100,
        tier: "valour",
        wargear: ["Heavy armour", "Shield", "Spear", "Hand weapon"],
        wounds: 2,
        might: 3,
        will: 2,
        fate: 2,
      },
    ],
  );
  assert.deepEqual(
    getSelectableCatalogueWarriors(army, false).map(({ name, baseCost }) => ({
      name,
      baseCost,
    })),
    [
      { name: "Warrior of Dale", baseCost: 7 },
      { name: "Knight of Dale", baseCost: 11 },
      { name: "Windlance", baseCost: 70 },
    ],
  );
  assert.equal(army.heroes.some((hero) => hero.name === "Dale Siege Veteran"), false);
  assert.equal(army.warbandOptions.some((warrior) => warrior.name === "Dale Crew"), false);
});

test("Brand starts selected, mandatory, and assigned as General", () => {
  const army = resolveCatalogueArmy(catalogues, "The Army of Dale");
  const brand = army.heroes.find((hero) => hero.name === "Brand, King of Dale");
  assert.ok(brand);
  assert.deepEqual(getInitialCatalogueHeroRequirements(brand), {
    mandatory: true,
    mustBeGeneral: true,
    isGeneral: true,
    mustBeLeader: true,
    selected: true,
  });
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
