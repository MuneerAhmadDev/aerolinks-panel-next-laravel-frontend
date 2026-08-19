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
} from "@mui/material";
import api from "@/api/api";

export default function DepartmentsTab() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDepartment, setNewDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function fetchDepartments() {
    try {
      const res = await api.get("/api/departments");
      setDepartments(res.data);
    } catch {
      setMessage({ type: "error", text: "Failed to fetch departments" });
    }
  }

  async function handleAddDepartment() {
    if (!newDepartment.trim()) return;
    setLoading(true);
    try {
      await api.post("/api/departments", { name: newDepartment });
      setNewDepartment("");
      fetchDepartments();
      setMessage({ type: "success", text: "Department added successfully" });
    } catch {
      setMessage({ type: "error", text: "Failed to add department" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="New Department"
          value={newDepartment}
          onChange={(e) => setNewDepartment(e.target.value)}
          fullWidth
        />
        <Button onClick={handleAddDepartment} variant="contained" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Add Department"}
        </Button>
      </Box>

      {message && (
        <Alert severity={message.type}>
          <AlertTitle>{message.type === "error" ? "Error" : "Success"}</AlertTitle>
          {message.text}
        </Alert>
      )}

      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Department Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {departments.map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.id}</TableCell>
                <TableCell>{d.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
