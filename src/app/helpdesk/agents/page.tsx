import * as React from "react"; 
import NextLink from 'next/link';
import PerformanceOfAgents from "@/components/HelpDesk/PerformanceOfAgents";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Agents</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>HelpDesk</li>
          <li>Agents</li>
        </ul>
      </div>

      <PerformanceOfAgents />
    </>
  );
}
