import { test, expect } from '@playwright/test';

test.describe('Parliament Explorer - Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to different sections
    await page.click('text=Debates');
    await expect(page).toHaveURL(/.*debates/);
    
    await page.click('text=Analytics');
    await expect(page).toHaveURL(/.*analytics/);
    
    await page.click('text=Officials');
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

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to debates
    await page.click('text=Debates');
    await expect(page).toHaveURL(/.*debates/);
    
    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL('/');
    
    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/.*debates/);
  });
});