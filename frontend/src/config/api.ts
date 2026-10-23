/**
 * Centralized API configuration for AgriHub+ Frontend.
 *
 * Supports production deployments where the backend is hosted externally (e.g. Render).
 * Uses VITE_API_BASE_URL when provided (e.g. https://agrihub-backend.onrender.com).
 * When empty or unset, returns clean relative paths ('/api/...'), preserving local Vite dev proxy.
 */

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '';

// Normalize base URL: strip any trailing slash
export const API_BASE_URL = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

/**
 * Returns the full URL for an API endpoint.
 *
 * Examples:
 *   apiUrl('/api/health')
 *     -> '/api/health' (when VITE_API_BASE_URL is empty)
 *     -> 'https://backend.onrender.com/api/health' (when VITE_API_BASE_URL is set)
 */
export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}
