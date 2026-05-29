-- Rename TestLab users table to free physical "users" for global User model (USR-01 bridge).
-- PostgreSQL updates FK constraints referencing users(id) to target users_testlab automatically.
ALTER TABLE "users" RENAME TO "users_testlab";
