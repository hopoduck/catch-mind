import { MouseEventHandler, useCallback, useEffect, useRef } from "react";
import { useCanvasConfigStore } from "../canvasStore";
import { Action } from "../constants";
import Socket from "../socket/Socket";
import CanvasUtil from "../util/CanvasUtil";

export default function Canvas({
  socket,
  readonly,
}: {
  readonly socket: Socket;
  readonly readonly: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // const cursorRef = useRef<HTMLDivElement>(null);
  const {
    canvas,
    action,
    colorData,
    isDrawing,
    // cursorVisible,
    lineWidth,
    cursorRef,
  } = useCanvasConfigStore();
  const {
    setCanvas,
    // setAction,
    // setColorData,
    setIsDrawing,
    setCursorVisible,
    // setLineWidth,
    // setCursorRef,
  } = useCanvasConfigStore();
  const isErase = action === Action.erase;

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

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    if (readonly) return;

    setIsDrawing(false);
  }, [isDrawing, readonly, setIsDrawing]);

  const handleMouseMove: MouseEventHandler<HTMLElement> = (e) => {
    if (!cursorRef.current) return;
    if (!canvas) return;

    const cursorSize = isErase ? lineWidth * 1.5 : lineWidth;
    const cursor = cursorRef.current;
    cursor.style.width = (cursorSize / canvas.canvasRatio).toString() + "px";
    cursor.style.height = (cursorSize / canvas.canvasRatio).toString() + "px";
    cursor.style.top = e.pageY.toString() + "px";
    cursor.style.left = e.pageX.toString() + "px";

    if (!isDrawing) return;
    if (readonly) return;

    e.preventDefault();

    const color = isErase ? "#ffffff" : colorData.color;
    socket.sendStrokePath(
      canvas.stroke({
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
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
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseUp]);

  return (
    <div className="flex h-full w-full flex-row items-center justify-center gap-4">
      <canvas
        className={[
          "h-full max-h-full w-full max-w-full rounded-2xl border-2 border-sky-300 bg-white shadow max-xl:flex-col",
          readonly ? "cursor-default" : "cursor-none",
        ].join(" ")}
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => {
          setCursorVisible(true);
        }}
        onMouseLeave={() => {
          setCursorVisible(false);
          handleMouseUp();
        }}

        // onMouseLeave={handleMouseEnterAndLeave}
        // onMouseEnter={handleMouseEnterAndLeave}
      />
    </div>
  );
}
