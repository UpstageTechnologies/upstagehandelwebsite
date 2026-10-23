import React, { useState, useMemo } from 'react';
import {
  Store,
  Search,
  Download,
  Eye,
  MapPin,
  Package,
  ShoppingCart,
  TrendingUp,
  Receipt,
  Layers,
  Globe,
} from 'lucide-react';
import {
  UserRecord,
  ProductItem,
  SaleTransaction,
  PurchaseInvoice,
  OrderRecord,
} from '../types/crm';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { downloadCsv } from '../services/exportService';
import { parseAnyDate } from '../services/crmRepository';

interface ShopsProps {
  shops: UserRecord[];
  products: ProductItem[];
  sales: SaleTransaction[];
  purchases: PurchaseInvoice[];
  orders: OrderRecord[];
  loading?: boolean;
}

export const Shops: React.FC<ShopsProps> = ({
  shops,
  products,
  sales,
  purchases,
  orders,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [inspectedShop, setInspectedShop] = useState<UserRecord | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'inventory' | 'sales' | 'purchases' | 'orders'>('inventory');

  // Filter shops
  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      const matchSearch =
        s.shopName.toLowerCase().includes(search.toLowerCase()) ||
        s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        (s.customShopUid && s.customShopUid.toLowerCase().includes(search.toLowerCase()));

      const matchType = typeFilter === 'all' || s.shopType.toLowerCase() === typeFilter.toLowerCase();
      const matchScope = scopeFilter === 'all' || (s.deliveryScope || 'Local').toLowerCase() === scopeFilter.toLowerCase();

      return matchSearch && matchType && matchScope;
    });
  }, [shops, search, typeFilter, scopeFilter]);

  // Data subsets for currently inspected shop
  const shopProducts = useMemo(() => {
    if (!inspectedShop) return [];
    return products.filter((p) => p.shopId === inspectedShop.id);
  }, [products, inspectedShop]);

  const shopSales = useMemo(() => {
    if (!inspectedShop) return [];
    return sales.filter((s) => s.shopId === inspectedShop.id);
  }, [sales, inspectedShop]);

  const shopPurchases = useMemo(() => {
    if (!inspectedShop) return [];
    return purchases.filter((p) => p.shopId === inspectedShop.id);
  }, [purchases, inspectedShop]);

  const shopOrders = useMemo(() => {
    if (!inspectedShop) return [];
    return orders.filter((o) => o.shopId === inspectedShop.id);
  }, [orders, inspectedShop]);

  const handleExportCsv = () => {
    const headers = [
      'Shop Name',
      'Owner',
      'Shop Type',
      'Delivery Scope',
      'Location / Address',
      'Product Count',
      'Total Sales (INR)',
      'Total Orders',
      'Total Purchases (INR)',
      'Status',
    ];

    const rows = filteredShops.map((s) => [
      s.shopName,
      s.ownerName,
      s.shopType,
      s.deliveryScope || 'Local',
      typeof s.address === 'object' && s.address !== null ? s.address.fullAddress || '' : s.address || '',
      s.productCount || 0,
      Math.round(s.salesTotal || 0),
      s.ordersCount || 0,
      Math.round(s.purchaseTotal || 0),
      s.subscriptionActive ? 'Active' : 'Expired',
    ]);

    downloadCsv('Upstage_Shops_Directory', headers, rows);
  };

  const columns: Column<UserRecord>[] = [
    {
      key: 'shopName',
      header: 'Shop Name & Code',
      sortable: true,
      render: (s) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 13.5 }}>{s.shopName}</div>
          <div style={{ fontSize: 11.5, color: '#64748B' }}>
            Owner: <strong>{s.ownerName}</strong> &bull; <span className="font-mono">{s.customShopUid || s.id.slice(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'shopType',
      header: 'Category & Scope',
      sortable: true,
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge variant="neutral">{s.shopType || 'Store'}</Badge>
          <Badge variant={s.deliveryScope === 'Global' ? 'primary' : 'neutral'}>
            {s.deliveryScope === 'Global' ? <Globe size={11} style={{ marginRight: 3 }} /> : null}
            {s.deliveryScope || 'Local'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Location',
      render: (s) => {
        let loc = 'Unspecified';
        if (typeof s.address === 'object' && s.address !== null) {
          loc = [s.address.city, s.address.district, s.address.state].filter(Boolean).join(', ') || s.address.fullAddress || 'India';
        } else if (typeof s.address === 'string' && s.address) {
          loc = s.address;
        }
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#475569', fontSize: 12.5, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <MapPin size={13} color="#94A3B8" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{loc}</span>
          </div>
        );
      },
    },
    {
      key: 'productCount',
      header: 'Catalog',
      sortable: true,
      align: 'center',
      render: (s) => (
        <span style={{ fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>
          {s.productCount ?? 0} items
        </span>
      ),
    },
    {
      key: 'salesTotal',
      header: 'Gross Sales',
      sortable: true,
      align: 'right',
      render: (s) => (
        <div>
          <div style={{ fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>
            ₹{Math.round(s.salesTotal || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            {s.salesCount || 0} bills &bull; {s.ordersCount || 0} orders
          </div>
        </div>
      ),
    },
    {
      key: 'subscriptionActive',
      header: 'Status',
      sortable: true,
      render: (s) => (
        <Badge variant={s.subscriptionActive ? 'success' : 'danger'} dot>
          {s.subscriptionActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setInspectedShop(s);
          }}
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
        >
          <Eye size={13} />
          Shop 360°
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Shop Directory & POS Management"
        subtitle="360° management of all registered merchant store fronts, inventory sizes, and revenue records"
        breadcrumbs={['Shops']}
        actions={
          <button onClick={handleExportCsv} className="btn btn-secondary">
            <Download size={15} />
            Export CSV
          </button>
        }
      />

      {/* Filters Toolbar */}
      <div className="filter-bar" style={{ borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <div className="filter-group">
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
            />
            <input
              type="text"
              placeholder="Search shop, owner, code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input filter-search-input"
              style={{ paddingLeft: 32 }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Shop Types</option>
            <option value="Store">Retail Store</option>
            <option value="Super Market">Super Market</option>
            <option value="Medical">Medical / Pharmacy</option>
            <option value="Factory">Factory / Wholesale</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Delivery Scopes</option>
            <option value="Local">Local In-Store POS</option>
            <option value="Global">Global Online Ordering</option>
          </select>
        </div>

        <div style={{ fontSize: 12.5, color: '#64748B' }}>
          Showing <strong>{filteredShops.length}</strong> shops
        </div>
      </div>

      {/* Directory Table */}
      <DataTable
        columns={columns}
        data={filteredShops}
        loading={loading}
        pageSize={12}
        keyExtractor={(s) => s.id}
        onRowClick={(s) => setInspectedShop(s)}
      />

      {/* Shop 360 Inspector Modal */}
      {inspectedShop && (
        <Modal
          isOpen={!!inspectedShop}
          onClose={() => setInspectedShop(null)}
          title={`Shop 360°: ${inspectedShop.shopName}`}
          subtitle={`Owner: ${inspectedShop.ownerName} &bull; Identifier: ${inspectedShop.customShopUid || inspectedShop.id}`}
          maxWidth="920px"
          footer={
            <button onClick={() => setInspectedShop(null)} className="btn btn-secondary">
              Close Inspector
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* KPI stats for this shop */}
            <div className="responsive-grid-4" style={{ gap: 12 }}>
              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Products</span>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {shopProducts.length}
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Sales Total</span>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#10B981', marginTop: 2 }}>
                  ₹{Math.round(inspectedShop.salesTotal || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Orders Count</span>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#4F46E5', marginTop: 2 }}>
                  {shopOrders.length}
                </div>
              </div>

              <div style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>Purchases Total</span>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0284C7', marginTop: 2 }}>
                  ₹{Math.round(inspectedShop.purchaseTotal || 0).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Sub-tab navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', gap: 16, overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: 2 }}>
              {(
                [
                  { id: 'inventory', label: `Inventory (${shopProducts.length})` },
                  { id: 'sales', label: `Sales Ledger (${shopSales.length})` },
                  { id: 'orders', label: `Orders (${shopOrders.length})` },
                  { id: 'purchases', label: `Purchases (${shopPurchases.length})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setInspectorTab(tab.id)}
                  style={{
                    padding: '8px 12px',
                    border: 'none',
                    background: 'none',
                    fontWeight: 600,
                    fontSize: 13,
                    color: inspectorTab === tab.id ? '#4F46E5' : '#64748B',
                    borderBottom: inspectorTab === tab.id ? '2px solid #4F46E5' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-tab contents */}
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
              {inspectorTab === 'inventory' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Cost</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>
                          No products registered in this shop's inventory
                        </td>
                      </tr>
                    ) : (
                      shopProducts.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <strong>{p.name}</strong>
                            <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.barcode || 'No barcode'}</div>
                          </td>
                          <td>{p.category}</td>
                          <td className="font-mono">₹{p.salesPrice}</td>
                          <td className="font-mono">₹{p.purchasePrice}</td>
                          <td>
                            <Badge variant={p.quantity <= p.lowStockThreshold ? 'danger' : 'neutral'}>
                              {p.quantity} {p.unitType}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {inspectorTab === 'sales' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Bill No</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Payment</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopSales.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>
                          No recorded sales for this shop
                        </td>
                      </tr>
                    ) : (
                      shopSales.map((s) => (
                        <tr key={s.id}>
                          <td className="font-mono">{s.billNo}</td>
                          <td>{parseAnyDate(s.createdAt).toLocaleDateString()}</td>
                          <td>{s.items?.length || 0} item(s)</td>
                          <td>
                            <Badge variant="neutral">{s.paymentMode}</Badge>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                            ₹{s.total.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {inspectorTab === 'orders' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>
                          No customer orders for this shop
                        </td>
                      </tr>
                    ) : (
                      shopOrders.map((o) => (
                        <tr key={o.id}>
                          <td className="font-mono">{o.orderId}</td>
                          <td>{o.customerName}</td>
                          <td>{o.orderType}</td>
                          <td>
                            <Badge variant={o.status.includes('Completed') ? 'success' : 'warning'}>
                              {o.status}
                            </Badge>
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                            ₹{o.total.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {inspectorTab === 'purchases' && (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Supplier</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shopPurchases.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#94A3B8', padding: 20 }}>
                          No supplier purchases recorded
                        </td>
                      </tr>
                    ) : (
                      shopPurchases.map((p) => (
                        <tr key={p.id}>
                          <td className="font-mono">{p.billNo}</td>
                          <td>{p.supplierName}</td>
                          <td>{parseAnyDate(p.createdAt).toLocaleDateString()}</td>
                          <td>{p.items?.length || 0} item(s)</td>
                          <td style={{ textAlign: 'right', fontWeight: 700 }} className="font-mono">
                            ₹{p.total.toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
