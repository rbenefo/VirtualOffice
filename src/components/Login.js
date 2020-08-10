import React from 'react';
import DLKey from '../assets/images/DLkeyWhite.png'

import "./Login.css"


export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }

    componentDidMount() {
      }
    
    render() {
        return (
            <div id = "loginButtonContainer">
            <input type = "image" alt="" src={DLKey} id = "loginButton" value = "key" onClick={(e) => {e.preventDefault();window.location.href='http://localhost:8081/auth/google';}}/>
            </div>
        );
    };

}
