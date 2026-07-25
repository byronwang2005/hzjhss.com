import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Camera, Geometry, Mesh, Program, Renderer, Transform } from "ogl";
import {
  SupportRenderGate,
  prefersReducedSupportMotion,
  supportParticleBudget,
} from "./support-motion";

gsap.registerPlugin(ScrollTrigger);

type StoryStep = HTMLElement & {
  dataset: DOMStringMap & {
    index?: string;
    eyebrow?: string;
    title?: string;
    copy?: string;
  };
};

type WebglHandle = {
  destroy(): void;
};

const pointVertex = `
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uPointSize;
  varying float vDepth;

  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.22 + position.y * 1.8) * 0.035;
    p.y += cos(uTime * 0.18 + position.x * 1.6) * 0.035;
    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uPointSize * (4.4 / max(1.0, -viewPosition.z));
    vDepth = smoothstep(-2.8, 2.8, p.z);
  }
`;

const pointFragment = `
  precision highp float;
  varying float vDepth;

  void main() {
    vec2 centered = gl_PointCoord - 0.5;
    float distanceToCenter = length(centered);
    float alpha = smoothstep(0.5, 0.08, distanceToCenter);
    vec3 darkGold = vec3(0.50, 0.37, 0.17);
    vec3 lightGold = vec3(0.94, 0.82, 0.53);
    vec3 color = mix(darkGold, lightGold, vDepth);
    gl_FragColor = vec4(color, alpha * 0.82);
  }
`;

const lineVertex = `
  attribute vec3 position;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  varying float vPulse;

  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.22 + position.y * 1.8) * 0.035;
    p.y += cos(uTime * 0.18 + position.x * 1.6) * 0.035;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    vPulse = 0.45 + 0.35 * sin(uTime * 0.7 + position.x + position.y);
  }
`;

const lineFragment = `
  precision highp float;
  varying float vPulse;

  void main() {
    gl_FragColor = vec4(0.79, 0.65, 0.40, 0.075 * vPulse);
  }
`;

function createKnowledgePositions(count: number): {
  points: Float32Array;
  lines: Float32Array;
} {
  const points = new Float32Array(count * 3);
  const linePairs = Math.max(0, count - 1);
  const lines = new Float32Array(linePairs * 6);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const normalized = count <= 1 ? 0 : index / (count - 1);
    const y = 1 - normalized * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = goldenAngle * index;
    const shell = 1.65 + 0.24 * Math.sin(index * 1.73);
    const x = Math.cos(angle) * radius * shell;
    const z = Math.sin(angle) * radius * shell;
    const pointOffset = index * 3;

    points[pointOffset] = x;
    points[pointOffset + 1] = y * shell;
    points[pointOffset + 2] = z;

    if (index > 0) {
      const lineOffset = (index - 1) * 6;
      const previousOffset = (index - 1) * 3;
      lines[lineOffset] = points[previousOffset];
      lines[lineOffset + 1] = points[previousOffset + 1];
      lines[lineOffset + 2] = points[previousOffset + 2];
      lines[lineOffset + 3] = x;
      lines[lineOffset + 4] = y * shell;
      lines[lineOffset + 5] = z;
    }
  }

  return { points, lines };
}

