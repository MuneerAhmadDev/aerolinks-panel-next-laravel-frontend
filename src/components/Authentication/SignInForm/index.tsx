"use client";

import * as React from "react";
import {
  Grid,
  Button,
  Box,
  Typography,
  FormControl,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";
import Image from "next/image";
import { useState, useEffect } from "react";
import { login } from "../../../api/api";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { checkAuth } from "../../../api/auth";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { useDepartment } from "@/context/DepartmentContext";

const SignInForm: React.FC = () => {
  const { logoUrl, siteTitle } = useSiteSettings();
  const { hydrateUser } = useDepartment();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Redirect already-authenticated users straight to the dashboard
  useEffect(() => {
    const verifyAuth = async () => {
      const user = await checkAuth();
      if (user) router.push("/dashboard");
    };
    verifyAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await login(email, password);
      Cookies.set("token", response.data.token);
      localStorage.setItem("token", response.data.token);
      // Hydrate the context immediately with the login response user data so
      // the first dashboard render already has full permissions — no extra
      // /api/user round-trip and no flash of restricted/empty content.
      hydrateUser(response.data.user);
      // Keep isLoading = true intentionally — the spinner stays until the
      // dashboard page fully mounts and this component unmounts.
      router.push("/dashboard");
    } catch {
      setError("Login failed. Please check your email and password.");
      setIsLoading(false); // Only reset on failure
    }
  };

  return (
    <>
      <Box
        className="auth-main-wrapper sign-in-area"
        sx={{ py: { xs: "60px", md: "80px", lg: "100px", xl: "135px" } }}
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
            {/* ── Left illustration ── */}
            <Grid item xs={12} md={6} lg={6} xl={7}>
              <Box sx={{ display: { xs: "none", md: "block" } }}>
                <Image
                  src="/images/sign-in.jpg"
                  alt="sign-in"
                  width={646}
                  height={804}
                  style={{ borderRadius: "24px" }}
                />
              </Box>
            </Grid>

            {/* ── Form ── */}
            <Grid item xs={12} md={6} lg={6} xl={5}>
              <Box
                className="form-content"
                sx={{ paddingLeft: { xs: "0", lg: "10px" } }}
              >
                {/* Logo */}
                <Box className="logo" sx={{ mb: "23px" }}>
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt={siteTitle ?? "logo"}
                      style={{ height: 38, width: "auto", objectFit: "contain" }}
                    />
                  ) : (
                    <>
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
                    </>
                  )}
                </Box>

                {/* Title */}
                <Box className="title" sx={{ mb: "23px" }}>
                  <Typography
                    variant="h1"
                    className="text-black"
                    sx={{
                      fontSize: { xs: "22px", sm: "25px", lg: "28px" },
                      mb: "7px",
                      fontWeight: "600",
                    }}
                  >
                    Welcome back to {siteTitle ?? "Aerolinks"}!
                  </Typography>
                  <Typography sx={{ fontWeight: "500", fontSize: "16px" }}>
                    Sign in to your account to continue
                  </Typography>
                </Box>

                {/* Form fields */}
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{ pointerEvents: isLoading ? "none" : "auto", opacity: isLoading ? 0.7 : 1 }}
                >
                  <Box mb="15px">
                    <FormControl fullWidth>
                      <Typography
                        component="label"
                        sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}
                        className="text-black"
                      >
                        Email Address
                      </Typography>
                      <TextField
                        label="Enter your email"
                        variant="filled"
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={!!error}
                        disabled={isLoading}
                        sx={{
                          "& .MuiInputBase-root": {
                            border: error ? "1px solid red" : "1px solid #D5D9E2",
                            backgroundColor: "#fff",
                            borderRadius: "7px",
                          },
                          "& .MuiInputBase-root::before": { border: "none" },
                          "& .MuiInputBase-root:hover::before": { border: "none" },
                        }}
                      />
                    </FormControl>
                  </Box>

                  <Box mb="15px">
                    <FormControl fullWidth>
                      <Typography
                        component="label"
                        sx={{ fontWeight: "500", fontSize: "14px", mb: "10px", display: "block" }}
                        className="text-black"
                      >
                        Password
                      </Typography>
                      <TextField
                        label="Enter your password"
                        variant="filled"
                        type="password"
                        id="password"
                        name="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!error}
                        disabled={isLoading}
                        sx={{
                          "& .MuiInputBase-root": {
                            border: error ? "1px solid red" : "1px solid #D5D9E2",
                            backgroundColor: "#fff",
                            borderRadius: "7px",
                          },
                          "& .MuiInputBase-root::before": { border: "none" },
                          "& .MuiInputBase-root:hover::before": { border: "none" },
                        }}
                      />
                    </FormControl>
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
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
                    {isLoading ? (
                      <CircularProgress size={24} sx={{ color: "#fff" }} />
                    ) : (
                      <>
                        <i className="material-symbols-outlined mr-5">lock_open</i>{" "}
                        Sign In
                      </>
                    )}
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
};

export default SignInForm;
