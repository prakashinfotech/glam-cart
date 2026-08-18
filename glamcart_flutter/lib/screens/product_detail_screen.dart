import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import '../main.dart';
import 'login_screen.dart';
import 'cart_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final String slug;
  const ProductDetailScreen({super.key, required this.slug});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  final _api = ApiService();
  Product? _product;
  bool _loading = true;
  String? _error;
  int _imageIndex = 0;
  bool _addingToCart = false;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await _api.getProduct(widget.slug);
      final data = res.data;
      setState(() {
        _product = Product.fromJson(data is Map && data.containsKey('product') ? data['product'] : data);
        _loading = false;
      });
    } catch (e) {
      setState(() { _loading = false; _error = ApiService.getErrorMessage(e); });
    }
  }

  Future<void> _addToCart() async {
    if (!context.read<AuthProvider>().isLoggedIn) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }
    setState(() => _addingToCart = true);
    try {
      await context.read<CartProvider>().addToCart(_product!.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: const Text('Added to cart!'),
          backgroundColor: kPink,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          action: SnackBarAction(
            label: 'View Cart',
            textColor: Colors.white,
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
          ),
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
    } finally {
      if (mounted) setState(() => _addingToCart = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(backgroundColor: Colors.white, surfaceTintColor: Colors.white),
        body: const Center(child: CircularProgressIndicator(color: kPink)),
      );
    }
    if (_error != null || _product == null) {
      return Scaffold(
        appBar: AppBar(backgroundColor: Colors.white, surfaceTintColor: Colors.white),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.wifi_off_outlined, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                Text(_error ?? 'Product not found',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 15, color: Colors.grey)),
                if (_error != null) ...[
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
              ],
            ),
          ),
        ),
      );
    }

    final p = _product!;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: Text(p.brand ?? p.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined, color: kDark),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen())),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Image Gallery ──
            Stack(
              children: [
                Container(
                  height: 300,
                  width: double.infinity,
                  color: const Color(0xFFF9F9F9),
                  child: p.images.isNotEmpty
                      ? CachedNetworkImage(imageUrl: p.images[_imageIndex], fit: BoxFit.contain)
                      : const Center(child: Text('🧴', style: TextStyle(fontSize: 80))),
                ),
                if (p.discount > 0)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(color: Colors.green.shade600, borderRadius: BorderRadius.circular(6)),
                      child: Text('${p.discount}% OFF',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
              ],
            ),

            // Thumbnail strip
            if (p.images.length > 1)
              Container(
                height: 68,
                color: Colors.white,
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  scrollDirection: Axis.horizontal,
                  itemCount: p.images.length,
                  itemBuilder: (_, i) => GestureDetector(
                    onTap: () => setState(() => _imageIndex = i),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 54,
                      height: 54,
                      margin: const EdgeInsets.only(right: 8),
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: _imageIndex == i ? kPink : Colors.grey.shade200,
                          width: _imageIndex == i ? 2 : 1,
                        ),
                        borderRadius: BorderRadius.circular(8),
                        color: const Color(0xFFF9F9F9),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(7),
                        child: CachedNetworkImage(imageUrl: p.images[i], fit: BoxFit.contain),
                      ),
                    ),
                  ),
                ),
              ),

            // ── Product Info ──
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (p.brand != null)
                    Text(p.brand!,
                        style: const TextStyle(color: kPink, fontWeight: FontWeight.w700, fontSize: 13, letterSpacing: 0.5)),
                  const SizedBox(height: 4),
                  Text(p.name, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, height: 1.3)),
                  const SizedBox(height: 12),

                  // Price row
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text('₹${p.price.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: kPink)),
                      if (p.mrp != null && p.mrp! > p.price) ...[
                        const SizedBox(width: 10),
                        Text('₹${p.mrp!.toStringAsFixed(0)}',
                            style: const TextStyle(
                                fontSize: 16, color: Colors.grey, decoration: TextDecoration.lineThrough)),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(6)),
                          child: Text('${p.discount}% off',
                              style: TextStyle(
                                  fontSize: 12, color: Colors.green.shade700, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Rating
                  if (p.rating != null)
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.shade600,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.star, color: Colors.white, size: 13),
                              const SizedBox(width: 3),
                              Text(p.rating!.toStringAsFixed(1),
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                            ],
                          ),
                        ),
                        if (p.reviewCount != null) ...[
                          const SizedBox(width: 8),
                          Text('${p.reviewCount} reviews',
                              style: const TextStyle(color: Colors.grey, fontSize: 13)),
                        ],
                      ],
                    ),

                  const SizedBox(height: 16),

                  // Stock status
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: p.stock > 0 ? Colors.green : Colors.red,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        p.stock > 0 ? 'In Stock (${p.stock} available)' : 'Out of Stock',
                        style: TextStyle(
                          color: p.stock > 0 ? Colors.green.shade700 : Colors.red,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),

                  // Description
                  if (p.description != null) ...[
                    const SizedBox(height: 20),
                    const Divider(),
                    const SizedBox(height: 12),
                    const Text('About this product',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(p.description!,
                        style: const TextStyle(color: Color(0xFF555555), height: 1.6, fontSize: 14)),
                  ],

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 12, offset: const Offset(0, -4)),
          ],
        ),
        child: ElevatedButton(
          onPressed: p.stock > 0 && !_addingToCart ? _addToCart : null,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: _addingToCart
              ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.shopping_cart_outlined, size: 20),
                    const SizedBox(width: 8),
                    Text(p.stock > 0 ? 'Add to Cart' : 'Out of Stock',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ],
                ),
        ),
      ),
    );
  }
}
