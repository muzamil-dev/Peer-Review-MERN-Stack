import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './LoginPage';
import DashboardPage from './DashboardPage';
import Example from './ApiExamples';

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<LoginPage />} />
                    <Route path="/DashboardPage" element={<DashboardPage />} />
                    <Route path="/ApiExamples" element={<Example/>} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
