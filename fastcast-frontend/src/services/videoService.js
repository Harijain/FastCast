import api from "./api";

const videoService = {

    async getVideos(page = 0, size = 12) {
        const response = await api.get("/videos", {
            params: { page, size }
        });

        return response.data;
    },

    async getVideo(videoId) {
        const response = await api.get(`/videos/${videoId}`);
        return response.data;
    },

    async search(searchRequest) {
        const response = await api.post(
            "/videos/search",
            searchRequest
        );

        return response.data;
    }

};

export default videoService;