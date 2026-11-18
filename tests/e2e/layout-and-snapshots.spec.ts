import { expect, test } from "@playwright/test";

const ROUTES = [
  { path: "/", name: "home" },
  { path: "/gerador-de-cpf", name: "gerador-de-cpf" },
  { path: "/gerador-de-cnpj", name: "gerador-de-cnpj" },
  { path: "/calculadora-juros-compostos", name: "calculadora-juros-compostos" },
] as const;

test.describe("Layout Rigor, Geometric Containment & Visual Snapshots", () => {
  for (const route of ROUTES) {
    test(`${route.name} (${route.path}): zero overflow, card containment, no sibling overlap & visual snapshot`, async ({
      page,
    }) => {
      await page.goto(route.path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      // 1. Zero Page Horizontal Overflow
      const pageOverflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });
      expect(
        pageOverflow.scrollWidth,
        `Page ${route.path} has horizontal overflow: scrollWidth=${pageOverflow.scrollWidth} > innerWidth=${pageOverflow.innerWidth}`
      ).toBeLessThanOrEqual(pageOverflow.innerWidth);

      // 2. Zero Card Child Overflow (Bounding Box Containment)
      const cardViolations = await page.evaluate(() => {
        const cards = Array.from(
          document.querySelectorAll<HTMLElement>('[data-slot="card"]')
        );
        const violations: string[] = [];

        const isVisible = (el: HTMLElement) => {
          const style = window.getComputedStyle(el);
          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            Number.parseFloat(style.opacity) === 0
          ) {
            return false;
          }
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        };

        const hasHorizontalScrollAncestorInsideCard = (
          el: HTMLElement,
          card: HTMLElement
        ): HTMLElement | null => {
          let curr = el.parentElement;
          while (curr && curr !== card) {
            const style = window.getComputedStyle(curr);
            if (
              style.overflowX === "auto" ||
              style.overflowX === "scroll" ||
              style.overflowX === "hidden"
            ) {
              if (curr.scrollWidth > curr.clientWidth + 1) {
                return curr;
              }
            }
            curr = curr.parentElement;
          }
          return null;
        };

        cards.forEach((card, cardIdx) => {
          if (!isVisible(card)) return;
          const cardBox = card.getBoundingClientRect();
          const children = Array.from(
            card.querySelectorAll<HTMLElement>(
              '[data-slot="badge"], [data-slot="card-title"], h1, h2, h3, h4, button, input'
            )
          );

          children.forEach((child) => {
            if (!isVisible(child)) return;
            const scrollAncestor = hasHorizontalScrollAncestorInsideCard(
              child,
              card
            );
            const targetEl = scrollAncestor ?? child;
            const childBox = targetEl.getBoundingClientRect();

            if (
              childBox.right > cardBox.right + 1 ||
              childBox.left < cardBox.left - 1
            ) {
              const label =
                (child.textContent || child.getAttribute("placeholder") || child.tagName)
                  .trim()
                  .slice(0, 40);
              violations.push(
                `Card#${cardIdx} child "${label}" (${child.tagName.toLowerCase()}) overflows card: child=[${Math.round(
                  childBox.left
                )}..${Math.round(childBox.right)}], card=[${Math.round(
                  cardBox.left
                )}..${Math.round(cardBox.right)}]`
              );
            }
          });
        });

        return violations;
      });
      expect(cardViolations, cardViolations.join("\n")).toEqual([]);

      // 3. Zero Tab / Button Sibling Collision
      const siblingCollisions = await page.evaluate(() => {
        const collisions: string[] = [];
        const isVisible = (el: HTMLElement) => {
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") {
            return false;
          }
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        };

        const boxesOverlap = (a: DOMRect, b: DOMRect) => {
          const horizOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const vertOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          return horizOverlap > 1 && vertOverlap > 1;
        };

        // Check tabs inside every [data-slot="tabs-list"]
        const tabLists = Array.from(
          document.querySelectorAll<HTMLElement>('[data-slot="tabs-list"]')
        );
        tabLists.forEach((list, listIdx) => {
          if (!isVisible(list)) return;
          const tabs = Array.from(
            list.querySelectorAll<HTMLElement>('[data-slot="tabs-trigger"], button')
          ).filter(isVisible);

          for (let i = 0; i < tabs.length; i++) {
            for (let j = i + 1; j < tabs.length; j++) {
              const boxA = tabs[i].getBoundingClientRect();
              const boxB = tabs[j].getBoundingClientRect();
              if (boxesOverlap(boxA, boxB)) {
                collisions.push(
                  `TabsList#${listIdx} overlap between "${tabs[i].textContent?.trim()}" and "${tabs[j].textContent?.trim()}"`
                );
              }
            }
          }
        });

        return collisions;
      });
      expect(siblingCollisions, siblingCollisions.join("\n")).toEqual([]);

      // 5. Visual Snapshot for each route (Desktop 1440x900 & Mobile 375x667)
      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        fullPage: false,
        animations: "disabled",
      });

      // 5a-extra: On Home page, also snapshot the full-page Catalog Grid ("Disponível" / "Catálogo" cards across all categories)
      if (route.path === "/") {
        await expect(page).toHaveScreenshot("home-catalog.png", {
          fullPage: true,
          animations: "disabled",
        });
      }
    });
  }

  test("mobile above-the-fold assertion (375x667) & mobile overlays snapshots", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile",
      "Mobile-specific above-the-fold and overlay checks run on mobile project only"
    );

    // 4a. CPF Above-the-Fold
    await page.goto("/gerador-de-cpf", { waitUntil: "networkidle" });
    const cpfCopyBtn = page.getByRole("button", { name: /copiar/i }).first();
    const cpfNewBtn = page.getByRole("button", { name: /gerar novo/i }).first();
    await expect(cpfCopyBtn).toBeVisible();
    await expect(cpfNewBtn).toBeVisible();
    const cpfCopyBox = await cpfCopyBtn.boundingBox();
    const cpfNewBox = await cpfNewBtn.boundingBox();
    expect(cpfCopyBox).not.toBeNull();
    expect(cpfNewBox).not.toBeNull();
    expect(cpfCopyBox!.y + cpfCopyBox!.height).toBeLessThanOrEqual(667);
    expect(cpfNewBox!.y + cpfNewBox!.height).toBeLessThanOrEqual(667);

    // 4b. CNPJ Above-the-Fold
    await page.goto("/gerador-de-cnpj", { waitUntil: "networkidle" });
    const cnpjCopyBtn = page.getByRole("button", { name: /copiar/i }).first();
    const cnpjNewBtn = page.getByRole("button", { name: /gerar novo/i }).first();
    await expect(cnpjCopyBtn).toBeVisible();
    await expect(cnpjNewBtn).toBeVisible();
    const cnpjCopyBox = await cnpjCopyBtn.boundingBox();
    const cnpjNewBox = await cnpjNewBtn.boundingBox();
    expect(cnpjCopyBox).not.toBeNull();
    expect(cnpjNewBox).not.toBeNull();
    expect(cnpjCopyBox!.y + cnpjCopyBox!.height).toBeLessThanOrEqual(667);
    expect(cnpjNewBox!.y + cnpjNewBox!.height).toBeLessThanOrEqual(667);

    // 4c. Compound Interest Above-the-Fold
    await page.goto("/calculadora-juros-compostos", { waitUntil: "networkidle" });
    const firstInput = page.locator("main input").first();
    await expect(firstInput).toBeVisible();
    const firstInputBox = await firstInput.boundingBox();
    expect(firstInputBox).not.toBeNull();
    expect(firstInputBox!.y + firstInputBox!.height).toBeLessThanOrEqual(667);

    // 5b. Mobile Search Overlay Snapshot
    await page.goto("/", { waitUntil: "networkidle" });
    const searchBtn = page.getByRole("button", { name: /buscar ferramenta/i });
    await searchBtn.click();
    await expect(
      page.getByRole("dialog", { name: /buscar ferramentas/i })
    ).toBeVisible();
    await expect(page).toHaveScreenshot("mobile-search-overlay.png", {
      fullPage: false,
      animations: "disabled",
    });

    // Close search overlay and open Mobile Drawer Snapshot
    await page.keyboard.press("Escape");
    const menuBtn = page.getByRole("button", {
      name: /abrir menu de ferramentas/i,
    });
    await menuBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page).toHaveScreenshot("mobile-drawer.png", {
      fullPage: false,
      animations: "disabled",
    });
  });
});
