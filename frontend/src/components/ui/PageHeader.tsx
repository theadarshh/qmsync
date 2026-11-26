import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-header__title">{title}</h1>
        {subtitle ? <p className="page-header__subtitle">{subtitle}</p> : null}
      </div>
      {badge ? <div className="page-header__badge">{badge}</div> : null}
    </header>
  );
}
