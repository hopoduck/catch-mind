import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { Button, ButtonGroup, Slider } from "@nextui-org/react";
import { useCanvasConfigStore } from "../canvasStore";
import { Action, colors } from "../constants";
import Socket from "../socket/Socket";

export default function Toolbox({
  socket,
  readonly,
}: {
  readonly socket: Socket;
  readonly readonly: boolean;
}) {
  const {
    canvas,
    action,
    colorData,
    // isDrawing,
    cursorVisible,
    // lineWidth,
    cursorRef,
  } = useCanvasConfigStore();
  const {
    // setCanvas,
    setAction,
    setColorData,
    // setIsDrawing,
    // setCursorVisible,
    setLineWidth,
    // setCursorRef,
  } = useCanvasConfigStore();

  const [isDraw, isFill, isErase] = [
    action === Action.draw,
    action === Action.fill,
    action === Action.erase,
  ];

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

  return (
    <>
      {!readonly && (
        <div className="relative flex max-w-96 flex-col gap-4 p-4">
          <div className="flex flex-col gap-1">
            <div className="text-sm">펜 굵기</div>
            <Slider
              onChange={setLineWidth}
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
    </>
  );
}
