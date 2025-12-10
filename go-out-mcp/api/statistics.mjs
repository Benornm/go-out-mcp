/**
 * Statistics API module
 */

import { apiRequest } from './client.mjs';

/**
 * Fetch participant statistics for an event (includes Hidden count)
 * @param {string} eventId - Event ID (required)
 * @returns {Promise<Object>} Statistics with Accepted, Pending, Rejected, Hidden, Failed
 */
export async function fetchParticipantStatistics(eventId) {
  if (!eventId) {
    throw new Error('eventId is required');
  }

  return apiRequest(`/getParticipantsStatistic/?eventId=${encodeURIComponent(eventId)}`, {
    method: 'GET'
  });
}
