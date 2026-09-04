import { ApiClient, ApiError, apiClient } from "../api/ApiClient.ts";
import type { PersistedArmy } from "./ArmyRepository";

export type ArmyWriteRequest = {
  id?: string;
  name: string;
  faction: string;
  payload: PersistedArmy;
  schema_version: number;
};

export type ArmyResponse = {
  id: string;
  name: string;
  faction: string;
  payload: PersistedArmy;
  schema_version: number;
  revision: number;
  created_at: string;
  updated_at: string;
};

export function mapArmyToRequest(army: PersistedArmy): ArmyWriteRequest {
  return {
    id: army.id,
    name: army.name,
    faction: army.faction,
    payload: army,
    schema_version: 1,
  };
}

export function mapResponseToArmy(response: ArmyResponse): PersistedArmy {
  return {
    ...response.payload,
    id: response.id,
    name: response.name,
    faction: response.faction,
  };
}

export class RemoteArmyRepository {
  private readonly client: ApiClient;

  constructor(client: ApiClient) {
    this.client = client;
  }

  async createOrUpdateArmy(army: PersistedArmy): Promise<PersistedArmy> {
    const request = mapArmyToRequest(army);

    try {
      await this.client.request<ArmyResponse>(`/api/v1/armies/${army.id}`);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 404) throw error;
      const created = await this.client.request<ArmyResponse>("/api/v1/armies", {
        method: "POST",
        body: JSON.stringify(request),
      });
      return mapResponseToArmy(created);
    }

    const { id: _id, ...updateRequest } = request;
    const updated = await this.client.request<ArmyResponse>(
      `/api/v1/armies/${army.id}`,
      {
        method: "PUT",
        body: JSON.stringify(updateRequest),
      },
    );
    return mapResponseToArmy(updated);
  }
}

export const remoteArmyRepository = apiClient
  ? new RemoteArmyRepository(apiClient)
  : null;
