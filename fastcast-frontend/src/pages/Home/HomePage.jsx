import { useEffect, useState } from "react";

import HeroSection from "../../components/home/HeroSection";
import VideoGrid from "../../components/home/VideoGrid";

import videoService from "../../services/videoService";

const HomePage = () => {

    const [videos, setVideos] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const loadVideos = async () => {

            try {

                const response =
                    await videoService.getVideos();

                setVideos(
                    response.data || []
                );

            }

            catch (error) {

                console.error(error);

            }

            finally {

                setLoading(false);

            }

        };

        loadVideos();

    }, []);

    return (

        <div
            className="
                max-w-7xl
                mx-auto
                px-6
                py-10
            "
        >

            <HeroSection />

            {

                loading

                    ? (

                        <div className="mt-12">

                            Loading videos...

                        </div>

                    )

                    : (

                        <>

                            <VideoGrid
                                title="🔥 Trending Now"
                                videos={videos.slice(0, 8)}
                            />

                            <VideoGrid
                                title="🎬 Recently Added"
                                videos={videos}
                            />

                        </>

                    )

            }

        </div>

    );

};

export default HomePage;