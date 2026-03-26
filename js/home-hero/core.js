export function createHeroCoreGeometry({ THREE, radius = 1.3, widthSegments = 96, heightSegments = 96 }) {
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const position = geometry.attributes.position;
  const vector = new THREE.Vector3();
  const leftLobeAxis = new THREE.Vector3(-0.38, 0.78, 0.16).normalize();
  const rightLobeAxis = new THREE.Vector3(0.3, 0.8, -0.12).normalize();
  const cleftAxis = new THREE.Vector3(0.02, 0.98, 0.08).normalize();
  const baseAxis = new THREE.Vector3(0.08, -0.98, 0.06).normalize();

  for (let index = 0; index < position.count; index += 1) {
    vector.fromBufferAttribute(position, index);
    const direction = vector.clone().normalize();
    const leftLobe = THREE.MathUtils.smoothstep(direction.dot(leftLobeAxis), 0.34, 0.94);
    const rightLobe = THREE.MathUtils.smoothstep(direction.dot(rightLobeAxis), 0.38, 0.95);
    const topCleft = THREE.MathUtils.smoothstep(direction.dot(cleftAxis), 0.54, 0.96);
    const bottomPoint = THREE.MathUtils.smoothstep(direction.dot(baseAxis), 0.24, 0.94);

    vector.x *= 0.88;
    vector.z *= 0.82;
    vector.y *= 1.04;
    vector.addScaledVector(direction, radius * 0.08 * leftLobe);
    vector.addScaledVector(direction, radius * 0.09 * rightLobe);
    vector.addScaledVector(baseAxis, radius * 0.1 * bottomPoint);
    vector.addScaledVector(direction, -radius * 0.11 * topCleft * (0.42 + Math.abs(direction.x) * 0.58));
    vector.x += radius * 0.022 * rightLobe - radius * 0.01 * leftLobe;
    vector.z += radius * 0.012 * rightLobe - radius * 0.008 * bottomPoint;

    position.setXYZ(index, vector.x, vector.y, vector.z);
  }

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return geometry;
}
