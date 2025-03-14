import { cn } from "@nextui-org/react";
import {
  MouseEventHandler,
  TouchEventHandler,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useCanvasConfigStore } from "../canvasStore";
import { Action } from "../constants";
import Socket from "../socket/Socket";
import CanvasUtil from "../util/CanvasUtil";

const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

export default function Canvas({
  socket,
  readonly,
}: {
  readonly socket: Socket;
  readonly readonly: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { canvas, action, colorData, isDrawing, lineWidth, cursorRef } =
    useCanvasConfigStore();
  const { setCanvas, setIsDrawing, setCursorVisible } = useCanvasConfigStore();
  const isErase = action === Action.erase;

  const getTouchPos = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) {
      return { x: 0, y: 0 };
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    return { x, y };
  };

  const handleMouseDown: MouseEventHandler<HTMLElement> = (e) => {
    if (!canvas) return;
    if (readonly) return;

    e.preventDefault();

    switch (action) {
      case Action.fill:
        socket.sendFill(canvas.fill(colorData.color));
        return;
      case Action.erase:
      case Action.draw:
        setIsDrawing(true);
        socket.sendBeginPath(
          canvas.start(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
        );
        break;
    }
  };

  const handleTouchStart: TouchEventHandler<HTMLCanvasElement> = (e) => {
    if (!canvas) return;
    if (readonly) return;

    e.preventDefault();

    const { x, y } = getTouchPos(e);

    switch (action) {
      case Action.fill:
        socket.sendFill(canvas.fill(colorData.color));
        return;
      case Action.erase:
      case Action.draw:
        setIsDrawing(true);
        socket.sendBeginPath(canvas.start(x, y));
        break;
    }
  };

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    if (readonly) return;

    setIsDrawing(false);
  }, [isDrawing, readonly, setIsDrawing]);

  const handleTouchEnd = useCallback(() => {
    if (!isDrawing) return;
    if (readonly) return;

    setIsDrawing(false);
  }, [isDrawing, readonly, setIsDrawing]);

  const handleMouseMove: MouseEventHandler<HTMLElement> = (e) => {
    if (!canvas) return;

    if (cursorRef.current && !isTouchDevice) {
      const cursorSize = isErase ? lineWidth * 1.5 : lineWidth;
      const cursor = cursorRef.current;
      cursor.style.width = (cursorSize / canvas.canvasRatio).toString() + "px";
      cursor.style.height = (cursorSize / canvas.canvasRatio).toString() + "px";
      cursor.style.top = e.pageY.toString() + "px";
      cursor.style.left = e.pageX.toString() + "px";
    }

    if (!isDrawing) return;
    if (readonly) return;

    e.preventDefault();

    const color = isErase ? "#ffffff" : colorData.color;
    const cursorSize = isErase ? lineWidth * 1.5 : lineWidth;
    socket.sendStrokePath(
      canvas.stroke({
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
        color,
        lineWidth: cursorSize,
      }),
    );
  };

  const handleTouchMove: TouchEventHandler<HTMLCanvasElement> = (e) => {
    if (!canvas) return;
    if (readonly) return;
    if (!isDrawing) return;

    e.preventDefault();

    const { x, y } = getTouchPos(e);

    const color = isErase ? "#ffffff" : colorData.color;
    const cursorSize = isErase ? lineWidth * 1.5 : lineWidth;

    socket.sendStrokePath(
      canvas.stroke({
        x,
        y,
        color,
        lineWidth: cursorSize,
      }),
    );
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new CanvasUtil(canvasRef.current);
    setCanvas(canvas);

    return () => {
      canvas.clear();
    };
  }, [setCanvas]);

  useEffect(() => {
    if (!canvas) return;

    const cleanUps = [
      socket.addHandleBeganPath(({ x, y }) => {
        canvas.start(...canvas.canvasToLocal(x, y));
      }),
      socket.addHandleStrokedPath(({ x, y, lineWidth, color }) => {
        canvas.stroke({
          x: canvas.canvasToLocal(x)[0],
          y: canvas.canvasToLocal(y)[0],
          lineWidth,
          color,
        });
      }),
      socket.addHandleFilled(({ color }) => {
        canvas.fill(color);
      }),
      socket.addHandleGameEnded(() => {
        canvas.clear();
      }),
    ];

    return () => {
      cleanUps.forEach((cleanUp) => cleanUp());
    };
  }, [canvas, socket]);

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleMouseUp, handleTouchEnd]);

  return (
    <div className="flex h-full w-full flex-row items-center justify-center gap-4">
      <canvas
        className={cn([
          "h-full max-h-full w-full max-w-full rounded-2xl border-2 border-sky-300 bg-white shadow max-xl:flex-col",
          { "cursor-default": readonly },
          { "cursor-none": !readonly && !isTouchDevice },
          "touch-action-none", // 터치 동작 제어를 위한 클래스 추가
        ])}
        ref={canvasRef}
        // 마우스 이벤트 핸들러
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => {
          if (!isTouchDevice) setCursorVisible(true);
        }}
        onMouseLeave={() => {
          if (!isTouchDevice) setCursorVisible(false);
          handleMouseUp();
        }}
        // 터치 이벤트 핸들러
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />
    </div>
  );
}
