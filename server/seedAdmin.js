import bcrypt from "bcryptjs";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const seed = async () => {
  const db = await open({
    filename: './ripplify.db',
    driver: sqlite3.Database
  });

  const adminExists = await db.get("SELECT * FROM users WHERE email = 'admin@ripplify.co'");
  
  if (adminExists) {
    console.log("Admin already exists!");
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash("admin123", salt);

  await db.run(`
    INSERT INTO users (email, password, role, fullName, businessName, isVerified)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ["admin@ripplify.co", hashedPassword, "admin", "System Administrator", "RippliFy Inc", 1]);

  console.log("Default Admin created: admin@ripplify.co / admin123");
  process.exit(0);
}

seed();
