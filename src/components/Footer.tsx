import { Link } from "wouter";
import logoImage from "@assets/Scrollpet_logo_1766997907297.png";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 pt-20 pb-10 border-t border-gray-900">
      <div className="container px-6 mx-auto">
        <div className="flex flex-col gap-y-10 md:grid md:grid-cols-12 md:gap-12 mb-16">
          <div className="col-span-12 md:col-span-4">
            <Link href="/" className="inline-block mb-6 opacity-90 hover:opacity-100 transition-opacity">
              <img src={logoImage} alt="ScrollPet Logo" className="h-10 w-auto object-contain brightness-0 invert opacity-90" />
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Connecting pet lovers worldwide in a safe, trusted environment. Join us in building the most positive pet community on the internet.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/scrollpet.com_/"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] transition-all cursor-pointer group"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://x.com/Scrollpets"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-black transition-colors cursor-pointer group"
                aria-label="X (Twitter)"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/scrollpet/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-[#0A66C2] transition-colors cursor-pointer group"
                aria-label="LinkedIn"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="col-span-6 md:col-span-2 md:col-start-6">
            <h4 className="font-bold text-white mb-6 text-lg">Platform</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="hover:text-primary transition-colors cursor-pointer">Home</Link></li>
              <li><Link href="/chat" className="hover:text-primary transition-colors cursor-pointer">Chat Rooms</Link></li>
              <li><Link href="/login" className="hover:text-primary transition-colors cursor-pointer">Login</Link></li>
              <li><Link href="/signup" className="hover:text-primary transition-colors cursor-pointer">Sign Up</Link></li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="hover:text-primary transition-colors cursor-pointer">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors cursor-pointer">FAQ</Link></li>
            </ul>
          </div>

          <div className="col-span-6 md:col-span-2">
            <h4 className="font-bold text-white mb-6 text-lg">Legal</h4>
            <ul className="space-y-3">
              <li><Link href="/privacy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors cursor-pointer">Terms of Service</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors cursor-pointer">Cookie Policy</Link></li>
              <li><Link href="/community-guidelines" className="hover:text-primary transition-colors cursor-pointer">Community Guidelines</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500 gap-4">
          <div>© {new Date().getFullYear()} ScrollPet. All rights reserved.</div>
          <div className="flex gap-8">
            <span>Made with ❤️ for pet lovers everywhere 🐾</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
