import { MouseEventHandler, useEffect, useRef, useState } from "react";

const colors = [
  "#ff3838",
  "#ffb8b8",
  "#c56cf0",
  "#ff9f1a",
  "#fff200",
  "#32ff7e",
  "#7efff5",
];

export default function Canvas() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [context, setContext] = useState<CanvasRenderingContext2D>();

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

  const handleClick: MouseEventHandler<HTMLCanvasElement> = (e) => {
    if (!context) return;
    console.log(e);
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    context.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
    context.stroke();
  };

  return (
    <div className="flex h-full w-full items-center justify-center">
      <canvas
        width={600}
        height={600}
        className="rounded-2xl border-2 border-sky-300 bg-white shadow"
        ref={canvas}
        onMouseMove={handleClick}
      ></canvas>
    </div>
  );
}
