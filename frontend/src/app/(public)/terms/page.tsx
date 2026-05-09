import { Shield, FileText, Lock, AlertCircle } from "lucide-react";

export const metadata = {
  title: "Terms of Service | FanPass",
  description: "Terms and conditions for using the FanPass platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] pt-24 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-sm border border-[#E5E7EB]">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-green-50 p-3 rounded-2xl text-[#1A7A4A]">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#111827] font-['Outfit']">Terms of Service</h1>
              <p className="text-[#6B7280]">Last updated: May 2026</p>
            </div>
          </div>

          <div className="space-y-8 prose prose-green max-w-none text-[#4B5563]">
            <section>
              <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-[#1A7A4A]" />
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using the FanPass platform, you agree to be bound by these Terms of Service. 
                Our platform provides a digital-only ticketing service designed to reduce fraud and simplify event entry.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-[#1A7A4A]" />
                2. Digital Tickets & Security
              </h2>
              <p>
                FanPass tickets are purely digital. A valid QR code is required for entry. 
                Tickets are tied to the phone number used during purchase. 
                Any attempt to tamper with the QR code or transfer tickets outside our official channels may result in the ticket being voided.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-[#111827] flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-[#1A7A4A]" />
                3. Refund Policy
              </h2>
              <p>
                Refunds are subject to the specific organizer's policy. Generally, tickets are non-refundable 
                unless the event is cancelled or rescheduled. In the event of cancellation, refunds will be 
                processed back through the original payment method (Telebirr, M-Pesa, etc.).
              </p>
            </section>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mt-8">
              <h3 className="text-blue-800 font-bold mb-2">Need help?</h3>
              <p className="text-blue-700 text-sm">
                If you have any questions about these terms or your tickets, please contact our support team at support@fanpass.et
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
