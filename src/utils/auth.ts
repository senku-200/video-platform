export const API_BASE_URL = 'http://localhost:3000/api/v1';

// Get token from cookies
export const getAuthToken = (): string | null => {
  if (typeof document !== 'undefined') {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1].trim();
    }
  }
  return null;
};

// Add auth header to fetch options
export const addAuthHeader = (options: RequestInit = {}): RequestInit => {
  const token = getAuthToken();
  const baseHeaders = {
    'Accept': '*/*',
    'Content-Type': 'application/json',
    'Origin': 'http://localhost:3000',
  };

  if (!token) {
    return {
      ...options,
      credentials: 'include',
      headers: {
        ...baseHeaders,
        ...options.headers,
      },
    };
  }

  return {
    ...options,
    credentials: 'include',
    headers: {
      ...baseHeaders,
      ...options.headers,
      'Authorization': token,
    },
  };
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

// Custom fetch with authentication
export const authenticatedFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  let url: string;
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else if (endpoint.startsWith('/api/')) {
    url = `http://localhost:3000${endpoint}`;
  } else {
    url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  }
  const token = getAuthToken();
  
  console.log('Current token from cookie:', token);
  
  const authOptions = addAuthHeader({
    ...options,
    mode: 'cors',
  });
  
  console.log('Request URL:', url);
  console.log('Request headers:', authOptions.headers);
  
  const response = await fetch(url, authOptions);
  
  if (response.status === 401) {
    console.log('Unauthorized response received');
  }
  
  return response;
};

// Transform API URLs to include base URL
export const transformApiUrl = (url: string): string => {
  if (url.startsWith('http')) {
    return url;
  }
  // If the URL already starts with /api/, just prepend the host, not the API_BASE_URL
  if (url.startsWith('/api/')) {
    return `http://localhost:3000${url}`;
  }
  // Otherwise, add the base URL
  return `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
}; 