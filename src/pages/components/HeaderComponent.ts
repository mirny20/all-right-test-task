import type { Locator, Page } from '@playwright/test';

/** Primary header shared by all logged-in pages: cart link + badge. */
export class HeaderComponent {
  readonly cartLink: Locator;
  /** Only rendered when the cart has at least one item. */
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }
}
