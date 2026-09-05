export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('eyevengers_admin_token');
  
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401 || response.status === 403) {
    // If we get an unauthorized response, clear the token and redirect to login
    localStorage.removeItem('eyevengers_admin_token');
    localStorage.removeItem('eyevengers_admin_auth');
    if (typeof window !== 'undefined') {
      window.location.href = '/admin';
    }
  }

  return response;
};
