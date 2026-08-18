/**
 * RefreshManager — معطّل: لا cookie refresh بين subdomains.
 * الـ auth يعتمد على localStorage.token فقط.
 */
import { readAuthToken } from "../utils/authStorage";

export function refreshSession() {
  const token = readAuthToken();
  return Promise.resolve(token || null);
}

export function isRefreshing() {
  return false;
}

export function hasFreshAccessToken() {
  return Boolean(readAuthToken());
}
