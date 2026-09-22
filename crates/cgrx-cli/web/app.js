var WT=Object.create;var Vy=Object.defineProperty;var qT=Object.getOwnPropertyDescriptor;var YT=Object.getOwnPropertyNames;var jT=Object.getPrototypeOf,ZT=Object.prototype.hasOwnProperty;var ns=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var KT=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of YT(t))!ZT.call(e,s)&&s!==n&&Vy(e,s,{get:()=>t[s],enumerable:!(i=qT(t,s))||i.enumerable});return e};var Kn=(e,t,n)=>(n=e!=null?WT(jT(e)):{},KT(t||!e||!e.__esModule?Vy(n,"default",{value:e,enumerable:!0}):n,e));var e_=ns(Vt=>{"use strict";var $p=Symbol.for("react.transitional.element"),JT=Symbol.for("react.portal"),$T=Symbol.for("react.fragment"),QT=Symbol.for("react.strict_mode"),tw=Symbol.for("react.profiler"),ew=Symbol.for("react.consumer"),nw=Symbol.for("react.context"),iw=Symbol.for("react.forward_ref"),sw=Symbol.for("react.suspense"),aw=Symbol.for("react.memo"),Yy=Symbol.for("react.lazy"),rw=Symbol.for("react.activity"),ow=Symbol.for("react.view_transition"),ky=Symbol.iterator;function lw(e){return e===null||typeof e!="object"?null:(e=ky&&e[ky]||e["@@iterator"],typeof e=="function"?e:null)}var jy={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},Zy=Object.assign,Ky={};function to(e,t,n){this.props=e,this.context=t,this.refs=Ky,this.updater=n||jy}to.prototype.isReactComponent={};to.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};to.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function Jy(){}Jy.prototype=to.prototype;function Qp(e,t,n){this.props=e,this.context=t,this.refs=Ky,this.updater=n||jy}var tm=Qp.prototype=new Jy;tm.constructor=Qp;Zy(tm,to.prototype);tm.isPureReactComponent=!0;var Xy=Array.isArray;function Jp(){}var De={H:null,A:null,T:null,S:null},$y=Object.prototype.hasOwnProperty;function em(e,t,n){var i=n.ref;return{$$typeof:$p,type:e,key:t,ref:i!==void 0?i:null,props:n}}function cw(e,t){return em(e.type,t,e.props)}function nm(e){return typeof e=="object"&&e!==null&&e.$$typeof===$p}function uw(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var Wy=/\/+/g;function Kp(e,t){return typeof e=="object"&&e!==null&&e.key!=null?uw(""+e.key):t.toString(36)}function hw(e){switch(e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:switch(typeof e.status=="string"?e.then(Jp,Jp):(e.status="pending",e.then(function(t){e.status==="pending"&&(e.status="fulfilled",e.value=t)},function(t){e.status==="pending"&&(e.status="rejected",e.reason=t)})),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason}}throw e}function Qr(e,t,n,i,s){var a=typeof e;(a==="undefined"||a==="boolean")&&(e=null);var r=!1;if(e===null)r=!0;else switch(a){case"bigint":case"string":case"number":r=!0;break;case"object":switch(e.$$typeof){case $p:case JT:r=!0;break;case Yy:return r=e._init,Qr(r(e._payload),t,n,i,s)}}if(r)return s=s(e),r=i===""?"."+Kp(e,0):i,Xy(s)?(n="",r!=null&&(n=r.replace(Wy,"$&/")+"/"),Qr(s,t,n,"",function(c){return c})):s!=null&&(nm(s)&&(s=cw(s,n+(s.key==null||e&&e.key===s.key?"":(""+s.key).replace(Wy,"$&/")+"/")+r)),t.push(s)),1;r=0;var o=i===""?".":i+":";if(Xy(e))for(var l=0;l<e.length;l++)i=e[l],a=o+Kp(i,l),r+=Qr(i,t,n,a,s);else if(l=lw(e),typeof l=="function")for(e=l.call(e),l=0;!(i=e.next()).done;)i=i.value,a=o+Kp(i,l++),r+=Qr(i,t,n,a,s);else if(a==="object"){if(typeof e.then=="function")return Qr(hw(e),t,n,i,s);throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.")}return r}function Xu(e,t,n){if(e==null)return e;var i=[],s=0;return Qr(e,i,"","",function(a){return t.call(n,a,s++)}),i}function dw(e){if(e._status===-1){var t=e._result,n=t();n.then(function(i){(e._status===0||e._status===-1)&&(e._status=1,e._result=i,n.status===void 0&&(n.status="fulfilled",n.value=i))},function(i){(e._status===0||e._status===-1)&&(e._status=2,e._result=i,n.status===void 0&&(n.status="rejected",n.reason=i))}),e._status===-1&&(e._status=0,e._result=n)}if(e._status===1)return e._result.default;throw e._result}var qy=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function Qy(e){var t=De.T,n={};n.types=t!==null?t.types:null,De.T=n;try{var i=e(),s=De.S;s!==null&&s(n,i),typeof i=="object"&&i!==null&&typeof i.then=="function"&&i.then(Jp,qy)}catch(a){qy(a)}finally{t!==null&&n.types!==null&&(t.types=n.types),De.T=t}}function t_(e){var t=De.T;if(t!==null){var n=t.types;n===null?t.types=[e]:n.indexOf(e)===-1&&n.push(e)}else Qy(t_.bind(null,e))}var fw={map:Xu,forEach:function(e,t,n){Xu(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return Xu(e,function(){t++}),t},toArray:function(e){return Xu(e,function(t){return t})||[]},only:function(e){if(!nm(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};Vt.Activity=rw;Vt.Children=fw;Vt.Component=to;Vt.Fragment=$T;Vt.Profiler=tw;Vt.PureComponent=Qp;Vt.StrictMode=QT;Vt.Suspense=sw;Vt.ViewTransition=ow;Vt.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=De;Vt.__COMPILER_RUNTIME={__proto__:null,c:function(e){return De.H.useMemoCache(e)}};Vt.addTransitionType=t_;Vt.cache=function(e){return function(){return e.apply(null,arguments)}};Vt.cacheSignal=function(){return null};Vt.cloneElement=function(e,t,n){if(e==null)throw Error("The argument must be a React element, but you passed "+e+".");var i=Zy({},e.props),s=e.key;if(t!=null)for(a in t.key!==void 0&&(s=""+t.key),t)!$y.call(t,a)||a==="key"||a==="__self"||a==="__source"||a==="ref"&&t.ref===void 0||(i[a]=t[a]);var a=arguments.length-2;if(a===1)i.children=n;else if(1<a){for(var r=Array(a),o=0;o<a;o++)r[o]=arguments[o+2];i.children=r}return em(e.type,s,i)};Vt.createContext=function(e){return e={$$typeof:nw,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:ew,_context:e},e};Vt.createElement=function(e,t,n){var i,s={},a=null;if(t!=null)for(i in t.key!==void 0&&(a=""+t.key),t)$y.call(t,i)&&i!=="key"&&i!=="__self"&&i!=="__source"&&(s[i]=t[i]);var r=arguments.length-2;if(r===1)s.children=n;else if(1<r){for(var o=Array(r),l=0;l<r;l++)o[l]=arguments[l+2];s.children=o}if(e&&e.defaultProps)for(i in r=e.defaultProps,r)s[i]===void 0&&(s[i]=r[i]);return em(e,a,s)};Vt.createRef=function(){return{current:null}};Vt.forwardRef=function(e){return{$$typeof:iw,render:e}};Vt.isValidElement=nm;Vt.lazy=function(e){return{$$typeof:Yy,_payload:{_status:-1,_result:e},_init:dw}};Vt.memo=function(e,t){return{$$typeof:aw,type:e,compare:t===void 0?null:t}};Vt.startTransition=Qy;Vt.unstable_useCacheRefresh=function(){return De.H.useCacheRefresh()};Vt.use=function(e){return De.H.use(e)};Vt.useActionState=function(e,t,n){return De.H.useActionState(e,t,n)};Vt.useCallback=function(e,t){return De.H.useCallback(e,t)};Vt.useContext=function(e){return De.H.useContext(e)};Vt.useDebugValue=function(){};Vt.useDeferredValue=function(e,t){return De.H.useDeferredValue(e,t)};Vt.useEffect=function(e,t){return De.H.useEffect(e,t)};Vt.useEffectEvent=function(e){return De.H.useEffectEvent(e)};Vt.useId=function(){return De.H.useId()};Vt.useImperativeHandle=function(e,t,n){return De.H.useImperativeHandle(e,t,n)};Vt.useInsertionEffect=function(e,t){return De.H.useInsertionEffect(e,t)};Vt.useLayoutEffect=function(e,t){return De.H.useLayoutEffect(e,t)};Vt.useMemo=function(e,t){return De.H.useMemo(e,t)};Vt.useOptimistic=function(e,t){return De.H.useOptimistic(e,t)};Vt.useReducer=function(e,t,n){return De.H.useReducer(e,t,n)};Vt.useRef=function(e){return De.H.useRef(e)};Vt.useState=function(e){return De.H.useState(e)};Vt.useSyncExternalStore=function(e,t,n){return De.H.useSyncExternalStore(e,t,n)};Vt.useTransition=function(){return De.H.useTransition()};Vt.version="19.3.0"});var la=ns((pI,n_)=>{"use strict";n_.exports=e_()});var r_=ns(Yu=>{"use strict";var pw=Symbol.for("react.transitional.element"),mw=Symbol.for("react.fragment");function a_(e,t,n){var i=null;if(n!==void 0&&(i=""+n),t.key!==void 0&&(i=""+t.key),"key"in t){n={};for(var s in t)s!=="key"&&(n[s]=t[s])}else n=t;return t=n.ref,{$$typeof:pw,type:e,key:i,ref:t!==void 0?t:null,props:n}}Yu.Fragment=mw;Yu.jsx=a_;Yu.jsxs=a_});var Ds=ns((xI,o_)=>{"use strict";o_.exports=r_()});var T_=ns(He=>{"use strict";function dm(e,t){var n=e.length;e.push(t);t:for(;0<n;){var i=n-1>>>1,s=e[i];if(0<$u(s,t))e[i]=t,e[n]=s,n=i;else break t}}function is(e){return e.length===0?null:e[0]}function th(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;t:for(var i=0,s=e.length,a=s>>>1;i<a;){var r=2*(i+1)-1,o=e[r],l=r+1,c=e[l];if(0>$u(o,n))l<s&&0>$u(c,o)?(e[i]=c,e[l]=n,i=l):(e[i]=o,e[r]=n,i=r);else if(l<s&&0>$u(c,n))e[i]=c,e[l]=n,i=l;else break t}}return t}function $u(e,t){var n=e.sortIndex-t.sortIndex;return n!==0?n:e.id-t.id}He.unstable_now=void 0;typeof performance=="object"&&typeof performance.now=="function"?(g_=performance,He.unstable_now=function(){return g_.now()}):(cm=Date,v_=cm.now(),He.unstable_now=function(){return cm.now()-v_});var g_,cm,v_,Ls=[],ca=[],Sw=1,Ei=null,Nn=3,fm=!1,kl=!1,Xl=!1,pm=!1,x_=typeof setTimeout=="function"?setTimeout:null,b_=typeof clearTimeout=="function"?clearTimeout:null,y_=typeof setImmediate<"u"?setImmediate:null;function Qu(e){for(var t=is(ca);t!==null;){if(t.callback===null)th(ca);else if(t.startTime<=e)th(ca),t.sortIndex=t.expirationTime,dm(Ls,t);else break;t=is(ca)}}function mm(e){if(Xl=!1,Qu(e),!kl)if(is(Ls)!==null)kl=!0,no||(no=!0,eo());else{var t=is(ca);t!==null&&gm(mm,t.startTime-e)}}var no=!1,Wl=-1,S_=5,M_=-1;function E_(){return pm?!0:!(He.unstable_now()-M_<S_)}function um(){if(pm=!1,no){var e=He.unstable_now();M_=e;var t=!0;try{t:{kl=!1,Xl&&(Xl=!1,b_(Wl),Wl=-1),fm=!0;var n=Nn;try{e:{for(Qu(e),Ei=is(Ls);Ei!==null&&!(Ei.expirationTime>e&&E_());){var i=Ei.callback;if(typeof i=="function"){Ei.callback=null,Nn=Ei.priorityLevel;var s=i(Ei.expirationTime<=e);if(e=He.unstable_now(),typeof s=="function"){Ei.callback=s,Qu(e),t=!0;break e}Ei===is(Ls)&&th(Ls),Qu(e)}else th(Ls);Ei=is(Ls)}if(Ei!==null)t=!0;else{var a=is(ca);a!==null&&gm(mm,a.startTime-e),t=!1}}break t}finally{Ei=null,Nn=n,fm=!1}t=void 0}}finally{t?eo():no=!1}}}var eo;typeof y_=="function"?eo=function(){y_(um)}:typeof MessageChannel<"u"?(hm=new MessageChannel,__=hm.port2,hm.port1.onmessage=um,eo=function(){__.postMessage(null)}):eo=function(){x_(um,0)};var hm,__;function gm(e,t){Wl=x_(function(){e(He.unstable_now())},t)}He.unstable_IdlePriority=5;He.unstable_ImmediatePriority=1;He.unstable_LowPriority=4;He.unstable_NormalPriority=3;He.unstable_Profiling=null;He.unstable_UserBlockingPriority=2;He.unstable_cancelCallback=function(e){e.callback=null};He.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):S_=0<e?Math.floor(1e3/e):5};He.unstable_getCurrentPriorityLevel=function(){return Nn};He.unstable_next=function(e){switch(Nn){case 1:case 2:case 3:var t=3;break;default:t=Nn}var n=Nn;Nn=t;try{return e()}finally{Nn=n}};He.unstable_requestPaint=function(){pm=!0};He.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=Nn;Nn=e;try{return t()}finally{Nn=n}};He.unstable_scheduleCallback=function(e,t,n){var i=He.unstable_now();switch(typeof n=="object"&&n!==null?(n=n.delay,n=typeof n=="number"&&0<n?i+n:i):n=i,e){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=n+s,e={id:Sw++,callback:t,priorityLevel:e,startTime:n,expirationTime:s,sortIndex:-1},n>i?(e.sortIndex=n,dm(ca,e),is(Ls)===null&&e===is(ca)&&(Xl?(b_(Wl),Wl=-1):Xl=!0,gm(mm,n-i))):(e.sortIndex=s,dm(Ls,e),kl||fm||(kl=!0,no||(no=!0,eo()))),e};He.unstable_shouldYield=E_;He.unstable_wrapCallback=function(e){var t=Nn;return function(){var n=Nn;Nn=t;try{return e.apply(this,arguments)}finally{Nn=n}}}});var A_=ns((II,w_)=>{"use strict";w_.exports=T_()});var N_=ns(Dn=>{"use strict";var Mw=la();function R_(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function ua(){}var zn={d:{f:ua,r:function(){throw Error(R_(522))},D:ua,C:ua,L:ua,m:ua,X:ua,S:ua,M:ua},p:0,findDOMNode:null},Ew=Symbol.for("react.portal"),Tw=Symbol.for("react.recoverable"),C_=Symbol.for("react.optimistic_key");function ww(e,t,n){var i=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:Ew,key:i==null?null:i===C_?C_:""+i,children:e,containerInfo:t,implementation:n}}var ql=Mw.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function eh(e,t){if(e==="font")return"";if(typeof t=="string")return t==="use-credentials"?t:""}Dn.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=zn;Dn.browser=function(e){return{$$typeof:Tw,_reason:e}};Dn.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(R_(299));return ww(e,t,null,n)};Dn.flushSync=function(e){var t=ql.T,n=zn.p;try{if(ql.T=null,zn.p=2,e)return e()}finally{ql.T=t,zn.p=n,zn.d.f()}};Dn.preconnect=function(e,t){typeof e=="string"&&(t?(t=t.crossOrigin,t=typeof t=="string"?t==="use-credentials"?t:"":void 0):t=null,zn.d.C(e,t))};Dn.prefetchDNS=function(e){typeof e=="string"&&zn.d.D(e)};Dn.preinit=function(e,t){if(typeof e=="string"&&t&&typeof t.as=="string"){var n=t.as,i=eh(n,t.crossOrigin),s=typeof t.integrity=="string"?t.integrity:void 0,a=typeof t.fetchPriority=="string"?t.fetchPriority:void 0;n==="style"?zn.d.S(e,typeof t.precedence=="string"?t.precedence:void 0,{crossOrigin:i,integrity:s,fetchPriority:a}):n==="script"&&zn.d.X(e,{crossOrigin:i,integrity:s,fetchPriority:a,nonce:typeof t.nonce=="string"?t.nonce:void 0})}};Dn.preinitModule=function(e,t){if(typeof e=="string")if(typeof t=="object"&&t!==null){if(t.as==null||t.as==="script"){var n=eh(t.as,t.crossOrigin);zn.d.M(e,{crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0})}}else t==null&&zn.d.M(e)};Dn.preload=function(e,t){if(typeof e=="string"&&typeof t=="object"&&t!==null&&typeof t.as=="string"){var n=t.as,i=eh(n,t.crossOrigin);zn.d.L(e,n,{crossOrigin:i,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,type:typeof t.type=="string"?t.type:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy=="string"?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet=="string"?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes=="string"?t.imageSizes:void 0,media:typeof t.media=="string"?t.media:void 0})}};Dn.preloadModule=function(e,t){if(typeof e=="string")if(t){var n=eh(t.as,t.crossOrigin);zn.d.m(e,{as:typeof t.as=="string"&&t.as!=="script"?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0})}else zn.d.m(e)};Dn.requestFormReset=function(e){zn.d.r(e)};Dn.unstable_batchedUpdates=function(e,t){return e(t)};Dn.useFormState=function(e,t,n){return ql.H.useFormState(e,t,n)};Dn.useFormStatus=function(){return ql.H.useHostTransitionStatus()};Dn.version="19.3.0"});var U_=ns((OI,L_)=>{"use strict";function D_(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(D_)}catch(e){console.error(e)}}D_(),L_.exports=N_()});var _1=ns(Od=>{"use strict";var ln=A_(),yb=la(),Aw=U_();function st(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function _b(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function Uc(e){for(var t=e,n=t;n&&!n.alternate;)t=n,(t.flags&4098)!==0&&(e=t.return),n=t.return;for(;t.return;)t=t.return;return t.tag===3?e:null}function xb(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function bb(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function I_(e){if(Uc(e)!==e)throw Error(st(188))}function Cw(e){var t=e.alternate;if(!t){if(t=Uc(e),t===null)throw Error(st(188));return t!==e?null:e}for(var n=e,i=t;;){var s=n.return;if(s===null)break;var a=s.alternate;if(a===null){if(i=s.return,i!==null){n=i;continue}break}if(s.child===a.child){for(a=s.child;a;){if(a===n)return I_(s),e;if(a===i)return I_(s),t;a=a.sibling}throw Error(st(188))}if(n.return!==i.return)n=s,i=a;else{for(var r=!1,o=s.child;o;){if(o===n){r=!0,n=s,i=a;break}if(o===i){r=!0,i=s,n=a;break}o=o.sibling}if(!r){for(o=a.child;o;){if(o===n){r=!0,n=a,i=s;break}if(o===i){r=!0,i=a,n=s;break}o=o.sibling}if(!r)throw Error(st(189))}}if(n.alternate!==i)throw Error(st(190))}if(n.tag!==3)throw Error(st(188));return n.stateNode.current===n?e:t}function Sb(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=Sb(e),t!==null)return t;e=e.sibling}return null}function ni(e,t,n,i,s,a){for(;e!==null;){if((e.tag===5||e.tag===27||e.tag===6)&&n(e,i,s,a)||(e.tag!==22||e.memoizedState===null)&&(t||e.tag!==5&&e.tag!==27)&&ni(e.child,t,n,i,s,a))return!0;e=e.sibling}return!1}function Cr(e){for(e=e.return;e!==null;){if(e.tag===3||e.tag===5||e.tag===27)return e;e=e.return}return null}function P_(e){var t=!1;for(e=e.return;e!==null&&(e.tag===4&&(t=!0),!(e.tag===3||e.tag===5||e.tag===27));)e=e.return;return t}function Mb(e){var t=[null,null],n=Cr(e);return n===null||Eb(t,e,n.child,{foundSelf:!1}),t}function Eb(e,t,n,i){for(;n!==null;){if(n===t)i.foundSelf=!0;else if(n.tag===5||n.tag===27||n.tag===6){if(i.foundSelf)return e[1]=n,!0;e[0]=n}else if((n.tag!==22||n.memoizedState===null)&&Eb(e,t,n.child,i))return!0;n=n.sibling}return!1}function on(e){switch(e.tag){case 5:case 27:case 6:return e.stateNode;case 3:return e.stateNode.containerInfo;default:throw Error(st(559))}}var co=null,jm=null;function Rw(e,t,n){return e===n?!0:e===t?(co=e,!0):!1}function Nw(e,t,n){return e===n?(jm=e,!1):e===t?(jm!==null&&(co=e),!0):!1}function O_(e){if(e===null)return null;do e=e===null?null:e.return;while(e&&e.tag!==5&&e.tag!==27&&e.tag!==3);return e||null}function Zm(e,t,n){for(var i=0,s=e;s;s=n(s))i++;s=0;for(var a=t;a;a=n(a))s++;for(;0<i-s;)e=n(e),i--;for(;0<s-i;)t=n(t),s--;for(;i--;){if(e===t||t!==null&&e===t.alternate)return e;e=n(e),t=n(t)}return null}var Ce=Object.assign,Dw=Symbol.for("react.element"),nh=Symbol.for("react.transitional.element"),Ql=Symbol.for("react.portal"),uo=Symbol.for("react.fragment"),Tb=Symbol.for("react.strict_mode"),Km=Symbol.for("react.profiler"),wb=Symbol.for("react.consumer"),cs=Symbol.for("react.context"),a0=Symbol.for("react.forward_ref"),Jm=Symbol.for("react.suspense"),$m=Symbol.for("react.suspense_list"),r0=Symbol.for("react.memo"),pa=Symbol.for("react.lazy");Symbol.for("react.scope");var Qm=Symbol.for("react.activity"),Lw=Symbol.for("react.legacy_hidden");Symbol.for("react.tracing_marker");var Uw=Symbol.for("react.memo_cache_sentinel"),tg=Symbol.for("react.view_transition"),Iw=Symbol.for("react.recoverable"),B_=Symbol.iterator;function Yl(e){return e===null||typeof e!="object"?null:(e=B_&&e[B_]||e["@@iterator"],typeof e=="function"?e:null)}var Pw=Symbol.for("react.client.reference");function eg(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===Pw?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case uo:return"Fragment";case Km:return"Profiler";case Tb:return"StrictMode";case Jm:return"Suspense";case $m:return"SuspenseList";case Qm:return"Activity";case tg:return"ViewTransition"}if(typeof e=="object")switch(e.$$typeof){case Ql:return"Portal";case cs:return e.displayName||"Context";case wb:return(e._context.displayName||"Context")+".Consumer";case a0:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case r0:return t=e.displayName||null,t!==null?t:eg(e.type)||"Memo";case pa:t=e._payload,e=e._init;try{return eg(e(t))}catch{}}return null}var tc=Array.isArray,Ft=yb.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,fe=Aw.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,mr={pending:!1,data:null,method:null,action:null},ng=[],ho=-1;function gs(e){return{current:e}}function Sn(e){0>ho||(e.current=ng[ho],ng[ho]=null,ho--)}function Pe(e,t){ho++,ng[ho]=e.current,e.current=t}var fs=gs(null),vc=gs(null),Ma=gs(null),Vh=gs(null);function kh(e,t){switch(Pe(Ma,t),Pe(vc,e),Pe(fs,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?Jx(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=Jx(t),e=jM(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}Sn(fs),Pe(fs,e)}function Lo(){Sn(fs),Sn(vc),Sn(Ma)}function ig(e){var t=e.memoizedState;t!==null&&(Vo._currentValue=t.memoizedState,Pe(Vh,e)),t=fs.current;var n=jM(t,e.type);t!==n&&(Pe(vc,e),Pe(fs,n))}function Xh(e){vc.current===e&&(Sn(fs),Sn(vc)),Vh.current===e&&(Sn(Vh),Vo._currentValue=mr)}var vm,z_;function da(e){if(vm===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);vm=t&&t[1]||"",z_=-1<n.stack.indexOf(`
    at`)?" (<anonymous>)":-1<n.stack.indexOf("@")?"@unknown:0:0":""}return`
`+vm+e+z_}var ym=!1;function _m(e,t){if(!e||ym)return"";ym=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var i={DetermineComponentFrameRoot:function(){try{if(t){var d=function(){throw Error()};if(Object.defineProperty(d.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(d,[])}catch(m){var h=m}Reflect.construct(e,[],d)}else{try{d.call()}catch(m){h=m}d=!1;try{var p=Object.getOwnPropertyDescriptor(e.prototype,"props");Object.defineProperty(e.prototype,"props",{configurable:!0,set:function(){throw Error()}}),d=!0,new e}finally{d&&(p!==void 0?Object.defineProperty(e.prototype,"props",p):delete e.prototype.props)}}}else{try{throw Error()}catch(m){h=m}(d=e())&&typeof d.catch=="function"&&d.catch(function(){})}}catch(m){if(m&&h&&typeof m.stack=="string")return[m.stack,h.stack]}return[null,null]}};i.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var s=Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot,"name");s&&s.configurable&&Object.defineProperty(i.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var a=i.DetermineComponentFrameRoot(),r=a[0],o=a[1];if(r&&o){var l=r.split(`
`),c=o.split(`
`);for(s=i=0;i<l.length&&!l[i].includes("DetermineComponentFrameRoot");)i++;for(;s<c.length&&!c[s].includes("DetermineComponentFrameRoot");)s++;if(i===l.length||s===c.length)for(i=l.length-1,s=c.length-1;1<=i&&0<=s&&l[i]!==c[s];)s--;for(;1<=i&&0<=s;i--,s--)if(l[i]!==c[s]){if(i!==1||s!==1)do if(i--,s--,0>s||l[i]!==c[s]){var u=`
`+l[i].replace(" at new "," at ");return e.displayName&&u.includes("<anonymous>")&&(u=u.replace("<anonymous>",e.displayName)),u}while(1<=i&&0<=s);break}}}finally{ym=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:"")?da(n):""}function Ow(e,t){switch(e.tag){case 26:case 27:case 5:return da(e.type);case 16:return da("Lazy");case 13:return e.child!==t&&t!==null?da("Suspense Fallback"):da("Suspense");case 19:return da("SuspenseList");case 0:case 15:return _m(e.type,!1);case 11:return _m(e.type.render,!1);case 1:return _m(e.type,!0);case 31:return da("Activity");case 30:return da("ViewTransition");default:return""}}function F_(e){try{var t="",n=null;do t+=Ow(e,n),n=e,e=e.return;while(e);return t}catch(i){return`
Error generating stack: `+i.message+`
`+i.stack}}var sg=Object.prototype.hasOwnProperty,o0=ln.unstable_scheduleCallback,xm=ln.unstable_cancelCallback,Bw=ln.unstable_shouldYield,zw=ln.unstable_requestPaint,hi=ln.unstable_now,Fw=ln.unstable_getCurrentPriorityLevel,Ab=ln.unstable_ImmediatePriority,Cb=ln.unstable_UserBlockingPriority,Wh=ln.unstable_NormalPriority,Gw=ln.unstable_LowPriority,Rb=ln.unstable_IdlePriority,Hw=ln.log,Vw=ln.unstable_setDisableYieldValue,Ic=null,di=null;function va(e){if(typeof Hw=="function"&&Vw(e),di&&typeof di.setStrictMode=="function")try{di.setStrictMode(Ic,e)}catch{}}var fi=Math.clz32?Math.clz32:Ww,kw=Math.log,Xw=Math.LN2;function Ww(e){return e>>>=0,e===0?32:31-(kw(e)/Xw|0)|0}var ih=256,sh=262144,ah=4194304;function ur(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&-e;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function vd(e,t,n){var i=e.pendingLanes;if(i===0)return 0;var s=0,a=e.suspendedLanes,r=e.pingedLanes;e=e.warmLanes;var o=i&134217727;return o!==0?(i=o&~a,i!==0?s=ur(i):(r&=o,r!==0?s=ur(r):n||(n=o&~e,n!==0&&(s=ur(n))))):(o=i&~a,o!==0?s=ur(o):r!==0?s=ur(r):n||(n=i&~e,n!==0&&(s=ur(n)))),s===0?0:t!==0&&t!==s&&(t&a)===0&&(a=s&-s,n=t&-t,a>=n||a===32&&(n&4194048)!==0)?t:s}function Pc(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function Nb(e,t){(t&8)!==0&&(t|=t&32);var n=e.entangledLanes;if(n!==0)for(e=e.entanglements,n&=t;0<n;){var i=31-fi(n),s=1<<i;t|=e[i],n&=~s}return t}function qw(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function Db(){var e=ah;return ah<<=1,(ah&62914560)===0&&(ah=4194304),e}function bm(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function Oc(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function Yw(e,t,n,i,s,a){var r=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var o=e.entanglements,l=e.expirationTimes,c=e.hiddenUpdates;for(n=r&~n;0<n;){var u=31-fi(n),d=1<<u;o[u]=0,l[u]=-1;var h=c[u];if(h!==null)for(c[u]=null,u=0;u<h.length;u++){var p=h[u];p!==null&&(p.lane&=-536870913)}n&=~d}i!==0&&Lb(e,i,0),a!==0&&s===0&&e.tag!==0&&(e.suspendedLanes|=a&~(r&~t))}function Lb(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var i=31-fi(t);e.entangledLanes|=t,e.entanglements[i]=e.entanglements[i]|1073741824|n&261930}function Ub(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var i=31-fi(n),s=1<<i;s&t|e[i]&t&&(e[i]|=t),n&=~s}}function Ib(e,t){var n=t&-t;return n=(n&42)!==0?1:l0(n),(n&(e.suspendedLanes|t))!==0?0:n}function l0(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function c0(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function Pb(){var e=fe.p;return e!==0?e:(e=window.event,e===void 0?32:g1(e.type))}function G_(e,t){var n=fe.p;try{return fe.p=e,t()}finally{fe.p=n}}var Ws=Math.random().toString(36).slice(2),xn="__reactFiber$"+Ws,ii="__reactProps$"+Ws,Wo="__reactContainer$"+Ws,H_="__reactEvents$"+Ws,jw="__reactListeners$"+Ws,Zw="__reactHandles$"+Ws,V_="__reactResources$"+Ws,Bc="__reactMarker$"+Ws,qh="__reactLoad$"+Ws;function yd(e){delete e[xn],delete e[ii],delete e[jw],delete e[Zw]}function fr(e){var t;if(t=e[xn])return t;for(var n=e.parentNode;n;){if(t=n[Wo]||n[xn]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=ab(e);e!==null;){if(n=e[xn])return n;e=ab(e)}return t}e=n,n=e.parentNode}return null}function qo(e){if(e=e[xn]||e[Wo]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function ec(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(st(33))}function So(e){var t=e[V_];return t||(t=e[V_]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function pn(e){e[Bc]=!0}function Ob(e){e[qh]=void 0}var Bb=new Set,zb={};function Rr(e,t){Uo(e,t),Uo(e+"Capture",t)}function Uo(e,t){for(zb[e]=t,e=0;e<t.length;e++)Bb.add(t[e])}var Kw=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),k_={},X_={};function Jw(e){return sg.call(X_,e)?!0:sg.call(k_,e)?!1:Kw.test(e)?X_[e]=!0:(k_[e]=!0,!1)}var he=!1;function W_(){var e=he;return he=!1,e}function Mh(e,t,n){if(Jw(t))if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var i=t.toLowerCase().slice(0,5);if(i!=="data-"&&i!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,n)}}function rh(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,n)}}function Us(e,t,n,i){if(i===null)e.removeAttribute(n);else{switch(typeof i){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(n);return}e.setAttributeNS(t,n,i)}}function oi(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function Fb(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function $w(e,t,n){var i=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof i<"u"&&typeof i.get=="function"&&typeof i.set=="function"){var s=i.get,a=i.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return s.call(this)},set:function(r){n=""+r,a.call(this,r)}}),Object.defineProperty(e,t,{enumerable:i.enumerable}),{getValue:function(){return n},setValue:function(r){n=""+r},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function ag(e){if(!e._valueTracker){var t=Fb(e)?"checked":"value";e._valueTracker=$w(e,t,""+e[t])}}function Gb(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),i="";return e&&(i=Fb(e)?e.checked?"true":"false":e.value),e=i,e!==n?(t.setValue(e),!0):!1}var Qw=/[\n"\\]/g;function Ri(e){return e.replace(Qw,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function rg(e,t,n,i,s,a,r,o){e.name="",r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"?e.type=r:e.removeAttribute("type"),t!=null?r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+oi(t)):e.value!==""+oi(t)&&(e.value=""+oi(t)):r!=="submit"&&r!=="reset"||e.removeAttribute("value"),t!=null?r==="number"&&e.value==t?Sm(e,oi(e.value)):Sm(e,oi(t)):n!=null?Sm(e,oi(n)):i!=null&&e.removeAttribute("value"),s==null&&a!=null&&(e.defaultChecked=!!a),s!=null&&(e.checked=s&&typeof s!="function"&&typeof s!="symbol"),o!=null&&typeof o!="function"&&typeof o!="symbol"&&typeof o!="boolean"?e.name=""+oi(o):e.removeAttribute("name")}function Hb(e,t,n,i,s,a,r,o){if(a!=null&&typeof a!="function"&&typeof a!="symbol"&&typeof a!="boolean"&&(e.type=a),t!=null||n!=null){if(!(a!=="submit"&&a!=="reset"||t!=null)){ag(e);return}n=n!=null?""+oi(n):"",t=t!=null?""+oi(t):n,o||t===e.value||(e.value=t),e.defaultValue=t}i=i??s,i=typeof i!="function"&&typeof i!="symbol"&&!!i,e.checked=o?e.checked:!!i,e.defaultChecked=!!i,r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"&&(e.name=r),ag(e)}function Sm(e,t){e.defaultValue!==""+t&&(e.defaultValue=""+t)}function Mo(e,t,n,i){if(e=e.options,t){t={};for(var s=0;s<n.length;s++)t["$"+n[s]]=!0;for(n=0;n<e.length;n++)s=t.hasOwnProperty("$"+e[n].value),e[n].selected!==s&&(e[n].selected=s),s&&i&&(e[n].defaultSelected=!0)}else{for(n=""+oi(n),t=null,s=0;s<e.length;s++){if(e[s].value===n){e[s].selected=!0,i&&(e[s].defaultSelected=!0);return}t!==null||e[s].disabled||(t=e[s])}t!==null&&(t.selected=!0)}}function Vb(e,t,n){if(t!=null&&(t=""+oi(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n!=null?""+oi(n):""}function kb(e,t,n,i){if(t==null){if(i!=null){if(n!=null)throw Error(st(92));if(tc(i)){if(1<i.length)throw Error(st(93));i=i[0]}n=i}n==null&&(n=""),t=n}n=oi(t),e.defaultValue=n,i=e.textContent,i===n&&i!==""&&i!==null&&(e.value=i),ag(e)}function Io(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var tA=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function q_(e,t,n){var i=t.indexOf("--")===0;n==null||typeof n=="boolean"||n===""?i?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":i?e.setProperty(t,n):typeof n!="number"||n===0||tA.has(t)?t==="float"?e.cssFloat=n:e[t]=(""+n).trim():e[t]=n+"px"}function Xb(e,t,n){if(t!=null&&typeof t!="object")throw Error(st(62));if(e=e.style,n!=null){for(var i in n)!n.hasOwnProperty(i)||t!=null&&t.hasOwnProperty(i)||(i.indexOf("--")===0?e.setProperty(i,""):i==="float"?e.cssFloat="":e[i]="",he=!0);for(var s in t)i=t[s],t.hasOwnProperty(s)&&n[s]!==i&&(q_(e,s,i),he=!0)}else for(var a in t)t.hasOwnProperty(a)&&q_(e,a,t[a])}function u0(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var eA=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),nA=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function Eh(e){return nA.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function us(){}var og=null;function h0(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var fo=null,Eo=null;function Y_(e){var t=qo(e);if(t&&(e=t.stateNode)){var n=e[ii]||null;t:switch(e=t.stateNode,t.type){case"input":if(rg(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll('input[name="'+Ri(""+t)+'"][type="radio"]'),t=0;t<n.length;t++){var i=n[t];if(i!==e&&i.form===e.form){var s=i[ii]||null;if(!s)throw Error(st(90));rg(i,s.value,s.defaultValue,s.defaultValue,s.checked,s.defaultChecked,s.type,s.name)}}for(t=0;t<n.length;t++)i=n[t],i.form===e.form&&Gb(i)}break t;case"textarea":Vb(e,n.value,n.defaultValue);break t;case"select":t=n.value,t!=null&&Mo(e,!!n.multiple,t,!1)}}}var Mm=!1;function Wb(e,t,n){if(Mm)return e(t,n);Mm=!0;try{var i=e(t);return i}finally{if(Mm=!1,(fo!==null||Eo!==null)&&(Ld(),fo&&(t=fo,e=Eo,Eo=fo=null,Y_(t),e)))for(t=0;t<e.length;t++)Y_(e[t])}}function yc(e,t){var n=e.stateNode;if(n===null)return null;var i=n[ii]||null;if(i===null)return null;n=i[t];t:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(e=e.type,i=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!i;break t;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(st(231,t,typeof n));return n}var Fs=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),lg=!1;if(Fs)try{io={},Object.defineProperty(io,"passive",{get:function(){lg=!0}}),window.addEventListener("test",io,io),window.removeEventListener("test",io,io)}catch{lg=!1}var io,ya=null,d0=null,Th=null;function qb(){if(Th)return Th;var e,t=d0,n=t.length,i,s="value"in ya?ya.value:ya.textContent,a=s.length;for(e=0;e<n&&t[e]===s[e];e++);var r=n-e;for(i=1;i<=r&&t[n-i]===s[a-i];i++);return Th=s.slice(e,1<i?1-i:void 0)}function wh(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function oh(){return!0}function j_(){return!1}function Vn(e){function t(n,i,s,a,r){this._reactName=n,this._targetInst=s,this.type=i,this.nativeEvent=a,this.target=r,this.currentTarget=null;for(var o in e)e.hasOwnProperty(o)&&(n=e[o],this[o]=n?n(a):a[o]);return this.isDefaultPrevented=(a.defaultPrevented!=null?a.defaultPrevented:a.returnValue===!1)?oh:j_,this.isPropagationStopped=j_,this}return Ce(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=oh)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=oh)},persist:function(){},isPersistent:oh}),t}var za={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},_d=Vn(za),zc=Ce({},za,{view:0,detail:0}),iA=Vn(zc),Em,Tm,jl,xd=Ce({},zc,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:f0,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==jl&&(jl&&e.type==="mousemove"?(Em=e.screenX-jl.screenX,Tm=e.screenY-jl.screenY):Tm=Em=0,jl=e),Em)},movementY:function(e){return"movementY"in e?e.movementY:Tm}}),Z_=Vn(xd),sA=Ce({},xd,{dataTransfer:0}),aA=Vn(sA),rA=Ce({},zc,{relatedTarget:0}),wm=Vn(rA),oA=Ce({},za,{animationName:0,elapsedTime:0,pseudoElement:0}),lA=Vn(oA),cA=Ce({},za,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),uA=Vn(cA),hA=Ce({},za,{data:0}),K_=Vn(hA),dA={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},fA={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},pA={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function mA(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=pA[e])?!!t[e]:!1}function f0(){return mA}var gA=Ce({},zc,{key:function(e){if(e.key){var t=dA[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=wh(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?fA[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:f0,charCode:function(e){return e.type==="keypress"?wh(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?wh(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),vA=Vn(gA),yA=Ce({},xd,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),J_=Vn(yA),_A=Ce({},za,{submitter:0}),xA=Vn(_A),bA=Ce({},zc,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:f0}),SA=Vn(bA),MA=Ce({},za,{propertyName:0,elapsedTime:0,pseudoElement:0}),EA=Vn(MA),TA=Ce({},xd,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),wA=Vn(TA),AA=Ce({},za,{newState:0,oldState:0,source:0}),CA=Vn(AA),RA=[9,13,27,32],p0=Fs&&"CompositionEvent"in window,sc=null;Fs&&"documentMode"in document&&(sc=document.documentMode);var NA=Fs&&"TextEvent"in window&&!sc,Yb=Fs&&(!p0||sc&&8<sc&&11>=sc),$_=" ",Q_=!1;function jb(e,t){switch(e){case"keyup":return RA.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function Zb(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var po=!1;function DA(e,t){switch(e){case"compositionend":return Zb(t);case"keypress":return t.which!==32?null:(Q_=!0,$_);case"textInput":return e=t.data,e===$_&&Q_?null:e;default:return null}}function LA(e,t){if(po)return e==="compositionend"||!p0&&jb(e,t)?(e=qb(),Th=d0=ya=null,po=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return Yb&&t.locale!=="ko"?null:t.data;default:return null}}var UA={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function tx(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!UA[e.type]:t==="textarea"}function Kb(e,t,n,i){fo?Eo?Eo.push(i):Eo=[i]:fo=i,t=pd(t,"onChange"),0<t.length&&(n=new _d("onChange","change",null,n,i),e.push({event:n,listeners:t}))}var ac=null,_c=null;function IA(e){WM(e,0)}function bd(e){var t=ec(e);if(Gb(t))return e}function ex(e,t){if(e==="change")return t}var Jb=!1;Fs&&(Fs?(ch="oninput"in document,ch||(Am=document.createElement("div"),Am.setAttribute("oninput","return;"),ch=typeof Am.oninput=="function"),lh=ch):lh=!1,Jb=lh&&(!document.documentMode||9<document.documentMode));var lh,ch,Am;function nx(){ac&&(ac.detachEvent("onpropertychange",$b),_c=ac=null)}function $b(e){if(e.propertyName==="value"&&bd(_c)){var t=[];Kb(t,_c,e,h0(e)),Wb(IA,t)}}function PA(e,t,n){e==="focusin"?(nx(),ac=t,_c=n,ac.attachEvent("onpropertychange",$b)):e==="focusout"&&nx()}function OA(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return bd(_c)}function BA(e,t){if(e==="click")return bd(t)}function zA(e,t){if(e==="input"||e==="change")return bd(t)}function FA(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var mi=typeof Object.is=="function"?Object.is:FA;function xc(e,t){if(mi(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),i=Object.keys(t);if(n.length!==i.length)return!1;for(i=0;i<n.length;i++){var s=n[i];if(!sg.call(t,s)||!mi(e[s],t[s]))return!1}return!0}function cg(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function ix(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function sx(e,t){var n=ix(e);e=0;for(var i;n;){if(n.nodeType===3){if(i=e+n.textContent.length,e<=t&&i>=t)return{node:n,offset:t-e};e=i}t:{for(;n;){if(n.nextSibling){n=n.nextSibling;break t}n=n.parentNode}n=void 0}n=ix(n)}}function Qb(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?Qb(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function tS(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=cg(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=cg(e.document)}return t}function m0(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var GA=Fs&&"documentMode"in document&&11>=document.documentMode,mo=null,ug=null,rc=null,hg=!1;function ax(e,t,n){var i=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;hg||mo==null||mo!==cg(i)||(i=mo,"selectionStart"in i&&m0(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),rc&&xc(rc,i)||(rc=i,i=pd(ug,"onSelect"),0<i.length&&(t=new _d("onSelect","select",null,t,n),e.push({event:t,listeners:i}),t.target=mo)))}function lr(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var go={animationend:lr("Animation","AnimationEnd"),animationiteration:lr("Animation","AnimationIteration"),animationstart:lr("Animation","AnimationStart"),transitionrun:lr("Transition","TransitionRun"),transitionstart:lr("Transition","TransitionStart"),transitioncancel:lr("Transition","TransitionCancel"),transitionend:lr("Transition","TransitionEnd")},Cm={},eS={};Fs&&(eS=document.createElement("div").style,"AnimationEvent"in window||(delete go.animationend.animation,delete go.animationiteration.animation,delete go.animationstart.animation),"TransitionEvent"in window||delete go.transitionend.transition);function Nr(e){if(Cm[e])return Cm[e];if(!go[e])return e;var t=go[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in eS)return Cm[e]=t[n];return e}var nS=Nr("animationend"),iS=Nr("animationiteration"),sS=Nr("animationstart"),HA=Nr("transitionrun"),VA=Nr("transitionstart"),kA=Nr("transitioncancel"),aS=Nr("transitionend"),rS=new Map,dg="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");dg.push("scrollEnd");function Vi(e,t){rS.set(e,t),Rr(t,[e])}var XA=0;function Gs(e,t){if(e.name!=null&&e.name!=="auto")return e.name;if(t.autoName!==null)return t.autoName;e=Hi.identifierPrefix;var n=XA++;return e="_"+e+"t_"+n.toString(32)+"_",t.autoName=e}function rx(e){if(e==null||typeof e=="string")return e;var t=null,n=Do;if(n!==null)for(var i=0;i<n.length;i++){var s=e[n[i]];if(s!=null){if(s==="none")return"none";t=t==null?s:t+(" "+s)}}return t??e.default}function qs(e,t){return e=rx(e),t=rx(t),t==null?e==="auto"?null:e:t==="auto"?null:t}var Yh=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},wi=[],vo=0,g0=0;function Sd(){for(var e=vo,t=g0=vo=0;t<e;){var n=wi[t];wi[t++]=null;var i=wi[t];wi[t++]=null;var s=wi[t];wi[t++]=null;var a=wi[t];if(wi[t++]=null,i!==null&&s!==null){var r=i.pending;r===null?s.next=s:(s.next=r.next,r.next=s),i.pending=s}a!==0&&oS(n,s,a)}}function Md(e,t,n,i){wi[vo++]=e,wi[vo++]=t,wi[vo++]=n,wi[vo++]=i,g0|=i,e.lanes|=i,e=e.alternate,e!==null&&(e.lanes|=i)}function v0(e,t,n,i){return Md(e,t,n,i),jh(e)}function Dr(e,t){return Md(e,null,null,t),jh(e)}function oS(e,t,n){e.lanes|=n;var i=e.alternate;i!==null&&(i.lanes|=n);for(var s=!1,a=e.return;a!==null;)a.childLanes|=n,i=a.alternate,i!==null&&(i.childLanes|=n),a.tag===22&&(e=a.stateNode,e===null||e._visibility&1||(s=!0)),e=a,a=a.return;return e.tag===3?(a=e.stateNode,s&&t!==null&&(s=31-fi(n),e=a.hiddenUpdates,i=e[s],i===null?e[s]=[t]:i.push(t),t.lane=n|536870912),a):null}function jh(e){if(50<gc)throw gc=0,Oh=null,Error(st(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var yo={};function WA(e,t,n,i){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function ti(e,t,n,i){return new WA(e,t,n,i)}function y0(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Bs(e,t){var n=e.alternate;return n===null?(n=ti(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&1206910976,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function lS(e,t){e.flags&=1206910978;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function Ah(e,t,n,i,s,a){var r=0;if(i=e,typeof i=="function")y0(i)&&(r=1);else if(typeof i=="string")r=vR(e,n,fs.current)?26:e==="html"||e==="head"||e==="body"?27:5;else t:switch(i){case Qm:return e=ti(31,n,t,s),e.elementType=Qm,e.lanes=a,e;case uo:return gr(n.children,s,a,t);case Tb:r=8,s|=24;break;case Km:return e=ti(12,n,t,s|2),e.elementType=Km,e.lanes=a,e;case Jm:return e=ti(13,n,t,s),e.elementType=Jm,e.lanes=a,e;case $m:return e=ti(19,n,t,s),e.elementType=$m,e.lanes=a,e;case Lw:case tg:return e=s|32,e=ti(30,n,t,e),e.elementType=tg,e.lanes=a,e.stateNode={autoName:null,paired:null,clones:null,ref:null},e;default:if(typeof i=="object"&&i!==null)switch(i.$$typeof){case cs:r=10;break t;case wb:r=9;break t;case a0:r=11;break t;case r0:r=14;break t;case pa:r=16,i=null;break t}r=29,n=Error(st(130,e===null?"null":typeof e,"")),i=null}return t=ti(r,n,t,s),t.elementType=e,t.type=i,t.lanes=a,t}function gr(e,t,n,i){return e=ti(7,e,i,t),e.lanes=n,e}function Rm(e,t,n){return e=ti(6,e,null,t),e.lanes=n,e}function cS(e){var t=ti(18,null,null,0);return t.stateNode=e,t}function Nm(e,t,n){return t=ti(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var ox=new WeakMap;function Ni(e,t){if(typeof e=="object"&&e!==null){var n=ox.get(e);return n!==void 0?n:(t={value:e,source:t,stack:F_(t)},ox.set(e,t),t)}return{value:e,source:t,stack:F_(t)}}var _o=[],xo=0,Zh=null,bc=0,Ai=[],Ci=0,Ua=null,hs=1,ds="";function Ps(e,t){_o[xo++]=bc,_o[xo++]=Zh,Zh=e,bc=t}function uS(e,t,n){Ai[Ci++]=hs,Ai[Ci++]=ds,Ai[Ci++]=Ua,Ua=e;var i=hs;e=ds;var s=32-fi(i)-1;i&=~(1<<s),n+=1;var a=32-fi(t)+s;if(30<a){var r=s-s%5;a=(i&(1<<r)-1).toString(32),i>>=r,s-=r,hs=1<<32-fi(t)+s|n<<s|i,ds=a+e}else hs=1<<a|n<<s|i,ds=e}function Ed(e){e.return!==null&&(Ps(e,1),uS(e,1,0))}function _0(e){for(;e===Zh;)Zh=_o[--xo],_o[xo]=null,bc=_o[--xo],_o[xo]=null;for(;e===Ua;)Ua=Ai[--Ci],Ai[Ci]=null,ds=Ai[--Ci],Ai[Ci]=null,hs=Ai[--Ci],Ai[Ci]=null}function hS(e,t){Ai[Ci++]=hs,Ai[Ci++]=ds,Ai[Ci++]=Ua,hs=t.id,ds=t.overflow,Ua=e}var mn=null,Ie=null,$t=!1,Ea=null,Di=!1,fg=Error(st(519));function Ia(e){var t=Error(st(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw Sc(Ni(t,e)),fg}function lx(e){var t=e.stateNode,n=e.type,i=e.memoizedProps;switch(t[xn]=e,t[ii]=i,n){case"dialog":te("cancel",t),te("close",t);break;case"iframe":case"object":case"embed":te("load",t);break;case"video":case"audio":for(n=0;n<wc.length;n++)te(wc[n],t);break;case"source":te("error",t);break;case"img":case"image":case"link":te("error",t),te("load",t);break;case"details":te("toggle",t);break;case"input":te("invalid",t),Hb(t,i.value,i.defaultValue,i.checked,i.defaultChecked,i.type,i.name,!0);break;case"select":te("invalid",t);break;case"textarea":te("invalid",t),kb(t,i.value,i.defaultValue,i.children)}n=i.children,typeof n!="string"&&typeof n!="number"&&typeof n!="bigint"||t.textContent===""+n||i.suppressHydrationWarning===!0||YM(t.textContent,n)?(i.popover!=null&&(te("beforetoggle",t),te("toggle",t)),i.onScroll!=null&&te("scroll",t),i.onScrollEnd!=null&&te("scrollend",t),i.onClick!=null&&(t.onclick=us),t=!0):t=!1,t||Ia(e,!0)}function Kh(e){for(mn=e.return;mn;)switch(mn.tag){case 5:case 31:case 13:Di=!1;return;case 27:case 3:Di=!0;return;default:mn=mn.return}}function so(e){if(e!==mn)return!1;if(!$t)return Kh(e),$t=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=!(n!=="form"&&n!=="button")||Jg(e.type,e.memoizedProps)),n=!n),n&&Ie&&Ia(e),Kh(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(st(317));Ie=sb(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(st(317));Ie=sb(e)}else t===27?(t=Ie,Fa(e.type)?(e=e0,e0=null,Ie=e):Ie=t):Ie=mn?Li(e.stateNode.nextSibling):null;return!0}function xr(){Ie=mn=null,$t=!1}function Dm(){var e=Ea;return e!==null&&($n===null?$n=e:$n.push.apply($n,e),Ea=null),e}function Sc(e){Ea===null?Ea=[e]:Ea.push(e)}var pg=gs(null),Lr=null,Os=null;function _a(e,t,n){Pe(pg,t._currentValue),t._currentValue=n}function zs(e){e._currentValue=pg.current,Sn(pg)}function Ch(e,t,n){for(;e!==null;){var i=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,i!==null&&(i.childLanes|=t)):i!==null&&(i.childLanes&t)!==t&&(i.childLanes|=t),e===n)break;e=e.return}}function mg(e,t,n,i){var s=e.child;for(s!==null&&(s.return=e);s!==null;){var a=s.dependencies;if(a!==null){var r=s.child;a=a.firstContext;t:for(;a!==null;){var o=a;a=s;for(var l=0;l<t.length;l++)if(o.context===t[l]){a.lanes|=n,o=a.alternate,o!==null&&(o.lanes|=n),Ch(a.return,n,e),i||(r=null);break t}a=o.next}}else if(s.tag===18){if(r=s.return,r===null)throw Error(st(341));r.lanes|=n,a=r.alternate,a!==null&&(a.lanes|=n),Ch(r,n,e),r=null}else s.tag===13&&s.memoizedState!==null&&s.memoizedState.dehydrated===null?(s.lanes|=n,r=s.alternate,r!==null&&(r.lanes|=n),Ch(s.return,n,e),r=s.child,r=r!==null?r.sibling:null):r=s.child;if(r!==null)r.return=s;else for(r=s;r!==null;){if(r===e){r=null;break}if(s=r.sibling,s!==null){s.return=r.return,r=s;break}r=r.return}s=r}}function br(e,t,n,i){e=null;for(var s=t,a=!1;s!==null;){if(!a){if((s.flags&524288)!==0)a=!0;else if((s.flags&262144)!==0)break}if(s.tag===10){var r=s.alternate;if(r===null)throw Error(st(387));if(r=r.memoizedProps,r!==null){var o=s.type;mi(s.pendingProps.value,r.value)||(e!==null?e.push(o):e=[o])}}else if(s===Vh.current){if(r=s.alternate,r===null)throw Error(st(387));r.memoizedState.memoizedState!==s.memoizedState.memoizedState&&(e!==null?e.push(Vo):e=[Vo])}s=s.return}return e!==null&&mg(t,e,n,i),t.flags|=262144,e!==null}function Jh(e){for(e=e.firstContext;e!==null;){if(!mi(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Sr(e){Lr=e,Os=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function bn(e){return dS(Lr,e)}function uh(e,t){return Lr===null&&Sr(e),dS(e,t)}function dS(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},Os===null){if(e===null)throw Error(st(308));Os=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Os=Os.next=t;return n}var qA=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(n,i){e.push(i)}};this.abort=function(){t.aborted=!0,e.forEach(function(n){return n()})}},YA=ln.unstable_scheduleCallback,jA=ln.unstable_NormalPriority,tn={$$typeof:cs,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function x0(){return{controller:new qA,data:new Map,refCount:0}}function Fc(e){e.refCount--,e.refCount===0&&YA(jA,function(){e.controller.abort()})}function cx(e,t){if((e.pendingLanes&4194048)!==0){var n=e.transitionTypes;for(n===null&&(n=e.transitionTypes=[]),e=0;e<t.length;e++){var i=t[e];n.indexOf(i)===-1&&n.push(i)}}}var nc=null;function ZA(e){var t=e.transitionTypes;return e.transitionTypes=null,t}var oc=null,gg=0,Mr=0,To=null;function KA(e,t){if(oc===null){var n=oc=[];gg=0,Mr=j0(),To={status:"pending",value:void 0,then:function(i){n.push(i)}}}return gg++,t.then(ux,ux),t}function ux(){if(--gg===0&&(nc=null,oc!==null)){To!==null&&(To.status="fulfilled");var e=oc;oc=null,Mr=0,To=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function JA(e,t){var n=[],i={status:"pending",value:null,reason:null,then:function(s){n.push(s)}};return e.then(function(){i.status="fulfilled",i.value=t;for(var s=0;s<n.length;s++)(0,n[s])(t)},function(s){for(i.status="rejected",i.reason=s,s=0;s<n.length;s++)(0,n[s])(void 0)}),i}var hx=Ft.S;Ft.S=function(e,t){if(NM=hi(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&KA(e,t),nc!==null)for(var n=Fo;n!==null;)cx(n,nc),n=n.next;if(n=e.types,n!==null){for(var i=Fo;i!==null;)cx(i,n),i=i.next;if(Mr!==0){i=nc,i===null&&(i=nc=[]);for(var s=0;s<n.length;s++){var a=n[s];i.indexOf(a)===-1&&i.push(a)}}}hx!==null&&hx(e,t)};var vr=gs(null);function b0(){var e=vr.current;return e!==null?e:Ae.pooledCache}function Rh(e,t){t===null?Pe(vr,vr.current):Pe(vr,t.pool)}function fS(){var e=b0();return e===null?null:{parent:tn._currentValue,pool:e}}var Yo=Error(st(460)),S0=Error(st(474)),Td=Error(st(542)),$h={then:function(){}};function dx(e){return e=e.status,e==="fulfilled"||e==="rejected"}function pS(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(us,us),t=n),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,px(e),e===void 0&&!("reason"in t)?Error(st(600)):e;default:if(typeof t.status=="string")t.then(us,us);else{if(e=Ae,e!==null&&100<e.shellSuspendCounter)throw Error(st(482));e=t,e.status="pending",e.then(function(i){if(t.status==="pending"){var s=t;s.status="fulfilled",s.value=i}},function(i){if(t.status==="pending"){var s=t;s.status="rejected",s.reason=i}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,px(e),e}throw yr=t,Yo}}function hr(e){try{var t=e._init;return t(e._payload)}catch(n){throw n!==null&&typeof n=="object"&&typeof n.then=="function"?(yr=n,Yo):n}}var yr=null;function fx(){if(yr===null)throw Error(st(459));var e=yr;return yr=null,e}function px(e){if(e===Yo||e===Td)throw Error(st(483))}var wo=null,Mc=0;function hh(e){var t=Mc;return Mc+=1,wo===null&&(wo=[]),pS(wo,e,t)}function ha(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function dh(e,t){throw t.$$typeof===Dw?Error(st(525)):(e=Object.prototype.toString.call(t),Error(st(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function mS(e){function t(f,v){if(e){var S=f.deletions;S===null?(f.deletions=[v],f.flags|=16):S.push(v)}}function n(f,v){if(!e)return null;for(;v!==null;)t(f,v),v=v.sibling;return null}function i(f){for(var v=new Map;f!==null;)f.key===null?v.set(f.index,f):v.set(f.key,f),f=f.sibling;return v}function s(f,v){return f=Bs(f,v),f.index=0,f.sibling=null,f}function a(f,v,S){return f.index=S,e?(S=f.alternate,S!==null?(S=S.index,S<v?(f.flags|=2,v):S):(f.flags|=134217730,v)):(f.flags|=1048576,v)}function r(f){return e&&f.alternate===null&&(f.flags|=134217730),f}function o(f,v,S,x){return v===null||v.tag!==6?(v=Rm(S,f.mode,x),v.return=f,v):(v=s(v,S),v.return=f,v)}function l(f,v,S,x){var T=S.type;return T===uo?(f=u(f,v,S.props.children,x,S.key),ha(f,S),f):v!==null&&(v.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===pa&&hr(T)===v.type)?(v=s(v,S.props),ha(v,S),v.return=f,v):(v=Ah(S.type,S.key,S.props,null,f.mode,x),ha(v,S),v.return=f,v)}function c(f,v,S,x){return v===null||v.tag!==4||v.stateNode.containerInfo!==S.containerInfo||v.stateNode.implementation!==S.implementation?(v=Nm(S,f.mode,x),v.return=f,v):(v=s(v,S.children||[]),v.return=f,v)}function u(f,v,S,x,T){return v===null||v.tag!==7?(v=gr(S,f.mode,x,T),v.return=f,v):(v=s(v,S),v.return=f,v)}function d(f,v,S){if(typeof v=="string"&&v!==""||typeof v=="number"||typeof v=="bigint")return v=Rm(""+v,f.mode,S),v.return=f,v;if(typeof v=="object"&&v!==null){switch(v.$$typeof){case nh:return S=Ah(v.type,v.key,v.props,null,f.mode,S),ha(S,v),S.return=f,S;case Ql:return v=Nm(v,f.mode,S),v.return=f,v;case pa:return v=hr(v),d(f,v,S)}if(tc(v)||Yl(v))return v=gr(v,f.mode,S,null),v.return=f,v;if(typeof v.then=="function")return d(f,hh(v),S);if(v.$$typeof===cs)return d(f,uh(f,v),S);dh(f,v)}return null}function h(f,v,S,x){var T=v!==null?v.key:null;if(typeof S=="string"&&S!==""||typeof S=="number"||typeof S=="bigint")return T!==null?null:o(f,v,""+S,x);if(typeof S=="object"&&S!==null){switch(S.$$typeof){case nh:return S.key===T?l(f,v,S,x):null;case Ql:return S.key===T?c(f,v,S,x):null;case pa:return S=hr(S),h(f,v,S,x)}if(tc(S)||Yl(S))return T!==null?null:u(f,v,S,x,null);if(typeof S.then=="function")return h(f,v,hh(S),x);if(S.$$typeof===cs)return h(f,v,uh(f,S),x);dh(f,S)}return null}function p(f,v,S,x,T){if(typeof x=="string"&&x!==""||typeof x=="number"||typeof x=="bigint")return f=f.get(S)||null,o(v,f,""+x,T);if(typeof x=="object"&&x!==null){switch(x.$$typeof){case nh:return f=f.get(x.key===null?S:x.key)||null,l(v,f,x,T);case Ql:return f=f.get(x.key===null?S:x.key)||null,c(v,f,x,T);case pa:return x=hr(x),p(f,v,S,x,T)}if(tc(x)||Yl(x))return f=f.get(S)||null,u(v,f,x,T,null);if(typeof x.then=="function")return p(f,v,S,hh(x),T);if(x.$$typeof===cs)return p(f,v,S,uh(v,x),T);dh(v,x)}return null}function m(f,v,S,x){for(var T=null,E=null,w=v,y=v=0,C=null;w!==null&&y<S.length;y++){w.index>y?(C=w,w=null):C=w.sibling;var D=h(f,w,S[y],x);if(D===null){w===null&&(w=C);break}e&&w&&D.alternate===null&&t(f,w),v=a(D,v,y),E===null?T=D:E.sibling=D,E=D,w=C}if(y===S.length)return n(f,w),$t&&Ps(f,y),T;if(w===null){for(;y<S.length;y++)w=d(f,S[y],x),w!==null&&(v=a(w,v,y),E===null?T=w:E.sibling=w,E=w);return $t&&Ps(f,y),T}for(w=i(w);y<S.length;y++)C=p(w,f,y,S[y],x),C!==null&&(e&&(D=C.alternate,D!==null&&w.delete(D.key===null?y:D.key)),v=a(C,v,y),E===null?T=C:E.sibling=C,E=C);return e&&w.forEach(function(z){return t(f,z)}),$t&&Ps(f,y),T}function b(f,v,S,x){if(S==null)throw Error(st(151));for(var T=null,E=null,w=v,y=v=0,C=null,D=S.next();w!==null&&!D.done;y++,D=S.next()){w.index>y?(C=w,w=null):C=w.sibling;var z=h(f,w,D.value,x);if(z===null){w===null&&(w=C);break}e&&w&&z.alternate===null&&t(f,w),v=a(z,v,y),E===null?T=z:E.sibling=z,E=z,w=C}if(D.done)return n(f,w),$t&&Ps(f,y),T;if(w===null){for(;!D.done;y++,D=S.next())D=d(f,D.value,x),D!==null&&(v=a(D,v,y),E===null?T=D:E.sibling=D,E=D);return $t&&Ps(f,y),T}for(w=i(w);!D.done;y++,D=S.next())D=p(w,f,y,D.value,x),D!==null&&(e&&(C=D.alternate,C!==null&&w.delete(C.key===null?y:C.key)),v=a(D,v,y),E===null?T=D:E.sibling=D,E=D);return e&&w.forEach(function(X){return t(f,X)}),$t&&Ps(f,y),T}function g(f,v,S,x){if(typeof S=="object"&&S!==null&&S.type===uo&&S.key===null&&S.props.ref===void 0&&(S=S.props.children),typeof S=="object"&&S!==null){switch(S.$$typeof){case nh:t:{for(var T=S.key;v!==null;){if(v.key===T){if(T=S.type,T===uo){if(v.tag===7){n(f,v.sibling),x=s(v,S.props.children),ha(x,S),x.return=f,f=x;break t}}else if(v.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===pa&&hr(T)===v.type){n(f,v.sibling),x=s(v,S.props),ha(x,S),x.return=f,f=x;break t}n(f,v);break}else t(f,v);v=v.sibling}S.type===uo?(x=gr(S.props.children,f.mode,x,S.key),ha(x,S),x.return=f,f=x):(x=Ah(S.type,S.key,S.props,null,f.mode,x),ha(x,S),x.return=f,f=x)}return r(f);case Ql:t:{for(T=S.key;v!==null;){if(v.key===T)if(v.tag===4&&v.stateNode.containerInfo===S.containerInfo&&v.stateNode.implementation===S.implementation){n(f,v.sibling),x=s(v,S.children||[]),x.return=f,f=x;break t}else{n(f,v);break}else t(f,v);v=v.sibling}x=Nm(S,f.mode,x),x.return=f,f=x}return r(f);case pa:return S=hr(S),g(f,v,S,x)}if(tc(S))return m(f,v,S,x);if(Yl(S)){if(T=Yl(S),typeof T!="function")throw Error(st(150));return S=T.call(S),b(f,v,S,x)}if(typeof S.then=="function")return g(f,v,hh(S),x);if(S.$$typeof===cs)return g(f,v,uh(f,S),x);dh(f,S)}return typeof S=="string"&&S!==""||typeof S=="number"||typeof S=="bigint"?(S=""+S,v!==null&&v.tag===6?(n(f,v.sibling),x=s(v,S),x.return=f,f=x):(n(f,v),x=Rm(S,f.mode,x),x.return=f,f=x),r(f)):n(f,v)}return function(f,v,S,x){try{Mc=0;var T=g(f,v,S,x);return wo=null,T}catch(w){if(w===Yo||w===Td)throw w;var E=ti(29,w,null,f.mode);return E.lanes=x,E.return=f,E}finally{}}}var Er=mS(!0),gS=mS(!1),ma=!1;function M0(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function vg(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Ta(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function wa(e,t,n){var i=e.updateQueue;if(i===null)return null;if(i=i.shared,(de&2)!==0){var s=i.pending;return s===null?t.next=t:(t.next=s.next,s.next=t),i.pending=t,t=jh(e),oS(e,null,n),t}return Md(e,i,t,n),jh(e)}function lc(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194048)!==0)){var i=t.lanes;i&=e.pendingLanes,n|=i,t.lanes=n,Ub(e,n)}}function Lm(e,t){var n=e.updateQueue,i=e.alternate;if(i!==null&&(i=i.updateQueue,n===i)){var s=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var r={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};a===null?s=a=r:a=a.next=r,n=n.next}while(n!==null);a===null?s=a=t:a=a.next=t}else s=a=t;n={baseState:i.baseState,firstBaseUpdate:s,lastBaseUpdate:a,shared:i.shared,callbacks:i.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var yg=!1;function cc(){if(yg){var e=To;if(e!==null)throw e}}function uc(e,t,n,i){yg=!1;var s=e.updateQueue;ma=!1;var a=s.firstBaseUpdate,r=s.lastBaseUpdate,o=s.shared.pending;if(o!==null){s.shared.pending=null;var l=o,c=l.next;l.next=null,r===null?a=c:r.next=c,r=l;var u=e.alternate;u!==null&&(u=u.updateQueue,o=u.lastBaseUpdate,o!==r&&(o===null?u.firstBaseUpdate=c:o.next=c,u.lastBaseUpdate=l))}if(a!==null){var d=s.baseState;r=0,u=c=l=null,o=a;do{var h=o.lane&-536870913,p=h!==o.lane;if(p?(ie&h)===h:(i&h)===h){h!==0&&h===Mr&&(yg=!0),u!==null&&(u=u.next={lane:0,tag:o.tag,payload:o.payload,callback:null,next:null});t:{var m=e,b=o;h=t;var g=n;switch(b.tag){case 1:if(m=b.payload,typeof m=="function"){d=m.call(g,d,h);break t}d=m;break t;case 3:m.flags=m.flags&-65537|128;case 0:if(m=b.payload,h=typeof m=="function"?m.call(g,d,h):m,h==null)break t;d=Ce({},d,h);break t;case 2:ma=!0}}h=o.callback,h!==null&&(e.flags|=64,p&&(e.flags|=8192),p=s.callbacks,p===null?s.callbacks=[h]:p.push(h))}else p={lane:h,tag:o.tag,payload:o.payload,callback:o.callback,next:null},u===null?(c=u=p,l=d):u=u.next=p,r|=h;if(o=o.next,o===null){if(o=s.shared.pending,o===null)break;p=o,o=p.next,p.next=null,s.lastBaseUpdate=p,s.shared.pending=null}}while(!0);u===null&&(l=d),s.baseState=l,s.firstBaseUpdate=c,s.lastBaseUpdate=u,a===null&&(s.shared.lanes=0),Ba|=r,e.lanes=r,e.memoizedState=d}}function vS(e,t){if(typeof e!="function")throw Error(st(191,e));e.call(t)}function yS(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)vS(n[e],t)}var Pa=gs(null),Qh=gs(0);function mx(e,t){e=Xs,Pe(Qh,e),Pe(Pa,t),Xs=e|t.baseLanes}function _g(){Pe(Qh,Xs),Pe(Pa,Pa.current)}function E0(){Xs=Qh.current,Sn(Pa),Sn(Qh)}var Tn=gs(null),Ln=null;function Aa(e){var t=e.alternate;Pe(Mn,Mn.current&1),Pe(Tn,e),Ln===null&&(t===null||Pa.current!==null||t.memoizedState!==null)&&(Ln=e)}function xg(e){Pe(Mn,Mn.current),Pe(Tn,e),Ln===null&&(Ln=e)}function _S(e){e.tag===22?(Pe(Mn,Mn.current),Pe(Tn,e),Ln===null&&(Ln=e)):Ca()}function Ca(){Pe(Mn,Mn.current),Pe(Tn,Tn.current)}function li(e){Sn(Tn),Ln===e&&(Ln=null),Sn(Mn)}var Mn=gs(0);function Ec(e,t){Pe(Tn,Tn.current),Pe(Mn,t)}function T0(e){Sn(Mn),Sn(Tn),Ln===e&&(Ln=null)}function td(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||t0(n)||$0(n)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!=="independent"){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Hs=0,Wt=null,we=null,Qe=null,ed=!1,Ao=!1,Tr=!1,nd=0,Tc=0,Co=null,$A=0;function Ye(){throw Error(st(321))}function w0(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!mi(e[n],t[n]))return!1;return!0}function A0(e,t,n,i,s,a){return Hs=a,Wt=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Ft.H=e===null||e.memoizedState===null?KS:JS,Tr=!1,a=n(i,s),Tr=!1,Ao&&(a=bS(t,n,i,s)),xS(e),a}function xS(e){Ft.H=id;var t=we!==null&&we.next!==null;if(Hs=0,Qe=we=Wt=null,ed=!1,Tc=0,Co=null,t)throw Error(st(300));e===null||en||(e=e.dependencies,e!==null&&Jh(e)&&(en=!0))}function bS(e,t,n,i){Wt=e;var s=0;do{if(Ao&&(Co=null),Tc=0,Ao=!1,25<=s)throw Error(st(301));if(s+=1,Qe=we=null,e.updateQueue!=null){var a=e.updateQueue;a.lastEffect=null,a.events=null,a.stores=null,a.memoCache!=null&&(a.memoCache.index=0)}Ft.H=rC,a=t(n,i)}while(Ao);return a}function QA(){var e=Ft.H,t=e.useState()[0];return t=typeof t.then=="function"?Gc(t):t,e=e.useState()[0],(we!==null?we.memoizedState:null)!==e&&(Wt.flags|=1024),t}function C0(){var e=nd!==0;return nd=0,e}function R0(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function N0(e){if(ed){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}ed=!1}Hs=0,Qe=we=Wt=null,Ao=!1,Tc=nd=0,Co=null}function Hn(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Qe===null?Wt.memoizedState=Qe=e:Qe=Qe.next=e,Qe}function Je(){if(we===null){var e=Wt.alternate;e=e!==null?e.memoizedState:null}else e=we.next;var t=Qe===null?Wt.memoizedState:Qe.next;if(t!==null)Qe=t,we=e;else{if(e===null)throw Wt.alternate===null?Error(st(467)):Error(st(310));we=e,e={memoizedState:we.memoizedState,baseState:we.baseState,baseQueue:we.baseQueue,queue:we.queue,next:null},Qe===null?Wt.memoizedState=Qe=e:Qe=Qe.next=e}return Qe}function wd(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function Gc(e){var t=Tc;return Tc+=1,Co===null&&(Co=[]),e=pS(Co,e,t),t=Wt,(Qe===null?t.memoizedState:Qe.next)===null&&(t=t.alternate,Ft.H=t===null||t.memoizedState===null?KS:JS),e}function Ad(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return Gc(e);if(e.$$typeof===Iw)return;if(e.$$typeof===cs)return bn(e)}throw Error(st(438,String(e)))}function D0(e){var t=null,n=Wt.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var i=Wt.alternate;i!==null&&(i=i.updateQueue,i!==null&&(i=i.memoCache,i!=null&&(t={data:i.data.map(function(s){return s.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),n===null&&(n=wd(),Wt.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),i=0;i<e;i++)n[i]=Uw;return t.index++,n}function Vs(e,t){return typeof t=="function"?t(e):t}function Nh(e){var t=Je();return L0(t,we,e)}function L0(e,t,n){var i=e.queue;if(i===null)throw Error(st(311));i.lastRenderedReducer=n;var s=e.baseQueue,a=i.pending;if(a!==null){if(s!==null){var r=s.next;s.next=a.next,a.next=r}t.baseQueue=s=a,i.pending=null}if(a=e.baseState,s===null)e.memoizedState=a;else{t=s.next;var o=r=null,l=null,c=t,u=!1;do{var d=c.lane&-536870913;if(d!==c.lane?(ie&d)===d:(Hs&d)===d){var h=c.revertLane;if(h===0)l!==null&&(l=l.next={lane:0,revertLane:0,gesture:null,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),d===Mr&&(u=!0);else if((Hs&h)===h){c=c.next,h===Mr&&(u=!0);continue}else d={lane:0,revertLane:c.revertLane,gesture:null,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null},l===null?(o=l=d,r=a):l=l.next=d,Wt.lanes|=h,Ba|=h;d=c.action,Tr&&n(a,d),a=c.hasEagerState?c.eagerState:n(a,d)}else h={lane:d,revertLane:c.revertLane,gesture:c.gesture,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null},l===null?(o=l=h,r=a):l=l.next=h,Wt.lanes|=d,Ba|=d;c=c.next}while(c!==null&&c!==t);if(l===null?r=a:l.next=o,!mi(a,e.memoizedState)&&(en=!0,u&&(n=To,n!==null)))throw n;e.memoizedState=a,e.baseState=r,e.baseQueue=l,i.lastRenderedState=a}return s===null&&(i.lanes=0),[e.memoizedState,i.dispatch]}function Um(e){var t=Je(),n=t.queue;if(n===null)throw Error(st(311));n.lastRenderedReducer=e;var i=n.dispatch,s=n.pending,a=t.memoizedState;if(s!==null){n.pending=null;var r=s=s.next;do a=e(a,r.action),r=r.next;while(r!==s);mi(a,t.memoizedState)||(en=!0),t.memoizedState=a,t.baseQueue===null&&(t.baseState=a),n.lastRenderedState=a}return[a,i]}function SS(e,t,n){var i=Wt,s=Je(),a=$t;if(a){if(n===void 0)throw Error(st(407));n=n()}else n=t();var r=!mi((we||s).memoizedState,n);if(r&&(s.memoizedState=n,en=!0),s=s.queue,U0(TS.bind(null,i,s,e),[e]),e=s.getSnapshot!==t||r||Qe!==null&&(Qe.memoizedState.tag&1)!==0,Po(e?9:8,{destroy:void 0},ES.bind(null,i,s,n,t),null),e){if(i.flags|=2048,Ae===null)throw Error(st(349));a||(Hs&127)!==0||MS(i,t,n)}return n}function MS(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=Wt.updateQueue,t===null?(t=wd(),Wt.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function ES(e,t,n,i){t.value=n,t.getSnapshot=i,wS(t)&&AS(e)}function TS(e,t,n){return n(function(){wS(t)&&AS(e)})}function wS(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!mi(e,n)}catch{return!0}}function AS(e){var t=Dr(e,2);t!==null&&ei(t,e,2)}function bg(e){var t=Hn();if(typeof e=="function"){var n=e;if(e=n(),Tr){va(!0);try{n()}finally{va(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Vs,lastRenderedState:e},t}function CS(e,t,n,i){return e.baseState=n,L0(e,we,typeof i=="function"?i:Vs)}function tC(e,t,n,i,s){if(Rd(e))throw Error(st(485));if(e=t.action,e!==null){var a={payload:s,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(r){a.listeners.push(r)}};Ft.T!==null?n(!0):a.isTransition=!1,i(a),n=t.pending,n===null?(a.next=t.pending=a,RS(t,a)):(a.next=n.next,t.pending=n.next=a)}}function RS(e,t){var n=t.action,i=t.payload,s=e.state;if(t.isTransition){var a=Ft.T,r={};r.types=a!==null?a.types:null,Ft.T=r;try{var o=n(s,i),l=Ft.S;l!==null&&l(r,o),gx(e,t,o)}catch(c){Sg(e,t,c)}finally{a!==null&&r.types!==null&&(a.types=r.types),Ft.T=a}}else try{a=n(s,i),gx(e,t,a)}catch(c){Sg(e,t,c)}}function gx(e,t,n){n!==null&&typeof n=="object"&&typeof n.then=="function"?n.then(function(i){vx(e,t,i)},function(i){return Sg(e,t,i)}):vx(e,t,n)}function vx(e,t,n){t.status="fulfilled",t.value=n,NS(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,RS(e,n)))}function Sg(e,t,n){var i=e.pending;if(e.pending=null,i!==null){i=i.next;do t.status="rejected",t.reason=n,NS(t),t=t.next;while(t!==i)}e.action=null}function NS(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function DS(e,t){return t}function yx(e,t){if($t){var n=Ae.formState;if(n!==null){t:{var i=Wt;if($t){if(Ie){e:{for(var s=Ie,a=Di;s.nodeType!==8;){if(!a){s=null;break e}if(s=Li(s.nextSibling),s===null){s=null;break e}}a=s.data,s=a==="F!"||a==="F"?s:null}if(s){Ie=Li(s.nextSibling),i=s.data==="F!";break t}}Ia(i)}i=!1}i&&(t=n[0])}}return n=Hn(),n.memoizedState=n.baseState=t,i={pending:null,lanes:0,dispatch:null,lastRenderedReducer:DS,lastRenderedState:t},n.queue=i,n=YS.bind(null,Wt,i),i.dispatch=n,i=bg(!1),a=B0.bind(null,Wt,!1,i.queue),i=Hn(),s={state:t,dispatch:null,action:e,pending:null},i.queue=s,n=tC.bind(null,Wt,s,a,n),s.dispatch=n,i.memoizedState=e,[t,n,!1]}function _x(e){var t=Je();return LS(t,we,e)}function LS(e,t,n){if(t=L0(e,t,DS)[0],e=Nh(Vs)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var i=Gc(t)}catch(r){throw r===Yo?Td:r}else i=t;t=Je();var s=t.queue,a=s.dispatch;return n!==t.memoizedState&&(Wt.flags|=2048,Po(9,{destroy:void 0},eC.bind(null,s,n),null)),[i,a,e]}function eC(e,t){e.action=t}function xx(e){var t=Je(),n=we;if(n!==null)return LS(t,n,e);Je(),t=t.memoizedState,n=Je();var i=n.queue.dispatch;return n.memoizedState=e,[t,i,!1]}function Po(e,t,n,i){return e={tag:e,create:n,deps:i,inst:t,next:null},t=Wt.updateQueue,t===null&&(t=wd(),Wt.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(i=n.next,n.next=e,e.next=i,t.lastEffect=e),e}function US(){return Je().memoizedState}function Dh(e,t,n,i){var s=Hn();Wt.flags|=e,s.memoizedState=Po(1|t,{destroy:void 0},n,i===void 0?null:i)}function Cd(e,t,n,i){var s=Je();i=i===void 0?null:i;var a=s.memoizedState.inst;we!==null&&i!==null&&w0(i,we.memoizedState.deps)?s.memoizedState=Po(t,a,n,i):(Wt.flags|=e,s.memoizedState=Po(1|t,a,n,i))}function bx(e,t){Dh(8390656,8,e,t)}function U0(e,t){Cd(2048,8,e,t)}function nC(e){Wt.flags|=4;var t=Wt.updateQueue;if(t===null)t=wd(),Wt.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function IS(e){var t=Je().memoizedState;return nC({ref:t,nextImpl:e}),function(){if((de&2)!==0)throw Error(st(440));return t.impl.apply(void 0,arguments)}}function PS(e,t){return Cd(4,2,e,t)}function OS(e,t){return Cd(4,4,e,t)}function BS(e,t){if(typeof t=="function"){e=e();var n=t(e);return function(){typeof n=="function"?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function zS(e,t,n){n=n!=null?n.concat([e]):null,Cd(4,4,BS.bind(null,t,e),n)}function I0(){}function FS(e,t){var n=Je();t=t===void 0?null:t;var i=n.memoizedState;return t!==null&&w0(t,i[1])?i[0]:(n.memoizedState=[e,t],e)}function GS(e,t){var n=Je();t=t===void 0?null:t;var i=n.memoizedState;if(t!==null&&w0(t,i[1]))return i[0];if(i=e(),Tr){va(!0);try{e()}finally{va(!1)}}return n.memoizedState=[i,t],i}function P0(e,t,n){return n===void 0||(Hs&1073741824)!==0&&(ie&261930)===0?e.memoizedState=t:(e.memoizedState=n,e=LM(),Wt.lanes|=e,Ba|=e,n)}function HS(e,t,n,i){return mi(n,t)?n:Pa.current!==null?(e=P0(e,n,i),mi(e,t)||(en=!0),e):(Hs&106)===0||(Hs&1073741824)!==0&&(ie&261930)===0?(en=!0,e.memoizedState=n):(e=LM(),Wt.lanes|=e,Ba|=e,t)}function VS(e,t,n,i,s){var a=fe.p;fe.p=a!==0&&8>a?a:8;var r=Ft.T,o={};o.types=r!==null?r.types:null,Ft.T=o,B0(e,!1,t,n);try{var l=s(),c=Ft.S;if(c!==null&&c(o,l),l!==null&&typeof l=="object"&&typeof l.then=="function"){var u=JA(l,i);hc(e,t,u,pi(e))}else hc(e,t,i,pi(e))}catch(d){hc(e,t,{then:function(){},status:"rejected",reason:d},pi())}finally{fe.p=a,r!==null&&o.types!==null&&(r.types=o.types),Ft.T=r}}function iC(){}function Mg(e,t,n,i){if(e.tag!==5)throw Error(st(476));var s=kS(e).queue;VS(e,s,t,mr,n===null?iC:function(){return XS(e),n(i)})}function kS(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:mr,baseState:mr,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Vs,lastRenderedState:mr},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Vs,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function XS(e){var t=kS(e);t.next===null&&(t=e.alternate.memoizedState),hc(e,t.next.queue,{},pi())}function O0(){return bn(Vo)}function WS(){return Je().memoizedState}function qS(){return Je().memoizedState}function sC(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=pi();e=Ta(n);var i=wa(t,e,n);i!==null&&(ei(i,t,n),lc(i,t,n)),t={cache:x0()},e.payload=t;return}t=t.return}}function aC(e,t,n){var i=pi();n={lane:i,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},Rd(e)?jS(t,n):(n=v0(e,t,n,i),n!==null&&(ei(n,e,i),ZS(n,t,i)))}function YS(e,t,n){var i=pi();hc(e,t,n,i)}function hc(e,t,n,i){var s={lane:i,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(Rd(e))jS(t,s);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var r=t.lastRenderedState,o=a(r,n);if(s.hasEagerState=!0,s.eagerState=o,mi(o,r))return Md(e,t,s,0),Ae===null&&Sd(),!1}catch{}finally{}if(n=v0(e,t,s,i),n!==null)return ei(n,e,i),ZS(n,t,i),!0}return!1}function B0(e,t,n,i){if(i={lane:2,revertLane:j0(),gesture:null,action:i,hasEagerState:!1,eagerState:null,next:null},Rd(e)){if(t)throw Error(st(479))}else t=v0(e,n,i,2),t!==null&&ei(t,e,2)}function Rd(e){var t=e.alternate;return e===Wt||t!==null&&t===Wt}function jS(e,t){Ao=ed=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function ZS(e,t,n){if((n&4194048)!==0){var i=t.lanes;i&=e.pendingLanes,n|=i,t.lanes=n,Ub(e,n)}}var id={readContext:bn,use:Ad,useCallback:Ye,useContext:Ye,useEffect:Ye,useImperativeHandle:Ye,useLayoutEffect:Ye,useInsertionEffect:Ye,useMemo:Ye,useReducer:Ye,useRef:Ye,useState:Ye,useDebugValue:Ye,useDeferredValue:Ye,useTransition:Ye,useSyncExternalStore:Ye,useId:Ye,useHostTransitionStatus:Ye,useFormState:Ye,useActionState:Ye,useOptimistic:Ye,useMemoCache:Ye,useCacheRefresh:Ye,useEffectEvent:Ye},KS={readContext:bn,use:Ad,useCallback:function(e,t){return Hn().memoizedState=[e,t===void 0?null:t],e},useContext:bn,useEffect:bx,useImperativeHandle:function(e,t,n){n=n!=null?n.concat([e]):null,Dh(4194308,4,BS.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Dh(4194308,4,e,t)},useInsertionEffect:function(e,t){Dh(4,2,e,t)},useMemo:function(e,t){var n=Hn();t=t===void 0?null:t;var i=e();if(Tr){va(!0);try{e()}finally{va(!1)}}return n.memoizedState=[i,t],i},useReducer:function(e,t,n){var i=Hn();if(n!==void 0){var s=n(t);if(Tr){va(!0);try{n(t)}finally{va(!1)}}}else s=t;return i.memoizedState=i.baseState=s,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:s},i.queue=e,e=e.dispatch=aC.bind(null,Wt,e),[i.memoizedState,e]},useRef:function(e){var t=Hn();return e={current:e},t.memoizedState=e},useState:function(e){e=bg(e);var t=e.queue,n=YS.bind(null,Wt,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:I0,useDeferredValue:function(e,t){var n=Hn();return P0(n,e,t)},useTransition:function(){var e=bg(!1);return e=VS.bind(null,Wt,e.queue,!0,!1),Hn().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var i=Wt,s=Hn();if($t){if(n===void 0)throw Error(st(407));n=n()}else{if(n=t(),Ae===null)throw Error(st(349));(ie&127)!==0||MS(i,t,n)}s.memoizedState=n;var a={value:n,getSnapshot:t};return s.queue=a,bx(TS.bind(null,i,a,e),[e]),i.flags|=2048,Po(9,{destroy:void 0},ES.bind(null,i,a,n,t),null),n},useId:function(){var e=Hn(),t=Ae.identifierPrefix;if($t){var n=ds,i=hs;n=(i&~(1<<32-fi(i)-1)).toString(32)+n,t="_"+t+"R_"+n,n=nd++,0<n&&(t+="H"+n.toString(32)),t+="_"}else n=$A++,t="_"+t+"r_"+n.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:O0,useFormState:yx,useActionState:yx,useOptimistic:function(e){var t=Hn();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=B0.bind(null,Wt,!0,n),n.dispatch=t,[e,t]},useMemoCache:D0,useCacheRefresh:function(){return Hn().memoizedState=sC.bind(null,Wt)},useEffectEvent:function(e){var t=Hn(),n={impl:e};return t.memoizedState=n,function(){if((de&2)!==0)throw Error(st(440));return n.impl.apply(void 0,arguments)}}},JS={readContext:bn,use:Ad,useCallback:FS,useContext:bn,useEffect:U0,useImperativeHandle:zS,useInsertionEffect:PS,useLayoutEffect:OS,useMemo:GS,useReducer:Nh,useRef:US,useState:function(){return Nh(Vs)},useDebugValue:I0,useDeferredValue:function(e,t){var n=Je();return HS(n,we.memoizedState,e,t)},useTransition:function(){var e=Nh(Vs)[0],t=Je().memoizedState;return[typeof e=="boolean"?e:Gc(e),t]},useSyncExternalStore:SS,useId:WS,useHostTransitionStatus:O0,useFormState:_x,useActionState:_x,useOptimistic:function(e,t){var n=Je();return CS(n,we,e,t)},useMemoCache:D0,useCacheRefresh:qS,useEffectEvent:IS},rC={readContext:bn,use:Ad,useCallback:FS,useContext:bn,useEffect:U0,useImperativeHandle:zS,useInsertionEffect:PS,useLayoutEffect:OS,useMemo:GS,useReducer:Um,useRef:US,useState:function(){return Um(Vs)},useDebugValue:I0,useDeferredValue:function(e,t){var n=Je();return we===null?P0(n,e,t):HS(n,we.memoizedState,e,t)},useTransition:function(){var e=Um(Vs)[0],t=Je().memoizedState;return[typeof e=="boolean"?e:Gc(e),t]},useSyncExternalStore:SS,useId:WS,useHostTransitionStatus:O0,useFormState:xx,useActionState:xx,useOptimistic:function(e,t){var n=Je();return we!==null?CS(n,we,e,t):(n.baseState=e,[e,n.queue.dispatch])},useMemoCache:D0,useCacheRefresh:qS,useEffectEvent:IS};function Im(e,t,n,i){t=e.memoizedState,n=n(i,t),n=n==null?t:Ce({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var Eg={enqueueSetState:function(e,t,n){e=e._reactInternals;var i=pi(),s=Ta(i);s.payload=t,n!=null&&(s.callback=n),t=wa(e,s,i),t!==null&&(ei(t,e,i),lc(t,e,i))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var i=pi(),s=Ta(i);s.tag=1,s.payload=t,n!=null&&(s.callback=n),t=wa(e,s,i),t!==null&&(ei(t,e,i),lc(t,e,i))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=pi(),i=Ta(n);i.tag=2,t!=null&&(i.callback=t),t=wa(e,i,n),t!==null&&(ei(t,e,n),lc(t,e,n))}};function Sx(e,t,n,i,s,a,r){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(i,a,r):t.prototype&&t.prototype.isPureReactComponent?!xc(n,i)||!xc(s,a):!0}function Mx(e,t,n,i){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,i),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,i),t.state!==e&&Eg.enqueueReplaceState(t,t.state,null)}function wr(e,t){var n=t;if("ref"in t){n={};for(var i in t)i!=="ref"&&(n[i]=t[i])}if(e=e.defaultProps){n===t&&(n=Ce({},n));for(var s in e)n[s]===void 0&&(n[s]=e[s])}return n}function $S(e){Yh(e)}function QS(e){console.error(e)}function tM(e){Yh(e)}function sd(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(i){setTimeout(function(){throw i})}}function Ex(e,t,n){try{var i=e.onCaughtError;i(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(s){setTimeout(function(){throw s})}}function Tg(e,t,n){return n=Ta(n),n.tag=3,n.payload={element:null},n.callback=function(){sd(e,t)},n}function eM(e){return e=Ta(e),e.tag=3,e}function nM(e,t,n,i){var s=n.type.getDerivedStateFromError;if(typeof s=="function"){var a=i.value;e.payload=function(){return s(a)},e.callback=function(){Ex(t,n,i)}}var r=n.stateNode;r!==null&&typeof r.componentDidCatch=="function"&&(e.callback=function(){Ex(t,n,i),typeof s!="function"&&(Ra===null?Ra=new Set([this]):Ra.add(this));var o=i.stack;this.componentDidCatch(i.value,{componentStack:o!==null?o:""})})}function oC(e,t,n,i,s){if(n.flags|=32768,i!==null&&typeof i=="object"&&typeof i.then=="function"){if(t=n.alternate,t!==null&&br(t,n,s,!0),n=Tn.current,n!==null){switch(n.tag){case 31:case 13:case 19:return Ln===null?dd():n.alternate===null&&je===0&&(je=3),n.flags&=-257,n.flags|=65536,n.lanes=s,i===$h?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([i]):t.add(i),Hm(e,i,s)),!1;case 22:return n.flags|=65536,i===$h?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([i])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([i]):n.add(i)),Hm(e,i,s)),!1}throw Error(st(435,n.tag))}return Hm(e,i,s),dd(),!1}if($t)return t=Tn.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=s,i!==fg&&(e=Error(st(422),{cause:i}),Sc(Ni(e,n)))):(i!==fg&&(t=Error(st(423),{cause:i}),Sc(Ni(t,n))),e=e.current.alternate,e.flags|=65536,s&=-s,e.lanes|=s,i=Ni(i,n),s=Tg(e.stateNode,i,s),Lm(e,s),je!==4&&(je=2)),!1;var a=Error(st(520),{cause:i});if(a=Ni(a,n),mc===null?mc=[a]:mc.push(a),je!==4&&(je=2),t===null)return!0;i=Ni(i,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=s&-s,n.lanes|=e,e=Tg(n.stateNode,i,e),Lm(n,e),!1;case 1:if(t=n.type,a=n.stateNode,(n.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||a!==null&&typeof a.componentDidCatch=="function"&&(Ra===null||!Ra.has(a))))return n.flags|=65536,s&=-s,n.lanes|=s,s=eM(s),nM(s,e,n,i),Lm(n,s),!1;break;case 22:if(n.memoizedState!==null)return n.flags|=65536,!1}n=n.return}while(n!==null);return!1}var z0=Error(st(461)),en=!1;function rn(e,t,n,i){t.child=e===null?gS(t,null,n,i):Er(t,e.child,n,i)}function Tx(e,t,n,i,s){n=n.render;var a=t.ref;if("ref"in i){var r={};for(var o in i)o!=="ref"&&(r[o]=i[o])}else r=i;return Sr(t),i=A0(e,t,n,r,a,s),o=C0(),e!==null&&!en?(R0(e,t,s),ks(e,t,s)):($t&&o&&Ed(t),t.flags|=1,rn(e,t,i,s),t.child)}function wx(e,t,n,i,s){if(e===null){var a=n.type;return typeof a=="function"&&!y0(a)&&a.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=a,iM(e,t,a,i,s)):(e=Ah(n.type,null,i,t,t.mode,s),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,!G0(e,s)){var r=a.memoizedProps;if(n=n.compare,n=n!==null?n:xc,n(r,i)&&e.ref===t.ref)return ks(e,t,s)}return t.flags|=1,e=Bs(a,i),e.ref=t.ref,e.return=t,t.child=e}function iM(e,t,n,i,s){if(e!==null){var a=e.memoizedProps;if(xc(a,i)&&e.ref===t.ref)if(en=!1,t.pendingProps=i=a,G0(e,s))(e.flags&131072)!==0&&(en=!0);else return t.lanes=e.lanes,ks(e,t,s)}return wg(e,t,n,i,s)}function sM(e,t,n,i){var s=i.children,a=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),i.mode==="hidden"){if((t.flags&128)!==0){if(a=a!==null?a.baseLanes|n:n,e!==null){for(i=t.child=e.child,s=0;i!==null;)s=s|i.lanes|i.childLanes,i=i.sibling;i=s&~a}else i=0,t.child=null;return Ax(e,t,a,n,i)}if((n&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Rh(t,a!==null?a.cachePool:null),a!==null?mx(t,a):_g(),_S(t);else return i=t.lanes=536870912,Ax(e,t,a!==null?a.baseLanes|n:n,n,i)}else a!==null?(Rh(t,a.cachePool),mx(t,a),Ca(),t.memoizedState=null):(e!==null&&Rh(t,null),_g(),Ca());return rn(e,t,s,n),t.child}function dc(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Ax(e,t,n,i,s){var a=b0();return a=a===null?null:{parent:tn._currentValue,pool:a},t.memoizedState={baseLanes:n,cachePool:a},e!==null&&Rh(t,null),_g(),_S(t),e!==null&&br(e,t,i,!0),t.childLanes=s,null}function Lh(e,t){return t=Nd({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function Cx(e,t,n){return Er(t,e.child,null,n),e=Lh(t,t.pendingProps),e.flags|=2,li(t),t.memoizedState=null,e}function lC(e,t,n){var i=t.pendingProps,s=(t.flags&128)!==0;if(t.flags&=-129,e===null){if($t){if(i.mode==="hidden")return e=Lh(t,i),t.lanes=536870912,e.memoizedState={baseLanes:0,cachePool:null},dc(null,e);if(xg(t),(e=Ie)?(e=s1(e,Di),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Ua!==null?{id:hs,overflow:ds}:null,retryLane:536870912,hydrationErrors:null},n=cS(e),n.return=t,t.child=n,mn=t,Ie=null)):e=null,e===null)throw Ia(t);return t.lanes=536870912,null}return Lh(t,i)}var a=e.memoizedState;if(a!==null){var r=a.dehydrated;if(xg(t),s)if(t.flags&256)t.flags&=-257,t=Cx(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(st(558));else if(en||br(e,t,n,!1),s=(n&e.childLanes)!==0,en||s){if(Pa.current===null){if(i=Ae,i!==null&&(r=Ib(i,n),r!==0&&r!==a.retryLane))throw a.retryLane=r,Dr(e,r),ei(i,e,r),z0;dd()}t=Cx(e,t,n)}else e=a.treeContext,Ie=Li(r.nextSibling),mn=t,$t=!0,Ea=null,Di=!1,e!==null&&hS(t,e),t=Lh(t,i),t.flags|=134221824;return t}return e=Bs(e.child,{mode:i.mode,children:i.children}),e.ref=t.ref,t.child=e,e.return=t,e}function ro(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!="function"&&typeof n!="object")throw Error(st(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function wg(e,t,n,i,s){return Sr(t),n=A0(e,t,n,i,void 0,s),i=C0(),e!==null&&!en?(R0(e,t,s),ks(e,t,s)):($t&&i&&Ed(t),t.flags|=1,rn(e,t,n,s),t.child)}function Rx(e,t,n,i,s,a){return Sr(t),t.updateQueue=null,n=bS(t,i,n,s),xS(e),i=C0(),e!==null&&!en?(R0(e,t,a),ks(e,t,a)):($t&&i&&Ed(t),t.flags|=1,rn(e,t,n,a),t.child)}function Nx(e,t,n,i,s){if(Sr(t),t.stateNode===null){var a=yo,r=n.contextType;typeof r=="object"&&r!==null&&(a=bn(r)),a=new n(i,a),t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,a.updater=Eg,t.stateNode=a,a._reactInternals=t,a=t.stateNode,a.props=i,a.state=t.memoizedState,a.refs={},M0(t),r=n.contextType,a.context=typeof r=="object"&&r!==null?bn(r):yo,a.state=t.memoizedState,r=n.getDerivedStateFromProps,typeof r=="function"&&(Im(t,n,r,i),a.state=t.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof a.getSnapshotBeforeUpdate=="function"||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(r=a.state,typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount(),r!==a.state&&Eg.enqueueReplaceState(a,a.state,null),uc(t,i,a,s),cc(),a.state=t.memoizedState),typeof a.componentDidMount=="function"&&(t.flags|=4194308),i=!0}else if(e===null){a=t.stateNode;var o=t.memoizedProps,l=wr(n,o);a.props=l;var c=a.context,u=n.contextType;r=yo,typeof u=="object"&&u!==null&&(r=bn(u));var d=n.getDerivedStateFromProps;u=typeof d=="function"||typeof a.getSnapshotBeforeUpdate=="function",o=t.pendingProps!==o,u||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(o||c!==r)&&Mx(t,a,i,r),ma=!1;var h=t.memoizedState;a.state=h,uc(t,i,a,s),cc(),c=t.memoizedState,o||h!==c||ma?(typeof d=="function"&&(Im(t,n,d,i),c=t.memoizedState),(l=ma||Sx(t,n,l,i,h,c,r))?(u||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount=="function"&&(t.flags|=4194308)):(typeof a.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=i,t.memoizedState=c),a.props=i,a.state=c,a.context=r,i=l):(typeof a.componentDidMount=="function"&&(t.flags|=4194308),i=!1)}else{a=t.stateNode,vg(e,t),r=t.memoizedProps,u=wr(n,r),a.props=u,d=t.pendingProps,h=a.context,c=n.contextType,l=yo,typeof c=="object"&&c!==null&&(l=bn(c)),o=n.getDerivedStateFromProps,(c=typeof o=="function"||typeof a.getSnapshotBeforeUpdate=="function")||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(r!==d||h!==l)&&Mx(t,a,i,l),ma=!1,h=t.memoizedState,a.state=h,uc(t,i,a,s),cc();var p=t.memoizedState;r!==d||h!==p||ma||e!==null&&e.dependencies!==null&&Jh(e.dependencies)?(typeof o=="function"&&(Im(t,n,o,i),p=t.memoizedState),(u=ma||Sx(t,n,u,i,h,p,l)||e!==null&&e.dependencies!==null&&Jh(e.dependencies))?(c||typeof a.UNSAFE_componentWillUpdate!="function"&&typeof a.componentWillUpdate!="function"||(typeof a.componentWillUpdate=="function"&&a.componentWillUpdate(i,p,l),typeof a.UNSAFE_componentWillUpdate=="function"&&a.UNSAFE_componentWillUpdate(i,p,l)),typeof a.componentDidUpdate=="function"&&(t.flags|=4),typeof a.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof a.componentDidUpdate!="function"||r===e.memoizedProps&&h===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&h===e.memoizedState||(t.flags|=1024),t.memoizedProps=i,t.memoizedState=p),a.props=i,a.state=p,a.context=l,i=u):(typeof a.componentDidUpdate!="function"||r===e.memoizedProps&&h===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&h===e.memoizedState||(t.flags|=1024),i=!1)}return a=i,ro(e,t),i=(t.flags&128)!==0,a||i?(a=t.stateNode,n=i&&typeof n.getDerivedStateFromError!="function"?null:a.render(),t.flags|=1,e!==null&&i?(t.child=Er(t,e.child,null,s),t.child=Er(t,null,n,s)):rn(e,t,n,s),t.memoizedState=a.state,e=t.child):e=ks(e,t,s),e}function Dx(e,t,n,i){return xr(),t.flags|=256,rn(e,t,n,i),t.child}var Ag={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function Cg(e){return{baseLanes:e,cachePool:fS()}}function Rg(e,t,n){return e=e!==null?e.childLanes&~n:0,t&&(e|=ui),e}function aM(e,t,n){var i=t.pendingProps,s=!1,a=(t.flags&128)!==0,r;if((r=a)||(r=e!==null&&e.memoizedState===null?!1:(Mn.current&2)!==0),r&&(s=!0,t.flags&=-129),r=(t.flags&32)!==0,t.flags&=-33,e===null){if($t){if(s?Aa(t):Ca(),(e=Ie)?(e=s1(e,Di),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Ua!==null?{id:hs,overflow:ds}:null,retryLane:536870912,hydrationErrors:null},n=cS(e),n.return=t,t.child=n,mn=t,Ie=null)):e=null,e===null)throw Ia(t);return $0(e)?t.lanes=32:t.lanes=536870912,null}return a=i.children,i=i.fallback,s?(Ca(),s=t.mode,a=Nd({mode:"hidden",children:a},s),i=gr(i,s,n,null),a.return=t,i.return=t,a.sibling=i,t.child=a,i=t.child,i.memoizedState=Cg(n),i.childLanes=Rg(e,r,n),t.memoizedState=Ag,dc(null,i)):(Aa(t),F0(t,a))}var o=e.memoizedState;if(o!==null){var l=o.dehydrated;if(l!==null)return cC(e,t,a,r,i,l,o,n)}return s?(Ca(),s=i.fallback,a=t.mode,o=e.child,l=o.sibling,i=Bs(o,{mode:"hidden",children:i.children}),i.subtreeFlags=o.subtreeFlags&1206910976,l!==null?s=Bs(l,s):(s=gr(s,a,n,null),s.flags|=2),s.return=t,i.return=t,i.sibling=s,t.child=i,dc(null,i),i=t.child,s=e.child.memoizedState,s===null?s=Cg(n):(a=s.cachePool,a!==null?(o=tn._currentValue,a=a.parent!==o?{parent:o,pool:o}:a):a=fS(),s={baseLanes:s.baseLanes|n,cachePool:a}),i.memoizedState=s,i.childLanes=Rg(e,r,n),t.memoizedState=Ag,dc(e.child,i)):(Aa(t),n=e.child,e=n.sibling,n=Bs(n,{mode:"visible",children:i.children}),n.return=t,n.sibling=null,e!==null&&(r=t.deletions,r===null?(t.deletions=[e],t.flags|=16):r.push(e)),t.child=n,t.memoizedState=null,n)}function F0(e,t){return t=Nd({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function Nd(e,t){return e=ti(22,e,null,t),e.lanes=0,e}function fh(e,t,n){return Er(t,e.child,null,n),e=F0(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function cC(e,t,n,i,s,a,r,o){if(n)return t.flags&256?(Aa(t),t.flags&=-257,fh(e,t,o)):t.memoizedState!==null?(Ca(),t.child=e.child,t.flags|=128,null):(Ca(),a=s.fallback,r=t.mode,s=Nd({mode:"visible",children:s.children},r),a=gr(a,r,o,null),a.flags|=2,s.return=t,a.return=t,s.sibling=a,t.child=s,Er(t,e.child,null,o),s=t.child,s.memoizedState=Cg(o),s.childLanes=Rg(e,i,o),t.memoizedState=Ag,dc(null,s));if(Aa(t),$0(a)){if(i=a.nextSibling&&a.nextSibling.dataset,i)var l=i.dgst;return i=l,i!==""&&(s=Error(st(419)),s.stack="",s.digest=i,Sc({value:s,source:null,stack:null})),fh(e,t,o)}if(en||br(e,t,o,!1),i=(o&e.childLanes)!==0,en||i){if(Pa.current!==null)return fh(e,t,o);if(i=Ae,i!==null&&(s=Ib(i,o),s!==0&&s!==r.retryLane))throw r.retryLane=s,Dr(e,s),ei(i,e,s),z0;return t0(a)||dd(),fh(e,t,o)}return t0(a)?(t.flags|=192,t.child=e.child,null):(e=r.treeContext,Ie=Li(a.nextSibling),mn=t,$t=!0,Ea=null,Di=!1,e!==null&&hS(t,e),t=F0(t,s.children),t.flags|=134221824,t)}function Lx(e,t,n){e.lanes|=t;var i=e.alternate;i!==null&&(i.lanes|=t),Ch(e.return,t,n)}function Ux(e){for(var t=null;e!==null;){var n=e.alternate;n!==null&&td(n)===null&&(t=e),e=e.sibling}return t}function ph(e,t,n,i,s,a){var r=e.memoizedState;r===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:i,tail:n,tailMode:s,treeForkCount:a}:(r.isBackwards=t,r.rendering=null,r.renderingStartTime=0,r.last=i,r.tail=n,r.tailMode=s,r.treeForkCount=a)}function Pm(e){var t=e.child;for(e.child=null;t!==null;){var n=t.sibling;t.sibling=e.child,e.child=t,t=n}}function Ng(e,t,n){var i=t.pendingProps,s=i.revealOrder,a=i.tail;i=i.children;var r=Mn.current;if(t.flags&128)return Ec(t,r),null;var o=(r&2)!==0;if(o?(r=r&1|2,t.flags|=128):r&=1,Ec(t,r),s==="backwards"&&e!==null?(Pm(e),rn(e,t,i,n),Pm(e)):rn(e,t,i,n),i=$t?bc:0,!o&&e!==null&&(e.flags&128)!==0)t:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Lx(e,n,t);else if(e.tag===19)Lx(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break t;for(;e.sibling===null;){if(e.return===null||e.return===t)break t;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(s){case"backwards":n=Ux(t.child),n===null?(s=t.child,t.child=null):(s=n.sibling,n.sibling=null,Pm(t)),ph(t,!0,s,null,a,i);break;case"unstable_legacy-backwards":for(n=null,s=t.child,t.child=null;s!==null;){if(e=s.alternate,e!==null&&td(e)===null){t.child=s;break}e=s.sibling,s.sibling=n,n=s,s=e}ph(t,!0,n,null,a,i);break;case"together":ph(t,!1,null,null,void 0,i);break;case"independent":t.memoizedState=null;break;default:n=Ux(t.child),n===null?(s=t.child,t.child=null):(s=n.sibling,n.sibling=null),ph(t,!1,s,n,a,i)}return t.child}function Ix(e,t,n){var i=t.pendingProps;return _a(t,t.type,i.value),rn(e,t,i.children,n),t.child}function ks(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Ba|=t.lanes,(n&t.childLanes)===0)if(e!==null){if(br(e,t,n,!1),(n&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(st(153));if(t.child!==null){for(e=t.child,n=Bs(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Bs(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function G0(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&Jh(e)))}function uC(e,t,n){switch(t.tag){case 3:kh(t,t.stateNode.containerInfo),_a(t,tn,e.memoizedState.cache),xr();break;case 27:case 5:ig(t);break;case 4:kh(t,t.stateNode.containerInfo);break;case 10:_a(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,xg(t),null;break;case 13:var i=t.memoizedState;if(i!==null){if(i.dehydrated!==null)return Aa(t),t.flags|=128,null;i=br(e,t,n,!1);var s=t.child.childLanes;return i||(n&s)!==0?aM(e,t,n):(Aa(t),e=ks(e,t,n),e!==null?e.sibling:null)}Aa(t);break;case 19:if(t.flags&128)return Ng(e,t,n);if(s=(e.flags&128)!==0,i=(n&t.childLanes)!==0,i||(br(e,t,n,!1),i=(n&t.childLanes)!==0),s){if(i)return Ng(e,t,n);t.flags|=128}if(s=t.memoizedState,s!==null&&(s.rendering=null,s.tail=null,s.lastEffect=null),Ec(t,Mn.current),i)break;return null;case 22:return t.lanes=0,sM(e,t,n,t.pendingProps);case 24:_a(t,tn,e.memoizedState.cache)}return ks(e,t,n)}function rM(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps)en=!0;else{if(!G0(e,n)&&(t.flags&128)===0)return en=!1,uC(e,t,n);en=(e.flags&131072)!==0}else en=!1,$t&&(t.flags&1048576)!==0&&uS(t,bc,t.index);switch(t.lanes=0,t.tag){case 16:t:{var i=t.pendingProps;if(e=hr(t.elementType),t.type=e,typeof e=="function")y0(e)?(i=wr(e,i),t.tag=1,t=Nx(null,t,e,i,n)):(t.tag=0,t=wg(null,t,e,i,n));else{if(e!=null){var s=e.$$typeof;if(s===a0){t.tag=11,t=Tx(null,t,e,i,n);break t}else if(s===r0){t.tag=14,t=wx(null,t,e,i,n);break t}else if(s===cs){t.tag=10,t.type=e,t=Ix(null,t,n);break t}}throw t=eg(e)||e,Error(st(306,t,""))}}return t;case 0:return wg(e,t,t.type,t.pendingProps,n);case 1:return i=t.type,s=wr(i,t.pendingProps),Nx(e,t,i,s,n);case 3:t:{if(kh(t,t.stateNode.containerInfo),e===null)throw Error(st(387));i=t.pendingProps;var a=t.memoizedState;s=a.element,vg(e,t),uc(t,i,null,n);var r=t.memoizedState;if(i=r.cache,_a(t,tn,i),i!==a.cache&&mg(t,[tn],n,!0),cc(),i=r.element,a.isDehydrated)if(a={element:i,isDehydrated:!1,cache:r.cache},t.updateQueue.baseState=a,t.memoizedState=a,t.flags&256){t=Dx(e,t,i,n);break t}else if(i!==s){s=Ni(Error(st(424)),t),Sc(s),t=Dx(e,t,i,n);break t}else{switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName==="HTML"?e.ownerDocument.body:e}for(Ie=Li(e.firstChild),mn=t,$t=!0,Ea=null,Di=!0,n=gS(t,null,i,n),t.child=n;n;)n.flags=n.flags&-3|134221824,n=n.sibling}else{if(xr(),i===s){t=ks(e,t,n);break t}rn(e,t,i,n)}t=t.child}return t;case 26:return ro(e,t),e===null?(n=ob(t.type,null,t.pendingProps,null))?t.memoizedState=n:$t||(t.stateNode=ZM(t.type,t.pendingProps,Ma.current,t)):t.memoizedState=ob(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return ig(t),e===null&&$t&&(i=t.stateNode=a1(t.type,t.pendingProps,Ma.current),mn=t,Di=!0,s=Ie,Fa(t.type)?(e0=s,Ie=Li(i.firstChild)):Ie=s),rn(e,t,t.pendingProps.children,n),ro(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&$t&&((s=i=Ie)&&(i=nR(i,t.type,t.pendingProps,Di),i!==null?(t.stateNode=i,mn=t,Ie=Li(i.firstChild),Di=!1,s=!0):s=!1),s||Ia(t)),ig(t),s=t.type,a=t.pendingProps,r=e!==null?e.memoizedProps:null,i=a.children,Jg(s,a)?i=null:r!==null&&Jg(s,r)&&(t.flags|=32),t.memoizedState!==null&&(s=A0(e,t,QA,null,null,n),Vo._currentValue=s),ro(e,t),rn(e,t,i,n),t.child;case 6:return e===null&&$t&&((e=n=Ie)&&(n=iR(n,t.pendingProps,Di),n!==null?(t.stateNode=n,mn=t,Ie=null,e=!0):e=!1),e||Ia(t)),null;case 13:return aM(e,t,n);case 4:return kh(t,t.stateNode.containerInfo),i=t.pendingProps,e===null?t.child=Er(t,null,i,n):rn(e,t,i,n),t.child;case 11:return Tx(e,t,t.type,t.pendingProps,n);case 7:return i=t.pendingProps,ro(e,t),rn(e,t,i,n),t.child;case 8:return rn(e,t,t.pendingProps.children,n),t.child;case 12:return rn(e,t,t.pendingProps.children,n),t.child;case 10:return Ix(e,t,n);case 9:return s=t.type._context,i=t.pendingProps.children,Sr(t),s=bn(s),i=i(s),t.flags|=1,rn(e,t,i,n),t.child;case 14:return wx(e,t,t.type,t.pendingProps,n);case 15:return iM(e,t,t.type,t.pendingProps,n);case 19:return Ng(e,t,n);case 31:return lC(e,t,n);case 22:return sM(e,t,n,t.pendingProps);case 24:return Sr(t),i=bn(tn),e===null?(s=b0(),s===null&&(s=Ae,a=x0(),s.pooledCache=a,a.refCount++,a!==null&&(s.pooledCacheLanes|=n),s=a),t.memoizedState={parent:i,cache:s},M0(t),_a(t,tn,s)):((e.lanes&n)!==0&&(vg(e,t),uc(t,null,null,n),cc()),s=e.memoizedState,a=t.memoizedState,s.parent!==i?(s={parent:i,cache:i},t.memoizedState=s,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=s),_a(t,tn,i)):(i=a.cache,_a(t,tn,i),i!==s.cache&&mg(t,[tn],n,!0))),rn(e,t,t.pendingProps.children,n),t.child;case 30:return t.stateNode===null&&(t.stateNode={autoName:null,paired:null,clones:null,ref:null}),i=t.pendingProps,i.name!=null&&i.name!=="auto"?t.flags|=e===null?18882560:18874368:$t&&Ed(t),e!==null&&e.memoizedProps.name!==i.name?t.flags|=4194816:ro(e,t),rn(e,t,i.children,n),t.child;case 29:throw t.pendingProps}throw Error(st(156,t.tag))}function Is(e){e.flags|=4}function Om(e,t,n,i,s){var a;if((a=(e.mode&32)!==0)&&(a=n===null?ub(t,i):ub(t,i)&&(i.src!==n.src||i.srcSet!==n.srcSet)),a){if(e.flags|=16777216,(s&335544128)===s)if(e.stateNode.complete)e.flags|=8192;else if(PM())e.flags|=8192;else throw yr=$h,S0}else e.flags&=-16777217}function Px(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!c1(t))if(PM())e.flags|=8192;else throw yr=$h,S0}function mh(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?Db():536870912,e.lanes|=t,Oo|=t)}function Zl(e,t){if(!$t)switch(e.tailMode){case"visible":break;case"collapsed":for(var n=e.tail,i=null;n!==null;)n.alternate!==null&&(i=n),n=n.sibling;i===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:i.sibling=null;break;default:for(t=e.tail,n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null}}function Ue(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,i=0;if(t)for(var s=e.child;s!==null;)n|=s.lanes|s.childLanes,i|=s.subtreeFlags&1206910976,i|=s.flags&1206910976,s.return=e,s=s.sibling;else for(s=e.child;s!==null;)n|=s.lanes|s.childLanes,i|=s.subtreeFlags,i|=s.flags,s.return=e,s=s.sibling;return e.subtreeFlags|=i,e.childLanes=n,t}function hC(e,t,n){var i=t.pendingProps;switch(_0(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Ue(t),null;case 1:return Ue(t),null;case 3:return n=t.stateNode,i=null,e!==null&&(i=e.memoizedState.cache),t.memoizedState.cache!==i&&(t.flags|=2048),zs(tn),Lo(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(so(t)?Is(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Dm())),Ue(t),null;case 26:var s=t.type,a=t.memoizedState;return e===null?(Is(t),a!==null?(Ue(t),Px(t,a)):(Ue(t),Om(t,s,null,i,n))):a?a!==e.memoizedState?(Is(t),Ue(t),Px(t,a)):(Ue(t),t.flags&=-16777217):(e=e.memoizedProps,e!==i&&Is(t),Ue(t),Om(t,s,e,i,n)),null;case 27:if(Xh(t),n=Ma.current,s=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&Is(t);else{if(!i){if(t.stateNode===null)throw Error(st(166));return Ue(t),t.subtreeFlags&=-33554433,null}e=fs.current,so(t)?lx(t,e):(e=a1(s,i,n),t.stateNode=e,Is(t))}return Ue(t),t.subtreeFlags&=-33554433,null;case 5:if(Xh(t),s=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&Is(t);else{if(!i){if(t.stateNode===null)throw Error(st(166));return Ue(t),t.subtreeFlags&=-33554433,null}if(a=fs.current,so(t))lx(t,a);else{var r=Cc(Ma.current);switch(a){case 1:a=r.createElementNS("http://www.w3.org/2000/svg",s);break;case 2:a=r.createElementNS("http://www.w3.org/1998/Math/MathML",s);break;default:switch(s){case"svg":a=r.createElementNS("http://www.w3.org/2000/svg",s);break;case"math":a=r.createElementNS("http://www.w3.org/1998/Math/MathML",s);break;case"script":a=r.createElement("div"),a.innerHTML="<script><\/script>",a=a.removeChild(a.firstChild);break;case"select":a=typeof i.is=="string"?r.createElement("select",{is:i.is}):r.createElement("select"),i.multiple?a.multiple=!0:i.size&&(a.size=i.size);break;default:a=typeof i.is=="string"?r.createElement(s,{is:i.is}):r.createElement(s)}}a[xn]=t,a[ii]=i;t:for(r=t.child;r!==null;){if(r.tag===5||r.tag===6)a.appendChild(r.stateNode);else if(r.tag!==4&&r.tag!==27&&r.child!==null){r.child.return=r,r=r.child;continue}if(r===t)break t;for(;r.sibling===null;){if(r.return===null||r.return===t)break t;r=r.return}r.sibling.return=r.return,r=r.sibling}t.stateNode=a;t:switch(En(a,s,i),s){case"button":case"input":case"select":case"textarea":i=!!i.autoFocus;break t;case"img":i=!0;break t;default:i=!1}i&&Is(t)}}return Ue(t),t.subtreeFlags&=-33554433,Om(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==i&&Is(t);else{if(typeof i!="string"&&t.stateNode===null)throw Error(st(166));if(e=Ma.current,so(t)){if(e=t.stateNode,n=t.memoizedProps,i=null,s=mn,s!==null)switch(s.tag){case 27:case 5:i=s.memoizedProps}e[xn]=t,e=!!(e.nodeValue===n||i!==null&&i.suppressHydrationWarning===!0||YM(e.nodeValue,n)),e||Ia(t,!0)}else e=Cc(e).createTextNode(i),e[xn]=t,t.stateNode=e}return Ue(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(i=so(t),n!==null){if(e===null){if(!i)throw Error(st(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(st(557));e[xn]=t}else xr(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;Ue(t),e=!1}else n=Dm(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(li(t),t):(li(t),null);if((t.flags&128)!==0)throw Error(st(558))}return Ue(t),null;case 13:if(i=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(s=so(t),i!==null&&i.dehydrated!==null){if(e===null){if(!s)throw Error(st(318));if(s=t.memoizedState,s=s!==null?s.dehydrated:null,!s)throw Error(st(317));s[xn]=t}else xr(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;Ue(t),s=!1}else s=Dm(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=s),s=!0;if(!s)return t.flags&256?(li(t),t):(li(t),null)}return li(t),(t.flags&128)!==0?(t.lanes=n,t):(n=i!==null,e=e!==null&&e.memoizedState!==null,n&&(i=t.child,s=null,i.alternate!==null&&i.alternate.memoizedState!==null&&i.alternate.memoizedState.cachePool!==null&&(s=i.alternate.memoizedState.cachePool.pool),a=null,i.memoizedState!==null&&i.memoizedState.cachePool!==null&&(a=i.memoizedState.cachePool.pool),a!==s&&(i.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),mh(t,t.updateQueue),Ue(t),null);case 4:return Lo(),e===null&&Z0(t.stateNode.containerInfo),t.flags|=67108864,Ue(t),null;case 10:return zs(t.type),Ue(t),null;case 19:if(T0(t),i=t.memoizedState,i===null)return Ue(t),null;if(s=(t.flags&128)!==0,a=i.rendering,a===null)if(s)Zl(i,!1);else{if(je!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(a=td(e),a!==null){for(t.flags|=128,Zl(i,!1),e=a.updateQueue,t.updateQueue=e,mh(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)lS(n,e),n=n.sibling;return Ec(t,Mn.current&1|2),$t&&Ps(t,i.treeForkCount),t.child}e=e.sibling}i.tail!==null&&hi()>ud&&(t.flags|=128,s=!0,Zl(i,!1),t.lanes=4194304)}else{if(!s)if(e=td(a),e!==null){if(t.flags|=128,s=!0,e=e.updateQueue,t.updateQueue=e,mh(t,e),Zl(i,!0),i.tail===null&&i.tailMode!=="collapsed"&&i.tailMode!=="visible"&&!a.alternate&&!$t)return Ue(t),null}else 2*hi()-i.renderingStartTime>ud&&n!==536870912&&(t.flags|=128,s=!0,Zl(i,!1),t.lanes=4194304);i.isBackwards?(a.sibling=t.child,t.child=a):(e=i.last,e!==null?e.sibling=a:t.child=a,i.last=a)}if(i.tail!==null){e=i.tail;t:{for(n=e;n!==null;){if(n.alternate!==null){n=!1;break t}n=n.sibling}n=!0}return i.rendering=e,i.tail=e.sibling,i.renderingStartTime=hi(),e.sibling=null,a=Mn.current,a=s?a&1|2:a&1,i.tailMode==="visible"||i.tailMode==="collapsed"||!n||$t?Ec(t,a):(n=a,Pe(Tn,t),Pe(Mn,n),Ln===null&&(Ln=t)),$t&&Ps(t,i.treeForkCount),e}return Ue(t),null;case 22:case 23:return li(t),E0(),i=t.memoizedState!==null,e!==null?e.memoizedState!==null!==i&&(t.flags|=8192):i&&(t.flags|=8192),i?(n&536870912)!==0&&(t.flags&128)===0&&(Ue(t),t.subtreeFlags&6&&(t.flags|=8192)):Ue(t),n=t.updateQueue,n!==null&&mh(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),i=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(i=t.memoizedState.cachePool.pool),i!==n&&(t.flags|=2048),e!==null&&Sn(vr),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),zs(tn),Ue(t),null;case 25:return null;case 30:return t.flags|=33554432,Ue(t),null}throw Error(st(156,t.tag))}function dC(e,t){switch(_0(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return zs(tn),Lo(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return Xh(t),null;case 31:if(t.memoizedState!==null){if(li(t),t.alternate===null)throw Error(st(340));xr()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(li(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(st(340));xr()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return T0(t),e=t.flags,e&65536?(t.flags=e&-65537|128,e=t.memoizedState,e!==null&&(e.rendering=null,e.tail=null),t.flags|=4,t):null;case 4:return Lo(),null;case 10:return zs(t.type),null;case 22:case 23:return li(t),E0(),e!==null&&Sn(vr),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return zs(tn),null;case 25:return null;default:return null}}function oM(e,t){switch(_0(t),t.tag){case 3:zs(tn),Lo();break;case 26:case 27:case 5:Xh(t);break;case 4:Lo();break;case 31:t.memoizedState!==null&&li(t);break;case 13:li(t);break;case 19:T0(t);break;case 10:zs(t.type);break;case 22:case 23:li(t),E0(),e!==null&&Sn(vr);break;case 24:zs(tn)}}function Hc(e,t){try{var n=t.updateQueue,i=n!==null?n.lastEffect:null;if(i!==null){var s=i.next;n=s;do{if((n.tag&e)===e){i=void 0;var a=n.create,r=n.inst;i=a(),r.destroy=i}n=n.next}while(n!==s)}}catch(o){be(t,t.return,o)}}function Oa(e,t,n){try{var i=t.updateQueue,s=i!==null?i.lastEffect:null;if(s!==null){var a=s.next;i=a;do{if((i.tag&e)===e){var r=i.inst,o=r.destroy;if(o!==void 0){r.destroy=void 0,s=t;var l=n,c=o;try{c()}catch(u){be(s,l,u)}}}i=i.next}while(i!==a)}}catch(u){be(t,t.return,u)}}function lM(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{yS(t,n)}catch(i){be(e,e.return,i)}}}function cM(e,t,n){n.props=wr(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(i){be(e,t,i)}}function os(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var i=e.stateNode;break;case 30:var s=e.stateNode,a=Gs(e.memoizedProps,s);(s.ref===null||s.ref.name!==a)&&(s.ref=QM(a)),i=s.ref;break;case 7:if(e.stateNode===null){var r=new gi(e);ni(e.child,!1,tR,r,void 0,void 0),e.stateNode=r}i=e.stateNode;break;default:i=e.stateNode}typeof n=="function"?e.refCleanup=n(i):n.current=i}}catch(o){be(e,t,o)}}function _n(e,t){var n=e.ref,i=e.refCleanup;if(n!==null)if(typeof i=="function")try{i()}catch(s){be(e,t,s)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n=="function")try{n(null)}catch(s){be(e,t,s)}else n.current=null}function ad(e,t){if((e.tag===5||e.tag===27||e.tag===6)&&e.alternate===null&&t!==null)for(var n=0;n<t.length;n++)i1(e.stateNode,t[n])}function Ox(e){for(var t=e.return;t!==null&&(V0(t)&&i1(e.stateNode,t.stateNode),!H0(t));)t=t.return}function fc(e){for(var t=e.return;t!==null&&(V0(t)&&eR(e.stateNode,t.stateNode),!H0(t));)t=t.return}function H0(e){return e.tag===5||e.tag===3||e.tag===27}function V0(e){return e&&e.tag===7&&e.stateNode!==null}function Dg(e){var t=e.type,n=e.memoizedProps,i=e.stateNode;try{t:switch(t){case"button":case"input":case"select":case"textarea":n.autoFocus&&i.focus();break t;case"img":n.src?i.src=n.src:n.srcSet&&(i.srcset=n.srcSet)}}catch(s){be(e,e.return,s)}}function Bm(e,t,n){try{var i=e.stateNode;OC(i,e.type,n,t),i[ii]=t}catch(s){be(e,e.return,s)}}function uM(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Fa(e.type)||e.tag===4}function zm(e){t:for(;;){for(;e.sibling===null;){if(e.return===null||uM(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Fa(e.type)||e.flags&2||e.child===null||e.tag===4)continue t;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Lg(e,t,n,i){var s=e.tag;if(s===5||s===6)s=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n).insertBefore(s,t):(t=n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n,t.appendChild(s),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=us)),ad(e,i),he=!0;else if(s!==4&&(s===27&&(ad(e,i),i=null,Fa(e.type)&&(n=e.stateNode,t=null)),e=e.child,e!==null))for(Lg(e,t,n,i),e=e.sibling;e!==null;)Lg(e,t,n,i),e=e.sibling}function rd(e,t,n,i){var s=e.tag;if(s===5||s===6)s=e.stateNode,t?n.insertBefore(s,t):n.appendChild(s),ad(e,i),he=!0;else if(s!==4&&(s===27&&(ad(e,i),i=null,Fa(e.type)&&(n=e.stateNode)),e=e.child,e!==null))for(rd(e,t,n,i),e=e.sibling;e!==null;)rd(e,t,n,i),e=e.sibling}function hM(e){var t=e.stateNode,n=e.memoizedProps;try{for(var i=e.type,s=t.attributes;s.length;)t.removeAttributeNode(s[0]);En(t,i,n),t[xn]=e,t[ii]=n}catch(a){be(e,e.return,a)}}var od=!1,ci=null;function Bx(e){(e.tag===30||(e.subtreeFlags&33554432)!==0)&&(od=!0)}var ls=null;function zx(){var e=ls;return ls=null,e}var Qn=0;function jo(e,t,n,i,s){return Qn=0,dM(e.child,t,n,i,s)}function dM(e,t,n,i,s){for(var a=!1;e!==null;){if(e.tag===5){var r=e.stateNode;if(i!==null){var o=$g(r);i.push(o),o.view&&(a=!0)}else a||$g(r).view&&(a=!0);od=!0,KM(r,Qn===0?t:t+"_"+Qn,n),Qn++}else(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&s||dM(e.child,t,n,i,s)&&(a=!0));e=e.sibling}return a}function ms(e,t){for(;e!==null;)e.tag===5?JM(e.stateNode,e.memoizedProps):(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&t||ms(e.child,t)),e=e.sibling}function Uh(e){if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if((e.tag!==22||e.memoizedState===null)&&(Uh(e),e.tag===30&&(e.flags&18874368)!==0&&e.stateNode.paired)){var t=e.memoizedProps;if(t.name==null||t.name==="auto")throw Error(st(544));var n=t.name;t=qs(t.default,t.share),t!=="none"&&(jo(e,n,t,null,!1)||ms(e.child,!1))}e=e.sibling}}function Ug(e,t){if(e.tag===30){var n=e.stateNode,i=e.memoizedProps,s=Gs(i,n),a=qs(i.default,n.paired?i.share:i.enter);a!=="none"?jo(e,s,a,null,!1)?(Uh(e),n.paired||t||Bo(e,i.onEnter)):ms(e.child,!1):Uh(e)}else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)Ug(e,t),e=e.sibling;else Uh(e)}function Ig(e){if(ci!==null&&ci.size!==0){var t=ci;if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&(e.flags&18874368)!==0){var n=e.memoizedProps,i=n.name;if(i!=null&&i!=="auto"){var s=t.get(i);if(s!==void 0){var a=qs(n.default,n.share);if(a!=="none"&&(jo(e,i,a,null,!1)?(a=e.stateNode,s.paired=a,a.paired=s,Bo(e,n.onShare)):ms(e.child,!1)),t.delete(i),t.size===0)break}}}Ig(e)}e=e.sibling}}}function Pg(e){if(e.tag===30){var t=e.memoizedProps,n=Gs(t,e.stateNode),i=ci!==null?ci.get(n):void 0,s=qs(t.default,i!==void 0?t.share:t.exit);s!=="none"&&(jo(e,n,s,null,!1)?i!==void 0?(s=e.stateNode,i.paired=s,s.paired=i,ci.delete(n),Bo(e,t.onShare)):Bo(e,t.onExit):ms(e.child,!1)),ci!==null&&Ig(e)}else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)Pg(e),e=e.sibling;else ci!==null&&Ig(e)}function fM(e){for(e=e.child;e!==null;){if(e.tag===30){var t=e.memoizedProps,n=Gs(t,e.stateNode);t=qs(t.default,t.update),e.flags&=-5,t!=="none"&&jo(e,n,t,e.memoizedState=[],!1)}else(e.subtreeFlags&33554432)!==0&&fM(e);e=e.sibling}}function Og(e){if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&(e.flags&18874368)!==0){var t=e.stateNode;t.paired!==null&&(t.paired=null,ms(e.child,!1))}Og(e)}e=e.sibling}}function Ih(e){if(e.tag===30)e.stateNode.paired=null,ms(e.child,!1),Og(e);else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)Ih(e),e=e.sibling;else Og(e)}function pM(e){for(e=e.child;e!==null;)e.tag===30?ms(e.child,!1):(e.subtreeFlags&33554432)!==0&&pM(e),e=e.sibling}function k0(e,t,n,i,s,a,r){for(var o=!1;t!==null;){if(t.tag===5){var l=t.stateNode;if(a!==null&&Qn<a.length){var c=a[Qn],u=$g(l);(c.view||u.view)&&(o=!0);var d;if(d=(e.flags&4)===0)if(u.clip)d=!0;else{d=c.rect;var h=u.rect;d=d.y!==h.y||d.x!==h.x||d.height!==h.height||d.width!==h.width}d&&(e.flags|=4),u.abs?u=!c.abs:(c=c.rect,u=u.rect,u=c.height!==u.height||c.width!==u.width),u&&(e.flags|=32)}else e.flags|=32;(e.flags&4)!==0&&KM(l,Qn===0?n:n+"_"+Qn,s),o&&(e.flags&4)!==0||(ls===null&&(ls=[]),ls.push(l,Qn===0?i:i+"_"+Qn,t.memoizedProps)),Qn++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&r?e.flags|=t.flags&32:k0(e,t.child,n,i,s,a,r)&&(o=!0));t=t.sibling}return o}function mM(e,t){for(e=e.child;e!==null;){if(e.tag===30){var n=e.memoizedProps,i=e.stateNode,s=Gs(n,i),a=qs(n.default,n.update);if(t){i=i.clones;var r=i===null?null:i.map(VC)}else r=e.memoizedState,e.memoizedState=null;i=e;var o=e.child;Qn=0,s=k0(i,o,s,s,a,r,!1),(e.flags&4)!==0&&s&&(t||Bo(e,n.onUpdate))}else(e.subtreeFlags&33554432)!==0&&mM(e,t);e=e.sibling}}var dn=!1,ve=!1,ss=!1,Fm=!1,Fx=typeof WeakSet=="function"?WeakSet:Set,fn=null,as=!1,ic=!1,ld=!1,Bg=!1;function fC(e,t,n){if(e=e.containerInfo,Zg=ko,e=tS(e),m0(e)){if("selectionStart"in e)var i={start:e.selectionStart,end:e.selectionEnd};else t:{i=(i=e.ownerDocument)&&i.defaultView||window;var s=i.getSelection&&i.getSelection();if(s&&s.rangeCount!==0){i=s.anchorNode;var a=s.anchorOffset,r=s.focusNode;s=s.focusOffset;try{i.nodeType,r.nodeType}catch{i=null;break t}var o=0,l=-1,c=-1,u=0,d=0,h=e,p=null;e:for(;;){for(var m;h!==i||a!==0&&h.nodeType!==3||(l=o+a),h!==r||s!==0&&h.nodeType!==3||(c=o+s),h.nodeType===3&&(o+=h.nodeValue.length),(m=h.firstChild)!==null;)p=h,h=m;for(;;){if(h===e)break e;if(p===i&&++u===a&&(l=o),p===r&&++d===s&&(c=o),(m=h.nextSibling)!==null)break;h=p,p=h.parentNode}h=m}i=l===-1||c===-1?null:{start:l,end:c}}else i=null}i=i||{start:0,end:0}}else i=null;for(Kg={focusedElem:e,selectionRange:i},ko=!1,n=(n&335544064)===n,fn=t,t=n?9270:1024;fn!==null;){if(e=fn,n&&(i=e.deletions,i!==null))for(a=0;a<i.length;a++)n&&Pg(i[a]);if(e.alternate===null&&(e.flags&2)!==0)n&&Bx(e),gh(n);else{if(e.tag===22){if(i=e.alternate,e.memoizedState!==null){i!==null&&i.memoizedState===null&&n&&Pg(i),gh(n);continue}else if(i!==null&&i.memoizedState!==null){n&&Bx(e),gh(n);continue}}i=e.child,(e.subtreeFlags&t)!==0&&i!==null?(i.return=e,fn=i):(n&&fM(e),gh(n))}}ci=null}function gh(e){for(;fn!==null;){var t=fn,n=e,i=t.alternate,s=t.flags;switch(t.tag){case 0:case 11:case 15:break;case 1:if((s&1024)!==0&&i!==null){n=void 0,s=i.memoizedProps,i=i.memoizedState;var a=t.stateNode;try{var r=wr(t.type,s);n=a.getSnapshotBeforeUpdate(r,i),a.__reactInternalSnapshotBeforeUpdate=n}catch(o){be(t,t.return,o)}}break;case 3:if((s&1024)!==0){if(i=t.stateNode.containerInfo,n=i.nodeType,n===9)Qg(i);else if(n===1)switch(i.nodeName){case"HEAD":case"HTML":case"BODY":Qg(i);break;default:i.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:n&&i!==null&&(n=Gs(i.memoizedProps,i.stateNode),s=t.memoizedProps,s=qs(s.default,s.update),s!=="none"&&jo(i,n,s,i.memoizedState=[],!0));break;default:if((s&1024)!==0)throw Error(st(163))}if(i=t.sibling,i!==null){i.return=t.return,fn=i;break}fn=t.return}}function gM(e,t,n){var i=n.flags;switch(n.tag){case 0:case 11:case 15:rs(e,n),i&4&&Hc(5,n);break;case 1:if(rs(e,n),i&4)if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(r){be(n,n.return,r)}else{var s=wr(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(s,t,e.__reactInternalSnapshotBeforeUpdate)}catch(r){be(n,n.return,r)}}i&64&&lM(n),i&512&&os(n,n.return);break;case 3:if(rs(e,n),i&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{yS(e,t)}catch(r){be(n,n.return,r)}}break;case 27:t===null&&i&4&&hM(n);case 26:case 5:rs(e,n),t===null&&i&4&&Dg(n),i&512&&os(n,n.return);break;case 12:rs(e,n);break;case 31:rs(e,n),i&4&&xM(e,n);break;case 13:rs(e,n),i&4&&bM(e,n),i&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=TC.bind(null,n),sR(e,n))));break;case 22:if(i=n.memoizedState!==null||dn,!i){var a=t!==null&&t.memoizedState!==null||ve;t=dn,s=ve,dn=i,(ve=a)&&!s?(i=2,(n.subtreeFlags&8772)!==0&&(i|=1),zi(e,n,i)):rs(e,n),dn=t,ve=s}break;case 30:rs(e,n),i&512&&os(n,n.return);break;case 7:i&512&&os(n,n.return);default:rs(e,n)}}function zg(e,t){for(e=e.child;e!==null;)vM(e,t),e=e.sibling}function vM(e,t){switch(e.tag){case 5:case 26:try{var n=e.stateNode;if(t){var i=n.style;typeof i.setProperty=="function"?i.setProperty("display","none","important"):i.display="none"}else{var s=e.stateNode,a=e.memoizedProps.style,r=a!=null&&a.hasOwnProperty("display")?a.display:null;s.style.display=r==null||typeof r=="boolean"?"":(""+r).trim()}}catch(l){be(e,e.return,l)}Fg(e,t);break;case 6:try{e.stateNode.nodeValue=t?"":e.memoizedProps,he=!0}catch(l){be(e,e.return,l)}break;case 18:try{var o=e.stateNode;t?eb(o,!0):eb(e.stateNode,!1)}catch(l){be(e,e.return,l)}break;case 22:case 23:e.memoizedState===null&&zg(e,t);break;default:zg(e,t)}}function Fg(e,t){if(e.subtreeFlags&67108864)for(e=e.child;e!==null;){t:{var n=e,i=t;switch(n.tag){case 4:vM(n,i);break t;case 22:n.memoizedState===null&&Fg(n,i);break t;default:Fg(n,i)}}e=e.sibling}}function yM(e){var t=e.alternate;t!==null&&(e.alternate=null,yM(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&yd(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var Ve=null,Jn=!1;function Bi(e,t,n){for(n=n.child;n!==null;)_M(e,t,n),n=n.sibling}function _M(e,t,n){if(di&&typeof di.onCommitFiberUnmount=="function")try{di.onCommitFiberUnmount(Ic,n)}catch{}switch(n.tag){case 26:ve||_n(n,t),Bi(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&!ve&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:ve||_n(n,t),fc(n);var i=Ve,s=Jn;Fa(n.type)&&(Ve=n.stateNode,Jn=!1),Bi(e,t,n),r1(n.stateNode,n.type,n.memoizedProps),Ve=i,Jn=s;break;case 5:ve||_n(n,t),fc(n);case 6:if(n.tag===6&&fc(n),i=Ve,s=Jn,Ve=null,Bi(e,t,n),Ve=i,Jn=s,Ve!==null)if(Jn)try{(Ve.nodeType===9?Ve.body:Ve.nodeName==="HTML"?Ve.ownerDocument.body:Ve).removeChild(n.stateNode),he=!0}catch(a){be(n,t,a)}else try{Ve.removeChild(n.stateNode),he=!0}catch(a){be(n,t,a)}break;case 18:Ve!==null&&(Jn?(e=Ve,tb(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,n.stateNode),Xo(e)):tb(Ve,n.stateNode));break;case 4:i=Ve,s=Jn,Ve=n.stateNode.containerInfo,Jn=!0,Bi(e,t,n),Ve=i,Jn=s;break;case 0:case 11:case 14:case 15:Oa(2,n,t),ve||Oa(4,n,t),Bi(e,t,n);break;case 1:ve||(_n(n,t),i=n.stateNode,typeof i.componentWillUnmount=="function"&&cM(n,t,i)),Bi(e,t,n);break;case 21:Bi(e,t,n);break;case 22:ve=(i=ve)||n.memoizedState!==null,Bi(e,t,n),ve=i;break;case 30:_n(n,t),Bi(e,t,n);break;case 7:ve||_n(n,t),Bi(e,t,n);break;default:Bi(e,t,n)}}function xM(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{Xo(e)}catch(n){be(t,t.return,n)}}}function bM(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Xo(e)}catch(n){be(t,t.return,n)}}function pC(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new Fx),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new Fx),t;default:throw Error(st(435,e.tag))}}function vh(e,t){var n=pC(e);t.forEach(function(i){if(!n.has(i)){n.add(i);var s=wC.bind(null,e,i);i.then(s,s)}})}function Fn(e,t,n){var i=t.deletions;if(i!==null)for(var s=0;s<i.length;s++){var a=i[s],r=e,o=t,l=o;t:for(;l!==null;){switch(l.tag){case 27:if(Fa(l.type)){Ve=l.stateNode,Jn=!1;break t}break;case 5:Ve=l.stateNode,Jn=!1;break t;case 3:case 4:Ve=l.stateNode.containerInfo,Jn=!0;break t}l=l.return}if(Ve===null)throw Error(st(160));_M(r,o,a),Ve=null,Jn=!1,r=a.alternate,r!==null&&(r.return=null),a.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)SM(t,e,n),t=t.sibling}var Fi=null;function SM(e,t,n){var i=e.alternate,s=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(s&4&&(i=e.updateQueue,i=i!==null?i.events:null,i!==null))for(var a=0;a<i.length;a++){var r=i[a];r.ref.impl=r.nextImpl}Fn(t,e,n),Gn(e),s&4&&(Oa(3,e,e.return),Hc(3,e),Oa(5,e,e.return));break;case 1:Fn(t,e,n),Gn(e),s&512&&(ve||i===null||_n(i,i.return)),s&64&&dn&&(e=e.updateQueue,e!==null&&(t=e.callbacks,t!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?t:n.concat(t))));break;case 26:if(a=Fi,Fn(t,e,n),Gn(e),s&512&&(ve||i===null||_n(i,i.return)),s&4)if(s=i!==null?i.memoizedState:null,n=e.memoizedState,i===null)if(n===null)if(e.stateNode===null)if(dn)e.stateNode=ZM(e.type,e.memoizedProps,t.containerInfo,e);else{t:{t=e.type,n=e.memoizedProps,s=a.ownerDocument||a;e:switch(t){case"title":i=s.getElementsByTagName("title")[0],(!i||i[Bc]||i[xn]||i.namespaceURI==="http://www.w3.org/2000/svg"||i.hasAttribute("itemprop"))&&(i=s.createElement(t),s.head.insertBefore(i,s.querySelector("head > title"))),En(i,t,n),i[xn]=e,pn(i),t=i;break t;case"link":if(a=cb("link","href",s).get(t+(n.href||""))){for(r=0;r<a.length;r++)if(i=a[r],i.getAttribute("href")===(n.href==null||n.href===""?null:n.href)&&i.getAttribute("rel")===(n.rel==null?null:n.rel)&&i.getAttribute("title")===(n.title==null?null:n.title)&&i.getAttribute("crossorigin")===(n.crossOrigin==null?null:n.crossOrigin)){a.splice(r,1);break e}}i=s.createElement(t),En(i,t,n),s.head.appendChild(i);break;case"meta":if(a=cb("meta","content",s).get(t+(n.content||""))){for(r=0;r<a.length;r++)if(i=a[r],i.getAttribute("content")===(n.content==null?null:""+n.content)&&i.getAttribute("name")===(n.name==null?null:n.name)&&i.getAttribute("property")===(n.property==null?null:n.property)&&i.getAttribute("http-equiv")===(n.httpEquiv==null?null:n.httpEquiv)&&i.getAttribute("charset")===(n.charSet==null?null:n.charSet)){a.splice(r,1);break e}}i=s.createElement(t),En(i,t,n),s.head.appendChild(i);break;default:throw Error(st(468,t))}i[xn]=e,pn(i),t=i}e.stateNode=t}else dn||n0(a,e.type,e.stateNode);else e.stateNode=lb(a,n,e.memoizedProps);else s!==n?(s===null?(t=i.stateNode,t===null||ve||t.parentNode.removeChild(t)):s.count--,n===null?dn||n0(a,e.type,e.stateNode):lb(a,n,e.memoizedProps)):n===null&&e.stateNode!==null&&Bm(e,e.memoizedProps,i.memoizedProps);break;case 27:Fn(t,e,n),Gn(e),s&512&&(ve||i===null||_n(i,i.return)),i!==null&&s&4&&Bm(e,e.memoizedProps,i.memoizedProps);break;case 5:if(a=ss,ss=!1,Fn(t,e,n),ss=a,Gn(e),s&512&&(ve||i===null||_n(i,i.return)),e.flags&32){t=e.stateNode;try{Io(t,""),he=!0}catch(u){be(e,e.return,u)}}s&4&&e.stateNode!=null&&(t=e.memoizedProps,Bm(e,t,i!==null?i.memoizedProps:t)),s&1024&&(Fm=!0);break;case 6:if(Fn(t,e,n),Gn(e),s&4){if(e.stateNode===null)throw Error(st(162));t=e.memoizedProps,n=e.stateNode;try{n.nodeValue=t,he=!0}catch(u){be(e,e.return,u)}}break;case 3:if(he=!1,zh=null,a=Fi,Fi=Rc(t.containerInfo),Fn(t,e,n),Fi=a,Gn(e),s&4&&i!==null&&i.memoizedState.isDehydrated)try{Xo(t.containerInfo)}catch(u){be(e,e.return,u)}Fm&&(Fm=!1,MM(e)),he=!1;break;case 4:s=ss,ss=dn,i=W_(),a=Fi,Fi=Rc(e.stateNode.containerInfo),Fn(t,e,n),Gn(e),Fi=a,he&&ic&&(ld=!0),he=i,ss=s;break;case 12:Fn(t,e,n),Gn(e);break;case 31:Fn(t,e,n),Gn(e),s&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,vh(e,t)));break;case 13:Fn(t,e,n),Gn(e),e.child.flags&8192&&e.memoizedState!==null!=(i!==null&&i.memoizedState!==null)&&(Dd=hi()),s&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,vh(e,t)));break;case 22:a=e.memoizedState!==null,r=i!==null&&i.memoizedState!==null;var o=dn,l=ve,c=ss;dn=o||a,ss=c||a,ve=l||r,Fn(t,e,n),ve=l,ss=c,dn=o,Gn(e),s&8192&&(t=e.stateNode,t._visibility=a?t._visibility&-2:t._visibility|1,!a||i===null||r||dn||ve||(t=r||ve,n=dn,i=ve,dn=a||dn,ve=t,fa(e,2),dn=n,ve=i),!a&&ss||zg(e,a)),s&4&&(t=e.updateQueue,t!==null&&(n=t.retryQueue,n!==null&&(t.retryQueue=null,vh(e,n))));break;case 19:Fn(t,e,n),Gn(e),s&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,vh(e,t)));break;case 30:s&512&&(ve||i===null||_n(i,i.return)),s=W_(),a=ic,r=(n&335544064)===n,o=e.memoizedProps,ic=r&&qs(o.default,o.update)!=="none",Fn(t,e,n),Gn(e),r&&i!==null&&he&&(e.flags|=4),ic=a,he=s;break;case 21:break;case 7:s&512&&(ve||i===null||_n(i,i.return)),i&&i.stateNode!==null&&(i.stateNode._fragmentFiber=e);default:Fn(t,e,n),Gn(e)}}function Gn(e){var t=e.flags;if(t&2){try{for(var n,i=e.return;i!==null;){if(uM(i)){n=i;break}i=i.return}i=null;for(var s=e.return;s!==null;){if(V0(s)){var a=s.stateNode;i===null?i=[a]:i.push(a)}if(H0(s))break;s=s.return}var r=i;if(n==null)throw Error(st(160));switch(n.tag){case 27:var o=n.stateNode,l=zm(e);rd(e,l,o,r);break;case 5:var c=n.stateNode;n.flags&32&&(Io(c,""),n.flags&=-33);var u=zm(e);rd(e,u,c,r);break;case 3:case 4:var d=n.stateNode.containerInfo,h=zm(e);Lg(e,h,d,r);break;default:throw Error(st(161))}}catch(p){be(e,e.return,p)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function MM(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;MM(t),t.tag===5&&t.flags&1024&&(t=t.stateNode,ko=!0,t.reset(),ko=!1),e=e.sibling}}function ao(e,t){if(t.subtreeFlags&9270)for(t=t.child;t!==null;)EM(t,e),t=t.sibling;else mM(t,!1)}function EM(e,t){var n=e.alternate;if(n===null)Ug(e,!1);else switch(e.tag){case 3:if(Bg=as=!1,zx(),ao(t,e),!as&&!ld){if(e=ls,e!==null)for(var i=0;i<e.length;i+=3){n=e[i];var s=e[i+1];JM(n,e[i+2]),n=n.ownerDocument.documentElement,n!==null&&n.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+s+")"})}e=t.containerInfo,e=e.nodeType===9?e.documentElement:e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===""&&(e.style.viewTransitionName="none",e.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),e.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),Bg=!0}ls=null;break;case 5:ao(t,e);break;case 4:i=as,as=!1,ao(t,e),as&&(ld=!0),as=i;break;case 22:e.memoizedState===null&&(n.memoizedState!==null?Ug(e,!1):ao(t,e));break;case 30:i=as,s=zx(),as=!1,ao(t,e),as&&(e.flags|=4);var a=e.memoizedProps,r=e.stateNode;t=Gs(a,r),r=Gs(n.memoizedProps,r);var o=qs(a.default,a.update);o==="none"?t=!1:(a=n.memoizedState,n.memoizedState=null,n=e.child,Qn=0,t=k0(e,n,t,r,o,a,!0),Qn!==(a===null?0:a.length)&&(e.flags|=32)),(e.flags&4)!==0&&t?(Bo(e,e.memoizedProps.onUpdate),ls=s):s!==null&&(s.push.apply(s,ls),ls=s),as=(e.flags&32)!==0?!0:i;break;default:ao(t,e)}}function rs(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)gM(e,t.alternate,t),t=t.sibling}function fa(e,t){for(e=e.child;e!==null;){var n=e,i=t;switch(n.tag){case 0:case 11:case 14:case 15:Oa(4,n,n.return),fa(n,i);break;case 1:_n(n,n.return);var s=n.stateNode;typeof s.componentWillUnmount=="function"&&cM(n,n.return,s),fa(n,i);break;case 27:(i&2)!==0&&r1(n.stateNode,n.type,n.memoizedProps);case 5:_n(n,n.return),n.tag!==5&&n.tag!==27||fc(n),fa(n,i);break;case 6:fc(n);break;case 26:_n(n,n.return),s=n.stateNode,n.memoizedState!==null||s===null||ve||s.parentNode.removeChild(s),fa(n,i);break;case 22:n.memoizedState===null&&fa(n,i);break;case 30:_n(n,n.return),fa(n,i);break;case 7:_n(n,n.return);default:fa(n,i)}e=e.sibling}}function zi(e,t,n){for(n=(t.subtreeFlags&8772)!==0?n:n&-2,t=t.child;t!==null;){var i=t.alternate,s=e,a=t,r=a.flags,o=(n&1)!==0;switch(a.tag){case 0:case 11:case 15:zi(s,a,n),Hc(4,a);break;case 1:if(zi(s,a,n),i=a,s=i.stateNode,typeof s.componentDidMount=="function")try{s.componentDidMount()}catch(u){be(i,i.return,u)}if(i=a,s=i.updateQueue,s!==null){var l=i.stateNode;try{var c=s.shared.hiddenCallbacks;if(c!==null)for(s.shared.hiddenCallbacks=null,s=0;s<c.length;s++)vS(c[s],l)}catch(u){be(i,i.return,u)}}o&&r&64&&lM(a),os(a,a.return);break;case 27:(n&2)!==0&&hM(a);case 5:a.tag!==5&&a.tag!==27||Ox(a),zi(s,a,n),o&&i===null&&r&4&&Dg(a),os(a,a.return);break;case 6:Ox(a);break;case 26:l=a.stateNode,a.memoizedState!==null||l===null||dn||n0(Rc(l.ownerDocument),a.type,l),zi(s,a,n),o&&i===null&&r&4&&Dg(a),os(a,a.return);break;case 12:zi(s,a,n);break;case 31:zi(s,a,n),o&&r&4&&xM(s,a);break;case 13:zi(s,a,n),o&&r&4&&bM(s,a);break;case 22:a.memoizedState===null&&zi(s,a,n),os(a,a.return);break;case 30:zi(s,a,n),os(a,a.return);break;case 7:os(a,a.return);default:zi(s,a,n)}t=t.sibling}}function X0(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&Fc(n))}function W0(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Fc(e))}function Ti(e,t,n,i){var s=(n&335544064)===n;if(t.subtreeFlags&(s?10262:10256))for(t=t.child;t!==null;)TM(e,t,n,i),t=t.sibling;else s&&pM(t)}function TM(e,t,n,i){var s=(n&335544064)===n;s&&t.alternate===null&&t.return!==null&&t.return.alternate!==null&&Ih(t);var a=t.flags;switch(t.tag){case 0:case 11:case 15:Ti(e,t,n,i),a&2048&&Hc(9,t);break;case 1:Ti(e,t,n,i);break;case 3:Ti(e,t,n,i),s&&Bg&&(e=e.containerInfo,e=e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,e.style.viewTransitionName==="root"&&(e.style.viewTransitionName=""),e=e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName==="none"&&(e.style.viewTransitionName="")),a&2048&&(a=null,t.alternate!==null&&(a=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==a&&(t.refCount++,a!=null&&Fc(a)));break;case 12:if(a&2048){Ti(e,t,n,i),a=t.stateNode;try{var r=t.memoizedProps,o=r.id,l=r.onPostCommit;typeof l=="function"&&l(o,t.alternate===null?"mount":"update",a.passiveEffectDuration,-0)}catch(c){be(t,t.return,c)}}else Ti(e,t,n,i);break;case 31:Ti(e,t,n,i);break;case 13:Ti(e,t,n,i);break;case 23:break;case 22:r=t.stateNode,o=t.alternate,t.memoizedState!==null?(s&&o!==null&&o.memoizedState===null&&Ih(o),r._visibility&2?Ti(e,t,n,i):pc(e,t)):(s&&o!==null&&o.memoizedState!==null&&Ih(t),r._visibility&2?Ti(e,t,n,i):(r._visibility|=2,oo(e,t,n,i,(t.subtreeFlags&10256)!==0||!1))),a&2048&&X0(o,t);break;case 24:Ti(e,t,n,i),a&2048&&W0(t.alternate,t);break;case 30:s&&(a=t.alternate,a!==null&&(ms(a.child,!0),ms(t.child,!0))),Ti(e,t,n,i);break;default:Ti(e,t,n,i)}}function oo(e,t,n,i,s){for(s=s&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var a=e,r=t,o=n,l=i,c=r.flags;switch(r.tag){case 0:case 11:case 15:oo(a,r,o,l,s),Hc(8,r);break;case 23:break;case 22:var u=r.stateNode;r.memoizedState!==null?u._visibility&2?oo(a,r,o,l,s):pc(a,r):(u._visibility|=2,oo(a,r,o,l,s)),s&&c&2048&&X0(r.alternate,r);break;case 24:oo(a,r,o,l,s),s&&c&2048&&W0(r.alternate,r);break;default:oo(a,r,o,l,s)}t=t.sibling}}function pc(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,i=t,s=i.flags;switch(i.tag){case 22:pc(n,i),s&2048&&X0(i.alternate,i);break;case 24:pc(n,i),s&2048&&W0(i.alternate,i);break;default:pc(n,i)}t=t.sibling}}var dr=8192;function cr(e,t,n){if(e.subtreeFlags&dr)for(e=e.child;e!==null;)wM(e,t,n),e=e.sibling}function wM(e,t,n){switch(e.tag){case 26:cr(e,t,n),e.flags&dr&&(e.memoizedState!==null?yR(n,Fi,e.memoizedState,e.memoizedProps):(e=e.stateNode,(t&335544128)===t&&hb(n,e)));break;case 5:cr(e,t,n),e.flags&dr&&(e=e.stateNode,(t&335544128)===t&&hb(n,e));break;case 3:case 4:var i=Fi;Fi=Rc(e.stateNode.containerInfo),cr(e,t,n),Fi=i;break;case 22:e.memoizedState===null&&(i=e.alternate,i!==null&&i.memoizedState!==null?(i=dr,dr=16777216,cr(e,t,n),dr=i):cr(e,t,n));break;case 30:if((e.flags&dr)!==0&&(i=e.memoizedProps.name,i!=null&&i!=="auto")){var s=e.stateNode;s.paired=null,ci===null&&(ci=new Map),ci.set(i,s)}cr(e,t,n);break;default:cr(e,t,n)}}function AM(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Kl(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var i=t[n];fn=i,RM(i,e)}AM(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)CM(e),e=e.sibling}function CM(e){switch(e.tag){case 0:case 11:case 15:Kl(e),e.flags&2048&&Oa(9,e,e.return);break;case 3:Kl(e);break;case 12:Kl(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,Ph(e)):Kl(e);break;default:Kl(e)}}function Ph(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var i=t[n];fn=i,RM(i,e)}AM(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Oa(8,t,t.return),Ph(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,Ph(t));break;default:Ph(t)}e=e.sibling}}function RM(e,t){for(;fn!==null;){var n=fn;switch(n.tag){case 0:case 11:case 15:Oa(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var i=n.memoizedState.cachePool.pool;i!=null&&i.refCount++}break;case 24:Fc(n.memoizedState.cache)}if(i=n.child,i!==null)i.return=n,fn=i;else t:for(n=e;fn!==null;){i=fn;var s=i.sibling,a=i.return;if(yM(i),i===n){fn=null;break t}if(s!==null){s.return=a,fn=s;break t}fn=a}}}var mC={getCacheForType:function(e){var t=bn(tn),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return bn(tn).controller.signal}},gC=typeof WeakMap=="function"?WeakMap:Map,de=0,Ae=null,ee=null,ie=0,_e=0,ri=null,xa=!1,Zo=!1,q0=!1,Xs=0,je=0,Ba=0,_r=0,cd=0,ui=0,Oo=0,mc=null,$n=null,Gg=!1,Dd=0,NM=0,ud=1/0,hd=null,Ra=null,We=0,Hi=null,Ar=null,ps=0,Hg=0,Vg=null,DM=null,Ro=null,No=null,Do=null,gc=0,Oh=null;function pi(){return(de&2)!==0&&ie!==0?ie&-ie:Ft.T!==null?j0():Pb()}function LM(){if(ui===0)if((ie&536870912)===0||$t){var e=sh;sh<<=1,(sh&3932160)===0&&(sh=262144),ui=e}else ui=536870912;return e=Tn.current,e!==null&&(e.flags|=32),ui}function Bo(e,t){if(t!=null){var n=e.stateNode,i=n.ref;i===null&&(i=n.ref=QM(Gs(e.memoizedProps,n))),No===null&&(No=[]),No.push(t.bind(null,i))}}function ei(e,t,n){(e===Ae&&(_e===2||_e===9)||e.cancelPendingCommit!==null)&&(zo(e,0),ba(e,ie,ui,!1)),Oc(e,n),((de&2)===0||e!==Ae)&&(e===Ae&&((de&2)===0&&(_r|=n),je===4&&ba(e,ie,ui,!1)),vs(e))}function UM(e,t,n){if((de&6)!==0)throw Error(st(327));var i=!n&&(t&127)===0&&(t&e.expiredLanes)===0||Pc(e,t),s=i?_C(e,t):Gm(e,t,!0),a=i;do{if(s===0){Zo&&!i&&ba(e,t,0,!1);break}else{if(n=e.current.alternate,a&&!vC(n)){s=Gm(e,t,!1),a=!1;continue}if(s===2){if(a=t,e.errorRecoveryDisabledLanes&a)var r=0;else r=e.pendingLanes&-536870913,r=r!==0?r:r&536870912?536870912:0;if(r!==0){t=r;t:{var o=e;s=mc;var l=o.current.memoizedState.isDehydrated;if(l&&(zo(o,r).flags|=256),r=Gm(o,r,!1),r!==2&&r!==6){if(q0&&!l){o.errorRecoveryDisabledLanes|=a,_r|=a,s=4;break t}a=$n,$n=s,a!==null&&($n===null?$n=a:$n.push.apply($n,a))}s=r}if(a=!1,s!==2)continue}}if(s===1){zo(e,0),ba(e,t,0,!0);break}t:{switch(i=e,a=s,a){case 0:case 1:throw Error(st(345));case 4:if((t&4194048)!==t&&(t&62914560)!==t)break;case 6:ba(i,t,ui,!xa);break t;case 2:$n=null;break;case 3:case 5:break;default:throw Error(st(329))}if((t&62914560)===t&&(s=Dd+300-hi(),10<s)){if(ba(i,t,ui,!xa),vd(i,0,!0)!==0)break t;ps=t,i.timeoutHandle=K0(Gx.bind(null,i,n,$n,hd,Gg,t,ui,_r,Oo,xa,a,"Throttled",-0,0),s);break t}Gx(i,n,$n,hd,Gg,t,ui,_r,Oo,xa,a,null,-0,0)}}break}while(!0);vs(e)}function Gx(e,t,n,i,s,a,r,o,l,c,u,d,h,p){e.timeoutHandle=-1;var m=t.subtreeFlags,b=(a&335544064)===a;if(d=null,(b||m&8192||(m&16785408)===16785408)&&(d={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:us},ci=null,wM(t,a,d),b&&(m=d,b=e.containerInfo,b=(b.nodeType===9?b:b.ownerDocument).__reactViewTransition,b!=null&&(m.count++,m.waitingForViewTransition=!0,m=Nc.bind(m),b.finished.then(m,m))),m=(a&62914560)===a?Dd-hi():(a&4194048)===a?NM-hi():0,m=_R(d,m),m!==null)){ps=a,e.cancelPendingCommit=m(Vx.bind(null,e,t,a,n,i,s,r,o,l,c,u,d,null,h,p)),ba(e,a,r,!c);return}Vx(e,t,a,n,i,s,r,o,l,c,u,d)}function vC(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var i=0;i<n.length;i++){var s=n[i],a=s.getSnapshot;s=s.value;try{if(!mi(a(),s))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function ba(e,t,n,i){t=Nb(e,t),t&=~cd,t&=~_r,e.suspendedLanes|=t,e.pingedLanes&=~t,i&&(e.warmLanes|=t),i=e.expirationTimes;for(var s=t;0<s;){var a=31-fi(s),r=1<<a;i[a]=-1,s&=~r}n!==0&&Lb(e,n,t)}function Ld(){return(de&6)===0?(Vc(0,!1),!1):!0}function Y0(){if(ee!==null){if(_e===0)var e=ee.return;else e=ee,Os=Lr=null,N0(e),wo=null,Mc=0,e=ee;for(;e!==null;)oM(e.alternate,e),e=e.return;ee=null}}function zo(e,t){var n=e.timeoutHandle;return n!==-1&&(e.timeoutHandle=-1,FC(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),ps=0,Y0(),Ae=e,ee=n=Bs(e.current,null),ie=t,_e=0,ri=null,xa=!1,Zo=Pc(e,t),q0=!1,Oo=ui=cd=_r=Ba=je=0,$n=mc=null,Gg=!1,Xs=Nb(e,t),Sd(),n}function IM(e,t){Wt=null,Ft.H=id,t===Yo||t===Td?(t=fx(),_e=3):t===S0?(t=fx(),_e=4):_e=t===z0?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,ri=t,ee===null&&(je=1,sd(e,Ni(t,e.current)))}function PM(){var e=Tn.current;return e===null?!0:(ie&4194048)===ie?Ln===null:(ie&62914560)===ie||(ie&536870912)!==0?e===Ln:!1}function OM(){var e=Ft.H;return Ft.H=id,e===null?id:e}function BM(){var e=Ft.A;return Ft.A=mC,e}function dd(){je=4,xa||(ie&4194048)!==ie&&Tn.current!==null||(Zo=!0),(Ba&134217727)===0&&(_r&134217727)===0||Ae===null||ba(Ae,ie,ui,!1)}function Gm(e,t,n){var i=de;de|=2;var s=OM(),a=BM();(Ae!==e||ie!==t)&&(hd=null,zo(e,t)),t=!1;var r=je;t:do try{if(_e!==0&&ee!==null){var o=ee,l=ri;switch(_e){case 8:Y0(),r=6;break t;case 3:case 2:case 9:case 6:Tn.current===null&&(t=!0);var c=_e;if(_e=0,ri=null,bo(e,o,l,c),n&&Zo){r=0;break t}break;default:c=_e,_e=0,ri=null,bo(e,o,l,c)}}yC(),r=je;break}catch(u){IM(e,u)}while(!0);return t&&e.shellSuspendCounter++,Os=Lr=null,de=i,Ft.H=s,Ft.A=a,ee===null&&(Ae=null,ie=0,Sd()),r}function yC(){for(;ee!==null;)zM(ee)}function _C(e,t){var n=de;de|=2;var i=OM(),s=BM();Ae!==e||ie!==t?(hd=null,ud=hi()+500,zo(e,t)):Zo=Pc(e,t);t:do try{if(_e!==0&&ee!==null){t=ee;var a=ri;e:switch(_e){case 1:_e=0,ri=null,bo(e,t,a,1);break;case 2:case 9:if(dx(a)){_e=0,ri=null,Hx(t);break}t=function(){_e!==2&&_e!==9||Ae!==e||(_e=7),vs(e)},a.then(t,t);break t;case 3:_e=7;break t;case 4:_e=5;break t;case 7:dx(a)?(_e=0,ri=null,Hx(t)):(_e=0,ri=null,bo(e,t,a,7));break;case 5:var r=null;switch(ee.tag){case 26:r=ee.memoizedState;case 5:case 27:var o=ee;if(r?c1(r):o.stateNode.complete){_e=0,ri=null;var l=o.sibling;if(l!==null)ee=l;else{var c=o.return;c!==null?(ee=c,Ud(c)):ee=null}break e}}_e=0,ri=null,bo(e,t,a,5);break;case 6:_e=0,ri=null,bo(e,t,a,6);break;case 8:Y0(),je=6;break t;default:throw Error(st(462))}}xC();break}catch(u){IM(e,u)}while(!0);return Os=Lr=null,Ft.H=i,Ft.A=s,de=n,ee!==null?0:(Ae=null,ie=0,Sd(),je)}function xC(){for(;ee!==null&&!Bw();)zM(ee)}function zM(e){var t=rM(e.alternate,e,Xs);e.memoizedProps=e.pendingProps,t===null?Ud(e):ee=t}function Hx(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=Rx(n,t,t.pendingProps,t.type,void 0,ie);break;case 11:t=Rx(n,t,t.pendingProps,t.type.render,t.ref,ie);break;case 5:N0(t);var i=t;i===mn&&($t?(Kh(i),i.tag===5&&i.stateNode!=null&&(Ie=i.stateNode)):(Kh(i),$t=!0));default:oM(n,t),t=ee=lS(t,Xs),t=rM(n,t,Xs)}e.memoizedProps=e.pendingProps,t===null?Ud(e):ee=t}function bo(e,t,n,i){Os=Lr=null,N0(t),wo=null,Mc=0;var s=t.return;try{if(oC(e,s,t,n,ie)){je=1,sd(e,Ni(n,e.current)),ee=null;return}}catch(a){if(s!==null)throw ee=s,a;je=1,sd(e,Ni(n,e.current)),ee=null;return}t.flags&32768?($t||i===1?e=!0:Zo||(ie&536870912)!==0?e=!1:(xa=e=!0,(i===2||i===9||i===3||i===6)&&(i=Tn.current,i!==null&&i.tag===13&&(i.flags|=16384))),FM(t,e)):Ud(t)}function Ud(e){var t=e;do{if((t.flags&32768)!==0){FM(t,xa);return}e=t.return;var n=hC(t.alternate,t,Xs);if(n!==null){ee=n;return}if(t=t.sibling,t!==null){ee=t;return}ee=t=e}while(t!==null);je===0&&(je=5)}function FM(e,t){do{var n=dC(e.alternate,e);if(n!==null){n.flags&=32767,ee=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){ee=e;return}ee=e=n}while(e!==null);je=6,ee=null}function Vx(e,t,n,i,s,a,r,o,l,c,u,d){e.cancelPendingCommit=null;do Id();while(We!==0);if((de&6)!==0)throw Error(st(327));if(t!==null){if(t===e.current)throw Error(st(177));e===Ae&&(ee=Ae=null,ie=0),Ar=t,Hi=e,ps=n,Vg=s,DM=i,bC(e,t,n,r,o,l,d)}}function bC(e,t,n,i,s,a,r){var o=t.lanes|t.childLanes;if(Hg=o,o|=g0,Yw(e,n,o,i,s,a),No=null,(n&335544064)===n?(Do=ZA(e),i=10262):(Do=null,i=10256),(t.subtreeFlags&i)!==0||(t.flags&i)!==0?(e.callbackNode=null,e.callbackPriority=0,AC(Wh,function(){return qg(),null})):(e.callbackNode=null,e.callbackPriority=0),od=!1,i=(t.flags&13878)!==0,(t.subtreeFlags&13878)!==0||i){i=Ft.T,Ft.T=null,s=fe.p,fe.p=2,a=de,de|=4;try{fC(e,t,n)}finally{de=a,fe.p=s,Ft.T=i}}We=1,od?Ro=WC(r,e.containerInfo,Do,kg,Xg,MC,Wg,qg,SC,null,null):(kg(),Xg(),Wg())}function SC(e){if(We!==0){var t=Hi.onRecoverableError;t(e,{componentStack:null})}}function MC(){We===3&&(We=0,EM(Ar,Hi),We=4)}function kg(){if(We===1){We=0;var e=Hi,t=Ar,n=ps,i=(t.flags&13878)!==0;if((t.subtreeFlags&13878)!==0||i){i=Ft.T,Ft.T=null;var s=fe.p;fe.p=2;var a=de;de|=4;try{ic=ld=!1,SM(t,e,n),n=Kg;var r=tS(e.containerInfo),o=n.focusedElem,l=n.selectionRange;if(r!==o&&o&&o.ownerDocument&&Qb(o.ownerDocument.documentElement,o)){if(l!==null&&m0(o)){var c=l.start,u=l.end;if(u===void 0&&(u=c),"selectionStart"in o)o.selectionStart=c,o.selectionEnd=Math.min(u,o.value.length);else{var d=o.ownerDocument||document,h=d&&d.defaultView||window;if(h.getSelection){var p=h.getSelection(),m=o.textContent.length,b=Math.min(l.start,m),g=l.end===void 0?b:Math.min(l.end,m);!p.extend&&b>g&&(r=g,g=b,b=r);var f=sx(o,b),v=sx(o,g);if(f&&v&&(p.rangeCount!==1||p.anchorNode!==f.node||p.anchorOffset!==f.offset||p.focusNode!==v.node||p.focusOffset!==v.offset)){var S=d.createRange();S.setStart(f.node,f.offset),p.removeAllRanges(),b>g?(p.addRange(S),p.extend(v.node,v.offset)):(S.setEnd(v.node,v.offset),p.addRange(S))}}}}for(d=[],p=o;p=p.parentNode;)p.nodeType===1&&d.push({element:p,left:p.scrollLeft,top:p.scrollTop});for(typeof o.focus=="function"&&o.focus(),o=0;o<d.length;o++){var x=d[o];x.element.scrollLeft=x.left,x.element.scrollTop=x.top}}ko=!!Zg,Kg=Zg=null}finally{de=a,fe.p=s,Ft.T=i}}e.current=t,We=2}}function Xg(){if(We===2){We=0;var e=Hi,t=Ar,n=(t.flags&8772)!==0;if((t.subtreeFlags&8772)!==0||n){n=Ft.T,Ft.T=null;var i=fe.p;fe.p=2;var s=de;de|=4;try{gM(e,t.alternate,t)}finally{de=s,fe.p=i,Ft.T=n}}We=3}}function Wg(){if(We===4||We===3){We=0;var e=Ro;Ro=null,zw();var t=Hi,n=Ar,i=ps,s=DM,a=(i&335544064)===i?10262:10256;if((n.subtreeFlags&a)!==0||(n.flags&a)!==0?We=5:(We=0,Ar=Hi=null,GM(t,t.pendingLanes)),a=t.pendingLanes,a===0&&(Ra=null),c0(i),n=n.stateNode,di&&typeof di.onCommitFiberRoot=="function")try{di.onCommitFiberRoot(Ic,n,void 0,(n.current.flags&128)===128)}catch{}if(s!==null){n=Ft.T,a=fe.p,fe.p=2,Ft.T=null;try{for(var r=t.onRecoverableError,o=0;o<s.length;o++){var l=s[o];r(l.value,{componentStack:l.stack})}}finally{Ft.T=n,fe.p=a}}if(s=No,r=Do,Do=null,s!==null&&(No=null,r===null&&(r=[]),e!==null))for(l=0;l<s.length;l++)n=(0,s[l])(r),n!==void 0&&e.finished.finally(n);(ps&3)!==0&&Id(),vs(t),a=t.pendingLanes,(i&261930)!==0&&(a&42)!==0?t===Oh?gc++:(gc=0,Oh=t):(gc=0,Oh=null),Vc(0,!1)}}function GM(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,Fc(t)))}function Id(){return Ro!==null&&(Ro.skipTransition(),Ro=null),kg(),Xg(),Wg(),qg()}function qg(){if(We!==5)return!1;var e=Hi,t=Hg;Hg=0;var n=c0(ps),i=Ft.T,s=fe.p;try{fe.p=32>n?32:n,Ft.T=null,n=Vg,Vg=null;var a=Hi,r=ps;if(We=0,Ar=Hi=null,ps=0,(de&6)!==0)throw Error(st(331));var o=de;if(de|=4,CM(a.current),TM(a,a.current,r,n),de=o,Vc(0,!1),di&&typeof di.onPostCommitFiberRoot=="function")try{di.onPostCommitFiberRoot(Ic,a)}catch{}return!0}finally{fe.p=s,Ft.T=i,GM(e,t)}}function kx(e,t,n){t=Ni(n,t),t=Tg(e.stateNode,t,2),e=wa(e,t,2),e!==null&&(Oc(e,2),vs(e))}function be(e,t,n){if(e.tag===3)kx(e,e,n);else for(;t!==null;){if(t.tag===3){kx(t,e,n);break}else if(t.tag===1){var i=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(Ra===null||!Ra.has(i))){e=Ni(n,e),n=eM(2),i=wa(t,n,2),i!==null&&(nM(n,i,t,e),Oc(i,2),vs(i));break}}t=t.return}}function Hm(e,t,n){var i=e.pingCache;if(i===null){i=e.pingCache=new gC;var s=new Set;i.set(t,s)}else s=i.get(t),s===void 0&&(s=new Set,i.set(t,s));s.has(n)||(q0=!0,s.add(n),e=EC.bind(null,e,t,n),t.then(e,e))}function EC(e,t,n){var i=e.pingCache;i!==null&&i.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,Ae===e&&(ie&n)===n&&((je===4||je===3&&(ie&62914560)===ie&&300>hi()-Dd)&&(de&2)===0?zo(e,0):cd|=n,Oo===ie&&(Oo=0)),vs(e)}function HM(e,t){t===0&&(t=Db()),e=Dr(e,t),e!==null&&(Oc(e,t),vs(e))}function TC(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),HM(e,n)}function wC(e,t){var n=0;switch(e.tag){case 31:case 13:var i=e.stateNode,s=e.memoizedState;s!==null&&(n=s.retryLane);break;case 19:i=e.stateNode;break;case 22:i=e.stateNode._retryCache;break;default:throw Error(st(314))}i!==null&&i.delete(t),HM(e,n)}function AC(e,t){return o0(e,t)}var Fo=null,lo=null,Yg=!1,fd=!1,Vm=!1,Sa=0;function vs(e){e!==lo&&e.next===null&&(lo===null?Fo=lo=e:lo=lo.next=e),fd=!0,Yg||(Yg=!0,RC())}function Vc(e,t){if(!Vm&&fd){Vm=!0;do for(var n=!1,i=Fo;i!==null;){if(!t)if(e!==0){var s=i.pendingLanes;if(s===0)var a=0;else{var r=i.suspendedLanes,o=i.pingedLanes;a=(1<<31-fi(42|e)+1)-1,a&=s&~(r&~o),a=a&201326741?a&201326741|1:a?a|2:0}a!==0&&(n=!0,Xx(i,a))}else a=ie,a=vd(i,i===Ae?a:0,i.cancelPendingCommit!==null||i.timeoutHandle!==-1),(a&3)===0||Pc(i,a)||(n=!0,Xx(i,a));i=i.next}while(n);Vm=!1}}function CC(){VM()}function VM(){fd=Yg=!1;var e=0;Sa!==0&&zC()&&(e=Sa);for(var t=hi(),n=null,i=Fo;i!==null;){var s=i.next,a=kM(i,t);a===0?(i.next=null,n===null?Fo=s:n.next=s,s===null&&(lo=n)):(n=i,(e!==0||(a&3)!==0)&&(fd=!0)),i=s}We!==0&&We!==5||Vc(e,!1),Sa!==0&&(Sa=0)}function kM(e,t){for(var n=e.suspendedLanes,i=e.pingedLanes,s=e.expirationTimes,a=e.pendingLanes&-62914561;0<a;){var r=31-fi(a),o=1<<r,l=s[r];l===-1?((o&n)===0||(o&i)!==0)&&(s[r]=qw(o,t)):l<=t&&(e.expiredLanes|=o),a&=~o}if(t=Ae,n=ie,n=vd(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i=e.callbackNode,n===0||e===t&&(_e===2||_e===9)||e.cancelPendingCommit!==null)return i!==null&&i!==null&&xm(i),e.callbackNode=null,e.callbackPriority=0;if((n&3)===0||Pc(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(i!==null&&xm(i),c0(n)){case 2:case 8:n=Cb;break;case 32:n=Wh;break;case 268435456:n=Rb;break;default:n=Wh}return i=XM.bind(null,e),n=o0(n,i),e.callbackPriority=t,e.callbackNode=n,t}return i!==null&&i!==null&&xm(i),e.callbackPriority=2,e.callbackNode=null,2}function XM(e,t){if(We!==0&&We!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(Id()&&e.callbackNode!==n)return null;var i=ie;return i=vd(e,e===Ae?i:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i===0?null:(UM(e,i,t),kM(e,hi()),e.callbackNode!=null&&e.callbackNode===n?XM.bind(null,e):null)}function Xx(e,t){if(Id())return null;UM(e,t,!0)}function RC(){GC(function(){(de&6)!==0?o0(Ab,CC):VM()})}function j0(){if(Sa===0){var e=Mr;e===0&&(e=ih,ih<<=1,(ih&261888)===0&&(ih=256)),Sa=e}return Sa}function Wx(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:Eh(e)}function NC(e,t,n,i,s){if(t==="submit"&&n&&n.stateNode===s){var a=Wx((s[ii]||null).action),r=i.submitter;r&&(t=(t=r[ii]||null)?Wx(t.formAction):r.getAttribute("formAction"),t!==null&&(a=t,r=null));var o=new _d("action","action",null,i,s);e.push({event:o,listeners:[{instance:null,listener:function(){if(i.defaultPrevented){if(Sa!==0){var l=new FormData(s,r);Mg(n,{pending:!0,data:l,method:s.method,action:a},null,l)}}else typeof a=="function"&&(o.preventDefault(),l=new FormData(s,r),Mg(n,{pending:!0,data:l,method:s.method,action:a},a,l))},currentTarget:s}]})}}for(yh=0;yh<dg.length;yh++)_h=dg[yh],qx=_h.toLowerCase(),Yx=_h[0].toUpperCase()+_h.slice(1),Vi(qx,"on"+Yx);var _h,qx,Yx,yh;Vi(nS,"onAnimationEnd");Vi(iS,"onAnimationIteration");Vi(sS,"onAnimationStart");Vi("dblclick","onDoubleClick");Vi("focusin","onFocus");Vi("focusout","onBlur");Vi(HA,"onTransitionRun");Vi(VA,"onTransitionStart");Vi(kA,"onTransitionCancel");Vi(aS,"onTransitionEnd");Uo("onMouseEnter",["mouseout","mouseover"]);Uo("onMouseLeave",["mouseout","mouseover"]);Uo("onPointerEnter",["pointerout","pointerover"]);Uo("onPointerLeave",["pointerout","pointerover"]);Rr("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Rr("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Rr("onBeforeInput",["compositionend","keypress","textInput","paste"]);Rr("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Rr("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Rr("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var wc="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),DC=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(wc));function WM(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var i=e[n],s=i.event;i=i.listeners;t:{var a=void 0;if(t)for(var r=i.length-1;0<=r;r--){var o=i[r],l=o.instance,c=o.currentTarget;if(o=o.listener,l!==a&&s.isPropagationStopped())break t;a=o,s.currentTarget=c;try{a(s)}catch(u){Yh(u)}s.currentTarget=null,a=l}else for(r=0;r<i.length;r++){if(o=i[r],l=o.instance,c=o.currentTarget,o=o.listener,l!==a&&s.isPropagationStopped())break t;a=o,s.currentTarget=c;try{a(s)}catch(u){Yh(u)}s.currentTarget=null,a=l}}}}function te(e,t){var n=t[H_];n===void 0&&(n=t[H_]=new Set);var i=e+"__bubble";n.has(i)||(qM(t,e,2,!1),n.add(i))}function km(e,t,n){var i=0;t&&(i|=4),qM(n,e,i,t)}var xh="_reactListening"+Math.random().toString(36).slice(2);function Z0(e){if(!e[xh]){e[xh]=!0,Bb.forEach(function(n){n!=="selectionchange"&&(DC.has(n)||km(n,!1,e),km(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[xh]||(t[xh]=!0,km("selectionchange",!1,t))}}function qM(e,t,n,i){switch(g1(t)){case 2:var s=MR;break;case 8:s=ER;break;default:s=nv}n=s.bind(null,t,n,e),s=void 0,!lg||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(s=!0),i?s!==void 0?e.addEventListener(t,n,{capture:!0,passive:s}):e.addEventListener(t,n,!0):s!==void 0?e.addEventListener(t,n,{passive:s}):e.addEventListener(t,n,!1)}function Xm(e,t,n,i,s){var a=i;if((t&1)===0&&(t&2)===0&&i!==null)t:for(;;){if(i===null)return;var r=i.tag;if(r===3||r===4){var o=i.stateNode.containerInfo;if(o===s)break;if(r===4)for(r=i.return;r!==null;){var l=r.tag;if((l===3||l===4)&&r.stateNode.containerInfo===s)return;r=r.return}for(;o!==null;){if(r=fr(o),r===null)return;if(l=r.tag,l===5||l===6||l===26||l===27){i=a=r;continue t}o=o.parentNode}}i=i.return}Wb(function(){var c=a,u=h0(n),d=[];t:{var h=rS.get(e);if(h!==void 0){var p=_d,m=e;switch(e){case"keypress":if(wh(n)===0)break t;case"keydown":case"keyup":p=vA;break;case"focusin":m="focus",p=wm;break;case"focusout":m="blur",p=wm;break;case"beforeblur":case"afterblur":p=wm;break;case"click":if(n.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":p=Z_;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":p=aA;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":p=SA;break;case nS:case iS:case sS:p=lA;break;case aS:p=EA;break;case"scroll":case"scrollend":p=iA;break;case"wheel":p=wA;break;case"copy":case"cut":case"paste":p=uA;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":p=J_;break;case"submit":p=xA;break;case"toggle":case"beforetoggle":p=CA}var b=(t&4)!==0,g=!b&&(e==="scroll"||e==="scrollend"),f=b?h!==null?h+"Capture":null:h;b=[];for(var v=c,S;v!==null;){var x=v;if(S=x.stateNode,x=x.tag,x!==5&&x!==26&&x!==27||S===null||f===null||(x=yc(v,f),x!=null&&b.push(Ac(v,x,S))),g)break;v=v.return}0<b.length&&(h=new p(h,m,null,n,u),d.push({event:h,listeners:b}))}}if((t&7)===0){t:{if(p=e==="mouseover"||e==="pointerover",h=e==="mouseout"||e==="pointerout",p&&n!==og&&(m=n.relatedTarget||n.fromElement)&&(fr(m)||m[Wo]))break t;(h||p)&&(m=u.window===u?u:(p=u.ownerDocument)?p.defaultView||p.parentWindow:window,h?(p=n.relatedTarget||n.toElement,h=c,p=p?fr(p):null,p!==null&&(g=Uc(p),b=p.tag,p!==g||b!==5&&b!==27&&b!==6)&&(p=null)):(h=null,p=c),h!==p&&(b=Z_,x="onMouseLeave",f="onMouseEnter",v="mouse",(e==="pointerout"||e==="pointerover")&&(b=J_,x="onPointerLeave",f="onPointerEnter",v="pointer"),g=h==null?m:ec(h),S=p==null?m:ec(p),m=new b(x,v+"leave",h,n,u),m.target=g,m.relatedTarget=S,x=null,fr(u)===c&&(b=new b(f,v+"enter",p,n,u),b.target=S,b.relatedTarget=g,x=b),g=x,b=h&&p?Zm(h,p,LC):null,h!==null&&jx(d,m,h,b,!1),p!==null&&g!==null&&jx(d,g,p,b,!0)))}t:{if(h=c?ec(c):window,p=h.nodeName&&h.nodeName.toLowerCase(),p==="select"||p==="input"&&h.type==="file")var T=ex;else if(tx(h))if(Jb)T=zA;else{T=OA;var E=PA}else p=h.nodeName,!p||p.toLowerCase()!=="input"||h.type!=="checkbox"&&h.type!=="radio"?c&&u0(c.elementType)&&(T=ex):T=BA;if(T&&(T=T(e,c))){Kb(d,T,n,u);break t}E&&E(e,h,c)}switch(E=c?ec(c):window,e){case"focusin":(tx(E)||E.contentEditable==="true")&&(mo=E,ug=c,rc=null);break;case"focusout":rc=ug=mo=null;break;case"mousedown":hg=!0;break;case"contextmenu":case"mouseup":case"dragend":hg=!1,ax(d,n,u);break;case"selectionchange":if(GA)break;case"keydown":case"keyup":ax(d,n,u)}var w;if(p0)t:{switch(e){case"compositionstart":var y="onCompositionStart";break t;case"compositionend":y="onCompositionEnd";break t;case"compositionupdate":y="onCompositionUpdate";break t}y=void 0}else po?jb(e,n)&&(y="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(y="onCompositionStart");y&&(Yb&&n.locale!=="ko"&&(po||y!=="onCompositionStart"?y==="onCompositionEnd"&&po&&(w=qb()):(ya=u,d0="value"in ya?ya.value:ya.textContent,po=!0)),E=pd(c,y),0<E.length&&(y=new K_(y,e,null,n,u),d.push({event:y,listeners:E}),w?y.data=w:(w=Zb(n),w!==null&&(y.data=w)))),(w=NA?DA(e,n):LA(e,n))&&(y=pd(c,"onBeforeInput"),0<y.length&&(E=new K_("onBeforeInput","beforeinput",null,n,u),d.push({event:E,listeners:y}),E.data=w)),NC(d,e,c,n,u)}WM(d,t)})}function Ac(e,t,n){return{instance:e,listener:t,currentTarget:n}}function pd(e,t){for(var n=t+"Capture",i=[];e!==null;){var s=e,a=s.stateNode;if(s=s.tag,s!==5&&s!==26&&s!==27||a===null||(s=yc(e,n),s!=null&&i.unshift(Ac(e,s,a)),s=yc(e,t),s!=null&&i.push(Ac(e,s,a))),e.tag===3)return i;e=e.return}return[]}function LC(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function jx(e,t,n,i,s){for(var a=t._reactName,r=[];n!==null&&n!==i;){var o=n,l=o.alternate,c=o.stateNode;if(o=o.tag,l!==null&&l===i)break;o!==5&&o!==26&&o!==27||c===null||(l=c,s?(c=yc(n,a),c!=null&&r.unshift(Ac(n,c,l))):s||(c=yc(n,a),c!=null&&r.push(Ac(n,c,l)))),n=n.return}r.length!==0&&e.push({event:t,listeners:r})}var UC=/\r\n?/g,IC=/\u0000|\uFFFD/g;function Zx(e){return(typeof e=="string"?e:""+e).replace(UC,`
`).replace(IC,"")}function YM(e,t){return t=Zx(t),Zx(e)===t}function xe(e,t,n,i,s,a){switch(n){case"children":if(typeof i=="string")t==="body"||t==="textarea"&&i===""||Io(e,i);else if(typeof i=="number"||typeof i=="bigint")t!=="body"&&Io(e,""+i);else return;break;case"className":rh(e,"class",i);break;case"tabIndex":rh(e,"tabindex",i);break;case"dir":case"role":case"viewBox":case"width":case"height":rh(e,n,i);break;case"style":Xb(e,i,a);return;case"data":if(t!=="object"){rh(e,"data",i);break}case"src":case"href":if(i===""&&(t!=="a"||n!=="href")){e.removeAttribute(n);break}if(i==null||typeof i=="function"||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(n);break}i=Eh(i),e.setAttribute(n,i);break;case"action":case"formAction":if(typeof i=="function"){e.setAttribute(n,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof a=="function"&&(n==="formAction"?(t!=="input"&&xe(e,t,"name",s.name,s,null),xe(e,t,"formEncType",s.formEncType,s,null),xe(e,t,"formMethod",s.formMethod,s,null),xe(e,t,"formTarget",s.formTarget,s,null)):(xe(e,t,"encType",s.encType,s,null),xe(e,t,"method",s.method,s,null),xe(e,t,"target",s.target,s,null)));if(i==null||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(n);break}i=Eh(i),e.setAttribute(n,i);break;case"onClick":i!=null&&(e.onclick=us);return;case"onScroll":i!=null&&te("scroll",e);return;case"onScrollEnd":i!=null&&te("scrollend",e);return;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(st(61));if(n=i.__html,n!=null){if(s.children!=null)throw Error(st(60));a?.__html!==n&&(e.innerHTML=n)}}break;case"multiple":e.multiple=i&&typeof i!="function"&&typeof i!="symbol";break;case"muted":e.muted=i&&typeof i!="function"&&typeof i!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(i==null||typeof i=="function"||typeof i=="boolean"||typeof i=="symbol"){e.removeAttribute("xlink:href");break}n=Eh(i),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",n);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,i):e.removeAttribute(n);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":i&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,""):e.removeAttribute(n);break;case"capture":case"download":i===!0?e.setAttribute(n,""):i!==!1&&i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,i):e.removeAttribute(n);break;case"cols":case"rows":case"size":case"span":i!=null&&typeof i!="function"&&typeof i!="symbol"&&!isNaN(i)&&1<=i?e.setAttribute(n,i):e.removeAttribute(n);break;case"rowSpan":case"start":i==null||typeof i=="function"||typeof i=="symbol"||isNaN(i)?e.removeAttribute(n):e.setAttribute(n,i);break;case"popover":te("beforetoggle",e),te("toggle",e),Mh(e,"popover",i);break;case"xlinkActuate":Us(e,"http://www.w3.org/1999/xlink","xlink:actuate",i);break;case"xlinkArcrole":Us(e,"http://www.w3.org/1999/xlink","xlink:arcrole",i);break;case"xlinkRole":Us(e,"http://www.w3.org/1999/xlink","xlink:role",i);break;case"xlinkShow":Us(e,"http://www.w3.org/1999/xlink","xlink:show",i);break;case"xlinkTitle":Us(e,"http://www.w3.org/1999/xlink","xlink:title",i);break;case"xlinkType":Us(e,"http://www.w3.org/1999/xlink","xlink:type",i);break;case"xmlBase":Us(e,"http://www.w3.org/XML/1998/namespace","xml:base",i);break;case"xmlLang":Us(e,"http://www.w3.org/XML/1998/namespace","xml:lang",i);break;case"xmlSpace":Us(e,"http://www.w3.org/XML/1998/namespace","xml:space",i);break;case"is":Mh(e,"is",i);break;case"innerText":case"textContent":return;default:if(!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")n=eA.get(n)||n,Mh(e,n,i);else return}he=!0}function jg(e,t,n,i,s,a){switch(n){case"style":Xb(e,i,a);return;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(st(61));if(n=i.__html,n!=null){if(s.children!=null)throw Error(st(60));a?.__html!==n&&(e.innerHTML=n)}}break;case"children":if(typeof i=="string")Io(e,i);else if(typeof i=="number"||typeof i=="bigint")Io(e,""+i);else return;break;case"onScroll":i!=null&&te("scroll",e);return;case"onScrollEnd":i!=null&&te("scrollend",e);return;case"onClick":i!=null&&(e.onclick=us);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!zb.hasOwnProperty(n))t:{if(n[0]==="o"&&n[1]==="n"&&(s=n.endsWith("Capture"),a=n.slice(2,s?n.length-7:void 0),t=e[ii]||null,t=t!=null?t[n]:null,typeof t=="function"&&e.removeEventListener(a,t,s),typeof i=="function")){typeof t!="function"&&t!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(a,i,s);break t}he=!0,n in e?e[n]=i:i===!0?e.setAttribute(n,""):Mh(e,n,i)}return}he=!0}function En(e,t,n){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":te("error",e),te("load",e);var i=!1,s=!1,a;for(a in n)if(n.hasOwnProperty(a)){var r=n[a];if(r!=null)switch(a){case"src":i=!0;break;case"srcSet":s=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(st(137,t));default:xe(e,t,a,r,n,null)}}s&&xe(e,t,"srcSet",n.srcSet,n,null),i&&xe(e,t,"src",n.src,n,null);return;case"input":te("invalid",e);var o=a=r=s=null,l=null,c=null;for(i in n)if(n.hasOwnProperty(i)){var u=n[i];if(u!=null)switch(i){case"name":s=u;break;case"type":r=u;break;case"checked":l=u;break;case"defaultChecked":c=u;break;case"value":a=u;break;case"defaultValue":o=u;break;case"children":case"dangerouslySetInnerHTML":if(u!=null)throw Error(st(137,t));break;default:xe(e,t,i,u,n,null)}}Hb(e,a,o,l,c,r,s,!1);return;case"select":te("invalid",e),i=r=a=null;for(s in n)if(n.hasOwnProperty(s)&&(o=n[s],o!=null))switch(s){case"value":a=o;break;case"defaultValue":r=o;break;case"multiple":i=o;default:xe(e,t,s,o,n,null)}t=a,n=r,e.multiple=!!i,t!=null?Mo(e,!!i,t,!1):n!=null&&Mo(e,!!i,n,!0);return;case"textarea":te("invalid",e),a=s=i=null;for(r in n)if(n.hasOwnProperty(r)&&(o=n[r],o!=null))switch(r){case"value":i=o;break;case"defaultValue":s=o;break;case"children":a=o;break;case"dangerouslySetInnerHTML":if(o!=null)throw Error(st(91));break;default:xe(e,t,r,o,n,null)}kb(e,i,s,a);return;case"option":for(l in n)if(n.hasOwnProperty(l)&&(i=n[l],i!=null))switch(l){case"selected":e.selected=i&&typeof i!="function"&&typeof i!="symbol";break;default:xe(e,t,l,i,n,null)}return;case"dialog":te("beforetoggle",e),te("toggle",e),te("cancel",e),te("close",e);break;case"iframe":case"object":te("load",e);break;case"video":case"audio":for(i=0;i<wc.length;i++)te(wc[i],e);break;case"image":te("error",e),te("load",e);break;case"details":te("toggle",e);break;case"embed":case"source":case"link":te("error",e),te("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(c in n)if(n.hasOwnProperty(c)&&(i=n[c],i!=null))switch(c){case"children":case"dangerouslySetInnerHTML":throw Error(st(137,t));default:xe(e,t,c,i,n,null)}return;default:if(u0(t)){for(u in n)n.hasOwnProperty(u)&&(i=n[u],i!==void 0&&jg(e,t,u,i,n,void 0));return}}for(o in n)n.hasOwnProperty(o)&&(i=n[o],i!=null&&xe(e,t,o,i,n,null))}var PC={};function OC(e,t,n,i){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var s=null,a=null,r=null,o=null,l=null,c=null,u=null;for(p in n){var d=n[p];if(n.hasOwnProperty(p)&&d!=null)switch(p){case"checked":break;case"value":break;case"defaultValue":l=d;default:i.hasOwnProperty(p)||xe(e,t,p,null,i,d)}}for(var h in i){var p=i[h];if(d=n[h],i.hasOwnProperty(h)&&(p!=null||d!=null))switch(h){case"type":p!==d&&(he=!0),a=p;break;case"name":p!==d&&(he=!0),s=p;break;case"checked":p!==d&&(he=!0),c=p;break;case"defaultChecked":p!==d&&(he=!0),u=p;break;case"value":p!==d&&(he=!0),r=p;break;case"defaultValue":p!==d&&(he=!0),o=p;break;case"children":case"dangerouslySetInnerHTML":if(p!=null)throw Error(st(137,t));break;default:p!==d&&xe(e,t,h,p,i,d)}}rg(e,r,o,l,c,u,a,s);return;case"select":p=r=o=h=null;for(a in n)if(l=n[a],n.hasOwnProperty(a)&&l!=null)switch(a){case"value":break;case"multiple":p=l;default:i.hasOwnProperty(a)||xe(e,t,a,null,i,l)}for(s in i)if(a=i[s],l=n[s],i.hasOwnProperty(s)&&(a!=null||l!=null))switch(s){case"value":a!==l&&(he=!0),h=a;break;case"defaultValue":a!==l&&(he=!0),o=a;break;case"multiple":a!==l&&(he=!0),r=a;default:a!==l&&xe(e,t,s,a,i,l)}t=o,n=r,i=p,h!=null?Mo(e,!!n,h,!1):!!i!=!!n&&(t!=null?Mo(e,!!n,t,!0):Mo(e,!!n,n?[]:"",!1));return;case"textarea":p=h=null;for(o in n)if(s=n[o],n.hasOwnProperty(o)&&s!=null&&!i.hasOwnProperty(o))switch(o){case"value":break;case"children":break;default:xe(e,t,o,null,i,s)}for(r in i)if(s=i[r],a=n[r],i.hasOwnProperty(r)&&(s!=null||a!=null))switch(r){case"value":s!==a&&(he=!0),h=s;break;case"defaultValue":s!==a&&(he=!0),p=s;break;case"children":break;case"dangerouslySetInnerHTML":if(s!=null)throw Error(st(91));break;default:s!==a&&xe(e,t,r,s,i,a)}Vb(e,h,p);return;case"option":for(var m in n)if(h=n[m],n.hasOwnProperty(m)&&h!=null&&!i.hasOwnProperty(m))switch(m){case"selected":e.selected=!1;break;default:xe(e,t,m,null,i,h)}for(l in i)if(h=i[l],p=n[l],i.hasOwnProperty(l)&&h!==p&&(h!=null||p!=null))switch(l){case"selected":h!==p&&(he=!0),e.selected=h&&typeof h!="function"&&typeof h!="symbol";break;default:xe(e,t,l,h,i,p)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var b in n)h=n[b],n.hasOwnProperty(b)&&h!=null&&!i.hasOwnProperty(b)&&xe(e,t,b,null,i,h);for(c in i)if(h=i[c],p=n[c],i.hasOwnProperty(c)&&h!==p&&(h!=null||p!=null))switch(c){case"children":case"dangerouslySetInnerHTML":if(h!=null)throw Error(st(137,t));break;default:xe(e,t,c,h,i,p)}return;default:if(u0(t)){for(var g in n)h=n[g],n.hasOwnProperty(g)&&h!==void 0&&!i.hasOwnProperty(g)&&jg(e,t,g,void 0,i,h);for(u in i)h=i[u],p=n[u],!i.hasOwnProperty(u)||h===p||h===void 0&&p===void 0||jg(e,t,u,h,i,p);return}}for(var f in n)h=n[f],n.hasOwnProperty(f)&&h!=null&&!i.hasOwnProperty(f)&&xe(e,t,f,null,i,h);for(d in i)h=i[d],p=n[d],!i.hasOwnProperty(d)||h===p||h==null&&p==null||xe(e,t,d,h,i,p)}function Kx(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function BC(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,n=performance.getEntriesByType("resource"),i=0;i<n.length;i++){var s=n[i],a=s.transferSize,r=s.initiatorType,o=s.duration;if(a&&o&&Kx(r)){for(r=0,o=s.responseEnd,i+=1;i<n.length;i++){var l=n[i],c=l.startTime;if(c>o)break;var u=l.transferSize,d=l.initiatorType;u&&Kx(d)&&(l=l.responseEnd,r+=u*(l<o?1:(o-c)/(l-c)))}if(--i,t+=8*(a+r)/(s.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var Zg=null,Kg=null;function Cc(e){return e.nodeType===9?e:e.ownerDocument}function Jx(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function jM(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function ZM(e,t,n,i){return n=Cc(n).createElement(e),n[xn]=i,n[ii]=t,En(n,e,t),pn(n),n}function Jg(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Wm=null;function zC(){var e=window.event;return e&&e.type==="popstate"?e===Wm?!1:(Wm=e,!0):(Wm=null,!1)}var K0=typeof setTimeout=="function"?setTimeout:void 0,FC=typeof clearTimeout=="function"?clearTimeout:void 0,$x=typeof Promise=="function"?Promise:void 0,Qx=typeof requestAnimationFrame=="function"?requestAnimationFrame:K0,GC=typeof queueMicrotask=="function"?queueMicrotask:typeof $x<"u"?function(e){return $x.resolve(null).then(e).catch(HC)}:K0;function HC(e){setTimeout(function(){throw e})}function Fa(e){return e==="head"}function tb(e,t){var n=t,i=0;do{var s=n.nextSibling;if(e.removeChild(n),s&&s.nodeType===8)if(n=s.data,n==="/$"||n==="/&"){if(i===0){e.removeChild(s),Xo(t);return}i--}else if(n==="$"||n==="$?"||n==="$~"||n==="$!"||n==="&")i++;else if(n==="html")Ym(e.ownerDocument.documentElement);else if(n==="head"){n=e.ownerDocument.head,Ym(n);for(var a=n.firstChild;a;){var r=a.nextSibling,o=a.nodeName;a[Bc]||o==="SCRIPT"||o==="STYLE"||o==="LINK"&&a.rel.toLowerCase()==="stylesheet"||n.removeChild(a),a=r}}else n==="body"&&Ym(e.ownerDocument.body);n=s}while(n);Xo(t)}function eb(e,t){var n=e;e=0;do{var i=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display="none"):(n.style.display=n._stashedDisplay||"",n.getAttribute("style")===""&&n.removeAttribute("style")):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=""):n.nodeValue=n._stashedText||""),i&&i.nodeType===8)if(n=i.data,n==="/$"){if(e===0)break;e--}else n!=="$"&&n!=="$?"&&n!=="$~"&&n!=="$!"||e++;n=i}while(n)}function KM(e,t,n){if(t=CSS.escape(t)!==t?"r-"+btoa(t).replace(/=/g,""):t,e.style.viewTransitionName=t,n!=null&&(e.style.viewTransitionClass=n),n=getComputedStyle(e),n.display==="inline"){if(t=e.getClientRects(),t.length===1)var i=1;else for(var s=i=0;s<t.length;s++){var a=t[s];0<a.width&&0<a.height&&i++}i===1&&(e=e.style,e.display=t.length===1?"inline-block":"block",e.marginTop="-"+n.paddingTop,e.marginBottom="-"+n.paddingBottom)}}function JM(e,t){e=e.style,t=t.style;var n=t!=null?t.hasOwnProperty("viewTransitionName")?t.viewTransitionName:t.hasOwnProperty("view-transition-name")?t["view-transition-name"]:null:null;e.viewTransitionName=n==null||typeof n=="boolean"?"":(""+n).trim(),n=t!=null?t.hasOwnProperty("viewTransitionClass")?t.viewTransitionClass:t.hasOwnProperty("view-transition-class")?t["view-transition-class"]:null:null,e.viewTransitionClass=n==null||typeof n=="boolean"?"":(""+n).trim(),e.display==="inline-block"&&(t==null?e.display=e.margin="":(n=t.display,e.display=n==null||typeof n=="boolean"?"":n,n=t.margin,n!=null?e.margin=n:(n=t.hasOwnProperty("marginTop")?t.marginTop:t["margin-top"],e.marginTop=n==null||typeof n=="boolean"?"":n,t=t.hasOwnProperty("marginBottom")?t.marginBottom:t["margin-bottom"],e.marginBottom=t==null||typeof t=="boolean"?"":t)))}function $M(e,t,n){return n=n.ownerDocument.defaultView,{rect:e,abs:t.position==="absolute"||t.position==="fixed",clip:t.clipPath!=="none"||t.overflow!=="visible"||t.filter!=="none"||t.mask!=="none"||t.mask!=="none"||t.borderRadius!=="0px",view:0<=e.bottom&&0<=e.right&&e.top<=n.innerHeight&&e.left<=n.innerWidth}}function $g(e){var t=e.getBoundingClientRect(),n=getComputedStyle(e);return $M(t,n,e)}function VC(e){var t=e.getBoundingClientRect();t=new DOMRect(t.x+2e4,t.y+2e4,t.width,t.height);var n=getComputedStyle(e);return $M(t,n,e)}function kC(e){return e.documentElement.clientHeight}function XC(e){this.addEventListener("load",e),this.addEventListener("error",e)}function WC(e,t,n,i,s,a,r,o,l){var c=t.nodeType===9?t:t.ownerDocument;try{var u=c.startViewTransition({update:function(){var h=c.defaultView,p=h.navigation&&h.navigation.transition,m=c.fonts.status;i();var b=[];if(m==="loaded"&&(kC(c),c.fonts.status==="loading"&&b.push(c.fonts.ready)),m=b.length,e!==null)for(var g=e.suspenseyImages,f=0,v=0;v<g.length;v++){var S=g[v];if(!S.complete){var x=S.getBoundingClientRect();if(0<x.bottom&&0<x.right&&x.top<h.innerHeight&&x.left<h.innerWidth){if(f+=u1(S),f>Fh){b.length=m;break}S=new Promise(XC.bind(S)),b.push(S)}}}if(0<b.length)return h=Promise.race([Promise.all(b),new Promise(function(T){return setTimeout(T,500)})]).then(s,s),(p?Promise.allSettled([p.finished,h]):h).then(a,a);if(s(),p)return p.finished.then(a,a);a()},types:n});c.__reactViewTransition=u;var d=[];return u.ready.then(function(){for(var h=c.documentElement.getAnimations({subtree:!0}),p=0;p<h.length;p++){var m=h[p],b=m.effect,g=b.pseudoElement;if(g!=null&&g.startsWith("::view-transition")){d.push(m),m=b.getKeyframes();for(var f=g=void 0,v=!0,S=0;S<m.length;S++){var x=m[S],T=x.width;if(g===void 0)g=T;else if(g!==T){v=!1;break}if(T=x.height,f===void 0)f=T;else if(f!==T){v=!1;break}delete x.width,delete x.height,x.transform==="none"&&delete x.transform}v&&g!==void 0&&f!==void 0&&(b.setKeyframes(m),v=getComputedStyle(b.target,b.pseudoElement),v.width!==g||v.height!==f)&&(v=m[0],v.width=g,v.height=f,v=m[m.length-1],v.width=g,v.height=f,b.setKeyframes(m))}}r()},function(h){c.__reactViewTransition===u&&(c.__reactViewTransition=null);try{if(typeof h=="object"&&h!==null)switch(h.name){case"InvalidStateError":(h.message==="View transition was skipped because document visibility state is hidden."||h.message==="Skipping view transition because document visibility state has become hidden."||h.message==="Skipping view transition because viewport size changed."||h.message==="Transition was aborted because of invalid state")&&(h=null)}h!==null&&l(h)}finally{i(),s(),r()}}),u.finished.finally(function(){for(var h=0;h<d.length;h++)d[h].cancel();c.__reactViewTransition===u&&(c.__reactViewTransition=null),o()}),u}catch{return i(),s(),r(),null}}function pr(e,t){this._scope=document.documentElement,this._selector="::view-transition-"+e+"("+t+")"}pr.prototype.animate=function(e,t){return t=typeof t=="number"?{duration:t}:Ce({},t),t.pseudoElement=this._selector,this._scope.animate(e,t)};pr.prototype.getAnimations=function(){for(var e=this._scope,t=this._selector,n=e.getAnimations({subtree:!0}),i=[],s=0;s<n.length;s++){var a=n[s].effect;a!==null&&a.target===e&&a.pseudoElement===t&&i.push(n[s])}return i};pr.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function QM(e){return{name:e,group:new pr("group",e),imagePair:new pr("image-pair",e),old:new pr("old",e),new:new pr("new",e)}}function gi(e){this._fragmentFiber=e,this._observers=this._eventListeners=null}gi.prototype.addEventListener=function(e,t,n){var i=null,s=null;if(!(n!=null&&typeof n!="boolean"&&(i=n.signal||null,i!==null&&i.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var a=this._eventListeners;if(t1(a,e,t,n)===-1){var r=this,o=t;n!=null&&typeof n!="boolean"&&n.once===!0&&(o=function(l){r.removeEventListener(e,t,n),typeof t=="function"?t.call(this,l):t.handleEvent(l)}),i!==null&&(s=r.removeEventListener.bind(r,e,t,n),i.addEventListener("abort",s,{once:!0}),s=i.removeEventListener.bind(i,"abort",s)),i=Go(n),a.push({type:e,listener:t,optionsOrUseCapture:n,attachedListener:o,cleanup:s}),ni(this._fragmentFiber.child,!1,qC,e,o,i)}this._eventListeners=a}};function qC(e,t,n,i){return on(e).addEventListener(t,n,i),!1}gi.prototype.removeEventListener=function(e,t,n){var i=this._eventListeners;if(i!==null&&(t=t1(i,e,t,n),t!==-1)){var s=i[t];n=s.attachedListener;var a=s.cleanup;s=Go(s.optionsOrUseCapture),ni(this._fragmentFiber.child,!1,YC,e,n,s),i.splice(t,1),a!==null&&a()}};function YC(e,t,n,i){return on(e).removeEventListener(t,n,i),!1}function Go(e){return e!=null&&typeof e!="boolean"&&(e.once===!0||e.signal instanceof AbortSignal)?{capture:e.capture,passive:e.passive}:e}function nb(e){return e==null?"c=0":typeof e=="boolean"?"c="+(e?"1":"0"):"c="+(e.capture?"1":"0")}function t1(e,t,n,i){if(e.length===0)return-1;i=nb(i);for(var s=0;s<e.length;s++){var a=e[s];if(a.type===t&&a.listener===n&&nb(a.optionsOrUseCapture)===i)return s}return-1}gi.prototype.dispatchEvent=function(e){var t=Cr(this._fragmentFiber);if(t===null)return!0;t=on(t);var n=this._eventListeners;if(n!==null&&0<n.length||!e.bubbles){var i=t.nodeType===9?t.createComment(""):document.createTextNode("");if(n)for(var s=0;s<n.length;s++){var a=n[s];i.addEventListener(a.type,a.attachedListener,Go(a.optionsOrUseCapture))}if(t.appendChild(i),e=i.dispatchEvent(e),n)for(s=0;s<n.length;s++)a=n[s],i.removeEventListener(a.type,a.attachedListener,Go(a.optionsOrUseCapture));return t.removeChild(i),e}return t.dispatchEvent(e)};gi.prototype.focus=function(e){ni(this._fragmentFiber.child,!0,e1,e,void 0,void 0)};function e1(e,t){return e.tag===6?!1:(e=on(e),aR(e,t))}gi.prototype.focusLast=function(e){var t=[];ni(this._fragmentFiber.child,!0,J0,t,void 0,void 0);for(var n=t.length-1;0<=n&&!e1(t[n],e);n--);};function J0(e,t){return t.push(e),!1}gi.prototype.blur=function(){var e=Cr(this._fragmentFiber);e!==null&&(e=on(e),e=Cc(e).activeElement,e!==null&&ni(this._fragmentFiber.child,!1,jC,e,void 0,void 0))};function jC(e,t){return e.tag===6?!1:(e=on(e),e===t||e.contains(t)?(t.blur(),!0):!1)}gi.prototype.observeUsing=function(e){this._observers===null&&(this._observers=new Set),this._observers.add(e),ni(this._fragmentFiber.child,!1,ZC,e,void 0,void 0)};function ZC(e,t){return e.tag===6||(e=on(e),t.observe(e)),!1}gi.prototype.unobserveUsing=function(e){var t=this._observers;if(t!==null&&t.has(e)){t.delete(e),ni(this._fragmentFiber.child,!1,KC,e,void 0,void 0);for(var n=t=0;n<Gi.length;n++){var i=Gi[n];i.fragmentInstance===this&&i.observer===e?e.unobserve(i.instance):Gi[t++]=i}Gi.length=t}};function KC(e,t){return e.tag===6||(e=on(e),t.unobserve(e)),!1}var Gi=[],qm=!1;function JC(e,t,n){Gi.push({fragmentInstance:e,observer:t,instance:n}),qm||(qm=!0,rR(function(){qm=!1;var i=Gi;Gi=[];for(var s=0;s<i.length;s++){var a=i[s];a.observer.unobserve(a.instance)}}))}gi.prototype.getClientRects=function(){var e=[];return ni(this._fragmentFiber.child,!1,$C,e,void 0,void 0),e};function $C(e,t){if(e.tag===6){e=e.stateNode;var n=e.ownerDocument.createRange();n.selectNodeContents(e),t.push.apply(t,n.getClientRects())}else e=on(e),t.push.apply(t,e.getClientRects());return!1}gi.prototype.getRootNode=function(e){var t=Cr(this._fragmentFiber);return t===null?this:on(t).getRootNode(e)};gi.prototype.compareDocumentPosition=function(e){var t=Cr(this._fragmentFiber);if(t===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var n=[];ni(this._fragmentFiber.child,!1,J0,n,void 0,void 0);var i=on(t);if(n.length===0){if(n=i,P_(this._fragmentFiber)){t:{for(t=this._fragmentFiber.return;t!==null;){if(t.tag===4){t=t.stateNode.containerInfo;break t}if(t.tag===3||t.tag===5||t.tag===27)break;t=t.return}t=null}t!=null&&(n=t)}t=this._fragmentFiber;var s=i=n.compareDocumentPosition(e);return n===e?s=Node.DOCUMENT_POSITION_CONTAINS:i&Node.DOCUMENT_POSITION_CONTAINED_BY&&(n=Mb(t)[1],n===null?s=Node.DOCUMENT_POSITION_PRECEDING:(e=on(n).compareDocumentPosition(e),s=e===0||e&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),s|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}t=on(n[0]),s=on(n[n.length-1]);var a=P_(this._fragmentFiber)?t.parentElement:i;if(a==null)return Node.DOCUMENT_POSITION_DISCONNECTED;i=a.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_CONTAINED_BY,a=a.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_CONTAINED_BY;var r=t.compareDocumentPosition(e),o=s.compareDocumentPosition(e),l=r&Node.DOCUMENT_POSITION_CONTAINED_BY||o&Node.DOCUMENT_POSITION_CONTAINED_BY;return o=i&&a&&r&Node.DOCUMENT_POSITION_FOLLOWING&&o&Node.DOCUMENT_POSITION_PRECEDING,t=i&&t===e||a&&s===e||l||o?Node.DOCUMENT_POSITION_CONTAINED_BY:!i&&t===e||!a&&s===e?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:r,t&Node.DOCUMENT_POSITION_DISCONNECTED||t&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||QC(t,this._fragmentFiber,n[0],n[n.length-1],e)?t:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function QC(e,t,n,i,s){var a=fr(s);if(e&Node.DOCUMENT_POSITION_CONTAINED_BY){if(n=!!a)t:{for(;a!==null;){if(a.tag===7&&(a===t||a.alternate===t)){n=!0;break t}a=a.return}n=!1}return n}if(e&Node.DOCUMENT_POSITION_CONTAINS){if(a===null)return a=s.ownerDocument,s===a||s===a.documentElement||s===a.body;t:{for(a=t,t=Cr(t);a!==null;){if(!(a.tag!==5&&a.tag!==3&&a.tag!==27||a!==t&&a.alternate!==t)){a=!0;break t}a=a.return}a=!1}return a}return e&Node.DOCUMENT_POSITION_PRECEDING?((t=!!a)&&!(t=a===n)&&(t=Zm(n,a,O_),t===null?t=!1:(ni(t,!0,Rw,a,n),a=co,co=null,t=a!==null)),t):e&Node.DOCUMENT_POSITION_FOLLOWING?((t=!!a)&&!(t=a===i)&&(t=Zm(i,a,O_),t===null?t=!1:(ni(t,!0,Nw,a,i),a=co,jm=co=null,t=a!==null)),t):!1}function ib(e,t){var n=e.ownerDocument.createRange();n.selectNodeContents(e),e=n.getBoundingClientRect(),window.scrollTo(window.scrollX+e.left,t?window.scrollY+e.top:window.scrollY+e.bottom-window.innerHeight)}gi.prototype.scrollIntoView=function(e){if(typeof e=="object")throw Error(st(566));var t=[];ni(this._fragmentFiber.child,!1,J0,t,void 0,void 0);var n=e!==!1;if(t.length===0){var i=Mb(this._fragmentFiber);if(i=n?i[1]||i[0]||Cr(this._fragmentFiber):i[0]||i[1],i===null)return;if(i.tag===6){e=on(i),ib(e,n);return}if(i=on(i),i.nodeType!==9){if(i.nodeType===11){n="host"in i?i.host:null,n!==null&&n.scrollIntoView(e);return}i.scrollIntoView(e)}}for(i=n?t.length-1:0;i!==(n?-1:t.length);){var s=t[i];s.tag===6?(s=on(s),ib(s,n)):on(s).scrollIntoView(e),i+=n?-1:1}};function tR(e,t){return e=on(e),n1(e,t),!1}function n1(e,t){e.reactFragments==null&&(e.reactFragments=new Set),e.reactFragments.add(t)}function i1(e,t){var n=t._eventListeners;if(n!==null)for(var i=0;i<n.length;i++){var s=n[i];e.addEventListener(s.type,s.attachedListener,Go(s.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(a){for(var r=0,o=0;o<Gi.length;o++){var l=Gi[o];(l.fragmentInstance!==t||l.observer!==a||l.instance!==e)&&(Gi[r++]=l)}Gi.length=r,a.observe(e)}),n1(e,t))}function eR(e,t){var n=t._eventListeners;if(n!==null)for(var i=0;i<n.length;i++){var s=n[i];e.removeEventListener(s.type,s.attachedListener,Go(s.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(a){typeof a.rootMargin=="string"?JC(t,a,e):a.unobserve(e)}),e.reactFragments!=null&&e.reactFragments.delete(t))}function Qg(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case"HTML":case"HEAD":case"BODY":Qg(n),yd(n);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(n.rel.toLowerCase()==="stylesheet")continue}e.removeChild(n)}}function nR(e,t,n,i){for(;e.nodeType===1;){var s=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!i&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(i){if(!e[Bc])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(a=e.getAttribute("rel"),a==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(a!==s.rel||e.getAttribute("href")!==(s.href==null||s.href===""?null:s.href)||e.getAttribute("crossorigin")!==(s.crossOrigin==null?null:s.crossOrigin)||e.getAttribute("title")!==(s.title==null?null:s.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(a=e.getAttribute("src"),(a!==(s.src==null?null:s.src)||e.getAttribute("type")!==(s.type==null?null:s.type)||e.getAttribute("crossorigin")!==(s.crossOrigin==null?null:s.crossOrigin))&&a&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var a=s.name==null?null:""+s.name;if(s.type==="hidden"&&e.getAttribute("name")===a)return e}else return e;if(e=Li(e.nextSibling),e===null)break}return null}function iR(e,t,n){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!n||(e=Li(e.nextSibling),e===null))return null;return e}function s1(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=Li(e.nextSibling),e===null))return null;return e}function t0(e){return e.data==="$?"||e.data==="$~"}function $0(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function sR(e,t){var n=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||n.readyState!=="loading")t();else{var i=function(){t(),n.removeEventListener("DOMContentLoaded",i)};n.addEventListener("DOMContentLoaded",i),e._reactRetry=i}}function Li(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var e0=null;function sb(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"||n==="/&"){if(t===0)return Li(e.nextSibling);t--}else n!=="$"&&n!=="$!"&&n!=="$?"&&n!=="$~"&&n!=="&"||t++}e=e.nextSibling}return null}function ab(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"){if(t===0)return e;t--}else n!=="/$"&&n!=="/&"||t++}e=e.previousSibling}return null}function aR(e,t){function n(){i=!0}if(e.ownerDocument.activeElement===e)return!0;var i=!1;try{e.ownerDocument.addEventListener("focus",n,!0),(e.focus||HTMLElement.prototype.focus).call(e,t)}finally{e.ownerDocument.removeEventListener("focus",n,!0)}return i}function rR(e){Qx(function(){Qx(function(t){return e(t)})})}function a1(e,t,n){switch(t=Cc(n),e){case"html":if(e=t.documentElement,!e)throw Error(st(452));return e;case"head":if(e=t.head,!e)throw Error(st(453));return e;case"body":if(e=t.body,!e)throw Error(st(454));return e;default:throw Error(st(451))}}function r1(e,t,n){for(var i in n){var s=n[i];n.hasOwnProperty(i)&&s!=null&&xe(e,t,i,null,PC,s)}n.dangerouslySetInnerHTML!=null&&(e.textContent=""),e.onclick===us&&(e.onclick=null),yd(e)}function Ym(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);yd(e)}var Ui=new Map,rb=new Set;function Rc(e){if(typeof e.getRootNode=="function"){var t=e.getRootNode();if(t.nodeType===9||t.nodeType===11)return t}return e.nodeType===9?e:e.ownerDocument}var Ys=fe.d;fe.d={f:oR,r:lR,D:cR,C:uR,L:hR,m:dR,X:pR,S:fR,M:mR};function oR(){var e=Ys.f(),t=Ld();return e||t}function lR(e){var t=qo(e);t!==null&&t.tag===5&&t.type==="form"?XS(t):Ys.r(e)}var Ko=typeof document>"u"?null:document;function o1(e,t,n){var i=Ko;if(i&&typeof t=="string"&&t){var s=Ri(t);s='link[rel="'+e+'"][href="'+s+'"]',typeof n=="string"&&(s+='[crossorigin="'+n+'"]'),rb.has(s)||(rb.add(s),e={rel:e,crossOrigin:n,href:t},i.querySelector(s)===null&&(t=i.createElement("link"),En(t,"link",e),pn(t),i.head.appendChild(t)))}}function cR(e){Ys.D(e),o1("dns-prefetch",e,null)}function uR(e,t){Ys.C(e,t),o1("preconnect",e,t)}function hR(e,t,n){Ys.L(e,t,n);var i=Ko;if(i&&e&&t){var s='link[rel="preload"][as="'+Ri(t)+'"]';t==="image"&&n&&n.imageSrcSet?(s+='[imagesrcset="'+Ri(n.imageSrcSet)+'"]',typeof n.imageSizes=="string"&&(s+='[imagesizes="'+Ri(n.imageSizes)+'"]')):s+='[href="'+Ri(e)+'"]';var a=s;switch(t){case"style":a=Ho(e);break;case"script":a=Jo(e)}if(!(Ui.has(a)||(e=Ce({rel:"preload",href:t==="image"&&n&&n.imageSrcSet?void 0:e,as:t},n),Ui.set(a,e),i.querySelector(s)!==null||t==="style"&&i.querySelector(kc(a))||t==="script"&&i.querySelector(Xc(a))))){var r=i.createElement("link");En(r,"link",e),t==="style"&&(r[qh]=!0,r.onload=r.onerror=function(){Ob(r)}),pn(r),i.head.appendChild(r)}}}function dR(e,t){Ys.m(e,t);var n=Ko;if(n&&e){var i=t&&typeof t.as=="string"?t.as:"script",s='link[rel="modulepreload"][as="'+Ri(i)+'"][href="'+Ri(e)+'"]',a=s;switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":a=Jo(e)}if(!Ui.has(a)&&(e=Ce({rel:"modulepreload",href:e},t),Ui.set(a,e),n.querySelector(s)===null)){switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(n.querySelector(Xc(a)))return}i=n.createElement("link"),En(i,"link",e),pn(i),n.head.appendChild(i)}}}function fR(e,t,n){Ys.S(e,t,n);var i=Ko;if(i&&e){var s=So(i).hoistableStyles,a=Ho(e);t=t||"default";var r=s.get(a);if(!r){var o={loading:0,preload:null};if(r=i.querySelector(kc(a)))o.loading=5;else{e=Ce({rel:"stylesheet",href:e,"data-precedence":t},n),(n=Ui.get(a))&&Q0(e,n);var l=r=i.createElement("link");pn(l),En(l,"link",e),l._p=new Promise(function(c,u){l.onload=c,l.onerror=u}),l.addEventListener("load",function(){o.loading|=1}),l.addEventListener("error",function(){o.loading|=2}),o.loading|=4,Bh(r,t,i)}r={type:"stylesheet",instance:r,count:1,state:o},s.set(a,r)}}}function pR(e,t){Ys.X(e,t);var n=Ko;if(n&&e){var i=So(n).hoistableScripts,s=Jo(e),a=i.get(s);a||(a=n.querySelector(Xc(s)),a||(e=Ce({src:e,async:!0},t),(t=Ui.get(s))&&tv(e,t),a=n.createElement("script"),pn(a),En(a,"link",e),n.head.appendChild(a)),a={type:"script",instance:a,count:1,state:null},i.set(s,a))}}function mR(e,t){Ys.M(e,t);var n=Ko;if(n&&e){var i=So(n).hoistableScripts,s=Jo(e),a=i.get(s);a||(a=n.querySelector(Xc(s)),a||(e=Ce({src:e,async:!0,type:"module"},t),(t=Ui.get(s))&&tv(e,t),a=n.createElement("script"),pn(a),En(a,"link",e),n.head.appendChild(a)),a={type:"script",instance:a,count:1,state:null},i.set(s,a))}}function ob(e,t,n,i){var s=(s=Ma.current)?Rc(s):null;if(!s)throw Error(st(446));switch(e){case"meta":case"title":return null;case"style":return typeof n.precedence=="string"&&typeof n.href=="string"?(n=Ho(n.href),t=So(s).hoistableStyles,i=t.get(n),i||(i={type:"style",instance:null,count:0,state:null},t.set(n,i)),i):{type:"void",instance:null,count:0,state:null};case"link":if(n.rel==="stylesheet"&&typeof n.href=="string"&&typeof n.precedence=="string"){e=Ho(n.href);var a=So(s).hoistableStyles,r=a.get(e);if(r||(s=s.ownerDocument||s,r={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},a.set(e,r),(a=s.querySelector(kc(e)))?a._p||(r.instance=a,r.state.loading=5):(a=Ui.get(e),a||(a={rel:"preload",as:"style",href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},Ui.set(e,a)),gR(s,e,a,r.state))),t&&i===null)throw Error(st(528,""));return r}if(t&&i!==null)throw Error(st(529,""));return null;case"script":return t=n.async,n=n.src,typeof n=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(n=Jo(n),t=So(s).hoistableScripts,i=t.get(n),i||(i={type:"script",instance:null,count:0,state:null},t.set(n,i)),i):{type:"void",instance:null,count:0,state:null};default:throw Error(st(444,e))}}function Ho(e){return'href="'+Ri(e)+'"'}function kc(e){return'link[rel="stylesheet"]['+e+"]"}function l1(e){return Ce({},e,{"data-precedence":e.precedence,precedence:null})}function gR(e,t,n,i){if(t=e.querySelector('link[rel="preload"][as="style"]['+t+"]")){if(t[qh]!==!0){i.loading=1;return}}else t=e.createElement("link"),t[qh]=!0,t.onload=t.onerror=Ob.bind(null,t),En(t,"link",n),pn(t),e.head.appendChild(t);i.preload=t,t.addEventListener("load",function(){return i.loading|=1}),t.addEventListener("error",function(){return i.loading|=2})}function Jo(e){return'[src="'+Ri(e)+'"]'}function Xc(e){return"script[async]"+e}function lb(e,t,n){if(t.count++,t.instance===null)switch(t.type){case"style":var i=e.querySelector('style[data-href~="'+Ri(n.href)+'"]');if(i)return t.instance=i,pn(i),i;var s=Ce({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return i=(e.ownerDocument||e).createElement("style"),pn(i),En(i,"style",s),Bh(i,n.precedence,e),t.instance=i;case"stylesheet":s=Ho(n.href);var a=e.querySelector(kc(s));if(a)return t.state.loading|=4,t.instance=a,pn(a),a;i=l1(n),(s=Ui.get(s))&&Q0(i,s),a=(e.ownerDocument||e).createElement("link"),pn(a);var r=a;return r._p=new Promise(function(o,l){r.onload=o,r.onerror=l}),En(a,"link",i),t.state.loading|=4,Bh(a,n.precedence,e),t.instance=a;case"script":return a=Jo(n.src),(s=e.querySelector(Xc(a)))?(t.instance=s,pn(s),s):(i=n,(s=Ui.get(a))&&(i=Ce({},n),tv(i,s)),e=e.ownerDocument||e,s=e.createElement("script"),pn(s),En(s,"link",i),e.head.appendChild(s),t.instance=s);case"void":return null;default:throw Error(st(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(i=t.instance,t.state.loading|=4,Bh(i,n.precedence,e));return t.instance}function Bh(e,t,n){for(var i=n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),s=i.length?i[i.length-1]:null,a=s,r=0;r<i.length;r++){var o=i[r];if(o.dataset.precedence===t)a=o;else if(a!==s)break}a?a.parentNode.insertBefore(e,a.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function Q0(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function tv(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var zh=null;function cb(e,t,n){if(zh===null){var i=new Map,s=zh=new Map;s.set(n,i)}else s=zh,i=s.get(n),i||(i=new Map,s.set(n,i));if(i.has(e))return i;for(i.set(e,null),n=n.getElementsByTagName(e),s=0;s<n.length;s++){var a=n[s];if(!(a[Bc]||a[xn]||e==="link"&&a.getAttribute("rel")==="stylesheet")&&a.namespaceURI!=="http://www.w3.org/2000/svg"){var r=a.getAttribute(t)||"";r=e+r;var o=i.get(r);o?o.push(a):i.set(r,[a])}}return i}function n0(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t==="title"?e.querySelector("head > title"):null)}function vR(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;switch(t.rel){case"stylesheet":return e=t.disabled,typeof t.precedence=="string"&&e==null;default:return!0}case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function ub(e,t){return e==="img"&&t.src!=null&&t.src!==""&&t.onLoad==null&&t.loading!=="lazy"}function c1(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}function u1(e){return(e.width||100)*(e.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function hb(e,t){typeof t.decode=="function"&&(e.imgCount++,t.complete||(e.imgBytes+=u1(t),e.suspenseyImages.push(t)),e=xR.bind(e),t.decode().then(e,e))}function yR(e,t,n,i){if(n.type==="stylesheet"&&(typeof i.media!="string"||matchMedia(i.media).matches!==!1)&&(n.state.loading&4)===0){if(n.instance===null){var s=Ho(i.href),a=t.querySelector(kc(s));if(a){t=a._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=Nc.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=a,pn(a);return}a=t.ownerDocument||t,i=l1(i),(s=Ui.get(s))&&Q0(i,s),a=a.createElement("link"),pn(a);var r=a;r._p=new Promise(function(o,l){r.onload=o,r.onerror=l}),En(a,"link",i),n.instance=a}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&(n.state.loading&3)===0&&(e.count++,n=Nc.bind(e),t.addEventListener("load",n),t.addEventListener("error",n))}}var Fh=0;function _R(e,t){return e.stylesheets&&e.count===0&&Gh(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var i=setTimeout(function(){if(e.stylesheets&&Gh(e,e.stylesheets),e.unsuspend){var a=e.unsuspend;e.unsuspend=null,a()}},6e4+t);0<e.imgBytes&&Fh===0&&(Fh=62500*BC());var s=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&Gh(e,e.stylesheets),e.unsuspend)){var a=e.unsuspend;e.unsuspend=null,a()}},(e.imgBytes>Fh?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(i),clearTimeout(s)}}:null}function h1(e){if(e.count===0&&(e.imgCount===0||!e.waitingForImages)){if(e.stylesheets)Gh(e,e.stylesheets);else if(e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}}}function Nc(){this.count--,h1(this)}function xR(){this.imgCount--,h1(this)}var md=null;function Gh(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,md=new Map,t.forEach(bR,e),md=null,Nc.call(e))}function bR(e,t){if(!(t.state.loading&4)){var n=md.get(e);if(n)var i=n.get(null);else{n=new Map,md.set(e,n);for(var s=e.querySelectorAll("link[data-precedence],style[data-precedence]"),a=0;a<s.length;a++){var r=s[a];(r.nodeName==="LINK"||r.getAttribute("media")!=="not all")&&(n.set(r.dataset.precedence,r),i=r)}i&&n.set(null,i)}s=t.instance,r=s.getAttribute("data-precedence"),a=n.get(r)||i,a===i&&n.set(null,s),n.set(r,s),this.count++,i=Nc.bind(this),s.addEventListener("load",i),s.addEventListener("error",i),a?a.parentNode.insertBefore(s,a.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(s,e.firstChild)),t.state.loading|=4}}var Vo={$$typeof:cs,Provider:null,Consumer:null,_currentValue:mr,_currentValue2:mr,_threadCount:0};function SR(e,t,n,i,s,a,r,o,l){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=bm(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=bm(0),this.hiddenUpdates=bm(null),this.identifierPrefix=i,this.onUncaughtError=s,this.onCaughtError=a,this.onRecoverableError=r,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=l,this.transitionTypes=null,this.incompleteTransitions=new Map}function d1(e,t,n,i,s,a,r,o,l,c,u,d){return e=new SR(e,t,n,r,l,c,u,d,o),t=1,a===!0&&(t|=24),a=ti(3,null,null,t),e.current=a,a.stateNode=e,t=x0(),t.refCount++,e.pooledCache=t,t.refCount++,a.memoizedState={element:i,isDehydrated:n,cache:t},M0(a),e}function f1(e){return e?(e=yo,e):yo}function p1(e,t,n,i,s,a){s=f1(s),i.context===null?i.context=s:i.pendingContext=s,i=Ta(t),i.payload={element:n},a=a===void 0?null:a,a!==null&&(i.callback=a),n=wa(e,i,t),n!==null&&(ei(n,e,t),lc(n,e,t))}function db(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function ev(e,t){db(e,t),(e=e.alternate)&&db(e,t)}function m1(e){if(e.tag===13||e.tag===31){var t=Dr(e,67108864);t!==null&&ei(t,e,67108864),ev(e,67108864)}}function fb(e){if(e.tag===13||e.tag===31){var t=pi();t=l0(t);var n=Dr(e,t);n!==null&&ei(n,e,t),ev(e,t)}}var ko=!0;function MR(e,t,n,i){var s=Ft.T;Ft.T=null;var a=fe.p;try{fe.p=2,nv(e,t,n,i)}finally{fe.p=a,Ft.T=s}}function ER(e,t,n,i){var s=Ft.T;Ft.T=null;var a=fe.p;try{fe.p=8,nv(e,t,n,i)}finally{fe.p=a,Ft.T=s}}function nv(e,t,n,i){if(ko){var s=i0(i);if(s===null)Xm(e,t,i,gd,n),pb(e,i);else if(wR(s,e,t,n,i))i.stopPropagation();else if(pb(e,i),t&4&&-1<TR.indexOf(e)){for(;s!==null;){var a=qo(s);if(a!==null)switch(a.tag){case 3:if(a=a.stateNode,a.current.memoizedState.isDehydrated){var r=ur(a.pendingLanes);if(r!==0){var o=a;for(o.pendingLanes|=2,o.entangledLanes|=2;r;){var l=1<<31-fi(r);o.entanglements[1]|=l,r&=~l}vs(a),(de&6)===0&&(ud=hi()+500,Vc(0,!1))}}break;case 31:case 13:o=Dr(a,2),o!==null&&ei(o,a,2),Ld(),ev(a,2)}if(a=i0(i),a===null&&Xm(e,t,i,gd,n),a===s)break;s=a}s!==null&&i.stopPropagation()}else Xm(e,t,i,null,n)}}function i0(e){return e=h0(e),iv(e)}var gd=null;function iv(e){if(gd=null,e=fr(e),e!==null){var t=Uc(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=xb(t),e!==null)return e;e=null}else if(n===31){if(e=bb(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return gd=e,null}function g1(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(Fw()){case Ab:return 2;case Cb:return 8;case Wh:case Gw:return 32;case Rb:return 268435456;default:return 32}default:return 32}}var s0=!1,Na=null,Da=null,La=null,Dc=new Map,Lc=new Map,ga=[],TR="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function pb(e,t){switch(e){case"focusin":case"focusout":Na=null;break;case"dragenter":case"dragleave":Da=null;break;case"mouseover":case"mouseout":La=null;break;case"pointerover":case"pointerout":Dc.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Lc.delete(t.pointerId)}}function Jl(e,t,n,i,s,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:i,nativeEvent:a,targetContainers:[s]},t!==null&&(t=qo(t),t!==null&&m1(t)),e):(e.eventSystemFlags|=i,t=e.targetContainers,s!==null&&t.indexOf(s)===-1&&t.push(s),e)}function wR(e,t,n,i,s){switch(t){case"focusin":return Na=Jl(Na,e,t,n,i,s),!0;case"dragenter":return Da=Jl(Da,e,t,n,i,s),!0;case"mouseover":return La=Jl(La,e,t,n,i,s),!0;case"pointerover":var a=s.pointerId;return Dc.set(a,Jl(Dc.get(a)||null,e,t,n,i,s)),!0;case"gotpointercapture":return a=s.pointerId,Lc.set(a,Jl(Lc.get(a)||null,e,t,n,i,s)),!0}return!1}function v1(e){var t=fr(e.target);if(t!==null){var n=Uc(t);if(n!==null){if(t=n.tag,t===13){if(t=xb(n),t!==null){e.blockedOn=t,G_(e.priority,function(){fb(n)});return}}else if(t===31){if(t=bb(n),t!==null){e.blockedOn=t,G_(e.priority,function(){fb(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Hh(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=i0(e.nativeEvent);if(n===null){n=e.nativeEvent;var i=new n.constructor(n.type,n);og=i,n.target.dispatchEvent(i),og=null}else return t=qo(n),t!==null&&m1(t),e.blockedOn=n,!1;t.shift()}return!0}function mb(e,t,n){Hh(e)&&n.delete(t)}function AR(){s0=!1,Na!==null&&Hh(Na)&&(Na=null),Da!==null&&Hh(Da)&&(Da=null),La!==null&&Hh(La)&&(La=null),Dc.forEach(mb),Lc.forEach(mb)}function bh(e,t){e.blockedOn===t&&(e.blockedOn=null,s0||(s0=!0,ln.unstable_scheduleCallback(ln.unstable_NormalPriority,AR)))}var Sh=null;function gb(e){Sh!==e&&(Sh=e,ln.unstable_scheduleCallback(ln.unstable_NormalPriority,function(){Sh===e&&(Sh=null);for(var t=0;t<e.length;t+=3){var n=e[t],i=e[t+1],s=e[t+2];if(typeof i!="function"){if(iv(i||n)===null)continue;break}var a=qo(n);a!==null&&(e.splice(t,3),t-=3,Mg(a,{pending:!0,data:s,method:n.method,action:i},i,s))}}))}function Xo(e){function t(l){return bh(l,e)}Na!==null&&bh(Na,e),Da!==null&&bh(Da,e),La!==null&&bh(La,e),Dc.forEach(t),Lc.forEach(t);for(var n=0;n<ga.length;n++){var i=ga[n];i.blockedOn===e&&(i.blockedOn=null)}for(;0<ga.length&&(n=ga[0],n.blockedOn===null);)v1(n),n.blockedOn===null&&ga.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(i=0;i<n.length;i+=3){var s=n[i],a=n[i+1],r=s[ii]||null;if(typeof a=="function")r||gb(n);else if(r){var o=null;if(a&&a.hasAttribute("formAction")){if(s=a,r=a[ii]||null)o=r.formAction;else if(iv(s)!==null)continue}else o=r.action;typeof o=="function"?n[i+1]=o:(n.splice(i,3),i-=3),gb(n)}}}function y1(){function e(a){a.canIntercept&&a.info==="react-transition"&&a.intercept({handler:function(){return new Promise(function(r){return s=r})},focusReset:"manual",scroll:"manual"})}function t(){s!==null&&(s(),s=null),i||setTimeout(n,20)}function n(){if(!i&&!navigation.transition){var a=navigation.currentEntry;a&&a.url!=null&&navigation.navigate(a.url,{state:a.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var i=!1,s=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(n,100),function(){i=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),s!==null&&(s(),s=null)}}}function sv(e){this._internalRoot=e}Pd.prototype.render=sv.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(st(409));var n=t.current,i=pi();p1(n,i,e,t,null,null)};Pd.prototype.unmount=sv.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;p1(e.current,2,null,e,null,null),Ld(),t[Wo]=null}};function Pd(e){this._internalRoot=e}Pd.prototype.unstable_scheduleHydration=function(e){if(e){var t=Pb();e={blockedOn:null,target:e,priority:t};for(var n=0;n<ga.length&&t!==0&&t<ga[n].priority;n++);ga.splice(n,0,e),n===0&&v1(e)}};var vb=yb.version;if(vb!=="19.3.0")throw Error(st(527,vb,"19.3.0"));fe.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(st(188)):(e=Object.keys(e).join(","),Error(st(268,e)));return e=Cw(t),e=e!==null?Sb(e):null,e=e===null?null:e.stateNode,e};var CR={bundleType:0,version:"19.3.0",rendererPackageName:"react-dom",currentDispatcherRef:Ft,reconcilerVersion:"19.3.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&($l=__REACT_DEVTOOLS_GLOBAL_HOOK__,!$l.isDisabled&&$l.supportsFiber))try{Ic=$l.inject(CR),di=$l}catch{}var $l;Od.createRoot=function(e,t){if(!_b(e))throw Error(st(299));var n=!1,i="",s=$S,a=QS,r=tM;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(i=t.identifierPrefix),t.onUncaughtError!==void 0&&(s=t.onUncaughtError),t.onCaughtError!==void 0&&(a=t.onCaughtError),t.onRecoverableError!==void 0&&(r=t.onRecoverableError)),t=d1(e,1,!1,null,null,n,i,null,s,a,r,y1),e[Wo]=t.current,Z0(e),new sv(t)};Od.hydrateRoot=function(e,t,n){if(!_b(e))throw Error(st(299));var i=!1,s="",a=$S,r=QS,o=tM,l=null;return n!=null&&(n.unstable_strictMode===!0&&(i=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onUncaughtError!==void 0&&(a=n.onUncaughtError),n.onCaughtError!==void 0&&(r=n.onCaughtError),n.onRecoverableError!==void 0&&(o=n.onRecoverableError),n.formState!==void 0&&(l=n.formState)),t=d1(e,1,!0,t,n??null,i,s,l,a,r,o,y1),t.context=f1(null),n=t.current,i=pi(),i=l0(i),s=Ta(i),s.callback=null,wa(n,s,i),n=i,t.current.lanes=n,Oc(t,n),vs(t),e[Wo]=t.current,Z0(e),new Pd(t)};Od.version="19.3.0"});var S1=ns((zI,b1)=>{"use strict";function x1(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(x1)}catch(e){console.error(e)}}x1(),b1.exports=_1()});var ot=Kn(la(),1);function i_(e,t="symbols"){let n=e.nodes||[],i=new Map,s=new Map,a=new Map;for(let o of n){let l=t==="files"?`file:${o.path}`:String(o.node_id);s.set(String(o.node_id),l);let c=o.path.split("/"),u=c.length>2?c.slice(0,2).join("/"):c.length>1?c[0]:"root",d=`code:${u}`;a.has(d)||a.set(d,{id:d,label:u,packages:[u]}),i.has(l)||i.set(l,{...o,node_id:l,symbol:t==="files"?o.path:o.symbol,kind:t==="files"?"file":"symbol",community:d,files:1,symbols:0,fan_in:0,fan_out:0,degree:0,cycle:!1,representatives:[]});let h=i.get(l);h.symbols++,h.representatives.length<6&&h.representatives.push(o)}let r=new Map;for(let o of e.edges||[]){let l=s.get(String(o.source)),c=s.get(String(o.target));if(!l||!c)continue;let u=Number(o.weight||1);i.get(l).fan_out+=u,i.get(c).fan_in+=u;let d=JSON.stringify([l,c,o.relation]);r.has(d)?r.get(d).weight+=u:r.set(d,{...o,source:l,target:c,weight:u})}for(let o of i.values())o.degree=o.fan_in+o.fan_out;return{snapshot:e.snapshot,root:{symbol:t==="files"?"File relationships":"Symbol relationships",path:e.root?.path||"."},nodes:[...i.values()],edges:[...r.values()],communities:[...a.values()],partial:e.partial,coverage_gap_count:e.coverage_gap_count,truncated:e.truncated,level:t,totals:{symbols:e.total_nodes,relationships:e.total_edges}}}var Wu=Kn(la(),1);var im=new WeakMap;function sm(e,t){return im.get(e)?.get(`${t.width}:${t.height}`)||null}function s_(e,t,n=()=>new Worker("/assets/layout-worker.js",{type:"module"})){let i=sm(e,t);if(i)return{promise:Promise.resolve(i),cancel(){}};let s,a,r=!1;return{promise:new Promise((l,c)=>{a=c;let u=(d,h)=>{if(!r)if(r=!0,s?.terminate(),d)c(d);else{let p=im.get(e);p||(p=new Map,im.set(e,p)),p.size>=4&&p.delete(p.keys().next().value),p.set(`${t.width}:${t.height}`,h),l(h)}};try{s=n(),s.onmessage=({data:d})=>d.error?u(new Error(d.error)):u(null,d.layout),s.onerror=()=>u(new Error("Graph layout worker failed. Reload to retry.")),s.onmessageerror=()=>u(new Error("Graph layout response could not be read.")),s.postMessage({graph:e,viewport:t})}catch(d){u(d)}}),cancel(){r||(r=!0,s?.terminate(),a(new DOMException("Layout replaced by a newer graph","AbortError")))}}}function qu(e,t=1400,n=1e3){let[i,s]=(0,Wu.useState)(null);(0,Wu.useEffect)(()=>{let o=!0,l=s_(e,{width:t,height:n});return l.promise.then(c=>{o&&s({graph:e,width:t,height:n,layout:c,error:""})}).catch(c=>{o&&s({graph:e,width:t,height:n,layout:null,error:c.message})}),()=>{o=!1,l.cancel()}},[e,t,n]);let a=i?.graph===e&&i.width===t&&i.height===n?i:null,r=a?.layout||sm(e,{width:t,height:n});return{layout:r,pending:!r&&!a?.error,error:a?.error||""}}var ju=Kn(la(),1),ke=Kn(Ds(),1);function l_({catalogue:e,selectedId:t,error:n,onRefresh:i}){let[s,a]=(0,ju.useState)(""),r=(0,ju.useMemo)(()=>(e?.projects||[]).filter(l=>`${l.name} ${l.path}`.toLowerCase().includes(s.toLowerCase())),[e,s]),o=t||e?.default_project;return(0,ke.jsxs)("section",{className:"project-picker","aria-label":"Projects",children:[(0,ke.jsxs)("div",{className:"section-title",children:[(0,ke.jsx)("h2",{children:"Projects"}),(0,ke.jsx)("span",{children:e?.projects.length??"\u2026"}),(0,ke.jsx)("button",{className:"project-refresh",type:"button","aria-label":"Refresh projects",onClick:i,children:"\u21BB"})]}),(0,ke.jsx)("input",{className:"project-filter","aria-label":"Filter projects",placeholder:"Filter projects\u2026",value:s,onChange:l=>a(l.target.value)}),n?(0,ke.jsx)("p",{className:"error",role:"alert",children:n}):e?(0,ke.jsxs)(ke.Fragment,{children:[(0,ke.jsx)("div",{className:"project-list",children:r.map(l=>(0,ke.jsxs)("a",{className:`project-link${l.id===o?" is-active":""}`,href:`?project=${encodeURIComponent(l.id)}`,"aria-current":l.id===o?"page":void 0,title:l.path,children:[(0,ke.jsx)("span",{className:"project-icon","aria-hidden":"true",children:"\u25B1"}),(0,ke.jsxs)("span",{children:[(0,ke.jsx)("strong",{children:l.name}),(0,ke.jsx)("small",{children:l.path})]}),(0,ke.jsx)("span",{className:"project-state",children:l.id===o?"Open":l.indexed?"Indexed":"New"})]},l.id))}),!r.length&&(0,ke.jsx)("p",{className:"quiet",children:"No matching projects."}),e.truncated&&(0,ke.jsx)("p",{className:"quiet",children:"Project list is limited. Choose a narrower projects directory."}),e.warnings.map(l=>(0,ke.jsx)("p",{className:"error",children:l},l))]}):(0,ke.jsx)("p",{className:"quiet",children:"Loading projects\u2026"})]})}var Le=Kn(la(),1);var c_=(e,t,n)=>Math.max(t,Math.min(n,e));function u_(e,t){if(e.length===0)return[];let n=e.length===1?gw(e[0],t):e,i=n.reduce((r,o)=>({x:r.x+o.x/n.length,y:r.y+o.y/n.length}),{x:0,y:0}),s=42+t*10;if(n.length===2){let[r,o]=n,l=o.x-r.x,c=o.y-r.y,u=Math.max(1,Math.hypot(l,c)),d=l/u,h=c/u,p=-h,m=d,b=44+t*10,g=32+t*8;return[{x:r.x-d*g+p*b,y:r.y-h*g+m*b},{x:r.x-d*g-p*b,y:r.y-h*g-m*b},{x:o.x+d*g-p*b,y:o.y+h*g-m*b},{x:o.x+d*g+p*b,y:o.y+h*g+m*b}]}let a=n.map(r=>{let o=r.x-i.x,l=r.y-i.y,c=Math.max(1,Math.hypot(o,l)),u=o/c,d=l/c,h=s+c_(c*.18,10,28);return{x:r.x+u*h,y:r.y+d*h,angle:Math.atan2(l,o)}}).sort((r,o)=>r.angle-o.angle).map(({x:r,y:o})=>({x:r,y:o}));return vw(a)}function gw(e,t){let n=34+t*6,i=28+t*5;return Array.from({length:6},(s,a)=>{let r=-Math.PI/2+Math.PI*2*a/6;return{...e,x:e.x+Math.cos(r)*n,y:e.y+Math.sin(r)*i}})}function vw(e){if(e.length<=3)return e;let t=[...e].sort((a,r)=>a.x!==r.x?a.x-r.x:a.y-r.y),n=(a,r,o)=>(r.x-a.x)*(o.y-a.y)-(r.y-a.y)*(o.x-a.x),i=[];for(let a of t){for(;i.length>=2&&n(i[i.length-2],i[i.length-1],a)<=0;)i.pop();i.push(a)}let s=[];for(let a=t.length-1;a>=0;a-=1){let r=t[a];for(;s.length>=2&&n(s[s.length-2],s[s.length-1],r)<=0;)s.pop();s.push(r)}return i.pop(),s.pop(),[...i,...s]}function am(e,t,n){let i=c_(e.scale*n,.25,4);return{scale:i,x:t.x-(t.x-e.x)*i/e.scale,y:t.y-(t.y-e.y)*i/e.scale}}function rm(e,t){return t.some(n=>!(e.right<n.left||e.left>n.right||e.bottom<n.top||e.top>n.bottom))}function h_(e,t,n,i,s=new Set){let a=[],r=[],l=[...s.size?e.filter(c=>s.has(String(c.node_id))):e].sort((c,u)=>Number(s.has(String(u.node_id)))-Number(s.has(String(c.node_id)))||u.degree-c.degree||String(c.node_id).localeCompare(String(u.node_id)));for(let c of l){if(r.length>=(s.size?120:60))break;if(s.size&&!s.has(String(c.node_id)))continue;let u=c.x*t.scale+t.x,d=c.y*t.scale+t.y,h=c.symbol.length>35?`${c.symbol.slice(0,32)}\u2026`:c.symbol,p=h.length*7+12,m=c.radius*t.scale*.45+9,b=[{x:u+m,y:d-8},{x:u-m-p,y:d-8},{x:u-p/2,y:d-m-18},{x:u-p/2,y:d+m},{x:u+m,y:d+m},{x:u-m-p,y:d-m-18}];for(let g of b){let f={left:g.x,top:g.y,right:g.x+p,bottom:g.y+18};if(!(f.left<8||f.top<8||f.right>n-8||f.bottom>i-8||rm(f,a))){a.push(f),r.push({id:String(c.node_id),x:g.x+6,y:g.y+13,text:h});break}}}return r}var lm=["callers","entrypoints","callees","tests"],yw={callers:96,entrypoints:382,callees:668,tests:382};function Zu(e,t={}){let n=Math.max(820,Number(t.width)||980),i=Math.max(480,Number(t.height)||620),s=new Map,a=[...e.nodes||[]].sort((o,l)=>d_(o.lane)-d_(l.lane)||String(o.path).localeCompare(String(l.path))||Number(o.span?.start||0)-Number(l.span?.start||0)||om(o).localeCompare(om(l))).map(o=>{let l=lm.includes(o.lane)?o.lane:"entrypoints",c=s.get(l)||0;s.set(l,c+1);let u=l==="tests"?448+c*92:152+c*92,d=t.pins?.[om(o)];return{...o,lane:l,x:d?.x??yw[l],y:d?.y??u,pinned:!!d,width:216,height:64}}),r=_w(a);return{width:n,height:Math.max(i,xw(a)),nodes:a,containers:r}}function Ku(e){return e.status==="remove"?{className:"edge edge--remove",marker:"\xD7",dash:"6 6"}:e.status==="hypothetical"?{className:"edge edge--hypothetical",marker:"+",dash:"3 7"}:e.status==="gap"||e.confidence==="UNKNOWN"?{className:"edge edge--gap",marker:"?",dash:"9 7"}:e.status==="preserved"?{className:"edge edge--preserved",marker:"=",dash:""}:{className:"edge edge--proven",marker:"\u2713",dash:""}}function d_(e){let t=lm.indexOf(e);return t===-1?lm.length:t}function _w(e){let t=new Map;for(let n of e){let i=t.get(n.path)||[];i.push(n),t.set(n.path,i)}return[...t.entries()].sort(([n],[i])=>n.localeCompare(i)).map(([n,i])=>{let s=Math.min(...i.map(l=>l.x)),a=Math.max(...i.map(l=>l.x+l.width)),r=Math.min(...i.map(l=>l.y)),o=Math.max(...i.map(l=>l.y+l.height));return{id:`file:${n}`,path:n,x:s-18,y:r-32,width:a-s+36,height:o-r+50}})}function xw(e){return Math.max(480,...e.map(t=>t.y+t.height+48))}function om(e){return String(e.node_id??e.id??"")}var Xe=Kn(Ds(),1),bw={width:1400,height:1e3,nodes:[],communities:[]},f_=(0,Le.forwardRef)(function(t,n){let i=(0,Le.useRef)(null),s=(0,Le.useId)(),[a,r]=(0,Le.useState)({width:1280,height:800}),[o,l]=(0,Le.useState)({x:0,y:0,scale:1}),[c,u]=(0,Le.useState)(null),[d,h]=(0,Le.useState)({}),p=(0,Le.useRef)(null),m=(0,Le.useRef)(!1),{layout:b,pending:g,error:f}=qu(t.graph),v=b||bw,S=(0,Le.useMemo)(()=>({...v,nodes:v.nodes.map(A=>d[String(A.node_id)]?{...A,...d[String(A.node_id)],pinned:!0}:A)}),[v,d]),x=(0,Le.useMemo)(()=>new Map(S.nodes.map(A=>[String(A.node_id),A])),[S]),T=c||(t.selectedId==null?null:String(t.selectedId)),E=(0,Le.useMemo)(()=>{let A=new Set(T?[T]:[]);if(T)for(let L of t.graph.edges)String(L.source)===T&&A.add(String(L.target)),String(L.target)===T&&A.add(String(L.source));return A},[T,t.graph.edges]),w=(0,Le.useMemo)(()=>h_(S.nodes,o,a.width,a.height,E),[S,o,a,E]),y=(0,Le.useMemo)(()=>{let A=new Map;for(let L of S.nodes)A.has(L.community)||A.set(L.community,[]),A.get(L.community).push(L);return S.communities.map((L,F)=>{let W=A.get(L.id)||[],J=u_(W,.55);return{...L,index:F,color:W[0]?.color||"#7fa69e",path:J.map((Y,$)=>`${$?"L":"M"}${Y.x} ${Y.y}`).join(" ")+"Z"}})},[S]),C=(A=v.nodes)=>{if(!A.length)return{x:0,y:0,scale:1};let L=A.map(wt=>wt.x),F=A.map(wt=>wt.y),W=Math.min(...L),J=Math.max(...L),Y=Math.min(...F),$=Math.max(...F),at=Math.max(240,a.width-(a.width>800?440:80)),Tt=Math.max(.25,Math.min(2.5,at/(J-W+200),(a.height-180)/($-Y+120)));return{x:a.width*(a.width>800?.6:.5)-(W+J)/2*Tt,y:a.height*.51-(Y+$)/2*Tt,scale:Tt}};(0,Le.useEffect)(()=>{let A=i.current;if(!A)return;let L=new ResizeObserver(()=>{let F=A.getBoundingClientRect();r({width:Math.max(1,F.width),height:Math.max(1,F.height)})});return L.observe(A),()=>L.disconnect()},[]);let D=`${t.graph.level||"packages"}:${t.graph.root.path}:${t.graph.root.symbol}:${t.graph.snapshot.repo_revision}:${t.graph.snapshot.graph_generation}:${t.graph.snapshot.working_tree_digest}`;(0,Le.useEffect)(()=>{h({}),u(null)},[D]),(0,Le.useEffect)(()=>{l(C())},[a.width,a.height,D,v]),(0,Le.useEffect)(()=>{let A=i.current;if(!A)return;let L=F=>{F.preventDefault();let W=A.getBoundingClientRect(),J={x:F.clientX-W.left,y:F.clientY-W.top};l(Y=>am(Y,J,Math.exp(-Math.max(-120,Math.min(120,F.deltaY))*.002)))};return A.addEventListener("wheel",L,{passive:!1}),()=>A.removeEventListener("wheel",L)},[]),(0,Le.useImperativeHandle)(n,()=>({zoom:A=>l(L=>am(L,{x:a.width/2,y:a.height/2},A)),resetView:()=>{h({}),l(C())},focusNode:A=>{let L=x.get(String(A));L&&l(F=>{let W=L.x*F.scale+F.x,J=L.y*F.scale+F.y;return W>90&&W<a.width-40&&J>120&&J<a.height-60?F:{...F,x:a.width*.55-L.x*F.scale,y:a.height*.5-L.y*F.scale}})}}));let z=(A,L)=>{A.button===0&&(A.stopPropagation(),p.current={x:A.clientX,y:A.clientY,camera:o,node:L,moved:!1},m.current=!1,A.currentTarget.setPointerCapture(A.pointerId))},X=A=>{let L=p.current;if(!L)return;let F=A.clientX-L.x,W=A.clientY-L.y;if(Math.hypot(F,W)>4&&(L.moved=!0,m.current=!0),!!L.moved)if(L.node){let J=L.node;h(Y=>({...Y,[String(J.node_id)]:{x:J.x+F/L.camera.scale,y:J.y+W/L.camera.scale}}))}else l({...L.camera,x:L.camera.x+F,y:L.camera.y+W})},H=A=>{let L=p.current;p.current=null;let F=A.target;F.hasPointerCapture(A.pointerId)&&F.releasePointerCapture(A.pointerId),A.type==="pointerup"&&L?.node&&!L.moved&&t.onNodeSelect(L.node)};return(0,Xe.jsxs)("svg",{ref:i,className:"project-canvas",viewBox:`0 0 ${a.width} ${a.height}`,"aria-label":"Repository dependency graph","aria-busy":g,role:"group",onPointerDown:A=>z(A),onPointerMove:X,onPointerUp:H,onPointerCancel:H,onLostPointerCapture:()=>{p.current=null},children:[(g||f)&&(0,Xe.jsx)("text",{x:a.width/2,y:a.height/2,textAnchor:"middle",fill:"#a9b8b0",role:"status",children:f||"Arranging repository graph\u2026"}),(0,Xe.jsx)("defs",{children:y.map(A=>(0,Xe.jsxs)("radialGradient",{id:`${s}-zone-${A.index}`,children:[(0,Xe.jsx)("stop",{offset:"0",stopColor:A.color,stopOpacity:".2"}),(0,Xe.jsx)("stop",{offset:".6",stopColor:A.color,stopOpacity:".08"}),(0,Xe.jsx)("stop",{offset:"1",stopColor:A.color,stopOpacity:"0"})]},A.id))}),(0,Xe.jsxs)("g",{transform:`translate(${o.x} ${o.y}) scale(${o.scale})`,children:[(0,Xe.jsx)("g",{className:"map-zones","aria-hidden":"true",children:y.map(A=>(0,Xe.jsx)("path",{d:A.path,fill:`url(#${s}-zone-${A.index})`},A.id))}),t.graph.edges.map((A,L)=>{let F=x.get(String(A.source)),W=x.get(String(A.target));if(!F||!W)return null;let J=T===String(A.source)||T===String(A.target),Y=W.x-F.x,$=W.y-F.y,at=F===W?`M${F.x} ${F.y} c-30 -40 30 -40 0 0`:`M${F.x} ${F.y} Q${(F.x+W.x)/2-$*.1} ${(F.y+W.y)/2+Y*.1} ${W.x} ${W.y}`,Tt=Ku(A),wt=()=>t.onEdgeSelect(A,F,W);return(0,Xe.jsxs)("g",{role:"button",tabIndex:0,"aria-label":`${F.symbol} ${A.relation} ${W.symbol}, ${A.confidence||"unknown confidence"}`,className:`map-edge ${J?"is-lit":""}`,opacity:T&&!J?.06:J?.95:.28,onPointerDown:ae=>{ae.stopPropagation(),m.current=!1},onClick:()=>{m.current||wt()},onKeyDown:ae=>{(ae.key==="Enter"||ae.key===" ")&&(ae.preventDefault(),wt())},children:[(0,Xe.jsx)("path",{d:at,className:"map-edge-hit"}),(0,Xe.jsx)("path",{d:at,className:Tt.className,strokeDasharray:Tt.dash})]},`${A.source}:${A.target}:${L}`)}),S.nodes.map(A=>{let L=String(A.node_id),F=String(t.selectedId)===L,W=!T||E.has(L),J=t.graph.level?Math.max(1.6,A.radius*.32):Math.max(3.5,A.radius*.45);return(0,Xe.jsxs)("g",{className:`map-node${F?" is-selected":""}`,role:"button",tabIndex:0,"aria-label":`${A.symbol}, ${A.symbols} symbols${A.cycle?", cycle candidate":""}`,transform:`translate(${A.x} ${A.y})`,opacity:W?1:.14,onPointerDown:Y=>z(Y,A),onDoubleClick:()=>t.onNodeOpen(A),onPointerEnter:()=>{p.current||u(L)},onPointerLeave:()=>u(null),onFocus:()=>u(L),onBlur:()=>u(null),onKeyDown:Y=>{(Y.key==="Enter"||Y.key===" ")&&(Y.preventDefault(),t.onNodeSelect(A))},children:[(0,Xe.jsxs)("title",{children:[A.symbol," \xB7 ",A.symbols," symbols \xB7 ",A.files," files"]}),(0,Xe.jsx)("circle",{r:t.graph.level?J+3:Math.max(12,J+6),fill:"transparent"}),(0,Xe.jsx)("circle",{className:"map-node-halo",r:J+6,fill:"none",stroke:A.color,opacity:F?.8:.12}),(0,Xe.jsx)("circle",{className:"map-node-dot",r:J,fill:F||E.has(L)?"#f4f6f5":"#9ca8a5"}),A.cycle&&(0,Xe.jsx)("circle",{r:J+3,fill:"none",stroke:"#eac16b",strokeDasharray:"3 3"})]},L)})]}),(0,Xe.jsx)("g",{className:"map-labels","aria-hidden":"true",children:w.map(A=>(0,Xe.jsx)("text",{x:A.x,y:A.y,className:A.id===String(t.selectedId)?"is-selected":"",children:A.text},A.id))})]})});var NI=Kn(la(),1),Bt=Kn(Ds(),1),p_={project:(0,Bt.jsxs)(Bt.Fragment,{children:[(0,Bt.jsx)("circle",{cx:"6",cy:"6",r:"2"}),(0,Bt.jsx)("circle",{cx:"18",cy:"8",r:"2"}),(0,Bt.jsx)("circle",{cx:"10",cy:"18",r:"2"}),(0,Bt.jsx)("path",{d:"m8 6 8 2M7 8l2 8m3 1 5-7"})]}),current:(0,Bt.jsx)(Bt.Fragment,{children:(0,Bt.jsx)("path",{d:"m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 18"})}),architecture:(0,Bt.jsxs)(Bt.Fragment,{children:[(0,Bt.jsx)("rect",{x:"3",y:"3",width:"7",height:"7",rx:"1.5"}),(0,Bt.jsx)("rect",{x:"14",y:"3",width:"7",height:"7",rx:"1.5"}),(0,Bt.jsx)("rect",{x:"3",y:"14",width:"7",height:"7",rx:"1.5"}),(0,Bt.jsx)("rect",{x:"14",y:"14",width:"7",height:"7",rx:"1.5"})]}),changes:(0,Bt.jsxs)(Bt.Fragment,{children:[(0,Bt.jsx)("path",{d:"M6 3v18m12-18v18M3 8h6m6 8h6"}),(0,Bt.jsx)("circle",{cx:"6",cy:"8",r:"2"}),(0,Bt.jsx)("circle",{cx:"18",cy:"16",r:"2"})]}),preview:(0,Bt.jsxs)(Bt.Fragment,{children:[(0,Bt.jsx)("path",{d:"M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7Z"}),(0,Bt.jsx)("circle",{cx:"12",cy:"12",r:"3"})]}),compare:(0,Bt.jsxs)(Bt.Fragment,{children:[(0,Bt.jsx)("rect",{x:"3",y:"4",width:"18",height:"16",rx:"2"}),(0,Bt.jsx)("path",{d:"M12 4v16M6 12h3m6 0h3"})]}),history:(0,Bt.jsx)(Bt.Fragment,{children:(0,Bt.jsx)("path",{d:"M4 9a8 8 0 1 1 0 7M4 3v6h6m2-2v5l3 2"})}),search:(0,Bt.jsxs)(Bt.Fragment,{children:[(0,Bt.jsx)("circle",{cx:"10",cy:"10",r:"6"}),(0,Bt.jsx)("path",{d:"m15 15 6 6"})]})};function m_({mode:e,modes:t,onMode:n,discoveryOpen:i,onDiscovery:s}){return(0,Bt.jsxs)("nav",{className:"workspace-dock","aria-label":"Graph mode",children:[(0,Bt.jsx)("span",{className:"dock-brand","aria-label":"CGRX",children:"cx"}),(0,Bt.jsx)("button",{className:"dock-button",title:"Search and explore","aria-label":"Search and explore","aria-expanded":i,"aria-controls":"discovery-panel",onClick:s,children:(0,Bt.jsx)("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:p_.search})}),(0,Bt.jsx)("span",{className:"dock-divider"}),t.map(a=>(0,Bt.jsxs)("button",{className:`dock-button${e===a.id?" is-active":""}`,title:a.label,"aria-label":a.label,"aria-pressed":e===a.id,onClick:()=>n(a.id),children:[(0,Bt.jsx)("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:p_[a.id]}),(0,Bt.jsx)("span",{className:"dock-tooltip",children:a.label})]},a.id))]})}function Ju({title:e,detail:t,onClose:n}){return(0,Bt.jsxs)("div",{className:"panel-heading",children:[(0,Bt.jsxs)("div",{children:[(0,Bt.jsx)("h2",{children:e}),t&&(0,Bt.jsx)("span",{children:t})]}),(0,Bt.jsx)("button",{className:"panel-close",onClick:n,"aria-label":`Close ${e}`,title:`Close ${e}`,children:"\xD7"})]})}var VT=Kn(S1(),1);function M1(e,t){let n=new Set(e.map(s=>s.lane)),i=0;for(;n.has(i)||t.has(i);)i+=1;return i}function E1(e,t={}){let n=t.previous?.rowOffset??0,i=(t.previous?.lanes??[]).map(c=>({...c})),s=t.previous?.nextColour??0,a=[],r=[],o=i.reduce((c,u)=>Math.max(c,u.lane),-1);for(let c=0;c<e.length;c+=1){let u=e[c],d=n+c,h=i.filter(f=>f.target===u.oid).sort((f,v)=>f.lane-v.lane),p=new Set,m=h[0]??{lane:M1(i,p),target:u.oid,colour:s++};o=Math.max(o,m.lane),a.push({oid:u.oid,lane:m.lane,row:d,colour:m.colour,kind:u.kind});for(let f of i)f.target!==u.oid&&(r.push({from:{lane:f.lane,row:f.fromRow},to:{lane:f.lane,row:d},colour:f.colour}),f.fromRow=d);for(let f of h)r.push({from:{lane:f.lane,row:f.fromRow},to:{lane:m.lane,row:d},colour:f.colour,anchor:"to"});for(let f=i.length-1;f>=0;f-=1)i[f].target===u.oid&&i.splice(f,1);let b=u.parents.filter(Boolean),g=b[0];g&&(i.push({lane:m.lane,target:g,colour:m.colour,fromRow:d}),p.add(m.lane));for(let f of b.slice(1)){let v=i.find(T=>T.target===f);if(v){r.push({from:{lane:m.lane,row:d},to:{lane:v.lane,row:d+1},colour:v.colour,anchor:"from"});continue}let S=M1(i,p);p.add(S),o=Math.max(o,S);let x=s++;i.push({lane:S,target:f,colour:x,fromRow:d+1}),r.push({from:{lane:m.lane,row:d},to:{lane:S,row:d+1},colour:x,anchor:"from"})}}let l=n+e.length;for(let c of i)c.fromRow<l&&(r.push({from:{lane:c.lane,row:c.fromRow},to:{lane:c.lane,row:l},colour:c.colour,dangling:!0}),c.fromRow=l);return{nodes:a,segments:r,state:{lanes:i.map(c=>({...c})),nextColour:s,rowOffset:l},laneCount:Math.max(1,o+1)}}var RR="web-git-graph",$o=["#e3008c","#007acc","#00c853","#ff8c00","#b180d7","#00b7c3","#dcdcaa"],NR=new Set(["current","head"]),T1=typeof navigator<"u"&&/mac|iphone|ipad|ipod/i.test(navigator.userAgent??""),DR=[78,54,88,41,69,82,47,61],Bd=[64,88,45,73,52],LR=`
:host {
  /* Prefer VS Code / host theme tokens when present (they inherit into the
     shadow tree), then fall back to a neutral dark palette for standalone use. */
  --wgg-bg: var(--vscode-editor-background, #1e1e1e);
  --wgg-panel: var(--vscode-sideBar-background, var(--vscode-editorWidget-background, var(--vscode-editor-background, #252526)));
  --wgg-panel-raised: var(--vscode-editorWidget-background, var(--vscode-sideBar-background, #2d2d30));
  --wgg-ink: var(--vscode-foreground, var(--vscode-editor-foreground, #d4d4d4));
  --wgg-muted: var(--vscode-descriptionForeground, #a9a9a9);
  --wgg-faint: var(--vscode-disabledForeground, #777);
  --wgg-line: var(--vscode-panel-border, var(--vscode-widget-border, #3c3c3c));
  --wgg-hover: var(--vscode-list-hoverBackground, #2a2d2e);
  --wgg-selected: var(--vscode-list-inactiveSelectionBackground, var(--vscode-editor-inactiveSelectionBackground, #37373d));
  --wgg-accent: var(--vscode-focusBorder, #3794ff);
  --wgg-warning: var(--vscode-editorWarning-foreground, #cca700);
  --wgg-row-height: 24px;
  --wgg-graph-width: 72px;
  --wgg-date-width: 142px;
  --wgg-author-width: 150px;
  --wgg-commit-width: 82px;
  display: block;
  min-height: 420px;
  color: var(--wgg-ink);
  font-family: var(--wgg-font, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  background: var(--wgg-bg);
  border: 1px solid var(--wgg-line);
  overflow: hidden;
  color-scheme: dark;
  container-type: inline-size;
  container-name: wgg;
}
:host([theme="light"]) {
  --wgg-bg: var(--vscode-editor-background, #ffffff);
  --wgg-panel: var(--vscode-sideBar-background, var(--vscode-editorWidget-background, var(--vscode-editor-background, #f3f3f3)));
  --wgg-panel-raised: var(--vscode-editorWidget-background, var(--vscode-sideBar-background, #f8f8f8));
  --wgg-ink: var(--vscode-foreground, var(--vscode-editor-foreground, #333333));
  --wgg-muted: var(--vscode-descriptionForeground, #616161);
  --wgg-faint: var(--vscode-disabledForeground, #8e8e8e);
  --wgg-line: var(--vscode-panel-border, var(--vscode-widget-border, #d4d4d4));
  --wgg-hover: var(--vscode-list-hoverBackground, #f0f0f0);
  --wgg-selected: var(--vscode-list-inactiveSelectionBackground, var(--vscode-editor-inactiveSelectionBackground, #e4e6f1));
  --wgg-accent: var(--vscode-focusBorder, #3794ff);
  --wgg-warning: var(--vscode-editorWarning-foreground, #cca700);
  color-scheme: light;
}
:host([hosted]) .theme-toggle { display: none; }
:host([density="compact"]) { --wgg-row-height: 20px; }
* { box-sizing: border-box; }
button, input, select { font: inherit; color: inherit; }
button { cursor: pointer; }
.shell { position: relative; min-height: inherit; height: 100%; display: grid; grid-template-rows: auto minmax(0, 1fr); }
.toolbar {
  min-height: 42px;
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 6px 10px;
  background: var(--wgg-panel);
  border-bottom: 1px solid var(--wgg-line);
  font-size: 12px;
}
.branch-control, .remote-control { display: flex; align-items: center; gap: 7px; white-space: nowrap; }
.branch-control strong, .remote-control { font-weight: 600; }
.remote-control input { margin: 0; accent-color: var(--wgg-accent); }
.ref-select {
  height: 28px; max-width: min(250px, 40cqw); display: flex; align-items: center; gap: 6px;
  border: 1px solid var(--wgg-line); background: var(--wgg-bg); border-radius: 2px; padding: 3px 7px;
}
.ref-select:hover { background: var(--wgg-hover); }
.ref-select-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.caret { flex: none; color: var(--wgg-muted); font-size: 9px; }
.repository-name {
  min-width: 0; flex: 1; color: var(--wgg-muted); overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; text-align: center;
}
.search {
  width: min(240px, 40cqw); height: 28px; border: 1px solid var(--wgg-line); background: var(--wgg-bg);
  border-radius: 2px; padding: 4px 7px; outline: none; font-size: 12px;
}
.search:focus, select:focus, button:focus-visible { outline: 1px solid var(--wgg-accent); outline-offset: -1px; }
.tools { display: flex; align-items: center; gap: 4px; margin-left: auto; }
.find { display: flex; align-items: center; gap: 2px; }
.search-count {
  min-width: 44px; padding: 0 3px; text-align: center; color: var(--wgg-muted);
  font-variant-numeric: tabular-nums; white-space: nowrap;
}
.icon-button:disabled { color: var(--wgg-faint); background: transparent; cursor: default; }
select, .icon-button {
  height: 28px; border: 1px solid var(--wgg-line); background: var(--wgg-bg);
  border-radius: 2px; padding: 3px 7px;
}
.icon-button { min-width: 28px; color: var(--wgg-muted); background: transparent; border-color: transparent; }
.icon-button:hover { color: var(--wgg-ink); background: var(--wgg-hover); }
.body {
  min-height: 0; position: relative;
}
.history { min-width: 0; height: 100%; display: grid; grid-template-rows: 34px minmax(0, 1fr); }
.header, .row {
  display: grid;
  /* Description may shrink to zero so the graph column keeps its reserved
     width; the commit message ellipsises before branch chips are clipped. */
  grid-template-columns:
    var(--wgg-graph-width) minmax(0, 1fr) var(--wgg-date-width)
    var(--wgg-author-width) var(--wgg-commit-width);
  align-items: center;
}
.header {
  padding-right: 10px; background: var(--wgg-bg); color: var(--wgg-ink);
  border-bottom: 1px solid var(--wgg-line); font-size: 12px; font-weight: 600;
}
.header > span {
  height: 100%; display: flex; align-items: center; justify-content: center;
  padding: 0 8px; border-right: 1px solid var(--wgg-line);
}
.scroller { position: relative; overflow: auto; min-height: 0; outline: none; scrollbar-color: var(--wgg-faint) transparent; }
.spacer { position: relative; min-width: max(100%, calc(var(--wgg-graph-width) + 280px + var(--wgg-date-width) + var(--wgg-author-width) + var(--wgg-commit-width))); }
.window { position: absolute; inset: 0 0 auto 0; min-height: 100%; }
.row {
  height: var(--wgg-row-height); padding-right: 10px;
  border-bottom: 1px solid color-mix(in srgb, var(--wgg-line) 30%, transparent);
  position: absolute; left: 0; right: 0; cursor: default; font-size: 12px;
}
.row:hover, .row.preview, .row.context-active { background: var(--wgg-hover); }
.row.match { background: color-mix(in srgb, var(--wgg-warning) 16%, transparent); }
.row.match-current { box-shadow: inset 0 0 0 1px var(--wgg-warning); }
.row.selected { background: var(--wgg-selected); }
.row.compare { box-shadow: inset 2px 0 var(--wgg-warning); }
.row.merge .message { color: var(--wgg-muted); }
.row.working-tree .message { font-weight: 600; }
.row:focus { outline: 1px solid var(--wgg-accent); outline-offset: -1px; }
.graph-cell { height: 100%; position: relative; overflow: hidden; }
.subject {
  min-width: 0; display: flex; align-items: center; gap: 5px; padding: 0 4px;
  overflow: hidden; position: relative; z-index: 2;
}
.message { min-width: 0; flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
/* Branch chips never ellipsis \u2014 same behaviour as vscode-git-graph's .gitRef. */
.refs { flex: 0 0 auto; display: flex; gap: 2px; }
.ref {
  flex: 0 0 auto; white-space: nowrap;
  font: 600 10px/15px var(--wgg-font, inherit); padding: 0 5px; border-radius: 2px;
  border: 1px solid var(--ref-color, var(--wgg-accent));
  background: color-mix(in srgb, var(--ref-color, var(--wgg-accent)) 18%, transparent);
  color: var(--wgg-ink);
}
/* Only the checked-out branch is solid, so "you are here" reads at a glance
   while every other branch is emphasised by its lane-coloured border. */
.ref.current { background: var(--ref-color, var(--wgg-accent)); color: #fff; }
/* Remote branches recede by colour rather than by line style: a grey outline
   with no tint, so they read as "not here" without a busy dashed border. */
.ref.remote {
  /* --wgg-faint rather than --wgg-line: the border has to stay legible against
     both the dark and the light background. */
  border-color: var(--wgg-faint);
  background: transparent;
  color: var(--wgg-muted);
  font-weight: 400;
}
.ref.tag, .ref.stash { background: var(--ref-color); color: #fff; }
.ref.tag { --ref-color: #0e639c; }
.ref.stash { --ref-color: #9b2f86; }
.author, .date, .oid {
  min-width: 0; padding: 0 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  color: var(--wgg-ink); position: relative; z-index: 2;
}
.date, .author { text-align: center; }
.author { display: flex; align-items: center; justify-content: center; gap: 5px; }
.author-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.avatar {
  position: relative; flex: none; width: 16px; height: 16px; border-radius: 50%; overflow: hidden;
  display: grid; place-items: center; font: 600 9px/1 var(--wgg-font, inherit); color: #fff;
  background: var(--avatar-color, var(--wgg-faint));
}
.avatar img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.shell[data-hide-date] { --wgg-date-width: 0px; }
.shell[data-hide-author] { --wgg-author-width: 0px; }
.shell[data-hide-commit] { --wgg-commit-width: 0px; }
.shell[data-hide-date] .col-date, .shell[data-hide-date] .date,
.shell[data-hide-author] .col-author, .shell[data-hide-author] .author,
.shell[data-hide-commit] .col-commit, .shell[data-hide-commit] .oid {
  padding: 0; border-right: 0; visibility: hidden;
}
.menu {
  position: absolute; z-index: 20; min-width: 190px; max-width: min(320px, 90%); padding: 4px;
  background: var(--wgg-panel-raised); border: 1px solid var(--wgg-line); border-radius: 4px;
  box-shadow: 0 4px 14px rgb(0 0 0 / 32%); font-size: 12px;
}
.menu-scroll { max-height: min(340px, 55vh); overflow: auto; scrollbar-color: var(--wgg-faint) transparent; }
.menu-item {
  width: 100%; display: flex; align-items: center; gap: 8px; padding: 4px 8px;
  border: 0; border-radius: 2px; background: transparent; text-align: left; white-space: nowrap;
}
.menu-item:hover:not(:disabled) { background: var(--wgg-hover); }
.menu-item:disabled { color: var(--wgg-faint); cursor: default; }
.menu-label { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.menu-check { flex: none; width: 12px; text-align: center; color: var(--wgg-accent); }
.menu-group {
  padding: 6px 8px 2px; color: var(--wgg-muted); font-size: 10px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.menu-separator { height: 1px; margin: 4px 2px; background: var(--wgg-line); }
.oid { font-family: var(--wgg-mono, ui-monospace, SFMono-Regular, Consolas, monospace); font-size: 11px; text-align: center; }
.graph {
  /* Clip to the graph column so strokes never paint over description text, and
     paint above the expanded details panel so lanes cross it unbroken \u2014 the
     same layering vscode-git-graph uses for #commitGraph over #cdv. */
  position: absolute; left: 0; z-index: 4; pointer-events: none;
  width: var(--wgg-graph-width); overflow: hidden;
}
.graph path { fill: none; stroke-width: 2; vector-effect: non-scaling-stroke; }
.graph circle { stroke-width: 1.5; vector-effect: non-scaling-stroke; }
.inline-details {
  position: absolute; left: 0; right: 0; z-index: 3;
  display: flex; overflow: hidden;
  padding-left: var(--wgg-graph-width);
  background: var(--wgg-panel);
  border-top: 1px solid var(--wgg-line); border-bottom: 1px solid var(--wgg-line);
  font-size: 12px;
  animation: details-open 120ms ease-out;
}
.details-summary { flex: 1 1 55%; min-width: 0; overflow: auto; padding: 8px 12px 12px; }
.details-files {
  flex: 1 1 45%; min-width: 0; overflow: auto; padding: 5px 26px 8px 8px;
  border-left: 1px solid var(--wgg-line);
}
.details-close {
  position: absolute; top: 3px; right: 5px; z-index: 1;
  width: 22px; height: 22px; padding: 0; border: 0; border-radius: 2px;
  background: transparent; color: var(--wgg-muted); font-size: 14px; line-height: 1;
}
.details-close:hover { background: var(--wgg-hover); color: var(--wgg-ink); }
.details-heading { margin: 0 0 6px; font-size: 12px; font-weight: 600; }
.meta { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 2px 10px; margin: 0; }
.meta dt { color: var(--wgg-muted); font-weight: 600; }
.meta dd { margin: 0; overflow-wrap: anywhere; }
.meta .oid-value { font-family: var(--wgg-mono, ui-monospace, SFMono-Regular, Consolas, monospace); font-size: 11px; }
.commit-body { margin: 10px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.45; }
.actions { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 12px; }
.action {
  border: 1px solid var(--wgg-line); border-radius: 2px; background: var(--wgg-panel-raised);
  padding: 3px 8px; font-size: 11px;
}
.action.primary { border-color: var(--wgg-accent); background: #0e639c; color: #fff; }
.tree, .tree ul { margin: 0; padding: 0; list-style: none; }
.tree ul { padding-left: 14px; }
.tree-dir, .tree-file {
  width: 100%; display: flex; align-items: center; gap: 6px; padding: 1px 4px;
  border: 0; border-radius: 0; background: transparent; text-align: left;
  font-size: 11px; white-space: nowrap;
}
.tree-dir:hover, .tree-file:hover { background: var(--wgg-hover); }
.tree-file.active { background: var(--wgg-selected); }
.twistie { flex: none; width: 10px; color: var(--wgg-muted); font-size: 9px; }
.dir-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; color: var(--wgg-muted); }
.change-code { flex: none; width: 12px; text-align: center; font: 11px var(--wgg-mono, ui-monospace, monospace); color: var(--wgg-muted); }
.change-code.add { color: #81b88b; }
.change-code.modify { color: #e2c08d; }
.change-code.delete { color: #f14c4c; }
.change-code.rename, .change-code.copy { color: #6cb8e6; }
.change-path { min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis; }
.stats { flex: none; font: 10px var(--wgg-mono, ui-monospace, monospace); color: var(--wgg-muted); }
.no-changes { margin: 6px 4px; color: var(--wgg-faint); font-size: 11px; }
.patch {
  margin: 10px 0 0; padding: 10px; overflow: auto; border: 1px solid var(--wgg-line);
  background: var(--wgg-bg); font: 10px/1.55 var(--wgg-mono, ui-monospace, monospace); white-space: pre; tab-size: 2;
}
.empty, .loading, .error { display: grid; place-items: center; min-height: 220px; color: var(--wgg-muted); text-align: center; padding: 30px; }
.error { color: #ff8585; }
/* Waiting states breathe rather than blink: a slow opacity swell on the whole
   surface plus a sheen travelling along each placeholder bar. Both are pure
   compositor work, so they stay smooth while Git is being read. */
@keyframes wgg-breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
@keyframes wgg-sheen { from { background-position: 180% 0; } to { background-position: -80% 0; } }
.pending { position: relative; animation: wgg-breathe 2.6s ease-in-out infinite; }
.pending-bar {
  height: 8px; border-radius: 4px;
  background: linear-gradient(
    100deg,
    color-mix(in srgb, var(--wgg-line) 55%, transparent) 18%,
    color-mix(in srgb, var(--wgg-muted) 40%, transparent) 42%,
    color-mix(in srgb, var(--wgg-line) 55%, transparent) 66%
  );
  background-size: 260% 100%;
  animation: wgg-sheen 2.2s linear infinite;
}
.pending-dot {
  justify-self: start; margin-left: 11.5px;
  width: 9px; height: 9px; border-radius: 50%;
  background: color-mix(in srgb, var(--wgg-muted) 45%, transparent);
}
/* Laid out on the row grid, so the placeholder occupies exactly the space the
   history is about to take: the first paint settles instead of jumping. */
.pending-rows { position: relative; display: grid; align-content: start; }
.pending-rows::before {
  content: ""; position: absolute; left: 15.5px; top: 12px; bottom: 12px; width: 1px;
  background: color-mix(in srgb, var(--wgg-muted) 30%, transparent);
}
.pending-row {
  display: grid; grid-template-columns: var(--wgg-graph-width) minmax(0, 1fr);
  align-items: center; height: var(--wgg-row-height); padding-right: 10px;
}
.pending-label { color: var(--wgg-muted); font-size: 12px; text-align: center; }
.loading-view { position: relative; min-height: 220px; height: 100%; overflow: hidden; }
/* A soft wash breathing over the whole surface, so the wait reads as one
   living panel rather than eight bars ticking on their own. */
.loading-view::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(
    62% 58% at 42% 34%,
    color-mix(in srgb, var(--wgg-accent) 12%, transparent),
    transparent 72%
  );
  animation: wgg-breathe 3.6s ease-in-out infinite;
}
.loading-view .pending-label { position: relative; padding: 22px 20px 0; }
.details-pending { display: grid; gap: 11px; padding: 8px 2px 0; }
.details-pending .pending-bar { height: 7px; }
@media (prefers-reduced-motion: reduce) {
  .pending, .pending-bar, .loading-view::after { animation: none; }
  .pending { opacity: 0.7; }
}
.load-more { position: absolute; left: 50%; display: block; margin: 8px 0; transform: translateX(-50%); }
@keyframes details-open {
  from { opacity: 0; }
  to { opacity: 1; }
}
/* Use the host width \u2014 not the IDE window \u2014 so a narrow webview/side panel
   collapses columns the same way a narrow browser window would. */
@container wgg (max-width: 760px) {
  .toolbar { gap: 8px; }
  .remote-control, .repository-name, .find { display: none; }
  .branch-control { flex: 1; min-width: 0; }
  .ref-select { flex: 1; max-width: none; }
  .header, .row {
    grid-template-columns: var(--wgg-graph-width) minmax(0, 1fr) var(--wgg-commit-width);
  }
  .spacer {
    min-width: max(100%, calc(var(--wgg-graph-width) + 160px + var(--wgg-commit-width)));
  }
  .col-date, .col-author, .date, .author { display: none; }
  .inline-details { flex-direction: column; padding-left: 12px; }
  .details-files { border-left: 0; border-top: 1px solid var(--wgg-line); }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition-duration: 0.001ms !important; animation-duration: 0.001ms !important; }
}
`;function zd(e){return e.kind==="working-tree"?{kind:"working-tree"}:e.kind==="stash"?{kind:"stash",oid:e.oid}:{kind:"commit",oid:e.oid}}function av(e){return e.startsWith("__")?e.replaceAll("_",""):e.slice(0,8)}function rv(e){return e.replace(/^refs\/(heads|tags|remotes)\//,"")}var UR=[["year",31536e6],["month",2592e6],["week",6048e5],["day",864e5],["hour",36e5],["minute",6e4]];function Fd(e){return String(e).padStart(2,"0")}function w1(e,t="datetime"){if(!e)return"\u2014";let n=new Date(e);if(Number.isNaN(n.valueOf()))return e;if(t==="relative"){let s=n.valueOf()-Date.now(),a=new Intl.RelativeTimeFormat(void 0,{numeric:"auto"});for(let[r,o]of UR)if(Math.abs(s)>=o)return a.format(Math.round(s/o),r);return a.format(Math.round(s/1e3),"second")}let i=`${n.getFullYear()}/${Fd(n.getMonth()+1)}/${Fd(n.getDate())}`;return t==="date"?i:`${i} ${Fd(n.getHours())}:${Fd(n.getMinutes())}`}var ov=new Map,lv=new Set;function IR(e){let t=0;for(let n=0;n<e.length;n+=1)t=(t*31+e.charCodeAt(n))%360;return`hsl(${t} 44% 40%)`}async function PR(e){if(typeof crypto>"u"||!crypto.subtle)return;let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return`https://www.gravatar.com/avatar/${[...new Uint8Array(t)].map(i=>i.toString(16).padStart(2,"0")).join("")}?s=48&d=404`}function OR(e){let t={dirs:new Map,files:[]};for(let n of e){let i=n.path.split("/"),s=t;for(let a of i.slice(0,-1)){let r=s.dirs.get(a);r||(r={dirs:new Map,files:[]},s.dirs.set(a,r)),s=r}s.files.push(n)}return t}function cv(e){return e.split("/").pop()??e}function Gd(e){let t=document.createElement("div");return t.className="pending details-pending",t.setAttribute("aria-hidden","true"),t.innerHTML=e.map(n=>`<span class="pending-bar" style="width:${n}%"></span>`).join(""),t}function uv(e,t){let n=document.createElementNS("http://www.w3.org/2000/svg",e);for(let[i,s]of Object.entries(t))n.setAttribute(i,s);return n}var BR=typeof HTMLElement>"u"?class{}:HTMLElement,A1=class extends BR{static observedAttributes=["theme","density","columns","date-format","date-type","avatars"];#s;#t={commits:[],refs:[],hasMore:!1};#x=E1([]);#b="";#u=[];#d=-1;#h=[];#D;#L;#U;#T;#n;#f;#r;#p;#o;#m=new Set;#w;#S;#g=!1;#I=!1;#M=!1;#E;#P;#a=24;#V=8;#O=240;#A=!0;#e;addEventListener(e,t,n){super.addEventListener(e,t,n)}removeEventListener(e,t,n){super.removeEventListener(e,t,n)}ongitgraphcommitsselect=null;ongitgraphcommitsopen=null;ongitgraphcompare=null;ongitgraphfileopen=null;ongitgraphloadmore=null;ongitgrapherror=null;ongitgraphrefresh=null;ongitgraphcontextmenu=null;constructor(){super(),this.#e=this.attachShadow({mode:"open"}),this.#e.innerHTML=`<style>${LR}</style><div class="shell"></div>`}connectedCallback(){this.#X(),this.#s&&this.#t.commits.length===0&&this.#_(!1)}disconnectedCallback(){this.#l()}attributeChangedCallback(){this.#a=this.getAttribute("density")==="compact"?20:24,this.#W(),this.#Z(),this.#i()}get provider(){return this.#s}set provider(e){this.#s=e,e&&(this.#h=[],this.#t={...this.#t,repositoryId:void 0,repositoryName:void 0,cursor:void 0,hasMore:!1},this.isConnected&&this.#_(!1))}get data(){return this.#t}set data(e){this.setData(e)}get theme(){return this.getAttribute("theme")??"dark"}set theme(e){this.setAttribute("theme",e)}get density(){return this.getAttribute("density")??"comfortable"}set density(e){this.setAttribute("density",e)}get columns(){return this.getAttribute("columns")??"date,author,commit"}set columns(e){this.setAttribute("columns",e)}get dateFormat(){let e=this.getAttribute("date-format");return e==="date"||e==="relative"?e:"datetime"}set dateFormat(e){this.setAttribute("date-format",e)}get dateType(){return this.getAttribute("date-type")==="authored"?"authored":"committed"}set dateType(e){this.setAttribute("date-type",e)}get avatars(){let e=this.getAttribute("avatars");return e!==null&&e!=="false"&&e!=="off"}set avatars(e){e?this.setAttribute("avatars",""):this.removeAttribute("avatars")}get refs(){return this.#h}set refs(e){this.#B([...e])}refresh(){let e=new CustomEvent("gitgraph-refresh",{bubbles:!0,composed:!0,cancelable:!0,detail:{repositoryId:this.#t.repositoryId}});this.dispatchEvent(e)&&this.#s&&this.#_(!1,!0)}setData(e){this.#t={...e,commits:[...e.commits],refs:[...e.refs]},this.#n=void 0,this.#f=void 0,this.#r=void 0,this.#g=!1,this.#p=void 0,this.#E=void 0,this.#m.clear(),this.#k(),this.#e.querySelector(".scroller")?.scrollTo({top:0})}appendPage(e){let t=this.#e.querySelector(".scroller")?.scrollTop??0,n=new Set(this.#t.commits.map(i=>i.oid));this.#t={...this.#t,...e,commits:[...this.#t.commits,...e.commits.filter(i=>!n.has(i.oid))],refs:this.#st(this.#t.refs,e.refs)},this.#k(),queueMicrotask(()=>{let i=this.#e.querySelector(".scroller");i&&(i.scrollTop=t,this.#i())})}selectCommit(e){let t=this.#t.commits.find(n=>n.oid===e);t&&(this.#n=e,this.#f=void 0,this.#p=void 0,this.#o=void 0,this.#m.clear(),this.dispatchEvent(new CustomEvent("gitgraph-commit-select",{bubbles:!0,composed:!0,detail:{commit:t}})),this.#$(t),this.#i(),this.#c(),queueMicrotask(()=>this.#ft(t.oid)))}async compareCommits(e,t){let n=this.#t.commits.find(s=>s.oid===e),i=this.#t.commits.find(s=>s.oid===t);if(!(!n||!i||!this.#s?.compare)){this.#n=e,this.#f=t,this.#o=void 0,this.#p=void 0,this.#g=!0,this.#m.clear(),this.#i(),this.#c();try{this.#p=await this.#s.compare(this.#t.repositoryId,zd(n),zd(i)),this.dispatchEvent(new CustomEvent("gitgraph-compare",{bubbles:!0,composed:!0,detail:this.#p}))}catch(s){this.#N(s)}this.#c()}}focusCommit(e){let t=this.#t.commits.findIndex(i=>i.oid===e);if(t<0)return;this.#e.querySelector(".scroller")?.scrollTo({top:this.#v(t,this.#R()),behavior:"smooth"}),queueMicrotask(()=>{this.#e.querySelector(`.row[data-oid="${CSS.escape(e)}"]`)?.focus()})}#st(e,t){let n=new Map(e.map(i=>[`${i.kind}:${i.name}`,i]));for(let i of t)n.set(`${i.kind}:${i.name}`,i);return[...n.values()]}#k(){this.#x=E1(this.#t.commits),this.#F(!1),this.#X(),this.#W(),this.#C(),this.#Z(),this.#i()}#X(){let e=this.#e.querySelector(".shell");if(!e||e.querySelector(".toolbar"))return;e.innerHTML=`
      <div class="toolbar">
        <div class="branch-control">
          <strong>Branches:</strong>
          <button class="ref-select" type="button" aria-haspopup="menu" aria-expanded="false"
            aria-label="Select branches and tags">
            <span class="ref-select-label">Show All</span><span class="caret">\u25BE</span>
          </button>
        </div>
        <label class="remote-control">
          <input class="remote-toggle" type="checkbox" checked>
          <span>Show Remote Branches</span>
        </label>
        <span class="repository-name"></span>
        <div class="tools">
          <div class="find">
            <input class="search" type="search" placeholder="Find commits\u2026" aria-label="Search commits">
            <span class="search-count" hidden></span>
            <button class="icon-button search-prev" type="button" aria-label="Previous match" disabled>\u2191</button>
            <button class="icon-button search-next" type="button" aria-label="Next match" disabled>\u2193</button>
          </div>
          <button class="icon-button refresh" type="button" aria-label="Refresh" title="Refresh">\u21BB</button>
          <button class="icon-button theme-toggle" type="button" aria-label="Toggle theme">\u25D0</button>
        </div>
      </div>
      <div class="body">
        <section class="history">
          <div class="header" aria-hidden="true">
            <span class="col-graph">Graph</span><span class="col-description">Description</span
            ><span class="col-date">Date</span><span class="col-author">Author</span
            ><span class="col-commit">Commit</span>
          </div>
          <div class="scroller" role="treegrid" aria-label="Git commit history" tabindex="0">
            <div class="spacer"><div class="window"></div></div>
          </div>
        </section>
      </div>`;let t=e.querySelector(".search");t.value=this.#b,t.addEventListener("input",()=>{this.#b=t.value,this.#F(!0),this.#C(),this.#i(),this.#J()}),t.addEventListener("keydown",a=>{a.key==="Enter"?(a.preventDefault(),this.#G(a.shiftKey?-1:1)):a.key==="Escape"&&t.value&&(a.stopPropagation(),t.value="",this.#b="",this.#F(!0),this.#C(),this.#i())}),e.querySelector(".search-prev")?.addEventListener("click",()=>this.#G(-1)),e.querySelector(".search-next")?.addEventListener("click",()=>this.#G(1)),e.querySelector(".refresh")?.addEventListener("click",()=>this.refresh()),e.querySelector(".theme-toggle")?.addEventListener("click",()=>{this.theme=this.theme==="light"?"dark":"light"});let n=e.querySelector(".remote-toggle");n.checked=this.#A,n.addEventListener("change",()=>{this.#A=n.checked,this.#l(),this.#i()});let i=e.querySelector(".ref-select");i.addEventListener("click",()=>{this.#D?.dataset.menu==="refs"?this.#l():this.#at(i)});let s=e.querySelector(".scroller");s.addEventListener("scroll",()=>{this.#i(),this.#t.hasMore&&!this.#M&&s.scrollTop+s.clientHeight>s.scrollHeight-this.#a*4&&this.#_(!0)}),s.addEventListener("keydown",a=>this.#ht(a)),this.#i()}#C(){let e=this.#e.querySelector(".shell");if(!e||!e.querySelector(".toolbar"))return;e.querySelector(".repository-name").textContent=this.#t.repositoryName??this.#t.repositoryId??"data provider";let t=this.#h;e.querySelector(".ref-select-label").textContent=t.length===0?"Show All":t.length===1?rv(t[0]):`${t.length} selected`,this.#K()}#W(){let e=this.#e.querySelector(".shell");if(!e)return;let t=this.getAttribute("columns"),n=t===null?void 0:new Set(t.split(",").map(i=>i.trim().toLowerCase()).filter(Boolean));for(let i of["date","author","commit"])e.toggleAttribute(`data-hide-${i}`,n!==void 0&&!n.has(i))}#q(e,t){this.#l();let n=this.#e.querySelector(".shell"),i=document.createElement("div");i.className="menu",i.dataset.menu=e,i.setAttribute("role","menu"),n.append(i),this.#D=i;let s=l=>{let c=l.composedPath();!c.includes(i)&&!(t&&c.includes(t))&&this.#l()},a=l=>{l.key==="Escape"&&(l.stopPropagation(),this.#l())},r=()=>this.#l(),o=this.#e.querySelector(".scroller");return document.addEventListener("pointerdown",s,!0),document.addEventListener("keydown",a,!0),o?.addEventListener("scroll",r),window.addEventListener("resize",r),this.#L=()=>{document.removeEventListener("pointerdown",s,!0),document.removeEventListener("keydown",a,!0),o?.removeEventListener("scroll",r),window.removeEventListener("resize",r),i.remove()},t?.setAttribute("aria-expanded","true"),i}#l(){let e=this.#L;this.#D=void 0,this.#L=void 0,this.#U=void 0,this.#T=void 0,e?.(),this.#Y(),this.#e.querySelector(".ref-select")?.setAttribute("aria-expanded","false")}#Y(){for(let e of this.#e.querySelectorAll(".row"))e.classList.toggle("context-active",e.dataset.oid===this.#T)}#j(e,t,n){e.style.left="0px",e.style.top="0px";let i=this.getBoundingClientRect(),s=e.getBoundingClientRect();e.style.left=`${Math.min(Math.max(4,t),Math.max(4,i.width-s.width-4))}px`,e.style.top=`${Math.min(Math.max(4,n),Math.max(4,i.height-s.height-4))}px`}#y(e,t){let n=document.createElement("button");if(n.className="menu-item",n.type="button",n.setAttribute("role","menuitem"),n.disabled=t.enabled===!1,t.checked!==void 0){let s=document.createElement("span");s.className="menu-check",s.textContent=t.checked?"\u2713":"",n.append(s)}let i=document.createElement("span");return i.className="menu-label",i.textContent=e,n.append(i),n.addEventListener("click",t.onSelect),n}#at(e){let t=this.#q("refs",e),n=[["Local Branches","head"],["Remote Branches","remote"],["Tags","tag"]],i=new Map,s=()=>new Set(this.#h),a=this.#y("Show All",{checked:this.#h.length===0,onSelect:()=>this.#B([])});t.append(a);let r=document.createElement("div");r.className="menu-scroll";let o=0;for(let[u,d]of n){let h=this.#t.refs.filter(m=>m.kind===d&&(d!=="remote"||this.#A));if(h.length===0)continue;let p=document.createElement("div");p.className="menu-group",p.textContent=u,r.append(p);for(let m of h){let b=this.#y(rv(m.name),{checked:this.#h.includes(m.name),onSelect:()=>this.#rt(m.name)});i.set(m.name,b.querySelector(".menu-check")),r.append(b),o+=1}}o>0&&t.append(Object.assign(document.createElement("div"),{className:"menu-separator"}),r),this.#U=()=>{let u=s();a.querySelector(".menu-check").textContent=u.size===0?"\u2713":"";for(let[d,h]of i)h.textContent=u.has(d)?"\u2713":""};let l=e.getBoundingClientRect(),c=this.getBoundingClientRect();this.#j(t,l.left-c.left,l.bottom-c.top+2)}#rt(e){let t=new Set(this.#h);t.has(e)?t.delete(e):t.add(e),this.#B([...t])}#B(e){this.#h=e,this.#C(),this.#U?.(),this.#s&&this.#_(!1)}#ot(e,t,n){if(!this.dispatchEvent(new CustomEvent("gitgraph-context-menu",{bubbles:!0,composed:!0,cancelable:!0,detail:{commit:e,clientX:t,clientY:n}})))return;let s=this.#q("commit");this.#T=e.oid,this.#Y();let a=e.message.split(`
`,1)[0]??"";if(s.append(this.#y("Copy Commit Hash",{enabled:e.kind!=="working-tree",onSelect:()=>{this.#l(),this.#z(e.oid)}}),this.#y("Copy Commit Subject",{enabled:a.length>0,onSelect:()=>{this.#l(),this.#z(a)}}),this.#y("Compare with Selected Commit",{enabled:!!(this.#n&&this.#n!==e.oid&&this.#s?.compare),onSelect:()=>{let o=this.#n;this.#l(),o&&this.compareCommits(o,e.oid)}})),e.url){let o=e.url;s.append(this.#y("Open in Remote \u2197",{onSelect:()=>{this.#l(),window.open(o,"_blank","noopener,noreferrer")}}))}let r=this.getBoundingClientRect();this.#j(s,t-r.left,n-r.top)}async#z(e){try{await navigator.clipboard.writeText(e)}catch{let t=document.createElement("textarea");t.value=e,t.setAttribute("aria-hidden","true"),t.style.position="fixed",t.style.opacity="0",document.body.append(t),t.select(),document.execCommand("copy"),t.remove()}}#lt(e){let t=e.author?.email?.trim().toLowerCase()??"",n=document.createElement("span");n.className="avatar",n.setAttribute("aria-hidden","true");let i=document.createElement("span");i.textContent=(e.author?.name??"?").trim().slice(0,1).toUpperCase()||"?",n.append(i),t&&n.style.setProperty("--avatar-color",IR(t));let s=e.author?.avatarUrl??(t?ov.get(t):void 0);if(s){let a=document.createElement("img");a.src=s,a.alt="",a.loading="lazy",a.decoding="async",a.addEventListener("error",()=>a.remove()),n.append(a)}return n}async#Z(){if(!this.avatars)return;let e=new Set;for(let t of this.#t.commits){let n=t.author?.email?.trim().toLowerCase();n&&!t.author?.avatarUrl&&!ov.has(n)&&!lv.has(n)&&e.add(n)}if(e.size!==0){for(let t of e)lv.add(t);await Promise.all([...e].map(async t=>{let n=await PR(t).catch(()=>{});n&&ov.set(t,n),lv.delete(t)})),this.#i()}}#F(e){let t=this.#b.trim().toLocaleLowerCase();if(!t){this.#u=[],this.#d=-1;return}let n=[];this.#t.commits.forEach((i,s)=>{let a=`${i.author?.name??""} ${i.author?.email??""}`;`${i.oid} ${i.message} ${a}`.toLocaleLowerCase().includes(t)&&n.push(s)}),this.#u=n,this.#d=n.length===0?-1:e?0:Math.min(Math.max(this.#d,0),n.length-1)}#K(){let e=this.#e.querySelector(".search-count");if(!e)return;let t=this.#b.trim().length>0;e.hidden=!t,e.textContent=t?`${this.#d+1}/${this.#u.length}`:"";let n=this.#u.length===0;this.#e.querySelector(".search-prev").disabled=n,this.#e.querySelector(".search-next").disabled=n}#G(e){this.#u.length!==0&&(this.#d=(this.#d+e+this.#u.length)%this.#u.length,this.#K(),this.#i(),this.#J())}#J(){let e=this.#u[this.#d];if(e===void 0)return;let t=this.#e.querySelector(".scroller");if(!t)return;let n=this.#v(e,this.#R());(n<t.scrollTop||n+this.#a>t.scrollTop+t.clientHeight)&&t.scrollTo({top:Math.max(0,n-t.clientHeight/2)})}#i(){let e=this.#e.querySelector(".scroller"),t=this.#e.querySelector(".spacer"),n=this.#e.querySelector(".window");if(!e||!t||!n)return;if(this.#t.commits.length===0&&(this.#w=void 0,this.#S=void 0),this.#I&&this.#t.commits.length===0){t.style.height="100%",n.innerHTML=`
        <div class="loading-view">
          <div class="pending pending-rows" aria-hidden="true">${DR.map(E=>`<div class="pending-row"><span class="pending-dot"></span><span class="pending-bar" style="width:${E}%"></span></div>`).join("")}</div>
          <p class="pending-label"><slot name="loading">Reading the commit DAG\u2026</slot></p>
        </div>`;return}if(this.#E&&this.#t.commits.length===0){t.style.height="100%",n.innerHTML='<div class="error"><slot name="error"></slot></div>';let E=n.querySelector("slot");E&&(E.textContent=this.#E);return}if(this.#t.commits.length===0){t.style.height="100%",n.innerHTML='<div class="empty"><slot name="empty">No commits match this view.</slot></div>';return}let i=Math.max(56,this.#x.laneCount*16+24);this.#e.querySelector(".shell")?.style.setProperty("--wgg-graph-width",`${i}px`);let s=this.#R(),a=s>=0?this.#O:0,r=(s+1)*this.#a,o=this.#t.commits.length*this.#a+a;t.style.height=`${o+(this.#t.hasMore?42:0)}px`;let l=Math.ceil(Math.max(e.clientHeight,420)/this.#a),c=E=>s<0||E<r?Math.floor(E/this.#a):E<r+a?s:Math.floor((E-a)/this.#a),u=Math.max(0,c(e.scrollTop)-this.#V),d=Math.min(this.#t.commits.length,Math.max(u+l,c(e.scrollTop+e.clientHeight)+1)+this.#V);n.style.transform="";let h=this.#w;for(let E of[...n.children])E!==h&&E.remove();let p=this.#v(u,s),m=Math.max(this.#a,this.#v(d,s)-p),b=uv("svg",{class:"graph",width:`${i}`,height:`${m}`,"aria-hidden":"true"});b.style.top=`${p}px`,this.#ct(b,u,d,s),n.append(b);let g=new Map;for(let E of this.#t.refs){if(!this.#A&&E.kind==="remote")continue;let w=g.get(E.target)??[];w.push(E),g.set(E.target,w)}let f=new Map(this.#x.nodes.map(E=>[E.oid,E])),v=new Set(this.#u),S=this.#d>=0?this.#u[this.#d]:-1,x=this.avatars,T=this.dateFormat;for(let E=u;E<d;E+=1){let w=this.#t.commits[E],y=document.createElement("div");y.className="row",y.classList.toggle("merge",w.parents.length>1),y.classList.toggle("working-tree",w.kind==="working-tree"),y.classList.toggle("match",v.has(E)),y.classList.toggle("match-current",E===S),y.classList.toggle("context-active",w.oid===this.#T),w.oid===this.#n&&y.classList.add("selected"),w.oid===this.#f&&y.classList.add("compare"),y.dataset.oid=w.oid,y.dataset.index=String(E),y.setAttribute("role","row"),y.tabIndex=w.oid===this.#n||!this.#n&&E===0?0:-1,y.style.top=`${this.#v(E,s)}px`,y.innerHTML=`
        <div class="graph-cell" role="gridcell"></div>
        <div class="subject" role="gridcell"><div class="refs"></div><span class="message"></span></div>
        <div class="date" role="gridcell"></div>
        <div class="author" role="gridcell"></div>
        <div class="oid" role="gridcell"></div>`,y.querySelector(".message").textContent=w.message.split(`
`,1)[0]??"";let C=y.querySelector(".author");x&&w.kind!=="working-tree"&&C.append(this.#lt(w));let D=document.createElement("span");D.className="author-name",D.textContent=w.author?.name??"\u2014",C.append(D),y.querySelector(".date").textContent=w1(this.#nt(w),T),y.querySelector(".oid").textContent=av(w.oid);let z=y.querySelector(".refs"),X=new Set;for(let H of g.get(w.oid)??[]){let A=rv(H.name),L=H.kind==="current"||H.kind==="head"?`branch:${A}`:`${H.kind}:${A}`;if(X.has(L))continue;X.add(L);let F=document.createElement("span");F.className=`ref ${H.kind}`;let W=H.kind==="tag"?"\u25C7":H.kind==="stash"?"\u224B":H.kind==="remote"?"\u2197":"\u2442";F.textContent=`${W} ${A}`,F.title=A;let J=f.get(w.oid);if(J&&NR.has(H.kind)&&F.style.setProperty("--ref-color",$o[J.colour%$o.length]),z.append(F),X.size>=4)break}y.addEventListener("click",H=>{H.button!==0||T1&&H.ctrlKey||((H.metaKey||H.ctrlKey)&&this.#n&&this.#n!==w.oid?this.compareCommits(this.#n,w.oid):w.oid===this.#n&&!this.#f?this.#H():this.selectCommit(w.oid))}),y.addEventListener("mousedown",H=>{H.button===2&&H.preventDefault()}),y.addEventListener("contextmenu",H=>{H.preventDefault(),H.stopPropagation(),this.#ot(w,H.clientX,H.clientY)}),y.addEventListener("dblclick",()=>{w.url&&window.open(w.url,"_blank","noopener,noreferrer"),this.dispatchEvent(new CustomEvent("gitgraph-commit-open",{bubbles:!0,composed:!0,detail:{commit:w}}))}),n.append(y)}if(s>=0){let E=h??document.createElement("aside");E.className="inline-details",E.setAttribute("aria-label",this.#f?"Commit comparison":"Commit details"),E.style.top=`${r}px`,E.style.height=`${a}px`,E.parentNode!==n&&n.append(E),this.#w=E}else h?.remove(),this.#w=void 0,this.#S=void 0;if(this.#t.hasMore&&d===this.#t.commits.length){let E=document.createElement("button");E.className="action load-more",E.type="button",E.style.top=`${o}px`,E.textContent=this.#M?"Loading\u2026":"Load more commits",E.disabled=this.#M,E.addEventListener("click",()=>{let w=new CustomEvent("gitgraph-load-more",{bubbles:!0,composed:!0,cancelable:!0,detail:{cursor:this.#t.cursor}});this.dispatchEvent(w)&&this.#s&&this.#_(!0)}),n.append(E)}this.#c()}#ct(e,t,n,i){let s=r=>16+r*16,a=r=>this.#v(r,i)-this.#v(t,i)+this.#a*.5;for(let r of this.#x.segments){if(r.to.row<t||r.from.row>=n)continue;let o=Math.max(t,r.from.row),l=Math.min(n,r.to.row),c=s(r.from.lane),u=s(r.to.lane),d=a(o),h=a(l),p=r.anchor==="from";e.append(uv("path",{d:this.#ut(c,u,d,h,p),stroke:$o[r.colour%$o.length],...r.dangling?{"stroke-dasharray":"3 4"}:{}}))}for(let r of this.#x.nodes){if(r.row<t||r.row>=n)continue;let o=r.kind==="working-tree"?"var(--wgg-faint)":$o[r.colour%$o.length];e.append(uv("circle",{cx:`${s(r.lane)}`,cy:`${a(r.row)}`,r:r.kind==="working-tree"?"4.5":r.kind==="stash"?"4":"3.5",fill:r.oid===this.#t.head||r.kind==="working-tree"?"var(--wgg-bg)":o,stroke:o}))}}#ut(e,t,n,i,s){if(e===t)return`M ${e} ${n} L ${t} ${i}`;let a=this.#a*.55;if(i-n<=this.#a)return`M ${e} ${n} C ${e} ${n+a}, ${t} ${i-a}, ${t} ${i}`;if(s){let o=n+this.#a;return`M ${e} ${n} C ${e} ${n+a}, ${t} ${o-a}, ${t} ${o} L ${t} ${i}`}let r=i-this.#a;return`M ${e} ${n} L ${e} ${r} C ${e} ${r+a}, ${t} ${i-a}, ${t} ${i}`}#ht(e){let t=[...this.#e.querySelectorAll(".row")],n=this.#e.activeElement,i=t.indexOf(n),s=i;if(e.key==="ArrowDown")s=Math.min(t.length-1,Math.max(0,i+1));else if(e.key==="ArrowUp")s=Math.max(0,i-1);else if(e.key==="Home")s=0;else if(e.key==="End")s=t.length-1;else if(e.key==="Enter"&&n?.dataset.oid){this.selectCommit(n.dataset.oid);return}else if(e.key==="Escape"){this.#H();return}else return;e.preventDefault(),t[s]?.focus()}async#$(e){if(!this.#s?.getCommitDetails){this.#g=!1,this.#r={commit:e,refs:this.#t.refs.filter(n=>n.target===e.oid),changes:[]},this.#c();return}this.#r?.commit.oid===e.oid||(this.#r=void 0,this.#g=!0,this.#c());try{let n=await this.#s.getCommitDetails(this.#t.repositoryId,zd(e));if(this.#n!==e.oid)return;this.#r=n}catch(n){if(this.#n!==e.oid)return;this.#N(n)}this.#g=!1,this.#c()}#c(e=!1){let t=e||this.#g,n=this.#e.querySelector(".inline-details");if(!n||!this.#n)return;let i=JSON.stringify([this.#n,this.#f,t,this.#r?.commit.oid,this.#r?.changes.length,!!this.#p,this.#o?.path,this.#o?.patch?.length,[...this.#m].sort()]);if(i===this.#S&&n.firstChild)return;this.#S=i,n.innerHTML=`
      <button class="details-close" type="button" aria-label="Close details">\xD7</button>
      <div class="details-summary"></div>
      <div class="details-files"></div>`,n.querySelector(".details-close")?.addEventListener("click",()=>this.#H());let s=n.querySelector(".details-summary"),a=n.querySelector(".details-files");if(this.#f){if(t||!this.#p){s.innerHTML='<p class="pending-label">Calculating tree difference\u2026</p>',s.append(Gd(Bd.slice(0,3))),a.append(Gd(Bd));return}this.#dt(s,a,this.#p);return}let r=this.#r?.commit??this.#t.commits.find(m=>m.oid===this.#n);if(!r){s.innerHTML='<p class="pending-label">Reading commit object\u2026</p>',s.append(Gd(Bd.slice(0,3)));return}let o=document.createElement("dl");o.className="meta";let l=[["Commit",r.kind==="working-tree"?"uncommitted changes":r.oid,!0],["Parents",r.parents.map(av).join(", ")||"root commit",!0],["Author",`${r.author?.name??"Unknown"}${r.author?.email?` <${r.author.email}>`:""}`],["Date",w1(this.#nt(r))]];for(let[m,b,g]of l){let f=document.createElement("dt"),v=document.createElement("dd");f.textContent=m,v.textContent=b,g&&(v.className="oid-value"),o.append(f,v)}s.append(o);let c=document.createElement("p");c.className="commit-body",c.textContent=(this.#r?.body??r.message).trim(),s.append(c);let u=document.createElement("div");if(u.className="actions",u.innerHTML='<button class="action primary copy" type="button">Copy SHA</button>',u.querySelector(".copy")?.addEventListener("click",()=>void this.#z(r.oid)),this.#s?.compare){let m=document.createElement("button");m.className="action compare-action",m.type="button",m.textContent="Compare with\u2026",m.addEventListener("click",()=>{m.textContent=T1?"Cmd-click another commit":"Ctrl-click another commit",m.disabled=!0,this.#e.querySelector(".scroller")?.focus()}),u.append(m)}if(r.url){let m=document.createElement("button");m.className="action",m.textContent="Open remote \u2197",m.addEventListener("click",()=>window.open(r.url,"_blank","noopener,noreferrer")),u.append(m)}if(s.append(u),t){a.append(Gd(Bd));return}let d=this.#r?.changes??[],h=r.parents[0],p=h&&this.#s?.getFileDiff?{base:{kind:"commit",oid:h},head:zd(r)}:void 0;if(this.#o)s.append(this.#Q());else if(p&&d.length>0){let m=document.createElement("p");m.className="no-changes",m.textContent="Select a file to view its diff.",s.append(m)}this.#tt(a,d,p)}#Q(){let e=document.createElement("pre");return e.className="patch",e.textContent=this.#o?.patch??this.#o?.unavailableReason??(this.#o?.binary?"Binary file \u2014 patch unavailable.":"No textual patch."),e}#dt(e,t,n){let i=document.createElement("h2");i.className="details-heading",i.textContent=`${this.#it(n.base)} \u2192 ${this.#it(n.head)}`,e.append(i);let s=document.createElement("p");if(s.className="stats",s.textContent=`${n.changes.length} files \xB7 +${n.additions} \u2212${n.deletions}${n.truncated?" \xB7 truncated":""}`,e.append(s),this.#o)e.append(this.#Q());else if(n.changes.length>0){let a=document.createElement("p");a.className="no-changes",a.textContent="Select a file to view its diff.",e.append(a)}this.#tt(t,n.changes,{base:n.base,head:n.head,comparison:n})}#tt(e,t,n){if(t.length===0){e.innerHTML='<p class="no-changes">No file changes.</p>';return}let i=document.createElement("ul");i.className="tree",this.#et(i,OR(t),"",n),e.append(i)}#et(e,t,n,i){for(let[s,a]of[...t.dirs.entries()].sort((r,o)=>r[0].localeCompare(o[0]))){for(;a.files.length===0&&a.dirs.size===1;){let[h]=a.dirs;s=`${s}/${h[0]}`,a=h[1]}let r=n?`${n}/${s}`:s,o=this.#m.has(r),l=document.createElement("li"),c=document.createElement("button");c.className="tree-dir",c.type="button",c.setAttribute("aria-expanded",String(!o));let u=document.createElement("span");u.className="twistie",u.textContent=o?"\u25B8":"\u25BE";let d=document.createElement("span");if(d.className="dir-name",d.textContent=s,c.append(u,d),c.addEventListener("click",()=>{o?this.#m.delete(r):this.#m.add(r),this.#c()}),l.append(c),!o){let h=document.createElement("ul");this.#et(h,a,r,i),l.append(h)}e.append(l)}for(let s of[...t.files].sort((a,r)=>a.path.localeCompare(r.path))){let a=document.createElement("li"),r=document.createElement("button");r.className="tree-file",r.type="button",this.#o?.path===s.path&&r.classList.add("active"),r.title=s.previousPath?`${s.previousPath} \u2192 ${s.path}`:s.path;let o=document.createElement("span");o.className=`change-code ${s.kind}`,o.textContent=s.kind.slice(0,1).toUpperCase();let l=document.createElement("span");l.className="change-path",l.textContent=s.previousPath?`${cv(s.previousPath)} \u2192 ${cv(s.path)}`:cv(s.path);let c=document.createElement("span");c.className="stats",c.textContent=s.binary?"binary":`${s.additions===void 0?"":`+${s.additions}`} ${s.deletions===void 0?"":`\u2212${s.deletions}`}`.trim(),r.append(o,l,c),r.addEventListener("click",async()=>{if(!(!this.dispatchEvent(new CustomEvent("gitgraph-file-open",{bubbles:!0,composed:!0,cancelable:!0,detail:{change:s,base:i?.base,head:i?.head,comparison:i?.comparison}}))||!i||!this.#s?.getFileDiff)){if(s.unavailableReason){this.#o={base:i.base,head:i.head,path:s.path,unavailableReason:s.unavailableReason},this.#c();return}try{this.#o=await this.#s.getFileDiff(this.#t.repositoryId,i.base,i.head,s.path,3)}catch(d){this.#N(d)}this.#c()}}),a.append(r),e.append(a)}}#nt(e){return this.dateType==="authored"?e.authoredAt??e.committedAt:e.committedAt??e.authoredAt}#it(e){return e.kind==="working-tree"?"working tree":av(e.oid)}#H(){this.#n=void 0,this.#f=void 0,this.#r=void 0,this.#g=!1,this.#p=void 0,this.#o=void 0,this.#m.clear(),this.#S=void 0,this.#i(),this.#c()}#R(){return this.#n?this.#t.commits.findIndex(e=>e.oid===this.#n):-1}#v(e,t){return e*this.#a+(t>=0&&e>t?this.#O:0)}#ft(e){if(this.#n!==e)return;let t=this.#R(),n=this.#e.querySelector(".scroller");if(t<0||!n)return;let i=t*this.#a,s=i+this.#a+this.#O,a=n.scrollTop;s>a+n.clientHeight&&(a=s-n.clientHeight),i<a&&(a=i),a!==n.scrollTop&&n.scrollTo({top:a,behavior:"smooth"})}async#_(e,t=!1){if(!this.#s||e&&!this.#t.hasMore)return;this.#P?.abort();let n=new AbortController;this.#P=n;let i=t?{scrollTop:this.#e.querySelector(".scroller")?.scrollTop??0,selectedOid:this.#n,details:this.#r}:void 0;this.#I=!e&&!t,this.#M=e,this.#E=void 0,this.setAttribute("aria-busy","true"),this.#i();try{let s=await this.#s.getHistory({repositoryId:this.#t.repositoryId,refs:this.#h.length?this.#h:void 0,cursor:e?this.#t.cursor:void 0,limit:200,includeWorkingTree:!0,signal:n.signal});e?this.appendPage(s):(this.setData(s),i&&this.#pt(i))}catch(s){if(n.signal.aborted)return;this.#N(s)}finally{this.#I=!1,this.#M=!1,this.#P===n&&this.setAttribute("aria-busy","false"),this.#i()}}#pt(e){let t=e.selectedOid?this.#t.commits.find(i=>i.oid===e.selectedOid):void 0;t&&(this.#n=t.oid,e.details?.commit.oid===t.oid&&(this.#r=e.details),this.#$(t)),this.#i();let n=this.#e.querySelector(".scroller");n&&e.scrollTop!==n.scrollTop&&(n.scrollTop=e.scrollTop,this.#i())}#N(e){this.#E=e instanceof Error?e.message:String(e),this.dispatchEvent(new CustomEvent("gitgraph-error",{bubbles:!0,composed:!0,detail:{error:e}})),this.#i()}};function C1(e=RR){return typeof customElements<"u"&&!customElements.get(e)&&customElements.define(e,A1),A1}function zR(e){return{commits:e.commits??[],refs:e.refs??[],head:e.head,hasMore:!!e.hasMore,repositoryId:e.repositoryId,repositoryName:e.repositoryName}}var Hd=class{api;constructor(t){this.api=t}async getCapabilities(){return{protocolVersion:"1",history:!0,details:!0,compare:!1,diff:!0,workingTree:!1,stashes:!1,maxPageSize:200,maxDiffBytes:256*1024}}async getHistory(t={}){let n=new URLSearchParams;n.set("limit",String(Math.min(200,Math.max(1,t.limit??200)))),t.cursor&&n.set("cursor",t.cursor);for(let s of t.refs??[])n.append("ref",s);let i=await this.api(`/api/git-history?${n}`,t.signal);return zR(i)}async getCommitDetails(t,n,i){let s=hv(n);return await this.api(`/api/git-commit?oid=${encodeURIComponent(s)}`,i)}async getFileDiff(t,n,i,s,a=3,r){let o=new URLSearchParams({base:hv(n),head:hv(i),path:s,context:String(a)});return await this.api(`/api/git-diff?${o}`,r)}};function hv(e){if(e.kind!=="commit")throw new Error("CGRX Git history supports commit revisions only");return e.oid}var $a={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Qa={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},iE=0,Xv=1,sE=2;var Cu=1,aE=2,Cl=3,tr=0,jn=1,Es=2,Ts=0,er=1,Ru=2,Wv=3,qv=4,rE=5;var Gr=100,oE=101,lE=102,cE=103,uE=104,hE=200,dE=201,fE=202,pE=203,Yv=204,jv=205,mE=206,gE=207,vE=208,yE=209,_E=210,xE=211,bE=212,SE=213,ME=214,vf=0,yf=1,_f=2,vl=3,xf=4,bf=5,Sf=6,Mf=7,Zv=0,EE=1,TE=2,Zi=0,Kv=1,Jv=2,$v=3,Qv=4,ty=5,ey=6,ny=7;var iy=300,nr=301,Hr=302,Kf=303,Jf=304,Nu=306,Ef=1e3,_s=1001,Tf=1002,vn=1003,wE=1004;var Du=1005;var An=1006,$f=1007;var ir=1008;var Mi=1009,sy=1010,ay=1011,Rl=1012,Qf=1013,Ki=1014,Ji=1015,$i=1016,tp=1017,ep=1018,Nl=1020,ry=35902,oy=35899,ly=1021,cy=1022,Pi=1023,xs=1026,sr=1027,uy=1028,np=1029,ar=1030,ip=1031;var sp=1033,Lu=33776,Uu=33777,Iu=33778,Pu=33779,ap=35840,rp=35841,op=35842,lp=35843,cp=36196,up=37492,hp=37496,dp=37488,fp=37489,Ou=37490,pp=37491,mp=37808,gp=37809,vp=37810,yp=37811,_p=37812,xp=37813,bp=37814,Sp=37815,Mp=37816,Ep=37817,Tp=37818,wp=37819,Ap=37820,Cp=37821,Rp=36492,Np=36494,Dp=36495,Lp=36283,Up=36284,Bu=36285,Ip=36286;var eu=2300,wf=2301,mf=2302,Ov=2303,Bv=2400,zv=2401,Fv=2402;var AE=3200;var hy=0,CE=1,sa="",wn="srgb",nu="srgb-linear",iu="linear",ye="srgb";var gf=7680;var RE=519,NE=512,DE=513,LE=514,Pp=515,UE=516,IE=517,Op=518,PE=519,dy=35044;var fy="300 es",Yi=2e3,su=2001;function FR(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function GR(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function au(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function OE(){let e=au("canvas");return e.style.display="block",e}var R1={},yl=null;function ru(...e){let t="THREE."+e.shift();yl?yl("log",t,...e):console.log(t,...e)}function BE(e){let t=e[0];if(typeof t=="string"&&t.startsWith("TSL:")){let n=e[1];n&&n.isStackTrace?e[0]+=" "+n.getLocation():e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function Pt(...e){e=BE(e);let t="THREE."+e.shift();if(yl)yl("warn",t,...e);else{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function zt(...e){e=BE(e);let t="THREE."+e.shift();if(yl)yl("error",t,...e);else{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Br(...e){let t=e.join(" ");t in R1||(R1[t]=!0,Pt(...e))}function zE(e,t,n){return new Promise(function(i,s){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:s();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:i()}}setTimeout(a,n)})}var FE={[vf]:yf,[_f]:Sf,[xf]:Mf,[vl]:bf,[yf]:vf,[Sf]:_f,[Mf]:xf,[bf]:vl},ji=class{addEventListener(t,n){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(n)===-1&&i[t].push(n)}hasEventListener(t,n){let i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(n)!==-1}removeEventListener(t,n){let i=this._listeners;if(i===void 0)return;let s=i[t];if(s!==void 0){let a=s.indexOf(n);a!==-1&&s.splice(a,1)}}dispatchEvent(t){let n=this._listeners;if(n===void 0)return;let i=n[t.type];if(i!==void 0){t.target=this;let s=i.slice(0);for(let a=0,r=s.length;a<r;a++)s[a].call(this,t);t.target=null}}},Un=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],N1=1234567,Qc=Math.PI/180,_l=180/Math.PI;function ea(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Un[e&255]+Un[e>>8&255]+Un[e>>16&255]+Un[e>>24&255]+"-"+Un[t&255]+Un[t>>8&255]+"-"+Un[t>>16&15|64]+Un[t>>24&255]+"-"+Un[n&63|128]+Un[n>>8&255]+"-"+Un[n>>16&255]+Un[n>>24&255]+Un[i&255]+Un[i>>8&255]+Un[i>>16&255]+Un[i>>24&255]).toLowerCase()}function Zt(e,t,n){return Math.max(t,Math.min(n,e))}function py(e,t){return(e%t+t)%t}function HR(e,t,n,i,s){return i+(e-t)*(s-i)/(n-t)}function VR(e,t,n){return e!==t?(n-e)/(t-e):0}function tu(e,t,n){return(1-n)*e+n*t}function kR(e,t,n,i){return tu(e,t,1-Math.exp(-n*i))}function XR(e,t=1){return t-Math.abs(py(e,t*2)-t)}function WR(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function qR(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function YR(e,t){return e+Math.floor(Math.random()*(t-e+1))}function jR(e,t){return e+Math.random()*(t-e)}function ZR(e){return e*(.5-Math.random())}function KR(e){e!==void 0&&(N1=e);let t=N1+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function JR(e){return e*Qc}function $R(e){return e*_l}function QR(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function t2(e){return Math.pow(2,Math.ceil(Math.log(e)/Math.LN2))}function e2(e){return Math.pow(2,Math.floor(Math.log(e)/Math.LN2))}function n2(e,t,n,i,s){let a=Math.cos,r=Math.sin,o=a(n/2),l=r(n/2),c=a((t+i)/2),u=r((t+i)/2),d=a((t-i)/2),h=r((t-i)/2),p=a((i-t)/2),m=r((i-t)/2);switch(s){case"XYX":e.set(o*u,l*d,l*h,o*c);break;case"YZY":e.set(l*h,o*u,l*d,o*c);break;case"ZXZ":e.set(l*d,l*h,o*u,o*c);break;case"XZX":e.set(o*u,l*m,l*p,o*c);break;case"YXY":e.set(l*p,o*u,l*m,o*c);break;case"ZYZ":e.set(l*m,l*p,o*u,o*c);break;default:Pt("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function qi(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Se(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var ws={DEG2RAD:Qc,RAD2DEG:_l,generateUUID:ea,clamp:Zt,euclideanModulo:py,mapLinear:HR,inverseLerp:VR,lerp:tu,damp:kR,pingpong:XR,smoothstep:WR,smootherstep:qR,randInt:YR,randFloat:jR,randFloatSpread:ZR,seededRandom:KR,degToRad:JR,radToDeg:$R,isPowerOfTwo:QR,ceilPowerOfTwo:t2,floorPowerOfTwo:e2,setQuaternionFromProperEuler:n2,normalize:Se,denormalize:qi},Ut=class e{static{e.prototype.isVector2=!0}constructor(t=0,n=0){this.x=t,this.y=n}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,n){return this.x=t,this.y=n,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let n=this.x,i=this.y,s=t.elements;return this.x=s[0]*n+s[3]*i+s[6],this.y=s[1]*n+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,n){return this.x=Zt(this.x,t.x,n.x),this.y=Zt(this.y,t.y,n.y),this}clampScalar(t,n){return this.x=Zt(this.x,t,n),this.y=Zt(this.y,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Zt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(t)/n;return Math.acos(Zt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let n=this.x-t.x,i=this.y-t.y;return n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this}rotateAround(t,n){let i=Math.cos(n),s=Math.sin(n),a=this.x-t.x,r=this.y-t.y;return this.x=a*i-r*s+t.x,this.y=a*s+r*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},xi=class{constructor(t=0,n=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=n,this._z=i,this._w=s}static slerpFlat(t,n,i,s,a,r,o){let l=i[s+0],c=i[s+1],u=i[s+2],d=i[s+3],h=a[r+0],p=a[r+1],m=a[r+2],b=a[r+3];if(d!==b||l!==h||c!==p||u!==m){let g=l*h+c*p+u*m+d*b;g<0&&(h=-h,p=-p,m=-m,b=-b,g=-g);let f=1-o;if(g<.9995){let v=Math.acos(g),S=Math.sin(v);f=Math.sin(f*v)/S,o=Math.sin(o*v)/S,l=l*f+h*o,c=c*f+p*o,u=u*f+m*o,d=d*f+b*o}else{l=l*f+h*o,c=c*f+p*o,u=u*f+m*o,d=d*f+b*o;let v=1/Math.sqrt(l*l+c*c+u*u+d*d);l*=v,c*=v,u*=v,d*=v}}t[n]=l,t[n+1]=c,t[n+2]=u,t[n+3]=d}static multiplyQuaternionsFlat(t,n,i,s,a,r){let o=i[s],l=i[s+1],c=i[s+2],u=i[s+3],d=a[r],h=a[r+1],p=a[r+2],m=a[r+3];return t[n]=o*m+u*d+l*p-c*h,t[n+1]=l*m+u*h+c*d-o*p,t[n+2]=c*m+u*p+o*h-l*d,t[n+3]=u*m-o*d-l*h-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,n,i,s){return this._x=t,this._y=n,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,n=!0){let i=t._x,s=t._y,a=t._z,r=t._order,o=Math.cos,l=Math.sin,c=o(i/2),u=o(s/2),d=o(a/2),h=l(i/2),p=l(s/2),m=l(a/2);switch(r){case"XYZ":this._x=h*u*d+c*p*m,this._y=c*p*d-h*u*m,this._z=c*u*m+h*p*d,this._w=c*u*d-h*p*m;break;case"YXZ":this._x=h*u*d+c*p*m,this._y=c*p*d-h*u*m,this._z=c*u*m-h*p*d,this._w=c*u*d+h*p*m;break;case"ZXY":this._x=h*u*d-c*p*m,this._y=c*p*d+h*u*m,this._z=c*u*m+h*p*d,this._w=c*u*d-h*p*m;break;case"ZYX":this._x=h*u*d-c*p*m,this._y=c*p*d+h*u*m,this._z=c*u*m-h*p*d,this._w=c*u*d+h*p*m;break;case"YZX":this._x=h*u*d+c*p*m,this._y=c*p*d+h*u*m,this._z=c*u*m-h*p*d,this._w=c*u*d-h*p*m;break;case"XZY":this._x=h*u*d-c*p*m,this._y=c*p*d-h*u*m,this._z=c*u*m+h*p*d,this._w=c*u*d+h*p*m;break;default:Pt("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,n){let i=n/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let n=t.elements,i=n[0],s=n[4],a=n[8],r=n[1],o=n[5],l=n[9],c=n[2],u=n[6],d=n[10],h=i+o+d;if(h>0){let p=.5/Math.sqrt(h+1);this._w=.25/p,this._x=(u-l)*p,this._y=(a-c)*p,this._z=(r-s)*p}else if(i>o&&i>d){let p=2*Math.sqrt(1+i-o-d);this._w=(u-l)/p,this._x=.25*p,this._y=(s+r)/p,this._z=(a+c)/p}else if(o>d){let p=2*Math.sqrt(1+o-i-d);this._w=(a-c)/p,this._x=(s+r)/p,this._y=.25*p,this._z=(l+u)/p}else{let p=2*Math.sqrt(1+d-i-o);this._w=(r-s)/p,this._x=(a+c)/p,this._y=(l+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,n){let i=t.dot(n)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*n.z-t.z*n.y,this._y=t.z*n.x-t.x*n.z,this._z=t.x*n.y-t.y*n.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Zt(this.dot(t),-1,1)))}rotateTowards(t,n){let i=this.angleTo(t);if(i===0)return this;let s=Math.min(1,n/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,n){let i=t._x,s=t._y,a=t._z,r=t._w,o=n._x,l=n._y,c=n._z,u=n._w;return this._x=i*u+r*o+s*c-a*l,this._y=s*u+r*l+a*o-i*c,this._z=a*u+r*c+i*l-s*o,this._w=r*u-i*o-s*l-a*c,this._onChangeCallback(),this}slerp(t,n){let i=t._x,s=t._y,a=t._z,r=t._w,o=this.dot(t);o<0&&(i=-i,s=-s,a=-a,r=-r,o=-o);let l=1-n;if(o<.9995){let c=Math.acos(o),u=Math.sin(c);l=Math.sin(l*c)/u,n=Math.sin(n*c)/u,this._x=this._x*l+i*n,this._y=this._y*l+s*n,this._z=this._z*l+a*n,this._w=this._w*l+r*n,this._onChangeCallback()}else this._x=this._x*l+i*n,this._y=this._y*l+s*n,this._z=this._z*l+a*n,this._w=this._w*l+r*n,this.normalize();return this}slerpQuaternions(t,n,i){return this.copy(t).slerp(n,i)}random(){let t=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),a=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),a*Math.sin(n),a*Math.cos(n))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,n=0){return this._x=t[n],this._y=t[n+1],this._z=t[n+2],this._w=t[n+3],this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._w,t}fromBufferAttribute(t,n){return this._x=t.getX(n),this._y=t.getY(n),this._z=t.getZ(n),this._w=t.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},O=class e{static{e.prototype.isVector3=!0}constructor(t=0,n=0,i=0){this.x=t,this.y=n,this.z=i}set(t,n,i){return i===void 0&&(i=this.z),this.x=t,this.y=n,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,n){return this.x=t.x*n.x,this.y=t.y*n.y,this.z=t.z*n.z,this}applyEuler(t){return this.applyQuaternion(D1.setFromEuler(t))}applyAxisAngle(t,n){return this.applyQuaternion(D1.setFromAxisAngle(t,n))}applyMatrix3(t){let n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[3]*i+a[6]*s,this.y=a[1]*n+a[4]*i+a[7]*s,this.z=a[2]*n+a[5]*i+a[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let n=this.x,i=this.y,s=this.z,a=t.elements,r=1/(a[3]*n+a[7]*i+a[11]*s+a[15]);return this.x=(a[0]*n+a[4]*i+a[8]*s+a[12])*r,this.y=(a[1]*n+a[5]*i+a[9]*s+a[13])*r,this.z=(a[2]*n+a[6]*i+a[10]*s+a[14])*r,this}applyQuaternion(t){let n=this.x,i=this.y,s=this.z,a=t.x,r=t.y,o=t.z,l=t.w,c=2*(r*s-o*i),u=2*(o*n-a*s),d=2*(a*i-r*n);return this.x=n+l*c+r*d-o*u,this.y=i+l*u+o*c-a*d,this.z=s+l*d+a*u-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[4]*i+a[8]*s,this.y=a[1]*n+a[5]*i+a[9]*s,this.z=a[2]*n+a[6]*i+a[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,n){return this.x=Zt(this.x,t.x,n.x),this.y=Zt(this.y,t.y,n.y),this.z=Zt(this.z,t.z,n.z),this}clampScalar(t,n){return this.x=Zt(this.x,t,n),this.y=Zt(this.y,t,n),this.z=Zt(this.z,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Zt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,n){let i=t.x,s=t.y,a=t.z,r=n.x,o=n.y,l=n.z;return this.x=s*l-a*o,this.y=a*r-i*l,this.z=i*o-s*r,this}projectOnVector(t){let n=t.lengthSq();if(n===0)return this.set(0,0,0);let i=t.dot(this)/n;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return dv.copy(this).projectOnVector(t),this.sub(dv)}reflect(t){return this.sub(dv.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(t)/n;return Math.acos(Zt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let n=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return n*n+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,n,i){let s=Math.sin(n)*t;return this.x=s*Math.sin(i),this.y=Math.cos(n)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,n,i){return this.x=t*Math.sin(n),this.y=i,this.z=t*Math.cos(n),this}setFromMatrixPosition(t){let n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(t){let n=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=n,this.y=i,this.z=s,this}setFromMatrixColumn(t,n){return this.fromArray(t.elements,n*4)}setFromMatrix3Column(t,n){return this.fromArray(t.elements,n*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(t),this.y=n,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},dv=new O,D1=new xi,kt=class e{static{e.prototype.isMatrix3=!0}constructor(t,n,i,s,a,r,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,r,o,l,c)}set(t,n,i,s,a,r,o,l,c){let u=this.elements;return u[0]=t,u[1]=s,u[2]=o,u[3]=n,u[4]=a,u[5]=l,u[6]=i,u[7]=r,u[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(t,n,i){return t.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let n=t.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){let i=t.elements,s=n.elements,a=this.elements,r=i[0],o=i[3],l=i[6],c=i[1],u=i[4],d=i[7],h=i[2],p=i[5],m=i[8],b=s[0],g=s[3],f=s[6],v=s[1],S=s[4],x=s[7],T=s[2],E=s[5],w=s[8];return a[0]=r*b+o*v+l*T,a[3]=r*g+o*S+l*E,a[6]=r*f+o*x+l*w,a[1]=c*b+u*v+d*T,a[4]=c*g+u*S+d*E,a[7]=c*f+u*x+d*w,a[2]=h*b+p*v+m*T,a[5]=h*g+p*S+m*E,a[8]=h*f+p*x+m*w,this}multiplyScalar(t){let n=this.elements;return n[0]*=t,n[3]*=t,n[6]*=t,n[1]*=t,n[4]*=t,n[7]*=t,n[2]*=t,n[5]*=t,n[8]*=t,this}determinant(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],u=t[8];return n*r*u-n*o*c-i*a*u+i*o*l+s*a*c-s*r*l}invert(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],u=t[8],d=u*r-o*c,h=o*l-u*a,p=c*a-r*l,m=n*d+i*h+s*p;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let b=1/m;return t[0]=d*b,t[1]=(s*c-u*i)*b,t[2]=(o*i-s*r)*b,t[3]=h*b,t[4]=(u*n-s*l)*b,t[5]=(s*a-o*n)*b,t[6]=p*b,t[7]=(i*l-c*n)*b,t[8]=(r*n-i*a)*b,this}transpose(){let t,n=this.elements;return t=n[1],n[1]=n[3],n[3]=t,t=n[2],n[2]=n[6],n[6]=t,t=n[5],n[5]=n[7],n[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let n=this.elements;return t[0]=n[0],t[1]=n[3],t[2]=n[6],t[3]=n[1],t[4]=n[4],t[5]=n[7],t[6]=n[2],t[7]=n[5],t[8]=n[8],this}setUvTransform(t,n,i,s,a,r,o){let l=Math.cos(a),c=Math.sin(a);return this.set(i*l,i*c,-i*(l*r+c*o)+r+t,-s*c,s*l,-s*(-c*r+l*o)+o+n,0,0,1),this}scale(t,n){return Br("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(fv.makeScale(t,n)),this}rotate(t){return Br("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(fv.makeRotation(-t)),this}translate(t,n){return Br("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(fv.makeTranslation(t,n)),this}makeTranslation(t,n){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,n,0,0,1),this}makeRotation(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(t,n){return this.set(t,0,0,0,n,0,0,0,1),this}equals(t){let n=this.elements,i=t.elements;for(let s=0;s<9;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<9;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){let i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}},fv=new kt,L1=new kt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),U1=new kt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function i2(){let e={enabled:!0,workingColorSpace:nu,spaces:{},convert:function(s,a,r){return this.enabled===!1||a===r||!a||!r||(this.spaces[a].transfer===ye&&(s.r=na(s.r),s.g=na(s.g),s.b=na(s.b)),this.spaces[a].primaries!==this.spaces[r].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===ye&&(s.r=gl(s.r),s.g=gl(s.g),s.b=gl(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===sa?iu:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,r){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return Br("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),e.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return Br("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),e.colorSpaceToWorking(s,a)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return e.define({[nu]:{primaries:t,whitePoint:i,transfer:iu,toXYZ:L1,fromXYZ:U1,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:wn},outputColorSpaceConfig:{drawingBufferColorSpace:wn}},[wn]:{primaries:t,whitePoint:i,transfer:ye,toXYZ:L1,fromXYZ:U1,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:wn}}}),e}var se=i2();function na(e){return e<.04045?e*.0773993808:Math.pow(e*.9478672986+.0521327014,2.4)}function gl(e){return e<.0031308?e*12.92:1.055*Math.pow(e,.41666)-.055}var Qo,Af=class{static getDataURL(t,n="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{Qo===void 0&&(Qo=au("canvas")),Qo.width=t.width,Qo.height=t.height;let s=Qo.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),i=Qo}return i.toDataURL(n)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let n=au("canvas");n.width=t.width,n.height=t.height;let i=n.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let s=i.getImageData(0,0,t.width,t.height),a=s.data;for(let r=0;r<a.length;r++)a[r]=na(a[r]/255)*255;return i.putImageData(s,0,0),n}else if(t.data){let n=t.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(na(n[i]/255)*255):n[i]=na(n[i]);return{data:n,width:t.width,height:t.height}}else return Pt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},s2=0,xl=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:s2++}),this.uuid=ea(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let n=this.data;return typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement?t.set(n.videoWidth,n.videoHeight,0):typeof VideoFrame<"u"&&n instanceof VideoFrame?t.set(n.displayWidth,n.displayHeight,0):n!==null?t.set(n.width,n.height,n.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let a;if(Array.isArray(s)){a=[];for(let r=0,o=s.length;r<o;r++)s[r].isDataTexture?a.push(pv(s[r].image)):a.push(pv(s[r]))}else a=pv(s);i.url=a}return n||(t.images[this.uuid]=i),i}};function pv(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap?Af.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(Pt("Texture: Unable to serialize Texture."),{})}var a2=0,mv=new O,Wn=class e extends ji{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,i=_s,s=_s,a=An,r=ir,o=Pi,l=Mi,c=e.DEFAULT_ANISOTROPY,u=sa){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:a2++}),this.uuid=ea(),this.name="",this.source=new xl(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=a,this.minFilter=r,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Ut(0,0),this.repeat=new Ut(1,1),this.center=new Ut(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new kt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(mv).x}get height(){return this.source.getSize(mv).y}get depth(){return this.source.getSize(mv).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let n in t){let i=t[n];if(i===void 0){Pt(`Texture.setValues(): parameter '${n}' has value of undefined.`);continue}let s=this[n];if(s===void 0){Pt(`Texture.setValues(): property '${n}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[n]=i}}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==iy)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Ef:t.x=t.x-Math.floor(t.x);break;case _s:t.x=t.x<0?0:1;break;case Tf:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Ef:t.y=t.y-Math.floor(t.y);break;case _s:t.y=t.y<0?0:1;break;case Tf:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Wn.DEFAULT_IMAGE=null;Wn.DEFAULT_MAPPING=iy;Wn.DEFAULT_ANISOTROPY=1;var qe=class e{static{e.prototype.isVector4=!0}constructor(t=0,n=0,i=0,s=1){this.x=t,this.y=n,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,n,i,s){return this.x=t,this.y=n,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this.w=t.w+n.w,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this.w+=t.w*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this.w=t.w-n.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let n=this.x,i=this.y,s=this.z,a=this.w,r=t.elements;return this.x=r[0]*n+r[4]*i+r[8]*s+r[12]*a,this.y=r[1]*n+r[5]*i+r[9]*s+r[13]*a,this.z=r[2]*n+r[6]*i+r[10]*s+r[14]*a,this.w=r[3]*n+r[7]*i+r[11]*s+r[15]*a,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let n=Math.sqrt(1-t.w*t.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/n,this.y=t.y/n,this.z=t.z/n),this}setAxisAngleFromRotationMatrix(t){let n,i,s,a,l=t.elements,c=l[0],u=l[4],d=l[8],h=l[1],p=l[5],m=l[9],b=l[2],g=l[6],f=l[10];if(Math.abs(u-h)<.01&&Math.abs(d-b)<.01&&Math.abs(m-g)<.01){if(Math.abs(u+h)<.1&&Math.abs(d+b)<.1&&Math.abs(m+g)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;let S=(c+1)/2,x=(p+1)/2,T=(f+1)/2,E=(u+h)/4,w=(d+b)/4,y=(m+g)/4;return S>x&&S>T?S<.01?(i=0,s=.707106781,a=.707106781):(i=Math.sqrt(S),s=E/i,a=w/i):x>T?x<.01?(i=.707106781,s=0,a=.707106781):(s=Math.sqrt(x),i=E/s,a=y/s):T<.01?(i=.707106781,s=.707106781,a=0):(a=Math.sqrt(T),i=w/a,s=y/a),this.set(i,s,a,n),this}let v=Math.sqrt((g-m)*(g-m)+(d-b)*(d-b)+(h-u)*(h-u));return Math.abs(v)<.001&&(v=1),this.x=(g-m)/v,this.y=(d-b)/v,this.z=(h-u)/v,this.w=Math.acos((c+p+f-1)/2),this}setFromMatrixPosition(t){let n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,n){return this.x=Zt(this.x,t.x,n.x),this.y=Zt(this.y,t.y,n.y),this.z=Zt(this.z,t.z,n.z),this.w=Zt(this.w,t.w,n.w),this}clampScalar(t,n){return this.x=Zt(this.x,t,n),this.y=Zt(this.y,t,n),this.z=Zt(this.z,t,n),this.w=Zt(this.w,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Zt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this.w+=(t.w-this.w)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this.w=t.w+(n.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this.w=t[n+3],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t[n+3]=this.w,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this.w=t.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Cf=class extends ji{constructor(t=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:An,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=n,this.depth=i.depth,this.scissor=new qe(0,0,t,n),this.scissorTest=!1,this.viewport=new qe(0,0,t,n),this.textures=[];let s={width:t,height:n,depth:i.depth},a=new Wn(s),r=i.count;for(let o=0;o<r;o++)this.textures[o]=a.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){let n={minFilter:An,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(n.mapping=t.mapping),t.wrapS!==void 0&&(n.wrapS=t.wrapS),t.wrapT!==void 0&&(n.wrapT=t.wrapT),t.wrapR!==void 0&&(n.wrapR=t.wrapR),t.magFilter!==void 0&&(n.magFilter=t.magFilter),t.minFilter!==void 0&&(n.minFilter=t.minFilter),t.format!==void 0&&(n.format=t.format),t.type!==void 0&&(n.type=t.type),t.anisotropy!==void 0&&(n.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(n.colorSpace=t.colorSpace),t.flipY!==void 0&&(n.flipY=t.flipY),t.generateMipmaps!==void 0&&(n.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(n.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,n,i=1){if(this.width!==t||this.height!==n||this.depth!==i){this.width=t,this.height=n,this.depth=i;for(let s=0,a=this.textures.length;s<a;s++)this.textures[s].image.width=t,this.textures[s].image.height=n,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,n),this.scissor.set(0,0,t,n)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++){this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;let s=Object.assign({},t.textures[n].image);this.textures[n].source=new xl(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let n=t.depthTexture.clone();n.renderTarget=null,this.depthTexture=n}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},si=class extends Cf{constructor(t=1,n=1,i={}){super(t,n,i),this.isWebGLRenderTarget=!0}},ou=class extends Wn{constructor(t=null,n=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=vn,this.minFilter=vn,this.wrapR=_s,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Rf=class extends Wn{constructor(t=null,n=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=vn,this.minFilter=vn,this.wrapR=_s,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var Oe=class e{static{e.prototype.isMatrix4=!0}constructor(t,n,i,s,a,r,o,l,c,u,d,h,p,m,b,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,r,o,l,c,u,d,h,p,m,b,g)}set(t,n,i,s,a,r,o,l,c,u,d,h,p,m,b,g){let f=this.elements;return f[0]=t,f[4]=n,f[8]=i,f[12]=s,f[1]=a,f[5]=r,f[9]=o,f[13]=l,f[2]=c,f[6]=u,f[10]=d,f[14]=h,f[3]=p,f[7]=m,f[11]=b,f[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(t){let n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(t){let n=this.elements,i=t.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(t){let n=t.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(t,n,i){return this.determinantAffine()===0?(t.set(1,0,0),n.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,n,i){return this.set(t.x,n.x,i.x,0,t.y,n.y,i.y,0,t.z,n.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let n=this.elements,i=t.elements,s=1/tl.setFromMatrixColumn(t,0).length(),a=1/tl.setFromMatrixColumn(t,1).length(),r=1/tl.setFromMatrixColumn(t,2).length();return n[0]=i[0]*s,n[1]=i[1]*s,n[2]=i[2]*s,n[3]=0,n[4]=i[4]*a,n[5]=i[5]*a,n[6]=i[6]*a,n[7]=0,n[8]=i[8]*r,n[9]=i[9]*r,n[10]=i[10]*r,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(t){let n=this.elements,i=t.x,s=t.y,a=t.z,r=Math.cos(i),o=Math.sin(i),l=Math.cos(s),c=Math.sin(s),u=Math.cos(a),d=Math.sin(a);if(t.order==="XYZ"){let h=r*u,p=r*d,m=o*u,b=o*d;n[0]=l*u,n[4]=-l*d,n[8]=c,n[1]=p+m*c,n[5]=h-b*c,n[9]=-o*l,n[2]=b-h*c,n[6]=m+p*c,n[10]=r*l}else if(t.order==="YXZ"){let h=l*u,p=l*d,m=c*u,b=c*d;n[0]=h+b*o,n[4]=m*o-p,n[8]=r*c,n[1]=r*d,n[5]=r*u,n[9]=-o,n[2]=p*o-m,n[6]=b+h*o,n[10]=r*l}else if(t.order==="ZXY"){let h=l*u,p=l*d,m=c*u,b=c*d;n[0]=h-b*o,n[4]=-r*d,n[8]=m+p*o,n[1]=p+m*o,n[5]=r*u,n[9]=b-h*o,n[2]=-r*c,n[6]=o,n[10]=r*l}else if(t.order==="ZYX"){let h=r*u,p=r*d,m=o*u,b=o*d;n[0]=l*u,n[4]=m*c-p,n[8]=h*c+b,n[1]=l*d,n[5]=b*c+h,n[9]=p*c-m,n[2]=-c,n[6]=o*l,n[10]=r*l}else if(t.order==="YZX"){let h=r*l,p=r*c,m=o*l,b=o*c;n[0]=l*u,n[4]=b-h*d,n[8]=m*d+p,n[1]=d,n[5]=r*u,n[9]=-o*u,n[2]=-c*u,n[6]=p*d+m,n[10]=h-b*d}else if(t.order==="XZY"){let h=r*l,p=r*c,m=o*l,b=o*c;n[0]=l*u,n[4]=-d,n[8]=c*u,n[1]=h*d+b,n[5]=r*u,n[9]=p*d-m,n[2]=m*d-p,n[6]=o*u,n[10]=b*d+h}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(t){return this.compose(r2,t,o2)}lookAt(t,n,i){let s=this.elements;return vi.subVectors(t,n),vi.lengthSq()===0&&(vi.z=1),vi.normalize(),Ga.crossVectors(i,vi),Ga.lengthSq()===0&&(Math.abs(i.z)===1?vi.x+=1e-4:vi.z+=1e-4,vi.normalize(),Ga.crossVectors(i,vi)),Ga.normalize(),Vd.crossVectors(vi,Ga),s[0]=Ga.x,s[4]=Vd.x,s[8]=vi.x,s[1]=Ga.y,s[5]=Vd.y,s[9]=vi.y,s[2]=Ga.z,s[6]=Vd.z,s[10]=vi.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){let i=t.elements,s=n.elements,a=this.elements,r=i[0],o=i[4],l=i[8],c=i[12],u=i[1],d=i[5],h=i[9],p=i[13],m=i[2],b=i[6],g=i[10],f=i[14],v=i[3],S=i[7],x=i[11],T=i[15],E=s[0],w=s[4],y=s[8],C=s[12],D=s[1],z=s[5],X=s[9],H=s[13],A=s[2],L=s[6],F=s[10],W=s[14],J=s[3],Y=s[7],$=s[11],at=s[15];return a[0]=r*E+o*D+l*A+c*J,a[4]=r*w+o*z+l*L+c*Y,a[8]=r*y+o*X+l*F+c*$,a[12]=r*C+o*H+l*W+c*at,a[1]=u*E+d*D+h*A+p*J,a[5]=u*w+d*z+h*L+p*Y,a[9]=u*y+d*X+h*F+p*$,a[13]=u*C+d*H+h*W+p*at,a[2]=m*E+b*D+g*A+f*J,a[6]=m*w+b*z+g*L+f*Y,a[10]=m*y+b*X+g*F+f*$,a[14]=m*C+b*H+g*W+f*at,a[3]=v*E+S*D+x*A+T*J,a[7]=v*w+S*z+x*L+T*Y,a[11]=v*y+S*X+x*F+T*$,a[15]=v*C+S*H+x*W+T*at,this}multiplyScalar(t){let n=this.elements;return n[0]*=t,n[4]*=t,n[8]*=t,n[12]*=t,n[1]*=t,n[5]*=t,n[9]*=t,n[13]*=t,n[2]*=t,n[6]*=t,n[10]*=t,n[14]*=t,n[3]*=t,n[7]*=t,n[11]*=t,n[15]*=t,this}determinant(){let t=this.elements,n=t[0],i=t[4],s=t[8],a=t[12],r=t[1],o=t[5],l=t[9],c=t[13],u=t[2],d=t[6],h=t[10],p=t[14],m=t[3],b=t[7],g=t[11],f=t[15],v=l*p-c*h,S=o*p-c*d,x=o*h-l*d,T=r*p-c*u,E=r*h-l*u,w=r*d-o*u;return n*(b*v-g*S+f*x)-i*(m*v-g*T+f*E)+s*(m*S-b*T+f*w)-a*(m*x-b*E+g*w)}determinantAffine(){let t=this.elements,n=t[0],i=t[4],s=t[8],a=t[1],r=t[5],o=t[9],l=t[2],c=t[6],u=t[10];return n*(r*u-o*c)-i*(a*u-o*l)+s*(a*c-r*l)}transpose(){let t=this.elements,n;return n=t[1],t[1]=t[4],t[4]=n,n=t[2],t[2]=t[8],t[8]=n,n=t[6],t[6]=t[9],t[9]=n,n=t[3],t[3]=t[12],t[12]=n,n=t[7],t[7]=t[13],t[13]=n,n=t[11],t[11]=t[14],t[14]=n,this}setPosition(t,n,i){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=n,s[14]=i),this}invert(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],u=t[8],d=t[9],h=t[10],p=t[11],m=t[12],b=t[13],g=t[14],f=t[15],v=n*o-i*r,S=n*l-s*r,x=n*c-a*r,T=i*l-s*o,E=i*c-a*o,w=s*c-a*l,y=u*b-d*m,C=u*g-h*m,D=u*f-p*m,z=d*g-h*b,X=d*f-p*b,H=h*f-p*g,A=v*H-S*X+x*z+T*D-E*C+w*y;if(A===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let L=1/A;return t[0]=(o*H-l*X+c*z)*L,t[1]=(s*X-i*H-a*z)*L,t[2]=(b*w-g*E+f*T)*L,t[3]=(h*E-d*w-p*T)*L,t[4]=(l*D-r*H-c*C)*L,t[5]=(n*H-s*D+a*C)*L,t[6]=(g*x-m*w-f*S)*L,t[7]=(u*w-h*x+p*S)*L,t[8]=(r*X-o*D+c*y)*L,t[9]=(i*D-n*X-a*y)*L,t[10]=(m*E-b*x+f*v)*L,t[11]=(d*x-u*E-p*v)*L,t[12]=(o*C-r*z-l*y)*L,t[13]=(n*z-i*C+s*y)*L,t[14]=(b*S-m*T-g*v)*L,t[15]=(u*T-d*S+h*v)*L,this}scale(t){let n=this.elements,i=t.x,s=t.y,a=t.z;return n[0]*=i,n[4]*=s,n[8]*=a,n[1]*=i,n[5]*=s,n[9]*=a,n[2]*=i,n[6]*=s,n[10]*=a,n[3]*=i,n[7]*=s,n[11]*=a,this}getMaxScaleOnAxis(){let t=this.elements,n=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(n,i,s))}makeTranslation(t,n,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(t){let n=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,n){let i=Math.cos(n),s=Math.sin(n),a=1-i,r=t.x,o=t.y,l=t.z,c=a*r,u=a*o;return this.set(c*r+i,c*o-s*l,c*l+s*o,0,c*o+s*l,u*o+i,u*l-s*r,0,c*l-s*o,u*l+s*r,a*l*l+i,0,0,0,0,1),this}makeScale(t,n,i){return this.set(t,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,n,i,s,a,r){return this.set(1,i,a,0,t,1,r,0,n,s,1,0,0,0,0,1),this}compose(t,n,i){let s=this.elements,a=n._x,r=n._y,o=n._z,l=n._w,c=a+a,u=r+r,d=o+o,h=a*c,p=a*u,m=a*d,b=r*u,g=r*d,f=o*d,v=l*c,S=l*u,x=l*d,T=i.x,E=i.y,w=i.z;return s[0]=(1-(b+f))*T,s[1]=(p+x)*T,s[2]=(m-S)*T,s[3]=0,s[4]=(p-x)*E,s[5]=(1-(h+f))*E,s[6]=(g+v)*E,s[7]=0,s[8]=(m+S)*w,s[9]=(g-v)*w,s[10]=(1-(h+b))*w,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,n,i){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let a=this.determinantAffine();if(a===0)return i.set(1,1,1),n.identity(),this;let r=tl.set(s[0],s[1],s[2]).length(),o=tl.set(s[4],s[5],s[6]).length(),l=tl.set(s[8],s[9],s[10]).length();a<0&&(r=-r),ki.copy(this);let c=1/r,u=1/o,d=1/l;return ki.elements[0]*=c,ki.elements[1]*=c,ki.elements[2]*=c,ki.elements[4]*=u,ki.elements[5]*=u,ki.elements[6]*=u,ki.elements[8]*=d,ki.elements[9]*=d,ki.elements[10]*=d,n.setFromRotationMatrix(ki),i.x=r,i.y=o,i.z=l,this}makePerspective(t,n,i,s,a,r,o=Yi,l=!1){let c=this.elements,u=2*a/(n-t),d=2*a/(i-s),h=(n+t)/(n-t),p=(i+s)/(i-s),m,b;if(l)m=a/(r-a),b=r*a/(r-a);else if(o===Yi)m=-(r+a)/(r-a),b=-2*r*a/(r-a);else if(o===su)m=-r/(r-a),b=-r*a/(r-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=h,c[12]=0,c[1]=0,c[5]=d,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=m,c[14]=b,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,n,i,s,a,r,o=Yi,l=!1){let c=this.elements,u=2/(n-t),d=2/(i-s),h=-(n+t)/(n-t),p=-(i+s)/(i-s),m,b;if(l)m=1/(r-a),b=r/(r-a);else if(o===Yi)m=-2/(r-a),b=-(r+a)/(r-a);else if(o===su)m=-1/(r-a),b=-a/(r-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=u,c[4]=0,c[8]=0,c[12]=h,c[1]=0,c[5]=d,c[9]=0,c[13]=p,c[2]=0,c[6]=0,c[10]=m,c[14]=b,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let n=this.elements,i=t.elements;for(let s=0;s<16;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<16;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){let i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t[n+9]=i[9],t[n+10]=i[10],t[n+11]=i[11],t[n+12]=i[12],t[n+13]=i[13],t[n+14]=i[14],t[n+15]=i[15],t}},tl=new O,ki=new Oe,r2=new O(0,0,0),o2=new O(1,1,1),Ga=new O,Vd=new O,vi=new O,I1=new Oe,P1=new xi,Wa=class e{constructor(t=0,n=0,i=0,s=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,n,i,s=this._order){return this._x=t,this._y=n,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,n=this._order,i=!0){let s=t.elements,a=s[0],r=s[4],o=s[8],l=s[1],c=s[5],u=s[9],d=s[2],h=s[6],p=s[10];switch(n){case"XYZ":this._y=Math.asin(Zt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-r,a)):(this._x=Math.atan2(h,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Zt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,a),this._z=0);break;case"ZXY":this._x=Math.asin(Zt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Zt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,p),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(Zt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-u,c),this._y=Math.atan2(-d,a)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Zt(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(h,c),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-u,p),this._y=0);break;default:Pt("Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,n,i){return I1.makeRotationFromQuaternion(t),this.setFromRotationMatrix(I1,n,i)}setFromVector3(t,n=this._order){return this.set(t.x,t.y,t.z,n)}reorder(t){return P1.setFromEuler(this),this.setFromQuaternion(P1,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Wa.DEFAULT_ORDER="XYZ";var bl=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},l2=0,O1=new O,el=new xi,js=new Oe,kd=new O,Wc=new O,c2=new O,u2=new xi,B1=new O(1,0,0),z1=new O(0,1,0),F1=new O(0,0,1),G1={type:"added"},h2={type:"removed"},nl={type:"childadded",child:null},gv={type:"childremoved",child:null},qn=class e extends ji{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:l2++}),this.uuid=ea(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new O,n=new Wa,i=new xi,s=new O(1,1,1);function a(){i.setFromEuler(n,!1)}function r(){n.setFromQuaternion(i,void 0,!1)}n._onChange(a),i._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Oe},normalMatrix:{value:new kt}}),this.matrix=new Oe,this.matrixWorld=new Oe,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new bl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,n){this.quaternion.setFromAxisAngle(t,n)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,n){return el.setFromAxisAngle(t,n),this.quaternion.multiply(el),this}rotateOnWorldAxis(t,n){return el.setFromAxisAngle(t,n),this.quaternion.premultiply(el),this}rotateX(t){return this.rotateOnAxis(B1,t)}rotateY(t){return this.rotateOnAxis(z1,t)}rotateZ(t){return this.rotateOnAxis(F1,t)}translateOnAxis(t,n){return O1.copy(t).applyQuaternion(this.quaternion),this.position.add(O1.multiplyScalar(n)),this}translateX(t){return this.translateOnAxis(B1,t)}translateY(t){return this.translateOnAxis(z1,t)}translateZ(t){return this.translateOnAxis(F1,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(js.copy(this.matrixWorld).invert())}lookAt(t,n,i){t.isVector3?kd.copy(t):kd.set(t,n,i);let s=this.parent;this.updateWorldMatrix(!0,!1),Wc.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?js.lookAt(Wc,kd,this.up):js.lookAt(kd,Wc,this.up),this.quaternion.setFromRotationMatrix(js),s&&(js.extractRotation(s.matrixWorld),el.setFromRotationMatrix(js),this.quaternion.premultiply(el.invert()))}add(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return t===this?(zt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(G1),nl.child=t,this.dispatchEvent(nl),nl.child=null):zt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let n=this.children.indexOf(t);return n!==-1&&(t.parent=null,this.children.splice(n,1),t.dispatchEvent(h2),gv.child=t,this.dispatchEvent(gv),gv.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),js.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),js.multiply(t.parent.matrixWorld)),t.applyMatrix4(js),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(G1),nl.child=t,this.dispatchEvent(nl),nl.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,n){if(this[t]===n)return this;for(let i=0,s=this.children.length;i<s;i++){let r=this.children[i].getObjectByProperty(t,n);if(r!==void 0)return r}}getObjectsByProperty(t,n,i=[]){this[t]===n&&i.push(this);let s=this.children;for(let a=0,r=s.length;a<r;a++)s[a].getObjectsByProperty(t,n,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wc,t,c2),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wc,u2,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let n=this.matrixWorld.elements;return t.set(n[8],n[9],n[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverseVisible(t)}traverseAncestors(t){let n=this.parent;n!==null&&(t(n),n.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let n=t.x,i=t.y,s=t.z,a=this.matrix.elements;a[12]+=n-a[0]*n-a[4]*i-a[8]*s,a[13]+=i-a[1]*n-a[5]*i-a[9]*s,a[14]+=s-a[2]*n-a[6]*i-a[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].updateMatrixWorld(t)}updateWorldMatrix(t,n,i=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),n===!0){let a=this.children;for(let r=0,o=a.length;r<o;r++)a[r].updateWorldMatrix(!1,!0,i)}}toJSON(t){let n=t===void 0||typeof t=="string",i={};n&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function a(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=a(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,u=l.length;c<u;c++){let d=l[c];a(t.shapes,d)}else a(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(a(t.materials,this.material[l]));s.material=o}else s.material=a(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(a(t.animations,l))}}if(n){let o=r(t.geometries),l=r(t.materials),c=r(t.textures),u=r(t.images),d=r(t.shapes),h=r(t.skeletons),p=r(t.animations),m=r(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),u.length>0&&(i.images=u),d.length>0&&(i.shapes=d),h.length>0&&(i.skeletons=h),p.length>0&&(i.animations=p),m.length>0&&(i.nodes=m)}return i.object=s,i;function r(o){let l=[];for(let c in o){let u=o[c];delete u.metadata,l.push(u)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,n=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),n===!0)for(let i=0;i<t.children.length;i++){let s=t.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};qn.DEFAULT_UP=new O(0,1,0);qn.DEFAULT_MATRIX_AUTO_UPDATE=!0;qn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ta=class extends qn{constructor(){super(),this.isGroup=!0,this.type="Group"}},d2={type:"move"},Sl=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ta,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ta,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new O,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new O),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ta,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new O,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new O,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let n=this._hand;if(n)for(let i of t.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,n,i){let s=null,a=null,r=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&n.session.visibilityState!=="visible-blurred"){if(c&&t.hand){r=!0;for(let b of t.hand.values()){let g=n.getJointPose(b,i),f=this._getHandJoint(c,b);g!==null&&(f.matrix.fromArray(g.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=g.radius),f.visible=g!==null}let u=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],h=u.position.distanceTo(d.position),p=.02,m=.005;c.inputState.pinching&&h>p+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&h<=p-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(a=n.getPose(t.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=n.getPose(t.targetRaySpace,i),s===null&&a!==null&&(s=a),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(d2)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(t,n){if(t.joints[n.jointName]===void 0){let i=new ta;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[n.jointName]=i,t.add(i)}return t.joints[n.jointName]}},GE={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ha={h:0,s:0,l:0},Xd={h:0,s:0,l:0};function vv(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var Yt=class{constructor(t,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,n,i)}set(t,n,i){if(n===void 0&&i===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,n,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,n=wn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,se.colorSpaceToWorking(this,n),this}setRGB(t,n,i,s=se.workingColorSpace){return this.r=t,this.g=n,this.b=i,se.colorSpaceToWorking(this,s),this}setHSL(t,n,i,s=se.workingColorSpace){if(t=py(t,1),n=Zt(n,0,1),i=Zt(i,0,1),n===0)this.r=this.g=this.b=i;else{let a=i<=.5?i*(1+n):i+n-i*n,r=2*i-a;this.r=vv(r,a,t+1/3),this.g=vv(r,a,t),this.b=vv(r,a,t-1/3)}return se.colorSpaceToWorking(this,s),this}setStyle(t,n=wn){function i(a){a!==void 0&&parseFloat(a)<1&&Pt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let a,r=s[1],o=s[2];switch(r){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,n);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,n);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,n);break;default:Pt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let a=s[1],r=a.length;if(r===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,n);if(r===6)return this.setHex(parseInt(a,16),n);Pt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,n);return this}setColorName(t,n=wn){let i=GE[t.toLowerCase()];return i!==void 0?this.setHex(i,n):Pt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=na(t.r),this.g=na(t.g),this.b=na(t.b),this}copyLinearToSRGB(t){return this.r=gl(t.r),this.g=gl(t.g),this.b=gl(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=wn){return se.workingToColorSpace(In.copy(this),t),Math.round(Zt(In.r*255,0,255))*65536+Math.round(Zt(In.g*255,0,255))*256+Math.round(Zt(In.b*255,0,255))}getHexString(t=wn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,n=se.workingColorSpace){se.workingToColorSpace(In.copy(this),n);let i=In.r,s=In.g,a=In.b,r=Math.max(i,s,a),o=Math.min(i,s,a),l,c,u=(o+r)/2;if(o===r)l=0,c=0;else{let d=r-o;switch(c=u<=.5?d/(r+o):d/(2-r-o),r){case i:l=(s-a)/d+(s<a?6:0);break;case s:l=(a-i)/d+2;break;case a:l=(i-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=u,t}getRGB(t,n=se.workingColorSpace){return se.workingToColorSpace(In.copy(this),n),t.r=In.r,t.g=In.g,t.b=In.b,t}getStyle(t=wn){se.workingToColorSpace(In.copy(this),t);let n=In.r,i=In.g,s=In.b;return t!==wn?`color(${t} ${n.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,n,i){return this.getHSL(Ha),this.setHSL(Ha.h+t,Ha.s+n,Ha.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,n){return this.r=t.r+n.r,this.g=t.g+n.g,this.b=t.b+n.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,n){return this.r+=(t.r-this.r)*n,this.g+=(t.g-this.g)*n,this.b+=(t.b-this.b)*n,this}lerpColors(t,n,i){return this.r=t.r+(n.r-t.r)*i,this.g=t.g+(n.g-t.g)*i,this.b=t.b+(n.b-t.b)*i,this}lerpHSL(t,n){this.getHSL(Ha),t.getHSL(Xd);let i=tu(Ha.h,Xd.h,n),s=tu(Ha.s,Xd.s,n),a=tu(Ha.l,Xd.l,n);return this.setHSL(i,s,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let n=this.r,i=this.g,s=this.b,a=t.elements;return this.r=a[0]*n+a[3]*i+a[6]*s,this.g=a[1]*n+a[4]*i+a[7]*s,this.b=a[2]*n+a[5]*i+a[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,n=0){return this.r=t[n],this.g=t[n+1],this.b=t[n+2],this}toArray(t=[],n=0){return t[n]=this.r,t[n+1]=this.g,t[n+2]=this.b,t}fromBufferAttribute(t,n){return this.r=t.getX(n),this.g=t.getY(n),this.b=t.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},In=new Yt;Yt.NAMES=GE;var lu=class e{constructor(t,n=25e-5){this.isFogExp2=!0,this.name="",this.color=new Yt(t),this.density=n}clone(){return new e(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var cu=class extends qn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Wa,this.environmentIntensity=1,this.environmentRotation=new Wa,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,n){return super.copy(t,n),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let n=super.toJSON(t);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),n.object.backgroundBlurriness=this.backgroundBlurriness,n.object.backgroundIntensity=this.backgroundIntensity,n.object.backgroundRotation=this.backgroundRotation.toArray(),n.object.environmentIntensity=this.environmentIntensity,n.object.environmentRotation=this.environmentRotation.toArray(),n}},Xi=new O,Zs=new O,yv=new O,Ks=new O,il=new O,sl=new O,H1=new O,_v=new O,xv=new O,bv=new O,Sv=new qe,Mv=new qe,Ev=new qe,Qs=class e{constructor(t=new O,n=new O,i=new O){this.a=t,this.b=n,this.c=i}static getNormal(t,n,i,s){s.subVectors(i,n),Xi.subVectors(t,n),s.cross(Xi);let a=s.lengthSq();return a>0?s.multiplyScalar(1/Math.sqrt(a)):s.set(0,0,0)}static getBarycoord(t,n,i,s,a){Xi.subVectors(s,n),Zs.subVectors(i,n),yv.subVectors(t,n);let r=Xi.dot(Xi),o=Xi.dot(Zs),l=Xi.dot(yv),c=Zs.dot(Zs),u=Zs.dot(yv),d=r*c-o*o;if(d===0)return a.set(0,0,0),null;let h=1/d,p=(c*l-o*u)*h,m=(r*u-o*l)*h;return a.set(1-p-m,m,p)}static containsPoint(t,n,i,s){return this.getBarycoord(t,n,i,s,Ks)===null?!1:Ks.x>=0&&Ks.y>=0&&Ks.x+Ks.y<=1}static getInterpolation(t,n,i,s,a,r,o,l){return this.getBarycoord(t,n,i,s,Ks)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,Ks.x),l.addScaledVector(r,Ks.y),l.addScaledVector(o,Ks.z),l)}static getInterpolatedAttribute(t,n,i,s,a,r){return Sv.setScalar(0),Mv.setScalar(0),Ev.setScalar(0),Sv.fromBufferAttribute(t,n),Mv.fromBufferAttribute(t,i),Ev.fromBufferAttribute(t,s),r.setScalar(0),r.addScaledVector(Sv,a.x),r.addScaledVector(Mv,a.y),r.addScaledVector(Ev,a.z),r}static isFrontFacing(t,n,i,s){return Xi.subVectors(i,n),Zs.subVectors(t,n),Xi.cross(Zs).dot(s)<0}set(t,n,i){return this.a.copy(t),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(t,n,i,s){return this.a.copy(t[n]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,n,i,s){return this.a.fromBufferAttribute(t,n),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Xi.subVectors(this.c,this.b),Zs.subVectors(this.a,this.b),Xi.cross(Zs).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,i,s,a){return e.getInterpolation(t,this.a,this.b,this.c,n,i,s,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,n){let i=this.a,s=this.b,a=this.c,r,o;il.subVectors(s,i),sl.subVectors(a,i),_v.subVectors(t,i);let l=il.dot(_v),c=sl.dot(_v);if(l<=0&&c<=0)return n.copy(i);xv.subVectors(t,s);let u=il.dot(xv),d=sl.dot(xv);if(u>=0&&d<=u)return n.copy(s);let h=l*d-u*c;if(h<=0&&l>=0&&u<=0)return r=l/(l-u),n.copy(i).addScaledVector(il,r);bv.subVectors(t,a);let p=il.dot(bv),m=sl.dot(bv);if(m>=0&&p<=m)return n.copy(a);let b=p*c-l*m;if(b<=0&&c>=0&&m<=0)return o=c/(c-m),n.copy(i).addScaledVector(sl,o);let g=u*m-p*d;if(g<=0&&d-u>=0&&p-m>=0)return H1.subVectors(a,s),o=(d-u)/(d-u+(p-m)),n.copy(s).addScaledVector(H1,o);let f=1/(g+b+h);return r=b*f,o=h*f,n.copy(i).addScaledVector(il,r).addScaledVector(sl,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},bs=class{constructor(t=new O(1/0,1/0,1/0),n=new O(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=n}set(t,n){return this.min.copy(t),this.max.copy(n),this}setFromArray(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n+=3)this.expandByPoint(Wi.fromArray(t,n));return this}setFromBufferAttribute(t){this.makeEmpty();for(let n=0,i=t.count;n<i;n++)this.expandByPoint(Wi.fromBufferAttribute(t,n));return this}setFromPoints(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n++)this.expandByPoint(t[n]);return this}setFromCenterAndSize(t,n){let i=Wi.copy(n).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,n=!1){return this.makeEmpty(),this.expandByObject(t,n)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,n=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let a=i.getAttribute("position");if(n===!0&&a!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=a.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,Wi):Wi.fromBufferAttribute(a,r),Wi.applyMatrix4(t.matrixWorld),this.expandByPoint(Wi);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Wd.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Wd.copy(i.boundingBox)),Wd.applyMatrix4(t.matrixWorld),this.union(Wd)}let s=t.children;for(let a=0,r=s.length;a<r;a++)this.expandByObject(s[a],n);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,n){return n.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Wi),Wi.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let n,i;return t.normal.x>0?(n=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(n=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(n+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(n+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(n+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(n+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),n<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(qc),qd.subVectors(this.max,qc),al.subVectors(t.a,qc),rl.subVectors(t.b,qc),ol.subVectors(t.c,qc),Va.subVectors(rl,al),ka.subVectors(ol,rl),Ur.subVectors(al,ol);let n=[0,-Va.z,Va.y,0,-ka.z,ka.y,0,-Ur.z,Ur.y,Va.z,0,-Va.x,ka.z,0,-ka.x,Ur.z,0,-Ur.x,-Va.y,Va.x,0,-ka.y,ka.x,0,-Ur.y,Ur.x,0];return!Tv(n,al,rl,ol,qd)||(n=[1,0,0,0,1,0,0,0,1],!Tv(n,al,rl,ol,qd))?!1:(Yd.crossVectors(Va,ka),n=[Yd.x,Yd.y,Yd.z],Tv(n,al,rl,ol,qd))}clampPoint(t,n){return n.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Wi).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Wi).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Js[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Js[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Js[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Js[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Js[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Js[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Js[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Js[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Js),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},Js=[new O,new O,new O,new O,new O,new O,new O,new O],Wi=new O,Wd=new bs,al=new O,rl=new O,ol=new O,Va=new O,ka=new O,Ur=new O,qc=new O,qd=new O,Yd=new O,Ir=new O;function Tv(e,t,n,i,s){for(let a=0,r=e.length-3;a<=r;a+=3){Ir.fromArray(e,a);let o=s.x*Math.abs(Ir.x)+s.y*Math.abs(Ir.y)+s.z*Math.abs(Ir.z),l=t.dot(Ir),c=n.dot(Ir),u=i.dot(Ir);if(Math.max(-Math.max(l,c,u),Math.min(l,c,u))>o)return!1}return!0}var nn=new O,jd=new Ut,f2=0,Xn=class extends ji{constructor(t,n,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:f2++}),this.name="",this.array=t,this.itemSize=n,this.count=t!==void 0?t.length/n:0,this.normalized=i,this.usage=dy,this.updateRanges=[],this.gpuType=Ji,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,n,i){t*=this.itemSize,i*=n.itemSize;for(let s=0,a=this.itemSize;s<a;s++)this.array[t+s]=n.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)jd.fromBufferAttribute(this,n),jd.applyMatrix3(t),this.setXY(n,jd.x,jd.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)nn.fromBufferAttribute(this,n),nn.applyMatrix3(t),this.setXYZ(n,nn.x,nn.y,nn.z);return this}applyMatrix4(t){for(let n=0,i=this.count;n<i;n++)nn.fromBufferAttribute(this,n),nn.applyMatrix4(t),this.setXYZ(n,nn.x,nn.y,nn.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)nn.fromBufferAttribute(this,n),nn.applyNormalMatrix(t),this.setXYZ(n,nn.x,nn.y,nn.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)nn.fromBufferAttribute(this,n),nn.transformDirection(t),this.setXYZ(n,nn.x,nn.y,nn.z);return this}set(t,n=0){return this.array.set(t,n),this}getComponent(t,n){let i=this.array[t*this.itemSize+n];return this.normalized&&(i=qi(i,this.array)),i}setComponent(t,n,i){return this.normalized&&(i=Se(i,this.array)),this.array[t*this.itemSize+n]=i,this}getX(t){let n=this.array[t*this.itemSize];return this.normalized&&(n=qi(n,this.array)),n}setX(t,n){return this.normalized&&(n=Se(n,this.array)),this.array[t*this.itemSize]=n,this}getY(t){let n=this.array[t*this.itemSize+1];return this.normalized&&(n=qi(n,this.array)),n}setY(t,n){return this.normalized&&(n=Se(n,this.array)),this.array[t*this.itemSize+1]=n,this}getZ(t){let n=this.array[t*this.itemSize+2];return this.normalized&&(n=qi(n,this.array)),n}setZ(t,n){return this.normalized&&(n=Se(n,this.array)),this.array[t*this.itemSize+2]=n,this}getW(t){let n=this.array[t*this.itemSize+3];return this.normalized&&(n=qi(n,this.array)),n}setW(t,n){return this.normalized&&(n=Se(n,this.array)),this.array[t*this.itemSize+3]=n,this}setXY(t,n,i){return t*=this.itemSize,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array)),this.array[t+0]=n,this.array[t+1]=i,this}setXYZ(t,n,i,s){return t*=this.itemSize,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array),s=Se(s,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,n,i,s,a){return t*=this.itemSize,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array),s=Se(s,this.array),a=Se(a,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var uu=class extends Xn{constructor(t,n,i){super(new Uint16Array(t),n,i)}};var hu=class extends Xn{constructor(t,n,i){super(new Uint32Array(t),n,i)}};var On=class extends Xn{constructor(t,n,i){super(new Float32Array(t),n,i)}},p2=new bs,Yc=new O,wv=new O,Ss=class{constructor(t=new O,n=-1){this.isSphere=!0,this.center=t,this.radius=n}set(t,n){return this.center.copy(t),this.radius=n,this}setFromPoints(t,n){let i=this.center;n!==void 0?i.copy(n):p2.setFromPoints(t).getCenter(i);let s=0;for(let a=0,r=t.length;a<r;a++)s=Math.max(s,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let n=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=n*n}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,n){let i=this.center.distanceToSquared(t);return n.copy(t),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Yc.subVectors(t,this.center);let n=Yc.lengthSq();if(n>this.radius*this.radius){let i=Math.sqrt(n),s=(i-this.radius)*.5;this.center.addScaledVector(Yc,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(wv.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Yc.copy(t.center).add(wv)),this.expandByPoint(Yc.copy(t.center).sub(wv))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},m2=0,Ii=new Oe,Av=new qn,ll=new O,yi=new bs,jc=new bs,gn=new O,yn=class e extends ji{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:m2++}),this.uuid=ea(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(FR(t)?hu:uu)(t,1):this.index=t,this}setIndirect(t,n=0){return this.indirect=t,this.indirectOffset=n,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,n){return this.attributes[t]=n,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,n,i=0){this.groups.push({start:t,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,n){this.drawRange.start=t,this.drawRange.count=n}applyMatrix4(t){let n=this.attributes.position;n!==void 0&&(n.applyMatrix4(t),n.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let a=new kt().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Ii.makeRotationFromQuaternion(t),this.applyMatrix4(Ii),this}rotateX(t){return Ii.makeRotationX(t),this.applyMatrix4(Ii),this}rotateY(t){return Ii.makeRotationY(t),this.applyMatrix4(Ii),this}rotateZ(t){return Ii.makeRotationZ(t),this.applyMatrix4(Ii),this}translate(t,n,i){return Ii.makeTranslation(t,n,i),this.applyMatrix4(Ii),this}scale(t,n,i){return Ii.makeScale(t,n,i),this.applyMatrix4(Ii),this}lookAt(t){return Av.lookAt(t),Av.updateMatrix(),this.applyMatrix4(Av.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ll).negate(),this.translate(ll.x,ll.y,ll.z),this}setFromPoints(t){let n=this.getAttribute("position");if(n===void 0){let i=[];for(let s=0,a=t.length;s<a;s++){let r=t[s];i.push(r.x,r.y,r.z||0)}this.setAttribute("position",new On(i,3))}else{let i=Math.min(t.length,n.count);for(let s=0;s<i;s++){let a=t[s];n.setXYZ(s,a.x,a.y,a.z||0)}t.length>n.count&&Pt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new bs);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){zt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new O(-1/0,-1/0,-1/0),new O(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),n)for(let i=0,s=n.length;i<s;i++){let a=n[i];yi.setFromBufferAttribute(a),this.morphTargetsRelative?(gn.addVectors(this.boundingBox.min,yi.min),this.boundingBox.expandByPoint(gn),gn.addVectors(this.boundingBox.max,yi.max),this.boundingBox.expandByPoint(gn)):(this.boundingBox.expandByPoint(yi.min),this.boundingBox.expandByPoint(yi.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&zt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ss);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){zt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new O,1/0);return}if(t){let i=this.boundingSphere.center;if(yi.setFromBufferAttribute(t),n)for(let a=0,r=n.length;a<r;a++){let o=n[a];jc.setFromBufferAttribute(o),this.morphTargetsRelative?(gn.addVectors(yi.min,jc.min),yi.expandByPoint(gn),gn.addVectors(yi.max,jc.max),yi.expandByPoint(gn)):(yi.expandByPoint(jc.min),yi.expandByPoint(jc.max))}yi.getCenter(i);let s=0;for(let a=0,r=t.count;a<r;a++)gn.fromBufferAttribute(t,a),s=Math.max(s,i.distanceToSquared(gn));if(n)for(let a=0,r=n.length;a<r;a++){let o=n[a],l=this.morphTargetsRelative;for(let c=0,u=o.count;c<u;c++)gn.fromBufferAttribute(o,c),l&&(ll.fromBufferAttribute(t,c),gn.add(ll)),s=Math.max(s,i.distanceToSquared(gn))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&zt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,n=this.attributes;if(t===null||n.position===void 0||n.normal===void 0||n.uv===void 0){zt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=n.position,s=n.normal,a=n.uv,r=this.getAttribute("tangent");(r===void 0||r.count!==i.count)&&(r=new Xn(new Float32Array(4*i.count),4),this.setAttribute("tangent",r));let o=[],l=[];for(let y=0;y<i.count;y++)o[y]=new O,l[y]=new O;let c=new O,u=new O,d=new O,h=new Ut,p=new Ut,m=new Ut,b=new O,g=new O;function f(y,C,D){c.fromBufferAttribute(i,y),u.fromBufferAttribute(i,C),d.fromBufferAttribute(i,D),h.fromBufferAttribute(a,y),p.fromBufferAttribute(a,C),m.fromBufferAttribute(a,D),u.sub(c),d.sub(c),p.sub(h),m.sub(h);let z=1/(p.x*m.y-m.x*p.y);isFinite(z)&&(b.copy(u).multiplyScalar(m.y).addScaledVector(d,-p.y).multiplyScalar(z),g.copy(d).multiplyScalar(p.x).addScaledVector(u,-m.x).multiplyScalar(z),o[y].add(b),o[C].add(b),o[D].add(b),l[y].add(g),l[C].add(g),l[D].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let y=0,C=v.length;y<C;++y){let D=v[y],z=D.start,X=D.count;for(let H=z,A=z+X;H<A;H+=3)f(t.getX(H+0),t.getX(H+1),t.getX(H+2))}let S=new O,x=new O,T=new O,E=new O;function w(y){T.fromBufferAttribute(s,y),E.copy(T);let C=o[y];S.copy(C),S.sub(T.multiplyScalar(T.dot(C))).normalize(),x.crossVectors(E,C);let z=x.dot(l[y])<0?-1:1;r.setXYZW(y,S.x,S.y,S.z,z)}for(let y=0,C=v.length;y<C;++y){let D=v[y],z=D.start,X=D.count;for(let H=z,A=z+X;H<A;H+=3)w(t.getX(H+0)),w(t.getX(H+1)),w(t.getX(H+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==n.count)i=new Xn(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let h=0,p=i.count;h<p;h++)i.setXYZ(h,0,0,0);let s=new O,a=new O,r=new O,o=new O,l=new O,c=new O,u=new O,d=new O;if(t)for(let h=0,p=t.count;h<p;h+=3){let m=t.getX(h+0),b=t.getX(h+1),g=t.getX(h+2);s.fromBufferAttribute(n,m),a.fromBufferAttribute(n,b),r.fromBufferAttribute(n,g),u.subVectors(r,a),d.subVectors(s,a),u.cross(d),o.fromBufferAttribute(i,m),l.fromBufferAttribute(i,b),c.fromBufferAttribute(i,g),o.add(u),l.add(u),c.add(u),i.setXYZ(m,o.x,o.y,o.z),i.setXYZ(b,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let h=0,p=n.count;h<p;h+=3)s.fromBufferAttribute(n,h+0),a.fromBufferAttribute(n,h+1),r.fromBufferAttribute(n,h+2),u.subVectors(r,a),d.subVectors(s,a),u.cross(d),i.setXYZ(h+0,u.x,u.y,u.z),i.setXYZ(h+1,u.x,u.y,u.z),i.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let n=0,i=t.count;n<i;n++)gn.fromBufferAttribute(t,n),gn.normalize(),t.setXYZ(n,gn.x,gn.y,gn.z)}toNonIndexed(){function t(o,l){let c=o.array,u=o.itemSize,d=o.normalized,h=new c.constructor(l.length*u),p=0,m=0;for(let b=0,g=l.length;b<g;b++){o.isInterleavedBufferAttribute?p=l[b]*o.data.stride+o.offset:p=l[b]*u;for(let f=0;f<u;f++)h[m++]=c[p++]}return new Xn(h,u,d)}if(this.index===null)return Pt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let n=new e,i=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,i);n.setAttribute(o,c)}let a=this.morphAttributes;for(let o in a){let l=[],c=a[o];for(let u=0,d=c.length;u<d;u++){let h=c[u],p=t(h,i);l.push(p)}n.morphAttributes[o]=l}n.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let o=0,l=r.length;o<l;o++){let c=r[o];n.addGroup(c.start,c.count,c.materialIndex)}return n}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let n=this.index;n!==null&&(t.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});let i=this.attributes;for(let l in i){let c=i[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},a=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],u=[];for(let d=0,h=c.length;d<h;d++){let p=c[d];u.push(p.toJSON(t.data))}u.length>0&&(s[l]=u,a=!0)}a&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let n={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone());let s=t.attributes;for(let c in s){let u=s[c];this.setAttribute(c,u.clone(n))}let a=t.morphAttributes;for(let c in a){let u=[],d=a[c];for(let h=0,p=d.length;h<p;h++)u.push(d[h].clone(n));this.morphAttributes[c]=u}this.morphTargetsRelative=t.morphTargetsRelative;let r=t.groups;for(let c=0,u=r.length;c<u;c++){let d=r[c];this.addGroup(d.start,d.count,d.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}},Nf=class{constructor(t,n){this.isInterleavedBuffer=!0,this.array=t,this.stride=n,this.count=t!==void 0?t.length/n:0,this.usage=dy,this.updateRanges=[],this.version=0,this.uuid=ea()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,n,i){t*=this.stride,i*=n.stride;for(let s=0,a=this.stride;s<a;s++)this.array[t+s]=n.array[i+s];return this}set(t,n=0){return this.array.set(t,n),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ea()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let n=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(n,this.stride);return i.setUsage(this.usage),i}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=ea()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let n={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}},kn=new O,du=class e{constructor(t,n,i,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=n,this.offset=i,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let n=0,i=this.data.count;n<i;n++)kn.fromBufferAttribute(this,n),kn.applyMatrix4(t),this.setXYZ(n,kn.x,kn.y,kn.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)kn.fromBufferAttribute(this,n),kn.applyNormalMatrix(t),this.setXYZ(n,kn.x,kn.y,kn.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)kn.fromBufferAttribute(this,n),kn.transformDirection(t),this.setXYZ(n,kn.x,kn.y,kn.z);return this}getComponent(t,n){let i=this.array[t*this.data.stride+this.offset+n];return this.normalized&&(i=qi(i,this.array)),i}setComponent(t,n,i){return this.normalized&&(i=Se(i,this.array)),this.data.array[t*this.data.stride+this.offset+n]=i,this}setX(t,n){return this.normalized&&(n=Se(n,this.array)),this.data.array[t*this.data.stride+this.offset]=n,this}setY(t,n){return this.normalized&&(n=Se(n,this.array)),this.data.array[t*this.data.stride+this.offset+1]=n,this}setZ(t,n){return this.normalized&&(n=Se(n,this.array)),this.data.array[t*this.data.stride+this.offset+2]=n,this}setW(t,n){return this.normalized&&(n=Se(n,this.array)),this.data.array[t*this.data.stride+this.offset+3]=n,this}getX(t){let n=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(n=qi(n,this.array)),n}getY(t){let n=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(n=qi(n,this.array)),n}getZ(t){let n=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(n=qi(n,this.array)),n}getW(t){let n=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(n=qi(n,this.array)),n}setXY(t,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array)),this.data.array[t+0]=n,this.data.array[t+1]=i,this}setXYZ(t,n,i,s){return t=t*this.data.stride+this.offset,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array),s=Se(s,this.array)),this.data.array[t+0]=n,this.data.array[t+1]=i,this.data.array[t+2]=s,this}setXYZW(t,n,i,s,a){return t=t*this.data.stride+this.offset,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array),s=Se(s,this.array),a=Se(a,this.array)),this.data.array[t+0]=n,this.data.array[t+1]=i,this.data.array[t+2]=s,this.data.array[t+3]=a,this}clone(t){if(t===void 0){ru("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let n=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)n.push(this.data.array[s+a])}return new Xn(new this.array.constructor(n),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){ru("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let n=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)n.push(this.data.array[s+a])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:n,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},Cv=new O,g2=new O,v2=new kt,_i=class{constructor(t=new O(1,0,0),n=0){this.isPlane=!0,this.normal=t,this.constant=n}set(t,n){return this.normal.copy(t),this.constant=n,this}setComponents(t,n,i,s){return this.normal.set(t,n,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,n){return this.normal.copy(t),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(t,n,i){let s=Cv.subVectors(i,n).cross(g2.subVectors(t,n)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,n){return n.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,n,i=!0){let s=t.delta(Cv),a=this.normal.dot(s);if(a===0)return this.distanceToPoint(t.start)===0?n.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/a;return i===!0&&(r<0||r>1)?null:n.copy(t.start).addScaledVector(s,r)}intersectsLine(t){let n=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return n<0&&i>0||i<0&&n>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,n){let i=n||v2.getNormalMatrix(t),s=this.coplanarPoint(Cv).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},y2=0,Ms=class extends ji{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:y2++}),this.uuid=ea(),this.name="",this.type="Material",this.blending=er,this.side=tr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Yv,this.blendDst=jv,this.blendEquation=Gr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Yt(0,0,0),this.blendAlpha=0,this.depthFunc=vl,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=RE,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=gf,this.stencilZFail=gf,this.stencilZPass=gf,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let n in t){let i=t[n];if(i===void 0){Pt(`Material: parameter '${n}' has value of undefined.`);continue}let s=this[n];if(s===void 0){Pt(`Material: '${n}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[n]=i}}toJSON(t){let n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(a=>a.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(a){let r=[];for(let o in a){let l=a[o];delete l.metadata,r.push(l)}return r}if(n){let a=s(t.textures),r=s(t.images);a.length>0&&(i.textures=a),r.length>0&&(i.images=r)}return i}fromJSON(t,n){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Yt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new _i().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=n[t.map]||null),t.matcap!==void 0&&(this.matcap=n[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=n[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=n[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=n[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Ut().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=n[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=n[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=n[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=n[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=n[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=n[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=n[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=n[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=n[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=n[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=n[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=n[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=n[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=n[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ut().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=n[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=n[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=n[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=n[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=n[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=n[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=n[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let n=t.clippingPlanes,i=null;if(n!==null){let s=n.length;i=new Array(s);for(let a=0;a!==s;++a)i[a]=n[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}},qa=class extends Ms{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Yt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},cl,Zc=new O,ul=new O,hl=new O,dl=new Ut,Kc=new Ut,HE=new Oe,Zd=new O,Jc=new O,Kd=new O,V1=new Ut,Rv=new Ut,k1=new Ut,zr=class extends qn{constructor(t=new qa){if(super(),this.isSprite=!0,this.type="Sprite",cl===void 0){cl=new yn;let n=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new Nf(n,5);cl.setIndex([0,1,2,0,2,3]),cl.setAttribute("position",new du(i,3,0,!1)),cl.setAttribute("uv",new du(i,2,3,!1))}this.geometry=cl,this.material=t,this.center=new Ut(.5,.5),this.count=1}intersectsFrustum(t){return t.intersectsSprite(this)}raycast(t,n){t.camera===null&&zt('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),ul.setFromMatrixScale(this.matrixWorld),HE.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),hl.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&ul.multiplyScalar(-hl.z);let i=this.material.rotation,s,a;i!==0&&(a=Math.cos(i),s=Math.sin(i));let r=this.center;Jd(Zd.set(-.5,-.5,0),hl,r,ul,s,a),Jd(Jc.set(.5,-.5,0),hl,r,ul,s,a),Jd(Kd.set(.5,.5,0),hl,r,ul,s,a),V1.set(0,0),Rv.set(1,0),k1.set(1,1);let o=t.ray.intersectTriangle(Zd,Jc,Kd,!1,Zc);if(o===null&&(Jd(Jc.set(-.5,.5,0),hl,r,ul,s,a),Rv.set(0,1),o=t.ray.intersectTriangle(Zd,Kd,Jc,!1,Zc),o===null))return;let l=t.ray.origin.distanceTo(Zc);l<t.near||l>t.far||n.push({distance:l,point:Zc.clone(),uv:Qs.getInterpolation(Zc,Zd,Jc,Kd,V1,Rv,k1,new Ut),face:null,object:this})}copy(t,n){return super.copy(t,n),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}};function Jd(e,t,n,i,s,a){dl.subVectors(e,n).addScalar(.5).multiply(i),s!==void 0?(Kc.x=a*dl.x-s*dl.y,Kc.y=s*dl.x+a*dl.y):Kc.copy(dl),e.copy(t),e.x+=Kc.x,e.y+=Kc.y,e.applyMatrix4(HE)}var $s=new O,Nv=new O,$d=new O,Qd=new O,ia=class{constructor(t=new O,n=new O(0,0,-1)){this.origin=t,this.direction=n}set(t,n){return this.origin.copy(t),this.direction.copy(n),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,n){return n.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,$s)),this}closestPointToPoint(t,n){n.subVectors(t,this.origin);let i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let n=$s.subVectors(t,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(t):($s.copy(this.origin).addScaledVector(this.direction,n),$s.distanceToSquared(t))}distanceSqToSegment(t,n,i,s){Nv.copy(t).add(n).multiplyScalar(.5),$d.copy(n).sub(t).normalize(),Qd.copy(this.origin).sub(Nv);let a=t.distanceTo(n)*.5,r=-this.direction.dot($d),o=Qd.dot(this.direction),l=-Qd.dot($d),c=Qd.lengthSq(),u=Math.abs(1-r*r),d,h,p,m;if(u>0)if(d=r*l-o,h=r*o-l,m=a*u,d>=0)if(h>=-m)if(h<=m){let b=1/u;d*=b,h*=b,p=d*(d+r*h+2*o)+h*(r*d+h+2*l)+c}else h=a,d=Math.max(0,-(r*h+o)),p=-d*d+h*(h+2*l)+c;else h=-a,d=Math.max(0,-(r*h+o)),p=-d*d+h*(h+2*l)+c;else h<=-m?(d=Math.max(0,-(-r*a+o)),h=d>0?-a:Math.min(Math.max(-a,-l),a),p=-d*d+h*(h+2*l)+c):h<=m?(d=0,h=Math.min(Math.max(-a,-l),a),p=h*(h+2*l)+c):(d=Math.max(0,-(r*a+o)),h=d>0?a:Math.min(Math.max(-a,-l),a),p=-d*d+h*(h+2*l)+c);else h=r>0?-a:a,d=Math.max(0,-(r*h+o)),p=-d*d+h*(h+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Nv).addScaledVector($d,h),p}intersectSphere(t,n){if(t.radius<0)return null;$s.subVectors(t.center,this.origin);let i=$s.dot(this.direction),s=$s.dot($s)-i*i,a=t.radius*t.radius;if(s>a)return null;let r=Math.sqrt(a-s),o=i-r,l=i+r;return l<0?null:o<0?this.at(l,n):this.at(o,n)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let n=t.normal.dot(this.direction);if(n===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/n;return i>=0?i:null}intersectPlane(t,n){let i=this.distanceToPlane(t);return i===null?null:this.at(i,n)}intersectsPlane(t){let n=t.distanceToPoint(this.origin);return n===0||t.normal.dot(this.direction)*n<0}intersectBox(t,n){let i,s,a,r,o,l,c=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,h=this.origin;return c>=0?(i=(t.min.x-h.x)*c,s=(t.max.x-h.x)*c):(i=(t.max.x-h.x)*c,s=(t.min.x-h.x)*c),u>=0?(a=(t.min.y-h.y)*u,r=(t.max.y-h.y)*u):(a=(t.max.y-h.y)*u,r=(t.min.y-h.y)*u),i>r||a>s||((a>i||isNaN(i))&&(i=a),(r<s||isNaN(s))&&(s=r),d>=0?(o=(t.min.z-h.z)*d,l=(t.max.z-h.z)*d):(o=(t.max.z-h.z)*d,l=(t.min.z-h.z)*d),i>l||o>s)||((o>i||i!==i)&&(i=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,n)}intersectsBox(t){return this.intersectBox(t,$s)!==null}intersectTriangle(t,n,i,s,a){let r=this.origin,o=this.direction,l=o.x,c=o.y,u=o.z,d=t.x-r.x,h=t.y-r.y,p=t.z-r.z,m=n.x-r.x,b=n.y-r.y,g=n.z-r.z,f=i.x-r.x,v=i.y-r.y,S=i.z-r.z,x=Math.abs(l),T=Math.abs(c),E=Math.abs(u),w,y,C,D,z,X,H,A,L,F,W,J;if(x>=T&&x>=E?(C=l,X=d,L=m,J=f,l>=0?(w=c,y=u,D=h,z=p,H=b,A=g,F=v,W=S):(w=u,y=c,D=p,z=h,H=g,A=b,F=S,W=v)):T>=E?(C=c,X=h,L=b,J=v,c>=0?(w=u,y=l,D=p,z=d,H=g,A=m,F=S,W=f):(w=l,y=u,D=d,z=p,H=m,A=g,F=f,W=S)):(C=u,X=p,L=g,J=S,u>=0?(w=l,y=c,D=d,z=h,H=m,A=b,F=f,W=v):(w=c,y=l,D=h,z=d,H=b,A=m,F=v,W=f)),C===0)return null;let Y=w/C,$=y/C,at=1/C,Tt=D-Y*X,wt=z-$*X,ae=H-Y*L,ne=A-$*L,re=F-Y*J,Q=W-$*J,nt=re*ne-Q*ae,St=Tt*Q-wt*re,Gt=ae*wt-ne*Tt;if(s){if(nt<0||St<0||Gt<0)return null}else if((nt<0||St<0||Gt<0)&&(nt>0||St>0||Gt>0))return null;let _t=nt+St+Gt;if(_t===0)return null;let qt=at*(nt*X+St*L+Gt*J);return(_t>0?qt<0:qt>0)?null:this.at(qt/_t,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ya=class extends Ms{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Yt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Wa,this.combine=Zv,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},X1=new Oe,Pr=new ia,tf=new Ss,W1=new O,ef=new O,nf=new O,sf=new O,Dv=new O,af=new O,q1=new O,rf=new O,Yn=class extends qn{constructor(t=new yn,n=new Ya){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(t,n){let i=this.geometry,s=i.attributes.position,a=i.morphAttributes.position,r=i.morphTargetsRelative;n.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(a&&o){af.set(0,0,0);for(let l=0,c=a.length;l<c;l++){let u=o[l],d=a[l];u!==0&&(Dv.fromBufferAttribute(d,t),r?af.addScaledVector(Dv,u):af.addScaledVector(Dv.sub(n),u))}n.add(af)}return n}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.material,a=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),tf.copy(i.boundingSphere),tf.applyMatrix4(a),Pr.copy(t.ray).recast(t.near),!(tf.containsPoint(Pr.origin)===!1&&(Pr.intersectSphere(tf,W1)===null||Pr.origin.distanceToSquared(W1)>(t.far-t.near)**2))&&(X1.copy(a).invert(),Pr.copy(t.ray).applyMatrix4(X1),!(i.boundingBox!==null&&Pr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,n,Pr)))}_computeIntersections(t,n,i){let s,a=this.geometry,r=this.material,o=a.index,l=a.attributes.position,c=a.attributes.uv,u=a.attributes.uv1,d=a.attributes.normal,h=a.groups,p=a.drawRange;if(o!==null)if(Array.isArray(r))for(let m=0,b=h.length;m<b;m++){let g=h[m],f=r[g.materialIndex],v=Math.max(g.start,p.start),S=Math.min(o.count,Math.min(g.start+g.count,p.start+p.count));for(let x=v,T=S;x<T;x+=3){let E=o.getX(x),w=o.getX(x+1),y=o.getX(x+2);s=of(this,f,t,i,c,u,d,E,w,y),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,n.push(s))}}else{let m=Math.max(0,p.start),b=Math.min(o.count,p.start+p.count);for(let g=m,f=b;g<f;g+=3){let v=o.getX(g),S=o.getX(g+1),x=o.getX(g+2);s=of(this,r,t,i,c,u,d,v,S,x),s&&(s.faceIndex=Math.floor(g/3),n.push(s))}}else if(l!==void 0)if(Array.isArray(r))for(let m=0,b=h.length;m<b;m++){let g=h[m],f=r[g.materialIndex],v=Math.max(g.start,p.start),S=Math.min(l.count,Math.min(g.start+g.count,p.start+p.count));for(let x=v,T=S;x<T;x+=3){let E=x,w=x+1,y=x+2;s=of(this,f,t,i,c,u,d,E,w,y),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,n.push(s))}}else{let m=Math.max(0,p.start),b=Math.min(l.count,p.start+p.count);for(let g=m,f=b;g<f;g+=3){let v=g,S=g+1,x=g+2;s=of(this,r,t,i,c,u,d,v,S,x),s&&(s.faceIndex=Math.floor(g/3),n.push(s))}}}};function _2(e,t,n,i,s,a,r,o){let l;if(t.side===jn?l=i.intersectTriangle(r,a,s,!0,o):l=i.intersectTriangle(s,a,r,t.side===tr,o),l===null)return null;rf.copy(o),rf.applyMatrix4(e.matrixWorld);let c=n.ray.origin.distanceTo(rf);return c<n.near||c>n.far?null:{distance:c,point:rf.clone(),object:e}}function of(e,t,n,i,s,a,r,o,l,c){e.getVertexPosition(o,ef),e.getVertexPosition(l,nf),e.getVertexPosition(c,sf);let u=_2(e,t,n,i,ef,nf,sf,q1);if(u){let d=new O;Qs.getBarycoord(q1,ef,nf,sf,d),s&&(u.uv=Qs.getInterpolatedAttribute(s,o,l,c,d,new Ut)),a&&(u.uv1=Qs.getInterpolatedAttribute(a,o,l,c,d,new Ut)),r&&(u.normal=Qs.getInterpolatedAttribute(r,o,l,c,d,new O),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let h={a:o,b:l,c,normal:new O,materialIndex:0};Qs.getNormal(ef,nf,sf,h.normal),u.face=h,u.barycoord=d}return u}var Df=class extends Wn{constructor(t=null,n=1,i=1,s,a,r,o,l,c=vn,u=vn,d,h){super(null,r,o,l,c,u,s,a,d,h),this.isDataTexture=!0,this.image={data:t,width:n,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Or=new Ss,x2=new Ut(.5,.5),lf=new O,fu=class{constructor(t=new _i,n=new _i,i=new _i,s=new _i,a=new _i,r=new _i){this.planes=[t,n,i,s,a,r]}set(t,n,i,s,a,r){let o=this.planes;return o[0].copy(t),o[1].copy(n),o[2].copy(i),o[3].copy(s),o[4].copy(a),o[5].copy(r),this}copy(t){let n=this.planes;for(let i=0;i<6;i++)n[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,n=Yi,i=!1){let s=this.planes,a=t.elements,r=a[0],o=a[1],l=a[2],c=a[3],u=a[4],d=a[5],h=a[6],p=a[7],m=a[8],b=a[9],g=a[10],f=a[11],v=a[12],S=a[13],x=a[14],T=a[15];if(s[0].setComponents(c-r,p-u,f-m,T-v).normalize(),s[1].setComponents(c+r,p+u,f+m,T+v).normalize(),s[2].setComponents(c+o,p+d,f+b,T+S).normalize(),s[3].setComponents(c-o,p-d,f-b,T-S).normalize(),i)s[4].setComponents(l,h,g,x).normalize(),s[5].setComponents(c-l,p-h,f-g,T-x).normalize();else if(s[4].setComponents(c-l,p-h,f-g,T-x).normalize(),n===Yi)s[5].setComponents(c+l,p+h,f+g,T+x).normalize();else if(n===su)s[5].setComponents(l,h,g,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Or.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let n=t.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),Or.copy(n.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Or)}intersectsSprite(t){Or.center.set(0,0,0);let n=x2.distanceTo(t.center);return Or.radius=.7071067811865476+n,Or.applyMatrix4(t.matrixWorld),this.intersectsSphere(Or)}intersectsSphere(t){let n=this.planes,i=t.center,s=-t.radius;for(let a=0;a<6;a++)if(n[a].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){let n=this.planes;for(let i=0;i<6;i++){let s=n[i];if(lf.x=s.normal.x>0?t.max.x:t.min.x,lf.y=s.normal.y>0?t.max.y:t.min.y,lf.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(lf)<0)return!1}return!0}containsPoint(t){let n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Fr=class extends Ms{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Yt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},Lf=new O,Uf=new O,Y1=new Oe,$c=new ia,cf=new Ss,Lv=new O,j1=new O,Ml=class extends qn{constructor(t=new yn,n=new Fr){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let n=t.attributes.position,i=[0];for(let s=1,a=n.count;s<a;s++)Lf.fromBufferAttribute(n,s-1),Uf.fromBufferAttribute(n,s),i[s]=i[s-1],i[s]+=Lf.distanceTo(Uf);t.setAttribute("lineDistance",new On(i,1))}else Pt("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.matrixWorld,a=t.params.Line.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),cf.copy(i.boundingSphere),cf.applyMatrix4(s),cf.radius+=a,t.ray.intersectsSphere(cf)===!1)return;Y1.copy(s).invert(),$c.copy(t.ray).applyMatrix4(Y1);let o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,u=i.index,h=i.attributes.position;if(u!==null){let p=Math.max(0,r.start),m=Math.min(u.count,r.start+r.count);for(let b=p,g=m-1;b<g;b+=c){let f=u.getX(b),v=u.getX(b+1),S=uf(this,t,$c,l,f,v,b);S&&n.push(S)}if(this.isLineLoop){let b=u.getX(m-1),g=u.getX(p),f=uf(this,t,$c,l,b,g,m-1);f&&n.push(f)}}else{let p=Math.max(0,r.start),m=Math.min(h.count,r.start+r.count);for(let b=p,g=m-1;b<g;b+=c){let f=uf(this,t,$c,l,b,b+1,b);f&&n.push(f)}if(this.isLineLoop){let b=uf(this,t,$c,l,m-1,p,m-1);b&&n.push(b)}}}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}};function uf(e,t,n,i,s,a,r){let o=e.geometry.attributes.position;if(Lf.fromBufferAttribute(o,s),Uf.fromBufferAttribute(o,a),n.distanceSqToSegment(Lf,Uf,Lv,j1)>i)return;Lv.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(Lv);if(!(c<t.near||c>t.far))return{distance:c,point:j1.clone().applyMatrix4(e.matrixWorld),index:r,face:null,faceIndex:null,barycoord:null,object:e}}var pu=class extends Ml{constructor(t,n){super(t,n),this.isLineLoop=!0,this.type="LineLoop"}},El=class extends Ms{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Yt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},Z1=new Oe,Gv=new ia,hf=new Ss,df=new O,mu=class extends qn{constructor(t=new yn,n=new El){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.matrixWorld,a=t.params.Points.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),hf.copy(i.boundingSphere),hf.applyMatrix4(s),hf.radius+=a,t.ray.intersectsSphere(hf)===!1)return;Z1.copy(s).invert(),Gv.copy(t.ray).applyMatrix4(Z1);let o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,d=i.attributes.position;if(c!==null){let h=Math.max(0,r.start),p=Math.min(c.count,r.start+r.count);for(let m=h,b=p;m<b;m++){let g=c.getX(m);df.fromBufferAttribute(d,g),K1(df,g,l,s,t,n,this)}}else{let h=Math.max(0,r.start),p=Math.min(d.count,r.start+r.count);for(let m=h,b=p;m<b;m++)df.fromBufferAttribute(d,m),K1(df,m,l,s,t,n,this)}}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}};function K1(e,t,n,i,s,a,r){let o=Gv.distanceSqToPoint(e);if(o<n){let l=new O;Gv.closestPointToPoint(e,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;a.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:r})}}var gu=class extends Wn{constructor(t=[],n=nr,i,s,a,r,o,l,c,u){super(t,n,i,s,a,r,o,l,c,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Tl=class extends Wn{constructor(t,n,i,s,a,r,o,l,c){super(t,n,i,s,a,r,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var ja=class extends Wn{constructor(t,n,i=Ki,s,a,r,o=vn,l=vn,c,u=xs,d=1){if(u!==xs&&u!==sr)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:t,height:n,depth:d};super(h,s,a,r,o,l,u,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new xl(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let n=super.toJSON(t);return n.compareFunction=this.compareFunction,n}},If=class extends ja{constructor(t,n=Ki,i=nr,s,a,r=vn,o=vn,l,c=xs){let u={width:t,height:t,depth:1},d=[u,u,u,u,u,u];super(t,t,n,i,s,a,r,o,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},vu=class extends Wn{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},wl=class e extends yn{constructor(t=1,n=1,i=1,s=1,a=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:n,depth:i,widthSegments:s,heightSegments:a,depthSegments:r};let o=this;s=Math.floor(s),a=Math.floor(a),r=Math.floor(r);let l=[],c=[],u=[],d=[],h=0,p=0;m("z","y","x",-1,-1,i,n,t,r,a,0),m("z","y","x",1,-1,i,n,-t,r,a,1),m("x","z","y",1,1,t,i,n,s,r,2),m("x","z","y",1,-1,t,i,-n,s,r,3),m("x","y","z",1,-1,t,n,i,s,a,4),m("x","y","z",-1,-1,t,n,-i,s,a,5),this.setIndex(l),this.setAttribute("position",new On(c,3)),this.setAttribute("normal",new On(u,3)),this.setAttribute("uv",new On(d,2));function m(b,g,f,v,S,x,T,E,w,y,C){let D=x/w,z=T/y,X=x/2,H=T/2,A=E/2,L=w+1,F=y+1,W=0,J=0,Y=new O;for(let $=0;$<F;$++){let at=$*z-H;for(let Tt=0;Tt<L;Tt++){let wt=Tt*D-X;Y[b]=wt*v,Y[g]=at*S,Y[f]=A,c.push(Y.x,Y.y,Y.z),Y[b]=0,Y[g]=0,Y[f]=E>0?1:-1,u.push(Y.x,Y.y,Y.z),d.push(Tt/w),d.push(1-$/y),W+=1}}for(let $=0;$<y;$++)for(let at=0;at<w;at++){let Tt=h+at+L*$,wt=h+at+L*($+1),ae=h+(at+1)+L*($+1),ne=h+(at+1)+L*$;l.push(Tt,wt,ne),l.push(wt,ae,ne),J+=6}o.addGroup(p,J,C),p+=J,h+=W}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var yu=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Pt("Curve: .getPoint() not implemented.")}getPointAt(t,n){let i=this.getUtoTmapping(t);return this.getPoint(i,n)}getPoints(t=5){let n=[];for(let i=0;i<=t;i++)n.push(this.getPoint(i/t));return n}getSpacedPoints(t=5){let n=[];for(let i=0;i<=t;i++)n.push(this.getPointAt(i/t));return n}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let n=[],i,s=this.getPoint(0),a=0;n.push(0);for(let r=1;r<=t;r++)i=this.getPoint(r/t),a+=i.distanceTo(s),n.push(a),s=i;return this.cacheArcLengths=n,n}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,n=null){let i=this.getLengths(),s=0,a=i.length,r;n?r=n:r=t*i[a-1];let o=0,l=a-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=i[s]-r,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===r)return s/(a-1);let u=i[s],h=i[s+1]-u,p=(r-u)/h;return(s+p)/(a-1)}getTangent(t,n){let s=t-1e-4,a=t+1e-4;s<0&&(s=0),a>1&&(a=1);let r=this.getPoint(s),o=this.getPoint(a),l=n||(r.isVector2?new Ut:new O);return l.copy(o).sub(r).normalize(),l}getTangentAt(t,n){let i=this.getUtoTmapping(t);return this.getTangent(i,n)}computeFrenetFrames(t,n=!1){let i=new O,s=[],a=[],r=[],o=new O,l=new Oe;for(let p=0;p<=t;p++){let m=p/t;s[p]=this.getTangentAt(m,new O)}a[0]=new O,r[0]=new O;let c=Number.MAX_VALUE,u=Math.abs(s[0].x),d=Math.abs(s[0].y),h=Math.abs(s[0].z);u<=c&&(c=u,i.set(1,0,0)),d<=c&&(c=d,i.set(0,1,0)),h<=c&&i.set(0,0,1),o.crossVectors(s[0],i).normalize(),a[0].crossVectors(s[0],o),r[0].crossVectors(s[0],a[0]);for(let p=1;p<=t;p++){if(a[p]=a[p-1].clone(),r[p]=r[p-1].clone(),o.crossVectors(s[p-1],s[p]),o.length()>Number.EPSILON){o.normalize();let m=Math.acos(Zt(s[p-1].dot(s[p]),-1,1));a[p].applyMatrix4(l.makeRotationAxis(o,m))}r[p].crossVectors(s[p],a[p])}if(n===!0){let p=Math.acos(Zt(a[0].dot(a[t]),-1,1));p/=t,s[0].dot(o.crossVectors(a[0],a[t]))>0&&(p=-p);for(let m=1;m<=t;m++)a[m].applyMatrix4(l.makeRotationAxis(s[m],p*m)),r[m].crossVectors(s[m],a[m])}return{tangents:s,normals:a,binormals:r}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){let t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}};function b2(e,t){let n=1-e;return n*n*t}function S2(e,t){return 2*(1-e)*e*t}function M2(e,t){return e*e*t}function Uv(e,t,n,i){return b2(e,t)+S2(e,n)+M2(e,i)}function E2(e,t){let n=1-e;return n*n*n*t}function T2(e,t){let n=1-e;return 3*n*n*e*t}function w2(e,t){return 3*(1-e)*e*e*t}function A2(e,t){return e*e*e*t}function Iv(e,t,n,i,s){return E2(e,t)+T2(e,n)+w2(e,i)+A2(e,s)}var _u=class extends yu{constructor(t=new O,n=new O,i=new O,s=new O){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=n,this.v2=i,this.v3=s}getPoint(t,n=new O){let i=n,s=this.v0,a=this.v1,r=this.v2,o=this.v3;return i.set(Iv(t,s.x,a.x,r.x,o.x),Iv(t,s.y,a.y,r.y,o.y),Iv(t,s.z,a.z,r.z,o.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}};var xu=class extends yu{constructor(t=new O,n=new O,i=new O){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=n,this.v2=i}getPoint(t,n=new O){let i=n,s=this.v0,a=this.v1,r=this.v2;return i.set(Uv(t,s.x,a.x,r.x),Uv(t,s.y,a.y,r.y),Uv(t,s.z,a.z,r.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}};var bu=class e extends yn{constructor(t=1,n=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:n,widthSegments:i,heightSegments:s};let a=t/2,r=n/2,o=Math.floor(i),l=Math.floor(s),c=o+1,u=l+1,d=t/o,h=n/l,p=[],m=[],b=[],g=[];for(let f=0;f<u;f++){let v=f*h-r;for(let S=0;S<c;S++){let x=S*d-a;m.push(x,-v,0),b.push(0,0,1),g.push(S/o),g.push(1-f/l)}}for(let f=0;f<l;f++)for(let v=0;v<o;v++){let S=v+c*f,x=v+c*(f+1),T=v+1+c*(f+1),E=v+1+c*f;p.push(S,x,E),p.push(x,T,E)}this.setIndex(p),this.setAttribute("position",new On(m,3)),this.setAttribute("normal",new On(b,3)),this.setAttribute("uv",new On(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};var Su=class e extends yn{constructor(t=1,n=32,i=16,s=0,a=Math.PI*2,r=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:n,heightSegments:i,phiStart:s,phiLength:a,thetaStart:r,thetaLength:o},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));let l=Math.min(r+o,Math.PI),c=0,u=[],d=new O,h=new O,p=[],m=[],b=[],g=[];for(let f=0;f<=i;f++){let v=[],S=f/i,x=r+S*o,T=t*Math.cos(x),E=Math.sqrt(t*t-T*T),w=0;f===0&&r===0?w=.5/n:f===i&&l===Math.PI&&(w=-.5/n);for(let y=0;y<=n;y++){let C=y/n,D=s+C*a;d.x=-E*Math.cos(D),d.y=T,d.z=E*Math.sin(D),m.push(d.x,d.y,d.z),h.copy(d).normalize(),b.push(h.x,h.y,h.z),g.push(C+w,1-S),v.push(c++)}u.push(v)}for(let f=0;f<i;f++)for(let v=0;v<n;v++){let S=u[f][v+1],x=u[f][v],T=u[f+1][v],E=u[f+1][v+1];(f!==0||r>0)&&p.push(S,x,E),(f!==i-1||l<Math.PI)&&p.push(x,T,E)}this.setIndex(p),this.setAttribute("position",new On(m,3)),this.setAttribute("normal",new On(b,3)),this.setAttribute("uv",new On(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};function Vr(e){let t={};for(let n in e){t[n]={};for(let i in e[n]){let s=e[n][i];if(J1(s))s.isRenderTargetTexture?(Pt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null):t[n][i]=s.clone();else if(Array.isArray(s))if(J1(s[0])){let a=[];for(let r=0,o=s.length;r<o;r++)a[r]=s[r].clone();t[n][i]=a}else t[n][i]=s.slice();else t[n][i]=s}}return t}function Bn(e){let t={};for(let n=0;n<e.length;n++){let i=Vr(e[n]);for(let s in i)t[s]=i[s]}return t}function J1(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function C2(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function my(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:se.workingColorSpace}var VE={clone:Vr,merge:Bn},R2=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,N2=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,bi=class extends Ms{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=R2,this.fragmentShader=N2,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Vr(t.uniforms),this.uniformsGroups=C2(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let n=super.toJSON(t);n.glslVersion=this.glslVersion,n.uniforms={};for(let s in this.uniforms){let r=this.uniforms[s].value;r&&r.isTexture?n.uniforms[s]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?n.uniforms[s]={type:"c",value:r.getHex()}:r&&r.isVector2?n.uniforms[s]={type:"v2",value:r.toArray()}:r&&r.isVector3?n.uniforms[s]={type:"v3",value:r.toArray()}:r&&r.isVector4?n.uniforms[s]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?n.uniforms[s]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?n.uniforms[s]={type:"m4",value:r.toArray()}:n.uniforms[s]={value:r}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}fromJSON(t,n){if(super.fromJSON(t,n),t.uniforms!==void 0)for(let i in t.uniforms){let s=t.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=n[s.value]||null;break;case"c":this.uniforms[i].value=new Yt().setHex(s.value);break;case"v2":this.uniforms[i].value=new Ut().fromArray(s.value);break;case"v3":this.uniforms[i].value=new O().fromArray(s.value);break;case"v4":this.uniforms[i].value=new qe().fromArray(s.value);break;case"m3":this.uniforms[i].value=new kt().fromArray(s.value);break;case"m4":this.uniforms[i].value=new Oe().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},Pf=class extends bi{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Of=class extends Ms{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=AE,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Bf=class extends Ms{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function fl(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT=="number"?new t(e):Array.prototype.slice.call(e)}function Pv(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var Za=class{constructor(t,n,i,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new n.constructor(i),this.sampleValues=n,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let n=this.parameterPositions,i=this._cachedIndex,s=n[i],a=n[i-1];t:{e:{let r;n:{i:if(!(t<s)){for(let o=i+2;;){if(s===void 0){if(t<a)break i;return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(a=s,s=n[++i],t<s)break e}r=n.length;break n}if(!(t>=a)){let o=n[1];t<o&&(i=2,a=o);for(let l=i-2;;){if(a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=a,a=n[--i-1],t>=a)break e}r=i,i=0;break n}break t}for(;i<r;){let o=i+r>>>1;t<n[o]?r=o:i=o+1}if(s=n[i],a=n[i-1],a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,a,s)}return this.interpolate_(i,a,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let n=this.resultBuffer,i=this.sampleValues,s=this.valueSize,a=t*s;for(let r=0;r!==s;++r)n[r]=i[a+r];return n}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},zf=class extends Za{constructor(t,n,i,s){super(t,n,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Bv,endingEnd:Bv}}intervalChanged_(t,n,i){let s=this.parameterPositions,a=t-2,r=t+1,o=s[a],l=s[r];if(o===void 0)switch(this.getSettings_().endingStart){case zv:a=t,o=2*n-i;break;case Fv:a=s.length-2,o=n+s[a]-s[a+1];break;default:a=t,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case zv:r=t,l=2*i-n;break;case Fv:r=1,l=i+s[1]-s[0];break;default:r=t-1,l=n}let c=(i-n)*.5,u=this.valueSize;this._weightPrev=c/(n-o),this._weightNext=c/(l-i),this._offsetPrev=a*u,this._offsetNext=r*u}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,u=this._offsetPrev,d=this._offsetNext,h=this._weightPrev,p=this._weightNext,m=(i-n)/(s-n),b=m*m,g=b*m,f=-h*g+2*h*b-h*m,v=(1+h)*g+(-1.5-2*h)*b+(-.5+h)*m+1,S=(-1-p)*g+(1.5+p)*b+.5*m,x=p*g-p*b;for(let T=0;T!==o;++T)a[T]=f*r[u+T]+v*r[c+T]+S*r[l+T]+x*r[d+T];return a}},Ff=class extends Za{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,u=(i-n)/(s-n),d=1-u;for(let h=0;h!==o;++h)a[h]=r[c+h]*d+r[l+h]*u;return a}},Gf=class extends Za{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Hf=class extends Za{interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,u=this.inTangents,d=this.outTangents;if(!u||!d){let m=(i-n)/(s-n),b=1-m;for(let g=0;g!==o;++g)a[g]=r[c+g]*b+r[l+g]*m;return a}let h=o*2,p=t-1;for(let m=0;m!==o;++m){let b=r[c+m],g=r[l+m],f=p*h+m*2,v=d[f],S=d[f+1],x=t*h+m*2,T=u[x],E=u[x+1],w=L2(i,n,v,T,s);a[m]=kE(w,b,S,E,g)}return a}};function kE(e,t,n,i,s){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*i+e*e*e*s}function D2(e,t,n,i,s){let a=1-e;return 3*a*a*(n-t)+6*a*e*(i-n)+3*e*e*(s-i)}function L2(e,t,n,i,s){let a=(e-t)/(s-t);for(let r=0;r<8;r++){let o=kE(a,t,n,i,s)-e;if(Math.abs(o)<1e-10)break;let l=D2(a,t,n,i,s);if(Math.abs(l)<1e-10)break;a=Math.max(0,Math.min(1,a-o/l))}return a}var Si=class{constructor(t,n,i,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(n===void 0||n.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=fl(n,this.TimeBufferType),this.values=fl(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let n=t.constructor,i;if(n.toJSON!==this.toJSON)i=n.toJSON(t);else{i={name:t.name,times:fl(t.times,Array),values:fl(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(i.interpolation=s),Pv(t.settings)&&(i.settings={inTangents:fl(t.settings.inTangents,Array),outTangents:fl(t.settings.outTangents,Array)})}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new Gf(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Ff(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new zf(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let n=new Hf(this.times,this.values,this.getValueSize(),t);return this.settings&&(n.inTangents=this.settings.inTangents,n.outTangents=this.settings.outTangents),n}setInterpolation(t){let n;switch(t){case eu:n=this.InterpolantFactoryMethodDiscrete;break;case wf:n=this.InterpolantFactoryMethodLinear;break;case mf:n=this.InterpolantFactoryMethodSmooth;break;case Ov:n=this.InterpolantFactoryMethodBezier;break}if(n===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Pt("KeyframeTrack:",i),this}return this.createInterpolant=n,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return eu;case this.InterpolantFactoryMethodLinear:return wf;case this.InterpolantFactoryMethodSmooth:return mf;case this.InterpolantFactoryMethodBezier:return Ov}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let n=this.times;for(let i=0,s=n.length;i!==s;++i)n[i]+=t}return this}scale(t){if(t!==1){let n=this.times;for(let i=0,s=n.length;i!==s;++i)n[i]*=t;Pv(this.settings)&&($1(this.settings.inTangents,t),$1(this.settings.outTangents,t))}return this}trim(t,n){let i=this.times,s=i.length,a=0,r=s-1;for(;a!==s&&i[a]<t;)++a;for(;r!==-1&&i[r]>n;)--r;if(++r,a!==0||r!==s){a>=r&&(r=Math.max(r,1),a=r-1);let o=this.getValueSize();this.times=i.slice(a,r),this.values=this.values.slice(a*o,r*o)}return this}validate(){let t=!0,n=this.getValueSize();n-Math.floor(n)!==0&&(zt("KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,s=this.values,a=i.length;a===0&&(zt("KeyframeTrack: Track is empty.",this),t=!1);let r=null;for(let o=0;o!==a;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){zt("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(r!==null&&r>l){zt("KeyframeTrack: Out of order keys.",this,o,l,r),t=!1;break}r=l}if(s!==void 0&&GR(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){zt("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),n=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===mf,a=t.length-1,r=1;for(let o=1;o<a;++o){let l=!1,c=t[o],u=t[o+1];if(c!==u&&(o!==1||c!==t[0]))if(s)l=!0;else{let d=o*i,h=d-i,p=d+i;for(let m=0;m!==i;++m){let b=n[d+m];if(b!==n[h+m]||b!==n[p+m]){l=!0;break}}}if(l){if(o!==r){t[r]=t[o];let d=o*i,h=r*i;for(let p=0;p!==i;++p)n[h+p]=n[d+p]}++r}}if(a>0){t[r]=t[a];for(let o=a*i,l=r*i,c=0;c!==i;++c)n[l+c]=n[o+c];++r}return r!==t.length?(this.times=t.slice(0,r),this.values=n.slice(0,r*i)):(this.times=t,this.values=n),this}clone(){let t=this.times.slice(),n=this.values.slice(),i=this.constructor,s=new i(this.name,t,n);return s.createInterpolant=this.createInterpolant,Pv(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function $1(e,t){for(let n=0,i=e.length;n!==i;n+=2)e[n]*=t}Si.prototype.ValueTypeName="";Si.prototype.TimeBufferType=Float32Array;Si.prototype.ValueBufferType=Float32Array;Si.prototype.DefaultInterpolation=wf;var Ka=class extends Si{constructor(t,n,i){super(t,n,i)}};Ka.prototype.ValueTypeName="bool";Ka.prototype.ValueBufferType=Array;Ka.prototype.DefaultInterpolation=eu;Ka.prototype.InterpolantFactoryMethodLinear=void 0;Ka.prototype.InterpolantFactoryMethodSmooth=void 0;var Vf=class extends Si{constructor(t,n,i,s){super(t,n,i,s)}};Vf.prototype.ValueTypeName="color";var kf=class extends Si{constructor(t,n,i,s){super(t,n,i,s)}};kf.prototype.ValueTypeName="number";var Xf=class extends Za{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=(i-n)/(s-n),c=t*o;for(let u=c+o;c!==u;c+=4)xi.slerpFlat(a,0,r,c-o,r,c,l);return a}},Mu=class extends Si{constructor(t,n,i,s){super(t,n,i,s)}InterpolantFactoryMethodLinear(t){return new Xf(this.times,this.values,this.getValueSize(),t)}};Mu.prototype.ValueTypeName="quaternion";Mu.prototype.InterpolantFactoryMethodSmooth=void 0;var Ja=class extends Si{constructor(t,n,i){super(t,n,i)}};Ja.prototype.ValueTypeName="string";Ja.prototype.ValueBufferType=Array;Ja.prototype.DefaultInterpolation=eu;Ja.prototype.InterpolantFactoryMethodLinear=void 0;Ja.prototype.InterpolantFactoryMethodSmooth=void 0;var Wf=class extends Si{constructor(t,n,i,s){super(t,n,i,s)}};Wf.prototype.ValueTypeName="vector";var qf=class{constructor(t,n,i){let s=this,a=!1,r=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=n,this.onError=i,this._abortController=null,this.itemStart=function(u){o++,a===!1&&s.onStart!==void 0&&s.onStart(u,r,o),a=!0},this.itemEnd=function(u){r++,s.onProgress!==void 0&&s.onProgress(u,r,o),r===o&&(a=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),l?l(u):u},this.setURLModifier=function(u){return l=u,this},this.addHandler=function(u,d){return c.push(u,d),this},this.removeHandler=function(u){let d=c.indexOf(u);return d!==-1&&c.splice(d,2),this},this.getHandler=function(u){for(let d=0,h=c.length;d<h;d+=2){let p=c[d],m=c[d+1];if(p.global&&(p.lastIndex=0),p.test(u))return m}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},XE=new qf,Yf=class{constructor(t){this.manager=t!==void 0?t:XE,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,n){let i=this;return new Promise(function(s,a){i.load(t,s,n,a)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Yf.DEFAULT_MATERIAL_NAME="__DEFAULT";var ff=new O,pf=new xi,ys=new O,Eu=class extends qn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Oe,this.projectionMatrix=new Oe,this.projectionMatrixInverse=new Oe,this.coordinateSystem=Yi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,n){return super.copy(t,n),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(ff,pf,ys),ys.x===1&&ys.y===1&&ys.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ff,pf,ys.set(1,1,1)).invert()}updateWorldMatrix(t,n,i=!1){super.updateWorldMatrix(t,n,i),this.matrixWorld.decompose(ff,pf,ys),ys.x===1&&ys.y===1&&ys.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ff,pf,ys.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Xa=new O,Q1=new Ut,tE=new Ut,Pn=class extends Eu{constructor(t=50,n=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let n=.5*this.getFilmHeight()/t;this.fov=_l*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Qc*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return _l*2*Math.atan(Math.tan(Qc*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,n,i){Xa.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Xa.x,Xa.y).multiplyScalar(-t/Xa.z),Xa.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Xa.x,Xa.y).multiplyScalar(-t/Xa.z)}getViewSize(t,n){return this.getViewBounds(t,Q1,tE),n.subVectors(tE,Q1)}setViewOffset(t,n,i,s,a,r){this.aspect=t/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,n=t*Math.tan(Qc*.5*this.fov)/this.zoom,i=2*n,s=this.aspect*i,a=-.5*s,r=this.view;if(this.view!==null&&this.view.enabled){let l=r.fullWidth,c=r.fullHeight;a+=r.offsetX*s/l,n-=r.offsetY*i/c,s*=r.width/l,i*=r.height/c}let o=this.filmOffset;o!==0&&(a+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+s,n,n-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let n=super.toJSON(t);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}};var Tu=class extends Eu{constructor(t=-1,n=1,i=1,s=-1,a=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=n,this.top=i,this.bottom=s,this.near=a,this.far=r,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,n,i,s,a,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,a=i-t,r=i+t,o=s+n,l=s-n;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,r=a+c*this.view.width,o-=u*this.view.offsetY,l=o-u*this.view.height}this.projectionMatrix.makeOrthographic(a,r,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let n=super.toJSON(t);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}};var pl=-90,ml=1,jf=class extends qn{constructor(t,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Pn(pl,ml,t,n);s.layers=this.layers,this.add(s);let a=new Pn(pl,ml,t,n);a.layers=this.layers,this.add(a);let r=new Pn(pl,ml,t,n);r.layers=this.layers,this.add(r);let o=new Pn(pl,ml,t,n);o.layers=this.layers,this.add(o);let l=new Pn(pl,ml,t,n);l.layers=this.layers,this.add(l);let c=new Pn(pl,ml,t,n);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,n=this.children.concat(),[i,s,a,r,o,l]=n;for(let c of n)this.remove(c);if(t===Yi)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===su)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of n)this.add(c),c.updateMatrixWorld()}update(t,n){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[a,r,o,l,c,u]=this.children,d=t.getRenderTarget(),h=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;let b=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let g=!1;t.isWebGLRenderer===!0?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(i,0,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,a),t.setRenderTarget(i,1,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,r),t.setRenderTarget(i,2,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,o),t.setRenderTarget(i,3,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,l),t.setRenderTarget(i,4,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,c),i.texture.generateMipmaps=b,t.setRenderTarget(i,5,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,u),t.setRenderTarget(d,h,p),t.xr.enabled=m,i.texture.needsPMREMUpdate=!0}},Zf=class extends Pn{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var gy="\\[\\]\\.:\\/",U2=new RegExp("["+gy+"]","g"),vy="[^"+gy+"]",I2="[^"+gy.replace("\\.","")+"]",P2=/((?:WC+[\/:])*)/.source.replace("WC",vy),O2=/(WCOD+)?/.source.replace("WCOD",I2),B2=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",vy),z2=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",vy),F2=new RegExp("^"+P2+O2+B2+z2+"$"),G2=["material","materials","bones","map"],Hv=class{constructor(t,n,i){let s=i||Ge.parseTrackName(n);this._targetGroup=t,this._bindings=t.subscribe_(n,s)}getValue(t,n){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(t,n)}setValue(t,n){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,a=i.length;s!==a;++s)i[s].setValue(t,n)}bind(){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].bind()}unbind(){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].unbind()}},Ge=class e{constructor(t,n,i){this.path=n,this.parsedPath=i||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,i){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,i):new e(t,n,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(U2,"")}static parseTrackName(t){let n=F2.exec(t);if(n===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:n[2],objectName:n[3],objectIndex:n[4],propertyName:n[5],propertyIndex:n[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let a=i.nodeName.substring(s+1);G2.indexOf(a)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=a)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,n){if(n===void 0||n===""||n==="."||n===-1||n===t.name||n===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(n);if(i!==void 0)return i}if(t.children){let i=function(a){for(let r=0;r<a.length;r++){let o=a[r];if(o.name===n||o.uuid===n)return o;let l=i(o.children);if(l)return l}return null},s=i(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,n){t[n]=this.targetObject[this.propertyName]}_getValue_array(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)t[n++]=i[s]}_getValue_arrayElement(t,n){t[n]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,n){this.resolvedProperty.toArray(t,n)}_setValue_direct(t,n){this.targetObject[this.propertyName]=t[n]}_setValue_direct_setNeedsUpdate(t,n){this.targetObject[this.propertyName]=t[n],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,n){this.targetObject[this.propertyName]=t[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++]}_setValue_array_setNeedsUpdate(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,n){this.resolvedProperty[this.propertyIndex]=t[n]}_setValue_arrayElement_setNeedsUpdate(t,n){this.resolvedProperty[this.propertyIndex]=t[n],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,n){this.resolvedProperty[this.propertyIndex]=t[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,n){this.resolvedProperty.fromArray(t,n)}_setValue_fromArray_setNeedsUpdate(t,n){this.resolvedProperty.fromArray(t,n),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,n){this.resolvedProperty.fromArray(t,n),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,n){this.bind(),this.getValue(t,n)}_setValue_unbound(t,n){this.bind(),this.setValue(t,n)}bind(){let t=this.node,n=this.parsedPath,i=n.objectName,s=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Pt("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=n.objectIndex;switch(i){case"materials":if(!t.material){zt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){zt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){zt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let u=0;u<t.length;u++)if(t[u].name===c){c=u;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){zt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){zt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){zt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(c!==void 0){if(t[c]===void 0){zt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let r=t[s];if(r===void 0){let c=n.nodeName;zt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(a!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){zt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){zt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}l=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=a}else r.fromArray!==void 0&&r.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(l=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ge.Composite=Hv;Ge.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Ge.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Ge.prototype.GetterByBindingType=[Ge.prototype._getValue_direct,Ge.prototype._getValue_array,Ge.prototype._getValue_arrayElement,Ge.prototype._getValue_toArray];Ge.prototype.SetterByBindingTypeAndVersioning=[[Ge.prototype._setValue_direct,Ge.prototype._setValue_direct_setNeedsUpdate,Ge.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ge.prototype._setValue_array,Ge.prototype._setValue_array_setNeedsUpdate,Ge.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ge.prototype._setValue_arrayElement,Ge.prototype._setValue_arrayElement_setNeedsUpdate,Ge.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ge.prototype._setValue_fromArray,Ge.prototype._setValue_fromArray_setNeedsUpdate,Ge.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var kI=new Float32Array(1);var eE=new Oe,wu=class{constructor(t,n,i=0,s=1/0){this.ray=new ia(t,n),this.near=i,this.far=s,this.camera=null,this.layers=new bl,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,n){this.ray.set(t,n)}setFromCamera(t,n){n.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(n.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(n).sub(this.ray.origin).normalize(),this.camera=n):n.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,n.projectionMatrix.elements[14]).unproject(n),this.ray.direction.set(0,0,-1).transformDirection(n.matrixWorld),this.camera=n):zt("Raycaster: Unsupported camera type: "+n.type)}setFromXRController(t){return eE.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(eE),this}intersectObject(t,n=!0,i=[]){return Vv(t,this,i,n),i.sort(nE),i}intersectObjects(t,n=!0,i=[]){for(let s=0,a=t.length;s<a;s++)Vv(t[s],this,i,n);return i.sort(nE),i}};function nE(e,t){return e.distance-t.distance}function Vv(e,t,n,i){let s=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(s=!1),s===!0&&i===!0){let a=e.children;for(let r=0,o=a.length;r<o;r++)Vv(a[r],t,n,!0)}}var Al=class{constructor(t=1,n=0,i=0){this.radius=t,this.phi=n,this.theta=i}set(t,n,i){return this.radius=t,this.phi=n,this.theta=i,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Zt(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,n,i){return this.radius=Math.sqrt(t*t+n*n+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,i),this.phi=Math.acos(Zt(n/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var kv=class e{static{e.prototype.isMatrix2=!0}constructor(t,n,i,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,n,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,n=0){for(let i=0;i<4;i++)this.elements[i]=t[i+n];return this}set(t,n,i,s){let a=this.elements;return a[0]=t,a[2]=n,a[1]=i,a[3]=s,this}};var Au=class extends ji{constructor(t,n=null){super(),this.object=t,this.domElement=n,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}};function yy(e,t,n,i){let s=H2(i);switch(n){case ly:return e*t;case uy:return e*t/s.components*s.byteLength;case np:return e*t/s.components*s.byteLength;case ar:return e*t*2/s.components*s.byteLength;case ip:return e*t*2/s.components*s.byteLength;case cy:return e*t*3/s.components*s.byteLength;case Pi:return e*t*4/s.components*s.byteLength;case sp:return e*t*4/s.components*s.byteLength;case Lu:case Uu:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Iu:case Pu:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case rp:case lp:return Math.max(e,16)*Math.max(t,8)/4;case ap:case op:return Math.max(e,8)*Math.max(t,8)/2;case cp:case up:case dp:case fp:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case hp:case Ou:case pp:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case mp:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case gp:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case vp:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case yp:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case _p:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case xp:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case bp:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case Sp:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case Mp:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Ep:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case Tp:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case wp:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Ap:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Cp:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case Rp:case Np:case Dp:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Lp:case Up:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Bu:case Ip:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function H2(e){switch(e){case Mi:case sy:return{byteLength:1,components:1};case Rl:case ay:case $i:return{byteLength:2,components:1};case tp:case ep:return{byteLength:2,components:4};case Ki:case Qf:case Ji:return{byteLength:4,components:1};case ry:case oy:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Pt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function dT(){let e=null,t=!1,n=null,i=null;function s(a,r){i=e.requestAnimationFrame(s),n(a,r)}return{start:function(){t!==!0&&n!==null&&e!==null&&(i=e.requestAnimationFrame(s),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){n=a},setContext:function(a){e=a}}}function k2(e){let t=new WeakMap;function n(o,l){let c=o.array,u=o.usage,d=c.byteLength,h=e.createBuffer();e.bindBuffer(l,h),e.bufferData(l,c,u),o.onUploadCallback();let p;if(c instanceof Float32Array)p=e.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)p=e.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=e.HALF_FLOAT:p=e.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=e.SHORT;else if(c instanceof Uint32Array)p=e.UNSIGNED_INT;else if(c instanceof Int32Array)p=e.INT;else if(c instanceof Int8Array)p=e.BYTE;else if(c instanceof Uint8Array)p=e.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:h,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function i(o,l,c){let u=l.array,d=l.updateRanges;if(e.bindBuffer(c,o),d.length===0)e.bufferSubData(c,0,u);else{d.sort((p,m)=>p.start-m.start);let h=0;for(let p=1;p<d.length;p++){let m=d[h],b=d[p];b.start<=m.start+m.count+1?m.count=Math.max(m.count,b.start+b.count-m.start):(++h,d[h]=b)}d.length=h+1;for(let p=0,m=d.length;p<m;p++){let b=d[p];e.bufferSubData(c,b.start*u.BYTES_PER_ELEMENT,u,b.start,b.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function a(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(e.deleteBuffer(l.buffer),t.delete(o))}function r(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,n(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:s,remove:a,update:r}}var X2=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,W2=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,q2=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Y2=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,j2=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Z2=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,K2=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT )
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN )
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,J2=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,$2=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Q2=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,t3=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,e3=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,n3=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,i3=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,s3=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,a3=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,r3=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,o3=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,l3=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,c3=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,u3=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,h3=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,d3=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,f3=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,p3=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,m3=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,g3=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,v3=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,y3=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,_3=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,x3="gl_FragColor = linearToOutputTexel( gl_FragColor );",b3=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,S3=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,M3=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,E3=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,T3=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,w3=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,A3=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,C3=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,R3=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,N3=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,D3=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,L3=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,U3=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,I3=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,P3=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,O3=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,B3=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,z3=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,F3=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,G3=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,H3=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,V3=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN

		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );

		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );

		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );

		irradiance *= sheenEnergyComp;

	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,k3=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,X3=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,W3=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,q3=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Y3=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,j3=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Z3=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,K3=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,J3=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,$3=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Q3=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,tN=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,eN=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,nN=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,iN=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,sN=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,aN=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,rN=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,oN=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,lN=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,cN=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,uN=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,hN=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,dN=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,fN=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,pN=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,mN=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,gN=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,vN=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,yN=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,_N=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER

		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {

	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,xN=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,bN=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,SN=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,MN=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,EN=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,TN=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,wN=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif

				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,AN=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,CN=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,RN=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,NN=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,DN=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,LN=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,UN=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,IN=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,PN=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,ON=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,BN=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,zN=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,FN=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,GN=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,HN=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,VN=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,kN=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,XN=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,WN=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,qN=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,YN=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,jN=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ZN=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,KN=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,JN=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,$N=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,QN=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,tD=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,eD=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,nD=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,iD=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,sD=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,aD=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,rD=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,oD=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lD=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,cD=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,uD=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,hD=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,dD=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,fD=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pD=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,mD=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN

		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;

	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gD=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,vD=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yD=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,_D=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,xD=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,bD=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,SD=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,MD=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Kt={alphahash_fragment:X2,alphahash_pars_fragment:W2,alphamap_fragment:q2,alphamap_pars_fragment:Y2,alphatest_fragment:j2,alphatest_pars_fragment:Z2,aomap_fragment:K2,aomap_pars_fragment:J2,batching_pars_vertex:$2,batching_vertex:Q2,begin_vertex:t3,beginnormal_vertex:e3,bsdfs:n3,iridescence_fragment:i3,bumpmap_pars_fragment:s3,clipping_planes_fragment:a3,clipping_planes_pars_fragment:r3,clipping_planes_pars_vertex:o3,clipping_planes_vertex:l3,color_fragment:c3,color_pars_fragment:u3,color_pars_vertex:h3,color_vertex:d3,common:f3,cube_uv_reflection_fragment:p3,defaultnormal_vertex:m3,displacementmap_pars_vertex:g3,displacementmap_vertex:v3,emissivemap_fragment:y3,emissivemap_pars_fragment:_3,colorspace_fragment:x3,colorspace_pars_fragment:b3,envmap_fragment:S3,envmap_common_pars_fragment:M3,envmap_pars_fragment:E3,envmap_pars_vertex:T3,envmap_physical_pars_fragment:O3,envmap_vertex:w3,fog_vertex:A3,fog_pars_vertex:C3,fog_fragment:R3,fog_pars_fragment:N3,gradientmap_pars_fragment:D3,lightmap_pars_fragment:L3,lights_lambert_fragment:U3,lights_lambert_pars_fragment:I3,lights_pars_begin:P3,lights_toon_fragment:B3,lights_toon_pars_fragment:z3,lights_phong_fragment:F3,lights_phong_pars_fragment:G3,lights_physical_fragment:H3,lights_physical_pars_fragment:V3,lights_fragment_begin:k3,lights_fragment_maps:X3,lights_fragment_end:W3,lightprobes_pars_fragment:q3,logdepthbuf_fragment:Y3,logdepthbuf_pars_fragment:j3,logdepthbuf_pars_vertex:Z3,logdepthbuf_vertex:K3,map_fragment:J3,map_pars_fragment:$3,map_particle_fragment:Q3,map_particle_pars_fragment:tN,metalnessmap_fragment:eN,metalnessmap_pars_fragment:nN,morphinstance_vertex:iN,morphcolor_vertex:sN,morphnormal_vertex:aN,morphtarget_pars_vertex:rN,morphtarget_vertex:oN,normal_fragment_begin:lN,normal_fragment_maps:cN,normal_pars_fragment:uN,normal_pars_vertex:hN,normal_vertex:dN,normalmap_pars_fragment:fN,clearcoat_normal_fragment_begin:pN,clearcoat_normal_fragment_maps:mN,clearcoat_pars_fragment:gN,iridescence_pars_fragment:vN,opaque_fragment:yN,packing:_N,premultiplied_alpha_fragment:xN,project_vertex:bN,dithering_fragment:SN,dithering_pars_fragment:MN,roughnessmap_fragment:EN,roughnessmap_pars_fragment:TN,shadowmap_pars_fragment:wN,shadowmap_pars_vertex:AN,shadowmap_vertex:CN,shadowmask_pars_fragment:RN,skinbase_vertex:NN,skinning_pars_vertex:DN,skinning_vertex:LN,skinnormal_vertex:UN,specularmap_fragment:IN,specularmap_pars_fragment:PN,tonemapping_fragment:ON,tonemapping_pars_fragment:BN,transmission_fragment:zN,transmission_pars_fragment:FN,uv_pars_fragment:GN,uv_pars_vertex:HN,uv_vertex:VN,worldpos_vertex:kN,background_vert:XN,background_frag:WN,backgroundCube_vert:qN,backgroundCube_frag:YN,cube_vert:jN,cube_frag:ZN,depth_vert:KN,depth_frag:JN,distance_vert:$N,distance_frag:QN,equirect_vert:tD,equirect_frag:eD,linedashed_vert:nD,linedashed_frag:iD,meshbasic_vert:sD,meshbasic_frag:aD,meshlambert_vert:rD,meshlambert_frag:oD,meshmatcap_vert:lD,meshmatcap_frag:cD,meshnormal_vert:uD,meshnormal_frag:hD,meshphong_vert:dD,meshphong_frag:fD,meshphysical_vert:pD,meshphysical_frag:mD,meshtoon_vert:gD,meshtoon_frag:vD,points_vert:yD,points_frag:_D,shadow_vert:xD,shadow_frag:bD,sprite_vert:SD,sprite_frag:MD},vt={common:{diffuse:{value:new Yt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new kt}},envmap:{envMap:{value:null},envMapRotation:{value:new kt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new kt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new kt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new kt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new kt},normalScale:{value:new Ut(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new kt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new kt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new kt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new kt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Yt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new O},probesMax:{value:new O},probesResolution:{value:new O}},points:{diffuse:{value:new Yt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0},uvTransform:{value:new kt}},sprite:{diffuse:{value:new Yt(16777215)},opacity:{value:1},center:{value:new Ut(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}}},Cs={basic:{uniforms:Bn([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.fog]),vertexShader:Kt.meshbasic_vert,fragmentShader:Kt.meshbasic_frag},lambert:{uniforms:Bn([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,vt.lights,{emissive:{value:new Yt(0)},envMapIntensity:{value:1}}]),vertexShader:Kt.meshlambert_vert,fragmentShader:Kt.meshlambert_frag},phong:{uniforms:Bn([vt.common,vt.specularmap,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,vt.lights,{emissive:{value:new Yt(0)},specular:{value:new Yt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Kt.meshphong_vert,fragmentShader:Kt.meshphong_frag},standard:{uniforms:Bn([vt.common,vt.envmap,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.roughnessmap,vt.metalnessmap,vt.fog,vt.lights,{emissive:{value:new Yt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Kt.meshphysical_vert,fragmentShader:Kt.meshphysical_frag},toon:{uniforms:Bn([vt.common,vt.aomap,vt.lightmap,vt.emissivemap,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.gradientmap,vt.fog,vt.lights,{emissive:{value:new Yt(0)}}]),vertexShader:Kt.meshtoon_vert,fragmentShader:Kt.meshtoon_frag},matcap:{uniforms:Bn([vt.common,vt.bumpmap,vt.normalmap,vt.displacementmap,vt.fog,{matcap:{value:null}}]),vertexShader:Kt.meshmatcap_vert,fragmentShader:Kt.meshmatcap_frag},points:{uniforms:Bn([vt.points,vt.fog]),vertexShader:Kt.points_vert,fragmentShader:Kt.points_frag},dashed:{uniforms:Bn([vt.common,vt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Kt.linedashed_vert,fragmentShader:Kt.linedashed_frag},depth:{uniforms:Bn([vt.common,vt.displacementmap]),vertexShader:Kt.depth_vert,fragmentShader:Kt.depth_frag},normal:{uniforms:Bn([vt.common,vt.bumpmap,vt.normalmap,vt.displacementmap,{opacity:{value:1}}]),vertexShader:Kt.meshnormal_vert,fragmentShader:Kt.meshnormal_frag},sprite:{uniforms:Bn([vt.sprite,vt.fog]),vertexShader:Kt.sprite_vert,fragmentShader:Kt.sprite_frag},background:{uniforms:{uvTransform:{value:new kt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Kt.background_vert,fragmentShader:Kt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new kt}},vertexShader:Kt.backgroundCube_vert,fragmentShader:Kt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Kt.cube_vert,fragmentShader:Kt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Kt.equirect_vert,fragmentShader:Kt.equirect_frag},distance:{uniforms:Bn([vt.common,vt.displacementmap,{referencePosition:{value:new O},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Kt.distance_vert,fragmentShader:Kt.distance_frag},shadow:{uniforms:Bn([vt.lights,vt.fog,{color:{value:new Yt(0)},opacity:{value:1}}]),vertexShader:Kt.shadow_vert,fragmentShader:Kt.shadow_frag}};Cs.physical={uniforms:Bn([Cs.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new kt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new kt},clearcoatNormalScale:{value:new Ut(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new kt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new kt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new kt},sheen:{value:0},sheenColor:{value:new Yt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new kt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new kt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new kt},transmissionSamplerSize:{value:new Ut},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new kt},attenuationDistance:{value:0},attenuationColor:{value:new Yt(0)},specularColor:{value:new Yt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new kt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new kt},anisotropyVector:{value:new Ut},anisotropyMap:{value:null},anisotropyMapTransform:{value:new kt}}]),vertexShader:Kt.meshphysical_vert,fragmentShader:Kt.meshphysical_frag};var Bp={r:0,b:0,g:0},ED=new Oe,fT=new kt;fT.set(-1,0,0,0,1,0,0,0,1);function TD(e,t,n,i,s,a){let r=new Yt(0),o=s===!0?0:1,l,c,u=null,d=0,h=null;function p(v){let S=v.isScene===!0?v.background:null;if(S&&S.isTexture){let x=v.backgroundBlurriness>0;S=t.get(S,x)}return S}function m(v){let S=!1,x=p(v);x===null?g(r,o):x&&x.isColor&&(g(x,1),S=!0);let T=e.xr.getEnvironmentBlendMode();T==="additive"?n.buffers.color.setClear(0,0,0,1,a):T==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||S)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function b(v,S){let x=p(S);x&&(x.isCubeTexture||x.mapping===Nu)?(c===void 0&&(c=new Yn(new wl(1,1,1),new bi({name:"BackgroundCubeMaterial",uniforms:Vr(Cs.backgroundCube.uniforms),vertexShader:Cs.backgroundCube.vertexShader,fragmentShader:Cs.backgroundCube.fragmentShader,side:jn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,E,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=x,c.material.uniforms.backgroundBlurriness.value=S.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(ED.makeRotationFromEuler(S.backgroundRotation)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(fT),c.material.toneMapped=se.getTransfer(x.colorSpace)!==ye,(u!==x||d!==x.version||h!==e.toneMapping)&&(c.material.needsUpdate=!0,u=x,d=x.version,h=e.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):x&&x.isTexture&&(l===void 0&&(l=new Yn(new bu(2,2),new bi({name:"BackgroundMaterial",uniforms:Vr(Cs.background.uniforms),vertexShader:Cs.background.vertexShader,fragmentShader:Cs.background.fragmentShader,side:tr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=x,l.material.uniforms.backgroundIntensity.value=S.backgroundIntensity,l.material.toneMapped=se.getTransfer(x.colorSpace)!==ye,x.matrixAutoUpdate===!0&&x.updateMatrix(),l.material.uniforms.uvTransform.value.copy(x.matrix),(u!==x||d!==x.version||h!==e.toneMapping)&&(l.material.needsUpdate=!0,u=x,d=x.version,h=e.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function g(v,S){v.getRGB(Bp,my(e)),n.buffers.color.setClear(Bp.r,Bp.g,Bp.b,S,a)}function f(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return r},setClearColor:function(v,S=1){r.set(v),o=S,g(r,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,g(r,o)},render:m,addToRenderList:b,dispose:f}}function wD(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},s=h(null),a=s,r=!1;function o(z,X,H,A,L){let F=!1,W=d(z,A,H,X);a!==W&&(a=W,c(a.object)),F=p(z,A,H,L),F&&m(z,A,H,L),L!==null&&t.update(L,e.ELEMENT_ARRAY_BUFFER),(F||r)&&(r=!1,x(z,X,H,A),L!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(L).buffer))}function l(){return e.createVertexArray()}function c(z){return e.bindVertexArray(z)}function u(z){return e.deleteVertexArray(z)}function d(z,X,H,A){let L=A.wireframe===!0,F=i[X.id];F===void 0&&(F={},i[X.id]=F);let W=z.isInstancedMesh===!0?z.id:0,J=F[W];J===void 0&&(J={},F[W]=J);let Y=J[H.id];Y===void 0&&(Y={},J[H.id]=Y);let $=Y[L];return $===void 0&&($=h(l()),Y[L]=$),$}function h(z){let X=[],H=[],A=[];for(let L=0;L<n;L++)X[L]=0,H[L]=0,A[L]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:X,enabledAttributes:H,attributeDivisors:A,object:z,attributes:{},index:null}}function p(z,X,H,A){let L=a.attributes,F=X.attributes,W=0,J=H.getAttributes();for(let Y in J)if(J[Y].location>=0){let at=L[Y],Tt=F[Y];if(Tt===void 0&&(Y==="instanceMatrix"&&z.instanceMatrix&&(Tt=z.instanceMatrix),Y==="instanceColor"&&z.instanceColor&&(Tt=z.instanceColor)),at===void 0||at.attribute!==Tt||Tt&&at.data!==Tt.data)return!0;W++}return a.attributesNum!==W||a.index!==A}function m(z,X,H,A){let L={},F=X.attributes,W=0,J=H.getAttributes();for(let Y in J)if(J[Y].location>=0){let at=F[Y];at===void 0&&(Y==="instanceMatrix"&&z.instanceMatrix&&(at=z.instanceMatrix),Y==="instanceColor"&&z.instanceColor&&(at=z.instanceColor));let Tt={};Tt.attribute=at,at&&at.data&&(Tt.data=at.data),L[Y]=Tt,W++}a.attributes=L,a.attributesNum=W,a.index=A}function b(){let z=a.newAttributes;for(let X=0,H=z.length;X<H;X++)z[X]=0}function g(z){f(z,0)}function f(z,X){let H=a.newAttributes,A=a.enabledAttributes,L=a.attributeDivisors;H[z]=1,A[z]===0&&(e.enableVertexAttribArray(z),A[z]=1),L[z]!==X&&(e.vertexAttribDivisor(z,X),L[z]=X)}function v(){let z=a.newAttributes,X=a.enabledAttributes;for(let H=0,A=X.length;H<A;H++)X[H]!==z[H]&&(e.disableVertexAttribArray(H),X[H]=0)}function S(z,X,H,A,L,F,W){W===!0?e.vertexAttribIPointer(z,X,H,L,F):e.vertexAttribPointer(z,X,H,A,L,F)}function x(z,X,H,A){b();let L=A.attributes,F=H.getAttributes(),W=X.defaultAttributeValues;for(let J in F){let Y=F[J];if(Y.location>=0){let $=L[J];if($===void 0&&(J==="instanceMatrix"&&z.instanceMatrix&&($=z.instanceMatrix),J==="instanceColor"&&z.instanceColor&&($=z.instanceColor)),$!==void 0){let at=$.normalized,Tt=$.itemSize,wt=t.get($);if(wt===void 0)continue;let ae=wt.buffer,ne=wt.type,re=wt.bytesPerElement,Q=ne===e.INT||ne===e.UNSIGNED_INT||$.gpuType===Qf;if($.isInterleavedBufferAttribute){let nt=$.data,St=nt.stride,Gt=$.offset;if(nt.isInstancedInterleavedBuffer){for(let _t=0;_t<Y.locationSize;_t++)f(Y.location+_t,nt.meshPerAttribute);z.isInstancedMesh!==!0&&A._maxInstanceCount===void 0&&(A._maxInstanceCount=nt.meshPerAttribute*nt.count)}else for(let _t=0;_t<Y.locationSize;_t++)g(Y.location+_t);e.bindBuffer(e.ARRAY_BUFFER,ae);for(let _t=0;_t<Y.locationSize;_t++)S(Y.location+_t,Tt/Y.locationSize,ne,at,St*re,(Gt+Tt/Y.locationSize*_t)*re,Q)}else{if($.isInstancedBufferAttribute){for(let nt=0;nt<Y.locationSize;nt++)f(Y.location+nt,$.meshPerAttribute);z.isInstancedMesh!==!0&&A._maxInstanceCount===void 0&&(A._maxInstanceCount=$.meshPerAttribute*$.count)}else for(let nt=0;nt<Y.locationSize;nt++)g(Y.location+nt);e.bindBuffer(e.ARRAY_BUFFER,ae);for(let nt=0;nt<Y.locationSize;nt++)S(Y.location+nt,Tt/Y.locationSize,ne,at,Tt*re,Tt/Y.locationSize*nt*re,Q)}}else if(W!==void 0){let at=W[J];if(at!==void 0)switch(at.length){case 2:e.vertexAttrib2fv(Y.location,at);break;case 3:e.vertexAttrib3fv(Y.location,at);break;case 4:e.vertexAttrib4fv(Y.location,at);break;default:e.vertexAttrib1fv(Y.location,at)}}}}v()}function T(){C();for(let z in i){let X=i[z];for(let H in X){let A=X[H];for(let L in A){let F=A[L];for(let W in F)u(F[W].object),delete F[W];delete A[L]}}delete i[z]}}function E(z){if(i[z.id]===void 0)return;let X=i[z.id];for(let H in X){let A=X[H];for(let L in A){let F=A[L];for(let W in F)u(F[W].object),delete F[W];delete A[L]}}delete i[z.id]}function w(z){for(let X in i){let H=i[X];for(let A in H){let L=H[A];if(L[z.id]===void 0)continue;let F=L[z.id];for(let W in F)u(F[W].object),delete F[W];delete L[z.id]}}}function y(z){for(let X in i){let H=i[X],A=z.isInstancedMesh===!0?z.id:0,L=H[A];if(L!==void 0){for(let F in L){let W=L[F];for(let J in W)u(W[J].object),delete W[J];delete L[F]}delete H[A],Object.keys(H).length===0&&delete i[X]}}}function C(){D(),r=!0,a!==s&&(a=s,c(a.object))}function D(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:C,resetDefaultState:D,dispose:T,releaseStatesOfGeometry:E,releaseStatesOfObject:y,releaseStatesOfProgram:w,initAttributes:b,enableAttribute:g,disableUnusedAttributes:v}}function AD(e,t,n){let i;function s(l){i=l}function a(l,c){e.drawArrays(i,l,c),n.update(c,i,1)}function r(l,c,u){u!==0&&(e.drawArraysInstanced(i,l,c,u),n.update(c,i,u))}function o(l,c,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,u);let h=0;for(let p=0;p<u;p++)h+=c[p];n.update(h,i,1)}this.setMode=s,this.render=a,this.renderInstances=r,this.renderMultiDraw=o}function CD(e,t,n,i){let s;function a(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let w=t.get("EXT_texture_filter_anisotropic");s=e.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function r(w){return!(w!==Pi&&i.convert(w)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(w){let y=w===$i&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(w!==Mi&&w!==Ji&&!y&&i.convert(w)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function l(w){if(w==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=n.precision!==void 0?n.precision:"highp",u=l(c);u!==c&&(Pt("WebGLRenderer:",c,"not supported, using",u,"instead."),c=u);let d=n.logarithmicDepthBuffer===!0,h=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control");n.reversedDepthBuffer===!0&&h===!1&&Pt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),b=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),f=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),S=e.getParameter(e.MAX_VARYING_VECTORS),x=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),T=e.getParameter(e.MAX_SAMPLES),E=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:l,textureFormatReadable:r,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:h,maxTextures:p,maxVertexTextures:m,maxTextureSize:b,maxCubemapSize:g,maxAttributes:f,maxVertexUniforms:v,maxVaryings:S,maxFragmentUniforms:x,maxSamples:T,samples:E}}function RD(e){let t=this,n=null,i=0,s=!1,a=!1,r=new _i,o=new kt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,h){let p=d.length!==0||h||i!==0||s;return s=h,i=d.length,p},this.beginShadows=function(){a=!0,u(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(d,h){n=u(d,h,0)},this.setState=function(d,h,p){let m=d.clippingPlanes,b=d.clipIntersection,g=d.clipShadows,f=e.get(d);if(!s||m===null||m.length===0||a&&!g)a?u(null):c();else{let v=a?0:i,S=v*4,x=f.clippingState||null;l.value=x,x=u(m,h,S,p);for(let T=0;T!==S;++T)x[T]=n[T];f.clippingState=x,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==n&&(l.value=n,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function u(d,h,p,m){let b=d!==null?d.length:0,g=null;if(b!==0){if(g=l.value,m!==!0||g===null){let f=p+b*4,v=h.matrixWorldInverse;o.getNormalMatrix(v),(g===null||g.length<f)&&(g=new Float32Array(f));for(let S=0,x=p;S!==b;++S,x+=4)r.copy(d[S]).applyMatrix4(v,o),r.normal.toArray(g,x),g[x+3]=r.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=b,t.numIntersection=0,g}}var Ll=4,ND=6,DD=20,LD=256,zu=new Tu,WE=new Yt,_y=null,xy=0,by=0,Sy=!1,UD=new O,kr=new O,Fp=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,n=0,i=.1,s=100,a={}){let{size:r=256,position:o=UD}=a;_y=this._renderer.getRenderTarget(),xy=this._renderer.getActiveCubeFace(),by=this._renderer.getActiveMipmapLevel(),Sy=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(r);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,i,s,l,o),n>0&&this._blur(l,0,0,n),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,n=null){return this._fromTexture(t,n)}fromCubemap(t,n=null){return this._fromTexture(t,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=jE(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=YE(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(_y,xy,by),this._renderer.xr.enabled=Sy,t.scissorTest=!1,Dl(t,0,0,t.width,t.height)}_fromTexture(t,n){t.mapping===nr||t.mapping===Hr?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),_y=this._renderer.getRenderTarget(),xy=this._renderer.getActiveCubeFace(),by=this._renderer.getActiveMipmapLevel(),Sy=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=n||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,i={magFilter:An,minFilter:An,generateMipmaps:!1,type:$i,format:Pi,colorSpace:nu,depthBuffer:!1},s=qE(t,n,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==n){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=qE(t,n,i);let{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=ID(a)),this._blurMaterial=OD(a,t,n),this._ggxMaterial=PD(a,t,n)}return s}_compileMaterial(t){let n=new Yn(new yn,t);this._renderer.compile(n,zu)}_sceneToCubeUV(t,n,i,s,a){let l=new Pn(90,1,n,i),c=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],d=this._renderer,h=d.autoClear,p=d.toneMapping;d.getClearColor(WE),d.toneMapping=Zi,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Yn(new wl,new Ya({name:"PMREM.Background",side:jn,depthWrite:!1,depthTest:!1})));let b=this._backgroundBox,g=b.material,f=!1,v=t.background;v?v.isColor&&(g.color.copy(v),t.background=null,f=!0):(g.color.copy(WE),f=!0);for(let S=0;S<6;S++){let x=S%3;x===0?(l.up.set(0,c[S],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x+u[S],a.y,a.z)):x===1?(l.up.set(0,0,c[S]),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y+u[S],a.z)):(l.up.set(0,c[S],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y,a.z+u[S]));let T=this._cubeSize;Dl(s,x*T,S>2?T:0,T,T),d.setRenderTarget(s),f&&d.render(b,l),d.render(t,l)}d.toneMapping=p,d.autoClear=h,t.background=v}_textureToCubeUV(t,n){let i=this._renderer,s=t.mapping===nr||t.mapping===Hr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=jE()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=YE());let a=s?this._cubemapMaterial:this._equirectMaterial,r=this._lodMeshes[0];r.material=a;let o=a.uniforms;o.envMap.value=t;let l=this._cubeSize;Dl(n,0,0,3*l,2*l),i.setRenderTarget(n),i.render(r,zu)}_applyPMREM(t){let n=this._renderer,i=n.autoClear;n.autoClear=!1;let s=this._lodMeshes.length;for(let a=1;a<s;a++)this._applyGGXFilter(t,a-1,a);n.autoClear=i}_applyGGXFilter(t,n,i){let s=this._renderer,a=this._pingPongRenderTarget,r=this._ggxMaterial,o=this._lodMeshes[i];o.material=r;let l=r.uniforms,c=i/(this._lodMeshes.length-1),u=n/(this._lodMeshes.length-1),d=Math.sqrt(c*c-u*u),h=c*1.25,p=d*h,{_lodMax:m}=this,b=this._sizeLods[i],g=3*b*(i>m-Ll?i-m+Ll:0),f=4*(this._cubeSize-b);l.envMap.value=t.texture,l.roughness.value=p,l.mipInt.value=m-n,Dl(a,g,f,3*b,2*b),s.setRenderTarget(a),s.render(o,zu),l.envMap.value=a.texture,l.roughness.value=0,l.mipInt.value=m-i,Dl(t,g,f,3*b,2*b),s.setRenderTarget(t),s.render(o,zu)}_blur(t,n,i,s){let a=this._pingPongRenderTarget,r=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,a,n,i,r),this._blurPass(a,t,i,i,r)}_blurPass(t,n,i,s,a){let r=this._renderer,o=this._blurMaterial,l=this._lodMeshes[s];l.material=o;let c=o.uniforms;c.envMap.value=t.texture,c.sigma.value=a,c.mipInt.value=this._lodMax-i;let u=this._sizeLods[s],d=3*u*(s>this._lodMax-Ll?s-this._lodMax+Ll:0),h=4*(this._cubeSize-u);Dl(n,d,h,3*u,2*u),r.setRenderTarget(n),r.render(l,zu)}};function ID(e){let t=[],n=[],i=e,s=e-Ll+1+ND;for(let a=0;a<s;a++){let r=Math.pow(2,i);t.push(r);let o=1/(r-2),l=-o,c=1+o,u=[l,l,c,l,c,c,l,l,c,c,l,c],d=6,h=6,p=3,m=new Float32Array(p*h*d),b=new Float32Array(p*h*d);for(let f=0;f<d;f++){let v=f%3*2/3-1,S=f>2?0:-1,x=[v,S,0,v+2/3,S,0,v+2/3,S+1,0,v,S,0,v+2/3,S+1,0,v,S+1,0];m.set(x,p*h*f);for(let T=0;T<h;T++){let E=u[T*2]*2-1,w=u[T*2+1]*2-1;f===0?kr.set(1,w,E):f===1?kr.set(-E,1,-w):f===2?kr.set(-E,w,1):f===3?kr.set(-1,w,-E):f===4?kr.set(-E,-1,w):kr.set(E,w,-1),kr.toArray(b,(f*h+T)*p)}}let g=new yn;g.setAttribute("position",new Xn(m,p)),g.setAttribute("outputDirection",new Xn(b,p)),n.push(new Yn(g,null)),i>Ll&&i--}return{lodMeshes:n,sizeLods:t}}function qE(e,t,n){let i=new si(e,t,n);return i.texture.mapping=Nu,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Dl(e,t,n,i,s){e.viewport.set(t,n,i,s),e.scissor.set(t,n,i,s)}function PD(e,t,n){return new bi({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:LD,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Vp(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Ts,depthTest:!1,depthWrite:!1})}function OD(e,t,n){return new bi({name:"SphericalGaussianBlur",defines:{SAMPLES:DD,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Vp(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Ts,depthTest:!1,depthWrite:!1})}function YE(){return new bi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Vp(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Ts,depthTest:!1,depthWrite:!1})}function jE(){return new bi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Vp(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Ts,depthTest:!1,depthWrite:!1})}function Vp(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Gp=class extends si{constructor(t=1,n={}){super(t,t,n),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new gu(s),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new wl(5,5,5),a=new bi({name:"CubemapFromEquirect",uniforms:Vr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:jn,blending:Ts});a.uniforms.tEquirect.value=n;let r=new Yn(s,a),o=n.minFilter;return n.minFilter===ir&&(n.minFilter=An),new jf(1,10,this).update(t,r),n.minFilter=o,r.geometry.dispose(),r.material.dispose(),this}clear(t,n=!0,i=!0,s=!0){let a=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(n,i,s);t.setRenderTarget(a)}};function BD(e){let t=new WeakMap,n=new WeakMap,i=null;function s(h,p=!1){return h==null?null:p?r(h):a(h)}function a(h){if(h&&h.isTexture){let p=h.mapping;if(p===Kf||p===Jf)if(t.has(h)){let m=t.get(h).texture;return o(m,h.mapping)}else{let m=h.image;if(m&&m.height>0){let b=new Gp(m.height);return b.fromEquirectangularTexture(e,h),t.set(h,b),h.addEventListener("dispose",c),o(b.texture,h.mapping)}else return null}}return h}function r(h){if(h&&h.isTexture){let p=h.mapping,m=p===Kf||p===Jf,b=p===nr||p===Hr;if(m||b){let g=n.get(h),f=g!==void 0?g.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==f)return i===null&&(i=new Fp(e)),g=m?i.fromEquirectangular(h,g):i.fromCubemap(h,g),g.texture.pmremVersion=h.pmremVersion,n.set(h,g),g.texture;if(g!==void 0)return g.texture;{let v=h.image;return m&&v&&v.height>0||b&&v&&l(v)?(i===null&&(i=new Fp(e)),g=m?i.fromEquirectangular(h):i.fromCubemap(h),g.texture.pmremVersion=h.pmremVersion,n.set(h,g),h.addEventListener("dispose",u),g.texture):null}}}return h}function o(h,p){return p===Kf?h.mapping=nr:p===Jf&&(h.mapping=Hr),h}function l(h){let p=0,m=6;for(let b=0;b<m;b++)h[b]!==void 0&&p++;return p===m}function c(h){let p=h.target;p.removeEventListener("dispose",c);let m=t.get(p);m!==void 0&&(t.delete(p),m.dispose())}function u(h){let p=h.target;p.removeEventListener("dispose",u);let m=n.get(p);m!==void 0&&(n.delete(p),m.dispose())}function d(){t=new WeakMap,n=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:d}}function zD(e){let t={};function n(i){if(t[i]!==void 0)return t[i];let s=e.getExtension(i);return t[i]=s,s}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){let s=n(i);return s===null&&Br("WebGLRenderer: "+i+" extension not supported."),s}}}function FD(e,t,n,i){let s={},a=new WeakMap;function r(d){let h=d.target;h.index!==null&&t.remove(h.index);for(let m in h.attributes)t.remove(h.attributes[m]);h.removeEventListener("dispose",r),delete s[h.id];let p=a.get(h);p&&(t.remove(p),a.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,n.memory.geometries--}function o(d,h){return s[h.id]===!0||(h.addEventListener("dispose",r),s[h.id]=!0,n.memory.geometries++),h}function l(d){let h=d.attributes;for(let p in h)t.update(h[p],e.ARRAY_BUFFER)}function c(d){let h=[],p=d.index,m=d.attributes.position,b=0;if(m===void 0)return;if(p!==null){let v=p.array;b=p.version;for(let S=0,x=v.length;S<x;S+=3){let T=v[S+0],E=v[S+1],w=v[S+2];h.push(T,E,E,w,w,T)}}else{let v=m.array;b=m.version;for(let S=0,x=v.length/3-1;S<x;S+=3){let T=S+0,E=S+1,w=S+2;h.push(T,E,E,w,w,T)}}let g=new(m.count>=65535?hu:uu)(h,1);g.version=b;let f=a.get(d);f&&t.remove(f),a.set(d,g)}function u(d){let h=a.get(d);if(h){let p=d.index;p!==null&&h.version<p.version&&c(d)}else c(d);return a.get(d)}return{get:o,update:l,getWireframeAttribute:u}}function GD(e,t,n){let i;function s(d){i=d}let a,r;function o(d){a=d.type,r=d.bytesPerElement}function l(d,h){e.drawElements(i,h,a,d*r),n.update(h,i,1)}function c(d,h,p){p!==0&&(e.drawElementsInstanced(i,h,a,d*r,p),n.update(h,i,p))}function u(d,h,p){if(p===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,a,d,0,p);let b=0;for(let g=0;g<p;g++)b+=h[g];n.update(b,i,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=u}function HD(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,r,o){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=o*(a/3);break;case e.LINES:n.lines+=o*(a/2);break;case e.LINE_STRIP:n.lines+=o*(a-1);break;case e.LINE_LOOP:n.lines+=o*a;break;case e.POINTS:n.points+=o*a;break;default:zt("WebGLInfo: Unknown draw mode:",r);break}}function s(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:s,update:i}}function VD(e,t,n){let i=new WeakMap,s=new qe;function a(r,o,l){let c=r.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=u!==void 0?u.length:0,h=i.get(o);if(h===void 0||h.count!==d){let C=function(){w.dispose(),i.delete(o),o.removeEventListener("dispose",C)};h!==void 0&&h.texture.dispose();let p=o.morphAttributes.position!==void 0,m=o.morphAttributes.normal!==void 0,b=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],f=o.morphAttributes.normal||[],v=o.morphAttributes.color||[],S=0;p===!0&&(S=1),m===!0&&(S=2),b===!0&&(S=3);let x=o.attributes.position.count*S,T=1;x>t.maxTextureSize&&(T=Math.ceil(x/t.maxTextureSize),x=t.maxTextureSize);let E=new Float32Array(x*T*4*d),w=new ou(E,x,T,d);w.type=Ji,w.needsUpdate=!0;let y=S*4;for(let D=0;D<d;D++){let z=g[D],X=f[D],H=v[D],A=x*T*4*D;for(let L=0;L<z.count;L++){let F=L*y;p===!0&&(s.fromBufferAttribute(z,L),E[A+F+0]=s.x,E[A+F+1]=s.y,E[A+F+2]=s.z,E[A+F+3]=0),m===!0&&(s.fromBufferAttribute(X,L),E[A+F+4]=s.x,E[A+F+5]=s.y,E[A+F+6]=s.z,E[A+F+7]=0),b===!0&&(s.fromBufferAttribute(H,L),E[A+F+8]=s.x,E[A+F+9]=s.y,E[A+F+10]=s.z,E[A+F+11]=H.itemSize===4?s.w:1)}}h={count:d,texture:w,size:new Ut(x,T)},i.set(o,h),o.addEventListener("dispose",C)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)l.getUniforms().setValue(e,"morphTexture",r.morphTexture,n);else{let p=0;for(let b=0;b<c.length;b++)p+=c[b];let m=o.morphTargetsRelative?1:1-p;l.getUniforms().setValue(e,"morphTargetBaseInfluence",m),l.getUniforms().setValue(e,"morphTargetInfluences",c)}l.getUniforms().setValue(e,"morphTargetsTexture",h.texture,n),l.getUniforms().setValue(e,"morphTargetsTextureSize",h.size)}return{update:a}}function kD(e,t,n,i,s){let a=new WeakMap;function r(c){let u=s.render.frame,d=c.geometry,h=t.get(c,d);if(a.get(h)!==u&&(t.update(h),a.set(h,u)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),a.get(c)!==u&&(n.update(c.instanceMatrix,e.ARRAY_BUFFER),c.instanceColor!==null&&n.update(c.instanceColor,e.ARRAY_BUFFER),a.set(c,u))),c.isSkinnedMesh){let p=c.skeleton;a.get(p)!==u&&(p.update(),a.set(p,u))}return h}function o(){a=new WeakMap}function l(c){let u=c.target;u.removeEventListener("dispose",l),i.releaseStatesOfObject(u),n.remove(u.instanceMatrix),u.instanceColor!==null&&n.remove(u.instanceColor)}return{update:r,dispose:o}}var XD={[Kv]:"LINEAR_TONE_MAPPING",[Jv]:"REINHARD_TONE_MAPPING",[$v]:"CINEON_TONE_MAPPING",[Qv]:"ACES_FILMIC_TONE_MAPPING",[ey]:"AGX_TONE_MAPPING",[ny]:"NEUTRAL_TONE_MAPPING",[ty]:"CUSTOM_TONE_MAPPING"};function WD(e,t,n,i,s,a){let r=new si(t,n,{type:e,depthBuffer:s,stencilBuffer:a,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=new yn;c.setAttribute("position",new On([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new On([0,2,0,0,2,0],2));let u=new Pf({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Yn(c,u),h=new Tu(-1,1,1,-1,0,1),p=null,m=null,b=!1,g,f=null,v=[],S=!1;this.setSize=function(x,T){r.setSize(x,T),o!==null&&o.setSize(x,T),l!==null&&l.setSize(x,T);for(let E=0;E<v.length;E++){let w=v[E];w.setSize&&w.setSize(x,T)}},this.setEffects=function(x){v=x,S=v.length>0&&v[0].isRenderPass===!0;let T=r.width,E=r.height;v.length>0&&o===null&&(o=new si(T,E,{type:$i,depthBuffer:!1,stencilBuffer:!1}),l=new si(T,E,{type:$i,depthBuffer:!1,stencilBuffer:!1}));for(let w=0;w<v.length;w++){let y=v[w];y.setSize&&y.setSize(T,E)}},this.begin=function(x,T){if(b||x.toneMapping===Zi&&v.length===0)return!1;if(f=T,T!==null){let E=T.width,w=T.height;(r.width!==E||r.height!==w)&&this.setSize(E,w)}return S===!1&&x.setRenderTarget(r),g=x.toneMapping,x.toneMapping=Zi,!0},this.hasRenderPass=function(){return S},this.end=function(x,T){x.toneMapping=g,b=!0;let E=r,w=o;for(let y=0;y<v.length;y++){let C=v[y];C.enabled!==!1&&(C.render(x,w,E,T),C.needsSwap!==!1&&(E=w,w=w===o?l:o))}if(p!==x.outputColorSpace||m!==x.toneMapping){p=x.outputColorSpace,m=x.toneMapping,u.defines={},se.getTransfer(p)===ye&&(u.defines.SRGB_TRANSFER="");let y=XD[m];y&&(u.defines[y]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=E.texture,x.setRenderTarget(f),x.render(d,h),f=null,b=!1},this.isCompositing=function(){return b},this.dispose=function(){r.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),u.dispose()}}var pT=new Wn,Ty=new ja(1,1),mT=new ou,gT=new Rf,vT=new gu,ZE=[],KE=[],JE=new Float32Array(16),$E=new Float32Array(9),QE=new Float32Array(4);function Il(e,t,n){let i=e[0];if(i<=0||i>0)return e;let s=t*n,a=ZE[s];if(a===void 0&&(a=new Float32Array(s),ZE[s]=a),t!==0){i.toArray(a,0);for(let r=1,o=0;r!==t;++r)o+=n,e[r].toArray(a,o)}return a}function cn(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function un(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function kp(e,t){let n=KE[t];n===void 0&&(n=new Int32Array(t),KE[t]=n);for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function qD(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function YD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(cn(n,t))return;e.uniform2fv(this.addr,t),un(n,t)}}function jD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(cn(n,t))return;e.uniform3fv(this.addr,t),un(n,t)}}function ZD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(cn(n,t))return;e.uniform4fv(this.addr,t),un(n,t)}}function KD(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(cn(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),un(n,t)}else{if(cn(n,i))return;QE.set(i),e.uniformMatrix2fv(this.addr,!1,QE),un(n,i)}}function JD(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(cn(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),un(n,t)}else{if(cn(n,i))return;$E.set(i),e.uniformMatrix3fv(this.addr,!1,$E),un(n,i)}}function $D(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(cn(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),un(n,t)}else{if(cn(n,i))return;JE.set(i),e.uniformMatrix4fv(this.addr,!1,JE),un(n,i)}}function QD(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function tL(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(cn(n,t))return;e.uniform2iv(this.addr,t),un(n,t)}}function eL(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(cn(n,t))return;e.uniform3iv(this.addr,t),un(n,t)}}function nL(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(cn(n,t))return;e.uniform4iv(this.addr,t),un(n,t)}}function iL(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function sL(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(cn(n,t))return;e.uniform2uiv(this.addr,t),un(n,t)}}function aL(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(cn(n,t))return;e.uniform3uiv(this.addr,t),un(n,t)}}function rL(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(cn(n,t))return;e.uniform4uiv(this.addr,t),un(n,t)}}function oL(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s);let a;this.type===e.SAMPLER_2D_SHADOW?(Ty.compareFunction=n.isReversedDepthBuffer()?Op:Pp,a=Ty):a=pT,n.setTexture2D(t||a,s)}function lL(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture3D(t||gT,s)}function cL(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTextureCube(t||vT,s)}function uL(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture2DArray(t||mT,s)}function hL(e){switch(e){case 5126:return qD;case 35664:return YD;case 35665:return jD;case 35666:return ZD;case 35674:return KD;case 35675:return JD;case 35676:return $D;case 5124:case 35670:return QD;case 35667:case 35671:return tL;case 35668:case 35672:return eL;case 35669:case 35673:return nL;case 5125:return iL;case 36294:return sL;case 36295:return aL;case 36296:return rL;case 35678:case 36198:case 36298:case 36306:case 35682:return oL;case 35679:case 36299:case 36307:return lL;case 35680:case 36300:case 36308:case 36293:return cL;case 36289:case 36303:case 36311:case 36292:return uL}}function dL(e,t){e.uniform1fv(this.addr,t)}function fL(e,t){let n=Il(t,this.size,2);e.uniform2fv(this.addr,n)}function pL(e,t){let n=Il(t,this.size,3);e.uniform3fv(this.addr,n)}function mL(e,t){let n=Il(t,this.size,4);e.uniform4fv(this.addr,n)}function gL(e,t){let n=Il(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function vL(e,t){let n=Il(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function yL(e,t){let n=Il(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function _L(e,t){e.uniform1iv(this.addr,t)}function xL(e,t){e.uniform2iv(this.addr,t)}function bL(e,t){e.uniform3iv(this.addr,t)}function SL(e,t){e.uniform4iv(this.addr,t)}function ML(e,t){e.uniform1uiv(this.addr,t)}function EL(e,t){e.uniform2uiv(this.addr,t)}function TL(e,t){e.uniform3uiv(this.addr,t)}function wL(e,t){e.uniform4uiv(this.addr,t)}function AL(e,t,n){let i=this.cache,s=t.length,a=kp(n,s);cn(i,a)||(e.uniform1iv(this.addr,a),un(i,a));let r;this.type===e.SAMPLER_2D_SHADOW?r=Ty:r=pT;for(let o=0;o!==s;++o)n.setTexture2D(t[o]||r,a[o])}function CL(e,t,n){let i=this.cache,s=t.length,a=kp(n,s);cn(i,a)||(e.uniform1iv(this.addr,a),un(i,a));for(let r=0;r!==s;++r)n.setTexture3D(t[r]||gT,a[r])}function RL(e,t,n){let i=this.cache,s=t.length,a=kp(n,s);cn(i,a)||(e.uniform1iv(this.addr,a),un(i,a));for(let r=0;r!==s;++r)n.setTextureCube(t[r]||vT,a[r])}function NL(e,t,n){let i=this.cache,s=t.length,a=kp(n,s);cn(i,a)||(e.uniform1iv(this.addr,a),un(i,a));for(let r=0;r!==s;++r)n.setTexture2DArray(t[r]||mT,a[r])}function DL(e){switch(e){case 5126:return dL;case 35664:return fL;case 35665:return pL;case 35666:return mL;case 35674:return gL;case 35675:return vL;case 35676:return yL;case 5124:case 35670:return _L;case 35667:case 35671:return xL;case 35668:case 35672:return bL;case 35669:case 35673:return SL;case 5125:return ML;case 36294:return EL;case 36295:return TL;case 36296:return wL;case 35678:case 36198:case 36298:case 36306:case 35682:return AL;case 35679:case 36299:case 36307:return CL;case 35680:case 36300:case 36308:case 36293:return RL;case 36289:case 36303:case 36311:case 36292:return NL}}var wy=class{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.setValue=hL(n.type)}},Ay=class{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=DL(n.type)}},Cy=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,n,i){let s=this.seq;for(let a=0,r=s.length;a!==r;++a){let o=s[a];o.setValue(t,n[o.id],i)}}},My=/(\w+)(\])?(\[|\.)?/g;function tT(e,t){e.seq.push(t),e.map[t.id]=t}function LL(e,t,n){let i=e.name,s=i.length;for(My.lastIndex=0;;){let a=My.exec(i),r=My.lastIndex,o=a[1],l=a[2]==="]",c=a[3];if(l&&(o=o|0),c===void 0||c==="["&&r+2===s){tT(n,c===void 0?new wy(o,e,t):new Ay(o,e,t));break}else{let d=n.map[o];d===void 0&&(d=new Cy(o),tT(n,d)),n=d}}}var Ul=class{constructor(t,n){this.seq=[],this.map={};let i=t.getProgramParameter(n,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){let o=t.getActiveUniform(n,r),l=t.getUniformLocation(n,o.name);LL(o,l,this)}let s=[],a=[];for(let r of this.seq)r.type===t.SAMPLER_2D_SHADOW||r.type===t.SAMPLER_CUBE_SHADOW||r.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(r):a.push(r);s.length>0&&(this.seq=s.concat(a))}setValue(t,n,i,s){let a=this.map[n];a!==void 0&&a.setValue(t,i,s)}setOptional(t,n,i){let s=n[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,n,i,s){for(let a=0,r=n.length;a!==r;++a){let o=n[a],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,n){let i=[];for(let s=0,a=t.length;s!==a;++s){let r=t[s];r.id in n&&i.push(r)}return i}};function eT(e,t,n){let i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}var UL=37297,IL=0;function PL(e,t){let n=e.split(`
`),i=[],s=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let r=s;r<a;r++){let o=r+1;i.push(`${o===t?">":" "} ${o}: ${n[r]}`)}return i.join(`
`)}var nT=new kt;function OL(e){se._getMatrix(nT,se.workingColorSpace,e);let t=`mat3( ${nT.elements.map(n=>n.toFixed(4))} )`;switch(se.getTransfer(e)){case iu:return[t,"LinearTransferOETF"];case ye:return[t,"sRGBTransferOETF"];default:return Pt("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function iT(e,t,n){let i=e.getShaderParameter(t,e.COMPILE_STATUS),a=(e.getShaderInfoLog(t)||"").trim();if(i&&a==="")return"";let r=/ERROR: 0:(\d+)/.exec(a);if(r){let o=parseInt(r[1]);return n.toUpperCase()+`

`+a+`

`+PL(e.getShaderSource(t),o)}else return a}function BL(e,t){let n=OL(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}var zL={[Kv]:"Linear",[Jv]:"Reinhard",[$v]:"Cineon",[Qv]:"ACESFilmic",[ey]:"AgX",[ny]:"Neutral",[ty]:"Custom"};function FL(e,t){let n=zL[t];return n===void 0?(Pt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}var zp=new O;function GL(){se.getLuminanceCoefficients(zp);let e=zp.x.toFixed(4),t=zp.y.toFixed(4),n=zp.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function HL(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Gu).join(`
`)}function VL(e){let t=[];for(let n in e){let i=e[n];i!==!1&&t.push("#define "+n+" "+i)}return t.join(`
`)}function kL(e,t){let n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let a=e.getActiveAttrib(t,s),r=a.name,o=1;a.type===e.FLOAT_MAT2&&(o=2),a.type===e.FLOAT_MAT3&&(o=3),a.type===e.FLOAT_MAT4&&(o=4),n[r]={type:a.type,location:e.getAttribLocation(t,r),locationSize:o}}return n}function Gu(e){return e!==""}function sT(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function aT(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var XL=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ry(e){return e.replace(XL,qL)}var WL=new Map;function qL(e,t){let n=Kt[t];if(n===void 0){let i=WL.get(t);if(i!==void 0)n=Kt[i],Pt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Ry(n)}var YL=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function rT(e){return e.replace(YL,jL)}function jL(e,t,n,i){let s="";for(let a=parseInt(t);a<parseInt(n);a++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return s}function oT(e){let t=`precision ${e.precision} float;
	precision ${e.precision} int;
	precision ${e.precision} sampler2D;
	precision ${e.precision} samplerCube;
	precision ${e.precision} sampler3D;
	precision ${e.precision} sampler2DArray;
	precision ${e.precision} sampler2DShadow;
	precision ${e.precision} samplerCubeShadow;
	precision ${e.precision} sampler2DArrayShadow;
	precision ${e.precision} isampler2D;
	precision ${e.precision} isampler3D;
	precision ${e.precision} isamplerCube;
	precision ${e.precision} isampler2DArray;
	precision ${e.precision} usampler2D;
	precision ${e.precision} usampler3D;
	precision ${e.precision} usamplerCube;
	precision ${e.precision} usampler2DArray;
	`;return e.precision==="highp"?t+=`
#define HIGH_PRECISION`:e.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:e.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}var ZL={[Cu]:"SHADOWMAP_TYPE_PCF",[Cl]:"SHADOWMAP_TYPE_VSM"};function KL(e){return ZL[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var JL={[nr]:"ENVMAP_TYPE_CUBE",[Hr]:"ENVMAP_TYPE_CUBE",[Nu]:"ENVMAP_TYPE_CUBE_UV"};function $L(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":JL[e.envMapMode]||"ENVMAP_TYPE_CUBE"}var QL={[Hr]:"ENVMAP_MODE_REFRACTION"};function tU(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":QL[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}var eU={[Zv]:"ENVMAP_BLENDING_MULTIPLY",[EE]:"ENVMAP_BLENDING_MIX",[TE]:"ENVMAP_BLENDING_ADD"};function nU(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":eU[e.combine]||"ENVMAP_BLENDING_NONE"}function iU(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,n),112)),texelHeight:i,maxMip:n}}function sU(e,t,n,i){let s=e.getContext(),a=n.defines,r=n.vertexShader,o=n.fragmentShader,l=KL(n),c=$L(n),u=tU(n),d=nU(n),h=iU(n),p=HL(n),m=VL(a),b=s.createProgram(),g,f,v=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(g=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(Gu).join(`
`),g.length>0&&(g+=`
`),f=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(Gu).join(`
`),f.length>0&&(f+=`
`)):(g=[oT(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+u:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Gu).join(`
`),f=[oT(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+c:"",n.envMap?"#define "+u:"",n.envMap?"#define "+d:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==Zi?"#define TONE_MAPPING":"",n.toneMapping!==Zi?Kt.tonemapping_pars_fragment:"",n.toneMapping!==Zi?FL("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",Kt.colorspace_pars_fragment,BL("linearToOutputTexel",n.outputColorSpace),GL(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(Gu).join(`
`)),r=Ry(r),r=sT(r,n),r=aT(r,n),o=Ry(o),o=sT(o,n),o=aT(o,n),r=rT(r),o=rT(o),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,f=["#define varying in",n.glslVersion===fy?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===fy?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let S=v+g+r,x=v+f+o,T=eT(s,s.VERTEX_SHADER,S),E=eT(s,s.FRAGMENT_SHADER,x);s.attachShader(b,T),s.attachShader(b,E),n.index0AttributeName!==void 0?s.bindAttribLocation(b,0,n.index0AttributeName):n.hasPositionAttribute===!0&&s.bindAttribLocation(b,0,"position"),s.linkProgram(b);function w(z){if(e.debug.checkShaderErrors){let X=s.getProgramInfoLog(b)||"",H=s.getShaderInfoLog(T)||"",A=s.getShaderInfoLog(E)||"",L=X.trim(),F=H.trim(),W=A.trim(),J=!0,Y=!0;if(s.getProgramParameter(b,s.LINK_STATUS)===!1)if(J=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(s,b,T,E);else{let $=iT(s,T,"vertex"),at=iT(s,E,"fragment");zt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(b,s.VALIDATE_STATUS)+`

Material Name: `+z.name+`
Material Type: `+z.type+`

Program Info Log: `+L+`
`+$+`
`+at)}else L!==""?Pt("WebGLProgram: Program Info Log:",L):(F===""||W==="")&&(Y=!1);Y&&(z.diagnostics={runnable:J,programLog:L,vertexShader:{log:F,prefix:g},fragmentShader:{log:W,prefix:f}})}s.deleteShader(T),s.deleteShader(E),y=new Ul(s,b),C=kL(s,b)}let y;this.getUniforms=function(){return y===void 0&&w(this),y};let C;this.getAttributes=function(){return C===void 0&&w(this),C};let D=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return D===!1&&(D=s.getProgramParameter(b,UL)),D},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(b),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=IL++,this.cacheKey=t,this.usedTimes=1,this.program=b,this.vertexShader=T,this.fragmentShader=E,this}var aU=0,Ny=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,n,i){let s=this._getShaderCacheForMaterial(t);return s.has(n)===!1&&(s.add(n),n.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(t){let n=this.materialCache.get(t);for(let i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let n=this.materialCache,i=n.get(t);return i===void 0&&(i=new Set,n.set(t,i)),i}_getShaderStage(t){let n=this.shaderCache,i=n.get(t);return i===void 0&&(i=new Dy(t),n.set(t,i)),i}},Dy=class{constructor(t){this.id=aU++,this.code=t,this.usedTimes=0}};function rU(e){return e===ar||e===Ou||e===Bu}function oU(e,t,n,i,s,a){let r=new bl,o=new Ny,l=new Set,c=[],u=new Map,d=i.logarithmicDepthBuffer,h=i.precision,p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(y){return l.add(y),y===0?"uv":`uv${y}`}function b(y,C,D,z,X,H){let A=z.fog,L=X.geometry,F=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?z.environment:null,W=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,J=t.get(y.envMap||F,W),Y=J&&J.mapping===Nu?J.image.height:null,$=p[y.type];y.precision!==null&&(h=i.getMaxPrecision(y.precision),h!==y.precision&&Pt("WebGLProgram.getParameters:",y.precision,"not supported, using",h,"instead."));let at=L.morphAttributes.position||L.morphAttributes.normal||L.morphAttributes.color,Tt=at!==void 0?at.length:0,wt=0;L.morphAttributes.position!==void 0&&(wt=1),L.morphAttributes.normal!==void 0&&(wt=2),L.morphAttributes.color!==void 0&&(wt=3);let ae,ne,re,Q;if($){let me=Cs[$];ae=me.vertexShader,ne=me.fragmentShader}else{ae=y.vertexShader,ne=y.fragmentShader;let me=o.getVertexShaderStage(y),Qt=o.getFragmentShaderStage(y);o.update(y,me,Qt),re=me.id,Q=Qt.id}let nt=e.getRenderTarget(),St=e.state.buffers.depth.getReversed(),Gt=X.isInstancedMesh===!0,_t=X.isBatchedMesh===!0,qt=!!y.map,Ze=!!y.matcap,jt=!!J,oe=!!y.aoMap,pe=!!y.lightMap,Ot=!!y.bumpMap&&y.wireframe===!1,Ee=!!y.normalMap,$e=!!y.displacementMap,Cn=!!y.emissiveMap,Be=!!y.metalnessMap,ze=!!y.roughnessMap,B=y.anisotropy>0,sn=y.clearcoat>0,ce=y.dispersion>0,R=y.retroreflectivity>0,_=y.iridescence>0,G=y.sheen>0,q=y.transmission>0,K=B&&!!y.anisotropyMap,lt=sn&&!!y.clearcoatMap,ft=sn&&!!y.clearcoatNormalMap,tt=sn&&!!y.clearcoatRoughnessMap,it=_&&!!y.iridescenceMap,dt=_&&!!y.iridescenceThicknessMap,Rt=G&&!!y.sheenColorMap,pt=G&&!!y.sheenRoughnessMap,ct=!!y.specularMap,Nt=!!y.specularColorMap,Mt=!!y.specularIntensityMap,Ht=q&&!!y.transmissionMap,P=q&&!!y.thicknessMap,ut=!!y.gradientMap,et=!!y.alphaMap,ht=y.alphaTest>0,yt=!!y.alphaHash,rt=!!y.extensions,Dt=Zi;y.toneMapped&&(nt===null||nt.isXRRenderTarget===!0)&&(Dt=e.toneMapping);let Et={shaderID:$,shaderType:y.type,shaderName:y.name,vertexShader:ae,fragmentShader:ne,defines:y.defines,customVertexShaderID:re,customFragmentShaderID:Q,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:h,batching:_t,batchingColor:_t&&X._colorsTexture!==null,instancing:Gt,instancingColor:Gt&&X.instanceColor!==null,instancingMorph:Gt&&X.morphTexture!==null,outputColorSpace:nt===null?e.outputColorSpace:nt.isXRRenderTarget===!0?nt.texture.colorSpace:se.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:qt,matcap:Ze,envMap:jt,envMapMode:jt&&J.mapping,envMapCubeUVHeight:Y,aoMap:oe,lightMap:pe,bumpMap:Ot,normalMap:Ee,displacementMap:$e,emissiveMap:Cn,normalMapObjectSpace:Ee&&y.normalMapType===CE,normalMapTangentSpace:Ee&&y.normalMapType===hy,packedNormalMap:Ee&&y.normalMapType===hy&&rU(y.normalMap.format),metalnessMap:Be,roughnessMap:ze,anisotropy:B,anisotropyMap:K,clearcoat:sn,clearcoatMap:lt,clearcoatNormalMap:ft,clearcoatRoughnessMap:tt,dispersion:ce,retroreflection:R,iridescence:_,iridescenceMap:it,iridescenceThicknessMap:dt,sheen:G,sheenColorMap:Rt,sheenRoughnessMap:pt,specularMap:ct,specularColorMap:Nt,specularIntensityMap:Mt,transmission:q,transmissionMap:Ht,thicknessMap:P,gradientMap:ut,opaque:y.transparent===!1&&y.blending===er&&y.alphaToCoverage===!1,alphaMap:et,alphaTest:ht,alphaHash:yt,combine:y.combine,mapUv:qt&&m(y.map.channel),aoMapUv:oe&&m(y.aoMap.channel),lightMapUv:pe&&m(y.lightMap.channel),bumpMapUv:Ot&&m(y.bumpMap.channel),normalMapUv:Ee&&m(y.normalMap.channel),displacementMapUv:$e&&m(y.displacementMap.channel),emissiveMapUv:Cn&&m(y.emissiveMap.channel),metalnessMapUv:Be&&m(y.metalnessMap.channel),roughnessMapUv:ze&&m(y.roughnessMap.channel),anisotropyMapUv:K&&m(y.anisotropyMap.channel),clearcoatMapUv:lt&&m(y.clearcoatMap.channel),clearcoatNormalMapUv:ft&&m(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:tt&&m(y.clearcoatRoughnessMap.channel),iridescenceMapUv:it&&m(y.iridescenceMap.channel),iridescenceThicknessMapUv:dt&&m(y.iridescenceThicknessMap.channel),sheenColorMapUv:Rt&&m(y.sheenColorMap.channel),sheenRoughnessMapUv:pt&&m(y.sheenRoughnessMap.channel),specularMapUv:ct&&m(y.specularMap.channel),specularColorMapUv:Nt&&m(y.specularColorMap.channel),specularIntensityMapUv:Mt&&m(y.specularIntensityMap.channel),transmissionMapUv:Ht&&m(y.transmissionMap.channel),thicknessMapUv:P&&m(y.thicknessMap.channel),alphaMapUv:et&&m(y.alphaMap.channel),vertexTangents:!!L.attributes.tangent&&(Ee||B),vertexNormals:!!L.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!L.attributes.color&&L.attributes.color.itemSize===4,pointsUvs:X.isPoints===!0&&!!L.attributes.uv&&(qt||et),fog:!!A,useFog:y.fog===!0,fogExp2:!!A&&A.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||L.attributes.normal===void 0&&Ee===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:St,skinning:X.isSkinnedMesh===!0,hasPositionAttribute:L.attributes.position!==void 0,morphTargets:L.morphAttributes.position!==void 0,morphNormals:L.morphAttributes.normal!==void 0,morphColors:L.morphAttributes.color!==void 0,morphTargetsCount:Tt,morphTextureStride:wt,numSunLights:C.sun.length,numDirLights:C.directional.length,numPointLights:C.point.length,numSpotLights:C.spot.length,numSpotLightMaps:C.spotLightMap.length,numRectAreaLights:C.rectArea.length,numHemiLights:C.hemi.length,numSunLightShadows:C.sunShadowMap.length,numDirLightShadows:C.directionalShadowMap.length,numPointLightShadows:C.pointShadowMap.length,numSpotLightShadows:C.spotShadowMap.length,numSpotLightShadowsWithMaps:C.numSpotLightShadowsWithMaps,numLightProbes:C.numLightProbes,numLightProbeGrids:H.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:y.dithering,shadowMapEnabled:e.shadowMap.enabled&&D.length>0,shadowMapType:e.shadowMap.type,toneMapping:Dt,decodeVideoTexture:qt&&y.map.isVideoTexture===!0&&se.getTransfer(y.map.colorSpace)===ye,decodeVideoTextureEmissive:Cn&&y.emissiveMap.isVideoTexture===!0&&se.getTransfer(y.emissiveMap.colorSpace)===ye,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===Es,flipSided:y.side===jn,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:rt&&y.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(rt&&y.extensions.multiDraw===!0||_t)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return Et.vertexUv1s=l.has(1),Et.vertexUv2s=l.has(2),Et.vertexUv3s=l.has(3),l.clear(),Et}function g(y){let C=[];if(y.shaderID?C.push(y.shaderID):(C.push(y.customVertexShaderID),C.push(y.customFragmentShaderID)),y.defines!==void 0)for(let D in y.defines)C.push(D),C.push(y.defines[D]);return y.isRawShaderMaterial===!1&&(f(C,y),v(C,y),C.push(e.outputColorSpace)),C.push(y.customProgramCacheKey),C.join()}function f(y,C){y.push(C.precision),y.push(C.outputColorSpace),y.push(C.envMapMode),y.push(C.envMapCubeUVHeight),y.push(C.mapUv),y.push(C.alphaMapUv),y.push(C.lightMapUv),y.push(C.aoMapUv),y.push(C.bumpMapUv),y.push(C.normalMapUv),y.push(C.displacementMapUv),y.push(C.emissiveMapUv),y.push(C.metalnessMapUv),y.push(C.roughnessMapUv),y.push(C.anisotropyMapUv),y.push(C.clearcoatMapUv),y.push(C.clearcoatNormalMapUv),y.push(C.clearcoatRoughnessMapUv),y.push(C.iridescenceMapUv),y.push(C.iridescenceThicknessMapUv),y.push(C.sheenColorMapUv),y.push(C.sheenRoughnessMapUv),y.push(C.specularMapUv),y.push(C.specularColorMapUv),y.push(C.specularIntensityMapUv),y.push(C.transmissionMapUv),y.push(C.thicknessMapUv),y.push(C.combine),y.push(C.fogExp2),y.push(C.sizeAttenuation),y.push(C.morphTargetsCount),y.push(C.morphAttributeCount),y.push(C.numSunLights),y.push(C.numDirLights),y.push(C.numPointLights),y.push(C.numSpotLights),y.push(C.numSpotLightMaps),y.push(C.numHemiLights),y.push(C.numRectAreaLights),y.push(C.numSunLightShadows),y.push(C.numDirLightShadows),y.push(C.numPointLightShadows),y.push(C.numSpotLightShadows),y.push(C.numSpotLightShadowsWithMaps),y.push(C.numLightProbes),y.push(C.shadowMapType),y.push(C.toneMapping),y.push(C.numClippingPlanes),y.push(C.numClipIntersection),y.push(C.depthPacking)}function v(y,C){r.disableAll(),C.instancing&&r.enable(0),C.instancingColor&&r.enable(1),C.instancingMorph&&r.enable(2),C.matcap&&r.enable(3),C.envMap&&r.enable(4),C.normalMapObjectSpace&&r.enable(5),C.normalMapTangentSpace&&r.enable(6),C.clearcoat&&r.enable(7),C.iridescence&&r.enable(8),C.alphaTest&&r.enable(9),C.vertexColors&&r.enable(10),C.vertexAlphas&&r.enable(11),C.vertexUv1s&&r.enable(12),C.vertexUv2s&&r.enable(13),C.vertexUv3s&&r.enable(14),C.vertexTangents&&r.enable(15),C.anisotropy&&r.enable(16),C.alphaHash&&r.enable(17),C.batching&&r.enable(18),C.dispersion&&r.enable(19),C.retroreflection&&r.enable(24),C.batchingColor&&r.enable(20),C.gradientMap&&r.enable(21),C.packedNormalMap&&r.enable(22),C.vertexNormals&&r.enable(23),y.push(r.mask),r.disableAll(),C.fog&&r.enable(0),C.useFog&&r.enable(1),C.flatShading&&r.enable(2),C.logarithmicDepthBuffer&&r.enable(3),C.reversedDepthBuffer&&r.enable(4),C.skinning&&r.enable(5),C.morphTargets&&r.enable(6),C.morphNormals&&r.enable(7),C.morphColors&&r.enable(8),C.premultipliedAlpha&&r.enable(9),C.shadowMapEnabled&&r.enable(10),C.doubleSided&&r.enable(11),C.flipSided&&r.enable(12),C.useDepthPacking&&r.enable(13),C.dithering&&r.enable(14),C.transmission&&r.enable(15),C.sheen&&r.enable(16),C.opaque&&r.enable(17),C.pointsUvs&&r.enable(18),C.decodeVideoTexture&&r.enable(19),C.decodeVideoTextureEmissive&&r.enable(20),C.alphaToCoverage&&r.enable(21),C.numLightProbeGrids>0&&r.enable(22),C.hasPositionAttribute&&r.enable(23),y.push(r.mask)}function S(y){let C=p[y.type],D;if(C){let z=Cs[C];D=VE.clone(z.uniforms)}else D=y.uniforms;return D}function x(y,C){let D=u.get(C);return D!==void 0?++D.usedTimes:(D=new sU(e,C,y,s),c.push(D),u.set(C,D)),D}function T(y){if(--y.usedTimes===0){let C=c.indexOf(y);c[C]=c[c.length-1],c.pop(),u.delete(y.cacheKey),y.destroy()}}function E(y){o.remove(y)}function w(){o.dispose()}return{getParameters:b,getProgramCacheKey:g,getUniforms:S,acquireProgram:x,releaseProgram:T,releaseShaderCache:E,programs:c,dispose:w}}function lU(){let e=new WeakMap;function t(r){return e.has(r)}function n(r){let o=e.get(r);return o===void 0&&(o={},e.set(r,o)),o}function i(r){e.delete(r)}function s(r,o,l){e.get(r)[o]=l}function a(){e=new WeakMap}return{has:t,get:n,remove:i,update:s,dispose:a}}function cU(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.material.id!==t.material.id?e.material.id-t.material.id:e.materialVariant!==t.materialVariant?e.materialVariant-t.materialVariant:e.z!==t.z?e.z-t.z:e.id-t.id}function lT(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.z!==t.z?t.z-e.z:e.id-t.id}function cT(){let e=[],t=0,n=[],i=[],s=[];function a(){t=0,n.length=0,i.length=0,s.length=0}function r(h){let p=0;return h.isInstancedMesh&&(p+=2),h.isSkinnedMesh&&(p+=1),p}function o(h,p,m,b,g,f){let v=e[t];return v===void 0?(v={id:h.id,object:h,geometry:p,material:m,materialVariant:r(h),groupOrder:b,renderOrder:h.renderOrder,z:g,group:f},e[t]=v):(v.id=h.id,v.object=h,v.geometry=p,v.material=m,v.materialVariant=r(h),v.groupOrder=b,v.renderOrder=h.renderOrder,v.z=g,v.group=f),t++,v}function l(h,p,m,b,g,f,v){v.reversedDepth===!0&&(g=-g);let S=o(h,p,m,b,g,f);m.transmission>0?i.push(S):m.transparent===!0?s.push(S):n.push(S)}function c(h,p,m,b,g,f){let v=o(h,p,m,b,g,f);m.transmission>0?i.unshift(v):m.transparent===!0?s.unshift(v):n.unshift(v)}function u(h,p){n.length>1&&n.sort(h||cU),i.length>1&&i.sort(p||lT),s.length>1&&s.sort(p||lT)}function d(){for(let h=t,p=e.length;h<p;h++){let m=e[h];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:n,transmissive:i,transparent:s,init:a,push:l,unshift:c,finish:d,sort:u}}function uU(){let e=new WeakMap;function t(i,s){let a=e.get(i),r;return a===void 0?(r=new cT,e.set(i,[r])):s>=a.length?(r=new cT,a.push(r)):r=a[s],r}function n(){e=new WeakMap}return{get:t,dispose:n}}function hU(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={direction:new O,color:new Yt};break;case"SpotLight":n={position:new O,direction:new O,color:new Yt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new O,color:new Yt,distance:0,decay:0};break;case"HemisphereLight":n={direction:new O,skyColor:new Yt,groundColor:new Yt};break;case"RectAreaLight":n={color:new Yt,position:new O,halfWidth:new O,halfHeight:new O};break}return e[t.id]=n,n}}}function dU(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}var fU=0;function pU(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function mU(e){let t=new hU,n=dU(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new O);let s=new O,a=new Oe,r=new Oe;function o(c){let u=0,d=0,h=0;for(let X=0;X<9;X++)i.probe[X].set(0,0,0);let p=0,m=0,b=0,g=0,f=0,v=0,S=0,x=0,T=0,E=0,w=0,y=0,C=0,D=0;c.sort(pU);for(let X=0,H=c.length;X<H;X++){let A=c[X],L=A.color,F=A.intensity,W=A.distance,J=null;if(A.shadow&&A.shadow.map&&(A.shadow.map.texture.format===ar?J=A.shadow.map.texture:J=A.shadow.map.depthTexture||A.shadow.map.texture),A.isAmbientLight)u+=L.r*F,d+=L.g*F,h+=L.b*F;else if(A.isLightProbe){for(let Y=0;Y<9;Y++)i.probe[Y].addScaledVector(A.sh.coefficients[Y],F);D++}else if(A.isSunLight){let Y=t.get(A);if(Y.color.copy(A.color).multiplyScalar(A.intensity),A.castShadow){let $=A.shadow,at=n.get(A);at.shadowIntensity=$.intensity,at.shadowBias=$.bias,at.shadowNormalBias=$.normalBias,at.shadowRadius=$.radius,at.shadowMapSize.copy($.mapSize).multiply($.getFrameExtents()),i.sunShadow[m]=at,i.sunShadowMap[m]=J;let Tt=$.getViewportCount();for(let wt=0;wt<Tt;wt++)i.sunShadowMatrix[b+wt]=$.getMatrix(wt),i.sunShadowCascade[b+wt]=$._cascadeData[wt];b+=Tt,m++}i.sun[p]=Y,p++}else if(A.isDirectionalLight){let Y=t.get(A);if(Y.color.copy(A.color).multiplyScalar(A.intensity),A.castShadow){let $=A.shadow,at=n.get(A);at.shadowIntensity=$.intensity,at.shadowBias=$.bias,at.shadowNormalBias=$.normalBias,at.shadowRadius=$.radius,at.shadowMapSize=$.mapSize,i.directionalShadow[g]=at,i.directionalShadowMap[g]=J,i.directionalShadowMatrix[g]=A.shadow.matrix,T++}i.directional[g]=Y,g++}else if(A.isSpotLight){let Y=t.get(A);Y.position.setFromMatrixPosition(A.matrixWorld),Y.color.copy(L).multiplyScalar(F),Y.distance=W,Y.coneCos=Math.cos(A.angle),Y.penumbraCos=Math.cos(A.angle*(1-A.penumbra)),Y.decay=A.decay,i.spot[v]=Y;let $=A.shadow;if(A.map&&(i.spotLightMap[y]=A.map,y++,$.updateMatrices(A),A.castShadow&&C++),i.spotLightMatrix[v]=$.matrix,A.castShadow){let at=n.get(A);at.shadowIntensity=$.intensity,at.shadowBias=$.bias,at.shadowNormalBias=$.normalBias,at.shadowRadius=$.radius,at.shadowMapSize=$.mapSize,i.spotShadow[v]=at,i.spotShadowMap[v]=J,w++}v++}else if(A.isRectAreaLight){let Y=t.get(A);Y.color.copy(L).multiplyScalar(F),Y.halfWidth.set(A.width*.5,0,0),Y.halfHeight.set(0,A.height*.5,0),i.rectArea[S]=Y,S++}else if(A.isPointLight){let Y=t.get(A);if(Y.color.copy(A.color).multiplyScalar(A.intensity),Y.distance=A.distance,Y.decay=A.decay,A.castShadow){let $=A.shadow,at=n.get(A);at.shadowIntensity=$.intensity,at.shadowBias=$.bias,at.shadowNormalBias=$.normalBias,at.shadowRadius=$.radius,at.shadowMapSize=$.mapSize,at.shadowCameraNear=$.camera.near,at.shadowCameraFar=$.camera.far,i.pointShadow[f]=at,i.pointShadowMap[f]=J,i.pointShadowMatrix[f]=A.shadow.matrix,E++}i.point[f]=Y,f++}else if(A.isHemisphereLight){let Y=t.get(A);Y.skyColor.copy(A.color).multiplyScalar(F),Y.groundColor.copy(A.groundColor).multiplyScalar(F),i.hemi[x]=Y,x++}}S>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=vt.LTC_FLOAT_1,i.rectAreaLTC2=vt.LTC_FLOAT_2):(i.rectAreaLTC1=vt.LTC_HALF_1,i.rectAreaLTC2=vt.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=d,i.ambient[2]=h;let z=i.hash;(z.sunLength!==p||z.directionalLength!==g||z.pointLength!==f||z.spotLength!==v||z.rectAreaLength!==S||z.hemiLength!==x||z.numSunShadows!==m||z.numDirectionalShadows!==T||z.numPointShadows!==E||z.numSpotShadows!==w||z.numSpotMaps!==y||z.numLightProbes!==D)&&(i.sun.length=p,i.directional.length=g,i.spot.length=v,i.rectArea.length=S,i.point.length=f,i.hemi.length=x,i.sunShadow.length=m,i.sunShadowMap.length=m,i.sunShadowMatrix.length=b,i.sunShadowCascade.length=b,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.directionalShadowMatrix.length=T,i.pointShadow.length=E,i.pointShadowMap.length=E,i.pointShadowMatrix.length=E,i.spotShadow.length=w,i.spotShadowMap.length=w,i.spotLightMatrix.length=w+y-C,i.spotLightMap.length=y,i.numSpotLightShadowsWithMaps=C,i.numLightProbes=D,z.sunLength=p,z.directionalLength=g,z.pointLength=f,z.spotLength=v,z.rectAreaLength=S,z.hemiLength=x,z.numSunShadows=m,z.numDirectionalShadows=T,z.numPointShadows=E,z.numSpotShadows=w,z.numSpotMaps=y,z.numLightProbes=D,i.version=fU++)}function l(c,u){let d=0,h=0,p=0,m=0,b=0,g=0,f=u.matrixWorldInverse;for(let v=0,S=c.length;v<S;v++){let x=c[v];if(x.isSunLight){let T=i.sun[d];T.direction.setFromMatrixPosition(x.matrixWorld),T.direction.transformDirection(f),d++}else if(x.isDirectionalLight){let T=i.directional[h];T.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(f),h++}else if(x.isSpotLight){let T=i.spot[m];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(f),T.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(f),m++}else if(x.isRectAreaLight){let T=i.rectArea[b];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(f),r.identity(),a.copy(x.matrixWorld),a.premultiply(f),r.extractRotation(a),T.halfWidth.set(x.width*.5,0,0),T.halfHeight.set(0,x.height*.5,0),T.halfWidth.applyMatrix4(r),T.halfHeight.applyMatrix4(r),b++}else if(x.isPointLight){let T=i.point[p];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(f),p++}else if(x.isHemisphereLight){let T=i.hemi[g];T.direction.setFromMatrixPosition(x.matrixWorld),T.direction.transformDirection(f),g++}}}return{setup:o,setupView:l,state:i}}function uT(e){let t=new mU(e),n=[],i=[],s=[];function a(h){d.camera=h,n.length=0,i.length=0,s.length=0}function r(h){n.push(h)}function o(h){i.push(h)}function l(h){s.push(h)}function c(){t.setup(n)}function u(h){t.setupView(n,h)}let d={lightsArray:n,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:c,setupLightsView:u,pushLight:r,pushShadow:o,pushLightProbeGrid:l}}function gU(e){let t=new WeakMap;function n(s,a=0){let r=t.get(s),o;return r===void 0?(o=new uT(e),t.set(s,[o])):a>=r.length?(o=new uT(e),r.push(o)):o=r[a],o}function i(){t=new WeakMap}return{get:n,dispose:i}}var vU=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,yU=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,_U=[new O(1,0,0),new O(-1,0,0),new O(0,1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1)],xU=[new O(0,-1,0),new O(0,-1,0),new O(0,0,1),new O(0,0,-1),new O(0,-1,0),new O(0,-1,0)],hT=new Oe,Fu=new O,Ey=new O;function bU(e,t,n){let i=new fu,s=new Ut,a=new Ut,r=new qe,o=new Of,l=new Bf,c={},u=n.maxTextureSize,d={[tr]:jn,[jn]:tr,[Es]:Es},h=new bi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ut},radius:{value:4}},vertexShader:vU,fragmentShader:yU}),p=h.clone();p.defines.HORIZONTAL_PASS=1;let m=new yn;m.setAttribute("position",new Xn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new Yn(m,h),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Cu;let f=this.type;this.render=function(E,w,y){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||E.length===0)return;this.type===aE&&(Pt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Cu);let C=e.getRenderTarget(),D=e.getActiveCubeFace(),z=e.getActiveMipmapLevel(),X=e.state;X.setBlending(Ts),X.buffers.depth.getReversed()===!0?X.buffers.color.setClear(0,0,0,0):X.buffers.color.setClear(1,1,1,1),X.buffers.depth.setTest(!0),X.setScissorTest(!1);let H=f!==this.type;H&&w.traverse(function(A){A.material&&(Array.isArray(A.material)?A.material.forEach(L=>L.needsUpdate=!0):A.material.needsUpdate=!0)});for(let A=0,L=E.length;A<L;A++){let F=E[A],W=F.shadow;if(W===void 0){Pt("WebGLShadowMap:",F,"has no shadow.");continue}if(W.autoUpdate===!1&&W.needsUpdate===!1)continue;s.copy(W.mapSize);let J=W.getFrameExtents();s.multiply(J),a.copy(W.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(a.x=Math.floor(u/J.x),s.x=a.x*J.x,W.mapSize.x=a.x),s.y>u&&(a.y=Math.floor(u/J.y),s.y=a.y*J.y,W.mapSize.y=a.y));let Y=e.state.buffers.depth.getReversed();if(W.camera._reversedDepth=Y,W.map===null||H===!0){if(W.map!==null&&(W.map.depthTexture!==null&&(W.map.depthTexture.dispose(),W.map.depthTexture=null),W.map.dispose()),this.type===Cl){if(F.isPointLight){Pt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}W.map=new si(s.x,s.y,{format:ar,type:$i,minFilter:An,magFilter:An,generateMipmaps:!1}),W.map.texture.name=F.name+".shadowMap",W.map.depthTexture=new ja(s.x,s.y,Ji),W.map.depthTexture.name=F.name+".shadowMapDepth",W.map.depthTexture.format=xs,W.map.depthTexture.compareFunction=null,W.map.depthTexture.minFilter=vn,W.map.depthTexture.magFilter=vn}else F.isPointLight?(W.map=new Gp(s.x),W.map.depthTexture=new If(s.x,Ki)):(W.map=new si(s.x,s.y),W.map.depthTexture=new ja(s.x,s.y,Ki)),W.map.depthTexture.name=F.name+".shadowMap",W.map.depthTexture.format=xs,this.type===Cu?(W.map.depthTexture.compareFunction=Y?Op:Pp,W.map.depthTexture.minFilter=An,W.map.depthTexture.magFilter=An):(W.map.depthTexture.compareFunction=null,W.map.depthTexture.minFilter=vn,W.map.depthTexture.magFilter=vn);W.camera.updateProjectionMatrix()}W.map.isWebGLCubeRenderTarget!==!0&&(W.map.width!==s.x||W.map.height!==s.y)&&W.map.setSize(s.x,s.y);let $=W.map.isWebGLCubeRenderTarget?6:W.getViewportCount();F.isPointLight!==!0&&W.updateMatrices(F,y);for(let at=0;at<$;at++){let Tt=W.getCamera(at);if(F.isPointLight){let wt=W.camera,ae=W.matrix,ne=F.distance||wt.far;ne!==wt.far&&(wt.far=ne,wt.updateProjectionMatrix()),Fu.setFromMatrixPosition(F.matrixWorld),wt.position.copy(Fu),Ey.copy(wt.position),Ey.add(_U[at]),wt.up.copy(xU[at]),wt.lookAt(Ey),wt.updateMatrixWorld(),ae.makeTranslation(-Fu.x,-Fu.y,-Fu.z),hT.multiplyMatrices(wt.projectionMatrix,wt.matrixWorldInverse),W._frustum.setFromProjectionMatrix(hT,wt.coordinateSystem,wt.reversedDepth)}if(W.map.isWebGLCubeRenderTarget)e.setRenderTarget(W.map,at),e.clear();else{at===0&&(e.setRenderTarget(W.map),e.clear());let wt=W.getViewport(at);r.set(a.x*wt.x,a.y*wt.y,a.x*wt.z,a.y*wt.w),X.viewport(r)}i=W.getFrustum(at),x(w,y,Tt,F,this.type)}W.isPointLightShadow!==!0&&this.type===Cl&&v(W,y),W.needsUpdate=!1}f=this.type,g.needsUpdate=!1,e.setRenderTarget(C,D,z)};function v(E,w){let y=t.update(b);h.defines.VSM_SAMPLES!==E.blurSamples&&(h.defines.VSM_SAMPLES=E.blurSamples,p.defines.VSM_SAMPLES=E.blurSamples,h.needsUpdate=!0,p.needsUpdate=!0),E.mapPass===null?E.mapPass=new si(s.x,s.y,{format:ar,type:$i}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),h.uniforms.shadow_pass.value=E.map.depthTexture,h.uniforms.resolution.value.set(E.map.width,E.map.height),h.uniforms.radius.value=E.radius,e.setRenderTarget(E.mapPass),e.clear(),e.renderBufferDirect(w,null,y,h,b,null),p.uniforms.shadow_pass.value=E.mapPass.texture,p.uniforms.resolution.value.set(E.map.width,E.map.height),p.uniforms.radius.value=E.radius,e.setRenderTarget(E.map),e.clear(),e.renderBufferDirect(w,null,y,p,b,null)}function S(E,w,y,C){let D=null,z=y.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(z!==void 0)D=z;else if(D=y.isPointLight===!0?l:o,e.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0||w.alphaToCoverage===!0){let X=D.uuid,H=w.uuid,A=c[X];A===void 0&&(A={},c[X]=A);let L=A[H];L===void 0&&(L=D.clone(),A[H]=L,w.addEventListener("dispose",T)),D=L}if(D.visible=w.visible,D.wireframe=w.wireframe,C===Cl?D.side=w.shadowSide!==null?w.shadowSide:w.side:D.side=w.shadowSide!==null?w.shadowSide:d[w.side],D.alphaMap=w.alphaMap,D.alphaTest=w.alphaToCoverage===!0?.5:w.alphaTest,D.map=w.map,D.clipShadows=w.clipShadows,D.clippingPlanes=w.clippingPlanes,D.clipIntersection=w.clipIntersection,D.displacementMap=w.displacementMap,D.displacementScale=w.displacementScale,D.displacementBias=w.displacementBias,D.wireframeLinewidth=w.wireframeLinewidth,D.linewidth=w.linewidth,y.isPointLight===!0&&D.isMeshDistanceMaterial===!0){let X=e.properties.get(D);X.light=y}return D}function x(E,w,y,C,D){if(E.visible===!1)return;if(E.layers.test(w.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&D===Cl)&&(!E.frustumCulled||E.intersectsFrustum(i))){E.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,E.matrixWorld);let H=t.update(E),A=E.material;if(Array.isArray(A)){let L=H.groups;for(let F=0,W=L.length;F<W;F++){let J=L[F],Y=A[J.materialIndex];if(Y&&Y.visible){let $=S(E,Y,C,D);E.onBeforeShadow(e,E,w,y,H,$,J),e.renderBufferDirect(y,null,H,$,E,J),E.onAfterShadow(e,E,w,y,H,$,J)}}}else if(A.visible){let L=S(E,A,C,D);E.onBeforeShadow(e,E,w,y,H,L,null),e.renderBufferDirect(y,null,H,L,E,null),E.onAfterShadow(e,E,w,y,H,L,null)}}let X=E.children;for(let H=0,A=X.length;H<A;H++)x(X[H],w,y,C,D)}function T(E){E.target.removeEventListener("dispose",T);for(let y in c){let C=c[y],D=E.target.uuid;D in C&&(C[D].dispose(),delete C[D])}}}function SU(e,t){function n(){let P=!1,ut=new qe,et=null,ht=new qe(0,0,0,0);return{setMask:function(yt){et!==yt&&!P&&(e.colorMask(yt,yt,yt,yt),et=yt)},setLocked:function(yt){P=yt},setClear:function(yt,rt,Dt,Et,me){me===!0&&(yt*=Et,rt*=Et,Dt*=Et),ut.set(yt,rt,Dt,Et),ht.equals(ut)===!1&&(e.clearColor(yt,rt,Dt,Et),ht.copy(ut))},reset:function(){P=!1,et=null,ht.set(-1,0,0,0)}}}function i(){let P=!1,ut=!1,et=null,ht=null,yt=null;return{setReversed:function(rt){if(ut!==rt){let Dt=t.get("EXT_clip_control");rt?Dt.clipControlEXT(Dt.LOWER_LEFT_EXT,Dt.ZERO_TO_ONE_EXT):Dt.clipControlEXT(Dt.LOWER_LEFT_EXT,Dt.NEGATIVE_ONE_TO_ONE_EXT),ut=rt;let Et=yt;yt=null,this.setClear(Et)}},getReversed:function(){return ut},setTest:function(rt){rt?nt(e.DEPTH_TEST):St(e.DEPTH_TEST)},setMask:function(rt){et!==rt&&!P&&(e.depthMask(rt),et=rt)},setFunc:function(rt){if(ut&&(rt=FE[rt]),ht!==rt){switch(rt){case vf:e.depthFunc(e.NEVER);break;case yf:e.depthFunc(e.ALWAYS);break;case _f:e.depthFunc(e.LESS);break;case vl:e.depthFunc(e.LEQUAL);break;case xf:e.depthFunc(e.EQUAL);break;case bf:e.depthFunc(e.GEQUAL);break;case Sf:e.depthFunc(e.GREATER);break;case Mf:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}ht=rt}},setLocked:function(rt){P=rt},setClear:function(rt){yt!==rt&&(yt=rt,ut&&(rt=1-rt),e.clearDepth(rt))},reset:function(){P=!1,et=null,ht=null,yt=null,ut=!1}}}function s(){let P=!1,ut=null,et=null,ht=null,yt=null,rt=null,Dt=null,Et=null,me=null;return{setTest:function(Qt){P||(Qt?nt(e.STENCIL_TEST):St(e.STENCIL_TEST))},setMask:function(Qt){ut!==Qt&&!P&&(e.stencilMask(Qt),ut=Qt)},setFunc:function(Qt,Zn,Rn){(et!==Qt||ht!==Zn||yt!==Rn)&&(e.stencilFunc(Qt,Zn,Rn),et=Qt,ht=Zn,yt=Rn)},setOp:function(Qt,Zn,Rn){(rt!==Qt||Dt!==Zn||Et!==Rn)&&(e.stencilOp(Qt,Zn,Rn),rt=Qt,Dt=Zn,Et=Rn)},setLocked:function(Qt){P=Qt},setClear:function(Qt){me!==Qt&&(e.clearStencil(Qt),me=Qt)},reset:function(){P=!1,ut=null,et=null,ht=null,yt=null,rt=null,Dt=null,Et=null,me=null}}}let a=new n,r=new i,o=new s,l=new WeakMap,c=new WeakMap,u={},d={},h={},p=new WeakMap,m=[],b=null,g=!1,f=null,v=null,S=null,x=null,T=null,E=null,w=null,y=new Yt(0,0,0),C=0,D=!1,z=null,X=null,H=null,A=null,L=null,F=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),W=!1,J=0,Y=e.getParameter(e.VERSION);Y.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(Y)[1]),W=J>=1):Y.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(Y)[1]),W=J>=2);let $=null,at={},Tt=e.getParameter(e.SCISSOR_BOX),wt=e.getParameter(e.VIEWPORT),ae=new qe().fromArray(Tt),ne=new qe().fromArray(wt);function re(P,ut,et,ht){let yt=new Uint8Array(4),rt=e.createTexture();e.bindTexture(P,rt),e.texParameteri(P,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(P,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Dt=0;Dt<et;Dt++)P===e.TEXTURE_3D||P===e.TEXTURE_2D_ARRAY?e.texImage3D(ut,0,e.RGBA,1,1,ht,0,e.RGBA,e.UNSIGNED_BYTE,yt):e.texImage2D(ut+Dt,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,yt);return rt}let Q={};Q[e.TEXTURE_2D]=re(e.TEXTURE_2D,e.TEXTURE_2D,1),Q[e.TEXTURE_CUBE_MAP]=re(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),Q[e.TEXTURE_2D_ARRAY]=re(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),Q[e.TEXTURE_3D]=re(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),r.setClear(1),o.setClear(0),nt(e.DEPTH_TEST),r.setFunc(vl),Ot(!1),Ee(Xv),nt(e.CULL_FACE),oe(Ts);function nt(P){u[P]!==!0&&(e.enable(P),u[P]=!0)}function St(P){u[P]!==!1&&(e.disable(P),u[P]=!1)}function Gt(P,ut){return h[P]!==ut?(e.bindFramebuffer(P,ut),h[P]=ut,P===e.DRAW_FRAMEBUFFER&&(h[e.FRAMEBUFFER]=ut),P===e.FRAMEBUFFER&&(h[e.DRAW_FRAMEBUFFER]=ut),!0):!1}function _t(P,ut){let et=m,ht=!1;if(P){et=p.get(ut),et===void 0&&(et=[],p.set(ut,et));let yt=P.textures;if(et.length!==yt.length||et[0]!==e.COLOR_ATTACHMENT0){for(let rt=0,Dt=yt.length;rt<Dt;rt++)et[rt]=e.COLOR_ATTACHMENT0+rt;et.length=yt.length,ht=!0}}else et[0]!==e.BACK&&(et[0]=e.BACK,ht=!0);ht&&e.drawBuffers(et)}function qt(P){return b!==P?(e.useProgram(P),b=P,!0):!1}let Ze={[Gr]:e.FUNC_ADD,[oE]:e.FUNC_SUBTRACT,[lE]:e.FUNC_REVERSE_SUBTRACT};Ze[cE]=e.MIN,Ze[uE]=e.MAX;let jt={[hE]:e.ZERO,[dE]:e.ONE,[fE]:e.SRC_COLOR,[Yv]:e.SRC_ALPHA,[_E]:e.SRC_ALPHA_SATURATE,[vE]:e.DST_COLOR,[mE]:e.DST_ALPHA,[pE]:e.ONE_MINUS_SRC_COLOR,[jv]:e.ONE_MINUS_SRC_ALPHA,[yE]:e.ONE_MINUS_DST_COLOR,[gE]:e.ONE_MINUS_DST_ALPHA,[xE]:e.CONSTANT_COLOR,[bE]:e.ONE_MINUS_CONSTANT_COLOR,[SE]:e.CONSTANT_ALPHA,[ME]:e.ONE_MINUS_CONSTANT_ALPHA};function oe(P,ut,et,ht,yt,rt,Dt,Et,me,Qt){if(P===Ts){g===!0&&(St(e.BLEND),g=!1);return}if(g===!1&&(nt(e.BLEND),g=!0),P!==rE){if(P!==f||Qt!==D){if((v!==Gr||T!==Gr)&&(e.blendEquation(e.FUNC_ADD),v=Gr,T=Gr),Qt)switch(P){case er:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Ru:e.blendFunc(e.ONE,e.ONE);break;case Wv:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case qv:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:zt("WebGLState: Invalid blending: ",P);break}else switch(P){case er:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Ru:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case Wv:zt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case qv:zt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:zt("WebGLState: Invalid blending: ",P);break}S=null,x=null,E=null,w=null,y.set(0,0,0),C=0,f=P,D=Qt}return}yt=yt||ut,rt=rt||et,Dt=Dt||ht,(ut!==v||yt!==T)&&(e.blendEquationSeparate(Ze[ut],Ze[yt]),v=ut,T=yt),(et!==S||ht!==x||rt!==E||Dt!==w)&&(e.blendFuncSeparate(jt[et],jt[ht],jt[rt],jt[Dt]),S=et,x=ht,E=rt,w=Dt),(Et.equals(y)===!1||me!==C)&&(e.blendColor(Et.r,Et.g,Et.b,me),y.copy(Et),C=me),f=P,D=!1}function pe(P,ut){P.side===Es?St(e.CULL_FACE):nt(e.CULL_FACE);let et=P.side===jn;ut&&(et=!et),Ot(et),P.blending===er&&P.transparent===!1?oe(Ts):oe(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),r.setFunc(P.depthFunc),r.setTest(P.depthTest),r.setMask(P.depthWrite),a.setMask(P.colorWrite);let ht=P.stencilWrite;o.setTest(ht),ht&&(o.setMask(P.stencilWriteMask),o.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),o.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),Cn(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?nt(e.SAMPLE_ALPHA_TO_COVERAGE):St(e.SAMPLE_ALPHA_TO_COVERAGE)}function Ot(P){z!==P&&(P?e.frontFace(e.CW):e.frontFace(e.CCW),z=P)}function Ee(P){P!==iE?(nt(e.CULL_FACE),P!==X&&(P===Xv?e.cullFace(e.BACK):P===sE?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):St(e.CULL_FACE),X=P}function $e(P){P!==H&&(W&&e.lineWidth(P),H=P)}function Cn(P,ut,et){P?(nt(e.POLYGON_OFFSET_FILL),(A!==ut||L!==et)&&(A=ut,L=et,r.getReversed()&&(ut=-ut),e.polygonOffset(ut,et))):St(e.POLYGON_OFFSET_FILL)}function Be(P){P?nt(e.SCISSOR_TEST):St(e.SCISSOR_TEST)}function ze(P){P===void 0&&(P=e.TEXTURE0+F-1),$!==P&&(e.activeTexture(P),$=P)}function B(P,ut,et){et===void 0&&($===null?et=e.TEXTURE0+F-1:et=$);let ht=at[et];ht===void 0&&(ht={type:void 0,texture:void 0},at[et]=ht),(ht.type!==P||ht.texture!==ut)&&($!==et&&(e.activeTexture(et),$=et),e.bindTexture(P,ut||Q[P]),ht.type=P,ht.texture=ut)}function sn(){let P=at[$];P!==void 0&&P.type!==void 0&&(e.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function ce(){try{e.compressedTexImage2D(...arguments)}catch(P){zt("WebGLState:",P)}}function R(){try{e.compressedTexImage3D(...arguments)}catch(P){zt("WebGLState:",P)}}function _(){try{e.texSubImage2D(...arguments)}catch(P){zt("WebGLState:",P)}}function G(){try{e.texSubImage3D(...arguments)}catch(P){zt("WebGLState:",P)}}function q(){try{e.compressedTexSubImage2D(...arguments)}catch(P){zt("WebGLState:",P)}}function K(){try{e.compressedTexSubImage3D(...arguments)}catch(P){zt("WebGLState:",P)}}function lt(){try{e.texStorage2D(...arguments)}catch(P){zt("WebGLState:",P)}}function ft(){try{e.texStorage3D(...arguments)}catch(P){zt("WebGLState:",P)}}function tt(){try{e.texImage2D(...arguments)}catch(P){zt("WebGLState:",P)}}function it(){try{e.texImage3D(...arguments)}catch(P){zt("WebGLState:",P)}}function dt(P){return d[P]!==void 0?d[P]:e.getParameter(P)}function Rt(P,ut){d[P]!==ut&&(e.pixelStorei(P,ut),d[P]=ut)}function pt(P){ae.equals(P)===!1&&(e.scissor(P.x,P.y,P.z,P.w),ae.copy(P))}function ct(P){ne.equals(P)===!1&&(e.viewport(P.x,P.y,P.z,P.w),ne.copy(P))}function Nt(P,ut){let et=c.get(ut);et===void 0&&(et=new WeakMap,c.set(ut,et));let ht=et.get(P);ht===void 0&&(ht=e.getUniformBlockIndex(ut,P.name),et.set(P,ht))}function Mt(P,ut){let ht=c.get(ut).get(P);l.get(ut)!==ht&&(e.uniformBlockBinding(ut,ht,P.__bindingPointIndex),l.set(ut,ht))}function Ht(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),r.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),u={},d={},$=null,at={},h={},p=new WeakMap,m=[],b=null,g=!1,f=null,v=null,S=null,x=null,T=null,E=null,w=null,y=new Yt(0,0,0),C=0,D=!1,z=null,X=null,H=null,A=null,L=null,ae.set(0,0,e.canvas.width,e.canvas.height),ne.set(0,0,e.canvas.width,e.canvas.height),a.reset(),r.reset(),o.reset()}return{buffers:{color:a,depth:r,stencil:o},enable:nt,disable:St,bindFramebuffer:Gt,drawBuffers:_t,useProgram:qt,setBlending:oe,setMaterial:pe,setFlipSided:Ot,setCullFace:Ee,setLineWidth:$e,setPolygonOffset:Cn,setScissorTest:Be,activeTexture:ze,bindTexture:B,unbindTexture:sn,compressedTexImage2D:ce,compressedTexImage3D:R,texImage2D:tt,texImage3D:it,pixelStorei:Rt,getParameter:dt,updateUBOMapping:Nt,uniformBlockBinding:Mt,texStorage2D:lt,texStorage3D:ft,texSubImage2D:_,texSubImage3D:G,compressedTexSubImage2D:q,compressedTexSubImage3D:K,scissor:pt,viewport:ct,reset:Ht}}function MU(e,t,n,i,s,a,r){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Ut,u=new WeakMap,d=new Set,h,p=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function b(R,_){return m?new OffscreenCanvas(R,_):au("canvas")}function g(R,_,G){let q=1,K=ce(R);if((K.width>G||K.height>G)&&(q=G/Math.max(K.width,K.height)),q<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){let lt=Math.floor(q*K.width),ft=Math.floor(q*K.height);h===void 0&&(h=b(lt,ft));let tt=_?b(lt,ft):h;return tt.width=lt,tt.height=ft,tt.getContext("2d").drawImage(R,0,0,lt,ft),Pt("WebGLRenderer: Texture has been resized from ("+K.width+"x"+K.height+") to ("+lt+"x"+ft+")."),tt}else return"data"in R&&Pt("WebGLRenderer: Image in DataTexture is too big ("+K.width+"x"+K.height+")."),R;return R}function f(R){return R.generateMipmaps}function v(R){e.generateMipmap(R)}function S(R){return R.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?e.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function x(R,_,G,q,K,lt=!1){if(R!==null){if(e[R]!==void 0)return e[R];Pt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let ft;q&&(ft=t.get("EXT_texture_norm16"),ft||Pt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let tt=_;if(_===e.RED&&(G===e.FLOAT&&(tt=e.R32F),G===e.HALF_FLOAT&&(tt=e.R16F),G===e.UNSIGNED_BYTE&&(tt=e.R8),G===e.UNSIGNED_SHORT&&ft&&(tt=ft.R16_EXT),G===e.SHORT&&ft&&(tt=ft.R16_SNORM_EXT)),_===e.RED_INTEGER&&(G===e.UNSIGNED_BYTE&&(tt=e.R8UI),G===e.UNSIGNED_SHORT&&(tt=e.R16UI),G===e.UNSIGNED_INT&&(tt=e.R32UI),G===e.BYTE&&(tt=e.R8I),G===e.SHORT&&(tt=e.R16I),G===e.INT&&(tt=e.R32I)),_===e.RG&&(G===e.FLOAT&&(tt=e.RG32F),G===e.HALF_FLOAT&&(tt=e.RG16F),G===e.UNSIGNED_BYTE&&(tt=e.RG8),G===e.UNSIGNED_SHORT&&ft&&(tt=ft.RG16_EXT),G===e.SHORT&&ft&&(tt=ft.RG16_SNORM_EXT)),_===e.RG_INTEGER&&(G===e.UNSIGNED_BYTE&&(tt=e.RG8UI),G===e.UNSIGNED_SHORT&&(tt=e.RG16UI),G===e.UNSIGNED_INT&&(tt=e.RG32UI),G===e.BYTE&&(tt=e.RG8I),G===e.SHORT&&(tt=e.RG16I),G===e.INT&&(tt=e.RG32I)),_===e.RGB_INTEGER&&(G===e.UNSIGNED_BYTE&&(tt=e.RGB8UI),G===e.UNSIGNED_SHORT&&(tt=e.RGB16UI),G===e.UNSIGNED_INT&&(tt=e.RGB32UI),G===e.BYTE&&(tt=e.RGB8I),G===e.SHORT&&(tt=e.RGB16I),G===e.INT&&(tt=e.RGB32I)),_===e.RGBA_INTEGER&&(G===e.UNSIGNED_BYTE&&(tt=e.RGBA8UI),G===e.UNSIGNED_SHORT&&(tt=e.RGBA16UI),G===e.UNSIGNED_INT&&(tt=e.RGBA32UI),G===e.BYTE&&(tt=e.RGBA8I),G===e.SHORT&&(tt=e.RGBA16I),G===e.INT&&(tt=e.RGBA32I)),_===e.RGB&&(G===e.UNSIGNED_SHORT&&ft&&(tt=ft.RGB16_EXT),G===e.SHORT&&ft&&(tt=ft.RGB16_SNORM_EXT),G===e.UNSIGNED_INT_5_9_9_9_REV&&(tt=e.RGB9_E5),G===e.UNSIGNED_INT_10F_11F_11F_REV&&(tt=e.R11F_G11F_B10F)),_===e.RGBA){let it=lt?iu:se.getTransfer(K);G===e.FLOAT&&(tt=e.RGBA32F),G===e.HALF_FLOAT&&(tt=e.RGBA16F),G===e.UNSIGNED_BYTE&&(tt=it===ye?e.SRGB8_ALPHA8:e.RGBA8),G===e.UNSIGNED_SHORT&&ft&&(tt=ft.RGBA16_EXT),G===e.SHORT&&ft&&(tt=ft.RGBA16_SNORM_EXT),G===e.UNSIGNED_SHORT_4_4_4_4&&(tt=e.RGBA4),G===e.UNSIGNED_SHORT_5_5_5_1&&(tt=e.RGB5_A1)}return(tt===e.R16F||tt===e.R32F||tt===e.RG16F||tt===e.RG32F||tt===e.RGBA16F||tt===e.RGBA32F)&&t.get("EXT_color_buffer_float"),tt}function T(R,_){let G;return R?_===null||_===Ki||_===Nl?G=e.DEPTH24_STENCIL8:_===Ji?G=e.DEPTH32F_STENCIL8:_===Rl&&(G=e.DEPTH24_STENCIL8,Pt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Ki||_===Nl?G=e.DEPTH_COMPONENT24:_===Ji?G=e.DEPTH_COMPONENT32F:_===Rl&&(G=e.DEPTH_COMPONENT16),G}function E(R,_){return f(R)===!0||R.isFramebufferTexture&&R.minFilter!==vn&&R.minFilter!==An?Math.log2(Math.max(_.width,_.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?_.mipmaps.length:1}function w(R){let _=R.target;_.removeEventListener("dispose",w),C(_),_.isVideoTexture&&u.delete(_),_.isHTMLTexture&&d.delete(_)}function y(R){let _=R.target;_.removeEventListener("dispose",y),z(_)}function C(R){let _=i.get(R);if(_.__webglInit===void 0)return;let G=R.source,q=p.get(G);if(q){let K=q[_.__cacheKey];K.usedTimes--,K.usedTimes===0&&D(R),Object.keys(q).length===0&&p.delete(G)}i.remove(R)}function D(R){let _=i.get(R);e.deleteTexture(_.__webglTexture);let G=R.source,q=p.get(G);delete q[_.__cacheKey],r.memory.textures--}function z(R){let _=i.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),i.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let q=0;q<6;q++){if(Array.isArray(_.__webglFramebuffer[q]))for(let K=0;K<_.__webglFramebuffer[q].length;K++)e.deleteFramebuffer(_.__webglFramebuffer[q][K]);else e.deleteFramebuffer(_.__webglFramebuffer[q]);_.__webglDepthbuffer&&e.deleteRenderbuffer(_.__webglDepthbuffer[q])}else{if(Array.isArray(_.__webglFramebuffer))for(let q=0;q<_.__webglFramebuffer.length;q++)e.deleteFramebuffer(_.__webglFramebuffer[q]);else e.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&e.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&e.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let q=0;q<_.__webglColorRenderbuffer.length;q++)_.__webglColorRenderbuffer[q]&&e.deleteRenderbuffer(_.__webglColorRenderbuffer[q]);_.__webglDepthRenderbuffer&&e.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let G=R.textures;for(let q=0,K=G.length;q<K;q++){let lt=i.get(G[q]);lt.__webglTexture&&(e.deleteTexture(lt.__webglTexture),r.memory.textures--),i.remove(G[q])}i.remove(R)}let X=0;function H(){X=0}function A(){return X}function L(R){X=R}function F(){let R=X;return R>=s.maxTextures&&Pt("WebGLTextures: Trying to use "+(R+1)+" texture units while this GPU supports only "+s.maxTextures),X+=1,R}function W(R){let _=[];return _.push(R.wrapS),_.push(R.wrapT),_.push(R.wrapR||0),_.push(R.magFilter),_.push(R.minFilter),_.push(R.anisotropy),_.push(R.internalFormat),_.push(R.format),_.push(R.type),_.push(R.generateMipmaps),_.push(R.premultiplyAlpha),_.push(R.flipY),_.push(R.unpackAlignment),_.push(R.colorSpace),_.join()}function J(R,_){let G=i.get(R);if(R.isVideoTexture&&B(R),R.isRenderTargetTexture===!1&&R.isExternalTexture!==!0&&R.version>0&&G.__version!==R.version){let q=R.image;if(q===null)Pt("WebGLRenderer: Texture marked for update but no image data found.");else if(q.complete===!1)Pt("WebGLRenderer: Texture marked for update but image is incomplete");else{St(G,R,_);return}}else R.isExternalTexture&&(G.__webglTexture=R.sourceTexture?R.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,G.__webglTexture,e.TEXTURE0+_)}function Y(R,_){let G=i.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&G.__version!==R.version){St(G,R,_);return}else R.isExternalTexture&&(G.__webglTexture=R.sourceTexture?R.sourceTexture:null);n.bindTexture(e.TEXTURE_2D_ARRAY,G.__webglTexture,e.TEXTURE0+_)}function $(R,_){let G=i.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&G.__version!==R.version){St(G,R,_);return}n.bindTexture(e.TEXTURE_3D,G.__webglTexture,e.TEXTURE0+_)}function at(R,_){let G=i.get(R);if(R.isCubeDepthTexture!==!0&&R.version>0&&G.__version!==R.version){Gt(G,R,_);return}n.bindTexture(e.TEXTURE_CUBE_MAP,G.__webglTexture,e.TEXTURE0+_)}let Tt={[Ef]:e.REPEAT,[_s]:e.CLAMP_TO_EDGE,[Tf]:e.MIRRORED_REPEAT},wt={[vn]:e.NEAREST,[wE]:e.NEAREST_MIPMAP_NEAREST,[Du]:e.NEAREST_MIPMAP_LINEAR,[An]:e.LINEAR,[$f]:e.LINEAR_MIPMAP_NEAREST,[ir]:e.LINEAR_MIPMAP_LINEAR},ae={[NE]:e.NEVER,[PE]:e.ALWAYS,[DE]:e.LESS,[Pp]:e.LEQUAL,[LE]:e.EQUAL,[Op]:e.GEQUAL,[UE]:e.GREATER,[IE]:e.NOTEQUAL};function ne(R,_){if(_.type===Ji&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===An||_.magFilter===$f||_.magFilter===Du||_.magFilter===ir||_.minFilter===An||_.minFilter===$f||_.minFilter===Du||_.minFilter===ir)&&Pt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(R,e.TEXTURE_WRAP_S,Tt[_.wrapS]),e.texParameteri(R,e.TEXTURE_WRAP_T,Tt[_.wrapT]),(R===e.TEXTURE_3D||R===e.TEXTURE_2D_ARRAY)&&e.texParameteri(R,e.TEXTURE_WRAP_R,Tt[_.wrapR]),e.texParameteri(R,e.TEXTURE_MAG_FILTER,wt[_.magFilter]),e.texParameteri(R,e.TEXTURE_MIN_FILTER,wt[_.minFilter]),_.compareFunction&&(e.texParameteri(R,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(R,e.TEXTURE_COMPARE_FUNC,ae[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===vn||_.minFilter!==Du&&_.minFilter!==ir||_.type===Ji&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||i.get(_).__currentAnisotropy){let G=t.get("EXT_texture_filter_anisotropic");e.texParameterf(R,G.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),i.get(_).__currentAnisotropy=_.anisotropy}}}function re(R,_){let G=!1;R.__webglInit===void 0&&(R.__webglInit=!0,_.addEventListener("dispose",w));let q=_.source,K=p.get(q);K===void 0&&(K={},p.set(q,K));let lt=W(_);if(lt!==R.__cacheKey){K[lt]===void 0&&(K[lt]={texture:e.createTexture(),usedTimes:0},r.memory.textures++,G=!0),K[lt].usedTimes++;let ft=K[R.__cacheKey];ft!==void 0&&(K[R.__cacheKey].usedTimes--,ft.usedTimes===0&&D(_)),R.__cacheKey=lt,R.__webglTexture=K[lt].texture}return G}function Q(R,_,G){return Math.floor(Math.floor(R/G)/_)}function nt(R,_,G,q){let lt=R.updateRanges;if(lt.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,_.width,_.height,G,q,_.data);else{lt.sort((Rt,pt)=>Rt.start-pt.start);let ft=0;for(let Rt=1;Rt<lt.length;Rt++){let pt=lt[ft],ct=lt[Rt],Nt=pt.start+pt.count,Mt=Q(ct.start,_.width,4),Ht=Q(pt.start,_.width,4);ct.start<=Nt+1&&Mt===Ht&&Q(ct.start+ct.count-1,_.width,4)===Mt?pt.count=Math.max(pt.count,ct.start+ct.count-pt.start):(++ft,lt[ft]=ct)}lt.length=ft+1;let tt=n.getParameter(e.UNPACK_ROW_LENGTH),it=n.getParameter(e.UNPACK_SKIP_PIXELS),dt=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,_.width);for(let Rt=0,pt=lt.length;Rt<pt;Rt++){let ct=lt[Rt],Nt=Math.floor(ct.start/4),Mt=Math.ceil(ct.count/4),Ht=Nt%_.width,P=Math.floor(Nt/_.width),ut=Mt,et=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,Ht),n.pixelStorei(e.UNPACK_SKIP_ROWS,P),n.texSubImage2D(e.TEXTURE_2D,0,Ht,P,ut,et,G,q,_.data)}R.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,tt),n.pixelStorei(e.UNPACK_SKIP_PIXELS,it),n.pixelStorei(e.UNPACK_SKIP_ROWS,dt)}}function St(R,_,G){let q=e.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(q=e.TEXTURE_2D_ARRAY),_.isData3DTexture&&(q=e.TEXTURE_3D);let K=re(R,_),lt=_.source;n.bindTexture(q,R.__webglTexture,e.TEXTURE0+G);let ft=i.get(lt);if(lt.version!==ft.__version||K===!0){if(n.activeTexture(e.TEXTURE0+G),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){let et=se.getPrimaries(se.workingColorSpace),ht=_.colorSpace===sa?null:se.getPrimaries(_.colorSpace),yt=_.colorSpace===sa||et===ht?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,_.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,yt)}n.pixelStorei(e.UNPACK_ALIGNMENT,_.unpackAlignment);let it=g(_.image,!1,s.maxTextureSize);it=sn(_,it);let dt=a.convert(_.format,_.colorSpace),Rt=a.convert(_.type),pt=x(_.internalFormat,dt,Rt,_.normalized,_.colorSpace,_.isVideoTexture);ne(q,_);let ct,Nt=_.mipmaps,Mt=_.isVideoTexture!==!0,Ht=ft.__version===void 0||K===!0,P=lt.dataReady,ut=E(_,it);if(_.isDepthTexture)pt=T(_.format===sr,_.type),Ht&&(Mt?n.texStorage2D(e.TEXTURE_2D,1,pt,it.width,it.height):n.texImage2D(e.TEXTURE_2D,0,pt,it.width,it.height,0,dt,Rt,null));else if(_.isDataTexture)if(Nt.length>0){Mt&&Ht&&n.texStorage2D(e.TEXTURE_2D,ut,pt,Nt[0].width,Nt[0].height);for(let et=0,ht=Nt.length;et<ht;et++)ct=Nt[et],Mt?P&&n.texSubImage2D(e.TEXTURE_2D,et,0,0,ct.width,ct.height,dt,Rt,ct.data):n.texImage2D(e.TEXTURE_2D,et,pt,ct.width,ct.height,0,dt,Rt,ct.data);_.generateMipmaps=!1}else Mt?(Ht&&n.texStorage2D(e.TEXTURE_2D,ut,pt,it.width,it.height),P&&nt(_,it,dt,Rt)):n.texImage2D(e.TEXTURE_2D,0,pt,it.width,it.height,0,dt,Rt,it.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Mt&&Ht&&n.texStorage3D(e.TEXTURE_2D_ARRAY,ut,pt,Nt[0].width,Nt[0].height,it.depth);for(let et=0,ht=Nt.length;et<ht;et++)if(ct=Nt[et],_.format!==Pi)if(dt!==null)if(Mt){if(P)if(_.layerUpdates.size>0){let yt=yy(ct.width,ct.height,_.format,_.type);for(let rt of _.layerUpdates){let Dt=ct.data.subarray(rt*yt/ct.data.BYTES_PER_ELEMENT,(rt+1)*yt/ct.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,et,0,0,rt,ct.width,ct.height,1,dt,Dt)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,et,0,0,0,ct.width,ct.height,it.depth,dt,ct.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,et,pt,ct.width,ct.height,it.depth,0,ct.data,0,0);else Pt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Mt?P&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,et,0,0,0,ct.width,ct.height,it.depth,dt,Rt,ct.data):n.texImage3D(e.TEXTURE_2D_ARRAY,et,pt,ct.width,ct.height,it.depth,0,dt,Rt,ct.data);_.layerUpdates.size>0&&_.clearLayerUpdates()}else{Mt&&Ht&&n.texStorage2D(e.TEXTURE_2D,ut,pt,Nt[0].width,Nt[0].height);for(let et=0,ht=Nt.length;et<ht;et++)ct=Nt[et],_.format!==Pi?dt!==null?Mt?P&&n.compressedTexSubImage2D(e.TEXTURE_2D,et,0,0,ct.width,ct.height,dt,ct.data):n.compressedTexImage2D(e.TEXTURE_2D,et,pt,ct.width,ct.height,0,ct.data):Pt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Mt?P&&n.texSubImage2D(e.TEXTURE_2D,et,0,0,ct.width,ct.height,dt,Rt,ct.data):n.texImage2D(e.TEXTURE_2D,et,pt,ct.width,ct.height,0,dt,Rt,ct.data)}else if(_.isDataArrayTexture)if(Mt){if(Ht&&n.texStorage3D(e.TEXTURE_2D_ARRAY,ut,pt,it.width,it.height,it.depth),P)if(_.layerUpdates.size>0){let et=yy(it.width,it.height,_.format,_.type);for(let ht of _.layerUpdates){let yt=it.data.subarray(ht*et/it.data.BYTES_PER_ELEMENT,(ht+1)*et/it.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,ht,it.width,it.height,1,dt,Rt,yt)}_.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,it.width,it.height,it.depth,dt,Rt,it.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,pt,it.width,it.height,it.depth,0,dt,Rt,it.data);else if(_.isData3DTexture)Mt?(Ht&&n.texStorage3D(e.TEXTURE_3D,ut,pt,it.width,it.height,it.depth),P&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,it.width,it.height,it.depth,dt,Rt,it.data)):n.texImage3D(e.TEXTURE_3D,0,pt,it.width,it.height,it.depth,0,dt,Rt,it.data);else if(_.isFramebufferTexture){if(Ht)if(Mt)n.texStorage2D(e.TEXTURE_2D,ut,pt,it.width,it.height);else{let et=it.width,ht=it.height;for(let yt=0;yt<ut;yt++)n.texImage2D(e.TEXTURE_2D,yt,pt,et,ht,0,dt,Rt,null),et>>=1,ht>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in e){let et=e.canvas;if(et.hasAttribute("layoutsubtree")||et.setAttribute("layoutsubtree","true"),it.parentNode!==et){et.appendChild(it),d.add(_),et.onpaint=ht=>{let yt=ht.changedElements;for(let rt of d)yt.includes(rt.image)&&(rt.needsUpdate=!0)},et.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,it);else{let yt=e.RGBA,rt=e.RGBA,Dt=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,yt,rt,Dt,it)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Nt.length>0){if(Mt&&Ht){let et=ce(Nt[0]);n.texStorage2D(e.TEXTURE_2D,ut,pt,et.width,et.height)}for(let et=0,ht=Nt.length;et<ht;et++)ct=Nt[et],Mt?P&&n.texSubImage2D(e.TEXTURE_2D,et,0,0,dt,Rt,ct):n.texImage2D(e.TEXTURE_2D,et,pt,dt,Rt,ct);_.generateMipmaps=!1}else if(Mt){if(Ht){let et=ce(it);n.texStorage2D(e.TEXTURE_2D,ut,pt,et.width,et.height)}P&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,dt,Rt,it)}else n.texImage2D(e.TEXTURE_2D,0,pt,dt,Rt,it);f(_)&&v(q),ft.__version=lt.version,_.onUpdate&&_.onUpdate(_)}R.__version=_.version}function Gt(R,_,G){if(_.image.length!==6)return;let q=re(R,_),K=_.source;n.bindTexture(e.TEXTURE_CUBE_MAP,R.__webglTexture,e.TEXTURE0+G);let lt=i.get(K);if(K.version!==lt.__version||q===!0){n.activeTexture(e.TEXTURE0+G);let ft=se.getPrimaries(se.workingColorSpace),tt=_.colorSpace===sa?null:se.getPrimaries(_.colorSpace),it=_.colorSpace===sa||ft===tt?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,_.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,_.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,it);let dt=_.isCompressedTexture||_.image[0].isCompressedTexture,Rt=_.image[0]&&_.image[0].isDataTexture,pt=[];for(let rt=0;rt<6;rt++)!dt&&!Rt?pt[rt]=g(_.image[rt],!0,s.maxCubemapSize):pt[rt]=Rt?_.image[rt].image:_.image[rt],pt[rt]=sn(_,pt[rt]);let ct=pt[0],Nt=a.convert(_.format,_.colorSpace),Mt=a.convert(_.type),Ht=x(_.internalFormat,Nt,Mt,_.normalized,_.colorSpace),P=_.isVideoTexture!==!0,ut=lt.__version===void 0||q===!0,et=K.dataReady,ht=E(_,ct);ne(e.TEXTURE_CUBE_MAP,_);let yt;if(dt){P&&ut&&n.texStorage2D(e.TEXTURE_CUBE_MAP,ht,Ht,ct.width,ct.height);for(let rt=0;rt<6;rt++){yt=pt[rt].mipmaps;for(let Dt=0;Dt<yt.length;Dt++){let Et=yt[Dt];_.format!==Pi?Nt!==null?P?et&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,Dt,0,0,Et.width,Et.height,Nt,Et.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,Dt,Ht,Et.width,Et.height,0,Et.data):Pt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):P?et&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,Dt,0,0,Et.width,Et.height,Nt,Mt,Et.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,Dt,Ht,Et.width,Et.height,0,Nt,Mt,Et.data)}}}else{if(yt=_.mipmaps,P&&ut){yt.length>0&&ht++;let rt=ce(pt[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,ht,Ht,rt.width,rt.height)}for(let rt=0;rt<6;rt++)if(Rt){P?et&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,0,0,0,pt[rt].width,pt[rt].height,Nt,Mt,pt[rt].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,0,Ht,pt[rt].width,pt[rt].height,0,Nt,Mt,pt[rt].data);for(let Dt=0;Dt<yt.length;Dt++){let me=yt[Dt].image[rt].image;P?et&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,Dt+1,0,0,me.width,me.height,Nt,Mt,me.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,Dt+1,Ht,me.width,me.height,0,Nt,Mt,me.data)}}else{P?et&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,0,0,0,Nt,Mt,pt[rt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,0,Ht,Nt,Mt,pt[rt]);for(let Dt=0;Dt<yt.length;Dt++){let Et=yt[Dt];P?et&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,Dt+1,0,0,Nt,Mt,Et.image[rt]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+rt,Dt+1,Ht,Nt,Mt,Et.image[rt])}}}f(_)&&v(e.TEXTURE_CUBE_MAP),lt.__version=K.version,_.onUpdate&&_.onUpdate(_)}R.__version=_.version}function _t(R,_,G,q,K,lt){let ft=a.convert(G.format,G.colorSpace),tt=a.convert(G.type),it=x(G.internalFormat,ft,tt,G.normalized,G.colorSpace),dt=i.get(_),Rt=i.get(G);if(Rt.__renderTarget=_,!dt.__hasExternalTextures){let pt=Math.max(1,_.width>>lt),ct=Math.max(1,_.height>>lt);K===e.TEXTURE_3D||K===e.TEXTURE_2D_ARRAY?n.texImage3D(K,lt,it,pt,ct,_.depth,0,ft,tt,null):n.texImage2D(K,lt,it,pt,ct,0,ft,tt,null)}n.bindFramebuffer(e.FRAMEBUFFER,R),ze(_)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,q,K,Rt.__webglTexture,0,Be(_)):(K===e.TEXTURE_2D||K>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&K<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,q,K,Rt.__webglTexture,lt),n.bindFramebuffer(e.FRAMEBUFFER,null)}function qt(R,_,G){if(e.bindRenderbuffer(e.RENDERBUFFER,R),_.depthBuffer){let q=_.depthTexture,K=q&&q.isDepthTexture?q.type:null,lt=T(_.stencilBuffer,K),ft=_.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;ze(_)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Be(_),lt,_.width,_.height):G?e.renderbufferStorageMultisample(e.RENDERBUFFER,Be(_),lt,_.width,_.height):e.renderbufferStorage(e.RENDERBUFFER,lt,_.width,_.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,ft,e.RENDERBUFFER,R)}else{let q=_.textures;for(let K=0;K<q.length;K++){let lt=q[K],ft=a.convert(lt.format,lt.colorSpace),tt=a.convert(lt.type),it=x(lt.internalFormat,ft,tt,lt.normalized,lt.colorSpace);ze(_)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Be(_),it,_.width,_.height):G?e.renderbufferStorageMultisample(e.RENDERBUFFER,Be(_),it,_.width,_.height):e.renderbufferStorage(e.RENDERBUFFER,it,_.width,_.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ze(R,_,G){let q=_.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,R),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let K=i.get(_.depthTexture);if(K.__renderTarget=_,(!K.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),q){if(K.__webglInit===void 0&&(K.__webglInit=!0,_.depthTexture.addEventListener("dispose",w)),K.__webglTexture===void 0){K.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,K.__webglTexture),ne(e.TEXTURE_CUBE_MAP,_.depthTexture);let dt=a.convert(_.depthTexture.format),Rt=a.convert(_.depthTexture.type),pt;_.depthTexture.format===xs?pt=e.DEPTH_COMPONENT24:_.depthTexture.format===sr&&(pt=e.DEPTH24_STENCIL8);for(let ct=0;ct<6;ct++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0,pt,_.width,_.height,0,dt,Rt,null)}}else J(_.depthTexture,0);let lt=K.__webglTexture,ft=Be(_),tt=q?e.TEXTURE_CUBE_MAP_POSITIVE_X+G:e.TEXTURE_2D,it=_.depthTexture.format===sr?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(_.depthTexture.format===xs)ze(_)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,it,tt,lt,0,ft):e.framebufferTexture2D(e.FRAMEBUFFER,it,tt,lt,0);else if(_.depthTexture.format===sr)ze(_)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,it,tt,lt,0,ft):e.framebufferTexture2D(e.FRAMEBUFFER,it,tt,lt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function jt(R){let _=i.get(R),G=R.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==R.depthTexture){let q=R.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),q){let K=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,q.removeEventListener("dispose",K)};q.addEventListener("dispose",K),_.__depthDisposeCallback=K}_.__boundDepthTexture=q}if(R.depthTexture&&!_.__autoAllocateDepthBuffer)if(G)for(let q=0;q<6;q++)Ze(_.__webglFramebuffer[q],R,q);else{let q=R.texture.mipmaps;q&&q.length>0?Ze(_.__webglFramebuffer[0],R,0):Ze(_.__webglFramebuffer,R,0)}else if(G){_.__webglDepthbuffer=[];for(let q=0;q<6;q++)if(n.bindFramebuffer(e.FRAMEBUFFER,_.__webglFramebuffer[q]),_.__webglDepthbuffer[q]===void 0)_.__webglDepthbuffer[q]=e.createRenderbuffer(),qt(_.__webglDepthbuffer[q],R,!1);else{let K=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,lt=_.__webglDepthbuffer[q];e.bindRenderbuffer(e.RENDERBUFFER,lt),e.framebufferRenderbuffer(e.FRAMEBUFFER,K,e.RENDERBUFFER,lt)}}else{let q=R.texture.mipmaps;if(q&&q.length>0?n.bindFramebuffer(e.FRAMEBUFFER,_.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=e.createRenderbuffer(),qt(_.__webglDepthbuffer,R,!1);else{let K=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,lt=_.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,lt),e.framebufferRenderbuffer(e.FRAMEBUFFER,K,e.RENDERBUFFER,lt)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function oe(R,_,G){let q=i.get(R);_!==void 0&&_t(q.__webglFramebuffer,R,R.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),G!==void 0&&jt(R)}function pe(R){let _=R.texture,G=i.get(R),q=i.get(_);R.addEventListener("dispose",y);let K=R.textures,lt=R.isWebGLCubeRenderTarget===!0,ft=K.length>1;if(ft||(q.__webglTexture===void 0&&(q.__webglTexture=e.createTexture()),q.__version=_.version,r.memory.textures++),lt){G.__webglFramebuffer=[];for(let tt=0;tt<6;tt++)if(_.mipmaps&&_.mipmaps.length>0){G.__webglFramebuffer[tt]=[];for(let it=0;it<_.mipmaps.length;it++)G.__webglFramebuffer[tt][it]=e.createFramebuffer()}else G.__webglFramebuffer[tt]=e.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){G.__webglFramebuffer=[];for(let tt=0;tt<_.mipmaps.length;tt++)G.__webglFramebuffer[tt]=e.createFramebuffer()}else G.__webglFramebuffer=e.createFramebuffer();if(ft)for(let tt=0,it=K.length;tt<it;tt++){let dt=i.get(K[tt]);dt.__webglTexture===void 0&&(dt.__webglTexture=e.createTexture(),r.memory.textures++)}if(R.samples>0&&ze(R)===!1){G.__webglMultisampledFramebuffer=e.createFramebuffer(),G.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,G.__webglMultisampledFramebuffer);for(let tt=0;tt<K.length;tt++){let it=K[tt];G.__webglColorRenderbuffer[tt]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,G.__webglColorRenderbuffer[tt]);let dt=a.convert(it.format,it.colorSpace),Rt=a.convert(it.type),pt=x(it.internalFormat,dt,Rt,it.normalized,it.colorSpace,R.isXRRenderTarget===!0),ct=Be(R);e.renderbufferStorageMultisample(e.RENDERBUFFER,ct,pt,R.width,R.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+tt,e.RENDERBUFFER,G.__webglColorRenderbuffer[tt])}e.bindRenderbuffer(e.RENDERBUFFER,null),R.depthBuffer&&(G.__webglDepthRenderbuffer=e.createRenderbuffer(),qt(G.__webglDepthRenderbuffer,R,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(lt){n.bindTexture(e.TEXTURE_CUBE_MAP,q.__webglTexture),ne(e.TEXTURE_CUBE_MAP,_);for(let tt=0;tt<6;tt++)if(_.mipmaps&&_.mipmaps.length>0)for(let it=0;it<_.mipmaps.length;it++)_t(G.__webglFramebuffer[tt][it],R,_,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,it);else _t(G.__webglFramebuffer[tt],R,_,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+tt,0);f(_)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(ft){for(let tt=0,it=K.length;tt<it;tt++){let dt=K[tt],Rt=i.get(dt),pt=e.TEXTURE_2D;(R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(pt=R.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(pt,Rt.__webglTexture),ne(pt,dt),_t(G.__webglFramebuffer,R,dt,e.COLOR_ATTACHMENT0+tt,pt,0),f(dt)&&v(pt)}n.unbindTexture()}else{let tt=e.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(tt=R.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(tt,q.__webglTexture),ne(tt,_),_.mipmaps&&_.mipmaps.length>0)for(let it=0;it<_.mipmaps.length;it++)_t(G.__webglFramebuffer[it],R,_,e.COLOR_ATTACHMENT0,tt,it);else _t(G.__webglFramebuffer,R,_,e.COLOR_ATTACHMENT0,tt,0);f(_)&&v(tt),n.unbindTexture()}R.depthBuffer&&jt(R)}function Ot(R){let _=R.textures;for(let G=0,q=_.length;G<q;G++){let K=_[G];if(f(K)){let lt=S(R),ft=i.get(K).__webglTexture;n.bindTexture(lt,ft),v(lt),n.unbindTexture()}}}let Ee=[],$e=[];function Cn(R){if(R.samples>0){if(ze(R)===!1){let _=R.textures,G=R.width,q=R.height,K=e.COLOR_BUFFER_BIT,lt=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ft=i.get(R),tt=_.length>1;if(tt)for(let dt=0;dt<_.length;dt++)n.bindFramebuffer(e.FRAMEBUFFER,ft.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+dt,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,ft.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+dt,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,ft.__webglMultisampledFramebuffer);let it=R.texture.mipmaps;it&&it.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,ft.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,ft.__webglFramebuffer);for(let dt=0;dt<_.length;dt++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(K|=e.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(K|=e.STENCIL_BUFFER_BIT)),tt){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,ft.__webglColorRenderbuffer[dt]);let Rt=i.get(_[dt]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,Rt,0)}e.blitFramebuffer(0,0,G,q,0,0,G,q,K,e.NEAREST),l===!0&&(Ee.length=0,$e.length=0,Ee.push(e.COLOR_ATTACHMENT0+dt),R.depthBuffer&&R.storeMultisampledDepthBuffer===!1&&(Ee.push(lt),$e.push(lt),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,$e)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Ee))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),tt)for(let dt=0;dt<_.length;dt++){n.bindFramebuffer(e.FRAMEBUFFER,ft.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+dt,e.RENDERBUFFER,ft.__webglColorRenderbuffer[dt]);let Rt=i.get(_[dt]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,ft.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+dt,e.TEXTURE_2D,Rt,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,ft.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.storeMultisampledDepthBuffer===!1&&l){let _=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[_])}}}function Be(R){return Math.min(s.maxSamples,R.samples)}function ze(R){let _=i.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function B(R){let _=r.render.frame;u.get(R)!==_&&(u.set(R,_),R.update())}function sn(R,_){let G=R.colorSpace,q=R.format,K=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||G!==nu&&G!==sa&&(se.getTransfer(G)===ye?(q!==Pi||K!==Mi)&&Pt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):zt("WebGLTextures: Unsupported texture color space:",G)),_}function ce(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=F,this.resetTextureUnits=H,this.getTextureUnits=A,this.setTextureUnits=L,this.setTexture2D=J,this.setTexture2DArray=Y,this.setTexture3D=$,this.setTextureCube=at,this.rebindTextures=oe,this.setupRenderTarget=pe,this.updateRenderTargetMipmap=Ot,this.updateMultisampleRenderTarget=Cn,this.setupDepthRenderbuffer=jt,this.setupFrameBufferTexture=_t,this.useMultisampledRTT=ze,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function EU(e,t){function n(i,s=sa){let a,r=se.getTransfer(s);if(i===Mi)return e.UNSIGNED_BYTE;if(i===tp)return e.UNSIGNED_SHORT_4_4_4_4;if(i===ep)return e.UNSIGNED_SHORT_5_5_5_1;if(i===ry)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===oy)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===sy)return e.BYTE;if(i===ay)return e.SHORT;if(i===Rl)return e.UNSIGNED_SHORT;if(i===Qf)return e.INT;if(i===Ki)return e.UNSIGNED_INT;if(i===Ji)return e.FLOAT;if(i===$i)return e.HALF_FLOAT;if(i===ly)return e.ALPHA;if(i===cy)return e.RGB;if(i===Pi)return e.RGBA;if(i===xs)return e.DEPTH_COMPONENT;if(i===sr)return e.DEPTH_STENCIL;if(i===uy)return e.RED;if(i===np)return e.RED_INTEGER;if(i===ar)return e.RG;if(i===ip)return e.RG_INTEGER;if(i===sp)return e.RGBA_INTEGER;if(i===Lu||i===Uu||i===Iu||i===Pu)if(r===ye)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===Lu)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Uu)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Iu)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Pu)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===Lu)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Uu)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Iu)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Pu)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===ap||i===rp||i===op||i===lp)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===ap)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===rp)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===op)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===lp)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===cp||i===up||i===hp||i===dp||i===fp||i===Ou||i===pp)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(i===cp||i===up)return r===ye?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===hp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===dp)return a.COMPRESSED_R11_EAC;if(i===fp)return a.COMPRESSED_SIGNED_R11_EAC;if(i===Ou)return a.COMPRESSED_RG11_EAC;if(i===pp)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===mp||i===gp||i===vp||i===yp||i===_p||i===xp||i===bp||i===Sp||i===Mp||i===Ep||i===Tp||i===wp||i===Ap||i===Cp)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(i===mp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===gp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===vp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===yp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===_p)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===xp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===bp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Sp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Mp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Ep)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Tp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===wp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ap)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Cp)return r===ye?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Rp||i===Np||i===Dp)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(i===Rp)return r===ye?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Np)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Dp)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Lp||i===Up||i===Bu||i===Ip)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(i===Lp)return a.COMPRESSED_RED_RGTC1_EXT;if(i===Up)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Bu)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Ip)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Nl?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:n}}var TU=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,wU=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Ly=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,n){if(this.texture===null){let i=new vu(t.texture);(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){let n=t.cameras[0].viewport,i=new bi({vertexShader:TU,fragmentShader:wU,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new Yn(new bu(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Uy=class extends ji{constructor(t,n){super();let i=this,s=null,a=1,r=null,o="local-floor",l=1,c=null,u=null,d=null,h=null,p=null,m=null,b=typeof XRWebGLBinding<"u",g=new Ly,f={},v=n.getContextAttributes(),S=null,x=null,T=[],E=[],w=new Ut,y=null,C=null,D=new Pn;D.viewport=new qe;let z=new Pn;z.viewport=new qe;let X=[D,z],H=new Zf,A=null,L=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Q){let nt=T[Q];return nt===void 0&&(nt=new Sl,T[Q]=nt),nt.getTargetRaySpace()},this.getControllerGrip=function(Q){let nt=T[Q];return nt===void 0&&(nt=new Sl,T[Q]=nt),nt.getGripSpace()},this.getHand=function(Q){let nt=T[Q];return nt===void 0&&(nt=new Sl,T[Q]=nt),nt.getHandSpace()};function F(Q){let nt=E.indexOf(Q.inputSource);if(nt===-1)return;let St=T[nt];St!==void 0&&(St.update(Q.inputSource,Q.frame,c||r),St.dispatchEvent({type:Q.type,data:Q.inputSource}))}function W(){s.removeEventListener("select",F),s.removeEventListener("selectstart",F),s.removeEventListener("selectend",F),s.removeEventListener("squeeze",F),s.removeEventListener("squeezestart",F),s.removeEventListener("squeezeend",F),s.removeEventListener("end",W),s.removeEventListener("inputsourceschange",J);for(let Q=0;Q<T.length;Q++){let nt=E[Q];nt!==null&&(E[Q]=null,T[Q].disconnect(nt))}A=null,L=null,g.reset();for(let Q in f)delete f[Q];if(t.setRenderTarget(S),p=null,h=null,d=null,s=null,x=null,re.stop(),i.isPresenting=!1,t.setPixelRatio(y),t.setSize(w.width,w.height,!1),C!==null){let Q=C.camera;Q.fov=C.fov,Q.zoom=C.zoom,Q.updateProjectionMatrix(),C=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Q){a=Q,i.isPresenting===!0&&Pt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Q){o=Q,i.isPresenting===!0&&Pt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(Q){c=Q},this.getBaseLayer=function(){return h!==null?h:p},this.getBinding=function(){return d===null&&b&&(d=new XRWebGLBinding(s,n)),d},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(Q){if(s=Q,s!==null){if(S=t.getRenderTarget(),s.addEventListener("select",F),s.addEventListener("selectstart",F),s.addEventListener("selectend",F),s.addEventListener("squeeze",F),s.addEventListener("squeezestart",F),s.addEventListener("squeezeend",F),s.addEventListener("end",W),s.addEventListener("inputsourceschange",J),v.xrCompatible!==!0&&await n.makeXRCompatible(),y=t.getPixelRatio(),t.getSize(w),b&&"createProjectionLayer"in XRWebGLBinding.prototype){let St=null,Gt=null,_t=null;v.depth&&(_t=v.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,St=v.stencil?sr:xs,Gt=v.stencil?Nl:Ki);let qt={colorFormat:n.RGBA8,depthFormat:_t,scaleFactor:a};d=this.getBinding(),h=d.createProjectionLayer(qt),s.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),x=new si(h.textureWidth,h.textureHeight,{format:Pi,type:Mi,depthTexture:new ja(h.textureWidth,h.textureHeight,Gt,void 0,void 0,void 0,void 0,void 0,void 0,St),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{let St={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:a};p=new XRWebGLLayer(s,n,St),s.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),x=new si(p.framebufferWidth,p.framebufferHeight,{format:Pi,type:Mi,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,r=await s.requestReferenceSpace(o),re.setContext(s),re.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function J(Q){for(let nt=0;nt<Q.removed.length;nt++){let St=Q.removed[nt],Gt=E.indexOf(St);Gt>=0&&(E[Gt]=null,T[Gt].disconnect(St))}for(let nt=0;nt<Q.added.length;nt++){let St=Q.added[nt],Gt=E.indexOf(St);if(Gt===-1){for(let qt=0;qt<T.length;qt++)if(qt>=E.length){E.push(St),Gt=qt;break}else if(E[qt]===null){E[qt]=St,Gt=qt;break}if(Gt===-1)break}let _t=T[Gt];_t&&_t.connect(St)}}let Y=new O,$=new O;function at(Q,nt,St){Y.setFromMatrixPosition(nt.matrixWorld),$.setFromMatrixPosition(St.matrixWorld);let Gt=Y.distanceTo($),_t=nt.projectionMatrix.elements,qt=St.projectionMatrix.elements,Ze=_t[14]/(_t[10]-1),jt=_t[14]/(_t[10]+1),oe=(_t[9]+1)/_t[5],pe=(_t[9]-1)/_t[5],Ot=(_t[8]-1)/_t[0],Ee=(qt[8]+1)/qt[0],$e=Ze*Ot,Cn=Ze*Ee,Be=Gt/(-Ot+Ee),ze=Be*-Ot;if(nt.matrixWorld.decompose(Q.position,Q.quaternion,Q.scale),Q.translateX(ze),Q.translateZ(Be),Q.matrixWorld.compose(Q.position,Q.quaternion,Q.scale),Q.matrixWorldInverse.copy(Q.matrixWorld).invert(),_t[10]===-1)Q.projectionMatrix.copy(nt.projectionMatrix),Q.projectionMatrixInverse.copy(nt.projectionMatrixInverse);else{let B=Ze+Be,sn=jt+Be,ce=$e-ze,R=Cn+(Gt-ze),_=oe*jt/sn*B,G=pe*jt/sn*B;Q.projectionMatrix.makePerspective(ce,R,_,G,B,sn),Q.projectionMatrixInverse.copy(Q.projectionMatrix).invert()}}function Tt(Q,nt){nt===null?Q.matrixWorld.copy(Q.matrix):Q.matrixWorld.multiplyMatrices(nt.matrixWorld,Q.matrix),Q.matrixWorldInverse.copy(Q.matrixWorld).invert()}this.updateCamera=function(Q){if(s===null)return;let nt=Q.near,St=Q.far;g.texture!==null&&(g.depthNear>0&&(nt=g.depthNear),g.depthFar>0&&(St=g.depthFar)),H.near=z.near=D.near=nt,H.far=z.far=D.far=St,(A!==H.near||L!==H.far)&&(s.updateRenderState({depthNear:H.near,depthFar:H.far}),A=H.near,L=H.far),H.layers.mask=Q.layers.mask|6,D.layers.mask=H.layers.mask&-5,z.layers.mask=H.layers.mask&-3;let Gt=Q.parent,_t=H.cameras;Tt(H,Gt);for(let qt=0;qt<_t.length;qt++)Tt(_t[qt],Gt);_t.length===2?at(H,D,z):H.projectionMatrix.copy(D.projectionMatrix),C===null&&Q.isPerspectiveCamera&&(C={camera:Q,fov:Q.fov,zoom:Q.zoom}),wt(Q,H,Gt)};function wt(Q,nt,St){St===null?Q.matrix.copy(nt.matrixWorld):(Q.matrix.copy(St.matrixWorld),Q.matrix.invert(),Q.matrix.multiply(nt.matrixWorld)),Q.matrix.decompose(Q.position,Q.quaternion,Q.scale),Q.updateMatrixWorld(!0),Q.projectionMatrix.copy(nt.projectionMatrix),Q.projectionMatrixInverse.copy(nt.projectionMatrixInverse),Q.isPerspectiveCamera&&(Q.fov=_l*2*Math.atan(1/Q.projectionMatrix.elements[5]),Q.zoom=1)}this.getCamera=function(){return H},this.getFoveation=function(){if(!(h===null&&p===null))return l},this.setFoveation=function(Q){l=Q,h!==null&&(h.fixedFoveation=Q),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=Q)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(H)},this.getCameraTexture=function(Q){return f[Q]};let ae=null;function ne(Q,nt){if(u=nt.getViewerPose(c||r),m=nt,u!==null){let St=u.views;p!==null&&(t.setRenderTargetFramebuffer(x,p.framebuffer),t.setRenderTarget(x));let Gt=!1;St.length!==H.cameras.length&&(H.cameras.length=0,Gt=!0);for(let jt=0;jt<St.length;jt++){let oe=St[jt],pe=null;if(p!==null)pe=p.getViewport(oe);else{let Ee=d.getViewSubImage(h,oe);pe=Ee.viewport,jt===0&&(t.setRenderTargetTextures(x,Ee.colorTexture,Ee.depthStencilTexture),t.setRenderTarget(x))}let Ot=X[jt];Ot===void 0&&(Ot=new Pn,Ot.layers.enable(jt),Ot.viewport=new qe,X[jt]=Ot),Ot.matrix.fromArray(oe.transform.matrix),Ot.matrix.decompose(Ot.position,Ot.quaternion,Ot.scale),Ot.projectionMatrix.fromArray(oe.projectionMatrix),Ot.projectionMatrixInverse.copy(Ot.projectionMatrix).invert(),Ot.viewport.set(pe.x,pe.y,pe.width,pe.height),jt===0&&(H.matrix.copy(Ot.matrix),H.matrix.decompose(H.position,H.quaternion,H.scale)),Gt===!0&&H.cameras.push(Ot)}let _t=s.enabledFeatures;if(_t&&_t.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&b){d=i.getBinding();let jt=d.getDepthInformation(St[0]);jt&&jt.isValid&&jt.texture&&g.init(jt,s.renderState)}if(_t&&_t.includes("camera-access")&&b){t.state.unbindTexture(),d=i.getBinding();for(let jt=0;jt<St.length;jt++){let oe=St[jt].camera;if(oe){let pe=f[oe];pe||(pe=new vu,f[oe]=pe);let Ot=d.getCameraImage(oe);pe.sourceTexture=Ot}}}}for(let St=0;St<T.length;St++){let Gt=E[St],_t=T[St];Gt!==null&&_t!==void 0&&_t.update(Gt,nt,c||r)}ae&&ae(Q,nt),nt.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:nt}),m=null}let re=new dT;re.setAnimationLoop(ne),this.setAnimationLoop=function(Q){ae=Q},this.dispose=function(){}}},AU=new Oe,yT=new kt;yT.set(-1,0,0,0,1,0,0,0,1);function CU(e,t){function n(g,f){g.matrixAutoUpdate===!0&&g.updateMatrix(),f.value.copy(g.matrix)}function i(g,f){f.color.getRGB(g.fogColor.value,my(e)),f.isFog?(g.fogNear.value=f.near,g.fogFar.value=f.far):f.isFogExp2&&(g.fogDensity.value=f.density)}function s(g,f,v,S,x){f.isNodeMaterial?f.uniformsNeedUpdate=!1:f.isMeshBasicMaterial?a(g,f):f.isMeshLambertMaterial?(a(g,f),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)):f.isMeshToonMaterial?(a(g,f),d(g,f)):f.isMeshPhongMaterial?(a(g,f),u(g,f),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)):f.isMeshStandardMaterial?(a(g,f),h(g,f),f.isMeshPhysicalMaterial&&p(g,f,x)):f.isMeshMatcapMaterial?(a(g,f),m(g,f)):f.isMeshDepthMaterial?a(g,f):f.isMeshDistanceMaterial?(a(g,f),b(g,f)):f.isMeshNormalMaterial?a(g,f):f.isLineBasicMaterial?(r(g,f),f.isLineDashedMaterial&&o(g,f)):f.isPointsMaterial?l(g,f,v,S):f.isSpriteMaterial?c(g,f):f.isShadowMaterial?(g.color.value.copy(f.color),g.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function a(g,f){g.opacity.value=f.opacity,f.color&&g.diffuse.value.copy(f.color),f.emissive&&g.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(g.map.value=f.map,n(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,n(f.alphaMap,g.alphaMapTransform)),f.bumpMap&&(g.bumpMap.value=f.bumpMap,n(f.bumpMap,g.bumpMapTransform),g.bumpScale.value=f.bumpScale,f.side===jn&&(g.bumpScale.value*=-1)),f.normalMap&&(g.normalMap.value=f.normalMap,n(f.normalMap,g.normalMapTransform),g.normalScale.value.copy(f.normalScale),f.side===jn&&g.normalScale.value.negate()),f.displacementMap&&(g.displacementMap.value=f.displacementMap,n(f.displacementMap,g.displacementMapTransform),g.displacementScale.value=f.displacementScale,g.displacementBias.value=f.displacementBias),f.emissiveMap&&(g.emissiveMap.value=f.emissiveMap,n(f.emissiveMap,g.emissiveMapTransform)),f.specularMap&&(g.specularMap.value=f.specularMap,n(f.specularMap,g.specularMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest);let v=t.get(f),S=v.envMap,x=v.envMapRotation;S&&(g.envMap.value=S,g.envMapRotation.value.setFromMatrix4(AU.makeRotationFromEuler(x)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(yT),g.reflectivity.value=f.reflectivity,g.ior.value=f.ior,g.refractionRatio.value=f.refractionRatio),f.lightMap&&(g.lightMap.value=f.lightMap,g.lightMapIntensity.value=f.lightMapIntensity,n(f.lightMap,g.lightMapTransform)),f.aoMap&&(g.aoMap.value=f.aoMap,g.aoMapIntensity.value=f.aoMapIntensity,n(f.aoMap,g.aoMapTransform))}function r(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,f.map&&(g.map.value=f.map,n(f.map,g.mapTransform))}function o(g,f){g.dashSize.value=f.dashSize,g.totalSize.value=f.dashSize+f.gapSize,g.scale.value=f.scale}function l(g,f,v,S){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.size.value=f.size*v,g.scale.value=S*.5,f.map&&(g.map.value=f.map,n(f.map,g.uvTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,n(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function c(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.rotation.value=f.rotation,f.map&&(g.map.value=f.map,n(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,n(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function u(g,f){g.specular.value.copy(f.specular),g.shininess.value=Math.max(f.shininess,1e-4)}function d(g,f){f.gradientMap&&(g.gradientMap.value=f.gradientMap)}function h(g,f){g.metalness.value=f.metalness,f.metalnessMap&&(g.metalnessMap.value=f.metalnessMap,n(f.metalnessMap,g.metalnessMapTransform)),g.roughness.value=f.roughness,f.roughnessMap&&(g.roughnessMap.value=f.roughnessMap,n(f.roughnessMap,g.roughnessMapTransform)),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)}function p(g,f,v){g.ior.value=f.ior,f.sheen>0&&(g.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),g.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(g.sheenColorMap.value=f.sheenColorMap,n(f.sheenColorMap,g.sheenColorMapTransform)),f.sheenRoughnessMap&&(g.sheenRoughnessMap.value=f.sheenRoughnessMap,n(f.sheenRoughnessMap,g.sheenRoughnessMapTransform))),f.clearcoat>0&&(g.clearcoat.value=f.clearcoat,g.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(g.clearcoatMap.value=f.clearcoatMap,n(f.clearcoatMap,g.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,n(f.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(g.clearcoatNormalMap.value=f.clearcoatNormalMap,n(f.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===jn&&g.clearcoatNormalScale.value.negate())),f.dispersion>0&&(g.dispersion.value=f.dispersion),f.retroreflectivity>0&&(g.retroreflectivity.value=f.retroreflectivity),f.iridescence>0&&(g.iridescence.value=f.iridescence,g.iridescenceIOR.value=f.iridescenceIOR,g.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(g.iridescenceMap.value=f.iridescenceMap,n(f.iridescenceMap,g.iridescenceMapTransform)),f.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=f.iridescenceThicknessMap,n(f.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),f.transmission>0&&(g.transmission.value=f.transmission,g.transmissionSamplerMap.value=v.texture,g.transmissionSamplerSize.value.set(v.width,v.height),f.transmissionMap&&(g.transmissionMap.value=f.transmissionMap,n(f.transmissionMap,g.transmissionMapTransform)),g.thickness.value=f.thickness,f.thicknessMap&&(g.thicknessMap.value=f.thicknessMap,n(f.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=f.attenuationDistance,g.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(g.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(g.anisotropyMap.value=f.anisotropyMap,n(f.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=f.specularIntensity,g.specularColor.value.copy(f.specularColor),f.specularColorMap&&(g.specularColorMap.value=f.specularColorMap,n(f.specularColorMap,g.specularColorMapTransform)),f.specularIntensityMap&&(g.specularIntensityMap.value=f.specularIntensityMap,n(f.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,f){f.matcap&&(g.matcap.value=f.matcap)}function b(g,f){let v=t.get(f).light;g.referencePosition.value.setFromMatrixPosition(v.matrixWorld),g.nearDistance.value=v.shadow.camera.near,g.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function RU(e,t,n,i){let s={},a={},r=[],o=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,T){let E=T.program;i.uniformBlockBinding(x,E)}function c(x,T){let E=s[x.id];E===void 0&&(g(x),E=u(x),s[x.id]=E,x.addEventListener("dispose",v));let w=T.program;i.updateUBOMapping(x,w);let y=t.render.frame;a[x.id]!==y&&(h(x),a[x.id]=y)}function u(x){let T=d();x.__bindingPointIndex=T;let E=e.createBuffer(),w=x.__size,y=x.usage;return e.bindBuffer(e.UNIFORM_BUFFER,E),e.bufferData(e.UNIFORM_BUFFER,w,y),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,T,E),E}function d(){for(let x=0;x<o;x++)if(r.indexOf(x)===-1)return r.push(x),x;return zt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(x){let T=s[x.id],E=x.uniforms,w=x.__cache;e.bindBuffer(e.UNIFORM_BUFFER,T);for(let y=0,C=E.length;y<C;y++){let D=E[y];if(Array.isArray(D))for(let z=0,X=D.length;z<X;z++)p(D[z],y,z,w);else p(D,y,0,w)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(x,T,E,w){if(b(x,T,E,w)===!0){let y=x.__offset,C=x.value;if(Array.isArray(C)){let D=0;for(let z=0;z<C.length;z++){let X=C[z],H=f(X);m(X,x.__data,D),typeof X!="number"&&typeof X!="boolean"&&!X.isMatrix3&&!ArrayBuffer.isView(X)&&(D+=H.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(C,x.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,y,x.__data)}}function m(x,T,E){typeof x=="number"||typeof x=="boolean"?T[0]=x:x.isMatrix3?(T[0]=x.elements[0],T[1]=x.elements[1],T[2]=x.elements[2],T[3]=0,T[4]=x.elements[3],T[5]=x.elements[4],T[6]=x.elements[5],T[7]=0,T[8]=x.elements[6],T[9]=x.elements[7],T[10]=x.elements[8],T[11]=0):ArrayBuffer.isView(x)?T.set(new x.constructor(x.buffer,x.byteOffset,T.length)):x.toArray(T,E)}function b(x,T,E,w){let y=x.value,C=T+"_"+E;if(w[C]===void 0)return typeof y=="number"||typeof y=="boolean"?w[C]=y:ArrayBuffer.isView(y)?w[C]=y.slice():w[C]=y.clone(),!0;{let D=w[C];if(typeof y=="number"||typeof y=="boolean"){if(D!==y)return w[C]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(D.equals(y)===!1)return D.copy(y),!0}}return!1}function g(x){let T=x.uniforms,E=0,w=16;for(let C=0,D=T.length;C<D;C++){let z=Array.isArray(T[C])?T[C]:[T[C]];for(let X=0,H=z.length;X<H;X++){let A=z[X],L=Array.isArray(A.value)?A.value:[A.value];for(let F=0,W=L.length;F<W;F++){let J=L[F],Y=f(J),$=E%w,at=$%Y.boundary,Tt=$+at;E+=at,Tt!==0&&w-Tt<Y.storage&&(E+=w-Tt),A.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),A.__offset=E,E+=Y.storage}}}let y=E%w;return y>0&&(E+=w-y),x.__size=E,x.__cache={},this}function f(x){let T={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(T.boundary=4,T.storage=4):x.isVector2?(T.boundary=8,T.storage=8):x.isVector3||x.isColor?(T.boundary=16,T.storage=12):x.isVector4?(T.boundary=16,T.storage=16):x.isMatrix3?(T.boundary=48,T.storage=48):x.isMatrix4?(T.boundary=64,T.storage=64):x.isTexture?Pt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(T.boundary=16,T.storage=x.byteLength):Pt("WebGLRenderer: Unsupported uniform value type.",x),T}function v(x){let T=x.target;T.removeEventListener("dispose",v);let E=r.indexOf(T.__bindingPointIndex);r.splice(E,1),e.deleteBuffer(s[T.id]),delete s[T.id],delete a[T.id]}function S(){for(let x in s)e.deleteBuffer(s[x]);r=[],s={},a={}}return{bind:l,update:c,dispose:S}}var NU=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),As=null;function DU(){return As===null&&(As=new Df(NU,16,16,ar,$i),As.name="DFG_LUT",As.minFilter=An,As.magFilter=An,As.wrapS=_s,As.wrapT=_s,As.generateMipmaps=!1,As.needsUpdate=!0),As}var Hp=class{constructor(t={}){let{canvas:n=OE(),context:i=null,depth:s=!0,stencil:a=!1,alpha:r=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:h=!1,outputBufferType:p=Mi}=t;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=r;let b=p,g=new Set([sp,ip,np]),f=new Set([Mi,Ki,Rl,Nl,tp,ep]),v=new Uint32Array(4),S=new Int32Array(4),x=new O,T=null,E=null,w=[],y=[],C=null;this.domElement=n,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Zi,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let D=this,z=!1,X=null,H=null,A=null,L=null;this._outputColorSpace=wn;let F=0,W=0,J=null,Y=-1,$=null,at=new qe,Tt=new qe,wt=null,ae=new Yt(0),ne=0,re=n.width,Q=n.height,nt=1,St=null,Gt=null,_t=new qe(0,0,re,Q),qt=new qe(0,0,re,Q),Ze=!1,jt=new fu,oe=!1,pe=!1,Ot=new Oe,Ee=new O,$e=new qe,Cn={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Be=!1;function ze(){return J===null?nt:1}let B=i;function sn(M,I){return n.getContext(M,I)}let ce,R,_,G,q,K,lt,ft,tt,it,dt,Rt,pt,ct,Nt,Mt,Ht,P,ut,et,ht,yt,rt;try{let M={alpha:!0,depth:s,stencil:a,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${"186"}`),n.addEventListener("webglcontextlost",me,!1),n.addEventListener("webglcontextrestored",Qt,!1),n.addEventListener("webglcontextcreationerror",Zn,!1),B===null){let I="webgl2";if(B=sn(I,M),B===null)throw sn(I)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Dt()}catch(M){throw n.removeEventListener("webglcontextlost",me,!1),n.removeEventListener("webglcontextrestored",Qt,!1),n.removeEventListener("webglcontextcreationerror",Zn,!1),zt("WebGLRenderer: "+M.message),M}function Dt(){ce=new zD(B),ce.init(),ht=new EU(B,ce),R=new CD(B,ce,t,ht),_=new SU(B,ce),R.reversedDepthBuffer&&h&&_.buffers.depth.setReversed(!0),H=B.createFramebuffer(),A=B.createFramebuffer(),L=B.createFramebuffer(),G=new HD(B),q=new lU,K=new MU(B,ce,_,q,R,ht,G),lt=new BD(D),ft=new k2(B),yt=new wD(B,ft),tt=new FD(B,ft,G,yt),it=new kD(B,tt,ft,yt,G),P=new VD(B,R,K),Nt=new RD(q),dt=new oU(D,lt,ce,R,yt,Nt),Rt=new CU(D,q),pt=new uU,ct=new gU(ce),Ht=new TD(D,lt,_,it,m,l),Mt=new bU(D,it,R),rt=new RU(B,G,R,_),ut=new AD(B,ce,G),et=new GD(B,ce,G),G.programs=dt.programs,D.capabilities=R,D.extensions=ce,D.properties=q,D.renderLists=pt,D.shadowMap=Mt,D.state=_,D.info=G}b!==Mi&&(C=new WD(b,n.width,n.height,o,s,a));let Et=new Uy(D,B);this.xr=Et,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let M=ce.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=ce.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return nt},this.setPixelRatio=function(M){M!==void 0&&(nt=M,this.setSize(re,Q,!1))},this.getSize=function(M){return M.set(re,Q)},this.setSize=function(M,I,Z=!0){if(Et.isPresenting){Pt("WebGLRenderer: Can't change size while VR device is presenting.");return}re=M,Q=I,n.width=Math.floor(M*nt),n.height=Math.floor(I*nt),Z===!0&&(n.style.width=M+"px",n.style.height=I+"px"),C!==null&&C.setSize(n.width,n.height),this.setViewport(0,0,M,I)},this.getDrawingBufferSize=function(M){return M.set(re*nt,Q*nt).floor()},this.setDrawingBufferSize=function(M,I,Z){re=M,Q=I,nt=Z,n.width=Math.floor(M*Z),n.height=Math.floor(I*Z),this.setViewport(0,0,M,I)},this.setEffects=function(M){if(b===Mi){zt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let I=0;I<M.length;I++)if(M[I].isOutputPass===!0){Pt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}C.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(at)},this.getViewport=function(M){return M.copy(_t)},this.setViewport=function(M,I,Z,V){M.isVector4?_t.set(M.x,M.y,M.z,M.w):_t.set(M,I,Z,V),_.viewport(at.copy(_t).multiplyScalar(nt).round())},this.getScissor=function(M){return M.copy(qt)},this.setScissor=function(M,I,Z,V){M.isVector4?qt.set(M.x,M.y,M.z,M.w):qt.set(M,I,Z,V),_.scissor(Tt.copy(qt).multiplyScalar(nt).round())},this.getScissorTest=function(){return Ze},this.setScissorTest=function(M){_.setScissorTest(Ze=M)},this.setOpaqueSort=function(M){St=M},this.setTransparentSort=function(M){Gt=M},this.getClearColor=function(M){return M.copy(Ht.getClearColor())},this.setClearColor=function(){Ht.setClearColor(...arguments)},this.getClearAlpha=function(){return Ht.getClearAlpha()},this.setClearAlpha=function(){Ht.setClearAlpha(...arguments)},this.clear=function(M=!0,I=!0,Z=!0){let V=0;if(M){let k=!1;if(J!==null){let gt=J.texture.format;k=g.has(gt)}if(k){let gt=J.texture.type,xt=f.has(gt),mt=Ht.getClearColor(),At=Ht.getClearAlpha(),Lt=mt.r,Xt=mt.g,Jt=mt.b;xt?(v[0]=Lt,v[1]=Xt,v[2]=Jt,v[3]=At,B.clearBufferuiv(B.COLOR,0,v)):(S[0]=Lt,S[1]=Xt,S[2]=Jt,S[3]=At,B.clearBufferiv(B.COLOR,0,S))}else V|=B.COLOR_BUFFER_BIT}I&&(V|=B.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),Z&&(V|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),V!==0&&B.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),X=M},this.dispose=function(){n.removeEventListener("webglcontextlost",me,!1),n.removeEventListener("webglcontextrestored",Qt,!1),n.removeEventListener("webglcontextcreationerror",Zn,!1),Ht.dispose(),pt.dispose(),ct.dispose(),q.dispose(),lt.dispose(),it.dispose(),yt.dispose(),rt.dispose(),dt.dispose(),Et.dispose(),Et.removeEventListener("sessionstart",qr),Et.removeEventListener("sessionend",zl),ts.stop()};function me(M){M.preventDefault(),ru("WebGLRenderer: Context Lost."),z=!0}function Qt(){ru("WebGLRenderer: Context Restored."),z=!1;let M=G.autoReset,I=Mt.enabled,Z=Mt.autoUpdate,V=Mt.needsUpdate,k=Mt.type;Dt(),G.autoReset=M,Mt.enabled=I,Mt.autoUpdate=Z,Mt.needsUpdate=V,Mt.type=k}function Zn(M){zt("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function Rn(M){let I=M.target;I.removeEventListener("dispose",Rn),Hu(I)}function Hu(M){Bl(M),q.remove(M)}function Bl(M){let I=q.get(M).programs;I!==void 0&&(I.forEach(function(Z){dt.releaseProgram(Z)}),M.isShaderMaterial&&dt.releaseShaderCache(M))}this.renderBufferDirect=function(M,I,Z,V,k,gt){I===null&&(I=Cn);let xt=k.isMesh&&k.matrixWorld.determinantAffine()<0,mt=Vu(M,I,Z,V,k);_.setMaterial(V,xt);let At=Z.index,Lt=1;if(V.wireframe===!0){if(At=tt.getWireframeAttribute(Z),At===void 0)return;Lt=2}let Xt=Z.drawRange,Jt=Z.attributes.position,Ct=Xt.start*Lt,le=(Xt.start+Xt.count)*Lt;gt!==null&&(Ct=Math.max(Ct,gt.start*Lt),le=Math.min(le,(gt.start+gt.count)*Lt)),At!==null?(Ct=Math.max(Ct,0),le=Math.min(le,At.count)):Jt!=null&&(Ct=Math.max(Ct,0),le=Math.min(le,Jt.count));let Fe=le-Ct;if(Fe<0||Fe===1/0)return;yt.setup(k,V,mt,Z,At);let ue,ge=ut;if(At!==null&&(ue=ft.get(At),ge=et,ge.setIndex(ue)),k.isMesh)V.wireframe===!0?(_.setLineWidth(V.wireframeLinewidth*ze()),ge.setMode(B.LINES)):ge.setMode(B.TRIANGLES);else if(k.isLine){let N=V.linewidth;N===void 0&&(N=1),_.setLineWidth(N*ze()),k.isLineSegments?ge.setMode(B.LINES):k.isLineLoop?ge.setMode(B.LINE_LOOP):ge.setMode(B.LINE_STRIP)}else k.isPoints?ge.setMode(B.POINTS):k.isSprite&&ge.setMode(B.TRIANGLES);if(k.isBatchedMesh)if(ce.get("WEBGL_multi_draw"))ge.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let N=k._multiDrawStarts,j=k._multiDrawCounts,It=k._multiDrawCount,bt=At?ft.get(At).bytesPerElement:1,Re=q.get(V).currentProgram.getUniforms();for(let an=0;an<It;an++)Re.setValue(B,"_gl_DrawID",an),ge.render(N[an]/bt,j[an])}else if(k.isInstancedMesh)ge.renderInstances(Ct,Fe,k.count);else if(Z.isInstancedBufferGeometry){let N=Z._maxInstanceCount!==void 0?Z._maxInstanceCount:1/0,j=Math.min(Z.instanceCount,N);ge.renderInstances(Ct,Fe,j)}else ge.render(Ct,Fe)};function rr(M,I,Z,V){X!==null&&M.isNodeMaterial&&X.setObject(V,M),oe===!0&&Nt.setState(M,Z,!1),M.transparent===!0&&M.side===Es&&M.forceSinglePass===!1?(M.side=jn,M.needsUpdate=!0,Zr(M,I,V),M.side=tr,M.needsUpdate=!0,Zr(M,I,V),M.side=Es):Zr(M,I,V)}this.compile=function(M,I,Z=null){Z===null&&(Z=M),X!==null&&X.renderStart(M,I,Z),E=ct.get(Z),E.init(I),y.push(E),Z.traverseVisible(function(k){k.isLight&&k.layers.test(I.layers)&&(E.pushLight(k),k.castShadow&&E.pushShadow(k))}),M!==Z&&M.traverseVisible(function(k){k.isLight&&k.layers.test(I.layers)&&(E.pushLight(k),k.castShadow&&E.pushShadow(k))}),E.setupLights(),X!==null&&X.updateLights(E.state.lightsArray),pe=this.localClippingEnabled,oe=Nt.init(this.clippingPlanes,pe),oe===!0&&Nt.setGlobalState(this.clippingPlanes,I),X!==null&&Mt.render(E.state.shadowsArray,Z,I);let V=new Set;return M.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let gt=k.material;if(gt)if(Array.isArray(gt))for(let xt=0;xt<gt.length;xt++){let mt=gt[xt];rr(mt,Z,I,k),V.add(mt)}else rr(gt,Z,I,k),V.add(gt)}),E=y.pop(),X!==null&&X.renderEnd(),V},this.compileAsync=function(M,I,Z=null){let V=this.compile(M,I,Z);return new Promise(k=>{function gt(){if(V.forEach(function(xt){let At=q.get(xt).currentProgram;(At===void 0||At.isReady())&&V.delete(xt)}),V.size===0){k(M);return}setTimeout(gt,10)}ce.get("KHR_parallel_shader_compile")!==null?gt():setTimeout(gt,10)})};let Oi=null;function Wr(M){Oi&&Oi(M)}function qr(){ts.stop()}function zl(){ts.start()}let ts=new dT;ts.setAnimationLoop(Wr),typeof self<"u"&&ts.setContext(self),this.setAnimationLoop=function(M){Oi=M,Et.setAnimationLoop(M),M===null?ts.stop():ts.start()},Et.addEventListener("sessionstart",qr),Et.addEventListener("sessionend",zl),this.render=function(M,I){if(I!==void 0&&I.isCamera!==!0){zt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(z===!0)return;X!==null&&X.renderStart(M,I);let Z=Et.enabled===!0&&Et.isPresenting===!0,V=C!==null&&(J===null||Z)&&C.begin(D,J);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),Et.enabled===!0&&Et.isPresenting===!0&&(C===null||C.isCompositing()===!1)&&(Et.cameraAutoUpdate===!0&&Et.updateCamera(I),I=Et.getCamera()),M.isScene===!0&&M.onBeforeRender(D,M,I,J),E=ct.get(M,y.length),E.init(I),E.state.textureUnits=K.getTextureUnits(),y.push(E),Ot.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),jt.setFromProjectionMatrix(Ot,Yi,I.reversedDepth),pe=this.localClippingEnabled,oe=Nt.init(this.clippingPlanes,pe),T=pt.get(M,w.length),T.init(),w.push(T),Et.enabled===!0&&Et.isPresenting===!0){let xt=D.xr.getDepthSensingMesh();xt!==null&&Yr(xt,I,-1/0,D.sortObjects)}Yr(M,I,0,D.sortObjects),T.finish(),X!==null&&X.updateLights(E.state.lightsArray),D.sortObjects===!0&&T.sort(St,Gt),Be=Et.enabled===!1||Et.isPresenting===!1||Et.hasDepthSensing()===!1,Be&&Ht.addToRenderList(T,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),oe===!0&&Nt.beginShadows();let k=E.state.shadowsArray;if(Mt.render(k,M,I),oe===!0&&Nt.endShadows(),(V&&C.hasRenderPass())===!1){let xt=T.opaque,mt=T.transmissive;if(E.setupLights(),I.isArrayCamera){let At=I.cameras;if(mt.length>0)for(let Lt=0,Xt=At.length;Lt<Xt;Lt++){let Jt=At[Lt];or(xt,mt,M,Jt)}Be&&Ht.render(M);for(let Lt=0,Xt=At.length;Lt<Xt;Lt++){let Jt=At[Lt];Fl(T,M,Jt,Jt.viewport)}}else mt.length>0&&or(xt,mt,M,I),Be&&Ht.render(M),Fl(T,M,I)}J!==null&&W===0&&(K.updateMultisampleRenderTarget(J),K.updateRenderTargetMipmap(J)),V&&C.end(D),M.isScene===!0&&M.onAfterRender(D,M,I),yt.resetDefaultState(),Y=-1,$=null,y.pop(),y.length>0?(E=y[y.length-1],K.setTextureUnits(E.state.textureUnits),oe===!0&&Nt.setGlobalState(D.clippingPlanes,E.state.camera)):E=null,w.pop(),w.length>0?T=w[w.length-1]:T=null,X!==null&&X.renderEnd()};function Yr(M,I,Z,V){if(M.visible===!1)return;if(M.layers.test(I.layers)){if(M.isGroup)Z=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(I);else if(M.isLightProbeGrid)E.pushLightProbeGrid(M);else if(M.isLight)E.pushLight(M),M.castShadow&&E.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||M.intersectsFrustum(jt)){V&&$e.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Ot);let xt=it.update(M),mt=M.material;mt.visible&&T.push(M,xt,mt,Z,$e.z,null,I)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||M.intersectsFrustum(jt))){let xt=it.update(M),mt=M.material;if(V&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),$e.copy(M.boundingSphere.center)):(xt.boundingSphere===null&&xt.computeBoundingSphere(),$e.copy(xt.boundingSphere.center)),$e.applyMatrix4(M.matrixWorld).applyMatrix4(Ot)),Array.isArray(mt)){let At=xt.groups;for(let Lt=0,Xt=At.length;Lt<Xt;Lt++){let Jt=At[Lt],Ct=mt[Jt.materialIndex];Ct&&Ct.visible&&T.push(M,xt,Ct,Z,$e.z,Jt,I)}}else mt.visible&&T.push(M,xt,mt,Z,$e.z,null,I)}}let gt=M.children;for(let xt=0,mt=gt.length;xt<mt;xt++)Yr(gt[xt],I,Z,V)}function Fl(M,I,Z,V){let{opaque:k,transmissive:gt,transparent:xt}=M;E.setupLightsView(Z),oe===!0&&Nt.setGlobalState(D.clippingPlanes,Z),V&&_.viewport(at.copy(V)),k.length>0&&aa(k,I,Z),gt.length>0&&aa(gt,I,Z),xt.length>0&&aa(xt,I,Z),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function or(M,I,Z,V){if((Z.isScene===!0?Z.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[V.id]===void 0){let Ct=ce.has("EXT_color_buffer_half_float")||ce.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[V.id]=new si(1,1,{generateMipmaps:!0,type:Ct?$i:Mi,minFilter:ir,samples:Math.max(4,R.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:se.workingColorSpace})}let gt=E.state.transmissionRenderTarget[V.id],xt=V.viewport||at;gt.setSize(xt.z*D.transmissionResolutionScale,xt.w*D.transmissionResolutionScale);let mt=D.getRenderTarget(),At=D.getActiveCubeFace(),Lt=D.getActiveMipmapLevel();D.setRenderTarget(gt),D.getClearColor(ae),ne=D.getClearAlpha(),ne<1&&D.setClearColor(16777215,.5),D.clear(),Be&&Ht.render(Z);let Xt=D.toneMapping;D.toneMapping=Zi;let Jt=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),E.setupLightsView(V),oe===!0&&Nt.setGlobalState(D.clippingPlanes,V),aa(M,Z,V),K.updateMultisampleRenderTarget(gt),K.updateRenderTargetMipmap(gt),ce.has("WEBGL_multisampled_render_to_texture")===!1){let Ct=!1;for(let le=0,Fe=I.length;le<Fe;le++){let ue=I[le],{object:ge,geometry:N,material:j,group:It}=ue;if(j.side===Es&&ge.layers.test(V.layers)){let bt=j.side;j.side=jn,j.needsUpdate=!0,jr(ge,Z,V,N,j,It),j.side=bt,j.needsUpdate=!0,Ct=!0}}Ct===!0&&(K.updateMultisampleRenderTarget(gt),K.updateRenderTargetMipmap(gt))}D.setRenderTarget(mt,At,Lt),D.setClearColor(ae,ne),Jt!==void 0&&(V.viewport=Jt),D.toneMapping=Xt}function aa(M,I,Z){let V=I.isScene===!0?I.overrideMaterial:null;for(let k=0,gt=M.length;k<gt;k++){let xt=M[k],{object:mt,geometry:At,group:Lt}=xt,Xt=xt.material;Xt.allowOverride===!0&&V!==null&&(Xt=V),mt.layers.test(Z.layers)&&jr(mt,I,Z,At,Xt,Lt)}}function jr(M,I,Z,V,k,gt){X!==null&&k.isNodeMaterial&&X.setObject(M,k),M.onBeforeRender(D,I,Z,V,k,gt),M.modelViewMatrix.multiplyMatrices(Z.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),k.onBeforeRender(D,I,Z,V,M,gt),k.transparent===!0&&k.side===Es&&k.forceSinglePass===!1?(k.side=jn,k.needsUpdate=!0,D.renderBufferDirect(Z,I,V,k,M,gt),k.side=tr,k.needsUpdate=!0,D.renderBufferDirect(Z,I,V,k,M,gt),k.side=Es):D.renderBufferDirect(Z,I,V,k,M,gt),M.onAfterRender(D,I,Z,V,k,gt)}function Zr(M,I,Z){I.isScene!==!0&&(I=Cn);let V=q.get(M),k=E.state.lights,gt=E.state.shadowsArray,xt=k.state.version,mt=dt.getParameters(M,k.state,gt,I,Z,E.state.lightProbeGridArray),At=dt.getProgramCacheKey(mt),Lt=V.programs;V.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?I.environment:null,V.fog=I.fog;let Xt=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;V.envMap=lt.get(M.envMap||V.environment,Xt),V.envMapRotation=V.environment!==null&&M.envMap===null?I.environmentRotation:M.envMapRotation,Lt===void 0&&(M.addEventListener("dispose",Rn),Lt=new Map,V.programs=Lt);let Jt=Lt.get(At);if(Jt!==void 0){if(V.currentProgram===Jt&&V.lightsStateVersion===xt)return Kr(M,mt),Jt}else mt.uniforms=dt.getUniforms(M),X!==null&&M.isNodeMaterial&&X.build(M,Z,mt),M.onBeforeCompile(mt,D),Jt=dt.acquireProgram(mt,At),Lt.set(At,Jt),V.uniforms=mt.uniforms;let Ct=V.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ct.clippingPlanes=Nt.uniform),Kr(M,mt),V.needsLights=Zp(M),V.lightsStateVersion=xt,V.needsLights&&(Ct.ambientLightColor.value=k.state.ambient,Ct.lightProbe.value=k.state.probe,Ct.sunLights.value=k.state.sun,Ct.sunLightShadows.value=k.state.sunShadow,Ct.directionalLights.value=k.state.directional,Ct.directionalLightShadows.value=k.state.directionalShadow,Ct.spotLights.value=k.state.spot,Ct.spotLightShadows.value=k.state.spotShadow,Ct.rectAreaLights.value=k.state.rectArea,Ct.ltc_1.value=k.state.rectAreaLTC1,Ct.ltc_2.value=k.state.rectAreaLTC2,Ct.pointLights.value=k.state.point,Ct.pointLightShadows.value=k.state.pointShadow,Ct.hemisphereLights.value=k.state.hemi,Ct.sunShadowMatrix.value=k.state.sunShadowMatrix,Ct.sunShadowCascade.value=k.state.sunShadowCascade,Ct.directionalShadowMatrix.value=k.state.directionalShadowMatrix,Ct.spotLightMatrix.value=k.state.spotLightMatrix,Ct.spotLightMap.value=k.state.spotLightMap,Ct.pointShadowMatrix.value=k.state.pointShadowMatrix),V.lightProbeGrid=E.state.lightProbeGridArray.length>0,V.currentProgram=Jt,V.uniformsList=null,Jt}function Gl(M){if(M.uniformsList===null){let I=M.currentProgram.getUniforms();M.uniformsList=Ul.seqWithValue(I.seq,M.uniforms)}return M.uniformsList}function Kr(M,I){let Z=q.get(M);Z.outputColorSpace=I.outputColorSpace,Z.batching=I.batching,Z.batchingColor=I.batchingColor,Z.instancing=I.instancing,Z.instancingColor=I.instancingColor,Z.instancingMorph=I.instancingMorph,Z.skinning=I.skinning,Z.morphTargets=I.morphTargets,Z.morphNormals=I.morphNormals,Z.morphColors=I.morphColors,Z.morphTargetsCount=I.morphTargetsCount,Z.numClippingPlanes=I.numClippingPlanes,Z.numIntersection=I.numClipIntersection,Z.vertexAlphas=I.vertexAlphas,Z.vertexTangents=I.vertexTangents,Z.toneMapping=I.toneMapping}function Hl(M,I){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;x.setFromMatrixPosition(I.matrixWorld);for(let Z=0,V=M.length;Z<V;Z++){let k=M[Z];if(k.texture!==null&&k.boundingBox.containsPoint(x))return k}return null}function Vu(M,I,Z,V,k){I.isScene!==!0&&(I=Cn),K.resetTextureUnits();let gt=I.fog,xt=V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial?I.environment:null,mt=J===null?D.outputColorSpace:J.isXRRenderTarget===!0?J.texture.colorSpace:se.workingColorSpace,At=V.isMeshStandardMaterial||V.isMeshLambertMaterial&&!V.envMap||V.isMeshPhongMaterial&&!V.envMap,Lt=lt.get(V.envMap||xt,At),Xt=V.vertexColors===!0&&!!Z.attributes.color&&Z.attributes.color.itemSize===4,Jt=!!Z.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),Ct=!!Z.morphAttributes.position,le=!!Z.morphAttributes.normal,Fe=!!Z.morphAttributes.color,ue=Zi;V.toneMapped&&(J===null||J.isXRRenderTarget===!0)&&(ue=D.toneMapping);let ge=Z.morphAttributes.position||Z.morphAttributes.normal||Z.morphAttributes.color,N=ge!==void 0?ge.length:0,j=q.get(V),It=E.state.lights;if(oe===!0&&(pe===!0||M!==$)){let Ne=M===$&&V.id===Y;Nt.setState(V,M,Ne)}let bt=!1;V.version===j.__version?(j.needsLights&&j.lightsStateVersion!==It.state.version||j.outputColorSpace!==mt||k.isBatchedMesh&&j.batching===!1||!k.isBatchedMesh&&j.batching===!0||k.isBatchedMesh&&j.batchingColor===!0&&k._colorsTexture===null||k.isBatchedMesh&&j.batchingColor===!1&&k._colorsTexture!==null||k.isInstancedMesh&&j.instancing===!1||!k.isInstancedMesh&&j.instancing===!0||k.isSkinnedMesh&&j.skinning===!1||!k.isSkinnedMesh&&j.skinning===!0||k.isInstancedMesh&&j.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&j.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&j.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&j.instancingMorph===!1&&k.morphTexture!==null||j.envMap!==Lt||V.fog===!0&&j.fog!==gt||j.numClippingPlanes!==void 0&&(j.numClippingPlanes!==Nt.numPlanes||j.numIntersection!==Nt.numIntersection)||j.vertexAlphas!==Xt||j.vertexTangents!==Jt||j.morphTargets!==Ct||j.morphNormals!==le||j.morphColors!==Fe||j.toneMapping!==ue||j.morphTargetsCount!==N||!!j.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(bt=!0):(bt=!0,j.__version=V.version);let Re=j.currentProgram;bt===!0&&(Re=Zr(V,I,k),X&&V.isNodeMaterial&&X.onUpdateProgram(V,Re,j));let an=!1,es=!1,Jr=!1,Te=Re.getUniforms(),Ke=j.uniforms;if(_.useProgram(Re.program)&&(an=!0,es=!0,Jr=!0),V.id!==Y&&(Y=V.id,es=!0),j.needsLights){let Ne=Hl(E.state.lightProbeGridArray,k);j.lightProbeGrid!==Ne&&(j.lightProbeGrid=Ne,es=!0)}if(an||$!==M){_.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),Te.setValue(B,"projectionMatrix",M.projectionMatrix),Te.setValue(B,"viewMatrix",M.matrixWorldInverse);let oa=Te.map.cameraPosition;oa!==void 0&&oa.setValue(B,Ee.setFromMatrixPosition(M.matrixWorld)),R.logarithmicDepthBuffer&&Te.setValue(B,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&Te.setValue(B,"isOrthographic",M.isOrthographicCamera===!0),$!==M&&($=M,es=!0,Jr=!0)}if(j.needsLights&&(It.state.sunShadowMap.length>0&&Te.setValue(B,"sunShadowMap",It.state.sunShadowMap,K),It.state.directionalShadowMap.length>0&&Te.setValue(B,"directionalShadowMap",It.state.directionalShadowMap,K),It.state.spotShadowMap.length>0&&Te.setValue(B,"spotShadowMap",It.state.spotShadowMap,K),It.state.pointShadowMap.length>0&&Te.setValue(B,"pointShadowMap",It.state.pointShadowMap,K)),k.isSkinnedMesh){Te.setOptional(B,k,"bindMatrix"),Te.setOptional(B,k,"bindMatrixInverse");let Ne=k.skeleton;Ne&&(Ne.boneTexture===null&&Ne.computeBoneTexture(),Te.setValue(B,"boneTexture",Ne.boneTexture,K))}k.isBatchedMesh&&(Te.setOptional(B,k,"batchingTexture"),Te.setValue(B,"batchingTexture",k._matricesTexture,K),Te.setOptional(B,k,"batchingIdTexture"),Te.setValue(B,"batchingIdTexture",k._indirectTexture,K),Te.setOptional(B,k,"batchingColorTexture"),k._colorsTexture!==null&&Te.setValue(B,"batchingColorTexture",k._colorsTexture,K));let ra=Z.morphAttributes;if((ra.position!==void 0||ra.normal!==void 0||ra.color!==void 0)&&P.update(k,Z,Re),(es||j.receiveShadow!==k.receiveShadow)&&(j.receiveShadow=k.receiveShadow,Te.setValue(B,"receiveShadow",k.receiveShadow)),(V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial)&&V.envMap===null&&I.environment!==null&&(Ke.envMapIntensity.value=I.environmentIntensity),Ke.dfgLUT!==void 0&&(Ke.dfgLUT.value=DU()),es){if(Te.setValue(B,"toneMappingExposure",D.toneMappingExposure),j.needsLights&&Vl(Ke,Jr),gt&&V.fog===!0&&Rt.refreshFogUniforms(Ke,gt),Rt.refreshMaterialUniforms(Ke,V,nt,Q,E.state.transmissionRenderTarget[M.id]),j.needsLights&&j.lightProbeGrid){let Ne=j.lightProbeGrid;Ke.probesSH.value=Ne.texture,Ke.probesMin.value.copy(Ne.boundingBox.min),Ke.probesMax.value.copy(Ne.boundingBox.max),Ke.probesResolution.value.copy(Ne.resolution)}Ul.upload(B,Gl(j),Ke,K)}if(V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(Ul.upload(B,Gl(j),Ke,K),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&Te.setValue(B,"center",k.center),Te.setValue(B,"modelViewMatrix",k.modelViewMatrix),Te.setValue(B,"normalMatrix",k.normalMatrix),Te.setValue(B,"modelMatrix",k.matrixWorld),V.uniformsGroups!==void 0){let Ne=V.uniformsGroups;for(let oa=0,$r=Ne.length;oa<$r;oa++){let Hy=Ne[oa];rt.update(Hy,Re),rt.bind(Hy,Re)}}return Re}function Vl(M,I){M.ambientLightColor.needsUpdate=I,M.lightProbe.needsUpdate=I,M.sunLights.needsUpdate=I,M.sunLightShadows.needsUpdate=I,M.directionalLights.needsUpdate=I,M.directionalLightShadows.needsUpdate=I,M.pointLights.needsUpdate=I,M.pointLightShadows.needsUpdate=I,M.spotLights.needsUpdate=I,M.spotLightShadows.needsUpdate=I,M.rectAreaLights.needsUpdate=I,M.hemisphereLights.needsUpdate=I}function Zp(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return F},this.getActiveMipmapLevel=function(){return W},this.getRenderTarget=function(){return J},this.setRenderTargetTextures=function(M,I,Z){let V=q.get(M);V.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),q.get(M.texture).__webglTexture=I,q.get(M.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:Z,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,I){let Z=q.get(M);Z.__webglFramebuffer=I,Z.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(M,I=0,Z=0){J=M,F=I,W=Z;let V=null,k=!1,gt=!1;if(M){let mt=q.get(M);if(mt.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(B.FRAMEBUFFER,mt.__webglFramebuffer),at.copy(M.viewport),Tt.copy(M.scissor),wt=M.scissorTest,_.viewport(at),_.scissor(Tt),_.setScissorTest(wt),Y=-1;return}else if(mt.__webglFramebuffer===void 0)K.setupRenderTarget(M);else if(mt.__hasExternalTextures)K.rebindTextures(M,q.get(M.texture).__webglTexture,q.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let Xt=M.depthTexture;if(mt.__boundDepthTexture!==Xt){if(Xt!==null&&q.has(Xt)&&(M.width!==Xt.image.width||M.height!==Xt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");K.setupDepthRenderbuffer(M)}}let At=M.texture;(At.isData3DTexture||At.isDataArrayTexture||At.isCompressedArrayTexture)&&(gt=!0);let Lt=q.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Lt[I])?V=Lt[I][Z]:V=Lt[I],k=!0):M.samples>0&&K.useMultisampledRTT(M)===!1?V=q.get(M).__webglMultisampledFramebuffer:Array.isArray(Lt)?V=Lt[Z]:V=Lt,at.copy(M.viewport),Tt.copy(M.scissor),wt=M.scissorTest}else at.copy(_t).multiplyScalar(nt).floor(),Tt.copy(qt).multiplyScalar(nt).floor(),wt=Ze;if(Z!==0&&(V=H),_.bindFramebuffer(B.FRAMEBUFFER,V)&&_.drawBuffers(M,V),_.viewport(at),_.scissor(Tt),_.setScissorTest(wt),k){let mt=q.get(M.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+I,mt.__webglTexture,Z)}else if(gt){let mt=I;for(let At=0;At<M.textures.length;At++){let Lt=q.get(M.textures[At]);B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0+At,Lt.__webglTexture,Z,mt)}}else if(M!==null&&Z!==0){let mt=q.get(M.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,mt.__webglTexture,Z)}Y=-1};function ku(M){let I=q.get(M);return(I.__readFormat!==M.format||I.__readType!==M.type)&&(I.__readFormat=M.format,I.__readType=M.type,I.__formatReadable=R.textureFormatReadable(M.format),I.__typeReadable=R.textureTypeReadable(M.type)),I}this.readRenderTargetPixels=function(M,I,Z,V,k,gt,xt,mt=0){if(!(M&&M.isWebGLRenderTarget)){zt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let At=q.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&xt!==void 0&&(At=At[xt]),At){_.bindFramebuffer(B.FRAMEBUFFER,At);try{let Lt=M.textures[mt],Xt=Lt.format,Jt=Lt.type;M.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+mt);let Ct=ku(Lt);if(Ct.__formatReadable===!1){zt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ct.__typeReadable===!1){zt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=M.width-V&&Z>=0&&Z<=M.height-k&&B.readPixels(I,Z,V,k,ht.convert(Xt),ht.convert(Jt),gt)}finally{let Lt=J!==null?q.get(J).__webglFramebuffer:null;_.bindFramebuffer(B.FRAMEBUFFER,Lt)}}},this.readRenderTargetPixelsAsync=async function(M,I,Z,V,k,gt,xt,mt=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let At=q.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&xt!==void 0&&(At=At[xt]),At)if(I>=0&&I<=M.width-V&&Z>=0&&Z<=M.height-k){_.bindFramebuffer(B.FRAMEBUFFER,At);let Lt=M.textures[mt],Xt=Lt.format,Jt=Lt.type;M.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+mt);let Ct=ku(Lt);if(Ct.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ct.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let le=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,le),B.bufferData(B.PIXEL_PACK_BUFFER,gt.byteLength,B.STREAM_READ),B.readPixels(I,Z,V,k,ht.convert(Xt),ht.convert(Jt),0),B.bindBuffer(B.PIXEL_PACK_BUFFER,null);let Fe=J!==null?q.get(J).__webglFramebuffer:null;_.bindFramebuffer(B.FRAMEBUFFER,Fe);let ue=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await zE(B,ue,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,le),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,gt),B.bindBuffer(B.PIXEL_PACK_BUFFER,null),B.deleteBuffer(le),B.deleteSync(ue),gt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,I=null,Z=0){let V=Math.pow(2,-Z),k=Math.floor(M.image.width*V),gt=Math.floor(M.image.height*V),xt=I!==null?I.x:0,mt=I!==null?I.y:0;K.setTexture2D(M,0),B.copyTexSubImage2D(B.TEXTURE_2D,Z,0,0,xt,mt,k,gt),_.unbindTexture()},this.copyTextureToTexture=function(M,I,Z=null,V=null,k=0,gt=0){let xt,mt,At,Lt,Xt,Jt,Ct,le,Fe,ue=M.isCompressedTexture?M.mipmaps[gt]:M.image;if(Z!==null)xt=Z.max.x-Z.min.x,mt=Z.max.y-Z.min.y,At=Z.isBox3?Z.max.z-Z.min.z:1,Lt=Z.min.x,Xt=Z.min.y,Jt=Z.isBox3?Z.min.z:0;else{let Ke=Math.pow(2,-k);xt=Math.floor(ue.width*Ke),mt=Math.floor(ue.height*Ke),M.isDataArrayTexture?At=ue.depth:M.isData3DTexture?At=Math.floor(ue.depth*Ke):At=1,Lt=0,Xt=0,Jt=0}V!==null?(Ct=V.x,le=V.y,Fe=V.z):(Ct=0,le=0,Fe=0);let ge=ht.convert(I.format),N=ht.convert(I.type),j;I.isData3DTexture?(K.setTexture3D(I,0),j=B.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(K.setTexture2DArray(I,0),j=B.TEXTURE_2D_ARRAY):(K.setTexture2D(I,0),j=B.TEXTURE_2D),_.activeTexture(B.TEXTURE0),_.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,I.flipY),_.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),_.pixelStorei(B.UNPACK_ALIGNMENT,I.unpackAlignment);let It=_.getParameter(B.UNPACK_ROW_LENGTH),bt=_.getParameter(B.UNPACK_IMAGE_HEIGHT),Re=_.getParameter(B.UNPACK_SKIP_PIXELS),an=_.getParameter(B.UNPACK_SKIP_ROWS),es=_.getParameter(B.UNPACK_SKIP_IMAGES);_.pixelStorei(B.UNPACK_ROW_LENGTH,ue.width),_.pixelStorei(B.UNPACK_IMAGE_HEIGHT,ue.height),_.pixelStorei(B.UNPACK_SKIP_PIXELS,Lt),_.pixelStorei(B.UNPACK_SKIP_ROWS,Xt),_.pixelStorei(B.UNPACK_SKIP_IMAGES,Jt);let Jr=M.isDataArrayTexture||M.isData3DTexture,Te=I.isDataArrayTexture||I.isData3DTexture;if(M.isDepthTexture){let Ke=q.get(M),ra=q.get(I),Ne=q.get(Ke.__renderTarget),oa=q.get(ra.__renderTarget);_.bindFramebuffer(B.READ_FRAMEBUFFER,Ne.__webglFramebuffer),_.bindFramebuffer(B.DRAW_FRAMEBUFFER,oa.__webglFramebuffer);for(let $r=0;$r<At;$r++)Jr&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,q.get(M).__webglTexture,k,Jt+$r),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,q.get(I).__webglTexture,gt,Fe+$r)),B.blitFramebuffer(Lt,Xt,xt,mt,Ct,le,xt,mt,B.DEPTH_BUFFER_BIT,B.NEAREST);_.bindFramebuffer(B.READ_FRAMEBUFFER,null),_.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(k!==0||M.isRenderTargetTexture||q.has(M)){let Ke=q.get(M),ra=q.get(I);_.bindFramebuffer(B.READ_FRAMEBUFFER,A),_.bindFramebuffer(B.DRAW_FRAMEBUFFER,L);for(let Ne=0;Ne<At;Ne++)Jr?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,Ke.__webglTexture,k,Jt+Ne):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,Ke.__webglTexture,k),Te?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,ra.__webglTexture,gt,Fe+Ne):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,ra.__webglTexture,gt),k!==0?B.blitFramebuffer(Lt,Xt,xt,mt,Ct,le,xt,mt,B.COLOR_BUFFER_BIT,B.NEAREST):Te?B.copyTexSubImage3D(j,gt,Ct,le,Fe+Ne,Lt,Xt,xt,mt):B.copyTexSubImage2D(j,gt,Ct,le,Lt,Xt,xt,mt);_.bindFramebuffer(B.READ_FRAMEBUFFER,null),_.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else Te?M.isDataTexture||M.isData3DTexture?B.texSubImage3D(j,gt,Ct,le,Fe,xt,mt,At,ge,N,ue.data):I.isCompressedArrayTexture?B.compressedTexSubImage3D(j,gt,Ct,le,Fe,xt,mt,At,ge,ue.data):B.texSubImage3D(j,gt,Ct,le,Fe,xt,mt,At,ge,N,ue):M.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,gt,Ct,le,xt,mt,ge,N,ue.data):M.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,gt,Ct,le,ue.width,ue.height,ge,ue.data):B.texSubImage2D(B.TEXTURE_2D,gt,Ct,le,xt,mt,ge,N,ue);_.pixelStorei(B.UNPACK_ROW_LENGTH,It),_.pixelStorei(B.UNPACK_IMAGE_HEIGHT,bt),_.pixelStorei(B.UNPACK_SKIP_PIXELS,Re),_.pixelStorei(B.UNPACK_SKIP_ROWS,an),_.pixelStorei(B.UNPACK_SKIP_IMAGES,es),gt===0&&I.generateMipmaps&&B.generateMipmap(j),_.unbindTexture()},this.initRenderTarget=function(M){q.get(M).__webglFramebuffer===void 0&&K.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?K.setTextureCube(M,0):M.isData3DTexture?K.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?K.setTexture2DArray(M,0):K.setTexture2D(M,0),_.unbindTexture()},this.resetState=function(){F=0,W=0,J=null,_.reset(),yt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Yi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let n=this.getContext();n.drawingBufferColorSpace=se._getDrawingBufferColorSpace(t),n.unpackColorSpace=se._getUnpackColorSpace()}};var _T={type:"change"},Py={type:"start"},bT={type:"end"},Xp=new ia,xT=new _i,UU=Math.cos(70*ws.DEG2RAD),hn=new O,ai=2*Math.PI,Me={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Iy=1e-6,Wp=class extends Au{constructor(t,n=null){super(t,n),this.state=Me.NONE,this.target=new O,this.cursor=new O,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:$a.ROTATE,MIDDLE:$a.DOLLY,RIGHT:$a.PAN},this.touches={ONE:Qa.ROTATE,TWO:Qa.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new O,this._lastQuaternion=new xi,this._lastTargetPosition=new O,this._quat=new xi().setFromUnitVectors(t.up,new O(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Al,this._sphericalDelta=new Al,this._scale=1,this._panOffset=new O,this._rotateStart=new Ut,this._rotateEnd=new Ut,this._rotateDelta=new Ut,this._panStart=new Ut,this._panEnd=new Ut,this._panDelta=new Ut,this._dollyStart=new Ut,this._dollyEnd=new Ut,this._dollyDelta=new Ut,this._dollyDirection=new O,this._mouse=new Ut,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=PU.bind(this),this._onPointerDown=IU.bind(this),this._onPointerUp=OU.bind(this),this._onContextMenu=kU.bind(this),this._onMouseWheel=FU.bind(this),this._onKeyDown=GU.bind(this),this._onTouchStart=HU.bind(this),this._onTouchMove=VU.bind(this),this._onMouseDown=BU.bind(this),this._onMouseMove=zU.bind(this),this._interceptControlDown=XU.bind(this),this._interceptControlUp=WU.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=Me.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let t=this.domElement.getRootNode();t.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),t.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(_T),this.update(),this.state=Me.NONE}pan(t,n){this._pan(t,n),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){let n=this.object.position;hn.copy(n).sub(this.target),hn.applyQuaternion(this._quat),this._spherical.setFromVector3(hn),this.autoRotate&&this.state===Me.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(i)&&isFinite(s)&&(i<-Math.PI?i+=ai:i>Math.PI&&(i-=ai),s<-Math.PI?s+=ai:s>Math.PI&&(s-=ai),i<=s?this._spherical.theta=Math.max(i,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+s)/2?Math.max(i,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let a=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let r=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),a=r!=this._spherical.radius}if(hn.setFromSpherical(this._spherical),hn.applyQuaternion(this._quatInverse),n.copy(this.target).add(hn),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let r=null;if(this.object.isPerspectiveCamera){let o=hn.length();r=this._clampDistance(o*this._scale);let l=o-r;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),a=!!l}else if(this.object.isOrthographicCamera){let o=new O(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),a=l!==this.object.zoom;let c=new O(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),r=hn.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;r!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(r).add(this.object.position):(Xp.origin.copy(this.object.position),Xp.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Xp.direction))<UU?this.object.lookAt(this.target):(xT.setFromNormalAndCoplanarPoint(this.object.up,this.target),Xp.intersectPlane(xT,this.target))))}else if(this.object.isOrthographicCamera){let r=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),r!==this.object.zoom&&(this.object.updateProjectionMatrix(),a=!0)}return this._scale=1,this._performCursorZoom=!1,a||this._lastPosition.distanceToSquared(this.object.position)>Iy||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Iy||this._lastTargetPosition.distanceToSquared(this.target)>Iy?(this.dispatchEvent(_T),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?ai/60*this.autoRotateSpeed*t:ai/60/60*this.autoRotateSpeed}_getZoomScale(t){let n=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*n)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,n){hn.setFromMatrixColumn(n,0),hn.multiplyScalar(-t),this._panOffset.add(hn)}_panUp(t,n){this.screenSpacePanning===!0?hn.setFromMatrixColumn(n,1):(hn.setFromMatrixColumn(n,0),hn.crossVectors(this.object.up,hn)),hn.multiplyScalar(t),this._panOffset.add(hn)}_pan(t,n){let i=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;hn.copy(s).sub(this.target);let a=hn.length();a*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*a/i.clientHeight,this.object.matrix),this._panUp(2*n*a/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(n*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,n){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),s=t-i.left,a=n-i.top,r=i.width,o=i.height;this._mouse.x=s/r*2-1,this._mouse.y=-(a/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let n=this.domElement;this._rotateLeft(ai*this._rotateDelta.x/n.clientHeight),this._rotateUp(ai*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let n=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(ai*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),n=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-ai*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),n=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(ai*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),n=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-ai*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),n=!0;break}n&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._rotateStart.set(i,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._panStart.set(i,s)}}_handleTouchStartDolly(t){let n=this._getSecondPointerPosition(t),i=t.pageX-n.x,s=t.pageY-n.y,a=Math.sqrt(i*i+s*s);this._dollyStart.set(0,a)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let i=this._getSecondPointerPosition(t),s=.5*(t.pageX+i.x),a=.5*(t.pageY+i.y);this._rotateEnd.set(s,a)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let n=this.domElement;this._rotateLeft(ai*this._rotateDelta.x/n.clientHeight),this._rotateUp(ai*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._panEnd.set(i,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let n=this._getSecondPointerPosition(t),i=t.pageX-n.x,s=t.pageY-n.y,a=Math.sqrt(i*i+s*s);this._dollyEnd.set(0,a),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let r=(t.pageX+n.x)*.5,o=(t.pageY+n.y)*.5;this._updateZoomParameters(r,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==t.pointerId){this._pointers.splice(n,1);return}}_isTrackingPointer(t){for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==t.pointerId)return!0;return!1}_trackPointer(t){let n=this._pointerPositions[t.pointerId];n===void 0&&(n=new Ut,this._pointerPositions[t.pointerId]=n),n.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let n=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[n]}_customWheelEvent(t){let n=t.deltaMode,i={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(n){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function IU(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType==="touch"?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function PU(e){this.enabled!==!1&&(e.pointerType==="touch"?this._onTouchMove(e):this._onMouseMove(e))}function OU(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(bT),this.state=Me.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y});break}}function BU(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case $a.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=Me.DOLLY;break;case $a.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=Me.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=Me.ROTATE}break;case $a.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=Me.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=Me.PAN}break;default:this.state=Me.NONE}this.state!==Me.NONE&&this.dispatchEvent(Py)}function zU(e){switch(this.state){case Me.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case Me.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case Me.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e);break}}function FU(e){this.enabled===!1||this.enableZoom===!1||this.state!==Me.NONE||(e.preventDefault(),this.dispatchEvent(Py),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(bT))}function GU(e){this.enabled!==!1&&this._handleKeyDown(e)}function HU(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case Qa.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=Me.TOUCH_ROTATE;break;case Qa.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=Me.TOUCH_PAN;break;default:this.state=Me.NONE}break;case 2:switch(this.touches.TWO){case Qa.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=Me.TOUCH_DOLLY_PAN;break;case Qa.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=Me.TOUCH_DOLLY_ROTATE;break;default:this.state=Me.NONE}break;default:this.state=Me.NONE}this.state!==Me.NONE&&this.dispatchEvent(Py)}function VU(e){switch(this._trackPointer(e),this.state){case Me.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case Me.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case Me.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case Me.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=Me.NONE}}function kU(e){this.enabled!==!1&&e.preventDefault()}function XU(e){e.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function WU(e){e.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var ST=18,MT=72,qp=["#49d9c5","#6f9cff","#a67cff","#ed9361","#db6f9d","#69c982","#5bbbea","#d8b95f"];function wT(e,t={}){return new Oy(e,t)}var Oy=class{canvas;callbacks;graph=null;layout=null;selectedId=null;hoveredId=null;nodeObjects=[];edgeObjects=[];communityObjects=[];nodeById=new Map;positionById=new Map;labelObjects=[];activeLabelIds=null;disposables=[];pointerDown=null;focusAnimation=null;lastSignature=null;frameId=0;disposed=!1;eventController=new AbortController;scene=new cu;camera=new Pn(48,1,1,5e3);renderer;controls;graphGroup=new ta;nodeGeometry=new Su(1,ST,Math.max(10,ST-6));glowTexture=jU();raycaster=new wu;pointer=new Ut;resizeObserver;starfield=ZU();constructor(t,n){this.canvas=t,this.callbacks=n,this.scene.background=null,this.scene.fog=new lu(527120,48e-5),this.camera.position.set(0,0,900),this.renderer=new Hp({canvas:t,antialias:!0,alpha:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.setClearColor(527120,0),this.renderer.outputColorSpace=wn,this.controls=new Wp(this.camera,t),this.controls.enableDamping=!0,this.controls.dampingFactor=.075,this.controls.zoomToCursor=!0,this.controls.minDistance=100,this.controls.maxDistance=2800,this.controls.rotateSpeed=.46,this.controls.panSpeed=.82,this.controls.zoomSpeed=.85,this.controls.target.set(0,0,0),this.graphGroup.name="cgrx-project-graph",this.scene.add(this.graphGroup),this.scene.add(this.starfield),this.raycaster.params.Line.threshold=5,this.resizeObserver=new ResizeObserver(()=>this.resize()),this.resizeObserver.observe(t.parentElement||t),this.bindEvents(),this.resize(),this.animate()}bindEvents(){let t={signal:this.eventController.signal};this.canvas.addEventListener("pointerdown",n=>{this.pointerDown={x:n.clientX,y:n.clientY}},t),this.canvas.addEventListener("pointermove",n=>this.handlePointerMove(n),t),this.canvas.addEventListener("pointerleave",()=>{this.hoveredId=null,this.canvas.style.cursor="grab",this.applyFocus(this.selectedId)},t),this.canvas.addEventListener("click",n=>this.handleClick(n),t),this.canvas.addEventListener("dblclick",n=>this.handleDoubleClick(n),t)}resize(){let t=this.canvas.parentElement,n=Math.max(1,t?.clientWidth||this.canvas.clientWidth||1),i=Math.max(1,t?.clientHeight||this.canvas.clientHeight||1);this.renderer.setSize(n,i,!1),this.camera.aspect=n/i,this.camera.updateProjectionMatrix()}render(t,n,{selectedId:i=null}={}){this.graph=t,this.layout=n,this.selectedId=i==null?null:String(i);let s=`${t.snapshot?.repo_revision||""}:${t.snapshot?.graph_generation||""}:${t.snapshot?.working_tree_digest||""}:${t.level||"packages"}:${t.root.path}:${n.nodes.length}:${t.edges?.length||0}`,a=this.lastSignature!==s;this.lastSignature=s,this.clearGraph();let r=new Map((n.communities||[]).map((c,u)=>[c.id,u])),o=Math.max(1,r.size),l=Math.max(.9,Math.min(1.45,1180/Math.max(980,n.width)));for(let c of n.communities||[])this.addCommunity(c,r.get(c.id)||0,o,n,l);for(let c of n.nodes||[]){let u=qU(c,n,r,o,l);this.positionById.set(String(c.node_id),u),this.addNode(c,u)}for(let c of t.edges||[])this.addEdge(c);this.applyFocus(this.selectedId),a&&this.resetView(!1),this.updateLabelVisibility()}clearGraph(){this.graphGroup.clear();for(let t of this.disposables)t.dispose?.();this.disposables=[],this.nodeObjects=[],this.edgeObjects=[],this.communityObjects=[],this.nodeById.clear(),this.positionById.clear(),this.labelObjects=[],this.activeLabelIds=null}addCommunity(t,n,i,s,a){let r=AT(t.x,t.y,s,a);r.z=CT(n,i)*.72;let o=Math.max(44,t.radius*a),l=new Yt(qp[n%qp.length]),c=new qa({map:this.glowTexture,color:l,transparent:!0,opacity:.065,depthWrite:!1,depthTest:!1,blending:er}),u=new zr(c);u.position.copy(r).add(new O(0,0,-18)),u.scale.set(o*2.75,o*2.2,1),u.renderOrder=-3,u.userData={kind:"community",communityId:t.id,baseOpacity:c.opacity},this.graphGroup.add(u),this.communityObjects.push(u),this.disposables.push(c);let d=[];for(let g=0;g<MT;g+=1){let f=g/MT*Math.PI*2;d.push(new O(r.x+Math.cos(f)*o,r.y+Math.sin(f)*o,r.z))}let h=new yn().setFromPoints(d),p=new Fr({color:l,transparent:!0,opacity:.1,depthWrite:!1}),m=new pu(h,p);m.renderOrder=-1,this.graphGroup.add(m),this.disposables.push(h,p);let b=ET(TT(t.label||`cluster ${n+1}`,28),{color:qp[n%qp.length],opacity:.62,fontSize:12});b.position.set(r.x-o*.72,r.y+o*.72,r.z+4),b.scale.multiplyScalar(.9),this.graphGroup.add(b),this.disposables.push(b.material),b.material.map&&this.disposables.push(b.material.map)}addNode(t,n){let i=new Yt(t.color||"#69d8ff"),s=new Ya({color:i,transparent:!0,opacity:.9,depthWrite:!0}),a=new Yn(this.nodeGeometry,s);a.position.copy(n),a.scale.setScalar(Math.max(3.2,t.radius*.64)),a.userData={kind:"node",node:t,baseColor:i.clone()},this.graphGroup.add(a),this.nodeObjects.push(a),this.nodeById.set(String(t.node_id),a),this.disposables.push(s);let r=new qa({map:this.glowTexture,color:i,transparent:!0,opacity:.11,depthWrite:!1,blending:Ru}),o=new zr(r),l=Math.max(13,t.radius*3.4);if(o.scale.set(l/a.scale.x,l/a.scale.y,1),o.userData={kind:"halo",nodeId:String(t.node_id),baseOpacity:.11},a.add(o),this.disposables.push(r),t.cycle){let u=new Ya({color:15910509,wireframe:!0,transparent:!0,opacity:.72,depthWrite:!1}),d=new Yn(this.nodeGeometry,u);d.scale.setScalar(1.17),a.add(d),this.disposables.push(u)}let c=ET(TT(t.symbol,28),{color:"#dcebf6",opacity:t.showLabel?.88:0,fontSize:13});c.position.copy(n).add(new O(Math.max(12,t.radius+8),0,4)),c.userData={kind:"label",nodeId:String(t.node_id),major:!!t.showLabel},this.graphGroup.add(c),this.labelObjects.push(c),this.disposables.push(c.material),c.material.map&&this.disposables.push(c.material.map)}addEdge(t){let n=this.positionById.get(String(t.source)),i=this.positionById.get(String(t.target));if(!n||!i)return;let s=new yn().setFromPoints(YU(n,i,`${t.source}:${t.target}`)),a=Math.max(1,Number(t.weight||1)),r=this.graph?.level?Math.min(.4,.2+Math.log2(a+1)*.025):Math.max(.045,Math.min(.28,.05+Math.log2(a+1)*.038)),o=new Fr({color:7438482,transparent:!0,opacity:r,depthWrite:!1}),l=new Ml(s,o);l.userData={kind:"edge",edge:t,baseOpacity:r},this.graphGroup.add(l),this.edgeObjects.push(l),this.disposables.push(s,o)}setSelected(t){this.selectedId=t==null?null:String(t),this.applyFocus(this.hoveredId||this.selectedId)}focusNode(t){let n=this.nodeById.get(String(t));if(!n)return;let i=n.position.clone(),s=this.camera.position.clone().sub(this.controls.target),a=ws.clamp(s.length(),260,560);s.lengthSq()<1&&s.set(0,0,1),s.normalize().multiplyScalar(a);let r=i.clone().add(s);this.focusAnimation={startedAt:performance.now(),duration:420,fromTarget:this.controls.target.clone(),toTarget:i,fromCamera:this.camera.position.clone(),toCamera:r}}resetView(t=!0){if(!this.nodeObjects.length)return;let n=new bs;for(let c of this.nodeObjects)n.expandByPoint(c.position);let i=n.getBoundingSphere(new Ss),s=Math.max(90,i.radius+70),a=ws.degToRad(this.camera.fov),r=ws.clamp(s/Math.tan(a/2)*1.06,320,2200),o=i.center,l=new O(o.x,o.y+s*.08,o.z+r);if(!t){this.controls.target.copy(o),this.camera.position.copy(l),this.controls.update();return}this.focusAnimation={startedAt:performance.now(),duration:460,fromTarget:this.controls.target.clone(),toTarget:o.clone(),fromCamera:this.camera.position.clone(),toCamera:l}}zoom(t){let n=this.camera.position.clone().sub(this.controls.target),i=ws.clamp(n.length()/t,this.controls.minDistance,this.controls.maxDistance);n.lengthSq()<1&&n.set(0,0,1),this.camera.position.copy(this.controls.target).add(n.normalize().multiplyScalar(i)),this.controls.update()}handlePointerMove(t){if(!this.layout)return;let n=this.pick(t,!0),i=n?.object?.userData?.kind==="node"?String(n.object.userData.node.node_id):null;i!==this.hoveredId&&(this.hoveredId=i,this.canvas.style.cursor=i?"pointer":"grab",this.applyFocus(this.hoveredId||this.selectedId))}handleClick(t){if(!this.layout||KU(this.pointerDown,t))return;let n=this.pick(t,!1);if(n){if(n.object.userData.kind==="node"){this.callbacks.onNodeSelect?.(n.object.userData.node);return}if(n.object.userData.kind==="edge"){let i=n.object.userData.edge,s=this.layout.nodes.find(r=>String(r.node_id)===String(i.source)),a=this.layout.nodes.find(r=>String(r.node_id)===String(i.target));s&&a&&this.callbacks.onEdgeSelect?.(i,s,a)}}}handleDoubleClick(t){let n=this.pick(t,!0);n?.object?.userData?.kind==="node"&&this.callbacks.onNodeOpen?.(n.object.userData.node)}pick(t,n){let i=this.canvas.getBoundingClientRect();if(!i.width||!i.height)return null;this.pointer.x=(t.clientX-i.left)/i.width*2-1,this.pointer.y=-((t.clientY-i.top)/i.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera);let s=this.raycaster.intersectObjects(this.nodeObjects,!1);return s.length||n?s[0]||null:this.raycaster.intersectObjects(this.edgeObjects,!1)[0]||null}applyFocus(t){let n=t==null?null:String(t),i=new Set(n?[n]:[]);if(n)for(let a of this.graph?.edges||[]){let r=String(a.source),o=String(a.target);r===n&&i.add(o),o===n&&i.add(r)}this.activeLabelIds=n?i:null;let s=n?this.layout?.nodes.find(a=>String(a.node_id)===n)?.community:null;for(let a of this.nodeObjects){let r=String(a.userData.node.node_id),o=!n||i.has(r),l=r===n;a.material.opacity=o?.94:.075,a.material.color.copy(a.userData.baseColor),l&&a.material.color.lerp(new Yt(16777215),.34);let c=a.children.find(u=>u.userData.kind==="halo");c&&(c.material.opacity=l?.48:o?.14:.012)}for(let a of this.edgeObjects){let r=a.userData.edge,o=!!(n&&(String(r.source)===n||String(r.target)===n));a.material.opacity=n?o?.92:.014:Number(a.userData.baseOpacity),a.material.color.setHex(o?15858687:7438482)}for(let a of this.communityObjects){let r=!n||a.userData.communityId===s;a.material.opacity=Number(a.userData.baseOpacity)*(r?1:.24)}this.updateLabelVisibility()}updateLabelVisibility(){let n=this.camera.position.distanceTo(this.controls.target)<650,i=this.hoveredId||this.selectedId;this.camera.updateMatrixWorld();let s=this.canvas.clientWidth,a=this.canvas.clientHeight,r=[],o=i?[...this.labelObjects.filter(l=>l.userData.nodeId===i),...this.labelObjects.filter(l=>l.userData.nodeId!==i)]:this.labelObjects;for(let l of o){let c=String(l.userData.nodeId),u=!!(i&&c===String(i)),d=!this.activeLabelIds||this.activeLabelIds.has(c);if(l.visible=!1,!d||!l.userData.major&&!n&&!this.activeLabelIds||r.length>=80)continue;let h=l.position.clone().applyMatrix4(this.camera.matrixWorldInverse);if(h.z>=-this.camera.near)continue;let p=h.clone().applyMatrix4(this.camera.projectionMatrix),m=(p.x+1)*s/2,b=(1-p.y)*a/2,g=l.scale.x*this.camera.projectionMatrix.elements[0]/-h.z*s/2,f=Math.max(12,l.scale.y*this.camera.projectionMatrix.elements[5]/-h.z*a/2),v={left:m-3,right:m+g+3,top:b-f/2-3,bottom:b+f/2+3};v.right<0||v.left>s||v.bottom<0||v.top>a||rm(v,r)||(r.push(v),l.visible=!0,l.material.opacity=u?1:l.userData.major?.84:.66)}}animate(){this.disposed||(this.frameId=requestAnimationFrame(()=>this.animate()),!this.canvas.hidden&&(this.focusAnimation&&this.stepFocusAnimation(),this.controls.update(),this.updateLabelVisibility(),this.renderer.render(this.scene,this.camera)))}stepFocusAnimation(){let t=this.focusAnimation;if(!t)return;let n=ws.clamp((performance.now()-t.startedAt)/t.duration,0,1),i=1-Math.pow(1-n,3);this.controls.target.lerpVectors(t.fromTarget,t.toTarget,i),this.camera.position.lerpVectors(t.fromCamera,t.toCamera,i),n>=1&&(this.focusAnimation=null)}dispose(){this.disposed||(this.disposed=!0,cancelAnimationFrame(this.frameId),this.eventController.abort(),this.resizeObserver.disconnect(),this.controls.dispose(),this.clearGraph(),this.nodeGeometry.dispose(),this.glowTexture.dispose(),this.starfield.geometry.dispose(),this.starfield.material.dispose(),this.renderer.dispose())}};function qU(e,t,n,i,s){let a=AT(e.x,e.y,t,s),r=n.get(e.community)||0;return a.z=CT(r,i)+RT(String(e.node_id))*58,a}function YU(e,t,n){if(e.distanceToSquared(t)<1e-4)return new _u(e,e.clone().add(new O(-24,35,8)),t.clone().add(new O(24,35,8)),t).getPoints(24);let i=e.clone().lerp(t,.5),s=t.clone().sub(e),a=Math.max(1,s.length()),r=new O(-s.y,s.x,0).normalize(),o=Math.min(42,Math.max(8,a*.085))*RT(n);return i.addScaledVector(r,o),i.z+=Math.min(24,a*.035),new xu(e,i,t).getPoints(18)}function AT(e,t,n,i){return new O((Number(e)-n.width/2)*i,-(Number(t)-n.height/2)*i,0)}function CT(e,t){if(t<=1)return 0;let n=e-(t-1)/2;return ws.clamp(n*26,-150,150)}function RT(e){let t=2166136261;for(let n of String(e))t^=n.charCodeAt(0),t=Math.imul(t,16777619);return(t>>>0)/4294967295*2-1}function jU(){let e=document.createElement("canvas");e.width=96,e.height=96;let t=e.getContext("2d");if(!t)throw new Error("2D canvas context is unavailable");let n=t.createRadialGradient(48,48,0,48,48,48);n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.34,"rgba(255,255,255,.62)"),n.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=n,t.fillRect(0,0,96,96);let i=new Tl(e);return i.colorSpace=wn,i}function ET(e,t={}){let n=t.fontSize||13,i=document.createElement("canvas"),s=i.getContext("2d");if(!s)throw new Error("2D canvas context is unavailable");s.font=`600 ${n*2}px ui-monospace, SFMono-Regular, Menlo, monospace`;let a=Math.ceil(s.measureText(e).width+28);i.width=Math.max(64,a),i.height=Math.ceil(n*3.2),s.font=`600 ${n*2}px ui-monospace, SFMono-Regular, Menlo, monospace`,s.textBaseline="middle",s.fillStyle=t.color||"#dcebf6",s.shadowColor="rgba(0,0,0,.94)",s.shadowBlur=7,s.fillText(e,12,i.height/2);let r=new Tl(i);r.colorSpace=wn;let o=new qa({map:r,transparent:!0,opacity:t.opacity??.86,depthWrite:!1,depthTest:!1}),l=new zr(o),c=18;return l.scale.set(c*i.width/i.height,c,1),l.center.set(0,.5),l.renderOrder=10,l}function ZU(){let e=new yn,t=850,n=new Float32Array(t*3),i=2402408747,s=()=>(i=Math.imul(i^i>>>15,1|i),i^=i+Math.imul(i^i>>>7,61|i),((i^i>>>14)>>>0)/4294967296);for(let r=0;r<t;r+=1)n[r*3]=(s()-.5)*2600,n[r*3+1]=(s()-.5)*1800,n[r*3+2]=-250-s()*1200;e.setAttribute("position",new Xn(n,3));let a=new El({color:6783125,size:1.7,transparent:!0,opacity:.28,depthWrite:!1});return new mu(e,a)}function KU(e,t){return e?Math.hypot(t.clientX-e.x,t.clientY-e.y)>5:!1}function TT(e,t){let n=String(e||"");return n.length<=t?n:`${n.slice(0,t-1)}\u2026`}function NT(e,t=Date.now()*1e6){let n=typeof e.evidence=="string"?e.evidence:"";if(!n.includes("observed"))return null;let i=Math.max(1,Number(e.count)||1),s=Math.max(0,(t-Number(e.last_seen_unix_nanos||t))/864e11),a=Math.max(.35,Math.min(1,1-s/30)),r=Math.min(6,1.7+Math.log2(i+1));return{dash:n==="observed"?"5 5":"2 3",marker:"\u25CF",width:r,opacity:a,label:`${i.toLocaleString("en-US")} calls \xB7 ${(e.environments||[]).join(", ")||"runtime"}`}}function DT(e,t){let n=new URLSearchParams({evidence:e});for(let i of[...new Set(t)].sort())n.append("environment",i);return n.toString()}function LT(e,t=[]){let i=(Array.isArray(e.edges)?e.edges:[]).filter(s=>typeof s.evidence=="string"&&s.evidence.includes("observed"));return JSON.stringify({schema:"cgrx.agent.runtime-overlay.v1",snapshot:e.snapshot,root:e.root,evidence:e.evidence,environment_filter:e.environment_filter||[],observed_edges:i,runtime_gaps:e.runtime_gaps||{unresolved:0,ambiguous:0},deterministic_insights:t,constraints:{llm_used:!1,revalidate_snapshot_before_edit:!0,observed_paths_are_execution_evidence_not_exhaustive_coverage:!0}},null,2)}function UT(e){return JSON.stringify(e.agent_handoff,null,2)}function IT(e){let t=e?.change_plan||e||{},n=(t.missions||[]).map(a=>({...a,title:a.change_paths?.[0]||a.review_paths?.[0]||a.mission_id,evidenceCount:(a.finding_indexes?.length||0)+(a.impact_indexes?.length||0),testCount:a.related_test_indexes?.length||0})),i=new Map(n.map(a=>[a.mission_id,a])),s=(t.execution_order||[]).map((a,r)=>({index:r,missions:a.map(o=>i.get(o)).filter(Boolean)}));return{snapshot:t.snapshot,groups:s,missions:n,dependencies:n.flatMap(a=>(a.depends_on||[]).map(r=>({source:r,target:a.mission_id}))),totals:t.totals||{missions:n.length,parallel_groups:s.length,blocked:0},partial:!!t.partial,agent_handoff:t.agent_handoff}}function PT(e){return JSON.stringify(e.agent_handoff,null,2)}function OT(e,t,n){let i=t.agent_handoff||{};return{...i,schema_version:"cgrx.agent.architecture-future.v1",snapshot:i.snapshot||e,issue:i.issue||(t.kind==="PACKAGE_DEPENDENCY_CYCLE"?{kind:t.kind,packages:t.packages,selected_boundary:t.selected_boundary}:{kind:t.kind,symbol:t.symbol}),strategy_id:n.strategy_id,policy:n.policy,predicted_graph:n.predicted_graph,llm_used:!1,constraints:{...i.constraints||{},llm_used:!1,revalidate_snapshot_before_edit:!0,preserve_proven_edges_unless_listed:!0},verification:i.verification||["Re-index edited source before accepting the predicted graph.","Confirm the targeted cycle or hotspot changed as predicted.","Report remaining coverage gaps separately from proven graph changes."]}}function BT(e){let t=e.candidates?.length||0,n=!!e.partial,i=`${e.total>t?`${t}/${e.total}`:e.total}${n?" \xB7 partial":""}`,s=e.coverage_gap_count||0;return{count:i,note:n?`Bounded result \xB7 ${s} coverage gaps. Destructive paths stay blocked.`:""}}function By(e,t){let n=new Map;for(let r of e.nodes||[])n.set(Rs(r),{...r});let i=(r,o="entrypoints")=>{if(!r||Rs(r)==="")return;let l=Rs(r);n.has(l)||n.set(l,{...r,node_id:r.node_id??r.id,lane:o,path:r.path||"proposed",span:r.span||{start:0,end:0},source_hash:r.source_hash||"hypothetical",status:r.status||"hypothetical"})};for(let r of t.verification?.review_symbols||[])i(r);let s=(e.edges||[]).map(r=>({...r,status:"preserved"})),a=t.graph_delta||{};for(let r of a.preserve||[]){i(r.source,"callers"),i(r.target,"entrypoints");let o=Rs(r.source),l=Rs(r.target);s.some(u=>String(u.source)===o&&String(u.target)===l&&u.relation===r.relation)||s.push({...r,source:o,target:l,status:"preserved"})}for(let[r,o]of[[a.add,"hypothetical"],[a.redirect,"hypothetical"],[a.move_to_helper,"hypothetical"]])for(let l of r||[])i(l.source,(l.source?.status==="hypothetical","entrypoints")),i(l.target,l.target?.status==="hypothetical"?"entrypoints":"callees"),s.push({...l,source:Rs(l.source),target:Rs(l.target),confidence:o==="hypothetical"?"hypothetical":l.confidence,status:o});for(let r of a.remove||[]){i(r);let o=Rs(r);n.set(o,{...n.get(o),status:"remove"})}return{...e,nodes:[...n.values()],edges:s,projection:t.strategy_id}}function zT(e){let t=new Set((e.cycles||[]).flatMap(s=>s.packages||[])),n=(e.packages||[]).map(s=>({node_id:`package:${s.name}`,symbol:s.name,path:s.name,span:{start:0,end:0},source_hash:"package-projection",lane:"entrypoints",kind:"package",files:s.files,symbols:s.symbols,fan_in:s.fan_in,fan_out:s.fan_out,cycle:t.has(s.name),status:"current"})),i=(e.boundaries||[]).map(s=>({source:`package:${s.source}`,target:`package:${s.target}`,relation:(s.relations||[]).join("+")||"CALLS",confidence:s.confidence,status:"current",evidence:s.evidence?.[0],evidence_count:s.edges}));return{snapshot:e.snapshot,root:{symbol:"Architecture",path:"."},nodes:n,edges:i,containers:[],partial:e.partial,coverage_gap_count:e.coverage_gap_count}}function FT(e){let t=e.packages||[],n=t.map(d=>d.name).sort((d,h)=>h.length-d.length),i=new Map,s=(e.communities||[]).map((d,h)=>{let p=`community:${h}`;for(let m of d.packages||[])i.set(m,p);return{id:p,label:(d.packages||[])[0]||`cluster ${h+1}`,packages:d.packages||[],cohesion:Number(d.cohesion||0),internal_weight:Number(d.internal_weight||0),cut_weight:Number(d.cut_weight||0)}}),a=t.filter(d=>!i.has(d.name)).map(d=>d.name);a.length&&s.push({id:"community:unclustered",label:"unclustered",packages:a,cohesion:0,internal_weight:0,cut_weight:0});let r=new Map(t.map(d=>[d.name,[]])),o=d=>n.find(h=>d===h||d.startsWith(`${h}/`));for(let d of e.symbol_communities||[])for(let h of d.top_nodes||[]){let p=o(h.path||"");if(!p)continue;let m=r.get(p);!m.some(b=>b.node_id===h.node_id)&&m.length<6&&m.push(h)}let l=new Set((e.cycles||[]).flatMap(d=>d.packages||[])),c=t.map(d=>({node_id:`package:${d.name}`,symbol:d.name,path:d.name,kind:"project-package",community:i.get(d.name)||"community:unclustered",files:Number(d.files||0),symbols:Number(d.symbols||0),fan_in:Number(d.fan_in||0),fan_out:Number(d.fan_out||0),degree:Number(d.fan_in||0)+Number(d.fan_out||0),cycle:l.has(d.name),representatives:r.get(d.name)||[],status:"current"})),u=(e.boundaries||[]).map(d=>({source:`package:${d.source}`,target:`package:${d.target}`,relation:(d.relations||[]).join("+")||"DEPENDENCY",confidence:d.confidence||"PROVEN",weight:Number(d.edges||1),status:"current",evidence:d.evidence?.[0]}));return{snapshot:e.snapshot,root:{symbol:"Project map",path:"."},nodes:c,edges:u,communities:s,totals:e.totals||{},partial:!!e.partial,coverage_gap_count:Number(e.coverage_gap_count||0),package_depth:e.package_depth}}function GT(e,t,n){let i=(e.nodes||[]).map(o=>({...o})),s=(e.edges||[]).map(o=>({...o,status:"preserved"})),a=o=>{i.some(l=>Rs(l)===Rs(o))||i.push(o)},r=(o,l,c)=>s.push({source:o,target:l,relation:c,confidence:"hypothetical",status:"hypothetical"});if(t?.kind==="PACKAGE_DEPENDENCY_CYCLE"){let o=`package:${t.selected_boundary?.source}`,l=`package:${t.selected_boundary?.target}`;if(n.policy!=="preserve_and_monitor"&&(s=s.filter(c=>!(String(c.source)===o&&String(c.target)===l))),n.policy==="invert_dependency"&&r(l,o,"INVERTED_DEPENDENCY"),n.policy==="extract_contract"){let c=Yp(`future:contract:${t.issue_id}`,`${t.selected_boundary.source} \u2194 ${t.selected_boundary.target} contract`,"contract");a(c),r(o,c.node_id,"DEPENDS_ON_CONTRACT"),r(l,c.node_id,"DEPENDS_ON_CONTRACT")}}if(t?.kind==="HIGH_FAN_IN_HOTSPOT"){let o=Yp(`hotspot:${t.issue_id}`,t.symbol?.symbol||"hotspot","hotspot",t.symbol?.path||"observed hotspot");if(o.status="current",o.fan_in=t.symbol?.fan_in,a(o),n.policy==="introduce_facade"){let l=Yp(`future:facade:${t.issue_id}`,"stable facade","facade");a(l),r(l.node_id,o.node_id,"DELEGATES_TO")}if(n.policy==="split_by_community")for(let l of[1,2]){let c=Yp(`future:community:${t.issue_id}:${l}`,`caller community ${l}`,"community-split");a(c),r(c.node_id,o.node_id,"PARTITIONED_CALLS")}}return{...e,nodes:i,edges:s,projection:n.strategy_id,architecture_issue:t.issue_id}}function Yp(e,t,n,i="proposed"){return{node_id:e,symbol:t,path:i,span:{start:0,end:0},source_hash:"hypothetical",lane:"entrypoints",kind:n,status:"hypothetical"}}function Rs(e){return e==null?"":String(typeof e=="string"||typeof e=="number"?e:e.node_id??e.id??"")}function zy(e){return e?`${e.repo_revision}:${e.working_tree_digest}:${e.graph_generation}`:""}var U=Kn(Ds(),1),HT={x:0,y:0,scale:1},JU=[{id:"project",label:"Project map"},{id:"current",label:"Current"},{id:"architecture",label:"Architecture"},{id:"changes",label:"Changes"},{id:"preview",label:"Preview"},{id:"compare",label:"Compare"},{id:"history",label:"Git history"}],$U=[{id:"static",label:"Static"},{id:"observed",label:"Runtime"},{id:"all",label:"Combined"}],kT=`cgrx-token:${location.host}`,QU=new URLSearchParams(location.hash.slice(1)),Fy=QU.get("token")||sessionStorage.getItem(kT)||"";Fy&&sessionStorage.setItem(kT,Fy);location.hash&&history.replaceState(null,"",`${location.pathname}${location.search}`);var jp=new URLSearchParams(location.search).get("project");C1();async function Qi(e,t){let n=new URL(e,location.origin);jp&&n.pathname!=="/api/projects"&&n.searchParams.set("project",jp);let i=await fetch(n,{headers:{"X-CGRX-Token":Fy},cache:"no-store",signal:t}),s=await i.json();if(!i.ok)throw new Error(s?.error?.detail||`Request failed: ${i.status}`);return s}function tI(){let[e,t]=(0,ot.useState)(null),[n,i]=(0,ot.useState)(""),s=e?.projects.find(N=>N.id===(jp||e.default_project)),a=(0,ot.useCallback)(async()=>{try{t(await Qi("/api/projects")),i("")}catch(N){i(Ns(N))}},[]);(0,ot.useEffect)(()=>{a()},[a]);let[r,o]=(0,ot.useState)(null),[l,c]=(0,ot.useState)("connecting"),[u,d]=(0,ot.useState)("project"),[h,p]=(0,ot.useState)("2d"),[m,b]=(0,ot.useState)(!0),[g,f]=(0,ot.useState)(!1),[v,S]=(0,ot.useState)(!1),[x,T]=(0,ot.useState)("static"),[E,w]=(0,ot.useState)(""),[y,C]=(0,ot.useState)(HT),[D,z]=(0,ot.useState)({}),[X,H]=(0,ot.useState)(""),[A,L]=(0,ot.useState)([]),[F,W]=(0,ot.useState)(0),[J,Y]=(0,ot.useState)(""),[$,at]=(0,ot.useState)(null),[Tt,wt]=(0,ot.useState)(null),[ae,ne]=(0,ot.useState)(null),[re,Q]=(0,ot.useState)(null),[nt,St]=(0,ot.useState)("symbols"),[Gt,_t]=(0,ot.useState)("**"),[qt,Ze]=(0,ot.useState)("**"),[jt,oe]=(0,ot.useState)(""),pe=(0,ot.useRef)(0),Ot=(0,ot.useMemo)(()=>nt==="packages"?ae:re?i_(re,nt):null,[nt,ae,re]),[Ee,$e]=(0,ot.useState)([]),[Cn,Be]=(0,ot.useState)(!1),[ze,B]=(0,ot.useState)(null),[sn,ce]=(0,ot.useState)(""),[R,_]=(0,ot.useState)(null),[G,q]=(0,ot.useState)(""),[K,lt]=(0,ot.useState)(null),[ft,tt]=(0,ot.useState)(""),[it,dt]=(0,ot.useState)(null),[Rt,pt]=(0,ot.useState)(null),[ct,Nt]=(0,ot.useState)(null),[Mt,Ht]=(0,ot.useState)(null),[P,ut]=(0,ot.useState)({kind:"none",facts:[]}),[et,ht]=(0,ot.useState)("Trace evidence, then compare futures."),[yt,rt]=(0,ot.useState)("");(0,ot.useEffect)(()=>{f(!1)},[P]),(0,ot.useEffect)(()=>{let N=j=>{let It=j.target;It.matches("input, textarea, select")||It.isContentEditable||(j.key==="/"&&(j.preventDefault(),b(!0),requestAnimationFrame(()=>document.getElementById("search-input")?.focus())),j.key==="?"&&S(bt=>!bt),j.key==="Escape"&&(S(!1),f(!0)))};return window.addEventListener("keydown",N),()=>window.removeEventListener("keydown",N)},[P]);let Dt=(0,ot.useRef)(null),Et=(0,ot.useRef)(null),me=(0,ot.useRef)(x),Qt=(0,ot.useRef)(E),Zn=(0,ot.useRef)(y),Rn=(0,ot.useRef)(null),Hu=(0,ot.useRef)(0),Bl=(0,ot.useRef)(null),rr=(0,ot.useRef)(null);(0,ot.useEffect)(()=>{Dt.current=r},[r]),(0,ot.useEffect)(()=>{Et.current=$},[$]),(0,ot.useEffect)(()=>{me.current=x},[x]),(0,ot.useEffect)(()=>{Qt.current=E},[E]),(0,ot.useEffect)(()=>{Zn.current=y},[y]);let Oi=(0,ot.useCallback)(async(N,j)=>{let It=++Hu.current;ht("Loading verified neighborhood\u2026");let bt=Qt.current?[Qt.current]:[],Re=await Qi(`/api/graph?symbol=${encodeURIComponent(N)}&path=${encodeURIComponent(j)}&direction=both&depth=1&node_limit=80&edge_limit=160&${DT(me.current,bt)}`);It===Hu.current&&(at(Re),Et.current=Re,o(Re.snapshot),Dt.current=Re.snapshot,dt(an=>Re.nodes.some(es=>String(es.node_id)===String(an))?an:null),ht(""))},[]),Wr=(0,ot.useCallback)(async(N,j)=>{d("current"),await Oi(N,j)},[Oi]),qr=(0,ot.useCallback)(async()=>{let N=++pe.current;oe(""),Q(null);try{let j=await Qi(`/api/repository-graph?scope=${encodeURIComponent(Gt)}&node_limit=5000&edge_limit=30000`);N===pe.current&&Q(j)}catch(j){N===pe.current&&oe(Ns(j))}},[Gt]),zl=(0,ot.useCallback)(async()=>{let N=await Qi("/api/architecture?scope=**&package_depth=2&limit=300");wt(zT(N)),ne(FT(N)),$e(N.architecture_plan?.issues||[]),Be(!!N.partial)},[]),ts=(0,ot.useCallback)(async()=>{try{let N=await Qi("/api/refactors?scope=**&min_score=760&limit=8");B(N),ce("")}catch(N){ce(Ns(N))}},[]),Yr=(0,ot.useCallback)(async()=>{try{let N=await Qi("/api/runtime-status");_(N),q("");let j=N.environments||[];Qt.current&&!j.includes(Qt.current)&&(Qt.current="",w(""))}catch(N){q(Ns(N))}},[]),Fl=(0,ot.useCallback)(async()=>{try{let N=await Qi("/api/change-plan?limit=20");lt(IT(N)),tt("")}catch(N){lt(null),tt(Ns(N))}},[]),or=(0,ot.useCallback)(async()=>{await Promise.all([qr(),zl(),Fl(),Yr(),ts()])},[qr,zl,Fl,ts,Yr]),aa=(0,ot.useRef)(!1),jr=(0,ot.useCallback)(async(N=!0)=>{if(!aa.current){aa.current=!0;try{let j=await Qi("/api/status"),It=zy(Dt.current),bt=zy(j.snapshot),Re=!!(It&&It!==bt);if(It!==bt&&o(j.snapshot),Dt.current=j.snapshot,c(Re?"refreshing":"live"),Re&&N){pt(null),Nt(null),Ht(null),await or();let an=Et.current?.root;an&&await Oi(an.symbol,an.path),c("live")}}catch(j){c("offline"),ht(Ns(j))}finally{aa.current=!1}}},[Oi,or]);(0,ot.useEffect)(()=>{let N=!1;(async()=>{await jr(!1),N||await or()})();let It=window.setInterval(()=>{jr(!0)},2500);return()=>{N=!0,window.clearInterval(It)}},[jr,or]),(0,ot.useEffect)(()=>{let N=It=>{let bt=rr.current;if(!bt)return;let Re=Math.max(.1,Zn.current.scale);z(an=>({...an,[bt.key]:{x:bt.origin.x+(It.clientX-bt.x)/Re,y:bt.origin.y+(It.clientY-bt.y)/Re}}))},j=()=>{rr.current=null};return document.addEventListener("pointermove",N),document.addEventListener("pointerup",j),()=>{document.removeEventListener("pointermove",N),document.removeEventListener("pointerup",j)}},[]);let Zr=async N=>{N.preventDefault();let j=X.trim();if(j)try{let It=await Qi(`/api/search?q=${encodeURIComponent(j)}&scope=**&limit=12`);L(It.matches),W(It.total),Y("")}catch(It){Y(Ns(It))}},Gl=N=>{if(N.kind==="symbol"){Kr(N),Rn.current?.focusNode(N.node_id);return}dt(N.node_id),ut({kind:N.kind==="file"?"file":"package",facts:[[N.kind==="file"?"File":"Package",N.symbol],["Community",N.community.replace("community:","")],["Files",N.files],["Symbols",N.symbols],["Incoming",N.fan_in],["Outgoing",N.fan_out],["Cycle",N.cycle?"candidate package cycle":"none detected"]],representatives:N.representatives}),Rn.current?.focusNode(N.node_id)},Kr=async N=>{dt(N.node_id);let j=[["Symbol",N.symbol],["Path",N.path],["Span",N.span?`${N.span.start}\u2013${N.span.end}`:"unknown"],["Source hash",N.source_hash],["State",N.status==="hypothetical"?"hypothetical future":N.lane==="tests"?"candidate \xB7 not run":"current \xB7 indexed"]];if(N.kind==="package"&&j.push(["Files",N.files],["Symbols",N.symbols],["Fan in",N.fan_in],["Fan out",N.fan_out],["Cycle",N.cycle?"candidate package cycle":"none detected"]),ut({kind:N.lane||"node",facts:j}),N.kind!=="package")try{let It=await Qi(`/api/snippet?symbol=${encodeURIComponent(N.symbol)}&path=${encodeURIComponent(N.path)}`);ut(bt=>bt.facts===j?{kind:N.lane||"node",facts:j,code:It.source||It.declaration||"Source unavailable."}:bt)}catch(It){ut(bt=>bt.facts===j?{kind:N.lane||"node",facts:j,error:Ns(It)}:bt)}},Hl=(N,j,It)=>{let bt=typeof N.evidence=="object"&&N.evidence?N.evidence:{};ut({kind:"edge",facts:[["Relationship",`${j.symbol} \u2192 ${It.symbol}`],["Kind",N.relation],["Confidence",N.confidence],...Number(N.weight)>1?[["Aggregated relationships",N.weight]]:[],["Resolver","resolver"in bt?bt.resolver:"indexed"],["Evidence site","path"in bt?`${bt.path}:${bt.span?.start??"?"}`:"hypothetical"],["Source hash","source_hash"in bt?bt.source_hash:"not applicable"],...N.count?[["Observed calls",N.count],["Environments",(N.environments||[]).join(", ")],["Last seen",N.last_seen_unix_nanos]]:[]]})},Vu=N=>{d("changes"),ut({kind:"mission",facts:[["Mission",N.mission_id],["Kind",N.kind],["Parallel group",N.parallel_group+1],["Depends on",N.depends_on?.join(", ")||"none"],["Change paths",N.change_paths?.join(", ")||"none"],["Review paths",N.review_paths?.join(", ")||"none"],["Evidence",N.evidenceCount],["Candidate tests",N.testCount],["Coverage",N.blocked_by_gaps?"blocked by gaps":"ready for review"],["Steps",N.steps?.join(" \u2192 ")||"inspect"]]})},Vl=(N,j=ct)=>{let It=j?{...N,agent_handoff:OT(r,j,N)}:N;Ht(It)},Zp=N=>{pt(N),Nt(null),d("current"),Vl(N.strategies[0],null),Oi(N.left.symbol,N.left.path)},ku=N=>{pt(null),Nt(N),d("architecture"),Vl(N.strategies[0],N)},M=async(N,j)=>{await navigator.clipboard.writeText(N),rt(j)},I=()=>{Mt&&M(UT(Mt),"Agent plan copied")},Z=()=>{if(ct){M(JSON.stringify({tool:"get_architecture",arguments:{scope:"**",package_depth:2,limit:50},selected_issue_id:ct.issue_id,selected_strategy_id:Mt?.strategy_id,revalidate_snapshot:r},null,2),"Architecture MCP call copied");return}Rt&&M(JSON.stringify({tool:"suggest_refactors",arguments:{scope:{include:["**"],exclude:[],relation_kinds:["CALLS","IMPLEMENTS"],max_depth:1},language:Rt.language,min_score:760,limit:8},revalidate_snapshot:r},null,2),"MCP call copied")},V=N=>{if(u==="project"){Rn.current?.zoom(N);return}C(j=>({...j,scale:hI(j.scale*N,.45,2.4)}))},k=()=>{if(z({}),u==="project"){Rn.current?.resetView();return}C(HT)},gt=N=>{me.current=N,T(N);let j=Et.current?.root;j&&Oi(j.symbol,j.path).catch(It=>ht(Ns(It)))},xt=N=>{Qt.current=N,w(N);let j=Et.current?.root;j&&Oi(j.symbol,j.path).catch(It=>ht(Ns(It)))},mt=N=>{u==="project"||N.target.closest?.("[data-graph-interactive='true']")||(Bl.current={pointerId:N.pointerId,x:N.clientX,y:N.clientY,camera:y},N.currentTarget.setPointerCapture(N.pointerId))},At=N=>{let j=Bl.current;!j||j.pointerId!==N.pointerId||u==="project"||C({...j.camera,x:j.camera.x+N.clientX-j.x,y:j.camera.y+N.clientY-j.y})},Lt=()=>{Bl.current=null},Xt=(0,ot.useMemo)(()=>u==="architecture"?Tt?ct&&Mt?GT(Tt,ct,Mt):Tt:null:$?u==="preview"&&Mt?By($,Mt):$:null,[Tt,$,u,ct,Mt]),Jt=u==="project"?"Project map":u==="architecture"?ct&&Mt?`Architecture \xB7 ${Mt.policy.replaceAll("_"," ")}`:"Architecture":u==="changes"?"Change missions":u==="history"?"Git history":$?.root.symbol||"Focused graph",Ct=u==="project"?"Repository topology":u==="architecture"?"Architecture projection":u==="changes"?"Deterministic execution DAG":u==="history"?"Repository history":"Focused neighborhood",le=ze?BT(ze):{count:"0",note:""},Fe=Ee.slice(0,12),ue=R?.insights?.rows||[],ge=ct?.strategies||Rt?.strategies||[];return(0,U.jsxs)(U.Fragment,{children:[(0,U.jsx)("a",{className:"skip-link",href:"#graph-canvas",children:"Skip to graph"}),(0,U.jsxs)("header",{className:"topbar",children:[(0,U.jsxs)("div",{className:"brand","aria-label":"CGRX Evidence Graph Explorer",children:[(0,U.jsx)("strong",{children:"CGRX"}),(0,U.jsx)("small",{title:s?.path,children:s?.name||"Code atlas"})]}),(0,U.jsxs)("div",{className:"atlas-stats","aria-label":"Repository summary",children:[(0,U.jsxs)("span",{children:[Ot?.nodes.length??"\u2014"," ",nt]}),(0,U.jsxs)("span",{children:[Ot?.edges.length??"\u2014"," connections"]}),Ot?.truncated&&(0,U.jsxs)("span",{className:"atlas-stat--partial",children:["Showing part of ",Ot.totals?.symbols," symbols / ",Ot.totals?.relationships," links \xB7 narrow scope"]}),Ot?.partial&&(0,U.jsx)("span",{className:"atlas-stat--partial",children:"Partial coverage"})]}),(0,U.jsxs)("div",{className:"snapshot","aria-live":"polite",children:[(0,U.jsx)("span",{className:`badge badge--${l==="live"?"live":l==="connecting"?"loading":"stale"}`,children:l}),(0,U.jsx)("code",{title:r?.repo_revision,children:r?r.repo_revision.slice(0,9):"loading snapshot"})]})]}),(0,U.jsxs)("main",{className:`workspace atlas-workspace${u==="project"?" workspace--project":""}`,children:[(0,U.jsx)(m_,{mode:u,modes:JU,onMode:d,discoveryOpen:m,onDiscovery:()=>b(N=>!N)}),(0,U.jsxs)("aside",{id:"discovery-panel",className:"rail floating-panel","aria-label":"Graph discovery",hidden:!m,children:[(0,U.jsx)(Ju,{title:"Explore repository",detail:s?.name||"Choose a project and follow its connections",onClose:()=>b(!1)}),(0,U.jsx)(l_,{catalogue:e,selectedId:jp,error:n,onRefresh:()=>void a()}),(0,U.jsxs)("form",{className:"search",role:"search",onSubmit:N=>{Zr(N)},children:[(0,U.jsx)("label",{htmlFor:"search-input",children:"Find a symbol"}),(0,U.jsxs)("div",{className:"search__row",children:[(0,U.jsx)("input",{id:"search-input",value:X,onChange:N=>H(N.target.value),autoComplete:"off",placeholder:"Runtime, handler, save\u2026",required:!0}),(0,U.jsx)("button",{type:"submit","aria-label":"Search",children:"\u21B5"})]})]}),u==="project"&&nt!=="packages"&&(0,U.jsxs)("form",{className:"search",onSubmit:N=>{N.preventDefault(),_t(qt.trim()||"**")},children:[(0,U.jsx)("label",{htmlFor:"graph-scope",children:"Graph scope \xB7 path glob"}),(0,U.jsxs)("div",{className:"search__row",children:[(0,U.jsx)("input",{id:"graph-scope",value:qt,onChange:N=>Ze(N.target.value),placeholder:"crates/cgrx-core/**"}),(0,U.jsx)("button",{type:"submit","aria-label":"Apply graph scope",children:"\u21B5"})]}),(0,U.jsx)("small",{className:"quiet",children:Ot?.truncated?"View limited to 5,000 symbols / 30,000 links. Narrow scope to explore more.":"All indexed symbols in scope \xB7 calls and implementations"})]}),u==="project"&&Ot&&(0,U.jsxs)(Pl,{title:nt==="packages"?"Packages":nt==="files"?"Files":"Symbols",count:String(Ot.nodes.length),defaultOpen:!0,children:[Ot.nodes.slice(0,100).map(N=>(0,U.jsx)(Xr,{title:N.symbol,subtitle:N.kind==="symbol"?`${N.path}:${N.span?.start??"?"}`:`${N.symbols} symbols \xB7 ${N.degree} connections`,onClick:()=>Gl(N)},String(N.node_id))),Ot.nodes.length>100&&(0,U.jsxs)("p",{className:"quiet",children:["First 100 shown in list. All ",Ot.nodes.length," nodes are on the map; use search or narrow scope."]})]}),(0,U.jsx)(Pl,{title:"Matches",count:String(F),defaultOpen:F>0||!!J,children:J?(0,U.jsx)("p",{className:"error",children:J}):A.length?A.map(N=>(0,U.jsx)(Xr,{title:N.symbol,subtitle:`${N.path}:${N.span.start}`,onClick:()=>{Wr(N.symbol,N.path)}},`${N.path}:${N.span.start}:${N.symbol}`)):(0,U.jsx)("p",{className:"quiet",children:"Search by intent or symbol."})},`matches-${F}-${J}`),(0,U.jsx)(Pl,{title:"Runtime intelligence",count:ue.length?`${ue.length}/${R?.insights?.total??ue.length}`:"0",children:G?(0,U.jsx)("p",{className:"error",children:G}):ue.length?ue.map(N=>(0,U.jsx)(Xr,{title:N.symbol,subtitle:`priority ${N.refactor_priority} \xB7 ${N.observed_count} calls \xB7 ${N.next_action.replaceAll("_"," ")}`,onClick:()=>{Wr(N.symbol,N.path)}},`${N.path}:${N.symbol}`)):(0,U.jsx)("p",{className:"quiet",children:"Import a trace to rank hot paths, divergence and blast radius."})}),(0,U.jsx)(Pl,{title:"Architecture futures",count:`${Fe.length}${Ee.length>Fe.length?`/${Ee.length}`:""}${Cn?" \xB7 partial":""}`,maxClass:"architecture-future-list",children:Fe.length?Fe.map(N=>{let j=N.strategies.find(Re=>Re.recommended)||N.strategies[0],It=N.kind==="PACKAGE_DEPENDENCY_CYCLE"?(N.packages||[]).join(" \u2194 "):`${N.symbol?.symbol||"hotspot"} \xB7 ${Ol(N.symbol?.path||"unknown path",25)}`,bt=N.kind==="PACKAGE_DEPENDENCY_CYCLE"?`${N.selected_boundary?.edges||0} boundary edges`:`${N.symbol?.fan_in||0} proven callers`;return(0,U.jsx)(Xr,{title:It,subtitle:`${j?.policy?.replaceAll("_"," ")||"inspect"} \xB7 ${bt}`,onClick:()=>ku(N)},N.issue_id)}):(0,U.jsx)("p",{className:"quiet",children:"No cycle or high fan-in future is available in this scope."})}),(0,U.jsx)(Pl,{title:"Change missions",count:K?`${K.totals.missions}${K.partial?" \xB7 partial":""}`:"0",maxClass:"mission-list",children:ft?(0,U.jsx)("p",{className:"error",children:ft}):K?.missions.length?K.missions.slice(0,12).map(N=>(0,U.jsx)(Xr,{title:N.title,subtitle:`group ${N.parallel_group+1} \xB7 ${N.kind.replaceAll("_"," ")}${N.blocked_by_gaps?" \xB7 blocked":""}`,onClick:()=>Vu(N)},N.mission_id)):(0,U.jsx)("p",{className:"quiet",children:"No source changes. The plan will appear as files change."})}),(0,U.jsx)(Pl,{title:"Refactor paths",count:le.count,grow:!0,children:sn?(0,U.jsx)("p",{className:"error",children:sn}):ze?.candidates.length?(0,U.jsxs)(U.Fragment,{children:[ze.candidates.map(N=>(0,U.jsx)(Xr,{title:`${N.left.symbol} \u2194 ${N.right.symbol}`,subtitle:`${N.language} \xB7 score ${N.similarity.total}`,onClick:()=>Zp(N)},`${N.left.node_id}:${N.right.node_id}`)),le.note&&(0,U.jsx)("p",{className:"quiet bounded-note",children:le.note})]}):(0,U.jsx)("p",{className:"quiet",children:"No candidate crossed the current threshold."})})]}),(0,U.jsxs)("section",{className:"stage","aria-labelledby":"graph-title",children:[(0,U.jsxs)("div",{className:"stage__toolbar",children:[(0,U.jsxs)("div",{children:[(0,U.jsx)("p",{className:"eyebrow",children:Ct}),(0,U.jsx)("h1",{id:"graph-title",children:Jt})]}),u==="project"&&(0,U.jsxs)("label",{className:"detail-select",children:["Detail",(0,U.jsxs)("select",{"aria-label":"Graph detail",value:nt,onChange:N=>{St(N.target.value),dt(null),ut({kind:"none",facts:[]})},children:[(0,U.jsx)("option",{value:"symbols",children:"Symbols"}),(0,U.jsx)("option",{value:"files",children:"Files"}),(0,U.jsx)("option",{value:"packages",children:"Packages"})]})]}),u==="project"&&(0,U.jsxs)("div",{className:"dimension-switch",role:"group","aria-label":"Graph dimensions",children:[(0,U.jsx)("button",{type:"button","aria-pressed":h==="2d",onClick:()=>p("2d"),children:"2D"}),(0,U.jsx)("button",{type:"button","aria-pressed":h==="3d",onClick:()=>p("3d"),children:"3D"})]}),(0,U.jsx)("button",{className:"help-toggle","aria-label":"Graph keyboard help","aria-expanded":v,onClick:()=>S(N=>!N),children:"?"}),u!=="project"&&(0,U.jsxs)(U.Fragment,{children:[(0,U.jsx)("div",{className:"evidence-switch",role:"group","aria-label":"Evidence layer",children:$U.map(N=>(0,U.jsx)("button",{type:"button",className:x===N.id?"is-active":"",onClick:()=>gt(N.id),children:N.label},N.id))}),(0,U.jsxs)("label",{className:"environment-filter",htmlFor:"runtime-environment",children:["Environment",(0,U.jsxs)("select",{id:"runtime-environment",value:E,onChange:N=>xt(N.target.value),children:[(0,U.jsx)("option",{value:"",children:"All"}),(R?.environments||[]).map(N=>(0,U.jsx)("option",{value:N,children:N},N))]})]})]}),u!=="history"&&u!=="changes"&&(0,U.jsxs)("div",{className:"view-actions",children:[(0,U.jsx)("button",{type:"button",onClick:()=>V(1/1.2),"aria-label":"Zoom out",children:"\u2212"}),(0,U.jsx)("button",{type:"button",onClick:k,children:"Reset"}),(0,U.jsx)("button",{type:"button",onClick:()=>V(1.2),"aria-label":"Zoom in",children:"+"})]})]}),v&&(0,U.jsxs)("div",{className:"keyboard-help floating-panel",role:"region","aria-label":"Graph help",children:[(0,U.jsx)(Ju,{title:"Graph controls",onClose:()=>S(!1)}),(0,U.jsx)("p",{children:"Drag the canvas to move \xB7 Scroll to zoom"}),(0,U.jsx)("p",{children:"Click a node to inspect \xB7 Double-click to open code"}),(0,U.jsx)("p",{children:"2D: drag nodes to arrange \xB7 3D: drag to orbit, right-drag to pan"}),(0,U.jsxs)("p",{children:[(0,U.jsx)("kbd",{children:"/"})," Search \xB7 ",(0,U.jsx)("kbd",{children:"Tab"})," Navigate \xB7 ",(0,U.jsx)("kbd",{children:"Enter"})," Inspect \xB7 ",(0,U.jsx)("kbd",{children:"Esc"})," Close \xB7 ",(0,U.jsx)("kbd",{children:"?"})," Help"]})]}),u==="history"?(0,U.jsx)(lI,{snapshot:r,onInspect:ut,onError:ht}):u==="changes"?(0,U.jsx)(oI,{projection:K,onSelect:Vu,onCopy:()=>K?.agent_handoff&&void M(PT(K),"Change mission handoff copied")}):(0,U.jsx)("div",{id:"graph-canvas",className:`graph-canvas${u==="project"?" graph-canvas--project":""}`,tabIndex:0,"aria-label":"Interactive code relationship graph",onWheel:N=>{u!=="project"&&(N.preventDefault(),V(N.deltaY<0?1.08:1/1.08))},onPointerDown:mt,onPointerMove:At,onPointerUp:Lt,onKeyDown:N=>{if(u==="project")return;let It={ArrowLeft:[-28,0],ArrowRight:[28,0],ArrowUp:[0,-28],ArrowDown:[0,28]}[N.key];It&&(N.preventDefault(),C(bt=>({...bt,x:bt.x+It[0],y:bt.y+It[1]})))},children:u==="project"&&Ot?(0,U.jsx)(eI,{dimension:h,ref:Rn,graph:Ot,selectedId:it,onNodeSelect:Gl,onNodeOpen:N=>{let j=N.representatives?.[0];j&&Wr(j.symbol,j.path)},onEdgeSelect:Hl}):u==="project"?(0,U.jsxs)("div",{className:"graph-message",children:[(0,U.jsx)("strong",{children:jt||"Loading repository relationships\u2026"}),jt&&(0,U.jsx)("button",{onClick:()=>void qr(),children:"Retry"})]}):u==="compare"&&$&&Mt?(0,U.jsx)(sI,{current:$,future:By($,Mt),camera:y,selectedNodeId:it,pins:D,onSelectNode:N=>{Kr(N)},onInspectEdge:Hl,onNodeDrag:(N,j)=>{rr.current={key:String(j.node_id??j.id),x:N.clientX,y:N.clientY,origin:{x:j.x,y:j.y}}}}):Xt?(0,U.jsx)(iI,{graph:Xt,camera:y,selectedNodeId:it,pins:D,onSelectNode:N=>{Kr(N)},onInspectEdge:Hl,onNodeDrag:(N,j)=>{rr.current={key:String(j.node_id??j.id),x:N.clientX,y:N.clientY,origin:{x:j.x,y:j.y}}}}):(0,U.jsx)("div",{className:"graph-message",children:(0,U.jsx)("strong",{children:et||(u==="architecture"?"Loading architecture projection\u2026":"Select a symbol to inspect its neighborhood.")})})}),u!=="history"&&u!=="changes"&&(0,U.jsxs)("footer",{className:"legend","aria-label":"Evidence legend",children:[(0,U.jsxs)("span",{children:[(0,U.jsx)("i",{className:"key key--proven",children:"\u2713"})," proven now"]}),(0,U.jsxs)("span",{children:[(0,U.jsx)("i",{className:"key key--gap",children:"?"})," unresolved gap"]}),(0,U.jsxs)("span",{children:[(0,U.jsx)("i",{className:"key key--future",children:"+"})," proposed future"]}),(0,U.jsxs)("span",{children:[(0,U.jsx)("i",{className:"key key--test",children:"T"})," candidate test \xB7 not run"]}),(0,U.jsxs)("span",{children:[(0,U.jsx)("i",{className:"key key--runtime",children:"\u25CF"})," observed runtime \xB7 width=count \xB7 opacity=age"]}),(0,U.jsx)("button",{className:"legend__action",type:"button",onClick:()=>$&&void M(LT($,ue),"Runtime agent context copied"),children:"Copy runtime agent context"})]})]}),(0,U.jsxs)("aside",{className:"inspector floating-panel","aria-label":"Evidence inspector",hidden:P.kind==="none"||g,children:[(0,U.jsx)(Ju,{title:"Evidence",detail:P.kind,onClose:()=>f(!0)}),(0,U.jsx)(cI,{inspector:P,onOpenRepresentative:(N,j)=>{Wr(N,j)}}),ge.length>0&&Mt&&(0,U.jsx)(uI,{strategies:ge,selected:Mt,onSelect:N=>Vl(N),onCopyAgent:I,onCopyMcp:Z})]})]}),(0,U.jsx)("div",{className:"sr-only","aria-live":"polite",children:yt})]})}function Pl({title:e,count:t,children:n,maxClass:i,defaultOpen:s=!1}){return(0,U.jsxs)("details",{className:"rail__section",open:s||void 0,children:[(0,U.jsxs)("summary",{className:"section-title",children:[(0,U.jsx)("h2",{children:e}),(0,U.jsx)("span",{children:t})]}),(0,U.jsx)("div",{className:"item-list",id:i,children:n})]})}function Xr({title:e,subtitle:t,onClick:n}){return(0,U.jsxs)("button",{type:"button",className:"item",onClick:n,children:[(0,U.jsx)("strong",{children:e}),(0,U.jsx)("small",{children:t})]})}var eI=(0,ot.forwardRef)(function({dimension:t,...n},i){return t==="2d"?(0,U.jsx)(f_,{...n,ref:i}):(0,U.jsx)(nI,{...n,ref:i})}),nI=(0,ot.forwardRef)(function(t,n){let i=(0,ot.useRef)(null),s=(0,ot.useRef)(null),a=(0,ot.useRef)(t),[r,o]=(0,ot.useState)({width:980,height:620});a.current=t,(0,ot.useEffect)(()=>{let d=i.current;if(!d)return;s.current=wT(d,{onNodeSelect:p=>a.current.onNodeSelect(p),onNodeOpen:p=>a.current.onNodeOpen(p),onEdgeSelect:(p,m,b)=>a.current.onEdgeSelect(p,m,b)});let h=new ResizeObserver(()=>{let p=d.parentElement;p&&o({width:Math.max(1,p.clientWidth),height:Math.max(1,p.clientHeight)})});return d.parentElement&&h.observe(d.parentElement),()=>{h.disconnect(),s.current?.dispose(),s.current=null}},[]);let{layout:l,pending:c,error:u}=qu(t.graph,r.width,r.height);return(0,ot.useEffect)(()=>{s.current?.render(t.graph,l||{width:r.width,height:r.height,nodes:[],communities:[]},{selectedId:t.selectedId})},[l,t.graph,r.width,r.height]),(0,ot.useEffect)(()=>{s.current?.setSelected(t.selectedId)},[t.selectedId]),(0,ot.useImperativeHandle)(n,()=>({zoom:d=>s.current?.zoom(d),resetView:()=>s.current?.resetView(),focusNode:d=>s.current?.focusNode(d)}),[]),(0,U.jsxs)(U.Fragment,{children:[(0,U.jsx)("canvas",{ref:i,className:"project-three-canvas","aria-label":"Three-dimensional repository dependency map","aria-busy":c}),(c||u)&&(0,U.jsx)("p",{className:"layout-status",role:"status",children:u||"Arranging repository graph\u2026"})]})});function iI({graph:e,camera:t,selectedNodeId:n,pins:i,onSelectNode:s,onInspectEdge:a,onNodeDrag:r}){let o=(0,ot.useMemo)(()=>Zu(e,{width:980,height:620,pins:i}),[e,i]);return(0,U.jsx)("svg",{id:"graph-svg",viewBox:"0 0 980 620",preserveAspectRatio:"xMidYMid meet",role:"img","aria-label":"Focused code relationship graph",children:(0,U.jsx)(Gy,{graph:e,layout:o,transform:`translate(${t.x} ${t.y}) scale(${t.scale})`,selectedNodeId:n,onSelectNode:s,onInspectEdge:a,onNodeDrag:r})})}function sI({current:e,future:t,camera:n,selectedNodeId:i,pins:s,onSelectNode:a,onInspectEdge:r,onNodeDrag:o}){let l=(0,ot.useMemo)(()=>Zu(e,{width:980,height:620,pins:s}),[e,s]),c=(0,ot.useMemo)(()=>Zu(t,{width:980,height:620,pins:s}),[t,s]);return(0,U.jsx)("svg",{id:"graph-svg",viewBox:"0 0 980 620",preserveAspectRatio:"xMidYMid meet",role:"img","aria-label":"Current and proposed code graphs",children:(0,U.jsxs)("g",{transform:`translate(${n.x} ${n.y}) scale(${n.scale})`,children:[(0,U.jsx)("text",{x:"34",y:"34",className:"comparison-title",children:"CURRENT EVIDENCE"}),(0,U.jsx)("text",{x:"524",y:"34",className:"comparison-title",children:"SELECTED FUTURE"}),(0,U.jsx)(Gy,{graph:e,layout:l,transform:"translate(0 46) scale(.5)",selectedNodeId:i,onSelectNode:a,onInspectEdge:r,onNodeDrag:o}),(0,U.jsx)(Gy,{graph:t,layout:c,transform:"translate(490 46) scale(.5)",selectedNodeId:i,onSelectNode:a,onInspectEdge:r,onNodeDrag:o})]})})}function Gy({graph:e,layout:t,transform:n,selectedNodeId:i,onSelectNode:s,onInspectEdge:a,onNodeDrag:r}){let o=new Map(t.nodes.map(c=>[String(c.node_id),c]));return(0,U.jsxs)("g",{transform:n,children:[[["CALLERS",96,54],["ENTRY POINT",382,54],["CALLEES",668,54],["TESTS \xB7 NOT RUN",382,380]].map(([c,u,d])=>(0,U.jsx)("text",{x:u,y:d,className:"lane-label",children:c},c)),t.containers.map(c=>(0,U.jsxs)(ot.default.Fragment,{children:[(0,U.jsx)("rect",{x:c.x,y:c.y,width:c.width,height:c.height,className:"file-container"}),(0,U.jsx)("text",{x:c.x+10,y:c.y+17,className:"file-label",children:Ol(c.path,46)})]},c.id)),(e.edges||[]).map((c,u)=>{let d=o.get(String(c.source)),h=o.get(String(c.target));return d&&h?(0,U.jsx)(aI,{edge:c,source:d,target:h,onInspect:a},`${c.source}:${c.target}:${c.relation}:${u}`):null}),t.nodes.map(c=>(0,U.jsx)(rI,{node:c,selected:String(i)===String(c.node_id),onSelect:s,onDrag:r},String(c.node_id??c.id)))]})}function aI({edge:e,source:t,target:n,onInspect:i}){let s=t.x+t.width,a=t.y+t.height/2,r=n.x,o=n.y+n.height/2,l=(s+r)/2,c=Ku(e),u=NT(e);return(0,U.jsxs)("g",{"data-graph-interactive":"true",tabIndex:0,role:"button","aria-label":`${t.symbol} ${e.relation} ${n.symbol}, ${e.confidence||"unknown confidence"}`,onClick:()=>i(e,t,n),onKeyDown:d=>{(d.key==="Enter"||d.key===" ")&&(d.preventDefault(),i(e,t,n))},children:[(0,U.jsx)("path",{d:`M ${s} ${a} H ${l} V ${o} H ${r}`,className:c.className,strokeDasharray:u?.dash||c.dash,strokeWidth:u?.width||1.7,opacity:u?.opacity||1}),(0,U.jsx)("text",{x:l+5,y:o-6,className:"edge-label",children:u?.marker||c.marker})]})}function rI({node:e,selected:t,onSelect:n,onDrag:i}){let s=["node",e.lane==="tests"?"node--test":"",e.changed?"node--changed":"",e.status==="hypothetical"?"node--future":"",e.status==="remove"?"node--remove":"",e.pinned?"node--pinned":"",t?"is-selected":""].filter(Boolean).join(" ");return(0,U.jsxs)("g",{"data-graph-interactive":"true",transform:`translate(${e.x} ${e.y})`,className:s,tabIndex:0,role:"button","aria-label":`${e.symbol}, ${e.path}, ${e.lane}`,onClick:()=>n(e),onKeyDown:a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),n(e))},onPointerDown:a=>{a.stopPropagation(),i(a,e)},children:[(0,U.jsx)("rect",{width:e.width,height:e.height}),(0,U.jsx)("circle",{cx:"15",cy:"17",r:"4",className:"node__status"}),(0,U.jsx)("text",{x:"27",y:"21",className:"node__title",children:Ol(e.symbol,27)}),(0,U.jsx)("text",{x:"14",y:"45",className:"node__path",children:Ol(e.path,31)})]})}function oI({projection:e,onSelect:t,onCopy:n}){if(!e)return(0,U.jsx)("div",{className:"mission-panel",children:(0,U.jsx)("p",{className:"quiet",children:"Loading change missions\u2026"})});let i=e.totals;return(0,U.jsxs)("div",{className:"mission-panel","aria-label":"Change mission execution graph",children:[(0,U.jsxs)("div",{className:"mission-panel__header",children:[(0,U.jsxs)("div",{children:[(0,U.jsx)("p",{className:"eyebrow",children:"Deterministic execution DAG"}),(0,U.jsxs)("p",{className:"quiet",children:[i.missions," missions \xB7 ",i.parallel_groups," sequential groups \xB7 ",i.blocked," blocked by coverage gaps"]})]}),(0,U.jsx)("button",{type:"button",className:"mission-copy",onClick:n,children:"Copy agent handoff"})]}),(0,U.jsx)("div",{className:"mission-dag",children:e.groups.map(s=>(0,U.jsxs)("section",{className:"mission-group",children:[(0,U.jsxs)("h2",{children:["Group ",s.index+1]}),(0,U.jsx)("p",{children:s.missions.length>1?`${s.missions.length} missions can run in parallel`:"Run after dependencies"}),s.missions.map(a=>{let r=a.blocked_by_gaps?"blocked \xB7 inspect gaps":a.depends_on?.length?`after ${a.depends_on.length}`:"ready";return(0,U.jsxs)("button",{type:"button",className:`mission-card${a.blocked_by_gaps?" mission-card--blocked":""}`,onClick:()=>t(a),children:[(0,U.jsx)("span",{className:"mission-card__kind",children:a.kind.replaceAll("_"," ")}),(0,U.jsx)("strong",{children:Ol(a.title,38)}),(0,U.jsxs)("small",{children:[a.evidenceCount," evidence \xB7 ",a.testCount," tests"]}),(0,U.jsx)("small",{children:r})]},a.mission_id)})]},s.index))})]})}function lI({snapshot:e,onInspect:t,onError:n}){let i=(0,ot.useRef)(null);return(0,ot.useEffect)(()=>{let s=i.current;if(!s)return;s.theme="dark",s.density="compact",s.columns="commit",s.dateFormat="relative",s.avatars=!1,s.provider=new Hd(Qi);let a=o=>{let c=o.detail.commit,u=(s.data?.refs||[]).filter(d=>d.target===c.oid).map(d=>d.name);t({kind:"commit",facts:[["Commit",c.oid],["Subject",c.message],["Author",c.author?.name],["Authored",c.authoredAt],["Parents",c.parents?.join(", ")||"root"],["Refs",u.join(", ")||"none"]]})},r=o=>n(o.detail?.error?.message||"Git history request failed");return s.addEventListener("gitgraph-commit-select",a),s.addEventListener("gitgraph-error",r),()=>{s.removeEventListener("gitgraph-commit-select",a),s.removeEventListener("gitgraph-error",r)}},[n,t]),(0,ot.useEffect)(()=>{e&&i.current?.refresh?.()},[e]),(0,U.jsx)("div",{className:"git-history-panel",children:ot.default.createElement("web-git-graph",{ref:i,"aria-label":"Git commit history"})})}function cI({inspector:e,onOpenRepresentative:t}){return(0,U.jsxs)("div",{className:"inspector__content",children:[e.facts.length?(0,U.jsx)("dl",{children:e.facts.map(([n,i],s)=>(0,U.jsxs)("div",{className:"fact",children:[(0,U.jsx)("dt",{children:n}),(0,U.jsx)("dd",{children:(0,U.jsx)("code",{children:String(i??"unknown")})})]},`${n}:${s}`))}):(0,U.jsx)("p",{className:"quiet",children:"Select a node or edge to inspect its source identity, resolver and confidence."}),e.representatives?.length?(0,U.jsxs)("div",{className:"project-representatives",children:[(0,U.jsx)("p",{className:"quiet",children:"Representative symbols \xB7 open focused graph"}),e.representatives.map(n=>(0,U.jsx)(Xr,{title:n.symbol,subtitle:Ol(n.path,34),onClick:()=>t(n.symbol,n.path)},String(n.node_id)))]}):null,e.code&&(0,U.jsx)("pre",{className:"code",children:e.code}),e.error&&(0,U.jsx)("p",{className:"error",children:e.error})]})}function uI({strategies:e,selected:t,onSelect:n,onCopyAgent:i,onCopyMcp:s}){let a=t.status==="blocked_by_gaps",r=t.summary||`${(t.counterfactual?.reasons||[]).map(o=>o.replaceAll("_"," ")).join(" \xB7 ")} \xB7 graph ${JSON.stringify(t.predicted_graph||{})}`;return(0,U.jsxs)("section",{className:"strategy-panel",children:[(0,U.jsx)("div",{className:"strategy-tabs",role:"tablist","aria-label":"Refactor strategies",children:e.map(o=>(0,U.jsx)("button",{type:"button",role:"tab","aria-selected":o.strategy_id===t.strategy_id,onClick:()=>n(o),children:o.policy.replaceAll("_"," ")},o.strategy_id))}),(0,U.jsxs)("div",{children:[(0,U.jsx)("p",{className:"strategy-summary",children:r}),(0,U.jsx)("span",{className:`risk${a?" risk--blocked":""}`,children:a?"blocked by gaps":`${t.counterfactual?.score??t.risk} \xB7 hypothetical`})]}),(0,U.jsxs)("div",{className:"copy-actions",children:[(0,U.jsx)("button",{type:"button",onClick:i,children:"Copy agent plan"}),(0,U.jsx)("button",{type:"button",className:"button--quiet",onClick:s,children:"Copy MCP call"})]})]})}function Ns(e){return e instanceof Error?e.message:String(e)}function Ol(e,t){let n=String(e??"");return n.length<=t?n:`${n.slice(0,t-1)}\u2026`}function hI(e,t,n){return Math.max(t,Math.min(n,e))}var XT=document.getElementById("root");if(!XT)throw new Error("CGRX visualizer root is missing");(0,VT.createRoot)(XT).render((0,U.jsx)(tI,{}));
