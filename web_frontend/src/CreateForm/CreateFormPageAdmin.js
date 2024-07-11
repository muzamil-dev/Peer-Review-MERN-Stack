import React, { useState } from 'react';
import './CreateFormPage.module.css';
import Api from '../Api.js';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';


const CreateFormPage = () => {
    const [formName, setFormName] = useState('');
    const [fields, setFields] = useState([{ name: '', value: '' }]);
    const [availableFrom, setAvailableFrom] = useState('');
    const [availableUntil, setAvailableUntil] = useState('');
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

    const handleFormNameChange = (e) => {
        setFormName(e.target.value);
    };

    const handleFieldChange = (index, event) => {
        const values = [...fields];
        values[index][event.target.name] = event.target.value;
        setFields(values);
    };

    const handleAddField = () => {
        setFields([...fields, { name: '', value: '' }]);
    };

    const handleRemoveField = (index) => {
        const values = [...fields];
        values.splice(index, 1);
        setFields(values);
    };

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        if (name === 'availableFrom') {
            setAvailableFrom(value);
        } else {
            setAvailableUntil(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userId = getCurrentUserId();
        if (!userId) {
            return;
        }

        const questions = fields.map(field => field.name);
        const startDate = new Date(availableFrom).getTime(); // Convert to epoch time
        const dueDate = new Date(availableUntil).getTime(); // Convert to epoch time

        const response = await Api.Assignments.CreateAssignment(
            userId,
            workspaceId,
            formName,
            startDate,
            dueDate,
            questions,
            'Description' // Replace with actual description if needed
        );

        if (response.success) {
            // Handle success (e.g., show a success message, redirect to another page, etc.)
            alert('Form created successfully!');
            navigate(`/formsAdmin/${workspaceId}`); // Adjust the redirect URL as needed
        } else {
            // Handle error (e.g., show an error message)
            console.error('Failed to create form:', response.message);
            alert('Failed to create form.');
        }
    };

    return (
        <div className="create-form-page">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Form Name</label>
                    <input
                        type="text"
                        value={formName}
                        onChange={handleFormNameChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Fields</label>
                    {fields.map((field, index) => (
                        <div key={index} className="field-group">
                            <input
                                type="text"
                                placeholder={`Name ${index + 1}`}
                                name="name"
                                value={field.name}
                                onChange={event => handleFieldChange(index, event)}
                                className="form-control"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveField(index)}
                                className="btn btn-danger"
                            >
                                Delete item
                            </button>
                        </div>
                    ))}
                    <button type="button" onClick={handleAddField} className="btn btn-primary">
                        + Add Field
                    </button>
                </div>
                <div className="form-group">
                    <label>Available from</label>
                    <input
                        type="date"
                        name="availableFrom"
                        value={availableFrom}
                        onChange={handleDateChange}
                        className="form-control"
                    />
                </div>
                <div className="form-group">
                    <label>Until</label>
                    <input
                        type="date"
                        name="availableUntil"
                        value={availableUntil}
                        onChange={handleDateChange}
                        className="form-control"
                    />
                </div>
                <button type="submit" className="btn btn-success">Save Form</button>
            </form>
        </div>
    );
};

export default CreateFormPage;
