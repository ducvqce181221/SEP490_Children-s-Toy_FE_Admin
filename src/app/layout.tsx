import { Outfit } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import "quill/dist/quill.snow.css";
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationRealtimeProvider } from '@/features/notifications/context/NotificationRealtimeContext';
import { Toaster } from "react-hot-toast";

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${outfit.className} dark:bg-gray-900`} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <NotificationRealtimeProvider>
            <SidebarProvider>
              {children}
              <Toaster
                position="top-right"
                containerStyle={{ zIndex: 99999 }}
                toastOptions={{
                  style: {
                    zIndex: 99999,
                  },
                }}
              />
            </SidebarProvider>
            </NotificationRealtimeProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
