import { Icon } from "@iconify-icon/react";
import { Button, ButtonGroup, Slider } from "@nextui-org/react";
import { MouseEventHandler, useEffect, useRef, useState } from "react";
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

enum Variant {
  draw = "draw",
  fill = "fill",
  erase = "erase",
}

export default function Canvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D>();
  const { value, htmlAttribute } = useInputNumber(1);
  const [action, setAction] = useState<Variant>(Variant.draw);
  const [colorData, setColorData] = useState<(typeof colors)[0]>(colors[0]);
  const [isDrawing, setIsDrawing] = useState(false);

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

  const handleMouseDown: MouseEventHandler<HTMLCanvasElement> = (e) => {
    if (!context) return;
    if (!canvas.current) return;

    context.beginPath();
    context.lineWidth = value;
    switch (action) {
      case Variant.fill:
        context.fillStyle = colorData.color;
        context.fillRect(0, 0, canvas.current.width, canvas.current.height);
        return;
      case Variant.erase:
        setIsDrawing(true);
        context.fillStyle = "#ffffff";
        context.strokeStyle = "#ffffff";
        break;
      case Variant.draw:
        setIsDrawing(true);
        context.fillStyle = colorData.color;
        context.strokeStyle = colorData.color;
        break;
    }

    context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const handleMouseUp: MouseEventHandler<HTMLCanvasElement> = () => {
    if (!context) return;
    if (!isDrawing) return;

    setIsDrawing(false);
  };

  const handleMouseMove: MouseEventHandler<HTMLCanvasElement> = (e) => {
    if (!context) return;
    if (!isDrawing) return;

    context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    context.stroke();
  };

  const handleColorChange = (data: (typeof colors)[0]) => {
    if (!context) return;

    if (action === Variant.erase) {
      setAction(Variant.draw);
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

  return (
    <div className="flex h-full w-full items-center justify-center">
      <canvas
        width={600}
        height={600}
        className="rounded-2xl border-2 border-sky-300 bg-white shadow"
        ref={canvas}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
      ></canvas>
      <div className="flex flex-col gap-4 p-4">
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
              color={action === Variant.draw ? "primary" : "default"}
              onClick={() => setAction(Variant.draw)}
            >
              Draw
            </Button>
            <Button
              color={action === Variant.fill ? "primary" : "default"}
              onClick={() => setAction(Variant.fill)}
            >
              Fill
            </Button>
            <Button
              color={action === Variant.erase ? "primary" : "default"}
              onClick={() => setAction(Variant.erase)}
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
