import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/Login/LoginPage";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

const Placeholder = ({ title }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "70vh",
        fontSize: "32px",
        fontWeight: "700",
      }}
    >
      {title}
    </div>
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Placeholder title="FastCast Home" />
            </MainLayout>
          }
        />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<Placeholder title="Register" />} />

        <Route
          path="/search"
          element={
            <MainLayout>
              <Placeholder title="Search" />
            </MainLayout>
          }
        />

        <Route
          path="/watch/:videoId"
          element={
            <MainLayout>
              <Placeholder title="Watch Video" />
            </MainLayout>
          }
        />

        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Placeholder title="Upload Video" />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Placeholder title="Profile" />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Placeholder title="Watch History" />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
