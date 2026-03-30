import knex from 'knex';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = knex({
  client: 'better-sqlite3',
  connection: {
    filename: path.resolve('/home/masterchiefff/Documents/RippliFy/shopalize_db.sqlite'),
  },
  useNullAsDefault: true,
});

async function test() {
  try {
    console.log('Testing insert with returning...');
    const result = await db('projects')
      .insert({
        userId: 1,
        name: 'Test Project ' + Date.now(),
        slug: `test-${Date.now()}`,
        status: 'draft',
      })
      .returning('*');
    
    console.log('Result type:', typeof result);
    console.log('Is Array:', Array.isArray(result));
    console.log('Result content:', JSON.stringify(result));
    
    if (Array.isArray(result) && result.length > 0) {
      const project = result[0];
      console.log('Project:', JSON.stringify(project));
      // In PostgreSQL, result[0] is the object.
      // In SQLite with some configurations, it might be just the ID.
      if (typeof project === 'object' && project !== null) {
        console.log('Project ID from object:', project.id);
      } else {
        console.log('Project is NOT an object. It is:', typeof project, project);
      }
    } else {
      console.log('Result is empty or not an array');
    }
  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await db.destroy();
  }
}

test();
