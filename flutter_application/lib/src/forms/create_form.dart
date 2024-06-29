import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/widgets.dart';

class CreateForm extends StatelessWidget {
  static const routeName = '/createForm';
  final String userId;
  final String workspaceId;
  final String groupID;
  const CreateForm({required this.userId, required this.groupID, required this.workspaceId, super.key});

  @override
  Widget build(BuildContext context) {
    return const Placeholder();
  }
}