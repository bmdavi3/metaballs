varying vec3 vPos;

void main() {

  // Main job
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);

  vPos = position;
}
