import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap CSS
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import Example from './ApiExamples';
import CustomGroupsPage from './GroupsPage';  // Import the CustomGroupsPage component
import CustomGroupsPageAdmin from './GroupsPageAdmin';  // Import the CustomGroupsPageAdmin component
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
                    <Route path="/groups/:workspaceId" element={<CustomGroupsPage />} />  // Add the route for CustomGroupsPage
                    <Route path="/groupsAdmin/:workspaceId" element={<CustomGroupsPageAdmin />} />  // Add the route for CustomGroupsPageAdmin
                    <Route path="/ApiExamples" element={<ApiExamples />} />
                    <Route path="/formsAdmin" element={<FormsPageAdmin />} />  // Add the route for FormsPageAdmin
                    <Route path="/create" element={<CreateFormPage />} /> // Add the route for CreateFormPage
                </Routes>
            </div>
        </Router>
    );
}

export default App;
