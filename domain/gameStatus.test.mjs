import assert from "node:assert/strict";
import test from "node:test";
import { getArmyCondition } from "./gameStatus.ts";

test("army condition follows current model count in both directions", () => {
  assert.equal(getArmyCondition(20, 20), null);
  assert.equal(getArmyCondition(20, 10), null);
  assert.equal(getArmyCondition(20, 9), "broken");
  assert.equal(getArmyCondition(20, 5), "quartered");
  assert.equal(getArmyCondition(20, 6), "broken");
  assert.equal(getArmyCondition(20, 11), null);
});

