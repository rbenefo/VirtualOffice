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
            <input type = "image" alt="" src={DLKey} id = "loginButton" value = "key" onClick={(e) => {e.preventDefault();window.location.href='https://api-dot-virtualoffice-285701.ue.r.appspot.com/auth/google';}}/>
            </div>
        );
    };

}
