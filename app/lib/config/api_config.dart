class ApiConfig {
  static const baseUrl = 'http://10.0.2.2:3000/api/v1'; // Android 模拟器
  // static const baseUrl = 'https://yiqipin.cn/api/v1'; // 生产
  static const wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'ws://10.0.2.2:3000/chat',
  );
}
