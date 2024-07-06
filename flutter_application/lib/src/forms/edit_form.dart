//TODO: ADD DESIGN AND SETTINGS OPTION

import "package:flutter/material.dart";
import "package:flutter/cupertino.dart";
import "package:http/http.dart" as http;
import 'package:intl/intl.dart';
import 'package:flutter_rating_bar/flutter_rating_bar.dart';
import "dart:convert";

class EditForm extends StatefulWidget {
  static const routeName = '/editForm';
  final int userId;
  final int assignmentId;
  final int workspaceId;

  const EditForm(
      {required this.userId,
      required this.assignmentId,
      required this.workspaceId,
      super.key});

  @override
  State<EditForm> createState() => _EditFormState();
}

class _EditFormState extends State<EditForm> {
  int _currentIndex = 0;
  int numFields = 0;
  List<TextEditingController> valueControllers = [];
  List<String> addFormPageErrors = [];
  final _formKey = GlobalKey<FormState>();

  TextEditingController availableFromController = TextEditingController();
  TextEditingController dueUntillController = TextEditingController();
  TextEditingController formName = TextEditingController();

  @override
  void initState() {
    super.initState();
    getAssignmentData();
  }

  List<Widget> _widgetTabOptions(BuildContext context) {
    return <Widget>[editFormsPage(context), studentViewPage(context)];
  }

  Future<void> getAssignmentData() async {
    final url =
        Uri.parse('http://10.0.2.2:5000/assignments/${widget.assignmentId}');
    try {
      final response = await http.get(url);

      if (response.statusCode == 200) {
        print("Succesfully Got Assignment!");
        final jsonResponse = json.decode(response.body);
        setState(() {
          for (String question in jsonResponse['questions']) {
            valueControllers.add(TextEditingController(text: question));
          }
          // Slices Strings to Not include Extraneous info other than date
          availableFromController.text =
              getDateString(jsonResponse['startDate'].substring(0, 10));
          dueUntillController.text =
              getDateString(jsonResponse['dueDate'].substring(0, 10));

          formName.text = jsonResponse['name'];
          numFields = valueControllers.length;
        });
      }
    } catch (error) {
      print("Error Getting Assignmnet: $error");
    }
  }

  Future<void> editAssignment(BuildContext context) async {
    final url = Uri.parse('http://10.0.2.2:5000/assignments/edit');
    List<String> questions = [];

    for (var controller in valueControllers) {
      questions.add(controller.text);
    }

    try {
      final response = await http.put(
        url,
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          "userId": widget.userId,
          "workspaceId": widget.workspaceId,
          "assignmentId": widget.assignmentId,
          "name": formName.text,
          "startDate": availableFromController.text,
          "dueDate": dueUntillController.text,
          "questions": questions,
        }),
      );

