import * as React from "react";
import NextLink from "next/link";
import SupplierInvoices from "@/components/Suppliers/Invoices";

export default function Page() {
  return (
    <>
      <div className="breadcrumb-card">
        <h5>Supplier Invoices</h5>
        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>Suppliers</li>
          <li>Invoices</li>
        </ul>
      </div>

      <SupplierInvoices />
    </>
  );
}
