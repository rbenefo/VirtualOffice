import React from 'react';

import "./About.css"
export default class About extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }
    render() {
        return (
            <div id = "aboutContainer">

            <button id = "aboutButton">i</button>
            <div id = "aboutTextContainer">
            <div id="arrowLeft"></div>

            <div id="projectDescription">
                
            This project was made by 
            Tommy O'Halleran, Elena Bremner, and Roshan Benefo to 
            create community at Deeplocal.
            
            </div>
            </div>
            </div>
        );
    };

}
