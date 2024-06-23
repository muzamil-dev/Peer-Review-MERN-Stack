import Api from "./Api.js";
import { useState } from 'react';

const email = Math.random() * 100000 + '@gmail.com';

const Example = (props) => {
    const [id, setId] = useState('');
    const [content, setContent] = useState('');
    const setAndLog = (str) => {
        console.log(str);
        setContent(str);
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
        }}>
            <input
                type='button'
                value='1. Create User'
                onClick={() => Api.Users.CreateAccount('Brittany', 'Marie', 'Clark', email, 'abc123')
                    .then((response) => {
                        setAndLog(JSON.stringify(response, null, 4));
                        setId(response.data._id);
                    })}
            />
            <input 
                type='button' 
                value='Get User By Id' 
                onClick={() => Api.Users.GetById(id)
                    .then((response) => console.log(JSON.stringify(response, null, 4)))} />
            <input
                type='button'
                value='2. Login'
                onClick={() => Api.Users.DoLogin(email, 'abc123')
                    .then((response) => setAndLog(JSON.stringify(response, null, 4)))}
            />
            <input
                type='button'
                value='3. Edit'
                onClick={() => Api.Users.EditAccount(id, 'Tazeka', 'Marie', 'Liranov')
                    .then((response) => setAndLog(JSON.stringify(response, null, 4)))}
            />
            <input
                type='button'
                value='4. Request Password Reset'
                onClick={() => Api.Users.RequestPasswordReset(id, email)
                    .then((response) => setAndLog(JSON.stringify(response, null, 4)))}
            />
            <input
                type='button'
                value='5. Delete'
                onClick={() => Api.Users.DeleteAccount(id)
                    .then((response) => setAndLog(JSON.stringify(response, null, 4)))}
            />
            <p>
                Response: <br/>
                {content}
            </p>
        </div>
    );
};

export default Example;