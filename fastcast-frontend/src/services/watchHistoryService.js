import api from "./api";

const watchHistoryService = {

    async getHistory() {

        const response = await api.get(
            "/watch-history"
        );

        return response.data;
    },

    async updateProgress(data) {

        const response = await api.post(
            "/watch-history",
            data
        );

        return response.data;
    }

};

export default watchHistoryService;