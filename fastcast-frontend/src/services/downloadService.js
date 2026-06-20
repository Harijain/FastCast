import api from "./api";

const downloadService = {

    async getDownloadHistory() {

        const response = await api.get(
            "/download/history"
        );

        return response.data;
    }

};

export default downloadService;