import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  variant = 'primary',
  onClick,
}) => {
  const variantStyles = {
    primary: { bg: '#EEF2FF', color: '#4F46E5' },
    success: { bg: '#ECFDF5', color: '#10B981' },
    warning: { bg: '#FFFBEB', color: '#F59E0B' },
    danger: { bg: '#FEF2F2', color: '#EF4444' },
    info: { bg: '#F0F9FF', color: '#0284C7' },
  }[variant];

  return (
    <div
      className="kpi-card"
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <div
          className="kpi-icon-wrapper"
          style={{ backgroundColor: variantStyles.bg, color: variantStyles.color }}
        >
          <Icon size={18} strokeWidth={2.2} />
        </div>
      </div>
      <div className="kpi-value">{value}</div>
      {subtext && <div className="kpi-footer">{subtext}</div>}
    </div>
  );
};
