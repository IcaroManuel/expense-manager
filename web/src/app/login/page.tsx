"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, LogIn, UserPlus, KeyRound } from "lucide-react";
import { loginApi, registerApi, setInitialPasswordApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

type Mode = "login" | "register" | "first-access";

export default function Login() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetFields = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if ((mode === "register" || mode === "first-access") && password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if ((mode === "register" || mode === "first-access") && password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }

    setLoading(true);
    try {
      let user;
      if (mode === "login") {
        user = await loginApi(email.trim(), password);
      } else if (mode === "register") {
        user = await registerApi(email.trim(), name.trim(), password);
      } else {
        user = await setInitialPasswordApi(email.trim(), name.trim(), password);
      }
      setUser(user);
      router.replace("/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Erro ao autenticar. Verifique seus dados.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="login-page"
      className="min-h-screen flex items-center justify-center bg-[#F9F8F6] dark:bg-[#0f0f0f] p-6 transition-colors"
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#2D4238] dark:bg-[#4a7c4e] text-white flex items-center justify-center shadow-lg">
            <Wallet size={18} />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-medium text-[#6B6A65] dark:text-[#a0a0a0]">
              Gestor Financeiro
            </div>
            <div className="font-display text-base font-semibold leading-tight text-[#1C1C19] dark:text-white">
              Painel pessoal
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#EAE7E1] dark:border-[#333] rounded-2xl p-6 shadow-sm dark:shadow-xl">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-[#F3F1ED] dark:bg-[#2a2a2a] rounded-full p-1">
            {(["login", "register", "first-access"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => resetFields(m)}
                className={`flex-1 rounded-full py-1.5 text-xs font-medium transition-all ${
                  mode === m
                    ? "bg-white dark:bg-[#1a1a1a] text-[#1C1C19] dark:text-white shadow-sm dark:shadow-md"
                    : "text-[#6B6A65] dark:text-[#a0a0a0] hover:text-[#1C1C19] dark:hover:text-white"
                }`}
              >
                {m === "login" ? "Entrar" : m === "register" ? "Cadastrar" : "Primeiro acesso"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C1C19] dark:text-white">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full h-10 rounded-xl border border-[#EAE7E1] dark:border-[#333] bg-[#F9F8F6] dark:bg-[#2a2a2a] px-3 text-sm text-[#1C1C19] dark:text-white placeholder-[#9A9892] dark:placeholder-[#707070] outline-none focus:border-[#2D4238] dark:focus:border-[#4a7c4e] focus:ring-2 focus:ring-[#2D4238]/20 dark:focus:ring-[#4a7c4e]/20 transition-all"
              />
            </div>

            {/* Nome: só no cadastro e primeiro acesso */}
            {(mode === "register" || mode === "first-access") && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1C1C19] dark:text-white">Nome</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full h-10 rounded-xl border border-[#EAE7E1] dark:border-[#333] bg-[#F9F8F6] dark:bg-[#2a2a2a] px-3 text-sm text-[#1C1C19] dark:text-white placeholder-[#9A9892] dark:placeholder-[#707070] outline-none focus:border-[#2D4238] dark:focus:border-[#4a7c4e] focus:ring-2 focus:ring-[#2D4238]/20 dark:focus:ring-[#4a7c4e]/20 transition-all"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#1C1C19] dark:text-white">
                {mode === "first-access" ? "Nova senha" : "Senha"}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "login" ? "Sua senha" : "Mínimo 8 caracteres"}
                className="w-full h-10 rounded-xl border border-[#EAE7E1] dark:border-[#333] bg-[#F9F8F6] dark:bg-[#2a2a2a] px-3 text-sm text-[#1C1C19] dark:text-white placeholder-[#9A9892] dark:placeholder-[#707070] outline-none focus:border-[#2D4238] dark:focus:border-[#4a7c4e] focus:ring-2 focus:ring-[#2D4238]/20 dark:focus:ring-[#4a7c4e]/20 transition-all"
              />
            </div>

            {/* Confirmação: só no cadastro e primeiro acesso */}
            {(mode === "register" || mode === "first-access") && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1C1C19] dark:text-white">Confirmar senha</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full h-10 rounded-xl border border-[#EAE7E1] dark:border-[#333] bg-[#F9F8F6] dark:bg-[#2a2a2a] px-3 text-sm text-[#1C1C19] dark:text-white placeholder-[#9A9892] dark:placeholder-[#707070] outline-none focus:border-[#2D4238] dark:focus:border-[#4a7c4e] focus:ring-2 focus:ring-[#2D4238]/20 dark:focus:ring-[#4a7c4e]/20 transition-all"
                />
              </div>
            )}

            {error && (
              <div className="rounded-xl bg-[#F9EBEA] dark:bg-[#3a1f1c] border border-[#B34A3E]/20 dark:border-[#d46560]/30 px-3 py-2 text-sm text-[#B34A3E] dark:text-[#ff8a80]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-full bg-[#2D4238] dark:bg-[#4a7c4e] text-white text-sm font-medium hover:bg-[#3C5749] dark:hover:bg-[#5a8c5e] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
            >
              {loading ? (
                "Aguarde..."
              ) : mode === "login" ? (
                <><LogIn size={15} /> Entrar</>
              ) : mode === "register" ? (
                <><UserPlus size={15} /> Criar conta</>
              ) : (
                <><KeyRound size={15} /> Definir senha</>
              )}
            </button>
          </form>

          {mode === "first-access" && (
            <p className="text-xs text-[#9A9892] dark:text-[#707070] text-center mt-4">
              Para contas criadas antes da autenticação por senha. Use o email e nome que você cadastrou.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
