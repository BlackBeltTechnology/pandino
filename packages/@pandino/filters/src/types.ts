export type FilterOperator = 'or' | 'and' | 'not' | 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

export type FilterOperatorSymbols = '|' | '&' | '!' | '=' | '>' | '>=' | '<' | '<=';

export type FilterEvaluator = (data: any, query: string) => boolean;

export const FilterOperatorSymbolMapping: Record<FilterOperator, FilterOperatorSymbols> = {
  or: '|',
  and: '&',
  not: '!',
  eq: '=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
};

export interface FilterNode {
  operator?: FilterOperator;
  attribute?: string;
  children?: FilterNode[];
  value?: any;
  expression?: string;
}
