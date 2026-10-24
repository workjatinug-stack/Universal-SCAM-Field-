import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import ThemeToggle from "./ThemeToggle";
import logo from "@/assets/SENTRA AI Scam Detector Logo.png";

const menuItems = [
  { icon: LayoutDashboard, label: "Page 1", path: "/" },
  { icon: Users, label: "Page 2", path: "/some-path" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--background)", color: "var(--foreground)", minHeight: "100vh" }}>
      <SidebarProvider
        style={
          {
            "--sidebar-width": `${sidebarWidth}px`,
          } as CSSProperties
        }
      >
        <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
          {children}
        </DashboardLayoutContent>
      </SidebarProvider>
    </div>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
          style={{ backgroundColor: "var(--card)", borderRight: "1px solid var(--border)" }}
        >
          <SidebarHeader className="h-16 justify-center" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)" }}
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4" style={{ color: "var(--foreground)" }} />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img 
                    src={logo} 
                    alt="Sentra Logo" 
                    className="h-9 w-auto transition-all duration-300 hover:scale-105"
                    style={{ maxHeight: "2.25rem", objectFit: "contain" }}
                  />
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-0.5">
                      <span className="font-semibold tracking-tight truncate text-sm" style={{ color: "var(--foreground)" }}>
                        Sentra
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div 
                        className="h-px w-6"
                        style={{ background: "linear-gradient(90deg, #00C8FF 0%, transparent 100%)" }}
                      />
                      <span className="text-[8px] font-medium uppercase tracking-[0.15em]" style={{ color: "var(--muted)" }}>
                        AI-Powered
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
              {!isCollapsed && (
                <div className="ml-auto">
                  <ThemeToggle />
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all font-normal`}
                      style={{
                        backgroundColor: isActive ? "var(--accent)" : "transparent",
                        color: isActive ? "var(--foreground)" : "var(--muted)",
                        borderRadius: "8px",
                        margin: "2px 0"
                      }}
                    >
                      <item.icon
                        className={`h-4 w-4`}
                        style={{ color: isActive ? "#2FA7A0" : "var(--muted)" }}
                      />
                      <span style={{ color: isActive ? "var(--foreground)" : "var(--muted)" }}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)" }}>
                  <Avatar className="h-9 w-9 border shrink-0" style={{ borderColor: "var(--border)" }}>
                    <AvatarFallback className="text-xs font-medium" style={{ backgroundColor: "var(--card)", color: "var(--foreground)" }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none" style={{ color: "var(--foreground)" }}>
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs truncate mt-1.5" style={{ color: "var(--muted)" }}>
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48" style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer"
                  style={{ color: "var(--foreground)" }}
                >
                  <LogOut className="mr-2 h-4 w-4" style={{ color: "#C95C5C" }} />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40" style={{ backgroundColor: "var(--background)", borderBottom: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg" style={{ backgroundColor: "var(--accent)", border: "1px solid var(--border)" }} />
              <div className="flex items-center gap-3">
                <img 
                  src={logo} 
                  alt="Sentra Logo" 
                  className="h-8 w-auto"
                  style={{ maxHeight: "2rem", objectFit: "contain" }}
                />
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                    Sentra
                  </span>
                  <span className="text-[8px] font-medium uppercase tracking-[0.15em]" style={{ color: "var(--muted)" }}>
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
        )}
        <main className="flex-1 p-4" style={{ backgroundColor: "var(--background)" }}>{children}</main>
      </SidebarInset>
    </>
  );
}
