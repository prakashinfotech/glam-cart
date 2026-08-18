class Address {
  final int id;
  final String name;
  final String phone;
  final String line1;
  final String? line2;
  final String city;
  final String state;
  final String pincode;
  final String type;
  final bool isDefault;

  Address({
    required this.id,
    required this.name,
    required this.phone,
    required this.line1,
    this.line2,
    required this.city,
    required this.state,
    required this.pincode,
    required this.type,
    required this.isDefault,
  });

  factory Address.fromJson(Map<String, dynamic> json) => Address(
        id: json['id'],
        name: json['name'],
        phone: json['phone'],
        line1: json['line1'],
        line2: json['line2'],
        city: json['city'],
        state: json['state'],
        pincode: json['pincode'],
        type: json['type'] ?? 'HOME',
        isDefault: json['isDefault'] ?? false,
      );

  String get fullAddress => '$line1${line2 != null ? ', $line2' : ''}, $city, $state - $pincode';
}