function initKnowledgeField(root: HTMLElement, reducedMotion: boolean): WebglHandle {
  const budget = supportParticleBudget(window.innerWidth, window.devicePixelRatio, reducedMotion);
  const renderGate = new SupportRenderGate();
  renderGate.setReducedMotion(reducedMotion);

  const renderer = new Renderer({
    alpha: true,
    antialias: budget.dpr <= 1.25,
    dpr: budget.dpr,
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  root.appendChild(renderer.gl.canvas as unknown as Node);

  const camera = new Camera(gl, { fov: 42 });
  camera.position.z = 5.2;

  const scene = new Transform();
  const { points, lines } = createKnowledgePositions(budget.count);
  const pointGeometry = new Geometry(gl, {
    position: { size: 3, data: points },
  });
  const lineGeometry = new Geometry(gl, {
    position: { size: 3, data: lines },
  });
  const pointProgram = new Program(gl, {
    vertex: pointVertex,
    fragment: pointFragment,
    transparent: true,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uPointSize: { value: window.innerWidth < 560 ? 5.2 : 6.4 },
    },
  });
  const lineProgram = new Program(gl, {
    vertex: lineVertex,
    fragment: lineFragment,
    transparent: true,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
    },
  });
  const lineMesh = new Mesh(gl, {
    geometry: lineGeometry,
    program: lineProgram,
    mode: gl.LINES,
  });
  const pointMesh = new Mesh(gl, {
    geometry: pointGeometry,
    program: pointProgram,
    mode: gl.POINTS,
  });
  lineMesh.setParent(scene);
  pointMesh.setParent(scene);

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let frame = 0;
  let startTime = performance.now();

  const resize = (): void => {
    const bounds = root.getBoundingClientRect();
    renderer.setSize(Math.max(bounds.width, 1), Math.max(bounds.height, 1));
    camera.perspective({ aspect: Math.max(bounds.width, 1) / Math.max(bounds.height, 1) });
  };

  const onPointerMove = (event: PointerEvent): void => {
    target.x = event.clientX / window.innerWidth - 0.5;
    target.y = event.clientY / window.innerHeight - 0.5;
  };

  const render = (now: number): void => {
    if (renderGate.active) {
      pointer.x += (target.x - pointer.x) * 0.035;
      pointer.y += (target.y - pointer.y) * 0.035;
      const elapsed = (now - startTime) / 1000;
      scene.rotation.y = elapsed * 0.035 + pointer.x * 0.32;
      scene.rotation.x = -0.1 + pointer.y * 0.18;
      pointProgram.uniforms.uTime.value = elapsed;
      lineProgram.uniforms.uTime.value = elapsed;
      renderer.render({ scene, camera });
    } else if (reducedMotion) {
      renderer.render({ scene, camera });
    }
    frame = requestAnimationFrame(render);
  };

  const onVisibilityChange = (): void => {
    const visible = document.visibilityState === "visible";
    renderGate.setDocumentVisible(visible);
    if (visible) startTime = performance.now();
  };

  const observer = new IntersectionObserver(
    ([entry]) => renderGate.setCanvasVisible(Boolean(entry?.isIntersecting)),
    { rootMargin: "160px 0px" },
  );

  resize();
  observer.observe(root);
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  frame = requestAnimationFrame(render);

  return {
    destroy(): void {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      renderer.gl.canvas.remove();
    },
  };
}

function initSmoothScroll(reducedMotion: boolean): Lenis | null {
  if (reducedMotion) return null;

  const lenis = new Lenis({
    duration: 1.15,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.9,
  });
  const update = (time: number): void => lenis.raf(time * 1000);

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(update);
  gsap.ticker.lagSmoothing(0);

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const selector = link.getAttribute("href");
      if (!selector || selector === "#") return;
      const target = document.querySelector<HTMLElement>(selector);
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { offset: -76, duration: 1.2 });
    });
  });

  if (window.location.hash) {
    const initialTarget = document.querySelector<HTMLElement>(window.location.hash);
    if (initialTarget) {
      requestAnimationFrame(() => {
        lenis.scrollTo(initialTarget, { offset: -76, immediate: true });
      });
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") lenis.stop();
    else lenis.start();
  });

  return lenis;
}

