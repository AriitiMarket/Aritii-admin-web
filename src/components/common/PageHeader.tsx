import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header mb-5">
      <div className="page-header__content">
        <div>
          <h1 className="page-header__title">{title}</h1>
          {description && (
            <p className="page-header__description">{description}</p>
          )}
        </div>
        {actions && <div className="page-header__actions">{actions}</div>}
      </div>
    </div>
  );
}