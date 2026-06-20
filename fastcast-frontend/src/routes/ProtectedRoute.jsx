import { Navigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

const ProtectedRoute = ({ children }) => {

    const authenticated = useAuthStore(
        (state) => state.authenticated
    );

    if (!authenticated) {

        return <Navigate to="/login" replace />;

    }

    return children;

};

export default ProtectedRoute;