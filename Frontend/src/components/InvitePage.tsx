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

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [hoverLoginBtn, setHoverLoginBtn] = useState(false);
  const [hoverCancelBtn, setHoverCancelBtn] = useState(false);
  const [hoverAcceptBtn, setHoverAcceptBtn] = useState(false);

  useEffect(() => {
    if (token) {
      fetchInviteInfo();
    }
  }, [token]);

  const fetchInviteInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://localhost:3002"}/api/invite/${token}`);

      if (response.ok) {
        const data = await response.json();
        setInviteInfo(data);

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
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3002"}/api/invite/${token}/accept`,
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

        localStorage.setItem("authToken", data.accessToken);

        navigate("/dashboard");
        window.location.reload();
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

  const inputStyle = (field: string): React.CSSProperties => ({
    backgroundColor: 'var(--input-bg)',
    borderColor: focusedInput === field ? 'var(--primary)' : 'var(--input-border)',
    color: 'var(--text)',
    ...(focusedInput === field ? { boxShadow: '0 0 0 2px var(--primary-bg)' } : {}),
  });

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))' }}
      >
        <div
          className="rounded-2xl p-8 max-w-md w-full mx-4"
          style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)' }}
        >
          <div className="flex flex-col items-center">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2"
              style={{ borderColor: 'var(--primary)' }}
            ></div>
            <p className="mt-4" style={{ color: 'var(--text-secondary)' }}>
              Carregando convite...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !inviteInfo) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))' }}
      >
        <div
          className="rounded-2xl p-8 max-w-md w-full mx-4"
          style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)' }}
        >
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: 'var(--danger-bg)' }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: 'var(--danger)' }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: 'var(--text)' }}
            >
              Convite Inválido
            </h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
              {error}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 px-4 text-white rounded-lg transition-colors"
              style={{
                backgroundColor: hoverLoginBtn ? 'var(--primary-light)' : 'var(--primary)',
              }}
              onMouseEnter={() => setHoverLoginBtn(true)}
              onMouseLeave={() => setHoverLoginBtn(false)}
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))' }}
    >
      <div
        className="rounded-2xl p-8 max-w-lg w-full mx-4"
        style={{ backgroundColor: 'var(--card)', boxShadow: 'var(--shadow)' }}
      >
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: 'var(--primary-bg)' }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'var(--primary)' }}
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
            Convite para Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Você foi convidado para participar de um dashboard
          </p>
        </div>

        {inviteInfo && (
          <div
            className="rounded-lg p-4 mb-6"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <h3
              className="font-semibold mb-2"
              style={{ color: 'var(--text)' }}
            >
              📊 {inviteInfo.dashboard_name}
            </h3>
            {inviteInfo.dashboard_description && (
              <p
                className="text-sm mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                {inviteInfo.dashboard_description}
              </p>
            )}
            <div
              className="space-y-2 text-sm"
              style={{ color: 'var(--text)' }}
            >
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
                <div
                  className="mt-3 pt-3 border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <p className="font-medium mb-1">Mensagem:</p>
                  <p
                    className="italic"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    "{inviteInfo.message}"
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {needsAccount && (
          <div className="mb-6">
            <h3
              className="font-semibold mb-4"
              style={{ color: 'var(--text)' }}
            >
              Criar sua conta
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text)' }}
                >
                  Nome completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={inputStyle('name')}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text)' }}
                >
                  Senha
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={inputStyle('password')}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: 'var(--text)' }}
                >
                  Confirmar senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg transition-colors"
                  style={inputStyle('confirmPassword')}
                  onFocus={() => setFocusedInput('confirmPassword')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder="Digite a senha novamente"
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            className="mb-4 p-3 border rounded-lg"
            style={{
              backgroundColor: 'var(--danger-bg)',
              borderColor: 'var(--danger)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={() => navigate("/login")}
            className="flex-1 py-3 px-4 border rounded-lg transition-colors"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--text)',
              backgroundColor: hoverCancelBtn ? 'var(--card-hover)' : 'transparent',
            }}
            onMouseEnter={() => setHoverCancelBtn(true)}
            onMouseLeave={() => setHoverCancelBtn(false)}
          >
            Cancelar
          </button>
          <button
            onClick={handleAcceptInvite}
            disabled={accepting}
            className="flex-1 py-3 px-4 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            style={{
              backgroundColor: hoverAcceptBtn ? 'var(--primary-light)' : 'var(--primary)',
            }}
            onMouseEnter={() => setHoverAcceptBtn(true)}
            onMouseLeave={() => setHoverAcceptBtn(false)}
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
