const e=["transitionend","transitioncancel"];let t,n;const r=(e=!0)=>{const r=Object.assign({height:"",overflow:"hidden",transitionDuration:".25s",transitionTimingFunction:"ease"},n);e?Object.assign(t.style,r):Object.keys(r).forEach(e=>t.style[e]="")},s=n=>new Promise(s=>{r();const i=["0px",window.getComputedStyle(t).height];"up"===n&&i.reverse();const[o,a]=i;new Promise(n=>{const r=function(){var s;s=r,e.forEach(e=>{t.removeEventListener(e,s)}),n()};var s;s=r,e.forEach(e=>{t.addEventListener(e,s)})}).then(()=>{r(!1),s()}),t.style.height=o,requestAnimationFrame(()=>{requestAnimationFrame(()=>{t.style.height=a})})}),i=function(e,r={}){try{return t=e,n=r,e.dataset.isSlidOpen="1",e.style.display="block",Promise.resolve(s("down")).then(function(){return Promise.resolve(!0)})}catch(e){return Promise.reject(e)}},o=function(e,r={}){try{return t=e,n=r,Promise.resolve(s("up")).then(function(){return delete e.dataset.isSlidOpen,e.style.display="none",Promise.resolve(!1)})}catch(e){return Promise.reject(e)}},a=(e,r={})=>(t=e,n=r,e.dataset.isSlidOpen?o(e,r):i(e,r));export{i as down,a as toggle,o as up};