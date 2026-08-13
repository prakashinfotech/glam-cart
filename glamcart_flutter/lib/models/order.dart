class OrderItem {
  final int id;
  final String productName;
  final List<String> productImages;
  final int quantity;
  final double price;

  OrderItem({
    required this.id,
    required this.productName,
    required this.productImages,
    required this.quantity,
    required this.price,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) => OrderItem(
        id: json['id'],
        productName: json['product']?['name'] ?? '',
        productImages: List<String>.from(json['product']?['images'] ?? []),
        quantity: json['quantity'],
        price: (json['price'] as num).toDouble(),
      );
}

class Order {
  final int id;
  final String status;
  final String paymentStatus;
  final String paymentMethod;
  final double subtotal;
  final double deliveryCharge;
  final double discount;
  final double total;
  final List<OrderItem> items;
  final DateTime createdAt;

  Order({
    required this.id,
    required this.status,
    required this.paymentStatus,
    required this.paymentMethod,
    required this.subtotal,
    required this.deliveryCharge,
    required this.discount,
    required this.total,
    required this.items,
    required this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> json) => Order(
        id: json['id'],
        status: json['status'] ?? 'PENDING',
        paymentStatus: json['paymentStatus'] ?? 'PENDING',
        paymentMethod: json['paymentMethod'] ?? 'COD',
        subtotal: (json['subtotal'] as num).toDouble(),
        deliveryCharge: (json['deliveryCharge'] as num).toDouble(),
        discount: (json['discount'] as num).toDouble(),
        total: (json['total'] as num).toDouble(),
        items: (json['items'] as List? ?? []).map((i) => OrderItem.fromJson(i)).toList(),
        createdAt: DateTime.parse(json['createdAt']),
      );
}
