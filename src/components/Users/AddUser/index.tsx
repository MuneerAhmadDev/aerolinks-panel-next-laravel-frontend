"use client";

import React, { useState, useEffect } from "react";
import {
  Grid,
  Card,
  Box,
  TextField,
  Button,
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Autocomplete,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import api from "@/api/api";
import Link from "next/link";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useDepartment } from "@/context/DepartmentContext";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Role {
  id: number;
  name: string;
}

const AddUser: React.FC = () => {
  const { hasPermission, isSuperAdmin } = useDepartment();
  const canCreate = isSuperAdmin || hasPermission("create-users");

  // Basic user fields
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>("");

  const [emailValid, setEmailValid] = useState<boolean>(true);
  const [passwordMatch, setPasswordMatch] = useState<boolean>(true);
  const [passwordConfirmationFocused, setPasswordConfirmationFocused] = useState(false);

  // Role-related state (only role is required now)
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);

  // List of users for selection (if needed)
  const [users, setUsers] = useState<User[]>([]);

  // UI state for error and success messages
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState<string | null>(null);

  const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
  const checkedIcon = <CheckBoxIcon fontSize="small" />;

  // Fetch roles (and users if needed)
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const rolesResponse = await api.get("/api/roles");
        setRoles(rolesResponse.data);
      } catch (err) {
        console.error("Error fetching roles:", err);
      }
    };

    const fetchUsers = async () => {
      try {
        const response = await api.get("/api/users");
        setUsers(response.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchRoles();
    fetchUsers();
  }, []);

  // Input change handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case "name":
        setName(value);
        break;
      case "email":
        setEmail(value);
        validateEmail(value);
        break;
      case "password":
        setPassword(value);
        validatePasswordConfirmation(value, passwordConfirmation);
        break;
      case "confirmPassword":
        setPasswordConfirmation(value);
        validatePasswordConfirmation(password, value);
        break;
      default:
        break;
    }
  };

  const validateEmail = (email: string) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    setEmailValid(emailPattern.test(email));
  };

  const validatePasswordConfirmation = (password: string, confirmPassword: string) => {
    setPasswordMatch(password === confirmPassword);
  };

  // Role selection (using Autocomplete)
  // When roles change, update the selectedRoles state.
  const handleRoleSelectionChange = (event: any, newValue: Role[]) => {
    setSelectedRoles(newValue);
  };

  // Helper to scroll to error section
  const scrollToError = () => {
    const errorSection = document.getElementById("error-section");
    if (errorSection) {
      errorSection.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setSuccess(null);

    // Validate basic fields
    if (!emailValid) {
      setError("Invalid email format.");
      scrollToError();
      return;
    }
    if (!passwordMatch) {
      setError("Passwords do not match.");
      scrollToError();
      return;
    }
    if (!selectedRoles.length) {
      setError("Please select at least one role.");
      scrollToError();
      return;
    }

    const roleIds = selectedRoles.map((role) => role.id);
    console.log("Submitted data:", { name, email, password, roles: roleIds });

    try {
      const response = await api.post("/api/users", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        roles: roleIds,
      });
      // Assuming a 204 No Content is returned on success.
      // Backend returns 201 Created on success
      if (response.status === 201) {
        setSuccess("User created successfully!");
        setName("");
        setEmail("");
        setPassword("");
        setPasswordConfirmation("");
        setSelectedRoles([]);
      }
    } catch (err: any) {
      // If validation errors are returned as an object under err.response.data.errors
      if (err.response && err.response.data && err.response.data.errors) {
        setFieldErrors(err.response.data.errors);
      }
      setError(err.response?.data?.message || "An error occurred while creating the user.");
      scrollToError();
      console.error("Error:", err.response?.data || err.message || err);
    }
  };

  if (!canCreate) {
    return (
      <Card sx={{ m: 3, p: 4, textAlign: "center" }}>
        <LockOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
        <Alert severity="error" sx={{ maxWidth: 420, mx: "auto" }}>
          <AlertTitle>Access Denied</AlertTitle>
          You do not have permission to create users.
        </Alert>
      </Card>
    );
  }

  return (
    <Card sx={{ m: 3, p: 3 }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
        {/* Global error section */}
        {error && (
          <Box id="error-section" sx={{ mb: 2 }}>
            <Alert severity="error">
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          </Box>
        )}
        {success && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="success">
              <AlertTitle>Success</AlertTitle>
              {success} <Link href="/users/users-list/">Go to Users Management</Link>
            </Alert>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* User Details */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Name"
              variant="filled"
              name="name"
              value={name}
              onChange={handleInputChange}
              fullWidth
              required
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name ? fieldErrors.name[0] : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email"
              name="email"
              variant="filled"
              value={email}
              onChange={handleInputChange}
              fullWidth
              required
              error={Boolean(fieldErrors.email) || !emailValid}
              helperText={fieldErrors.email ? fieldErrors.email[0] : (!emailValid ? "Invalid email format" : "")}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Password"
              name="password"
              type="password"
              variant="filled"
              value={password}
              onChange={handleInputChange}
              fullWidth
              required
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password ? fieldErrors.password[0] : ""}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Confirm Password"
              variant="filled"
              type="password"
              name="confirmPassword"
              value={passwordConfirmation}
              onChange={handleInputChange}
              fullWidth
              required
              onFocus={() => setPasswordConfirmationFocused(true)}
              onBlur={() => setPasswordConfirmationFocused(false)}
              error={Boolean(fieldErrors.confirmPassword) || (passwordConfirmationFocused && password !== passwordConfirmation)}
              helperText={
                fieldErrors.confirmPassword ? fieldErrors.confirmPassword[0] : 
                (passwordConfirmationFocused && password !== passwordConfirmation ? "Passwords do not match" : "")
              }
            />
          </Grid>

          {/* Role Selection */}
          <Grid item xs={12} sm={6}>
            {/* <Autocomplete
              multiple
              id="roles-select"
              options={roles}
              disableCloseOnSelect
              getOptionLabel={(option) => option.name}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox
                    icon={icon}
                    checkedIcon={checkedIcon}
                    style={{ marginRight: 8 }}
                    checked={selected}
                  />
                  {option.name}
                </li>
              )}
              value={selectedRoles}
              onChange={(event, newValue) => setSelectedRoles(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Role"
                  placeholder="Choose role(s)"
                  variant="filled"
                  required
                  error={Boolean(fieldErrors.roles)}
                  helperText={fieldErrors.roles ? fieldErrors.roles[0] : ""}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            /> */}
            <Autocomplete
              multiple
              id="roles-select"
              options={roles}
              disableCloseOnSelect
              getOptionLabel={(option) => option.name}
              renderOption={(props, option, { selected }) => {
                // Determine if the current option should be disabled.
                const isDisabled =
                  selectedRoles.some(
                    (r) => r.name.toLowerCase() === "superadmin"
                  ) && option.name.toLowerCase() !== "superadmin";
                return (
                  <li
                    {...props}
                    style={{
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      // preserve any other styles from props.style if needed
                      ...props.style,
                    }}
                  >
                    <Checkbox
                      icon={icon}
                      checkedIcon={checkedIcon}
                      style={{ marginRight: 8 }}
                      checked={selected}
                      disabled={isDisabled}
                    />
                    {option.name}
                  </li>
                );
              }}
              value={selectedRoles}
              onChange={(event, newValue) => {
                // If SuperAdmin is selected, force only it to be selected.
                const superAdminSelected = newValue.find(
                  (role) => role.name.toLowerCase() === "superadmin"
                );
                if (superAdminSelected) {
                  setSelectedRoles([superAdminSelected]);
                } else {
                  setSelectedRoles(newValue);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Role"
                  placeholder="Choose role(s)"
                  variant="filled"
                  error={Boolean(fieldErrors.roles)}
                  helperText={fieldErrors.roles ? fieldErrors.roles[0] : ""}
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value.id}
            />



          </Grid>
        </Grid>

        <Box sx={{ display: "flex", justifyContent: "center", mt: 3, gap: 2 }}>
          <Button
            type="button"
            variant="contained"
            color="error"
            sx={{
              textTransform: "capitalize",
              borderRadius: "8px",
              padding: "10px 24px",
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            sx={{
              textTransform: "capitalize",
              borderRadius: "8px",
              padding: "10px 24px",
            }}
          >
            <i className="material-symbols-outlined">add</i> Add User
          </Button>
        </Box>
      </Box>
    </Card>
  );
};

export default AddUser;
