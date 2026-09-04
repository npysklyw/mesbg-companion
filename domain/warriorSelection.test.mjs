import assert from "node:assert/strict";
import test from "node:test";
import { getAvailableWarriorWargear } from "./warriorSelection.ts";

const choices = [
  ["Mattock", 1],
  ["Shield", 1],
  ["Crossbow", 2],
  ["Banner", 25],
];

test("selected wargear is hidden from available choices", () => {
  assert.deepEqual(
    getAvailableWarriorWargear(choices, { Mattock: 1 }),
    choices.slice(1),
  );
});

test("removing selected wargear restores the choice", () => {
  assert.deepEqual(
    getAvailableWarriorWargear(choices, { Mattock: 0 }),
    choices,
  );
});

test("selection filtering is generic and does not alter other choices", () => {
  assert.deepEqual(
    getAvailableWarriorWargear(choices, { Shield: 2, Banner: 1 }),
    [choices[0], choices[2]],
  );
});

