import ApiKey from '../models/ApiKey.js';

export const apiKeyAuth = async (req, res, next) => {
    const key = req.header('X-API-KEY');

    if (!key) {
        return res.status(401).json({ message: "No API Key provided. Use X-API-KEY header." });
    }

    try {
        const apiKeyRecord = await ApiKey.findByKey(key);

        if (!apiKeyRecord) {
            return res.status(403).json({ message: "Invalid or inactive API Key." });
        }

        // Attach vendor info to request
        req.vendor = {
            id: apiKeyRecord.userId,
            businessName: apiKeyRecord.businessName,
            email: apiKeyRecord.userEmail
        };

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
