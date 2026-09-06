const canvas = document.getElementById("canvas");
const pontosDireita = document.getElementById("direita");
const pontosEsquerda = document.getElementById("esquerda");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado.");
}

// --------------------------------------------------
// VERTICES E CORES
// --------------------------------------------------

function verticesBarra(){
    return new Float32Array([
        -0.05,  0.2,
        -0.05, -0.2,
         0.05,  0.2,
         0.05,  0.2,
        -0.05, -0.2,
         0.05, -0.2
    ]);
}

function verticesBola(){
    let vertices = [];
    let numSegments = 30;
    let radius = 0.05;

    for (let i = 0; i < numSegments; i++) {
        let theta1 = (i / numSegments) * 2 * Math.PI;
        let theta2 = ((i + 1) / numSegments) * 2 * Math.PI;

        vertices.push(0, 0); // Center of the circle
        vertices.push(radius * Math.cos(theta1), radius * Math.sin(theta1));
        vertices.push(radius * Math.cos(theta2), radius * Math.sin(theta2));
    }

    return new Float32Array(vertices);
}

let verticesBarraDireita = verticesBarra();

let corBarraDireita = new Float32Array([
    0.0, 0.0, 1.0,
]);

let verticesBarraEsquerda = verticesBarra();

let corBarraEsquerda = new Float32Array([
    0.0, 1.0, 0.0,
]);

let verticesBolaCentro = verticesBola();

let corBolaCentro = new Float32Array([
    1.0, 0.0, 0.0,
]);

// --------------------------------------------------
// PARÂMETROS ANIMAÇÃO
// --------------------------------------------------

const txBE = -0.9;
const txBD = 0.9;

let tyBE = 0.0;
let tyBD = 0.0;

let txBE_offset = 0.01;
let txBD_offset = 0.01;

let tyBE_offset = 0.03;
let tyBD_offset = 0.03;

let txBola = 0.0;
let tyBola = 0.0;

let txBola_offset = 0.005;
let tyBola_offset = 0.005;

const keysPressed = {
    w: false,
    s: false,
    arrowup: false,
    arrowdown: false,
};

let pontosEsq = 0;
let pontosDir = 0;

// --------------------------------------------------
// TRANSFORMAÇÕES
// --------------------------------------------------

let MbarraEsquerda = m3.translation(txBE, 0.0);

let MbarraDireita = m3.translation(txBD, 0.0);

let MbolaCentro = m3.identity();

// --------------------------------------------------
// BUFFER
// --------------------------------------------------

const verticesBuffer = gl.createBuffer();

// --------------------------------------------------
// VERTEX SHADER
// --------------------------------------------------

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_transform;

out vec3 vColor;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}

`;


// --------------------------------------------------
// FRAGMENT SHADER
// --------------------------------------------------

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}

`;


// --------------------------------------------------
// COMPILAR SHADERS
// --------------------------------------------------

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


const vertexShader = createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
);

const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
);


// --------------------------------------------------
// CRIAR PROGRAMA
// --------------------------------------------------

const program = gl.createProgram();

gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {

    throw new Error(
        gl.getProgramInfoLog(program)
    );
}


// --------------------------------------------------
// LOCAL DOS ATRIBUTOS E DO UNIFORM
// --------------------------------------------------

const positionLocation =
    gl.getAttribLocation(
        program,
        "aPosition"
    );

const colorLocation =
    gl.getUniformLocation(
        program,
        "uColor"
    );

const transformLocation =
    gl.getUniformLocation(
        program,
        "u_transform"
    );

// --------------------------------------------------
// LIMPAR TELA
// --------------------------------------------------

gl.clearColor(0.1, 0.1, 0.1, 1.0);

gl.clear(gl.COLOR_BUFFER_BIT);


// --------------------------------------------------
// DESENHAR
// --------------------------------------------------

const numComponents = 2;

function drawScene(){
    atualizaAnimacao();

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    
    requestAnimationFrame(drawScene);
}

