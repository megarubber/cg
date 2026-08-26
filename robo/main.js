const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) throw new Error("WebGL 2 is not avaliable.");

const numSides = 40;

function circle(xOffset, yOffset) {
  const vertices = [];
  const radius = 0.1;
  vertices.push(xOffset, yOffset);
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
  ...rectangle(-0.437, 0.4, 0.07, 0.4),
  ...rectangle(0.365, 0.4, 0.07, 0.4),
  ...rectangle(-0.8, -0.4, 1.6, 1),
  ...rectangle(-1, -0.2, 0.2, 0.7),
  ...rectangle(0.8, -0.2, 0.2, 0.7),
  ...rectangle(0.1, 0, 0.4, 0.4),
  ...rectangle(-0.1, 0, -0.4, 0.4),
  ...rectangle(-0.45, -0.4, 0.9, 0.25),
  ...rectangle(-0.4, -0.4, 0.05, 0.25),
  ...rectangle(-0.2, -0.4, 0.05, 0.25),
  ...rectangle(0, -0.4, 0.05, 0.25),
  ...rectangle(0.17, -0.4, 0.05, 0.25),
  ...rectangle(0.35, -0.4, 0.05, 0.25),
  ...rectangle(-0.5, -1, 1, 0.5),
  ...circle(-0.4, 0.85),
  ...circle(0.4, 0.85),
);

const vertices = new Float32Array(ve);
const verticesBuffer = gl.createBuffer();
const positionLocation = gl.getAttribLocation(program, "aPosition");
gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

const circleColors = generateColors(0.3, 0.3, 0.3);
const rectangleFaceColors = generateColorsRectangle(0.6, 0.6, 0.6);
const rectangleDetailsColors = generateColorsRectangle(0.3, 0.3, 0.3);
const rectangleDetails2Colors = generateColorsRectangle(0.8, 0.8, 0.8);
const colorsBuffer = gl.createBuffer();
const l = generateColors(1, 0.7, 0.7);
const colorLocation = gl.getAttribLocation(program, "aColors");
const colors = new Float32Array([
  ...rectangleDetails2Colors,
  ...rectangleDetails2Colors,
  ...rectangleFaceColors,
  ...rectangleDetailsColors,
  ...rectangleDetailsColors,
  ...rectangleDetailsColors,
  ...rectangleDetailsColors,
  ...rectangleDetailsColors,
  ...rectangleDetails2Colors,
  ...rectangleDetails2Colors,
  ...rectangleDetails2Colors,
  ...rectangleDetails2Colors,
  ...rectangleDetails2Colors,
  ...rectangleDetailsColors,
  ...rectangleDetailsColors,
  ...circleColors,
  ...circleColors,
]);
gl.bindBuffer(gl.ARRAY_BUFFER, colorsBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

const circleSides = numSides + 2;
gl.clearColor(0.1, 0.1, 0.1, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.useProgram(program);

const numberElements = numSides + 2;
const offset = 6;
const numberOfElements = 14;
for(let i = 0; i < numberOfElements; i++)
  gl.drawArrays(gl.TRIANGLES, offset * i, offset);

for(let i = 0; i < 2; i++)
  gl.drawArrays(gl.TRIANGLE_FAN, i * numberElements + numberOfElements * offset, numberElements);
