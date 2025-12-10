/**
 * Participants tool - definition and handler
 * 
 * IMPORTANT: Go-Out API quirk - status "All" does NOT include hidden participants.
 * To get truly ALL participants, we must make 2 API calls and combine results.
 * 
 * Response is FLATTENED - each participant (primary + companions) is a separate entry.
 */

import { fetchParticipants } from '../api/index.mjs';

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

/**
 * Format Instagram link - if it's just a username, prepend the full URL
 * @param {string|null|undefined} instagramValue - Instagram link or username
 * @returns {string|null} Formatted Instagram URL or null
 */
function formatInstagramLink(instagramValue) {
  if (!instagramValue || instagramValue.trim() === '') {
    return null;
  }
  
  const trimmed = instagramValue.trim();
  
  // If it's already a full URL, return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Otherwise, treat it as a username and format it
  return `https://www.instagram.com/${trimmed}`;
}

/**
 * Extract all dynamic fields from order
 * @param {Object} order - Raw order from API
 * @returns {Object} Object with all dynamicFieldN entries
 */
function extractDynamicFields(order) {
  const dynamicFields = {};
  
  // Find all keys that match dynamicFieldN pattern
  for (const key in order) {
    if (key.startsWith('dynamicField')) {
      dynamicFields[key] = order[key];
    }
  }
  
  return Object.keys(dynamicFields).length > 0 ? dynamicFields : null;
}

/**
 * Flatten order into individual participants (primary + companions)
 * @param {Object} order - Raw order from API
 * @returns {Array} Array of flattened participant entries
 */
function flattenOrder(order) {
  const participants = [];
  
  // Extract dynamic fields (dynamicField0, dynamicField1, etc.)
  const dynamicFields = extractDynamicFields(order);
  
  // Shared fields that companions inherit from the order
  const sharedFields = {
    phoneNumber: order.phone_number,
    email: order.mail,
    birthdate: order.birthdate || null,
    gender: order.gender,
    age: order.age,
    status: order.status,
    hidden: order.hidden || false,
    orderDate: order.order_date,
    ticketName: order.ticket_name,
    ticketPrice: order.ticket_price,
    instagramLink: formatInstagramLink(order.instagram_link),
    facebookLink: order.facebook_link && order.facebook_link.trim() !== '' ? order.facebook_link.trim() : null,
    referrer: order.has_ref ? {
      id: order.ref,
      firstName: order.ref_first_name,
      lastName: order.ref_last_name
    } : null,
    dynamicFields  // Add all dynamic fields
  };

  // Primary participant
  participants.push({
    id: order._id,
    firstName: order.first_name,
    lastName: order.last_name,
    ...sharedFields,
    orderId: order._id,
    isCompanion: false
  });

  // Companions (inherit fields from primary order)
  const companions = order.meta || [];
  const primaryName = `${order.first_name} ${order.last_name}`;

  for (const companion of companions) {
    participants.push({
      id: companion._id,
      firstName: companion.first_name,
      lastName: companion.last_name,
      ...sharedFields,
      // Override gender if companion has their own
      gender: companion.gender || sharedFields.gender,
      orderId: order._id,
      isCompanion: true,
      primaryParticipantName: primaryName
    });
  }

  return participants;
}

// Tool handler
export async function handler(args) {
  const { eventId, status = 'All', includeHidden = true, limit = 50, skip = 0 } = args;

  if (!eventId) {
    throw new Error('eventId is required');
  }

  let allOrders = [];

  // If status is "All" and includeHidden is true, make 2 API calls
  if (status === 'All' && includeHidden) {
    const [regular, hidden] = await Promise.all([
      fetchParticipants({ eventId, status: 'All', limit, skip, userOnly: false, hidden: false }),
      fetchParticipants({ eventId, status: 'Hidden', limit, skip, userOnly: false, hidden: true })
    ]);

    allOrders = [...(regular || []), ...(hidden || [])];
  } 
  // If status is "Hidden", fetch only hidden
  else if (status === 'Hidden') {
    allOrders = await fetchParticipants({
      eventId,
      status: 'Hidden',
      limit,
      skip,
      userOnly: false,
      hidden: true
    }) || [];
  }
  // Otherwise fetch with the specified status
  else {
    allOrders = await fetchParticipants({
      eventId,
      status,
      limit,
      skip,
      userOnly: false,
      hidden: false
    }) || [];
  }

  // Flatten all orders into individual participants
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
