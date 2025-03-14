import { Button, Input } from "@nextui-org/react";
import { KeyboardEventHandler, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import Changelog from "../components/Changelog";
import { useInput } from "../hooks/useInput";

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { value: roomId, htmlAttribute: handleRoomId } = useInput(
    params.get("roomId") ?? "",
  );
  const { value: nickname, htmlAttribute: handleNickname } = useInput(
    params.get("nickname") ?? "",
  );

  const handleSubmit = useCallback(() => {
    if (!roomId.trim()) {
      toast.error("방 제목을 입력해주세요.", { position: "top-center" });
      return;
    }
    if (!nickname.trim()) {
      toast.error("닉네임을 입력해주세요.", { position: "top-center" });
      return;
    }

    sessionStorage.setItem("roomId", roomId.trim());
    sessionStorage.setItem("nickname", nickname.trim());
    navigate("/");
  }, [navigate, nickname, roomId]);

  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (params.has("roomId") && params.has("nickname")) {
      handleSubmit();
    }
  }, [handleSubmit, params]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8">
      <h1 className="text-xl font-bold">캐치마인드에 오신 것을 환영합니다!</h1>

      <div className="flex w-60 flex-col gap-4">
        <div className="flex w-60 flex-col gap-2">
          <Input {...handleRoomId} placeholder="방 제목을 입력해주세요" />
          <Input
            {...handleNickname}
            placeholder="닉네임을 입력해주세요"
            onKeyDown={handleKeydown}
          />
        </div>
        <Button color="primary" onClick={handleSubmit}>
          입장하기
        </Button>
      </div>
      <Changelog />
    </div>
  );
}
