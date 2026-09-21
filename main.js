/**
 * Praktikum 03
 * WebGL2 Transformations
 *
 * Fitur:
 * - Translation
 * - Rotation
 * - Uniform scaling
 * - Non-uniform scaling
 * - Matrix 3x3
 * - State-based keyboard
 * - deltaTime
 * - Object A keyboard controlled
 * - Object B automatic animation
 * - Transform order comparison
 * - HUD
 * - Axis X/Y
 * - Reset
 * - Transform presets
 */


/* =========================================================
   CANVAS & WEBGL
========================================================= */

const canvas = document.getElementById("glCanvas");

const gl = canvas.getContext("webgl2");

if (!gl) {

    alert("Browser tidak mendukung WebGL2.");

    throw new Error("WebGL2 tidak tersedia.");

}


/* =========================================================
   SHADERS
========================================================= */

const vertexShaderSource = `#version 300 es

precision highp float;

layout(location = 0) in vec2 a_position;

uniform mat3 u_modelMatrix;

void main() {

    vec3 position = u_modelMatrix * vec3(a_position, 1.0);

    gl_Position = vec4(position.xy, 0.0, 1.0);

}
`;


const fragmentShaderSource = `#version 300 es

precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {

    outColor = u_color;

}
`;


/* =========================================================
   SHADER FUNCTIONS
========================================================= */

function createShader(gl, type, source) {

    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

        console.error(
            "Shader Error:",
            gl.getShaderInfoLog(shader)
        );

        gl.deleteShader(shader);

        throw new Error("Shader gagal dikompilasi.");

    }

    return shader;

}


function createProgram(gl, vertexSource, fragmentSource) {

    const vertexShader =
        createShader(
            gl,
            gl.VERTEX_SHADER,
            vertexSource
        );


    const fragmentShader =
        createShader(
            gl,
            gl.FRAGMENT_SHADER,
            fragmentSource
        );


    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);

    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);


    if (!gl.getProgramParameter(
        program,
        gl.LINK_STATUS
    )) {

        console.error(
            "Program Error:",
            gl.getProgramInfoLog(program)
        );

        throw new Error("Program gagal dilink.");

    }


    return program;

}


const program = createProgram(
    gl,
    vertexShaderSource,
    fragmentShaderSource
);


/* =========================================================
   LOCATIONS
========================================================= */

const positionLocation = 0;

const modelMatrixLocation =
    gl.getUniformLocation(
        program,
        "u_modelMatrix"
    );


const colorLocation =
    gl.getUniformLocation(
        program,
        "u_color"
    );


/* =========================================================
   GEOMETRY
========================================================= */

/*
 * Geometry lokal.
 *
 * Kedua object akan menggunakan
 * vertex buffer yang sama.
 *
 * Bentuk: kotak
 *
 * Local coordinate:
 *
 * (-0.15, -0.15) ----- (0.15, -0.15)
 *       |                    |
 *       |                    |
 * (-0.15,  0.15) ----- (0.15,  0.15)
 */

const vertices = new Float32Array([

    -0.15, -0.15,
     0.15, -0.15,
     0.15,  0.15,

    -0.15, -0.15,
     0.15,  0.15,
    -0.15,  0.15

]);


/* =========================================================
   VERTEX BUFFER
========================================================= */

const vao = gl.createVertexArray();

gl.bindVertexArray(vao);


const vertexBuffer = gl.createBuffer();

gl.bindBuffer(
    gl.ARRAY_BUFFER,
    vertexBuffer
);


gl.bufferData(
    gl.ARRAY_BUFFER,
    vertices,
    gl.STATIC_DRAW
);


gl.enableVertexAttribArray(
    positionLocation
);


gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);


gl.bindVertexArray(null);


/* =========================================================
   AXIS GEOMETRY
========================================================= */

const axisVertices = new Float32Array([

    // X axis
    -1, 0,
     1, 0,

    // Y axis
     0, -1,
     0, 1

]);


const axisVAO = gl.createVertexArray();

gl.bindVertexArray(axisVAO);


const axisBuffer = gl.createBuffer();

gl.bindBuffer(
    gl.ARRAY_BUFFER,
    axisBuffer
);


gl.bufferData(
    gl.ARRAY_BUFFER,
    axisVertices,
    gl.STATIC_DRAW
);


