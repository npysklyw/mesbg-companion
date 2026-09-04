import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  compareSourceManifest,
  mergeManifestOverrides,
  normalizeArmyName,
  parseCompositionPage,
} from "./sourceManifest.ts";

const compositionFixture = `
THE TEST HOST
ARMY COMPOSITION
HEROES OF LEGEND
• THE KING ................................ 110 POINTS
HEROES OF VALOUR
• THE PRINCE .............................. 100 POINTS
WARRIORS
• CITY WARRIOR .............................. 7 POINTS
  • Banner .................................. 25 points
• CITY KNIGHT .............................. 11 POINTS
ADDITIONAL RULES
An Test Host Army must always contain The King, who is always the Army's General.
SPECIAL RULES
Full prose is outside the manifest.
`;

test("parses representative composition headings and base profiles", () => {
  const entry = parseCompositionPage({ text: compositionFixture, bookId: "fixture", pdfPage: 12 });
  assert.ok(entry);
  assert.equal(entry.armyName, "THE TEST HOST");
  assert.deepEqual(entry.heroes.map(({ name, tier, points }) => ({ name, tier, points })), [
    { name: "THE KING", tier: "legend", points: 110 },
    { name: "THE PRINCE", tier: "valour", points: 100 },
  ]);
  assert.deepEqual(entry.warriors.map(({ name, points }) => ({ name, points })), [
    { name: "CITY WARRIOR", points: 7 },
    { name: "CITY KNIGHT", points: 11 },
  ]);
});

test("marks OCR-damaged point values for review instead of guessing", () => {
  const entry = parseCompositionPage({
    text: "DAMAGED HOST\nARMY COMPOSITION\nHEROES OF VALOUR\nBARD .... I0O POINTS",
    bookId: "fixture",
    pdfPage: 13,
  });
  assert.ok(entry);
  assert.equal(entry.heroes[0].points, null);
  assert.equal(entry.heroes[0].confidence, "needsReview");
  assert.equal(entry.confidence, "needsReview");
});

test("manual overrides replace generated entries without being mutated", () => {
  const generatedEntry = parseCompositionPage({ text: compositionFixture, bookId: "fixture", pdfPage: 12 });
  const override = { ...generatedEntry, armyName: "Reviewed Host", confidence: "verified" };
  const merged = mergeManifestOverrides(
    { schemaVersion: 1, generatedAt: "now", entries: [generatedEntry] },
    [override],
  );
  assert.equal(merged.entries[0].armyName, "Reviewed Host");
  assert.equal(generatedEntry.armyName, "THE TEST HOST");
});

test("comparison reports missing profiles, points, and tiers", () => {
  const entry = parseCompositionPage({ text: compositionFixture, bookId: "fixture", pdfPage: 12 });
  const manifest = { schemaVersion: 1, generatedAt: "now", entries: [entry] };
  const sources = [{
    side: "Good",
    file: "fixture.json",
    armies: [{
      name: "The Test Host",
      faction: "The Test Host",
      heroes: [
        { name: "THE KING", points: 99, tier: "valour", wargear: [], wounds: 1, might: 1, will: 1, fate: 1 },
        { name: "EXTRA CAPTAIN", points: 40, tier: "fortitude", wargear: [], wounds: 1, might: 1, will: 1, fate: 1 },
      ],
      warbandOptions: [{ name: "CITY KNIGHT", baseCost: 12, availableWargear: [] }],
    }],
  }];
  const categories = compareSourceManifest(manifest, sources).map((item) => item.category);
  for (const category of ["missingHero", "extraHero", "missingWarrior", "pointMismatch", "tierMismatch"]) {
    assert.ok(categories.includes(category), category);
  }
});

test("army-name normalization handles punctuation, spacing, and leading The", () => {
  assert.equal(normalizeArmyName("  The Army-of Dale! "), normalizeArmyName("Army of Dale"));
});

test("Army of Dale verified override contains the seeded source facts", () => {
  const overrides = JSON.parse(
    fs.readFileSync(path.resolve(import.meta.dirname, "../source-manifest/overrides.json"), "utf8"),
  );
  const dale = overrides.entries.find((entry) => entry.armyName === "The Army of Dale");
  assert.ok(dale);
  assert.equal(dale.confidence, "verified");
  assert.deepEqual(dale.heroes.map(({ name, points, tier }) => ({ name, points, tier })), [
    { name: "Brand, King of Dale", points: 110, tier: "legend" },
    { name: "Bard II, Prince of Dale", points: 100, tier: "valour" },
    { name: "Captain of Dale", points: 55, tier: "fortitude" },
  ]);
  assert.deepEqual(dale.warriors.map(({ name, points }) => ({ name, points })), [
    { name: "Warrior of Dale", points: 7 },
    { name: "Knight of Dale", points: 11 },
    { name: "Windlance", points: 70 },
  ]);
  assert.deepEqual(dale.constructionRules.map((rule) => rule.code), [
    "MANDATORY_PROFILE",
    "MUST_BE_GENERAL",
  ]);
});
