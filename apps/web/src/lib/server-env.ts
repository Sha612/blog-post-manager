import "server-only";

const DEFAULT_API_URL = "http://localhost:4000/api";

export function getApiUrl(): string {
  return (process.env.API_URL ?? DEFAULT_API_URL).replace(/\/+$/, "");
}
