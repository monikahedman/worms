// import CCapture from 'hex-to-rgba';
import CCapture from "../../node_modules/ccapture.js/src/CCapture.js"

export default function sketch(p) {
  let fr = 60;
  let realFr = 0;
  let isPlaying = true;
  let props = {};
  let propsList = [];
  let resetCount = 0;
  let isRecording = false;

  var capturer;

  // var capturer = new CCapture( { format: 'png' } );
  // console.log(capturer)

  // VARIABLE
  // number of lines in the scene
  // default is 30
  var particleCount = 30;

  // indicates whether the tail of the worm
  // should be bounded
  var boundTail = true;

  // if worm should leave a trail or not
  var leaveTrail = false;

  //line vars
  const flowIncrement = 0.1;
  const flowScl = 20;
  var flowCols, flowRows;

  // VARIABLE
  //higher = curvier path. default is 1
  var pathVariation = 1;
  //all particles in the scene
  var particles = [];

  //all vectors in the scene
  var flowField = [];
  var flowZoff = 0;
  // VARIABLE
  // used to decide how fast the flow field should change
  // higher number = faster speed
  var flowSpeed = 0.003;

  // total width and height of the canvas
  var totheight = 480;
  var totwidth = 640;

  //variables for the low res simplex noise
  var simplexCols;
  var simplexRows;
  var squares;

  //holds all circles for circle packing
  var circles;
  //available spots for circle regeneration (r, c)
  var spotsR;
  var spotsC;

  // VARIABLE
  // how often the simplex noise should change
  // 1 means it moves every frame
  const frameOff = 1;

  let zoff = 0;
  let simplexNoise;

  // could maybe be variable?
  let simplexScl = 80;

  // holds main canvas
  let canvas;

  // holds the circle packing pixel data
  let overlay;

  let wormTrails;

  // circle radius that circle packs can generate in.
  // circles can be generated in this radius with that
  // circle centered at the center of a square created
  // by simplex noise
  var circleRadius = simplexScl * 1.5;

  //holds all the simplex noise data
  var simplexData = [simplexCols * simplexRows];

  // list of pixel data for the circles
  let circleList;

  p.setup = () => {
    // sets up the canvas, the overlay that holds the circle packing data,
    // and the simplex noise generator
    canvas = p.createCanvas(totwidth, totheight).canvas;
    overlay = p.createGraphics(640, 480);
    wormTrails = p.createGraphics(640, 480);
    simplexNoise = new OpenSimplexNoise(Date.now());

    // sets up what is needed to create low-res simplex noise
    simplexCols = Math.floor(p.width / simplexScl);
    simplexRows = Math.floor(p.height / simplexScl);
    squares = [simplexRows * simplexCols];

    // initializes all arrays of data
    circles = [];
    spotsR = [];
    spotsC = [];
    circleList = [];

    // sets up rows and columns for the flow field
    flowRows = Math.floor(p.height / flowScl);
    flowCols = Math.floor(p.width / flowScl);

    // logistical
    // fr = createP("");
    p.pixelDensity(1);
    overlay.pixelDensity(1);
    wormTrails.pixelDensity(1);

    p.frameRate(60);
    capturer = new CCapture({ format: 'png', framerate: 12 });
    // capturer.start();
  };

  // writes props to a list that is accessible
  p.writeProps = function(_props) {
    props = _props;
    propsList = Object.entries(props);
  };

  p.pausePlay = function() {
    p.frameRate(fr);
  };

  // writes framerate to indicator
  p.writeFramerate = function() {
    let fn = propsList[2][1];
    fn(realFr);
  };

  p.myCustomRedrawAccordingToNewPropsHandler = function(props) {
    // alters framerate if play or paused is clicked
    if (isPlaying !== props.playing) {
      isPlaying = props.playing;
      if (props.playing) {
        fr = 60;
        realFr = p.frameRate();
      } else {
        fr = 0;
        realFr = 0;
        p.writeFramerate();
      }
      p.pausePlay();
    }

    if (particleCount !== props.wormCount) {
      particleCount = props.wormCount;
    }

    if (leaveTrail != props.leaveTrail) {
      leaveTrail = props.leaveTrail;
      wormTrails.clear();
    }

    if (pathVariation !== props.pathVar) {
      pathVariation = props.pathVar;
    }

    if(resetCount !== props.resetInt){
      p.reset();
      resetCount= props.resetInt;
    }

    if(isRecording !== props.isRecording){
      isRecording = props.isRecording;
      if(isRecording){
        capturer.start();
      }
      else{
      //   console.log('finished recording.');
        capturer.stop();
      capturer.save();
      }
    }

    // updates props variable in sketch
    p.writeProps(props);
  };

  p.reset=function() {
    p.setup();
  }

  // finds all the spots in the simplex noise that circles
  // could generate in. if the color is white, the spot is
  // available.
  p.getSquareSpots = function() {
    // loops through row and col of square
    for (var r = 0; r < simplexRows; r++) {
      for (var c = 0; c < simplexCols; c++) {
        var index = r * simplexCols + c;

        //if the square is white add it to the list
        if (squares[index] > 0) {
          spotsR.push(r);
          spotsC.push(c);
        }
      }
    }
  };

  p.getRandomInt = function(max) {
    return Math.floor(Math.random() * Math.floor(max));
  };

  // picks a random spot for the center of the circle to begin
  p.pickRandSpot = function() {
    //random index for row and col in the white squares
    // spotsR and spotsC are the same length (indices correlate)
    var randIndex = p.getRandomInt(spotsR.length);
    var randPoint = p.pointInCircle();
    var rowRand = randPoint[0];
    var colRand = randPoint[1];

    // offset based on the chosen square
    var rowOffset = spotsR[randIndex] * simplexScl;
    var colOffset = spotsC[randIndex] * simplexScl;
    // final row and column calculated
    var finalRow = rowRand + rowOffset;
    var finalCol = colRand + colOffset;

    var vec = [finalCol, finalRow];

    return vec;
  };

  // finds random point in circle with even distribution.
  // a truly random radius packs points more closely in the
  // center and are more distributed as you move outwards.
  p.pointInCircle = function() {
    var R = circleRadius;
    var centerX = simplexScl / 2;
    var centerY = simplexScl / 2;
    var r = R * Math.sqrt(Math.random());
    var theta = Math.random() * 2 * Math.PI;

    var x = centerX + r * Math.cos(theta);
    var y = centerY + r * Math.sin(theta);

    return [x, y];
  };

  // creates a simplex noise pattern. Frame offset
  // is used to delay the regeneration of noise
  p.createSimplexFrame = function() {
    var shouldRecreate = p.frameCount % frameOff == 0;

    if (shouldRecreate) {
      var xoff = 0;
      for (let c = 0; c < simplexCols; c++) {
        var yoff = 0;
        for (let r = 0; r < simplexRows; r++) {
          var n = simplexNoise.noise3D(xoff, yoff, zoff);
          p.strokeWeight(0);
          var color = n > 0 ? 255 : 0;

          var index = r * simplexCols + c;
          squares[index] = color;

          yoff += simplexScl;
        }
        xoff += simplexScl;
      }
      zoff += 0.003;
    }
  };

  // called every draw method to create and grow circles
  p.circlePack = function() {
    overlay.background(0);
    p.frameRate(20);

    var total = 5;
    var count = 0;
    var attempts = 0;

    // makes sure it does not infinitely
    // look for spots
    while (count < total) {
      var newC = p.newCircle();
      if (newC !== null) {
        circles.push(newC);
        count++;
      }
      attempts++;
      if (attempts > 100) {
        p.noLoop();
        console.log("finished");
        break;
      }
    }

    for (var i = 0; i < circles.length; i++) {
      var circle = circles[i];

      if (circle.growing) {
        if (circle.edges()) {
          circle.growing = false;
        } else {
          for (var j = 0; j < circles.length; j++) {
            var other = circles[j];
            if (circle !== other) {
              var d = p.distance(circle.x, circle.y, other.x, other.y);
              var distance = circle.r + other.r;

              if (d < distance - 10) {
                circle.growing = false;
                break;
              }
            }
          }
        }
      }

      circle.show();
      circle.grow();
    }
  };

  p.distance = function(x1, y1, x2, y2) {
    var xs = x2 - x1;
    var ys = y2 - y1;

    xs *= xs;
    ys *= ys;

    return Math.sqrt(xs + ys);
  };

  // creates a new circle in a random, valid spot
  p.newCircle = function() {
    var vec = p.pickRandSpot();
    var x = vec[0];
    var y = vec[1];

    var valid = true;
    for (var i = 0; i < circles.length; i++) {
      var circle = circles[i];
      var d = p.distance(x, y, circle.x, circle.y);
      if (d < circle.r) {
        valid = false;
        break;
      }
    }
    if (valid) {
      return new p.Circle(x, y, overlay);
    } else {
      return null;
    }
  };

  // checks to see if the circle is within the acceptable distance from
  // a white square
  p.withinDistance = function(rowToCompare, colToCompare, pointX, pointY) {
    p.rowCenter = rowToCompare * simplexScl + simplexScl / 2;
    p.colCenter = colToCompare * simplexScl + simplexScl / 2;

    var distance = Math.floor(
      Math.abs(p.distance(p.rowCenter, p.colCenter, pointX, pointY))
    );
    if (distance < circleRadius) {
      return true;
    }
    return false;
  };

  // clears circles that are no longer in a viable space
  p.clearCircles = function() {
    overlay.background(0);
    var newCircles = [];
    for (var i = 0; i < circles.length; i++) {
      var currentCircle = circles[i];
      var centerX = Math.floor(currentCircle.x);
      var centerY = Math.floor(currentCircle.y);

      var x = Math.floor(centerX / simplexScl);
      var y = Math.floor(centerY / simplexScl);
      var index = y * simplexCols + x;
      if (squares[index] > 0) {
        newCircles.push(currentCircle);
        continue;
      }

      //check if its within radius of other squares around it

      var squareCol = x;
      var squareRow = y;

      var colToCompare, rowToCompare, rowCenter, colCenter;

      // square up
      colToCompare = squareCol;
      rowToCompare = squareRow - 1;

      if (rowToCompare >= 0) {
        //compare
        if (p.withinDistance(rowToCompare, colToCompare, centerX, centerY)) {
          newCircles.push(currentCircle);
          continue;
        }
      }

      // square to left
      colToCompare = squareCol - 1;
      rowToCompare = squareRow;

      if (colToCompare >= 0) {
        //compare
        if (p.withinDistance(rowToCompare, colToCompare, centerX, centerY)) {
          newCircles.push(currentCircle);
          continue;
        }
      }

      // square to right
      colToCompare = squareCol + 1;
      rowToCompare = squareRow;

      if (colToCompare < simplexCols) {
        //compare
        if (p.withinDistance(rowToCompare, colToCompare, centerX, centerY)) {
          newCircles.push(currentCircle);
          continue;
        }
      }

      // square bottom
      colToCompare = squareCol;
      rowToCompare = squareRow + 1;

      if (rowToCompare < simplexRows) {
        //compare
        if (p.withinDistance(rowToCompare, colToCompare, centerX, centerY)) {
          newCircles.push(currentCircle);
          continue;
        }
      }
    }
    circles = newCircles;
  };

  // hides all data that does not fall within
  // any of the circle packs
  p.revealCircles = function() {
    p.loadPixels();

    for (var r = 0; r < p.height; r++) {
      for (var c = 0; c < p.width; c++) {
        var index = (r * p.width + c) * 4;

        if (circleList[index] < 255) {
          p.pixels[index] = 0;
          p.pixels[index + 1] = 0;
          p.pixels[index + 2] = 0;
          p.pixels[index + 3] = 255;
        }
      }
    }

    p.updatePixels();
  };

  p.fromAngle = function(angle) {
    return [Math.cos(angle), Math.sin(angle)];
  };

  // draws worms based on the perlin noise flow field
  p.drawLines = function() {
    p.background(0);
    var yoff = 0;
    for (var y = 0; y < flowRows; y++) {
      var xoff = 0;
      for (var x = 0; x < flowCols; x++) {
        var index = x + y;
        var noiseAngle =
          p.noise(xoff, yoff, flowZoff) * Math.PI * 2 * pathVariation;
        var vec1 = p.fromAngle(noiseAngle);

        var vec = p.createVector(vec1[0], vec1[1]);

        flowField[index] = vec;
        xoff += flowIncrement;
      }
      yoff += flowIncrement;

      // higher number = faster speed
      flowZoff += flowSpeed;
    }

    for (var i = 0; i < particles.length; i++) {
      particles[i].follow(flowField);
      particles[i].update();
      particles[i].show();
      particles[i].edges();
    }
    wormTrails = particles[0].getTrails();
  };

  // gets all data from the overlay into the circle list
  // so it can be compared
  p.buildCircleList = function() {
    circleList = [];

    overlay.loadPixels();

    for (var r = 0; r < p.height; r++) {
      for (var c = 0; c < p.width; c++) {
        var index = (r * p.width + c) * 4;
        circleList.push(overlay.pixels[index]);
        circleList.push(overlay.pixels[index + 1]);
        circleList.push(overlay.pixels[index + 2]);
        circleList.push(overlay.pixels[index + 3]);
      }
    }

    overlay.updatePixels();
  };

  // generates particles based on the number
  // of intended particles or deletes them
  p.createParticles = function() {
    if (particles.length < particleCount) {
      particles.push(new p.Particle(wormTrails));
    }
    if (particles.length > particleCount) {
      particles.pop();
    }
  };

  p.draw = () => {
    p.createSimplexFrame();
    p.getSquareSpots();
    p.clearCircles();
    p.circlePack();
    p.buildCircleList();
    p.createParticles();
    p.drawLines();

    // if a trail is being left or the tail is unbounded
    // then show the alternate canvas. Unbounded tails are the same as trail     // opacity set to 100%
    if (leaveTrail || !boundTail) {
      p.image(wormTrails, 0, 0);
    }
    p.revealCircles();

    realFr = Math.floor(p.frameRate());
    p.writeFramerate();

    if(isRecording) {
      capturer.capture(document.getElementById('defaultCanvas0'));
    }
  };

  p.Circle = function(x, y, canvas) {
    this.x = x;
    this.y = y;
    this.r = 1;
    this.growing = true;

    this.grow = function() {
      if (this.growing) {
        this.r += 1;
      }
    };

    this.show = function() {
      var circleColor = 255;
      canvas.stroke(circleColor);
      canvas.strokeWeight(0);
      canvas.fill(circleColor);

      canvas.ellipse(this.x, this.y, this.r * 2, this.r * 2);
    };

    this.edges = function() {
      return (
        this.x + this.r >= p.width ||
        this.x - this.r <= 0 ||
        this.y + this.r >= p.height ||
        this.y - this.r <= 0
      );
    };
  };

  p.startPosition = function() {
    var x, y;
    var seedPos = this.getRandomInt(4);
    if (seedPos == 0) {
      x = p.getRandomInt(p.width);
      y = 0;
    }
    if (seedPos == 1) {
      x = 0;
      y = p.getRandomInt(p.height);
    }
    if (seedPos == 2) {
      x = p.getRandomInt(p.width);
      y = p.height - 1;
    }
    if (seedPos == 3) {
      x = p.width - 1;
      y = p.getRandomInt(p.height);
    }
    return [x, y];
  };

  p.Particle = function(canvas) {
    var start = p.startPosition();
    // VARIABLE, 200 is max possible length for the tail
    this.maxLength = propsList[9][1];
    this.trailCanvas = canvas;
    this.pos = p.createVector(start[0], start[1]);
    this.prevPos = this.pos.copy();
    this.vel = p.createVector(0, 0);
    this.acc = p.createVector(0, 0);
    this.maxspeed = 4;
    // VARIABLE
    this.opacity = propsList[5][1] * 255;
    // VARIABLE
    this.trailOpacity = propsList[7][1] * 255;
    // VARIABLE
    this.color = [
      propsList[3][1][0],
      propsList[3][1][1],
      propsList[3][1][2],
      this.opacity
    ];
    this.history = [];
    this.fadeNose = propsList[8][1];

    this.update = function() {
      this.vel.add(this.acc);
      this.vel.limit(this.maxspeed);
      this.pos.add(this.vel);
      this.acc.mult(0);

      let v = p.createVector(this.pos.x, this.pos.y);
      this.history.push(v);
      if (this.history.length > this.maxLength) {
        let dif = this.history.length - this.maxLength;
        let toCut = Math.round(dif / 6);
        this.history.splice(0, toCut);
      }
      this.color = [
        propsList[3][1][0],
        propsList[3][1][1],
        propsList[3][1][2],
        this.opacity
      ];
      this.opacity = propsList[5][1] * 255;
      this.trailOpacity = propsList[7][1] * 255;
      this.fadeNose = propsList[8][1];
      this.maxLength = propsList[9][1];
    };

    this.applyForce = function(force) {
      this.acc.add(force);
    };

    this.show = function() {
      let opacity = this.opacity;
      let percentOpacity = 1 / this.history.length;
      let toSub = opacity * percentOpacity;
      p.strokeWeight(1);

      p.beginShape();
      for (let i = 0; i < this.history.length; i++) {
        let pos = this.history[i];
        if (this.fadeNose) {
          opacity -= toSub;
        }
        // if index is in under max length in history
        p.stroke(this.color[0], this.color[1], this.color[2], opacity);
        p.noFill();
        p.vertex(pos.x, pos.y);
        p.endShape();
      }

      this.handleTrails();
    };

    this.handleTrails = function() {
      this.trailCanvas.strokeWeight(1);
      this.trailCanvas.stroke(
        this.color[0],
        this.color[1],
        this.color[2],
        this.trailOpacity
      );
      this.trailCanvas.noFill();
      this.trailCanvas.line(
        this.pos.x,
        this.pos.y,
        this.prevPos.x,
        this.prevPos.y
      );
      this.updatePrev();
    };

    this.updatePrev = function() {
      this.prevPos.x = this.pos.x;
      this.prevPos.y = this.pos.y;
    };

    this.getTrails = function() {
      return this.trailCanvas;
    };

    this.follow = function(vectors) {
      var x = Math.floor(this.pos.x / simplexScl);
      var y = Math.floor(this.pos.y / simplexScl);
      var index = x + y * simplexCols;
      var force = vectors[index];
      this.applyForce(force);
    };

    this.edges = function() {
      var vec = this.history[0];
      if (vec.x >= p.width - 1) {
        this.reset();
      }
      if (vec.x <= 0) {
        this.reset();
      }
      if (vec.y >= p.height - 1) {
        this.reset();
      }
      if (vec.y <= 0) {
        this.reset();
      }
    };

    this.reset = function() {
      var start = p.startPosition();
      this.pos = p.createVector(start[0], start[1]);
      this.vel = p.createVector(0, 0);
      this.acc = p.createVector(0, 0);
      this.maxspeed = 4;
      this.history = [];
      this.updatePrev();
    };
  };

  // Plain JS version of Josh Forisha's implementation of opensimplex noise
  // https://github.com/joshforisha/open-simplex-noise-js
  // This version is currently posted here https://gist.github.com/PARC6502/85c99c04c9b3c6ae52c3c27605b4df0a
  // Will probably be cleaned up and have its own repo, at some point...

  var OpenSimplexNoise;

  (function() {
    var constants_1 = {
      NORM_2D: 1.0 / 47.0,
      NORM_3D: 1.0 / 103.0,
      NORM_4D: 1.0 / 30.0,
      SQUISH_2D: (Math.sqrt(2 + 1) - 1) / 2,
      SQUISH_3D: (Math.sqrt(3 + 1) - 1) / 3,
      SQUISH_4D: (Math.sqrt(4 + 1) - 1) / 4,
      STRETCH_2D: (1 / Math.sqrt(2 + 1) - 1) / 2,
      STRETCH_3D: (1 / Math.sqrt(3 + 1) - 1) / 3,
      STRETCH_4D: (1 / Math.sqrt(4 + 1) - 1) / 4,
      base2D: [[1, 1, 0, 1, 0, 1, 0, 0, 0], [1, 1, 0, 1, 0, 1, 2, 1, 1]],
      base3D: [
        [0, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1],
        [2, 1, 1, 0, 2, 1, 0, 1, 2, 0, 1, 1, 3, 1, 1, 1],
        [1, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 2, 1, 1, 0, 2, 1, 0, 1, 2, 0, 1, 1]
      ],
      base4D: [
        [
          0,
          0,
          0,
          0,
          0,
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1
        ],
        [
          3,
          1,
          1,
          1,
          0,
          3,
          1,
          1,
          0,
          1,
          3,
          1,
          0,
          1,
          1,
          3,
          0,
          1,
          1,
          1,
          4,
          1,
          1,
          1,
          1
        ],
        [
          1,
          1,
          0,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          1,
          0,
          0,
          1,
          0,
          1,
          0,
          0,
          0,
          1,
          2,
          1,
          1,
          0,
          0,
          2,
          1,
          0,
          1,
          0,
          2,
          1,
          0,
          0,
          1,
          2,
          0,
          1,
          1,
          0,
          2,
          0,
          1,
          0,
          1,
          2,
          0,
          0,
          1,
          1
        ],
        [
          3,
          1,
          1,
          1,
          0,
          3,
          1,
          1,
          0,
          1,
          3,
          1,
          0,
          1,
          1,
          3,
          0,
          1,
          1,
          1,
          2,
          1,
          1,
          0,
          0,
          2,
          1,
          0,
          1,
          0,
          2,
          1,
          0,
          0,
          1,
          2,
          0,
          1,
          1,
          0,
          2,
          0,
          1,
          0,
          1,
          2,
          0,
          0,
          1,
          1
        ]
      ],
      gradients2D: [5, 2, 2, 5, -5, 2, -2, 5, 5, -2, 2, -5, -5, -2, -2, -5],
      gradients3D: [
        -11,
        4,
        4,
        -4,
        11,
        4,
        -4,
        4,
        11,
        11,
        4,
        4,
        4,
        11,
        4,
        4,
        4,
        11,
        -11,
        -4,
        4,
        -4,
        -11,
        4,
        -4,
        -4,
        11,
        11,
        -4,
        4,
        4,
        -11,
        4,
        4,
        -4,
        11,
        -11,
        4,
        -4,
        -4,
        11,
        -4,
        -4,
        4,
        -11,
        11,
        4,
        -4,
        4,
        11,
        -4,
        4,
        4,
        -11,
        -11,
        -4,
        -4,
        -4,
        -11,
        -4,
        -4,
        -4,
        -11,
        11,
        -4,
        -4,
        4,
        -11,
        -4,
        4,
        -4,
        -11
      ],
      gradients4D: [
        3,
        1,
        1,
        1,
        1,
        3,
        1,
        1,
        1,
        1,
        3,
        1,
        1,
        1,
        1,
        3,
        -3,
        1,
        1,
        1,
        -1,
        3,
        1,
        1,
        -1,
        1,
        3,
        1,
        -1,
        1,
        1,
        3,
        3,
        -1,
        1,
        1,
        1,
        -3,
        1,
        1,
        1,
        -1,
        3,
        1,
        1,
        -1,
        1,
        3,
        -3,
        -1,
        1,
        1,
        -1,
        -3,
        1,
        1,
        -1,
        -1,
        3,
        1,
        -1,
        -1,
        1,
        3,
        3,
        1,
        -1,
        1,
        1,
        3,
        -1,
        1,
        1,
        1,
        -3,
        1,
        1,
        1,
        -1,
        3,
        -3,
        1,
        -1,
        1,
        -1,
        3,
        -1,
        1,
        -1,
        1,
        -3,
        1,
        -1,
        1,
        -1,
        3,
        3,
        -1,
        -1,
        1,
        1,
        -3,
        -1,
        1,
        1,
        -1,
        -3,
        1,
        1,
        -1,
        -1,
        3,
        -3,
        -1,
        -1,
        1,
        -1,
        -3,
        -1,
        1,
        -1,
        -1,
        -3,
        1,
        -1,
        -1,
        -1,
        3,
        3,
        1,
        1,
        -1,
        1,
        3,
        1,
        -1,
        1,
        1,
        3,
        -1,
        1,
        1,
        1,
        -3,
        -3,
        1,
        1,
        -1,
        -1,
        3,
        1,
        -1,
        -1,
        1,
        3,
        -1,
        -1,
        1,
        1,
        -3,
        3,
        -1,
        1,
        -1,
        1,
        -3,
        1,
        -1,
        1,
        -1,
        3,
        -1,
        1,
        -1,
        1,
        -3,
        -3,
        -1,
        1,
        -1,
        -1,
        -3,
        1,
        -1,
        -1,
        -1,
        3,
        -1,
        -1,
        -1,
        1,
        -3,
        3,
        1,
        -1,
        -1,
        1,
        3,
        -1,
        -1,
        1,
        1,
        -3,
        -1,
        1,
        1,
        -1,
        -3,
        -3,
        1,
        -1,
        -1,
        -1,
        3,
        -1,
        -1,
        -1,
        1,
        -3,
        -1,
        -1,
        1,
        -1,
        -3,
        3,
        -1,
        -1,
        -1,
        1,
        -3,
        -1,
        -1,
        1,
        -1,
        -3,
        -1,
        1,
        -1,
        -1,
        -3,
        -3,
        -1,
        -1,
        -1,
        -1,
        -3,
        -1,
        -1,
        -1,
        -1,
        -3,
        -1,
        -1,
        -1,
        -1,
        -3
      ],
      lookupPairs2D: [
        0,
        1,
        1,
        0,
        4,
        1,
        17,
        0,
        20,
        2,
        21,
        2,
        22,
        5,
        23,
        5,
        26,
        4,
        39,
        3,
        42,
        4,
        43,
        3
      ],
      lookupPairs3D: [
        0,
        2,
        1,
        1,
        2,
        2,
        5,
        1,
        6,
        0,
        7,
        0,
        32,
        2,
        34,
        2,
        129,
        1,
        133,
        1,
        160,
        5,
        161,
        5,
        518,
        0,
        519,
        0,
        546,
        4,
        550,
        4,
        645,
        3,
        647,
        3,
        672,
        5,
        673,
        5,
        674,
        4,
        677,
        3,
        678,
        4,
        679,
        3,
        680,
        13,
        681,
        13,
        682,
        12,
        685,
        14,
        686,
        12,
        687,
        14,
        712,
        20,
        714,
        18,
        809,
        21,
        813,
        23,
        840,
        20,
        841,
        21,
        1198,
        19,
        1199,
        22,
        1226,
        18,
        1230,
        19,
        1325,
        23,
        1327,
        22,
        1352,
        15,
        1353,
        17,
        1354,
        15,
        1357,
        17,
        1358,
        16,
        1359,
        16,
        1360,
        11,
        1361,
        10,
        1362,
        11,
        1365,
        10,
        1366,
        9,
        1367,
        9,
        1392,
        11,
        1394,
        11,
        1489,
        10,
        1493,
        10,
        1520,
        8,
        1521,
        8,
        1878,
        9,
        1879,
        9,
        1906,
        7,
        1910,
        7,
        2005,
        6,
        2007,
        6,
        2032,
        8,
        2033,
        8,
        2034,
        7,
        2037,
        6,
        2038,
        7,
        2039,
        6
      ],
      lookupPairs4D: [
        0,
        3,
        1,
        2,
        2,
        3,
        5,
        2,
        6,
        1,
        7,
        1,
        8,
        3,
        9,
        2,
        10,
        3,
        13,
        2,
        16,
        3,
        18,
        3,
        22,
        1,
        23,
        1,
        24,
        3,
        26,
        3,
        33,
        2,
        37,
        2,
        38,
        1,
        39,
        1,
        41,
        2,
        45,
        2,
        54,
        1,
        55,
        1,
        56,
        0,
        57,
        0,
        58,
        0,
        59,
        0,
        60,
        0,
        61,
        0,
        62,
        0,
        63,
        0,
        256,
        3,
        258,
        3,
        264,
        3,
        266,
        3,
        272,
        3,
        274,
        3,
        280,
        3,
        282,
        3,
        2049,
        2,
        2053,
        2,
        2057,
        2,
        2061,
        2,
        2081,
        2,
        2085,
        2,
        2089,
        2,
        2093,
        2,
        2304,
        9,
        2305,
        9,
        2312,
        9,
        2313,
        9,
        16390,
        1,
        16391,
        1,
        16406,
        1,
        16407,
        1,
        16422,
        1,
        16423,
        1,
        16438,
        1,
        16439,
        1,
        16642,
        8,
        16646,
        8,
        16658,
        8,
        16662,
        8,
        18437,
        6,
        18439,
        6,
        18469,
        6,
        18471,
        6,
        18688,
        9,
        18689,
        9,
        18690,
        8,
        18693,
        6,
        18694,
        8,
        18695,
        6,
        18696,
        9,
        18697,
        9,
        18706,
        8,
        18710,
        8,
        18725,
        6,
        18727,
        6,
        131128,
        0,
        131129,
        0,
        131130,
        0,
        131131,
        0,
        131132,
        0,
        131133,
        0,
        131134,
        0,
        131135,
        0,
        131352,
        7,
        131354,
        7,
        131384,
        7,
        131386,
        7,
        133161,
        5,
        133165,
        5,
        133177,
        5,
        133181,
        5,
        133376,
        9,
        133377,
        9,
        133384,
        9,
        133385,
        9,
        133400,
        7,
        133402,
        7,
        133417,
        5,
        133421,
        5,
        133432,
        7,
        133433,
        5,
        133434,
        7,
        133437,
        5,
        147510,
        4,
        147511,
        4,
        147518,
        4,
        147519,
        4,
        147714,
        8,
        147718,
        8,
        147730,
        8,
        147734,
        8,
        147736,
        7,
        147738,
        7,
        147766,
        4,
        147767,
        4,
        147768,
        7,
        147770,
        7,
        147774,
        4,
        147775,
        4,
        149509,
        6,
        149511,
        6,
        149541,
        6,
        149543,
        6,
        149545,
        5,
        149549,
        5,
        149558,
        4,
        149559,
        4,
        149561,
        5,
        149565,
        5,
        149566,
        4,
        149567,
        4,
        149760,
        9,
        149761,
        9,
        149762,
        8,
        149765,
        6,
        149766,
        8,
        149767,
        6,
        149768,
        9,
        149769,
        9,
        149778,
        8,
        149782,
        8,
        149784,
        7,
        149786,
        7,
        149797,
        6,
        149799,
        6,
        149801,
        5,
        149805,
        5,
        149814,
        4,
        149815,
        4,
        149816,
        7,
        149817,
        5,
        149818,
        7,
        149821,
        5,
        149822,
        4,
        149823,
        4,
        149824,
        37,
        149825,
        37,
        149826,
        36,
        149829,
        34,
        149830,
        36,
        149831,
        34,
        149832,
        37,
        149833,
        37,
        149842,
        36,
        149846,
        36,
        149848,
        35,
        149850,
        35,
        149861,
        34,
        149863,
        34,
        149865,
        33,
        149869,
        33,
        149878,
        32,
        149879,
        32,
        149880,
        35,
        149881,
        33,
        149882,
        35,
        149885,
        33,
        149886,
        32,
        149887,
        32,
        150080,
        49,
        150082,
        48,
        150088,
        49,
        150098,
        48,
        150104,
        47,
        150106,
        47,
        151873,
        46,
        151877,
        45,
        151881,
        46,
        151909,
        45,
        151913,
        44,
        151917,
        44,
        152128,
        49,
        152129,
        46,
        152136,
        49,
        152137,
        46,
        166214,
        43,
        166215,
        42,
        166230,
        43,
        166247,
        42,
        166262,
        41,
        166263,
        41,
        166466,
        48,
        166470,
        43,
        166482,
        48,
        166486,
        43,
        168261,
        45,
        168263,
        42,
        168293,
        45,
        168295,
        42,
        168512,
        31,
        168513,
        28,
        168514,
        31,
        168517,
        28,
        168518,
        25,
        168519,
        25,
        280952,
        40,
        280953,
        39,
        280954,
        40,
        280957,
        39,
        280958,
        38,
        280959,
        38,
        281176,
        47,
        281178,
        47,
        281208,
        40,
        281210,
        40,
        282985,
        44,
        282989,
        44,
        283001,
        39,
        283005,
        39,
        283208,
        30,
        283209,
        27,
        283224,
        30,
        283241,
        27,
        283256,
        22,
        283257,
        22,
        297334,
        41,
        297335,
        41,
        297342,
        38,
        297343,
        38,
        297554,
        29,
        297558,
        24,
        297562,
        29,
        297590,
        24,
        297594,
        21,
        297598,
        21,
        299365,
        26,
        299367,
        23,
        299373,
        26,
        299383,
        23,
        299389,
        20,
        299391,
        20,
        299584,
        31,
        299585,
        28,
        299586,
        31,
        299589,
        28,
        299590,
        25,
        299591,
        25,
        299592,
        30,
        299593,
        27,
        299602,
        29,
        299606,
        24,
        299608,
        30,
        299610,
        29,
        299621,
        26,
        299623,
        23,
        299625,
        27,
        299629,
        26,
        299638,
        24,
        299639,
        23,
        299640,
        22,
        299641,
        22,
        299642,
        21,
        299645,
        20,
        299646,
        21,
        299647,
        20,
        299648,
        61,
        299649,
        60,
        299650,
        61,
        299653,
        60,
        299654,
        59,
        299655,
        59,
        299656,
        58,
        299657,
        57,
        299666,
        55,
        299670,
        54,
        299672,
        58,
        299674,
        55,
        299685,
        52,
        299687,
        51,
        299689,
        57,
        299693,
        52,
        299702,
        54,
        299703,
        51,
        299704,
        56,
        299705,
        56,
        299706,
        53,
        299709,
        50,
        299710,
        53,
        299711,
        50,
        299904,
        61,
        299906,
        61,
        299912,
        58,
        299922,
        55,
        299928,
        58,
        299930,
        55,
        301697,
        60,
        301701,
        60,
        301705,
        57,
        301733,
        52,
        301737,
        57,
        301741,
        52,
        301952,
        79,
        301953,
        79,
        301960,
        76,
        301961,
        76,
        316038,
        59,
        316039,
        59,
        316054,
        54,
        316071,
        51,
        316086,
        54,
        316087,
        51,
        316290,
        78,
        316294,
        78,
        316306,
        73,
        316310,
        73,
        318085,
        77,
        318087,
        77,
        318117,
        70,
        318119,
        70,
        318336,
        79,
        318337,
        79,
        318338,
        78,
        318341,
        77,
        318342,
        78,
        318343,
        77,
        430776,
        56,
        430777,
        56,
        430778,
        53,
        430781,
        50,
        430782,
        53,
        430783,
        50,
        431000,
        75,
        431002,
        72,
        431032,
        75,
        431034,
        72,
        432809,
        74,
        432813,
        69,
        432825,
        74,
        432829,
        69,
        433032,
        76,
        433033,
        76,
        433048,
        75,
        433065,
        74,
        433080,
        75,
        433081,
        74,
        447158,
        71,
        447159,
        68,
        447166,
        71,
        447167,
        68,
        447378,
        73,
        447382,
        73,
        447386,
        72,
        447414,
        71,
        447418,
        72,
        447422,
        71,
        449189,
        70,
        449191,
        70,
        449197,
        69,
        449207,
        68,
        449213,
        69,
        449215,
        68,
        449408,
        67,
        449409,
        67,
        449410,
        66,
        449413,
        64,
        449414,
        66,
        449415,
        64,
        449416,
        67,
        449417,
        67,
        449426,
        66,
        449430,
        66,
        449432,
        65,
        449434,
        65,
        449445,
        64,
        449447,
        64,
        449449,
        63,
        449453,
        63,
        449462,
        62,
        449463,
        62,
        449464,
        65,
        449465,
        63,
        449466,
        65,
        449469,
        63,
        449470,
        62,
        449471,
        62,
        449472,
        19,
        449473,
        19,
        449474,
        18,
        449477,
        16,
        449478,
        18,
        449479,
        16,
        449480,
        19,
        449481,
        19,
        449490,
        18,
        449494,
        18,
        449496,
        17,
        449498,
        17,
        449509,
        16,
        449511,
        16,
        449513,
        15,
        449517,
        15,
        449526,
        14,
        449527,
        14,
        449528,
        17,
        449529,
        15,
        449530,
        17,
        449533,
        15,
        449534,
        14,
        449535,
        14,
        449728,
        19,
        449729,
        19,
        449730,
        18,
        449734,
        18,
        449736,
        19,
        449737,
        19,
        449746,
        18,
        449750,
        18,
        449752,
        17,
        449754,
        17,
        449784,
        17,
        449786,
        17,
        451520,
        19,
        451521,
        19,
        451525,
        16,
        451527,
        16,
        451528,
        19,
        451529,
        19,
        451557,
        16,
        451559,
        16,
        451561,
        15,
        451565,
        15,
        451577,
        15,
        451581,
        15,
        451776,
        19,
        451777,
        19,
        451784,
        19,
        451785,
        19,
        465858,
        18,
        465861,
        16,
        465862,
        18,
        465863,
        16,
        465874,
        18,
        465878,
        18,
        465893,
        16,
        465895,
        16,
        465910,
        14,
        465911,
        14,
        465918,
        14,
        465919,
        14,
        466114,
        18,
        466118,
        18,
        466130,
        18,
        466134,
        18,
        467909,
        16,
        467911,
        16,
        467941,
        16,
        467943,
        16,
        468160,
        13,
        468161,
        13,
        468162,
        13,
        468163,
        13,
        468164,
        13,
        468165,
        13,
        468166,
        13,
        468167,
        13,
        580568,
        17,
        580570,
        17,
        580585,
        15,
        580589,
        15,
        580598,
        14,
        580599,
        14,
        580600,
        17,
        580601,
        15,
        580602,
        17,
        580605,
        15,
        580606,
        14,
        580607,
        14,
        580824,
        17,
        580826,
        17,
        580856,
        17,
        580858,
        17,
        582633,
        15,
        582637,
        15,
        582649,
        15,
        582653,
        15,
        582856,
        12,
        582857,
        12,
        582872,
        12,
        582873,
        12,
        582888,
        12,
        582889,
        12,
        582904,
        12,
        582905,
        12,
        596982,
        14,
        596983,
        14,
        596990,
        14,
        596991,
        14,
        597202,
        11,
        597206,
        11,
        597210,
        11,
        597214,
        11,
        597234,
        11,
        597238,
        11,
        597242,
        11,
        597246,
        11,
        599013,
        10,
        599015,
        10,
        599021,
        10,
        599023,
        10,
        599029,
        10,
        599031,
        10,
        599037,
        10,
        599039,
        10,
        599232,
        13,
        599233,
        13,
        599234,
        13,
        599235,
        13,
        599236,
        13,
        599237,
        13,
        599238,
        13,
        599239,
        13,
        599240,
        12,
        599241,
        12,
        599250,
        11,
        599254,
        11,
        599256,
        12,
        599257,
        12,
        599258,
        11,
        599262,
        11,
        599269,
        10,
        599271,
        10,
        599272,
        12,
        599273,
        12,
        599277,
        10,
        599279,
        10,
        599282,
        11,
        599285,
        10,
        599286,
        11,
        599287,
        10,
        599288,
        12,
        599289,
        12,
        599290,
        11,
        599293,
        10,
        599294,
        11,
        599295,
        10
      ],
      p2D: [
        0,
        0,
        1,
        -1,
        0,
        0,
        -1,
        1,
        0,
        2,
        1,
        1,
        1,
        2,
        2,
        0,
        1,
        2,
        0,
        2,
        1,
        0,
        0,
        0
      ],
      p3D: [
        0,
        0,
        1,
        -1,
        0,
        0,
        1,
        0,
        -1,
        0,
        0,
        -1,
        1,
        0,
        0,
        0,
        1,
        -1,
        0,
        0,
        -1,
        0,
        1,
        0,
        0,
        -1,
        1,
        0,
        2,
        1,
        1,
        0,
        1,
        1,
        1,
        -1,
        0,
        2,
        1,
        0,
        1,
        1,
        1,
        -1,
        1,
        0,
        2,
        0,
        1,
        1,
        1,
        -1,
        1,
        1,
        1,
        3,
        2,
        1,
        0,
        3,
        1,
        2,
        0,
        1,
        3,
        2,
        0,
        1,
        3,
        1,
        0,
        2,
        1,
        3,
        0,
        2,
        1,
        3,
        0,
        1,
        2,
        1,
        1,
        1,
        0,
        0,
        2,
        2,
        0,
        0,
        1,
        1,
        0,
        1,
        0,
        2,
        0,
        2,
        0,
        1,
        1,
        0,
        0,
        1,
        2,
        0,
        0,
        2,
        2,
        0,
        0,
        0,
        0,
        1,
        1,
        -1,
        1,
        2,
        0,
        0,
        0,
        0,
        1,
        -1,
        1,
        1,
        2,
        0,
        0,
        0,
        0,
        1,
        1,
        1,
        -1,
        2,
        3,
        1,
        1,
        1,
        2,
        0,
        0,
        2,
        2,
        3,
        1,
        1,
        1,
        2,
        2,
        0,
        0,
        2,
        3,
        1,
        1,
        1,
        2,
        0,
        2,
        0,
        2,
        1,
        1,
        -1,
        1,
        2,
        0,
        0,
        2,
        2,
        1,
        1,
        -1,
        1,
        2,
        2,
        0,
        0,
        2,
        1,
        -1,
        1,
        1,
        2,
        0,
        0,
        2,
        2,
        1,
        -1,
        1,
        1,
        2,
        0,
        2,
        0,
        2,
        1,
        1,
        1,
        -1,
        2,
        2,
        0,
        0,
        2,
        1,
        1,
        1,
        -1,
        2,
        0,
        2,
        0
      ],
      p4D: [
        0,
        0,
        1,
        -1,
        0,
        0,
        0,
        1,
        0,
        -1,
        0,
        0,
        1,
        0,
        0,
        -1,
        0,
        0,
        -1,
        1,
        0,
        0,
        0,
        0,
        1,
        -1,
        0,
        0,
        0,
        1,
        0,
        -1,
        0,
        0,
        -1,
        0,
        1,
        0,
        0,
        0,
        -1,
        1,
        0,
        0,
        0,
        0,
        1,
        -1,
        0,
        0,
        -1,
        0,
        0,
        1,
        0,
        0,
        -1,
        0,
        1,
        0,
        0,
        0,
        -1,
        1,
        0,
        2,
        1,
        1,
        0,
        0,
        1,
        1,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        0,
        2,
        1,
        0,
        1,
        0,
        1,
        1,
        -1,
        1,
        0,
        1,
        1,
        0,
        1,
        -1,
        0,
        2,
        0,
        1,
        1,
        0,
        1,
        -1,
        1,
        1,
        0,
        1,
        0,
        1,
        1,
        -1,
        0,
        2,
        1,
        0,
        0,
        1,
        1,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        1,
        0,
        2,
        0,
        1,
        0,
        1,
        1,
        -1,
        1,
        0,
        1,
        1,
        0,
        1,
        -1,
        1,
        0,
        2,
        0,
        0,
        1,
        1,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        1,
        1,
        1,
        4,
        2,
        1,
        1,
        0,
        4,
        1,
        2,
        1,
        0,
        4,
        1,
        1,
        2,
        0,
        1,
        4,
        2,
        1,
        0,
        1,
        4,
        1,
        2,
        0,
        1,
        4,
        1,
        1,
        0,
        2,
        1,
        4,
        2,
        0,
        1,
        1,
        4,
        1,
        0,
        2,
        1,
        4,
        1,
        0,
        1,
        2,
        1,
        4,
        0,
        2,
        1,
        1,
        4,
        0,
        1,
        2,
        1,
        4,
        0,
        1,
        1,
        2,
        1,
        2,
        1,
        1,
        0,
        0,
        3,
        2,
        1,
        0,
        0,
        3,
        1,
        2,
        0,
        0,
        1,
        2,
        1,
        0,
        1,
        0,
        3,
        2,
        0,
        1,
        0,
        3,
        1,
        0,
        2,
        0,
        1,
        2,
        0,
        1,
        1,
        0,
        3,
        0,
        2,
        1,
        0,
        3,
        0,
        1,
        2,
        0,
        1,
        2,
        1,
        0,
        0,
        1,
        3,
        2,
        0,
        0,
        1,
        3,
        1,
        0,
        0,
        2,
        1,
        2,
        0,
        1,
        0,
        1,
        3,
        0,
        2,
        0,
        1,
        3,
        0,
        1,
        0,
        2,
        1,
        2,
        0,
        0,
        1,
        1,
        3,
        0,
        0,
        2,
        1,
        3,
        0,
        0,
        1,
        2,
        2,
        3,
        1,
        1,
        1,
        0,
        2,
        1,
        1,
        1,
        -1,
        2,
        2,
        0,
        0,
        0,
        2,
        3,
        1,
        1,
        0,
        1,
        2,
        1,
        1,
        -1,
        1,
        2,
        2,
        0,
        0,
        0,
        2,
        3,
        1,
        0,
        1,
        1,
        2,
        1,
        -1,
        1,
        1,
        2,
        2,
        0,
        0,
        0,
        2,
        3,
        1,
        1,
        1,
        0,
        2,
        1,
        1,
        1,
        -1,
        2,
        0,
        2,
        0,
        0,
        2,
        3,
        1,
        1,
        0,
        1,
        2,
        1,
        1,
        -1,
        1,
        2,
        0,
        2,
        0,
        0,
        2,
        3,
        0,
        1,
        1,
        1,
        2,
        -1,
        1,
        1,
        1,
        2,
        0,
        2,
        0,
        0,
        2,
        3,
        1,
        1,
        1,
        0,
        2,
        1,
        1,
        1,
        -1,
        2,
        0,
        0,
        2,
        0,
        2,
        3,
        1,
        0,
        1,
        1,
        2,
        1,
        -1,
        1,
        1,
        2,
        0,
        0,
        2,
        0,
        2,
        3,
        0,
        1,
        1,
        1,
        2,
        -1,
        1,
        1,
        1,
        2,
        0,
        0,
        2,
        0,
        2,
        3,
        1,
        1,
        0,
        1,
        2,
        1,
        1,
        -1,
        1,
        2,
        0,
        0,
        0,
        2,
        2,
        3,
        1,
        0,
        1,
        1,
        2,
        1,
        -1,
        1,
        1,
        2,
        0,
        0,
        0,
        2,
        2,
        3,
        0,
        1,
        1,
        1,
        2,
        -1,
        1,
        1,
        1,
        2,
        0,
        0,
        0,
        2,
        2,
        1,
        1,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        0,
        0,
        0,
        0,
        0,
        2,
        1,
        1,
        -1,
        1,
        0,
        1,
        1,
        0,
        1,
        -1,
        0,
        0,
        0,
        0,
        0,
        2,
        1,
        -1,
        1,
        1,
        0,
        1,
        0,
        1,
        1,
        -1,
        0,
        0,
        0,
        0,
        0,
        2,
        1,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        1,
        0,
        0,
        0,
        0,
        0,
        2,
        1,
        -1,
        1,
        0,
        1,
        1,
        0,
        1,
        -1,
        1,
        0,
        0,
        0,
        0,
        0,
        2,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        1,
        1,
        0,
        0,
        0,
        0,
        0,
        2,
        1,
        1,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        2,
        2,
        0,
        0,
        0,
        2,
        1,
        1,
        -1,
        1,
        0,
        1,
        1,
        0,
        1,
        -1,
        2,
        2,
        0,
        0,
        0,
        2,
        1,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        1,
        2,
        2,
        0,
        0,
        0,
        2,
        1,
        1,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        2,
        0,
        2,
        0,
        0,
        2,
        1,
        -1,
        1,
        1,
        0,
        1,
        0,
        1,
        1,
        -1,
        2,
        0,
        2,
        0,
        0,
        2,
        1,
        -1,
        1,
        0,
        1,
        1,
        0,
        1,
        -1,
        1,
        2,
        0,
        2,
        0,
        0,
        2,
        1,
        1,
        -1,
        1,
        0,
        1,
        1,
        0,
        1,
        -1,
        2,
        0,
        0,
        2,
        0,
        2,
        1,
        -1,
        1,
        1,
        0,
        1,
        0,
        1,
        1,
        -1,
        2,
        0,
        0,
        2,
        0,
        2,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        1,
        1,
        2,
        0,
        0,
        2,
        0,
        2,
        1,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        1,
        2,
        0,
        0,
        0,
        2,
        2,
        1,
        -1,
        1,
        0,
        1,
        1,
        0,
        1,
        -1,
        1,
        2,
        0,
        0,
        0,
        2,
        2,
        1,
        -1,
        0,
        1,
        1,
        1,
        0,
        -1,
        1,
        1,
        2,
        0,
        0,
        0,
        2,
        3,
        1,
        1,
        0,
        0,
        0,
        2,
        2,
        0,
        0,
        0,
        2,
        1,
        1,
        1,
        -1,
        3,
        1,
        0,
        1,
        0,
        0,
        2,
        0,
        2,
        0,
        0,
        2,
        1,
        1,
        1,
        -1,
        3,
        1,
        0,
        0,
        1,
        0,
        2,
        0,
        0,
        2,
        0,
        2,
        1,
        1,
        1,
        -1,
        3,
        1,
        1,
        0,
        0,
        0,
        2,
        2,
        0,
        0,
        0,
        2,
        1,
        1,
        -1,
        1,
        3,
        1,
        0,
        1,
        0,
        0,
        2,
        0,
        2,
        0,
        0,
        2,
        1,
        1,
        -1,
        1,
        3,
        1,
        0,
        0,
        0,
        1,
        2,
        0,
        0,
        0,
        2,
        2,
        1,
        1,
        -1,
        1,
        3,
        1,
        1,
        0,
        0,
        0,
        2,
        2,
        0,
        0,
        0,
        2,
        1,
        -1,
        1,
        1,
        3,
        1,
        0,
        0,
        1,
        0,
        2,
        0,
        0,
        2,
        0,
        2,
        1,
        -1,
        1,
        1,
        3,
        1,
        0,
        0,
        0,
        1,
        2,
        0,
        0,
        0,
        2,
        2,
        1,
        -1,
        1,
        1,
        3,
        1,
        0,
        1,
        0,
        0,
        2,
        0,
        2,
        0,
        0,
        2,
        -1,
        1,
        1,
        1,
        3,
        1,
        0,
        0,
        1,
        0,
        2,
        0,
        0,
        2,
        0,
        2,
        -1,
        1,
        1,
        1,
        3,
        1,
        0,
        0,
        0,
        1,
        2,
        0,
        0,
        0,
        2,
        2,
        -1,
        1,
        1,
        1,
        3,
        3,
        2,
        1,
        0,
        0,
        3,
        1,
        2,
        0,
        0,
        4,
        1,
        1,
        1,
        1,
        3,
        3,
        2,
        0,
        1,
        0,
        3,
        1,
        0,
        2,
        0,
        4,
        1,
        1,
        1,
        1,
        3,
        3,
        0,
        2,
        1,
        0,
        3,
        0,
        1,
        2,
        0,
        4,
        1,
        1,
        1,
        1,
        3,
        3,
        2,
        0,
        0,
        1,
        3,
        1,
        0,
        0,
        2,
        4,
        1,
        1,
        1,
        1,
        3,
        3,
        0,
        2,
        0,
        1,
        3,
        0,
        1,
        0,
        2,
        4,
        1,
        1,
        1,
        1,
        3,
        3,
        0,
        0,
        2,
        1,
        3,
        0,
        0,
        1,
        2,
        4,
        1,
        1,
        1,
        1,
        3,
        3,
        2,
        1,
        0,
        0,
        3,
        1,
        2,
        0,
        0,
        2,
        1,
        1,
        1,
        -1,
        3,
        3,
        2,
        0,
        1,
        0,
        3,
        1,
        0,
        2,
        0,
        2,
        1,
        1,
        1,
        -1,
        3,
        3,
        0,
        2,
        1,
        0,
        3,
        0,
        1,
        2,
        0,
        2,
        1,
        1,
        1,
        -1,
        3,
        3,
        2,
        1,
        0,
        0,
        3,
        1,
        2,
        0,
        0,
        2,
        1,
        1,
        -1,
        1,
        3,
        3,
        2,
        0,
        0,
        1,
        3,
        1,
        0,
        0,
        2,
        2,
        1,
        1,
        -1,
        1,
        3,
        3,
        0,
        2,
        0,
        1,
        3,
        0,
        1,
        0,
        2,
        2,
        1,
        1,
        -1,
        1,
        3,
        3,
        2,
        0,
        1,
        0,
        3,
        1,
        0,
        2,
        0,
        2,
        1,
        -1,
        1,
        1,
        3,
        3,
        2,
        0,
        0,
        1,
        3,
        1,
        0,
        0,
        2,
        2,
        1,
        -1,
        1,
        1,
        3,
        3,
        0,
        0,
        2,
        1,
        3,
        0,
        0,
        1,
        2,
        2,
        1,
        -1,
        1,
        1,
        3,
        3,
        0,
        2,
        1,
        0,
        3,
        0,
        1,
        2,
        0,
        2,
        -1,
        1,
        1,
        1,
        3,
        3,
        0,
        2,
        0,
        1,
        3,
        0,
        1,
        0,
        2,
        2,
        -1,
        1,
        1,
        1,
        3,
        3,
        0,
        0,
        2,
        1,
        3,
        0,
        0,
        1,
        2,
        2,
        -1,
        1,
        1,
        1
      ]
    };

    var Contribution2 = /** @class */ (function() {
      function Contribution2(multiplier, xsb, ysb) {
        this.dx = -xsb - multiplier * constants_1.SQUISH_2D;
        this.dy = -ysb - multiplier * constants_1.SQUISH_2D;
        this.xsb = xsb;
        this.ysb = ysb;
      }
      return Contribution2;
    })();
    var Contribution3 = /** @class */ (function() {
      function Contribution3(multiplier, xsb, ysb, zsb) {
        this.dx = -xsb - multiplier * constants_1.SQUISH_3D;
        this.dy = -ysb - multiplier * constants_1.SQUISH_3D;
        this.dz = -zsb - multiplier * constants_1.SQUISH_3D;
        this.xsb = xsb;
        this.ysb = ysb;
        this.zsb = zsb;
      }
      return Contribution3;
    })();
    var Contribution4 = /** @class */ (function() {
      function Contribution4(multiplier, xsb, ysb, zsb, wsb) {
        this.dx = -xsb - multiplier * constants_1.SQUISH_4D;
        this.dy = -ysb - multiplier * constants_1.SQUISH_4D;
        this.dz = -zsb - multiplier * constants_1.SQUISH_4D;
        this.dw = -wsb - multiplier * constants_1.SQUISH_4D;
        this.xsb = xsb;
        this.ysb = ysb;
        this.zsb = zsb;
        this.wsb = wsb;
      }
      return Contribution4;
    })();
    function shuffleSeed(seed) {
      var newSeed = new Uint32Array(1);
      newSeed[0] = seed[0] * 1664525 + 1013904223;
      return newSeed;
    }
    OpenSimplexNoise = /** @class */ (function() {
      function OpenSimplexNoise(clientSeed) {
        this.initialize();
        this.perm = new Uint8Array(256);
        this.perm2D = new Uint8Array(256);
        this.perm3D = new Uint8Array(256);
        this.perm4D = new Uint8Array(256);
        var source = new Uint8Array(256);
        for (var i = 0; i < 256; i++) source[i] = i;
        var seed = new Uint32Array(1);
        seed[0] = clientSeed;
        seed = shuffleSeed(shuffleSeed(shuffleSeed(seed)));
        for (var i = 255; i >= 0; i--) {
          seed = shuffleSeed(seed);
          var r = new Uint32Array(1);
          r[0] = (seed[0] + 31) % (i + 1);
          if (r[0] < 0) r[0] += i + 1;
          this.perm[i] = source[r[0]];
          this.perm2D[i] = this.perm[i] & 0x0e;
          this.perm3D[i] = (this.perm[i] % 24) * 3;
          this.perm4D[i] = this.perm[i] & 0xfc;
          source[r[0]] = source[i];
        }
      }
      OpenSimplexNoise.prototype.array2D = function(width, height) {
        var output = new Array(width);
        for (var x = 0; x < width; x++) {
          output[x] = new Array(height);
          for (var y = 0; y < height; y++) {
            output[x][y] = this.noise2D(x, y);
          }
        }
        return output;
      };
      OpenSimplexNoise.prototype.array3D = function(width, height, depth) {
        var output = new Array(width);
        for (var x = 0; x < width; x++) {
          output[x] = new Array(height);
          for (var y = 0; y < height; y++) {
            output[x][y] = new Array(depth);
            for (var z = 0; z < depth; z++) {
              output[x][y][z] = this.noise3D(x, y, z);
            }
          }
        }
        return output;
      };
      OpenSimplexNoise.prototype.array4D = function(
        width,
        height,
        depth,
        wLength
      ) {
        var output = new Array(width);
        for (var x = 0; x < width; x++) {
          output[x] = new Array(height);
          for (var y = 0; y < height; y++) {
            output[x][y] = new Array(depth);
            for (var z = 0; z < depth; z++) {
              output[x][y][z] = new Array(wLength);
              for (var w = 0; w < wLength; w++) {
                output[x][y][z][w] = this.noise4D(x, y, z, w);
              }
            }
          }
        }
        return output;
      };
      OpenSimplexNoise.prototype.noise2D = function(x, y) {
        var stretchOffset = (x + y) * constants_1.STRETCH_2D;
        var xs = x + stretchOffset;
        var ys = y + stretchOffset;
        var xsb = Math.floor(xs);
        var ysb = Math.floor(ys);
        var squishOffset = (xsb + ysb) * constants_1.SQUISH_2D;
        var dx0 = x - (xsb + squishOffset);
        var dy0 = y - (ysb + squishOffset);
        var xins = xs - xsb;
        var yins = ys - ysb;
        var inSum = xins + yins;
        var hash =
          (xins - yins + 1) |
          (inSum << 1) |
          ((inSum + yins) << 2) |
          ((inSum + xins) << 4);
        var value = 0;
        for (var c = this.lookup2D[hash]; c !== undefined; c = c.next) {
          var dx = dx0 + c.dx;
          var dy = dy0 + c.dy;
          var attn = 2 - dx * dx - dy * dy;
          if (attn > 0) {
            var px = xsb + c.xsb;
            var py = ysb + c.ysb;
            var indexPartA = this.perm[px & 0xff];
            var index = this.perm2D[(indexPartA + py) & 0xff];
            var valuePart =
              constants_1.gradients2D[index] * dx +
              constants_1.gradients2D[index + 1] * dy;
            value += attn * attn * attn * attn * valuePart;
          }
        }
        return value * constants_1.NORM_2D;
      };
      OpenSimplexNoise.prototype.noise3D = function(x, y, z) {
        var stretchOffset = (x + y + z) * constants_1.STRETCH_3D;
        var xs = x + stretchOffset;
        var ys = y + stretchOffset;
        var zs = z + stretchOffset;
        var xsb = Math.floor(xs);
        var ysb = Math.floor(ys);
        var zsb = Math.floor(zs);
        var squishOffset = (xsb + ysb + zsb) * constants_1.SQUISH_3D;
        var dx0 = x - (xsb + squishOffset);
        var dy0 = y - (ysb + squishOffset);
        var dz0 = z - (zsb + squishOffset);
        var xins = xs - xsb;
        var yins = ys - ysb;
        var zins = zs - zsb;
        var inSum = xins + yins + zins;
        var hash =
          (yins - zins + 1) |
          ((xins - yins + 1) << 1) |
          ((xins - zins + 1) << 2) |
          (inSum << 3) |
          ((inSum + zins) << 5) |
          ((inSum + yins) << 7) |
          ((inSum + xins) << 9);
        var value = 0;
        for (var c = this.lookup3D[hash]; c !== undefined; c = c.next) {
          var dx = dx0 + c.dx;
          var dy = dy0 + c.dy;
          var dz = dz0 + c.dz;
          var attn = 2 - dx * dx - dy * dy - dz * dz;
          if (attn > 0) {
            var px = xsb + c.xsb;
            var py = ysb + c.ysb;
            var pz = zsb + c.zsb;
            var indexPartA = this.perm[px & 0xff];
            var indexPartB = this.perm[(indexPartA + py) & 0xff];
            var index = this.perm3D[(indexPartB + pz) & 0xff];
            var valuePart =
              constants_1.gradients3D[index] * dx +
              constants_1.gradients3D[index + 1] * dy +
              constants_1.gradients3D[index + 2] * dz;
            value += attn * attn * attn * attn * valuePart;
          }
        }
        return value * constants_1.NORM_3D;
      };
      OpenSimplexNoise.prototype.noise4D = function(x, y, z, w) {
        var stretchOffset = (x + y + z + w) * constants_1.STRETCH_4D;
        var xs = x + stretchOffset;
        var ys = y + stretchOffset;
        var zs = z + stretchOffset;
        var ws = w + stretchOffset;
        var xsb = Math.floor(xs);
        var ysb = Math.floor(ys);
        var zsb = Math.floor(zs);
        var wsb = Math.floor(ws);
        var squishOffset = (xsb + ysb + zsb + wsb) * constants_1.SQUISH_4D;
        var dx0 = x - (xsb + squishOffset);
        var dy0 = y - (ysb + squishOffset);
        var dz0 = z - (zsb + squishOffset);
        var dw0 = w - (wsb + squishOffset);
        var xins = xs - xsb;
        var yins = ys - ysb;
        var zins = zs - zsb;
        var wins = ws - wsb;
        var inSum = xins + yins + zins + wins;
        var hash =
          (zins - wins + 1) |
          ((yins - zins + 1) << 1) |
          ((yins - wins + 1) << 2) |
          ((xins - yins + 1) << 3) |
          ((xins - zins + 1) << 4) |
          ((xins - wins + 1) << 5) |
          (inSum << 6) |
          ((inSum + wins) << 8) |
          ((inSum + zins) << 11) |
          ((inSum + yins) << 14) |
          ((inSum + xins) << 17);
        var value = 0;
        for (var c = this.lookup4D[hash]; c !== undefined; c = c.next) {
          var dx = dx0 + c.dx;
          var dy = dy0 + c.dy;
          var dz = dz0 + c.dz;
          var dw = dw0 + c.dw;
          var attn = 2 - dx * dx - dy * dy - dz * dz - dw * dw;
          if (attn > 0) {
            var px = xsb + c.xsb;
            var py = ysb + c.ysb;
            var pz = zsb + c.zsb;
            var pw = wsb + c.wsb;
            var indexPartA = this.perm[px & 0xff];
            var indexPartB = this.perm[(indexPartA + py) & 0xff];
            var indexPartC = this.perm[(indexPartB + pz) & 0xff];
            var index = this.perm4D[(indexPartC + pw) & 0xff];
            var valuePart =
              constants_1.gradients4D[index] * dx +
              constants_1.gradients4D[index + 1] * dy +
              constants_1.gradients4D[index + 2] * dz +
              constants_1.gradients4D[index + 3] * dw;
            value += attn * attn * attn * attn * valuePart;
          }
        }
        return value * constants_1.NORM_4D;
      };
      OpenSimplexNoise.prototype.initialize = function() {
        var contributions2D = [];
        for (var i = 0; i < constants_1.p2D.length; i += 4) {
          var baseSet = constants_1.base2D[constants_1.p2D[i]];
          var previous = null;
          var current = null;
          for (var k = 0; k < baseSet.length; k += 3) {
            current = new Contribution2(
              baseSet[k],
              baseSet[k + 1],
              baseSet[k + 2]
            );
            if (previous === null) contributions2D[i / 4] = current;
            else previous.next = current;
            previous = current;
          }
          current.next = new Contribution2(
            constants_1.p2D[i + 1],
            constants_1.p2D[i + 2],
            constants_1.p2D[i + 3]
          );
        }
        this.lookup2D = [];
        for (var i = 0; i < constants_1.lookupPairs2D.length; i += 2) {
          this.lookup2D[constants_1.lookupPairs2D[i]] =
            contributions2D[constants_1.lookupPairs2D[i + 1]];
        }
        var contributions3D = [];
        for (var i = 0; i < constants_1.p3D.length; i += 9) {
          var baseSet = constants_1.base3D[constants_1.p3D[i]];
          var previous = null;
          var current = null;
          for (var k = 0; k < baseSet.length; k += 4) {
            current = new Contribution3(
              baseSet[k],
              baseSet[k + 1],
              baseSet[k + 2],
              baseSet[k + 3]
            );
            if (previous === null) contributions3D[i / 9] = current;
            else previous.next = current;
            previous = current;
          }
          current.next = new Contribution3(
            constants_1.p3D[i + 1],
            constants_1.p3D[i + 2],
            constants_1.p3D[i + 3],
            constants_1.p3D[i + 4]
          );
          current.next.next = new Contribution3(
            constants_1.p3D[i + 5],
            constants_1.p3D[i + 6],
            constants_1.p3D[i + 7],
            constants_1.p3D[i + 8]
          );
        }
        this.lookup3D = [];
        for (var i = 0; i < constants_1.lookupPairs3D.length; i += 2) {
          this.lookup3D[constants_1.lookupPairs3D[i]] =
            contributions3D[constants_1.lookupPairs3D[i + 1]];
        }
        var contributions4D = [];
        for (var i = 0; i < constants_1.p4D.length; i += 16) {
          var baseSet = constants_1.base4D[constants_1.p4D[i]];
          var previous = null;
          var current = null;
          for (var k = 0; k < baseSet.length; k += 5) {
            current = new Contribution4(
              baseSet[k],
              baseSet[k + 1],
              baseSet[k + 2],
              baseSet[k + 3],
              baseSet[k + 4]
            );
            if (previous === null) contributions4D[i / 16] = current;
            else previous.next = current;
            previous = current;
          }
          current.next = new Contribution4(
            constants_1.p4D[i + 1],
            constants_1.p4D[i + 2],
            constants_1.p4D[i + 3],
            constants_1.p4D[i + 4],
            constants_1.p4D[i + 5]
          );
          current.next.next = new Contribution4(
            constants_1.p4D[i + 6],
            constants_1.p4D[i + 7],
            constants_1.p4D[i + 8],
            constants_1.p4D[i + 9],
            constants_1.p4D[i + 10]
          );
          current.next.next.next = new Contribution4(
            constants_1.p4D[i + 11],
            constants_1.p4D[i + 12],
            constants_1.p4D[i + 13],
            constants_1.p4D[i + 14],
            constants_1.p4D[i + 15]
          );
        }
        this.lookup4D = [];
        for (var i = 0; i < constants_1.lookupPairs4D.length; i += 2) {
          this.lookup4D[constants_1.lookupPairs4D[i]] =
            contributions4D[constants_1.lookupPairs4D[i + 1]];
        }
      };
      return OpenSimplexNoise;
    })();
  })();
}
