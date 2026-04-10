/// Abstraction for checking network connectivity.
///
/// Provides a simple interface to check if the device has an active
/// network connection before making API calls.
abstract class NetworkInfo {
  /// Returns `true` if the device is connected to the internet.
  Future<bool> get isConnected;
}

/// Default implementation that always returns true.
///
/// In a production app, this would use a package like `connectivity_plus`
/// to check actual network status. This placeholder avoids adding
/// an extra dependency while providing the abstraction layer.
class NetworkInfoImpl implements NetworkInfo {
  @override
  Future<bool> get isConnected async => true;
}
