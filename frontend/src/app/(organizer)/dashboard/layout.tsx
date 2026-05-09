import OrganizerNav from "@/components/layout/OrganizerNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <OrganizerNav>{children}</OrganizerNav>;
}
