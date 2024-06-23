import 'package:flutter/material.dart';

class AdminGroup extends StatelessWidget {
  final String workspaceId;
  static const routeName = '/adminGroups';


  AdminGroup({required this.workspaceId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Admin Group'),
      ),
      body: Center(
        child: Text('Admin Group Page for workspace ID: $workspaceId'),
      ),
    );
  }
}