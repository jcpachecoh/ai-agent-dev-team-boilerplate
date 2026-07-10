import type { PrismaService } from '../../prisma/prisma.service';

/**
 * OS-633 — extraída de `attendance-collaborators.repository.ts` y `vacations.repository.ts`
 * (OS-550), que implementaban el mismo BFS de forma independiente. Única fuente de la
 * traversal sobre `EmployeePositionSupervisor` (tabla puente Cargo → Cargo supervisor).
 *
 * BFS nivel por nivel (una query por nivel de profundidad, no por nodo) en vez de un CTE
 * recursivo en SQL: el modelo no valida ciclos a nivel de BD, y un `WITH RECURSIVE` sin
 * guarda de ciclo puede loopear indefinidamente si alguna vez se crea uno por error. El
 * `Set` de visitados corta cualquier ciclo en la primera repetición.
 */
export async function resolveSubordinatePositionIds(
  prisma: PrismaService,
  tenantId: string,
  supervisorPositionId: string,
): Promise<string[]> {
  const visited = new Set<string>([supervisorPositionId]);
  const result = new Set<string>();
  let frontier = [supervisorPositionId];

  while (frontier.length > 0) {
    const rows = await prisma.employeePositionSupervisor.findMany({
      where: { tenantId, supervisorPositionId: { in: frontier } },
      select: { positionId: true },
    });

    const nextFrontier: string[] = [];
    for (const row of rows) {
      if (!visited.has(row.positionId)) {
        visited.add(row.positionId);
        result.add(row.positionId);
        nextFrontier.push(row.positionId);
      }
    }
    frontier = nextFrontier;
  }

  return [...result];
}
