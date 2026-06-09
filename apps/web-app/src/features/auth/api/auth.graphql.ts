export const LOGIN_MUTATION = `
  mutation Login($input: GlobalLoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
    }
  }
`;

export const SIGNUP_MUTATION = `
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      accessToken
      refreshToken
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
