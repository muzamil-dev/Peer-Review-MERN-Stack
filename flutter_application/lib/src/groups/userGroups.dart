import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;


class UserGroup extends StatefulWidget {
  final String workspaceId;
  static const routeName = '/userGroups';

  const UserGroup({required this.workspaceId});

  @override
  State<UserGroup> createState() => _UserGroupState();
}

class _UserGroupState extends State<UserGroup> {
  
  List<dynamic> groups= [];

  @override
  void initState() {
    super.initState();
    getGroupsData(context, '667a22ad8f5ce812352bba01');
  }

  Future<void> getGroupsData(BuildContext context, String workspaceId) async {
    final url = Uri.parse('http://10.0.2.2:5000/workspaces/$workspaceId/groups');
    try {
      final response = await http.get(url);
      if (response.statusCode == 200) {
        setState(() {
          groups = json.decode(response.body);
        });
        print(groups);
      }
    }
    catch (error) {
      print("Error fetching groups: $error");
    }
    
  }

  Widget loadStudentsInGroup(BuildContext context, index) {
    var currentGroup = groups[index];
    List<dynamic> members = List<dynamic>.from(currentGroup['members']);
    print(members);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: members
          .map((member) {
            String fullName = member['firstName'] + ' ' + member['lastName'];
            return Text(
                fullName,
                style: const TextStyle(
                  fontSize: 17.0,
                  color: Color.fromARGB(204, 255, 255, 255),
                ),
              );
          }
            )
          .toList(),
    );
  }

  Widget groupCards(BuildContext context, index) {

    var currentGroup = groups[index];
    var numMembers = currentGroup['members'].length.toString();

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xff004080),
        border: Border.all(
          width: 2,
          color: Colors.black,
        ),
        borderRadius: BorderRadius.circular(10),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.5),
            blurRadius: 4,
            offset: const Offset(0, 8), // changes position of shadow
          ),
        ],
      ),
      padding: const EdgeInsets.all(18.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Group #${index + 1}",
                style: const TextStyle(
                  fontSize: 30.0,
                  color: Color.fromARGB(204, 255, 255, 255),
                ),
              ),
              Text(
                "$numMembers/3",
                style: TextStyle(
                  fontSize: 17.0,
                  color: Color.fromARGB(204, 255, 255, 255),
                ),
              ),
            ],
          ),
          const SizedBox(
            height: 20,
          ),
          loadStudentsInGroup(context, index),
          const SizedBox(
            height: 20,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextButton(
                  onPressed: null,
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.green,
                  ),
                  child: const Padding(
                    padding: EdgeInsets.fromLTRB(8.0, 0, 8.0, 0),
                    child: Text("Join",
                        style: TextStyle(
                          color: Colors.white,
                        )),
                  )),
              const SizedBox(
                width: 20,
              ),
              TextButton(
                  onPressed: null,
                  style: TextButton.styleFrom(
                    backgroundColor: Colors.red,
                  ),
                  child: const Padding(
                    padding: EdgeInsets.fromLTRB(8.0, 0, 8.0, 0),
                    child: Text("Leave",
                        style: TextStyle(
                          color: Colors.white,
                        )),
                  )),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[200],
      appBar: AppBar(
        backgroundColor: const Color(0xff004080),
        iconTheme: const IconThemeData(
          color: Colors.white,
        ),
        title: const Text(
          'Groups',
          style: TextStyle(
            color: Colors.white,
          ),
        ),
      ),
      body: ListView.separated(
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.all(8.0),
            child: groupCards(context, index),
          );
        },
        separatorBuilder: (context, index) {
          return const Divider(
            height: 10,
            thickness: 0,
          );
        },
        itemCount: groups.length,
      ),
      floatingActionButton: const FloatingActionButton(
        onPressed: null,
        backgroundColor: Colors.green,
        child: Icon(
          Icons.check,
          color: Colors.white,
        ),
      ),
    );
  }
}
