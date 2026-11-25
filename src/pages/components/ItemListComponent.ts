import type { Locator, Page } from '@playwright/test';

/** Matches the whole text exactly; product names contain regex characters, e.g. `Test.allTheThings() T-Shirt (Red)`. */
function exactText(text: string): RegExp {
  return new RegExp(`^${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}

/**
 * List of `inventory-item` cards, shared by the inventory, cart and checkout overview pages.
 * Items are always located by product name, never by index.
 */
export class ItemListComponent {
  readonly items: Locator;
  readonly names: Locator;
  readonly prices: Locator;

  constructor(private readonly page: Page) {
    this.items = page.getByTestId('inventory-item');
    this.names = page.getByTestId('inventory-item-name');
    this.prices = page.getByTestId('inventory-item-price');
  }

  item(name: string): Locator {
    return this.items.filter({
      has: this.page.getByTestId('inventory-item-name').filter({ hasText: exactText(name) }),
    });
  }

  /**
   * The add/remove button of an item. Matched by exact name because the item's image and
   * title links also have role "button" ("View details for …").
   */
  cartButton(name: string): Locator {
    return this.item(name).getByRole('button', { name: /^(Add to cart|Remove)$/ });
  }

  price(name: string): Locator {
    return this.item(name).getByTestId('inventory-item-price');
  }

  /** Cart and overview only. */
  quantity(name: string): Locator {
    return this.item(name).getByTestId('item-quantity');
  }

  async addToCart(name: string): Promise<void> {
    await this.item(name).getByRole('button', { name: 'Add to cart' }).click();
  }

  async remove(name: string): Promise<void> {
    await this.item(name).getByRole('button', { name: 'Remove' }).click();
  }

  async getNames(): Promise<string[]> {
    return this.names.allTextContents();
  }

  /** Prices as numbers, in display order (`$29.99` → 29.99). */
  async getPrices(): Promise<number[]> {
    const texts = await this.prices.allTextContents();
    return texts.map((text) => Number(text.replace('$', '')));
  }
}
