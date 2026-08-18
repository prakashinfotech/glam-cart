import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:badges/badges.dart' as badges;
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import '../models/product.dart';
import '../widgets/product_card.dart';
import '../main.dart';
import 'products_screen.dart';
import 'product_detail_screen.dart';
import 'cart_screen.dart';
import 'orders_screen.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _tab = 0;

  late final List<Widget> _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = [const _HomeTab(), const ProductsScreen(), const CartScreen(), const OrdersScreen()];
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = context.watch<CartProvider>().count;

    return Scaffold(
      body: IndexedStack(index: _tab, children: _tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        indicatorColor: kPinkPale,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: kPink),
            label: 'Home',
          ),
          const NavigationDestination(
            icon: Icon(Icons.grid_view_outlined),
            selectedIcon: Icon(Icons.grid_view, color: kPink),
            label: 'Products',
          ),
          NavigationDestination(
            icon: badges.Badge(
              showBadge: cartCount > 0,
              badgeContent: Text('$cartCount',
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              badgeStyle: const badges.BadgeStyle(badgeColor: kPink, padding: EdgeInsets.all(4)),
              child: const Icon(Icons.shopping_cart_outlined),
            ),
            selectedIcon: const Icon(Icons.shopping_cart, color: kPink),
            label: 'Cart',
          ),
          const NavigationDestination(
            icon: Icon(Icons.receipt_long_outlined),
            selectedIcon: Icon(Icons.receipt_long, color: kPink),
            label: 'Orders',
          ),
        ],
      ),
    );
  }
}

class _HomeTab extends StatefulWidget {
  const _HomeTab();

  @override
  State<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<_HomeTab> {
  final _api = ApiService();
  List<Product> _featured = [];
  List<Product> _bestsellers = [];
  bool _loading = true;
  String? _error;

  static const _categories = [
    {'name': 'Makeup', 'slug': 'makeup', 'emoji': '💄'},
    {'name': 'Skincare', 'slug': 'skincare', 'emoji': '✨'},
    {'name': 'Haircare', 'slug': 'haircare', 'emoji': '🪮'},
    {'name': 'Fragrance', 'slug': 'fragrance', 'emoji': '🌸'},
    {'name': 'Bath & Body', 'slug': 'bath-body', 'emoji': '🛁'},
    {'name': 'Wellness', 'slug': 'wellness', 'emoji': '🌿'},
  ];

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() { _loading = true; _error = null; });
    try {
      final r1 = await _api.getProducts(params: {'featured': 'true'});
      final r2 = await _api.getProducts(params: {'bestseller': 'true'});
      final d1 = r1.data is List ? r1.data : (r1.data['products'] ?? r1.data);
      final d2 = r2.data is List ? r2.data : (r2.data['products'] ?? r2.data);
      setState(() {
        _featured = (d1 as List).take(8).map((e) => Product.fromJson(e)).toList();
        _bestsellers = (d2 as List).take(6).map((e) => Product.fromJson(e)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _loading = false; _error = ApiService.getErrorMessage(e); });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        elevation: 0,
        title: const Text(
          'GlamCart',
          style: TextStyle(color: kPink, fontWeight: FontWeight.w900, fontSize: 26, letterSpacing: 0.5),
        ),
        actions: [
          if (auth.isLoggedIn)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: GestureDetector(
                onTap: () => _showLogout(context, auth),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircleAvatar(
                      radius: 14,
                      backgroundColor: kPinkPale,
                      child: Text(
                        auth.user!.name[0].toUpperCase(),
                        style: const TextStyle(color: kPink, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      auth.user!.name.split(' ')[0],
                      style: const TextStyle(color: kDark, fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                  ],
                ),
              ),
            )
          else
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: TextButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                style: TextButton.styleFrom(
                  backgroundColor: kPink,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Login', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: kPink))
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.wifi_off_outlined, size: 64, color: Colors.grey),
                    const SizedBox(height: 16),
                    Text(_error!, textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 15, color: Colors.grey)),
                    const SizedBox(height: 20),
                    ElevatedButton.icon(
                      onPressed: _fetch,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Try Again'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPink,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                    ),
                  ],
                ),
              ),
            )
          : RefreshIndicator(
              color: kPink,
              onRefresh: _fetch,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Hero Banner ──
                    Container(
                      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      height: 150,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFFF5C8D), Color(0xFFD84373)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Stack(
                        children: [
                          // Decorative circles
                          Positioned(
                            right: -20,
                            top: -20,
                            child: Container(
                              width: 130,
                              height: 130,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withValues(alpha: 0.08),
                              ),
                            ),
                          ),
                          Positioned(
                            right: 50,
                            bottom: -30,
                            child: Container(
                              width: 90,
                              height: 90,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.white.withValues(alpha: 0.06),
                              ),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.25),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: const Text('LIMITED OFFER',
                                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                                ),
                                const SizedBox(height: 8),
                                const Text('Beauty Deals',
                                    style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, height: 1.1)),
                                const SizedBox(height: 4),
                                const Text('Up to 40% off on all products',
                                    style: TextStyle(color: Colors.white70, fontSize: 13)),
                                const SizedBox(height: 6),
                                GestureDetector(
                                  onTap: () {},
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: const Text('Shop Now',
                                        style: TextStyle(color: kPink, fontWeight: FontWeight.bold, fontSize: 12)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Positioned(
                            right: 16,
                            top: 0,
                            bottom: 0,
                            child: Center(child: Text('💄', style: TextStyle(fontSize: 64))),
                          ),
                        ],
                      ),
                    ),

