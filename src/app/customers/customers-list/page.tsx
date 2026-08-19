import * as React from "react";
import NextLink from 'next/link';     
// import SuppliersList from "@/components/Suppliers/SuppliersList";
import CustomersList from "@/components/Customers/CustomersList";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Customers List</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Customers</li>
          <li>Customers List</li>
        </ul>
      </div>

      <CustomersList />
    </>
  );
}
