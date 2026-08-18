import Link from 'next/link';
import { FiInstagram, FiFacebook, FiTwitter, FiYoutube } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-glamcart-dark text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-glamcart-primary font-black text-2xl mb-4">GlamCart</h3>
          <p className="text-sm text-gray-400 mb-4">Your one-stop destination for beauty and wellness products.</p>
          <div className="flex gap-3">
            {[FiInstagram, FiFacebook, FiTwitter, FiYoutube].map((Icon, i) => (
              <a key={i} href="#" className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-glamcart-primary transition-colors">
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Shop</h4>
          <ul className="space-y-2 text-sm">
            {['Makeup', 'Skincare', 'Haircare', 'Fragrance', 'Bath & Body', 'Wellness'].map((item) => (
              <li key={item}>
                <Link href={`/products?category=${item.toLowerCase().replace(/ & /g, '-').replace(' ', '-')}`} className="hover:text-glamcart-primary transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">My Account</h4>
          <ul className="space-y-2 text-sm">
            {[['Profile', '/profile'], ['Orders', '/orders'], ['Wishlist', '/wishlist'], ['Cart', '/cart'], ['Login', '/login'], ['Register', '/register']].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="hover:text-glamcart-primary transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Help</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>📞 1800-267-4444</li>
            <li>✉️ support@glamcart.com</li>
            <li className="pt-2">Free shipping on orders above ₹499</li>
            <li>Easy 15-day returns</li>
            <li>100% authentic products</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700 text-center py-4 text-xs text-gray-500">
        © 2024 GlamCart.com. All rights reserved.
      </div>
    </footer>
  );
}
