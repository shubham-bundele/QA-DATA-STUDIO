/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

type AppFixtures = {
  /** Navigate to a route and wait for the page to be interactive */
  navigateTo: (path: string) => Promise<void>;
  /** Clear IndexedDB and localStorage before the test */
  cleanStorage: () => Promise<void>;
  /** Run an Axe-Core accessibility scan on the current page */
  axeScan: () => Promise<import("axe-core").AxeResults>;
  /** Wait for a download triggered by a callback, return the download */
  captureDownload: (
    trigger: () => Promise<void>
  ) => Promise<import("@playwright/test").Download>;
};

export const test = base.extend<AppFixtures>({
  navigateTo: async ({ page }, use) => {
    const navigateTo = async (path: string) => {
      await page.goto(path, { waitUntil: "networkidle" });
    };
    await use(navigateTo);
  },

  cleanStorage: async ({ page }, use) => {
    const cleanStorage = async () => {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      await page.evaluate(async () => {
        const dbs = await indexedDB.databases();
        for (const db of dbs) {
          if (db.name) indexedDB.deleteDatabase(db.name);
        }
      });
    };
    await use(cleanStorage);
  },

  axeScan: async ({ page }, use) => {
    const axeScan = async () => {
      return new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
    };
    await use(axeScan);
  },

  captureDownload: async ({ page }, use) => {
    const captureDownload = async (trigger: () => Promise<void>) => {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        trigger(),
      ]);
      return download;
    };
    await use(captureDownload);
  },
});

export { expect };
