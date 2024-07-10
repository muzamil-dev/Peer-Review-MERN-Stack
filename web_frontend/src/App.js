import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap CSS
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import Example from './ApiExamples';
import CustomGroupsPage from './GroupsPage';  // Import the CustomGroupsPage component
import GroupsPageAdmin from './GroupsPageAdmin';  // Import the CustomGroupsPageAdmin component
import ApiExamples from './ApiExamples';
import FormsPageAdmin from './FormsPageAdmin';  // Import the FormsPageAdmin component
import CreateFormPage from './CreateFormPageAdmin'; // Import the CreateFormPage component

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/DashboardPage" element={<DashboardPage />} />
                    <Route path="/ApiExamples" element={<Example />} />
                    <Route path="/groups/:workspaceId" element={<CustomGroupsPage />} />
                    <Route path="/workspaces/:workspaceId/admin" element={<GroupsPageAdmin />} />
                    <Route path="/ApiExamples" element={<ApiExamples />} />
                    <Route path="/formsAdmin" element={<FormsPageAdmin />} />
                    <Route path="/createForm" element={<CreateFormPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
