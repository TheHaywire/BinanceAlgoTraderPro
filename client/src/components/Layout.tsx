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
    
    // Maintain a global WebSocket reference for components
    window.tradingSocket = ws;
    
    // Function to track message timestamps for connection monitoring
    const trackMessageTimestamp = () => {
      // Update the last activity timestamp for connection monitoring
      window.dispatchEvent(new CustomEvent('ws:message'));
    };
    
    // Listen for all WebSocket messages to update the last message timestamp
    ws.addEventListener('message', trackMessageTimestamp);

    // Clean up on unmount
    return () => {
      if (ws) {
        ws.removeEventListener('message', trackMessageTimestamp);
        
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }
      
      // Clear global reference
      delete window.tradingSocket;
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
