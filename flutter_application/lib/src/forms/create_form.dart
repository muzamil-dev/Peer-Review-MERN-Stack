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
  int numFields = 0;
  List<Field> fields = [];
  List<TextEditingController> questionControllers = [];
  List<TextEditingController> valueControllers = [];

  TextEditingController availableFromController = TextEditingController();
  TextEditingController dueUntillController = TextEditingController();
  TextEditingController formName = TextEditingController();

  List<Widget> _widgetTabOptions(BuildContext context) {
    return <Widget>[editFormsPage(context), studentViewPage(context)];
  }

  void createForm() {
    Field child = Field(question: '', value: '');
    setState(() {
      fields.add(child);
      questionControllers.add(TextEditingController());
      valueControllers.add(TextEditingController());
    });
  }

  Future<void> _selectDate(TextEditingController controller) async {
    DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2024),
      lastDate: DateTime(2100),
    );

    if (picked != null) {
      setState(() {
        controller.text = picked.toString().split(" ")[0];
      });
    }
  }

  Widget editFormsPage(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: SingleChildScrollView(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Padding(
              padding: const EdgeInsets.all(18),
              child: Column(
                children: [
                  Form(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Form Name
                        const Text(
                          "Form Name",
                          style: TextStyle(fontSize: 25),
                        ),
                        const SizedBox(height: 5),
                        TextFormField(
                          controller: formName,
                          decoration: const InputDecoration(
                            labelText: 'Form Name',
                            filled: true,
                          ),
                        ),
                        const SizedBox(
                          height: 15,
                        ),
                        TextFormField(
                          controller: availableFromController,
                          decoration: const InputDecoration(
                            labelText: 'Available From',
                            filled: true,
                            prefixIcon: Icon(Icons.calendar_today),
                          ),
                          readOnly: true,
                          onTap: () {
                            _selectDate(availableFromController);
                          },
                        ),
                        const SizedBox(
                          height: 15,
                        ),
                        TextFormField(
                          controller: dueUntillController,
                          decoration: const InputDecoration(
                            labelText: 'Available Untill',
                            filled: true,
                            prefixIcon: Icon(Icons.calendar_month_outlined),
                          ),
                          readOnly: true,
                          onTap: () {
                            _selectDate(dueUntillController);
                          },
                        ),
                        const SizedBox(
                          height: 15,
                        ),
                        // Form Settings

                        // Form Fields (ListView Builder)
                        const Text(
                          'Fields',
                          style: TextStyle(fontSize: 25),
                        ),
                        formFields(context),
                        // Available from Untill
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: createForm,
        child: const Icon(Icons.add),
      ),
      floatingActionButtonLocation:
          FloatingActionButtonLocation.miniCenterFloat,
    );
  }

  Widget formFields(BuildContext context) {
    return SizedBox(
      height: 425,
      child: Scrollbar(
        child: ListView.separated(
          itemBuilder: (context, index) {
            return formChild(context, index);
          },
          separatorBuilder: (BuildContext context, index) => const Divider(
            height: 15,
            thickness: 0,
          ),
          itemCount: fields.length,
        ),
      ),
    );
  }

  Widget formChild(BuildContext context, index) {
    return Container(
        key: UniqueKey(),
        decoration: BoxDecoration(
          color: Color.fromARGB(255, 233, 228, 228),
          border: Border.all(
            width: 2,
            color: Colors.black,
          ),
        ),
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            TextFormField(
              controller: questionControllers[index],
              decoration: const InputDecoration(
                labelText: 'Name',
                filled: true,
              ),
            ),
            TextFormField(
              controller: valueControllers[index],
              decoration: const InputDecoration(
                labelText: 'Value',
                filled: true,
              ),
            ),
            const SizedBox(
              height: 10,
            ),
            IconButton(
                onPressed: () {
                  print(fields[index].question);
                  setState(() {
                    fields.removeAt(index);
                    valueControllers.removeAt(index);
                    questionControllers.removeAt(index);
                  });
                },
                icon: const Icon(
                  CupertinoIcons.delete,
                  color: Colors.white,
                ),
                style: IconButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                )),
          ],
        ));
  }

  Widget studentViewPage(BuildContext context) {
    return const Column(
      children: [Center(child: const Text("Student View Page"))],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Create Form',
                style: TextStyle(color: Colors.white),
              ),
              IconButton(
                onPressed: () => print('Field 2: ${fields[1].question}'),
                icon: const Icon(
                  Icons.check,
                  color: Colors.white,
                ),
                style: IconButton.styleFrom(backgroundColor: Colors.green),
              ),
            ],
          ),
          iconTheme: const IconThemeData(color: Colors.white),
          backgroundColor: const Color(0xff004080),
        ),
        body: _widgetTabOptions(context).elementAt(_currentIndex),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          type: BottomNavigationBarType.fixed,
          items: const [
            BottomNavigationBarItem(
                icon: Icon(Icons.calendar_today_rounded), label: 'Add Form'),
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

class Field {
  String question;
  String value;

  Field({required this.question, required this.value});
}
