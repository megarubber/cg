const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2"); 

if (!gl) throw new Error("WebGL 2 is not avaliable.");
  
const vertexShaderSource = `#version 300 es

in vec2 aPosition;
in vec3 aColor;
in float aPointSize;

out vec3 vColor;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  gl_PointSize = aPointSize;
  vColor = aColor;
}

`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

in vec3 vColor;

out vec4 outColor;

void main() {
	outColor = vec4(vColor, 1.0);
}

`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(error);
  }
  return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(
  gl,
  gl.FRAGMENT_SHADER,
  fragmentShaderSource,
);
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);

const vertices = [];
const verticesBuffer = gl.createBuffer();
const positionLocation = gl.getAttribLocation(program, "aPosition");
gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);

const colors = [];
const colorsBuffer = gl.createBuffer();
const colorLocation = gl.getAttribLocation(program, "aColor");
gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(
    colorLocation,
    3,
    gl.FLOAT,
    false,
    0,
    0
);

const pointSizeLocation = gl.getAttribLocation(program, "aPointSize");
gl.disableVertexAttribArray(pointSizeLocation);
gl.vertexAttrib1f(pointSizeLocation, 10.0);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(program));
}

gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.useProgram(program);

canvas.addEventListener("mousedown", spawnLine, false);
document.addEventListener("keydown", changeColor, false);

let lastMouseX = 300;
let lastMouseY = 300;
let currentMouseX = 0;
let currentMouseY = 0;
let numComponents = 1;

let index = 0;
const currentColor = {
  red: 0,
  green: 0,
  blue: 1,
};

function spawnLine(event) {
  vertices.length = 0;
  colors.length = 0;

  const x = event.offsetX;
  const y = event.offsetY;
  
  const test = index % 2 == 0;
  numComponents = bresenham(
    test ? x : lastMouseX, 
    test ? y : lastMouseY, 
    test ? lastMouseX : x, 
    test ? lastMouseY : y, 
  );

  drawScene(numComponents);
  index++;
  lastMouseX = x;
  lastMouseY = y;
}

function updateLineColor() {
  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = currentColor.red;
    colors[i + 1] = currentColor.green;
    colors[i + 2] = currentColor.blue;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(colors),
    gl.STATIC_DRAW
  );

  drawScene(numComponents);
}

function changeColor(event) {
  switch(event.key) {
    case "1":
      currentColor.red = 1;
      currentColor.green = 0;
      currentColor.blue = 0;
      break;
    case "2":
      currentColor.red = 0;
      currentColor.green = 1;
      currentColor.blue = 0;
      break;
    case "3":
      currentColor.red = 0;
      currentColor.green = 0;
      currentColor.blue = 0.3;
      break;
    case "4":
      currentColor.red = 0.5;
      currentColor.green = 0.3;
      currentColor.blue = 0;
      break;
    case "5":
      currentColor.red = 0;
      currentColor.green = 0.5;
      currentColor.blue = 0.6;
      break;
    case "6":
      currentColor.red = 0.3;
      currentColor.green = 0.3;
      currentColor.blue = 0.3;
      break;
    case "7":
      currentColor.red = 0.8;
      currentColor.green = 0;
      currentColor.blue = 0.7;
      break;
    case "8":
      currentColor.red = 0.5;
      currentColor.green = 0.1;
      currentColor.blue = 0.7;
      break;
    case "9":
      currentColor.red = 1;
      currentColor.green = 1;
      currentColor.blue = 1;
      break;
    default:
      currentColor.red = 0;
      currentColor.green = 0;
      currentColor.blue = 1;
      break;
  }
  updateLineColor();
}

function pixelToWebGL(x, y) {
  const webglX = (x / canvas.width) * 2 - 1;
  const webglY = -((y / canvas.height) * 2 - 1);

  return [webglX, webglY];
}

function addPixel(x, y) {
  vertices.push(x, y);
  gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertices),
    gl.STATIC_DRAW
  );

  colors.push(
    currentColor.red,
    currentColor.green,
    currentColor.blue,
  );
  gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(colors),
    gl.STATIC_DRAW
  );
}

function drawScene(numComponents){
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.drawArrays(
    gl.POINTS,
    0,
    numComponents
  );
}

function bresenham(px1, py1, px2, py2) {
  let components = 1;

  let x1 = Math.round(px1);
  let y1 = Math.round(py1);
  let x2 = Math.round(px2);
  let y2 = Math.round(py2);

  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);

  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;

  function adaptBresenhanToPixel(x, y) {
    const [webglX, webglY] = pixelToWebGL(x, y);
    addPixel(
      webglX, 
      webglY, 
    );
  }

  // Single point
  if (x1 === x2 && y1 === y2) {
    adaptBresenhanToPixel(x1, y1);
    return components;
  }

  // Vertical line
  if (dx === 0) {
    while (y1 !== y2) {
      adaptBresenhanToPixel(x1, y1);
      y1 += sy;
      components++;
    }

    adaptBresenhanToPixel(x2, y2);
    return components;
  }

  // Horizontal line
  if (dy === 0) {
    while (x1 !== x2) {
      adaptBresenhanToPixel(x1, y1);
      x1 += sx;
      components++;
    }

    adaptBresenhanToPixel(x2, y2);
    return components;
  }

  if (dx >= dy) {
    const incInf = 2 * dy;
    const incSup = 2 * (dy - dx);

    let p = 2 * dy - dx;

    adaptBresenhanToPixel(x1, y1);

    while (x1 !== x2) {
      if (p < 0) {
        p += incInf;
      } else {
        y1 += sy;
        p += incSup;
      }

      x1 += sx;

      components++;
      adaptBresenhanToPixel(x1, y1);
    }
  }
  else {
    const incInf = 2 * dx;
    const incSup = 2 * (dx - dy);

    let p = 2 * dx - dy;

    adaptBresenhanToPixel(x1, y1);

    while (y1 !== y2) {
      if (p < 0) {
        p += incInf;
      } else {
        x1 += sx;
        p += incSup;
      }

      y1 += sy;

      components++;
      adaptBresenhanToPixel(x1, y1);
    }
  }

  return components;
}

addPixel(0, 0);
drawScene(numComponents);
