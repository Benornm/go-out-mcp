/**
 * Shared utilities for participant-related operations
 */

/**
 * Format Instagram link - if it's just a username, prepend the full URL
 * @param {string|null|undefined} instagramValue - Instagram link or username
 * @returns {string|null} Formatted Instagram URL or null
 */
export function formatInstagramLink(instagramValue) {
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
 * @returns {Object|null} Object with all dynamicFieldN entries or null
 */
export function extractDynamicFields(order) {
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
export function flattenOrder(order) {
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

/**
 * Normalize phone number for comparison (remove spaces, dashes, parentheses)
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone number
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)]/g, '');
}

/**
 * Fetch participants with proper handling of "All" status + hidden
 * @param {Function} fetchParticipants - The fetchParticipants API function
 * @param {Object} params - Parameters for fetching
 * @returns {Promise<Array>} Array of orders
 */
export async function fetchParticipantsWithHidden(fetchParticipants, { eventId, status = 'All', includeHidden = true, limit = 50, skip = 0 }) {
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

  return allOrders;
}

