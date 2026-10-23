import React, { useState, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { OperationalAlert } from '../types/crm';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';

interface ActivityAlertsProps {
  alerts: OperationalAlert[];
  onNavigateTab: (tab: string) => void;
}

export const ActivityAlerts: React.FC<ActivityAlertsProps> = ({
  alerts,
  onNavigateTab,
}) => {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      const matchSeverity = severityFilter === 'all' || a.severity === severityFilter;
      const matchType = typeFilter === 'all' || a.type === typeFilter;
      return matchSeverity && matchType;
    });
  }, [alerts, severityFilter, typeFilter]);

  const stats = useMemo(() => {
    const danger = alerts.filter((a) => a.severity === 'danger').length;
    const warning = alerts.filter((a) => a.severity === 'warning').length;
    const info = alerts.filter((a) => a.severity === 'info').length;
    return { danger, warning, info, total: alerts.length };
  }, [alerts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Activity & Operational Alerts"
        subtitle="Live derived operational incidents, expiring store subscriptions, and low inventory thresholds"
        breadcrumbs={['Activity & Alerts']}
      />

      {/* Severity Metric Pills */}
      <div className="responsive-grid-4" style={{ gap: 14 }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Active Alerts</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
            {stats.total}
          </div>
        </div>

        <div style={{ backgroundColor: '#FEF2F2', padding: 16, borderRadius: 10, border: '1px solid #FECACA' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#991B1B', textTransform: 'uppercase' }}>Critical / Danger</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#EF4444', marginTop: 2 }}>
            {stats.danger}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFBEB', padding: 16, borderRadius: 10, border: '1px solid #FDE68A' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase' }}>Warnings (Expiring/Low)</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#F59E0B', marginTop: 2 }}>
            {stats.warning}
          </div>
        </div>

        <div style={{ backgroundColor: '#F0F9FF', padding: 16, borderRadius: 10, border: '1px solid #BAE6FD' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#075985', textTransform: 'uppercase' }}>Informational / Orders</span>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0284C7', marginTop: 2 }}>
            {stats.info}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar" style={{ borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <div className="filter-group">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Severities</option>
            <option value="danger">Critical (Danger)</option>
            <option value="warning">Warnings</option>
            <option value="info">Informational</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Alert Types</option>
            <option value="subscription_expiring">Expiring Subscriptions</option>
            <option value="subscription_expired">Expired Subscriptions</option>
            <option value="low_stock">Low Inventory Stock</option>
            <option value="pending_order">Pending Customer Orders</option>
          </select>
        </div>

        <div style={{ fontSize: 12.5, color: '#64748B' }}>
          Showing <strong>{filteredAlerts.length}</strong> active alerts
        </div>
      </div>

      {/* Alerts List */}
      <div className="card">
        {filteredAlerts.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
            <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 700, fontSize: 16, color: '#0F172A' }}>
              All Clear! No Active Alerts
            </div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              All inventory levels are healthy and no subscriptions require immediate renewal.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredAlerts.map((a) => (
              <div
                key={a.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Badge
                    variant={
                      a.severity === 'danger'
                        ? 'danger'
                        : a.severity === 'warning'
                        ? 'warning'
                        : 'info'
                    }
                    dot
                  >
                    {a.type.replace('_', ' ').toUpperCase()}
                  </Badge>

                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {a.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>
                      {a.description}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>
                    {a.timestamp.toLocaleDateString()}
                  </span>

                  {a.targetTab && (
                    <button
                      onClick={() => onNavigateTab(a.targetTab!)}
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: 12 }}
                    >
                      Resolve <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
