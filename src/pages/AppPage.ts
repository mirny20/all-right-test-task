import { expect, type Locator, type Page } from '@playwright/test';
import { HeaderComponent } from './components/HeaderComponent';

/** Base for every logged-in page: header and the `title` heading. */
export abstract class AppPage {
  readonly header: HeaderComponent;
  readonly title: Locator;

  protected abstract readonly path: string;
  protected abstract readonly titleText: string;

  constructor(protected readonly page: Page) {
    this.header = new HeaderComponent(page);
    this.title = page.getByTestId('title');
  }

  /** Navigates only; call `waitForLoaded()` when the page is expected to open. */
  async goto(): Promise<void> {
    await this.page.goto(this.path);
  }

  /** Readiness check (allowed in POM): the page's own title is shown. */
  async waitForLoaded(): Promise<void> {
    await expect(this.title).toHaveText(this.titleText);
  }
}
