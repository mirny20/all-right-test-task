import type { Locator, Page } from '@playwright/test';
import type { SortOption } from '@src/data/products';
import { AppPage } from './AppPage';
import { ItemListComponent } from './components/ItemListComponent';

export class InventoryPage extends AppPage {
  protected override readonly path = '/inventory.html';
  protected override readonly titleText = 'Products';

  readonly inventoryList: Locator;
  readonly products: ItemListComponent;
  readonly sortSelect: Locator;
  /** Label of the currently selected sort option, e.g. "Price (low to high)". */
  readonly activeSort: Locator;

  constructor(page: Page) {
    super(page);
    this.inventoryList = page.getByTestId('inventory-list');
    this.products = new ItemListComponent(page);
    this.sortSelect = page.getByTestId('product-sort-container');
    this.activeSort = page.getByTestId('active-option');
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  async addToCart(...names: string[]): Promise<void> {
    for (const name of names) {
      await this.products.addToCart(name);
    }
  }

  async removeFromCart(name: string): Promise<void> {
    await this.products.remove(name);
  }
}
