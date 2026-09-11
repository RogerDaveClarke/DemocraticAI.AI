import { test, expect } from '@playwright/test';

test.describe('Parliament Explorer - Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: /^Debates\b/ }).click();
    await expect(page).toHaveURL(/.*debates/);

    await page.getByRole('button', { name: /^Legislation\b/ }).click();
    await expect(page).toHaveURL(/.*statistics/);

    await page.getByRole('button', { name: /^Elected Officials\b/ }).click();
    await expect(page).toHaveURL(/.*officials/);
  });

  test('should maintain navigation state', async ({ page }) => {
    await page.goto('/debates');
    
    // Check that the active navigation item is highlighted
    const activeNavItem = page.locator('nav [aria-current="page"]').or(
      page.locator('nav .active')
    );
    await expect(activeNavItem).toBeVisible();
  });

  test('should replace legacy html URLs with clean routes', async ({ page }) => {
    await page.goto('/debates.html?source=legacy');

    await expect(page).toHaveURL(/\/debates\?source=legacy$/);
    await expect(page.locator('nav [aria-current="page"]')).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to debates
    await page.getByRole('button', { name: /^Debates\b/ }).click();
    await expect(page).toHaveURL(/.*debates/);
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/.*debates/);
  });
});