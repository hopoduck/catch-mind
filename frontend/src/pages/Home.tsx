import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { Button, Input } from "@nextui-org/react";
import { KeyboardEventHandler, useEffect, useState } from "react";
import Confetti from "react-confetti-boom";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Canvas from "../components/Canvas";
import ChatLog from "../components/ChatLog";
import LeaderBoard from "../components/LeaderBoard";
import Timer from "../components/Timer";
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
  const [isPainter, setIsPainter] = useState(false);
  const [word, setWord] = useState<string>();
  const [message, setMessage] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [duration, setDuration] = useState<{ start: number; end: number }>();
  const [painterId, setPainterId] = useState<string>();

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
    const nickname = sessionStorage.getItem("nickname") ?? "Anonymous";
    const socket = new Socket(nickname);

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
      socket.addHandleGameStarting(({ start, end }) => {
        setMessage("Game will starting!");
        setDuration({ start, end });
      }),
      socket.addHandleGameStarted(({ id, start, end }) => {
        setIsPainter(false);
        setChatLog([]);
        setMessage("Game started!");
        setValue("");
        setDuration({ start, end });
        setShowConfetti(false);
        setPainterId(id);
      }),
      socket.addHandlePainterNotify(({ word }) => {
        setWord(word);
        setIsPainter(true);
        setMessage("You are painter! Draw");
      }),
      socket.addHandleGameEnded(({ winnerId, word }) => {
        setWord(undefined);
        setIsPainter(false);
        toast.success(`Game ended! Message was: ${word}`, {
          position: "top-center",
        });
        setDuration(undefined);
        if (socket.id === winnerId) {
          setShowConfetti(true);
        }
      }),
    ];

    setSocket(socket);

    return () => {
      socket.disconnect();
      cleanUps.forEach((cleanUp) => cleanUp());
    };
  }, [setValue]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-end gap-1">
        {isPainter && (
          <Button
            className="flex gap-1"
            color="warning"
            onClick={() => socket?.sendSkip()}
          >
            <Icon icon="solar:skip-next-bold-duotone" />
            Skip
          </Button>
        )}
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
      </div>
      <div className="flex items-center justify-center gap-1">
        <div>{message}</div>
        {word ? <div className="font-bold">{word}</div> : null}
      </div>
      {duration !== undefined && <Timer duration={duration} />}
      {socket && <Canvas socket={socket} readonly={!isPainter} />}
      <LeaderBoard players={players} myId={socket?.id} painterId={painterId} />
      <ChatLog list={chatLog} className="rounded-xl p-3" />
      <Input
        {...htmlAttribute}
        placeholder="정답을 입력하세요"
        onKeyDown={handleKeydown}
        disabled={isPainter}
      />
      {showConfetti && <Confetti mode="boom" />}
    </div>
  );
}
