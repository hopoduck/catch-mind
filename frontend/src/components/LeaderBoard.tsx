import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { Badge, Chip } from "@nextui-org/react";

export default function LeaderBoard({
  players,
  myId,
}: {
  readonly players: Player[];
  readonly myId?: string;
}) {
  return (
    <div className="flex flex-row gap-2">
      {players.map(({ id, nickname, points }) => (
        <Badge
          key={id}
          content={points}
          showOutline={false}
          color="primary"
          title="points"
          size="sm"
        >
          <Chip
            variant="flat"
            color={myId === id ? "success" : "primary"}
            // TODO: painter 추적이 되남..?
            endContent={<Icon icon="hugeicons:blush-brush-02" />}
            title="nickname"
          >
            {/* TODO: 툴팁 생성 */}
            {nickname}
          </Chip>
        </Badge>
      ))}
    </div>
  );
}
