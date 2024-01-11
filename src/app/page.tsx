"use client";

import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { PreloadedDisplay } from "./preloaded-display.component";

export default function Home() {

  return (
    <ErrorBoundary errorComponent={(err) => <div>{err.error.message}</div>}>
      <PreloadedDisplay />
    </ErrorBoundary>
  )
}
