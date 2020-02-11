const screenWidthP = 2160; // final screen size
const screenHeightP = 3840; // final screen size
const aspect = screenWidthP / screenHeightP; // scale factor for calculating the width from the height. w = h * aspect (because screen is higher than wide)

let canvasWidth; // effective canvas size
let canvasHeight; // effective canvas height -> normally the windowheight

const resolutionP = 20; // 1 unit * resolution = pixels
const marginTopP = 260; // margins for drawing the rows
const marginBottomP = 260;
const marginLeftP = 90;
const marginRightP = 90;
const textMarginP = 160;

const fontSizeP = 85;
const textHeightP = 60; // actual height of the font
const minDistP = 200;

let scl; // actual screen size / final screen height
let resolution; // scaled resolution
let marginTop;
let marginBottom;
let marginLeft;
let marginRight;
let textMargin;

let fontSize;
let textHeight;
let minDist;

let pg; // off screen graphics to draw / write the completed rows on
let moveImage = false; // if true the image gets moved up

let run = true;
let debug = false;
let loop = false; // reset to min t width after max t width


let tWidthMin = 1;
let tWidthMax = 99;
let tWidth = tWidthMin - 1; // start with 0

let gutterWidth = tWidth; // to force new t width when starting
let gutterWidthMin = 0;
let gutterWidthMax = 12;

let numberOfColumns = 1;
let numberOfColumnsMin = 1;
let numberOfColumnsMax = tWidth;

let columnWidth = 1;

let rows = [];
let cRow = {
  'type': '',
  'tWidth': 0,
  'numberOfColumns': 0,
  'columnWidth': 0,
  'gutterWidth': 0,
  'displayType': '',
  'yOffset': 0
}

let upperW = tWidth; // upper displayed width
let lowerW = tWidth;

let imgYOffset = 0; // y Offset of last row written to the image -> to know the "height" of the image

var num = 0;
let xOffset;
let yOffset;

// animation ---
let animDuration = 1500;
let yPos = { // object to animate
  val: 0
};
let masterTimer;

let waitDuration = 1000;
let waitTimer1;
let waitTimer2;

let font;

let startMillis;
const fps = 60;
// the canvas capturer instance
const capturer = new CCapture({
  format: 'png',
  quality: 1.0,
  framerate: fps,
  autoSaveTime: 200
  // autoSaveTime: 50
});


let p5Canvas;
let canvas;

let captureOn = false;
let captureStarted = false;
let finalScreen = false;

// UI ----
let visibleUI = false;
let durationLabel;
let durationInput;
let waitLabel;
let waitInput;

let minWidthLabel;
let minWidthInput;
let maxWidthLabel;
let maxWidthInput;

let minGutterLabel;
let minGutterInput;
let maxGutterLabel;
let maxGutterInput;

let loopLabel;
let loopCheckbox;

let captureLabel;
let captureCheckbox;

let okButton;
let cancelButton;

let riforma_font;

function preload() {
  font = loadFont('assets/RiformaOfficeTT-Medium.ttf');
  riforma_font = new FontFace('Riforma Medium', 'url(assets/RiformaOfficeTT-Medium.ttf)');
  riforma_font.load().then(function (loaded_face) {
    document.fonts.add(loaded_face);
    document.body.style.fontFamily = 'Riforma Medium';
  }).catch(function (error) {
    // error
  });
}



function setup() {

  pixelDensity(1);

  if (finalScreen) {
    p5Canvas = createCanvas(screenWidthP, screenHeightP); // final size = 2160 x 3840  -> scale width according to height
    canvasHeight = screenHeightP;
  } else {
    calculateCanvasSize(); // determine canvas height (= windowheight) and width with the aspect ratio
    p5Canvas = createCanvas(canvasWidth, canvasHeight); // final size = 2160 x 3840  -> scale width according to height
    centerCanvas();
  }

  // console.log(p5Canvas);
  p5Canvas.parent('sketch-holder');
  // console.log("width ", width, height);
  canvas = p5Canvas.canvas; // for ccapture
  p5Canvas.mouseClicked(canvasMouseClicked);
  p5Canvas.style('display', 'block');
  calculateScaledProperties();
  createUI();

  masterTimer = createMasterTimer(animDuration);
  waitTimer1 = createWaitTimer1(waitDuration);
  waitTimer2 = createWaitTimer2(waitDuration);

  // p5Canvas.position(200,200);
  // canvas.style('width', '200px');
  // document.getElementById('defaultCanvas0')
  // margin-left: auto

  textFont(font);
  pg = createGraphics(width, height);
  numberOfColumnsMax = ceil(tWidth / 2);

  frameRate(fps);
  if (run) masterTimer.play();
}


