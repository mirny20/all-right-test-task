import type { Locator, Page } from '@playwright/test';
import { AppPage } from './AppPage';
import { ItemListComponent } from './components/ItemListComponent';

/** Checkout step two: order overview and totals. */
export class CheckoutOverviewPage extends AppPage {
  protected override readonly path = '/checkout-step-two.html';
  protected override readonly titleText = 'Checkout: Overview';

  readonly orderItems: ItemListComponent;
  /** "Item total: $39.98" */
  readonly subtotal: Locator;
  /** "Tax: $3.20" */
  readonly tax: Locator;
  /** "Total: $43.18" */
  readonly total: Locator;
  readonly finishButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.orderItems = new ItemListComponent(page);
    this.subtotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.finishButton = page.getByTestId('finish');
    this.cancelButton = page.getByTestId('cancel');
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }
}
