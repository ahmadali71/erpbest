"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const SettingsSchema = new mongoose_1.default.Schema({
    companyName: { type: String, required: true },
    tagline: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    taxRegistrationNumber: { type: String },
    taxNumber: { type: String },
    website: { type: String },
    currencySymbol: { type: String, default: '$' },
    currencyCode: { type: String, default: 'USD' },
    defaultTaxRate: { type: Number, default: 5.0 },
    defaultPaymentTermsDays: { type: Number, default: 30 },
    defaultLowStockThreshold: { type: Number, default: 5 },
    stockAlertThreshold: { type: Number, default: 3 },
    invoicePrefix: { type: String, default: 'INV-' },
    quotePrefix: { type: String, default: 'QT-' },
    receiptHeader: { type: String, default: 'Thank you for choosing Nexus Enterprise!' },
    receiptFooter: { type: String, default: 'Goods once sold can be returned within 30 days with original invoice.' },
    receiptHeaderMessage: { type: String, default: 'Thank you for shopping at Nexus Enterprise!' },
    receiptFooterMessage: { type: String, default: 'Returns accepted within 30 days with valid receipt.' },
    showBarcodeOnReceipt: { type: Boolean, default: true },
    showTaxBreakdown: { type: Boolean, default: true },
    autoPrintReceipt: { type: Boolean, default: false },
    compactMode: { type: Boolean, default: false },
    themeAccent: { type: String, default: 'indigo' },
    enableSoundEffects: { type: Boolean, default: true },
    enableAutoPrintReceipt: { type: Boolean, default: false },
    barcodeLabelConfig: {
        labelSize: { type: String, default: '50x25' },
        showPrice: { type: Boolean, default: true },
        showSku: { type: Boolean, default: true },
        showProductName: { type: Boolean, default: true },
        showCompanyName: { type: Boolean, default: true },
        barcodeType: { type: String, default: 'CODE128' },
    },
}, { timestamps: true });
exports.default = mongoose_1.default.model < ISettings > ('Settings', SettingsSchema);
