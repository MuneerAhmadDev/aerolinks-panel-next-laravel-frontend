"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Alert,
  AlertTitle,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import api from "@/api/api";

interface Department {
  id: number;
  name: string;
}

export default function RolesTab() {
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newRole, setNewRole] = useState("");
  const [selectedDept, setSelectedDept] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    fetchDepartments();
    fetchRoles();
  }, []);

  async function fetchDepartments() {
    try {
      const res = await api.get("/api/departments");
      setDepartments(res.data);
    } catch {
      // non-blocking
    }
  }

  async function fetchRoles() {
    try {
      const res = await api.get("/api/roles");
      setRoles(res.data);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch roles" });
    }
  }

  async function handleAddRole() {
    if (!newRole.trim()) return;
    setLoading(true);
    try {
      await api.post("/api/roles", {
        name: newRole,
        ...(selectedDept ? { department_id: selectedDept } : {}),
      });
      setNewRole("");
      setSelectedDept("");
      fetchRoles();
      setMessage({ type: "success", text: "Role added successfully" });
    } catch {
      setMessage({ type: "error", text: "Failed to add role" });
    } finally {
      setLoading(false);
    }
  }

  function getDeptName(deptId: number | null) {
    if (!deptId) return null;
    return departments.find((d) => d.id === deptId)?.name ?? `Dept #${deptId}`;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          label="New Role Name"
          value={newRole}
          onChange={(e) => setNewRole(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Department (optional)</InputLabel>
          <Select
            value={selectedDept}
            label="Department (optional)"
            onChange={(e) => setSelectedDept(e.target.value as number)}
          >
            <MenuItem value="">— Global role —</MenuItem>
            {departments.map((dept) => (
              <MenuItem key={dept.id} value={dept.id}>
                {dept.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button onClick={handleAddRole} variant="contained" disabled={loading} sx={{ alignSelf: "center" }}>
          {loading ? <CircularProgress size={24} /> : "Add Role"}
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)}>
          <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Role Name</TableCell>
              <TableCell>Department</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>{role.id}</TableCell>
                <TableCell>{role.name}</TableCell>
                <TableCell>
                  {role.department_id ? (
                    <Chip label={getDeptName(role.department_id)} size="small" color="primary" variant="outlined" />
                  ) : (
                    <Chip label="Global" size="small" variant="outlined" />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
