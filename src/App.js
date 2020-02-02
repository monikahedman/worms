import React, { Component } from "react";
import "./stylesheet.scss";
import P5Wrapper from "react-p5-wrapper";
import sketch2 from "./sketches/sketch";
import Modal from "react-modal";
import ColorPicker from "./ColorPicker";
import RangeSlider from "./RangeSlider";
import hexToRgba from "hex-to-rgba";

Modal.setAppElement("#root");

export default class App extends Component {
  light = "#737d80";
  med = "#454b4d";

  constructor() {
    super();
    this.setupRefs();
    this.setupVars();

    this.state = {
      isPlaying: true,
      frameRate: 0,
      showModal: false,
      isRecording: false,
      wormColor: "#fff",
      wormProps: {
        wormCount: 30,
        wormOpacity: 1,
        trailOpacity: 1,
        tailLength: 30,
        pathVar: 1
      },
      leaveTrail: false,
      fadeNose: false,
      shouldReset: 0,
      shouldSaveFile: false,
      canSaveFile: false
    };

    this.setupBindings();
  }

  /* all initial setup steps */

  setupVars() {
    this.tempVals = {
      wormCount: 30,
      wormOpacity: 1,
      trailOpacity: 1,
      tailLength: 30,
      pathVar: 1
    };
  }

  setupBindings() {
    this.changeFr = this.changeFr.bind(this);
    this.onPlayPauseClick = this.onPlayPauseClick.bind(this);
    this.handleOpenModal = this.handleOpenModal.bind(this);
    this.handleCloseModal = this.handleCloseModal.bind(this);
    this.handleColorChange = this.handleColorChange.bind(this);

    this.changeState = this.changeState.bind(this);
    this.changeTemp = this.changeTemp.bind(this);

    this.changeLeaveTrail = this.changeLeaveTrail.bind(this);
    this.changefadeNose = this.changefadeNose.bind(this);

    this.escFunction = this.escFunction.bind(this);
    this.resetSketch = this.resetSketch.bind(this);
    this.recordClick = this.recordClick.bind(this);
    this.saveFile = this.saveFile.bind(this);
    this.endFileSave = this.endFileSave.bind(this);
  }

  setupRefs() {
    this.sliderCountRef = React.createRef();
    this.inputCountRef = React.createRef();
    this.sliderWormOpacityRef = React.createRef();
    this.inputWormOpacityRef = React.createRef();
    this.sliderTrailOpacityRef = React.createRef();
    this.inputTrailOpacityRef = React.createRef();
    this.inputTailLengthRef = React.createRef();
    this.sliderTailLengthRef = React.createRef();
    this.inputPathVarRef = React.createRef();
    this.sliderPathVarRef = React.createRef();
  }

  /* modal functions */

  handleOpenModal(e) {
    this.setState({ showModal: true });
  }

  handleCloseModal(e) {
    e.stopPropagation();
    this.setState({ showModal: false });
  }

  /* handlers for stopping, starting, and recording the animation */
  changeFr(rate) {
    this.setState({
      frameRate: rate
    });
  }

  onPlayPauseClick(mode) {
    this.setState({
      isPlaying: mode
    });

    if (!mode) {
      this.recordClick(false);
    }
  }

  escFunction(event) {
    if (event.keyCode === 27) {
      this.onPlayPauseClick(false);
    } else if (event.keyCode === 80) {
      this.onPlayPauseClick(true);
    }
  }

