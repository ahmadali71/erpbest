import express from 'express';
import mongoose from 'mongoose';
import Product from '../db/models/Product.js';
import Category from '../db/models/Category.js';
import Client from '../db/models/Client.js';
import Sale from '../db/models/Sale.js';
import Expense from '../db/models/Expense.js';
import StockMovement from '../db/models/StockMovement.js';
import Supplier from '../db/models/Supplier.js';
import PurchaseOrder from '../db/models/PurchaseOrder.js';
import Quotation from '../db/models/Quotation.js';
import Return from '../db/models/Return.js';
import Settings from '../db/models/Settings.js';

const router = express.Router();

// Bootstrap - get all data
router.get('/bootstrap', async (_req, res) => {
  try {
    const [
      products,
      categories,
      clients,
      sales,
      expenses,
      stockMovements,
      suppliers,
      purchaseOrders,
      quotations,
      returns,
      settings,
    ] = await Promise.all([
      Product.find().lean(),
      Category.find().lean(),
      Client.find().lean(),
      Sale.find().lean().sort({ date: -1 }),
      Expense.find().lean().sort({ date: -1 }),
      StockMovement.find().lean().sort({ date: -1 }),
      Supplier.find().lean().sort({ createdAt: -1 }),
      PurchaseOrder.find().lean().sort({ date: -1 }),
      Quotation.find().lean().sort({ date: -1 }),
      Return.find().lean().sort({ date: -1 }),
      Settings.findOne({}),
    ]);

    res.json({
      success: true,
      data: {
        products,
        categories,
        clients,
        sales,
        expenses,
        stockMovements,
        suppliers,
        purchaseOrders,
        quotations,
        returns,
        settings,
        metrics: {},
        lastUpdated: new Date().toISOString(),
        activeTerminals: 1,
      },
    });
  } catch (err) {
    console.error('Bootstrap error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Categories CRUD
router.get('/categories', async (_req, res) => {
  try {
    const categories = await Category.find().lean();
    res.json({ success: true, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const category = new Category({ id: `cat-${Date.now()}`, name, description, color });
    await category.save();
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/categories/:id', async (req, res) => {
  try {
    await Category.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Reset database
router.post('/reset', async (_req, res) => {
  try {
    await Product.deleteMany({});
    await Category.deleteMany({});
    await Client.deleteMany({});
    await Sale.deleteMany({});
    await Expense.deleteMany({});
    await StockMovement.deleteMany({});
    await Supplier.deleteMany({});
    await PurchaseOrder.deleteMany({});
    await Quotation.deleteMany({});
    await Return.deleteMany({});
    await Settings.deleteMany({});

    const {
      initialProducts,
      initialCategories,
      initialClients,
      initialSales,
      initialExpenses,
      initialStockMovements,
      initialSuppliers,
      initialPurchaseOrders,
      initialQuotations,
      initialSettings,
      initialReturns,
    } = await import('../../client/src/data/initialData');

    const createdCategories = await Category.insertMany(
      initialCategories.map((c) => ({ ...c }))
    );
    const categoryMap = new Map();
    createdCategories.forEach((cat) => categoryMap.set(cat.name, cat.id));

    const productsWithCategories = initialProducts.map((prod) => ({
      ...prod,
      category: categoryMap.get(prod.category) || prod.category,
    }));
    await Product.insertMany(productsWithCategories);

    await Client.insertMany(initialClients.map((c) => ({ ...c })));

    const products = await Product.find();
    const productMap = new Map();
    products.forEach((prod) => productMap.set(prod.sku, prod));

    const salesData = initialSales.map((sale) => ({
      ...sale,
      items: sale.items.map((item) => ({
        productId: productMap.get(item.sku)?.id || item.productId,
        quantity: item.quantity,
        unitSellingPrice: item.unitSellingPrice,
        discountPercentage: item.discountPercentage,
      })),
    }));
    await Sale.insertMany(salesData);

    await Expense.insertMany(initialExpenses.map((e) => ({ ...e })));
    await StockMovement.insertMany(initialStockMovements.map((m) => ({ ...m })));
    await Supplier.insertMany(initialSuppliers.map((s) => ({ ...s })));
    await PurchaseOrder.insertMany(initialPurchaseOrders.map((po) => ({ ...po })));
    await Quotation.insertMany(initialQuotations.map((q) => ({ ...q })));
    await Settings.create({ ...initialSettings, id: 'settings-main' });
    await Return.insertMany(initialReturns.map((r) => ({ ...r })));

    res.json({
      success: true,
      message: 'Database reset to demo data',
      data: {
        products: await Product.find().lean(),
        categories: await Category.find().lean(),
        clients: await Client.find().lean(),
        sales: await Sale.find().lean().sort({ date: -1 }),
        expenses: await Expense.find().lean().sort({ date: -1 }),
        stockMovements: await StockMovement.find().lean().sort({ date: -1 }),
        suppliers: await Supplier.find().lean().sort({ createdAt: -1 }),
        purchaseOrders: await PurchaseOrder.find().lean().sort({ date: -1 }),
        quotations: await Quotation.find().lean().sort({ date: -1 }),
        returns: await Return.find().lean().sort({ date: -1 }),
        settings: await Settings.findOne({}),
        metrics: {},
        lastUpdated: new Date().toISOString(),
        activeTerminals: 1,
      },
    });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Restore database
router.post('/restore', async (req, res) => {
  try {
    const backupData = req.body;
    if (!backupData) {
      return res.status(400).json({ success: false, error: 'No backup data provided' });
    }

    await Product.deleteMany({});
    await Category.deleteMany({});
    await Client.deleteMany({});
    await Sale.deleteMany({});
    await Expense.deleteMany({});
    await StockMovement.deleteMany({});
    await Supplier.deleteMany({});
    await PurchaseOrder.deleteMany({});
    await Quotation.deleteMany({});
    await Return.deleteMany({});
    await Settings.deleteMany({});

    if (backupData.categories?.length) await Category.insertMany(backupData.categories);
    if (backupData.products?.length) await Product.insertMany(backupData.products);
    if (backupData.clients?.length) await Client.insertMany(backupData.clients);
    if (backupData.sales?.length) await Sale.insertMany(backupData.sales);
    if (backupData.expenses?.length) await Expense.insertMany(backupData.expenses);
    if (backupData.stockMovements?.length) await StockMovement.insertMany(backupData.stockMovements);
    if (backupData.suppliers?.length) await Supplier.insertMany(backupData.suppliers);
    if (backupData.purchaseOrders?.length) await PurchaseOrder.insertMany(backupData.purchaseOrders);
    if (backupData.quotations?.length) await Quotation.insertMany(backupData.quotations);
    if (backupData.returns?.length) await Return.insertMany(backupData.returns);
    if (backupData.settings) await Settings.create(backupData.settings);

    res.json({
      success: true,
      message: 'Database restored',
      data: {
        products: await Product.find().lean(),
        categories: await Category.find().lean(),
        clients: await Client.find().lean(),
        sales: await Sale.find().lean().sort({ date: -1 }),
        expenses: await Expense.find().lean().sort({ date: -1 }),
        stockMovements: await StockMovement.find().lean().sort({ date: -1 }),
        suppliers: await Supplier.find().lean().sort({ createdAt: -1 }),
        purchaseOrders: await PurchaseOrder.find().lean().sort({ date: -1 }),
        quotations: await Quotation.find().lean().sort({ date: -1 }),
        returns: await Return.find().lean().sort({ date: -1 }),
        settings: await Settings.findOne({}),
        metrics: {},
        lastUpdated: new Date().toISOString(),
        activeTerminals: 1,
      },
    });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Metrics
router.get('/metrics', async (_req, res) => {
  try {
    const [
      totalRevenue,
      totalExpenses,
      lowStock,
    ] = await Promise.all([
      Sale.aggregate([{ $group: { _id: null, total: { $sum: '$grandTotal' } } }]),
      Expense.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
      Product.find({ stockQuantity: { $lt: 5 } }).lean(),
    ]);

    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalExpenses: totalExpenses[0]?.total || 0,
        lowStockCount: lowStock.length,
        lowStockProducts: lowStock,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

export default router;
