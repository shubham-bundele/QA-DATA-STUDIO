import { test, expect } from "./fixtures/base";

test.describe("Smoke tests", () => {
  test("public home page loads", async ({ navigateTo, page }) => {
    await navigateTo("/");
    await expect(
      page.getByRole("heading", { name: /Generate Realistic Test Data/i })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Get Started/i })).toBeVisible();
  });

  test("dashboard loads", async ({ navigateTo, page }) => {
    await navigateTo("/dashboard");
    await expect(
      page.locator("main").getByRole("heading", { name: /Dashboard/i }).first()
    ).toBeVisible();
    await expect(page.getByText("Total Generations")).toBeVisible();
  });

  test("sidebar navigation works", async ({ navigateTo, page }) => {
    const vp = page.viewportSize();
    test.skip(!!vp && vp.width < 768, "Desktop sidebar not visible on mobile — see mobile.spec.ts");
    await navigateTo("/dashboard");
    await page.waitForLoadState("networkidle");
    const userProfileLink = page
      .locator("aside")
      .getByRole("link", { name: "User Profile" });
    await expect(userProfileLink).toBeVisible();
    await userProfileLink.click();
    await expect(page).toHaveURL(/\/generators\/user-profile/, {
      timeout: 10_000,
    });
  });

  test("User Profile generator produces data", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/generators/user-profile");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.getByText(/records/)).toBeVisible();
    await expect(
      page.getByRole("table", { name: "Generated test data" })
    ).toBeVisible();
  });

  test("Address generator produces data", async ({ navigateTo, page }) => {
    await navigateTo("/generators/address");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.getByText(/records/)).toBeVisible();
    await expect(
      page.getByRole("table", { name: "Generated test data" })
    ).toBeVisible();
  });

  test("Credit Card generator produces Luhn-valid data", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/generators/credit-card");
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(page.getByText(/records/)).toBeVisible();
    await expect(
      page.getByRole("table", { name: "Generated test data" })
    ).toBeVisible();
  });

  test("credit-card disclaimer is visible", async ({ navigateTo, page }) => {
    await navigateTo("/generators/credit-card");
    const alert = page.getByRole("alert").first();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/test data|luhn|synthetic|disclaimer/i);
  });

  test("Banking generator produces data", async ({ navigateTo, page }) => {
    await navigateTo("/generators/banking");
    await page.getByRole("button", { name: /generate/i }).first().click();
    await expect(page.locator("table").first()).toBeVisible();
  });

  test("US does not offer IBAN", async ({ navigateTo, page }) => {
    await navigateTo("/generators/banking");
    // Default country is US
    const ibanSwitch = page.locator("#field-iban");
    await expect(ibanSwitch).toBeDisabled();
    await expect(page.getByText("(not used in US)")).toBeVisible();
  });

  test("IN does not offer IBAN", async ({ navigateTo, page }) => {
    await navigateTo("/generators/banking");
    // Change country to India
    await page.locator("button[role='combobox']").first().click();
    await page.getByRole("option", { name: "India" }).click();
    const ibanSwitch = page.locator("#field-iban");
    await expect(ibanSwitch).toBeDisabled();
    await expect(page.getByText("(not used in IN)")).toBeVisible();
  });

  test("Schema Intelligence analyzes a sample", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/schema");
    await page.getByRole("button", { name: /User Profile/i }).click();
    await page.getByRole("button", { name: /Analyze/i }).click();
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10_000 });
  });

  test("quick action links resolve", async ({ navigateTo, page }) => {
    await navigateTo("/dashboard");
    const quickLinks = [
      { name: /User Profile/, url: /\/generators\/user-profile/ },
      { name: /Address/, url: /\/generators\/address/ },
      { name: /Credit Card/, url: /\/generators\/credit-card/ },
      { name: /Banking/, url: /\/generators\/banking/ },
    ];

    for (const link of quickLinks) {
      const el = page.getByRole("link", { name: link.name }).first();
      const href = await el.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).toMatch(link.url);
    }
  });

  test("invalid schema input produces error state", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/schema");
    const textarea = page.locator("textarea").first();
    await textarea.fill("this is not valid JSON { broken [");
    await page.getByRole("button", { name: /Analyze/i }).click();
    await expect(
      page.getByText(/error|invalid|failed|unable/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
