"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { PlayerPoolContent } from "@/components/pitch/PlayerPoolContent";
import type { UiPlayer } from "@/lib/players/uiPlayer";

export type PlayerPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: UiPlayer[];
  excludeIds: number[];
  onPick: (id: number) => void;
  onClear?: () => void;
  onCaptain?: () => void;
  position?: string;
  budgetRemaining?: number;
};

export function PlayerPicker({
  open,
  onOpenChange,
  players,
  excludeIds,
  onPick,
  onClear,
  onCaptain,
  position,
  budgetRemaining,
}: PlayerPickerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-white/10 bg-[#0F0E14] text-white">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="font-display text-2xl tracking-[0.18em] text-white">
            Pick a Player
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <PlayerPoolContent
            players={players}
            excludeIds={excludeIds}
            position={position}
            budgetRemaining={budgetRemaining}
            onCaptain={onCaptain}
            onClear={onClear}
            onPick={(id) => {
              onPick(id);
              onOpenChange(false);
            }}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
