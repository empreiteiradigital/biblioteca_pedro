/*
 swiped-events.js - v@version@
 Pure JavaScript swipe events
 https://github.com/john-doherty/swiped-events
 @inspiration https://stackoverflow.com/questions/16348031/disable-scrolling-when-touch-moving-certain-element
 @author John Doherty <www.johndoherty.info>
 @license MIT
*/
(function(n,e){function q(a,b,c){for(;a&&a!==e.documentElement;){var f=a.getAttribute(b);if(f)return f;a=a.parentNode}return c}"function"!==typeof n.CustomEvent&&(n.CustomEvent=function(a,b){b=b||{bubbles:!1,cancelable:!1,detail:void 0};var c=e.createEvent("CustomEvent");c.initCustomEvent(a,b.bubbles,b.cancelable,b.detail);return c},n.CustomEvent.prototype=n.Event.prototype);e.addEventListener("touchstart",function(a){"true"!==a.target.getAttribute("data-swipe-ignore")&&(d=a.target,p=Date.now(),g=
a.touches[0].clientX,h=a.touches[0].clientY,k=l=0)},!1);e.addEventListener("touchmove",function(a){if(g&&h){var b=a.touches[0].clientY;l=g-a.touches[0].clientX;k=h-b}},!1);e.addEventListener("touchend",function(a){if(d===a.target){var b=parseInt(q(d,"data-swipe-threshold","20"),10),c=parseInt(q(d,"data-swipe-timeout","500"),10),f=Date.now()-p,m="";a=a.changedTouches||a.touches||[];Math.abs(l)>Math.abs(k)?Math.abs(l)>b&&f<c&&(m=0<l?"swiped-left":"swiped-right"):Math.abs(k)>b&&f<c&&(m=0<k?"swiped-up":
"swiped-down");""!==m&&(b={dir:m.replace(/swiped-/,""),xStart:parseInt(g,10),xEnd:parseInt((a[0]||{}).clientX||-1,10),yStart:parseInt(h,10),yEnd:parseInt((a[0]||{}).clientY||-1,10)},d.dispatchEvent(new CustomEvent("swiped",{bubbles:!0,cancelable:!0,detail:b})),d.dispatchEvent(new CustomEvent(m,{bubbles:!0,cancelable:!0,detail:b})));p=h=g=null}},!1);var g=null,h=null,l=null,k=null,p=null,d=null})(window,document);
