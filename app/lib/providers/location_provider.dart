import 'package:flutter_riverpod/flutter_riverpod.dart';

class LocationState {
  final double? lat;
  final double? lng;
  final String? address;
  final bool loading;
  LocationState({this.lat, this.lng, this.address, this.loading = false});
}

class LocationNotifier extends StateNotifier<LocationState> {
  LocationNotifier() : super(LocationState());

  Future<void> getCurrentLocation() async {
    state = LocationState(loading: true);
    // 高德定位 SDK 集成
    // final location = await AmapLocation.getLocation();
    // state = LocationState(lat: location.latitude, lng: location.longitude);
    state = LocationState(lat: 30.5728, lng: 104.0668);
  }

  void updateLocation(double lat, double lng) {
    state = LocationState(lat: lat, lng: lng);
  }
}

final locationProvider =
    StateNotifierProvider<LocationNotifier, LocationState>(
        (ref) => LocationNotifier());
