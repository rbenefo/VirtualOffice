import React from 'react';
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
            <input type = "button" id = "loginButton" value = "Login" onClick={(e) => {e.preventDefault();window.location.href='http://localhost:8081/auth/google';}}/>
            </div>
        );
    };

}
