
import connectDB, { getDb } from './server/config/db.js';
import ApiKey from './server/models/ApiKey.js';

async function testDelete() {
    await connectDB();
    const db = getDb();
    const result = await db.run("INSERT INTO api_keys (userId, key, name, status) VALUES (1, 'test_key_new', 'Test New', 'Active')");
    const id = result.lastID;
    console.log("Created key with ID:", id);
    
    await ApiKey.delete(id);
    const key = await db.get("SELECT * FROM api_keys WHERE id = ?", id);
    if (!key) {
        console.log("SUCCESS: Key deleted");
    } else {
        console.log("FAILURE: Key still exists");
    }
    process.exit(0);
}

testDelete().catch(console.error);
