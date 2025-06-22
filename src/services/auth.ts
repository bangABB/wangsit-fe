import axios from 'axios';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';

const API_URL = 'http://localhost:8000/api';

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  email: string;
  name: string | null;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
}

// Configure axios defaults
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const getGoogleAuthUrl = (redirectUri: string = `${window.location.origin}/auth/callback`) => {
  return `${API_URL}/auth/google/login/?redirect_uri=${encodeURIComponent(redirectUri)}`;
};

export const exchangeGoogleCode = async (code: string, redirectUri: string = `${window.location.origin}/auth/callback`): Promise<AuthResponse> => {
  try {
    console.log("Sending code to backend:", code);
    console.log("Redirect URI:", redirectUri);
    
    const response = await api.post('/auth/google', {
      code,
      redirect_uri: redirectUri
    });
    
    console.log("Auth response:", response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error exchanging Google code:', error);
    
    // More detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

export const setAuthToken = (token: string) => {
  setCookie('auth_token', token, {
    maxAge: 60 * 60 * 24, // 1 day
    path: '/'
  });
};

export const getAuthToken = (): string | null => {
  return getCookie('auth_token')?.toString() || null;
};

export const removeAuthToken = () => {
  deleteCookie('auth_token');
};

export const getCurrentUser = async (): Promise<User | null> => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    // This is a placeholder - you'd need to implement a user endpoint in your backend
    // const response = await api.get('/auth/me', {
    //   headers: { Authorization: `Bearer ${token}` }
    // });
    // return response.data;

    // For now, we'll decode the JWT token to get user info
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.user_id,
      email: payload.email,
      name: payload.name
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const logout = () => {
  removeAuthToken();
  window.location.href = '/';
}; 