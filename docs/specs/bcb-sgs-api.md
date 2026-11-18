# Especificação da API SGS do Banco Central do Brasil (BCB)

- **Serviço Alvo**: `src/services/bcb/` (`bcb-series.ts`, `bcb-client.ts`)
- **Route Handler**: `src/app/api/indicators/route.ts` (`/api/indicators`)
- **Base URL Padrão**: `https://api.bcb.gov.br` (sobrescrita via `process.env.BCB_API_BASE_URL` para mocks locais/E2E)
- **Investigação Real Executada em**: `18/11/2026` via `curl`

---

## 1. Visão Geral dos Endpoints SGS

A API pública do Sistema Gerenciador de Séries Temporais (**SGS**) do Banco Central expõe séries econômicas no formato:

1. **Últimos $N$ registros**:
   ```text
   GET {BASE_URL}/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/{N}?formato=json
   ```
2. **Consulta por intervalo de datas** (`dd/mm/aaaa`):
   ```text
   GET {BASE_URL}/dados/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial={dd/mm/aaaa}&dataFinal={dd/mm/aaaa}
   ```
3. **Série completa (apenas séries não diárias)**:
   ```text
   GET {BASE_URL}/dados/serie/bcdata.sgs.{codigo}/dados?formato=json
   ```

---

## 2. Headers e Comportamento HTTP Observados

Em chamadas reais `HTTP/2 200` para `https://api.bcb.gov.br`:

- `content-type: application/json; charset=utf-8`
- `access-control-allow-origin: *`
- `cache-control: public, max-age=900` (seguido de `cache-control: private` do balanceador)
- `etag` presente nas respostas `200`, `400` e `404`
- `correlation-id` (UUID) e `x-azure-ref` para rastreabilidade
- **Observação sobre `formato=json`**: mesmo sem `?formato=json`, o endpoint atualmente retorna `application/json; charset=utf-8` por padrão, porém manter `?formato=json` explícito garante compatibilidade caso o gateway altere o default para CSV.

---

## 3. Catálogo de Séries Investigadas (Respostas Reais)

### 3.1 Séries Principais (Indicadores de Mercado)

| Indicador | Código SGS | Periodicidade | Unidade | Exemplo Real Observado (`18/11/2026`) |
| :--- | :---: | :--- | :--- | :--- |
| **Taxa DI (CDI anualizado)** | `4389` | Diária (dias úteis) | `% a.a.` | `[{"data":"16/11/2026","valor":"13.65"}]` |
| **Taxa Selic Meta (COPOM)** | `432` | Diária (vigência COPOM) | `% a.a.` | `[{"data":"09/12/2026","valor":"13.75"}]` |
| **IPCA Mensal** | `433` | Mensal | `% a.m.` | `[{"data":"01/10/2026","valor":"0.14"}]` |
| **IPCA Acumulado 12 meses** | `13522` | Mensal | `% a.a.` | `[{"data":"01/10/2026","valor":"4.63"}]` |
| **Dólar Comercial PTAX - Venda** | `1` | Diária (dias úteis) | `R$` | `[{"data":"17/11/2026","valor":"5.7851"}]` |
| **Dólar Comercial PTAX - Compra** | `10813` | Diária (dias úteis) | `R$` | `[{"data":"17/11/2026","valor":"5.7845"}]` |

### 3.2 Séries Adicionais (Suporte à Poupança e Ferramentas Futuras)

| Indicador | Código SGS | Periodicidade | Unidade | Exemplo Real Observado (`18/11/2026`) |
| :--- | :---: | :--- | :--- | :--- |
| **Poupança (rendimento mensal)** | `195` | Diária (aniversário) | `% a.m.` | `[{"data":"16/11/2026","dataFim":"16/12/2026","valor":"0.6700"}]` |
| **Taxa Selic Diária** | `11` | Diária (dias úteis) | `% a.d.` | `[{"data":"17/11/2026","valor":"0.050788"}]` |
| **IGP-M Mensal** | `189` | Mensal | `% a.m.` | `[{"data":"01/10/2026","valor":"1.47"}]` |
| **Euro PTAX - Venda** | `21619` | Diária (dias úteis) | `R$` | `[{"data":"17/11/2026","valor":"6.3659000"}]` |

### 3.3 Particularidades dos Dados Retornados

