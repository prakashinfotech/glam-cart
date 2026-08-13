import 'product.dart';

class CartItem {
  final int id;
  final Product product;
  int quantity;

  CartItem({required this.id, required this.product, required this.quantity});

  factory CartItem.fromJson(Map<String, dynamic> json) => CartItem(
        id: json['id'],
        product: Product.fromJson(json['product']),
        quantity: json['quantity'],
      );

  double get total => product.price * quantity;
}
