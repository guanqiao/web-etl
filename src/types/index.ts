// ETL Core Types

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'null' | 'unknown';

export interface DataColumn {
  id: string;
  name: string;
  type: DataType;
  index: number;
  visible?: boolean;
}

export interface DataRow {
  [key: string]: unknown;
}

export interface DataSet {
  id: string;
  name: string;
  columns: DataColumn[];
  rows: DataRow[];
  rowCount: number;
  columnCount: number;
  createdAt: number;
  updatedAt: number;
}

export type SourceType = 'file' | 'url' | 'database' | 'manual' | 'sample';

export interface DataSource {
  id: string;
  type: SourceType;
  name: string;
  config: SourceConfig;
  datasetId?: string;
}

export type SourceConfig =
  | FileSourceConfig
  | UrlSourceConfig
  | DatabaseSourceConfig
  | ManualSourceConfig
  | SampleSourceConfig;

export interface FileSourceConfig {
  fileType: 'csv' | 'json' | 'excel' | 'xml';
  fileName: string;
  encoding?: string;
  delimiter?: string;
  sheetName?: string;
}

export interface UrlSourceConfig {
  url: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  jsonPath?: string;
}

export interface DatabaseSourceConfig {
  dbType: 'sqlite' | 'mysql' | 'postgresql' | 'sqlserver';
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  query?: string;
  tableName?: string;
}

export interface ManualSourceConfig {
  initialData?: DataRow[];
}

export interface SampleSourceConfig {
  sampleId: string;
}

export type TransformType =
  | 'addColumn'
  | 'deleteColumn'
  | 'renameColumn'
  | 'reorderColumn'
  | 'splitColumn'
  | 'mergeColumn'
  | 'removeDuplicates'
  | 'removeEmptyRows'
  | 'fillNulls'
  | 'trim'
  | 'changeCase'
  | 'convertType'
  | 'filter'
  | 'sort'
  | 'aggregate'
  | 'formula'
  | 'join'
  | 'union'
  | 'pivot';

export interface TransformStep {
  id: string;
  type: TransformType;
  name: string;
  enabled: boolean;
  config: TransformConfig;
  order: number;
}

export type TransformConfig =
  | AddColumnConfig
  | DeleteColumnConfig
  | RenameColumnConfig
  | ReorderColumnConfig
  | SplitColumnConfig
  | MergeColumnConfig
  | RemoveDuplicatesConfig
  | RemoveEmptyRowsConfig
  | FillNullsConfig
  | TrimConfig
  | ChangeCaseConfig
  | ConvertTypeConfig
  | FilterConfig
  | SortConfig
  | AggregateConfig
  | FormulaConfig
  | JoinConfig
  | UnionConfig
  | PivotConfig;

export interface AddColumnConfig {
  columnName: string;
  valueType: 'empty' | 'constant' | 'formula' | 'sequence';
  constantValue?: unknown;
  formula?: string;
  startValue?: number;
}

export interface DeleteColumnConfig {
  columnIds: string[];
}

export interface RenameColumnConfig {
  renames: { oldName: string; newName: string }[];
}

export interface ReorderColumnConfig {
  columnOrder: string[];
}

export interface SplitColumnConfig {
  columnId: string;
  splitBy: 'delimiter' | 'position';
  delimiter?: string;
  position?: number;
  newColumnNames: string[];
}

export interface MergeColumnConfig {
  columnIds: string[];
  separator: string;
  newColumnName: string;
}

export interface RemoveDuplicatesConfig {
  columnIds?: string[];
}

export interface RemoveEmptyRowsConfig {
  columns?: string[];
}

export interface FillNullsConfig {
  strategy: 'fixed' | 'forward' | 'backward' | 'mean' | 'median' | 'mode';
  fixedValue?: unknown;
  columnIds?: string[];
}

export interface TrimConfig {
  columnIds?: string[];
  trimType: 'both' | 'left' | 'right';
}

export interface ChangeCaseConfig {
  columnIds: string[];
  caseType: 'upper' | 'lower' | 'title' | 'capitalize';
}

export interface ConvertTypeConfig {
  conversions: { columnId: string; targetType: DataType; format?: string }[];
}

export interface FilterCondition {
  columnId: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'isNull' | 'isNotNull';
  value?: unknown;
}

export interface FilterConfig {
  conditions: FilterCondition[];
  logic: 'AND' | 'OR';
}

export interface SortConfig {
  sorts: { columnId: string; direction: 'asc' | 'desc' }[];
}

export interface AggregateConfig {
  groupBy: string[];
  aggregations: { columnId: string; function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last'; alias: string }[];
}

export interface FormulaConfig {
  newColumnName: string;
  formula: string;
}

export interface JoinConfig {
  joinType: 'inner' | 'left' | 'right' | 'full';
  rightDatasetId: string;
  leftKey: string;
  rightKey: string;
}

export interface UnionConfig {
  datasetIds: string[];
}

export interface PivotConfig {
  rowFields: string[];
  columnField?: string;
  valueField: string;
  aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export type TargetType = 'file' | 'database';

export interface DataTarget {
  id: string;
  type: TargetType;
  name: string;
  config: TargetConfig;
}

export type TargetConfig = FileTargetConfig | DatabaseTargetConfig;

export interface FileTargetConfig {
  fileType: 'csv' | 'json' | 'excel' | 'xml';
  fileName: string;
  encoding?: string;
  delimiter?: string;
  includeHeader?: boolean;
}

export interface DatabaseTargetConfig {
  dbType: 'sqlite' | 'mysql' | 'postgresql' | 'sqlserver';
  connectionString?: string;
  tableName: string;
  operation: 'create' | 'append' | 'replace';
  mapping?: { sourceColumn: string; targetColumn: string }[];
}

export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  source: DataSource;
  transforms: TransformStep[];
  target?: DataTarget;
  createdAt: number;
  updatedAt: number;
}

export interface AppState {
  datasets: DataSet[];
  currentDatasetId?: string;
  pipelines: Pipeline[];
  currentPipelineId?: string;
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
}

export interface Statistics {
  rowCount: number;
  columnCount: number;
  nullCount: number;
  uniqueCounts: Record<string, number>;
  typeDistribution: Record<string, number>;
}
