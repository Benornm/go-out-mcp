/**
 * Participants by salesman tool - definition and handler
 * 
 * Filters participants by a specific salesman/referrer phone number
 * Uses the same flattening logic as get_event_participants
 */

import { fetchParticipants } from '../api/index.mjs';

// Tool definition
export const definition = {
  name: 'get_participants_by_salesman',
  description: 'Get participants filtered by a specific salesman/referrer. Returns a flattened list where each participant (including companions) is a separate entry. Includes detailed statistics: total registrations, accepted, hidden, and hidden percentage relative to accepted. Filters by salesman phone number.',
  inputSchema: {
    type: 'object',
    properties: {
      eventId: {
        type: 'string',
        description: 'Event ID (required)'
      },
      salesmanId: {
        type: 'string',
        description: 'Salesman/referrer phone number or identifier (required)'
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
    required: ['eventId', 'salesmanId']
  }
};

/**
 * Flatten order into individual participants (primary + companions)
 * Same logic as in participants.mjs
 * @param {Object} order - Raw order from API
 * @returns {Array} Array of flattened participant entries
 */
function flattenOrder(order) {
  const participants = [];
  
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
    referrer: order.has_ref ? {
      id: order.ref,
      firstName: order.ref_first_name,
      lastName: order.ref_last_name
    } : null
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
  const { eventId, salesmanId, status = 'All', includeHidden = true, limit = 50, skip = 0 } = args;

  if (!eventId) {
    throw new Error('eventId is required');
  }

  if (!salesmanId) {
    throw new Error('salesmanId is required');
  }

  let allOrders = [];

  // If status is "All" and includeHidden is true, make 2 API calls
  if (status === 'All' && includeHidden) {
    const [regular, hidden] = await Promise.all([
      fetchParticipants({ eventId, status: 'All', limit: 1000, skip: 0, userOnly: false, hidden: false }),
      fetchParticipants({ eventId, status: 'Hidden', limit: 1000, skip: 0, userOnly: false, hidden: true })
    ]);

    allOrders = [...(regular || []), ...(hidden || [])];
  } 
  // If status is "Hidden", fetch only hidden
  else if (status === 'Hidden') {
    allOrders = await fetchParticipants({
      eventId,
      status: 'Hidden',
      limit: 1000,
      skip: 0,
      userOnly: false,
      hidden: true
    }) || [];
  }
  // Otherwise fetch with the specified status
  else {
    allOrders = await fetchParticipants({
      eventId,
      status,
      limit: 1000,
      skip: 0,
      userOnly: false,
      hidden: false
    }) || [];
  }

  // Filter orders by salesman phone number (ref field)
  const filteredOrders = allOrders.filter(order => {
    if (!order.has_ref || !order.ref) {
      return false;
    }
    // Normalize phone numbers for comparison (remove spaces, dashes, etc.)
    const normalizePhone = (phone) => phone.replace(/[\s\-\(\)]/g, '');
    return normalizePhone(order.ref) === normalizePhone(salesmanId);
  });

  // Flatten all filtered orders into individual participants
  const participants = filteredOrders.flatMap(flattenOrder);

  // Extract salesman info from first order (if available)
  const firstOrder = filteredOrders[0];
  const salesmanInfo = firstOrder && firstOrder.has_ref ? {
    id: firstOrder.ref,
    firstName: firstOrder.ref_first_name || null,
    lastName: firstOrder.ref_last_name || null,
    phoneNumber: firstOrder.ref
  } : null;

  // Calculate statistics
  const statistics = {
    totalRegistrations: participants.length,
    accepted: participants.filter(p => p.status === 'Accepted').length,
    pending: participants.filter(p => p.status === 'Pending').length,
    rejected: participants.filter(p => p.status === 'Rejected').length,
    hidden: participants.filter(p => p.hidden === true || p.status === 'Hidden').length
  };

  // Calculate hidden percentage relative to accepted
  const hiddenPercentage = statistics.accepted > 0 
    ? ((statistics.hidden / statistics.accepted) * 100).toFixed(2)
    : '0.00';

  // Apply pagination to flattened participants
  const paginatedParticipants = participants.slice(skip, skip + limit);

  return {
    success: true,
    eventId,
    salesman: salesmanInfo,
    statistics: {
      totalRegistrations: statistics.totalRegistrations,
      accepted: statistics.accepted,
      hidden: statistics.hidden,
      hiddenPercentage: `${hiddenPercentage}%`,
      // Additional details
      pending: statistics.pending,
      rejected: statistics.rejected
    },
    orderCount: filteredOrders.length,
    totalCount: participants.length,
    count: paginatedParticipants.length,
    skip,
    limit,
    status: status === 'All' && includeHidden ? 'All (including hidden)' : status,
    participants: paginatedParticipants
  };
}

