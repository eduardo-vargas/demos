-- Users table (internal tracking for attendance)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  short_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Closed')),
  creator_id TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- Meeting members (tracks who belongs to which meeting)
CREATE TABLE IF NOT EXISTS meeting_members (
  meeting_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'Member' CHECK(role IN ('Owner', 'Member')),
  joined_at INTEGER DEFAULT (unixepoch()),
  PRIMARY KEY (meeting_id, user_id),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meeting_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Votes table (tracks upvotes/downvotes)
CREATE TABLE IF NOT EXISTS votes (
  question_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('up', 'down')),
  PRIMARY KEY (question_id, user_id),
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_meeting ON questions(meeting_id);
CREATE INDEX IF NOT EXISTS idx_votes_question ON votes(question_id);
CREATE INDEX IF NOT EXISTS idx_meeting_members_user ON meeting_members(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_short_code ON meetings(short_code);
