// ignore_for_file: unnecessary_const

import 'dart:async';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_application/src/dashboard/user_dashboard.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'dart:convert';
import 'CreateWorkspace.dart';
import 'package:flutter_application/src/groups/adminGroups.dart';
import 'package:flutter_svg/flutter_svg.dart';

class AdminDashboard extends StatefulWidget {
  final String token;
  static const routeName = "/adminDashboard";
  const AdminDashboard({required this.token, super.key});

  @override
  _AdminDashboardState createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  List<Workspace> workspaces = [];
  bool isLoading = true;
  late int userId;
  final TextEditingController inviteCodeController = TextEditingController();
  final apiInstance = Api();
  final storage = const FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    Map<String, dynamic> jwtDecodedToken = JwtDecoder.decode(widget.token);
    userId = jwtDecodedToken['userId'];
    fetchWorkspaces();
  }

  Future<void> fetchWorkspaces() async {
    try {
      final response = await apiInstance.api.get(
        '/users/$userId/workspaces',
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;

        setState(() {
          workspaces =
              data.map((workspace) => Workspace.fromJson(workspace)).toList();
          isLoading = false;
        });

        //Navigator.pushNamed(context, '/createWorkspace');
      } else {
        throw Exception('Failed to load workspaces');
      }
    } catch (error) {
      setState(() {
        isLoading = false;
      });
    }
  }

  void navigateToCreateWorkspacePage() async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CreateWorkspace(
          userId: userId,
        ),
      ),
    );
    if (result == true) {
      fetchWorkspaces(); // Refresh workspaces after creation
    }
  }

  void showJoinWorkspaceDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Padding(
            padding: EdgeInsets.all(12.0),
            child: const Text(
              'Join Workspace',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 25),
            ),
          ),
          content: Container(
            padding: const EdgeInsets.all(12.0),
            child: TextField(
              controller: inviteCodeController,
              decoration: const InputDecoration(
                  labelText: 'Invite Code',
                  labelStyle: TextStyle(
                    fontSize: 20,
                    color: Colors.black,
                  ),
                  focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(color: Colors.black, width: 2))),
            ),
          ),
          actions: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                TextButton(
                  onPressed: () {
                    joinWorkspace(inviteCodeController.text);
                    Navigator.pop(context);
                  },
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.green,
                  ),
                  child: const Text(
                    'Join',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ),
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.red,
                  ),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  Future<void> joinWorkspace(String inviteCode) async {
    const url = '/workspaces/join';

    try {
      final response = await apiInstance.api.put(
        url,
        data: jsonEncode({
          'userId': userId,
          'inviteCode': inviteCode,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Workspace joined successfully')),
        );
        fetchWorkspaces(); // Refresh workspaces after joining
      } else {
        final errorData = response.data;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Error joining workspace')),
      );
    }
  }

  void navigateToGroupPage(int workspaceId, String role) {
    if (role == 'Instructor') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AdminGroup(
            workspaceId: workspaceId,
            userId: userId,
          ),
        ),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => UserDashboard(
            workspaceId: workspaceId,
            token: widget.token,
          ),
        ),
      );
    }
  }

  Widget displayAdminBody() {
    if (workspaces.isEmpty) {
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12.0),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12.0),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      "No Workspaces to Show",
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline),
                    ),
                    Text(
                      "Add or Join a Workspace to Get Started",
                      style: TextStyle(
                          fontSize: 18.0, fontWeight: FontWeight.w500),
                    )
                  ],
                ),
              ),
            ],
          )
        ],
      );
    } else {
      return Container(
        color: const Color(0xFF004080), // Set background color
        child: RawScrollbar(
          child: ListView.builder(
            itemCount: workspaces.length,
            itemBuilder: (context, index) {
              return WorkspaceCard(
                workspace: workspaces[index],
                onTap: navigateToGroupPage,
                userId: userId,
              );
            },
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        iconTheme: const IconThemeData(
          color: Colors.white,
        ),
        title: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SvgPicture.asset(
              'assets/images/RMP_Icon.svg',
              width: 35,
              height: 35,
            ),
            const SizedBox(width: 5),
            const Text(
              'Workspaces',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ), // Change text color here
            ),
          ],
        ),
        backgroundColor: const Color(0xFF004080), // Center the title
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : displayAdminBody(),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
            color: Colors.white, // Set background color
            // Set background color
            border: Border.all(
              color: const Color(0xFF004080), // Set background color
              // Set background color
            ),
            borderRadius: BorderRadius.circular(12.0)), // Set background color
        height: 80,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            IconButton(
              icon: const Column(
                children: [
                  Icon(
                    Icons.add_circle,
                    size: 42,
                    color: Colors.green,
                  ),
                  Text(
                    "Add Workspace",
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              onPressed: navigateToCreateWorkspacePage,
              tooltip: 'Add Workspace',
            ),
            IconButton(
              icon: const Column(
                children: [
                  Icon(
                    CupertinoIcons.square_arrow_right,
                    size: 42,
                    color: Colors.green,
                  ),
                  Text(
                    "Join Workspace",
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                ],
              ),
              onPressed: showJoinWorkspaceDialog,
              tooltip: 'Join Workspace',
            ),
          ],
        ),
      ),
      backgroundColor: const Color(0xFF004080), // Set background color
    );
  }
}

