export interface Product {
  name: string;
  price: number;
}

/** saucedemo catalog as shown to standard_user (verified live 2026-11-25). */
export const products = {
  backpack: { name: 'Sauce Labs Backpack', price: 29.99 },
  bikeLight: { name: 'Sauce Labs Bike Light', price: 9.99 },
  boltTShirt: { name: 'Sauce Labs Bolt T-Shirt', price: 15.99 },
  fleeceJacket: { name: 'Sauce Labs Fleece Jacket', price: 49.99 },
  onesie: { name: 'Sauce Labs Onesie', price: 7.99 },
  redTShirt: { name: 'Test.allTheThings() T-Shirt (Red)', price: 15.99 },
} as const satisfies Record<string, Product>;

export const allProducts: readonly Product[] = Object.values(products);

/** Tax on the checkout overview: 8% of the item total, rounded to cents (verified live). */
export const TAX_RATE = 0.08;

/** Sort option values of `product-sort-container`. */
export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/** Sort option → label shown in `active-option`. */
export const sortLabels: Record<SortOption, string> = {
  az: 'Name (A to Z)',
  za: 'Name (Z to A)',
  lohi: 'Price (low to high)',
  hilo: 'Price (high to low)',
};

/** `29.99` → `$29.99`, as shown on item cards and checkout totals. */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}

/** Expected overview totals, computed in cents to avoid float drift. */
export function orderTotals(items: readonly Product[]): OrderTotals {
  const subtotalCents = items.reduce((sum, item) => sum + Math.round(item.price * 100), 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  return {
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    total: (subtotalCents + taxCents) / 100,
  };
}
