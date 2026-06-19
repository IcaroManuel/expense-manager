export interface TotalStrategy {
  calculate(items: any[]): number;
}

export class SumValueStrategy implements TotalStrategy {
  calculate(items: any[]): number {
    return Number(
      items.reduce((acc, item) => acc + Number(item.value || 0), 0).toFixed(2),
    );
  }
}

export class FilteredSumStrategy implements TotalStrategy {
  constructor(
    private readonly field: string,
    private readonly equals: any,
  ) {}

  calculate(items: any[]): number {
    return Number(
      items
        .filter((i) => i[this.field] === this.equals)
        .reduce((acc, item) => acc + Number(item.value || 0), 0)
        .toFixed(2),
    );
  }
}

export class CommittedPercentageStrategy {
  calculate(totalIncome: number, totalExpenses: number): number {
    if (totalIncome <= 0) {
      return 0.0;
    }
    return Number(((totalExpenses / totalIncome) * 100.0).toFixed(2));
  }
}

export class GroupByTypeStrategy {
  calculate(items: any[]): { type: string; value: number }[] {
    const bucket: Record<string, number> = {};

    for (const it of items) {
      const t = it.type || 'OTHER';
      bucket[t] = (bucket[t] || 0.0) + Number(it.value || 0.0);
    }

    return Object.entries(bucket).map(([k, v]) => ({
      type: k,
      value: Number(v.toFixed(2)),
    }));
  }
}
