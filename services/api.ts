
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Replace with your machine's IP address
const API_URL = 'http://192.168.1.13:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

// Interceptor to add token to requests
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
