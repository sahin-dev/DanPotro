"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return <button onClick={() => window.print()} className="btn-primary print:hidden"><Printer size={15} /> Print or save as PDF</button>;
}
