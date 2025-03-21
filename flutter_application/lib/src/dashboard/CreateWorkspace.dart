import 'package:flutter/material.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'dart:convert';

class CreateWorkspace extends StatefulWidget {
  static const routeName = "/createWorkspace";
  final int userId;

  const CreateWorkspace({super.key, required this.userId});

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
        const SnackBar(content: Text('Error creating workspace')),
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
          title: Row(
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SvgPicture.asset(
                'assets/images/RMP_Icon.svg',
                width: 35,
                height: 35,
              ),
              const Text(
                'Create Workspace',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF004080),
          centerTitle: true,
          iconTheme:
              const IconThemeData(color: Colors.white), // Center the title
        ),
        body: Container(
          decoration: const BoxDecoration(
            color: Color(0xFF004080),
          ),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const SizedBox(height: 40),
              Row(
                mainAxisAlignment: MainAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.fromLTRB(5.0, 0, 0, 0),
                    child: const Text(
                      "Enter Workspace Details:",
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Container(
                margin: const EdgeInsets.only(bottom: 10.0),
                child: TextField(
                  controller: nameController,
                  decoration: InputDecoration(
                      hintText: 'Workspace Name',
                      hintStyle: const TextStyle(fontSize: 17),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: BorderSide.none),
                      fillColor: Colors.white,
                      filled: true,
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide:
                            const BorderSide(color: Colors.blue, width: 3),
                      )),
                ),
              ),
              Container(
                margin: const EdgeInsets.only(bottom: 10.0),
                child: TextField(
                  controller: domainController,
                  decoration: InputDecoration(
                      hintText: 'Allowed Domains',
                      hintStyle: const TextStyle(fontSize: 17),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: BorderSide.none),
                      fillColor: Colors.white,
                      filled: true,
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide:
                            const BorderSide(color: Colors.blue, width: 3),
                      )),
                ),
              ),
              Container(
                margin: const EdgeInsets.only(bottom: 10.0),
                child: TextField(
                  controller: numGroupsController,
                  decoration: InputDecoration(
                      hintText: 'Number of Groups',
                      hintStyle: const TextStyle(fontSize: 17),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: BorderSide.none),
                      fillColor: Colors.white,
                      filled: true,
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide:
                            const BorderSide(color: Colors.blue, width: 3),
                      )),
                ),
              ),
              Container(
                margin: const EdgeInsets.only(bottom: 10.0),
                child: TextField(
                  controller: maxGroupSizeController,
                  decoration: InputDecoration(
                      hintText: 'Max Group Size',
                      hintStyle: const TextStyle(fontSize: 17),
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(18),
                          borderSide: BorderSide.none),
                      fillColor: Colors.white,
                      filled: true,
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(18),
                        borderSide:
                            const BorderSide(color: Colors.blue, width: 3),
                      )),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  if (nameController.text.isNotEmpty) {
                    createWorkspace(context);
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Please fill in the workspace name')),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                child: const Text(
                  'Create Workspace',
                  style: TextStyle(color: Colors.white, fontSize: 18),
                ),
              ),
            ],
          ),
        ));
  }
}
