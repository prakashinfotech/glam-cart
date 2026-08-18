import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/order.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../main.dart';
import 'login_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  final _api = ApiService();
  List<Order> _orders = [];
  bool _loading = false;
  bool _hasFetched = false;
  String? _error;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final isLoggedIn = context.read<AuthProvider>().isLoggedIn;
    if (isLoggedIn && !_hasFetched) {
      _hasFetched = true;
      _fetch();
    }
  }

  Future<void> _fetch() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await _api.getOrders();
      final list = res.data is List ? res.data : (res.data['orders'] ?? res.data);
      if (!mounted) return;
      setState(() {
        _orders = (list as List).map((e) => Order.fromJson(e)).toList();
        _loading = false;
      });
    } catch (e) {
      if (mounted) setState(() { _loading = false; _error = ApiService.getErrorMessage(e); });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = context.watch<AuthProvider>().isLoggedIn;

    if (!isLoggedIn) {
      return Scaffold(
        backgroundColor: const Color(0xFFF7F7F7),
        appBar: AppBar(
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.white,
          title: const Text('My Orders'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('📦', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 16),
                const Text('Login to view your orders',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                const Text('Track and manage your purchases here',
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

    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: const Text('My Orders'),
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
          : _orders.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('📦', style: TextStyle(fontSize: 64)),
                      const SizedBox(height: 16),
                      const Text('No orders yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      const Text('Your orders will appear here after you shop',
                          style: TextStyle(color: Colors.grey, fontSize: 13), textAlign: TextAlign.center),
                    ],
                  ),
                )
              : RefreshIndicator(
                  color: kPink,
                  onRefresh: _fetch,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                    itemCount: _orders.length,
                    itemBuilder: (_, i) => _OrderCard(order: _orders[i]),
                  ),
                ),
    );
  }
}

class _OrderCard extends StatelessWidget {
  final Order order;
  const _OrderCard({required this.order});

  Color get _statusColor {
    switch (order.status) {
      case 'DELIVERED':
        return Colors.green.shade600;
      case 'CANCELLED':
        return Colors.red.shade600;
      case 'SHIPPED':
        return Colors.blue.shade600;
      default:
        return Colors.orange.shade600;
    }
  }

  IconData get _statusIcon {
    switch (order.status) {
      case 'DELIVERED':
        return Icons.check_circle_outline;
      case 'CANCELLED':
        return Icons.cancel_outlined;
      case 'SHIPPED':
        return Icons.local_shipping_outlined;
      default:
        return Icons.hourglass_empty_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Order #${order.id}',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 2),
                      Text(
                        DateFormat('dd MMM yyyy, hh:mm a').format(order.createdAt),
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(_statusIcon, size: 13, color: _statusColor),
                      const SizedBox(width: 4),
                      Text(order.status,
                          style: TextStyle(
                              color: _statusColor, fontWeight: FontWeight.bold, fontSize: 12)),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          // Product thumbnails
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: SizedBox(
              height: 56,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: order.items.length,
                itemBuilder: (_, i) {
                  final imgs = order.items[i].productImages;
                  return Container(
                    width: 56,
                    height: 56,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      color: const Color(0xFFF5F5F5),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(7),
                      child: imgs.isNotEmpty
                          ? CachedNetworkImage(imageUrl: imgs[0], fit: BoxFit.cover)
                          : const Center(child: Text('🧴', style: TextStyle(fontSize: 22))),
                    ),
                  );
                },
              ),
            ),
          ),

          // Footer
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${order.items.length} item${order.items.length != 1 ? 's' : ''}  •  ${order.paymentMethod}',
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                      if (order.paymentStatus == 'PAID') ...[
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            Icon(Icons.verified_outlined, size: 13, color: Colors.green.shade600),
                            const SizedBox(width: 3),
                            Text('Paid', style: TextStyle(color: Colors.green.shade600, fontSize: 12, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),
                Text(
                  '₹${order.total.toStringAsFixed(0)}',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: kPink),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
