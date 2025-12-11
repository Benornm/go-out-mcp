/**
 * Shared utilities for event-related operations
 */

/**
 * Transform event from API format to clean format
 * @param {Object} event - Raw event from API
 * @returns {Object} Transformed event object
 */
export function transformEvent(event) {
  return {
    id: event._id,
    title: event.Title,
    url: event.Url,
    address: event.Adress,
    startDate: event.StartingDate,
    endDate: event.EndingDate,
    statistics: {
      accepted: event.statistics?.Accepted || 0,
      pending: event.statistics?.Pending || 0,
      rejected: event.statistics?.Rejected || 0,
      hidden: event.statistics?.Hidden || 0
    }
  };
}

/**
 * Fetch all events with pagination until limit is reached
 * @param {Function} fetchEvents - The fetchEvents API function
 * @param {Object} params - Parameters for fetching
 * @param {Object} config - Configuration object with pagination settings
 * @returns {Promise<Array>} Array of events
 */
export async function fetchAllEventsWithPagination(fetchEvents, { isActive, search, limit, skip }, config) {
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

  return {
    events: allEvents.slice(0, limit),
    hasMore: hasMore || allEvents.length > limit
  };
}

