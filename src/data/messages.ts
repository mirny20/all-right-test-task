/** User-visible error texts on saucedemo (verified live 2026-11-25). */
export const loginErrors = {
  wrongCredentials: 'Epic sadface: Username and password do not match any user in this service',
} as const;

export const checkoutErrors = {
  firstNameRequired: 'Error: First Name is required',
  lastNameRequired: 'Error: Last Name is required',
  postalCodeRequired: 'Error: Postal Code is required',
} as const;
