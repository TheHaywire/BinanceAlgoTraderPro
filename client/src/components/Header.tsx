import { useLocation, Link } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getAccountInfo } from "@/lib/binanceApi";
import { useQuery } from "@tanstack/react-query";

export default function Header() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const { data: accountInfo } = useQuery({
    queryKey: ['/api/binance/account'],
    staleTime: 60000, // 1 minute
  });

  const balance = accountInfo?.availableBalance || "0.00";

  const navItems = [
    { path: "/", label: "Dashboard" },
    { path: "/strategies", label: "Strategies" },
    { path: "/markets", label: "Markets" },
    { path: "/analytics", label: "Analytics" },
    { path: "/settings", label: "Settings" },
  ];

  return (
    <header className="bg-[#0C101A] border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="text-primary font-bold text-xl mr-6 flex items-center">
            <i className="ri-line-chart-fill text-2xl mr-2"></i>
            <span>AlgoTrader</span>
          </div>
          
          <nav className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                href={item.path}
                className={
                  location === item.path
                    ? "text-primary border-b-2 border-primary py-2 font-medium"
                    : "text-gray-400 hover:text-white py-2 font-medium"
                }
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <div className="flex items-center bg-[#252D3D] rounded-md px-3 py-1.5">
              <i className="ri-wallet-3-line text-neutral-light mr-2"></i>
              <span className="font-mono text-success font-medium">{balance} USDT</span>
            </div>
          </div>
          
          <div className="relative">
            <button className="p-1.5 rounded-md hover:bg-[#252D3D]">
              <i className="ri-notification-3-line text-xl"></i>
              <span className="absolute top-0 right-0 bg-danger h-2 w-2 rounded-full"></span>
            </button>
          </div>
          
          <Button 
            variant="outline" 
            className="flex items-center bg-[#252D3D] hover:bg-[#1C2230] rounded-md px-3 py-1.5 border-none"
          >
            <span className="mr-2 text-sm text-gray-300">Testnet</span>
            <div className="h-2 w-2 rounded-full bg-success animate-pulse"></div>
          </Button>
          
          <button 
            className="md:hidden p-1.5 rounded-md hover:bg-[#252D3D]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className={`ri-${isMobileMenuOpen ? 'close' : 'menu'}-line text-xl`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0C101A] border-t border-gray-800 py-2">
          <div className="container mx-auto px-4">
            <nav className="flex flex-col space-y-3 py-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={
                    location === item.path
                      ? "text-primary py-2 font-medium"
                      : "text-gray-400 hover:text-white py-2 font-medium"
                  }
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex items-center bg-[#252D3D] rounded-md px-3 py-2">
              <i className="ri-wallet-3-line text-neutral-light mr-2"></i>
              <span className="font-mono text-success font-medium">{balance} USDT</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
