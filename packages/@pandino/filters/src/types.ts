export type GroupOperator = 'or' | 'and' | 'not';

export type ComparisonOperator = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

export type FilterOperator = GroupOperator | ComparisonOperator;

export type FilterOperatorSymbols = '|' | '&' | '!' | '=' | '>' | '>=' | '<' | '<=';

export type SemVerOperator = ComparisonOperator;

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
