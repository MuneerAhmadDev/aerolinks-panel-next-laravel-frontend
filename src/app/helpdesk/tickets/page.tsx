import * as React from "react";
import Grid from "@mui/material/Grid";
import NextLink from 'next/link';     
import TicketsResolved from "@/components/HelpDesk/Tickets/TicketsResolved";
import TicketsInProgress from "@/components/HelpDesk/Tickets/TicketsInProgress";
import TicketsDue from "@/components/HelpDesk/Tickets/TicketsDue";
import TicketsNewOpen from "@/components/HelpDesk/Tickets/TicketsNewOpen";
import AllTickets from "@/components/HelpDesk/Tickets/AllTickets";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Tickets</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>HelpDesk</li>
          <li>Tickets</li>
        </ul>
      </div>

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
          <TicketsResolved />
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
          <TicketsInProgress />
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
          <TicketsDue />
        </Grid>

        <Grid item xs={12} sm={6} md={3} lg={3} xl={3}>
          <TicketsNewOpen />
        </Grid>
      </Grid>

      <AllTickets />
    </>
  );
}