      if (response.statusCode == 200) {
        print("Succesfully Edited Assignment!");
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Edited Form Successfully!')));
        // Route Back To Admin Page
        Navigator.pop(context);
      } else if (response.statusCode == 400) {
        final jsonResponse = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(jsonResponse["message"])));
      }
    } catch (error) {
      print("Error Editing Assignment: $error");
    }
  }

  void addFormField() {
    setState(() {
      numFields += 1;
      valueControllers.add(TextEditingController());
    });
  }

  String getDateString(String date) {
    // Parse the input date string
    DateTime dateTime = DateTime.parse(date);

    // Define the desired date format
    DateFormat dateFormat = DateFormat("MM/dd/yy");

    // Format the DateTime object to the desired string format
    String formattedDate = dateFormat.format(dateTime);

    return formattedDate;
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
        controller.text = getDateString(picked.toString().split(" ")[0]);
      });
    }
  }

  bool isValidForm(GlobalKey key) {
    if (_formKey.currentState!.validate() == false) {
      print("Validation Failed!");
      return false;
    }

    if (valueControllers.isEmpty) {
      return false;
    }
    return true;
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
                              "Form Info",
                              style: TextStyle(
                                  fontSize: 25, fontWeight: FontWeight.bold),
                            ),
                            TextButton(
                              onPressed: () async {
                                if (isValidForm(_formKey) == false) {
                                  ScaffoldMessenger.of(context)
                                      .showSnackBar(const SnackBar(
                                    content: Text(
                                        'Edit Form Failed: \nLook at Student View Page for Errors'),
                                  ));
                                  return;
                                }

                                List<String> questions = [];
                                for (var field in valueControllers) {
                                  questions.add(field.text);
                                }
                                await editAssignment(context);
                              },
                              style: TextButton.styleFrom(
                                backgroundColor: Colors.green,
                              ),
                              child: const Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  Text(
                                    "Edit Form",
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
                            border: OutlineInputBorder(),
                            hintText: "Enter Your Form Name",
                            labelText: "Form Name",
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
                            border: OutlineInputBorder(),
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
                            border: OutlineInputBorder(),
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
                              style: TextStyle(
                                  fontSize: 25, fontWeight: FontWeight.bold),
                            ),
                            IconButton(
                              onPressed: addFormField,
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
    if (numFields == 0) {
      return displayEmptyWidget(context);
    } else {
      return SizedBox(
        height: 400,
        child: RawScrollbar(
          thumbColor: Colors.black,
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
  }

  Widget formChild(BuildContext context, index) {
    return Container(
        decoration: BoxDecoration(
          color: const Color.fromARGB(255, 255, 255, 255),
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
                border: OutlineInputBorder(),
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

  Widget invalidFormPage(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            "Fix these in the Edit Form Page:",
            style: TextStyle(fontSize: 26.0, fontWeight: FontWeight.bold),
          ),
          const SizedBox(
            height: 15.0,
          ),
          SizedBox(
            height: 150,
            child: ListView.builder(
              itemCount: addFormPageErrors.length,
              itemBuilder: (context, index) {
                return Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        const SizedBox(width: 40),
                        // Bullet Point Container
                        Container(
                          decoration: const BoxDecoration(
                            color: Colors.black,
                            shape: BoxShape.circle,
                          ),
                          width: 7,
                          height: 7,
                        ),
                        const SizedBox(
                          width: 10,
                        ),
                        Text(
                          addFormPageErrors[index],
                          style: const TextStyle(fontSize: 18),
                        ),
                      ],
                    ),
                    const SizedBox(
                      height: 10.0,
                    )
                  ],
                );
              },
            ),
          )
        ],
      ),
    );
  }

  Widget studentViewPage(BuildContext context) {
    if (invalidFormFields()) {
      return invalidFormPage(context);
    } else {
      return Padding(
        padding: const EdgeInsets.all(10.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title of Assignment
            Container(
              margin: const EdgeInsets.fromLTRB(3.0, 0, 0, 0),
              child: Text(
                formName.text,
                style: const TextStyle(
                    fontSize: 35.0, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(
              height: 20,
            ),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: Colors.black, width: 3),
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.all(10.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  const Text(
                    "Due: ",
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    dueUntillController.text,
                    style: const TextStyle(
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(
                    width: 15,
                  ),
                  const Text(
                    "Questions: ",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    "${valueControllers.length}",
                    style: const TextStyle(
                      fontSize: 18,
                    ),
                  ),
                  const SizedBox(
                    width: 15,
                  ),
                  const Text(
                    "Status: ",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const CircleAvatar(
                    radius: 15,
                    backgroundColor: Colors.red,
                    child: IconButton(
                      onPressed: null,
                      icon: Icon(
                        Icons.close_outlined,
                        color: Colors.white,
                        size: 15,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(
              height: 20,
            ),
            Expanded(
                child: RawScrollbar(
              thumbColor: Colors.black,
              child: ListView.separated(
                  itemBuilder: (context, index) {
                    return Container(
                      decoration: BoxDecoration(
                          border: Border.all(color: Colors.black, width: 1)),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "Question ${index + 1}",
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 25,
                            ),
                          ),
                          const SizedBox(
                            height: 7,
                          ),
                          Text(
                            valueControllers[index].text,
                            style: const TextStyle(fontSize: 20),
                          ),
                          const SizedBox(
                            height: 15,
                          ),
                          RatingBar.builder(
                            initialRating: 0,
                            minRating: 0,
                            direction: Axis.horizontal,
                            allowHalfRating: false,
                            itemCount: 5,
                            itemPadding:
                                const EdgeInsets.symmetric(horizontal: 4.0),
                            itemBuilder: (context, _) => const Icon(
                              Icons.star,
                              color: Colors.amber,
                            ),
                            onRatingUpdate: (rating) {
                              print(rating);
                            },
                          ),
                        ],
                      ),
                    );
                  },
                  separatorBuilder: (context, index) {
                    return const Divider(
                      height: 10,
                      thickness: 0,
                    );
                  },
                  itemCount: valueControllers.length),
            )),
          ],
        ),
      );
    }
  }

  bool invalidFormFields() {
    // Outer Condition Prevents too many Additons of addFormPageErrors while changing tabs between Edit Form and Student View
    if (_currentIndex == 1) {
      if (formName.text == '') {
        addFormPageErrors.add("Empty Form Name: Enter a Name");
      }
      if (availableFromController.text == '') {
        addFormPageErrors.add("Empty Start Date: Enter a Start Date");
      }
      if (dueUntillController.text == '') {
        addFormPageErrors.add("Empty Due Date: Enter a Due Date");
      }

      if (valueControllers.isEmpty) {
        addFormPageErrors.add("Empty Fields: Add Atleast One Field");
      }
    }

    return addFormPageErrors.isNotEmpty;
  }

  Widget displayEmptyWidget(BuildContext context) {
    return const Center(
      child: Column(
        children: [
          SizedBox(height: 150),
          Text(
            "Press The + Button to Create Fields",
            style: TextStyle(
                color: Color.fromARGB(255, 110, 103, 103), fontSize: 16),
          ),
        ],
      ),
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
                'Edit Form Page',
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
                icon: Icon(Icons.calendar_today_rounded), label: 'Edit Form'),
            BottomNavigationBarItem(
              icon: Icon(CupertinoIcons.eyeglasses),
              label: 'Student View',
            ),
          ],
          onTap: (index) {
            setState(() {
              _currentIndex = index;

              if (_currentIndex == 0) {
                addFormPageErrors = [];
              }
            });
          },
        ));
  }
}
