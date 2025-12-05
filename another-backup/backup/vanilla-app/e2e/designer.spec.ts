import { test, expect } from '@playwright/test';

test.describe('LayoutCraft Designer - Vanilla JS App', () => {
  test.beforeEach(async ({ page }) => {
    // Set a dummy token to bypass the initial auth check redirect
    await page.addInitScript(() => {
      window.localStorage.setItem('layoutcraft-token', 'dummy-token');
      window.localStorage.setItem('layoutcraft-token-expiry', String(Date.now() + 60 * 60 * 1000));
    });
    await page.goto('/app/');
  });

  test('Initial State: "Generate" button should be disabled', async ({ page }) => {
    const generateBtn = page.locator('#generate-btn');
    await expect(generateBtn).toBeDisabled();
  });

  test('Input Logic: Typing 10+ characters enables the "Generate" button', async ({ page }) => {
    const promptInput = page.locator('#prompt-input');
    const generateBtn = page.locator('#generate-btn');

    await promptInput.fill('A vibrant abstract poster');
    await expect(generateBtn).toBeEnabled();
  });

  test('Selection Logic: Selecting a dimension updates the button text', async ({ page }) => {
    const dimensionsDropdown = page.locator('.custom-dropdown .dropdown-toggle', { hasText: 'Dimensions' });
    await dimensionsDropdown.click();

    const socialPostOption = page.locator('.dropdown-item label', { hasText: 'Social Post' });
    await socialPostOption.click();

    await expect(dimensionsDropdown).toHaveText('Dimensions (2)');
  });

  test('State Persistence: Page reload retains the prompt', async ({ page, context }) => {
    const promptInput = page.locator('#prompt-input');
    await promptInput.fill('A test prompt');

    // Simulate page reload by creating a new page in the same context
    const newPage = await context.newPage();
    await newPage.goto('/app/');
    const newPromptInput = newPage.locator('#prompt-input');
    await expect(newPromptInput).toHaveValue(''); // Should be empty without sessionStorage

    // Now, set sessionStorage and reload
    await page.evaluate(() => {
      sessionStorage.setItem('layoutcraft_initial_data', JSON.stringify({ prompt: 'A persisted prompt' }));
    });

    await page.reload();
    await expect(promptInput).toHaveValue('A persisted prompt');
  });

  test('Auth Gate: Logged-out user is redirected', async ({ page, context }) => {
    // Clear localStorage to simulate being logged out
    await page.evaluate(() => {
      localStorage.removeItem('layoutcraft-token');
      localStorage.removeItem('layoutcraft-token-expiry');
    });

    await page.reload();

    // The user should be redirected to the homepage with an auth=required query parameter
    await expect(page).toHaveURL('/?auth=required');
  });
});
