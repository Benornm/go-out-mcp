/**
 * Events tool - definition and handler
 */

import { fetchEvents } from '../api/index.mjs';
import { config } from '../config/config.mjs';

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

  const allEvents = [];
  let currentSkip = skip;
  let hasMore = true;

  // Fetch events until we have enough or no more available
  while (allEvents.length < limit && hasMore && currentSkip < config.defaults.maxEventsToFetch + skip) {
    const response = await fetchEvents({ isActive, search, skip: currentSkip });
    const events = response.events || [];

    if (events.length === 0) {
      hasMore = false;
      break;
    }

    allEvents.push(...events);
    currentSkip += config.defaults.eventsPageSize;

    // If we got fewer events than the page size, we've reached the end
    if (events.length < config.defaults.eventsPageSize) {
      hasMore = false;
    }
  }

  // Trim to requested limit
  const trimmedEvents = allEvents.slice(0, limit);

  // Check if there are more events after this batch
  const moreAvailable = hasMore || allEvents.length > limit;

  // Transform to clean format
  const events = trimmedEvents.map(e => ({
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

  return {
    success: true,
    count: events.length,
    skip,
    limit,
    hasMore: moreAvailable,
    events
  };
}
