import type { Locator, Page } from '@playwright/test';
import { AppPage } from './AppPage';

export class CheckoutCompletePage extends AppPage {
  protected override readonly path = '/checkout-complete.html';
  protected override readonly titleText = 'Checkout: Complete!';

  readonly completeHeader: Locator;
  readonly completeText: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.completeHeader = page.getByTestId('complete-header');
    this.completeText = page.getByTestId('complete-text');
    this.backHomeButton = page.getByTestId('back-to-products');
  }

  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }
}
