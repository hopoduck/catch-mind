import {
  Badge,
  Button,
  Divider,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { useState } from "react";

// 업데이트 날짜의 unix epoch 값
const lastChangelog = 1742373772143;

export default function Changelog() {
  const lastShowChangelog = isNaN(
    Number(localStorage.getItem("lastShowChangelog")),
  )
    ? Date.now()
    : Number(localStorage.getItem("lastShowChangelog"));

  const [isNew, setIsNew] = useState(lastChangelog >= lastShowChangelog);
  const { onOpen, isOpen, onOpenChange } = useDisclosure();
  const openHandler = () => {
    onOpen();
    localStorage.setItem("lastShowChangelog", Date.now().toString());
    setIsNew(false);
  };

  return (
    <div className="flex w-full max-w-lg flex-col items-center justify-center gap-2">
      {isNew ? (
        <Badge
          color="danger"
          shape="circle"
          content=""
          showOutline={false}
          placement="top-right"
        >
          <Button color="warning" onPress={openHandler}>
            업데이트 내역
          </Button>
        </Badge>
      ) : (
        <Button color="warning" onPress={openHandler}>
          업데이트 내역
        </Button>
      )}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader>업데이트 내역</ModalHeader>
          <ModalBody>
            <div className="space-y-2 pb-2">
              <div className="text-lg">2025-03-19</div>
              <li className="text-base">모바일 화면 비율을 조정했습니다.</li>
              <Divider className="!my-4" />
              <div className="text-lg">2025-03-16</div>
              <li className="text-base">
                문제 단어를 추가하였습니다. (3,682개 → 7,859개)
              </li>
              <Divider className="!my-4" />
              <div className="text-lg">2025-03-14</div>
              <li className="text-base">공유기능 추가</li>
              <li className="ml-8 text-base">
                쉽게 다른 사람들과 같이 게임을 즐겨보세요
              </li>
              <li className="text-base">모바일 대응 추가</li>
              <Divider className="!my-4" />
              <div className="text-lg">2024-10-28</div>
              <li className="text-base">
                문제 단어를 추가하였습니다. (1,319개 → 3,682개)
              </li>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
