export const KIOSK_AUTH_MUTATION = `
  mutation KioskAuth($input: KioskAuthInput!) {
    kioskAuth(input: $input) {
      userId
      fullName
      locationId
      employeeId
      accessToken
      refreshToken
    }
  }
`;
