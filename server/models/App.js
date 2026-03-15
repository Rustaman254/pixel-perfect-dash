import { getDb } from "../config/db.js";

const App = {
    findAll: async () => {
        const db = getDb();
        return await db.all("SELECT * FROM apps ORDER BY createdAt ASC");
    },
    
    findActive: async () => {
        const db = getDb();
        return await db.all("SELECT * FROM apps WHERE isActive = 1 ORDER BY createdAt ASC");
    },

    findById: async (id) => {
        const db = getDb();
        return await db.get("SELECT * FROM apps WHERE id = ?", [id]);
    },

    create: async ({ name, slug, icon, url }) => {
        const db = getDb();
        const result = await db.run(
            "INSERT INTO apps (name, slug, icon, url) VALUES (?, ?, ?, ?)",
            [name, slug, icon, url]
        );
        return { id: result.lastID, name, slug, icon, url, isActive: 1 };
    },

    update: async (id, updates) => {
        const db = getDb();
        const { name, slug, icon, url, isActive } = updates;
        await db.run(
            `UPDATE apps SET name =?, slug = ?, icon = ?, url = ?, isActive = ? WHERE id = ?`,
            [name, slug, icon, url, isActive ? 1 : 0, id]
        );
        return await App.findById(id);
    },

    delete: async (id) => {
        const db = getDb();
        await db.run("DELETE FROM apps WHERE id = ?", [id]);
        return true;
    },
    
    toggleActive: async (id, isActive) => {
        const db = getDb();
        await db.run("UPDATE apps SET isActive = ? WHERE id = ?", [isActive ? 1 : 0, id]);
        return true;
    }
};

export default App;
