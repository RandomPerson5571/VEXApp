import { SettingsSidebar } from "@/components/settings/SettingsSidebar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-8 py-6 bg-slate-50 dark:bg-[#000000] font-sans dashboard-scroll">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <SettingsSidebar />
        <div className="lg:col-span-9">{children}</div>
      </div>
    </div>
  );
}
