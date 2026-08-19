import * as React from "react";
import NextLink from 'next/link';     
import Payroll from "@/components/Payroll/Payroll";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Payroll List</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Payrolls</li>
          <li>Payroll List</li>
        </ul>
      </div>

      <Payroll />
    </>
  );
}
