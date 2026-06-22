import { useNavigate } from "react-router-dom";

import useAuthStore from "../../store/authStore";

const VideoCard = ({ video }) => {

    const navigate = useNavigate();

    const authenticated = useAuthStore(
        (state) => state.authenticated
    );

    const handleClick = () => {

        if (!authenticated) {

            navigate("/login");

            return;

        }

        navigate(`/watch/${video.id}`);

    };

    return (

        <div
            onClick={handleClick}
            className="
                cursor-pointer
                group
                rounded-3xl
                overflow-hidden
                bg-white
                border
                border-slate-200
                shadow-sm
                hover:shadow-xl
                transition
            "
        >

            <div
                className="
                    h-52
                    bg-gradient-to-br
                    from-violet-100
                    via-cyan-50
                    to-slate-100
                    flex
                    items-center
                    justify-center
                "
            >

                {
                    video.thumbnailUrl

                        ? (
                            <img
                                src={video.thumbnailUrl}
                                alt={video.title}
                                className="w-full h-full object-cover"
                            />
                        )

                        : (

                            <span className="text-5xl">

                                🎬

                            </span>

                        )
                }

            </div>

            <div className="p-5">

                <h3
                    className="
                        font-semibold
                        text-slate-900
                        line-clamp-1
                    "
                >

                    {video.title}

                </h3>

                <p
                    className="
                        mt-2
                        text-sm
                        text-slate-500
                        line-clamp-2
                    "
                >

                    {video.description}

                </p>

                <div
                    className="
                        mt-4
                        flex
                        justify-between
                        text-xs
                        text-slate-400
                    "
                >

                    <span>

                        {video.genre}

                    </span>

                    <span>

                        {video.status}

                    </span>

                </div>

            </div>

        </div>

    );

};

export default VideoCard;