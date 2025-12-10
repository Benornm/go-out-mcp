/**
 * Salesman/User Roles API module
 */

import { apiRequest } from './client.mjs';

/**
 * Fetch user roles (salesmen/managers) for an event
 * @param {Object} params
 * @param {string} params.eventId - Event ID (required)
 * @param {number} params.skipNum - Pagination offset (default: 0)
 * @param {string} params.search - Search filter (default: "")
 */
export async function fetchEventUserRoles({
  eventId,
  skipNum = 0,
  search = ''
}) {
  if (!eventId) {
    throw new Error('eventId is required');
  }

  return apiRequest('/getEventUserRoles?', {
    method: 'POST',
    body: JSON.stringify({ eventId, skipNum, search })
  });
}

/**
 * Fetch tracking links for an event
 * @param {Object} params
 * @param {string} params.eventId - Event ID (required)
 */
export async function fetchTrackingLinks({ eventId }) {
  if (!eventId) {
    throw new Error('eventId is required');
  }

  return apiRequest('/trackingLinks/getTrackingLinks?', {
    method: 'POST',
    body: JSON.stringify({ eventId })
  });
}


