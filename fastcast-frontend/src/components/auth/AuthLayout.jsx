import { Link } from "react-router-dom";

const AuthLayout = ({ title, subtitle, children, footerText, footerLink, footerLabel }) => {

    return (

        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">

            <div className="w-full max-w-md">

                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10">

                    <div className="mb-8 text-center">

                        <div className="flex justify-center mb-5">

                            <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">

                                F

                            </div>

                        </div>

                        <h1 className="text-3xl font-bold text-slate-900">

                            {title}

                        </h1>

                        <p className="text-slate-500 mt-2">

                            {subtitle}

                        </p>

                    </div>

                    {children}

                    <div className="mt-8 text-center text-sm text-slate-500">

                        {footerText}

                        <Link

                            to={footerLink}

                            className="ml-2 font-semibold text-blue-600 hover:text-blue-700"

                        >

                            {footerLabel}

                        </Link>

                    </div>

                </div>

            </div>

        </div>

    );

};

export default AuthLayout;