function drawBarraEsquerda(){
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraEsquerda,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraEsquerda
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraEsquerda
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraEsquerda.length / numComponents
    );

}

function drawBarraDireita(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBarraDireita,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBarraDireita
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbarraDireita
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBarraDireita.length / numComponents
    );

}

function drawBolaCentro(){

    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);

    gl.bufferData(
        gl.ARRAY_BUFFER,
        verticesBolaCentro,
        gl.STATIC_DRAW
    );

    gl.enableVertexAttribArray(positionLocation);

    gl.vertexAttribPointer(
        positionLocation,
        2,
        gl.FLOAT,
        false,
        0,
        0
    );

    gl.uniform3fv(
        colorLocation,
        corBolaCentro
    );

    gl.uniformMatrix3fv(
        transformLocation,
        false,
        MbolaCentro
    );

    gl.drawArrays(
        gl.TRIANGLES,
        0,
        verticesBolaCentro.length / numComponents
    );

}

function atualizarBolaOffset(inverter) {
    if(inverter) {
        if(txBola_offset > 0.03 || txBola_offset < -0.03) {
            txBola_offset = -txBola_offset;
            return;
        }
        txBola_offset = txBola > 0 ? -(txBola_offset + 0.007) : -(txBola_offset - 0.007);
        return;
    }

    txBola_offset = txBola > 0 ? (txBola_offset + 0.007) : (txBola_offset - 0.007);
}

function resetBola(firstMatch=false) {
    const initialRandomValue = Math.random() * ((0.015) - 0.005) + 0.005;
    if (txBola > 0) {
        if(!firstMatch) pontosEsq++;
        pontosEsquerda.textContent = `${pontosEsq}`;
        txBola_offset = -initialRandomValue;
    } else {
        if(!firstMatch) pontosDir++;
        pontosDireita.textContent = `${pontosDir}`;
        txBola_offset = initialRandomValue;
    }
    txBola = 0;
    tyBola = 0;
}

function colisao() {
    const checkTyBDHeight = tyBola > tyBD + 0.25 || tyBola < tyBD - 0.25;
    const checkTyBEHeight = tyBola > tyBE + 0.25 || tyBola < tyBE - 0.25;

    if(!checkTyBEHeight && txBola < -0.8) {
        atualizarBolaOffset(true);
        return;
    }

    if(txBola > 0.8 && !checkTyBDHeight) {
        atualizarBolaOffset(true);
        return;
    }

    if(txBola > 0.8 || txBola < -0.8) {
        resetBola();
        return;
    }

    if(tyBola > 0.9 || tyBola < -0.9) {
        tyBola_offset = -tyBola_offset;
        atualizarBolaOffset(false);
    }
}

function atualizaAnimacao(){
    txBola += txBola_offset;
    tyBola += tyBola_offset;

    colisao();

    MbolaCentro = m3.translation(txBola,tyBola);
    
    if(keysPressed['w'] && tyBE < 0.75) tyBE += tyBE_offset;
    if(keysPressed['s'] && tyBE > -0.75) tyBE -= tyBE_offset;
    MbarraEsquerda = m3.translation(txBE, tyBE);

    if(keysPressed['arrowup'] && tyBD < 0.75) tyBD += tyBD_offset;
    if(keysPressed['arrowdown'] && tyBD > -0.75) tyBD -= tyBD_offset;
    MbarraDireita = m3.translation(txBD, tyBD);
}

// --------------------------------------------------
// INÍCIO DO DESENHO
// --------------------------------------------------

resetBola(true);
drawScene();

// --------------------------------------------------
// AÇÕES DO TECLADO 
// --------------------------------------------------

function ativarTecla(event) {
    keysPressed[event.key.toLowerCase()] = true;
}

function desativarTecla(event) {
    keysPressed[event.key.toLowerCase()] = false;
}

document.addEventListener("keydown", ativarTecla, false);
document.addEventListener("keyup", desativarTecla, false);
