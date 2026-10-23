import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Download,
  AlertTriangle,
  Globe,
  Tag,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { ProductItem } from '../types/crm';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/ui/PageHeader';
import { downloadCsv } from '../services/exportService';

interface ProductsInventoryProps {
  products: ProductItem[];
  loading?: boolean;
}

export const ProductsInventory: React.FC<ProductsInventoryProps> = ({
  products,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');

  // Distinct categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode.toLowerCase().includes(search.toLowerCase()) ||
        (p.shopName && p.shopName.toLowerCase().includes(search.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));

      const matchCategory =
        categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();

      let matchStock = true;
      if (stockFilter === 'low') matchStock = p.quantity <= p.lowStockThreshold && p.quantity > 0;
      else if (stockFilter === 'out') matchStock = p.quantity <= 0;
      else if (stockFilter === 'healthy') matchStock = p.quantity > p.lowStockThreshold;

      const matchMode =
        modeFilter === 'all' ||
        (modeFilter === 'global' && p.isGlobal) ||
        (modeFilter === 'local' && !p.isGlobal);

      return matchSearch && matchCategory && matchStock && matchMode;
    });
  }, [products, search, categoryFilter, stockFilter, modeFilter]);

  const handleExportCsv = () => {
    const headers = [
      'Product Name',
      'Barcode / SKU',
      'Shop Name',
      'Category',
      'Brand',
      'Selling Price (INR)',
      'Cost Price (INR)',
      'Profit Margin (INR)',
      'Stock Quantity',
      'Unit',
      'Catalog Scope',
      'Stock Status',
    ];

    const rows = filteredProducts.map((p) => [
      p.name,
      p.barcode,
      p.shopName || '',
      p.category,
      p.brand || 'Unbranded',
      p.salesPrice,
      p.purchasePrice,
      p.salesPrice - p.purchasePrice,
      p.quantity,
      p.unitType,
      p.isGlobal ? 'Global' : 'Local',
      p.quantity <= 0 ? 'Out of Stock' : p.quantity <= p.lowStockThreshold ? 'Low Stock' : 'In Stock',
    ]);

    downloadCsv('Upstage_Inventory_Catalog', headers, rows);
  };

  const columns: Column<ProductItem>[] = [
    {
      key: 'name',
      header: 'Product & Barcode',
      sortable: true,
      render: (p) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{p.name}</div>
          <div style={{ fontSize: 11.5, color: '#64748B', fontFamily: 'monospace' }}>
            {p.barcode || 'NO BARCODE'} {p.brand ? `&bull; ${p.brand}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'shopName',
      header: 'Merchant Shop',
      sortable: true,
      render: (p) => (
        <div>
          <div style={{ fontWeight: 500, color: '#334155' }}>{p.shopName || 'Central'}</div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>{p.ownerName}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Type',
      sortable: true,
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge variant="neutral">{p.category}</Badge>
          {p.isGlobal && (
            <Badge variant="primary">
              <Globe size={10} style={{ marginRight: 3 }} /> Global
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'salesPrice',
      header: 'Selling Price',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono" style={{ fontWeight: 700, color: '#0F172A' }}>
          ₹{p.salesPrice.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'purchasePrice',
      header: 'Cost Price',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono" style={{ color: '#64748B' }}>
          ₹{p.purchasePrice > 0 ? p.purchasePrice.toFixed(2) : '—'}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'Stock Level',
      sortable: true,
      align: 'center',
      render: (p) => {
        const isOut = p.quantity <= 0;
        const isLow = p.quantity <= p.lowStockThreshold;

        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Badge variant={isOut ? 'danger' : isLow ? 'warning' : 'success'} dot>
              {p.quantity} {p.unitType}
            </Badge>
            {isLow && (
              <span style={{ fontSize: 10.5, color: isOut ? '#EF4444' : '#F59E0B' }}>
                {isOut ? 'Out of stock' : `Threshold: ${p.lowStockThreshold}`}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Products & Inventory Master"
        subtitle="Centralized product catalog, retail pricing, supplier costs, and low stock alert thresholds"
        breadcrumbs={['Products & Inventory']}
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
              placeholder="Search product, barcode, shop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
              style={{ paddingLeft: 32, width: 260 }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Stock Statuses</option>
            <option value="low">Low Stock Only (At/Below Threshold)</option>
            <option value="out">Out of Stock (0 Quantity)</option>
            <option value="healthy">Healthy Stock</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Channels</option>
            <option value="local">Local In-Store Inventory</option>
            <option value="global">Global Online Inventory</option>
          </select>
        </div>

        <div style={{ fontSize: 12.5, color: '#64748B' }}>
          Showing <strong>{filteredProducts.length}</strong> products
        </div>
      </div>

      {/* Catalog Table */}
      <DataTable
        columns={columns}
        data={filteredProducts}
        loading={loading}
        pageSize={12}
        keyExtractor={(p) => p.id}
      />
    </div>
  );
};
