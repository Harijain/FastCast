import api from "./api";

const uploadService = {

    async uploadVideo(file, title, description) {

        const formData = new FormData();

        formData.append("file", file);
        formData.append("title", title);
        formData.append("description", description);

        const response = await api.post(
            "/videos/upload",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            }
        );

        return response.data;
    }

};

export default uploadService;