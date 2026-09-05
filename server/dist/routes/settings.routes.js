"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Settings_js_1 = __importDefault(require("../db/models/Settings.js"));
const router = express_1.default.Router();
// Get settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings_js_1.default.findOne({});
        if (!settings) {
            settings = await Settings_js_1.default.create({});
        }
        res.json({ success: true, data: settings });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// Update settings
router.put('/', async (req, res) => {
    try {
        const updated = await Settings_js_1.default.findOneAndUpdate({}, req.body, { new: true, upsert: true });
        res.json({ success: true, data: updated });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
exports.default = router;
