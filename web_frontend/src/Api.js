import axios from 'axios';

const app_name = 'cop4331-mern-cards-d3d1d335310b';// TODO - get real URL
const getUrl = (prefix, route) => {
    if (process.env.NODE_ENV === 'production') 
    {
        return 'https://' + app_name +  '.herokuapp.com/' + prefix + route;
    }
    else
    {        
        return 'http://localhost:5000/' + prefix + route;
    }
};

const Response503 = {
    status: 503,
    success: false,
    data: {},
    message: 'Service temporarily unavailable',
    message: 'Service temporarily unavailable'
};

const GROUPS = 'groups/';
const ASSIGNMENTS = 'assignments/';
const REVIEWS = 'reviews/';
const WORKSPACES = 'workspaces/';
const USERS = 'users/';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    Groups: {
        /**
         * Gets the group info for a group specified by groupId
         * @param {string} groupId 
         * @returns {Promise<{ status: number, data: {groupId: string, name: string, workspaceId: string}, message: string }>} Returns the group info
         */
        GetGroupInfo: async (groupId) => {
            const response = await axios.get(getUrl(GROUPS, groupId))
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

        /**
         * Creates a new group in workspace specified by workspaceId
         * @param {string} userId 
         * @param {string} workspaceId 
         * @returns {Promise<{ status: number, data: {}, message: string }>} Returns the newly created group's info
         */
        CreateGroup: async (userId, workspaceId) => {
            const payload = {
                userId,
                workspaceId
            };
            const response = await axios.post(getUrl(GROUPS, 'create'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Adds the user specified by id to the group specified by groupId
         * @param {string} groupId 
         * @param {string} userId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        JoinGroup: async (groupId, userId) => {
            const payload = {
                groupId,
                userId
            };
            const response = await axios.put(getUrl(GROUPS, 'join'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Adds the user specified by id to the group specified by groupId
         * @param {string} groupId 
         * @param {string} userId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        LeaveGroup: async (groupId, userId) => {
            const payload = {
                groupId,
                userId
            };
            const response = await axios.put(getUrl(GROUPS, 'leave'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Admin adds a user (specified by userId) to a group (specified by groupId), overrides member limit and locks
         * @param {string} userId professor's id
         * @param {string} targetId userId of the student that is being added
         * @param {string} groupId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        AddUser: async (userId, targetId, groupId) => {
            const payload = {
                userId,
                targetId,
                groupId
            };
            const response = await axios.put(getUrl(GROUPS, 'addUser'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Admin removes a user (specified by userId) from a group (specified by groupId), overrides member limit and locks
         * @param {string} userId professor's id
         * @param {string} targetId userId of the student that is being added
         * @param {string} groupId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        RemoveUser: async (userId, targetId, groupId) => {
            const payload = {
                userId,
                targetId,
                groupId
            };
            const response = await axios.put(getUrl(GROUPS, 'removeUser'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Deletes a group
         * @param {string} userId 
         * @param {string} groupId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        DeleteGroup: async (userId, groupId) => {
            const payload = {
                userId
            };
            const response = await axios.delete(getUrl(GROUPS, groupId), { data: payload })
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
    },
    Assignments: {

    },
    Reviews: {

    },
    Users: {
        /**
         * Gets a user by their ID.
         * @param {number} id 
         * @returns {Promise<{ status: number, data: {}, message: string }>} The specified user's data
         */
        GetById: async (id) => {
            const response = await axios.get(getUrl(USERS, id))
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

        /**
         * Log the specified user in.
         * @param {string} email 
         * @param {string} password 
         * @returns {Promise<{ status: number, data: { accessToken: string }, message: string }>} The freshly logged in user's data
         */
        DoLogin: async (email, password) => {
            const payload = {
                email,
                password
            };
            const response = await axios.post(getUrl(USERS, 'login'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

        /**
         * Creates an account with the specified information.
         * @param {string} firstName 
         * @param {string} middleName 
         * @param {string} lastName 
         * @param {string} email 
         * @param {string} password 
         * @returns {Promise<{ status: number, data: {}, message: string }>} The freshly created user's data
         */
        CreateAccount: async (firstName, middleName, lastName, email, password) => {
            const payload = {
                firstName,
                middleName,
                lastName,
                email,
                password
            };
            const response = await axios.post(getUrl(USERS, 'signup'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        
        /**
         * Verify the token for the user
         * @param {string} email 
         * @param {string} code 
         * @returns {Promise<{ status: number, data: {}, message: string }>}
         */
        VerifyEmailCode: async (email, code) => {
            const payload = { email, token: code };
            const response = await axios.post(getUrl(USERS, 'verifyEmail'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

        /**
         * Gets the workspace for the user
         * @param {string} userId 
         * @returns {Promise<{ status: number, data: {}, message: string }>}
         */
        getUserWorkspaces: async (userId) => {
            const response = await axios.get(getUrl(USERS, `${userId}/workspaces`))
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

        /**
         * Edit the account with the corresponding id
         * @param {number} id 
         * @param {string} firstName 
         * @param {string} middleName 
         * @param {string} lastName 
         * @returns {Promise<{ status: number, data: {}, message: string }>} The edited user's updated data
         */
        EditAccount: async (id, firstName, middleName, lastName) => {
            const payload = {
                firstName,
                middleName,
                lastName,
                id
            };
            const response = await axios.put(getUrl(USERS, ''), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Delete account specified by id
         * @param {number} id 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        DeleteAccount: async (id) => {
            const payload = {
                id
            };
            const response = await axios.delete(getUrl(USERS, ''), { data: payload })
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Requests a password reset for the user
         * @param {string} id
         * @param {string} email 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */

        RequestPasswordReset: async (id, email) => {
            const payload = { id, email };
            const response = await axios.post(getUrl(USERS, 'requestPasswordReset'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.message
            };
        },

        /**
         * Reset the user's password
         * @param {string} email 
         * @param {string} token 
         * @param {string} newPassword 
         * @returns {Promise<{ status: number, data: {}, message: string }>}
         */
        ResetPassword: async (email, token, newPassword) => {
            const payload = { email, token, newPassword };
            const response = await axios.post(getUrl(USERS, 'resetPassword'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.message
            };
        },
        /**/

        /**
         * Create bulk users
         * @param {{
         *   firstName: string,
         *   middleName: string,
         *   lastName: string,
         *   email: string,
         *   password: string
         * }[]} users 
         * @returns {Promise<{ status: number, data: {}[], message: string }>} Created users' data
         */
        BulkCreateUsers: async (users) => {
            const payload = {
                users
            };
            const response = await axios.post(getUrl(USERS, 'requestPasswordReset'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.message
            };
        }
    },
    Workspace: {
        /**
         * Gets a list of assignments made in the specified workspace
         * @param {string} workspaceId
         * @returns {Promise<{ status: number, data: {}[], message: string }>} The list of assignments
         */
        GetAssignments: async (workspaceId) => {
            const response = await axios.get(getUrl(WORKSPACES, `${workspaceId}/assignments`))
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Gets the list of groups in the specified workspace
         * @param {string} workspaceId
         * @returns {Promise<{ status: number, data: {}[], message: string }>} The list of groups
         */
        GetGroups: async (workspaceId) => {
            const response = await axios.get(getUrl(WORKSPACES, `${workspaceId}/groups`))
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.message
            };
        },
        /**
         * Creates a new workspace
         * @param {string} name 
         * @param {string} userId 
         * @param {string[]} allowedDomains 
         * @param {number} groupMemberLimit 
         * @param {number} numGroups 
         * @returns {Promise<{ status: number, workspaceId: number, message: string }>} Returns ID of new workspace
         */
        CreateWorkspace: async (name, userId, allowedDomains, groupMemberLimit, numGroups) => {
            const payload = {
                name,
                userId,
                allowedDomains,
                groupMemberLimit,
                numGroups
            };
            const response = await axios.post(getUrl(WORKSPACES, 'create'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                workspaceId: response.data.workspaceId,
                message: response.data.message
            };
        },
        /**
         * Adds the user specified by userId to the workspace specified by workspaceID
         * @param {string} userId 
         * @param {string} inviteCode 
         * @returns {Promise<{ status: number, success: boolean, message: string, workspaceId: string }>}
         */
        JoinWorkspace: async (userId, inviteCode) => {
            const payload = {
                userId,
                inviteCode
            };
            const response = await axios.put(getUrl(WORKSPACES, 'join'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message,
                workspaceId: response.data.workspaceId
            };
        },
        /**
         * Removes the user specified by userId from the workspace specified by workspaceId
         * @param {string} userId 
         * @param {string} workspaceId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        LeaveWorkspace: async (userId, workspaceId) => {
            const payload = {
                userId,
                workspaceId
            };
            const response = await axios.put(getUrl(WORKSPACES, 'leave'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Sets the active invite code
         * @param {string} userId 
         * @param {string} workspaceId 
         * @returns {Promise<{ status: number, message: string, inviteCode: string }>}
         */
        SetInviteCode: async (userId, workspaceId) => {
            const payload = {
                userId,
                workspaceId
            };
            const response = await axios.put(getUrl(WORKSPACES, 'setInvite'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                message: response.data.message,
                inviteCode: response.data.inviteCode
            };
        },
        /**
         * Edits the workspace specified by workspaceID
         * @param {string} workspaceId
         * @param {string} name
         * @param {string[]} allowedDomains 
         * @param {number} groupMemberLimit
         * @param {boolean} groupLock
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        EditWorkspace: async (userId, workspaceId, name, allowedDomains, groupMemberLimit, groupLock) => {
            const payload = {
                userId,
                workspaceId,
                name,
                allowedDomains,
                groupMemberLimit,
                groupLock
            };
            const response = await axios.put(getUrl(WORKSPACES, 'edit'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Delete the workspace specified by workspaceID
         * @param {string} userId 
         * @param {string} workspaceId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        DeleteWorkspace: async (userId, workspaceId) => {
            const payload = {
                userId,
                workspaceId
            };
            const response = await axios.delete(getUrl(WORKSPACES, `${workspaceId}/delete`), { data: payload })
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Remove the active invite code for the workspace specified by workspaceID
         * @param {string} userId 
         * @param {string} workspaceId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        RemoveActiveInvite: async (userId, workspaceId) => {
            const payload = {
                userId
            };
            const response = await axios.delete(getUrl(WORKSPACES, `${workspaceId}/removeInvite`), { data: payload })
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Gets a list of all students in the specified workspaceId
         * @param {string} workspaceId 
         * @returns {Promise<{ status: number, data: {}[], message: string }>} Returns an array of students (users)
         */
        GetAllStudents: async (workspaceId) => {
            const response = await axios.get(getUrl(WORKSPACES, `${workspaceId}/students`))
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Gets a list of all students in the specified workspaceId who are not part of any group
         * @param {string} workspaceId 
         * @returns {Promise<{ status: number, data: {}[], message: string }>} Returns an array of students (users)
         */
        GetStudentsWithoutGroup: async (workspaceId) => {
            const response = await axios.get(getUrl(WORKSPACES, `${workspaceId}/ungrouped`))
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Gets the details of the specified workspace
         * @param {string} workspaceId
         * @returns {Promise<{ status: number, data: { name: string, allowedDomains: string[], groupMemberLimit: number, groupLock: boolean }, message: string }>} The workspace details
         */
        GetWorkspaceDetails: async (workspaceId) => {
            const response = await axios.get(getUrl(WORKSPACES, `${workspaceId}/details`))
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

    }
};