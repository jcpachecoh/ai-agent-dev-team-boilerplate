-- Read-only audit: deterministic permission id collisions (legacy vs greenfield seed).
-- Safe to run on staging/production. Does NOT modify data.
--
-- Context:
--   Seed prefers ids cccccccc-0000-0000-0000-00000000000N per PERMISSION_SEEDS.
--   Legacy DBs may have nomina.settlement.* at 064–071 while current seed maps
--   legal/daily-cost-center to 064–067 and settlement to 072–079.
--   Remediation: keep matching by `code`; do NOT rewrite permission UUIDs in place.
--   Re-run apps/api seed so seedPermissions + seedRolePermissions reconcile by code.

-- 1) Who occupies the historically contested range 064–079?
SELECT
  id,
  code,
  module,
  resource,
  action,
  "isActive",
  "createdAt"
FROM permissions
WHERE id BETWEEN 'cccccccc-0000-0000-0000-000000000064'
             AND 'cccccccc-0000-0000-0000-000000000079'
ORDER BY id;

-- 2) Settlement / legal / daily-cost-center: current ids vs expected preferred ids
SELECT
  code,
  id AS actual_id,
  CASE code
    WHEN 'configuracion.legal.read' THEN 'cccccccc-0000-0000-0000-000000000064'
    WHEN 'configuracion.legal.write' THEN 'cccccccc-0000-0000-0000-000000000065'
    WHEN 'attendance.daily-cost-center.read' THEN 'cccccccc-0000-0000-0000-000000000066'
    WHEN 'attendance.daily-cost-center.write' THEN 'cccccccc-0000-0000-0000-000000000067'
    WHEN 'nomina.settlement.read' THEN 'cccccccc-0000-0000-0000-000000000072'
    WHEN 'nomina.settlement.calculate' THEN 'cccccccc-0000-0000-0000-000000000073'
    WHEN 'nomina.settlement.manual' THEN 'cccccccc-0000-0000-0000-000000000074'
    WHEN 'nomina.settlement.reconcile_pending_salary' THEN 'cccccccc-0000-0000-0000-000000000075'
    WHEN 'nomina.settlement.approve' THEN 'cccccccc-0000-0000-0000-000000000076'
    WHEN 'nomina.settlement.pay' THEN 'cccccccc-0000-0000-0000-000000000077'
    WHEN 'nomina.settlement.void' THEN 'cccccccc-0000-0000-0000-000000000078'
    WHEN 'nomina.settlement.validate_legal_formula' THEN 'cccccccc-0000-0000-0000-000000000079'
    ELSE NULL
  END AS preferred_id,
  (id = CASE code
    WHEN 'configuracion.legal.read' THEN 'cccccccc-0000-0000-0000-000000000064'
    WHEN 'configuracion.legal.write' THEN 'cccccccc-0000-0000-0000-000000000065'
    WHEN 'attendance.daily-cost-center.read' THEN 'cccccccc-0000-0000-0000-000000000066'
    WHEN 'attendance.daily-cost-center.write' THEN 'cccccccc-0000-0000-0000-000000000067'
    WHEN 'nomina.settlement.read' THEN 'cccccccc-0000-0000-0000-000000000072'
    WHEN 'nomina.settlement.calculate' THEN 'cccccccc-0000-0000-0000-000000000073'
    WHEN 'nomina.settlement.manual' THEN 'cccccccc-0000-0000-0000-000000000074'
    WHEN 'nomina.settlement.reconcile_pending_salary' THEN 'cccccccc-0000-0000-0000-000000000075'
    WHEN 'nomina.settlement.approve' THEN 'cccccccc-0000-0000-0000-000000000076'
    WHEN 'nomina.settlement.pay' THEN 'cccccccc-0000-0000-0000-000000000077'
    WHEN 'nomina.settlement.void' THEN 'cccccccc-0000-0000-0000-000000000078'
    WHEN 'nomina.settlement.validate_legal_formula' THEN 'cccccccc-0000-0000-0000-000000000079'
    ELSE id
  END) AS matches_preferred
FROM permissions
WHERE code LIKE 'nomina.settlement.%'
   OR code LIKE 'configuracion.legal.%'
   OR code LIKE 'attendance.daily-cost-center.%'
ORDER BY code;

-- 3) Preferred id owned by a different code (true collision risk for greenfield create)
--    Example: id …064 holds settlement.read while seed wants legal.read there.
WITH preferred AS (
  SELECT * FROM (VALUES
    ('cccccccc-0000-0000-0000-000000000064', 'configuracion.legal.read'),
    ('cccccccc-0000-0000-0000-000000000065', 'configuracion.legal.write'),
    ('cccccccc-0000-0000-0000-000000000066', 'attendance.daily-cost-center.read'),
    ('cccccccc-0000-0000-0000-000000000067', 'attendance.daily-cost-center.write'),
    ('cccccccc-0000-0000-0000-000000000072', 'nomina.settlement.read'),
    ('cccccccc-0000-0000-0000-000000000073', 'nomina.settlement.calculate'),
    ('cccccccc-0000-0000-0000-000000000074', 'nomina.settlement.manual'),
    ('cccccccc-0000-0000-0000-000000000075', 'nomina.settlement.reconcile_pending_salary'),
    ('cccccccc-0000-0000-0000-000000000076', 'nomina.settlement.approve'),
    ('cccccccc-0000-0000-0000-000000000077', 'nomina.settlement.pay'),
    ('cccccccc-0000-0000-0000-000000000078', 'nomina.settlement.void'),
    ('cccccccc-0000-0000-0000-000000000079', 'nomina.settlement.validate_legal_formula')
  ) AS t(preferred_id, expected_code)
)
SELECT
  p.preferred_id,
  p.expected_code,
  perm.code AS actual_code_at_id,
  CASE
    WHEN perm.id IS NULL THEN 'FREE'
    WHEN perm.code = p.expected_code THEN 'OK'
    ELSE 'COLLISION'
  END AS status
FROM preferred p
LEFT JOIN permissions perm ON perm.id = p.preferred_id
ORDER BY p.preferred_id;

-- 4) Role ↔ permission links for settlement/legal/daily-cost-center (by code)
SELECT
  r.code AS role_code,
  perm.code AS permission_code,
  perm.id AS permission_id,
  rp."createdAt"
FROM role_permissions rp
JOIN roles r ON r.id = rp."roleId"
JOIN permissions perm ON perm.id = rp."permissionId"
WHERE perm.code LIKE 'nomina.settlement.%'
   OR perm.code LIKE 'configuracion.legal.%'
   OR perm.code LIKE 'attendance.daily-cost-center.%'
ORDER BY r.code, perm.code;
