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
  ChevronLeft,
  ChevronRight,
  TableProperties,
  CalendarDays,
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
  Situação: string;
  Cliente: string;
  Empresa: string;
  Chegada: string;
  Ensaio: string;
  DiasRestantes: number;
  DataProgFimCalculada: string;
  Lab: string;
}

type SortDirection = "asc" | "desc" | null;
type ViewMode = "tabela" | "agenda";

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
  Amanhã: "bg-amber-400 text-black border-amber-500",
  "Proximo do Vencimento": "bg-yellow-500 text-black border-yellow-600",
  Normal: "bg-blue-500 text-white border-blue-600",
  "Em dia": "bg-emerald-500 text-white border-emerald-600",
};

const situacaoBarColors: Record<string, { bg: string; border: string; text: string }> = {
  Atrasado: { bg: "rgb(220 38 38)", border: "rgb(185 28 28)", text: "#fff" },
  Hoje: { bg: "rgb(249 115 22)", border: "rgb(234 88 12)", text: "#fff" },
  Amanhã: { bg: "rgb(251 191 36)", border: "rgb(245 158 11)", text: "#000" },
  "Proximo do Vencimento": { bg: "rgb(234 179 8)", border: "rgb(202 138 4)", text: "#000" },
  Normal: { bg: "rgb(59 130 246)", border: "rgb(37 99 235)", text: "#fff" },
  "Em dia": { bg: "rgb(16 185 129)", border: "rgb(5 150 105)", text: "#fff" },
};

// ─── Utils ──────────────────────────────────────────────────────────

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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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

// ─── Calendar helpers ───────────────────────────────────────────────
const BAR_H = 20;
const BAR_GAP = 2;
const DAY_NUM_H = 26;
const MAX_VISIBLE_BARS = 3;

function buildCalendarWeeks(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const start = new Date(firstDay);
  start.setDate(start.getDate() - start.getDay()); // back to Sunday

  const weeks: Date[][] = [];
  const cur = new Date(start);

  while (cur <= lastDay || weeks.length < 5) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(week);
    if (cur > lastDay && weeks.length >= 5) break;
  }
  return weeks;
}

interface WeekBar {
  item: Amostra;
  startCol: number;
  endCol: number;
  lane: number;
}

function computeWeekBars(week: Date[], items: Amostra[]): WeekBar[] {
  const weekStart = startOfDay(week[0]);
  const weekEnd = startOfDay(week[6]);
  const msDay = 86400000;

  const overlapping = items
    .filter((item) => {
      const s = startOfDay(new Date(item.Chegada));
      const e = startOfDay(new Date(item.DataProgFimCalculada));
      return s <= weekEnd && e >= weekStart;
    })
    .sort((a, b) => {
      const as = new Date(a.Chegada).getTime();
      const bs = new Date(b.Chegada).getTime();
      if (as !== bs) return as - bs;
      const ad = new Date(a.DataProgFimCalculada).getTime() - as;
      const bd = new Date(b.DataProgFimCalculada).getTime() - bs;
      return bd - ad;
    });

  const bars: WeekBar[] = [];
  const lanes: boolean[][] = [];

  for (const item of overlapping) {
    const s = startOfDay(new Date(item.Chegada));
    const e = startOfDay(new Date(item.DataProgFimCalculada));

    const startCol = Math.max(0, Math.round((s.getTime() - weekStart.getTime()) / msDay));
    const endCol = Math.min(6, Math.round((e.getTime() - weekStart.getTime()) / msDay));

    let lane = 0;
    while (true) {
      if (!lanes[lane]) lanes[lane] = Array(7).fill(false);
      if (!lanes[lane].slice(startCol, endCol + 1).some(Boolean)) break;
      lane++;
    }
    for (let c = startCol; c <= endCol; c++) lanes[lane][c] = true;

    bars.push({ item, startCol, endCol, lane });
  }

  return bars;
}

