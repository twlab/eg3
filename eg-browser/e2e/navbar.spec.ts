/**
 * Navbar behaviour: tab panels, the region control, dark mode, the screenshot
 * app, adding a genome-align track, and the dev track harness.
 */
import { test, expect, waitForTracksSettled } from "./fixtures";

const START_REGION = "chr7:27053397-27373765";

test.beforeEach(async ({ eg }) => {
  await eg.newSession({ genome: "hg38", region: START_REGION });
});

test.describe("tab panels", () => {
  const tabs = ["Tracks", "Apps", "Share", "Settings", "Help"];

  for (const tab of tabs) {
    test(`the ${tab} tab opens and closes`, async ({ page }) => {
      const button = page.getByRole("button", { name: tab, exact: true });

      await button.click();
      // The panel renders its title in a resizable panel header.
      await expect(page.getByText(tab.toLowerCase(), { exact: false }).first())
        .toBeVisible();

      // Clicking the active tab again dismisses it.
      await button.click();
      await expect(page.getByTestId("track-harness")).toHaveCount(0);
    });
  }
});

test.describe("region control", () => {
  test("the navbar shows the current region", async ({ page, eg }) => {
    const parts = await eg.regionParts();
    const label = page.getByRole("button", { name: /^chr\d+:/ });
    await expect(label).toBeVisible();

    const text = await label.textContent();
    expect(text).toContain(parts!.chr);
  });

  test("the region label follows a programmatic jump", async ({ page, eg }) => {
    await eg.goTo("chr3:63836292-64336395");

    await expect(page.getByRole("button", { name: /^chr3:/ })).toBeVisible();
  });

  test("clicking the region label opens the regions panel", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /^chr\d+:/ }).click();
    await expect(page.getByText(/region/i).first()).toBeVisible();
  });
});

test.describe("dark mode", () => {
  test("the switch toggles the persisted theme", async ({ page }) => {
    const readTheme = () =>
      page.evaluate(() => (window as any).__EG__.state().settings.darkTheme);

    const before = await readTheme();
    const toggle = page.getByRole("switch", { name: "Dark mode" });

    await toggle.click();
    await expect.poll(readTheme).toBe(!before);
    await expect(toggle).toHaveAttribute("aria-checked", String(!before));

    // And back again, so a stuck-on toggle would still fail.
    await toggle.click();
    await expect.poll(readTheme).toBe(before);
  });
});

test.describe("apps", () => {
  // The screenshot app asks the track container for its current data on mount.
  // If the container has not published yet it renders "No tracks in view" and
  // does not retry on its own — the user has to hit retake. So wait for the
  // tracks to settle first, the way a person would, and give the capture room
  // on a loaded machine.
  test("the screenshot app opens and captures the view", async ({ page }) => {
    await waitForTracksSettled(page);

    await page.getByRole("button", { name: "Apps", exact: true }).click();

    // Wait for the panel before clicking into it — under load the click would
    // otherwise land before the destination list has rendered.
    const link = page.getByText("Screenshot", { exact: false }).first();
    await expect(link).toBeVisible();
    await link.click();

    const app = page.getByTestId("screenshot-app");
    await expect(app).toBeVisible({ timeout: 30_000 });

    // With tracks in the session it must actually capture, not fall back to
    // the empty state.
    await expect(app).toHaveAttribute("data-screenshot-state", "captured", {
      timeout: 60_000,
    });
    await expect(app.locator("svg").first()).toBeVisible();
  });

  test("the track harness lists catalog examples", async ({ page }) => {
    await page.getByRole("button", { name: "Apps", exact: true }).click();
    await page.getByText("Track Harness", { exact: false }).first().click();

    const harness = page.getByTestId("track-harness");
    await expect(harness).toBeVisible();
    await expect(page.getByTestId("harness-example-bigwig")).toBeVisible();
  });

  test("loading an example through the harness adds a track", async ({
    page,
    eg,
  }) => {
    const before = await eg.trackCount();

    await page.getByRole("button", { name: "Apps", exact: true }).click();
    await page.getByText("Track Harness", { exact: false }).first().click();
    await page.getByTestId("harness-load-bigwig").click();

    await expect.poll(async () => eg.trackCount()).toBe(before + 1);
    expect(await eg.trackNames()).toContain("example bigwig");
  });

  test("the harness jumps to an example region", async ({ page, eg }) => {
    await page.getByRole("button", { name: "Apps", exact: true }).click();
    await page.getByText("Track Harness", { exact: false }).first().click();
    await page.getByTestId("harness-region-hg38-broken-area").click();

    await expect
      .poll(async () => (await eg.regionParts())!.start)
      .toBe(27212313);
  });
});

test.describe("genome align tracks", () => {
  test("adding a genomealign track registers a query genome", async ({
    eg,
  }) => {
    await eg.addTracks([
      {
        name: "hg38tomm10",
        label: "Query mouse mm10 to hg38 blastz",
        type: "genomealign",
        querygenome: "mm10",
        filetype: "genomealign",
        url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
      },
    ]);

    await expect.poll(async () => eg.trackNames()).toContain("hg38tomm10");
  });

  test("the view still navigates with an alignment track present", async ({
    eg,
  }) => {
    await eg.addTracks([
      {
        name: "hg38tomm10",
        type: "genomealign",
        querygenome: "mm10",
        filetype: "genomealign",
        url: "https://vizhub.wustl.edu/public/hg38/weaver/hg38_mm10_axt.gz",
      },
    ]);

    await eg.goTo("chr7:27100000-27200000");
    await expect.poll(async () => (await eg.regionParts())!.start).toBe(27100000);
  });
});

test.describe("session lifecycle", () => {
  test("the back control returns to the genome picker", async ({
    page,
    eg,
  }) => {
    await expect.poll(async () => eg.region()).not.toBeNull();

    // The logo doubles as "leave this session".
    await page.locator("img[alt='']").first().click();

    await expect
      .poll(() =>
        page.evaluate(() => (window as any).__EG__.session() === null),
      )
      .toBe(true);
  });
});
