"use client"

import { useEffect, useState } from "react"
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Line,
    LineChart,
    Pie,
    PieChart,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartLegend,
} from "@/components/ui/chart"
import { apiGet } from "@/lib/mw-api"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
    ordersPerUser: { name: string; count: number }[]
    ordersPerCity: { city: string; count: number }[]
    ordersByPrice: { label: string; count: number }[]
    ordersByDate: { date: string; count: number }[]
}

const chartConfig: ChartConfig = {
    count: {
        label: "Sipariş Sayısı",
        color: "hsl(var(--primary))",
    },
}

const COLORS = [
    "oklch(0.6 0.15 250)",
    "oklch(0.7 0.15 160)",
    "oklch(0.5 0.1 200)",
    "oklch(0.8 0.12 80)",
    "oklch(0.75 0.14 40)",
]

export default function StatsPage() {
    const [data, setData] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiGet<DashboardStats>("/api/stats/dashboard")
            .then(setData)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="İstatistikler" subtitle="Veriler yükleniyor..." />
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-[300px] w-full" />
                </div>
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="space-y-6">
            <PageHeader
                title="İstatistikler"
                subtitle="Sipariş verilerinin detaylı analizi ve görselleştirmesi."
            />

            <div className="grid gap-6 md:grid-cols-2">
                {/* Orders per User */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[14px] uppercase tracking-wider text-muted-foreground font-bold">
                            Kullanıcı Bazlı Siparişler (Top 10)
                        </CardTitle>
                        <CardDescription className="text-[11px]">En çok sipariş veren kullanıcılar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[240px]">
                            <BarChart data={data.ordersPerUser} layout="vertical" margin={{ left: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    tick={{ fontSize: 10 }}
                                    width={80}
                                />
                                <Tooltip content={<ChartTooltip config={chartConfig} />} />
                                <Bar dataKey="count" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Orders per City */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[14px] uppercase tracking-wider text-muted-foreground font-bold">
                            Şehir Bazlı Dağılım
                        </CardTitle>
                        <CardDescription className="text-[11px]">Siparişlerin şehirlere göre oranı</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center">
                        <ChartContainer config={chartConfig} className="h-[280px] w-full">
                            <PieChart>
                                <Pie
                                    data={data.ordersPerCity}
                                    dataKey="count"
                                    nameKey="city"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    labelLine={false}
                                >
                                    {data.ordersPerCity.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip config={chartConfig} />} />
                                <Legend content={<ChartLegend />} />
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Orders by Price */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[14px] uppercase tracking-wider text-muted-foreground font-bold">
                            Fiyat Baremleri
                        </CardTitle>
                        <CardDescription className="text-[11px]">Sipariş tutarlarına göre gruplandırma</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[240px]">
                            <BarChart data={data.ordersByPrice}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip content={<ChartTooltip config={chartConfig} />} />
                                <Bar dataKey="count" fill="oklch(0.7 0.15 160)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Orders by Date */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-[14px] uppercase tracking-wider text-muted-foreground font-bold">
                            Zaman Serisi (Son 30 Gün)
                        </CardTitle>
                        <CardDescription className="text-[11px]">Günlük sipariş trendi</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[240px]">
                            <LineChart data={data.ordersByDate}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 9 }}
                                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                                />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip content={<ChartTooltip config={chartConfig} />} />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="var(--color-primary)"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    activeDot={{ r: 5 }}
                                />
                            </LineChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
