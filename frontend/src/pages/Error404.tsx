import { Link } from "@nextui-org/react";
import CenterLayout from "../layouts/CenterLayout";

export default function Error404() {
  return (
    <CenterLayout>
      <div className="flex h-full w-full flex-col items-center justify-center gap-4">
        404 | Not Found
        <Link href="/">메인페이지로 돌아가기</Link>
      </div>
    </CenterLayout>
  );
}
