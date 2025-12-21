import { PropsWithChildren } from 'react';

export function PageHeader(props: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <div className="mb-4 flex flex-col gap-1">
      <div className="text-xl font-semibold">{props.title}</div>
      {props.subtitle ? <div className="text-sm text-muted-foreground">{props.subtitle}</div> : null}
      {props.children}
    </div>
  );
}



