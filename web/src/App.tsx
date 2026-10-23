import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchUsers,
  loadFullEcosystemData,
  updateOrderStatusInDb,
  updateSubscriptionPlanInDb,
} from './services/crmRepository';
import {
  AdminUser,
  subscribeToAdminAuth,
  adminSignOut,
} from './services/authService';
import {
  UserRecord,
  ProductItem,
  SaleTransaction,
  PurchaseInvoice,
  OrderRecord,
  OperationalAlert,
  DashboardKPIs,
} from './types/crm';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { Overview } from './pages/Overview';
import { Users } from './pages/Users';
import { Subscriptions } from './pages/Subscriptions';
import { Shops } from './pages/Shops';
import { ProductsInventory } from './pages/ProductsInventory';
import { Orders } from './pages/Orders';
import { SalesHistory } from './pages/SalesHistory';
import { PurchaseHistory } from './pages/PurchaseHistory';
import { ReportsAnalytics } from './pages/ReportsAnalytics';
import { ActivityAlerts } from './pages/ActivityAlerts';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { AlertCircle, RefreshCw } from 'lucide-react';

const INITIAL_KPIS: DashboardKPIs = {
  totalUsers: 0,
  activeUsers: 0,
  inactiveUsers: 0,
  totalShops: 0,
  activeSubscriptions: 0,
  expiredSubscriptions: 0,
  trialSubscriptions: 0,
  verifiedSubscriptionRevenue: 0,
  totalOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
  totalSalesAmount: 0,
  totalProfit: 0,
  totalPurchasesAmount: 0,
  lowStockCount: 0,
};

