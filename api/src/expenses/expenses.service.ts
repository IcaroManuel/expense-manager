import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { EventHub } from '../common/patterns/event-hub';
import { type IRecurrenceSkipRepository, SKIP_REPOSITORY } from '../billings/billings.service';

export interface ExpenseCreate {
  name: string;
  type: string;
  status: string;
  color?: string;
  value: number;
  year: number;
  month: number;
  endYear?: number | null;
  endMonth?: number | null;
}
export interface ExpenseUpdate {
  name?: string;
  value?: number;
  status?: string;
  color?: string;
  endYear?: number | null;
  endMonth?: number | null;
}

export const EXPENSE_REPOSITORY = 'EXPENSE_REPOSITORY';
export interface IExpenseRepository {
  listForMonth(userId: string, year: number, month: number): Promise<any[]>;
  insert(expense: any): Promise<void>;
  updateFields(userId: string, expenseId: string, fields: any): Promise<any>;
  findById(userId: string, expenseId: string): Promise<any>;
  delete(userId: string, expenseId: string): Promise<void>;
}

// Cartão agora também é recorrente (corrige inconsistência com domain/enums.ts)
const RECURRING_EXPENSE_TYPES = ['FIXED', 'CARD'];
const PENDING_STATUS = 'PENDING';

@Injectable()
export class ExpensesService {
  constructor(
    @Inject(EXPENSE_REPOSITORY) private readonly repo: IExpenseRepository,
    @Inject(SKIP_REPOSITORY) private readonly skips: IRecurrenceSkipRepository,
    private readonly hub: EventHub,
  ) {}

  private nowIso(): string {
    return new Date().toISOString();
  }

  private materializeExpense(doc: any, year: number, month: number): any {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      value: doc.value,
      status: doc.status || PENDING_STATUS,
      color: doc.color || '#2D4238',
      recurring: doc.recurring || false,
      endYear: doc.endYear ?? null,
      endMonth: doc.endMonth ?? null,
      year,
      month,
      created_at: doc.created_at || this.nowIso(),
      updated_at: doc.updated_at || this.nowIso(),
    };
  }

  async listForMonth(userId: string, year: number, month: number): Promise<any[]> {
    const raw = await this.repo.listForMonth(userId, year, month);
    const skipped = await this.skips.listForMonth(userId, 'expense', year, month);

    const out = [];
    for (const d of raw) {
      if (d.recurring && skipped.includes(d.id)) {
        continue;
      }
      out.push(this.materializeExpense(d, year, month));
    }

    out.sort((a, b) => a.type.localeCompare(b.type) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return out;
  }

  async create(userId: string, payload: ExpenseCreate): Promise<any> {
    const isRecurring = RECURRING_EXPENSE_TYPES.includes(payload.type);

    if (isRecurring && payload.endYear != null && payload.endMonth != null) {
      const endIndex = payload.endYear * 12 + payload.endMonth;
      const startIndex = payload.year * 12 + payload.month;
      if (endIndex < startIndex) {
        throw new BadRequestException('A data de término não pode ser anterior ao mês inicial.');
      }
    }

    const expense = {
      id: crypto.randomUUID(),
      userId,
      name: payload.name,
      type: payload.type,
      value: payload.value,
      status: payload.status,
      color: payload.color,
      recurring: isRecurring,
      startYear: isRecurring ? payload.year : null,
      startMonth: isRecurring ? payload.month : null,
      endYear: isRecurring ? (payload.endYear ?? null) : null,
      endMonth: isRecurring ? (payload.endMonth ?? null) : null,
      year: isRecurring ? null : payload.year,
      month: isRecurring ? null : payload.month,
    };

    await this.repo.insert(expense);
    this.hub.publish({ name: 'expense.created', payload: expense });

    return this.materializeExpense(expense, payload.year, payload.month);
  }

  async update(userId: string, expenseId: string, payload: ExpenseUpdate, year: number, month: number): Promise<any | null> {
    const fields: any = {};
    if (payload.name !== undefined) fields.name = payload.name;
    if (payload.value !== undefined) fields.value = payload.value;
    if (payload.status !== undefined) fields.status = payload.status;
    if (payload.color !== undefined) fields.color = payload.color;
    if (payload.endYear !== undefined) fields.endYear = payload.endYear;
    if (payload.endMonth !== undefined) fields.endMonth = payload.endMonth;

    const updated = await this.repo.updateFields(userId, expenseId, fields);
    if (!updated) return null;

    this.hub.publish({ name: 'expense.updated', payload: updated });
    return this.materializeExpense(updated, year, month);
  }

  async deleteForMonth(userId: string, expenseId: string, year: number, month: number): Promise<boolean> {
    const doc = await this.repo.findById(userId, expenseId);
    if (!doc) return false;

    if (doc.recurring) {
      await this.skips.addSkip(userId, 'expense', expenseId, year, month);
    } else {
      await this.repo.delete(userId, expenseId);
    }

    this.hub.publish({ name: 'expense.deleted', payload: { id: expenseId, year, month } });
    return true;
  }

  async deleteTemplate(userId: string, expenseId: string): Promise<boolean> {
    const doc = await this.repo.findById(userId, expenseId);
    if (!doc) return false;

    await this.repo.delete(userId, expenseId);
    await this.skips.deleteAllForEntity(userId, 'expense', expenseId);

    this.hub.publish({ name: 'expense.template_deleted', payload: { id: expenseId } });
    return true;
  }
}
