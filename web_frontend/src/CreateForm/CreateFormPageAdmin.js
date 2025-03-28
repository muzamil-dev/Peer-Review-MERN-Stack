import React, { useState } from 'react';
import styles from './CreateFormPage.module.css';
import Api from '../Api.js';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';

const CreateFormPage = () => {
    const [formName, setFormName] = useState('');
    const [fields, setFields] = useState([{ name: '', value: '' }]);
    const [availableFrom, setAvailableFrom] = useState('');
    const [availableUntil, setAvailableUntil] = useState('');
    const navigate = useNavigate();
    const { workspaceId } = useParams(); // Assuming workspaceId is passed as a URL parameter
    const { enqueueSnackbar } = useSnackbar();

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/'); // Redirect to login if token is not available
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
        if (fields.length > 1) {
            const values = [...fields];
            values.splice(index, 1);
            setFields(values);
        } else {
            enqueueSnackbar('There must be at least one question.', { variant: 'error' });
        }
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
            enqueueSnackbar('User not authenticated', { variant: 'error' });
            return;
        }

        const startDate = new Date(availableFrom).getTime(); // Convert to epoch time
        const dueDate = new Date(availableUntil).getTime(); // Convert to epoch time

        if (dueDate < startDate) {
            enqueueSnackbar('Due date cannot be before the start date.', { variant: 'error' });
            return;
        }

        const questions = fields.map(field => field.name);

        if (questions.length === 0 || questions.some(question => question.trim() === '')) {
            enqueueSnackbar('There must be at least one question.', { variant: 'error' });
            return;
        }

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
            enqueueSnackbar('Form created successfully!', { variant: 'success' });
            navigate(`/formsAdmin/${workspaceId}`); // Adjust the redirect URL as needed
        } else {
            console.error('Failed to create form:', response.message);
            enqueueSnackbar('Failed to create form.', { variant: 'error' });
        }
    };

    return (
        <div className={styles.createFormPage}>
            
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label className={styles.bold}>Assignment</label>
                    <input
                        // Assignment name must be filled out
                        required
                        type="text"
                        value={formName}
                        onChange={handleFormNameChange}
                        className={styles.formControl}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.bold}>Fields</label>
                    {fields.map((field, index) => (
                        <div key={index} className={styles.fieldGroup}>
                            <input
                                required
                                type="text"
                                placeholder={`Question ${index + 1}`}
                                name="name"
                                value={field.name}
                                onChange={event => handleFieldChange(index, event)}
                                className={styles.formControl}
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveField(index)}
                                className={`btn btn-danger ${styles.removeButton}`}
                                disabled={fields.length === 1}
                            >
                                Delete
                            </button>
                            <button type="button" onClick={handleAddField} className={`btn btn-primary ${styles.addButton}`}>
                                + Add Field
                            </button>
                        </div>
                    ))}
                </div>
                
                <div className='row'> 
                    <label className={`col-6 ${styles.bold}`}>Available from</label>
                    <label className={`col-6 ${styles.bold}`}>Until</label>
                </div>
                <div className='row'>
                    <div className={`col-6 ${styles.formGroup}`}>
                        <input
                            type="date"
                            name="availableFrom"
                            value={availableFrom}
                            onChange={handleDateChange}
                            className={`.text-dark ${styles.formControl}`}
                        />
                    </div>
                    <div className={`col-6 ${styles.formGroup}`}>
                        <input
                            type="date"
                            name="availableUntil"
                            value={availableUntil}
                            onChange={handleDateChange}
                            className={styles.formControl}
                        />
                    </div>
                </div>
                <button type="submit" className="btn btn-success">Save Form</button>
            </form>
            <button className="btn btn-light mb-3 mt-4" onClick={() => navigate(`/formsAdmin/${workspaceId}`)}>Back</button>
        </div>
    );
};

export default CreateFormPage;