// draw -------------------------------
function draw() {

  background(255);

  if (!visibleUI) {
    if (moveImage) {
      // stackheight of growing column 
      let stH = yPos.val * (height - marginTop - marginBottom - resolution) + resolution;

      let dispH = height - marginTop - marginBottom; // max column height
      dispH -= imgYOffset - marginTop + resolution // minus the rows in the image

      let dist = dispH - stH; // distance between growing column and bottom of image

      if (dist < minDist) {
        image(pg, 0, dist - minDist);
      } else {
        image(pg, 0, 0);
      }
    } else {
      image(pg, 0, 0);
    }


    fill(255);
    noStroke();
    rect(0, 0, width, marginTop); // white masking rect (for when the image moves up)

    // display rows
    for (let i = 0; i < rows.length; i++) {
      displayRow(rows[i]);
    }

    if (rows.length > 0) {
      fill(0);
      noStroke();
      textSize(fontSize);
      text(upperW, marginLeft, textMargin + textHeight);
      text(lowerW, marginLeft, height - textMargin);
    }
  } else {
    // show UI
    fill(0);
    noStroke();
    rect(marginLeft, marginTop, width - marginLeft - marginRight, height - marginTop - marginBottom);
    fill(255);
    textSize(fontSize);
    text('norm division', marginLeft + 50 * scl, marginTop + 150 * scl);
    // text('duration', marginLeft + 30 * scl, marginTop + 300 * scl);
  }


  // debug stuff
  if (debug) {
    strokeWeight(1);
    stroke(0, 0, 0, 50);

    line(xOffset, 0, xOffset, height);
    line(width - marginRight, 0, width - marginRight, height);
    line(0, marginTop, width, marginTop);
    line(0, height - marginBottom, width, height - marginBottom);

    line(0, textMargin, width, textMargin);
    line(0, textMargin + textHeight, width, textMargin + textHeight);
    line(0, height - textMargin, width, height - textMargin);
    line(0, height - textMargin - textHeight, width, height - textMargin - textHeight);

    textSize(14);
    noStroke();
    fill(0);
    text("Framerate: " + round(frameRate()), marginLeft, height - 20);
    // debug stuff
  }

  if (captureOn) {
    // capturer.capture(document.getElementById('defaultCanvas0'));
    capturer.capture(canvas);
  }
}


function displayRow(row) {
  noStroke();
  fill(0);

  let borderOff = 0;
  if (row.type == 'new_gutter_width') {
    borderOff = 2 * resolution;
  } else if (row.type == 'norm') {
    borderOff = resolution;
  }

  push();

  if (row.displayType == 'increase') {
    let offset = 0; // additional y offset for rows other than new t width. 
    let h = height - marginBottom - row.yOffset - resolution;

    if (row.type == 'new_gutter_width') {
      offset = 3 * resolution;
      h += offset; // height of previous row
    } else if (row.type == 'norm') {
      offset = 2 * resolution;
      h += offset;
    }

    if (row.yOffset + h * (1 - yPos.val) - borderOff <= height - marginBottom) { // draw only if above marginBottom
      // draw the borders
      stroke(0);
      strokeCap(SQUARE);
      line(xOffset, height - marginBottom - yPos.val * h - resolution + offset - borderOff, xOffset, height - marginBottom);
      line(xOffset + row.tWidth * resolution, height - marginBottom - yPos.val * h - resolution + offset - borderOff, xOffset + row.tWidth * resolution, height - marginBottom);
    }
    if (row.yOffset + h * (1 - yPos.val) <= height - marginBottom) { // draw only if above marginBottom
      // draw the rects
      noStroke();
      for (let i = 0; i < row.numberOfColumns; i++) {
        rect(xOffset, height - marginBottom - yPos.val * h - resolution + offset, row.columnWidth * resolution, yPos.val * h + resolution - offset);
        translate((row.columnWidth + row.gutterWidth) * resolution, 0);
      }
    }

  } else if (row.displayType == 'decrease') {
    let h = height - marginBottom - row.yOffset - resolution;
    // draw the borders
    stroke(0);
    strokeCap(SQUARE);
    line(xOffset, row.yOffset - borderOff, xOffset, row.yOffset + resolution + (1 - yPos.val) * h);
    line(xOffset + row.tWidth * resolution, row.yOffset - borderOff, xOffset + row.tWidth * resolution, row.yOffset + resolution + (1 - yPos.val) * h);
    // draw the rects
    noStroke();
    for (let i = 0; i < row.numberOfColumns; i++) {
      rect(xOffset, row.yOffset, row.columnWidth * resolution, (1 - yPos.val) * h + resolution);
      translate((row.columnWidth + row.gutterWidth) * resolution, 0);
    }

  } else if (row.displayType == 'wait2') {
    // draw the borders
    stroke(0);
    strokeCap(SQUARE);
    line(xOffset, height - marginBottom - resolution, xOffset, height - marginBottom);
    line(xOffset + row.tWidth * resolution, height - marginBottom - resolution, xOffset + row.tWidth * resolution, height - marginBottom);
    // draw the rects
    noStroke();
    for (let i = 0; i < row.numberOfColumns; i++) {
      rect(xOffset, height - marginBottom - resolution, row.columnWidth * resolution, resolution);
      translate((row.columnWidth + row.gutterWidth) * resolution, 0);
    }
  }

  pop();
}
// end draw



