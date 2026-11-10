import { expect, test as setup } from '@playwright/test';

// Signs in once with the dev-only "Sign in as" button; the other tests reuse it.
setup('sign in', async ({ page }) => {
	await page.goto('/parent');
	await page.getByRole('button', { name: 'Sign in as Alex' }).click();
	// Longer than usual: the dev server builds the first page on demand.
	await expect(page.getByRole('heading', { name: 'Channels' })).toBeVisible({ timeout: 30_000 });
	await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
