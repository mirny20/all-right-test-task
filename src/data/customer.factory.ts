export interface Customer {
  firstName: string;
  lastName: string;
  postalCode: string;
}

/** Valid checkout info; override any field per test (e.g. `{ lastName: '' }`). */
export function buildCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    firstName: 'Jane',
    lastName: 'Doe',
    postalCode: '12345',
    ...overrides,
  };
}
