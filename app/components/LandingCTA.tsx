"use client";

import { useAccount } from "wagmi";
import { PrimaryCTALink } from "@/components/design/PrimaryCTA";
import { usePool } from "@/hooks/usePool";

export function LandingCTA() {
  const { isConnected } = useAccount();
  const pool = usePool();
  const showResume = isConnected && pool.hasJoined;

  return (
    <PrimaryCTALink
      href={showResume ? "/play" : "/play/build"}
      label={showResume ? "View My Team" : "Start Playing"}
    />
  );
}
