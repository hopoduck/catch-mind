import { Divider } from "@nextui-org/react";
import { HTMLAttributes } from "react";
import { ChatData } from "../local";

// eslint-disable-next-line react-refresh/only-export-components
export enum SystemChatEventType {
  gameEnded = "gameEnded",
  winner = "winner",
}

export default function ChatLog({
  list,
  ...attribute
}: { readonly list: ChatData[] } & HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      {...attribute}
      className={[
        "flex flex-col items-start justify-start gap-2 overflow-auto bg-slate-100",
        attribute.className,
      ].join(" ")}
    >
      {[...list].reverse().map(({ id, message, nickname, system }) => {
        switch (system) {
          case SystemChatEventType.gameEnded:
            return <Divider key={id} />;
          case SystemChatEventType.winner:
            return (
              <li
                key={id}
                className={[
                  "flex h-full w-full flex-row items-center justify-center gap-1 font-bold text-orange-400",
                ].join(" ")}
              >
                <div>
                  이번 문제의 정답은 &quot;{message}&quot; 였습니다!
                  {nickname ? ` ${nickname} 님이 맞췄습니다.` : null}
                </div>
              </li>
            );
          default:
            return (
              <li
                key={id}
                className={[
                  "flex h-full w-full flex-row items-center gap-1 font-normal",
                  nickname ? "text-sky-600" : "text-teal-600",
                ].join(" ")}
              >
                <div>{nickname ?? "You"}</div>
                <span>:</span>
                <div>{message}</div>
              </li>
            );
        }
      })}
      {list.length === 0 ? (
        <div className="w-full text-center italic text-gray-600">
          정답을 맞춰보세요!
        </div>
      ) : null}
    </ul>
  );
}
