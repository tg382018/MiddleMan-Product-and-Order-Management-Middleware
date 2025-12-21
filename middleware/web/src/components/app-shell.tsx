'use client';

import Link from 'next/link';
import { PropsWithChildren } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

function NavItem(props: { href: string; label: string; isActive: boolean }) {
  return (
    <Button
      asChild
      variant={props.isActive ? 'secondary' : 'ghost'}
      className="w-full justify-start h-8 px-3 text-[13px] font-medium transition-all"
    >
      <Link href={props.href}>{props.label}</Link>
    </Button>
  );
}

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh bg-muted/30">
      <div className="mx-auto grid max-w-7xl grid-cols-1 md:grid-cols-[260px_1fr]">
        <aside className="border-b bg-background md:min-h-dvh md:border-b-0 md:border-r">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="leading-tight">
              <div className="text-[15px] font-bold tracking-tight text-primary">MiddleMan</div>
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">CRM Dashboard</div>
            </div>
          </div>
          <Separator />
          <nav className="flex flex-row gap-1 overflow-x-auto p-3 md:flex-col">
            <NavItem
              href="/products"
              label="Ürünler"
              isActive={pathname?.startsWith('/products') ?? false}
            />
            <NavItem
              href="/orders"
              label="Siparişler"
              isActive={pathname?.startsWith('/orders') ?? false}
            />
            <NavItem
              href="/users"
              label="Kullanıcılar"
              isActive={pathname?.startsWith('/users') ?? false}
            />
            <NavItem
              href="/stats"
              label="İstatistikler"
              isActive={pathname?.startsWith('/stats') ?? false}
            />
          </nav>
          <div className="hidden px-6 pb-4 pt-2 text-[11px] font-medium text-muted-foreground/60 md:block">
            KAYNAK: MIDDLEWARE API
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2.5">
              <div className="text-[12px] font-medium text-muted-foreground">Ürün / Sipariş / Lojistik izleme</div>
              <div className="text-[11px] font-mono text-muted-foreground/50">v0.1.0</div>
            </div>
          </header>
          <main className="mx-auto max-w-6xl p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}


