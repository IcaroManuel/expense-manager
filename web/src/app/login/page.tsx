"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, LogIn, UserPlus } from "lucide-react";
import { loginApi, registerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function Login() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user =
        mode === "login"
          ? await loginApi(email.trim(), name.trim())
          : await registerApi(email.trim(), name.trim());

      setUser(user);
      router.replace("/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        "Erro ao autenticar. Verifique seus dados.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="login-page"
      className="min-h-screen flex items-center justify-center bg-[#F9F8F6] p-6"
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#2D4238] text-white flex items-center justify-center">
            <Wallet size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#6B6A65]">
              Gestor Financeiro
            </div>
            <div className="font-display text-base font-semibold leading-tight text-[#1C1C19]">
              Painel pessoal
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#EAE7E1] rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-[#F3F1ED] rounded-full p-1">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-all ${
                mode === "login"
                  ? "bg-white text-[#1C1C19] shadow-sm"
                  : "text-[#6B6A65] hover:text-[#1C1C19]"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 rounded-full py-1.5 text-sm font-medium transition-all ${
                mode === "register"
                  ? "bg-white text-[#1C1C19] shadow-sm"
                  : "text-[#6B6A65] hover:text-[#1C1C19]"
              }`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C1C19]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-10 rounded-xl border border-[#EAE7E1] bg-[#F9F8F6] px-3 text-sm outline-none focus:border-[#2D4238] focus:ring-2 focus:ring-[#2D4238]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C1C19]">Nome</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full h-10 rounded-xl border border-[#EAE7E1] bg-[#F9F8F6] px-3 text-sm outline-none focus:border-[#2D4238] focus:ring-2 focus:ring-[#2D4238]/20 transition-all"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-[#F9EBEA] border border-[#B34A3E]/20 px-3 py-2 text-sm text-[#B34A3E]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-full bg-[#2D4238] text-white text-sm font-medium hover:bg-[#3C5749] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                "Aguarde..."
              ) : mode === "login" ? (
                <><LogIn size={15} /> Entrar</>
              ) : (
                <><UserPlus size={15} /> Criar conta</>
              )}
            </button>
          </form>

          {mode === "login" && (
            <p className="text-xs text-[#9A9892] text-center mt-4">
              Email e nome devem ser iguais ao cadastrado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
