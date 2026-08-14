import { test, expect } from "./fixtures/base";

test.describe("Persistence", () => {
  test("theme persists after reload", async ({ page, cleanStorage }) => {
    await page.goto("/settings", { waitUntil: "networkidle" });
    await cleanStorage();
    await page.reload({ waitUntil: "networkidle" });

    const darkBtn = page.getByRole("button", { name: "Dark" });
    await darkBtn.click();
    await expect(page.locator("html")).toHaveClass(/dark/);

    await page.reload({ waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveClass(/dark/);
  });

  test("settings persist after reload", async ({ page, cleanStorage }) => {
    await page.goto("/settings", { waitUntil: "networkidle" });
    await cleanStorage();
    await page.reload({ waitUntil: "networkidle" });

    const formatTrigger = page.locator("#export-format");
    if (await formatTrigger.isVisible()) {
      await formatTrigger.click();
      await page.getByRole("option", { name: "CSV" }).click();
    }

    const countInput = page.locator("#record-count");
    if (await countInput.isVisible()) {
      await countInput.fill("25");
      await countInput.press("Tab");
    }

    await page.reload({ waitUntil: "networkidle" });

    if (await formatTrigger.isVisible()) {
      await expect(formatTrigger).toContainText(/CSV/i);
    }
    if (await countInput.isVisible()) {
      await expect(countInput).toHaveValue("25");
    }
  });

  test("dashboard reads real history after generation", async ({
    page,
    cleanStorage,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await cleanStorage();

    await page.goto("/generators/user-profile", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /generate/i }).first().click();
    await expect(page.locator("table").first()).toBeVisible();

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await page.waitForLoadState("networkidle");
    const historyText = page.getByText(/user profile/i).first();
    await historyText.scrollIntoViewIfNeeded();
    await expect(historyText).toBeVisible({ timeout: 15_000 });
  });

  test("clear history removes saved history", async ({
    page,
    cleanStorage,
  }) => {
    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await cleanStorage();

    await page.goto("/generators/user-profile", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /generate/i }).first().click();
    await expect(page.locator("table").first()).toBeVisible();

    await page.goto("/settings", { waitUntil: "networkidle" });
    const clearBtn = page.getByRole("button", { name: /clear.*history/i });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }

    await page.goto("/dashboard", { waitUntil: "networkidle" });
    await expect(
      page.getByText(/no.*history/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });
});
