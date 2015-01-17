varying vec3 vPos;

float score(float x1, float y1, float z1, float x2, float y2, float z2);

float score(float x1, float y1, float z1, float x2, float y2, float z2) {
  float x_d = abs(x1 - x2);
  float y_d = abs(y1 - y2);
  float z_d = abs(z1 - z2);

  return float(1.0) / (x_d * x_d + y_d * y_d + z_d * z_d);
}


void main() {

  float s1 = score(vPos.x, vPos.y, vPos.z, float(33), float(0), float(0));
  float s2 = score(vPos.x, vPos.y, vPos.z, float(-33), float(0), float(0));

  float s = s1 + s2;

  // if (s < 0.0071) {
  if (s < 0.0015) {
    discard;
    // gl_FragColor = vec4(0.4, 0.4, 0.8, 0.001);
  } else {
    gl_FragColor = vec4(0.8, 0.4, 0.4, 0);
  }

  // Main job
  // gl_FragColor = vec4(0.4, 0.4, 0.8, 1.0);
}
