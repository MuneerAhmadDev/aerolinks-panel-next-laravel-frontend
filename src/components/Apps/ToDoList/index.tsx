"use client";

import React, { useState, useEffect, FormEvent } from "react";
import axios from "axios";
import {
  Card,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TablePagination,
  TableRow,
  Paper,
  IconButton,
  TableHead,
  Checkbox,
  InputLabel,
  MenuItem,
  FormControl,
  Dialog,
  DialogTitle,
  Grid,
  Button,
  TextField,
  Select,
  Autocomplete,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import KeyboardArrowLeft from "@mui/icons-material/KeyboardArrowLeft";
import KeyboardArrowRight from "@mui/icons-material/KeyboardArrowRight";
import { styled } from "@mui/material/styles";
import LastPageIcon from "@mui/icons-material/LastPage";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import AddIcon from "@mui/icons-material/Add";
import ClearIcon from "@mui/icons-material/Clear";
import CloseIcon from "@mui/icons-material/Close";
import { SelectChangeEvent } from "@mui/material/Select";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import Link from "next/link";
import { Dayjs } from "dayjs";
import dayjs from 'dayjs';

import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import TablePaginationActions from "@mui/material/TablePagination/TablePaginationActions";
// import Checkbox from "@mui/material/Checkbox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBox from "@mui/icons-material/CheckBox";
import api from "@/api/api";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { co } from "@fullcalendar/core/internal-common";
import { Task } from "@mui/icons-material";

import Swal from "sweetalert2";

// Interfaces for Task and Employee data
interface Task {
  id: number;
  task_name: string;
  due_date: string;
  priority: string;
  status: string;
  description: string;
  employee?: {
    id: number;
    user: {
      id: number;
      name: string;
      email: string;
    };
  };
}

interface Employee {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

// Custom styled Dialog
const CustomDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialogContent-root": {
    padding: theme.spacing(2),
  },
  "& .MuiDialogActions-root": {
    padding: theme.spacing(1),
  },
}));

// Custom DialogTitle component with a close icon.
interface CustomDialogTitleProps {
  children?: React.ReactNode;
  onClose: () => void;
}

const CustomDialogTitle: React.FC<CustomDialogTitleProps> = (props) => {
  const { children, onClose, ...other } = props;
  return (
    <DialogTitle sx={{ m: 0, p: 2 }} {...other}>
      {children}
      {onClose ? (
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
      ) : null}
    </DialogTitle>
  );
};

// Table Pagination Actions Component with updated onPageChange type.
// interface TablePaginationActionsProps {
//   count: number;
//   page: number;
//   rowsPerPage: number;
//   onPageChange: (event: unknown, newPage: number) => void;
// }

interface TablePaginationActionsProps {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => void;
}


const ToDoList: React.FC = () => {
  // States for tasks and employees
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  // const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([]);
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterEmployee, setFilterEmployee] = useState<string>("");

  // Pagination state
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Modal state for task creation
  const [open, setOpen] = useState<boolean>(false);

  // Form fields for new task
  const [taskName, setTaskName] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  // const [selectedEmployee, setSelectedEmployee] = useState<Employee[]>([]);
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [dueDate, setDueDate] = useState<Dayjs | null>(null);

  // const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [openViewModal, setOpenViewModal] = useState<boolean>(false);
  const [openEditModal, setOpenEditModal] = useState<boolean>(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTaskName, setEditTaskName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDate, setEditDueDate] = useState<Dayjs | null>(null);
  const [editSelectedEmployee, setEditSelectedEmployee] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const [searchQuery, setSearchQuery] = useState("");

  // Open edit modal and populate fields
const handleEditClick = (task: Task) => {
  setSelectedTask(task);
  setEditTaskName(task.task_name);
  setEditDescription(task.description || '');
  setEditDueDate(task.due_date ? dayjs(task.due_date) : null);
  setEditSelectedEmployee(task.employee?.id?.toString() || '');
  setEditPriority(task.priority);
  setEditStatus(task.status);
  setEditModalOpen(true);
};

