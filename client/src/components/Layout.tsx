import { useState, useEffect, ReactNode } from "react";
import { createWebSocketConnection } from "@/lib/websocket";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Create WebSocket connection
    const ws = createWebSocketConnection();
    setSocket(ws);

    // Clean up on unmount
    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-dark">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
