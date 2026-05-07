import Link from "next/link";
import type { Route } from "next";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IconShield, IconCoin, IconTrophy } from "@tabler/icons-react";
import { WalletButton } from "@/components/WalletButton";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-10 p-6">
      <div className="flex justify-end pt-4">
        <WalletButton />
      </div>
      <header className="pt-2 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Pick5</h1>
        <p className="mt-2 text-muted-foreground">No-loss fantasy on Celo</p>
      </header>

      <section className="flex flex-1 flex-col justify-center gap-6">
        <h2 className="text-2xl font-semibold leading-tight">
          Pick 5 Premier League players. Win the pool. Lose nothing.
        </h2>

        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <IconCoin className="mt-1 shrink-0" aria-hidden />
            <span>Deposit $5 USDT. Pick 5 players for the final 2 matchweeks.</span>
          </li>
          <li className="flex items-start gap-3">
            <IconShield className="mt-1 shrink-0" aria-hidden />
            <span>Your deposit goes to Aave V3. You can always withdraw it back.</span>
          </li>
          <li className="flex items-start gap-3">
            <IconTrophy className="mt-1 shrink-0" aria-hidden />
            <span>Top scorer wins the entire yield + a $10 USDT seed.</span>
          </li>
        </ul>
      </section>

      <Link
        href={"/play/build" as Route}
        className={cn(buttonVariants({ size: "lg" }), "w-full justify-center")}
      >
        Start Playing
      </Link>
    </main>
  );
}
