export type ExportFormat = 'json' | 'csv' | 'xml' | 'sql'

export interface ExportOptions {
  pretty?: boolean
  delimiter?: string
  rootElement?: string
  rowElement?: string
  tableName?: string
}
