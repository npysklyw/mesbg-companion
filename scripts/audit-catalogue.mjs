import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditCatalogueReachability } from "../domain/catalogue.ts";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const activeFiles = [
  "app/data/good/dwarves.json",
  "app/data/good/elves.json",
  "app/data/good/hobbits_and_the_shire.json",
  "app/data/good/men_of_the_west.json",
  "app/data/good/other_good.json",
  "app/data/good/rohan.json",
  "app/data/evil/angmar_and_northern_evil.json",
  "app/data/evil/dol_guldur_and_mirkwood_evil.json",
  "app/data/evil/gundabad,_moria,_goblins,_and_orcs.json",
  "app/data/evil/harad,_umbar,_khand,_east.json",
  "app/data/evil/isengard_and_allies.json",
  "app/data/evil/mordor_and_sauron-aligned.json",
  "app/data/evil/shire_invaders.json",
];
const supportedTiers = new Set(["legend", "valour", "fortitude", "independent"]);
const errors = [];
const warnings = [];
const occurrences = {
  army: new Map(),
  hero: new Map(),
  warrior: new Map(),
};
const counts = { files: 0, armies: 0, heroes: 0, warriors: 0 };
const activeSources = [];
const identifiers = new Map();
const optionalFields = { legacy: 0, mustBeLeader: 0 };
const requirementCounts = { mandatory: 0, mustBeGeneral: 0 };
const warningCounts = { zeroCostWarriors: 0, reusedHeroes: 0, reusedWarriors: 0 };

const describe = (file, army, profile) =>
  [file, army && `army "${army}"`, profile].filter(Boolean).join(" > ");
const addOccurrence = (kind, name, location) => {
  const entries = occurrences[kind].get(name) ?? [];
  entries.push(location);
  occurrences[kind].set(name, entries);
};
const addIdentifier = (id, location) => {
  if (id === undefined) return;
  if (typeof id !== "string" || id.trim() === "") {
    errors.push(`${location}.id must be a non-empty string when present`);
    return;
  }
  const previous = identifiers.get(id);
  if (previous) errors.push(`duplicate catalogue id "${id}" at ${previous} and ${location}`);
  else identifiers.set(id, location);
};
const requireObject = (value, location) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${location} must be an object`);
    return false;
  }
  return true;
};
const requireString = (value, field, location) => {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${location}.${field} must be a non-empty string`);
    return false;
  }
  return true;
};
const requireNumber = (value, field, location, { positive = false } = {}) => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    (positive ? value <= 0 : value < 0)
  ) {
    errors.push(
      `${location}.${field} must be a ${positive ? "positive" : "non-negative"} finite number`,
    );
  }
};
const requireUniqueNames = (items, kind, location) => {
  const seen = new Set();
  for (const item of items) {
    if (typeof item?.name !== "string") continue;
    if (seen.has(item.name)) {
      errors.push(`${location} contains duplicate ${kind} name "${item.name}"`);
    }
    seen.add(item.name);
  }
};
const auditWargear = (wargear, location) => {
  if (!Array.isArray(wargear)) {
    errors.push(`${location}.wargear must be an array`);
    return;
  }
  requireUniqueNames(wargear, "wargear", location);
  wargear.forEach((item, index) => {
    const itemLocation = `${location}.wargear[${index}]`;
    if (!requireObject(item, itemLocation)) return;
    requireString(item.name, "name", itemLocation);
    requireNumber(item.cost, "cost", itemLocation);
  });
};

