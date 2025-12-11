/**
 * URL Shortening tool - definition and handler
 */

import { shortenUrls } from '../api/index.mjs';

// Tool definition
export const definition = {
  name: 'shorten_links',
  description: 'Shorten one or more URLs using is.gd service. Accepts a single URL string or an array of URLs.',
  inputSchema: {
    type: 'object',
    properties: {
      urls: {
        oneOf: [
          {
            type: 'string',
            description: 'A single URL to shorten'
          },
          {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of URLs to shorten'
          }
        ],
        description: 'URL(s) to shorten - can be a single URL string or an array of URLs'
      }
    },
    required: ['urls']
  }
};

// Tool handler
export async function handler(args) {
  const { urls } = args;

  if (!urls) {
    throw new Error('urls parameter is required');
  }

  // Normalize to array
  const urlArray = Array.isArray(urls) ? urls : [urls];

  if (urlArray.length === 0) {
    throw new Error('At least one URL is required');
  }

  const results = await shortenUrls(urlArray);

  // Count successes and failures
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    success: true,
    total: results.length,
    successful,
    failed,
    results
  };
}

