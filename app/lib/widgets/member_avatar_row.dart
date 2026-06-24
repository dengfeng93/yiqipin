import 'package:flutter/material.dart';

class MemberAvatarRow extends StatelessWidget {
  final List<String> avatars;
  final int count;

  const MemberAvatarRow(
      {super.key, required this.avatars, required this.count});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        ...avatars.take(4).map((url) => Padding(
              padding: const EdgeInsets.only(right: 4),
              child: CircleAvatar(radius: 12, backgroundImage: NetworkImage(url)),
            )),
        if (count > 4)
          CircleAvatar(
              radius: 12,
              backgroundColor: Colors.grey[300],
              child: Text('+${count - 4}',
                  style: const TextStyle(fontSize: 10))),
      ],
    );
  }
}
