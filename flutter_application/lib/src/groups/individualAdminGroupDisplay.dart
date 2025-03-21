import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class IndividualAdminGroup extends StatefulWidget {
  final String groupId;

  const IndividualAdminGroup({super.key, required this.groupId});

  static const routeName = "/individualAdminGroup";

  @override
  State<IndividualAdminGroup> createState() => _IndividualAdminGroupState();
}

class _IndividualAdminGroupState extends State<IndividualAdminGroup> {
  String groupName = '';
  List<Member> members = [];

  @override
  void initState() {
    super.initState();
    fetchGroup();
    fetchComments();
  }

  Future<void> fetchComments() async {
    final groupDetailsUrl = Uri.parse(
        'http://10.0.2.2:5000/reviews/group/${widget.groupId}/reviews');
    try {
      final response = await http.get(groupDetailsUrl);
      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        setState(() {});

        print(response.body);
      } else {
        throw Exception('Failed to load workspace details');
      }
    } catch (error) {
      print('Error fetching workspace details: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to load group reviews')),
      );
    }
  }

  Future<void> fetchGroup() async {
    final groupDetailsUrl =
        Uri.parse('http://10.0.2.2:5000/groups/${widget.groupId}');
    try {
      final response = await http.get(groupDetailsUrl);
      if (response.statusCode == 200) {
        final responseData = json.decode(response.body);
        setState(() {
          groupName = responseData['name'];
          members = (responseData['members'] as List<dynamic>)
              .map((member) => Member.fromJson(member))
              .toList();
        });
      } else {
        throw Exception('Failed to load workspace details');
      }
    } catch (error) {
      print('Error fetching workspace details: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Failed to load group details')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Text(
            groupName.isEmpty ? 'Loading...' : groupName,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          backgroundColor: const Color(0xFF004080),
          centerTitle: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.edit, color: Colors.white),
              onPressed: () {},
            ),
          ],
        ),
        body: Column(children: [
          const Text("Members"),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                children: members.map((member) {
                  return ListTile(
                    title: Text('${member.firstName} ${member.lastName}'),
                    trailing: IconButton(
                      icon: const Icon(Icons.edit),
                      onPressed: () {},
                    ),
                  );
                }).toList(),
              ),
            ],
          )
        ]));
  }
}

class Member {
  String userId;
  String firstName;
  String lastName;

  Member(
      {required this.userId, required this.firstName, required this.lastName});

  factory Member.fromJson(Map<String, dynamic> json) {
    return Member(
      userId: json['userId'],
      firstName: json['firstName'],
      lastName: json['lastName'],
    );
  }
}