// animation --------------------------
function createMasterTimer(duration) {
  return anime({
    targets: yPos,
    val: 1,
    duration: duration,
    easing: 'easeInOutSine',
    autoplay: false,
    loop: true,
    loopBegin: function (anim) {
      // console.log("loop begin");
      // search for increase type row -> set it to decrease
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].displayType == 'increase') {
          rows[i].displayType = 'decrease';
          break;
        }
      }

      if (cRow.displayType == 'wait2') {
        cRow.displayType = 'increase'; // change waiting row to increase
        moveImage = true;
      } else if (cRow.displayType != 'wait1' && cRow.type != 'done') {
        nextStep();
      }
    },
    loopComplete: function (anim) {
      // console.log("loop end");
      if (moveImage) {
        moveImage = false;
        pg.clear();
        if (cRow.columnWidth != undefined) upperW = cRow.columnWidth;
      }

      // search for decrease type row -> set it to none and write to image
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].displayType == 'decrease') {
          rows[i].displayType = 'none';
          writeRowToImage(rows[i]);
          break;
        }
      }

      if (cRow.displayType == 'wait1' || cRow.type == 'done') {
        // new t width -> wait before row is displayed
        masterTimer.pause();
        waitTimer1.restart();
      }

      if (cRow.type == 'done') {
        // noLoop();
      }

    }
  });
}

function createWaitTimer1(duration) {
  return anime({
    duration: duration,
    autoplay: false,
    begin: function (anim) {},
    complete: function (anim) {
      // one loop completed at this stage
      if (cRow.type != 'done') {
        cRow.displayType = 'wait2';
        // new t width -> row was waiting to be displayed -> display it now in wait position
        rows = []; // clear rows
        rows.push(cRow);
        if (cRow.columnWidth != undefined)
          lowerW = cRow.columnWidth;
      }

      if (captureOn) {
        if (captureStarted) {
          if (tWidth > tWidthMax) { // stop capturing (loop must be off)
            captureOn = false;
            captureCheckbox.elt.checked = captureOn;
            capturer.stop();
            capturer.save();
            console.log("capture stop");
          } else {
            // capturer.save();
          }
        } else if (!captureStarted && tWidth == tWidthMin) {
          // start capturing
          capturer.start();
          console.log("capture start");
          captureStarted = true;
        }
      }

      waitTimer2.restart(); // restart wait 2 timer
    }
  });
}

function createWaitTimer2(duration) {
  return anime({
    duration: duration,
    autoplay: false,
    begin: function (anim) {},
    complete: function (anim) {
      masterTimer.restart(); // restart mastertimer
    }
  });
}
// animation --------------------------



function nextStep() {

  // get next row 
  cRow = getNextRow();
  // console.log("next row: ", cRow);
  if (cRow.type == 'new_gutter_width') {
    yOffset += resolution;
    cRow.displayType = 'increase';
    cRow.yOffset = yOffset;
    rows.push(cRow);

  } else if (cRow.type == 'new_t_width') {
    yOffset = marginTop; // reset offset
    cRow.displayType = 'wait1';
    cRow.yOffset = marginTop;

  } else if (cRow.type == 'done') {
    cRow.displayType = 'none';
    console.log('done');
  } else if (cRow.type == 'norm') {
    cRow.displayType = 'increase';
    cRow.yOffset = yOffset;
    rows.push(cRow);
  }
  yOffset += 2 * resolution; // step up y offset for next row

}



