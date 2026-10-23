import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  limit,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  UserRecord,
  ProductItem,
  SaleTransaction,
  PurchaseInvoice,
  OrderRecord,
  OperationalAlert,
  DashboardKPIs,
} from '../types/crm';

// Plan pricing dictionary from verified UpstageKadai pricing rules
export const PLAN_PRICING: Record<string, number> = {
  'Basic': 0,
  'Premium (Monthly)': 499,
  'Premium (Yearly)': 4999,
  'Premium': 499,
  'Pro (Monthly)': 1999,
  'Pro (Yearly)': 19999,
  'Pro': 1999,
  'Free Trial': 0,
};

// Safe date parser supporting Firestore Timestamps, ISO strings, and epoch numbers
export const parseAnyDate = (dateVal: any): Date => {
  if (!dateVal) return new Date(0);
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal?.toDate === 'function') return dateVal.toDate();
  if (typeof dateVal === 'number') return new Date(dateVal);
  if (typeof dateVal === 'string') {
    const parsed = new Date(dateVal);
    if (!isNaN(parsed.getTime())) return parsed;
    // Check DD/MM/YYYY
    const parts = dateVal.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
  }
  return new Date(0);
};

// Transform Firestore user document into typed UserRecord
const mapUserDoc = (id: string, data: DocumentData): UserRecord => {
  // Support both localized/globalized fields and standard top-level fields
  const shopName =
    data.shopName ||
    data.local_shopName ||
    data.global_shopName ||
    data.storeName ||
    'Unnamed Shop';
  const ownerName =
    data.ownerName ||
    data.local_ownerName ||
    data.global_ownerName ||
    data.name ||
    'Unassigned Owner';
  const email = data.email || data.local_email || data.global_email || '';
  const phone = data.phone || data.local_phone || data.global_phone || '';
  const role = data.role || (email.toLowerCase().includes('admin') ? 'admin' : 'seller');
  const shopType = data.shopType || 'Store';
  const gstNumber = data.gstNumber || data.local_gstNumber || '';
  const deliveryScope = data.deliveryScope || 'Local';
  const customShopUid = data.customShopUid || data.authUid || id;

  const subscriptionPlan = data.subscriptionPlan || data.userPlan || 'Free Trial';
  const expiry = data.subscriptionExpiry ? Number(data.subscriptionExpiry) : null;
  const isExpired = expiry ? Date.now() > expiry : false;
  const subscriptionActive = data.subscriptionActive !== false && !isExpired;

  return {
    id,
    authUid: data.authUid || id,
    customShopUid,
    shopName,
    ownerName,
    email,
    phone,
    role,
    shopType,
    gstNumber,
    deliveryScope,
    address: data.address || '',
    subscriptionPlan,
    subscriptionActive,
    subscriptionExpiry: expiry,
    trialStart: data.trialStart || null,
    razorpayPaymentId: data.razorpayPaymentId || '',
    inventoryLimit: data.inventoryLimit ?? (subscriptionPlan === 'Pro' ? -1 : 10),
    reportLimitMonths: data.reportLimitMonths ?? (subscriptionPlan === 'Pro' ? -1 : 1),
    fcmToken: data.fcmToken || '',
    createdAt: data.createdAt,
    lastLogin: data.lastLogin || null,
    profileImage: data.profileImage || null,
    shopLogo: data.shopLogo || null,
    closedDays: data.closedDays || {},
    closedPurchaseDays: data.closedPurchaseDays || {},
  };
};

/**
 * Fetch all registered users from the root `users` collection.
 */
export async function fetchUsers(): Promise<UserRecord[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => mapUserDoc(d.id, d.data()));
  } catch (error) {
    console.error('Error in fetchUsers:', error);
    throw error;
  }
}

/**
 * Fetch a single user profile by UID.
 */
export async function fetchUserById(uid: string): Promise<UserRecord | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return mapUserDoc(snap.id, snap.data());
  } catch (error) {
    console.error(`Error in fetchUserById (${uid}):`, error);
    throw error;
  }
}

/**
 * Fetch products for given user or across a set of users.
 */
