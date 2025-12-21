'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { apiGet, apiPost, MwOrder, PagedResult } from '@/lib/mw-api';
import { PageHeader } from '@/components/page-header';
import { StatCards } from '@/components/stat-cards';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PagedResult<MwOrder> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<MwOrder | null>(null);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.limit));
  }, [data]);

  const refresh = () => {
    setLoading(true);
    setError(null);
    apiGet<PagedResult<MwOrder>>('/api/orders', { page, limit, search })
      .then(setData)
      .catch((e) => setError(e?.message ?? 'Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search]);

  const stats = useMemo(() => {
    const total = data?.total ?? 0;
    const showing = data?.items.length ?? 0;
    const totalAmount = (data?.items ?? []).reduce((s, o) => s + Number(o.totalAmount || 0), 0);
    return [
      { label: 'Toplam Sipariş', value: String(total), hint: 'ERP listesi (stage=ERP)' },
      { label: 'Gösterilen', value: String(showing), hint: `Sayfa ${page}` },
      { label: 'Sayfa Tutarı', value: totalAmount.toFixed(2), hint: 'Bu sayfadaki toplam' },
    ];
  }, [data, page]);

  async function sendToLogistics(id: string) {
    setSendingId(id);
    setError(null);
    try {
      await apiPost(`/api/orders/${id}/send-to-logistics`);
      refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send to logistics');
    } finally {
      setSendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Siparişler"
        subtitle="RabbitMQ event’leriyle gelen siparişler (ERP stage) — lojistiğe göndermek için satırdan aksiyon ver."
      >
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Ara (orderId, status)…"
            className="w-full md:w-[320px]"
          />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={refresh}>
              Refresh
            </Button>
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <div className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </div>
            <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </PageHeader>

      <StatCards items={stats} />

      <Card>
        <CardContent className="p-0">
          <div className="border-b p-4 text-sm text-muted-foreground">
            “Lojistiğe Gönder” dediğinde sipariş bu listeden çıkar ve “Lojistik” listesine gider.
          </div>
          {error ? <div className="p-4 text-sm text-destructive">{error}</div> : null}

          {loading ? (
            <div className="p-4">
              <Skeleton className="h-10 w-full" />
              <div className="mt-3 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : null}

          {!loading && data ? (
            data.items.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider">Sipariş</TableHead>
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider">Kullanıcı</TableHead>
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider">Durum</TableHead>
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider text-right">Tutar</TableHead>
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider">Adres</TableHead>
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider text-right">Aksiyon</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((o) => (
                      <TableRow key={o.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="py-2 font-mono text-[11px] font-medium text-primary">
                          <Dialog>
                            <DialogTrigger asChild>
                              <button
                                className="text-left hover:underline"
                                onClick={() => setSelected(o)}
                              >
                                {o.erpId.split('-')[0]}...
                              </button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[720px]">
                              <DialogHeader>
                                <DialogTitle className="text-[16px]">Sipariş Detayı</DialogTitle>
                              </DialogHeader>
                              {selected ? (
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold">{selected.status}</Badge>
                                    <div className="text-[11px] text-muted-foreground font-mono">{selected.erpId}</div>
                                    <div className="ml-auto text-[13px] font-bold">
                                      {Number(selected.totalAmount).toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="rounded-md border p-3 text-[12px]">
                                    <div className="font-bold text-foreground/70 uppercase text-[10px] tracking-wider mb-1">Kullanıcı</div>
                                    <div className="text-muted-foreground">
                                      {selected.user?.name} ({selected.user?.email})
                                    </div>
                                  </div>
                                  <div className="rounded-md border p-3 text-[12px]">
                                    <div className="font-bold text-foreground/70 uppercase text-[10px] tracking-wider mb-1">Adres</div>
                                    {selected.shippingAddress ? (
                                      <div className="text-muted-foreground">
                                        {selected.shippingAddress.fullName} — {selected.shippingAddress.line1},{' '}
                                        {selected.shippingAddress.city} {selected.shippingAddress.country}
                                      </div>
                                    ) : (
                                      <div className="text-muted-foreground">—</div>
                                    )}
                                  </div>
                                  <div className="rounded-md border overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-muted/50 h-8">
                                          <TableHead className="text-[10px] uppercase font-bold">SKU</TableHead>
                                          <TableHead className="text-[10px] uppercase font-bold">Ürün</TableHead>
                                          <TableHead className="text-[10px] uppercase font-bold text-right">Adet</TableHead>
                                          <TableHead className="text-[10px] uppercase font-bold text-right">Tutar</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {(selected.items ?? []).map((it) => (
                                          <TableRow key={it.id} className="h-8">
                                            <TableCell className="font-mono text-[10px] py-1">{it.sku}</TableCell>
                                            <TableCell className="text-[11px] py-1">{it.name}</TableCell>
                                            <TableCell className="text-right text-[11px] py-1">{it.quantity}</TableCell>
                                            <TableCell className="text-right text-[11px] py-1 font-mono">{Number(it.lineTotal).toFixed(2)}</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>
                              ) : null}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-[13px] font-semibold leading-none">{o.user?.name ?? '—'}</div>
                          <div className="text-[11px] text-muted-foreground mt-1">{o.user?.email ?? ''}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-bold uppercase tracking-tight">
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-[12px] font-medium">
                          {Number(o.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-2 text-[12px]">
                          {o.shippingAddress ? (
                            <div className="leading-tight">
                              <div className="font-medium text-foreground/80">{o.shippingAddress.fullName}</div>
                              <div className="text-muted-foreground text-[11px]">
                                {o.shippingAddress.city} • {o.shippingAddress.country}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[11px] font-bold uppercase tracking-tight"
                            onClick={() => sendToLogistics(o.id)}
                            disabled={sendingId === o.id}
                          >
                            {sendingId === o.id ? 'Gönderiliyor…' : 'Lojistiğe Gönder'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-sm text-muted-foreground">Kayıt bulunamadı.</div>
              </div>
            )
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
