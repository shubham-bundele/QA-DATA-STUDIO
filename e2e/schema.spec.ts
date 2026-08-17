import { test, expect } from "./fixtures/base";

test.describe("Schema Intelligence", () => {
  test("analyzes a sample schema", async ({ navigateTo, page }) => {
    await navigateTo("/schema");
    await page.getByRole("button", { name: /User Profile/i }).click();
    await page.getByRole("button", { name: /Analyze/i }).click();
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10_000 });
  });

  test("generates positive data", async ({ navigateTo, page }) => {
    await navigateTo("/schema");
    await page.getByRole("button", { name: "User Profile" }).click();

    // Ensure only positive category is selected
    // All categories are selected by default, so deselect others
    await page.getByRole("button", { name: "Negative" }).click();
    await page.getByRole("button", { name: "Boundary" }).click();
    await page.getByRole("button", { name: "Security" }).click();

    await page.getByRole("button", { name: "Generate" }).click();

    // Verify the Generated Data tab appears
    await expect(
      page.getByRole("tab", { name: "Generated Data" })
    ).toBeVisible();
    // Verify the positive category sub-tab is shown with a count
    await expect(
      page.getByRole("button", { name: /Positive \(\d+\)/ })
    ).toBeVisible();
    // Verify a data table is rendered
    await expect(page.locator("table")).toBeVisible();
  });

  test("generates negative data", async ({ navigateTo, page }) => {
    await navigateTo("/schema");
    await page.getByRole("button", { name: "User Profile" }).click();

    // Select only negative category
    await page.getByRole("button", { name: "Positive" }).click();
    await page.getByRole("button", { name: "Boundary" }).click();
    await page.getByRole("button", { name: "Security" }).click();

    await page.getByRole("button", { name: "Generate" }).click();

    await expect(
      page.getByRole("tab", { name: "Generated Data" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Negative \(\d+\)/ })
    ).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("generates boundary data", async ({ navigateTo, page }) => {
    await navigateTo("/schema");
    await page.getByRole("button", { name: "User Profile" }).click();

    // Select only boundary category
    await page.getByRole("button", { name: "Positive" }).click();
    await page.getByRole("button", { name: "Negative" }).click();
    await page.getByRole("button", { name: "Security" }).click();

    await page.getByRole("button", { name: "Generate" }).click();

    await expect(
      page.getByRole("tab", { name: "Generated Data" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Boundary \(\d+\)/ })
    ).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("displays security warning for security category", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/schema");
    await page.getByRole("button", { name: /User Profile/i }).click();
    await page.getByRole("button", { name: /Generate/i }).click();

    const dataTab = page.getByRole("tab", { name: /Generated Data/i });
    await expect(dataTab).toBeVisible({ timeout: 15_000 });
    await dataTab.click();

    const securityBtn = page.getByRole("button", { name: /Security \(\d+\)/ });
    await expect(securityBtn).toBeVisible({ timeout: 20_000 });
    await securityBtn.scrollIntoViewIfNeeded();
    await securityBtn.click();

    const alert = page
      .getByRole("alert")
      .filter({ hasText: /Authorized Testing Only/i });
    await alert.scrollIntoViewIfNeeded();
    await expect(alert).toBeVisible({ timeout: 10_000 });
  });

  test("invalid schema input produces error", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/schema");
    const textarea = page.locator("textarea").first();
    await textarea.fill("{invalid json!!! broken[}");
    await page.getByRole("button", { name: /Analyze/i }).click();
    await expect(
      page.getByText(/error|invalid|failed|unable/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
