export type Role = "ADMIN" | "MANAGER" | "STAFF";

export type ProductType =
  | "LIVESTOCK"
  | "PLANT"
  | "EQUIPMENT"
  | "FOOD"
  | "CHEMICAL"
  | "DECOR"
  | "SUPPLY"
  | "OTHER";

export type WaterType = "FRESHWATER" | "SALTWATER" | "BRACKISH" | "NA";
export type CareLevel = "EASY" | "MODERATE" | "DIFFICULT" | "EXPERT";
export type HealthStatus = "HEALTHY" | "QUARANTINE" | "SICK" | "DECEASED" | "NA";
export type PaymentMethod = "CASH" | "CARD" | "STORE_CREDIT" | "OTHER";
export type SaleStatus = "COMPLETED" | "REFUNDED" | "PARTIALLY_REFUNDED" | "VOID";
export type PurchaseOrderStatus = "DRAFT" | "ORDERED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Category {
  id: string;
  name: string;
  type: ProductType;
  _count?: { products: number };
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  _count?: { products: number; purchaseOrders: number };
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  type: ProductType;
  categoryId?: string | null;
  category?: Category | null;
  supplierId?: string | null;
  supplier?: Supplier | null;
  costPrice: number;
  sellPrice: number;
  quantity: number;
  reorderLevel: number;
  unit: string;
  imageUrl?: string | null;
  isActive: boolean;
  species?: string | null;
  scientificName?: string | null;
  waterType?: WaterType | null;
  careLevel?: CareLevel | null;
  temperamentType?: string | null;
  minTankSizeGallons?: number | null;
  tempRangeLowF?: number | null;
  tempRangeHighF?: number | null;
  phLow?: number | null;
  phHigh?: number | null;
  healthStatus?: HealthStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  notes?: string | null;
  loyaltyPoints: number;
  createdAt: string;
  _count?: { sales: number };
  sales?: Sale[];
}

export interface SaleItem {
  id: string;
  productId: string;
  product?: Product;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  saleNumber: string;
  customerId?: string | null;
  customer?: Customer | null;
  userId: string;
  user?: { id: string; name: string };
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  notes?: string | null;
  createdAt: string;
  items: SaleItem[];
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  product?: Product;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: Supplier;
  userId: string;
  user?: { id: string; name: string };
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string | null;
  receivedDate?: string | null;
  notes?: string | null;
  total: number;
  items: PurchaseOrderItem[];
}

export interface DashboardSummary {
  todayRevenue: number;
  todayOrders: number;
  monthRevenue: number;
  monthOrders: number;
  totalProducts: number;
  totalCustomers: number;
  lowStockCount: number;
  lowStockItems: Array<{ id: string; name: string; quantity: number; reorderLevel: number; type: ProductType }>;
  inventoryValue: number;
  inventoryByType: Record<string, number>;
  recentSales: Sale[];
  salesTrend: Array<{ date: string; total: number }>;
}
