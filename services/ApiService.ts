import { authService } from './AuthService';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchWithAuth(url: string, options: any = {}) {
  const token = await authService.getToken();
  const headers = {
    ...options.headers,
    'X-Session-Token': token
  };
  return fetch(url, { ...options, headers });
}

export async function getAssets() {
  const url = `${API_BASE}/api/assets`;
  console.log('[API] Fetching assets from:', url);
  const res = await fetchWithAuth(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  console.log('[API] Assets received:', data.length);
  return data;
}

export async function saveAsset(asset: any) {
  const res = await fetchWithAuth(`${API_BASE}/api/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(asset)
  });
  if (!res.ok) throw new Error(`Failed to save asset: ${res.status}`);
  return res;
}

export async function deleteAsset(id: string) {
  const res = await fetchWithAuth(`${API_BASE}/api/assets/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete asset: ${res.status}`);
  return res;
}

export async function getEmployees() {
  const res = await fetchWithAuth(`${API_BASE}/api/employees`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function saveEmployee(emp: any) {
  const res = await fetchWithAuth(`${API_BASE}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emp)
  });
  if (!res.ok) throw new Error(`Failed to save employee: ${res.status}`);
  return res;
}

export async function deleteEmployee(id: string) {
  const res = await fetchWithAuth(`${API_BASE}/api/employees/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete employee: ${res.status}`);
  return res;
}

export async function getAssignments() {
  const res = await fetchWithAuth(`${API_BASE}/api/assignments`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function saveAssignment(a: any) {
  const res = await fetchWithAuth(`${API_BASE}/api/assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(a)
  });
  if (!res.ok) throw new Error(`Failed to save assignment: ${res.status}`);
  return res;
}

export async function getMaintenance() {
  const res = await fetchWithAuth(`${API_BASE}/api/maintenance`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function saveMaintenance(m: any) {
  const res = await fetchWithAuth(`${API_BASE}/api/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(m)
  });
  if (!res.ok) throw new Error(`Failed to save maintenance: ${res.status}`);
  return res;
}

export async function getRequests() {
  const res = await fetchWithAuth(`${API_BASE}/api/requests`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function saveRequest(r: any) {
  const res = await fetchWithAuth(`${API_BASE}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(r)
  });
  if (!res.ok) throw new Error(`Failed to save request: ${res.status}`);
  return res;
}

export async function getTicketMessages(requestId: string) {
  const res = await fetchWithAuth(`${API_BASE}/api/requests/${requestId}/messages`);
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  return res.json();
}

export async function sendTicketMessage(requestId: string, message: string) {
  const res = await fetchWithAuth(`${API_BASE}/api/requests/${requestId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
  return res.json();
}

export async function resetUserPassword(userId: string, password: string) {
  const res = await fetchWithAuth(`${API_BASE}/api/users/${userId}/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  if (!res.ok) throw new Error(`Failed to reset password: ${res.status}`);
  return res.json();
}
