import { Button, Input } from "@nextui-org/react";
import { KeyboardEventHandler } from "react";
import { useNavigate } from "react-router-dom";
import { useInput } from "../hooks/useInput";

export default function Login() {
  const navigate = useNavigate();
  const { value, htmlAttribute } = useInput();
  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };
  const handleSubmit = () => {
    if (!value?.trim()) return alert("닉네임을 입력해주세요.");

    sessionStorage.setItem("nickname", value.trim());
    navigate("/");
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      <Input
        {...htmlAttribute}
        className="w-96"
        placeholder="Nickname"
        onKeyDown={handleKeydown}
      />
      <Button className="w-96" onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  );
}
