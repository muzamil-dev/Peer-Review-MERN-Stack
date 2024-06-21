import React, { useState } from "react";
import Api from "./Api";
import { jwtDecode } from 'jwt-decode';

const appStyle = {
    display: "flex",
    height: "100vh",
    width: "100vw",
};

const leftStyle = {
    backgroundColor: "#282c34",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "30%",
    color: "white",
    padding: "20px",
    overflowY: 'auto',
};

const rightStyle = {
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
    color: "#282c34",
    padding: "20px",
    fontSize: 20
};

const buttonContainerStyle = {
    display: "flex",
    flexDirection: "column",
};

const buttonStyle = {
    backgroundColor: "#61dafb",
    border: "none",
    color: "black",
    padding: "4px 8px",
    textAlign: "center",
    textDecoration: "none",
    display: "inline-block",
    fontSize: "12px",
    margin: "3px 0",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
};

const buttonHoverStyle = {
    backgroundColor: "#21a1f1",
};


function ApiExamples() {
    const [email, setEmail] = useState('N/A');
    const [emailVerificationCode, setEmailVerificationCode] = useState('N/A');
    const [password, setPassword] = useState('abc123');
    const [latestButton, setLatestButton] = useState('N/A');
    const [userId, setUserId] = useState('N/A');
    const [workspaceId, setWorkspaceId] = useState('N/A');
    const [inviteCode, setInviteCode] = useState('N/A');
    const [apiResponse, setApiResponse] = useState('N/A');
    const [groupId, setGroupId] = useState('N/A');
    const [targetId, setTargetId] = useState('N/A');
    const [assignmentId, setAssignmentId] = useState('N/A');
    const [reviewId, setReviewId] = useState('N/A')

    const handleButtonClick = async (name, fn) => {
        //console.log('Clicked ' + name);
        setLatestButton(name);
        setApiResponse(`Waiting for backend response for ${name}...`);
        const result = await fn();
        const str = JSON.stringify(result, null, 4);
        //console.log(str);
        setApiResponse(str);
    };

    const content = [
        `Function: ${latestButton}`,
        `UserId: "${userId}"`,
        `Email: "${email}"`,
        `WorkspaceId: "${workspaceId}"`,
        `Invite Code: "${inviteCode}"`,
        `GroupId: "${inviteCode}"`,
        `Response: ${apiResponse}`
    ].join('\n');

    const questions = [
        'What is your favorite color?',
        'What comes after Tuesday?',
        'Did joe contribute?',
        'Do you have any 7s?',
        'Are we there yet?',
        'Why!?!?'
    ]

    return (
        <div style={appStyle}>
            <div style={leftStyle}>
                <h3>Manual Inputs</h3>
                <p>Email <input onChange={(e) => setEmail(e.target.value)} /></p>
                <p>Password <input onChange={(e) => setPassword(e.target.value)} /></p>
                <p>Email Verification <input onChange={(e) => setEmailVerificationCode(e.target.value)} /></p>
                <p>TargetId <input onChange={(e) => setTargetId(e.target.value)} /></p>
                <p>AssignmentId <input onChange={(e) => setAssignmentId(parseInt(e.target.value))} /></p>
                <p>ReviewId <input onChange={(e) => setReviewId(parseInt(e.target.value))} /></p>
                <div style={buttonContainerStyle}>
                    <h3>User Functions</h3>
                    {[
                        { buttonId: "CreateAccount", fn: () => Api.Users.CreateAccount('Brittany', 'Clark', email, password) },
                        { buttonId: "VerifyEmailCode", fn: () => Api.Users.VerifyEmailCode(email, emailVerificationCode) },
                        { buttonId: "DoLogin", fn: () => Api.Users.DoLogin(email, password)
                            .then((response) => {
                                setApiResponse(response);
                                const decoded = jwtDecode(response.data.accessToken);
                                setUserId(decoded.userId);
                                localStorage.setItem('accessToken', response.data.accessToken);
                                return response;
                            })
                        },
                        { buttonId: "RequestPasswordReset", fn: () => Api.Users.RequestPasswordReset(email) },
                        { buttonId: "ResetPassword", fn: () => Api.Users.ResetPassword(email, emailVerificationCode, password) },
                        { buttonId: "DeleteAccount", fn: () => Api.Users.DeleteAccount(userId) },
                        { buttonId: "BulkCreateUsers", fn: () => console.error("TODO") },
                    ].map((endpoint, index) => (
                        <button
                            key={index}
                            style={buttonStyle}
                            onMouseEnter={(e) =>
                                (e.target.style.backgroundColor =
                                buttonHoverStyle.backgroundColor)
                            }
                            onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = buttonStyle.backgroundColor)
                            }
                            onClick={() => handleButtonClick(endpoint.buttonId, endpoint.fn)}
                        >
                            {endpoint.buttonId}
                        </button>
                    ))}
                </div>
                <h3>Workspace Functions</h3>
                <div style={buttonContainerStyle}>
                    {[
                        { buttonId: "CreateWorkspace", fn: () => Api.Workspaces.CreateWorkspace('MyWorkspace', userId, ['ucf\\.edu'], 5)
                            .then((response) => {
                                setWorkspaceId(response.workspaceId);
                                return response;
                            }) },
                        { buttonId: "GetGroups", fn: () => Api.Workspaces.GetGroups(workspaceId) },
                        { buttonId: "GetAssignments", fn: () => Api.Workspaces.GetAssignments(workspaceId)},
                        { buttonId: "SetInviteCode", fn: () => Api.Workspaces.SetInviteCode(userId, workspaceId) 
                            .then((response) => {
                                setInviteCode(response.inviteCode);
                                return response;
                            }) },
                        { buttonId: "JoinWorkspace", fn: () => Api.Workspaces.JoinWorkspace(userId, workspaceId, inviteCode) },
                        { buttonId: "LeaveWorkspace", fn: () => Api.Workspaces.LeaveWorkspace(userId, workspaceId) },
                        { buttonId: "EditWorkspace", fn: () => Api.Workspaces.EditWorkspace(userId, workspaceId, 'MyEditedWorkspace', ['ucf\\.edu'], 6) },
                        { buttonId: "DeleteWorkspace", fn: () => Api.Workspaces.DeleteWorkspace(userId, workspaceId) },
                        { buttonId: "RemoveActiveInvite", fn: () => Api.Workspaces.RemoveActiveInvite(userId, workspaceId) },
                        { buttonId: "GetAllStudents", fn: () => Api.Workspaces.GetAllStudents(workspaceId) },
                        { buttonId: "GetStudentsWithoutGroup", fn: () => Api.Workspaces.GetStudentsWithoutGroup(workspaceId) },
                    ].map((endpoint, index) => (
                        <button
                        key={index}
                        style={buttonStyle}
                        onMouseEnter={(e) =>
                            (e.target.style.backgroundColor =
                            buttonHoverStyle.backgroundColor)
                        }
                        onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = buttonStyle.backgroundColor)
                        }
                        onClick={() => handleButtonClick(endpoint.buttonId, endpoint.fn)}
                        >
                        {endpoint.buttonId}
                        </button>
                    ))}
                </div>
                <h3>Group Functions</h3>
                <div style={buttonContainerStyle}>
                    {[
                        { buttonId: "CreateGroup", fn: () => Api.Groups.CreateGroup(userId, workspaceId)
                            .then((response) => {
                                setGroupId(response.data.group.groupId);
                                return response;
                            })
                        },
                        { buttonId: "GetGroupInfo", fn: () => Api.Groups.GetGroupInfo(groupId) },
                        { buttonId: "JoinGroup", fn: () => Api.Groups.JoinGroup(groupId, userId) },
                        { buttonId: "LeaveGroup", fn: () => Api.Groups.LeaveGroup(groupId, userId) },
                        { buttonId: "AddUser", fn: () => Api.Groups.AddUser(userId, targetId, groupId) },
                        { buttonId: "RemoveUser", fn: () => Api.Groups.RemoveUser(userId, targetId, groupId) },
                        { buttonId: "DeleteGroup", fn: () => Api.Groups.DeleteGroup(userId, groupId) },
                    ].map((endpoint, index) => (
                        <button
                            key={index}
                            style={buttonStyle}
                            onMouseEnter={(e) =>
                                (e.target.style.backgroundColor =
                                buttonHoverStyle.backgroundColor)
                            }
                            onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = buttonStyle.backgroundColor)
                            }
                            onClick={() => handleButtonClick(endpoint.buttonId, endpoint.fn)}
                        >
                            {endpoint.buttonId}
                        </button>
                    ))}
                </div>
                <h3>Assignment Functions</h3>
                <div style={buttonContainerStyle}>
                    {[
                        { buttonId: "GetAssignmentInfo", fn: () => Api.Assignments.GetAssignmentInfo(assignmentId) },
                        { buttonId: "GetAllReviewsByUser", fn: () => Api.Assignments.GetAllReviewsByUser(assignmentId, userId) },
                        { buttonId: "GetAllReviewsAboutTarget", fn: () => Api.Assignments.GetAllReviewsAboutTarget(assignmentId, targetId) },
                        { buttonId: "CreateAssignment", fn: () => Api.Assignments.CreateAssignment(userId, workspaceId, 'My Assignment', new Date(), new Date(), questions, 'Very assignment, much description, wow.') },
                        { buttonId: "EditAssignment", fn: () => Api.Assignments.EditAssignment(userId, assignmentId, workspaceId, 'My Edited Assignment', new Date(), new Date(), questions, 'Very assignment, much description, wow.') },
                        { buttonId: "DeleteAssignment", fn: () => Api.Assignments.DeleteAssignment(assignmentId, userId) },
                    ].map((endpoint, index) => (
                        <button
                            key={index}
                            style={buttonStyle}
                            onMouseEnter={(e) =>
                                (e.target.style.backgroundColor =
                                buttonHoverStyle.backgroundColor)
                            }
                            onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = buttonStyle.backgroundColor)
                            }
                            onClick={() => handleButtonClick(endpoint.buttonId, endpoint.fn)}
                        >
                            {endpoint.buttonId}
                        </button>
                    ))}
                </div>
                <h3>Review Functions</h3>
                <div style={buttonContainerStyle}>
                    {[
                        { buttonId: "GetReview", fn: () => Api.Reviews.GetReview(reviewId)},
                        { buttonId: "SubmitReview", fn: () => Api.Reviews.SubmitReview(userId, reviewId, [1, 2, 3, 4, 5]) },
                    ].map((endpoint, index) => (
                        <button
                            key={index}
                            style={buttonStyle}
                            onMouseEnter={(e) =>
                                (e.target.style.backgroundColor =
                                buttonHoverStyle.backgroundColor)
                            }
                            onMouseLeave={(e) =>
                                (e.target.style.backgroundColor = buttonStyle.backgroundColor)
                            }
                            onClick={() => handleButtonClick(endpoint.buttonId, endpoint.fn)}
                        >
                            {endpoint.buttonId}
                        </button>
                    ))}
                </div>
            </div>
            <div style={rightStyle}>
                <pre style={{ whiteSpace: 'pre-wrap' }}>{content}</pre>
            </div>
        </div>
    );
}

export default ApiExamples;
