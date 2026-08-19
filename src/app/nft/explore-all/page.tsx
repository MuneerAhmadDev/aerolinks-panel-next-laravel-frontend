import * as React from "react";
import NextLink from "next/link"; 
import ExploreAll from "@/components/NFT/ExploreAll";
export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Explore All</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>NFT</li>
          <li>Explore All</li>
        </ul>
      </div>

      <ExploreAll />
    </>
  );
}
