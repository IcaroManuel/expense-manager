import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { EventHub } from '../common/patterns/event-hub';

export interface SnapshotCreate {
  year: number;
  month: number;
  value: number;
}

export interface TransactionCreate {
  type: 'DEPOSIT' | 'WITHDRAWAL';
  value: number;
  year: number;
  month: number;
  day: number;
  note?: string;
}

export interface InvestmentsSummary {
  currentTotal: number;
  totalInvested: number;
  totalYield: number;
  pendingSnapshot: boolean;
}

export interface MonthlyYield {
  year: number;
  month: number;
  yield: number;
}

export const SNAPSHOT_REPOSITORY = 'SNAPSHOT_REPOSITORY';
export interface ISnapshotRepository {
  listAll(userId: string): Promise<any[]>;
  findByYearMonth(userId: string, year: number, month: number): Promise<any>;
  insert(snapshot: any): Promise<any>;
}

export const TRANSACTION_REPOSITORY = 'TRANSACTION_REPOSITORY';
export interface ITransactionRepository {
  listAll(userId: string): Promise<any[]>;
  insert(transaction: any): Promise<void>;
  findById(userId: string, id: string): Promise<any>;
  delete(userId: string, id: string): Promise<void>;
}

// Índice numérico simples pra comparar datas (year/month/day) sem precisar de objetos Date
function dateIndex(year: number, month: number, day = 1): number {
  return year * 372 + month * 31 + day;
}

// O snapshot só guarda year/month (sem dia), mas é criado em um dia específico do mês.
// Usamos o createdAt real para saber em que dia do mês ele foi registrado, em vez de
// assumir erroneamente que ele representa o fim do mês (dia 31). Isso evita tratar
// depósitos feitos DEPOIS do snapshot, mas no mesmo mês, como se já estivessem
// incluídos no valor informado.
function snapshotDateIndex(snapshot: { year: number; month: number; createdAt?: Date | string }): number {
  const day = snapshot.createdAt ? new Date(snapshot.createdAt).getDate() : 28;
  return dateIndex(snapshot.year, snapshot.month, day);
}

@Injectable()
export class InvestmentsService {
  constructor(
    @Inject(SNAPSHOT_REPOSITORY) private readonly snapshots: ISnapshotRepository,
    @Inject(TRANSACTION_REPOSITORY) private readonly transactions: ITransactionRepository,
    private readonly hub: EventHub,
  ) {}

  private sortedSnapshots(list: any[]) {
    return [...list].sort(
      (a, b) => dateIndex(a.year, a.month) - dateIndex(b.year, b.month),
    );
  }

  // Soma depósitos e subtrai retiradas
  private netValue(list: any[]): number {
    return Number(
      list
        .reduce(
          (acc, t) =>
            acc + (t.type === 'DEPOSIT' ? Number(t.value) : -Number(t.value)),
          0,
        )
        .toFixed(2),
    );
  }

  async getSummary(userId: string): Promise<InvestmentsSummary> {
    const allSnapshots = this.sortedSnapshots(await this.snapshots.listAll(userId));
    const allTransactions = await this.transactions.listAll(userId);

    // Ainda não cadastrou nenhum saldo: nada a calcular, sem aviso ainda
    if (allSnapshots.length === 0) {
      return {
        currentTotal: 0,
        totalInvested: this.netValue(allTransactions),
        totalYield: 0,
        pendingSnapshot: false,
      };
    }

    const first = allSnapshots[0];
    const last = allSnapshots[allSnapshots.length - 1];
    const lastIndex = snapshotDateIndex(last); // dia real em que o último snapshot foi registrado

    const transactionsAfterLast = allTransactions.filter(
      (t) => dateIndex(t.year, t.month, t.day) > lastIndex,
    );

    const currentTotal = Number(
      (Number(last.value) + this.netValue(transactionsAfterLast)).toFixed(2),
    );
    const totalInvested = this.netValue(allTransactions);
    const totalYield = Number(
      (currentTotal - Number(first.value) - totalInvested).toFixed(2),
    );

    const now = new Date();
    const hasCurrentMonth = await this.snapshots.findByYearMonth(
      userId,
      now.getFullYear(),
      now.getMonth() + 1,
    );

    return {
      currentTotal,
      totalInvested,
      totalYield,
      pendingSnapshot: !hasCurrentMonth,
    };
  }

  async getYieldHistory(userId: string): Promise<MonthlyYield[]> {
    const allSnapshots = this.sortedSnapshots(await this.snapshots.listAll(userId));
    const allTransactions = await this.transactions.listAll(userId);

    if (allSnapshots.length === 0) return [];

    // Primeiro snapshot = marco zero, rendimento sempre 0
    const result: MonthlyYield[] = [
      { year: allSnapshots[0].year, month: allSnapshots[0].month, yield: 0 },
    ];

    for (let i = 1; i < allSnapshots.length; i++) {
      const prev = allSnapshots[i - 1];
      const curr = allSnapshots[i];
      const prevIndex = snapshotDateIndex(prev);
      const currIndex = snapshotDateIndex(curr);

      const between = allTransactions.filter((t) => {
        const idx = dateIndex(t.year, t.month, t.day);
        return idx > prevIndex && idx <= currIndex;
      });

      const periodYield = Number(
        (Number(curr.value) - Number(prev.value) - this.netValue(between)).toFixed(2),
      );

      result.push({ year: curr.year, month: curr.month, yield: periodYield });
    }

    return result;
  }

  async listTransactions(userId: string): Promise<any[]> {
    const list = await this.transactions.listAll(userId);
    return list.sort(
      (a, b) => dateIndex(b.year, b.month, b.day) - dateIndex(a.year, a.month, a.day),
    );
  }

  async createSnapshot(userId: string, payload: SnapshotCreate): Promise<any> {
    const existing = await this.snapshots.findByYearMonth(
      userId,
      payload.year,
      payload.month,
    );
    if (existing) {
      throw new ConflictException(
        'Já existe uma atualização de saldo para este mês.',
      );
    }

    const snapshot = {
      id: crypto.randomUUID(),
      userId,
      year: payload.year,
      month: payload.month,
      value: payload.value,
    };

    const created = await this.snapshots.insert(snapshot);
    this.hub.publish({ name: 'investment.snapshot_created', payload: created });
    return created;
  }

  async createTransaction(userId: string, payload: TransactionCreate): Promise<any> {
    const transaction = {
      id: crypto.randomUUID(),
      userId,
      type: payload.type,
      value: payload.value,
      year: payload.year,
      month: payload.month,
      day: payload.day,
      note: payload.note,
    };

    await this.transactions.insert(transaction);
    this.hub.publish({ name: 'investment.transaction_created', payload: transaction });
    return transaction;
  }

  async deleteTransaction(userId: string, id: string): Promise<boolean> {
    const existing = await this.transactions.findById(userId, id);
    if (!existing) return false;

    await this.transactions.delete(userId, id);
    this.hub.publish({ name: 'investment.transaction_deleted', payload: { id } });
    return true;
  }
}
