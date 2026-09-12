#version 300 es

in vec2 aPosition;
uniform mat3 uViewTransform;
uniform mat3 uModelTransform;

void main() {
    vec3 position = uViewTransform * uModelTransform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}