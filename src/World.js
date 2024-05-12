// Vertex shader program
var VSHADER_SOURCE = `
  precision mediump float;
  attribute vec4 a_Position;
  attribute vec2 a_UV;
  varying vec2 v_UV;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }`

  

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_UV;
  uniform vec4 u_FragColor;
  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform int u_whichTexture;
  void main() {
    if (u_whichTexture == -3) {
      gl_FragColor = texture2D(u_Sampler1, v_UV); //use texture1
    } else 
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;   //use color

    } else if (u_whichTexture == -1) {
      gl_FragColor = vec4(v_UV, 0.2, 1.0); //use uv texture

    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV); //use texture0

    } else {
      gl_FragColor = vec4(1,.2,.2,1); // error, put redish
    }

  }`

//Global variables
let canvas;
let gl;
let a_Position;
let a_UV;
let u_FragColor;
let u_Size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_whichTexture;

var g_eye = [16,9,36];
//var g_eye = [0,0,3];
//var g_eye = [9,5,36];
var g_at = [0,0,-100];
var g_up = [0,1,0];

//get the canvas and gl context
function setupWebGL(){
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  //gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

//compile the shader programs, attach the javascript variables to the GLSL variables
function connectVariablesToGLSL(){
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  a_UV = gl.getAttribLocation(gl.program, 'a_UV');
  if (a_UV < 0) {
    console.log('Failed to get the storage location of a_UV');
    return;
  }

  u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
  if (!u_whichTexture) {
    console.log('Failed to get the storage location of u_whichTexture');
    return false;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ViewMatrix) {
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
  if (!u_ProjectionMatrix) {
    console.log('Failed to get the storage location of u_ProjectionMatrix');
    return;
  }

  //Get the storage location of u_Sampler
  u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
  if (!u_Sampler0) {
    console.log('Failed to get the storage location of u_Sampler0');
    return false;
  }

  u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
  if (!u_Sampler1) {
    console.log('Failed to get the storage location of u_Sampler1');
    return false;
  }

  // Set the initial value of this matrix to identity
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

//Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global variables related to UI elements
let g_selectedSize=5;
let g_selectedType=POINT;
let g_selectedSegments=10;
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation = false;
let g_magentaAnimation = false;

// Set up actions for the HTML UI elements
function addActionsForHtmlUI(){
    document.getElementById('ViewMaze').onclick   = function() { g_eye = [16,9,36];};
    document.getElementById('BeginMaze').onclick   = function() { g_eye = [12,0,33];};

}

function initTextures() {
  //var texture = gl.createTexture(); //Create a texture object
  //if (!texture) {
  //  console.log('Failed to create the texture object');
  //  return false;
  //}

  var image = new Image(); //Create the image object
  if (!image) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image.onload = function(){ sendImageToTEXTURE0(image);};
  //Tell the browser to load an image
  image.src = 'wall1.jpg';

  //Add more texture loading later if we want
  var image1 = new Image(); //Create the image object
  if (!image1) {
    console.log('Failed to create the image object');
    return false;
  }
  // Register the event handler to be called on loading an image
  image1.onload = function(){ sendImageToTEXTURE1(image1);};
  //Tell the browser to load an image
  image1.src = 'redwall.jpg';


  return true;
}

function sendImageToTEXTURE0(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); //Flip the image's y axis
  //Enable texture unit0
  gl.activeTexture(gl.TEXTURE0);
  //Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  //Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  //Set the texture image
  // (targer, level, internalformat, format, type, pixels)
  // Documentation at https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  //Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler0, 0);

  //console.log('finished loadTexture');
}

function sendImageToTEXTURE1(image) {
  var texture = gl.createTexture();
  if (!texture) {
    console.log('Failed to create the texture object');
    return false;
  }

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); //Flip the image's y axis
  //Enable texture unit0
  gl.activeTexture(gl.TEXTURE1);
  //Bind the texture object to the target
  gl.bindTexture(gl.TEXTURE_2D, texture);

  //Set the texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  //Set the texture image
  // (targer, level, internalformat, format, type, pixels)
  // Documentation at https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

  //Set the texture unit 0 to the sampler
  gl.uniform1i(u_Sampler1, 0);

  //console.log('finished loadTexture');
}

function main() {

  //Set up canvas and gl variables
  setupWebGL();
  // Set up GLSL shader programs and connect GLSL variables
  connectVariablesToGLSL();

  //Setup actions for the HTML UI variables
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) { click(ev) } };

  document.onkeydown = keydown;

  initTextures();
  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  //gl.clear(gl.COLOR_BUFFER_BIT);
  //renderAllShapes();
  requestAnimationFrame(tick);

}

var g_shapesList = [];

function click(ev) {
  //Extract the event click and return it in WebGL coordinates
  let [x,y] = convertCoordinatesEventToGL(ev);

  g_globalAngle = x * 120;
  renderAllShapes();
}

function drawMyPicture(){
  let [x,y] = [0.1,0.1];
  let point;
  //g_selectedColor = [0.0,1.0,0.0,1.0];
  point = new Picture();
  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = 10;
  g_shapesList.push(point);

  renderAllShapes();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function doAwesomeness(){
  let [x,y] = [0.1,0.1];
  let point;
  //g_selectedColor = [0.0,1.0,0.0,1.0];
  point = new Picture();
  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = 10;
  g_shapesList.push(point);
  renderAllShapes();

  sleep(1000).then(() => {
  point = new Picture1();
  point.position = [x,y];
  point.color = g_selectedColor.slice();
  point.size = 10;
  g_shapesList.push(point);
  renderAllShapes();
  });
}

//Extract the event click and return it in WebGL coordinates
function convertCoordinatesEventToGL(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer
    var y = ev.clientY; // y coordinate of a mouse pointer
    var rect = ev.target.getBoundingClientRect();
  
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
  
    return([x, y]);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

//Called by browser repeatedly whenever its time
function tick() {
  g_seconds = performance.now()/1000.0 - g_startTime;
  updateAnimationAngles();
  renderAllShapes();
  requestAnimationFrame(tick);
}

//Update the angles of everything if currently animated
function updateAnimationAngles(){
  if (g_magentaAnimation){
    g_magentaAngle = (45*Math.sin(g_seconds));
  }
  if (g_yellowAnimation){
    g_yellowAngle = (45*Math.sin(g_seconds));
  }
}

//handling the keyboard
function keydown(ev){
  //D
  if (ev.keyCode==68) { //Right arrow 39
    g_eye[0] += 0.2;//D - Move Right
  } else
  if (ev.keyCode == 65) { //Left arrow
    g_eye[0] -= 0.2;//A - Move Left
  }else
  if (ev.keyCode == 87) { //Left arrow
    g_eye[2] -= 0.2;//W - Move Forward
  }else
  if (ev.keyCode == 83) { //Left arrow
    g_eye[2] += 0.2;//S - Move Backward
  }else
  if (ev.keyCode == 81) { //Left arrow
    g_globalAngle -= 1;//Q - Turn Left
  }else
  if (ev.keyCode == 69) { //Left arrow
    g_globalAngle += 1;//E - Turn Right
  }

  renderAllShapes();
  console.log(ev.keyCode);
}


var g_camera = new Camera();

var g_map = [
[4 , 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
[4 , 3, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 2, 2, 3, 4],
[0 , 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
[0 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0],
[4 , 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 2, 2, 3, 4],
[1 , 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
[1 , 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1],
[1 , 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
[1 , 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 2, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
[1 , 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 1, 0, 0, 0, 0, 0, 3, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 4, 1, 1, 0, 0, 1],
[1 , 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 1, 1, 3, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[1 , 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
[4 , 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 4],
];

function drawMap() {
  for (i=1;i<5;i++){
    for (x=0;x<32;x++){
      for (y=0;y<32;y++) {
        if (i == 1) {
          if ((g_map[x][y] == 1) || (g_map[x][y] == 2) || (g_map[x][y] == 3) || (g_map[x][y] == 4)) {
              var body = new Cube();
              body.color = [1.0, 1.0, 1.0, 1.0];
              //body.matrix.translate(0, -.75, 0);
              //body.matrix.scale(0.5, 0.5, 0.5);
              body.textureNum = 0;
              //body.matrix.translate(x-16, 0, y-16);
              //console.log("x = " + x + ". y = " + y);
              body.matrix.translate(x-4, -.75, y-4);
              body.render();
          }
        }
        if (i == 2) {
          if ((g_map[x][y] == 2) || (g_map[x][y] == 3) || (g_map[x][y] == 4)) {
              var body = new Cube();
              body.color = [1.0, 1.0, 1.0, 1.0];
              //body.matrix.translate(0, -.75, 0);
              //body.matrix.scale(0.5, 0.5, 0.5);
              body.textureNum = 0;
              //body.matrix.translate(x-16, 0, y-16);
              body.matrix.translate(x-4, 0.25, y-4);
              body.render();
          }
        }

        if (i == 3) {
          if ((g_map[x][y] == 3) || (g_map[x][y] == 4)) {
              var body = new Cube();
              body.color = [1.0, 1.0, 1.0, 1.0];
              //body.matrix.translate(0, -.75, 0);
              //body.matrix.scale(0.5, 0.5, 0.5);
              body.textureNum = 0;
              //body.matrix.translate(x-16, 0, y-16);
              body.matrix.translate(x-4, 1.25, y-4);
              body.render();
          }
        }

        if (i == 4) {
          if (g_map[x][y] == 4){
              var body = new Cube();
              body.color = [1.0, 1.0, 1.0, 1.0];
              //body.matrix.translate(0, -.75, 0);
              //body.matrix.scale(0.5, 0.5, 0.5);
              body.textureNum = -1;
              //body.matrix.translate(x-16, 0, y-16);
              body.matrix.translate(x-4, 2.25, y-4);
              body.render();
          }

          if (g_map[x][y] == 5){
              var body = new Cube();
              body.color = [1.0, 1.0, 1.0, 1.0];
              //body.matrix.translate(0, -.75, 0);
              body.matrix.scale(0.01, 0.01, 0.01);
              body.textureNum = -2;
              //body.matrix.translate(x-16, 0, y-16);
              body.matrix.translate(x-4, -.75, y-4);
              body.render();
              drawDog(x,y);
          }
        }
      }
    }
  }
}

function drawCube(M, color){
  var rgba = color;
  //We have 4f below as we are passing 4 floating point values
  gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

  gl.uniformMatrix4fv(u_ModelMatrix, false, M.elements);

  drawTriangle3D([0,0,0,  1,1,0,  1,0,0]);
  drawTriangle3D([0,0,0,  0,1,0,  1,1,0]);

  //Fake the lighting by coloring different sides slightly different color
  gl.uniform4f(u_FragColor, rgba[0]*.9, rgba[1]*.9, rgba[2]*.9, rgba[3]);

  drawTriangle3D([0,1,0,  0,1,1,  1,1,1]);
  drawTriangle3D([0,1,0,  1,1,1,  1,1,0]);

  drawTriangle3D([1,1,0,  1,0,0,  1,1,1]);
  drawTriangle3D([1,0,0,  1,1,1,  1,0,1]);

  drawTriangle3D([0,1,0,  0,0,0,  0,0,1]);
  drawTriangle3D([0,1,0,  0,0,1,  0,1,1]);

  drawTriangle3D([0,0,0,  1,0,1,  0,0,1]);
  drawTriangle3D([0,0,0,  1,0,1,  1,0,0]);

  drawTriangle3D([0,0,1,  0,1,1,  1,1,1]);
  drawTriangle3D([0,0,1,  1,0,1,  1,1,1]);
}

function drawDog(x,z){

  var color = [1.0,0.0,0.0,1.0];
  var M = new Matrix4;

 //Draw the Head Cube
  color = [0.37,0.,0,1.0];
  M.setIdentity();
  M.translate(-.55+x,.35,0.0+z);
  M.scale(0.7,.4,.5);
  drawCube(M, color);

  //Draw eyes
  M.setIdentity();
  color = [1,1,1,1.0];
  M.translate(-.45+x,.59,-0.05+z);
  M.scale(0.1,.1,.1);
  drawCube(M, color);

  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-.43+x,.6,-0.07+z);
  M.scale(0.05,.05,.05);
  drawCube(M, color);

  M.setIdentity();
  color = [1,1,1,1.0];
  M.translate(-.05+x,.59,-0.05+z);
  M.scale(0.1,.1,.1);
  drawCube(M, color);

  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-.03+x,.6,-0.07+z);
  M.scale(0.05,.05,.05);
  drawCube(M, color);

  //Draw snout
  M.setIdentity();
  color = [0.48,0.,0,1.0];
  M.translate(-.3+x,0.36,-0.1+z);
  M.scale(0.2,.18,.2);
  drawCube(M, color);

  //Draw nose
  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-0.25+x,.48,-0.13+z);
  M.scale(0.09,.07,.05);
  drawCube(M, color);

  //Draw mouth
  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-0.21+x,.4,-0.11+z);
  M.scale(0.01,.1,.03);
  drawCube(M, color);

  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-0.21+x,.4,-0.106+z);
  M.scale(0.07,.01,.03);
  drawCube(M, color);

  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-0.27+x,.4,-0.106+z);
  M.scale(0.07,.01,.03);
  drawCube(M, color);

  //Draw ears
  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(.16+x,0.41,-0.07+z);
  M.rotate(6,10,0,25); //6,10,0,25
  M.scale(0.1,0.35,.2);
  drawCube(M, color);

  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-.66+x,0.41,-0.07+z);
  M.rotate(-6,10,0,25);
  M.scale(0.1,0.35,.2);
  drawCube(M, color);

  //Draw neck
  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-0.3+x,0.2,0.2+z);
  //body.matrix.rotate(-5,1,0,0);
  M.scale(0.2,0.24,.2);
  drawCube(M, color);

  //Draw body
  M.setIdentity();
  color = [0.37,0.,0,1.0];
  M.translate(-0.5+x,-0.45,0.14+z);
  //body.matrix.rotate(-5,1,0,0);
  M.scale(0.6,.68,.4);
  drawCube(M, color);

  //Draw paws
  M.setIdentity();
  color = [0.2,0.,0,1.0];
  M.translate(-0.5+x,-0.47,-0.07+z);
  M.scale(0.2,0.24,.2);
  drawCube(M, color);

  M.setIdentity();
  color = [0.2,0.,0,1.0];
  M.translate(-0.7+x,-0.47,0.35+z);
  M.scale(0.2,0.24,.2);
  drawCube(M, color);

  M.setIdentity();
  color = [0.2,0.,0,1.0];
  M.translate(-0.1+x,-0.47,-0.07+z);
  M.scale(0.2,0.24,.2);
  drawCube(M, color);

  M.setIdentity();
  color = [0.2,0.,0,1.0];
  M.translate(0.1+x,-0.47,0.35+z);
  M.scale(0.2,0.24,.2);
  drawCube(M, color);

  //Draw legs
  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-0.5+x,-0.01,.04+z);
  M.scale(0.2,0.235,.1);
  drawCube(M, color);

  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-0.5+x,-0.24,.04+z);
  M.scale(0.2,0.235,.1);
  drawCube(M, color);

  M.setIdentity();
  color = [0.25,0.,0,1.0];
  M.translate(-0.61+x,-0.24,0.35+z);
  M.scale(0.11,0.47,.2);
  drawCube(M, color);

  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-0.1+x,-0.01,0.04+z);
  M.scale(0.2,0.235,.1);
  drawCube(M, color);

  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-0.1+x,-0.24,0.04+z);
  M.scale(0.2,0.235,.1);
  drawCube(M, color);


  M.setIdentity();
  color = [0.25,0.,0,1.0];
  //M.translate(0.1,-0.24,0.35);
  M.translate(0.1+x,-0.24,0.35+z);
  M.scale(0.11,0.47,.2);
  drawCube(M, color);

}

//Backup of the old function
//--------------------------------------------------
function drawDogOld(){

  var color = [1.0,0.0,0.0,1.0];
  var M = new Matrix4;

 //Draw the Head Cube
  color = [0.37,0.,0,1.0];
  M.setIdentity();
  M.translate(-.55,.35,0.0);
  M.scale(0.7,.4,.5);
  drawCube(M, color);

  //Draw eyes
  M.setIdentity();
  color = [1,1,1,1.0];
  M.translate(-.45,.59,-0.05);
  M.scale(0.1,.1,.1);
  drawCube(M, color);

  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-.43,.6,-0.07);
  M.scale(0.05,.05,.05);
  drawCube(M, color);

  M.setIdentity();
  color = [1,1,1,1.0];
  M.translate(-.05,.59,-0.05);
  M.scale(0.1,.1,.1);
  drawCube(M, color);

  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-.03,.6,-0.07);
  M.scale(0.05,.05,.05);
  drawCube(M, color);

  //Draw snout
  M.setIdentity();
  color = [0.48,0.,0,1.0];
  M.translate(-.3,0.36,-0.1);
  M.scale(0.2,.18,.2);
  drawCube(M, color);

  //Draw nose
  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-0.25,.48,-0.13);
  M.scale(0.09,.07,.05);
  drawCube(M, color);

  //Draw mouth
  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-0.21,.4,-0.11);
  M.scale(0.01,.1,.03);
  drawCube(M, color);

  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-0.21,.4,-0.106);
  M.scale(0.07,.01,.03);
  drawCube(M, color);

  M.setIdentity();
  color = [0,0,0,1.0];
  M.translate(-0.27,.4,-0.106);
  M.scale(0.07,.01,.03);
  drawCube(M, color);

  //Draw ears
  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(.16,0.41,-0.07);
  M.rotate(6,10,0,25); //6,10,0,25
  M.scale(0.1,0.35,.2);
  drawCube(M, color);

  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-.66,0.41,-0.07);
  M.rotate(-6,10,0,25);
  M.scale(0.1,0.35,.2);
  drawCube(M, color);

  //Draw neck
  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-0.3,0.2,0.2);
  //body.matrix.rotate(-5,1,0,0);
  M.scale(0.2,0.24,.2);
  drawCube(M, color);

  //Draw body
  M.setIdentity();
  color = [0.37,0.,0,1.0];
  M.translate(-0.5,-0.45,0.14);
  //body.matrix.rotate(-5,1,0,0);
  M.scale(0.6,.68,.4);
  drawCube(M, color);

  //Draw paws
  M.setIdentity();
  color = [0.2,0.,0,1.0];
  M.translate(-0.5,-0.47,-0.07);
  M.scale(0.2,0.24,.2);
  drawCube(M, color);

  M.setIdentity();
  color = [0.2,0.,0,1.0];
  M.translate(-0.7,-0.47,0.35);
  M.scale(0.2,0.24,.2);
  drawCube(M, color);

  M.setIdentity();
  color = [0.2,0.,0,1.0];
  M.translate(-0.1,-0.47,-0.07);
  M.scale(0.2,0.24,.2);
  drawCube(M, color);

  M.setIdentity();
  color = [0.2,0.,0,1.0];
  M.translate(0.1,-0.47,0.35);
  M.scale(0.2,0.24,.2);
  drawCube(M, color);

  //Draw legs
  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-0.5,-0.01,.04);
  M.scale(0.2,0.235,.1);
  drawCube(M, color);

  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-0.5,-0.24,.04);
  M.scale(0.2,0.235,.1);
  drawCube(M, color);

  M.setIdentity();
  color = [0.25,0.,0,1.0];
  M.translate(-0.61,-0.24,0.35);
  M.scale(0.11,0.47,.2);
  drawCube(M, color);

  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-0.1,-0.01,0.04);
  M.scale(0.2,0.235,.1);
  drawCube(M, color);

  M.setIdentity();
  color = [0.27,0.,0,1.0];
  M.translate(-0.1,-0.24,0.04);
  M.scale(0.2,0.235,.1);
  drawCube(M, color);


  M.setIdentity();
  color = [0.25,0.,0,1.0];
  //M.translate(0.1,-0.24,0.35);
  M.translate(0.1,-0.24,0.35);
  M.scale(0.11,0.47,.2);
  drawCube(M, color);

  //Draw tail
  //M.setIdentity();
  //color = [0.2,0.,0,1.0];
  //tail1.matrix.rotate(0,1,0,45);

  //var bottomTailCoordinatesMat = new Matrix4(M);
  //M.scale(0.15,0.15,.2);
  //M.translate(-0.26,-0.45,0.5);

    //Rotates up and down, the way we want the back leg
    //M.setTranslate(0,-0.45, 0.5);
    //M.rotate(g_tailBottomAngle,0,0,1);
    //var bottomTailCoordinatesMat = new Matrix4(M);
    //M.scale(0.15, 0.15, 0.2);
    //M.translate(-1.8,0, 0);

  //M.setTranslate(0,-0.45, 0);
  //M.rotate(g_tailBottomAngle,0,0,1);
  //var bottomTailCoordinatesMat = new Matrix4(M);
  
  //M.translate(-0.275,-0.45,0.5);
  //M.rotate(g_tailBottomAngle,0,0,1);
  //var bottomTailCoordinatesMat = new Matrix4(M);
 //M.scale(0.15, 0.15, 0.2);
  //drawCube(M, color);

}

//based on some data structure that is holding all the information about what to draw, 
//actually draw all the shapes.
function renderAllShapes(){

    // Check the time at the start of this function
    var startTime = performance.now();

    //pass the projection matrix
    var projMat=new Matrix4();
    projMat.setPerspective(90, canvas.width/canvas.height, .1,100 );
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    //pass the view matrix
    var viewMat=new Matrix4();
    viewMat.setLookAt(
      g_eye[0],g_eye[1],g_eye[2], 
      g_at[0], g_at[1],g_at[2], 
      g_up[0],g_up[1],g_up[2]); //(eye, at, up)

      //g_eye[0],g_eye[1],g_eye[2], 
      //g_at[0], g_at[1],g_at[2], 
      //g_up[0],g_up[1],g_up[2]); //(eye, at, up)
      //g_camera.eye.x,g_camera.eye.y, g_camera.eye.z,
      //g_camera.at.x,g_camera.at.y, g_camera.at.z,
      //g_camera.up.x,g_camera.up.y, g_camera.up.z); 
      //viewMat.setLookAt(0,0,-1, 0,0,0, 0,1,0); //(eye, at, up)

    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear <canvas>
     gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
     gl.clear(gl.COLOR_BUFFER_BIT);

    //var len = g_points.length;
   // var len = g_shapesList.length;
   // for(var i = 0; i < len; i++) {
   //   g_shapesList[i].render();
   // }

   //Draw the floor
   var floor = new Cube();
   floor.color = [.0, .5, .0, 1.0];
   floor.textureNum=-2;
   floor.matrix.translate(0, -.75, 0.0);
   floor.matrix.scale(90,0,90);
   floor.matrix.translate(-.5, 0, -0.5);
   floor.render();

   //Draw the sky
   var sky = new Cube();
   sky.color = [.1,0.4,0.9,1.0];
   sky.textureNum=-2;
   sky.matrix.scale(85,50,85);
   sky.matrix.translate(-.5, -.5, -0.5);
   sky.render();

   //Draw the Body Cube
   //var body = new Cube();
   //body.color = [1.0,0.0,0.0,1.0];
   //body.textureNum = -2;
   //body.matrix.translate(-.25,-.75,0.0);
   //body.matrix.rotate(-5,1,0,0);
   //body.matrix.scale(0.5,.3,.5);
   //body.render();

   //Draw a left arm
   //var leftArm = new Cube();
   //leftArm.color = [1,1,0,1];
   //leftArm.textureNum = -2;
   //Rotates up and down, not sideways
   //leftArm.matrix.setTranslate(0,-.5,0.0);
   //leftArm.matrix.rotate(-g_yellowAngle,0,0,1);
   //var yellowCoordinatesMat = new Matrix4(leftArm.matrix);
   //eftArm.matrix.scale(0.25,.7,.5);
   //leftArm.matrix.translate(-.5,0,0);
   //leftArm.render();

   //Purple tail end
   //var box = new Cube();
   //box.color = [1,0,1,1];
   //box.textureNum = -2;
   //box.matrix = yellowCoordinatesMat;
   //box.matrix.translate(0,0.65,0);
   //box.matrix.rotate(g_magentaAngle,0,0,1);
   //box.matrix.scale(0.3,.3,.3);
   //box.matrix.translate(-.5,0,-0.001);
   //box.render();

  //drawDog();

   drawMap();

    // Check the time at the end of the function, and show on web page
    var duration = performance.now() - startTime;
    sendTextToHTML("Performance: " + " fps: " + Math.floor(10000/duration)/10, "numdot");
}

//Set the text of a HTML element
function sendTextToHTML(text, htmlID) {
    var htmlElm = document.getElementById(htmlID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlID + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}