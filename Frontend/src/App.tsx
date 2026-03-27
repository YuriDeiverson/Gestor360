import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import AuthPage from "./components/AuthPage";
import DashboardPage from "./components/DashboardPage";
import InvitePage from "./components/InvitePage";
import { FiltersProvider } from "./hooks/useFilters";
import { ToastProvider } from "./components/ToastProvider";

const App: React.FC = () => {
  console.log("🚀 App: Aplicação iniciada");

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

const AppContent: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Rota pública para aceitar convites */}
      <Route path="/invite/:token" element={<InvitePage />} />

      {/* Rotas protegidas */}
      <Route
        path="/dashboard"
        element={
          user ? (
            <FiltersProvider>
              <DashboardPage />
            </FiltersProvider>
          ) : (
            <AuthPage />
          )
        }
      />

      {/* Rota padrão */}
      <Route
        path="*"
        element={
          user ? (
            <FiltersProvider>
              <DashboardPage />
            </FiltersProvider>
          ) : (
            <AuthPage />
          )
        }
      />
    </Routes>
  );
};

export default App;