  componentDidMount() {
    document.addEventListener("keydown", this.escFunction, false);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.escFunction, false);
  }

  recordClick(mode) {
    if (!mode && this.state.isRecording) {
      this.setState({
        canSaveFile: true
      });
    }

    this.setState({
      isRecording: mode
    });
  }

  resetSketch() {
    let newVal = this.state.shouldReset + 1;
    this.setState({
      shouldReset: newVal
    });
    this.onPlayPauseClick(true);
  }

  /* handlers for the variables */

  handleColorChange = (color, event) => {
    this.setState({ wormColor: color.hex });
  };

  changeTemp(variable, temp) {
    this.tempVals[variable] = temp;
  }

  changeState() {
    this.setState({
      wormProps: this.tempVals
    });
  }

  changeLeaveTrail() {
    let toSet = !this.state.leaveTrail;
    this.setState({
      leaveTrail: toSet
    });
  }

  changefadeNose() {
    let toSet = !this.state.fadeNose;
    this.setState({
      fadeNose: toSet
    });
  }

  saveFile() {
    this.setState({
      shouldSaveFile: true
    });
  }

  endFileSave() {
    this.setState({
      shouldSaveFile: false
    });

    this.setState({
      canSaveFile: false
    });
  }

  /* HTML is broken up for easy reading/editing */

  backgroundDiv() {
    return (
      <div className="background-info">
        <div style={{ textAlign: "center" }}>
          <h2>About This Project</h2>
        </div>
        <p className="about">
          Worms is a synesthesia-inspired project written in{" "}
          <a href="https://p5js.org/">p5js,</a> the Javascript version of
          Processing. Created for Living in Color, a course at RISD that
          examines the aesthetics of synesthesia vis-à-vis the innovation of
          Russian artist Wassily Kandinsky and Viennese composer Arnold
          Schoenberg between 1908 and the outbreak of World War I. Combining my
          knowledge of programming and visual arts, I created Worms to allow
          non-synesthetes to experience a slice of synesthesia. You can alter
          the color and visual appearance of the animation based on your
          response to what is on the screen or something that you listen to.
          Perlin noise, simplex noise, and circle packing are used to create
          these procedurally generated animations. This project was built on
          information learned from{" "}
          <a href="https://thecodingtrain.com">Coding Train</a>. Frames from
          this generator can be used to create abstract animations by exporting
          them and combining them in an external program, such as After effects.
          Explore your synesthetic side with Worms!
        </p>
        <div className="external-buttons">
          <div className="button external">
            <a  href="https://github.com/monikahedman/worms" target="_blank">Github</a>
          </div>
          <div className="button external">
            <a href="http://www.monikahedman.com" target="_blank">
              My website
            </a>
          </div>
        </div>
      </div>
    );
  }

  infoButtonDiv() {
    return (
      <div onClick={this.handleOpenModal} id="modal-container">
        <Modal
          isOpen={this.state.showModal}
          onRequestClose={this.handleCloseModal}
          shouldCloseOnOverlayClick={true}
          contentLabel="Info-Modal"
          className="Modal"
          overlayClassName="Overlay"
        >
          <div className="modal-inner">
            {this.backgroundDiv()}
            <div className="button-container">
              <div className="button close" onClick={this.handleCloseModal}>
                <p style={{ textAlign: "center" }}>Close</p>
              </div>
            </div>
          </div>
        </Modal>
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          x="0px"
          y="0px"
          viewBox="0 0 500 500"
        >
          <path
            className="st0"
            d="M0,0v500h500V0H0z M217.1,100.04c1.67-3.89,3.97-7.35,6.91-10.37c2.94-3.02,6.4-5.36,10.37-7.03
            c3.97-1.67,8.26-2.5,12.87-2.5c4.61,0,8.9,0.83,12.87,2.5c3.97,1.67,7.43,4.02,10.37,7.03c2.94,3.02,5.24,6.48,6.91,10.37
            c1.67,3.9,2.5,8.15,2.5,12.76c0,4.45-0.83,8.66-2.5,12.64c-1.67,3.97-3.97,7.47-6.91,10.49c-2.94,3.02-6.4,5.37-10.37,7.03
            c-3.98,1.67-8.27,2.5-12.87,2.5c-4.61,0-8.9-0.83-12.87-2.5c-3.97-1.67-7.43-4.01-10.37-7.03c-2.94-3.02-5.24-6.51-6.91-10.49
            c-1.67-3.97-2.5-8.19-2.5-12.64C214.6,108.19,215.43,103.93,217.1,100.04z M345.96,419.87H154.04V385.3h78.68V214.83h-70.81V180.5
            h112.77v204.8h71.28V419.87z"
          />
        </svg>
      </div>
    );
  }

  headerInfoDiv() {
    return (
      <>
        <h1 id="title">worms</h1>
        <h2 id="name" style={{ backgroundColor: "white" }}>
          by Monika Hedman
        </h2>
      </>
    );
  }

  resetSVG() {
    return (
      <svg
        version="1.1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="0 0 500 500"
        className="resetSVG"
        fill={this.light}
      >
        <path
          className="st0"
          d="M0,0v500h500V0H0z M250,453.6c-89.81,0-162.88-73.07-162.88-162.88v-20.36h40.72v20.36c0,67.37,54.79,122.16,122.16,122.16
	s122.16-54.79,122.16-122.16S317.37,168.56,250,168.56h-20.36V250l-101.8-101.8l101.8-101.8v81.44H250
	c89.81,0,162.88,73.07,162.88,162.88S339.81,453.6,250,453.6z"
        />
      </svg>
    );
  }

  recordSVG() {
    return (
      <svg
        version="1.1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="0 0 500 500"
        fill={this.state.isRecording ? this.light : this.med}
      >
        <path
          className="st0"
          d="M0,0v500h500V0H0z M452.24,369.65H47.76V130.35h404.47V369.65z M79.43,208.4h12.29l0.39,14.3
                          c4.59-5.51,9.11-9.51,13.57-11.98c4.46-2.47,8.95-3.71,13.49-3.71c8.04,0,14.13,2.6,18.28,7.81c4.15,5.21,6.07,12.93,5.76,23.19
                          h-13.6c0.15-6.8-0.84-11.74-2.98-14.8c-2.14-3.07-5.27-4.6-9.39-4.6c-1.8,0-3.62,0.32-5.45,0.97c-1.83,0.65-3.71,1.68-5.64,3.09
                          c-1.93,1.42-3.98,3.23-6.14,5.45c-2.16,2.22-4.48,4.9-6.96,8.04V286h-13.6V208.4z M228.84,243.1c0,1.91-0.03,3.5-0.08,4.79
                          c-0.05,1.29-0.13,2.5-0.23,3.63h-54.49c0,7.94,2.21,14.03,6.65,18.28s10.82,6.38,19.17,6.38c2.27,0,4.53-0.09,6.8-0.27
                          c2.27-0.18,4.46-0.42,6.57-0.73c2.11-0.31,4.14-0.66,6.07-1.04c1.93-0.39,3.72-0.81,5.37-1.28v11.05
                          c-3.66,1.03-7.79,1.87-12.41,2.51c-4.61,0.64-9.39,0.97-14.34,0.97c-6.65,0-12.37-0.9-17.16-2.71c-4.79-1.8-8.72-4.42-11.79-7.84
                          c-3.07-3.43-5.33-7.63-6.8-12.6c-1.47-4.97-2.2-10.6-2.2-16.89c0-5.46,0.79-10.63,2.36-15.5c1.57-4.87,3.86-9.15,6.88-12.83
                          c3.01-3.68,6.71-6.61,11.09-8.77c4.38-2.16,9.35-3.25,14.92-3.25c5.41,0,10.2,0.85,14.38,2.55c4.17,1.7,7.69,4.11,10.55,7.23
                          c2.86,3.12,5.02,6.91,6.49,11.36S228.84,237.59,228.84,243.1z M214.85,241.17c0.16-3.45-0.18-6.61-1-9.47
                          c-0.82-2.86-2.1-5.32-3.83-7.38c-1.73-2.06-3.88-3.67-6.45-4.83c-2.58-1.16-5.57-1.74-8.97-1.74c-2.94,0-5.62,0.57-8.04,1.7
                          c-2.42,1.13-4.51,2.73-6.26,4.79c-1.75,2.06-3.17,4.54-4.25,7.42c-1.08,2.89-1.75,6.06-2.01,9.51H214.85z M310.62,283.14
                          c-3.5,1.34-7.1,2.33-10.78,2.98c-3.68,0.64-7.49,0.97-11.4,0.97c-12.26,0-21.71-3.32-28.33-9.97c-6.62-6.65-9.93-16.36-9.93-29.14
                          c0-6.13,0.95-11.7,2.86-16.7c1.91-5,4.59-9.28,8.04-12.83c3.45-3.56,7.57-6.3,12.37-8.23c4.79-1.93,10.07-2.9,15.85-2.9
                          c4.02,0,7.78,0.28,11.29,0.85c3.5,0.57,6.85,1.5,10.05,2.78v12.83c-3.35-1.75-6.76-3.03-10.24-3.83c-3.48-0.8-7.07-1.2-10.78-1.2
                          c-3.45,0-6.71,0.66-9.78,1.97c-3.07,1.31-5.76,3.21-8.08,5.68c-2.32,2.47-4.15,5.49-5.49,9.04c-1.34,3.56-2.01,7.58-2.01,12.06
                          c0,9.38,2.28,16.4,6.84,21.06c4.56,4.66,10.89,7,18.98,7c3.66,0,7.2-0.41,10.63-1.24c3.43-0.82,6.74-2.06,9.93-3.71V283.14z
                          M424.92,250c0,21.67-17.57,39.24-39.24,39.24c-21.67,0-39.24-17.57-39.24-39.24s17.57-39.24,39.24-39.24
                          C407.35,210.76,424.92,228.33,424.92,250z"
        />
      </svg>
    );
  }

  playSVG() {
    return (
      <svg
        version="1.1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="0 0 500 500"
        fill={this.state.isPlaying ? this.light : this.med}
      >
        <path
          className="st0"
          d="M0,0v500h500V0H0z M117.23,426.21V250V73.79L382.77,250L117.23,426.21z"
        />
      </svg>
    );
  }

  stopSVG() {
    return (
      <svg
        version="1.1"
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        x="0px"
        y="0px"
        viewBox="0 0 500 500"
        fill={this.state.isPlaying ? this.med : this.light}
      >
        <path
          className="st0"
          d="M0,0v500h500V0H0z M377.16,377.16H122.84V122.84h254.32V377.16z"
        />
      </svg>
    );
  }

  fileOutputDiv() {
    return (
      <div className="save-wrapper">
        <div className="header-wrapper">
          <h2> Save Controls</h2>
        </div>

        <div
          className="saveFile saveText"
          style={{ opacity: this.state.canSaveFile ? 1 : 0.2 }}
          onClick={this.saveFile}
        >
          <p>Save File</p>
        </div>

        <div className="outputName saveText">
          <p>
            Files save in a .tar that holds all of the frames in the animation.
            The frames are numbered and saved as PNG files that you can then
            import into the software of your choosing.
          </p>
        </div>
      </div>
    );
  }

  rulesDiv() {
    return (
      <>
        <div className="header-wrapper">
          <h2>How to Use Worms</h2>
        </div>
        <p>1. Watch what happens</p>
        <p>2. Play with the variable controls</p>
        <p>3. Hit record to begin saving frames</p>
        <p>
          4. Frames can be downloaded and imported into other programs for
          manipulation
        </p>
      </>
    );
  }

  variableControlsDiv() {
    return (
      <>
        <div className="header-wrapper">
          <h2> Variable Controls</h2>
        </div>
        <div className="var-bounds var-grid">
          <div className="wormcount varcontrol var-grid-item">
            <RangeSlider
              inputRef={this.inputCountRef}
              sliderRef={this.sliderCountRef}
              changeVar={this.changeState}
              changeTempVal={this.changeTemp}
              propKey={"wormCount"}
              min={0}
              max={100}
              placeholder={30}
              title={"Worm Count"}
              step={1}
              value={this.tempVals["wormCount"]}
              isActive={true}
            />
          </div>
          <div className="wormopacity varcontrol">
            <RangeSlider
              inputRef={this.inputWormOpacityRef}
              sliderRef={this.sliderWormOpacityRef}
              changeVar={this.changeState}
              changeTempVal={this.changeTemp}
              propKey={"wormOpacity"}
              min={0}
              max={1}
              placeholder={1}
              title={"Worm Opacity"}
              step={0.01}
              value={this.tempVals["wormOpacity"]}
              isActive={true}
            />
          </div>
          <div className="leave-trail varcontrol">
            <p className="grid-box-item">Leave Trail</p>
            <input
              type="checkbox"
              id="leave-trail"
              checked={this.state.leaveTrail}
              onChange={this.changeLeaveTrail}
            ></input>
          </div>
          <div className="trail-opacity varcontrol">
            <RangeSlider
              inputRef={this.inputTrailOpacityRef}
              sliderRef={this.sliderTrailOpacityRef}
              changeVar={this.changeState}
              changeTempVal={this.changeTemp}
              propKey={"trailOpacity"}
              min={0}
              max={1}
              placeholder={1}
              title={"Trail Opacity"}
              step={0.01}
              value={this.tempVals["trailOpacity"]}
              isActive={this.state.leaveTrail}
            />
          </div>
          <div className="tail-bound-fade varcontrol">
            <div
              className="grid-box checkbox-var"
              style={{ justifyContent: "center" }}
            >
              <p className="grid-box-item">Fade Nose</p>
              <div className="grid-box-item">
                <input
                  type="checkbox"
                  id="fade-nose"
                  checked={this.state.fadeNose}
                  onChange={this.changefadeNose}
                ></input>
              </div>
            </div>
          </div>
          <div className="tail-length varcontrol">
            <RangeSlider
              inputRef={this.inputTailLengthRef}
              sliderRef={this.sliderTailLengthRef}
              changeVar={this.changeState}
              changeTempVal={this.changeTemp}
              propKey={"tailLength"}
              min={0}
              max={200}
              placeholder={30}
              title={"Tail Length"}
              step={1}
              value={this.tempVals["tailLength"]}
              isActive={true}
            />
          </div>
          <div className="tail-length varcontrol">
            <RangeSlider
              inputRef={this.inputPathVarRef}
              sliderRef={this.sliderPathVarRef}
              changeVar={this.changeState}
              changeTempVal={this.changeTemp}
              propKey={"pathVar"}
              min={1}
              max={10}
              placeholder={1}
              title={"Path Variation"}
              step={0.1}
              value={this.tempVals["pathVar"]}
              isActive={true}
            />
          </div>
          <div className="color varcontrol">{this.colorPicker()}</div>
        </div>
      </>
    );
  }

  colorPicker() {
    return (
      <div className="colorPicker-bound">
        <p className="color-title">Color</p>
        <div className="picker">
          <ColorPicker
            color={this.state.wormColor}
            onChangeComplete={this.handleColorChange}
            onChange={this.handleColorChange}
          />
        </div>
        <div className="current-color">
          <div
            className="box"
            style={{ background: this.state.wormColor }}
          ></div>
        </div>
      </div>
    );
  }

  playbackDiv() {
    return (
      <>
        <div className="header-wrapper">
          <h2> Playback Controls</h2>
        </div>
        <div className="buttons">
          <span
            className="playbackButton"
            onClick={() => this.onPlayPauseClick(true)}
          >
            {this.playSVG()}
            <div className="pbLabel">Play</div>
          </span>
          <span
            className="playbackButton"
            onClick={() => this.onPlayPauseClick(false)}
          >
            {this.stopSVG()}
            <div className="pbLabel">Stop</div>
          </span>
          <span
            className="playbackButton"
            onClick={() => this.recordClick(!this.state.isRecording)}
          >
            {this.recordSVG()}
            <div className="pbLabel">Record</div>
          </span>
          <span className="playbackButton" onClick={this.resetSketch}>
            {this.resetSVG()}
            <div className="pbLabel resetSVG">Reset</div>
          </span>
        </div>
        <div className="frameRate">
          {" "}
          Frame Rate (fps): {this.state.frameRate}
        </div>
      </>
    );
  }

  bottomGrid() {
    return (
      <div className="playback-grid">
        <div className="playback smallGrid">{this.playbackDiv()}</div>
        <div className="save smallGrid save">{this.fileOutputDiv()}</div>
      </div>
    );
  }

  rgbaConverter() {
    var rgba = hexToRgba(this.state.wormColor);
    var rgbaArr = rgba.split(",");
    for (var i = 0; i < rgbaArr.length; i++) {
      rgbaArr[i] = rgbaArr[i].replace(/[^\d.-]/g, "");
    }
    return rgbaArr;
  }

  sketchDiv() {
    let rgbaArr = this.rgbaConverter();

    return (
      <div className="sketch-box">
        <P5Wrapper
          sketch={sketch2} //0
          playing={this.state.isPlaying} //1
          changeFr={this.changeFr} //2
          color={rgbaArr} //3
          wormCount={this.state.wormProps.wormCount} //4
          wormOpacity={this.state.wormProps.wormOpacity} //5
          leaveTrail={this.state.leaveTrail} //6
          trailOpacity={this.state.wormProps.trailOpacity} //7
          fadeNose={this.state.fadeNose} //8
          maxLength={this.state.wormProps.tailLength} //9
          pathVar={this.state.wormProps.pathVar} //10
          resetInt={this.state.shouldReset} // 11
          isRecording={this.state.isRecording} //12
          shouldSave={this.state.shouldSaveFile} //13
          endFileSave={this.endFileSave} //15
        ></P5Wrapper>
      </div>
    );
  }

  render() {
    return (
      <div className="App">
        <div className="info-button">{this.infoButtonDiv()}</div>
        <div className="App-header">{this.headerInfoDiv()}</div>
        <div className="body">
          <div className="grid">
            <div className="var-controls grid1">
              {this.variableControlsDiv()}
            </div>
            <div className="window grid2">{this.sketchDiv()}</div>
            <div className="playback-controls grid3">{this.bottomGrid()}</div>
            <div className="info grid4">{this.rulesDiv()}</div>
          </div>
        </div>
      </div>
    );
  }
}
