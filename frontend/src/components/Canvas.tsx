import { Icon } from "@iconify-icon/react";
import { Button, ButtonGroup, Slider } from "@nextui-org/react";
import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useInputNumber } from "../hooks/useInput";
import Socket from "../socket/Socket";
import CanvasUtil from "../util/CanvasUtil";

const colors = [
  "#000000",
  "#ff3838",
  "#ffb8b8",
  "#c56cf0",
  "#ff9f1a",
  "#fff200",
  "#32ff7e",
  "#7efff5",
].map((color) => ({
  id: crypto.randomUUID(),
  color,
}));

enum Action {
  draw = "draw",
  fill = "fill",
  erase = "erase",
}

export default function Canvas({
  socket,
  readonly,
}: {
  readonly socket: Socket;
  readonly readonly: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvas, setCanvas] = useState<CanvasUtil>();
  const [action, setAction] = useState<Action>(Action.draw);
  const { value, htmlAttribute } = useInputNumber(1);
  const [colorData, setColorData] = useState<(typeof colors)[0]>(colors[0]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMouseDown: MouseEventHandler<HTMLElement> = (e) => {
    if (!canvas) return;
    if (readonly) return;

    e.preventDefault();

    switch (action) {
      case Action.fill:
        canvas.fill(colorData.color);
        socket.sendFill({ color: colorData.color });
        return;
      case Action.erase:
      case Action.draw:
        setIsDrawing(true);
        canvas.start(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        break;
    }
    socket.sendBeginPath({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
    });
  };

  const handleMouseUp = useCallback(() => {
    if (!isDrawing) return;
    if (readonly) return;

    setIsDrawing(false);
  }, [isDrawing, readonly]);

  const handleMouseMove: MouseEventHandler<HTMLElement> = (e) => {
    if (!canvas) return;
    if (!isDrawing) return;
    if (readonly) return;

    e.preventDefault();

    const color = action === Action.erase ? "#ffffff" : colorData.color;
    canvas.stroke({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
      color,
      lineWidth: value,
    });
    socket.sendStrokePath({
      x: e.nativeEvent.offsetX,
      y: e.nativeEvent.offsetY,
      color,
      lineWidth: value,
    });
  };

  const handleColorChange = (data: (typeof colors)[0]) => {
    if (readonly) return;

    if (action === Action.erase) {
      setAction(Action.draw);
    }
    setColorData(data);
  };

  const handleClear = () => {
    if (!canvas) return;
    if (readonly) return;

    canvas.clear();
    socket.sendFill({ color: "#ffffff" });
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new CanvasUtil(canvasRef.current);
    setCanvas(canvas);

    return () => {
      canvas.clear();
    };
  }, []);

  useEffect(() => {
    if (!canvas) return;

    const cleanUps = [
      socket.addHandleBeganPath(({ x, y }) => {
        canvas.start(x, y);
      }),
      socket.addHandleStrokedPath(({ x, y, lineWidth, color }) => {
        canvas.stroke({
          x,
          y,
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
    <div className="flex h-full w-full flex-row items-center justify-center gap-4 max-lg:flex-col">
      <canvas
        width={600}
        height={600}
        className="rounded-2xl border-2 border-sky-300 bg-white shadow"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />
      <div className="relative flex flex-col gap-4 p-4">
        <Slider
          {...htmlAttribute}
          label="펜 굵기"
          minValue={1}
          maxValue={15}
          step={1}
        />
        <div className="flex flex-row gap-2">
          {colors.map((data) => (
            <Button
              key={data.id}
              isIconOnly
              className="rounded-full shadow-md"
              style={{ backgroundColor: data.color }}
              onClick={() => {
                handleColorChange(data);
              }}
            >
              {colorData.color === data.color ? (
                <Icon
                  icon="line-md:check-all"
                  className="flex h-full w-full items-center justify-center rounded-full bg-black bg-opacity-20 text-2xl text-white hover:bg-opacity-0"
                />
              ) : null}
            </Button>
          ))}
        </div>
        <div className="flex justify-between">
          <ButtonGroup>
            <Button
              color={action === Action.draw ? "primary" : "default"}
              onClick={() => {
                setAction(Action.draw);
              }}
            >
              Draw
            </Button>
            <Button
              color={action === Action.fill ? "primary" : "default"}
              onClick={() => {
                setAction(Action.fill);
              }}
            >
              Fill
            </Button>
            <Button
              color={action === Action.erase ? "primary" : "default"}
              onClick={() => {
                setAction(Action.erase);
              }}
            >
              Erase
            </Button>
          </ButtonGroup>
          <Button
            onClick={handleClear}
            className="bg-red-400 px-10 font-bold text-white"
          >
            Clear
          </Button>
        </div>
        {readonly ? (
          <div className="absolute left-0 top-0 flex h-full w-full cursor-not-allowed items-center justify-center backdrop-blur">
            상대방이 그린 그림을 맞추세요!
          </div>
        ) : null}
      </div>
    </div>
  );
}
