import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './FormsPageAdmin.css';
import { jwtDecode } from 'jwt-decode';
import Api from './Api.js';
import { useSnackbar } from 'notistack';

const ViewFormsAdminPage = () => {
    const [forms, setForms] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentForm, setCurrentForm] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        startDate: '',
        dueDate: '',
        questions: [],
        description: ''
    });
    const { enqueueSnackbar } = useSnackbar();

    const navigate = useNavigate();
    const { workspaceId } = useParams(); // Assuming workspaceId is passed as a URL parameter

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate(''); // Redirect to login if token is not available
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    }

    useEffect(() => {
        const fetchForms = async () => {
            const userId = getCurrentUserId();
            if (!userId) return;

            const response = await Api.Workspaces.GetAssignments(workspaceId);
            if (response.status === 200) {
                setForms(response.data); // Assuming response.data contains the list of assignments/forms
                //await fetchAnalyticsForAssignments(response.data);
            } else {
                console.error('Failed to fetch forms:', response.message);
                enqueueSnackbar(`Failed to fetch forms: ${response.message}`, { variant: 'error' });
            }
        };

        fetchForms();
    }, [workspaceId]);

    // const fetchAnalyticsForAssignments = async (assignments) => {
    //     const userId = getCurrentUserId();
    //     if (!userId) return;

    //     const assignmentsWithRatings = await Promise.all(assignments.map(async (assignment) => {
    //         const response = await Api.Analytics.GetAnalyticsForAssignment(assignment.assignmentId, userId, 1, 1);
    //         if (response.status === 200 && response.data.length > 0) {
    //             return { ...assignment, averageRating: response.data[0].averageRating };
    //         } else {
    //             console.error(`Failed to fetch analytics for assignment ${assignment.assignmentId}:`, response.message);
    //             return assignment;
    //         }
    //     }));

    //     setForms(assignmentsWithRatings);
    // };

    const handleCreateForm = () => {
        navigate(`/createForm/${workspaceId}`);
    };

    const handleEditForm = (form) => {
        setCurrentForm(form);
        setEditFormData({
            name: form.name,
            startDate: form.startDate,
            dueDate: form.dueDate,
            questions: form.questions,
            description: form.description
        });
        setIsEditModalOpen(true);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleQuestionChange = (index, value) => {
        const updatedQuestions = [...editFormData.questions];
        updatedQuestions[index] = value;
        setEditFormData(prevState => ({
            ...prevState,
            questions: updatedQuestions
        }));
    };

    const handleAddQuestion = () => {
        setEditFormData(prevState => ({
            ...prevState,
            questions: [...prevState.questions, '']
        }));
    };

    const handleRemoveQuestion = (index) => {
        const updatedQuestions = editFormData.questions.filter((_, i) => i !== index);
        setEditFormData(prevState => ({
            ...prevState,
            questions: updatedQuestions
        }));
    };

    const handleEditFormSubmit = async (e) => {
        e.preventDefault();
        const userId = getCurrentUserId();
        if (!userId) return;

        const { name, startDate, dueDate, questions, description } = editFormData;

        // Check if the old due date is in the past
        const now = new Date();
        const oldDueDate = new Date(currentForm.dueDate);
        const newDueDate = new Date(dueDate);

        if (oldDueDate < now && newDueDate > now) {
            enqueueSnackbar('You cannot extend the due date for an assignment that has already passed.', { variant: 'error' });
            return;
        }

        const response = await Api.Assignments.EditAssignment(
            userId,
            currentForm.assignmentId,
            workspaceId,
            name,
            new Date(startDate).getTime(),
            newDueDate.getTime(),
            questions.filter(q => q.trim() !== ''), // Ensure no empty questions
            description
        );

        if (response.success) {
            enqueueSnackbar('Form updated successfully!', { variant: 'success' });
            setIsEditModalOpen(false);
            setForms(forms.map(form => form.assignmentId === currentForm.assignmentId ? { ...form, ...editFormData } : form));
        } else {
            if (response.message === "Cannot modify start date because the assignment has already been started") {
                enqueueSnackbar('Cannot modify start date because the assignment has already been started.', { variant: 'error' });
            } else {
                console.error('Failed to update form:', response.message);
                enqueueSnackbar(`Failed to update form: ${response.message}`, { variant: 'error' });
            }
        }
    };

    const handleDeleteForm = async (assignmentId) => {
        const userId = getCurrentUserId();
        if (!userId) return;

        const response = await Api.Assignments.DeleteAssignment(assignmentId, userId);

        if (response.success) {
            enqueueSnackbar('Form deleted successfully!', { variant: 'success' });
            setForms(forms.filter(form => form.assignmentId !== assignmentId));
        } else {
            console.error('Failed to delete form:', response.message);
            enqueueSnackbar(`Failed to delete form: ${response.message}`, { variant: 'error' });
        }
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setCurrentForm(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        navigate('/');
    }

    return (
        <div className="view-forms-admin-page">
            <nav className="navbar">
                <a className="navbar-brand" href="/DashboardPage">Rate My Peer</a>
                <ul className="navbar-links">
                    <li><a href="/DashboardPage">Workspaces</a></li>
                    <li><button onClick={handleLogout} className="btn-danger btn">Logout</button></li>
                </ul>
            </nav>

            <div className="header-container">
                <button className="create-form-button" onClick={handleCreateForm}>
                    + Assign Form
                </button>
                <button className="btn btn-outline-primary btn-md" onClick={() => navigate(`/groups/${workspaceId}`)}>Back</button>
            </div>
            <div className="forms-containerz">
                <h2>Assignments</h2>
                {forms.length > 0 ? (
                    forms.map(form => (
                        <div key={form.assignmentId} className="form-item-container">
                            <div className="form-item">
                                {form.name} <br />
                                <small>Start Date: {new Date(form.startDate).toLocaleDateString()}</small><br />
                                <small>Due Date: {new Date(form.dueDate).toLocaleDateString()}</small><br />
                                {typeof form.averageRating === 'number' && (
                                    <small>Average Rating: {form.averageRating.toFixed(2)}</small>
                                )}
                            </div>
                            <button
                                className="edit-form-button btn btn-success mt-0"
                                onClick={() => handleEditForm(form)}
                            >
                                Edit
                            </button>
                            <button
                                className="delete-form-button btn btn-danger mt-0 ml-2"
                                onClick={() => handleDeleteForm(form.assignmentId)}
                            >
                                Delete
                            </button>
                        </div>
                    ))
                ) : (
                    <p>No forms available</p>
                )}
            </div>

            {isEditModalOpen && (
                <div className="edit-modal">
                    <div className="edit-modal-content">
                        <h2>Edit Form</h2>
                        <form onSubmit={handleEditFormSubmit}>
                            <div className="form-groupz">
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={editFormData.name}
                                    onChange={handleEditFormChange}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-groupz">
                                <label>Start Date</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={new Date(editFormData.startDate).toISOString().split('T')[0]}
                                    onChange={handleEditFormChange}
                                    className="form-control"
                                    disabled={currentForm.started} // Disable if the assignment has started
                                />
                            </div>
                            <div className="form-groupz">
                                <label>Due Date</label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    value={new Date(editFormData.dueDate).toISOString().split('T')[0]}
                                    onChange={handleEditFormChange}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-groupz mb-0">
                                <label>Questions</label>
                                {editFormData.questions.map((question, index) => (
                                    <div key={index} className="question-group mb-0">
                                        <input
                                            type="text"
                                            value={question}
                                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                                            className="form-control"
                                            disabled={currentForm.started} // Disable if the assignment has started
                                        />
                                        {!currentForm.started && ( // Hide the remove button if the assignment has started
                                            <button
                                                type="button"
                                                className="btn btn-danger customBtn mt-2 mb-2"
                                                onClick={() => handleRemoveQuestion(index)}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="23"
                                                    height="23"
                                                    fill="currentColor"
                                                    className="bi bi-trash3-fill"
                                                    viewBox="0 0 16 16"
                                                    style={{ marginRight: '0px' }}
                                                >
                                                    <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {!currentForm.started && ( // Hide the add question button if the assignment has started
                                    <div className="d-flex justify-content-center">
                                        <button
                                            type="button"
                                            className="btn btn-primary customBtns"
                                            onClick={handleAddQuestion}
                                        >
                                            Add Question
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="d-flex justify-content-center mt-3">
                                <button type="submit" className="btn btn-success customBtns mx-2">Save Changes</button>
                                <button type="button" className="btn btn-danger customBtns mx-2" onClick={handleCloseEditModal}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewFormsAdminPage;