function overflowPerDay(bars: WeekBar[]): number[] {
  const counts = Array(7).fill(0);
  const visible = Array(7).fill(0);
  for (const b of bars) {
    for (let c = b.startCol; c <= b.endCol; c++) {
      counts[c]++;
      if (b.lane < MAX_VISIBLE_BARS) visible[c]++;
    }
  }
  return counts.map((total, i) => total - visible[i]);
}

// ─── Calendar View ──────────────────────────────────────────────────
const CalendarView = ({ data }: { data: Amostra[] }) => {
  const today = startOfDay(new Date());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [tooltip, setTooltip] = useState<{
    item: Amostra;
    x: number;
    y: number;
  } | null>(null);

  const weeks = useMemo(() => buildCalendarWeeks(year, month), [year, month]);

  const weekBars = useMemo(
    () => weeks.map((week) => computeWeekBars(week, data)),
    [weeks, data]
  );

  const goMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m);
    setYear(y);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const weekRowH = DAY_NUM_H + MAX_VISIBLE_BARS * (BAR_H + BAR_GAP) + 18;

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {/* Month nav */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goMonth(-1)}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-base font-bold font-display min-w-[180px] text-center">
          {MONTH_NAMES[month]} {year}
        </h2>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goMonth(1)}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={goToday}>
          Hoje
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="glass-card rounded-lg flex flex-col min-h-0 flex-1 overflow-auto">
        {/* Weekday header */}
        <div className="grid grid-cols-7 shrink-0 border-b-2 border-border bg-muted/95 backdrop-blur-sm sticky top-0 z-10">
          {WEEKDAY_SHORT.map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-bold py-2 ${i === 0 || i === 6 ? "text-muted-foreground/70" : "text-foreground"
                }`}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Week rows */}
        <div className="flex-1">
          {weeks.map((week, wi) => {
            const bars = weekBars[wi];
            const overflow = overflowPerDay(bars);

            return (
              <div
                key={wi}
                className="grid grid-cols-7 border-b border-border/50"
                style={{ minHeight: weekRowH }}
              >
                {week.map((day, di) => {
                  const isCurMonth = day.getMonth() === month;
                  const isToday =
                    day.getFullYear() === today.getFullYear() &&
                    day.getMonth() === today.getMonth() &&
                    day.getDate() === today.getDate();
                  const isWeekend = di === 0 || di === 6;

                  // bars that START in this cell (to render once)
                  const cellBars = bars.filter(
                    (b) => b.startCol === di && b.lane < MAX_VISIBLE_BARS
                  );

                  return (
                    <div
                      key={di}
                      className={`relative border-r border-border/30 ${!isCurMonth
                        ? "bg-muted/30"
                        : isToday
                          ? "bg-primary/5"
                          : isWeekend
                            ? "bg-muted/10"
                            : ""
                        }`}
                      style={{ minHeight: weekRowH }}
                    >
                      {/* Day number */}
                      <div className="flex justify-end px-1.5 pt-1" style={{ height: DAY_NUM_H }}>
                        <span
                          className={`text-xs font-semibold leading-none ${isToday
                            ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center"
                            : !isCurMonth
                              ? "text-muted-foreground/40"
                              : isWeekend
                                ? "text-muted-foreground/60"
                                : "text-foreground"
                            }`}
                        >
                          {day.getDate()}
                        </span>
                      </div>

                      {/* Bars that start in this cell */}
                      {cellBars.map((bar) => {
                        const colors = situacaoBarColors[bar.item.Situação] || {
                          bg: "#888",
                          border: "#666",
                          text: "#fff",
                        };
                        const span = bar.endCol - bar.startCol + 1;
                        const itemStart = startOfDay(new Date(bar.item.Chegada));
                        const itemEnd = startOfDay(new Date(bar.item.DataProgFimCalculada));
                        const weekStart = startOfDay(week[0]);
                        const weekEnd = startOfDay(week[6]);
                        const extendsLeft = itemStart < weekStart;
                        const extendsRight = itemEnd > weekEnd;

                        return (
                          <div
                            key={`${bar.item.Amostra}-${bar.lane}`}
                            className="absolute cursor-pointer hover:brightness-110 hover:z-20 z-[3]"
                            style={{
                              left: 2,
                              right: 0,
                              width: `calc(${span * 100}% - 4px)`,
                              top: DAY_NUM_H + bar.lane * (BAR_H + BAR_GAP),
                              height: BAR_H,
                              backgroundColor: colors.bg,
                              borderWidth: 1,
                              borderColor: colors.border,
                              borderRadius: `${extendsLeft ? 0 : 4}px ${extendsRight ? 0 : 4}px ${extendsRight ? 0 : 4}px ${extendsLeft ? 0 : 4}px`,
                              color: colors.text,
                            }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              setTooltip({
                                item: bar.item,
                                x: rect.left + rect.width / 2,
                                y: rect.top,
                              });
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            <div className="px-1 h-full flex items-center overflow-hidden text-[10px] leading-none font-semibold">
                              <span className="truncate">
                                {bar.item.Amostra}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Overflow indicator */}
                      {overflow[di] > 0 && (
                        <div
                          className="absolute left-1 text-[10px] font-semibold text-muted-foreground"
                          style={{
                            top: DAY_NUM_H + MAX_VISIBLE_BARS * (BAR_H + BAR_GAP),
                          }}
                        >
                          +{overflow[di]} mais
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y - 8,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-popover border border-border rounded-lg shadow-xl px-3 py-2.5 text-xs space-y-1 max-w-xs">
              <p className="font-bold font-mono">{tooltip.item.Amostra}</p>
              <p>
                <span className="text-muted-foreground">Cliente:</span> {tooltip.item.Cliente}
              </p>
              <p>
                <span className="text-muted-foreground">Empresa:</span> {tooltip.item.Empresa}
              </p>
              <p>
                <span className="text-muted-foreground">Ensaio:</span> {tooltip.item.Ensaio}
              </p>
              <div className="flex items-center gap-2">
                <Badge
                  className={`${situacaoColors[tooltip.item.Situação] || ""} text-[10px] px-1.5 py-0`}
                >
                  {tooltip.item.Situação}
                </Badge>
                <span className="text-muted-foreground">
                  {tooltip.item.DiasRestantes} dia
                  {Math.abs(tooltip.item.DiasRestantes) !== 1 ? "s" : ""} restante
                  {Math.abs(tooltip.item.DiasRestantes) !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="text-muted-foreground pt-0.5">
                Chegada: {formatDate(tooltip.item.Chegada)}
              </div>
              <div className="text-muted-foreground">
                Previsão: {formatDate(tooltip.item.DataProgFimCalculada)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Table View ─────────────────────────────────────────────────────
const TableView = ({ data }: { data: Amostra[] }) => {
  const [filters, setFilters] = useState<Partial<Record<keyof Amostra, string>>>({});
  const [sortKey, setSortKey] = useState<keyof Amostra | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

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
    return data.filter((item) =>
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const cellValue = item[key as keyof Amostra];
        if (key === "Chegada" || key === "DataProgFimCalculada") {
          return formatDate(String(cellValue))
            .toLowerCase()
            .includes(value.toLowerCase());
        }
        return String(cellValue).toLowerCase().includes(value.toLowerCase());
      })
    );
  }, [data, filters]);

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
    if (sortKey !== col) return <ArrowUpDown className="w-4 h-4 ml-1.5 opacity-40" />;
    if (sortDir === "asc") return <ArrowUp className="w-4 h-4 ml-1.5 text-primary" />;
    return <ArrowDown className="w-4 h-4 ml-1.5 text-primary" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card rounded-lg flex flex-col min-h-0 flex-1 overflow-hidden"
    >
      <div className="overflow-auto flex-1 scrollbar-hide">
        <table className="w-full caption-bottom text-sm">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm border-b-2 border-border shadow-sm">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`h-auto px-4 py-3 text-left align-top font-medium text-foreground ${col.key === "Cliente" || col.key === "Ensaio"
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
                      onChange={(e) => handleFilterChange(col.key, e.target.value)}
                      className="h-7 text-xs pl-7 bg-background/50"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 p-4 text-muted-foreground">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              sorted.map((item, i) => {
                const colorClass =
                  situacaoColors[item.Situação] || "bg-muted text-muted-foreground";
                return (
                  <tr
                    key={`${item.Amostra}-${i}`}
                    className="border-b transition-colors hover:bg-muted/30"
                  >
                    <td className="p-4 font-mono text-xs whitespace-nowrap">{item.Amostra}</td>
                    <td className="p-4">
                      <Badge className={colorClass}>{item.Situação}</Badge>
                    </td>
                    <td className="p-4 min-w-[300px]" title={item.Cliente}>{item.Cliente}</td>
                    <td className="p-4 min-w-[220px]" title={item.Empresa}>{item.Empresa}</td>
                    <td className="p-4 whitespace-nowrap text-xs">{formatDate(item.Chegada)}</td>
                    <td className="p-4 min-w-[300px]" title={item.Ensaio}>{item.Ensaio}</td>
                    <td className="p-4">
                      <span
                        className={`font-bold ${item.DiasRestantes < 0
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
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS);
  const [activeSituacao, setActiveSituacao] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("tabela");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const labParam = new URLSearchParams(window.location.search).get("lab");

    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const json = await res.json();
      if (!validateResponse(json)) {
        setError("O formato dos dados retornados não é compatível.");
        setData([]);
        return;
      }
      console.log("Dados carregados:", json);
      const fitredList = json.filter((item) => item.Lab === labParam);
      setData(fitredList);
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

  const situacaoCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of data) {
      counts[item.Situação] = (counts[item.Situação] || 0) + 1;
    }
    return counts;
  }, [data]);

  const filteredBySituacao = useMemo(() => {
    if (!activeSituacao) return data;
    return data.filter((item) => item.Situação === activeSituacao);
  }, [data, activeSituacao]);

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto px-4 pt-6 pb-4 flex flex-col h-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 shrink-0 mb-4"
        >
          <div className="flex items-center gap-3 flex-wrap">
            {/* View toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setViewMode("tabela")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "tabela"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted text-muted-foreground"
                  }`}
              >
                <TableProperties className="w-3.5 h-3.5" />
                Tabela
              </button>
              <button
                onClick={() => setViewMode("agenda")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${viewMode === "agenda"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted text-muted-foreground"
                  }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Agenda
              </button>
            </div>

            <div className="w-px h-6 bg-border hidden sm:block" />

            <Button onClick={fetchData} disabled={loading} variant="outline" className="gap-2" size="sm">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <span className="text-xs text-muted-foreground">
              Auto{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatCountdown(countdown)}
              </span>
            </span>

            <span className="text-xs text-muted-foreground ml-auto">
              {data.length} registro{data.length !== 1 ? "s" : ""}
              {filteredBySituacao.length !== data.length &&
                ` (${filteredBySituacao.length} filtrado${filteredBySituacao.length !== 1 ? "s" : ""})`}
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
                onClick={() => setActiveSituacao(activeSituacao === sit ? null : sit)}
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all cursor-pointer ${cls} ${activeSituacao === sit
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

        {loading && data.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-muted-foreground" />
              <span className="text-muted-foreground">Carregando...</span>
            </div>
          </div>
        ) : viewMode === "tabela" ? (
          <TableView data={filteredBySituacao} />
        ) : (
          <CalendarView data={filteredBySituacao} />
        )}
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
