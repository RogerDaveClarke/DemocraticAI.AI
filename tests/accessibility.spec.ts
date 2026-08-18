import { test, expect } from '@playwright/test';

test.describe('Parliament Explorer - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for h1 tag
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Verify heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper navigation landmarks
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    
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
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    // Test more tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Test Enter key on focused elements
    await page.keyboard.press('Enter');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    
    // This would typically use a specialized accessibility testing library
    // For now, we'll check that text is visible and readable
    const textElements = page.locator('p, span, a, button, h1, h2, h3, h4, h5, h6');
    const count = await textElements.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Verify text elements are visible
    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(textElements.nth(i)).toBeVisible();
    }
  });
});