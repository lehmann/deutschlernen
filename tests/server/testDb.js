// In-memory SQLite database for server tests.
// Imported by both the mock factory and the test file — ESM module cache
// ensures both references point to the same Database instance.
import Database from 'better-sqlite3'

const db = new Database(':memory:')

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id         TEXT    PRIMARY KEY,
    endpoint   TEXT    UNIQUE NOT NULL,
    sub_json   TEXT    NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id TEXT    NOT NULL,
    completed_at    INTEGER NOT NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id TEXT    NOT NULL,
    sent_at         INTEGER NOT NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
  );
`)

export default db
