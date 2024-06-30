import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/widgets.dart';

class CreateForm extends StatefulWidget {
  static const routeName = '/createForm';
  final String userId;
  final String workspaceId;
  const CreateForm(
      {required this.userId, required this.workspaceId, super.key});

  @override
  State<CreateForm> createState() => _CreateFormState();
}

class _CreateFormState extends State<CreateForm> {
  int _currentIndex = 0;
  

  List<Widget> _getTabOptions() {
    return <Widget>[
      editFormsPage(),
      studentViewPage()
    ];
  }

  Widget editFormsPage() {
    return const Column(
      children: [
        Center(child: Text("Edit Forms Page")),
      ],
    );
  }

  Widget studentViewPage() {
    return const Column(
      children: [
        Center(child: const Text("Student View Page"))
      ],
    );
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Row(
            children: [
              Text(
                'Create Form',
                style: TextStyle(color: Colors.white),
              ),
              IconButton(onPressed: null, icon: Icon(Icons.check)),
            ],
          ),
          iconTheme: const IconThemeData(color: Colors.white),
          backgroundColor: const Color(0xff004080),
        ),
        body: _getTabOptions().elementAt(_currentIndex),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
                icon: Icon(Icons.edit_calendar), 
                label: 'Edit Form'
            ),
            BottomNavigationBarItem(
              icon: Icon(CupertinoIcons.eyeglasses),
              label: 'Student View',
            ),
          ],
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
        ));
  }
}
