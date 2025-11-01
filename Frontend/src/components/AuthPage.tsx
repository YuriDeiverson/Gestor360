import React, { useState } from "react";
import { LoginPage } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { useAuth } from "../hooks/useAuth";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
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
          <p className="text-gray-600">Carregando...</p>
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
