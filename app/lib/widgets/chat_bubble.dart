import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ChatBubble extends StatelessWidget {
  final Map<String, dynamic> msg;
  final bool isMe;

  const ChatBubble({super.key, required this.msg, required this.isMe});

  @override
  Widget build(BuildContext context) {
    final isSystem = msg['type'] == 'system';
    final isImage = msg['type'] == 'image';
    final isRecalled = msg['recall_snapshot'] != null;

    if (isSystem) {
      return Center(
          child: Padding(
        padding: const EdgeInsets.all(8),
        child: Text(msg['content'] ?? '',
            style: const TextStyle(color: Colors.grey, fontSize: 12)),
      ));
    }

    if (isRecalled) {
      return Align(
        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Text('[消息已撤回]',
              style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)),
        ),
      );
    }

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isMe ? Colors.orange : Colors.grey[200],
          borderRadius: BorderRadius.circular(12),
        ),
        child: isImage
            ? ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: CachedNetworkImage(
                  imageUrl: msg['image_url'] ?? '',
                  width: 200,
                  fit: BoxFit.cover,
                  placeholder: (_, __) =>
                      const SizedBox(width: 200, height: 150, child: Center(child: CircularProgressIndicator())),
                ),
              )
            : Text(msg['content'] ?? ''),
      ),
    );
  }
}
