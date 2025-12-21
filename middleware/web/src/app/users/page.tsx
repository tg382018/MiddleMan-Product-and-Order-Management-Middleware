'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { apiGet, MwUserStats } from '@/lib/mw-api';
import { PageHeader } from '@/components/page-header';
import { StatCards } from '@/components/stat-cards';

export default function UsersPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<MwUserStats[]>([]);
    const [error, setError] = useState<string | null>(null);

    const refresh = () => {
        setLoading(true);
        setError(null);
        apiGet<MwUserStats[]>('/api/users/stats')
            .then(setStats)
            .catch((e) => setError(e?.message ?? 'Failed to load user stats'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        refresh();
    }, []);

    const totalUsers = stats.length;
    const totalOrders = stats.reduce((acc, curr) => acc + parseInt(curr.orderCount), 0);
    const totalRevenue = stats.reduce((acc, curr) => acc + parseFloat(curr.totalSpent), 0);

    const statItems = [
        { label: 'Toplam Kullanıcı', value: String(totalUsers), hint: 'Sipariş veren kullanıcılar' },
        { label: 'Toplam Sipariş', value: String(totalOrders), hint: 'Tüm kullanıcıların siparişleri' },
        { label: 'Toplam Ciro', value: totalRevenue.toFixed(2), hint: 'Tüm siparişlerin toplamı' },
    ];

    return (
        <div className="space-y-4">
            <PageHeader
                title="Kullanıcı İstatistikleri"
                subtitle="Hangi kullanıcı kaç sipariş vermiş ve ne kadar harcamış görün."
            >
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={refresh}>
                        Yenile
                    </Button>
                </div>
            </PageHeader>

            <StatCards items={statItems} />

            <Card>
                <CardContent className="p-0">
                    {error ? <div className="p-4 text-sm text-destructive">{error}</div> : null}

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/30">
                                    <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider">Kullanıcı Adı</TableHead>
                                    <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider text-right">Sipariş Sayısı</TableHead>
                                    <TableHead className="h-9 text-[11px] font-bold uppercase tracking-wider text-right">Toplam Harcama</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center p-8 text-muted-foreground text-[12px]">
                                            Yükleniyor...
                                        </TableCell>
                                    </TableRow>
                                ) : stats.length > 0 ? (
                                    stats.map((s) => (
                                        <TableRow key={s.userId} className="hover:bg-muted/50 transition-colors">
                                            <TableCell className="py-2.5 font-semibold text-[13px]">{s.userName}</TableCell>
                                            <TableCell className="py-2.5 text-right text-[12px] font-medium">{s.orderCount}</TableCell>
                                            <TableCell className="py-2.5 text-right font-mono text-[12px] font-bold text-primary">
                                                {parseFloat(s.totalSpent).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center p-8 text-muted-foreground text-[12px]">
                                            Veri bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
