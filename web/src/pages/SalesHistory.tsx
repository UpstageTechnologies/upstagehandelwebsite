import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Search,
  Download,
  Eye,
  Calendar,
  CreditCard,
  DollarSign,
  Receipt,
  Layers,
} from 'lucide-react';
import { SaleTransaction } from '../types/crm';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { downloadCsv } from '../services/exportService';
import { parseAnyDate } from '../services/crmRepository';

interface SalesHistoryProps {
  sales: SaleTransaction[];
  loading?: boolean;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({
  sales,
  loading = false,
}) => {
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const [selectedSale, setSelectedSale] = useState<SaleTransaction | null>(null);

  // Filtered sales
  const filteredSales = useMemo(() => {
    const now = Date.now();
    return sales.filter((s) => {
      const matchSearch =
        s.billNo.toLowerCase().includes(search.toLowerCase()) ||
        (s.shopName && s.shopName.toLowerCase().includes(search.toLowerCase())) ||
        (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (s.razorpayPaymentId && s.razorpayPaymentId.toLowerCase().includes(search.toLowerCase()));

      const matchPayment =
        paymentFilter === 'all' || s.paymentMode.toLowerCase() === paymentFilter.toLowerCase();

      let matchDate = true;
      const saleTime = parseAnyDate(s.createdAt).getTime();
      if (dateRange === 'today') {
        const startOfDay = new Date().setHours(0, 0, 0, 0);
        matchDate = saleTime >= startOfDay;
      } else if (dateRange === '7d') {
        matchDate = saleTime >= now - 7 * 24 * 60 * 60 * 1000;
      } else if (dateRange === '30d') {
        matchDate = saleTime >= now - 30 * 24 * 60 * 60 * 1000;
      }

      return matchSearch && matchPayment && matchDate;
    });
  }, [sales, search, paymentFilter, dateRange]);

  // Aggregated totals for current filter
  const summary = useMemo(() => {
    const totalGross = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = filteredSales.reduce((sum, s) => sum + (s.profit || 0), 0);
    const count = filteredSales.length;
    const avgTicket = count > 0 ? totalGross / count : 0;
    return { totalGross, totalProfit, count, avgTicket };
  }, [filteredSales]);

  const handleExportCsv = () => {
    const headers = [
      'Bill Number / Invoice',
      'Date & Time',
      'Shop Name',
      'Items Count',
      'Gross Sales (INR)',
      'Estimated Profit (INR)',
      'Payment Mode',
      'Payment Ref',
      'Channel',
    ];

    const rows = filteredSales.map((s) => [
      s.billNo,
      parseAnyDate(s.createdAt).toLocaleString(),
      s.shopName || '',
      s.items?.length || 0,
      s.total,
      s.profit,
      s.paymentMode,
      s.razorpayPaymentId || 'N/A',
      s.isGlobalMode ? 'Global' : 'Local POS',
    ]);

    downloadCsv('Upstage_Sales_History', headers, rows);
  };

  const columns: Column<SaleTransaction>[] = [
    {
      key: 'billNo',
      header: 'Bill No / Receipt',
      sortable: true,
      render: (s) => (
        <div>
          <span className="font-mono" style={{ fontWeight: 700, color: '#0F172A' }}>
            {s.billNo}
          </span>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            {parseAnyDate(s.createdAt).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'shopName',
      header: 'Merchant Store',
      sortable: true,
      render: (s) => (
        <span style={{ fontWeight: 600, color: '#334155' }}>{s.shopName || 'Store'}</span>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (s) => (
        <span style={{ color: '#475569', fontSize: 12.5 }}>
          {s.items?.length || 0} line item(s)
        </span>
      ),
    },
    {
      key: 'paymentMode',
      header: 'Payment Method',
      sortable: true,
      render: (s) => {
        const mode = (s.paymentMode || 'CASH').toUpperCase();
        return (
          <Badge
            variant={
              mode === 'ONLINE' || mode === 'UPI'
                ? 'primary'
                : mode === 'CARD'
                ? 'info'
                : 'neutral'
            }
          >
            {mode}
          </Badge>
        );
      },
    },
    {
      key: 'total',
      header: 'Gross Total',
      sortable: true,
      align: 'right',
      render: (s) => (
        <span className="font-mono" style={{ fontWeight: 700, color: '#10B981' }}>
          ₹{s.total.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'profit',
      header: 'Gross Margin',
      sortable: true,
      align: 'right',
      render: (s) => (
        <span className="font-mono" style={{ color: '#475569', fontSize: 12.5 }}>
          ₹{Math.round(s.profit || 0).toLocaleString()}
        </span>
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
            setSelectedSale(s);
          }}
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
        >
          <Eye size={13} />
          Receipt
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Sales History & Receipts"
        subtitle="Permanent ledger of completed POS billing transactions, profit margins, and daily closures"
        breadcrumbs={['Sales History']}
        actions={
          <button onClick={handleExportCsv} className="btn btn-secondary">
            <Download size={15} />
            Export CSV
          </button>
        }
      />

      {/* Aggregate summary cards for active filter */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Filtered Gross Sales</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#10B981', marginTop: 2 }} className="font-mono">
            ₹{Math.round(summary.totalGross).toLocaleString()}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Estimated Profit</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#4F46E5', marginTop: 2 }} className="font-mono">
            ₹{Math.round(summary.totalProfit).toLocaleString()}
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Bills Executed</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>
            {summary.count} receipts
          </div>
        </div>

        <div style={{ backgroundColor: '#FFFFFF', padding: 16, borderRadius: 10, border: '1px solid #E2E8F0' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Avg. Ticket Value</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#334155', marginTop: 2 }} className="font-mono">
            ₹{Math.round(summary.avgTicket).toLocaleString()}
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
              placeholder="Search bill number, shop..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
              style={{ paddingLeft: 32, width: 260 }}
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Payment Methods</option>
            <option value="CASH">Cash Transactions</option>
            <option value="UPI">UPI / QR Code</option>
            <option value="CARD">Debit / Credit Card</option>
            <option value="ONLINE">Online Payments</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="filter-input"
          >
            <option value="today">Today's Transactions</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All-Time Records</option>
          </select>
        </div>

        <div style={{ fontSize: 12.5, color: '#64748B' }}>
          Showing <strong>{filteredSales.length}</strong> transactions
        </div>
      </div>

      {/* Sales Table */}
      <DataTable
        columns={columns}
        data={filteredSales}
        loading={loading}
        pageSize={12}
        keyExtractor={(s) => s.id}
        onRowClick={(s) => setSelectedSale(s)}
      />

      {/* Receipt Modal */}
      {selectedSale && (
        <Modal
          isOpen={!!selectedSale}
          onClose={() => setSelectedSale(null)}
          title={`Receipt #${selectedSale.billNo}`}
          subtitle={`Merchant: ${selectedSale.shopName} &bull; Date: ${parseAnyDate(
            selectedSale.createdAt
          ).toLocaleString()}`}
          maxWidth="640px"
          footer={
            <button onClick={() => setSelectedSale(null)} className="btn btn-secondary">
              Close Receipt
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                backgroundColor: '#F8FAFC',
                padding: 14,
                borderRadius: 8,
                fontSize: 12.5,
              }}
            >
              <div>
                <span style={{ color: '#64748B' }}>Payment Method:</span>{' '}
                <strong>{selectedSale.paymentMode}</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Channel:</span>{' '}
                <strong>{selectedSale.isGlobalMode ? 'Global Delivery' : 'Local POS'}</strong>
              </div>
              {selectedSale.razorpayPaymentId && (
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: '#64748B' }}>Gateway Payment ID:</span>{' '}
                  <span className="font-mono">{selectedSale.razorpayPaymentId}</span>
                </div>
              )}
            </div>

            <table className="data-table" style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items && selectedSale.items.length > 0 ? (
                  selectedSale.items.map((it, idx) => {
                    const name = it.name || it.itemName || 'Product';
                    const price = Number(it.price || it.salesPrice || 0);
                    const qty = Number(it.qty || 1);
                    return (
                      <tr key={idx}>
                        <td>{name}</td>
                        <td style={{ textAlign: 'center' }}>{qty}</td>
                        <td style={{ textAlign: 'right' }} className="font-mono">
                          ₹{price.toFixed(2)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }} className="font-mono">
                          ₹{(price * qty).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8' }}>
                      No individual items recorded
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: '#F8FAFC' }}>
                  <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700 }}>
                    Final Bill Total:
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: '#10B981' }} className="font-mono">
                    ₹{selectedSale.total.toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Modal>
      )}
    </div>
  );
};
