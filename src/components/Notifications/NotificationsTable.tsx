"use client";

import * as React from "react";
import {
  Card,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
  Paper,
  IconButton,
  TableHead,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import api from "@/api/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApiNotification {
  id: string;
  data: {
    message: string;
    booking_number?: string;
    service_type?: string;
    department_name?: string;
    task_id?: number;
  };
  read_at: string | null;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTimestamp(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function deriveType(n: ApiNotification): string {
  const svc = n.data.service_type;
  if (svc) return svc.charAt(0).toUpperCase() + svc.slice(1);
  if (n.data.task_id) return "Task";
  if (n.data.booking_number) return "Booking";
  return "System";
}

// ── Pagination actions ────────────────────────────────────────────────────────

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
}

function TablePaginationActions({ count, page, rowsPerPage, onPageChange }: TablePaginationActionsProps) {
  const theme = useTheme();
  return (
    <Box sx={{ flexShrink: 0, display: "flex", gap: "10px", padding: "0 20px" }}>
      <IconButton
        onClick={(e) => onPageChange(e, page - 1)}
        disabled={page === 0}
        aria-label="previous page"
        sx={{ borderRadius: "4px", padding: "6px" }}
        className="border"
      >
        {theme.direction === "rtl" ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={(e) => onPageChange(e, page + 1)}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
        sx={{ borderRadius: "4px", padding: "6px" }}
        className="border"
      >
        {theme.direction === "rtl" ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
    </Box>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

const NotificationsTable: React.FC = () => {
  const [notifications, setNotifications] = React.useState<ApiNotification[]>([]);
  const [loading, setLoading]             = React.useState(true);
  const [page, setPage]                   = React.useState(0);
  const [rowsPerPage, setRowsPerPage]     = React.useState(10);

  React.useEffect(() => {
    setLoading(true);
    api.get("/api/notifications")
      .then((res) => setNotifications(Array.isArray(res.data) ? res.data : []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {/* silent */}
  };

  const paginated = rowsPerPage > 0
    ? notifications.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : notifications;

  const emptyRows = page > 0
    ? Math.max(0, (1 + page) * rowsPerPage - notifications.length)
    : 0;

  return (
    <Card
      sx={{ boxShadow: "none", borderRadius: "7px", mb: "25px", padding: { xs: "18px", sm: "20px", lg: "25px" } }}
      className="rmui-card"
    >
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <i
            className="material-symbols-outlined"
            style={{ fontSize: 48, color: "#ccc", display: "block", marginBottom: 8 }}
          >
            notifications_off
          </i>
          <Typography color="text.secondary" fontSize={15}>
            No new notifications
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: "none", borderRadius: "7px" }} className="rmui-table border">
          <Table sx={{ minWidth: 1000 }} aria-label="Notifications Table">
            <TableHead className="bg-f6f7f9">
              <TableRow sx={{ "& th": { fontWeight: "500", padding: "10px 24px", fontSize: "14px" } }}>
                <TableCell className="text-black border-bottom">Timestamp</TableCell>
                <TableCell className="text-black border-bottom">Type</TableCell>
                <TableCell className="text-black border-bottom">Message</TableCell>
                <TableCell className="text-black border-bottom">Reference</TableCell>
                <TableCell className="text-black border-bottom">Status</TableCell>
                <TableCell className="text-black border-bottom">Action</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginated.map((n) => (
                <TableRow
                  key={n.id}
                  sx={{
                    "& td": { padding: "14px 20px", fontSize: "14px" },
                    bgcolor: !n.read_at ? "rgba(96,93,255,0.03)" : "transparent",
                  }}
                >
                  <TableCell className="border-bottom" sx={{ whiteSpace: "nowrap" }}>
                    {formatTimestamp(n.created_at)}
                  </TableCell>

                  <TableCell className="text-black border-bottom">
                    <Chip
                      label={deriveType(n)}
                      size="small"
                      sx={{ bgcolor: "#605DFF22", color: "#605DFF", fontWeight: 600, height: 22, "& .MuiChip-label": { px: 1 } }}
                    />
                  </TableCell>

                  <TableCell className="text-black border-bottom">
                    <Box sx={{ maxWidth: "450px" }}>{n.data.message}</Box>
                  </TableCell>

                  <TableCell className="border-bottom">
                    {n.data.booking_number ? (
                      <Typography fontSize={13} fontWeight={600} color="#605DFF">
                        {n.data.booking_number}
                      </Typography>
                    ) : n.data.department_name ? (
                      <Typography fontSize={13} color="text.secondary">{n.data.department_name}</Typography>
                    ) : (
                      <Typography fontSize={13} color="text.disabled">—</Typography>
                    )}
                  </TableCell>

                  <TableCell className="border-bottom">
                    <div
                      className={`Aerolinks-badge ${n.read_at ? "read" : "unread"}`}
                      style={{ textTransform: "capitalize" }}
                    >
                      {n.read_at ? "read" : "unread"}
                    </div>
                  </TableCell>

                  <TableCell className="border-bottom">
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {!n.read_at && (
                        <IconButton
                          aria-label="mark as read"
                          onClick={() => markRead(n.id)}
                          sx={{ padding: "5px", color: "#605DFF" }}
                          title="Mark as read"
                        >
                          <i className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                            mark_email_read
                          </i>
                        </IconButton>
                      )}
                      <IconButton
                        aria-label="view"
                        color="primary"
                        sx={{ padding: "5px" }}
                        title="View"
                      >
                        <i className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                          visibility
                        </i>
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}

              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={6} />
                </TableRow>
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                  colSpan={6}
                  count={notifications.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  slotProps={{ select: { inputProps: { "aria-label": "rows per page" }, native: true } }}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  ActionsComponent={TablePaginationActions}
                  sx={{ border: "none" }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
};

export default NotificationsTable;
