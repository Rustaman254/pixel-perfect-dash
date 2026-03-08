import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

(async () => {
    try {
        const db = await open({ filename: './ripplify.db', driver: sqlite3.Database });
        const link = await db.get('SELECT * FROM payment_links WHERE slug = ?', 'tomorrow-land-q29db');
        if (link) {
            console.log('SLUG_FOUND:' + JSON.stringify(link));
        } else {
            console.log('SLUG_NOT_FOUND');
        }
    } catch (err) {
        console.error('ERROR:' + err.message);
    }
})();
