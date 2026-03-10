import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

(async () => {
    try {
        const db = await open({ filename: './ripplify.db', driver: sqlite3.Database });
        const txns = await db.all('SELECT * FROM transactions ORDER BY createdAt DESC LIMIT 1');
        console.log('TXN_FOUND:' + JSON.stringify(txns));

        const user = await db.get('SELECT * FROM users WHERE id = 1');
        console.log('USER_FOUND:' + JSON.stringify(user));

        const link = await db.get('SELECT * FROM payment_links WHERE slug = "tomorrow-land-q29db"');
        console.log('LINK_FOUND:' + JSON.stringify(link));
    } catch (err) {
        console.error('ERROR:' + err.message);
    }
})();
