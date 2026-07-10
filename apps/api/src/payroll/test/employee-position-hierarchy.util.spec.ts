import { resolveSubordinatePositionIds } from '../utils/employee-position-hierarchy.util';
import { PrismaService } from '../../prisma/prisma.service';

describe('resolveSubordinatePositionIds', () => {
  const tenantId = 'tenant-1';

  function prismaWith(findMany: jest.Mock): PrismaService {
    return {
      employeePositionSupervisor: { findMany },
    } as unknown as PrismaService;
  }

  it('returns an empty array when the position has no subordinates', async () => {
    const findMany = jest.fn().mockResolvedValue([]);

    const result = await resolveSubordinatePositionIds(prismaWith(findMany), tenantId, 'pos-1');

    expect(result).toEqual([]);
  });

  it('resolves subordinates transitively, level by level', async () => {
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([{ positionId: 'pos-child' }])
      .mockResolvedValueOnce([{ positionId: 'pos-grandchild' }])
      .mockResolvedValueOnce([]);

    const result = await resolveSubordinatePositionIds(prismaWith(findMany), tenantId, 'pos-1');

    expect(result).toEqual(['pos-child', 'pos-grandchild']);
    expect(findMany).toHaveBeenNthCalledWith(1, {
      where: { tenantId, supervisorPositionId: { in: ['pos-1'] } },
      select: { positionId: true },
    });
  });

  it('terminates and does not loop forever when the data already contains a cycle', async () => {
    // pos-1 -> pos-a -> pos-b -> pos-1 (ciclo pre-existente en los datos, nunca debería
    // poder crearse vía API una vez validado el servicio, pero el BFS debe ser robusto igual).
    const findMany = jest
      .fn()
      .mockResolvedValueOnce([{ positionId: 'pos-a' }])
      .mockResolvedValueOnce([{ positionId: 'pos-b' }])
      .mockResolvedValueOnce([{ positionId: 'pos-1' }]);

    const result = await resolveSubordinatePositionIds(prismaWith(findMany), tenantId, 'pos-1');

    expect(result.sort()).toEqual(['pos-a', 'pos-b']);
    expect(findMany).toHaveBeenCalledTimes(3);
  });
});
