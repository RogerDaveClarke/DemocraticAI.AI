import { API_URL } from '@/config/runtime';
import { auth } from '@/config/firebase';
/**
 * API Utility for secure API communications
 * Handles authentication, headers, and error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || API_URL;
const API_KEY = import.meta.env.VITE_API_KEY; // Set this in production

/**
 * Makes an authenticated API request
 * @param endpoint - API endpoint path
 * @param options - Fetch options
 * @returns Promise with response data
 */
export async function makeAPIRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const token = await auth.currentUser?.getIdToken(true);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  // Add API key for chat endpoints and monitoring endpoints in production
  if ((endpoint.startsWith('/api/chat') || endpoint.startsWith('/api/usage-stats') || endpoint.startsWith('/api/security-events')) && API_KEY) {
    headers.set('X-API-Key', API_KEY);
  }
  
  const requestOptions: RequestInit = {
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(url, requestOptions);
    
    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
    }
    
    // Handle authentication errors
    if (response.status === 401) {
      throw new Error('Authentication failed. Please sign in again.');
    }
    
    // Handle other HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
}

/**
 * Makes a GET request to the API
 * @param endpoint - API endpoint path
 * @returns Promise with parsed JSON response
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const response = await makeAPIRequest(endpoint, { method: 'GET' });
  return response.json();
}

/**
 * Makes a POST request to the API
 * @param endpoint - API endpoint path
 * @param data - Request body data
 * @returns Promise with parsed JSON response
 */
export async function apiPost<T = any>(endpoint: string, data: any): Promise<T> {
  const response = await makeAPIRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Makes a PUT request to the API
 * @param endpoint - API endpoint path
 * @param data - Request body data
 * @returns Promise with parsed JSON response
 */
export async function apiPut<T = any>(endpoint: string, data: any): Promise<T> {
  const response = await makeAPIRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Makes a DELETE request to the API
 * @param endpoint - API endpoint path
 * @returns Promise with parsed JSON response
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  const response = await makeAPIRequest(endpoint, { method: 'DELETE' });
  return response.json();
}

/**
 * Handles API errors with user-friendly messages
 * @param error - Error object from API request
 * @returns User-friendly error message
 */
export function handleAPIError(error: any): string {
  if (error.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Checks if the API is available
 * @returns Promise resolving to true if API is available
 */
export async function checkAPIHealth(): Promise<boolean> {
  try {
    await makeAPIRequest('/', { method: 'GET' });
    return true;
  } catch {
    return false;
  }
}