gl.enableVertexAttribArray(
    positionLocation
);


gl.vertexAttribPointer(
    positionLocation,
    2,
    gl.FLOAT,
    false,
    0,
    0
);


gl.bindVertexArray(null);


/* =========================================================
   OBJECT STATE
========================================================= */

const objectA = {

    x: -0.35,

    y: 0.0,

    rotation: 0,

    scaleX: 1,

    scaleY: 1

};


const objectB = {

    x: 0.35,

    y: 0.0,

    rotation: 0,

    scaleX: 1,

    scaleY: 1

};


/* =========================================================
   DEFAULT STATE
========================================================= */

const defaultObjectA = {

    x: -0.35,

    y: 0,

    rotation: 0,

    scaleX: 1,

    scaleY: 1

};


/* =========================================================
   TRANSFORM ORDER
========================================================= */

let transformOrder = "TRS";


/*
 * TRS:
 *
 * Translation
 * Rotation
 * Scaling
 *
 *
 * RTS:
 *
 * Rotation
 * Translation
 * Scaling
 */


function getTransformOrderText() {

    if (transformOrder === "TRS") {

        return "Translation → Rotation → Scaling";

    }

    return "Rotation → Translation → Scaling";

}


/* =========================================================
   KEYBOARD STATE
========================================================= */

const keys = {};


window.addEventListener(
    "keydown",
    function (event) {

        keys[event.key] = true;


        /*
         * Jangan scroll halaman
         * ketika arrow key digunakan.
         */

        if (
            event.key === "ArrowUp" ||
            event.key === "ArrowDown" ||
            event.key === "ArrowLeft" ||
            event.key === "ArrowRight" ||
            event.key === " "
        ) {

            event.preventDefault();

        }


        /*
         * R = Reset
         */

        if (
            event.key === "r" ||
            event.key === "R"
        ) {

            resetObjectA();

        }


        /*
         * T = Toggle transform order
         */

        if (
            event.key === "t" ||
            event.key === "T"
        ) {

            toggleTransformOrder();

        }


        /*
         * Preset 1
         */

        if (event.key === "1") {

            preset1();

        }


        /*
         * Preset 2
         */

        if (event.key === "2") {

            preset2();

        }


        /*
         * Preset 3
         */

        if (event.key === "3") {

            preset3();

        }

    }
);


window.addEventListener(
    "keyup",
    function (event) {

        keys[event.key] = false;

    }
);


/* =========================================================
   CONSTANTS
========================================================= */

const MOVE_SPEED = 0.8;

const ROTATION_SPEED =
    Math.PI * 1.2;

const SCALE_SPEED = 0.8;


/* =========================================================
   UPDATE OBJECT A
========================================================= */

function updateObjectA(deltaTime) {


    /* ---------------------------------
       TRANSLATION
    --------------------------------- */

    if (keys["ArrowLeft"]) {

        objectA.x -=
            MOVE_SPEED * deltaTime;

    }


    if (keys["ArrowRight"]) {

        objectA.x +=
            MOVE_SPEED * deltaTime;

    }


    if (keys["ArrowUp"]) {

        objectA.y +=
            MOVE_SPEED * deltaTime;

    }


    if (keys["ArrowDown"]) {

        objectA.y -=
            MOVE_SPEED * deltaTime;

    }


    /* ---------------------------------
       ROTATION
    --------------------------------- */

    if (
        keys["q"] ||
        keys["Q"]
    ) {

        objectA.rotation -=
            ROTATION_SPEED * deltaTime;

    }


    if (
        keys["e"] ||
        keys["E"]
    ) {

        objectA.rotation +=
            ROTATION_SPEED * deltaTime;

    }


    /* ---------------------------------
       UNIFORM SCALE
    --------------------------------- */

    if (
        keys["+"] ||
        keys["="]
    ) {

        objectA.scaleX +=
            SCALE_SPEED * deltaTime;

        objectA.scaleY +=
            SCALE_SPEED * deltaTime;

    }


    if (
        keys["-"] ||
        keys["_"]
    ) {

        objectA.scaleX -=
            SCALE_SPEED * deltaTime;

        objectA.scaleY -=
            SCALE_SPEED * deltaTime;

    }


    /* ---------------------------------
       SCALE X
    --------------------------------- */

    if (
        keys["z"] ||
        keys["Z"]
    ) {

        objectA.scaleX +=
            SCALE_SPEED * deltaTime;

    }


    if (
        keys["x"] ||
        keys["X"]
    ) {

        objectA.scaleX -=
            SCALE_SPEED * deltaTime;

    }


    /* ---------------------------------
       SCALE Y
    --------------------------------- */

    if (
        keys["c"] ||
        keys["C"]
    ) {

        objectA.scaleY +=
            SCALE_SPEED * deltaTime;

    }


    if (
        keys["v"] ||
        keys["V"]
    ) {

        objectA.scaleY -=
            SCALE_SPEED * deltaTime;

    }


    /*
     * Batasi scaling agar object
     * tidak menjadi negatif.
     */

    objectA.scaleX =
        Math.max(
            0.1,
            objectA.scaleX
        );


    objectA.scaleY =
        Math.max(
            0.1,
            objectA.scaleY
        );

}


