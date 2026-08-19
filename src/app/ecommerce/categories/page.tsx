import * as React from "react";
import NextLink from 'next/link';       
import CategoriesTable from "@/components/eCommerce/Categories/CategoriesTable";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Categories</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Categories</li>
        </ul>
      </div>

      <CategoriesTable />
    </>
  );
}
