import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Slider,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { useInputNumber } from "../hooks/useInput";
import Socket from "../socket/Socket";

const MIN = 10;
const MAX = 300;

export default function ChangeTimeout({
  time,
  formIsOpen,
  formOpenChange,
  requestIsOpen,
  requestOpenChange,
  socket,
}: {
  readonly time: number;
  readonly formIsOpen: boolean;
  readonly formOpenChange: () => void;
  readonly requestIsOpen: boolean;
  readonly requestOpenChange: () => void;
  readonly socket: Socket | undefined;
}) {
  const { value, htmlAttribute } = useInputNumber(10);
  const [remainTime, setRemainTime] = useState(30);

  const request = () => {
    socket?.sendChangeTimeoutRequest(value);
  };

  const agree = () => {
    socket?.sendChangeTimeoutAgree();
  };

  const disagree = () => {
    socket?.sendChangeTimeoutDisagree();
  };

  useEffect(() => {
    setRemainTime(30);
    const id = setInterval(() => {
      setRemainTime((remainTime) => remainTime - 1);
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, [requestIsOpen]);

  return (
    <>
      <Modal isOpen={formIsOpen} onOpenChange={formOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                게임 진행시간 변경 요청
              </ModalHeader>
              <ModalBody>
                <p>해당 요청은 과반 이상이 동의하면 변경됩니다.</p>
                <Slider
                  label="진행시간 (초 단위)"
                  minValue={MIN}
                  maxValue={MAX}
                  step={10}
                  marks={new Array(MAX / 60).fill(0).map((_, i) => {
                    const value = i + 1;
                    return {
                      value: value * 60,
                      label: `${value.toString()}분`,
                    };
                  })}
                  {...htmlAttribute}
                />
                <p>해당 변경사항은 다음 문제부터 적용됩니다.</p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  취소
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    request();
                    onClose();
                  }}
                >
                  전송
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal
        isOpen={requestIsOpen}
        onOpenChange={requestOpenChange}
        isDismissable={false}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                게임 진행시간 변경 요청
              </ModalHeader>
              <ModalBody>
                <p>
                  유저중 일부가 게임 진행시간 변경을 요청했습니다. 변경을 요청한
                  시간은 <span className="font-bold">{time}초</span> 입니다.
                </p>
                <p>해당 변경사항은 다음 문제부터 적용됩니다.</p>
                <p>
                  <span className="font-bold">{remainTime}초</span> 안에
                  결정해주세요!
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={() => {
                    disagree();
                    onClose();
                  }}
                >
                  거절
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    agree();
                    onClose();
                  }}
                >
                  동의
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
