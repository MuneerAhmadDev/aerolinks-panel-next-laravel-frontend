import * as React from "react";
import Grid from "@mui/material/Grid";
import NextLink from 'next/link';      
import Ticket from "@/components/HelpDesk/TicketDetails/Ticket";
import TicketDescription from "@/components/HelpDesk/TicketDetails/TicketDescription";
import Comments from "@/components/HelpDesk/TicketDetails/TicketDescription/Comments";
import Attachments from "@/components/HelpDesk/TicketDetails/Attachments";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Ticket Details</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Tickets</li>
          <li>Ticket Details</li>
        </ul>
      </div>

      <Ticket />

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} sm={12} md={7} lg={7} xl={8}>
          <TicketDescription />

          <Comments />
        </Grid>

        <Grid item xs={12} sm={12} md={5} lg={5} xl={4}>
          <Attachments />
        </Grid>
      </Grid>
    </>
  );
}
