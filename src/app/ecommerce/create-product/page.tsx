import * as React from "react";
import NextLink from 'next/link';   
import CreateProduct from "@/components/eCommerce/CreateProduct";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Create Product</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Create Product</li>
        </ul>
      </div>

      <CreateProduct />
    </>
  );
}
