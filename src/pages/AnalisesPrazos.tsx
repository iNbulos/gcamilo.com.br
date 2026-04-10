import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Link2,
  LogOut,
} from "lucide-react";

const AUTO_REFRESH_SECONDS = 5 * 60;
const STORAGE_KEY = "analises-prazos-endpoint";
const EXPIRY_DAYS = 15;

interface StoredEndpoint {
  url: string;
  expiresAt: number;
}

interface Amostra {
  Amostra: string;
  "Situação": string;
  Cliente: string;
  Empresa: string;
  Chegada: string;
  Ensaio: string;
  DiasRestantes: number;
  DataProgFimCalculada: string;
}

type SortDirection = "asc" | "desc" | null;

const REQUIRED_FIELDS: (keyof Amostra)[] = [
  "Amostra",
  "Situação",
  "Cliente",
  "Empresa",
  "Chegada",
  "Ensaio",
  "DiasRestantes",
  "DataProgFimCalculada",
];

const columns: { key: keyof Amostra; label: string }[] = [
  { key: "Amostra", label: "Amostra" },
  { key: "Situação", label: "Situação" },
  { key: "Cliente", label: "Cliente" },
  { key: "Empresa", label: "Empresa" },
  { key: "Chegada", label: "Chegada" },
  { key: "Ensaio", label: "Ensaio" },
  { key: "DiasRestantes", label: "Dias Restantes" },
  { key: "DataProgFimCalculada", label: "Previsão Conclusão" },
];

const situacaoColors: Record<string, string> = {
  Atrasado: "bg-red-600 text-white border-red-700",
  Hoje: "bg-orange-500 text-white border-orange-600",
  "Amanhã": "bg-amber-400 text-black border-amber-500",
  "Proximo do Vencimento": "bg-yellow-500 text-black border-yellow-600",
  Normal: "bg-blue-500 text-white border-blue-600",
  "Em dia": "bg-emerald-500 text-white border-emerald-600",
};

