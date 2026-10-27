/* Effects adapted for this website from React Bits (https://reactbits.dev), Copyright (c) David Haz,
 * MIT + Commons Clause; see ReactBits-LICENSE.md.
 *  - Light Rays   (Backgrounds/LightRays): original ray shader kept; ogl replaced with raw WebGL,
 *                  ember palette, half-resolution buffer, visibility-gated loop.
 *  - Click Spark  (Animations/ClickSpark): one shared fixed canvas, loop only while sparks live.
 * Both return a small controller and never run a frame while hidden, paused or reduced. */
(() => {
'use strict';

/* ——— Light Rays ——— */
const RAY_VERT = `attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}`;
const RAY_FRAG = `precision highp float;
uniform float iTime;uniform vec2 iResolution;uniform vec2 rayPos;uniform vec2 rayDir;uniform vec3 raysColor;
uniform float raysSpeed;uniform float lightSpread;uniform float rayLength;uniform float fadeDistance;uniform float saturation;
uniform vec2 mousePos;uniform float mouseInfluence;uniform float noiseAmount;uniform float distortion;
float noise(vec2 st){return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);}
float rayStrength(vec2 raySource,vec2 rayRefDirection,vec2 coord,float seedA,float seedB,float speed){
  vec2 sourceToCoord=coord-raySource;vec2 dirNorm=normalize(sourceToCoord);float cosAngle=dot(dirNorm,rayRefDirection);
  float distortedAngle=cosAngle+distortion*sin(iTime*2.0+length(sourceToCoord)*0.01)*0.2;
  float spreadFactor=pow(max(distortedAngle,0.0),1.0/max(lightSpread,0.001));
  float distance=length(sourceToCoord);float maxDistance=iResolution.x*rayLength;
  float lengthFalloff=clamp((maxDistance-distance)/maxDistance,0.0,1.0);
  float fadeFalloff=clamp((iResolution.x*fadeDistance-distance)/(iResolution.x*fadeDistance),0.5,1.0);
  float baseStrength=clamp((0.45+0.15*sin(distortedAngle*seedA+iTime*speed))+(0.3+0.2*cos(-distortedAngle*seedB+iTime*speed)),0.0,1.0);
  return baseStrength*lengthFalloff*fadeFalloff*spreadFactor;}
void main(){
  vec2 coord=vec2(gl_FragCoord.x,iResolution.y-gl_FragCoord.y);
  vec2 finalRayDir=rayDir;
  if(mouseInfluence>0.0){vec2 m=mousePos*iResolution.xy;finalRayDir=normalize(mix(rayDir,normalize(m-rayPos),mouseInfluence));}
  vec4 c=vec4(1.0)*rayStrength(rayPos,finalRayDir,coord,36.2214,21.11349,1.5*raysSpeed)*0.5
        +vec4(1.0)*rayStrength(rayPos,finalRayDir,coord,22.3991,18.0234,1.1*raysSpeed)*0.4;
  if(noiseAmount>0.0){float n=noise(coord*0.01+iTime*0.1);c.rgb*=(1.0-noiseAmount+noiseAmount*n);}
  float brightness=1.0-(coord.y/iResolution.y);
  c.x*=0.1+brightness*0.8;c.y*=0.3+brightness*0.6;c.z*=0.5+brightness*0.5;
  float gray=dot(c.rgb,vec3(0.299,0.587,0.114));c.rgb=mix(vec3(gray),c.rgb,saturation);
  c.rgb*=raysColor;gl_FragColor=vec4(c.rgb,max(c.r,max(c.g,c.b)));}`;

const hexToRgb = hex => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, .6, .3];
};

window.nrtLightRays = (canvas, opts = {}) => {
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const compile = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = compile(gl.VERTEX_SHADER, RAY_VERT), fs = compile(gl.FRAGMENT_SHADER, RAY_FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = name => gl.getUniformLocation(prog, name);
  const U = Object.fromEntries(['iTime', 'iResolution', 'rayPos', 'rayDir', 'raysColor', 'raysSpeed', 'lightSpread', 'rayLength', 'fadeDistance', 'saturation', 'mousePos', 'mouseInfluence', 'noiseAmount', 'distortion'].map(n => [n, u(n)]));
  const o = { color: '#ffb46e', speed: .8, spread: .9, length: 1.6, fade: 1.1, saturation: 1, influence: .12, noise: .08, distortion: .06, scale: .5, ...opts };
  gl.uniform3fv(U.raysColor, hexToRgb(o.color));
  gl.uniform1f(U.raysSpeed, o.speed); gl.uniform1f(U.lightSpread, o.spread); gl.uniform1f(U.rayLength, o.length);
  gl.uniform1f(U.fadeDistance, o.fade); gl.uniform1f(U.saturation, o.saturation); gl.uniform1f(U.mouseInfluence, o.influence);
  gl.uniform1f(U.noiseAmount, o.noise); gl.uniform1f(U.distortion, o.distortion);
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  let raf = 0, running = false, w = 0, h = 0, t0 = performance.now();
  const mouse = { x: .5, y: .5 }, smooth = { x: .5, y: .5 };
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width * o.scale)); h = Math.max(1, Math.round(r.height * o.scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(U.iResolution, w, h);
    gl.uniform2f(U.rayPos, .5 * w, -.2 * h);
    gl.uniform2f(U.rayDir, 0, 1);
  };
  const frame = now => {
    raf = 0;
    if (!running) return;
    smooth.x += (mouse.x - smooth.x) * .06; smooth.y += (mouse.y - smooth.y) * .06;
    gl.uniform1f(U.iTime, (now - t0) / 1000);
    gl.uniform2f(U.mousePos, smooth.x, smooth.y);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  };
  resize();
  const ro = 'ResizeObserver' in window ? new ResizeObserver(resize) : null;
  ro?.observe(canvas);
  return {
    start() { if (running) return; running = true; raf = requestAnimationFrame(frame); },
    stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; },
    pointer(x, y) { mouse.x = x; mouse.y = y; },
    destroy() { this.stop(); ro?.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); }
  };
};

/* ——— Click Spark ——— */
window.nrtClickSpark = () => {
  const canvas = document.createElement('canvas');
  canvas.className = 'spark-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  let sparks = [], raf = 0, dpr = 1;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr; };
  size(); addEventListener('resize', size);
  const DURATION = 520, RADIUS = 34, LENGTH = 12;
  const draw = now => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    sparks = sparks.filter(s => {
      const t = (now - s.t) / DURATION;
      if (t >= 1) return false;
      const e = t * (2 - t), dist = e * RADIUS * s.k, len = LENGTH * (1 - e);
      const cx = Math.cos(s.a), cy = Math.sin(s.a);
      ctx.strokeStyle = `rgba(255,${180 + Math.round(40 * (1 - t))},${110 + Math.round(60 * (1 - t))},${1 - t})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(s.x + dist * cx, s.y + dist * cy); ctx.lineTo(s.x + (dist + len) * cx, s.y + (dist + len) * cy); ctx.stroke();
      return true;
    });
    raf = sparks.length ? requestAnimationFrame(draw) : 0;
    if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
  };
  return {
    burst(x, y) {
      const now = performance.now();
      for (let i = 0; i < 10; i++) sparks.push({ x, y, t: now, a: (2 * Math.PI * i) / 10 + Math.random() * .3, k: .8 + Math.random() * .5 });
      if (!raf) raf = requestAnimationFrame(draw);
    }
  };
};
})();
