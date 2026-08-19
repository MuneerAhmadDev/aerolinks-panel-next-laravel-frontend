import * as React from "react";
import { Suspense } from "react";
import LockScreenForm from "@/components/Authentication/LockScreenForm";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LockScreenForm />
    </Suspense>
  );
}
