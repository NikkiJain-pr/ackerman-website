/* The Signal Field: a GPU halftone that forms the Ackerman A, radiates rings, and reacts to the reader.
   No libraries. If WebGL2 is unavailable the page simply renders without it. */
(function () {
  "use strict";

  var VERT = "#version 300 es\nin vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

  var FRAG = [
    "#version 300 es",
    "precision highp float;",
    "uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uMouseOn;",
    "uniform vec4 uScene;uniform float uBuild;uniform float uDim;uniform vec2 uCenter;uniform float uScale;",
    "uniform float uCell;uniform float uMaskLeft;",
    "out vec4 o;",
    // The Ackerman mark, in the logo's own proportions, centred and normalised.
    "const vec2 OUTER[7]=vec2[7](vec2(-1.,-.88),vec2(-.18,.88),vec2(.18,.88),vec2(1.,-.88),vec2(.62,-.88),vec2(0.,.44),vec2(-.62,-.88));",
    "const vec2 PEAK[3]=vec2[3](vec2(0.,-.06),vec2(.38,-.88),vec2(-.38,-.88));",
    "float poly7(vec2 p){float d=dot(p-OUTER[0],p-OUTER[0]);float s=1.;for(int i=0,j=6;i<7;j=i,i++){vec2 e=OUTER[j]-OUTER[i];vec2 w=p-OUTER[i];vec2 b=w-e*clamp(dot(w,e)/dot(e,e),0.,1.);d=min(d,dot(b,b));bvec3 c=bvec3(p.y>=OUTER[i].y,p.y<OUTER[j].y,e.x*w.y>e.y*w.x);if(all(c)||all(not(c)))s*=-1.;}return s*sqrt(d);}",
    "float poly3(vec2 p){float d=dot(p-PEAK[0],p-PEAK[0]);float s=1.;for(int i=0,j=2;i<3;j=i,i++){vec2 e=PEAK[j]-PEAK[i];vec2 w=p-PEAK[i];vec2 b=w-e*clamp(dot(w,e)/dot(e,e),0.,1.);d=min(d,dot(b,b));bvec3 c=bvec3(p.y>=PEAK[i].y,p.y<PEAK[j].y,e.x*w.y>e.y*w.x);if(all(c)||all(not(c)))s*=-1.;}return s*sqrt(d);}",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}",
    "void main(){",
    // Runs once per dot, into a tiny texture; the dots themselves are drawn in the second pass.
    "  vec2 cc=gl_FragCoord.xy*uCell;",
    "  float mn=min(uRes.x,uRes.y);",
    "  vec2 p=(cc-uRes*.5)/mn*2.;",
    "  vec2 toM=p-uMouse;float dm=length(toM);",
    "  float push=uMouseOn*exp(-dm*dm*7.);",
    "  vec2 ps=p+(dm>.0001?toM/dm:vec2(0.))*(-push*.16);",
    "  vec2 q=(ps-uCenter)/uScale;",
    "  float sdA=poly7(q);float sdP=poly3(q);",
    "  float inA=1.-smoothstep(-.01,.03,sdA);",
    "  float inP=1.-smoothstep(-.01,.03,sdP);",
    "  float mark=max(inA,inP);",
    // Rings travel outward from the source at the foot of the peak.
    "  vec2 src=q-vec2(0.,-.62);float r=length(src);",
    "  float wave=.5+.5*sin(r*11.-uTime*1.25);",
    "  float crest=pow(wave,5.);",
    "  float flow=vnoise(ps*2.4+vec2(uTime*.05,-uTime*.03));",
    // 0 Hero: the mark, broadcasting.
    "  float s0=max(mark*(.82+.18*flow),crest*exp(-r*.62)*.5+flow*flow*.05);",
    // 1 Authority: the mark is built from the ground up.
    "  float line=mix(-1.,1.,uBuild);",
    "  float built=1.-smoothstep(line-.02,line+.02,q.y);",
    "  float scan=(1.-smoothstep(0.,.05,abs(q.y-line)))*step(sdA,.2);",
    "  float s1=max(mark*mix(.1,1.,built),scan*.7)+flow*flow*.035;",
    // 2 Visibility: the signal reaches the edges of the frame.
    "  float s2=max(mark*.6,pow(.5+.5*sin(r*7.-uTime*1.9),3.)*exp(-r*.17)*.78);",
    // 3 Protect: a held perimeter; calm inside, noise kept outside.
    "  float l=length(q);",
    "  float wall=exp(-pow((l-1.42)*13.,2.))*.92;",
    "  float outside=smoothstep(1.46,1.6,l)*pow(flow,2.6)*.6;",
    "  float s3=max(max(mark*.9,wall),outside);",
    "  float dens=s0*uScene.x+s1*uScene.y+s2*uScene.z+s3*uScene.w;",
    // Ripple under the cursor.
    "  dens=max(dens,push*(.25+.5*(.5+.5*sin(dm*30.-uTime*5.))));",
    // Keep text legible where it sits.
    "  float mask=mix(1.,smoothstep(-1.15,.25,(p.x)/(uRes.x/mn)),uMaskLeft);",
    "  dens*=mix(.07,1.,mask)*uDim;",
    // And clear the strip under the navigation.
    "  dens*=1.-smoothstep(.86,.95,cc.y/uRes.y)*.92;",
    "  float hot=max(inP*(uScene.x+uScene.y*built+uScene.z+uScene.w),push*.8);",
    "  hot=max(hot,crest*exp(-r*.5)*.55*(uScene.x+uScene.z));",
    "  hot=max(hot,wall*uScene.w);",
    "  hot=max(hot,scan*uScene.y);",
    "  o=vec4(clamp(dens,0.,1.),clamp(hot,0.,1.),0.,1.);",
    "}",
  ].join("\n");

  var DOTS = [
    "#version 300 es",
    "precision highp float;",
    "uniform sampler2D uTex;uniform float uCell;",
    "out vec4 o;",
    "void main(){",
    "  vec2 frag=gl_FragCoord.xy;",
    "  vec2 id=floor(frag/uCell);",
    "  vec2 local=(frag-(id+.5)*uCell)/uCell;",
    "  vec4 d=texelFetch(uTex,ivec2(id),0);",
    "  float rad=.56*sqrt(d.r);",
    "  float aa=1.2/uCell;",
    "  float dotA=(1.-smoothstep(rad-aa,rad+aa,length(local)))*step(.012,d.r);",
    "  vec3 col=mix(vec3(.82,.806,.776),vec3(1.,.294,.122),d.g);",
    "  o=vec4(col*dotA,dotA);",
    "}",
  ].join("\n");

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  var state = {
    scene: [1, 0, 0, 0],
    sceneTarget: [1, 0, 0, 0],
    build: 0,
    buildTarget: 0,
    dim: 1,
    dimTarget: 1,
    center: [0.86, 0.06],
    centerTarget: [0.86, 0.06],
    scale: 0.66,
    scaleTarget: 0.66,
    maskLeft: 1,
    maskLeftTarget: 1,
    mouse: [10, 10],
    mouseTarget: [10, 10],
    mouseOn: 0,
    mouseOnTarget: 0,
    covered: false,
    ready: false,
  };
  window.AckerField = state;

  var canvas = document.getElementById("field");
  if (!canvas) return;
  var gl;
  try {
    gl = canvas.getContext("webgl2", { alpha: true, antialias: false, powerPreference: "high-performance", premultipliedAlpha: true });
  } catch (e) {}
  if (!gl) {
    canvas.remove();
    document.documentElement.classList.add("no-field");
    return;
  }

  function link(fragSrc) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fragSrc));
    gl.bindAttribLocation(p, 0, "a");
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    return p;
  }
  var prog, dots;
  try {
    prog = link(FRAG);
    dots = link(DOTS);
  } catch (e) {
    console.warn("Signal field unavailable:", e.message);
    canvas.remove();
    document.documentElement.classList.add("no-field");
    return;
  }
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ["uRes", "uTime", "uMouse", "uMouseOn", "uScene", "uBuild", "uDim", "uCenter", "uScale", "uCell", "uMaskLeft"].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });
  var UD = { uTex: gl.getUniformLocation(dots, "uTex"), uCell: gl.getUniformLocation(dots, "uCell") };

  // One texel per dot.
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  var fbo = gl.createFramebuffer();

  var quality = 1;
  var W = 0, H = 0, cell = 8, TW = 1, TH = 1;
  function resize() {
    var cssW = window.innerWidth, cssH = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5) * quality;
    W = Math.max(1, Math.round(cssW * dpr));
    H = Math.max(1, Math.round(cssH * dpr));
    canvas.width = W;
    canvas.height = H;
    cell = (cssW < 700 ? 6.5 : 8) * dpr;
    TW = Math.ceil(W / cell) + 1;
    TH = Math.ceil(H / cell) + 1;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, TW, TH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  window.addEventListener("resize", resize, { passive: true });
  resize();

  // Pointer, in the shader's coordinates.
  function toField(x, y) {
    var mn = Math.min(window.innerWidth, window.innerHeight);
    return [((x - window.innerWidth / 2) / mn) * 2, ((window.innerHeight / 2 - y) / mn) * 2];
  }
  window.addEventListener("pointermove", function (e) {
    state.mouseTarget = toField(e.clientX, e.clientY);
    state.mouseOnTarget = e.pointerType === "touch" ? 0 : 1;
  }, { passive: true });
  document.addEventListener("pointerleave", function () { state.mouseOnTarget = 0; });

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var start = performance.now();
  var last = start, frames = 0, spent = 0;
  var fixedTime = 18;

  function ease(a, b, k) { return a + (b - a) * k; }

  var prevDraw = start;
  function draw(now) {
    var t = reduce ? fixedTime : (now - start) / 1000;
    // Easing runs on elapsed time, so slower machines stay in step rather than lagging behind the scroll.
    var dt = Math.min(0.25, Math.max(0.001, (now - prevDraw) / 1000));
    prevDraw = now;
    var k = reduce ? 1 : 1 - Math.exp(-dt * 4.2);
    var kFast = reduce ? 1 : 1 - Math.exp(-dt * 8.5);
    for (var i = 0; i < 4; i++) state.scene[i] = ease(state.scene[i], state.sceneTarget[i], k);
    state.build = ease(state.build, state.buildTarget, kFast);
    state.dim = ease(state.dim, state.dimTarget, k);
    state.center[0] = ease(state.center[0], state.centerTarget[0], k);
    state.center[1] = ease(state.center[1], state.centerTarget[1], k);
    state.scale = ease(state.scale, state.scaleTarget, k);
    state.maskLeft = ease(state.maskLeft, state.maskLeftTarget, k);
    state.mouse[0] = ease(state.mouse[0], state.mouseTarget[0], kFast);
    state.mouse[1] = ease(state.mouse[1], state.mouseTarget[1], kFast);
    state.mouseOn = ease(state.mouseOn, state.mouseOnTarget, k);

    gl.useProgram(prog);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, TW, TH);
    gl.uniform2f(U.uRes, W, H);
    gl.uniform1f(U.uTime, t);
    gl.uniform2f(U.uMouse, state.mouse[0], state.mouse[1]);
    gl.uniform1f(U.uMouseOn, state.mouseOn);
    gl.uniform4f(U.uScene, state.scene[0], state.scene[1], state.scene[2], state.scene[3]);
    gl.uniform1f(U.uBuild, state.build);
    gl.uniform1f(U.uDim, state.dim);
    gl.uniform2f(U.uCenter, state.center[0], state.center[1]);
    gl.uniform1f(U.uScale, state.scale);
    gl.uniform1f(U.uCell, cell);
    gl.uniform1f(U.uMaskLeft, state.maskLeft);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(dots);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(UD.uTex, 0);
    gl.uniform1f(UD.uCell, cell);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  var minGap = 0, lastDraw = 0;
  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden || state.covered) { last = now; return; }
    if (now - lastDraw < minGap) return;
    lastDraw = now;
    draw(now);
    state.ready = true;
    // Slower machines get a coarser canvas, then fewer field frames, so the page itself never stutters.
    spent += now - last;
    last = now;
    frames++;
    if (frames === 20) {
      var avg = spent / frames;
      state.avgMs = avg;
      if (avg > 30) {
        if (quality > 0.5) {
          quality = Math.max(0.5, quality * 0.75);
          resize();
        } else if (minGap < 200) {
          minGap = minGap ? minGap * 2 : 66;
        }
      }
      frames = 0;
      spent = 0;
    }
  }

  if (reduce) {
    var settle = function () { draw(performance.now()); };
    window.AckerField.redraw = settle;
    settle();
    state.ready = true;
    window.addEventListener("resize", settle, { passive: true });
  } else {
    requestAnimationFrame(loop);
  }
})();
