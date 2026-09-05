"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const initialData_1 = require("../client/src/data/initialData");
const Product_js_1 = __importDefault(require("./db/models/Product.js"));
const Category_js_1 = __importDefault(require("./db/models/Category.js"));
const Client_js_1 = __importDefault(require("./db/models/Client.js"));
const Sale_js_1 = __importDefault(require("./db/models/Sale.js"));
const Expense_js_1 = __importDefault(require("./db/models/Expense.js"));
const StockMovement_js_1 = __importDefault(require("./db/models/StockMovement.js"));
const Supplier_js_1 = __importDefault(require("./db/models/Supplier.js"));
const PurchaseOrder_js_1 = __importDefault(require("./db/models/PurchaseOrder.js"));
const Quotation_js_1 = __importDefault(require("./db/models/Quotation.js"));
const Return_js_1 = __importDefault(require("./db/models/Return.js"));
const Settings_js_1 = __importDefault(require("./db/models/Settings.js"));
dotenv_1.default.config();
const seedDatabase = async () => {
    try {
        // Connect to DB
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log('📊 MongoDB connected for seeding');
        // Clear existing data
        await Product_js_1.default.deleteMany({});
        await Category_js_1.default.deleteMany({});
        await Client_js_1.default.deleteMany({});
        await Sale_js_1.default.deleteMany({});
        await Expense_js_1.default.deleteMany({});
        await StockMovement_js_1.default.deleteMany({});
        await Supplier_js_1.default.deleteMany({});
        await PurchaseOrder_js_1.default.deleteMany({});
        await Quotation_js_1.default.deleteMany({});
        await Return_js_1.default.deleteMany({});
        await Settings_js_1.default.deleteMany({});
        // Seed Categories
        const createdCategories = await Category_js_1.default.insertMany(initialData_1.initialCategories);
        const categoryMap = new Map();
        createdCategories.forEach(cat => categoryMap.set(cat.name, cat._id));
        // Seed Products (map category IDs)
        const productsWithCategories = initialData_1.initialProducts.map((prod) => ({
            ...prod,
            category: categoryMap.get(prod.category) || new mongoose_1.default.Types.ObjectId()
        }));
        await Product_js_1.default.insertMany(productsWithCategories);
        console.log(`✅ Seeded ${initialData_1.initialProducts.length} products`);
        // Seed Clients
        await Client_js_1.default.insertMany(initialData_1.initialClients);
        console.log(`✅ Seeded ${initialData_1.initialClients.length} clients`);
        // Seed Sales (with product references)
        const products = await Product_js_1.default.find();
        const productMap = new Map();
        products.forEach(prod => productMap.set(prod.sku, prod));
        const salesData = initialData_1.initialSales.map((sale) => ({
            ...sale,
            items: sale.items.map((item) => ({
                productId: productMap.get(item.sku)?.id || item.productId,
                quantity: item.quantity,
                unitSellingPrice: item.unitSellingPrice,
                discountPercentage: item.discountPercentage
            }))
        }));
        await Sale_js_1.default.insertMany(salesData);
        console.log(`✅ Seeded ${initialData_1.initialSales.length} sales`);
        // Seed Expenses
        await Expense_js_1.default.insertMany(initialData_1.initialExpenses);
        console.log(`✅ Seeded ${initialData_1.initialExpenses.length} expenses`);
        // Seed Stock Movements
        await StockMovement_js_1.default.insertMany(initialData_1.initialStockMovements);
        console.log(`✅ Seeded ${initialData_1.initialStockMovements.length} stock movements`);
        // Seed Suppliers
        await Supplier_js_1.default.insertMany(initialData_1.initialSuppliers);
        console.log(`✅ Seeded ${initialData_1.initialSuppliers.length} suppliers`);
        // Seed Purchase Orders
        await PurchaseOrder_js_1.default.insertMany(initialData_1.initialPurchaseOrders);
        console.log(`✅ Seeded ${initialData_1.initialPurchaseOrders.length} purchase orders`);
        // Seed Quotations
        await Quotation_js_1.default.insertMany(initialData_1.initialQuotations);
        console.log(`✅ Seeded ${initialData_1.initialQuotations.length} quotations`);
        // Seed Settings
        await Settings_js_1.default.create(initialData_1.initialSettings);
        console.log('✅ Seeded settings');
        // Seed Returns
        await Return_js_1.default.insertMany(initialData_1.initialReturns);
        console.log(`✅ Seeded ${initialData_1.initialReturns.length} returns`);
        console.log('🌱 Database seeded successfully!');
        mongoose_1.default.connection.close();
    }
    catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
};
seedDatabase();
