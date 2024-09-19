import { Input } from "@nextui-org/react";
import { KeyboardEventHandler, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Canvas from "../components/Canvas";
import ChatLog from "../components/ChatLog";
import { useInput } from "../hooks/useInput";
import Socket from "../socket/Socket";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("nickname") === null) {
      navigate("/login");
    }
  }, [navigate]);

  const [chatLog, setChatLog] = useState<ChatData[]>([]);
  const [socket, setSocket] = useState<Socket>();
  const { value, setValue, htmlAttribute } = useInput();

  const addChatData = (data: ChatData) => {
    setChatLog((chatLog) => [...chatLog, data]);
  };

  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key !== "Enter") return;
    if (!value.trim()) return;
    if (!socket) return;

    e.preventDefault();
    socket.sendMessage(value);
    addChatData({
      id: crypto.randomUUID(),
      message: value,
    });
    setValue("");
  };

  useEffect(() => {
    const socket = new Socket(
      sessionStorage.getItem("nickname") ?? "Anonymous",
    );

    socket.setHandleNewUser(({ nickname }) => {
      toast.success(`${nickname}님이 접속하였습니다.`);
    });
    socket.setHandleDisconnected(({ nickname }) => {
      toast.error(`${nickname}님이 퇴장하였습니다.`);
    });
    socket.setHandleNewMessage(({ message, nickname }) => {
      console.log("new message received", message);
      addChatData({
        id: crypto.randomUUID(),
        message,
        nickname,
      });
    });

    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Canvas />
      <ChatLog list={chatLog} className="rounded-xl p-3" />
      <Input
        {...htmlAttribute}
        placeholder="메시지를 입력..."
        onKeyDown={handleKeydown}
      />
    </div>
  );
}
