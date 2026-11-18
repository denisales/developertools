import { expect, test } from "@playwright/test";

interface MockIndicatorPoint {
  seriesId: number;
  name: string;
  unit: string;
  value: number;
  date: string;
  source: "bcb" | "fallback";
}

interface IndicatorsApiResponse {
  selicMeta: MockIndicatorPoint;
  taxaDi: MockIndicatorPoint;
  ipcaMensal: MockIndicatorPoint;
  ipca12Meses: MockIndicatorPoint;
  dolarPtaxVenda: MockIndicatorPoint;
  dolarPtaxCompra: MockIndicatorPoint;
  poupancaAnual: MockIndicatorPoint;
  ipcaPlus6Anual: MockIndicatorPoint;
  updatedAt: string;
  usedFallback: boolean;
}

function normalizeCurrencyText(text: string | null): string {
  return (text ?? "").replace(/\u00a0/g, " ").trim();
}

test.describe("Functional E2E Scenarios — All Screens (Desktop & Mobile)", () => {
  test("Home (/): search filter, empty state reset, category pills, navigation & global header search", async ({
    page,
  }, testInfo) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const heroSearch = page.getByPlaceholder(/Filtrar ferramentas/i);
    await expect(heroSearch).toBeVisible();

    // 1. Filter by "CNPJ" and verify matching cards show while non-matching categories hide
    await heroSearch.fill("CNPJ");
    await expect(
      page.getByRole("heading", { name: "Geradores de Documentos e Dados" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Validadores de Documentos" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Calculadoras Financeiras & Matemáticas",
      })
    ).toBeHidden();
    await expect(
      page.getByRole("link", { name: /Gerador e Validador de CNPJ/i })
    ).toBeVisible();
    await expect(
      page.locator('main a[href="/gerador-de-cnpj?tab=validador"]')
    ).toBeVisible();

    // 2. Filter by "Juros" and verify only Calculadoras category shows
    await heroSearch.fill("Juros");
    await expect(
      page.getByRole("heading", {
        name: "Calculadoras Financeiras & Matemáticas",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Geradores de Documentos e Dados" })
    ).toBeHidden();
    await expect(
      page.getByRole("link", { name: /Calculadora de Juros Compostos/i })
    ).toBeVisible();

    // 3. Empty filter state & "Limpar filtros" restoration
    await heroSearch.fill("zzzznotfound");
    await expect(
      page.getByText("Nenhuma ferramenta encontrada para o filtro selecionado.")
    ).toBeVisible();
    await page.getByRole("button", { name: "Limpar filtros" }).click();

    await expect(heroSearch).toHaveValue("");
    await expect(
      page.getByRole("heading", { name: "Ferramentas Ativas" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Geradores de Documentos e Dados" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Calculadoras Financeiras & Matemáticas",
      })
    ).toBeVisible();

    // 4. Category filter pills & navigation to active tool card
    await page.getByRole("button", { name: "Calculadoras", exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: "Calculadoras Financeiras & Matemáticas",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Geradores de Documentos e Dados" })
    ).toBeHidden();

    await page.getByRole("button", { name: "Geradores", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Geradores de Documentos e Dados" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "Calculadoras Financeiras & Matemáticas",
      })
    ).toBeHidden();

    await page
      .getByRole("link", { name: /Gerador e Validador de CPF/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/gerador-de-cpf$/);
    await expect(
      page.getByRole("heading", { name: "Gerador e Validador de CPF" })
    ).toBeVisible();

    // 5. Global header search (Desktop inline dropdown vs Mobile overlay)
    if (testInfo.project.name === "mobile") {
      const mobileSearchBtn = page.getByRole("button", {
        name: /buscar ferramenta/i,
      });
      await mobileSearchBtn.click();
      const searchDialog = page.getByRole("dialog", {
        name: /buscar ferramentas/i,
      });
      await expect(searchDialog).toBeVisible();
      await searchDialog
        .getByPlaceholder(/Buscar CPF, CNPJ, Juros/i)
        .fill("Juros");
      await searchDialog
        .getByRole("button", { name: /Calculadora de Juros Compostos/i })
        .click();
      await expect(page).toHaveURL(/\/calculadora-juros-compostos$/);
    } else {
      const desktopSearch = page.getByPlaceholder(
        /Buscar ferramenta \(CPF, CNPJ, Juros\)/i
      );
      await desktopSearch.click();
      await desktopSearch.fill("Juros");
      const resultItem = page
        .locator("header")
        .getByRole("button", { name: /Calculadora de Juros Compostos/i });
      await expect(resultItem).toBeVisible();
      await resultItem.click();
      await expect(page).toHaveURL(/\/calculadora-juros-compostos$/);
    }
  });

  test("CPF Generator & Validator (/gerador-de-cpf, validador-de-cpf): generate, punctuation, UF SP, validate & bulk", async ({
    page,
  }) => {
    await page.goto("/gerador-de-cpf", { waitUntil: "networkidle" });

    const cpfDisplay = page.locator('[title="Clique para copiar o CPF"]');
    await expect(cpfDisplay).toBeVisible();

    // 1. Valid formatted CPF on load
    const initialCpf = (await cpfDisplay.textContent())?.trim() ?? "";
    expect(initialCpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);

    // 2. Click "Gerar Novo" and assert value changes
    await page.getByRole("button", { name: /gerar novo/i }).click();
    await expect(cpfDisplay).not.toHaveText(initialCpf);
    const regeneratedCpf = (await cpfDisplay.textContent())?.trim() ?? "";
    expect(regeneratedCpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);

    // 3. Toggle punctuation switch off and assert 11 raw digits
    const formatSwitch = page.locator("#cpf-format-switch");
    await formatSwitch.click();
    await expect(formatSwitch).not.toBeChecked();
    const rawCpf = (await cpfDisplay.textContent())?.trim() ?? "";
    expect(rawCpf).toMatch(/^\d{11}$/);

    // Toggle punctuation back on
    await formatSwitch.click();
    await expect(formatSwitch).toBeChecked();
    await expect(cpfDisplay).toHaveText(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);

    // 4. Select UF SP and assert 9th digit is 8
    await page.locator("#cpf-state-select").click();
    await page.getByRole("option", { name: /SP — São Paulo/i }).click();
    await expect(page.getByText(/UF: SP • Dígito 8/)).toBeVisible();
    const spCpfFormatted = (await cpfDisplay.textContent())?.trim() ?? "";
    const spDigits = spCpfFormatted.replace(/\D/g, "");
    expect(spDigits).toHaveLength(11);
    expect(spDigits[8]).toBe("8");

    // 5. Switch to "Validar" tab: test valid CPF + DV1/DV2 breakdown, then invalid 111.111.111-11
    await page.getByRole("tab", { name: /Validar/i }).click();
    const validatorInput = page.getByLabel("Número de CPF para validar");
    await expect(validatorInput).toBeVisible();

    await validatorInput.fill("52998224725");
    await expect(
      page.getByRole("heading", { name: "CPF Válido" })
    ).toBeVisible();
    await expect(
      page.getByText("1º Dígito Verificador (10º dígito)")
    ).toBeVisible();
    await expect(
      page.getByText("2º Dígito Verificador (11º dígito)")
    ).toBeVisible();
    await expect(page.getByText(/DV₁ =/)).toBeVisible();
    await expect(page.getByText(/DV₂ =/)).toBeVisible();

    await validatorInput.fill("11111111111");
    await expect(
      page.getByRole("heading", { name: "CPF Inválido" })
    ).toBeVisible();
    await expect(page.getByText(/dígitos repetidos/i)).toBeVisible();

    // 6. Switch to "Em Lote" tab, generate batch of 25 CPFs and verify list count
    await page.getByRole("tab", { name: /Em Lote/i }).click();
    await page.getByRole("button", { name: "25", exact: true }).click();
    await expect(
      page.getByText("25 CPFs gerados", { exact: true })
    ).toBeVisible();
    await expect(
      page.locator('button[aria-label^="Copiar "]')
    ).toHaveCount(25);
  });

  test("CNPJ Generator & Validator (/gerador-de-cnpj, validador-de-cnpj): numeric/alphanumeric, filial, punctuation, validate & batch", async ({
    page,
  }) => {
    await page.goto("/gerador-de-cnpj", { waitUntil: "networkidle" });

    const cnpjDisplay = page.locator('button[title="Clique para copiar o CNPJ"]');
    await expect(cnpjDisplay).toBeVisible();

    // 1. Verify valid formatted CNPJ on load
    const initialCnpj = (await cnpjDisplay.textContent())?.trim() ?? "";
    expect(initialCnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/0001-\d{2}$/);

    // 2. Toggle Alfanumérico format and generate alphanumeric CNPJ
    await page.getByRole("button", { name: "Alfanumérico", exact: true }).click();
    const alphaCnpj = (await cnpjDisplay.textContent())?.trim() ?? "";
    expect(alphaCnpj).toMatch(
      /^[0-9A-Z]{2}\.[0-9A-Z]{3}\.[0-9A-Z]{3}\/0001-\d{2}$/
    );
    expect(/[A-Z]/.test(alphaCnpj)).toBe(true);

    // 3. Toggle Filial and verify branch changes from 0001
    await page.getByRole("button", { name: "Filial", exact: true }).click();
    await expect(page.getByText(/Filial \(\d{4}\)/)).toBeVisible();
    const filialCnpj = (await cnpjDisplay.textContent())?.trim() ?? "";
    const filialClean = filialCnpj.replace(/[./-]/g, "");
    expect(filialClean).toHaveLength(14);
    expect(filialClean.slice(8, 12)).not.toBe("0001");

    // 4. Toggle punctuation off and verify 14 characters
    const punctuationSwitch = page.locator("#cnpj-punctuation-switch");
    await punctuationSwitch.click();
    await expect(punctuationSwitch).not.toBeChecked();
    const unformattedCnpj = (await cnpjDisplay.textContent())?.trim() ?? "";
    expect(unformattedCnpj).toMatch(/^[0-9A-Z]{14}$/);
    expect(unformattedCnpj).toHaveLength(14);

    // 5. Switch to "Validar" tab, click quick example 12.ABC.345/01DE-35 and test invalid CNPJ
    await page.getByRole("tab", { name: /Validar/i }).click();
    await page.getByRole("button", { name: /DV Inválido/i }).click();
    await expect(
      page.getByRole("heading", { name: "CNPJ Inválido" })
    ).toBeVisible();

    await page.getByRole("button", { name: /Alfanumérico Válido/i }).click();
    await expect(
      page.getByRole("heading", { name: "CNPJ Válido!" })
    ).toBeVisible();
    await expect(
      page.locator("#cnpj-validator-input")
    ).toHaveValue("12.ABC.345/01DE-35");
    await expect(
      page.getByText("1º Dígito Verificador (DV1)")
    ).toBeVisible();
    await expect(
      page.getByText("2º Dígito Verificador (DV2)")
    ).toBeVisible();

    // Also verify manual invalid input rejection
    await page.locator("#cnpj-validator-input").fill("11222333000199");
    await expect(
      page.getByRole("heading", { name: "CNPJ Inválido" })
    ).toBeVisible();

    // 6. Switch to "Em Lote" tab and generate batch of 25 CNPJs
    await page.getByRole("tab", { name: /Em Lote/i }).click();
    await page.getByRole("button", { name: "25", exact: true }).click();
    await page.getByRole("button", { name: /Gerar 25 CNPJs/i }).click();
    await expect(page.getByText(/Total exibido:\s*25\s*CNPJs/i)).toBeVisible();
    await expect(
      page.locator('button[title="Copiar CNPJ"]')
    ).toHaveCount(25);
  });

  test("Compound Interest Calculator (/calculadora-juros-compostos): presets, inputs, rate unit toggle, table views & reset", async ({
    page,
  }) => {
    await page.goto("/calculadora-juros-compostos", {
      waitUntil: "networkidle",
    });

    const initialInput = page.locator("#mainValue");
    const monthlyInput = page.locator("#investment");
    const rateInput = page.locator("#rate");
    const rateSelect = page.locator("#select-rate");
    const periodInput = page.locator("#period");
    const periodSelect = page.locator("#select-period");

    const amountEl = page.locator("#amount");
    const investedEl = page.locator("#invested");
    const interestEl = page.locator("#interest");

    await expect(initialInput).toHaveValue("1.000,00");
    await expect(monthlyInput).toHaveValue("500,00");
    await expect(rateInput).toHaveValue("14,15");
    await expect(rateSelect).toContainText("Anual");

    // 1. Click preset chip "Selic 14,25%" then "1% a.m."
    await page.getByRole("button", { name: /Selic 14,25%/i }).click();
    await expect(rateInput).toHaveValue("14,25");
    await expect(rateSelect).toContainText("Anual");

    await page.getByRole("button", { name: "1% a.m.", exact: true }).click();
    await expect(rateInput).toHaveValue("1,00");
    await expect(rateSelect).toContainText("Mensal");

    // 2. Change Valor Inicial (R$ 10.000,00), Aporte Mensal (R$ 1.000,00), Taxa (1,00% Mensal), Período (2 Anos = 24m)
    await initialInput.fill("1000000");
    await expect(initialInput).toHaveValue("10.000,00");

    await monthlyInput.fill("100000");
    await expect(monthlyInput).toHaveValue("1.000,00");

    await periodInput.fill("2");
    await expect(periodInput).toHaveValue("2");
    await expect(periodSelect).toContainText("Anos");

    // For 1 year (12 months) at 1% a.m., P0=10.000, PMT=1.000:
    // Invested = 22.000,00 | Final = 23.950,75 | Interest = 1.950,75
    await periodInput.fill("1");
    expect(normalizeCurrencyText(await investedEl.textContent())).toBe(
      "R$ 22.000,00"
    );
    expect(normalizeCurrencyText(await amountEl.textContent())).toBe(
      "R$ 23.950,75"
    );
    expect(normalizeCurrencyText(await interestEl.textContent())).toBe(
      "R$ 1.950,75"
    );

    // 3. Toggle rate unit Mensal -> Anual (1% a.a. over 12m yields much less than 1% a.m.)
    const monthlyFinalText = normalizeCurrencyText(await amountEl.textContent());
    await rateSelect.click();
    await page.getByRole("option", { name: "Anual" }).click();
    await expect(rateSelect).toContainText("Anual");
    const annualFinalText = normalizeCurrencyText(await amountEl.textContent());
    expect(annualFinalText).not.toBe(monthlyFinalText);
    expect(normalizeCurrencyText(await investedEl.textContent())).toBe(
      "R$ 22.000,00"
    );

    // Toggle back to Mensal and set 2 years (24 months) for table comparison
    await rateSelect.click();
    await page.getByRole("option", { name: "Mensal" }).click();
    await periodInput.fill("2");

    // 4. Toggle Mensal / Anual in the evolution table and verify row counts
    const evolutionSection = page.locator("#evolutionTable");
    const monthlyTab = evolutionSection.getByRole("tab", {
      name: /Mensal \(25\)/i,
    });
    const yearlyTab = evolutionSection.getByRole("tab", {
      name: /Anual \(3\)/i,
    });

    await expect(monthlyTab).toBeVisible();
    await expect(yearlyTab).toBeVisible();
    await expect(evolutionSection.locator("tbody tr")).toHaveCount(25);

    await yearlyTab.click();
    await expect(evolutionSection.locator("tbody tr")).toHaveCount(3);

    await monthlyTab.click();
    await expect(evolutionSection.locator("tbody tr")).toHaveCount(25);

    // 5. Click "Restaurar" and verify defaults restore
    await page.getByRole("button", { name: "Restaurar" }).click();
    await expect(initialInput).toHaveValue("1.000,00");
    await expect(monthlyInput).toHaveValue("500,00");
    await expect(rateInput).toHaveValue("14,15");
    await expect(rateSelect).toContainText("Anual");
    await expect(periodInput).toHaveValue("10");
    await expect(periodSelect).toContainText("Anos");
    await expect(
      evolutionSection.getByRole("tab", { name: /Mensal \(121\)/i })
    ).toBeVisible();
  });

  test("Sidebar accordion state: all 4 categories expanded on desktop (<aside>), collapsed on mobile drawer", async ({
    page,
  }, testInfo) => {
    await page.goto("/", { waitUntil: "networkidle" });

    if (testInfo.project.name === "desktop") {
      const desktopAccordions = page.locator("aside button[aria-expanded]");
      await expect(desktopAccordions).toHaveCount(4);
      for (let i = 0; i < 4; i += 1) {
        await expect(desktopAccordions.nth(i)).toHaveAttribute(
          "aria-expanded",
          "true"
        );
      }
    } else {
      const mobileMenuBtn = page.getByRole("button", {
        name: /abrir menu de ferramentas/i,
      });
      await mobileMenuBtn.click();

      const mobileDrawer = page.getByRole("dialog");
      await expect(mobileDrawer).toBeVisible();

      const mobileAccordions = mobileDrawer.locator("button[aria-expanded]");
      await expect(mobileAccordions).toHaveCount(4);
      for (let i = 0; i < 4; i += 1) {
        await expect(mobileAccordions.nth(i)).toHaveAttribute(
          "aria-expanded",
          "false"
        );
      }

      // Clicking a collapsed category expands it interactively
      await mobileAccordions.first().click();
      await expect(mobileAccordions.first()).toHaveAttribute(
        "aria-expanded",
        "true"
      );
    }
  });

  test("Theme persistence in localStorage across page reloads (dark and light)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    const themeToggle = page.getByRole("button", {
      name: "Alternar tema claro/escuro",
    });
    await expect(themeToggle).toBeVisible();

    // Ensure starting state is light (or toggle to dark explicitly)
    await expect(page.locator("html")).not.toHaveClass(/\bdark\b/);

    // Toggle to dark mode
    await themeToggle.click();
    await expect
      .poll(() =>
        page.evaluate(() => ({
          hasDarkClass: document.documentElement.classList.contains("dark"),
          storedTheme: localStorage.getItem("theme"),
        }))
      )
      .toEqual({ hasDarkClass: true, storedTheme: "dark" });

    // Reload and verify dark mode persists via localStorage + inline head script
    await page.reload({ waitUntil: "networkidle" });
    const afterDarkReload = await page.evaluate(() => ({
      hasDarkClass: document.documentElement.classList.contains("dark"),
      storedTheme: localStorage.getItem("theme"),
    }));
    expect(afterDarkReload).toEqual({ hasDarkClass: true, storedTheme: "dark" });

    // Toggle back to light mode
    await page
      .getByRole("button", { name: "Alternar tema claro/escuro" })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() => ({
          hasDarkClass: document.documentElement.classList.contains("dark"),
          storedTheme: localStorage.getItem("theme"),
        }))
      )
      .toEqual({ hasDarkClass: false, storedTheme: "light" });

    // Reload and verify light mode persists
    await page.reload({ waitUntil: "networkidle" });
    const afterLightReload = await page.evaluate(() => ({
      hasDarkClass: document.documentElement.classList.contains("dark"),
      storedTheme: localStorage.getItem("theme"),
    }));
    expect(afterLightReload).toEqual({
      hasDarkClass: false,
      storedTheme: "light",
    });
  });

  test("Zero-flicker SSR/Suspense BCB indicators without redundant mount /api/indicators request", async ({
    page,
  }) => {
    const mountIndicatorRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/indicators")) {
        mountIndicatorRequests.push(request.url());
      }
    });

    await page.goto("/calculadora-juros-compostos", {
      waitUntil: "networkidle",
    });

    // Server Component + <Suspense> must stream initial BCB rates directly with zero mount fetch
    expect(mountIndicatorRequests).toEqual([]);
    await expect(page.getByTestId("bcb-presets-skeleton")).toHaveCount(0);
    await expect(page.getByTestId("bcb-presets-bar")).toBeVisible();
    await expect(page.getByTestId("refresh-bcb-indicators")).toBeVisible();

    const indicatorsStatus = page.getByTestId("bcb-indicators-status");
    await expect(indicatorsStatus).toContainText(
      "Taxas BCB • Ref. 18/11/2026 • IPCA 12m: 4,50% • Dólar PTAX: R$ 5,78"
    );

    const cdiPreset = page.getByTestId("preset-cdi-100");
    const selicPreset = page.getByTestId("preset-selic");
    const ipcaPreset = page.getByTestId("preset-ipca-plus");

    await expect(cdiPreset).toContainText("CDI 14,15%");
    await expect(selicPreset).toContainText("Selic 14,25%");
    await expect(ipcaPreset).toContainText("IPCA 4,50%");
    await expect(page.locator("#rate")).toHaveValue("14,15");
    await expect(page.locator("#select-rate")).toContainText("Anual");

    await cdiPreset.click();
    await expect(page.locator("#rate")).toHaveValue(/^14[,.]15$/);
    await expect(page.locator("#select-rate")).toContainText("Anual");
  });

  test("Compound Interest skeleton loader on refresh and graceful HTTP 500 fallback", async ({
    page,
  }) => {
    await page.goto("/calculadora-juros-compostos", {
      waitUntil: "networkidle",
    });

    const refreshButton = page.getByTestId("refresh-bcb-indicators");
    await expect(refreshButton).toBeVisible();
    await expect(page.getByTestId("preset-cdi-100")).toContainText(
      "CDI 14,15%"
    );

    const refreshedIndicators: IndicatorsApiResponse = {
      selicMeta: {
        seriesId: 432,
        name: "Taxa Selic Meta",
        unit: "% a.a.",
        value: 15.0,
        date: "19/11/2026",
        source: "bcb",
      },
      taxaDi: {
        seriesId: 4389,
        name: "Taxa DI",
        unit: "% a.a.",
        value: 14.9,
        date: "19/11/2026",
        source: "bcb",
      },
      ipcaMensal: {
        seriesId: 433,
        name: "IPCA Mensal",
        unit: "% a.m.",
        value: 0.45,
        date: "19/11/2026",
        source: "bcb",
      },
      ipca12Meses: {
        seriesId: 13522,
        name: "IPCA 12m",
        unit: "% a.a.",
        value: 4.8,
        date: "19/11/2026",
        source: "bcb",
      },
      dolarPtaxVenda: {
        seriesId: 1,
        name: "Dólar PTAX Venda",
        unit: "R$",
        value: 5.85,
        date: "19/11/2026",
        source: "bcb",
      },
      dolarPtaxCompra: {
        seriesId: 10813,
        name: "Dólar PTAX Compra",
        unit: "R$",
        value: 5.84,
        date: "19/11/2026",
        source: "bcb",
      },
      poupancaAnual: {
        seriesId: 195,
        name: "Poupança",
        unit: "% a.a.",
        value: 6.17,
        date: "19/11/2026",
        source: "bcb",
      },
      ipcaPlus6Anual: {
        seriesId: 13522,
        name: "IPCA+ 6%",
        unit: "% a.a.",
        value: 11.09,
        date: "19/11/2026",
        source: "bcb",
      },
      updatedAt: "2026-11-19T12:00:00.000Z",
      usedFallback: false,
    };

    // 1. Delayed refresh must display BcbPresetsSkeleton (never stale chips) and then resolve to refreshed presets
    await page.route("**/api/indicators", async (route) => {
      await new Promise((r) => setTimeout(r, 250));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(refreshedIndicators),
      });
    });

    await refreshButton.click();
    await expect(page.getByTestId("bcb-presets-skeleton")).toBeVisible();
    await expect(page.getByTestId("bcb-presets-bar")).toHaveCount(0);

    await expect(page.getByTestId("bcb-presets-skeleton")).toHaveCount(0);
    await expect(page.getByTestId("bcb-presets-bar")).toBeVisible();
    await expect(page.getByTestId("preset-cdi-100")).toContainText(
      "CDI 14,90%"
    );
    await expect(page.getByTestId("preset-selic")).toContainText(
      "Selic 15,00%"
    );
    await expect(page.getByTestId("preset-ipca-plus")).toContainText(
      "IPCA 4,80%"
    );
    await expect(page.getByTestId("bcb-indicators-status")).toContainText(
      "Taxas BCB • Ref. 19/11/2026 • IPCA 12m: 4,80% • Dólar PTAX: R$ 5,85"
    );

    // 2. Refresh failing with HTTP 500 must render graceful fallback defaults without crashing
    await page.unroute("**/api/indicators");
    await page.route("**/api/indicators", (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "mock failure" }),
      })
    );

    await page.getByTestId("refresh-bcb-indicators").click();

    await expect(page.getByTestId("bcb-presets-bar")).toBeVisible();
    await expect(page.getByTestId("bcb-indicators-status")).toContainText(
      "Taxas de referência padrão • Selic 14,25% • CDI 14,15% • IPCA 4,50%"
    );
    await expect(page.getByTestId("preset-selic")).toContainText(
      "Selic 14,25%"
    );
    await expect(page.getByTestId("preset-cdi-100")).toContainText(
      "CDI 14,15%"
    );

    const monthlyPreset = page.getByTestId("preset-carteira-1");
    await expect(monthlyPreset).toBeVisible();
    await monthlyPreset.click();

    await expect(page.locator("#rate")).toHaveValue(/^1[,.]00$/);
    await expect(page.locator("#select-rate")).toContainText("Mensal");

    await page.locator("#mainValue").fill("1000000");
    await page.locator("#investment").fill("100000");
    await page.locator("#period").fill("1");

    expect(
      normalizeCurrencyText(await page.locator("#invested").textContent())
    ).toBe("R$ 22.000,00");
    expect(
      normalizeCurrencyText(await page.locator("#amount").textContent())
    ).toBe("R$ 23.950,75");
    expect(
      normalizeCurrencyText(await page.locator("#interest").textContent())
    ).toBe("R$ 1.950,75");
  });

  test("Compound Interest Net Value & Regressive IR (/calculadora-juros-compostos): Gross/Net toggle, all 4 IR brackets, LCI/LCA exempt, Evolution Table & IR Brackets Card", async ({
    page,
  }, testInfo) => {
    await page.goto("/calculadora-juros-compostos", {
      waitUntil: "networkidle",
    });

    const initialInput = page.locator("#mainValue");
    const monthlyInput = page.locator("#investment");
    const periodInput = page.locator("#period");
    const periodSelect = page.locator("#select-period");

    const amountEl = page.locator("#amount");
    const investedEl = page.locator("#invested");
    const interestEl = page.locator("#interest");

    const viewGrossBtn = page.getByTestId("view-mode-gross");
    const viewNetBtn = page.getByTestId("view-mode-net");
    const regimeRegressiveBtn = page.getByTestId("tax-regime-regressive");
    const regimeExemptBtn = page.getByTestId("tax-regime-exempt");
    const irDeductionBadge = page.getByTestId("ir-deduction-badge");
    const irBracketsCard = page.getByTestId("ir-brackets-card");
    const evolutionSection = page.locator("#evolutionTable");

    const assertActiveBracket = async (
      activeId:
        | "up-to-180"
        | "181-to-360"
        | "361-to-720"
        | "above-720"
        | null
    ) => {
      const bracketIds = [
        "up-to-180",
        "181-to-360",
        "361-to-720",
        "above-720",
      ] as const;

      for (const id of bracketIds) {
        await expect(
          irBracketsCard.getByTestId(`ir-bracket-${id}`)
        ).toHaveAttribute("data-active", id === activeId ? "true" : "false");
      }
    };

    // 1. Default 10 anos (120m, P0=1.000, PMT=500, 14,15% a.a.) -> 15,0% bracket
    await expect(page.getByTestId("tax-controls-bar")).toBeVisible();
    await expect(viewGrossBtn).toHaveAttribute("aria-pressed", "true");
    await expect(viewNetBtn).toHaveAttribute("aria-pressed", "false");
    await expect(regimeRegressiveBtn).toHaveAttribute("aria-pressed", "true");
    await expect(regimeRegressiveBtn).toContainText("15,0%");

    expect(normalizeCurrencyText(await investedEl.textContent())).toBe(
      "R$ 61.000,00"
    );
    expect(normalizeCurrencyText(await amountEl.textContent())).toBe(
      "R$ 128.029,52"
    );
    expect(normalizeCurrencyText(await interestEl.textContent())).toBe(
      "R$ 67.029,52"
    );

    if (testInfo.project.name === "desktop") {
      await expect(page.getByTestId("net-preview-hint")).toContainText(
        "R$ 117.975,09"
      );
    }

    // Gross evolution table headers (no IR columns)
    await expect(
      evolutionSection.locator("thead th", { hasText: "Total Juros" })
    ).toBeVisible();
    await expect(
      evolutionSection.locator("thead th", { hasText: "IR (%)" })
    ).toHaveCount(0);

    // Switch to Valor Líquido (IR) and verify 10 anos (15,0%) numbers + table + IR brackets card
    await viewNetBtn.click();
    await expect(viewNetBtn).toHaveAttribute("aria-pressed", "true");
    await expect(viewGrossBtn).toHaveAttribute("aria-pressed", "false");

    expect(normalizeCurrencyText(await investedEl.textContent())).toBe(
      "R$ 61.000,00"
    );
    expect(normalizeCurrencyText(await amountEl.textContent())).toBe(
      "R$ 117.975,09"
    );
    expect(normalizeCurrencyText(await interestEl.textContent())).toBe(
      "R$ 56.975,09"
    );
    await expect(irDeductionBadge).toContainText("IR 15,0%: -R$ 10.054,43");

    await expect(
      irBracketsCard.getByTestId("ir-active-rate-badge")
    ).toContainText("Faixa atual: 15,0%");
    await assertActiveBracket("above-720");

    // Evolution Table in Net View shows IR / Líquido columns
    for (const col of ["IR (%)", "IR (R$)", "Juros Líquidos", "Total Líquido"]) {
      await expect(
        evolutionSection.locator("thead th", { hasText: col })
      ).toBeVisible();
    }

    // Switch back to Valor Bruto and return to Valor Líquido (IR)
    await viewGrossBtn.click();
    await expect(viewGrossBtn).toHaveAttribute("aria-pressed", "true");
    expect(normalizeCurrencyText(await amountEl.textContent())).toBe(
      "R$ 128.029,52"
    );
    await viewNetBtn.click();
    await expect(viewNetBtn).toHaveAttribute("aria-pressed", "true");

    // 2. Test all remaining regressive IR brackets with P0=10.000, PMT=1.000, 1,00% a.m.
    await page.getByTestId("preset-carteira-1").click();
    await initialInput.fill("1000000");
    await monthlyInput.fill("100000");
    await periodSelect.click();
    await page.getByRole("option", { name: "Meses" }).click();
    await expect(periodSelect).toContainText("Meses");

    // 2a. 6 meses -> 22,5% (Bruto R$ 16.767,22 | IR -R$ 172,62 | Líquido R$ 16.594,60 | Juros Líq R$ 594,60)
    await periodInput.fill("6");
    await expect(regimeRegressiveBtn).toContainText("22,5%");
    expect(normalizeCurrencyText(await investedEl.textContent())).toBe(
      "R$ 16.000,00"
    );
    expect(normalizeCurrencyText(await amountEl.textContent())).toBe(
      "R$ 16.594,60"
    );
    expect(normalizeCurrencyText(await interestEl.textContent())).toBe(
      "R$ 594,60"
    );
    await expect(irDeductionBadge).toContainText("IR 22,5%: -R$ 172,62");
    await expect(
      irBracketsCard.getByTestId("ir-active-rate-badge")
    ).toContainText("Faixa atual: 22,5%");
    await assertActiveBracket("up-to-180");

    // 2b. 12 meses -> 20,0% (Bruto R$ 23.950,75 | IR -R$ 390,15 | Líquido R$ 23.560,60 | Juros Líq R$ 1.560,60)
    await periodInput.fill("12");
    await expect(regimeRegressiveBtn).toContainText("20,0%");
    expect(normalizeCurrencyText(await investedEl.textContent())).toBe(
      "R$ 22.000,00"
    );
    expect(normalizeCurrencyText(await amountEl.textContent())).toBe(
      "R$ 23.560,60"
    );
    expect(normalizeCurrencyText(await interestEl.textContent())).toBe(
      "R$ 1.560,60"
    );
    await expect(irDeductionBadge).toContainText("IR 20,0%: -R$ 390,15");
    await expect(
      irBracketsCard.getByTestId("ir-active-rate-badge")
    ).toContainText("Faixa atual: 20,0%");
    await assertActiveBracket("181-to-360");

    // Verify Mês 0 and Mês 12 rows in Net Evolution Table
    const firstRow = evolutionSection.locator("tbody tr").first();
    await expect(firstRow).toContainText("Mês 0");
    await expect(firstRow).toContainText("—");
    const month12Row = evolutionSection.locator("tbody tr").last();
    await expect(month12Row).toContainText("Mês 12");
    await expect(month12Row).toContainText("20,0%");
    await expect(month12Row).toContainText("R$ 390,15");
    await expect(month12Row).toContainText("R$ 1.560,60");
    await expect(month12Row).toContainText("R$ 23.560,60");

    // 2c. 24 meses -> 17,5% (Bruto R$ 39.670,81 | IR -R$ 992,39 | Líquido R$ 38.678,42 | Juros Líq R$ 4.678,42)
    await periodInput.fill("24");
    await expect(regimeRegressiveBtn).toContainText("17,5%");
    expect(normalizeCurrencyText(await investedEl.textContent())).toBe(
      "R$ 34.000,00"
    );
    expect(normalizeCurrencyText(await amountEl.textContent())).toBe(
      "R$ 38.678,42"
    );
    expect(normalizeCurrencyText(await interestEl.textContent())).toBe(
      "R$ 4.678,42"
    );
    await expect(irDeductionBadge).toContainText("IR 17,5%: -R$ 992,39");
    await expect(
      irBracketsCard.getByTestId("ir-active-rate-badge")
    ).toContainText("Faixa atual: 17,5%");
    await assertActiveBracket("361-to-720");

    const month24Row = evolutionSection.locator("tbody tr").last();
    await expect(month24Row).toContainText("Mês 24");
    await expect(month24Row).toContainText("17,5%");
    await expect(month24Row).toContainText("R$ 992,39");
    await expect(month24Row).toContainText("R$ 4.678,42");
    await expect(month24Row).toContainText("R$ 38.678,42");

    // Yearly view in Net Evolution Table preserves per-year IR brackets (Ano 1 = 20,0%, Ano 2 = 17,5%)
    await evolutionSection.getByRole("tab", { name: /Anual \(3\)/i }).click();
    await expect(evolutionSection.locator("tbody tr")).toHaveCount(3);
    await expect(evolutionSection.locator("tbody tr").nth(1)).toContainText(
      "20,0%"
    );
    await expect(evolutionSection.locator("tbody tr").nth(2)).toContainText(
      "17,5%"
    );

    // 3. Toggle Isento (LCI/LCA) -> 0,0% IR (Valor Líquido === Valor Bruto)
    await regimeExemptBtn.click();
    await expect(regimeExemptBtn).toHaveAttribute("aria-pressed", "true");
    await expect(regimeRegressiveBtn).toHaveAttribute("aria-pressed", "false");
    await expect(irDeductionBadge).toContainText("Isento de IR (0,0%)");

    const netExemptAmount = normalizeCurrencyText(await amountEl.textContent());
    const netExemptInterest = normalizeCurrencyText(
      await interestEl.textContent()
    );
    expect(netExemptAmount).toBe("R$ 39.670,81");
    expect(netExemptInterest).toBe("R$ 5.670,81");

    // Verify Valor Líquido === Valor Bruto when Exempt
    await viewGrossBtn.click();
    expect(normalizeCurrencyText(await amountEl.textContent())).toBe(
      netExemptAmount
    );
    expect(normalizeCurrencyText(await interestEl.textContent())).toBe(
      netExemptInterest
    );
    await viewNetBtn.click();

    await expect(irBracketsCard.getByTestId("ir-exempt-badge")).toContainText(
      "Isento de IR (0,0%)"
    );
    await expect(
      irBracketsCard.getByTestId("ir-active-rate-badge")
    ).toHaveCount(0);
    await assertActiveBracket(null);

    // 4. Switch back to Tabela IR and confirm 10 anos (120m) highlights 15,0%
    await regimeRegressiveBtn.click();
    await periodSelect.click();
    await page.getByRole("option", { name: "Anos" }).click();
    await periodInput.fill("10");
    await expect(regimeRegressiveBtn).toContainText("15,0%");
    await expect(
      irBracketsCard.getByTestId("ir-active-rate-badge")
    ).toContainText("Faixa atual: 15,0%");
    await assertActiveBracket("above-720");
  });
});
