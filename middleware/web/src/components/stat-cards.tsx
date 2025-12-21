import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StatCards(props: {
  items: Array<{ label: string; value: string; hint?: string }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {props.items.map((it) => (
        <Card key={it.label}>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">{it.label}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="text-2xl font-semibold">{it.value}</div>
            {it.hint ? <div className="mt-1 text-xs text-muted-foreground">{it.hint}</div> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}



