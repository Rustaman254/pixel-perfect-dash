import express from "express";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/', (req, res) => {
    res.json({ message: 'SSO endpoint active', status: 'ok' });
});

router.post('/callback', (req, res) => {
    const { code, state } = req.body;
    res.json({ message: 'SSO callback received', code, state });
});

export default router;