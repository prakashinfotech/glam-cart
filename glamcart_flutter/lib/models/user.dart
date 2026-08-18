class User {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String role;

  User({required this.id, required this.name, required this.email, this.phone, required this.role});

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'],
        name: json['name'],
        email: json['email'],
        phone: json['phone'],
        role: json['role'] ?? 'USER',
      );
}
