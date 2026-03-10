import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

(async () => {
    try {
        const db = await open({ filename: './ripplify.db', driver: sqlite3.Database });

        // Ensure we have a user
        let user = await db.get('SELECT id FROM users LIMIT 1');
        if (!user) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            const result = await db.run(
                'INSERT INTO users (email, password, fullName, businessName) VALUES (?, ?, ?, ?)',
                ['test@ripplify.com', hashedPassword, 'Test Seller', 'TomorrowLand Events']
            );
            user = { id: result.lastID };
            console.log('CREATED_USER: test@ripplify.com');
        } else {
            console.log('EXISTING_USER_ID:', user.id);
        }

        // Create the specific link
        const slug = 'tomorrow-land-q29db';
        const existingLink = await db.get('SELECT id FROM payment_links WHERE slug = ?', slug);
        if (!existingLink) {
            await db.run(
                `INSERT INTO payment_links (userId, name, slug, description, price, currency, linkType, deliveryDays) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [user.id, 'TomorrowLand Q2 VIP Pass', slug, 'VIP access to tomorrow land Q2 event with premium perks.', 15000, 'KES', 'one-time', 2]
            );
            console.log('CREATED_LINK:', slug);
        } else {
            console.log('LINK_ALREADY_EXISTS:', slug);
        }

    } catch (err) {
        console.error('ERROR:' + err.message);
    }
})();
