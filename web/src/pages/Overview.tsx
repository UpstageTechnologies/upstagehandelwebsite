import React, { useState, useMemo } from 'react';
import {
  Users,
  Store,
  CreditCard,
  ShoppingCart,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  DashboardKPIs,
  UserRecord,
  SaleTransaction,
  PurchaseInvoice,
  OrderRecord,
  ProductItem,
  OperationalAlert,
} from '../types/crm';
import { KPICard } from '../components/ui/KPICard';
import { TrendLineChart, DonutChart, BarChart } from '../components/ui/Charts';
import { Badge } from '../components/ui/Badge';
import { parseAnyDate } from '../services/crmRepository';

interface OverviewProps {
  kpis: DashboardKPIs;
  users: UserRecord[];
  sales: SaleTransaction[];
  purchases: PurchaseInvoice[];
  orders: OrderRecord[];
  products: ProductItem[];
  alerts: OperationalAlert[];
  onNavigateTab: (tab: string) => void;
  selectedShopName?: string;
}

export const Overview: React.FC<OverviewProps> = ({
  kpis,
  users,
  sales,
  purchases,
  orders,
  products,
  alerts,
  onNavigateTab,
  selectedShopName,
}) => {
  const [dateFilter, setDateFilter] = useState<'7d' | '30d' | 'all'>('30d');

  // Filter sales according to selected date filter
  const filteredSales = useMemo(() => {
    if (dateFilter === 'all') return sales;
    const now = Date.now();
    const days = dateFilter === '7d' ? 7 : 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return sales.filter((s) => parseAnyDate(s.createdAt).getTime() >= cutoff);
  }, [sales, dateFilter]);

  // Daily sales trend aggregation
  const salesTrend = useMemo(() => {
    const dailyMap = new Map<string, number>();

    // Seed recent 7 or 14 days
    const daysCount = dateFilter === '7d' ? 7 : 14;
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyMap.set(label, 0);
    }

    filteredSales.forEach((s) => {
      const d = parseAnyDate(s.createdAt);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (dailyMap.has(label)) {
        dailyMap.set(label, (dailyMap.get(label) || 0) + s.total);
      }
    });

    return Array.from(dailyMap.entries()).map(([label, value]) => ({
      label,
      value: Math.round(value),
    }));
  }, [filteredSales, dateFilter]);

  // Subscription distribution data for Donut Chart
  const subscriptionDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      'Free Trial': 0,
      'Basic': 0,
      'Premium': 0,
      'Pro': 0,
    };
    users.forEach((u) => {
      const plan = u.subscriptionPlan || 'Free Trial';
      if (plan.includes('Pro')) counts['Pro']++;
      else if (plan.includes('Premium')) counts['Premium']++;
      else if (plan.includes('Basic')) counts['Basic']++;
      else counts['Free Trial']++;
    });

    return [
      { label: 'Pro', value: counts['Pro'], color: '#F59E0B' },
      { label: 'Premium', value: counts['Premium'], color: '#10B981' },
      { label: 'Basic', value: counts['Basic'], color: '#6366F1' },
      { label: 'Free Trial', value: counts['Free Trial'], color: '#94A3B8' },
    ];
  }, [users]);

  // Top selling products calculated from sales items
  const topSellingProducts = useMemo(() => {
    const itemMap = new Map<string, { name: string; qty: number; sales: number }>();
    sales.forEach((s) => {
      if (Array.isArray(s.items)) {
        s.items.forEach((item) => {
          const name = item.name || item.itemName || 'Product';
          const existing = itemMap.get(name) || { name, qty: 0, sales: 0 };
          existing.qty += Number(item.qty || 1);
          existing.sales += Number(item.price || item.salesPrice || 0) * Number(item.qty || 1);
          itemMap.set(name, existing);
        });
      }
    });

    return Array.from(itemMap.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((p) => ({
        label: p.name,
        value: p.sales,
        subtext: `${p.qty} sold`,
        color: '#4F46E5',
      }));
  }, [sales]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Scope banner if filtered */}
      {selectedShopName && (
        <div
          style={{
            backgroundColor: '#EEF2FF',
            border: '1px solid #C7D2FE',
            padding: '10px 16px',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 13,
            color: '#3730A3',
          }}
        >
          <span>
            Filtered View for: <strong>{selectedShopName}</strong>
          </span>
          <span style={{ fontSize: 12, color: '#4F46E5' }}>All metrics reflect this shop only</span>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="kpi-grid">
        <KPICard
          label="Registered Users"
          value={kpis.totalUsers}
          subtext={`${kpis.activeUsers} active accounts`}
          icon={Users}
          variant="primary"
          onClick={() => onNavigateTab('users')}
        />
        <KPICard
          label="Registered Shops"
          value={kpis.totalShops}
          subtext="Physical & online points"
          icon={Store}
          variant="info"
          onClick={() => onNavigateTab('shops')}
        />
        <KPICard
          label="Active Subscriptions"
          value={kpis.activeSubscriptions}
          subtext={`${kpis.expiredSubscriptions} expired, ${kpis.trialSubscriptions} in trial`}
          icon={CreditCard}
          variant="success"
          onClick={() => onNavigateTab('subscriptions')}
        />
        <KPICard
          label="Verified Sub Revenue"
          value={`₹${kpis.verifiedSubscriptionRevenue.toLocaleString()}`}
          subtext="Calculated from confirmed payment records"
          icon={Sparkles}
          variant="primary"
          onClick={() => onNavigateTab('subscriptions')}
        />
        <KPICard
          label="Total Orders"
          value={kpis.totalOrders}
          subtext={`${kpis.pendingOrders} pending verification`}
          icon={ShoppingCart}
          variant="warning"
          onClick={() => onNavigateTab('orders')}
        />
        <KPICard
          label="POS Sales Total"
          value={`₹${Math.round(kpis.totalSalesAmount).toLocaleString()}`}
          subtext={`Est. Profit: ₹${Math.round(kpis.totalProfit).toLocaleString()}`}
          icon={TrendingUp}
          variant="success"
          onClick={() => onNavigateTab('sales')}
        />
        <KPICard
          label="Supplier Purchases"
          value={`₹${Math.round(kpis.totalPurchasesAmount).toLocaleString()}`}
          subtext="Across recorded inventory invoices"
          icon={Receipt}
          variant="info"
          onClick={() => onNavigateTab('purchases')}
        />
        <KPICard
          label="Low Stock Alerts"
          value={kpis.lowStockCount}
          subtext="Products at or below reorder threshold"
          icon={AlertTriangle}
          variant="danger"
          onClick={() => onNavigateTab('inventory')}
        />
      </div>

      {/* Visual Analytics & Breakdown Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Sales Performance Trend */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">POS Sales Performance Trend</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                Real-time aggregated daily transaction volume
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['7d', '30d', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setDateFilter(period)}
                  className={`btn ${dateFilter === period ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 10px', fontSize: 11.5 }}
                >
                  {period === 'all' ? 'All Time' : period.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="card-body">
            <TrendLineChart data={salesTrend} valuePrefix="₹" height={220} />
          </div>
        </div>

        {/* Subscription Distribution */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Subscription Health</div>
            <button
              onClick={() => onNavigateTab('subscriptions')}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 12 }}
            >
              Details <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            <DonutChart
              data={subscriptionDistribution}
              centerTitle="Subscribers"
              centerValue={users.length}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity & Best-Sellers Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Urgent Attention & Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Operational Alerts Requiring Attention</div>
            <button
              onClick={() => onNavigateTab('alerts')}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 12 }}
            >
              View All ({alerts.length}) <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {alerts.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748B', fontSize: 13 }}>
                All systems healthy. No outstanding operational alerts.
              </div>
            ) : (
              alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => alert.targetTab && onNavigateTab(alert.targetTab)}
                  style={{
                    padding: '12px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Badge
                      variant={
                        alert.severity === 'danger'
                          ? 'danger'
                          : alert.severity === 'warning'
                          ? 'warning'
                          : 'info'
                      }
                      dot
                    >
                      {alert.type.replace('_', ' ')}
                    </Badge>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>
                        {alert.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#64748B' }}>{alert.description}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>
                    {alert.timestamp.toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Best-Selling Products */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Selling Products by Revenue</div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="btn btn-ghost"
              style={{ padding: '4px 8px', fontSize: 12 }}
            >
              Catalog <ArrowRight size={14} />
            </button>
          </div>
          <div className="card-body">
            <BarChart data={topSellingProducts} valuePrefix="₹" />
          </div>
        </div>
      </div>
    </div>
  );
};
