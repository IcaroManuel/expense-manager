import React, { useState, useEffect } from "react";
import { Plus, Trash2, MoreHorizontal, DollarSign } from "lucide-react";
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
import { formatBRL, parseBRLInput } from "@/lib/format";
import { createBilling, deleteBilling, fetchCategories } from "@/lib/api";
import { DASHBOARD, MODAL } from "@/constants/test-ids";
import { Billing } from "@/dtos/billing";
import SummaryCards from "./SummaryCards";
import { Summary } from "@/dtos/summary";

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
}

export interface BillingsCardProps {
  billings: Billing[];
  year: number;
  month: number;
  onChanged?: () => void;
  summary: Summary;
  previousSummary: Summary | null;
  categories?: Category[];
}

export default function BillingsCard({
  billings,
  year,
  month,
  onChanged,
  summary,
  previousSummary,
  categories: categoriesFromProps = [],
}: BillingsCardProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    categoryId: "",
    description: "",
    value: "",
    recurring: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (categoriesFromProps && categoriesFromProps.length > 0) {
      const incomeCategories = categoriesFromProps.filter((c: Category) => c.type === "INCOME");
      setCategories(incomeCategories);
    } else {
      fetchCategories()
        .then((data) => {
          const incomeCategories = data.filter((c: Category) => c.type === "INCOME");
          setCategories(incomeCategories);
        })
        .catch(() => toast.error("Erro ao carregar categorias"));
    }
  }, [categoriesFromProps]);

  const reset = () => setForm({ categoryId: "", description: "", value: "", recurring: false });

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    setOpen(next);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = parseBRLInput(form.value);

    if (!form.categoryId || !value || value <= 0) {
      toast.error("Selecione uma categoria e preencha um valor (> 0).");
      return;
    }

    setSubmitting(true);
    try {
      await createBilling({
        categoryId: form.categoryId,
        description: form.description.trim() || null,
        value,
        recurring: form.recurring,
        year,
        month,
      });
      toast.success("Entrada adicionada");
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
      toast.success(scope === "all" ? "Removida permanentemente" : "Removida deste mês");
      onChanged?.();
    } catch (err) {
      toast.error("Erro ao remover");
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)?.name || categoryId;
  };

  const total = billings.reduce((acc, b) => acc + Number(b.value || 0), 0);

  return (
    <div className="">
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#EAE7E1] dark:border-[#333] rounded-2xl p-4 sm:p-6 h-max transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-eyebrow dark:text-[#a0a0a0]">Faturamento</div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold mt-1 tracking-tight dark:text-white">
              Entradas do mês
            </h2>
            <div className="text-sm text-[#6B6A65] dark:text-[#a0a0a0] mt-1">
              Total: <span className="font-medium text-[#1C1C19] dark:text-white">{formatBRL(total)}</span>
            </div>
          </div>
          <button
            data-testid={DASHBOARD.addBilling}
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 bg-[#5a8c5e] dark:bg-[#4a7c4e] text-white hover:bg-[#6b9d6f] dark:hover:bg-[#5a8c5e] rounded-full px-4 sm:px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>

        <ul data-testid={DASHBOARD.billingList} className="mt-6 divide-y divide-[#EAE7E1] dark:divide-[#333]">
          {billings.length === 0 && (
            <li className="py-10 text-center text-sm text-[#9A9892] dark:text-[#707070]">
              Nenhuma entrada registrada neste mês.
            </li>
          )}
          {billings.map((b) => (
            <li
              key={b.id}
              data-testid={DASHBOARD.billingItem(b.id)}
              className="py-3 sm:py-4 flex items-center justify-between animate-fade-up"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
                      ? "#1a3a1e"
                      : "#EDF2ED",
                    color: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
                      ? "#5a8c5e"
                      : "#4A6B4A",
                  }}
                >
                  <DollarSign size={16} />
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[#1C1C19] dark:text-white truncate text-sm sm:text-base">
                    {getCategoryName(b.categoryId)}
                  </div>
                  <div className="text-xs text-[#6B6A65] dark:text-[#707070] uppercase tracking-wider">
                    {b.recurring ? "Recorrente" : "Avulso"}
                    {b.description ? ` · ${b.description}` : ""}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-display font-semibold text-[#1C1C19] dark:text-white text-sm sm:text-base tabular-nums">
                  {formatBRL(Number(b.value))}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      data-testid={DASHBOARD.billingDelete(b.id)}
                      className="w-8 h-8 rounded-full hover:bg-[#F3F1ED] dark:hover:bg-[#2a2a2a] flex items-center justify-center text-[#6B6A65] dark:text-[#707070] transition-colors"
                      aria-label="Opções"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 dark:bg-[#1a1a1a] dark:border-[#333]">
                    <DropdownMenuItem onClick={() => onDelete(b, "month")} className="text-[#1C1C19] dark:text-white dark:hover:bg-[#2a2a2a]">
                      <Trash2 size={14} className="mr-2" /> Remover deste mês
                    </DropdownMenuItem>
                    {b.recurring && (
                      <DropdownMenuItem
                        data-testid={DASHBOARD.billingDeleteAll(b.id)}
                        onClick={() => onDelete(b, "all")}
                        className="text-[#B34A3E] dark:text-[#ff8a80] dark:hover:bg-[#2a2a2a]"
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

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent
            data-testid={MODAL.billingDialog}
            className="sm:max-w-[440px] rounded-2xl"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="font-display tracking-tight dark:text-white">Nova entrada</DialogTitle>
              <DialogDescription className="dark:text-[#a0a0a0]">
                Registre suas entradas selecionando uma categoria e marcando se é recorrente.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger data-testid={MODAL.billingType}>
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

              <div className="space-y-2">
                <Label htmlFor="billing-description">Descrição (opcional)</Label>
                <Input
                  id="billing-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Ex: Bônus, extra..."
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="billing-recurring"
                  checked={form.recurring}
                  onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))}
                  className="w-4 h-4 rounded border-[#EAE7E1] cursor-pointer"
                />
                <Label htmlFor="billing-recurring" className="cursor-pointer">
                  Recorrente mensalmente
                </Label>
              </div>

              <DialogFooter className="pt-2">
                <button
                  type="button"
                  data-testid={MODAL.billingCancel}
                  onClick={() => setOpen(false)}
                  className="rounded-full px-5 py-2 text-sm font-medium hover:bg-[#F3F1ED] dark:hover:bg-[#2a2a2a] dark:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid={MODAL.billingSubmit}
                  disabled={submitting}
                  className="rounded-full bg-[#5a8c5e] dark:bg-[#4a7c4e] text-white hover:bg-[#6b9d6f] dark:hover:bg-[#5a8c5e] px-5 py-2 text-sm font-medium transition-colors disabled:opacity-60"
                >
                  {submitting ? "Salvando..." : "Salvar"}
                </button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <SummaryCards summary={summary} previousSummary={previousSummary} />
    </div>
  );
}
