import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:5000";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export function extractArray(response, fallbackKeys = []) {
  if (!response) return [];
  if (Array.isArray(response.data)) return response.data;

  for (const key of fallbackKeys) {
    if (Array.isArray(response.data?.[key])) {
      return response.data[key];
    }
  }

  if (Array.isArray(response.data?.bookings)) return response.data.bookings;
  if (Array.isArray(response.data?.data)) return response.data.data;
  return [];
}

export function getApiErrorMessage(error, fallbackMessage) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      fallbackMessage
    );
  }

  return error?.message || fallbackMessage;
}
