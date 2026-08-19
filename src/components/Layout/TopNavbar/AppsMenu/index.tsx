"use client";

import * as React from "react";
import {
  IconButton,
  Tooltip,
  Menu,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Paper,
} from "@mui/material";
import { useRouter } from "next/navigation";
import api from "@/api/api";

// ── Quick-launch items ──────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: "flight_takeoff",  label: "Bookings",      href: "/bookings/manage-bookings/" },
  { icon: "task_alt",        label: "Tasks",         href: "/bookings/booking-tasks/" },
  { icon: "dashboard",       label: "Dashboard",     href: "/dashboard/" },
  { icon: "people",          label: "Employees",     href: "/employees/" },
  { icon: "local_shipping",  label: "Suppliers",     href: "/suppliers/" },
  { icon: "bar_chart",       label: "Reports",       href: "/reports/" },
  { icon: "settings",        label: "Settings",      href: "/site-settings/" },
  { icon: "group",           label: "Users",         href: "/users/" },
];

interface Stats {
  todayBookings: number;
  pendingTasks: number;
  inProgressTasks: number;
  pendingBookings: number;
}

// ── Component ───────────────────────────────────────────────────────────────

const AppsMenu: React.FC = () => {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (!stats) {
      setLoading(true);
      api.get("/api/dashboard/stats")
        .then((r) => {
          setStats({
            todayBookings:   r.data.bookings?.today     ?? 0,
            pendingBookings: r.data.bookings?.pending   ?? 0,
            pendingTasks:    r.data.tasks?.pending      ?? 0,
            inProgressTasks: r.data.tasks?.in_progress ?? 0,
          });
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  };

  const handleClose = () => setAnchorEl(null);

  const navigate = (href: string) => {
    handleClose();
    router.push(href);
  };

  return (
    <>
      <Tooltip title="Quick Launch">
        <IconButton
          onClick={handleClick}
          size="small"
          aria-controls={open ? "apps-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          className="for-dark-notification"
        >
          <i className="material-symbols-outlined">apps</i>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="apps-menu"
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            width: 260,
            borderRadius: "10px",
            boxShadow: "0 4px 45px #0000001a",
            overflow: "visible",
            mt: 1.5,
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            Quick Launch
          </Typography>
        </Box>

        {/* ── Live stats ─────────────────────────────────────────────── */}
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
              <CircularProgress size={20} sx={{ color: "#605DFF" }} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Paper
                variant="outlined"
                onClick={() => navigate("/bookings/manage-bookings/")}
                sx={{
                  flex: 1, p: 1, borderRadius: 2, cursor: "pointer", textAlign: "center",
                  borderColor: "rgba(96,93,255,0.25)",
                  "&:hover": { bgcolor: "rgba(96,93,255,0.06)" },
                }}
              >
                <Typography variant="h6" fontWeight={800} color="#605DFF" lineHeight={1.2}>
                  {stats?.todayBookings ?? "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Today's Bookings
                </Typography>
              </Paper>
              <Paper
                variant="outlined"
                onClick={() => navigate("/bookings/booking-tasks/")}
                sx={{
                  flex: 1, p: 1, borderRadius: 2, cursor: "pointer", textAlign: "center",
                  borderColor: "rgba(255,152,0,0.35)",
                  "&:hover": { bgcolor: "rgba(255,152,0,0.06)" },
                }}
              >
                <Typography variant="h6" fontWeight={800} color="#ff9800" lineHeight={1.2}>
                  {stats ? (stats.pendingTasks + stats.inProgressTasks) : "—"}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Active Tasks
                </Typography>
              </Paper>
            </Box>
          )}
        </Box>

        <Divider />

        {/* ── Navigation grid ────────────────────────────────────────── */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            p: 1,
          }}
        >
          {NAV_ITEMS.map((item) => (
            <Box
              key={item.href}
              onClick={() => navigate(item.href)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                p: "10px 4px",
                borderRadius: 2,
                cursor: "pointer",
                "&:hover": { bgcolor: "rgba(96,93,255,0.08)" },
              }}
            >
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                  bgcolor: "rgba(96,93,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#605DFF",
                }}
              >
                <i className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  {item.icon}
                </i>
              </Box>
              <Typography
                variant="caption"
                fontWeight={500}
                color="text.secondary"
                sx={{ fontSize: "10px", lineHeight: 1.2, textAlign: "center" }}
              >
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Menu>
    </>
  );
};

export default AppsMenu;
