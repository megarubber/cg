const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) throw new Error("WebGL 2 is not avaliable.");

const numSides = 40;

function circle(xOffset, yOffset) {
  const vertices = [];
  const radius = 0.3;
  vertices.push(xOffset, yOffset);
  for (let i = 0; i <= numSides; i++) {
    const angle = (i * 2 * Math.PI) / numSides;
    const x = xOffset + radius * Math.cos(angle);
    const y = yOffset + radius * Math.sin(angle);
    vertices.push(x, y);
  }
  return vertices;
}

function petal(xOffset, yOffset) {
  const vertices = [];
  const radius = 0.2;
  vertices.push(0, 0);
  for (let i = 0; i <= numSides; i++) {
    const angle = (i * 2 * Math.PI) / numSides;
    const x = xOffset + radius * Math.cos(angle);
    const y = yOffset + radius * Math.sin(angle);
    vertices.push(x, y);
  }
  return vertices;
}

function rectangle(x, y, width, height, color = [1, 1, 1]) {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;

  const vertices = [x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2];

  return vertices;
}

function generateColorsRectangle(r, g, b) {
  const colors = [];
  for (let i = 0; i < 6; i++) colors.push(r, g, b);
  return colors;
}

function generateColors(r, g, b) {
  const colors = [];
  for (let i = 0; i < numSides + 2; i++) colors.push(r, g, b);
  return colors;
}

const vertexShaderSource = `#version 300 es

in vec2 aPosition;
in vec3 aColors;

out vec3 vColors;

void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
    vColors = aColors;
}

`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

in vec3 vColors;

out vec4 outColor;

void main() {
		outColor = vec4(vColors, 1.0);
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
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(program));
}

const ve = [];
ve.push(
  ...rectangle(-0.05, 0, 0.1, -1),
  ...petal(-0.4, 0.4),
  ...petal(-0.4, -0.4),
  ...petal(0.4, -0.4),
  ...petal(0.4, 0.4),
  ...petal(0, -0.4),
  ...petal(0, 0.4),
  ...petal(-0.4, 0),
  ...petal(0.4, 0),
  ...circle(0, 0),
);

const vertices = new Float32Array(ve);
const verticesBuffer = gl.createBuffer();
const positionLocation = gl.getAttribLocation(program, "aPosition");
gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const circleColors = generateColors(1, 1, 0);
const rectangleColors = generateColorsRectangle(0, 1, 0);
const colorsBuffer = gl.createBuffer();
const l = generateColors(1, 0.7, 0.7);
const colorLocation = gl.getAttribLocation(program, "aColors");
const colors = new Float32Array([
  ...rectangleColors,
  ...l,
  ...l,
  ...l,
  ...l,
  ...l,
  ...l,
  ...l,
  ...l,
  ...circleColors,
]);
gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

const numberElements = numSides + 2;
gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.useProgram(program);

const offset = 6;
gl.drawArrays(gl.TRIANGLES, 0, offset);

for (let i = 0; i < 9; i++)
  gl.drawArrays(gl.TRIANGLE_FAN, i * numberElements + offset, numberElements);
