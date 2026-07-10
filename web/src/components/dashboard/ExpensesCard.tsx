import React, { useState, useCallback, useEffect } from "react";
import {
  Plus, MoreHorizontal, Trash2, Pencil, Check, Clock,
  CreditCard, Heart, DollarSign, Apple, Home, ShoppingCart, Zap, Tag, Bike, Car,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { createExpense, deleteExpense, updateExpense, fetchCategories } from "@/lib/api";
import { DASHBOARD, MODAL } from "@/constants/test-ids";
import { Expense, ExpenseStatus } from "@/dtos/expense";
import {
  formatBRL, EXPENSE_STATUS_LABEL,
  EXPENSE_COLOR_PALETTE, MONTHS_PT, parseBRLInput,
} from "@/lib/format";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon?: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  CreditCard, Heart, DollarSign, Apple, Home, ShoppingCart, Zap, Tag, Bike, Car,
};

export interface ExpensesCardProps {
  expenses: Expense[];
  year: number;
  month: number;
  onChanged?: () => void;
  categories?: Category[];
}

interface ExpenseFormState {
  id: string | null;
  categoryId: string;
  value: string;
  status: ExpenseStatus;
  color: string;
  hasEndDate: boolean;
  endYear: string;
  endYearMode: "preset" | "custom";
  endMonth: string;
}

const DEFAULT_COLOR = EXPENSE_COLOR_PALETTE[0].value;
const EMPTY: ExpenseFormState = {
  id: null,
  categoryId: "",
  value: "",
  status: "PENDING",
  color: DEFAULT_COLOR,
  hasEndDate: false,
  endYear: "",
  endYearMode: "preset",
  endMonth: "",
};

function ExpenseIcon({ color, categoryIcon }: { color?: string; categoryIcon?: string }) {
  const bg = color || "#2D4238";
  const IconComponent = categoryIcon && ICON_MAP[categoryIcon] ? ICON_MAP[categoryIcon] : Tag;
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
      style={{ background: bg }}
    >
      <IconComponent size={16} className="text-white" />
    </div>
  );
}

function sortExpenses(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    const aPaid = a.status === "PAID";
    const bPaid = b.status === "PAID";
    if (aPaid !== bPaid) return aPaid ? 1 : -1;
    return Number(b.value) - Number(a.value);
  });
}

const NEXT_5_YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);