export async function fetchProductsForUser(user: UserRecord): Promise<ProductItem[]> {
  const products: ProductItem[] = [];

  // Local inventory
  try {
    const localSnap = await getDocs(collection(db, 'users', user.id, 'inventory'));
    localSnap.docs.forEach((d) => {
      const data = d.data();
      products.push({
        id: d.id,
        shopId: user.id,
        shopName: user.shopName,
        ownerName: user.ownerName,
        name: data.itemName || data.name || 'Unnamed Product',
        barcode: data.barcode || '',
        salesPrice: Number(data.salesPrice || data.price || 0),
        purchasePrice: Number(data.purchasePrice || data.cost || 0),
        quantity: Number(data.quantity || data.qty || 0),
        lowStockThreshold: Number(data.lowStock || data.lowStockThreshold || 5),
        category: data.category || 'General',
        subcategory: data.subcategory || data.subcategoryName || '',
        unitType: data.unitType || data.unit || 'Qty',
        brand: data.brand || '',
        image: data.image || '',
        expiryDate: data.expiryDate || null,
        isGlobal: false,
        createdAt: data.createdAt,
      });
    });
  } catch (e) {
    console.warn(`Local inventory read failed for ${user.id}:`, e);
  }

  // Global inventory
  try {
    const globalSnap = await getDocs(collection(db, 'users', user.id, 'global_inventory'));
    globalSnap.docs.forEach((d) => {
      const data = d.data();
      products.push({
        id: `${d.id}-global`,
        shopId: user.id,
        shopName: user.shopName,
        ownerName: user.ownerName,
        name: data.itemName || data.name || 'Unnamed Product (Global)',
        barcode: data.barcode || '',
        salesPrice: Number(data.salesPrice || data.price || 0),
        purchasePrice: Number(data.purchasePrice || data.cost || 0),
        quantity: Number(data.quantity || data.qty || 0),
        lowStockThreshold: Number(data.lowStock || data.lowStockThreshold || 5),
        category: data.category || 'General',
        subcategory: data.subcategory || '',
        unitType: data.unitType || data.unit || 'Qty',
        brand: data.brand || '',
        image: data.image || '',
        expiryDate: data.expiryDate || null,
        isGlobal: true,
        createdAt: data.createdAt,
      });
    });
  } catch (e) {
    console.warn(`Global inventory read failed for ${user.id}:`, e);
  }

  return products;
}

/**
 * Fetch all sales transactions for given user.
 */
export async function fetchSalesForUser(user: UserRecord): Promise<SaleTransaction[]> {
  try {
    const snap = await getDocs(collection(db, 'users', user.id, 'sales'));
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        shopId: user.id,
        shopName: user.shopName,
        ownerName: user.ownerName,
        billNo: data.billNo || data.invoiceId || d.id,
        invoiceId: data.invoiceId || data.billNo || d.id,
        billDate: data.billDate || '',
        items: Array.isArray(data.items) ? data.items : [],
        total: Number(data.total || 0),
        profit: Number(data.profit || 0),
        paymentMode: data.paymentMode || 'CASH',
        razorpayPaymentId: data.razorpayPaymentId || '',
        isGlobalMode: Boolean(data.isGlobalMode),
        customerName: data.customerName || '',
        customerPhone: data.customerPhone || '',
        createdAt: data.createdAt,
      };
    });
  } catch (e) {
    console.warn(`Sales read failed for ${user.id}:`, e);
    return [];
  }
}

/**
 * Fetch purchase invoices for given user.
 */
export async function fetchPurchasesForUser(user: UserRecord): Promise<PurchaseInvoice[]> {
  const purchases: PurchaseInvoice[] = [];

  // Local invoices
  try {
    const snap = await getDocs(collection(db, 'users', user.id, 'invoices'));
    snap.docs.forEach((d) => {
      const data = d.data();
      purchases.push({
        id: d.id,
        shopId: user.id,
        shopName: user.shopName,
        ownerName: user.ownerName,
        billNo: data.billNo || data.invoiceId || d.id,
        invoiceId: data.invoiceId || data.billNo || d.id,
        supplierName: data.supplierName || 'Walk-in Supplier',
        items: Array.isArray(data.items) ? data.items : [],
        total: Number(data.total || 0),
        isGlobal: false,
        createdAt: data.createdAt,
      });
    });
  } catch (e) {
    console.warn(`Purchases read failed for ${user.id}:`, e);
  }

  // Global invoices
  try {
    const snap = await getDocs(collection(db, 'users', user.id, 'global_invoices'));
    snap.docs.forEach((d) => {
      const data = d.data();
      purchases.push({
        id: `${d.id}-global`,
        shopId: user.id,
        shopName: user.shopName,
        ownerName: user.ownerName,
        billNo: data.billNo || data.invoiceId || d.id,
        invoiceId: data.invoiceId || data.billNo || d.id,
        supplierName: data.supplierName || 'Global Supplier',
        items: Array.isArray(data.items) ? data.items : [],
        total: Number(data.total || 0),
        isGlobal: true,
        createdAt: data.createdAt,
      });
    });
  } catch (e) {
    console.warn(`Global purchases read failed for ${user.id}:`, e);
  }

  return purchases;
}

/**
 * Fetch orders for given user.
 */
