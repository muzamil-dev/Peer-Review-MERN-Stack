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
    justifyContent: "center",
    width: "30%",
    color: "white",
    padding: "20px",
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
    alignItems: "center",
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

    const handleButtonClick = async (name, fn) => {
        console.log('Clicked ' + name);
        setLatestButton(name);
        setApiResponse(`Waiting for backend response for ${name}...`);
        const result = await fn();
        const str = JSON.stringify(result, null, 4);
        console.log(str);
        setApiResponse(str);
    };

    const content = [
        `Function: ${latestButton}`,
        `User userId: "${userId}"`,
        `Email: "${email}"`,
        `Workspace userId: "${workspaceId}"`,
        `Invite Code: "${inviteCode}"`,
        `Group userId: "${inviteCode}"`,
        `Response: ${apiResponse}`
    ].join('\n');

    return (
        <div style={appStyle}>
            <div style={leftStyle}>
                <h3>Manual Inputs</h3>
                <p>Email <input onChange={(e) => setEmail(e.target.value)} /></p>
                <p>Email Verification <input onChange={(e) => setEmailVerificationCode(e.target.value)} /></p>
                <p>Password <input onChange={(e) => setPassword(e.target.value)} /></p>
                <p>TargetId <input onChange={(e) => setTargetId(e.target.value)} /></p>
                
                <h3>User Functions</h3>
                <div style={buttonContainerStyle}>
                {[
                    { userId: "CreateAccount", fn: () => Api.Users.CreateAccount('Brittany', 'Marie', 'Clark', email, password) },
                    { userId: "VerifyEmailCode", fn: () => Api.Users.VerifyEmailCode(email, emailVerificationCode) },
                    { userId: "DoLogin", fn: () => Api.Users.DoLogin(email, password)
                        .then((response) => {
                            setApiResponse(response);
                            const decoded = jwtDecode(response.data.accessToken);
                            setUserId(decoded.userId);
                            return response;
                        })
                     },
                    { userId: "EditAccount", fn: () => Api.Users.EditAccount(userId, 'Tazeka', 'Marie', 'Liranov') },
                    { userId: "RequestPasswordReset", fn: () => Api.Users.RequestPasswordReset(userId, email) },
                    { userId: "ResetPassword", fn: () => Api.Users.ResetPassword(email, emailVerificationCode, password) },
                    { userId: "DeleteAccount", fn: () => Api.Users.DeleteAccount(userId) },
                    { userId: "BulkCreateUsers", fn: () => console.error("TODO") },
                    { userId: "GetById", fn: () => Api.Users.GetById(userId) },
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
                        onClick={() => handleButtonClick(endpoint.userId, endpoint.fn)}
                    >
                        {endpoint.userId}
                    </button>
                ))}
                </div>
                <h3>Workspace Functions</h3>
                <div style={buttonContainerStyle}>
                {[
                    { userId: "CreateWorkspace", fn: () => Api.Workspace.CreateWorkspace('MyWorkspace', userId, ['ucf\\.edu'], 5, 12)
                        .then((response) => {
                            setWorkspaceId(response.workspaceId);
                            return response;
                        }) },
                    { userId: "GetGroups", fn: () => Api.Workspace.GetGroups(workspaceId) },
                    { userId: "GetAssignments", fn: () => Api.Workspace.GetAssignments(workspaceId)},
                    { userId: "SetInviteCode", fn: () => Api.Workspace.SetInviteCode(userId, workspaceId) 
                        .then((response) => {
                            setInviteCode(response.inviteCode);
                            return response;
                        }) },
                    { userId: "JoinWorkspace", fn: () => Api.Workspace.JoinWorkspace(userId, workspaceId, inviteCode) },
                    { userId: "LeaveWorkspace", fn: () => Api.Workspace.LeaveWorkspace(userId, workspaceId) },
                    { userId: "EditWorkspace", fn: () => Api.Workspace.EditWorkspace(userId, workspaceId, 'MyEditedWorkspace', ['ucf\\.edu'], 6) },
                    { userId: "DeleteWorkspace", fn: () => Api.Workspace.DeleteWorkspace(userId, workspaceId) },
                    { userId: "RemoveActiveInvite", fn: () => Api.Workspace.RemoveActiveInvite(userId, workspaceId) },
                    { userId: "GetAllStudents", fn: () => Api.Workspace.GetAllStudents(workspaceId) },
                    { userId: "GetStudentsWithoutGroup", fn: () => Api.Workspace.GetStudentsWithoutGroup(workspaceId) },
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
                    onClick={() => handleButtonClick(endpoint.userId, endpoint.fn)}
                    >
                    {endpoint.userId}
                    </button>
                ))}
                </div>
                <h3>Group Functions</h3>
                <div style={buttonContainerStyle}>
                {[
                    { userId: "CreateGroup", fn: () => Api.Groups.CreateGroup(userId, workspaceId)
                        .then((response) => {
                            setGroupId(response.data.groupId);
                            return response;
                        })
                     },
                    { userId: "GetGroupInfo", fn: () => Api.Groups.GetGroupInfo(groupId) },
                    { userId: "JoinGroup", fn: () => Api.Groups.JoinGroup(groupId, userId) },
                    { userId: "LeaveGroup", fn: () => Api.Groups.LeaveGroup(groupId, userId) },
                    { userId: "AddUser", fn: () => Api.Groups.AddUser(userId, targetId, groupId) },
                    { userId: "RemoveUser", fn: () => Api.Groups.RemoveUser(userId, targetId, groupId) },
                    { userId: "DeleteGroup", fn: () => Api.Groups.DeleteGroup(userId, groupId) },
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
                        onClick={() => handleButtonClick(endpoint.userId, endpoint.fn)}
                    >
                        {endpoint.userId}
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
