import 'package:flutter/material.dart';
import 'package:flutter_application/components/main_app_bar.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AdminDashboard extends StatefulWidget {
  static const routeName = "/adminDashboard";

  @override
  _AdminDashboardState createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  List<Workspace> workspaces = [];
  bool isLoading = true;
  final String userId = '6671c8362ffea49f3018bf61'; // Replace with the actual user ID

  @override
  void initState() {
    super.initState();
    fetchWorkspaces();
  }

  Future<void> fetchWorkspaces() async {
    final url = Uri.parse('http://10.0.2.2:5000/users/6671c8362ffea49f3018bf61/workspaces');
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        setState(() {
          workspaces = data.map((workspace) => Workspace.fromJson(workspace)).toList();
          isLoading = false;
        });
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const MainAppBar(
        title: 'Admin Dashboard',
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: workspaces.length,
              itemBuilder: (context, index) {
                return WorkspaceCard(workspaces[index]);
              },
            ),
      bottomNavigationBar: BottomAppBar(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            IconButton(
              icon: const Icon(Icons.reorder),
              onPressed: () {},
              tooltip: 'Reorder Workspaces',
            ),
            IconButton(
              icon: const Icon(Icons.add),
              onPressed: () {},
              tooltip: 'Add Workspace',
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

  Workspace({required this.workspaceId, required this.name, required this.role});

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

  const WorkspaceCard(this.workspace, {super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(10),
      child: Padding(
        padding: const EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              workspace.name,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text(
              'Role: ${workspace.role}',
              style: const TextStyle(fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }
}