function setStoryActive(step: StoryStep): void {
  const story = step.closest<HTMLElement>("[data-story]");
  if (!story) return;

  story.querySelectorAll<StoryStep>("[data-story-step]").forEach((candidate) => {
    candidate.classList.toggle("is-active", candidate === step);
  });
  const orbitItems = story.querySelectorAll<HTMLElement>(".support-stage-orbit li");
  const stepIndex = Number.parseInt(step.dataset.index || "1", 10) - 1;
  orbitItems.forEach((item, index) => item.classList.toggle("is-active", index === stepIndex));

  const index = story.querySelector<HTMLElement>("[data-story-index]");
  const eyebrow = story.querySelector<HTMLElement>("[data-story-eyebrow]");
  const title = story.querySelector<HTMLElement>("[data-story-title]");
  const copy = story.querySelector<HTMLElement>("[data-story-copy]");
  const targets = [index, eyebrow, title, copy].filter((target): target is HTMLElement => Boolean(target));

  gsap.to(targets, {
    opacity: 0,
    y: -8,
    duration: 0.16,
    stagger: 0.025,
    onComplete: () => {
      if (index) index.textContent = step.dataset.index || "";
      if (eyebrow) eyebrow.textContent = step.dataset.eyebrow || "";
      if (title) title.textContent = step.dataset.title || "";
      if (copy) copy.textContent = step.dataset.copy || "";
      gsap.fromTo(targets, { opacity: 0, y: 10 }, {
        opacity: 1,
        y: 0,
        duration: 0.42,
        stagger: 0.035,
      });
    },
  });
}

function initMagneticControls(reducedMotion: boolean): void {
  if (reducedMotion || !window.matchMedia("(pointer: fine)").matches) return;

  document.querySelectorAll<HTMLElement>(".support-magnetic").forEach((control) => {
    const move = (event: PointerEvent): void => {
      const bounds = control.getBoundingClientRect();
      const x = event.clientX - bounds.left - bounds.width / 2;
      const y = event.clientY - bounds.top - bounds.height / 2;
      gsap.to(control, { x: x * 0.13, y: y * 0.18, duration: 0.38 });
    };
    const reset = (): void => {
      gsap.to(control, { x: 0, y: 0, duration: 0.56 });
    };
    control.addEventListener("pointermove", move);
    control.addEventListener("pointerleave", reset);
  });
}

