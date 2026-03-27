import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoverSubmit, setHoverSubmit] = useState(false);
  const [hoverLink, setHoverLink] = useState(false);

  const { login } = useAuth();
  const { showWarning, showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showWarning("Campos obrigatórios", "Preencha todos os campos");
      return;
    }

    setLoading(true);

    try {
      await login(email, password);
      showSuccess("Sucesso!", "Login realizado com sucesso!");
    } catch (error) {
      console.error("Erro no login:", error);
      const message = error instanceof Error ? error.message : "Erro no login";
      showError("Erro no login", message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    backgroundColor: 'var(--input-bg)',
    borderColor: focusedInput === field ? 'var(--primary)' : 'var(--input-border)',
    color: 'var(--text)',
    ...(focusedInput === field ? { boxShadow: '0 0 0 2px var(--primary-bg)' } : {}),
  });

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))' }}
    >
      <div className="w-full max-w-md">
        <div
          className="rounded-2xl p-8"
          style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)' }}
        >
          <div className="text-center mb-8">
            <div
              className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--text)' }}
            >
              Financeiro +
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Entre na sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-4 py-3 border rounded-lg transition-colors"
                style={inputStyle('email')}
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text)' }}
              >
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border rounded-lg transition-colors"
                style={inputStyle('password')}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                disabled={loading}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 px-4 rounded-lg font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{
                backgroundColor: hoverSubmit ? 'var(--primary-light)' : 'var(--primary)',
              }}
              onMouseEnter={() => setHoverSubmit(true)}
              onMouseLeave={() => setHoverSubmit(false)}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Entrando...
                </div>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p style={{ color: 'var(--text-secondary)' }}>
              Não tem uma conta?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-medium transition-colors"
                style={{ color: hoverLink ? 'var(--primary-light)' : 'var(--primary)' }}
                onMouseEnter={() => setHoverLink(true)}
                onMouseLeave={() => setHoverLink(false)}
              >
                Cadastre-se
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
