"use client";

import * as React from "react";

/**
 * Time-aware greeting based on the USER'S local time (the browser's timezone —
 * `new Date().getHours()` is local), so it's correct wherever the student is.
 *
 * Uses useSyncExternalStore so the server renders "Welcome back" and the client
 * swaps to the time-of-day phrase after hydration — no mismatch, no setState.
 */
function getTimeOfDay() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const emptySubscribe = () => () => {};

export function Greeting({ firstName }: { firstName: string }) {
  const timeOfDay = React.useSyncExternalStore(
    emptySubscribe,
    getTimeOfDay,
    () => "Welcome back",
  );

  return (
    <>
      {timeOfDay}, {firstName}
    </>
  );
}
