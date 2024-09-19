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

export default function Canvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { value, htmlAttribute } = useInputNumber(1);
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const [action, setAction] = useState<Action>(Action.draw);
  const [colorData, setColorData] = useState<(typeof colors)[0]>(colors[0]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMouseDown: MouseEventHandler<HTMLElement> = (e) => {
    if (!context) return;
    if (!canvas.current) return;

    e.preventDefault();
    context.beginPath();
    context.lineWidth = value;
    switch (action) {
      case Action.fill:
        context.fillStyle = colorData.color;
        context.fillRect(0, 0, canvas.current.width, canvas.current.height);
        return;
      case Action.erase:
        setIsDrawing(true);
        context.fillStyle = "#ffffff";
        context.strokeStyle = "#ffffff";
        break;
      case Action.draw:
        setIsDrawing(true);
        context.fillStyle = colorData.color;
        context.strokeStyle = colorData.color;
        break;
    }

    context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleMouseUp = useCallback(() => {
    if (!context) return;
    if (!isDrawing) return;

    setIsDrawing(false);
  }, [context, isDrawing]);

  const handleMouseMove: MouseEventHandler<HTMLElement> = (e) => {
    if (!context) return;
    if (!isDrawing) return;

    e.preventDefault();
    context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    context.stroke();
  };

  const handleColorChange = (data: (typeof colors)[0]) => {
    if (!context) return;

    if (action === Action.erase) {
      setAction(Action.draw);
    }
    setColorData(data);
  };

  const handleClear = () => {
    if (!context) return;
    if (!canvas.current) return;

    context.beginPath();
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.current.width, canvas.current.height);
    context.fill();
  };

  useEffect(() => {
    if (!canvas.current) return;
    const current = canvas.current;
    current.width = 600;
    current.height = 600;
    const context = current.getContext("2d");
    if (context) {
      setContext(context);
    }

    return () => {
      context?.clearRect(0, 0, current.width, current.height);
    };
  }, [canvas]);

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
        ref={canvas}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
      />
      <div className="flex flex-col gap-4">
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
              onClick={() => handleColorChange(data)}
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
              onClick={() => setAction(Action.draw)}
            >
              Draw
            </Button>
            <Button
              color={action === Action.fill ? "primary" : "default"}
              onClick={() => setAction(Action.fill)}
            >
              Fill
            </Button>
            <Button
              color={action === Action.erase ? "primary" : "default"}
              onClick={() => setAction(Action.erase)}
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
      </div>
    </div>
  );
}
