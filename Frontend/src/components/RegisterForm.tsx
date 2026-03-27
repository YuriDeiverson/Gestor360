import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
}) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoverSubmit, setHoverSubmit] = useState(false);
  const [hoverLink, setHoverLink] = useState(false);

  const { register } = useAuth();
  const { showWarning, showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      showWarning("Campos obrigatórios", "Preencha todos os campos");
      return;
    }

    if (password !== confirmPassword) {
      showWarning("Senhas diferentes", "As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      showWarning(
        "Senha muito curta",
        "A senha deve ter pelo menos 6 caracteres",
      );
      return;
    }

    if (name.trim().length < 2) {
      showWarning(
        "Nome muito curto",
        "O nome deve ter pelo menos 2 caracteres",
      );
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
      showSuccess("Sucesso!", "Conta criada com sucesso!");
    } catch (error) {
      console.error("Erro no registro:", error);
      const message =
        error instanceof Error ? error.message : "Erro ao criar conta";
      showError("Erro no registro", message);
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: 'var(--text)' }}
            >
              Criar Conta
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Cadastre-se para começar a usar o dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text)' }}
              >
                Nome completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full px-4 py-3 border rounded-lg transition-colors"
                style={inputStyle('name')}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                disabled={loading}
                required
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 border rounded-lg transition-colors"
                style={inputStyle('password')}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
                style={{ color: 'var(--text)' }}
              >
                Confirmar senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                className="w-full px-4 py-3 border rounded-lg transition-colors"
                style={inputStyle('confirmPassword')}
                onFocus={() => setFocusedInput('confirmPassword')}
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
                  Criando conta...
                </div>
              ) : (
                "Criar conta"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p style={{ color: 'var(--text-secondary)' }}>
              Já tem uma conta?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-medium transition-colors"
                style={{ color: hoverLink ? 'var(--primary-light)' : 'var(--primary)' }}
                onMouseEnter={() => setHoverLink(true)}
                onMouseLeave={() => setHoverLink(false)}
              >
                Faça login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
