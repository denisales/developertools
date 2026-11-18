import http from "node:http";
import { URL } from "node:url";

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4100);
const REFERENCE_DATE = "18/11/2026";

/**
 * Deterministic mock values matching Banco Central do Brasil SGS API format.
 * Each entry mirrors the latest point returned by api.bcb.gov.br.
 */
const MOCK_SERIES = {
  "4389": { name: "Taxa DI (CDI anualizado)", valor: "14.15" },
  "432": { name: "Taxa Selic Meta (anualizada)", valor: "14.25" },
  "433": { name: "IPCA Mensal", valor: "0.42" },
  "13522": { name: "IPCA Acumulado 12 meses", valor: "4.50" },
  "1": { name: "Dólar Comercial PTAX - Venda", valor: "5.7845" },
  "10813": { name: "Dólar Comercial PTAX - Compra", valor: "5.7839" },
  "195": { name: "Poupança Mensal", valor: "0.50" },
  "11": { name: "Selic Diária", valor: "0.0525" },
  "189": { name: "IGP-M Mensal", valor: "0.61" },
  "21619": { name: "Euro Comercial PTAX - Venda", valor: "6.1230" },
};

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function formatBrDate(date) {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = String(date.getUTCFullYear());
  return `${day}/${month}/${year}`;
}

function buildSeriesPayload(valor, count) {
  const safeCount = Math.max(1, Math.min(count, 365));
  if (safeCount === 1) {
    return [{ data: REFERENCE_DATE, valor }];
  }

  // Reference date 18/11/2026 in UTC; generate chronological points ending on REFERENCE_DATE
  const base = new Date(Date.UTC(2026, 10, 18));
  const points = [];
  for (let i = safeCount - 1; i >= 0; i -= 1) {
    const pointDate = new Date(base);
    pointDate.setUTCMonth(pointDate.getUTCMonth() - i);
    points.push({
      data: formatBrDate(pointDate),
      valor,
    });
  }
  return points;
}

const ULTIMOS_RE =
  /^\/dados\/serie\/bcdata\.sgs\.(\d+)\/dados\/ultimos\/(\d+)\/?$/;
const DADOS_RE = /^\/dados\/serie\/bcdata\.sgs\.(\d+)\/dados\/?$/;

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: "Missing request URL" });
    return;
  }

  const parsedUrl = new URL(req.url, `http://${HOST}:${PORT}`);
  const { pathname, searchParams } = parsedUrl;

  if (pathname === "/__health") {
    sendJson(res, 200, { status: "ok", service: "bcb-sgs-mock" });
    return;
  }

  const mockErrorParam = searchParams.get("mockError");
  if (mockErrorParam !== null) {
    const parsedStatus = Number(mockErrorParam);
    const errorStatus =
      Number.isInteger(parsedStatus) && parsedStatus >= 400 && parsedStatus <= 599
        ? parsedStatus
        : 500;
    sendJson(res, errorStatus, {
      error: "Simulated BCB SGS API error",
      status: errorStatus,
    });
    return;
  }

  const formato = searchParams.get("formato");
  if (formato !== null && formato.toLowerCase() !== "json") {
    sendJson(res, 400, {
      error: "Unsupported formato parameter; only json is supported by mock",
      formato,
    });
    return;
  }

  const ultimosMatch = pathname.match(ULTIMOS_RE);
  if (ultimosMatch) {
    const seriesId = ultimosMatch[1];
    const count = Number(ultimosMatch[2]);
    const entry = MOCK_SERIES[seriesId];

    if (!entry) {
      sendJson(res, 404, {
        error: "Series not found",
        seriesId,
      });
      return;
    }

    if (!Number.isInteger(count) || count < 1) {
      sendJson(res, 400, {
        error: "Invalid ultimos count",
        count: ultimosMatch[2],
      });
      return;
    }

    sendJson(res, 200, buildSeriesPayload(entry.valor, count));
    return;
  }

  const dadosMatch = pathname.match(DADOS_RE);
  if (dadosMatch) {
    const seriesId = dadosMatch[1];
    const entry = MOCK_SERIES[seriesId];

    if (!entry) {
      sendJson(res, 404, {
        error: "Series not found",
        seriesId,
      });
      return;
    }

    sendJson(res, 200, buildSeriesPayload(entry.valor, 1));
    return;
  }

  sendJson(res, 404, {
    error: "Endpoint not found",
    pathname,
  });
});

server.listen(PORT, HOST, () => {
  console.log(`BCB SGS mock server listening on http://${HOST}:${PORT}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
