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
  List<TextEditingController> valueControllers = [];
  final _formKey = GlobalKey<FormState>();

  TextEditingController availableFromController = TextEditingController();
  TextEditingController dueUntillController = TextEditingController();
  TextEditingController formName = TextEditingController();

  List<Widget> _widgetTabOptions(BuildContext context) {
    return <Widget>[editFormsPage(context), studentViewPage(context)];
  }

  Future<void> createAssignment(
      BuildContext context, List<String> questions) async {
    final url = Uri.parse('http://10.0.2.2:5000/assignments/create');
    try {
      final response = await http.post(
        url,
        headers: {'Content-type': 'application/json'},
        body: jsonEncode({
          "userId": widget.userId,
          "workspaceId": widget.workspaceId,
          "startDate": availableFromController.text,
          "dueDate": dueUntillController.text,
          "questions": questions,
        }),
      );
      if (response.statusCode == 201) {
        print("Assignment Created Successfully");
        final jsonResponse = json.decode(response.body);
        print("Response : ${jsonResponse['message']}");
      } else {
        final errorData = json.decode(response.body);
        print("Error Creating Assignment: $errorData");
      }
    } catch (error) {
      print("Error Creating Assignment: $error");
    }
  }

  void createForm() {
    setState(() {
      numFields += 1;
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
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Form Name
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              "Form Name",
                              style: TextStyle(fontSize: 25),
                            ),
                            TextButton(
                              onPressed: () async {
                                if (_formKey.currentState!.validate() == false) {
                                  return;
                                }
                                List<String> questions = [];
                                for (var field in valueControllers) {
                                  questions.add(field.text);
                                }
                                await createAssignment(context, questions);
                                setState(() {
                                  formName.text = '';
                                  availableFromController.text = '';
                                  dueUntillController.text = '';
                                  valueControllers = [];
                                  numFields = 0;
                                });
                              },
                              style: TextButton.styleFrom(
                                backgroundColor: Colors.green,
                              ),
                              child: const Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Text(
                                    "Create Form",
                                    style: TextStyle(
                                        color: Colors.white, fontSize: 14),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 5),
                        TextFormField(
                          controller: formName,
                          decoration: const InputDecoration(
                            labelText: 'Form Name',
                            filled: true,
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return "Please enter a non-empty field";
                            }
                            return null;
                          },
                        ),
                        const SizedBox(
                          height: 15,
                        ),
                        TextFormField(
                          controller: availableFromController,
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return "Please enter a non-empty field";
                            }
                            return null;
                          },
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
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return "Please enter a non-empty field";
                            }
                            return null;
                          },
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
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Fields',
                              style: TextStyle(fontSize: 25),
                            ),
                            IconButton(
                              onPressed: createForm,
                              icon: const Icon(
                                Icons.add,
                                color: Colors.white,
                              ),
                              style: IconButton.styleFrom(
                                  backgroundColor: Colors.green),
                            ),
                          ],
                        ),
                        const SizedBox(height: 5),
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
          itemCount: numFields,
        ),
      ),
    );
  }

  Widget formChild(BuildContext context, index) {
    return Container(
        decoration: BoxDecoration(
          color: Color.fromARGB(255, 255, 255, 255),
          border: Border.all(
            width: 2,
            color: Colors.black,
          ),
          borderRadius: BorderRadius.circular(5),
        ),
        padding: const EdgeInsets.all(10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              "Question ${index + 1}",
              style: const TextStyle(fontSize: 25),
            ),
            const SizedBox(height: 10),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                    onPressed: () {
                      setState(() {
                        numFields -= 1;
                        valueControllers.removeAt(index);
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
            ),
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
          title: const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Create Form',
                style: TextStyle(color: Colors.white),
              ),
              // Submits and Resets Form
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
