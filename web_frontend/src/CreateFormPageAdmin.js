import React, { useState } from 'react';
import './CreateFormPage.module.css';

const CreateFormPage = () => {
    const [formName, setFormName] = useState('');
    const [fields, setFields] = useState([{ name: '', value: '' }]);
    const [availableFrom, setAvailableFrom] = useState('');
    const [availableUntil, setAvailableUntil] = useState('');

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

    const handleSubmit = (e) => {
        e.preventDefault();
        // form submission logic
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
                    <label>Options</label>
                    <div className="options">
                        <div>
                            <input type="checkbox" />
                            <label> Do not display in user dashboard until available</label>
                        </div>
                        <div>
                            <input type="checkbox" />
                            <label> Do not display in user dashboard after deadline</label>
                        </div>
                        <div>
                            <input type="checkbox" />
                            <label> Do not display comment text box at the end of the form</label>
                        </div>
                    </div>
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
                            <input
                                type="text"
                                placeholder={`Value ${index + 1}`}
                                name="value"
                                value={field.value}
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
