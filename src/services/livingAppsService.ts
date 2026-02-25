// AUTOMATICALLY GENERATED SERVICE
import { APP_IDS } from '@/types/app';
import type { UrlAnalyse } from '@/types/app';

// Base Configuration
const API_BASE_URL = 'https://my.living-apps.de/rest';

// --- HELPER FUNCTIONS ---
export function extractRecordId(url: string | null | undefined): string | null {
  if (!url) return null;
  // Extrahiere die letzten 24 Hex-Zeichen mit Regex
  const match = url.match(/([a-f0-9]{24})$/i);
  return match ? match[1] : null;
}

export function createRecordUrl(appId: string, recordId: string): string {
  return `https://my.living-apps.de/rest/apps/${appId}/records/${recordId}`;
}

async function callApi(method: string, endpoint: string, data?: any) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Nutze Session Cookies für Auth
    body: data ? JSON.stringify(data) : undefined
  });
  if (!response.ok) throw new Error(await response.text());
  // DELETE returns often empty body or simple status
  if (method === 'DELETE') return true;
  return response.json();
}

/** Upload a file to LivingApps. Returns the file URL for use in record fields. */
export async function uploadFile(file: File | Blob, filename?: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file, filename ?? (file instanceof File ? file.name : 'upload'));
  const res = await fetch(`${API_BASE_URL}/files`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) throw new Error(`File upload failed: ${res.status}`);
  const data = await res.json();
  return data.url;
}

export class LivingAppsService {
  // --- URL_ANALYSE ---
  static async getUrlAnalyse(): Promise<UrlAnalyse[]> {
    const data = await callApi('GET', `/apps/${APP_IDS.URL_ANALYSE}/records`);
    return Object.entries(data).map(([id, rec]: [string, any]) => ({
      record_id: id, ...rec
    }));
  }
  static async getUrlAnalyseEntry(id: string): Promise<UrlAnalyse | undefined> {
    const data = await callApi('GET', `/apps/${APP_IDS.URL_ANALYSE}/records/${id}`);
    return { record_id: data.id, ...data };
  }
  static async createUrlAnalyseEntry(fields: UrlAnalyse['fields']) {
    return callApi('POST', `/apps/${APP_IDS.URL_ANALYSE}/records`, { fields });
  }
  static async updateUrlAnalyseEntry(id: string, fields: Partial<UrlAnalyse['fields']>) {
    return callApi('PATCH', `/apps/${APP_IDS.URL_ANALYSE}/records/${id}`, { fields });
  }
  static async deleteUrlAnalyseEntry(id: string) {
    return callApi('DELETE', `/apps/${APP_IDS.URL_ANALYSE}/records/${id}`);
  }

}