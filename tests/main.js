const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) throw new Error("WebGL 2 is not avaliable.");

async function loadShaderFile(type) {
    const response = await fetch(type == gl.FRAGMENT_SHADER ? 'shader.frag' : 'shader.vert');
    const source = await response.text();

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

class Color {
    constructor(red, green, blue) {
        this.red = red / 255;
        this.green = green / 255;
        this.blue = blue / 255;
    }
}

class SceneObject {
    constructor() {
        this.vertices = [];
        this.color = [];
        this.modelTransform = m3.identity();
    }
    updateModelTransform(modelTransform) {
        this.modelTransform = modelTransform;
    }
    fromFlatRectangle(x, y, width, height, color) {
        this.vertices.push(
            x, y,
            x+width, y+height,
            x, y+height,

            x, y,
            x+width, y,
            x+width, y+height
        );

        this.color.push(color.red, color.blue, color.green);
    }
}

class RobotArm extends SceneObject {
    constructor(x, y, width, height, color, angularSpeed) {
        super();
        this.fromFlatRectangle(x, y, width, height, color);
        this.angularSpeed = angularSpeed;
    }
    update() {
        this.theta += this.angularSpeed;
    }
    updateModelTransform(carModelTransform) {
        const localTransform = m3.multiply(
            m3.translation(this.xPosition, 0.0), m3.rotation(this.theta)
        );

        this.modelTransform = m3.multiply(carModelTransform, localTransform);
    }
    draw(renderer) {
        renderer.draw(this);
    }
}

class Renderer {
    constructor(program, viewTransform=m3.identity()) {
        this.program = program;
        this.positionLocation = gl.getAttribLocation(program, "aPosition");
        this.colorLocation = gl.getUniformLocation(program, "uColor");
        this.viewTransformLocation = gl.getUniformLocation(program, "uViewTransform");
        this.modelTransformLocation = gl.getUniformLocation(program, "uModelTransform");
        this.viewTransform = viewTransform;
        this.verticesBuffer = gl.createBuffer();
    }
    draw(object) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(object.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.positionLocation);
        gl.vertexAttribPointer(
            this.positionLocation,
            2,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.uniform3fv(this.colorLocation, new Float32Array(object.color));
        gl.uniformMatrix3fv(this.modelTransformLocation, false, object.modelTransform);
        gl.uniformMatrix3fv(this.viewTransformLocation, false, this.viewTransform);
        gl.drawArrays(
            gl.TRIANGLES,
            0,
            object.vertices.length / 2
        );
    }
}

class Scene {
    constructor(elements=[]) {
        this.program = gl.createProgram();
        this.elements = elements;
    }
    update() {
        for(const element in this.elements)
            element.update();
    }
    draw() {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(this.program);

        for(const element in this.elements)
            element.draw(this.renderer);
    }
    execute() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.execute());
    }
    async init() {
        const vertexShader = await loadShaderFile(gl.VERTEX_SHADER);
        const fragmentShader = await loadShaderFile(gl.FRAGMENT_SHADER);

        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS))
            throw new Error(gl.getProgramInfoLog(this.program));

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.viewport(0, 0, canvas.width, canvas.height);

        const viewTransform = m3.setClippingWindow(-2.0, -1.0, 2.0, 1.0);
        this.renderer = new Renderer(this.program, viewTransform);

        requestAnimationFrame(() => this.execute());
    }
}

const scene = new Scene([
    new RobotArm(0.0, 0.0, 0.5, 0.1, new Color(255, 0, 0), 0.01)
]);
scene.init();