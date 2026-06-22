import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { FiSearch, FiChevronDown } from "react-icons/fi";

import Logo from "../common/Logo";
import Button from "../common/Button";

import useAuthStore from "../../store/authStore";

const Navbar = () => {

    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);

    const authenticated = useAuthStore(
        (state) => state.authenticated
    );

    const user = useAuthStore(
        (state) => state.user
    );

    const logout = useAuthStore(
        (state) => state.logout
    );

    const navLink = ({ isActive }) =>

        isActive

            ? "text-slate-900 font-semibold"

            : "text-slate-500 hover:text-slate-900 transition";

    const handleLogout = async () => {

        await logout();

        navigate("/login");

    };

    return (

        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">

            <div className="max-w-7xl mx-auto h-20 flex items-center justify-between px-6 lg:px-12">

                <Logo />

                <nav className="hidden md:flex items-center gap-10">

                    <NavLink to="/" className={navLink}>
                        Home
                    </NavLink>

                    <NavLink to="/search" className={navLink}>
                        Explore
                    </NavLink>

                    {

                        authenticated &&

                        <>
                            <NavLink to="/upload" className={navLink}>
                                Upload
                            </NavLink>

                            <NavLink to="/history" className={navLink}>
                                History
                            </NavLink>
                        </>

                    }

                </nav>

                <div className="flex items-center gap-4">

                    <button
                        className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
                    >
                        <FiSearch size={18} />
                    </button>

                    {

                        !authenticated ? (

                            <Link to="/login">

                                <Button>

                                    Login

                                </Button>

                            </Link>

                        ) : (

                            <div className="relative">

                                <button
                                    onClick={() =>
                                        setMenuOpen(!menuOpen)
                                    }
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
                                >

                                    <span className="font-medium">

                                        {user?.name || "User"}

                                    </span>

                                    <FiChevronDown />

                                </button>

                                {

                                    menuOpen && (

                                        <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">

                                            <Link
                                                to="/profile"
                                                className="block px-4 py-3 hover:bg-slate-50"
                                            >
                                                Profile
                                            </Link>

                                            <Link
                                                to="/history"
                                                className="block px-4 py-3 hover:bg-slate-50"
                                            >
                                                Watch History
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50"
                                            >
                                                Logout
                                            </button>

                                        </div>

                                    )

                                }

                            </div>

                        )

                    }

                </div>

            </div>

        </header>

    );

};

export default Navbar;