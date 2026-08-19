"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  Card,
  Box,
  Typography,
  IconButton,
  AvatarGroup,
  Avatar,
  Button,
  Dialog,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Chip,
  CircularProgress,
  Tooltip,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProps,
} from "react-beautiful-dnd";

/**
 * StrictModeDroppable — React 18 Strict Mode fix for react-beautiful-dnd.
 *
 * In Strict Mode React double-invokes effects, which causes rbd to
 * unregister droppables before re-registering them, throwing:
 *   "Cannot find droppable entry with id [...]"
 *
 * Deferring the render by one animation frame lets the cleanup cycle
 * finish before rbd registers the droppable, preventing the invariant.
 */
const StrictModeDroppable: React.FC<DroppableProps> = ({
  children,
  ...props
}) => {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(id);
      setEnabled(false);
    };
  }, []);

  if (!enabled) return null;
  return <Droppable {...props}>{children}</Droppable>;
};
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import api from "@/api/api";

// ── Types ──────────────────────────────────────────────────────────────────────

type TaskStatus   = "Pending" | "In Progress" | "Finished" | "Cancelled";
type TaskPriority = "High" | "Medium" | "Low";

interface TaskEmployee {
  id: number;
  user: { id: number; name: string };
}

// Raw API shapes
interface RawTask {
  id: number;
  task_name: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  employee_id: number;
  employee?: TaskEmployee;
}

interface RawBookingTask {
  id: number;
  service_type: string;
  notes: string | null;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  booking?: { id: number; booking_number: string; booking_type?: string };
  department?: { id: number; name: string };
  assignedEmployee?: TaskEmployee;
  assigned_employee_id?: number;
}

// Unified card shown on the board
interface UnifiedCard {
  uid: string;                     // "t-{id}" | "bt-{id}"
  source: "task" | "booking_task";
  rawId: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority | null;
  status: TaskStatus;
  assigneeName: string | null;
  // booking-task extras
  booking_number?: string;
  service_type?: string;
  department_name?: string;
  // generic-task extras (needed for edit form)
  employee_id?: number;
}

interface EmployeeOption {
  id: number;
  user: { id: number; name: string };
}

interface Column {
  name: TaskStatus;
  items: UnifiedCard[];
  bgClass: string;
  chipColor: "warning" | "primary" | "success" | "error";
}

interface Columns {
  [key: string]: Column;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_ORDER: TaskStatus[] = [
  "Pending",
  "In Progress",
  "Finished",
  "Cancelled",
];

const COLUMN_META: Record<
  TaskStatus,
  { bgClass: string; chipColor: "warning" | "primary" | "success" | "error" }
> = {
  Pending:      { bgClass: "bg-orange-100",    chipColor: "warning" },
  "In Progress":{ bgClass: "bg-primary-100",   chipColor: "primary" },
  Finished:     { bgClass: "bg-success-100",   chipColor: "success" },
  Cancelled:    { bgClass: "bg-secondary-100", chipColor: "error"   },
};

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  High: 3, Medium: 2, Low: 1,
};

// ── Status mapping ────────────────────────────────────────────────────────────

const BT_TO_KANBAN: Record<RawBookingTask["status"], TaskStatus> = {
  pending:     "Pending",
  in_progress: "In Progress",
  completed:   "Finished",
  cancelled:   "Cancelled",
};

const KANBAN_TO_BT: Record<TaskStatus, RawBookingTask["status"]> = {
  "Pending":     "pending",
  "In Progress": "in_progress",
  "Finished":    "completed",
  "Cancelled":   "cancelled",
};

// ── Adapters ──────────────────────────────────────────────────────────────────

const adaptTask = (t: RawTask): UnifiedCard => ({
  uid:          `t-${t.id}`,
  source:       "task",
  rawId:        t.id,
  title:        t.task_name,
  description:  t.description,
  due_date:     t.due_date,
  priority:     t.priority,
  status:       t.status,
  assigneeName: t.employee?.user?.name ?? null,
  employee_id:  t.employee_id,
});

