import * as React from "react";
import NextLink from 'next/link';
import Grid from "@mui/material/Grid";
import BasicRadarChart from "@/components/Charts/Radar/BasicRadarChart";
import MultipleRadarChart from "@/components/Charts/Radar/MultipleRadarChart";
import PolygonRadarChart from "@/components/Charts/Radar/PolygonRadarChart";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Radar Charts</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Charts</li>
          <li>Radar Charts</li>
        </ul>
      </div>

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} sm={12} lg={6} xl={6}>
          <BasicRadarChart />
        </Grid>

        <Grid item xs={12} sm={12} lg={6} xl={6}>
          <MultipleRadarChart />
        </Grid>

        <Grid item xs={12} sm={12} lg={12} xl={12}>
          <PolygonRadarChart />
        </Grid>
      </Grid>
    </>
  );
}