class Workspace {
  final int workspaceId;
  final String name;
  final String role;

  Workspace(
      {required this.workspaceId, required this.name, required this.role});

  factory Workspace.fromJson(Map<String, dynamic> json) {
    return Workspace(
      workspaceId: json['workspaceId'] ?? 'No ID',
      name: json['name'] ?? 'No name',
      role: json['role'] ?? 'No role',
    );
  }
}

class WorkspaceCard extends StatefulWidget {
  final Workspace workspace;
  final Function(int, String) onTap;
  final int userId;

  const WorkspaceCard(
      {required this.workspace,
      required this.onTap,
      required this.userId,
      super.key});

  @override
  State<WorkspaceCard> createState() => _WorkspaceCardState();
}

class _WorkspaceCardState extends State<WorkspaceCard> {
  final apiInstance = Api();
  final storage = const FlutterSecureStorage();
  String accessToken = '';
  @override
  void initState() {
    super.initState();
  }

  Future<void> createInviteCode(BuildContext context) async {
    const url = '/workspaces/setInvite';

    try {
      final response = await apiInstance.api.put(
        url,
        data: jsonEncode({
          'userId': widget.userId,
          'workspaceId': widget.workspace.workspaceId,
        }),
      );
      if (response.statusCode == 200) {
      } else {}
    } catch (error) {
      print("Error Creating Invite Code: $error");
    }
  }

  Future<Object> getWorkspaceInfo(BuildContext context) async {
    final url = "/workspaces/${widget.workspace.workspaceId}";

    try {
      final response = await apiInstance.api.get(url);

      if (response.statusCode == 200) {
        return response.data;
      }
    } catch (error) {
      print("Error Getting Workspace Info: $error");
    }
    return {};
  }

  Future<void> inviteDialog(BuildContext context) async {
    await createInviteCode(context);
    Map workspaceDetails = await getWorkspaceInfo(context) as Map;
    String inviteCode = workspaceDetails["inviteCode"];

    return showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: const Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Center(
                    child: Text(
                  "Invite Code",
                  style: TextStyle(fontSize: 28.0, fontWeight: FontWeight.w700),
                )),
              ],
            ),
            content: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  inviteCode,
                  style: const TextStyle(
                    fontSize: 22.0,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          );
        });
  }

  Widget addMemberButton(BuildContext context) {
    if (widget.workspace.role == 'Instructor') {
      return IconButton(
          onPressed: () {
            inviteDialog(context);
          },
          icon: const Icon(
            Icons.person_add_alt_1,
            color: Colors.black,
            size: 28,
          ));
    }
    return const SizedBox();
  }

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () =>
          widget.onTap(widget.workspace.workspaceId, widget.workspace.role),
      child: Card(
        margin: const EdgeInsets.all(10),
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Flexible(
                    child: Text(
                      widget.workspace.name,
                      style: const TextStyle(
                          fontSize: 24, fontWeight: FontWeight.bold),
                    ),
                  ),
                  addMemberButton(context),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                'Role: ${widget.workspace.role}',
                style: const TextStyle(fontSize: 18),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
