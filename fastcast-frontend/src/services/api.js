import axios from "axios";

const BASE_URL = "http://localhost:8080/api/v1";

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json"
    }
});

// Request Interceptor
api.interceptors.request.use(

    (config) => {

        const token = localStorage.getItem("fastcast_token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },

    (error) => Promise.reject(error)

);

// Response Interceptor
api.interceptors.response.use(

    (response) => response,

    (error) => {

        if (error.response?.status === 401) {

            localStorage.removeItem("fastcast_token");

            localStorage.removeItem("fastcast_user");

            window.location.href = "/login";
        }

        return Promise.reject(error);

    }

);

export default api;