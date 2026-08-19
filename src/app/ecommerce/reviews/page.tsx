import * as React from "react";
import NextLink from 'next/link';    
import ReviewsTable from "@/components/eCommerce/Reviews/ReviewsTable"; 

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Reviews</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>eCommerce</li>
          <li>Reviews</li>
        </ul>
      </div>

      <ReviewsTable />
    </>
  );
}
