import React, { useState } from "react";
import { Plus, MoreHorizontal, Trash2, Pencil, Check, Clock, Repeat } from "lucide-react";
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
import {
  formatBRL,
  EXPENSE_TYPE_LABEL,
  EXPENSE_STATUS_LABEL,
  EXPENSE_TYPE_COLOR,
} from "@/lib/format";
import { createExpense, deleteExpense, updateExpense } from "@/lib/api";
import { DASHBOARD, MODAL } from "@/constants/testIds";

const EMPTY = { id: null, name: "", type: "FIXED", value: "", status: "PENDING" };

export default function ExpensesCard({ expenses, year, month, onChanged }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (next) => {
    if (!next) setForm(EMPTY);
    setOpen(next);
  };

  const startCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };

  const startEdit = (expense) => {
    setForm({
      id: expense.id,
      name: expense.name,
      type: expense.type,
      value: String(expense.value),
      status: expense.status,
    });
    setOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    const value = parseFloat(form.value.toString().replace(",", "."));
    if (!form.name.trim() || !value || value <= 0) {
      toast.error("Preencha nome e valor (> 0).");
      return;
    }
    setSubmitting(true);
    try {
      if (form.id) {
        await updateExpense(
          form.id,
          { name: form.name.trim(), value, status: form.status },
          year,
          month
        );
        toast.success("Despesa atualizada");
      } else {
        await createExpense({
          name: form.name.trim(),
          type: form.type,
          value,
          status: form.status,
          year,
          month,
        });
        toast.success("Despesa adicionada");
      }
      setOpen(false);
      onChanged?.();
    } catch (err) {
      toast.error("Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (item, scope = "month") => {
    try {
      await deleteExpense(item.id, year, month, scope);
      toast.success(
        scope === "all" ? "Removida permanentemente" : "Removida deste mês"
      );
      onChanged?.();
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  const toggleStatus = async (item) => {
    try {
      await updateExpense(
        item.id,
        { status: item.status === "PAID" ? "PENDING" : "PAID" },
        year,
        month
      );
      onChanged?.();
    } catch (err) {
      toast.error("Erro ao atualizar status");
    }
  };

  const total = expenses.reduce((acc, e) => acc + Number(e.value || 0), 0);

  return (
    <div className="bg-white border border-[#EAE7E1] rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-eyebrow">Despesas</div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1 tracking-tight">
            Saídas do mês
          </h2>
          <div className="text-sm text-[#6B6A65] mt-1">
            Total: <span className="font-medium text-[#1C1C19]">{formatBRL(total)}</span>
          </div>
        </div>
        <button
          data-testid={DASHBOARD.addExpense}
          onClick={startCreate}
          className="inline-flex items-center gap-2 bg-[#2D4238] text-white hover:bg-[#3C5749] rounded-full px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Adicionar
        </button>
      </div>

      <ul data-testid={DASHBOARD.expenseList} className="mt-6 divide-y divide-[#EAE7E1]">
        {expenses.length === 0 && (
          <li className="py-10 text-center text-sm text-[#9A9892]">
            Nenhuma despesa registrada neste mês.
          </li>
        )}
        {expenses.map((ex) => {
          const isPaid = ex.status === "PAID";
          return (
            <li
              key={ex.id}
              data-testid={DASHBOARD.expenseItem(ex.id)}
              className="py-4 flex items-center justify-between gap-3 animate-fade-up"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-white"
                  style={{ background: EXPENSE_TYPE_COLOR[ex.type] }}
                >
                  {ex.recurring ? <Repeat size={16} /> : <Plus size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[#1C1C19] truncate">{ex.name}</div>
                  <div className="text-xs text-[#6B6A65] uppercase tracking-wider">
                    {EXPENSE_TYPE_LABEL[ex.type]}
                    {ex.recurring ? " · Recorrente" : ""}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  data-testid={DASHBOARD.expenseToggleStatus(ex.id)}
                  onClick={() => toggleStatus(ex)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wider transition-colors ${
                    isPaid
                      ? "bg-[#EDF2ED] text-[#4A6B4A] hover:bg-[#dde6dd]"
                      : "bg-[#FDF6EA] text-[#C68B35] hover:bg-[#f5ead2]"
                  }`}
                >
                  {isPaid ? <Check size={12} /> : <Clock size={12} />}
                  {EXPENSE_STATUS_LABEL[ex.status]}
                </button>
                <div className="font-display font-semibold text-[#1C1C19] tabular-nums">
                  {formatBRL(ex.value)}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      data-testid={DASHBOARD.expenseDelete(ex.id)}
                      className="w-8 h-8 rounded-full hover:bg-[#F3F1ED] flex items-center justify-center text-[#6B6A65] transition-colors"
                      aria-label="Opções"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      data-testid={DASHBOARD.expenseEdit(ex.id)}
                      onClick={() => startEdit(ex)}
                    >
                      <Pencil size={14} className="mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(ex, "month")}>
                      <Trash2 size={14} className="mr-2" /> Remover deste mês
                    </DropdownMenuItem>
                    {ex.recurring && (
                      <DropdownMenuItem
                        data-testid={DASHBOARD.expenseDeleteAll(ex.id)}
                        onClick={() => onDelete(ex, "all")}
                        className="text-[#B34A3E]"
                      >
                        <Trash2 size={14} className="mr-2" /> Remover recorrência
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent data-testid={MODAL.expenseDialog} className="sm:max-w-[460px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight">
              {form.id ? "Editar despesa" : "Nova despesa"}
            </DialogTitle>
            <DialogDescription>
              Fixas e Cartão se repetem mensalmente. Avulsas aparecem só no mês cadastrado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-name">Nome</Label>
              <Input
                id="expense-name"
                data-testid={MODAL.expenseName}
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Aluguel"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                  disabled={!!form.id}
                >
                  <SelectTrigger data-testid={MODAL.expenseType}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">Fixa (recorrente)</SelectItem>
                    <SelectItem value="CARD">Cartão (recorrente)</SelectItem>
                    <SelectItem value="DETACHED">Avulsa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-value">Valor (R$)</Label>
                <Input
                  id="expense-value"
                  data-testid={MODAL.expenseValue}
                  inputMode="decimal"
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
              >
                <SelectTrigger data-testid={MODAL.expenseStatus}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="PAID">Paga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                data-testid={MODAL.expenseCancel}
                onClick={() => setOpen(false)}
                className="rounded-full px-5 py-2 text-sm font-medium hover:bg-[#F3F1ED] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid={MODAL.expenseSubmit}
                disabled={submitting}
                className="rounded-full bg-[#2D4238] text-white hover:bg-[#3C5749] px-5 py-2 text-sm font-medium transition-colors disabled:opacity-60"
              >
                {submitting ? "Salvando..." : form.id ? "Atualizar" : "Salvar"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
