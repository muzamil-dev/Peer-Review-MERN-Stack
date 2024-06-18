import axios from 'axios';

export default {
    Login: async (email, pass) => {
        // TODO: update all this to match API
        const payload = {
            email: email,
            pass: pass
        };
        const response = await axios.post('http://localhost:5001/login', payload)
            .catch(e => console.error(JSON.stringify(e)));
        if (response?.status !== 200) {
            return [];
        }
        console.log(JSON.stringify(response.data, null, 4));
        return response.data;
    },
    CreateAccount: async (email, pass) => {
        // TODO: update all this to match API
        const payload = {
            email: email,
            pass: pass
        };
        const response = await axios.post('http://localhost:5001/createAccount', payload)
            .catch(e => console.error(JSON.stringify(e)));
        if (response?.status !== 200) {
            return [];
        }
        console.log(JSON.stringify(response.data, null, 4));
        return response.data;
    }
}; 
