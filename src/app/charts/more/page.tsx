import * as React from "react";
import NextLink from 'next/link';
import Grid from "@mui/material/Grid";  
import BasicRangeAreaChart from "@/components/Charts/MoreCharts/BasicRangeAreaChart";
import BasicTimelineChart from "@/components/Charts/MoreCharts/BasicTimelineChart";
import BasicCandlestickChart from "@/components/Charts/MoreCharts/BasicCandlestickChart";
import BasicBoxplotChart from "@/components/Charts/MoreCharts/BasicBoxplotChart";
import BasicBubbleChart from "@/components/Charts/MoreCharts/BasicBubbleChart";
import BasicScatterChart from "@/components/Charts/MoreCharts/BasicScatterChart";
import BasicTreemapChart from "@/components/Charts/MoreCharts/BasicTreemapChart";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>More Charts</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Charts</li>
          <li>More Charts</li>
        </ul>
      </div>

      <Grid container columnSpacing={{ xs: 1, sm: 2, md: 2, lg: 3 }}>
        <Grid item xs={12} md={12} lg={12} xl={6}>
          <BasicRangeAreaChart />

          <BasicCandlestickChart />

          <BasicBubbleChart /> 
        </Grid>

        <Grid item xs={12} md={12} lg={12} xl={6}>
          <BasicTimelineChart />

          <BasicBoxplotChart />

          <BasicScatterChart />
        </Grid>
      </Grid>

      <BasicTreemapChart />
    </>
  );
}
