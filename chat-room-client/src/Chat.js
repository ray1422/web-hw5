import React, { useState, useEffect, useRef } from 'react';
import socket from './Socket';
import EmojiPicker from 'emoji-picker-react';
import './Chat.css';  // Make sure to create and include this CSS file

const Chat = ({ username }) => {
    const [_username, set_username] = useState(username);
    const chatHistory = useRef({});
    const isInit = useRef(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [userList, setUserList] = useState([]);
    const [recipient, setRecipient] = useState('Group');
    const [hasNewMessageMp, setHasNewMessageMp] = useState({});
    const [emojiOpen, setEmojiOpen] = useState(false);
    useEffect(() => {
        if (isInit.current) {
            return;
        }
        isInit.current = true;

        socket.on('_username', (_username) => {
            set_username(_username);
        });
        socket.emit('join', _username);

        socket.on('userList', (users) => {
            setUserList(users);
        });

        socket.on('receiveMessage', (message) => {
            if (message.recipient === 'Group') {
                if (message.sender === _username) {
                    return;
                }
                chatHistory.current = { ...chatHistory.current, Group: [...(chatHistory.current.Group || []), message] };
                setHasNewMessageMp((prev) => {
                    return { ...prev, Group: true };
                });
                if (recipient === 'Group') {
                    setMessages(chatHistory.current.Group);
                }
                return;
            }
            chatHistory.current = { ...chatHistory.current, [message.sender]: [...(chatHistory.current[message.sender] || []), message] };
            setHasNewMessageMp((prev) => {
                return { ...prev, [message.sender]: true };
            });
            if (recipient === message.sender) {
                setMessages(chatHistory.current[message.sender]);
            }
        });
    }, [_username]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        socket.emit('sendMessage', { sender: _username, recipient, message });
        if (recipient === 'Group') {
            chatHistory.current = { ...chatHistory.current, Group: [...(chatHistory.current.Group || []), { sender: _username, message }] };
        } else {
            chatHistory.current = { ...chatHistory.current, [recipient]: [...(chatHistory.current[recipient] || []), { sender: _username, message }] };
        }
        setMessages(chatHistory.current[recipient]);
        setMessage('');
    };

    const sendImg = (e) => {
        e.preventDefault();
        if (e.target.files.length === 0) {
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(e.target.files[0]);
        reader.onload = function (e) {
            const img = e.target.result;
            socket.emit('sendMessage', { sender: _username, recipient, msgType: "image", message: img });
            if (recipient === 'Group') {
                chatHistory.current = { ...chatHistory.current, Group: [...(chatHistory.current.Group || []), { sender: _username, message: img, msgType: 'image' }] };
            } else {
                chatHistory.current = { ...chatHistory.current, [recipient]: [...(chatHistory.current[recipient] || []), { sender: _username, message: img, msgType: 'image' }] };
            }
            setMessages(chatHistory.current[recipient]);
        };
        e.target.value = '';
    };

    useEffect(() => {
        setMessages(chatHistory.current[recipient] || []);
        setHasNewMessageMp((prev) => {
            return { ...prev, [recipient]: false };
        });
    }, [recipient]);

    return (
        <div

            onClick={() => setEmojiOpen(false)}
            className="chat-container" onFocus={() => {
                setHasNewMessageMp((prev) => {
                    return { ...prev, [recipient]: false };
                });
            }}>
            <div className="user-list">
                <div>
                    在線人數：{userList.length - 1 /* exclude 'Group' */}
                </div>
                <button className="user-button" onClick={() => setRecipient('Group')} disabled={recipient === 'Group'}>
                    {(hasNewMessageMp.Group ?? false) ? <strong style={{
                        color: 'red',
                        fontWeight: 'bold',
                    }}>* </strong> : ""} Group Chat
                </button>
                {userList.map((user, index) => (
                    user !== _username && (
                        <button
                            className="user-button"
                            disabled={recipient === user}
                            key={index} onClick={() => setRecipient(user)}>
                            {(hasNewMessageMp[user] ?? false) ? <strong>* </strong> : ""} {user}
                        </button>
                    )
                ))}
            </div>
            <div className="chat-window">
                <h2>{recipient}</h2>
                <div className="messages">
                    {messages.map((msg, index) => {
                        if (msg.msgType === "image") {
                            return <div key={index} className="message">
                                <strong>{msg.sender}: </strong><img
                                    className="message-image"
                                    src={msg.message} alt="img" />
                            </div>
                        } else {
                            return <div key={index} className="message">
                                <strong>{msg.sender}: </strong>{msg.message}
                            </div>
                        }
                    })}
                </div>
                <form className="message-form" onSubmit={handleSendMessage}>
                    <div
                        style={{
                            position: 'relative',

                        }}
                    >
                        {emojiOpen ?
                            <div onClick={
                                (e) => {
                                    e.stopPropagation();
                                }

                            }
                                style={{
                                    position: 'absolute',
                                    bottom: '2em',
                                    left: '0',

                                }}>
                                <EmojiPicker
                                    emojiStyle="native"
                                    onEmojiClick={(emojiObject) => {
                                        setMessage(message + emojiObject.emoji);
                                    }} /> </div> : <></>}
                        <div>
                            <button
                                style={{
                                    padding: ' 1em 0.5em',
                                    borderRadius: '3px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    backgroundColor: 'white',
                                }}
                                type='button' className="emoji-button" onClick={(e) => {
                                    setEmojiOpen(true)
                                    e.stopPropagation();
                                    e.preventDefault();
                                }}>😀</button>
                        </div>

                    </div>
                    <input
                        className="message-input"
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message"
                    />
                    <button className="send-button" type="submit">Send</button>
                    <label className="file-label" htmlFor="file">Send a Pic</label>
                    <input className="file-input" type="file" id="file" name="file" onChange={sendImg} />
                </form>
            </div>
        </div>
    );
};

export default Chat;
