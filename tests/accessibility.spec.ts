import { test, expect } from '@playwright/test';

test.describe('Parliament Explorer - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1 tag
    const h1 = page.getByRole('main').locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();
    
    // Verify heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper navigation landmarks
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('main')).toBeVisible();
    
    // Check for proper button labeling
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasText = await button.textContent();
      
      // Each button should have either aria-label or visible text
      expect(hasAriaLabel || hasText?.trim()).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await skipLink.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('should render readable text content', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();

    const textElements = page.locator('p, span, a, button, h1, h2, h3, h4, h5, h6');
    const count = await textElements.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Verify text elements are visible
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(textElements.nth(i)).toBeVisible();
    }
  });
});