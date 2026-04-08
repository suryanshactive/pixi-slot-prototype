import React from "react";
import { createRoot } from "react-dom/client";

import { setupGame } from "./Game";
import Hud from "./hud/Hud";

// simple global state shared with the game
const state = {
  balance: 1000,
  win: 0,
};

// hud listeners
const listeners: Array<(s: typeof state) => void> = [];

export function update(patch: Partial<typeof state>) {
  Object.assign(state, patch);

  // notify hud subscribers
  listeners.forEach((listener) => {
    listener({ ...state });
  });
}

// boot the game loop
setupGame(update);

// render hud
const hudRoot = document.getElementById("hud");
if (hudRoot) {
  createRoot(hudRoot).render(
    <Hud
      state={state}
      subscribe={(listener: any) => listeners.push(listener)}
    />
  );
}
