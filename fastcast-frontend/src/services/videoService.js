import api from "./api";

const videoService = {

    async getVideos() {

        const response = await api.get("/videos");

        return response.data;

    },

    async getVideo(videoId) {

        const response = await api.get(`/videos/${videoId}`);

        return response.data;

    },

    async search(searchRequest) {

        const response = await api.get(
            "/videos/search",
            {
                params: searchRequest
            }
        );

        return response.data;

    }

};

export default videoService;