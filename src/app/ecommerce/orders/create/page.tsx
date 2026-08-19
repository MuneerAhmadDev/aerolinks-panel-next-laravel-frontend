import * as React from "react";
import NextLink from 'next/link';    
import CreateOrder from "@/components/eCommerce/CreateOrder";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Create Order</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Create Order</li>
        </ul>
      </div>

      <CreateOrder />
    </>
  );
}
