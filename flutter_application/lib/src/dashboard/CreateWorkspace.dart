import 'package:flutter/material.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'dart:convert';

class CreateWorkspace extends StatefulWidget {
  static const routeName = "/createWorkspace";
  final int userId;

  CreateWorkspace({required this.userId});

  @override
  _CreateWorkspaceState createState() => _CreateWorkspaceState();
}

class _CreateWorkspaceState extends State<CreateWorkspace> {
  final TextEditingController nameController = TextEditingController();
  final TextEditingController domainController = TextEditingController();
  final TextEditingController numGroupsController = TextEditingController();
  final TextEditingController maxGroupSizeController = TextEditingController();
  final apiInstance = Api();
  final storage = const FlutterSecureStorage();

  Future<void> createWorkspace(BuildContext context) async {
    const url = '/workspaces/create';

    try {
      final allowedDomains = domainController.text.isEmpty
          ? <String>[]
          : domainController.text
              .split(',')
              .map((domain) => domain.trim())
              .toList()
              .cast<String>();

      if (!validateDomains(allowedDomains)) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text(
                  'Invalid domain format. Only letters and periods are allowed.')),
        );
        return;
      }
      print("User Id: ${widget.userId}");
      final response = await apiInstance.api.post(
        url,
        data: jsonEncode({
          'name': nameController.text,
          'allowedDomains': domainController.text.isEmpty
              ? []
              : domainController.text
                  .split(',')
                  .map((domain) => domain.trim())
                  .toList(),
          'userId': widget.userId,
          'numGroups': numGroupsController.text.isNotEmpty
              ? int.parse(numGroupsController.text)
              : null,
          'groupMemberLimit': maxGroupSizeController.text.isNotEmpty
              ? int.parse(maxGroupSizeController.text)
              : null,
        }),
      );

      if (response.statusCode == 201) {
        Navigator.pop(context, true); // Return true to indicate success
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Workspace created successfully')),
        );
      } else {
        final errorData = response.data;
        print("Status Code: ${response.statusCode}");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error creating workspace: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error creating workspace')),
      );
    }
  }

  bool validateDomains(List<String> domains) {
    final regex = RegExp(r'^[a-zA-Z.]+$');
    for (var domain in domains) {
      if (!regex.hasMatch(domain)) {
        return false;
      }
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text(
            'Create',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ), // Change text color here
          ),
          backgroundColor: const Color(0xFF004080),
          centerTitle: true, // Center the title
        ),
        body: Container(
          //color: Colors.white,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(labelText: 'Workspace Name'),
                ),
                TextField(
                  //color
                  controller: domainController,
                  decoration: InputDecoration(
                      labelText: 'Allowed Domains (comma separated)'),
                ),
                TextField(
                  controller: numGroupsController,
                  decoration: InputDecoration(labelText: 'Number of Groups'),
                  keyboardType: TextInputType.number,
                ),
                TextField(
                  controller: maxGroupSizeController,
                  decoration: InputDecoration(labelText: 'Max Group Size'),
                  keyboardType: TextInputType.number,
                ),
                SizedBox(height: 20),
                ElevatedButton(
                  onPressed: () {
                    if (nameController.text.isNotEmpty) {
                      createWorkspace(context);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                            content: Text('Please fill in the workspace name')),
                      );
                    }
                  },
                  child: Text('Create Workspace'),
                ),
              ],
            ),
          ),
        ));
  }
}
