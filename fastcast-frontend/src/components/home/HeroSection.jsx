import { Link } from "react-router-dom";

import Button from "../common/Button";

const HeroSection = () => {

    return (

        <section
            className="
                relative
                overflow-hidden
                rounded-[40px]
                bg-gradient-to-br
                from-violet-600
                via-indigo-500
                to-cyan-500
                text-white
                px-10
                py-20
            "
        >

            <div className="max-w-3xl">

                <span
                    className="
                        inline-block
                        px-4
                        py-2
                        rounded-full
                        bg-white/20
                        backdrop-blur
                        text-sm
                    "
                >

                    Event Driven Streaming Platform

                </span>

                <h1
                    className="
                        mt-6
                        text-5xl
                        md:text-7xl
                        font-bold
                        leading-tight
                    "
                >

                    Stream Beyond
                    <br />
                    Boundaries

                </h1>

                <p
                    className="
                        mt-6
                        text-lg
                        text-white/90
                    "
                >

                    FastCast delivers adaptive HLS streaming
                    powered by Kafka, Redis, AWS S3 and FFmpeg.

                </p>

                <div className="mt-8 flex gap-4">

                    <Link to="/register">

                        <Button>

                            Start Watching

                        </Button>

                    </Link>

                </div>

            </div>

        </section>

    );

};

export default HeroSection;