export default function ExpensesCard({ expenses, year, month, onChanged, categories: categoriesFromProps = [] }: ExpensesCardProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<ExpenseFormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (categoriesFromProps && categoriesFromProps.length > 0) {
      const expenseCategories = categoriesFromProps.filter((c: Category) => c.type === "EXPENSE");
      setCategories(expenseCategories);
    } else {
      fetchCategories()
        .then((data) => {
          const expenseCategories = data.filter((c: Category) => c.type === "EXPENSE");
          setCategories(expenseCategories);
        })
        .catch(() => toast.error("Erro ao carregar categorias"));
    }
  }, [categoriesFromProps]);

  const handleOpenChange = useCallback((next: boolean) => {
    if (!next) setForm(EMPTY);
    setOpen(next);
  }, []);

  const startCreate = () => {
    setForm(EMPTY);
    setOpen(true);
  };

  const startEdit = (expense: Expense) => {
    setForm({
      id: expense.id,
      categoryId: expense.categoryId,
      value: String(expense.value),
      status: expense.status,
      color: expense.color || DEFAULT_COLOR,
      hasEndDate: !!(expense.endYear && expense.endMonth),
      endYear: expense.endYear ? String(expense.endYear) : "",
      endYearMode: "preset",
      endMonth: expense.endMonth ? String(expense.endMonth) : "",
    });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = parseBRLInput(form.value);

    if (!form.categoryId || !value || value <= 0) {
      toast.error("Selecione uma categoria e preencha um valor (> 0).");
      return;
    }

    let endYear: number | null = null;
    let endMonth: number | null = null;
    if (form.hasEndDate) {
      if (!form.endYear || !form.endMonth) {
        toast.error("Selecione mês e ano de término.");
        return;
      }
      endYear = parseInt(form.endYear, 10);
      endMonth = parseInt(form.endMonth, 10);
    }

    setSubmitting(true);
    try {
      if (form.id) {
        await updateExpense(
          form.id,
          {
            categoryId: form.categoryId,
            value,
            status: form.status,
            color: form.color,
            endYear,
            endMonth,
          },
          year,
          month,
        );
        toast.success("Despesa atualizada");
      } else {
        await createExpense({
          categoryId: form.categoryId,
          value,
          status: form.status,
          color: form.color,
          year,
          month,
          endYear,
          endMonth,
        });
        toast.success("Despesa adicionada");
      }
      setOpen(false);
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (item: Expense, scope: "month" | "all" = "month") => {
    try {
      await deleteExpense(item.id, year, month, scope);
      toast.success(scope === "all" ? "Removida permanentemente" : "Removida deste mês");
      onChanged?.();
    } catch {
      toast.error("Erro ao remover");
    }
  };

  const toggleStatus = async (item: Expense) => {
    try {
      await updateExpense(
        item.id,
        { status: item.status === "PAID" ? "PENDING" : "PAID" },
        year,
        month,
      );
      onChanged?.();
    } catch {
      toast.error("Erro ao atualizar status");
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  const getCategoryIcon = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.icon || "Tag";
  };

  const total = expenses.reduce((acc, e) => acc + Number(e.value || 0), 0);
  const sorted = sortExpenses(expenses);

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-[#EAE7E1] dark:border-[#333] rounded-2xl p-4 sm:p-6 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-eyebrow dark:text-[#a0a0a0]">Despesas</div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1 tracking-tight dark:text-white">
            Saídas do mês
          </h2>
          <div className="text-sm text-[#6B6A65] dark:text-[#a0a0a0] mt-1">
            Total: <span className="font-medium text-[#1C1C19] dark:text-white">{formatBRL(total)}</span>
          </div>
        </div>
        <button
          data-testid={DASHBOARD.addExpense}
          onClick={startCreate}
          className="inline-flex items-center gap-2 bg-[#ec0000] dark:bg-[#cc0000] text-white hover:bg-[#ff1111] dark:hover:bg-[#ec0000] rounded-full px-4 sm:px-5 py-2.5 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> <span className="hidden sm:inline">Adicionar</span>
        </button>
      </div>

      <ul data-testid={DASHBOARD.expenseList} className="divide-y divide-[#EAE7E1] dark:divide-[#333]">
        {sorted.length === 0 && (
          <li className="py-10 text-center text-sm text-[#9A9892] dark:text-[#707070]">
            Nenhuma despesa registrada neste mês.
          </li>
        )}
        {sorted.map((ex) => {
          const isPaid = ex.status === "PAID";
          return (
            <li
              key={ex.id}
              data-testid={DASHBOARD.expenseItem(ex.id)}
              className={`py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-3 transition-opacity ${
                isPaid ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <ExpenseIcon color={ex.color} categoryIcon={getCategoryIcon(ex.categoryId)} />
                <div className="min-w-0">
                  <div className="font-medium text-[#1C1C19] dark:text-white truncate text-sm sm:text-base">
                    {getCategoryName(ex.categoryId)}
                  </div>
                  <div className="text-xs text-[#6B6A65] dark:text-[#707070] uppercase tracking-wider">
                    {ex.recurring ? "Recorrente" : "Avulso"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                <button
                  data-testid={DASHBOARD.expenseToggleStatus(ex.id)}
                  onClick={() => toggleStatus(ex)}
                  className={`inline-flex items-center gap-1 sm:gap-1.5 rounded-full px-2 sm:px-3 py-1 text-xs font-medium uppercase tracking-wider transition-colors ${
                    isPaid
                      ? "bg-[#EDF2ED] dark:bg-[#1a3a1e] text-[#4A6B4A] dark:text-[#5a8c5e] hover:bg-[#dde6dd] dark:hover:bg-[#2a4a2e]"
                      : "bg-[#FDF6EA] dark:bg-[#3a2f1a] text-[#C68B35] dark:text-[#d9a043] hover:bg-[#f5ead2] dark:hover:bg-[#4a3f2a]"
                  }`}
                >
                  {isPaid ? <Check size={12} /> : <Clock size={12} />}
                  <span className="hidden sm:inline">{EXPENSE_STATUS_LABEL[ex.status]}</span>
                </button>
                <div className="font-display font-semibold text-[#1C1C19] dark:text-white tabular-nums text-sm sm:text-base">
                  {formatBRL(Number(ex.value))}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      data-testid={DASHBOARD.expenseDelete(ex.id)}
                      className="w-8 h-8 rounded-full hover:bg-[#F3F1ED] dark:hover:bg-[#2a2a2a] flex items-center justify-center text-[#6B6A65] dark:text-[#707070] transition-colors"
                      aria-label="Opções"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 dark:bg-[#1a1a1a] dark:border-[#333]">
                    {ex.status === "PENDING" && (
                      <DropdownMenuItem
                        data-testid={DASHBOARD.expenseEdit(ex.id)}
                        onClick={() => startEdit(ex)}
                        className="dark:text-white dark:hover:bg-[#2a2a2a]"
                      >
                        <Pencil size={14} className="mr-2" /> Editar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onDelete(ex, "month")} className="dark:text-white dark:hover:bg-[#2a2a2a]">
                      <Trash2 size={14} className="mr-2" /> Remover deste mês
                    </DropdownMenuItem>
                    {ex.recurring && (
                      <DropdownMenuItem
                        data-testid={DASHBOARD.expenseDeleteAll(ex.id)}
                        onClick={() => onDelete(ex, "all")}
                        className="text-[#B34A3E] dark:text-[#ff8a80] dark:hover:bg-[#2a2a2a]"
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
        <DialogContent
          data-testid={MODAL.expenseDialog}
          className="sm:max-w-[460px] rounded-2xl"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight dark:text-white">
              {form.id ? "Editar despesa" : "Nova despesa"}
            </DialogTitle>
            <DialogDescription className="dark:text-[#a0a0a0]">
              Despesas com data de término se repetem mensalmente até a data especificada.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger data-testid={MODAL.expenseType}>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
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
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v: ExpenseStatus) => setForm((f) => ({ ...f, status: v }))}
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
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Data de término</Label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({ ...f, hasEndDate: !f.hasEndDate, endYear: "", endMonth: "" }))
                  }
                  className="text-xs font-medium text-[#ec0000] dark:text-[#ff8a80] hover:underline"
                >
                  {form.hasEndDate ? "Remover término" : "Definir término"}
                </button>
              </div>
              {form.hasEndDate ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      value={form.endMonth}
                      onValueChange={(v) => setForm((f) => ({ ...f, endMonth: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS_PT.map((label, idx) => (
                          <SelectItem key={idx + 1} value={String(idx + 1)}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {form.endYearMode === "preset" ? (
                      <Select
                        value={form.endYear}
                        onValueChange={(v) => {
                          if (v === "other") {
                            setForm((f) => ({ ...f, endYearMode: "custom", endYear: "" }));
                          } else {
                            setForm((f) => ({ ...f, endYear: v }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                          {NEXT_5_YEARS.map((y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ))}
                          <SelectItem value="other">Outro...</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex gap-1">
                        <Input
                          inputMode="numeric"
                          value={form.endYear}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, endYear: e.target.value.replace(/\D/g, "") }))
                          }
                          placeholder="Ano"
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, endYearMode: "preset", endYear: "" }))}
                          className="text-xs text-[#6B6A65] dark:text-[#707070] hover:text-[#1C1C19] dark:hover:text-white px-1"
                          title="Voltar para lista"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#9A9892] dark:text-[#707070]">
                  Sem data definida, a despesa é criada apenas este mês.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cor da despesa</Label>
              <div data-testid="expense-color-picker" className="grid grid-cols-6 gap-2">
                {EXPENSE_COLOR_PALETTE.map((c) => {
                  const selected = form.color === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                      title={c.label}
                      aria-label={c.label}
                      aria-pressed={selected}
                      className={`h-8 w-full rounded-lg border transition-all duration-150 ${
                        selected
                          ? "ring-2 ring-offset-2 ring-[#ec0000] dark:ring-[#ff8a80] border-transparent scale-105"
                          : "border-[#EAE7E1] dark:border-[#333] hover:scale-105"
                      }`}
                      style={{ background: c.value }}
                    />
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <button
                type="button"
                data-testid={MODAL.expenseCancel}
                onClick={() => setOpen(false)}
                className="rounded-full px-5 py-2 text-sm font-medium hover:bg-[#F3F1ED] dark:hover:bg-[#2a2a2a] dark:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                data-testid={MODAL.expenseSubmit}
                disabled={submitting}
                className="rounded-full bg-[#ec0000] dark:bg-[#cc0000] text-white hover:bg-[#ff1111] dark:hover:bg-[#ec0000] px-5 py-2 text-sm font-medium transition-colors disabled:opacity-60"
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