/* =========================================================
   UPDATE OBJECT B
========================================================= */

function updateObjectB(deltaTime) {

    /*
     * Object B berputar otomatis.
     */

    objectB.rotation +=
        ROTATION_SPEED * 0.6 * deltaTime;


    /*
     * Sedikit scaling otomatis
     * menggunakan sin.
     */

    const time =
        performance.now() * 0.001;


    const scale =
        1 +
        Math.sin(time * 2) * 0.2;


    objectB.scaleX = scale;

    objectB.scaleY = scale;

}


/* =========================================================
   CREATE MODEL MATRIX
========================================================= */

function createModelMatrix(object) {

    const translation =
        Matrix3.translation(
            object.x,
            object.y
        );


    const rotation =
        Matrix3.rotation(
            object.rotation
        );


    const scaling =
        Matrix3.scaling(
            object.scaleX,
            object.scaleY
        );


    let modelMatrix;


    /*
     * Transform order 1:
     *
     * T → R → S
     */

    if (transformOrder === "TRS") {

        modelMatrix =
            Matrix3.compose(
                translation,
                rotation,
                scaling
            );

    }


    /*
     * Transform order 2:
     *
     * R → T → S
     */

    else {

        modelMatrix =
            Matrix3.compose(
                rotation,
                translation,
                scaling
            );

    }


    return modelMatrix;

}


/* =========================================================
   RESET
========================================================= */

function resetObjectA() {

    objectA.x =
        defaultObjectA.x;

    objectA.y =
        defaultObjectA.y;

    objectA.rotation =
        defaultObjectA.rotation;

    objectA.scaleX =
        defaultObjectA.scaleX;

    objectA.scaleY =
        defaultObjectA.scaleY;

}


/* =========================================================
   TOGGLE TRANSFORM ORDER
========================================================= */

function toggleTransformOrder() {

    if (transformOrder === "TRS") {

        transformOrder = "RTS";

    }

    else {

        transformOrder = "TRS";

    }

}


/* =========================================================
   PRESET 1
========================================================= */

function preset1() {

    objectA.x = -0.35;

    objectA.y = 0;

    objectA.rotation = 0;

    objectA.scaleX = 1;

    objectA.scaleY = 1;

}


/* =========================================================
   PRESET 2
========================================================= */

function preset2() {

    objectA.x = 0;

    objectA.y = 0.25;

    objectA.rotation =
        Math.PI / 4;

    objectA.scaleX = 1.4;

    objectA.scaleY = 0.8;

}


/* =========================================================
   PRESET 3
========================================================= */

function preset3() {

    objectA.x = -0.1;

    objectA.y = -0.25;

    objectA.rotation =
        Math.PI / 2;

    objectA.scaleX = 0.7;

    objectA.scaleY = 1.5;

}


/* =========================================================
   DRAW AXIS
========================================================= */

function drawAxis() {

    gl.bindVertexArray(axisVAO);


    /*
     * Identity matrix karena
     * axis berada langsung pada world coordinate.
     */

    const identity =
        Matrix3.identity();


    gl.uniformMatrix3fv(
        modelMatrixLocation,
        false,
        identity
    );


    /*
     * X axis
     */

    gl.uniform4f(
        colorLocation,
        0.9,
        0.2,
        0.2,
        1.0
    );


    gl.drawArrays(
        gl.LINES,
        0,
        2
    );


    /*
     * Y axis
     */

    gl.uniform4f(
        colorLocation,
        0.2,
        0.7,
        0.3,
        1.0
    );


    gl.drawArrays(
        gl.LINES,
        2,
        2
    );


    gl.bindVertexArray(null);

}


