import type { Locator, Page } from '@playwright/test';

/**
 * Side menu behind the burger button.
 * The open menu overlays the burger button, and "Reset App State" does not close it,
 * so every action here leaves the menu closed again.
 */
export class BurgerMenuComponent {
  // The `open-menu` data-test sits on the <img> inside the button; the button itself has an accessible name.
  readonly openButton: Locator;
  readonly closeButton: Locator;
  readonly allItemsLink: Locator;
  readonly logoutLink: Locator;
  readonly resetLink: Locator;

  constructor(page: Page) {
    this.openButton = page.getByRole('button', { name: 'Open Menu' });
    this.closeButton = page.getByRole('button', { name: 'Close Menu' });
    this.allItemsLink = page.getByTestId('inventory-sidebar-link');
    this.logoutLink = page.getByTestId('logout-sidebar-link');
    this.resetLink = page.getByTestId('reset-sidebar-link');
  }

  async open(): Promise<void> {
    await this.openButton.click();
    // Readiness only: the menu slides in, links are not clickable until visible.
    await this.logoutLink.waitFor({ state: 'visible' });
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.logoutLink.waitFor({ state: 'hidden' });
  }

  async logout(): Promise<void> {
    await this.open();
    await this.logoutLink.click();
  }

  async resetAppState(): Promise<void> {
    await this.open();
    await this.resetLink.click();
    await this.close();
  }
}
