import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './FormsPageAdmin.css'; 
import {jwtDecode} from 'jwt-decode';
import Api from './Api.js';

const ViewFormsAdminPage = () => {
    const [forms, setForms] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentForm, setCurrentForm] = useState(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        startDate: '',
        dueDate: '',
        questions: [],
        description: ''
    });

    const navigate = useNavigate();
    const { workspaceId } = useParams(); // Assuming workspaceId is passed as a URL parameter

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login'); // Redirect to login if token is not available
            return null;
        }
        const decodedToken = jwtDecode(token);
        return decodedToken.userId;
    }

    useEffect(() => {
        const fetchForms = async () => {
            const userId = getCurrentUserId();
            if (!userId) return;

            const response = await Api.Workspace.GetAssignments(workspaceId);
            if (response.status === 200) {
                setForms(response.data); // Assuming response.data contains the list of assignments/forms
            } else {
                console.error('Failed to fetch forms:', response.message);
            }
        };

        fetchForms();
    }, [workspaceId]);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredForms = forms.filter(form =>
        form.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFormClick = (formId) => {
        navigate(`/create/${formId}`);
    }

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
        const response = await Api.Assignments.EditAssignment(
            userId,
            currentForm.assignmentId,
            workspaceId,
            name,
            new Date(startDate).getTime(),
            new Date(dueDate).getTime(),
            questions.filter(q => q.trim() !== ''), // Ensure no empty questions
            description
        );

        if (response.success) {
            alert('Form updated successfully!');
            setIsEditModalOpen(false);
            setForms(forms.map(form => form.assignmentId === currentForm.assignmentId ? { ...form, ...editFormData } : form));
        } else {
            console.error('Failed to update form:', response.message);
            alert('Failed to update form.');
        }
    };

    const handleDeleteForm = async (assignmentId) => {
        const userId = getCurrentUserId();
        if (!userId) return;

        const response = await Api.Assignments.DeleteAssignment(assignmentId, userId);

        if (response.success) {
            alert('Form deleted successfully!');
            setForms(forms.filter(form => form.assignmentId !== assignmentId));
        } else {
            console.error('Failed to delete form:', response.message);
            alert('Failed to delete form.');
        }
    };

    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setCurrentForm(null);
    };

    return (
        <div className="view-forms-admin-page">
            <div className="header-container">
                <input
                    type="text"
                    placeholder="Search for Form"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                />
                <button className="create-form-button" onClick={handleCreateForm}>
                    + Form
                </button>
            </div>
            <div className="forms-containerz">
                <h2>Forms</h2>
                {filteredForms.length > 0 ? (
                    filteredForms.map(form => (
                        <div key={form.assignmentId} className="form-item-container">
                            <div className="form-item" onClick={() => handleFormClick(form.assignmentId)}>
                                {form.name}
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
                            <div className="form-groupz">
                                <label>Questions</label>
                                {editFormData.questions.map((question, index) => (
                                    <div key={index} className="question-group">
                                        <input
                                            type="text"
                                            value={question}
                                            onChange={(e) => handleQuestionChange(index, e.target.value)}
                                            className="form-control"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-danger mt-2 mb-2"
                                            onClick={() => handleRemoveQuestion(index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={handleAddQuestion}
                                >
                                    Add Question
                                </button>
                            </div>
                            <button type="submit" className="btn btn-success mt-0">Save Changes</button>
                            <button type="button" className="btn btn-danger mt-2" onClick={handleCloseEditModal}>Cancel</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViewFormsAdminPage;
