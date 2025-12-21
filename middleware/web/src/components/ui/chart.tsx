"use client"

import * as React from "react"
import { ResponsiveContainer } from "recharts"

import { cn } from "@/lib/utils"

// Simplified Chart component for MiddleMan
export interface ChartConfig {
    [key: string]: {
        label: React.ReactNode
        color?: string
    }
}

const ChartContext = React.createContext<{ config: ChartConfig } | null>(null)

function useChart() {
    const context = React.useContext(ChartContext)
    if (!context) {
        throw new Error("useChart must be used within a ChartContainer")
    }
    return context
}

export const ChartContainer = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> & {
        config: ChartConfig
        children: React.ReactElement
    }
>(({ config, children, className, ...props }, ref) => {
    return (
        <ChartContext.Provider value={{ config }}>
            <div
                ref={ref}
                className={cn(
                    "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-line-curve]:stroke-width-2 [&_.recharts-dot]:stroke-background [&_.recharts-dot]:stroke-width-2 [&_.recharts-layer]:outline-none [&_.recharts-polar-grid-concentric-polygon]:stroke-border [&_.recharts-polar-grid-ring]:stroke-border [&_.recharts-sector]:outline-none [&_.recharts-sector]:stroke-background [&_.recharts-surface]:outline-none",
                    className
                )}
                {...props}
            >
                <ResponsiveContainer>{children}</ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    )
})
ChartContainer.displayName = "ChartContainer"

export const ChartTooltip = ({ active, payload, label, config }: any) => {
    if (!active || !payload) return null

    return (
        <div className="rounded-lg border bg-background p-2 shadow-sm min-w-[120px]">
            <div className="flex flex-col gap-1.5">
                {payload.map((item: any, index: number) => {
                    const key = item.dataKey || item.name
                    const conf = config[key]
                    return (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                                <div
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: item.color || item.fill }}
                                />
                                <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                                    {conf?.label || item.name || key}
                                </span>
                            </div>
                            <span className="text-right text-[11px] font-bold font-mono">
                                {item.value}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export const ChartLegend = ({ payload }: any) => {
    if (!payload) return null

    return (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
            {payload.map((entry: any, index: number) => (
                <div key={`item-${index}`} className="flex items-center gap-1.5">
                    <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {entry.value}
                    </span>
                </div>
            ))}
        </div>
    )
}
