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
                        <div id="projectDescription">  
                            <div id ="virtualOffice">Virtual Office</div>
                            <br></br><br></br>This project was made by 
                            Tommy O'Halleran, Elena Bremner, and Roshan Benefo to 
                            create a community at Deeplocal. <br></br><br></br> <b> Tools:</b> Three.js, Blender, 3ds Max            
                        </div>
                    </div>
                </div>
           
        );
    };

}