// Handle form submission
const handleEditSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!selectedTask) return;

  const updatedTask = {
    task_name: editTaskName,
    description: editDescription,
    due_date: editDueDate?.format('YYYY-MM-DD'),
    employee_id: editSelectedEmployee,
    priority: editPriority,
    status: editStatus
  };
  console.log(updatedTask);
  try {
    const response = await api.put(`/api/tasks/${selectedTask.id}`, updatedTask);
    setTasks(tasks.map(task => 
      task.id === selectedTask.id ? response.data : task
    ));
    fetchEmployees();
    fetchTasks();
    setEditModalOpen(false);
  } catch (error) {
    console.error('Error updating task:', error);
  }
};
  // Fetch tasks and employees on mount
  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await api.get("/api/tasks");
      setTasks(response.data);
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/api/employees");
      console.log(response.data);
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  // Update handleChangePage to use unknown for event type.
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleDeleteTask = async (taskId: number) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/api/tasks/${taskId}`);
          setTasks(tasks.filter((task) => task.id !== taskId));
          Swal.fire("Deleted!", "Your task has been deleted.", "success");
        } catch (error) {
          Swal.fire("Error!", "There was an error deleting the task.", "error");
        }
      }
    });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formattedDueDate = dueDate ? dayjs(dueDate).format("YYYY-MM-DD") : null;

    const newTask = {
      task_name: taskName,
      employee_id: selectedEmployee,
      description: description,
      due_date: formattedDueDate, // Format date as needed
      priority,
      status,
    };

    try {
      const response = await api.post("/api/tasks", newTask);
      // Find the employee details based on the selectedEmployee id
      const employeeData = employees.find(emp => emp.id.toString() === selectedEmployee);
      // Merge the employee data into the new task object
      const newTaskWithEmployee = { ...response.data, employee: employeeData };

      setTasks([response.data, ...tasks]);
      // Reset form fields
      setTaskName("");
      setSelectedEmployee("");
      setDueDate(null);
      setPriority("");
      setStatus("");
      handleClose();
      fetchEmployees();
      fetchTasks();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  // Filter tasks before rendering
  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filterStatus ? task.status === filterStatus : true;
    const priorityMatch = filterPriority ? task.priority === filterPriority : true;
    // const employeeMatch = filterEmployee
    //   ? task.employee?.user?.id.toString() === filterEmployee
    //   : true;
    const employeeMatch =
    selectedEmployees.length > 0
      ? selectedEmployees.some(emp => emp.id === task.employee?.id)
      : true;
    const searchMatch = searchQuery
    ? task.task_name.toLowerCase().includes(searchQuery.toLowerCase())
    : true;  
    return statusMatch && priorityMatch && employeeMatch && searchMatch;
  });

  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredTasks.length) : 0;

  return (
    <>
      {/* Filter UI */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        {/* Status Filter */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e: SelectChangeEvent) => setFilterStatus(e.target.value)}
            label="Status"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Finished">Finished</MenuItem>
            <MenuItem value="Cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        {/* Priority Filter */}
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Priority</InputLabel>
          <Select
            value={filterPriority}
            onChange={(e: SelectChangeEvent) => setFilterPriority(e.target.value)}
            label="Priority"
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </Select>
        </FormControl>

        {/* Employee Filter */}
        {/* <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Employee</InputLabel>
          <Select
            value={filterEmployee}
            onChange={(e: SelectChangeEvent) => setFilterEmployee(e.target.value)}
            label="Employee"
          >
            <MenuItem value="">All</MenuItem>
            {employees.map((employee) => (
              <MenuItem key={employee.id} value={employee.id}>
                {employee.user?.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl> */}
        {/* <Autocomplete
        options={employees}
        sx={{ minWidth: 200 }}
        getOptionLabel={(option) => (option.user && option.user.name ? option.user.name : String(option.id))}
        value={selectedEmployee.map(employee => employee.id.toString())}
        isOptionEqualToValue={(option: Employee, value: Employee) => option.id === value.id}
        onChange={(event, newValue) => setSelectedEmployee(newValue)}
        renderInput={(params) => (
          <TextField {...params} label="Select Employee" variant="filled" required />
        )}
      /> */}
        {/* <FormControl sx={{ minWidth: 200 }}>
          <Autocomplete
            multiple
            options={employees}
            getOptionLabel={(option) => option.user?.name || String(option.id)}
            value={selectedEmployee.map(employee => employee.id).join(",")}
            onChange={(event, newValue) => setSelectedEmployee(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Assigned To" variant="filled" />
            )}
          />
        </FormControl> */}
        <FormControl sx={{ minWidth: 200 }}>
          <Autocomplete
            multiple
            options={employees}
            disableCloseOnSelect
            getOptionLabel={(option) => option.user?.name || String(option.id)}
            renderOption={(props, option, { selected }) => (
              <li {...props}>
                <Checkbox
                  icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                  checkedIcon={<CheckBoxIcon fontSize="small" />}
                  style={{ marginRight: 8 }}
                  checked={selected}
                />
                {option.user?.name || String(option.id)}
              </li>
            )}
            value={selectedEmployees}
            onChange={(event, newValue) => setSelectedEmployees(newValue)}
            renderInput={(params) => (
              <TextField {...params} label="Assigned To" variant="filled" />
            )}
          />
        </FormControl>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => {
            setFilterStatus("");
            setFilterPriority("");
            setFilterEmployee("");
          }}
        >
          Reset Filters
        </Button>
      </Box>

      {/* Main Card containing table */}
      <Card
        sx={{
          boxShadow: "none",
          borderRadius: "7px",
          mb: "25px",
          padding: { xs: "18px", sm: "20px", lg: "25px" },
        }}
      >
        <Box
          sx={{
            display: { xs: "block", sm: "flex" },
            alignItems: "center",
            justifyContent: "space-between",
            mb: "25px",
          }}
        >
          <form className="t-search-form">
            <label>
              <i className="material-symbols-outlined">search</i>
            </label>
            <input type="text" className="t-input" 
            placeholder="Search task here..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          <Button
            onClick={handleClickOpen}
            variant="outlined"
            sx={{
              textTransform: "capitalize",
              borderRadius: "7px",
              fontWeight: "500",
              fontSize: "13px",
              padding: "6px 13px",
            }}
            color="primary"
          >
            <AddIcon sx={{ position: "relative", top: "-1px" }} /> Add New Task
          </Button>
        </Box>
        <Box sx={{ marginLeft: "-25px", marginRight: "-25px" }}>
          <TableContainer component={Paper} sx={{ boxShadow: "none", borderRadius: "0" }}>
            <Table sx={{ minWidth: 1000 }} aria-label="To Do List Table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "500", padding: "10px 24px", fontSize: "14px" }}>
                    #
                  </TableCell>
                  <TableCell sx={{ fontWeight: "500", padding: "10px 20px", fontSize: "14px" }}>
                    ID
                  </TableCell>
                  <TableCell sx={{ fontWeight: "500", padding: "10px 20px", fontSize: "14px" }}>
                    Task Name
                  </TableCell>
                  <TableCell sx={{ fontWeight: "500", padding: "10px 20px", fontSize: "14px" }}>
                    Assigned To
                  </TableCell>
                  <TableCell sx={{ fontWeight: "500", padding: "10px 20px", fontSize: "14px" }}>
                    Due Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: "500", padding: "10px 20px", fontSize: "14px" }}>
                    Priority
                  </TableCell>
                  <TableCell sx={{ fontWeight: "500", padding: "10px 20px", fontSize: "14px" }}>
                    Status
                  </TableCell>
                  <TableCell sx={{ fontWeight: "500", padding: "10px 20px", fontSize: "14px" }}>
                    Action
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(rowsPerPage > 0
                  ? filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  : filteredTasks
                ).map((task) => (
                  <TableRow key={task.id}>
                    <TableCell sx={{ padding: "5px 13px", fontSize: "14px", width: "65px" }}>
                      <Checkbox sx={{ padding: "8px" }} />
                    </TableCell>
                    <TableCell sx={{ padding: "15px 20px", fontSize: "14px" }}>{task.id}</TableCell>
                    <TableCell sx={{ padding: "15px 20px", fontSize: "14px" }}>{task.task_name}</TableCell>
                    <TableCell sx={{ padding: "15px 20px", fontSize: "14px" }}>
                      {task.employee?.user?.name || "N/A"}
                    </TableCell>
                    <TableCell sx={{ padding: "15px 20px", fontSize: "14px" }}>{task.due_date}</TableCell>
                    <TableCell sx={{ padding: "15px 20px", fontSize: "14px" }}>{task.priority}</TableCell>
                    <TableCell sx={{ padding: "15px 20px" }}>
                      <Typography variant="body2">{task.status}</Typography>
                    </TableCell>
                    <TableCell sx={{ padding: "15px 20px" }}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        {/* <Link href={`/tasks/${task.id}`} passHref> */}
                          <IconButton aria-label="view" color="primary" 
                          sx={{ padding: "5px" }}
                          onClick={() => {
                            setSelectedTask(task);
                            setOpenViewModal(true);
                          }}
                          >
                            <i className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                              visibility
                            </i>
                          </IconButton>
                        {/* </Link> */}
                        {/* <Link href={`/tasks/edit/${task.id}`} passHref> */}
                          <IconButton aria-label="edit" color="secondary" 
                          sx={{ padding: "5px" }}
                          onClick={() => handleEditClick(task)}
                          // onClick={() => {
                          //   setSelectedTask(task);
                          //   setOpenEditModal(true);
                          // }}
                          >
                            <i className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                              edit
                            </i>
                          </IconButton>
                        {/* </Link> */}
                        <IconButton aria-label="delete" color="error" sx={{ padding: "5px" }}
                        onClick={() => handleDeleteTask(task.id)}
                        >
                          <i className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                            delete
                          </i>
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 53 * emptyRows }}>
                    <TableCell colSpan={8} />
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, { label: "All", value: -1 }]}
                    colSpan={8}
                    count={filteredTasks.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    ActionsComponent={TablePaginationActions}
                    sx={{ border: "none" }}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Box>
      </Card>

      {/* Modal for Adding New Task */}
      <CustomDialog onClose={handleClose} open={open}>
        <CustomDialogTitle onClose={handleClose}>Add New Task</CustomDialogTitle>
        <Box sx={{ padding: "25px", borderRadius: "8px" }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Task Name
                </Typography>
                <TextField
                  required
                  fullWidth
                  label="Task Name"
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
                    value={dueDate}
                    onChange={(newValue) => setDueDate(newValue)}
                    // renderInput={(params) => <TextField {...params} />}
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
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Assigned To
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="employee-select-label">Select Employee</InputLabel>
                  <Select
                    labelId="employee-select-label"
                    value={selectedEmployee}
                    label="Select Employee"
                    onChange={(e: SelectChangeEvent) => setSelectedEmployee(e.target.value)}
                  >
                    {employees.map((employee) => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.user?.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {/* <FormControl sx={{ minWidth: 200 }}>
                  <Autocomplete
                    multiple
                    options={employees}
                    getOptionLabel={(option) => option.user?.name || String(option.id)}
                    value={selectedEmployees}
                    onChange={(event, newValue) => setSelectedEmployees(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Assigned To" variant="filled" />
                    )}
                  />
                </FormControl> */}
                {/* <FormControl sx={{ minWidth: 200 }}>
                  <Autocomplete
                    // multiple
                    options={employees}
                    disableCloseOnSelect
                    getOptionLabel={(option) => option.user?.name || String(option.id)}
                    renderOption={(props, option, { selected }) => (
                      <li {...props}>
                        <Checkbox
                          icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                          checkedIcon={<CheckBoxIcon fontSize="small" />}
                          style={{ marginRight: 8 }}
                          checked={selected}
                        />
                        {option.user?.name || String(option.id)}
                      </li>
                    )}
                    value={selectedEmployees}
                    onChange={(event, newValue) => setSelectedEmployees(newValue)}
                    renderInput={(params) => (
                      <TextField {...params} label="Assigned To" variant="filled" />
                    )}
                  />
                </FormControl> */}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Priority
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="priority-select-label">Select</InputLabel>
                  <Select
                    labelId="priority-select-label"
                    value={priority}
                    label="Select"
                    onChange={(e: SelectChangeEvent) => setPriority(e.target.value)}
                  >
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
                  Status
                </Typography>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">Select</InputLabel>
                  <Select
                    labelId="status-select-label"
                    value={status}
                    label="Select"
                    onChange={(e: SelectChangeEvent) => setStatus(e.target.value)}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Finished">Finished</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <Button
                    onClick={handleClose}
                    variant="outlined"
                    color="error"
                    sx={{
                      textTransform: "capitalize",
                      borderRadius: "8px",
                      fontWeight: "500",
                      fontSize: "13px",
                      padding: "11px 30px",
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
                      fontWeight: "500",
                      fontSize: "13px",
                      padding: "11px 30px",
                      color: "#fff !important",
                    }}
                  >
                    <AddIcon sx={{ position: "relative", top: "-2px", mr: "5px" }} /> Create
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Box>
      </CustomDialog>
                    
      {/* View Task Modal */}
      <CustomDialog onClose={() => setOpenViewModal(false)} open={openViewModal}>
        <CustomDialogTitle onClose={() => setOpenViewModal(false)}>
          View Task
        </CustomDialogTitle>
        <Box sx={{ padding: "25px", borderRadius: "8px", minWidth: "400px" }}>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
            Task Name
          </Typography>
          <Typography variant="body1" sx={{ mb: "20px" }}>
            {selectedTask?.task_name}
          </Typography>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
            Description
          </Typography>
          <Typography variant="body1" sx={{ mb: "20px" }}>
            {selectedTask?.description}
          </Typography>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
            Due Date
          </Typography>
          <Typography variant="body1" sx={{ mb: "20px" }}>
            {selectedTask?.due_date}
          </Typography>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
            Priority
          </Typography>
          <Typography variant="body1" sx={{ mb: "20px" }}>
            {selectedTask?.priority}
          </Typography>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
            Status
          </Typography>
          <Typography variant="body1" sx={{ mb: "20px" }}>
            {selectedTask?.status}
          </Typography>
          <Typography sx={{ fontWeight: "500", fontSize: "14px", mb: "12px" }}>
            Assigned To
          </Typography>
          <Typography variant="body1" sx={{ mb: "20px" }}>
            {selectedTask?.employee?.user?.name}
          </Typography>
        </Box>
      </CustomDialog>
      
      {/* Edit Task Modal */}
      {/* Edit Task Modal */}
      <CustomDialog open={editModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="md">
        <CustomDialogTitle onClose={() => setEditModalOpen(false)}>
          Edit Task
        </CustomDialogTitle>
        <Box sx={{ p: 3 }}>
          {selectedTask && (
            <form onSubmit={handleEditSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    Task Name
                  </Typography>
                  <TextField
                    required
                    fullWidth
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    InputProps={{ style: { borderRadius: 8 } }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    Description
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    InputProps={{ style: { borderRadius: 8 } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    Due Date
                  </Typography>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={editDueDate}
                      onChange={(newValue) => setEditDueDate(newValue)}
                      sx={{ width: '100%' }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    Assigned To
                  </Typography>
                  <FormControl fullWidth>
                    <Select
                      value={editSelectedEmployee}
                      onChange={(e) => setEditSelectedEmployee(e.target.value)}
                    >
                      {employees.map((employee) => (
                        <MenuItem key={employee.id} value={employee.id}>
                          {employee.user?.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    Priority
                  </Typography>
                  <Select
                    fullWidth
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  >
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight={500}>
                    Status
                  </Typography>
                  <Select
                    fullWidth
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Finished">Finished</MenuItem>
                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                  </Select>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setEditModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                    >
                      Update Task
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}
        </Box>
      </CustomDialog>

    </>
  );
};

export default ToDoList;