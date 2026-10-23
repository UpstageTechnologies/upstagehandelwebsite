import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Search,
  Download,
  Eye,
  Truck,
  Building,
  Calendar,
  Layers,
} from 'lucide-react';
import { PurchaseInvoice } from '../types/crm';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { downloadCsv } from '../services/exportService';
import { parseAnyDate } from '../services/crmRepository';

interface PurchaseHistoryProps {
  purchases: PurchaseInvoice[];
  loading?: boolean;
}

export const PurchaseHistory: React.FC<PurchaseHistoryProps> = ({
  purchases,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);

  // Distinct suppliers
  const suppliers = useMemo(() => {
    return Array.from(new Set(purchases.map((p) => p.supplierName).filter(Boolean)));
  }, [purchases]);

  // Filtered purchases
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchSearch =
        p.billNo.toLowerCase().includes(search.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
        (p.shopName && p.shopName.toLowerCase().includes(search.toLowerCase()));

      const matchSupplier =
        supplierFilter === 'all' || p.supplierName.toLowerCase() === supplierFilter.toLowerCase();

      return matchSearch && matchSupplier;
    });
  }, [purchases, search, supplierFilter]);

  const totalSpent = useMemo(() => {
    return filteredPurchases.reduce((sum, p) => sum + p.total, 0);
  }, [filteredPurchases]);

  const handleExportCsv = () => {
    const headers = [
      'Invoice / Bill ID',
      'Supplier Name',
      'Shop Name',
      'Items Count',
      'Total Purchase Amount (INR)',
      'Date',
      'Catalog Scope',
    ];

    const rows = filteredPurchases.map((p) => [
      p.billNo,
      p.supplierName,
      p.shopName || '',
      p.items?.length || 0,
      p.total,
      parseAnyDate(p.createdAt).toLocaleDateString(),
      p.isGlobal ? 'Global' : 'Local',
    ]);

    downloadCsv('Upstage_Purchase_Invoices', headers, rows);
  };

  const columns: Column<PurchaseInvoice>[] = [
    {
      key: 'billNo',
      header: 'Invoice Reference',
      sortable: true,
      render: (p) => (
        <div>
          <span className="font-mono" style={{ fontWeight: 700, color: '#0F172A' }}>
            {p.billNo}
          </span>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            {parseAnyDate(p.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'supplierName',
      header: 'Vendor / Supplier',
      sortable: true,
      render: (p) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Truck size={14} color="#6366F1" />
          <span style={{ fontWeight: 600, color: '#1E293B' }}>{p.supplierName}</span>
        </div>
      ),
    },
    {
      key: 'shopName',
      header: 'Receiving Merchant',
      sortable: true,
      render: (p) => (
        <span style={{ fontWeight: 500, color: '#475569' }}>{p.shopName || 'Store'}</span>
      ),
    },
    {
      key: 'items',
      header: 'Products Restocked',
      render: (p) => (
        <span style={{ fontSize: 12.5, color: '#334155' }}>
          {p.items?.length || 0} line item(s)
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total Cost',
      sortable: true,
      align: 'right',
      render: (p) => (
        <span className="font-mono" style={{ fontWeight: 700, color: '#0284C7' }}>
          ₹{p.total.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInvoice(p);
          }}
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
        >
          <Eye size={13} />
          Invoice
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Purchase Invoices & Supplier Restock"
        subtitle="Supplier procurement records, unit cost analysis, and store replenishment history"
        breadcrumbs={['Purchase History']}
        actions={
          <button onClick={handleExportCsv} className="btn btn-secondary">
            <Download size={15} />
            Export CSV
          </button>
        }
      />

      {/* Aggregate KPI */}
      <div className="responsive-grid-3" style={{ gap: 14 }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Filtered Purchase Spend</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0284C7', marginTop: 2 }} className="font-mono">
            ₹{Math.round(totalSpent).toLocaleString()}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Invoices Processed</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
            {filteredPurchases.length} invoices
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Vendors</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#4F46E5', marginTop: 2 }}>
            {suppliers.length} vendors
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar" style={{ borderRadius: 10, border: '1px solid #E2E8F0' }}>
        <div className="filter-group">
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
            />
            <input
              type="text"
              placeholder="Search invoice number, supplier, shop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input filter-search-input"
              style={{ paddingLeft: 32 }}
            />
          </div>

          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Vendors ({suppliers.length})</option>
            {suppliers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: 12.5, color: '#64748B' }}>
          Showing <strong>{filteredPurchases.length}</strong> purchase invoices
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredPurchases}
        loading={loading}
        pageSize={12}
        keyExtractor={(p) => p.id}
        onRowClick={(p) => setSelectedInvoice(p)}
      />

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Purchase Invoice: ${selectedInvoice.billNo}`}
          subtitle={`Supplier: ${selectedInvoice.supplierName} &bull; Received by: ${selectedInvoice.shopName}`}
          maxWidth="680px"
          footer={
            <button onClick={() => setSelectedInvoice(null)} className="btn btn-secondary">
              Close Invoice
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="table-container" style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Restocked Product</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Unit Cost</th>
                    <th style={{ textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                    selectedInvoice.items.map((it, idx) => {
                      const name = it.name || it.itemName || 'Product';
                      const cost = Number(it.purchasePrice || 0);
                      const qty = Number(it.qty || 1);
                      return (
                        <tr key={idx}>
                          <td>
                            <strong>{name}</strong>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {qty} {it.unitType || 'Qty'}
                          </td>
                          <td style={{ textAlign: 'right' }} className="font-mono">
                            ₹{cost.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }} className="font-mono">
                            ₹{(cost * qty).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8' }}>
                        No items recorded
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>
                      Invoice Total:
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: '#0284C7' }} className="font-mono">
                      ₹{selectedInvoice.total.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
