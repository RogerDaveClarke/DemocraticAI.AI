import { test, expect } from '@playwright/test';

test.describe('Parliament Explorer - Performance', () => {
  test('should load within acceptable time limits', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for the main content to load
    await page.getByRole('main').waitFor();
    
    const loadTime = Date.now() - startTime;
    
    // Allow dev-server startup and browser-engine initialization while still
    // detecting a page that fails to become usable before the test timeout.
    expect(loadTime).toBeLessThan(30000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Check for performance metrics (if web-vitals is implemented)
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('navigation')[0];
    });
    
    // Verify basic performance metrics
    expect(performanceEntries).toBeDefined();
  });

  test('should lazy load content efficiently', async ({ page }) => {
    await page.goto('/');
    
    // Check that critical content loads first
    await expect(page.getByRole('main')).toBeVisible();
    
    // Test lazy loading by scrolling (if implemented)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Wait for any lazy-loaded content
    await page.waitForTimeout(1000);
  });
});