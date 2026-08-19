"use client";

import * as React from "react";
import { Box } from "@mui/material"; 

const SearchForm: React.FC = () => {
  return (
    <>
      <Box
        component="form"
        className='t-search-form'
        sx={{
          width: { sm: "265px" },
          mb: { xs: "10px", sm: "0" },
        }}
      >
        <label>
          <i className="material-symbols-outlined">search</i>
        </label>
        <input
          type="text"
          className='t-input'
          placeholder="Search here....."
        />
      </Box>
    </>
  );
};

export default SearchForm;
