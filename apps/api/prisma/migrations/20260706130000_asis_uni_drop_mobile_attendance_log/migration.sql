-- ASIS-UNI Task 05: eliminar tabla paralela tras backfill en Task 01.

DROP TABLE IF EXISTS "mobile_attendance_logs";

DROP TYPE IF EXISTS "MobileAttendanceEventType";
DROP TYPE IF EXISTS "MobileAttendanceStatus";
