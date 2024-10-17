function multiplyMatrices(matrixA, matrixB) {
    var result = [];

    for (var i = 0; i < 4; i++) {
        result[i] = [];
        for (var j = 0; j < 4; j++) {
            var sum = 0;
            for (var k = 0; k < 4; k++) {
                sum += matrixA[i * 4 + k] * matrixB[k * 4 + j];
            }
            result[i][j] = sum;
        }
    }

    // Flatten the result array
    return result.reduce((a, b) => a.concat(b), []);
}
function createIdentityMatrix() {
    return new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ]);
}
function createScaleMatrix(scale_x, scale_y, scale_z) {
    return new Float32Array([
        scale_x, 0, 0, 0,
        0, scale_y, 0, 0,
        0, 0, scale_z, 0,
        0, 0, 0, 1
    ]);
}

function createTranslationMatrix(x_amount, y_amount, z_amount) {
    return new Float32Array([
        1, 0, 0, x_amount,
        0, 1, 0, y_amount,
        0, 0, 1, z_amount,
        0, 0, 0, 1
    ]);
}

function createRotationMatrix_Z(radian) {
    return new Float32Array([
        Math.cos(radian), -Math.sin(radian), 0, 0,
        Math.sin(radian), Math.cos(radian), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_X(radian) {
    return new Float32Array([
        1, 0, 0, 0,
        0, Math.cos(radian), -Math.sin(radian), 0,
        0, Math.sin(radian), Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function createRotationMatrix_Y(radian) {
    return new Float32Array([
        Math.cos(radian), 0, Math.sin(radian), 0,
        0, 1, 0, 0,
        -Math.sin(radian), 0, Math.cos(radian), 0,
        0, 0, 0, 1
    ])
}

function getTransposeMatrix(matrix) {
    return new Float32Array([
        matrix[0], matrix[4], matrix[8], matrix[12],
        matrix[1], matrix[5], matrix[9], matrix[13],
        matrix[2], matrix[6], matrix[10], matrix[14],
        matrix[3], matrix[7], matrix[11], matrix[15]
    ]);
}

const vertexShaderSource = `
attribute vec3 position;
attribute vec3 normal; // Normal vector for lighting

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 normalMatrix;

uniform vec3 lightDirection;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vNormal = vec3(normalMatrix * vec4(normal, 0.0));
    vLightDirection = lightDirection;

    gl_Position = vec4(position, 1.0) * projectionMatrix * modelViewMatrix; 
}

`

const fragmentShaderSource = `
precision mediump float;

uniform vec3 ambientColor;
uniform vec3 diffuseColor;
uniform vec3 specularColor;
uniform float shininess;

varying vec3 vNormal;
varying vec3 vLightDirection;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vLightDirection);
    
    // Ambient component
    vec3 ambient = ambientColor;

    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular component (view-dependent)
    vec3 viewDir = vec3(0.0, 0.0, 1.0); // Assuming the view direction is along the z-axis
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    gl_FragColor = vec4(ambient + diffuse + specular, 1.0);
}

`

/**
 * @WARNING DO NOT CHANGE ANYTHING ABOVE THIS LINE
 */



/**
 * 
 * @TASK1 Calculate the model view matrix by using the chatGPT
 */

function getChatGPTModelViewMatrix() {
    const transformationMatrix = new Float32Array([
        0.17677669, -0.3061862,  0.4330127,  0.3,
    0.3838835,  0.3535534,  -0.25,      -0.25,
    -0.3535534, 0.6123724,  0.5,        0,
    0,          0,          0,          1
        

    ]);
    return getTransposeMatrix(transformationMatrix);
}


/**
 * 
 * @TASK2 Calculate the model view matrix by using the given 
 * transformation methods and required transformation parameters
 * stated in transformation-prompt.txt
 */
function getModelViewMatrix() {
    const radX = Math.PI / 180 * 30; // 30 degrees to radians
    const radY = Math.PI / 180 * 45; // 45 degrees to radians
    const radZ = Math.PI / 180 * 60; // 60 degrees to radians

    // Create identity matrix
    let modelViewMatrix = createIdentityMatrix();

    // Apply translation (0.3 units on x-axis, -0.25 units on y-axis) first
    const translationMatrix = createTranslationMatrix(0.3, -0.25, 0);
    modelViewMatrix = multiplyMatrices(modelViewMatrix, translationMatrix);

    // Apply rotation around the x-axis
    const rotationXMatrix = createRotationMatrix_X(radX);
    modelViewMatrix = multiplyMatrices(modelViewMatrix, rotationXMatrix);

    // Apply rotation around the y-axis
    const rotationYMatrix = createRotationMatrix_Y(radY);
    modelViewMatrix = multiplyMatrices(modelViewMatrix, rotationYMatrix);

    // Apply rotation around the z-axis
    const rotationZMatrix = createRotationMatrix_Z(radZ);
    modelViewMatrix = multiplyMatrices(modelViewMatrix, rotationZMatrix);

    // Apply non-uniform scaling (0.5 for x and y axes, 1 for z-axis) last
    const scaleMatrix = createScaleMatrix(0.5, 0.5, 1);
    modelViewMatrix = multiplyMatrices(modelViewMatrix, scaleMatrix);

    // Return the final model view matrix
    return modelViewMatrix;
}

/**
 * 
 * @TASK3 Ask CHAT-GPT to animate the transformation calculated in 
 * task2 infinitely with a period of 10 seconds. 
 * First 5 seconds, the cube should transform from its initial 
 * position to the target position.
 * The next 5 seconds, the cube should return to its initial position.
 */
function getPeriodicMovement(startTime) {
    const currentTime = (Date.now() - startTime) / 1000; // Convert milliseconds to seconds
    const duration = 10; // Total duration of the animation in seconds
    const halfDuration = duration / 2; // Duration for each half of the animation (5 seconds)

    // Calculate progress in the range [0, 1] over the 10-second cycle
    let progress = (currentTime % duration) / duration;

    // Determine whether we are in the first or second half of the animation (moving forward or backward)
    if (progress < 0.5) {
        // First half: Moving to the target position
        progress = progress * 2; // Scale progress to [0, 1] for the forward transformation
    } else {
        // Second half: Returning to the initial position
        progress = (1 - progress) * 2; // Reverse the progress to return to the initial position
    }

    // Interpolate between the initial matrix (Task 2) and the target matrix (Task 1)
    const initialMatrix = getModelViewMatrix(); // Matrix calculated in Task 2
    const targetMatrix = getChatGPTModelViewMatrix(); // Matrix provided in Task 1

    // Perform linear interpolation (LERP) between initialMatrix and targetMatrix
    const animatedMatrix = new Float32Array(16);
    for (let i = 0; i < 16; i++) {
        animatedMatrix[i] = initialMatrix[i] + (targetMatrix[i] - initialMatrix[i]) * progress;
    }

    return animatedMatrix;
}
