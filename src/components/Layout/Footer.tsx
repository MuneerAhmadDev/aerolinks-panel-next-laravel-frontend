"use client";

import * as React from "react";
import { Box, Typography } from "@mui/material";

const Footer: React.FC = () => {
  return (
    <>
      <Box
        className="footer-area"
        sx={{
          textAlign: "center",
          bgcolor: "#fff",
          borderRadius: "7px 7px 0 0",
          padding: "20px 25px",
        }}
      >
        <Typography>
          © <span className="text-purple">Aerolinks Panel</span> is Proudly Designed by{" "}
          <a
            href="#"
            target="_blank"
            className="text-primary"
            style={{
              textDecoration: "none",
            }}
          >
            Anees
          </a>
        </Typography>
      </Box>
    </>
  );
};

export default Footer;