function getStoredEndpoint(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredEndpoint = JSON.parse(raw);
    if (Date.now() > parsed.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed.url;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function saveEndpoint(url: string) {
  const data: StoredEndpoint = {
    url,
    expiresAt: Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearEndpoint() {
  localStorage.removeItem(STORAGE_KEY);
}

function validateResponse(json: unknown): json is Amostra[] {
  if (!Array.isArray(json)) return false;
  if (json.length === 0) return true;
  const first = json[0];
  if (typeof first !== "object" || first === null) return false;
  return REQUIRED_FIELDS.every((field) => field in first);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Setup Screen ───────────────────────────────────────────────────
const EndpointSetup = ({
  onConnect,
}: {
  onConnect: (url: string) => void;
}) => {
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch {
      setError("URL inválida.");
      return;
    }

    setTesting(true);
    setError(null);

    try {
      const res = await fetch(trimmed);
      if (!res.ok) throw new Error(`Servidor retornou status ${res.status}`);
      const json = await res.json();
      if (!validateResponse(json)) {
        setError("O formato dos dados retornados não é compatível.");
        return;
      }
      saveEndpoint(trimmed);
      onConnect(trimmed);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("formato")) {
        setError(e.message);
      } else {
        setError("Não foi possível conectar ao endpoint.");
      }
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background text-foreground px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-xl p-8 w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Link2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-display">Configurar Endpoint</h1>
          <p className="text-sm text-muted-foreground">
            Informe a URL da API para carregar os dados de análises.
          </p>
        </div>

        <div className="space-y-3">
          <Input
            placeholder="https://..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleConnect()}
            className="bg-background/50"
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <Button
            onClick={handleConnect}
            disabled={testing || !url.trim()}
            className="w-full gap-2"
          >
            {testing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Verificando...
              </>
            ) : (
              "Conectar"
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          A conexão ficará salva neste navegador por 15 dias.
        </p>
      </motion.div>
    </div>
  );
};

// ─── Main Dashboard ─────────────────────────────────────────────────
const Dashboard = ({
  apiUrl,
  onDisconnect,
}: {
  apiUrl: string;
  onDisconnect: () => void;
}) => {
  const [data, setData] = useState<Amostra[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Partial<Record<keyof Amostra, string>>>({});
  const [sortKey, setSortKey] = useState<keyof Amostra | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const [activeSituacao, setActiveSituacao] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json = await res.json();
      if (!validateResponse(json)) {
        setError("O formato dos dados retornados não é compatível.");
        setData([]);
        return;
      }
      setData(json);
    } catch (e: unknown) {
      if (e instanceof Error && e.message.includes("formato")) {
        setError(e.message);
      } else {
        setError("Erro ao carregar dados da API.");
      }
    } finally {
      setLoading(false);
      setCountdown(AUTO_REFRESH_SECONDS);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchData();
          return AUTO_REFRESH_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const handleSort = (key: keyof Amostra) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") {
        setSortKey(null);
        setSortDir(null);
      }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handleFilterChange = (key: keyof Amostra, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (activeSituacao && item["Situação"] !== activeSituacao) return false;
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = item[key as keyof Amostra];
        if (key === "Chegada" || key === "DataProgFimCalculada") {
          return formatDate(String(cellValue))
            .toLowerCase()
            .includes(value.toLowerCase());
        }
        return String(cellValue).toLowerCase().includes(value.toLowerCase());
      });
    });
  }, [data, filters, activeSituacao]);

  const situacaoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of data) {
      counts[item["Situação"]] = (counts[item["Situação"]] || 0) + 1;
    }
    return counts;
  }, [data]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sortDir === "asc" ? -1 : 1;
      if (aStr > bStr) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const SortIcon = ({ col }: { col: keyof Amostra }) => {
    if (sortKey !== col)
      return <ArrowUpDown className="w-4 h-4 ml-1.5 opacity-40" />;
    if (sortDir === "asc")
      return <ArrowUp className="w-4 h-4 ml-1.5 text-primary" />;
    return <ArrowDown className="w-4 h-4 ml-1.5 text-primary" />;
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto px-4 pt-6 pb-4 flex flex-col h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 shrink-0 mb-4"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <Button
              onClick={fetchData}
              disabled={loading}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Atualizar
            </Button>
            <span className="text-sm text-muted-foreground">
              Atualização automática em{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatCountdown(countdown)}
              </span>
            </span>
            <span className="text-sm text-muted-foreground ml-auto">
              {data.length} registro{data.length !== 1 ? "s" : ""}
              {filtered.length !== data.length &&
                ` (${filtered.length} filtrado${filtered.length !== 1 ? "s" : ""})`}
            </span>
            <Button
              onClick={onDisconnect}
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-red-400"
              title="Desconectar endpoint"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">Desconectar</span>
            </Button>
          </div>

          {/* Quick filter buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={activeSituacao === null ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSituacao(null)}
              className="h-7 text-xs"
            >
              Todos ({data.length})
            </Button>
            {Object.entries(situacaoColors).map(([sit, cls]) => (
              <button
                key={sit}
                onClick={() =>
                  setActiveSituacao(activeSituacao === sit ? null : sit)
                }
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer ${cls} ${
                  activeSituacao === sit
                    ? "ring-2 ring-offset-2 ring-offset-background ring-white/50 scale-110"
                    : activeSituacao !== null
                      ? "opacity-40 hover:opacity-70"
                      : "hover:opacity-80"
                }`}
              >
                {sit} {situacaoCounts[sit] ? `(${situacaoCounts[sit]})` : ""}
              </button>
            ))}
          </div>
        </motion.div>

        {error && (
          <div className="mb-3 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm shrink-0">
            {error}
          </div>
        )}

        {/* Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-lg flex flex-col min-h-0 flex-1 overflow-hidden"
        >
          <div className="overflow-auto flex-1 scrollbar-hide">
            <table className="w-full caption-bottom text-sm">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm border-b-2 border-border shadow-sm">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`h-auto px-4 py-3 text-left align-top font-medium text-foreground ${
                        col.key === "Cliente" || col.key === "Ensaio"
                          ? "min-w-[300px]"
                          : col.key === "Empresa"
                            ? "min-w-[220px]"
                            : ""
                      }`}
                    >
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center text-left font-bold text-sm hover:text-primary transition-colors w-full mb-2"
                      >
                        {col.label}
                        <SortIcon col={col.key} />
                      </button>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                        <Input
                          placeholder="Filtrar..."
                          value={filters[col.key] || ""}
                          onChange={(e) =>
                            handleFilterChange(col.key, e.target.value)
                          }
                          className="h-7 text-xs pl-7 bg-background/50"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {loading && data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-12 p-4"
                    >
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Carregando...
                      </span>
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="text-center py-12 p-4 text-muted-foreground"
                    >
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  sorted.map((item, i) => {
                    const colorClass =
                      situacaoColors[item["Situação"]] ||
                      "bg-muted text-muted-foreground";
                    return (
                      <tr
                        key={`${item.Amostra}-${i}`}
                        className="border-b transition-colors hover:bg-muted/30"
                      >
                        <td className="p-4 font-mono text-xs whitespace-nowrap">
                          {item.Amostra}
                        </td>
                        <td className="p-4">
                          <Badge className={colorClass}>
                            {item["Situação"]}
                          </Badge>
                        </td>
                        <td className="p-4 min-w-[300px]" title={item.Cliente}>
                          {item.Cliente}
                        </td>
                        <td
                          className="p-4 min-w-[220px]"
                          title={item.Empresa}
                        >
                          {item.Empresa}
                        </td>
                        <td className="p-4 whitespace-nowrap text-xs">
                          {formatDate(item.Chegada)}
                        </td>
                        <td className="p-4 min-w-[300px]" title={item.Ensaio}>
                          {item.Ensaio}
                        </td>
                        <td className="p-4">
                          <span
                            className={`font-bold ${
                              item.DiasRestantes < 0
                                ? "text-red-400"
                                : item.DiasRestantes <= 2
                                  ? "text-amber-400"
                                  : "text-emerald-400"
                            }`}
                          >
                            {item.DiasRestantes}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-xs">
                          {formatDate(item.DataProgFimCalculada)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// ─── Page Root ──────────────────────────────────────────────────────
const AnalisesPrazos = () => {
  const [apiUrl, setApiUrl] = useState<string | null>(() => getStoredEndpoint());

  const handleConnect = (url: string) => {
    setApiUrl(url);
  };

  const handleDisconnect = () => {
    clearEndpoint();
    setApiUrl(null);
  };

  if (!apiUrl) {
    return <EndpointSetup onConnect={handleConnect} />;
  }

  return <Dashboard apiUrl={apiUrl} onDisconnect={handleDisconnect} />;
};

export default AnalisesPrazos;
