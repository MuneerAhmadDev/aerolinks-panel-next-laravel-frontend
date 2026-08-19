import * as React from "react";
import NextLink from 'next/link';     
// import AddSupplier from "@/components/Suppliers/AddSupplier";
import AddCustomer from "@/components/Customers/AddCustomer";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Add Customer</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Customers</li>
          <li>Add Customer</li>
        </ul>
      </div>

      <AddCustomer />
    </>
  );
}
