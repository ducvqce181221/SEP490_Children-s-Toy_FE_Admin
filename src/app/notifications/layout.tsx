import NotificationsShell from "@/features/notifications/components/NotificationsShell";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NotificationsShell>{children}</NotificationsShell>;
}
