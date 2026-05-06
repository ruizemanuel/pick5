"use client";

import { useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { isMiniPay } from "@/lib/minipay";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Auto-connect when running inside MiniPay
  useEffect(() => {
    if (!isConnected && isMiniPay()) {
      const injected = connectors.find((c) => c.id === "injected");
      if (injected) connect({ connector: injected });
    }
  }, [isConnected, connectors, connect]);

  if (isConnected && address) {
    return (
      <Button variant="outline" onClick={() => disconnect()} aria-label="Disconnect wallet">
        {address.slice(0, 6)}…{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button onClick={() => connect({ connector: connectors[0] })} aria-label="Connect wallet">
      Connect Wallet
    </Button>
  );
}
