import * as React from "react";
import NextLink from 'next/link';    
import Checkout from "@/components/eCommerce/Checkout";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Checkout</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Checkout</li>
        </ul>
      </div>

      <Checkout />
    </>
  );
}
