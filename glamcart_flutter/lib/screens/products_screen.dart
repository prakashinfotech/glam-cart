import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../models/product.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/product_card.dart';
import '../main.dart';
import 'product_detail_screen.dart';
import 'login_screen.dart';

class ProductsScreen extends StatefulWidget {
  final String? category;
  final String? title;

  const ProductsScreen({super.key, this.category, this.title});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  final _api = ApiService();
  final _searchCtrl = TextEditingController();
  List<Product> _products = [];
  bool _loading = true;
  String? _error;
  String _sort = '';

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchProducts() async {
    setState(() { _loading = true; _error = null; });
    try {
      final params = <String, dynamic>{};
      if (widget.category != null) params['category'] = widget.category;
      if (_searchCtrl.text.trim().isNotEmpty) params['search'] = _searchCtrl.text.trim();
      final res = await _api.getProducts(params: params);
      final data = res.data;
      final list = data is List ? data : (data['products'] ?? data);
      List<Product> products = (list as List).map((e) => Product.fromJson(e)).toList();
      if (_sort == 'price_asc') products.sort((a, b) => a.price.compareTo(b.price));
      if (_sort == 'price_desc') products.sort((a, b) => b.price.compareTo(a.price));
      setState(() {
        _products = products;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _loading = false;
        _error = ApiService.getErrorMessage(e);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isNested = widget.category != null || widget.title != null;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: Text(widget.title ?? 'All Products'),
        automaticallyImplyLeading: isNested,
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.tune),
            tooltip: 'Sort',
            onSelected: (v) {
              _sort = v;
              _fetchProducts();
            },
            itemBuilder: (_) => [
              _sortItem('', 'Default'),
              _sortItem('price_asc', 'Price: Low to High'),
              _sortItem('price_desc', 'Price: High to Low'),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: TextField(
              controller: _searchCtrl,
              decoration: InputDecoration(
                hintText: 'Search products...',
                hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
                prefixIcon: const Icon(Icons.search, color: kPink, size: 22),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close, size: 18, color: Colors.grey),
                        onPressed: () {
                          _searchCtrl.clear();
                          _fetchProducts();
                        },
                      )
                    : null,
                filled: true,
                fillColor: const Color(0xFFF5F5F5),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: kPink, width: 1.5),
                ),
              ),
              onChanged: (v) => setState(() {}),
              onSubmitted: (_) => _fetchProducts(),
              textInputAction: TextInputAction.search,
            ),
          ),

          // Results count
          if (!_loading)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 6, 16, 2),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  '${_products.length} product${_products.length != 1 ? 's' : ''} found',
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ),
            ),

          Expanded(
            child: _loading
                ? _buildShimmer()
                : _error != null
                    ? _buildError()
                    : _products.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('🔍', style: TextStyle(fontSize: 48)),
                            const SizedBox(height: 12),
                            const Text('No products found', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            TextButton(
                              onPressed: () {
                                _searchCtrl.clear();
                                _fetchProducts();
                              },
                              child: const Text('Clear search', style: TextStyle(color: kPink)),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        color: kPink,
                        onRefresh: _fetchProducts,
                        child: GridView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.60,
                            crossAxisSpacing: 12,
                            mainAxisSpacing: 12,
                          ),
                          itemCount: _products.length,
                          itemBuilder: (_, i) => ProductCard(
                            product: _products[i],
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => ProductDetailScreen(slug: _products[i].slug)),
                            ),
                            onAddToCart: () => _addToCart(_products[i]),
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  PopupMenuItem<String> _sortItem(String value, String label) => PopupMenuItem(
        value: value,
        child: Row(
          children: [
            Icon(_sort == value ? Icons.radio_button_checked : Icons.radio_button_off,
                size: 18, color: _sort == value ? kPink : Colors.grey),
            const SizedBox(width: 10),
            Text(label),
          ],
        ),
      );

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

  Widget _buildError() {
    return Center(
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
              onPressed: _fetchProducts,
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
    );
  }

  Widget _buildShimmer() {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.60,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: 6,
      itemBuilder: (ctx, idx) => Shimmer.fromColors(
        baseColor: Colors.grey.shade300,
        highlightColor: Colors.grey.shade100,
        child: Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}
