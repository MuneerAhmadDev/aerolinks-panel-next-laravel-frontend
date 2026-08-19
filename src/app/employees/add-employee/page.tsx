import * as React from "react";
import NextLink from 'next/link';     
// import AddUser from "@/components/Users/AddUser";
import AddEmployee from "@/components/Employees/AddEmployee";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Add Employee</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Employee</li>
          <li>Add Employee</li>
        </ul>
      </div>

      <AddEmployee />
    </>
  );
}
