import * as React from "react";
import NextLink from "next/link";
import MasterInvoice from "@/components/Suppliers/MasterInvoice";

export default function Page() {
  return (
    <>
      <div className="breadcrumb-card">
        <h5>Master Invoice</h5>
        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>Suppliers</li>
          <li>Master Invoice</li>
        </ul>
      </div>

      <MasterInvoice />
    </>
  );
}
