/**
 * Utility functions for handling CORS proxies in API requests
 */

// List of CORS proxies to try in order
export const CORS_PROXIES = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?'
];

/**
 * Fetch data from a URL using multiple CORS proxies with fallback
 * Will try each proxy in order until successful or all fail
 * 
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns The fetch response
 */
export const fetchWithCorsProxy = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Add origin header for CORS proxies
    const headers = {
        ...options.headers,
        'Origin': 'https://timekeepersmas.web.app'
    };
    
    // Clone options and add our headers
    const fetchOptions = {
        ...options,
        headers
    };
    
    // Try without proxy first (direct request)
    try {
        console.log(`Attempting direct fetch to: ${url}`);
        const response = await fetch(url, fetchOptions);
        if (response.ok) {
            console.log('Direct fetch successful');
            return response;
        }
        console.log(`Direct fetch failed with status: ${response.status}`);
    } catch (error) {
        console.log('Direct fetch failed:', error);
    }
    
    // Try each proxy in order until success
    let lastError: any = null;
    for (const proxy of CORS_PROXIES) {
        try {
            console.log(`Trying proxy: ${proxy}`);
            const proxyUrl = `${proxy}${url}`;
            const response = await fetch(proxyUrl, fetchOptions);
            
            if (response.ok) {
                console.log(`Proxy fetch successful using: ${proxy}`);
                return response;
            }
            
            console.log(`Proxy fetch failed with status: ${response.status} using: ${proxy}`);
            lastError = new Error(`Proxy ${proxy} returned status ${response.status}`);
        } catch (error) {
            console.log(`Proxy fetch error using ${proxy}:`, error);
            lastError = error;
        }
    }
    
    // If we get here, all proxies failed
    throw lastError || new Error('All CORS proxies failed');
}; 