"use client";

import * as React from "react";
import styles from "@/components/Layout/TopNavbar/Notifications/Notifications.module.css";
import {
  IconButton,
  Button,
  Typography,
  Tooltip,
  Menu,
  Badge,
  Box,
  CircularProgress,
} from "@mui/material";
import Link from "next/link";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import api from "@/api/api";

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  return `${Math.floor(hrs / 24)} day${Math.floor(hrs / 24) > 1 ? "s" : ""} ago`;
}

const SERVICE_ICONS: Record<string, string> = {
  flight:    "flight",
  hotel:     "hotel",
  visa:      "badge",
  transport: "directions_car",
  activity:  "local_activity",
};

function speakText(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

const Notifications: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = React.useState<ApiNotification[]>([]);
  const [loading, setLoading] = React.useState(false);
  const open = Boolean(anchorEl);

  // Track seen IDs so we can detect truly new notifications
  const seenIdsRef = React.useRef<Set<string>>(new Set());
  const isInitializedRef = React.useRef(false);

  const fetchNotifications = React.useCallback(
    async (options: { showLoading?: boolean; silent?: boolean } = {}) => {
      if (options.showLoading) setLoading(true);
      try {
        const res = await api.get("/api/notifications");
        const fetched: ApiNotification[] = Array.isArray(res.data) ? res.data : [];

        if (isInitializedRef.current && !options.silent) {
          // Find unread notifications we haven't seen before
          const newUnread = fetched.filter(
            (n) => !n.read_at && !seenIdsRef.current.has(n.id)
          );
          if (newUnread.length > 0) {
            const text =
              newUnread.length === 1
                ? newUnread[0].data.message
                : `You have ${newUnread.length} new notifications.`;
            speakText(text);
          }
        }

        // Update seen IDs with everything fetched
        fetched.forEach((n) => seenIdsRef.current.add(n.id));
        isInitializedRef.current = true;
        setNotifications(fetched);
      } catch {
        // Silent fail
      } finally {
        if (options.showLoading) setLoading(false);
      }
    },
    []
  );

  // Auto-poll every 30 seconds (silent: no voice on background polls, only on new IDs)
  React.useEffect(() => {
    // Initial silent fetch to populate seenIds baseline
    fetchNotifications({ silent: true });

    const interval = setInterval(() => {
      fetchNotifications({ silent: false });
    }, 30_000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications({ showLoading: true, silent: true });
  };

  const handleClose = () => setAnchorEl(null);

  const markAllRead = async () => {
    try {
      await api.put("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch {/* silent */}
  };

  const markOneRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {/* silent */}
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ width: "35px", height: "35px", p: 0 }}
          aria-controls={open ? "notifications-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          className="for-dark-notification"
        >
          <Badge
            badgeContent={unreadCount || undefined}
            color="error"
            max={99}
            sx={
              unreadCount > 0
                ? {
                    "& .MuiBadge-badge": {
                      animation: "notif-pulse 2s infinite",
                      "@keyframes notif-pulse": {
                        "0%":   { boxShadow: "0 0 0 0 rgba(244,67,54,0.5)" },
                        "70%":  { boxShadow: "0 0 0 6px rgba(244,67,54,0)" },
                        "100%": { boxShadow: "0 0 0 0 rgba(244,67,54,0)" },
                      },
                    },
                  }
                : {}
            }
          >
            <NotificationsNoneIcon color="action" sx={{ fontSize: "24px" }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="notifications-menu"
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            padding: "0",
            borderRadius: "7px",
            boxShadow: "0 4px 45px #0000001a",
            overflow: "visible",
            mt: 1.5,
            minWidth: 320,
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
        <div className={styles.header}>
          <Typography variant="h4">
            Notifications{" "}
            {unreadCount > 0 && (
              <span className="text-body">({unreadCount} unread)</span>
            )}
          </Typography>
          {unreadCount > 0 && (
            <Button variant="text" onClick={markAllRead} sx={{ textTransform: "capitalize", fontSize: "12px" }}>
              Mark all read
            </Button>
          )}
        </div>

        <div className={styles.notification}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress size={22} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 3, color: "text.secondary", fontSize: "13px" }}>
              No notifications
            </Box>
          ) : (
            notifications.slice(0, 8).map((n) => {
              const icon = SERVICE_ICONS[n.data.service_type ?? ""] ?? "notifications";
              return (
                <div
                  key={n.id}
                  className={styles.notificationList}
                  style={{ opacity: n.read_at ? 0.6 : 1, cursor: "pointer" }}
                  onClick={() => { if (!n.read_at) markOneRead(n.id); }}
                >
                  {!n.read_at && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: 8,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "#605DFF",
                      }}
                    />
                  )}
                  <div className={styles.icon}>
                    <i className="material-symbols-outlined">{icon}</i>
                  </div>
                  <Box component="span" sx={{ display: "block", mb: "4px" }} className="text-black">
                    {n.data.message}
                  </Box>
                  <Box component="span" sx={{ display: "block", fontSize: "11px", color: "text.secondary" }}>
                    {timeAgo(n.created_at)}
                  </Box>
                </div>
              );
            })
          )}

          <Typography component="div" textAlign="center">
            <Link
              href="/bookings/booking-tasks"
              onClick={handleClose}
              style={{
                fontWeight: "500",
                marginTop: "15px",
                marginBottom: "10px",
                display: "inline-block",
                textDecoration: "none",
              }}
            >
              View Booking Tasks
            </Link>
          </Typography>
        </div>
      </Menu>
    </>
  );
};

export default Notifications;