export default function App() {
  // Admin Auth State
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Layout State
  const [currentTab, setCurrentTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Ecosystem Data State
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs>(INITIAL_KPIS);

  const [dataLoading, setDataLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Subscribe to Firebase Auth
  useEffect(() => {
    // Check if demo admin session was stored in localStorage
    const saved = localStorage.getItem('upstage_crm_admin_session');
    if (saved) {
      try {
        setAdmin(JSON.parse(saved));
        setAuthLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('upstage_crm_admin_session');
      }
    }

    const unsub = subscribeToAdminAuth((authAdmin, loading) => {
      setAdmin(authAdmin);
      setAuthLoading(loading);
    });
    return () => unsub();
  }, []);

  // Fetch full ecosystem data
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setDataLoading(true);
    setFetchError(null);

    try {
      const data = await loadFullEcosystemData();
      setUsers(data.users);
      setProducts(data.products);
      setSales(data.sales);
      setPurchases(data.purchases);
      setOrders(data.orders);
      setAlerts(data.alerts);
      setKpis(data.kpis);
    } catch (err: any) {
      console.error('Failed to load ecosystem data:', err);
      setFetchError(
        err.message || 'Failed to retrieve records from Firebase Firestore. Please check network connection.'
      );
    } finally {
      setDataLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (admin) {
      loadData();
    }
  }, [admin, loadData]);

  // Handle Login Success
  const handleLoginSuccess = (adminUser: AdminUser) => {
    setAdmin(adminUser);
    localStorage.setItem('upstage_crm_admin_session', JSON.stringify(adminUser));
  };

  // Handle Logout
  const handleLogout = async () => {
    await adminSignOut();
    setAdmin(null);
  };

  // Status and Plan update actions
  const handleUpdateOrderStatus = async (
    shopId: string,
    orderId: string,
    newStatus: string,
    isGlobal: boolean
  ) => {
    await updateOrderStatusInDb(shopId, orderId, newStatus, isGlobal);
    // Optimistic local update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleUpdateSubscriptionPlan = async (
    uid: string,
    newPlan: string,
    durationDays: number
  ) => {
    await updateSubscriptionPlanInDb(uid, newPlan, durationDays);
    await loadData(true);
  };

  // Filtered dataset when a specific shop is selected in topbar
  const scopedProducts = useMemo(() => {
    if (selectedShopId === 'all') return products;
    return products.filter((p) => p.shopId === selectedShopId);
  }, [products, selectedShopId]);

  const scopedSales = useMemo(() => {
    if (selectedShopId === 'all') return sales;
    return sales.filter((s) => s.shopId === selectedShopId);
  }, [sales, selectedShopId]);

  const scopedPurchases = useMemo(() => {
    if (selectedShopId === 'all') return purchases;
    return purchases.filter((p) => p.shopId === selectedShopId);
  }, [purchases, selectedShopId]);

  const scopedOrders = useMemo(() => {
    if (selectedShopId === 'all') return orders;
    return orders.filter((o) => o.shopId === selectedShopId);
  }, [orders, selectedShopId]);

  const scopedUsers = useMemo(() => {
    if (selectedShopId === 'all') return users;
    return users.filter((u) => u.id === selectedShopId);
  }, [users, selectedShopId]);

  const scopedAlerts = useMemo(() => {
    if (selectedShopId === 'all') return alerts;
    return alerts.filter((a) => a.shopId === selectedShopId);
  }, [alerts, selectedShopId]);

  const selectedShopObj = users.find((u) => u.id === selectedShopId);

  // Tab Breadcrumb label
  const breadcrumbMap: Record<string, string> = {
    overview: 'Overview Dashboard',
    users: 'Users Directory',
    subscriptions: 'Subscriptions',
    shops: 'Shop Directory',
    inventory: 'Products & Inventory',
    orders: 'Customer Orders',
    sales: 'Sales History',
    purchases: 'Purchase History',
    reports: 'Reports & Analytics',
    alerts: 'Activity & Alerts',
    settings: 'Settings & Diagnostics',
  };

  // Loading Screen while auth state is resolving
  if (authLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          gap: 16,
        }}
      >
        <div
          className="skeleton"
          style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#312E81' }}
        />
        <div style={{ fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>
          Verifying Administrator Session...
        </div>
      </div>
    );
  }

  // Login Portal if not authenticated
  if (!admin) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setMobileMenuOpen(false);
          window.scrollTo(0, 0);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        unreadAlertsCount={alerts.length}
        pendingOrdersCount={kpis.pendingOrders}
        expiringSubsCount={alerts.filter((a) => a.type === 'subscription_expiring').length}
        adminEmail={admin.email}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Topbar
          breadcrumbs={[breadcrumbMap[currentTab] || 'Module']}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          shops={users}
          selectedShopId={selectedShopId}
          onSelectShopId={setSelectedShopId}
          alerts={alerts}
          onRefresh={() => loadData(true)}
          refreshing={refreshing}
          onNavigateToTab={(tab) => {
            setCurrentTab(tab);
            setMobileMenuOpen(false);
          }}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <div className="content-scroll">
          <div className="content-container">
            {/* Error Notification if Firebase read failed */}
            {fetchError && (
              <div
                style={{
                  padding: '14px 20px',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#991B1B',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertCircle size={18} />
                  <span>{fetchError}</span>
                </div>
                <button
                  onClick={() => loadData(true)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: 12 }}
                >
                  <RefreshCw size={12} /> Retry
                </button>
              </div>
            )}

            {/* Active CRM Module */}
            {currentTab === 'overview' && (
              <Overview
                kpis={kpis}
                users={scopedUsers}
                sales={scopedSales}
                purchases={scopedPurchases}
                orders={scopedOrders}
                products={scopedProducts}
                alerts={scopedAlerts}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                selectedShopName={selectedShopObj?.shopName}
              />
            )}

            {currentTab === 'users' && (
              <Users
                users={scopedUsers}
                loading={dataLoading}
                onSelectShop={(shopId) => setSelectedShopId(shopId)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'subscriptions' && (
              <Subscriptions
                users={scopedUsers}
                loading={dataLoading}
                onUpdatePlan={handleUpdateSubscriptionPlan}
              />
            )}

            {currentTab === 'shops' && (
              <Shops
                shops={scopedUsers}
                products={products}
                sales={sales}
                purchases={purchases}
                orders={orders}
                loading={dataLoading}
              />
            )}

            {currentTab === 'inventory' && (
              <ProductsInventory
                products={scopedProducts}
                loading={dataLoading}
              />
            )}

            {currentTab === 'orders' && (
              <Orders
                orders={scopedOrders}
                loading={dataLoading}
                onUpdateStatus={handleUpdateOrderStatus}
              />
            )}

            {currentTab === 'sales' && (
              <SalesHistory
                sales={scopedSales}
                loading={dataLoading}
              />
            )}

            {currentTab === 'purchases' && (
              <PurchaseHistory
                purchases={scopedPurchases}
                loading={dataLoading}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsAnalytics
                users={scopedUsers}
                products={scopedProducts}
                sales={scopedSales}
                purchases={scopedPurchases}
                orders={scopedOrders}
              />
            )}

            {currentTab === 'alerts' && (
              <ActivityAlerts
                alerts={scopedAlerts}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'settings' && (
              <Settings
                adminEmail={admin.email}
                onRefresh={() => loadData(true)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
