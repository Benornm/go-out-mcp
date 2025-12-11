/**
 * Participants by salesman tool - definition and handler
 * 
 * Filters participants by a specific salesman/referrer phone number
 * Uses shared utilities for flattening and phone normalization
 */

import { fetchParticipants } from '../api/index.mjs';
import { flattenOrder, fetchParticipantsWithHidden, normalizePhone } from '../utils/participants-utils.mjs';
import { validateRequired } from '../utils/validation.mjs';

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

// Tool handler
export async function handler(args) {
  const { eventId, salesmanId, status = 'All', includeHidden = true, limit = 50, skip = 0 } = args;

  validateRequired(args, ['eventId', 'salesmanId']);

  // Fetch all orders using shared utility (with higher limit for filtering)
  const allOrders = await fetchParticipantsWithHidden(fetchParticipants, {
    eventId,
    status,
    includeHidden,
    limit: 1000,
    skip: 0
  });

  // Filter orders by salesman phone number (ref field)
  const filteredOrders = allOrders.filter(order => {
    if (!order.has_ref || !order.ref) {
      return false;
    }
    return normalizePhone(order.ref) === normalizePhone(salesmanId);
  });

  // Flatten all filtered orders into individual participants using shared utility
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
