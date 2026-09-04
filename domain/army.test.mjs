import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateArmyTotals,
  calculateBowCount,
  calculateBreakValue,
  calculateModelCount,
  calculateTierCapacity,
  calculateTotalPoints,
  calculateWarbandModelCount,
} from "./army.ts";

const warrior = (overrides = {}) => ({
  name: "Iron Hills Warrior",
  baseCost: 11,
  availableWargear: [{ name: "Mattock", cost: 0 }],
  wargearCounts: { Base: 0, Mattock: 0 },
  ...overrides,
});

const hero = (overrides = {}) => ({
  name: "Dain Ironfoot, Lord of the Iron Hills",
  points: 160,
  tier: "legend",
  wargear: [{ name: "War boar", cost: 25 }],
  wargearChecks: { "War boar": false },
  selected: false,
  warband: [warrior()],
  ...overrides,
});

const army = (heroes = []) => ({
  name: "The Iron Hills",
  faction: "Good",
  heroes,
});

test("empty army has zero totals", () => {
  assert.deepEqual(calculateArmyTotals(army()), {
    points: 0,
    modelCount: 0,
    bowCount: 0,
    breakValue: 0,
    bowAllowance: 0,
  });
});

test("only selected heroes contribute points and models", () => {
  const subject = army([hero(), hero({ name: "Selected", selected: true })]);
  assert.equal(calculateTotalPoints(subject), 160);
  assert.equal(calculateModelCount(subject), 1);
});

test("selected hero wargear contributes its cost", () => {
  const subject = army([
    hero({ selected: true, wargearChecks: { "War boar": true } }),
  ]);
  assert.equal(calculateTotalPoints(subject), 185);
});

test("base and upgraded warriors use the existing per-model pricing", () => {
  const subject = army([
    hero({
      selected: true,
      warband: [
        warrior({
          availableWargear: [{ name: "Crossbow", cost: 2 }],
          wargearCounts: { Base: 2, Crossbow: 3 },
        }),
      ],
    }),
  ]);
  assert.equal(calculateWarbandModelCount(subject.heroes[0].warband), 5);
  assert.equal(calculateTotalPoints(subject), 221);
});

test("multiple selected warbands are accumulated", () => {
  const subject = army([
    hero({ selected: true, warband: [warrior({ wargearCounts: { Base: 2 } })] }),
    hero({
      name: "Captain",
      points: 75,
      selected: true,
      warband: [warrior({ wargearCounts: { Base: 3 } })],
    }),
  ]);
  assert.equal(calculateModelCount(subject), 7);
  assert.equal(calculateTotalPoints(subject), 290);
});

test("bow count matches selected wargear names containing bow", () => {
  const subject = army([
    hero({
      selected: true,
      warband: [
        warrior({
          availableWargear: [
            { name: "Bow", cost: 1 },
            { name: "Crossbow", cost: 2 },
          ],
          wargearCounts: { Base: 1, Bow: 2, Crossbow: 3 },
        }),
      ],
    }),
    hero({ selected: false, warband: [warrior({ wargearCounts: { Bow: 9 } })] }),
  ]);
  assert.equal(calculateBowCount(subject), 5);
});

test("break value preserves the existing floor-half-plus-one calculation", () => {
  assert.equal(calculateBreakValue(0), 0);
  assert.equal(calculateBreakValue(6), 4);
  assert.equal(calculateBreakValue(7), 4);
});

test("tier capacities preserve all existing component values", () => {
  assert.deepEqual(
    ["legend", "valour", "fortitude", "minor", "independent"].map(
      calculateTierCapacity,
    ),
    [18, 15, 12, 6, 0],
  );
});

test("Iron Hills Dain scenario preserves current totals", () => {
  const subject = army([
    hero({
      selected: true,
      wargearChecks: { "War boar": true },
      warband: [warrior({ wargearCounts: { Base: 0, Mattock: 1 } })],
    }),
  ]);
  assert.deepEqual(calculateArmyTotals(subject), {
    points: 196,
    modelCount: 2,
    bowCount: 0,
    breakValue: 2,
    bowAllowance: 0,
  });
});
