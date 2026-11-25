import type { Locator, Page } from '@playwright/test';
import type { Customer } from '@src/data/customer.factory';
import { AppPage } from './AppPage';

/** Checkout step one: customer information. */
export class CheckoutInfoPage extends AppPage {
  protected override readonly path = '/checkout-step-one.html';
  protected override readonly titleText = 'Checkout: Your Information';

  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly error: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByTestId('continue');
    this.cancelButton = page.getByTestId('cancel');
    this.error = page.getByTestId('error');
  }

  async fillInfo(customer: Customer): Promise<void> {
    await this.firstName.fill(customer.firstName);
    await this.lastName.fill(customer.lastName);
    await this.postalCode.fill(customer.postalCode);
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async submitInfo(customer: Customer): Promise<void> {
    await this.fillInfo(customer);
    await this.continue();
  }
}
