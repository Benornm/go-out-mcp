/**
 * Events API module
 */

import { apiRequest } from './client.mjs';

/**
 * Fetch events from Go-Out API
 * @param {Object} params
 * @param {boolean} params.isActive - Fetch active events (default: true)
 * @param {string} params.search - Search filter
 * @param {number} params.skip - Pagination offset
 */
export async function fetchEvents({ isActive = true, search = '', skip = 0 } = {}) {
  return apiRequest('/events/getMyEvents?', {
    method: 'POST',
    body: JSON.stringify({
      skip,
      search,
      status: isActive,
      currentDate: new Date().toISOString()
    })
  });
}



