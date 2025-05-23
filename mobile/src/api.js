// src/api.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./config";  // <-- вот этот файл

async function getAuthHeaders() {
    const token = await AsyncStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export async function apiFetch(path, options = {}) {
    const headers = await getAuthHeaders();
    return fetch(`${API_URL}${path}`, { headers, ...options });
}