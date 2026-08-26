import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { WhatsAppFab } from "./whatsapp-fab";

export function MarketingShell({
  dir,
  children,
}: {
  dir: "rtl" | "ltr";
  children: React.ReactNode;
}) {
  return (
    <main dir={dir} className="relative isolate min-h-svh overflow-x-clip bg-transparent text-foreground">
      <SiteHeader />
      {children}
      <SiteFooter />
      <WhatsAppFab />
    </main>
  );
}
