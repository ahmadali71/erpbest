import React, { useState, useMemo } from 'react';
import { useERP } from '../../context/ERPContext';
import { Product, PaymentMethod, Client, SaleInvoice } from '../../types/erp';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  CreditCard,
  Banknote,
  Building2,
  PauseCircle,
  PlayCircle,
  Barcode,
  RotateCcw,
  User,
  Percent,
  Sparkles,
  Printer,
  Package,
} from 'lucide-react';
import { ReceiptModal } from '../Modals/ReceiptModal';

interface CartItem {
  product: Product;
  quantity: number;
  unitSellingPrice: number;
  discountPercentage: number;
}

interface ParkedCart {
  id: string;
  customerName: string;
  items: CartItem[];
  savedAt: string;
}

export const POSTerminalView: React.FC = () => {
  const { products, clients, categories, createSale } = useERP();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [barcodeInput, setBarcodeInput] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [walkInName, setWalkInName] = useState('Walk-in Customer');
  const [globalDiscountPct, setGlobalDiscountPct] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [cashTendered, setCashTendered] = useState<string>('');

  // Parked Carts
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>([]);
  const [isParkedModalOpen, setIsParkedModalOpen] = useState(false);

  // Completed Receipt Modal
  const [completedInvoice, setCompletedInvoice] = useState<SaleInvoice | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Math Calculations
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const itemSub = item.unitSellingPrice * item.quantity;
      const itemDisc = (itemSub * item.discountPercentage) / 100;
      return acc + (itemSub - itemDisc);
    }, 0);
  }, [cartItems]);

  const globalDiscountAmount = useMemo(() => {
    return (cartSubtotal * globalDiscountPct) / 100;
  }, [cartSubtotal, globalDiscountPct]);

  const taxableAmount = cartSubtotal - globalDiscountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const grandTotal = Math.max(0, Math.round((taxableAmount + taxAmount) * 100) / 100);

  const tenderedNumber = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, Math.round((tenderedNumber - grandTotal) * 100) / 100);

  // Cart Actions
  const addToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert(`Warning: ${product.name} is out of stock!`);
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          alert(`Cannot add more. Current available stock is ${product.stockQuantity} ${product.unit}.`);
          return prev;
        }
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitSellingPrice: product.sellingPrice,
          discountPercentage: 0,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stockQuantity) {
              alert(`Maximum available stock is ${item.product.stockQuantity}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setGlobalDiscountPct(0);
    setCashTendered('');
  };

  // Barcode Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matched = products.find(
      p => p.sku.toLowerCase() === barcodeInput.trim().toLowerCase() || p.id === barcodeInput.trim()
    );

    if (matched) {
      addToCart(matched);
      setBarcodeInput('');
    } else {
      alert(`No product found with SKU/Barcode "${barcodeInput}"`);
    }
  };

  // Quick Cash Helper
  const setQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  // Park / Hold Cart
  const handleParkCart = () => {
    if (cartItems.length === 0) return;
    const client = clients.find(c => c.id === selectedClientId);
    const name = client ? client.name : walkInName;

    const newParked: ParkedCart = {
      id: `park-${Date.now()}`,
      customerName: name,
      items: [...cartItems],
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setParkedCarts(prev => [newParked, ...prev]);
    clearCart();
  };

  const handleResumeParked = (parked: ParkedCart) => {
    setCartItems(parked.items);
    setParkedCarts(prev => prev.filter(p => p.id !== parked.id));
    setIsParkedModalOpen(false);
  };

  // Checkout Execution
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === 'CASH' && tenderedNumber > 0 && tenderedNumber < grandTotal) {
      if (!confirm(`Tendered amount ($${tenderedNumber}) is less than total ($${grandTotal}). Record as partial payment?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // Find client or use primary default walk-in client
      const client = clients.find(c => c.id === selectedClientId) || clients[0];
      const initialPaid =
        paymentMethod === 'CASH'
          ? (tenderedNumber >= grandTotal ? grandTotal : (tenderedNumber > 0 ? tenderedNumber : grandTotal))
          : (paymentMethod === 'CREDIT' ? 0 : grandTotal);

      const invoice = await createSale({
        clientId: client ? client.id : 'client-1',
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitSellingPrice: item.unitSellingPrice,
          discountPercentage: item.discountPercentage || globalDiscountPct,
        })),
        taxRate,
        paymentMethod,
        initialAmountPaid: initialPaid,
        notes: `POS Fast Checkout - Customer: ${selectedClientId ? client?.name : walkInName}`,
      });

      if (invoice) {
        setCompletedInvoice(invoice);
        setIsReceiptOpen(true);
        clearCart();
      }
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 overflow-hidden select-none">
      {/* LEFT COLUMN: Catalog & Fast Touch Grid */}
      <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Search & Barcode Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-slate-50/70">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name, SKU, category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Barcode Scanner Simulator */}
          <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-1.5 flex-shrink-0">
            <div className="relative w-full sm:w-48">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Scan / SKU + Enter"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Add
            </button>
          </form>
        </div>

        {/* Category Pills */}
        <div className="px-3 sm:px-4 py-2.5 border-b border-slate-100 flex gap-2 overflow-x-auto bg-white scrollbar-none">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL'
                ? 'bg-indigo-600 text-white shadow-xs scale-[1.02]'
                : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category === cat.name).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat.name
                    ? 'bg-indigo-600 text-white shadow-xs scale-[1.02]'
                    : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3 bg-slate-50/50">
          {filteredProducts.map(prod => {
            const isOutOfStock = prod.stockQuantity <= 0;
            const inCart = cartItems.find(i => i.product.id === prod.id);

            return (
              <button
                key={prod.id}
                disabled={isOutOfStock}
                onClick={() => addToCart(prod)}
                className={`relative flex flex-col justify-between p-3.5 rounded-2xl border text-left transition-all duration-200 group ${
                  isOutOfStock
                    ? 'bg-slate-100/80 border-slate-200 opacity-60 cursor-not-allowed'
                    : inCart
                    ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs scale-[1.01]'
                    : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                {/* Top SKU & Badge */}
                <div className="flex items-start justify-between gap-1 w-full">
                  <span className="text-[10px] font-mono font-semibold text-slate-400 uppercase truncate">
                    {prod.sku}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      prod.stockQuantity <= prod.minStockThreshold
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {prod.stockQuantity} {prod.unit}
                  </span>
                </div>

                {/* Name */}
                <div className="my-2.5">
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {prod.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{prod.category}</p>
                </div>

                {/* Bottom Price & Add Indicator */}
                <div className="flex items-center justify-between w-full pt-2.5 border-t border-slate-100">
                  <span className="font-black text-slate-900 text-sm sm:text-base font-mono">
                    ${prod.sellingPrice.toFixed(2)}
                  </span>
                  {inCart ? (
                    <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                      {inCart.quantity}
                    </span>
                  ) : (
                    <span className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-all">
                      <Plus className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
              <Package className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm font-bold">No products matching current search</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Real-Time Cart & Checkout Panel */}
      <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex-shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Order Ticket</h3>
              <p className="text-[10px] text-slate-500 font-bold">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items in active register
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {parkedCarts.length > 0 && (
              <button
                onClick={() => setIsParkedModalOpen(true)}
                className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 flex items-center gap-1"
                title="View parked orders"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>Held ({parkedCarts.length})</span>
              </button>
            )}
            {cartItems.length > 0 && (
              <>
                <button
                  onClick={handleParkCart}
                  className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl text-xs transition-colors"
                  title="Hold / Park ticket"
                >
                  <PauseCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={clearCart}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs transition-colors"
                  title="Clear ticket"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Customer Selector Bar */}
        <div className="p-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Walk-in / Guest Customer</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''} - Bal: ${c.outstandingBalance}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2 divide-y divide-slate-100 max-h-[300px] lg:max-h-[360px]">
          {cartItems.map((item, idx) => (
            <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-slate-800 truncate">{item.product.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  ${item.unitSellingPrice.toFixed(2)} / {item.product.unit}
                </p>
              </div>

              {/* Quantity modifier buttons */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => updateQuantity(item.product.id, -1)}
                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded text-xs transition-colors"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-bold text-xs text-slate-800">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.product.id, 1)}
                  className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded text-xs transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Line item total & delete */}
              <div className="text-right flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">
                  ${(item.unitSellingPrice * item.quantity).toFixed(2)}
                </span>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-slate-300 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {cartItems.length === 0 && (
            <div className="py-14 flex flex-col items-center justify-center text-slate-400">
              <ShoppingCart className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">Cart is empty</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Tap products or scan barcode to add</p>
            </div>
          )}
        </div>

        {/* Calculation & Payment Tender Footer */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 space-y-3">
          {/* Subtotal & Discount Row */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-900">${cartSubtotal.toFixed(2)}</span>
            </div>

            {/* Discount selector */}
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 text-slate-500">
                <Percent className="w-3 h-3 text-indigo-600" />
                <span>Discount (%):</span>
              </span>
              <div className="flex gap-1">
                {[0, 5, 10, 15].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setGlobalDiscountPct(pct)}
                    className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                      globalDiscountPct === pct
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Grand Total Highlight */}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="font-bold text-sm text-slate-900 uppercase">Grand Total:</span>
              <span className="font-extrabold text-xl text-indigo-700">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'CASH' as PaymentMethod, label: 'Cash', icon: Banknote },
              { id: 'CARD' as PaymentMethod, label: 'Card', icon: CreditCard },
              { id: 'BANK_TRANSFER' as PaymentMethod, label: 'Transfer', icon: Building2 },
              { id: 'CREDIT' as PaymentMethod, label: 'On Credit', icon: RotateCcw },
            ].map(m => {
              const Icon = m.icon;
              const isSelected = paymentMethod === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-[10px]">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Cash Buttons & Change Due (If Cash Selected) */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-2 bg-white p-2.5 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-600">Tender Cash:</span>
                <input
                  type="number"
                  placeholder={`$${grandTotal}`}
                  value={cashTendered}
                  onChange={e => setCashTendered(e.target.value)}
                  className="w-24 px-2 py-1 text-right text-xs font-bold bg-slate-50 border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Quick Cash Presets */}
              <div className="flex gap-1">
                {[10, 20, 50, 100].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setQuickCash(amt)}
                    className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded transition-colors"
                  >
                    ${amt}
                  </button>
                ))}
                <button
                  onClick={() => setQuickCash(grandTotal)}
                  className="flex-1 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded transition-colors"
                >
                  Exact
                </button>
              </div>

              {/* Dynamic Change Due */}
              {tenderedNumber > grandTotal && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1.5 rounded">
                  <span>Change to Return:</span>
                  <span>${changeDue.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Complete Transaction Button */}
          <button
            disabled={cartItems.length === 0 || isSubmitting}
            onClick={handleCheckout}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Processing Ticket...</span>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                <span>Complete & Pay (${grandTotal.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Held / Parked Carts Modal */}
      {isParkedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Held / Parked Orders</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {parkedCarts.map(parked => (
                <div
                  key={parked.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-xs text-slate-900">{parked.customerName}</p>
                    <p className="text-[10px] text-slate-500">
                      {parked.items.length} items • Held at {parked.savedAt}
                    </p>
                  </div>
                  <button
                    onClick={() => handleResumeParked(parked)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs"
                  >
                    Resume
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsParkedModalOpen(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Generator Modal */}
      <ReceiptModal
        invoice={completedInvoice}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setCompletedInvoice(null);
        }}
      />
    </div>
  );
};
