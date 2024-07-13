import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_application/core.services/api.dart';
import 'package:flutter_application/src/dashboard/user_dashboard.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';
import 'dart:convert';
import 'CreateWorkspace.dart';
import 'package:flutter_application/src/groups/adminGroups.dart';

class AdminDashboard extends StatefulWidget {
  static const routeName = "/adminDashboard";
  final dynamic token;
  const AdminDashboard({@required this.token, super.key});

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
      print('Error fetching workspaces: $error');
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
          token: widget.token,
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
          title: const Text('Join Workspace'),
          content: TextField(
            controller: inviteCodeController,
            decoration: const InputDecoration(labelText: 'Invite Code'),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                joinWorkspace(inviteCodeController.text);
                Navigator.pop(context);
              },
              child: const Text('Join'),
            ),
          ],
        );
      },
    );
  }

  Future<void> joinWorkspace(String inviteCode) async {
    final url = Uri.parse('http://10.0.2.2:5000/workspaces/join');

    try {
      final response = await apiInstance.api.put(
        '/workspaces/join',
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
      print('Error joining workspace: $err');
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
            token: widget.token,
            workspaceId: workspaceId,
            userId: userId,
          ),
        ),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              UserDashboard(token: widget.token, workspaceId: workspaceId),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Home',
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
        color: const Color(0xFF004080), // Set background color
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : ListView.builder(
                itemCount: workspaces.length,
                itemBuilder: (context, index) {
                  return WorkspaceCard(
                    token: widget.token,
                    workspace: workspaces[index],
                    onTap: navigateToGroupPage,
                    userId: userId,
                  );
                },
              ),
      ),
      bottomNavigationBar: SizedBox(
        height: 60,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: navigateToCreateWorkspacePage,
              tooltip: 'Add Workspace',
            ),
            IconButton(
              icon: const Icon(Icons.input),
              onPressed: showJoinWorkspaceDialog,
              tooltip: 'Join Workspace',
            ),
          ],
        ),
      ),
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
  final dynamic token;
  final int userId;

  const WorkspaceCard(
      {required this.workspace,
      required this.token,
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
    final url = Uri.parse('http://10.0.2.2:5000/workspaces/setInvite');

    try {
      final response = await apiInstance.api.put(
        '/workspaces/setInvite',
        data: jsonEncode({
          'userId': widget.userId,
          'workspaceId': widget.workspace.workspaceId,
        }),
      );
      if (response.statusCode == 200) {
      } else {
        print("Create Invite Code Unsuccessful");
      }
    } catch (error) {
      print("Error Creating Invite Code: $error");
    }
  }

  Future<Object> getWorkspaceInfo(BuildContext context) async {
    final url = Uri.parse(
        "http://10.0.2.2:5000/workspaces/${widget.workspace.workspaceId}");

    try {
      final response = await apiInstance.api
          .get('/workspaces/${widget.workspace.workspaceId}');

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
            title: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const SizedBox(width: 28.0),
                const Center(
                    child: Text(
                  "Invite Code",
                  style: TextStyle(fontSize: 24.0),
                )),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(
                    Icons.close_sharp,
                    color: Colors.black,
                    size: 28.0,
                  ),
                )
              ],
            ),
            content: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  inviteCode,
                  style: const TextStyle(
                    fontSize: 22.0,
                    fontWeight: FontWeight.bold,
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
                children: [
                  Text(
                    widget.workspace.name,
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  addMemberButton(context),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                'Role: ${widget.workspace.role}',
                style: const TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
