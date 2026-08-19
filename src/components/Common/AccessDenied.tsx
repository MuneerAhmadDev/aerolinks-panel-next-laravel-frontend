"use client";

/**
 * AccessDenied
 *
 * A branded, reusable 403 component. Drop it anywhere a permission check fails:
 *
 *   // Full-page block (e.g. in a page component)
 *   if (!can("view-bookings")) return <AccessDenied />;
 *
 *   // Inline inside a Card
 *   if (!can("create-bookings")) return <AccessDenied inline />;
 *
 *   // Custom message
 *   <AccessDenied message="Only Admins can manage supplier invoices." />;
 */

import React from "react";
import { Box, Button, Typography } from "@mui/material";
import GppBadOutlinedIcon from "@mui/icons-material/GppBadOutlined";
import { useRouter } from "next/navigation";

interface AccessDeniedProps {
  /** Override the heading */
  title?: string;
  /** Override the body copy */
  message?: string;
  /**
   * When true the component fills the remaining viewport height instead of
   * taking 100vh — useful when rendered inside a layout that already has a
   * header/sidebar.
   */
  inline?: boolean;
  /** Hide the "Go back" button */
  hideBack?: boolean;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = "Access Denied",
  message = "You do not have permission to access this page. Please contact your administrator.",
  inline = false,
  hideBack = false,
}) => {
  const router = useRouter();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: inline ? "360px" : "100vh",
        px: 3,
        py: inline ? 6 : 0,
        textAlign: "center",
        // Subtle radial glow behind the icon
        background: inline
          ? "transparent"
          : "radial-gradient(ellipse at 50% 40%, rgba(96,93,255,0.06) 0%, transparent 70%)",
      }}
    >
      {/* Icon */}
      <Box
        sx={{
          width: { xs: 80, sm: 100 },
          height: { xs: 80, sm: 100 },
          borderRadius: "50%",
          bgcolor: "rgba(96,93,255,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
          boxShadow: "0 0 0 12px rgba(96,93,255,0.06)",
        }}
      >
        <GppBadOutlinedIcon
          sx={{ fontSize: { xs: 44, sm: 54 }, color: "#605DFF" }}
        />
      </Box>

      {/* 403 badge */}
      <Typography
        variant="h1"
        fontWeight={800}
        sx={{
          fontSize: { xs: "56px", sm: "80px", md: "96px" },
          lineHeight: 1,
          mb: 1,
          background: "linear-gradient(135deg, #605DFF 0%, #a78bfa 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          userSelect: "none",
        }}
      >
        403
      </Typography>

      {/* Title */}
      <Typography
        variant="h4"
        fontWeight={700}
        sx={{ mb: 1.5, fontSize: { xs: "20px", sm: "26px" } }}
        className="text-black"
      >
        {title}
      </Typography>

      {/* Message */}
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: 460, mb: 4, lineHeight: 1.7 }}
      >
        {message}
      </Typography>

      {/* Actions */}
      {!hideBack && (
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={() => router.back()}
            sx={{
              bgcolor: "#605DFF",
              "&:hover": { bgcolor: "#4b48cc" },
              borderRadius: "8px",
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(96,93,255,0.35)",
            }}
          >
            Go Back
          </Button>
          <Button
            variant="outlined"
            onClick={() => router.push("/dashboard/")}
            sx={{
              borderColor: "#605DFF",
              color: "#605DFF",
              borderRadius: "8px",
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { bgcolor: "rgba(96,93,255,0.06)" },
            }}
          >
            Dashboard
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default AccessDenied;
