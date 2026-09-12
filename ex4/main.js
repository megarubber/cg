const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) throw new Error("WebGL 2 is not avaliable.");

const vertexShaderSource = `#version 300 es

in vec2 aPosition;

uniform mat3 u_viewTransform;
uniform mat3 u_modelTransform;

void main() {

    vec3 position =
        u_viewTransform *
        u_modelTransform *
        vec3(aPosition, 1.0);

    gl_Position =
        vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShaderSource = `#version 300 es

precision mediump float;

uniform vec3 uColor;

out vec4 outColor;

void main() {

    outColor =
        vec4(uColor, 1.0);
}
`;

function createShader(gl, type, source) {

    const shader =
        gl.createShader(type);

    gl.shaderSource(
        shader,
        source
    );

    gl.compileShader(shader);

    if (
        !gl.getShaderParameter(
            shader,
            gl.COMPILE_STATUS
        )
    ) {

        const error =
            gl.getShaderInfoLog(shader);

        gl.deleteShader(shader);

        throw new Error(error);
    }

    return shader;
}

function createProgram(
    gl,
    vertexShaderSource,
    fragmentShaderSource
) {

    const vertexShader =
        createShader(
            gl,
            gl.VERTEX_SHADER,
            vertexShaderSource
        );

    const fragmentShader =
        createShader(
            gl,
            gl.FRAGMENT_SHADER,
            fragmentShaderSource
        );

    const program =
        gl.createProgram();

    gl.attachShader(
        program,
        vertexShader
    );

    gl.attachShader(
        program,
        fragmentShader
    );

    gl.linkProgram(program);

    if (
        !gl.getProgramParameter(
            program,
            gl.LINK_STATUS
        )
    ) {

        throw new Error(
            gl.getProgramInfoLog(program)
        );
    }

    return program;
}


const program =
    createProgram(
        gl,
        vertexShaderSource,
        fragmentShaderSource
    );


class Renderer {

    constructor(gl, program) {
        this.gl = gl;
        this.program = program;

        this.positionLocation =
            gl.getAttribLocation(
                program,
                "aPosition"
            );

        this.colorLocation =
            gl.getUniformLocation(
                program,
                "uColor"
            );

        this.viewTransformLocation =
            gl.getUniformLocation(
                program,
                "u_viewTransform"
            );

        this.modelTransformLocation =
            gl.getUniformLocation(
                program,
                "u_modelTransform"
            );

        this.viewTransform =
            m3.identity();

        this.verticesBuffer =
            gl.createBuffer();
    }

    defineViewTransform(viewTransform) {
        this.viewTransform =
            viewTransform;
    }

    draw(object) {
        const gl = this.gl;

        gl.bindBuffer(
            gl.ARRAY_BUFFER,
            this.verticesBuffer
        );

        gl.bufferData(
            gl.ARRAY_BUFFER,
            object.vertices,
            gl.STATIC_DRAW
        );

        gl.enableVertexAttribArray(
            this.positionLocation
        );

        gl.vertexAttribPointer(
            this.positionLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.uniform3fv(
            this.colorLocation,
            object.color
        );

        gl.uniformMatrix3fv(
            this.modelTransformLocation,
            false,
            object.modelTransform
        );

        gl.uniformMatrix3fv(
            this.viewTransformLocation,
            false,
            this.viewTransform
        );

        gl.drawArrays(
            gl.TRIANGLES,
            0,
            object.vertices.length / 2
        );
    }
}

function rectangleVertices(x,y,width,height){
    return [
        x, y,
        x+width, y+height,
        x, y+height,

        x, y,
        x+width, y,
        x+width, y+height
    ];
}

function circleVertices(radius, numSegments){
    const vertices = [];

    for (let i = 0; i < numSegments; i++) {
        const theta1 =
            (i / numSegments) *
            2 * Math.PI;

        const theta2 =
            ((i + 1) / numSegments) *
            2 * Math.PI;

        vertices.push(0,0);

        vertices.push(
            radius * Math.cos(theta1),
            radius * Math.sin(theta1)
        );

        vertices.push(
            radius * Math.cos(theta2),
            radius * Math.sin(theta2)
        );
    }

    return vertices;
}

function ellipseVertices(radiusX,radiusY,numSegments){
    const vertices = [];

    for (let i = 0; i < numSegments; i++) {
        const theta1 =
            (i / numSegments) *
            2 * Math.PI;

        const theta2 =
            ((i + 1) / numSegments) *
            2 * Math.PI;

        vertices.push(0,0);

        vertices.push(
            radiusX * Math.cos(theta1),
            radiusY * Math.sin(theta1)
        );

        vertices.push(
            radiusX * Math.cos(theta2),
            radiusY * Math.sin(theta2)
        );
    }

    return vertices;
}

function polygonVertices(points){
    const vertices = [];

    for (let i = 0; i < points.length; i++) {

        const p1 = points[i];

        const p2 = points[(i+1) % points.length];

        vertices.push(0,0);

        vertices.push(p1[0],p1[1]);

        vertices.push(p2[0],p2[1]);
    }

    return vertices;
}

function headVertices() {

    return new Float32Array(
        circleVertices(0.22,24)
    );
}

function eyeVertices() {

    return new Float32Array(
        ellipseVertices(0.028,0.06,12)
    );
}

function antennaStickVertices() {

    return new Float32Array(
        rectangleVertices(0.17, 0.07, 0.024, 0.16)
    );
}

function antennaBallVertices() {

    return new Float32Array(
        circleVertices(0.035,10)
    );
}

function neckVertices() {

    return new Float32Array(
        rectangleVertices(-0.055,0.15,0.11,0.10)
    );
}

function torsoVertices() {

    const points = [
        [-0.20, 0.16],
        [0.20, 0.16],
        [0.26, -0.02],
        [0.13, -0.22],
        [-0.13, -0.22],
        [-0.26, -0.02]
    ];

    return new Float32Array(
        polygonVertices(points)
    );
}

function speakerDotVertices() {

    const vertices = [];

    const dotSize = 0.028;
    const spacing = 0.045;

    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {

            const x = -spacing + col * spacing - dotSize/2;
            const y = -0.03 - row * spacing;

            vertices.push(
                ...rectangleVertices(x,y,dotSize,dotSize)
            );
        }
    }

    return new Float32Array(vertices);
}

function connectorVertices() {

    return new Float32Array(
        rectangleVertices(-0.07,-0.45,0.14,0.3)
    );
}

function shoulderBlobVertices() {

    return new Float32Array(
        circleVertices(0.09,16)
    );
}

function armVertices() {

    return new Float32Array(
        rectangleVertices(-0.035,-0.26,0.07,0.26)
    );
}

function handVertices() {

    return new Float32Array(
        circleVertices(0.055,12)
    );
}

function wheelVertices() {

    return new Float32Array(
        circleVertices(0.19,24)
    );
}

function hubVertices() {

    return new Float32Array(
        circleVertices(0.07,16)
    );
}

class SceneObject {

    constructor(vertices, color) {

        this.vertices = vertices;

        this.color = color;

        this.modelTransform = m3.identity();
    }

    updateModelTransform(modelTransform) {

        this.modelTransform = modelTransform;
    }
}

class ChildPart extends SceneObject {

    constructor(vertices, color, offsetX, offsetY) {

        super(vertices, color);

        this.offsetX = offsetX;

        this.offsetY = offsetY;
    }

    updateModelTransform(parentTransform) {

        const localTransform =
            m3.translation(this.offsetX,this.offsetY);

        this.modelTransform =

            m3.multiply(
                parentTransform,
                localTransform
            );
    }
}

class Antenna {

    constructor() {

        this.stick =
            new SceneObject(
                antennaStickVertices(),
                new Float32Array([0.1,0.1,0.1])
            );

        this.ball =
            new SceneObject(
                antennaBallVertices(),
                new Float32Array([0.1,0.1,0.1])
            );
    }

    updateModelTransform(headTransform) {

        const stickLocal =

            m3.multiply(
                m3.translation(-0.10,0.20),
                m3.rotation(-0.5)
            );

        this.stick.modelTransform =

            m3.multiply(
                headTransform,
                stickLocal
            );

        const ballLocal =
            m3.translation(0.17,0.32);

        this.ball.modelTransform =

            m3.multiply(
                headTransform,
                ballLocal
            );
    }

    draw(renderer) {

        renderer.draw(this.stick);

        renderer.draw(this.ball);
    }
}

class Head {

    constructor() {

        this.circle =
            new SceneObject(
                headVertices(),
                new Float32Array([1.0,1.0,1.0])
            );

        this.leftEye =
            new ChildPart(
                eyeVertices(),
                new Float32Array([0.05,0.05,0.05]),
                -0.08,0.02
            );

        this.rightEye =
            new ChildPart(
                eyeVertices(),
                new Float32Array([0.05,0.05,0.05]),
                0.08,0.02
            );

        this.antenna = new Antenna();
    }

    updateModelTransform(bodyTransform) {

        const localTransform =
            m3.translation(0.0,0.45);

        this.headTransform =

            m3.multiply(
                bodyTransform,
                localTransform
            );

        this.circle.modelTransform = this.headTransform;

        this.leftEye.updateModelTransform(this.headTransform);

        this.rightEye.updateModelTransform(this.headTransform);

        this.antenna.updateModelTransform(this.headTransform);
    }

    draw(renderer) {

        this.antenna.draw(renderer);

        renderer.draw(this.circle);

        renderer.draw(this.leftEye);

        renderer.draw(this.rightEye);

    }
}

class Neck extends SceneObject {

    constructor() {

        super(
            neckVertices(),
            new Float32Array([0.8,0.8,0.8])
        );
    }

    updateModelTransform(bodyTransform) {

        this.modelTransform = bodyTransform;
    }
    draw(renderer) {
        renderer.draw(this);
    }
}

class Torso {

    constructor() {

        this.shield =
            new SceneObject(
                torsoVertices(),
                new Float32Array([0.92,0.92,0.92])
            );

        this.speaker =
            new SceneObject(
                speakerDotVertices(),
                new Float32Array([0.1,0.1,0.1])
            );

        this.connector =
            new SceneObject(
                connectorVertices(),
                new Float32Array([0.92,0.92,0.92])
            );
    }

    updateModelTransform(bodyTransform) {

        this.shield.modelTransform = bodyTransform;

        this.speaker.modelTransform = bodyTransform;

        this.connector.modelTransform = bodyTransform;
    }

    draw(renderer) {

        renderer.draw(this.connector);

        renderer.draw(this.shield);

        renderer.draw(this.speaker);
    }
}

class WavingArm {

    constructor(shoulderX, shoulderY, blobColor, armColor, waveSpeed, mirror, phase) {

        this.shoulderX = shoulderX;

        this.shoulderY = shoulderY;

        this.waveSpeed = waveSpeed;

        this.mirror = mirror;

        this.theta = phase;

        this.blob =
            new SceneObject(
                shoulderBlobVertices(),
                blobColor
            );

        this.arm =
            new SceneObject(
                armVertices(),
                armColor
            );

        this.hand =
            new SceneObject(
                handVertices(),
                armColor
            );
    }

    updateWave() {

        this.theta += this.waveSpeed;
    }

    updateModelTransform(bodyTransform) {

        this.blob.modelTransform =

            m3.multiply(
                bodyTransform,
                m3.translation(this.shoulderX,this.shoulderY)
            );

        const shoulderAngle =
            this.mirror * (0.5 + 0.7 * Math.sin(this.theta));

        const shoulderTransform =

            m3.multiply(
                m3.translation(this.shoulderX,this.shoulderY),
                m3.rotation(shoulderAngle)
            );

        this.arm.modelTransform =

            m3.multiply(
                bodyTransform,
                shoulderTransform
            );

        const handLocal =
            m3.translation(0.0,-0.26);

        this.hand.modelTransform =

            m3.multiply(
                this.arm.modelTransform,
                handLocal
            );
    }

    draw(renderer) {

        renderer.draw(this.arm);

        renderer.draw(this.hand);

        renderer.draw(this.blob);
    }
}

class Wheel {

    constructor(angularSpeed) {

        this.xOffset = 0.0;

        this.yOffset = -0.58;

        this.theta = 0.0;

        this.angularSpeed = angularSpeed;

        this.tire =
            new SceneObject(
                wheelVertices(),
                new Float32Array([0.05,0.05,0.05])
            );

        this.hub =
            new SceneObject(
                hubVertices(),
                new Float32Array([0.85,0.85,0.85])
            );
    }

    updateAngularSpeed(angularSpeed) {

        this.angularSpeed = angularSpeed;
    }

    updateRotation() {

        this.theta += this.angularSpeed;
    }

    updateModelTransform(bodyTransform) {

        const localTransform =

            m3.multiply(
                m3.translation(this.xOffset,this.yOffset),
                m3.rotation(this.theta)
            );

        const worldTransform =

            m3.multiply(
                bodyTransform,
                localTransform
            );

        this.tire.modelTransform = worldTransform;

        this.hub.modelTransform = worldTransform;
    }

    draw(renderer) {

        renderer.draw(this.tire);

        renderer.draw(this.hub);
    }
}

class Robot {

    constructor(tx, ty, waveSpeed, wheelSpeed, moveSpeed) {

        this.tx = tx;

        this.ty = ty;

        this.speed = moveSpeed;

        this.head = new Head();

        this.neck = new Neck();

        this.torso = new Torso();

        this.leftArm =
            new WavingArm(
                -0.27,0.08,
                new Float32Array([0.1,0.1,0.1]),
                new Float32Array([1,1,1]),
                waveSpeed,
                -1.0,
                Math.PI
            );

        this.rightArm =
            new WavingArm(
                0.27,0.08,
                new Float32Array([0.1,0.1,0.1]),
                new Float32Array([1,1,1]),
                waveSpeed,
                1.0,
                0.0
            );

        this.wheel = new Wheel(wheelSpeed);
    }

    move() {

        this.tx += this.speed;

        if ( this.tx > 1.8 || this.tx < -1.8) {

            this.speed = -this.speed;

            this.wheel.updateAngularSpeed(-this.wheel.angularSpeed);
        }
    }

    update() {

        this.move();

        this.leftArm.updateWave();

        this.rightArm.updateWave();

        this.wheel.updateRotation();

        const bodyTransform =
            m3.translation(this.tx,this.ty);

        this.head.updateModelTransform(bodyTransform);

        this.neck.updateModelTransform(bodyTransform);

        this.torso.updateModelTransform(bodyTransform);

        this.leftArm.updateModelTransform(bodyTransform);

        this.rightArm.updateModelTransform(bodyTransform);

        this.wheel.updateModelTransform(bodyTransform);
    }

    draw(renderer) {
        this.neck.draw(renderer);
        
        this.torso.draw(renderer);
        
        this.wheel.draw(renderer);

        this.leftArm.draw(renderer);

        this.rightArm.draw(renderer);

        this.head.draw(renderer);
    }
}

class Scene {

    constructor(gl, program) {

        this.renderer = new Renderer(gl,program);

        this.viewTransform = m3.setClippingWindow(-2.0,-1.0,2.0,1.0);

        this.renderer.defineViewTransform(this.viewTransform);

        this.robot = new Robot(0.0,-0.05,0.05,0.08,0.006);
    }

    update() {

        this.robot.update();
    }

    draw() {

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);

        this.robot.draw(this.renderer);
    }

    execute() {

        this.update();

        this.draw();

        requestAnimationFrame(() => this.execute());
    }

    init() {

        requestAnimationFrame(() => this.execute());
    }
}

gl.clearColor(
    0.5,
    0.5,
    0.5,
    1.0
);

gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
);

const scene =
    new Scene(gl,program);

scene.init();