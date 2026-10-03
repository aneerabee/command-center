/* Finite, viewport-triggered explanation. No simulated traffic or counters. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const observed = new Set();
  const seen = new WeakSet();
  const selector = '.rel-flow,.ws-company-branches,.ws-path-item,.ws-relation-hint';
  function play(element) {
    if (reduced.matches || !element.animate) return;
    element.getAnimations({subtree:true}).forEach(animation=>animation.cancel());
    const connector = element.querySelector('.rel-connector i,.ws-relation-trace');
    const nodes = [...element.querySelectorAll('.rel-node')];
    const timing = {duration:650,easing:'cubic-bezier(.2,.7,.2,1)'};
    if (connector) connector.animate([{transform:'scaleX(0)',opacity:.3},{transform:'scaleX(1)',opacity:1}],timing);
    if (nodes.length) nodes.forEach((node,index)=>node.animate([{opacity:.55,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{...timing,delay:index*200}));
    else element.animate([{opacity:.65,transform:'translateY(4px)'},{opacity:1,transform:'none'}],timing);
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries=>{
    entries.filter(entry=>entry.isIntersecting).forEach(({target})=>{
      observer.unobserve(target); observed.delete(target); seen.add(target); play(target);
    });
  },{threshold:.15}) : null;
  let queued = false;
  function scan() {
    queued=false;
    for (const element of observed) if (!element.isConnected) { observer?.unobserve(element); observed.delete(element); }
    document.querySelectorAll(selector).forEach(element=>{
      if (seen.has(element) || observed.has(element)) return;
      if (observer) { observed.add(element); observer.observe(element); }
      else { seen.add(element); play(element); }
    });
  }
  new MutationObserver(()=>{
    if (!queued) { queued=true; requestAnimationFrame(scan); }
  }).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',event=>{
    const button=event.target instanceof Element && event.target.closest('[data-relation-replay]');
    if (button) button.closest('.rel-explanation')?.querySelectorAll('.rel-flow').forEach(play);
  });
  reduced.addEventListener('change',()=>{
    if (reduced.matches) document.querySelectorAll(selector).forEach(element=>element.getAnimations({subtree:true}).forEach(animation=>animation.cancel()));
  });
  scan();
})();
