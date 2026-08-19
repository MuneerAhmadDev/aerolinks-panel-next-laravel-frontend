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
  DialogTitle,
  Grid,
  FormControl,
  InputLabel,
  TextField,
  OutlinedInput,
  Checkbox,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// ---------------- Data Types ----------------
interface Employee {
  id: string;
  name: string;
  img: string;
}

export interface Task {
  id: string;
  taskName: string;
  description: string;
  daysLeft: string;
  // Instead of teamMembers, we use assignedTo (array of employee IDs)
  assignedTo: string[];
  status: "Pending" | "In Progress" | "Finished" | "Cancelled";
  priority: "High" | "Medium" | "Low";
}


// ---------------- Sample Data ----------------

// Sample employees (simulate data from server)
const sampleEmployees: Employee[] = [
  { id: "e1", name: "Sarah Johnson", img: "/images/users/user6.jpg" },
  { id: "e2", name: "Michael Smith", img: "/images/users/user7.jpg" },
  { id: "e3", name: "Emily Brown", img: "/images/users/user8.jpg" },
  { id: "e4", name: "Jason Lee", img: "/images/users/user9.jpg" },
  { id: "e5", name: "Ashley Davis", img: "/images/users/user10.jpg" },
  { id: "e6", name: "Mark Thompson", img: "/images/users/user11.jpg" },
];

// Sample tasks (simulate data from server – 4 tasks)
const sampleTasks: Task[] = [
  {
    id: "1",
    taskName: "Project Requirements",
    description:
      "A brief description of the project, its objectives, and its importance to the organization.",
    daysLeft: "5 days left",
    assignedTo: ["e1", "e2"],
    status: "Pending",
    priority: "High",
  },
  {
    id: "2",
    taskName: "WordPress Theme",
    description:
      "A brief description of the project, its objectives, and its importance to the organization.",
    daysLeft: "7 days left",
    assignedTo: ["e3", "e4"],
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: "3",
    taskName: "UX/UI Design",
    description:
      "A brief description of the project, its objectives, and its importance to the organization.",
    daysLeft: "10 days left",
    assignedTo: ["e5"],
    status: "Finished",
    priority: "Low",
  },
  {
    id: "4",
    taskName: "Project Analysis",
    description:
      "A brief description of the project, its objectives, and its importance to the organization.",
    daysLeft: "14 days left",
    assignedTo: ["e1", "e4"],
    status: "Cancelled",
    priority: "High",
  },
];

// ---------------- Column Types ----------------
interface Column {
  name: string;
  items: Task[];
}

interface Columns {
  [key: string]: Column;
}

// Priority sort mapping: higher number means higher priority
const priorityOrder: Record<Task["priority"], number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

// Group tasks by status and sort by priority (High > Medium > Low)
const groupTasksByStatus = (tasks: Task[]): Columns => {
  const statuses: Task["status"][] = ["Pending", "In Progress", "Finished", "Cancelled"];
  const cols: Columns = {};
  statuses.forEach((status) => {
    cols[status] = {
      name: status,
      items: tasks
        .filter((task) => task.status === status)
        .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]),
    };
  });
  return cols;
};

// ---------------- Styled Dialog ----------------
const CustomDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

interface CustomDialogTitleProps {
  children?: React.ReactNode;
  onClose: () => void;
}

const CustomDialogTitle: React.FC<CustomDialogTitleProps> = (props) => {
  const { children, onClose, ...other } = props;
  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose && (
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </DialogTitle>
  );
};

// ---------------- Filter Types ----------------
interface Filters {
  status: string[]; // Multiple statuses can be selected
  assignedTo: string[];
  priority: string;
}