export async function fetchOrdersForUser(user: UserRecord): Promise<OrderRecord[]> {
  const orders: OrderRecord[] = [];

  const readOrdersFromSub = async (subName: string, isGlobal: boolean) => {
    try {
      const snap = await getDocs(collection(db, 'users', user.id, subName));
      snap.docs.forEach((d) => {
        const data = d.data();
        orders.push({
          id: d.id,
          shopId: user.id,
          shopName: user.shopName,
          orderId: data.orderId || data.id || d.id,
          orderType: data.orderType || data.type || (isGlobal ? 'Global Delivery' : 'Local POS'),
          customerUid: data.customerUid || '',
          customerName: data.customerName || 'Customer',
          customerPhone: data.customerPhone || '',
          deliveryAddress: data.deliveryAddress || data.address || '',
          items: Array.isArray(data.items) ? data.items : [],
          total: Number(data.totalAmount || data.total || 0),
          status: data.status || 'Pending Verification',
          paymentMode: data.paymentMode || '',
          paymentStatus: data.paymentStatus || '',
          isGlobalMode: isGlobal || Boolean(data.isGlobalMode),
          createdAt: data.createdAt,
        });
      });
    } catch (e) {
      console.warn(`Orders subcollection ${subName} read failed for ${user.id}:`, e);
    }
  };

  await Promise.all([
    readOrdersFromSub('local_orders', false),
    readOrdersFromSub('global_orders', true),
    readOrdersFromSub('orders', false),
  ]);

  // Remove duplicate order IDs if saved across collections
  const uniqueMap = new Map<string, OrderRecord>();
  orders.forEach((o) => {
    if (!uniqueMap.has(o.orderId)) {
      uniqueMap.set(o.orderId, o);
    }
  });

  return Array.from(uniqueMap.values());
}

/**
 * Full ecosystem aggregated data loader.
 * Loads all shops, inventory, sales, purchases, and orders in one cohesive fetch.
 */
