export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  let token = typeof window !== 'undefined' ? localStorage.getItem('eyevengers_admin_token') : null;
  const isAuth = typeof window !== 'undefined' ? localStorage.getItem('eyevengers_admin_auth') === 'true' : false;

  // Fallback dev/admin token if authenticated
  if (!token && isAuth) {
    token = 'eyevengers_admin_token';
  }

  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401) {
    console.warn('Admin unauthorized response for:', url);
  }

  return response;
};
