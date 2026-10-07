import { Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HealthPage } from "./pages/HealthPage";
import { LoginPage } from "./pages/LoginPage";
import { IncidentReport } from "./components/IncidentReport";
import { ToastProvider } from "./components/Toast";
import { AuthProvider } from "./context/AuthContext";

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Login Page */}
          <Route path="/login" element={<LoginPage />} />

          {/* Live SOC Dashboard */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Pre-flight Health Check */}
          <Route path="/health" element={<HealthPage />} />

          {/* Incident Report View */}
          <Route path="/report/:id" element={<IncidentReport />} />
          <Route path="/report" element={<IncidentReport />} />

          {/* Fallback to Landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
