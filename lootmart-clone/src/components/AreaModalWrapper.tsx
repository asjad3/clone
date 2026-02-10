"use client";

import dynamic from "next/dynamic";

const AreaModal = dynamic(() => import("@/components/AreaModal"), { ssr: false });

export default function AreaModalWrapper() {
  return <AreaModal />;
}
