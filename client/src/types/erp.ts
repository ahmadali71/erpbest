export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL';
export type PaymentMethod = 'CASH' | 'CARD' | 'CREDIT' | 'BANK_TRANSFER' | 'CHEQUE';
export type StockMovementType = 'SALE' | 'PURCHASE_RESTOCK' | 'ADJUSTMENT' | 'RETURN';

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  category: string;
  purchasePrice: number; // Cost price
  sellingPrice: number;  // Retail price
  stockQuantity: number;
  minStockThreshold: number;
  unit: string; // e.g., 'pcs', 'box', 'kg', 'unit'
  description?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByRole?: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone: string;
  address?: string;
  taxNumber?: string;
  creditLimit: number;
  totalSpent: number;
  outstandingBalance: number;
  createdAt: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByRole?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPurchasePrice: number;
  unitSellingPrice: number;
  discountPercentage: number;
  total: number;
  profit: number; // (unitSellingPrice * (1 - discount%) - unitPurchasePrice) * quantity
}

export interface PaymentTransaction {
  id: string;
  saleId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  note?: string;
  recordedBy: string;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  taxRate: number; // percentage, e.g. 5%
  grandTotal: number;
  totalCost: number;
  profit: number; // grandTotal - taxAmount - totalCost (or subtotal - discount - totalCost)
  amountPaid: number;
  amountDue: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  date: string; // ISO string
  payments: PaymentTransaction[];
  dueDate?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByRole?: string;
}

export interface Expense {
  id: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Marketing' | 'Logistics' | 'Maintenance' | 'Software' | 'Other';
  title: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  notes?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantity: number; // positive or negative
  previousStock: number;
  newStock: number;
  unitCost?: number;
  referenceId?: string; // invoice number or purchase order
  note?: string;
  date: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  company?: string;
  email: string;
  phone: string;
  address?: string;
  paymentTerms: 'NET_15' | 'NET_30' | 'NET_60' | 'DUE_ON_RECEIPT';
  taxNumber?: string;
  notes?: string;
  totalPurchased: number;
  createdAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  date: string;
  expectedDeliveryDate?: string;
  receivedDate?: string;
  notes?: string;
}

export interface QuotationItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  total: number;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  items: QuotationItem[];
  subtotal: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
  date: string;
  validUntil: string;
  notes?: string;
  convertedInvoiceId?: string;
}

export interface ReturnItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalRefund: number;
  total: number;
  reason: 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CHANGE_OF_MIND' | 'DAMAGED' | 'OTHER';
  restockItem: boolean;
}

export interface SaleReturn {
  id: string;
  returnNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  items: ReturnItem[];
  totalRefundAmount: number;
  restockingFee: number;
  netRefundAmount: number;
  itemsTotal: number;
  refundMethod: 'CASH' | 'CARD' | 'STORE_CREDIT' | 'BANK_TRANSFER';
  notes?: string;
  date: string;
}

export type ThemeAccent = 'indigo' | 'emerald' | 'violet' | 'rose' | 'cyan' | 'amber' | 'slate';

export interface CompanySettings {
  companyName: string;
  tagline: string;
  email: string;
  phone: string;
  address: string;
  taxRegistrationNumber: string;
  taxNumber?: string;
  website?: string;
  currencySymbol: string;
  currencyCode: string;
  defaultTaxRate: number;
  defaultPaymentTermsDays?: number;
  defaultLowStockThreshold?: number;
  stockAlertThreshold?: number;
  invoicePrefix: string;
  quotePrefix: string;
  receiptHeader: string;
  receiptFooter: string;
  receiptHeaderMessage?: string;
  receiptFooterMessage?: string;
  showBarcodeOnReceipt?: boolean;
  showTaxBreakdown?: boolean;
  autoPrintReceipt?: boolean;
  compactMode?: boolean;
  themeAccent: ThemeAccent;
  enableSoundEffects: boolean;
  enableAutoPrintReceipt: boolean;
  barcodeLabelConfig: {
    labelSize: '50x25' | '38x25' | '70x35' | 'STANDARD_50X30' | 'JEWELRY_30X15' | 'LARGE_70X40' | 'A4_SHEET_24';
    showPrice: boolean;
    showSku: boolean;
    showProductName: boolean;
    showCompanyName: boolean;
    barcodeType?: 'CODE128' | 'QR';
    customHeader?: string;
  };
}

export interface BarcodeLabelConfig {
  labelSize: 'STANDARD_50X30' | 'JEWELRY_30X15' | 'LARGE_70X40' | 'A4_SHEET_24';
  showPrice: boolean;
  showSkuText: boolean;
  showCompanyName: boolean;
  barcodeType: 'CODE128' | 'QR';
  customHeader?: string;
}

export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RealTimeActivity {
  id: string;
  type:
    | 'SALE_CREATED'
    | 'PAYMENT_RECORDED'
    | 'STOCK_RESTOCKED'
    | 'STOCK_ADJUSTED'
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'EXPENSE_ADDED'
    | 'PO_CREATED'
    | 'PO_RECEIVED'
    | 'QUOTATION_CREATED'
    | 'QUOTATION_CONVERTED'
    | 'RETURN_PROCESSED'
    | 'SETTINGS_UPDATED'
    | 'PRESENCE_UPDATED'
    | 'DB_RESET';
  title: string;
  description: string;
  timestamp: string;
  badgeColor?: string;
  iconType?: string;
}

