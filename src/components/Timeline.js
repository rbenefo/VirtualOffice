import React from 'react';

import "./Timeline.css"
var Draggable = require ('draggable');

// console.log(Draggable)
export default class Timeline extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }

        this.createTimeline = this.createTimeline.bind(this);

    }

    componentDidMount() {
        this.createTimeline();
      }
    
    createTimeline() {
        var self  = this;

        var timelineWrapper = document.getElementById("timelineWrapper");
        var element = document.createElement('div');
        element.className = "ball";
        element.style.left="680px"
        var timelineLine = document.createElement('hr');
        timelineLine.className = "timelineLine";
        var container = document.createElement('div');
        container.id = "timelineContainer";
        container.appendChild(element)
        container.appendChild(timelineLine)

        var options = {
            limit: container,
            setCursor: true,
            onDragStart: function (element, x, y) {
                self.props.timelineActive(1);
                // console.log(self.props.timelineActive)
                // labelX.innerHTML = x;
            },
            onDrag: function(element, x, y) {
                // console.log("x")
                // console.log(x)

                self.props.timelineTime(x/680);
            },
            onDragEnd: function(){
                self.props.timelineActive(0);


                element.style.left= "680px";
                element.classList.add("returnToOrigin");
                element.addEventListener("transitionend", removeReturnToOrigin);
                // console.log(self.props.timelineActive)

            }
        };
        timelineWrapper.appendChild(container)        

        new Draggable(element, options); 
        function removeReturnToOrigin(event) {
            event.target.classList.remove("returnToOrigin")

        }
        // console.log("timeline")
        // console.log(timeline)

    }
    render() {
        return (
            <div id = "roof">
                <div id = "timelineWrapper">


                </div>
            </div>
        );
    };

}
