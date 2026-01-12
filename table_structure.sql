-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'member')) DEFAULT 'member',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- SESSIONS TABLE
-- ============================================
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ============================================
-- PASSWORD RESET TOKENS TABLE
-- ============================================
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);

-- ============================================
-- BOOKS TABLE
-- ============================================
CREATE TABLE books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  work_key TEXT,  -- Open Library work key for duplicate detection
  status TEXT NOT NULL CHECK(status IN ('read', 'unread', 'tbd')) DEFAULT 'tbd',
  read_on TEXT,  -- Month and year when the book club read/will read it (format: YYYY-MM, e.g., '2026-02')
  suggested_by INTEGER,  -- User ID who suggested it
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (suggested_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_suggested_by ON books(suggested_by);
CREATE UNIQUE INDEX idx_books_work_key ON books(work_key);

-- ============================================
-- RATINGS TABLE
-- ============================================
CREATE TABLE ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  book_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 0 AND rating <= 10),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, book_id),  -- One rating per user per book
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_book ON ratings(book_id);

-- ============================================
-- MEETING DATES TABLE
-- ============================================
CREATE TABLE meeting_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER,  -- Nullable: proposed date might not be tied to specific book yet
  proposed_date DATE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('proposed', 'confirmed', 'cancelled')) DEFAULT 'proposed',
  location TEXT,  -- Optional: where the meeting will be
  notes TEXT,  -- Optional: any additional details
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE SET NULL
);

CREATE INDEX idx_meeting_dates_book ON meeting_dates(book_id);
CREATE INDEX idx_meeting_dates_date ON meeting_dates(proposed_date);
CREATE INDEX idx_meeting_dates_status ON meeting_dates(status);

-- ============================================
-- MEETING VOTES TABLE
-- ============================================
CREATE TABLE meeting_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_date_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  vote TEXT NOT NULL CHECK(vote IN ('yes', 'no', 'maybe')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(meeting_date_id, user_id),  -- One vote per user per proposed date
  FOREIGN KEY (meeting_date_id) REFERENCES meeting_dates(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_meeting_votes_meeting ON meeting_votes(meeting_date_id);
CREATE INDEX idx_meeting_votes_user ON meeting_votes(user_id);

-- ============================================
-- BOOK SUGGESTIONS TABLE
-- ============================================
CREATE TABLE book_suggestions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  cover_url TEXT,
  work_key TEXT,
  year INTEGER,  -- First publication year from Open Library
  suggested_month TEXT NOT NULL,  -- Format: YYYY-MM (e.g., '2026-02')
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_suggestions_user ON book_suggestions(user_id);
CREATE INDEX idx_suggestions_status ON book_suggestions(status);
CREATE INDEX idx_suggestions_month ON book_suggestions(suggested_month);

-- ============================================
-- BOOK NOMINATIONS TABLE (Optional but useful)
-- ============================================
CREATE TABLE book_nominations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(book_id, user_id),  -- Prevent duplicate nominations
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_book_nominations_book ON book_nominations(book_id);
CREATE INDEX idx_book_nominations_user ON book_nominations(user_id);