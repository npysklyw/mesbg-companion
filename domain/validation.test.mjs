import assert from "node:assert/strict";
import test from "node:test";
import {
  getHeroSelectionIssue,
  getWarriorAdditionIssue,
  isWarbandAtCapacity,
  validateArmy,
} from "./validation.ts";

const warrior = (count = 0, selection = "Base") => ({
  name: "Warrior",
  baseCost: 10,
  availableWargear: [{ name: selection, cost: 1 }],
  wargearCounts: { Base: 0, [selection]: count },
});

const hero = (overrides = {}) => ({
  name: "Captain",
  points: 50,
  tier: "fortitude",
  wargear: [],
  wargearChecks: {},
  selected: true,
  warband: [],
  ...overrides,
});

const army = (heroes) => ({ name: "Test Army", faction: "Good", heroes });

test("a valid army returns no issues", () => {
  assert.deepEqual(validateArmy(army([hero()])), {
    isValid: true,
    errors: [],
    warnings: [],
  });
});

test("exactly-at-capacity is valid and disables further additions", () => {
  const leader = hero({ warband: [warrior(12)] });
  const subject = army([leader]);
  assert.equal(validateArmy(subject).isValid, true);
  assert.equal(isWarbandAtCapacity(leader), true);
  assert.equal(
    getWarriorAdditionIssue(subject, leader, "Base")?.code,
    "WARBAND_CAPACITY_EXCEEDED",
  );
});

test("one-over-capacity is invalid", () => {
  const result = validateArmy(army([hero({ warband: [warrior(13)] })]));
  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].code, "WARBAND_CAPACITY_EXCEEDED");
});

test("an Independent Hero cannot lead warriors", () => {
  const result = validateArmy(
    army([hero({ tier: "independent", warband: [warrior(1)] })]),
  );
  assert.ok(
    result.errors.some(
      (issue) => issue.code === "INDEPENDENT_HERO_LEADING_WARBAND",
    ),
  );
});

test("duplicate selected Independent Heroes are invalid", () => {
  const first = hero({ name: "Wanderer", tier: "independent" });
  const second = hero({ name: "Wanderer", tier: "independent" });
  const subject = army([first, second]);
  assert.equal(
    validateArmy(subject).errors.at(-1).code,
    "INDEPENDENT_HERO_DUPLICATED",
  );
});

test("the selection helper blocks another matching Independent Hero", () => {
  const selected = hero({ name: "Wanderer", tier: "independent" });
  const candidate = hero({
    name: "Wanderer",
    tier: "independent",
    selected: false,
  });
  const subject = army([selected, candidate]);
  assert.equal(
    getHeroSelectionIssue(subject, candidate)?.code,
    "INDEPENDENT_HERO_DUPLICATED",
  );
});

test("a selected mandatory leader cannot be removed", () => {
  const leader = hero({ mustBeLeader: true });
  assert.equal(
    getHeroSelectionIssue(army([leader]), leader)?.code,
    "MANDATORY_LEADER_CANNOT_BE_REMOVED",
  );
});

test("exactly at the bow limit is valid", () => {
  const subject = army([
    hero({ warband: [warrior(1, "Bow"), warrior(1, "Spear")] }),
  ]);
  assert.equal(validateArmy(subject).isValid, true);
});

test("one over the bow limit is invalid", () => {
  const subject = army([hero({ warband: [warrior(2, "Bow")] })]);
  const result = validateArmy(subject);
  assert.equal(result.isValid, false);
  assert.ok(
    result.errors.some((issue) => issue.code === "BOW_LIMIT_EXCEEDED"),
  );
});

test("bow addition helper preserves the current pre-addition boundary", () => {
  const leader = hero({ warband: [warrior(1, "Bow"), warrior(2, "Spear")] });
  const subject = army([leader]);
  assert.equal(
    getWarriorAdditionIssue(subject, leader, "Bow")?.code,
    "BOW_LIMIT_EXCEEDED",
  );
});
