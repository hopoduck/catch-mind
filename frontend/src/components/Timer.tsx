import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { Progress } from "@nextui-org/react";
import { useEffect, useState } from "react";

export default function Timer({
  duration: { start, end },
}: {
  readonly duration: {
    start: number;
    end: number;
  };
}) {
  const [progress, setProgress] = useState(1);
  const [remainTime, setRemainTime] = useState(0);

  useEffect(() => {
    let id: number;
    const updateTimer = () => {
      id = requestAnimationFrame(() => {
        setProgress(1 - (Date.now() - start) / (end - start));
        setRemainTime(Math.round((end - Date.now()) / 1000));
        updateTimer();
      });
    };

    updateTimer();

    return () => {
      cancelAnimationFrame(id);
    };
  }, [end, start]);

  return (
    <div className="flex select-none items-center justify-center gap-2">
      <Icon
        icon="solar:clock-circle-bold-duotone"
        className="text-xl text-primary-500"
      />
      <div className="relative h-full w-full">
        <Progress
          value={progress}
          className="w-full"
          aria-label="Timeout"
          color="primary"
          maxValue={1}
          minValue={0}
          disableAnimation={true}
        />
        <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center text-sm">
          <span className="rounded-full bg-white bg-opacity-60 px-2 py-1 font-bold backdrop-blur-sm">
            {remainTime}초
          </span>
        </div>
      </div>
    </div>
  );
}
