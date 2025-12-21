'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet, MwOrder, PagedResult } from '@/lib/mw-api';
import { PageHeader } from '@/components/page-header';
import { StatCards } from '@/components/stat-cards';
import { io, Socket } from 'socket.io-client';

const LOGISTICS_STATUS_LABELS: Record<string, string> = {
  PAKET_HAZIRLANIYOR: 'Paket Hazırlanıyor',
  MERKEZ_SUBEDE: 'Merkez Şubede',
  SEHIRE_ULASTI: 'Şehre Ulaştı',
  DAGITIMDA: 'Dağıtımda',
  TESLIM_EDILDI: 'Teslim Edildi',
  IPTAL_OLDU: 'İptal Edildi',
};

const LOGISTICS_STATUS_COLORS: Record<string, string> = {
  PAKET_HAZIRLANIYOR: 'bg-blue-100 text-blue-700 border-blue-200',
  MERKEZ_SUBEDE: 'bg-purple-100 text-purple-700 border-purple-200',
  SEHIRE_ULASTI: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  DAGITIMDA: 'bg-orange-100 text-orange-700 border-orange-200',
  TESLIM_EDILDI: 'bg-green-100 text-green-700 border-green-200',
  IPTAL_OLDU: 'bg-red-100 text-red-700 border-red-200',
};

export default function LogisticsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PagedResult<MwOrder> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    apiGet<PagedResult<MwOrder>>('/api/orders', { page, limit, search, stage: 'LOGISTICS' })
      .then(setData)
      .catch((e) => setError(e?.message ?? 'Failed to load logistics orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [page, limit, search]);

  useEffect(() => {
    const socket: Socket = io('http://localhost:3002/logistics');

    socket.on('connect', () => {
      console.log('Connected to logistics websocket');
    });

    socket.on('statusUpdated', (payload: { orderId: string; status: string }) => {
      console.log('Real-time status update received:', payload);
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === payload.orderId ? { ...item, logisticsStatus: payload.status } : item
          ),
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const stats = useMemo(() => {
    const total = data?.total ?? 0;
    const delivered = data?.items.filter(o => o.logisticsStatus === 'TESLIM_EDILDI').length ?? 0;
    const inTransit = data?.items.filter(o => ['MERKEZ_SUBEDE', 'SEHIRE_ULASTI', 'DAGITIMDA'].includes(o.logisticsStatus || '')).length ?? 0;

    return [
      { label: 'Lojistikteki Siparişler', value: String(total), hint: 'Lojistik sistemine aktarılanlar' },
      { label: 'Yoldakiler', value: String(inTransit), hint: 'Dağıtım ve transfer sürecinde' },
      { label: 'Teslim Edilenler', value: String(delivered), hint: 'Başarıyla tamamlananlar' },
    ];
  }, [data]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lojistik Takibi"
        subtitle="Lojistik sisteminden gelen anlık durum güncellemelerini buradan takip edebilirsiniz."
      >
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Sipariş ID veya durum ara…"
            className="w-full md:w-[320px]"
          />
        </div>
      </PageHeader>

      <StatCards items={stats} />

      <Card>
        <CardContent className="p-0">
          {error ? <div className="p-4 text-sm text-destructive">{error}</div> : null}

          {loading ? (
            <div className="p-4">
              <Skeleton className="h-10 w-full" />
              <div className="mt-3 space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
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
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider">Müşteri</TableHead>
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider">Lojistik Durumu</TableHead>
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider">Şehir</TableHead>
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider text-right">Tutar</TableHead>
                      <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider text-right">Son Güncelleme</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((o) => (
                      <TableRow key={o.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="py-2 font-mono text-[11px] font-medium text-primary">
                          {o.erpId.split('-')[0]}...
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-[13px] font-semibold leading-none">{o.user?.name ?? '—'}</div>
                          <div className="text-[11px] text-muted-foreground mt-1">{o.user?.email ?? ''}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-2 py-0.5 h-auto font-bold uppercase tracking-tight ${LOGISTICS_STATUS_COLORS[o.logisticsStatus || ''] || 'bg-slate-100'}`}
                          >
                            {LOGISTICS_STATUS_LABELS[o.logisticsStatus || ''] || o.logisticsStatus || 'Bekliyor'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-[12px]">
                          {o.shippingAddress?.city ?? '—'}
                        </TableCell>
                        <TableCell className="py-2 text-right font-mono text-[12px] font-medium">
                          {Number(o.totalAmount).toFixed(2)}
                        </TableCell>
                        <TableCell className="py-2 text-right text-[11px] text-muted-foreground">
                          {new Date(o.updatedAt).toLocaleString('tr-TR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="text-sm text-muted-foreground">Lojistik aşamasında sipariş bulunamadı.</div>
              </div>
            )
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
