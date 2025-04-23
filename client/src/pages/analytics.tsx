import { Container } from "@/components/ui/container";

export default function Analytics() {
  return (
    <Container className="py-6">
      <div className="bg-[#1C2230] rounded-xl p-8 mt-4">
        <h1 className="text-2xl font-bold mb-4">Performance Analytics</h1>
        <p className="text-neutral-light">Advanced insights into your trading performance</p>
        
        <div className="mt-8 text-center text-neutral-light py-16">
          <i className="ri-line-chart-line text-4xl mb-4"></i>
          <h3 className="text-lg font-medium mb-2">Advanced Analytics Coming Soon</h3>
          <p>This section is under development. Soon you'll be able to access in-depth analytics about your trading performance.</p>
        </div>
      </div>
    </Container>
  );
}
