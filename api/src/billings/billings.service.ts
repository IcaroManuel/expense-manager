import { Injectable, Inject } from '@nestjs/common';
import { EventHub } from '../common/patterns/event-hub';

// Tipos baseados nas entidades do Domain
export interface BillingCreate {
  name: string;
  type: string;
  value: number;
  year: number;
  month: number;
}
export interface BillingUpdate {
  name?: string;
  value?: number;
}

// Tokens de injeção e Interfaces para os Repositórios
export const BILLING_REPOSITORY = 'BILLING_REPOSITORY';
export interface IBillingRepository {
  listForMonth(userId: string, year: number, month: number): Promise<any[]>;
  insert(billing: any): Promise<void>;
  updateFields(userId: string, billingId: string, fields: any): Promise<any>;
  findById(userId: string, billingId: string): Promise<any>;
  delete(userId: string, billingId: string): Promise<void>;
}

export const SKIP_REPOSITORY = 'SKIP_REPOSITORY';
export interface IRecurrenceSkipRepository {
  listForMonth(
    userId: string,
    entityType: string,
    year: number,
    month: number,
  ): Promise<string[]>;
  addSkip(
    userId: string,
    entityType: string,
    entityId: string,
    year: number,
    month: number,
  ): Promise<void>;
  deleteAllForEntity(
    userId: string,
    entityType: string,
    entityId: string,
  ): Promise<void>;
}

const RECURRING_BILLING_TYPES = ['SALARY']; // Idealmente virá do Enum de Domain

@Injectable()
export class BillingsService {
  constructor(
    @Inject(BILLING_REPOSITORY) private readonly repo: IBillingRepository,
    @Inject(SKIP_REPOSITORY) private readonly skips: IRecurrenceSkipRepository,
    private readonly hub: EventHub,
  ) {}

  private nowIso(): string {
    return new Date().toISOString();
  }

  private materializeBilling(doc: any, year: number, month: number): any {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      value: doc.value,
      recurring: doc.recurring || false,
      year,
      month,
      created_at: doc.created_at || this.nowIso(),
      updated_at: doc.updated_at || this.nowIso(),
    };
  }

  async listForMonth(
    userId: string,
    year: number,
    month: number,
  ): Promise<any[]> {
    const raw = await this.repo.listForMonth(userId, year, month);
    const skipped = await this.skips.listForMonth(
      userId,
      'billing',
      year,
      month,
    );

    const out = [];
    for (const d of raw) {
      if (d.recurring && skipped.includes(d.id)) {
        continue;
      }
      out.push(this.materializeBilling(d, year, month));
    }

    out.sort(
      (a, b) =>
        a.type.localeCompare(b.type) ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return out;
  }

  async create(userId: string, payload: BillingCreate): Promise<any> {
    const isRecurring = RECURRING_BILLING_TYPES.includes(payload.type);

    const billing = {
      id: crypto.randomUUID(), // Temporário até a injeção da Entity
      userId,
      name: payload.name,
      type: payload.type,
      value: payload.value,
      recurring: isRecurring,
      startYear: isRecurring ? payload.year : null,
      startMonth: isRecurring ? payload.month : null,
      year: isRecurring ? null : payload.year,
      month: isRecurring ? null : payload.month,
    };

    await this.repo.insert(billing);
    this.hub.publish({ name: 'billing.created', payload: billing });

    return this.materializeBilling(billing, payload.year, payload.month);
  }

  async update(
    userId: string,
    billingId: string,
    payload: BillingUpdate,
    year: number,
    month: number,
  ): Promise<any | null> {
    const fields: any = {};
    if (payload.name !== undefined) fields.name = payload.name;
    if (payload.value !== undefined) fields.value = payload.value;

    const updated = await this.repo.updateFields(userId, billingId, fields);
    if (!updated) return null;

    this.hub.publish({ name: 'billing.updated', payload: updated });
    return this.materializeBilling(updated, year, month);
  }

  async deleteForMonth(
    userId: string,
    billingId: string,
    year: number,
    month: number,
  ): Promise<boolean> {
    const doc = await this.repo.findById(userId, billingId);
    if (!doc) return false;

    if (doc.recurring) {
      await this.skips.addSkip(userId, 'billing', billingId, year, month);
    } else {
      await this.repo.delete(userId, billingId);
    }

    this.hub.publish({
      name: 'billing.deleted',
      payload: { id: billingId, year, month },
    });
    return true;
  }

  async deleteTemplate(userId: string, billingId: string): Promise<boolean> {
    const doc = await this.repo.findById(userId, billingId);
    if (!doc) return false;

    await this.repo.delete(userId, billingId);
    await this.skips.deleteAllForEntity(userId, 'billing', billingId);

    this.hub.publish({
      name: 'billing.template_deleted',
      payload: { id: billingId },
    });
    return true;
  }
}
