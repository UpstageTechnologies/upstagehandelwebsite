import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Store,
  Package,
  ShoppingCart,
  TrendingUp,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  unreadAlertsCount?: number;
  pendingOrdersCount?: number;
  expiringSubsCount?: number;
  adminEmail?: string | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  unreadAlertsCount = 0,
  pendingOrdersCount = 0,
  expiringSubsCount = 0,
  adminEmail,
  onLogout,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, badge: expiringSubsCount > 0 ? expiringSubsCount : undefined },
    { id: 'shops', label: 'Shops', icon: Store },
    { id: 'inventory', label: 'Products & Inventory', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: pendingOrdersCount > 0 ? pendingOrdersCount : undefined },
    { id: 'sales', label: 'Sales History', icon: TrendingUp },
    { id: 'purchases', label: 'Purchase History', icon: Receipt },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Activity & Alerts', icon: Bell, badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">U</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 800, fontSize: 16, color: '#0F172A', lineHeight: 1.2 }}>
                Upstage<span style={{ color: '#4F46E5' }}>Handel</span>
              </span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                POS Admin CRM
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="sidebar-brand-icon" style={{ margin: '0 auto' }}>
            U
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="btn btn-ghost"
          style={{ padding: 6, borderRadius: '50%' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <div
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} strokeWidth={isActive ? 2.3 : 1.9} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge !== undefined && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: '#EEF2FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#4F46E5',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, color: '#0F172A', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  Administrator
                </div>
                <div style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {adminEmail || 'admin@upstage.com'}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={onLogout}
            className="btn btn-ghost"
            style={{ padding: 6, color: '#EF4444' }}
            title="Sign out of Admin CRM"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
