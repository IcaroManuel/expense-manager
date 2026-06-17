import React, { useState } from "react";
import { Plus, Trash2, MoreHorizontal, Repeat } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { formatBRL, BILLING_TYPE_LABEL } from "@/lib/format";
import { createBilling, deleteBilling } from "@/lib/api";
import { DASHBOARD, MODAL } from "@/constants/test-ids";
import { Billing, BillingType } from "@/dtos/billing";

export interface BillingsCardProps {
  billings: Billing[];
  year: number;
  month: number;
  onChanged?: () => void;
}

export default function BillingsCard({ billings, year, month, onChanged }: BillingsCardProps) {
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({ name: "", type: "SALARY" as BillingType, value: "" });
  const [submitting, setSubmitting] = useState(false);

  const reset = () => setForm({ name: "", type: "SALARY", value: "" });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = parseFloat(form.value.toString().replace(",", "."));

    if (!form.name.trim() || !value || value <= 0) {
      toast.error("Preencha nome e valor (> 0).");
      return;
    }

    setSubmitting(true);

    try {
      await createBilling({
        name: form.name.trim(),
        type: form.type,
        value,
        year,
        month,
      });
      toast.success("Faturamento adicionado");
      setOpen(false);
      reset();
      onChanged?.();
    } catch (err) {
      toast.error("Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (item: Billing, scope: "month" | "all" = "month") => {
    try {
      await deleteBilling(item.id, year, month, scope);
      toast.success(scope === "all" ? "Removido permanentemente" : "Removido deste mês");
      onChanged?.();
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  const total = billings.reduce((acc, b) => acc + Number(b.value || 0), 0);

  return (
    <div className="bg-white border border-[#EAE7E1] rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-eyebrow">Faturamento</div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1 tracking-tight">
            Entradas do mês
          </h2>
          <div className="text-sm text-[#6B6A65] mt-1">
            Total: <span className="font-medium text-[#1C1C19]">{formatBRL(total)}</span>
          </div>
        </div>
        <button
          data-testid={DASHBOARD.addBilling}
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 bg-[#2D4238] text-white hover:bg-[#3C5749] rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <ul data-testid={DASHBOARD.billingList} className="mt-6 divide-y divide-[#EAE7E1]">
        {billings.length === 0 && (
          <li className="py-10 text-center text-sm text-[#9A9892]">
            Nenhum faturamento registrado neste mês.
          </li>
        )}
        {billings.map((b) => (
          <li
            key={b.id}
            data-testid={DASHBOARD.billingItem(b.id)}
            className="py-4 flex items-center justify-between animate-fade-up"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: b.type === "SALARY" ? "#EDF2ED" : "#FDF6EA",
                  color: b.type === "SALARY" ? "#4A6B4A" : "#C68B35",
                }}
              >
                {b.recurring ? <Repeat size={16} /> : <Plus size={16} />}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-[#1C1C19] truncate">{b.name}</div>
                <div className="text-xs text-[#6B6A65] uppercase tracking-wider">
                  {BILLING_TYPE_LABEL[b.type]}
                  {b.recurring ? " · Recorrente" : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="font-display font-semibold text-[#1C1C19]">{formatBRL(Number(b.value))}</div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid={DASHBOARD.billingDelete(b.id)}
                    className="w-8 h-8 rounded-full hover:bg-[#F3F1ED] flex items-center justify-center text-[#6B6A65] transition-colors"
                    aria-label="Opções"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => onDelete(b, "month")} className="text-[#1C1C19]">
                    <Trash2 size={14} className="mr-2" /> Remover deste mês
                  </DropdownMenuItem>
                  {b.recurring && (
                    <DropdownMenuItem
                      data-testid={DASHBOARD.billingDeleteAll(b.id)}
                      onClick={() => onDelete(b, "all")}
                      className="text-[#B34A3E]"
                    >
                      <Trash2 size={14} className="mr-2" /> Remover recorrência
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid={MODAL.billingDialog} className="sm:max-w-[440px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">Novo faturamento</DialogTitle>
            <DialogDescription>
              Salários se repetem automaticamente todos os meses. Prêmios aparecem apenas no mês
              cadastrado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="billing-name">Nome</Label>
              <Input
                id="billing-name"
                data-testid={MODAL.billingName}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Salário empresa X"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: BillingType) => setForm((f) => ({ ...f, type: v }))}
                >
                  <SelectTrigger data-testid={MODAL.billingType}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALARY">Salário (recorrente)</SelectItem>
                    <SelectItem value="AWARD">Prêmio (avulso)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="billing-value">Valor (R$)</Label>
                <Input
                  id="billing-value"
                  data-testid={MODAL.billingValue}
                  inputMode="decimal"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                data-testid={MODAL.billingCancel}
                onClick={() => setOpen(false)}
                className="rounded-full px-5 py-2 text-sm font-medium hover:bg-[#F3F1ED] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid={MODAL.billingSubmit}
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
