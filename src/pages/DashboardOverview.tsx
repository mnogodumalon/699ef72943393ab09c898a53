import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { UrlAnalyse } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { extract } from '@/lib/ai';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Link2,
  Scissors,
  ClipboardPaste,
  ExternalLink,
  Copy,
  Trash2,
  Sparkles,
  CheckCheck,
  Clock,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function DashboardOverview() {
  const { urlAnalyse, loading, error, fetchAll } = useDashboardData();

  const [inputUrl, setInputUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ original: string; extracted: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UrlAnalyse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sortedHistory = useMemo(
    () => [...urlAnalyse].sort((a, b) => b.createdat.localeCompare(a.createdat)),
    [urlAnalyse]
  );

  const handleExtract = useCallback(async () => {
    if (!inputUrl.trim()) return;
    setIsExtracting(true);
    setExtractError(null);
    setLastResult(null);

    try {
      // Use AI to extract the real original URL from tracking/redirect URLs
      const result = await extract<{ original_link: string }>(
        inputUrl.trim(),
        `{"original_link": "string — the clean destination URL, stripped of all tracking parameters (utm_*, fbclid, gclid, etc.) and redirect wrappers. Return only the final destination URL."}`
      );

      const extracted = result.original_link?.trim() || inputUrl.trim();
      setLastResult({ original: inputUrl.trim(), extracted });

      await LivingAppsService.createUrlAnalyseEntry({
        eingabe_url: inputUrl.trim(),
        original_link: extracted,
      });
      setInputUrl('');
      fetchAll();
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Extraktion fehlgeschlagen');
    } finally {
      setIsExtracting(false);
    }
  }, [inputUrl, fetchAll]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputUrl(text);
    } catch {
      // clipboard not available, ignore
    }
  }, []);

  const handleCopy = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await LivingAppsService.deleteUrlAnalyseEntry(deleteTarget.record_id);
      fetchAll();
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, fetchAll]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* Hero: Tool Workspace */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Scissors size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Link-Extraktor</h1>
            <p className="text-xs text-muted-foreground">Tracking-Parameter entfernen, Original-URL extrahieren</p>
          </div>
        </div>
      </div>

      {/* Input card */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Link2 size={14} className="text-muted-foreground" />
            URL eingeben
          </label>
          <div className="relative">
            <Textarea
              placeholder="https://example.com/page?utm_source=newsletter&utm_medium=email&fbclid=..."
              value={inputUrl}
              onChange={(e) => { setInputUrl(e.target.value); setExtractError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleExtract(); }}
              className="min-h-[90px] resize-none text-sm font-mono pr-3 leading-relaxed"
              disabled={isExtracting}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleExtract}
            disabled={!inputUrl.trim() || isExtracting}
            className="gap-2"
          >
            {isExtracting ? (
              <>
                <Sparkles size={15} className="animate-spin" />
                Extrahiere…
              </>
            ) : (
              <>
                <Sparkles size={15} />
                Original-Link extrahieren
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePaste}
            disabled={isExtracting}
            className="gap-1.5 text-xs"
          >
            <ClipboardPaste size={13} />
            Einfügen
          </Button>
          {inputUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setInputUrl(''); setExtractError(null); setLastResult(null); }}
              className="text-xs text-muted-foreground"
            >
              Leeren
            </Button>
          )}
        </div>

        {extractError && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{extractError}</span>
          </div>
        )}

        {/* Inline result */}
        {lastResult && (
          <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
              <CheckCheck size={13} />
              Ergebnis
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Eingabe</span>
                <p className="text-xs font-mono text-muted-foreground break-all leading-relaxed line-through decoration-muted-foreground/50">
                  {lastResult.original}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Bereinigter Link</span>
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-sm font-mono text-foreground break-all leading-relaxed font-medium">
                    {lastResult.extracted}
                  </p>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleCopy(lastResult.extracted, 'last')}
                      title="Kopieren"
                    >
                      {copiedId === 'last' ? <CheckCheck size={13} className="text-primary" /> : <Copy size={13} />}
                    </Button>
                    <a
                      href={lastResult.extracted}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Öffnen">
                        <ExternalLink size={13} />
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Clock size={14} className="text-muted-foreground" />
            Verlauf
            {sortedHistory.length > 0 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">
                {sortedHistory.length}
              </Badge>
            )}
          </h2>
        </div>

        {sortedHistory.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 py-12 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Link2 size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Noch keine Einträge</p>
              <p className="text-xs text-muted-foreground mt-0.5">Gib oben eine URL ein und klicke auf "Extrahieren"</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedHistory.map((entry) => (
              <HistoryCard
                key={entry.record_id}
                entry={entry}
                copiedId={copiedId}
                onCopy={handleCopy}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Eintrag löschen"
        description="Möchtest du diesen Verlaufseintrag wirklich löschen?"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function HistoryCard({
  entry,
  copiedId,
  onCopy,
  onDelete,
}: {
  entry: UrlAnalyse;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  onDelete: (entry: UrlAnalyse) => void;
}) {
  const hasExtracted = !!entry.fields.original_link && entry.fields.original_link !== entry.fields.eingabe_url;

  return (
    <div className="group rounded-xl border bg-card px-4 py-3.5 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-2">
          {/* Input URL */}
          {entry.fields.eingabe_url && (
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground/60">Eingabe</span>
              <p className="text-xs font-mono text-muted-foreground break-all leading-relaxed truncate">
                {entry.fields.eingabe_url}
              </p>
            </div>
          )}

          {/* Extracted URL */}
          {entry.fields.original_link && (
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-medium text-primary/70">
                {hasExtracted ? 'Bereinigt' : 'Link'}
              </span>
              <div className="flex items-center gap-1.5">
                <p className="flex-1 text-sm font-mono font-medium text-foreground break-all leading-relaxed">
                  {entry.fields.original_link}
                </p>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onCopy(entry.fields.original_link!, entry.record_id)}
                    title="Kopieren"
                  >
                    {copiedId === entry.record_id
                      ? <CheckCheck size={13} className="text-primary" />
                      : <Copy size={13} />}
                  </Button>
                  <a href={entry.fields.original_link} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7" title="Öffnen">
                      <ExternalLink size={13} />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-0.5">
            <span className="text-[10px] text-muted-foreground/60">{formatDate(entry.createdat)}</span>
            {hasExtracted && (
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal text-primary border-primary/30">
                bereinigt
              </Badge>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 mt-0.5"
          onClick={() => onDelete(entry)}
          title="Löschen"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Skeleton className="h-10 w-56" />
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <Skeleton className="h-[90px] rounded-lg" />
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-24" />
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}
