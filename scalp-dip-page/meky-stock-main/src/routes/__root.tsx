import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { MarketClock } from "@/components/market-clock";
import { Toaster } from "@/components/ui/sonner";
import { GlobalScalpWatcher } from "@/components/global-scalp-watcher";
import { AISupervisorChat } from "@/components/ai-supervisor-chat";
import { NotificationCenter } from "@/components/notification-center";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EGX سكانر — تحليل ذكي للبورصة المصرية" },
      {
        name: "description",
        content:
          "ماسح يومي لأسهم البورصة المصرية مع تحليل فني وتوصيات ذكية للمدى القصير.",
      },
      { property: "og:title", content: "EGX سكانر — تحليل ذكي للبورصة المصرية" },
      {
        property: "og:description",
        content: "توصيات يومية مرتبة بنقاط دخول وأهداف ووقف خسارة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "EGX سكانر — تحليل ذكي للبورصة المصرية" },
      { name: "description", content: "EGX Insights scans Egyptian stocks, analyzes them with technical indicators and AI, and recommends short-term trading opportunities." },
      { property: "og:description", content: "EGX Insights scans Egyptian stocks, analyzes them with technical indicators and AI, and recommends short-term trading opportunities." },
      { name: "twitter:description", content: "EGX Insights scans Egyptian stocks, analyzes them with technical indicators and AI, and recommends short-term trading opportunities." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7e25a586-ba96-432f-b9f3-fe2459d6de50/id-preview-d9f9f91f--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app-1780394725131.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7e25a586-ba96-432f-b9f3-fe2459d6de50/id-preview-d9f9f91f--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app-1780394725131.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <MarketClock />
      <Outlet />
      <Link
        to="/activity"
        aria-label="سجل النشاط والإشعارات"
        title="سجل النشاط والإشعارات"
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition"
      >
        📜
      </Link>
      <Link
        to="/automation"
        aria-label="الأتمتة — مراقبة المشروع"
        title="الأتمتة — مراقبة المشروع"
        className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg hover:scale-105 transition"
      >
        🤖
      </Link>
      <Link
        to="/scalp"
        aria-label="Scalp Live — إشارات لحظية"
        title="Scalp Live"
        className="fixed bottom-36 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-warn text-warn-foreground shadow-lg hover:scale-105 transition"
      >
        ⚡
      </Link>
      <Link
        to="/scalp-fresh"
        aria-label="Scalp Fresh — نسخة تجريبية"
        title="Scalp Fresh (تجريبي)"
        className="fixed bottom-52 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition"
      >
        🧪
      </Link>
      <Link
        to="/session-log"
        aria-label="Session Log — سجل الجلسة"
        title="Session Log"
        className="fixed bottom-[17rem] left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground shadow-lg hover:scale-105 transition"
      >
        📜
      </Link>
      <Link
        to="/scalp-dip"
        aria-label="Scalp DIP — استراتيجية الانخفاض"
        title="Scalp DIP Live"
        className="fixed bottom-[21rem] left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg hover:scale-105 transition"
      >
        📉
      </Link>
      <Link
        to="/marketwatch-health"
        aria-label="فحص Volume لحظي"
        title="فحص Volume لحظي"
        className="fixed bottom-[25rem] left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-bull text-bull-foreground shadow-lg hover:scale-105 transition"
      >
        📊
      </Link>
      <Toaster position="top-center" richColors closeButton />
      <GlobalScalpWatcher />
      <NotificationCenter />
      <AISupervisorChat />
    </QueryClientProvider>
  );
}
