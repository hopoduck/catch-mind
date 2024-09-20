import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { Button, Input, Slider } from "@nextui-org/react";
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
  const [isPainter, setIsPainter] = useState(true);
  const [word, setWord] = useState<string>();
  const [message, setMessage] = useState("");

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
        setIsPainter(false);
        setMessage("Game started! Catch my mind!");
      }),
      socket.addHandleLeaderNotify(({ word }) => {
        setWord(word);
        setIsPainter(true);
        setMessage("You are painter! Draw");
      }),
      socket.addHandleGameEnded(() => {
        setWord(undefined);
        setIsPainter(false);
        setMessage("Game ended");
      }),
      socket.addHandleGameStarting(() => {
        setMessage("Game will starting!");
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
      <div className="flex items-center justify-center gap-1">
        <div>{message}</div>
        {word ? <div className="font-bold">{word}</div> : null}
      </div>
      <div className="flex items-center justify-center gap-2">
        <Icon
          icon="solar:clock-circle-bold-duotone"
          className="text-xl text-primary-500"
        />
        {/* TODO: 타임 아웃 표시 */}
        <Slider
          aria-label="Timeout"
          color="primary"
          hideThumb={true}
          // value={}
        />
      </div>
      {socket && <Canvas socket={socket} readonly={!isPainter} />}
      <LeaderBoard players={players} />
      <ChatLog list={chatLog} className="rounded-xl p-3" />
      <Input
        {...htmlAttribute}
        placeholder="메시지를 입력..."
        onKeyDown={handleKeydown}
        disabled={isPainter}
      />
    </div>
  );
}
