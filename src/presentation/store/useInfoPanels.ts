import { create } from "zustand";

export type InfoPanelKey =
  | "como-comprar"
  | "envios"
  | "pagos"
  | "faq"
  | "terminos"
  | "privacidad"
  | "cookies"
  | "soporte";

interface InfoPanelsState {
  isOpen: boolean;
  activePanel: InfoPanelKey;
  openPanel: (panel: InfoPanelKey) => void;
  closePanel: () => void;
}

export const useInfoPanels = create<InfoPanelsState>((set) => ({
  isOpen: false,
  activePanel: "como-comprar",
  openPanel: (panel: InfoPanelKey) => set({ isOpen: true, activePanel: panel }),
  closePanel: () => set({ isOpen: false }),
}));
