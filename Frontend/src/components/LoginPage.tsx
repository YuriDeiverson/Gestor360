import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch {
      setError("Falha no login. Verifique suas credenciais.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-neutral-50 to-neutral-100 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors px-4 sm:px-0">
      <div className="w-full max-w-sm bg-white/80 dark:bg-neutral-900/70 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8 border border-neutral-200/60 dark:border-neutral-800/50 transition-all">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center text-white text-2xl font-semibold shadow-md">
            ₿
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mt-4 tracking-tight text-center">
            Painel Financeiro
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 text-center">
            Acompanhe suas finanças com clareza
          </p>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="text-sm text-center text-red-600 bg-red-50 border border-red-100 rounded-xl py-2 mb-5">
            {error}
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              E-mail
            </label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all touch-manipulation"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all touch-manipulation"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium tracking-tight transition-all shadow-sm hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed touch-manipulation min-h-[44px] active:bg-emerald-700"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-sm text-neutral-500 dark:text-neutral-400 mt-6 sm:mt-8">
          Esqueceu sua senha?{" "}
          <a
            href="#"
            className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline transition touch-manipulation"
          >
            Recuperar acesso
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
