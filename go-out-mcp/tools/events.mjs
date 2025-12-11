/**
 * Events tool - definition and handler
 */

import { fetchEvents } from '../api/index.mjs';
import { config } from '../config/config.mjs';
import { fetchAllEventsWithPagination, transformEvent } from '../utils/event-utils.mjs';

// Tool definition
export const definition = {
  name: 'get_events',
  description: 'Get a list of events from Go-Out with their statistics. Supports pagination for large datasets.',
  inputSchema: {
    type: 'object',
    properties: {
      isActive: {
        type: 'boolean',
        description: 'true = active events, false = past events. Default: true'
      },
      search: {
        type: 'string',
        description: 'Search filter for event titles'
      },
      limit: {
        type: 'number',
        description: 'Maximum events to return. Default: 20'
      },
      skip: {
        type: 'number',
        description: 'Pagination offset - number of events to skip. Default: 0'
      }
    }
  }
};

// Tool handler
export async function handler(args) {
  const { isActive = true, search = '', limit = 20, skip = 0 } = args;

  // Fetch all events with pagination using shared utility
  const { events: rawEvents, hasMore } = await fetchAllEventsWithPagination(
    fetchEvents,
    { isActive, search, limit, skip },
    config
  );

  // Transform events to clean format using shared utility
  const events = rawEvents.map(transformEvent);

  return {
    success: true,
    count: events.length,
    skip,
    limit,
    hasMore,
    events
  };
}
