import axios from 'axios';
import {jwtDecode} from 'jwt-decode';

const app_name = 'cop4331-mern-cards-d3d1d335310b';// TODO - get real URL
const getUrl = (prefix, route) => {
    if (process.env.NODE_ENV === 'production') {
        return 'https://' + app_name + '.herokuapp.com/' + prefix + route;
    }
    else {
        return 'http://localhost:5000/' + prefix + route;
    }
};

const getConfig = () => ({
    headers: {
         'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
    }
});

const Response503 = {
    status: 503,
    success: false,
    data: {},
    message: 'Service temporarily unavailable'
};

const refreshAccessToken = async () => {
    try {
        //console.log('Api.js: now will call refresh token endpoint');
        const response = await axios.get(getUrl('jwt', '/refresh'), {
            withCredentials: true,
            headers: { 'Skip-Interceptor': 'true' } // Custom header to skip interceptor
        });
        //console.log('Api.js: endpoint called and returned response');
        if (response && response.status && response.status === 200) {
            const { accessToken } = response.data;
            localStorage.setItem('accessToken', accessToken);
            return accessToken;
        }
        return null;
    } catch (error) {
        console.error('Api.js: Error Caught: Failed to refresh access token:', error);
        return null;
    }
};

// Request Interceptor to Check and Refresh Token
axios.interceptors.request.use(async config => {
    // Skip the interceptor for the refresh token request
    if (config.headers['Skip-Interceptor']) {
        return config;
    }

    let token = localStorage.getItem('accessToken');
    if (token) {
        const { exp } = jwtDecode(token);
        const now = Date.now() / 1000;
        console.log('Api.js: Token expiration:', exp, 'now:', now);

        // Check if token is expired or about to expire
        if (exp < now) {
            token = await refreshAccessToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            } else {
                // Handle case where refresh token failed
                return Promise.reject(new Error('Failed to refresh access token'));
            }
        }
    }
    return config;
}, error => {
    return Promise.reject(error);
});

const apiRequest = async (method, url, data = null) => {
    
    try {
        const response = await axios({ method, url, data, ...getConfig() });
        return response;
    } catch (error) {
        console.error('Api.js: Error Caught:', error);
        throw error;
    }
};

const GROUPS = 'groups/';
const ASSIGNMENTS = 'assignments/';
const REVIEWS = 'reviews/';
const WORKSPACES = 'workspaces/';
const USERS = 'users/';
const ANALYTICS = 'analytics/';