const adaptBookingTask = (bt: RawBookingTask): UnifiedCard => ({
  uid:            `bt-${bt.id}`,
  source:         "booking_task",
  rawId:          bt.id,
  title:          bt.service_type
                    ? `${bt.service_type.charAt(0).toUpperCase() + bt.service_type.slice(1)} Task`
                    : "Booking Task",
  description:    bt.notes,
  due_date:       null,
  priority:       null,
  status:         BT_TO_KANBAN[bt.status],
  assigneeName:   bt.assignedEmployee?.user?.name ?? null,
  booking_number: bt.booking?.booking_number,
  service_type:   bt.service_type,
  department_name:bt.department?.name,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const groupByStatus = (cards: UnifiedCard[]): Columns => {
  const cols: Columns = {};
  STATUS_ORDER.forEach((status) => {
    cols[status] = {
      name: status,
      items: cards
        .filter((c) => c.status === status)
        .sort((a, b) => {
          // booking tasks go after generic tasks within a column
          if (a.source !== b.source) return a.source === "task" ? -1 : 1;
          if (a.priority && b.priority) {
            return PRIORITY_ORDER[b.priority] - PRIORITY_ORDER[a.priority];
          }
          return 0;
        }),
      ...COLUMN_META[status],
    };
  });
  return cols;
};

const calcDaysLeft = (dueDate: string | null): string => {
  if (!dueDate) return "No deadline";
  const diff = dayjs(dueDate).diff(dayjs(), "day");
  if (diff < 0)  return "Overdue";
  if (diff === 0) return "Due today";
  return `${diff} day${diff !== 1 ? "s" : ""} left`;
};

const priorityChipColor = (
  p: TaskPriority
): "error" | "warning" | "success" =>
  p === "High" ? "error" : p === "Medium" ? "warning" : "success";

// ── Styled Dialog matching theme rmu-modal ────────────────────────────────────

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": { padding: theme.spacing(2) },
  "& .MuiDialogActions-root": { padding: theme.spacing(1) },
}));

// ── Component ─────────────────────────────────────────────────────────────────

