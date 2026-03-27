import React, { useState } from "react";
import { LoginPage } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { useAuth } from "../hooks/useAuth";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { loading } = useAuth();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))' }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <svg
              className="w-8 h-8 text-white animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <p style={{ color: 'var(--text-secondary)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  return isLogin ? (
    <LoginPage onSwitchToRegister={() => setIsLogin(false)} />
  ) : (
    <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
  );
};

export default AuthPage;
