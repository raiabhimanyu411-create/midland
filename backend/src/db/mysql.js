import mysql from 'mysql2/promise';
import { trucks as seedTrucks } from '../data/trucks.js';
import bcrypt from 'bcryptjs';

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'midland',
  ...(process.env.DB_SSL === 'true'
    ? { ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } }
    : {}),
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
};

export const pool = mysql.createPool(dbConfig);

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS trucks (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      make VARCHAR(100) NOT NULL,
      type VARCHAR(100) NOT NULL,
      location VARCHAR(180) NOT NULL,
      price VARCHAR(50) NOT NULL,
      price_value INT NOT NULL DEFAULT 0,
      mileage VARCHAR(50) NOT NULL,
      mileage_value INT NOT NULL DEFAULT 0,
      year VARCHAR(10) NOT NULL,
      gearbox VARCHAR(80) NOT NULL,
      badge VARCHAR(80) DEFAULT '',
      cab VARCHAR(120) DEFAULT '',
      power VARCHAR(80) DEFAULT '',
      mot VARCHAR(160) DEFAULT '',
      description TEXT,
      image TEXT,
      status VARCHAR(30) NOT NULL DEFAULT 'available',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS enquiries (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(60) NOT NULL,
      email VARCHAR(160) DEFAULT '',
      requirement TEXT NOT NULL,
      truck_id INT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS finance_quotes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(60) NOT NULL,
      email VARCHAR(160) DEFAULT '',
      vehicle_price INT NOT NULL,
      deposit INT NOT NULL,
      term INT NOT NULL,
      monthly_estimate INT NOT NULL,
      truck_id INT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS part_exchange_requests (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) DEFAULT '',
      phone VARCHAR(60) DEFAULT '',
      email VARCHAR(160) DEFAULT '',
      registration VARCHAR(40) NOT NULL,
      mileage VARCHAR(80) NOT NULL,
      notes TEXT NOT NULL,
      target_truck_id INT NULL,
      status VARCHAR(30) NOT NULL DEFAULT 'new',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_leads (
      id INT PRIMARY KEY AUTO_INCREMENT,
      session_id VARCHAR(80) NOT NULL,
      name VARCHAR(120) NOT NULL,
      phone VARCHAR(60) NOT NULL,
      email VARCHAR(160) DEFAULT '',
      company VARCHAR(160) DEFAULT '',
      postcode VARCHAR(16) DEFAULT '',
      requirement TEXT NOT NULL,
      vehicle_type VARCHAR(100) DEFAULT '',
      budget INT NOT NULL DEFAULT 0,
      budget_vat VARCHAR(30) DEFAULT 'excluding VAT',
      purchase_timeline VARCHAR(60) DEFAULT '',
      preferred_callback VARCHAR(120) DEFAULT '',
      finance_required BOOLEAN NOT NULL DEFAULT FALSE,
      part_exchange BOOLEAN NOT NULL DEFAULT FALSE,
      truck_id INT NULL,
      source_page VARCHAR(255) DEFAULT '',
      transcript JSON NULL,
      consent BOOLEAN NOT NULL DEFAULT FALSE,
      lead_score INT NOT NULL DEFAULT 0,
      temperature VARCHAR(20) NOT NULL DEFAULT 'cold',
      status VARCHAR(30) NOT NULL DEFAULT 'new',
      assigned_to VARCHAR(120) DEFAULT '',
      sales_notes TEXT,
      follow_up_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chat_leads_status (status),
      INDEX idx_chat_leads_temperature (temperature),
      INDEX idx_chat_leads_created (created_at)
    )
  `);

  await pool.query(`CREATE TABLE IF NOT EXISTS admin_users (
    id INT PRIMARY KEY AUTO_INCREMENT, name VARCHAR(120) NOT NULL, email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, role ENUM('admin','manager','salesperson') NOT NULL DEFAULT 'salesperson',
    active BOOLEAN NOT NULL DEFAULT TRUE, reset_token_hash VARCHAR(255) NULL, reset_expires_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS admin_sessions (
    id VARCHAR(80) PRIMARY KEY, user_id INT NOT NULL, expires_at DATETIME NOT NULL, revoked_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_session_user(user_id),
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS lead_status_history (
    id INT PRIMARY KEY AUTO_INCREMENT, lead_id INT NOT NULL, from_status VARCHAR(30), to_status VARCHAR(30) NOT NULL,
    changed_by INT NOT NULL, note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_history_lead(lead_id)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NULL, user_name VARCHAR(120), action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(60), entity_id VARCHAR(80), details JSON NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created(created_at)
  )`);
  await pool.query(`CREATE TABLE IF NOT EXISTS admin_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT, user_id INT NULL, title VARCHAR(180) NOT NULL, message TEXT NOT NULL,
    link VARCHAR(255) DEFAULT '', is_read BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_notification_user(user_id, is_read)
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS blogs (
    id INT PRIMARY KEY AUTO_INCREMENT, title VARCHAR(220) NOT NULL, slug VARCHAR(220) NOT NULL UNIQUE,
    excerpt VARCHAR(320) DEFAULT '', content LONGTEXT NOT NULL, cover_image TEXT,
    tags VARCHAR(255) DEFAULT '', meta_title VARCHAR(70) DEFAULT '', meta_description VARCHAR(160) DEFAULT '',
    status ENUM('draft','published') NOT NULL DEFAULT 'draft', author_id INT NULL, author_name VARCHAR(120) DEFAULT '',
    published_at DATETIME NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_blog_status(status), INDEX idx_blog_published(published_at)
  )`);

  await ensureDefaultAdmin();

  if (process.env.NODE_ENV !== 'production' || process.env.SEED_DEMO_DATA === 'true') {
    await seedTruckData();
  }
}

async function ensureDefaultAdmin() {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM admin_users');
  if (rows[0].total) return;
  const email = process.env.ADMIN_EMAIL || 'admin@midlandtrucks.co.uk';
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD || password === 'ChangeMe123!' || password.length < 12)
  ) {
    throw new Error('ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters are required to create the first production admin');
  }

  const hash = await bcrypt.hash(password, 12);
  await pool.query('INSERT INTO admin_users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    ['MidLand Administrator', email.toLowerCase(), hash, 'admin']);
  console.warn(`Initial admin created: ${email}.`);
}

async function seedTruckData() {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM trucks');

  if (rows[0].total > 0) {
    return;
  }

  await Promise.all(
    seedTrucks.map((truck) =>
      pool.query(
        `INSERT INTO trucks (
          title, make, type, location, price, price_value, mileage, mileage_value,
          year, gearbox, badge, cab, power, mot, description, image
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          truck.title,
          truck.make,
          truck.type,
          truck.location,
          truck.price,
          truck.priceValue,
          truck.mileage,
          truck.mileageValue,
          truck.year,
          truck.gearbox,
          truck.badge,
          truck.cab,
          truck.power,
          truck.mot,
          truck.description,
          truck.image
        ]
      )
    )
  );
}

export function mapTruck(row) {
  return {
    id: row.id,
    title: row.title,
    make: row.make,
    type: row.type,
    location: row.location,
    price: row.price,
    priceValue: row.price_value,
    mileage: row.mileage,
    mileageValue: row.mileage_value,
    year: row.year,
    gearbox: row.gearbox,
    badge: row.badge,
    cab: row.cab,
    power: row.power,
    mot: row.mot,
    description: row.description,
    image: row.image,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapBlog(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.cover_image,
    tags: row.tags ? row.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [],
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    status: row.status,
    authorName: row.author_name,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
