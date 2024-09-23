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
  orange,
  pink,
  purple,
  red,
  sky,
  teal,
  violet,
  white,
  yellow,
} from "tailwindcss/colors";
import { useInputNumber } from "../hooks/useInput";
import Socket from "../socket/Socket";
import CanvasUtil from "../util/CanvasUtil";

const colors = [
  black,
  white,
  gray["500"],
  red["500"],
  orange["500"],
  amber["500"],
  "#A0522D",
  yellow["500"],
  "#FBCEB1",
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
  const cursorRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<CanvasUtil>();
  const [action, setAction] = useState<Action>(Action.draw);
  const { value: lineWidth, htmlAttribute } = useInputNumber(5);
  const [colorData, setColorData] = useState<(typeof colors)[0]>(colors[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);

  const [isDraw, isFill, isErase] = [
    action === Action.draw,
    action === Action.fill,
    action === Action.erase,
  ];

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
  }, [isDrawing, readonly]);

  const handleMouseMove: MouseEventHandler<HTMLElement> = (e) => {
    if (!cursorRef.current) return;
    if (!canvas) return;

    const cursorSize = isErase ? lineWidth * 2 : lineWidth;
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

  // TODO: 마우스 나갔다 들어올 때 좌표가 튀는데 왜 튀는지 수정 후 작업..
  // const handleMouseEnterAndLeave: MouseEventHandler<HTMLElement> = (e) => {
  //   if (!canvas) return;
  //   if (!isDrawing) return;
  //   if (readonly) return;

  //   const newLocal = canvas.start(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  //   console.log(
  //     "is enter or leave",
  //     e.nativeEvent.offsetX,
  //     e.nativeEvent.offsetY,
  //     e.target,
  //     e.currentTarget,
  //     newLocal,
  //   );
  //   e.preventDefault();

  //   socket.sendBeginPath(newLocal);
  // };

  const handleColorChange = (data: (typeof colors)[0]) => {
    if (readonly) return;

    if (isErase) {
      setAction(Action.draw);
    }
    setColorData(data);
  };

  const handleClear = () => {
    if (!canvas) return;
    if (readonly) return;

    socket.sendFill(canvas.clear());
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
    <div className="flex h-full w-full flex-row items-center justify-center gap-4 max-lg:flex-col">
      <canvas
        className={[
          "max-h-full max-w-full rounded-2xl border-2 border-sky-300 bg-white shadow",
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
      {!readonly && (
        <div className="relative flex max-w-96 flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <div className="text-sm">펜 굵기</div>
            <Slider
              {...htmlAttribute}
              minValue={1}
              maxValue={30}
              step={1}
              showTooltip
              aria-label="펜 굵기"
              marks={[
                { label: "5", value: 5 },
                { label: "10", value: 10 },
                { label: "15", value: 15 },
                { label: "20", value: 20 },
                { label: "25", value: 25 },
                { label: "30", value: 30 },
              ]}
            />
          </div>
          <div className="flex flex-row flex-wrap items-center justify-center gap-2">
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
                color={isDraw ? "primary" : "default"}
                onClick={() => {
                  setAction(Action.draw);
                }}
              >
                <Icon icon="solar:pallete-2-bold-duotone" className="text-xl" />
              </Button>
              <Button
                color={isFill ? "primary" : "default"}
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
                color={isErase ? "primary" : "default"}
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
      {!readonly && (
        <div
          className={[
            "pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full",
            cursorVisible ? "" : "hidden",
            "border-2 shadow-inner shadow-gray-400 drop-shadow",
          ].join(" ")}
          ref={cursorRef}
          style={{
            borderColor: colorData.color,
          }}
        ></div>
      )}
    </div>
  );
}
