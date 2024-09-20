import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { Slider } from "@nextui-org/react";
import { useEffect, useState } from "react";

export default function Timer({
  start,
  duration,
}: {
  readonly start: number;
  readonly duration: number;
}) {
  const [progress, setProgress] = useState(1);

  useEffect(() => {
    let id: number;
    const updateTimer = () => {
      id = requestAnimationFrame(() => {
        setProgress(1 - (Date.now() - start) / duration);
        updateTimer();
      });
    };

    updateTimer();

    return () => {
      cancelAnimationFrame(id);
    };
  }, [duration, start]);

  return (
    <div className="flex items-center justify-center gap-2">
      <Icon
        icon="solar:clock-circle-bold-duotone"
        className="text-xl text-primary-500"
      />
      <Slider
        aria-label="Timeout"
        color="primary"
        hideThumb={true}
        value={progress}
        maxValue={1}
        minValue={0}
        step={0.001}
      />
    </div>
  );
}
