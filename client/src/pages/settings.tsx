import { Container } from "@/components/ui/container";

export default function Settings() {
  return (
    <Container className="py-6">
      <div className="bg-[#1C2230] rounded-xl p-8 mt-4">
        <h1 className="text-2xl font-bold mb-4">System Settings</h1>
        <p className="text-neutral-light">Configure your algorithmic trading system settings</p>
        
        <div className="mt-8 text-center text-neutral-light py-16">
          <i className="ri-settings-4-line text-4xl mb-4"></i>
          <h3 className="text-lg font-medium mb-2">Settings Panel Coming Soon</h3>
          <p>This section is under development. Soon you'll be able to configure all aspects of your trading system.</p>
        </div>
      </div>
    </Container>
  );
}
