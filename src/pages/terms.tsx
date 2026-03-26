import { Link } from "wouter";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#F5F7F9] font-sans text-gray-800 selection:bg-orange-200 selection:text-orange-900 pb-20">
      {/* Simple Header */}
      <header className="bg-[#00789c] text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <FileText className="w-6 h-6 text-orange-400" />
          <h1 className="text-xl font-bold tracking-wide">Terms of Service</h1>
        </div>
      </header>

      {/* Policy Content */}
      <main className="container mx-auto px-4 pt-10 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-orange max-w-none">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wide mb-8">
            Last Updated: March 2026
          </p>

          <p>
            Welcome to ScrollPet. By accessing or using our platform, you agree
            to be bound by these Terms of Service. If you do not agree to these
            terms, please do not use our services.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            1. Use of the Platform
          </h2>
          <p>
            ScrollPet is a platform designed to connect pet owners and
            enthusiasts. You must be at least 13 years old to use this platform.
            You agree to use the platform only for lawful purposes and in
            accordance with our Community Guidelines.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            2. User-Generated Content
          </h2>
          <p>
            You retain ownership of any messages, photos, videos, or audio you
            submit to the platform. However, by submitting content, you grant
            ScrollPet a worldwide, non-exclusive, royalty-free license to host,
            display, and distribute your content within the platform.
          </p>
          <p className="mt-4">
            <strong>You are solely responsible for your content.</strong> We do
            not endorse any user content and expressly disclaim any and all
            liability in connection with user content.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            3. Moderation and Enforcement
          </h2>
          <p>
            We reserve the right, but have no obligation, to monitor user
            content and chat rooms. ScrollPet staff and automated systems may:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Remove or refuse to post any content for any reason.</li>
            <li>
              Issue warnings, temporary cooldowns, or permanent bans to users
              who violate our Terms or Community Guidelines.
            </li>
            <li>
              Take appropriate legal action against anyone who engages in
              illegal activities on the platform.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            4. Disclaimers and Limitation of Liability
          </h2>
          <p>
            The platform is provided on an "AS IS" and "AS AVAILABLE" basis.
            ScrollPet makes no warranties, express or implied, regarding the
            reliability, accuracy, or availability of the platform.
          </p>
          <p className="mt-4 font-bold">
            To the fullest extent permitted by law, ScrollPet shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages arising out of or relating to your use of the
            platform.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            5. Third-Party Links & Affiliates
          </h2>
          <p>
            The platform (particularly the News Rooms) may contain links to
            third-party websites or services that are not owned or controlled by
            ScrollPet. We may earn an affiliate commission for purchases made
            through some of these links. We hold no responsibility for the
            content, privacy policies, or practices of any third-party websites.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            6. Changes to Terms
          </h2>
          <p>
            We reserve the right to modify these terms at any time. We will
            notify users of any material changes by updating the "Last Updated"
            date at the top of this page. Your continued use of the platform
            after any such changes constitutes your acceptance of the new Terms
            of Service.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            7. Contact Us
          </h2>
          <p>
            If you have any questions regarding these Terms, please contact us
            at:
          </p>
          <p className="font-bold text-gray-900 mt-2">
            Email: support@scrollpet.com
          </p>
        </div>
      </main>
    </div>
  );
}
