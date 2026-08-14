import { test, expect } from "./fixtures/base";

test.describe("Accessibility", () => {
  test("skip-to-content link exists and targets main", async ({
    navigateTo,
    page,
  }) => {
    await navigateTo("/dashboard");
    const skipLink = page.getByRole("link", { name: /skip to main/i });
    await expect(skipLink).toBeAttached();
    const href = await skipLink.getAttribute("href");
    expect(href).toBe("#main-content");
    await expect(page.locator("#main-content")).toBeAttached();
  });

  test.describe("Axe-Core scans", () => {
    const routes = [
      { name: "Landing page", path: "/" },
      { name: "Dashboard", path: "/dashboard" },
      { name: "User Profile generator", path: "/generators/user-profile" },
      { name: "Address generator", path: "/generators/address" },
      { name: "Credit Card generator", path: "/generators/credit-card" },
      { name: "Banking generator", path: "/generators/banking" },
      { name: "Schema Intelligence", path: "/schema" },
      { name: "Settings", path: "/settings" },
    ];

    for (const route of routes) {
      test(`${route.name} (${route.path}) has no critical or serious violations`, async ({
        navigateTo,
        axeScan,
      }) => {
        await navigateTo(route.path);
        const results = await axeScan();

        // Separate violations by impact
        const critical = results.violations.filter(
          (v) => v.impact === "critical"
        );
        const serious = results.violations.filter(
          (v) => v.impact === "serious"
        );
        const moderate = results.violations.filter(
          (v) => v.impact === "moderate"
        );
        const minor = results.violations.filter((v) => v.impact === "minor");

        // Log moderate and minor violations without failing
        if (moderate.length > 0) {
          console.log(
            `[${route.name}] ${moderate.length} moderate violations:`,
            moderate.map((v) => `${v.id}: ${v.description}`).join("; ")
          );
        }
        if (minor.length > 0) {
          console.log(
            `[${route.name}] ${minor.length} minor violations:`,
            minor.map((v) => `${v.id}: ${v.description}`).join("; ")
          );
        }

        // Fail only on critical and serious violations
        expect(critical, `Critical violations on ${route.path}`).toHaveLength(
          0
        );
        expect(serious, `Serious violations on ${route.path}`).toHaveLength(0);
      });
    }
  });
});
