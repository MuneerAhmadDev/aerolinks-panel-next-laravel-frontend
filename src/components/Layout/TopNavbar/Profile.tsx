"use client";

import * as React from "react";
import {
  IconButton,
  Typography,
  Box,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Backdrop,
  CircularProgress,
  Fade,
} from "@mui/material";
import Link from "next/link";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ListIcon from "@mui/icons-material/List";
import Logout from "@mui/icons-material/Logout";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import LockIcon from "@mui/icons-material/Lock";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useRouter } from "next/navigation";
import { useDepartment } from "@/context/DepartmentContext";
import { logout } from "@/api/api";
import Cookies from "js-cookie";

const LOGOUT_STEPS = [
  "Revoking session tokens…",
  "Clearing local credentials…",
  "Logging out securely…",
];

const Profile: React.FC = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { user } = useDepartment();
  const router = useRouter();

  // Logout overlay state
  const [logoutOpen, setLogoutOpen] = React.useState(false);
  const [logoutStep, setLogoutStep] = React.useState(0);

  // Run the animated logout sequence whenever the overlay is opened
  React.useEffect(() => {
    if (!logoutOpen) return;
    let mounted = true;

    const t1 = setTimeout(() => { if (mounted) setLogoutStep(1); }, 700);
    const t2 = setTimeout(() => { if (mounted) setLogoutStep(2); }, 1400);
    const t3 = setTimeout(async () => {
      try {
        await logout();
      } catch {
        // cleanup already handled inside logout()
      }
      if (mounted) router.replace("/authentication/sign-in/");
    }, 2100);

    return () => {
      mounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [logoutOpen, router]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setAnchorEl(null);
    setLogoutStep(0);
    setLogoutOpen(true);
  };

  /**
   * Lock Screen — sets a persistent cookie so the Edge middleware can intercept
   * any protected route and force the user back to the lock screen.
   */
  const handleLockScreen = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setAnchorEl(null);
    Cookies.set("screen_locked", "1", { sameSite: "lax" });
    router.push("/authentication/lock-screen/");
  };

  const firstName = user?.name?.split(" ")[0] ?? "User";
  const initials = user?.name?.[0]?.toUpperCase() ?? "U";
  const roleLabel = user?.roles?.[0]?.name ?? user?.email ?? "";

  return (
    <>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ p: 0, borderRadius: "5px" }}
          aria-controls={open ? "account-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
        >
          <Avatar
            {...(user?.profile_image ? { src: user.profile_image } : {})}
            alt={user?.name ?? "User"}
            sx={{
              width: { xs: "35px", sm: "42px" },
              height: { xs: "35px", sm: "42px" },
              border: "2px solid #C2CDFF",
              bgcolor: user?.profile_image ? undefined : "#605DFF",
              fontSize: 16,
              fontWeight: 700,
            }}
            className="mr-8"
          >
            {!user?.profile_image && initials}
          </Avatar>
          <Typography
            variant="h3"
            sx={{
              fontWeight: "600",
              fontSize: "13px",
              display: { xs: "none", sm: "block" },
            }}
            className="text-black"
          >
            {firstName}
          </Typography>
          <KeyboardArrowDownIcon sx={{ fontSize: "15px" }} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: "7px",
            boxShadow: "0 4px 45px #0000001a",
            overflow: "visible",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
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
        className="for-dark-top-navList"
      >
        {/* ── User Info ── */}
        <MenuItem sx={{ padding: "10px 20px" }}>
          <Avatar
            {...(user?.profile_image ? { src: user.profile_image } : {})}
            sx={{
              width: 31,
              height: 31,
              border: "2px solid #C2CDFF",
              bgcolor: user?.profile_image ? undefined : "#605DFF",
              fontSize: 14,
              fontWeight: 700,
            }}
            className="mr-8"
          >
            {!user?.profile_image && initials}
          </Avatar>
          <Box>
            <Typography
              variant="h5"
              sx={{ fontSize: "13px", color: "#260944", fontWeight: "500" }}
              className="text-black"
            >
              {user?.name ?? "User"}
            </Typography>
            <Typography sx={{ fontSize: "12px" }}>{roleLabel}</Typography>
          </Box>
        </MenuItem>

        <Divider sx={{ borderColor: "#F6F7F9" }} />

        {/* ── My Profile ── */}
        <MenuItem sx={{ padding: "8px 20px" }}>
          <Link
            href="/my-profile/"
            className="text-black"
            style={{ display: "flex", alignItems: "center" }}
          >
            <ListItemIcon sx={{ mr: "-10px", mt: "-3px" }}>
              <AccountCircleIcon sx={{ fontSize: "20px" }} className="text-black" />
            </ListItemIcon>
            <span style={{ fontSize: "13px" }}>My Profile</span>
          </Link>
        </MenuItem>

        {/* ── My Tasks ── */}
        <MenuItem sx={{ padding: "8px 20px" }}>
          <Link
            href="/apps/to-do-list/"
            className="text-black"
            style={{ display: "flex", alignItems: "center" }}
          >
            <ListItemIcon sx={{ mr: "-10px", mt: "-3px" }}>
              <ListIcon sx={{ fontSize: "20px" }} className="text-black" />
            </ListItemIcon>
            <span style={{ fontSize: "13px" }}>My Tasks</span>
          </Link>
        </MenuItem>

        <Divider sx={{ borderColor: "#F6F7F9" }} />

        {/* ── Lock Screen ── */}
        <MenuItem sx={{ padding: "8px 20px" }} onClick={handleLockScreen}>
          <ListItemIcon sx={{ mr: "-10px", mt: "-3px" }}>
            <LockIcon sx={{ fontSize: "20px" }} className="text-black" />
          </ListItemIcon>
          <span style={{ fontSize: "13px" }} className="text-black">Lock Screen</span>
        </MenuItem>

        {/* ── Logout ── */}
        <MenuItem sx={{ padding: "8px 20px" }} onClick={handleLogout}>
          <ListItemIcon sx={{ mr: "-10px", mt: "-3px" }}>
            <Logout sx={{ fontSize: "20px" }} className="text-black" />
          </ListItemIcon>
          <span style={{ fontSize: "13px" }} className="text-black">Logout</span>
        </MenuItem>
      </Menu>

      {/* ── Inline Logout Overlay ─────────────────────────────────────────── */}
      <Backdrop
        open={logoutOpen}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 1,
          flexDirection: "column",
          gap: 3,
          background: "linear-gradient(135deg, #605DFF 0%, #a78bfa 100%)",
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LockOutlinedIcon sx={{ fontSize: 40, color: "#fff" }} />
        </Box>

        <CircularProgress size={44} thickness={4} sx={{ color: "#fff" }} />

        <Fade in key={logoutStep} timeout={300}>
          <Typography
            variant="h6"
            fontWeight={600}
            sx={{ color: "#fff", letterSpacing: 0.5 }}
          >
            {LOGOUT_STEPS[logoutStep]}
          </Typography>
        </Fade>

        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
          Please wait while we secure your session.
        </Typography>
      </Backdrop>
    </>
  );
};

export default Profile;
