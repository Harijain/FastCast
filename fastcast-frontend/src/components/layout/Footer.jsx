const Footer = () => {

    return (

        <footer
            className="border-t border-slate-200 bg-white"
        >

            <div
                className="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row justify-between items-center gap-4"
            >

                <div>

                    <h3
                        className="text-lg font-semibold text-slate-900"
                    >

                        FastCast

                    </h3>

                    <p
                        className="text-slate-500 text-sm mt-1"
                    >

                        Scalable Video Streaming Platform

                    </p>

                </div>

                <p
                    className="text-slate-400 text-sm"
                >

                    © 2026 FastCast. All rights reserved.

                </p>

            </div>

        </footer>

    );

};

export default Footer;