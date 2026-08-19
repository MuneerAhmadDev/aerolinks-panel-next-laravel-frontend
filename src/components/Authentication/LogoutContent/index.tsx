"use client";

import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Fade, Typography } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useRouter } from "next/navigation";
import { logout } from "@/api/api";

const STEPS = [
  "Revoking session tokens…",
  "Clearing local credentials…",
  "Logging out securely…",
];

const LogoutContent: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    let mounted = true;

    const t1 = setTimeout(() => mounted && setStep(1), 700);
    const t2 = setTimeout(() => mounted && setStep(2), 1400);
    const t3 = setTimeout(async () => {
      try {
        await logout();
      } catch {
        // cleanup already done inside logout()
      }
      if (mounted) router.replace("/authentication/sign-in/");
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #605DFF 0%, #a78bfa 100%)",
        gap: 3,
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
          mb: 1,
        }}
      >
        <LockOutlinedIcon sx={{ fontSize: 40, color: "#fff" }} />
      </Box>

      <CircularProgress size={44} thickness={4} sx={{ color: "#fff" }} />

      <Fade in key={step} timeout={300}>
        <Typography
          variant="h6"
          fontWeight={600}
          sx={{ color: "#fff", letterSpacing: 0.5 }}
        >
          {STEPS[step]}
        </Typography>
      </Fade>

      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
        Please wait while we secure your session.
      </Typography>
    </Box>
  );
};

export default LogoutContent;
