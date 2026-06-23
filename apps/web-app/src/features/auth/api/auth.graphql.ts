export const LOGIN_MUTATION = `
  mutation Login($input: GlobalLoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      locationId
      requiresLocationSelection
      locations {
        id
        name
        code
        city
        address
      }
    }
  }
`;

export const SIGNUP_MUTATION = `
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      accessToken
      refreshToken
      locationId
      requiresLocationSelection
      locations {
        id
        name
        code
        city
        address
      }
    }
  }
`;

export const LOGOUT_MUTATION = `
  mutation Logout {
    logout
  }
`;

export const ME_QUERY = `
  query Me {
    me {
      id
      tenantId
      email
      cedula
      documentType
      emailVerified
      isActive
      roleCode
      createdAt
    }
  }
`;

export const MY_LOCATIONS_QUERY = `
  query MyLocations {
    myLocations {
      id
      name
      code
      city
      address
    }
  }
`;

export const RESET_PASSWORD_MUTATION = `
  mutation ResetPassword($input: ResetPasswordInput!) {
    resetPassword(input: $input) {
      message
    }
  }
`;

export const SELECT_USER_LOCATION_MUTATION = `
  mutation SelectUserLocation($input: SelectUserLocationInput!) {
    selectUserLocation(input: $input) {
      accessToken
      refreshToken
      locationId
      requiresLocationSelection
      locations {
        id
        name
        code
        city
        address
      }
    }
  }
`;
