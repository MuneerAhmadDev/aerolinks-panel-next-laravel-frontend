import * as React from "react";
import NextLink from 'next/link';    
import Cart from "@/components/eCommerce/Cart";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Cart</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Cart</li>
        </ul>
      </div>

      <Cart />
    </>
  );
}
