import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  RefreshCw,
  Store,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
} from 'lucide-react';
import { UserRecord, OperationalAlert } from '../../types/crm';

interface TopbarProps {
  breadcrumbs: string[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  shops: UserRecord[];
  selectedShopId: string;
  onSelectShopId: (id: string) => void;
  alerts: OperationalAlert[];
  onRefresh: () => void;
  refreshing: boolean;
  onNavigateToTab: (tab: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  breadcrumbs,
  searchQuery,
  onSearchChange,
  shops,
  selectedShopId,
  onSelectShopId,
  alerts,
  onRefresh,
  refreshing,
  onNavigateToTab,
}) => {
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748B' }}>
          <span>CRM</span>
          <span style={{ color: '#CBD5E1' }}>/</span>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              <span
                style={{
                  color: i === breadcrumbs.length - 1 ? '#0F172A' : '#64748B',
                  fontWeight: i === breadcrumbs.length - 1 ? 600 : 400,
                }}
              >
                {b}
              </span>
              {i < breadcrumbs.length - 1 && <span style={{ color: '#CBD5E1' }}>/</span>}
            </React.Fragment>
          ))}
        </div>

        {/* Global Shop Selector Filter */}
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              fontSize: 12.5,
              color: '#334155',
            }}
          >
            <Store size={14} color="#6366F1" />
            <select
              value={selectedShopId}
              onChange={(e) => onSelectShopId(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontWeight: 600,
                color: '#0F172A',
                cursor: 'pointer',
                fontSize: 12.5,
              }}
            >
              <option value="all">All Registered Shops ({shops.length})</option>
              {shops.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.shopName || shop.ownerName} ({shop.customShopUid || shop.id.slice(0, 8)})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="topbar-actions">
        {/* Global Search Bar */}
        <div className="topbar-search">
          <Search size={16} className="topbar-search-icon" />
          <input
            type="text"
            placeholder="Search users, orders, products, bills... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          className="btn btn-secondary"
          style={{ padding: '8px 12px' }}
          disabled={refreshing}
          title="Reload live data from Firebase"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>

        {/* Operational Alerts Popover */}
        <div style={{ position: 'relative' }} ref={alertsRef}>
          <button
            onClick={() => setAlertsOpen(!alertsOpen)}
            className="btn btn-secondary"
            style={{ padding: '8px 10px', position: 'relative' }}
            title="Operational Alerts"
          >
            <Bell size={16} />
            {alerts.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: 18,
                  height: 18,
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {alerts.length > 99 ? '99+' : alerts.length}
              </span>
            )}
          </button>

          {alertsOpen && (
            <div
              style={{
                position: 'absolute',
                top: 48,
                right: 0,
                width: 360,
                backgroundColor: '#FFFFFF',
                borderRadius: 14,
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
                border: '1px solid #E2E8F0',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0F172A' }}>
                  Operational Alerts ({alerts.length})
                </div>
                <button
                  onClick={() => {
                    setAlertsOpen(false);
                    onNavigateToTab('alerts');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#4F46E5',
                    cursor: 'pointer',
                  }}
                >
                  View All
                </button>
              </div>

              <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                    <CheckCircle2 size={24} color="#10B981" style={{ margin: '0 auto 8px' }} />
                    All operational metrics normal. No pending alerts.
                  </div>
                ) : (
                  alerts.slice(0, 6).map((a) => (
                    <div
                      key={a.id}
                      onClick={() => {
                        setAlertsOpen(false);
                        if (a.targetTab) onNavigateToTab(a.targetTab);
                      }}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          marginTop: 5,
                          backgroundColor:
                            a.severity === 'danger'
                              ? '#EF4444'
                              : a.severity === 'warning'
                              ? '#F59E0B'
                              : '#3B82F6',
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, fontWeight: 600, color: '#1E293B' }}>
                          {a.title}
                        </div>
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                          {a.description}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
