import React, { useEffect, useState } from 'react';

const Login = ({ setUsername }) => {
    const [name, setName] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        setUsername(name);
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your nickname"
                />
                <button type="submit">Join Chat</button>
            </form>
        </div>
    );
};

export default Login;