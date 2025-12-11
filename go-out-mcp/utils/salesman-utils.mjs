/**
 * Shared utilities for salesman-related operations
 */

// Constants
export const TICKET_PRICE = 70;

/**
 * Transform user role from API to salesman object
 * @param {Object} user - User role from API
 * @returns {Object} Transformed salesman object
 */
export function transformUserRoleToSalesman(user) {
  return {
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
      totalRegistrations: (user.frees || 0) + (user.paid || 0),
      freeRegistrations: user.frees || 0,
      paidRegistrations: user.paid || 0,
      revenue: user.statistics?.credit || 0,
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
  };
}

/**
 * Transform tracking link from API to salesman-like object
 * @param {Object} link - Tracking link from API
 * @returns {Object} Transformed tracking link object
 */
export function transformTrackingLinkToSalesman(link) {
  const views = link.Views || link.views || 0;
  const freeRegistrations = link.frees || 0;
  const paidRegistrations = Math.floor((link.total_revenue || 0) / TICKET_PRICE);
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
    sold: link.sold || 0,
    hiddenRegistrations: Math.max(0, (link.sold || 0) - freeRegistrations - paidRegistrations)
  };
}

/**
 * Calculate summary statistics for a list of salesmen
 * @param {Array} salesmen - Array of salesman objects
 * @returns {Object} Summary statistics
 */
export function calculateSalesmanSummary(salesmen) {
  if (salesmen.length === 0) {
    return {
      totalSalesmen: 0,
      totalViews: 0,
      totalRegistrations: 0,
      totalFreeRegistrations: 0,
      totalPaidRegistrations: 0,
      totalRevenue: 0,
      topSalesman: null
    };
  }

  const top = salesmen.reduce((max, s) => 
    s.statistics.totalRegistrations > max.statistics.totalRegistrations ? s : max
  );

  return {
    totalSalesmen: salesmen.length,
    totalViews: salesmen.reduce((sum, s) => sum + s.statistics.views, 0),
    totalRegistrations: salesmen.reduce((sum, s) => sum + s.statistics.totalRegistrations, 0),
    totalFreeRegistrations: salesmen.reduce((sum, s) => sum + s.statistics.freeRegistrations, 0),
    totalPaidRegistrations: salesmen.reduce((sum, s) => sum + s.statistics.paidRegistrations, 0),
    totalRevenue: salesmen.reduce((sum, s) => sum + s.statistics.revenue, 0),
    topSalesman: {
      id: top.id,
      name: top.type === 'tracking_link' ? top.linkName : `${top.firstName} ${top.lastName}`,
      phoneNumber: top.phoneNumber || (top.referer?.phoneNumber || null),
      type: top.type,
      totalRegistrations: top.statistics.totalRegistrations
    }
  };
}

