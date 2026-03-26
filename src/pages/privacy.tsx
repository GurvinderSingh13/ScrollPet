import { Link } from "wouter";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
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
          <Shield className="w-6 h-6 text-orange-400" />
          <h1 className="text-xl font-bold tracking-wide">Privacy Policy</h1>
        </div>
      </header>

      {/* Policy Content */}
      <main className="container mx-auto px-4 pt-10 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-orange max-w-none">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wide mb-8">
            Last Updated: March 2026
          </p>

          <p>
            Welcome to ScrollPet. We are committed to protecting your personal
            information and your right to privacy. This Privacy Policy explains
            how we collect, use, and safeguard your information when you use our
            website and community platform.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            1. Information We Collect
          </h2>
          <p>
            We collect personal information that you voluntarily provide to us
            when you register on the platform. This includes:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Account Information:</strong> Your email address,
              username, and display name.
            </li>
            <li>
              <strong>Location Data:</strong> To place you in the correct local
              chat rooms, we collect the Country, State/Region, and District
              that you select in your profile.
            </li>
            <li>
              <strong>Pet Information:</strong> Details about the pets you own
              or are interested in to match you with the right communities.
            </li>
            <li>
              <strong>User-Generated Content:</strong> Messages, announcements,
              images, videos, and audio recordings you post in our chat rooms
              and news feeds.
            </li>
          </ul>

          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Third-Party Logins:</strong> If you choose to register
              using a third-party account (like Google, Apple, or Facebook), we
              will receive basic profile information (such as your name and
              email address) permitted by that provider to create and
              authenticate your ScrollPet account.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            2. How We Use Your Information
          </h2>
          <p>We use the information we collect or receive to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Facilitate Account Creation:</strong> To manage your
              account and keep it secure.
            </li>
            <li>
              <strong>Route You to Communities:</strong> To automatically place
              you in the correct Global, Country, or State-level chat rooms
              based on your profile settings.
            </li>
            <li>
              <strong>Protect Our Community:</strong> To enforce our Community
              Guidelines. Our moderation team reviews user reports and chat logs
              to issue warnings or bans to maintain a safe environment.
            </li>
            <li>
              <strong>Deliver Announcements:</strong> To provide targeted news
              and updates based on your location and pet interests.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            3. How We Share Your Information
          </h2>
          <p>
            We do not sell your personal information to third parties. We may
            share your information only in the following situations:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Publicly Shared Information:</strong> Any messages,
              images, or media you post in the chat rooms or news rooms are
              visible to other users in those rooms. Please do not share
              sensitive personal information in public chats.
            </li>
            <li>
              <strong>Legal Obligations:</strong> We may disclose your
              information where we are legally required to do so in order to
              comply with applicable law, governmental requests, or court
              orders.
            </li>
            <li>
              <strong>Enforcing Terms:</strong> We may share information with
              our moderation team to investigate potential violations of our
              policies or to protect the safety of our users.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            4. Data Retention & Deletion
          </h2>
          <p>
            We keep your information for as long as necessary to fulfill the
            purposes outlined in this privacy policy unless otherwise required
            by law. You can request to delete your account and personal data at
            any time by contacting our support team. Upon request, we will
            remove your active account data from our databases.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            5. Cookies and Tracking Technologies
          </h2>
          <p>
            We use cookies and similar tracking technologies (like local
            storage) strictly to maintain your session (keeping you logged in)
            and save your interface preferences (like pinned states). You can
            refuse cookies through your browser settings, though this will
            prevent you from logging into the platform.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            6. Children's Privacy
          </h2>
          <p>
            ScrollPet is not intended for children under the age of 13. We do
            not knowingly collect personal information from children under 13.
            If we discover that a user is under 13, we will immediately delete
            their account and associated data.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            7. Contact Us
          </h2>
          <p>
            If you have questions or comments about this Privacy Policy, please
            contact us at:
          </p>
          <p className="font-bold text-gray-900 mt-2">
            Email: support@scrollpet.com
          </p>
        </div>
      </main>
    </div>
  );
}
