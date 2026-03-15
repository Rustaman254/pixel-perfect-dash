import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const checkDb = async () => {
    const db = await open({
        filename: './ripplify.db',
        driver: sqlite3.Database
    });
    const users = await db.all('SELECT id, email, businessName FROM users');
    console.log('Users:', JSON.stringify(users, null, 2));
    
    const sessionCount = await db.get('SELECT COUNT(*) as count FROM insight_sessions');
    console.log('Total Insight Sessions:', sessionCount.count);
    
    if (sessionCount.count > 0) {
        const lastSessions = await db.all('SELECT * FROM insight_sessions ORDER BY id DESC LIMIT 5');
        console.log('Last 5 Sessions:', JSON.stringify(lastSessions, null, 2));
    }
};

checkDb().catch(console.error);
