"use client";

import * as React from "react";
import {
  Grid,
  Button,
  Box,
  Typography,
  FormControl,
  TextField,
  CircularProgress,
  Alert,
} from "@mui/material";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useDepartment } from "@/context/DepartmentContext";
import api from "@/api/api";
import Cookies from "js-cookie";

const LockScreenForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useDepartment();

  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/api/auth/verify-password", { password });
      // Clear the lock cookie BEFORE navigating so middleware doesn't intercept
      Cookies.remove("screen_locked");
      // Honour a ?redirect= param (e.g. if middleware preserved the original URL),
      // otherwise fall back to dashboard.
      const redirect = searchParams.get("redirect") ?? "/dashboard/";
      router.replace(redirect);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Incorrect password. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.name?.[0]?.toUpperCase() ?? "U";

  return (
    <>
      <Box
        className="auth-main-wrapper forgot-password-area"
        sx={{
          py: { xs: "60px", md: "80px", lg: "100px", xl: "135px" },
        }}
      >
        <Box
          sx={{
            maxWidth: { sm: "500px", md: "1255px" },
            mx: "auto !important",
            px: "12px",
          }}
        >
          <Grid
            container
            alignItems="center"
            columnSpacing={{ xs: 1, sm: 2, md: 4, lg: 3 }}
          >
            <Grid item xs={12} md={6} lg={6} xl={7}>
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Image
                  src="/images/lock-screen.jpg"
                  alt="lock-screen-image"
                  width={646}
                  height={804}
                  style={{ borderRadius: "24px" }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6} lg={6} xl={5}>
              <Box
                className="form-content"
                sx={{ paddingLeft: { xs: "0", lg: "10px" } }}
              >
                <Box className="logo" sx={{ mb: "23px" }}>
                  <Image
                    src="/images/logo-big.svg"
                    alt="logo"
                    width={142}
                    height={38}
                  />
                  <Image
                    src="/images/white-logo.svg"
                    className="d-none"
                    alt="logo"
                    width={142}
                    height={38}
                  />
                </Box>

                <Box className="title" sx={{ mb: "23px" }}>
                  <Typography
                    variant="h1"
                    className="text-black"
                    sx={{
                      fontSize: { xs: "22px", sm: "25px", lg: "28px" },
                      mb: "10px",
                      fontWeight: "600",
                    }}
                  >
                    Welcome back to Aerolinks!
                  </Typography>

                  <Typography sx={{ fontWeight: "500", fontSize: "16px" }}>
                    Enter your password to access the admin.
                  </Typography>
                </Box>

                {/* User identity strip */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "15px",
                    mb: "20px",
                  }}
                >
                  {user?.profile_image ? (
                    <Image
                      src={user.profile_image}
                      className="rounded-circle"
                      alt={user.name}
                      width={50}
                      height={50}
                      style={{ borderRadius: "50%", objectFit: "cover" }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: "50%",
                        bgcolor: "#605DFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 20,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </Box>
                  )}
                  <Typography
                    component="span"
                    className="text-black"
                    sx={{ fontWeight: "600", display: "block" }}
                  >
                    {user?.name ?? "Loading…"}
                  </Typography>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                  <Box mb="20px">
                    <FormControl fullWidth>
                      <Typography
                        component="label"
                        sx={{
                          fontWeight: "500",
                          fontSize: "14px",
                          mb: "10px",
                          display: "block",
                        }}
                        className="text-black"
                      >
                        Password
                      </Typography>

                      <TextField
                        label="Type your password"
                        variant="filled"
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        autoFocus
                        sx={{
                          "& .MuiInputBase-root": {
                            border: "1px solid #D5D9E2",
                            backgroundColor: "#fff",
                            borderRadius: "7px",
                          },
                          "& .MuiInputBase-root::before": { border: "none" },
                          "& .MuiInputBase-root:hover::before": { border: "none" },
                        }}
                      />
                    </FormControl>
                  </Box>

                  <Box>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading || !password.trim()}
                      sx={{
                        textTransform: "capitalize",
                        borderRadius: "6px",
                        fontWeight: "500",
                        fontSize: { xs: "13px", sm: "16px" },
                        padding: { xs: "10px 20px", sm: "10px 24px" },
                        color: "#fff !important",
                        boxShadow: "none",
                        width: "100%",
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={20} sx={{ color: "#fff" }} />
                      ) : (
                        <>
                          <i className="material-symbols-outlined mr-5">lock_open</i>
                          Unlock
                        </>
                      )}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
};

export default LockScreenForm;
