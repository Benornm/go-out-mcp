/**
 * Events tool - definition and handler
 */

import { fetchEvents } from '../api/index.mjs';
import { config } from '../config/config.mjs';

// Tool definition
export const definition = {
  name: 'get_events',
  description: 'Get a list of events from Go-Out with their statistics.',
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
      }
    }
  }
};

// Tool handler
export async function handler(args) {
  const { isActive = true, search = '', limit = 20 } = args;

  const allEvents = [];
  let skip = 0;

  while (allEvents.length < limit && skip < config.defaults.maxEventsToFetch) {
    const response = await fetchEvents({ isActive, search, skip });
    const events = response.events || [];

    if (events.length === 0) break;

    allEvents.push(...events);
    skip += config.defaults.eventsPageSize;
  }

  // Transform to clean format
  const events = allEvents.slice(0, limit).map(e => ({
    id: e._id,
    title: e.Title,
    url: e.Url,
    address: e.Adress,
    startDate: e.StartingDate,
    endDate: e.EndingDate,
    statistics: {
      accepted: e.statistics?.Accepted || 0,
      pending: e.statistics?.Pending || 0,
      rejected: e.statistics?.Rejected || 0,
      hidden: e.statistics?.Hidden || 0
    }
  }));

  return { success: true, count: events.length, events };
}

