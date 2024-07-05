import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

class StudentReview extends StatelessWidget {
  static const routeName = '/studentReview';
  final int userId;
  final int targetUserId;
  const StudentReview({required this.userId, required this.targetUserId, super.key});


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("Student Review Page"),
      ),
      body: null,
    );
  }
}