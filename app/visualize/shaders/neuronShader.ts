// shaders/neuronShader.ts

// High-impact neuron shader with iridescence, subsurface feel, and pulsing holographic veins.
// shaders/neuronShader.ts

export const neuronVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  uniform float time;
  uniform float pulseIntensity;

  // 3D simplex noise (Ashima arts, public domain)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0);
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    i = mod289(i);
    vec4 p = permute(
      permute(
        permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0)
      )
      + i.x + vec4(0.0, i1.x, i2.x, 1.0)
    );
    float n_ = 0.142857142857; // 1/7
    vec3  ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(
      vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))
    );
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(
      0.6 - vec4(
        dot(x0, x0),
        dot(x0 - i1 + C.xxx, x0 - i1 + C.xxx),
        dot(x0 - i2 + C.yyy, x0 - i2 + C.yyy),
        dot(x0 - 1.0 + 3.0 * C.xxx, x0 - 1.0 + 3.0 * C.xxx)
      ),
      0.0
    );
    m = m * m;
    return 42.0 * dot(
      m * m,
      vec4(
        dot(p0, x0),
        dot(p1, x0 - i1 + C.xxx),
        dot(p2, x0 - i2 + C.yyy),
        dot(p3, x0 - 1.0 + 3.0 * C.xxx)
      )
    );
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);

    // Displace the surface with noise for a "breathing" organic motion
    float noiseScale = 2.0;
    float noiseSpeed = 0.5;
    float n = snoise(position * noiseScale + vec3(0.0, time * noiseSpeed, 0.0));
    vNoise = n;

    float baseDisplacement = 0.06;
    float pulseDisplacement = 0.16;
    float displacement = baseDisplacement + pulseDisplacement * pulseIntensity;
    vec3 newPos = position + vNormal * n * displacement;

    vec4 mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    vPosition = mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;


export const neuronFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  uniform vec3 color;
  uniform float time;
  uniform float opacity;
  uniform float pulseIntensity;
  uniform float isHighlighted;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(-vPosition);

    // Fresnel rim for holographic edge glow
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    float rim = smoothstep(0.2, 1.0, fresnel);

    // Backlighting = fake subsurface scattering
    float backLight = clamp(-dot(viewDir, normal), 0.0, 1.0);

    // Map noise from [-1, 1] into [0, 1]
    float noise01 = vNoise * 0.5 + 0.5;

    // Vein-like bands scrolling over the surface
    float vein = smoothstep(0.35, 0.9, noise01);
    float movingBands = 0.5 + 0.5 * sin(time * 2.5 + vNoise * 10.0);
    float veinMask = vein * movingBands;

    // Iridescent thin-film effect based on angle + noise
    float angle = max(dot(viewDir, normal), 0.0);
    float iridPhase = angle * 4.0 + time * 0.7 + vNoise * 3.0;

    vec3 iridescent = vec3(
      0.6 + 0.4 * sin(iridPhase),
      0.6 + 0.4 * sin(iridPhase + 2.094), // +120 degrees
      0.6 + 0.4 * sin(iridPhase + 4.188)  // +240 degrees
    );

    // Base color from uniform
    vec3 baseColor = color;

    // Warm subsurface tint
    vec3 subsurface = mix(baseColor * 0.4, vec3(1.0, 0.8, 0.6), 0.6);

    // Film color between base and iridescent
    vec3 filmColor = mix(baseColor, iridescent, 0.7);

    // Time-based pulsing
    float pulse = 0.5 + 0.5 * sin(time * 4.0 + vNoise * 6.0);
    float highlightBoost = mix(1.0, 1.6, clamp(isHighlighted, 0.0, 1.0));

    // Composite glow intensity
    float glow = rim * 0.9 + backLight * 0.6 + pulse * 0.5;
    glow *= pulseIntensity * highlightBoost;

    // Build final color
    vec3 col = baseColor;

    // Blend in subsurface from backlighting
    col = mix(col, subsurface, backLight * 0.7);

    // Blend in iridescent film at the rim
    col = mix(col, filmColor, rim);

    // Add emissive-like glow
    col += glow * filmColor * 1.4;

    // Hot veins streaking across the surface
    col += veinMask * iridescent * 1.3;

    // Slight extra pop when highlighted
    col *= mix(1.0, 1.15, clamp(isHighlighted, 0.0, 1.0));

    // Let bloom take over for values > 1
    float finalOpacity = opacity * (0.5 + 0.5 * (rim + backLight) * highlightBoost);

    if (finalOpacity < 0.01) {
      discard;
    }

    gl_FragColor = vec4(col, finalOpacity);
  }
`;