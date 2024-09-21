import { Icon } from "@iconify-icon/react";
import { Button, ButtonGroup, Slider } from "@nextui-org/react";
import {
  MouseEventHandler,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  amber,
  black,
  blue,
  cyan,
  emerald,
  fuchsia,
  gray,
  green,
  indigo,
  lime,
  neutral,
  orange,
  pink,
  purple,
  red,
  rose,
  sky,
  slate,
  stone,
  teal,
  violet,
  white,
  yellow,
  zinc,
} from "tailwindcss/colors";
import { useInputNumber } from "../hooks/useInput";
import Socket from "../socket/Socket";
import CanvasUtil from "../util/CanvasUtil";

const colors = [
  black,
  white,
  slate["500"],
  gray["500"],
  zinc["500"],
  neutral["500"],
  stone["500"],
  red["500"],
  orange["500"],
  amber["500"],
  yellow["500"],
  lime["500"],
  green["500"],
  emerald["500"],
  teal["500"],
  cyan["500"],
  sky["500"],
  blue["500"],
  indigo["500"],
  violet["500"],
  purple["500"],
  fuchsia["500"],
  pink["500"],
  rose["500"],
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
      {!readonly && (
        <div className="relative flex flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <div className="text-sm">펜 굵기</div>
            <Slider
              {...htmlAttribute}
              minValue={1}
              maxValue={15}
              step={1}
              showTooltip
              aria-label="펜 굵기"
              marks={[
                { label: "5", value: 5 },
                { label: "10", value: 10 },
                { label: "15", value: 15 },
              ]}
            />
          </div>
          <div className="flex w-96 flex-row flex-wrap items-center justify-center gap-2">
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
                <Icon icon="solar:pallete-2-bold-duotone" className="text-xl" />
              </Button>
              <Button
                color={action === Action.fill ? "primary" : "default"}
                onClick={() => {
                  setAction(Action.fill);
                }}
              >
                <Icon
                  icon="solar:paint-roller-bold-duotone"
                  className="text-xl"
                />
              </Button>
              <Button
                color={action === Action.erase ? "primary" : "default"}
                onClick={() => {
                  setAction(Action.erase);
                }}
              >
                <Icon icon="solar:eraser-bold-duotone" className="text-xl" />
              </Button>
            </ButtonGroup>
            <Button
              onClick={handleClear}
              className="bg-red-400 px-10 font-bold text-white"
            >
              <Icon
                icon="solar:trash-bin-trash-bold-duotone"
                className="text-xl"
              />
            </Button>
          </div>
          {/* <div className="absolute left-0 top-0 flex h-full w-full cursor-not-allowed items-center justify-center backdrop-blur"></div> */}
        </div>
      )}
    </div>
  );
}
