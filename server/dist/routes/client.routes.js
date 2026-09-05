"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Client_js_1 = __importDefault(require("../db/models/Client.js"));
const router = express_1.default.Router();
// Get all clients
router.get('/', async (req, res) => {
    try {
        const clients = await Client_js_1.default.find().lean();
        res.json({ success: true, data: clients });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Get single client
router.get('/:id', async (req, res) => {
    try {
        const client = await Client_js_1.default.findById(req.params.id).lean();
        if (!client) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }
        res.json({ success: true, data: client });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
// Create client
router.post('/', async (req, res) => {
    try {
        const client = new Client_js_1.default(req.body);
        await client.save();
        res.status(201).json({ success: true, data: client });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Update client
router.put('/:id', async (req, res) => {
    try {
        const client = await Client_js_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        if (!client) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }
        res.json({ success: true, data: client });
    }
    catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});
// Delete client
router.delete('/:id', async (req, res) => {
    try {
        const client = await Client_js_1.default.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ success: false, error: 'Client not found' });
        }
        res.json({ success: true, data: {} });
    }
    catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});
exports.default = router;
