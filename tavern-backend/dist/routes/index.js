"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/ping', (req, res) => {
    res.json({ message: '🏰 Tavern backend is alive!' });
});
exports.default = router;
