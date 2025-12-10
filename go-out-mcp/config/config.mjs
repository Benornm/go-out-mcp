/**
 * Configuration module
 * All environment variables and constants in one place
 */

export const config = {
  // API Configuration
  baseUrl: process.env.GOOUT_BASE_URL || 'https://www.go-out.co/endOne',
  token: process.env.GOOUT_TOKEN,

  // Defaults
  defaults: {
    eventsPageSize: 5,
    participantsLimit: 50,
    maxEventsToFetch: 200
  },

  // Status values
  participantStatuses: ['All', 'Pending', 'Accepted', 'Rejected', 'Hidden']
};

/**
 * Validate required configuration
 * @throws {Error} If required config is missing
 */
export function validateConfig() {
  if (!config.token) {
    throw new Error('GOOUT_TOKEN environment variable is not set');
  }
}







