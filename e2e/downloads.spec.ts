import { test, expect } from "./fixtures/base";
import * as fs from "fs";

test.describe("Export downloads", () => {
  test.beforeEach(async ({ navigateTo, page }) => {
    await navigateTo("/generators/user-profile");
    // Generate data so export controls appear
    await page.getByRole("button", { name: "Generate" }).click();
    await expect(
      page.getByRole("table", { name: "Generated test data" })
    ).toBeVisible();
  });

  test("JSON export downloads a valid file", async ({
    page,
    captureDownload,
  }) => {
    const download = await captureDownload(async () => {
      // Open the export dropdown and click JSON
      await page.getByRole("button", { name: "Export" }).click();
      await page.getByRole("menuitem", { name: "JSON" }).click();
    });

    // Verify filename and extension
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.json$/);

    // Save and verify content
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const content = fs.readFileSync(filePath!, "utf-8");
    expect(content.length).toBeGreaterThan(0);

    // Verify content is valid JSON
    const parsed = JSON.parse(content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThan(0);
  });

  test("CSV export downloads a valid file", async ({
    page,
    captureDownload,
  }) => {
    const download = await captureDownload(async () => {
      // Open the export dropdown and click CSV
      await page.getByRole("button", { name: "Export" }).click();
      await page.getByRole("menuitem", { name: "CSV" }).click();
    });

    // Verify filename and extension
    const filename = download.suggestedFilename();
    expect(filename).toMatch(/\.csv$/);

    // Save and verify content
    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const content = fs.readFileSync(filePath!, "utf-8");
    expect(content.length).toBeGreaterThan(0);

    // Verify CSV has headers in the first line
    const lines = content.trim().split("\n");
    expect(lines.length).toBeGreaterThan(1);
    // First line should contain header fields
    const headers = lines[0];
    expect(headers).toBeTruthy();
    // CSV should contain at least one comma-separated header
    expect(headers).toContain(",");
  });
});
