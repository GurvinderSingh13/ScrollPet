import { Link } from "wouter";
import { ArrowLeft, Cookie } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-[#F5F7F9] font-sans text-gray-800 selection:bg-orange-200 selection:text-orange-900 pb-20">
      <header className="bg-[#00789c] text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center gap-4">
          <Link href="/">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <Cookie className="w-6 h-6 text-orange-400" />
          <h1 className="text-xl font-bold tracking-wide">Cookie Policy</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-10 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-orange max-w-none">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Cookie Policy
          </h1>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-wide mb-8">
            Last Updated: March 2026
          </p>

          <p>
            This Cookie Policy explains how ScrollPet uses cookies and similar
            technologies to recognize you when you visit our platform. It
            explains what these technologies are and why we use them, as well as
            your rights to control our use of them.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            1. What are cookies?
          </h2>
          <p>
            Cookies are small data files that are placed on your computer or
            mobile device when you visit a website. Cookies are widely used by
            website owners in order to make their websites work, or to work more
            efficiently, as well as to provide reporting information.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            2. Why do we use cookies?
          </h2>
          <p>
            We use essential cookies that are strictly necessary to provide you
            with services available through our platform. Specifically, we use
            them for:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <strong>Authentication:</strong> To keep you logged in as you
              navigate between chat rooms and the dashboard.
            </li>
            <li>
              <strong>Security:</strong> To protect your user account and our
              platform from unauthorized access.
            </li>
            <li>
              <strong>Preferences:</strong> To remember your interface settings,
              such as your pinned states or preferred chat room locations.
            </li>
          </ul>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            3. Third-Party Authentication
          </h2>
          <p>
            If you choose to register or log in using third-party services (such
            as Google or Apple), those providers may place their own cookies on
            your device to authenticate your identity. We do not control these
            third-party cookies.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            4. How can I control cookies?
          </h2>
          <p>
            You have the right to decide whether to accept or reject cookies.
            You can set or amend your web browser controls to accept or refuse
            cookies. If you choose to reject cookies, you may still use our
            website, but your access to some functionality and areas of our
            website (like logging in) will be severely restricted.
          </p>

          <h2 className="text-xl font-bold text-[#00789c] mt-8 mb-4 border-b pb-2">
            5. Contact Us
          </h2>
          <p>
            If you have any questions about our use of cookies or other
            technologies, please email us at:
          </p>
          <p className="font-bold text-gray-900 mt-2">
            Email: support@scrollpet.com
          </p>
        </div>
      </main>
    </div>
  );
}
