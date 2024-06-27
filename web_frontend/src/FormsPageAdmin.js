import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FormsPageAdmin.css'; // Make sure to create this CSS file

const ViewFormsAdminPage = () => {
    const [forms, setForms] = useState([
        { id: 1, name: 'Form 1' },
        { id: 2, name: 'Form 2' },
        { id: 3, name: 'Form 3' },
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredForms = forms.filter(form =>
        form.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleFormClick = (formId) => {
        navigate(`/create/${formId}`); // Update the path as needed
    };

    const handleCreateForm = () => {
        navigate('/create'); // Update the path as needed
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
            <div className="forms-container">
                <h2>Forms</h2>
                {filteredForms.length > 0 ? (
                    filteredForms.map(form => (
                        <div
                            key={form.id}
                            className="form-item"
                            onClick={() => handleFormClick(form.id)}
                        >
                            {form.name}
                        </div>
                    ))
                ) : (
                    <p>No forms available</p>
                )}
            </div>
        </div>
    );
};

export default ViewFormsAdminPage;