1. **Formato de data**: sempre string `dd/mm/aaaa` (ex.: `"01/10/2026"`).
2. **Formato numérico**: `valor` chega como **string decimal com ponto** (ex.: `"13.65"`, `"-0.32"`, `"5.7851"`).
3. **Valores negativos**: índices de inflação (como IPCA `433`) podem ter deflação (ex.: `01/08/2026` retornou `"-0.32"` em `ultimos/12`).
4. **Campo extra na Poupança (`195`)**: além de `data` e `valor`, retorna `"dataFim"` indicando a data de aniversário no mês seguinte (`16/11/2026` -> `16/12/2026`). A taxa retornada é **mensal** (`% a.m.`), convertida para anual pelo serviço via equivalência composta: $((1 + i_m / 100)^{12} - 1) \times 100$.
5. **Selic Meta (`432`) com data futura no ciclo COPOM**: a série preenche datas diárias até o fim do período vigente definido na última reunião do COPOM (observado `"09/12/2026"` em `ultimos/1`).
6. **Consulta `ultimos/12` e intervalo de datas**:
   - `ultimos/12` retorna um array ordenado do registro mais antigo para o mais recente (ex.: `01/11/2025` até `01/10/2026` na série `433`).
   - Consulta com `?formato=json&dataInicial=01/10/2026&dataFinal=18/11/2026` na série `433` retornou `[{"data":"01/10/2026","valor":"0.14"}]`.

---

## 4. Modos de Erro Observados

| Cenário Testado | Status HTTP | Content-Type | Corpo Real da Resposta |
| :--- | :---: | :--- | :--- |
| Série inexistente (`99999999`) | `404` | `text/plain; charset=utf-8` | `A serie nao existe!` |
| Data inicial inválida (`dataInicial=invalid`) | `400` | `application/json; charset=utf-8` | `{"erro":"dataInicial invalida. Informe uma data existente no formato dd/mm/aaaa."}` |
| Intervalo sem dados (`01/01/2030` a `02/01/2030`) | `404` | `application/json; charset=utf-8` | `{"erro":{"statusCode":404,"detail":"br.gov.bcb.pec.sgs.comum.excecoes.SGSNegocioException: Value(s) not found"}}` |
| Série diária (`1`) sem `dataInicial` | `406` | `application/json; charset=utf-8` | `{"error":"O sistema aceita uma janela de consulta de, no máximo, 10 anos em séries de periodicidade diária", ...}` |

> **Nota de Resiliência**: Como a API do BCB pode retornar `text/plain` em `404` de série inexistente ou sofrer instabilidades temporárias/latência, o cliente `bcb-client.ts` utiliza timeout (`4500ms` por padrão via `AbortController`), valida o status HTTP e a estrutura JSON recebida (`Array` de objetos com `data` e `valor` numéricos) e aplica fallback individual por série via `Promise.allSettled` em `getMarketIndicators()`.

---

## 5. Arquitetura do Serviço e Contrato `/api/indicators`

### 5.1 Configuração de Base URL (`BCB_API_BASE_URL`)

- `getBcbBaseUrl()` lê `process.env.BCB_API_BASE_URL || "https://api.bcb.gov.br"` e remove barras finais redundantes.
- Em testes E2E (Playwright) e CI, `BCB_API_BASE_URL=http://127.0.0.1:4100` aponta para o servidor mock local sem chamadas externas à internet.

### 5.2 Endpoint `GET /api/indicators`

- **Cache-Control**:
  - Com `BCB_API_BASE_URL` definida: `no-store` (respostas imediatas do mock local).
  - Em produção (BCB real): `public, s-maxage=3600, stale-while-revalidate=7200`.
- **Formato do Payload (`MarketIndicators`)**:
  Cada indicador segue a interface `BcbIndicatorPoint`:
  ```json
  {
    "seriesId": 4389,
    "name": "Taxa DI (CDI)",
    "unit": "% a.a.",
    "value": 13.65,
    "date": "16/11/2026",
    "source": "bcb"
  }
  ```
  O objeto completo retornado por `GET /api/indicators` contém:
  - `selicMeta`: `BcbIndicatorPoint` (série `432`)
  - `taxaDi`: `BcbIndicatorPoint` (série `4389`)
  - `ipcaMensal`: `BcbIndicatorPoint` (série `433`)
  - `ipca12Meses`: `BcbIndicatorPoint` (série `13522`)
  - `dolarPtaxVenda`: `BcbIndicatorPoint` (série `1`)
  - `dolarPtaxCompra`: `BcbIndicatorPoint` (série `10813`)
  - `poupancaAnual`: `BcbIndicatorPoint` (série `195`, anualizada a partir da taxa mensal)
  - `ipcaPlus6Anual`: `BcbIndicatorPoint` (derivada via `calculateIpcaPlusSpread(ipca12Meses.value, 6)`)
  - `updatedAt`: string ISO-8601
  - `usedFallback`: boolean (`true` se qualquer indicador principal usou fallback)
