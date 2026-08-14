export interface AnalyticsCounter {
  id: string;
  totalGenerations: number;
  byGenerator: {
    users: number;
    addresses: number;
    banking: number;
    "credit-cards": number;
    payloads: number;
  };
  totalRecords: number;
  totalExports: number;
  byExportFormat: {
    json: number;
    csv: number;
    xml: number;
    sql: number;
  };
}

export function createEmptyAnalytics(id: string): AnalyticsCounter {
  return {
    id,
    totalGenerations: 0,
    byGenerator: {
      users: 0,
      addresses: 0,
      banking: 0,
      "credit-cards": 0,
      payloads: 0,
    },
    totalRecords: 0,
    totalExports: 0,
    byExportFormat: {
      json: 0,
      csv: 0,
      xml: 0,
      sql: 0,
    },
  };
}
