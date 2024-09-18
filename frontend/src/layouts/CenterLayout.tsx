import { NextUIProvider } from "@nextui-org/react";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Outlet, useNavigate } from "react-router-dom";

export default function CenterLayout({
  children,
}: {
  readonly children?: ReactNode;
}) {
  const navigate = useNavigate();

  return (
    <NextUIProvider navigate={navigate}>
      <div className="h-screen w-screen bg-slate-200">
        <Toaster />
        {children ?? <Outlet />}
      </div>
    </NextUIProvider>
  );
}
