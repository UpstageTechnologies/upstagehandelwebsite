import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  CreditCard,
  Package,
  Store,
  ShoppingCart,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import {
  UserRecord,
  ProductItem,
  SaleTransaction,
  PurchaseInvoice,
  OrderRecord,
} from '../types/crm';
import { PageHeader } from '../components/ui/PageHeader';
import { TrendLineChart, BarChart, DonutChart } from '../components/ui/Charts';
import { downloadCsv } from '../services/exportService';
import { parseAnyDate } from '../services/crmRepository';

interface ReportsAnalyticsProps {
  users: UserRecord[];
  products: ProductItem[];
  sales: SaleTransaction[];
  purchases: PurchaseInvoice[];
  orders: OrderRecord[];
}

export const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({
  users,
  products,
  sales,
  purchases,
  orders,
}) => {
  const [reportPeriod, setReportPeriod] = useState<'30d' | '90d' | 'all'>('30d');

  // Filter sales and purchases based on selected period
  const { filteredSales, filteredPurchases } = useMemo(() => {
    const now = Date.now();
    const days = reportPeriod === '30d' ? 30 : reportPeriod === '90d' ? 90 : 365;
    const cutoff = now - days * 24 * 60 * 60 * 1000;

    return {
      filteredSales:
        reportPeriod === 'all'
          ? sales
          : sales.filter((s) => parseAnyDate(s.createdAt).getTime() >= cutoff),
      filteredPurchases:
        reportPeriod === 'all'
          ? purchases
          : purchases.filter((p) => parseAnyDate(p.createdAt).getTime() >= cutoff),
    };
  }, [sales, purchases, reportPeriod]);

  // Shop performance table
  const shopPerformance = useMemo(() => {
    return users.map((u) => {
      const uSales = sales.filter((s) => s.shopId === u.id);
      const uOrders = orders.filter((o) => o.shopId === u.id);
      const uProducts = products.filter((p) => p.shopId === u.id);
      const uPurchases = purchases.filter((p) => p.shopId === u.id);

      const totalSales = uSales.reduce((sum, s) => sum + s.total, 0);
      const totalProfit = uSales.reduce((sum, s) => sum + (s.profit || 0), 0);
      const totalPurchases = uPurchases.reduce((sum, p) => sum + p.total, 0);

      return {
        id: u.id,
        name: u.shopName,
        owner: u.ownerName,
        plan: u.subscriptionPlan,
        catalogSize: uProducts.length,
        salesCount: uSales.length,
        totalSales: Math.round(totalSales),
        totalProfit: Math.round(totalProfit),
        ordersCount: uOrders.length,
        totalPurchases: Math.round(totalPurchases),
      };
    }).sort((a, b) => b.totalSales - a.totalSales);
  }, [users, sales, orders, products, purchases]);

  // Channel breakdown (Local vs Global)
  const channelBreakdown = useMemo(() => {
    let localSales = 0;
    let globalSales = 0;
    filteredSales.forEach((s) => {
      if (s.isGlobalMode) globalSales += s.total;
      else localSales += s.total;
    });

    return [
      { label: 'Local In-Store POS', value: Math.round(localSales), color: '#4F46E5' },
      { label: 'Global Online Orders', value: Math.round(globalSales), color: '#10B981' },
    ];
  }, [filteredSales]);

  // Best-selling categories
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      const cat = p.category || 'General';
      map.set(cat, (map.get(cat) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value, color: '#6366F1' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [products]);

  const handleExportPerformanceCsv = () => {
    const headers = [
      'Shop Name',
      'Owner',
      'Plan',
      'Catalog Size',
      'Bills Issued',
      'Total Sales (INR)',
      'Gross Profit (INR)',
      'Customer Orders',
      'Purchases Spend (INR)',
    ];

    const rows = shopPerformance.map((s) => [
      s.name,
      s.owner,
      s.plan,
      s.catalogSize,
      s.salesCount,
      s.totalSales,
      s.totalProfit,
      s.ordersCount,
      s.totalPurchases,
    ]);

    downloadCsv('Upstage_Shop_Performance_Report', headers, rows);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Reports & Ecosystem Analytics"
        subtitle="Cross-merchant performance aggregation, channel distribution, and financial intelligence"
        breadcrumbs={['Reports & Analytics']}
        actions={
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['30d', '90d', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setReportPeriod(period)}
                  className={`btn ${reportPeriod === period ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  {period === 'all' ? 'All Time' : period.toUpperCase()}
                </button>
              ))}
            </div>

            <button onClick={handleExportPerformanceCsv} className="btn btn-secondary">
              <Download size={15} />
              Export Performance CSV
            </button>
          </div>
        }
      />

      {/* Visual Analytics Row */}
      <div className="responsive-grid-2">
        {/* Channel Revenue Distribution */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Channel Revenue Split (Local vs Global)</div>
          </div>
          <div className="card-body">
            <DonutChart
              data={channelBreakdown}
              centerTitle="Revenue"
              centerValue={`₹${(channelBreakdown.reduce((sum, d) => sum + d.value, 0) / 1000).toFixed(0)}k`}
            />
          </div>
        </div>

        {/* Product Catalog Categories */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Product Categories Across Stores</div>
          </div>
          <div className="card-body">
            <BarChart data={categoryBreakdown} maxBars={5} />
          </div>
        </div>
      </div>

      {/* Shop Performance Comparison Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Merchant Performance League</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
              Ranked by gross sales volume across in-store and online channels
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Shop & Merchant</th>
                <th>Plan Tier</th>
                <th style={{ textAlign: 'center' }}>Catalog</th>
                <th style={{ textAlign: 'center' }}>Bills</th>
                <th style={{ textAlign: 'right' }}>Total Sales</th>
                <th style={{ textAlign: 'right' }}>Gross Profit</th>
                <th style={{ textAlign: 'center' }}>Orders</th>
                <th style={{ textAlign: 'right' }}>Procurement</th>
              </tr>
            </thead>
            <tbody>
              {shopPerformance.map((shop, idx) => (
                <tr key={shop.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          backgroundColor: idx < 3 ? '#EEF2FF' : '#F1F5F9',
                          color: idx < 3 ? '#4F46E5' : '#64748B',
                          fontWeight: 700,
                          fontSize: 11,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <strong>{shop.name}</strong>
                        <div style={{ fontSize: 11.5, color: '#64748B' }}>{shop.owner}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>
                      {shop.plan}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{shop.catalogSize}</td>
                  <td style={{ textAlign: 'center' }}>{shop.salesCount}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#10B981' }} className="font-mono">
                    ₹{shop.totalSales.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'right', color: '#4F46E5', fontWeight: 600 }} className="font-mono">
                    ₹{shop.totalProfit.toLocaleString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>{shop.ordersCount}</td>
                  <td style={{ textAlign: 'right', color: '#0284C7' }} className="font-mono">
                    ₹{shop.totalPurchases.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
