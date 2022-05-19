import { test } from '../playwright/test';

test('Sign in with GitHub', async ({ app, page }) => {
  await page.locator('text=Setup Git Sync').click();
  await page.locator('button:has-text("Repository Settings")').click();

  await page.locator('li[role="tab"]:has-text("GitHub")').click();

  // Prevent the app from opening the browser to the authorization page
  // and return the url that would be created by following the GitHub OAuth flow.
  // https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps#web-application-flow
  const fakeGitHubOAuthWebFlow = app.evaluate(electron => {
    return new Promise<{ redirectUrl: string }>(resolve => {
      const webContents = electron.BrowserWindow.getAllWindows()[0].webContents;
      // Remove all navigation listeners so that only the one we inject will run
      webContents.removeAllListeners('will-navigate');
      webContents.on('will-navigate', (e, url) => {
        e.preventDefault();
        const parsedUrl = new URL(url);
        // We use the same state parameter that the app created to assert that we prevent CSRF
        const stateSearchParam = parsedUrl.searchParams.get('state') || '';
        const redirectUrl = `insomnia://oauth/github/authenticate?state=${stateSearchParam}&code=12345`;
        resolve({ redirectUrl });
      });
    });
  });

  const [{ redirectUrl }] = await Promise.all([
    fakeGitHubOAuthWebFlow,
    page.locator('text=Authenticate with GitHub').click({
      // When playwright clicks a link it waits for navigation to finish.
      // In our case we are stubbing the navigation and we don't want to wait for it.
      noWaitAfter: true,
    }),
  ]);

  await page.locator('input[name="link"]').click();

  await page.locator('input[name="link"]').fill(redirectUrl);

  await page.locator('button[name="add-token"]').click();

  await page
    .locator('input[name="uri"]')
    .fill('https://github.com/insomnia/example-repo');

  await page.locator('data-testid=git-repository-settings-modal__sync-btn').click();
});
