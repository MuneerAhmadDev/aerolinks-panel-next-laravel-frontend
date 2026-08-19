import * as React from "react";
import NextLink from "next/link";  
import Creators from "@/components/NFT/Creators";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Creators</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>NFT</li>
          <li>Creators</li>
        </ul>
      </div>

      <Creators />
    </>
  );
}
