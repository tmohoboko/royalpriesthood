import { test, expect } from "@playwright/test";
async function addToCart(page) {
  await page.goto("/shop");
  await page.getByLabel("Search products").fill("Black");
  await page
    .getByRole("heading", { name: "Black Signature Tee — Front", exact: true })
    .getByRole("link")
    .click();
  await page
    .getByLabel("Variant for Black Signature Tee — Front")
    .selectOption("test-black-l");
  await page.getByRole("button", { name: "Add to cart", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Added");
  await page.goto("/shop/cart");
  await page.getByLabel("Quantity for Black Signature Tee — Front").fill("2");
  await expect(
    page.getByLabel("Quantity for Black Signature Tee — Front"),
  ).toHaveValue("2");
  await page.reload();
  await expect(
    page.getByLabel("Quantity for Black Signature Tee — Front"),
  ).toHaveValue("2");
}
async function register(page) {
  await page.getByRole("link", { name: "Proceed to checkout" }).click();
  await page
    .getByRole("button", { name: "Create an account", exact: true })
    .click();
  await page.getByLabel("Name", { exact: true }).fill("Browser Customer");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`browser-${crypto.randomUUID()}@example.invalid`);
  await page
    .getByLabel("Password (12 characters minimum)")
    .fill("Browser-test-password-123");
  await page.getByRole("button", { name: "Register", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Checkout", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Recipient name")).toBeVisible();
}
async function delivery(page) {
  await page.getByLabel("Recipient name").fill("Browser Customer");
  await page.getByLabel("Phone", { exact: true }).fill("0821234567");
  await page.getByLabel("Street address").fill("10 Browser Road");
  await page.getByLabel("City", { exact: true }).fill("Johannesburg");
  await page.getByLabel("Postal code").fill("2000");
  await page.getByLabel("Province").selectOption("Gauteng");
  await page.getByLabel("Discount code").fill("TEST10");
  await page.getByRole("button", { name: "Review order", exact: true }).click();
  await expect(page.getByText("Total R 705.00", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Place pending order", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Order status", exact: true }),
  ).toBeVisible();
}
async function mockGateway(page, status) {
  await page.route(
    "https://sandbox.payfast.co.za/eng/process",
    async (route) => {
      const fields = new URLSearchParams(route.request().postData());
      expect(fields.get("amount")).toBe("705.00");
      expect(fields.get("signature")).toMatch(/^[a-f0-9]{32}$/);
      await route.fulfill({
        contentType: "text/html",
        body: "<h1>PayFast sandbox MOCK</h1><p>Automated fixture; no external payment processed.</p>",
      });
      const response = await page.request.post("/__test/payment", {
        data: { paymentId: fields.get("m_payment_id"), status },
      });
      expect(response.status()).toBe(200);
    },
  );
  await page
    .getByRole("button", { name: "Continue to PayFast sandbox", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "PayFast sandbox MOCK", exact: true }),
  ).toBeVisible();
}
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 375, height: 812 },
])
  test(`complete purchase with mocked sandbox callback and receipt ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await addToCart(page);
    await register(page);
    await delivery(page);
    const orderURL = page.url();
    await mockGateway(page, "COMPLETE");
    await page.goto(orderURL + "?payment=returned");
    await expect(
      page.getByRole("heading", { name: "Order confirmed", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Confirmation and receipt email: sent", { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("link", { name: "Order history", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "My account", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /R 705.00 · paid/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `qa/commerce-${viewport.width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
    const emails = await (await page.request.get("/__test/emails")).json();
    expect(
      emails.some(
        (e) => e.subject.includes("receipt") && e.to.includes("browser-"),
      ),
    ).toBe(true);
  });
test("failed payment remains unpaid and does not send receipt", async ({
  page,
}) => {
  await addToCart(page);
  await register(page);
  await delivery(page);
  const orderURL = page.url();
  await mockGateway(page, "FAILED");
  await page.goto(orderURL);
  await expect(page.getByRole("status")).toContainText("Payment: failed");
  await expect(
    page.getByText("Confirmation and receipt email: sent", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Continue to PayFast sandbox",
      exact: true,
    }),
  ).toBeDisabled();
});
test("browser return does not mark paid; explicit cancellation is safe", async ({
  page,
}) => {
  await addToCart(page);
  await register(page);
  await delivery(page);
  await page.goto(page.url() + "?payment=cancelled");
  await expect(page.getByRole("status")).toContainText("Payment: pending");
  await page
    .getByRole("button", { name: "Cancel pending order", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Order: cancelled");
  await expect(
    page.getByText("Confirmation and receipt email: sent", { exact: true }),
  ).toHaveCount(0);
});
test("out of stock product cannot be added", async ({ page }) => {
  await page.goto("/shop/products/RP-T03");
  await expect(page.getByText("R 350.00 · Out of stock")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add to cart", exact: true }),
  ).toBeDisabled();
});
test("customer login and admin operations are protected", async ({ page }) => {
  await page.goto("/shop/admin");
  await expect(
    page.getByText("Administrator access required.", { exact: true }),
  ).toBeVisible();
  await page.goto("/shop/login");
  await page.getByLabel("Email", { exact: true }).fill("admin@example.invalid");
  await page
    .getByLabel("Password (12 characters minimum)")
    .fill("Test-admin-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Checkout", exact: true }),
  ).toBeVisible();
  await page.goto("/shop/admin");
  await expect(
    page.getByRole("heading", { name: "Commerce administration", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Variants and available inventory",
      exact: true,
    }),
  ).toBeVisible();
});
test("verified cancelled gateway payment can be cancelled without a receipt", async ({
  page,
}) => {
  await addToCart(page);
  await register(page);
  await delivery(page);
  const orderURL = page.url();
  await mockGateway(page, "CANCELLED");
  await page.goto(orderURL);
  await expect(page.getByRole("status")).toContainText("Payment: cancelled");
  await page
    .getByRole("button", { name: "Cancel pending order", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Order: cancelled");
  await expect(
    page.getByText("Confirmation and receipt email: sent", { exact: true }),
  ).toHaveCount(0);
});
