import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap CSS
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import Example from './ApiExamples';
import GroupsPage from './GroupsPage';  // Import the GroupsPage component
import ApiExamples from './ApiExamples';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/DashboardPage" element={<DashboardPage />} />
                    <Route path="/ApiExamples" element={<Example />} />
                    <Route path="/groups/:workspaceId" element={<GroupsPage />} />  // Add the route for GroupsPage
                    <Route path="/ApiExamples" element={<ApiExamples/>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
