import 'package:flutter_riverpod/flutter_riverpod.dart';

class LocationService {
  double? _lastLat;
  double? _lastLng;

  double? get lat => _lastLat;
  double? get lng => _lastLng;

  Future<({double lat, double lng})?> getCurrentLocation() async {
    // 高德定位 SDK 集成:
    // final location = await AmapLocation.getLocation();
    // _lastLat = location.latitude;
    // _lastLng = location.longitude;
    // return (lat: location.latitude, lng: location.longitude);

    // 开发环境使用默认位置（成都）
    _lastLat = 30.5728;
    _lastLng = 104.0668;
    return (lat: _lastLat!, lng: _lastLng!);
  }
}

final locationServiceProvider =
    Provider<LocationService>((ref) => LocationService());
