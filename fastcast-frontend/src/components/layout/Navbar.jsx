import { NavLink, Link } from "react-router-dom";
import { FiSearch } from "react-icons/fi";

import Logo from "../common/Logo";
import Button from "../common/Button";

const Navbar = () => {

    const navLink = ({ isActive }) =>

        isActive

            ? "text-slate-900 font-semibold"

            : "text-slate-500 hover:text-slate-900 transition";

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

                    <NavLink to="/upload" className={navLink}>
                        Upload
                    </NavLink>

                    <NavLink to="/history" className={navLink}>
                        History
                    </NavLink>

                </nav>

                <div className="flex items-center gap-4">

                    <button
                        className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition"
                    >
                        <FiSearch size={18} />
                    </button>

                    <Link to="/login">

                        <Button>

                            Login

                        </Button>

                    </Link>

                </div>

            </div>

        </header>

    );

};

export default Navbar;