import React from "react";
import { AlertTriangle } from "lucide-react";
import { INVESTMENTS } from "@/constants/test-ids";

export default function PendingSnapshotBanner({ onUpdateClick }: { onUpdateClick: () => void }) {
  return (
    <div
      data-testid={INVESTMENTS.pendingBanner}
      className="flex items-center justify-between gap-4 rounded-2xl bg-[#FDF6EA] border border-[#C68B35]/30 px-5 py-4"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle size={18} className="text-[#C68B35] shrink-0" />
        <div>
          <div className="font-display font-semibold text-[#1C1C19] text-sm">
            Saldo deste mês ainda não atualizado
          </div>
          <div className="text-sm text-[#6B6A65]">
            Informe o saldo atual da sua conta para calcular o rendimento do mês.
          </div>
        </div>
      </div>
      <button
        onClick={onUpdateClick}
        className="shrink-0 bg-[#2D4238] text-white hover:bg-[#3C5749] rounded-full px-5 py-2 text-sm font-medium transition-colors"
      >
        Atualizar agora
      </button>
    </div>
  );
}
