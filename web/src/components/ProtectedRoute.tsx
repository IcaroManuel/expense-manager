import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        data-testid="protected-loading"
        className="min-h-screen flex items-center justify-center bg-[#F9F8F6] text-[#6B6A65]"
      >
        <div className="text-sm">Carregando…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
