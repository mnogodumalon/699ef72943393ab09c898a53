import { useState, useEffect } from 'react';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { UrlAnalyse } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { UrlAnalyseDialog } from '@/components/dialogs/UrlAnalyseDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN } from '@/config/ai-features';

export default function UrlAnalysePage() {
  const [records, setRecords] = useState<UrlAnalyse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UrlAnalyse | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UrlAnalyse | null>(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      setRecords(await LivingAppsService.getUrlAnalyse());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: UrlAnalyse['fields']) {
    await LivingAppsService.createUrlAnalyseEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: UrlAnalyse['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateUrlAnalyseEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteUrlAnalyseEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.some(item => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
      if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
      return String(v).toLowerCase().includes(s);
    });
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title="URL-Analyse"
      subtitle={`${records.length} URL-Analyse in the system`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Add
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search URL-Analyse..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL eingeben</TableHead>
              <TableHead>Extrahierter Originallink</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.eingabe_url ?? '—'}</span></TableCell>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.original_link ?? '—'}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-16 text-muted-foreground">
                  {search ? 'No results found.' : 'No URL-Analyse yet. Add one!'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <UrlAnalyseDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        enablePhotoScan={AI_PHOTO_SCAN['UrlAnalyse']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete URL-Analyse"
        description="Are you sure? This action cannot be undone."
      />
    </PageShell>
  );
}