const GET = 'get';
const POST = 'post';
const DELETE = 'delete';
const PUT = 'put';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    Groups: {
        /**
         * Gets the group info for a group specified by groupId
         * @param {number} groupId 
         * @returns {Promise<{ 
         *  status: number, 
         *  data: {groupId: number, name: string, workspaceId: number}, 
         *  message: string }>} Returns the group info
         */
        GetGroupInfo: async (groupId) => {
            const response = await apiRequest(GET, getUrl(GROUPS, groupId), null);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

        /**
         * Creates a new group in workspace specified by workspaceId
         * @param {number} userId 
         * @param {number} workspaceId 
         * @returns {Promise<{ status: number, data: {}, message: string }>} Returns the newly created group's info
         */
        CreateGroup: async (userId, workspaceId) => {
            const payload = {
                userId,
                workspaceId
            };
            const response = await apiRequest(POST, getUrl(GROUPS, 'create'), payload);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Adds the user specified by id to the group specified by groupId
         * @param {number} groupId 
         * @param {number} userId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        JoinGroup: async (groupId, userId) => {
            const payload = {
                groupId,
                userId
            };
            const response = await apiRequest(PUT, getUrl(GROUPS, 'join'), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Adds the user specified by id to the group specified by groupId
         * @param {number} groupId 
         * @param {number} userId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        LeaveGroup: async (groupId, userId) => {
            const payload = {
                groupId,
                userId
            };
            const response = await apiRequest(PUT, getUrl(GROUPS, 'leave'), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Admin adds a user (specified by userId) to a group (specified by groupId), overrides member limit and locks
         * @param {number} userId professor's id
         * @param {string} targetId userId of the student that is being added
         * @param {number} groupId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        AddUser: async (userId, targetId, groupId) => {
            const payload = {
                userId,
                targetId,
                groupId
            };
            const response = await apiRequest(PUT, getUrl(GROUPS, 'addUser'), payload)
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
         * @param {number} userId professor's id
         * @param {string} targetId userId of the student that is being added
         * @param {number} groupId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        RemoveUser: async (userId, targetId, groupId) => {
            const payload = {
                userId,
                targetId,
                groupId
            };
            const response = await apiRequest(PUT, getUrl(GROUPS, 'removeUser'), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Deletes a group
         * @param {number} userId 
         * @param {number} groupId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        DeleteGroup: async (userId, groupId) => {
            const payload = {
                userId
            };
            const response = await apiRequest(DELETE, getUrl(GROUPS, groupId), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
    },
    Assignments: {
        /**
         * Gets the info for the assignment specified by assignmentId
         * @param {number} assignmentId 
         * @returns {Promise<{ status: number, data: {}, message: string }>} Returns the assignment info
         */
        GetAssignmentInfo: async (assignmentId) => {
            const response = await apiRequest(GET, getUrl(ASSIGNMENTS, assignmentId), null);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Gets all reviews created by the user specified by userId
         * @param {number} assignmentId 
         * @param {number} userId not required
         * @returns {Promise<{ 
         *  status: number, 
         *  data: {
         *      userId: number,
         *      firstName: string,
         *      lastName: string,
         *      questions: string[],
         *      completedReviews: {
         *          reviewId: number,
         *          targetId: number,
         *          firstName: string,
         *          lastName: string,
         *          ratings: number[],
         *      }[],
         *      incompleteReviews: {
         *          reviewId: number,
         *          targetId: number,
         *          firstName: string,
         *          lastName: string,
         *          ratings: number[],
         *      }}, 
         *  message: string }>} Returns an array of reviews created by the user
         */
        GetAllReviewsByUser: async (assignmentId, userId) => {
            let response;
            if (!userId){
                response = await apiRequest(GET, getUrl(ASSIGNMENTS, `${assignmentId}/user`), null);
            } else{
                response = await apiRequest(GET, getUrl(ASSIGNMENTS, `${assignmentId}/user/${userId}`), null);
            }
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Gets all reviews written about a user specified by targetId
         * @param {number} assignmentId 
         * @param {string} targetId 
         * @returns {Promise<{ 
         *  status: number, 
         *  data: {
         *      targetId: number,
         *      firstName: string,
         *      lastName: string,
         *      questions: string[],
         *      reviews: {
         *          reviewId: number,
         *          targetId: number,
         *          firstName: string,
         *          lastName: string,
         *          ratings: number[],
         *      }[]}, 
         *  message: string }>} Returns an array of reviews about the target user
         */
        GetAllReviewsAboutTarget: async (assignmentId, targetId) => {
            const response = await apiRequest(GET, getUrl(ASSIGNMENTS, `${assignmentId}/target/${targetId}`), null);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Creates an assignment
         * @param {number} userId 
         * @param {number} workspaceId 
         * @param {string} name 
         * @param {number} startDate epoch
         * @param {number} dueDate epoch
         * @param {string[]} questions 
         * @param {string} description 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        CreateAssignment: async (userId, workspaceId, name, startDate, dueDate, questions, description) => {
            const payload = {
                userId,
                workspaceId,
                name,
                startDate,
                dueDate,
                questions,
                description
            };
            const response = await apiRequest(POST, getUrl(ASSIGNMENTS, 'create'), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message,
            };
        },
        /**
         * Edits an assignment
         * @param {number} userId 
         * @param {number} workspaceId 
         * @param {string} name 
         * @param {number} startDate epoch
         * @param {number} dueDate epoch
         * @param {string[]} questions 
         * @param {string} description 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        EditAssignment: async (userId, assignmentId, workspaceId, name, startDate, dueDate, questions, description) => {
            const payload = {
                userId,
                assignmentId,
                workspaceId,
                name,
                startDate,
                dueDate,
                questions,
                description
            };
            const response = await apiRequest(PUT, getUrl(ASSIGNMENTS, 'edit'), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message,
            };
        },
        /**
         * Deletes an assignment
         * @param {number} assignmentId 
         * @param {number} userId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        DeleteAssignment: async (assignmentId, userId) => {
            const payload = {userId};
            const response = await apiRequest(DELETE, getUrl(ASSIGNMENTS, assignmentId), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
    },
    Reviews: {
        /**
         * Gets a review by the specified reviewId
         * @param {number} reviewId 
         * @returns {Promise<{ 
         *  status: number,
         *  data: {
         *      userId: number,
         *      targetId: number,
         *      firstname: string,
         *      lastName: string,
         *      targetFirstName: string,
         *      targetLastName: string}, 
         *  message: string }>}
         */
        GetReview: async (reviewId) => {
            const response = await apiRequest(GET, getUrl(REVIEWS, reviewId), null);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Submits a review
         * @param {number} userId 
         * @param {number} reviewId 
         * @param {number[]} ratings 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        SubmitReview: async (userId, reviewId, ratings) => {
            const payload = {
                userId,
                reviewId,
                ratings
            };
            const response = await apiRequest(POST, getUrl(REVIEWS, 'submit'), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
    },
    Users: {
        /**
         * Log the specified user in.
         * @param {string} email 
         * @param {string} password 
         * @returns {Promise<{ status: number, data: { accessToken: string }, message: string }>} The freshly logged in user's data
         */
        DoLogin: async (email, password) => {
            const payload = { email, password };
            try {
                const response = await axios.post(getUrl(USERS, '/login'), payload, {
                    withCredentials: true,
                    headers: { 'Skip-Interceptor': 'true' } // skip the interceptor
                });
                if (response && response.status && response.status === 200) {
                    const { accessToken } = response.data;
                    localStorage.setItem('accessToken', accessToken);
                }
                return {
                    status: response.status,
                    data: response.data,
                    message: response.data.message
                };
            } catch (err) {
                console.error(err);
                return err.response || Response503;
            }
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
        CreateAccount: async (firstName, lastName, email, password) => {
            const payload = {
                firstName,
                lastName,
                email,
                password
            };
            const response = await apiRequest(POST, getUrl(USERS, 'signup'), payload)
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
            const response = await apiRequest(POST, getUrl(USERS, 'verifyEmail'), payload)
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
         * @returns {Promise<{ status: number, data: {}, message: string }>}
         */
        getUserWorkspaces: async () => {
            const response = await apiRequest(GET, getUrl(USERS, 'workspaces'), null);
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
            const response = await apiRequest(DELETE, getUrl(USERS, ''), payload)
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
         * @param {string} email 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        RequestPasswordReset: async (email) => {
            const payload = { email };
            const response = await apiRequest(POST, getUrl(USERS, 'requestPasswordReset'), payload)
                .catch((err) => {
                    console.error(err);
                    return err.response || Response503;
                });
            return {
                status: response.status,
                success: response.status === 201,
                message: response.data.message
            };
        },

        /**
         * Reset the user's password
         * @param {string} email 
         * @param {string} token 
         * @param {string} newPassword 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        ResetPassword: async (email, token, newPassword) => {
            const payload = { email, token, newPassword };
            const response = await apiRequest(POST, getUrl(USERS, 'resetPassword'), payload)
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
            const response = await apiRequest(POST, getUrl(USERS, 'requestPasswordReset'), payload)
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
    Workspaces: {
        /**
         * Gets a list of assignments made in the specified workspace
         * @param {number} workspaceId
         * @returns {Promise<{ status: number, data: {}[], message: string }>} The list of assignments
         */
        GetAssignments: async (workspaceId) => {
            const response = await apiRequest(GET, getUrl(WORKSPACES, `${workspaceId}/assignments`), null);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Gets the list of groups in the specified workspace
         * @param {number} workspaceId
         * @returns {Promise<{ status: number, data: {}[], message: string }>} The list of groups
         */
        GetGroups: async (workspaceId) => {
            const response = await apiRequest(GET, getUrl(WORKSPACES, `${workspaceId}/groups`), null);
            return {
                status: response.status,
                data: response.data,
                message: response.message
            };
        },
        /**
         * Creates a new workspace
         * @param {string} name 
         * @param {number} userId 
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
            const response = await apiRequest(POST, getUrl(WORKSPACES, 'create'), payload);
            return {
                status: response.status,
                workspaceId: response.data.workspaceId,
                message: response.data.message
            };
        },
        /**
         * Adds the user specified by userId to the workspace specified by workspaceID
         * @param {number} userId 
         * @param {string} inviteCode 
         * @returns {Promise<{ status: number, success: boolean, message: string, workspaceId: number }>}
         */
        JoinWorkspace: async (userId, inviteCode) => {
            const payload = {
                userId,
                inviteCode
            };
            const response = await apiRequest(PUT, getUrl(WORKSPACES, 'join'), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message,
                workspaceId: response.data.workspaceId
            };
        },
        /**
         * Removes the user specified by userId from the workspace specified by workspaceId
         * @param {number} userId 
         * @param {number} workspaceId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        LeaveWorkspace: async (userId, workspaceId) => {
            const payload = {
                userId,
                workspaceId
            };
            const response = await apiRequest(PUT, getUrl(WORKSPACES, 'leave'), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Removes a user from the workspace specified by workspaceId
         * @param {number} userId 
         * @param {number} targetId
         * @param {number} workspaceId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        RemoveUser: async (userId, targetId, workspaceId) => {
            const payload = {
                userId,
                targetId,
                workspaceId
            };
            const response = await apiRequest(PUT, getUrl(WORKSPACES, 'removeUser'), payload)
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
         * @param {number} userId 
         * @param {number} workspaceId 
         * @returns {Promise<{ status: number, message: string, inviteCode: string }>}
         */
        SetInviteCode: async (userId, workspaceId) => {
            const payload = {
                userId,
                workspaceId
            };
            const response = await apiRequest(PUT, getUrl(WORKSPACES, 'setInvite'), payload);
            return {
                status: response.status,
                message: response.data.message,
                inviteCode: response.data.inviteCode
            };
        },
        /**
         * Edits the workspace specified by workspaceID
         * @param {number} workspaceId
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
            const response = await apiRequest(PUT, getUrl(WORKSPACES, 'edit'), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Delete the workspace specified by workspaceID
         * @param {number} userId 
         * @param {number} workspaceId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        DeleteWorkspace: async (userId, workspaceId) => {
            const payload = {
                userId,
                workspaceId
            };
            const response = await apiRequest(DELETE, getUrl(WORKSPACES, `${workspaceId}`), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Remove the active invite code for the workspace specified by workspaceID
         * @param {number} userId 
         * @param {number} workspaceId 
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        RemoveActiveInvite: async (userId, workspaceId) => {
            const payload = {
                userId
            };
            const response = await apiRequest(DELETE, getUrl(WORKSPACES, `${workspaceId}/removeInvite`), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
         * Gets a list of all students in the specified workspaceId
         * @param {number} workspaceId 
         * @returns {Promise<{ status: number, data: {}[], message: string }>} Returns an array of students (users)
         */
        GetAllStudents: async (workspaceId) => {
            const response = await apiRequest(GET, getUrl(WORKSPACES, `${workspaceId}/students`), null);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Gets a list of all students in the specified workspaceId who are not part of any group
         * @param {number} workspaceId 
         * @returns {Promise<{ status: number, data: {}[], message: string }>} Returns an array of students (users)
         */
        GetStudentsWithoutGroup: async (workspaceId) => {
            const response = await apiRequest(GET, getUrl(WORKSPACES, `${workspaceId}/ungrouped`), null);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * Gets the details of the specified workspace
         * @param {number} workspaceId
         * @returns {Promise<{ 
         *  status: number, 
         *  data: { 
         *      name: string, 
         *      allowedDomains: string[], 
         *      groupMemberLimit: number, 
         *      groupLock: boolean }, 
         *  message: string }>} The workspace details
         */
        GetWorkspaceDetails: async (workspaceId) => {
            const response = await apiRequest(GET, getUrl(WORKSPACES, `${workspaceId}`), null);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

    },
    Analytics: {
        /**
         * Get analytics for a user specified by targetId in a workspace specified by workspaceId
         * @param {number} targetId 
         * @param {number} workspaceId 
         * @param {number} userId 
         * @returns {Promise<{ 
         *  status: number, 
         *  data: { 
         *      userId: number, 
         *      firstName: string, 
         *      lastName: string, 
         *      assignments: {
         *          assignmentId: number,
         *          startDate: Date,
         *          dueDate: Date,
         *          averageRating: number
         *      }[]
         *  },
         *  message: string
         * }>}
         */
        GetAnalyticsForUser: async (targetId, workspaceId, userId) => {
            const payload = {userId};
            const response = await apiRequest(GET, getUrl(ANALYTICS, `workspace/${workspaceId}/user/${targetId}`), payload);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },
        /**
         * 
         * @param {number} assignmentId 
         * @param {number} userId 
         * @param {number} page 
         * @param {number} perPage 
         * @returns {Promise<{ 
         *  status: number, 
         *  data: { 
         *      userId: number, 
         *      firstName: string, 
         *      lastName: string, 
         *      assignmentId: number,
         *      averageRating: number
         *  }[],
         *  message: string
         * }>}
         */
        GetAnalyticsForAssignment: async (assignmentId, userId, page=0, perPage=10) => {
            const payload = {userId};
            const response = await apiRequest(GET, getUrl(ANALYTICS, `assignment/${assignmentId}?page=${page}&perPage=${perPage}`), payload);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

    }
};