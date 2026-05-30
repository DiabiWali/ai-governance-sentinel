import { GovernanceDashboard } from "@/components/dashboard/GovernanceDashboard";
import { I18nProvider } from "@/i18n/I18nProvider";

export default function Home() {
  return (
    <I18nProvider>
      <GovernanceDashboard />
    </I18nProvider>
  );
}
