/**
 * Statistics API module
 */

import { apiRequest } from './client.mjs';

/**
 * Fetch ticket statistics for an event
 * @param {string} eventId - Event ID (required)
 */
export async function fetchTicketStatistics(eventId) {
  if (!eventId) {
    throw new Error('eventId is required');
  }

  return apiRequest('/getUserTicketStatistics/?', {
    method: 'POST',
    body: JSON.stringify({ eventId })
  });
}

/**
 * Fetch participant statistics for an event
 * @param {string} eventId - Event ID (required)
 */
export async function fetchParticipantStatistics(eventId) {
  if (!eventId) {
    throw new Error('eventId is required');
  }

  return apiRequest(`/getParticipantsStatistic/?eventId=${encodeURIComponent(eventId)}`, {
    method: 'GET'
  });
}

