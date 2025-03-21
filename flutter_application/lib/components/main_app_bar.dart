import "package:flutter/material.dart";

class MainAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final Color backgroundColor;

  const MainAppBar({
    required this.title,
    this.backgroundColor = const Color(0xFF004080), // Default color if not provided
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title),
      backgroundColor: backgroundColor,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}
