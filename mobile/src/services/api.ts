import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { Comment, Page, PeopleKind, Person, PersonInput, Post, PostInput, SignUpInput, User } from '@/types';

const API_PORT = 3001;

// Ordem de resolução da URL da API:
// 1. EXPO_PUBLIC_API_URL (arquivo .env do app) — use para uma API hospedada;
// 2. em desenvolvimento, o mesmo IP da máquina que roda o Metro (funciona no
//    Expo Go em um celular real na mesma rede Wi-Fi);
// 3. fallback para o emulador Android (10.0.2.2) ou localhost.
function resolveApiUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (Platform.OS === 'web' && typeof window !== 'undefined')
    return `http://${window.location.hostname}:${API_PORT}`;

  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  if (devHost) return `http://${devHost}:${API_PORT}`;

  return Platform.OS === 'android' ? `http://10.0.2.2:${API_PORT}` : `http://localhost:${API_PORT}`;
}

export const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

// O token fica em memória aqui; quem persiste a sessão é o AuthContext.
let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(`Não foi possível conectar ao servidor (${API_URL}).`, 0);
  }

  if (!response.ok) {
    // Token expirado ou inválido: encerra a sessão para o usuário logar de novo.
    if (response.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register'))
      onUnauthorized?.();
    const body = await response.json().catch(() => null);
    throw new ApiError(body?.message || 'Não foi possível concluir a solicitação.', response.status);
  }

  return response.status === 204 ? (undefined as T) : response.json();
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
});

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', json('POST', { email, password })),
  register: (input: SignUpInput) => request<{ token: string; user: User }>('/auth/register', json('POST', input)),
  me: () => request<{ user: User }>('/auth/me'),
};

export const postsApi = {
  list: () => request<Post[]>('/posts'),
  search: (query: string) => request<Post[]>(`/posts/search?q=${encodeURIComponent(query)}`),
  get: (id: string) => request<Post>(`/posts/${id}`),
  create: (post: PostInput) => request<Post>('/posts', json('POST', post)),
  update: (id: string, post: Partial<PostInput>) => request<Post>(`/posts/${id}`, json('PUT', post)),
  remove: (id: string) => request<void>(`/posts/${id}`, json('DELETE')),

  comments: (id: string) => request<Comment[]>(`/posts/${id}/comments`),
  addComment: (id: string, content: string) =>
    request<Comment>(`/posts/${id}/comments`, json('POST', { content })),
  removeComment: (id: string, commentId: string) =>
    request<void>(`/posts/${id}/comments/${commentId}`, json('DELETE')),
};

// Professores e alunos usam endpoints idênticos (/teachers e /students).
export const peopleApi = (kind: PeopleKind) => ({
  list: (page = 1, limit = 10, q = '') =>
    request<Page<Person>>(`/${kind}?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`),
  get: (id: string) => request<Person>(`/${kind}/${id}`),
  create: (person: PersonInput) => request<Person>(`/${kind}`, json('POST', person)),
  update: (id: string, person: PersonInput) => request<Person>(`/${kind}/${id}`, json('PUT', person)),
  remove: (id: string) => request<void>(`/${kind}/${id}`, json('DELETE')),
});
