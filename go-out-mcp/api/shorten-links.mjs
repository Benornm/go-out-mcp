/**
 * URL Shortening API module (is.gd)
 */

/**
 * Shorten a single URL using is.gd
 * @param {string} url - The URL to shorten
 * @returns {Promise<{shorturl: string, errorcode?: number, errormessage?: string}>}
 */
export async function shortenUrl(url) {
  if (!url) {
    throw new Error('URL is required');
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (e) {
    throw new Error(`Invalid URL format: ${url}`);
  }

  const apiUrl = new URL('https://is.gd/create.php');
  apiUrl.searchParams.set('format', 'json');
  apiUrl.searchParams.set('url', url);

  const response = await fetch(apiUrl.toString());

  if (!response.ok) {
    throw new Error(`is.gd API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errorcode) {
    throw new Error(`is.gd error: ${data.errormessage || `Error code ${data.errorcode}`}`);
  }

  return data;
}

/**
 * Shorten multiple URLs
 * @param {string[]} urls - Array of URLs to shorten
 * @returns {Promise<Array<{original: string, shorturl: string, error?: string}>>}
 */
export async function shortenUrls(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    throw new Error('urls must be a non-empty array');
  }

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const result = await shortenUrl(url);
        return {
          original: url,
          shorturl: result.shorturl,
          success: true
        };
      } catch (error) {
        return {
          original: url,
          shorturl: null,
          error: error.message,
          success: false
        };
      }
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        original: urls[index],
        shorturl: null,
        error: result.reason?.message || 'Unknown error',
        success: false
      };
    }
  });
}

