export const MARCACIONES_POR_EMPLEADO_QUERY = `
  query MarcacionesPorEmpleado($input: MarcacionesPorEmpleadoInput!) {
    marcacionesPorEmpleado(input: $input) {
      edges {
        cursor
        node {
          id
          employeeId
          eventType
          status
          timestamp
          workDate
          distanceMeters
          rejectionReason
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;
