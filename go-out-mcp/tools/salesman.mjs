/**
 * Salesman statistics tool - definition and handler
 * 
 * Uses the getEventUserRoles endpoint to get salesman statistics
 */

import { fetchEventUserRoles, fetchTrackingLinks } from '../api/index.mjs';
import { validateRequired } from '../utils/validation.mjs';

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
    fetchTrackingLinks({ eventId }).catch(() => ({ status: false, Links: [] })) // Gracefully handle errors
  ]);

  // Transform salesmen from user roles
  const salesmen = [];
  
  if (userRolesResponse.status && userRolesResponse.users) {
    const transformedSalesmen = userRolesResponse.users.map(user => ({
      type: 'salesman',
      id: user._id,
      userId: user.user_id,
      phoneNumber: user.user_phone_number,
      firstName: user.user_first_name || user.first_name,
      lastName: user.user_last_name || user.last_name,
      email: user.email,
      role: {
        english: user.role_english,
        hebrew: user.role_hebrew
      },
      statistics: {
        totalRegistrations: (user.frees || 0) + (user.paid || 0), // סה"כ הרשמות (חינם + בתשלום)
        freeRegistrations: user.frees || 0, // הרשמות בחינם
        paidRegistrations: user.paid || 0, // הרשמות בתשלום
        revenue: user.statistics?.credit || 0, // סכום מהכרטיסים שהם paid
        views: user.Views || user.views || 0
      },
      link: user.link,
      joiningDate: user.joining_date,
      addedBy: user.added_by ? {
        firstName: user.added_by.first_name,
        lastName: user.added_by.last_name,
        phoneNumber: user.added_by.phone_number
      } : null,
      teamleaderRef: user.teamleader_ref || null,
      disabled: user.disabled || false,
      permissions: user.permissions || {}
    }));
    
    salesmen.push(...transformedSalesmen);
  }

  // Transform tracking links (treat them as salesmen)
  if (trackingLinksResponse.status && trackingLinksResponse.Links) {
    const TICKET_PRICE = 70; // מחיר כרטיס
    
    const transformedTrackingLinks = trackingLinksResponse.Links.map(link => {
      const views = link.Views || link.views || 0;
      const freeRegistrations = link.frees || 0;
      const paidRegistrations = Math.floor((link.total_revenue || 0) / TICKET_PRICE); // מחלקים ב-70
      const totalRegistrations = freeRegistrations + paidRegistrations;
      const revenue = link.total_revenue || 0;
      
      return {
        type: 'tracking_link',
        id: link.link,
        linkName: link.link_name,
        link: link.link,
        activeLink: link.active_link,
        referer: link.referer ? {
          firstName: link.referer.ref_first_name,
          lastName: link.referer.ref_last_name,
          phoneNumber: link.referer.ref_phone_number
        } : null,
        statistics: {
          totalRegistrations,
          freeRegistrations,
          paidRegistrations,
          revenue,
          views
        },
        sold: link.sold || 0, // כולל חינם + בתשלום + מוסתרים
        hiddenRegistrations: Math.max(0, (link.sold || 0) - freeRegistrations - paidRegistrations) // sold פחות frees פחות paid
      };
    });
    
    salesmen.push(...transformedTrackingLinks);
  }

  // Calculate summary statistics (including both salesmen and tracking links)
  const summary = {
    totalSalesmen: salesmen.length,
    totalViews: salesmen.reduce((sum, s) => sum + s.statistics.views, 0),
    totalRegistrations: salesmen.reduce((sum, s) => sum + s.statistics.totalRegistrations, 0), // סה"כ הרשמות (חינם + בתשלום)
    totalFreeRegistrations: salesmen.reduce((sum, s) => sum + s.statistics.freeRegistrations, 0),
    totalPaidRegistrations: salesmen.reduce((sum, s) => sum + s.statistics.paidRegistrations, 0),
    totalRevenue: salesmen.reduce((sum, s) => sum + s.statistics.revenue, 0), // סה"כ הכנסות מכרטיסים
    topSalesman: salesmen.length > 0 ? (() => {
      const top = salesmen.reduce((max, s) => 
        s.statistics.totalRegistrations > max.statistics.totalRegistrations ? s : max
      );
      return {
        id: top.id,
        name: top.type === 'tracking_link' ? top.linkName : `${top.firstName} ${top.lastName}`,
        phoneNumber: top.phoneNumber || (top.referer?.phoneNumber || null),
        type: top.type,
        totalRegistrations: top.statistics.totalRegistrations
      };
    })() : null
  };

  // Sort by total registrations (free + paid) descending
  salesmen.sort((a, b) => b.statistics.totalRegistrations - a.statistics.totalRegistrations);

  return {
    success: true,
    eventId,
    salesmen,
    summary
  };
}
