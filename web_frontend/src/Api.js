import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const app_name = 'cop4331-mern-cards-d3d1d335310b';// TODO - get real URL
// const getUrl = (prefix, route) => {

//     return 'http://localhost:5000' + prefix + route;
// };

//use this for testing local API
// const getUrl = (prefix, route) => {
//     return 'http://localhost:5000/' + prefix + route;
// };


const getUrl = (prefix, route) => {
    const formattedPrefix = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
    const formattedRoute = route.startsWith('/') ? route : `/${route}`;
    return `https://peerreview.site/backend/${formattedPrefix}${formattedRoute}`;
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
        //console.log('Api.js: Token expiration:', exp, 'now:', now);

        // Check if token is expired or about to expire
        if (exp < now) {
            token = await refreshAccessToken();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            } else {
                // Handle case where refresh token failed
                return Promise.reject(new Error('Failed to refresh access token'));
            }
        } else {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return config;
}, error => {
    return Promise.reject(error);
});

const apiRequest = async (method, url, data = null) => {
    try {
        const token = localStorage.getItem('accessToken');
        const response = await axios({
            method,
            url,
            data, // userId will be included here
            headers: {
                'Authorization': `Bearer ${token}`,
                ...getConfig().headers
            },
            withCredentials: true,
        });
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
const JOURNALS = 'journals/';

const GET = 'get';
const POST = 'post';
const DELETE = 'delete';
const PUT = 'put';

const logout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/'; // Redirect to the login page
};

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    logout, // Export the logout function
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
         * Creates a new group in the workspace specified by workspaceId
         * @param {number} userId 
         * @param {number} workspaceId 
         * @param {string} name
         * @returns {Promise<{ status: number, data: {}, message: string }>} Returns the newly created group's info
         */
        CreateGroup: async (userId, workspaceId, name) => {
            const payload = {
                userId,
                workspaceId,
                name
            };
            try {
                const response = await axios.post(getUrl(GROUPS, 'create'), payload);
                return {
                    status: response.status,
                    data: response.data,
                    message: response.data.message
                };
            } catch (err) {
                console.error('Error creating group:', err);
                return {
                    status: err.response ? err.response.status : 500,
                    data: err.response ? err.response.data : null,
                    message: err.response ? err.response.data.message : 'Internal Server Error'
                };
            }
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
         * Moves a user to a specified group
         * @param {number} userId - professor's id
         * @param {string} targetId - userId of the student that is being moved
         * @param {number} workspaceId - id of the workspace that the group belongs to
         * @param {number|null} groupId - id of the group to move the user to, or null to remove the user from their group
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        MoveUser: async (userId, targetId, workspaceId, groupId) => {
            const payload = {
                userId,
                targetId,
                workspaceId,
                groupId
            };
            const response = await apiRequest(PUT, getUrl(GROUPS, 'moveUser'), payload)
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
            const response = await apiRequest(DELETE, getUrl(GROUPS, groupId), { data: payload });
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
         * Gets all reviews created by the current user for a specific assignment
         * @param {number} assignmentId 
         * @param {number} userId 
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
        *  message: string }>} Returns an array of reviews created by the current user
        */
        GetReviewsForUser: async (assignmentId) => {
            const response = await apiRequest(GET, getUrl(ASSIGNMENTS, `${assignmentId}/user`), null);

            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },


        /**
         * Gets all reviews created by a specific user for a specific assignment
         * (Instructor viewing another user's reviews)
         * @param {number} assignmentId 
         * @param {number} userId 
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
        *  message: string }>} Returns an array of reviews created by the specified user
        */
        GetReviewsForAdmin: async (assignmentId, userId) => {
            const response = await apiRequest(GET, getUrl(ASSIGNMENTS, `${assignmentId}/user/${userId}`), null);
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
         * @param {number} assignmentId 
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
            const payload = { userId };
            const response = await apiRequest(DELETE, getUrl(ASSIGNMENTS, assignmentId), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
     * Gets the averages for an assignment, sorted from lowest to highest
     * @param {number} assignmentId - The ID of the assignment
     * @param {number} page - The page number for pagination
     * @param {number} perPage - The number of results per page
     * @param {number} userId - The ID of the user making the request
     * @returns {Promise<{ status: number, data: { totalResults: number, results: object[] }, message: string }>} 
     * Returns the average ratings for the assignment
     */
        GetAveragesByAssignment: async (assignmentId, page, perPage, userId) => {
            const queryParams = `?page=${page}&perPage=${perPage}`;
            const response = await apiRequest(GET, getUrl(ASSIGNMENTS, `${assignmentId}/averages${queryParams}`), { userId });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message,
            };
        },

        /**
         * Gets users who haven't completed all of their reviews for an assignment
         * Sorted by least complete to most complete by percentage, not including 100%
         * @param {number} assignmentId - The ID of the assignment
         * @param {number} page - The page number for pagination
         * @param {number} perPage - The number of results per page
         * @param {number} userId - The ID of the user making the request
         * @returns {Promise<{ status: number, data: { totalResults: number, results: object[] }, message: string }>}
         * Returns the list of users who haven't completed all their reviews
         */
        GetCompletionByAssignment: async (assignmentId, page, perPage, userId) => {
            const queryParams = `?page=${page}&perPage=${perPage}`;
            const response = await apiRequest(GET, getUrl(ASSIGNMENTS, `${assignmentId}/completion${queryParams}`), { userId });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message,
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
        *      firstName: string,
        *      lastName: string,
        *      targetFirstName: string,
        *      targetLastName: string,
        *      questions: string[],
        *      ratings: number[],
        *      comment: string
        *  }, 
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
         * Submits a review to the backend
         * @param {number} userId - The ID of the user submitting the review
         * @param {number} reviewId - The ID of the review being submitted
         * @param {number[]} ratings - An array of ratings for each question in the review
         * @param {string} comment - The comment for the review
         * @returns {Promise<{ status: number, success: boolean, message: string }>} - The response from the server
         */
        SubmitReview: async (userId, reviewId, ratings, comment) => {
            const payload = {
                userId,
                reviewId,
                ratings,
                comment // Add the comment to the payload
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
            const payload = { email: email.toLowerCase(), password };
            try {
                const url = getUrl(USERS, '/login');
                console.log('Login URL:', url); // Debug log
                console.log('Login Payload:', payload); // Debug log
                const response = await axios.post(url, payload, {
                    withCredentials: true,
                    headers: { 'Skip-Interceptor': 'true' } // Skip the interceptor
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
                console.error('Login Error:', err.response ? err.response.data : err); // Log error details
                return err.response || Response503;
            }
        },


        /**
        * Creates an account with the specified information.
        * @param {string} firstName 
        * @param {string} lastName 
        * @param {string} email 
        * @param {string} password 
        * @returns {Promise<{ status: number, data: {}, message: string }>} The freshly created user's data
        */
        CreateAccount: async (firstName, lastName, email, password) => {
            firstName = firstName.toLowerCase();
            lastName = lastName.toLowerCase();
            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);

            const payload = {
                firstName,
                lastName,
                email: email.toLowerCase(),
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
            const payload = { email: email.toLowerCase(), token: code };
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
            const payload = { email: email.toLowerCase() };
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
            const payload = { email: email.toLowerCase(), token, newPassword };
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
         * Get analytics for a particular user across all of the workspace's assignments
         * @param {number} workspaceId - The ID of the workspace
         * @param {number} targetId - The ID of the user to fetch analytics for
         * @param {number} userId - The ID of the current user making the request (usually the instructor)
         * @returns {Promise<{status: number, data: object, message: string}>} The analytics data
         */
        GetAnalyticsByUserAndWorkspace: async (workspaceId, targetId, userId) => {
            const url = getUrl(WORKSPACES, `${workspaceId}/analytics/${targetId}`);
            const response = await apiRequest(GET, url, { userId });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message,
            };
        },
        /**
         * Imports a CSV to create users, groups, and join them in a workspace
         * @param {number} userId
         * @param {number} workspaceId
         * @param {File} csvFile
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        importCSV: async (userId, workspaceId, csvFile) => {
            const formData = new FormData();
            formData.append('csvFile', csvFile);
            formData.append('userId', userId);
            formData.append('workspaceId', workspaceId);
            //lower case the email here
            //how can i do that

            const response = await axios.post(getUrl(WORKSPACES, 'import'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                withCredentials: true
            });
            return {
                status: response.status,
                success: response.status === 201,
                message: response.data.message
            };
        },
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
            const config = getConfig(); // Ensure the token is included in the headers
            const response = await axios.get(getUrl(WORKSPACES, `${workspaceId}/groups?members=true`), config);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
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
         * Edits the workspace name specified by workspaceID
         * @param {number} userId
         * @param {number} workspaceId
         * @param {string} name
         * @returns {Promise<{ status: number, success: boolean, message: string }>}
         */
        EditWorkspace: async (userId, workspaceId, name) => {
            const payload = {
                userId,
                workspaceId,
                name
            };
            const response = await apiRequest(PUT, getUrl(WORKSPACES, 'edit'), payload);
            return {
                status: response.status,
                success: response.status === 200,
                message: response.data.message
            };
        },
        /**
        * Deletes a workspace and all associated data, including journals
        * @param {number} workspaceId - The ID of the workspace to delete
        * @param {number} userId - The ID of the user making the delete request
        * @returns {Promise<{ status: number, message: string }>} The result of the delete operation
        */
        deleteWorkspace: async (workspaceId, userId) => {
            const config = getConfig();
            const response = await axios.delete(getUrl(WORKSPACES, `${workspaceId}/delete`), {
                data: { userId }, // Pass the userId in the request body
                ...config
            });
            return {
                status: response.status,
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

        InsertUser: async (userId, workspaceId, groupId, firstName, lastName, email, role) => {
            const payload = {
                userId,
                workspaceId,
                groupId,
                firstName,
                lastName,
                email,
                role
            };

            const response = await apiRequest(POST, getUrl(WORKSPACES, 'insertUser'), payload);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

        /**
         * Get all journals submitted by the student in a specific workspace
         * @param {number} workspaceId - The ID of the workspace
         * @param {number} userId - The ID of the student (should be the student's own ID)
         * @returns {Promise<{ status: number, data: object[], message: string }>} The list of journals
         */
        GetStudentJournalsByWorkspace: async (workspaceId, userId) => {
            const url = getUrl(WORKSPACES, `${workspaceId}/user`);
            const response = await apiRequest(GET, url, { userId });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

        /**
         * Get all journals submitted by a user in a specific workspace (admin access)
         * @param {number} workspaceId - The ID of the workspace
         * @param {number} userId - The ID of the user to fetch journals for
         * @param {number} requesterId - The ID of the admin making the request
         * @returns {Promise<{ status: number, data: object[], message: string }>} The list of journals
         */
        GetUserJournalsByWorkspaceAdmin: async (workspaceId, userId, requesterId) => {
            const url = getUrl(WORKSPACES, `${workspaceId}/user/${userId}`);
            const response = await apiRequest(GET, url, { userId: requesterId });
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

        /**
         * Get available weeks for journal assignments in a workspace
         * @param {number} workspaceId - The ID of the workspace
         * @returns {Promise<{ status: number, data: object, message: string }>} The list of weeks
         */
        getWeeks: async (workspaceId) => {
            try {
                const config = getConfig(); // Ensure the token is included in the headers
                const response = await axios.get(getUrl(WORKSPACES, `${workspaceId}/weeks`), config);
                return {
                    status: response.status,
                    data: response.data,  // This will return an object with past, current, and future weeks
                    message: response.data.message || 'Weeks fetched successfully',
                };
            } catch (error) {
                return {
                    status: error.response ? error.response.status : 500,
                    data: { past: [], current: [], future: [] },
                    message: error.response ? error.response.data.message : 'Failed to fetch weeks',
                };
            }
        },
        /**
         * Create multiple journal assignments in a workspace
         * @param {number} workspaceId - The ID of the workspace
         * @param {object} payload - The payload containing startDate, endDate, journalDay, and weekNumbersToSkip
         * @returns {Promise<{ status: number, data: object, message: string }>} The result of the journal creation
         */
        createJournals: async (workspaceId, payload) => {
            try {
                const config = getConfig();
                console.log("Sending request with payload:", payload);
                const response = await axios.post(getUrl(WORKSPACES, `${workspaceId}/createJournals`), payload, config);
                console.log("Response received:", response);
                return {
                    status: response.status,
                    data: response.data,
                    message: response.data.message,
                };
            } catch (error) {
                console.error("Error response:", error.response?.data || error.message);
                return {
                    status: error.response ? error.response.status : 500,
                    data: null,
                    message: error.response ? error.response.data.message : 'Failed to create journals',
                };
            }
        }

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
            const payload = { userId };
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
        GetAnalyticsForAssignment: async (assignmentId, userId, page = 0, perPage = 10) => {
            const payload = { userId };
            const response = await apiRequest(GET, getUrl(ANALYTICS, `assignment/${assignmentId}?page=${page}&perPage=${perPage}`), payload);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message
            };
        },

    },
    Journals: {
        /**
         * Submit a journal entry for a specific journal assignment
         * @param {number} journalAssignmentId - The ID of the journal assignment
         * @param {number} userId - The ID of the user submitting the journal entry
         * @param {string} content - The content of the journal entry
         * @returns {Promise<{ status: number, message: string }>} Response status and message
         */
        SubmitJournalEntry: async (journalAssignmentId, userId, content) => {
            const url = getUrl(JOURNALS, `${journalAssignmentId}/submit`);
            const response = await apiRequest(POST, url, { userId, content });
            return {
                status: response.status,
                message: response.data.message
            };
        },
        /**
         * Get a specific journal by its ID for a user
         * @param {number} journalAssignmentId - The ID of the journal assignment
         * @param {number} userId - The ID of the user
         * @returns {Promise<{ status: number, data: object, message: string }>} The journal data
         */
        GetJournalById: async (journalAssignmentId, userId) => {
            const url = getUrl(JOURNALS, `${journalAssignmentId}/user/${userId}`);
            const response = await apiRequest(GET, url);
            return {
                status: response.status,
                data: response.data,
                message: response.data.message,
            };
        },
    }
};