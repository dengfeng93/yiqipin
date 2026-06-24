import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:yiqipin/models/circle.dart';
import 'package:yiqipin/widgets/circle_card.dart';

void main() {
  testWidgets('CircleCard shows title', (tester) async {
    await tester.pumpWidget(MaterialApp(
      home: CircleCard(
        circle: Circle(
          id: '1',
          creatorId: 'u1',
          categoryId: 'c1',
          title: '测试圈子',
          maxMembers: 10,
          startTime: DateTime.now(),
          startType: 'now',
          status: 'active',
          createdAt: DateTime.now(),
        ),
        onJoin: () {},
        onDetail: () {},
        onSkip: () {},
      ),
    ));
    expect(find.text('测试圈子'), findsOneWidget);
  });
}
