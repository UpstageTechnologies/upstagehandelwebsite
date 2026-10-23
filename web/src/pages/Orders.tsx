import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Search,
  Download,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Globe,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { OrderRecord } from '../types/crm';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { downloadCsv } from '../services/exportService';
import { parseAnyDate } from '../services/crmRepository';

interface OrdersProps {
  orders: OrderRecord[];
  loading?: boolean;
  onUpdateStatus: (shopId: string, orderId: string, newStatus: string, isGlobal: boolean) => Promise<void>;
}

export const Orders: React.FC<OrdersProps> = ({
  orders,
  loading = false,
  onUpdateStatus,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [updating, setUpdating] = useState(false);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        o.orderId.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (o.customerPhone && o.customerPhone.includes(search)) ||
        (o.shopName && o.shopName.toLowerCase().includes(search.toLowerCase()));

      let matchStatus = true;
      if (statusFilter === 'pending') {
        matchStatus =
          o.status.toLowerCase().includes('pending') ||
          o.status.toLowerCase().includes('verification') ||
          o.status.toLowerCase().includes('preparing');
      } else if (statusFilter === 'completed') {
        matchStatus =
          o.status.toLowerCase().includes('completed') ||
          o.status.toLowerCase().includes('delivered');
      } else if (statusFilter === 'rejected') {
        matchStatus =
          o.status.toLowerCase().includes('rejected') ||
          o.status.toLowerCase().includes('cancelled');
      }

      const matchChannel =
        channelFilter === 'all' ||
        (channelFilter === 'global' && o.isGlobalMode) ||
        (channelFilter === 'local' && !o.isGlobalMode);

      return matchSearch && matchStatus && matchChannel;
    });
  }, [orders, search, statusFilter, channelFilter]);

  const handleExportCsv = () => {
    const headers = [
      'Order ID',
      'Shop',
      'Customer Name',
      'Customer Phone',
      'Order Type',
      'Channel',
      'Status',
      'Item Count',
      'Total Amount (INR)',
      'Payment Mode',
      'Order Date',
    ];

    const rows = filteredOrders.map((o) => [
      o.orderId,
      o.shopName || '',
      o.customerName,
      o.customerPhone || 'N/A',
      o.orderType,
      o.isGlobalMode ? 'Global Delivery' : 'Local POS',
      o.status,
      o.items?.length || 0,
      o.total,
      o.paymentMode || 'Online/Cash',
      parseAnyDate(o.createdAt).toLocaleDateString(),
    ]);

    downloadCsv('Upstage_Orders_Report', headers, rows);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    setUpdating(true);
    try {
      await onUpdateStatus(selectedOrder.shopId, selectedOrder.id, newStatus, selectedOrder.isGlobalMode);
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    } catch (err: any) {
      alert(`Status update failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('delivered')) return <Badge variant="success" dot>{status}</Badge>;
    if (s.includes('pending') || s.includes('verification')) return <Badge variant="warning" dot>{status}</Badge>;
    if (s.includes('preparing') || s.includes('ready')) return <Badge variant="info" dot>{status}</Badge>;
    if (s.includes('rejected') || s.includes('cancelled')) return <Badge variant="danger" dot>{status}</Badge>;
    return <Badge variant="neutral">{status}</Badge>;
  };

  const columns: Column<OrderRecord>[] = [
    {
      key: 'orderId',
      header: 'Order Reference',
      sortable: true,
      render: (o) => (
        <div>
          <span className="font-mono" style={{ fontWeight: 700, color: '#0F172A' }}>
            #{o.orderId}
          </span>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            {parseAnyDate(o.createdAt).toLocaleDateString('en-IN', {
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
      header: 'Seller Shop',
      sortable: true,
      render: (o) => (
        <span style={{ fontWeight: 600, color: '#334155' }}>{o.shopName || 'Upstage Store'}</span>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      sortable: true,
      render: (o) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{o.customerName}</div>
          <div style={{ fontSize: 11.5, color: '#64748B' }}>{o.customerPhone || 'No phone'}</div>
        </div>
      ),
    },
    {
      key: 'isGlobalMode',
      header: 'Channel & Type',
      sortable: true,
      render: (o) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Badge variant={o.isGlobalMode ? 'primary' : 'neutral'}>
            {o.isGlobalMode ? <Globe size={11} style={{ marginRight: 3 }} /> : null}
            {o.isGlobalMode ? 'Global Delivery' : 'Local POS'}
          </Badge>
          <span style={{ fontSize: 12, color: '#64748B' }}>{o.orderType}</span>
        </div>
      ),
    },
    {
      key: 'total',
      header: 'Total Amount',
      sortable: true,
      align: 'right',
      render: (o) => (
        <span className="font-mono" style={{ fontWeight: 700, color: '#0F172A' }}>
          ₹{o.total.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (o) => getStatusBadge(o.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (o) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedOrder(o);
          }}
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
        >
          <Eye size={13} />
          Details
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Global & Local Orders"
        subtitle="Live order queue, delivery fulfillment statuses, and verified customer transaction details"
        breadcrumbs={['Orders']}
        actions={
          <button onClick={handleExportCsv} className="btn btn-secondary">
            <Download size={15} />
            Export CSV
          </button>
        }
      />

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
              placeholder="Search order ID, customer, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
              style={{ paddingLeft: 32, width: 260 }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Order Statuses</option>
            <option value="pending">Pending / Verification / Preparing</option>
            <option value="completed">Completed / Delivered</option>
            <option value="rejected">Rejected / Cancelled</option>
          </select>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Order Channels</option>
            <option value="local">Local In-Store Orders</option>
            <option value="global">Global Online Deliveries</option>
          </select>
        </div>

        <div style={{ fontSize: 12.5, color: '#64748B' }}>
          Showing <strong>{filteredOrders.length}</strong> orders
        </div>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={filteredOrders}
        loading={loading}
        pageSize={12}
        keyExtractor={(o) => o.id}
        onRowClick={(o) => setSelectedOrder(o)}
      />

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order #${selectedOrder.orderId}`}
          subtitle={`Placed at ${selectedOrder.shopName} on ${parseAnyDate(
            selectedOrder.createdAt
          ).toLocaleString()}`}
          maxWidth="720px"
          footer={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Update Status:</span>
                {(['Preparing', 'Ready', 'Completed', 'Rejected'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    disabled={updating || selectedOrder.status === st}
                    className={`btn ${
                      st === 'Rejected'
                        ? 'btn-danger'
                        : st === 'Completed'
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }`}
                    style={{ padding: '4px 10px', fontSize: 11.5 }}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Customer & Delivery Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 16,
                backgroundColor: '#F8FAFC',
                padding: 16,
                borderRadius: 10,
              }}
            >
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Customer Details
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 4 }}>
                  {selectedOrder.customerName}
                </div>
                <div style={{ fontSize: 12.5, color: '#475569', marginTop: 2 }}>
                  Phone: {selectedOrder.customerPhone || 'Not provided'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Order Channel & Status
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <Badge variant={selectedOrder.isGlobalMode ? 'primary' : 'neutral'}>
                    {selectedOrder.isGlobalMode ? 'Global Delivery' : 'Local POS'}
                  </Badge>
                  {getStatusBadge(selectedOrder.status)}
                </div>
              </div>

              {selectedOrder.deliveryAddress && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    Delivery Destination
                  </div>
                  <div style={{ fontSize: 12.5, color: '#334155', marginTop: 2 }}>
                    {typeof selectedOrder.deliveryAddress === 'object'
                      ? JSON.stringify(selectedOrder.deliveryAddress)
                      : selectedOrder.deliveryAddress}
                  </div>
                </div>
              )}
            </div>

            {/* Line items table */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Order Line Items
              </h4>
              <table className="data-table" style={{ border: '1px solid #E2E8F0', borderRadius: 8 }}>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ textAlign: 'center' }}>Quantity</th>
                    <th style={{ textAlign: 'right' }}>Unit Price</th>
                    <th style={{ textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, idx) => {
                      const name = item.name || item.itemName || 'Product Item';
                      const price = Number(item.price || item.salesPrice || 0);
                      const qty = Number(item.qty || 1);
                      return (
                        <tr key={`item-${idx}`}>
                          <td>
                            <strong>{name}</strong>
                          </td>
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
                        No line items recorded
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#F8FAFC' }}>
                    <td colSpan={3} style={{ textAlign: 'right', fontWeight: 700, color: '#0F172A' }}>
                      Grand Total:
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: '#0F172A' }} className="font-mono">
                      ₹{selectedOrder.total.toLocaleString()}
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
