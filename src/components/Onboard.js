import React from 'react';
import Zoom from '../assets/images/zoom.png'
import Rotate from '../assets/images/rotate.png'
import Hover from '../assets/images/hover.png'
import dlLogo from '../assets/images/dlWhiteLogo.png'
import "./Onboard.css"

export default class Onboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }
    render() {
        return (
            <div id = "onboardContainer">
                <div id = "text">
                    <table id = "textTable" >
                    <tbody>
                    <tr>
                    <td><img id = "rotate" src={Rotate} alt="" width="23"/></td>
                    <td>Rotate: left click and drag</td>
                    <td><img src={Zoom} alt="" width="23"/></td>
                    <td>Zoom: scroll</td>
                    <td><img src={Hover} alt="" width="23"/></td>
                    <td>Explore: hover</td>
                    </tr>
                    </tbody>
                    </table>
                </div>
                <div id = "logo">
                    <img src={dlLogo} alt="" width="50"/>
                </div>
                <div id = "tlText">
                Drag the timeline to go back in time.
                </div>
            </div>
            );
        };
    }