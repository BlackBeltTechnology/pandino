export type evaluateFilter = (data: any, query: string) => boolean;

export type FilterOperator = 'or' | 'and' | 'not' | 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

export interface FilterNode {
  operator?: FilterOperator;
  attribute?: string;
  children?: FilterNode[];
  value?: any;
  expression?: string;
}
