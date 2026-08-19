import * as React from "react";
import NextLink from 'next/link';     
import SuppliersList from "@/components/Suppliers/SuppliersList";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Suppliers List</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Suppliers</li>
          <li>Suppliers List</li>
        </ul>
      </div>

      <SuppliersList />
    </>
  );
}
