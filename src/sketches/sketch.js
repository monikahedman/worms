export default function sketch(p){
    let canvas;
    let color = 240;
    let fr = 60;
    let realFr = 0;
    let isPlaying = true;
    let props = {};
    let propsList = [];

    // main setup function
    p.setup = () => {
      p.createCanvas(300, 300);
      p.frameRate(fr);
    };

    // main method for drawing
    p.draw = () => {
      if (p.mouseX === 0 && p.mouseY === 0) return;
      // p.fill(255, 0, 0);
      p.noStroke();
      p.background(color);
      p.ellipse(p.mouseX, p.mouseY, 100, 100);
      // p.frameRate(fr);

      realFr = Math.floor(p.frameRate());
      p.writeFramerate();
    };

    p.writeProps = function (_props) {
      props = _props;
      propsList = Object.entries(props);
    }

    p.pausePlay = function() {
      p.frameRate(fr);
    }

    p.writeFramerate = function() {
      let fn = propsList[2][1];
      fn(realFr)
    }

    p.myCustomRedrawAccordingToNewPropsHandler = function (props) {

      // alters framerate if play or paused is clicked
      if(isPlaying !== props.playing){
        isPlaying = props.playing;
        if(props.playing){
          fr=60
          realFr = p.frameRate();
        }else{
          fr=0
          realFr = 0;
          p.writeFramerate();
        }
        p.pausePlay();
      }

      // updates props variable in sketch
      p.writeProps(props);
    };
}