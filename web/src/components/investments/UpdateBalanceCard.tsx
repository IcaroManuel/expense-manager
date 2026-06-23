import React, { useState } from "react";
import { Landmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createInvestmentSnapshot } from "@/lib/api";
import { INVESTMENTS, INVESTMENT_MODAL } from "@/constants/test-ids";
import { parseBRLInput } from "@/lib/format";

export interface UpdateBalanceCardProps {
  pendingSnapshot: boolean;
  forceOpen?: boolean;
  onOpenHandled?: () => void;
  onChanged?: () => void;
}

export default function UpdateBalanceCard({
  pendingSnapshot,
  forceOpen,
  onOpenHandled,
  onChanged,
}: UpdateBalanceCardProps) {
  const [open, setOpenState] = useState(forceOpen || false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setOpen = (v: boolean) => {
    setOpenState(v);
    if (!v) onOpenHandled?.();
  };

  React.useEffect(() => {
    if (forceOpen) setOpenState(true);
  }, [forceOpen]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = parseBRLInput(value);
    if (!parsed || parsed <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    const now = new Date();
    setSubmitting(true);
    try {
      await createInvestmentSnapshot({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        value: parsed,
      });
      toast.success("Saldo atualizado");
      setOpen(false);
      setValue("");
      onChanged?.();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(
        Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao atualizar saldo",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-[#EAE7E1] rounded-2xl p-6 flex flex-col items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-[#EDF2ED] text-[#4A6B4A] flex items-center justify-center">
        <Landmark size={18} />
      </div>
      <div>
        <h3 className="font-display font-semibold text-[#1C1C19]">Atualizar saldo do banco</h3>
        <p className="text-sm text-[#6B6A65] mt-1">
          Uma atualização por mês. Use para registrar o saldo real da sua conta hoje.
        </p>
      </div>
      <button
        data-testid={INVESTMENTS.updateBalanceBtn}
        onClick={() => setOpen(true)}
        disabled={!pendingSnapshot}
        className="mt-1 bg-[#2D4238] text-white hover:bg-[#3C5749] rounded-full px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pendingSnapshot ? "Atualizar agora" : "Já atualizado este mês"}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid={INVESTMENT_MODAL.balanceDialog} className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">Atualizar saldo do mês</DialogTitle>
            <DialogDescription>
              Informe quanto você tem no banco hoje. O rendimento será calculado automaticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="balance-value">Valor atual (R$)</Label>
              <Input
                id="balance-value"
                data-testid={INVESTMENT_MODAL.balanceValue}
                inputMode="decimal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0,00"
                autoFocus
              />
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                data-testid={INVESTMENT_MODAL.balanceCancel}
                onClick={() => setOpen(false)}
                className="rounded-full px-5 py-2 text-sm font-medium hover:bg-[#F3F1ED] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid={INVESTMENT_MODAL.balanceSubmit}
                disabled={submitting}
                className="rounded-full bg-[#2D4238] text-white hover:bg-[#3C5749] px-5 py-2 text-sm font-medium transition-colors disabled:opacity-60"
              >
                {submitting ? "Salvando..." : "Salvar"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
