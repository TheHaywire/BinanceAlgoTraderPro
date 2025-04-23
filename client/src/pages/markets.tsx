import { Container } from "@/components/ui/container";

export default function Markets() {
  return (
    <Container className="py-6">
      <div className="bg-[#1C2230] rounded-xl p-8 mt-4">
        <h1 className="text-2xl font-bold mb-4">Markets Overview</h1>
        <p className="text-neutral-light">Monitor Binance Futures markets data and price action</p>
        
        <div className="mt-8 text-center text-neutral-light py-16">
          <i className="ri-exchange-line text-4xl mb-4"></i>
          <h3 className="text-lg font-medium mb-2">Markets Explorer Coming Soon</h3>
          <p>This section is under development. Soon you'll be able to explore all available markets and analyze their performance.</p>
        </div>
      </div>
    </Container>
  );
}
