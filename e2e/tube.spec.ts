import { expect, test } from '@playwright/test';
import { open } from './helpers.ts';

// YouTube is faked (fake-youtube.ts): any @handle is a channel with three videos
// a page, made up from its name.

test('a grown-up adds a channel and the kids can watch it', async ({ page, browser }) => {
	await open(page, '/parent');
	await page.getByLabel('Channel').fill('@bluey');
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	await expect(page.getByRole('status')).toHaveText('Added Bluey.');
	await expect(page.getByText('3 videos, fetching older ones…')).toBeVisible();

	// The kids' side needs no sign-in.
	const kids = await browser.newPage({ storageState: { cookies: [], origins: [] } });
	await open(kids, '/');
	await kids.getByRole('link', { name: 'Bluey' }).click();
	await expect(kids.getByRole('heading', { name: 'Bluey' })).toBeVisible();
	await expect(kids.locator('.videos li')).toHaveCount(3);
	await kids.getByRole('link', { name: /bluey episode 9/ }).click();
	await expect(kids.getByRole('heading', { name: 'bluey episode 9' })).toBeVisible();
	await expect(kids.locator('iframe')).toHaveAttribute(
		'src',
		/youtube-nocookie\.com\/embed\/.*controls=0/
	);
	await kids.getByRole('link', { name: 'Back to Bluey' }).click();
	await expect(kids).toHaveURL(/\/c\//);
	await kids.close();

	// And removes it again.
	page.once('dialog', (d) => d.accept());
	await page.getByRole('button', { name: 'Remove' }).click();
	await expect(page.getByText('None yet')).toBeVisible();
});

test('a name searches, and a result can be added', async ({ page }) => {
	await open(page, '/parent');
	await page.getByLabel('Channel').fill('Numberblocks');
	await page.getByRole('button', { name: 'Add', exact: true }).click();
	await page.locator('.results li').first().getByRole('button', { name: 'Add' }).click();
	await expect(page.getByRole('status')).toHaveText('Added Numberblocks.');

	page.once('dialog', (d) => d.accept());
	await page.getByRole('button', { name: 'Remove' }).click();
	await expect(page.getByText('None yet')).toBeVisible();
});

test('the grown-ups’ page needs a sign-in, and only allowed videos play', async ({ browser }) => {
	const kids = await browser.newPage({ storageState: { cookies: [], origins: [] } });
	await open(kids, '/');
	await kids.getByRole('link', { name: 'Grown-ups' }).click();
	await expect(kids).toHaveURL(/\/login\?next=%2Fparent/);
	await expect(kids.getByRole('heading', { name: 'Grown-ups only' })).toBeVisible();

	const res = await kids.goto('/v/dQw4w9WgXcQ');
	expect(res?.status()).toBe(404);
	await kids.close();
});
