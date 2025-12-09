/**
 * Statistics tool - definition and handler
 */

import { fetchTicketStatistics } from '../api/index.mjs';

// Tool definition
export const definition = {
  name: 'get_event_statistics',
  description: 'Get ticket statistics for an event.',
  inputSchema: {
    type: 'object',
    properties: {
      eventId: {
        type: 'string',
        description: 'Event ID (required)'
      }
    },
    required: ['eventId']
  }
};

// Tool handler
export async function handler(args) {
  const { eventId } = args;

  if (!eventId) {
    throw new Error('eventId is required');
  }

  const stats = await fetchTicketStatistics(eventId);

  return {
    success: true,
    eventId,
    statistics: {
      accepted: stats.Accepted || 0,
      pending: stats.Pending || 0,
      rejected: stats.Rejected || 0,
      total: stats.Total || 0
    }
  };
}



