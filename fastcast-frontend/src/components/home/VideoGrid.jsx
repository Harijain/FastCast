import VideoCard from "./VideoCard";

const VideoGrid = ({ title, videos }) => {

    if (!videos?.length) return null;

    return (

        <section className="mt-14">

            <h2
                className="
                    text-2xl
                    font-bold
                    text-slate-900
                    mb-6
                "
            >

                {title}

            </h2>

            <div
                className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    lg:grid-cols-3
                    xl:grid-cols-4
                    gap-6
                "
            >

                {

                    videos.map(video => (

                        <VideoCard
                            key={video.id}
                            video={video}
                        />

                    ))

                }

            </div>

        </section>

    );

};

export default VideoGrid;