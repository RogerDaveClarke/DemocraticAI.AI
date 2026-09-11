import { test, expect } from '@playwright/test';

test.describe('Parliament Explorer - Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Democratic AI/i);
    
    // Check for key navigation elements
    await expect(page.locator('nav')).toBeVisible();
    
    // Verify main content is visible
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('should display navigation menu', async ({ page }) => {
    await page.goto('/');
    
    await expect(page.getByRole('button', { name: /^Debates\b/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Legislation\b/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Elected Officials\b/ })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.goto('/');
      
      // Check that content is visible on mobile
      await expect(page.getByRole('main')).toBeVisible();
      
      // Mobile navigation might be collapsed
      const mobileMenu = page.locator('[aria-label="Menu"]').or(page.locator('button:has-text("Menu")'));
      if (await mobileMenu.isVisible()) {
        await mobileMenu.click();
      }
    }
  });
});