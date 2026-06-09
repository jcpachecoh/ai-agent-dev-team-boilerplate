import * as crypto from 'crypto';
import { OperationalRole } from '@prisma/client';

/** Keep in sync with scripts/backfill-operational-user-links.ts DEV_KNOWN_OPERATORS */
const DEV_KNOWN_OPERATORS = [
  {
    tenantId: 'palos-de-lena',
    cedula: '12345678',
    email: 'mes-owner@palos-de-lena.dev',
    operationalRole: OperationalRole.OWNER,
    seedOperationalUserId: 'dddddddd-0000-0000-0000-000000000004',
  },
  {
    tenantId: 'palos-de-lena',
    cedula: '87654321',
    email: 'mes-operator@palos-de-lena.dev',
    operationalRole: OperationalRole.OPERATOR,
    seedOperationalUserId: 'eeeeeeee-0000-0000-0000-000000000005',
  },
] as const;

function hashCedula(cedula: string): string {
  const hmacSecret = process.env.CEDULA_HMAC_SECRET;
  if (hmacSecret) {
    return crypto.createHmac('sha256', hmacSecret).update(cedula).digest('hex');
  }
  return crypto.createHash('sha256').update(cedula).digest('hex');
}

describe('OperationalUser → User backfill fixtures (USR-01 Task 09)', () => {
  it('maps seed cédulas to deterministic hashes for palos-de-lena', () => {
    for (const fixture of DEV_KNOWN_OPERATORS) {
      const hash = hashCedula(fixture.cedula);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
      expect(hash).toBe(hashCedula(fixture.cedula));
    }
  });

  it('includes owner and operator MES regression roles', () => {
    const roles = DEV_KNOWN_OPERATORS.map((entry) => entry.operationalRole);

    expect(roles).toContain(OperationalRole.OWNER);
    expect(roles).toContain(OperationalRole.OPERATOR);
  });

  it('documents deterministic seed operational user ids linked in Task 07', () => {
    const owner = DEV_KNOWN_OPERATORS.find((e) => e.operationalRole === OperationalRole.OWNER);
    const operator = DEV_KNOWN_OPERATORS.find(
      (e) => e.operationalRole === OperationalRole.OPERATOR,
    );

    expect(owner?.seedOperationalUserId).toBe('dddddddd-0000-0000-0000-000000000004');
    expect(operator?.seedOperationalUserId).toBe('eeeeeeee-0000-0000-0000-000000000005');
  });

  it('uses distinct cédula hashes for owner and operator fixtures', () => {
    expect(hashCedula('12345678')).not.toBe(hashCedula('87654321'));
  });

  it('does not embed secrets in fixture metadata', () => {
    for (const fixture of DEV_KNOWN_OPERATORS) {
      expect(fixture).not.toHaveProperty('passwordHash');
      expect(fixture).not.toHaveProperty('refreshToken');
      expect(fixture).not.toHaveProperty('pinHash');
    }
  });
});
