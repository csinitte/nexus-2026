/** Shared between the pre-hydration script and the client intro. */
export const INTRO_SEEN_KEY = 'nexus26-intro';
export const INTRO_SKIP_STYLE_ID = 'nexus-intro-prepaint';

/** Hide the intro before hydration when this visit should skip it. */
export const INTRO_PRE_PAINT = `try{var p=new URLSearchParams(location.search);var skip=p.get('intro')==='0'||matchMedia('(prefers-reduced-motion: reduce)').matches||(sessionStorage.getItem('${INTRO_SEEN_KEY}')==='seen'&&p.get('intro')!=='1');if(skip){var s=document.createElement('style');s.id='${INTRO_SKIP_STYLE_ID}';s.textContent='.nx-intro{display:none!important}';document.head.appendChild(s)}}catch(e){}`;
