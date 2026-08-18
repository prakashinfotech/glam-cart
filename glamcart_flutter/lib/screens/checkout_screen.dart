import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import '../models/address.dart';
import '../config/api_config.dart';
import '../main.dart';
import 'orders_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _api = ApiService();
  late Razorpay _razorpay;

  List<Address> _addresses = [];
  int? _selectedAddressId;
  String _paymentMethod = 'COD';
  final _couponCtrl = TextEditingController();
  bool _placing = false;
  bool _loadingAddresses = true;

  // Coupon state
  String? _appliedCoupon;
  double _discount = 0;
  bool _couponLoading = false;
  bool _showCoupons = false;
  List<Map<String, dynamic>> _availableCoupons = _kStaticCoupons;

  static const _kStaticCoupons = <Map<String, dynamic>>[
    {'code': 'GLAMCART10', 'desc': '10% off up to ₹200', 'minOrder': 500.0},
    {'code': 'FIRST50',    'desc': '₹50 flat off',        'minOrder': 299.0},
    {'code': 'BEAUTY20',   'desc': '20% off up to ₹300', 'minOrder': 799.0},
    {'code': 'SKINCARE15', 'desc': '15% off up to ₹250', 'minOrder': 599.0},
    {'code': 'FREESHIP',   'desc': '₹49 off (free delivery)', 'minOrder': 0.0},
    {'code': 'MEGA30',     'desc': '30% off up to ₹500', 'minOrder': 1499.0},
  ];

  static const _paymentMethods = [
    {'id': 'COD', 'label': 'Cash on Delivery', 'icon': Icons.local_shipping_outlined},
    {'id': 'UPI', 'label': 'UPI Payment', 'icon': Icons.phone_android_outlined},
    {'id': 'CARD', 'label': 'Credit / Debit Card', 'icon': Icons.credit_card_outlined},
    {'id': 'NETBANKING', 'label': 'Net Banking', 'icon': Icons.account_balance_outlined},
  ];

  @override
  void initState() {
    super.initState();
    _fetchAddresses();
    _fetchCoupons();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _onPaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    _couponCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchAddresses() async {
    try {
      final res = await _api.getAddresses();
      final list = res.data is List ? res.data : (res.data['addresses'] ?? res.data);
      final addresses = (list as List).map((e) => Address.fromJson(e)).toList();
      if (!mounted) return;
      setState(() {
        _addresses = addresses;
        _selectedAddressId = addresses.isNotEmpty
            ? addresses.firstWhere((a) => a.isDefault, orElse: () => addresses.first).id
            : null;
        _loadingAddresses = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingAddresses = false);
    }
  }

  Future<void> _fetchCoupons() async {
    try {
      final res = await _api.getCoupons();
      if (!mounted) return;
      final list = res.data as List;
      if (list.isNotEmpty) {
        setState(() {
          _availableCoupons = list.map((c) {
            final type = c['type'] as String;
            final value = (c['value'] as num).toDouble();
            final maxDiscount = c['maxDiscount'] != null ? (c['maxDiscount'] as num).toDouble() : null;
            final desc = type == 'PERCENT'
                ? '${value.toInt()}% off${maxDiscount != null ? ' up to ₹${maxDiscount.toInt()}' : ''}'
                : '₹${value.toInt()} flat off';
            return {
              'code': c['code'] as String,
              'desc': desc,
              'minOrder': (c['minOrder'] as num?)?.toDouble() ?? 0.0,
            };
          }).toList();
        });
      }
    } catch (_) {}
  }

  Future<void> _applyCoupon(String code) async {
    if (code.trim().isEmpty) return;
    setState(() => _couponLoading = true);
    try {
      final res = await _api.validateCoupon(code.trim().toUpperCase(), _cartTotal);
      final discount = (res.data['discount'] as num).toDouble();
      if (!mounted) return;
      setState(() {
        _appliedCoupon = code.trim().toUpperCase();
        _discount = discount;
        _couponCtrl.text = code.trim().toUpperCase();
        _showCoupons = false;
      });
      _snack('Coupon applied! You save ₹${discount.toStringAsFixed(0)}');
    } catch (e) {
      if (!mounted) return;
      String msg = 'Invalid coupon';
      try { msg = (e as dynamic).response?.data['error'] ?? msg; } catch (_) {}
      _snack(msg, isError: true);
    } finally {
      if (mounted) setState(() => _couponLoading = false);
    }
  }

  void _removeCoupon() {
    setState(() {
      _appliedCoupon = null;
      _discount = 0;
      _couponCtrl.clear();
    });
  }

  double get _cartTotal => context.read<CartProvider>().total;
  double get _deliveryCharge => _cartTotal >= 499 ? 0 : 49;
  double get _finalTotal => _cartTotal + _deliveryCharge - _discount;

  Future<void> _placeOrder() async {
    if (_selectedAddressId == null) {
      _snack('Please select a delivery address', isError: true);
      return;
    }
    if (_paymentMethod != 'COD') {
      await _initiateRazorpay();
      return;
    }
    setState(() => _placing = true);
    try {
      await _api.placeOrder({
        'addressId': _selectedAddressId,
        'paymentMethod': _paymentMethod,
        if (_couponCtrl.text.trim().isNotEmpty) 'couponCode': _couponCtrl.text.trim(),
      });
      if (!mounted) return;
      await context.read<CartProvider>().clearCart();
      if (!mounted) return;
      _snack('Order placed successfully! 🎉');
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const OrdersScreen()),
        (r) => r.isFirst,
      );
    } catch (_) {
      if (mounted) _snack('Failed to place order', isError: true);
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  Future<void> _initiateRazorpay() async {
    setState(() => _placing = true);
    try {
      final res = await _api.createRazorpayOrder(_finalTotal);
      if (!mounted) return;
      final data = res.data;
      final user = context.read<AuthProvider>().user;
      final options = {
        'key': ApiConfig.razorpayKey,
        'amount': data['amount'],
        'currency': data['currency'],
        'name': 'GlamCart',
        'description': 'Order Payment',
        'order_id': data['orderId'],
        'prefill': {
          'contact': user?.phone ?? '',
          'email': user?.email ?? '',
          'name': user?.name ?? '',
        },
        'theme': {'color': '#FF5C8D'},
      };
      _razorpay.open(options);
    } catch (_) {
      if (mounted) {
        _snack('Failed to initiate payment', isError: true);
        setState(() => _placing = false);
      }
    }
  }

  Future<void> _onPaymentSuccess(PaymentSuccessResponse response) async {
    try {
      await _api.verifyPayment({
        'razorpay_order_id': response.orderId,
        'razorpay_payment_id': response.paymentId,
        'razorpay_signature': response.signature,
      });
      await _api.placeOrder({
        'addressId': _selectedAddressId,
        'paymentMethod': _paymentMethod,
        'razorpayPaymentId': response.paymentId,
        if (_couponCtrl.text.trim().isNotEmpty) 'couponCode': _couponCtrl.text.trim(),
      });
      if (!mounted) return;
      await context.read<CartProvider>().clearCart();
      if (!mounted) return;
      _snack('Payment successful! Order placed 🎉');
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (_) => const OrdersScreen()),
        (r) => r.isFirst,
      );
    } catch (_) {
      if (mounted) {
        _snack('Payment received but order failed. Contact support.', isError: true);
        setState(() => _placing = false);
      }
    }
  }

  void _onPaymentError(PaymentFailureResponse response) {
    if (mounted) {
      _snack('Payment failed: ${response.message ?? 'Try again'}', isError: true);
      setState(() => _placing = false);
    }
  }

  void _onExternalWallet(ExternalWalletResponse response) {
    if (mounted) _snack('Wallet selected: ${response.walletName}');
  }

  void _snack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? Colors.red.shade600 : kPink,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF7F7F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        title: const Text('Checkout'),
      ),
      body: _loadingAddresses
          ? const Center(child: CircularProgressIndicator(color: kPink))
          : SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 100),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Delivery Address ──
                  _sectionCard(
                    title: 'Delivery Address',
                    icon: Icons.location_on_outlined,
                    child: _addresses.isEmpty
                        ? const Padding(
                            padding: EdgeInsets.all(8),
                            child: Text('No saved addresses. Add one from your profile.',
                                style: TextStyle(color: Colors.grey, fontSize: 13)),
                          )
                        : Column(
                            children: _addresses.map((addr) => _addressTile(addr)).toList(),
                          ),
                  ),

                  const SizedBox(height: 12),

                  // ── Payment Method ──
                  _sectionCard(
                    title: 'Payment Method',
                    icon: Icons.payment_outlined,
                    child: Column(
                      children: _paymentMethods.map((m) => _paymentTile(m)).toList(),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── Coupon ──
                  _sectionCard(
                    title: 'Coupon Code',
                    icon: Icons.local_offer_outlined,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Input row
                        Row(
                          children: [
                            Expanded(
                              child: TextField(
                                controller: _couponCtrl,
                                enabled: _appliedCoupon == null,
                                textCapitalization: TextCapitalization.characters,
                                decoration: InputDecoration(
                                  hintText: 'e.g. GLAMCART10',
                                  hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
                                  filled: true,
                                  fillColor: const Color(0xFFF5F5F5),
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                  border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
                                  prefixIcon: const Icon(Icons.local_offer_outlined, color: kPink, size: 18),
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            _appliedCoupon != null
                                ? TextButton(
                                    onPressed: _removeCoupon,
                                    style: TextButton.styleFrom(
                                      foregroundColor: Colors.red.shade600,
                                      backgroundColor: Colors.red.shade50,
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                    child: const Text('Remove', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                                  )
                                : ElevatedButton(
                                    onPressed: _couponLoading ? null : () => _applyCoupon(_couponCtrl.text),
                                    style: ElevatedButton.styleFrom(
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      elevation: 0,
                                    ),
                                    child: _couponLoading
                                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                        : const Text('Apply', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                  ),
                          ],
                        ),

                        // Applied confirmation
                        if (_appliedCoupon != null) ...[
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.green.shade200),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.check_circle_outline, color: Colors.green.shade600, size: 15),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    '$_appliedCoupon applied — you save ₹${_discount.toStringAsFixed(0)}!',
                                    style: TextStyle(color: Colors.green.shade700, fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        // Toggle to show coupons list
                        const SizedBox(height: 8),
                        GestureDetector(
                          onTap: () => setState(() => _showCoupons = !_showCoupons),
                          child: Row(
                            children: [
                              const Icon(Icons.card_giftcard_outlined, color: kPink, size: 14),
                              const SizedBox(width: 4),
                              Text(
                                'View available coupons (${_availableCoupons.length})',
                                style: const TextStyle(color: kPink, fontSize: 12, fontWeight: FontWeight.w600),
                              ),
                              const Spacer(),
                              Icon(_showCoupons ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                  color: kPink, size: 18),
                            ],
                          ),
                        ),

                        // Coupon list
                        if (_showCoupons) ...[
                          const SizedBox(height: 8),
                          Container(
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey.shade200),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Column(
                              children: _availableCoupons.asMap().entries.map((entry) {
                                final i = entry.key;
                                final c = entry.value;
                                final code = c['code'] as String;
                                final isApplied = _appliedCoupon == code;
                                final minOrder = (c['minOrder'] as double);
                                return Container(
                                  decoration: BoxDecoration(
                                    border: i == 0 ? null : Border(top: BorderSide(color: Colors.grey.shade200)),
                                    color: isApplied ? Colors.green.shade50 : Colors.white,
                                    borderRadius: i == 0
                                        ? const BorderRadius.vertical(top: Radius.circular(10))
                                        : i == _availableCoupons.length - 1
                                            ? const BorderRadius.vertical(bottom: Radius.circular(10))
                                            : BorderRadius.zero,
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                  child: Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(code,
                                                style: TextStyle(
                                                    fontWeight: FontWeight.w800,
                                                    fontSize: 13,
                                                    letterSpacing: 0.5,
                                                    color: isApplied ? Colors.green.shade700 : kDark)),
                                            Text(c['desc'] as String,
                                                style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                            if (minOrder > 0)
                                              Text('Min order ₹${minOrder.toInt()}',
                                                  style: TextStyle(fontSize: 10, color: Colors.grey.shade400)),
                                          ],
                                        ),
                                      ),
                                      GestureDetector(
                                        onTap: _couponLoading ? null : () => isApplied ? _removeCoupon() : _applyCoupon(code),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                                          decoration: BoxDecoration(
                                            color: isApplied ? Colors.green.shade100 : kPink,
                                            borderRadius: BorderRadius.circular(20),
                                            border: isApplied ? Border.all(color: Colors.green.shade300) : null,
                                          ),
                                          child: Text(
                                            isApplied ? '✓ Applied' : 'Apply',
                                            style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: FontWeight.bold,
                                                color: isApplied ? Colors.green.shade700 : Colors.white),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),

                  // ── Order Summary ──
                  _sectionCard(
                    title: 'Order Summary',
                    icon: Icons.receipt_long_outlined,
                    child: Column(
                      children: [
                        ...cart.items.map((item) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${item.product.name} × ${item.quantity}',
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 13),
                                    ),
                                  ),
                                  Text('₹${item.total.toStringAsFixed(0)}',
                                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                                ],
                              ),
                            )),
                        const Divider(height: 16),
                        _summaryRow('Subtotal', '₹${cart.total.toStringAsFixed(0)}'),
                        const SizedBox(height: 4),
                        _summaryRow(
                          'Delivery',
                          _deliveryCharge == 0 ? 'FREE' : '₹${_deliveryCharge.toStringAsFixed(0)}',
                          valueColor: _deliveryCharge == 0 ? Colors.green.shade600 : null,
                        ),
                        if (_discount > 0) ...[
                          const SizedBox(height: 4),
                          _summaryRow(
                            'Coupon Discount',
                            '− ₹${_discount.toStringAsFixed(0)}',
                            valueColor: Colors.green.shade600,
                          ),
                        ],
                        const Divider(height: 16),
                        _summaryRow(
                          'Total',
                          '₹${_finalTotal.toStringAsFixed(0)}',
                          isBold: true,
                          valueColor: kPink,
                          fontSize: 17,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 12, offset: const Offset(0, -4)),
          ],
        ),
        child: ElevatedButton(
          onPressed: _placing ? null : _placeOrder,
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: _placing
              ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(_paymentMethod == 'COD' ? Icons.local_shipping_outlined : Icons.lock_outlined, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      _paymentMethod == 'COD'
                          ? 'Place Order  ₹${_finalTotal.toStringAsFixed(0)}'
                          : 'Pay ₹${_finalTotal.toStringAsFixed(0)} via Razorpay',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
        ),
      ),
    );
  }

  Widget _sectionCard({required String title, required IconData icon, required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 6, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Row(
              children: [
                Icon(icon, color: kPink, size: 18),
                const SizedBox(width: 8),
                Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: kDark)),
              ],
            ),
          ),
          const Divider(height: 1),
          Padding(padding: const EdgeInsets.all(14), child: child),
        ],
      ),
    );
  }

  Widget _addressTile(Address addr) => GestureDetector(
        onTap: () => setState(() => _selectedAddressId = addr.id),
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            border: Border.all(
              color: _selectedAddressId == addr.id ? kPink : Colors.grey.shade200,
              width: _selectedAddressId == addr.id ? 2 : 1,
            ),
            borderRadius: BorderRadius.circular(10),
            color: _selectedAddressId == addr.id ? kPinkPale : Colors.white,
          ),
          child: Row(
            children: [
              _RadioDot(selected: _selectedAddressId == addr.id),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(addr.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                              color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
                          child: Text(addr.type,
                              style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(addr.fullAddress, style: const TextStyle(color: Colors.grey, fontSize: 12, height: 1.4)),
                    Text('📞 ${addr.phone}', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
            ],
          ),
        ),
      );

  Widget _paymentTile(Map<String, Object> m) {
    final isSelected = _paymentMethod == m['id'];
    return GestureDetector(
      onTap: () => setState(() => _paymentMethod = m['id'] as String),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? kPink : Colors.grey.shade200,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(10),
          color: isSelected ? kPinkPale : Colors.white,
        ),
        child: Row(
          children: [
            _RadioDot(selected: isSelected),
            const SizedBox(width: 8),
            Icon(m['icon'] as IconData, color: isSelected ? kPink : Colors.grey.shade600, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(m['label'] as String,
                  style: TextStyle(
                      fontSize: 14,
                      fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                      color: isSelected ? kDark : Colors.grey.shade700)),
            ),
            if (m['id'] != 'COD')
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: kPinkPale, borderRadius: BorderRadius.circular(4)),
                child: const Text('Razorpay',
                    style: TextStyle(fontSize: 10, color: kPink, fontWeight: FontWeight.bold)),
              ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value,
      {bool isBold = false, Color? valueColor, double fontSize = 13}) {
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
}

class _RadioDot extends StatelessWidget {
  final bool selected;
  const _RadioDot({required this.selected});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 150),
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: selected ? kPink : Colors.grey.shade400, width: selected ? 2 : 1.5),
        color: Colors.white,
      ),
      child: selected
          ? Center(
              child: Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(shape: BoxShape.circle, color: kPink),
              ),
            )
          : null,
    );
  }
}
