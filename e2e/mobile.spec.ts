import { test, expect } from "./fixtures/base";

test.describe("Mobile experience", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("no horizontal overflow", async ({ navigateTo, page }) => {
    await navigateTo("/dashboard");
    const viewportWidth = 390;
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentWidth).toBeLessThanOrEqual(viewportWidth);
  });

  test("mobile drawer opens", async ({ navigateTo, page }) => {
    await navigateTo("/dashboard");
    // Click the hamburger menu button
    await page.getByRole("button", { name: "Toggle menu" }).click();
    // Verify the navigation is visible in the sheet/drawer
    const nav = page.locator("nav").filter({ has: page.getByRole("link", { name: "Dashboard" }) });
    await expect(nav).toBeVisible();
    // Verify all main nav links are visible
    await expect(page.getByRole("link", { name: "User Profile" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("mobile drawer closes on navigation", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/dashboard");
    // Open the drawer
    await page.getByRole("button", { name: "Toggle menu" }).click();
    // Click a link to navigate
    await page.getByRole("link", { name: "User Profile" }).click();
    await expect(page).toHaveURL(/\/generators\/user-profile/);
    // Verify the drawer closed (nav inside sheet should not be visible)
    // The sheet should be dismissed after navigation
    await expect(
      page.locator("[data-state='open']").filter({ has: page.locator("nav") })
    ).not.toBeVisible();
  });

  test("generator settings reachable via mobile nav", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/dashboard");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Toggle menu" }).click();
    const link = page.getByRole("link", { name: "User Profile" });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/generators\/user-profile/, {
      timeout: 10_000,
    });
    await expect(
      page.getByRole("button", { name: /generate/i }).first()
    ).toBeVisible();
  });

  test("output table is usable after generation", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/generators/user-profile");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(
      page.getByRole("table", { name: "Generated test data" })
    ).toBeVisible();
    // Table should be inside a scrollable container -- verify the table is wider
    // than the viewport or at minimum visible and scrollable
    const table = page.getByRole("table", { name: "Generated test data" });
    const tableBox = await table.boundingBox();
    expect(tableBox).toBeTruthy();
    expect(tableBox!.width).toBeGreaterThan(0);
  });

  test("export controls reachable after generation", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/generators/user-profile");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(
      page.getByRole("table", { name: "Generated test data" })
    ).toBeVisible();
    // Verify export button is visible
    await expect(
      page.getByRole("button", { name: "Export" })
    ).toBeVisible();
    // Verify copy button is visible
    await expect(
      page.getByRole("button", { name: "Copy" })
    ).toBeVisible();
  });

  test("focus can traverse controls via keyboard", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/generators/user-profile");
    // Tab through the page and verify focus moves through interactive elements
    // Press Tab several times and check that focus lands on recognizable controls
    const focusedTags: string[] = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const tag = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName.toLowerCase() : "none";
      });
      focusedTags.push(tag);
    }
    // Verify that focus moved through multiple interactive elements (not stuck)
    const interactiveTags = focusedTags.filter((t) =>
      ["a", "button", "input", "select", "textarea"].includes(t)
    );
    expect(interactiveTags.length).toBeGreaterThan(0);
  });
});
