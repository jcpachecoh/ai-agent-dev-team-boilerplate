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

const ME_PROFILE_FIELDS = `
  id
  tenantId
  email
  cedula
  documentType
  emailVerified
  isActive
  roleCode
  createdAt
`;

export const ME_QUERY = `
  query Me {
    me {
      ${ME_PROFILE_FIELDS}
      name
    }
  }
`;

/** Compatible con APIs que aún no exponen AuthUserProfile.name en GraphQL. */
export const ME_QUERY_LEGACY = `
  query Me {
    me {
      ${ME_PROFILE_FIELDS}
    }
  }
`;

export const ADMIN_USER_NAME_QUERY = `
  query AdminUserName($id: ID!) {
    adminUser(id: $id) {
      name
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
