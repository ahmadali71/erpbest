"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const product_routes_js_1 = __importDefault(require("./routes/product.routes.js"));
const client_routes_js_1 = __importDefault(require("./routes/client.routes.js"));
const sale_routes_js_1 = __importDefault(require("./routes/sale.routes.js"));
const expense_routes_js_1 = __importDefault(require("./routes/expense.routes.js"));
const supplier_routes_js_1 = __importDefault(require("./routes/supplier.routes.js"));
const purchaseOrder_routes_js_1 = __importDefault(require("./routes/purchaseOrder.routes.js"));
const quotation_routes_js_1 = __importDefault(require("./routes/quotation.routes.js"));
const return_routes_js_1 = __importDefault(require("./routes/return.routes.js"));
const settings_routes_js_1 = __importDefault(require("./routes/settings.routes.js"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
// Routes
app.use('/api/products', product_routes_js_1.default);
app.use('/api/clients', client_routes_js_1.default);
app.use('/api/sales', sale_routes_js_1.default);
app.use('/api/expenses', expense_routes_js_1.default);
app.use('/api/suppliers', supplier_routes_js_1.default);
app.use('/api/purchase-orders', purchaseOrder_routes_js_1.default);
app.use('/api/quotations', quotation_routes_js_1.default);
app.use('/api/returns', return_routes_js_1.default);
app.use('/api/settings', settings_routes_js_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Nexus ERP Backend' });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
});
mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nexus_erp')
    .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });
})
    .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
