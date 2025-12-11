/**
 * Participants API module
 */

import { apiRequest } from './client.mjs';

/**
 * Fetch participants for an event
 * @param {Object} params
 * @param {string} params.eventId - Event ID (required)
 * @param {number} params.limit - Results per page
 * @param {number} params.skip - Pagination offset
 * @param {string} params.status - Status filter
 * @param {boolean} params.userOnly - Main users only
 * @param {boolean} params.hidden - Include hidden
 */
export async function fetchParticipants({
  eventId,
  limit = 50,
  skip = 0,
  status = 'All',
  userOnly = false,
  hidden = false
}) {
  if (!eventId) {
    throw new Error('eventId is required');
  }

  return apiRequest('/getEventParticipants/?', {
    method: 'POST',
    body: JSON.stringify({ eventId, limit, skip, status, userOnly, hidden })
  });
}








