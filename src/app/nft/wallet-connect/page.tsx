import * as React from "react";
import NextLink from "next/link";   
import ConnectWallet from "@/components/NFT/ConnectWallet";
export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Connect Wallet</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>NFT</li>
          <li>Connect Wallet</li>
        </ul>
      </div>

      <ConnectWallet />
    </>
  );
}
