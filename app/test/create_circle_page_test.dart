import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:yiqipin/pages/create_circle_page.dart';

void main() {
  testWidgets('CreateCirclePage renders step 1 category grid',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: CreateCirclePage()),
    );

    expect(find.byType(GridView), findsOneWidget);
    expect(find.byIcon(Icons.sports_basketball), findsOneWidget);
  });

  testWidgets('CreateCirclePage navigates through 3 steps',
      (tester) async {
    await tester.pumpWidget(
      const MaterialApp(home: CreateCirclePage()),
    );

    await tester.tap(find.byIcon(Icons.sports_basketball));
    await tester.pumpAndSettle();
    expect(find.text('准备时间'), findsOneWidget);
    expect(find.text('活动地点'), findsOneWidget);

    await tester.tap(find.text('下一步'));
    await tester.pumpAndSettle();
    expect(find.text('确认发布'), findsOneWidget);
  });
}
