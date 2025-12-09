/**
 * Base HTTP client for Go-Out API
 * Handles authentication and request/response
 */

import { config } from '../config/config.mjs';

/**
 * Get authorization headers
 */
function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.token}`
  };
}

/**
 * Make an HTTP request to the Go-Out API
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${config.baseUrl}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Go-Out API error (${response.status}): ${errorText}`);
  }

  return response.json();
}



