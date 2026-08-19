"use client";

import * as React from "react";
import Link from "next/link";
import {
  Avatar,
  Box,
  Card,
  Chip,
  CircularProgress,
  Grid,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import FlightTakeoffIcon from "@mui/icons-material/FlightTakeoff";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import { useDepartment } from "@/context/DepartmentContext";
import api from "@/api/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DashStats {
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    revenue: number;
    paid: number;
  };
  customers: { total: number };
  tasks: { pending: number; in_progress: number; completed: number };
  recent_bookings: any[];
  my_tasks: any[];
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
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
            <Skeleton variant="text" width={80} height={36} />
          ) : (
            <Typography variant="h4" fontWeight={700} className="text-black" sx={{ fontSize: { xs: 22, sm: 26 } }}>
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

// ── Status chip helpers ────────────────────────────────────────────────────────

const bookingStatusColor: Record<string, string> = {
  active: "#4caf50", confirmed: "#4caf50", pending: "#ff9800",
  cancelled: "#f44336", completed: "#2196f3",
};
const taskStatusColor: Record<string, string> = {
  pending: "#ff9800", in_progress: "#2196f3", completed: "#4caf50", cancelled: "#f44336",
};
const serviceColor: Record<string, string> = {
  flight: "#605DFF", hotel: "#2196f3", visa: "#ff9800",
  transport: "#4caf50", activity: "#e91e63",
};

// Departure-proximity palette — muted, professional accent tones rather than
// flat warning colors, so the highlight reads as "informational" not "error".
const URGENCY = {
  risk: { bg: "rgba(225,29,72,0.06)", stripe: "#e11d48", chipBg: "rgba(225,29,72,0.12)", chipText: "#be123c" },
  soon: { bg: "rgba(217,119,6,0.06)", stripe: "#d97706", chipBg: "rgba(217,119,6,0.12)", chipText: "#b45309" },
};

const daysUntil = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

function StatusChip({ label, colorMap }: { label: string; colorMap: Record<string, string> }) {
  const color = colorMap[label] ?? "#9e9e9e";
  return (
    <Chip
      label={label.replace("_", " ")}
      size="small"
      sx={{
        bgcolor: color + "22",
        color,
        fontWeight: 700,
        fontSize: 11,
        height: 22,
        textTransform: "capitalize",
        "& .MuiChip-label": { px: 1 },
      }}
    />
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AeroDashboard() {
  const { user, isSuperAdmin, hasPermission } = useDepartment();
  const [stats, setStats] = React.useState<DashStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  const canViewBookings  = isSuperAdmin || hasPermission("view-bookings");
  const canViewTasks     = isSuperAdmin || hasPermission("view-tasks");
  const canViewCustomers = isSuperAdmin || hasPermission("view-customers");

  React.useEffect(() => {
    api.get<DashStats>("/api/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <>
      {/* ── Welcome Banner ─────────────────────────────────────────────────── */}
      <Card
        className="rmui-card"
        sx={{
          boxShadow: "none",
          borderRadius: "7px",
          mb: "25px",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            background: "linear-gradient(135deg, #605DFF 0%, #8B89FF 60%, #a78bfa 100%)",
            px: { xs: 2.5, md: 4 },
            py: { xs: 2.5, md: 3 },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={800} color="#fff" sx={{ mb: 0.5 }}>
              {greeting}, {firstName}! 👋
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
              Here&apos;s a snapshot of your workspace today.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {user?.roles?.map((r) => (
              <Chip
                key={r.id}
                label={r.name}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff", fontWeight: 600, fontSize: 11 }}
              />
            ))}
            {user?.department_user_roles?.map((dur) => (
              <Chip
                key={dur.id}
                label={dur.department_role?.department?.name}
                size="small"
                sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 11 }}
              />
            ))}
          </Box>
        </Box>
      </Card>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        {canViewBookings && (
          <>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                label="Total Bookings"
                value={stats?.bookings.total ?? 0}
                sub={`${stats?.bookings.pending ?? 0} pending`}
                icon={<FlightTakeoffIcon />}
                color="#605DFF"
                loading={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                label="Total Revenue"
                value={`£${(stats?.bookings.revenue ?? 0).toLocaleString()}`}
                sub={`£${(stats?.bookings.paid ?? 0).toLocaleString()} collected`}
                icon={<AttachMoneyIcon />}
                color="#4caf50"
                loading={loading}
              />
            </Grid>
          </>
        )}

        {canViewCustomers && (
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              label="Total Customers"
              value={stats?.customers.total ?? 0}
              icon={<PeopleIcon />}
              color="#2196f3"
              loading={loading}
            />
          </Grid>
        )}

        {canViewTasks && (
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              label="Pending Tasks"
              value={(stats?.tasks.pending ?? 0) + (stats?.tasks.in_progress ?? 0)}
              sub={`${stats?.tasks.completed ?? 0} completed`}
              icon={<AssignmentIcon />}
              color="#ff9800"
              loading={loading}
            />
          </Grid>
        )}
      </Grid>

      {/* ── Main Content Grid ────────────────────────────────────────────── */}
      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 3 }}>

        {/* Recent Bookings Table */}
        {canViewBookings && (
          <Grid item xs={12} lg={isSuperAdmin ? 8 : 12}>
            <Card
              className="rmui-card"
              sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", overflow: "hidden" }}
            >
              <Box
                sx={{
                  px: { xs: 2, md: 3 },
                  py: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography fontWeight={700} fontSize={15}>Recent Bookings</Typography>
                <Link href="/bookings/manage-bookings/" style={{ fontSize: 13, color: "#605DFF", textDecoration: "none" }}>
                  View all →
                </Link>
              </Box>

              {loading ? (
                <Box sx={{ p: 2 }}>
                  {[1, 2, 3, 4].map((n) => <Skeleton key={n} variant="text" height={44} sx={{ mb: 0.5 }} />)}
                </Box>
              ) : (
                <Box sx={{ overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ "& th": { bgcolor: "#f6f7f9", fontWeight: 700, fontSize: 12, py: 1.2, color: "text.secondary", whiteSpace: "nowrap" } }}>
                        <TableCell>Booking #</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Payment</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(stats?.recent_bookings ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.secondary", fontSize: 13 }}>
                            No bookings yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        (stats?.recent_bookings ?? []).map((b: any) => {
                          const days = daysUntil(b.departure_date);
                          const departingSoon = days !== null && days >= 0 && days <= 30;
                          const atRisk = departingSoon && b.is_payment_overdue;
                          const urgency = atRisk ? URGENCY.risk : departingSoon ? URGENCY.soon : null;
                          return (
                            <TableRow
                              key={b.id}
                              hover
                              sx={{
                                "& td": { fontSize: 13, py: 1.2, borderColor: "divider" },
                                cursor: "pointer",
                                bgcolor: urgency?.bg,
                                borderLeft: urgency ? `3px solid ${urgency.stripe}` : "3px solid transparent",
                              }}
                              onClick={() => window.location.href = `/bookings/view-booking/${b.booking_number}`}
                            >
                              <TableCell>
                                <Typography fontSize={13} fontWeight={600} color="#605DFF">{b.booking_number}</Typography>
                              </TableCell>
                              <TableCell sx={{ textTransform: "capitalize" }}>{b.booking_type}</TableCell>
                              <TableCell>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                                  {b.departure_date ?? b.booking_date ?? "—"}
                                  {atRisk && (
                                    <Chip label="At Risk" size="small" sx={{ bgcolor: URGENCY.risk.chipBg, color: URGENCY.risk.chipText, fontWeight: 700, fontSize: 10, height: 19 }} />
                                  )}
                                  {!atRisk && departingSoon && (
                                    <Chip label="Departing Soon" size="small" sx={{ bgcolor: URGENCY.soon.chipBg, color: URGENCY.soon.chipText, fontWeight: 700, fontSize: 10, height: 19 }} />
                                  )}
                                </Box>
                              </TableCell>
                              <TableCell>
                                <StatusChip label={b.status ?? "pending"} colorMap={bookingStatusColor} />
                              </TableCell>
                              <TableCell>
                                <StatusChip label={b.payment_status ?? "Unpaid"} colorMap={{ Paid: "#2196f3", "Partially Paid": "#ff9800", Unpaid: "#9e9e9e" }} />
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600 }}>
                                {b.selling_cost ? `£${Number(b.selling_cost).toLocaleString()}` : "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Card>
          </Grid>
        )}

        {/* Task Summary (SuperAdmin/Admin + right column) */}
        {canViewTasks && isSuperAdmin && (
          <Grid item xs={12} lg={4}>
            <Card
              className="rmui-card"
              sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px" }}
            >
              <Box sx={{ px: { xs: 2, md: 3 }, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography fontWeight={700} fontSize={15}>Task Overview</Typography>
              </Box>
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                {loading ? (
                  [1, 2, 3].map((n) => <Skeleton key={n} variant="rounded" height={52} sx={{ mb: 1.5 }} />)
                ) : (
                  [
                    { label: "Pending", value: stats?.tasks.pending ?? 0, color: "#ff9800", icon: <PendingActionsIcon fontSize="small" /> },
                    { label: "In Progress", value: stats?.tasks.in_progress ?? 0, color: "#2196f3", icon: <AssignmentIcon fontSize="small" /> },
                    { label: "Completed", value: stats?.tasks.completed ?? 0, color: "#4caf50", icon: <CheckCircleIcon fontSize="small" /> },
                  ].map((row) => (
                    <Box
                      key={row.label}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: row.color + "11",
                        mb: 1.5,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: row.color }}>
                        {row.icon}
                        <Typography fontWeight={600} fontSize={13} sx={{ color: row.color }}>
                          {row.label}
                        </Typography>
                      </Box>
                      <Typography fontWeight={800} fontSize={20} sx={{ color: row.color }}>
                        {row.value}
                      </Typography>
                    </Box>
                  ))
                )}
                <Box sx={{ mt: 1, textAlign: "right" }}>
                  <Link href="/bookings/booking-tasks/" style={{ fontSize: 13, color: "#605DFF", textDecoration: "none" }}>
                    Manage tasks →
                  </Link>
                </Box>
              </Box>
            </Card>
          </Grid>
        )}

        {/* My Assigned Tasks (non-SuperAdmin) */}
        {canViewTasks && !isSuperAdmin && (stats?.my_tasks?.length ?? 0) > 0 && (
          <Grid item xs={12}>
            <Card
              className="rmui-card"
              sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", overflow: "hidden" }}
            >
              <Box
                sx={{
                  px: { xs: 2, md: 3 },
                  py: 2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography fontWeight={700} fontSize={15}>My Assigned Tasks</Typography>
                <Link href="/bookings/booking-tasks/" style={{ fontSize: 13, color: "#605DFF", textDecoration: "none" }}>
                  View all →
                </Link>
              </Box>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { bgcolor: "#f6f7f9", fontWeight: 700, fontSize: 12, py: 1.2, color: "text.secondary", whiteSpace: "nowrap" } }}>
                      <TableCell>Booking #</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Departure</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(stats?.my_tasks ?? []).map((t: any) => (
                      <TableRow key={t.id} hover sx={{ "& td": { fontSize: 13, py: 1.2, borderColor: "divider" } }}>
                        <TableCell>
                          <Typography fontSize={13} fontWeight={600} color="#605DFF">
                            {t.booking?.booking_number ?? "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.service_type}
                            size="small"
                            sx={{
                              bgcolor: (serviceColor[t.service_type] ?? "#9e9e9e") + "22",
                              color: serviceColor[t.service_type] ?? "#9e9e9e",
                              fontWeight: 700,
                              fontSize: 11,
                              height: 22,
                              textTransform: "capitalize",
                              "& .MuiChip-label": { px: 1 },
                            }}
                          />
                        </TableCell>
                        <TableCell>{t.booking?.departure_date ?? "—"}</TableCell>
                        <TableCell>
                          <StatusChip label={t.status} colorMap={taskStatusColor} />
                        </TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.notes ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>
    </>
  );
}
