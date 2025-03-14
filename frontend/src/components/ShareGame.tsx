import { Icon } from "@iconify-icon/react/dist/iconify.mjs";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@nextui-org/react";
import { FocusEventHandler } from "react";
import toast from "react-hot-toast";

export default function ShareGame({ roomId }: { readonly roomId: string }) {
  const {
    onOpen: formOpen,
    isOpen: formIsOpen,
    onOpenChange: formOpenChange,
  } = useDisclosure();
  const url = `${location.protocol}//${location.host}/login?roomId=${roomId}`;

  const focusHandler: FocusEventHandler = (e) => {
    (e.currentTarget as HTMLInputElement).select();
  };

  const share = () => {
    void window.navigator.clipboard
      .writeText(url)
      .then(() => toast.success("주소를 복사 했습니다!"))
      .catch(() =>
        toast.error(
          "주소 복사를 실패했습니다. 권한을 허용해주시거나 직접 복사하여 공유해주세요.",
        ),
      );
  };

  return (
    <>
      <Button onPress={formOpen} color="primary">
        <Icon icon="solar:square-share-line-bold-duotone" />
        공유하기
      </Button>
      <Modal isOpen={formIsOpen} onOpenChange={formOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                게임 같이하기
              </ModalHeader>
              <ModalBody>
                <p>같은 게임방에 참여할 수 있는 주소입니다.</p>
                <p>주소를 공유해서 같이 게임을 즐기세요!</p>
                <Input readOnly value={url} onFocus={focusHandler} />
                <Button size="lg" onPress={share} color="primary">
                  <Icon icon="solar:clipboard-bold-duotone" />
                  복사하기
                </Button>
              </ModalBody>
              <ModalFooter>
                <Button color="default" onPress={onClose}>
                  확인
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
