import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, AlertCircle } from "lucide-react";
import { exchangeSession } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    const sessionId = match?.[1];
    if (!sessionId) {
      navigate("/login", { replace: true });
      return;
    }

    (async () => {
      try {
        const user = await exchangeSession(sessionId);
        setUser(user);
        // Clean fragment from URL so refresh doesn't reprocess
        window.history.replaceState({}, document.title, window.location.pathname);
        navigate("/dashboard", { replace: true, state: { user } });
      } catch (err) {
        const detail =
          err?.response?.data?.detail ||
          "Não foi possível autenticar. Verifique se este e-mail está autorizado.";
        setError(detail);
      }
    })();
  }, [navigate, setUser]);

  return (
    <div
      data-testid="auth-callback-page"
      className="min-h-screen flex items-center justify-center bg-[#F9F8F6] text-[#1C1C19] p-6"
    >
      <div className="max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#2D4238] text-white mx-auto flex items-center justify-center mb-4">
          <Wallet size={20} />
        </div>
        {!error ? (
          <>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Autenticando…
            </h1>
            <p className="text-[#6B6A65] mt-2 text-sm">
              Estamos validando sua sessão. Só vai um instante.
            </p>
            <div className="mt-6 inline-block h-1 w-24 bg-[#EAE7E1] overflow-hidden rounded-full">
              <div className="h-full w-1/2 bg-[#2D4238] animate-pulse" />
            </div>
          </>
        ) : (
          <div
            data-testid="auth-callback-error"
            className="rounded-2xl bg-[#F9EBEA] border border-[#B34A3E]/30 p-5 text-left"
          >
            <div className="flex items-center gap-2 text-[#B34A3E] font-display font-semibold">
              <AlertCircle size={18} /> Acesso negado
            </div>
            <p className="text-[#6B6A65] text-sm mt-2">{error}</p>
            <button
              data-testid="auth-callback-back-btn"
              onClick={() => navigate("/login", { replace: true })}
              className="mt-4 inline-flex items-center justify-center bg-[#2D4238] text-white hover:bg-[#3C5749] rounded-full px-5 py-2 text-sm font-medium transition-colors"
            >
              Voltar para o login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
