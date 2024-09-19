import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { Badge, Chip } from "@nextui-org/react";

export default function LeaderBoard({
  players,
}: {
  readonly players: Player[];
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
            color="primary"
            // className="bg-sky-500 text-white"
            // TODO: 그리는 사람일때만 붓 표시 + 색상 success로
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
