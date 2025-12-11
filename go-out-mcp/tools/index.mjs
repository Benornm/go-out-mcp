/**
 * Tool registry
 * Add new tools here to register them with the MCP server
 */

import * as events from './events.mjs';
import * as participants from './participants.mjs';
import * as statistics from './statistics.mjs';
import * as salesman from './salesman.mjs';
import * as participantsBySalesman from './participants-by-salesman.mjs';
import * as shorten from './shorten-links.mjs';

// All registered tools
const toolModules = [events, participants, statistics, salesman, participantsBySalesman, shorten];

// Export tool definitions for MCP
export const definitions = toolModules.map(t => t.definition);

// Map tool names to handlers
const handlers = Object.fromEntries(
  toolModules.map(t => [t.definition.name, t.handler])
);

/**
 * Execute a tool by name
 * @param {string} name - Tool name
 * @param {Object} args - Tool arguments
 * @returns {Promise<Object>} Tool result
 */
export async function executeTool(name, args) {
  const handler = handlers[name];
  
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  return handler(args || {});
}





