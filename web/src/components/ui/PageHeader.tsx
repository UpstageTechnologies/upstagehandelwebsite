import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: string[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
}) => {
  return (
    <div className="page-header">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: '#64748B',
              marginBottom: 4,
            }}
          >
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={`crumb-${idx}`}>
                <span>{crumb}</span>
                {idx < breadcrumbs.length - 1 && <span style={{ color: '#CBD5E1' }}>/</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{actions}</div>
      )}
    </div>
  );
};
