"use client";

import { useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { WalletPill } from "@/components/design/WalletPill";
import { isMiniPay } from "@/lib/minipay";
import { posthog } from "@/lib/posthog";

export function ConnectedWalletPill({ className }: { className?: string }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (!isConnected && isMiniPay()) {
      const injected = connectors.find((c) => c.id === "injected");
      if (injected) connect({ connector: injected });
    }
  }, [isConnected, connectors, connect]);

  useEffect(() => {
    if (isConnected && address) {
      posthog.identify(address);
      posthog.capture("wallet_connected", {
        wallet_type: isMiniPay() ? "minipay" : "other",
      });
    }
  }, [isConnected, address]);

  const handleClick = () => {
    if (isConnected) {
      disconnect();
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  return (
    <WalletPill
      address={address}
      connected={isConnected}
      onClick={handleClick}
      aria-label={isConnected ? "Disconnect wallet" : "Connect wallet"}
      className={className}
    />
  );
}
