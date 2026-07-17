import{a as W,b as gs,c as bs,d as C,e as vs,f as xs,g as or,h as R,i as ws,j as ys,k as Co,l as P}from"./drive-assets/chunk-LW6VUOT3.js";import{a as ae,b as yo,c as ko}from"./drive-assets/chunk-FYTIMSG3.js";var Ql=ae((Lw,Jl)=>{"use strict";Jl.exports=function(t){if(typeof t!="number"||Number.isNaN(t))throw new TypeError(`Expected a number, got ${typeof t}`);let r=t<0,o=Math.abs(t);if(r&&(o=-o),o===0)return"0 B";let i=["B","KB","MB","GB","TB","PB","EB","ZB","YB"],n=Math.min(Math.floor(Math.log(o)/Math.log(1024)),i.length-1),a=Number(o/1024**n),s=i[n];return`${a>=10||a%1===0?Math.round(a):a.toFixed(1)} ${s}`}});var ru=ae((Dw,tu)=>{"use strict";function eu(e,t){this.text=e=e||"",this.hasWild=~e.indexOf("*"),this.separator=t,this.parts=e.split(t)}eu.prototype.match=function(e){var t=!0,r=this.parts,o,i=r.length,n;if(typeof e=="string"||e instanceof String)if(!this.hasWild&&this.text!=e)t=!1;else{for(n=(e||"").split(this.separator),o=0;t&&o<i;o++)r[o]!=="*"&&(o<n.length?t=r[o]===n[o]:t=!1);t=t&&n}else if(typeof e.splice=="function")for(t=[],o=e.length;o--;)this.match(e[o])&&(t[t.length]=e[o]);else if(typeof e=="object"){t={};for(var a in e)this.match(a)&&(t[a]=e[a])}return t};tu.exports=function(e,t,r){var o=new eu(e,r||/[\/\.]/);return typeof t<"u"?o.match(t):o}});var iu=ae((zw,ou)=>{var cp=ru(),dp=/[\/\+\.]/;ou.exports=function(e,t){function r(o){var i=cp(o,e,dp);return i&&i.length>=2}return t?r(t.split(";")[0]):r}});var Vo=ae((Iw,uu)=>{function fp(e){var t=typeof e;return e!=null&&(t=="object"||t=="function")}uu.exports=fp});var du=ae((Bw,cu)=>{var mp=typeof global=="object"&&global&&global.Object===Object&&global;cu.exports=mp});var gn=ae(($w,pu)=>{var hp=du(),gp=typeof self=="object"&&self&&self.Object===Object&&self,bp=hp||gp||Function("return this")();pu.exports=bp});var mu=ae((Nw,fu)=>{var vp=gn(),xp=function(){return vp.Date.now()};fu.exports=xp});var gu=ae((qw,hu)=>{var wp=/\s/;function yp(e){for(var t=e.length;t--&&wp.test(e.charAt(t)););return t}hu.exports=yp});var vu=ae((jw,bu)=>{var kp=gu(),Cp=/^\s+/;function Ep(e){return e&&e.slice(0,kp(e)+1).replace(Cp,"")}bu.exports=Ep});var bn=ae((Uw,xu)=>{var Tp=gn(),Ap=Tp.Symbol;xu.exports=Ap});var Cu=ae((Hw,ku)=>{var wu=bn(),yu=Object.prototype,_p=yu.hasOwnProperty,Sp=yu.toString,Jr=wu?wu.toStringTag:void 0;function Fp(e){var t=_p.call(e,Jr),r=e[Jr];try{e[Jr]=void 0;var o=!0}catch{}var i=Sp.call(e);return o&&(t?e[Jr]=r:delete e[Jr]),i}ku.exports=Fp});var Tu=ae((Vw,Eu)=>{var Lp=Object.prototype,Dp=Lp.toString;function zp(e){return Dp.call(e)}Eu.exports=zp});var Fu=ae((Ww,Su)=>{var Au=bn(),Mp=Cu(),Rp=Tu(),Pp="[object Null]",Op="[object Undefined]",_u=Au?Au.toStringTag:void 0;function Ip(e){return e==null?e===void 0?Op:Pp:_u&&_u in Object(e)?Mp(e):Rp(e)}Su.exports=Ip});var Du=ae((Gw,Lu)=>{function Bp(e){return e!=null&&typeof e=="object"}Lu.exports=Bp});var Mu=ae((Yw,zu)=>{var $p=Fu(),Np=Du(),qp="[object Symbol]";function jp(e){return typeof e=="symbol"||Np(e)&&$p(e)==qp}zu.exports=jp});var Iu=ae((Xw,Ou)=>{var Up=vu(),Ru=Vo(),Hp=Mu(),Pu=NaN,Vp=/^[-+]0x[0-9a-f]+$/i,Wp=/^0b[01]+$/i,Gp=/^0o[0-7]+$/i,Yp=parseInt;function Xp(e){if(typeof e=="number")return e;if(Hp(e))return Pu;if(Ru(e)){var t=typeof e.valueOf=="function"?e.valueOf():e;e=Ru(t)?t+"":t}if(typeof e!="string")return e===0?e:+e;e=Up(e);var r=Wp.test(e);return r||Gp.test(e)?Yp(e.slice(2),r?2:8):Vp.test(e)?Pu:+e}Ou.exports=Xp});var Nu=ae((Kw,$u)=>{var Kp=Vo(),vn=mu(),Bu=Iu(),Zp="Expected a function",Jp=Math.max,Qp=Math.min;function ef(e,t,r){var o,i,n,a,s,l,u=0,c=!1,p=!1,g=!0;if(typeof e!="function")throw new TypeError(Zp);t=Bu(t)||0,Kp(r)&&(c=!!r.leading,p="maxWait"in r,n=p?Jp(Bu(r.maxWait)||0,t):n,g="trailing"in r?!!r.trailing:g);function m(A){var z=o,O=i;return o=i=void 0,u=A,a=e.apply(O,z),a}function h(A){return u=A,s=setTimeout(S,t),c?m(A):a}function x(A){var z=A-l,O=A-u,H=t-z;return p?Qp(H,n-O):H}function y(A){var z=A-l,O=A-u;return l===void 0||z>=t||z<0||p&&O>=n}function S(){var A=vn();if(y(A))return k(A);s=setTimeout(S,x(A))}function k(A){return s=void 0,g&&o?m(A):(o=i=void 0,a)}function _(){s!==void 0&&clearTimeout(s),u=0,o=l=i=s=void 0}function T(){return s===void 0?a:k(vn())}function E(){var A=vn(),z=y(A);if(o=arguments,i=this,l=A,z){if(s===void 0)return h(l);if(p)return clearTimeout(s),s=setTimeout(S,t),m(l)}return s===void 0&&(s=setTimeout(S,t)),a}return E.cancel=_,E.flush=T,E}$u.exports=ef});var ju=ae((Zw,qu)=>{var tf=Nu(),rf=Vo(),of="Expected a function";function nf(e,t,r){var o=!0,i=!0;if(typeof e!="function")throw new TypeError(of);return rf(r)&&(o="leading"in r?!!r.leading:o,i="trailing"in r?!!r.trailing:i),tf(e,t,{leading:o,maxWait:t,trailing:i})}qu.exports=nf});var Hu=ae((Jw,Uu)=>{Uu.exports=function(){var t={},r=t._fns={};t.emit=function(a,s,l,u,c,p,g){var m=o(a);m.length&&i(a,m,[s,l,u,c,p,g])},t.on=function(a,s){r[a]||(r[a]=[]),r[a].push(s)},t.once=function(a,s){function l(){s.apply(this,arguments),t.off(a,l)}this.on(a,l)},t.off=function(a,s){var l=[];if(a&&s){var u=this._fns[a],c=0,p=u?u.length:0;for(c;c<p;c++)u[c]!==s&&l.push(u[c])}l.length?this._fns[a]=l:delete this._fns[a]};function o(n){var a=r[n]?r[n]:[],s=n.indexOf(":"),l=s===-1?[n]:[n.substring(0,s),n.substring(s+1)],u=Object.keys(r),c=0,p=u.length;for(c;c<p;c++){var g=u[c];if(g==="*"&&(a=a.concat(r[g])),l.length===2&&l[0]===g){a=a.concat(r[g]);break}}return a}function i(n,a,s){var l=0,u=a.length;for(l;l<u&&a[l];l++)a[l].event=n,a[l].apply(a[l],s)}return t}});var Bi=new Set;function u0(){let e=document.documentElement.clientWidth;return Math.abs(window.innerWidth-e)}function c0(){let e=Number(getComputedStyle(document.body).paddingRight.replace(/px/,""));return isNaN(e)||!e?0:e}function ir(e){if(Bi.add(e),!document.documentElement.classList.contains("wa-scroll-lock")){let t=u0()+c0(),r=getComputedStyle(document.documentElement).scrollbarGutter;(!r||r==="auto")&&(r="stable"),t<2&&(r=""),document.documentElement.style.setProperty("--wa-scroll-lock-gutter",r),document.documentElement.classList.add("wa-scroll-lock"),document.documentElement.style.setProperty("--wa-scroll-lock-size",`${t}px`)}}function nr(e){Bi.delete(e),Bi.size===0&&(document.documentElement.classList.remove("wa-scroll-lock"),document.documentElement.style.removeProperty("--wa-scroll-lock-size"))}function Eo(e){return e.split(" ").map(t=>t.trim()).filter(t=>t!=="")}var ar=class extends Event{constructor(){super("wa-show",{bubbles:!0,cancelable:!0,composed:!0})}};var sr=class extends Event{constructor(e){super("wa-hide",{bubbles:!0,cancelable:!0,composed:!0}),this.detail=e}};var lr=class extends Event{constructor(){super("wa-after-show",{bubbles:!0,cancelable:!1,composed:!0})}};var ur=class extends Event{constructor(){super("wa-after-hide",{bubbles:!0,cancelable:!1,composed:!0})}};var ks=W`
  :host {
    --width: 31rem;
    --spacing: var(--wa-space-l);
    --backdrop-filter: none;
    --show-duration: var(--wa-transition-normal);
    --hide-duration: var(--wa-transition-normal);

    display: none;
  }

  :host([open]) {
    display: block;
  }

  .dialog {
    display: flex;
    flex-direction: column;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    width: var(--width);
    max-width: calc(100% - var(--wa-space-2xl));
    max-height: calc(100% - var(--wa-space-2xl));
    color: inherit;
    background-color: var(--wa-color-surface-raised);
    border-radius: var(--wa-panel-border-radius);
    border: none;
    box-shadow: var(--wa-shadow-l);
    padding: 0;
    margin: auto;

    &.show {
      animation: show-dialog var(--show-duration) ease;

      &::backdrop {
        animation: show-backdrop var(--show-duration, 200ms) ease;
      }
    }

    &.hide {
      animation: show-dialog var(--hide-duration) ease reverse;

      &::backdrop {
        animation: show-backdrop var(--hide-duration, 200ms) ease reverse;
      }
    }

    &.pulse {
      animation: pulse 250ms ease;
    }
  }

  .dialog:focus {
    outline: none;
  }

  /* Ensure there's enough vertical padding for phones that don't update vh when chrome appears (e.g. iPhone) */
  @media screen and (max-width: 420px) {
    .dialog {
      max-height: 80vh;
    }
  }

  .open {
    display: flex;
    opacity: 1;
  }

  .header {
    flex: 0 0 auto;
    display: flex;
    flex-wrap: nowrap;

    padding-inline-start: var(--spacing);
    padding-block-end: 0;

    /* Subtract the close button's padding so that the X is visually aligned with the edges of the dialog content */
    padding-inline-end: calc(var(--spacing) - var(--wa-form-control-padding-block));
    padding-block-start: calc(var(--spacing) - var(--wa-form-control-padding-block));
  }

  .title {
    align-self: center;
    flex: 1 1 auto;
    font-family: inherit;
    font-size: var(--wa-font-size-l);
    font-weight: var(--wa-font-weight-heading);
    line-height: var(--wa-line-height-condensed);
    margin: 0;
  }

  .header-actions {
    align-self: start;
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: end;
    gap: var(--wa-space-2xs);
    padding-inline-start: var(--spacing);
  }

  .header-actions wa-button,
  .header-actions ::slotted(wa-button) {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .body {
    flex: 1 1 auto;
    display: block;
    padding: var(--spacing);
    overflow: auto;
    -webkit-overflow-scrolling: touch;

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: var(--wa-focus-ring-offset);
    }
  }

  .footer {
    flex: 0 0 auto;
    display: flex;
    flex-wrap: wrap;
    gap: var(--wa-space-xs);
    justify-content: end;
    padding: var(--spacing);
    padding-block-start: 0;
  }

  .footer ::slotted(wa-button:not(:first-of-type)) {
    margin-inline-start: var(--wa-spacing-xs);
  }

  .dialog::backdrop {
    /*
      NOTE: the ::backdrop element doesn't inherit properly in Safari yet, but it will in 17.4! At that time, we can
      remove the fallback values here.
    */
    background-color: var(--wa-color-overlay-modal, rgb(0 0 0 / 0.25));
    backdrop-filter: var(--backdrop-filter);
  }

  @keyframes pulse {
    0% {
      scale: 1;
    }
    50% {
      scale: 1.02;
    }
    100% {
      scale: 1;
    }
  }

  @keyframes show-dialog {
    from {
      opacity: 0;
      scale: 0.8;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }

  @keyframes show-backdrop {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (forced-colors: active) {
    .dialog {
      border: solid 1px white;
    }
  }
`;var St=[];function cr(e){St.push(e)}function Ft(e){for(let t=St.length-1;t>=0;t--)if(St[t]===e){St.splice(t,1);break}}function bt(e){return St.length>0&&St[St.length-1]===e}var dr=class{constructor(e,...t){this.slotNames=[],this.handleSlotChange=r=>{let o=r.target;(this.slotNames.includes("[default]")&&!o.name||o.name&&this.slotNames.includes(o.name))&&this.host.requestUpdate()},(this.host=e).addController(this),this.slotNames=t}hasDefaultSlot(){return this.host.childNodes?[...this.host.childNodes].some(e=>{if(e.nodeType===Node.TEXT_NODE&&e.textContent.trim()!=="")return!0;if(e.nodeType===Node.ELEMENT_NODE){let t=e;if(t.tagName.toLowerCase()==="wa-visually-hidden")return!1;if(!t.hasAttribute("slot"))return!0}return!1}):!1}hasNamedSlot(e){return this.host.querySelector?.(`:scope > [slot="${e}"]`)!==null}test(e,t){return t&&this.host.didSSR&&!this.host.hasUpdated?!!this.host[t]:e==="[default]"?this.hasDefaultSlot():this.hasNamedSlot(e)}hostConnected(){let e=this.host.shadowRoot;e&&"addEventListener"in e&&e.addEventListener("slotchange",this.handleSlotChange)}hostDisconnected(){let e=this.host.shadowRoot;e&&"removeEventListener"in e&&e.removeEventListener("slotchange",this.handleSlotChange)}};function Fe(e,t){return new Promise(r=>{let o=new AbortController,{signal:i}=o;if(e.classList.contains(t))return;e.classList.add(t);let n=!1,a=()=>{n||(n=!0,e.classList.remove(t),r(),o.abort())};e.addEventListener("animationend",a,{once:!0,signal:i}),e.addEventListener("animationcancel",a,{once:!0,signal:i}),requestAnimationFrame(()=>{!n&&e.getAnimations().length===0&&a()})})}function se(e,t){let r={waitUntilFirstUpdate:!1,...t};return(o,i)=>{let{update:n}=o,a=Array.isArray(e)?e:[e];o.update=function(s){a.forEach(l=>{let u=l;if(s.has(u)){let c=s.get(u),p=this[u];c!==p&&(!r.waitUntilFirstUpdate||this.hasUpdated)&&this[i](c,p)}}),n.call(this,s)}}}var d0=Object.defineProperty,p0=Object.getOwnPropertyDescriptor,Cs=e=>{throw TypeError(e)},v=(e,t,r,o)=>{for(var i=o>1?void 0:o?p0(t,r):t,n=e.length-1,a;n>=0;n--)(a=e[n])&&(i=(o?a(t,r,i):a(i))||i);return o&&i&&d0(t,r,i),i},Es=(e,t,r)=>t.has(e)||Cs("Cannot "+r),Ts=(e,t,r)=>(Es(e,t,"read from private field"),r?r.call(e):t.get(e)),As=(e,t,r)=>t.has(e)?Cs("Cannot add the same private member more than once"):t instanceof WeakSet?t.add(e):t.set(e,r),_s=(e,t,r,o)=>(Es(e,t,"write to private field"),o?o.call(e,r):t.set(e,r),r);var ue=e=>(t,r)=>{r!==void 0?r.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)};var f0={attribute:!0,type:String,converter:gs,reflect:!1,hasChanged:bs},m0=(e=f0,t,r)=>{let{kind:o,metadata:i}=r,n=globalThis.litPropertyMetadata.get(i);if(n===void 0&&globalThis.litPropertyMetadata.set(i,n=new Map),o==="setter"&&((e=Object.create(e)).wrapped=!0),n.set(r.name,e),o==="accessor"){let{name:a}=r;return{set(s){let l=t.get.call(this);t.set.call(this,s),this.requestUpdate(a,l,e,!0,s)},init(s){return s!==void 0&&this.C(a,void 0,e,s),s}}}if(o==="setter"){let{name:a}=r;return function(s){let l=this[a];t.call(this,s),this.requestUpdate(a,l,e,!0,s)}}throw Error("Unsupported decorator location: "+o)};function w(e){return(t,r)=>typeof r=="object"?m0(e,t,r):((o,i,n)=>{let a=i.hasOwnProperty(n);return i.constructor.createProperty(n,o),a?Object.getOwnPropertyDescriptor(i,n):void 0})(e,t,r)}function Lt(e){return w({...e,state:!0,attribute:!1})}var Dt=(e,t,r)=>(r.configurable=!0,r.enumerable=!0,Reflect.decorate&&typeof t!="object"&&Object.defineProperty(e,t,r),r);function Te(e,t){return(r,o,i)=>{let n=a=>a.renderRoot?.querySelector(e)??null;if(t){let{get:a,set:s}=typeof o=="object"?r:i??(()=>{let l=Symbol();return{get(){return this[l]},set(u){this[l]=u}}})();return Dt(r,o,{get(){let l=a.call(this);return l===void 0&&(l=n(this),(l!==null||this.hasUpdated)&&s.call(this,l)),l}})}return Dt(r,o,{get(){return n(this)}})}}var h0=W`
  :host {
    box-sizing: border-box;
  }

  :host *,
  :host *::before,
  :host *::after {
    box-sizing: inherit;
  }

  [hidden],
  :host([hidden]) {
    display: none !important;
  }
`,g0=/;\s+$/;function b0(e){return e.replace(/[A-Z]/g,t=>`-${t.toLowerCase()}`)}function Ss(e){let{property:t,value:r,element:o}=e;if(r){let i=o.getAttribute("style")||"";i&&(i.match(g0)||(i+=";"),i+=" ");let n=`${t}: ${r}`;return i.includes(n)?void 0:`${i}${n};`}return null}var To,Q=class extends Co{constructor(){super(),As(this,To,!1),this.initialReflectedProperties=new Map,this.didSSR=!!this.shadowRoot,this.customStates={set:(t,r)=>{if(this.internals?.states)try{r?this.internals.states.add(t):this.internals.states.delete(t)}catch(o){if(String(o).includes("must start with '--'"))console.error("Your browser implements an outdated version of CustomStateSet. Consider using a polyfill");else throw o}},has:t=>{if(!this.internals?.states)return!1;try{return this.internals.states.has(t)}catch{return!1}}};try{this.internals=this.attachInternals()}catch{console.error("Element internals are not supported in your browser. Consider using a polyfill")}this.customStates.set("wa-defined",!0);let e=this.constructor;for(let[t,r]of e.elementProperties)r.default==="inherit"&&r.initial!==void 0&&typeof t=="string"&&this.customStates.set(`initial-${t}-${r.initial}`,!0)}static get styles(){let e=Array.isArray(this.css)?this.css:this.css?[this.css]:[];return[h0,...e]}connectedCallback(){super.connectedCallback(),this.didSSR||this.shadowRoot?.prepend(document.createComment(` Web Awesome: https://webawesome.com/docs/components/${this.localName.replace("wa-","")} `)),this.didSSR&&this.updateComplete.then(()=>{this.shadowRoot?.prepend(document.createComment(` Web Awesome: https://webawesome.com/docs/components/${this.localName.replace("wa-","")} `))})}attributeChangedCallback(e,t,r){Ts(this,To)||(this.constructor.elementProperties.forEach((o,i)=>{o.reflect&&this[i]!=null&&this.initialReflectedProperties.set(i,this[i])}),_s(this,To,!0)),super.attributeChangedCallback(e,t,r)}willUpdate(e){super.willUpdate(e),this.initialReflectedProperties.forEach((t,r)=>{e.has(r)&&this[r]==null&&(this[r]=t)})}firstUpdated(e){super.firstUpdated(e),this.didSSR&&this.shadowRoot?.querySelectorAll("slot").forEach(t=>{t.dispatchEvent(new Event("slotchange",{bubbles:!0,composed:!1,cancelable:!1}))})}update(e){try{super.update(e)}catch(t){if(this.didSSR&&!this.hasUpdated){let r=new Event("lit-hydration-error",{bubbles:!0,composed:!0,cancelable:!1});r.error=t,this.dispatchEvent(r)}throw t}}setStyle(e,t){if(!this.style){let r=Ss({property:b0(e),value:t,element:this});r&&this.setAttribute("style",r);return}this.style[e]=t}setStyleProperty(e,t){if(!this.style){let r=Ss({property:e,value:t,element:this});r&&this.setAttribute("style",r);return}this.style.setProperty(e,t)}relayNativeEvent(e,t){e.stopImmediatePropagation(),this.dispatchEvent(new e.constructor(e.type,{...e,...t}))}};To=new WeakMap;v([w()],Q.prototype,"dir",2);v([w()],Q.prototype,"lang",2);v([w({type:Boolean,reflect:!0,attribute:"did-ssr"})],Q.prototype,"didSSR",2);var $i=new Set,pr=new Map,zt,Ni="ltr",qi="en",Fs=typeof MutationObserver<"u"&&typeof document<"u"&&typeof document.documentElement<"u";if(Fs){let e=new MutationObserver(Ls);Ni=document.documentElement.dir||"ltr",qi=document.documentElement.lang||navigator.language,e.observe(document.documentElement,{attributes:!0,attributeFilter:["dir","lang"]})}function qr(...e){e.map(t=>{let r=t.$code.toLowerCase();pr.has(r)?pr.set(r,Object.assign(Object.assign({},pr.get(r)),t)):pr.set(r,t),zt||(zt=t)}),Ls()}function Ls(){Fs&&(Ni=document.documentElement.dir||"ltr",qi=document.documentElement.lang||navigator.language),[...$i.keys()].map(e=>{typeof e.requestUpdate=="function"&&e.requestUpdate()})}var Ao=class{constructor(t){this.host=t,this.host.addController(this)}hostConnected(){$i.add(this.host)}hostDisconnected(){$i.delete(this.host)}dir(){return`${this.host.dir||Ni}`.toLowerCase()}lang(){return`${this.host.lang||qi}`.toLowerCase()}getTranslationData(t){var r,o;let i;try{i=new Intl.Locale(t.replace(/_/g,"-"))}catch{return{locale:void 0,language:"",region:"",primary:void 0,secondary:void 0}}let n=i.language.toLowerCase(),a=(o=(r=i.region)===null||r===void 0?void 0:r.toLowerCase())!==null&&o!==void 0?o:"",s=pr.get(`${n}-${a}`),l=pr.get(n);return{locale:i,language:n,region:a,primary:s,secondary:l}}exists(t,r){var o;let{primary:i,secondary:n}=this.getTranslationData((o=r.lang)!==null&&o!==void 0?o:this.lang());return r=Object.assign({includeFallback:!1},r),!!(i&&i[t]||n&&n[t]||r.includeFallback&&zt&&zt[t])}term(t,...r){let{primary:o,secondary:i}=this.getTranslationData(this.lang()),n;if(o&&o[t])n=o[t];else if(i&&i[t])n=i[t];else if(zt&&zt[t])n=zt[t];else return console.error(`No translation found for: ${String(t)}`),String(t);return typeof n=="function"?n(...r):n}date(t,r){return t=new Date(t),new Intl.DateTimeFormat(this.lang(),r).format(t)}number(t,r){return t=Number(t),isNaN(t)?"":new Intl.NumberFormat(this.lang(),r).format(t)}relativeTime(t,r,o){return new Intl.RelativeTimeFormat(this.lang(),o).format(t,r)}};var Ds={$code:"en",$name:"English",$dir:"ltr",carousel:"Carousel",captions:"Captions",chooseDate:"Choose date",chooseDecade:"Choose decade",chooseMonth:"Choose month",chooseYear:"Choose year",clearEntry:"Clear entry",close:"Close",closeCalendar:"Close calendar",createOption:e=>`Create "${e}"`,copied:"Copied",copy:"Copy",currentValue:"Current value",date:"Date",datePickerKeyboardHelp:"Use arrow keys to change values; press Alt+Down Arrow to open the calendar.",day:"Day",incompleteDate:"Enter a valid date.",dropFileHere:"Drop file here or click to browse",decrement:"Decrement",dropFilesHere:"Drop files here or click to browse",empty:"Empty",endDate:"End date",error:"Error",enterFullscreen:"Enter fullscreen",exitFullscreen:"Exit fullscreen",goToSlide:(e,t)=>`Go to slide ${e} of ${t}`,hidePassword:"Hide password",increment:"Increment",loading:"Loading",month:"Month",moreOptions:"More Options",mute:"Mute",nextDecade:"Next decade",nextMonth:"Next month",nextSlide:"Next slide",nextVideo:"Next Video",nextYear:"Next year",numCharacters:e=>e===1?"1 character":`${e} characters`,numCharactersRemaining:e=>e===1?"1 character remaining":`${e} characters remaining`,numOptionsSelected:e=>e===0?"No options selected":e===1?"1 option selected":`${e} options selected`,pause:"Pause",pauseAnimation:"Pause animation",pictureInPicture:"Picture in picture",play:"Play",playbackSpeed:"Playback speed",playlist:"Playlist",playAnimation:"Play animation",previousDecade:"Previous decade",previousMonth:"Previous month",previousSlide:"Previous slide",previousVideo:"Previous video",previousYear:"Previous year",progress:"Progress",rangeTooLong:e=>e===1?"Select a range no longer than 1 day":`Select a range no longer than ${e} days`,rangeTooShort:e=>e===1?"Select a range at least 1 day long":`Select a range at least ${e} days long`,readonly:"Read-only",selected:"Selected",selectedDateLabel:e=>`Selected: ${e}`,selectedRangeLabel:e=>`Selected range: ${e}`,selectionCleared:"Selection cleared",remove:"Remove",resize:"Resize",scrollableRegion:"Scrollable region",scrollToEnd:"Scroll to end",scrollToStart:"Scroll to start",selectAColorFromTheScreen:"Select a color from the screen",showPassword:"Show password",slideNum:e=>`Slide ${e}`,startDate:"Start date",today:"Today",toggleColorFormat:"Toggle color format",seek:"Seek",seekProgress:(e,t)=>`${e} of ${t}`,currentlyPlaying:"currently playing",unmute:"Unmute",videoPlayer:"Video player",volume:"Volume",year:"Year",zoomIn:"Zoom in",zoomOut:"Zoom out",am:"AM",chooseTime:"Choose time",closeTimeInput:"Close time picker",dayPeriod:"AM/PM",hour:"Hour",minute:"Minute",now:"Now",pm:"PM",second:"Second",time:"Time",timeInputKeyboardHelp:"Use arrow keys to change values; press Alt+Down Arrow to open the time picker."};qr(Ds);var zs=Ds;var Re=class extends Ao{lang(){return this.host.didSSR&&!this.host.hasUpdated?this.host.lang||"en":super.lang()}};qr(zs);var fr={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},mr=e=>(...t)=>({_$litDirective$:e,values:t}),vt=class{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,r,o){this._$Ct=t,this._$AM=r,this._$Ci=o}_$AS(t,r){return this.update(t,r)}update(t,r){return this.render(...r)}};var ee=mr(class extends vt{constructor(e){if(super(e),e.type!==fr.ATTRIBUTE||e.name!=="class"||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return" "+Object.keys(e).filter(t=>e[t]).join(" ")+" "}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(" ").split(/\s/).filter(o=>o!=="")));for(let o in t)t[o]&&!this.nt?.has(o)&&this.st.add(o);return this.render(t)}let r=e.element.classList;for(let o of this.st)o in t||(r.remove(o),this.st.delete(o));for(let o in t){let i=!!t[o];i===this.st.has(o)||this.nt?.has(o)||(i?(r.add(o),this.st.add(o)):(r.remove(o),this.st.delete(o)))}return or}});var Ne=class extends Q{constructor(){super(...arguments),this.localize=new Re(this),this.hasSlotController=new dr(this,"footer","header-actions","label"),this.open=!1,this.label="",this.withoutHeader=!1,this.lightDismiss=!1,this.withFooter=!1,this.handleDocumentKeyDown=e=>{e.key==="Escape"&&this.open&&bt(this)&&(e.preventDefault(),e.stopPropagation(),this.requestClose(this.dialog))}}firstUpdated(){this.open&&(this.addOpenListeners(),this.dialog.showModal(),ir(this))}disconnectedCallback(){super.disconnectedCallback(),nr(this),this.removeOpenListeners()}async requestClose(e){let t=new sr({source:e});if(this.dispatchEvent(t),t.defaultPrevented){this.open=!0,Fe(this.dialog,"pulse");return}this.removeOpenListeners(),await Fe(this.dialog,"hide"),this.open=!1,this.dialog.close(),nr(this);let r=this.originalTrigger;typeof r?.focus=="function"&&setTimeout(()=>r.focus()),this.dispatchEvent(new ur)}addOpenListeners(){document.addEventListener("keydown",this.handleDocumentKeyDown),cr(this)}removeOpenListeners(){document.removeEventListener("keydown",this.handleDocumentKeyDown),Ft(this)}handleDialogCancel(e){e.preventDefault(),!this.dialog.classList.contains("hide")&&e.target===this.dialog&&bt(this)&&this.requestClose(this.dialog)}handleDialogClick(e){let r=e.target.closest('[data-dialog="close"]');r&&(e.stopPropagation(),this.requestClose(r))}async handleDialogPointerDown(e){e.target===this.dialog&&(this.lightDismiss?this.requestClose(this.dialog):await Fe(this.dialog,"pulse"))}handleOpenChange(){this.open&&!this.dialog.open?this.show():!this.open&&this.dialog.open&&(this.open=!0,this.requestClose(this.dialog))}async show(){let e=new ar;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.originalTrigger=document.activeElement,this.open=!0,this.dialog.showModal(),ir(this),requestAnimationFrame(()=>{let t=this.querySelector("[autofocus]");t&&typeof t.focus=="function"?t.focus():this.dialog.focus()}),await Fe(this.dialog,"show"),this.dispatchEvent(new lr)}render(){let e=!this.withoutHeader,t=this.hasSlotController.test("footer","withFooter");return C`
      <dialog
        part="dialog"
        class=${ee({dialog:!0,open:this.open})}
        @cancel=${this.handleDialogCancel}
        @click=${this.handleDialogClick}
        @pointerdown=${this.handleDialogPointerDown}
      >
        ${e?C`
              <header part="header" class="header">
                <h2 part="title" class="title" id="title">
                  <!-- If there's no label, use an invisible character to prevent the header from collapsing -->
                  <slot name="label"> ${this.label.length>0?this.label:"\u200B"} </slot>
                </h2>
                <div part="header-actions" class="header-actions">
                  <slot name="header-actions"></slot>
                  <wa-button
                    part="close-button"
                    exportparts="base:close-button__base"
                    class="close"
                    appearance="plain"
                    @click="${r=>this.requestClose(r.target)}"
                  >
                    <wa-icon
                      name="xmark"
                      label=${this.localize.term("close")}
                      library="system"
                      variant="solid"
                    ></wa-icon>
                  </wa-button>
                </div>
              </header>
            `:""}

        <div part="body" class="body"><slot></slot></div>

        <!-- Use a hidden element so we still get "slotchange" events. -->
        <footer part="footer" class="footer" ?hidden=${!t}>
          <slot name="footer"></slot>
        </footer>
      </dialog>
    `}};Ne.css=ks;v([Te(".dialog")],Ne.prototype,"dialog",2);v([w({type:Boolean,reflect:!0})],Ne.prototype,"open",2);v([w({reflect:!0})],Ne.prototype,"label",2);v([w({attribute:"without-header",type:Boolean,reflect:!0})],Ne.prototype,"withoutHeader",2);v([w({attribute:"light-dismiss",type:Boolean})],Ne.prototype,"lightDismiss",2);v([w({attribute:"with-footer",type:Boolean})],Ne.prototype,"withFooter",2);v([se("open",{waitUntilFirstUpdate:!0})],Ne.prototype,"handleOpenChange",1);Ne=v([ue("wa-dialog")],Ne);document.addEventListener("click",e=>{let t=e.target.closest("[data-dialog]");if(t instanceof Element){let[r,o]=Eo(t.getAttribute("data-dialog")||"");if(r==="open"&&o?.length){let n=t.getRootNode().getElementById(o);n?.localName==="wa-dialog"?n.open=!0:console.warn(`A dialog with an ID of "${o}" could not be found in this document.`)}}}),document.addEventListener("pointerdown",()=>{});var Ms=()=>({checkValidity(e){let t=e.input,r={message:"",isValid:!0,invalidKeys:[]};if(!t)return r;let o=!0;if("checkValidity"in t&&(o=t.checkValidity()),o)return r;if(r.isValid=!1,"validationMessage"in t&&(r.message=t.validationMessage),!("validity"in t))return r.invalidKeys.push("customError"),r;for(let i in t.validity){if(i==="valid")continue;let n=i;t.validity[n]&&r.invalidKeys.push(n)}return r}});var _o=class extends Event{constructor(){super("wa-invalid",{bubbles:!0,cancelable:!1,composed:!0})}};var v0=()=>({observedAttributes:["custom-error"],checkValidity(e){let t={message:"",isValid:!0,invalidKeys:[]};return e.customError&&(t.message=e.customError,t.isValid=!1,t.invalidKeys=["customError"]),t}}),Xe=class extends Q{constructor(){super(),this.name=null,this.disabled=!1,this.required=!1,this.assumeInteractionOn=["input"],this.validators=[],this.valueHasChanged=!1,this.hasInteracted=!1,this.customError=null,this.emittedEvents=[],this.emitInvalid=e=>{e.target===this&&(this.hasInteracted=!0,this.dispatchEvent(new _o))},this.handleInteraction=e=>{let t=this.emittedEvents;t.includes(e.type)||t.push(e.type),t.length===this.assumeInteractionOn?.length&&(this.hasInteracted=!0)},"addEventListener"in this&&this.addEventListener("invalid",this.emitInvalid)}static get validators(){return[v0()]}static get observedAttributes(){let e=new Set(super.observedAttributes||[]);for(let t of this.validators)if(t.observedAttributes)for(let r of t.observedAttributes)e.add(r);return[...e]}connectedCallback(){super.connectedCallback(),this.didSSR&&!this.hasUpdated?this.updateComplete.then(()=>{this.updateValidity()}):this.updateValidity(),this.assumeInteractionOn.forEach(e=>{this.addEventListener?.(e,this.handleInteraction)})}firstUpdated(...e){super.firstUpdated(...e),this.updateValidity()}willUpdate(e){if(!!1&&e.has("customError")&&(this.customError||(this.customError=null),this.setCustomValidity(this.customError||"")),e.has("value")||e.has("disabled")||e.has("defaultValue")){let t=this.value;this.updateFormValue(t)}e.has("disabled")&&(this.customStates.set("disabled",this.disabled),(this.hasAttribute("disabled")||!!1&&!this.matches(":disabled"))&&this.toggleAttribute("disabled",this.disabled)),super.willUpdate(e),this.didSSR&&!this.hasUpdated?this.updateComplete.then(()=>this.updateValidity()):this.updateValidity()}updateFormValue(e){if(Array.isArray(e)){if(this.name){let t=new FormData;for(let r of e)t.append(this.name,r);this.setValue(t,t)}}else this.setValue(e,e)}get labels(){return this.internals.labels}getForm(){return this.internals.form}set form(e){e?this.setAttribute("form",e):this.removeAttribute("form")}get form(){return this.internals.form}get validity(){return this.internals.validity}get willValidate(){return this.internals.willValidate}get validationMessage(){return this.internals.validationMessage}checkValidity(){return this.updateValidity(),this.internals.checkValidity()}reportValidity(){return this.updateValidity(),this.hasInteracted=!0,this.internals.reportValidity()}get validationTarget(){return this.input||void 0}setValidity(...e){let t=e[0],r=e[1],o=e[2];o||(o=this.validationTarget),this.internals.setValidity(t,r,o||void 0),this.requestUpdate("validity"),this.setCustomStates()}setCustomStates(){let e=!!this.required,t=this.internals.validity.valid,r=this.hasInteracted;this.customStates.set("required",e),this.customStates.set("optional",!e),this.customStates.set("invalid",!t),this.customStates.set("valid",t),this.customStates.set("user-invalid",!t&&r),this.customStates.set("user-valid",t&&r)}setCustomValidity(e){if(!e){this.customError=null,this.setValidity({});return}this.customError=e,this.setValidity({customError:!0},e,this.validationTarget)}formResetCallback(){this.resetValidity(),this.hasInteracted=!1,this.valueHasChanged=!1,this.emittedEvents=[],this.updateValidity()}formDisabledCallback(e){this.disabled=e,this.updateValidity()}formStateRestoreCallback(e,t){this.didSSR&&!this.hasUpdated?this.updateComplete.then(()=>{this.value=e,t==="restore"&&this.resetValidity(),this.updateValidity()}):(this.value=e,t==="restore"&&this.resetValidity(),this.updateValidity())}setValue(...e){let[t,r]=e;this.internals.setFormValue(t,r)}get allValidators(){let e=this.constructor.validators||[],t=this.validators||[];return[...e,...t]}resetValidity(){this.setCustomValidity(""),this.setValidity({})}updateValidity(){if(this.disabled||this.hasAttribute("disabled")||!this.willValidate){this.resetValidity();return}let e=this.allValidators;if(!e?.length)return;let t={customError:!!this.customError},r=this.validationTarget||this.input||void 0,o="";for(let i of e){let{isValid:n,message:a,invalidKeys:s}=i.checkValidity(this);n||(o||(o=a),s?.length>=0&&s.forEach(l=>t[l]=!0))}o||(o=this.validationMessage),this.setValidity(t,o,r)}};Xe.formAssociated=!0;v([w({reflect:!0})],Xe.prototype,"name",2);v([w({type:Boolean})],Xe.prototype,"disabled",2);v([w({state:!0,attribute:!1})],Xe.prototype,"valueHasChanged",2);v([w({state:!0,attribute:!1})],Xe.prototype,"hasInteracted",2);v([w({attribute:"custom-error",reflect:!0})],Xe.prototype,"customError",2);v([w({attribute:!1,state:!0,type:Object})],Xe.prototype,"validity",1);var Rs={small:"s",medium:"m",large:"l"},Ps=new Set;function So(e,t){t in Rs&&!Ps.has(`${e}:${t}`)&&(Ps.add(`${e}:${t}`),console.warn(`[${e}] size="${t}" is deprecated. Use size="${Rs[t]}" instead. The long-form value will be removed in the next major version.`))}var Fo=W`
  :host([size='xs']) {
    font-size: var(--wa-font-size-xs);
  }

  :host([size='s']),
  :host([size='small']) {
    font-size: var(--wa-font-size-s);
  }

  :host([size='m']),
  :host([size='medium']) {
    font-size: var(--wa-font-size-m);
  }

  :host([size='l']),
  :host([size='large']) {
    font-size: var(--wa-font-size-l);
  }

  :host([size='xl']) {
    font-size: var(--wa-font-size-xl);
  }
`;var Os=W`
  @layer wa-component {
    :host {
      display: inline-block;

      /* Workaround because Chrome doesn't like :host(:has()) below
       * https://issues.chromium.org/issues/40062355
       * Firefox doesn't like this nested rule, so both are needed */
      &:has(wa-badge) {
        position: relative;
      }
    }

    /* Apply relative positioning only when needed to position wa-badge
     * This avoids creating a new stacking context for every button */
    :host(:has(wa-badge)) {
      position: relative;
    }
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    user-select: none;
    -webkit-user-select: none;
    white-space: nowrap;
    vertical-align: middle;
    transition-property: background, border, box-shadow, color, opacity, transform;
    transition-duration: var(--wa-transition-fast);
    transition-timing-function: var(--wa-transition-easing);
    transform-origin: center;
    cursor: pointer;
    padding: 0 var(--wa-form-control-padding-inline);
    font-family: inherit;
    font-size: inherit;
    font-weight: var(--wa-font-weight-action);
    height: var(--wa-form-control-height);
    width: 100%;

    background-color: var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud));

    border-color: transparent;
    color: var(--wa-color-on-loud, var(--wa-color-neutral-on-loud));
    border-start-start-radius: var(--_button-start-start-radius, var(--wa-form-control-border-radius));
    border-start-end-radius: var(--_button-start-end-radius, var(--wa-form-control-border-radius));
    border-end-start-radius: var(--_button-end-start-radius, var(--wa-form-control-border-radius));
    border-end-end-radius: var(--_button-end-end-radius, var(--wa-form-control-border-radius));
    border-style: var(--wa-form-control-border-style);
    border-width: var(--wa-form-control-border-width);
  }

  /* Hover and active transforms */
  .button:not(.disabled):not(.loading) {
    @media (hover: hover) {
      &:hover {
        transform: var(--wa-button-transform-hover);
      }
    }
    &:active {
      transform: var(--wa-button-transform-active);
    }

    @media (prefers-reduced-motion: reduce) {
      &:hover,
      &:active {
        transform: none;
      }
    }
  }

  /* Appearance modifiers */
  :host([appearance='plain']) {
    /* Indentation overrides for grouping */
    margin-inline-start: var(--_button-horizontal-indent);
    margin-block-start: var(--_button-vertical-indent);

    .button {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: transparent;
      border-color: transparent;
    }
    @media (hover: hover) {
      .button:not(.disabled):not(.loading):hover {
        color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
        background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      }
    }
    .button:not(.disabled):not(.loading):active {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: color-mix(
        in oklab,
        var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet)),
        var(--wa-color-mix-active)
      );
    }
  }

  :host([appearance='outlined']) {
    /* Indentation overrides for grouping outlined */
    margin-inline-start: var(--_button-horizontal-indent-outlined);
    margin-block-start: var(--_button-vertical-indent-outlined);

    .button {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: transparent;
      border-color: var(--wa-color-border-loud, var(--wa-color-neutral-border-loud));
    }
    @media (hover: hover) {
      .button:not(.disabled):not(.loading):hover {
        color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
        background-color: var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet));
      }
    }
    .button:not(.disabled):not(.loading):active {
      color: var(--wa-color-on-quiet, var(--wa-color-neutral-on-quiet));
      background-color: color-mix(
        in oklab,
        var(--wa-color-fill-quiet, var(--wa-color-neutral-fill-quiet)),
        var(--wa-color-mix-active)
      );
    }
  }

  :host([appearance='filled']) {
    /* Indentation overrides for grouping */
    margin-inline-start: var(--_button-horizontal-indent);
    margin-block-start: var(--_button-vertical-indent);

    .button {
      color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
      background-color: var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal));
      border-color: transparent;
    }
    @media (hover: hover) {
      .button:not(.disabled):not(.loading):hover {
        color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
        background-color: color-mix(
          in oklab,
          var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)),
          var(--wa-color-mix-hover)
        );
      }
    }
    .button:not(.disabled):not(.loading):active {
      color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
      background-color: color-mix(
        in oklab,
        var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)),
        var(--wa-color-mix-active)
      );
    }
  }

  :host([appearance='filled-outlined']) {
    /* Indentation overrides for grouping outlined */
    margin-inline-start: var(--_button-horizontal-indent-outlined);
    margin-block-start: var(--_button-vertical-indent-outlined);

    .button {
      color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
      background-color: var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal));
      border-color: var(--wa-color-border-normal, var(--wa-color-neutral-border-normal));
    }
    @media (hover: hover) {
      .button:not(.disabled):not(.loading):hover {
        color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
        background-color: color-mix(
          in oklab,
          var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)),
          var(--wa-color-mix-hover)
        );
      }
    }
    .button:not(.disabled):not(.loading):active {
      color: var(--wa-color-on-normal, var(--wa-color-neutral-on-normal));
      background-color: color-mix(
        in oklab,
        var(--wa-color-fill-normal, var(--wa-color-neutral-fill-normal)),
        var(--wa-color-mix-active)
      );
    }
  }

  :host([appearance='accent']) {
    /* Indentation overrides for grouping */
    margin-inline-start: var(--_button-horizontal-indent);
    margin-block-start: var(--_button-vertical-indent);

    .button {
      color: var(--wa-color-on-loud, var(--wa-color-neutral-on-loud));
      background-color: var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud));
      border-color: transparent;
    }
    @media (hover: hover) {
      .button:not(.disabled):not(.loading):hover {
        background-color: color-mix(
          in oklab,
          var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud)),
          var(--wa-color-mix-hover)
        );
      }
    }
    .button:not(.disabled):not(.loading):active {
      background-color: color-mix(
        in oklab,
        var(--wa-color-fill-loud, var(--wa-color-neutral-fill-loud)),
        var(--wa-color-mix-active)
      );
    }
  }

  /* Focus states */
  .button:focus {
    outline: none;
  }

  .button:focus-visible {
    outline: var(--wa-focus-ring);
    outline-offset: var(--wa-focus-ring-offset);
  }

  /* Disabled state */
  :host([disabled]) {
    opacity: 0.5;
    cursor: not-allowed;

    /* When disabled, prevent mouse events from bubbling up from children */
    .button {
      pointer-events: none;
    }
  }

  /* Keep it last so Safari doesn't stop parsing this block */
  .button::-moz-focus-inner {
    border: 0;
  }

  /* Icon buttons */
  .button.is-icon-button {
    outline-offset: 2px;
    width: var(--wa-form-control-height);
    aspect-ratio: 1;
  }

  /* Icon buttons with a caret need to grow to fit both the icon and the caret */
  .button.is-icon-button.caret {
    width: auto;
    aspect-ratio: auto;
    min-width: var(--wa-form-control-height);
  }

  /* Pill modifier */
  :host([pill]) .button {
    border-start-start-radius: var(--_button-start-start-radius, var(--wa-border-radius-pill));
    border-start-end-radius: var(--_button-start-end-radius, var(--wa-border-radius-pill));
    border-end-start-radius: var(--_button-end-start-radius, var(--wa-border-radius-pill));
    border-end-end-radius: var(--_button-end-end-radius, var(--wa-border-radius-pill));
  }

  /*
   * Label
   */

  .start,
  .end {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    pointer-events: none;
  }

  .label {
    display: inline-block;
  }

  .is-icon-button .label {
    display: flex;
    justify-content: center;
  }

  .label::slotted(wa-icon) {
    align-self: center;
  }

  /*
   * Caret modifier
   */

  wa-icon[part='caret'] {
    display: flex;
    align-self: center;
    align-items: center;

    &::part(svg) {
      width: 0.875em;
      height: 0.875em;
    }

    .button:has(&) .end {
      display: none;
    }
  }

  /*
   * Loading modifier
   */

  .loading {
    position: relative;
    cursor: wait;

    .start,
    .label,
    .end,
    .caret {
      visibility: hidden;
    }

    wa-spinner {
      --indicator-color: currentColor;
      --track-color: color-mix(in oklab, currentColor, transparent 90%);

      position: absolute;
      font-size: 1em;
      height: 1em;
      width: 1em;
      top: calc(50% - 0.5em);
      left: calc(50% - 0.5em);
    }
  }

  /*
   * Badges
   */

  .button ::slotted(wa-badge) {
    border-color: var(--wa-color-surface-default);
    position: absolute;
    inset-block-start: 0;
    inset-inline-end: 0;
    translate: 50% -50%;
    pointer-events: none;
  }

  :host(:dir(rtl)) ::slotted(wa-badge) {
    translate: -50% -50%;
  }

  /*
  * Button spacing
  */

  slot[name='start']::slotted(*) {
    margin-inline-end: 0.75em;
  }

  slot[name='end']::slotted(*),
  .button:not(.visually-hidden-label) [part='caret'] {
    margin-inline-start: 0.75em;
  }
`;var Lo=W`
  :where(:root),
  .wa-neutral,
  :host([variant='neutral']) {
    --wa-color-fill-loud: var(--wa-color-neutral-fill-loud);
    --wa-color-fill-normal: var(--wa-color-neutral-fill-normal);
    --wa-color-fill-quiet: var(--wa-color-neutral-fill-quiet);
    --wa-color-border-loud: var(--wa-color-neutral-border-loud);
    --wa-color-border-normal: var(--wa-color-neutral-border-normal);
    --wa-color-border-quiet: var(--wa-color-neutral-border-quiet);
    --wa-color-on-loud: var(--wa-color-neutral-on-loud);
    --wa-color-on-normal: var(--wa-color-neutral-on-normal);
    --wa-color-on-quiet: var(--wa-color-neutral-on-quiet);
  }

  .wa-brand,
  :host([variant='brand']) {
    --wa-color-fill-loud: var(--wa-color-brand-fill-loud);
    --wa-color-fill-normal: var(--wa-color-brand-fill-normal);
    --wa-color-fill-quiet: var(--wa-color-brand-fill-quiet);
    --wa-color-border-loud: var(--wa-color-brand-border-loud);
    --wa-color-border-normal: var(--wa-color-brand-border-normal);
    --wa-color-border-quiet: var(--wa-color-brand-border-quiet);
    --wa-color-on-loud: var(--wa-color-brand-on-loud);
    --wa-color-on-normal: var(--wa-color-brand-on-normal);
    --wa-color-on-quiet: var(--wa-color-brand-on-quiet);
  }

  .wa-success,
  :host([variant='success']) {
    --wa-color-fill-loud: var(--wa-color-success-fill-loud);
    --wa-color-fill-normal: var(--wa-color-success-fill-normal);
    --wa-color-fill-quiet: var(--wa-color-success-fill-quiet);
    --wa-color-border-loud: var(--wa-color-success-border-loud);
    --wa-color-border-normal: var(--wa-color-success-border-normal);
    --wa-color-border-quiet: var(--wa-color-success-border-quiet);
    --wa-color-on-loud: var(--wa-color-success-on-loud);
    --wa-color-on-normal: var(--wa-color-success-on-normal);
    --wa-color-on-quiet: var(--wa-color-success-on-quiet);
  }

  .wa-warning,
  :host([variant='warning']) {
    --wa-color-fill-loud: var(--wa-color-warning-fill-loud);
    --wa-color-fill-normal: var(--wa-color-warning-fill-normal);
    --wa-color-fill-quiet: var(--wa-color-warning-fill-quiet);
    --wa-color-border-loud: var(--wa-color-warning-border-loud);
    --wa-color-border-normal: var(--wa-color-warning-border-normal);
    --wa-color-border-quiet: var(--wa-color-warning-border-quiet);
    --wa-color-on-loud: var(--wa-color-warning-on-loud);
    --wa-color-on-normal: var(--wa-color-warning-on-normal);
    --wa-color-on-quiet: var(--wa-color-warning-on-quiet);
  }

  .wa-danger,
  :host([variant='danger']) {
    --wa-color-fill-loud: var(--wa-color-danger-fill-loud);
    --wa-color-fill-normal: var(--wa-color-danger-fill-normal);
    --wa-color-fill-quiet: var(--wa-color-danger-fill-quiet);
    --wa-color-border-loud: var(--wa-color-danger-border-loud);
    --wa-color-border-normal: var(--wa-color-danger-border-normal);
    --wa-color-border-quiet: var(--wa-color-danger-border-quiet);
    --wa-color-on-loud: var(--wa-color-danger-on-loud);
    --wa-color-on-normal: var(--wa-color-danger-on-normal);
    --wa-color-on-quiet: var(--wa-color-danger-on-quiet);
  }
`;var Le=e=>e??R;var Bs=Symbol.for(""),x0=e=>{if(e?.r===Bs)return e?._$litStatic$};var ji=(e,...t)=>({_$litStatic$:t.reduce((r,o,i)=>r+(n=>{if(n._$litStatic$!==void 0)return n._$litStatic$;throw Error(`Value passed to 'literal' function must be a 'literal' result: ${n}. Use 'unsafeStatic' to pass non-literal values, but
            take care to ensure page security.`)})(o)+e[i+1],e[0]),r:Bs}),Is=new Map,Ui=e=>(t,...r)=>{let o=r.length,i,n,a=[],s=[],l,u=0,c=!1;for(;u<o;){for(l=t[u];u<o&&(n=r[u],(i=x0(n))!==void 0);)l+=i+t[++u],c=!0;u!==o&&s.push(n),a.push(l),u++}if(u===o&&a.push(t[o]),c){let p=a.join("$$lit$$");(t=Is.get(p))===void 0&&(a.raw=a,Is.set(p,t=a)),r=s}return e(t,...r)},Do=Ui(C),j1=Ui(vs),U1=Ui(xs);var $=class extends Xe{constructor(){super(...arguments),this.assumeInteractionOn=["click"],this.hasSlotController=new dr(this,"[default]","start","end"),this.localize=new Re(this),this.invalid=!1,this.isIconButton=!1,this.title="",this.variant="neutral",this.appearance="accent",this.size="m",this.withCaret=!1,this.withStart=!1,this.withEnd=!1,this.disabled=!1,this.loading=!1,this.pill=!1,this.type="button"}static get validators(){return[...super.validators,Ms()]}handleSizeChange(){So(this.localName,this.size)}constructLightDOMButton(){let e=document.createElement("button");for(let t of this.attributes)t.name!=="style"&&e.setAttribute(t.name,t.value);return e.type=this.type,e.style.position="absolute !important",e.style.width="0 !important",e.style.height="0 !important",e.style.clipPath="inset(50%) !important",e.style.overflow="hidden !important",e.style.whiteSpace="nowrap !important",this.name&&(e.name=this.name),e.value=this.value||"",e}handleClick(e){if(this.disabled||this.loading){e.preventDefault(),e.stopImmediatePropagation();return}if(this.type!=="submit"&&this.type!=="reset"||!this.getForm())return;let r=this.constructLightDOMButton();this.parentElement?.append(r),r.click(),r.remove()}handleInvalid(){this.dispatchEvent(new _o)}handleLabelSlotChange(){let e=this.labelSlot.assignedNodes({flatten:!0}),t=!1,r=!1,o=!1,i=!1;[...e].forEach(n=>{if(n.nodeType===Node.ELEMENT_NODE){let a=n;a.localName==="wa-icon"?(r=!0,t||(t=a.label!==void 0)):i=!0}else n.nodeType===Node.TEXT_NODE&&(n.textContent?.trim()||"").length>0&&(o=!0)}),this.isIconButton=r&&!o&&!i,this.customStates.set("icon-button",this.isIconButton),this.isIconButton&&!t&&console.warn('Icon buttons must have a label for screen readers. Add <wa-icon label="..."> to remove this warning.',this)}isButton(){return!this.href}isLink(){return!!this.href}handleDisabledChange(){this.customStates.set("disabled",this.disabled),this.updateValidity()}handleHrefChange(){this.customStates.set("link",this.isLink())}handleLoadingChange(){this.customStates.set("loading",this.loading)}setValue(...e){}click(){this.button.click()}focus(e){this.button.focus(e)}blur(){this.button.blur()}render(){let e=this.isLink(),t=e?ji`a`:ji`button`;return Do`
      <${t}
        part="base"
        class=${ee({button:!0,caret:this.withCaret,disabled:this.disabled,loading:this.loading,rtl:this.localize.dir()==="rtl","has-label":this.hasSlotController.test("[default]"),"has-start":this.hasSlotController.test("start","withStart"),"has-end":this.hasSlotController.test("end","withEnd"),"is-icon-button":this.isIconButton})}
        ?disabled=${Le(e?void 0:this.disabled)}
        type=${Le(e?void 0:this.type)}
        title=${this.title}
        name=${Le(e?void 0:this.name)}
        value=${Le(e?void 0:this.value)}
        href=${Le(e?this.href:void 0)}
        target=${Le(e?this.target:void 0)}
        download=${Le(e?this.download:void 0)}
        rel=${Le(e&&this.rel?this.rel:void 0)}
        role=${Le(e?void 0:"button")}
        aria-disabled=${Le(e&&this.disabled?"true":void 0)}
        tabindex=${this.disabled?"-1":"0"}
        @invalid=${this.isButton()?this.handleInvalid:null}
        @click=${this.handleClick}
      >
        <slot name="start" part="start" class="start"></slot>
        <slot part="label" class="label" @slotchange=${this.handleLabelSlotChange}></slot>
        <slot name="end" part="end" class="end"></slot>
        ${this.withCaret?Do`
                <wa-icon part="caret" class="caret" library="system" name="chevron-down" variant="solid"></wa-icon>
              `:""}
        ${this.loading?Do`<wa-spinner part="spinner"></wa-spinner>`:""}
      </${t}>
    `}};$.shadowRootOptions={...Xe.shadowRootOptions,delegatesFocus:!0};$.css=[Os,Lo,Fo];v([Te(".button")],$.prototype,"button",2);v([Te("slot:not([name])")],$.prototype,"labelSlot",2);v([Lt()],$.prototype,"invalid",2);v([Lt()],$.prototype,"isIconButton",2);v([w()],$.prototype,"title",2);v([w({reflect:!0})],$.prototype,"variant",2);v([w({reflect:!0})],$.prototype,"appearance",2);v([w({reflect:!0})],$.prototype,"size",2);v([se("size")],$.prototype,"handleSizeChange",1);v([w({attribute:"with-caret",type:Boolean,reflect:!0})],$.prototype,"withCaret",2);v([w({attribute:"with-start",type:Boolean})],$.prototype,"withStart",2);v([w({attribute:"with-end",type:Boolean})],$.prototype,"withEnd",2);v([w({type:Boolean})],$.prototype,"disabled",2);v([w({type:Boolean,reflect:!0})],$.prototype,"loading",2);v([w({type:Boolean,reflect:!0})],$.prototype,"pill",2);v([w()],$.prototype,"type",2);v([w({reflect:!0})],$.prototype,"name",2);v([w({reflect:!0})],$.prototype,"value",2);v([w({reflect:!0})],$.prototype,"href",2);v([w()],$.prototype,"target",2);v([w()],$.prototype,"rel",2);v([w()],$.prototype,"download",2);v([w({attribute:"formaction"})],$.prototype,"formAction",2);v([w({attribute:"formenctype"})],$.prototype,"formEnctype",2);v([w({attribute:"formmethod"})],$.prototype,"formMethod",2);v([w({attribute:"formnovalidate",type:Boolean})],$.prototype,"formNoValidate",2);v([w({attribute:"formtarget"})],$.prototype,"formTarget",2);v([se("disabled",{waitUntilFirstUpdate:!0})],$.prototype,"handleDisabledChange",1);v([se("href")],$.prototype,"handleHrefChange",1);v([se("loading",{waitUntilFirstUpdate:!0})],$.prototype,"handleLoadingChange",1);$=v([ue("wa-button")],$);$.disableWarning?.("change-in-update");var $s=W`
  :host {
    --track-width: 2px;
    --track-color: var(--wa-color-neutral-fill-normal);
    --indicator-color: var(--wa-color-brand-fill-loud);
    --speed: 2s;
    --size: 1em;

    /*
      Resizing a spinner element using anything but font-size will break the animation because the animation uses em
      units. Therefore, if a spinner is used in a flex container without \`flex: none\` applied, the spinner can
      grow/shrink and break the animation. The use of \`flex: none\` on the host element prevents this by always having
      the spinner sized according to its actual dimensions.
    */
    flex: none;
    display: inline-flex;
    width: var(--size);
    height: var(--size);
  }

  svg {
    width: 100%;
    height: 100%;
    aspect-ratio: 1;
    animation: spin var(--speed) linear infinite;
  }

  .track,
  .indicator {
    --radius: calc(var(--size) / 2 - var(--track-width) / 2);
    --circumference: calc(var(--radius) * 2 * 3.141592654);

    cx: calc(var(--size) / 2);
    cy: calc(var(--size) / 2);
    r: var(--radius);
    fill: none;
    stroke-width: var(--track-width);
  }

  .track {
    stroke: var(--track-color);
  }

  .indicator {
    stroke: var(--indicator-color);
    stroke-linecap: round;
    stroke-dasharray: calc(0.597 * var(--circumference)), calc(0.796 * var(--circumference));
    stroke-dashoffset: calc(-0.04 * var(--circumference));
    animation: dash 1.5s ease-in-out infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dasharray: calc(0.008 * var(--circumference)), calc(1.194 * var(--circumference));
      stroke-dashoffset: 0;
    }
    50% {
      stroke-dasharray: calc(0.716 * var(--circumference)), calc(1.194 * var(--circumference));
      stroke-dashoffset: calc(-0.278 * var(--circumference));
    }
    100% {
      stroke-dasharray: calc(0.716 * var(--circumference)), calc(1.194 * var(--circumference));
      stroke-dashoffset: calc(-0.987 * var(--circumference));
    }
  }
`;var Hi=class extends Q{constructor(){super(...arguments),this.localize=new Re(this)}render(){return C`
      <svg
        part="base"
        role="progressbar"
        aria-label=${this.localize.term("loading")}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle class="track" />
        <circle class="indicator" />
      </svg>
    `}};Hi.css=$s;Hi=v([ue("wa-spinner")],Hi);var Ns=class extends Event{constructor(){super("wa-error",{bubbles:!0,cancelable:!1,composed:!0})}};var qs=class extends Event{constructor(){super("wa-load",{bubbles:!0,cancelable:!1,composed:!0})}};var js=W`
  :host {
    --primary-color: currentColor;
    --primary-opacity: 1;
    --secondary-color: currentColor;
    --secondary-opacity: 0.4;
    --rotate-angle: 0deg;

    box-sizing: content-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: -0.125em;
  }

  /* #region Canvas — the box the icon is centered within (mirrors Font Awesome's icon canvas). Orthogonal to font-size. */

  /* Fixed width (default): 1.25em × 1em (20 × 16px) */
  :host(:not([canvas])),
  :host([canvas='fixed']) {
    width: 1.25em;
    height: 1em;
    min-width: 1.25em; /* <-- this is what Safari respects for intrinsic */
    min-height: 1em;
  }

  /* Auto: hug the icon's width. \`auto-width\` is the deprecated alias for canvas="auto". */
  :host([canvas='auto']),
  :host([auto-width]:not([canvas])) {
    width: auto;
    height: 1em;
  }

  /* Square: 1.25em × 1.25em (20 × 20px) */
  :host([canvas='square']) {
    width: 1.25em;
    height: 1.25em;
    min-width: 1.25em;
    min-height: 1.25em;
  }

  /* Roomy: 1.5em × 1.5em (24 × 24px) */
  :host([canvas='roomy']) {
    width: 1.5em;
    height: 1.5em;
    min-width: 1.5em;
    min-height: 1.5em;
  }

  /* #endregion */

  svg {
    fill: currentColor;
    height: 1em;
    overflow: visible;
    width: auto;

    /* Duotone colors with path-specific opacity fallback */
    path[data-duotone-primary] {
      color: var(--primary-color);
      opacity: var(--path-opacity, var(--primary-opacity));
    }

    path[data-duotone-secondary] {
      color: var(--secondary-color);
      opacity: var(--path-opacity, var(--secondary-opacity));
    }
  }

  /* Rotation */
  :host([rotate]) {
    transform: rotate(var(--rotate-angle, 0deg));
  }

  /* Flipping */
  :host([flip='x']) {
    transform: scaleX(-1);
  }
  :host([flip='y']) {
    transform: scaleY(-1);
  }
  :host([flip='both']) {
    transform: scale(-1, -1);
  }

  /* Rotation and Flipping combined */
  :host([rotate][flip='x']) {
    transform: rotate(var(--rotate-angle, 0deg)) scaleX(-1);
  }
  :host([rotate][flip='y']) {
    transform: rotate(var(--rotate-angle, 0deg)) scaleY(-1);
  }
  :host([rotate][flip='both']) {
    transform: rotate(var(--rotate-angle, 0deg)) scale(-1, -1);
  }

  /* #region Animations — ported from Font Awesome 7.3 (--fa-* props mapped to wa-icon's --* names) */

  :host([animation='beat']) {
    animation-name: beat;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='bounce']) {
    animation-name: bounce;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, cubic-bezier(0.28, 0.84, 0.42, 1));
  }

  :host([animation='fade']) {
    animation-name: fade;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='beat-fade']) {
    animation-name: beat-fade;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='flip']) {
    animation-name: flip;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1.5s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='flip-360']) {
    animation-name: flip-360;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='shake']) {
    animation-name: shake;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 0.75s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
  }

  :host([animation='spin']) {
    animation-name: spin;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 2s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='spin-pulse']) {
    animation-name: spin;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, steps(8));
  }

  /* spin-reverse is FA's reverse modifier expressed as a standalone value; reverse any spin via --animation-direction: reverse */
  :host([animation='spin-reverse']) {
    animation-name: spin;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, reverse);
    animation-duration: var(--animation-duration, 2s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='spin-snap']) {
    animation-name: spin-snap;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 3s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='spin-snap-4']) {
    animation-name: spin-snap-4;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 2.4s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='spin-snap-8']) {
    animation-name: spin-snap-8;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 4s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='buzz']) {
    animation-name: buzz;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 0.6s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, linear);
  }

  :host([animation='wag']) {
    animation-name: wag;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 0.9s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-out);
    transform-origin: bottom center;
  }

  :host([animation='float']) {
    animation-name: float;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 3s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-in-out);
    will-change: transform;
  }

  :host([animation='swing']) {
    animation-name: swing;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 1.2s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-out);
    transform-origin: top center;
  }

  :host([animation='jello']) {
    animation-name: jello;
    animation-delay: var(--animation-delay, 0s);
    animation-direction: var(--animation-direction, normal);
    animation-duration: var(--animation-duration, 0.9s);
    animation-iteration-count: var(--animation-iteration-count, infinite);
    animation-timing-function: var(--animation-timing, ease-out);
  }

  @media (prefers-reduced-motion: reduce) {
    :host([animation='beat']),
    :host([animation='bounce']),
    :host([animation='fade']),
    :host([animation='beat-fade']),
    :host([animation='flip']),
    :host([animation='flip-360']),
    :host([animation='shake']),
    :host([animation='spin']),
    :host([animation='spin-pulse']),
    :host([animation='spin-reverse']),
    :host([animation='spin-snap']),
    :host([animation='spin-snap-4']),
    :host([animation='spin-snap-8']),
    :host([animation='buzz']),
    :host([animation='wag']),
    :host([animation='float']),
    :host([animation='swing']),
    :host([animation='jello']) {
      animation: none !important;
      transition: none !important;
    }
  }

  /* #endregion */

  /* #region Keyframes — ported verbatim from Font Awesome 7.3 */

  @keyframes beat {
    0% {
      transform: scale(1);
    }
    25% {
      transform: scale(calc(1.25 * var(--beat-scale, 1.25)));
    }
    45% {
      transform: scale(calc(1.22 * var(--beat-scale, 1.22)));
    }
    65% {
      transform: scale(calc(1.25 * var(--beat-scale, 1.25)));
    }
    90% {
      transform: scale(1);
    }
  }

  @keyframes bounce {
    0% {
      transform: scale(1, 1) translateY(0);
      /* No fallback by design (ported from FA 7.3): the first segment uses the user's --animation-timing or the CSS
         initial ease, while the explicit cubic-beziers on later stops drive the bounce physics. */
      animation-timing-function: var(--animation-timing);
    }
    14% {
      transform: scale(var(--bounce-start-scale-x, 1.06), var(--bounce-start-scale-y, 0.94))
        translateY(var(--bounce-anticipation, 3px));
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
    }
    32% {
      transform: scale(var(--bounce-jump-scale-x, 0.94), var(--bounce-jump-scale-y, 1.12))
        translateY(calc(-1 * var(--bounce-height, 0.5em)));
      animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
    }
    52% {
      transform: scale(1, 1) translateY(calc(-1 * var(--bounce-height, 0.5em) * 1.1));
      animation-timing-function: cubic-bezier(0.5, 0, 1, 0.5);
    }
    70% {
      transform: scale(var(--bounce-land-scale-x, 1.06), var(--bounce-land-scale-y, 0.92)) translateY(0);
      animation-timing-function: cubic-bezier(0.33, 0.33, 0.66, 1);
    }
    85% {
      transform: scale(0.98, 1.04) translateY(calc(-2px * var(--bounce-rebound, 1)));
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
    }
    100% {
      transform: scale(1, 1) translateY(0);
    }
  }

  @keyframes fade {
    0% {
      opacity: 1;
      transform: scale(1);
      animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
    }
    40% {
      opacity: var(--fade-opacity, 0.4);
      transform: scale(0.98);
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes beat-fade {
    0% {
      opacity: var(--beat-fade-opacity, 0.4);
      transform: scale(1);
      animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
    }
    25% {
      opacity: calc(var(--beat-fade-opacity, 0.4) + 0.4);
      transform: scale(var(--beat-fade-scale, 1.28));
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    45% {
      opacity: 1;
      transform: scale(var(--beat-fade-scale, 1.25));
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    65% {
      opacity: calc(var(--beat-fade-opacity, 0.4) + 0.4);
      transform: scale(var(--beat-fade-scale, 1.28));
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    100% {
      opacity: var(--beat-fade-opacity, 0.4);
      transform: scale(1);
    }
  }

  @keyframes flip {
    0% {
      transform: perspective(2em) scale(1) rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), 0deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
    }
    8% {
      transform: perspective(2em) scale(var(--flip-anticipation-scale, 0.95))
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), 0deg);
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
    }
    35% {
      transform: perspective(2em) scale(1)
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), calc(var(--flip-angle, -360deg) * 0.6));
      animation-timing-function: linear;
    }
    65% {
      transform: perspective(2em) scale(1)
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), calc(var(--flip-angle, -360deg) * 0.5));
      animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
    }
    92% {
      transform: perspective(2em) scale(1)
        rotate3d(
          var(--flip-x, 0),
          var(--flip-y, 1),
          var(--flip-z, 0),
          calc(var(--flip-angle, -360deg) * var(--flip-overshoot, 1.04))
        );
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
    }
    100% {
      transform: perspective(2em) scale(1)
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), var(--flip-angle, -360deg));
    }
  }

  @keyframes flip-360 {
    0% {
      transform: perspective(2em) scale(1) rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), 0deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.4, 1);
    }
    8% {
      transform: perspective(2em) scale(var(--flip-anticipation-scale, 0.95))
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), 0deg);
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
    }
    50% {
      transform: perspective(2em) scale(1)
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), calc(var(--flip-angle, -360deg) * 0.6));
      animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
    }
    80% {
      transform: perspective(2em) scale(1)
        rotate3d(
          var(--flip-x, 0),
          var(--flip-y, 1),
          var(--flip-z, 0),
          calc(var(--flip-angle, -360deg) * var(--flip-overshoot, 1.04))
        );
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
    }
    100% {
      transform: perspective(2em) scale(1)
        rotate3d(var(--flip-x, 0), var(--flip-y, 1), var(--flip-z, 0), var(--flip-angle, -360deg));
    }
  }

  @keyframes shake {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);
    }
    8% {
      transform: rotate(35deg) translateX(1px);
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    20% {
      transform: rotate(-22deg) translateX(-1px);
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    35% {
      transform: rotate(15deg) translateX(1px);
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    50% {
      transform: rotate(-9deg);
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    65% {
      transform: rotate(5deg);
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    78% {
      transform: rotate(-3deg);
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    90% {
      transform: rotate(1deg);
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes spin-snap {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    12% {
      transform: rotate(60deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    16.67% {
      transform: rotate(60deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    28.67% {
      transform: rotate(120deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    33.33% {
      transform: rotate(120deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    45.33% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    62% {
      transform: rotate(240deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    66.67% {
      transform: rotate(240deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    78.67% {
      transform: rotate(300deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    83.33% {
      transform: rotate(300deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    95.33% {
      transform: rotate(360deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes spin-snap-4 {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    15% {
      transform: rotate(90deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    25% {
      transform: rotate(90deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    40% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    65% {
      transform: rotate(270deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    75% {
      transform: rotate(270deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    90% {
      transform: rotate(360deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes spin-snap-8 {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    9% {
      transform: rotate(45deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    12.5% {
      transform: rotate(45deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    21.5% {
      transform: rotate(90deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    25% {
      transform: rotate(90deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    34% {
      transform: rotate(135deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    37.5% {
      transform: rotate(135deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    46.5% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
      transform: rotate(180deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    59% {
      transform: rotate(225deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    62.5% {
      transform: rotate(225deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    71.5% {
      transform: rotate(270deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    75% {
      transform: rotate(270deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    84% {
      transform: rotate(315deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    87.5% {
      transform: rotate(315deg);
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
    96.5% {
      transform: rotate(360deg);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes buzz {
    0% {
      transform: translateX(0) rotate(0deg);
      animation-timing-function: cubic-bezier(0.1, 0, 0.9, 1);
    }
    5% {
      transform: translateX(var(--buzz-distance, 4px)) rotate(0.5deg);
    }
    10% {
      transform: translateX(calc(-1 * var(--buzz-distance, 4px))) rotate(-0.5deg);
    }
    15% {
      transform: translateX(var(--buzz-distance, 4px)) rotate(0.3deg);
    }
    20% {
      transform: translateX(calc(-1 * var(--buzz-distance, 4px))) rotate(-0.3deg);
    }
    25% {
      transform: translateX(calc(var(--buzz-distance, 4px) * 0.7)) rotate(0.2deg);
    }
    30% {
      transform: translateX(calc(-1 * var(--buzz-distance, 4px) * 0.7)) rotate(-0.2deg);
    }
    35% {
      transform: translateX(calc(var(--buzz-distance, 4px) * 0.4)) rotate(0.1deg);
    }
    40% {
      transform: translateX(0) rotate(0deg);
    }
    100% {
      transform: translateX(0) rotate(0deg);
    }
  }

  @keyframes wag {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);
    }
    12% {
      transform: rotate(var(--wag-angle, 12deg));
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    24% {
      transform: rotate(2deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);
    }
    36% {
      transform: rotate(calc(var(--wag-angle, 12deg) * 0.85));
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    48% {
      transform: rotate(1deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.6, 1);
    }
    58% {
      transform: rotate(calc(var(--wag-angle, 12deg) * 0.6));
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    68% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  @keyframes float {
    0% {
      transform: translateY(0) translateX(0) rotate(0deg)
        scale(var(--float-squash-x, 1.02), var(--float-squash-y, 0.98));
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
    }
    15% {
      transform: translateY(calc(-0.4 * var(--float-height, 6px))) translateX(var(--float-drift, 1px))
        rotate(var(--float-tilt, 1deg)) scale(1, 1);
      animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
    }
    35% {
      transform: translateY(calc(-1 * var(--float-height, 6px))) translateX(0) rotate(0deg)
        scale(var(--float-stretch-x, 0.98), var(--float-stretch-y, 1.03));
      animation-timing-function: cubic-bezier(0.5, 0, 0.5, 0);
    }
    50% {
      transform: translateY(calc(-0.92 * var(--float-height, 6px))) translateX(calc(-0.5 * var(--float-drift, 1px)))
        rotate(calc(-0.5 * var(--float-tilt, 1deg))) scale(0.995, 1.01);
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 0.33);
    }
    70% {
      transform: translateY(calc(-0.3 * var(--float-height, 6px))) translateX(calc(-1 * var(--float-drift, 1px)))
        rotate(calc(-1 * var(--float-tilt, 1deg))) scale(1, 1);
      animation-timing-function: cubic-bezier(0.33, 0.66, 0.66, 1);
    }
    90% {
      transform: translateY(calc(0.05 * var(--float-height, 6px))) translateX(0) rotate(0deg)
        scale(var(--float-squash-x, 1.02), var(--float-squash-y, 0.98));
      animation-timing-function: cubic-bezier(0.33, 0, 0.66, 1);
    }
    100% {
      transform: translateY(0) translateX(0) rotate(0deg)
        scale(var(--float-squash-x, 1.02), var(--float-squash-y, 0.98));
    }
  }

  @keyframes swing {
    0% {
      transform: rotate(0deg);
      animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);
    }
    8% {
      transform: rotate(var(--swing-angle, 22deg));
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    18% {
      transform: rotate(calc(-1 * var(--swing-angle, 22deg) * 0.85));
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    28% {
      transform: rotate(calc(var(--swing-angle, 22deg) * 0.65));
      animation-timing-function: cubic-bezier(0.35, 0, 0.65, 1);
    }
    38% {
      transform: rotate(calc(-1 * var(--swing-angle, 22deg) * 0.45));
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    48% {
      transform: rotate(calc(var(--swing-angle, 22deg) * 0.25));
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    56% {
      transform: rotate(calc(-1 * var(--swing-angle, 22deg) * 0.1));
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    64% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  @keyframes jello {
    0% {
      transform: scale(1, 1);
      animation-timing-function: cubic-bezier(0.2, 0, 0.8, 1);
    }
    12% {
      transform: scale(var(--jello-scale-x, 1.15), calc(2 - var(--jello-scale-x, 1.15)));
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    24% {
      transform: scale(calc(2 - var(--jello-scale-y, 1.12)), var(--jello-scale-y, 1.12));
      animation-timing-function: cubic-bezier(0.3, 0, 0.7, 1);
    }
    36% {
      transform: scale(
        calc(1 + (var(--jello-scale-x, 1.15) - 1) * 0.5),
        calc(2 - (1 + (var(--jello-scale-x, 1.15) - 1) * 0.5))
      );
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    48% {
      transform: scale(
        calc(2 - (1 + (var(--jello-scale-y, 1.12) - 1) * 0.3)),
        calc(1 + (var(--jello-scale-y, 1.12) - 1) * 0.3)
      );
      animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
    }
    58% {
      transform: scale(1.02, 0.98);
      animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    68% {
      transform: scale(1, 1);
    }
    100% {
      transform: scale(1, 1);
    }
  }

  /* #endregion */
`;var w0="",Vi="";function Us(){return w0.replace(/\/$/,"")}function y0(e){Vi=e}function Hs(){if(!Vi){let e=document.querySelector("[data-fa-kit-code]");e&&y0(e.getAttribute("data-fa-kit-code")||"")}return Vi}var Vs="7.3.0";function k0(e,t,r){let o="solid";return t==="chisel"&&(o="chisel-regular"),t==="etch"&&(o="etch-solid"),t==="graphite"&&(o="graphite-thin"),t==="jelly"&&(o="jelly-regular",r==="duo-regular"&&(o="jelly-duo-regular"),r==="fill-regular"&&(o="jelly-fill-regular")),t==="jelly-duo"&&(o="jelly-duo-regular"),t==="jelly-fill"&&(o="jelly-fill-regular"),t==="notdog"&&(r==="solid"&&(o="notdog-solid"),r==="duo-solid"&&(o="notdog-duo-solid")),t==="notdog-duo"&&(o="notdog-duo-solid"),t==="slab"&&((r==="solid"||r==="regular")&&(o="slab-regular"),r==="press-regular"&&(o="slab-press-regular")),t==="slab-press"&&(o="slab-press-regular"),t==="slab-duo"&&(o="slab-duo-regular"),t==="slab-press-duo"&&(o="slab-press-duo-regular"),t==="thumbprint"&&(o="thumbprint-light"),t==="utility"&&(o="utility-semibold"),t==="utility-duo"&&(o="utility-duo-semibold"),t==="utility-fill"&&(o="utility-fill-semibold"),t==="whiteboard"&&(o="whiteboard-semibold"),t==="mosaic"&&(o="mosaic-solid"),t==="pixel"&&(o="pixel-regular"),t==="vellum"&&(o="vellum-solid"),t==="classic"&&(r==="thin"&&(o="thin"),r==="light"&&(o="light"),r==="regular"&&(o="regular"),r==="solid"&&(o="solid")),t==="duotone"&&(r==="thin"&&(o="duotone-thin"),r==="light"&&(o="duotone-light"),r==="regular"&&(o="duotone-regular"),r==="solid"&&(o="duotone")),t==="sharp"&&(r==="thin"&&(o="sharp-thin"),r==="light"&&(o="sharp-light"),r==="regular"&&(o="sharp-regular"),r==="solid"&&(o="sharp-solid")),t==="sharp-duotone"&&(r==="thin"&&(o="sharp-duotone-thin"),r==="light"&&(o="sharp-duotone-light"),r==="regular"&&(o="sharp-duotone-regular"),r==="solid"&&(o="sharp-duotone-solid")),t==="brands"&&(o="brands"),o}function C0(e,t,r){let o=k0(e,t,r),i=Us();if(i)return`${i}/${o}/${e}.svg`;let n=Hs();return n.length>0?`https://ka-p.fontawesome.com/releases/v${Vs}/svgs/${o}/${e}.svg?token=${encodeURIComponent(n)}`:`https://ka-f.fontawesome.com/releases/v${Vs}/svgs/${o}/${e}.svg`}var E0={name:"default",resolver:(e,t="classic",r="solid")=>C0(e,t,r),mutator:(e,t)=>{if(t?.family&&!e.hasAttribute("data-duotone-initialized")){let{family:r,variant:o}=t;if(r==="duotone"||r==="sharp-duotone"||r==="notdog-duo"||r==="notdog"&&o==="duo-solid"||r==="jelly-duo"||r==="jelly"&&o==="duo-regular"||r==="utility-duo"||r==="slab-duo"||r==="slab-press-duo"||r==="thumbprint"){let i=[...e.querySelectorAll("path")],n=i.find(s=>!s.hasAttribute("opacity")),a=i.find(s=>s.hasAttribute("opacity"));if(!n||!a)return;if(n.setAttribute("data-duotone-primary",""),a.setAttribute("data-duotone-secondary",""),t.swapOpacity&&n&&a){let s=a.getAttribute("opacity")||"0.4";n.style.setProperty("--path-opacity",s),a.style.setProperty("--path-opacity","1")}e.setAttribute("data-duotone-initialized","")}}}},Ws=E0;function T0(e){return`data:image/svg+xml,${encodeURIComponent(e)}`}var Wi={solid:{backward:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M236.3 107.1C247.9 96 265 92.9 279.7 99.2C294.4 105.5 304 120 304 136L304 272.3L476.3 107.2C487.9 96 505 92.9 519.7 99.2C534.4 105.5 544 120 544 136L544 504C544 520 534.4 534.5 519.7 540.8C505 547.1 487.9 544 476.3 532.9L304 367.7L304 504C304 520 294.4 534.5 279.7 540.8C265 547.1 247.9 544 236.3 532.9L44.3 348.9C36.5 341.3 32 330.9 32 320C32 309.1 36.5 298.7 44.3 291.1L236.3 107.1z"/></svg>',"backward-step":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M491 100.8C478.1 93.8 462.3 94.5 450 102.6L192 272.1L192 128C192 110.3 177.7 96 160 96C142.3 96 128 110.3 128 128L128 512C128 529.7 142.3 544 160 544C177.7 544 192 529.7 192 512L192 367.9L450 537.5C462.3 545.6 478 546.3 491 539.3C504 532.3 512 518.8 512 504.1L512 136.1C512 121.4 503.9 107.9 491 100.9z"/></svg>',check:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M434.8 70.1c14.3 10.4 17.5 30.4 7.1 44.7l-256 352c-5.5 7.6-14 12.3-23.4 13.1s-18.5-2.7-25.1-9.3l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l101.5 101.5 234-321.7c10.4-14.3 30.4-17.5 44.7-7.1z"/></svg>',"chevron-down":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M201.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 338.7 54.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>',"chevron-left":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg>',"chevron-right":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M311.1 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L243.2 256 73.9 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>',circle:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"/></svg>',"closed-captioning":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M64 192C64 156.7 92.7 128 128 128L512 128C547.3 128 576 156.7 576 192L576 448C576 483.3 547.3 512 512 512L128 512C92.7 512 64 483.3 64 448L64 192zM216 272L248 272C252.4 272 256 275.6 256 280C256 293.3 266.7 304 280 304C293.3 304 304 293.3 304 280C304 249.1 278.9 224 248 224L216 224C185.1 224 160 249.1 160 280L160 360C160 390.9 185.1 416 216 416L248 416C278.9 416 304 390.9 304 360C304 346.7 293.3 336 280 336C266.7 336 256 346.7 256 360C256 364.4 252.4 368 248 368L216 368C211.6 368 208 364.4 208 360L208 280C208 275.6 211.6 272 216 272zM384 280C384 275.6 387.6 272 392 272L424 272C428.4 272 432 275.6 432 280C432 293.3 442.7 304 456 304C469.3 304 480 293.3 480 280C480 249.1 454.9 224 424 224L392 224C361.1 224 336 249.1 336 280L336 360C336 390.9 361.1 416 392 416L424 416C454.9 416 480 390.9 480 360C480 346.7 469.3 336 456 336C442.7 336 432 346.7 432 360C432 364.4 428.4 368 424 368L392 368C387.6 368 384 364.4 384 360L384 280z"/></svg>',"closed-captioning-slash":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M39 39.1C48.4 29.7 63.6 29.7 72.9 39.1L161.8 128L512 128C547.3 128 576 156.7 576 192L576 448C576 473.5 561.1 495.4 539.6 505.8L601 567.1C610.4 576.5 610.4 591.7 601 601C591.6 610.3 576.4 610.4 567.1 601L39 73.1C29.7 63.7 29.7 48.5 39 39.1zM384 350.1L384 279.9C384 275.5 387.6 271.9 392 271.9L424 271.9C428.4 271.9 432 275.5 432 279.9C432 293.2 442.7 303.9 456 303.9C469.3 303.9 480 293.2 480 279.9C480 249 454.9 223.9 424 223.9L392 223.9C361.1 223.9 336 249 336 279.9L336 302.1L384 350.1zM445.5 411.6C465.7 403.2 480 383.2 480 359.9C480 346.6 469.3 335.9 456 335.9C442.7 335.9 432 346.6 432 359.9C432 364.3 428.4 367.9 424 367.9L401.8 367.9L445.5 411.6zM162.3 264.1C160.8 269.1 160 274.5 160 280L160 360C160 390.9 185.1 416 216 416L248 416C266.1 416 282.1 407.5 292.4 394.2L410.2 512L128 512C92.7 512 64 483.3 64 448L64 192C64 184.2 65.4 176.7 68 169.8L162.3 264.1zM256.1 357.9C256 358.6 256 359.3 256 360C256 364.4 252.4 368 248 368L216 368C211.6 368 208 364.4 208 360L208 309.8L256.1 357.9z"/></svg>',compress:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M160 64c0-17.7-14.3-32-32-32S96 46.3 96 64l0 64-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l96 0c17.7 0 32-14.3 32-32l0-96zM32 320c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0 0 64c0 17.7 14.3 32 32 32s32-14.3 32-32l0-96c0-17.7-14.3-32-32-32l-96 0zM352 64c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0 0-64zM320 320c-17.7 0-32 14.3-32 32l0 96c0 17.7 14.3 32 32 32s32-14.3 32-32l0-64 64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0z"/></svg>',"ellipsis-vertical":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M320 208C289.1 208 264 182.9 264 152C264 121.1 289.1 96 320 96C350.9 96 376 121.1 376 152C376 182.9 350.9 208 320 208zM320 432C350.9 432 376 457.1 376 488C376 518.9 350.9 544 320 544C289.1 544 264 518.9 264 488C264 457.1 289.1 432 320 432zM376 320C376 350.9 350.9 376 320 376C289.1 376 264 350.9 264 320C264 289.1 289.1 264 320 264C350.9 264 376 289.1 376 320z"/></svg>',expand:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 96C110.3 96 96 110.3 96 128L96 224C96 241.7 110.3 256 128 256C145.7 256 160 241.7 160 224L160 160L224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L128 96zM160 416C160 398.3 145.7 384 128 384C110.3 384 96 398.3 96 416L96 512C96 529.7 110.3 544 128 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480L160 416zM416 96C398.3 96 384 110.3 384 128C384 145.7 398.3 160 416 160L480 160L480 224C480 241.7 494.3 256 512 256C529.7 256 544 241.7 544 224L544 128C544 110.3 529.7 96 512 96L416 96zM544 416C544 398.3 529.7 384 512 384C494.3 384 480 398.3 480 416L480 480L416 480C398.3 480 384 494.3 384 512C384 529.7 398.3 544 416 544L512 544C529.7 544 544 529.7 544 512L544 416z"/></svg>',eyedropper:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M341.6 29.2l-101.6 101.6-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4 101.6-101.6c39-39 39-102.2 0-141.1s-102.2-39-141.1 0zM55.4 323.3c-15 15-23.4 35.4-23.4 56.6l0 42.4-26.6 39.9c-8.5 12.7-6.8 29.6 4 40.4s27.7 12.5 40.4 4l39.9-26.6 42.4 0c21.2 0 41.6-8.4 56.6-23.4l109.4-109.4-45.3-45.3-109.4 109.4c-3 3-7.1 4.7-11.3 4.7l-36.1 0 0-36.1c0-4.2 1.7-8.3 4.7-11.3l109.4-109.4-45.3-45.3-109.4 109.4z"/></svg>',forward:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M403.7 107.1C392.1 96 375 92.9 360.3 99.2C345.6 105.5 336 120 336 136L336 272.3L163.7 107.2C152.1 96 135 92.9 120.3 99.2C105.6 105.5 96 120 96 136L96 504C96 520 105.6 534.5 120.3 540.8C135 547.1 152.1 544 163.7 532.9L336 367.7L336 504C336 520 345.6 534.5 360.3 540.8C375 547.1 392.1 544 403.7 532.9L595.7 348.9C603.6 341.4 608 330.9 608 320C608 309.1 603.5 298.7 595.7 291.1L403.7 107.1z"/></svg>',file:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M192 64C156.7 64 128 92.7 128 128L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 234.5C512 217.5 505.3 201.2 493.3 189.2L386.7 82.7C374.7 70.7 358.5 64 341.5 64L192 64zM453.5 240L360 240C346.7 240 336 229.3 336 216L336 122.5L453.5 240z"/></svg>',"file-audio":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM389.8 307.7C380.7 301.4 368.3 303.6 362 312.7C355.7 321.8 357.9 334.2 367 340.5C390.9 357.2 406.4 384.8 406.4 416C406.4 447.2 390.8 474.9 367 491.5C357.9 497.8 355.7 510.3 362 519.3C368.3 528.3 380.8 530.6 389.8 524.3C423.9 500.5 446.4 460.8 446.4 416C446.4 371.2 424 331.5 389.8 307.7zM208 376C199.2 376 192 383.2 192 392L192 440C192 448.8 199.2 456 208 456L232 456L259.2 490C262.2 493.8 266.8 496 271.7 496L272 496C280.8 496 288 488.8 288 480L288 352C288 343.2 280.8 336 272 336L271.7 336C266.8 336 262.2 338.2 259.2 342L232 376L208 376zM336 448.2C336 458.9 346.5 466.4 354.9 459.8C367.8 449.5 376 433.7 376 416C376 398.3 367.8 382.5 354.9 372.2C346.5 365.5 336 373.1 336 383.8L336 448.3z"/></svg>',"file-code":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM282.2 359.6C290.8 349.5 289.7 334.4 279.6 325.8C269.5 317.2 254.4 318.3 245.8 328.4L197.8 384.4C190.1 393.4 190.1 406.6 197.8 415.6L245.8 471.6C254.4 481.7 269.6 482.8 279.6 474.2C289.6 465.6 290.8 450.4 282.2 440.4L247.6 400L282.2 359.6zM394.2 328.4C385.6 318.3 370.4 317.2 360.4 325.8C350.4 334.4 349.2 349.6 357.8 359.6L392.4 400L357.8 440.4C349.2 450.5 350.3 465.6 360.4 474.2C370.5 482.8 385.6 481.7 394.2 471.6L442.2 415.6C449.9 406.6 449.9 393.4 442.2 384.4L394.2 328.4z"/></svg>',"file-excel":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM292 330.7C284.6 319.7 269.7 316.7 258.7 324C247.7 331.3 244.7 346.3 252 357.3L291.2 416L252 474.7C244.6 485.7 247.6 500.6 258.7 508C269.8 515.4 284.6 512.4 292 501.3L320 459.3L348 501.3C355.4 512.3 370.3 515.3 381.3 508C392.3 500.7 395.3 485.7 388 474.7L348.8 416L388 357.3C395.4 346.3 392.4 331.4 381.3 324C370.2 316.6 355.4 319.6 348 330.7L320 372.7L292 330.7z"/></svg>',"file-image":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM256 320C256 302.3 241.7 288 224 288C206.3 288 192 302.3 192 320C192 337.7 206.3 352 224 352C241.7 352 256 337.7 256 320zM220.6 512L419.4 512C435.2 512 448 499.2 448 483.4C448 476.1 445.2 469 440.1 463.7L343.3 361.9C337.3 355.6 328.9 352 320.1 352L319.8 352C311 352 302.7 355.6 296.6 361.9L199.9 463.7C194.8 469 192 476.1 192 483.4C192 499.2 204.8 512 220.6 512z"/></svg>',"file-pdf":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 64C92.7 64 64 92.7 64 128L64 512C64 547.3 92.7 576 128 576L208 576L208 464C208 428.7 236.7 400 272 400L448 400L448 234.5C448 217.5 441.3 201.2 429.3 189.2L322.7 82.7C310.7 70.7 294.5 64 277.5 64L128 64zM389.5 240L296 240C282.7 240 272 229.3 272 216L272 122.5L389.5 240zM272 444C261 444 252 453 252 464L252 592C252 603 261 612 272 612C283 612 292 603 292 592L292 564L304 564C337.1 564 364 537.1 364 504C364 470.9 337.1 444 304 444L272 444zM304 524L292 524L292 484L304 484C315 484 324 493 324 504C324 515 315 524 304 524zM400 444C389 444 380 453 380 464L380 592C380 603 389 612 400 612L432 612C460.7 612 484 588.7 484 560L484 496C484 467.3 460.7 444 432 444L400 444zM420 572L420 484L432 484C438.6 484 444 489.4 444 496L444 560C444 566.6 438.6 572 432 572L420 572zM508 464L508 592C508 603 517 612 528 612C539 612 548 603 548 592L548 548L576 548C587 548 596 539 596 528C596 517 587 508 576 508L548 508L548 484L576 484C587 484 596 475 596 464C596 453 587 444 576 444L528 444C517 444 508 453 508 464z"/></svg>',"file-powerpoint":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM280 320C266.7 320 256 330.7 256 344L256 488C256 501.3 266.7 512 280 512C293.3 512 304 501.3 304 488L304 464L328 464C367.8 464 400 431.8 400 392C400 352.2 367.8 320 328 320L280 320zM328 416L304 416L304 368L328 368C341.3 368 352 378.7 352 392C352 405.3 341.3 416 328 416z"/></svg>',"file-video":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM208 368L208 464C208 481.7 222.3 496 240 496L336 496C353.7 496 368 481.7 368 464L368 440L403 475C406.2 478.2 410.5 480 415 480C424.4 480 432 472.4 432 463L432 368.9C432 359.5 424.4 351.9 415 351.9C410.5 351.9 406.2 353.7 403 356.9L368 391.9L368 367.9C368 350.2 353.7 335.9 336 335.9L240 335.9C222.3 335.9 208 350.2 208 367.9z"/></svg>',"file-word":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM263.4 338.8C260.5 325.9 247.7 317.7 234.8 320.6C221.9 323.5 213.7 336.3 216.6 349.2L248.6 493.2C250.9 503.7 260 511.4 270.8 512C281.6 512.6 291.4 505.9 294.8 495.6L320 419.9L345.2 495.6C348.6 505.8 358.4 512.5 369.2 512C380 511.5 389.1 503.8 391.4 493.2L423.4 349.2C426.3 336.3 418.1 323.4 405.2 320.6C392.3 317.8 379.4 325.9 376.6 338.8L363.4 398.2L342.8 336.4C339.5 326.6 330.4 320 320 320C309.6 320 300.5 326.6 297.2 336.4L276.6 398.2L263.4 338.8z"/></svg>',"file-zipper":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M128 128C128 92.7 156.7 64 192 64L341.5 64C358.5 64 374.8 70.7 386.8 82.7L493.3 189.3C505.3 201.3 512 217.6 512 234.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128zM336 122.5L336 216C336 229.3 346.7 240 360 240L453.5 240L336 122.5zM192 136C192 149.3 202.7 160 216 160L264 160C277.3 160 288 149.3 288 136C288 122.7 277.3 112 264 112L216 112C202.7 112 192 122.7 192 136zM192 232C192 245.3 202.7 256 216 256L264 256C277.3 256 288 245.3 288 232C288 218.7 277.3 208 264 208L216 208C202.7 208 192 218.7 192 232zM256 304L224 304C206.3 304 192 318.3 192 336L192 384C192 410.5 213.5 432 240 432C266.5 432 288 410.5 288 384L288 336C288 318.3 273.7 304 256 304zM240 368C248.8 368 256 375.2 256 384C256 392.8 248.8 400 240 400C231.2 400 224 392.8 224 384C224 375.2 231.2 368 240 368z"/></svg>',"forward-step":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M21 36.8c12.9-7 28.7-6.3 41 1.8L320 208.1 320 64c0-17.7 14.3-32 32-32s32 14.3 32 32l0 384c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-144.1-258 169.6c-12.3 8.1-28 8.8-41 1.8S0 454.7 0 440L0 72C0 57.3 8.1 43.8 21 36.8z"/></svg>',gauge:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm320 96c0-26.9-16.5-49.9-40-59.3L280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 172.7c-23.5 9.5-40 32.5-40 59.3 0 35.3 28.7 64 64 64s64-28.7 64-64zM144 176a32 32 0 1 0 0-64 32 32 0 1 0 0 64zm-16 80a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zm288 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64zM400 144a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/></svg>',gear:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M259.1 73.5C262.1 58.7 275.2 48 290.4 48L350.2 48C365.4 48 378.5 58.7 381.5 73.5L396 143.5C410.1 149.5 423.3 157.2 435.3 166.3L503.1 143.8C517.5 139 533.3 145 540.9 158.2L570.8 210C578.4 223.2 575.7 239.8 564.3 249.9L511 297.3C511.9 304.7 512.3 312.3 512.3 320C512.3 327.7 511.8 335.3 511 342.7L564.4 390.2C575.8 400.3 578.4 417 570.9 430.1L541 481.9C533.4 495 517.6 501.1 503.2 496.3L435.4 473.8C423.3 482.9 410.1 490.5 396.1 496.6L381.7 566.5C378.6 581.4 365.5 592 350.4 592L290.6 592C275.4 592 262.3 581.3 259.3 566.5L244.9 496.6C230.8 490.6 217.7 482.9 205.6 473.8L137.5 496.3C123.1 501.1 107.3 495.1 99.7 481.9L69.8 430.1C62.2 416.9 64.9 400.3 76.3 390.2L129.7 342.7C128.8 335.3 128.4 327.7 128.4 320C128.4 312.3 128.9 304.7 129.7 297.3L76.3 249.8C64.9 239.7 62.3 223 69.8 209.9L99.7 158.1C107.3 144.9 123.1 138.9 137.5 143.7L205.3 166.2C217.4 157.1 230.6 149.5 244.6 143.4L259.1 73.5zM320.3 400C364.5 399.8 400.2 363.9 400 319.7C399.8 275.5 363.9 239.8 319.7 240C275.5 240.2 239.8 276.1 240 320.3C240.2 364.5 276.1 400.2 320.3 400z"/></svg>',"grip-vertical":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M128 40c0-22.1-17.9-40-40-40L40 0C17.9 0 0 17.9 0 40L0 88c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM0 424l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 40c0-22.1-17.9-40-40-40L232 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48zM192 232l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM320 424c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40l48 0c22.1 0 40-17.9 40-40l0-48z"/></svg>',indeterminate:'<svg part="indeterminate-icon" class="icon" viewBox="0 0 16 16"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" stroke-linecap="round"><g stroke="currentColor" stroke-width="2"><g transform="translate(2.285714 6.857143)"><path d="M10.2857143,1.14285714 L1.14285714,1.14285714"/></g></g></g></svg>',minus:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32z"/></svg>',pause:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M48 32C21.5 32 0 53.5 0 80L0 432c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48L48 32zm224 0c-26.5 0-48 21.5-48 48l0 352c0 26.5 21.5 48 48 48l64 0c26.5 0 48-21.5 48-48l0-352c0-26.5-21.5-48-48-48l-64 0z"/></svg>',"picture-in-picture":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M448 32c35.3 0 64 28.7 64 64l0 112-64 0 0-112-384 0 0 320 144 0 0 64-144 0-6.5-.3c-30.1-3.1-54.1-27-57.1-57.1L0 416 0 96C0 62.9 25.2 35.6 57.5 32.3L64 32 448 32zm16 224c26.5 0 48 21.5 48 48l0 128c0 26.5-21.5 48-48 48l-160 0c-26.5 0-48-21.5-48-48l0-128c0-26.5 21.5-48 48-48l160 0z"/></svg>',play:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M91.2 36.9c-12.4-6.8-27.4-6.5-39.6 .7S32 57.9 32 72l0 368c0 14.1 7.5 27.2 19.6 34.4s27.2 7.5 39.6 .7l336-184c12.8-7 20.8-20.5 20.8-35.1s-8-28.1-20.8-35.1l-336-184z"/></svg>',"play-circle":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zM188.3 147.1c-7.6 4.2-12.3 12.3-12.3 20.9l0 176c0 8.7 4.7 16.7 12.3 20.9s16.8 4.1 24.3-.5l144-88c7.1-4.4 11.5-12.1 11.5-20.5s-4.4-16.1-11.5-20.5l-144-88c-7.4-4.5-16.7-4.7-24.3-.5z"/></svg>',plus:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M352 128C352 110.3 337.7 96 320 96C302.3 96 288 110.3 288 128L288 288L128 288C110.3 288 96 302.3 96 320C96 337.7 110.3 352 128 352L288 352L288 512C288 529.7 302.3 544 320 544C337.7 544 352 529.7 352 512L352 352L512 352C529.7 352 544 337.7 544 320C544 302.3 529.7 288 512 288L352 288L352 128z"/></svg>',star:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M309.5-18.9c-4.1-8-12.4-13.1-21.4-13.1s-17.3 5.1-21.4 13.1L193.1 125.3 33.2 150.7c-8.9 1.4-16.3 7.7-19.1 16.3s-.5 18 5.8 24.4l114.4 114.5-25.2 159.9c-1.4 8.9 2.3 17.9 9.6 23.2s16.9 6.1 25 2L288.1 417.6 432.4 491c8 4.1 17.7 3.3 25-2s11-14.2 9.6-23.2L441.7 305.9 556.1 191.4c6.4-6.4 8.6-15.8 5.8-24.4s-10.1-14.9-19.1-16.3L383 125.3 309.5-18.9z"/></svg>',upload:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free 7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M352 173.3L352 384C352 401.7 337.7 416 320 416C302.3 416 288 401.7 288 384L288 173.3L246.6 214.7C234.1 227.2 213.8 227.2 201.3 214.7C188.8 202.2 188.8 181.9 201.3 169.4L297.3 73.4C309.8 60.9 330.1 60.9 342.6 73.4L438.6 169.4C451.1 181.9 451.1 202.2 438.6 214.7C426.1 227.2 405.8 227.2 393.3 214.7L352 173.3zM320 464C364.2 464 400 428.2 400 384L480 384C515.3 384 544 412.7 544 448L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 448C96 412.7 124.7 384 160 384L240 384C240 428.2 275.8 464 320 464zM464 488C477.3 488 488 477.3 488 464C488 450.7 477.3 440 464 440C450.7 440 440 450.7 440 464C440 477.3 450.7 488 464 488z"/></svg>',user:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M224 248a120 120 0 1 0 0-240 120 120 0 1 0 0 240zm-29.7 56C95.8 304 16 383.8 16 482.3 16 498.7 29.3 512 45.7 512l356.6 0c16.4 0 29.7-13.3 29.7-29.7 0-98.5-79.8-178.3-178.3-178.3l-59.4 0z"/></svg>',volume:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M48 352l48 0 134.1 119.2c6.4 5.7 14.6 8.8 23.1 8.8 19.2 0 34.8-15.6 34.8-34.8l0-378.4c0-19.2-15.6-34.8-34.8-34.8-8.5 0-16.7 3.1-23.1 8.8L96 160 48 160c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48zM441.1 107c-10.3-8.4-25.4-6.8-33.8 3.5s-6.8 25.4 3.5 33.8C443.3 170.7 464 210.9 464 256s-20.7 85.3-53.2 111.8c-10.3 8.4-11.8 23.5-3.5 33.8s23.5 11.8 33.8 3.5c43.2-35.2 70.9-88.9 70.9-149s-27.7-113.8-70.9-149zm-60.5 74.5c-10.3-8.4-25.4-6.8-33.8 3.5s-6.8 25.4 3.5 33.8C361.1 227.6 368 241 368 256s-6.9 28.4-17.7 37.3c-10.3 8.4-11.8 23.5-3.5 33.8s23.5 11.8 33.8 3.5C402.1 312.9 416 286.1 416 256s-13.9-56.9-35.5-74.5z"/></svg>',"volume-low":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M48 352l48 0 134.1 119.2c6.4 5.7 14.6 8.8 23.1 8.8 19.2 0 34.8-15.6 34.8-34.8l0-378.4c0-19.2-15.6-34.8-34.8-34.8-8.5 0-16.7 3.1-23.1 8.8L96 160 48 160c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48zM380.6 181.5c-10.3-8.4-25.4-6.8-33.8 3.5s-6.8 25.4 3.5 33.8C361.1 227.6 368 241 368 256s-6.9 28.4-17.7 37.3c-10.3 8.4-11.8 23.5-3.5 33.8s23.5 11.8 33.8 3.5C402.1 312.9 416 286.1 416 256s-13.9-56.9-35.5-74.5z"/></svg>',"volume-xmark":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path fill="currentColor" d="M48 352l48 0 134.1 119.2c6.4 5.7 14.6 8.8 23.1 8.8 19.2 0 34.8-15.6 34.8-34.8l0-378.4c0-19.2-15.6-34.8-34.8-34.8-8.5 0-16.7 3.1-23.1 8.8L96 160 48 160c-26.5 0-48 21.5-48 48l0 96c0 26.5 21.5 48 48 48zM367 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"/></svg>',xmark:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M55.1 73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L147.2 256 9.9 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192.5 301.3 329.9 438.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.8 256 375.1 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192.5 210.7 55.1 73.4z"/></svg>'},regular:{calendar:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M216 64C229.3 64 240 74.7 240 88L240 128L400 128L400 88C400 74.7 410.7 64 424 64C437.3 64 448 74.7 448 88L448 128L480 128C515.3 128 544 156.7 544 192L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 192C96 156.7 124.7 128 160 128L192 128L192 88C192 74.7 202.7 64 216 64zM216 176L160 176C151.2 176 144 183.2 144 192L144 240L496 240L496 192C496 183.2 488.8 176 480 176L216 176zM144 288L144 480C144 488.8 151.2 496 160 496L480 496C488.8 496 496 488.8 496 480L496 288L144 288z"/></svg>',"circle-question":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M464 256a208 208 0 1 0 -416 0 208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0zm256-80c-17.7 0-32 14.3-32 32 0 13.3-10.7 24-24 24s-24-10.7-24-24c0-44.2 35.8-80 80-80s80 35.8 80 80c0 47.2-36 67.2-56 74.5l0 3.8c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-8.1c0-20.5 14.8-35.2 30.1-40.2 6.4-2.1 13.2-5.5 18.2-10.3 4.3-4.2 7.7-10 7.7-19.6 0-17.7-14.3-32-32-32zM224 368a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg>',"circle-xmark":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM167 167c-9.4 9.4-9.4 24.6 0 33.9l55 55-55 55c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l55-55 55 55c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-55-55 55-55c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-55 55-55-55c-9.4-9.4-24.6-9.4-33.9 0z"/></svg>',clock:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><!--!Font Awesome Free v7.2.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2026 Fonticons, Inc.--><path d="M528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112C434.9 112 528 205.1 528 320zM64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z"/></svg>',copy:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M384 336l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l133.5 0c4.2 0 8.3 1.7 11.3 4.7l58.5 58.5c3 3 4.7 7.1 4.7 11.3L400 320c0 8.8-7.2 16-16 16zM192 384l192 0c35.3 0 64-28.7 64-64l0-197.5c0-17-6.7-33.3-18.7-45.3L370.7 18.7C358.7 6.7 342.5 0 325.5 0L192 0c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64zM64 128c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l192 0c35.3 0 64-28.7 64-64l0-16-48 0 0 16c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l16 0 0-48-16 0z"/></svg>',eye:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M288 80C222.8 80 169.2 109.6 128.1 147.7 89.6 183.5 63 226 49.4 256 63 286 89.6 328.5 128.1 364.3 169.2 402.4 222.8 432 288 432s118.8-29.6 159.9-67.7C486.4 328.5 513 286 526.6 256 513 226 486.4 183.5 447.9 147.7 406.8 109.6 353.2 80 288 80zM95.4 112.6C142.5 68.8 207.2 32 288 32s145.5 36.8 192.6 80.6c46.8 43.5 78.1 95.4 93 131.1 3.3 7.9 3.3 16.7 0 24.6-14.9 35.7-46.2 87.7-93 131.1-47.1 43.7-111.8 80.6-192.6 80.6S142.5 443.2 95.4 399.4c-46.8-43.5-78.1-95.4-93-131.1-3.3-7.9-3.3-16.7 0-24.6 14.9-35.7 46.2-87.7 93-131.1zM288 336c44.2 0 80-35.8 80-80 0-29.6-16.1-55.5-40-69.3-1.4 59.7-49.6 107.9-109.3 109.3 13.8 23.9 39.7 40 69.3 40zm-79.6-88.4c2.5 .3 5 .4 7.6 .4 35.3 0 64-28.7 64-64 0-2.6-.2-5.1-.4-7.6-37.4 3.9-67.2 33.7-71.1 71.1zm45.6-115c10.8-3 22.2-4.5 33.9-4.5 8.8 0 17.5 .9 25.8 2.6 .3 .1 .5 .1 .8 .2 57.9 12.2 101.4 63.7 101.4 125.2 0 70.7-57.3 128-128 128-61.6 0-113-43.5-125.2-101.4-1.8-8.6-2.8-17.5-2.8-26.6 0-11 1.4-21.8 4-32 .2-.7 .3-1.3 .5-1.9 11.9-43.4 46.1-77.6 89.5-89.5z"/></svg>',"eye-slash":'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M41-24.9c-9.4-9.4-24.6-9.4-33.9 0S-2.3-.3 7 9.1l528 528c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-96.4-96.4c2.7-2.4 5.4-4.8 8-7.2 46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6-56.8 0-105.6 18.2-146 44.2L41-24.9zM176.9 111.1c32.1-18.9 69.2-31.1 111.1-31.1 65.2 0 118.8 29.6 159.9 67.7 38.5 35.7 65.1 78.3 78.6 108.3-13.6 30-40.2 72.5-78.6 108.3-3.1 2.8-6.2 5.6-9.4 8.4L393.8 328c14-20.5 22.2-45.3 22.2-72 0-70.7-57.3-128-128-128-26.7 0-51.5 8.2-72 22.2l-39.1-39.1zm182 182l-108-108c11.1-5.8 23.7-9.1 37.1-9.1 44.2 0 80 35.8 80 80 0 13.4-3.3 26-9.1 37.1zM103.4 173.2l-34-34c-32.6 36.8-55 75.8-66.9 104.5-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6 37.3 0 71.2-7.9 101.5-20.6L352.2 422c-20 6.4-41.4 10-64.2 10-65.2 0-118.8-29.6-159.9-67.7-38.5-35.7-65.1-78.3-78.6-108.3 10.4-23.1 28.6-53.6 54-82.8z"/></svg>',star:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><!--! Font Awesome Free 7.0.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc. --><path fill="currentColor" d="M288.1-32c9 0 17.3 5.1 21.4 13.1L383 125.3 542.9 150.7c8.9 1.4 16.3 7.7 19.1 16.3s.5 18-5.8 24.4L441.7 305.9 467 465.8c1.4 8.9-2.3 17.9-9.6 23.2s-17 6.1-25 2L288.1 417.6 143.8 491c-8 4.1-17.7 3.3-25-2s-11-14.2-9.6-23.2L134.4 305.9 20 191.4c-6.4-6.4-8.6-15.8-5.8-24.4s10.1-14.9 19.1-16.3l159.9-25.4 73.6-144.2c4.1-8 12.4-13.1 21.4-13.1zm0 76.8L230.3 158c-3.5 6.8-10 11.6-17.6 12.8l-125.5 20 89.8 89.9c5.4 5.4 7.9 13.1 6.7 20.7l-19.8 125.5 113.3-57.6c6.8-3.5 14.9-3.5 21.8 0l113.3 57.6-19.8-125.5c-1.2-7.6 1.3-15.3 6.7-20.7l89.8-89.9-125.5-20c-7.6-1.2-14.1-6-17.6-12.8L288.1 44.8z"/></svg>'}},A0={name:"system",resolver:(e,t="classic",r="solid")=>{let i=Wi[r][e]??Wi.regular[e]??Wi.regular["circle-question"];return i?T0(i):""}},Gs=A0;var _0="classic",S0=[Ws,Gs],Ys=new Set;function Xs(e){Ys.add(e)}function Ks(e){Ys.delete(e)}function zo(e){return S0.find(t=>t.name===e)}function Zs(){return _0}var{I:F0}=ws,Js=e=>e;var el=(e,t)=>t===void 0?e?._$litType$!==void 0:e?._$litType$===t;var Qs=()=>document.createComment(""),hr=(e,t,r)=>{let o=e._$AA.parentNode,i=t===void 0?e._$AB:t._$AA;if(r===void 0){let n=o.insertBefore(Qs(),i),a=o.insertBefore(Qs(),i);r=new F0(n,a,e,e.options)}else{let n=r._$AB.nextSibling,a=r._$AM,s=a!==e;if(s){let l;r._$AQ?.(e),r._$AM=e,r._$AP!==void 0&&(l=e._$AU)!==a._$AU&&r._$AP(l)}if(n!==i||s){let l=r._$AA;for(;l!==n;){let u=Js(l).nextSibling;Js(o).insertBefore(l,i),l=u}}}return r},xt=(e,t,r=e)=>(e._$AI(t,r),e),L0={},tl=(e,t=L0)=>e._$AH=t,rl=e=>e._$AH,Mo=e=>{e._$AR(),e._$AA.remove()};var jr=Symbol(),Ro=Symbol(),Gi,Yi=new Map,ce=class extends Q{constructor(){super(...arguments),this.svg=null,this.autoWidth=!1,this.swapOpacity=!1,this.label="",this.library="default",this.rotate=0,this.resolveIcon=async(e,t)=>{let r;if(t?.spriteSheet){this.hasUpdated||await this.updateComplete,this.svg=C`<svg part="svg">
        <use part="use" href="${e}"></use>
      </svg>`,await this.updateComplete;let o=this.shadowRoot.querySelector("[part='svg']");return typeof t.mutator=="function"&&t.mutator(o,this),this.svg}try{if(r=await fetch(e,{mode:"cors"}),!r.ok)return r.status===410?jr:Ro}catch{return Ro}try{let o=document.createElement("div");o.innerHTML=await r.text();let i=o.firstElementChild;if(i?.tagName?.toLowerCase()!=="svg")return jr;Gi||(Gi=new DOMParser);let a=Gi.parseFromString(i.outerHTML,"text/html").body.querySelector("svg");return a?(a.part.add("svg"),document.adoptNode(a)):jr}catch{return jr}}}connectedCallback(){super.connectedCallback(),Xs(this)}firstUpdated(e){super.firstUpdated(e),this.hasAttribute("rotate")&&this.style.setProperty("--rotate-angle",`${this.rotate}deg`),this.setIcon()}disconnectedCallback(){super.disconnectedCallback(),Ks(this)}async getIconSource(){let e=zo(this.library),t=this.family||Zs();if(this.name&&e){let r=this.canvas==="auto"||this.autoWidth,o;try{o=await e.resolver(this.name,t,this.variant,r)}catch{o=void 0}return{url:o,fromLibrary:!0}}return{url:this.src,fromLibrary:!1}}handleLabelChange(){typeof this.label=="string"&&this.label.length>0?(this.setAttribute("role","img"),this.setAttribute("aria-label",this.label),this.removeAttribute("aria-hidden")):(this.removeAttribute("role"),this.removeAttribute("aria-label"),this.setAttribute("aria-hidden","true"))}async setIcon(){let{url:e,fromLibrary:t}=await this.getIconSource(),r=t?zo(this.library):void 0;if(!e){this.svg=null;return}let o=Yi.get(e);o||(o=this.resolveIcon(e,r),Yi.set(e,o));let i=await o;i===Ro&&Yi.delete(e);let n=await this.getIconSource();if(e===n.url){if(el(i)){this.svg=i;return}switch(i){case Ro:case jr:this.svg=null,this.dispatchEvent(new Ns);break;default:this.svg=i.cloneNode(!0),r?.mutator?.(this.svg,this),this.dispatchEvent(new qs)}}}willUpdate(e){return this.style||this.setStyleProperty("--rotate-angle",`${this.rotate}deg`),super.willUpdate(e)}updated(e){super.updated(e);let t=zo(this.library);this.hasAttribute("rotate")&&this.style.setProperty("--rotate-angle",`${this.rotate}deg`);let r=this.shadowRoot?.querySelector("svg");r&&t?.mutator?.(r,this)}render(){return this.hasUpdated?this.svg:C`<svg part="svg" width="16" height="16" viewBox="0 0 16 16"></svg>`}};ce.css=js;v([Lt()],ce.prototype,"svg",2);v([w({reflect:!0})],ce.prototype,"name",2);v([w({reflect:!0})],ce.prototype,"family",2);v([w({reflect:!0})],ce.prototype,"variant",2);v([w({reflect:!0})],ce.prototype,"canvas",2);v([w({attribute:"auto-width",type:Boolean,reflect:!0})],ce.prototype,"autoWidth",2);v([w({attribute:"swap-opacity",type:Boolean,reflect:!0})],ce.prototype,"swapOpacity",2);v([w()],ce.prototype,"src",2);v([w()],ce.prototype,"label",2);v([w({reflect:!0})],ce.prototype,"library",2);v([w({type:Number,reflect:!0})],ce.prototype,"rotate",2);v([w({type:String,reflect:!0})],ce.prototype,"flip",2);v([w({type:String,reflect:!0})],ce.prototype,"animation",2);v([se("label")],ce.prototype,"handleLabelChange",1);v([se(["family","name","library","variant","src","autoWidth","canvas","swapOpacity"],{waitUntilFirstUpdate:!0})],ce.prototype,"setIcon",1);ce=v([ue("wa-icon")],ce);var ol=W`
  :host {
    --size: 25rem;
    --spacing: var(--wa-space-l);
    --backdrop-filter: none;
    --show-duration: var(--wa-transition-normal);
    --hide-duration: var(--wa-transition-normal);

    display: none;
  }

  :host([open]) {
    display: block;
  }

  .drawer {
    display: flex;
    flex-direction: column;
    top: 0;
    inset-inline-start: 0;
    width: 100%;
    height: 100%;
    max-width: 100%;
    max-height: 100%;
    overflow: hidden;
    color: inherit;
    background-color: var(--wa-color-surface-raised);
    border: none;
    box-shadow: var(--wa-shadow-l);
    overflow: auto;
    padding: 0;
    margin: 0;
    animation-duration: var(--show-duration);
    animation-timing-function: ease;

    &.show::backdrop {
      animation: show-backdrop var(--show-duration, 200ms) ease;
    }

    &.hide::backdrop {
      animation: show-backdrop var(--hide-duration, 200ms) ease reverse;
    }

    &.show.top {
      animation: show-drawer-from-top var(--show-duration) ease;
    }

    &.hide.top {
      animation: show-drawer-from-top var(--hide-duration) ease reverse;
    }

    &.show.end {
      animation: show-drawer-from-end var(--show-duration) ease;

      &:dir(rtl) {
        animation-name: show-drawer-from-start;
      }
    }

    &.hide.end {
      animation: show-drawer-from-end var(--hide-duration) ease reverse;

      &:dir(rtl) {
        animation-name: show-drawer-from-start;
      }
    }

    &.show.bottom {
      animation: show-drawer-from-bottom var(--show-duration) ease;
    }

    &.hide.bottom {
      animation: show-drawer-from-bottom var(--hide-duration) ease reverse;
    }

    &.show.start {
      animation: show-drawer-from-start var(--show-duration) ease;

      &:dir(rtl) {
        animation-name: show-drawer-from-end;
      }
    }

    &.hide.start {
      animation: show-drawer-from-start var(--hide-duration) ease reverse;

      &:dir(rtl) {
        animation-name: show-drawer-from-end;
      }
    }

    &.pulse {
      animation: pulse 250ms ease;
    }
  }

  .drawer:focus {
    outline: none;
  }

  .top {
    top: 0;
    inset-inline-end: auto;
    bottom: auto;
    inset-inline-start: 0;
    width: 100%;
    height: var(--size);
  }

  .end {
    top: 0;
    inset-inline-end: 0;
    bottom: auto;
    inset-inline-start: auto;
    width: var(--size);
    height: 100%;
  }

  .bottom {
    top: auto;
    inset-inline-end: auto;
    bottom: 0;
    inset-inline-start: 0;
    width: 100%;
    height: var(--size);
  }

  .start {
    top: 0;
    inset-inline-end: auto;
    bottom: auto;
    inset-inline-start: 0;
    width: var(--size);
    height: 100%;
  }

  .header {
    display: flex;
    flex-wrap: nowrap;
    padding-inline-start: var(--spacing);
    padding-block-end: 0;

    /* Subtract the close button's padding so that the X is visually aligned with the edges of the dialog content */
    padding-inline-end: calc(var(--spacing) - var(--wa-form-control-padding-block));
    padding-block-start: calc(var(--spacing) - var(--wa-form-control-padding-block));
  }

  .title {
    align-self: center;
    flex: 1 1 auto;
    font: inherit;
    font-size: var(--wa-font-size-l);
    font-weight: var(--wa-font-weight-heading);
    line-height: var(--wa-line-height-condensed);
    margin: 0;
  }

  .header-actions {
    align-self: start;
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: end;
    gap: var(--wa-space-2xs);
    padding-inline-start: var(--spacing);
  }

  .header-actions wa-button,
  .header-actions ::slotted(wa-button) {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }

  .body {
    flex: 1 1 auto;
    display: block;
    padding: var(--spacing);
    overflow: auto;
    -webkit-overflow-scrolling: touch;

    &:focus {
      outline: none;
    }

    &:focus-visible {
      outline: var(--wa-focus-ring);
      outline-offset: var(--wa-focus-ring-offset);
    }
  }

  .footer {
    display: flex;
    flex-wrap: wrap;
    gap: var(--wa-space-xs);
    justify-content: end;
    padding: var(--spacing);
    padding-block-start: 0;
  }

  .footer ::slotted(wa-button:not(:last-of-type)) {
    margin-inline-end: var(--wa-spacing-xs);
  }

  .drawer::backdrop {
    /*
        NOTE: the ::backdrop element doesn't inherit properly in Safari yet, but it will in 17.4! At that time, we can
        remove the fallback values here.
      */
    background-color: var(--wa-color-overlay-modal, rgb(0 0 0 / 0.25));
    backdrop-filter: var(--backdrop-filter);
  }

  @keyframes pulse {
    0% {
      scale: 1;
    }
    50% {
      scale: 1.01;
    }
    100% {
      scale: 1;
    }
  }

  @keyframes show-drawer {
    from {
      opacity: 0;
      scale: 0.8;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }

  @keyframes show-drawer-from-top {
    from {
      opacity: 0;
      translate: 0 -100%;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes show-drawer-from-end {
    from {
      opacity: 0;
      translate: 100%;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes show-drawer-from-bottom {
    from {
      opacity: 0;
      translate: 0 100%;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes show-drawer-from-start {
    from {
      opacity: 0;
      translate: -100% 0;
    }
    to {
      opacity: 1;
      translate: 0 0;
    }
  }

  @keyframes show-backdrop {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @media (forced-colors: active) {
    .drawer {
      border: solid 1px white;
    }
  }
`;var Pe=class extends Q{constructor(){super(...arguments),this.localize=new Re(this),this.hasSlotController=new dr(this,"footer","header-actions","label"),this.open=!1,this.label="",this.placement="end",this.withoutHeader=!1,this.lightDismiss=!1,this.withFooter=!1,this.handleDocumentKeyDown=e=>{e.key==="Escape"&&this.open&&bt(this)&&(e.preventDefault(),e.stopPropagation(),this.requestClose(this.drawer))}}firstUpdated(){this.open&&(this.addOpenListeners(),this.drawer.showModal(),ir(this))}disconnectedCallback(){super.disconnectedCallback(),nr(this),this.removeOpenListeners()}async requestClose(e){let t=new sr({source:e});if(this.dispatchEvent(t),t.defaultPrevented){this.open=!0,Fe(this.drawer,"pulse");return}this.removeOpenListeners(),await Fe(this.drawer,"hide"),this.open=!1,this.drawer.close(),nr(this);let r=this.originalTrigger;typeof r?.focus=="function"&&setTimeout(()=>r.focus()),this.dispatchEvent(new ur)}addOpenListeners(){document.addEventListener("keydown",this.handleDocumentKeyDown),cr(this)}removeOpenListeners(){document.removeEventListener("keydown",this.handleDocumentKeyDown),Ft(this)}handleDialogCancel(e){e.preventDefault(),!this.drawer.classList.contains("hide")&&e.target===this.drawer&&bt(this)&&this.requestClose(this.drawer)}handleDialogClick(e){let r=e.target.closest('[data-drawer="close"]');r&&(e.stopPropagation(),this.requestClose(r))}async handleDialogPointerDown(e){e.target===this.drawer&&(this.lightDismiss?this.requestClose(this.drawer):await Fe(this.drawer,"pulse"))}handleOpenChange(){this.open&&!this.drawer.open?this.show():this.drawer.open&&(this.open=!0,this.requestClose(this.drawer))}async show(){let e=new ar;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}this.addOpenListeners(),this.originalTrigger=document.activeElement,this.open=!0,this.drawer.showModal(),ir(this),requestAnimationFrame(()=>{let t=this.querySelector("[autofocus]");t&&typeof t.focus=="function"?t.focus():this.drawer.focus()}),await Fe(this.drawer,"show"),this.dispatchEvent(new lr)}render(){let e=!this.withoutHeader,t=this.hasSlotController.test("footer","withFooter");return C`
      <dialog
        part="dialog"
        class=${ee({drawer:!0,open:this.open,top:this.placement==="top",end:this.placement==="end",bottom:this.placement==="bottom",start:this.placement==="start"})}
        @cancel=${this.handleDialogCancel}
        @click=${this.handleDialogClick}
        @pointerdown=${this.handleDialogPointerDown}
      >
        ${e?C`
              <header part="header" class="header">
                <h2 part="title" class="title" id="title">
                  <!-- If there's no label, use an invisible character to prevent the header from collapsing -->
                  <slot name="label"> ${this.label.length>0?this.label:"\u200B"} </slot>
                </h2>
                <div part="header-actions" class="header-actions">
                  <slot name="header-actions"></slot>
                  <wa-button
                    part="close-button"
                    exportparts="base:close-button__base"
                    class="close"
                    appearance="plain"
                    @click="${r=>this.requestClose(r.target)}"
                  >
                    <wa-icon
                      name="xmark"
                      label=${this.localize.term("close")}
                      library="system"
                      variant="solid"
                    ></wa-icon>
                  </wa-button>
                </div>
              </header>
            `:""}

        <div part="body" class="body"><slot></slot></div>

        <footer part="footer" class="footer" ?hidden=${!t}>
          <slot name="footer"></slot>
        </footer>
      </dialog>
    `}};Pe.css=ol;v([Te(".drawer")],Pe.prototype,"drawer",2);v([w({type:Boolean,reflect:!0})],Pe.prototype,"open",2);v([w({reflect:!0})],Pe.prototype,"label",2);v([w({reflect:!0})],Pe.prototype,"placement",2);v([w({attribute:"without-header",type:Boolean,reflect:!0})],Pe.prototype,"withoutHeader",2);v([w({attribute:"light-dismiss",type:Boolean})],Pe.prototype,"lightDismiss",2);v([w({attribute:"with-footer",type:Boolean})],Pe.prototype,"withFooter",2);v([se("open",{waitUntilFirstUpdate:!0})],Pe.prototype,"handleOpenChange",1);Pe=v([ue("wa-drawer")],Pe);document.addEventListener("click",e=>{let t=e.target.closest("[data-drawer]");if(t instanceof Element){let[r,o]=Eo(t.getAttribute("data-drawer")||"");if(r==="open"&&o?.length){let n=t.getRootNode().getElementById(o);n?.localName==="wa-drawer"?n.open=!0:console.warn(`A drawer with an ID of "${o}" could not be found in this document.`)}}}),document.addEventListener("pointerdown",()=>{});var il=W`
  :host {
    --track-height: 1rem;
    --track-color: var(--wa-color-neutral-fill-normal);
    --indicator-color: var(--wa-color-brand-fill-loud);

    display: flex;
  }

  .progress-bar {
    flex: 1 1 auto;
    display: flex;
    position: relative;
    overflow: hidden;
    height: var(--track-height);
    border-radius: var(--wa-border-radius-pill);
    background-color: var(--track-color);
    color: var(--wa-color-brand-on-loud);
    font-size: var(--wa-font-size-s);
  }

  .indicator {
    width: var(--percentage);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--indicator-color);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    line-height: 1;
    font-weight: var(--wa-font-weight-semibold);
    transition: all var(--wa-transition-slow, 200ms) var(--wa-transition-easing, ease);
    user-select: none;
    -webkit-user-select: none;
  }

  /* Indeterminate */
  :host([indeterminate]) .indicator {
    position: absolute;
    inset-block: 0;
    inline-size: 50%;
    animation: wa-progress-indeterminate 2.5s infinite cubic-bezier(0.37, 0, 0.63, 1);
  }

  @media (forced-colors: active) {
    .progress-bar {
      outline: solid 1px SelectedItem;
      background-color: var(--wa-color-surface-default);
    }

    .indicator {
      outline: solid 1px SelectedItem;
      background-color: SelectedItem;
    }
  }

  @keyframes wa-progress-indeterminate {
    0% {
      inset-inline-start: -50%;
    }

    75%,
    100% {
      inset-inline-start: 100%;
    }
  }
`;var nl="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";var al=(e=21)=>{let t="",r=crypto.getRandomValues(new Uint8Array(e|=0));for(;e--;)t+=nl[r[e]&63];return t};function Xi(e,t,r){let o=i=>Object.is(i,-0)?0:i;return e<t?o(t):e>r?o(r):o(e)}function sl(e=""){return`${e}${al()}`}var Mt=class extends Q{constructor(){super(...arguments),this.localize=new Re(this),this.value=0,this.indeterminate=!1,this.label=""}willUpdate(e){this.style==null&&this.setStyleProperty("--percentage",`${Xi(this.value,0,100)}%`),super.willUpdate(e)}updated(e){e.has("value")&&requestAnimationFrame(()=>{this.style.setProperty("--percentage",`${Xi(this.value,0,100)}%`)}),super.updated(e)}render(){return C`
      <div
        part="base"
        class="progress-bar"
        role="progressbar"
        title=${Le(this.title)}
        aria-label=${this.label.length>0?this.label:this.localize.term("progress")}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow=${this.indeterminate?"0":this.value}
      >
        <div part="indicator" class="indicator">
          ${this.indeterminate?"":C` <slot part="label" class="label"></slot> `}
        </div>
      </div>
    `}};Mt.css=il;v([w({type:Number,reflect:!0})],Mt.prototype,"value",2);v([w({type:Boolean,reflect:!0})],Mt.prototype,"indeterminate",2);v([w()],Mt.prototype,"label",2);Mt=v([ue("wa-progress-bar")],Mt);var ll=W`
  :host {
    --max-width: 30ch;

    /** These styles are added so we don't interfere in the DOM. */
    display: inline-block;
    position: absolute;

    /** Defaults for inherited CSS properties */
    color: var(--wa-tooltip-content-color);
    font-size: var(--wa-tooltip-font-size);
    line-height: var(--wa-tooltip-line-height);
    text-align: start;
    white-space: normal;
  }

  .tooltip {
    --arrow-size: var(--wa-tooltip-arrow-size);
    --arrow-color: var(--wa-tooltip-background-color);
  }

  .tooltip::part(popup) {
    z-index: 1000;
  }

  .tooltip[placement^='top']::part(popup) {
    transform-origin: bottom;
  }

  .tooltip[placement^='bottom']::part(popup) {
    transform-origin: top;
  }

  .tooltip[placement^='left']::part(popup) {
    transform-origin: right;
  }

  .tooltip[placement^='right']::part(popup) {
    transform-origin: left;
  }

  .body {
    display: block;
    width: max-content;
    max-width: var(--max-width);
    border-radius: var(--wa-tooltip-border-radius);
    background-color: var(--wa-tooltip-background-color);
    border: var(--wa-tooltip-border-width) var(--wa-tooltip-border-style) var(--wa-tooltip-border-color);
    padding: 0.25em 0.5em;
    user-select: none;
    -webkit-user-select: none;
  }

  .tooltip {
    --popup-border-width: var(--wa-tooltip-border-width);

    &::part(arrow) {
      border-bottom: var(--wa-tooltip-border-width) var(--wa-tooltip-border-style) var(--wa-tooltip-border-color);
      border-right: var(--wa-tooltip-border-width) var(--wa-tooltip-border-style) var(--wa-tooltip-border-color);
    }
  }
`;var ul=class extends Event{constructor(){super("wa-reposition",{bubbles:!0,cancelable:!1,composed:!0})}};var cl=W`
  :host {
    --arrow-color: black;
    --arrow-size: var(--wa-tooltip-arrow-size);
    --popup-border-width: 0px;
    --show-duration: var(--wa-transition-fast);
    --hide-duration: var(--wa-transition-fast);

    /*
     * These properties are computed to account for the arrow's dimensions after being rotated 45º. The constant
     * 0.7071 is derived from sin(45) to calculate the length of the arrow after rotation.
     *
     * The diamond will be translated inward by --arrow-base-offset, the border thickness, to centralise it on
     * the inner edge of the popup border. This also means we need to increase the size of the arrow by the
     * same amount to compensate.
     *
     * A diamond shaped clipping mask is used to avoid overlap of popup content. This extends slightly inward so
     * the popup border is covered with no sub-pixel rounding artifacts. The diamond corners are mitred at 22.5º
     * to properly merge any arrow border with the popup border. The constant 1.4142 is derived from 1 + tan(22.5).
     *
     */
    --arrow-base-offset: var(--popup-border-width);
    --arrow-size-diagonal: calc((var(--arrow-size) + var(--arrow-base-offset)) * 0.7071);
    --arrow-padding-offset: calc(var(--arrow-size-diagonal) - var(--arrow-size));
    --arrow-size-div: calc(var(--arrow-size-diagonal) * 2);
    --arrow-clipping-corner: calc(var(--arrow-base-offset) * 1.4142);

    display: contents;
  }

  .popup {
    position: absolute;
    isolation: isolate;
    max-width: var(--auto-size-available-width, none);
    max-height: var(--auto-size-available-height, none);

    /* Clear UA styles for [popover] */
    :where(&) {
      inset: unset;
      padding: unset;
      margin: unset;
      width: unset;
      height: unset;
      color: unset;
      background: unset;
      border: unset;
      overflow: unset;
    }
  }

  .popup-fixed {
    position: fixed;
  }

  .popup:not(.popup-active) {
    display: none;
  }

  .arrow {
    position: absolute;
    width: var(--arrow-size-div);
    height: var(--arrow-size-div);
    background: var(--arrow-color);
    z-index: 3;
    clip-path: polygon(
      var(--arrow-clipping-corner) 100%,
      var(--arrow-base-offset) calc(100% - var(--arrow-base-offset)),
      calc(var(--arrow-base-offset) - 2px) calc(100% - var(--arrow-base-offset)),
      calc(100% - var(--arrow-base-offset)) calc(var(--arrow-base-offset) - 2px),
      calc(100% - var(--arrow-base-offset)) var(--arrow-base-offset),
      100% var(--arrow-clipping-corner),
      100% 100%
    );
    rotate: 45deg;
  }

  :host([data-current-placement|='left']) .arrow {
    rotate: -45deg;
  }

  :host([data-current-placement|='right']) .arrow {
    rotate: 135deg;
  }

  :host([data-current-placement|='bottom']) .arrow {
    rotate: 225deg;
  }

  /* Hover bridge */
  .popup-hover-bridge:not(.popup-hover-bridge-visible) {
    display: none;
  }

  .popup-hover-bridge {
    position: fixed;
    z-index: 899;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    clip-path: polygon(
      var(--hover-bridge-top-left-x, 0) var(--hover-bridge-top-left-y, 0),
      var(--hover-bridge-top-right-x, 0) var(--hover-bridge-top-right-y, 0),
      var(--hover-bridge-bottom-right-x, 0) var(--hover-bridge-bottom-right-y, 0),
      var(--hover-bridge-bottom-left-x, 0) var(--hover-bridge-bottom-left-y, 0)
    );
  }

  /* Built-in animations */
  .show {
    animation: show var(--show-duration) ease;
  }

  .hide {
    animation: show var(--hide-duration) ease reverse;
  }

  @keyframes show {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .show-with-scale {
    animation: show-with-scale var(--show-duration) ease;
  }

  .hide-with-scale {
    animation: show-with-scale var(--hide-duration) ease reverse;
  }

  @keyframes show-with-scale {
    from {
      opacity: 0;
      scale: 0.8;
    }
    to {
      opacity: 1;
      scale: 1;
    }
  }
`;var Ke=Math.min,ye=Math.max,Hr=Math.round,Vr=Math.floor,qe=e=>({x:e,y:e}),D0={left:"right",right:"left",bottom:"top",top:"bottom"};function Oo(e,t,r){return ye(e,Ke(t,r))}function Rt(e,t){return typeof e=="function"?e(t):e}function at(e){return e.split("-")[0]}function Pt(e){return e.split("-")[1]}function Ki(e){return e==="x"?"y":"x"}function Io(e){return e==="y"?"height":"width"}function Ze(e){let t=e[0];return t==="t"||t==="b"?"y":"x"}function Bo(e){return Ki(Ze(e))}function fl(e,t,r){r===void 0&&(r=!1);let o=Pt(e),i=Bo(e),n=Io(i),a=i==="x"?o===(r?"end":"start")?"right":"left":o==="start"?"bottom":"top";return t.reference[n]>t.floating[n]&&(a=Ur(a)),[a,Ur(a)]}function ml(e){let t=Ur(e);return[Po(e),t,Po(t)]}function Po(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}var dl=["left","right"],pl=["right","left"],z0=["top","bottom"],M0=["bottom","top"];function R0(e,t,r){switch(e){case"top":case"bottom":return r?t?pl:dl:t?dl:pl;case"left":case"right":return t?z0:M0;default:return[]}}function hl(e,t,r,o){let i=Pt(e),n=R0(at(e),r==="start",o);return i&&(n=n.map(a=>a+"-"+i),t&&(n=n.concat(n.map(Po)))),n}function Ur(e){let t=at(e);return D0[t]+e.slice(t.length)}function P0(e){return{top:0,right:0,bottom:0,left:0,...e}}function Zi(e){return typeof e!="number"?P0(e):{top:e,right:e,bottom:e,left:e}}function Ot(e){let{x:t,y:r,width:o,height:i}=e;return{width:o,height:i,top:r,left:t,right:t+o,bottom:r+i,x:t,y:r}}function gl(e,t,r){let{reference:o,floating:i}=e,n=Ze(t),a=Bo(t),s=Io(a),l=at(t),u=n==="y",c=o.x+o.width/2-i.width/2,p=o.y+o.height/2-i.height/2,g=o[s]/2-i[s]/2,m;switch(l){case"top":m={x:c,y:o.y-i.height};break;case"bottom":m={x:c,y:o.y+o.height};break;case"right":m={x:o.x+o.width,y:p};break;case"left":m={x:o.x-i.width,y:p};break;default:m={x:o.x,y:o.y}}switch(Pt(t)){case"start":m[a]-=g*(r&&u?-1:1);break;case"end":m[a]+=g*(r&&u?-1:1);break}return m}async function bl(e,t){var r;t===void 0&&(t={});let{x:o,y:i,platform:n,rects:a,elements:s,strategy:l}=e,{boundary:u="clippingAncestors",rootBoundary:c="viewport",elementContext:p="floating",altBoundary:g=!1,padding:m=0}=Rt(t,e),h=Zi(m),y=s[g?p==="floating"?"reference":"floating":p],S=Ot(await n.getClippingRect({element:(r=await(n.isElement==null?void 0:n.isElement(y)))==null||r?y:y.contextElement||await(n.getDocumentElement==null?void 0:n.getDocumentElement(s.floating)),boundary:u,rootBoundary:c,strategy:l})),k=p==="floating"?{x:o,y:i,width:a.floating.width,height:a.floating.height}:a.reference,_=await(n.getOffsetParent==null?void 0:n.getOffsetParent(s.floating)),T=await(n.isElement==null?void 0:n.isElement(_))?await(n.getScale==null?void 0:n.getScale(_))||{x:1,y:1}:{x:1,y:1},E=Ot(n.convertOffsetParentRelativeRectToViewportRelativeRect?await n.convertOffsetParentRelativeRectToViewportRelativeRect({elements:s,rect:k,offsetParent:_,strategy:l}):k);return{top:(S.top-E.top+h.top)/T.y,bottom:(E.bottom-S.bottom+h.bottom)/T.y,left:(S.left-E.left+h.left)/T.x,right:(E.right-S.right+h.right)/T.x}}var O0=50,vl=async(e,t,r)=>{let{placement:o="bottom",strategy:i="absolute",middleware:n=[],platform:a}=r,s=a.detectOverflow?a:{...a,detectOverflow:bl},l=await(a.isRTL==null?void 0:a.isRTL(t)),u=await a.getElementRects({reference:e,floating:t,strategy:i}),{x:c,y:p}=gl(u,o,l),g=o,m=0,h={};for(let x=0;x<n.length;x++){let y=n[x];if(!y)continue;let{name:S,fn:k}=y,{x:_,y:T,data:E,reset:A}=await k({x:c,y:p,initialPlacement:o,placement:g,strategy:i,middlewareData:h,rects:u,platform:s,elements:{reference:e,floating:t}});c=_??c,p=T??p,h[S]={...h[S],...E},A&&m<O0&&(m++,typeof A=="object"&&(A.placement&&(g=A.placement),A.rects&&(u=A.rects===!0?await a.getElementRects({reference:e,floating:t,strategy:i}):A.rects),{x:c,y:p}=gl(u,g,l)),x=-1)}return{x:c,y:p,placement:g,strategy:i,middlewareData:h}},xl=e=>({name:"arrow",options:e,async fn(t){let{x:r,y:o,placement:i,rects:n,platform:a,elements:s,middlewareData:l}=t,{element:u,padding:c=0}=Rt(e,t)||{};if(u==null)return{};let p=Zi(c),g={x:r,y:o},m=Bo(i),h=Io(m),x=await a.getDimensions(u),y=m==="y",S=y?"top":"left",k=y?"bottom":"right",_=y?"clientHeight":"clientWidth",T=n.reference[h]+n.reference[m]-g[m]-n.floating[h],E=g[m]-n.reference[m],A=await(a.getOffsetParent==null?void 0:a.getOffsetParent(u)),z=A?A[_]:0;(!z||!await(a.isElement==null?void 0:a.isElement(A)))&&(z=s.floating[_]||n.floating[h]);let O=T/2-E/2,H=z/2-x[h]/2-1,V=Ke(p[S],H),ve=Ke(p[k],H),ie=V,ze=z-x[h]-ve,te=z/2-x[h]/2+O,ne=Oo(ie,te,ze),xe=!l.arrow&&Pt(i)!=null&&te!==ne&&n.reference[h]/2-(te<ie?V:ve)-x[h]/2<0,Ee=xe?te<ie?te-ie:te-ze:0;return{[m]:g[m]+Ee,data:{[m]:ne,centerOffset:te-ne-Ee,...xe&&{alignmentOffset:Ee}},reset:xe}}});var wl=function(e){return e===void 0&&(e={}),{name:"flip",options:e,async fn(t){var r,o;let{placement:i,middlewareData:n,rects:a,initialPlacement:s,platform:l,elements:u}=t,{mainAxis:c=!0,crossAxis:p=!0,fallbackPlacements:g,fallbackStrategy:m="bestFit",fallbackAxisSideDirection:h="none",flipAlignment:x=!0,...y}=Rt(e,t);if((r=n.arrow)!=null&&r.alignmentOffset)return{};let S=at(i),k=Ze(s),_=at(s)===s,T=await(l.isRTL==null?void 0:l.isRTL(u.floating)),E=g||(_||!x?[Ur(s)]:ml(s)),A=h!=="none";!g&&A&&E.push(...hl(s,x,h,T));let z=[s,...E],O=await l.detectOverflow(t,y),H=[],V=((o=n.flip)==null?void 0:o.overflows)||[];if(c&&H.push(O[S]),p){let te=fl(i,a,T);H.push(O[te[0]],O[te[1]])}if(V=[...V,{placement:i,overflows:H}],!H.every(te=>te<=0)){var ve,ie;let te=(((ve=n.flip)==null?void 0:ve.index)||0)+1,ne=z[te];if(ne&&(!(p==="alignment"?k!==Ze(ne):!1)||V.every(Se=>Ze(Se.placement)===k?Se.overflows[0]>0:!0)))return{data:{index:te,overflows:V},reset:{placement:ne}};let xe=(ie=V.filter(Ee=>Ee.overflows[0]<=0).sort((Ee,Se)=>Ee.overflows[1]-Se.overflows[1])[0])==null?void 0:ie.placement;if(!xe)switch(m){case"bestFit":{var ze;let Ee=(ze=V.filter(Se=>{if(A){let Ve=Ze(Se.placement);return Ve===k||Ve==="y"}return!0}).map(Se=>[Se.placement,Se.overflows.filter(Ve=>Ve>0).reduce((Ve,wi)=>Ve+wi,0)]).sort((Se,Ve)=>Se[1]-Ve[1])[0])==null?void 0:ze[0];Ee&&(xe=Ee);break}case"initialPlacement":xe=s;break}if(i!==xe)return{reset:{placement:xe}}}return{}}}};var I0=new Set(["left","top"]);async function B0(e,t){let{placement:r,platform:o,elements:i}=e,n=await(o.isRTL==null?void 0:o.isRTL(i.floating)),a=at(r),s=Pt(r),l=Ze(r)==="y",u=I0.has(a)?-1:1,c=n&&l?-1:1,p=Rt(t,e),{mainAxis:g,crossAxis:m,alignmentAxis:h}=typeof p=="number"?{mainAxis:p,crossAxis:0,alignmentAxis:null}:{mainAxis:p.mainAxis||0,crossAxis:p.crossAxis||0,alignmentAxis:p.alignmentAxis};return s&&typeof h=="number"&&(m=s==="end"?h*-1:h),l?{x:m*c,y:g*u}:{x:g*u,y:m*c}}var yl=function(e){return e===void 0&&(e=0),{name:"offset",options:e,async fn(t){var r,o;let{x:i,y:n,placement:a,middlewareData:s}=t,l=await B0(t,e);return a===((r=s.offset)==null?void 0:r.placement)&&(o=s.arrow)!=null&&o.alignmentOffset?{}:{x:i+l.x,y:n+l.y,data:{...l,placement:a}}}}},kl=function(e){return e===void 0&&(e={}),{name:"shift",options:e,async fn(t){let{x:r,y:o,placement:i,platform:n}=t,{mainAxis:a=!0,crossAxis:s=!1,limiter:l={fn:S=>{let{x:k,y:_}=S;return{x:k,y:_}}},...u}=Rt(e,t),c={x:r,y:o},p=await n.detectOverflow(t,u),g=Ze(at(i)),m=Ki(g),h=c[m],x=c[g];if(a){let S=m==="y"?"top":"left",k=m==="y"?"bottom":"right",_=h+p[S],T=h-p[k];h=Oo(_,h,T)}if(s){let S=g==="y"?"top":"left",k=g==="y"?"bottom":"right",_=x+p[S],T=x-p[k];x=Oo(_,x,T)}let y=l.fn({...t,[m]:h,[g]:x});return{...y,data:{x:y.x-r,y:y.y-o,enabled:{[m]:a,[g]:s}}}}}};var Cl=function(e){return e===void 0&&(e={}),{name:"size",options:e,async fn(t){var r,o;let{placement:i,rects:n,platform:a,elements:s}=t,{apply:l=()=>{},...u}=Rt(e,t),c=await a.detectOverflow(t,u),p=at(i),g=Pt(i),m=Ze(i)==="y",{width:h,height:x}=n.floating,y,S;p==="top"||p==="bottom"?(y=p,S=g===(await(a.isRTL==null?void 0:a.isRTL(s.floating))?"start":"end")?"left":"right"):(S=p,y=g==="end"?"top":"bottom");let k=x-c.top-c.bottom,_=h-c.left-c.right,T=Ke(x-c[y],k),E=Ke(h-c[S],_),A=!t.middlewareData.shift,z=T,O=E;if((r=t.middlewareData.shift)!=null&&r.enabled.x&&(O=_),(o=t.middlewareData.shift)!=null&&o.enabled.y&&(z=k),A&&!g){let V=ye(c.left,0),ve=ye(c.right,0),ie=ye(c.top,0),ze=ye(c.bottom,0);m?O=h-2*(V!==0||ve!==0?V+ve:ye(c.left,c.right)):z=x-2*(ie!==0||ze!==0?ie+ze:ye(c.top,c.bottom))}await l({...t,availableWidth:O,availableHeight:z});let H=await a.getDimensions(s.floating);return h!==H.width||x!==H.height?{reset:{rects:!0}}:{}}}};function $o(){return typeof window<"u"}function Bt(e){return Tl(e)?(e.nodeName||"").toLowerCase():"#document"}function Ae(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function je(e){var t;return(t=(Tl(e)?e.ownerDocument:e.document)||window.document)==null?void 0:t.documentElement}function Tl(e){return $o()?e instanceof Node||e instanceof Ae(e).Node:!1}function Oe(e){return $o()?e instanceof Element||e instanceof Ae(e).Element:!1}function Je(e){return $o()?e instanceof HTMLElement||e instanceof Ae(e).HTMLElement:!1}function El(e){return!$o()||typeof ShadowRoot>"u"?!1:e instanceof ShadowRoot||e instanceof Ae(e).ShadowRoot}function gr(e){let{overflow:t,overflowX:r,overflowY:o,display:i}=Ie(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+r)&&i!=="inline"&&i!=="contents"}function Al(e){return/^(table|td|th)$/.test(Bt(e))}function Wr(e){try{if(e.matches(":popover-open"))return!0}catch{}try{return e.matches(":modal")}catch{return!1}}var $0=/transform|translate|scale|rotate|perspective|filter/,N0=/paint|layout|strict|content/,It=e=>!!e&&e!=="none",Ji;function br(e){let t=Oe(e)?Ie(e):e;return It(t.transform)||It(t.translate)||It(t.scale)||It(t.rotate)||It(t.perspective)||!No()&&(It(t.backdropFilter)||It(t.filter))||$0.test(t.willChange||"")||N0.test(t.contain||"")}function _l(e){let t=st(e);for(;Je(t)&&!$t(t);){if(br(t))return t;if(Wr(t))return null;t=st(t)}return null}function No(){return Ji==null&&(Ji=typeof CSS<"u"&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),Ji}function $t(e){return/^(html|body|#document)$/.test(Bt(e))}function Ie(e){return Ae(e).getComputedStyle(e)}function Gr(e){return Oe(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function st(e){if(Bt(e)==="html")return e;let t=e.assignedSlot||e.parentNode||El(e)&&e.host||je(e);return El(t)?t.host:t}function Sl(e){let t=st(e);return $t(t)?e.ownerDocument?e.ownerDocument.body:e.body:Je(t)&&gr(t)?t:Sl(t)}function lt(e,t,r){var o;t===void 0&&(t=[]),r===void 0&&(r=!0);let i=Sl(e),n=i===((o=e.ownerDocument)==null?void 0:o.body),a=Ae(i);if(n){let s=qo(a);return t.concat(a,a.visualViewport||[],gr(i)?i:[],s&&r?lt(s):[])}else return t.concat(i,lt(i,[],r))}function qo(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function zl(e){let t=Ie(e),r=parseFloat(t.width)||0,o=parseFloat(t.height)||0,i=Je(e),n=i?e.offsetWidth:r,a=i?e.offsetHeight:o,s=Hr(r)!==n||Hr(o)!==a;return s&&(r=n,o=a),{width:r,height:o,$:s}}function en(e){return Oe(e)?e:e.contextElement}function vr(e){let t=en(e);if(!Je(t))return qe(1);let r=t.getBoundingClientRect(),{width:o,height:i,$:n}=zl(t),a=(n?Hr(r.width):r.width)/o,s=(n?Hr(r.height):r.height)/i;return(!a||!Number.isFinite(a))&&(a=1),(!s||!Number.isFinite(s))&&(s=1),{x:a,y:s}}var q0=qe(0);function Ml(e){let t=Ae(e);return!No()||!t.visualViewport?q0:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function j0(e,t,r){return t===void 0&&(t=!1),!r||t&&r!==Ae(e)?!1:t}function Nt(e,t,r,o){t===void 0&&(t=!1),r===void 0&&(r=!1);let i=e.getBoundingClientRect(),n=en(e),a=qe(1);t&&(o?Oe(o)&&(a=vr(o)):a=vr(e));let s=j0(n,r,o)?Ml(n):qe(0),l=(i.left+s.x)/a.x,u=(i.top+s.y)/a.y,c=i.width/a.x,p=i.height/a.y;if(n){let g=Ae(n),m=o&&Oe(o)?Ae(o):o,h=g,x=qo(h);for(;x&&o&&m!==h;){let y=vr(x),S=x.getBoundingClientRect(),k=Ie(x),_=S.left+(x.clientLeft+parseFloat(k.paddingLeft))*y.x,T=S.top+(x.clientTop+parseFloat(k.paddingTop))*y.y;l*=y.x,u*=y.y,c*=y.x,p*=y.y,l+=_,u+=T,h=Ae(x),x=qo(h)}}return Ot({width:c,height:p,x:l,y:u})}function jo(e,t){let r=Gr(e).scrollLeft;return t?t.left+r:Nt(je(e)).left+r}function Rl(e,t){let r=e.getBoundingClientRect(),o=r.left+t.scrollLeft-jo(e,r),i=r.top+t.scrollTop;return{x:o,y:i}}function U0(e){let{elements:t,rect:r,offsetParent:o,strategy:i}=e,n=i==="fixed",a=je(o),s=t?Wr(t.floating):!1;if(o===a||s&&n)return r;let l={scrollLeft:0,scrollTop:0},u=qe(1),c=qe(0),p=Je(o);if((p||!p&&!n)&&((Bt(o)!=="body"||gr(a))&&(l=Gr(o)),p)){let m=Nt(o);u=vr(o),c.x=m.x+o.clientLeft,c.y=m.y+o.clientTop}let g=a&&!p&&!n?Rl(a,l):qe(0);return{width:r.width*u.x,height:r.height*u.y,x:r.x*u.x-l.scrollLeft*u.x+c.x+g.x,y:r.y*u.y-l.scrollTop*u.y+c.y+g.y}}function H0(e){return Array.from(e.getClientRects())}function V0(e){let t=je(e),r=Gr(e),o=e.ownerDocument.body,i=ye(t.scrollWidth,t.clientWidth,o.scrollWidth,o.clientWidth),n=ye(t.scrollHeight,t.clientHeight,o.scrollHeight,o.clientHeight),a=-r.scrollLeft+jo(e),s=-r.scrollTop;return Ie(o).direction==="rtl"&&(a+=ye(t.clientWidth,o.clientWidth)-i),{width:i,height:n,x:a,y:s}}var Fl=25;function W0(e,t){let r=Ae(e),o=je(e),i=r.visualViewport,n=o.clientWidth,a=o.clientHeight,s=0,l=0;if(i){n=i.width,a=i.height;let c=No();(!c||c&&t==="fixed")&&(s=i.offsetLeft,l=i.offsetTop)}let u=jo(o);if(u<=0){let c=o.ownerDocument,p=c.body,g=getComputedStyle(p),m=c.compatMode==="CSS1Compat"&&parseFloat(g.marginLeft)+parseFloat(g.marginRight)||0,h=Math.abs(o.clientWidth-p.clientWidth-m);h<=Fl&&(n-=h)}else u<=Fl&&(n+=u);return{width:n,height:a,x:s,y:l}}function G0(e,t){let r=Nt(e,!0,t==="fixed"),o=r.top+e.clientTop,i=r.left+e.clientLeft,n=Je(e)?vr(e):qe(1),a=e.clientWidth*n.x,s=e.clientHeight*n.y,l=i*n.x,u=o*n.y;return{width:a,height:s,x:l,y:u}}function Ll(e,t,r){let o;if(t==="viewport")o=W0(e,r);else if(t==="document")o=V0(je(e));else if(Oe(t))o=G0(t,r);else{let i=Ml(e);o={x:t.x-i.x,y:t.y-i.y,width:t.width,height:t.height}}return Ot(o)}function Pl(e,t){let r=st(e);return r===t||!Oe(r)||$t(r)?!1:Ie(r).position==="fixed"||Pl(r,t)}function Y0(e,t){let r=t.get(e);if(r)return r;let o=lt(e,[],!1).filter(s=>Oe(s)&&Bt(s)!=="body"),i=null,n=Ie(e).position==="fixed",a=n?st(e):e;for(;Oe(a)&&!$t(a);){let s=Ie(a),l=br(a);!l&&s.position==="fixed"&&(i=null),(n?!l&&!i:!l&&s.position==="static"&&!!i&&(i.position==="absolute"||i.position==="fixed")||gr(a)&&!l&&Pl(e,a))?o=o.filter(c=>c!==a):i=s,a=st(a)}return t.set(e,o),o}function X0(e){let{element:t,boundary:r,rootBoundary:o,strategy:i}=e,a=[...r==="clippingAncestors"?Wr(t)?[]:Y0(t,this._c):[].concat(r),o],s=Ll(t,a[0],i),l=s.top,u=s.right,c=s.bottom,p=s.left;for(let g=1;g<a.length;g++){let m=Ll(t,a[g],i);l=ye(m.top,l),u=Ke(m.right,u),c=Ke(m.bottom,c),p=ye(m.left,p)}return{width:u-p,height:c-l,x:p,y:l}}function K0(e){let{width:t,height:r}=zl(e);return{width:t,height:r}}function Z0(e,t,r){let o=Je(t),i=je(t),n=r==="fixed",a=Nt(e,!0,n,t),s={scrollLeft:0,scrollTop:0},l=qe(0);function u(){l.x=jo(i)}if(o||!o&&!n)if((Bt(t)!=="body"||gr(i))&&(s=Gr(t)),o){let m=Nt(t,!0,n,t);l.x=m.x+t.clientLeft,l.y=m.y+t.clientTop}else i&&u();n&&!o&&i&&u();let c=i&&!o&&!n?Rl(i,s):qe(0),p=a.left+s.scrollLeft-l.x-c.x,g=a.top+s.scrollTop-l.y-c.y;return{x:p,y:g,width:a.width,height:a.height}}function Qi(e){return Ie(e).position==="static"}function Dl(e,t){if(!Je(e)||Ie(e).position==="fixed")return null;if(t)return t(e);let r=e.offsetParent;return je(e)===r&&(r=r.ownerDocument.body),r}function Ol(e,t){let r=Ae(e);if(Wr(e))return r;if(!Je(e)){let i=st(e);for(;i&&!$t(i);){if(Oe(i)&&!Qi(i))return i;i=st(i)}return r}let o=Dl(e,t);for(;o&&Al(o)&&Qi(o);)o=Dl(o,t);return o&&$t(o)&&Qi(o)&&!br(o)?r:o||_l(e)||r}var J0=async function(e){let t=this.getOffsetParent||Ol,r=this.getDimensions,o=await r(e.floating);return{reference:Z0(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}};function Q0(e){return Ie(e).direction==="rtl"}var Yr={convertOffsetParentRelativeRectToViewportRelativeRect:U0,getDocumentElement:je,getClippingRect:X0,getOffsetParent:Ol,getElementRects:J0,getClientRects:H0,getDimensions:K0,getScale:vr,isElement:Oe,isRTL:Q0};function Il(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function ep(e,t){let r=null,o,i=je(e);function n(){var s;clearTimeout(o),(s=r)==null||s.disconnect(),r=null}function a(s,l){s===void 0&&(s=!1),l===void 0&&(l=1),n();let u=e.getBoundingClientRect(),{left:c,top:p,width:g,height:m}=u;if(s||t(),!g||!m)return;let h=Vr(p),x=Vr(i.clientWidth-(c+g)),y=Vr(i.clientHeight-(p+m)),S=Vr(c),_={rootMargin:-h+"px "+-x+"px "+-y+"px "+-S+"px",threshold:ye(0,Ke(1,l))||1},T=!0;function E(A){let z=A[0].intersectionRatio;if(z!==l){if(!T)return a();z?a(!1,z):o=setTimeout(()=>{a(!1,1e-7)},1e3)}z===1&&!Il(u,e.getBoundingClientRect())&&a(),T=!1}try{r=new IntersectionObserver(E,{..._,root:i.ownerDocument})}catch{r=new IntersectionObserver(E,_)}r.observe(e)}return a(!0),n}function Bl(e,t,r,o){o===void 0&&(o={});let{ancestorScroll:i=!0,ancestorResize:n=!0,elementResize:a=typeof ResizeObserver=="function",layoutShift:s=typeof IntersectionObserver=="function",animationFrame:l=!1}=o,u=en(e),c=i||n?[...u?lt(u):[],...t?lt(t):[]]:[];c.forEach(S=>{i&&S.addEventListener("scroll",r,{passive:!0}),n&&S.addEventListener("resize",r)});let p=u&&s?ep(u,r):null,g=-1,m=null;a&&(m=new ResizeObserver(S=>{let[k]=S;k&&k.target===u&&m&&t&&(m.unobserve(t),cancelAnimationFrame(g),g=requestAnimationFrame(()=>{var _;(_=m)==null||_.observe(t)})),r()}),u&&!l&&m.observe(u),t&&m.observe(t));let h,x=l?Nt(e):null;l&&y();function y(){let S=Nt(e);x&&!Il(x,S)&&r(),x=S,h=requestAnimationFrame(y)}return r(),()=>{var S;c.forEach(k=>{i&&k.removeEventListener("scroll",r),n&&k.removeEventListener("resize",r)}),p?.(),(S=m)==null||S.disconnect(),m=null,l&&cancelAnimationFrame(h)}}var $l=yl;var Nl=kl,ql=wl,tn=Cl;var jl=xl;var Ul=(e,t,r)=>{let o=new Map,i={platform:Yr,...r},n={...i.platform,_c:o};return vl(e,t,{...i,platform:n})};function Hl(e){return tp(e)}function rn(e){return e.assignedSlot?e.assignedSlot:e.parentNode instanceof ShadowRoot?e.parentNode.host:e.parentNode}function tp(e){for(let t=e;t;t=rn(t))if(t instanceof Element&&getComputedStyle(t).display==="none")return null;for(let t=rn(e);t;t=rn(t)){if(!(t instanceof Element))continue;let r=getComputedStyle(t);if(r.display!=="contents"&&(r.position!=="static"||br(r)||t.tagName==="BODY"))return t}return null}function Vl(e){return e!==null&&typeof e=="object"&&"getBoundingClientRect"in e&&("contextElement"in e?e instanceof Element:!0)}var rp=!!globalThis?.HTMLElement?.prototype.hasOwnProperty("popover"),j=class extends Q{constructor(){super(...arguments),this.localize=new Re(this),this.SUPPORTS_POPOVER=!1,this.active=!1,this.placement="top",this.boundary="viewport",this.distance=0,this.skidding=0,this.arrow=!1,this.arrowPlacement="anchor",this.arrowPadding=10,this.flip=!1,this.flipFallbackPlacements="",this.flipFallbackStrategy="best-fit",this.flipPadding=0,this.shift=!1,this.shiftPadding=0,this.autoSizePadding=0,this.hoverBridge=!1,this.updateHoverBridge=()=>{if(this.hoverBridge&&this.anchorEl&&this.popup){let e=this.anchorEl.getBoundingClientRect(),t=this.popup.getBoundingClientRect(),r=this.placement.includes("top")||this.placement.includes("bottom"),o=0,i=0,n=0,a=0,s=0,l=0,u=0,c=0;r?e.top<t.top?(o=e.left,i=e.bottom,n=e.right,a=e.bottom,s=t.left,l=t.top,u=t.right,c=t.top):(o=t.left,i=t.bottom,n=t.right,a=t.bottom,s=e.left,l=e.top,u=e.right,c=e.top):e.left<t.left?(o=e.right,i=e.top,n=t.left,a=t.top,s=e.right,l=e.bottom,u=t.left,c=t.bottom):(o=t.right,i=t.top,n=e.left,a=e.top,s=t.right,l=t.bottom,u=e.left,c=e.bottom),this.style.setProperty("--hover-bridge-top-left-x",`${o}px`),this.style.setProperty("--hover-bridge-top-left-y",`${i}px`),this.style.setProperty("--hover-bridge-top-right-x",`${n}px`),this.style.setProperty("--hover-bridge-top-right-y",`${a}px`),this.style.setProperty("--hover-bridge-bottom-left-x",`${s}px`),this.style.setProperty("--hover-bridge-bottom-left-y",`${l}px`),this.style.setProperty("--hover-bridge-bottom-right-x",`${u}px`),this.style.setProperty("--hover-bridge-bottom-right-y",`${c}px`)}}}async connectedCallback(){super.connectedCallback(),await this.updateComplete,this.SUPPORTS_POPOVER=rp,this.start()}disconnectedCallback(){super.disconnectedCallback(),this.stop()}async updated(e){super.updated(e),e.has("active")&&(this.active?this.start():this.stop()),e.has("anchor")&&this.handleAnchorChange(),this.active&&(await this.updateComplete,this.reposition())}async handleAnchorChange(){if(await this.stop(),this.anchor&&typeof this.anchor=="string"){let e=this.getRootNode();this.anchorEl=e.getElementById(this.anchor)}else this.anchor instanceof Element||Vl(this.anchor)?this.anchorEl=this.anchor:this.anchorEl=this.querySelector('[slot="anchor"]');this.anchorEl instanceof HTMLSlotElement&&(this.anchorEl=this.anchorEl.assignedElements({flatten:!0})[0]),this.anchorEl&&this.start()}start(){!this.anchorEl||!this.active||!this.isConnected||(this.popup?.showPopover?.(),this.cleanup=Bl(this.anchorEl,this.popup,()=>{this.reposition()}))}async stop(){return new Promise(e=>{this.popup?.hidePopover?.(),this.cleanup?(this.cleanup(),this.cleanup=void 0,this.removeAttribute("data-current-placement"),this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height"),requestAnimationFrame(()=>e())):e()})}reposition(){if(!this.active||!this.anchorEl||!this.popup)return;let e=[$l({mainAxis:this.distance,crossAxis:this.skidding})];this.sync?e.push(tn({apply:({rects:o})=>{let i=this.sync==="width"||this.sync==="both",n=this.sync==="height"||this.sync==="both";this.popup.style.width=i?`${o.reference.width}px`:"",this.popup.style.height=n?`${o.reference.height}px`:""}})):(this.popup.style.width="",this.popup.style.height="");let t;this.SUPPORTS_POPOVER&&!Vl(this.anchor)&&this.boundary==="scroll"&&(t=lt(this.anchorEl).filter(o=>o instanceof Element)),this.flip&&e.push(ql({boundary:this.flipBoundary||t,fallbackPlacements:this.flipFallbackPlacements,fallbackStrategy:this.flipFallbackStrategy==="best-fit"?"bestFit":"initialPlacement",padding:this.flipPadding})),this.shift&&e.push(Nl({boundary:this.shiftBoundary||t,padding:this.shiftPadding})),this.autoSize?e.push(tn({boundary:this.autoSizeBoundary||t,padding:this.autoSizePadding,apply:({availableWidth:o,availableHeight:i})=>{this.autoSize==="vertical"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-height",`${i}px`):this.style.removeProperty("--auto-size-available-height"),this.autoSize==="horizontal"||this.autoSize==="both"?this.style.setProperty("--auto-size-available-width",`${o}px`):this.style.removeProperty("--auto-size-available-width")}})):(this.style.removeProperty("--auto-size-available-width"),this.style.removeProperty("--auto-size-available-height")),this.arrow&&e.push(jl({element:this.arrowEl,padding:this.arrowPadding}));let r=this.SUPPORTS_POPOVER?o=>Yr.getOffsetParent(o,Hl):Yr.getOffsetParent;Ul(this.anchorEl,this.popup,{placement:this.placement,middleware:e,strategy:this.SUPPORTS_POPOVER?"absolute":"fixed",platform:{...Yr,getOffsetParent:r}}).then(({x:o,y:i,middlewareData:n,placement:a})=>{let s=this.localize.dir()==="rtl",l={top:"bottom",right:"left",bottom:"top",left:"right"}[a.split("-")[0]];if(this.setAttribute("data-current-placement",a),Object.assign(this.popup.style,{left:`${o}px`,top:`${i}px`}),this.arrow){let u=n.arrow.x,c=n.arrow.y,p="",g="",m="",h="";if(this.arrowPlacement==="start"){let x=typeof u=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";p=typeof c=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"",g=s?x:"",h=s?"":x}else if(this.arrowPlacement==="end"){let x=typeof u=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:"";g=s?"":x,h=s?x:"",m=typeof c=="number"?`calc(${this.arrowPadding}px - var(--arrow-padding-offset))`:""}else this.arrowPlacement==="center"?(h=typeof u=="number"?"calc(50% - var(--arrow-size-diagonal))":"",p=typeof c=="number"?"calc(50% - var(--arrow-size-diagonal))":""):(h=typeof u=="number"?`${u}px`:"",p=typeof c=="number"?`${c}px`:"");Object.assign(this.arrowEl.style,{top:p,right:g,bottom:m,left:h,[l]:"calc(var(--arrow-base-offset) - var(--arrow-size-diagonal))"})}}),requestAnimationFrame(()=>this.updateHoverBridge()),this.dispatchEvent(new ul)}render(){return C`
      <slot name="anchor" @slotchange=${this.handleAnchorChange}></slot>

      <span
        part="hover-bridge"
        class=${ee({"popup-hover-bridge":!0,"popup-hover-bridge-visible":this.hoverBridge&&this.active})}
      ></span>

      <div
        popover="manual"
        part="popup"
        class=${ee({popup:!0,"popup-active":this.active,"popup-fixed":!this.SUPPORTS_POPOVER,"popup-has-arrow":this.arrow})}
      >
        <slot></slot>
        ${this.arrow?C`<div part="arrow" class="arrow" role="presentation"></div>`:""}
      </div>
    `}};j.css=cl;v([Te(".popup")],j.prototype,"popup",2);v([Te(".arrow")],j.prototype,"arrowEl",2);v([w({attribute:!1,type:Boolean})],j.prototype,"SUPPORTS_POPOVER",2);v([w()],j.prototype,"anchor",2);v([w({type:Boolean,reflect:!0})],j.prototype,"active",2);v([w({reflect:!0})],j.prototype,"placement",2);v([w()],j.prototype,"boundary",2);v([w({type:Number})],j.prototype,"distance",2);v([w({type:Number})],j.prototype,"skidding",2);v([w({type:Boolean})],j.prototype,"arrow",2);v([w({attribute:"arrow-placement"})],j.prototype,"arrowPlacement",2);v([w({attribute:"arrow-padding",type:Number})],j.prototype,"arrowPadding",2);v([w({type:Boolean})],j.prototype,"flip",2);v([w({attribute:"flip-fallback-placements",converter:{fromAttribute:e=>e.split(" ").map(t=>t.trim()).filter(t=>t!==""),toAttribute:e=>e.join(" ")}})],j.prototype,"flipFallbackPlacements",2);v([w({attribute:"flip-fallback-strategy"})],j.prototype,"flipFallbackStrategy",2);v([w({type:Object})],j.prototype,"flipBoundary",2);v([w({attribute:"flip-padding",type:Number})],j.prototype,"flipPadding",2);v([w({type:Boolean})],j.prototype,"shift",2);v([w({type:Object})],j.prototype,"shiftBoundary",2);v([w({attribute:"shift-padding",type:Number})],j.prototype,"shiftPadding",2);v([w({attribute:"auto-size"})],j.prototype,"autoSize",2);v([w()],j.prototype,"sync",2);v([w({type:Object})],j.prototype,"autoSizeBoundary",2);v([w({attribute:"auto-size-padding",type:Number})],j.prototype,"autoSizePadding",2);v([w({attribute:"hover-bridge",type:Boolean})],j.prototype,"hoverBridge",2);j=v([ue("wa-popup")],j);function on(e,t){return new Promise(r=>{function o(i){i.target===e&&(e.removeEventListener(t,o),r())}e.addEventListener(t,o)})}var G=class extends Q{constructor(){super(...arguments),this.placement="top",this.disabled=!1,this.distance=8,this.open=!1,this.skidding=0,this.showDelay=150,this.hideDelay=0,this.trigger="hover focus",this.withoutArrow=!1,this.for=null,this.anchor=null,this.eventController=new AbortController,this.handleBlur=()=>{this.hasTrigger("focus")&&this.hide()},this.handleClick=()=>{this.hasTrigger("click")&&(this.open?this.hide():this.show())},this.handleFocus=()=>{this.hasTrigger("focus")&&this.show()},this.handleDocumentKeyDown=e=>{e.key==="Escape"&&this.open&&bt(this)&&(e.preventDefault(),e.stopPropagation(),this.hide())},this.handleMouseOver=()=>{this.hasTrigger("hover")&&(clearTimeout(this.hoverTimeout),this.hoverTimeout=window.setTimeout(()=>this.show(),this.showDelay))},this.handleMouseOut=e=>{if(this.hasTrigger("hover")){let t=e.relatedTarget,r=!!(t&&this.anchor?.contains(t)),o=!!(t&&this.contains(t));if(r||o)return;clearTimeout(this.hoverTimeout),this.hoverTimeout=window.setTimeout(()=>{this.hide()},this.hideDelay)}}}connectedCallback(){super.connectedCallback(),typeof document<"u"&&(this.eventController.signal.aborted&&(this.eventController=new AbortController),this.addEventListener("mouseout",this.handleMouseOut),this.open&&(this.open=!1,this.updateComplete.then(()=>{this.open=!0})),this.id||(this.id=sl("wa-tooltip-")),this.for&&this.anchor?(this.anchor=null,this.handleForChange()):this.for&&this.handleForChange())}disconnectedCallback(){super.disconnectedCallback(),document.removeEventListener("keydown",this.handleDocumentKeyDown),Ft(this),this.eventController.abort(),this.anchor&&this.removeFromAriaLabelledBy(this.anchor,this.id)}firstUpdated(){this.body.hidden=!this.open,this.open&&(this.popup.active=!0,this.popup.reposition())}hasTrigger(e){return this.trigger.split(" ").includes(e)}addToAriaLabelledBy(e,t){let o=(e.getAttribute("aria-labelledby")||"").split(/\s+/).filter(Boolean);o.includes(t)||(o.push(t),e.setAttribute("aria-labelledby",o.join(" ")))}removeFromAriaLabelledBy(e,t){let i=(e.getAttribute("aria-labelledby")||"").split(/\s+/).filter(Boolean).filter(n=>n!==t);i.length>0?e.setAttribute("aria-labelledby",i.join(" ")):e.removeAttribute("aria-labelledby")}async handleOpenChange(){if(this.open){if(this.disabled)return;let e=new ar;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}document.addEventListener("keydown",this.handleDocumentKeyDown,{signal:this.eventController.signal}),cr(this),this.body.hidden=!1,this.popup.active=!0,await Fe(this.popup.popup,"show-with-scale"),this.popup.reposition(),this.dispatchEvent(new lr)}else{let e=new sr;if(this.dispatchEvent(e),e.defaultPrevented){this.open=!1;return}document.removeEventListener("keydown",this.handleDocumentKeyDown),Ft(this),await Fe(this.popup.popup,"hide-with-scale"),this.popup.active=!1,this.body.hidden=!0,this.dispatchEvent(new ur)}}handleForChange(){let e=this.getRootNode?.();if(!e)return;let t=this.for?e.getElementById?.(this.for):null,r=this.anchor;if(t===r)return;let{signal:o}=this.eventController;t&&(this.addToAriaLabelledBy(t,this.id),t.addEventListener("blur",this.handleBlur,{capture:!0,signal:o}),t.addEventListener("focus",this.handleFocus,{capture:!0,signal:o}),t.addEventListener("click",this.handleClick,{signal:o}),t.addEventListener("mouseover",this.handleMouseOver,{signal:o}),t.addEventListener("mouseout",this.handleMouseOut,{signal:o})),r&&(this.removeFromAriaLabelledBy(r,this.id),r.removeEventListener("blur",this.handleBlur,{capture:!0}),r.removeEventListener("focus",this.handleFocus,{capture:!0}),r.removeEventListener("click",this.handleClick),r.removeEventListener("mouseover",this.handleMouseOver),r.removeEventListener("mouseout",this.handleMouseOut)),this.anchor=t}async handleOptionsChange(){this.hasUpdated&&(await this.updateComplete,this.popup.reposition())}handleDisabledChange(){this.disabled&&this.open&&this.hide()}async show(){if(!this.open)return this.open=!0,on(this,"wa-after-show")}async hide(){if(this.open)return this.open=!1,on(this,"wa-after-hide")}render(){return C`
      <wa-popup
        part="base"
        exportparts="
          popup:base__popup,
          arrow:base__arrow
        "
        class=${ee({tooltip:!0,"tooltip-open":this.open})}
        placement=${this.placement}
        distance=${this.distance}
        skidding=${this.skidding}
        flip
        shift
        ?arrow=${!this.withoutArrow}
        hover-bridge
        .anchor=${this.anchor}
      >
        <div part="body" class="body">
          <slot></slot>
        </div>
      </wa-popup>
    `}};G.css=ll;G.dependencies={"wa-popup":j};v([Te("slot:not([name])")],G.prototype,"defaultSlot",2);v([Te(".body")],G.prototype,"body",2);v([Te("wa-popup")],G.prototype,"popup",2);v([w()],G.prototype,"placement",2);v([w({type:Boolean,reflect:!0})],G.prototype,"disabled",2);v([w({type:Number})],G.prototype,"distance",2);v([w({type:Boolean,reflect:!0})],G.prototype,"open",2);v([w({type:Number})],G.prototype,"skidding",2);v([w({attribute:"show-delay",type:Number})],G.prototype,"showDelay",2);v([w({attribute:"hide-delay",type:Number})],G.prototype,"hideDelay",2);v([w()],G.prototype,"trigger",2);v([w({attribute:"without-arrow",type:Boolean,reflect:!0})],G.prototype,"withoutArrow",2);v([w()],G.prototype,"for",2);v([Lt()],G.prototype,"anchor",2);v([se("open",{waitUntilFirstUpdate:!0})],G.prototype,"handleOpenChange",1);v([se("for")],G.prototype,"handleForChange",1);v([se(["distance","placement","skidding"])],G.prototype,"handleOptionsChange",1);v([se("disabled")],G.prototype,"handleDisabledChange",1);G=v([ue("wa-tooltip")],G);var Wl=W`
  :host {
    display: flex;
    position: relative;
    align-items: stretch;
    border-radius: var(--wa-panel-border-radius);
    background-color: var(--wa-color-fill-quiet, var(--wa-color-brand-fill-quiet));
    border-color: var(--wa-color-border-quiet, var(--wa-color-brand-border-quiet));
    border-style: var(--wa-panel-border-style);
    border-width: var(--wa-panel-border-width);
    color: var(--wa-color-text-normal);
    padding: 1em;
  }

  /* Appearance modifiers */
  :host([appearance~='plain']) {
    background-color: transparent;
    border-color: transparent;
  }

  :host([appearance~='outlined']) {
    background-color: transparent;
    border-color: var(--wa-color-border-loud, var(--wa-color-brand-border-loud));
  }

  :host([appearance~='filled']) {
    background-color: var(--wa-color-fill-quiet, var(--wa-color-brand-fill-quiet));
    border-color: transparent;
  }

  :host([appearance~='filled-outlined']) {
    border-color: var(--wa-color-border-quiet, var(--wa-color-brand-border-quiet));
  }

  :host([appearance~='accent']) {
    color: var(--wa-color-on-loud, var(--wa-color-brand-on-loud));
    background-color: var(--wa-color-fill-loud, var(--wa-color-brand-fill-loud));
    border-color: transparent;

    [part~='icon'] {
      color: currentColor;
    }
  }

  [part~='icon'] {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    color: var(--wa-color-on-quiet);
    font-size: 1.25em;
  }

  ::slotted([slot='icon']) {
    margin-inline-end: var(--wa-form-control-padding-inline);
  }

  [part~='message'] {
    flex: 1 1 auto;
    display: block;
    overflow: hidden;
  }
`;var wt=class extends Q{constructor(){super(...arguments),this.variant="brand",this.size="m"}handleSizeChange(){So(this.localName,this.size)}render(){return C`
      <div part="icon">
        <slot name="icon"></slot>
      </div>

      <div part="message">
        <slot></slot>
      </div>
    `}};wt.css=[Wl,Lo,Fo];v([w({reflect:!0})],wt.prototype,"variant",2);v([w({reflect:!0})],wt.prototype,"appearance",2);v([w({reflect:!0})],wt.prototype,"size",2);v([se("size")],wt.prototype,"handleSizeChange",1);wt=v([ue("wa-callout")],wt);var nn=class extends Error{cause;isNetworkError;request;constructor(t,r=null){super("This looks like a network error, the endpoint might be blocked by an internet provider or a firewall."),this.cause=t,this.isNetworkError=!0,this.request=r}},xr=nn;var an=class{#e;#t=!1;#o;#r;constructor(t,r){this.#r=t,this.#o=()=>r(t)}progress(){this.#t||this.#r>0&&(clearTimeout(this.#e),this.#e=setTimeout(this.#o,this.#r))}done(){this.#t||(clearTimeout(this.#e),this.#e=void 0,this.#t=!0)}},Gl=an;var Uo=()=>{};function sn(e,t={}){let{body:r=null,headers:o={},method:i="GET",onBeforeRequest:n=Uo,onUploadProgress:a=Uo,shouldRetry:s=()=>!0,onAfterResponse:l=Uo,onTimeout:u=Uo,responseType:c,retries:p=3,signal:g=null,timeout:m=3e4,withCredentials:h=!1}=t,x=k=>.3*2**(k-1)*1e3,y=new Gl(m,u);function S(k=0){return new Promise(async(_,T)=>{let E=new XMLHttpRequest,A=O=>{s(E)&&k<p?setTimeout(()=>{S(k+1).then(_,T)},x(k)):(y.done(),T(O))};E.open(i,e,!0),E.withCredentials=h,c&&(E.responseType=c),E.onload=async()=>{try{await l(E,k)}catch(O){O.request=E,A(O);return}E.status>=200&&E.status<300?(y.done(),_(E)):s(E)&&k<p?setTimeout(()=>{S(k+1).then(_,T)},x(k)):(y.done(),T(new xr(E.statusText,E)))},E.onerror=()=>A(new xr(E.statusText,E)),E.upload.onprogress=O=>{y.progress(),a(O)},o&&Object.keys(o).forEach(O=>{E.setRequestHeader(O,o[O])});function z(){E.abort(),T(new DOMException("Aborted","AbortError"))}if(g?.addEventListener("abort",z),g?.aborted){z();return}await n(E,k),E.send(r)})}return S()}var op=e=>"error"in e&&!!e.error,ip=e=>e.progress.uploadComplete;function ln(e){return e.filter(t=>!op(t)&&!ip(t))}function un(e){return e.filter(t=>!t.progress?.uploadStarted||!t.isRestored)}function wr(e){let t=e.lastIndexOf(".");return t===-1||t===e.length-1?{name:e,extension:void 0}:{name:e.slice(0,t),extension:e.slice(t+1)}}var cn={__proto__:null,md:"text/markdown",markdown:"text/markdown",mp4:"video/mp4",mp3:"audio/mp3",svg:"image/svg+xml",jpg:"image/jpeg",png:"image/png",webp:"image/webp",gif:"image/gif",heic:"image/heic",heif:"image/heif",yaml:"text/yaml",yml:"text/yaml",csv:"text/csv",tsv:"text/tab-separated-values",tab:"text/tab-separated-values",avi:"video/x-msvideo",mks:"video/x-matroska",mkv:"video/x-matroska",mov:"video/quicktime",dicom:"application/dicom",doc:"application/msword",msg:"application/vnd.ms-outlook",docm:"application/vnd.ms-word.document.macroenabled.12",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",dot:"application/msword",dotm:"application/vnd.ms-word.template.macroenabled.12",dotx:"application/vnd.openxmlformats-officedocument.wordprocessingml.template",xla:"application/vnd.ms-excel",xlam:"application/vnd.ms-excel.addin.macroenabled.12",xlc:"application/vnd.ms-excel",xlf:"application/x-xliff+xml",xlm:"application/vnd.ms-excel",xls:"application/vnd.ms-excel",xlsb:"application/vnd.ms-excel.sheet.binary.macroenabled.12",xlsm:"application/vnd.ms-excel.sheet.macroenabled.12",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",xlt:"application/vnd.ms-excel",xltm:"application/vnd.ms-excel.template.macroenabled.12",xltx:"application/vnd.openxmlformats-officedocument.spreadsheetml.template",xlw:"application/vnd.ms-excel",txt:"text/plain",text:"text/plain",conf:"text/plain",log:"text/plain",pdf:"application/pdf",zip:"application/zip","7z":"application/x-7z-compressed",rar:"application/x-rar-compressed",tar:"application/x-tar",gz:"application/gzip",dmg:"application/x-apple-diskimage"};function yr(e){if(e.type)return e.type;let t=e.name?wr(e.name).extension?.toLowerCase():null;return t&&t in cn?cn[t]:"application/octet-stream"}function np(e){return e.charCodeAt(0).toString(32)}function Yl(e){let t="";return e.replace(/[^A-Z0-9]/gi,r=>(t+=`-${np(r)}`,"/"))+t}function dn(e,t){let r=t||"uppy";return typeof e.name=="string"&&(r+=`-${Yl(e.name.toLowerCase())}`),e.type!==void 0&&(r+=`-${e.type}`),e.meta&&typeof e.meta.relativePath=="string"&&(r+=`-${Yl(e.meta.relativePath.toLowerCase())}`),e.data?.size!==void 0&&(r+=`-${e.data.size}`),e.data.lastModified!==void 0&&(r+=`-${e.data.lastModified}`),r}function ap(e){return!e.isRemote||!e.remote?!1:new Set(["box","dropbox","drive","facebook","unsplash"]).has(e.remote.provider)}function pn(e,t){if(ap(e))return e.id;let r=yr(e);return dn({...e,type:r},t)}function Xr(e,t){return e===!0?Object.keys(t):Array.isArray(e)?e:[]}function fn(e){return e<10?`0${e}`:e.toString()}function qt(){let e=new Date,t=fn(e.getHours()),r=fn(e.getMinutes()),o=fn(e.getSeconds());return`${t}:${r}:${o}`}function sp(e){return e?e.readyState===4&&e.status===0:!1}var mn=sp;var Kr=class{#e=[];#t=0;#o;#r=!1;constructor(t){let r=t?.concurrency;this.#o=typeof r!="number"||r===0?1/0:r}add(t){let r=new AbortController,o,i,n=new Promise((s,l)=>{o=s,i=l}),a={run:()=>t(r.signal),resolve:o,reject:i,controller:r};return r.signal.addEventListener("abort",()=>{let s=this.#e.indexOf(a);s!==-1&&(this.#e.splice(s,1),i(r.signal.reason??new DOMException("Aborted","AbortError")))},{once:!0}),n.abort=s=>{r.abort(s??new DOMException("Aborted","AbortError"))},n.abortOn=s=>{if(s){let l=()=>n.abort(s.reason);s.addEventListener("abort",l,{once:!0}),n.then(()=>s.removeEventListener("abort",l),()=>s.removeEventListener("abort",l))}return n},!this.#r&&this.#t<this.#o?this.#n(a):this.#e.push(a),n}#n(t){if(this.#t++,t.controller.signal.aborted){this.#t--,t.reject(t.controller.signal.reason??new DOMException("Aborted","AbortError")),this.#i();return}let r;try{r=t.run()}catch(o){r=Promise.reject(o)}r.then(o=>{t.controller.signal.aborted?t.reject(t.controller.signal.reason??new DOMException("Aborted","AbortError")):t.resolve(o)},o=>{t.reject(o)}).finally(()=>{this.#t--,this.#i()})}#i(){queueMicrotask(()=>{if(!(this.#r||this.#t>=this.#o))for(;this.#e.length>0;){let t=this.#e.shift();if(!t.controller.signal.aborted){this.#n(t);return}}})}pause(){this.#r=!0}resume(){this.#r=!1;let t=this.#o-this.#t;for(let r=0;r<t;r++)this.#i()}clear(t){let r=this.#e.splice(0),o=t??new DOMException("Cleared","AbortError");for(let i of r)i.controller.abort(o),i.reject(o)}get concurrency(){return this.#o}set concurrency(t){if(this.#o=typeof t!="number"||t===0?1/0:t,!this.#r){let r=this.#o-this.#t;for(let o=0;o<r;o++)this.#i()}}get pending(){return this.#e.length}get running(){return this.#t}get isPaused(){return this.#r}wrapPromiseFunction(t){return(...r)=>this.add(o=>t(...r))}};function lp(e,t,r){let o=[];return e.forEach(i=>typeof i!="string"?o.push(i):t[Symbol.split](i).forEach((n,a,s)=>{n!==""&&o.push(n),a<s.length-1&&o.push(r)})),o}function Xl(e,t){let r=/\$/g,o="$$$$",i=[e];if(t==null)return i;for(let n of Object.keys(t))if(n!=="_"){let a=t[n];typeof a=="string"&&(a=r[Symbol.replace](a,o)),i=lp(i,new RegExp(`%\\{${n}\\}`,"g"),a)}return i}var up=e=>{throw new Error(`missing string: ${e}`)},yt=class{locale;constructor(t,{onMissingKey:r=up}={}){this.locale={strings:{},pluralize(o){return o===1?0:1}},Array.isArray(t)?t.forEach(this.#t,this):this.#t(t),this.#e=r}#e;#t(t){if(!t?.strings)return;let r=this.locale;Object.assign(this.locale,{strings:{...r.strings,...t.strings},pluralize:t.pluralize||r.pluralize})}translate(t,r){return this.translateArray(t,r).join("")}translateArray(t,r){let o=this.locale.strings[t];if(o==null&&(this.#e(t),o=t),typeof o=="object"){if(r&&typeof r.smart_count<"u"){let n=this.locale.pluralize(r.smart_count);return Xl(o[n],r)}throw new Error("Attempted to use a string with plural forms, but no value was given for %{smart_count}")}if(typeof o!="string")throw new Error("string was not a string");return Xl(o,r)}};var kr=class{uppy;opts;id;defaultLocale;i18n;i18nArray;type;VERSION;constructor(t,r){this.uppy=t,this.opts=r??{}}getPluginState(){let{plugins:t}=this.uppy.getState();return t?.[this.id]||{}}setPluginState(t){let{plugins:r}=this.uppy.getState();this.uppy.setState({plugins:{...r,[this.id]:{...r[this.id],...t}}})}setOptions(t){this.opts={...this.opts,...t},this.setPluginState(void 0),this.i18nInit()}i18nInit(){let t=new yt([this.defaultLocale,this.uppy.locale,this.opts.locale]);this.i18n=t.translate.bind(t),this.i18nArray=t.translateArray.bind(t),this.setPluginState(void 0)}addTarget(t){throw new Error("Extend the addTarget method to add your plugin to another plugin's target")}install(){}uninstall(){}update(t){}afterUpdate(){}};var Cr=class{#e;#t=[];constructor(t){this.#e=t}on(t,r){return this.#t.push([t,r]),this.#e.on(t,r)}remove(){for(let[t,r]of this.#t.splice(0))this.#e.off(t,r)}onFilePause(t,r){this.on("upload-pause",(o,i)=>{t===o?.id&&r(i)})}onFileRemove(t,r){this.on("file-removed",o=>{t===o.id&&r(o.id)})}onPause(t,r){this.on("upload-pause",(o,i)=>{t===o?.id&&r(i)})}onRetry(t,r){this.on("upload-retry",o=>{t===o?.id&&r()})}onRetryAll(t,r){this.on("retry-all",()=>{this.#e.getFile(t)&&r()})}onPauseAll(t,r){this.on("pause-all",()=>{this.#e.getFile(t)&&r()})}onCancelAll(t,r){this.on("cancel-all",(...o)=>{this.#e.getFile(t)&&r(...o)})}onResumeAll(t,r){this.on("resume-all",()=>{this.#e.getFile(t)&&r()})}};var Kl={debug:()=>{},warn:()=>{},error:(...e)=>console.error(`[Uppy] [${qt()}]`,...e)},Zl={debug:(...e)=>console.debug(`[Uppy] [${qt()}]`,...e),warn:(...e)=>console.warn(`[Uppy] [${qt()}]`,...e),error:(...e)=>console.error(`[Uppy] [${qt()}]`,...e)};var Zr=ko(Ql(),1),nu=ko(iu(),1),au={maxFileSize:null,minFileSize:null,maxTotalFileSize:null,maxNumberOfFiles:null,minNumberOfFiles:null,allowedFileTypes:null,requiredMetaFields:[]},_e=class extends Error{isUserFacing;file;constructor(t,r){super(t),this.isUserFacing=r?.isUserFacing??!0,r?.file&&(this.file=r.file)}isRestriction=!0},Ho=class{getI18n;getOpts;constructor(t,r){this.getI18n=r,this.getOpts=()=>{let o=t();if(o.restrictions?.allowedFileTypes!=null&&!Array.isArray(o.restrictions.allowedFileTypes))throw new TypeError("`restrictions.allowedFileTypes` must be an array");return o}}validateAggregateRestrictions(t,r){let{maxTotalFileSize:o,maxNumberOfFiles:i}=this.getOpts().restrictions;if(i&&t.filter(a=>!a.isGhost).length+r.length>i)throw new _e(`${this.getI18n()("youCanOnlyUploadX",{smart_count:i})}`);if(o){let n=[...t,...r].reduce((a,s)=>a+(s.size??0),0);if(n>o)throw new _e(this.getI18n()("aggregateExceedsSize",{sizeAllowed:(0,Zr.default)(o),size:(0,Zr.default)(n)}))}}validateSingleFile(t){let{maxFileSize:r,minFileSize:o,allowedFileTypes:i}=this.getOpts().restrictions;if(i&&!i.some(a=>a.includes("/")?t.type?(0,nu.default)(t.type.replace(/;.*?$/,""),a):!1:a[0]==="."&&t.extension?t.extension.toLowerCase()===a.slice(1).toLowerCase():!1)){let a=i.join(", ");throw new _e(this.getI18n()("youCanOnlyUploadFileTypes",{types:a}),{file:t})}if(r&&t.size!=null&&t.size>r)throw new _e(this.getI18n()("exceedsSize",{size:(0,Zr.default)(r),file:t.name??this.getI18n()("unnamed")}),{file:t});if(o&&t.size!=null&&t.size<o)throw new _e(this.getI18n()("inferiorSize",{size:(0,Zr.default)(o)}),{file:t})}validate(t,r){r.forEach(o=>{this.validateSingleFile(o)}),this.validateAggregateRestrictions(t,r)}validateMinNumberOfFiles(t){let{minNumberOfFiles:r}=this.getOpts().restrictions;if(r&&Object.keys(t).length<r)throw new _e(this.getI18n()("youHaveToAtLeastSelectX",{smart_count:r}))}getMissingRequiredMetaFields(t){let r=new _e(this.getI18n()("missingRequiredMetaFieldOnFile",{fileName:t.name??this.getI18n()("unnamed")})),{requiredMetaFields:o}=this.getOpts().restrictions,i=[];for(let n of o)(!Object.hasOwn(t.meta,n)||t.meta[n]==="")&&i.push(n);return{missingFields:i,error:r}}};var su={name:"@uppy/store-default",description:"The default simple object-based store for Uppy.",version:"5.0.0",license:"MIT",main:"lib/index.js",type:"module",sideEffects:!1,scripts:{build:"tsc --build tsconfig.build.json",typecheck:"tsc --build",test:"vitest run --environment=jsdom --silent='passed-only'"},keywords:["file uploader","uppy","uppy-store"],homepage:"https://uppy.io",bugs:{url:"https://github.com/transloadit/uppy/issues"},devDependencies:{jsdom:"^26.1.0",typescript:"^5.8.3",vitest:"^3.2.4"},repository:{type:"git",url:"git+https://github.com/transloadit/uppy.git"},exports:{".":"./lib/index.js","./package.json":"./package.json"},files:["src","lib","dist","CHANGELOG.md"]};var hn=class{static VERSION=su.version;state={};#e=new Set;getState(){return this.state}setState(t){let r={...this.state},o={...this.state,...t};this.state=o,this.#t(r,o,t)}subscribe(t){return this.#e.add(t),()=>{this.#e.delete(t)}}#t(...t){this.#e.forEach(r=>{r(...t)})}},lu=hn;var Yu=ko(ju(),1),Xu=ko(Hu(),1);var af="useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";var Vu=(e=21)=>{let t="",r=e|0;for(;r-- >0;)t+=af[Math.random()*64|0];return t};var Wu={name:"@uppy/core",description:"Core module for the extensible JavaScript file upload widget with support for drag&drop, resumable uploads, previews, restrictions, file processing/encoding, remote providers like Instagram, Dropbox, Google Drive, S3 and more :dog:",version:"5.2.0",license:"MIT",style:"dist/style.min.css",type:"module",sideEffects:["*.css"],scripts:{build:"tsc --build tsconfig.build.json","build:css":"sass --load-path=../../ src/style.scss dist/style.css && postcss dist/style.css -u cssnano -o dist/style.min.css",typecheck:"tsc --build",test:"vitest run --environment=jsdom --silent='passed-only'"},keywords:["file uploader","uppy","uppy-plugin"],homepage:"https://uppy.io",bugs:{url:"https://github.com/transloadit/uppy/issues"},repository:{type:"git",url:"git+https://github.com/transloadit/uppy.git"},files:["src","lib","dist","CHANGELOG.md"],exports:{".":"./lib/index.js","./css/style.min.css":"./dist/style.min.css","./css/style.css":"./dist/style.css","./css/style.scss":"./src/style.scss","./package.json":"./package.json"},dependencies:{"@transloadit/prettier-bytes":"^0.3.4","@uppy/store-default":"^5.0.0","@uppy/utils":"^7.1.4",lodash:"^4.17.21","mime-match":"^1.0.2","namespace-emitter":"^2.0.1",nanoid:"^5.0.9",preact:"^10.5.13"},devDependencies:{"@types/deep-freeze":"^0",cssnano:"^7.0.7","deep-freeze":"^0.0.1",jsdom:"^26.1.0",postcss:"^8.5.6","postcss-cli":"^11.0.1",sass:"^1.89.2",typescript:"^5.8.3",vitest:"^3.2.4"}};function xn(e,t){return t.name?t.name:e.split("/")[0]==="image"?`${e.split("/")[0]}.${e.split("/")[1]}`:"noname"}var Gu={strings:{addBulkFilesFailed:{0:"Failed to add %{smart_count} file due to an internal error",1:"Failed to add %{smart_count} files due to internal errors"},youCanOnlyUploadX:{0:"You can only upload %{smart_count} file",1:"You can only upload %{smart_count} files"},youHaveToAtLeastSelectX:{0:"You have to select at least %{smart_count} file",1:"You have to select at least %{smart_count} files"},aggregateExceedsSize:"You selected %{size} of files, but maximum allowed size is %{sizeAllowed}",exceedsSize:"%{file} exceeds maximum allowed size of %{size}",missingRequiredMetaField:"Missing required meta fields",missingRequiredMetaFieldOnFile:"Missing required meta fields in %{fileName}",inferiorSize:"This file is smaller than the allowed size of %{size}",youCanOnlyUploadFileTypes:"You can only upload: %{types}",noMoreFilesAllowed:"Cannot add more files",noDuplicates:"Cannot add the duplicate file '%{fileName}', it already exists",companionError:"Connection with Companion failed",authAborted:"Authentication aborted",companionUnauthorizeHint:"To unauthorize to your %{provider} account, please go to %{url}",failedToUpload:"Failed to upload %{file}",noInternetConnection:"No Internet connection",connectedToInternet:"Connected to the Internet",noFilesFound:"You have no files or folders here",noSearchResults:"Unfortunately, there are no results for this search",selectX:{0:"Select %{smart_count}",1:"Select %{smart_count}"},allFilesFromFolderNamed:"All files from folder %{name}",openFolderNamed:"Open folder %{name}",cancel:"Cancel",logOut:"Log out",logIn:"Log in",pickFiles:"Pick files",pickPhotos:"Pick photos",filter:"Filter",resetFilter:"Reset filter",loading:"Loading...",loadedXFiles:"Loaded %{numFiles} files",authenticateWithTitle:"Please authenticate with %{pluginName} to select files",authenticateWith:"Connect to %{pluginName}",signInWithGoogle:"Sign in with Google",searchImages:"Search for images",enterTextToSearch:"Enter text to search for images",search:"Search",resetSearch:"Reset search",emptyFolderAdded:"No files were added from empty folder",addedNumFiles:"Added %{numFiles} file(s)",folderAlreadyAdded:'The folder "%{folder}" was already added',folderAdded:{0:"Added %{smart_count} file from %{folder}",1:"Added %{smart_count} files from %{folder}"},additionalRestrictionsFailed:"%{count} additional restrictions were not fulfilled",unnamed:"Unnamed",pleaseWait:"Please wait"}};function wn(e){if(e==null&&typeof navigator<"u"&&(e=navigator.userAgent),!e)return!0;let t=/Edge\/(\d+\.\d+)/.exec(e);if(!t)return!0;let o=t[1].split(".",2),i=parseInt(o[0],10),n=parseInt(o[1],10);return i<15||i===15&&n<15063||i>18||i===18&&n>=18218}var Wo={totalProgress:0,allowNewUpload:!0,error:null,recoveredState:null},yn=class e{static VERSION=Wu.version;#e=Object.create(null);#t;#o;#r=(0,Xu.default)();#n=new Set;#i=new Set;#a=new Set;defaultLocale;locale;opts;store;i18n;i18nArray;scheduledAutoProceed=null;wasOffline=!1;constructor(t){this.defaultLocale=Gu;let r={id:"uppy",autoProceed:!1,allowMultipleUploadBatches:!0,debug:!1,restrictions:au,meta:{},onBeforeFileAdded:(i,n)=>!Object.hasOwn(n,i.id),onBeforeUpload:i=>i,store:new lu,logger:Kl,infoTimeout:5e3},o={...r,...t};this.opts={...o,restrictions:{...r.restrictions,...t?.restrictions}},t?.logger&&t.debug?this.log("You are using a custom `logger`, but also set `debug: true`, which uses built-in logger to output logs to console. Ignoring `debug: true` and using your custom `logger`.","warning"):t?.debug&&(this.opts.logger=Zl),this.log(`Using Core v${e.VERSION}`),this.i18nInit(),this.store=this.opts.store,this.setState({...Wo,plugins:{},files:{},currentUploads:{},capabilities:{uploadProgress:wn(),individualCancellation:!0,resumableUploads:!1},meta:{...this.opts.meta},info:[]}),this.#t=new Ho(()=>this.opts,()=>this.i18n),this.#o=this.store.subscribe((i,n,a)=>{this.emit("state-update",i,n,a),this.updateAll(n)}),this.opts.debug&&typeof window<"u"&&(window[this.opts.id]=this),this.#T()}emit(t,...r){this.#r.emit(t,...r)}on(t,r){return this.#r.on(t,r),this}once(t,r){return this.#r.once(t,r),this}off(t,r){return this.#r.off(t,r),this}updateAll(t){this.iteratePlugins(r=>{r.update(t)})}setState(t){this.store.setState(t)}getState(){return this.store.getState()}patchFilesState(t){let r=this.getState().files;this.setState({files:{...r,...Object.fromEntries(Object.entries(t).map(([o,i])=>[o,{...r[o],...i}]))}})}setFileState(t,r){if(!this.getState().files[t])throw new Error(`Can\u2019t set state for ${t} (the file could have been removed)`);this.patchFilesState({[t]:r})}i18nInit(){let t=o=>this.log(`Missing i18n string: ${o}`,"error"),r=new yt([this.defaultLocale,this.opts.locale],{onMissingKey:t});this.i18n=r.translate.bind(r),this.i18nArray=r.translateArray.bind(r),this.locale=r.locale}setOptions(t){this.opts={...this.opts,...t,restrictions:{...this.opts.restrictions,...t?.restrictions}},t.meta&&this.setMeta(t.meta),this.i18nInit(),t.locale&&this.iteratePlugins(r=>{r.setOptions(t)}),this.setState(void 0)}resetProgress(){let t={percentage:0,bytesUploaded:!1,uploadComplete:!1,uploadStarted:null},r={...this.getState().files},o=Object.create(null);Object.keys(r).forEach(i=>{o[i]={...r[i],progress:{...r[i].progress,...t},tus:void 0,transloadit:void 0}}),this.setState({files:o,...Wo})}clear(){let{capabilities:t,currentUploads:r}=this.getState();if(Object.keys(r).length>0&&!t.individualCancellation)throw new Error("The installed uploader plugin does not allow removing files during an upload.");this.setState({...Wo,files:{}})}addPreProcessor(t){this.#n.add(t)}removePreProcessor(t){return this.#n.delete(t)}addPostProcessor(t){this.#a.add(t)}removePostProcessor(t){return this.#a.delete(t)}addUploader(t){this.#i.add(t)}removeUploader(t){return this.#i.delete(t)}setMeta(t){let r={...this.getState().meta,...t},o={...this.getState().files};Object.keys(o).forEach(i=>{o[i]={...o[i],meta:{...o[i].meta,...t}}}),this.log("Adding metadata:"),this.log(t),this.setState({meta:r,files:o})}setFileMeta(t,r){let o={...this.getState().files};if(!o[t]){this.log(`Was trying to set metadata for a file that has been removed: ${t}`);return}let i={...o[t].meta,...r};o[t]={...o[t],meta:i},this.setState({files:o})}getFile(t){return this.getState().files[t]}getFiles(){let{files:t}=this.getState();return Object.values(t)}getFilesByIds(t){return t.map(r=>this.getFile(r))}getObjectOfFilesPerState(){let{files:t,totalProgress:r,error:o}=this.getState(),i=Object.values(t),n=[],a=[],s=[],l=[],u=[],c=[],p=[],g=[],m=[];for(let h of i){let{progress:x}=h;!x.uploadComplete&&x.uploadStarted&&(n.push(h),h.isPaused||g.push(h)),x.uploadStarted||a.push(h),(x.uploadStarted||x.preprocess||x.postprocess)&&s.push(h),x.uploadStarted&&l.push(h),h.isPaused&&u.push(h),x.uploadComplete&&c.push(h),h.error&&p.push(h),(x.preprocess||x.postprocess)&&m.push(h)}return{newFiles:a,startedFiles:s,uploadStartedFiles:l,pausedFiles:u,completeFiles:c,erroredFiles:p,inProgressFiles:n,inProgressNotPausedFiles:g,processingFiles:m,isUploadStarted:l.length>0,isAllComplete:r===100&&c.length===i.length&&m.length===0,isAllErrored:!!o&&p.length===i.length,isAllPaused:n.length!==0&&u.length===n.length,isUploadInProgress:n.length>0,isSomeGhost:i.some(h=>h.isGhost)}}#s(t){for(let a of t)a.isRestriction?this.emit("restriction-failed",a.file,a):this.emit("error",a,a.file),this.log(a,"warning");let r=t.filter(a=>a.isUserFacing),o=4,i=r.slice(0,o),n=r.slice(o);i.forEach(({message:a,details:s=""})=>{this.info({message:a,details:s},"error",this.opts.infoTimeout)}),n.length>0&&this.info({message:this.i18n("additionalRestrictionsFailed",{count:n.length})})}validateRestrictions(t,r=this.getFiles()){try{this.#t.validate(r,[t])}catch(o){return o}return null}validateSingleFile(t){try{this.#t.validateSingleFile(t)}catch(r){return r.message}return null}validateAggregateRestrictions(t){let r=this.getFiles();try{this.#t.validateAggregateRestrictions(r,t)}catch(o){return o.message}return null}#u(t){let{missingFields:r,error:o}=this.#t.getMissingRequiredMetaFields(t);return r.length>0?(this.setFileState(t.id,{missingRequiredMetaFields:r,error:o.message}),this.log(o.message),this.emit("restriction-failed",t,o),!1):(r.length===0&&t.missingRequiredMetaFields&&this.setFileState(t.id,{missingRequiredMetaFields:[]}),!0)}#w(t){let r=!0;for(let o of Object.values(t))this.#u(o)||(r=!1);return r}#y(t){let{allowNewUpload:r}=this.getState();if(r===!1){let o=new _e(this.i18n("noMoreFilesAllowed"),{file:t});throw this.#s([o]),o}}checkIfFileAlreadyExists(t){let{files:r}=this.getState();return!!(r[t]&&!r[t].isGhost)}#k(t){let r=t instanceof File?{name:t.name,type:t.type,size:t.size,data:t,meta:{},isRemote:!1,source:void 0,preview:void 0}:t,o=yr(r),i=xn(o,r),n=wr(i).extension,a=pn(r,this.getID()),s={...r.meta,name:i,type:o},l=Number.isFinite(r.data.size)?r.data.size:null;return{source:r.source||"",id:a,name:i,extension:n||"",meta:{...this.getState().meta,...s},type:o,progress:{percentage:0,bytesUploaded:!1,bytesTotal:l,uploadComplete:!1,uploadStarted:null},size:l,isGhost:!1,...r.isRemote?{isRemote:!0,remote:r.remote,data:r.data}:{isRemote:!1,data:r.data},preview:r.preview}}#f(){this.opts.autoProceed&&!this.scheduledAutoProceed&&(this.scheduledAutoProceed=setTimeout(()=>{this.scheduledAutoProceed=null,this.upload().catch(t=>{t.isRestriction||this.log(t.stack||t.message||t)})},4))}#m(t){let{files:r}=this.getState(),o={...r},i=[],n=[];for(let a of t)try{let s=this.#k(a);this.#y(s);let l=r[s.id],u=l?.isGhost;if(u&&!s.isRemote){if(s.data==null)throw new Error("File data is missing");s={...l,isGhost:!1,data:s.data},this.log(`Replaced the blob in the restored ghost file: ${s.name}, ${s.id}`)}let c=this.opts.onBeforeFileAdded(s,o);if(r=this.getState().files,o={...r,...o},!c&&this.checkIfFileAlreadyExists(s.id))throw new _e(this.i18n("noDuplicates",{fileName:s.name??this.i18n("unnamed")}),{file:s});if(c===!1&&!u)throw new _e("Cannot add the file because onBeforeFileAdded returned false.",{isUserFacing:!1,file:s});typeof c=="object"&&c!==null&&(s=c),this.#t.validateSingleFile(s),o[s.id]=s,i.push(s)}catch(s){n.push(s)}try{this.#t.validateAggregateRestrictions(Object.values(r),i)}catch(a){return n.push(a),{nextFilesState:r,validFilesToAdd:[],errors:n}}return{nextFilesState:o,validFilesToAdd:i,errors:n}}addFile(t){let{nextFilesState:r,validFilesToAdd:o,errors:i}=this.#m([t]),n=i.filter(s=>s.isRestriction);if(this.#s(n),i.length>0)throw i[0];this.setState({files:r});let[a]=o;return this.emit("file-added",a),this.emit("files-added",o),this.log(`Added file: ${a.name}, ${a.id}, mime type: ${a.type}`),this.#f(),a.id}addFiles(t){let{nextFilesState:r,validFilesToAdd:o,errors:i}=this.#m(t),n=i.filter(s=>s.isRestriction);this.#s(n);let a=i.filter(s=>!s.isRestriction);if(a.length>0){let s=`Multiple errors occurred while adding files:
`;if(a.forEach(l=>{s+=`
 * ${l.message}`}),this.info({message:this.i18n("addBulkFilesFailed",{smart_count:a.length}),details:s},"error",this.opts.infoTimeout),typeof AggregateError=="function")throw new AggregateError(a,s);{let l=new Error(s);throw l.errors=a,l}}this.setState({files:r}),o.forEach(s=>{this.emit("file-added",s)}),this.emit("files-added",o),o.length>5?this.log(`Added batch of ${o.length} files`):Object.values(o).forEach(s=>{this.log(`Added file: ${s.name}
 id: ${s.id}
 type: ${s.type}`)}),o.length>0&&this.#f()}removeFiles(t){let{files:r,currentUploads:o}=this.getState(),i={...r},n={...o},a=Object.create(null);t.forEach(c=>{r[c]&&(a[c]=r[c],delete i[c])});function s(c){return a[c]===void 0}Object.keys(n).forEach(c=>{let p=o[c].fileIDs.filter(s);if(p.length===0){delete n[c];return}let{capabilities:g}=this.getState();if(p.length!==o[c].fileIDs.length&&!g.individualCancellation)throw new Error("The installed uploader plugin does not allow removing files during an upload.");n[c]={...o[c],fileIDs:p}});let l={currentUploads:n,files:i};Object.keys(i).length===0&&(l.allowNewUpload=!0,l.error=null,l.recoveredState=null),this.setState(l),this.#c();let u=Object.keys(a);u.forEach(c=>{this.emit("file-removed",a[c])}),u.length>5?this.log(`Removed ${u.length} files`):this.log(`Removed files: ${u.join(", ")}`)}removeFile(t){this.removeFiles([t])}pauseResume(t){if(!this.getState().capabilities.resumableUploads||this.getFile(t).progress.uploadComplete)return;let r=this.getFile(t),i=!(r.isPaused||!1);return this.setFileState(t,{isPaused:i}),this.emit("upload-pause",r,i),i}pauseAll(){let t={...this.getState().files};Object.keys(t).filter(o=>!t[o].progress.uploadComplete&&t[o].progress.uploadStarted).forEach(o=>{let i={...t[o],isPaused:!0};t[o]=i}),this.setState({files:t}),this.emit("pause-all")}resumeAll(){let t={...this.getState().files};Object.keys(t).filter(o=>!t[o].progress.uploadComplete&&t[o].progress.uploadStarted).forEach(o=>{let i={...t[o],isPaused:!1,error:null};t[o]=i}),this.setState({files:t}),this.emit("resume-all")}#h(){let{files:t}=this.getState();return Object.keys(t).filter(r=>{let o=t[r];return o.error&&(!o.missingRequiredMetaFields||o.missingRequiredMetaFields.length===0)})}async#g(){let t=this.#h(),r={...this.getState().files};if(t.forEach(i=>{r[i]={...r[i],isPaused:!1,error:null}}),this.setState({files:r,error:null}),this.emit("retry-all",this.getFilesByIds(t)),t.length===0)return{successful:[],failed:[]};let o=this.#d(t,{forceAllowNewUpload:!0});return this.#p(o)}async retryAll(){let t=await this.#g();return this.emit("complete",t),t}cancelAll(){this.emit("cancel-all");let{files:t}=this.getState(),r=Object.keys(t);r.length&&this.removeFiles(r),this.setState(Wo)}retryUpload(t){this.setFileState(t,{error:null,isPaused:!1}),this.emit("upload-retry",this.getFile(t));let r=this.#d([t],{forceAllowNewUpload:!0});return this.#p(r)}logout(){this.iteratePlugins(t=>{t.provider?.logout?.()})}#C=(t,r)=>{let o=t?this.getFile(t.id):void 0;if(t==null||!o){this.log(`Not setting progress for a file that has been removed: ${t?.id}`);return}if(o.progress.percentage===100){this.log(`Not setting progress for a file that has been already uploaded: ${t.id}`);return}let i={bytesTotal:r.bytesTotal,percentage:r.bytesTotal!=null&&Number.isFinite(r.bytesTotal)&&r.bytesTotal>0?Math.round(r.bytesUploaded/r.bytesTotal*100):void 0};o.progress.uploadStarted!=null?this.setFileState(t.id,{progress:{...o.progress,...i,bytesUploaded:r.bytesUploaded}}):this.setFileState(t.id,{progress:{...o.progress,...i}}),this.#c()};#b(){let t=this.#E(),r=null;t!=null&&(r=Math.round(t*100),r>100?r=100:r<0&&(r=0)),this.emit("progress",r??0),this.setState({totalProgress:r??0})}#c=(0,Yu.default)(()=>this.#b(),500,{leading:!0,trailing:!0});[Symbol.for("uppy test: updateTotalProgress")](){return this.#b()}#E(){let r=this.getFiles().filter(l=>l.progress.uploadStarted||l.progress.preprocess||l.progress.postprocess);if(r.length===0)return 0;if(r.every(l=>l.progress.uploadComplete))return 1;let o=l=>l.progress.bytesTotal!=null&&l.progress.bytesTotal!==0,i=r.filter(o),n=r.filter(l=>!o(l));if(i.every(l=>l.progress.uploadComplete)&&n.length>0&&!n.every(l=>l.progress.uploadComplete))return null;let a=i.reduce((l,u)=>l+(u.progress.bytesTotal??0),0),s=i.reduce((l,u)=>l+(u.progress.bytesUploaded||0),0);return a===0?0:s/a}#T(){let t=(i,n,a)=>{let s=i.message||"Unknown error";i.details&&(s+=` ${i.details}`),this.setState({error:s}),n!=null&&n.id in this.getState().files&&this.setFileState(n.id,{error:s,response:a})};this.on("error",t),this.on("upload-error",(i,n,a)=>{if(t(n,i,a),typeof n=="object"&&n.message){this.log(n.message,"error");let s=new Error(this.i18n("failedToUpload",{file:i?.name??""}));s.isUserFacing=!0,s.details=n.message,n.details&&(s.details+=` ${n.details}`),this.#s([s])}else this.#s([n])});let r=null;this.on("upload-stalled",(i,n)=>{let{message:a}=i,s=n.map(l=>l.meta.name).join(", ");r||(this.info({message:a,details:s},"warning",this.opts.infoTimeout),r=setTimeout(()=>{r=null},this.opts.infoTimeout)),this.log(`${a} ${s}`.trim(),"warning")}),this.on("upload",()=>{this.setState({error:null})});let o=i=>{let n=i.filter(s=>{let l=s!=null&&this.getFile(s.id);return l||this.log(`Not setting progress for a file that has been removed: ${s?.id}`),l}),a=Object.fromEntries(n.map(s=>[s.id,{progress:{uploadStarted:Date.now(),uploadComplete:!1,bytesUploaded:0,bytesTotal:s.size}}]));this.patchFilesState(a)};this.on("upload-start",o),this.on("upload-progress",this.#C),this.on("upload-success",(i,n)=>{if(i==null||!this.getFile(i.id)){this.log(`Not setting progress for a file that has been removed: ${i?.id}`);return}let a=this.getFile(i.id).progress,s=this.#a.size>0;this.setFileState(i.id,{progress:{...a,postprocess:s?{mode:"indeterminate"}:void 0,uploadComplete:!0,...!s&&{complete:!0},percentage:100,bytesUploaded:a.bytesTotal},response:n,uploadURL:n.uploadURL,isPaused:!1}),i.size==null&&this.setFileState(i.id,{size:n.bytesUploaded||a.bytesTotal}),this.#c()}),this.on("preprocess-progress",(i,n)=>{if(i==null||!this.getFile(i.id)){this.log(`Not setting progress for a file that has been removed: ${i?.id}`);return}this.setFileState(i.id,{progress:{...this.getFile(i.id).progress,preprocess:n}})}),this.on("preprocess-complete",i=>{if(i==null||!this.getFile(i.id)){this.log(`Not setting progress for a file that has been removed: ${i?.id}`);return}let n={...this.getState().files};n[i.id]={...n[i.id],progress:{...n[i.id].progress}},delete n[i.id].progress.preprocess,this.setState({files:n})}),this.on("postprocess-progress",(i,n)=>{if(i==null||!this.getFile(i.id)){this.log(`Not setting progress for a file that has been removed: ${i?.id}`);return}this.setFileState(i.id,{progress:{...this.getState().files[i.id].progress,postprocess:n}})}),this.on("postprocess-complete",i=>{let n=i&&this.getFile(i.id);if(n==null){this.log(`Not setting progress for a file that has been removed: ${i?.id}`);return}let{postprocess:a,...s}=n.progress;this.patchFilesState({[n.id]:{progress:{...s,complete:!0}}})}),this.on("restored",()=>{this.#c()}),this.on("dashboard:file-edit-complete",i=>{i&&this.#u(i)}),typeof window<"u"&&window.addEventListener&&(window.addEventListener("online",this.#l),window.addEventListener("offline",this.#l),setTimeout(this.#l,3e3))}updateOnlineStatus(){window.navigator.onLine??!0?(this.emit("is-online"),this.wasOffline&&(this.emit("back-online"),this.info(this.i18n("connectedToInternet"),"success",3e3),this.wasOffline=!1)):(this.emit("is-offline"),this.info(this.i18n("noInternetConnection"),"error",0),this.wasOffline=!0)}#l=this.updateOnlineStatus.bind(this);getID(){return this.opts.id}use(t,...r){if(typeof t!="function"){let a=`Expected a plugin class, but got ${t===null?"null":typeof t}. Please verify that the plugin was imported and spelled correctly.`;throw new TypeError(a)}let o=new t(this,...r),i=o.id;if(!i)throw new Error("Your plugin must have an id");if(!o.type)throw new Error("Your plugin must have a type");let n=this.getPlugin(i);if(n){let a=`Already found a plugin named '${n.id}'. Tried to use: '${i}'.
Uppy plugins must have unique \`id\` options.`;throw new Error(a)}return t.VERSION&&this.log(`Using ${i} v${t.VERSION}`),o.type in this.#e?this.#e[o.type].push(o):this.#e[o.type]=[o],o.install(),this.emit("plugin-added",o),this}getPlugin(t){for(let r of Object.values(this.#e)){let o=r.find(i=>i.id===t);if(o!=null)return o}}[Symbol.for("uppy test: getPlugins")](t){return this.#e[t]}iteratePlugins(t){Object.values(this.#e).flat(1).forEach(t)}removePlugin(t){this.log(`Removing plugin ${t.id}`),this.emit("plugin-remove",t),t.uninstall&&t.uninstall();let r=this.#e[t.type],o=r.findIndex(a=>a.id===t.id);o!==-1&&r.splice(o,1);let n={plugins:{...this.getState().plugins,[t.id]:void 0}};this.setState(n)}destroy(){this.log(`Closing Uppy instance ${this.opts.id}: removing all files and uninstalling plugins`),this.cancelAll(),this.#o(),this.iteratePlugins(t=>{this.removePlugin(t)}),typeof window<"u"&&window.removeEventListener&&(window.removeEventListener("online",this.#l),window.removeEventListener("offline",this.#l))}hideInfo(){let{info:t}=this.getState();this.setState({info:t.slice(1)}),this.emit("info-hidden")}info(t,r="info",o=3e3){let i=typeof t=="object";this.setState({info:[...this.getState().info,{type:r,message:i?t.message:t,details:i?t.details:null}]}),setTimeout(()=>this.hideInfo(),o),this.emit("info-visible")}log(t,r){let{logger:o}=this.opts;switch(r){case"error":o.error(t);break;case"warning":o.warn(t);break;default:o.debug(t);break}}#v=new Map;registerRequestClient(t,r){this.#v.set(t,r)}getRequestClientForFile(t){if(!("remote"in t&&t.remote))throw new Error(`Tried to get RequestClient for a non-remote file ${t.id}`);let r=this.#v.get(t.remote.requestClientId);if(r==null)throw new Error(`requestClientId "${t.remote.requestClientId}" not registered for file "${t.id}"`);return r}async restore(t){this.log(`Core: Running restored upload "${t}"`);let r=await this.#p(t);return this.emit("complete",r),r}#d(t,r={}){let{forceAllowNewUpload:o=!1}=r,{allowNewUpload:i,currentUploads:n}=this.getState();if(!i&&!o)throw new Error("Cannot create a new upload: already uploading.");let a=Vu();return this.emit("upload",a,this.getFilesByIds(t)),this.setState({allowNewUpload:this.opts.allowMultipleUploadBatches!==!1&&this.opts.allowMultipleUploads!==!1,currentUploads:{...n,[a]:{fileIDs:t,step:0,result:{}}}}),a}[Symbol.for("uppy test: createUpload")](...t){return this.#d(...t)}#A(t){let{currentUploads:r}=this.getState();return r[t]}addResultData(t,r){if(!this.#A(t)){this.log(`Not setting result for an upload that has been removed: ${t}`);return}let{currentUploads:o}=this.getState(),i={...o[t],result:{...o[t].result,...r}};this.setState({currentUploads:{...o,[t]:i}})}#x(t){let{[t]:r,...o}=this.getState().currentUploads;this.setState({currentUploads:o})}async#p(t){let r=()=>{let{currentUploads:a}=this.getState();return a[t]},o=r();if(!o)throw new Error("Nonexistent upload");let i=[...this.#n,...this.#i,...this.#a];try{for(let a=o.step||0;a<i.length;a++){let s=i[a];this.setState({currentUploads:{...this.getState().currentUploads,[t]:{...o,step:a}}});let{fileIDs:l}=o;if(await s(l,t),o=r(),!o)break}}catch(a){throw this.#x(t),a}if(o){o.fileIDs.forEach(u=>{let c=this.getFile(u);c?.progress.postprocess&&this.emit("postprocess-complete",c)});let a=o.fileIDs.map(u=>this.getFile(u)),s=a.filter(u=>!u.error),l=a.filter(u=>u.error);this.addResultData(t,{successful:s,failed:l,uploadID:t}),o=r()}let n;return o&&(n=o.result,this.#x(t)),n==null&&(this.log(`Not setting result for an upload that has been removed: ${t}`),n={successful:[],failed:[],uploadID:t}),n}async upload(){this.#e.uploader?.length||this.log("No uploader type plugins are used","warning");let{files:t}=this.getState();if(this.#h().length>0){let i=await this.#g();if(!(this.getFiles().filter(a=>a.progress.uploadStarted==null).length>0))return this.emit("complete",i),i;({files:t}=this.getState())}let o=this.opts.onBeforeUpload(t);if(o===!1)throw new Error("Not starting the upload because onBeforeUpload returned false");o&&typeof o=="object"&&(t=o,this.setState({files:t}));try{if(this.#t.validateMinNumberOfFiles(t),!this.#w(t))throw new _e(this.i18n("missingRequiredMetaField"));let{currentUploads:i}=this.getState(),n=Object.values(i).flatMap(u=>u.fileIDs),a=Object.keys(t).filter(u=>{let c=this.getFile(u);return c&&!c.progress.uploadStarted&&!n.includes(u)}),s=this.#d(a),l=await this.#p(s);return this.emit("complete",l),l}catch(i){throw this.#s([i]),i}}},Go=yn;var Ku={name:"@uppy/xhr-upload",description:"Plain and simple classic HTML multipart form uploads with Uppy, as well as uploads using the HTTP PUT method.",version:"5.2.0",license:"MIT",type:"module",sideEffects:!1,scripts:{build:"tsc --build tsconfig.build.json",typecheck:"tsc --build",test:"vitest run --silent='passed-only'","test:e2e":"vitest run --project browser"},keywords:["file uploader","xhr","xhr upload","XMLHttpRequest","ajax","fetch","uppy","uppy-plugin"],homepage:"https://uppy.io",bugs:{url:"https://github.com/transloadit/uppy/issues"},repository:{type:"git",url:"git+https://github.com/transloadit/uppy.git"},files:["src","lib","dist","CHANGELOG.md"],exports:{".":"./lib/index.js","./package.json":"./package.json"},dependencies:{"@uppy/companion-client":"^5.1.1","@uppy/utils":"^7.2.0"},devDependencies:{"@uppy/core":"^5.2.0","@uppy/dashboard":"^5.1.1","@vitest/browser":"^3.2.4",jsdom:"^26.1.0",msw:"^2.10.4",nock:"^13.1.0",playwright:"1.57.0",typescript:"^5.8.3",vitest:"^3.2.4"},peerDependencies:{"@uppy/core":"^5.2.0"}};var Zu={strings:{uploadStalled:"Upload has not made any progress for %{seconds} seconds. You may want to retry it."}};function uf(e,t){let r=t;return r||(r=new Error("Upload error")),typeof r=="string"&&(r=new Error(r)),r instanceof Error||(r=Object.assign(new Error("Upload error"),{data:r})),mn(e)?(r=new xr(r,e),r):(r.request=e,r)}function Ju(e){return e.data.slice(0,e.data.size,e.meta.type)}var cf={formData:!0,fieldName:"file",method:"post",allowedMetaFields:!0,bundle:!1,headers:{},timeout:30*1e3,limit:5,withCredentials:!1,responseType:""},Qr=class extends kr{static VERSION=Ku.version;#e;#t;uploaderEvents;constructor(t,r){if(super(t,{...cf,fieldName:r.bundle?"files[]":"file",...r}),this.type="uploader",this.id=this.opts.id||"XHRUpload",this.defaultLocale=Zu,this.i18nInit(),this.#t=new Kr({concurrency:this.opts.limit}),this.opts.bundle&&!this.opts.formData)throw new Error("`opts.formData` must be true when `opts.bundle` is enabled.");if(this.opts.bundle&&typeof this.opts.headers=="function")throw new Error("`opts.headers` can not be a function when the `bundle: true` option is set.");if(r?.allowedMetaFields===void 0&&"metaFields"in this.opts)throw new Error("The `metaFields` option has been renamed to `allowedMetaFields`.");this.uploaderEvents=Object.create(null),this.#e=o=>async(i,n)=>{try{let a=await sn(i,{...n,onBeforeRequest:(u,c)=>this.opts.onBeforeRequest?.(u,c,o),shouldRetry:this.opts.shouldRetry,onAfterResponse:this.opts.onAfterResponse,onTimeout:u=>{let c=Math.ceil(u/1e3),p=new Error(this.i18n("uploadStalled",{seconds:c}));this.uppy.emit("upload-stalled",p,o)},onUploadProgress:u=>{if(u.lengthComputable)for(let{id:c}of o){let p=this.uppy.getFile(c);p!=null&&this.uppy.emit("upload-progress",p,{uploadStarted:p.progress.uploadStarted??0,bytesUploaded:u.loaded/u.total*p.size,bytesTotal:p.size})}}}),s=await this.opts.getResponseData?.(a);if(a.responseType==="json")s??=a.response;else try{s??=JSON.parse(a.responseText)}catch(u){throw new Error("@uppy/xhr-upload expects a JSON response (with a `url` property). To parse non-JSON responses, use `getResponseData` to turn your response into JSON.",{cause:u})}let l=typeof s?.url=="string"?s.url:void 0;for(let{id:u}of o)this.uppy.emit("upload-success",this.uppy.getFile(u),{status:a.status,body:s,uploadURL:l});return a}catch(a){if(a.name==="AbortError")return;let s=a.request;for(let l of o)this.uppy.emit("upload-error",this.uppy.getFile(l.id),uf(s,a),s);throw a}}}getOptions(t){let r=this.uppy.getState().xhrUpload,{headers:o}=this.opts,i={...this.opts,...r||{},...t.xhrUpload||{},headers:{}};return typeof o=="function"?i.headers=o(t):Object.assign(i.headers,this.opts.headers),r&&Object.assign(i.headers,r.headers),t.xhrUpload&&Object.assign(i.headers,t.xhrUpload.headers),i}addMetadata(t,r,o){Xr(o.allowedMetaFields,r).forEach(n=>{let a=r[n];Array.isArray(a)?a.forEach(s=>t.append(n,s)):t.append(n,a)})}createFormDataUpload(t,r){let o=new FormData;this.addMetadata(o,t.meta,r);let i=Ju(t);return t.name?o.append(r.fieldName,i,t.meta.name):o.append(r.fieldName,i),o}createBundledUpload(t,r){let o=new FormData,{meta:i}=this.uppy.getState();return this.addMetadata(o,i,r),t.forEach(n=>{let a=this.getOptions(n),s=Ju(n);n.name?o.append(a.fieldName,s,n.name):o.append(a.fieldName,s)}),o}async#o(t){let r=new Cr(this.uppy),o=new AbortController;r.onFileRemove(t.id,()=>o.abort()),r.onCancelAll(t.id,()=>o.abort());try{await this.#t.add(async i=>{let n=this.getOptions(t),a=this.#e([t]),s=n.formData?this.createFormDataUpload(t,n):t.data,l=typeof n.endpoint=="string"?n.endpoint:await n.endpoint(t);return a(l,{...n,body:s,signal:AbortSignal.any([i,o.signal])})})}catch(i){if(i.name==="AbortError")return;throw i}finally{r.remove()}}async#r(t){let r=new AbortController;function o(){r.abort()}this.uppy.once("cancel-all",o);try{await this.#t.add(async i=>{let n=this.uppy.getState().xhrUpload??{},a=this.#e(t),s=this.createBundledUpload(t,{...this.opts,...n}),l=typeof this.opts.endpoint=="string"?this.opts.endpoint:await this.opts.endpoint(t);return a(l,{...this.opts,body:s,signal:AbortSignal.any([i,r.signal])})})}catch(i){if(i.name==="AbortError")return;throw i}finally{this.uppy.off("cancel-all",o)}}#n(t){let r=this.getOptions(t),o=Xr(r.allowedMetaFields,t.meta);return{...t.remote?.body,protocol:"multipart",endpoint:r.endpoint,size:t.data.size,fieldname:r.fieldName,metadata:Object.fromEntries(o.map(i=>[i,t.meta[i]])),httpMethod:r.method,useFormData:r.formData,headers:r.headers}}async#i(t){await Promise.allSettled(t.map(r=>{if(r.isRemote){let o=()=>this.#t,i=new AbortController,n=a=>{a.id===r.id&&i.abort()};return this.uppy.on("file-removed",n),this.uppy.getRequestClientForFile(r).uploadRemoteFile(r,this.#n(r),{signal:i.signal,getQueue:o}).finally(()=>{this.uppy.off("file-removed",n)})}return this.#o(r)}))}#a=async t=>{if(t.length===0){this.uppy.log("[XHRUpload] No files to upload!");return}this.opts.limit===0&&this.uppy.log("[XHRUpload] When uploading multiple files at once, consider setting the `limit` option (to `10` for example), to limit the number of concurrent uploads, which helps prevent memory and network issues: https://uppy.io/docs/xhr-upload/#limit-0","warning"),this.uppy.log("[XHRUpload] Uploading...");let r=this.uppy.getFilesByIds(t),o=ln(r),i=un(o);if(this.uppy.emit("upload-start",i),this.opts.bundle){if(o.some(a=>a.isRemote))throw new Error("Can\u2019t upload remote files when the `bundle: true` option is set");if(typeof this.opts.headers=="function")throw new TypeError("`headers` may not be a function when the `bundle: true` option is set");await this.#r(o)}else await this.#i(o)};install(){if(this.opts.bundle){let{capabilities:t}=this.uppy.getState();this.uppy.setState({capabilities:{...t,individualCancellation:!1}})}this.uppy.addUploader(this.#a)}uninstall(){if(this.opts.bundle){let{capabilities:t}=this.uppy.getState();this.uppy.setState({capabilities:{...t,individualCancellation:!0}})}this.uppy.removeUploader(this.#a)}};function Qu(e,t){(t==null||t>e.length)&&(t=e.length);for(var r=0,o=Array(t);r<t;r++)o[r]=e[r];return o}function df(e){if(Array.isArray(e))return e}function pf(e,t){var r=e==null?null:typeof Symbol<"u"&&e[Symbol.iterator]||e["@@iterator"];if(r!=null){var o,i,n,a,s=[],l=!0,u=!1;try{if(n=(r=r.call(e)).next,t!==0)for(;!(l=(o=n.call(r)).done)&&(s.push(o.value),s.length!==t);l=!0);}catch(c){u=!0,i=c}finally{try{if(!l&&r.return!=null&&(a=r.return(),Object(a)!==a))return}finally{if(u)throw i}}return s}}function ff(){throw new TypeError(`Invalid attempt to destructure non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}function mf(e,t){return df(e)||pf(e,t)||hf(e,t)||ff()}function hf(e,t){if(e){if(typeof e=="string")return Qu(e,t);var r={}.toString.call(e).slice(8,-1);return r==="Object"&&e.constructor&&(r=e.constructor.name),r==="Map"||r==="Set"?Array.from(e):r==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?Qu(e,t):void 0}}var fc=Object.entries,ec=Object.setPrototypeOf,gf=Object.isFrozen,bf=Object.getPrototypeOf,vf=Object.getOwnPropertyDescriptor,he=Object.freeze,ge=Object.seal,Tr=Object.create,mc=typeof Reflect<"u"&&Reflect,_n=mc.apply,Sn=mc.construct;he||(he=function(t){return t});ge||(ge=function(t){return t});_n||(_n=function(t,r){for(var o=arguments.length,i=new Array(o>2?o-2:0),n=2;n<o;n++)i[n-2]=arguments[n];return t.apply(r,i)});Sn||(Sn=function(t){for(var r=arguments.length,o=new Array(r>1?r-1:0),i=1;i<r;i++)o[i-1]=arguments[i];return new t(...o)});var eo=oe(Array.prototype.forEach),xf=oe(Array.prototype.lastIndexOf),tc=oe(Array.prototype.pop),Er=oe(Array.prototype.push),wf=oe(Array.prototype.splice),Ct=Array.isArray,oo=oe(String.prototype.toLowerCase),kn=oe(String.prototype.toString),rc=oe(String.prototype.match),to=oe(String.prototype.replace),oc=oe(String.prototype.indexOf),yf=oe(String.prototype.trim),kf=oe(Number.prototype.toString),Cf=oe(Boolean.prototype.toString),ic=typeof BigInt>"u"?null:oe(BigInt.prototype.toString),nc=typeof Symbol>"u"?null:oe(Symbol.prototype.toString),de=oe(Object.prototype.hasOwnProperty),ro=oe(Object.prototype.toString),me=oe(RegExp.prototype.test),jt=Ef(TypeError);function oe(e){return function(t){t instanceof RegExp&&(t.lastIndex=0);for(var r=arguments.length,o=new Array(r>1?r-1:0),i=1;i<r;i++)o[i-1]=arguments[i];return _n(e,t,o)}}function Ef(e){return function(){for(var t=arguments.length,r=new Array(t),o=0;o<t;o++)r[o]=arguments[o];return Sn(e,r)}}function N(e,t){let r=arguments.length>2&&arguments[2]!==void 0?arguments[2]:oo;if(ec&&ec(e,null),!Ct(t))return e;let o=t.length;for(;o--;){let i=t[o];if(typeof i=="string"){let n=r(i);n!==i&&(gf(t)||(t[o]=n),i=n)}e[i]=!0}return e}function Tf(e){for(let t=0;t<e.length;t++)de(e,t)||(e[t]=null);return e}function ke(e){let t=Tr(null);for(let o of fc(e)){var r=mf(o,2);let i=r[0],n=r[1];de(e,i)&&(Ct(n)?t[i]=Tf(n):n&&typeof n=="object"&&n.constructor===Object?t[i]=ke(n):t[i]=n)}return t}function Af(e){switch(typeof e){case"string":return e;case"number":return kf(e);case"boolean":return Cf(e);case"bigint":return ic?ic(e):"0";case"symbol":return nc?nc(e):"Symbol()";case"undefined":return ro(e);case"function":case"object":{if(e===null)return ro(e);let t=e,r=et(t,"toString");if(typeof r=="function"){let o=r(t);return typeof o=="string"?o:ro(o)}return ro(e)}default:return ro(e)}}function et(e,t){for(;e!==null;){let o=vf(e,t);if(o){if(o.get)return oe(o.get);if(typeof o.value=="function")return oe(o.value)}e=bf(e)}function r(){return null}return r}function _f(e){try{return me(e,""),!0}catch{return!1}}var ac=he(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","search","section","select","shadow","slot","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),Cn=he(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","enterkeyhint","exportparts","filter","font","g","glyph","glyphref","hkern","image","inputmode","line","lineargradient","marker","mask","metadata","mpath","part","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),En=he(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feDropShadow","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),Sf=he(["animate","color-profile","cursor","discard","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),Tn=he(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover","mprescripts"]),Ff=he(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),sc=he(["#text"]),lc=he(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","command","commandfor","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","exportparts","face","for","headers","height","hidden","high","href","hreflang","id","inert","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","part","pattern","placeholder","playsinline","popover","popovertarget","popovertargetaction","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","slot","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","wrap","xmlns"]),An=he(["accent-height","accumulate","additive","alignment-baseline","amplitude","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dur","edgemode","elevation","end","exponent","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","intercept","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","mask-type","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","slope","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","tablevalues","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),uc=he(["accent","accentunder","align","bevelled","close","columnalign","columnlines","columnspacing","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lquote","lspace","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),Yo=he(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),Lf=ge(/{{[\w\W]*|^[\w\W]*}}/g),Df=ge(/<%[\w\W]*|^[\w\W]*%>/g),zf=ge(/\${[\w\W]*/g),Mf=ge(/^data-[\-\w.\u00B7-\uFFFF]+$/),Rf=ge(/^aria-[\-\w]+$/),cc=ge(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|matrix):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),Pf=ge(/^(?:\w+script|data):/i),Of=ge(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),If=ge(/^html$/i),Bf=ge(/^[a-z][.\w]*(-[.\w]+)+$/i),dc=ge(/<[/\w!]/g),$f=ge(/<[/\w]/g),Nf=ge(/<\/no(script|embed|frames)/i),qf=ge(/\/>/i),Qe={element:1,attribute:2,text:3,cdataSection:4,entityReference:5,entityNode:6,processingInstruction:7,comment:8,document:9,documentType:10,documentFragment:11,notation:12},jf=function(){return typeof window>"u"?null:window},Uf=function(t,r){if(typeof t!="object"||typeof t.createPolicy!="function")return null;let o=null,i="data-tt-policy-suffix";r&&r.hasAttribute(i)&&(o=r.getAttribute(i));let n="dompurify"+(o?"#"+o:"");try{return t.createPolicy(n,{createHTML(a){return a},createScriptURL(a){return a}})}catch{return console.warn("TrustedTypes policy "+n+" could not be created."),null}},pc=function(){return{afterSanitizeAttributes:[],afterSanitizeElements:[],afterSanitizeShadowDOM:[],beforeSanitizeAttributes:[],beforeSanitizeElements:[],beforeSanitizeShadowDOM:[],uponSanitizeAttribute:[],uponSanitizeElement:[],uponSanitizeShadowNode:[]}},kt=function(t,r,o,i){return de(t,r)&&Ct(t[r])?N(i.base?ke(i.base):{},t[r],i.transform):o};function hc(){let e=arguments.length>0&&arguments[0]!==void 0?arguments[0]:jf(),t=L=>hc(L);if(t.version="3.4.11",t.removed=[],!e||!e.document||e.document.nodeType!==Qe.document||!e.Element)return t.isSupported=!1,t;let r=e.document,o=r,i=o.currentScript;e.DocumentFragment;let n=e.HTMLTemplateElement,a=e.Node,s=e.Element,l=e.NodeFilter,u=e.NamedNodeMap;u===void 0&&(e.NamedNodeMap||e.MozNamedAttrMap),e.HTMLFormElement;let c=e.DOMParser,p=e.trustedTypes,g=s.prototype,m=et(g,"cloneNode"),h=et(g,"remove"),x=et(g,"nextSibling"),y=et(g,"childNodes"),S=et(g,"parentNode"),k=et(g,"shadowRoot"),_=et(g,"attributes"),T=a&&a.prototype?et(a.prototype,"nodeType"):null,E=a&&a.prototype?et(a.prototype,"nodeName"):null;if(typeof n=="function"){let L=r.createElement("template");L.content&&L.content.ownerDocument&&(r=L.content.ownerDocument)}let A,z="",O,H=!1,V=0,ve=function(){if(V>0)throw jt('A configured TRUSTED_TYPES_POLICY callback (createHTML or createScriptURL) must not call DOMPurify.sanitize, as that causes infinite recursion. Do not pass a policy whose callbacks wrap DOMPurify as TRUSTED_TYPES_POLICY; see the "DOMPurify and Trusted Types" section of the README.')},ie=function(d){ve(),V++;try{return A.createHTML(d)}finally{V--}},ze=function(d){ve(),V++;try{return A.createScriptURL(d)}finally{V--}},te=function(){return H||(O=Uf(p,i),H=!0),O},ne=r,xe=ne.implementation,Ee=ne.createNodeIterator,Se=ne.createDocumentFragment,Ve=ne.getElementsByTagName,wi=o.importNode,J=pc();t.isSupported=typeof fc=="function"&&typeof S=="function"&&xe&&xe.createHTMLDocument!==void 0;let Nd=Lf,qd=Df,jd=zf,Ud=Mf,Hd=Rf,Vd=Pf,Ha=Of,Wd=Bf,Va=cc,Y=null,Wa=N({},[...ac,...Cn,...En,...Tn,...sc]),X=null,Ga=N({},[...lc,...An,...uc,...Yo]),K=Object.seal(Tr(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),Ir=null,Ya=null,mt=Object.seal(Tr(null,{tagCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeCheck:{writable:!0,configurable:!1,enumerable:!0,value:null}})),Xa=!0,yi=!0,Ka=!1,Za=!0,ht=!1,Br=!0,At=!1,ki=!1,Ci=null,Ei=null,Ti=!1,Jt=!1,mo=!1,ho=!1,Ja=!0,Qa=!1,es="user-content-",Ai=!0,_i=!1,Qt={},We=null,Si=N({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","selectedcontent","style","svg","template","thead","title","video","xmp"]),ts=null,rs=N({},["audio","video","img","source","image","track"]),Fi=null,os=N({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),go="http://www.w3.org/1998/Math/MathML",bo="http://www.w3.org/2000/svg",Ge="http://www.w3.org/1999/xhtml",er=Ge,Li=!1,Di=null,Gd=N({},[go,bo,Ge],kn),is=he(["mi","mo","mn","ms","mtext"]),zi=N({},is),ns=he(["annotation-xml"]),Mi=N({},ns),Yd=N({},["title","style","font","a","script"]),$r=null,Xd=["application/xhtml+xml","text/html"],Kd="text/html",Z=null,tr=null,Zd=r.createElement("form"),as=function(d){return d instanceof RegExp||d instanceof Function},Ri=function(){let d=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};if(tr&&tr===d)return;(!d||typeof d!="object")&&(d={}),d=ke(d),$r=Xd.indexOf(d.PARSER_MEDIA_TYPE)===-1?Kd:d.PARSER_MEDIA_TYPE,Z=$r==="application/xhtml+xml"?kn:oo,Y=kt(d,"ALLOWED_TAGS",Wa,{transform:Z}),X=kt(d,"ALLOWED_ATTR",Ga,{transform:Z}),Di=kt(d,"ALLOWED_NAMESPACES",Gd,{transform:kn}),Fi=kt(d,"ADD_URI_SAFE_ATTR",os,{transform:Z,base:os}),ts=kt(d,"ADD_DATA_URI_TAGS",rs,{transform:Z,base:rs}),We=kt(d,"FORBID_CONTENTS",Si,{transform:Z}),Ir=kt(d,"FORBID_TAGS",ke({}),{transform:Z}),Ya=kt(d,"FORBID_ATTR",ke({}),{transform:Z}),Qt=de(d,"USE_PROFILES")?d.USE_PROFILES&&typeof d.USE_PROFILES=="object"?ke(d.USE_PROFILES):d.USE_PROFILES:!1,Xa=d.ALLOW_ARIA_ATTR!==!1,yi=d.ALLOW_DATA_ATTR!==!1,Ka=d.ALLOW_UNKNOWN_PROTOCOLS||!1,Za=d.ALLOW_SELF_CLOSE_IN_ATTR!==!1,ht=d.SAFE_FOR_TEMPLATES||!1,Br=d.SAFE_FOR_XML!==!1,At=d.WHOLE_DOCUMENT||!1,Jt=d.RETURN_DOM||!1,mo=d.RETURN_DOM_FRAGMENT||!1,ho=d.RETURN_TRUSTED_TYPE||!1,Ti=d.FORCE_BODY||!1,Ja=d.SANITIZE_DOM!==!1,Qa=d.SANITIZE_NAMED_PROPS||!1,Ai=d.KEEP_CONTENT!==!1,_i=d.IN_PLACE||!1,Va=_f(d.ALLOWED_URI_REGEXP)?d.ALLOWED_URI_REGEXP:cc,er=typeof d.NAMESPACE=="string"?d.NAMESPACE:Ge,zi=de(d,"MATHML_TEXT_INTEGRATION_POINTS")&&d.MATHML_TEXT_INTEGRATION_POINTS&&typeof d.MATHML_TEXT_INTEGRATION_POINTS=="object"?ke(d.MATHML_TEXT_INTEGRATION_POINTS):N({},is),Mi=de(d,"HTML_INTEGRATION_POINTS")&&d.HTML_INTEGRATION_POINTS&&typeof d.HTML_INTEGRATION_POINTS=="object"?ke(d.HTML_INTEGRATION_POINTS):N({},ns);let b=de(d,"CUSTOM_ELEMENT_HANDLING")&&d.CUSTOM_ELEMENT_HANDLING&&typeof d.CUSTOM_ELEMENT_HANDLING=="object"?ke(d.CUSTOM_ELEMENT_HANDLING):Tr(null);if(K=Tr(null),de(b,"tagNameCheck")&&as(b.tagNameCheck)&&(K.tagNameCheck=b.tagNameCheck),de(b,"attributeNameCheck")&&as(b.attributeNameCheck)&&(K.attributeNameCheck=b.attributeNameCheck),de(b,"allowCustomizedBuiltInElements")&&typeof b.allowCustomizedBuiltInElements=="boolean"&&(K.allowCustomizedBuiltInElements=b.allowCustomizedBuiltInElements),ge(K),ht&&(yi=!1),mo&&(Jt=!0),Qt&&(Y=N({},sc),X=Tr(null),Qt.html===!0&&(N(Y,ac),N(X,lc)),Qt.svg===!0&&(N(Y,Cn),N(X,An),N(X,Yo)),Qt.svgFilters===!0&&(N(Y,En),N(X,An),N(X,Yo)),Qt.mathMl===!0&&(N(Y,Tn),N(X,uc),N(X,Yo))),mt.tagCheck=null,mt.attributeCheck=null,de(d,"ADD_TAGS")&&(typeof d.ADD_TAGS=="function"?mt.tagCheck=d.ADD_TAGS:Ct(d.ADD_TAGS)&&(Y===Wa&&(Y=ke(Y)),N(Y,d.ADD_TAGS,Z))),de(d,"ADD_ATTR")&&(typeof d.ADD_ATTR=="function"?mt.attributeCheck=d.ADD_ATTR:Ct(d.ADD_ATTR)&&(X===Ga&&(X=ke(X)),N(X,d.ADD_ATTR,Z))),de(d,"ADD_URI_SAFE_ATTR")&&Ct(d.ADD_URI_SAFE_ATTR)&&N(Fi,d.ADD_URI_SAFE_ATTR,Z),de(d,"FORBID_CONTENTS")&&Ct(d.FORBID_CONTENTS)&&(We===Si&&(We=ke(We)),N(We,d.FORBID_CONTENTS,Z)),de(d,"ADD_FORBID_CONTENTS")&&Ct(d.ADD_FORBID_CONTENTS)&&(We===Si&&(We=ke(We)),N(We,d.ADD_FORBID_CONTENTS,Z)),Ai&&(Y["#text"]=!0),At&&N(Y,["html","head","body"]),Y.table&&(N(Y,["tbody"]),delete Ir.tbody),d.TRUSTED_TYPES_POLICY){if(typeof d.TRUSTED_TYPES_POLICY.createHTML!="function")throw jt('TRUSTED_TYPES_POLICY configuration option must provide a "createHTML" hook.');if(typeof d.TRUSTED_TYPES_POLICY.createScriptURL!="function")throw jt('TRUSTED_TYPES_POLICY configuration option must provide a "createScriptURL" hook.');let F=A;A=d.TRUSTED_TYPES_POLICY;try{z=ie("")}catch(D){throw A=F,D}}else d.TRUSTED_TYPES_POLICY===null?(A=void 0,z=""):(A===void 0&&(A=te()),A&&typeof z=="string"&&(z=ie("")));he&&he(d),tr=d},ss=N({},[...Cn,...En,...Sf]),ls=N({},[...Tn,...Ff]),Jd=function(d,b,F){return b.namespaceURI===Ge?d==="svg":b.namespaceURI===go?d==="svg"&&(F==="annotation-xml"||zi[F]):!!ss[d]},Qd=function(d,b,F){return b.namespaceURI===Ge?d==="math":b.namespaceURI===bo?d==="math"&&Mi[F]:!!ls[d]},e0=function(d,b,F){return b.namespaceURI===bo&&!Mi[F]||b.namespaceURI===go&&!zi[F]?!1:!ls[d]&&(Yd[d]||!ss[d])},t0=function(d){let b=S(d);(!b||!b.tagName)&&(b={namespaceURI:er,tagName:"template"});let F=oo(d.tagName),D=oo(b.tagName);return Di[d.namespaceURI]?d.namespaceURI===bo?Jd(F,b,D):d.namespaceURI===go?Qd(F,b,D):d.namespaceURI===Ge?e0(F,b,D):!!($r==="application/xhtml+xml"&&Di[d.namespaceURI]):!1},gt=function(d){Er(t.removed,{element:d});try{S(d).removeChild(d)}catch{if(h(d),!S(d))throw jt("a node selected for removal could not be detached from its tree and cannot be safely returned; refusing to sanitize in place")}},us=function(d){let b=y(d);if(b){let D=[];eo(b,I=>{Er(D,I)}),eo(D,I=>{try{h(I)}catch{}})}let F=_(d);if(F)for(let D=F.length-1;D>=0;--D){let I=F[D],q=I&&I.name;if(typeof q=="string")try{d.removeAttribute(q)}catch{}}},_t=function(d,b){try{Er(t.removed,{attribute:b.getAttributeNode(d),from:b})}catch{Er(t.removed,{attribute:null,from:b})}if(b.removeAttribute(d),d==="is")if(Jt||mo)try{gt(b)}catch{}else try{b.setAttribute(d,"")}catch{}},r0=function(d){let b=_(d);if(b)for(let F=b.length-1;F>=0;--F){let D=b[F],I=D&&D.name;if(!(typeof I!="string"||X[Z(I)]))try{d.removeAttribute(I)}catch{}}},o0=function(d){let b=[d];for(;b.length>0;){let F=b.pop();(T?T(F):F.nodeType)===Qe.element&&r0(F);let I=y(F);if(I)for(let q=I.length-1;q>=0;--q)b.push(I[q])}},cs=function(d){let b=null,F=null;if(Ti)d="<remove></remove>"+d;else{let q=rc(d,/^[\r\n\t ]+/);F=q&&q[0]}$r==="application/xhtml+xml"&&er===Ge&&(d='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+d+"</body></html>");let D=A?ie(d):d;if(er===Ge)try{b=new c().parseFromString(D,$r)}catch{}if(!b||!b.documentElement){b=xe.createDocument(er,"template",null);try{b.documentElement.innerHTML=Li?z:D}catch{}}let I=b.body||b.documentElement;return d&&F&&I.insertBefore(r.createTextNode(F),I.childNodes[0]||null),er===Ge?Ve.call(b,At?"html":"body")[0]:At?b.documentElement:I},ds=function(d){return Ee.call(d.ownerDocument||d,d,l.SHOW_ELEMENT|l.SHOW_COMMENT|l.SHOW_TEXT|l.SHOW_PROCESSING_INSTRUCTION|l.SHOW_CDATA_SECTION,null)},vo=function(d){return d=to(d,Nd," "),d=to(d,qd," "),d=to(d,jd," "),d},Pi=function(d){var b;d.normalize();let F=Ee.call(d.ownerDocument||d,d,l.SHOW_TEXT|l.SHOW_COMMENT|l.SHOW_CDATA_SECTION|l.SHOW_PROCESSING_INSTRUCTION,null),D=F.nextNode();for(;D;)D.data=vo(D.data),D=F.nextNode();let I=(b=d.querySelectorAll)===null||b===void 0?void 0:b.call(d,"template");I&&eo(I,q=>{rr(q.content)&&Pi(q.content)})},xo=function(d){let b=E?E(d):null;return typeof b!="string"||Z(b)!=="form"?!1:typeof d.nodeName!="string"||typeof d.textContent!="string"||typeof d.removeChild!="function"||d.attributes!==_(d)||typeof d.removeAttribute!="function"||typeof d.setAttribute!="function"||typeof d.namespaceURI!="string"||typeof d.insertBefore!="function"||typeof d.hasChildNodes!="function"||d.nodeType!==T(d)||d.childNodes!==y(d)},rr=function(d){if(!T||typeof d!="object"||d===null)return!1;try{return T(d)===Qe.documentFragment}catch{return!1}},Nr=function(d){if(!T||typeof d!="object"||d===null)return!1;try{return typeof T(d)=="number"}catch{return!1}};function nt(L,d,b){L.length!==0&&eo(L,F=>{F.call(t,d,b,tr)})}let i0=function(d,b){return!!(Br&&d.hasChildNodes()&&!Nr(d.firstElementChild)&&me(dc,d.textContent)&&me(dc,d.innerHTML)||Br&&d.namespaceURI===Ge&&b==="style"&&Nr(d.firstElementChild)||d.nodeType===Qe.processingInstruction||Br&&d.nodeType===Qe.comment&&me($f,d.data))},n0=function(d,b){if(!Ir[b]&&ms(b)&&(K.tagNameCheck instanceof RegExp&&me(K.tagNameCheck,b)||K.tagNameCheck instanceof Function&&K.tagNameCheck(b)))return!1;if(Ai&&!We[b]){let F=S(d),D=y(d);if(D&&F){let I=D.length;for(let q=I-1;q>=0;--q){let le=_i?D[q]:m(D[q],!0);F.insertBefore(le,x(d))}}}return gt(d),!0},ps=function(d){if(nt(J.beforeSanitizeElements,d,null),xo(d))return gt(d),!0;let b=Z(E?E(d):d.nodeName);if(nt(J.uponSanitizeElement,d,{tagName:b,allowedTags:Y}),i0(d,b))return gt(d),!0;if(Ir[b]||!(mt.tagCheck instanceof Function&&mt.tagCheck(b))&&!Y[b])return n0(d,b);if((T?T(d):d.nodeType)===Qe.element&&!t0(d)||(b==="noscript"||b==="noembed"||b==="noframes")&&me(Nf,d.innerHTML))return gt(d),!0;if(ht&&d.nodeType===Qe.text){let D=vo(d.textContent);d.textContent!==D&&(Er(t.removed,{element:d.cloneNode()}),d.textContent=D)}return nt(J.afterSanitizeElements,d,null),!1},fs=function(d,b,F){if(Ya[b]||Ja&&(b==="id"||b==="name")&&(F in r||F in Zd))return!1;let D=X[b]||mt.attributeCheck instanceof Function&&mt.attributeCheck(b,d);if(!(yi&&me(Ud,b))){if(!(Xa&&me(Hd,b))){if(D){if(!Fi[b]){if(!me(Va,to(F,Ha,""))){if(!((b==="src"||b==="xlink:href"||b==="href")&&d!=="script"&&oc(F,"data:")===0&&ts[d])){if(!(Ka&&!me(Vd,to(F,Ha,"")))){if(F)return!1}}}}}else if(!(ms(d)&&(K.tagNameCheck instanceof RegExp&&me(K.tagNameCheck,d)||K.tagNameCheck instanceof Function&&K.tagNameCheck(d))&&(K.attributeNameCheck instanceof RegExp&&me(K.attributeNameCheck,b)||K.attributeNameCheck instanceof Function&&K.attributeNameCheck(b,d))||b==="is"&&K.allowCustomizedBuiltInElements&&(K.tagNameCheck instanceof RegExp&&me(K.tagNameCheck,F)||K.tagNameCheck instanceof Function&&K.tagNameCheck(F))))return!1}}return!0},a0=N({},["annotation-xml","color-profile","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","missing-glyph"]),ms=function(d){return!a0[oo(d)]&&me(Wd,d)},s0=function(d,b,F,D){if(A&&typeof p=="object"&&typeof p.getAttributeType=="function"&&!F)switch(p.getAttributeType(d,b)){case"TrustedHTML":return ie(D);case"TrustedScriptURL":return ze(D)}return D},l0=function(d,b,F,D){try{F?d.setAttributeNS(F,b,D):d.setAttribute(b,D),xo(d)?gt(d):tc(t.removed)}catch{_t(b,d)}},hs=function(d){nt(J.beforeSanitizeAttributes,d,null);let b=d.attributes;if(!b||xo(d))return;let F={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:X,forceKeepAttr:void 0},D=b.length,I=Z(d.nodeName);for(;D--;){let q=b[D],le=q.name,re=q.namespaceURI,Me=q.value,$e=Z(le),Ii=Me,we=le==="value"?Ii:yf(Ii);if(F.attrName=$e,F.attrValue=we,F.keepAttr=!0,F.forceKeepAttr=void 0,nt(J.uponSanitizeAttribute,d,F),we=F.attrValue,Qa&&($e==="id"||$e==="name")&&oc(we,es)!==0&&(_t(le,d),we=es+we),Br&&me(/((--!?|])>)|<\/(style|script|title|xmp|textarea|noscript|iframe|noembed|noframes)/i,we)){_t(le,d);continue}if($e==="attributename"&&rc(we,"href")){_t(le,d);continue}if(!F.forceKeepAttr){if(!F.keepAttr){_t(le,d);continue}if(!Za&&me(qf,we)){_t(le,d);continue}if(ht&&(we=vo(we)),!fs(I,$e,we)){_t(le,d);continue}we=s0(I,$e,re,we),we!==Ii&&l0(d,le,re,we)}}nt(J.afterSanitizeAttributes,d,null)},wo=function(d){let b=null,F=ds(d);for(nt(J.beforeSanitizeShadowDOM,d,null);b=F.nextNode();)if(nt(J.uponSanitizeShadowNode,b,null),ps(b),hs(b),rr(b.content)&&wo(b.content),(T?T(b):b.nodeType)===Qe.element){let I=k(b);rr(I)&&(Oi(I),wo(I))}nt(J.afterSanitizeShadowDOM,d,null)},Oi=function(d){let b=[{node:d,shadow:null}];for(;b.length>0;){let F=b.pop();if(F.shadow){wo(F.shadow);continue}let D=F.node,q=(T?T(D):D.nodeType)===Qe.element,le=y(D);if(le)for(let re=le.length-1;re>=0;--re)b.push({node:le[re],shadow:null});if(q){let re=E?E(D):null;if(typeof re=="string"&&Z(re)==="template"){let Me=D.content;rr(Me)&&b.push({node:Me,shadow:null})}}if(q){let re=k(D);rr(re)&&b.push({node:null,shadow:re},{node:re,shadow:null})}}};return t.sanitize=function(L){let d=arguments.length>1&&arguments[1]!==void 0?arguments[1]:{},b=null,F=null,D=null,I=null;if(Li=!L,Li&&(L="<!-->"),typeof L!="string"&&!Nr(L)&&(L=Af(L),typeof L!="string"))throw jt("dirty is not a string, aborting");if(!t.isSupported)return L;ki?(Y=Ci,X=Ei):Ri(d),(J.uponSanitizeElement.length>0||J.uponSanitizeAttribute.length>0)&&(Y=ke(Y)),J.uponSanitizeAttribute.length>0&&(X=ke(X)),t.removed=[];let q=_i&&typeof L!="string"&&Nr(L);if(q){let Me=E?E(L):L.nodeName;if(typeof Me=="string"){let $e=Z(Me);if(!Y[$e]||Ir[$e])throw jt("root node is forbidden and cannot be sanitized in-place")}if(xo(L))throw jt("root node is clobbered and cannot be sanitized in-place");try{Oi(L)}catch($e){throw us(L),$e}}else if(Nr(L))b=cs("<!---->"),F=b.ownerDocument.importNode(L,!0),F.nodeType===Qe.element&&F.nodeName==="BODY"||F.nodeName==="HTML"?b=F:b.appendChild(F),Oi(F);else{if(!Jt&&!ht&&!At&&L.indexOf("<")===-1)return A&&ho?ie(L):L;if(b=cs(L),!b)return Jt?null:ho?z:""}b&&Ti&&gt(b.firstChild);let le=ds(q?L:b);try{for(;D=le.nextNode();)ps(D),hs(D),rr(D.content)&&wo(D.content)}catch(Me){throw q&&us(L),Me}if(q)return eo(t.removed,Me=>{Me.element&&o0(Me.element)}),ht&&Pi(L),L;if(Jt){if(ht&&Pi(b),mo)for(I=Se.call(b.ownerDocument);b.firstChild;)I.appendChild(b.firstChild);else I=b;return(X.shadowroot||X.shadowrootmode)&&(I=wi.call(o,I,!0)),I}let re=At?b.outerHTML:b.innerHTML;return At&&Y["!doctype"]&&b.ownerDocument&&b.ownerDocument.doctype&&b.ownerDocument.doctype.name&&me(If,b.ownerDocument.doctype.name)&&(re="<!DOCTYPE "+b.ownerDocument.doctype.name+`>
`+re),ht&&(re=vo(re)),A&&ho?ie(re):re},t.setConfig=function(){let L=arguments.length>0&&arguments[0]!==void 0?arguments[0]:{};Ri(L),ki=!0,Ci=Y,Ei=X},t.clearConfig=function(){tr=null,ki=!1,Ci=null,Ei=null,A=O,z=""},t.isValidAttribute=function(L,d,b){tr||Ri({});let F=Z(L),D=Z(d);return fs(F,D,b)},t.addHook=function(L,d){typeof d=="function"&&de(J,L)&&Er(J[L],d)},t.removeHook=function(L,d){if(de(J,L)){if(d!==void 0){let b=xf(J[L],d);return b===-1?void 0:wf(J[L],b,1)[0]}return tc(J[L])}},t.removeHooks=function(L){de(J,L)&&(J[L]=[])},t.removeAllHooks=function(){J=pc()},t}var Xo=hc();var gc=(e,t,r)=>{let o=new Map;for(let i=t;i<=r;i++)o.set(e[i],i);return o},Ut=mr(class extends vt{constructor(e){if(super(e),e.type!==fr.CHILD)throw Error("repeat() can only be used in text expressions")}dt(e,t,r){let o;r===void 0?r=t:t!==void 0&&(o=t);let i=[],n=[],a=0;for(let s of e)i[a]=o?o(s,a):a,n[a]=r(s,a),a++;return{values:n,keys:i}}render(e,t,r){return this.dt(e,t,r).values}update(e,[t,r,o]){let i=rl(e),{values:n,keys:a}=this.dt(t,r,o);if(!Array.isArray(i))return this.ut=a,n;let s=this.ut??=[],l=[],u,c,p=0,g=i.length-1,m=0,h=n.length-1;for(;p<=g&&m<=h;)if(i[p]===null)p++;else if(i[g]===null)g--;else if(s[p]===a[m])l[m]=xt(i[p],n[m]),p++,m++;else if(s[g]===a[h])l[h]=xt(i[g],n[h]),g--,h--;else if(s[p]===a[h])l[h]=xt(i[p],n[h]),hr(e,l[h+1],i[p]),p++,h--;else if(s[g]===a[m])l[m]=xt(i[g],n[m]),hr(e,i[p],i[g]),g--,m++;else if(u===void 0&&(u=gc(a,m,h),c=gc(s,p,g)),u.has(s[p]))if(u.has(s[g])){let x=c.get(a[m]),y=x!==void 0?i[x]:null;if(y===null){let S=hr(e,i[p]);xt(S,n[m]),l[m]=S}else l[m]=xt(y,n[m]),hr(e,i[p],y),i[x]=null;m++}else Mo(i[g]),g--;else Mo(i[p]),p++;for(;m<=h;){let x=hr(e,l[h+1]);xt(x,n[m]),l[m++]=x}for(;p<=g;){let x=i[p++];x!==null&&Mo(x)}return this.ut=a,tl(e,l),or}});var io=class extends vt{constructor(t){if(super(t),this.it=R,t.type!==fr.CHILD)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===R||t==null)return this._t=void 0,this.it=t;if(t===or)return t;if(typeof t!="string")throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;let r=[t];return r.raw=r,this._t={_$litType$:this.constructor.resultType,strings:r,values:[]}}};io.directiveName="unsafeHTML",io.resultType=1;var Ko=mr(io);var In={};yo(In,{arrayReplaceAt:()=>On,asciiTrim:()=>Yt,assign:()=>Fr,escapeHtml:()=>ct,escapeRE:()=>Tm,fromCodePoint:()=>Lr,has:()=>mm,isMdAsciiPunct:()=>Wt,isPunctChar:()=>Ic,isPunctCharCode:()=>Vt,isSpace:()=>B,isString:()=>li,isValidEntityCode:()=>ui,isWhiteSpace:()=>Ht,lib:()=>Am,normalizeReference:()=>Gt,unescapeAll:()=>ut,unescapeMd:()=>xm});var ti={};yo(ti,{decode:()=>no,encode:()=>Qo,format:()=>Ar,parse:()=>ao});var bc={};function Hf(e){let t=bc[e];if(t)return t;t=bc[e]=[];for(let r=0;r<128;r++){let o=String.fromCharCode(r);t.push(o)}for(let r=0;r<e.length;r++){let o=e.charCodeAt(r);t[o]="%"+("0"+o.toString(16).toUpperCase()).slice(-2)}return t}function Zo(e,t){typeof t!="string"&&(t=Zo.defaultChars);let r=Hf(t);return e.replace(/(%[a-f0-9]{2})+/gi,function(o){let i="";for(let n=0,a=o.length;n<a;n+=3){let s=parseInt(o.slice(n+1,n+3),16);if(s<128){i+=r[s];continue}if((s&224)===192&&n+3<a){let l=parseInt(o.slice(n+4,n+6),16);if((l&192)===128){let u=s<<6&1984|l&63;u<128?i+="\uFFFD\uFFFD":i+=String.fromCharCode(u),n+=3;continue}}if((s&240)===224&&n+6<a){let l=parseInt(o.slice(n+4,n+6),16),u=parseInt(o.slice(n+7,n+9),16);if((l&192)===128&&(u&192)===128){let c=s<<12&61440|l<<6&4032|u&63;c<2048||c>=55296&&c<=57343?i+="\uFFFD\uFFFD\uFFFD":i+=String.fromCharCode(c),n+=6;continue}}if((s&248)===240&&n+9<a){let l=parseInt(o.slice(n+4,n+6),16),u=parseInt(o.slice(n+7,n+9),16),c=parseInt(o.slice(n+10,n+12),16);if((l&192)===128&&(u&192)===128&&(c&192)===128){let p=s<<18&1835008|l<<12&258048|u<<6&4032|c&63;p<65536||p>1114111?i+="\uFFFD\uFFFD\uFFFD\uFFFD":(p-=65536,i+=String.fromCharCode(55296+(p>>10),56320+(p&1023))),n+=9;continue}}i+="\uFFFD"}return i})}Zo.defaultChars=";/?:@&=+$,#";Zo.componentChars="";var no=Zo;var vc={};function Vf(e){let t=vc[e];if(t)return t;t=vc[e]=[];for(let r=0;r<128;r++){let o=String.fromCharCode(r);/^[0-9a-z]$/i.test(o)?t.push(o):t.push("%"+("0"+r.toString(16).toUpperCase()).slice(-2))}for(let r=0;r<e.length;r++)t[e.charCodeAt(r)]=e[r];return t}function Jo(e,t,r){typeof t!="string"&&(r=t,t=Jo.defaultChars),typeof r>"u"&&(r=!0);let o=Vf(t),i="";for(let n=0,a=e.length;n<a;n++){let s=e.charCodeAt(n);if(r&&s===37&&n+2<a&&/^[0-9a-f]{2}$/i.test(e.slice(n+1,n+3))){i+=e.slice(n,n+3),n+=2;continue}if(s<128){i+=o[s];continue}if(s>=55296&&s<=57343){if(s>=55296&&s<=56319&&n+1<a){let l=e.charCodeAt(n+1);if(l>=56320&&l<=57343){i+=encodeURIComponent(e[n]+e[n+1]),n++;continue}}i+="%EF%BF%BD";continue}i+=encodeURIComponent(e[n])}return i}Jo.defaultChars=";/?:@&=+$,-_.!~*'()#";Jo.componentChars="-_.!~*'()";var Qo=Jo;function Ar(e){let t="";return t+=e.protocol||"",t+=e.slashes?"//":"",t+=e.auth?e.auth+"@":"",e.hostname&&e.hostname.indexOf(":")!==-1?t+="["+e.hostname+"]":t+=e.hostname||"",t+=e.port?":"+e.port:"",t+=e.pathname||"",t+=e.search||"",t+=e.hash||"",t}function ei(){this.protocol=null,this.slashes=null,this.auth=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.pathname=null}var Wf=/^([a-z0-9.+-]+:)/i,Gf=/:[0-9]*$/,Yf=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,Xf=["<",">",'"',"`"," ","\r",`
`,"	"],Kf=["{","}","|","\\","^","`"].concat(Xf),Zf=["'"].concat(Kf),xc=["%","/","?",";","#"].concat(Zf),wc=["/","?","#"],Jf=255,yc=/^[+a-z0-9A-Z_-]{0,63}$/,Qf=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,kc={javascript:!0,"javascript:":!0},Cc={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0};function em(e,t){if(e&&e instanceof ei)return e;let r=new ei;return r.parse(e,t),r}ei.prototype.parse=function(e,t){let r,o,i,n=e;if(n=n.trim(),!t&&e.split("#").length===1){let u=Yf.exec(n);if(u)return this.pathname=u[1],u[2]&&(this.search=u[2]),this}let a=Wf.exec(n);if(a&&(a=a[0],r=a.toLowerCase(),this.protocol=a,n=n.substr(a.length)),(t||a||n.match(/^\/\/[^@\/]+@[^@\/]+/))&&(i=n.substr(0,2)==="//",i&&!(a&&kc[a])&&(n=n.substr(2),this.slashes=!0)),!kc[a]&&(i||a&&!Cc[a])){let u=-1;for(let h=0;h<wc.length;h++)o=n.indexOf(wc[h]),o!==-1&&(u===-1||o<u)&&(u=o);let c,p;u===-1?p=n.lastIndexOf("@"):p=n.lastIndexOf("@",u),p!==-1&&(c=n.slice(0,p),n=n.slice(p+1),this.auth=c),u=-1;for(let h=0;h<xc.length;h++)o=n.indexOf(xc[h]),o!==-1&&(u===-1||o<u)&&(u=o);u===-1&&(u=n.length),n[u-1]===":"&&u--;let g=n.slice(0,u);n=n.slice(u),this.parseHost(g),this.hostname=this.hostname||"";let m=this.hostname[0]==="["&&this.hostname[this.hostname.length-1]==="]";if(!m){let h=this.hostname.split(/\./);for(let x=0,y=h.length;x<y;x++){let S=h[x];if(S&&!S.match(yc)){let k="";for(let _=0,T=S.length;_<T;_++)S.charCodeAt(_)>127?k+="x":k+=S[_];if(!k.match(yc)){let _=h.slice(0,x),T=h.slice(x+1),E=S.match(Qf);E&&(_.push(E[1]),T.unshift(E[2])),T.length&&(n=T.join(".")+n),this.hostname=_.join(".");break}}}}this.hostname.length>Jf&&(this.hostname=""),m&&(this.hostname=this.hostname.substr(1,this.hostname.length-2))}let s=n.indexOf("#");s!==-1&&(this.hash=n.substr(s),n=n.slice(0,s));let l=n.indexOf("?");return l!==-1&&(this.search=n.substr(l),n=n.slice(0,l)),n&&(this.pathname=n),Cc[r]&&this.hostname&&!this.pathname&&(this.pathname=""),this};ei.prototype.parseHost=function(e){let t=Gf.exec(e);t&&(t=t[0],t!==":"&&(this.port=t.substr(1)),e=e.substr(0,e.length-t.length)),e&&(this.hostname=e)};var ao=em;var Fn={};yo(Fn,{Any:()=>ri,Cc:()=>oi,Cf:()=>Ec,P:()=>_r,S:()=>ii,Z:()=>ni});var ri=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;var oi=/[\0-\x1F\x7F-\x9F]/;var Ec=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u0890\u0891\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD80D[\uDC30-\uDC3F]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;var _r=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061D-\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C77\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1B7D\u1B7E\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4F\u2E52-\u2E5D\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDEAD\uDF55-\uDF59\uDF86-\uDF89]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5A\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDEB9\uDF3C-\uDF3E]|\uD806[\uDC3B\uDD44-\uDD46\uDDE2\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2\uDF00-\uDF09]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8\uDF43-\uDF4F\uDFFF]|\uD809[\uDC70-\uDC74]|\uD80B[\uDFF1\uDFF2]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A\uDFE2]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/;var ii=/[\$\+<->\^`\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u0888\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u166D\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20C0\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B97-\u2BFF\u2CE5-\u2CEA\u2E50\u2E51\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFF\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u31EF\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uAB6A\uAB6B\uFB29\uFBB2-\uFBC2\uFD40-\uFD4F\uFDCF\uFDFC-\uFDFF\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD]|\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9C\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD807[\uDFD5-\uDFF1]|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD833[\uDF50-\uDFC3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDEA\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD838[\uDD4F\uDEFF]|\uD83B[\uDCAC\uDCB0\uDD2E\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD0D-\uDDAD\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED7\uDEDC-\uDEEC\uDEF0-\uDEFC\uDF00-\uDF76\uDF7B-\uDFD9\uDFE0-\uDFEB\uDFF0]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDCB0\uDCB1\uDD00-\uDE53\uDE60-\uDE6D\uDE70-\uDE7C\uDE80-\uDE88\uDE90-\uDEBD\uDEBF-\uDEC5\uDECE-\uDEDB\uDEE0-\uDEE8\uDEF0-\uDEF8\uDF00-\uDF92\uDF94-\uDFCA]/;var ni=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;var Tc=new Uint16Array('\u1D41<\xD5\u0131\u028A\u049D\u057B\u05D0\u0675\u06DE\u07A2\u07D6\u080F\u0A4A\u0A91\u0DA1\u0E6D\u0F09\u0F26\u10CA\u1228\u12E1\u1415\u149D\u14C3\u14DF\u1525\0\0\0\0\0\0\u156B\u16CD\u198D\u1C12\u1DDD\u1F7E\u2060\u21B0\u228D\u23C0\u23FB\u2442\u2824\u2912\u2D08\u2E48\u2FCE\u3016\u32BA\u3639\u37AC\u38FE\u3A28\u3A71\u3AE0\u3B2E\u0800EMabcfglmnoprstu\\bfms\x7F\x84\x8B\x90\x95\x98\xA6\xB3\xB9\xC8\xCFlig\u803B\xC6\u40C6P\u803B&\u4026cute\u803B\xC1\u40C1reve;\u4102\u0100iyx}rc\u803B\xC2\u40C2;\u4410r;\uC000\u{1D504}rave\u803B\xC0\u40C0pha;\u4391acr;\u4100d;\u6A53\u0100gp\x9D\xA1on;\u4104f;\uC000\u{1D538}plyFunction;\u6061ing\u803B\xC5\u40C5\u0100cs\xBE\xC3r;\uC000\u{1D49C}ign;\u6254ilde\u803B\xC3\u40C3ml\u803B\xC4\u40C4\u0400aceforsu\xE5\xFB\xFE\u0117\u011C\u0122\u0127\u012A\u0100cr\xEA\xF2kslash;\u6216\u0176\xF6\xF8;\u6AE7ed;\u6306y;\u4411\u0180crt\u0105\u010B\u0114ause;\u6235noullis;\u612Ca;\u4392r;\uC000\u{1D505}pf;\uC000\u{1D539}eve;\u42D8c\xF2\u0113mpeq;\u624E\u0700HOacdefhilorsu\u014D\u0151\u0156\u0180\u019E\u01A2\u01B5\u01B7\u01BA\u01DC\u0215\u0273\u0278\u027Ecy;\u4427PY\u803B\xA9\u40A9\u0180cpy\u015D\u0162\u017Aute;\u4106\u0100;i\u0167\u0168\u62D2talDifferentialD;\u6145leys;\u612D\u0200aeio\u0189\u018E\u0194\u0198ron;\u410Cdil\u803B\xC7\u40C7rc;\u4108nint;\u6230ot;\u410A\u0100dn\u01A7\u01ADilla;\u40B8terDot;\u40B7\xF2\u017Fi;\u43A7rcle\u0200DMPT\u01C7\u01CB\u01D1\u01D6ot;\u6299inus;\u6296lus;\u6295imes;\u6297o\u0100cs\u01E2\u01F8kwiseContourIntegral;\u6232eCurly\u0100DQ\u0203\u020FoubleQuote;\u601Duote;\u6019\u0200lnpu\u021E\u0228\u0247\u0255on\u0100;e\u0225\u0226\u6237;\u6A74\u0180git\u022F\u0236\u023Aruent;\u6261nt;\u622FourIntegral;\u622E\u0100fr\u024C\u024E;\u6102oduct;\u6210nterClockwiseContourIntegral;\u6233oss;\u6A2Fcr;\uC000\u{1D49E}p\u0100;C\u0284\u0285\u62D3ap;\u624D\u0580DJSZacefios\u02A0\u02AC\u02B0\u02B4\u02B8\u02CB\u02D7\u02E1\u02E6\u0333\u048D\u0100;o\u0179\u02A5trahd;\u6911cy;\u4402cy;\u4405cy;\u440F\u0180grs\u02BF\u02C4\u02C7ger;\u6021r;\u61A1hv;\u6AE4\u0100ay\u02D0\u02D5ron;\u410E;\u4414l\u0100;t\u02DD\u02DE\u6207a;\u4394r;\uC000\u{1D507}\u0100af\u02EB\u0327\u0100cm\u02F0\u0322ritical\u0200ADGT\u0300\u0306\u0316\u031Ccute;\u40B4o\u0174\u030B\u030D;\u42D9bleAcute;\u42DDrave;\u4060ilde;\u42DCond;\u62C4ferentialD;\u6146\u0470\u033D\0\0\0\u0342\u0354\0\u0405f;\uC000\u{1D53B}\u0180;DE\u0348\u0349\u034D\u40A8ot;\u60DCqual;\u6250ble\u0300CDLRUV\u0363\u0372\u0382\u03CF\u03E2\u03F8ontourIntegra\xEC\u0239o\u0274\u0379\0\0\u037B\xBB\u0349nArrow;\u61D3\u0100eo\u0387\u03A4ft\u0180ART\u0390\u0396\u03A1rrow;\u61D0ightArrow;\u61D4e\xE5\u02CAng\u0100LR\u03AB\u03C4eft\u0100AR\u03B3\u03B9rrow;\u67F8ightArrow;\u67FAightArrow;\u67F9ight\u0100AT\u03D8\u03DErrow;\u61D2ee;\u62A8p\u0241\u03E9\0\0\u03EFrrow;\u61D1ownArrow;\u61D5erticalBar;\u6225n\u0300ABLRTa\u0412\u042A\u0430\u045E\u047F\u037Crrow\u0180;BU\u041D\u041E\u0422\u6193ar;\u6913pArrow;\u61F5reve;\u4311eft\u02D2\u043A\0\u0446\0\u0450ightVector;\u6950eeVector;\u695Eector\u0100;B\u0459\u045A\u61BDar;\u6956ight\u01D4\u0467\0\u0471eeVector;\u695Fector\u0100;B\u047A\u047B\u61C1ar;\u6957ee\u0100;A\u0486\u0487\u62A4rrow;\u61A7\u0100ct\u0492\u0497r;\uC000\u{1D49F}rok;\u4110\u0800NTacdfglmopqstux\u04BD\u04C0\u04C4\u04CB\u04DE\u04E2\u04E7\u04EE\u04F5\u0521\u052F\u0536\u0552\u055D\u0560\u0565G;\u414AH\u803B\xD0\u40D0cute\u803B\xC9\u40C9\u0180aiy\u04D2\u04D7\u04DCron;\u411Arc\u803B\xCA\u40CA;\u442Dot;\u4116r;\uC000\u{1D508}rave\u803B\xC8\u40C8ement;\u6208\u0100ap\u04FA\u04FEcr;\u4112ty\u0253\u0506\0\0\u0512mallSquare;\u65FBerySmallSquare;\u65AB\u0100gp\u0526\u052Aon;\u4118f;\uC000\u{1D53C}silon;\u4395u\u0100ai\u053C\u0549l\u0100;T\u0542\u0543\u6A75ilde;\u6242librium;\u61CC\u0100ci\u0557\u055Ar;\u6130m;\u6A73a;\u4397ml\u803B\xCB\u40CB\u0100ip\u056A\u056Fsts;\u6203onentialE;\u6147\u0280cfios\u0585\u0588\u058D\u05B2\u05CCy;\u4424r;\uC000\u{1D509}lled\u0253\u0597\0\0\u05A3mallSquare;\u65FCerySmallSquare;\u65AA\u0370\u05BA\0\u05BF\0\0\u05C4f;\uC000\u{1D53D}All;\u6200riertrf;\u6131c\xF2\u05CB\u0600JTabcdfgorst\u05E8\u05EC\u05EF\u05FA\u0600\u0612\u0616\u061B\u061D\u0623\u066C\u0672cy;\u4403\u803B>\u403Emma\u0100;d\u05F7\u05F8\u4393;\u43DCreve;\u411E\u0180eiy\u0607\u060C\u0610dil;\u4122rc;\u411C;\u4413ot;\u4120r;\uC000\u{1D50A};\u62D9pf;\uC000\u{1D53E}eater\u0300EFGLST\u0635\u0644\u064E\u0656\u065B\u0666qual\u0100;L\u063E\u063F\u6265ess;\u62DBullEqual;\u6267reater;\u6AA2ess;\u6277lantEqual;\u6A7Eilde;\u6273cr;\uC000\u{1D4A2};\u626B\u0400Aacfiosu\u0685\u068B\u0696\u069B\u069E\u06AA\u06BE\u06CARDcy;\u442A\u0100ct\u0690\u0694ek;\u42C7;\u405Eirc;\u4124r;\u610ClbertSpace;\u610B\u01F0\u06AF\0\u06B2f;\u610DizontalLine;\u6500\u0100ct\u06C3\u06C5\xF2\u06A9rok;\u4126mp\u0144\u06D0\u06D8ownHum\xF0\u012Fqual;\u624F\u0700EJOacdfgmnostu\u06FA\u06FE\u0703\u0707\u070E\u071A\u071E\u0721\u0728\u0744\u0778\u078B\u078F\u0795cy;\u4415lig;\u4132cy;\u4401cute\u803B\xCD\u40CD\u0100iy\u0713\u0718rc\u803B\xCE\u40CE;\u4418ot;\u4130r;\u6111rave\u803B\xCC\u40CC\u0180;ap\u0720\u072F\u073F\u0100cg\u0734\u0737r;\u412AinaryI;\u6148lie\xF3\u03DD\u01F4\u0749\0\u0762\u0100;e\u074D\u074E\u622C\u0100gr\u0753\u0758ral;\u622Bsection;\u62C2isible\u0100CT\u076C\u0772omma;\u6063imes;\u6062\u0180gpt\u077F\u0783\u0788on;\u412Ef;\uC000\u{1D540}a;\u4399cr;\u6110ilde;\u4128\u01EB\u079A\0\u079Ecy;\u4406l\u803B\xCF\u40CF\u0280cfosu\u07AC\u07B7\u07BC\u07C2\u07D0\u0100iy\u07B1\u07B5rc;\u4134;\u4419r;\uC000\u{1D50D}pf;\uC000\u{1D541}\u01E3\u07C7\0\u07CCr;\uC000\u{1D4A5}rcy;\u4408kcy;\u4404\u0380HJacfos\u07E4\u07E8\u07EC\u07F1\u07FD\u0802\u0808cy;\u4425cy;\u440Cppa;\u439A\u0100ey\u07F6\u07FBdil;\u4136;\u441Ar;\uC000\u{1D50E}pf;\uC000\u{1D542}cr;\uC000\u{1D4A6}\u0580JTaceflmost\u0825\u0829\u082C\u0850\u0863\u09B3\u09B8\u09C7\u09CD\u0A37\u0A47cy;\u4409\u803B<\u403C\u0280cmnpr\u0837\u083C\u0841\u0844\u084Dute;\u4139bda;\u439Bg;\u67EAlacetrf;\u6112r;\u619E\u0180aey\u0857\u085C\u0861ron;\u413Ddil;\u413B;\u441B\u0100fs\u0868\u0970t\u0500ACDFRTUVar\u087E\u08A9\u08B1\u08E0\u08E6\u08FC\u092F\u095B\u0390\u096A\u0100nr\u0883\u088FgleBracket;\u67E8row\u0180;BR\u0899\u089A\u089E\u6190ar;\u61E4ightArrow;\u61C6eiling;\u6308o\u01F5\u08B7\0\u08C3bleBracket;\u67E6n\u01D4\u08C8\0\u08D2eeVector;\u6961ector\u0100;B\u08DB\u08DC\u61C3ar;\u6959loor;\u630Aight\u0100AV\u08EF\u08F5rrow;\u6194ector;\u694E\u0100er\u0901\u0917e\u0180;AV\u0909\u090A\u0910\u62A3rrow;\u61A4ector;\u695Aiangle\u0180;BE\u0924\u0925\u0929\u62B2ar;\u69CFqual;\u62B4p\u0180DTV\u0937\u0942\u094CownVector;\u6951eeVector;\u6960ector\u0100;B\u0956\u0957\u61BFar;\u6958ector\u0100;B\u0965\u0966\u61BCar;\u6952ight\xE1\u039Cs\u0300EFGLST\u097E\u098B\u0995\u099D\u09A2\u09ADqualGreater;\u62DAullEqual;\u6266reater;\u6276ess;\u6AA1lantEqual;\u6A7Dilde;\u6272r;\uC000\u{1D50F}\u0100;e\u09BD\u09BE\u62D8ftarrow;\u61DAidot;\u413F\u0180npw\u09D4\u0A16\u0A1Bg\u0200LRlr\u09DE\u09F7\u0A02\u0A10eft\u0100AR\u09E6\u09ECrrow;\u67F5ightArrow;\u67F7ightArrow;\u67F6eft\u0100ar\u03B3\u0A0Aight\xE1\u03BFight\xE1\u03CAf;\uC000\u{1D543}er\u0100LR\u0A22\u0A2CeftArrow;\u6199ightArrow;\u6198\u0180cht\u0A3E\u0A40\u0A42\xF2\u084C;\u61B0rok;\u4141;\u626A\u0400acefiosu\u0A5A\u0A5D\u0A60\u0A77\u0A7C\u0A85\u0A8B\u0A8Ep;\u6905y;\u441C\u0100dl\u0A65\u0A6FiumSpace;\u605Flintrf;\u6133r;\uC000\u{1D510}nusPlus;\u6213pf;\uC000\u{1D544}c\xF2\u0A76;\u439C\u0480Jacefostu\u0AA3\u0AA7\u0AAD\u0AC0\u0B14\u0B19\u0D91\u0D97\u0D9Ecy;\u440Acute;\u4143\u0180aey\u0AB4\u0AB9\u0ABEron;\u4147dil;\u4145;\u441D\u0180gsw\u0AC7\u0AF0\u0B0Eative\u0180MTV\u0AD3\u0ADF\u0AE8ediumSpace;\u600Bhi\u0100cn\u0AE6\u0AD8\xEB\u0AD9eryThi\xEE\u0AD9ted\u0100GL\u0AF8\u0B06reaterGreate\xF2\u0673essLes\xF3\u0A48Line;\u400Ar;\uC000\u{1D511}\u0200Bnpt\u0B22\u0B28\u0B37\u0B3Areak;\u6060BreakingSpace;\u40A0f;\u6115\u0680;CDEGHLNPRSTV\u0B55\u0B56\u0B6A\u0B7C\u0BA1\u0BEB\u0C04\u0C5E\u0C84\u0CA6\u0CD8\u0D61\u0D85\u6AEC\u0100ou\u0B5B\u0B64ngruent;\u6262pCap;\u626DoubleVerticalBar;\u6226\u0180lqx\u0B83\u0B8A\u0B9Bement;\u6209ual\u0100;T\u0B92\u0B93\u6260ilde;\uC000\u2242\u0338ists;\u6204reater\u0380;EFGLST\u0BB6\u0BB7\u0BBD\u0BC9\u0BD3\u0BD8\u0BE5\u626Fqual;\u6271ullEqual;\uC000\u2267\u0338reater;\uC000\u226B\u0338ess;\u6279lantEqual;\uC000\u2A7E\u0338ilde;\u6275ump\u0144\u0BF2\u0BFDownHump;\uC000\u224E\u0338qual;\uC000\u224F\u0338e\u0100fs\u0C0A\u0C27tTriangle\u0180;BE\u0C1A\u0C1B\u0C21\u62EAar;\uC000\u29CF\u0338qual;\u62ECs\u0300;EGLST\u0C35\u0C36\u0C3C\u0C44\u0C4B\u0C58\u626Equal;\u6270reater;\u6278ess;\uC000\u226A\u0338lantEqual;\uC000\u2A7D\u0338ilde;\u6274ested\u0100GL\u0C68\u0C79reaterGreater;\uC000\u2AA2\u0338essLess;\uC000\u2AA1\u0338recedes\u0180;ES\u0C92\u0C93\u0C9B\u6280qual;\uC000\u2AAF\u0338lantEqual;\u62E0\u0100ei\u0CAB\u0CB9verseElement;\u620CghtTriangle\u0180;BE\u0CCB\u0CCC\u0CD2\u62EBar;\uC000\u29D0\u0338qual;\u62ED\u0100qu\u0CDD\u0D0CuareSu\u0100bp\u0CE8\u0CF9set\u0100;E\u0CF0\u0CF3\uC000\u228F\u0338qual;\u62E2erset\u0100;E\u0D03\u0D06\uC000\u2290\u0338qual;\u62E3\u0180bcp\u0D13\u0D24\u0D4Eset\u0100;E\u0D1B\u0D1E\uC000\u2282\u20D2qual;\u6288ceeds\u0200;EST\u0D32\u0D33\u0D3B\u0D46\u6281qual;\uC000\u2AB0\u0338lantEqual;\u62E1ilde;\uC000\u227F\u0338erset\u0100;E\u0D58\u0D5B\uC000\u2283\u20D2qual;\u6289ilde\u0200;EFT\u0D6E\u0D6F\u0D75\u0D7F\u6241qual;\u6244ullEqual;\u6247ilde;\u6249erticalBar;\u6224cr;\uC000\u{1D4A9}ilde\u803B\xD1\u40D1;\u439D\u0700Eacdfgmoprstuv\u0DBD\u0DC2\u0DC9\u0DD5\u0DDB\u0DE0\u0DE7\u0DFC\u0E02\u0E20\u0E22\u0E32\u0E3F\u0E44lig;\u4152cute\u803B\xD3\u40D3\u0100iy\u0DCE\u0DD3rc\u803B\xD4\u40D4;\u441Eblac;\u4150r;\uC000\u{1D512}rave\u803B\xD2\u40D2\u0180aei\u0DEE\u0DF2\u0DF6cr;\u414Cga;\u43A9cron;\u439Fpf;\uC000\u{1D546}enCurly\u0100DQ\u0E0E\u0E1AoubleQuote;\u601Cuote;\u6018;\u6A54\u0100cl\u0E27\u0E2Cr;\uC000\u{1D4AA}ash\u803B\xD8\u40D8i\u016C\u0E37\u0E3Cde\u803B\xD5\u40D5es;\u6A37ml\u803B\xD6\u40D6er\u0100BP\u0E4B\u0E60\u0100ar\u0E50\u0E53r;\u603Eac\u0100ek\u0E5A\u0E5C;\u63DEet;\u63B4arenthesis;\u63DC\u0480acfhilors\u0E7F\u0E87\u0E8A\u0E8F\u0E92\u0E94\u0E9D\u0EB0\u0EFCrtialD;\u6202y;\u441Fr;\uC000\u{1D513}i;\u43A6;\u43A0usMinus;\u40B1\u0100ip\u0EA2\u0EADncareplan\xE5\u069Df;\u6119\u0200;eio\u0EB9\u0EBA\u0EE0\u0EE4\u6ABBcedes\u0200;EST\u0EC8\u0EC9\u0ECF\u0EDA\u627Aqual;\u6AAFlantEqual;\u627Cilde;\u627Eme;\u6033\u0100dp\u0EE9\u0EEEuct;\u620Fortion\u0100;a\u0225\u0EF9l;\u621D\u0100ci\u0F01\u0F06r;\uC000\u{1D4AB};\u43A8\u0200Ufos\u0F11\u0F16\u0F1B\u0F1FOT\u803B"\u4022r;\uC000\u{1D514}pf;\u611Acr;\uC000\u{1D4AC}\u0600BEacefhiorsu\u0F3E\u0F43\u0F47\u0F60\u0F73\u0FA7\u0FAA\u0FAD\u1096\u10A9\u10B4\u10BEarr;\u6910G\u803B\xAE\u40AE\u0180cnr\u0F4E\u0F53\u0F56ute;\u4154g;\u67EBr\u0100;t\u0F5C\u0F5D\u61A0l;\u6916\u0180aey\u0F67\u0F6C\u0F71ron;\u4158dil;\u4156;\u4420\u0100;v\u0F78\u0F79\u611Cerse\u0100EU\u0F82\u0F99\u0100lq\u0F87\u0F8Eement;\u620Builibrium;\u61CBpEquilibrium;\u696Fr\xBB\u0F79o;\u43A1ght\u0400ACDFTUVa\u0FC1\u0FEB\u0FF3\u1022\u1028\u105B\u1087\u03D8\u0100nr\u0FC6\u0FD2gleBracket;\u67E9row\u0180;BL\u0FDC\u0FDD\u0FE1\u6192ar;\u61E5eftArrow;\u61C4eiling;\u6309o\u01F5\u0FF9\0\u1005bleBracket;\u67E7n\u01D4\u100A\0\u1014eeVector;\u695Dector\u0100;B\u101D\u101E\u61C2ar;\u6955loor;\u630B\u0100er\u102D\u1043e\u0180;AV\u1035\u1036\u103C\u62A2rrow;\u61A6ector;\u695Biangle\u0180;BE\u1050\u1051\u1055\u62B3ar;\u69D0qual;\u62B5p\u0180DTV\u1063\u106E\u1078ownVector;\u694FeeVector;\u695Cector\u0100;B\u1082\u1083\u61BEar;\u6954ector\u0100;B\u1091\u1092\u61C0ar;\u6953\u0100pu\u109B\u109Ef;\u611DndImplies;\u6970ightarrow;\u61DB\u0100ch\u10B9\u10BCr;\u611B;\u61B1leDelayed;\u69F4\u0680HOacfhimoqstu\u10E4\u10F1\u10F7\u10FD\u1119\u111E\u1151\u1156\u1161\u1167\u11B5\u11BB\u11BF\u0100Cc\u10E9\u10EEHcy;\u4429y;\u4428FTcy;\u442Ccute;\u415A\u0280;aeiy\u1108\u1109\u110E\u1113\u1117\u6ABCron;\u4160dil;\u415Erc;\u415C;\u4421r;\uC000\u{1D516}ort\u0200DLRU\u112A\u1134\u113E\u1149ownArrow\xBB\u041EeftArrow\xBB\u089AightArrow\xBB\u0FDDpArrow;\u6191gma;\u43A3allCircle;\u6218pf;\uC000\u{1D54A}\u0272\u116D\0\0\u1170t;\u621Aare\u0200;ISU\u117B\u117C\u1189\u11AF\u65A1ntersection;\u6293u\u0100bp\u118F\u119Eset\u0100;E\u1197\u1198\u628Fqual;\u6291erset\u0100;E\u11A8\u11A9\u6290qual;\u6292nion;\u6294cr;\uC000\u{1D4AE}ar;\u62C6\u0200bcmp\u11C8\u11DB\u1209\u120B\u0100;s\u11CD\u11CE\u62D0et\u0100;E\u11CD\u11D5qual;\u6286\u0100ch\u11E0\u1205eeds\u0200;EST\u11ED\u11EE\u11F4\u11FF\u627Bqual;\u6AB0lantEqual;\u627Dilde;\u627FTh\xE1\u0F8C;\u6211\u0180;es\u1212\u1213\u1223\u62D1rset\u0100;E\u121C\u121D\u6283qual;\u6287et\xBB\u1213\u0580HRSacfhiors\u123E\u1244\u1249\u1255\u125E\u1271\u1276\u129F\u12C2\u12C8\u12D1ORN\u803B\xDE\u40DEADE;\u6122\u0100Hc\u124E\u1252cy;\u440By;\u4426\u0100bu\u125A\u125C;\u4009;\u43A4\u0180aey\u1265\u126A\u126Fron;\u4164dil;\u4162;\u4422r;\uC000\u{1D517}\u0100ei\u127B\u1289\u01F2\u1280\0\u1287efore;\u6234a;\u4398\u0100cn\u128E\u1298kSpace;\uC000\u205F\u200ASpace;\u6009lde\u0200;EFT\u12AB\u12AC\u12B2\u12BC\u623Cqual;\u6243ullEqual;\u6245ilde;\u6248pf;\uC000\u{1D54B}ipleDot;\u60DB\u0100ct\u12D6\u12DBr;\uC000\u{1D4AF}rok;\u4166\u0AE1\u12F7\u130E\u131A\u1326\0\u132C\u1331\0\0\0\0\0\u1338\u133D\u1377\u1385\0\u13FF\u1404\u140A\u1410\u0100cr\u12FB\u1301ute\u803B\xDA\u40DAr\u0100;o\u1307\u1308\u619Fcir;\u6949r\u01E3\u1313\0\u1316y;\u440Eve;\u416C\u0100iy\u131E\u1323rc\u803B\xDB\u40DB;\u4423blac;\u4170r;\uC000\u{1D518}rave\u803B\xD9\u40D9acr;\u416A\u0100di\u1341\u1369er\u0100BP\u1348\u135D\u0100ar\u134D\u1350r;\u405Fac\u0100ek\u1357\u1359;\u63DFet;\u63B5arenthesis;\u63DDon\u0100;P\u1370\u1371\u62C3lus;\u628E\u0100gp\u137B\u137Fon;\u4172f;\uC000\u{1D54C}\u0400ADETadps\u1395\u13AE\u13B8\u13C4\u03E8\u13D2\u13D7\u13F3rrow\u0180;BD\u1150\u13A0\u13A4ar;\u6912ownArrow;\u61C5ownArrow;\u6195quilibrium;\u696Eee\u0100;A\u13CB\u13CC\u62A5rrow;\u61A5own\xE1\u03F3er\u0100LR\u13DE\u13E8eftArrow;\u6196ightArrow;\u6197i\u0100;l\u13F9\u13FA\u43D2on;\u43A5ing;\u416Ecr;\uC000\u{1D4B0}ilde;\u4168ml\u803B\xDC\u40DC\u0480Dbcdefosv\u1427\u142C\u1430\u1433\u143E\u1485\u148A\u1490\u1496ash;\u62ABar;\u6AEBy;\u4412ash\u0100;l\u143B\u143C\u62A9;\u6AE6\u0100er\u1443\u1445;\u62C1\u0180bty\u144C\u1450\u147Aar;\u6016\u0100;i\u144F\u1455cal\u0200BLST\u1461\u1465\u146A\u1474ar;\u6223ine;\u407Ceparator;\u6758ilde;\u6240ThinSpace;\u600Ar;\uC000\u{1D519}pf;\uC000\u{1D54D}cr;\uC000\u{1D4B1}dash;\u62AA\u0280cefos\u14A7\u14AC\u14B1\u14B6\u14BCirc;\u4174dge;\u62C0r;\uC000\u{1D51A}pf;\uC000\u{1D54E}cr;\uC000\u{1D4B2}\u0200fios\u14CB\u14D0\u14D2\u14D8r;\uC000\u{1D51B};\u439Epf;\uC000\u{1D54F}cr;\uC000\u{1D4B3}\u0480AIUacfosu\u14F1\u14F5\u14F9\u14FD\u1504\u150F\u1514\u151A\u1520cy;\u442Fcy;\u4407cy;\u442Ecute\u803B\xDD\u40DD\u0100iy\u1509\u150Drc;\u4176;\u442Br;\uC000\u{1D51C}pf;\uC000\u{1D550}cr;\uC000\u{1D4B4}ml;\u4178\u0400Hacdefos\u1535\u1539\u153F\u154B\u154F\u155D\u1560\u1564cy;\u4416cute;\u4179\u0100ay\u1544\u1549ron;\u417D;\u4417ot;\u417B\u01F2\u1554\0\u155BoWidt\xE8\u0AD9a;\u4396r;\u6128pf;\u6124cr;\uC000\u{1D4B5}\u0BE1\u1583\u158A\u1590\0\u15B0\u15B6\u15BF\0\0\0\0\u15C6\u15DB\u15EB\u165F\u166D\0\u1695\u169B\u16B2\u16B9\0\u16BEcute\u803B\xE1\u40E1reve;\u4103\u0300;Ediuy\u159C\u159D\u15A1\u15A3\u15A8\u15AD\u623E;\uC000\u223E\u0333;\u623Frc\u803B\xE2\u40E2te\u80BB\xB4\u0306;\u4430lig\u803B\xE6\u40E6\u0100;r\xB2\u15BA;\uC000\u{1D51E}rave\u803B\xE0\u40E0\u0100ep\u15CA\u15D6\u0100fp\u15CF\u15D4sym;\u6135\xE8\u15D3ha;\u43B1\u0100ap\u15DFc\u0100cl\u15E4\u15E7r;\u4101g;\u6A3F\u0264\u15F0\0\0\u160A\u0280;adsv\u15FA\u15FB\u15FF\u1601\u1607\u6227nd;\u6A55;\u6A5Clope;\u6A58;\u6A5A\u0380;elmrsz\u1618\u1619\u161B\u161E\u163F\u164F\u1659\u6220;\u69A4e\xBB\u1619sd\u0100;a\u1625\u1626\u6221\u0461\u1630\u1632\u1634\u1636\u1638\u163A\u163C\u163E;\u69A8;\u69A9;\u69AA;\u69AB;\u69AC;\u69AD;\u69AE;\u69AFt\u0100;v\u1645\u1646\u621Fb\u0100;d\u164C\u164D\u62BE;\u699D\u0100pt\u1654\u1657h;\u6222\xBB\xB9arr;\u637C\u0100gp\u1663\u1667on;\u4105f;\uC000\u{1D552}\u0380;Eaeiop\u12C1\u167B\u167D\u1682\u1684\u1687\u168A;\u6A70cir;\u6A6F;\u624Ad;\u624Bs;\u4027rox\u0100;e\u12C1\u1692\xF1\u1683ing\u803B\xE5\u40E5\u0180cty\u16A1\u16A6\u16A8r;\uC000\u{1D4B6};\u402Amp\u0100;e\u12C1\u16AF\xF1\u0288ilde\u803B\xE3\u40E3ml\u803B\xE4\u40E4\u0100ci\u16C2\u16C8onin\xF4\u0272nt;\u6A11\u0800Nabcdefiklnoprsu\u16ED\u16F1\u1730\u173C\u1743\u1748\u1778\u177D\u17E0\u17E6\u1839\u1850\u170D\u193D\u1948\u1970ot;\u6AED\u0100cr\u16F6\u171Ek\u0200ceps\u1700\u1705\u170D\u1713ong;\u624Cpsilon;\u43F6rime;\u6035im\u0100;e\u171A\u171B\u623Dq;\u62CD\u0176\u1722\u1726ee;\u62BDed\u0100;g\u172C\u172D\u6305e\xBB\u172Drk\u0100;t\u135C\u1737brk;\u63B6\u0100oy\u1701\u1741;\u4431quo;\u601E\u0280cmprt\u1753\u175B\u1761\u1764\u1768aus\u0100;e\u010A\u0109ptyv;\u69B0s\xE9\u170Cno\xF5\u0113\u0180ahw\u176F\u1771\u1773;\u43B2;\u6136een;\u626Cr;\uC000\u{1D51F}g\u0380costuvw\u178D\u179D\u17B3\u17C1\u17D5\u17DB\u17DE\u0180aiu\u1794\u1796\u179A\xF0\u0760rc;\u65EFp\xBB\u1371\u0180dpt\u17A4\u17A8\u17ADot;\u6A00lus;\u6A01imes;\u6A02\u0271\u17B9\0\0\u17BEcup;\u6A06ar;\u6605riangle\u0100du\u17CD\u17D2own;\u65BDp;\u65B3plus;\u6A04e\xE5\u1444\xE5\u14ADarow;\u690D\u0180ako\u17ED\u1826\u1835\u0100cn\u17F2\u1823k\u0180lst\u17FA\u05AB\u1802ozenge;\u69EBriangle\u0200;dlr\u1812\u1813\u1818\u181D\u65B4own;\u65BEeft;\u65C2ight;\u65B8k;\u6423\u01B1\u182B\0\u1833\u01B2\u182F\0\u1831;\u6592;\u65914;\u6593ck;\u6588\u0100eo\u183E\u184D\u0100;q\u1843\u1846\uC000=\u20E5uiv;\uC000\u2261\u20E5t;\u6310\u0200ptwx\u1859\u185E\u1867\u186Cf;\uC000\u{1D553}\u0100;t\u13CB\u1863om\xBB\u13CCtie;\u62C8\u0600DHUVbdhmptuv\u1885\u1896\u18AA\u18BB\u18D7\u18DB\u18EC\u18FF\u1905\u190A\u1910\u1921\u0200LRlr\u188E\u1890\u1892\u1894;\u6557;\u6554;\u6556;\u6553\u0280;DUdu\u18A1\u18A2\u18A4\u18A6\u18A8\u6550;\u6566;\u6569;\u6564;\u6567\u0200LRlr\u18B3\u18B5\u18B7\u18B9;\u655D;\u655A;\u655C;\u6559\u0380;HLRhlr\u18CA\u18CB\u18CD\u18CF\u18D1\u18D3\u18D5\u6551;\u656C;\u6563;\u6560;\u656B;\u6562;\u655Fox;\u69C9\u0200LRlr\u18E4\u18E6\u18E8\u18EA;\u6555;\u6552;\u6510;\u650C\u0280;DUdu\u06BD\u18F7\u18F9\u18FB\u18FD;\u6565;\u6568;\u652C;\u6534inus;\u629Flus;\u629Eimes;\u62A0\u0200LRlr\u1919\u191B\u191D\u191F;\u655B;\u6558;\u6518;\u6514\u0380;HLRhlr\u1930\u1931\u1933\u1935\u1937\u1939\u193B\u6502;\u656A;\u6561;\u655E;\u653C;\u6524;\u651C\u0100ev\u0123\u1942bar\u803B\xA6\u40A6\u0200ceio\u1951\u1956\u195A\u1960r;\uC000\u{1D4B7}mi;\u604Fm\u0100;e\u171A\u171Cl\u0180;bh\u1968\u1969\u196B\u405C;\u69C5sub;\u67C8\u016C\u1974\u197El\u0100;e\u1979\u197A\u6022t\xBB\u197Ap\u0180;Ee\u012F\u1985\u1987;\u6AAE\u0100;q\u06DC\u06DB\u0CE1\u19A7\0\u19E8\u1A11\u1A15\u1A32\0\u1A37\u1A50\0\0\u1AB4\0\0\u1AC1\0\0\u1B21\u1B2E\u1B4D\u1B52\0\u1BFD\0\u1C0C\u0180cpr\u19AD\u19B2\u19DDute;\u4107\u0300;abcds\u19BF\u19C0\u19C4\u19CA\u19D5\u19D9\u6229nd;\u6A44rcup;\u6A49\u0100au\u19CF\u19D2p;\u6A4Bp;\u6A47ot;\u6A40;\uC000\u2229\uFE00\u0100eo\u19E2\u19E5t;\u6041\xEE\u0693\u0200aeiu\u19F0\u19FB\u1A01\u1A05\u01F0\u19F5\0\u19F8s;\u6A4Don;\u410Ddil\u803B\xE7\u40E7rc;\u4109ps\u0100;s\u1A0C\u1A0D\u6A4Cm;\u6A50ot;\u410B\u0180dmn\u1A1B\u1A20\u1A26il\u80BB\xB8\u01ADptyv;\u69B2t\u8100\xA2;e\u1A2D\u1A2E\u40A2r\xE4\u01B2r;\uC000\u{1D520}\u0180cei\u1A3D\u1A40\u1A4Dy;\u4447ck\u0100;m\u1A47\u1A48\u6713ark\xBB\u1A48;\u43C7r\u0380;Ecefms\u1A5F\u1A60\u1A62\u1A6B\u1AA4\u1AAA\u1AAE\u65CB;\u69C3\u0180;el\u1A69\u1A6A\u1A6D\u42C6q;\u6257e\u0261\u1A74\0\0\u1A88rrow\u0100lr\u1A7C\u1A81eft;\u61BAight;\u61BB\u0280RSacd\u1A92\u1A94\u1A96\u1A9A\u1A9F\xBB\u0F47;\u64C8st;\u629Birc;\u629Aash;\u629Dnint;\u6A10id;\u6AEFcir;\u69C2ubs\u0100;u\u1ABB\u1ABC\u6663it\xBB\u1ABC\u02EC\u1AC7\u1AD4\u1AFA\0\u1B0Aon\u0100;e\u1ACD\u1ACE\u403A\u0100;q\xC7\xC6\u026D\u1AD9\0\0\u1AE2a\u0100;t\u1ADE\u1ADF\u402C;\u4040\u0180;fl\u1AE8\u1AE9\u1AEB\u6201\xEE\u1160e\u0100mx\u1AF1\u1AF6ent\xBB\u1AE9e\xF3\u024D\u01E7\u1AFE\0\u1B07\u0100;d\u12BB\u1B02ot;\u6A6Dn\xF4\u0246\u0180fry\u1B10\u1B14\u1B17;\uC000\u{1D554}o\xE4\u0254\u8100\xA9;s\u0155\u1B1Dr;\u6117\u0100ao\u1B25\u1B29rr;\u61B5ss;\u6717\u0100cu\u1B32\u1B37r;\uC000\u{1D4B8}\u0100bp\u1B3C\u1B44\u0100;e\u1B41\u1B42\u6ACF;\u6AD1\u0100;e\u1B49\u1B4A\u6AD0;\u6AD2dot;\u62EF\u0380delprvw\u1B60\u1B6C\u1B77\u1B82\u1BAC\u1BD4\u1BF9arr\u0100lr\u1B68\u1B6A;\u6938;\u6935\u0270\u1B72\0\0\u1B75r;\u62DEc;\u62DFarr\u0100;p\u1B7F\u1B80\u61B6;\u693D\u0300;bcdos\u1B8F\u1B90\u1B96\u1BA1\u1BA5\u1BA8\u622Arcap;\u6A48\u0100au\u1B9B\u1B9Ep;\u6A46p;\u6A4Aot;\u628Dr;\u6A45;\uC000\u222A\uFE00\u0200alrv\u1BB5\u1BBF\u1BDE\u1BE3rr\u0100;m\u1BBC\u1BBD\u61B7;\u693Cy\u0180evw\u1BC7\u1BD4\u1BD8q\u0270\u1BCE\0\0\u1BD2re\xE3\u1B73u\xE3\u1B75ee;\u62CEedge;\u62CFen\u803B\xA4\u40A4earrow\u0100lr\u1BEE\u1BF3eft\xBB\u1B80ight\xBB\u1BBDe\xE4\u1BDD\u0100ci\u1C01\u1C07onin\xF4\u01F7nt;\u6231lcty;\u632D\u0980AHabcdefhijlorstuwz\u1C38\u1C3B\u1C3F\u1C5D\u1C69\u1C75\u1C8A\u1C9E\u1CAC\u1CB7\u1CFB\u1CFF\u1D0D\u1D7B\u1D91\u1DAB\u1DBB\u1DC6\u1DCDr\xF2\u0381ar;\u6965\u0200glrs\u1C48\u1C4D\u1C52\u1C54ger;\u6020eth;\u6138\xF2\u1133h\u0100;v\u1C5A\u1C5B\u6010\xBB\u090A\u016B\u1C61\u1C67arow;\u690Fa\xE3\u0315\u0100ay\u1C6E\u1C73ron;\u410F;\u4434\u0180;ao\u0332\u1C7C\u1C84\u0100gr\u02BF\u1C81r;\u61CAtseq;\u6A77\u0180glm\u1C91\u1C94\u1C98\u803B\xB0\u40B0ta;\u43B4ptyv;\u69B1\u0100ir\u1CA3\u1CA8sht;\u697F;\uC000\u{1D521}ar\u0100lr\u1CB3\u1CB5\xBB\u08DC\xBB\u101E\u0280aegsv\u1CC2\u0378\u1CD6\u1CDC\u1CE0m\u0180;os\u0326\u1CCA\u1CD4nd\u0100;s\u0326\u1CD1uit;\u6666amma;\u43DDin;\u62F2\u0180;io\u1CE7\u1CE8\u1CF8\u40F7de\u8100\xF7;o\u1CE7\u1CF0ntimes;\u62C7n\xF8\u1CF7cy;\u4452c\u026F\u1D06\0\0\u1D0Arn;\u631Eop;\u630D\u0280lptuw\u1D18\u1D1D\u1D22\u1D49\u1D55lar;\u4024f;\uC000\u{1D555}\u0280;emps\u030B\u1D2D\u1D37\u1D3D\u1D42q\u0100;d\u0352\u1D33ot;\u6251inus;\u6238lus;\u6214quare;\u62A1blebarwedg\xE5\xFAn\u0180adh\u112E\u1D5D\u1D67ownarrow\xF3\u1C83arpoon\u0100lr\u1D72\u1D76ef\xF4\u1CB4igh\xF4\u1CB6\u0162\u1D7F\u1D85karo\xF7\u0F42\u026F\u1D8A\0\0\u1D8Ern;\u631Fop;\u630C\u0180cot\u1D98\u1DA3\u1DA6\u0100ry\u1D9D\u1DA1;\uC000\u{1D4B9};\u4455l;\u69F6rok;\u4111\u0100dr\u1DB0\u1DB4ot;\u62F1i\u0100;f\u1DBA\u1816\u65BF\u0100ah\u1DC0\u1DC3r\xF2\u0429a\xF2\u0FA6angle;\u69A6\u0100ci\u1DD2\u1DD5y;\u445Fgrarr;\u67FF\u0900Dacdefglmnopqrstux\u1E01\u1E09\u1E19\u1E38\u0578\u1E3C\u1E49\u1E61\u1E7E\u1EA5\u1EAF\u1EBD\u1EE1\u1F2A\u1F37\u1F44\u1F4E\u1F5A\u0100Do\u1E06\u1D34o\xF4\u1C89\u0100cs\u1E0E\u1E14ute\u803B\xE9\u40E9ter;\u6A6E\u0200aioy\u1E22\u1E27\u1E31\u1E36ron;\u411Br\u0100;c\u1E2D\u1E2E\u6256\u803B\xEA\u40EAlon;\u6255;\u444Dot;\u4117\u0100Dr\u1E41\u1E45ot;\u6252;\uC000\u{1D522}\u0180;rs\u1E50\u1E51\u1E57\u6A9Aave\u803B\xE8\u40E8\u0100;d\u1E5C\u1E5D\u6A96ot;\u6A98\u0200;ils\u1E6A\u1E6B\u1E72\u1E74\u6A99nters;\u63E7;\u6113\u0100;d\u1E79\u1E7A\u6A95ot;\u6A97\u0180aps\u1E85\u1E89\u1E97cr;\u4113ty\u0180;sv\u1E92\u1E93\u1E95\u6205et\xBB\u1E93p\u01001;\u1E9D\u1EA4\u0133\u1EA1\u1EA3;\u6004;\u6005\u6003\u0100gs\u1EAA\u1EAC;\u414Bp;\u6002\u0100gp\u1EB4\u1EB8on;\u4119f;\uC000\u{1D556}\u0180als\u1EC4\u1ECE\u1ED2r\u0100;s\u1ECA\u1ECB\u62D5l;\u69E3us;\u6A71i\u0180;lv\u1EDA\u1EDB\u1EDF\u43B5on\xBB\u1EDB;\u43F5\u0200csuv\u1EEA\u1EF3\u1F0B\u1F23\u0100io\u1EEF\u1E31rc\xBB\u1E2E\u0269\u1EF9\0\0\u1EFB\xED\u0548ant\u0100gl\u1F02\u1F06tr\xBB\u1E5Dess\xBB\u1E7A\u0180aei\u1F12\u1F16\u1F1Als;\u403Dst;\u625Fv\u0100;D\u0235\u1F20D;\u6A78parsl;\u69E5\u0100Da\u1F2F\u1F33ot;\u6253rr;\u6971\u0180cdi\u1F3E\u1F41\u1EF8r;\u612Fo\xF4\u0352\u0100ah\u1F49\u1F4B;\u43B7\u803B\xF0\u40F0\u0100mr\u1F53\u1F57l\u803B\xEB\u40EBo;\u60AC\u0180cip\u1F61\u1F64\u1F67l;\u4021s\xF4\u056E\u0100eo\u1F6C\u1F74ctatio\xEE\u0559nential\xE5\u0579\u09E1\u1F92\0\u1F9E\0\u1FA1\u1FA7\0\0\u1FC6\u1FCC\0\u1FD3\0\u1FE6\u1FEA\u2000\0\u2008\u205Allingdotse\xF1\u1E44y;\u4444male;\u6640\u0180ilr\u1FAD\u1FB3\u1FC1lig;\u8000\uFB03\u0269\u1FB9\0\0\u1FBDg;\u8000\uFB00ig;\u8000\uFB04;\uC000\u{1D523}lig;\u8000\uFB01lig;\uC000fj\u0180alt\u1FD9\u1FDC\u1FE1t;\u666Dig;\u8000\uFB02ns;\u65B1of;\u4192\u01F0\u1FEE\0\u1FF3f;\uC000\u{1D557}\u0100ak\u05BF\u1FF7\u0100;v\u1FFC\u1FFD\u62D4;\u6AD9artint;\u6A0D\u0100ao\u200C\u2055\u0100cs\u2011\u2052\u03B1\u201A\u2030\u2038\u2045\u2048\0\u2050\u03B2\u2022\u2025\u2027\u202A\u202C\0\u202E\u803B\xBD\u40BD;\u6153\u803B\xBC\u40BC;\u6155;\u6159;\u615B\u01B3\u2034\0\u2036;\u6154;\u6156\u02B4\u203E\u2041\0\0\u2043\u803B\xBE\u40BE;\u6157;\u615C5;\u6158\u01B6\u204C\0\u204E;\u615A;\u615D8;\u615El;\u6044wn;\u6322cr;\uC000\u{1D4BB}\u0880Eabcdefgijlnorstv\u2082\u2089\u209F\u20A5\u20B0\u20B4\u20F0\u20F5\u20FA\u20FF\u2103\u2112\u2138\u0317\u213E\u2152\u219E\u0100;l\u064D\u2087;\u6A8C\u0180cmp\u2090\u2095\u209Dute;\u41F5ma\u0100;d\u209C\u1CDA\u43B3;\u6A86reve;\u411F\u0100iy\u20AA\u20AErc;\u411D;\u4433ot;\u4121\u0200;lqs\u063E\u0642\u20BD\u20C9\u0180;qs\u063E\u064C\u20C4lan\xF4\u0665\u0200;cdl\u0665\u20D2\u20D5\u20E5c;\u6AA9ot\u0100;o\u20DC\u20DD\u6A80\u0100;l\u20E2\u20E3\u6A82;\u6A84\u0100;e\u20EA\u20ED\uC000\u22DB\uFE00s;\u6A94r;\uC000\u{1D524}\u0100;g\u0673\u061Bmel;\u6137cy;\u4453\u0200;Eaj\u065A\u210C\u210E\u2110;\u6A92;\u6AA5;\u6AA4\u0200Eaes\u211B\u211D\u2129\u2134;\u6269p\u0100;p\u2123\u2124\u6A8Arox\xBB\u2124\u0100;q\u212E\u212F\u6A88\u0100;q\u212E\u211Bim;\u62E7pf;\uC000\u{1D558}\u0100ci\u2143\u2146r;\u610Am\u0180;el\u066B\u214E\u2150;\u6A8E;\u6A90\u8300>;cdlqr\u05EE\u2160\u216A\u216E\u2173\u2179\u0100ci\u2165\u2167;\u6AA7r;\u6A7Aot;\u62D7Par;\u6995uest;\u6A7C\u0280adels\u2184\u216A\u2190\u0656\u219B\u01F0\u2189\0\u218Epro\xF8\u209Er;\u6978q\u0100lq\u063F\u2196les\xF3\u2088i\xED\u066B\u0100en\u21A3\u21ADrtneqq;\uC000\u2269\uFE00\xC5\u21AA\u0500Aabcefkosy\u21C4\u21C7\u21F1\u21F5\u21FA\u2218\u221D\u222F\u2268\u227Dr\xF2\u03A0\u0200ilmr\u21D0\u21D4\u21D7\u21DBrs\xF0\u1484f\xBB\u2024il\xF4\u06A9\u0100dr\u21E0\u21E4cy;\u444A\u0180;cw\u08F4\u21EB\u21EFir;\u6948;\u61ADar;\u610Firc;\u4125\u0180alr\u2201\u220E\u2213rts\u0100;u\u2209\u220A\u6665it\xBB\u220Alip;\u6026con;\u62B9r;\uC000\u{1D525}s\u0100ew\u2223\u2229arow;\u6925arow;\u6926\u0280amopr\u223A\u223E\u2243\u225E\u2263rr;\u61FFtht;\u623Bk\u0100lr\u2249\u2253eftarrow;\u61A9ightarrow;\u61AAf;\uC000\u{1D559}bar;\u6015\u0180clt\u226F\u2274\u2278r;\uC000\u{1D4BD}as\xE8\u21F4rok;\u4127\u0100bp\u2282\u2287ull;\u6043hen\xBB\u1C5B\u0AE1\u22A3\0\u22AA\0\u22B8\u22C5\u22CE\0\u22D5\u22F3\0\0\u22F8\u2322\u2367\u2362\u237F\0\u2386\u23AA\u23B4cute\u803B\xED\u40ED\u0180;iy\u0771\u22B0\u22B5rc\u803B\xEE\u40EE;\u4438\u0100cx\u22BC\u22BFy;\u4435cl\u803B\xA1\u40A1\u0100fr\u039F\u22C9;\uC000\u{1D526}rave\u803B\xEC\u40EC\u0200;ino\u073E\u22DD\u22E9\u22EE\u0100in\u22E2\u22E6nt;\u6A0Ct;\u622Dfin;\u69DCta;\u6129lig;\u4133\u0180aop\u22FE\u231A\u231D\u0180cgt\u2305\u2308\u2317r;\u412B\u0180elp\u071F\u230F\u2313in\xE5\u078Ear\xF4\u0720h;\u4131f;\u62B7ed;\u41B5\u0280;cfot\u04F4\u232C\u2331\u233D\u2341are;\u6105in\u0100;t\u2338\u2339\u621Eie;\u69DDdo\xF4\u2319\u0280;celp\u0757\u234C\u2350\u235B\u2361al;\u62BA\u0100gr\u2355\u2359er\xF3\u1563\xE3\u234Darhk;\u6A17rod;\u6A3C\u0200cgpt\u236F\u2372\u2376\u237By;\u4451on;\u412Ff;\uC000\u{1D55A}a;\u43B9uest\u803B\xBF\u40BF\u0100ci\u238A\u238Fr;\uC000\u{1D4BE}n\u0280;Edsv\u04F4\u239B\u239D\u23A1\u04F3;\u62F9ot;\u62F5\u0100;v\u23A6\u23A7\u62F4;\u62F3\u0100;i\u0777\u23AElde;\u4129\u01EB\u23B8\0\u23BCcy;\u4456l\u803B\xEF\u40EF\u0300cfmosu\u23CC\u23D7\u23DC\u23E1\u23E7\u23F5\u0100iy\u23D1\u23D5rc;\u4135;\u4439r;\uC000\u{1D527}ath;\u4237pf;\uC000\u{1D55B}\u01E3\u23EC\0\u23F1r;\uC000\u{1D4BF}rcy;\u4458kcy;\u4454\u0400acfghjos\u240B\u2416\u2422\u2427\u242D\u2431\u2435\u243Bppa\u0100;v\u2413\u2414\u43BA;\u43F0\u0100ey\u241B\u2420dil;\u4137;\u443Ar;\uC000\u{1D528}reen;\u4138cy;\u4445cy;\u445Cpf;\uC000\u{1D55C}cr;\uC000\u{1D4C0}\u0B80ABEHabcdefghjlmnoprstuv\u2470\u2481\u2486\u248D\u2491\u250E\u253D\u255A\u2580\u264E\u265E\u2665\u2679\u267D\u269A\u26B2\u26D8\u275D\u2768\u278B\u27C0\u2801\u2812\u0180art\u2477\u247A\u247Cr\xF2\u09C6\xF2\u0395ail;\u691Barr;\u690E\u0100;g\u0994\u248B;\u6A8Bar;\u6962\u0963\u24A5\0\u24AA\0\u24B1\0\0\0\0\0\u24B5\u24BA\0\u24C6\u24C8\u24CD\0\u24F9ute;\u413Amptyv;\u69B4ra\xEE\u084Cbda;\u43BBg\u0180;dl\u088E\u24C1\u24C3;\u6991\xE5\u088E;\u6A85uo\u803B\xAB\u40ABr\u0400;bfhlpst\u0899\u24DE\u24E6\u24E9\u24EB\u24EE\u24F1\u24F5\u0100;f\u089D\u24E3s;\u691Fs;\u691D\xEB\u2252p;\u61ABl;\u6939im;\u6973l;\u61A2\u0180;ae\u24FF\u2500\u2504\u6AABil;\u6919\u0100;s\u2509\u250A\u6AAD;\uC000\u2AAD\uFE00\u0180abr\u2515\u2519\u251Drr;\u690Crk;\u6772\u0100ak\u2522\u252Cc\u0100ek\u2528\u252A;\u407B;\u405B\u0100es\u2531\u2533;\u698Bl\u0100du\u2539\u253B;\u698F;\u698D\u0200aeuy\u2546\u254B\u2556\u2558ron;\u413E\u0100di\u2550\u2554il;\u413C\xEC\u08B0\xE2\u2529;\u443B\u0200cqrs\u2563\u2566\u256D\u257Da;\u6936uo\u0100;r\u0E19\u1746\u0100du\u2572\u2577har;\u6967shar;\u694Bh;\u61B2\u0280;fgqs\u258B\u258C\u0989\u25F3\u25FF\u6264t\u0280ahlrt\u2598\u25A4\u25B7\u25C2\u25E8rrow\u0100;t\u0899\u25A1a\xE9\u24F6arpoon\u0100du\u25AF\u25B4own\xBB\u045Ap\xBB\u0966eftarrows;\u61C7ight\u0180ahs\u25CD\u25D6\u25DErrow\u0100;s\u08F4\u08A7arpoon\xF3\u0F98quigarro\xF7\u21F0hreetimes;\u62CB\u0180;qs\u258B\u0993\u25FAlan\xF4\u09AC\u0280;cdgs\u09AC\u260A\u260D\u261D\u2628c;\u6AA8ot\u0100;o\u2614\u2615\u6A7F\u0100;r\u261A\u261B\u6A81;\u6A83\u0100;e\u2622\u2625\uC000\u22DA\uFE00s;\u6A93\u0280adegs\u2633\u2639\u263D\u2649\u264Bppro\xF8\u24C6ot;\u62D6q\u0100gq\u2643\u2645\xF4\u0989gt\xF2\u248C\xF4\u099Bi\xED\u09B2\u0180ilr\u2655\u08E1\u265Asht;\u697C;\uC000\u{1D529}\u0100;E\u099C\u2663;\u6A91\u0161\u2669\u2676r\u0100du\u25B2\u266E\u0100;l\u0965\u2673;\u696Alk;\u6584cy;\u4459\u0280;acht\u0A48\u2688\u268B\u2691\u2696r\xF2\u25C1orne\xF2\u1D08ard;\u696Bri;\u65FA\u0100io\u269F\u26A4dot;\u4140ust\u0100;a\u26AC\u26AD\u63B0che\xBB\u26AD\u0200Eaes\u26BB\u26BD\u26C9\u26D4;\u6268p\u0100;p\u26C3\u26C4\u6A89rox\xBB\u26C4\u0100;q\u26CE\u26CF\u6A87\u0100;q\u26CE\u26BBim;\u62E6\u0400abnoptwz\u26E9\u26F4\u26F7\u271A\u272F\u2741\u2747\u2750\u0100nr\u26EE\u26F1g;\u67ECr;\u61FDr\xEB\u08C1g\u0180lmr\u26FF\u270D\u2714eft\u0100ar\u09E6\u2707ight\xE1\u09F2apsto;\u67FCight\xE1\u09FDparrow\u0100lr\u2725\u2729ef\xF4\u24EDight;\u61AC\u0180afl\u2736\u2739\u273Dr;\u6985;\uC000\u{1D55D}us;\u6A2Dimes;\u6A34\u0161\u274B\u274Fst;\u6217\xE1\u134E\u0180;ef\u2757\u2758\u1800\u65CAnge\xBB\u2758ar\u0100;l\u2764\u2765\u4028t;\u6993\u0280achmt\u2773\u2776\u277C\u2785\u2787r\xF2\u08A8orne\xF2\u1D8Car\u0100;d\u0F98\u2783;\u696D;\u600Eri;\u62BF\u0300achiqt\u2798\u279D\u0A40\u27A2\u27AE\u27BBquo;\u6039r;\uC000\u{1D4C1}m\u0180;eg\u09B2\u27AA\u27AC;\u6A8D;\u6A8F\u0100bu\u252A\u27B3o\u0100;r\u0E1F\u27B9;\u601Arok;\u4142\u8400<;cdhilqr\u082B\u27D2\u2639\u27DC\u27E0\u27E5\u27EA\u27F0\u0100ci\u27D7\u27D9;\u6AA6r;\u6A79re\xE5\u25F2mes;\u62C9arr;\u6976uest;\u6A7B\u0100Pi\u27F5\u27F9ar;\u6996\u0180;ef\u2800\u092D\u181B\u65C3r\u0100du\u2807\u280Dshar;\u694Ahar;\u6966\u0100en\u2817\u2821rtneqq;\uC000\u2268\uFE00\xC5\u281E\u0700Dacdefhilnopsu\u2840\u2845\u2882\u288E\u2893\u28A0\u28A5\u28A8\u28DA\u28E2\u28E4\u0A83\u28F3\u2902Dot;\u623A\u0200clpr\u284E\u2852\u2863\u287Dr\u803B\xAF\u40AF\u0100et\u2857\u2859;\u6642\u0100;e\u285E\u285F\u6720se\xBB\u285F\u0100;s\u103B\u2868to\u0200;dlu\u103B\u2873\u2877\u287Bow\xEE\u048Cef\xF4\u090F\xF0\u13D1ker;\u65AE\u0100oy\u2887\u288Cmma;\u6A29;\u443Cash;\u6014asuredangle\xBB\u1626r;\uC000\u{1D52A}o;\u6127\u0180cdn\u28AF\u28B4\u28C9ro\u803B\xB5\u40B5\u0200;acd\u1464\u28BD\u28C0\u28C4s\xF4\u16A7ir;\u6AF0ot\u80BB\xB7\u01B5us\u0180;bd\u28D2\u1903\u28D3\u6212\u0100;u\u1D3C\u28D8;\u6A2A\u0163\u28DE\u28E1p;\u6ADB\xF2\u2212\xF0\u0A81\u0100dp\u28E9\u28EEels;\u62A7f;\uC000\u{1D55E}\u0100ct\u28F8\u28FDr;\uC000\u{1D4C2}pos\xBB\u159D\u0180;lm\u2909\u290A\u290D\u43BCtimap;\u62B8\u0C00GLRVabcdefghijlmoprstuvw\u2942\u2953\u297E\u2989\u2998\u29DA\u29E9\u2A15\u2A1A\u2A58\u2A5D\u2A83\u2A95\u2AA4\u2AA8\u2B04\u2B07\u2B44\u2B7F\u2BAE\u2C34\u2C67\u2C7C\u2CE9\u0100gt\u2947\u294B;\uC000\u22D9\u0338\u0100;v\u2950\u0BCF\uC000\u226B\u20D2\u0180elt\u295A\u2972\u2976ft\u0100ar\u2961\u2967rrow;\u61CDightarrow;\u61CE;\uC000\u22D8\u0338\u0100;v\u297B\u0C47\uC000\u226A\u20D2ightarrow;\u61CF\u0100Dd\u298E\u2993ash;\u62AFash;\u62AE\u0280bcnpt\u29A3\u29A7\u29AC\u29B1\u29CCla\xBB\u02DEute;\u4144g;\uC000\u2220\u20D2\u0280;Eiop\u0D84\u29BC\u29C0\u29C5\u29C8;\uC000\u2A70\u0338d;\uC000\u224B\u0338s;\u4149ro\xF8\u0D84ur\u0100;a\u29D3\u29D4\u666El\u0100;s\u29D3\u0B38\u01F3\u29DF\0\u29E3p\u80BB\xA0\u0B37mp\u0100;e\u0BF9\u0C00\u0280aeouy\u29F4\u29FE\u2A03\u2A10\u2A13\u01F0\u29F9\0\u29FB;\u6A43on;\u4148dil;\u4146ng\u0100;d\u0D7E\u2A0Aot;\uC000\u2A6D\u0338p;\u6A42;\u443Dash;\u6013\u0380;Aadqsx\u0B92\u2A29\u2A2D\u2A3B\u2A41\u2A45\u2A50rr;\u61D7r\u0100hr\u2A33\u2A36k;\u6924\u0100;o\u13F2\u13F0ot;\uC000\u2250\u0338ui\xF6\u0B63\u0100ei\u2A4A\u2A4Ear;\u6928\xED\u0B98ist\u0100;s\u0BA0\u0B9Fr;\uC000\u{1D52B}\u0200Eest\u0BC5\u2A66\u2A79\u2A7C\u0180;qs\u0BBC\u2A6D\u0BE1\u0180;qs\u0BBC\u0BC5\u2A74lan\xF4\u0BE2i\xED\u0BEA\u0100;r\u0BB6\u2A81\xBB\u0BB7\u0180Aap\u2A8A\u2A8D\u2A91r\xF2\u2971rr;\u61AEar;\u6AF2\u0180;sv\u0F8D\u2A9C\u0F8C\u0100;d\u2AA1\u2AA2\u62FC;\u62FAcy;\u445A\u0380AEadest\u2AB7\u2ABA\u2ABE\u2AC2\u2AC5\u2AF6\u2AF9r\xF2\u2966;\uC000\u2266\u0338rr;\u619Ar;\u6025\u0200;fqs\u0C3B\u2ACE\u2AE3\u2AEFt\u0100ar\u2AD4\u2AD9rro\xF7\u2AC1ightarro\xF7\u2A90\u0180;qs\u0C3B\u2ABA\u2AEAlan\xF4\u0C55\u0100;s\u0C55\u2AF4\xBB\u0C36i\xED\u0C5D\u0100;r\u0C35\u2AFEi\u0100;e\u0C1A\u0C25i\xE4\u0D90\u0100pt\u2B0C\u2B11f;\uC000\u{1D55F}\u8180\xAC;in\u2B19\u2B1A\u2B36\u40ACn\u0200;Edv\u0B89\u2B24\u2B28\u2B2E;\uC000\u22F9\u0338ot;\uC000\u22F5\u0338\u01E1\u0B89\u2B33\u2B35;\u62F7;\u62F6i\u0100;v\u0CB8\u2B3C\u01E1\u0CB8\u2B41\u2B43;\u62FE;\u62FD\u0180aor\u2B4B\u2B63\u2B69r\u0200;ast\u0B7B\u2B55\u2B5A\u2B5Flle\xEC\u0B7Bl;\uC000\u2AFD\u20E5;\uC000\u2202\u0338lint;\u6A14\u0180;ce\u0C92\u2B70\u2B73u\xE5\u0CA5\u0100;c\u0C98\u2B78\u0100;e\u0C92\u2B7D\xF1\u0C98\u0200Aait\u2B88\u2B8B\u2B9D\u2BA7r\xF2\u2988rr\u0180;cw\u2B94\u2B95\u2B99\u619B;\uC000\u2933\u0338;\uC000\u219D\u0338ghtarrow\xBB\u2B95ri\u0100;e\u0CCB\u0CD6\u0380chimpqu\u2BBD\u2BCD\u2BD9\u2B04\u0B78\u2BE4\u2BEF\u0200;cer\u0D32\u2BC6\u0D37\u2BC9u\xE5\u0D45;\uC000\u{1D4C3}ort\u026D\u2B05\0\0\u2BD6ar\xE1\u2B56m\u0100;e\u0D6E\u2BDF\u0100;q\u0D74\u0D73su\u0100bp\u2BEB\u2BED\xE5\u0CF8\xE5\u0D0B\u0180bcp\u2BF6\u2C11\u2C19\u0200;Ees\u2BFF\u2C00\u0D22\u2C04\u6284;\uC000\u2AC5\u0338et\u0100;e\u0D1B\u2C0Bq\u0100;q\u0D23\u2C00c\u0100;e\u0D32\u2C17\xF1\u0D38\u0200;Ees\u2C22\u2C23\u0D5F\u2C27\u6285;\uC000\u2AC6\u0338et\u0100;e\u0D58\u2C2Eq\u0100;q\u0D60\u2C23\u0200gilr\u2C3D\u2C3F\u2C45\u2C47\xEC\u0BD7lde\u803B\xF1\u40F1\xE7\u0C43iangle\u0100lr\u2C52\u2C5Ceft\u0100;e\u0C1A\u2C5A\xF1\u0C26ight\u0100;e\u0CCB\u2C65\xF1\u0CD7\u0100;m\u2C6C\u2C6D\u43BD\u0180;es\u2C74\u2C75\u2C79\u4023ro;\u6116p;\u6007\u0480DHadgilrs\u2C8F\u2C94\u2C99\u2C9E\u2CA3\u2CB0\u2CB6\u2CD3\u2CE3ash;\u62ADarr;\u6904p;\uC000\u224D\u20D2ash;\u62AC\u0100et\u2CA8\u2CAC;\uC000\u2265\u20D2;\uC000>\u20D2nfin;\u69DE\u0180Aet\u2CBD\u2CC1\u2CC5rr;\u6902;\uC000\u2264\u20D2\u0100;r\u2CCA\u2CCD\uC000<\u20D2ie;\uC000\u22B4\u20D2\u0100At\u2CD8\u2CDCrr;\u6903rie;\uC000\u22B5\u20D2im;\uC000\u223C\u20D2\u0180Aan\u2CF0\u2CF4\u2D02rr;\u61D6r\u0100hr\u2CFA\u2CFDk;\u6923\u0100;o\u13E7\u13E5ear;\u6927\u1253\u1A95\0\0\0\0\0\0\0\0\0\0\0\0\0\u2D2D\0\u2D38\u2D48\u2D60\u2D65\u2D72\u2D84\u1B07\0\0\u2D8D\u2DAB\0\u2DC8\u2DCE\0\u2DDC\u2E19\u2E2B\u2E3E\u2E43\u0100cs\u2D31\u1A97ute\u803B\xF3\u40F3\u0100iy\u2D3C\u2D45r\u0100;c\u1A9E\u2D42\u803B\xF4\u40F4;\u443E\u0280abios\u1AA0\u2D52\u2D57\u01C8\u2D5Alac;\u4151v;\u6A38old;\u69BClig;\u4153\u0100cr\u2D69\u2D6Dir;\u69BF;\uC000\u{1D52C}\u036F\u2D79\0\0\u2D7C\0\u2D82n;\u42DBave\u803B\xF2\u40F2;\u69C1\u0100bm\u2D88\u0DF4ar;\u69B5\u0200acit\u2D95\u2D98\u2DA5\u2DA8r\xF2\u1A80\u0100ir\u2D9D\u2DA0r;\u69BEoss;\u69BBn\xE5\u0E52;\u69C0\u0180aei\u2DB1\u2DB5\u2DB9cr;\u414Dga;\u43C9\u0180cdn\u2DC0\u2DC5\u01CDron;\u43BF;\u69B6pf;\uC000\u{1D560}\u0180ael\u2DD4\u2DD7\u01D2r;\u69B7rp;\u69B9\u0380;adiosv\u2DEA\u2DEB\u2DEE\u2E08\u2E0D\u2E10\u2E16\u6228r\xF2\u1A86\u0200;efm\u2DF7\u2DF8\u2E02\u2E05\u6A5Dr\u0100;o\u2DFE\u2DFF\u6134f\xBB\u2DFF\u803B\xAA\u40AA\u803B\xBA\u40BAgof;\u62B6r;\u6A56lope;\u6A57;\u6A5B\u0180clo\u2E1F\u2E21\u2E27\xF2\u2E01ash\u803B\xF8\u40F8l;\u6298i\u016C\u2E2F\u2E34de\u803B\xF5\u40F5es\u0100;a\u01DB\u2E3As;\u6A36ml\u803B\xF6\u40F6bar;\u633D\u0AE1\u2E5E\0\u2E7D\0\u2E80\u2E9D\0\u2EA2\u2EB9\0\0\u2ECB\u0E9C\0\u2F13\0\0\u2F2B\u2FBC\0\u2FC8r\u0200;ast\u0403\u2E67\u2E72\u0E85\u8100\xB6;l\u2E6D\u2E6E\u40B6le\xEC\u0403\u0269\u2E78\0\0\u2E7Bm;\u6AF3;\u6AFDy;\u443Fr\u0280cimpt\u2E8B\u2E8F\u2E93\u1865\u2E97nt;\u4025od;\u402Eil;\u6030enk;\u6031r;\uC000\u{1D52D}\u0180imo\u2EA8\u2EB0\u2EB4\u0100;v\u2EAD\u2EAE\u43C6;\u43D5ma\xF4\u0A76ne;\u660E\u0180;tv\u2EBF\u2EC0\u2EC8\u43C0chfork\xBB\u1FFD;\u43D6\u0100au\u2ECF\u2EDFn\u0100ck\u2ED5\u2EDDk\u0100;h\u21F4\u2EDB;\u610E\xF6\u21F4s\u0480;abcdemst\u2EF3\u2EF4\u1908\u2EF9\u2EFD\u2F04\u2F06\u2F0A\u2F0E\u402Bcir;\u6A23ir;\u6A22\u0100ou\u1D40\u2F02;\u6A25;\u6A72n\u80BB\xB1\u0E9Dim;\u6A26wo;\u6A27\u0180ipu\u2F19\u2F20\u2F25ntint;\u6A15f;\uC000\u{1D561}nd\u803B\xA3\u40A3\u0500;Eaceinosu\u0EC8\u2F3F\u2F41\u2F44\u2F47\u2F81\u2F89\u2F92\u2F7E\u2FB6;\u6AB3p;\u6AB7u\xE5\u0ED9\u0100;c\u0ECE\u2F4C\u0300;acens\u0EC8\u2F59\u2F5F\u2F66\u2F68\u2F7Eppro\xF8\u2F43urlye\xF1\u0ED9\xF1\u0ECE\u0180aes\u2F6F\u2F76\u2F7Approx;\u6AB9qq;\u6AB5im;\u62E8i\xED\u0EDFme\u0100;s\u2F88\u0EAE\u6032\u0180Eas\u2F78\u2F90\u2F7A\xF0\u2F75\u0180dfp\u0EEC\u2F99\u2FAF\u0180als\u2FA0\u2FA5\u2FAAlar;\u632Eine;\u6312urf;\u6313\u0100;t\u0EFB\u2FB4\xEF\u0EFBrel;\u62B0\u0100ci\u2FC0\u2FC5r;\uC000\u{1D4C5};\u43C8ncsp;\u6008\u0300fiopsu\u2FDA\u22E2\u2FDF\u2FE5\u2FEB\u2FF1r;\uC000\u{1D52E}pf;\uC000\u{1D562}rime;\u6057cr;\uC000\u{1D4C6}\u0180aeo\u2FF8\u3009\u3013t\u0100ei\u2FFE\u3005rnion\xF3\u06B0nt;\u6A16st\u0100;e\u3010\u3011\u403F\xF1\u1F19\xF4\u0F14\u0A80ABHabcdefhilmnoprstux\u3040\u3051\u3055\u3059\u30E0\u310E\u312B\u3147\u3162\u3172\u318E\u3206\u3215\u3224\u3229\u3258\u326E\u3272\u3290\u32B0\u32B7\u0180art\u3047\u304A\u304Cr\xF2\u10B3\xF2\u03DDail;\u691Car\xF2\u1C65ar;\u6964\u0380cdenqrt\u3068\u3075\u3078\u307F\u308F\u3094\u30CC\u0100eu\u306D\u3071;\uC000\u223D\u0331te;\u4155i\xE3\u116Emptyv;\u69B3g\u0200;del\u0FD1\u3089\u308B\u308D;\u6992;\u69A5\xE5\u0FD1uo\u803B\xBB\u40BBr\u0580;abcfhlpstw\u0FDC\u30AC\u30AF\u30B7\u30B9\u30BC\u30BE\u30C0\u30C3\u30C7\u30CAp;\u6975\u0100;f\u0FE0\u30B4s;\u6920;\u6933s;\u691E\xEB\u225D\xF0\u272El;\u6945im;\u6974l;\u61A3;\u619D\u0100ai\u30D1\u30D5il;\u691Ao\u0100;n\u30DB\u30DC\u6236al\xF3\u0F1E\u0180abr\u30E7\u30EA\u30EEr\xF2\u17E5rk;\u6773\u0100ak\u30F3\u30FDc\u0100ek\u30F9\u30FB;\u407D;\u405D\u0100es\u3102\u3104;\u698Cl\u0100du\u310A\u310C;\u698E;\u6990\u0200aeuy\u3117\u311C\u3127\u3129ron;\u4159\u0100di\u3121\u3125il;\u4157\xEC\u0FF2\xE2\u30FA;\u4440\u0200clqs\u3134\u3137\u313D\u3144a;\u6937dhar;\u6969uo\u0100;r\u020E\u020Dh;\u61B3\u0180acg\u314E\u315F\u0F44l\u0200;ips\u0F78\u3158\u315B\u109Cn\xE5\u10BBar\xF4\u0FA9t;\u65AD\u0180ilr\u3169\u1023\u316Esht;\u697D;\uC000\u{1D52F}\u0100ao\u3177\u3186r\u0100du\u317D\u317F\xBB\u047B\u0100;l\u1091\u3184;\u696C\u0100;v\u318B\u318C\u43C1;\u43F1\u0180gns\u3195\u31F9\u31FCht\u0300ahlrst\u31A4\u31B0\u31C2\u31D8\u31E4\u31EErrow\u0100;t\u0FDC\u31ADa\xE9\u30C8arpoon\u0100du\u31BB\u31BFow\xEE\u317Ep\xBB\u1092eft\u0100ah\u31CA\u31D0rrow\xF3\u0FEAarpoon\xF3\u0551ightarrows;\u61C9quigarro\xF7\u30CBhreetimes;\u62CCg;\u42DAingdotse\xF1\u1F32\u0180ahm\u320D\u3210\u3213r\xF2\u0FEAa\xF2\u0551;\u600Foust\u0100;a\u321E\u321F\u63B1che\xBB\u321Fmid;\u6AEE\u0200abpt\u3232\u323D\u3240\u3252\u0100nr\u3237\u323Ag;\u67EDr;\u61FEr\xEB\u1003\u0180afl\u3247\u324A\u324Er;\u6986;\uC000\u{1D563}us;\u6A2Eimes;\u6A35\u0100ap\u325D\u3267r\u0100;g\u3263\u3264\u4029t;\u6994olint;\u6A12ar\xF2\u31E3\u0200achq\u327B\u3280\u10BC\u3285quo;\u603Ar;\uC000\u{1D4C7}\u0100bu\u30FB\u328Ao\u0100;r\u0214\u0213\u0180hir\u3297\u329B\u32A0re\xE5\u31F8mes;\u62CAi\u0200;efl\u32AA\u1059\u1821\u32AB\u65B9tri;\u69CEluhar;\u6968;\u611E\u0D61\u32D5\u32DB\u32DF\u332C\u3338\u3371\0\u337A\u33A4\0\0\u33EC\u33F0\0\u3428\u3448\u345A\u34AD\u34B1\u34CA\u34F1\0\u3616\0\0\u3633cute;\u415Bqu\xEF\u27BA\u0500;Eaceinpsy\u11ED\u32F3\u32F5\u32FF\u3302\u330B\u330F\u331F\u3326\u3329;\u6AB4\u01F0\u32FA\0\u32FC;\u6AB8on;\u4161u\xE5\u11FE\u0100;d\u11F3\u3307il;\u415Frc;\u415D\u0180Eas\u3316\u3318\u331B;\u6AB6p;\u6ABAim;\u62E9olint;\u6A13i\xED\u1204;\u4441ot\u0180;be\u3334\u1D47\u3335\u62C5;\u6A66\u0380Aacmstx\u3346\u334A\u3357\u335B\u335E\u3363\u336Drr;\u61D8r\u0100hr\u3350\u3352\xEB\u2228\u0100;o\u0A36\u0A34t\u803B\xA7\u40A7i;\u403Bwar;\u6929m\u0100in\u3369\xF0nu\xF3\xF1t;\u6736r\u0100;o\u3376\u2055\uC000\u{1D530}\u0200acoy\u3382\u3386\u3391\u33A0rp;\u666F\u0100hy\u338B\u338Fcy;\u4449;\u4448rt\u026D\u3399\0\0\u339Ci\xE4\u1464ara\xEC\u2E6F\u803B\xAD\u40AD\u0100gm\u33A8\u33B4ma\u0180;fv\u33B1\u33B2\u33B2\u43C3;\u43C2\u0400;deglnpr\u12AB\u33C5\u33C9\u33CE\u33D6\u33DE\u33E1\u33E6ot;\u6A6A\u0100;q\u12B1\u12B0\u0100;E\u33D3\u33D4\u6A9E;\u6AA0\u0100;E\u33DB\u33DC\u6A9D;\u6A9Fe;\u6246lus;\u6A24arr;\u6972ar\xF2\u113D\u0200aeit\u33F8\u3408\u340F\u3417\u0100ls\u33FD\u3404lsetm\xE9\u336Ahp;\u6A33parsl;\u69E4\u0100dl\u1463\u3414e;\u6323\u0100;e\u341C\u341D\u6AAA\u0100;s\u3422\u3423\u6AAC;\uC000\u2AAC\uFE00\u0180flp\u342E\u3433\u3442tcy;\u444C\u0100;b\u3438\u3439\u402F\u0100;a\u343E\u343F\u69C4r;\u633Ff;\uC000\u{1D564}a\u0100dr\u344D\u0402es\u0100;u\u3454\u3455\u6660it\xBB\u3455\u0180csu\u3460\u3479\u349F\u0100au\u3465\u346Fp\u0100;s\u1188\u346B;\uC000\u2293\uFE00p\u0100;s\u11B4\u3475;\uC000\u2294\uFE00u\u0100bp\u347F\u348F\u0180;es\u1197\u119C\u3486et\u0100;e\u1197\u348D\xF1\u119D\u0180;es\u11A8\u11AD\u3496et\u0100;e\u11A8\u349D\xF1\u11AE\u0180;af\u117B\u34A6\u05B0r\u0165\u34AB\u05B1\xBB\u117Car\xF2\u1148\u0200cemt\u34B9\u34BE\u34C2\u34C5r;\uC000\u{1D4C8}tm\xEE\xF1i\xEC\u3415ar\xE6\u11BE\u0100ar\u34CE\u34D5r\u0100;f\u34D4\u17BF\u6606\u0100an\u34DA\u34EDight\u0100ep\u34E3\u34EApsilo\xEE\u1EE0h\xE9\u2EAFs\xBB\u2852\u0280bcmnp\u34FB\u355E\u1209\u358B\u358E\u0480;Edemnprs\u350E\u350F\u3511\u3515\u351E\u3523\u352C\u3531\u3536\u6282;\u6AC5ot;\u6ABD\u0100;d\u11DA\u351Aot;\u6AC3ult;\u6AC1\u0100Ee\u3528\u352A;\u6ACB;\u628Alus;\u6ABFarr;\u6979\u0180eiu\u353D\u3552\u3555t\u0180;en\u350E\u3545\u354Bq\u0100;q\u11DA\u350Feq\u0100;q\u352B\u3528m;\u6AC7\u0100bp\u355A\u355C;\u6AD5;\u6AD3c\u0300;acens\u11ED\u356C\u3572\u3579\u357B\u3326ppro\xF8\u32FAurlye\xF1\u11FE\xF1\u11F3\u0180aes\u3582\u3588\u331Bppro\xF8\u331Aq\xF1\u3317g;\u666A\u0680123;Edehlmnps\u35A9\u35AC\u35AF\u121C\u35B2\u35B4\u35C0\u35C9\u35D5\u35DA\u35DF\u35E8\u35ED\u803B\xB9\u40B9\u803B\xB2\u40B2\u803B\xB3\u40B3;\u6AC6\u0100os\u35B9\u35BCt;\u6ABEub;\u6AD8\u0100;d\u1222\u35C5ot;\u6AC4s\u0100ou\u35CF\u35D2l;\u67C9b;\u6AD7arr;\u697Bult;\u6AC2\u0100Ee\u35E4\u35E6;\u6ACC;\u628Blus;\u6AC0\u0180eiu\u35F4\u3609\u360Ct\u0180;en\u121C\u35FC\u3602q\u0100;q\u1222\u35B2eq\u0100;q\u35E7\u35E4m;\u6AC8\u0100bp\u3611\u3613;\u6AD4;\u6AD6\u0180Aan\u361C\u3620\u362Drr;\u61D9r\u0100hr\u3626\u3628\xEB\u222E\u0100;o\u0A2B\u0A29war;\u692Alig\u803B\xDF\u40DF\u0BE1\u3651\u365D\u3660\u12CE\u3673\u3679\0\u367E\u36C2\0\0\0\0\0\u36DB\u3703\0\u3709\u376C\0\0\0\u3787\u0272\u3656\0\0\u365Bget;\u6316;\u43C4r\xEB\u0E5F\u0180aey\u3666\u366B\u3670ron;\u4165dil;\u4163;\u4442lrec;\u6315r;\uC000\u{1D531}\u0200eiko\u3686\u369D\u36B5\u36BC\u01F2\u368B\0\u3691e\u01004f\u1284\u1281a\u0180;sv\u3698\u3699\u369B\u43B8ym;\u43D1\u0100cn\u36A2\u36B2k\u0100as\u36A8\u36AEppro\xF8\u12C1im\xBB\u12ACs\xF0\u129E\u0100as\u36BA\u36AE\xF0\u12C1rn\u803B\xFE\u40FE\u01EC\u031F\u36C6\u22E7es\u8180\xD7;bd\u36CF\u36D0\u36D8\u40D7\u0100;a\u190F\u36D5r;\u6A31;\u6A30\u0180eps\u36E1\u36E3\u3700\xE1\u2A4D\u0200;bcf\u0486\u36EC\u36F0\u36F4ot;\u6336ir;\u6AF1\u0100;o\u36F9\u36FC\uC000\u{1D565}rk;\u6ADA\xE1\u3362rime;\u6034\u0180aip\u370F\u3712\u3764d\xE5\u1248\u0380adempst\u3721\u374D\u3740\u3751\u3757\u375C\u375Fngle\u0280;dlqr\u3730\u3731\u3736\u3740\u3742\u65B5own\xBB\u1DBBeft\u0100;e\u2800\u373E\xF1\u092E;\u625Cight\u0100;e\u32AA\u374B\xF1\u105Aot;\u65ECinus;\u6A3Alus;\u6A39b;\u69CDime;\u6A3Bezium;\u63E2\u0180cht\u3772\u377D\u3781\u0100ry\u3777\u377B;\uC000\u{1D4C9};\u4446cy;\u445Brok;\u4167\u0100io\u378B\u378Ex\xF4\u1777head\u0100lr\u3797\u37A0eftarro\xF7\u084Fightarrow\xBB\u0F5D\u0900AHabcdfghlmoprstuw\u37D0\u37D3\u37D7\u37E4\u37F0\u37FC\u380E\u381C\u3823\u3834\u3851\u385D\u386B\u38A9\u38CC\u38D2\u38EA\u38F6r\xF2\u03EDar;\u6963\u0100cr\u37DC\u37E2ute\u803B\xFA\u40FA\xF2\u1150r\u01E3\u37EA\0\u37EDy;\u445Eve;\u416D\u0100iy\u37F5\u37FArc\u803B\xFB\u40FB;\u4443\u0180abh\u3803\u3806\u380Br\xF2\u13ADlac;\u4171a\xF2\u13C3\u0100ir\u3813\u3818sht;\u697E;\uC000\u{1D532}rave\u803B\xF9\u40F9\u0161\u3827\u3831r\u0100lr\u382C\u382E\xBB\u0957\xBB\u1083lk;\u6580\u0100ct\u3839\u384D\u026F\u383F\0\0\u384Arn\u0100;e\u3845\u3846\u631Cr\xBB\u3846op;\u630Fri;\u65F8\u0100al\u3856\u385Acr;\u416B\u80BB\xA8\u0349\u0100gp\u3862\u3866on;\u4173f;\uC000\u{1D566}\u0300adhlsu\u114B\u3878\u387D\u1372\u3891\u38A0own\xE1\u13B3arpoon\u0100lr\u3888\u388Cef\xF4\u382Digh\xF4\u382Fi\u0180;hl\u3899\u389A\u389C\u43C5\xBB\u13FAon\xBB\u389Aparrows;\u61C8\u0180cit\u38B0\u38C4\u38C8\u026F\u38B6\0\0\u38C1rn\u0100;e\u38BC\u38BD\u631Dr\xBB\u38BDop;\u630Eng;\u416Fri;\u65F9cr;\uC000\u{1D4CA}\u0180dir\u38D9\u38DD\u38E2ot;\u62F0lde;\u4169i\u0100;f\u3730\u38E8\xBB\u1813\u0100am\u38EF\u38F2r\xF2\u38A8l\u803B\xFC\u40FCangle;\u69A7\u0780ABDacdeflnoprsz\u391C\u391F\u3929\u392D\u39B5\u39B8\u39BD\u39DF\u39E4\u39E8\u39F3\u39F9\u39FD\u3A01\u3A20r\xF2\u03F7ar\u0100;v\u3926\u3927\u6AE8;\u6AE9as\xE8\u03E1\u0100nr\u3932\u3937grt;\u699C\u0380eknprst\u34E3\u3946\u394B\u3952\u395D\u3964\u3996app\xE1\u2415othin\xE7\u1E96\u0180hir\u34EB\u2EC8\u3959op\xF4\u2FB5\u0100;h\u13B7\u3962\xEF\u318D\u0100iu\u3969\u396Dgm\xE1\u33B3\u0100bp\u3972\u3984setneq\u0100;q\u397D\u3980\uC000\u228A\uFE00;\uC000\u2ACB\uFE00setneq\u0100;q\u398F\u3992\uC000\u228B\uFE00;\uC000\u2ACC\uFE00\u0100hr\u399B\u399Fet\xE1\u369Ciangle\u0100lr\u39AA\u39AFeft\xBB\u0925ight\xBB\u1051y;\u4432ash\xBB\u1036\u0180elr\u39C4\u39D2\u39D7\u0180;be\u2DEA\u39CB\u39CFar;\u62BBq;\u625Alip;\u62EE\u0100bt\u39DC\u1468a\xF2\u1469r;\uC000\u{1D533}tr\xE9\u39AEsu\u0100bp\u39EF\u39F1\xBB\u0D1C\xBB\u0D59pf;\uC000\u{1D567}ro\xF0\u0EFBtr\xE9\u39B4\u0100cu\u3A06\u3A0Br;\uC000\u{1D4CB}\u0100bp\u3A10\u3A18n\u0100Ee\u3980\u3A16\xBB\u397En\u0100Ee\u3992\u3A1E\xBB\u3990igzag;\u699A\u0380cefoprs\u3A36\u3A3B\u3A56\u3A5B\u3A54\u3A61\u3A6Airc;\u4175\u0100di\u3A40\u3A51\u0100bg\u3A45\u3A49ar;\u6A5Fe\u0100;q\u15FA\u3A4F;\u6259erp;\u6118r;\uC000\u{1D534}pf;\uC000\u{1D568}\u0100;e\u1479\u3A66at\xE8\u1479cr;\uC000\u{1D4CC}\u0AE3\u178E\u3A87\0\u3A8B\0\u3A90\u3A9B\0\0\u3A9D\u3AA8\u3AAB\u3AAF\0\0\u3AC3\u3ACE\0\u3AD8\u17DC\u17DFtr\xE9\u17D1r;\uC000\u{1D535}\u0100Aa\u3A94\u3A97r\xF2\u03C3r\xF2\u09F6;\u43BE\u0100Aa\u3AA1\u3AA4r\xF2\u03B8r\xF2\u09EBa\xF0\u2713is;\u62FB\u0180dpt\u17A4\u3AB5\u3ABE\u0100fl\u3ABA\u17A9;\uC000\u{1D569}im\xE5\u17B2\u0100Aa\u3AC7\u3ACAr\xF2\u03CEr\xF2\u0A01\u0100cq\u3AD2\u17B8r;\uC000\u{1D4CD}\u0100pt\u17D6\u3ADCr\xE9\u17D4\u0400acefiosu\u3AF0\u3AFD\u3B08\u3B0C\u3B11\u3B15\u3B1B\u3B21c\u0100uy\u3AF6\u3AFBte\u803B\xFD\u40FD;\u444F\u0100iy\u3B02\u3B06rc;\u4177;\u444Bn\u803B\xA5\u40A5r;\uC000\u{1D536}cy;\u4457pf;\uC000\u{1D56A}cr;\uC000\u{1D4CE}\u0100cm\u3B26\u3B29y;\u444El\u803B\xFF\u40FF\u0500acdefhiosw\u3B42\u3B48\u3B54\u3B58\u3B64\u3B69\u3B6D\u3B74\u3B7A\u3B80cute;\u417A\u0100ay\u3B4D\u3B52ron;\u417E;\u4437ot;\u417C\u0100et\u3B5D\u3B61tr\xE6\u155Fa;\u43B6r;\uC000\u{1D537}cy;\u4436grarr;\u61DDpf;\uC000\u{1D56B}cr;\uC000\u{1D4CF}\u0100jn\u3B85\u3B87;\u600Dj;\u600C'.split("").map(e=>e.charCodeAt(0)));var Ac=new Uint16Array("\u0200aglq	\x1B\u026D\0\0p;\u4026os;\u4027t;\u403Et;\u403Cuot;\u4022".split("").map(e=>e.charCodeAt(0)));var Ln,tm=new Map([[0,65533],[128,8364],[130,8218],[131,402],[132,8222],[133,8230],[134,8224],[135,8225],[136,710],[137,8240],[138,352],[139,8249],[140,338],[142,381],[145,8216],[146,8217],[147,8220],[148,8221],[149,8226],[150,8211],[151,8212],[152,732],[153,8482],[154,353],[155,8250],[156,339],[158,382],[159,376]]),Dn=(Ln=String.fromCodePoint)!==null&&Ln!==void 0?Ln:function(e){let t="";return e>65535&&(e-=65536,t+=String.fromCharCode(e>>>10&1023|55296),e=56320|e&1023),t+=String.fromCharCode(e),t};function zn(e){var t;return e>=55296&&e<=57343||e>1114111?65533:(t=tm.get(e))!==null&&t!==void 0?t:e}var fe;(function(e){e[e.NUM=35]="NUM",e[e.SEMI=59]="SEMI",e[e.EQUALS=61]="EQUALS",e[e.ZERO=48]="ZERO",e[e.NINE=57]="NINE",e[e.LOWER_A=97]="LOWER_A",e[e.LOWER_F=102]="LOWER_F",e[e.LOWER_X=120]="LOWER_X",e[e.LOWER_Z=122]="LOWER_Z",e[e.UPPER_A=65]="UPPER_A",e[e.UPPER_F=70]="UPPER_F",e[e.UPPER_Z=90]="UPPER_Z"})(fe||(fe={}));var rm=32,Et;(function(e){e[e.VALUE_LENGTH=49152]="VALUE_LENGTH",e[e.BRANCH_LENGTH=16256]="BRANCH_LENGTH",e[e.JUMP_TABLE=127]="JUMP_TABLE"})(Et||(Et={}));function Mn(e){return e>=fe.ZERO&&e<=fe.NINE}function om(e){return e>=fe.UPPER_A&&e<=fe.UPPER_F||e>=fe.LOWER_A&&e<=fe.LOWER_F}function im(e){return e>=fe.UPPER_A&&e<=fe.UPPER_Z||e>=fe.LOWER_A&&e<=fe.LOWER_Z||Mn(e)}function nm(e){return e===fe.EQUALS||im(e)}var pe;(function(e){e[e.EntityStart=0]="EntityStart",e[e.NumericStart=1]="NumericStart",e[e.NumericDecimal=2]="NumericDecimal",e[e.NumericHex=3]="NumericHex",e[e.NamedEntity=4]="NamedEntity"})(pe||(pe={}));var Ue;(function(e){e[e.Legacy=0]="Legacy",e[e.Strict=1]="Strict",e[e.Attribute=2]="Attribute"})(Ue||(Ue={}));var ai=class{constructor(t,r,o){this.decodeTree=t,this.emitCodePoint=r,this.errors=o,this.state=pe.EntityStart,this.consumed=1,this.result=0,this.treeIndex=0,this.excess=1,this.decodeMode=Ue.Strict}startEntity(t){this.decodeMode=t,this.state=pe.EntityStart,this.result=0,this.treeIndex=0,this.excess=1,this.consumed=1}write(t,r){switch(this.state){case pe.EntityStart:return t.charCodeAt(r)===fe.NUM?(this.state=pe.NumericStart,this.consumed+=1,this.stateNumericStart(t,r+1)):(this.state=pe.NamedEntity,this.stateNamedEntity(t,r));case pe.NumericStart:return this.stateNumericStart(t,r);case pe.NumericDecimal:return this.stateNumericDecimal(t,r);case pe.NumericHex:return this.stateNumericHex(t,r);case pe.NamedEntity:return this.stateNamedEntity(t,r)}}stateNumericStart(t,r){return r>=t.length?-1:(t.charCodeAt(r)|rm)===fe.LOWER_X?(this.state=pe.NumericHex,this.consumed+=1,this.stateNumericHex(t,r+1)):(this.state=pe.NumericDecimal,this.stateNumericDecimal(t,r))}addToNumericResult(t,r,o,i){if(r!==o){let n=o-r;this.result=this.result*Math.pow(i,n)+parseInt(t.substr(r,n),i),this.consumed+=n}}stateNumericHex(t,r){let o=r;for(;r<t.length;){let i=t.charCodeAt(r);if(Mn(i)||om(i))r+=1;else return this.addToNumericResult(t,o,r,16),this.emitNumericEntity(i,3)}return this.addToNumericResult(t,o,r,16),-1}stateNumericDecimal(t,r){let o=r;for(;r<t.length;){let i=t.charCodeAt(r);if(Mn(i))r+=1;else return this.addToNumericResult(t,o,r,10),this.emitNumericEntity(i,2)}return this.addToNumericResult(t,o,r,10),-1}emitNumericEntity(t,r){var o;if(this.consumed<=r)return(o=this.errors)===null||o===void 0||o.absenceOfDigitsInNumericCharacterReference(this.consumed),0;if(t===fe.SEMI)this.consumed+=1;else if(this.decodeMode===Ue.Strict)return 0;return this.emitCodePoint(zn(this.result),this.consumed),this.errors&&(t!==fe.SEMI&&this.errors.missingSemicolonAfterCharacterReference(),this.errors.validateNumericCharacterReference(this.result)),this.consumed}stateNamedEntity(t,r){let{decodeTree:o}=this,i=o[this.treeIndex],n=(i&Et.VALUE_LENGTH)>>14;for(;r<t.length;r++,this.excess++){let a=t.charCodeAt(r);if(this.treeIndex=am(o,i,this.treeIndex+Math.max(1,n),a),this.treeIndex<0)return this.result===0||this.decodeMode===Ue.Attribute&&(n===0||nm(a))?0:this.emitNotTerminatedNamedEntity();if(i=o[this.treeIndex],n=(i&Et.VALUE_LENGTH)>>14,n!==0){if(a===fe.SEMI)return this.emitNamedEntityData(this.treeIndex,n,this.consumed+this.excess);this.decodeMode!==Ue.Strict&&(this.result=this.treeIndex,this.consumed+=this.excess,this.excess=0)}}return-1}emitNotTerminatedNamedEntity(){var t;let{result:r,decodeTree:o}=this,i=(o[r]&Et.VALUE_LENGTH)>>14;return this.emitNamedEntityData(r,i,this.consumed),(t=this.errors)===null||t===void 0||t.missingSemicolonAfterCharacterReference(),this.consumed}emitNamedEntityData(t,r,o){let{decodeTree:i}=this;return this.emitCodePoint(r===1?i[t]&~Et.VALUE_LENGTH:i[t+1],o),r===3&&this.emitCodePoint(i[t+2],o),o}end(){var t;switch(this.state){case pe.NamedEntity:return this.result!==0&&(this.decodeMode!==Ue.Attribute||this.result===this.treeIndex)?this.emitNotTerminatedNamedEntity():0;case pe.NumericDecimal:return this.emitNumericEntity(0,2);case pe.NumericHex:return this.emitNumericEntity(0,3);case pe.NumericStart:return(t=this.errors)===null||t===void 0||t.absenceOfDigitsInNumericCharacterReference(this.consumed),0;case pe.EntityStart:return 0}}};function _c(e){let t="",r=new ai(e,o=>t+=Dn(o));return function(i,n){let a=0,s=0;for(;(s=i.indexOf("&",s))>=0;){t+=i.slice(a,s),r.startEntity(n);let u=r.write(i,s+1);if(u<0){a=s+r.end();break}a=s+u,s=u===0?a+1:a}let l=t+i.slice(a);return t="",l}}function am(e,t,r,o){let i=(t&Et.BRANCH_LENGTH)>>7,n=t&Et.JUMP_TABLE;if(i===0)return n!==0&&o===n?r:-1;if(n){let l=o-n;return l<0||l>=i?-1:e[r+l]-1}let a=r,s=a+i-1;for(;a<=s;){let l=a+s>>>1,u=e[l];if(u<o)a=l+1;else if(u>o)s=l-1;else return e[l+i]}return-1}var Sc=_c(Tc),dy=_c(Ac);function Sr(e,t=Ue.Legacy){return Sc(e,t)}function so(e){return Sc(e,Ue.Strict)}function si(e){for(let t=1;t<e.length;t++)e[t][0]+=e[t-1][0]+1;return e}var sm=new Map(si([[9,"&Tab;"],[0,"&NewLine;"],[22,"&excl;"],[0,"&quot;"],[0,"&num;"],[0,"&dollar;"],[0,"&percnt;"],[0,"&amp;"],[0,"&apos;"],[0,"&lpar;"],[0,"&rpar;"],[0,"&ast;"],[0,"&plus;"],[0,"&comma;"],[1,"&period;"],[0,"&sol;"],[10,"&colon;"],[0,"&semi;"],[0,{v:"&lt;",n:8402,o:"&nvlt;"}],[0,{v:"&equals;",n:8421,o:"&bne;"}],[0,{v:"&gt;",n:8402,o:"&nvgt;"}],[0,"&quest;"],[0,"&commat;"],[26,"&lbrack;"],[0,"&bsol;"],[0,"&rbrack;"],[0,"&Hat;"],[0,"&lowbar;"],[0,"&DiacriticalGrave;"],[5,{n:106,o:"&fjlig;"}],[20,"&lbrace;"],[0,"&verbar;"],[0,"&rbrace;"],[34,"&nbsp;"],[0,"&iexcl;"],[0,"&cent;"],[0,"&pound;"],[0,"&curren;"],[0,"&yen;"],[0,"&brvbar;"],[0,"&sect;"],[0,"&die;"],[0,"&copy;"],[0,"&ordf;"],[0,"&laquo;"],[0,"&not;"],[0,"&shy;"],[0,"&circledR;"],[0,"&macr;"],[0,"&deg;"],[0,"&PlusMinus;"],[0,"&sup2;"],[0,"&sup3;"],[0,"&acute;"],[0,"&micro;"],[0,"&para;"],[0,"&centerdot;"],[0,"&cedil;"],[0,"&sup1;"],[0,"&ordm;"],[0,"&raquo;"],[0,"&frac14;"],[0,"&frac12;"],[0,"&frac34;"],[0,"&iquest;"],[0,"&Agrave;"],[0,"&Aacute;"],[0,"&Acirc;"],[0,"&Atilde;"],[0,"&Auml;"],[0,"&angst;"],[0,"&AElig;"],[0,"&Ccedil;"],[0,"&Egrave;"],[0,"&Eacute;"],[0,"&Ecirc;"],[0,"&Euml;"],[0,"&Igrave;"],[0,"&Iacute;"],[0,"&Icirc;"],[0,"&Iuml;"],[0,"&ETH;"],[0,"&Ntilde;"],[0,"&Ograve;"],[0,"&Oacute;"],[0,"&Ocirc;"],[0,"&Otilde;"],[0,"&Ouml;"],[0,"&times;"],[0,"&Oslash;"],[0,"&Ugrave;"],[0,"&Uacute;"],[0,"&Ucirc;"],[0,"&Uuml;"],[0,"&Yacute;"],[0,"&THORN;"],[0,"&szlig;"],[0,"&agrave;"],[0,"&aacute;"],[0,"&acirc;"],[0,"&atilde;"],[0,"&auml;"],[0,"&aring;"],[0,"&aelig;"],[0,"&ccedil;"],[0,"&egrave;"],[0,"&eacute;"],[0,"&ecirc;"],[0,"&euml;"],[0,"&igrave;"],[0,"&iacute;"],[0,"&icirc;"],[0,"&iuml;"],[0,"&eth;"],[0,"&ntilde;"],[0,"&ograve;"],[0,"&oacute;"],[0,"&ocirc;"],[0,"&otilde;"],[0,"&ouml;"],[0,"&div;"],[0,"&oslash;"],[0,"&ugrave;"],[0,"&uacute;"],[0,"&ucirc;"],[0,"&uuml;"],[0,"&yacute;"],[0,"&thorn;"],[0,"&yuml;"],[0,"&Amacr;"],[0,"&amacr;"],[0,"&Abreve;"],[0,"&abreve;"],[0,"&Aogon;"],[0,"&aogon;"],[0,"&Cacute;"],[0,"&cacute;"],[0,"&Ccirc;"],[0,"&ccirc;"],[0,"&Cdot;"],[0,"&cdot;"],[0,"&Ccaron;"],[0,"&ccaron;"],[0,"&Dcaron;"],[0,"&dcaron;"],[0,"&Dstrok;"],[0,"&dstrok;"],[0,"&Emacr;"],[0,"&emacr;"],[2,"&Edot;"],[0,"&edot;"],[0,"&Eogon;"],[0,"&eogon;"],[0,"&Ecaron;"],[0,"&ecaron;"],[0,"&Gcirc;"],[0,"&gcirc;"],[0,"&Gbreve;"],[0,"&gbreve;"],[0,"&Gdot;"],[0,"&gdot;"],[0,"&Gcedil;"],[1,"&Hcirc;"],[0,"&hcirc;"],[0,"&Hstrok;"],[0,"&hstrok;"],[0,"&Itilde;"],[0,"&itilde;"],[0,"&Imacr;"],[0,"&imacr;"],[2,"&Iogon;"],[0,"&iogon;"],[0,"&Idot;"],[0,"&imath;"],[0,"&IJlig;"],[0,"&ijlig;"],[0,"&Jcirc;"],[0,"&jcirc;"],[0,"&Kcedil;"],[0,"&kcedil;"],[0,"&kgreen;"],[0,"&Lacute;"],[0,"&lacute;"],[0,"&Lcedil;"],[0,"&lcedil;"],[0,"&Lcaron;"],[0,"&lcaron;"],[0,"&Lmidot;"],[0,"&lmidot;"],[0,"&Lstrok;"],[0,"&lstrok;"],[0,"&Nacute;"],[0,"&nacute;"],[0,"&Ncedil;"],[0,"&ncedil;"],[0,"&Ncaron;"],[0,"&ncaron;"],[0,"&napos;"],[0,"&ENG;"],[0,"&eng;"],[0,"&Omacr;"],[0,"&omacr;"],[2,"&Odblac;"],[0,"&odblac;"],[0,"&OElig;"],[0,"&oelig;"],[0,"&Racute;"],[0,"&racute;"],[0,"&Rcedil;"],[0,"&rcedil;"],[0,"&Rcaron;"],[0,"&rcaron;"],[0,"&Sacute;"],[0,"&sacute;"],[0,"&Scirc;"],[0,"&scirc;"],[0,"&Scedil;"],[0,"&scedil;"],[0,"&Scaron;"],[0,"&scaron;"],[0,"&Tcedil;"],[0,"&tcedil;"],[0,"&Tcaron;"],[0,"&tcaron;"],[0,"&Tstrok;"],[0,"&tstrok;"],[0,"&Utilde;"],[0,"&utilde;"],[0,"&Umacr;"],[0,"&umacr;"],[0,"&Ubreve;"],[0,"&ubreve;"],[0,"&Uring;"],[0,"&uring;"],[0,"&Udblac;"],[0,"&udblac;"],[0,"&Uogon;"],[0,"&uogon;"],[0,"&Wcirc;"],[0,"&wcirc;"],[0,"&Ycirc;"],[0,"&ycirc;"],[0,"&Yuml;"],[0,"&Zacute;"],[0,"&zacute;"],[0,"&Zdot;"],[0,"&zdot;"],[0,"&Zcaron;"],[0,"&zcaron;"],[19,"&fnof;"],[34,"&imped;"],[63,"&gacute;"],[65,"&jmath;"],[142,"&circ;"],[0,"&caron;"],[16,"&breve;"],[0,"&DiacriticalDot;"],[0,"&ring;"],[0,"&ogon;"],[0,"&DiacriticalTilde;"],[0,"&dblac;"],[51,"&DownBreve;"],[127,"&Alpha;"],[0,"&Beta;"],[0,"&Gamma;"],[0,"&Delta;"],[0,"&Epsilon;"],[0,"&Zeta;"],[0,"&Eta;"],[0,"&Theta;"],[0,"&Iota;"],[0,"&Kappa;"],[0,"&Lambda;"],[0,"&Mu;"],[0,"&Nu;"],[0,"&Xi;"],[0,"&Omicron;"],[0,"&Pi;"],[0,"&Rho;"],[1,"&Sigma;"],[0,"&Tau;"],[0,"&Upsilon;"],[0,"&Phi;"],[0,"&Chi;"],[0,"&Psi;"],[0,"&ohm;"],[7,"&alpha;"],[0,"&beta;"],[0,"&gamma;"],[0,"&delta;"],[0,"&epsi;"],[0,"&zeta;"],[0,"&eta;"],[0,"&theta;"],[0,"&iota;"],[0,"&kappa;"],[0,"&lambda;"],[0,"&mu;"],[0,"&nu;"],[0,"&xi;"],[0,"&omicron;"],[0,"&pi;"],[0,"&rho;"],[0,"&sigmaf;"],[0,"&sigma;"],[0,"&tau;"],[0,"&upsi;"],[0,"&phi;"],[0,"&chi;"],[0,"&psi;"],[0,"&omega;"],[7,"&thetasym;"],[0,"&Upsi;"],[2,"&phiv;"],[0,"&piv;"],[5,"&Gammad;"],[0,"&digamma;"],[18,"&kappav;"],[0,"&rhov;"],[3,"&epsiv;"],[0,"&backepsilon;"],[10,"&IOcy;"],[0,"&DJcy;"],[0,"&GJcy;"],[0,"&Jukcy;"],[0,"&DScy;"],[0,"&Iukcy;"],[0,"&YIcy;"],[0,"&Jsercy;"],[0,"&LJcy;"],[0,"&NJcy;"],[0,"&TSHcy;"],[0,"&KJcy;"],[1,"&Ubrcy;"],[0,"&DZcy;"],[0,"&Acy;"],[0,"&Bcy;"],[0,"&Vcy;"],[0,"&Gcy;"],[0,"&Dcy;"],[0,"&IEcy;"],[0,"&ZHcy;"],[0,"&Zcy;"],[0,"&Icy;"],[0,"&Jcy;"],[0,"&Kcy;"],[0,"&Lcy;"],[0,"&Mcy;"],[0,"&Ncy;"],[0,"&Ocy;"],[0,"&Pcy;"],[0,"&Rcy;"],[0,"&Scy;"],[0,"&Tcy;"],[0,"&Ucy;"],[0,"&Fcy;"],[0,"&KHcy;"],[0,"&TScy;"],[0,"&CHcy;"],[0,"&SHcy;"],[0,"&SHCHcy;"],[0,"&HARDcy;"],[0,"&Ycy;"],[0,"&SOFTcy;"],[0,"&Ecy;"],[0,"&YUcy;"],[0,"&YAcy;"],[0,"&acy;"],[0,"&bcy;"],[0,"&vcy;"],[0,"&gcy;"],[0,"&dcy;"],[0,"&iecy;"],[0,"&zhcy;"],[0,"&zcy;"],[0,"&icy;"],[0,"&jcy;"],[0,"&kcy;"],[0,"&lcy;"],[0,"&mcy;"],[0,"&ncy;"],[0,"&ocy;"],[0,"&pcy;"],[0,"&rcy;"],[0,"&scy;"],[0,"&tcy;"],[0,"&ucy;"],[0,"&fcy;"],[0,"&khcy;"],[0,"&tscy;"],[0,"&chcy;"],[0,"&shcy;"],[0,"&shchcy;"],[0,"&hardcy;"],[0,"&ycy;"],[0,"&softcy;"],[0,"&ecy;"],[0,"&yucy;"],[0,"&yacy;"],[1,"&iocy;"],[0,"&djcy;"],[0,"&gjcy;"],[0,"&jukcy;"],[0,"&dscy;"],[0,"&iukcy;"],[0,"&yicy;"],[0,"&jsercy;"],[0,"&ljcy;"],[0,"&njcy;"],[0,"&tshcy;"],[0,"&kjcy;"],[1,"&ubrcy;"],[0,"&dzcy;"],[7074,"&ensp;"],[0,"&emsp;"],[0,"&emsp13;"],[0,"&emsp14;"],[1,"&numsp;"],[0,"&puncsp;"],[0,"&ThinSpace;"],[0,"&hairsp;"],[0,"&NegativeMediumSpace;"],[0,"&zwnj;"],[0,"&zwj;"],[0,"&lrm;"],[0,"&rlm;"],[0,"&dash;"],[2,"&ndash;"],[0,"&mdash;"],[0,"&horbar;"],[0,"&Verbar;"],[1,"&lsquo;"],[0,"&CloseCurlyQuote;"],[0,"&lsquor;"],[1,"&ldquo;"],[0,"&CloseCurlyDoubleQuote;"],[0,"&bdquo;"],[1,"&dagger;"],[0,"&Dagger;"],[0,"&bull;"],[2,"&nldr;"],[0,"&hellip;"],[9,"&permil;"],[0,"&pertenk;"],[0,"&prime;"],[0,"&Prime;"],[0,"&tprime;"],[0,"&backprime;"],[3,"&lsaquo;"],[0,"&rsaquo;"],[3,"&oline;"],[2,"&caret;"],[1,"&hybull;"],[0,"&frasl;"],[10,"&bsemi;"],[7,"&qprime;"],[7,{v:"&MediumSpace;",n:8202,o:"&ThickSpace;"}],[0,"&NoBreak;"],[0,"&af;"],[0,"&InvisibleTimes;"],[0,"&ic;"],[72,"&euro;"],[46,"&tdot;"],[0,"&DotDot;"],[37,"&complexes;"],[2,"&incare;"],[4,"&gscr;"],[0,"&hamilt;"],[0,"&Hfr;"],[0,"&Hopf;"],[0,"&planckh;"],[0,"&hbar;"],[0,"&imagline;"],[0,"&Ifr;"],[0,"&lagran;"],[0,"&ell;"],[1,"&naturals;"],[0,"&numero;"],[0,"&copysr;"],[0,"&weierp;"],[0,"&Popf;"],[0,"&Qopf;"],[0,"&realine;"],[0,"&real;"],[0,"&reals;"],[0,"&rx;"],[3,"&trade;"],[1,"&integers;"],[2,"&mho;"],[0,"&zeetrf;"],[0,"&iiota;"],[2,"&bernou;"],[0,"&Cayleys;"],[1,"&escr;"],[0,"&Escr;"],[0,"&Fouriertrf;"],[1,"&Mellintrf;"],[0,"&order;"],[0,"&alefsym;"],[0,"&beth;"],[0,"&gimel;"],[0,"&daleth;"],[12,"&CapitalDifferentialD;"],[0,"&dd;"],[0,"&ee;"],[0,"&ii;"],[10,"&frac13;"],[0,"&frac23;"],[0,"&frac15;"],[0,"&frac25;"],[0,"&frac35;"],[0,"&frac45;"],[0,"&frac16;"],[0,"&frac56;"],[0,"&frac18;"],[0,"&frac38;"],[0,"&frac58;"],[0,"&frac78;"],[49,"&larr;"],[0,"&ShortUpArrow;"],[0,"&rarr;"],[0,"&darr;"],[0,"&harr;"],[0,"&updownarrow;"],[0,"&nwarr;"],[0,"&nearr;"],[0,"&LowerRightArrow;"],[0,"&LowerLeftArrow;"],[0,"&nlarr;"],[0,"&nrarr;"],[1,{v:"&rarrw;",n:824,o:"&nrarrw;"}],[0,"&Larr;"],[0,"&Uarr;"],[0,"&Rarr;"],[0,"&Darr;"],[0,"&larrtl;"],[0,"&rarrtl;"],[0,"&LeftTeeArrow;"],[0,"&mapstoup;"],[0,"&map;"],[0,"&DownTeeArrow;"],[1,"&hookleftarrow;"],[0,"&hookrightarrow;"],[0,"&larrlp;"],[0,"&looparrowright;"],[0,"&harrw;"],[0,"&nharr;"],[1,"&lsh;"],[0,"&rsh;"],[0,"&ldsh;"],[0,"&rdsh;"],[1,"&crarr;"],[0,"&cularr;"],[0,"&curarr;"],[2,"&circlearrowleft;"],[0,"&circlearrowright;"],[0,"&leftharpoonup;"],[0,"&DownLeftVector;"],[0,"&RightUpVector;"],[0,"&LeftUpVector;"],[0,"&rharu;"],[0,"&DownRightVector;"],[0,"&dharr;"],[0,"&dharl;"],[0,"&RightArrowLeftArrow;"],[0,"&udarr;"],[0,"&LeftArrowRightArrow;"],[0,"&leftleftarrows;"],[0,"&upuparrows;"],[0,"&rightrightarrows;"],[0,"&ddarr;"],[0,"&leftrightharpoons;"],[0,"&Equilibrium;"],[0,"&nlArr;"],[0,"&nhArr;"],[0,"&nrArr;"],[0,"&DoubleLeftArrow;"],[0,"&DoubleUpArrow;"],[0,"&DoubleRightArrow;"],[0,"&dArr;"],[0,"&DoubleLeftRightArrow;"],[0,"&DoubleUpDownArrow;"],[0,"&nwArr;"],[0,"&neArr;"],[0,"&seArr;"],[0,"&swArr;"],[0,"&lAarr;"],[0,"&rAarr;"],[1,"&zigrarr;"],[6,"&larrb;"],[0,"&rarrb;"],[15,"&DownArrowUpArrow;"],[7,"&loarr;"],[0,"&roarr;"],[0,"&hoarr;"],[0,"&forall;"],[0,"&comp;"],[0,{v:"&part;",n:824,o:"&npart;"}],[0,"&exist;"],[0,"&nexist;"],[0,"&empty;"],[1,"&Del;"],[0,"&Element;"],[0,"&NotElement;"],[1,"&ni;"],[0,"&notni;"],[2,"&prod;"],[0,"&coprod;"],[0,"&sum;"],[0,"&minus;"],[0,"&MinusPlus;"],[0,"&dotplus;"],[1,"&Backslash;"],[0,"&lowast;"],[0,"&compfn;"],[1,"&radic;"],[2,"&prop;"],[0,"&infin;"],[0,"&angrt;"],[0,{v:"&ang;",n:8402,o:"&nang;"}],[0,"&angmsd;"],[0,"&angsph;"],[0,"&mid;"],[0,"&nmid;"],[0,"&DoubleVerticalBar;"],[0,"&NotDoubleVerticalBar;"],[0,"&and;"],[0,"&or;"],[0,{v:"&cap;",n:65024,o:"&caps;"}],[0,{v:"&cup;",n:65024,o:"&cups;"}],[0,"&int;"],[0,"&Int;"],[0,"&iiint;"],[0,"&conint;"],[0,"&Conint;"],[0,"&Cconint;"],[0,"&cwint;"],[0,"&ClockwiseContourIntegral;"],[0,"&awconint;"],[0,"&there4;"],[0,"&becaus;"],[0,"&ratio;"],[0,"&Colon;"],[0,"&dotminus;"],[1,"&mDDot;"],[0,"&homtht;"],[0,{v:"&sim;",n:8402,o:"&nvsim;"}],[0,{v:"&backsim;",n:817,o:"&race;"}],[0,{v:"&ac;",n:819,o:"&acE;"}],[0,"&acd;"],[0,"&VerticalTilde;"],[0,"&NotTilde;"],[0,{v:"&eqsim;",n:824,o:"&nesim;"}],[0,"&sime;"],[0,"&NotTildeEqual;"],[0,"&cong;"],[0,"&simne;"],[0,"&ncong;"],[0,"&ap;"],[0,"&nap;"],[0,"&ape;"],[0,{v:"&apid;",n:824,o:"&napid;"}],[0,"&backcong;"],[0,{v:"&asympeq;",n:8402,o:"&nvap;"}],[0,{v:"&bump;",n:824,o:"&nbump;"}],[0,{v:"&bumpe;",n:824,o:"&nbumpe;"}],[0,{v:"&doteq;",n:824,o:"&nedot;"}],[0,"&doteqdot;"],[0,"&efDot;"],[0,"&erDot;"],[0,"&Assign;"],[0,"&ecolon;"],[0,"&ecir;"],[0,"&circeq;"],[1,"&wedgeq;"],[0,"&veeeq;"],[1,"&triangleq;"],[2,"&equest;"],[0,"&ne;"],[0,{v:"&Congruent;",n:8421,o:"&bnequiv;"}],[0,"&nequiv;"],[1,{v:"&le;",n:8402,o:"&nvle;"}],[0,{v:"&ge;",n:8402,o:"&nvge;"}],[0,{v:"&lE;",n:824,o:"&nlE;"}],[0,{v:"&gE;",n:824,o:"&ngE;"}],[0,{v:"&lnE;",n:65024,o:"&lvertneqq;"}],[0,{v:"&gnE;",n:65024,o:"&gvertneqq;"}],[0,{v:"&ll;",n:new Map(si([[824,"&nLtv;"],[7577,"&nLt;"]]))}],[0,{v:"&gg;",n:new Map(si([[824,"&nGtv;"],[7577,"&nGt;"]]))}],[0,"&between;"],[0,"&NotCupCap;"],[0,"&nless;"],[0,"&ngt;"],[0,"&nle;"],[0,"&nge;"],[0,"&lesssim;"],[0,"&GreaterTilde;"],[0,"&nlsim;"],[0,"&ngsim;"],[0,"&LessGreater;"],[0,"&gl;"],[0,"&NotLessGreater;"],[0,"&NotGreaterLess;"],[0,"&pr;"],[0,"&sc;"],[0,"&prcue;"],[0,"&sccue;"],[0,"&PrecedesTilde;"],[0,{v:"&scsim;",n:824,o:"&NotSucceedsTilde;"}],[0,"&NotPrecedes;"],[0,"&NotSucceeds;"],[0,{v:"&sub;",n:8402,o:"&NotSubset;"}],[0,{v:"&sup;",n:8402,o:"&NotSuperset;"}],[0,"&nsub;"],[0,"&nsup;"],[0,"&sube;"],[0,"&supe;"],[0,"&NotSubsetEqual;"],[0,"&NotSupersetEqual;"],[0,{v:"&subne;",n:65024,o:"&varsubsetneq;"}],[0,{v:"&supne;",n:65024,o:"&varsupsetneq;"}],[1,"&cupdot;"],[0,"&UnionPlus;"],[0,{v:"&sqsub;",n:824,o:"&NotSquareSubset;"}],[0,{v:"&sqsup;",n:824,o:"&NotSquareSuperset;"}],[0,"&sqsube;"],[0,"&sqsupe;"],[0,{v:"&sqcap;",n:65024,o:"&sqcaps;"}],[0,{v:"&sqcup;",n:65024,o:"&sqcups;"}],[0,"&CirclePlus;"],[0,"&CircleMinus;"],[0,"&CircleTimes;"],[0,"&osol;"],[0,"&CircleDot;"],[0,"&circledcirc;"],[0,"&circledast;"],[1,"&circleddash;"],[0,"&boxplus;"],[0,"&boxminus;"],[0,"&boxtimes;"],[0,"&dotsquare;"],[0,"&RightTee;"],[0,"&dashv;"],[0,"&DownTee;"],[0,"&bot;"],[1,"&models;"],[0,"&DoubleRightTee;"],[0,"&Vdash;"],[0,"&Vvdash;"],[0,"&VDash;"],[0,"&nvdash;"],[0,"&nvDash;"],[0,"&nVdash;"],[0,"&nVDash;"],[0,"&prurel;"],[1,"&LeftTriangle;"],[0,"&RightTriangle;"],[0,{v:"&LeftTriangleEqual;",n:8402,o:"&nvltrie;"}],[0,{v:"&RightTriangleEqual;",n:8402,o:"&nvrtrie;"}],[0,"&origof;"],[0,"&imof;"],[0,"&multimap;"],[0,"&hercon;"],[0,"&intcal;"],[0,"&veebar;"],[1,"&barvee;"],[0,"&angrtvb;"],[0,"&lrtri;"],[0,"&bigwedge;"],[0,"&bigvee;"],[0,"&bigcap;"],[0,"&bigcup;"],[0,"&diam;"],[0,"&sdot;"],[0,"&sstarf;"],[0,"&divideontimes;"],[0,"&bowtie;"],[0,"&ltimes;"],[0,"&rtimes;"],[0,"&leftthreetimes;"],[0,"&rightthreetimes;"],[0,"&backsimeq;"],[0,"&curlyvee;"],[0,"&curlywedge;"],[0,"&Sub;"],[0,"&Sup;"],[0,"&Cap;"],[0,"&Cup;"],[0,"&fork;"],[0,"&epar;"],[0,"&lessdot;"],[0,"&gtdot;"],[0,{v:"&Ll;",n:824,o:"&nLl;"}],[0,{v:"&Gg;",n:824,o:"&nGg;"}],[0,{v:"&leg;",n:65024,o:"&lesg;"}],[0,{v:"&gel;",n:65024,o:"&gesl;"}],[2,"&cuepr;"],[0,"&cuesc;"],[0,"&NotPrecedesSlantEqual;"],[0,"&NotSucceedsSlantEqual;"],[0,"&NotSquareSubsetEqual;"],[0,"&NotSquareSupersetEqual;"],[2,"&lnsim;"],[0,"&gnsim;"],[0,"&precnsim;"],[0,"&scnsim;"],[0,"&nltri;"],[0,"&NotRightTriangle;"],[0,"&nltrie;"],[0,"&NotRightTriangleEqual;"],[0,"&vellip;"],[0,"&ctdot;"],[0,"&utdot;"],[0,"&dtdot;"],[0,"&disin;"],[0,"&isinsv;"],[0,"&isins;"],[0,{v:"&isindot;",n:824,o:"&notindot;"}],[0,"&notinvc;"],[0,"&notinvb;"],[1,{v:"&isinE;",n:824,o:"&notinE;"}],[0,"&nisd;"],[0,"&xnis;"],[0,"&nis;"],[0,"&notnivc;"],[0,"&notnivb;"],[6,"&barwed;"],[0,"&Barwed;"],[1,"&lceil;"],[0,"&rceil;"],[0,"&LeftFloor;"],[0,"&rfloor;"],[0,"&drcrop;"],[0,"&dlcrop;"],[0,"&urcrop;"],[0,"&ulcrop;"],[0,"&bnot;"],[1,"&profline;"],[0,"&profsurf;"],[1,"&telrec;"],[0,"&target;"],[5,"&ulcorn;"],[0,"&urcorn;"],[0,"&dlcorn;"],[0,"&drcorn;"],[2,"&frown;"],[0,"&smile;"],[9,"&cylcty;"],[0,"&profalar;"],[7,"&topbot;"],[6,"&ovbar;"],[1,"&solbar;"],[60,"&angzarr;"],[51,"&lmoustache;"],[0,"&rmoustache;"],[2,"&OverBracket;"],[0,"&bbrk;"],[0,"&bbrktbrk;"],[37,"&OverParenthesis;"],[0,"&UnderParenthesis;"],[0,"&OverBrace;"],[0,"&UnderBrace;"],[2,"&trpezium;"],[4,"&elinters;"],[59,"&blank;"],[164,"&circledS;"],[55,"&boxh;"],[1,"&boxv;"],[9,"&boxdr;"],[3,"&boxdl;"],[3,"&boxur;"],[3,"&boxul;"],[3,"&boxvr;"],[7,"&boxvl;"],[7,"&boxhd;"],[7,"&boxhu;"],[7,"&boxvh;"],[19,"&boxH;"],[0,"&boxV;"],[0,"&boxdR;"],[0,"&boxDr;"],[0,"&boxDR;"],[0,"&boxdL;"],[0,"&boxDl;"],[0,"&boxDL;"],[0,"&boxuR;"],[0,"&boxUr;"],[0,"&boxUR;"],[0,"&boxuL;"],[0,"&boxUl;"],[0,"&boxUL;"],[0,"&boxvR;"],[0,"&boxVr;"],[0,"&boxVR;"],[0,"&boxvL;"],[0,"&boxVl;"],[0,"&boxVL;"],[0,"&boxHd;"],[0,"&boxhD;"],[0,"&boxHD;"],[0,"&boxHu;"],[0,"&boxhU;"],[0,"&boxHU;"],[0,"&boxvH;"],[0,"&boxVh;"],[0,"&boxVH;"],[19,"&uhblk;"],[3,"&lhblk;"],[3,"&block;"],[8,"&blk14;"],[0,"&blk12;"],[0,"&blk34;"],[13,"&square;"],[8,"&blacksquare;"],[0,"&EmptyVerySmallSquare;"],[1,"&rect;"],[0,"&marker;"],[2,"&fltns;"],[1,"&bigtriangleup;"],[0,"&blacktriangle;"],[0,"&triangle;"],[2,"&blacktriangleright;"],[0,"&rtri;"],[3,"&bigtriangledown;"],[0,"&blacktriangledown;"],[0,"&dtri;"],[2,"&blacktriangleleft;"],[0,"&ltri;"],[6,"&loz;"],[0,"&cir;"],[32,"&tridot;"],[2,"&bigcirc;"],[8,"&ultri;"],[0,"&urtri;"],[0,"&lltri;"],[0,"&EmptySmallSquare;"],[0,"&FilledSmallSquare;"],[8,"&bigstar;"],[0,"&star;"],[7,"&phone;"],[49,"&female;"],[1,"&male;"],[29,"&spades;"],[2,"&clubs;"],[1,"&hearts;"],[0,"&diamondsuit;"],[3,"&sung;"],[2,"&flat;"],[0,"&natural;"],[0,"&sharp;"],[163,"&check;"],[3,"&cross;"],[8,"&malt;"],[21,"&sext;"],[33,"&VerticalSeparator;"],[25,"&lbbrk;"],[0,"&rbbrk;"],[84,"&bsolhsub;"],[0,"&suphsol;"],[28,"&LeftDoubleBracket;"],[0,"&RightDoubleBracket;"],[0,"&lang;"],[0,"&rang;"],[0,"&Lang;"],[0,"&Rang;"],[0,"&loang;"],[0,"&roang;"],[7,"&longleftarrow;"],[0,"&longrightarrow;"],[0,"&longleftrightarrow;"],[0,"&DoubleLongLeftArrow;"],[0,"&DoubleLongRightArrow;"],[0,"&DoubleLongLeftRightArrow;"],[1,"&longmapsto;"],[2,"&dzigrarr;"],[258,"&nvlArr;"],[0,"&nvrArr;"],[0,"&nvHarr;"],[0,"&Map;"],[6,"&lbarr;"],[0,"&bkarow;"],[0,"&lBarr;"],[0,"&dbkarow;"],[0,"&drbkarow;"],[0,"&DDotrahd;"],[0,"&UpArrowBar;"],[0,"&DownArrowBar;"],[2,"&Rarrtl;"],[2,"&latail;"],[0,"&ratail;"],[0,"&lAtail;"],[0,"&rAtail;"],[0,"&larrfs;"],[0,"&rarrfs;"],[0,"&larrbfs;"],[0,"&rarrbfs;"],[2,"&nwarhk;"],[0,"&nearhk;"],[0,"&hksearow;"],[0,"&hkswarow;"],[0,"&nwnear;"],[0,"&nesear;"],[0,"&seswar;"],[0,"&swnwar;"],[8,{v:"&rarrc;",n:824,o:"&nrarrc;"}],[1,"&cudarrr;"],[0,"&ldca;"],[0,"&rdca;"],[0,"&cudarrl;"],[0,"&larrpl;"],[2,"&curarrm;"],[0,"&cularrp;"],[7,"&rarrpl;"],[2,"&harrcir;"],[0,"&Uarrocir;"],[0,"&lurdshar;"],[0,"&ldrushar;"],[2,"&LeftRightVector;"],[0,"&RightUpDownVector;"],[0,"&DownLeftRightVector;"],[0,"&LeftUpDownVector;"],[0,"&LeftVectorBar;"],[0,"&RightVectorBar;"],[0,"&RightUpVectorBar;"],[0,"&RightDownVectorBar;"],[0,"&DownLeftVectorBar;"],[0,"&DownRightVectorBar;"],[0,"&LeftUpVectorBar;"],[0,"&LeftDownVectorBar;"],[0,"&LeftTeeVector;"],[0,"&RightTeeVector;"],[0,"&RightUpTeeVector;"],[0,"&RightDownTeeVector;"],[0,"&DownLeftTeeVector;"],[0,"&DownRightTeeVector;"],[0,"&LeftUpTeeVector;"],[0,"&LeftDownTeeVector;"],[0,"&lHar;"],[0,"&uHar;"],[0,"&rHar;"],[0,"&dHar;"],[0,"&luruhar;"],[0,"&ldrdhar;"],[0,"&ruluhar;"],[0,"&rdldhar;"],[0,"&lharul;"],[0,"&llhard;"],[0,"&rharul;"],[0,"&lrhard;"],[0,"&udhar;"],[0,"&duhar;"],[0,"&RoundImplies;"],[0,"&erarr;"],[0,"&simrarr;"],[0,"&larrsim;"],[0,"&rarrsim;"],[0,"&rarrap;"],[0,"&ltlarr;"],[1,"&gtrarr;"],[0,"&subrarr;"],[1,"&suplarr;"],[0,"&lfisht;"],[0,"&rfisht;"],[0,"&ufisht;"],[0,"&dfisht;"],[5,"&lopar;"],[0,"&ropar;"],[4,"&lbrke;"],[0,"&rbrke;"],[0,"&lbrkslu;"],[0,"&rbrksld;"],[0,"&lbrksld;"],[0,"&rbrkslu;"],[0,"&langd;"],[0,"&rangd;"],[0,"&lparlt;"],[0,"&rpargt;"],[0,"&gtlPar;"],[0,"&ltrPar;"],[3,"&vzigzag;"],[1,"&vangrt;"],[0,"&angrtvbd;"],[6,"&ange;"],[0,"&range;"],[0,"&dwangle;"],[0,"&uwangle;"],[0,"&angmsdaa;"],[0,"&angmsdab;"],[0,"&angmsdac;"],[0,"&angmsdad;"],[0,"&angmsdae;"],[0,"&angmsdaf;"],[0,"&angmsdag;"],[0,"&angmsdah;"],[0,"&bemptyv;"],[0,"&demptyv;"],[0,"&cemptyv;"],[0,"&raemptyv;"],[0,"&laemptyv;"],[0,"&ohbar;"],[0,"&omid;"],[0,"&opar;"],[1,"&operp;"],[1,"&olcross;"],[0,"&odsold;"],[1,"&olcir;"],[0,"&ofcir;"],[0,"&olt;"],[0,"&ogt;"],[0,"&cirscir;"],[0,"&cirE;"],[0,"&solb;"],[0,"&bsolb;"],[3,"&boxbox;"],[3,"&trisb;"],[0,"&rtriltri;"],[0,{v:"&LeftTriangleBar;",n:824,o:"&NotLeftTriangleBar;"}],[0,{v:"&RightTriangleBar;",n:824,o:"&NotRightTriangleBar;"}],[11,"&iinfin;"],[0,"&infintie;"],[0,"&nvinfin;"],[4,"&eparsl;"],[0,"&smeparsl;"],[0,"&eqvparsl;"],[5,"&blacklozenge;"],[8,"&RuleDelayed;"],[1,"&dsol;"],[9,"&bigodot;"],[0,"&bigoplus;"],[0,"&bigotimes;"],[1,"&biguplus;"],[1,"&bigsqcup;"],[5,"&iiiint;"],[0,"&fpartint;"],[2,"&cirfnint;"],[0,"&awint;"],[0,"&rppolint;"],[0,"&scpolint;"],[0,"&npolint;"],[0,"&pointint;"],[0,"&quatint;"],[0,"&intlarhk;"],[10,"&pluscir;"],[0,"&plusacir;"],[0,"&simplus;"],[0,"&plusdu;"],[0,"&plussim;"],[0,"&plustwo;"],[1,"&mcomma;"],[0,"&minusdu;"],[2,"&loplus;"],[0,"&roplus;"],[0,"&Cross;"],[0,"&timesd;"],[0,"&timesbar;"],[1,"&smashp;"],[0,"&lotimes;"],[0,"&rotimes;"],[0,"&otimesas;"],[0,"&Otimes;"],[0,"&odiv;"],[0,"&triplus;"],[0,"&triminus;"],[0,"&tritime;"],[0,"&intprod;"],[2,"&amalg;"],[0,"&capdot;"],[1,"&ncup;"],[0,"&ncap;"],[0,"&capand;"],[0,"&cupor;"],[0,"&cupcap;"],[0,"&capcup;"],[0,"&cupbrcap;"],[0,"&capbrcup;"],[0,"&cupcup;"],[0,"&capcap;"],[0,"&ccups;"],[0,"&ccaps;"],[2,"&ccupssm;"],[2,"&And;"],[0,"&Or;"],[0,"&andand;"],[0,"&oror;"],[0,"&orslope;"],[0,"&andslope;"],[1,"&andv;"],[0,"&orv;"],[0,"&andd;"],[0,"&ord;"],[1,"&wedbar;"],[6,"&sdote;"],[3,"&simdot;"],[2,{v:"&congdot;",n:824,o:"&ncongdot;"}],[0,"&easter;"],[0,"&apacir;"],[0,{v:"&apE;",n:824,o:"&napE;"}],[0,"&eplus;"],[0,"&pluse;"],[0,"&Esim;"],[0,"&Colone;"],[0,"&Equal;"],[1,"&ddotseq;"],[0,"&equivDD;"],[0,"&ltcir;"],[0,"&gtcir;"],[0,"&ltquest;"],[0,"&gtquest;"],[0,{v:"&leqslant;",n:824,o:"&nleqslant;"}],[0,{v:"&geqslant;",n:824,o:"&ngeqslant;"}],[0,"&lesdot;"],[0,"&gesdot;"],[0,"&lesdoto;"],[0,"&gesdoto;"],[0,"&lesdotor;"],[0,"&gesdotol;"],[0,"&lap;"],[0,"&gap;"],[0,"&lne;"],[0,"&gne;"],[0,"&lnap;"],[0,"&gnap;"],[0,"&lEg;"],[0,"&gEl;"],[0,"&lsime;"],[0,"&gsime;"],[0,"&lsimg;"],[0,"&gsiml;"],[0,"&lgE;"],[0,"&glE;"],[0,"&lesges;"],[0,"&gesles;"],[0,"&els;"],[0,"&egs;"],[0,"&elsdot;"],[0,"&egsdot;"],[0,"&el;"],[0,"&eg;"],[2,"&siml;"],[0,"&simg;"],[0,"&simlE;"],[0,"&simgE;"],[0,{v:"&LessLess;",n:824,o:"&NotNestedLessLess;"}],[0,{v:"&GreaterGreater;",n:824,o:"&NotNestedGreaterGreater;"}],[1,"&glj;"],[0,"&gla;"],[0,"&ltcc;"],[0,"&gtcc;"],[0,"&lescc;"],[0,"&gescc;"],[0,"&smt;"],[0,"&lat;"],[0,{v:"&smte;",n:65024,o:"&smtes;"}],[0,{v:"&late;",n:65024,o:"&lates;"}],[0,"&bumpE;"],[0,{v:"&PrecedesEqual;",n:824,o:"&NotPrecedesEqual;"}],[0,{v:"&sce;",n:824,o:"&NotSucceedsEqual;"}],[2,"&prE;"],[0,"&scE;"],[0,"&precneqq;"],[0,"&scnE;"],[0,"&prap;"],[0,"&scap;"],[0,"&precnapprox;"],[0,"&scnap;"],[0,"&Pr;"],[0,"&Sc;"],[0,"&subdot;"],[0,"&supdot;"],[0,"&subplus;"],[0,"&supplus;"],[0,"&submult;"],[0,"&supmult;"],[0,"&subedot;"],[0,"&supedot;"],[0,{v:"&subE;",n:824,o:"&nsubE;"}],[0,{v:"&supE;",n:824,o:"&nsupE;"}],[0,"&subsim;"],[0,"&supsim;"],[2,{v:"&subnE;",n:65024,o:"&varsubsetneqq;"}],[0,{v:"&supnE;",n:65024,o:"&varsupsetneqq;"}],[2,"&csub;"],[0,"&csup;"],[0,"&csube;"],[0,"&csupe;"],[0,"&subsup;"],[0,"&supsub;"],[0,"&subsub;"],[0,"&supsup;"],[0,"&suphsub;"],[0,"&supdsub;"],[0,"&forkv;"],[0,"&topfork;"],[0,"&mlcp;"],[8,"&Dashv;"],[1,"&Vdashl;"],[0,"&Barv;"],[0,"&vBar;"],[0,"&vBarv;"],[1,"&Vbar;"],[0,"&Not;"],[0,"&bNot;"],[0,"&rnmid;"],[0,"&cirmid;"],[0,"&midcir;"],[0,"&topcir;"],[0,"&nhpar;"],[0,"&parsim;"],[9,{v:"&parsl;",n:8421,o:"&nparsl;"}],[44343,{n:new Map(si([[56476,"&Ascr;"],[1,"&Cscr;"],[0,"&Dscr;"],[2,"&Gscr;"],[2,"&Jscr;"],[0,"&Kscr;"],[2,"&Nscr;"],[0,"&Oscr;"],[0,"&Pscr;"],[0,"&Qscr;"],[1,"&Sscr;"],[0,"&Tscr;"],[0,"&Uscr;"],[0,"&Vscr;"],[0,"&Wscr;"],[0,"&Xscr;"],[0,"&Yscr;"],[0,"&Zscr;"],[0,"&ascr;"],[0,"&bscr;"],[0,"&cscr;"],[0,"&dscr;"],[1,"&fscr;"],[1,"&hscr;"],[0,"&iscr;"],[0,"&jscr;"],[0,"&kscr;"],[0,"&lscr;"],[0,"&mscr;"],[0,"&nscr;"],[1,"&pscr;"],[0,"&qscr;"],[0,"&rscr;"],[0,"&sscr;"],[0,"&tscr;"],[0,"&uscr;"],[0,"&vscr;"],[0,"&wscr;"],[0,"&xscr;"],[0,"&yscr;"],[0,"&zscr;"],[52,"&Afr;"],[0,"&Bfr;"],[1,"&Dfr;"],[0,"&Efr;"],[0,"&Ffr;"],[0,"&Gfr;"],[2,"&Jfr;"],[0,"&Kfr;"],[0,"&Lfr;"],[0,"&Mfr;"],[0,"&Nfr;"],[0,"&Ofr;"],[0,"&Pfr;"],[0,"&Qfr;"],[1,"&Sfr;"],[0,"&Tfr;"],[0,"&Ufr;"],[0,"&Vfr;"],[0,"&Wfr;"],[0,"&Xfr;"],[0,"&Yfr;"],[1,"&afr;"],[0,"&bfr;"],[0,"&cfr;"],[0,"&dfr;"],[0,"&efr;"],[0,"&ffr;"],[0,"&gfr;"],[0,"&hfr;"],[0,"&ifr;"],[0,"&jfr;"],[0,"&kfr;"],[0,"&lfr;"],[0,"&mfr;"],[0,"&nfr;"],[0,"&ofr;"],[0,"&pfr;"],[0,"&qfr;"],[0,"&rfr;"],[0,"&sfr;"],[0,"&tfr;"],[0,"&ufr;"],[0,"&vfr;"],[0,"&wfr;"],[0,"&xfr;"],[0,"&yfr;"],[0,"&zfr;"],[0,"&Aopf;"],[0,"&Bopf;"],[1,"&Dopf;"],[0,"&Eopf;"],[0,"&Fopf;"],[0,"&Gopf;"],[1,"&Iopf;"],[0,"&Jopf;"],[0,"&Kopf;"],[0,"&Lopf;"],[0,"&Mopf;"],[1,"&Oopf;"],[3,"&Sopf;"],[0,"&Topf;"],[0,"&Uopf;"],[0,"&Vopf;"],[0,"&Wopf;"],[0,"&Xopf;"],[0,"&Yopf;"],[1,"&aopf;"],[0,"&bopf;"],[0,"&copf;"],[0,"&dopf;"],[0,"&eopf;"],[0,"&fopf;"],[0,"&gopf;"],[0,"&hopf;"],[0,"&iopf;"],[0,"&jopf;"],[0,"&kopf;"],[0,"&lopf;"],[0,"&mopf;"],[0,"&nopf;"],[0,"&oopf;"],[0,"&popf;"],[0,"&qopf;"],[0,"&ropf;"],[0,"&sopf;"],[0,"&topf;"],[0,"&uopf;"],[0,"&vopf;"],[0,"&wopf;"],[0,"&xopf;"],[0,"&yopf;"],[0,"&zopf;"]]))}],[8906,"&fflig;"],[0,"&filig;"],[0,"&fllig;"],[0,"&ffilig;"],[0,"&ffllig;"]]));var lm=new Map([[34,"&quot;"],[38,"&amp;"],[39,"&apos;"],[60,"&lt;"],[62,"&gt;"]]),um=String.prototype.codePointAt!=null?(e,t)=>e.codePointAt(t):(e,t)=>(e.charCodeAt(t)&64512)===55296?(e.charCodeAt(t)-55296)*1024+e.charCodeAt(t+1)-56320+65536:e.charCodeAt(t);function Rn(e,t){return function(o){let i,n=0,a="";for(;i=e.exec(o);)n!==i.index&&(a+=o.substring(n,i.index)),a+=t.get(i[0].charCodeAt(0)),n=i.index+1;return a+o.substring(n)}}var Fc=Rn(/[&<>'"]/g,lm),Lc=Rn(/["&\u00A0]/g,new Map([[34,"&quot;"],[38,"&amp;"],[160,"&nbsp;"]])),Dc=Rn(/[&<>\u00A0]/g,new Map([[38,"&amp;"],[60,"&lt;"],[62,"&gt;"],[160,"&nbsp;"]]));var zc;(function(e){e[e.XML=0]="XML",e[e.HTML=1]="HTML"})(zc||(zc={}));var Mc;(function(e){e[e.UTF8=0]="UTF8",e[e.ASCII=1]="ASCII",e[e.Extensive=2]="Extensive",e[e.Attribute=3]="Attribute",e[e.Text=4]="Text"})(Mc||(Mc={}));function pm(e){return Object.prototype.toString.call(e)}function li(e){return pm(e)==="[object String]"}var fm=Object.prototype.hasOwnProperty;function mm(e,t){return fm.call(e,t)}function Fr(e){return Array.prototype.slice.call(arguments,1).forEach(function(r){if(r){if(typeof r!="object")throw new TypeError(r+"must be object");Object.keys(r).forEach(function(o){e[o]=r[o]})}}),e}function On(e,t,r){return[].concat(e.slice(0,t),r,e.slice(t+1))}function ui(e){return!(e>=55296&&e<=57343||e>=64976&&e<=65007||(e&65535)===65535||(e&65535)===65534||e>=0&&e<=8||e===11||e>=14&&e<=31||e>=127&&e<=159||e>1114111)}function Lr(e){if(e>65535){e-=65536;let t=55296+(e>>10),r=56320+(e&1023);return String.fromCharCode(t,r)}return String.fromCharCode(e)}var Oc=/\\([!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])/g,hm=/&([a-z#][a-z0-9]{1,31});/gi,gm=new RegExp(Oc.source+"|"+hm.source,"gi"),bm=/^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))$/i;function vm(e,t){if(t.charCodeAt(0)===35&&bm.test(t)){let o=t[1].toLowerCase()==="x"?parseInt(t.slice(2),16):parseInt(t.slice(1),10);return ui(o)?Lr(o):e}let r=Sr(e);return r!==e?r:e}function xm(e){return e.indexOf("\\")<0?e:e.replace(Oc,"$1")}function ut(e){return e.indexOf("\\")<0&&e.indexOf("&")<0?e:e.replace(gm,function(t,r,o){return r||vm(t,o)})}var wm=/[&<>"]/,ym=/[&<>"]/g,km={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"};function Cm(e){return km[e]}function ct(e){return wm.test(e)?e.replace(ym,Cm):e}var Em=/[.?*+^$[\]\\(){}|-]/g;function Tm(e){return e.replace(Em,"\\$&")}function B(e){switch(e){case 9:case 32:return!0}return!1}function Ht(e){if(e>=8192&&e<=8202)return!0;switch(e){case 9:case 10:case 11:case 12:case 13:case 32:case 160:case 5760:case 8239:case 8287:case 12288:return!0}return!1}function Ic(e){return _r.test(e)||ii.test(e)}function Vt(e){return Ic(Lr(e))}function Wt(e){switch(e){case 33:case 34:case 35:case 36:case 37:case 38:case 39:case 40:case 41:case 42:case 43:case 44:case 45:case 46:case 47:case 58:case 59:case 60:case 61:case 62:case 63:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 124:case 125:case 126:return!0;default:return!1}}function Gt(e){return e=e.trim().replace(/\s+/g," "),"\u1E9E".toLowerCase()==="\u1E7E"&&(e=e.replace(/ẞ/g,"\xDF")),e.toLowerCase().toUpperCase()}function Pc(e){return e===32||e===9||e===10||e===13}function Yt(e){let t=0;for(;t<e.length&&Pc(e.charCodeAt(t));t++);let r=e.length-1;for(;r>=t&&Pc(e.charCodeAt(r));r--);return e.slice(t,r+1)}var Am={mdurl:ti,ucmicro:Fn};var qn={};yo(qn,{parseLinkDestination:()=>$n,parseLinkLabel:()=>Bn,parseLinkTitle:()=>Nn});function Bn(e,t,r){let o,i,n,a,s=e.posMax,l=e.pos;for(e.pos=t+1,o=1;e.pos<s;){if(n=e.src.charCodeAt(e.pos),n===93&&(o--,o===0)){i=!0;break}if(a=e.pos,e.md.inline.skipToken(e),n===91){if(a===e.pos-1)o++;else if(r)return e.pos=l,-1}}let u=-1;return i&&(u=e.pos),e.pos=l,u}function $n(e,t,r){let o,i=t,n={ok:!1,pos:0,str:""};if(e.charCodeAt(i)===60){for(i++;i<r;){if(o=e.charCodeAt(i),o===10||o===60)return n;if(o===62)return n.pos=i+1,n.str=ut(e.slice(t+1,i)),n.ok=!0,n;if(o===92&&i+1<r){i+=2;continue}i++}return n}let a=0;for(;i<r&&(o=e.charCodeAt(i),!(o===32||o<32||o===127));){if(o===92&&i+1<r){if(e.charCodeAt(i+1)===32)break;i+=2;continue}if(o===40&&(a++,a>32))return n;if(o===41){if(a===0)break;a--}i++}return t===i||a!==0||(n.str=ut(e.slice(t,i)),n.pos=i,n.ok=!0),n}function Nn(e,t,r,o){let i,n=t,a={ok:!1,can_continue:!1,pos:0,str:"",marker:0};if(o)a.str=o.str,a.marker=o.marker;else{if(n>=r)return a;let s=e.charCodeAt(n);if(s!==34&&s!==39&&s!==40)return a;t++,n++,s===40&&(s=41),a.marker=s}for(;n<r;){if(i=e.charCodeAt(n),i===a.marker)return a.pos=n+1,a.str+=ut(e.slice(t,n)),a.ok=!0,a;if(i===40&&a.marker===41)return a;i===92&&n+1<r&&n++,n++}return a.can_continue=!0,a.str+=ut(e.slice(t,n)),a}var tt={};tt.code_inline=function(e,t,r,o,i){let n=e[t];return"<code"+i.renderAttrs(n)+">"+ct(n.content)+"</code>"};tt.code_block=function(e,t,r,o,i){let n=e[t];return"<pre"+i.renderAttrs(n)+"><code>"+ct(e[t].content)+`</code></pre>
`};tt.fence=function(e,t,r,o,i){let n=e[t],a=n.info?ut(n.info).trim():"",s="",l="";if(a){let c=a.split(/(\s+)/g);s=c[0],l=c.slice(2).join("")}let u;if(r.highlight?u=r.highlight(n.content,s,l)||ct(n.content):u=ct(n.content),u.indexOf("<pre")===0)return u+`
`;if(a){let c=n.attrIndex("class"),p=n.attrs?n.attrs.slice():[];c<0?p.push(["class",r.langPrefix+s]):(p[c]=p[c].slice(),p[c][1]+=" "+r.langPrefix+s);let g={attrs:p};return`<pre><code${i.renderAttrs(g)}>${u}</code></pre>
`}return`<pre><code${i.renderAttrs(n)}>${u}</code></pre>
`};tt.image=function(e,t,r,o,i){let n=e[t];return n.attrs[n.attrIndex("alt")][1]=i.renderInlineAsText(n.children,r,o),i.renderToken(e,t,r)};tt.hardbreak=function(e,t,r){return r.xhtmlOut?`<br />
`:`<br>
`};tt.softbreak=function(e,t,r){return r.breaks?r.xhtmlOut?`<br />
`:`<br>
`:`
`};tt.text=function(e,t){return ct(e[t].content)};tt.html_block=function(e,t){return e[t].content};tt.html_inline=function(e,t){return e[t].content};function Dr(){this.rules=Fr({},tt)}Dr.prototype.renderAttrs=function(t){let r,o,i;if(!t.attrs)return"";for(i="",r=0,o=t.attrs.length;r<o;r++)i+=" "+ct(t.attrs[r][0])+'="'+ct(t.attrs[r][1])+'"';return i};Dr.prototype.renderToken=function(t,r,o){let i=t[r],n="";if(i.hidden)return"";i.block&&i.nesting!==-1&&r&&t[r-1].hidden&&(n+=`
`),n+=(i.nesting===-1?"</":"<")+i.tag,n+=this.renderAttrs(i),i.nesting===0&&o.xhtmlOut&&(n+=" /");let a=!1;if(i.block&&(a=!0,i.nesting===1&&r+1<t.length)){let s=t[r+1];(s.type==="inline"||s.hidden||s.nesting===-1&&s.tag===i.tag)&&(a=!1)}return n+=a?`>
`:">",n};Dr.prototype.renderInline=function(e,t,r){let o="",i=this.rules;for(let n=0,a=e.length;n<a;n++){let s=e[n].type;typeof i[s]<"u"?o+=i[s](e,n,t,r,this):o+=this.renderToken(e,n,t)}return o};Dr.prototype.renderInlineAsText=function(e,t,r){let o="";for(let i=0,n=e.length;i<n;i++)switch(e[i].type){case"text":o+=e[i].content;break;case"image":o+=this.renderInlineAsText(e[i].children,t,r);break;case"html_inline":case"html_block":o+=e[i].content;break;case"softbreak":case"hardbreak":o+=`
`;break;default:}return o};Dr.prototype.render=function(e,t,r){let o="",i=this.rules;for(let n=0,a=e.length;n<a;n++){let s=e[n].type;s==="inline"?o+=this.renderInline(e[n].children,t,r):typeof i[s]<"u"?o+=i[s](e,n,t,r,this):o+=this.renderToken(e,n,t,r)}return o};var Bc=Dr;function He(){this.__rules__=[],this.__cache__=null}He.prototype.__find__=function(e){for(let t=0;t<this.__rules__.length;t++)if(this.__rules__[t].name===e)return t;return-1};He.prototype.__compile__=function(){let e=this,t=[""];e.__rules__.forEach(function(r){r.enabled&&r.alt.forEach(function(o){t.indexOf(o)<0&&t.push(o)})}),e.__cache__={},t.forEach(function(r){e.__cache__[r]=[],e.__rules__.forEach(function(o){o.enabled&&(r&&o.alt.indexOf(r)<0||e.__cache__[r].push(o.fn))})})};He.prototype.at=function(e,t,r){let o=this.__find__(e),i=r||{};if(o===-1)throw new Error("Parser rule not found: "+e);this.__rules__[o].fn=t,this.__rules__[o].alt=i.alt||[],this.__cache__=null};He.prototype.before=function(e,t,r,o){let i=this.__find__(e),n=o||{};if(i===-1)throw new Error("Parser rule not found: "+e);this.__rules__.splice(i,0,{name:t,enabled:!0,fn:r,alt:n.alt||[]}),this.__cache__=null};He.prototype.after=function(e,t,r,o){let i=this.__find__(e),n=o||{};if(i===-1)throw new Error("Parser rule not found: "+e);this.__rules__.splice(i+1,0,{name:t,enabled:!0,fn:r,alt:n.alt||[]}),this.__cache__=null};He.prototype.push=function(e,t,r){let o=r||{};this.__rules__.push({name:e,enabled:!0,fn:t,alt:o.alt||[]}),this.__cache__=null};He.prototype.enable=function(e,t){Array.isArray(e)||(e=[e]);let r=[];return e.forEach(function(o){let i=this.__find__(o);if(i<0){if(t)return;throw new Error("Rules manager: invalid rule name "+o)}this.__rules__[i].enabled=!0,r.push(o)},this),this.__cache__=null,r};He.prototype.enableOnly=function(e,t){Array.isArray(e)||(e=[e]),this.__rules__.forEach(function(r){r.enabled=!1}),this.enable(e,t)};He.prototype.disable=function(e,t){Array.isArray(e)||(e=[e]);let r=[];return e.forEach(function(o){let i=this.__find__(o);if(i<0){if(t)return;throw new Error("Rules manager: invalid rule name "+o)}this.__rules__[i].enabled=!1,r.push(o)},this),this.__cache__=null,r};He.prototype.getRules=function(e){return this.__cache__===null&&this.__compile__(),this.__cache__[e]||[]};var Xt=He;function zr(e,t,r){this.type=e,this.tag=t,this.attrs=null,this.map=null,this.nesting=r,this.level=0,this.children=null,this.content="",this.markup="",this.info="",this.meta=null,this.block=!1,this.hidden=!1}zr.prototype.attrIndex=function(t){if(!this.attrs)return-1;let r=this.attrs;for(let o=0,i=r.length;o<i;o++)if(r[o][0]===t)return o;return-1};zr.prototype.attrPush=function(t){this.attrs?this.attrs.push(t):this.attrs=[t]};zr.prototype.attrSet=function(t,r){let o=this.attrIndex(t),i=[t,r];o<0?this.attrPush(i):this.attrs[o]=i};zr.prototype.attrGet=function(t){let r=this.attrIndex(t),o=null;return r>=0&&(o=this.attrs[r][1]),o};zr.prototype.attrJoin=function(t,r){let o=this.attrIndex(t);o<0?this.attrPush([t,r]):this.attrs[o][1]=this.attrs[o][1]+" "+r};var dt=zr;function $c(e,t,r){this.src=e,this.env=r,this.tokens=[],this.inlineMode=!1,this.md=t}$c.prototype.Token=dt;var Nc=$c;var _m=/\r\n?|\n/g,Sm=/\0/g;function jn(e){let t;t=e.src.replace(_m,`
`),t=t.replace(Sm,"\uFFFD"),e.src=t}function Un(e){let t;e.inlineMode?(t=new e.Token("inline","",0),t.content=e.src,t.map=[0,1],t.children=[],e.tokens.push(t)):e.md.block.parse(e.src,e.md,e.env,e.tokens)}function Hn(e){let t=e.tokens;for(let r=0,o=t.length;r<o;r++){let i=t[r];i.type==="inline"&&e.md.inline.parse(i.content,e.md,e.env,i.children)}}function Fm(e){return/^<a[>\s]/i.test(e)}function Lm(e){return/^<\/a\s*>/i.test(e)}function Vn(e){let t=e.tokens;if(e.md.options.linkify)for(let r=0,o=t.length;r<o;r++){if(t[r].type!=="inline"||!e.md.linkify.pretest(t[r].content))continue;let i=t[r].children,n=0;for(let a=i.length-1;a>=0;a--){let s=i[a];if(s.type==="link_close"){for(a--;i[a].level!==s.level&&i[a].type!=="link_open";)a--;continue}if(s.type==="html_inline"&&(Fm(s.content)&&n>0&&n--,Lm(s.content)&&n++),!(n>0)&&s.type==="text"&&e.md.linkify.test(s.content)){let l=s.content,u=e.md.linkify.match(l),c=[],p=s.level,g=0;u.length>0&&u[0].index===0&&a>0&&i[a-1].type==="text_special"&&(u=u.slice(1));for(let m=0;m<u.length;m++){let h=u[m].url,x=e.md.normalizeLink(h);if(!e.md.validateLink(x))continue;let y=u[m].text;u[m].schema?u[m].schema==="mailto:"&&!/^mailto:/i.test(y)?y=e.md.normalizeLinkText("mailto:"+y).replace(/^mailto:/,""):y=e.md.normalizeLinkText(y):y=e.md.normalizeLinkText("http://"+y).replace(/^http:\/\//,"");let S=u[m].index;if(S>g){let E=new e.Token("text","",0);E.content=l.slice(g,S),E.level=p,c.push(E)}let k=new e.Token("link_open","a",1);k.attrs=[["href",x]],k.level=p++,k.markup="linkify",k.info="auto",c.push(k);let _=new e.Token("text","",0);_.content=y,_.level=p,c.push(_);let T=new e.Token("link_close","a",-1);T.level=--p,T.markup="linkify",T.info="auto",c.push(T),g=u[m].lastIndex}if(g<l.length){let m=new e.Token("text","",0);m.content=l.slice(g),m.level=p,c.push(m)}t[r].children=i=On(i,a,c)}}}}var qc=/\+-|\.\.|\?\?\?\?|!!!!|,,|--/,Dm=/\((c|tm|r)\)/i,zm=/\((c|tm|r)\)/ig,Mm={c:"\xA9",r:"\xAE",tm:"\u2122"};function Rm(e,t){return Mm[t.toLowerCase()]}function Pm(e){let t=0;for(let r=e.length-1;r>=0;r--){let o=e[r];o.type==="text"&&!t&&(o.content=o.content.replace(zm,Rm)),o.type==="link_open"&&o.info==="auto"&&t--,o.type==="link_close"&&o.info==="auto"&&t++}}function Om(e){let t=0;for(let r=e.length-1;r>=0;r--){let o=e[r];o.type==="text"&&!t&&qc.test(o.content)&&(o.content=o.content.replace(/\+-/g,"\xB1").replace(/\.{2,}/g,"\u2026").replace(/([?!])…/g,"$1..").replace(/([?!]){4,}/g,"$1$1$1").replace(/,{2,}/g,",").replace(/(^|[^-])---(?=[^-]|$)/mg,"$1\u2014").replace(/(^|\s)--(?=\s|$)/mg,"$1\u2013").replace(/(^|[^-\s])--(?=[^-\s]|$)/mg,"$1\u2013")),o.type==="link_open"&&o.info==="auto"&&t--,o.type==="link_close"&&o.info==="auto"&&t++}}function Wn(e){let t;if(e.md.options.typographer)for(t=e.tokens.length-1;t>=0;t--)e.tokens[t].type==="inline"&&(Dm.test(e.tokens[t].content)&&Pm(e.tokens[t].children),qc.test(e.tokens[t].content)&&Om(e.tokens[t].children))}var Im=/['"]/,jc=/['"]/g,Uc="\u2019";function ci(e,t,r,o){e[t]||(e[t]=[]),e[t].push({pos:r,ch:o})}function Bm(e,t){let r="",o=0;t.sort((i,n)=>i.pos-n.pos);for(let i=0;i<t.length;i++){let n=t[i];r+=e.slice(o,n.pos)+n.ch,o=n.pos+1}return r+e.slice(o)}function $m(e,t){let r,o=[],i={};for(let n=0;n<e.length;n++){let a=e[n],s=e[n].level;for(r=o.length-1;r>=0&&!(o[r].level<=s);r--);if(o.length=r+1,a.type!=="text")continue;let l=a.content,u=0,c=l.length;e:for(;u<c;){jc.lastIndex=u;let p=jc.exec(l);if(!p)break;let g=!0,m=!0;u=p.index+1;let h=p[0]==="'",x=32;if(p.index-1>=0)x=l.charCodeAt(p.index-1);else for(r=n-1;r>=0&&!(e[r].type==="softbreak"||e[r].type==="hardbreak");r--)if(e[r].content){x=e[r].content.charCodeAt(e[r].content.length-1);break}let y=32;if(u<c)y=l.charCodeAt(u);else for(r=n+1;r<e.length&&!(e[r].type==="softbreak"||e[r].type==="hardbreak");r++)if(e[r].content){y=e[r].content.charCodeAt(0);break}let S=Wt(x)||Vt(x),k=Wt(y)||Vt(y),_=Ht(x),T=Ht(y);if(T?g=!1:k&&(_||S||(g=!1)),_?m=!1:S&&(T||k||(m=!1)),y===34&&p[0]==='"'&&x>=48&&x<=57&&(m=g=!1),g&&m&&(g=S,m=k),!g&&!m){h&&ci(i,n,p.index,Uc);continue}if(m)for(r=o.length-1;r>=0;r--){let E=o[r];if(o[r].level<s)break;if(E.single===h&&o[r].level===s){E=o[r];let A,z;h?(A=t.md.options.quotes[2],z=t.md.options.quotes[3]):(A=t.md.options.quotes[0],z=t.md.options.quotes[1]),ci(i,n,p.index,z),ci(i,E.token,E.pos,A),o.length=r;continue e}}g?o.push({token:n,pos:p.index,single:h,level:s}):m&&h&&ci(i,n,p.index,Uc)}}Object.keys(i).forEach(function(n){e[n].content=Bm(e[n].content,i[n])})}function Gn(e){if(e.md.options.typographer)for(let t=e.tokens.length-1;t>=0;t--)e.tokens[t].type!=="inline"||!Im.test(e.tokens[t].content)||$m(e.tokens[t].children,e)}function Yn(e){let t,r,o=e.tokens,i=o.length;for(let n=0;n<i;n++){if(o[n].type!=="inline")continue;let a=o[n].children,s=a.length;for(t=0;t<s;t++)a[t].type==="text_special"&&(a[t].type="text");for(t=r=0;t<s;t++)a[t].type==="text"&&t+1<s&&a[t+1].type==="text"?a[t+1].content=a[t].content+a[t+1].content:(t!==r&&(a[r]=a[t]),r++);t!==r&&(a.length=r)}}var Xn=[["normalize",jn],["block",Un],["inline",Hn],["linkify",Vn],["replacements",Wn],["smartquotes",Gn],["text_join",Yn]];function Kn(){this.ruler=new Xt;for(let e=0;e<Xn.length;e++)this.ruler.push(Xn[e][0],Xn[e][1])}Kn.prototype.process=function(e){let t=this.ruler.getRules("");for(let r=0,o=t.length;r<o;r++)t[r](e)};Kn.prototype.State=Nc;var Hc=Kn;function rt(e,t,r,o){this.src=e,this.md=t,this.env=r,this.tokens=o,this.bMarks=[],this.eMarks=[],this.tShift=[],this.sCount=[],this.bsCount=[],this.blkIndent=0,this.line=0,this.lineMax=0,this.tight=!1,this.ddIndent=-1,this.listIndent=-1,this.parentType="root",this.level=0;let i=this.src;for(let n=0,a=0,s=0,l=0,u=i.length,c=!1;a<u;a++){let p=i.charCodeAt(a);if(!c)if(B(p)){s++,p===9?l+=4-l%4:l++;continue}else c=!0;(p===10||a===u-1)&&(p!==10&&a++,this.bMarks.push(n),this.eMarks.push(a),this.tShift.push(s),this.sCount.push(l),this.bsCount.push(0),c=!1,s=0,l=0,n=a+1)}this.bMarks.push(i.length),this.eMarks.push(i.length),this.tShift.push(0),this.sCount.push(0),this.bsCount.push(0),this.lineMax=this.bMarks.length-1}rt.prototype.push=function(e,t,r){let o=new dt(e,t,r);return o.block=!0,r<0&&this.level--,o.level=this.level,r>0&&this.level++,this.tokens.push(o),o};rt.prototype.isEmpty=function(t){return this.bMarks[t]+this.tShift[t]>=this.eMarks[t]};rt.prototype.skipEmptyLines=function(t){for(let r=this.lineMax;t<r&&!(this.bMarks[t]+this.tShift[t]<this.eMarks[t]);t++);return t};rt.prototype.skipSpaces=function(t){for(let r=this.src.length;t<r;t++){let o=this.src.charCodeAt(t);if(!B(o))break}return t};rt.prototype.skipSpacesBack=function(t,r){if(t<=r)return t;for(;t>r;)if(!B(this.src.charCodeAt(--t)))return t+1;return t};rt.prototype.skipChars=function(t,r){for(let o=this.src.length;t<o&&this.src.charCodeAt(t)===r;t++);return t};rt.prototype.skipCharsBack=function(t,r,o){if(t<=o)return t;for(;t>o;)if(r!==this.src.charCodeAt(--t))return t+1;return t};rt.prototype.getLines=function(t,r,o,i){if(t>=r)return"";let n=new Array(r-t);for(let a=0,s=t;s<r;s++,a++){let l=0,u=this.bMarks[s],c=u,p;for(s+1<r||i?p=this.eMarks[s]+1:p=this.eMarks[s];c<p&&l<o;){let g=this.src.charCodeAt(c);if(B(g))g===9?l+=4-(l+this.bsCount[s])%4:l++;else if(c-u<this.tShift[s])l++;else break;c++}l>o?n[a]=new Array(l-o+1).join(" ")+this.src.slice(c,p):n[a]=this.src.slice(c,p)}return n.join("")};rt.prototype.Token=dt;var Vc=rt;var Nm=65536;function Zn(e,t){let r=e.bMarks[t]+e.tShift[t],o=e.eMarks[t];return e.src.slice(r,o)}function Wc(e){let t=[],r=e.length,o=0,i=e.charCodeAt(o),n=!1,a=0,s="";for(;o<r;)i===124&&(n?(s+=e.substring(a,o-1),a=o):(t.push(s+e.substring(a,o)),s="",a=o+1)),n=i===92,o++,i=e.charCodeAt(o);return t.push(s+e.substring(a)),t}function Jn(e,t,r,o){if(t+2>r)return!1;let i=t+1;if(e.sCount[i]<e.blkIndent||e.sCount[i]-e.blkIndent>=4)return!1;let n=e.bMarks[i]+e.tShift[i];if(n>=e.eMarks[i])return!1;let a=e.src.charCodeAt(n++);if(a!==124&&a!==45&&a!==58||n>=e.eMarks[i])return!1;let s=e.src.charCodeAt(n++);if(s!==124&&s!==45&&s!==58&&!B(s)||a===45&&B(s))return!1;for(;n<e.eMarks[i];){let T=e.src.charCodeAt(n);if(T!==124&&T!==45&&T!==58&&!B(T))return!1;n++}let l=Zn(e,t+1),u=l.split("|"),c=[];for(let T=0;T<u.length;T++){let E=u[T].trim();if(!E){if(T===0||T===u.length-1)continue;return!1}if(!/^:?-+:?$/.test(E))return!1;E.charCodeAt(E.length-1)===58?c.push(E.charCodeAt(0)===58?"center":"right"):E.charCodeAt(0)===58?c.push("left"):c.push("")}if(l=Zn(e,t).trim(),l.indexOf("|")===-1||e.sCount[t]-e.blkIndent>=4)return!1;u=Wc(l),u.length&&u[0]===""&&u.shift(),u.length&&u[u.length-1]===""&&u.pop();let p=u.length;if(p===0||p!==c.length)return!1;if(o)return!0;let g=e.parentType;e.parentType="table";let m=e.md.block.ruler.getRules("blockquote"),h=e.push("table_open","table",1),x=[t,0];h.map=x;let y=e.push("thead_open","thead",1);y.map=[t,t+1];let S=e.push("tr_open","tr",1);S.map=[t,t+1];for(let T=0;T<u.length;T++){let E=e.push("th_open","th",1);c[T]&&(E.attrs=[["style","text-align:"+c[T]]]);let A=e.push("inline","",0);A.content=u[T].trim(),A.children=[],e.push("th_close","th",-1)}e.push("tr_close","tr",-1),e.push("thead_close","thead",-1);let k,_=0;for(i=t+2;i<r&&!(e.sCount[i]<e.blkIndent);i++){let T=!1;for(let A=0,z=m.length;A<z;A++)if(m[A](e,i,r,!0)){T=!0;break}if(T||(l=Zn(e,i).trim(),!l)||e.sCount[i]-e.blkIndent>=4||(u=Wc(l),u.length&&u[0]===""&&u.shift(),u.length&&u[u.length-1]===""&&u.pop(),_+=p-u.length,_>Nm))break;if(i===t+2){let A=e.push("tbody_open","tbody",1);A.map=k=[t+2,0]}let E=e.push("tr_open","tr",1);E.map=[i,i+1];for(let A=0;A<p;A++){let z=e.push("td_open","td",1);c[A]&&(z.attrs=[["style","text-align:"+c[A]]]);let O=e.push("inline","",0);O.content=u[A]?u[A].trim():"",O.children=[],e.push("td_close","td",-1)}e.push("tr_close","tr",-1)}return k&&(e.push("tbody_close","tbody",-1),k[1]=i),e.push("table_close","table",-1),x[1]=i,e.parentType=g,e.line=i,!0}function Qn(e,t,r){if(e.sCount[t]-e.blkIndent<4)return!1;let o=t+1,i=o;for(;o<r;){if(e.isEmpty(o)){o++;continue}if(e.sCount[o]-e.blkIndent>=4){o++,i=o;continue}break}e.line=i;let n=e.push("code_block","code",0);return n.content=e.getLines(t,i,4+e.blkIndent,!1)+`
`,n.map=[t,e.line],!0}function ea(e,t,r,o){let i=e.bMarks[t]+e.tShift[t],n=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4||i+3>n)return!1;let a=e.src.charCodeAt(i);if(a!==126&&a!==96)return!1;let s=i;i=e.skipChars(i,a);let l=i-s;if(l<3)return!1;let u=e.src.slice(s,i),c=e.src.slice(i,n);if(a===96&&c.indexOf(String.fromCharCode(a))>=0)return!1;if(o)return!0;let p=t,g=!1;for(;p++,!(p>=r||(i=s=e.bMarks[p]+e.tShift[p],n=e.eMarks[p],i<n&&e.sCount[p]<e.blkIndent));)if(e.src.charCodeAt(i)===a&&!(e.sCount[p]-e.blkIndent>=4)&&(i=e.skipChars(i,a),!(i-s<l)&&(i=e.skipSpaces(i),!(i<n)))){g=!0;break}l=e.sCount[t],e.line=p+(g?1:0);let m=e.push("fence","code",0);return m.info=c,m.content=e.getLines(t+1,p,l,!0),m.markup=u,m.map=[t,e.line],!0}function ta(e,t,r,o){let i=e.bMarks[t]+e.tShift[t],n=e.eMarks[t],a=e.lineMax;if(e.sCount[t]-e.blkIndent>=4||e.src.charCodeAt(i)!==62)return!1;if(o)return!0;let s=[],l=[],u=[],c=[],p=e.md.block.ruler.getRules("blockquote"),g=e.parentType;e.parentType="blockquote";let m=!1,h;for(h=t;h<r;h++){let _=e.sCount[h]<e.blkIndent;if(i=e.bMarks[h]+e.tShift[h],n=e.eMarks[h],i>=n)break;if(e.src.charCodeAt(i++)===62&&!_){let E=e.sCount[h]+1,A,z;e.src.charCodeAt(i)===32?(i++,E++,z=!1,A=!0):e.src.charCodeAt(i)===9?(A=!0,(e.bsCount[h]+E)%4===3?(i++,E++,z=!1):z=!0):A=!1;let O=E;for(s.push(e.bMarks[h]),e.bMarks[h]=i;i<n;){let H=e.src.charCodeAt(i);if(B(H))H===9?O+=4-(O+e.bsCount[h]+(z?1:0))%4:O++;else break;i++}m=i>=n,l.push(e.bsCount[h]),e.bsCount[h]=e.sCount[h]+1+(A?1:0),u.push(e.sCount[h]),e.sCount[h]=O-E,c.push(e.tShift[h]),e.tShift[h]=i-e.bMarks[h];continue}if(m)break;let T=!1;for(let E=0,A=p.length;E<A;E++)if(p[E](e,h,r,!0)){T=!0;break}if(T){e.lineMax=h,e.blkIndent!==0&&(s.push(e.bMarks[h]),l.push(e.bsCount[h]),c.push(e.tShift[h]),u.push(e.sCount[h]),e.sCount[h]-=e.blkIndent);break}s.push(e.bMarks[h]),l.push(e.bsCount[h]),c.push(e.tShift[h]),u.push(e.sCount[h]),e.sCount[h]=-1}let x=e.blkIndent;e.blkIndent=0;let y=e.push("blockquote_open","blockquote",1);y.markup=">";let S=[t,0];y.map=S,e.md.block.tokenize(e,t,h);let k=e.push("blockquote_close","blockquote",-1);k.markup=">",e.lineMax=a,e.parentType=g,S[1]=e.line;for(let _=0;_<c.length;_++)e.bMarks[_+t]=s[_],e.tShift[_+t]=c[_],e.sCount[_+t]=u[_],e.bsCount[_+t]=l[_];return e.blkIndent=x,!0}function ra(e,t,r,o){let i=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4)return!1;let n=e.bMarks[t]+e.tShift[t],a=e.src.charCodeAt(n++);if(a!==42&&a!==45&&a!==95)return!1;let s=1;for(;n<i;){let u=e.src.charCodeAt(n++);if(u!==a&&!B(u))return!1;u===a&&s++}if(s<3)return!1;if(o)return!0;e.line=t+1;let l=e.push("hr","hr",0);return l.map=[t,e.line],l.markup=Array(s+1).join(String.fromCharCode(a)),!0}function Gc(e,t){let r=e.eMarks[t],o=e.bMarks[t]+e.tShift[t],i=e.src.charCodeAt(o++);if(i!==42&&i!==45&&i!==43)return-1;if(o<r){let n=e.src.charCodeAt(o);if(!B(n))return-1}return o}function Yc(e,t){let r=e.bMarks[t]+e.tShift[t],o=e.eMarks[t],i=r;if(i+1>=o)return-1;let n=e.src.charCodeAt(i++);if(n<48||n>57)return-1;for(;;){if(i>=o)return-1;if(n=e.src.charCodeAt(i++),n>=48&&n<=57){if(i-r>=10)return-1;continue}if(n===41||n===46)break;return-1}return i<o&&(n=e.src.charCodeAt(i),!B(n))?-1:i}function qm(e,t){let r=e.level+2;for(let o=t+2,i=e.tokens.length-2;o<i;o++)e.tokens[o].level===r&&e.tokens[o].type==="paragraph_open"&&(e.tokens[o+2].hidden=!0,e.tokens[o].hidden=!0,o+=2)}function oa(e,t,r,o){let i,n,a,s,l=t,u=!0;if(e.sCount[l]-e.blkIndent>=4||e.listIndent>=0&&e.sCount[l]-e.listIndent>=4&&e.sCount[l]<e.blkIndent)return!1;let c=!1;o&&e.parentType==="paragraph"&&e.sCount[l]>=e.blkIndent&&(c=!0);let p,g,m;if((m=Yc(e,l))>=0){if(p=!0,a=e.bMarks[l]+e.tShift[l],g=Number(e.src.slice(a,m-1)),c&&g!==1)return!1}else if((m=Gc(e,l))>=0)p=!1;else return!1;if(c&&e.skipSpaces(m)>=e.eMarks[l])return!1;if(o)return!0;let h=e.src.charCodeAt(m-1),x=e.tokens.length;p?(s=e.push("ordered_list_open","ol",1),g!==1&&(s.attrs=[["start",g]])):s=e.push("bullet_list_open","ul",1);let y=[l,0];s.map=y,s.markup=String.fromCharCode(h);let S=!1,k=e.md.block.ruler.getRules("list"),_=e.parentType;for(e.parentType="list";l<r;){n=m,i=e.eMarks[l];let T=e.sCount[l]+m-(e.bMarks[l]+e.tShift[l]),E=T;for(;n<i;){let ne=e.src.charCodeAt(n);if(ne===9)E+=4-(E+e.bsCount[l])%4;else if(ne===32)E++;else break;n++}let A=n,z;A>=i?z=1:z=E-T,z>4&&(z=1);let O=T+z;s=e.push("list_item_open","li",1),s.markup=String.fromCharCode(h);let H=[l,0];s.map=H,p&&(s.info=e.src.slice(a,m-1));let V=e.tight,ve=e.tShift[l],ie=e.sCount[l],ze=e.listIndent;if(e.listIndent=e.blkIndent,e.blkIndent=O,e.tight=!0,e.tShift[l]=A-e.bMarks[l],e.sCount[l]=E,A>=i&&e.isEmpty(l+1)?e.line=Math.min(e.line+2,r):e.md.block.tokenize(e,l,r,!0),(!e.tight||S)&&(u=!1),S=e.line-l>1&&e.isEmpty(e.line-1),e.blkIndent=e.listIndent,e.listIndent=ze,e.tShift[l]=ve,e.sCount[l]=ie,e.tight=V,s=e.push("list_item_close","li",-1),s.markup=String.fromCharCode(h),l=e.line,H[1]=l,l>=r||e.sCount[l]<e.blkIndent||e.sCount[l]-e.blkIndent>=4)break;let te=!1;for(let ne=0,xe=k.length;ne<xe;ne++)if(k[ne](e,l,r,!0)){te=!0;break}if(te)break;if(p){if(m=Yc(e,l),m<0)break;a=e.bMarks[l]+e.tShift[l]}else if(m=Gc(e,l),m<0)break;if(h!==e.src.charCodeAt(m-1))break}return p?s=e.push("ordered_list_close","ol",-1):s=e.push("bullet_list_close","ul",-1),s.markup=String.fromCharCode(h),y[1]=l,e.line=l,e.parentType=_,u&&qm(e,x),!0}function ia(e,t,r,o){let i=e.bMarks[t]+e.tShift[t],n=e.eMarks[t],a=t+1;if(e.sCount[t]-e.blkIndent>=4||e.src.charCodeAt(i)!==91)return!1;function s(k){let _=e.lineMax;if(k>=_||e.isEmpty(k))return null;let T=!1;if(e.sCount[k]-e.blkIndent>3&&(T=!0),e.sCount[k]<0&&(T=!0),!T){let z=e.md.block.ruler.getRules("reference"),O=e.parentType;e.parentType="reference";let H=!1;for(let V=0,ve=z.length;V<ve;V++)if(z[V](e,k,_,!0)){H=!0;break}if(e.parentType=O,H)return null}let E=e.bMarks[k]+e.tShift[k],A=e.eMarks[k];return e.src.slice(E,A+1)}let l=e.src.slice(i,n+1);n=l.length;let u=-1;for(i=1;i<n;i++){let k=l.charCodeAt(i);if(k===91)return!1;if(k===93){u=i;break}else if(k===10){let _=s(a);_!==null&&(l+=_,n=l.length,a++)}else if(k===92&&(i++,i<n&&l.charCodeAt(i)===10)){let _=s(a);_!==null&&(l+=_,n=l.length,a++)}}if(u<0||l.charCodeAt(u+1)!==58)return!1;for(i=u+2;i<n;i++){let k=l.charCodeAt(i);if(k===10){let _=s(a);_!==null&&(l+=_,n=l.length,a++)}else if(!B(k))break}let c=e.md.helpers.parseLinkDestination(l,i,n);if(!c.ok)return!1;let p=e.md.normalizeLink(c.str);if(!e.md.validateLink(p))return!1;i=c.pos;let g=i,m=a,h=i;for(;i<n;i++){let k=l.charCodeAt(i);if(k===10){let _=s(a);_!==null&&(l+=_,n=l.length,a++)}else if(!B(k))break}let x=e.md.helpers.parseLinkTitle(l,i,n);for(;x.can_continue;){let k=s(a);if(k===null)break;l+=k,i=n,n=l.length,a++,x=e.md.helpers.parseLinkTitle(l,i,n,x)}let y;for(i<n&&h!==i&&x.ok?(y=x.str,i=x.pos):(y="",i=g,a=m);i<n;){let k=l.charCodeAt(i);if(!B(k))break;i++}if(i<n&&l.charCodeAt(i)!==10&&y)for(y="",i=g,a=m;i<n;){let k=l.charCodeAt(i);if(!B(k))break;i++}if(i<n&&l.charCodeAt(i)!==10)return!1;let S=Gt(l.slice(1,u));return S?(o||(typeof e.env.references>"u"&&(e.env.references={}),typeof e.env.references[S]>"u"&&(e.env.references[S]={title:y,href:p}),e.line=a),!0):!1}var Xc=["address","article","aside","base","basefont","blockquote","body","caption","center","col","colgroup","dd","details","dialog","dir","div","dl","dt","fieldset","figcaption","figure","footer","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","header","hr","html","iframe","legend","li","link","main","menu","menuitem","nav","noframes","ol","optgroup","option","p","param","search","section","summary","table","tbody","td","tfoot","th","thead","title","tr","track","ul"];var jm="[a-zA-Z_:][a-zA-Z0-9:._-]*",Um="[^\"'=<>`\\x00-\\x20]+",Hm="'[^']*'",Vm='"[^"]*"',Wm="(?:"+Um+"|"+Hm+"|"+Vm+")",Gm="(?:\\s+"+jm+"(?:\\s*=\\s*"+Wm+")?)",Kc="<[A-Za-z][A-Za-z0-9\\-]*"+Gm+"*\\s*\\/?>",Zc="<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>",Ym="<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->",Xm="<[?][\\s\\S]*?[?]>",Km="<![A-Za-z][^>]*>",Zm="<!\\[CDATA\\[[\\s\\S]*?\\]\\]>",Jc=new RegExp("^(?:"+Kc+"|"+Zc+"|"+Ym+"|"+Xm+"|"+Km+"|"+Zm+")"),Qc=new RegExp("^(?:"+Kc+"|"+Zc+")");var Kt=[[/^<(script|pre|style|textarea)(?=(\s|>|$))/i,/<\/(script|pre|style|textarea)>/i,!0],[/^<!--/,/-->/,!0],[/^<\?/,/\?>/,!0],[/^<![A-Z]/,/>/,!0],[/^<!\[CDATA\[/,/\]\]>/,!0],[new RegExp("^</?("+Xc.join("|")+")(?=(\\s|/?>|$))","i"),/^$/,!0],[new RegExp(Qc.source+"\\s*$"),/^$/,!1]];function na(e,t,r,o){let i=e.bMarks[t]+e.tShift[t],n=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4||!e.md.options.html||e.src.charCodeAt(i)!==60)return!1;let a=e.src.slice(i,n),s=0;for(;s<Kt.length&&!Kt[s][0].test(a);s++);if(s===Kt.length)return!1;if(o)return Kt[s][2];let l=t+1,u=Kt[s][1].test("");if(!Kt[s][1].test(a)){for(;l<r&&!(e.sCount[l]<e.blkIndent&&(u||!e.isEmpty(l)));l++)if(i=e.bMarks[l]+e.tShift[l],n=e.eMarks[l],a=e.src.slice(i,n),Kt[s][1].test(a)){a.length!==0&&l++;break}}e.line=l;let c=e.push("html_block","",0);return c.map=[t,l],c.content=e.getLines(t,l,e.blkIndent,!0),!0}function aa(e,t,r,o){let i=e.bMarks[t]+e.tShift[t],n=e.eMarks[t];if(e.sCount[t]-e.blkIndent>=4)return!1;let a=e.src.charCodeAt(i);if(a!==35||i>=n)return!1;let s=1;for(a=e.src.charCodeAt(++i);a===35&&i<n&&s<=6;)s++,a=e.src.charCodeAt(++i);if(s>6||i<n&&!B(a))return!1;if(o)return!0;n=e.skipSpacesBack(n,i);let l=e.skipCharsBack(n,35,i);l>i&&B(e.src.charCodeAt(l-1))&&(n=l),e.line=t+1;let u=e.push("heading_open","h"+String(s),1);u.markup="########".slice(0,s),u.map=[t,e.line];let c=e.push("inline","",0);c.content=Yt(e.src.slice(i,n)),c.map=[t,e.line],c.children=[];let p=e.push("heading_close","h"+String(s),-1);return p.markup="########".slice(0,s),!0}function sa(e,t,r){let o=e.md.block.ruler.getRules("paragraph");if(e.sCount[t]-e.blkIndent>=4)return!1;let i=e.parentType;e.parentType="paragraph";let n=0,a,s=t+1;for(;s<r&&!e.isEmpty(s);s++){if(e.sCount[s]-e.blkIndent>3)continue;if(e.sCount[s]>=e.blkIndent){let m=e.bMarks[s]+e.tShift[s],h=e.eMarks[s];if(m<h&&(a=e.src.charCodeAt(m),(a===45||a===61)&&(m=e.skipChars(m,a),m=e.skipSpaces(m),m>=h))){n=a===61?1:2;break}}if(e.sCount[s]<0)continue;let g=!1;for(let m=0,h=o.length;m<h;m++)if(o[m](e,s,r,!0)){g=!0;break}if(g)break}if(!n)return e.parentType=i,!1;let l=Yt(e.getLines(t,s,e.blkIndent,!1));e.line=s+1;let u=e.push("heading_open","h"+String(n),1);u.markup=String.fromCharCode(a),u.map=[t,e.line];let c=e.push("inline","",0);c.content=l,c.map=[t,e.line-1],c.children=[];let p=e.push("heading_close","h"+String(n),-1);return p.markup=String.fromCharCode(a),e.parentType=i,!0}function la(e,t,r){let o=e.md.block.ruler.getRules("paragraph"),i=e.parentType,n=t+1;for(e.parentType="paragraph";n<r&&!e.isEmpty(n);n++){if(e.sCount[n]-e.blkIndent>3||e.sCount[n]<0)continue;let u=!1;for(let c=0,p=o.length;c<p;c++)if(o[c](e,n,r,!0)){u=!0;break}if(u)break}let a=Yt(e.getLines(t,n,e.blkIndent,!1));e.line=n;let s=e.push("paragraph_open","p",1);s.map=[t,e.line];let l=e.push("inline","",0);return l.content=a,l.map=[t,e.line],l.children=[],e.push("paragraph_close","p",-1),e.parentType=i,!0}var di=[["table",Jn,["paragraph","reference"]],["code",Qn],["fence",ea,["paragraph","reference","blockquote","list"]],["blockquote",ta,["paragraph","reference","blockquote","list"]],["hr",ra,["paragraph","reference","blockquote","list"]],["list",oa,["paragraph","reference","blockquote"]],["reference",ia],["html_block",na,["paragraph","reference","blockquote"]],["heading",aa,["paragraph","reference","blockquote"]],["lheading",sa],["paragraph",la]];function pi(){this.ruler=new Xt;for(let e=0;e<di.length;e++)this.ruler.push(di[e][0],di[e][1],{alt:(di[e][2]||[]).slice()})}pi.prototype.tokenize=function(e,t,r){let o=this.ruler.getRules(""),i=o.length,n=e.md.options.maxNesting,a=t,s=!1;for(;a<r&&(e.line=a=e.skipEmptyLines(a),!(a>=r||e.sCount[a]<e.blkIndent));){if(e.level>=n){e.line=r;break}let l=e.line,u=!1;for(let c=0;c<i;c++)if(u=o[c](e,a,r,!1),u){if(l>=e.line)throw new Error("block rule didn't increment state.line");break}if(!u)throw new Error("none of the block rules matched");e.tight=!s,e.isEmpty(e.line-1)&&(s=!0),a=e.line,a<r&&e.isEmpty(a)&&(s=!0,a++,e.line=a)}};pi.prototype.parse=function(e,t,r,o){if(!e)return;let i=new this.State(e,t,r,o);this.tokenize(i,i.line,i.lineMax)};pi.prototype.State=Vc;var ed=pi;function lo(e,t,r,o){this.src=e,this.env=r,this.md=t,this.tokens=o,this.tokens_meta=Array(o.length),this.pos=0,this.posMax=this.src.length,this.level=0,this.pending="",this.pendingLevel=0,this.cache={},this.delimiters=[],this._prev_delimiters=[],this.backticks={},this.backticksScanned=!1,this.linkLevel=0}lo.prototype.pushPending=function(){let e=new dt("text","",0);return e.content=this.pending,e.level=this.pendingLevel,this.tokens.push(e),this.pending="",e};lo.prototype.push=function(e,t,r){this.pending&&this.pushPending();let o=new dt(e,t,r),i=null;return r<0&&(this.level--,this.delimiters=this._prev_delimiters.pop()),o.level=this.level,r>0&&(this.level++,this._prev_delimiters.push(this.delimiters),this.delimiters=[],i={delimiters:this.delimiters}),this.pendingLevel=this.level,this.tokens.push(o),this.tokens_meta.push(i),o};lo.prototype.scanDelims=function(e,t){let r=this.posMax,o=this.src.charCodeAt(e),i;if(e===0)i=32;else if(e===1)i=this.src.charCodeAt(0),(i&63488)===55296&&(i=65533);else if(i=this.src.charCodeAt(e-1),(i&64512)===56320){let y=this.src.charCodeAt(e-2);i=(y&64512)===55296?65536+(y-55296<<10)+(i-56320):65533}else(i&64512)===55296&&(i=65533);let n=e;for(;n<r&&this.src.charCodeAt(n)===o;)n++;let a=n-e,s=n<r?this.src.charCodeAt(n):32;if((s&64512)===55296){let y=this.src.charCodeAt(n+1);s=(y&64512)===56320?65536+(s-55296<<10)+(y-56320):65533}else(s&64512)===56320&&(s=65533);let l=Wt(i)||Vt(i),u=Wt(s)||Vt(s),c=Ht(i),p=Ht(s),g=!p&&(!u||c||l),m=!c&&(!l||p||u);return{can_open:g&&(t||!m||l),can_close:m&&(t||!g||u),length:a}};lo.prototype.Token=dt;var td=lo;function Jm(e){switch(e){case 10:case 33:case 35:case 36:case 37:case 38:case 42:case 43:case 45:case 58:case 60:case 61:case 62:case 64:case 91:case 92:case 93:case 94:case 95:case 96:case 123:case 125:case 126:return!0;default:return!1}}function ua(e,t){let r=e.pos;for(;r<e.posMax&&!Jm(e.src.charCodeAt(r));)r++;return r===e.pos?!1:(t||(e.pending+=e.src.slice(e.pos,r)),e.pos=r,!0)}var Qm=/(?:^|[^a-z0-9.+-])([a-z][a-z0-9.+-]*)$/i;function ca(e,t){if(!e.md.options.linkify||e.linkLevel>0)return!1;let r=e.pos,o=e.posMax;if(r+3>o||e.src.charCodeAt(r)!==58||e.src.charCodeAt(r+1)!==47||e.src.charCodeAt(r+2)!==47)return!1;let i=e.pending.match(Qm);if(!i)return!1;let n=i[1],a=e.md.linkify.matchAtStart(e.src.slice(r-n.length));if(!a)return!1;let s=a.url;if(s.length<=n.length)return!1;let l=s.length;for(;l>0&&s.charCodeAt(l-1)===42;)l--;l!==s.length&&(s=s.slice(0,l));let u=e.md.normalizeLink(s);if(!e.md.validateLink(u))return!1;if(!t){e.pending=e.pending.slice(0,-n.length);let c=e.push("link_open","a",1);c.attrs=[["href",u]],c.markup="linkify",c.info="auto";let p=e.push("text","",0);p.content=e.md.normalizeLinkText(s);let g=e.push("link_close","a",-1);g.markup="linkify",g.info="auto"}return e.pos+=s.length-n.length,!0}function da(e,t){let r=e.pos;if(e.src.charCodeAt(r)!==10)return!1;let o=e.pending.length-1,i=e.posMax;if(!t)if(o>=0&&e.pending.charCodeAt(o)===32)if(o>=1&&e.pending.charCodeAt(o-1)===32){let n=o-1;for(;n>=1&&e.pending.charCodeAt(n-1)===32;)n--;e.pending=e.pending.slice(0,n),e.push("hardbreak","br",0)}else e.pending=e.pending.slice(0,-1),e.push("softbreak","br",0);else e.push("softbreak","br",0);for(r++;r<i&&B(e.src.charCodeAt(r));)r++;return e.pos=r,!0}var pa=[];for(let e=0;e<256;e++)pa.push(0);"\\!\"#$%&'()*+,./:;<=>?@[]^_`{|}~-".split("").forEach(function(e){pa[e.charCodeAt(0)]=1});function fa(e,t){let r=e.pos,o=e.posMax;if(e.src.charCodeAt(r)!==92||(r++,r>=o))return!1;let i=e.src.charCodeAt(r);if(i===10){for(t||e.push("hardbreak","br",0),r++;r<o&&(i=e.src.charCodeAt(r),!!B(i));)r++;return e.pos=r,!0}if(i===32){if(!t){let s=e.push("text_special","",0);s.content="\\",s.markup="\\",s.info="escape"}return e.pos=r,!0}let n=e.src[r];if(i>=55296&&i<=56319&&r+1<o){let s=e.src.charCodeAt(r+1);s>=56320&&s<=57343&&(n+=e.src[r+1],r++)}let a="\\"+n;if(!t){let s=e.push("text_special","",0);i<256&&pa[i]!==0?s.content=n:s.content=a,s.markup=a,s.info="escape"}return e.pos=r+1,!0}function ma(e,t){let r=e.pos;if(e.src.charCodeAt(r)!==96)return!1;let i=r;r++;let n=e.posMax;for(;r<n&&e.src.charCodeAt(r)===96;)r++;let a=e.src.slice(i,r),s=a.length;if(e.backticksScanned&&(e.backticks[s]||0)<=i)return t||(e.pending+=a),e.pos+=s,!0;let l=r,u;for(;(u=e.src.indexOf("`",l))!==-1;){for(l=u+1;l<n&&e.src.charCodeAt(l)===96;)l++;let c=l-u;if(c===s){if(!t){let p=e.push("code_inline","code",0);p.markup=a,p.content=e.src.slice(r,u).replace(/\n/g," ").replace(/^ (.+) $/,"$1")}return e.pos=l,!0}e.backticks[c]=u}return e.backticksScanned=!0,t||(e.pending+=a),e.pos+=s,!0}function eh(e,t){let r=e.pos,o=e.src.charCodeAt(r);if(t||o!==126)return!1;let i=e.scanDelims(e.pos,!0),n=i.length,a=String.fromCharCode(o);if(n<2)return!1;let s;n%2&&(s=e.push("text","",0),s.content=a,n--);for(let l=0;l<n;l+=2)s=e.push("text","",0),s.content=a+a,e.delimiters.push({marker:o,length:0,token:e.tokens.length-1,end:-1,open:i.can_open,close:i.can_close});return e.pos+=i.length,!0}function rd(e,t){let r,o=[],i=t.length;for(let n=0;n<i;n++){let a=t[n];if(a.marker!==126||a.end===-1)continue;let s=t[a.end];r=e.tokens[a.token],r.type="s_open",r.tag="s",r.nesting=1,r.markup="~~",r.content="",r=e.tokens[s.token],r.type="s_close",r.tag="s",r.nesting=-1,r.markup="~~",r.content="",e.tokens[s.token-1].type==="text"&&e.tokens[s.token-1].content==="~"&&o.push(s.token-1)}for(;o.length;){let n=o.pop(),a=n+1;for(;a<e.tokens.length&&e.tokens[a].type==="s_close";)a++;a--,n!==a&&(r=e.tokens[a],e.tokens[a]=e.tokens[n],e.tokens[n]=r)}}function th(e){let t=e.tokens_meta,r=e.tokens_meta.length;rd(e,e.delimiters);for(let o=0;o<r;o++)t[o]&&t[o].delimiters&&rd(e,t[o].delimiters)}var ha={tokenize:eh,postProcess:th};function rh(e,t){let r=e.pos,o=e.src.charCodeAt(r);if(t||o!==95&&o!==42)return!1;let i=e.scanDelims(e.pos,o===42);for(let n=0;n<i.length;n++){let a=e.push("text","",0);a.content=String.fromCharCode(o),e.delimiters.push({marker:o,length:i.length,token:e.tokens.length-1,end:-1,open:i.can_open,close:i.can_close})}return e.pos+=i.length,!0}function od(e,t){let r=t.length;for(let o=r-1;o>=0;o--){let i=t[o];if(i.marker!==95&&i.marker!==42||i.end===-1)continue;let n=t[i.end],a=o>0&&t[o-1].end===i.end+1&&t[o-1].marker===i.marker&&t[o-1].token===i.token-1&&t[i.end+1].token===n.token+1,s=String.fromCharCode(i.marker),l=e.tokens[i.token];l.type=a?"strong_open":"em_open",l.tag=a?"strong":"em",l.nesting=1,l.markup=a?s+s:s,l.content="";let u=e.tokens[n.token];u.type=a?"strong_close":"em_close",u.tag=a?"strong":"em",u.nesting=-1,u.markup=a?s+s:s,u.content="",a&&(e.tokens[t[o-1].token].content="",e.tokens[t[i.end+1].token].content="",o--)}}function oh(e){let t=e.tokens_meta,r=e.tokens_meta.length;od(e,e.delimiters);for(let o=0;o<r;o++)t[o]&&t[o].delimiters&&od(e,t[o].delimiters)}var ga={tokenize:rh,postProcess:oh};function ba(e,t){let r,o,i,n,a="",s="",l=e.pos,u=!0;if(e.src.charCodeAt(e.pos)!==91)return!1;let c=e.pos,p=e.posMax,g=e.pos+1,m=e.md.helpers.parseLinkLabel(e,e.pos,!0);if(m<0)return!1;let h=m+1;if(h<p&&e.src.charCodeAt(h)===40){for(u=!1,h++;h<p&&(r=e.src.charCodeAt(h),!(!B(r)&&r!==10));h++);if(h>=p)return!1;if(l=h,i=e.md.helpers.parseLinkDestination(e.src,h,e.posMax),i.ok){for(a=e.md.normalizeLink(i.str),e.md.validateLink(a)?h=i.pos:a="",l=h;h<p&&(r=e.src.charCodeAt(h),!(!B(r)&&r!==10));h++);if(i=e.md.helpers.parseLinkTitle(e.src,h,e.posMax),h<p&&l!==h&&i.ok)for(s=i.str,h=i.pos;h<p&&(r=e.src.charCodeAt(h),!(!B(r)&&r!==10));h++);}(h>=p||e.src.charCodeAt(h)!==41)&&(u=!0),h++}if(u){if(typeof e.env.references>"u")return!1;if(h<p&&e.src.charCodeAt(h)===91?(l=h+1,h=e.md.helpers.parseLinkLabel(e,h),h>=0?o=e.src.slice(l,h++):h=m+1):h=m+1,o||(o=e.src.slice(g,m)),n=e.env.references[Gt(o)],!n)return e.pos=c,!1;a=n.href,s=n.title}if(!t){e.pos=g,e.posMax=m;let x=e.push("link_open","a",1),y=[["href",a]];x.attrs=y,s&&y.push(["title",s]),e.linkLevel++,e.md.inline.tokenize(e),e.linkLevel--,e.push("link_close","a",-1)}return e.pos=h,e.posMax=p,!0}function va(e,t){let r,o,i,n,a,s,l,u,c="",p=e.pos,g=e.posMax;if(e.src.charCodeAt(e.pos)!==33||e.src.charCodeAt(e.pos+1)!==91)return!1;let m=e.pos+2,h=e.md.helpers.parseLinkLabel(e,e.pos+1,!1);if(h<0)return!1;if(n=h+1,n<g&&e.src.charCodeAt(n)===40){for(n++;n<g&&(r=e.src.charCodeAt(n),!(!B(r)&&r!==10));n++);if(n>=g)return!1;for(u=n,s=e.md.helpers.parseLinkDestination(e.src,n,e.posMax),s.ok&&(c=e.md.normalizeLink(s.str),e.md.validateLink(c)?n=s.pos:c=""),u=n;n<g&&(r=e.src.charCodeAt(n),!(!B(r)&&r!==10));n++);if(s=e.md.helpers.parseLinkTitle(e.src,n,e.posMax),n<g&&u!==n&&s.ok)for(l=s.str,n=s.pos;n<g&&(r=e.src.charCodeAt(n),!(!B(r)&&r!==10));n++);else l="";if(n>=g||e.src.charCodeAt(n)!==41)return e.pos=p,!1;n++}else{if(typeof e.env.references>"u")return!1;if(n<g&&e.src.charCodeAt(n)===91?(u=n+1,n=e.md.helpers.parseLinkLabel(e,n),n>=0?i=e.src.slice(u,n++):n=h+1):n=h+1,i||(i=e.src.slice(m,h)),a=e.env.references[Gt(i)],!a)return e.pos=p,!1;c=a.href,l=a.title}if(!t){o=e.src.slice(m,h);let x=[];e.md.inline.parse(o,e.md,e.env,x);let y=e.push("image","img",0),S=[["src",c],["alt",""]];y.attrs=S,y.children=x,y.content=o,l&&S.push(["title",l])}return e.pos=n,e.posMax=g,!0}var ih=/^([a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)$/,nh=/^([a-zA-Z][a-zA-Z0-9+.-]{1,31}):([^<>\x00-\x20]*)$/;function xa(e,t){let r=e.pos;if(e.src.charCodeAt(r)!==60)return!1;let o=e.pos,i=e.posMax;for(;;){if(++r>=i)return!1;let a=e.src.charCodeAt(r);if(a===60)return!1;if(a===62)break}let n=e.src.slice(o+1,r);if(nh.test(n)){let a=e.md.normalizeLink(n);if(!e.md.validateLink(a))return!1;if(!t){let s=e.push("link_open","a",1);s.attrs=[["href",a]],s.markup="autolink",s.info="auto";let l=e.push("text","",0);l.content=e.md.normalizeLinkText(n);let u=e.push("link_close","a",-1);u.markup="autolink",u.info="auto"}return e.pos+=n.length+2,!0}if(ih.test(n)){let a=e.md.normalizeLink("mailto:"+n);if(!e.md.validateLink(a))return!1;if(!t){let s=e.push("link_open","a",1);s.attrs=[["href",a]],s.markup="autolink",s.info="auto";let l=e.push("text","",0);l.content=e.md.normalizeLinkText(n);let u=e.push("link_close","a",-1);u.markup="autolink",u.info="auto"}return e.pos+=n.length+2,!0}return!1}function ah(e){return/^<a[>\s]/i.test(e)}function sh(e){return/^<\/a\s*>/i.test(e)}function lh(e){let t=e|32;return t>=97&&t<=122}function wa(e,t){if(!e.md.options.html)return!1;let r=e.posMax,o=e.pos;if(e.src.charCodeAt(o)!==60||o+2>=r)return!1;let i=e.src.charCodeAt(o+1);if(i!==33&&i!==63&&i!==47&&!lh(i))return!1;let n=e.src.slice(o).match(Jc);if(!n)return!1;if(!t){let a=e.push("html_inline","",0);a.content=n[0],ah(a.content)&&e.linkLevel++,sh(a.content)&&e.linkLevel--}return e.pos+=n[0].length,!0}var uh=/^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i,ch=/^&([a-z][a-z0-9]{1,31});/i;function ya(e,t){let r=e.pos,o=e.posMax;if(e.src.charCodeAt(r)!==38||r+1>=o)return!1;if(e.src.charCodeAt(r+1)===35){let n=e.src.slice(r).match(uh);if(n){if(!t){let a=n[1][0].toLowerCase()==="x"?parseInt(n[1].slice(1),16):parseInt(n[1],10),s=e.push("text_special","",0);s.content=ui(a)?Lr(a):Lr(65533),s.markup=n[0],s.info="entity"}return e.pos+=n[0].length,!0}}else{let n=e.src.slice(r).match(ch);if(n){let a=so(n[0]);if(a!==n[0]){if(!t){let s=e.push("text_special","",0);s.content=a,s.markup=n[0],s.info="entity"}return e.pos+=n[0].length,!0}}}return!1}function id(e){let t={},r=e.length;if(!r)return;let o=0,i=-2,n=[];for(let a=0;a<r;a++){let s=e[a];if(n.push(0),(e[o].marker!==s.marker||i!==s.token-1)&&(o=a),i=s.token,s.length=s.length||0,!s.close)continue;t.hasOwnProperty(s.marker)||(t[s.marker]=[-1,-1,-1,-1,-1,-1]);let l=t[s.marker][(s.open?3:0)+s.length%3],u=o-n[o]-1,c=u;for(;u>l;u-=n[u]+1){let p=e[u];if(p.marker===s.marker&&p.open&&p.end<0){let g=!1;if((p.close||s.open)&&(p.length+s.length)%3===0&&(p.length%3!==0||s.length%3!==0)&&(g=!0),!g){let m=u>0&&!e[u-1].open?n[u-1]+1:0;n[a]=a-u+m,n[u]=m,s.open=!1,p.end=a,p.close=!1,c=-1,i=-2;break}}}c!==-1&&(t[s.marker][(s.open?3:0)+(s.length||0)%3]=c)}}function ka(e){let t=e.tokens_meta,r=e.tokens_meta.length;id(e.delimiters);for(let o=0;o<r;o++)t[o]&&t[o].delimiters&&id(t[o].delimiters)}function Ca(e){let t,r,o=0,i=e.tokens,n=e.tokens.length;for(t=r=0;t<n;t++)i[t].nesting<0&&o--,i[t].level=o,i[t].nesting>0&&o++,i[t].type==="text"&&t+1<n&&i[t+1].type==="text"?i[t+1].content=i[t].content+i[t+1].content:(t!==r&&(i[r]=i[t]),r++);t!==r&&(i.length=r)}var Ea=[["text",ua],["linkify",ca],["newline",da],["escape",fa],["backticks",ma],["strikethrough",ha.tokenize],["emphasis",ga.tokenize],["link",ba],["image",va],["autolink",xa],["html_inline",wa],["entity",ya]],Ta=[["balance_pairs",ka],["strikethrough",ha.postProcess],["emphasis",ga.postProcess],["fragments_join",Ca]];function uo(){this.ruler=new Xt;for(let e=0;e<Ea.length;e++)this.ruler.push(Ea[e][0],Ea[e][1]);this.ruler2=new Xt;for(let e=0;e<Ta.length;e++)this.ruler2.push(Ta[e][0],Ta[e][1])}uo.prototype.skipToken=function(e){let t=e.pos,r=this.ruler.getRules(""),o=r.length,i=e.md.options.maxNesting,n=e.cache;if(typeof n[t]<"u"){e.pos=n[t];return}let a=!1;if(e.level<i){for(let s=0;s<o;s++)if(e.level++,a=r[s](e,!0),e.level--,a){if(t>=e.pos)throw new Error("inline rule didn't increment state.pos");break}}else e.pos=e.posMax;a||e.pos++,n[t]=e.pos};uo.prototype.tokenize=function(e){let t=this.ruler.getRules(""),r=t.length,o=e.posMax,i=e.md.options.maxNesting;for(;e.pos<o;){let n=e.pos,a=!1;if(e.level<i){for(let s=0;s<r;s++)if(a=t[s](e,!1),a){if(n>=e.pos)throw new Error("inline rule didn't increment state.pos");break}}if(a){if(e.pos>=o)break;continue}e.pending+=e.src[e.pos++]}e.pending&&e.pushPending()};uo.prototype.parse=function(e,t,r,o){let i=new this.State(e,t,r,o);this.tokenize(i);let n=this.ruler2.getRules(""),a=n.length;for(let s=0;s<a;s++)n[s](i)};uo.prototype.State=td;var nd=uo;function ad(e){let t={};e=e||{},t.src_Any=ri.source,t.src_Cc=oi.source,t.src_Z=ni.source,t.src_P=_r.source,t.src_ZPCc=[t.src_Z,t.src_P,t.src_Cc].join("|"),t.src_ZCc=[t.src_Z,t.src_Cc].join("|");let r="[><\uFF5C]";return t.src_pseudo_letter=`(?:(?!${r}|${t.src_ZPCc})${t.src_Any})`,t.src_ip4="(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)",t.src_auth=`(?:(?:(?!${t.src_ZCc}|[@/\\[\\]()]).){1,50}@)?`,t.src_port="(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?",t.src_host_terminator=`(?=$|${r}|${t.src_ZPCc})(?!${e["---"]?"-(?!--)|":"-|"}_|:\\d|\\.-|\\.(?!$|${t.src_ZPCc}))`,t.src_path=`(?:[/?#](?:(?!${t.src_ZCc}|${r}|[()[\\]{}.,"'?!\\-;]).|\\[(?:(?!${t.src_ZCc}|\\]).)*\\]|\\((?:(?!${t.src_ZCc}|[)]).)*\\)|\\{(?:(?!${t.src_ZCc}|[}]).)*\\}|\\"(?:(?!${t.src_ZCc}|["]).)+\\"|\\'(?:(?!${t.src_ZCc}|[']).)+\\'|\\'(?=${t.src_pseudo_letter}|[-])|\\.{2,}[a-zA-Z0-9%/&]|\\.(?!${t.src_ZCc}|[.]|$)|`+(e["---"]?"\\-(?!--(?:[^-]|$))(?:-*)|":"\\-+|")+`,(?!${t.src_ZCc}|$)|;(?!${t.src_ZCc}|$)|\\!+(?!${t.src_ZCc}|[!]|$)|\\?(?!${t.src_ZCc}|[?]|$))+|\\/)?`,t.src_email_name='[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]{0,63}',t.src_xn="xn--[a-z0-9\\-]{1,59}",t.src_domain_root="(?:"+t.src_xn+`|${t.src_pseudo_letter}{1,63})`,t.src_domain="(?:"+t.src_xn+`|(?:${t.src_pseudo_letter})|(?:${t.src_pseudo_letter}(?:-|${t.src_pseudo_letter}){0,61}${t.src_pseudo_letter}))`,t.src_host=`(?:(?:(?:(?:${t.src_domain})\\.)*${t.src_domain}))`,t.tpl_host_fuzzy="(?:"+t.src_ip4+`|(?:(?:(?:${t.src_domain})\\.)+(?:%TLDS%)))`,t.tpl_host_no_ip_fuzzy=`(?:(?:(?:${t.src_domain})\\.)+(?:%TLDS%))`,t.src_host_strict=t.src_host+t.src_host_terminator,t.tpl_host_fuzzy_strict=t.tpl_host_fuzzy+t.src_host_terminator,t.src_host_port_strict=t.src_host+t.src_port+t.src_host_terminator,t.tpl_host_port_fuzzy_strict=t.tpl_host_fuzzy+t.src_port+t.src_host_terminator,t.tpl_host_port_no_ip_fuzzy_strict=t.tpl_host_no_ip_fuzzy+t.src_port+t.src_host_terminator,t.tpl_host_fuzzy_test=`localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:${t.src_ZPCc}|>|$))`,t.tpl_email_fuzzy=`(^|${r}|"|\\(|${t.src_ZCc})(${t.src_email_name}@${t.tpl_host_fuzzy_strict})`,t.tpl_link_fuzzy=`(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uFF5C]|${t.src_ZPCc}))((?![$+<=>^\`|\uFF5C])${t.tpl_host_port_fuzzy_strict}${t.src_path})`,t.tpl_link_no_ip_fuzzy=`(^|(?![.:/\\-_@])(?:[$+<=>^\`|\uFF5C]|${t.src_ZPCc}))((?![$+<=>^\`|\uFF5C])${t.tpl_host_port_no_ip_fuzzy_strict}${t.src_path})`,t}function Aa(e){return Array.prototype.slice.call(arguments,1).forEach(function(r){r&&Object.keys(r).forEach(function(o){e[o]=r[o]})}),e}function mi(e){return Object.prototype.toString.call(e)}function dh(e){return mi(e)==="[object String]"}function ph(e){return mi(e)==="[object Object]"}function fh(e){return mi(e)==="[object RegExp]"}function sd(e){return mi(e)==="[object Function]"}function mh(e){return e.replace(/[.?*+^$[\]\\(){}|-]/g,"\\$&")}var ud={fuzzyLink:!0,fuzzyEmail:!0,fuzzyIP:!1};function hh(e){return Object.keys(e||{}).reduce(function(t,r){return t||ud.hasOwnProperty(r)},!1)}var gh={"http:":{validate:function(e,t,r){let o=e.slice(t);return r.re.http||(r.re.http=new RegExp(`^\\/\\/${r.re.src_auth}${r.re.src_host_port_strict}${r.re.src_path}`,"i")),r.re.http.test(o)?o.match(r.re.http)[0].length:0}},"https:":"http:","ftp:":"http:","//":{validate:function(e,t,r){let o=e.slice(t);return r.re.no_http||(r.re.no_http=new RegExp("^"+r.re.src_auth+`(?:localhost|(?:(?:${r.re.src_domain})\\.)+${r.re.src_domain_root})`+r.re.src_port+r.re.src_host_terminator+r.re.src_path,"i")),r.re.no_http.test(o)?t>=3&&e[t-3]===":"||t>=3&&e[t-3]==="/"?0:o.match(r.re.no_http)[0].length:0}},"mailto:":{validate:function(e,t,r){let o=e.slice(t);return r.re.mailto||(r.re.mailto=new RegExp(`^${r.re.src_email_name}@${r.re.src_host_strict}`,"i")),r.re.mailto.test(o)?o.match(r.re.mailto)[0].length:0}}},bh="a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]",vh="biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|\u0440\u0444".split("|");function xh(e){return function(t,r){let o=t.slice(r);return e.test(o)?o.match(e)[0].length:0}}function ld(){return function(e,t){t.normalize(e)}}function fi(e){let t=e.re=ad(e.__opts__),r=e.__tlds__.slice();e.onCompile(),e.__tlds_replaced__||r.push(bh),r.push(t.src_xn),t.src_tlds=r.join("|");function o(s){return s.replace("%TLDS%",t.src_tlds)}t.email_fuzzy=RegExp(o(t.tpl_email_fuzzy),"i"),t.email_fuzzy_global=RegExp(o(t.tpl_email_fuzzy),"ig"),t.link_fuzzy=RegExp(o(t.tpl_link_fuzzy),"i"),t.link_fuzzy_global=RegExp(o(t.tpl_link_fuzzy),"ig"),t.link_no_ip_fuzzy=RegExp(o(t.tpl_link_no_ip_fuzzy),"i"),t.link_no_ip_fuzzy_global=RegExp(o(t.tpl_link_no_ip_fuzzy),"ig"),t.host_fuzzy_test=RegExp(o(t.tpl_host_fuzzy_test),"i");let i=[];e.__compiled__={};function n(s,l){throw new Error(`(LinkifyIt) Invalid schema "${s}": ${l}`)}Object.keys(e.__schemas__).forEach(function(s){let l=e.__schemas__[s];if(l===null)return;let u={validate:null,link:null};if(e.__compiled__[s]=u,ph(l)){fh(l.validate)?u.validate=xh(l.validate):sd(l.validate)?u.validate=l.validate:n(s,l),sd(l.normalize)?u.normalize=l.normalize:l.normalize?n(s,l):u.normalize=ld();return}if(dh(l)){i.push(s);return}n(s,l)}),i.forEach(function(s){e.__compiled__[e.__schemas__[s]]&&(e.__compiled__[s].validate=e.__compiled__[e.__schemas__[s]].validate,e.__compiled__[s].normalize=e.__compiled__[e.__schemas__[s]].normalize)}),e.__compiled__[""]={validate:null,normalize:ld()};let a=Object.keys(e.__compiled__).filter(function(s){return s.length>0&&e.__compiled__[s]}).map(mh).join("|");e.re.schema_test=RegExp(`(^|(?!_)(?:[><\uFF5C]|${t.src_ZPCc}))(${a})`,"i"),e.re.schema_search=RegExp(`(^|(?!_)(?:[><\uFF5C]|${t.src_ZPCc}))(${a})`,"ig"),e.re.schema_at_start=RegExp(`^${e.re.schema_search.source}`,"i"),e.re.pretest=RegExp(`(${e.re.schema_test.source})|(${e.re.host_fuzzy_test.source})|@`,"i")}function cd(e,t,r,o){let i=e.slice(r,o);this.schema=t.toLowerCase(),this.index=r,this.lastIndex=o,this.raw=i,this.text=i,this.url=i}function De(e,t){if(!(this instanceof De))return new De(e,t);t||hh(e)&&(t=e,e={}),this.__opts__=Aa({},ud,t),this.__schemas__=Aa({},gh,e),this.__compiled__={},this.__tlds__=vh,this.__tlds_replaced__=!1,this.re={},fi(this)}De.prototype.add=function(t,r){return this.__schemas__[t]=r,fi(this),this};De.prototype.set=function(t){return this.__opts__=Aa(this.__opts__,t),this};De.prototype.test=function(t){if(!t.length)return!1;let r,o;if(this.re.schema_test.test(t)){for(o=this.re.schema_search,o.lastIndex=0;(r=o.exec(t))!==null;)if(this.testSchemaAt(t,r[2],o.lastIndex))return!0}return!!(this.__opts__.fuzzyLink&&this.__compiled__["http:"]&&t.search(this.re.host_fuzzy_test)>=0&&t.match(this.__opts__.fuzzyIP?this.re.link_fuzzy:this.re.link_no_ip_fuzzy)!==null||this.__opts__.fuzzyEmail&&this.__compiled__["mailto:"]&&t.indexOf("@")>=0&&t.match(this.re.email_fuzzy)!==null)};De.prototype.pretest=function(t){return this.re.pretest.test(t)};De.prototype.testSchemaAt=function(t,r,o){return this.__compiled__[r.toLowerCase()]?this.__compiled__[r.toLowerCase()].validate(t,o,this):0};De.prototype.match=function(t){let r=[],o=[],i=[],n=[],a,s,l;function u(g,m){return g?m?g.index!==m.index?g.index<m.index?g:m:g.lastIndex>=m.lastIndex?g:m:g:m}if(!t.length)return null;if(this.re.schema_test.test(t))for(l=this.re.schema_search,l.lastIndex=0;(a=l.exec(t))!==null;)s=this.testSchemaAt(t,a[2],l.lastIndex),s&&o.push({schema:a[2],index:a.index+a[1].length,lastIndex:a.index+a[0].length+s});if(this.__opts__.fuzzyLink&&this.__compiled__["http:"])for(l=this.__opts__.fuzzyIP?this.re.link_fuzzy_global:this.re.link_no_ip_fuzzy_global,l.lastIndex=0;(a=l.exec(t))!==null;)i.push({schema:"",index:a.index+a[1].length,lastIndex:a.index+a[0].length});if(this.__opts__.fuzzyEmail&&this.__compiled__["mailto:"])for(l=this.re.email_fuzzy_global,l.lastIndex=0;(a=l.exec(t))!==null;)n.push({schema:"mailto:",index:a.index+a[1].length,lastIndex:a.index+a[0].length});let c=[0,0,0],p=0;for(;;){let g=[o[c[0]],n[c[1]],i[c[2]]],m=u(u(g[0],g[1]),g[2]);if(!m)break;if(m===g[0]?c[0]++:m===g[1]?c[1]++:c[2]++,m.index<p)continue;let h=new cd(t,m.schema,m.index,m.lastIndex);this.__compiled__[h.schema].normalize(h,this),r.push(h),p=m.lastIndex}return r.length?r:null};De.prototype.matchAtStart=function(t){if(!t.length)return null;let r=this.re.schema_at_start.exec(t);if(!r)return null;let o=this.testSchemaAt(t,r[2],r[0].length);if(!o)return null;let i=new cd(t,r[2],r.index+r[1].length,r.index+r[0].length+o);return this.__compiled__[i.schema].normalize(i,this),i};De.prototype.tlds=function(t,r){return t=Array.isArray(t)?t:[t],r?(this.__tlds__=this.__tlds__.concat(t).sort().filter(function(o,i,n){return o!==n[i-1]}).reverse(),fi(this),this):(this.__tlds__=t.slice(),this.__tlds_replaced__=!0,fi(this),this)};De.prototype.normalize=function(t){t.schema||(t.url=`http://${t.url}`),t.schema==="mailto:"&&!/^mailto:/i.test(t.url)&&(t.url=`mailto:${t.url}`)};De.prototype.onCompile=function(){};var dd=De;var wh=/^xn--/,yh=/[^\0-\x7F]/,kh=/[\x2E\u3002\uFF0E\uFF61]/g,Ch={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},_a=35,ot=Math.floor,Sa=String.fromCharCode;function Tt(e){throw new RangeError(Ch[e])}function Eh(e,t){let r=[],o=e.length;for(;o--;)r[o]=t(e[o]);return r}function fd(e,t){let r=e.split("@"),o="";r.length>1&&(o=r[0]+"@",e=r[1]),e=e.replace(kh,".");let i=e.split("."),n=Eh(i,t).join(".");return o+n}function md(e){let t=[],r=0,o=e.length;for(;r<o;){let i=e.charCodeAt(r++);if(i>=55296&&i<=56319&&r<o){let n=e.charCodeAt(r++);(n&64512)==56320?t.push(((i&1023)<<10)+(n&1023)+65536):(t.push(i),r--)}else t.push(i)}return t}var Th=e=>String.fromCodePoint(...e),Ah=function(e){return e>=48&&e<58?26+(e-48):e>=65&&e<91?e-65:e>=97&&e<123?e-97:36},pd=function(e,t){return e+22+75*(e<26)-((t!=0)<<5)},hd=function(e,t,r){let o=0;for(e=r?ot(e/700):e>>1,e+=ot(e/t);e>_a*26>>1;o+=36)e=ot(e/_a);return ot(o+(_a+1)*e/(e+38))},gd=function(e){let t=[],r=e.length,o=0,i=128,n=72,a=e.lastIndexOf("-");a<0&&(a=0);for(let s=0;s<a;++s)e.charCodeAt(s)>=128&&Tt("not-basic"),t.push(e.charCodeAt(s));for(let s=a>0?a+1:0;s<r;){let l=o;for(let c=1,p=36;;p+=36){s>=r&&Tt("invalid-input");let g=Ah(e.charCodeAt(s++));g>=36&&Tt("invalid-input"),g>ot((2147483647-o)/c)&&Tt("overflow"),o+=g*c;let m=p<=n?1:p>=n+26?26:p-n;if(g<m)break;let h=36-m;c>ot(2147483647/h)&&Tt("overflow"),c*=h}let u=t.length+1;n=hd(o-l,u,l==0),ot(o/u)>2147483647-i&&Tt("overflow"),i+=ot(o/u),o%=u,t.splice(o++,0,i)}return String.fromCodePoint(...t)},bd=function(e){let t=[];e=md(e);let r=e.length,o=128,i=0,n=72;for(let l of e)l<128&&t.push(Sa(l));let a=t.length,s=a;for(a&&t.push("-");s<r;){let l=2147483647;for(let c of e)c>=o&&c<l&&(l=c);let u=s+1;l-o>ot((2147483647-i)/u)&&Tt("overflow"),i+=(l-o)*u,o=l;for(let c of e)if(c<o&&++i>2147483647&&Tt("overflow"),c===o){let p=i;for(let g=36;;g+=36){let m=g<=n?1:g>=n+26?26:g-n;if(p<m)break;let h=p-m,x=36-m;t.push(Sa(pd(m+h%x,0))),p=ot(h/x)}t.push(Sa(pd(p,0))),n=hd(i,u,s===a),i=0,++s}++i,++o}return t.join("")},_h=function(e){return fd(e,function(t){return wh.test(t)?gd(t.slice(4).toLowerCase()):t})},Sh=function(e){return fd(e,function(t){return yh.test(t)?"xn--"+bd(t):t})},Fh={version:"2.3.1",ucs2:{decode:md,encode:Th},decode:gd,encode:bd,toASCII:Sh,toUnicode:_h};var Fa=Fh;var vd={options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"\u201C\u201D\u2018\u2019",highlight:null,maxNesting:100},components:{core:{},block:{},inline:{}}};var xd={options:{html:!1,xhtmlOut:!1,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"\u201C\u201D\u2018\u2019",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline","text_join"]},block:{rules:["paragraph"]},inline:{rules:["text"],rules2:["balance_pairs","fragments_join"]}}};var wd={options:{html:!0,xhtmlOut:!0,breaks:!1,langPrefix:"language-",linkify:!1,typographer:!1,quotes:"\u201C\u201D\u2018\u2019",highlight:null,maxNesting:20},components:{core:{rules:["normalize","block","inline","text_join"]},block:{rules:["blockquote","code","fence","heading","hr","html_block","lheading","list","reference","paragraph"]},inline:{rules:["autolink","backticks","emphasis","entity","escape","html_inline","image","link","newline","text"],rules2:["balance_pairs","emphasis","fragments_join"]}}};var Lh={default:vd,zero:xd,commonmark:wd},Dh=/^(vbscript|javascript|file|data):/,zh=/^data:image\/(gif|png|jpeg|webp);/;function Mh(e){let t=e.trim().toLowerCase();return Dh.test(t)?zh.test(t):!0}var yd=["http:","https:","mailto:"];function Rh(e){let t=ao(e,!0);if(t.hostname&&(!t.protocol||yd.indexOf(t.protocol)>=0))try{t.hostname=Fa.toASCII(t.hostname)}catch{}return Qo(Ar(t))}function Ph(e){let t=ao(e,!0);if(t.hostname&&(!t.protocol||yd.indexOf(t.protocol)>=0))try{t.hostname=Fa.toUnicode(t.hostname)}catch{}return no(Ar(t),no.defaultChars+"%")}function Be(e,t){if(!(this instanceof Be))return new Be(e,t);t||li(e)||(t=e||{},e="default"),this.inline=new nd,this.block=new ed,this.core=new Hc,this.renderer=new Bc,this.linkify=new dd,this.validateLink=Mh,this.normalizeLink=Rh,this.normalizeLinkText=Ph,this.utils=In,this.helpers=Fr({},qn),this.options={},this.configure(e),t&&this.set(t)}Be.prototype.set=function(e){return Fr(this.options,e),this};Be.prototype.configure=function(e){let t=this;if(li(e)){let r=e;if(e=Lh[r],!e)throw new Error('Wrong `markdown-it` preset "'+r+'", check name')}if(!e)throw new Error("Wrong `markdown-it` preset, can't be empty");return e.options&&t.set(e.options),e.components&&Object.keys(e.components).forEach(function(r){e.components[r].rules&&t[r].ruler.enableOnly(e.components[r].rules),e.components[r].rules2&&t[r].ruler2.enableOnly(e.components[r].rules2)}),this};Be.prototype.enable=function(e,t){let r=[];Array.isArray(e)||(e=[e]),["core","block","inline"].forEach(function(i){r=r.concat(this[i].ruler.enable(e,!0))},this),r=r.concat(this.inline.ruler2.enable(e,!0));let o=e.filter(function(i){return r.indexOf(i)<0});if(o.length&&!t)throw new Error("MarkdownIt. Failed to enable unknown rule(s): "+o);return this};Be.prototype.disable=function(e,t){let r=[];Array.isArray(e)||(e=[e]),["core","block","inline"].forEach(function(i){r=r.concat(this[i].ruler.disable(e,!0))},this),r=r.concat(this.inline.ruler2.disable(e,!0));let o=e.filter(function(i){return r.indexOf(i)<0});if(o.length&&!t)throw new Error("MarkdownIt. Failed to disable unknown rule(s): "+o);return this};Be.prototype.use=function(e){let t=[this].concat(Array.prototype.slice.call(arguments,1));return e.apply(e,t),this};Be.prototype.parse=function(e,t){if(typeof e!="string")throw new Error("Input data should be a String");let r=new this.core.State(e,this,t);return this.core.process(r),r.tokens};Be.prototype.render=function(e,t){return t=t||{},this.renderer.render(this.parse(e,t),this.options,t)};Be.prototype.parseInline=function(e,t){let r=new this.core.State(e,this,t);return r.inlineMode=!0,this.core.process(r),r.tokens};Be.prototype.renderInline=function(e,t){return t=t||{},this.renderer.render(this.parseInline(e,t),this.options,t)};var co=Be;var Oh=new co({html:!1,linkify:!0,typographer:!1}),La=class extends Co{static properties={scope:{type:String},prefix:{type:String},topicName:{type:String,attribute:"topic-name"},ready:{type:Boolean},question:{state:!0},messages:{state:!0},streaming:{state:!0},status:{state:!0},statusTone:{state:!0}};#e="topic";get scope(){return this.#e}set scope(t){this.#e=t}#t="";get prefix(){return this.#t}set prefix(t){this.#t=t}#o="";get topicName(){return this.#o}set topicName(t){this.#o=t}#r=!1;get ready(){return this.#r}set ready(t){this.#r=t}#n="";get question(){return this.#n}set question(t){this.#n=t}#i=[];get messages(){return this.#i}set messages(t){this.#i=t}#a=!1;get streaming(){return this.#a}set streaming(t){this.#a=t}#s="";get status(){return this.#s}set status(t){this.#s=t}#u="neutral";get statusTone(){return this.#u}set statusTone(t){this.#u=t}abortController=null;conversationKey="";createRenderRoot(){return this}disconnectedCallback(){this.abortController?.abort(),this.abortController=null,super.disconnectedCallback()}willUpdate(t){let r=`${this.scope}:${this.scope==="topic"?this.prefix:"all"}`;this.conversationKey&&this.conversationKey!==r&&this.clearConversation(!1),this.conversationKey=r,t.has("ready")&&!this.ready&&this.streaming&&this.abortController?.abort()}updated(t){t.has("messages")&&this.scrollToLatest(),t.has("question")&&this.syncTextareaHeight()}render(){let t=this.scope==="global",r=t?"\u5168\u5C40 AI \u95EE\u7B54":"\u4E13\u9898\u95EE\u7B54";return C`
      <section class=${ee({"drive-ai-qa":!0,"is-global":t})} aria-label=${r} aria-busy=${String(this.streaming)}>
        <header class="drive-ai-qa-head">
          <div class="drive-ai-qa-heading">
            <span class="drive-ai-qa-symbol">${P("chat-circle-dots")}</span>
            <h2>${r}</h2>
          </div>
          ${this.messages.length?C`<button class="drive-control drive-ai-qa-clear" type="button" @click=${()=>this.clearConversation()} ?disabled=${this.streaming}>
                ${P("trash")}清空会话
              </button>`:R}
        </header>

        ${this.ready?R:C`<div class="drive-ai-qa-notice is-warning" role="status">
              ${P("warning")}<span>${t?"\u5F53\u524D\u6CA1\u6709\u53EF\u7528\u4E8E\u5168\u5C40\u95EE\u7B54\u7684 Context\u3002":"\u5F53\u524D\u4E13\u9898\u8FD8\u6CA1\u6709\u53EF\u7528\u7684\u6700\u65B0\u7248 Context\uFF0C\u8BF7\u8054\u7CFB\u4E13\u9898\u8D1F\u8D23\u4EBA\u751F\u6210\u5E76\u56DE\u4F20\u3002"}</span>
            </div>`}

        <div class="drive-ai-qa-messages" data-qa-messages aria-live="polite">
          ${this.messages.length?Ut(this.messages,o=>o.id,o=>this.renderMessage(o)):this.renderEmptyState()}
        </div>

        <form class=${ee({"drive-ai-qa-form":!0,"is-danger":this.statusTone==="danger"})} @submit=${this.handleSubmit}>
          <div class="drive-ai-qa-composer">
            <textarea
              name="qaQuestion"
              rows="2"
              maxlength="3000"
              aria-label="您的问题"
              placeholder=${t?"\u8BE2\u95EE\u8DE8\u4E13\u9898\u7ED3\u8BBA\u3001\u98CE\u9669\u6216\u6765\u6E90":"\u8BF7\u8F93\u5165\u5173\u4E8E\u8BE5\u4E13\u9898\u7684\u95EE\u9898"}
              .value=${this.question}
              @input=${this.handleInput}
              @keydown=${this.handleKeydown}
              ?disabled=${!this.ready||this.streaming}
            ></textarea>
            ${this.streaming?C`<button class="drive-ai-qa-action is-stop" type="button" aria-label="停止生成" title="停止生成" @click=${this.stop}>${P("stop-circle")}</button>`:C`<button class="drive-ai-qa-action" type="submit" aria-label="发送问题" title="发送问题" ?disabled=${!this.ready||!this.question.trim()}>
                  ${P("paper-plane-tilt","bold")}
                </button>`}
          </div>
          <span class="drive-ai-qa-status" role="status">
            ${this.status||(this.ready?"\u5BF9\u8BDD\u4EC5\u4FDD\u5B58\u5728\u5F53\u524D\u9875\u9762\uFF0C\u5237\u65B0\u540E\u6E05\u7A7A\u3002":"Context \u51C6\u5907\u5B8C\u6210\u540E\u5373\u53EF\u4F7F\u7528\u3002")}
          </span>
        </form>
      </section>
    `}renderEmptyState(){let t=this.scope==="global"?"\u5728\u5168\u8D44\u6599\u5E93\u5185\u63D0\u95EE":`\u5BF9${this.topicName||"\u5F53\u524D\u4E13\u9898"}\u63D0\u95EE`,r=this.scope==="global"?[["database","\u6C47\u603B\u91CD\u70B9","\u8BF7\u6C47\u603B\u5404\u4E13\u9898\u5F53\u524D\u6700\u91CD\u8981\u7684\u7ED3\u8BBA\uFF0C\u5E76\u6807\u660E\u6765\u6E90\u3002"],["files","\u6BD4\u8F83\u4E13\u9898","\u54EA\u4E9B\u4E13\u9898\u5B58\u5728\u5171\u540C\u98CE\u9669\u6216\u76F8\u4E92\u5F71\u54CD\uFF1F\u8BF7\u5206\u522B\u8BF4\u660E\u4F9D\u636E\u3002"],["link","\u67E5\u627E\u6765\u6E90","\u8BF7\u5217\u51FA\u5168\u5C40 Context \u4E2D\u53EF\u8FFD\u6EAF\u7684\u5173\u952E\u6765\u6E90\u8DEF\u5F84\u3002"]]:[["database","\u6982\u62EC\u7ED3\u8BBA","\u8BF7\u6982\u62EC\u8FD9\u4E2A\u4E13\u9898\u7684\u6838\u5FC3\u7ED3\u8BBA\uFF0C\u5E76\u6807\u660E\u6765\u6E90\u3002"],["warning","\u68C0\u67E5\u98CE\u9669","\u5F53\u524D\u6709\u54EA\u4E9B\u98CE\u9669\u3001\u53CD\u4F8B\u6216\u5F85\u6838\u9A8C\u4E8B\u9879\uFF1F"],["link","\u67E5\u627E\u6765\u6E90","\u8BF7\u5217\u51FA\u56DE\u7B54\u8303\u56F4\u548C\u5173\u952E\u6765\u6E90\u8DEF\u5F84\u3002"]];return C`
      <div class="drive-ai-qa-empty">
        <div><h3>${this.ready?t:"\u7B49\u5F85 Context"}</h3><p>${this.ready?"\u9009\u62E9\u4E00\u4E2A\u65B9\u5411\uFF0C\u6216\u76F4\u63A5\u8F93\u5165\u60A8\u5173\u5FC3\u7684\u95EE\u9898\u3002":"\u51C6\u5907\u5B8C\u6210\u540E\uFF0C\u8FD9\u91CC\u4F1A\u63D0\u4F9B\u57FA\u4E8E\u8D44\u6599\u7684\u53EF\u8FFD\u6EAF\u56DE\u7B54\u3002"}</p></div>
        ${this.ready?C`<div class="drive-ai-qa-suggestions" aria-label="问题建议">
              ${r.map(([o,i,n])=>C`
                <button type="button" @click=${()=>this.useSuggestion(n)}>${P(o)}<span>${i}</span></button>
              `)}
            </div>`:R}
      </div>
    `}renderMessage(t){let r=t.role==="assistant"&&t.content?Xo.sanitize(Oh.render(t.content)):"";return C`
      <article class=${ee({"drive-ai-qa-message":!0,"is-user":t.role==="user","is-error":!!t.error})}>
        <header><span>${t.role==="user"?"\u60A8":"AI"}</span>${t.pending?C`<small>生成中</small>`:R}</header>
        ${t.role==="assistant"?t.content?C`<div class="drive-ai-qa-markdown">${Ko(r)}</div>`:t.pending?this.renderSkeleton():R:C`<p>${t.content}</p>`}
        ${t.error?C`<div class="drive-ai-qa-error"><span>本次生成失败。</span><button type="button" @click=${()=>this.retry(t.id)}>${P("arrow-clockwise")}重试</button></div>`:R}
      </article>
    `}renderSkeleton(){return C`<div class="drive-ai-qa-skeleton" aria-label="正在生成回答"><span></span><span></span><span></span></div>`}handleInput=t=>{this.question=t.target.value};handleKeydown=t=>{t.key!=="Enter"||t.shiftKey||t.isComposing||t.keyCode===229||this.hasCoarsePointer()||(t.preventDefault(),this.submitQuestion())};handleSubmit=t=>{t.preventDefault(),this.submitQuestion()};async submitQuestion(t){if(!this.ready||this.streaming)return;let r=(t??this.question).trim();if(!r){this.setStatus("\u8BF7\u8F93\u5165\u95EE\u9898\u3002","danger");return}if(r.length>3e3){this.setStatus("\u95EE\u9898\u4E0D\u80FD\u8D85\u8FC7 3000 \u5B57\u3002","danger");return}let o=this.completedHistory(),i={id:this.messageId(),role:"user",content:r},n={id:this.messageId(),role:"assistant",content:"",pending:!0};this.messages=[...this.messages,i,n],this.question="",this.streaming=!0;let a=new AbortController;this.abortController=a,this.setStatus("\u6B63\u5728\u751F\u6210\u56DE\u7B54...");try{let s=await fetch("/api/drive/qa",{method:"POST",headers:{"content-type":"application/json"},credentials:"same-origin",signal:a.signal,body:JSON.stringify({scope:this.scope,...this.scope==="topic"?{prefix:this.prefix}:{},messages:[...o,i].map(({role:l,content:u})=>({role:l,content:u}))})});if(!s.ok){let l=await s.json().catch(()=>({}));throw new Error(typeof l.error=="string"?l.error:`\u95EE\u7B54\u8BF7\u6C42\u5931\u8D25\uFF08${s.status}\uFF09`)}if(!s.body)throw new Error("\u6A21\u578B\u6CA1\u6709\u8FD4\u56DE\u6D41\u5F0F\u54CD\u5E94");if(await this.consumeStream(s.body,n),this.abortController!==a)return;if(!n.content)throw new Error("\u6A21\u578B\u6CA1\u6709\u8FD4\u56DE\u53EF\u663E\u793A\u7684\u6D41\u5F0F\u5185\u5BB9");n.pending=!1,this.messages=[...this.messages],this.setStatus("\u56DE\u7B54\u5B8C\u6210\u3002","success")}catch(s){if(this.abortController!==a)return;n.pending=!1,this.isAbort(s)?(n.content?(n.excludeFromHistory=!0,this.messages=[...this.messages]):this.messages=this.messages.filter(l=>l.id!==n.id&&l.id!==i.id),this.setStatus("\u5DF2\u505C\u6B62\u751F\u6210\u3002")):(n.error=!0,this.messages=[...this.messages],this.setStatus(s instanceof Error?s.message:"\u95EE\u7B54\u8BF7\u6C42\u5931\u8D25","danger"))}finally{this.abortController===a&&(this.abortController=null,this.streaming=!1)}}async consumeStream(t,r){let o=t.getReader(),i=new TextDecoder,n="";for(;;){let{value:a,done:s}=await o.read();n+=i.decode(a,{stream:!s}).replace(/\r\n/g,`
`);let l=n.indexOf(`

`);for(;l>=0;){let u=n.slice(0,l);n=n.slice(l+2);let c=/^event:\s*(.+)$/m.exec(u)?.[1]?.trim(),p=u.split(`
`).filter(m=>m.startsWith("data:")).map(m=>m.slice(5).trimStart()).join(`
`),g=p?JSON.parse(p):{};if(c==="delta"&&typeof g.content=="string")r.content+=g.content,this.messages=[...this.messages];else if(c==="error")throw new Error(typeof g.error=="string"?g.error:"\u6A21\u578B\u6D41\u5F0F\u8F93\u51FA\u5931\u8D25");l=n.indexOf(`

`)}if(s)break}}stop=()=>{this.abortController?.abort()};clearConversation(t=!0){this.abortController?.abort(),this.abortController=null,this.messages=[],this.streaming=!1,this.question="",this.setStatus(t?"\u5F53\u524D\u6D4F\u89C8\u5668\u4F1A\u8BDD\u5DF2\u6E05\u7A7A\u3002":"",t?"success":"neutral")}retry(t){if(this.streaming)return;let r=this.messages.findIndex(i=>i.id===t&&i.role==="assistant"&&i.error);if(r<1)return;let o=this.messages[r-1];o.role==="user"&&(this.messages=this.messages.filter((i,n)=>n!==r&&n!==r-1),this.submitQuestion(o.content))}completedHistory(){let t=[];for(let r=0;r+1<this.messages.length;r+=2){let o=this.messages[r],i=this.messages[r+1];o.role!=="user"||i.role!=="assistant"||i.pending||i.error||i.excludeFromHistory||t.push(o,i)}return t.slice(-12)}useSuggestion(t){this.question=t,this.updateComplete.then(()=>this.querySelector("textarea")?.focus())}syncTextareaHeight(){this.updateComplete.then(()=>{let t=this.querySelector("textarea");t&&(t.style.height="auto",t.scrollHeight>0&&(t.style.height=`${Math.min(t.scrollHeight,156)}px`))})}hasCoarsePointer(){return typeof window.matchMedia=="function"&&window.matchMedia("(pointer: coarse)").matches}setStatus(t,r="neutral"){this.status=t,this.statusTone=r}scrollToLatest(){this.updateComplete.then(()=>{let t=this.querySelector("[data-qa-messages]");t&&(t.scrollTop=t.scrollHeight)})}messageId(){return`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`}isAbort(t){return t instanceof DOMException&&t.name==="AbortError"}};customElements.get("drive-ai-qa")||customElements.define("drive-ai-qa",La);var Ih=new Set(["md","markdown"]),Bh=new Set(["txt"]),$h=new Set(["html","htm"]);function Da(e){let t=e.lastIndexOf(".");return t===-1?"":e.slice(t+1).toLowerCase()}function hi(e){let t=Da(e.name),r=(e.contentType||"").toLowerCase();return $h.has(t)||r.includes("text/html")?"html":t==="pdf"||r.includes("application/pdf")?"pdf":Ih.has(t)||r.includes("markdown")?"markdown":Bh.has(t)||r.startsWith("text/plain")?"text":"none"}function za(e){return hi(e)!=="none"}function Cd(e){if(e.kind==="output")return"\u6210\u679C";if(e.kind==="prompt")return"\u63D0\u793A\u8BCD";let t=Da(e.name);return t?t.toUpperCase():Nh(e.size)}function Ed(e){let t=hi(e);if(t==="pdf")return"ph-file-pdf";if(t==="html")return"ph-file-html";if(t==="markdown"||t==="text")return"ph-file-text";let r=Da(e.name);return["xls","xlsx","csv"].includes(r)?"ph-file-xls":["ppt","pptx"].includes(r)?"ph-file-ppt":["doc","docx"].includes(r)?"ph-file-doc":["png","jpg","jpeg","gif","webp"].includes(r)?"ph-file-image":"ph-file"}function Nh(e){if(!Number.isFinite(e)||e<=0)return"-";let t=["B","KB","MB","GB"],r=e,o=0;for(;r>=1024&&o<t.length-1;)r/=1024,o+=1;return`${r>=10||o===0?r.toFixed(0):r.toFixed(1)} ${t[o]}`}function Ma(e){if(!e)return"-";let t=new Date(e);return Number.isNaN(t.getTime())?"-":new Intl.DateTimeFormat("zh-CN",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:!1}).format(t)}function Td(e){if(!e)return"-";let t=new Date(e);return Number.isNaN(t.getTime())?"-":new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"2-digit",day:"2-digit"}).format(t)}function Ad(e){return e.replace(/\\/g,"/").replace(/^\/+/,"").split("/").filter(Boolean).join("/")}function Ra(e){let t=e.lastIndexOf("/");return t===-1?"":e.slice(0,t+1)}function Pa(e){let t=e.lastIndexOf("/");return t===-1?e:e.slice(t+1)}function _d(e,t,r){return t.startsWith(r)?t.startsWith(`${r}outputs/`)||e==="outputs"?"topic":"directory":"overview"}function Sd(e){return[...e].sort((t,r)=>kd(r)-kd(t)||t.name.localeCompare(r.name,"zh-Hans-CN"))}function Oa(e){return e.filter(t=>t.name!=="\u6210\u679C\u751F\u6210\u4E0E\u56DE\u4F20.prompt.md")}function Ia(e){return e.filter(t=>t.name!=="outputs")}function Fd(e,t){return Ia(e).length===0&&Oa(t).length===0}function kd(e){return Date.parse(e.uploadedAt||e.lastModified)||0}var qh="/api/drive",jh=new co({html:!1,linkify:!0,typographer:!1}),Md=document.querySelector("[data-drive-root]"),gi=new Map,f={mode:"login",activeTab:"qa",overview:null,topic:null,materialList:null,materialPrefix:"",status:"",statusTone:"neutral",loading:!1,upload:{active:!1,name:"",percent:0,overallPercent:0,total:0},preview:null,pendingDelete:null,pendingSettingsPublish:!1,pendingUploadSelection:null,deleteConfirmText:"",busyAction:null,ownerCandidates:null,drafts:{loginName:"",accessCode:"",topicName:"",createKeywords:"",settingsKeywords:"",owner:"",ownerConfirmName:""}},Mr=0,Ba=null;if(!Md)throw new Error("Missing [data-drive-root] mount element.");var pt=Md;pt.replaceChildren();pt.addEventListener("click",e=>{Vh(e)});pt.addEventListener("submit",e=>{Hh(e)});pt.addEventListener("change",e=>{Wh(e)});pt.addEventListener("input",Gh);pt.addEventListener("wa-after-hide",e=>{let t=e.target;t.matches("[data-preview-drawer]")&&f.preview?.kind!=="pdf"&&ft(),t.matches("[data-delete-dialog]")&&(f.pendingDelete=null,f.deleteConfirmText="",M()),t.matches("[data-settings-confirm-dialog]")&&(f.pendingSettingsPublish=!1,M()),t.matches("[data-upload-reminder-dialog]")&&(f.pendingUploadSelection=null,M())});pt.addEventListener("drive-pdf-close",()=>ft());M();Uh();async function Uh(){U("\u6B63\u5728\u8BFB\u53D6\u4E13\u9898\u8D44\u6599\u5E93..."),await fo()}async function Hh(e){let t=e.target;t.matches("[data-login-form], [data-create-form], [data-settings-form]")&&(e.preventDefault(),t.matches("[data-login-form]")?await Yh():t.matches("[data-create-form]")?await Xh():await Kh())}async function Vh(e){let t=e.target.closest("[data-action]");if(!t||t.hasAttribute("disabled"))return;let r=t.dataset.action||"",o=t.dataset.path||"",i=t.dataset.prefix||"",n=t.dataset.name||Pa(o);r==="logout"?await ng():r==="create-view"?ag():r==="cancel-create"||r==="back-overview"?await fo():r==="open-topic"?await vi(i||o,"qa"):r==="tab"?og(t.dataset.tab):r==="open-folder"?await xi(o):r==="preview"?await ug(o,t):r==="download"?await Rd(o):r==="copy-link"?await lg(o):r==="delete-file"?Dd({type:"file",path:o,name:n}):r==="delete-topic"&&f.topic?Dd({type:"topic",prefix:f.topic.topic.prefix,name:f.topic.topic.name}):r==="confirm-delete"?await cg():r==="cancel-delete"?Pd():r==="confirm-settings-publish"?await Zh():r==="cancel-settings-publish"?Jh():r==="request-file-upload"?Ld("file"):r==="request-folder-upload"?Ld("folder"):r==="continue-upload"?eg():r==="cancel-upload"?Qh():r==="agent-context-task"?await sg():r==="refresh"?await ig():r==="set-featured"?await Bg(o):r==="transfer-owner"?await tg():r==="remove-owner-candidate"&&await rg(n)}async function Wh(e){let t=e.target,r=t.dataset.draft;if(r&&(f.drafts[r]=t.value),t.matches("[data-file-input]")){let o=t,i=Array.from(o.files||[]);o.value="",await zd(i,n=>n.name)}else if(t.matches("[data-folder-input]")){let o=t,i=Array.from(o.files||[]);o.value="",await zd(i,n=>n.webkitRelativePath||n.name)}}function Gh(e){let t=e.target,r=t.dataset.draft;r&&(f.drafts[r]=t.value),t.matches("[data-delete-confirm-input]")&&(f.deleteConfirmText=t.value,M(),queueMicrotask(()=>document.querySelector("[data-delete-confirm-input]")?.focus()))}async function Yh(){try{it(!0,"\u6B63\u5728\u6821\u9A8C\u8EAB\u4EFD..."),await be("/login",{method:"POST",body:{displayName:f.drafts.loginName,accessCode:f.drafts.accessCode}}),f.drafts.loginName="",f.drafts.accessCode="",await fo("\u6B22\u8FCE\u56DE\u6765\u3002")}catch(e){Ce(e),f.mode="login",M()}finally{it(!1)}}async function Xh(){let e=f.drafts.topicName.trim();if(!e){U("\u8BF7\u8F93\u5165\u4E13\u9898\u540D\u79F0\u3002","danger"),M();return}try{it(!0,"\u6B63\u5728\u521B\u5EFA\u4E13\u9898...");let t=await be("/topic",{method:"POST",body:{name:e,analysisKeywords:f.drafts.createKeywords}});f.drafts.topicName="",f.drafts.createKeywords="",U("\u4E13\u9898\u5DF2\u521B\u5EFA\uFF0C\u5206\u6790\u53E3\u5F84\u5DF2\u53D1\u5E03\u5E76\u5C55\u793A\u7ED9\u6240\u6709\u4EBA\u3002","success"),await vi(t.topic.prefix,"qa")}catch(t){Ce(t),M()}finally{it(!1)}}async function Kh(){!f.topic||!f.topic.canEditAnalysisScope||(f.pendingSettingsPublish=!0,M())}async function Zh(){if(!(!f.topic||!f.topic.canEditAnalysisScope||!f.pendingSettingsPublish))try{f.pendingSettingsPublish=!1,it(!0,"\u6B63\u5728\u53D1\u5E03\u5206\u6790\u53E3\u5F84..."),f.topic=await be("/topic",{method:"PUT",body:{prefix:f.topic.topic.prefix,analysisKeywords:f.drafts.settingsKeywords}}),f.drafts.settingsKeywords=f.topic.topic.analysisKeywords,U("\u5206\u6790\u53E3\u5F84\u5DF2\u53D1\u5E03\u5E76\u5C55\u793A\u7ED9\u6240\u6709\u4EBA\u3002","success"),M()}catch(e){Ce(e),M()}finally{it(!1)}}function Jh(){f.pendingSettingsPublish=!1,M()}function Ld(e){f.pendingUploadSelection=e,M()}function Qh(){f.pendingUploadSelection=null,M()}function eg(){let e=f.pendingUploadSelection;e&&(f.pendingUploadSelection=null,M(),pt.querySelector(e==="file"?"[data-file-input]":"[data-folder-input]")?.click())}async function tg(){if(!f.topic?.canTransferTopicOwner)return;let e=f.drafts.owner;if(!e||e===f.topic.topic.owner){U("\u8BF7\u9009\u62E9\u4E0D\u540C\u7684\u65B0\u8D1F\u8D23\u4EBA\u3002","danger"),M();return}if(f.drafts.ownerConfirmName.trim()!==f.topic.topic.name){U("\u8BF7\u8F93\u5165\u5B8C\u6574\u4E13\u9898\u540D\u4EE5\u786E\u8BA4\u8F6C\u4EA4\u3002","danger"),M();return}try{it(!0,"\u6B63\u5728\u8F6C\u4EA4\u4E13\u9898\u8D1F\u8D23\u4EBA..."),f.topic=await be("/topic",{method:"PUT",body:{prefix:f.topic.topic.prefix,owner:e,confirmName:f.drafts.ownerConfirmName}}),Pr()||(f.activeTab="qa"),f.drafts.owner=f.topic.topic.owner,f.drafts.ownerConfirmName="",U(`\u4E13\u9898\u8D1F\u8D23\u4EBA\u5DF2\u8F6C\u4EA4\u7ED9 ${f.topic.topic.owner}\u3002`,"success"),M()}catch(t){Ce(t),M()}finally{it(!1)}}async function rg(e){if(!(!f.ownerCandidates?.canManage||!window.confirm(`\u786E\u8BA4\u4ECE\u8D1F\u8D23\u4EBA\u5019\u9009\u540D\u5355\u4E2D\u79FB\u9664\u201C${e}\u201D\u5417\uFF1F`)))try{it(!0,"\u6B63\u5728\u66F4\u65B0\u8D1F\u8D23\u4EBA\u5019\u9009\u540D\u5355...");let t=await be("/owner-candidates",{method:"DELETE",body:{displayName:e}});f.ownerCandidates={...f.ownerCandidates,candidates:t.candidates},U(`\u5DF2\u79FB\u9664\u8D1F\u8D23\u4EBA\u5019\u9009 ${e}\u3002`,"success"),M()}catch(t){Ce(t),M()}finally{it(!1)}}async function fo(e=""){let t=qa("overview");bi("topic"),bi("materials"),ft(!1);try{f.mode="overview",f.loading=!0,f.topic=null,f.pendingSettingsPublish=!1,f.materialList=null,f.materialPrefix="",M();let r=await be("/overview",{signal:t});if(t.aborted)return;f.overview=r,f.loading=!1,U(e||Og(r),e?"success":"neutral"),M()}catch(r){if(Ua(r))return;f.loading=!1,$g(r)?(f.mode="login",U("\u8BF7\u8F93\u5165\u59D3\u540D\u548C\u8BBF\u95EE\u7801\u540E\u7EE7\u7EED\u3002")):(Ce(r),f.mode="login"),M()}}async function vi(e,t="qa"){let r=qa("topic");bi("materials"),ft(!1);try{f.mode="topic",f.activeTab=t,f.loading=!0,f.materialPrefix=e,M();let[o,i,n]=await Promise.all([be(`/topic?${new URLSearchParams({prefix:e}).toString()}`,{signal:r}),$a(e,r),be("/owner-candidates",{signal:r})]);if(r.aborted)return;f.topic=o,f.activeTab==="settings"&&!Pr(o)&&(f.activeTab="qa"),f.activeTab==="agent"&&!o.canGenerateContext&&(f.activeTab="qa"),f.ownerCandidates=n,f.materialList=i,f.materialPrefix=i.prefix,f.drafts.settingsKeywords=o.topic.analysisKeywords,f.drafts.owner=o.topic.owner,f.drafts.ownerConfirmName="",f.loading=!1,U("\u4E13\u9898\u6210\u679C\u548C\u8D44\u6599\u5DF2\u66F4\u65B0\u3002"),M()}catch(o){if(Ua(o))return;f.loading=!1,Ce(o),M()}}async function xi(e){let t=qa("materials");ft(!1);try{f.materialPrefix=e,f.materialList=null,f.activeTab="materials",M();let r=await $a(e,t);if(t.aborted)return;f.materialList=r,f.materialPrefix=r.prefix,U("\u8D44\u6599\u76EE\u5F55\u5DF2\u66F4\u65B0\u3002"),M()}catch(r){if(Ua(r))return;Ce(r),M()}}async function $a(e,t){let r=new Map,o=new Map,i=null;do{let n=new URLSearchParams({prefix:e});i&&n.set("cursor",i);let a=await be(`/list?${n.toString()}`,{signal:t});a.folders.forEach(s=>r.set(s.path,s)),a.files.forEach(s=>o.set(s.path,s)),i=a.nextCursor}while(i&&!t?.aborted);return{prefix:e,folders:[...r.values()],files:[...o.values()],nextCursor:null}}function og(e){["qa","outputs","materials","agent","settings"].includes(e)&&(e==="settings"&&!Pr()||e==="agent"&&!f.topic?.canGenerateContext||(ft(!1),f.activeTab=e,M()))}async function ig(){f.mode==="topic"&&f.topic?f.activeTab==="materials"?await xi(f.materialPrefix||f.topic.topic.prefix):await vi(f.topic.topic.prefix,f.activeTab):await fo()}async function ng(){await be("/logout",{method:"POST"}).catch(()=>null),gi.forEach(e=>e.abort()),ft(!1),f.mode="login",f.overview=null,f.topic=null,f.pendingSettingsPublish=!1,f.ownerCandidates=null,U("\u5DF2\u9000\u51FA\u767B\u5F55\u3002"),M()}function ag(){ft(!1),f.mode="create",f.topic=null,f.pendingSettingsPublish=!1,f.materialList=null,U("\u586B\u5199\u4E13\u9898\u540D\u79F0\u548C\u5206\u6790\u53E3\u5F84\uFF0C\u7CFB\u7EDF\u4F1A\u521B\u5EFA\u6210\u679C\u76EE\u5F55\u3002"),M(),queueMicrotask(()=>document.querySelector('[name="topicName"]')?.focus())}async function sg(){if(f.topic?.canGenerateContext)try{f.busyAction="agent-context-task",U("\u6B63\u5728\u751F\u6210\u5B8C\u6574 Context \u4EFB\u52A1..."),M();let e=await be("/agent-context-task",{method:"POST",body:{prefix:f.topic.topic.prefix}});await $d(e.prompt),U(`\u5B8C\u6574 Context \u4EFB\u52A1\u5DF2\u590D\u5236\u3002\u7A33\u5B9A\u8D44\u6599 ${e.fileCount||0} \u4E2A\uFF0C\u56DE\u4F20\u6388\u6743 ${e.uploadExpiresIn||0} \u79D2\u5185\u6709\u6548\u3002`,"success")}catch(e){Ce(e)}finally{f.busyAction=null,M()}}async function lg(e){try{let t=await Na(e);await $d(t.url),U("\u77ED\u65F6\u6210\u679C\u94FE\u63A5\u5DF2\u590D\u5236\u3002","success")}catch(t){Ce(t)}M()}async function Rd(e){try{let t=await Na(e);window.location.href=t.url}catch(t){Ce(t),M()}}async function ug(e,t){let r=Ig(e);if(!r){U("\u627E\u4E0D\u5230\u8981\u9884\u89C8\u7684\u6587\u4EF6\u3002","danger"),M();return}let o=hi(r);if(o==="none"){await Rd(e);return}if(o==="pdf"&&f.preview?.kind==="pdf"&&f.preview.file.path===e){ft();return}let i=++Mr;Ba=t,f.preview={file:r,kind:o,title:r.name,loading:!0,failed:!1},M();try{let n=await Na(e);if(i!==Mr)return;if(o==="pdf"){if(await import("./drive-assets/pdf-preview-54AYI7R5.js"),i!==Mr)return;f.preview={file:r,kind:o,title:r.name,url:n.url,loading:!1,failed:!1}}else if(o==="markdown"||o==="text"){let a=await fetch(n.url);if(!a.ok)throw new Error(`\u9884\u89C8\u8BFB\u53D6\u5931\u8D25\uFF1A${a.status}`);let s=await a.text(),l=o==="markdown"?jh.render(s):`<pre>${Ng(s)}</pre>`;if(i!==Mr)return;f.preview={file:r,kind:o,title:r.name,renderedHtml:Xo.sanitize(l),loading:!1,failed:!1}}else f.preview={file:r,kind:o,title:r.name,url:n.url,loading:!1,failed:!1};M()}catch(n){if(i!==Mr)return;Ce(n),f.preview={file:r,kind:o,title:r.name,loading:!1,failed:!0},M()}}function ft(e=!0){Mr+=1;let t=e?Ba:null;f.preview=null,Ba=null,M(),t?.isConnected&&queueMicrotask(()=>t.focus())}function Dd(e){f.pendingDelete=e,f.deleteConfirmText="",M(),queueMicrotask(()=>document.querySelector("[data-delete-confirm-input]")?.focus())}function Pd(){f.pendingDelete=null,f.deleteConfirmText="",M()}async function cg(){let e=f.pendingDelete;if(!(!e||f.deleteConfirmText!==e.name)){Pd();try{if(e.type==="topic"){U("\u6B63\u5728\u5220\u9664\u4E13\u9898...");let t=await be("/topic",{method:"DELETE",body:{prefix:e.prefix,confirmName:e.name}});U(`\u4E13\u9898\u5DF2\u5220\u9664\uFF0C\u5171\u5220\u9664 ${t.deletedCount||0} \u4E2A\u5BF9\u8C61\u3002`,"success"),await fo()}else if(e.path&&f.topic){await be("/object",{method:"DELETE",body:{path:e.path}});let t=_d(f.activeTab,e.path,f.topic.topic.prefix);U("\u6587\u4EF6\u5DF2\u5220\u9664\u3002","success"),t==="topic"?await vi(f.topic.topic.prefix,f.activeTab):await xi(f.materialPrefix)}}catch(t){Ce(t),M()}}}async function zd(e,t){if(!e.length||!f.topic)return;let r=f.topic.topic.prefix,o=f.activeTab==="materials"&&f.materialPrefix||r;if(!o.startsWith(`${r}\u8D44\u6599/`)&&!o.startsWith(`${r}\u5468\u62A5/`)){U("\u8BF7\u5148\u8FDB\u5165\u201C\u8D44\u6599\u201D\u6216\u201C\u5468\u62A5\u201D\u76EE\u5F55\u518D\u4E0A\u4F20\u3002","danger"),M();return}let i=e.map(a=>({file:a,relativePath:Ad(t(a))})),n=null;try{let a=await dg(i,o);if(a.length&&!window.confirm(`\u5C06\u8986\u76D6 ${a.length} \u4E2A\u540C\u8DEF\u5F84\u540C\u540D\u6587\u4EF6\u3002\u662F\u5426\u7EE7\u7EED\u4E0A\u4F20\uFF1F`))return;f.upload={active:!0,name:"\u51C6\u5907\u4E0A\u4F20...",percent:0,overallPercent:0,total:i.length},M();let s=new Map,l=[];n=new Go({autoProceed:!1}),n.use(Qr,{endpoint:async g=>{let m=Array.isArray(g)?g[0]:g,h=String(m.meta.relativePath||m.name),x=m.data,y=await be("/upload-url",{method:"POST",body:{prefix:o,filename:m.name,relativePath:h,size:x?.size||0,contentType:m.type||"application/octet-stream"}});return s.set(m.id,y),y.url},method:"PUT",formData:!1,limit:3,headers:g=>({"content-type":g.type||"application/octet-stream"}),getResponseData:()=>({})}),n.on("upload-progress",(g,m)=>{!g||!m.bytesTotal||(f.upload={...f.upload,name:String(g.meta.relativePath||g.name),percent:Math.round(m.bytesUploaded/m.bytesTotal*100)},M())}),n.on("progress",g=>{f.upload.active&&(f.upload={...f.upload,overallPercent:g},M())}),n.on("upload-success",g=>{if(!g)return;let m=s.get(g.id);if(!m)return;let h=g.data;l.push({path:m.path,size:h?.size||0,contentType:m.contentType,kind:m.path.startsWith(`${r}outputs/`)?"output":"material"})}),i.forEach(g=>{n?.addFile({name:g.file.name,type:g.file.type||"application/octet-stream",data:g.file,meta:{relativePath:g.relativePath}})});let u=await n.upload();for(let g=0;g<l.length;g+=1e3)await be("/upload-complete",{method:"POST",body:{files:l.slice(g,g+1e3)}});if(u?.failed?.length)throw new Error(`${u.failed.length} \u4E2A\u6587\u4EF6\u4E0A\u4F20\u5931\u8D25\u3002`);f.upload={active:!1,name:"",percent:0,overallPercent:0,total:0},U(`\u4E0A\u4F20\u5B8C\u6210\uFF0C\u5DF2\u767B\u8BB0 ${i.length} \u4E2A\u6587\u4EF6\u3002`,"success");let c=f.topic?.topic.prefix,p=f.materialPrefix||c;c===r&&f.activeTab==="materials"&&p===o?await xi(o):M()}catch(a){f.upload={active:!1,name:"",percent:0,overallPercent:0,total:0},Ce(a),M()}finally{n?.destroy()}}async function dg(e,t){let r=Array.from(new Set(e.map(i=>Ra(i.relativePath)))),o=new Map;return await Promise.all(r.map(async i=>{try{let n=await $a(`${t}${i}`);o.set(i,new Set(n.files.map(a=>a.name)))}catch{o.set(i,new Set)}})),e.filter(i=>o.get(Ra(i.relativePath))?.has(Pa(i.relativePath)))}async function Na(e){return be("/download-url",{method:"POST",body:{path:e}})}async function be(e,t={}){let r={method:t.method||"GET",headers:{"content-type":"application/json"},credentials:"same-origin",signal:t.signal};t.body!==void 0&&(r.body=JSON.stringify(t.body));let o=await fetch(`${qh}${e}`,r),i=await o.json().catch(()=>({}));if(!o.ok){let n=new Error(typeof i.error=="string"?i.error:"\u8BF7\u6C42\u5931\u8D25");throw n.status=o.status,n}return i}function qa(e){bi(e);let t=new AbortController;return gi.set(e,t),t.signal}function bi(e){gi.get(e)?.abort(),gi.delete(e)}function M(){ys(C`
      <div class="drive-workspace">
        ${pg()}
        <main class="drive-main" aria-live="polite">
          ${fg()}
          ${f.mode==="login"?mg():R}
          ${f.mode==="overview"?hg():R}
          ${f.mode==="create"?gg():R}
          ${f.mode==="topic"?bg():R}
        </main>
        ${Sg()} ${Fg()} ${Lg()} ${Dg()}
      </div>
    `,pt)}function pg(){return C`
    <header class=${ee({"drive-topbar":!0,"is-authenticated":f.mode!=="login"})}>
      <div class="drive-brand-actions">
        <a class="drive-brand" href="/drive" aria-label="返回嘉合杉升专题资料库">
          <img src="./assets/jhss-logo-cropped.png" alt="" aria-hidden="true" width="400" height="501" />
          <span>嘉合杉升专题资料库</span>
        </a>
        ${f.mode!=="login"?Or("\u9000\u51FA\u767B\u5F55","ph-sign-out","logout",!1,"","drive-logout-button"):R}
      </div>
      <nav class="drive-nav" aria-label="专题资料库导航"><a href="./index.html">${P("house")}返回首页</a></nav>
    </header>
  `}function fg(){return!f.status&&!f.upload.active&&!f.loading?R:C`
    <section class="drive-system-row" aria-live="polite">
      <div
        class=${ee({"drive-status-line":!0,"is-danger":f.statusTone==="danger","is-success":f.statusTone==="success"})}
      >
        ${P(f.loading?"circle-notch":"info","regular",f.loading?"drive-spin":"")}
        <span>${f.status||"\u6B63\u5728\u5904\u7406..."}</span>
      </div>
      ${zg()}
    </section>
  `}function mg(){return C`
    <section class="drive-login-panel" aria-labelledby="drive-login-title">
      <div><h1 id="drive-login-title">专题资料库</h1></div>
      <form class="drive-form drive-login-card" data-login-form>
        <label class="drive-field">
          <span>登录姓名</span>
          <input data-draft="loginName" name="displayName" type="text" autocomplete="name" .value=${f.drafts.loginName} required />
          <small>上传和设置记录会显示该姓名。</small>
        </label>
        <label class="drive-field">
          <span>访问码</span>
          <input data-draft="accessCode" name="accessCode" type="password" autocomplete="current-password" .value=${f.drafts.accessCode} required />
          <small>登录态会定时失效，请勿在公共设备保存访问码。</small>
        </label>
        <button class="drive-control drive-control-primary" type="submit" ?disabled=${f.loading}>
          ${P("arrow-right","bold")}进入资料库
        </button>
      </form>
    </section>
  `}function hg(){if(f.loading&&!f.overview)return Mg();let e=f.overview?.topics||[],t=e.some(r=>r.hasCurrentContext);return C`
    <section class="drive-dashboard">
      <div class="drive-page-head">
        <div><h1>专题资料库</h1></div>
        <div class="drive-head-actions">
          ${Or("\u5237\u65B0","ph-arrow-clockwise","refresh")}
          ${Or("\u65B0\u5EFA\u4E13\u9898","ph-folder-plus","create-view",!0)}
        </div>
      </div>
      <div class="drive-two-column">
        <drive-ai-qa scope="global" .ready=${t}></drive-ai-qa>
        <section class="drive-panel">
          <div class="drive-panel-head"><h2>专题队列</h2><span>${e.length?"\u6309\u6700\u8FD1\u4EA4\u4ED8\u6392\u5E8F":"\u7B49\u5F85\u521B\u5EFA"}</span></div>
          ${e.length?Ut(e,r=>r.prefix,Cg):Zt("ph-folder-plus","\u8FD8\u6CA1\u6709\u4E13\u9898","\u521B\u5EFA\u7B2C\u4E00\u4E2A\u4E13\u9898\u540E\uFF0C\u7CFB\u7EDF\u4F1A\u51C6\u5907\u6210\u679C\u76EE\u5F55\u3002")}
        </section>
      </div>
    </section>
  `}function gg(){return C`
    <section class="drive-create-layout">
      <div class="drive-page-head"><div><h1>创建专题</h1></div>${Or("\u8FD4\u56DE","ph-arrow-left","back-overview")}</div>
      <form class="drive-form drive-create-card" data-create-form>
        <label class="drive-field">
          <span>专题名称</span>
          <input data-draft="topicName" name="topicName" type="text" autocomplete="off" .value=${f.drafts.topicName} required />
        </label>
        <label class="drive-field">
          <span>全局分析口径（他人不可修改）</span>
          ${Bd()}
          <textarea data-draft="createKeywords" name="analysisKeywords" rows="10" .value=${f.drafts.createKeywords} required></textarea>
        </label>
        <div class="drive-form-actions">
          <button class="drive-control" type="button" data-action="cancel-create">${P("x-circle")}取消</button>
          <button class="drive-control drive-control-primary" type="submit" ?disabled=${f.loading}>
            ${P("check","bold")}创建专题
          </button>
        </div>
      </form>
    </section>
  `}function bg(){if(f.loading||!f.topic)return Rg();let e=f.topic.topic;return C`
    <section class="drive-topic-workbench">
      <div class="drive-topic-headline">
        <button class="drive-link-button" type="button" data-action="back-overview">${P("arrow-left")}成果概览</button>
        <div class="drive-topic-title-row">
          <div><h1>${e.name}</h1><p>${e.analysisKeywords||"\u5C1A\u672A\u586B\u5199\u5206\u6790\u53E3\u5F84\u3002"}</p></div>
          <div class="drive-topic-meta">
            <span>专题负责人 ${e.owner||"-"}</span><span>更新 ${Ma(e.updatedAt)}</span><span>${e.prefix}</span>
          </div>
        </div>
      </div>
      <div class="drive-tabs" role="tablist" aria-label="专题工作区">
        ${po("qa","\u95EE\u7B54","ph-chat-circle-dots")}${po("materials","\u8D44\u6599","ph-files")}${po("outputs","\u6210\u679C","ph-package")}${f.topic.canGenerateContext?po("agent","Agent","ph-terminal-window"):R}${Pr()?po("settings","\u8BBE\u7F6E","ph-sliders-horizontal"):R}
      </div>
      ${f.activeTab==="qa"?yg():R}
      ${f.activeTab==="agent"&&f.topic.canGenerateContext?wg():R}
      ${f.activeTab==="materials"?xg():R}
      ${f.activeTab==="outputs"?vg():R}
      ${f.activeTab==="settings"&&Pr()?kg():R}
    </section>
  `}function Pr(e=f.topic){return!!e?.canEditAnalysisScope}function vg(){let e=Sd(f.topic?.outputs||[]);return C`
    <section class="drive-tab-panel" role="tabpanel" aria-label="成果">
      <div class="drive-panel-head"><h2>专题成果</h2><span>${e.length} 个文件</span></div>
      ${e.length?Eg(e,{outputMode:!0,empty:""}):Zt("ph-package","\u8FD9\u4E2A\u4E13\u9898\u8FD8\u6CA1\u6709\u6210\u679C","\u4E13\u9898\u8D1F\u8D23\u4EBA\u53EF\u5728 Agent \u4E2D\u590D\u5236\u5355\u4E00\u4EFB\u52A1\uFF0C\u751F\u6210 Markdown Context\u3002")}
    </section>
  `}function xg(){let e=f.materialList,t=f.topic?.topic.prefix||"",r=Ia(e?.folders||[]),o=Oa(e?.files||[]),i=e?Fd(e.folders,e.files):!1,n=f.materialPrefix||t,a=n===t,s=n.startsWith(`${t}\u8D44\u6599/`),l=n.startsWith(`${t}\u5468\u62A5/`),u=s||l;return C`
    <section class="drive-tab-panel" role="tabpanel" aria-label="资料">
      <div class="drive-material-toolbar">
        <div><h2>资料库</h2>${_g(f.materialPrefix||t)}</div>
        ${u?C`<div class="drive-upload-actions">
              <button class="drive-control drive-control-primary drive-upload-trigger" type="button" data-action="request-file-upload">
                ${P("upload-simple","bold")}上传文件
              </button>
              <button class="drive-control drive-upload-trigger" type="button" data-action="request-folder-upload">
                ${P("folder-simple-plus")}上传文件夹
              </button>
              <input data-file-input type="file" multiple hidden />
              <input data-folder-input type="file" webkitdirectory multiple hidden />
            </div>`:R}
      </div>
      ${a?C`<div class="drive-category-grid">
            <button type="button" class="drive-category-card" data-action="open-folder" data-path=${`${t}\u8D44\u6599/`}>
              ${P("books","duotone","ui-icon-lg")}<span><strong>资料</strong><small>稳定资料，纳入 Context 方法论生成</small></span>${P("arrow-right")}
            </button>
            <button type="button" class="drive-category-card" data-action="open-folder" data-path=${`${t}\u5468\u62A5/`}>
              ${P("calendar-dots","duotone","ui-icon-lg")}<span><strong>周报</strong><small>持续更新，首版不参与网页 AI 问答</small></span>${P("arrow-right")}
            </button>
          </div>
          <wa-callout class="drive-agent-callout" variant="neutral"><span slot="icon">${P("info")}</span>根目录历史文件继续按稳定资料兼容读取；新上传请先进入“资料”或“周报”。</wa-callout>`:R}
      ${l?C`<wa-callout class="drive-agent-callout" variant="warning"><span slot="icon">${P("warning")}</span>周报当前仅用于资料维护，暂未纳入网页 AI 问答。</wa-callout>`:R}
      ${e?i?Zt("ph-files","\u5F53\u524D\u76EE\u5F55\u6CA1\u6709\u8D44\u6599\u3002",""):Tg(r,o):ja()}
    </section>
  `}function wg(){let e=!!f.topic?.topic.analysisKeywords.trim();return C`
    <section class="drive-tab-panel" role="tabpanel" aria-label="Agent">
      ${e?R:C`<wa-callout class="drive-agent-callout" variant="warning"><span slot="icon">${P("warning")}</span>请先由专题负责人在设置中填写分析口径，再执行 Agent 流程。</wa-callout>`}
      <div class="drive-agent-grid drive-agent-grid-single">
        <div class="drive-agent-card">
          <h2>生成完整网页 Context</h2>
          <p>复制后交给本地 Agent。任务会读取全部稳定资料，直接生成、验证并回传一份详尽的 UTF-8 Markdown Context；周报不会进入本次分析。</p>
          <button class="drive-control drive-control-primary" type="button" data-action="agent-context-task" ?disabled=${!e||f.busyAction!==null}>
            ${P("clipboard-text","bold")}${f.busyAction==="agent-context-task"?"\u6B63\u5728\u751F\u6210...":"\u590D\u5236\u5B8C\u6574 Context \u4EFB\u52A1"}
          </button>
        </div>
      </div>
    </section>
  `}function yg(){let e=!!f.topic?.hasCurrentContext,t=f.topic?.topic;return C`<section class="drive-tab-panel drive-qa-panel" role="tabpanel" aria-label="问答">
    <drive-ai-qa scope="topic" .prefix=${t?.prefix||""} .topicName=${t?.name||""} .ready=${e}></drive-ai-qa>
  </section>`}function kg(){if(!f.topic)return R;let e=f.topic.canEditAnalysisScope,t=Array.from(new Set([f.topic.topic.owner,...f.ownerCandidates?.candidates||[]]));return C`
    <section class="drive-tab-panel" role="tabpanel" aria-label="设置">
      <form class="drive-form drive-settings-form" data-settings-form>
        <label class="drive-field">
          <span>全局分析口径（他人不可修改）</span>
          ${Bd()}
          <textarea data-draft="settingsKeywords" name="analysisKeywords" rows="10" .value=${f.drafts.settingsKeywords} ?readonly=${!e} required></textarea>
        </label>
        <div class="drive-form-actions">
          ${e?C`<button class="drive-control drive-control-primary" type="submit" ?disabled=${f.loading}>${P("broadcast","bold")}确认并发布分析口径</button>`:R}
          ${f.topic.canDeleteTopic?C`<button class="drive-control drive-control-danger" type="button" data-action="delete-topic">${P("trash")}删除专题</button>`:R}
        </div>
        <section class="drive-owner-settings" aria-label="专题负责人设置">
          <h3>专题负责人</h3>
          <p>当前负责人：<strong>${f.topic.topic.owner||"-"}</strong>。转交后管理权限立即生效，原负责人将失去专题管理权限。</p>
          ${f.topic.canTransferTopicOwner?C`
                <label class="drive-field">
                  <span>新负责人</span>
                  <select data-draft="owner" .value=${f.drafts.owner}>
                    ${t.map(r=>C`<option value=${r}>${r}</option>`)}
                  </select>
                </label>
                <label class="drive-field">
                  <span>输入完整专题名确认</span>
                  <input data-draft="ownerConfirmName" .value=${f.drafts.ownerConfirmName} placeholder=${f.topic.topic.name} />
                </label>
                <button class="drive-control drive-control-primary" type="button" data-action="transfer-owner" ?disabled=${f.loading}>
                  ${P("user-switch","bold")}转交负责人
                </button>
              `:R}
        </section>
        ${f.ownerCandidates?.canManage?C`
              <section class="drive-owner-settings" aria-label="负责人候选名单管理">
                <h3>负责人候选名单</h3>
                <p>候选姓名来自成功登录记录。正在负责专题的用户无法移除。</p>
                <div class="drive-owner-candidates">
                  ${t.map(r=>C`
                      <span class="drive-owner-candidate">
                        <span>${r}</span>
                        ${r!=="\u6C6A\u65ED"&&r!==f.topic?.topic.owner?C`<button class="drive-icon-button" type="button" data-action="remove-owner-candidate" data-name=${r} aria-label=${`\u79FB\u9664\u5019\u9009 ${r}`}>${P("x")}</button>`:R}
                      </span>
                    `)}
                </div>
              </section>
            `:R}
      </form>
    </section>
  `}function Cg(e){return C`
    <article class="drive-topic-card">
      <div><button class="drive-title-button" type="button" data-action="open-topic" data-prefix=${e.prefix}>${e.name}</button><p>${e.analysisKeywords||"\u5C1A\u672A\u586B\u5199\u5206\u6790\u53E3\u5F84\u3002"}</p></div>
      <div class="drive-topic-card-meta"><span>专题负责人 ${e.owner||"-"}</span><span>${e.outputCount} 个成果</span><span>更新 ${Td(e.updatedAt)}</span></div>
    </article>
  `}function Eg(e,t){return e.length?C`
    <div class="drive-file-table" role="table">
      <div class="drive-file-row drive-file-row-head" role="row"><span>名称</span><span>类型</span><span>成果创建者</span><span>更新</span><span>操作</span></div>
      ${Ut(e,r=>r.path,r=>C`${Od(r,t.outputMode)}${Id(r.path,!0)}`)}
    </div>
  `:t.empty?Zt("ph-files",t.empty,""):R}function Tg(e,t){return!e.length&&!t.length?R:C`
    <div class="drive-file-table" role="table">
      <div class="drive-file-row drive-file-row-head" role="row"><span>名称</span><span>类型</span><span>上传者</span><span>更新</span><span>操作</span></div>
      ${Ut(e,r=>r.path,Ag)}
      ${Ut(t,r=>r.path,r=>C`${Od(r,!1)}${Id(r.path,!0)}`)}
    </div>
  `}function Ag(e){return C`
    <div class="drive-file-row" role="row">
      <span class="drive-file-name" data-label="名称">${P("folder")}<span>${e.name}</span></span>
      <span data-label="类型">文件夹</span>
      <span data-label="上传者">-</span>
      <span data-label="更新">-</span>
      <span class="drive-row-actions" data-label="操作">${Rr("\u6253\u5F00","open-folder",e.path)}</span>
    </div>
  `}function Od(e,t){return C`
    <div class="drive-file-row" role="row">
      <span class="drive-file-name" data-label="名称">${P(Ed(e))}<span>${e.name}</span></span>
      <span data-label="类型">${Cd(e)}</span>
      <span data-label=${t?"\u6210\u679C\u521B\u5EFA\u8005":"\u4E0A\u4F20\u8005"}>${e.uploadedBy||"-"}</span>
      <span data-label="更新">${Ma(e.uploadedAt||e.lastModified)}</span>
      <span class="drive-row-actions" data-label="操作">
        ${t&&f.topic?.topic.featuredOutputPath===e.path?C`<span class="drive-featured-badge">${P("star-fill")}精选</span>`:R}
        ${t&&f.topic?.canManageFeaturedOutput&&za(e)&&f.topic.topic.featuredOutputPath!==e.path?Rr("\u8BBE\u4E3A\u7CBE\u9009","set-featured",e.path):R}
        ${za(e)?Rr("\u9884\u89C8","preview",e.path):R}${t?Rr("\u94FE\u63A5","copy-link",e.path):R}${Rr("\u4E0B\u8F7D","download",e.path)}${Rr("\u5220\u9664","delete-file",e.path,e.name,!0)}
      </span>
    </div>
  `}function Id(e,t=!1){let r=f.preview;if(!r||r.kind!=="pdf"||r.file.path!==e)return R;let o=r.loading?ja():r.failed||!r.url?Zt("ph-eye-slash","\u65E0\u6CD5\u9884\u89C8","\u8BF7\u4E0B\u8F7D\u6587\u4EF6\u540E\u67E5\u770B\u3002"):C`<drive-pdf-preview .url=${r.url} .title=${r.title}></drive-pdf-preview>`;return C`<div class=${ee({"drive-inline-preview":!0,"is-table-row":t})}>${o}</div>`}function _g(e){let t=f.topic?.topic.prefix||"",r=e.split("/").filter(Boolean),o=[{label:f.topic?.topic.name||"\u4E13\u9898",path:t}],i="";return r.forEach(n=>{i+=`${n}/`,i!==t&&o.push({label:n,path:i})}),C`
    <nav class="drive-breadcrumbs" aria-label="当前资料目录">
      ${o.map((n,a)=>C`${a?C`<span>/</span>`:R}<button type="button" data-action="open-folder" data-path=${n.path}>${n.label}</button>`)}
    </nav>
  `}function Sg(){let e=f.preview;if(!e||e.kind==="pdf"||f.mode==="overview")return R;let t=e.loading?ja():e.failed?Zt("ph-eye-slash","\u65E0\u6CD5\u9884\u89C8","\u8BF7\u4E0B\u8F7D\u6587\u4EF6\u540E\u67E5\u770B\u3002"):e.renderedHtml?C`<article class="drive-preview-markdown">${Ko(e.renderedHtml)}</article>`:e.url?C`<iframe class="drive-preview-frame" src=${e.url} title=${e.title} sandbox referrerpolicy="no-referrer"></iframe>`:Zt("ph-eye-slash","\u65E0\u6CD5\u9884\u89C8","\u8BF7\u4E0B\u8F7D\u6587\u4EF6\u540E\u67E5\u770B\u3002");return C`
    <wa-drawer data-preview-drawer open placement="end" label=${e.title} style="--size: min(980px, 94vw);">
      <div class="drive-preview-body">${t}</div>
      <div slot="footer" class="drive-drawer-footer">${Or("\u590D\u5236\u94FE\u63A5","ph-link","copy-link",!1,e.file.path)}${Or("\u4E0B\u8F7D","ph-download-simple","download",!0,e.file.path)}</div>
    </wa-drawer>
  `}function Fg(){if(!f.pendingDelete)return R;let e=f.pendingDelete,t=e.type==="topic"?"\u786E\u8BA4\u5220\u9664\u4E13\u9898":"\u786E\u8BA4\u5220\u9664\u6587\u4EF6",r=e.type==="topic"?`\u5C06\u6C38\u4E45\u5220\u9664\u4E13\u9898\u300C${e.name}\u300D\u53CA\u5176\u5168\u90E8\u8D44\u6599\u3001\u63D0\u793A\u8BCD\u3001\u6210\u679C\u548C\u4E34\u65F6 manifest\u3002\u6B64\u64CD\u4F5C\u4E0D\u53EF\u6062\u590D\u3002`:`\u5C06\u6C38\u4E45\u5220\u9664\u300C${e.name}\u300D\u3002\u6B64\u64CD\u4F5C\u4E0D\u4F1A\u5220\u9664\u5176\u4ED6\u6587\u4EF6\uFF0C\u4F46\u65E0\u6CD5\u4ECE\u8D44\u6599\u5E93\u6062\u590D\u3002`;return C`
    <wa-dialog data-delete-dialog open label=${t} style="--width: min(520px, 94vw);">
      <div class="drive-delete-body">
        <p>${r}</p>
        <label class="drive-field"><span>请输入完整${e.type==="topic"?"\u4E13\u9898\u540D":"\u6587\u4EF6\u540D"}以确认删除</span><input data-delete-confirm-input type="text" autocomplete="off" .value=${f.deleteConfirmText} /></label>
      </div>
      <div slot="footer" class="drive-dialog-actions">
        <button class="drive-control" type="button" data-action="cancel-delete">${P("x-circle")}取消</button>
        <button class="drive-control drive-control-danger" type="button" data-action="confirm-delete" ?disabled=${f.deleteConfirmText!==e.name}>${P("trash","bold")}永久删除</button>
      </div>
    </wa-dialog>
  `}function Lg(){return!f.pendingSettingsPublish||!Pr()?R:C`
    <wa-dialog data-settings-confirm-dialog open label="确认发布分析口径" style="--width: min(520px, 94vw);">
      <div class="drive-delete-body">
        <p>修改后的分析口径将立即推送并展示给所有人，同时用于后续 Agent 分析。保存前请确认内容准确。</p>
      </div>
      <div slot="footer" class="drive-dialog-actions">
        <button class="drive-control" type="button" data-action="cancel-settings-publish">${P("x-circle")}取消</button>
        <button class="drive-control drive-control-primary" type="button" data-action="confirm-settings-publish">${P("check","bold")}确认发布</button>
      </div>
    </wa-dialog>
  `}function Dg(){return f.pendingUploadSelection?C`
    <wa-dialog data-upload-reminder-dialog open label="上传提示" style="--width: min(520px, 94vw);">
      <div class="drive-delete-body">
        <p>如需上传大量文件，建议分多次上传，以提高上传成功率并便于确认进度。</p>
      </div>
      <div slot="footer" class="drive-dialog-actions">
        <button class="drive-control" type="button" data-action="cancel-upload">${P("x-circle")}取消</button>
        <button class="drive-control drive-control-primary" type="button" data-action="continue-upload">${P("check","bold")}继续上传</button>
      </div>
    </wa-dialog>
  `:R}function zg(){return f.upload.active?C`
    <div class="drive-upload-progress">
      <div class="drive-upload-progress-item">
        <div class="drive-upload-progress-label"><strong>当前文件 · ${f.upload.name}</strong><span>${f.upload.percent}%</span></div>
        <wa-progress-bar aria-label="当前文件上传进度" .value=${f.upload.percent}></wa-progress-bar>
      </div>
      ${f.upload.total>1?C`
            <div class="drive-upload-progress-item">
              <div class="drive-upload-progress-label"><strong>总体进度</strong><span>${f.upload.overallPercent}% · ${f.upload.total} 个文件</span></div>
              <wa-progress-bar aria-label="总体上传进度" .value=${f.upload.overallPercent}></wa-progress-bar>
            </div>
          `:R}
    </div>
  `:R}function Mg(){return C`<section class="drive-dashboard">${Pg()}<div class="drive-two-column">${[1,2].map(()=>C`<div class="drive-skeleton drive-skeleton-panel"></div>`)}</div></section>`}function Rg(){return C`<section class="drive-topic-workbench"><div class="drive-skeleton drive-skeleton-title"></div><div class="drive-skeleton drive-skeleton-tabs"></div><div class="drive-skeleton drive-skeleton-panel"></div></section>`}function Pg(){return C`<div class="drive-page-head"><div class="drive-skeleton drive-skeleton-title"></div><div class="drive-skeleton drive-skeleton-button"></div></div>`}function ja(){return C`<div class="drive-inline-skeleton" aria-hidden="true"><span></span><span></span><span></span></div>`}function Bd(){return C`<small>应尽可能详细说明分析该专题的方法论</small>`}function Zt(e,t,r){return C`<div class="drive-empty">${P(e,"duotone","ui-icon-lg")}<h3>${t}</h3>${r?C`<p>${r}</p>`:R}</div>`}function po(e,t,r){let o=f.activeTab===e;return C`<button class=${ee({"drive-tab":!0,"is-active":o})} type="button" role="tab" aria-selected=${String(o)} tabindex=${o?"0":"-1"} data-action="tab" data-tab=${e}>${P(r)}${t}</button>`}function Or(e,t,r,o=!1,i="",n=""){return C`<button class=${`drive-control ${o?"drive-control-primary":""} ${n}`} type="button" data-action=${r} data-path=${i}>${P(t,o?"bold":"regular")}${e}</button>`}function Rr(e,t,r,o="",i=!1){let n={"open-folder":"folder-open",preview:"eye","copy-link":"link",download:"download-simple","delete-file":"trash","set-featured":"star"};return C`<button class=${ee({"drive-table-action":!0,"is-danger":i})} type="button" data-action=${t} data-path=${r} data-name=${o}>${P(n[t]||"arrow-right")}${e}</button>`}function U(e,t="neutral"){f.status=e,f.statusTone=t}function it(e,t=""){f.loading=e,t&&U(t),M()}function Ce(e){U(e instanceof Error?e.message:"\u8BF7\u6C42\u5931\u8D25","danger")}function Og(e){if(!e.topics.length)return"\u8FD8\u6CA1\u6709\u4E13\u9898\u3002";let t=e.topics.reduce((r,o)=>r+o.outputCount,0);return`\u5DF2\u52A0\u8F7D ${e.topics.length} \u4E2A\u4E13\u9898\uFF0C${t} \u4E2A\u6210\u679C\u3002`}function Ig(e){let t=f.topic?.outputs||[],r=f.materialList?.files||[],o=(f.overview?.topics||[]).flatMap(i=>i.featuredOutput?[i.featuredOutput]:[]);return[...t,...r,...o].find(i=>i.path===e)}async function Bg(e){if(f.topic?.canManageFeaturedOutput)try{U("\u6B63\u5728\u66F4\u65B0\u7CBE\u9009\u6210\u679C..."),f.topic=await be("/topic",{method:"PUT",body:{prefix:f.topic.topic.prefix,featuredOutputPath:e}}),U("\u7CBE\u9009\u6210\u679C\u5DF2\u66F4\u65B0\u3002","success"),M()}catch(t){Ce(t),M()}}function $g(e){return!!(e&&typeof e=="object"&&"status"in e&&e.status===401)}function Ua(e){return e instanceof DOMException&&e.name==="AbortError"}async function $d(e){await navigator.clipboard.writeText(e)}function Ng(e){return String(e??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;")}
