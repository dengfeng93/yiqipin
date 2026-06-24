import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class PrivacyPage extends StatelessWidget {
  const PrivacyPage({super.key});

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('隐私政策')),
        body: const WebView(
          initialUrl: 'https://yiqipin.cn/privacy.html',
          javascriptMode: JavascriptMode.unrestricted,
        ),
      );
}
