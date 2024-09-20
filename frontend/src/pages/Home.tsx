import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { Button, Input } from "@nextui-org/react";
import { KeyboardEventHandler, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Canvas from "../components/Canvas";
import ChatLog from "../components/ChatLog";
import LeaderBoard from "../components/LeaderBoard";
import { useInput } from "../hooks/useInput";
import Socket from "../socket/Socket";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem("nickname") === null) {
      navigate("/login");
    }
  }, [navigate]);

  const { value, setValue, htmlAttribute } = useInput();
  const [chatLog, setChatLog] = useState<ChatData[]>([]);
  const [socket, setSocket] = useState<Socket>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [readonlyCanvas, setReadonlyCanvas] = useState(true);
  const [word, setWord] = useState<string>();

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

    const cleanUps = [
      socket.addHandleNewUser(({ nickname }) => {
        toast.success(`${nickname}님이 접속하였습니다.`);
      }),
      socket.addHandleDisconnected(({ nickname }) => {
        toast.error(`${nickname}님이 퇴장하였습니다.`);
      }),
      socket.addHandleNewMessage(({ message, nickname }) => {
        console.log("new message received", message);
        addChatData({
          id: crypto.randomUUID(),
          message,
          nickname,
        });
      }),
      socket.addHandlePlayerUpdate(({ players }) => {
        setPlayers(players);
      }),
      socket.addHandleGameStarted(() => {
        setReadonlyCanvas(true);
      }),
      socket.addHandleLeaderNotify(({ word }) => {
        setWord(word);
        setReadonlyCanvas(false);
      }),
      socket.addHandleGameEnded(() => {
        setWord(undefined);
        setReadonlyCanvas(true);
        toast.success(`Game ended successfully`);
      }),
    ];

    setSocket(socket);

    return () => {
      socket.disconnect();
      cleanUps.forEach((cleanUp) => cleanUp());
    };
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Button
        className="flex gap-1"
        color="danger"
        onClick={() => {
          sessionStorage.removeItem("nickname");
          navigate("/login");
        }}
      >
        <Icon icon="solar:exit-bold-duotone" />
        Exit
      </Button>
      <div>word: {word}</div>
      {socket && <Canvas socket={socket} readonly={readonlyCanvas} />}
      <LeaderBoard players={players} />
      <ChatLog list={chatLog} className="rounded-xl p-3" />
      <Input
        {...htmlAttribute}
        placeholder="메시지를 입력..."
        onKeyDown={handleKeydown}
      />
    </div>
  );
}