const KanbanBoard: React.FC = () => {
  const [cards,     setCards]     = useState<UnifiedCard[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [columns,   setColumns]   = useState<Columns>({});
  const [loading,   setLoading]   = useState(true);

  // Modal state — only for generic tasks (booking tasks managed from booking page)
  const [openModal,   setOpenModal]   = useState(false);
  const [editingTask, setEditingTask] = useState<UnifiedCard | null>(null);

  // Form fields
  const [taskName,    setTaskName]    = useState("");
  const [description, setDescription] = useState("");
  const [employeeId,  setEmployeeId]  = useState<number | "">("");
  const [taskStatus,  setTaskStatus]  = useState<TaskStatus>("Pending");
  const [priority,    setPriority]    = useState<TaskPriority>("Medium");
  const [dueDate,     setDueDate]     = useState<Dayjs | null>(null);
  const [saving,      setSaving]      = useState(false);

  // ── Fetch on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get<RawTask[]>("/api/tasks"),
      api.get<RawBookingTask[]>("/api/booking-tasks"),
      api.get<EmployeeOption[]>("/api/employees"),
    ])
      .then(([tasksRes, btRes, empRes]) => {
        const unified = [
          ...tasksRes.data.map(adaptTask),
          ...btRes.data.map(adaptBookingTask),
        ];
        setCards(unified);
        setEmployees(empRes.data);
        setColumns(groupByStatus(unified));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setColumns(groupByStatus(cards));
  }, [cards]);

  // ── Drag & Drop ─────────────────────────────────────────────────────────────
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;

    const sourceCol   = columns[source.droppableId];
    const sourceItems = Array.from(sourceCol.items);

    if (source.droppableId === destination.droppableId) {
      // Reorder within same column — no API call needed
      const [moved] = sourceItems.splice(source.index, 1);
      sourceItems.splice(destination.index, 0, moved);
      setColumns({
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
      });
    } else {
      // Move to different column — update status
      const destCol   = columns[destination.droppableId];
      const destItems = Array.from(destCol.items);
      const [moved]   = sourceItems.splice(source.index, 1);
      const newStatus = destination.droppableId as TaskStatus;

      moved.status = newStatus;
      destItems.splice(destination.index, 0, moved);

      setColumns({
        ...columns,
        [source.droppableId]:      { ...sourceCol, items: sourceItems },
        [destination.droppableId]: { ...destCol,   items: destItems   },
      });
      setCards((prev) =>
        prev.map((c) => (c.uid === moved.uid ? { ...c, status: newStatus } : c))
      );

      // Persist to the correct API
      if (moved.source === "task") {
        api.put(`/api/tasks/${moved.rawId}`, { status: newStatus });
      } else {
        api.put(`/api/booking-tasks/${moved.rawId}/status`, {
          status: KANBAN_TO_BT[newStatus],
        });
      }
    }
  };

  // ── Modal helpers — only for generic tasks ──────────────────────────────────
  const openAdd = (defaultStatus: TaskStatus = "Pending") => {
    setEditingTask(null);
    setTaskName(""); setDescription(""); setEmployeeId("");
    setTaskStatus(defaultStatus); setPriority("Medium"); setDueDate(null);
    setOpenModal(true);
  };

  const openEdit = (card: UnifiedCard) => {
    // Booking tasks are managed from the booking page, not here
    if (card.source !== "task") return;
    setEditingTask(card);
    setTaskName(card.title);
    setDescription(card.description ?? "");
    setEmployeeId(card.employee_id ?? "");
    setTaskStatus(card.status);
    setPriority(card.priority ?? "Medium");
    setDueDate(card.due_date ? dayjs(card.due_date) : null);
    setOpenModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSaving(true);

    const payload = {
      task_name:   taskName,
      description,
      employee_id: employeeId,
      status:      taskStatus,
      priority,
      due_date:    dueDate ? dueDate.format("YYYY-MM-DD") : null,
    };

    try {
      if (editingTask) {
        await api.put(`/api/tasks/${editingTask.rawId}`, payload);
      } else {
        await api.post("/api/tasks", payload);
      }
      // Re-fetch generic tasks and merge back
      const res = await api.get<RawTask[]>("/api/tasks");
      setCards((prev) => [
        ...prev.filter((c) => c.source !== "task"),
        ...res.data.map(adaptTask),
      ]);
      setOpenModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (card: UnifiedCard) => {
    if (card.source !== "task") return;
    await api.delete(`/api/tasks/${card.rawId}`);
    setCards((prev) => prev.filter((c) => c.uid !== card.uid));
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <Card
        sx={{
          boxShadow: "none",
          borderRadius: "7px",
          mb: "25px",
          padding: { xs: "15px 18px", sm: "18px 20px", lg: "20px 25px" },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className="rmui-card"
      >
        <Typography
          variant="h3"
          sx={{ fontSize: { xs: "16px", md: "18px" }, fontWeight: 700 }}
          className="text-black"
        >
          Kanban Board
        </Typography>

        <Button
          variant="contained"
          onClick={() => openAdd()}
          sx={{
            textTransform: "capitalize",
            borderRadius: "8px",
            fontWeight: 500,
            fontSize: "13px",
            padding: "8px 20px",
            color: "#fff !important",
          }}
        >
          <AddIcon sx={{ position: "relative", top: "-1px", mr: "4px" }} />
          Add New Task
        </Button>
      </Card>

      {/* ── Board ───────────────────────────────────────────────────────────── */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box
          sx={{
            display: "flex",
            gap: "20px",
            overflowX: "auto",
            pb: 2,
          }}
        >
          {STATUS_ORDER.map((status) => {
            const col = columns[status];
            if (!col) return null;

            return (
              <Box key={status} sx={{ minWidth: 290, flex: "0 0 290px" }}>

                {/* Column header */}
                <Card
                  sx={{
                    boxShadow: "none",
                    borderRadius: "7px",
                    mb: "15px",
                    padding: "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                  className="rmui-card"
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Chip
                      label={status}
                      color={col.chipColor}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: "12px" }}
                    />
                    <Typography
                      sx={{ fontSize: "13px" }}
                      color="text.secondary"
                    >
                      {col.items.length}
                    </Typography>
                  </Box>
                  <Tooltip title={`Add to ${status}`}>
                    <IconButton size="small" onClick={() => openAdd(status)}>
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Card>

                {/* Droppable area */}
                <StrictModeDroppable droppableId={status}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        minHeight: 420,
                        borderRadius: "7px",
                        transition: "background 0.15s",
                        background: snapshot.isDraggingOver
                          ? "rgba(96,93,255,0.05)"
                          : "transparent",
                        p: snapshot.isDraggingOver ? "6px" : 0,
                      }}
                    >
                      {col.items.map((card, index) => (
                        <Draggable
                          key={card.uid}
                          draggableId={card.uid}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              sx={{
                                marginBottom: "15px",
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                ...provided.draggableProps.style,
                              }}
                            >
                              {/* Task card */}
                              <Box
                                className={col.bgClass}
                                sx={{
                                  padding: "20px 25px",
                                  borderRadius: "7px",
                                  boxShadow: snapshot.isDragging
                                    ? "0 8px 28px rgba(0,0,0,0.14)"
                                    : "none",
                                  borderLeft: card.source === "booking_task"
                                    ? "3px solid #0097a7"
                                    : "3px solid transparent",
                                }}
                              >
                                {/* Card header row */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    mb: "10px",
                                  }}
                                >
                                  <Box sx={{ flex: 1, mr: 1 }}>
                                    {/* Booking badge */}
                                    {card.source === "booking_task" && (
                                      <Box sx={{ display: "flex", gap: "5px", mb: "5px", flexWrap: "wrap" }}>
                                        <Chip
                                          label="Booking Task"
                                          size="small"
                                          sx={{
                                            height: 18,
                                            fontSize: "10px",
                                            bgcolor: "#e0f7fa",
                                            color: "#00838f",
                                            fontWeight: 600,
                                            "& .MuiChip-label": { px: "6px" },
                                          }}
                                        />
                                        {card.booking_number && (
                                          <Chip
                                            label={`#${card.booking_number}`}
                                            size="small"
                                            sx={{
                                              height: 18,
                                              fontSize: "10px",
                                              bgcolor: "#e8eaf6",
                                              color: "#3949ab",
                                              "& .MuiChip-label": { px: "6px" },
                                            }}
                                          />
                                        )}
                                      </Box>
                                    )}
                                    <Typography
                                      variant="h4"
                                      fontWeight={600}
                                      fontSize="14px"
                                      className="text-black"
                                      sx={{ lineHeight: 1.4 }}
                                    >
                                      {card.title}
                                    </Typography>
                                    {card.department_name && (
                                      <Typography sx={{ fontSize: "11px", color: "#607d8b", mt: "2px" }}>
                                        {card.department_name}
                                      </Typography>
                                    )}
                                  </Box>

                                  {/* Edit/Delete only for generic tasks */}
                                  {card.source === "task" && (
                                    <Box sx={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                                      <IconButton
                                        size="small"
                                        onClick={() => openEdit(card)}
                                        sx={{ p: "3px" }}
                                      >
                                        <EditIcon sx={{ fontSize: "14px" }} />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDelete(card)}
                                        sx={{ p: "3px" }}
                                      >
                                        <DeleteIcon sx={{ fontSize: "14px" }} />
                                      </IconButton>
                                    </Box>
                                  )}
                                </Box>

                                {/* Description / Notes */}
                                {card.description && (
                                  <Typography
                                    sx={{
                                      fontSize: "13px",
                                      mb: "15px",
                                      opacity: 0.75,
                                      lineHeight: 1.55,
                                    }}
                                  >
                                    {card.description}
                                  </Typography>
                                )}

                                {/* Footer row */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    mt: "15px",
                                  }}
                                >
                                  <AvatarGroup
                                    max={3}
                                    sx={{
                                      "& .MuiAvatar-root": {
                                        border: "2px solid #fff",
                                        width: "28px",
                                        height: "28px",
                                        fontSize: "11px",
                                      },
                                      "& .MuiAvatarGroup-avatar": {
                                        backgroundColor: "#605dff",
                                        color: "#fff",
                                        fontSize: "10px",
                                      },
                                    }}
                                  >
                                    {card.assigneeName && (
                                      <Tooltip title={card.assigneeName}>
                                        <Avatar
                                          sx={{
                                            backgroundColor: card.source === "booking_task" ? "#0097a7" : "#605dff",
                                            color: "#fff",
                                          }}
                                        >
                                          {card.assigneeName.charAt(0).toUpperCase()}
                                        </Avatar>
                                      </Tooltip>
                                    )}
                                  </AvatarGroup>

                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "8px",
                                    }}
                                  >
                                    {card.priority && (
                                      <Chip
                                        label={card.priority}
                                        color={priorityChipColor(card.priority)}
                                        size="small"
                                        sx={{ fontSize: "11px", height: "22px" }}
                                      />
                                    )}
                                    {card.due_date && (
                                      <Typography
                                        sx={{ fontSize: "12px" }}
                                        color="primary.main"
                                      >
                                        {calcDaysLeft(card.due_date)}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </Box>
                            </Box>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}

                      {/* Empty drop zone hint */}
                      {col.items.length === 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            height: 80,
                            borderRadius: "7px",
                            border: "2px dashed",
                            borderColor: "divider",
                            opacity: 0.45,
                          }}
                        >
                          <Typography variant="caption" color="text.secondary">
                            Drop tasks here
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}
                </StrictModeDroppable>
              </Box>
            );
          })}
        </Box>
      </DragDropContext>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <BootstrapDialog
        onClose={() => setOpenModal(false)}
        open={openModal}
        className="rmu-modal"
        maxWidth="sm"
        fullWidth
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#f6f7f9",
            padding: { xs: "15px 20px", md: "25px" },
          }}
          className="rmu-modal-header"
        >
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, fontSize: { xs: "16px", md: "18px" } }}
            className="text-black"
          >
            {editingTask ? "Edit Task" : "Add New Task"}
          </Typography>

          <IconButton size="small" onClick={() => setOpenModal(false)}>
            <ClearIcon />
          </IconButton>
        </Box>

        {/* Body */}
        <Box className="rmu-modal-content">
          <Box component="form" noValidate onSubmit={handleSubmit}>
            <Box
              sx={{ padding: "25px", borderRadius: "8px" }}
              className="bg-white"
            >
              <Grid container spacing={2}>

                {/* Task Name */}
                <Grid item xs={12}>
                  <Typography
                    component="h5"
                    sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}
                    className="text-black"
                  >
                    Task Name
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    label="Title"
                    autoFocus
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    InputProps={{ style: { borderRadius: 8 } }}
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <Typography
                    component="h5"
                    sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}
                    className="text-black"
                  >
                    Description
                  </Typography>
                  <textarea
                    placeholder="Task description"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: "100%",
                      borderRadius: "6px",
                      padding: "10px 15px",
                      border: "1px solid #D5D9E2",
                      fontFamily: "inherit",
                      fontSize: "14px",
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                </Grid>

                {/* Assigned To */}
                <Grid item xs={12} md={6}>
                  <Typography
                    component="label"
                    sx={{
                      fontWeight: 500,
                      fontSize: "14px",
                      mb: "10px",
                      display: "block",
                    }}
                    className="text-black"
                  >
                    Assigned To
                  </Typography>
                  <FormControl fullWidth required>
                    <InputLabel>Employee</InputLabel>
                    <Select
                      value={employeeId}
                      label="Employee"
                      onChange={(e: SelectChangeEvent<number | "">) =>
                        setEmployeeId(e.target.value as number)
                      }
                    >
                      {employees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.user?.name ?? `Employee #${emp.id}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Deadline */}
                <Grid item xs={12} md={6}>
                  <Typography
                    component="h5"
                    sx={{ fontWeight: 500, fontSize: "14px", mb: "12px" }}
                    className="text-black"
                  >
                    Deadline Date
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={dueDate}
                      onChange={(val) => setDueDate(val)}
                      sx={{
                        width: "100%",
                        "& fieldset": {
                          border: "1px solid #D5D9E2",
                          borderRadius: "7px",
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>

                {/* Status */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={taskStatus}
                      label="Status"
                      onChange={(e) =>
                        setTaskStatus(e.target.value as TaskStatus)
                      }
                    >
                      {STATUS_ORDER.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Priority */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Priority</InputLabel>
                    <Select
                      value={priority}
                      label="Priority"
                      onChange={(e) =>
                        setPriority(e.target.value as TaskPriority)
                      }
                    >
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Actions */}
                <Grid item xs={12} mt={1}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "end",
                      gap: "10px",
                    }}
                  >
                    <Button
                      onClick={() => setOpenModal(false)}
                      variant="outlined"
                      color="error"
                      sx={{
                        textTransform: "capitalize",
                        borderRadius: "8px",
                        fontWeight: 500,
                        fontSize: "13px",
                        padding: "11px 30px",
                      }}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={saving}
                      sx={{
                        textTransform: "capitalize",
                        borderRadius: "8px",
                        fontWeight: 500,
                        fontSize: "13px",
                        padding: "11px 30px",
                        color: "#fff !important",
                      }}
                    >
                      {saving ? (
                        <CircularProgress
                          size={16}
                          color="inherit"
                          sx={{ mr: 1 }}
                        />
                      ) : (
                        <AddIcon sx={{ position: "relative", top: "-1px" }} />
                      )}{" "}
                      {editingTask ? "Update" : "Create"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Box>
      </BootstrapDialog>
    </>
  );
};

export default KanbanBoard;
