/** User-visible error texts on saucedemo (verified live 2026-11-25). */
export const loginErrors = {
  wrongCredentials: 'Epic sadface: Username and password do not match any user in this service',
  lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
  usernameRequired: 'Epic sadface: Username is required',
  notLoggedIn: (path: string) =>
    `Epic sadface: You can only access '${path}' when you are logged in.`,
} as const;

export const checkoutErrors = {
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
} as const;