                    // ── Categories ──
                    _sectionHeader('Shop by Category'),
                    SizedBox(
                      height: 96,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        scrollDirection: Axis.horizontal,
                        itemCount: _categories.length,
                        itemBuilder: (_, i) {
                          final cat = _categories[i];
                          return GestureDetector(
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => ProductsScreen(category: cat['slug'], title: cat['name'])),
                            ),
                            child: Container(
                              width: 76,
                              margin: const EdgeInsets.symmetric(horizontal: 5),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Container(
                                    width: 58,
                                    height: 58,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 6, offset: const Offset(0, 2)),
                                      ],
                                    ),
                                    child: Center(child: Text(cat['emoji']!, style: const TextStyle(fontSize: 26))),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    cat['name']!,
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: kDark),
                                    textAlign: TextAlign.center,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    // ── Featured Products ──
                    if (_featured.isNotEmpty) ...[
                      _sectionHeader('Featured Products',
                          onSeeAll: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(title: 'Featured')))),
                      SizedBox(
                        // image(148) + text(~105) + vertical paddings ≈ 265
                        height: 265,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                          scrollDirection: Axis.horizontal,
                          itemCount: _featured.length,
                          itemBuilder: (_, i) => SizedBox(
                            width: 160,
                            child: Padding(
                              padding: const EdgeInsets.only(right: 12),
                              child: ProductCard(
                                product: _featured[i],
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => ProductDetailScreen(slug: _featured[i].slug)),
                                ),
                                // No Add to Cart button in horizontal list — too cramped
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],

                    // ── Bestsellers ──
                    if (_bestsellers.isNotEmpty) ...[
                      _sectionHeader('Bestsellers',
                          onSeeAll: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ProductsScreen(title: 'Bestsellers')))),
                      GridView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          // image(148) + text+button(~115) + padding(~18) ≈ 281 / card_width(173) ≈ 0.61
                          childAspectRatio: 0.60,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemCount: _bestsellers.length,
                        itemBuilder: (_, i) => ProductCard(
                          product: _bestsellers[i],
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => ProductDetailScreen(slug: _bestsellers[i].slug)),
                          ),
                          onAddToCart: () => _addToCart(_bestsellers[i]),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
    );
  }

  Widget _sectionHeader(String title, {VoidCallback? onSeeAll}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: kDark)),
          if (onSeeAll != null)
            GestureDetector(
              onTap: onSeeAll,
              child: const Text('See All', style: TextStyle(fontSize: 13, color: kPink, fontWeight: FontWeight.w600)),
            ),
        ],
      ),
    );
  }

  Future<void> _addToCart(Product p) async {
    if (!context.read<AuthProvider>().isLoggedIn) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }
    try {
      await context.read<CartProvider>().addToCart(p.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('${p.name} added to cart'),
          backgroundColor: kPink,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 2),
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(ApiService.getErrorMessage(e)),
          backgroundColor: Colors.red.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ));
      }
    }
  }

  void _showLogout(BuildContext context, AuthProvider auth) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(width: 40, height: 4, decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2))),
            ),
            const SizedBox(height: 20),
            Text('Hi, ${auth.user!.name}!', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            Text(auth.user!.email, style: const TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                auth.logout();
                context.read<CartProvider>().reset();
              },
              icon: const Icon(Icons.logout),
              label: const Text('Logout'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade600,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
