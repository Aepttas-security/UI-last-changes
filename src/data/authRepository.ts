import { Platform } from 'react-native';

// Parental Control Backend running on port 8002
// On Android Emulator: 10.0.2.2 → your computer's localhost
// On physical device: replace with your machine's local IP (e.g. http://192.168.x.x:8002)
const AUTH_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8002'
    : 'http://localhost:8002';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  message: string;
  user_id: number;
  parent_name: string;
  token_type: string;
  access_token: string;
}

export interface AuthError {
  message: string;
  field?: string; // 'email' | 'password' | 'general'
}

/**
 * Sends login credentials to the Parental Control backend.
 * The backend validates:
 *  - Email must end with @gmail.com
 *  - Password is verified against the bcrypt hash stored in Neon PostgreSQL
 *
 * Returns a LoginResponse on success, or throws an AuthError on failure.
 */
export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  let response: Response;

  try {
    response = await fetch(`${AUTH_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      }),
    });
  } catch (networkError) {
    throw {
      message: 'Unable to connect to the server. Please check your network.',
      field: 'general',
    } as AuthError;
  }

  const data = await response.json();

  if (!response.ok) {
    // FastAPI validation errors (422) come as { detail: [...] }
    if (response.status === 422 && Array.isArray(data.detail)) {
      const firstError = data.detail[0];
      const field = firstError?.loc?.[1] ?? 'general'; // 'email' or 'password'
      const msg: string = firstError?.msg ?? 'Validation error.';
      throw { message: msg.replace('Value error, ', ''), field } as AuthError;
    }

    // Auth failure (401) or other errors come as { detail: "..." }
    throw {
      message: data.detail ?? 'Login failed. Please try again.',
      field: 'general',
    } as AuthError;
  }

  return data as LoginResponse;
}

/**
 * Registers a new parent account on the backend.
 */
export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<{ status: string; message: string; user_id: number }> {
  let response: Response;

  try {
    response = await fetch(`${AUTH_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      }),
    });
  } catch {
    throw {
      message: 'Unable to connect to the server. Please check your network.',
      field: 'general',
    } as AuthError;
  }

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 422 && Array.isArray(data.detail)) {
      const firstError = data.detail[0];
      const field = firstError?.loc?.[1] ?? 'general';
      const msg: string = firstError?.msg ?? 'Validation error.';
      throw { message: msg.replace('Value error, ', ''), field } as AuthError;
    }
    throw {
      message: data.detail ?? 'Registration failed. Please try again.',
      field: 'general',
    } as AuthError;
  }

  return data;
}
