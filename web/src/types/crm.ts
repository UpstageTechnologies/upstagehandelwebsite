// Strongly-typed CRM domain contracts for the Upstage POS / Kadai ecosystem

export interface AddressStructure {
  fullAddress?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  district?: string;
  city?: string;
  area?: string;
  lat?: number | null;
  lon?: number | null;
}

export interface UserRecord {
  id: string; // Document ID (authUid or upstageuserXXXX)
  authUid?: string;
  customShopUid?: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  role: 'admin' | 'seller' | 'staff' | string;
  shopType: 'Store' | 'Super Market' | 'Factory' | 'Medical' | 'Other' | string;
  gstNumber?: string;
  deliveryScope?: 'Local' | 'Global' | string;
  address?: string | AddressStructure;
  subscriptionPlan: 'Free Trial' | 'Basic' | 'Premium' | 'Pro' | string;
  subscriptionActive: boolean;
  subscriptionExpiry: number | null; // epoch ms
  trialStart?: number | null;
  razorpayPaymentId?: string;
  inventoryLimit?: number;
  reportLimitMonths?: number;
  fcmToken?: string;
  createdAt?: any;
  lastLogin?: any;
  profileImage?: string;
  shopLogo?: string;
  closedDays?: Record<string, { total?: number; closedAt?: any }>;
  closedPurchaseDays?: Record<string, { total?: number; closedAt?: any }>;

  // Aggregated shop stats
  productCount?: number;
  salesCount?: number;
  salesTotal?: number;
  ordersCount?: number;
  purchaseCount?: number;
  purchaseTotal?: number;
}

export interface ProductItem {
  id: string;
  shopId: string;
  shopName?: string;
  ownerName?: string;
  name: string;
  barcode: string;
  salesPrice: number;
  purchasePrice: number;
  quantity: number;
  lowStockThreshold: number;
  category: string;
  subcategory?: string;
  unitType: string;
  brand?: string;
  image?: string;
  expiryDate?: string | number | null;
  isGlobal: boolean;
  createdAt?: any;
}

export interface SaleLineItem {
  name?: string;
  itemName?: string;
  price?: number;
  salesPrice?: number;
  purchasePrice?: number;
  qty: number;
  unitType?: string;
  size?: string;
  taxPercent?: number;
}

export interface SaleTransaction {
  id: string;
  shopId: string;
  shopName?: string;
  ownerName?: string;
  billNo: string;
  invoiceId: string;
  billDate: string;
  items: SaleLineItem[];
  total: number;
  profit: number;
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'ONLINE' | string;
  razorpayPaymentId?: string;
  isGlobalMode: boolean;
  customerName?: string;
  customerPhone?: string;
  createdAt: any;
}

export interface PurchaseLineItem {
  name?: string;
  itemName?: string;
  purchasePrice: number;
  salesPrice?: number;
  qty: number;
  unitType?: string;
  size?: string;
}

export interface PurchaseInvoice {
  id: string;
  shopId: string;
  shopName?: string;
  ownerName?: string;
  billNo: string;
  invoiceId: string;
  supplierName: string;
  items: PurchaseLineItem[];
  total: number;
  isGlobal: boolean;
  createdAt: any;
}

export interface OrderLineItem {
  name?: string;
  itemName?: string;
  price?: number;
  salesPrice?: number;
  qty: number;
  barcode?: string;
  cost?: number;
  total?: number;
}

export interface OrderRecord {
  id: string;
  shopId: string;
  shopName?: string;
  orderId: string;
  orderType: 'Takeaway' | 'Delivery' | 'Dine-in' | 'Local' | 'Global' | string;
  customerUid?: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string | AddressStructure;
  items: OrderLineItem[];
  total: number;
  status:
    | 'Pending Verification'
    | 'Pending'
    | 'Preparing'
    | 'Ready'
    | 'Completed'
    | 'Delivered'
    | 'Rejected'
    | 'Cancelled'
    | string;
  paymentMode?: string;
  paymentStatus?: string;
  isGlobalMode: boolean;
  createdAt: any;
}

export interface OperationalAlert {
  id: string;
  type:
    | 'subscription_expiring'
    | 'subscription_expired'
    | 'low_stock'
    | 'pending_order'
    | 'new_user';
  severity: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  description: string;
  timestamp: Date;
  shopId?: string;
  shopName?: string;
  targetTab?: string;
  linkId?: string;
}

export interface DashboardKPIs {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalShops: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  trialSubscriptions: number;
  verifiedSubscriptionRevenue: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalSalesAmount: number;
  totalProfit: number;
  totalPurchasesAmount: number;
  lowStockCount: number;
}
