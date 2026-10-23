import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Edit,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { UserRecord } from '../types/crm';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { downloadCsv } from '../services/exportService';
import { PLAN_PRICING, parseAnyDate } from '../services/crmRepository';

interface SubscriptionsProps {
  users: UserRecord[];
  loading?: boolean;
  onUpdatePlan: (uid: string, plan: string, durationDays: number) => Promise<void>;
}

export const Subscriptions: React.FC<SubscriptionsProps> = ({
  users,
  loading = false,
  onUpdatePlan,
}) => {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);

  // Form states for manual plan modification
  const [targetPlan, setTargetPlan] = useState<'Basic' | 'Premium' | 'Pro' | 'Free Trial'>('Premium');
  const [targetDays, setTargetDays] = useState(30);
  const [updating, setUpdating] = useState(false);

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // Filtered subscribers
  const filteredSubscribers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.shopName.toLowerCase().includes(search.toLowerCase()) ||
        u.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.razorpayPaymentId && u.razorpayPaymentId.toLowerCase().includes(search.toLowerCase()));

      const matchPlan =
        planFilter === 'all' ||
        u.subscriptionPlan.toLowerCase().includes(planFilter.toLowerCase());

      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = u.subscriptionActive;
      else if (statusFilter === 'expired') matchStatus = !u.subscriptionActive;
      else if (statusFilter === 'trial') matchStatus = u.subscriptionPlan.toLowerCase().includes('trial');
      else if (statusFilter === 'expiring_soon') {
        const diff = (u.subscriptionExpiry || 0) - now;
        matchStatus = diff > 0 && diff <= sevenDaysMs;
      }

      return matchSearch && matchPlan && matchStatus;
    });
  }, [users, search, planFilter, statusFilter, now]);

  const handleExportCsv = () => {
    const headers = [
      'Shop Name',
      'Owner',
      'Plan',
      'Status',
      'Days Remaining',
      'Expiration Date',
      'Payment Reference',
      'Verified Revenue (INR)',
    ];

    const rows = filteredSubscribers.map((u) => {
      const daysLeft = u.subscriptionExpiry
        ? Math.ceil((u.subscriptionExpiry - now) / (1000 * 60 * 60 * 24))
        : 0;
      const revenue = u.razorpayPaymentId ? PLAN_PRICING[u.subscriptionPlan] || 0 : 0;

      return [
        u.shopName,
        u.ownerName,
        u.subscriptionPlan,
        u.subscriptionActive ? 'Active' : 'Expired',
        daysLeft > 0 ? daysLeft : 0,
        u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toLocaleDateString() : 'N/A',
        u.razorpayPaymentId || 'None / Trial',
        revenue,
      ];
    });

    downloadCsv('Upstage_Subscriptions_Report', headers, rows);
  };

  const handleSavePlanModification = async () => {
    if (!editingUser) return;
    setUpdating(true);
    try {
      await onUpdatePlan(editingUser.id, targetPlan, targetDays);
      setEditingUser(null);
    } catch (err: any) {
      alert(`Error updating plan: ${err.message || 'Unknown error'}`);
    } finally {
      setUpdating(false);
    }
  };

  const columns: Column<UserRecord>[] = [
    {
      key: 'shopName',
      header: 'Subscriber / Shop',
      sortable: true,
      render: (u) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{u.shopName}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            {u.ownerName} &bull; <span className="font-mono">{u.customShopUid || u.id.slice(0, 8)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'subscriptionPlan',
      header: 'Plan',
      sortable: true,
      render: (u) => {
        const isPro = u.subscriptionPlan.includes('Pro');
        const isPrem = u.subscriptionPlan.includes('Premium');
        return (
          <Badge variant={isPro ? 'warning' : isPrem ? 'success' : 'primary'}>
            {u.subscriptionPlan}
          </Badge>
        );
      },
    },
    {
      key: 'subscriptionActive',
      header: 'Status',
      sortable: true,
      render: (u) => {
        const diff = (u.subscriptionExpiry || 0) - now;
        const isExpiringSoon = diff > 0 && diff <= sevenDaysMs;

        if (isExpiringSoon) {
          return <Badge variant="warning" dot>Expiring Soon</Badge>;
        }
        return (
          <Badge variant={u.subscriptionActive ? 'success' : 'danger'} dot>
            {u.subscriptionActive ? 'Active' : 'Expired'}
          </Badge>
        );
      },
    },
    {
      key: 'subscriptionExpiry',
      header: 'Days Left / Expiry',
      sortable: true,
      render: (u) => {
        if (!u.subscriptionExpiry) return <span style={{ color: '#94A3B8' }}>Indefinite / Trial</span>;
        const diff = u.subscriptionExpiry - now;
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        const formattedDate = new Date(u.subscriptionExpiry).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        return (
          <div>
            <span
              style={{
                fontWeight: 600,
                color: days <= 0 ? '#EF4444' : days <= 7 ? '#F59E0B' : '#10B981',
              }}
            >
              {days > 0 ? `${days} days left` : 'Expired'}
            </span>
            <div style={{ fontSize: 11.5, color: '#64748B' }}>{formattedDate}</div>
          </div>
        );
      },
    },
    {
      key: 'razorpayPaymentId',
      header: 'Payment & Revenue',
      sortable: true,
      render: (u) => {
        if (!u.razorpayPaymentId) {
          return <span style={{ color: '#94A3B8', fontSize: 12 }}>Unbilled / Trial</span>;
        }
        const rev = PLAN_PRICING[u.subscriptionPlan] || 0;
        return (
          <div>
            <div style={{ fontWeight: 600, color: '#0F172A', fontFamily: 'monospace' }}>
              ₹{rev.toLocaleString()}
            </div>
            <div style={{ fontSize: 11, color: '#64748B', fontFamily: 'monospace' }}>
              Ref: {u.razorpayPaymentId.slice(0, 14)}...
            </div>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (u) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingUser(u);
            setTargetPlan((u.subscriptionPlan as any) || 'Premium');
          }}
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
        >
          <Edit size={13} />
          Adjust Plan
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Subscription Management"
        subtitle="Monitor subscription health, expiration timers, Razorpay transactions, and assign plans"
        breadcrumbs={['Subscriptions']}
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
              placeholder="Search shop, owner, payment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
              style={{ paddingLeft: 32, width: 260 }}
            />
          </div>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Plans</option>
            <option value="Pro">Pro Plans</option>
            <option value="Premium">Premium Plans</option>
            <option value="Basic">Basic Plans</option>
            <option value="Trial">Free Trial</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Subscriptions</option>
            <option value="expiring_soon">Expiring in &le; 7 Days</option>
            <option value="expired">Expired Subscriptions</option>
            <option value="trial">Trial Subscriptions</option>
          </select>
        </div>

        <div style={{ fontSize: 12.5, color: '#64748B' }}>
          Showing <strong>{filteredSubscribers.length}</strong> subscribers
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredSubscribers}
        loading={loading}
        pageSize={12}
        keyExtractor={(u) => u.id}
      />

      {/* Manual Plan Adjustment Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Adjust Plan: ${editingUser.shopName}`}
          subtitle={`Current plan: ${editingUser.subscriptionPlan} (Expiry: ${
            editingUser.subscriptionExpiry
              ? new Date(editingUser.subscriptionExpiry).toLocaleDateString()
              : 'N/A'
          })`}
          footer={
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleSavePlanModification}
                className="btn btn-primary"
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Save Plan Changes'}
              </button>
              <button onClick={() => setEditingUser(null)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                Select Subscription Plan
              </label>
              <select
                value={targetPlan}
                onChange={(e) => setTargetPlan(e.target.value as any)}
                className="filter-input"
                style={{ width: '100%', height: 40 }}
              >
                <option value="Basic">Basic Plan (Free, 10 inventory items, 1 month report)</option>
                <option value="Premium">Premium Plan (₹499/mo, 200 purchases, unlimited scans)</option>
                <option value="Pro">Pro Plan (₹1999/mo, Unlimited inventory & reports)</option>
                <option value="Free Trial">Free Trial (30 days complimentary trial)</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#334155' }}>
                Extend Duration (Days)
              </label>
              <select
                value={targetDays}
                onChange={(e) => setTargetDays(Number(e.target.value))}
                className="filter-input"
                style={{ width: '100%', height: 40 }}
              >
                <option value={7}>7 Days Extension</option>
                <option value={30}>30 Days (1 Month)</option>
                <option value={90}>90 Days (Quarterly)</option>
                <option value={365}>365 Days (1 Full Year)</option>
              </select>
            </div>

            <div
              style={{
                backgroundColor: '#EEF2FF',
                padding: 12,
                borderRadius: 8,
                fontSize: 12.5,
                color: '#3730A3',
              }}
            >
              This administrative action will update the user's subscription record in Firestore, reset their feature limits, and recalculate their expiration date starting from today.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
