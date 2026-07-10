"use client";

import { useEffect, useState } from "react";
import {
  Plus, Trash2, MoreHorizontal, CreditCard, Heart, DollarSign, Apple,
  Home, ShoppingCart, Zap, Tag, Bike, Car,
} from "lucide-react";
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
import { fetchCategories, createCategory, deleteCategory } from "@/lib/api";
import { CATEGORY_TYPE_LABEL } from "@/lib/format";

const AVAILABLE_ICONS = [
  { name: "CreditCard", label: "Cartão", icon: CreditCard },
  { name: "Heart", label: "Saúde", icon: Heart },
  { name: "DollarSign", label: "Dinheiro", icon: DollarSign },
  { name: "Apple", label: "Alimentação", icon: Apple },
  { name: "Home", label: "Casa", icon: Home },
  { name: "ShoppingCart", label: "Compras", icon: ShoppingCart },
  { name: "Zap", label: "Energia", icon: Zap },
  { name: "Bike", label: "Moto", icon: Bike },
  { name: "Car", label: "Carro", icon: Car },
  { name: "Tag", label: "Geral", icon: Tag },
];

interface Category {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "EXPENSE" as "INCOME" | "EXPENSE", icon: "Tag" });
  const [submitting, setSubmitting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (err) {
      toast.error("Erro ao carregar categorias");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Digite um nome para a categoria");
      return;
    }

    setSubmitting(true);
    try {
      await createCategory({
        name: form.name.trim(),
        type: form.type,
        icon: form.icon,
      });
      toast.success("Categoria criada");
      setOpen(false);
      setForm({ name: "", type: "EXPENSE", icon: "Tag" });
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao criar categoria");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (category: Category) => {
    try {
      await deleteCategory(category.id);
      toast.success("Categoria removida");
      refresh();
    } catch (err) {
      toast.error("Erro ao remover categoria");
    }
  };

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");
  const incomeCategories = categories.filter((c) => c.type === "INCOME");

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight dark:text-white">
              Categorias
            </h1>
            <p className="text-[#6B6A65] dark:text-[#a0a0a0] text-sm sm:text-base mt-1">
              Gerencie suas categorias de entrada e saída.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 bg-[#820AD1] dark:bg-[#6b008b] text-white hover:bg-[#9629e8] dark:hover:bg-[#820AD1] rounded-full px-4 sm:px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> <span className="hidden sm:inline">Adicionar</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10 text-[#6B6A65] dark:text-[#707070]">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Saídas */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-[#EAE7E1] dark:border-[#333] rounded-2xl p-4 sm:p-6 transition-colors">
              <h2 className="text-eyebrow dark:text-[#a0a0a0]">Categorias</h2>
              <h3 className="font-display text-lg font-semibold mt-1 mb-4 dark:text-white">Saídas</h3>

              {expenseCategories.length === 0 ? (
                <p className="text-sm text-[#9A9892] dark:text-[#707070]">Nenhuma categoria de saída criada.</p>
              ) : (
                <ul className="space-y-2">
                  {expenseCategories.map((cat) => (
                    <li
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-[#F9F8F6] dark:bg-[#2a2a2a] rounded-lg border border-[#EAE7E1] dark:border-[#333] transition-colors"
                    >
                      <span className="text-sm font-medium text-[#1C1C19] dark:text-white">{cat.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-full hover:bg-[#EAE7E1] dark:hover:bg-[#333] flex items-center justify-center text-[#6B6A65] dark:text-[#707070] transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:bg-[#1a1a1a] dark:border-[#333]">
                          <DropdownMenuItem
                            onClick={() => onDelete(cat)}
                            className="text-[#B34A3E] dark:text-[#ff8a80] dark:hover:bg-[#2a2a2a]"
                          >
                            <Trash2 size={14} className="mr-2" /> Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Entradas */}
            <div className="bg-white dark:bg-[#1a1a1a] border border-[#EAE7E1] dark:border-[#333] rounded-2xl p-4 sm:p-6 transition-colors">
              <h2 className="text-eyebrow dark:text-[#a0a0a0]">Categorias</h2>
              <h3 className="font-display text-lg font-semibold mt-1 mb-4 dark:text-white">Entradas</h3>

              {incomeCategories.length === 0 ? (
                <p className="text-sm text-[#9A9892] dark:text-[#707070]">Nenhuma categoria de entrada criada.</p>
              ) : (
                <ul className="space-y-2">
                  {incomeCategories.map((cat) => (
                    <li
                      key={cat.id}
                      className="flex items-center justify-between p-3 bg-[#F9F8F6] dark:bg-[#2a2a2a] rounded-lg border border-[#EAE7E1] dark:border-[#333] transition-colors"
                    >
                      <span className="text-sm font-medium text-[#1C1C19] dark:text-white">{cat.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 rounded-full hover:bg-[#EAE7E1] dark:hover:bg-[#333] flex items-center justify-center text-[#6B6A65] dark:text-[#707070] transition-colors">
                            <MoreHorizontal size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:bg-[#1a1a1a] dark:border-[#333]">
                          <DropdownMenuItem
                            onClick={() => onDelete(cat)}
                            className="text-[#B34A3E] dark:text-[#ff8a80] dark:hover:bg-[#2a2a2a]"
                          >
                            <Trash2 size={14} className="mr-2" /> Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl dark:bg-[#1a1a1a] dark:border-[#333]">
          <DialogHeader>
            <DialogTitle className="font-display tracking-tight dark:text-white">Nova categoria</DialogTitle>
            <DialogDescription className="dark:text-[#a0a0a0]">
              Crie categorias para organizar suas entradas e saídas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Nome</Label>
              <Input
                id="category-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Salário fixo"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v: "INCOME" | "EXPENSE") => setForm((f) => ({ ...f, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Entrada</SelectItem>
                  <SelectItem value="EXPENSE">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-4 gap-2">
                {AVAILABLE_ICONS.map((iconOption) => {
                  const Icon = iconOption.icon;
                  const isSelected = form.icon === iconOption.name;
                  return (
                    <button
                      key={iconOption.name}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icon: iconOption.name }))}
                      title={iconOption.label}
                      className={`flex items-center justify-center p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? "border-[#820AD1] dark:border-[#9629e8] bg-[#820AD1]/10 dark:bg-[#820AD1]/20"
                          : "border-[#EAE7E1] dark:border-[#333] hover:border-[#820AD1] dark:hover:border-[#820AD1]"
                      }`}
                    >
                      <Icon size={20} className={isSelected ? "text-[#820AD1] dark:text-[#9629e8]" : "text-[#6B6A65] dark:text-[#a0a0a0]"} />
                    </button>
                  );
                })}
              </div>
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-5 py-2 text-sm font-medium hover:bg-[#F3F1ED] dark:hover:bg-[#2a2a2a] dark:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#820AD1] dark:bg-[#6b008b] text-white hover:bg-[#9629e8] dark:hover:bg-[#820AD1] px-5 py-2 text-sm font-medium transition-colors disabled:opacity-60"
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
