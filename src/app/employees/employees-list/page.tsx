import * as React from "react";
import NextLink from 'next/link';     
// import UsersList from "@/components/Users/UsersList";
import EmployeesList from "@/components/Employees/EmployeesList";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Employees List</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Employees</li>
          <li>Employees List</li>
        </ul>
      </div>

      <EmployeesList />
    </>
  );
}
