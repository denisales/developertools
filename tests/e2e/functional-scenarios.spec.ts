import { expect, test } from "@playwright/test";

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
      page.locator('a[href="/gerador-de-cnpj?tab=validador"]')
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
    await expect(rateInput).toHaveValue("10,00");
    await expect(rateSelect).toContainText("Anual");
    await expect(periodInput).toHaveValue("10");
    await expect(periodSelect).toContainText("Anos");
    await expect(
      evolutionSection.getByRole("tab", { name: /Mensal \(121\)/i })
    ).toBeVisible();
  });
});
