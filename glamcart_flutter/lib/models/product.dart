class Product {
  final int id;
  final String name;
  final String slug;
  final String? description;
  final double price;
  final double? mrp;
  final List<String> images;
  final String? brand;
  final String? category;
  final double? rating;
  final int? reviewCount;
  final bool featured;
  final bool bestseller;
  final int stock;

  Product({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    required this.price,
    this.mrp,
    required this.images,
    this.brand,
    this.category,
    this.rating,
    this.reviewCount,
    required this.featured,
    required this.bestseller,
    required this.stock,
  });

  factory Product.fromJson(Map<String, dynamic> json) => Product(
        id: json['id'],
        name: json['name'],
        slug: json['slug'],
        description: json['description'],
        price: (json['price'] as num).toDouble(),
        mrp: json['mrp'] != null ? (json['mrp'] as num).toDouble() : null,
        images: List<String>.from(json['images'] ?? []),
        brand: json['brand']?['name'],
        category: json['category']?['name'],
        rating: json['rating'] != null ? (json['rating'] as num).toDouble() : null,
        reviewCount: json['reviewCount'],
        featured: json['featured'] ?? false,
        bestseller: json['bestseller'] ?? false,
        stock: json['stock'] ?? 0,
      );

  int get discount => mrp != null && mrp! > price ? ((mrp! - price) / mrp! * 100).round() : 0;
  String get firstImage => images.isNotEmpty ? images[0] : '';
}
