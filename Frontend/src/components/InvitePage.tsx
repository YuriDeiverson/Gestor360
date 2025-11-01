import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface InviteInfo {
  id: string;
  dashboard_name: string;
  dashboard_description?: string;
  inviter_name: string;
  inviter_email: string;
  invitee_email: string;
  message?: string;
  expires_at: string;
  created_at: string;
}

const InvitePage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string>("");
  const [needsAccount, setNeedsAccount] = useState(false);

  // Estados para criação de conta
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (token) {
      fetchInviteInfo();
    }
  }, [token]);

  const fetchInviteInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:3002"}/api/invite/${token}`);

      if (response.ok) {
        const data = await response.json();
        setInviteInfo(data);

        // Verificar se o usuário já existe (se chegou aqui via link, provavelmente não tem conta)
        setNeedsAccount(true);
      } else if (response.status === 404) {
        setError("Convite não encontrado ou já foi processado");
      } else if (response.status === 400) {
        setError("Convite expirado");
      } else {
        setError("Erro ao carregar convite");
      }
    } catch (error) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (needsAccount) {
      if (!name.trim()) {
        setError("Nome é obrigatório");
        return;
      }
      if (password.length < 6) {
        setError("Senha deve ter pelo menos 6 caracteres");
        return;
      }
      if (password !== confirmPassword) {
        setError("Senhas não coincidem");
        return;
      }
    }

    try {
      setAccepting(true);
      setError("");

      const body = needsAccount ? { name: name.trim(), password } : {};

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3002"}/api/invite/${token}/accept`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (response.ok) {
        const data = await response.json();

        // Fazer login automático
        localStorage.setItem("authToken", data.accessToken);

        // Redirecionar para o dashboard
        navigate("/dashboard");
        window.location.reload(); // Para atualizar o contexto de auth
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Erro ao aceitar convite");
      }
    } catch (error) {
      setError("Erro de conexão");
    } finally {
      setAccepting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-gray-600">Carregando convite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Convite Inválido
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-emerald-600"
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Convite para Dashboard
          </h1>
          <p className="text-gray-600">
            Você foi convidado para participar de um dashboard
          </p>
        </div>

        {inviteInfo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              📊 {inviteInfo.dashboard_name}
            </h3>
            {inviteInfo.dashboard_description && (
              <p className="text-gray-600 text-sm mb-3">
                {inviteInfo.dashboard_description}
              </p>
            )}
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Convidado por:</span>{" "}
                {inviteInfo.inviter_name}
              </p>
              <p>
                <span className="font-medium">Email:</span>{" "}
                {inviteInfo.invitee_email}
              </p>
              <p>
                <span className="font-medium">Enviado em:</span>{" "}
                {formatDate(inviteInfo.created_at)}
              </p>
              {inviteInfo.message && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="font-medium mb-1">Mensagem:</p>
                  <p className="text-gray-600 italic">"{inviteInfo.message}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {needsAccount && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              Criar sua conta
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/login")}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAcceptInvite}
            disabled={accepting}
            className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {accepting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
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
                Aceitando...
              </>
            ) : (
              "Aceitar Convite"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
