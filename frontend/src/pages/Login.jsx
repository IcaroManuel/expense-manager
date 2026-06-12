import React from "react";
import { Wallet, ShieldCheck, ArrowRight } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(
      redirectUrl
    )}`;
  };

  return (
    <div
      data-testid="login-page"
      className="min-h-screen flex flex-col lg:flex-row bg-[#F9F8F6] text-[#1C1C19]"
    >
      {/* Left: visual / brand */}
      <div className="lg:w-1/2 relative flex flex-col justify-between p-8 lg:p-12 bg-[#2D4238] text-white overflow-hidden">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/15">
            <Wallet size={18} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">
            Gestor Financeiro
          </span>
        </div>

        <div className="relative z-10 max-w-md">
          <div className="text-eyebrow text-white/60 mb-3">Painel pessoal</div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            Suas finanças, com privacidade absoluta.
          </h1>
          <p className="mt-4 text-white/70 text-base">
            Acompanhe entradas, despesas fixas, cartões e gastos avulsos — com histórico permanente, mês a mês.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 text-white/70 text-sm">
          <ShieldCheck size={16} />
          Acesso restrito por allowlist de e-mail
        </div>

        {/* decorative shapes */}
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute top-1/3 -left-10 w-72 h-72 rounded-full bg-[#C68B35]/10 blur-3xl" />
      </div>

      {/* Right: action */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          <div className="text-eyebrow">Entrar</div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-2">
            Acesse sua conta
          </h2>
          <p className="text-[#6B6A65] mt-3">
            Continue com sua conta Google. Apenas e-mails autorizados conseguem acessar o painel.
          </p>

          <button
            data-testid="google-login-btn"
            onClick={handleLogin}
            className="mt-8 w-full inline-flex items-center justify-center gap-3 bg-white border border-[#EAE7E1] hover:border-[#2D4238] rounded-full py-3.5 px-6 font-medium transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm group"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3C33.8 32.4 29.4 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.4 6.8 28.9 5 24 5 13.5 5 5 13.5 5 24s8.5 19 19 19c10.5 0 19-8.5 19-19 0-1.2-.1-2.3-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.6 16.1 19 13 24 13c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.4 6.8 28.9 5 24 5 16.3 5 9.6 9.4 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 43c4.8 0 9.2-1.8 12.5-4.8l-5.8-4.9C28.9 34.7 26.6 35.5 24 35.5c-5.3 0-9.8-2.6-11.3-6.4l-6.5 5C9.5 38.6 16.2 43 24 43z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4-4.1 5.3l5.8 4.9C40.9 35.8 44 30.5 44 24c0-1.2-.1-2.3-.4-3.5z"
              />
            </svg>
            <span>Continuar com Google</span>
            <ArrowRight
              size={18}
              className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200"
            />
          </button>

          <div className="mt-8 p-4 rounded-2xl bg-[#F3F1ED] border border-[#EAE7E1] text-sm text-[#6B6A65]">
            <span className="font-medium text-[#1C1C19]">Por que Google?</span>{" "}
            Sem senhas para você gerenciar e sessão criptografada via cookie. Apenas a allowlist permite acesso.
          </div>
        </div>
      </div>
    </div>
  );
}
