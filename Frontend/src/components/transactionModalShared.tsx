import React from "react";

/** Estilo alinhado aos modais de referência (Dialog max-w-md, inputs, labels). */
export const txModalOverlayClass =
  "fixed inset-0 z-50 flex items-center justify-center p-4";

export const txModalCardClass =
  "relative w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-6 sm:p-8";

export const txModalTitleClass = "text-xl font-bold pr-10";

export const txLabelClass = "block text-sm font-medium mb-1.5";

export const txInputClass =
  "mt-1 block w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--primary)]";

export const txInputStyle: React.CSSProperties = {
  backgroundColor: "var(--input-bg)",
  borderColor: "var(--input-border)",
  color: "var(--text)",
};

export const txLabelStyle: React.CSSProperties = {
  color: "var(--text-secondary)",
};

export const txPrimaryButtonClass =
  "w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:brightness-95";

export const txSecondaryButtonClass =
  "w-full rounded-xl border py-3 text-sm font-medium transition";
