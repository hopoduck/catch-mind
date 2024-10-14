import { createRef, RefObject } from "react";
import { create } from "zustand";
import { Action, colors } from "./constants";
import CanvasUtil from "./util/CanvasUtil";

interface Store {
  canvas?: CanvasUtil;
  action: Action;
  lineWidth: number;
  colorData: (typeof colors)[0];
  isDrawing: boolean;
  cursorVisible: boolean;
  cursorRef: RefObject<HTMLDivElement>;

  setCanvas: (canvas: CanvasUtil) => void;
  setAction: (action: Action) => void;
  setLineWidth: (lineWidth: number | number[]) => void;
  setColorData: (colorData: (typeof colors)[0]) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  setCursorVisible: (cursorVisible: boolean) => void;
  setCursorRef: (cursorRef: RefObject<HTMLDivElement>) => void;
}

export const useCanvasConfigStore = create<Store>()((set) => ({
  canvas: undefined,
  action: Action.draw,
  lineWidth: 5,
  colorData: colors[0],
  isDrawing: false,
  cursorVisible: false,
  cursorRef: createRef<HTMLDivElement>(),
  setCanvas: (canvas) => {
    set({ canvas });
  },
  setAction: (action) => {
    set({ action });
  },
  setLineWidth: (lineWidth) => {
    if (Array.isArray(lineWidth)) {
      set({ lineWidth: lineWidth[0] });
    } else {
      set({ lineWidth });
    }
  },
  setColorData: (colorData) => {
    set({ colorData });
  },
  setIsDrawing: (isDrawing) => {
    set({ isDrawing });
  },
  setCursorVisible: (cursorVisible) => {
    set({ cursorVisible });
  },
  setCursorRef: (cursorRef) => {
    set({ cursorRef });
  },
}));
