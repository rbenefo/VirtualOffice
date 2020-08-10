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
                
            Deeplocal’s virtual office was created to visualize our company culture, achievements, activity, and build a sense of community. This project was completed by Deeplocal’s summer 2020 interns, Roshan Benefo, Elena Bremner and Tommy O’Halleran.
            
            </div>
            </div>
            </div>

        );
    };

}