function initScrollAnimations(reducedMotion: boolean): void {
  const header = document.querySelector<HTMLElement>("[data-support-header]");
  const progress = document.querySelector<HTMLElement>(".support-scroll-progress span");

  const updateHeader = (): void => {
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
  };
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (reducedMotion) {
    document.querySelectorAll<HTMLElement>("[data-story-step]").forEach((step) => {
      step.classList.add("is-active");
    });
    return;
  }

  if (progress) {
    gsap.to(progress, {
      scaleX: 1,
      transformOrigin: "left center",
      scrollTrigger: {
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.2,
      },
    });
  }

  gsap.from(".support-header", { yPercent: -110, duration: 0.9 });
  gsap.from(".support-reveal", {
    y: 42,
    opacity: 0,
    duration: 1.05,
    stagger: 0.12,
    delay: 0.15,
  });

  document.querySelectorAll<HTMLElement>(".support-section-head, .support-proof-intro, .support-ecosystem > div, .support-roadmap-copy").forEach((section) => {
    gsap.from(section.children, {
      y: 46,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      scrollTrigger: {
        trigger: section,
        start: "top 78%",
        once: true,
      },
    });
  });

  document.querySelectorAll<HTMLElement>("[data-count]").forEach((counter) => {
    const endValue = Number.parseInt(counter.dataset.count || "0", 10);
    const state = { value: 0 };
    gsap.to(state, {
      value: endValue,
      duration: 1.4,
      scrollTrigger: {
        trigger: counter,
        start: "top 88%",
        once: true,
      },
      onUpdate: () => {
        counter.textContent = Math.round(state.value).toString();
      },
    });
  });

  gsap.from(".support-manifesto-copy", {
    y: 80,
    opacity: 0,
    scale: 0.94,
    scrollTrigger: {
      trigger: ".support-manifesto",
      start: "top 70%",
      end: "center 52%",
      scrub: 0.8,
    },
  });

  document.querySelectorAll<StoryStep>("[data-story-step]").forEach((step) => {
    ScrollTrigger.create({
      trigger: step,
      start: "top 58%",
      end: "bottom 42%",
      onEnter: () => setStoryActive(step),
      onEnterBack: () => setStoryActive(step),
    });
  });

  gsap.from(".support-role-grid article", {
    y: 70,
    opacity: 0,
    duration: 0.9,
    stagger: 0.12,
    scrollTrigger: {
      trigger: ".support-role-grid",
      start: "top 78%",
      once: true,
    },
  });

  gsap.from(".support-architecture-node", {
    opacity: 0,
    scale: 0.88,
    duration: 0.7,
    stagger: 0.09,
    scrollTrigger: {
      trigger: ".support-architecture-map",
      start: "top 70%",
      once: true,
    },
  });
  gsap.fromTo(".support-architecture-rail i", { xPercent: -110 }, {
    xPercent: 620,
    scrollTrigger: {
      trigger: ".support-architecture-map",
      start: "top 80%",
      end: "bottom 20%",
      scrub: 0.6,
    },
  });

  const capabilitySection = document.querySelector<HTMLElement>(".support-capabilities");
  const capabilityTrack = document.querySelector<HTMLElement>("[data-capability-track]");
  if (capabilitySection && capabilityTrack && window.innerWidth > 820) {
    const getDistance = (): number => Math.max(0, capabilityTrack.scrollWidth - window.innerWidth + 64);
    gsap.to(capabilityTrack, {
      x: () => -getDistance(),
      scrollTrigger: {
        trigger: capabilitySection,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.85,
        invalidateOnRefresh: true,
      },
    });
  }

  gsap.from(".support-codex-brand", {
    opacity: 0,
    scale: 0.86,
    rotate: -5,
    duration: 1,
    scrollTrigger: {
      trigger: ".support-codex",
      start: "top 72%",
      once: true,
    },
  });
  gsap.from(".support-codex-copy > *", {
    y: 44,
    opacity: 0,
    duration: 0.85,
    stagger: 0.09,
    scrollTrigger: {
      trigger: ".support-codex-copy",
      start: "top 78%",
      once: true,
    },
  });
  gsap.from(".support-codex-flow article, .support-codex-flow > i, .support-codex-proof > div", {
    y: 32,
    opacity: 0,
    duration: 0.72,
    stagger: 0.075,
    scrollTrigger: {
      trigger: ".support-codex-flow",
      start: "top 78%",
      once: true,
    },
  });

  gsap.from(".support-ecosystem li", {
    y: 34,
    opacity: 0,
    duration: 0.7,
    stagger: 0.09,
    scrollTrigger: {
      trigger: ".support-ecosystem ul",
      start: "top 78%",
      once: true,
    },
  });

  document.querySelectorAll<HTMLElement>(".support-roadmap li").forEach((item) => {
    gsap.from(item, {
      x: 48,
      opacity: 0,
      duration: 0.75,
      scrollTrigger: {
        trigger: item,
        start: "top 82%",
        once: true,
      },
    });
  });

  gsap.from(".support-final h2, .support-final > p, .support-final .support-button", {
    y: 72,
    opacity: 0,
    duration: 1,
    stagger: 0.1,
    scrollTrigger: {
      trigger: ".support-final",
      start: "top 65%",
      once: true,
    },
  });

  gsap.to(".support-final-orbit", {
    scale: 1.12,
    scrollTrigger: {
      trigger: ".support-final",
      start: "top bottom",
      end: "bottom bottom",
      scrub: 1,
    },
  });
}

export function initSupportPage(): void {
  const motionTarget = {
    innerWidth: window.innerWidth,
    devicePixelRatio: window.devicePixelRatio,
    matchMedia: window.matchMedia.bind(window),
  };
  const reducedMotion = prefersReducedSupportMotion(motionTarget);
  const webglRoot = document.querySelector<HTMLElement>("[data-webgl-root]");

  initSmoothScroll(reducedMotion);
  initScrollAnimations(reducedMotion);
  initMagneticControls(reducedMotion);

  if (webglRoot) {
    try {
      initKnowledgeField(webglRoot, reducedMotion);
    } catch {
      document.body.classList.add("is-webgl-fallback");
    }
  }

  if (document.fonts?.ready) {
    void document.fonts.ready.then(() => ScrollTrigger.refresh());
  } else {
    ScrollTrigger.refresh();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSupportPage, { once: true });
} else {
  initSupportPage();
}
