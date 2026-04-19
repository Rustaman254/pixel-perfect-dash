import { getAuthDb, createConnection } from '../../server/config/db.js';

async function createFormsTables() {
  const db = createConnection('auth_db');
  
  try {
    // Create forms table
    await db.raw(`
      CREATE TABLE IF NOT EXISTS forms (
        id SERIAL PRIMARY KEY,
        userid INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        questions TEXT DEFAULT '[]',
        settings TEXT DEFAULT '{}',
        theme TEXT DEFAULT '{}',
        slug VARCHAR(255) UNIQUE NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Forms table created');

    // Create form_responses table
    await db.raw(`
      CREATE TABLE IF NOT EXISTS form_responses (
        id SERIAL PRIMARY KEY,
        formid INTEGER REFERENCES forms(id) ON DELETE CASCADE,
        email VARCHAR(255),
        answers TEXT DEFAULT '{}',
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Form_responses table created');

    // Create indexes
    await db.raw(`CREATE INDEX IF NOT EXISTS idx_forms_userid ON forms(userid)`);
    await db.raw(`CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug)`);
    await db.raw(`CREATE INDEX IF NOT EXISTS idx_form_responses_formid ON form_responses(formid)`);
    console.log('Indexes created');

    // Add missing columns if they don't exist
    try {
      await db.raw(`ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
      console.log('Added email column to form_responses');
    } catch (e) {
      // Column might already exist
    }

    console.log('Forms tables created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error.message);
  } finally {
    await db.destroy();
  }
}

createFormsTables();