import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import { Button, Input, useDisclosure } from "@nextui-org/react";
import { KeyboardEventHandler, useEffect, useState } from "react";
import Confetti from "react-confetti-boom";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Canvas from "../components/Canvas";
import ChangeTimeout from "../components/ChangeTimeout";
import ChatLog, { SystemChatEventType } from "../components/ChatLog";
import LeaderBoard from "../components/LeaderBoard";
import Timer from "../components/Timer";
import Toolbox from "../components/Toolbox";
import { useInput } from "../hooks/useInput";
import { ChatData, Player } from "../local";
import Socket from "../socket/Socket";

export default function Home() {
  const navigate = useNavigate();
  const {
    onOpen: formOpen,
    isOpen: formIsOpen,
    onOpenChange: formOpenChange,
  } = useDisclosure();
  const {
    onOpen: requestOpen,
    isOpen: requestIsOpen,
    onOpenChange: requestOpenChange,
  } = useDisclosure();

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
  const [message, setMessage] = useState(
    "사용자를 기다리고 있습니다... 2명 이상 접속 시 게임이 시작됩니다.",
  );
  const [showConfetti, setShowConfetti] = useState(false);
  const [duration, setDuration] = useState<{ start: number; end: number }>();
  const [painterId, setPainterId] = useState<string>();
  const [time, setTime] = useState(60);

  const addChatData = (data: Omit<ChatData, "id">) => {
    setChatLog((chatLog) => [...chatLog, { id: crypto.randomUUID(), ...data }]);
  };

  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key !== "Enter") return;
    if (!value.trim()) return;
    if (!socket) return;

    e.preventDefault();
    socket.sendMessage(value);
    addChatData({
      message: value,
    });
    setValue("");
  };

  useEffect(() => {
    const roomId = sessionStorage.getItem("roomId") ?? "Unknown";
    const nickname = sessionStorage.getItem("nickname") ?? "Anonymous";
    const socket = new Socket({ roomId, nickname });
    setSocket(socket);

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const cleanUps = [
      socket.addHandleNewUser(({ nickname }) => {
        toast.success(`${nickname}님이 접속하였습니다.`);
      }),
      socket.addHandleDisconnected(({ nickname }) => {
        toast.error(`${nickname}님이 퇴장하였습니다.`);
      }),
      socket.addHandleNewMessage(({ message, nickname }) => {
        addChatData({
          message,
          nickname,
        });
      }),
      socket.addHandlePlayerUpdate(({ players }) => {
        setPlayers(players);
      }),
      socket.addHandleGameStarting(({ start, end }) => {
        setMessage("게임이 잠시 후 시작됩니다!");
        setDuration({ start, end });
      }),
      socket.addHandleGameStarted(({ id, start, end }) => {
        setIsPainter(false);
        addChatData({
          system: SystemChatEventType.gameEnded,
        });
        setMessage("게임이 시작되었습니다. 그림을 보고 정답을 입력하세요.");
        setValue("");
        setDuration({ start, end });
        setShowConfetti(false);
        setPainterId(id);
      }),
      socket.addHandlePainterNotify(({ word }) => {
        setIsPainter(true);
        setMessage(`그릴 차례입니다. 단어는 "${word}"입니다.`);
      }),
      socket.addHandleGameEnded(({ winnerId, winnerNickname, word }) => {
        setIsPainter(false);
        addChatData({
          message: word,
          nickname: winnerNickname,
          system: SystemChatEventType.winner,
        });
        setDuration(undefined);
        if (socket.id === winnerId) {
          setShowConfetti(true);
        }
      }),
      socket.addHandleChangeTimeoutRequested(({ time }) => {
        setTime(time);
        requestOpen();
      }),
      socket.addHandleChangeTimeoutResolved(({ time }) => {
        toast.success(
          `유저의 게임 진행시간이 과반 이상 찬성으로 게임 진행시간이 ${time.toString()}초로 변경되었습니다.`,
        );
      }),
      socket.addHandleChangeTimeoutRejected(() => {
        toast.error(`유저의 게임 진행시간이 과반 이상 거절되었습니다.`);
      }),
    ];

    return () => {
      cleanUps.forEach((cleanUp) => cleanUp());
    };
  }, [requestOpen, setValue, socket]);

  return (
    <div className="flex flex-col justify-center gap-4 p-4">
      <div className="flex items-center justify-end gap-1">
        <Button className="flex gap-1" color="secondary" onClick={formOpen}>
          <Icon icon="solar:clock-circle-bold" />
          시간 변경
        </Button>
        {isPainter && (
          <Button
            className="flex gap-1"
            color="warning"
            onClick={() => socket?.sendSkip()}
          >
            <Icon icon="solar:skip-next-bold-duotone" />
            넘기기
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
          나가기
        </Button>
      </div>
      <div className="flex items-center justify-center gap-1">
        <div>{message}</div>
      </div>
      <div className="flex flex-row items-center justify-center gap-4 max-[700px]:flex-col">
        <div className="flex flex-col gap-4">
          {duration !== undefined && <Timer duration={duration} />}
          {socket && <Canvas socket={socket} readonly={!isPainter} />}
        </div>
        <div className="flex w-full max-w-[700px] flex-col items-center gap-4 max-[700px]:h-full">
          {socket && <Toolbox socket={socket} readonly={!isPainter} />}
          <LeaderBoard
            players={players}
            myId={socket?.id}
            painterId={painterId}
          />
          <ChatLog list={chatLog} className="max-h-60 w-full rounded-xl p-3" />
          <Input
            {...htmlAttribute}
            placeholder="정답을 입력하세요"
            onKeyDown={handleKeydown}
            disabled={isPainter}
          />
        </div>
      </div>
      {showConfetti && <Confetti mode="boom" />}
      <ChangeTimeout
        time={time}
        formIsOpen={formIsOpen}
        formOpenChange={formOpenChange}
        requestIsOpen={requestIsOpen}
        requestOpenChange={requestOpenChange}
        socket={socket}
      />
    </div>
  );
}
