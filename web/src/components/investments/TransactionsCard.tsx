import React, { useState } from "react";
import { Plus, Trash2, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatBRL, parseBRLInput, TRANSACTION_TYPE_LABEL } from "@/lib/format";
import { createInvestmentTransaction, deleteInvestmentTransaction } from "@/lib/api";
import { INVESTMENTS, INVESTMENT_MODAL } from "@/constants/test-ids";
import { InvestmentTransaction, TransactionType } from "@/dtos/investment";

export interface TransactionsCardProps {
  transactions: InvestmentTransaction[];
  onChanged?: () => void;
}

function todayParts() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

function toDateInputValue(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function TransactionsCard({ transactions, onChanged }: TransactionsCardProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const t = todayParts();
  const [form, setForm] = useState({
    type: "DEPOSIT" as TransactionType,
    value: "",
    date: toDateInputValue(t.year, t.month, t.day),
    note: "",
  });

  const reset = () => {
    const now = todayParts();
    setForm({
      type: "DEPOSIT",
      value: "",
      date: toDateInputValue(now.year, now.month, now.day),
      note: "",
    });
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = parseBRLInput(form.value);
    if (!value || value <= 0) {
      toast.error("Informe um valor maior que zero.");
      return;
    }
    const [year, month, day] = form.date.split("-").map(Number);

    setSubmitting(true);
    try {
      await createInvestmentTransaction({
        type: form.type,
        value,
        year,
        month,
        day,
        note: form.note.trim() || undefined,
      });
      toast.success(form.type === "DEPOSIT" ? "Depósito registrado" : "Retirada registrada");
      setOpen(false);
      reset();
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (item: InvestmentTransaction) => {
    try {
      await deleteInvestmentTransaction(item.id);
      toast.success("Removido");
      onChanged?.();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  return (
    <div className="bg-white border border-[#EAE7E1] rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-eyebrow">Movimentações</div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1 tracking-tight">
            Depósitos e retiradas
          </h2>
        </div>
        <button
          data-testid={INVESTMENTS.addTransactionBtn}
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-[#2D4238] text-white hover:bg-[#3C5749] rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <ul data-testid={INVESTMENTS.transactionList} className="mt-6 divide-y divide-[#EAE7E1] max-h-[320px] overflow-y-auto">
        {transactions.length === 0 && (
          <li className="py-10 text-center text-sm text-[#9A9892]">
            Nenhuma movimentação registrada ainda.
          </li>
        )}
        {transactions.map((t) => {
          const isDeposit = t.type === "DEPOSIT";
          return (
            <li key={t.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isDeposit ? "#EDF2ED" : "#F9EBEA",
                    color: isDeposit ? "#4A6B4A" : "#B34A3E",
                  }}
                >
                  {isDeposit ? <ArrowDownCircle size={16} /> : <ArrowUpCircle size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[#1C1C19] truncate">
                    {TRANSACTION_TYPE_LABEL[t.type]}
                  </div>
                  <div className="text-xs text-[#6B6A65]">
                    {String(t.day).padStart(2, "0")}/{String(t.month).padStart(2, "0")}/{t.year}
                    {t.note ? ` · ${t.note}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div
                  className="font-display font-semibold tabular-nums"
                  style={{ color: isDeposit ? "#4A6B4A" : "#B34A3E" }}
                >
                  {isDeposit ? "+" : "−"}
                  {formatBRL(Number(t.value))}
                </div>
                <button
                  data-testid={INVESTMENTS.transactionDelete(t.id)}
                  onClick={() => onDelete(t)}
                  className="w-7 h-7 rounded-full hover:bg-[#F3F1ED] flex items-center justify-center text-[#9A9892] hover:text-[#B34A3E] transition-colors"
                  aria-label="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
        <DialogContent data-testid={INVESTMENT_MODAL.transactionDialog} className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">Nova movimentação</DialogTitle>
            <DialogDescription>
              Registre um depósito ou uma retirada da sua conta.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v: TransactionType) => setForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger data-testid={INVESTMENT_MODAL.transactionType}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DEPOSIT">Depósito</SelectItem>
                  <SelectItem value="WITHDRAWAL">Retirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="tx-value">Valor (R$)</Label>
                <Input
                  id="tx-value"
                  data-testid={INVESTMENT_MODAL.transactionValue}
                  inputMode="decimal"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder="0,00"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tx-date">Data</Label>
                <Input
                  id="tx-date"
                  type="date"
                  data-testid={INVESTMENT_MODAL.transactionDate}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-note">Observação (opcional)</Label>
              <Input
                id="tx-note"
                data-testid={INVESTMENT_MODAL.transactionNote}
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="Ex: 13º salário"
              />
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                data-testid={INVESTMENT_MODAL.transactionCancel}
                onClick={() => setOpen(false)}
                className="rounded-full px-5 py-2 text-sm font-medium hover:bg-[#F3F1ED] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid={INVESTMENT_MODAL.transactionSubmit}
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
