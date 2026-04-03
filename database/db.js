const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'carona.db');
let sqlDb = null;

function save() {
  const data = sqlDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

function makePrepared(sql) {
  return {
    run(...args) {
      sqlDb.run(sql, args.length > 0 ? args : undefined);
      const changes = sqlDb.getRowsModified();
      const res = sqlDb.exec('SELECT last_insert_rowid()');
      const lastInsertRowid = res.length > 0 ? res[0].values[0][0] : null;
      save();
      return { lastInsertRowid, changes };
    },
    get(...args) {
      const stmt = sqlDb.prepare(sql);
      if (args.length > 0) stmt.bind(args);
      const row = stmt.step() ? stmt.getAsObject() : undefined;
      stmt.free();
      return row;
    },
    all(...args) {
      const stmt = sqlDb.prepare(sql);
      if (args.length > 0) stmt.bind(args);
      const rows = [];
      while (stmt.step()) rows.push(stmt.getAsObject());
      stmt.free();
      return rows;
    }
  };
}

async function init() {
  const initSqlJs = require('sql.js');
  const SQL = await initSqlJs({
    locateFile: file => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file)
  });

  if (fs.existsSync(dbPath)) {
    sqlDb = new SQL.Database(fs.readFileSync(dbPath));
  } else {
    sqlDb = new SQL.Database();
  }

  sqlDb.run('PRAGMA foreign_keys = ON');

  sqlDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      profile_photo TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plate TEXT NOT NULL,
      model TEXT NOT NULL,
      color TEXT NOT NULL,
      seats INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      price REAL NOT NULL,
      available_seats INTEGER NOT NULL,
      total_seats INTEGER NOT NULL,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ride_id INTEGER NOT NULL,
      passenger_id INTEGER NOT NULL,
      status TEXT DEFAULT 'confirmed',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (ride_id) REFERENCES rides(id) ON DELETE CASCADE,
      FOREIGN KEY (passenger_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(ride_id, passenger_id)
    );
  `);

  save();
  console.log('Banco de dados inicializado.');
}

const db = {
  init,
  prepare: (sql) => makePrepared(sql),
  exec: (sql) => { sqlDb.exec(sql); save(); }
};

module.exports = db;
