-- ASIS-UNI Task 01 (paso 1/2): nuevo valor enum — debe ir en migración separada (PG 55P04).

ALTER TYPE "AttendanceLogSource" ADD VALUE IF NOT EXISTS 'APP_MOVIL';
