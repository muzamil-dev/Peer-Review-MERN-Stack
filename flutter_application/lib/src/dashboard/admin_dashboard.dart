import 'package:flutter/material.dart';
import 'package:flutter/widgets.dart';
import 'package:http/http.dart' as http;
import 'package:jwt_decoder/jwt_decoder.dart';
import 'dart:convert';
import 'CreateWorkspace.dart';
import 'package:flutter_application/src/groups/adminGroups.dart';
import 'package:flutter_application/src/groups/userGroups.dart';

class AdminDashboard extends StatefulWidget {
  static const routeName = "/adminDashboard";
  final token;
  const AdminDashboard({@required this.token, super.key});

  @override
  _AdminDashboardState createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  List<Workspace> workspaces = [];
  bool isLoading = true;
  late String userId;
  final TextEditingController inviteCodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    fetchWorkspaces();
    Map<String, dynamic> jwtDecodedToken = JwtDecoder.decode(widget.token);
    userId = jwtDecodedToken['userId'];
  }

  Future<void> fetchWorkspaces() async {
    final url = Uri.parse(
        'http://10.0.2.2:5000/users/6671c8362ffea49f3018bf61/workspaces');
    try {
      final response = await http.get(url);
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        
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
        builder: (context) => CreateWorkspace(userId: userId),
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
          title: Text('Join Workspace'),
          content: TextField(
            controller: inviteCodeController,
            decoration: InputDecoration(labelText: 'Invite Code'),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: Text('Cancel'),
            ),
            TextButton(
              onPressed: () {
                joinWorkspace(inviteCodeController.text);
                Navigator.pop(context);
              },
              child: Text('Join'),
            ),
          ],
        );
      },
    );
  }

  Future<void> joinWorkspace(String inviteCode) async {
    final url = Uri.parse('http://10.0.2.2:5000/workspaces/join');
    try {
      final response = await http.put(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'userId': userId,
          'inviteCode': inviteCode,
        }),
      );
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Workspace joined successfully')),
        );
        fetchWorkspaces(); // Refresh workspaces after joining
      } else {
        final errorData = json.decode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${errorData['message']}')),
        );
      }
    } catch (err) {
      print('Error joining workspace: $err');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error joining workspace')),
      );
    }
  }

  void navigateToGroupPage(String workspaceId, String role) {
    if (role == 'Instructor') {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AdminGroup(workspaceId: workspaceId, userId: userId,),
        ),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => UserGroup(workspaceId: workspaceId, userId: userId),
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
            ? Center(child: CircularProgressIndicator())
            : ListView.builder(
                itemCount: workspaces.length,
                itemBuilder: (context, index) {
                  return WorkspaceCard(
                    workspace: workspaces[index],
                    onTap: navigateToGroupPage,
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
  final String workspaceId;
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

class WorkspaceCard extends StatelessWidget {
  final Workspace workspace;
  final Function(String, String) onTap;

  const WorkspaceCard({required this.workspace, required this.onTap, Key? key})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onTap(workspace.workspaceId, workspace.role),
      child: Card(
        margin: const EdgeInsets.all(10),
        child: Padding(
          padding: const EdgeInsets.all(15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                workspace.name,
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              Text(
                'Role: ${workspace.role}',
                style: const TextStyle(fontSize: 16),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
