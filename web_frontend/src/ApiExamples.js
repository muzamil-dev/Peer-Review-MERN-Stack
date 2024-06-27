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
    const [latestButton, setLatestButton] = useState('N/A');
    const [id, setId] = useState('N/A');
    const [workspaceId, setWorkspaceId] = useState('N/A');
    const [inviteCode, setInviteCode] = useState('N/A');
    const [apiResponse, setApiResponse] = useState('N/A');

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
        `User Id: "${id}"`,
        `Email: "${email}"`,
        `Workspace Id: "${workspaceId}"`,
        `Invite Code: "${inviteCode}"`,
        `Response: ${apiResponse}`
    ].join('\n');

    return (
        <div style={appStyle}>
            <div style={leftStyle}>
                <h3>Manual Inputs</h3>
                <p>Email</p>
                <input onChange={(e) => setEmail(e.target.value)} />
                <br/>
                <p>Email Verification</p>
                <input onChange={(e) => setEmailVerificationCode(e.target.value)} />
                <h3>User Functions</h3>
                <div style={buttonContainerStyle}>
                {[
                    { id: "CreateAccount", fn: () => Api.Users.CreateAccount('Brittany', 'Marie', 'Clark', email, 'abc123') },
                    { id: "VerifyEmailCode", fn: () => Api.Users.VerifyEmailCode(email, emailVerificationCode) },
                    { id: "DoLogin", fn: () => Api.Users.DoLogin(email, 'abc123')
                        .then((response) => {
                            const decoded = jwtDecode(response.data.accessToken);
                            setId(decoded.userId);
                        })
                     },
                    { id: "EditAccount", fn: () => Api.Users.EditAccount(id, 'Tazeka', 'Marie', 'Liranov') },
                    { id: "RequestPasswordReset", fn: () => Api.Users.RequestPasswordReset(id, email) },
                    { id: "DeleteAccount", fn: () => Api.Users.DeleteAccount(id) },
                    { id: "BulkCreateUsers", fn: () => console.error("TODO") },
                    { id: "GetById", fn: () => Api.Users.GetById(id) },
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
                        onClick={() => handleButtonClick(endpoint.id, endpoint.fn)}
                    >
                        {endpoint.id}
                    </button>
                ))}
                </div>
                <h3>Workspace Functions</h3>
                <div style={buttonContainerStyle}>
                {[
                    { id: "CreateWorkspace", fn: () => Api.Workspace.CreateWorkspace('MyWorkspace', id, ['ucf\\.edu'], 5, 12)
                        .then((response) => {
                            setWorkspaceId(response.workspaceId);
                            return response;
                        }) },
                    { id: "GetGroups", fn: () => Api.Workspace.GetGroups(workspaceId) },
                    { id: "GetAssignments", fn: () => Api.Workspace.GetAssignments(workspaceId)},
                    { id: "SetInviteCode", fn: () => Api.Workspace.SetInviteCode(id, workspaceId) 
                        .then((response) => {
                        setInviteCode(response.inviteCode);
                        return response;
                        }) },
                    { id: "JoinWorkspace", fn: () => Api.Workspace.JoinWorkspace(id, workspaceId, inviteCode) },
                    { id: "LeaveWorkspace", fn: () => Api.Workspace.LeaveWorkspace(id, workspaceId) },
                    { id: "EditWorkspace", fn: () => Api.Workspace.EditWorkspace(id, workspaceId, 'MyEditedWorkspace', ['ucf\\.edu'], 6) },
                    { id: "DeleteWorkspace", fn: () => Api.Workspace.DeleteWorkspace(id, workspaceId) },
                    { id: "RemoveActiveInvite", fn: () => Api.Workspace.RemoveActiveInvite(id, workspaceId) },
                    { id: "GetAllStudents", fn: () => Api.Workspace.GetAllStudents(workspaceId) },
                    { id: "GetAllStudents", fn: () => Api.Workspace.GetAllStudents(workspaceId) },
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
                    onClick={() => handleButtonClick(endpoint.id, endpoint.fn)}
                    >
                    {endpoint.id}
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