// retrieves the next row and returns it as an object
function getNextRow() {
  let row = {
    'type': '',
    'displayType': ''
  };
  let found = false;

  do {
    do { // get all rows for given tWidth and gutterWidth (number of columns 1-n)

      // console.log("testing: tWidth: ", tWidth, " gutterW: ", gutterWidth, " nbrCols: ", numberOfColumns);

      if (numberOfColumns >= 1) { // must be at least one column
        if (((numberOfColumns > 1 && gutterWidth > 0) || (numberOfColumns == 1 && gutterWidth == 0)) && numberOfColumns <= tWidth) {
          // calculate column width
          columnWidth = (tWidth - (numberOfColumns - 1) * gutterWidth) / numberOfColumns;

          if (Number.isInteger(columnWidth)) {
            if (columnWidth >= 1) {
              // it is a valid result
              if (row.type == '') row.type = 'norm';
              row.tWidth = tWidth;
              row.numberOfColumns = numberOfColumns;
              row.columnWidth = columnWidth;
              row.gutterWidth = gutterWidth;
              found = true;
            } else {
              // columnWidth is always getting smaller, so stop here.
              break;
            }
          }
        } else if (numberOfColumns > 1 && gutterWidth == 0) {
          // not possible to have more than one column with gutter width 0
          break;
        }
      }

      numberOfColumns++;
      if (numberOfColumns > numberOfColumnsMax) {
        break;
      }


    }
    while (!found)



    if (!found) { // all rows for this tWidth and gutterWidth received
      gutterWidth++; // go to next gutter width
      row.type = 'new_gutter_width';
      numberOfColumns = numberOfColumnsMin; // reset columns
      if (gutterWidth > gutterWidthMax || gutterWidth > tWidth) {
        gutterWidth = gutterWidthMin; // reset gutter width
        tWidth++; // go to next width
        row.type = 'new_t_width';
        numberOfColumnsMax = ceil(tWidth / 2); // adjust max columns
        if (tWidth > tWidthMax) {
          if (loop) {
            tWidth = tWidthMin;
          } else {
            // we are done
            row.type = 'done';
            break;
          }
        }
      }
    }

  }
  while (!found)

  return row;
}


function writeRowToImage(row) {
  // console.log("write row to img", row);
  imgYOffset = row.yOffset; // y offset of last written row
  pg.noStroke();
  pg.fill(0);
  pg.push();
  for (let i = 0; i < row.numberOfColumns; i++) {
    pg.rect(xOffset, row.yOffset, row.columnWidth * resolution, resolution);
    pg.translate((row.columnWidth + row.gutterWidth) * resolution, 0);
  }
  pg.pop();

  // draw the border lines
  pg.stroke(0);
  pg.strokeWeight(1);
  pg.strokeCap(SQUARE);
  let y = 0;
  if (row.type == 'new_t_width') {
    y = row.yOffset;
  } else if (row.type == 'new_gutter_width') {
    y = row.yOffset - 2 * resolution;
  } else if (row.type == 'norm') {
    y = row.yOffset - resolution;
  }
  pg.line(xOffset, y, xOffset, row.yOffset + resolution);
  pg.line(xOffset + row.tWidth * resolution, y, xOffset + row.tWidth * resolution, row.yOffset + resolution);

}


function calculateCanvasSize() {
  // adjust width to available window height
  canvasWidth = windowHeight * aspect;
  canvasHeight = windowHeight;

  // adjust height, if window is too narrow
  if (canvasWidth > windowWidth) {
    canvasWidth = windowWidth;
    canvasHeight = round(windowWidth / aspect);
  }
}

function windowResized() {
  if (!finalScreen) {
    calculateCanvasSize();
    calculateScaledProperties();
    resizeCanvas(canvasWidth, canvasHeight);
    pg = createGraphics(width, height);
    centerCanvas();
    positionUIElements();
    // console.log("w / h: ", width, height);
  }
}

function centerCanvas() {
  p5Canvas.position((windowWidth - width) / 2, 0);
}

