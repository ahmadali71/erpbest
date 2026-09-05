import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

import {
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
} from '../../client/src/data/initialData';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Client from './models/Client.js';
import Sale from './models/Sale.js';
import Expense from './models/Expense.js';
import StockMovement from './models/StockMovement.js';
import Supplier from './models/Supplier.js';
import PurchaseOrder from './models/PurchaseOrder.js';
import Quotation from './models/Quotation.js';
import Return from './models/Return.js';
import Settings from './models/Settings.js';

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📊 MongoDB connected for seeding');

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

    const createdCategories = await Category.insertMany(
      initialCategories.map(c => ({ ...c }))
    );
    const categoryMap = new Map();
    createdCategories.forEach(cat => categoryMap.set(cat.name, cat.id));

    const productsWithCategories = initialProducts.map((prod) => ({
      ...prod,
      category: categoryMap.get(prod.category) || prod.category,
    }));
    await Product.insertMany(productsWithCategories);
    console.log(`✅ Seeded ${initialProducts.length} products`);

    await Client.insertMany(initialClients.map(c => ({ ...c })));
    console.log(`✅ Seeded ${initialClients.length} clients`);

    const products = await Product.find();
    const productMap = new Map();
    products.forEach(prod => productMap.set(prod.sku, prod));

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
    console.log(`✅ Seeded ${initialSales.length} sales`);

    await Expense.insertMany(initialExpenses.map(e => ({ ...e })));
    console.log(`✅ Seeded ${initialExpenses.length} expenses`);

    await StockMovement.insertMany(initialStockMovements.map(m => ({ ...m })));
    console.log(`✅ Seeded ${initialStockMovements.length} stock movements`);

    await Supplier.insertMany(initialSuppliers.map(s => ({ ...s })));
    console.log(`✅ Seeded ${initialSuppliers.length} suppliers`);

    await PurchaseOrder.insertMany(initialPurchaseOrders.map(po => ({ ...po })));
    console.log(`✅ Seeded ${initialPurchaseOrders.length} purchase orders`);

    await Quotation.insertMany(initialQuotations.map(q => ({ ...q })));
    console.log(`✅ Seeded ${initialQuotations.length} quotations`);

    await Settings.create({ ...initialSettings, id: 'settings-main' });
    console.log('✅ Seeded settings');

    await Return.insertMany(initialReturns.map(r => ({ ...r })));
    console.log(`✅ Seeded ${initialReturns.length} returns`);

    console.log('🌱 Database seeded successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
