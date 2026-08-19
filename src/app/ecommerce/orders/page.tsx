import * as React from "react";
import NextLink from 'next/link';    
import OrdersTable from "@/components/eCommerce/OrdersTable";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Orders</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Orders</li>
        </ul>
      </div>

      <OrdersTable />
    </>
  );
}
