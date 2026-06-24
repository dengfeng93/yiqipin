import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yiqipin/pages/chat_page.dart';

void main() {
  testWidgets('ChatPage shows message list', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: ChatPage(circleId: 'test-circle-1')),
    );

    expect(find.byType(ListView), findsOneWidget);
    expect(find.byType(TextField), findsOneWidget);
    expect(find.byIcon(Icons.send), findsOneWidget);
  });

  testWidgets('ChatPage shows quick emoji bar on long press',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: ChatPage(circleId: 'test-circle-1')),
    );

    await tester.longPress(find.byIcon(Icons.send));
    await tester.pumpAndSettle();

    expect(find.text('👍'), findsOneWidget);
    expect(find.text('❤️'), findsOneWidget);
  });
}
