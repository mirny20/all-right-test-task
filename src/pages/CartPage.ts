import type { Locator, Page } from '@playwright/test';
import { AppPage } from './AppPage';
import { ItemListComponent } from './components/ItemListComponent';

export class CartPage extends AppPage {
  protected override readonly path = '/cart.html';
  protected override readonly titleText = 'Your Cart';

  readonly cartItems: ItemListComponent;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    this.cartItems = new ItemListComponent(page);
    this.continueShoppingButton = page.getByTestId('continue-shopping');
    this.checkoutButton = page.getByTestId('checkout');
  }

  async removeItem(name: string): Promise<void> {
    await this.cartItems.remove(name);
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
