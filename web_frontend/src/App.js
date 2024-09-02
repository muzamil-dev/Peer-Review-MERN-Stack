import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';  // Import Bootstrap CSS
import LoginPage from './login_signup/LoginPage';
import DashboardPage from './Home/DashboardPage';
import Example from './ApiExamples';
import CustomGroupsPage from './GroupsPage';  // Import the CustomGroupsPage component
import GroupsPageAdmin from './GroupsPageAdmin';  // Import the CustomGroupsPageAdmin component
import ApiExamples from './ApiExamples';
import FormsPageAdmin from './FormsPageAdmin';  // Import the FormsPageAdmin component
import CreateFormPage from './CreateForm/CreateFormPageAdmin'; // Import the CreateFormPage component
import UserDashboard from './UserDashboard';
import ReviewPage from './ReviewPage';
import UserAnalyticsPage from './UserAnalyticsPage.js';
import GradesPage from './Grades'; // Import the GradesPage component
import UserJournalsPage from './UserJournalsPage'; // Import the UserJournalsPage component
import SubmitJournal from './SubmitJournal'; // Import the SubmitJournal component
import AdminJournalsPage from './AdminJournalsPage'; // Import the AdminJournalsPage component
import { SnackbarProvider } from 'notistack';

function App() {
    return (
        <SnackbarProvider maxSnack={3}> {/* Wrap the entire app in SnackbarProvider */}
            <Router>
                <div className="App">
                    <Routes>
                        <Route path="/" element={<LoginPage />} />
                        <Route path="/DashboardPage" element={<DashboardPage />} />
                        <Route path="/ApiExamples" element={<Example />} />
                        <Route path="/groups/:workspaceId" element={<CustomGroupsPage />} />
                        <Route path="/workspaces/:workspaceId/admin" element={<GroupsPageAdmin />} />
                        <Route path="/ApiExamples" element={<ApiExamples />} />
                        <Route path="/formsAdmin/:workspaceId" element={<FormsPageAdmin />} />
                        <Route path="/createForm/:workspaceId" element={<CreateFormPage />} />
                        <Route path="/UserDashboard" element={<UserDashboard />} />
                        <Route path="/Review/:reviewId" element={<ReviewPage />} />
                        <Route path="/workspace/:workspaceId/user/:userId/analytics" element={<UserAnalyticsPage />} />
                        <Route path="/grades/:workspaceId" element={<GradesPage />} /> {/* New route for GradesPage */}
                        <Route path="/workspaces/:workspaceId/journals" element={<UserJournalsPage />} /> {/* New route for UserJournalsPage */}
                        <Route path="/workspaces/:workspaceId/journals/:journalAssignmentId" element={<SubmitJournal />} /> {/* New route for SubmitJournal */}
                        <Route path="/workspaces/:workspaceId/admin/journals" element={<AdminJournalsPage />} /> {/* New route for AdminJournalsPage */}
                    </Routes>
                </div>
            </Router>
        </SnackbarProvider>
    );
}

export default App;
