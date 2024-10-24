import { Button } from "@nextui-org/react";
import { useState } from "react";

// 업데이트 날짜의 unix epoch 값
const lastChangelog = 1729761742914;

export default function Changelog() {
  const lastShowChangelog = isNaN(
    Number(localStorage.getItem("lastShowChangelog")),
  )
    ? Date.now()
    : Number(localStorage.getItem("lastShowChangelog"));

  const [show, setShow] = useState(false);
  const [isNew, setIsNew] = useState(lastShowChangelog >= lastChangelog);

  return (
    <div>
      <Button
        onPress={() => {
          setShow((v) => !v);
        }}
      >
        업데이트 내역
      </Button>
      {show ? (
        <ul>
          <li>asdasd</li>
        </ul>
      ) : null}
    </div>
  );
}
