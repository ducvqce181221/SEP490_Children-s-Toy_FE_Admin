import GridShape from "@/components/common/GridShape";
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import { ThemeProvider } from "@/context/ThemeContext";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
          {children}

          <div
            className="lg:w-1/2 w-full h-full lg:grid items-center hidden overflow-hidden"
            style={{ background: "linear-gradient(145deg, #ff6a00 0%, #ff9a3c 60%, #ffb347 100%)" }}
          >
            <div className="relative flex items-center justify-center z-1">
              <GridShape />
              <div className="flex flex-col items-center max-w-sm px-8 text-center">
                <div className="mb-6 flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6C12.268 6 6 12.268 6 20s6.268 14 14 14 14-6.268 14-14S27.732 6 20 6zm0 4a4 4 0 110 8 4 4 0 010-8zm0 20c-4.667 0-8.792-2.386-11.215-6C10.79 21.348 15.198 19.5 20 19.5s9.21 1.848 11.215 4.5C28.792 27.614 24.667 30 20 30z" fill="white"/>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
                  ToyStore Admin
                </h1>
                <p className="text-white/80 text-sm leading-relaxed mb-6">
                  Hệ thống quản trị cửa hàng đồ chơi trẻ em.
                  Quản lý sản phẩm, đơn hàng và khách hàng một cách hiệu quả.
                </p>
              </div>
            </div>
          </div>

          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