export async function loadFullEcosystemData(userList?: UserRecord[]) {
  const users = userList || (await fetchUsers());

  const productsAll: ProductItem[] = [];
  const salesAll: SaleTransaction[] = [];
  const purchasesAll: PurchaseInvoice[] = [];
  const ordersAll: OrderRecord[] = [];

  // Query subcollections across all users in parallel batches
  await Promise.all(
    users.map(async (u) => {
      const [userProducts, userSales, userPurchases, userOrders] = await Promise.all([
        fetchProductsForUser(u),
        fetchSalesForUser(u),
        fetchPurchasesForUser(u),
        fetchOrdersForUser(u),
      ]);

      // Enrich user record with aggregated stats
      u.productCount = userProducts.length;
      u.salesCount = userSales.length;
      u.salesTotal = userSales.reduce((sum, s) => sum + s.total, 0);
      u.ordersCount = userOrders.length;
      u.purchaseCount = userPurchases.length;
      u.purchaseTotal = userPurchases.reduce((sum, p) => sum + p.total, 0);

      productsAll.push(...userProducts);
      salesAll.push(...userSales);
      purchasesAll.push(...userPurchases);
      ordersAll.push(...userOrders);
    })
  );

  // Sort chronologically (latest first)
  salesAll.sort((a, b) => parseAnyDate(b.createdAt).getTime() - parseAnyDate(a.createdAt).getTime());
  purchasesAll.sort((a, b) => parseAnyDate(b.createdAt).getTime() - parseAnyDate(a.createdAt).getTime());
  ordersAll.sort((a, b) => parseAnyDate(b.createdAt).getTime() - parseAnyDate(a.createdAt).getTime());

  // Derive genuine operational alerts
  const alerts: OperationalAlert[] = [];

  // Low stock alerts
  productsAll.forEach((p) => {
    if (p.quantity <= p.lowStockThreshold) {
      alerts.push({
        id: `lowstock-${p.shopId}-${p.id}`,
        type: 'low_stock',
        severity: p.quantity === 0 ? 'danger' : 'warning',
        title: `Low Stock: ${p.name}`,
        description: `${p.shopName} has only ${p.quantity} unit(s) remaining (threshold: ${p.lowStockThreshold}).`,
        timestamp: parseAnyDate(p.createdAt),
        shopId: p.shopId,
        shopName: p.shopName,
        targetTab: 'inventory',
        linkId: p.id,
      });
    }
  });

  // Subscription alerts (expiring within 7 days or expired)
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  users.forEach((u) => {
    if (u.subscriptionExpiry) {
      const diff = u.subscriptionExpiry - now;
      if (diff <= 0) {
        alerts.push({
          id: `sub-expired-${u.id}`,
          type: 'subscription_expired',
          severity: 'danger',
          title: `Subscription Expired: ${u.shopName}`,
          description: `Plan "${u.subscriptionPlan}" expired on ${new Date(u.subscriptionExpiry).toLocaleDateString()}.`,
          timestamp: new Date(u.subscriptionExpiry),
          shopId: u.id,
          shopName: u.shopName,
          targetTab: 'subscriptions',
        });
      } else if (diff < sevenDaysMs) {
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `sub-expiring-${u.id}`,
          type: 'subscription_expiring',
          severity: 'warning',
          title: `Subscription Expiring Soon: ${u.shopName}`,
          description: `Plan "${u.subscriptionPlan}" expires in ${daysLeft} day(s).`,
          timestamp: new Date(u.subscriptionExpiry),
          shopId: u.id,
          shopName: u.shopName,
          targetTab: 'subscriptions',
        });
      }
    }
  });

  // Pending order alerts
  ordersAll.forEach((o) => {
    if (
      o.status.toLowerCase().includes('pending') ||
      o.status.toLowerCase().includes('verification')
    ) {
      alerts.push({
        id: `pending-order-${o.id}`,
        type: 'pending_order',
        severity: 'info',
        title: `Pending Order: #${o.orderId}`,
        description: `Order from ${o.customerName} (₹${o.total.toLocaleString()}) at ${o.shopName} requires attention.`,
        timestamp: parseAnyDate(o.createdAt),
        shopId: o.shopId,
        shopName: o.shopName,
        targetTab: 'orders',
        linkId: o.id,
      });
    }
  });

  // Calculate Verified KPIs
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.subscriptionActive).length;
  const inactiveUsers = totalUsers - activeUsers;
  const totalShops = users.filter((u) => u.shopName && u.shopName !== 'Unnamed Shop').length;

  const activeSubscriptions = users.filter((u) => u.subscriptionActive).length;
  const expiredSubscriptions = users.filter((u) => !u.subscriptionActive && u.subscriptionExpiry && u.subscriptionExpiry < now).length;
  const trialSubscriptions = users.filter((u) => (u.subscriptionPlan || '').toLowerCase().includes('trial')).length;

  // Verified Subscription Revenue:
  // Calculated strictly when reliable payment data exists (e.g., razorpayPaymentId or confirmed active paid plans)
  const verifiedSubscriptionRevenue = users.reduce((sum, u) => {
    if (u.razorpayPaymentId) {
      const planPrice = PLAN_PRICING[u.subscriptionPlan] || 0;
      return sum + planPrice;
    }
    return sum;
  }, 0);

  const totalOrders = ordersAll.length;
  const pendingOrders = ordersAll.filter(
    (o) =>
      o.status.toLowerCase().includes('pending') ||
      o.status.toLowerCase().includes('verification') ||
      o.status.toLowerCase().includes('preparing')
  ).length;
  const completedOrders = ordersAll.filter(
    (o) =>
      o.status.toLowerCase().includes('completed') ||
      o.status.toLowerCase().includes('delivered')
  ).length;

  const totalSalesAmount = salesAll.reduce((sum, s) => sum + s.total, 0);
  const totalProfit = salesAll.reduce((sum, s) => sum + s.profit, 0);
  const totalPurchasesAmount = purchasesAll.reduce((sum, p) => sum + p.total, 0);
  const lowStockCount = productsAll.filter((p) => p.quantity <= p.lowStockThreshold).length;

  const kpis: DashboardKPIs = {
    totalUsers,
    activeUsers,
    inactiveUsers,
    totalShops,
    activeSubscriptions,
    expiredSubscriptions,
    trialSubscriptions,
    verifiedSubscriptionRevenue,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalSalesAmount,
    totalProfit,
    totalPurchasesAmount,
    lowStockCount,
  };

  return {
    users,
    products: productsAll,
    sales: salesAll,
    purchases: purchasesAll,
    orders: ordersAll,
    alerts,
    kpis,
  };
}

/**
 * Update order status in Firestore safely.
 */
export async function updateOrderStatusInDb(
  shopId: string,
  orderId: string,
  newStatus: string,
  isGlobalMode: boolean
): Promise<void> {
  const subCol = isGlobalMode ? 'global_orders' : 'local_orders';
  const targetDoc = doc(db, 'users', shopId, subCol, orderId);
  await updateDoc(targetDoc, {
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Administrator action: extend or modify user subscription.
 */
export async function updateSubscriptionPlanInDb(
  uid: string,
  newPlan: string,
  durationDays: number
): Promise<void> {
  const newExpiry = Date.now() + durationDays * 24 * 60 * 60 * 1000;
  const invLimit = newPlan === 'Pro' ? -1 : 10;
  const repLimit = newPlan === 'Pro' ? -1 : 1;

  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    userPlan: newPlan,
    subscriptionPlan: newPlan,
    subscriptionActive: true,
    subscriptionExpiry: newExpiry,
    inventoryLimit: invLimit,
    reportLimitMonths: repLimit,
    updatedAt: serverTimestamp(),
  });
}
