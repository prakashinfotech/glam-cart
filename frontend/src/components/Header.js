'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { FiSearch, FiShoppingBag, FiHeart, FiUser, FiMenu, FiX, FiChevronDown } from 'react-icons/fi';

const NAV_CATEGORIES = [
  { label: 'Makeup', slug: 'makeup' },
  { label: 'Skincare', slug: 'skincare' },
  { label: 'Haircare', slug: 'haircare' },
  { label: 'Fragrance', slug: 'fragrance' },
  { label: 'Bath & Body', slug: 'bath-body' },
  { label: 'Wellness', slug: 'wellness' },
];

export default function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className={`sticky top-0 z-50 bg-white ${scrolled ? 'shadow-md' : 'shadow-sm'} transition-shadow`}>
      {/* Top bar */}
      <div className="bg-glamcart-primary text-white text-xs text-center py-1.5 font-medium">
        Free delivery on orders above ₹499 | Use code <span className="font-bold">GLAMCART10</span> for 10% off
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-glamcart-primary tracking-tight">GlamCart</span>
              <span className="text-xs text-glamcart-gray mt-1">.com</span>
            </div>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl hidden md:flex">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more..."
                className="w-full pl-4 pr-12 py-2.5 border-2 border-glamcart-border rounded-full text-sm focus:outline-none focus:border-glamcart-primary transition-colors"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-4 bg-glamcart-primary text-white rounded-r-full hover:bg-glamcart-primary-dark transition-colors"
              >
                <FiSearch size={18} />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex flex-col items-center gap-0.5 text-glamcart-dark hover:text-glamcart-primary transition-colors group"
              >
                <FiUser size={20} />
                <span className="text-xs hidden md:block">
                  {user ? user.name.split(' ')[0] : 'Login'}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg shadow-xl border border-glamcart-border z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-glamcart-border">
                        <p className="font-semibold text-sm text-glamcart-dark">{user.name}</p>
                        <p className="text-xs text-glamcart-gray truncate">{user.email}</p>
                      </div>
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-glamcart-primary-pale hover:text-glamcart-primary transition-colors">My Profile</Link>
                      <Link href="/orders" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-glamcart-primary-pale hover:text-glamcart-primary transition-colors">My Orders</Link>
                      <Link href="/wishlist" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-glamcart-primary-pale hover:text-glamcart-primary transition-colors">Wishlist</Link>
                      <hr className="border-glamcart-border" />
                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); router.push('/'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm font-semibold text-glamcart-primary hover:bg-glamcart-primary-pale transition-colors">Login</Link>
                      <Link href="/register" onClick={() => setUserMenuOpen(false)} className="block px-4 py-3 text-sm hover:bg-glamcart-primary-pale transition-colors">Create Account</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Wishlist */}
            <Link href="/wishlist" className="flex flex-col items-center gap-0.5 text-glamcart-dark hover:text-glamcart-primary transition-colors">
              <FiHeart size={20} />
              <span className="text-xs hidden md:block">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link href="/cart" className="flex flex-col items-center gap-0.5 text-glamcart-dark hover:text-glamcart-primary transition-colors relative">
              <div className="relative">
                <FiShoppingBag size={20} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-glamcart-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-xs hidden md:block">Bag</span>
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden text-glamcart-dark"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX size={22} /> : <FiMenu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands..."
              className="w-full pl-4 pr-12 py-2 border border-glamcart-border rounded-full text-sm focus:outline-none focus:border-glamcart-primary"
            />
            <button type="submit" className="absolute right-0 top-0 bottom-0 px-4 bg-glamcart-primary text-white rounded-r-full">
              <FiSearch size={16} />
            </button>
          </div>
        </form>

        {/* Category nav */}
        <nav className="hidden md:flex border-t border-glamcart-border">
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="px-4 py-2.5 text-sm font-medium text-glamcart-dark hover:text-glamcart-primary hover:border-b-2 hover:border-glamcart-primary transition-colors whitespace-nowrap"
            >
              {cat.label}
            </Link>
          ))}
          <Link href="/products" className="px-4 py-2.5 text-sm font-medium text-glamcart-primary hover:text-glamcart-primary-dark whitespace-nowrap ml-auto">
            All Products →
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-glamcart-border">
          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-6 py-3 text-sm border-b border-glamcart-border hover:bg-glamcart-primary-pale hover:text-glamcart-primary transition-colors"
            >
              {cat.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
