import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const MainLayout = ({ children }) => {

    return (

        <div
            className="min-h-screen bg-slate-50 flex flex-col"
        >

            <Navbar />

            <main
                className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-10"
            >

                {children}

            </main>

            <Footer />

        </div>

    );

};

export default MainLayout;