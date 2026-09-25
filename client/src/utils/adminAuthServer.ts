export function isValidAdminToken(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.split(' ')[1];
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
    
    // Check token expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return false;
    }
    
    // Check that email exists in payload
    if (payload.email) {
      return true;
    }
  } catch (e) {
    return false;
  }

  return false;
}
