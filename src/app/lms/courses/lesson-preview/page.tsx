import * as React from "react";
import NextLink from 'next/link';      
import LessonPreview from "@/components/LMS/LessonPreview";

export default function Page() {
  return (
    <>
      {/* Breadcrumb */}
      <div className="breadcrumb-card">
        <h5>Lesson Preview</h5>

        <ul className="breadcrumb">
          <li>
            <NextLink href="/dashboard/ecommerce/">
              <i className="material-symbols-outlined">home</i>
              Dashboard
            </NextLink>
          </li>
          <li>LMS</li>
          <li>Courses</li>
          <li>Lesson Preview</li>
        </ul>
      </div>

      <LessonPreview />
    </>
  );
}
