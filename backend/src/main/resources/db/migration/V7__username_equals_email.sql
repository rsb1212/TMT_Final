-- V7__username_equals_email.sql
-- Enforce that a user's "User ID" (username) is always their domain email.
--
-- Rationale:
--   * Login already authenticates by email.
--   * The primary key `id` (UUID) is referenced by foreign keys across the
--     schema and must NOT change.
--   * The human-facing identifier is `username`, which historically could be an
--     arbitrary value (e.g. IDEM `preferred_username`). We standardise it to the
--     corporate domain email, e.g. rahul.bhagat@its.bajajlife.com.

-- 1) Widen `username` so it can hold a full email (email is VARCHAR(120)).
ALTER TABLE users
    ALTER COLUMN username TYPE VARCHAR(120);

-- 2) Backfill: force every existing user's username to equal their email.
UPDATE users
   SET username   = email,
       updated_at = CURRENT_TIMESTAMP
 WHERE username IS DISTINCT FROM email;

-- 3) Guarantee uniqueness of the User ID going forward.
--    (Emails are already unique in practice; make it explicit.)
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_username ON users (username);