function calculateScaledProperties() {
  scl = canvasHeight / screenHeightP;
  marginTop = marginTopP * scl;
  marginBottom = marginBottomP * scl;
  marginLeft = marginLeftP * scl;
  marginRight = marginRightP * scl;
  textMargin = textMarginP * scl;

  fontSize = fontSizeP * scl;
  textHeight = fontSize * textHeightP / fontSizeP;
  minDist = minDistP * scl;

  xOffset = marginLeft;
  yOffset = marginTop;

  if (tWidth > 99) {
    resolution = (canvasWidth - marginLeft - marginRight) / tWidthMax;
  } else {
    resolution = resolutionP * scl;
  }

}

function createUI() {
  durationLabel = createSpan('duration');
  durationLabel.style('color', 'white');
  durationLabel.style('font-family', 'Riforma Medium');

  durationInput = createInput(animDuration.toString(), 'number');
  durationInput.style('font-family', 'Riforma Medium');
  durationInput.style('color', 'white');
  durationInput.style('background-color', 'black');
  durationInput.style('border', '0');

  waitLabel = createSpan('wait');
  waitLabel.style('color', 'white');
  waitLabel.style('font-family', 'Riforma Medium');

  waitInput = createInput(waitDuration.toString(), 'number');
  waitInput.style('font-family', 'Riforma Medium');
  waitInput.style('color', 'white');
  waitInput.style('background-color', 'black');
  waitInput.style('border', '0');

  minWidthLabel = createSpan('min width');
  minWidthLabel.style('color', 'white');
  minWidthLabel.style('font-family', 'Riforma Medium');

  minWidthInput = createInput(tWidthMin.toString(), 'number');
  minWidthInput.style('font-family', 'Riforma Medium');
  minWidthInput.style('color', 'white');
  minWidthInput.style('background-color', 'black');
  minWidthInput.style('border', '0');

  maxWidthLabel = createSpan('max width');
  maxWidthLabel.style('color', 'white');
  maxWidthLabel.style('font-family', 'Riforma Medium');

  maxWidthInput = createInput(tWidthMax.toString(), 'number');
  maxWidthInput.style('font-family', 'Riforma Medium');
  maxWidthInput.style('color', 'white');
  maxWidthInput.style('background-color', 'black');
  maxWidthInput.style('border', '0');

  minGutterLabel = createSpan('min gutter');
  minGutterLabel.style('color', 'white');
  minGutterLabel.style('font-family', 'Riforma Medium');

  minGutterInput = createInput(gutterWidthMin.toString(), 'number');
  minGutterInput.style('font-family', 'Riforma Medium');
  minGutterInput.style('color', 'white');
  minGutterInput.style('background-color', 'black');
  minGutterInput.style('border', '0');

  maxGutterLabel = createSpan('max gutter');
  maxGutterLabel.style('color', 'white');
  maxGutterLabel.style('font-family', 'Riforma Medium');

  maxGutterInput = createInput(gutterWidthMax.toString(), 'number');
  maxGutterInput.style('font-family', 'Riforma Medium');
  maxGutterInput.style('color', 'white');
  maxGutterInput.style('background-color', 'black');
  maxGutterInput.style('border', '0');

  loopLabel = createSpan('loop');
  loopLabel.style('color', 'white');
  loopLabel.style('font-family', 'Riforma Medium');
  loopCheckbox = createElement('input');
  loopCheckbox.elt.type = 'checkbox';
  loopCheckbox.elt.checked = loop;

  captureLabel = createSpan('capture');
  captureLabel.style('color', 'white');
  captureLabel.style('font-family', 'Riforma Medium');
  captureCheckbox = createElement('input');
  captureCheckbox.elt.type = 'checkbox';
  captureCheckbox.elt.checked = captureOn;


  cancelButton = createButton('cancel');
  cancelButton.mouseClicked(cancelClicked);
  cancelButton.style('color', 'white');
  cancelButton.style('background-color', 'black');
  cancelButton.style('border', '0');

  okButton = createButton('ok');
  okButton.mouseClicked(okClicked);
  okButton.style('color', 'white');
  okButton.style('background-color', 'black');
  okButton.style('border', '0');

  positionUIElements();
  showUI(visibleUI);
}

