/**
 * Statistics tool - definition and handler
 */

import { fetchParticipantStatistics } from '../api/index.mjs';
import { validateRequired } from '../utils/validation.mjs';

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

  validateRequired(args, ['eventId']);

  const stats = await fetchParticipantStatistics(eventId);

  return {
    success: true,
    eventId,
    statistics: {
      accepted: stats.Accepted || 0,
      pending: stats.Pending || 0,
      rejected: stats.Rejected || 0,
      hidden: stats.Hidden || 0,
      failed: stats.Failed || 0,
      total: (stats.Accepted || 0) + (stats.Pending || 0) + (stats.Rejected || 0) + (stats.Hidden || 0)
    }
  };
}
