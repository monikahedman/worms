import React, { Component } from "react";
import "./rangeslider.scss";

export default class RangeSlider extends React.Component {
  constructor(props) {
    super(props);
    this.timeout = null;
    

    this.setupHandlers = this.setupHandlers.bind(this);
    this.sliderChange = this.sliderChange.bind(this);
    this.inputChange = this.inputChange.bind(this);
  }

  componentDidMount = () => {
    this.setupHandlers();
  };

  setupHandlers() {
    let _this = this;

    this.props.inputRef.current.addEventListener("keyup", function(e) {
      clearTimeout(this.timeout);
      this.timeout = setTimeout(function() {
        _this.props.changeVar();
      }, 500);
    });

    this.props.sliderRef.current.addEventListener("mouseup", function(e) {
      _this.props.changeVar();
    });
  }
  cap(val) {
    val = val > this.props.max ? this.props.max : val;
    val = val < this.props.min ? this.props.min : val;
    return val;
  }

  round(val){
    let mult  = 1/this.props.step;
    val *= mult;
    val = Math.round(val);
    return val/mult;
  }

  sliderChange(){
    let val = this.props.sliderRef.current.value;
    val = this.cap(val);
    val = this.round(val);

    this.props.inputRef.current.value = val;
    this.props.sliderRef.current.value = val;
    this.props.changeTempVal(this.props.propKey, val);
  }

  inputChange() {
    let val = this.props.inputRef.current.value;
    val = this.cap(val);
    val = this.round(val);

    this.props.inputRef.current.value = val;
    this.props.sliderRef.current.value = val;
    this.props.changeTempVal(this.props.propKey, val);
  }

  render() {
    return (
      <div className="rangeSlider-bound">
        <p>{this.props.title}</p>
        <div className = "inputs">
        <input
          type="range"
          step={this.props.step}
          min={this.props.min}
          max={this.props.max}
          onChange={this.sliderChange}
          ref={this.props.sliderRef}
          placeholder={this.props.placeholder}
          value={this.props.value}
        ></input>
        <div>
          <input
            className="number-disp"
            type="number"
            step={this.props.step}
            min={this.props.min}
          max={this.props.max}
            onChange={this.inputChange}
            ref={this.props.inputRef}
            placeholder={this.props.placeholder}
            value={this.props.value}
          ></input>
          </div>
          
        </div>
        <p className="disabled" style={{visibility: this.props.isActive ? "hidden" : "visible"}}> Disabled</p>
      </div>
    );
  }
}