function positionUIElements() {
  durationLabel.position((windowWidth - width) / 2 + marginLeft + 50 * scl, marginTop + 300 * scl);
  durationLabel.style('font-size', fontSize.toString() * 0.9 + 'px');
  durationInput.style('font-size', fontSize.toString() * 0.9 + 'px');
  durationInput.position((windowWidth - width) / 2 + marginLeft + 850 * scl, marginTop + 300 * scl);
  durationInput.style('width', (400 * scl).toString() + 'px');

  waitLabel.position((windowWidth - width) / 2 + marginLeft + 50 * scl, marginTop + 500 * scl);
  waitLabel.style('font-size', fontSize.toString() * 0.9 + 'px');
  waitInput.style('font-size', fontSize.toString() * 0.9 + 'px');
  waitInput.position((windowWidth - width) / 2 + marginLeft + 850 * scl, marginTop + 500 * scl);
  waitInput.style('width', (400 * scl).toString() + 'px');

  minWidthLabel.position((windowWidth - width) / 2 + marginLeft + 50 * scl, marginTop + 800 * scl);
  minWidthLabel.style('font-size', fontSize.toString() * 0.9 + 'px');
  minWidthInput.style('font-size', fontSize.toString() * 0.9 + 'px');
  minWidthInput.position((windowWidth - width) / 2 + marginLeft + 850 * scl, marginTop + 800 * scl);
  minWidthInput.style('width', (400 * scl).toString() + 'px');

  maxWidthLabel.position((windowWidth - width) / 2 + marginLeft + 50 * scl, marginTop + 1000 * scl);
  maxWidthLabel.style('font-size', fontSize.toString() * 0.9 + 'px');
  maxWidthInput.style('font-size', fontSize.toString() * 0.9 + 'px');
  maxWidthInput.position((windowWidth - width) / 2 + marginLeft + 850 * scl, marginTop + 1000 * scl);
  maxWidthInput.style('width', (400 * scl).toString() + 'px');

  minGutterLabel.position((windowWidth - width) / 2 + marginLeft + 50 * scl, marginTop + 1300 * scl);
  minGutterLabel.style('font-size', fontSize.toString() * 0.9 + 'px');
  minGutterInput.style('font-size', fontSize.toString() * 0.9 + 'px');
  minGutterInput.position((windowWidth - width) / 2 + marginLeft + 850 * scl, marginTop + 1300 * scl);
  minGutterInput.style('width', (400 * scl).toString() + 'px');

  maxGutterLabel.position((windowWidth - width) / 2 + marginLeft + 50 * scl, marginTop + 1500 * scl);
  maxGutterLabel.style('font-size', fontSize.toString() * 0.9 + 'px');
  maxGutterInput.style('font-size', fontSize.toString() * 0.9 + 'px');
  maxGutterInput.position((windowWidth - width) / 2 + marginLeft + 850 * scl, marginTop + 1500 * scl);
  maxGutterInput.style('width', (400 * scl).toString() + 'px');

  loopLabel.position((windowWidth - width) / 2 + marginLeft + 50 * scl, marginTop + 1800 * scl);
  loopLabel.style('font-size', fontSize.toString() * 0.9 + 'px');
  loopCheckbox.position((windowWidth - width) / 2 + marginLeft + 850 * scl, marginTop + 1830 * scl);

  captureLabel.position((windowWidth - width) / 2 + marginLeft + 50 * scl, marginTop + 2100 * scl);
  captureLabel.style('font-size', fontSize.toString() * 0.9 + 'px');
  captureCheckbox.position((windowWidth - width) / 2 + marginLeft + 850 * scl, marginTop + 2130 * scl);

  cancelButton.position(windowWidth / 2 - 600 * scl, height - marginBottom - 170 * scl);
  cancelButton.style('font-size', fontSize.toString() * 0.9 + 'px');
  cancelButton.style('width', (400 * scl).toString() + 'px');
  okButton.position(windowWidth / 2 + 200 * scl, height - marginBottom - 170 * scl);
  okButton.style('font-size', fontSize.toString() * 0.9 + 'px');
  okButton.style('width', (400 * scl).toString() + 'px');
}

// input ------------------------------
// function mousePressed() {
function canvasMouseClicked() {
  if (!visibleUI && !captureOn) {
    visibleUI = true;
    showUI(visibleUI);
  }
}


