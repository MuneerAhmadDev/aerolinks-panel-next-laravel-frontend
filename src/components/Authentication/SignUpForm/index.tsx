"use client";

import * as React from "react";
import {
  Grid,
  Button,
  Box,
  Typography,
  FormControl,
  TextField,
} from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import axios from "axios";
import { register } from "../../../api/api";
import { useRouter } from "next/navigation";
import { checkAuth } from "../../../api/auth";

const SignUpForm: React.FC = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const router = useRouter();

  useEffect(() => {
      const verifyAuth = async () => {
        const user = await checkAuth();
        console.log(user);
        if (user) {
          router.push('/dashboard');
        }
      };
  
      verifyAuth();
    }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // try {
    //   const response = await axios.post("http://localhost:8000/api/register", {
    //     name,
    //     email,
    //     password,
    //     password_confirmation: passwordConfirmation,
    //   });
    //   alert("Signup successful");
    //   // Optionally, redirect the user to the login page or another page
    // } catch (error) {
    //   alert("Signup failed");
    //   console.error(error);
    // }
    try {
      const response = await register(name, email, password, passwordConfirmation);
      alert("Signup successful");
      console.log(response);
      router.push("/authentication/sign-in");
      // Optionally, redirect the user to the login page or another page
    } catch (error) {
      alert("Signup failed");
      console.error(error);
    }
  };
  return (
    <>
      <Box
        className="auth-main-wrapper sign-up-area"
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
              <Box
                sx={{
                  display: { xs: "none", md: "block" },
                }}
              >
                <Image
                  src="/images/sign-up.jpg"
                  alt="sign-up-image"
                  width={646}
                  height={804}
                  style={{
                    borderRadius: "24px",
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6} lg={6} xl={5}>
              <Box
                className="form-content"
                sx={{
                  paddingLeft: { xs: "0", lg: "10px" },
                }}
              >
                <Box
                  className="logo"
                  sx={{
                    mb: "23px",
                  }}
                >
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

                <Box
                  className="title"
                  sx={{
                    mb: "23px",
                  }}
                >
                  <Typography
                    variant="h1"
                    className="text-black"
                    sx={{
                      fontSize: { xs: "22px", sm: "25px", lg: "28px" },
                      mb: "7px",
                      fontWeight: "600",
                    }}
                  >
                    Sign up to Aerolinks Dashboard
                  </Typography>

                  <Typography sx={{ fontWeight: "500", fontSize: "16px" }}>
                    Sign up with social account or enter your details
                  </Typography>
                </Box>

                <Box
                  className="with-socials"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-around",
                    gap: "5px",
                    mb: "20px",
                  }}
                >
                  <Button
                    variant="outlined"
                    className="border bg-white"
                    sx={{
                      width: "100%",
                      borderRadius: "8px",
                      padding: "10.5px 20px",
                    }}
                  >
                    <Image
                      src="/images/icons/google.svg"
                      alt="google"
                      width={25}
                      height={25}
                    />
                  </Button>

                  <Button
                    variant="outlined"
                    className="border bg-white"
                    sx={{
                      width: "100%",
                      borderRadius: "8px",
                      padding: "10.5px 20px",
                    }}
                  >
                    <Image
                      src="/images/icons/facebook2.svg"
                      alt="facebook"
                      width={25}
                      height={25}
                    />
                  </Button>

                  <Button
                    variant="outlined"
                    className="border bg-white"
                    sx={{
                      width: "100%",
                      borderRadius: "8px",
                      padding: "10.5px 20px",
                    }}
                  >
                    <Image
                      src="/images/icons/apple.svg"
                      alt="apple"
                      width={25}
                      height={25}
                    />
                  </Button>
                </Box>

                <Box component="form" onSubmit={handleSubmit}>
                  
                  <Box mb="15px">
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
                          Full Name
                        </Typography>

                        <TextField
                          label="Enter your full name"
                          variant="filled"
                          id="fullName"
                          name="fullName"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          sx={{
                            "& .MuiInputBase-root": {
                              border: "1px solid #D5D9E2",
                              backgroundColor: "#fff",
                              borderRadius: "7px",
                            },
                            "& .MuiInputBase-root::before": {
                              border: "none",
                            },
                            "& .MuiInputBase-root:hover::before": {
                              border: "none",
                            },
                          }}
                        />
                      </FormControl>
                    
                  </Box>

                  <Box mb="15px">
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
                        Email Address
                      </Typography>

                      <TextField
                        label="example&#64;aerolinks.com"
                        variant="filled"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{
                          "& .MuiInputBase-root": {
                            border: "1px solid #D5D9E2",
                            backgroundColor: "#fff",
                            borderRadius: "7px",
                          },
                          "& .MuiInputBase-root::before": {
                            border: "none",
                          },
                          "& .MuiInputBase-root:hover::before": {
                            border: "none",
                          },
                        }}
                      />
                    </FormControl>
                  </Box>

                  <Box mb="15px">
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
                        label="Type Password"
                        variant="filled"
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{
                          "& .MuiInputBase-root": {
                            border: "1px solid #D5D9E2",
                            backgroundColor: "#fff",
                            borderRadius: "7px",
                          },
                          "& .MuiInputBase-root::before": {
                            border: "none",
                          },
                          "& .MuiInputBase-root:hover::before": {
                            border: "none",
                          },
                        }}
                      />
                    </FormControl>
                  </Box>

                  <Box mb="15px">
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
                        label="Confirm Password"
                        variant="filled"
                        type="password"
                        id="confirm-password"
                        name="confirmPassword"
                        value={passwordConfirmation}
                        onChange={(e) =>
                          setPasswordConfirmation(e.target.value)
                        }
                        sx={{
                          "& .MuiInputBase-root": {
                            border: "1px solid #D5D9E2",
                            backgroundColor: "#fff",
                            borderRadius: "7px",
                          },
                          "& .MuiInputBase-root::before": {
                            border: "none",
                          },
                          "& .MuiInputBase-root:hover::before": {
                            border: "none",
                          },
                        }}
                      />
                    </FormControl>
                  </Box>

                  <Box my="25px">
                    <Button
                      type="submit"
                      variant="contained"
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
                      <i className="material-symbols-outlined mr-5">person_4</i>
                      Sign Up
                    </Button>
                  </Box>
                  

                  <Typography
                    sx={{
                      mb: "15px",
                      lineHeight: "1.8",
                    }}
                  >
                    By confirming your email, you agree to our{" "}
                    <Link
                      href="#"
                      className="text-black"
                      style={{ fontWeight: "500" }}
                    >
                      Terms of Service
                    </Link>{" "}
                    and that you have read and understood our{" "}
                    <Link
                      href="#"
                      className="text-black"
                      style={{ fontWeight: "500" }}
                    >
                      Privacy Policy
                    </Link>
                    .
                  </Typography>

                  <Typography
                    sx={{
                      mb: "15px",
                      lineHeight: "1.8",
                    }}
                  >
                    Already have an account.{" "}
                    <Link
                      href="/authentication/sign-in/"
                      className="text-primary"
                      style={{
                        fontWeight: "500",
                      }}
                    >
                      Sign In
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </>
  );
};

export default SignUpForm;
