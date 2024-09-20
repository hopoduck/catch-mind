import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { Badge, Chip } from "@nextui-org/react";

export default function LeaderBoard({
  players,
  myId,
  painterId,
}: {
  readonly players: Player[];
  readonly myId?: string;
  readonly painterId?: string;
}) {
  return (
    <div className="flex flex-row gap-2">
      {[...players]
        .sort((a, b) => b.points - a.points)
        .map(({ id, nickname, points }) => (
          <Badge
            key={id}
            content={points}
            showOutline={false}
            color="primary"
            title="점수"
            size="sm"
          >
            <Chip
              variant="flat"
              color={myId === id ? "success" : "primary"}
              endContent={
                painterId === id && <Icon icon="hugeicons:blush-brush-02" />
              }
              title="닉네임"
            >
              {nickname}
            </Chip>
          </Badge>
        ))}
    </div>
  );
}