function okClicked() {
  visibleUI = false;
  showUI(visibleUI);

  // adjust duration
  if (animDuration != durationInput.elt.value) {
    animDuration = max(1, durationInput.elt.value);
    durationInput.elt.value = animDuration;
    masterTimer.duration = animDuration;
    masterTimer.animations[0].tweens[0].duration = animDuration;
  }
  // adjust wait duration
  if (waitDuration != waitInput.elt.value) {
    waitDuration = max(1, waitInput.elt.value);
    waitInput.elt.value = waitDuration;
    waitTimer1.duration = waitDuration;
    waitTimer2.duration = waitDuration;
  }

  // adjust width
  if (tWidthMin != minWidthInput.elt.value) {
    tWidthMin = max(1, minWidthInput.elt.value);
    minWidthInput.elt.value = tWidthMin;
    if (tWidth < tWidthMin - 1) {
      tWidth = tWidthMin - 1;
      gutterWidth = tWidth;
      numberOfColumnsMax = ceil(tWidth / 2);
    }
  }

  if (tWidthMax != maxWidthInput.elt.value) {
    tWidthMax = max(1, maxWidthInput.elt.value);
    maxWidthInput.elt.value = tWidthMax;
    if (tWidth > tWidthMax) {
      tWidth = tWidthMax;
      gutterWidth = tWidth;
      numberOfColumnsMax = ceil(tWidth / 2);
    }
  }

  // adjust gutter
  if (gutterWidthMin != minGutterInput.elt.value) {
    gutterWidthMin = max(0, minGutterInput.elt.value);
    minGutterInput.elt.value = gutterWidthMin;
  }

  if (gutterWidthMax != maxGutterInput.elt.value) {
    gutterWidthMax = max(0, maxGutterInput.elt.value);
    maxGutterInput.elt.value = gutterWidthMax;
  }
  if (gutterWidth < gutterWidthMin) gutterWidth = gutterWidthMin;
  if (gutterWidth > gutterWidthMax) gutterWidth = gutterWidthMax;

  loop = loopCheckbox.elt.checked;

  captureOn = captureCheckbox.elt.checked;

  if (captureOn) {
    captureStarted = false;
    tWidth = max(0, tWidthMin - 2);
    gutterWidth = tWidth;
    loop = false; // turn loop off for capturing
    loopCheckbox.elt.checked = loop;
    cRow.type = '';
    waitTimer1.pause();
    waitTimer2.pause();
    masterTimer.restart();

  }

  calculateScaledProperties();
}

function cancelClicked() {
  visibleUI = false;
  showUI(visibleUI);
  // console.log("duration: ", durationInput.elt.value);

  durationInput.elt.value = animDuration;
  waitInput.elt.value = waitDuration;
  minWidthInput.elt.value = tWidthMin;
  maxWidthInput.elt.value = tWidthMax;
  minGutterInput.elt.value = gutterWidthMin;
  maxGutterInput.elt.value = gutterWidthMax;
  loopCheckbox.elt.checked = loop;
  captureCheckbox.elt.checked = captureOn;
}

function showUI() {
  if (visibleUI) {
    durationLabel.show();
    durationInput.show();
    waitLabel.show();
    waitInput.show();
    minWidthLabel.show();
    minWidthInput.show();
    maxWidthLabel.show();
    maxWidthInput.show();
    minGutterLabel.show();
    minGutterInput.show();
    maxGutterLabel.show();
    maxGutterInput.show();
    loopCheckbox.show();
    loopLabel.show();
    captureCheckbox.show();
    captureLabel.show();

    cancelButton.show();
    okButton.show();
  } else {
    durationLabel.hide();
    durationInput.hide();
    waitLabel.hide();
    waitInput.hide();
    minWidthLabel.hide();
    minWidthInput.hide();
    maxWidthLabel.hide();
    maxWidthInput.hide();
    minGutterLabel.hide();
    minGutterInput.hide();
    maxGutterLabel.hide();
    maxGutterInput.hide();
    loopCheckbox.hide();
    loopLabel.hide();
    captureCheckbox.hide();
    captureLabel.hide();

    cancelButton.hide();
    okButton.hide();
  }
}

function keyPressed() {
  // console.log(keyCode);
  if (keyCode == 82) {
    'r'
    run = !run;
    masterTimer.restart();
    if (run) {
      // masterTimer.play();

    } else {
      // masterTimer.pause();
    }
  } else if (keyCode == 68) { // 'd'
    debug = !debug;
    if (debug) {} else {}
  } else if (keyCode == 13) { // enter
    okClicked();
  }
}


// function durationChanged(e) {
//   animDuration = e.target.value;
//   // animDuration = this.value();
//   masterTimer.duration = animDuration;
//   masterTimer.animations[0].tweens[0].duration = animDuration;
// }