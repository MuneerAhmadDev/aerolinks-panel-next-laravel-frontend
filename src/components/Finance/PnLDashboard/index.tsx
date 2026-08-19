"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Box,
  Card,
  Grid,
  Typography,
  Skeleton,
  Divider,
  TextField,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Alert,
  Avatar,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SavingsIcon from "@mui/icons-material/Savings";
import RefreshIcon from "@mui/icons-material/Refresh";
import api from "@/api/api";

// ApexCharts — SSR-safe dynamic import
const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

// ── Types ─────────────────────────────────────────────────────────────────────

interface PnLData {
  period: { from: string; to: string };
  revenue: number;
  payments_collected: number;
  outstanding: number;
  supplier_costs: number;
  general_expenses: number;
  commission_liability: number;
  gross_profit: number;
  net_profit: number;
  margin_pct: number;
  expense_breakdown: { category: string; total: number }[];
}

// ── Currency helper ───────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "£" + n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon, color, loading,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; color: string; loading: boolean;
}) {
  return (
    <Card
      className="rmui-card"
      sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", p: { xs: "18px", sm: "20px", lg: "25px" } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography sx={{ fontSize: "13px", color: "text.secondary", mb: 0.5 }}>{label}</Typography>
          {loading ? (
            <Skeleton variant="text" width={120} height={36} />
          ) : (
            <Typography variant="h4" fontWeight={700} className="text-black" sx={{ fontSize: { xs: 18, sm: 22 } }}>
              {value}
            </Typography>
          )}
          {sub && !loading && (
            <Typography sx={{ fontSize: "12px", color: "text.secondary", mt: 0.25 }}>{sub}</Typography>
          )}
        </Box>
        <Avatar sx={{ bgcolor: color + "22", width: 52, height: 52 }}>
          <Box sx={{ color }}>{icon}</Box>
        </Avatar>
      </Box>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PnLDashboard() {
  // Default range: current month
  const today      = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const todayStr   = today.toISOString().slice(0, 10);

  const [from, setFrom]     = useState(monthStart);
  const [to, setTo]         = useState(todayStr);
  const [data, setData]     = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const fetchPnL = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get<PnLData>("/api/finance/pnl", { params: { from, to } })
      .then((r) => setData(r.data))
      .catch(() => setError("Failed to load financial data. Please try again."))
      .finally(() => setLoading(false));
  }, [from, to]);

  useEffect(() => { fetchPnL(); }, [fetchPnL]);

  // ── Waterfall donut chart (revenue breakdown) ─────────────────────────────
  const donutSeries = data
    ? [data.supplier_costs, data.general_expenses, data.commission_liability,
       Math.max(data.net_profit, 0)]
    : [];
  const donutOptions: ApexCharts.ApexOptions = {
    chart: { type: "donut", toolbar: { show: false } },
    labels: ["Supplier Costs", "Expenses", "Commission Liability", "Net Profit"],
    colors: ["#f44336", "#ff9800", "#9c27b0", "#4caf50"],
    legend: { position: "bottom", fontSize: "13px" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "70%" } } },
    tooltip: { y: { formatter: (v) => "£" + Number(v).toLocaleString("en-GB", { minimumFractionDigits: 2 }) } },
  };

  // ── Bar chart: Revenue vs Supplier Costs vs Expenses ─────────────────────
  const barSeries: ApexCharts.ApexOptions["series"] = [
    { name: "Revenue",        data: data ? [data.revenue] : [0] },
    { name: "Supplier Costs", data: data ? [data.supplier_costs] : [0] },
    { name: "General Expenses", data: data ? [data.general_expenses] : [0] },
    { name: "Net Profit",     data: data ? [data.net_profit] : [0] },
  ];
  const barOptions: ApexCharts.ApexOptions = {
    chart: { type: "bar", toolbar: { show: false } },
    colors: ["#605DFF", "#f44336", "#ff9800", "#4caf50"],
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%", distributed: false } },
    xaxis: { categories: [`${from} – ${to}`], labels: { style: { fontSize: "12px" } } },
    yaxis: { labels: { formatter: (v) => "£" + Number(v).toLocaleString("en-GB") } },
    legend: { position: "bottom", fontSize: "13px" },
    dataLabels: { enabled: false },
    tooltip: { y: { formatter: (v) => "£" + Number(v).toLocaleString("en-GB", { minimumFractionDigits: 2 }) } },
  };

  const netColor = (data?.net_profit ?? 0) >= 0 ? "#4caf50" : "#f44336";

  return (
    <>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <Card
        className="rmui-card"
        sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", overflow: "hidden" }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #605DFF 0%, #8B89FF 60%, #a78bfa 100%)",
            px: { xs: 2.5, md: 4 }, py: { xs: 2, md: 2.5 },
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800} color="#fff" sx={{ mb: 0.5 }}>
              Profit &amp; Loss
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
              Aggregated financial overview for the selected period
            </Typography>
          </Box>
          {data && (
            <Chip
              label={`Margin: ${data.margin_pct}%`}
              sx={{
                bgcolor: (data.margin_pct >= 0 ? "#4caf50" : "#f44336") + "33",
                color: data.margin_pct >= 0 ? "#4caf50" : "#f44336",
                fontWeight: 800, fontSize: 14, height: 32,
                border: "1px solid " + (data.margin_pct >= 0 ? "#4caf5044" : "#f4433644"),
              }}
            />
          )}
        </Box>

        {/* ── Date range filter ──────────────────────────────────────────── */}
        <Box
          sx={{
            px: { xs: 2, md: 4 }, py: 2,
            display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap",
            borderTop: "1px solid", borderColor: "divider",
          }}
        >
          <Typography fontWeight={600} fontSize={13} color="text.secondary" sx={{ mr: 1 }}>
            Date Range:
          </Typography>
          <TextField
            label="From"
            type="date"
            size="small"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={fetchPnL}
            startIcon={<RefreshIcon />}
            sx={{ boxShadow: "none", borderRadius: "6px", textTransform: "none" }}
          >
            Apply
          </Button>

          {/* Quick shortcuts */}
          {[
            { label: "This Month",  from: monthStart,                      to: todayStr },
            { label: "Last 30d",    from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30).toISOString().slice(0, 10), to: todayStr },
            { label: "This Year",   from: `${today.getFullYear()}-01-01`,  to: todayStr },
          ].map((s) => (
            <Button
              key={s.label}
              size="small"
              variant="outlined"
              onClick={() => { setFrom(s.from); setTo(s.to); }}
              sx={{ textTransform: "none", borderRadius: "6px", fontSize: 12 }}
            >
              {s.label}
            </Button>
          ))}
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* ── KPI Stat Cards ──────────────────────────────────────────────── */}
      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Total Revenue"
            value={loading ? "—" : fmt(data?.revenue ?? 0)}
            sub={loading ? undefined : `${fmt(data?.payments_collected ?? 0)} collected`}
            icon={<TrendingUpIcon />}
            color="#605DFF"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Supplier Costs"
            value={loading ? "—" : fmt(data?.supplier_costs ?? 0)}
            sub={loading ? undefined : "Sum of all service internal costs"}
            icon={<LocalShippingIcon />}
            color="#f44336"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="General Expenses"
            value={loading ? "—" : fmt(data?.general_expenses ?? 0)}
            sub={loading ? undefined : `£${(data?.commission_liability ?? 0).toLocaleString()} commissions pending`}
            icon={<ReceiptLongIcon />}
            color="#ff9800"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Net Profit"
            value={loading ? "—" : fmt(data?.net_profit ?? 0)}
            sub={loading ? undefined : `Gross: ${fmt(data?.gross_profit ?? 0)}`}
            icon={(data?.net_profit ?? 0) >= 0 ? <SavingsIcon /> : <TrendingDownIcon />}
            color={loading ? "#9e9e9e" : netColor}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* ── Charts Row ──────────────────────────────────────────────────── */}
      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 3 }}>

        {/* Bar chart */}
        <Grid item xs={12} lg={7}>
          <Card
            className="rmui-card"
            sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", p: { xs: 2, md: 3 } }}
          >
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
              <Typography fontWeight={700} fontSize={15}>Revenue vs Costs</Typography>
              <Typography fontSize={12} color="text.secondary">{from} – {to}</Typography>
            </Box>
            {loading ? (
              <Skeleton variant="rounded" height={280} />
            ) : (
              <ReactApexChart
                options={barOptions}
                series={barSeries}
                type="bar"
                height={280}
              />
            )}
          </Card>
        </Grid>

        {/* Donut chart */}
        <Grid item xs={12} lg={5}>
          <Card
            className="rmui-card"
            sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", p: { xs: 2, md: 3 } }}
          >
            <Typography fontWeight={700} fontSize={15} sx={{ mb: 2 }}>Cost Breakdown</Typography>
            {loading ? (
              <Skeleton variant="circular" width={220} height={220} sx={{ mx: "auto" }} />
            ) : donutSeries.every((v) => v === 0) ? (
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 280, color: "text.secondary" }}>
                <Typography fontSize={13}>No cost data for this period</Typography>
              </Box>
            ) : (
              <ReactApexChart
                options={donutOptions}
                series={donutSeries}
                type="donut"
                height={280}
              />
            )}
          </Card>
        </Grid>
      </Grid>

      {/* ── Bottom Row ──────────────────────────────────────────────────── */}
      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 3 }}>

        {/* Cash Flow Summary */}
        <Grid item xs={12} md={5}>
          <Card
            className="rmui-card"
            sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px" }}
          >
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography fontWeight={700} fontSize={15}>P&amp;L Summary</Typography>
            </Box>
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              {loading ? (
                [1, 2, 3, 4, 5].map((n) => <Skeleton key={n} variant="text" height={36} sx={{ mb: 0.5 }} />)
              ) : (
                <>
                  {[
                    { label: "Booking Revenue",       value: data?.revenue ?? 0,            color: "#605DFF" },
                    { label: "− Supplier Costs",       value: -(data?.supplier_costs ?? 0),  color: "#f44336" },
                    { label: "Gross Profit",           value: data?.gross_profit ?? 0,       color: "#2196f3", divider: true },
                    { label: "− General Expenses",     value: -(data?.general_expenses ?? 0), color: "#ff9800" },
                    { label: "Net Profit",             value: data?.net_profit ?? 0,         color: netColor, bold: true },
                  ].map((row, i) => (
                    <React.Fragment key={i}>
                      {(row as any).divider && <Divider sx={{ my: 1 }} />}
                      <Box
                        sx={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          py: 0.75,
                        }}
                      >
                        <Typography fontSize={13} color="text.secondary">{row.label}</Typography>
                        <Typography
                          fontSize={13}
                          fontWeight={(row as any).bold ? 800 : 600}
                          sx={{ color: row.color }}
                        >
                          {fmt(row.value)}
                        </Typography>
                      </Box>
                    </React.Fragment>
                  ))}
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography fontSize={12} color="text.secondary">Cash Collected</Typography>
                    <Typography fontSize={12} fontWeight={600} color="#4caf50">{fmt(data?.payments_collected ?? 0)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography fontSize={12} color="text.secondary">Outstanding (Unpaid)</Typography>
                    <Typography fontSize={12} fontWeight={600} color="#ff9800">{fmt(data?.outstanding ?? 0)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography fontSize={12} color="text.secondary">Commission Liability</Typography>
                    <Typography fontSize={12} fontWeight={600} color="#9c27b0">{fmt(data?.commission_liability ?? 0)}</Typography>
                  </Box>
                </>
              )}
            </Box>
          </Card>
        </Grid>

        {/* Expense category breakdown */}
        <Grid item xs={12} md={7}>
          <Card
            className="rmui-card"
            sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", overflow: "hidden" }}
          >
            <Box
              sx={{
                px: { xs: 2, md: 3 }, py: 2,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid", borderColor: "divider",
              }}
            >
              <Typography fontWeight={700} fontSize={15}>Expense Breakdown by Category</Typography>
              <Button
                href="/finance/expenses/"
                size="small"
                sx={{ textTransform: "none", fontSize: 12, color: "#605DFF", p: 0, minWidth: 0 }}
              >
                Manage →
              </Button>
            </Box>
            {loading ? (
              <Box sx={{ p: 2 }}>
                {[1, 2, 3, 4].map((n) => <Skeleton key={n} variant="text" height={40} sx={{ mb: 0.5 }} />)}
              </Box>
            ) : (data?.expense_breakdown?.length ?? 0) === 0 ? (
              <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
                <Typography fontSize={13}>No expenses recorded for this period.</Typography>
                <Button href="/finance/expenses/" size="small" variant="outlined" sx={{ mt: 1.5, textTransform: "none", borderRadius: "6px" }}>
                  Add Expense
                </Button>
              </Box>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { bgcolor: "#f6f7f9", fontWeight: 700, fontSize: 12, py: 1.2, color: "text.secondary" } }}>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Share</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data!.expense_breakdown.map((row) => {
                      const share = data!.general_expenses > 0
                        ? ((row.total / data!.general_expenses) * 100).toFixed(1)
                        : "0.0";
                      return (
                        <TableRow key={row.category} hover sx={{ "& td": { fontSize: 13, py: 1, borderColor: "divider" } }}>
                          <TableCell>
                            <Chip
                              label={row.category}
                              size="small"
                              sx={{ bgcolor: "#605DFF22", color: "#605DFF", fontWeight: 600, height: 22, "& .MuiChip-label": { px: 1 } }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(row.total)}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                              <Box
                                sx={{ height: 6, width: `${Math.max(Number(share), 4)}%`, maxWidth: 80, bgcolor: "#605DFF", borderRadius: 3 }}
                              />
                              <Typography fontSize={11} color="text.secondary">{share}%</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow sx={{ "& td": { fontWeight: 700, py: 1, bgcolor: "#f6f7f9" } }}>
                      <TableCell>Total</TableCell>
                      <TableCell align="right">{fmt(data?.general_expenses ?? 0)}</TableCell>
                      <TableCell align="right">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
