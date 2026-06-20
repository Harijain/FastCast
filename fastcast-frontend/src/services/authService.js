import api from "./api";

const TOKEN_KEY = "fastcast_token";
const USER_KEY = "fastcast_user";

const authService = {

    async register(userData) {

        const response = await api.post("/auth/register", userData);

        if (response.data?.success) {

            const data = response.data.data;

            localStorage.setItem(TOKEN_KEY, data.token);

            localStorage.setItem(
                USER_KEY,
                JSON.stringify({
                    name: data.name,
                    email: data.email
                })
            );
        }

        return response.data;
    },

    async login(credentials) {

        const response = await api.post("/auth/login", credentials);

        if (response.data?.success) {

            const data = response.data.data;

            localStorage.setItem(TOKEN_KEY, data.token);

            localStorage.setItem(
                USER_KEY,
                JSON.stringify({
                    name: data.name,
                    email: data.email
                })
            );
        }

        return response.data;
    },

    async me() {

        const response = await api.get("/auth/me");

        return response.data;
    },

    async logout() {

        try {

            await api.post("/auth/logout");

        } finally {

            localStorage.removeItem(TOKEN_KEY);

            localStorage.removeItem(USER_KEY);

        }

    },

    getToken() {

        return localStorage.getItem(TOKEN_KEY);

    },

    getUser() {

        const user = localStorage.getItem(USER_KEY);

        return user ? JSON.parse(user) : null;

    },

    isAuthenticated() {

        return !!localStorage.getItem(TOKEN_KEY);

    }

};

export default authService;