import * as React from "react";
import NextLink from 'next/link';
import Grid from "@mui/material/Grid";
import LineColumnChart from "@/components/Charts/Mixed/LineColumnChart";
import LineAreaChart from "@/components/Charts/Mixed/LineAreaChart";
import MultipleYAxisChart from "@/components/Charts/Mixed/MultipleYAxisChart";
import LineColumnAreaChart from "@/components/Charts/Mixed/LineColumnAreaChart";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Mixed Charts</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Charts</li>
          <li>Mixed Charts</li>
        </ul>
      </div>

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} md={12} lg={12} xl={6}>
          <LineColumnChart />

          <LineAreaChart />
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={6}>
          <MultipleYAxisChart />

          <LineColumnAreaChart />
        </Grid>
      </Grid>
    </>
  );
}
