import { create } from "zustand";
import authService from "../services/authService";

const useAuthStore = create((set) => ({

    user: authService.getUser(),

    token: authService.getToken(),

    authenticated: authService.isAuthenticated(),

    loading: false,

    login: async (credentials) => {

        set({ loading: true });

        try {

            const response = await authService.login(credentials);

            set({

                user: authService.getUser(),

                token: authService.getToken(),

                authenticated: true,

                loading: false

            });

            return response;

        } catch (error) {

            set({ loading: false });

            throw error;

        }

    },

    register: async (data) => {

        set({ loading: true });

        try {

            const response = await authService.register(data);

            set({

                user: authService.getUser(),

                token: authService.getToken(),

                authenticated: true,

                loading: false

            });

            return response;

        } catch (error) {

            set({ loading: false });

            throw error;

        }

    },

    logout: async () => {

        await authService.logout();

        set({

            user: null,

            token: null,

            authenticated: false

        });

    }

}));

export default useAuthStore;