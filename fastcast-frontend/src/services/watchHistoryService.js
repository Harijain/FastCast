import api from "./api";

const watchHistoryService = {

    async getHistory() {
    const response = await api.get("/history");   
    return response.data;
},

async updateProgress(data) {
    const response = await api.post("/history/progress", data); 
    return response.data;
}

};

export default watchHistoryService;