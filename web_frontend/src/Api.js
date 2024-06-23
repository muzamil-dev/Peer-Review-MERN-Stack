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

const GROUPS = 'groups/';
const ASSIGNMENTS = 'assignments/';
const REVIEWS = 'reviews/';
const WORKSPACES = 'workspaces/';
const USERS = 'users/';

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    Groups: {

    },
    Assignments: {

    },
    Reviews: {

    },
    Users: {
        /**
         * Gets a user by their ID.
         * @param {number} id 
         * @returns {Promise<{ status: number, data: {}, error: string }>} The specified user's data
         */
        GetById: async (id) => {
            const response = await axios.get(getUrl(USERS, id))
                .catch((err) => {
                    console.error(err);
                    return {
                        status: err.response.status,
                        data: err.response.data,
                        message: err.response.data.message
                    };
                });
            return {
                status: response.status,
                data: response.data,
                error: response.message
            };
        },
        /**
         * Log the specified user in.
         * @param {string} email 
         * @param {string} password 
         * @returns {Promise<{ status: number, data: {}, error: string }>} The freshly logged in user's data
         */
        DoLogin: async (email, password) => {
            const payload = {
                email,
                password
            };
            const response = await axios.post(getUrl(USERS, 'login'), payload)
                .catch((err) => {
                    console.error(err);
                    return {
                        status: err.response.status,
                        data: err.response.data,
                        message: err.response.data.message
                    };
                });
            return {
                status: response.status,
                data: response.data,
                error: response.message
            };
        },
        /**
         * Creates an account with the specified information.
         * @param {string} firstName 
         * @param {string} middleName 
         * @param {string} lastName 
         * @param {string} email 
         * @param {string} password 
         * @returns {Promise<{ status: number, data: {}, error: string }>} The freshly created user's data
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
                    return {
                        status: err.response.status,
                        data: err.response.data,
                        message: err.response.data.message
                    };
                });
            return {
                status: response.status,
                data: response.data,
                error: response.message
            };
        },
        
        /**/
        VerifyToken: async (email, token) => {
            const payload = { email, token };
            const response = await axios.post(getUrl(USERS, 'verifyEmail'), payload)
                .catch((err) => {
                    console.error(err);
                    return {
                        status: err.response.status,
                        data: err.response.data,
                        message: err.response.data.message
                    };
                });
            return {
                status: response.status,
                data: response.data,
                error: response.message
            };
        }, /**/


        /**
         * Edit the account with the corresponding id
         * @param {number} id 
         * @param {string} firstName 
         * @param {string} middleName 
         * @param {string} lastName 
         * @returns {Promise<{ status: number, data: {}, error: string }>} The edited user's updated data
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
                    return {
                        status: err.response.status,
                        data: err.response.data,
                        message: err.response.data.message
                    };
                });
            return {
                status: response.status,
                data: response.data,
                error: response.message
            };
        },
        /**
         * Delete account specified by id
         * @param {number} id 
         * @returns {Promise<{ status: number, success: boolean, error: string }>}
         */
        DeleteAccount: async (id) => {
            const payload = {
                id
            };
            const response = await axios.delete(getUrl(USERS, ''), { data: payload })
                .catch((err) => {
                    console.error(err);
                    return {
                        status: err.response.status,
                        message: err.response.data.message
                    };
                });
            return {
                status: response.status,
                success: response.status === 200,
                error: response.data.message
            };
        },
        /**
         * Requests a password reset for the user
         * @param {number} id 
         * @param {string} email 
         * @returns {Promise<{ status: number, success: boolean, error: string }>}
         */
        RequestPasswordReset: async (email) => {
            const payload = {
                email
            };
            const response = await axios.post(getUrl(USERS, 'requestPasswordReset'), payload)
                .catch((err) => {
                    console.error(err);
                    return {
                        status: err.response.status,
                        message: err.response.data.message
                    };
                });
            return {
                status: response.status,
                success: response.status === 200,
                error: response.data.message
            };
        },

        /**/
        ResetPassword: async (email, token, newPassword) => {
            const payload = { email, token, newPassword };
            const response = await axios.post(getUrl(USERS, 'resetPassword'), payload)
                .catch((err) => {
                    console.error(err);
                    return {
                        status: err.response.status,
                        data: err.response.data,
                        message: err.response.data.message
                    };
                });
            return {
                status: response.status,
                data: response.data,
                error: response.message
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
         * @returns {Promise<{ status: number, data: {}[], error: string }>} Created users' data
         */
        BulkCreateUsers: async (users) => {
            const payload = {
                users
            };
            const response = await axios.post(getUrl(USERS, 'requestPasswordReset'), payload)
                .catch((err) => {
                    console.error(err);
                    return {
                        status: err.response.status,
                        data: err.response.data,
                        message: err.response.data.message
                    };
                });
            return {
                status: response.status,
                data: response.data,
                error: response.message
            };
        }
    },
    Workspace: {

    }
};