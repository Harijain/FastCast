import api from "./api";

const metricsService = {

    async getSummary() {

        const response = await api.get(
            "/metrics/summary"
        );

        return response.data;
    }

};

export default metricsService;