const KanbanBoard: React.FC = () => {
  // In a real app, fetch tasks and employees from your server
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [employees, setEmployees] = useState<Employee[]>(sampleEmployees);

  // Filters state: status is now an array for multi-select
  const [filters, setFilters] = useState<Filters>({
    status: [],
    assignedTo: [],
    priority: "",
  });

  // Modal state for adding a new task
  const [openModal, setOpenModal] = useState(false);

  // Modal fields for new task
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState<Task["status"]>("Pending");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [deadlineDate, setDeadlineDate] = useState<string>("");

  // Columns state (group tasks by status and sort by priority)
  const [columns, setColumns] = useState<Columns>(groupTasksByStatus(sampleTasks));

  // Update columns when tasks change
  useEffect(() => {
    setColumns(groupTasksByStatus(tasks));
  }, [tasks]);

  // Filter function for tasks
  const applyFilters = (task: Task) => {
    const { status: filterStatus, assignedTo: filterAssigned, priority: filterPriority } = filters;
    const statusMatch =
      filterStatus.length > 0 ? filterStatus.includes(task.status) : true;
    const priorityMatch = filterPriority ? task.priority === filterPriority : true;
    const assignedMatch =
      filterAssigned.length > 0
        ? filterAssigned.some((empId) => task.assignedTo.includes(empId))
        : true;
    return statusMatch && priorityMatch && assignedMatch;
  };

  // Drag & Drop handler
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    if (source.droppableId !== destination.droppableId) {
      const sourceCol = columns[source.droppableId];
      const destCol = columns[destination.droppableId];
      const sourceItems = Array.from(sourceCol.items);
      const destItems = Array.from(destCol.items);
      const [removed] = sourceItems.splice(source.index, 1);
      // Update task status to destination column
      removed.status = destination.droppableId as Task["status"];
      destItems.splice(destination.index, 0, removed);
      const newCols = {
        ...columns,
        [source.droppableId]: { ...sourceCol, items: sourceItems },
        [destination.droppableId]: { ...destCol, items: destItems },
      };
      setColumns(newCols);
      setTasks(Object.values(newCols).flatMap((col) => col.items));
    } else {
      const col = columns[source.droppableId];
      const copiedItems = Array.from(col.items);
      const [removed] = copiedItems.splice(source.index, 1);
      copiedItems.splice(destination.index, 0, removed);
      const newCols = {
        ...columns,
        [source.droppableId]: { ...col, items: copiedItems },
      };
      setColumns(newCols);
      setTasks(Object.values(newCols).flatMap((col) => col.items));
    }
  };

  // Handlers for filters
  const handleFilterChange = (field: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  // Modal submit: add new task
  const handleModalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newTask: Task = {
      id: (Math.random() * 1000000).toFixed(0),
      taskName,
      description,
      daysLeft: deadlineDate || "No deadline",
      assignedTo,
      status: taskStatus,
      priority,
    };
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    // Reset modal fields and close modal
    setTaskName("");
    setDescription("");
    setTaskStatus("Pending");
    setPriority("Medium");
    setAssignedTo([]);
    setDeadlineDate("");
    setOpenModal(false);
  };

  // Handle multi-select for Assigned To in modal
  const handleAssignedToChange = (event: SelectChangeEvent<typeof assignedTo>) => {
    const { target: { value } } = event;
    setAssignedTo(typeof value === "string" ? value.split(",") : value);
  };

  // Handle multi-select for Status filter
  const handleStatusFilterChange = (event: SelectChangeEvent<string[]>) => {
    const { target: { value } } = event;
    handleFilterChange("status", typeof value === "string" ? value.split(",") : value);
  };

  // Sort tasks in a column (by priority order)
  const sortTasks = (tasks: Task[]) =>
    tasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

  // Determine card style based on status
  const getCardStyle = (task: Task) => {
    if (task.status === "Cancelled") {
      return {
        backgroundColor: "#e0e0e0",
        textDecoration: "line-through",
      };
    }
    return {
      backgroundColor:
        task.status === "In Progress" ? "#fff3cd" : // Yellowish
        task.status === "Finished" ? "#d4edda" : // Green
        "#ffffff",
    };
  };

  // Badge for priority
  const renderPriorityBadge = (priority: Task["priority"]) => {
    let color: "error" | "warning" | "success" = "success";
    if (priority === "High") color = "error";
    else if (priority === "Medium") color = "warning";
    return <Chip label={priority} color={color} size="small" />;
  };

  return (
    <>
      {/* Add New Task Button & Filters */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, alignItems: "center" }}>
          <Button variant="contained" color="primary" onClick={() => setOpenModal(true)}>
            <AddIcon sx={{ mr: 1 }} /> Add New Task
          </Button>
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                multiple
                value={filters.status}
                label="Status"
                onChange={handleStatusFilterChange}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {["Pending", "In Progress", "Finished", "Cancelled"].map((status) => (
                  <MenuItem key={status} value={status}>
                    <Checkbox checked={filters.status.indexOf(status) > -1} />
                    <ListItemText primary={status} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                label="Priority"
                onChange={(e) => handleFilterChange("priority", e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Assigned To</InputLabel>
              <Select
                multiple
                value={filters.assignedTo}
                onChange={(e: SelectChangeEvent<string[]>) =>
                  handleFilterChange(
                    "assignedTo",
                    typeof e.target.value === "string" ? e.target.value.split(",") : e.target.value
                  )
                }
                renderValue={(selected) =>
                  (selected as string[])
                    .map((id) => employees.find((emp) => emp.id === id)?.name || id)
                    .join(", ")
                }
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    <Checkbox checked={filters.assignedTo.indexOf(emp.id) > -1} />
                    <ListItemText primary={emp.name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: "flex", gap: 2, overflowX: "auto", p: 2 }}>
          {Object.entries(columns).map(([colId, col]) => (
            <Box key={colId} sx={{ minWidth: 300 }}>
              <Typography variant="h6" align="center" sx={{ mb: 2 }}>
                {col.name}
              </Typography>
              <Droppable droppableId={colId}>
                {(provided, snapshot) => (
                  <Box
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    sx={{
                      background: snapshot.isDraggingOver ? "lightblue" : "#f4f5f7",
                      padding: 2,
                      minHeight: 500,
                      borderRadius: 2,
                    }}
                  >
                    {sortTasks(
                      col.items.filter(applyFilters)
                    ).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            sx={{
                              marginBottom: 2,
                              ...provided.draggableProps.style,
                            }}
                          >
                            <Card sx={{ padding: "25px", borderRadius: "7px", ...getCardStyle(task) }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                                <Typography variant="h6" fontWeight={600} fontSize="15px">
                                  {task.taskName}
                                </Typography>
                                <IconButton aria-label="edit" size="small">
                                  <EditIcon fontSize="inherit" />
                                </IconButton>
                              </Box>
                              <Typography mb={2}>{task.description}</Typography>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <AvatarGroup
                                  max={3}
                                  sx={{
                                    "& .MuiAvatar-root": {
                                      border: "2px solid #fff",
                                      width: "28px",
                                      height: "28px",
                                    },
                                    "& .MuiAvatarGroup-avatar": {
                                      backgroundColor: "#605dff",
                                      color: "#fff",
                                      fontSize: "10px",
                                    },
                                  }}
                                >
                                  {task.assignedTo.map((empId, i) => {
                                    const emp = employees.find((e) => e.id === empId);
                                    return (
                                      <Avatar key={i} alt={emp?.name} src={emp?.img} />
                                    );
                                  })}
                                </AvatarGroup>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  {renderPriorityBadge(task.priority)}
                                  <Typography color="primary.main">{task.daysLeft}</Typography>
                                </Box>
                              </Box>
                            </Card>
                          </Box>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                )}
              </Droppable>
            </Box>
          ))}
        </Box>
      </DragDropContext>

      {/* Add New Task Modal */}
      <CustomDialog onClose={() => setOpenModal(false)} open={openModal}>
        <CustomDialogTitle onClose={() => setOpenModal(false)}>Add New Task</CustomDialogTitle>
        <Box sx={{ p: 3 }}>
          <form onSubmit={handleModalSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={500}>
                  Task Name
                </Typography>
                <TextField
                  name="taskName"
                  required
                  fullWidth
                  label="Task Name"
                  autoFocus
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  InputProps={{ style: { borderRadius: 8 } }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight={500}>
                  Task Description
                </Typography>
                <TextField
                  name="description"
                  required
                  fullWidth
                  label="Description"
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  InputProps={{ style: { borderRadius: 8 } }}
                />
              </Grid>
              <Grid item xs={12} md={12}>
                <Typography
                  component="h5"
                  sx={{
                    fontWeight: "500",
                    fontSize: "14px",
                    mb: "15px",
                  }}
                  className="text-black"
                >
                  Due Date
                </Typography>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
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
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="assigned-to-select-label">Assigned To</InputLabel>
                  <Select
                    labelId="assigned-to-select-label"
                    id="assigned-to-select"
                    multiple
                    value={assignedTo}
                    onChange={(e: SelectChangeEvent<typeof assignedTo>) => handleAssignedToChange(e)}
                    input={<OutlinedInput label="Assigned To" />}
                    renderValue={(selected) =>
                      (selected as string[])
                        .map((id) => employees.find((emp) => emp.id === id)?.name || id)
                        .join(", ")
                    }
                  >
                    {employees.map((emp) => (
                      <MenuItem key={emp.id} value={emp.id}>
                        <Checkbox checked={assignedTo.indexOf(emp.id) > -1} />
                        <ListItemText primary={emp.name} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Status</InputLabel>
                  <Select
                    labelId="status-select-label"
                    value={taskStatus}
                    label="Status"
                    onChange={(e: SelectChangeEvent<typeof taskStatus>) =>
                      setTaskStatus(e.target.value as Task["status"])
                    }
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Finished">Finished</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="priority-select-label">Priority</InputLabel>
                  <Select
                    labelId="priority-select-label"
                    value={priority}
                    label="Priority"
                    onChange={(e: SelectChangeEvent<typeof priority>) =>
                      setPriority(e.target.value as "High" | "Medium" | "Low")
                    }
                  >
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                  <Button variant="outlined" color="error" onClick={() => setOpenModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="contained" color="primary">
                    Create
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      </CustomDialog>
    </>
  );
};

export default KanbanBoard;
