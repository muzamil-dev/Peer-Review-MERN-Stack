import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import ApiExamples from './ApiExamples';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/DashboardPage" element={<DashboardPage />} />
                    <Route path="/ApiExamples" element={<ApiExamples/>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
