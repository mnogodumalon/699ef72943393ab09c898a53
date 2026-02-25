// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface UrlAnalyse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    eingabe_url?: string;
    original_link?: string;
  };
}

export const APP_IDS = {
  URL_ANALYSE: '699ef71749797b3e287a6ed8',
} as const;

// Helper Types for creating new records
export type CreateUrlAnalyse = UrlAnalyse['fields'];