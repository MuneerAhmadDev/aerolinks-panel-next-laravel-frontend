import * as React from "react";
import NextLink from 'next/link';     
import AddBooking from "@/components/Bookings/AddBooking";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Add Booking</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li> 
          <li>Bookings</li>
          <li>Add Booking</li>
        </ul>
      </div>

      <AddBooking />
    </>
  );
}
