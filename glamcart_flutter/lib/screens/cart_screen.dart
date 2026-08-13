import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../main.dart';
import 'login_screen.dart';
import 'checkout_screen.dart';

class CartScreen extends StatelessWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isLoggedIn) {
      return Scaffold(
        backgroundColor: const Color(0xFFF7F7F7),
        appBar: AppBar(
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white,
          title: const Text('My Cart'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('🛒', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 16),
                const Text('Login to view your cart',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Add products and checkout easily',
                    style: TextStyle(color: Colors.grey, fontSize: 13), textAlign: TextAlign.center),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () =>
                        Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
                    style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                    child: const Text('Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final cart = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: Text('My Cart${cart.count > 0 ? ' (${cart.count})' : ''}'),
        actions: [
          if (cart.items.isNotEmpty)
            TextButton(
              onPressed: () => _confirmClear(context, cart),
              child: const Text('Clear All', style: TextStyle(color: Colors.red, fontSize: 13)),
            ),
        ],
      ),
      body: cart.loading
          ? const Center(child: CircularProgressIndicator(color: kPink))
          : cart.items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('🛒', style: TextStyle(fontSize: 64)),
                      const SizedBox(height: 16),
                      const Text('Your cart is empty', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      const Text('Add some products to get started',
                          style: TextStyle(color: Colors.grey, fontSize: 13)),
                    ],
                  ),
                )
              : Column(
                  children: [
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                        itemCount: cart.items.length,
                        itemBuilder: (_, i) {
                          final item = cart.items[i];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              boxShadow: [
                                BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 6, offset: const Offset(0, 2)),
                              ],
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Row(
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(10),
                                    child: item.product.firstImage.isNotEmpty
                                        ? CachedNetworkImage(
                                            imageUrl: item.product.firstImage,
                                            width: 78,
                                            height: 78,
                                            fit: BoxFit.cover,
                                          )
                                        : Container(
                                            width: 78,
                                            height: 78,
                                            color: const Color(0xFFF5F5F5),
                                            child: const Center(child: Text('🧴', style: TextStyle(fontSize: 28))),
                                          ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        if (item.product.brand != null)
                                          Text(item.product.brand!,
                                              style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                        Text(
                                          item.product.name,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, height: 1.3),
                                        ),
                                        const SizedBox(height: 6),
                                        Text(
                                          '₹${item.product.price.toStringAsFixed(0)}',
                                          style: const TextStyle(color: kPink, fontWeight: FontWeight.bold, fontSize: 15),
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            _QtyButton(
                                              icon: Icons.remove,
                                              onPressed: item.quantity > 1
                                                  ? () => cart.updateItem(item.product.id, item.quantity - 1)
                                                  : () => cart.removeItem(item.product.id),
                                            ),
                                            Container(
                                              width: 36,
                                              alignment: Alignment.center,
                                              child: Text(
                                                '${item.quantity}',
                                                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                              ),
                                            ),
                                            _QtyButton(
                                              icon: Icons.add,
                                              onPressed: () => cart.updateItem(item.product.id, item.quantity + 1),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      GestureDetector(
                                        onTap: () => cart.removeItem(item.product.id),
                                        child: Container(
                                          padding: const EdgeInsets.all(4),
                                          decoration: BoxDecoration(
                                            color: Colors.red.shade50,
                                            borderRadius: BorderRadius.circular(6),
                                          ),
                                          child: Icon(Icons.delete_outline, color: Colors.red.shade400, size: 18),
                                        ),
                                      ),
                                      const SizedBox(height: 28),
                                      Text(
                                        '₹${item.total.toStringAsFixed(0)}',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                    // ── Order Summary & Checkout ──
                    Container(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        boxShadow: [
                          BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 12, offset: const Offset(0, -4)),
                        ],
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                      ),
                      child: Column(
                        children: [
                          _row('Subtotal (${cart.count} items)', '₹${cart.total.toStringAsFixed(0)}'),
                          const SizedBox(height: 6),
                          _row(
                            'Delivery',
                            cart.total >= 499 ? 'FREE' : '₹49',
                            valueColor: cart.total >= 499 ? Colors.green.shade600 : null,
                          ),
                          if (cart.total < 499) ...[
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.info_outline, size: 13, color: Colors.orange),
                                const SizedBox(width: 4),
                                Text(
                                  'Add ₹${(499 - cart.total).toStringAsFixed(0)} more for free delivery',
                                  style: const TextStyle(fontSize: 11, color: Colors.orange),
                                ),
                              ],
                            ),
                          ],
                          const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Divider()),
                          _row(
                            'Total',
                            '₹${(cart.total + (cart.total >= 499 ? 0 : 49)).toStringAsFixed(0)}',
                            isBold: true,
                            valueColor: kPink,
                            fontSize: 17,
                          ),
                          const SizedBox(height: 14),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: () => Navigator.push(
                                  context, MaterialPageRoute(builder: (_) => const CheckoutScreen())),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: const Text('Proceed to Checkout',
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _row(String label, String value,
      {bool isBold = false, Color? valueColor, double fontSize = 14}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: TextStyle(
                fontSize: fontSize,
                fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                color: isBold ? kDark : Colors.grey.shade700)),
        Text(value,
            style: TextStyle(
                fontSize: fontSize,
                fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
                color: valueColor ?? (isBold ? kDark : null))),
      ],
    );
  }

  void _confirmClear(BuildContext context, CartProvider cart) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
            ),
            const SizedBox(height: 20),
            const Text('Clear Cart?', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('All items will be removed from your cart.',
                style: TextStyle(color: Colors.grey), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      cart.clearCart();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red.shade600,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: const Text('Clear'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QtyButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  const _QtyButton({required this.icon, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 30,
        height: 30,
        decoration: BoxDecoration(
          border: Border.all(color: kPink, width: 1.5),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 16, color: kPink),
      ),
    );
  }
}
