import type { Meeting, Question } from '../types';

const API_BASE = '/api';

interface AuthResponse {
  authenticated: boolean;
  email?: string;
  country?: string;
}

interface ApiError {
  error: string;
}

function handleResponse<T>(res: globalThis.Response): Promise<T> {
  const contentType = res.headers.get('content-type');
  if (!res.ok) {
    if (contentType?.includes('application/json')) {
      return res.json().then((data: ApiError) => {
        throw new Error(data.error || 'Request failed');
      });
    }
    return res.text().then(text => {
      throw new Error(text || 'Request failed');
    });
  }
  if (contentType?.includes('application/json')) {
    return res.json();
  }
  return res.text().then(text => JSON.parse(text)) as Promise<T>;
}

export async function getAuthUser(): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
  return handleResponse<AuthResponse>(res);
}

export function logout(redirectUrl?: string): void {
  const url = redirectUrl
    ? `${API_BASE}/auth/logout?redirect_url=${encodeURIComponent(redirectUrl)}`
    : `${API_BASE}/auth/logout`;
  window.location.href = url;
}

export async function createMeeting(name: string, description: string): Promise<Meeting> {
  const res = await fetch(`${API_BASE}/meetings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ name, description }),
  });
  return handleResponse<Meeting>(res);
}

export async function getMeeting(meetingId: string): Promise<Meeting> {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}`, {
    credentials: 'include',
  });
  return handleResponse<Meeting>(res);
}

export async function updateMeeting(
  meetingId: string,
  data: { name?: string; description?: string; status?: string }
): Promise<Meeting> {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data),
  });
  return handleResponse<Meeting>(res);
}

export async function addOwner(
  meetingId: string,
  ownerEmail: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/owners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ ownerEmail }),
  });
  return handleResponse<{ success: boolean }>(res);
}

export async function removeOwner(
  meetingId: string,
  ownerId: string
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/owners/${ownerId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  return handleResponse<{ success: boolean }>(res);
}

export async function getMeetingOwners(
  meetingId: string
): Promise<{ id: string; email: string; isCreator: boolean }[]> {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/owners`, {
    credentials: 'include',
  });
  return handleResponse<{ id: string; email: string; isCreator: boolean }[]>(res);
}

export async function getQuestions(
  meetingId: string,
  search = '',
  sort = 'votes'
): Promise<Question[]> {
  const params = new URLSearchParams({ search, sort });
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/questions?${params}`, {
    credentials: 'include',
  });
  return handleResponse<Question[]>(res);
}

export async function addQuestion(meetingId: string, content: string): Promise<Question> {
  const res = await fetch(`${API_BASE}/meetings/${meetingId}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ content }),
  });
  return handleResponse<Question>(res);
}

export async function voteQuestion(
  questionId: number,
  type: 'up' | 'down'
): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/questions/${questionId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ type }),
  });
  return handleResponse<{ success: boolean }>(res);
}

export async function getAdminMeetings(): Promise<Meeting[]> {
  const res = await fetch(`${API_BASE}/admin/meetings`, {
    credentials: 'include',
  });
  return handleResponse<Meeting[]>(res);
}

export async function getUserMeetings(): Promise<Meeting[]> {
  const res = await fetch(`${API_BASE}/user/meetings`, {
    credentials: 'include',
  });
  return handleResponse<Meeting[]>(res);
}
