/**
 * Participants tool - definition and handler
 * 
 * IMPORTANT: Go-Out API quirk - status "All" does NOT include hidden participants.
 * To get truly ALL participants, we must make 2 API calls and combine results.
 * 
 * Response is FLATTENED - each participant (primary + companions) is a separate entry.
 */

import { fetchParticipants } from '../api/index.mjs';
import { flattenOrder, fetchParticipantsWithHidden } from '../utils/participants-utils.mjs';
import { validateRequired } from '../utils/validation.mjs';

// Tool definition
export const definition = {
  name: 'get_event_participants',
  description: 'Get participants for a specific event. Returns a FLATTENED list where each participant (including companions) is a separate entry. By default returns ALL participants including hidden.',
  inputSchema: {
    type: 'object',
    properties: {
      eventId: {
        type: 'string',
        description: 'Event ID (required)'
      },
      status: {
        type: 'string',
        enum: ['All', 'Pending', 'Accepted', 'Rejected', 'Hidden'],
        description: 'Filter by status. "All" includes hidden by default. Use specific status to filter.'
      },
      includeHidden: {
        type: 'boolean',
        description: 'When status is "All", also fetch hidden participants. Default: true'
      },
      limit: {
        type: 'number',
        description: 'Max results per page. Default: 50'
      },
      skip: {
        type: 'number',
        description: 'Pagination offset. Default: 0'
      }
    },
    required: ['eventId']
  }
};

// Tool handler
export async function handler(args) {
  const { eventId, status = 'All', includeHidden = true, limit = 50, skip = 0 } = args;

  validateRequired(args, ['eventId']);

  // Fetch all orders using shared utility
  const allOrders = await fetchParticipantsWithHidden(fetchParticipants, {
    eventId,
    status,
    includeHidden,
    limit,
    skip
  });

  // Flatten all orders into individual participants using shared utility
  const participants = allOrders.flatMap(flattenOrder);

  return {
    success: true,
    eventId,
    orderCount: allOrders.length,
    count: participants.length,
    skip,
    status: status === 'All' && includeHidden ? 'All (including hidden)' : status,
    participants
  };
}
