"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { styled } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MuiAccordion, { AccordionProps } from "@mui/material/Accordion";
import MuiAccordionSummary, {
  AccordionSummaryProps,
} from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import { Box, Typography } from "@mui/material";
import { useDepartment } from "@/context/DepartmentContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&::before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ExpandMoreIcon sx={{ fontSize: "1.1rem", transition: "transform 0.2s" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#3a4252" : "#f6f7f9",
  flexDirection: "row",
  "& .MuiAccordionSummary-expandIconWrapper": {
    marginLeft: "auto",
  },
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(180deg)",
  },
  "& .MuiAccordionSummary-content": { alignItems: "center" },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
}));

interface LeftSidebarProps {
  toggleActive: () => void;
}

/** Map a pathname to the accordion panel that owns it */
function getActivePanel(pathname: string): string | false {
  if (pathname.startsWith("/users/"))             return "panel1";
  if (pathname.startsWith("/bookings/"))          return "panel2";
  if (pathname.startsWith("/suppliers/"))         return "panel3";
  if (pathname.startsWith("/customers/"))         return "panel312";
  if (pathname.startsWith("/employees/"))         return "panel111";
  if (pathname.startsWith("/finance/"))           return "panel12";
  if (pathname.startsWith("/payroll/"))           return "panel5";
  return false;
}