/* =========================================================
   DRAW OBJECT
========================================================= */

function drawObject(object, color) {

    const modelMatrix =
        createModelMatrix(object);


    gl.uniformMatrix3fv(
        modelMatrixLocation,
        false,
        modelMatrix
    );


    gl.uniform4fv(
        colorLocation,
        color
    );


    gl.bindVertexArray(vao);


    gl.drawArrays(
        gl.TRIANGLES,
        0,
        6
    );


    gl.bindVertexArray(null);

}


/* =========================================================
   HUD UPDATE
========================================================= */

function updateHUD() {


    /*
     * Object A
     */

    document.getElementById(
        "positionA"
    ).textContent =

        `(${objectA.x.toFixed(2)}, ${objectA.y.toFixed(2)})`;


    document.getElementById(
        "rotationA"
    ).textContent =

        `${toDegrees(objectA.rotation).toFixed(2)}°`;


    document.getElementById(
        "scaleXA"
    ).textContent =

        objectA.scaleX.toFixed(2);


    document.getElementById(
        "scaleYA"
    ).textContent =

        objectA.scaleY.toFixed(2);


    /*
     * Object B
     */

    document.getElementById(
        "positionB"
    ).textContent =

        `(${objectB.x.toFixed(2)}, ${objectB.y.toFixed(2)})`;


    document.getElementById(
        "rotationB"
    ).textContent =

        `${toDegrees(objectB.rotation).toFixed(2)}°`;


    document.getElementById(
        "scaleB"
    ).textContent =

        `(${objectB.scaleX.toFixed(2)}, ${objectB.scaleY.toFixed(2)})`;


    /*
     * Transform Order
     */

    document.getElementById(
        "transformOrder"
    ).textContent =
        getTransformOrderText();

}


/* =========================================================
   ANGLE CONVERSION
========================================================= */

function toDegrees(radians) {

    return radians * 180 / Math.PI;

}


/* =========================================================
   RENDER
========================================================= */

function render() {

    /*
     * Bersihkan canvas
     */

    gl.clearColor(
        0.97,
        0.97,
        0.97,
        1.0
    );


    gl.clear(
        gl.COLOR_BUFFER_BIT
    );


    /*
     * Gunakan program
     */

    gl.useProgram(program);


    /*
     * Gambar axis
     */

    drawAxis();


    /*
     * Object A
     *
     * Biru
     */

    drawObject(
        objectA,
        [
            0.20,
            0.55,
            0.95,
            1.0
        ]
    );


    /*
     * Object B
     *
     * Merah
     */

    drawObject(
        objectB,
        [
            0.95,
            0.30,
            0.30,
            1.0
        ]
    );

}


/* =========================================================
   ANIMATION LOOP
========================================================= */

let previousTime = 0;


function animationLoop(currentTime) {


    /*
     * currentTime diberikan oleh
     * requestAnimationFrame dalam ms.
     */

    currentTime *= 0.001;


    /*
     * deltaTime dalam seconds.
     */

    let deltaTime =
        currentTime - previousTime;


    previousTime =
        currentTime;


    /*
     * Hindari deltaTime sangat besar
     * ketika tab browser kembali aktif.
     */

    deltaTime =
        Math.min(
            deltaTime,
            0.1
        );


    /*
     * Update
     */

    updateObjectA(
        deltaTime
    );


    updateObjectB(
        deltaTime
    );


    /*
     * Render
     */

    render();


    /*
     * HUD

     * Update setiap frame.
     */

    updateHUD();


    /*
     * Frame berikutnya
     */

    requestAnimationFrame(
        animationLoop
    );

}


/* =========================================================
   WEBGL SETUP
========================================================= */

gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
);


gl.disable(
    gl.DEPTH_TEST
);


gl.lineWidth(2);


/* =========================================================
   START
========================================================= */

updateHUD();


requestAnimationFrame(
    animationLoop
);