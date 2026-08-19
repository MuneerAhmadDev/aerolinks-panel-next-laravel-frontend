import * as React from "react";
import NextLink from 'next/link';
import Grid from "@mui/material/Grid";
import BasicAreaChart from "@/components/Charts/Area/BasicAreaChart";
import SplineAreaChart from "@/components/Charts/Area/SplineAreaChart";
import NegativeValuesAreaChart from "@/components/Charts/Area/NegativeValuesAreaChart";
import MissingNullValuesAreaChart from "@/components/Charts/Area/MissingNullValuesAreaChart";
import StackedAreaChart from "@/components/Charts/Area/StackedAreaChart"; 

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Area Charts</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Charts</li>
          <li>Area Charts</li>
        </ul>
      </div>

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} md={12} lg={12} xl={6}>
          <BasicAreaChart />

          <StackedAreaChart /> 

          <SplineAreaChart />
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={6}> 
          <NegativeValuesAreaChart />

          <MissingNullValuesAreaChart />
        </Grid>
      </Grid>
    </>
  );
}
