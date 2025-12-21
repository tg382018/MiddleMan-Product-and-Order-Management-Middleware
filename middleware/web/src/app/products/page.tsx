'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiGet, MwProduct, PagedResult } from '@/lib/mw-api';
import { PageHeader } from '@/components/page-header';
import { StatCards } from '@/components/stat-cards';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PagedResult<MwProduct> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.limit));
  }, [data]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    apiGet<PagedResult<MwProduct>>('/api/products', { page, limit, search })
      .then((res) => {
        if (!alive) return;
        setData(res);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message ?? 'Failed to load products');
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [page, limit, search]);

  const stats = useMemo(() => {
    const total = data?.total ?? 0;
    const showing = data?.items.length ?? 0;
    return [
      { label: 'Toplam Ürün', value: String(total), hint: 'Middleware DB' },
      { label: 'Gösterilen', value: String(showing), hint: `Sayfa ${page}` },
      { label: 'Limit', value: String(limit), hint: 'Sayfa başına' },
    ];
  }, [data, page, limit]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ürünler"
        subtitle="ERP’den cron ile senkronlanan güncel ürün listesi (middleware DB)."
      >
        <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Ara (SKU, ad)…"
              className="w-full md:w-[320px]"
            />
          </div>
          <div className="flex items-center gap-2">
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
          {error ? <div className="p-4 text-sm text-destructive">{error}</div> : null}

          {loading ? (
            <div className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-[240px]" />
                <Skeleton className="h-4 w-[180px]" />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          ) : null}

          {!loading && data ? (
            data.items.length ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Ürün</TableHead>
                      <TableHead className="text-right">Stok</TableHead>
                      <TableHead className="text-right">Fiyat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                        <TableCell>
                          <div className="font-medium">{p.name}</div>
                          {p.description ? (
                            <div className="text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">{p.stock}</TableCell>
                        <TableCell className="text-right">{Number(p.price).toFixed(2)}</TableCell>
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


