/**
 * Salesman statistics tool - definition and handler
 * 
 * Uses the getEventUserRoles endpoint to get salesman statistics
 */

import { fetchEventUserRoles, fetchTrackingLinks } from '../api/index.mjs';
import { validateRequired } from '../utils/validation.mjs';
import {
  transformUserRoleToSalesman,
  transformTrackingLinkToSalesman,
  calculateSalesmanSummary
} from '../utils/salesman-utils.mjs';

// Tool definition
export const definition = {
  name: 'get_salesman_statistics',
  description: 'Get detailed statistics for salesmen/managers for a specific event. Shows views, free registrations, paid registrations, and revenue statistics for each salesman.',
  inputSchema: {
    type: 'object',
    properties: {
      eventId: {
        type: 'string',
        description: 'Event ID (required)'
      },
      search: {
        type: 'string',
        description: 'Search filter for salesman names. Default: empty string'
      },
      skipNum: {
        type: 'number',
        description: 'Pagination offset. Default: 0'
      }
    },
    required: ['eventId']
  }
};

// Tool handler
export async function handler(args) {
  const { eventId, search = '', skipNum = 0 } = args;

  validateRequired(args, ['eventId']);

  // Fetch both user roles and tracking links in parallel
  const [userRolesResponse, trackingLinksResponse] = await Promise.all([
    fetchEventUserRoles({ eventId, skipNum, search }),
    fetchTrackingLinks({ eventId }).catch(() => ({ status: false, Links: [] }))
  ]);

  // Transform data using shared utilities
  const salesmen = [];
  
  if (userRolesResponse.status && userRolesResponse.users) {
    const transformedSalesmen = userRolesResponse.users.map(transformUserRoleToSalesman);
    salesmen.push(...transformedSalesmen);
  }

  if (trackingLinksResponse.status && trackingLinksResponse.Links) {
    const transformedTrackingLinks = trackingLinksResponse.Links.map(transformTrackingLinkToSalesman);
    salesmen.push(...transformedTrackingLinks);
  }

  // Calculate summary statistics using shared utility
  const summary = calculateSalesmanSummary(salesmen);

  // Sort by total registrations descending
  salesmen.sort((a, b) => b.statistics.totalRegistrations - a.statistics.totalRegistrations);

  return {
    success: true,
    eventId,
    salesmen,
    summary
  };
}
