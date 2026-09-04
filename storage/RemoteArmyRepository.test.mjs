import assert from "node:assert/strict";
import test from "node:test";
import { ApiClient, ApiError } from "../api/ApiClient.ts";
import {
  RemoteArmyRepository,
  mapArmyToRequest,
  mapResponseToArmy,
} from "./RemoteArmyRepository.ts";

const armyId = "00000000-0000-4000-8000-000000000001";
const army = {
  id: armyId,
  name: "The Iron Hills",
  faction: "Good",
  heroes: [],
  points: 160,
  modelCount: 1,
};

const responseBody = (overrides = {}) => ({
  id: armyId,
  name: army.name,
  faction: army.faction,
  payload: army,
  schema_version: 1,
  revision: 1,
  created_at: "2026-09-04T12:00:00Z",
  updated_at: "2026-09-04T12:00:00Z",
  ...overrides,
});

const jsonResponse = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

test("maps complete armies to requests and responses without changing UUID", () => {
  assert.deepEqual(mapArmyToRequest(army), {
    id: armyId,
    name: army.name,
    faction: army.faction,
    payload: army,
    schema_version: 1,
  });
  assert.deepEqual(mapResponseToArmy(responseBody()), army);
});

test("creates a missing remote army using the client UUID", async () => {
  const calls = [];
  const client = new ApiClient("http://api.test", async (url, init) => {
    calls.push({ url, init });
    return calls.length === 1
      ? jsonResponse({ detail: "Army not found" }, 404)
      : jsonResponse(responseBody(), 201);
  });

  const result = await new RemoteArmyRepository(client).createOrUpdateArmy(army);
  assert.equal(result.id, armyId);
  assert.equal(calls[0].url, `http://api.test/api/v1/armies/${armyId}`);
  assert.equal(calls[1].init.method, "POST");
  assert.equal(JSON.parse(calls[1].init.body).id, armyId);
});

test("updates an existing remote army and preserves its UUID", async () => {
  const calls = [];
  const client = new ApiClient("http://api.test/", async (url, init) => {
    calls.push({ url, init });
    return jsonResponse(responseBody({ revision: calls.length }));
  });

  const result = await new RemoteArmyRepository(client).createOrUpdateArmy(army);
  assert.equal(result.id, armyId);
  assert.equal(calls[1].init.method, "PUT");
  assert.equal(calls[1].url, `http://api.test/api/v1/armies/${armyId}`);
  assert.equal(JSON.parse(calls[1].init.body).id, undefined);
});

test("surfaces API failures without mutating the local army", async () => {
  const original = structuredClone(army);
  const client = new ApiClient("http://api.test", async () =>
    jsonResponse({ detail: "Database unavailable" }, 503),
  );

  await assert.rejects(
    () => new RemoteArmyRepository(client).createOrUpdateArmy(army),
    (error) => error instanceof ApiError && error.status === 503,
  );
  assert.deepEqual(army, original);
});

