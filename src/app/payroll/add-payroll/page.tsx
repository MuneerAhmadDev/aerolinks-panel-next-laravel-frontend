import * as React from "react";
import NextLink from 'next/link';     
import AddPayroll from "@/components/Payroll/AddPayroll";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Add Payroll</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Payrolls</li>
          <li>Add Payroll</li>
        </ul>
      </div>

      <AddPayroll />
    </>
  );
}
