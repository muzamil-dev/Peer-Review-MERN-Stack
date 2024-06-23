import 'package:flutter/material.dart';

class UserGroup extends StatelessWidget {
  final String workspaceId;
  static const routeName = '/userGroups';


  const UserGroup({required this.workspaceId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Group'),
      ),
      body: Center(
        child: Text('User Group Page for workspace ID: $workspaceId'),
      ),
    );
  }
}
