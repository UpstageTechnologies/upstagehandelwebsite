import React, { useState, useMemo } from 'react';
import {
  Users as UsersIcon,
  Search,
  Filter,
  Download,
  Eye,
  Store,
  ShieldAlert,
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { UserRecord } from '../types/crm';
import { DataTable, Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { downloadCsv } from '../services/exportService';
import { parseAnyDate } from '../services/crmRepository';

interface UsersProps {
  users: UserRecord[];
  loading?: boolean;
  onSelectShop: (shopId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const Users: React.FC<UsersProps> = ({
  users,
  loading = false,
  onSelectShop,
  onNavigateTab,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        u.ownerName.toLowerCase().includes(search.toLowerCase()) ||
        u.shopName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.phone.includes(search) ||
        (u.customShopUid && u.customShopUid.toLowerCase().includes(search.toLowerCase()));

      const matchRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.subscriptionActive) ||
        (statusFilter === 'inactive' && !u.subscriptionActive);

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleExportCsv = () => {
    const headers = [
      'User ID',
      'Owner Name',
      'Shop Name',
      'Email',
      'Phone',
      'Role',
      'Shop Type',
      'Subscription Plan',
      'Subscription Status',
      'Expiry Date',
      'Registration Date',
    ];

    const rows = filteredUsers.map((u) => [
      u.customShopUid || u.id,
      u.ownerName,
      u.shopName,
      u.email,
      u.phone,
      u.role,
      u.shopType,
      u.subscriptionPlan,
      u.subscriptionActive ? 'Active' : 'Inactive/Expired',
      u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toLocaleDateString() : 'N/A',
      parseAnyDate(u.createdAt).toLocaleDateString(),
    ]);

    downloadCsv('Upstage_Users_Directory', headers, rows);
  };

  const columns: Column<UserRecord>[] = [
    {
      key: 'customShopUid',
      header: 'User / Shop ID',
      sortable: true,
      render: (u) => (
        <div>
          <span className="font-mono" style={{ fontWeight: 600, color: '#0F172A' }}>
            {u.customShopUid || u.id.slice(0, 10)}
          </span>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>{u.role.toUpperCase()}</div>
        </div>
      ),
    },
    {
      key: 'ownerName',
      header: 'Owner & Shop',
      sortable: true,
      render: (u) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0F172A' }}>{u.ownerName}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>{u.shopName}</div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Contact Info',
      sortable: true,
      render: (u) => (
        <div>
          <div style={{ fontSize: 12.5, color: '#334155' }}>{u.email || '—'}</div>
          <div style={{ fontSize: 11.5, color: '#64748B' }}>{u.phone || '—'}</div>
        </div>
      ),
    },
    {
      key: 'subscriptionPlan',
      header: 'Plan',
      sortable: true,
      render: (u) => {
        const isPro = (u.subscriptionPlan || '').includes('Pro');
        const isPrem = (u.subscriptionPlan || '').includes('Premium');
        return (
          <Badge variant={isPro ? 'warning' : isPrem ? 'success' : 'primary'}>
            {u.subscriptionPlan || 'Free Trial'}
          </Badge>
        );
      },
    },
    {
      key: 'subscriptionActive',
      header: 'Status',
      sortable: true,
      render: (u) => (
        <Badge variant={u.subscriptionActive ? 'success' : 'danger'} dot>
          {u.subscriptionActive ? 'Active' : 'Expired'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Registered On',
      sortable: true,
      render: (u) => {
        const d = parseAnyDate(u.createdAt);
        return (
          <span style={{ fontSize: 12.5, color: '#475569' }}>
            {d.getTime() > 0 ? d.toLocaleDateString() : 'Recorded'}
          </span>
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
            setSelectedUser(u);
          }}
          className="btn btn-secondary"
          style={{ padding: '4px 10px', fontSize: 12 }}
        >
          <Eye size={13} />
          View
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Users & Registered Accounts"
        subtitle="Manage store owners, administrators, account permissions, and active subscriptions"
        breadcrumbs={['Users']}
        actions={
          <button onClick={handleExportCsv} className="btn btn-secondary">
            <Download size={15} />
            Export CSV
          </button>
        }
      />

      {/* Audit Limitation Notice */}
      <div
        style={{
          padding: '10px 16px',
          backgroundColor: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 12.5,
          color: '#475569',
        }}
      >
        <Info size={16} color="#0284C7" />
        <span>
          <strong>Audit Note:</strong> Registration dates reflect verified Firestore user profiles. Historical login session events are not stored in separate ledgers in the POS schema; current active states and available last-login timestamps are presented above.
        </span>
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
              placeholder="Search user, shop, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
              style={{ paddingLeft: 32, width: 260 }}
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Roles</option>
            <option value="seller">Seller / Shop Owner</option>
            <option value="admin">Administrator</option>
            <option value="staff">Staff</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-input"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive / Expired</option>
          </select>
        </div>

        <div style={{ fontSize: 12.5, color: '#64748B' }}>
          Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> accounts
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        pageSize={12}
        keyExtractor={(u) => u.id}
        onRowClick={(u) => setSelectedUser(u)}
      />

      {/* User Details Modal */}
      {selectedUser && (
        <Modal
          isOpen={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          title={`User Profile: ${selectedUser.ownerName}`}
          subtitle={`Account ID: ${selectedUser.customShopUid || selectedUser.id}`}
          footer={
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  onSelectShop(selectedUser.id);
                  onNavigateTab('shops');
                  setSelectedUser(null);
                }}
                className="btn btn-primary"
              >
                <Store size={14} />
                Open Shop Inspector
              </button>
              <button onClick={() => setSelectedUser(null)} className="btn btn-secondary">
                Close
              </button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Quick Summary Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 16,
                backgroundColor: '#F8FAFC',
                padding: 16,
                borderRadius: 10,
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                  Shop Name
                </span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>
                  {selectedUser.shopName}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                  Subscription Status
                </span>
                <div style={{ marginTop: 4 }}>
                  <Badge variant={selectedUser.subscriptionActive ? 'success' : 'danger'} dot>
                    {selectedUser.subscriptionPlan} ({selectedUser.subscriptionActive ? 'Active' : 'Expired'})
                  </Badge>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                  Email Address
                </span>
                <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                  {selectedUser.email || 'Not provided'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase', fontWeight: 600 }}>
                  Contact Phone
                </span>
                <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                  {selectedUser.phone || 'Not provided'}
                </div>
              </div>
            </div>

            {/* Account Metadata */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Account & Location Specifications
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
                <div>
                  <span style={{ color: '#64748B' }}>Business Category:</span>{' '}
                  <strong>{selectedUser.shopType}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Delivery Scope:</span>{' '}
                  <strong>{selectedUser.deliveryScope || 'Local'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>GSTIN Number:</span>{' '}
                  <strong>{selectedUser.gstNumber || 'Unregistered'}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Plan Expiry:</span>{' '}
                  <strong>
                    {selectedUser.subscriptionExpiry
                      ? new Date(selectedUser.subscriptionExpiry).toLocaleDateString()
                      : 'Indefinite / Trial'}
                  </strong>
                </div>
              </div>

              <div style={{ marginTop: 8 }}>
                <span style={{ color: '#64748B', fontSize: 12 }}>Address:</span>
                <div style={{ fontSize: 13, color: '#334155', marginTop: 2 }}>
                  {typeof selectedUser.address === 'object' && selectedUser.address !== null
                    ? selectedUser.address.fullAddress || JSON.stringify(selectedUser.address)
                    : selectedUser.address || 'No physical address recorded'}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
