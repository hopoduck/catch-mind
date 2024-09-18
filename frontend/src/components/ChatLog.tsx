import { HTMLAttributes } from "react";

export default function ChatLog({
  list,
  ...attribute
}: { readonly list: ChatData[] } & HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      {...attribute}
      className={["bg-slate-100", attribute.className].join(" ")}
    >
      {list.map(({ id, message, nickname }) => (
        <li
          key={id}
          className={[
            "flex h-full w-full flex-row items-center gap-1 font-semibold",
            nickname ? "text-sky-600" : "text-teal-600",
          ].join(" ")}
        >
          <div>{nickname ?? "You"}</div>
          <span>:</span>
          <div>{message}</div>
        </li>
      ))}
      {list.length === 0 ? (
        <div className="w-full text-center italic text-gray-600">
          메시지를 전송해보세요!
        </div>
      ) : null}
    </ul>
  );
}
