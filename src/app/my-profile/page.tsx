"use client";

import * as React from "react";
import NextLink from "next/link";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useDepartment } from "@/context/DepartmentContext";
import api from "@/api/api";

export default function MyProfilePage() {
  const { user, refreshUser } = useDepartment();

  // ── Profile info state ────────────────────────────────────────────────────
  const [name, setName] = React.useState(user?.name ?? "");
  const [email, setEmail] = React.useState(user?.email ?? "");
  const [profileImage, setProfileImage] = React.useState(user?.profile_image ?? "");
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

  // ── Password state ────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [savingPassword, setSavingPassword] = React.useState(false);

  // ── Snackbar ──────────────────────────────────────────────────────────────
  const [snack, setSnack] = React.useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const showSnack = (message: string, severity: "success" | "error" = "success") =>
    setSnack({ open: true, message, severity });

  // Sync with user once loaded from context
  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setProfileImage(user.profile_image ?? "");
    }
  }, [user]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append("avatar", file);
    setUploadingAvatar(true);
    try {
      // Do NOT set Content-Type manually — axios must auto-generate the
      // multipart/form-data boundary when it detects a FormData body.
      const { data } = await api.post<{ profile_image: string }>("/api/profile/avatar", form);
      setProfileImage(data.profile_image);
      await refreshUser(); // refresh context so TopNavbar avatar updates
      showSnack("Avatar updated successfully.");
    } catch {
      showSnack("Failed to upload avatar.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/api/profile", { name, email });
      showSnack("Profile updated successfully.");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to update profile.";
      showSnack(msg, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showSnack("Passwords do not match.", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await api.put("/api/profile", {
        name,
        email,
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      showSnack("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to change password.";
      showSnack(msg, "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = name?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>My Profile</h5>
        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>My Profile</li>
        </ul>
      </div>

      <Grid container spacing={3}>
        {/* ── Profile Info Card ──────────────────────────────────────────────── */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <Box
              sx={{
                background: "linear-gradient(135deg, #605DFF 0%, #a78bfa 100%)",
                px: 3,
                py: 2.5,
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#fff">
                Profile Information
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                Update your name, email and avatar
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              {/* Avatar upload */}
              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    src={profileImage || undefined}
                    sx={{
                      width: 90,
                      height: 90,
                      bgcolor: "#605DFF",
                      fontSize: 32,
                      fontWeight: 700,
                      border: "3px solid #C2CDFF",
                    }}
                  >
                    {!profileImage && initials}
                  </Avatar>
                  <label htmlFor="avatar-upload">
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleAvatarChange}
                    />
                    <IconButton
                      component="span"
                      size="small"
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        bgcolor: "#605DFF",
                        color: "#fff",
                        width: 28,
                        height: 28,
                        border: "2px solid #fff",
                        "&:hover": { bgcolor: "#4b48cc" },
                      }}
                    >
                      {uploadingAvatar ? (
                        <CircularProgress size={14} sx={{ color: "#fff" }} />
                      ) : (
                        <PhotoCameraIcon sx={{ fontSize: 14 }} />
                      )}
                    </IconButton>
                  </label>
                </Box>
              </Box>

              <Box component="form" onSubmit={handleSaveProfile}>
                <TextField
                  label="Full Name"
                  fullWidth
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={savingProfile}
                  sx={{ borderRadius: 2, py: 1.2 }}
                >
                  {savingProfile ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Save Changes"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Change Password Card ──────────────────────────────────────────── */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <Box
              sx={{
                background: "linear-gradient(135deg, #ff6b35 0%, #f7c59f 100%)",
                px: 3,
                py: 2.5,
              }}
            >
              <Typography variant="h6" fontWeight={700} color="#fff">
                Change Password
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)" }}>
                Ensure your account uses a strong password
              </Typography>
            </Box>

            <CardContent sx={{ p: 3 }}>
              <Box component="form" onSubmit={handleSavePassword}>
                <TextField
                  label="Current Password"
                  type={showCurrent ? "text" : "password"}
                  fullWidth
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowCurrent((v) => !v)} edge="end" size="small">
                          {showCurrent ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Divider sx={{ mb: 2 }} />
                <TextField
                  label="New Password"
                  type={showNew ? "text" : "password"}
                  fullWidth
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNew((v) => !v)} edge="end" size="small">
                          {showNew ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirm New Password"
                  type={showConfirm ? "text" : "password"}
                  fullWidth
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small">
                          {showConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={savingPassword}
                  sx={{ borderRadius: 2, py: 1.2, bgcolor: "#ff6b35", "&:hover": { bgcolor: "#e05520" } }}
                >
                  {savingPassword ? <CircularProgress size={20} sx={{ color: "#fff" }} /> : "Update Password"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          sx={{ borderRadius: 2 }}
          variant="filled"
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}