for (const relativeFile of activeFiles) {
  const absoluteFile = path.join(repositoryRoot, relativeFile);
  let catalogue;
  try {
    catalogue = JSON.parse(fs.readFileSync(absoluteFile, "utf8"));
  } catch (error) {
    errors.push(`${relativeFile} is not readable JSON: ${error.message}`);
    continue;
  }
  counts.files += 1;
  if (!Array.isArray(catalogue)) {
    errors.push(`${relativeFile} must contain an array of armies`);
    continue;
  }
  activeSources.push({
    side: relativeFile.includes("/good/") ? "Good" : "Evil",
    file: relativeFile,
    armies: catalogue,
  });

  for (const [armyIndex, army] of catalogue.entries()) {
    const armyLocation = `${relativeFile}[${armyIndex}]`;
    if (!requireObject(army, armyLocation)) continue;
    counts.armies += 1;
    const hasArmyName = requireString(army.name, "name", armyLocation);
    addIdentifier(army.id, armyLocation);
    requireString(army.faction, "faction", armyLocation);
    if (hasArmyName) addOccurrence("army", army.name, relativeFile);
    if (!Array.isArray(army.heroes)) {
      errors.push(`${armyLocation}.heroes must be an array`);
      continue;
    }
    if (!Array.isArray(army.warbandOptions)) {
      errors.push(`${armyLocation}.warbandOptions must be an array`);
      continue;
    }
    requireUniqueNames(army.heroes, "hero", describe(relativeFile, army.name));
    requireUniqueNames(
      army.warbandOptions,
      "warrior",
      describe(relativeFile, army.name),
    );

    for (const [heroIndex, hero] of army.heroes.entries()) {
      const heroLocation = `${armyLocation}.heroes[${heroIndex}]`;
      if (!requireObject(hero, heroLocation)) continue;
      addIdentifier(hero.id, heroLocation);
      counts.heroes += 1;
      const hasHeroName = requireString(hero.name, "name", heroLocation);
      if (hasHeroName) {
        addOccurrence("hero", hero.name, describe(relativeFile, army.name));
      }
      for (const field of ["points", "wounds", "might", "will", "fate"]) {
        requireNumber(hero[field], field, heroLocation);
      }
      if (!supportedTiers.has(hero.tier)) {
        errors.push(`${heroLocation}.tier has unsupported value ${JSON.stringify(hero.tier)}`);
      }
      for (const field of ["legacy", "mustBeLeader"]) {
        if (hero[field] === undefined) {
          optionalFields[field] += 1;
        } else if (typeof hero[field] !== "boolean") {
          errors.push(`${heroLocation}.${field} must be boolean when present`);
        }
      }
      for (const field of ["mandatory", "mustBeGeneral"]) {
        if (hero[field] !== undefined && typeof hero[field] !== "boolean") {
          errors.push(`${heroLocation}.${field} must be boolean when present`);
        }
        if (hero[field] === true) requirementCounts[field] += 1;
      }
      auditWargear(hero.wargear, heroLocation);
    }

    for (const [warriorIndex, warrior] of army.warbandOptions.entries()) {
      const warriorLocation = `${armyLocation}.warbandOptions[${warriorIndex}]`;
      if (!requireObject(warrior, warriorLocation)) continue;
      addIdentifier(warrior.id, warriorLocation);
      counts.warriors += 1;
      const hasWarriorName = requireString(warrior.name, "name", warriorLocation);
      if (hasWarriorName) {
        addOccurrence("warrior", warrior.name, describe(relativeFile, army.name));
      }
      requireNumber(warrior.baseCost, "baseCost", warriorLocation);
      if (warrior.baseCost === 0) {
        warningCounts.zeroCostWarriors += 1;
        warnings.push(
          `zero-cost warrior "${warrior.name}" in army "${army.name}" needs domain review`,
        );
      }
      if (!Array.isArray(warrior.availableWargear)) {
        errors.push(`${warriorLocation}.availableWargear must be an array`);
      } else {
        requireUniqueNames(
          warrior.availableWargear,
          "wargear",
          warriorLocation,
        );
        warrior.availableWargear.forEach((item, index) => {
          const itemLocation = `${warriorLocation}.availableWargear[${index}]`;
          if (!requireObject(item, itemLocation)) return;
          requireString(item.name, "name", itemLocation);
          requireNumber(item.cost, "cost", itemLocation);
        });
      }
      if (warrior.legacy !== undefined && typeof warrior.legacy !== "boolean") {
        errors.push(`${warriorLocation}.legacy must be boolean when present`);
      }
    }
  }
}

for (const [kind, names] of Object.entries(occurrences)) {
  for (const [name, locations] of names) {
    if (locations.length > 1) {
      const message = `${kind} name "${name}" is reused ${locations.length} times across catalogues`;
      if (kind === "army") errors.push(message);
      else {
        warnings.push(message);
        if (kind === "hero") warningCounts.reusedHeroes += 1;
        if (kind === "warrior") warningCounts.reusedWarriors += 1;
      }
    }
  }
}

for (const [field, missing] of Object.entries(optionalFields)) {
  if (missing > 0) {
    warnings.push(
      `${field} is absent from ${missing}/${counts.heroes} active hero entries; runtime defaults apply`,
    );
  }
}

const reachability = auditCatalogueReachability(activeSources);
errors.push(...reachability.errors.map((issue) => `[${issue.code}] ${issue.message}`));
warnings.push(
  ...reachability.warnings.map((issue) => `[${issue.code}] ${issue.message}`),
);
const reachabilityWarningCounts = Object.groupBy(
  reachability.warnings,
  (issue) => issue.code,
);

console.log(
  `Catalogue audit: ${counts.files} files, ${counts.armies} armies, ${counts.heroes} hero entries, ${counts.warriors} warrior entries`,
);
console.log(
  `Builder reachability: ${reachability.counts.goodArmies} Good armies, ${reachability.counts.evilArmies} Evil armies, ${reachability.counts.heroes} heroes, ${reachability.counts.warriors} warriors, ${reachability.counts.failures} failures`,
);
console.log(
  `Reachability review: ${Object.entries(reachabilityWarningCounts)
    .map(([code, issues]) => `${code} ${issues.length}`)
    .join(", ") || "none"}`,
);
console.log("Profile references: 0 unresolved (active catalogues embed hero and warrior profiles).");
console.log(
  `Embedded requirements: ${requirementCounts.mandatory} mandatory profiles, ${requirementCounts.mustBeGeneral} required Generals`,
);
console.log(
  `Warning summary: ${warningCounts.zeroCostWarriors} zero-cost warriors, ${warningCounts.reusedHeroes} reused hero names, ${warningCounts.reusedWarriors} reused warrior names`,
);
console.log(
  `Optional flags absent: legacy ${optionalFields.legacy}/${counts.heroes}, mustBeLeader ${optionalFields.mustBeLeader}/${counts.heroes}`,
);
if (warnings.length > 0) {
  console.log(`Warnings (${warnings.length}):`);
  warnings.slice(0, 20).forEach((warning) => console.log(`  - ${warning}`));
  if (warnings.length > 20) console.log(`  - ... ${warnings.length - 20} more`);
}
if (errors.length > 0) {
  console.error(`Errors (${errors.length}):`);
  errors.forEach((error) => console.error(`  - ${error}`));
  process.exitCode = 1;
} else {
  console.log("No definite structural errors found.");
}
