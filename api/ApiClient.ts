export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export type FetchImplementation = typeof fetch;

export class ApiClient {
  private readonly baseUrl: string;
  private readonly fetchImplementation: FetchImplementation;

  constructor(
    baseUrl: string,
    fetchImplementation: FetchImplementation = fetch,
  ) {
    this.baseUrl = baseUrl;
    this.fetchImplementation = fetchImplementation;
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await this.fetchImplementation(
      `${this.baseUrl.replace(/\/$/, "")}${path}`,
      {
        ...init,
        headers: {
          Accept: "application/json",
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
      },
    );

    if (!response.ok) {
      let message = `API request failed (${response.status})`;
      try {
        const body = (await response.json()) as { detail?: string };
        if (body.detail) message = body.detail;
      } catch {
        // Keep the status-based fallback when the response is not JSON.
      }
      throw new ApiError(response.status, message);
    }

    return (await response.json()) as T;
  }
}

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

export const apiClient = configuredApiUrl
  ? new ApiClient(configuredApiUrl)
  : null;
