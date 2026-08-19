"use client";

/**
 * /pending-assignment
 *
 * Shown to authenticated users who have no department assigned yet
 * (i.e. a User record exists but no Employee record links them to a dept).
 *
 * The admin layout (sidebar + navbar) is suppressed for this route because
 * "/pending-assignment/" is listed in LayoutProvider's isAuthPage array.
 *
 * The middleware redirects the user here automatically and redirects them
 * away once they gain a department (active_dept cookie is set).
 */

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Divider,
} from "@mui/material";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";
import { logout } from "@/api/api";
import { useDepartment } from "@/context/DepartmentContext";

export default function PendingAssignmentPage() {
  const router = useRouter();
  const { user, isLoading } = useDepartment();

  const handleLogout = async () => {
    await logout();
    router.push("/authentication/sign-in/");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 480,
          width: "100%",
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 5 }, textAlign: "center" }}>
          {/* Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              bgcolor: "warning.light",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 3,
            }}
          >
            <HourglassEmptyIcon sx={{ fontSize: 40, color: "warning.dark" }} />
          </Box>

          {/* Title */}
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Pending Department Assignment
          </Typography>

          {/* User identity chip */}
          {!isLoading && user && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                mb: 2,
              }}
            >
              <Chip
                label={user.name}
                color="primary"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="caption" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Message */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ lineHeight: 1.8, mb: 4 }}
          >
            Your account has been created successfully, but you have not been
            assigned to a department yet.
            <br />
            Please contact your{" "}
            <Typography component="span" fontWeight={600} color="text.primary">
              administrator
            </Typography>{" "}
            to complete the setup.
          </Typography>

          {/* Logout */}
          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            fullWidth
            sx={{
              textTransform: "capitalize",
              borderRadius: "8px",
              fontWeight: 600,
              py: 1.2,
            }}
          >
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
