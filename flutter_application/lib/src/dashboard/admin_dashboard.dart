import 'package:flutter/material.dart';
import 'package:flutter_application/components/main_app_bar.dart';

class AdminDashboard extends StatelessWidget {
  static const routeName = "/adminDashboard";

  // Example list of classes
  final List<Class> classes = [
    Class(name: 'POOSD', description: 'Something about OOP? I think idk'),
    Class(
        name: 'Senior Design',
        description: 'Everyone else can do the work for me'),
    Class(
        name: 'Discrete Structures',
        description: 'Some kind of math or something'),
    Class(name: 'History 404', description: 'As if we would take history'),
  ];

  AdminDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const MainAppBar(
        title: 'Admin Dashboard',
      ),
      body: ListView.builder(
        itemCount: classes.length,
        itemBuilder: (context, index) {
          return ClassCard(classes[index]);
        },
      ),
      bottomNavigationBar: BottomAppBar(
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            IconButton(
              icon: Icon(Icons.reorder),
              onPressed: () {},
              tooltip: 'Reorder Classes',
            ),
            IconButton(
              icon: Icon(Icons.add),
              onPressed: () {},
              tooltip: 'Add Class',
            ),
          ],
        ),
      ),
    );
  }
}

class Class {
  final String name;
  final String description;

  Class({required this.name, required this.description});
}

class ClassCard extends StatelessWidget {
  final Class classInfo;

  const ClassCard(this.classInfo, {super.key});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.all(10),
      child: Padding(
        padding: EdgeInsets.all(15),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              classInfo.name,
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 10),
            Text(
              classInfo.description,
              style: TextStyle(fontSize: 16),
            ),
          ],
        ),
      ),
    );
  }
}