const LeftSidebarMenu: React.FC<LeftSidebarProps> = ({ toggleActive }) => {
  const pathname = usePathname();
  const { hasPermission, isSuperAdmin } = useDepartment();
  const { logoUrl, siteTitle } = useSiteSettings();

  // Default to the panel that matches the current URL
  const [expanded, setExpanded] = React.useState<string | false>(
    () => getActivePanel(pathname)
  );

  const handleChange =
    (panel: string) => (_event: React.SyntheticEvent, newExpanded: boolean) => {
      setExpanded(newExpanded ? panel : false);
    };

  // SuperAdmin bypasses all permission checks
  const can = (permission: string) => isSuperAdmin || hasPermission(permission);

  return (
    <Box className="leftSidebarDark">
      <Box className="left-sidebar-menu">
        <Box className="logo">
          <Link href="/dashboard">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt={siteTitle ?? "logo"}
                style={{ height: 36, maxWidth: 160, width: "auto", objectFit: "contain", display: "block" }}
              />
            ) : (
              <Image
                src="/images/logo-icon.svg"
                alt="logo-icon"
                width={36}
                height={36}
              />
            )}
          </Link>
        </Box>

        <Box className="burger-menu" onClick={toggleActive}>
          <Typography component="span" className="top-bar"></Typography>
          <Typography component="span" className="middle-bar"></Typography>
          <Typography component="span" className="bottom-bar"></Typography>
        </Box>

        <Box className="sidebar-inner">
          <Box className="sidebar-menu">
            <Typography
              className="sub-title"
              sx={{ display: "block", fontWeight: "500", textTransform: "uppercase" }}
            >
              MAIN
            </Typography>

            {/* ── Dashboard (always visible) ── */}
            <Link
              href="/dashboard"
              className={`sidebar-menu-link ${pathname === "/dashboard" ? "active" : ""}`}
            >
              <i className="material-symbols-outlined">dashboard</i>
              <Typography component="span" className="title">Dashboard</Typography>
            </Link>

            {/* ── Users ── */}
            {can("view-users") && (
              <Accordion
                expanded={expanded === "panel1"}
                onChange={handleChange("panel1")}
                className="mat-accordion"
              >
                <AccordionSummary className="mat-summary" aria-controls="panel1d-content" id="panel1d-header">
                  <i className="material-symbols-outlined">group</i>
                  <Typography component="span" className="title">Users</Typography>
                </AccordionSummary>
                <AccordionDetails className="mat-details">
                  <ul className="sidebar-sub-menu">
                    <li className="sidemenu-item">
                      <Link href="/users/users-list/" className={`sidemenu-link ${pathname === "/users/users-list/" ? "active" : ""}`}>
                        Users List
                      </Link>
                    </li>
                    <li className="sidemenu-item">
                      <Link href="/users/add-user/" className={`sidemenu-link ${pathname === "/users/add-user/" ? "active" : ""}`}>
                        Add Users
                      </Link>
                    </li>
                  </ul>
                </AccordionDetails>
              </Accordion>
            )}

            {/* ── Bookings ── */}
            {can("view-bookings") && (
              <Accordion
                expanded={expanded === "panel2"}
                onChange={handleChange("panel2")}
                className="mat-accordion"
              >
                <AccordionSummary className="mat-summary" aria-controls="panel2d-content" id="panel2d-header">
                  <i className="material-symbols-outlined">calendar_today</i>
                  <Typography component="span" className="title">Bookings</Typography>
                </AccordionSummary>
                <AccordionDetails className="mat-details">
                  <ul className="sidebar-sub-menu">
                    {can("create-bookings") && (
                      <li className="sidemenu-item">
                        <Link href="/bookings/add-booking/" className={`sidemenu-link ${pathname === "/bookings/add-booking/" ? "active" : ""}`}>
                          Add Booking
                        </Link>
                      </li>
                    )}
                    <li className="sidemenu-item">
                      <Link href="/bookings/manage-bookings/" className={`sidemenu-link ${pathname === "/bookings/manage-bookings/" ? "active" : ""}`}>
                        Manage Bookings
                      </Link>
                    </li>
                    {can("view-tasks") && (
                      <li className="sidemenu-item">
                        <Link href="/bookings/booking-tasks/" className={`sidemenu-link ${pathname === "/bookings/booking-tasks/" ? "active" : ""}`}>
                          Booking Tasks
                        </Link>
                      </li>
                    )}
                  </ul>
                </AccordionDetails>
              </Accordion>
            )}

            {/* ── Suppliers ── */}
            {can("view-suppliers") && (
              <Accordion
                expanded={expanded === "panel3"}
                onChange={handleChange("panel3")}
                className="mat-accordion"
              >
                <AccordionSummary className="mat-summary" aria-controls="panel3d-content" id="panel3d-header">
                  <i className="material-symbols-outlined">inventory</i>
                  <Typography component="span" className="title">Suppliers</Typography>
                </AccordionSummary>
                <AccordionDetails className="mat-details">
                  <ul className="sidebar-sub-menu">
                    <li className="sidemenu-item">
                      <Link href="/suppliers/suppliers-list/" className={`sidemenu-link ${pathname === "/suppliers/suppliers-list/" ? "active" : ""}`}>
                        Suppliers List
                      </Link>
                    </li>
                    {can("create-suppliers") && (
                      <li className="sidemenu-item">
                        <Link href="/suppliers/add-supplier/" className={`sidemenu-link ${pathname === "/suppliers/add-supplier/" ? "active" : ""}`}>
                          Add Supplier
                        </Link>
                      </li>
                    )}
                    <li className="sidemenu-item">
                      <Link href="/suppliers/invoices" className={`sidemenu-link ${pathname === "/suppliers/invoices" ? "active" : ""}`}>
                        Invoices
                      </Link>
                    </li>
                    {can("view-suppliers") && (
                      <li className="sidemenu-item">
                        <Link href="/suppliers/master-invoice" className={`sidemenu-link ${pathname === "/suppliers/master-invoice" ? "active" : ""}`}>
                          Master Invoice
                        </Link>
                      </li>
                    )}
                  </ul>
                </AccordionDetails>
              </Accordion>
            )}

            {/* ── Customers ── */}
            {can("view-customers") && (
              <Accordion
                expanded={expanded === "panel312"}
                onChange={handleChange("panel312")}
                className="mat-accordion"
              >
                <AccordionSummary className="mat-summary" aria-controls="panel312d-content" id="panel312d-header">
                  <i className="material-symbols-outlined">people</i>
                  <Typography component="span" className="title">Customers</Typography>
                </AccordionSummary>
                <AccordionDetails className="mat-details">
                  <ul className="sidebar-sub-menu">
                    <li className="sidemenu-item">
                      <Link href="/customers/customers-list/" className={`sidemenu-link ${pathname === "/customers/customers-list/" ? "active" : ""}`}>
                        Customers List
                      </Link>
                    </li>
                    {can("create-customers") && (
                      <li className="sidemenu-item">
                        <Link href="/customers/add-customer/" className={`sidemenu-link ${pathname === "/customers/add-customer/" ? "active" : ""}`}>
                          Add Customer
                        </Link>
                      </li>
                    )}
                  </ul>
                </AccordionDetails>
              </Accordion>
            )}

            {/* ── Employees ── */}
            {can("view-employees") && (
              <Accordion
                expanded={expanded === "panel111"}
                onChange={handleChange("panel111")}
                className="mat-accordion"
              >
                <AccordionSummary className="mat-summary" aria-controls="panel111d-content" id="panel111d-header">
                  <i className="material-symbols-outlined">badge</i>
                  <Typography component="span" className="title">Employees</Typography>
                </AccordionSummary>
                <AccordionDetails className="mat-details">
                  <ul className="sidebar-sub-menu">
                    <li className="sidemenu-item">
                      <Link href="/employees/employees-list/" className={`sidemenu-link ${pathname === "/employees/employees-list/" ? "active" : ""}`}>
                        Employee List
                      </Link>
                    </li>
                    {can("create-employees") && (
                      <li className="sidemenu-item">
                        <Link href="/employees/add-employee/" className={`sidemenu-link ${pathname === "/employees/add-employee/" ? "active" : ""}`}>
                          Add Employee
                        </Link>
                      </li>
                    )}
                  </ul>
                </AccordionDetails>
              </Accordion>
            )}

            {/* ── My Tasks (always visible — personal) ── */}
            <Link
              href="/apps/to-do-list/"
              className={`sidebar-menu-link ${pathname === "/apps/to-do-list/" ? "active" : ""}`}
            >
              <i className="material-symbols-outlined">checklist</i>
              <Typography component="span" className="title">My Tasks</Typography>
            </Link>

            {/* ── Kanban Board (always visible) ── */}
            <Link
              href="/apps/kanban-board/"
              className={`sidebar-menu-link ${pathname === "/apps/kanban-board/" ? "active" : ""}`}
            >
              <i className="material-symbols-outlined">view_kanban</i>
              <Typography component="span" className="title">Kanban Board</Typography>
            </Link>

            {/* ── Finance ── */}
            {can("view-finance") && (
              <Accordion
                expanded={expanded === "panel12"}
                onChange={handleChange("panel12")}
                className="mat-accordion"
              >
                <AccordionSummary className="mat-summary" aria-controls="panel12d-content" id="panel12d-header">
                  <i className="material-symbols-outlined">calculate</i>
                  <Typography component="span" className="title">Finance</Typography>
                </AccordionSummary>
                <AccordionDetails className="mat-details">
                  <ul className="sidebar-sub-menu">
                    <li className="sidemenu-item">
                      <Link href="/finance/" className={`sidemenu-link ${pathname === "/finance/" ? "active" : ""}`}>
                        Profit &amp; Loss
                      </Link>
                    </li>
                    <li className="sidemenu-item">
                      <Link href="/finance/expenses/" className={`sidemenu-link ${pathname === "/finance/expenses/" ? "active" : ""}`}>
                        Expense Ledger
                      </Link>
                    </li>
                    <li className="sidemenu-item">
                      <Link href="/finance/commissions/" className={`sidemenu-link ${pathname === "/finance/commissions/" ? "active" : ""}`}>
                        Commissions
                      </Link>
                    </li>
                    {can("manage-finance") && (
                      <li className="sidemenu-item">
                        <Link href="/finance/commission-settings/" className={`sidemenu-link ${pathname === "/finance/commission-settings/" ? "active" : ""}`}>
                          Commission Slabs
                        </Link>
                      </li>
                    )}
                  </ul>
                </AccordionDetails>
              </Accordion>
            )}

            {/* ── Reports ── */}
            {can("view-reports") && (
              <Link
                href="/reports"
                className={`sidebar-menu-link ${pathname === "/reports" ? "active" : ""}`}
              >
                <i className="material-symbols-outlined">bar_chart</i>
                <Typography component="span" className="title">Reports</Typography>
              </Link>
            )}

            {/* ── Accounts / Payroll ── */}
            {can("view-payroll") && (
              <Accordion
                expanded={expanded === "panel5"}
                onChange={handleChange("panel5")}
                className="mat-accordion"
              >
                <AccordionSummary className="mat-summary" aria-controls="panel5d-content" id="panel5d-header">
                  <i className="material-symbols-outlined">account_balance</i>
                  <Typography component="span" className="title">Accounts</Typography>
                </AccordionSummary>
                <AccordionDetails className="mat-details">
                  <ul className="sidebar-sub-menu">
                    <li className="sidemenu-item">
                      <Link href="/payroll/payroll-list/" className={`sidemenu-link ${pathname === "/payroll/payroll-list/" ? "active" : ""}`}>
                        Payroll
                      </Link>
                    </li>
                    {can("create-payroll") && (
                      <li className="sidemenu-item">
                        <Link href="/payroll/add-payroll/" className={`sidemenu-link ${pathname === "/payroll/add-payroll/" ? "active" : ""}`}>
                          Add Payroll
                        </Link>
                      </li>
                    )}
                  </ul>
                </AccordionDetails>
              </Accordion>
            )}

            {/* ── My Profile (always visible) ── */}
            <Link
              href="/my-profile/"
              className={`sidebar-menu-link ${pathname === "/my-profile/" ? "active" : ""}`}
            >
              <i className="material-symbols-outlined">person</i>
              <Typography component="span" className="title">My Profile</Typography>
            </Link>

            {/* ── Notifications (always visible) ── */}
            <Link
              href="/notifications"
              className={`sidebar-menu-link ${pathname === "/notifications" ? "active" : ""}`}
            >
              <i className="material-symbols-outlined">notifications</i>
              <Typography component="span" className="title">Notifications</Typography>
            </Link>

            {/* ── Settings ── */}
            {can("manage-settings") && (
              <Link
                href="/site-settings/"
                className={`sidebar-menu-link ${pathname === "/site-settings/" ? "active" : ""}`}
              >
                <i className="material-symbols-outlined">settings</i>
                <Typography component="span" className="title">Settings</Typography>
              </Link>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LeftSidebarMenu;
