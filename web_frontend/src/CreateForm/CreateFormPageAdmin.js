import React, { useState } from 'react';
import styles from './CreateFormPage.module.css';
import Api from '../Api.js';
import { jwtDecode } from 'jwt-decode';
import { useNavigate, useParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
// Ensure Font Awesome is imported
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';

const CreateFormPage = () => {
    const [formName, setFormName] = useState('');
    const [fields, setFields] = useState([{ name: '', value: '' }]);
    const [availableFrom, setAvailableFrom] = useState('');
    const [availableUntil, setAvailableUntil] = useState('');
    const navigate = useNavigate();
    const { workspaceId } = useParams(); 
    const { enqueueSnackbar } = useSnackbar();

    const getCurrentUserId = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/'); 
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

        const startDate = new Date(availableFrom).getTime();
        const dueDate = new Date(availableUntil).getTime();

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
            'Description' 
        );

        if (response.success) {
            enqueueSnackbar('Form created successfully!', { variant: 'success' });
            navigate(`/formsAdmin/${workspaceId}`);
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
                                <FontAwesomeIcon icon={faTrash} />
                            </button>
                            <button 
                                type="button" 
                                onClick={handleAddField} 
                                className={`btn btn-primary ${styles.addButton}`}>
                                <FontAwesomeIcon icon={faPlus} />
                            </button>
                        </div>
                    ))}
                </div>
    
                <div className={styles.formGroup}>
                    <label className={styles.bold}>Available from</label>
                    <input
                        type="date"
                        name="availableFrom"
                        value={availableFrom}
                        onChange={handleDateChange}
                        className={styles.formControl}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.bold}>Until</label>
                    <input
                        type="date"
                        name="availableUntil"
                        value={availableUntil}
                        onChange={handleDateChange}
                        className={styles.formControl}
                    />
                </div>
                
                <button type="submit" className={`btn btn-success mt-3 ${styles.saveForm}`}>Save Form</button>
            </form>
            <button className="btn btn-dark mb-3 mt-3" onClick={() => navigate(`/formsAdmin/${workspaceId}`)}>Back</button>
        </div>
    );
};

export default CreateFormPage;
