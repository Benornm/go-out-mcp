/**
 * Shared validation utilities
 */

/**
 * Validate that required parameters are present
 * @param {Object} params - Parameters object
 * @param {string[]} required - Array of required parameter names
 * @throws {Error} If any required parameter is missing
 */
export function validateRequired(params, required) {
  for (const param of required) {
    if (!params[param]) {
      throw new Error(`${param} is required`);
    }
  }
}

