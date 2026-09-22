var IT=Object.create;var U_=Object.defineProperty;var OT=Object.getOwnPropertyDescriptor;var PT=Object.getOwnPropertyNames;var BT=Object.getPrototypeOf,zT=Object.prototype.hasOwnProperty;var ts=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var FT=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of PT(t))!zT.call(e,s)&&s!==n&&U_(e,s,{get:()=>t[s],enumerable:!(i=OT(t,s))||i.enumerable});return e};var es=(e,t,n)=>(n=e!=null?IT(BT(e)):{},FT(t||!e||!e.__esModule?U_(n,"default",{value:e,enumerable:!0}):n,e));var q_=ts(Ht=>{"use strict";var Zp=Symbol.for("react.transitional.element"),GT=Symbol.for("react.portal"),HT=Symbol.for("react.fragment"),VT=Symbol.for("react.strict_mode"),kT=Symbol.for("react.profiler"),XT=Symbol.for("react.consumer"),WT=Symbol.for("react.context"),qT=Symbol.for("react.forward_ref"),YT=Symbol.for("react.suspense"),ZT=Symbol.for("react.memo"),z_=Symbol.for("react.lazy"),jT=Symbol.for("react.activity"),KT=Symbol.for("react.view_transition"),I_=Symbol.iterator;function JT(e){return e===null||typeof e!="object"?null:(e=I_&&e[I_]||e["@@iterator"],typeof e=="function"?e:null)}var F_={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},G_=Object.assign,H_={};function Qr(e,t,n){this.props=e,this.context=t,this.refs=H_,this.updater=n||F_}Qr.prototype.isReactComponent={};Qr.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};Qr.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function V_(){}V_.prototype=Qr.prototype;function jp(e,t,n){this.props=e,this.context=t,this.refs=H_,this.updater=n||F_}var Kp=jp.prototype=new V_;Kp.constructor=jp;G_(Kp,Qr.prototype);Kp.isPureReactComponent=!0;var O_=Array.isArray;function Yp(){}var Ue={H:null,A:null,T:null,S:null},k_=Object.prototype.hasOwnProperty;function Jp(e,t,n){var i=n.ref;return{$$typeof:Zp,type:e,key:t,ref:i!==void 0?i:null,props:n}}function QT(e,t){return Jp(e.type,t,e.props)}function Qp(e){return typeof e=="object"&&e!==null&&e.$$typeof===Zp}function $T(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var P_=/\/+/g;function qp(e,t){return typeof e=="object"&&e!==null&&e.key!=null?$T(""+e.key):t.toString(36)}function tw(e){switch(e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:switch(typeof e.status=="string"?e.then(Yp,Yp):(e.status="pending",e.then(function(t){e.status==="pending"&&(e.status="fulfilled",e.value=t)},function(t){e.status==="pending"&&(e.status="rejected",e.reason=t)})),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason}}throw e}function Jr(e,t,n,i,s){var a=typeof e;(a==="undefined"||a==="boolean")&&(e=null);var r=!1;if(e===null)r=!0;else switch(a){case"bigint":case"string":case"number":r=!0;break;case"object":switch(e.$$typeof){case Zp:case GT:r=!0;break;case z_:return r=e._init,Jr(r(e._payload),t,n,i,s)}}if(r)return s=s(e),r=i===""?"."+qp(e,0):i,O_(s)?(n="",r!=null&&(n=r.replace(P_,"$&/")+"/"),Jr(s,t,n,"",function(c){return c})):s!=null&&(Qp(s)&&(s=QT(s,n+(s.key==null||e&&e.key===s.key?"":(""+s.key).replace(P_,"$&/")+"/")+r)),t.push(s)),1;r=0;var o=i===""?".":i+":";if(O_(e))for(var l=0;l<e.length;l++)i=e[l],a=o+qp(i,l),r+=Jr(i,t,n,a,s);else if(l=JT(e),typeof l=="function")for(e=l.call(e),l=0;!(i=e.next()).done;)i=i.value,a=o+qp(i,l++),r+=Jr(i,t,n,a,s);else if(a==="object"){if(typeof e.then=="function")return Jr(tw(e),t,n,i,s);throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.")}return r}function ku(e,t,n){if(e==null)return e;var i=[],s=0;return Jr(e,i,"","",function(a){return t.call(n,a,s++)}),i}function ew(e){if(e._status===-1){var t=e._result,n=t();n.then(function(i){(e._status===0||e._status===-1)&&(e._status=1,e._result=i,n.status===void 0&&(n.status="fulfilled",n.value=i))},function(i){(e._status===0||e._status===-1)&&(e._status=2,e._result=i,n.status===void 0&&(n.status="rejected",n.reason=i))}),e._status===-1&&(e._status=0,e._result=n)}if(e._status===1)return e._result.default;throw e._result}var B_=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function X_(e){var t=Ue.T,n={};n.types=t!==null?t.types:null,Ue.T=n;try{var i=e(),s=Ue.S;s!==null&&s(n,i),typeof i=="object"&&i!==null&&typeof i.then=="function"&&i.then(Yp,B_)}catch(a){B_(a)}finally{t!==null&&n.types!==null&&(t.types=n.types),Ue.T=t}}function W_(e){var t=Ue.T;if(t!==null){var n=t.types;n===null?t.types=[e]:n.indexOf(e)===-1&&n.push(e)}else X_(W_.bind(null,e))}var nw={map:ku,forEach:function(e,t,n){ku(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return ku(e,function(){t++}),t},toArray:function(e){return ku(e,function(t){return t})||[]},only:function(e){if(!Qp(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};Ht.Activity=jT;Ht.Children=nw;Ht.Component=Qr;Ht.Fragment=HT;Ht.Profiler=kT;Ht.PureComponent=jp;Ht.StrictMode=VT;Ht.Suspense=YT;Ht.ViewTransition=KT;Ht.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=Ue;Ht.__COMPILER_RUNTIME={__proto__:null,c:function(e){return Ue.H.useMemoCache(e)}};Ht.addTransitionType=W_;Ht.cache=function(e){return function(){return e.apply(null,arguments)}};Ht.cacheSignal=function(){return null};Ht.cloneElement=function(e,t,n){if(e==null)throw Error("The argument must be a React element, but you passed "+e+".");var i=G_({},e.props),s=e.key;if(t!=null)for(a in t.key!==void 0&&(s=""+t.key),t)!k_.call(t,a)||a==="key"||a==="__self"||a==="__source"||a==="ref"&&t.ref===void 0||(i[a]=t[a]);var a=arguments.length-2;if(a===1)i.children=n;else if(1<a){for(var r=Array(a),o=0;o<a;o++)r[o]=arguments[o+2];i.children=r}return Jp(e.type,s,i)};Ht.createContext=function(e){return e={$$typeof:WT,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:XT,_context:e},e};Ht.createElement=function(e,t,n){var i,s={},a=null;if(t!=null)for(i in t.key!==void 0&&(a=""+t.key),t)k_.call(t,i)&&i!=="key"&&i!=="__self"&&i!=="__source"&&(s[i]=t[i]);var r=arguments.length-2;if(r===1)s.children=n;else if(1<r){for(var o=Array(r),l=0;l<r;l++)o[l]=arguments[l+2];s.children=o}if(e&&e.defaultProps)for(i in r=e.defaultProps,r)s[i]===void 0&&(s[i]=r[i]);return Jp(e,a,s)};Ht.createRef=function(){return{current:null}};Ht.forwardRef=function(e){return{$$typeof:qT,render:e}};Ht.isValidElement=Qp;Ht.lazy=function(e){return{$$typeof:z_,_payload:{_status:-1,_result:e},_init:ew}};Ht.memo=function(e,t){return{$$typeof:ZT,type:e,compare:t===void 0?null:t}};Ht.startTransition=X_;Ht.unstable_useCacheRefresh=function(){return Ue.H.useCacheRefresh()};Ht.use=function(e){return Ue.H.use(e)};Ht.useActionState=function(e,t,n){return Ue.H.useActionState(e,t,n)};Ht.useCallback=function(e,t){return Ue.H.useCallback(e,t)};Ht.useContext=function(e){return Ue.H.useContext(e)};Ht.useDebugValue=function(){};Ht.useDeferredValue=function(e,t){return Ue.H.useDeferredValue(e,t)};Ht.useEffect=function(e,t){return Ue.H.useEffect(e,t)};Ht.useEffectEvent=function(e){return Ue.H.useEffectEvent(e)};Ht.useId=function(){return Ue.H.useId()};Ht.useImperativeHandle=function(e,t,n){return Ue.H.useImperativeHandle(e,t,n)};Ht.useInsertionEffect=function(e,t){return Ue.H.useInsertionEffect(e,t)};Ht.useLayoutEffect=function(e,t){return Ue.H.useLayoutEffect(e,t)};Ht.useMemo=function(e,t){return Ue.H.useMemo(e,t)};Ht.useOptimistic=function(e,t){return Ue.H.useOptimistic(e,t)};Ht.useReducer=function(e,t,n){return Ue.H.useReducer(e,t,n)};Ht.useRef=function(e){return Ue.H.useRef(e)};Ht.useState=function(e){return Ue.H.useState(e)};Ht.useSyncExternalStore=function(e,t,n){return Ue.H.useSyncExternalStore(e,t,n)};Ht.useTransition=function(){return Ue.H.useTransition()};Ht.version="19.3.0"});var $r=ts((tI,Y_)=>{"use strict";Y_.exports=q_()});var ty=ts(qu=>{"use strict";var uw=Symbol.for("react.transitional.element"),hw=Symbol.for("react.fragment");function $_(e,t,n){var i=null;if(n!==void 0&&(i=""+n),t.key!==void 0&&(i=""+t.key),"key"in t){n={};for(var s in t)s!=="key"&&(n[s]=t[s])}else n=t;return t=n.ref,{$$typeof:uw,type:e,key:i,ref:t!==void 0?t:null,props:n}}qu.Fragment=hw;qu.jsx=$_;qu.jsxs=$_});var cr=ts((sI,ey)=>{"use strict";ey.exports=ty()});var py=ts(Ge=>{"use strict";function sm(e,t){var n=e.length;e.push(t);t:for(;0<n;){var i=n-1>>>1,s=e[i];if(0<Zu(s,t))e[i]=t,e[n]=s,n=i;else break t}}function ns(e){return e.length===0?null:e[0]}function Ku(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;t:for(var i=0,s=e.length,a=s>>>1;i<a;){var r=2*(i+1)-1,o=e[r],l=r+1,c=e[l];if(0>Zu(o,n))l<s&&0>Zu(c,o)?(e[i]=c,e[l]=n,i=l):(e[i]=o,e[r]=n,i=r);else if(l<s&&0>Zu(c,n))e[i]=c,e[l]=n,i=l;else break t}}return t}function Zu(e,t){var n=e.sortIndex-t.sortIndex;return n!==0?n:e.id-t.id}Ge.unstable_now=void 0;typeof performance=="object"&&typeof performance.now=="function"?(ay=performance,Ge.unstable_now=function(){return ay.now()}):(em=Date,ry=em.now(),Ge.unstable_now=function(){return em.now()-ry});var ay,em,ry,Ns=[],la=[],dw=1,Ti=null,Cn=3,am=!1,Gl=!1,Hl=!1,rm=!1,cy=typeof setTimeout=="function"?setTimeout:null,uy=typeof clearTimeout=="function"?clearTimeout:null,oy=typeof setImmediate<"u"?setImmediate:null;function ju(e){for(var t=ns(la);t!==null;){if(t.callback===null)Ku(la);else if(t.startTime<=e)Ku(la),t.sortIndex=t.expirationTime,sm(Ns,t);else break;t=ns(la)}}function om(e){if(Hl=!1,ju(e),!Gl)if(ns(Ns)!==null)Gl=!0,eo||(eo=!0,to());else{var t=ns(la);t!==null&&lm(om,t.startTime-e)}}var eo=!1,Vl=-1,hy=5,dy=-1;function fy(){return rm?!0:!(Ge.unstable_now()-dy<hy)}function nm(){if(rm=!1,eo){var e=Ge.unstable_now();dy=e;var t=!0;try{t:{Gl=!1,Hl&&(Hl=!1,uy(Vl),Vl=-1),am=!0;var n=Cn;try{e:{for(ju(e),Ti=ns(Ns);Ti!==null&&!(Ti.expirationTime>e&&fy());){var i=Ti.callback;if(typeof i=="function"){Ti.callback=null,Cn=Ti.priorityLevel;var s=i(Ti.expirationTime<=e);if(e=Ge.unstable_now(),typeof s=="function"){Ti.callback=s,ju(e),t=!0;break e}Ti===ns(Ns)&&Ku(Ns),ju(e)}else Ku(Ns);Ti=ns(Ns)}if(Ti!==null)t=!0;else{var a=ns(la);a!==null&&lm(om,a.startTime-e),t=!1}}break t}finally{Ti=null,Cn=n,am=!1}t=void 0}}finally{t?to():eo=!1}}}var to;typeof oy=="function"?to=function(){oy(nm)}:typeof MessageChannel<"u"?(im=new MessageChannel,ly=im.port2,im.port1.onmessage=nm,to=function(){ly.postMessage(null)}):to=function(){cy(nm,0)};var im,ly;function lm(e,t){Vl=cy(function(){e(Ge.unstable_now())},t)}Ge.unstable_IdlePriority=5;Ge.unstable_ImmediatePriority=1;Ge.unstable_LowPriority=4;Ge.unstable_NormalPriority=3;Ge.unstable_Profiling=null;Ge.unstable_UserBlockingPriority=2;Ge.unstable_cancelCallback=function(e){e.callback=null};Ge.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):hy=0<e?Math.floor(1e3/e):5};Ge.unstable_getCurrentPriorityLevel=function(){return Cn};Ge.unstable_next=function(e){switch(Cn){case 1:case 2:case 3:var t=3;break;default:t=Cn}var n=Cn;Cn=t;try{return e()}finally{Cn=n}};Ge.unstable_requestPaint=function(){rm=!0};Ge.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=Cn;Cn=e;try{return t()}finally{Cn=n}};Ge.unstable_scheduleCallback=function(e,t,n){var i=Ge.unstable_now();switch(typeof n=="object"&&n!==null?(n=n.delay,n=typeof n=="number"&&0<n?i+n:i):n=i,e){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=n+s,e={id:dw++,callback:t,priorityLevel:e,startTime:n,expirationTime:s,sortIndex:-1},n>i?(e.sortIndex=n,sm(la,e),ns(Ns)===null&&e===ns(la)&&(Hl?(uy(Vl),Vl=-1):Hl=!0,lm(om,n-i))):(e.sortIndex=s,sm(Ns,e),Gl||am||(Gl=!0,eo||(eo=!0,to()))),e};Ge.unstable_shouldYield=fy;Ge.unstable_wrapCallback=function(e){var t=Cn;return function(){var n=Cn;Cn=t;try{return e.apply(this,arguments)}finally{Cn=n}}}});var gy=ts((pI,my)=>{"use strict";my.exports=py()});var yy=ts(Rn=>{"use strict";var fw=$r();function _y(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function ca(){}var zn={d:{f:ca,r:function(){throw Error(_y(522))},D:ca,C:ca,L:ca,m:ca,X:ca,S:ca,M:ca},p:0,findDOMNode:null},pw=Symbol.for("react.portal"),mw=Symbol.for("react.recoverable"),vy=Symbol.for("react.optimistic_key");function gw(e,t,n){var i=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:pw,key:i==null?null:i===vy?vy:""+i,children:e,containerInfo:t,implementation:n}}var kl=fw.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function Ju(e,t){if(e==="font")return"";if(typeof t=="string")return t==="use-credentials"?t:""}Rn.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=zn;Rn.browser=function(e){return{$$typeof:mw,_reason:e}};Rn.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(_y(299));return gw(e,t,null,n)};Rn.flushSync=function(e){var t=kl.T,n=zn.p;try{if(kl.T=null,zn.p=2,e)return e()}finally{kl.T=t,zn.p=n,zn.d.f()}};Rn.preconnect=function(e,t){typeof e=="string"&&(t?(t=t.crossOrigin,t=typeof t=="string"?t==="use-credentials"?t:"":void 0):t=null,zn.d.C(e,t))};Rn.prefetchDNS=function(e){typeof e=="string"&&zn.d.D(e)};Rn.preinit=function(e,t){if(typeof e=="string"&&t&&typeof t.as=="string"){var n=t.as,i=Ju(n,t.crossOrigin),s=typeof t.integrity=="string"?t.integrity:void 0,a=typeof t.fetchPriority=="string"?t.fetchPriority:void 0;n==="style"?zn.d.S(e,typeof t.precedence=="string"?t.precedence:void 0,{crossOrigin:i,integrity:s,fetchPriority:a}):n==="script"&&zn.d.X(e,{crossOrigin:i,integrity:s,fetchPriority:a,nonce:typeof t.nonce=="string"?t.nonce:void 0})}};Rn.preinitModule=function(e,t){if(typeof e=="string")if(typeof t=="object"&&t!==null){if(t.as==null||t.as==="script"){var n=Ju(t.as,t.crossOrigin);zn.d.M(e,{crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0})}}else t==null&&zn.d.M(e)};Rn.preload=function(e,t){if(typeof e=="string"&&typeof t=="object"&&t!==null&&typeof t.as=="string"){var n=t.as,i=Ju(n,t.crossOrigin);zn.d.L(e,n,{crossOrigin:i,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,type:typeof t.type=="string"?t.type:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy=="string"?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet=="string"?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes=="string"?t.imageSizes:void 0,media:typeof t.media=="string"?t.media:void 0})}};Rn.preloadModule=function(e,t){if(typeof e=="string")if(t){var n=Ju(t.as,t.crossOrigin);zn.d.m(e,{as:typeof t.as=="string"&&t.as!=="script"?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0})}else zn.d.m(e)};Rn.requestFormReset=function(e){zn.d.r(e)};Rn.unstable_batchedUpdates=function(e,t){return e(t)};Rn.useFormState=function(e,t,n){return kl.H.useFormState(e,t,n)};Rn.useFormStatus=function(){return kl.H.useHostTransitionStatus()};Rn.version="19.3.0"});var by=ts((gI,Sy)=>{"use strict";function xy(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(xy)}catch(e){console.error(e)}}xy(),Sy.exports=yy()});var l1=ts(Ld=>{"use strict";var on=gy(),oS=$r(),vw=by();function et(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function lS(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function Nc(e){for(var t=e,n=t;n&&!n.alternate;)t=n,(t.flags&4098)!==0&&(e=t.return),n=t.return;for(;t.return;)t=t.return;return t.tag===3?e:null}function cS(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function uS(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function My(e){if(Nc(e)!==e)throw Error(et(188))}function _w(e){var t=e.alternate;if(!t){if(t=Nc(e),t===null)throw Error(et(188));return t!==e?null:e}for(var n=e,i=t;;){var s=n.return;if(s===null)break;var a=s.alternate;if(a===null){if(i=s.return,i!==null){n=i;continue}break}if(s.child===a.child){for(a=s.child;a;){if(a===n)return My(s),e;if(a===i)return My(s),t;a=a.sibling}throw Error(et(188))}if(n.return!==i.return)n=s,i=a;else{for(var r=!1,o=s.child;o;){if(o===n){r=!0,n=s,i=a;break}if(o===i){r=!0,i=s,n=a;break}o=o.sibling}if(!r){for(o=a.child;o;){if(o===n){r=!0,n=a,i=s;break}if(o===i){r=!0,i=a,n=s;break}o=o.sibling}if(!r)throw Error(et(189))}}if(n.alternate!==i)throw Error(et(190))}if(n.tag!==3)throw Error(et(188));return n.stateNode.current===n?e:t}function hS(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=hS(e),t!==null)return t;e=e.sibling}return null}function ti(e,t,n,i,s,a){for(;e!==null;){if((e.tag===5||e.tag===27||e.tag===6)&&n(e,i,s,a)||(e.tag!==22||e.memoizedState===null)&&(t||e.tag!==5&&e.tag!==27)&&ti(e.child,t,n,i,s,a))return!0;e=e.sibling}return!1}function Nr(e){for(e=e.return;e!==null;){if(e.tag===3||e.tag===5||e.tag===27)return e;e=e.return}return null}function Ey(e){var t=!1;for(e=e.return;e!==null&&(e.tag===4&&(t=!0),!(e.tag===3||e.tag===5||e.tag===27));)e=e.return;return t}function dS(e){var t=[null,null],n=Nr(e);return n===null||fS(t,e,n.child,{foundSelf:!1}),t}function fS(e,t,n,i){for(;n!==null;){if(n===t)i.foundSelf=!0;else if(n.tag===5||n.tag===27||n.tag===6){if(i.foundSelf)return e[1]=n,!0;e[0]=n}else if((n.tag!==22||n.memoizedState===null)&&fS(e,t,n.child,i))return!0;n=n.sibling}return!1}function rn(e){switch(e.tag){case 5:case 27:case 6:return e.stateNode;case 3:return e.stateNode.containerInfo;default:throw Error(et(559))}}var lo=null,Gm=null;function yw(e,t,n){return e===n?!0:e===t?(lo=e,!0):!1}function xw(e,t,n){return e===n?(Gm=e,!1):e===t?(Gm!==null&&(lo=e),!0):!1}function Ty(e){if(e===null)return null;do e=e===null?null:e.return;while(e&&e.tag!==5&&e.tag!==27&&e.tag!==3);return e||null}function Hm(e,t,n){for(var i=0,s=e;s;s=n(s))i++;s=0;for(var a=t;a;a=n(a))s++;for(;0<i-s;)e=n(e),i--;for(;0<s-i;)t=n(t),s--;for(;i--;){if(e===t||t!==null&&e===t.alternate)return e;e=n(e),t=n(t)}return null}var De=Object.assign,Sw=Symbol.for("react.element"),Qu=Symbol.for("react.transitional.element"),Kl=Symbol.for("react.portal"),co=Symbol.for("react.fragment"),pS=Symbol.for("react.strict_mode"),Vm=Symbol.for("react.profiler"),mS=Symbol.for("react.consumer"),ls=Symbol.for("react.context"),Jg=Symbol.for("react.forward_ref"),km=Symbol.for("react.suspense"),Xm=Symbol.for("react.suspense_list"),Qg=Symbol.for("react.memo"),fa=Symbol.for("react.lazy");Symbol.for("react.scope");var Wm=Symbol.for("react.activity"),bw=Symbol.for("react.legacy_hidden");Symbol.for("react.tracing_marker");var Mw=Symbol.for("react.memo_cache_sentinel"),qm=Symbol.for("react.view_transition"),Ew=Symbol.for("react.recoverable"),wy=Symbol.iterator;function Xl(e){return e===null||typeof e!="object"?null:(e=wy&&e[wy]||e["@@iterator"],typeof e=="function"?e:null)}var Tw=Symbol.for("react.client.reference");function Ym(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===Tw?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case co:return"Fragment";case Vm:return"Profiler";case pS:return"StrictMode";case km:return"Suspense";case Xm:return"SuspenseList";case Wm:return"Activity";case qm:return"ViewTransition"}if(typeof e=="object")switch(e.$$typeof){case Kl:return"Portal";case ls:return e.displayName||"Context";case mS:return(e._context.displayName||"Context")+".Consumer";case Jg:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Qg:return t=e.displayName||null,t!==null?t:Ym(e.type)||"Memo";case fa:t=e._payload,e=e._init;try{return Ym(e(t))}catch{}}return null}var Jl=Array.isArray,Bt=oS.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,fe=vw.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,vr={pending:!1,data:null,method:null,action:null},Zm=[],uo=-1;function ms(e){return{current:e}}function Sn(e){0>uo||(e.current=Zm[uo],Zm[uo]=null,uo--)}function Pe(e,t){uo++,Zm[uo]=e.current,e.current=t}var ds=ms(null),pc=ms(null),ba=ms(null),zh=ms(null);function Fh(e,t){switch(Pe(ba,t),Pe(pc,e),Pe(ds,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?Gx(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=Gx(t),e=BM(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}Sn(ds),Pe(ds,e)}function Do(){Sn(ds),Sn(pc),Sn(ba)}function jm(e){var t=e.memoizedState;t!==null&&(Ho._currentValue=t.memoizedState,Pe(zh,e)),t=ds.current;var n=BM(t,e.type);t!==n&&(Pe(pc,e),Pe(ds,n))}function Gh(e){pc.current===e&&(Sn(ds),Sn(pc)),zh.current===e&&(Sn(zh),Ho._currentValue=vr)}var cm,Ay;function ha(e){if(cm===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);cm=t&&t[1]||"",Ay=-1<n.stack.indexOf(`
    at`)?" (<anonymous>)":-1<n.stack.indexOf("@")?"@unknown:0:0":""}return`
`+cm+e+Ay}var um=!1;function hm(e,t){if(!e||um)return"";um=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var i={DetermineComponentFrameRoot:function(){try{if(t){var f=function(){throw Error()};if(Object.defineProperty(f.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(f,[])}catch(m){var u=m}Reflect.construct(e,[],f)}else{try{f.call()}catch(m){u=m}f=!1;try{var p=Object.getOwnPropertyDescriptor(e.prototype,"props");Object.defineProperty(e.prototype,"props",{configurable:!0,set:function(){throw Error()}}),f=!0,new e}finally{f&&(p!==void 0?Object.defineProperty(e.prototype,"props",p):delete e.prototype.props)}}}else{try{throw Error()}catch(m){u=m}(f=e())&&typeof f.catch=="function"&&f.catch(function(){})}}catch(m){if(m&&u&&typeof m.stack=="string")return[m.stack,u.stack]}return[null,null]}};i.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var s=Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot,"name");s&&s.configurable&&Object.defineProperty(i.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var a=i.DetermineComponentFrameRoot(),r=a[0],o=a[1];if(r&&o){var l=r.split(`
`),c=o.split(`
`);for(s=i=0;i<l.length&&!l[i].includes("DetermineComponentFrameRoot");)i++;for(;s<c.length&&!c[s].includes("DetermineComponentFrameRoot");)s++;if(i===l.length||s===c.length)for(i=l.length-1,s=c.length-1;1<=i&&0<=s&&l[i]!==c[s];)s--;for(;1<=i&&0<=s;i--,s--)if(l[i]!==c[s]){if(i!==1||s!==1)do if(i--,s--,0>s||l[i]!==c[s]){var h=`
`+l[i].replace(" at new "," at ");return e.displayName&&h.includes("<anonymous>")&&(h=h.replace("<anonymous>",e.displayName)),h}while(1<=i&&0<=s);break}}}finally{um=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:"")?ha(n):""}function ww(e,t){switch(e.tag){case 26:case 27:case 5:return ha(e.type);case 16:return ha("Lazy");case 13:return e.child!==t&&t!==null?ha("Suspense Fallback"):ha("Suspense");case 19:return ha("SuspenseList");case 0:case 15:return hm(e.type,!1);case 11:return hm(e.type.render,!1);case 1:return hm(e.type,!0);case 31:return ha("Activity");case 30:return ha("ViewTransition");default:return""}}function Cy(e){try{var t="",n=null;do t+=ww(e,n),n=e,e=e.return;while(e);return t}catch(i){return`
Error generating stack: `+i.message+`
`+i.stack}}var Km=Object.prototype.hasOwnProperty,$g=on.unstable_scheduleCallback,dm=on.unstable_cancelCallback,Aw=on.unstable_shouldYield,Cw=on.unstable_requestPaint,ui=on.unstable_now,Rw=on.unstable_getCurrentPriorityLevel,gS=on.unstable_ImmediatePriority,vS=on.unstable_UserBlockingPriority,Hh=on.unstable_NormalPriority,Nw=on.unstable_LowPriority,_S=on.unstable_IdlePriority,Dw=on.log,Lw=on.unstable_setDisableYieldValue,Dc=null,hi=null;function ga(e){if(typeof Dw=="function"&&Lw(e),hi&&typeof hi.setStrictMode=="function")try{hi.setStrictMode(Dc,e)}catch{}}var di=Math.clz32?Math.clz32:Ow,Uw=Math.log,Iw=Math.LN2;function Ow(e){return e>>>=0,e===0?32:31-(Uw(e)/Iw|0)|0}var $u=256,th=262144,eh=4194304;function dr(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&-e;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function fd(e,t,n){var i=e.pendingLanes;if(i===0)return 0;var s=0,a=e.suspendedLanes,r=e.pingedLanes;e=e.warmLanes;var o=i&134217727;return o!==0?(i=o&~a,i!==0?s=dr(i):(r&=o,r!==0?s=dr(r):n||(n=o&~e,n!==0&&(s=dr(n))))):(o=i&~a,o!==0?s=dr(o):r!==0?s=dr(r):n||(n=i&~e,n!==0&&(s=dr(n)))),s===0?0:t!==0&&t!==s&&(t&a)===0&&(a=s&-s,n=t&-t,a>=n||a===32&&(n&4194048)!==0)?t:s}function Lc(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function yS(e,t){(t&8)!==0&&(t|=t&32);var n=e.entangledLanes;if(n!==0)for(e=e.entanglements,n&=t;0<n;){var i=31-di(n),s=1<<i;t|=e[i],n&=~s}return t}function Pw(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function xS(){var e=eh;return eh<<=1,(eh&62914560)===0&&(eh=4194304),e}function fm(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function Uc(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function Bw(e,t,n,i,s,a){var r=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var o=e.entanglements,l=e.expirationTimes,c=e.hiddenUpdates;for(n=r&~n;0<n;){var h=31-di(n),f=1<<h;o[h]=0,l[h]=-1;var u=c[h];if(u!==null)for(c[h]=null,h=0;h<u.length;h++){var p=u[h];p!==null&&(p.lane&=-536870913)}n&=~f}i!==0&&SS(e,i,0),a!==0&&s===0&&e.tag!==0&&(e.suspendedLanes|=a&~(r&~t))}function SS(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var i=31-di(t);e.entangledLanes|=t,e.entanglements[i]=e.entanglements[i]|1073741824|n&261930}function bS(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var i=31-di(n),s=1<<i;s&t|e[i]&t&&(e[i]|=t),n&=~s}}function MS(e,t){var n=t&-t;return n=(n&42)!==0?1:t0(n),(n&(e.suspendedLanes|t))!==0?0:n}function t0(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function e0(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function ES(){var e=fe.p;return e!==0?e:(e=window.event,e===void 0?32:a1(e.type))}function Ry(e,t){var n=fe.p;try{return fe.p=e,t()}finally{fe.p=n}}var ks=Math.random().toString(36).slice(2),yn="__reactFiber$"+ks,ei="__reactProps$"+ks,Xo="__reactContainer$"+ks,Ny="__reactEvents$"+ks,zw="__reactListeners$"+ks,Fw="__reactHandles$"+ks,Dy="__reactResources$"+ks,Ic="__reactMarker$"+ks,Vh="__reactLoad$"+ks;function pd(e){delete e[yn],delete e[ei],delete e[zw],delete e[Fw]}function mr(e){var t;if(t=e[yn])return t;for(var n=e.parentNode;n;){if(t=n[Xo]||n[yn]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Zx(e);e!==null;){if(n=e[yn])return n;e=Zx(e)}return t}e=n,n=e.parentNode}return null}function Wo(e){if(e=e[yn]||e[Xo]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function Ql(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(et(33))}function So(e){var t=e[Dy];return t||(t=e[Dy]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function fn(e){e[Ic]=!0}function TS(e){e[Vh]=void 0}var wS=new Set,AS={};function Dr(e,t){Lo(e,t),Lo(e+"Capture",t)}function Lo(e,t){for(AS[e]=t,e=0;e<t.length;e++)wS.add(t[e])}var Gw=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),Ly={},Uy={};function Hw(e){return Km.call(Uy,e)?!0:Km.call(Ly,e)?!1:Gw.test(e)?Uy[e]=!0:(Ly[e]=!0,!1)}var ue=!1;function Iy(){var e=ue;return ue=!1,e}function yh(e,t,n){if(Hw(t))if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var i=t.toLowerCase().slice(0,5);if(i!=="data-"&&i!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,n)}}function nh(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,n)}}function Ds(e,t,n,i){if(i===null)e.removeAttribute(n);else{switch(typeof i){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(n);return}e.setAttributeNS(t,n,i)}}function ri(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function CS(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function Vw(e,t,n){var i=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof i<"u"&&typeof i.get=="function"&&typeof i.set=="function"){var s=i.get,a=i.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return s.call(this)},set:function(r){n=""+r,a.call(this,r)}}),Object.defineProperty(e,t,{enumerable:i.enumerable}),{getValue:function(){return n},setValue:function(r){n=""+r},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Jm(e){if(!e._valueTracker){var t=CS(e)?"checked":"value";e._valueTracker=Vw(e,t,""+e[t])}}function RS(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),i="";return e&&(i=CS(e)?e.checked?"true":"false":e.value),e=i,e!==n?(t.setValue(e),!0):!1}var kw=/[\n"\\]/g;function Ni(e){return e.replace(kw,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function Qm(e,t,n,i,s,a,r,o){e.name="",r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"?e.type=r:e.removeAttribute("type"),t!=null?r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+ri(t)):e.value!==""+ri(t)&&(e.value=""+ri(t)):r!=="submit"&&r!=="reset"||e.removeAttribute("value"),t!=null?r==="number"&&e.value==t?pm(e,ri(e.value)):pm(e,ri(t)):n!=null?pm(e,ri(n)):i!=null&&e.removeAttribute("value"),s==null&&a!=null&&(e.defaultChecked=!!a),s!=null&&(e.checked=s&&typeof s!="function"&&typeof s!="symbol"),o!=null&&typeof o!="function"&&typeof o!="symbol"&&typeof o!="boolean"?e.name=""+ri(o):e.removeAttribute("name")}function NS(e,t,n,i,s,a,r,o){if(a!=null&&typeof a!="function"&&typeof a!="symbol"&&typeof a!="boolean"&&(e.type=a),t!=null||n!=null){if(!(a!=="submit"&&a!=="reset"||t!=null)){Jm(e);return}n=n!=null?""+ri(n):"",t=t!=null?""+ri(t):n,o||t===e.value||(e.value=t),e.defaultValue=t}i=i??s,i=typeof i!="function"&&typeof i!="symbol"&&!!i,e.checked=o?e.checked:!!i,e.defaultChecked=!!i,r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"&&(e.name=r),Jm(e)}function pm(e,t){e.defaultValue!==""+t&&(e.defaultValue=""+t)}function bo(e,t,n,i){if(e=e.options,t){t={};for(var s=0;s<n.length;s++)t["$"+n[s]]=!0;for(n=0;n<e.length;n++)s=t.hasOwnProperty("$"+e[n].value),e[n].selected!==s&&(e[n].selected=s),s&&i&&(e[n].defaultSelected=!0)}else{for(n=""+ri(n),t=null,s=0;s<e.length;s++){if(e[s].value===n){e[s].selected=!0,i&&(e[s].defaultSelected=!0);return}t!==null||e[s].disabled||(t=e[s])}t!==null&&(t.selected=!0)}}function DS(e,t,n){if(t!=null&&(t=""+ri(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n!=null?""+ri(n):""}function LS(e,t,n,i){if(t==null){if(i!=null){if(n!=null)throw Error(et(92));if(Jl(i)){if(1<i.length)throw Error(et(93));i=i[0]}n=i}n==null&&(n=""),t=n}n=ri(t),e.defaultValue=n,i=e.textContent,i===n&&i!==""&&i!==null&&(e.value=i),Jm(e)}function Uo(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var Xw=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function Oy(e,t,n){var i=t.indexOf("--")===0;n==null||typeof n=="boolean"||n===""?i?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":i?e.setProperty(t,n):typeof n!="number"||n===0||Xw.has(t)?t==="float"?e.cssFloat=n:e[t]=(""+n).trim():e[t]=n+"px"}function US(e,t,n){if(t!=null&&typeof t!="object")throw Error(et(62));if(e=e.style,n!=null){for(var i in n)!n.hasOwnProperty(i)||t!=null&&t.hasOwnProperty(i)||(i.indexOf("--")===0?e.setProperty(i,""):i==="float"?e.cssFloat="":e[i]="",ue=!0);for(var s in t)i=t[s],t.hasOwnProperty(s)&&n[s]!==i&&(Oy(e,s,i),ue=!0)}else for(var a in t)t.hasOwnProperty(a)&&Oy(e,a,t[a])}function n0(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var Ww=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),qw=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function xh(e){return qw.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function cs(){}var $m=null;function i0(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var ho=null,Mo=null;function Py(e){var t=Wo(e);if(t&&(e=t.stateNode)){var n=e[ei]||null;t:switch(e=t.stateNode,t.type){case"input":if(Qm(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll('input[name="'+Ni(""+t)+'"][type="radio"]'),t=0;t<n.length;t++){var i=n[t];if(i!==e&&i.form===e.form){var s=i[ei]||null;if(!s)throw Error(et(90));Qm(i,s.value,s.defaultValue,s.defaultValue,s.checked,s.defaultChecked,s.type,s.name)}}for(t=0;t<n.length;t++)i=n[t],i.form===e.form&&RS(i)}break t;case"textarea":DS(e,n.value,n.defaultValue);break t;case"select":t=n.value,t!=null&&bo(e,!!n.multiple,t,!1)}}}var mm=!1;function IS(e,t,n){if(mm)return e(t,n);mm=!0;try{var i=e(t);return i}finally{if(mm=!1,(ho!==null||Mo!==null)&&(Cd(),ho&&(t=ho,e=Mo,Mo=ho=null,Py(t),e)))for(t=0;t<e.length;t++)Py(e[t])}}function mc(e,t){var n=e.stateNode;if(n===null)return null;var i=n[ei]||null;if(i===null)return null;n=i[t];t:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(e=e.type,i=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!i;break t;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(et(231,t,typeof n));return n}var Bs=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),tg=!1;if(Bs)try{no={},Object.defineProperty(no,"passive",{get:function(){tg=!0}}),window.addEventListener("test",no,no),window.removeEventListener("test",no,no)}catch{tg=!1}var no,va=null,s0=null,Sh=null;function OS(){if(Sh)return Sh;var e,t=s0,n=t.length,i,s="value"in va?va.value:va.textContent,a=s.length;for(e=0;e<n&&t[e]===s[e];e++);var r=n-e;for(i=1;i<=r&&t[n-i]===s[a-i];i++);return Sh=s.slice(e,1<i?1-i:void 0)}function bh(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function ih(){return!0}function By(){return!1}function Vn(e){function t(n,i,s,a,r){this._reactName=n,this._targetInst=s,this.type=i,this.nativeEvent=a,this.target=r,this.currentTarget=null;for(var o in e)e.hasOwnProperty(o)&&(n=e[o],this[o]=n?n(a):a[o]);return this.isDefaultPrevented=(a.defaultPrevented!=null?a.defaultPrevented:a.returnValue===!1)?ih:By,this.isPropagationStopped=By,this}return De(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=ih)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=ih)},persist:function(){},isPersistent:ih}),t}var Ba={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},md=Vn(Ba),Oc=De({},Ba,{view:0,detail:0}),Yw=Vn(Oc),gm,vm,Wl,gd=De({},Oc,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:a0,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==Wl&&(Wl&&e.type==="mousemove"?(gm=e.screenX-Wl.screenX,vm=e.screenY-Wl.screenY):vm=gm=0,Wl=e),gm)},movementY:function(e){return"movementY"in e?e.movementY:vm}}),zy=Vn(gd),Zw=De({},gd,{dataTransfer:0}),jw=Vn(Zw),Kw=De({},Oc,{relatedTarget:0}),_m=Vn(Kw),Jw=De({},Ba,{animationName:0,elapsedTime:0,pseudoElement:0}),Qw=Vn(Jw),$w=De({},Ba,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),tA=Vn($w),eA=De({},Ba,{data:0}),Fy=Vn(eA),nA={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},iA={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},sA={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function aA(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=sA[e])?!!t[e]:!1}function a0(){return aA}var rA=De({},Oc,{key:function(e){if(e.key){var t=nA[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=bh(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?iA[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:a0,charCode:function(e){return e.type==="keypress"?bh(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?bh(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),oA=Vn(rA),lA=De({},gd,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Gy=Vn(lA),cA=De({},Ba,{submitter:0}),uA=Vn(cA),hA=De({},Oc,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:a0}),dA=Vn(hA),fA=De({},Ba,{propertyName:0,elapsedTime:0,pseudoElement:0}),pA=Vn(fA),mA=De({},gd,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),gA=Vn(mA),vA=De({},Ba,{newState:0,oldState:0,source:0}),_A=Vn(vA),yA=[9,13,27,32],r0=Bs&&"CompositionEvent"in window,ec=null;Bs&&"documentMode"in document&&(ec=document.documentMode);var xA=Bs&&"TextEvent"in window&&!ec,PS=Bs&&(!r0||ec&&8<ec&&11>=ec),Hy=" ",Vy=!1;function BS(e,t){switch(e){case"keyup":return yA.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function zS(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var fo=!1;function SA(e,t){switch(e){case"compositionend":return zS(t);case"keypress":return t.which!==32?null:(Vy=!0,Hy);case"textInput":return e=t.data,e===Hy&&Vy?null:e;default:return null}}function bA(e,t){if(fo)return e==="compositionend"||!r0&&BS(e,t)?(e=OS(),Sh=s0=va=null,fo=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return PS&&t.locale!=="ko"?null:t.data;default:return null}}var MA={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function ky(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!MA[e.type]:t==="textarea"}function FS(e,t,n,i){ho?Mo?Mo.push(i):Mo=[i]:ho=i,t=ud(t,"onChange"),0<t.length&&(n=new md("onChange","change",null,n,i),e.push({event:n,listeners:t}))}var nc=null,gc=null;function EA(e){IM(e,0)}function vd(e){var t=Ql(e);if(RS(t))return e}function Xy(e,t){if(e==="change")return t}var GS=!1;Bs&&(Bs?(ah="oninput"in document,ah||(ym=document.createElement("div"),ym.setAttribute("oninput","return;"),ah=typeof ym.oninput=="function"),sh=ah):sh=!1,GS=sh&&(!document.documentMode||9<document.documentMode));var sh,ah,ym;function Wy(){nc&&(nc.detachEvent("onpropertychange",HS),gc=nc=null)}function HS(e){if(e.propertyName==="value"&&vd(gc)){var t=[];FS(t,gc,e,i0(e)),IS(EA,t)}}function TA(e,t,n){e==="focusin"?(Wy(),nc=t,gc=n,nc.attachEvent("onpropertychange",HS)):e==="focusout"&&Wy()}function wA(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return vd(gc)}function AA(e,t){if(e==="click")return vd(t)}function CA(e,t){if(e==="input"||e==="change")return vd(t)}function RA(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var pi=typeof Object.is=="function"?Object.is:RA;function vc(e,t){if(pi(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),i=Object.keys(t);if(n.length!==i.length)return!1;for(i=0;i<n.length;i++){var s=n[i];if(!Km.call(t,s)||!pi(e[s],t[s]))return!1}return!0}function eg(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function qy(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function Yy(e,t){var n=qy(e);e=0;for(var i;n;){if(n.nodeType===3){if(i=e+n.textContent.length,e<=t&&i>=t)return{node:n,offset:t-e};e=i}t:{for(;n;){if(n.nextSibling){n=n.nextSibling;break t}n=n.parentNode}n=void 0}n=qy(n)}}function VS(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?VS(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function kS(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=eg(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=eg(e.document)}return t}function o0(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var NA=Bs&&"documentMode"in document&&11>=document.documentMode,po=null,ng=null,ic=null,ig=!1;function Zy(e,t,n){var i=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;ig||po==null||po!==eg(i)||(i=po,"selectionStart"in i&&o0(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),ic&&vc(ic,i)||(ic=i,i=ud(ng,"onSelect"),0<i.length&&(t=new md("onSelect","select",null,t,n),e.push({event:t,listeners:i}),t.target=po)))}function ur(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var mo={animationend:ur("Animation","AnimationEnd"),animationiteration:ur("Animation","AnimationIteration"),animationstart:ur("Animation","AnimationStart"),transitionrun:ur("Transition","TransitionRun"),transitionstart:ur("Transition","TransitionStart"),transitioncancel:ur("Transition","TransitionCancel"),transitionend:ur("Transition","TransitionEnd")},xm={},XS={};Bs&&(XS=document.createElement("div").style,"AnimationEvent"in window||(delete mo.animationend.animation,delete mo.animationiteration.animation,delete mo.animationstart.animation),"TransitionEvent"in window||delete mo.transitionend.transition);function Lr(e){if(xm[e])return xm[e];if(!mo[e])return e;var t=mo[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in XS)return xm[e]=t[n];return e}var WS=Lr("animationend"),qS=Lr("animationiteration"),YS=Lr("animationstart"),DA=Lr("transitionrun"),LA=Lr("transitionstart"),UA=Lr("transitioncancel"),ZS=Lr("transitionend"),jS=new Map,sg="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");sg.push("scrollEnd");function Vi(e,t){jS.set(e,t),Dr(t,[e])}var IA=0;function zs(e,t){if(e.name!=null&&e.name!=="auto")return e.name;if(t.autoName!==null)return t.autoName;e=Hi.identifierPrefix;var n=IA++;return e="_"+e+"t_"+n.toString(32)+"_",t.autoName=e}function jy(e){if(e==null||typeof e=="string")return e;var t=null,n=No;if(n!==null)for(var i=0;i<n.length;i++){var s=e[n[i]];if(s!=null){if(s==="none")return"none";t=t==null?s:t+(" "+s)}}return t??e.default}function Xs(e,t){return e=jy(e),t=jy(t),t==null?e==="auto"?null:e:t==="auto"?null:t}var kh=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Ai=[],go=0,l0=0;function _d(){for(var e=go,t=l0=go=0;t<e;){var n=Ai[t];Ai[t++]=null;var i=Ai[t];Ai[t++]=null;var s=Ai[t];Ai[t++]=null;var a=Ai[t];if(Ai[t++]=null,i!==null&&s!==null){var r=i.pending;r===null?s.next=s:(s.next=r.next,r.next=s),i.pending=s}a!==0&&KS(n,s,a)}}function yd(e,t,n,i){Ai[go++]=e,Ai[go++]=t,Ai[go++]=n,Ai[go++]=i,l0|=i,e.lanes|=i,e=e.alternate,e!==null&&(e.lanes|=i)}function c0(e,t,n,i){return yd(e,t,n,i),Xh(e)}function Ur(e,t){return yd(e,null,null,t),Xh(e)}function KS(e,t,n){e.lanes|=n;var i=e.alternate;i!==null&&(i.lanes|=n);for(var s=!1,a=e.return;a!==null;)a.childLanes|=n,i=a.alternate,i!==null&&(i.childLanes|=n),a.tag===22&&(e=a.stateNode,e===null||e._visibility&1||(s=!0)),e=a,a=a.return;return e.tag===3?(a=e.stateNode,s&&t!==null&&(s=31-di(n),e=a.hiddenUpdates,i=e[s],i===null?e[s]=[t]:i.push(t),t.lane=n|536870912),a):null}function Xh(e){if(50<fc)throw fc=0,Lh=null,Error(et(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var vo={};function OA(e,t,n,i){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Qn(e,t,n,i){return new OA(e,t,n,i)}function u0(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Os(e,t){var n=e.alternate;return n===null?(n=Qn(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&1206910976,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function JS(e,t){e.flags&=1206910978;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function Mh(e,t,n,i,s,a){var r=0;if(i=e,typeof i=="function")u0(i)&&(r=1);else if(typeof i=="string")r=oR(e,n,ds.current)?26:e==="html"||e==="head"||e==="body"?27:5;else t:switch(i){case Wm:return e=Qn(31,n,t,s),e.elementType=Wm,e.lanes=a,e;case co:return _r(n.children,s,a,t);case pS:r=8,s|=24;break;case Vm:return e=Qn(12,n,t,s|2),e.elementType=Vm,e.lanes=a,e;case km:return e=Qn(13,n,t,s),e.elementType=km,e.lanes=a,e;case Xm:return e=Qn(19,n,t,s),e.elementType=Xm,e.lanes=a,e;case bw:case qm:return e=s|32,e=Qn(30,n,t,e),e.elementType=qm,e.lanes=a,e.stateNode={autoName:null,paired:null,clones:null,ref:null},e;default:if(typeof i=="object"&&i!==null)switch(i.$$typeof){case ls:r=10;break t;case mS:r=9;break t;case Jg:r=11;break t;case Qg:r=14;break t;case fa:r=16,i=null;break t}r=29,n=Error(et(130,e===null?"null":typeof e,"")),i=null}return t=Qn(r,n,t,s),t.elementType=e,t.type=i,t.lanes=a,t}function _r(e,t,n,i){return e=Qn(7,e,i,t),e.lanes=n,e}function Sm(e,t,n){return e=Qn(6,e,null,t),e.lanes=n,e}function QS(e){var t=Qn(18,null,null,0);return t.stateNode=e,t}function bm(e,t,n){return t=Qn(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Ky=new WeakMap;function Di(e,t){if(typeof e=="object"&&e!==null){var n=Ky.get(e);return n!==void 0?n:(t={value:e,source:t,stack:Cy(t)},Ky.set(e,t),t)}return{value:e,source:t,stack:Cy(t)}}var _o=[],yo=0,Wh=null,_c=0,Ci=[],Ri=0,La=null,us=1,hs="";function Us(e,t){_o[yo++]=_c,_o[yo++]=Wh,Wh=e,_c=t}function $S(e,t,n){Ci[Ri++]=us,Ci[Ri++]=hs,Ci[Ri++]=La,La=e;var i=us;e=hs;var s=32-di(i)-1;i&=~(1<<s),n+=1;var a=32-di(t)+s;if(30<a){var r=s-s%5;a=(i&(1<<r)-1).toString(32),i>>=r,s-=r,us=1<<32-di(t)+s|n<<s|i,hs=a+e}else us=1<<a|n<<s|i,hs=e}function xd(e){e.return!==null&&(Us(e,1),$S(e,1,0))}function h0(e){for(;e===Wh;)Wh=_o[--yo],_o[yo]=null,_c=_o[--yo],_o[yo]=null;for(;e===La;)La=Ci[--Ri],Ci[Ri]=null,hs=Ci[--Ri],Ci[Ri]=null,us=Ci[--Ri],Ci[Ri]=null}function tb(e,t){Ci[Ri++]=us,Ci[Ri++]=hs,Ci[Ri++]=La,us=t.id,hs=t.overflow,La=e}var pn=null,Oe=null,Jt=!1,Ma=null,Li=!1,ag=Error(et(519));function Ua(e){var t=Error(et(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw yc(Di(t,e)),ag}function Jy(e){var t=e.stateNode,n=e.type,i=e.memoizedProps;switch(t[yn]=e,t[ei]=i,n){case"dialog":te("cancel",t),te("close",t);break;case"iframe":case"object":case"embed":te("load",t);break;case"video":case"audio":for(n=0;n<Mc.length;n++)te(Mc[n],t);break;case"source":te("error",t);break;case"img":case"image":case"link":te("error",t),te("load",t);break;case"details":te("toggle",t);break;case"input":te("invalid",t),NS(t,i.value,i.defaultValue,i.checked,i.defaultChecked,i.type,i.name,!0);break;case"select":te("invalid",t);break;case"textarea":te("invalid",t),LS(t,i.value,i.defaultValue,i.children)}n=i.children,typeof n!="string"&&typeof n!="number"&&typeof n!="bigint"||t.textContent===""+n||i.suppressHydrationWarning===!0||PM(t.textContent,n)?(i.popover!=null&&(te("beforetoggle",t),te("toggle",t)),i.onScroll!=null&&te("scroll",t),i.onScrollEnd!=null&&te("scrollend",t),i.onClick!=null&&(t.onclick=cs),t=!0):t=!1,t||Ua(e,!0)}function qh(e){for(pn=e.return;pn;)switch(pn.tag){case 5:case 31:case 13:Li=!1;return;case 27:case 3:Li=!0;return;default:pn=pn.return}}function io(e){if(e!==pn)return!1;if(!Jt)return qh(e),Jt=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=!(n!=="form"&&n!=="button")||kg(e.type,e.memoizedProps)),n=!n),n&&Oe&&Ua(e),qh(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(et(317));Oe=Yx(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(et(317));Oe=Yx(e)}else t===27?(t=Oe,za(e.type)?(e=Yg,Yg=null,Oe=e):Oe=t):Oe=pn?Ui(e.stateNode.nextSibling):null;return!0}function br(){Oe=pn=null,Jt=!1}function Mm(){var e=Ma;return e!==null&&(Kn===null?Kn=e:Kn.push.apply(Kn,e),Ma=null),e}function yc(e){Ma===null?Ma=[e]:Ma.push(e)}var rg=ms(null),Ir=null,Is=null;function _a(e,t,n){Pe(rg,t._currentValue),t._currentValue=n}function Ps(e){e._currentValue=rg.current,Sn(rg)}function Eh(e,t,n){for(;e!==null;){var i=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,i!==null&&(i.childLanes|=t)):i!==null&&(i.childLanes&t)!==t&&(i.childLanes|=t),e===n)break;e=e.return}}function og(e,t,n,i){var s=e.child;for(s!==null&&(s.return=e);s!==null;){var a=s.dependencies;if(a!==null){var r=s.child;a=a.firstContext;t:for(;a!==null;){var o=a;a=s;for(var l=0;l<t.length;l++)if(o.context===t[l]){a.lanes|=n,o=a.alternate,o!==null&&(o.lanes|=n),Eh(a.return,n,e),i||(r=null);break t}a=o.next}}else if(s.tag===18){if(r=s.return,r===null)throw Error(et(341));r.lanes|=n,a=r.alternate,a!==null&&(a.lanes|=n),Eh(r,n,e),r=null}else s.tag===13&&s.memoizedState!==null&&s.memoizedState.dehydrated===null?(s.lanes|=n,r=s.alternate,r!==null&&(r.lanes|=n),Eh(s.return,n,e),r=s.child,r=r!==null?r.sibling:null):r=s.child;if(r!==null)r.return=s;else for(r=s;r!==null;){if(r===e){r=null;break}if(s=r.sibling,s!==null){s.return=r.return,r=s;break}r=r.return}s=r}}function Mr(e,t,n,i){e=null;for(var s=t,a=!1;s!==null;){if(!a){if((s.flags&524288)!==0)a=!0;else if((s.flags&262144)!==0)break}if(s.tag===10){var r=s.alternate;if(r===null)throw Error(et(387));if(r=r.memoizedProps,r!==null){var o=s.type;pi(s.pendingProps.value,r.value)||(e!==null?e.push(o):e=[o])}}else if(s===zh.current){if(r=s.alternate,r===null)throw Error(et(387));r.memoizedState.memoizedState!==s.memoizedState.memoizedState&&(e!==null?e.push(Ho):e=[Ho])}s=s.return}return e!==null&&og(t,e,n,i),t.flags|=262144,e!==null}function Yh(e){for(e=e.firstContext;e!==null;){if(!pi(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function Er(e){Ir=e,Is=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function xn(e){return eb(Ir,e)}function rh(e,t){return Ir===null&&Er(e),eb(e,t)}function eb(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},Is===null){if(e===null)throw Error(et(308));Is=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Is=Is.next=t;return n}var PA=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(n,i){e.push(i)}};this.abort=function(){t.aborted=!0,e.forEach(function(n){return n()})}},BA=on.unstable_scheduleCallback,zA=on.unstable_NormalPriority,en={$$typeof:ls,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function d0(){return{controller:new PA,data:new Map,refCount:0}}function Pc(e){e.refCount--,e.refCount===0&&BA(zA,function(){e.controller.abort()})}function Qy(e,t){if((e.pendingLanes&4194048)!==0){var n=e.transitionTypes;for(n===null&&(n=e.transitionTypes=[]),e=0;e<t.length;e++){var i=t[e];n.indexOf(i)===-1&&n.push(i)}}}var $l=null;function FA(e){var t=e.transitionTypes;return e.transitionTypes=null,t}var sc=null,lg=0,Tr=0,Eo=null;function GA(e,t){if(sc===null){var n=sc=[];lg=0,Tr=G0(),Eo={status:"pending",value:void 0,then:function(i){n.push(i)}}}return lg++,t.then($y,$y),t}function $y(){if(--lg===0&&($l=null,sc!==null)){Eo!==null&&(Eo.status="fulfilled");var e=sc;sc=null,Tr=0,Eo=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function HA(e,t){var n=[],i={status:"pending",value:null,reason:null,then:function(s){n.push(s)}};return e.then(function(){i.status="fulfilled",i.value=t;for(var s=0;s<n.length;s++)(0,n[s])(t)},function(s){for(i.status="rejected",i.reason=s,s=0;s<n.length;s++)(0,n[s])(void 0)}),i}var tx=Bt.S;Bt.S=function(e,t){if(yM=ui(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&GA(e,t),$l!==null)for(var n=zo;n!==null;)Qy(n,$l),n=n.next;if(n=e.types,n!==null){for(var i=zo;i!==null;)Qy(i,n),i=i.next;if(Tr!==0){i=$l,i===null&&(i=$l=[]);for(var s=0;s<n.length;s++){var a=n[s];i.indexOf(a)===-1&&i.push(a)}}}tx!==null&&tx(e,t)};var yr=ms(null);function f0(){var e=yr.current;return e!==null?e:Ne.pooledCache}function Th(e,t){t===null?Pe(yr,yr.current):Pe(yr,t.pool)}function nb(){var e=f0();return e===null?null:{parent:en._currentValue,pool:e}}var qo=Error(et(460)),p0=Error(et(474)),Sd=Error(et(542)),Zh={then:function(){}};function ex(e){return e=e.status,e==="fulfilled"||e==="rejected"}function ib(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(cs,cs),t=n),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,ix(e),e===void 0&&!("reason"in t)?Error(et(600)):e;default:if(typeof t.status=="string")t.then(cs,cs);else{if(e=Ne,e!==null&&100<e.shellSuspendCounter)throw Error(et(482));e=t,e.status="pending",e.then(function(i){if(t.status==="pending"){var s=t;s.status="fulfilled",s.value=i}},function(i){if(t.status==="pending"){var s=t;s.status="rejected",s.reason=i}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,ix(e),e}throw xr=t,qo}}function fr(e){try{var t=e._init;return t(e._payload)}catch(n){throw n!==null&&typeof n=="object"&&typeof n.then=="function"?(xr=n,qo):n}}var xr=null;function nx(){if(xr===null)throw Error(et(459));var e=xr;return xr=null,e}function ix(e){if(e===qo||e===Sd)throw Error(et(483))}var To=null,xc=0;function oh(e){var t=xc;return xc+=1,To===null&&(To=[]),ib(To,e,t)}function ua(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function lh(e,t){throw t.$$typeof===Sw?Error(et(525)):(e=Object.prototype.toString.call(t),Error(et(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function sb(e){function t(d,v){if(e){var b=d.deletions;b===null?(d.deletions=[v],d.flags|=16):b.push(v)}}function n(d,v){if(!e)return null;for(;v!==null;)t(d,v),v=v.sibling;return null}function i(d){for(var v=new Map;d!==null;)d.key===null?v.set(d.index,d):v.set(d.key,d),d=d.sibling;return v}function s(d,v){return d=Os(d,v),d.index=0,d.sibling=null,d}function a(d,v,b){return d.index=b,e?(b=d.alternate,b!==null?(b=b.index,b<v?(d.flags|=2,v):b):(d.flags|=134217730,v)):(d.flags|=1048576,v)}function r(d){return e&&d.alternate===null&&(d.flags|=134217730),d}function o(d,v,b,x){return v===null||v.tag!==6?(v=Sm(b,d.mode,x),v.return=d,v):(v=s(v,b),v.return=d,v)}function l(d,v,b,x){var T=b.type;return T===co?(d=h(d,v,b.props.children,x,b.key),ua(d,b),d):v!==null&&(v.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===fa&&fr(T)===v.type)?(v=s(v,b.props),ua(v,b),v.return=d,v):(v=Mh(b.type,b.key,b.props,null,d.mode,x),ua(v,b),v.return=d,v)}function c(d,v,b,x){return v===null||v.tag!==4||v.stateNode.containerInfo!==b.containerInfo||v.stateNode.implementation!==b.implementation?(v=bm(b,d.mode,x),v.return=d,v):(v=s(v,b.children||[]),v.return=d,v)}function h(d,v,b,x,T){return v===null||v.tag!==7?(v=_r(b,d.mode,x,T),v.return=d,v):(v=s(v,b),v.return=d,v)}function f(d,v,b){if(typeof v=="string"&&v!==""||typeof v=="number"||typeof v=="bigint")return v=Sm(""+v,d.mode,b),v.return=d,v;if(typeof v=="object"&&v!==null){switch(v.$$typeof){case Qu:return b=Mh(v.type,v.key,v.props,null,d.mode,b),ua(b,v),b.return=d,b;case Kl:return v=bm(v,d.mode,b),v.return=d,v;case fa:return v=fr(v),f(d,v,b)}if(Jl(v)||Xl(v))return v=_r(v,d.mode,b,null),v.return=d,v;if(typeof v.then=="function")return f(d,oh(v),b);if(v.$$typeof===ls)return f(d,rh(d,v),b);lh(d,v)}return null}function u(d,v,b,x){var T=v!==null?v.key:null;if(typeof b=="string"&&b!==""||typeof b=="number"||typeof b=="bigint")return T!==null?null:o(d,v,""+b,x);if(typeof b=="object"&&b!==null){switch(b.$$typeof){case Qu:return b.key===T?l(d,v,b,x):null;case Kl:return b.key===T?c(d,v,b,x):null;case fa:return b=fr(b),u(d,v,b,x)}if(Jl(b)||Xl(b))return T!==null?null:h(d,v,b,x,null);if(typeof b.then=="function")return u(d,v,oh(b),x);if(b.$$typeof===ls)return u(d,v,rh(d,b),x);lh(d,b)}return null}function p(d,v,b,x,T){if(typeof x=="string"&&x!==""||typeof x=="number"||typeof x=="bigint")return d=d.get(b)||null,o(v,d,""+x,T);if(typeof x=="object"&&x!==null){switch(x.$$typeof){case Qu:return d=d.get(x.key===null?b:x.key)||null,l(v,d,x,T);case Kl:return d=d.get(x.key===null?b:x.key)||null,c(v,d,x,T);case fa:return x=fr(x),p(d,v,b,x,T)}if(Jl(x)||Xl(x))return d=d.get(b)||null,h(v,d,x,T,null);if(typeof x.then=="function")return p(d,v,b,oh(x),T);if(x.$$typeof===ls)return p(d,v,b,rh(v,x),T);lh(v,x)}return null}function m(d,v,b,x){for(var T=null,E=null,w=v,_=v=0,A=null;w!==null&&_<b.length;_++){w.index>_?(A=w,w=null):A=w.sibling;var N=u(d,w,b[_],x);if(N===null){w===null&&(w=A);break}e&&w&&N.alternate===null&&t(d,w),v=a(N,v,_),E===null?T=N:E.sibling=N,E=N,w=A}if(_===b.length)return n(d,w),Jt&&Us(d,_),T;if(w===null){for(;_<b.length;_++)w=f(d,b[_],x),w!==null&&(v=a(w,v,_),E===null?T=w:E.sibling=w,E=w);return Jt&&Us(d,_),T}for(w=i(w);_<b.length;_++)A=p(w,d,_,b[_],x),A!==null&&(e&&(N=A.alternate,N!==null&&w.delete(N.key===null?_:N.key)),v=a(A,v,_),E===null?T=A:E.sibling=A,E=A);return e&&w.forEach(function(C){return t(d,C)}),Jt&&Us(d,_),T}function S(d,v,b,x){if(b==null)throw Error(et(151));for(var T=null,E=null,w=v,_=v=0,A=null,N=b.next();w!==null&&!N.done;_++,N=b.next()){w.index>_?(A=w,w=null):A=w.sibling;var C=u(d,w,N.value,x);if(C===null){w===null&&(w=A);break}e&&w&&C.alternate===null&&t(d,w),v=a(C,v,_),E===null?T=C:E.sibling=C,E=C,w=A}if(N.done)return n(d,w),Jt&&Us(d,_),T;if(w===null){for(;!N.done;_++,N=b.next())N=f(d,N.value,x),N!==null&&(v=a(N,v,_),E===null?T=N:E.sibling=N,E=N);return Jt&&Us(d,_),T}for(w=i(w);!N.done;_++,N=b.next())N=p(w,d,_,N.value,x),N!==null&&(e&&(A=N.alternate,A!==null&&w.delete(A.key===null?_:A.key)),v=a(N,v,_),E===null?T=N:E.sibling=N,E=N);return e&&w.forEach(function(U){return t(d,U)}),Jt&&Us(d,_),T}function g(d,v,b,x){if(typeof b=="object"&&b!==null&&b.type===co&&b.key===null&&b.props.ref===void 0&&(b=b.props.children),typeof b=="object"&&b!==null){switch(b.$$typeof){case Qu:t:{for(var T=b.key;v!==null;){if(v.key===T){if(T=b.type,T===co){if(v.tag===7){n(d,v.sibling),x=s(v,b.props.children),ua(x,b),x.return=d,d=x;break t}}else if(v.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===fa&&fr(T)===v.type){n(d,v.sibling),x=s(v,b.props),ua(x,b),x.return=d,d=x;break t}n(d,v);break}else t(d,v);v=v.sibling}b.type===co?(x=_r(b.props.children,d.mode,x,b.key),ua(x,b),x.return=d,d=x):(x=Mh(b.type,b.key,b.props,null,d.mode,x),ua(x,b),x.return=d,d=x)}return r(d);case Kl:t:{for(T=b.key;v!==null;){if(v.key===T)if(v.tag===4&&v.stateNode.containerInfo===b.containerInfo&&v.stateNode.implementation===b.implementation){n(d,v.sibling),x=s(v,b.children||[]),x.return=d,d=x;break t}else{n(d,v);break}else t(d,v);v=v.sibling}x=bm(b,d.mode,x),x.return=d,d=x}return r(d);case fa:return b=fr(b),g(d,v,b,x)}if(Jl(b))return m(d,v,b,x);if(Xl(b)){if(T=Xl(b),typeof T!="function")throw Error(et(150));return b=T.call(b),S(d,v,b,x)}if(typeof b.then=="function")return g(d,v,oh(b),x);if(b.$$typeof===ls)return g(d,v,rh(d,b),x);lh(d,b)}return typeof b=="string"&&b!==""||typeof b=="number"||typeof b=="bigint"?(b=""+b,v!==null&&v.tag===6?(n(d,v.sibling),x=s(v,b),x.return=d,d=x):(n(d,v),x=Sm(b,d.mode,x),x.return=d,d=x),r(d)):n(d,v)}return function(d,v,b,x){try{xc=0;var T=g(d,v,b,x);return To=null,T}catch(w){if(w===qo||w===Sd)throw w;var E=Qn(29,w,null,d.mode);return E.lanes=x,E.return=d,E}finally{}}}var wr=sb(!0),ab=sb(!1),pa=!1;function m0(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function cg(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Ea(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Ta(e,t,n){var i=e.updateQueue;if(i===null)return null;if(i=i.shared,(de&2)!==0){var s=i.pending;return s===null?t.next=t:(t.next=s.next,s.next=t),i.pending=t,t=Xh(e),KS(e,null,n),t}return yd(e,i,t,n),Xh(e)}function ac(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194048)!==0)){var i=t.lanes;i&=e.pendingLanes,n|=i,t.lanes=n,bS(e,n)}}function Em(e,t){var n=e.updateQueue,i=e.alternate;if(i!==null&&(i=i.updateQueue,n===i)){var s=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var r={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};a===null?s=a=r:a=a.next=r,n=n.next}while(n!==null);a===null?s=a=t:a=a.next=t}else s=a=t;n={baseState:i.baseState,firstBaseUpdate:s,lastBaseUpdate:a,shared:i.shared,callbacks:i.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var ug=!1;function rc(){if(ug){var e=Eo;if(e!==null)throw e}}function oc(e,t,n,i){ug=!1;var s=e.updateQueue;pa=!1;var a=s.firstBaseUpdate,r=s.lastBaseUpdate,o=s.shared.pending;if(o!==null){s.shared.pending=null;var l=o,c=l.next;l.next=null,r===null?a=c:r.next=c,r=l;var h=e.alternate;h!==null&&(h=h.updateQueue,o=h.lastBaseUpdate,o!==r&&(o===null?h.firstBaseUpdate=c:o.next=c,h.lastBaseUpdate=l))}if(a!==null){var f=s.baseState;r=0,h=c=l=null,o=a;do{var u=o.lane&-536870913,p=u!==o.lane;if(p?(ie&u)===u:(i&u)===u){u!==0&&u===Tr&&(ug=!0),h!==null&&(h=h.next={lane:0,tag:o.tag,payload:o.payload,callback:null,next:null});t:{var m=e,S=o;u=t;var g=n;switch(S.tag){case 1:if(m=S.payload,typeof m=="function"){f=m.call(g,f,u);break t}f=m;break t;case 3:m.flags=m.flags&-65537|128;case 0:if(m=S.payload,u=typeof m=="function"?m.call(g,f,u):m,u==null)break t;f=De({},f,u);break t;case 2:pa=!0}}u=o.callback,u!==null&&(e.flags|=64,p&&(e.flags|=8192),p=s.callbacks,p===null?s.callbacks=[u]:p.push(u))}else p={lane:u,tag:o.tag,payload:o.payload,callback:o.callback,next:null},h===null?(c=h=p,l=f):h=h.next=p,r|=u;if(o=o.next,o===null){if(o=s.shared.pending,o===null)break;p=o,o=p.next,p.next=null,s.lastBaseUpdate=p,s.shared.pending=null}}while(!0);h===null&&(l=f),s.baseState=l,s.firstBaseUpdate=c,s.lastBaseUpdate=h,a===null&&(s.shared.lanes=0),Pa|=r,e.lanes=r,e.memoizedState=f}}function rb(e,t){if(typeof e!="function")throw Error(et(191,e));e.call(t)}function ob(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)rb(n[e],t)}var Ia=ms(null),jh=ms(0);function sx(e,t){e=Vs,Pe(jh,e),Pe(Ia,t),Vs=e|t.baseLanes}function hg(){Pe(jh,Vs),Pe(Ia,Ia.current)}function g0(){Vs=jh.current,Sn(Ia),Sn(jh)}var En=ms(null),Nn=null;function wa(e){var t=e.alternate;Pe(bn,bn.current&1),Pe(En,e),Nn===null&&(t===null||Ia.current!==null||t.memoizedState!==null)&&(Nn=e)}function dg(e){Pe(bn,bn.current),Pe(En,e),Nn===null&&(Nn=e)}function lb(e){e.tag===22?(Pe(bn,bn.current),Pe(En,e),Nn===null&&(Nn=e)):Aa()}function Aa(){Pe(bn,bn.current),Pe(En,En.current)}function oi(e){Sn(En),Nn===e&&(Nn=null),Sn(bn)}var bn=ms(0);function Sc(e,t){Pe(En,En.current),Pe(bn,t)}function v0(e){Sn(bn),Sn(En),Nn===e&&(Nn=null)}function Kh(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||qg(n)||X0(n)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!=="independent"){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Fs=0,kt=null,we=null,tn=null,Jh=!1,wo=!1,Ar=!1,Qh=0,bc=0,Ao=null,VA=0;function je(){throw Error(et(321))}function _0(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!pi(e[n],t[n]))return!1;return!0}function y0(e,t,n,i,s,a){return Fs=a,kt=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,Bt.H=e===null||e.memoizedState===null?Fb:Gb,Ar=!1,a=n(i,s),Ar=!1,wo&&(a=ub(t,n,i,s)),cb(e),a}function cb(e){Bt.H=$h;var t=we!==null&&we.next!==null;if(Fs=0,tn=we=kt=null,Jh=!1,bc=0,Ao=null,t)throw Error(et(300));e===null||nn||(e=e.dependencies,e!==null&&Yh(e)&&(nn=!0))}function ub(e,t,n,i){kt=e;var s=0;do{if(wo&&(Ao=null),bc=0,wo=!1,25<=s)throw Error(et(301));if(s+=1,tn=we=null,e.updateQueue!=null){var a=e.updateQueue;a.lastEffect=null,a.events=null,a.stores=null,a.memoCache!=null&&(a.memoCache.index=0)}Bt.H=KA,a=t(n,i)}while(wo);return a}function kA(){var e=Bt.H,t=e.useState()[0];return t=typeof t.then=="function"?Bc(t):t,e=e.useState()[0],(we!==null?we.memoizedState:null)!==e&&(kt.flags|=1024),t}function x0(){var e=Qh!==0;return Qh=0,e}function S0(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function b0(e){if(Jh){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Jh=!1}Fs=0,tn=we=kt=null,wo=!1,bc=Qh=0,Ao=null}function Hn(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return tn===null?kt.memoizedState=tn=e:tn=tn.next=e,tn}function Qe(){if(we===null){var e=kt.alternate;e=e!==null?e.memoizedState:null}else e=we.next;var t=tn===null?kt.memoizedState:tn.next;if(t!==null)tn=t,we=e;else{if(e===null)throw kt.alternate===null?Error(et(467)):Error(et(310));we=e,e={memoizedState:we.memoizedState,baseState:we.baseState,baseQueue:we.baseQueue,queue:we.queue,next:null},tn===null?kt.memoizedState=tn=e:tn=tn.next=e}return tn}function bd(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function Bc(e){var t=bc;return bc+=1,Ao===null&&(Ao=[]),e=ib(Ao,e,t),t=kt,(tn===null?t.memoizedState:tn.next)===null&&(t=t.alternate,Bt.H=t===null||t.memoizedState===null?Fb:Gb),e}function Md(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return Bc(e);if(e.$$typeof===Ew)return;if(e.$$typeof===ls)return xn(e)}throw Error(et(438,String(e)))}function M0(e){var t=null,n=kt.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var i=kt.alternate;i!==null&&(i=i.updateQueue,i!==null&&(i=i.memoCache,i!=null&&(t={data:i.data.map(function(s){return s.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),n===null&&(n=bd(),kt.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),i=0;i<e;i++)n[i]=Mw;return t.index++,n}function Gs(e,t){return typeof t=="function"?t(e):t}function wh(e){var t=Qe();return E0(t,we,e)}function E0(e,t,n){var i=e.queue;if(i===null)throw Error(et(311));i.lastRenderedReducer=n;var s=e.baseQueue,a=i.pending;if(a!==null){if(s!==null){var r=s.next;s.next=a.next,a.next=r}t.baseQueue=s=a,i.pending=null}if(a=e.baseState,s===null)e.memoizedState=a;else{t=s.next;var o=r=null,l=null,c=t,h=!1;do{var f=c.lane&-536870913;if(f!==c.lane?(ie&f)===f:(Fs&f)===f){var u=c.revertLane;if(u===0)l!==null&&(l=l.next={lane:0,revertLane:0,gesture:null,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),f===Tr&&(h=!0);else if((Fs&u)===u){c=c.next,u===Tr&&(h=!0);continue}else f={lane:0,revertLane:c.revertLane,gesture:null,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null},l===null?(o=l=f,r=a):l=l.next=f,kt.lanes|=u,Pa|=u;f=c.action,Ar&&n(a,f),a=c.hasEagerState?c.eagerState:n(a,f)}else u={lane:f,revertLane:c.revertLane,gesture:c.gesture,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null},l===null?(o=l=u,r=a):l=l.next=u,kt.lanes|=f,Pa|=f;c=c.next}while(c!==null&&c!==t);if(l===null?r=a:l.next=o,!pi(a,e.memoizedState)&&(nn=!0,h&&(n=Eo,n!==null)))throw n;e.memoizedState=a,e.baseState=r,e.baseQueue=l,i.lastRenderedState=a}return s===null&&(i.lanes=0),[e.memoizedState,i.dispatch]}function Tm(e){var t=Qe(),n=t.queue;if(n===null)throw Error(et(311));n.lastRenderedReducer=e;var i=n.dispatch,s=n.pending,a=t.memoizedState;if(s!==null){n.pending=null;var r=s=s.next;do a=e(a,r.action),r=r.next;while(r!==s);pi(a,t.memoizedState)||(nn=!0),t.memoizedState=a,t.baseQueue===null&&(t.baseState=a),n.lastRenderedState=a}return[a,i]}function hb(e,t,n){var i=kt,s=Qe(),a=Jt;if(a){if(n===void 0)throw Error(et(407));n=n()}else n=t();var r=!pi((we||s).memoizedState,n);if(r&&(s.memoizedState=n,nn=!0),s=s.queue,T0(pb.bind(null,i,s,e),[e]),e=s.getSnapshot!==t||r||tn!==null&&(tn.memoizedState.tag&1)!==0,Io(e?9:8,{destroy:void 0},fb.bind(null,i,s,n,t),null),e){if(i.flags|=2048,Ne===null)throw Error(et(349));a||(Fs&127)!==0||db(i,t,n)}return n}function db(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=kt.updateQueue,t===null?(t=bd(),kt.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function fb(e,t,n,i){t.value=n,t.getSnapshot=i,mb(t)&&gb(e)}function pb(e,t,n){return n(function(){mb(t)&&gb(e)})}function mb(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!pi(e,n)}catch{return!0}}function gb(e){var t=Ur(e,2);t!==null&&$n(t,e,2)}function fg(e){var t=Hn();if(typeof e=="function"){var n=e;if(e=n(),Ar){ga(!0);try{n()}finally{ga(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Gs,lastRenderedState:e},t}function vb(e,t,n,i){return e.baseState=n,E0(e,we,typeof i=="function"?i:Gs)}function XA(e,t,n,i,s){if(Td(e))throw Error(et(485));if(e=t.action,e!==null){var a={payload:s,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(r){a.listeners.push(r)}};Bt.T!==null?n(!0):a.isTransition=!1,i(a),n=t.pending,n===null?(a.next=t.pending=a,_b(t,a)):(a.next=n.next,t.pending=n.next=a)}}function _b(e,t){var n=t.action,i=t.payload,s=e.state;if(t.isTransition){var a=Bt.T,r={};r.types=a!==null?a.types:null,Bt.T=r;try{var o=n(s,i),l=Bt.S;l!==null&&l(r,o),ax(e,t,o)}catch(c){pg(e,t,c)}finally{a!==null&&r.types!==null&&(a.types=r.types),Bt.T=a}}else try{a=n(s,i),ax(e,t,a)}catch(c){pg(e,t,c)}}function ax(e,t,n){n!==null&&typeof n=="object"&&typeof n.then=="function"?n.then(function(i){rx(e,t,i)},function(i){return pg(e,t,i)}):rx(e,t,n)}function rx(e,t,n){t.status="fulfilled",t.value=n,yb(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,_b(e,n)))}function pg(e,t,n){var i=e.pending;if(e.pending=null,i!==null){i=i.next;do t.status="rejected",t.reason=n,yb(t),t=t.next;while(t!==i)}e.action=null}function yb(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function xb(e,t){return t}function ox(e,t){if(Jt){var n=Ne.formState;if(n!==null){t:{var i=kt;if(Jt){if(Oe){e:{for(var s=Oe,a=Li;s.nodeType!==8;){if(!a){s=null;break e}if(s=Ui(s.nextSibling),s===null){s=null;break e}}a=s.data,s=a==="F!"||a==="F"?s:null}if(s){Oe=Ui(s.nextSibling),i=s.data==="F!";break t}}Ua(i)}i=!1}i&&(t=n[0])}}return n=Hn(),n.memoizedState=n.baseState=t,i={pending:null,lanes:0,dispatch:null,lastRenderedReducer:xb,lastRenderedState:t},n.queue=i,n=Pb.bind(null,kt,i),i.dispatch=n,i=fg(!1),a=R0.bind(null,kt,!1,i.queue),i=Hn(),s={state:t,dispatch:null,action:e,pending:null},i.queue=s,n=XA.bind(null,kt,s,a,n),s.dispatch=n,i.memoizedState=e,[t,n,!1]}function lx(e){var t=Qe();return Sb(t,we,e)}function Sb(e,t,n){if(t=E0(e,t,xb)[0],e=wh(Gs)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var i=Bc(t)}catch(r){throw r===qo?Sd:r}else i=t;t=Qe();var s=t.queue,a=s.dispatch;return n!==t.memoizedState&&(kt.flags|=2048,Io(9,{destroy:void 0},WA.bind(null,s,n),null)),[i,a,e]}function WA(e,t){e.action=t}function cx(e){var t=Qe(),n=we;if(n!==null)return Sb(t,n,e);Qe(),t=t.memoizedState,n=Qe();var i=n.queue.dispatch;return n.memoizedState=e,[t,i,!1]}function Io(e,t,n,i){return e={tag:e,create:n,deps:i,inst:t,next:null},t=kt.updateQueue,t===null&&(t=bd(),kt.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(i=n.next,n.next=e,e.next=i,t.lastEffect=e),e}function bb(){return Qe().memoizedState}function Ah(e,t,n,i){var s=Hn();kt.flags|=e,s.memoizedState=Io(1|t,{destroy:void 0},n,i===void 0?null:i)}function Ed(e,t,n,i){var s=Qe();i=i===void 0?null:i;var a=s.memoizedState.inst;we!==null&&i!==null&&_0(i,we.memoizedState.deps)?s.memoizedState=Io(t,a,n,i):(kt.flags|=e,s.memoizedState=Io(1|t,a,n,i))}function ux(e,t){Ah(8390656,8,e,t)}function T0(e,t){Ed(2048,8,e,t)}function qA(e){kt.flags|=4;var t=kt.updateQueue;if(t===null)t=bd(),kt.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function Mb(e){var t=Qe().memoizedState;return qA({ref:t,nextImpl:e}),function(){if((de&2)!==0)throw Error(et(440));return t.impl.apply(void 0,arguments)}}function Eb(e,t){return Ed(4,2,e,t)}function Tb(e,t){return Ed(4,4,e,t)}function wb(e,t){if(typeof t=="function"){e=e();var n=t(e);return function(){typeof n=="function"?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function Ab(e,t,n){n=n!=null?n.concat([e]):null,Ed(4,4,wb.bind(null,t,e),n)}function w0(){}function Cb(e,t){var n=Qe();t=t===void 0?null:t;var i=n.memoizedState;return t!==null&&_0(t,i[1])?i[0]:(n.memoizedState=[e,t],e)}function Rb(e,t){var n=Qe();t=t===void 0?null:t;var i=n.memoizedState;if(t!==null&&_0(t,i[1]))return i[0];if(i=e(),Ar){ga(!0);try{e()}finally{ga(!1)}}return n.memoizedState=[i,t],i}function A0(e,t,n){return n===void 0||(Fs&1073741824)!==0&&(ie&261930)===0?e.memoizedState=t:(e.memoizedState=n,e=SM(),kt.lanes|=e,Pa|=e,n)}function Nb(e,t,n,i){return pi(n,t)?n:Ia.current!==null?(e=A0(e,n,i),pi(e,t)||(nn=!0),e):(Fs&106)===0||(Fs&1073741824)!==0&&(ie&261930)===0?(nn=!0,e.memoizedState=n):(e=SM(),kt.lanes|=e,Pa|=e,t)}function Db(e,t,n,i,s){var a=fe.p;fe.p=a!==0&&8>a?a:8;var r=Bt.T,o={};o.types=r!==null?r.types:null,Bt.T=o,R0(e,!1,t,n);try{var l=s(),c=Bt.S;if(c!==null&&c(o,l),l!==null&&typeof l=="object"&&typeof l.then=="function"){var h=HA(l,i);lc(e,t,h,fi(e))}else lc(e,t,i,fi(e))}catch(f){lc(e,t,{then:function(){},status:"rejected",reason:f},fi())}finally{fe.p=a,r!==null&&o.types!==null&&(r.types=o.types),Bt.T=r}}function YA(){}function mg(e,t,n,i){if(e.tag!==5)throw Error(et(476));var s=Lb(e).queue;Db(e,s,t,vr,n===null?YA:function(){return Ub(e),n(i)})}function Lb(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:vr,baseState:vr,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Gs,lastRenderedState:vr},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Gs,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function Ub(e){var t=Lb(e);t.next===null&&(t=e.alternate.memoizedState),lc(e,t.next.queue,{},fi())}function C0(){return xn(Ho)}function Ib(){return Qe().memoizedState}function Ob(){return Qe().memoizedState}function ZA(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=fi();e=Ea(n);var i=Ta(t,e,n);i!==null&&($n(i,t,n),ac(i,t,n)),t={cache:d0()},e.payload=t;return}t=t.return}}function jA(e,t,n){var i=fi();n={lane:i,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},Td(e)?Bb(t,n):(n=c0(e,t,n,i),n!==null&&($n(n,e,i),zb(n,t,i)))}function Pb(e,t,n){var i=fi();lc(e,t,n,i)}function lc(e,t,n,i){var s={lane:i,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(Td(e))Bb(t,s);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var r=t.lastRenderedState,o=a(r,n);if(s.hasEagerState=!0,s.eagerState=o,pi(o,r))return yd(e,t,s,0),Ne===null&&_d(),!1}catch{}finally{}if(n=c0(e,t,s,i),n!==null)return $n(n,e,i),zb(n,t,i),!0}return!1}function R0(e,t,n,i){if(i={lane:2,revertLane:G0(),gesture:null,action:i,hasEagerState:!1,eagerState:null,next:null},Td(e)){if(t)throw Error(et(479))}else t=c0(e,n,i,2),t!==null&&$n(t,e,2)}function Td(e){var t=e.alternate;return e===kt||t!==null&&t===kt}function Bb(e,t){wo=Jh=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function zb(e,t,n){if((n&4194048)!==0){var i=t.lanes;i&=e.pendingLanes,n|=i,t.lanes=n,bS(e,n)}}var $h={readContext:xn,use:Md,useCallback:je,useContext:je,useEffect:je,useImperativeHandle:je,useLayoutEffect:je,useInsertionEffect:je,useMemo:je,useReducer:je,useRef:je,useState:je,useDebugValue:je,useDeferredValue:je,useTransition:je,useSyncExternalStore:je,useId:je,useHostTransitionStatus:je,useFormState:je,useActionState:je,useOptimistic:je,useMemoCache:je,useCacheRefresh:je,useEffectEvent:je},Fb={readContext:xn,use:Md,useCallback:function(e,t){return Hn().memoizedState=[e,t===void 0?null:t],e},useContext:xn,useEffect:ux,useImperativeHandle:function(e,t,n){n=n!=null?n.concat([e]):null,Ah(4194308,4,wb.bind(null,t,e),n)},useLayoutEffect:function(e,t){return Ah(4194308,4,e,t)},useInsertionEffect:function(e,t){Ah(4,2,e,t)},useMemo:function(e,t){var n=Hn();t=t===void 0?null:t;var i=e();if(Ar){ga(!0);try{e()}finally{ga(!1)}}return n.memoizedState=[i,t],i},useReducer:function(e,t,n){var i=Hn();if(n!==void 0){var s=n(t);if(Ar){ga(!0);try{n(t)}finally{ga(!1)}}}else s=t;return i.memoizedState=i.baseState=s,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:s},i.queue=e,e=e.dispatch=jA.bind(null,kt,e),[i.memoizedState,e]},useRef:function(e){var t=Hn();return e={current:e},t.memoizedState=e},useState:function(e){e=fg(e);var t=e.queue,n=Pb.bind(null,kt,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:w0,useDeferredValue:function(e,t){var n=Hn();return A0(n,e,t)},useTransition:function(){var e=fg(!1);return e=Db.bind(null,kt,e.queue,!0,!1),Hn().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var i=kt,s=Hn();if(Jt){if(n===void 0)throw Error(et(407));n=n()}else{if(n=t(),Ne===null)throw Error(et(349));(ie&127)!==0||db(i,t,n)}s.memoizedState=n;var a={value:n,getSnapshot:t};return s.queue=a,ux(pb.bind(null,i,a,e),[e]),i.flags|=2048,Io(9,{destroy:void 0},fb.bind(null,i,a,n,t),null),n},useId:function(){var e=Hn(),t=Ne.identifierPrefix;if(Jt){var n=hs,i=us;n=(i&~(1<<32-di(i)-1)).toString(32)+n,t="_"+t+"R_"+n,n=Qh++,0<n&&(t+="H"+n.toString(32)),t+="_"}else n=VA++,t="_"+t+"r_"+n.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:C0,useFormState:ox,useActionState:ox,useOptimistic:function(e){var t=Hn();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=R0.bind(null,kt,!0,n),n.dispatch=t,[e,t]},useMemoCache:M0,useCacheRefresh:function(){return Hn().memoizedState=ZA.bind(null,kt)},useEffectEvent:function(e){var t=Hn(),n={impl:e};return t.memoizedState=n,function(){if((de&2)!==0)throw Error(et(440));return n.impl.apply(void 0,arguments)}}},Gb={readContext:xn,use:Md,useCallback:Cb,useContext:xn,useEffect:T0,useImperativeHandle:Ab,useInsertionEffect:Eb,useLayoutEffect:Tb,useMemo:Rb,useReducer:wh,useRef:bb,useState:function(){return wh(Gs)},useDebugValue:w0,useDeferredValue:function(e,t){var n=Qe();return Nb(n,we.memoizedState,e,t)},useTransition:function(){var e=wh(Gs)[0],t=Qe().memoizedState;return[typeof e=="boolean"?e:Bc(e),t]},useSyncExternalStore:hb,useId:Ib,useHostTransitionStatus:C0,useFormState:lx,useActionState:lx,useOptimistic:function(e,t){var n=Qe();return vb(n,we,e,t)},useMemoCache:M0,useCacheRefresh:Ob,useEffectEvent:Mb},KA={readContext:xn,use:Md,useCallback:Cb,useContext:xn,useEffect:T0,useImperativeHandle:Ab,useInsertionEffect:Eb,useLayoutEffect:Tb,useMemo:Rb,useReducer:Tm,useRef:bb,useState:function(){return Tm(Gs)},useDebugValue:w0,useDeferredValue:function(e,t){var n=Qe();return we===null?A0(n,e,t):Nb(n,we.memoizedState,e,t)},useTransition:function(){var e=Tm(Gs)[0],t=Qe().memoizedState;return[typeof e=="boolean"?e:Bc(e),t]},useSyncExternalStore:hb,useId:Ib,useHostTransitionStatus:C0,useFormState:cx,useActionState:cx,useOptimistic:function(e,t){var n=Qe();return we!==null?vb(n,we,e,t):(n.baseState=e,[e,n.queue.dispatch])},useMemoCache:M0,useCacheRefresh:Ob,useEffectEvent:Mb};function wm(e,t,n,i){t=e.memoizedState,n=n(i,t),n=n==null?t:De({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var gg={enqueueSetState:function(e,t,n){e=e._reactInternals;var i=fi(),s=Ea(i);s.payload=t,n!=null&&(s.callback=n),t=Ta(e,s,i),t!==null&&($n(t,e,i),ac(t,e,i))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var i=fi(),s=Ea(i);s.tag=1,s.payload=t,n!=null&&(s.callback=n),t=Ta(e,s,i),t!==null&&($n(t,e,i),ac(t,e,i))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=fi(),i=Ea(n);i.tag=2,t!=null&&(i.callback=t),t=Ta(e,i,n),t!==null&&($n(t,e,n),ac(t,e,n))}};function hx(e,t,n,i,s,a,r){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(i,a,r):t.prototype&&t.prototype.isPureReactComponent?!vc(n,i)||!vc(s,a):!0}function dx(e,t,n,i){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,i),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,i),t.state!==e&&gg.enqueueReplaceState(t,t.state,null)}function Cr(e,t){var n=t;if("ref"in t){n={};for(var i in t)i!=="ref"&&(n[i]=t[i])}if(e=e.defaultProps){n===t&&(n=De({},n));for(var s in e)n[s]===void 0&&(n[s]=e[s])}return n}function Hb(e){kh(e)}function Vb(e){console.error(e)}function kb(e){kh(e)}function td(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(i){setTimeout(function(){throw i})}}function fx(e,t,n){try{var i=e.onCaughtError;i(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(s){setTimeout(function(){throw s})}}function vg(e,t,n){return n=Ea(n),n.tag=3,n.payload={element:null},n.callback=function(){td(e,t)},n}function Xb(e){return e=Ea(e),e.tag=3,e}function Wb(e,t,n,i){var s=n.type.getDerivedStateFromError;if(typeof s=="function"){var a=i.value;e.payload=function(){return s(a)},e.callback=function(){fx(t,n,i)}}var r=n.stateNode;r!==null&&typeof r.componentDidCatch=="function"&&(e.callback=function(){fx(t,n,i),typeof s!="function"&&(Ca===null?Ca=new Set([this]):Ca.add(this));var o=i.stack;this.componentDidCatch(i.value,{componentStack:o!==null?o:""})})}function JA(e,t,n,i,s){if(n.flags|=32768,i!==null&&typeof i=="object"&&typeof i.then=="function"){if(t=n.alternate,t!==null&&Mr(t,n,s,!0),n=En.current,n!==null){switch(n.tag){case 31:case 13:case 19:return Nn===null?ld():n.alternate===null&&Ke===0&&(Ke=3),n.flags&=-257,n.flags|=65536,n.lanes=s,i===Zh?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([i]):t.add(i),Um(e,i,s)),!1;case 22:return n.flags|=65536,i===Zh?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([i])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([i]):n.add(i)),Um(e,i,s)),!1}throw Error(et(435,n.tag))}return Um(e,i,s),ld(),!1}if(Jt)return t=En.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=s,i!==ag&&(e=Error(et(422),{cause:i}),yc(Di(e,n)))):(i!==ag&&(t=Error(et(423),{cause:i}),yc(Di(t,n))),e=e.current.alternate,e.flags|=65536,s&=-s,e.lanes|=s,i=Di(i,n),s=vg(e.stateNode,i,s),Em(e,s),Ke!==4&&(Ke=2)),!1;var a=Error(et(520),{cause:i});if(a=Di(a,n),dc===null?dc=[a]:dc.push(a),Ke!==4&&(Ke=2),t===null)return!0;i=Di(i,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=s&-s,n.lanes|=e,e=vg(n.stateNode,i,e),Em(n,e),!1;case 1:if(t=n.type,a=n.stateNode,(n.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||a!==null&&typeof a.componentDidCatch=="function"&&(Ca===null||!Ca.has(a))))return n.flags|=65536,s&=-s,n.lanes|=s,s=Xb(s),Wb(s,e,n,i),Em(n,s),!1;break;case 22:if(n.memoizedState!==null)return n.flags|=65536,!1}n=n.return}while(n!==null);return!1}var N0=Error(et(461)),nn=!1;function an(e,t,n,i){t.child=e===null?ab(t,null,n,i):wr(t,e.child,n,i)}function px(e,t,n,i,s){n=n.render;var a=t.ref;if("ref"in i){var r={};for(var o in i)o!=="ref"&&(r[o]=i[o])}else r=i;return Er(t),i=y0(e,t,n,r,a,s),o=x0(),e!==null&&!nn?(S0(e,t,s),Hs(e,t,s)):(Jt&&o&&xd(t),t.flags|=1,an(e,t,i,s),t.child)}function mx(e,t,n,i,s){if(e===null){var a=n.type;return typeof a=="function"&&!u0(a)&&a.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=a,qb(e,t,a,i,s)):(e=Mh(n.type,null,i,t,t.mode,s),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,!L0(e,s)){var r=a.memoizedProps;if(n=n.compare,n=n!==null?n:vc,n(r,i)&&e.ref===t.ref)return Hs(e,t,s)}return t.flags|=1,e=Os(a,i),e.ref=t.ref,e.return=t,t.child=e}function qb(e,t,n,i,s){if(e!==null){var a=e.memoizedProps;if(vc(a,i)&&e.ref===t.ref)if(nn=!1,t.pendingProps=i=a,L0(e,s))(e.flags&131072)!==0&&(nn=!0);else return t.lanes=e.lanes,Hs(e,t,s)}return _g(e,t,n,i,s)}function Yb(e,t,n,i){var s=i.children,a=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),i.mode==="hidden"){if((t.flags&128)!==0){if(a=a!==null?a.baseLanes|n:n,e!==null){for(i=t.child=e.child,s=0;i!==null;)s=s|i.lanes|i.childLanes,i=i.sibling;i=s&~a}else i=0,t.child=null;return gx(e,t,a,n,i)}if((n&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&Th(t,a!==null?a.cachePool:null),a!==null?sx(t,a):hg(),lb(t);else return i=t.lanes=536870912,gx(e,t,a!==null?a.baseLanes|n:n,n,i)}else a!==null?(Th(t,a.cachePool),sx(t,a),Aa(),t.memoizedState=null):(e!==null&&Th(t,null),hg(),Aa());return an(e,t,s,n),t.child}function cc(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function gx(e,t,n,i,s){var a=f0();return a=a===null?null:{parent:en._currentValue,pool:a},t.memoizedState={baseLanes:n,cachePool:a},e!==null&&Th(t,null),hg(),lb(t),e!==null&&Mr(e,t,i,!0),t.childLanes=s,null}function Ch(e,t){return t=wd({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function vx(e,t,n){return wr(t,e.child,null,n),e=Ch(t,t.pendingProps),e.flags|=2,oi(t),t.memoizedState=null,e}function QA(e,t,n){var i=t.pendingProps,s=(t.flags&128)!==0;if(t.flags&=-129,e===null){if(Jt){if(i.mode==="hidden")return e=Ch(t,i),t.lanes=536870912,e.memoizedState={baseLanes:0,cachePool:null},cc(null,e);if(dg(t),(e=Oe)?(e=YM(e,Li),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:La!==null?{id:us,overflow:hs}:null,retryLane:536870912,hydrationErrors:null},n=QS(e),n.return=t,t.child=n,pn=t,Oe=null)):e=null,e===null)throw Ua(t);return t.lanes=536870912,null}return Ch(t,i)}var a=e.memoizedState;if(a!==null){var r=a.dehydrated;if(dg(t),s)if(t.flags&256)t.flags&=-257,t=vx(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(et(558));else if(nn||Mr(e,t,n,!1),s=(n&e.childLanes)!==0,nn||s){if(Ia.current===null){if(i=Ne,i!==null&&(r=MS(i,n),r!==0&&r!==a.retryLane))throw a.retryLane=r,Ur(e,r),$n(i,e,r),N0;ld()}t=vx(e,t,n)}else e=a.treeContext,Oe=Ui(r.nextSibling),pn=t,Jt=!0,Ma=null,Li=!1,e!==null&&tb(t,e),t=Ch(t,i),t.flags|=134221824;return t}return e=Os(e.child,{mode:i.mode,children:i.children}),e.ref=t.ref,t.child=e,e.return=t,e}function ao(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!="function"&&typeof n!="object")throw Error(et(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function _g(e,t,n,i,s){return Er(t),n=y0(e,t,n,i,void 0,s),i=x0(),e!==null&&!nn?(S0(e,t,s),Hs(e,t,s)):(Jt&&i&&xd(t),t.flags|=1,an(e,t,n,s),t.child)}function _x(e,t,n,i,s,a){return Er(t),t.updateQueue=null,n=ub(t,i,n,s),cb(e),i=x0(),e!==null&&!nn?(S0(e,t,a),Hs(e,t,a)):(Jt&&i&&xd(t),t.flags|=1,an(e,t,n,a),t.child)}function yx(e,t,n,i,s){if(Er(t),t.stateNode===null){var a=vo,r=n.contextType;typeof r=="object"&&r!==null&&(a=xn(r)),a=new n(i,a),t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,a.updater=gg,t.stateNode=a,a._reactInternals=t,a=t.stateNode,a.props=i,a.state=t.memoizedState,a.refs={},m0(t),r=n.contextType,a.context=typeof r=="object"&&r!==null?xn(r):vo,a.state=t.memoizedState,r=n.getDerivedStateFromProps,typeof r=="function"&&(wm(t,n,r,i),a.state=t.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof a.getSnapshotBeforeUpdate=="function"||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(r=a.state,typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount(),r!==a.state&&gg.enqueueReplaceState(a,a.state,null),oc(t,i,a,s),rc(),a.state=t.memoizedState),typeof a.componentDidMount=="function"&&(t.flags|=4194308),i=!0}else if(e===null){a=t.stateNode;var o=t.memoizedProps,l=Cr(n,o);a.props=l;var c=a.context,h=n.contextType;r=vo,typeof h=="object"&&h!==null&&(r=xn(h));var f=n.getDerivedStateFromProps;h=typeof f=="function"||typeof a.getSnapshotBeforeUpdate=="function",o=t.pendingProps!==o,h||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(o||c!==r)&&dx(t,a,i,r),pa=!1;var u=t.memoizedState;a.state=u,oc(t,i,a,s),rc(),c=t.memoizedState,o||u!==c||pa?(typeof f=="function"&&(wm(t,n,f,i),c=t.memoizedState),(l=pa||hx(t,n,l,i,u,c,r))?(h||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount=="function"&&(t.flags|=4194308)):(typeof a.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=i,t.memoizedState=c),a.props=i,a.state=c,a.context=r,i=l):(typeof a.componentDidMount=="function"&&(t.flags|=4194308),i=!1)}else{a=t.stateNode,cg(e,t),r=t.memoizedProps,h=Cr(n,r),a.props=h,f=t.pendingProps,u=a.context,c=n.contextType,l=vo,typeof c=="object"&&c!==null&&(l=xn(c)),o=n.getDerivedStateFromProps,(c=typeof o=="function"||typeof a.getSnapshotBeforeUpdate=="function")||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(r!==f||u!==l)&&dx(t,a,i,l),pa=!1,u=t.memoizedState,a.state=u,oc(t,i,a,s),rc();var p=t.memoizedState;r!==f||u!==p||pa||e!==null&&e.dependencies!==null&&Yh(e.dependencies)?(typeof o=="function"&&(wm(t,n,o,i),p=t.memoizedState),(h=pa||hx(t,n,h,i,u,p,l)||e!==null&&e.dependencies!==null&&Yh(e.dependencies))?(c||typeof a.UNSAFE_componentWillUpdate!="function"&&typeof a.componentWillUpdate!="function"||(typeof a.componentWillUpdate=="function"&&a.componentWillUpdate(i,p,l),typeof a.UNSAFE_componentWillUpdate=="function"&&a.UNSAFE_componentWillUpdate(i,p,l)),typeof a.componentDidUpdate=="function"&&(t.flags|=4),typeof a.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof a.componentDidUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=1024),t.memoizedProps=i,t.memoizedState=p),a.props=i,a.state=p,a.context=l,i=h):(typeof a.componentDidUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=1024),i=!1)}return a=i,ao(e,t),i=(t.flags&128)!==0,a||i?(a=t.stateNode,n=i&&typeof n.getDerivedStateFromError!="function"?null:a.render(),t.flags|=1,e!==null&&i?(t.child=wr(t,e.child,null,s),t.child=wr(t,null,n,s)):an(e,t,n,s),t.memoizedState=a.state,e=t.child):e=Hs(e,t,s),e}function xx(e,t,n,i){return br(),t.flags|=256,an(e,t,n,i),t.child}var yg={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function xg(e){return{baseLanes:e,cachePool:nb()}}function Sg(e,t,n){return e=e!==null?e.childLanes&~n:0,t&&(e|=ci),e}function Zb(e,t,n){var i=t.pendingProps,s=!1,a=(t.flags&128)!==0,r;if((r=a)||(r=e!==null&&e.memoizedState===null?!1:(bn.current&2)!==0),r&&(s=!0,t.flags&=-129),r=(t.flags&32)!==0,t.flags&=-33,e===null){if(Jt){if(s?wa(t):Aa(),(e=Oe)?(e=YM(e,Li),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:La!==null?{id:us,overflow:hs}:null,retryLane:536870912,hydrationErrors:null},n=QS(e),n.return=t,t.child=n,pn=t,Oe=null)):e=null,e===null)throw Ua(t);return X0(e)?t.lanes=32:t.lanes=536870912,null}return a=i.children,i=i.fallback,s?(Aa(),s=t.mode,a=wd({mode:"hidden",children:a},s),i=_r(i,s,n,null),a.return=t,i.return=t,a.sibling=i,t.child=a,i=t.child,i.memoizedState=xg(n),i.childLanes=Sg(e,r,n),t.memoizedState=yg,cc(null,i)):(wa(t),D0(t,a))}var o=e.memoizedState;if(o!==null){var l=o.dehydrated;if(l!==null)return $A(e,t,a,r,i,l,o,n)}return s?(Aa(),s=i.fallback,a=t.mode,o=e.child,l=o.sibling,i=Os(o,{mode:"hidden",children:i.children}),i.subtreeFlags=o.subtreeFlags&1206910976,l!==null?s=Os(l,s):(s=_r(s,a,n,null),s.flags|=2),s.return=t,i.return=t,i.sibling=s,t.child=i,cc(null,i),i=t.child,s=e.child.memoizedState,s===null?s=xg(n):(a=s.cachePool,a!==null?(o=en._currentValue,a=a.parent!==o?{parent:o,pool:o}:a):a=nb(),s={baseLanes:s.baseLanes|n,cachePool:a}),i.memoizedState=s,i.childLanes=Sg(e,r,n),t.memoizedState=yg,cc(e.child,i)):(wa(t),n=e.child,e=n.sibling,n=Os(n,{mode:"visible",children:i.children}),n.return=t,n.sibling=null,e!==null&&(r=t.deletions,r===null?(t.deletions=[e],t.flags|=16):r.push(e)),t.child=n,t.memoizedState=null,n)}function D0(e,t){return t=wd({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function wd(e,t){return e=Qn(22,e,null,t),e.lanes=0,e}function ch(e,t,n){return wr(t,e.child,null,n),e=D0(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function $A(e,t,n,i,s,a,r,o){if(n)return t.flags&256?(wa(t),t.flags&=-257,ch(e,t,o)):t.memoizedState!==null?(Aa(),t.child=e.child,t.flags|=128,null):(Aa(),a=s.fallback,r=t.mode,s=wd({mode:"visible",children:s.children},r),a=_r(a,r,o,null),a.flags|=2,s.return=t,a.return=t,s.sibling=a,t.child=s,wr(t,e.child,null,o),s=t.child,s.memoizedState=xg(o),s.childLanes=Sg(e,i,o),t.memoizedState=yg,cc(null,s));if(wa(t),X0(a)){if(i=a.nextSibling&&a.nextSibling.dataset,i)var l=i.dgst;return i=l,i!==""&&(s=Error(et(419)),s.stack="",s.digest=i,yc({value:s,source:null,stack:null})),ch(e,t,o)}if(nn||Mr(e,t,o,!1),i=(o&e.childLanes)!==0,nn||i){if(Ia.current!==null)return ch(e,t,o);if(i=Ne,i!==null&&(s=MS(i,o),s!==0&&s!==r.retryLane))throw r.retryLane=s,Ur(e,s),$n(i,e,s),N0;return qg(a)||ld(),ch(e,t,o)}return qg(a)?(t.flags|=192,t.child=e.child,null):(e=r.treeContext,Oe=Ui(a.nextSibling),pn=t,Jt=!0,Ma=null,Li=!1,e!==null&&tb(t,e),t=D0(t,s.children),t.flags|=134221824,t)}function Sx(e,t,n){e.lanes|=t;var i=e.alternate;i!==null&&(i.lanes|=t),Eh(e.return,t,n)}function bx(e){for(var t=null;e!==null;){var n=e.alternate;n!==null&&Kh(n)===null&&(t=e),e=e.sibling}return t}function uh(e,t,n,i,s,a){var r=e.memoizedState;r===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:i,tail:n,tailMode:s,treeForkCount:a}:(r.isBackwards=t,r.rendering=null,r.renderingStartTime=0,r.last=i,r.tail=n,r.tailMode=s,r.treeForkCount=a)}function Am(e){var t=e.child;for(e.child=null;t!==null;){var n=t.sibling;t.sibling=e.child,e.child=t,t=n}}function bg(e,t,n){var i=t.pendingProps,s=i.revealOrder,a=i.tail;i=i.children;var r=bn.current;if(t.flags&128)return Sc(t,r),null;var o=(r&2)!==0;if(o?(r=r&1|2,t.flags|=128):r&=1,Sc(t,r),s==="backwards"&&e!==null?(Am(e),an(e,t,i,n),Am(e)):an(e,t,i,n),i=Jt?_c:0,!o&&e!==null&&(e.flags&128)!==0)t:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Sx(e,n,t);else if(e.tag===19)Sx(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break t;for(;e.sibling===null;){if(e.return===null||e.return===t)break t;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(s){case"backwards":n=bx(t.child),n===null?(s=t.child,t.child=null):(s=n.sibling,n.sibling=null,Am(t)),uh(t,!0,s,null,a,i);break;case"unstable_legacy-backwards":for(n=null,s=t.child,t.child=null;s!==null;){if(e=s.alternate,e!==null&&Kh(e)===null){t.child=s;break}e=s.sibling,s.sibling=n,n=s,s=e}uh(t,!0,n,null,a,i);break;case"together":uh(t,!1,null,null,void 0,i);break;case"independent":t.memoizedState=null;break;default:n=bx(t.child),n===null?(s=t.child,t.child=null):(s=n.sibling,n.sibling=null),uh(t,!1,s,n,a,i)}return t.child}function Mx(e,t,n){var i=t.pendingProps;return _a(t,t.type,i.value),an(e,t,i.children,n),t.child}function Hs(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Pa|=t.lanes,(n&t.childLanes)===0)if(e!==null){if(Mr(e,t,n,!1),(n&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(et(153));if(t.child!==null){for(e=t.child,n=Os(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Os(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function L0(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&Yh(e)))}function tC(e,t,n){switch(t.tag){case 3:Fh(t,t.stateNode.containerInfo),_a(t,en,e.memoizedState.cache),br();break;case 27:case 5:jm(t);break;case 4:Fh(t,t.stateNode.containerInfo);break;case 10:_a(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,dg(t),null;break;case 13:var i=t.memoizedState;if(i!==null){if(i.dehydrated!==null)return wa(t),t.flags|=128,null;i=Mr(e,t,n,!1);var s=t.child.childLanes;return i||(n&s)!==0?Zb(e,t,n):(wa(t),e=Hs(e,t,n),e!==null?e.sibling:null)}wa(t);break;case 19:if(t.flags&128)return bg(e,t,n);if(s=(e.flags&128)!==0,i=(n&t.childLanes)!==0,i||(Mr(e,t,n,!1),i=(n&t.childLanes)!==0),s){if(i)return bg(e,t,n);t.flags|=128}if(s=t.memoizedState,s!==null&&(s.rendering=null,s.tail=null,s.lastEffect=null),Sc(t,bn.current),i)break;return null;case 22:return t.lanes=0,Yb(e,t,n,t.pendingProps);case 24:_a(t,en,e.memoizedState.cache)}return Hs(e,t,n)}function jb(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps)nn=!0;else{if(!L0(e,n)&&(t.flags&128)===0)return nn=!1,tC(e,t,n);nn=(e.flags&131072)!==0}else nn=!1,Jt&&(t.flags&1048576)!==0&&$S(t,_c,t.index);switch(t.lanes=0,t.tag){case 16:t:{var i=t.pendingProps;if(e=fr(t.elementType),t.type=e,typeof e=="function")u0(e)?(i=Cr(e,i),t.tag=1,t=yx(null,t,e,i,n)):(t.tag=0,t=_g(null,t,e,i,n));else{if(e!=null){var s=e.$$typeof;if(s===Jg){t.tag=11,t=px(null,t,e,i,n);break t}else if(s===Qg){t.tag=14,t=mx(null,t,e,i,n);break t}else if(s===ls){t.tag=10,t.type=e,t=Mx(null,t,n);break t}}throw t=Ym(e)||e,Error(et(306,t,""))}}return t;case 0:return _g(e,t,t.type,t.pendingProps,n);case 1:return i=t.type,s=Cr(i,t.pendingProps),yx(e,t,i,s,n);case 3:t:{if(Fh(t,t.stateNode.containerInfo),e===null)throw Error(et(387));i=t.pendingProps;var a=t.memoizedState;s=a.element,cg(e,t),oc(t,i,null,n);var r=t.memoizedState;if(i=r.cache,_a(t,en,i),i!==a.cache&&og(t,[en],n,!0),rc(),i=r.element,a.isDehydrated)if(a={element:i,isDehydrated:!1,cache:r.cache},t.updateQueue.baseState=a,t.memoizedState=a,t.flags&256){t=xx(e,t,i,n);break t}else if(i!==s){s=Di(Error(et(424)),t),yc(s),t=xx(e,t,i,n);break t}else{switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName==="HTML"?e.ownerDocument.body:e}for(Oe=Ui(e.firstChild),pn=t,Jt=!0,Ma=null,Li=!0,n=ab(t,null,i,n),t.child=n;n;)n.flags=n.flags&-3|134221824,n=n.sibling}else{if(br(),i===s){t=Hs(e,t,n);break t}an(e,t,i,n)}t=t.child}return t;case 26:return ao(e,t),e===null?(n=Kx(t.type,null,t.pendingProps,null))?t.memoizedState=n:Jt||(t.stateNode=zM(t.type,t.pendingProps,ba.current,t)):t.memoizedState=Kx(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return jm(t),e===null&&Jt&&(i=t.stateNode=ZM(t.type,t.pendingProps,ba.current),pn=t,Li=!0,s=Oe,za(t.type)?(Yg=s,Oe=Ui(i.firstChild)):Oe=s),an(e,t,t.pendingProps.children,n),ao(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&Jt&&((s=i=Oe)&&(i=qC(i,t.type,t.pendingProps,Li),i!==null?(t.stateNode=i,pn=t,Oe=Ui(i.firstChild),Li=!1,s=!0):s=!1),s||Ua(t)),jm(t),s=t.type,a=t.pendingProps,r=e!==null?e.memoizedProps:null,i=a.children,kg(s,a)?i=null:r!==null&&kg(s,r)&&(t.flags|=32),t.memoizedState!==null&&(s=y0(e,t,kA,null,null,n),Ho._currentValue=s),ao(e,t),an(e,t,i,n),t.child;case 6:return e===null&&Jt&&((e=n=Oe)&&(n=YC(n,t.pendingProps,Li),n!==null?(t.stateNode=n,pn=t,Oe=null,e=!0):e=!1),e||Ua(t)),null;case 13:return Zb(e,t,n);case 4:return Fh(t,t.stateNode.containerInfo),i=t.pendingProps,e===null?t.child=wr(t,null,i,n):an(e,t,i,n),t.child;case 11:return px(e,t,t.type,t.pendingProps,n);case 7:return i=t.pendingProps,ao(e,t),an(e,t,i,n),t.child;case 8:return an(e,t,t.pendingProps.children,n),t.child;case 12:return an(e,t,t.pendingProps.children,n),t.child;case 10:return Mx(e,t,n);case 9:return s=t.type._context,i=t.pendingProps.children,Er(t),s=xn(s),i=i(s),t.flags|=1,an(e,t,i,n),t.child;case 14:return mx(e,t,t.type,t.pendingProps,n);case 15:return qb(e,t,t.type,t.pendingProps,n);case 19:return bg(e,t,n);case 31:return QA(e,t,n);case 22:return Yb(e,t,n,t.pendingProps);case 24:return Er(t),i=xn(en),e===null?(s=f0(),s===null&&(s=Ne,a=d0(),s.pooledCache=a,a.refCount++,a!==null&&(s.pooledCacheLanes|=n),s=a),t.memoizedState={parent:i,cache:s},m0(t),_a(t,en,s)):((e.lanes&n)!==0&&(cg(e,t),oc(t,null,null,n),rc()),s=e.memoizedState,a=t.memoizedState,s.parent!==i?(s={parent:i,cache:i},t.memoizedState=s,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=s),_a(t,en,i)):(i=a.cache,_a(t,en,i),i!==s.cache&&og(t,[en],n,!0))),an(e,t,t.pendingProps.children,n),t.child;case 30:return t.stateNode===null&&(t.stateNode={autoName:null,paired:null,clones:null,ref:null}),i=t.pendingProps,i.name!=null&&i.name!=="auto"?t.flags|=e===null?18882560:18874368:Jt&&xd(t),e!==null&&e.memoizedProps.name!==i.name?t.flags|=4194816:ao(e,t),an(e,t,i.children,n),t.child;case 29:throw t.pendingProps}throw Error(et(156,t.tag))}function Ls(e){e.flags|=4}function Cm(e,t,n,i,s){var a;if((a=(e.mode&32)!==0)&&(a=n===null?$x(t,i):$x(t,i)&&(i.src!==n.src||i.srcSet!==n.srcSet)),a){if(e.flags|=16777216,(s&335544128)===s)if(e.stateNode.complete)e.flags|=8192;else if(EM())e.flags|=8192;else throw xr=Zh,p0}else e.flags&=-16777217}function Ex(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!QM(t))if(EM())e.flags|=8192;else throw xr=Zh,p0}function hh(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?xS():536870912,e.lanes|=t,Oo|=t)}function ql(e,t){if(!Jt)switch(e.tailMode){case"visible":break;case"collapsed":for(var n=e.tail,i=null;n!==null;)n.alternate!==null&&(i=n),n=n.sibling;i===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:i.sibling=null;break;default:for(t=e.tail,n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null}}function Ie(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,i=0;if(t)for(var s=e.child;s!==null;)n|=s.lanes|s.childLanes,i|=s.subtreeFlags&1206910976,i|=s.flags&1206910976,s.return=e,s=s.sibling;else for(s=e.child;s!==null;)n|=s.lanes|s.childLanes,i|=s.subtreeFlags,i|=s.flags,s.return=e,s=s.sibling;return e.subtreeFlags|=i,e.childLanes=n,t}function eC(e,t,n){var i=t.pendingProps;switch(h0(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return Ie(t),null;case 1:return Ie(t),null;case 3:return n=t.stateNode,i=null,e!==null&&(i=e.memoizedState.cache),t.memoizedState.cache!==i&&(t.flags|=2048),Ps(en),Do(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(io(t)?Ls(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,Mm())),Ie(t),null;case 26:var s=t.type,a=t.memoizedState;return e===null?(Ls(t),a!==null?(Ie(t),Ex(t,a)):(Ie(t),Cm(t,s,null,i,n))):a?a!==e.memoizedState?(Ls(t),Ie(t),Ex(t,a)):(Ie(t),t.flags&=-16777217):(e=e.memoizedProps,e!==i&&Ls(t),Ie(t),Cm(t,s,e,i,n)),null;case 27:if(Gh(t),n=ba.current,s=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&Ls(t);else{if(!i){if(t.stateNode===null)throw Error(et(166));return Ie(t),t.subtreeFlags&=-33554433,null}e=ds.current,io(t)?Jy(t,e):(e=ZM(s,i,n),t.stateNode=e,Ls(t))}return Ie(t),t.subtreeFlags&=-33554433,null;case 5:if(Gh(t),s=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&Ls(t);else{if(!i){if(t.stateNode===null)throw Error(et(166));return Ie(t),t.subtreeFlags&=-33554433,null}if(a=ds.current,io(t))Jy(t,a);else{var r=Tc(ba.current);switch(a){case 1:a=r.createElementNS("http://www.w3.org/2000/svg",s);break;case 2:a=r.createElementNS("http://www.w3.org/1998/Math/MathML",s);break;default:switch(s){case"svg":a=r.createElementNS("http://www.w3.org/2000/svg",s);break;case"math":a=r.createElementNS("http://www.w3.org/1998/Math/MathML",s);break;case"script":a=r.createElement("div"),a.innerHTML="<script><\/script>",a=a.removeChild(a.firstChild);break;case"select":a=typeof i.is=="string"?r.createElement("select",{is:i.is}):r.createElement("select"),i.multiple?a.multiple=!0:i.size&&(a.size=i.size);break;default:a=typeof i.is=="string"?r.createElement(s,{is:i.is}):r.createElement(s)}}a[yn]=t,a[ei]=i;t:for(r=t.child;r!==null;){if(r.tag===5||r.tag===6)a.appendChild(r.stateNode);else if(r.tag!==4&&r.tag!==27&&r.child!==null){r.child.return=r,r=r.child;continue}if(r===t)break t;for(;r.sibling===null;){if(r.return===null||r.return===t)break t;r=r.return}r.sibling.return=r.return,r=r.sibling}t.stateNode=a;t:switch(Mn(a,s,i),s){case"button":case"input":case"select":case"textarea":i=!!i.autoFocus;break t;case"img":i=!0;break t;default:i=!1}i&&Ls(t)}}return Ie(t),t.subtreeFlags&=-33554433,Cm(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==i&&Ls(t);else{if(typeof i!="string"&&t.stateNode===null)throw Error(et(166));if(e=ba.current,io(t)){if(e=t.stateNode,n=t.memoizedProps,i=null,s=pn,s!==null)switch(s.tag){case 27:case 5:i=s.memoizedProps}e[yn]=t,e=!!(e.nodeValue===n||i!==null&&i.suppressHydrationWarning===!0||PM(e.nodeValue,n)),e||Ua(t,!0)}else e=Tc(e).createTextNode(i),e[yn]=t,t.stateNode=e}return Ie(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(i=io(t),n!==null){if(e===null){if(!i)throw Error(et(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(et(557));e[yn]=t}else br(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;Ie(t),e=!1}else n=Mm(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(oi(t),t):(oi(t),null);if((t.flags&128)!==0)throw Error(et(558))}return Ie(t),null;case 13:if(i=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(s=io(t),i!==null&&i.dehydrated!==null){if(e===null){if(!s)throw Error(et(318));if(s=t.memoizedState,s=s!==null?s.dehydrated:null,!s)throw Error(et(317));s[yn]=t}else br(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;Ie(t),s=!1}else s=Mm(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=s),s=!0;if(!s)return t.flags&256?(oi(t),t):(oi(t),null)}return oi(t),(t.flags&128)!==0?(t.lanes=n,t):(n=i!==null,e=e!==null&&e.memoizedState!==null,n&&(i=t.child,s=null,i.alternate!==null&&i.alternate.memoizedState!==null&&i.alternate.memoizedState.cachePool!==null&&(s=i.alternate.memoizedState.cachePool.pool),a=null,i.memoizedState!==null&&i.memoizedState.cachePool!==null&&(a=i.memoizedState.cachePool.pool),a!==s&&(i.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),hh(t,t.updateQueue),Ie(t),null);case 4:return Do(),e===null&&H0(t.stateNode.containerInfo),t.flags|=67108864,Ie(t),null;case 10:return Ps(t.type),Ie(t),null;case 19:if(v0(t),i=t.memoizedState,i===null)return Ie(t),null;if(s=(t.flags&128)!==0,a=i.rendering,a===null)if(s)ql(i,!1);else{if(Ke!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(a=Kh(e),a!==null){for(t.flags|=128,ql(i,!1),e=a.updateQueue,t.updateQueue=e,hh(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)JS(n,e),n=n.sibling;return Sc(t,bn.current&1|2),Jt&&Us(t,i.treeForkCount),t.child}e=e.sibling}i.tail!==null&&ui()>rd&&(t.flags|=128,s=!0,ql(i,!1),t.lanes=4194304)}else{if(!s)if(e=Kh(a),e!==null){if(t.flags|=128,s=!0,e=e.updateQueue,t.updateQueue=e,hh(t,e),ql(i,!0),i.tail===null&&i.tailMode!=="collapsed"&&i.tailMode!=="visible"&&!a.alternate&&!Jt)return Ie(t),null}else 2*ui()-i.renderingStartTime>rd&&n!==536870912&&(t.flags|=128,s=!0,ql(i,!1),t.lanes=4194304);i.isBackwards?(a.sibling=t.child,t.child=a):(e=i.last,e!==null?e.sibling=a:t.child=a,i.last=a)}if(i.tail!==null){e=i.tail;t:{for(n=e;n!==null;){if(n.alternate!==null){n=!1;break t}n=n.sibling}n=!0}return i.rendering=e,i.tail=e.sibling,i.renderingStartTime=ui(),e.sibling=null,a=bn.current,a=s?a&1|2:a&1,i.tailMode==="visible"||i.tailMode==="collapsed"||!n||Jt?Sc(t,a):(n=a,Pe(En,t),Pe(bn,n),Nn===null&&(Nn=t)),Jt&&Us(t,i.treeForkCount),e}return Ie(t),null;case 22:case 23:return oi(t),g0(),i=t.memoizedState!==null,e!==null?e.memoizedState!==null!==i&&(t.flags|=8192):i&&(t.flags|=8192),i?(n&536870912)!==0&&(t.flags&128)===0&&(Ie(t),t.subtreeFlags&6&&(t.flags|=8192)):Ie(t),n=t.updateQueue,n!==null&&hh(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),i=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(i=t.memoizedState.cachePool.pool),i!==n&&(t.flags|=2048),e!==null&&Sn(yr),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),Ps(en),Ie(t),null;case 25:return null;case 30:return t.flags|=33554432,Ie(t),null}throw Error(et(156,t.tag))}function nC(e,t){switch(h0(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Ps(en),Do(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return Gh(t),null;case 31:if(t.memoizedState!==null){if(oi(t),t.alternate===null)throw Error(et(340));br()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(oi(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(et(340));br()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return v0(t),e=t.flags,e&65536?(t.flags=e&-65537|128,e=t.memoizedState,e!==null&&(e.rendering=null,e.tail=null),t.flags|=4,t):null;case 4:return Do(),null;case 10:return Ps(t.type),null;case 22:case 23:return oi(t),g0(),e!==null&&Sn(yr),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return Ps(en),null;case 25:return null;default:return null}}function Kb(e,t){switch(h0(t),t.tag){case 3:Ps(en),Do();break;case 26:case 27:case 5:Gh(t);break;case 4:Do();break;case 31:t.memoizedState!==null&&oi(t);break;case 13:oi(t);break;case 19:v0(t);break;case 10:Ps(t.type);break;case 22:case 23:oi(t),g0(),e!==null&&Sn(yr);break;case 24:Ps(en)}}function zc(e,t){try{var n=t.updateQueue,i=n!==null?n.lastEffect:null;if(i!==null){var s=i.next;n=s;do{if((n.tag&e)===e){i=void 0;var a=n.create,r=n.inst;i=a(),r.destroy=i}n=n.next}while(n!==s)}}catch(o){Se(t,t.return,o)}}function Oa(e,t,n){try{var i=t.updateQueue,s=i!==null?i.lastEffect:null;if(s!==null){var a=s.next;i=a;do{if((i.tag&e)===e){var r=i.inst,o=r.destroy;if(o!==void 0){r.destroy=void 0,s=t;var l=n,c=o;try{c()}catch(h){Se(s,l,h)}}}i=i.next}while(i!==a)}}catch(h){Se(t,t.return,h)}}function Jb(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{ob(t,n)}catch(i){Se(e,e.return,i)}}}function Qb(e,t,n){n.props=Cr(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(i){Se(e,t,i)}}function rs(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var i=e.stateNode;break;case 30:var s=e.stateNode,a=zs(e.memoizedProps,s);(s.ref===null||s.ref.name!==a)&&(s.ref=VM(a)),i=s.ref;break;case 7:if(e.stateNode===null){var r=new mi(e);ti(e.child,!1,XC,r,void 0,void 0),e.stateNode=r}i=e.stateNode;break;default:i=e.stateNode}typeof n=="function"?e.refCleanup=n(i):n.current=i}}catch(o){Se(e,t,o)}}function _n(e,t){var n=e.ref,i=e.refCleanup;if(n!==null)if(typeof i=="function")try{i()}catch(s){Se(e,t,s)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n=="function")try{n(null)}catch(s){Se(e,t,s)}else n.current=null}function ed(e,t){if((e.tag===5||e.tag===27||e.tag===6)&&e.alternate===null&&t!==null)for(var n=0;n<t.length;n++)qM(e.stateNode,t[n])}function Tx(e){for(var t=e.return;t!==null&&(I0(t)&&qM(e.stateNode,t.stateNode),!U0(t));)t=t.return}function uc(e){for(var t=e.return;t!==null&&(I0(t)&&WC(e.stateNode,t.stateNode),!U0(t));)t=t.return}function U0(e){return e.tag===5||e.tag===3||e.tag===27}function I0(e){return e&&e.tag===7&&e.stateNode!==null}function Mg(e){var t=e.type,n=e.memoizedProps,i=e.stateNode;try{t:switch(t){case"button":case"input":case"select":case"textarea":n.autoFocus&&i.focus();break t;case"img":n.src?i.src=n.src:n.srcSet&&(i.srcset=n.srcSet)}}catch(s){Se(e,e.return,s)}}function Rm(e,t,n){try{var i=e.stateNode;wC(i,e.type,n,t),i[ei]=t}catch(s){Se(e,e.return,s)}}function $b(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&za(e.type)||e.tag===4}function Nm(e){t:for(;;){for(;e.sibling===null;){if(e.return===null||$b(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&za(e.type)||e.flags&2||e.child===null||e.tag===4)continue t;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function Eg(e,t,n,i){var s=e.tag;if(s===5||s===6)s=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n).insertBefore(s,t):(t=n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n,t.appendChild(s),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=cs)),ed(e,i),ue=!0;else if(s!==4&&(s===27&&(ed(e,i),i=null,za(e.type)&&(n=e.stateNode,t=null)),e=e.child,e!==null))for(Eg(e,t,n,i),e=e.sibling;e!==null;)Eg(e,t,n,i),e=e.sibling}function nd(e,t,n,i){var s=e.tag;if(s===5||s===6)s=e.stateNode,t?n.insertBefore(s,t):n.appendChild(s),ed(e,i),ue=!0;else if(s!==4&&(s===27&&(ed(e,i),i=null,za(e.type)&&(n=e.stateNode)),e=e.child,e!==null))for(nd(e,t,n,i),e=e.sibling;e!==null;)nd(e,t,n,i),e=e.sibling}function tM(e){var t=e.stateNode,n=e.memoizedProps;try{for(var i=e.type,s=t.attributes;s.length;)t.removeAttributeNode(s[0]);Mn(t,i,n),t[yn]=e,t[ei]=n}catch(a){Se(e,e.return,a)}}var id=!1,li=null;function wx(e){(e.tag===30||(e.subtreeFlags&33554432)!==0)&&(id=!0)}var os=null;function Ax(){var e=os;return os=null,e}var Jn=0;function Yo(e,t,n,i,s){return Jn=0,eM(e.child,t,n,i,s)}function eM(e,t,n,i,s){for(var a=!1;e!==null;){if(e.tag===5){var r=e.stateNode;if(i!==null){var o=Xg(r);i.push(o),o.view&&(a=!0)}else a||Xg(r).view&&(a=!0);id=!0,FM(r,Jn===0?t:t+"_"+Jn,n),Jn++}else(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&s||eM(e.child,t,n,i,s)&&(a=!0));e=e.sibling}return a}function ps(e,t){for(;e!==null;)e.tag===5?GM(e.stateNode,e.memoizedProps):(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&t||ps(e.child,t)),e=e.sibling}function Rh(e){if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if((e.tag!==22||e.memoizedState===null)&&(Rh(e),e.tag===30&&(e.flags&18874368)!==0&&e.stateNode.paired)){var t=e.memoizedProps;if(t.name==null||t.name==="auto")throw Error(et(544));var n=t.name;t=Xs(t.default,t.share),t!=="none"&&(Yo(e,n,t,null,!1)||ps(e.child,!1))}e=e.sibling}}function Tg(e,t){if(e.tag===30){var n=e.stateNode,i=e.memoizedProps,s=zs(i,n),a=Xs(i.default,n.paired?i.share:i.enter);a!=="none"?Yo(e,s,a,null,!1)?(Rh(e),n.paired||t||Po(e,i.onEnter)):ps(e.child,!1):Rh(e)}else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)Tg(e,t),e=e.sibling;else Rh(e)}function wg(e){if(li!==null&&li.size!==0){var t=li;if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&(e.flags&18874368)!==0){var n=e.memoizedProps,i=n.name;if(i!=null&&i!=="auto"){var s=t.get(i);if(s!==void 0){var a=Xs(n.default,n.share);if(a!=="none"&&(Yo(e,i,a,null,!1)?(a=e.stateNode,s.paired=a,a.paired=s,Po(e,n.onShare)):ps(e.child,!1)),t.delete(i),t.size===0)break}}}wg(e)}e=e.sibling}}}function Ag(e){if(e.tag===30){var t=e.memoizedProps,n=zs(t,e.stateNode),i=li!==null?li.get(n):void 0,s=Xs(t.default,i!==void 0?t.share:t.exit);s!=="none"&&(Yo(e,n,s,null,!1)?i!==void 0?(s=e.stateNode,i.paired=s,s.paired=i,li.delete(n),Po(e,t.onShare)):Po(e,t.onExit):ps(e.child,!1)),li!==null&&wg(e)}else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)Ag(e),e=e.sibling;else li!==null&&wg(e)}function nM(e){for(e=e.child;e!==null;){if(e.tag===30){var t=e.memoizedProps,n=zs(t,e.stateNode);t=Xs(t.default,t.update),e.flags&=-5,t!=="none"&&Yo(e,n,t,e.memoizedState=[],!1)}else(e.subtreeFlags&33554432)!==0&&nM(e);e=e.sibling}}function Cg(e){if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&(e.flags&18874368)!==0){var t=e.stateNode;t.paired!==null&&(t.paired=null,ps(e.child,!1))}Cg(e)}e=e.sibling}}function Nh(e){if(e.tag===30)e.stateNode.paired=null,ps(e.child,!1),Cg(e);else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)Nh(e),e=e.sibling;else Cg(e)}function iM(e){for(e=e.child;e!==null;)e.tag===30?ps(e.child,!1):(e.subtreeFlags&33554432)!==0&&iM(e),e=e.sibling}function O0(e,t,n,i,s,a,r){for(var o=!1;t!==null;){if(t.tag===5){var l=t.stateNode;if(a!==null&&Jn<a.length){var c=a[Jn],h=Xg(l);(c.view||h.view)&&(o=!0);var f;if(f=(e.flags&4)===0)if(h.clip)f=!0;else{f=c.rect;var u=h.rect;f=f.y!==u.y||f.x!==u.x||f.height!==u.height||f.width!==u.width}f&&(e.flags|=4),h.abs?h=!c.abs:(c=c.rect,h=h.rect,h=c.height!==h.height||c.width!==h.width),h&&(e.flags|=32)}else e.flags|=32;(e.flags&4)!==0&&FM(l,Jn===0?n:n+"_"+Jn,s),o&&(e.flags&4)!==0||(os===null&&(os=[]),os.push(l,Jn===0?i:i+"_"+Jn,t.memoizedProps)),Jn++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&r?e.flags|=t.flags&32:O0(e,t.child,n,i,s,a,r)&&(o=!0));t=t.sibling}return o}function sM(e,t){for(e=e.child;e!==null;){if(e.tag===30){var n=e.memoizedProps,i=e.stateNode,s=zs(n,i),a=Xs(n.default,n.update);if(t){i=i.clones;var r=i===null?null:i.map(LC)}else r=e.memoizedState,e.memoizedState=null;i=e;var o=e.child;Jn=0,s=O0(i,o,s,s,a,r,!1),(e.flags&4)!==0&&s&&(t||Po(e,n.onUpdate))}else(e.subtreeFlags&33554432)!==0&&sM(e,t);e=e.sibling}}var hn=!1,ve=!1,is=!1,Dm=!1,Cx=typeof WeakSet=="function"?WeakSet:Set,dn=null,ss=!1,tc=!1,sd=!1,Rg=!1;function iC(e,t,n){if(e=e.containerInfo,Hg=Vo,e=kS(e),o0(e)){if("selectionStart"in e)var i={start:e.selectionStart,end:e.selectionEnd};else t:{i=(i=e.ownerDocument)&&i.defaultView||window;var s=i.getSelection&&i.getSelection();if(s&&s.rangeCount!==0){i=s.anchorNode;var a=s.anchorOffset,r=s.focusNode;s=s.focusOffset;try{i.nodeType,r.nodeType}catch{i=null;break t}var o=0,l=-1,c=-1,h=0,f=0,u=e,p=null;e:for(;;){for(var m;u!==i||a!==0&&u.nodeType!==3||(l=o+a),u!==r||s!==0&&u.nodeType!==3||(c=o+s),u.nodeType===3&&(o+=u.nodeValue.length),(m=u.firstChild)!==null;)p=u,u=m;for(;;){if(u===e)break e;if(p===i&&++h===a&&(l=o),p===r&&++f===s&&(c=o),(m=u.nextSibling)!==null)break;u=p,p=u.parentNode}u=m}i=l===-1||c===-1?null:{start:l,end:c}}else i=null}i=i||{start:0,end:0}}else i=null;for(Vg={focusedElem:e,selectionRange:i},Vo=!1,n=(n&335544064)===n,dn=t,t=n?9270:1024;dn!==null;){if(e=dn,n&&(i=e.deletions,i!==null))for(a=0;a<i.length;a++)n&&Ag(i[a]);if(e.alternate===null&&(e.flags&2)!==0)n&&wx(e),dh(n);else{if(e.tag===22){if(i=e.alternate,e.memoizedState!==null){i!==null&&i.memoizedState===null&&n&&Ag(i),dh(n);continue}else if(i!==null&&i.memoizedState!==null){n&&wx(e),dh(n);continue}}i=e.child,(e.subtreeFlags&t)!==0&&i!==null?(i.return=e,dn=i):(n&&nM(e),dh(n))}}li=null}function dh(e){for(;dn!==null;){var t=dn,n=e,i=t.alternate,s=t.flags;switch(t.tag){case 0:case 11:case 15:break;case 1:if((s&1024)!==0&&i!==null){n=void 0,s=i.memoizedProps,i=i.memoizedState;var a=t.stateNode;try{var r=Cr(t.type,s);n=a.getSnapshotBeforeUpdate(r,i),a.__reactInternalSnapshotBeforeUpdate=n}catch(o){Se(t,t.return,o)}}break;case 3:if((s&1024)!==0){if(i=t.stateNode.containerInfo,n=i.nodeType,n===9)Wg(i);else if(n===1)switch(i.nodeName){case"HEAD":case"HTML":case"BODY":Wg(i);break;default:i.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:n&&i!==null&&(n=zs(i.memoizedProps,i.stateNode),s=t.memoizedProps,s=Xs(s.default,s.update),s!=="none"&&Yo(i,n,s,i.memoizedState=[],!0));break;default:if((s&1024)!==0)throw Error(et(163))}if(i=t.sibling,i!==null){i.return=t.return,dn=i;break}dn=t.return}}function aM(e,t,n){var i=n.flags;switch(n.tag){case 0:case 11:case 15:as(e,n),i&4&&zc(5,n);break;case 1:if(as(e,n),i&4)if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(r){Se(n,n.return,r)}else{var s=Cr(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(s,t,e.__reactInternalSnapshotBeforeUpdate)}catch(r){Se(n,n.return,r)}}i&64&&Jb(n),i&512&&rs(n,n.return);break;case 3:if(as(e,n),i&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{ob(e,t)}catch(r){Se(n,n.return,r)}}break;case 27:t===null&&i&4&&tM(n);case 26:case 5:as(e,n),t===null&&i&4&&Mg(n),i&512&&rs(n,n.return);break;case 12:as(e,n);break;case 31:as(e,n),i&4&&cM(e,n);break;case 13:as(e,n),i&4&&uM(e,n),i&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=mC.bind(null,n),ZC(e,n))));break;case 22:if(i=n.memoizedState!==null||hn,!i){var a=t!==null&&t.memoizedState!==null||ve;t=hn,s=ve,hn=i,(ve=a)&&!s?(i=2,(n.subtreeFlags&8772)!==0&&(i|=1),zi(e,n,i)):as(e,n),hn=t,ve=s}break;case 30:as(e,n),i&512&&rs(n,n.return);break;case 7:i&512&&rs(n,n.return);default:as(e,n)}}function Ng(e,t){for(e=e.child;e!==null;)rM(e,t),e=e.sibling}function rM(e,t){switch(e.tag){case 5:case 26:try{var n=e.stateNode;if(t){var i=n.style;typeof i.setProperty=="function"?i.setProperty("display","none","important"):i.display="none"}else{var s=e.stateNode,a=e.memoizedProps.style,r=a!=null&&a.hasOwnProperty("display")?a.display:null;s.style.display=r==null||typeof r=="boolean"?"":(""+r).trim()}}catch(l){Se(e,e.return,l)}Dg(e,t);break;case 6:try{e.stateNode.nodeValue=t?"":e.memoizedProps,ue=!0}catch(l){Se(e,e.return,l)}break;case 18:try{var o=e.stateNode;t?Xx(o,!0):Xx(e.stateNode,!1)}catch(l){Se(e,e.return,l)}break;case 22:case 23:e.memoizedState===null&&Ng(e,t);break;default:Ng(e,t)}}function Dg(e,t){if(e.subtreeFlags&67108864)for(e=e.child;e!==null;){t:{var n=e,i=t;switch(n.tag){case 4:rM(n,i);break t;case 22:n.memoizedState===null&&Dg(n,i);break t;default:Dg(n,i)}}e=e.sibling}}function oM(e){var t=e.alternate;t!==null&&(e.alternate=null,oM(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&pd(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var He=null,jn=!1;function Bi(e,t,n){for(n=n.child;n!==null;)lM(e,t,n),n=n.sibling}function lM(e,t,n){if(hi&&typeof hi.onCommitFiberUnmount=="function")try{hi.onCommitFiberUnmount(Dc,n)}catch{}switch(n.tag){case 26:ve||_n(n,t),Bi(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&!ve&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:ve||_n(n,t),uc(n);var i=He,s=jn;za(n.type)&&(He=n.stateNode,jn=!1),Bi(e,t,n),jM(n.stateNode,n.type,n.memoizedProps),He=i,jn=s;break;case 5:ve||_n(n,t),uc(n);case 6:if(n.tag===6&&uc(n),i=He,s=jn,He=null,Bi(e,t,n),He=i,jn=s,He!==null)if(jn)try{(He.nodeType===9?He.body:He.nodeName==="HTML"?He.ownerDocument.body:He).removeChild(n.stateNode),ue=!0}catch(a){Se(n,t,a)}else try{He.removeChild(n.stateNode),ue=!0}catch(a){Se(n,t,a)}break;case 18:He!==null&&(jn?(e=He,kx(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,n.stateNode),ko(e)):kx(He,n.stateNode));break;case 4:i=He,s=jn,He=n.stateNode.containerInfo,jn=!0,Bi(e,t,n),He=i,jn=s;break;case 0:case 11:case 14:case 15:Oa(2,n,t),ve||Oa(4,n,t),Bi(e,t,n);break;case 1:ve||(_n(n,t),i=n.stateNode,typeof i.componentWillUnmount=="function"&&Qb(n,t,i)),Bi(e,t,n);break;case 21:Bi(e,t,n);break;case 22:ve=(i=ve)||n.memoizedState!==null,Bi(e,t,n),ve=i;break;case 30:_n(n,t),Bi(e,t,n);break;case 7:ve||_n(n,t),Bi(e,t,n);break;default:Bi(e,t,n)}}function cM(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{ko(e)}catch(n){Se(t,t.return,n)}}}function uM(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{ko(e)}catch(n){Se(t,t.return,n)}}function sC(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new Cx),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new Cx),t;default:throw Error(et(435,e.tag))}}function fh(e,t){var n=sC(e);t.forEach(function(i){if(!n.has(i)){n.add(i);var s=gC.bind(null,e,i);i.then(s,s)}})}function Fn(e,t,n){var i=t.deletions;if(i!==null)for(var s=0;s<i.length;s++){var a=i[s],r=e,o=t,l=o;t:for(;l!==null;){switch(l.tag){case 27:if(za(l.type)){He=l.stateNode,jn=!1;break t}break;case 5:He=l.stateNode,jn=!1;break t;case 3:case 4:He=l.stateNode.containerInfo,jn=!0;break t}l=l.return}if(He===null)throw Error(et(160));lM(r,o,a),He=null,jn=!1,r=a.alternate,r!==null&&(r.return=null),a.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)hM(t,e,n),t=t.sibling}var Fi=null;function hM(e,t,n){var i=e.alternate,s=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(s&4&&(i=e.updateQueue,i=i!==null?i.events:null,i!==null))for(var a=0;a<i.length;a++){var r=i[a];r.ref.impl=r.nextImpl}Fn(t,e,n),Gn(e),s&4&&(Oa(3,e,e.return),zc(3,e),Oa(5,e,e.return));break;case 1:Fn(t,e,n),Gn(e),s&512&&(ve||i===null||_n(i,i.return)),s&64&&hn&&(e=e.updateQueue,e!==null&&(t=e.callbacks,t!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?t:n.concat(t))));break;case 26:if(a=Fi,Fn(t,e,n),Gn(e),s&512&&(ve||i===null||_n(i,i.return)),s&4)if(s=i!==null?i.memoizedState:null,n=e.memoizedState,i===null)if(n===null)if(e.stateNode===null)if(hn)e.stateNode=zM(e.type,e.memoizedProps,t.containerInfo,e);else{t:{t=e.type,n=e.memoizedProps,s=a.ownerDocument||a;e:switch(t){case"title":i=s.getElementsByTagName("title")[0],(!i||i[Ic]||i[yn]||i.namespaceURI==="http://www.w3.org/2000/svg"||i.hasAttribute("itemprop"))&&(i=s.createElement(t),s.head.insertBefore(i,s.querySelector("head > title"))),Mn(i,t,n),i[yn]=e,fn(i),t=i;break t;case"link":if(a=Qx("link","href",s).get(t+(n.href||""))){for(r=0;r<a.length;r++)if(i=a[r],i.getAttribute("href")===(n.href==null||n.href===""?null:n.href)&&i.getAttribute("rel")===(n.rel==null?null:n.rel)&&i.getAttribute("title")===(n.title==null?null:n.title)&&i.getAttribute("crossorigin")===(n.crossOrigin==null?null:n.crossOrigin)){a.splice(r,1);break e}}i=s.createElement(t),Mn(i,t,n),s.head.appendChild(i);break;case"meta":if(a=Qx("meta","content",s).get(t+(n.content||""))){for(r=0;r<a.length;r++)if(i=a[r],i.getAttribute("content")===(n.content==null?null:""+n.content)&&i.getAttribute("name")===(n.name==null?null:n.name)&&i.getAttribute("property")===(n.property==null?null:n.property)&&i.getAttribute("http-equiv")===(n.httpEquiv==null?null:n.httpEquiv)&&i.getAttribute("charset")===(n.charSet==null?null:n.charSet)){a.splice(r,1);break e}}i=s.createElement(t),Mn(i,t,n),s.head.appendChild(i);break;default:throw Error(et(468,t))}i[yn]=e,fn(i),t=i}e.stateNode=t}else hn||Zg(a,e.type,e.stateNode);else e.stateNode=Jx(a,n,e.memoizedProps);else s!==n?(s===null?(t=i.stateNode,t===null||ve||t.parentNode.removeChild(t)):s.count--,n===null?hn||Zg(a,e.type,e.stateNode):Jx(a,n,e.memoizedProps)):n===null&&e.stateNode!==null&&Rm(e,e.memoizedProps,i.memoizedProps);break;case 27:Fn(t,e,n),Gn(e),s&512&&(ve||i===null||_n(i,i.return)),i!==null&&s&4&&Rm(e,e.memoizedProps,i.memoizedProps);break;case 5:if(a=is,is=!1,Fn(t,e,n),is=a,Gn(e),s&512&&(ve||i===null||_n(i,i.return)),e.flags&32){t=e.stateNode;try{Uo(t,""),ue=!0}catch(h){Se(e,e.return,h)}}s&4&&e.stateNode!=null&&(t=e.memoizedProps,Rm(e,t,i!==null?i.memoizedProps:t)),s&1024&&(Dm=!0);break;case 6:if(Fn(t,e,n),Gn(e),s&4){if(e.stateNode===null)throw Error(et(162));t=e.memoizedProps,n=e.stateNode;try{n.nodeValue=t,ue=!0}catch(h){Se(e,e.return,h)}}break;case 3:if(ue=!1,Ih=null,a=Fi,Fi=wc(t.containerInfo),Fn(t,e,n),Fi=a,Gn(e),s&4&&i!==null&&i.memoizedState.isDehydrated)try{ko(t.containerInfo)}catch(h){Se(e,e.return,h)}Dm&&(Dm=!1,dM(e)),ue=!1;break;case 4:s=is,is=hn,i=Iy(),a=Fi,Fi=wc(e.stateNode.containerInfo),Fn(t,e,n),Gn(e),Fi=a,ue&&tc&&(sd=!0),ue=i,is=s;break;case 12:Fn(t,e,n),Gn(e);break;case 31:Fn(t,e,n),Gn(e),s&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,fh(e,t)));break;case 13:Fn(t,e,n),Gn(e),e.child.flags&8192&&e.memoizedState!==null!=(i!==null&&i.memoizedState!==null)&&(Ad=ui()),s&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,fh(e,t)));break;case 22:a=e.memoizedState!==null,r=i!==null&&i.memoizedState!==null;var o=hn,l=ve,c=is;hn=o||a,is=c||a,ve=l||r,Fn(t,e,n),ve=l,is=c,hn=o,Gn(e),s&8192&&(t=e.stateNode,t._visibility=a?t._visibility&-2:t._visibility|1,!a||i===null||r||hn||ve||(t=r||ve,n=hn,i=ve,hn=a||hn,ve=t,da(e,2),hn=n,ve=i),!a&&is||Ng(e,a)),s&4&&(t=e.updateQueue,t!==null&&(n=t.retryQueue,n!==null&&(t.retryQueue=null,fh(e,n))));break;case 19:Fn(t,e,n),Gn(e),s&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,fh(e,t)));break;case 30:s&512&&(ve||i===null||_n(i,i.return)),s=Iy(),a=tc,r=(n&335544064)===n,o=e.memoizedProps,tc=r&&Xs(o.default,o.update)!=="none",Fn(t,e,n),Gn(e),r&&i!==null&&ue&&(e.flags|=4),tc=a,ue=s;break;case 21:break;case 7:s&512&&(ve||i===null||_n(i,i.return)),i&&i.stateNode!==null&&(i.stateNode._fragmentFiber=e);default:Fn(t,e,n),Gn(e)}}function Gn(e){var t=e.flags;if(t&2){try{for(var n,i=e.return;i!==null;){if($b(i)){n=i;break}i=i.return}i=null;for(var s=e.return;s!==null;){if(I0(s)){var a=s.stateNode;i===null?i=[a]:i.push(a)}if(U0(s))break;s=s.return}var r=i;if(n==null)throw Error(et(160));switch(n.tag){case 27:var o=n.stateNode,l=Nm(e);nd(e,l,o,r);break;case 5:var c=n.stateNode;n.flags&32&&(Uo(c,""),n.flags&=-33);var h=Nm(e);nd(e,h,c,r);break;case 3:case 4:var f=n.stateNode.containerInfo,u=Nm(e);Eg(e,u,f,r);break;default:throw Error(et(161))}}catch(p){Se(e,e.return,p)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function dM(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;dM(t),t.tag===5&&t.flags&1024&&(t=t.stateNode,Vo=!0,t.reset(),Vo=!1),e=e.sibling}}function so(e,t){if(t.subtreeFlags&9270)for(t=t.child;t!==null;)fM(t,e),t=t.sibling;else sM(t,!1)}function fM(e,t){var n=e.alternate;if(n===null)Tg(e,!1);else switch(e.tag){case 3:if(Rg=ss=!1,Ax(),so(t,e),!ss&&!sd){if(e=os,e!==null)for(var i=0;i<e.length;i+=3){n=e[i];var s=e[i+1];GM(n,e[i+2]),n=n.ownerDocument.documentElement,n!==null&&n.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+s+")"})}e=t.containerInfo,e=e.nodeType===9?e.documentElement:e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===""&&(e.style.viewTransitionName="none",e.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),e.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),Rg=!0}os=null;break;case 5:so(t,e);break;case 4:i=ss,ss=!1,so(t,e),ss&&(sd=!0),ss=i;break;case 22:e.memoizedState===null&&(n.memoizedState!==null?Tg(e,!1):so(t,e));break;case 30:i=ss,s=Ax(),ss=!1,so(t,e),ss&&(e.flags|=4);var a=e.memoizedProps,r=e.stateNode;t=zs(a,r),r=zs(n.memoizedProps,r);var o=Xs(a.default,a.update);o==="none"?t=!1:(a=n.memoizedState,n.memoizedState=null,n=e.child,Jn=0,t=O0(e,n,t,r,o,a,!0),Jn!==(a===null?0:a.length)&&(e.flags|=32)),(e.flags&4)!==0&&t?(Po(e,e.memoizedProps.onUpdate),os=s):s!==null&&(s.push.apply(s,os),os=s),ss=(e.flags&32)!==0?!0:i;break;default:so(t,e)}}function as(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)aM(e,t.alternate,t),t=t.sibling}function da(e,t){for(e=e.child;e!==null;){var n=e,i=t;switch(n.tag){case 0:case 11:case 14:case 15:Oa(4,n,n.return),da(n,i);break;case 1:_n(n,n.return);var s=n.stateNode;typeof s.componentWillUnmount=="function"&&Qb(n,n.return,s),da(n,i);break;case 27:(i&2)!==0&&jM(n.stateNode,n.type,n.memoizedProps);case 5:_n(n,n.return),n.tag!==5&&n.tag!==27||uc(n),da(n,i);break;case 6:uc(n);break;case 26:_n(n,n.return),s=n.stateNode,n.memoizedState!==null||s===null||ve||s.parentNode.removeChild(s),da(n,i);break;case 22:n.memoizedState===null&&da(n,i);break;case 30:_n(n,n.return),da(n,i);break;case 7:_n(n,n.return);default:da(n,i)}e=e.sibling}}function zi(e,t,n){for(n=(t.subtreeFlags&8772)!==0?n:n&-2,t=t.child;t!==null;){var i=t.alternate,s=e,a=t,r=a.flags,o=(n&1)!==0;switch(a.tag){case 0:case 11:case 15:zi(s,a,n),zc(4,a);break;case 1:if(zi(s,a,n),i=a,s=i.stateNode,typeof s.componentDidMount=="function")try{s.componentDidMount()}catch(h){Se(i,i.return,h)}if(i=a,s=i.updateQueue,s!==null){var l=i.stateNode;try{var c=s.shared.hiddenCallbacks;if(c!==null)for(s.shared.hiddenCallbacks=null,s=0;s<c.length;s++)rb(c[s],l)}catch(h){Se(i,i.return,h)}}o&&r&64&&Jb(a),rs(a,a.return);break;case 27:(n&2)!==0&&tM(a);case 5:a.tag!==5&&a.tag!==27||Tx(a),zi(s,a,n),o&&i===null&&r&4&&Mg(a),rs(a,a.return);break;case 6:Tx(a);break;case 26:l=a.stateNode,a.memoizedState!==null||l===null||hn||Zg(wc(l.ownerDocument),a.type,l),zi(s,a,n),o&&i===null&&r&4&&Mg(a),rs(a,a.return);break;case 12:zi(s,a,n);break;case 31:zi(s,a,n),o&&r&4&&cM(s,a);break;case 13:zi(s,a,n),o&&r&4&&uM(s,a);break;case 22:a.memoizedState===null&&zi(s,a,n),rs(a,a.return);break;case 30:zi(s,a,n),rs(a,a.return);break;case 7:rs(a,a.return);default:zi(s,a,n)}t=t.sibling}}function P0(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&Pc(n))}function B0(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&Pc(e))}function wi(e,t,n,i){var s=(n&335544064)===n;if(t.subtreeFlags&(s?10262:10256))for(t=t.child;t!==null;)pM(e,t,n,i),t=t.sibling;else s&&iM(t)}function pM(e,t,n,i){var s=(n&335544064)===n;s&&t.alternate===null&&t.return!==null&&t.return.alternate!==null&&Nh(t);var a=t.flags;switch(t.tag){case 0:case 11:case 15:wi(e,t,n,i),a&2048&&zc(9,t);break;case 1:wi(e,t,n,i);break;case 3:wi(e,t,n,i),s&&Rg&&(e=e.containerInfo,e=e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,e.style.viewTransitionName==="root"&&(e.style.viewTransitionName=""),e=e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName==="none"&&(e.style.viewTransitionName="")),a&2048&&(a=null,t.alternate!==null&&(a=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==a&&(t.refCount++,a!=null&&Pc(a)));break;case 12:if(a&2048){wi(e,t,n,i),a=t.stateNode;try{var r=t.memoizedProps,o=r.id,l=r.onPostCommit;typeof l=="function"&&l(o,t.alternate===null?"mount":"update",a.passiveEffectDuration,-0)}catch(c){Se(t,t.return,c)}}else wi(e,t,n,i);break;case 31:wi(e,t,n,i);break;case 13:wi(e,t,n,i);break;case 23:break;case 22:r=t.stateNode,o=t.alternate,t.memoizedState!==null?(s&&o!==null&&o.memoizedState===null&&Nh(o),r._visibility&2?wi(e,t,n,i):hc(e,t)):(s&&o!==null&&o.memoizedState!==null&&Nh(t),r._visibility&2?wi(e,t,n,i):(r._visibility|=2,ro(e,t,n,i,(t.subtreeFlags&10256)!==0||!1))),a&2048&&P0(o,t);break;case 24:wi(e,t,n,i),a&2048&&B0(t.alternate,t);break;case 30:s&&(a=t.alternate,a!==null&&(ps(a.child,!0),ps(t.child,!0))),wi(e,t,n,i);break;default:wi(e,t,n,i)}}function ro(e,t,n,i,s){for(s=s&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var a=e,r=t,o=n,l=i,c=r.flags;switch(r.tag){case 0:case 11:case 15:ro(a,r,o,l,s),zc(8,r);break;case 23:break;case 22:var h=r.stateNode;r.memoizedState!==null?h._visibility&2?ro(a,r,o,l,s):hc(a,r):(h._visibility|=2,ro(a,r,o,l,s)),s&&c&2048&&P0(r.alternate,r);break;case 24:ro(a,r,o,l,s),s&&c&2048&&B0(r.alternate,r);break;default:ro(a,r,o,l,s)}t=t.sibling}}function hc(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,i=t,s=i.flags;switch(i.tag){case 22:hc(n,i),s&2048&&P0(i.alternate,i);break;case 24:hc(n,i),s&2048&&B0(i.alternate,i);break;default:hc(n,i)}t=t.sibling}}var pr=8192;function hr(e,t,n){if(e.subtreeFlags&pr)for(e=e.child;e!==null;)mM(e,t,n),e=e.sibling}function mM(e,t,n){switch(e.tag){case 26:hr(e,t,n),e.flags&pr&&(e.memoizedState!==null?lR(n,Fi,e.memoizedState,e.memoizedProps):(e=e.stateNode,(t&335544128)===t&&tS(n,e)));break;case 5:hr(e,t,n),e.flags&pr&&(e=e.stateNode,(t&335544128)===t&&tS(n,e));break;case 3:case 4:var i=Fi;Fi=wc(e.stateNode.containerInfo),hr(e,t,n),Fi=i;break;case 22:e.memoizedState===null&&(i=e.alternate,i!==null&&i.memoizedState!==null?(i=pr,pr=16777216,hr(e,t,n),pr=i):hr(e,t,n));break;case 30:if((e.flags&pr)!==0&&(i=e.memoizedProps.name,i!=null&&i!=="auto")){var s=e.stateNode;s.paired=null,li===null&&(li=new Map),li.set(i,s)}hr(e,t,n);break;default:hr(e,t,n)}}function gM(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Yl(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var i=t[n];dn=i,_M(i,e)}gM(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)vM(e),e=e.sibling}function vM(e){switch(e.tag){case 0:case 11:case 15:Yl(e),e.flags&2048&&Oa(9,e,e.return);break;case 3:Yl(e);break;case 12:Yl(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,Dh(e)):Yl(e);break;default:Yl(e)}}function Dh(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var i=t[n];dn=i,_M(i,e)}gM(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Oa(8,t,t.return),Dh(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,Dh(t));break;default:Dh(t)}e=e.sibling}}function _M(e,t){for(;dn!==null;){var n=dn;switch(n.tag){case 0:case 11:case 15:Oa(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var i=n.memoizedState.cachePool.pool;i!=null&&i.refCount++}break;case 24:Pc(n.memoizedState.cache)}if(i=n.child,i!==null)i.return=n,dn=i;else t:for(n=e;dn!==null;){i=dn;var s=i.sibling,a=i.return;if(oM(i),i===n){dn=null;break t}if(s!==null){s.return=a,dn=s;break t}dn=a}}}var aC={getCacheForType:function(e){var t=xn(en),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return xn(en).controller.signal}},rC=typeof WeakMap=="function"?WeakMap:Map,de=0,Ne=null,ee=null,ie=0,ye=0,ai=null,ya=!1,Zo=!1,z0=!1,Vs=0,Ke=0,Pa=0,Sr=0,ad=0,ci=0,Oo=0,dc=null,Kn=null,Lg=!1,Ad=0,yM=0,rd=1/0,od=null,Ca=null,ke=0,Hi=null,Rr=null,fs=0,Ug=0,Ig=null,xM=null,Co=null,Ro=null,No=null,fc=0,Lh=null;function fi(){return(de&2)!==0&&ie!==0?ie&-ie:Bt.T!==null?G0():ES()}function SM(){if(ci===0)if((ie&536870912)===0||Jt){var e=th;th<<=1,(th&3932160)===0&&(th=262144),ci=e}else ci=536870912;return e=En.current,e!==null&&(e.flags|=32),ci}function Po(e,t){if(t!=null){var n=e.stateNode,i=n.ref;i===null&&(i=n.ref=VM(zs(e.memoizedProps,n))),Ro===null&&(Ro=[]),Ro.push(t.bind(null,i))}}function $n(e,t,n){(e===Ne&&(ye===2||ye===9)||e.cancelPendingCommit!==null)&&(Bo(e,0),xa(e,ie,ci,!1)),Uc(e,n),((de&2)===0||e!==Ne)&&(e===Ne&&((de&2)===0&&(Sr|=n),Ke===4&&xa(e,ie,ci,!1)),gs(e))}function bM(e,t,n){if((de&6)!==0)throw Error(et(327));var i=!n&&(t&127)===0&&(t&e.expiredLanes)===0||Lc(e,t),s=i?cC(e,t):Lm(e,t,!0),a=i;do{if(s===0){Zo&&!i&&xa(e,t,0,!1);break}else{if(n=e.current.alternate,a&&!oC(n)){s=Lm(e,t,!1),a=!1;continue}if(s===2){if(a=t,e.errorRecoveryDisabledLanes&a)var r=0;else r=e.pendingLanes&-536870913,r=r!==0?r:r&536870912?536870912:0;if(r!==0){t=r;t:{var o=e;s=dc;var l=o.current.memoizedState.isDehydrated;if(l&&(Bo(o,r).flags|=256),r=Lm(o,r,!1),r!==2&&r!==6){if(z0&&!l){o.errorRecoveryDisabledLanes|=a,Sr|=a,s=4;break t}a=Kn,Kn=s,a!==null&&(Kn===null?Kn=a:Kn.push.apply(Kn,a))}s=r}if(a=!1,s!==2)continue}}if(s===1){Bo(e,0),xa(e,t,0,!0);break}t:{switch(i=e,a=s,a){case 0:case 1:throw Error(et(345));case 4:if((t&4194048)!==t&&(t&62914560)!==t)break;case 6:xa(i,t,ci,!ya);break t;case 2:Kn=null;break;case 3:case 5:break;default:throw Error(et(329))}if((t&62914560)===t&&(s=Ad+300-ui(),10<s)){if(xa(i,t,ci,!ya),fd(i,0,!0)!==0)break t;fs=t,i.timeoutHandle=V0(Rx.bind(null,i,n,Kn,od,Lg,t,ci,Sr,Oo,ya,a,"Throttled",-0,0),s);break t}Rx(i,n,Kn,od,Lg,t,ci,Sr,Oo,ya,a,null,-0,0)}}break}while(!0);gs(e)}function Rx(e,t,n,i,s,a,r,o,l,c,h,f,u,p){e.timeoutHandle=-1;var m=t.subtreeFlags,S=(a&335544064)===a;if(f=null,(S||m&8192||(m&16785408)===16785408)&&(f={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:cs},li=null,mM(t,a,f),S&&(m=f,S=e.containerInfo,S=(S.nodeType===9?S:S.ownerDocument).__reactViewTransition,S!=null&&(m.count++,m.waitingForViewTransition=!0,m=Ac.bind(m),S.finished.then(m,m))),m=(a&62914560)===a?Ad-ui():(a&4194048)===a?yM-ui():0,m=cR(f,m),m!==null)){fs=a,e.cancelPendingCommit=m(Dx.bind(null,e,t,a,n,i,s,r,o,l,c,h,f,null,u,p)),xa(e,a,r,!c);return}Dx(e,t,a,n,i,s,r,o,l,c,h,f)}function oC(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var i=0;i<n.length;i++){var s=n[i],a=s.getSnapshot;s=s.value;try{if(!pi(a(),s))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function xa(e,t,n,i){t=yS(e,t),t&=~ad,t&=~Sr,e.suspendedLanes|=t,e.pingedLanes&=~t,i&&(e.warmLanes|=t),i=e.expirationTimes;for(var s=t;0<s;){var a=31-di(s),r=1<<a;i[a]=-1,s&=~r}n!==0&&SS(e,n,t)}function Cd(){return(de&6)===0?(Fc(0,!1),!1):!0}function F0(){if(ee!==null){if(ye===0)var e=ee.return;else e=ee,Is=Ir=null,b0(e),To=null,xc=0,e=ee;for(;e!==null;)Kb(e.alternate,e),e=e.return;ee=null}}function Bo(e,t){var n=e.timeoutHandle;return n!==-1&&(e.timeoutHandle=-1,RC(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),fs=0,F0(),Ne=e,ee=n=Os(e.current,null),ie=t,ye=0,ai=null,ya=!1,Zo=Lc(e,t),z0=!1,Oo=ci=ad=Sr=Pa=Ke=0,Kn=dc=null,Lg=!1,Vs=yS(e,t),_d(),n}function MM(e,t){kt=null,Bt.H=$h,t===qo||t===Sd?(t=nx(),ye=3):t===p0?(t=nx(),ye=4):ye=t===N0?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,ai=t,ee===null&&(Ke=1,td(e,Di(t,e.current)))}function EM(){var e=En.current;return e===null?!0:(ie&4194048)===ie?Nn===null:(ie&62914560)===ie||(ie&536870912)!==0?e===Nn:!1}function TM(){var e=Bt.H;return Bt.H=$h,e===null?$h:e}function wM(){var e=Bt.A;return Bt.A=aC,e}function ld(){Ke=4,ya||(ie&4194048)!==ie&&En.current!==null||(Zo=!0),(Pa&134217727)===0&&(Sr&134217727)===0||Ne===null||xa(Ne,ie,ci,!1)}function Lm(e,t,n){var i=de;de|=2;var s=TM(),a=wM();(Ne!==e||ie!==t)&&(od=null,Bo(e,t)),t=!1;var r=Ke;t:do try{if(ye!==0&&ee!==null){var o=ee,l=ai;switch(ye){case 8:F0(),r=6;break t;case 3:case 2:case 9:case 6:En.current===null&&(t=!0);var c=ye;if(ye=0,ai=null,xo(e,o,l,c),n&&Zo){r=0;break t}break;default:c=ye,ye=0,ai=null,xo(e,o,l,c)}}lC(),r=Ke;break}catch(h){MM(e,h)}while(!0);return t&&e.shellSuspendCounter++,Is=Ir=null,de=i,Bt.H=s,Bt.A=a,ee===null&&(Ne=null,ie=0,_d()),r}function lC(){for(;ee!==null;)AM(ee)}function cC(e,t){var n=de;de|=2;var i=TM(),s=wM();Ne!==e||ie!==t?(od=null,rd=ui()+500,Bo(e,t)):Zo=Lc(e,t);t:do try{if(ye!==0&&ee!==null){t=ee;var a=ai;e:switch(ye){case 1:ye=0,ai=null,xo(e,t,a,1);break;case 2:case 9:if(ex(a)){ye=0,ai=null,Nx(t);break}t=function(){ye!==2&&ye!==9||Ne!==e||(ye=7),gs(e)},a.then(t,t);break t;case 3:ye=7;break t;case 4:ye=5;break t;case 7:ex(a)?(ye=0,ai=null,Nx(t)):(ye=0,ai=null,xo(e,t,a,7));break;case 5:var r=null;switch(ee.tag){case 26:r=ee.memoizedState;case 5:case 27:var o=ee;if(r?QM(r):o.stateNode.complete){ye=0,ai=null;var l=o.sibling;if(l!==null)ee=l;else{var c=o.return;c!==null?(ee=c,Rd(c)):ee=null}break e}}ye=0,ai=null,xo(e,t,a,5);break;case 6:ye=0,ai=null,xo(e,t,a,6);break;case 8:F0(),Ke=6;break t;default:throw Error(et(462))}}uC();break}catch(h){MM(e,h)}while(!0);return Is=Ir=null,Bt.H=i,Bt.A=s,de=n,ee!==null?0:(Ne=null,ie=0,_d(),Ke)}function uC(){for(;ee!==null&&!Aw();)AM(ee)}function AM(e){var t=jb(e.alternate,e,Vs);e.memoizedProps=e.pendingProps,t===null?Rd(e):ee=t}function Nx(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=_x(n,t,t.pendingProps,t.type,void 0,ie);break;case 11:t=_x(n,t,t.pendingProps,t.type.render,t.ref,ie);break;case 5:b0(t);var i=t;i===pn&&(Jt?(qh(i),i.tag===5&&i.stateNode!=null&&(Oe=i.stateNode)):(qh(i),Jt=!0));default:Kb(n,t),t=ee=JS(t,Vs),t=jb(n,t,Vs)}e.memoizedProps=e.pendingProps,t===null?Rd(e):ee=t}function xo(e,t,n,i){Is=Ir=null,b0(t),To=null,xc=0;var s=t.return;try{if(JA(e,s,t,n,ie)){Ke=1,td(e,Di(n,e.current)),ee=null;return}}catch(a){if(s!==null)throw ee=s,a;Ke=1,td(e,Di(n,e.current)),ee=null;return}t.flags&32768?(Jt||i===1?e=!0:Zo||(ie&536870912)!==0?e=!1:(ya=e=!0,(i===2||i===9||i===3||i===6)&&(i=En.current,i!==null&&i.tag===13&&(i.flags|=16384))),CM(t,e)):Rd(t)}function Rd(e){var t=e;do{if((t.flags&32768)!==0){CM(t,ya);return}e=t.return;var n=eC(t.alternate,t,Vs);if(n!==null){ee=n;return}if(t=t.sibling,t!==null){ee=t;return}ee=t=e}while(t!==null);Ke===0&&(Ke=5)}function CM(e,t){do{var n=nC(e.alternate,e);if(n!==null){n.flags&=32767,ee=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){ee=e;return}ee=e=n}while(e!==null);Ke=6,ee=null}function Dx(e,t,n,i,s,a,r,o,l,c,h,f){e.cancelPendingCommit=null;do Nd();while(ke!==0);if((de&6)!==0)throw Error(et(327));if(t!==null){if(t===e.current)throw Error(et(177));e===Ne&&(ee=Ne=null,ie=0),Rr=t,Hi=e,fs=n,Ig=s,xM=i,hC(e,t,n,r,o,l,f)}}function hC(e,t,n,i,s,a,r){var o=t.lanes|t.childLanes;if(Ug=o,o|=l0,Bw(e,n,o,i,s,a),Ro=null,(n&335544064)===n?(No=FA(e),i=10262):(No=null,i=10256),(t.subtreeFlags&i)!==0||(t.flags&i)!==0?(e.callbackNode=null,e.callbackPriority=0,vC(Hh,function(){return zg(),null})):(e.callbackNode=null,e.callbackPriority=0),id=!1,i=(t.flags&13878)!==0,(t.subtreeFlags&13878)!==0||i){i=Bt.T,Bt.T=null,s=fe.p,fe.p=2,a=de,de|=4;try{iC(e,t,n)}finally{de=a,fe.p=s,Bt.T=i}}ke=1,id?Co=OC(r,e.containerInfo,No,Og,Pg,fC,Bg,zg,dC,null,null):(Og(),Pg(),Bg())}function dC(e){if(ke!==0){var t=Hi.onRecoverableError;t(e,{componentStack:null})}}function fC(){ke===3&&(ke=0,fM(Rr,Hi),ke=4)}function Og(){if(ke===1){ke=0;var e=Hi,t=Rr,n=fs,i=(t.flags&13878)!==0;if((t.subtreeFlags&13878)!==0||i){i=Bt.T,Bt.T=null;var s=fe.p;fe.p=2;var a=de;de|=4;try{tc=sd=!1,hM(t,e,n),n=Vg;var r=kS(e.containerInfo),o=n.focusedElem,l=n.selectionRange;if(r!==o&&o&&o.ownerDocument&&VS(o.ownerDocument.documentElement,o)){if(l!==null&&o0(o)){var c=l.start,h=l.end;if(h===void 0&&(h=c),"selectionStart"in o)o.selectionStart=c,o.selectionEnd=Math.min(h,o.value.length);else{var f=o.ownerDocument||document,u=f&&f.defaultView||window;if(u.getSelection){var p=u.getSelection(),m=o.textContent.length,S=Math.min(l.start,m),g=l.end===void 0?S:Math.min(l.end,m);!p.extend&&S>g&&(r=g,g=S,S=r);var d=Yy(o,S),v=Yy(o,g);if(d&&v&&(p.rangeCount!==1||p.anchorNode!==d.node||p.anchorOffset!==d.offset||p.focusNode!==v.node||p.focusOffset!==v.offset)){var b=f.createRange();b.setStart(d.node,d.offset),p.removeAllRanges(),S>g?(p.addRange(b),p.extend(v.node,v.offset)):(b.setEnd(v.node,v.offset),p.addRange(b))}}}}for(f=[],p=o;p=p.parentNode;)p.nodeType===1&&f.push({element:p,left:p.scrollLeft,top:p.scrollTop});for(typeof o.focus=="function"&&o.focus(),o=0;o<f.length;o++){var x=f[o];x.element.scrollLeft=x.left,x.element.scrollTop=x.top}}Vo=!!Hg,Vg=Hg=null}finally{de=a,fe.p=s,Bt.T=i}}e.current=t,ke=2}}function Pg(){if(ke===2){ke=0;var e=Hi,t=Rr,n=(t.flags&8772)!==0;if((t.subtreeFlags&8772)!==0||n){n=Bt.T,Bt.T=null;var i=fe.p;fe.p=2;var s=de;de|=4;try{aM(e,t.alternate,t)}finally{de=s,fe.p=i,Bt.T=n}}ke=3}}function Bg(){if(ke===4||ke===3){ke=0;var e=Co;Co=null,Cw();var t=Hi,n=Rr,i=fs,s=xM,a=(i&335544064)===i?10262:10256;if((n.subtreeFlags&a)!==0||(n.flags&a)!==0?ke=5:(ke=0,Rr=Hi=null,RM(t,t.pendingLanes)),a=t.pendingLanes,a===0&&(Ca=null),e0(i),n=n.stateNode,hi&&typeof hi.onCommitFiberRoot=="function")try{hi.onCommitFiberRoot(Dc,n,void 0,(n.current.flags&128)===128)}catch{}if(s!==null){n=Bt.T,a=fe.p,fe.p=2,Bt.T=null;try{for(var r=t.onRecoverableError,o=0;o<s.length;o++){var l=s[o];r(l.value,{componentStack:l.stack})}}finally{Bt.T=n,fe.p=a}}if(s=Ro,r=No,No=null,s!==null&&(Ro=null,r===null&&(r=[]),e!==null))for(l=0;l<s.length;l++)n=(0,s[l])(r),n!==void 0&&e.finished.finally(n);(fs&3)!==0&&Nd(),gs(t),a=t.pendingLanes,(i&261930)!==0&&(a&42)!==0?t===Lh?fc++:(fc=0,Lh=t):(fc=0,Lh=null),Fc(0,!1)}}function RM(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,Pc(t)))}function Nd(){return Co!==null&&(Co.skipTransition(),Co=null),Og(),Pg(),Bg(),zg()}function zg(){if(ke!==5)return!1;var e=Hi,t=Ug;Ug=0;var n=e0(fs),i=Bt.T,s=fe.p;try{fe.p=32>n?32:n,Bt.T=null,n=Ig,Ig=null;var a=Hi,r=fs;if(ke=0,Rr=Hi=null,fs=0,(de&6)!==0)throw Error(et(331));var o=de;if(de|=4,vM(a.current),pM(a,a.current,r,n),de=o,Fc(0,!1),hi&&typeof hi.onPostCommitFiberRoot=="function")try{hi.onPostCommitFiberRoot(Dc,a)}catch{}return!0}finally{fe.p=s,Bt.T=i,RM(e,t)}}function Lx(e,t,n){t=Di(n,t),t=vg(e.stateNode,t,2),e=Ta(e,t,2),e!==null&&(Uc(e,2),gs(e))}function Se(e,t,n){if(e.tag===3)Lx(e,e,n);else for(;t!==null;){if(t.tag===3){Lx(t,e,n);break}else if(t.tag===1){var i=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(Ca===null||!Ca.has(i))){e=Di(n,e),n=Xb(2),i=Ta(t,n,2),i!==null&&(Wb(n,i,t,e),Uc(i,2),gs(i));break}}t=t.return}}function Um(e,t,n){var i=e.pingCache;if(i===null){i=e.pingCache=new rC;var s=new Set;i.set(t,s)}else s=i.get(t),s===void 0&&(s=new Set,i.set(t,s));s.has(n)||(z0=!0,s.add(n),e=pC.bind(null,e,t,n),t.then(e,e))}function pC(e,t,n){var i=e.pingCache;i!==null&&i.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,Ne===e&&(ie&n)===n&&((Ke===4||Ke===3&&(ie&62914560)===ie&&300>ui()-Ad)&&(de&2)===0?Bo(e,0):ad|=n,Oo===ie&&(Oo=0)),gs(e)}function NM(e,t){t===0&&(t=xS()),e=Ur(e,t),e!==null&&(Uc(e,t),gs(e))}function mC(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),NM(e,n)}function gC(e,t){var n=0;switch(e.tag){case 31:case 13:var i=e.stateNode,s=e.memoizedState;s!==null&&(n=s.retryLane);break;case 19:i=e.stateNode;break;case 22:i=e.stateNode._retryCache;break;default:throw Error(et(314))}i!==null&&i.delete(t),NM(e,n)}function vC(e,t){return $g(e,t)}var zo=null,oo=null,Fg=!1,cd=!1,Im=!1,Sa=0;function gs(e){e!==oo&&e.next===null&&(oo===null?zo=oo=e:oo=oo.next=e),cd=!0,Fg||(Fg=!0,yC())}function Fc(e,t){if(!Im&&cd){Im=!0;do for(var n=!1,i=zo;i!==null;){if(!t)if(e!==0){var s=i.pendingLanes;if(s===0)var a=0;else{var r=i.suspendedLanes,o=i.pingedLanes;a=(1<<31-di(42|e)+1)-1,a&=s&~(r&~o),a=a&201326741?a&201326741|1:a?a|2:0}a!==0&&(n=!0,Ux(i,a))}else a=ie,a=fd(i,i===Ne?a:0,i.cancelPendingCommit!==null||i.timeoutHandle!==-1),(a&3)===0||Lc(i,a)||(n=!0,Ux(i,a));i=i.next}while(n);Im=!1}}function _C(){DM()}function DM(){cd=Fg=!1;var e=0;Sa!==0&&CC()&&(e=Sa);for(var t=ui(),n=null,i=zo;i!==null;){var s=i.next,a=LM(i,t);a===0?(i.next=null,n===null?zo=s:n.next=s,s===null&&(oo=n)):(n=i,(e!==0||(a&3)!==0)&&(cd=!0)),i=s}ke!==0&&ke!==5||Fc(e,!1),Sa!==0&&(Sa=0)}function LM(e,t){for(var n=e.suspendedLanes,i=e.pingedLanes,s=e.expirationTimes,a=e.pendingLanes&-62914561;0<a;){var r=31-di(a),o=1<<r,l=s[r];l===-1?((o&n)===0||(o&i)!==0)&&(s[r]=Pw(o,t)):l<=t&&(e.expiredLanes|=o),a&=~o}if(t=Ne,n=ie,n=fd(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i=e.callbackNode,n===0||e===t&&(ye===2||ye===9)||e.cancelPendingCommit!==null)return i!==null&&i!==null&&dm(i),e.callbackNode=null,e.callbackPriority=0;if((n&3)===0||Lc(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(i!==null&&dm(i),e0(n)){case 2:case 8:n=vS;break;case 32:n=Hh;break;case 268435456:n=_S;break;default:n=Hh}return i=UM.bind(null,e),n=$g(n,i),e.callbackPriority=t,e.callbackNode=n,t}return i!==null&&i!==null&&dm(i),e.callbackPriority=2,e.callbackNode=null,2}function UM(e,t){if(ke!==0&&ke!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(Nd()&&e.callbackNode!==n)return null;var i=ie;return i=fd(e,e===Ne?i:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i===0?null:(bM(e,i,t),LM(e,ui()),e.callbackNode!=null&&e.callbackNode===n?UM.bind(null,e):null)}function Ux(e,t){if(Nd())return null;bM(e,t,!0)}function yC(){NC(function(){(de&6)!==0?$g(gS,_C):DM()})}function G0(){if(Sa===0){var e=Tr;e===0&&(e=$u,$u<<=1,($u&261888)===0&&($u=256)),Sa=e}return Sa}function Ix(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:xh(e)}function xC(e,t,n,i,s){if(t==="submit"&&n&&n.stateNode===s){var a=Ix((s[ei]||null).action),r=i.submitter;r&&(t=(t=r[ei]||null)?Ix(t.formAction):r.getAttribute("formAction"),t!==null&&(a=t,r=null));var o=new md("action","action",null,i,s);e.push({event:o,listeners:[{instance:null,listener:function(){if(i.defaultPrevented){if(Sa!==0){var l=new FormData(s,r);mg(n,{pending:!0,data:l,method:s.method,action:a},null,l)}}else typeof a=="function"&&(o.preventDefault(),l=new FormData(s,r),mg(n,{pending:!0,data:l,method:s.method,action:a},a,l))},currentTarget:s}]})}}for(ph=0;ph<sg.length;ph++)mh=sg[ph],Ox=mh.toLowerCase(),Px=mh[0].toUpperCase()+mh.slice(1),Vi(Ox,"on"+Px);var mh,Ox,Px,ph;Vi(WS,"onAnimationEnd");Vi(qS,"onAnimationIteration");Vi(YS,"onAnimationStart");Vi("dblclick","onDoubleClick");Vi("focusin","onFocus");Vi("focusout","onBlur");Vi(DA,"onTransitionRun");Vi(LA,"onTransitionStart");Vi(UA,"onTransitionCancel");Vi(ZS,"onTransitionEnd");Lo("onMouseEnter",["mouseout","mouseover"]);Lo("onMouseLeave",["mouseout","mouseover"]);Lo("onPointerEnter",["pointerout","pointerover"]);Lo("onPointerLeave",["pointerout","pointerover"]);Dr("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Dr("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Dr("onBeforeInput",["compositionend","keypress","textInput","paste"]);Dr("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Dr("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Dr("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var Mc="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),SC=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Mc));function IM(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var i=e[n],s=i.event;i=i.listeners;t:{var a=void 0;if(t)for(var r=i.length-1;0<=r;r--){var o=i[r],l=o.instance,c=o.currentTarget;if(o=o.listener,l!==a&&s.isPropagationStopped())break t;a=o,s.currentTarget=c;try{a(s)}catch(h){kh(h)}s.currentTarget=null,a=l}else for(r=0;r<i.length;r++){if(o=i[r],l=o.instance,c=o.currentTarget,o=o.listener,l!==a&&s.isPropagationStopped())break t;a=o,s.currentTarget=c;try{a(s)}catch(h){kh(h)}s.currentTarget=null,a=l}}}}function te(e,t){var n=t[Ny];n===void 0&&(n=t[Ny]=new Set);var i=e+"__bubble";n.has(i)||(OM(t,e,2,!1),n.add(i))}function Om(e,t,n){var i=0;t&&(i|=4),OM(n,e,i,t)}var gh="_reactListening"+Math.random().toString(36).slice(2);function H0(e){if(!e[gh]){e[gh]=!0,wS.forEach(function(n){n!=="selectionchange"&&(SC.has(n)||Om(n,!1,e),Om(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[gh]||(t[gh]=!0,Om("selectionchange",!1,t))}}function OM(e,t,n,i){switch(a1(t)){case 2:var s=fR;break;case 8:s=pR;break;default:s=Z0}n=s.bind(null,t,n,e),s=void 0,!tg||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(s=!0),i?s!==void 0?e.addEventListener(t,n,{capture:!0,passive:s}):e.addEventListener(t,n,!0):s!==void 0?e.addEventListener(t,n,{passive:s}):e.addEventListener(t,n,!1)}function Pm(e,t,n,i,s){var a=i;if((t&1)===0&&(t&2)===0&&i!==null)t:for(;;){if(i===null)return;var r=i.tag;if(r===3||r===4){var o=i.stateNode.containerInfo;if(o===s)break;if(r===4)for(r=i.return;r!==null;){var l=r.tag;if((l===3||l===4)&&r.stateNode.containerInfo===s)return;r=r.return}for(;o!==null;){if(r=mr(o),r===null)return;if(l=r.tag,l===5||l===6||l===26||l===27){i=a=r;continue t}o=o.parentNode}}i=i.return}IS(function(){var c=a,h=i0(n),f=[];t:{var u=jS.get(e);if(u!==void 0){var p=md,m=e;switch(e){case"keypress":if(bh(n)===0)break t;case"keydown":case"keyup":p=oA;break;case"focusin":m="focus",p=_m;break;case"focusout":m="blur",p=_m;break;case"beforeblur":case"afterblur":p=_m;break;case"click":if(n.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":p=zy;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":p=jw;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":p=dA;break;case WS:case qS:case YS:p=Qw;break;case ZS:p=pA;break;case"scroll":case"scrollend":p=Yw;break;case"wheel":p=gA;break;case"copy":case"cut":case"paste":p=tA;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":p=Gy;break;case"submit":p=uA;break;case"toggle":case"beforetoggle":p=_A}var S=(t&4)!==0,g=!S&&(e==="scroll"||e==="scrollend"),d=S?u!==null?u+"Capture":null:u;S=[];for(var v=c,b;v!==null;){var x=v;if(b=x.stateNode,x=x.tag,x!==5&&x!==26&&x!==27||b===null||d===null||(x=mc(v,d),x!=null&&S.push(Ec(v,x,b))),g)break;v=v.return}0<S.length&&(u=new p(u,m,null,n,h),f.push({event:u,listeners:S}))}}if((t&7)===0){t:{if(p=e==="mouseover"||e==="pointerover",u=e==="mouseout"||e==="pointerout",p&&n!==$m&&(m=n.relatedTarget||n.fromElement)&&(mr(m)||m[Xo]))break t;(u||p)&&(m=h.window===h?h:(p=h.ownerDocument)?p.defaultView||p.parentWindow:window,u?(p=n.relatedTarget||n.toElement,u=c,p=p?mr(p):null,p!==null&&(g=Nc(p),S=p.tag,p!==g||S!==5&&S!==27&&S!==6)&&(p=null)):(u=null,p=c),u!==p&&(S=zy,x="onMouseLeave",d="onMouseEnter",v="mouse",(e==="pointerout"||e==="pointerover")&&(S=Gy,x="onPointerLeave",d="onPointerEnter",v="pointer"),g=u==null?m:Ql(u),b=p==null?m:Ql(p),m=new S(x,v+"leave",u,n,h),m.target=g,m.relatedTarget=b,x=null,mr(h)===c&&(S=new S(d,v+"enter",p,n,h),S.target=b,S.relatedTarget=g,x=S),g=x,S=u&&p?Hm(u,p,bC):null,u!==null&&Bx(f,m,u,S,!1),p!==null&&g!==null&&Bx(f,g,p,S,!0)))}t:{if(u=c?Ql(c):window,p=u.nodeName&&u.nodeName.toLowerCase(),p==="select"||p==="input"&&u.type==="file")var T=Xy;else if(ky(u))if(GS)T=CA;else{T=wA;var E=TA}else p=u.nodeName,!p||p.toLowerCase()!=="input"||u.type!=="checkbox"&&u.type!=="radio"?c&&n0(c.elementType)&&(T=Xy):T=AA;if(T&&(T=T(e,c))){FS(f,T,n,h);break t}E&&E(e,u,c)}switch(E=c?Ql(c):window,e){case"focusin":(ky(E)||E.contentEditable==="true")&&(po=E,ng=c,ic=null);break;case"focusout":ic=ng=po=null;break;case"mousedown":ig=!0;break;case"contextmenu":case"mouseup":case"dragend":ig=!1,Zy(f,n,h);break;case"selectionchange":if(NA)break;case"keydown":case"keyup":Zy(f,n,h)}var w;if(r0)t:{switch(e){case"compositionstart":var _="onCompositionStart";break t;case"compositionend":_="onCompositionEnd";break t;case"compositionupdate":_="onCompositionUpdate";break t}_=void 0}else fo?BS(e,n)&&(_="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(_="onCompositionStart");_&&(PS&&n.locale!=="ko"&&(fo||_!=="onCompositionStart"?_==="onCompositionEnd"&&fo&&(w=OS()):(va=h,s0="value"in va?va.value:va.textContent,fo=!0)),E=ud(c,_),0<E.length&&(_=new Fy(_,e,null,n,h),f.push({event:_,listeners:E}),w?_.data=w:(w=zS(n),w!==null&&(_.data=w)))),(w=xA?SA(e,n):bA(e,n))&&(_=ud(c,"onBeforeInput"),0<_.length&&(E=new Fy("onBeforeInput","beforeinput",null,n,h),f.push({event:E,listeners:_}),E.data=w)),xC(f,e,c,n,h)}IM(f,t)})}function Ec(e,t,n){return{instance:e,listener:t,currentTarget:n}}function ud(e,t){for(var n=t+"Capture",i=[];e!==null;){var s=e,a=s.stateNode;if(s=s.tag,s!==5&&s!==26&&s!==27||a===null||(s=mc(e,n),s!=null&&i.unshift(Ec(e,s,a)),s=mc(e,t),s!=null&&i.push(Ec(e,s,a))),e.tag===3)return i;e=e.return}return[]}function bC(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function Bx(e,t,n,i,s){for(var a=t._reactName,r=[];n!==null&&n!==i;){var o=n,l=o.alternate,c=o.stateNode;if(o=o.tag,l!==null&&l===i)break;o!==5&&o!==26&&o!==27||c===null||(l=c,s?(c=mc(n,a),c!=null&&r.unshift(Ec(n,c,l))):s||(c=mc(n,a),c!=null&&r.push(Ec(n,c,l)))),n=n.return}r.length!==0&&e.push({event:t,listeners:r})}var MC=/\r\n?/g,EC=/\u0000|\uFFFD/g;function zx(e){return(typeof e=="string"?e:""+e).replace(MC,`
`).replace(EC,"")}function PM(e,t){return t=zx(t),zx(e)===t}function xe(e,t,n,i,s,a){switch(n){case"children":if(typeof i=="string")t==="body"||t==="textarea"&&i===""||Uo(e,i);else if(typeof i=="number"||typeof i=="bigint")t!=="body"&&Uo(e,""+i);else return;break;case"className":nh(e,"class",i);break;case"tabIndex":nh(e,"tabindex",i);break;case"dir":case"role":case"viewBox":case"width":case"height":nh(e,n,i);break;case"style":US(e,i,a);return;case"data":if(t!=="object"){nh(e,"data",i);break}case"src":case"href":if(i===""&&(t!=="a"||n!=="href")){e.removeAttribute(n);break}if(i==null||typeof i=="function"||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(n);break}i=xh(i),e.setAttribute(n,i);break;case"action":case"formAction":if(typeof i=="function"){e.setAttribute(n,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof a=="function"&&(n==="formAction"?(t!=="input"&&xe(e,t,"name",s.name,s,null),xe(e,t,"formEncType",s.formEncType,s,null),xe(e,t,"formMethod",s.formMethod,s,null),xe(e,t,"formTarget",s.formTarget,s,null)):(xe(e,t,"encType",s.encType,s,null),xe(e,t,"method",s.method,s,null),xe(e,t,"target",s.target,s,null)));if(i==null||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(n);break}i=xh(i),e.setAttribute(n,i);break;case"onClick":i!=null&&(e.onclick=cs);return;case"onScroll":i!=null&&te("scroll",e);return;case"onScrollEnd":i!=null&&te("scrollend",e);return;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(et(61));if(n=i.__html,n!=null){if(s.children!=null)throw Error(et(60));a?.__html!==n&&(e.innerHTML=n)}}break;case"multiple":e.multiple=i&&typeof i!="function"&&typeof i!="symbol";break;case"muted":e.muted=i&&typeof i!="function"&&typeof i!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(i==null||typeof i=="function"||typeof i=="boolean"||typeof i=="symbol"){e.removeAttribute("xlink:href");break}n=xh(i),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",n);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,i):e.removeAttribute(n);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":i&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,""):e.removeAttribute(n);break;case"capture":case"download":i===!0?e.setAttribute(n,""):i!==!1&&i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,i):e.removeAttribute(n);break;case"cols":case"rows":case"size":case"span":i!=null&&typeof i!="function"&&typeof i!="symbol"&&!isNaN(i)&&1<=i?e.setAttribute(n,i):e.removeAttribute(n);break;case"rowSpan":case"start":i==null||typeof i=="function"||typeof i=="symbol"||isNaN(i)?e.removeAttribute(n):e.setAttribute(n,i);break;case"popover":te("beforetoggle",e),te("toggle",e),yh(e,"popover",i);break;case"xlinkActuate":Ds(e,"http://www.w3.org/1999/xlink","xlink:actuate",i);break;case"xlinkArcrole":Ds(e,"http://www.w3.org/1999/xlink","xlink:arcrole",i);break;case"xlinkRole":Ds(e,"http://www.w3.org/1999/xlink","xlink:role",i);break;case"xlinkShow":Ds(e,"http://www.w3.org/1999/xlink","xlink:show",i);break;case"xlinkTitle":Ds(e,"http://www.w3.org/1999/xlink","xlink:title",i);break;case"xlinkType":Ds(e,"http://www.w3.org/1999/xlink","xlink:type",i);break;case"xmlBase":Ds(e,"http://www.w3.org/XML/1998/namespace","xml:base",i);break;case"xmlLang":Ds(e,"http://www.w3.org/XML/1998/namespace","xml:lang",i);break;case"xmlSpace":Ds(e,"http://www.w3.org/XML/1998/namespace","xml:space",i);break;case"is":yh(e,"is",i);break;case"innerText":case"textContent":return;default:if(!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")n=Ww.get(n)||n,yh(e,n,i);else return}ue=!0}function Gg(e,t,n,i,s,a){switch(n){case"style":US(e,i,a);return;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(et(61));if(n=i.__html,n!=null){if(s.children!=null)throw Error(et(60));a?.__html!==n&&(e.innerHTML=n)}}break;case"children":if(typeof i=="string")Uo(e,i);else if(typeof i=="number"||typeof i=="bigint")Uo(e,""+i);else return;break;case"onScroll":i!=null&&te("scroll",e);return;case"onScrollEnd":i!=null&&te("scrollend",e);return;case"onClick":i!=null&&(e.onclick=cs);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!AS.hasOwnProperty(n))t:{if(n[0]==="o"&&n[1]==="n"&&(s=n.endsWith("Capture"),a=n.slice(2,s?n.length-7:void 0),t=e[ei]||null,t=t!=null?t[n]:null,typeof t=="function"&&e.removeEventListener(a,t,s),typeof i=="function")){typeof t!="function"&&t!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(a,i,s);break t}ue=!0,n in e?e[n]=i:i===!0?e.setAttribute(n,""):yh(e,n,i)}return}ue=!0}function Mn(e,t,n){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":te("error",e),te("load",e);var i=!1,s=!1,a;for(a in n)if(n.hasOwnProperty(a)){var r=n[a];if(r!=null)switch(a){case"src":i=!0;break;case"srcSet":s=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(et(137,t));default:xe(e,t,a,r,n,null)}}s&&xe(e,t,"srcSet",n.srcSet,n,null),i&&xe(e,t,"src",n.src,n,null);return;case"input":te("invalid",e);var o=a=r=s=null,l=null,c=null;for(i in n)if(n.hasOwnProperty(i)){var h=n[i];if(h!=null)switch(i){case"name":s=h;break;case"type":r=h;break;case"checked":l=h;break;case"defaultChecked":c=h;break;case"value":a=h;break;case"defaultValue":o=h;break;case"children":case"dangerouslySetInnerHTML":if(h!=null)throw Error(et(137,t));break;default:xe(e,t,i,h,n,null)}}NS(e,a,o,l,c,r,s,!1);return;case"select":te("invalid",e),i=r=a=null;for(s in n)if(n.hasOwnProperty(s)&&(o=n[s],o!=null))switch(s){case"value":a=o;break;case"defaultValue":r=o;break;case"multiple":i=o;default:xe(e,t,s,o,n,null)}t=a,n=r,e.multiple=!!i,t!=null?bo(e,!!i,t,!1):n!=null&&bo(e,!!i,n,!0);return;case"textarea":te("invalid",e),a=s=i=null;for(r in n)if(n.hasOwnProperty(r)&&(o=n[r],o!=null))switch(r){case"value":i=o;break;case"defaultValue":s=o;break;case"children":a=o;break;case"dangerouslySetInnerHTML":if(o!=null)throw Error(et(91));break;default:xe(e,t,r,o,n,null)}LS(e,i,s,a);return;case"option":for(l in n)if(n.hasOwnProperty(l)&&(i=n[l],i!=null))switch(l){case"selected":e.selected=i&&typeof i!="function"&&typeof i!="symbol";break;default:xe(e,t,l,i,n,null)}return;case"dialog":te("beforetoggle",e),te("toggle",e),te("cancel",e),te("close",e);break;case"iframe":case"object":te("load",e);break;case"video":case"audio":for(i=0;i<Mc.length;i++)te(Mc[i],e);break;case"image":te("error",e),te("load",e);break;case"details":te("toggle",e);break;case"embed":case"source":case"link":te("error",e),te("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(c in n)if(n.hasOwnProperty(c)&&(i=n[c],i!=null))switch(c){case"children":case"dangerouslySetInnerHTML":throw Error(et(137,t));default:xe(e,t,c,i,n,null)}return;default:if(n0(t)){for(h in n)n.hasOwnProperty(h)&&(i=n[h],i!==void 0&&Gg(e,t,h,i,n,void 0));return}}for(o in n)n.hasOwnProperty(o)&&(i=n[o],i!=null&&xe(e,t,o,i,n,null))}var TC={};function wC(e,t,n,i){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var s=null,a=null,r=null,o=null,l=null,c=null,h=null;for(p in n){var f=n[p];if(n.hasOwnProperty(p)&&f!=null)switch(p){case"checked":break;case"value":break;case"defaultValue":l=f;default:i.hasOwnProperty(p)||xe(e,t,p,null,i,f)}}for(var u in i){var p=i[u];if(f=n[u],i.hasOwnProperty(u)&&(p!=null||f!=null))switch(u){case"type":p!==f&&(ue=!0),a=p;break;case"name":p!==f&&(ue=!0),s=p;break;case"checked":p!==f&&(ue=!0),c=p;break;case"defaultChecked":p!==f&&(ue=!0),h=p;break;case"value":p!==f&&(ue=!0),r=p;break;case"defaultValue":p!==f&&(ue=!0),o=p;break;case"children":case"dangerouslySetInnerHTML":if(p!=null)throw Error(et(137,t));break;default:p!==f&&xe(e,t,u,p,i,f)}}Qm(e,r,o,l,c,h,a,s);return;case"select":p=r=o=u=null;for(a in n)if(l=n[a],n.hasOwnProperty(a)&&l!=null)switch(a){case"value":break;case"multiple":p=l;default:i.hasOwnProperty(a)||xe(e,t,a,null,i,l)}for(s in i)if(a=i[s],l=n[s],i.hasOwnProperty(s)&&(a!=null||l!=null))switch(s){case"value":a!==l&&(ue=!0),u=a;break;case"defaultValue":a!==l&&(ue=!0),o=a;break;case"multiple":a!==l&&(ue=!0),r=a;default:a!==l&&xe(e,t,s,a,i,l)}t=o,n=r,i=p,u!=null?bo(e,!!n,u,!1):!!i!=!!n&&(t!=null?bo(e,!!n,t,!0):bo(e,!!n,n?[]:"",!1));return;case"textarea":p=u=null;for(o in n)if(s=n[o],n.hasOwnProperty(o)&&s!=null&&!i.hasOwnProperty(o))switch(o){case"value":break;case"children":break;default:xe(e,t,o,null,i,s)}for(r in i)if(s=i[r],a=n[r],i.hasOwnProperty(r)&&(s!=null||a!=null))switch(r){case"value":s!==a&&(ue=!0),u=s;break;case"defaultValue":s!==a&&(ue=!0),p=s;break;case"children":break;case"dangerouslySetInnerHTML":if(s!=null)throw Error(et(91));break;default:s!==a&&xe(e,t,r,s,i,a)}DS(e,u,p);return;case"option":for(var m in n)if(u=n[m],n.hasOwnProperty(m)&&u!=null&&!i.hasOwnProperty(m))switch(m){case"selected":e.selected=!1;break;default:xe(e,t,m,null,i,u)}for(l in i)if(u=i[l],p=n[l],i.hasOwnProperty(l)&&u!==p&&(u!=null||p!=null))switch(l){case"selected":u!==p&&(ue=!0),e.selected=u&&typeof u!="function"&&typeof u!="symbol";break;default:xe(e,t,l,u,i,p)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var S in n)u=n[S],n.hasOwnProperty(S)&&u!=null&&!i.hasOwnProperty(S)&&xe(e,t,S,null,i,u);for(c in i)if(u=i[c],p=n[c],i.hasOwnProperty(c)&&u!==p&&(u!=null||p!=null))switch(c){case"children":case"dangerouslySetInnerHTML":if(u!=null)throw Error(et(137,t));break;default:xe(e,t,c,u,i,p)}return;default:if(n0(t)){for(var g in n)u=n[g],n.hasOwnProperty(g)&&u!==void 0&&!i.hasOwnProperty(g)&&Gg(e,t,g,void 0,i,u);for(h in i)u=i[h],p=n[h],!i.hasOwnProperty(h)||u===p||u===void 0&&p===void 0||Gg(e,t,h,u,i,p);return}}for(var d in n)u=n[d],n.hasOwnProperty(d)&&u!=null&&!i.hasOwnProperty(d)&&xe(e,t,d,null,i,u);for(f in i)u=i[f],p=n[f],!i.hasOwnProperty(f)||u===p||u==null&&p==null||xe(e,t,f,u,i,p)}function Fx(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function AC(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,n=performance.getEntriesByType("resource"),i=0;i<n.length;i++){var s=n[i],a=s.transferSize,r=s.initiatorType,o=s.duration;if(a&&o&&Fx(r)){for(r=0,o=s.responseEnd,i+=1;i<n.length;i++){var l=n[i],c=l.startTime;if(c>o)break;var h=l.transferSize,f=l.initiatorType;h&&Fx(f)&&(l=l.responseEnd,r+=h*(l<o?1:(o-c)/(l-c)))}if(--i,t+=8*(a+r)/(s.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var Hg=null,Vg=null;function Tc(e){return e.nodeType===9?e:e.ownerDocument}function Gx(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function BM(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function zM(e,t,n,i){return n=Tc(n).createElement(e),n[yn]=i,n[ei]=t,Mn(n,e,t),fn(n),n}function kg(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Bm=null;function CC(){var e=window.event;return e&&e.type==="popstate"?e===Bm?!1:(Bm=e,!0):(Bm=null,!1)}var V0=typeof setTimeout=="function"?setTimeout:void 0,RC=typeof clearTimeout=="function"?clearTimeout:void 0,Hx=typeof Promise=="function"?Promise:void 0,Vx=typeof requestAnimationFrame=="function"?requestAnimationFrame:V0,NC=typeof queueMicrotask=="function"?queueMicrotask:typeof Hx<"u"?function(e){return Hx.resolve(null).then(e).catch(DC)}:V0;function DC(e){setTimeout(function(){throw e})}function za(e){return e==="head"}function kx(e,t){var n=t,i=0;do{var s=n.nextSibling;if(e.removeChild(n),s&&s.nodeType===8)if(n=s.data,n==="/$"||n==="/&"){if(i===0){e.removeChild(s),ko(t);return}i--}else if(n==="$"||n==="$?"||n==="$~"||n==="$!"||n==="&")i++;else if(n==="html")Fm(e.ownerDocument.documentElement);else if(n==="head"){n=e.ownerDocument.head,Fm(n);for(var a=n.firstChild;a;){var r=a.nextSibling,o=a.nodeName;a[Ic]||o==="SCRIPT"||o==="STYLE"||o==="LINK"&&a.rel.toLowerCase()==="stylesheet"||n.removeChild(a),a=r}}else n==="body"&&Fm(e.ownerDocument.body);n=s}while(n);ko(t)}function Xx(e,t){var n=e;e=0;do{var i=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display="none"):(n.style.display=n._stashedDisplay||"",n.getAttribute("style")===""&&n.removeAttribute("style")):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=""):n.nodeValue=n._stashedText||""),i&&i.nodeType===8)if(n=i.data,n==="/$"){if(e===0)break;e--}else n!=="$"&&n!=="$?"&&n!=="$~"&&n!=="$!"||e++;n=i}while(n)}function FM(e,t,n){if(t=CSS.escape(t)!==t?"r-"+btoa(t).replace(/=/g,""):t,e.style.viewTransitionName=t,n!=null&&(e.style.viewTransitionClass=n),n=getComputedStyle(e),n.display==="inline"){if(t=e.getClientRects(),t.length===1)var i=1;else for(var s=i=0;s<t.length;s++){var a=t[s];0<a.width&&0<a.height&&i++}i===1&&(e=e.style,e.display=t.length===1?"inline-block":"block",e.marginTop="-"+n.paddingTop,e.marginBottom="-"+n.paddingBottom)}}function GM(e,t){e=e.style,t=t.style;var n=t!=null?t.hasOwnProperty("viewTransitionName")?t.viewTransitionName:t.hasOwnProperty("view-transition-name")?t["view-transition-name"]:null:null;e.viewTransitionName=n==null||typeof n=="boolean"?"":(""+n).trim(),n=t!=null?t.hasOwnProperty("viewTransitionClass")?t.viewTransitionClass:t.hasOwnProperty("view-transition-class")?t["view-transition-class"]:null:null,e.viewTransitionClass=n==null||typeof n=="boolean"?"":(""+n).trim(),e.display==="inline-block"&&(t==null?e.display=e.margin="":(n=t.display,e.display=n==null||typeof n=="boolean"?"":n,n=t.margin,n!=null?e.margin=n:(n=t.hasOwnProperty("marginTop")?t.marginTop:t["margin-top"],e.marginTop=n==null||typeof n=="boolean"?"":n,t=t.hasOwnProperty("marginBottom")?t.marginBottom:t["margin-bottom"],e.marginBottom=t==null||typeof t=="boolean"?"":t)))}function HM(e,t,n){return n=n.ownerDocument.defaultView,{rect:e,abs:t.position==="absolute"||t.position==="fixed",clip:t.clipPath!=="none"||t.overflow!=="visible"||t.filter!=="none"||t.mask!=="none"||t.mask!=="none"||t.borderRadius!=="0px",view:0<=e.bottom&&0<=e.right&&e.top<=n.innerHeight&&e.left<=n.innerWidth}}function Xg(e){var t=e.getBoundingClientRect(),n=getComputedStyle(e);return HM(t,n,e)}function LC(e){var t=e.getBoundingClientRect();t=new DOMRect(t.x+2e4,t.y+2e4,t.width,t.height);var n=getComputedStyle(e);return HM(t,n,e)}function UC(e){return e.documentElement.clientHeight}function IC(e){this.addEventListener("load",e),this.addEventListener("error",e)}function OC(e,t,n,i,s,a,r,o,l){var c=t.nodeType===9?t:t.ownerDocument;try{var h=c.startViewTransition({update:function(){var u=c.defaultView,p=u.navigation&&u.navigation.transition,m=c.fonts.status;i();var S=[];if(m==="loaded"&&(UC(c),c.fonts.status==="loading"&&S.push(c.fonts.ready)),m=S.length,e!==null)for(var g=e.suspenseyImages,d=0,v=0;v<g.length;v++){var b=g[v];if(!b.complete){var x=b.getBoundingClientRect();if(0<x.bottom&&0<x.right&&x.top<u.innerHeight&&x.left<u.innerWidth){if(d+=$M(b),d>Oh){S.length=m;break}b=new Promise(IC.bind(b)),S.push(b)}}}if(0<S.length)return u=Promise.race([Promise.all(S),new Promise(function(T){return setTimeout(T,500)})]).then(s,s),(p?Promise.allSettled([p.finished,u]):u).then(a,a);if(s(),p)return p.finished.then(a,a);a()},types:n});c.__reactViewTransition=h;var f=[];return h.ready.then(function(){for(var u=c.documentElement.getAnimations({subtree:!0}),p=0;p<u.length;p++){var m=u[p],S=m.effect,g=S.pseudoElement;if(g!=null&&g.startsWith("::view-transition")){f.push(m),m=S.getKeyframes();for(var d=g=void 0,v=!0,b=0;b<m.length;b++){var x=m[b],T=x.width;if(g===void 0)g=T;else if(g!==T){v=!1;break}if(T=x.height,d===void 0)d=T;else if(d!==T){v=!1;break}delete x.width,delete x.height,x.transform==="none"&&delete x.transform}v&&g!==void 0&&d!==void 0&&(S.setKeyframes(m),v=getComputedStyle(S.target,S.pseudoElement),v.width!==g||v.height!==d)&&(v=m[0],v.width=g,v.height=d,v=m[m.length-1],v.width=g,v.height=d,S.setKeyframes(m))}}r()},function(u){c.__reactViewTransition===h&&(c.__reactViewTransition=null);try{if(typeof u=="object"&&u!==null)switch(u.name){case"InvalidStateError":(u.message==="View transition was skipped because document visibility state is hidden."||u.message==="Skipping view transition because document visibility state has become hidden."||u.message==="Skipping view transition because viewport size changed."||u.message==="Transition was aborted because of invalid state")&&(u=null)}u!==null&&l(u)}finally{i(),s(),r()}}),h.finished.finally(function(){for(var u=0;u<f.length;u++)f[u].cancel();c.__reactViewTransition===h&&(c.__reactViewTransition=null),o()}),h}catch{return i(),s(),r(),null}}function gr(e,t){this._scope=document.documentElement,this._selector="::view-transition-"+e+"("+t+")"}gr.prototype.animate=function(e,t){return t=typeof t=="number"?{duration:t}:De({},t),t.pseudoElement=this._selector,this._scope.animate(e,t)};gr.prototype.getAnimations=function(){for(var e=this._scope,t=this._selector,n=e.getAnimations({subtree:!0}),i=[],s=0;s<n.length;s++){var a=n[s].effect;a!==null&&a.target===e&&a.pseudoElement===t&&i.push(n[s])}return i};gr.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function VM(e){return{name:e,group:new gr("group",e),imagePair:new gr("image-pair",e),old:new gr("old",e),new:new gr("new",e)}}function mi(e){this._fragmentFiber=e,this._observers=this._eventListeners=null}mi.prototype.addEventListener=function(e,t,n){var i=null,s=null;if(!(n!=null&&typeof n!="boolean"&&(i=n.signal||null,i!==null&&i.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var a=this._eventListeners;if(kM(a,e,t,n)===-1){var r=this,o=t;n!=null&&typeof n!="boolean"&&n.once===!0&&(o=function(l){r.removeEventListener(e,t,n),typeof t=="function"?t.call(this,l):t.handleEvent(l)}),i!==null&&(s=r.removeEventListener.bind(r,e,t,n),i.addEventListener("abort",s,{once:!0}),s=i.removeEventListener.bind(i,"abort",s)),i=Fo(n),a.push({type:e,listener:t,optionsOrUseCapture:n,attachedListener:o,cleanup:s}),ti(this._fragmentFiber.child,!1,PC,e,o,i)}this._eventListeners=a}};function PC(e,t,n,i){return rn(e).addEventListener(t,n,i),!1}mi.prototype.removeEventListener=function(e,t,n){var i=this._eventListeners;if(i!==null&&(t=kM(i,e,t,n),t!==-1)){var s=i[t];n=s.attachedListener;var a=s.cleanup;s=Fo(s.optionsOrUseCapture),ti(this._fragmentFiber.child,!1,BC,e,n,s),i.splice(t,1),a!==null&&a()}};function BC(e,t,n,i){return rn(e).removeEventListener(t,n,i),!1}function Fo(e){return e!=null&&typeof e!="boolean"&&(e.once===!0||e.signal instanceof AbortSignal)?{capture:e.capture,passive:e.passive}:e}function Wx(e){return e==null?"c=0":typeof e=="boolean"?"c="+(e?"1":"0"):"c="+(e.capture?"1":"0")}function kM(e,t,n,i){if(e.length===0)return-1;i=Wx(i);for(var s=0;s<e.length;s++){var a=e[s];if(a.type===t&&a.listener===n&&Wx(a.optionsOrUseCapture)===i)return s}return-1}mi.prototype.dispatchEvent=function(e){var t=Nr(this._fragmentFiber);if(t===null)return!0;t=rn(t);var n=this._eventListeners;if(n!==null&&0<n.length||!e.bubbles){var i=t.nodeType===9?t.createComment(""):document.createTextNode("");if(n)for(var s=0;s<n.length;s++){var a=n[s];i.addEventListener(a.type,a.attachedListener,Fo(a.optionsOrUseCapture))}if(t.appendChild(i),e=i.dispatchEvent(e),n)for(s=0;s<n.length;s++)a=n[s],i.removeEventListener(a.type,a.attachedListener,Fo(a.optionsOrUseCapture));return t.removeChild(i),e}return t.dispatchEvent(e)};mi.prototype.focus=function(e){ti(this._fragmentFiber.child,!0,XM,e,void 0,void 0)};function XM(e,t){return e.tag===6?!1:(e=rn(e),jC(e,t))}mi.prototype.focusLast=function(e){var t=[];ti(this._fragmentFiber.child,!0,k0,t,void 0,void 0);for(var n=t.length-1;0<=n&&!XM(t[n],e);n--);};function k0(e,t){return t.push(e),!1}mi.prototype.blur=function(){var e=Nr(this._fragmentFiber);e!==null&&(e=rn(e),e=Tc(e).activeElement,e!==null&&ti(this._fragmentFiber.child,!1,zC,e,void 0,void 0))};function zC(e,t){return e.tag===6?!1:(e=rn(e),e===t||e.contains(t)?(t.blur(),!0):!1)}mi.prototype.observeUsing=function(e){this._observers===null&&(this._observers=new Set),this._observers.add(e),ti(this._fragmentFiber.child,!1,FC,e,void 0,void 0)};function FC(e,t){return e.tag===6||(e=rn(e),t.observe(e)),!1}mi.prototype.unobserveUsing=function(e){var t=this._observers;if(t!==null&&t.has(e)){t.delete(e),ti(this._fragmentFiber.child,!1,GC,e,void 0,void 0);for(var n=t=0;n<Gi.length;n++){var i=Gi[n];i.fragmentInstance===this&&i.observer===e?e.unobserve(i.instance):Gi[t++]=i}Gi.length=t}};function GC(e,t){return e.tag===6||(e=rn(e),t.unobserve(e)),!1}var Gi=[],zm=!1;function HC(e,t,n){Gi.push({fragmentInstance:e,observer:t,instance:n}),zm||(zm=!0,KC(function(){zm=!1;var i=Gi;Gi=[];for(var s=0;s<i.length;s++){var a=i[s];a.observer.unobserve(a.instance)}}))}mi.prototype.getClientRects=function(){var e=[];return ti(this._fragmentFiber.child,!1,VC,e,void 0,void 0),e};function VC(e,t){if(e.tag===6){e=e.stateNode;var n=e.ownerDocument.createRange();n.selectNodeContents(e),t.push.apply(t,n.getClientRects())}else e=rn(e),t.push.apply(t,e.getClientRects());return!1}mi.prototype.getRootNode=function(e){var t=Nr(this._fragmentFiber);return t===null?this:rn(t).getRootNode(e)};mi.prototype.compareDocumentPosition=function(e){var t=Nr(this._fragmentFiber);if(t===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var n=[];ti(this._fragmentFiber.child,!1,k0,n,void 0,void 0);var i=rn(t);if(n.length===0){if(n=i,Ey(this._fragmentFiber)){t:{for(t=this._fragmentFiber.return;t!==null;){if(t.tag===4){t=t.stateNode.containerInfo;break t}if(t.tag===3||t.tag===5||t.tag===27)break;t=t.return}t=null}t!=null&&(n=t)}t=this._fragmentFiber;var s=i=n.compareDocumentPosition(e);return n===e?s=Node.DOCUMENT_POSITION_CONTAINS:i&Node.DOCUMENT_POSITION_CONTAINED_BY&&(n=dS(t)[1],n===null?s=Node.DOCUMENT_POSITION_PRECEDING:(e=rn(n).compareDocumentPosition(e),s=e===0||e&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),s|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}t=rn(n[0]),s=rn(n[n.length-1]);var a=Ey(this._fragmentFiber)?t.parentElement:i;if(a==null)return Node.DOCUMENT_POSITION_DISCONNECTED;i=a.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_CONTAINED_BY,a=a.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_CONTAINED_BY;var r=t.compareDocumentPosition(e),o=s.compareDocumentPosition(e),l=r&Node.DOCUMENT_POSITION_CONTAINED_BY||o&Node.DOCUMENT_POSITION_CONTAINED_BY;return o=i&&a&&r&Node.DOCUMENT_POSITION_FOLLOWING&&o&Node.DOCUMENT_POSITION_PRECEDING,t=i&&t===e||a&&s===e||l||o?Node.DOCUMENT_POSITION_CONTAINED_BY:!i&&t===e||!a&&s===e?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:r,t&Node.DOCUMENT_POSITION_DISCONNECTED||t&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||kC(t,this._fragmentFiber,n[0],n[n.length-1],e)?t:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function kC(e,t,n,i,s){var a=mr(s);if(e&Node.DOCUMENT_POSITION_CONTAINED_BY){if(n=!!a)t:{for(;a!==null;){if(a.tag===7&&(a===t||a.alternate===t)){n=!0;break t}a=a.return}n=!1}return n}if(e&Node.DOCUMENT_POSITION_CONTAINS){if(a===null)return a=s.ownerDocument,s===a||s===a.documentElement||s===a.body;t:{for(a=t,t=Nr(t);a!==null;){if(!(a.tag!==5&&a.tag!==3&&a.tag!==27||a!==t&&a.alternate!==t)){a=!0;break t}a=a.return}a=!1}return a}return e&Node.DOCUMENT_POSITION_PRECEDING?((t=!!a)&&!(t=a===n)&&(t=Hm(n,a,Ty),t===null?t=!1:(ti(t,!0,yw,a,n),a=lo,lo=null,t=a!==null)),t):e&Node.DOCUMENT_POSITION_FOLLOWING?((t=!!a)&&!(t=a===i)&&(t=Hm(i,a,Ty),t===null?t=!1:(ti(t,!0,xw,a,i),a=lo,Gm=lo=null,t=a!==null)),t):!1}function qx(e,t){var n=e.ownerDocument.createRange();n.selectNodeContents(e),e=n.getBoundingClientRect(),window.scrollTo(window.scrollX+e.left,t?window.scrollY+e.top:window.scrollY+e.bottom-window.innerHeight)}mi.prototype.scrollIntoView=function(e){if(typeof e=="object")throw Error(et(566));var t=[];ti(this._fragmentFiber.child,!1,k0,t,void 0,void 0);var n=e!==!1;if(t.length===0){var i=dS(this._fragmentFiber);if(i=n?i[1]||i[0]||Nr(this._fragmentFiber):i[0]||i[1],i===null)return;if(i.tag===6){e=rn(i),qx(e,n);return}if(i=rn(i),i.nodeType!==9){if(i.nodeType===11){n="host"in i?i.host:null,n!==null&&n.scrollIntoView(e);return}i.scrollIntoView(e)}}for(i=n?t.length-1:0;i!==(n?-1:t.length);){var s=t[i];s.tag===6?(s=rn(s),qx(s,n)):rn(s).scrollIntoView(e),i+=n?-1:1}};function XC(e,t){return e=rn(e),WM(e,t),!1}function WM(e,t){e.reactFragments==null&&(e.reactFragments=new Set),e.reactFragments.add(t)}function qM(e,t){var n=t._eventListeners;if(n!==null)for(var i=0;i<n.length;i++){var s=n[i];e.addEventListener(s.type,s.attachedListener,Fo(s.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(a){for(var r=0,o=0;o<Gi.length;o++){var l=Gi[o];(l.fragmentInstance!==t||l.observer!==a||l.instance!==e)&&(Gi[r++]=l)}Gi.length=r,a.observe(e)}),WM(e,t))}function WC(e,t){var n=t._eventListeners;if(n!==null)for(var i=0;i<n.length;i++){var s=n[i];e.removeEventListener(s.type,s.attachedListener,Fo(s.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(a){typeof a.rootMargin=="string"?HC(t,a,e):a.unobserve(e)}),e.reactFragments!=null&&e.reactFragments.delete(t))}function Wg(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case"HTML":case"HEAD":case"BODY":Wg(n),pd(n);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(n.rel.toLowerCase()==="stylesheet")continue}e.removeChild(n)}}function qC(e,t,n,i){for(;e.nodeType===1;){var s=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!i&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(i){if(!e[Ic])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(a=e.getAttribute("rel"),a==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(a!==s.rel||e.getAttribute("href")!==(s.href==null||s.href===""?null:s.href)||e.getAttribute("crossorigin")!==(s.crossOrigin==null?null:s.crossOrigin)||e.getAttribute("title")!==(s.title==null?null:s.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(a=e.getAttribute("src"),(a!==(s.src==null?null:s.src)||e.getAttribute("type")!==(s.type==null?null:s.type)||e.getAttribute("crossorigin")!==(s.crossOrigin==null?null:s.crossOrigin))&&a&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var a=s.name==null?null:""+s.name;if(s.type==="hidden"&&e.getAttribute("name")===a)return e}else return e;if(e=Ui(e.nextSibling),e===null)break}return null}function YC(e,t,n){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!n||(e=Ui(e.nextSibling),e===null))return null;return e}function YM(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=Ui(e.nextSibling),e===null))return null;return e}function qg(e){return e.data==="$?"||e.data==="$~"}function X0(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function ZC(e,t){var n=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||n.readyState!=="loading")t();else{var i=function(){t(),n.removeEventListener("DOMContentLoaded",i)};n.addEventListener("DOMContentLoaded",i),e._reactRetry=i}}function Ui(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var Yg=null;function Yx(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"||n==="/&"){if(t===0)return Ui(e.nextSibling);t--}else n!=="$"&&n!=="$!"&&n!=="$?"&&n!=="$~"&&n!=="&"||t++}e=e.nextSibling}return null}function Zx(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"){if(t===0)return e;t--}else n!=="/$"&&n!=="/&"||t++}e=e.previousSibling}return null}function jC(e,t){function n(){i=!0}if(e.ownerDocument.activeElement===e)return!0;var i=!1;try{e.ownerDocument.addEventListener("focus",n,!0),(e.focus||HTMLElement.prototype.focus).call(e,t)}finally{e.ownerDocument.removeEventListener("focus",n,!0)}return i}function KC(e){Vx(function(){Vx(function(t){return e(t)})})}function ZM(e,t,n){switch(t=Tc(n),e){case"html":if(e=t.documentElement,!e)throw Error(et(452));return e;case"head":if(e=t.head,!e)throw Error(et(453));return e;case"body":if(e=t.body,!e)throw Error(et(454));return e;default:throw Error(et(451))}}function jM(e,t,n){for(var i in n){var s=n[i];n.hasOwnProperty(i)&&s!=null&&xe(e,t,i,null,TC,s)}n.dangerouslySetInnerHTML!=null&&(e.textContent=""),e.onclick===cs&&(e.onclick=null),pd(e)}function Fm(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);pd(e)}var Ii=new Map,jx=new Set;function wc(e){if(typeof e.getRootNode=="function"){var t=e.getRootNode();if(t.nodeType===9||t.nodeType===11)return t}return e.nodeType===9?e:e.ownerDocument}var Ws=fe.d;fe.d={f:JC,r:QC,D:$C,C:tR,L:eR,m:nR,X:sR,S:iR,M:aR};function JC(){var e=Ws.f(),t=Cd();return e||t}function QC(e){var t=Wo(e);t!==null&&t.tag===5&&t.type==="form"?Ub(t):Ws.r(e)}var jo=typeof document>"u"?null:document;function KM(e,t,n){var i=jo;if(i&&typeof t=="string"&&t){var s=Ni(t);s='link[rel="'+e+'"][href="'+s+'"]',typeof n=="string"&&(s+='[crossorigin="'+n+'"]'),jx.has(s)||(jx.add(s),e={rel:e,crossOrigin:n,href:t},i.querySelector(s)===null&&(t=i.createElement("link"),Mn(t,"link",e),fn(t),i.head.appendChild(t)))}}function $C(e){Ws.D(e),KM("dns-prefetch",e,null)}function tR(e,t){Ws.C(e,t),KM("preconnect",e,t)}function eR(e,t,n){Ws.L(e,t,n);var i=jo;if(i&&e&&t){var s='link[rel="preload"][as="'+Ni(t)+'"]';t==="image"&&n&&n.imageSrcSet?(s+='[imagesrcset="'+Ni(n.imageSrcSet)+'"]',typeof n.imageSizes=="string"&&(s+='[imagesizes="'+Ni(n.imageSizes)+'"]')):s+='[href="'+Ni(e)+'"]';var a=s;switch(t){case"style":a=Go(e);break;case"script":a=Ko(e)}if(!(Ii.has(a)||(e=De({rel:"preload",href:t==="image"&&n&&n.imageSrcSet?void 0:e,as:t},n),Ii.set(a,e),i.querySelector(s)!==null||t==="style"&&i.querySelector(Gc(a))||t==="script"&&i.querySelector(Hc(a))))){var r=i.createElement("link");Mn(r,"link",e),t==="style"&&(r[Vh]=!0,r.onload=r.onerror=function(){TS(r)}),fn(r),i.head.appendChild(r)}}}function nR(e,t){Ws.m(e,t);var n=jo;if(n&&e){var i=t&&typeof t.as=="string"?t.as:"script",s='link[rel="modulepreload"][as="'+Ni(i)+'"][href="'+Ni(e)+'"]',a=s;switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":a=Ko(e)}if(!Ii.has(a)&&(e=De({rel:"modulepreload",href:e},t),Ii.set(a,e),n.querySelector(s)===null)){switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(n.querySelector(Hc(a)))return}i=n.createElement("link"),Mn(i,"link",e),fn(i),n.head.appendChild(i)}}}function iR(e,t,n){Ws.S(e,t,n);var i=jo;if(i&&e){var s=So(i).hoistableStyles,a=Go(e);t=t||"default";var r=s.get(a);if(!r){var o={loading:0,preload:null};if(r=i.querySelector(Gc(a)))o.loading=5;else{e=De({rel:"stylesheet",href:e,"data-precedence":t},n),(n=Ii.get(a))&&W0(e,n);var l=r=i.createElement("link");fn(l),Mn(l,"link",e),l._p=new Promise(function(c,h){l.onload=c,l.onerror=h}),l.addEventListener("load",function(){o.loading|=1}),l.addEventListener("error",function(){o.loading|=2}),o.loading|=4,Uh(r,t,i)}r={type:"stylesheet",instance:r,count:1,state:o},s.set(a,r)}}}function sR(e,t){Ws.X(e,t);var n=jo;if(n&&e){var i=So(n).hoistableScripts,s=Ko(e),a=i.get(s);a||(a=n.querySelector(Hc(s)),a||(e=De({src:e,async:!0},t),(t=Ii.get(s))&&q0(e,t),a=n.createElement("script"),fn(a),Mn(a,"link",e),n.head.appendChild(a)),a={type:"script",instance:a,count:1,state:null},i.set(s,a))}}function aR(e,t){Ws.M(e,t);var n=jo;if(n&&e){var i=So(n).hoistableScripts,s=Ko(e),a=i.get(s);a||(a=n.querySelector(Hc(s)),a||(e=De({src:e,async:!0,type:"module"},t),(t=Ii.get(s))&&q0(e,t),a=n.createElement("script"),fn(a),Mn(a,"link",e),n.head.appendChild(a)),a={type:"script",instance:a,count:1,state:null},i.set(s,a))}}function Kx(e,t,n,i){var s=(s=ba.current)?wc(s):null;if(!s)throw Error(et(446));switch(e){case"meta":case"title":return null;case"style":return typeof n.precedence=="string"&&typeof n.href=="string"?(n=Go(n.href),t=So(s).hoistableStyles,i=t.get(n),i||(i={type:"style",instance:null,count:0,state:null},t.set(n,i)),i):{type:"void",instance:null,count:0,state:null};case"link":if(n.rel==="stylesheet"&&typeof n.href=="string"&&typeof n.precedence=="string"){e=Go(n.href);var a=So(s).hoistableStyles,r=a.get(e);if(r||(s=s.ownerDocument||s,r={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},a.set(e,r),(a=s.querySelector(Gc(e)))?a._p||(r.instance=a,r.state.loading=5):(a=Ii.get(e),a||(a={rel:"preload",as:"style",href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},Ii.set(e,a)),rR(s,e,a,r.state))),t&&i===null)throw Error(et(528,""));return r}if(t&&i!==null)throw Error(et(529,""));return null;case"script":return t=n.async,n=n.src,typeof n=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(n=Ko(n),t=So(s).hoistableScripts,i=t.get(n),i||(i={type:"script",instance:null,count:0,state:null},t.set(n,i)),i):{type:"void",instance:null,count:0,state:null};default:throw Error(et(444,e))}}function Go(e){return'href="'+Ni(e)+'"'}function Gc(e){return'link[rel="stylesheet"]['+e+"]"}function JM(e){return De({},e,{"data-precedence":e.precedence,precedence:null})}function rR(e,t,n,i){if(t=e.querySelector('link[rel="preload"][as="style"]['+t+"]")){if(t[Vh]!==!0){i.loading=1;return}}else t=e.createElement("link"),t[Vh]=!0,t.onload=t.onerror=TS.bind(null,t),Mn(t,"link",n),fn(t),e.head.appendChild(t);i.preload=t,t.addEventListener("load",function(){return i.loading|=1}),t.addEventListener("error",function(){return i.loading|=2})}function Ko(e){return'[src="'+Ni(e)+'"]'}function Hc(e){return"script[async]"+e}function Jx(e,t,n){if(t.count++,t.instance===null)switch(t.type){case"style":var i=e.querySelector('style[data-href~="'+Ni(n.href)+'"]');if(i)return t.instance=i,fn(i),i;var s=De({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return i=(e.ownerDocument||e).createElement("style"),fn(i),Mn(i,"style",s),Uh(i,n.precedence,e),t.instance=i;case"stylesheet":s=Go(n.href);var a=e.querySelector(Gc(s));if(a)return t.state.loading|=4,t.instance=a,fn(a),a;i=JM(n),(s=Ii.get(s))&&W0(i,s),a=(e.ownerDocument||e).createElement("link"),fn(a);var r=a;return r._p=new Promise(function(o,l){r.onload=o,r.onerror=l}),Mn(a,"link",i),t.state.loading|=4,Uh(a,n.precedence,e),t.instance=a;case"script":return a=Ko(n.src),(s=e.querySelector(Hc(a)))?(t.instance=s,fn(s),s):(i=n,(s=Ii.get(a))&&(i=De({},n),q0(i,s)),e=e.ownerDocument||e,s=e.createElement("script"),fn(s),Mn(s,"link",i),e.head.appendChild(s),t.instance=s);case"void":return null;default:throw Error(et(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(i=t.instance,t.state.loading|=4,Uh(i,n.precedence,e));return t.instance}function Uh(e,t,n){for(var i=n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),s=i.length?i[i.length-1]:null,a=s,r=0;r<i.length;r++){var o=i[r];if(o.dataset.precedence===t)a=o;else if(a!==s)break}a?a.parentNode.insertBefore(e,a.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function W0(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function q0(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var Ih=null;function Qx(e,t,n){if(Ih===null){var i=new Map,s=Ih=new Map;s.set(n,i)}else s=Ih,i=s.get(n),i||(i=new Map,s.set(n,i));if(i.has(e))return i;for(i.set(e,null),n=n.getElementsByTagName(e),s=0;s<n.length;s++){var a=n[s];if(!(a[Ic]||a[yn]||e==="link"&&a.getAttribute("rel")==="stylesheet")&&a.namespaceURI!=="http://www.w3.org/2000/svg"){var r=a.getAttribute(t)||"";r=e+r;var o=i.get(r);o?o.push(a):i.set(r,[a])}}return i}function Zg(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t==="title"?e.querySelector("head > title"):null)}function oR(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;switch(t.rel){case"stylesheet":return e=t.disabled,typeof t.precedence=="string"&&e==null;default:return!0}case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function $x(e,t){return e==="img"&&t.src!=null&&t.src!==""&&t.onLoad==null&&t.loading!=="lazy"}function QM(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}function $M(e){return(e.width||100)*(e.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function tS(e,t){typeof t.decode=="function"&&(e.imgCount++,t.complete||(e.imgBytes+=$M(t),e.suspenseyImages.push(t)),e=uR.bind(e),t.decode().then(e,e))}function lR(e,t,n,i){if(n.type==="stylesheet"&&(typeof i.media!="string"||matchMedia(i.media).matches!==!1)&&(n.state.loading&4)===0){if(n.instance===null){var s=Go(i.href),a=t.querySelector(Gc(s));if(a){t=a._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=Ac.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=a,fn(a);return}a=t.ownerDocument||t,i=JM(i),(s=Ii.get(s))&&W0(i,s),a=a.createElement("link"),fn(a);var r=a;r._p=new Promise(function(o,l){r.onload=o,r.onerror=l}),Mn(a,"link",i),n.instance=a}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&(n.state.loading&3)===0&&(e.count++,n=Ac.bind(e),t.addEventListener("load",n),t.addEventListener("error",n))}}var Oh=0;function cR(e,t){return e.stylesheets&&e.count===0&&Ph(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var i=setTimeout(function(){if(e.stylesheets&&Ph(e,e.stylesheets),e.unsuspend){var a=e.unsuspend;e.unsuspend=null,a()}},6e4+t);0<e.imgBytes&&Oh===0&&(Oh=62500*AC());var s=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&Ph(e,e.stylesheets),e.unsuspend)){var a=e.unsuspend;e.unsuspend=null,a()}},(e.imgBytes>Oh?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(i),clearTimeout(s)}}:null}function t1(e){if(e.count===0&&(e.imgCount===0||!e.waitingForImages)){if(e.stylesheets)Ph(e,e.stylesheets);else if(e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}}}function Ac(){this.count--,t1(this)}function uR(){this.imgCount--,t1(this)}var hd=null;function Ph(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,hd=new Map,t.forEach(hR,e),hd=null,Ac.call(e))}function hR(e,t){if(!(t.state.loading&4)){var n=hd.get(e);if(n)var i=n.get(null);else{n=new Map,hd.set(e,n);for(var s=e.querySelectorAll("link[data-precedence],style[data-precedence]"),a=0;a<s.length;a++){var r=s[a];(r.nodeName==="LINK"||r.getAttribute("media")!=="not all")&&(n.set(r.dataset.precedence,r),i=r)}i&&n.set(null,i)}s=t.instance,r=s.getAttribute("data-precedence"),a=n.get(r)||i,a===i&&n.set(null,s),n.set(r,s),this.count++,i=Ac.bind(this),s.addEventListener("load",i),s.addEventListener("error",i),a?a.parentNode.insertBefore(s,a.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(s,e.firstChild)),t.state.loading|=4}}var Ho={$$typeof:ls,Provider:null,Consumer:null,_currentValue:vr,_currentValue2:vr,_threadCount:0};function dR(e,t,n,i,s,a,r,o,l){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=fm(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=fm(0),this.hiddenUpdates=fm(null),this.identifierPrefix=i,this.onUncaughtError=s,this.onCaughtError=a,this.onRecoverableError=r,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=l,this.transitionTypes=null,this.incompleteTransitions=new Map}function e1(e,t,n,i,s,a,r,o,l,c,h,f){return e=new dR(e,t,n,r,l,c,h,f,o),t=1,a===!0&&(t|=24),a=Qn(3,null,null,t),e.current=a,a.stateNode=e,t=d0(),t.refCount++,e.pooledCache=t,t.refCount++,a.memoizedState={element:i,isDehydrated:n,cache:t},m0(a),e}function n1(e){return e?(e=vo,e):vo}function i1(e,t,n,i,s,a){s=n1(s),i.context===null?i.context=s:i.pendingContext=s,i=Ea(t),i.payload={element:n},a=a===void 0?null:a,a!==null&&(i.callback=a),n=Ta(e,i,t),n!==null&&($n(n,e,t),ac(n,e,t))}function eS(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function Y0(e,t){eS(e,t),(e=e.alternate)&&eS(e,t)}function s1(e){if(e.tag===13||e.tag===31){var t=Ur(e,67108864);t!==null&&$n(t,e,67108864),Y0(e,67108864)}}function nS(e){if(e.tag===13||e.tag===31){var t=fi();t=t0(t);var n=Ur(e,t);n!==null&&$n(n,e,t),Y0(e,t)}}var Vo=!0;function fR(e,t,n,i){var s=Bt.T;Bt.T=null;var a=fe.p;try{fe.p=2,Z0(e,t,n,i)}finally{fe.p=a,Bt.T=s}}function pR(e,t,n,i){var s=Bt.T;Bt.T=null;var a=fe.p;try{fe.p=8,Z0(e,t,n,i)}finally{fe.p=a,Bt.T=s}}function Z0(e,t,n,i){if(Vo){var s=jg(i);if(s===null)Pm(e,t,i,dd,n),iS(e,i);else if(gR(s,e,t,n,i))i.stopPropagation();else if(iS(e,i),t&4&&-1<mR.indexOf(e)){for(;s!==null;){var a=Wo(s);if(a!==null)switch(a.tag){case 3:if(a=a.stateNode,a.current.memoizedState.isDehydrated){var r=dr(a.pendingLanes);if(r!==0){var o=a;for(o.pendingLanes|=2,o.entangledLanes|=2;r;){var l=1<<31-di(r);o.entanglements[1]|=l,r&=~l}gs(a),(de&6)===0&&(rd=ui()+500,Fc(0,!1))}}break;case 31:case 13:o=Ur(a,2),o!==null&&$n(o,a,2),Cd(),Y0(a,2)}if(a=jg(i),a===null&&Pm(e,t,i,dd,n),a===s)break;s=a}s!==null&&i.stopPropagation()}else Pm(e,t,i,null,n)}}function jg(e){return e=i0(e),j0(e)}var dd=null;function j0(e){if(dd=null,e=mr(e),e!==null){var t=Nc(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=cS(t),e!==null)return e;e=null}else if(n===31){if(e=uS(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return dd=e,null}function a1(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(Rw()){case gS:return 2;case vS:return 8;case Hh:case Nw:return 32;case _S:return 268435456;default:return 32}default:return 32}}var Kg=!1,Ra=null,Na=null,Da=null,Cc=new Map,Rc=new Map,ma=[],mR="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function iS(e,t){switch(e){case"focusin":case"focusout":Ra=null;break;case"dragenter":case"dragleave":Na=null;break;case"mouseover":case"mouseout":Da=null;break;case"pointerover":case"pointerout":Cc.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":Rc.delete(t.pointerId)}}function Zl(e,t,n,i,s,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:i,nativeEvent:a,targetContainers:[s]},t!==null&&(t=Wo(t),t!==null&&s1(t)),e):(e.eventSystemFlags|=i,t=e.targetContainers,s!==null&&t.indexOf(s)===-1&&t.push(s),e)}function gR(e,t,n,i,s){switch(t){case"focusin":return Ra=Zl(Ra,e,t,n,i,s),!0;case"dragenter":return Na=Zl(Na,e,t,n,i,s),!0;case"mouseover":return Da=Zl(Da,e,t,n,i,s),!0;case"pointerover":var a=s.pointerId;return Cc.set(a,Zl(Cc.get(a)||null,e,t,n,i,s)),!0;case"gotpointercapture":return a=s.pointerId,Rc.set(a,Zl(Rc.get(a)||null,e,t,n,i,s)),!0}return!1}function r1(e){var t=mr(e.target);if(t!==null){var n=Nc(t);if(n!==null){if(t=n.tag,t===13){if(t=cS(n),t!==null){e.blockedOn=t,Ry(e.priority,function(){nS(n)});return}}else if(t===31){if(t=uS(n),t!==null){e.blockedOn=t,Ry(e.priority,function(){nS(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function Bh(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=jg(e.nativeEvent);if(n===null){n=e.nativeEvent;var i=new n.constructor(n.type,n);$m=i,n.target.dispatchEvent(i),$m=null}else return t=Wo(n),t!==null&&s1(t),e.blockedOn=n,!1;t.shift()}return!0}function sS(e,t,n){Bh(e)&&n.delete(t)}function vR(){Kg=!1,Ra!==null&&Bh(Ra)&&(Ra=null),Na!==null&&Bh(Na)&&(Na=null),Da!==null&&Bh(Da)&&(Da=null),Cc.forEach(sS),Rc.forEach(sS)}function vh(e,t){e.blockedOn===t&&(e.blockedOn=null,Kg||(Kg=!0,on.unstable_scheduleCallback(on.unstable_NormalPriority,vR)))}var _h=null;function aS(e){_h!==e&&(_h=e,on.unstable_scheduleCallback(on.unstable_NormalPriority,function(){_h===e&&(_h=null);for(var t=0;t<e.length;t+=3){var n=e[t],i=e[t+1],s=e[t+2];if(typeof i!="function"){if(j0(i||n)===null)continue;break}var a=Wo(n);a!==null&&(e.splice(t,3),t-=3,mg(a,{pending:!0,data:s,method:n.method,action:i},i,s))}}))}function ko(e){function t(l){return vh(l,e)}Ra!==null&&vh(Ra,e),Na!==null&&vh(Na,e),Da!==null&&vh(Da,e),Cc.forEach(t),Rc.forEach(t);for(var n=0;n<ma.length;n++){var i=ma[n];i.blockedOn===e&&(i.blockedOn=null)}for(;0<ma.length&&(n=ma[0],n.blockedOn===null);)r1(n),n.blockedOn===null&&ma.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(i=0;i<n.length;i+=3){var s=n[i],a=n[i+1],r=s[ei]||null;if(typeof a=="function")r||aS(n);else if(r){var o=null;if(a&&a.hasAttribute("formAction")){if(s=a,r=a[ei]||null)o=r.formAction;else if(j0(s)!==null)continue}else o=r.action;typeof o=="function"?n[i+1]=o:(n.splice(i,3),i-=3),aS(n)}}}function o1(){function e(a){a.canIntercept&&a.info==="react-transition"&&a.intercept({handler:function(){return new Promise(function(r){return s=r})},focusReset:"manual",scroll:"manual"})}function t(){s!==null&&(s(),s=null),i||setTimeout(n,20)}function n(){if(!i&&!navigation.transition){var a=navigation.currentEntry;a&&a.url!=null&&navigation.navigate(a.url,{state:a.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var i=!1,s=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(n,100),function(){i=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),s!==null&&(s(),s=null)}}}function K0(e){this._internalRoot=e}Dd.prototype.render=K0.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(et(409));var n=t.current,i=fi();i1(n,i,e,t,null,null)};Dd.prototype.unmount=K0.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;i1(e.current,2,null,e,null,null),Cd(),t[Xo]=null}};function Dd(e){this._internalRoot=e}Dd.prototype.unstable_scheduleHydration=function(e){if(e){var t=ES();e={blockedOn:null,target:e,priority:t};for(var n=0;n<ma.length&&t!==0&&t<ma[n].priority;n++);ma.splice(n,0,e),n===0&&r1(e)}};var rS=oS.version;if(rS!=="19.3.0")throw Error(et(527,rS,"19.3.0"));fe.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(et(188)):(e=Object.keys(e).join(","),Error(et(268,e)));return e=_w(t),e=e!==null?hS(e):null,e=e===null?null:e.stateNode,e};var _R={bundleType:0,version:"19.3.0",rendererPackageName:"react-dom",currentDispatcherRef:Bt,reconcilerVersion:"19.3.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(jl=__REACT_DEVTOOLS_GLOBAL_HOOK__,!jl.isDisabled&&jl.supportsFiber))try{Dc=jl.inject(_R),hi=jl}catch{}var jl;Ld.createRoot=function(e,t){if(!lS(e))throw Error(et(299));var n=!1,i="",s=Hb,a=Vb,r=kb;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(i=t.identifierPrefix),t.onUncaughtError!==void 0&&(s=t.onUncaughtError),t.onCaughtError!==void 0&&(a=t.onCaughtError),t.onRecoverableError!==void 0&&(r=t.onRecoverableError)),t=e1(e,1,!1,null,null,n,i,null,s,a,r,o1),e[Xo]=t.current,H0(e),new K0(t)};Ld.hydrateRoot=function(e,t,n){if(!lS(e))throw Error(et(299));var i=!1,s="",a=Hb,r=Vb,o=kb,l=null;return n!=null&&(n.unstable_strictMode===!0&&(i=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onUncaughtError!==void 0&&(a=n.onUncaughtError),n.onCaughtError!==void 0&&(r=n.onCaughtError),n.onRecoverableError!==void 0&&(o=n.onRecoverableError),n.formState!==void 0&&(l=n.formState)),t=e1(e,1,!0,t,n??null,i,s,l,a,r,o,o1),t.context=n1(null),n=t.current,i=fi(),i=t0(i),s=Ea(i),s.callback=null,Ta(n,s,i),n=i,t.current.lanes=n,Uc(t,n),gs(t),e[Xo]=t.current,H0(e),new Dd(t)};Ld.version="19.3.0"});var h1=ts((_I,u1)=>{"use strict";function c1(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(c1)}catch(e){console.error(e)}}c1(),u1.exports=l1()});var ot=es($r(),1);var Re=es($r(),1);var $p=["callers","entrypoints","callees","tests"],iw={callers:96,entrypoints:382,callees:668,tests:382};function Xu(e,t={}){let n=Math.max(820,Number(t.width)||980),i=Math.max(480,Number(t.height)||620),s=new Map,a=[...e.nodes||[]].sort((o,l)=>Z_(o.lane)-Z_(l.lane)||String(o.path).localeCompare(String(l.path))||Number(o.span?.start||0)-Number(l.span?.start||0)||si(o).localeCompare(si(l))).map(o=>{let l=$p.includes(o.lane)?o.lane:"entrypoints",c=s.get(l)||0;s.set(l,c+1);let h=l==="tests"?448+c*92:152+c*92,f=t.pins?.[si(o)];return{...o,lane:l,x:f?.x??iw[l],y:f?.y??h,pinned:!!f,width:216,height:64}}),r=aw(a);return{width:n,height:Math.max(i,rw(a)),nodes:a,containers:r}}function Fl(e,t={}){let n=Math.max(980,Number(t.width)||1180),i=Math.max(620,Number(t.height)||760),s=[...e.nodes||[]].sort((g,d)=>String(g.community).localeCompare(String(d.community))||Number(d.degree||0)-Number(g.degree||0)||si(g).localeCompare(si(d))),a=[...e.communities||[]].map(g=>({...g,members:s.filter(d=>d.community===g.id)})).filter(g=>g.members.length).sort((g,d)=>d.members.length-g.members.length||g.id.localeCompare(d.id)),r=n/2,o=i/2,l=Math.max(112,Math.min(n,i)*.34),c=new Map;a.forEach((g,d)=>{if(a.length===1){c.set(g.id,{x:r,y:o});return}let v=Math.sqrt((d+.7)/Math.max(1,a.length)),b=d*2.399963229728653-Math.PI/2;c.set(g.id,{x:r+Math.cos(b)*l*v,y:o+Math.sin(b)*l*v})});let h=[],f=["#58d6c7","#7aa7ff","#b999ff","#f0a36b","#e27fa8","#80d68a","#73c7ff","#d9bd6d"];for(let g of a){let d=c.get(g.id),v=g.members;v.forEach((b,x)=>{let T=Math.max(5,Math.min(17,5+Math.log2(Number(b.degree||0)+1)*1.9)),E=t.pins?.[si(b)],w=j_(si(b)),_=v.length===1?0:30+Math.sqrt(x+1)*34;h.push({...b,x:E?.x??d.x+Math.cos(w)*_,y:E?.y??d.y+Math.sin(w)*_,vx:0,vy:0,radius:T,color:f[Math.max(0,a.findIndex(A=>A.id===g.id))%f.length],pinned:!!E})})}sw(h,e.edges||[],c,n,i,t.pins||{});let u=a.map(g=>{let d=h.filter(T=>T.community===g.id),v=d.reduce((T,E)=>T+E.x,0)/Math.max(1,d.length),b=d.reduce((T,E)=>T+E.y,0)/Math.max(1,d.length),x=Math.max(46,...d.map(T=>Math.hypot(T.x-v,T.y-b)+T.radius+34));return{...g,x:v,y:b,radius:x}}),p=[...h].sort((g,d)=>Number(d.degree||0)-Number(g.degree||0)),m=Math.min(36,Math.max(16,Math.floor(n/52)),p.length),S=new Set(p.slice(0,m).map(si));return{width:n,height:i,communities:u,nodes:h.map(({vx:g,vy:d,...v})=>({...v,showLabel:S.has(si(v))}))}}function sw(e,t,n,i,s,a){if(e.length<2)return;let r=new Map(e.map((c,h)=>[si(c),h])),o=t.map(c=>({source:r.get(String(c.source)),target:r.get(String(c.target)),weight:Math.max(1,Number(c.weight||1))})).filter(c=>c.source!==void 0&&c.target!==void 0&&c.source!==c.target),l=32;for(let c=0;c<180;c+=1){let h=1-c/180;for(let f=0;f<e.length;f+=1){let u=e[f];for(let p=f+1;p<e.length;p+=1){let m=e[p],S=m.x-u.x,g=m.y-u.y,d=S*S+g*g;if(d<.01){let w=j_(`${si(u)}:${si(m)}`);S=Math.cos(w)*.1,g=Math.sin(w)*.1,d=.01}let v=Math.sqrt(d),b=(u.community===m.community?980:1420)*h/d,x=S/v*b,T=g/v*b;u.vx-=x,u.vy-=T,m.vx+=x,m.vy+=T;let E=u.radius+m.radius+10;if(v<E){let w=(E-v)*.08*h,_=S/v*w,A=g/v*w;u.vx-=_,u.vy-=A,m.vx+=_,m.vy+=A}}}for(let f of o){let u=e[f.source],p=e[f.target],m=p.x-u.x,S=p.y-u.y,g=Math.max(1,Math.hypot(m,S)),d=u.community===p.community?92:164,v=Math.min(.09,.018+Math.log2(f.weight+1)*.009)*h,b=(g-d)*v,x=m/g*b,T=S/g*b;u.vx+=x,u.vy+=T,p.vx-=x,p.vy-=T}for(let f of e){let u=a[si(f)];if(u){f.x=u.x,f.y=u.y,f.vx=0,f.vy=0;continue}let p=n.get(f.community)||{x:i/2,y:s/2};f.vx+=(p.x-f.x)*.0048*h,f.vy+=(p.y-f.y)*.0048*h,f.vx+=(i/2-f.x)*55e-5*h,f.vy+=(s/2-f.y)*55e-5*h,f.vx*=.78,f.vy*=.78,f.x=Math.max(l,Math.min(i-l,f.x+f.vx)),f.y=Math.max(l,Math.min(s-l,f.y+f.vy))}}}function j_(e){let t=2166136261;for(let n of String(e))t^=n.charCodeAt(0),t=Math.imul(t,16777619);return(t>>>0)/4294967296*Math.PI*2}function Wu(e){return e.status==="remove"?{className:"edge edge--remove",marker:"\xD7",dash:"6 6"}:e.status==="hypothetical"?{className:"edge edge--hypothetical",marker:"+",dash:"3 7"}:e.status==="gap"||e.confidence==="UNKNOWN"?{className:"edge edge--gap",marker:"?",dash:"9 7"}:e.status==="preserved"?{className:"edge edge--preserved",marker:"=",dash:""}:{className:"edge edge--proven",marker:"\u2713",dash:""}}function Z_(e){let t=$p.indexOf(e);return t===-1?$p.length:t}function aw(e){let t=new Map;for(let n of e){let i=t.get(n.path)||[];i.push(n),t.set(n.path,i)}return[...t.entries()].sort(([n],[i])=>n.localeCompare(i)).map(([n,i])=>{let s=Math.min(...i.map(l=>l.x)),a=Math.max(...i.map(l=>l.x+l.width)),r=Math.min(...i.map(l=>l.y)),o=Math.max(...i.map(l=>l.y+l.height));return{id:`file:${n}`,path:n,x:s-18,y:r-32,width:a-s+36,height:o-r+50}})}function rw(e){return Math.max(480,...e.map(t=>t.y+t.height+48))}function si(e){return String(e.node_id??e.id??"")}var K_=(e,t,n)=>Math.max(t,Math.min(n,e));function J_(e,t){if(e.length===0)return[];let n=e.length===1?ow(e[0],t):e,i=n.reduce((r,o)=>({x:r.x+o.x/n.length,y:r.y+o.y/n.length}),{x:0,y:0}),s=42+t*10;if(n.length===2){let[r,o]=n,l=o.x-r.x,c=o.y-r.y,h=Math.max(1,Math.hypot(l,c)),f=l/h,u=c/h,p=-u,m=f,S=44+t*10,g=32+t*8;return[{x:r.x-f*g+p*S,y:r.y-u*g+m*S},{x:r.x-f*g-p*S,y:r.y-u*g-m*S},{x:o.x+f*g-p*S,y:o.y+u*g-m*S},{x:o.x+f*g+p*S,y:o.y+u*g+m*S}]}let a=n.map(r=>{let o=r.x-i.x,l=r.y-i.y,c=Math.max(1,Math.hypot(o,l)),h=o/c,f=l/c,u=s+K_(c*.18,10,28);return{x:r.x+h*u,y:r.y+f*u,angle:Math.atan2(l,o)}}).sort((r,o)=>r.angle-o.angle).map(({x:r,y:o})=>({x:r,y:o}));return lw(a)}function ow(e,t){let n=34+t*6,i=28+t*5;return Array.from({length:6},(s,a)=>{let r=-Math.PI/2+Math.PI*2*a/6;return{...e,x:e.x+Math.cos(r)*n,y:e.y+Math.sin(r)*i}})}function lw(e){if(e.length<=3)return e;let t=[...e].sort((a,r)=>a.x!==r.x?a.x-r.x:a.y-r.y),n=(a,r,o)=>(r.x-a.x)*(o.y-a.y)-(r.y-a.y)*(o.x-a.x),i=[];for(let a of t){for(;i.length>=2&&n(i[i.length-2],i[i.length-1],a)<=0;)i.pop();i.push(a)}let s=[];for(let a=t.length-1;a>=0;a-=1){let r=t[a];for(;s.length>=2&&n(s[s.length-2],s[s.length-1],r)<=0;)s.pop();s.push(r)}return i.pop(),s.pop(),[...i,...s]}function tm(e,t,n){let i=K_(e.scale*n,.25,4);return{scale:i,x:t.x-(t.x-e.x)*i/e.scale,y:t.y-(t.y-e.y)*i/e.scale}}function cw(e,t){return t.some(n=>!(e.right<n.left||e.left>n.right||e.bottom<n.top||e.top>n.bottom))}function Q_(e,t,n,i,s=new Set){let a=[],r=[],o=[...e].sort((l,c)=>Number(s.has(String(c.node_id)))-Number(s.has(String(l.node_id)))||c.degree-l.degree||String(l.node_id).localeCompare(String(c.node_id)));for(let l of o){if(s.size&&!s.has(String(l.node_id)))continue;let c=l.x*t.scale+t.x,h=l.y*t.scale+t.y,f=l.symbol.length>35?`${l.symbol.slice(0,32)}\u2026`:l.symbol,u=f.length*7+12,p=l.radius*t.scale*.45+9,m=[{x:c+p,y:h-8},{x:c-p-u,y:h-8},{x:c-u/2,y:h-p-18},{x:c-u/2,y:h+p},{x:c+p,y:h+p},{x:c-p-u,y:h-p-18}];for(let S of m){let g={left:S.x,top:S.y,right:S.x+u,bottom:S.y+18};if(!(g.left<8||g.top<8||g.right>n-8||g.bottom>i-8||cw(g,a))){a.push(g),r.push({id:String(l.node_id),x:S.x+6,y:S.y+13,text:f});break}}}return r}var Ze=es(cr(),1),ny=(0,Re.forwardRef)(function(t,n){let i=(0,Re.useRef)(null),s=(0,Re.useId)(),[a,r]=(0,Re.useState)({width:1280,height:800}),[o,l]=(0,Re.useState)({x:0,y:0,scale:1}),[c,h]=(0,Re.useState)(null),[f,u]=(0,Re.useState)({}),p=(0,Re.useRef)(null),m=(0,Re.useRef)(!1),S=(0,Re.useMemo)(()=>Fl(t.graph,{width:1400,height:1e3}),[t.graph]),g=(0,Re.useMemo)(()=>Fl(t.graph,{width:1400,height:1e3,pins:f}),[t.graph,f]),d=(0,Re.useMemo)(()=>new Map(g.nodes.map(C=>[String(C.node_id),C])),[g]),v=c||(t.selectedId==null?null:String(t.selectedId)),b=(0,Re.useMemo)(()=>{let C=new Set(v?[v]:[]);if(v)for(let U of t.graph.edges)String(U.source)===v&&C.add(String(U.target)),String(U.target)===v&&C.add(String(U.source));return C},[v,t.graph.edges]),x=(0,Re.useMemo)(()=>Q_(g.nodes,o,a.width,a.height,b),[g,o,a,b]),T=(0,Re.useMemo)(()=>g.communities.map((C,U)=>{let O=g.nodes.filter(G=>G.community===C.id),D=J_(O,.55);return{...C,index:U,color:O[0]?.color||"#7fa69e",path:D.map((G,q)=>`${q?"L":"M"}${G.x} ${G.y}`).join(" ")+"Z"}}),[g]),E=(C=S.nodes)=>{if(!C.length)return{x:0,y:0,scale:1};let U=C.map($=>$.x),O=C.map($=>$.y),D=Math.min(...U),G=Math.max(...U),q=Math.min(...O),Z=Math.max(...O),nt=Math.max(240,a.width-(a.width>800?440:80)),Y=Math.max(.25,Math.min(2.5,nt/(G-D+200),(a.height-180)/(Z-q+120)));return{x:a.width*(a.width>800?.6:.5)-(D+G)/2*Y,y:a.height*.51-(q+Z)/2*Y,scale:Y}};(0,Re.useEffect)(()=>{let C=i.current;if(!C)return;let U=new ResizeObserver(()=>{let O=C.getBoundingClientRect();r({width:Math.max(1,O.width),height:Math.max(1,O.height)})});return U.observe(C),()=>U.disconnect()},[]);let w=`${t.graph.snapshot.repo_revision}:${t.graph.snapshot.graph_generation}:${t.graph.snapshot.working_tree_digest}`;(0,Re.useEffect)(()=>{u({}),h(null)},[w]),(0,Re.useEffect)(()=>{l(E())},[a.width,a.height,w]),(0,Re.useEffect)(()=>{let C=i.current;if(!C)return;let U=O=>{O.preventDefault();let D=C.getBoundingClientRect(),G={x:O.clientX-D.left,y:O.clientY-D.top};l(q=>tm(q,G,Math.exp(-Math.max(-120,Math.min(120,O.deltaY))*.002)))};return C.addEventListener("wheel",U,{passive:!1}),()=>C.removeEventListener("wheel",U)},[]),(0,Re.useImperativeHandle)(n,()=>({zoom:C=>l(U=>tm(U,{x:a.width/2,y:a.height/2},C)),resetView:()=>{u({}),l(E())},focusNode:C=>{let U=d.get(String(C));U&&l(O=>{let D=U.x*O.scale+O.x,G=U.y*O.scale+O.y;return D>90&&D<a.width-40&&G>120&&G<a.height-60?O:{...O,x:a.width*.55-U.x*O.scale,y:a.height*.5-U.y*O.scale}})}}));let _=(C,U)=>{C.button===0&&(C.stopPropagation(),p.current={x:C.clientX,y:C.clientY,camera:o,node:U,moved:!1},m.current=!1,C.currentTarget.setPointerCapture(C.pointerId))},A=C=>{let U=p.current;if(!U)return;let O=C.clientX-U.x,D=C.clientY-U.y;if(Math.hypot(O,D)>4&&(U.moved=!0,m.current=!0),!!U.moved)if(U.node){let G=U.node;u(q=>({...q,[String(G.node_id)]:{x:G.x+O/U.camera.scale,y:G.y+D/U.camera.scale}}))}else l({...U.camera,x:U.camera.x+O,y:U.camera.y+D})},N=C=>{let U=p.current;p.current=null;let O=C.target;O.hasPointerCapture(C.pointerId)&&O.releasePointerCapture(C.pointerId),C.type==="pointerup"&&U?.node&&!U.moved&&t.onNodeSelect(U.node)};return(0,Ze.jsxs)("svg",{ref:i,className:"project-canvas",viewBox:`0 0 ${a.width} ${a.height}`,"aria-label":"Repository dependency graph",role:"group",onPointerDown:C=>_(C),onPointerMove:A,onPointerUp:N,onPointerCancel:N,onLostPointerCapture:()=>{p.current=null},children:[(0,Ze.jsx)("defs",{children:T.map(C=>(0,Ze.jsxs)("radialGradient",{id:`${s}-zone-${C.index}`,children:[(0,Ze.jsx)("stop",{offset:"0",stopColor:C.color,stopOpacity:".2"}),(0,Ze.jsx)("stop",{offset:".6",stopColor:C.color,stopOpacity:".08"}),(0,Ze.jsx)("stop",{offset:"1",stopColor:C.color,stopOpacity:"0"})]},C.id))}),(0,Ze.jsxs)("g",{transform:`translate(${o.x} ${o.y}) scale(${o.scale})`,children:[(0,Ze.jsx)("g",{className:"map-zones","aria-hidden":"true",children:T.map(C=>(0,Ze.jsx)("path",{d:C.path,fill:`url(#${s}-zone-${C.index})`},C.id))}),t.graph.edges.map((C,U)=>{let O=d.get(String(C.source)),D=d.get(String(C.target));if(!O||!D)return null;let G=v===String(C.source)||v===String(C.target),q=D.x-O.x,Z=D.y-O.y,nt=`M${O.x} ${O.y} Q${(O.x+D.x)/2-Z*.1} ${(O.y+D.y)/2+q*.1} ${D.x} ${D.y}`,Y=Wu(C),$=()=>t.onEdgeSelect(C,O,D);return(0,Ze.jsxs)("g",{role:"button",tabIndex:0,"aria-label":`${O.symbol} ${C.relation} ${D.symbol}, ${C.confidence||"unknown confidence"}`,className:`map-edge ${G?"is-lit":""}`,opacity:v&&!G?.06:G?.95:.28,onPointerDown:st=>{st.stopPropagation(),m.current=!1},onClick:()=>{m.current||$()},onKeyDown:st=>{(st.key==="Enter"||st.key===" ")&&(st.preventDefault(),$())},children:[(0,Ze.jsx)("path",{d:nt,className:"map-edge-hit"}),(0,Ze.jsx)("path",{d:nt,className:Y.className,strokeDasharray:Y.dash})]},`${C.source}:${C.target}:${U}`)}),g.nodes.map(C=>{let U=String(C.node_id),O=String(t.selectedId)===U,D=!v||b.has(U),G=Math.max(3.5,C.radius*.45);return(0,Ze.jsxs)("g",{className:`map-node${O?" is-selected":""}`,role:"button",tabIndex:0,"aria-label":`${C.symbol}, ${C.symbols} symbols${C.cycle?", cycle candidate":""}`,transform:`translate(${C.x} ${C.y})`,opacity:D?1:.14,onPointerDown:q=>_(q,C),onDoubleClick:()=>t.onNodeOpen(C),onPointerEnter:()=>{p.current||h(U)},onPointerLeave:()=>h(null),onFocus:()=>h(U),onBlur:()=>h(null),onKeyDown:q=>{(q.key==="Enter"||q.key===" ")&&(q.preventDefault(),t.onNodeSelect(C))},children:[(0,Ze.jsxs)("title",{children:[C.symbol," \xB7 ",C.symbols," symbols \xB7 ",C.files," files"]}),(0,Ze.jsx)("circle",{r:Math.max(12,G+6),fill:"transparent"}),(0,Ze.jsx)("circle",{className:"map-node-halo",r:G+6,fill:"none",stroke:C.color,opacity:O?.8:.12}),(0,Ze.jsx)("circle",{className:"map-node-dot",r:G,fill:O||b.has(U)?"#f4f6f5":"#9ca8a5"}),C.cycle&&(0,Ze.jsx)("circle",{r:G+3,fill:"none",stroke:"#eac16b",strokeDasharray:"3 3"})]},U)})]}),(0,Ze.jsx)("g",{className:"map-labels","aria-hidden":"true",children:x.map(C=>(0,Ze.jsx)("text",{x:C.x,y:C.y,className:C.id===String(t.selectedId)?"is-selected":"",children:C.text},C.id))})]})});var uI=es($r(),1),Ot=es(cr(),1),iy={project:(0,Ot.jsxs)(Ot.Fragment,{children:[(0,Ot.jsx)("circle",{cx:"6",cy:"6",r:"2"}),(0,Ot.jsx)("circle",{cx:"18",cy:"8",r:"2"}),(0,Ot.jsx)("circle",{cx:"10",cy:"18",r:"2"}),(0,Ot.jsx)("path",{d:"m8 6 8 2M7 8l2 8m3 1 5-7"})]}),current:(0,Ot.jsx)(Ot.Fragment,{children:(0,Ot.jsx)("path",{d:"m8 5-6 7 6 7m8-14 6 7-6 7m-3-16-2 18"})}),architecture:(0,Ot.jsxs)(Ot.Fragment,{children:[(0,Ot.jsx)("rect",{x:"3",y:"3",width:"7",height:"7",rx:"1.5"}),(0,Ot.jsx)("rect",{x:"14",y:"3",width:"7",height:"7",rx:"1.5"}),(0,Ot.jsx)("rect",{x:"3",y:"14",width:"7",height:"7",rx:"1.5"}),(0,Ot.jsx)("rect",{x:"14",y:"14",width:"7",height:"7",rx:"1.5"})]}),changes:(0,Ot.jsxs)(Ot.Fragment,{children:[(0,Ot.jsx)("path",{d:"M6 3v18m12-18v18M3 8h6m6 8h6"}),(0,Ot.jsx)("circle",{cx:"6",cy:"8",r:"2"}),(0,Ot.jsx)("circle",{cx:"18",cy:"16",r:"2"})]}),preview:(0,Ot.jsxs)(Ot.Fragment,{children:[(0,Ot.jsx)("path",{d:"M3 12s3-7 9-7 9 7 9 7-3 7-9 7-9-7-9-7Z"}),(0,Ot.jsx)("circle",{cx:"12",cy:"12",r:"3"})]}),compare:(0,Ot.jsxs)(Ot.Fragment,{children:[(0,Ot.jsx)("rect",{x:"3",y:"4",width:"18",height:"16",rx:"2"}),(0,Ot.jsx)("path",{d:"M12 4v16M6 12h3m6 0h3"})]}),history:(0,Ot.jsx)(Ot.Fragment,{children:(0,Ot.jsx)("path",{d:"M4 9a8 8 0 1 1 0 7M4 3v6h6m2-2v5l3 2"})}),search:(0,Ot.jsxs)(Ot.Fragment,{children:[(0,Ot.jsx)("circle",{cx:"10",cy:"10",r:"6"}),(0,Ot.jsx)("path",{d:"m15 15 6 6"})]})};function sy({mode:e,modes:t,onMode:n,discoveryOpen:i,onDiscovery:s}){return(0,Ot.jsxs)("nav",{className:"workspace-dock","aria-label":"Graph mode",children:[(0,Ot.jsx)("span",{className:"dock-brand","aria-label":"CGRX",children:"cx"}),(0,Ot.jsx)("button",{className:"dock-button",title:"Search and explore","aria-label":"Search and explore","aria-expanded":i,"aria-controls":"discovery-panel",onClick:s,children:(0,Ot.jsx)("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:iy.search})}),(0,Ot.jsx)("span",{className:"dock-divider"}),t.map(a=>(0,Ot.jsxs)("button",{className:`dock-button${e===a.id?" is-active":""}`,title:a.label,"aria-label":a.label,"aria-pressed":e===a.id,onClick:()=>n(a.id),children:[(0,Ot.jsx)("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:iy[a.id]}),(0,Ot.jsx)("span",{className:"dock-tooltip",children:a.label})]},a.id))]})}function Yu({title:e,detail:t,onClose:n}){return(0,Ot.jsxs)("div",{className:"panel-heading",children:[(0,Ot.jsxs)("div",{children:[(0,Ot.jsx)("h2",{children:e}),t&&(0,Ot.jsx)("span",{children:t})]}),(0,Ot.jsx)("button",{className:"panel-close",onClick:n,"aria-label":`Close ${e}`,title:`Close ${e}`,children:"\xD7"})]})}var DT=es(h1(),1);function d1(e,t){let n=new Set(e.map(s=>s.lane)),i=0;for(;n.has(i)||t.has(i);)i+=1;return i}function f1(e,t={}){let n=t.previous?.rowOffset??0,i=(t.previous?.lanes??[]).map(c=>({...c})),s=t.previous?.nextColour??0,a=[],r=[],o=i.reduce((c,h)=>Math.max(c,h.lane),-1);for(let c=0;c<e.length;c+=1){let h=e[c],f=n+c,u=i.filter(d=>d.target===h.oid).sort((d,v)=>d.lane-v.lane),p=new Set,m=u[0]??{lane:d1(i,p),target:h.oid,colour:s++};o=Math.max(o,m.lane),a.push({oid:h.oid,lane:m.lane,row:f,colour:m.colour,kind:h.kind});for(let d of i)d.target!==h.oid&&(r.push({from:{lane:d.lane,row:d.fromRow},to:{lane:d.lane,row:f},colour:d.colour}),d.fromRow=f);for(let d of u)r.push({from:{lane:d.lane,row:d.fromRow},to:{lane:m.lane,row:f},colour:d.colour,anchor:"to"});for(let d=i.length-1;d>=0;d-=1)i[d].target===h.oid&&i.splice(d,1);let S=h.parents.filter(Boolean),g=S[0];g&&(i.push({lane:m.lane,target:g,colour:m.colour,fromRow:f}),p.add(m.lane));for(let d of S.slice(1)){let v=i.find(T=>T.target===d);if(v){r.push({from:{lane:m.lane,row:f},to:{lane:v.lane,row:f+1},colour:v.colour,anchor:"from"});continue}let b=d1(i,p);p.add(b),o=Math.max(o,b);let x=s++;i.push({lane:b,target:d,colour:x,fromRow:f+1}),r.push({from:{lane:m.lane,row:f},to:{lane:b,row:f+1},colour:x,anchor:"from"})}}let l=n+e.length;for(let c of i)c.fromRow<l&&(r.push({from:{lane:c.lane,row:c.fromRow},to:{lane:c.lane,row:l},colour:c.colour,dangling:!0}),c.fromRow=l);return{nodes:a,segments:r,state:{lanes:i.map(c=>({...c})),nextColour:s,rowOffset:l},laneCount:Math.max(1,o+1)}}var yR="web-git-graph",Jo=["#e3008c","#007acc","#00c853","#ff8c00","#b180d7","#00b7c3","#dcdcaa"],xR=new Set(["current","head"]),p1=typeof navigator<"u"&&/mac|iphone|ipad|ipod/i.test(navigator.userAgent??""),SR=[78,54,88,41,69,82,47,61],Ud=[64,88,45,73,52],bR=`
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
`;function Id(e){return e.kind==="working-tree"?{kind:"working-tree"}:e.kind==="stash"?{kind:"stash",oid:e.oid}:{kind:"commit",oid:e.oid}}function J0(e){return e.startsWith("__")?e.replaceAll("_",""):e.slice(0,8)}function Q0(e){return e.replace(/^refs\/(heads|tags|remotes)\//,"")}var MR=[["year",31536e6],["month",2592e6],["week",6048e5],["day",864e5],["hour",36e5],["minute",6e4]];function Od(e){return String(e).padStart(2,"0")}function m1(e,t="datetime"){if(!e)return"\u2014";let n=new Date(e);if(Number.isNaN(n.valueOf()))return e;if(t==="relative"){let s=n.valueOf()-Date.now(),a=new Intl.RelativeTimeFormat(void 0,{numeric:"auto"});for(let[r,o]of MR)if(Math.abs(s)>=o)return a.format(Math.round(s/o),r);return a.format(Math.round(s/1e3),"second")}let i=`${n.getFullYear()}/${Od(n.getMonth()+1)}/${Od(n.getDate())}`;return t==="date"?i:`${i} ${Od(n.getHours())}:${Od(n.getMinutes())}`}var $0=new Map,tv=new Set;function ER(e){let t=0;for(let n=0;n<e.length;n+=1)t=(t*31+e.charCodeAt(n))%360;return`hsl(${t} 44% 40%)`}async function TR(e){if(typeof crypto>"u"||!crypto.subtle)return;let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return`https://www.gravatar.com/avatar/${[...new Uint8Array(t)].map(i=>i.toString(16).padStart(2,"0")).join("")}?s=48&d=404`}function wR(e){let t={dirs:new Map,files:[]};for(let n of e){let i=n.path.split("/"),s=t;for(let a of i.slice(0,-1)){let r=s.dirs.get(a);r||(r={dirs:new Map,files:[]},s.dirs.set(a,r)),s=r}s.files.push(n)}return t}function ev(e){return e.split("/").pop()??e}function Pd(e){let t=document.createElement("div");return t.className="pending details-pending",t.setAttribute("aria-hidden","true"),t.innerHTML=e.map(n=>`<span class="pending-bar" style="width:${n}%"></span>`).join(""),t}function nv(e,t){let n=document.createElementNS("http://www.w3.org/2000/svg",e);for(let[i,s]of Object.entries(t))n.setAttribute(i,s);return n}var AR=typeof HTMLElement>"u"?class{}:HTMLElement,g1=class extends AR{static observedAttributes=["theme","density","columns","date-format","date-type","avatars"];#s;#t={commits:[],refs:[],hasMore:!1};#x=f1([]);#S="";#u=[];#d=-1;#h=[];#D;#L;#U;#T;#n;#f;#r;#p;#o;#m=new Set;#w;#b;#g=!1;#I=!1;#M=!1;#E;#O;#a=24;#V=8;#P=240;#A=!0;#e;addEventListener(e,t,n){super.addEventListener(e,t,n)}removeEventListener(e,t,n){super.removeEventListener(e,t,n)}ongitgraphcommitsselect=null;ongitgraphcommitsopen=null;ongitgraphcompare=null;ongitgraphfileopen=null;ongitgraphloadmore=null;ongitgrapherror=null;ongitgraphrefresh=null;ongitgraphcontextmenu=null;constructor(){super(),this.#e=this.attachShadow({mode:"open"}),this.#e.innerHTML=`<style>${bR}</style><div class="shell"></div>`}connectedCallback(){this.#X(),this.#s&&this.#t.commits.length===0&&this.#y(!1)}disconnectedCallback(){this.#l()}attributeChangedCallback(){this.#a=this.getAttribute("density")==="compact"?20:24,this.#W(),this.#j(),this.#i()}get provider(){return this.#s}set provider(e){this.#s=e,e&&(this.#h=[],this.#t={...this.#t,repositoryId:void 0,repositoryName:void 0,cursor:void 0,hasMore:!1},this.isConnected&&this.#y(!1))}get data(){return this.#t}set data(e){this.setData(e)}get theme(){return this.getAttribute("theme")??"dark"}set theme(e){this.setAttribute("theme",e)}get density(){return this.getAttribute("density")??"comfortable"}set density(e){this.setAttribute("density",e)}get columns(){return this.getAttribute("columns")??"date,author,commit"}set columns(e){this.setAttribute("columns",e)}get dateFormat(){let e=this.getAttribute("date-format");return e==="date"||e==="relative"?e:"datetime"}set dateFormat(e){this.setAttribute("date-format",e)}get dateType(){return this.getAttribute("date-type")==="authored"?"authored":"committed"}set dateType(e){this.setAttribute("date-type",e)}get avatars(){let e=this.getAttribute("avatars");return e!==null&&e!=="false"&&e!=="off"}set avatars(e){e?this.setAttribute("avatars",""):this.removeAttribute("avatars")}get refs(){return this.#h}set refs(e){this.#B([...e])}refresh(){let e=new CustomEvent("gitgraph-refresh",{bubbles:!0,composed:!0,cancelable:!0,detail:{repositoryId:this.#t.repositoryId}});this.dispatchEvent(e)&&this.#s&&this.#y(!1,!0)}setData(e){this.#t={...e,commits:[...e.commits],refs:[...e.refs]},this.#n=void 0,this.#f=void 0,this.#r=void 0,this.#g=!1,this.#p=void 0,this.#E=void 0,this.#m.clear(),this.#k(),this.#e.querySelector(".scroller")?.scrollTo({top:0})}appendPage(e){let t=this.#e.querySelector(".scroller")?.scrollTop??0,n=new Set(this.#t.commits.map(i=>i.oid));this.#t={...this.#t,...e,commits:[...this.#t.commits,...e.commits.filter(i=>!n.has(i.oid))],refs:this.#st(this.#t.refs,e.refs)},this.#k(),queueMicrotask(()=>{let i=this.#e.querySelector(".scroller");i&&(i.scrollTop=t,this.#i())})}selectCommit(e){let t=this.#t.commits.find(n=>n.oid===e);t&&(this.#n=e,this.#f=void 0,this.#p=void 0,this.#o=void 0,this.#m.clear(),this.dispatchEvent(new CustomEvent("gitgraph-commit-select",{bubbles:!0,composed:!0,detail:{commit:t}})),this.#Q(t),this.#i(),this.#c(),queueMicrotask(()=>this.#ft(t.oid)))}async compareCommits(e,t){let n=this.#t.commits.find(s=>s.oid===e),i=this.#t.commits.find(s=>s.oid===t);if(!(!n||!i||!this.#s?.compare)){this.#n=e,this.#f=t,this.#o=void 0,this.#p=void 0,this.#g=!0,this.#m.clear(),this.#i(),this.#c();try{this.#p=await this.#s.compare(this.#t.repositoryId,Id(n),Id(i)),this.dispatchEvent(new CustomEvent("gitgraph-compare",{bubbles:!0,composed:!0,detail:this.#p}))}catch(s){this.#N(s)}this.#c()}}focusCommit(e){let t=this.#t.commits.findIndex(i=>i.oid===e);if(t<0)return;this.#e.querySelector(".scroller")?.scrollTo({top:this.#v(t,this.#R()),behavior:"smooth"}),queueMicrotask(()=>{this.#e.querySelector(`.row[data-oid="${CSS.escape(e)}"]`)?.focus()})}#st(e,t){let n=new Map(e.map(i=>[`${i.kind}:${i.name}`,i]));for(let i of t)n.set(`${i.kind}:${i.name}`,i);return[...n.values()]}#k(){this.#x=f1(this.#t.commits),this.#F(!1),this.#X(),this.#W(),this.#C(),this.#j(),this.#i()}#X(){let e=this.#e.querySelector(".shell");if(!e||e.querySelector(".toolbar"))return;e.innerHTML=`
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
      </div>`;let t=e.querySelector(".search");t.value=this.#S,t.addEventListener("input",()=>{this.#S=t.value,this.#F(!0),this.#C(),this.#i(),this.#J()}),t.addEventListener("keydown",a=>{a.key==="Enter"?(a.preventDefault(),this.#G(a.shiftKey?-1:1)):a.key==="Escape"&&t.value&&(a.stopPropagation(),t.value="",this.#S="",this.#F(!0),this.#C(),this.#i())}),e.querySelector(".search-prev")?.addEventListener("click",()=>this.#G(-1)),e.querySelector(".search-next")?.addEventListener("click",()=>this.#G(1)),e.querySelector(".refresh")?.addEventListener("click",()=>this.refresh()),e.querySelector(".theme-toggle")?.addEventListener("click",()=>{this.theme=this.theme==="light"?"dark":"light"});let n=e.querySelector(".remote-toggle");n.checked=this.#A,n.addEventListener("change",()=>{this.#A=n.checked,this.#l(),this.#i()});let i=e.querySelector(".ref-select");i.addEventListener("click",()=>{this.#D?.dataset.menu==="refs"?this.#l():this.#at(i)});let s=e.querySelector(".scroller");s.addEventListener("scroll",()=>{this.#i(),this.#t.hasMore&&!this.#M&&s.scrollTop+s.clientHeight>s.scrollHeight-this.#a*4&&this.#y(!0)}),s.addEventListener("keydown",a=>this.#ht(a)),this.#i()}#C(){let e=this.#e.querySelector(".shell");if(!e||!e.querySelector(".toolbar"))return;e.querySelector(".repository-name").textContent=this.#t.repositoryName??this.#t.repositoryId??"data provider";let t=this.#h;e.querySelector(".ref-select-label").textContent=t.length===0?"Show All":t.length===1?Q0(t[0]):`${t.length} selected`,this.#K()}#W(){let e=this.#e.querySelector(".shell");if(!e)return;let t=this.getAttribute("columns"),n=t===null?void 0:new Set(t.split(",").map(i=>i.trim().toLowerCase()).filter(Boolean));for(let i of["date","author","commit"])e.toggleAttribute(`data-hide-${i}`,n!==void 0&&!n.has(i))}#q(e,t){this.#l();let n=this.#e.querySelector(".shell"),i=document.createElement("div");i.className="menu",i.dataset.menu=e,i.setAttribute("role","menu"),n.append(i),this.#D=i;let s=l=>{let c=l.composedPath();!c.includes(i)&&!(t&&c.includes(t))&&this.#l()},a=l=>{l.key==="Escape"&&(l.stopPropagation(),this.#l())},r=()=>this.#l(),o=this.#e.querySelector(".scroller");return document.addEventListener("pointerdown",s,!0),document.addEventListener("keydown",a,!0),o?.addEventListener("scroll",r),window.addEventListener("resize",r),this.#L=()=>{document.removeEventListener("pointerdown",s,!0),document.removeEventListener("keydown",a,!0),o?.removeEventListener("scroll",r),window.removeEventListener("resize",r),i.remove()},t?.setAttribute("aria-expanded","true"),i}#l(){let e=this.#L;this.#D=void 0,this.#L=void 0,this.#U=void 0,this.#T=void 0,e?.(),this.#Y(),this.#e.querySelector(".ref-select")?.setAttribute("aria-expanded","false")}#Y(){for(let e of this.#e.querySelectorAll(".row"))e.classList.toggle("context-active",e.dataset.oid===this.#T)}#Z(e,t,n){e.style.left="0px",e.style.top="0px";let i=this.getBoundingClientRect(),s=e.getBoundingClientRect();e.style.left=`${Math.min(Math.max(4,t),Math.max(4,i.width-s.width-4))}px`,e.style.top=`${Math.min(Math.max(4,n),Math.max(4,i.height-s.height-4))}px`}#_(e,t){let n=document.createElement("button");if(n.className="menu-item",n.type="button",n.setAttribute("role","menuitem"),n.disabled=t.enabled===!1,t.checked!==void 0){let s=document.createElement("span");s.className="menu-check",s.textContent=t.checked?"\u2713":"",n.append(s)}let i=document.createElement("span");return i.className="menu-label",i.textContent=e,n.append(i),n.addEventListener("click",t.onSelect),n}#at(e){let t=this.#q("refs",e),n=[["Local Branches","head"],["Remote Branches","remote"],["Tags","tag"]],i=new Map,s=()=>new Set(this.#h),a=this.#_("Show All",{checked:this.#h.length===0,onSelect:()=>this.#B([])});t.append(a);let r=document.createElement("div");r.className="menu-scroll";let o=0;for(let[h,f]of n){let u=this.#t.refs.filter(m=>m.kind===f&&(f!=="remote"||this.#A));if(u.length===0)continue;let p=document.createElement("div");p.className="menu-group",p.textContent=h,r.append(p);for(let m of u){let S=this.#_(Q0(m.name),{checked:this.#h.includes(m.name),onSelect:()=>this.#rt(m.name)});i.set(m.name,S.querySelector(".menu-check")),r.append(S),o+=1}}o>0&&t.append(Object.assign(document.createElement("div"),{className:"menu-separator"}),r),this.#U=()=>{let h=s();a.querySelector(".menu-check").textContent=h.size===0?"\u2713":"";for(let[f,u]of i)u.textContent=h.has(f)?"\u2713":""};let l=e.getBoundingClientRect(),c=this.getBoundingClientRect();this.#Z(t,l.left-c.left,l.bottom-c.top+2)}#rt(e){let t=new Set(this.#h);t.has(e)?t.delete(e):t.add(e),this.#B([...t])}#B(e){this.#h=e,this.#C(),this.#U?.(),this.#s&&this.#y(!1)}#ot(e,t,n){if(!this.dispatchEvent(new CustomEvent("gitgraph-context-menu",{bubbles:!0,composed:!0,cancelable:!0,detail:{commit:e,clientX:t,clientY:n}})))return;let s=this.#q("commit");this.#T=e.oid,this.#Y();let a=e.message.split(`
`,1)[0]??"";if(s.append(this.#_("Copy Commit Hash",{enabled:e.kind!=="working-tree",onSelect:()=>{this.#l(),this.#z(e.oid)}}),this.#_("Copy Commit Subject",{enabled:a.length>0,onSelect:()=>{this.#l(),this.#z(a)}}),this.#_("Compare with Selected Commit",{enabled:!!(this.#n&&this.#n!==e.oid&&this.#s?.compare),onSelect:()=>{let o=this.#n;this.#l(),o&&this.compareCommits(o,e.oid)}})),e.url){let o=e.url;s.append(this.#_("Open in Remote \u2197",{onSelect:()=>{this.#l(),window.open(o,"_blank","noopener,noreferrer")}}))}let r=this.getBoundingClientRect();this.#Z(s,t-r.left,n-r.top)}async#z(e){try{await navigator.clipboard.writeText(e)}catch{let t=document.createElement("textarea");t.value=e,t.setAttribute("aria-hidden","true"),t.style.position="fixed",t.style.opacity="0",document.body.append(t),t.select(),document.execCommand("copy"),t.remove()}}#lt(e){let t=e.author?.email?.trim().toLowerCase()??"",n=document.createElement("span");n.className="avatar",n.setAttribute("aria-hidden","true");let i=document.createElement("span");i.textContent=(e.author?.name??"?").trim().slice(0,1).toUpperCase()||"?",n.append(i),t&&n.style.setProperty("--avatar-color",ER(t));let s=e.author?.avatarUrl??(t?$0.get(t):void 0);if(s){let a=document.createElement("img");a.src=s,a.alt="",a.loading="lazy",a.decoding="async",a.addEventListener("error",()=>a.remove()),n.append(a)}return n}async#j(){if(!this.avatars)return;let e=new Set;for(let t of this.#t.commits){let n=t.author?.email?.trim().toLowerCase();n&&!t.author?.avatarUrl&&!$0.has(n)&&!tv.has(n)&&e.add(n)}if(e.size!==0){for(let t of e)tv.add(t);await Promise.all([...e].map(async t=>{let n=await TR(t).catch(()=>{});n&&$0.set(t,n),tv.delete(t)})),this.#i()}}#F(e){let t=this.#S.trim().toLocaleLowerCase();if(!t){this.#u=[],this.#d=-1;return}let n=[];this.#t.commits.forEach((i,s)=>{let a=`${i.author?.name??""} ${i.author?.email??""}`;`${i.oid} ${i.message} ${a}`.toLocaleLowerCase().includes(t)&&n.push(s)}),this.#u=n,this.#d=n.length===0?-1:e?0:Math.min(Math.max(this.#d,0),n.length-1)}#K(){let e=this.#e.querySelector(".search-count");if(!e)return;let t=this.#S.trim().length>0;e.hidden=!t,e.textContent=t?`${this.#d+1}/${this.#u.length}`:"";let n=this.#u.length===0;this.#e.querySelector(".search-prev").disabled=n,this.#e.querySelector(".search-next").disabled=n}#G(e){this.#u.length!==0&&(this.#d=(this.#d+e+this.#u.length)%this.#u.length,this.#K(),this.#i(),this.#J())}#J(){let e=this.#u[this.#d];if(e===void 0)return;let t=this.#e.querySelector(".scroller");if(!t)return;let n=this.#v(e,this.#R());(n<t.scrollTop||n+this.#a>t.scrollTop+t.clientHeight)&&t.scrollTo({top:Math.max(0,n-t.clientHeight/2)})}#i(){let e=this.#e.querySelector(".scroller"),t=this.#e.querySelector(".spacer"),n=this.#e.querySelector(".window");if(!e||!t||!n)return;if(this.#t.commits.length===0&&(this.#w=void 0,this.#b=void 0),this.#I&&this.#t.commits.length===0){t.style.height="100%",n.innerHTML=`
        <div class="loading-view">
          <div class="pending pending-rows" aria-hidden="true">${SR.map(E=>`<div class="pending-row"><span class="pending-dot"></span><span class="pending-bar" style="width:${E}%"></span></div>`).join("")}</div>
          <p class="pending-label"><slot name="loading">Reading the commit DAG\u2026</slot></p>
        </div>`;return}if(this.#E&&this.#t.commits.length===0){t.style.height="100%",n.innerHTML='<div class="error"><slot name="error"></slot></div>';let E=n.querySelector("slot");E&&(E.textContent=this.#E);return}if(this.#t.commits.length===0){t.style.height="100%",n.innerHTML='<div class="empty"><slot name="empty">No commits match this view.</slot></div>';return}let i=Math.max(56,this.#x.laneCount*16+24);this.#e.querySelector(".shell")?.style.setProperty("--wgg-graph-width",`${i}px`);let s=this.#R(),a=s>=0?this.#P:0,r=(s+1)*this.#a,o=this.#t.commits.length*this.#a+a;t.style.height=`${o+(this.#t.hasMore?42:0)}px`;let l=Math.ceil(Math.max(e.clientHeight,420)/this.#a),c=E=>s<0||E<r?Math.floor(E/this.#a):E<r+a?s:Math.floor((E-a)/this.#a),h=Math.max(0,c(e.scrollTop)-this.#V),f=Math.min(this.#t.commits.length,Math.max(h+l,c(e.scrollTop+e.clientHeight)+1)+this.#V);n.style.transform="";let u=this.#w;for(let E of[...n.children])E!==u&&E.remove();let p=this.#v(h,s),m=Math.max(this.#a,this.#v(f,s)-p),S=nv("svg",{class:"graph",width:`${i}`,height:`${m}`,"aria-hidden":"true"});S.style.top=`${p}px`,this.#ct(S,h,f,s),n.append(S);let g=new Map;for(let E of this.#t.refs){if(!this.#A&&E.kind==="remote")continue;let w=g.get(E.target)??[];w.push(E),g.set(E.target,w)}let d=new Map(this.#x.nodes.map(E=>[E.oid,E])),v=new Set(this.#u),b=this.#d>=0?this.#u[this.#d]:-1,x=this.avatars,T=this.dateFormat;for(let E=h;E<f;E+=1){let w=this.#t.commits[E],_=document.createElement("div");_.className="row",_.classList.toggle("merge",w.parents.length>1),_.classList.toggle("working-tree",w.kind==="working-tree"),_.classList.toggle("match",v.has(E)),_.classList.toggle("match-current",E===b),_.classList.toggle("context-active",w.oid===this.#T),w.oid===this.#n&&_.classList.add("selected"),w.oid===this.#f&&_.classList.add("compare"),_.dataset.oid=w.oid,_.dataset.index=String(E),_.setAttribute("role","row"),_.tabIndex=w.oid===this.#n||!this.#n&&E===0?0:-1,_.style.top=`${this.#v(E,s)}px`,_.innerHTML=`
        <div class="graph-cell" role="gridcell"></div>
        <div class="subject" role="gridcell"><div class="refs"></div><span class="message"></span></div>
        <div class="date" role="gridcell"></div>
        <div class="author" role="gridcell"></div>
        <div class="oid" role="gridcell"></div>`,_.querySelector(".message").textContent=w.message.split(`
`,1)[0]??"";let A=_.querySelector(".author");x&&w.kind!=="working-tree"&&A.append(this.#lt(w));let N=document.createElement("span");N.className="author-name",N.textContent=w.author?.name??"\u2014",A.append(N),_.querySelector(".date").textContent=m1(this.#nt(w),T),_.querySelector(".oid").textContent=J0(w.oid);let C=_.querySelector(".refs"),U=new Set;for(let O of g.get(w.oid)??[]){let D=Q0(O.name),G=O.kind==="current"||O.kind==="head"?`branch:${D}`:`${O.kind}:${D}`;if(U.has(G))continue;U.add(G);let q=document.createElement("span");q.className=`ref ${O.kind}`;let Z=O.kind==="tag"?"\u25C7":O.kind==="stash"?"\u224B":O.kind==="remote"?"\u2197":"\u2442";q.textContent=`${Z} ${D}`,q.title=D;let nt=d.get(w.oid);if(nt&&xR.has(O.kind)&&q.style.setProperty("--ref-color",Jo[nt.colour%Jo.length]),C.append(q),U.size>=4)break}_.addEventListener("click",O=>{O.button!==0||p1&&O.ctrlKey||((O.metaKey||O.ctrlKey)&&this.#n&&this.#n!==w.oid?this.compareCommits(this.#n,w.oid):w.oid===this.#n&&!this.#f?this.#H():this.selectCommit(w.oid))}),_.addEventListener("mousedown",O=>{O.button===2&&O.preventDefault()}),_.addEventListener("contextmenu",O=>{O.preventDefault(),O.stopPropagation(),this.#ot(w,O.clientX,O.clientY)}),_.addEventListener("dblclick",()=>{w.url&&window.open(w.url,"_blank","noopener,noreferrer"),this.dispatchEvent(new CustomEvent("gitgraph-commit-open",{bubbles:!0,composed:!0,detail:{commit:w}}))}),n.append(_)}if(s>=0){let E=u??document.createElement("aside");E.className="inline-details",E.setAttribute("aria-label",this.#f?"Commit comparison":"Commit details"),E.style.top=`${r}px`,E.style.height=`${a}px`,E.parentNode!==n&&n.append(E),this.#w=E}else u?.remove(),this.#w=void 0,this.#b=void 0;if(this.#t.hasMore&&f===this.#t.commits.length){let E=document.createElement("button");E.className="action load-more",E.type="button",E.style.top=`${o}px`,E.textContent=this.#M?"Loading\u2026":"Load more commits",E.disabled=this.#M,E.addEventListener("click",()=>{let w=new CustomEvent("gitgraph-load-more",{bubbles:!0,composed:!0,cancelable:!0,detail:{cursor:this.#t.cursor}});this.dispatchEvent(w)&&this.#s&&this.#y(!0)}),n.append(E)}this.#c()}#ct(e,t,n,i){let s=r=>16+r*16,a=r=>this.#v(r,i)-this.#v(t,i)+this.#a*.5;for(let r of this.#x.segments){if(r.to.row<t||r.from.row>=n)continue;let o=Math.max(t,r.from.row),l=Math.min(n,r.to.row),c=s(r.from.lane),h=s(r.to.lane),f=a(o),u=a(l),p=r.anchor==="from";e.append(nv("path",{d:this.#ut(c,h,f,u,p),stroke:Jo[r.colour%Jo.length],...r.dangling?{"stroke-dasharray":"3 4"}:{}}))}for(let r of this.#x.nodes){if(r.row<t||r.row>=n)continue;let o=r.kind==="working-tree"?"var(--wgg-faint)":Jo[r.colour%Jo.length];e.append(nv("circle",{cx:`${s(r.lane)}`,cy:`${a(r.row)}`,r:r.kind==="working-tree"?"4.5":r.kind==="stash"?"4":"3.5",fill:r.oid===this.#t.head||r.kind==="working-tree"?"var(--wgg-bg)":o,stroke:o}))}}#ut(e,t,n,i,s){if(e===t)return`M ${e} ${n} L ${t} ${i}`;let a=this.#a*.55;if(i-n<=this.#a)return`M ${e} ${n} C ${e} ${n+a}, ${t} ${i-a}, ${t} ${i}`;if(s){let o=n+this.#a;return`M ${e} ${n} C ${e} ${n+a}, ${t} ${o-a}, ${t} ${o} L ${t} ${i}`}let r=i-this.#a;return`M ${e} ${n} L ${e} ${r} C ${e} ${r+a}, ${t} ${i-a}, ${t} ${i}`}#ht(e){let t=[...this.#e.querySelectorAll(".row")],n=this.#e.activeElement,i=t.indexOf(n),s=i;if(e.key==="ArrowDown")s=Math.min(t.length-1,Math.max(0,i+1));else if(e.key==="ArrowUp")s=Math.max(0,i-1);else if(e.key==="Home")s=0;else if(e.key==="End")s=t.length-1;else if(e.key==="Enter"&&n?.dataset.oid){this.selectCommit(n.dataset.oid);return}else if(e.key==="Escape"){this.#H();return}else return;e.preventDefault(),t[s]?.focus()}async#Q(e){if(!this.#s?.getCommitDetails){this.#g=!1,this.#r={commit:e,refs:this.#t.refs.filter(n=>n.target===e.oid),changes:[]},this.#c();return}this.#r?.commit.oid===e.oid||(this.#r=void 0,this.#g=!0,this.#c());try{let n=await this.#s.getCommitDetails(this.#t.repositoryId,Id(e));if(this.#n!==e.oid)return;this.#r=n}catch(n){if(this.#n!==e.oid)return;this.#N(n)}this.#g=!1,this.#c()}#c(e=!1){let t=e||this.#g,n=this.#e.querySelector(".inline-details");if(!n||!this.#n)return;let i=JSON.stringify([this.#n,this.#f,t,this.#r?.commit.oid,this.#r?.changes.length,!!this.#p,this.#o?.path,this.#o?.patch?.length,[...this.#m].sort()]);if(i===this.#b&&n.firstChild)return;this.#b=i,n.innerHTML=`
      <button class="details-close" type="button" aria-label="Close details">\xD7</button>
      <div class="details-summary"></div>
      <div class="details-files"></div>`,n.querySelector(".details-close")?.addEventListener("click",()=>this.#H());let s=n.querySelector(".details-summary"),a=n.querySelector(".details-files");if(this.#f){if(t||!this.#p){s.innerHTML='<p class="pending-label">Calculating tree difference\u2026</p>',s.append(Pd(Ud.slice(0,3))),a.append(Pd(Ud));return}this.#dt(s,a,this.#p);return}let r=this.#r?.commit??this.#t.commits.find(m=>m.oid===this.#n);if(!r){s.innerHTML='<p class="pending-label">Reading commit object\u2026</p>',s.append(Pd(Ud.slice(0,3)));return}let o=document.createElement("dl");o.className="meta";let l=[["Commit",r.kind==="working-tree"?"uncommitted changes":r.oid,!0],["Parents",r.parents.map(J0).join(", ")||"root commit",!0],["Author",`${r.author?.name??"Unknown"}${r.author?.email?` <${r.author.email}>`:""}`],["Date",m1(this.#nt(r))]];for(let[m,S,g]of l){let d=document.createElement("dt"),v=document.createElement("dd");d.textContent=m,v.textContent=S,g&&(v.className="oid-value"),o.append(d,v)}s.append(o);let c=document.createElement("p");c.className="commit-body",c.textContent=(this.#r?.body??r.message).trim(),s.append(c);let h=document.createElement("div");if(h.className="actions",h.innerHTML='<button class="action primary copy" type="button">Copy SHA</button>',h.querySelector(".copy")?.addEventListener("click",()=>void this.#z(r.oid)),this.#s?.compare){let m=document.createElement("button");m.className="action compare-action",m.type="button",m.textContent="Compare with\u2026",m.addEventListener("click",()=>{m.textContent=p1?"Cmd-click another commit":"Ctrl-click another commit",m.disabled=!0,this.#e.querySelector(".scroller")?.focus()}),h.append(m)}if(r.url){let m=document.createElement("button");m.className="action",m.textContent="Open remote \u2197",m.addEventListener("click",()=>window.open(r.url,"_blank","noopener,noreferrer")),h.append(m)}if(s.append(h),t){a.append(Pd(Ud));return}let f=this.#r?.changes??[],u=r.parents[0],p=u&&this.#s?.getFileDiff?{base:{kind:"commit",oid:u},head:Id(r)}:void 0;if(this.#o)s.append(this.#$());else if(p&&f.length>0){let m=document.createElement("p");m.className="no-changes",m.textContent="Select a file to view its diff.",s.append(m)}this.#tt(a,f,p)}#$(){let e=document.createElement("pre");return e.className="patch",e.textContent=this.#o?.patch??this.#o?.unavailableReason??(this.#o?.binary?"Binary file \u2014 patch unavailable.":"No textual patch."),e}#dt(e,t,n){let i=document.createElement("h2");i.className="details-heading",i.textContent=`${this.#it(n.base)} \u2192 ${this.#it(n.head)}`,e.append(i);let s=document.createElement("p");if(s.className="stats",s.textContent=`${n.changes.length} files \xB7 +${n.additions} \u2212${n.deletions}${n.truncated?" \xB7 truncated":""}`,e.append(s),this.#o)e.append(this.#$());else if(n.changes.length>0){let a=document.createElement("p");a.className="no-changes",a.textContent="Select a file to view its diff.",e.append(a)}this.#tt(t,n.changes,{base:n.base,head:n.head,comparison:n})}#tt(e,t,n){if(t.length===0){e.innerHTML='<p class="no-changes">No file changes.</p>';return}let i=document.createElement("ul");i.className="tree",this.#et(i,wR(t),"",n),e.append(i)}#et(e,t,n,i){for(let[s,a]of[...t.dirs.entries()].sort((r,o)=>r[0].localeCompare(o[0]))){for(;a.files.length===0&&a.dirs.size===1;){let[u]=a.dirs;s=`${s}/${u[0]}`,a=u[1]}let r=n?`${n}/${s}`:s,o=this.#m.has(r),l=document.createElement("li"),c=document.createElement("button");c.className="tree-dir",c.type="button",c.setAttribute("aria-expanded",String(!o));let h=document.createElement("span");h.className="twistie",h.textContent=o?"\u25B8":"\u25BE";let f=document.createElement("span");if(f.className="dir-name",f.textContent=s,c.append(h,f),c.addEventListener("click",()=>{o?this.#m.delete(r):this.#m.add(r),this.#c()}),l.append(c),!o){let u=document.createElement("ul");this.#et(u,a,r,i),l.append(u)}e.append(l)}for(let s of[...t.files].sort((a,r)=>a.path.localeCompare(r.path))){let a=document.createElement("li"),r=document.createElement("button");r.className="tree-file",r.type="button",this.#o?.path===s.path&&r.classList.add("active"),r.title=s.previousPath?`${s.previousPath} \u2192 ${s.path}`:s.path;let o=document.createElement("span");o.className=`change-code ${s.kind}`,o.textContent=s.kind.slice(0,1).toUpperCase();let l=document.createElement("span");l.className="change-path",l.textContent=s.previousPath?`${ev(s.previousPath)} \u2192 ${ev(s.path)}`:ev(s.path);let c=document.createElement("span");c.className="stats",c.textContent=s.binary?"binary":`${s.additions===void 0?"":`+${s.additions}`} ${s.deletions===void 0?"":`\u2212${s.deletions}`}`.trim(),r.append(o,l,c),r.addEventListener("click",async()=>{if(!(!this.dispatchEvent(new CustomEvent("gitgraph-file-open",{bubbles:!0,composed:!0,cancelable:!0,detail:{change:s,base:i?.base,head:i?.head,comparison:i?.comparison}}))||!i||!this.#s?.getFileDiff)){if(s.unavailableReason){this.#o={base:i.base,head:i.head,path:s.path,unavailableReason:s.unavailableReason},this.#c();return}try{this.#o=await this.#s.getFileDiff(this.#t.repositoryId,i.base,i.head,s.path,3)}catch(f){this.#N(f)}this.#c()}}),a.append(r),e.append(a)}}#nt(e){return this.dateType==="authored"?e.authoredAt??e.committedAt:e.committedAt??e.authoredAt}#it(e){return e.kind==="working-tree"?"working tree":J0(e.oid)}#H(){this.#n=void 0,this.#f=void 0,this.#r=void 0,this.#g=!1,this.#p=void 0,this.#o=void 0,this.#m.clear(),this.#b=void 0,this.#i(),this.#c()}#R(){return this.#n?this.#t.commits.findIndex(e=>e.oid===this.#n):-1}#v(e,t){return e*this.#a+(t>=0&&e>t?this.#P:0)}#ft(e){if(this.#n!==e)return;let t=this.#R(),n=this.#e.querySelector(".scroller");if(t<0||!n)return;let i=t*this.#a,s=i+this.#a+this.#P,a=n.scrollTop;s>a+n.clientHeight&&(a=s-n.clientHeight),i<a&&(a=i),a!==n.scrollTop&&n.scrollTo({top:a,behavior:"smooth"})}async#y(e,t=!1){if(!this.#s||e&&!this.#t.hasMore)return;this.#O?.abort();let n=new AbortController;this.#O=n;let i=t?{scrollTop:this.#e.querySelector(".scroller")?.scrollTop??0,selectedOid:this.#n,details:this.#r}:void 0;this.#I=!e&&!t,this.#M=e,this.#E=void 0,this.setAttribute("aria-busy","true"),this.#i();try{let s=await this.#s.getHistory({repositoryId:this.#t.repositoryId,refs:this.#h.length?this.#h:void 0,cursor:e?this.#t.cursor:void 0,limit:200,includeWorkingTree:!0,signal:n.signal});e?this.appendPage(s):(this.setData(s),i&&this.#pt(i))}catch(s){if(n.signal.aborted)return;this.#N(s)}finally{this.#I=!1,this.#M=!1,this.#O===n&&this.setAttribute("aria-busy","false"),this.#i()}}#pt(e){let t=e.selectedOid?this.#t.commits.find(i=>i.oid===e.selectedOid):void 0;t&&(this.#n=t.oid,e.details?.commit.oid===t.oid&&(this.#r=e.details),this.#Q(t)),this.#i();let n=this.#e.querySelector(".scroller");n&&e.scrollTop!==n.scrollTop&&(n.scrollTop=e.scrollTop,this.#i())}#N(e){this.#E=e instanceof Error?e.message:String(e),this.dispatchEvent(new CustomEvent("gitgraph-error",{bubbles:!0,composed:!0,detail:{error:e}})),this.#i()}};function v1(e=yR){return typeof customElements<"u"&&!customElements.get(e)&&customElements.define(e,g1),g1}function CR(e){return{commits:e.commits??[],refs:e.refs??[],head:e.head,hasMore:!!e.hasMore,repositoryId:e.repositoryId,repositoryName:e.repositoryName}}var Bd=class{api;constructor(t){this.api=t}async getCapabilities(){return{protocolVersion:"1",history:!0,details:!0,compare:!1,diff:!0,workingTree:!1,stashes:!1,maxPageSize:200,maxDiffBytes:256*1024}}async getHistory(t={}){let n=new URLSearchParams;n.set("limit",String(Math.min(200,Math.max(1,t.limit??200)))),t.cursor&&n.set("cursor",t.cursor);for(let s of t.refs??[])n.append("ref",s);let i=await this.api(`/api/git-history?${n}`,t.signal);return CR(i)}async getCommitDetails(t,n,i){let s=iv(n);return await this.api(`/api/git-commit?oid=${encodeURIComponent(s)}`,i)}async getFileDiff(t,n,i,s,a=3,r){let o=new URLSearchParams({base:iv(n),head:iv(i),path:s,context:String(a)});return await this.api(`/api/git-diff?${o}`,r)}};function iv(e){if(e.kind!=="commit")throw new Error("CGRX Git history supports commit revisions only");return e.oid}var Ja={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Qa={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},q1=0,Ov=1,Y1=2;var Mu=1,Z1=2,Al=3,$a=0,Zn=1,Ms=2,Es=0,tr=1,Eu=2,Pv=3,Bv=4,j1=5;var Vr=100,K1=101,J1=102,Q1=103,$1=104,tE=200,eE=201,nE=202,iE=203,zv=204,Fv=205,sE=206,aE=207,rE=208,oE=209,lE=210,cE=211,uE=212,hE=213,dE=214,ff=0,pf=1,mf=2,gl=3,gf=4,vf=5,_f=6,yf=7,Gv=0,fE=1,pE=2,ji=0,Hv=1,Vv=2,kv=3,Xv=4,Wv=5,qv=6,Yv=7;var Zv=300,er=301,kr=302,Yf=303,Zf=304,Tu=306,xf=1e3,_s=1001,Sf=1002,gn=1003,mE=1004;var wu=1005;var wn=1006,jf=1007;var nr=1008;var bi=1009,jv=1010,Kv=1011,Cl=1012,Kf=1013,Ki=1014,Ji=1015,Qi=1016,Jf=1017,Qf=1018,Rl=1020,Jv=35902,Qv=35899,$v=1021,t_=1022,Pi=1023,ys=1026,ir=1027,e_=1028,$f=1029,sr=1030,tp=1031;var ep=1033,Au=33776,Cu=33777,Ru=33778,Nu=33779,np=35840,ip=35841,sp=35842,ap=35843,rp=36196,op=37492,lp=37496,cp=37488,up=37489,Du=37490,hp=37491,dp=37808,fp=37809,pp=37810,mp=37811,gp=37812,vp=37813,_p=37814,yp=37815,xp=37816,Sp=37817,bp=37818,Mp=37819,Ep=37820,Tp=37821,wp=36492,Ap=36494,Cp=36495,Rp=36283,Np=36284,Lu=36285,Dp=36286;var Qc=2300,bf=2301,hf=2302,Av=2303,Cv=2400,Rv=2401,Nv=2402;var gE=3200;var n_=0,vE=1,na="",Tn="srgb",$c="srgb-linear",tu="linear",_e="srgb";var df=7680;var _E=519,yE=512,xE=513,SE=514,Lp=515,bE=516,ME=517,Up=518,EE=519,i_=35044;var s_="300 es",Yi=2e3,eu=2001;function RR(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function NR(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function nu(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function TE(){let e=nu("canvas");return e.style.display="block",e}var _1={},vl=null;function iu(...e){let t="THREE."+e.shift();vl?vl("log",t,...e):console.log(t,...e)}function wE(e){let t=e[0];if(typeof t=="string"&&t.startsWith("TSL:")){let n=e[1];n&&n.isStackTrace?e[0]+=" "+n.getLocation():e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function It(...e){e=wE(e);let t="THREE."+e.shift();if(vl)vl("warn",t,...e);else{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function Pt(...e){e=wE(e);let t="THREE."+e.shift();if(vl)vl("error",t,...e);else{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Fr(...e){let t=e.join(" ");t in _1||(_1[t]=!0,It(...e))}function AE(e,t,n){return new Promise(function(i,s){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:s();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:i()}}setTimeout(a,n)})}var CE={[ff]:pf,[mf]:_f,[gf]:yf,[gl]:vf,[pf]:ff,[_f]:mf,[yf]:gf,[vf]:gl},Zi=class{addEventListener(t,n){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(n)===-1&&i[t].push(n)}hasEventListener(t,n){let i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(n)!==-1}removeEventListener(t,n){let i=this._listeners;if(i===void 0)return;let s=i[t];if(s!==void 0){let a=s.indexOf(n);a!==-1&&s.splice(a,1)}}dispatchEvent(t){let n=this._listeners;if(n===void 0)return;let i=n[t.type];if(i!==void 0){t.target=this;let s=i.slice(0);for(let a=0,r=s.length;a<r;a++)s[a].call(this,t);t.target=null}}},Dn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],y1=1234567,Kc=Math.PI/180,_l=180/Math.PI;function $s(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Dn[e&255]+Dn[e>>8&255]+Dn[e>>16&255]+Dn[e>>24&255]+"-"+Dn[t&255]+Dn[t>>8&255]+"-"+Dn[t>>16&15|64]+Dn[t>>24&255]+"-"+Dn[n&63|128]+Dn[n>>8&255]+"-"+Dn[n>>16&255]+Dn[n>>24&255]+Dn[i&255]+Dn[i>>8&255]+Dn[i>>16&255]+Dn[i>>24&255]).toLowerCase()}function Zt(e,t,n){return Math.max(t,Math.min(n,e))}function a_(e,t){return(e%t+t)%t}function DR(e,t,n,i,s){return i+(e-t)*(s-i)/(n-t)}function LR(e,t,n){return e!==t?(n-e)/(t-e):0}function Jc(e,t,n){return(1-n)*e+n*t}function UR(e,t,n,i){return Jc(e,t,1-Math.exp(-n*i))}function IR(e,t=1){return t-Math.abs(a_(e,t*2)-t)}function OR(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function PR(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function BR(e,t){return e+Math.floor(Math.random()*(t-e+1))}function zR(e,t){return e+Math.random()*(t-e)}function FR(e){return e*(.5-Math.random())}function GR(e){e!==void 0&&(y1=e);let t=y1+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function HR(e){return e*Kc}function VR(e){return e*_l}function kR(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function XR(e){return Math.pow(2,Math.ceil(Math.log(e)/Math.LN2))}function WR(e){return Math.pow(2,Math.floor(Math.log(e)/Math.LN2))}function qR(e,t,n,i,s){let a=Math.cos,r=Math.sin,o=a(n/2),l=r(n/2),c=a((t+i)/2),h=r((t+i)/2),f=a((t-i)/2),u=r((t-i)/2),p=a((i-t)/2),m=r((i-t)/2);switch(s){case"XYX":e.set(o*h,l*f,l*u,o*c);break;case"YZY":e.set(l*u,o*h,l*f,o*c);break;case"ZXZ":e.set(l*f,l*u,o*h,o*c);break;case"XZX":e.set(o*h,l*m,l*p,o*c);break;case"YXY":e.set(l*p,o*h,l*m,o*c);break;case"ZYZ":e.set(l*m,l*p,o*h,o*c);break;default:It("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function qi(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function be(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Ts={DEG2RAD:Kc,RAD2DEG:_l,generateUUID:$s,clamp:Zt,euclideanModulo:a_,mapLinear:DR,inverseLerp:LR,lerp:Jc,damp:UR,pingpong:IR,smoothstep:OR,smootherstep:PR,randInt:BR,randFloat:zR,randFloatSpread:FR,seededRandom:GR,degToRad:HR,radToDeg:VR,isPowerOfTwo:kR,ceilPowerOfTwo:XR,floorPowerOfTwo:WR,setQuaternionFromProperEuler:qR,normalize:be,denormalize:qi},Ut=class e{static{e.prototype.isVector2=!0}constructor(t=0,n=0){this.x=t,this.y=n}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,n){return this.x=t,this.y=n,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let n=this.x,i=this.y,s=t.elements;return this.x=s[0]*n+s[3]*i+s[6],this.y=s[1]*n+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,n){return this.x=Zt(this.x,t.x,n.x),this.y=Zt(this.y,t.y,n.y),this}clampScalar(t,n){return this.x=Zt(this.x,t,n),this.y=Zt(this.y,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Zt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(t)/n;return Math.acos(Zt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let n=this.x-t.x,i=this.y-t.y;return n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this}rotateAround(t,n){let i=Math.cos(n),s=Math.sin(n),a=this.x-t.x,r=this.y-t.y;return this.x=a*i-r*s+t.x,this.y=a*s+r*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},yi=class{constructor(t=0,n=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=n,this._z=i,this._w=s}static slerpFlat(t,n,i,s,a,r,o){let l=i[s+0],c=i[s+1],h=i[s+2],f=i[s+3],u=a[r+0],p=a[r+1],m=a[r+2],S=a[r+3];if(f!==S||l!==u||c!==p||h!==m){let g=l*u+c*p+h*m+f*S;g<0&&(u=-u,p=-p,m=-m,S=-S,g=-g);let d=1-o;if(g<.9995){let v=Math.acos(g),b=Math.sin(v);d=Math.sin(d*v)/b,o=Math.sin(o*v)/b,l=l*d+u*o,c=c*d+p*o,h=h*d+m*o,f=f*d+S*o}else{l=l*d+u*o,c=c*d+p*o,h=h*d+m*o,f=f*d+S*o;let v=1/Math.sqrt(l*l+c*c+h*h+f*f);l*=v,c*=v,h*=v,f*=v}}t[n]=l,t[n+1]=c,t[n+2]=h,t[n+3]=f}static multiplyQuaternionsFlat(t,n,i,s,a,r){let o=i[s],l=i[s+1],c=i[s+2],h=i[s+3],f=a[r],u=a[r+1],p=a[r+2],m=a[r+3];return t[n]=o*m+h*f+l*p-c*u,t[n+1]=l*m+h*u+c*f-o*p,t[n+2]=c*m+h*p+o*u-l*f,t[n+3]=h*m-o*f-l*u-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,n,i,s){return this._x=t,this._y=n,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,n=!0){let i=t._x,s=t._y,a=t._z,r=t._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(s/2),f=o(a/2),u=l(i/2),p=l(s/2),m=l(a/2);switch(r){case"XYZ":this._x=u*h*f+c*p*m,this._y=c*p*f-u*h*m,this._z=c*h*m+u*p*f,this._w=c*h*f-u*p*m;break;case"YXZ":this._x=u*h*f+c*p*m,this._y=c*p*f-u*h*m,this._z=c*h*m-u*p*f,this._w=c*h*f+u*p*m;break;case"ZXY":this._x=u*h*f-c*p*m,this._y=c*p*f+u*h*m,this._z=c*h*m+u*p*f,this._w=c*h*f-u*p*m;break;case"ZYX":this._x=u*h*f-c*p*m,this._y=c*p*f+u*h*m,this._z=c*h*m-u*p*f,this._w=c*h*f+u*p*m;break;case"YZX":this._x=u*h*f+c*p*m,this._y=c*p*f+u*h*m,this._z=c*h*m-u*p*f,this._w=c*h*f-u*p*m;break;case"XZY":this._x=u*h*f-c*p*m,this._y=c*p*f-u*h*m,this._z=c*h*m+u*p*f,this._w=c*h*f+u*p*m;break;default:It("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,n){let i=n/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let n=t.elements,i=n[0],s=n[4],a=n[8],r=n[1],o=n[5],l=n[9],c=n[2],h=n[6],f=n[10],u=i+o+f;if(u>0){let p=.5/Math.sqrt(u+1);this._w=.25/p,this._x=(h-l)*p,this._y=(a-c)*p,this._z=(r-s)*p}else if(i>o&&i>f){let p=2*Math.sqrt(1+i-o-f);this._w=(h-l)/p,this._x=.25*p,this._y=(s+r)/p,this._z=(a+c)/p}else if(o>f){let p=2*Math.sqrt(1+o-i-f);this._w=(a-c)/p,this._x=(s+r)/p,this._y=.25*p,this._z=(l+h)/p}else{let p=2*Math.sqrt(1+f-i-o);this._w=(r-s)/p,this._x=(a+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,n){let i=t.dot(n)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*n.z-t.z*n.y,this._y=t.z*n.x-t.x*n.z,this._z=t.x*n.y-t.y*n.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(Zt(this.dot(t),-1,1)))}rotateTowards(t,n){let i=this.angleTo(t);if(i===0)return this;let s=Math.min(1,n/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,n){let i=t._x,s=t._y,a=t._z,r=t._w,o=n._x,l=n._y,c=n._z,h=n._w;return this._x=i*h+r*o+s*c-a*l,this._y=s*h+r*l+a*o-i*c,this._z=a*h+r*c+i*l-s*o,this._w=r*h-i*o-s*l-a*c,this._onChangeCallback(),this}slerp(t,n){let i=t._x,s=t._y,a=t._z,r=t._w,o=this.dot(t);o<0&&(i=-i,s=-s,a=-a,r=-r,o=-o);let l=1-n;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,n=Math.sin(n*c)/h,this._x=this._x*l+i*n,this._y=this._y*l+s*n,this._z=this._z*l+a*n,this._w=this._w*l+r*n,this._onChangeCallback()}else this._x=this._x*l+i*n,this._y=this._y*l+s*n,this._z=this._z*l+a*n,this._w=this._w*l+r*n,this.normalize();return this}slerpQuaternions(t,n,i){return this.copy(t).slerp(n,i)}random(){let t=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),a=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),a*Math.sin(n),a*Math.cos(n))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,n=0){return this._x=t[n],this._y=t[n+1],this._z=t[n+2],this._w=t[n+3],this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._w,t}fromBufferAttribute(t,n){return this._x=t.getX(n),this._y=t.getY(n),this._z=t.getZ(n),this._w=t.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},z=class e{static{e.prototype.isVector3=!0}constructor(t=0,n=0,i=0){this.x=t,this.y=n,this.z=i}set(t,n,i){return i===void 0&&(i=this.z),this.x=t,this.y=n,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,n){return this.x=t.x*n.x,this.y=t.y*n.y,this.z=t.z*n.z,this}applyEuler(t){return this.applyQuaternion(x1.setFromEuler(t))}applyAxisAngle(t,n){return this.applyQuaternion(x1.setFromAxisAngle(t,n))}applyMatrix3(t){let n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[3]*i+a[6]*s,this.y=a[1]*n+a[4]*i+a[7]*s,this.z=a[2]*n+a[5]*i+a[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let n=this.x,i=this.y,s=this.z,a=t.elements,r=1/(a[3]*n+a[7]*i+a[11]*s+a[15]);return this.x=(a[0]*n+a[4]*i+a[8]*s+a[12])*r,this.y=(a[1]*n+a[5]*i+a[9]*s+a[13])*r,this.z=(a[2]*n+a[6]*i+a[10]*s+a[14])*r,this}applyQuaternion(t){let n=this.x,i=this.y,s=this.z,a=t.x,r=t.y,o=t.z,l=t.w,c=2*(r*s-o*i),h=2*(o*n-a*s),f=2*(a*i-r*n);return this.x=n+l*c+r*f-o*h,this.y=i+l*h+o*c-a*f,this.z=s+l*f+a*h-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[4]*i+a[8]*s,this.y=a[1]*n+a[5]*i+a[9]*s,this.z=a[2]*n+a[6]*i+a[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,n){return this.x=Zt(this.x,t.x,n.x),this.y=Zt(this.y,t.y,n.y),this.z=Zt(this.z,t.z,n.z),this}clampScalar(t,n){return this.x=Zt(this.x,t,n),this.y=Zt(this.y,t,n),this.z=Zt(this.z,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Zt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,n){let i=t.x,s=t.y,a=t.z,r=n.x,o=n.y,l=n.z;return this.x=s*l-a*o,this.y=a*r-i*l,this.z=i*o-s*r,this}projectOnVector(t){let n=t.lengthSq();if(n===0)return this.set(0,0,0);let i=t.dot(this)/n;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return sv.copy(this).projectOnVector(t),this.sub(sv)}reflect(t){return this.sub(sv.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(t)/n;return Math.acos(Zt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let n=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return n*n+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,n,i){let s=Math.sin(n)*t;return this.x=s*Math.sin(i),this.y=Math.cos(n)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,n,i){return this.x=t*Math.sin(n),this.y=i,this.z=t*Math.cos(n),this}setFromMatrixPosition(t){let n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(t){let n=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=n,this.y=i,this.z=s,this}setFromMatrixColumn(t,n){return this.fromArray(t.elements,n*4)}setFromMatrix3Column(t,n){return this.fromArray(t.elements,n*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(t),this.y=n,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},sv=new z,x1=new yi,Vt=class e{static{e.prototype.isMatrix3=!0}constructor(t,n,i,s,a,r,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,r,o,l,c)}set(t,n,i,s,a,r,o,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=n,h[4]=a,h[5]=l,h[6]=i,h[7]=r,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(t,n,i){return t.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let n=t.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){let i=t.elements,s=n.elements,a=this.elements,r=i[0],o=i[3],l=i[6],c=i[1],h=i[4],f=i[7],u=i[2],p=i[5],m=i[8],S=s[0],g=s[3],d=s[6],v=s[1],b=s[4],x=s[7],T=s[2],E=s[5],w=s[8];return a[0]=r*S+o*v+l*T,a[3]=r*g+o*b+l*E,a[6]=r*d+o*x+l*w,a[1]=c*S+h*v+f*T,a[4]=c*g+h*b+f*E,a[7]=c*d+h*x+f*w,a[2]=u*S+p*v+m*T,a[5]=u*g+p*b+m*E,a[8]=u*d+p*x+m*w,this}multiplyScalar(t){let n=this.elements;return n[0]*=t,n[3]*=t,n[6]*=t,n[1]*=t,n[4]*=t,n[7]*=t,n[2]*=t,n[5]*=t,n[8]*=t,this}determinant(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return n*r*h-n*o*c-i*a*h+i*o*l+s*a*c-s*r*l}invert(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],f=h*r-o*c,u=o*l-h*a,p=c*a-r*l,m=n*f+i*u+s*p;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let S=1/m;return t[0]=f*S,t[1]=(s*c-h*i)*S,t[2]=(o*i-s*r)*S,t[3]=u*S,t[4]=(h*n-s*l)*S,t[5]=(s*a-o*n)*S,t[6]=p*S,t[7]=(i*l-c*n)*S,t[8]=(r*n-i*a)*S,this}transpose(){let t,n=this.elements;return t=n[1],n[1]=n[3],n[3]=t,t=n[2],n[2]=n[6],n[6]=t,t=n[5],n[5]=n[7],n[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let n=this.elements;return t[0]=n[0],t[1]=n[3],t[2]=n[6],t[3]=n[1],t[4]=n[4],t[5]=n[7],t[6]=n[2],t[7]=n[5],t[8]=n[8],this}setUvTransform(t,n,i,s,a,r,o){let l=Math.cos(a),c=Math.sin(a);return this.set(i*l,i*c,-i*(l*r+c*o)+r+t,-s*c,s*l,-s*(-c*r+l*o)+o+n,0,0,1),this}scale(t,n){return Fr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(av.makeScale(t,n)),this}rotate(t){return Fr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(av.makeRotation(-t)),this}translate(t,n){return Fr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(av.makeTranslation(t,n)),this}makeTranslation(t,n){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,n,0,0,1),this}makeRotation(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(t,n){return this.set(t,0,0,0,n,0,0,0,1),this}equals(t){let n=this.elements,i=t.elements;for(let s=0;s<9;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<9;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){let i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}},av=new Vt,S1=new Vt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),b1=new Vt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function YR(){let e={enabled:!0,workingColorSpace:$c,spaces:{},convert:function(s,a,r){return this.enabled===!1||a===r||!a||!r||(this.spaces[a].transfer===_e&&(s.r=ta(s.r),s.g=ta(s.g),s.b=ta(s.b)),this.spaces[a].primaries!==this.spaces[r].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===_e&&(s.r=ml(s.r),s.g=ml(s.g),s.b=ml(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===na?tu:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,r){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return Fr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),e.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return Fr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),e.colorSpaceToWorking(s,a)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return e.define({[$c]:{primaries:t,whitePoint:i,transfer:tu,toXYZ:S1,fromXYZ:b1,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:Tn},outputColorSpaceConfig:{drawingBufferColorSpace:Tn}},[Tn]:{primaries:t,whitePoint:i,transfer:_e,toXYZ:S1,fromXYZ:b1,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:Tn}}}),e}var se=YR();function ta(e){return e<.04045?e*.0773993808:Math.pow(e*.9478672986+.0521327014,2.4)}function ml(e){return e<.0031308?e*12.92:1.055*Math.pow(e,.41666)-.055}var Qo,Mf=class{static getDataURL(t,n="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{Qo===void 0&&(Qo=nu("canvas")),Qo.width=t.width,Qo.height=t.height;let s=Qo.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),i=Qo}return i.toDataURL(n)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let n=nu("canvas");n.width=t.width,n.height=t.height;let i=n.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let s=i.getImageData(0,0,t.width,t.height),a=s.data;for(let r=0;r<a.length;r++)a[r]=ta(a[r]/255)*255;return i.putImageData(s,0,0),n}else if(t.data){let n=t.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(ta(n[i]/255)*255):n[i]=ta(n[i]);return{data:n,width:t.width,height:t.height}}else return It("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},ZR=0,yl=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:ZR++}),this.uuid=$s(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let n=this.data;return typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement?t.set(n.videoWidth,n.videoHeight,0):typeof VideoFrame<"u"&&n instanceof VideoFrame?t.set(n.displayWidth,n.displayHeight,0):n!==null?t.set(n.width,n.height,n.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let a;if(Array.isArray(s)){a=[];for(let r=0,o=s.length;r<o;r++)s[r].isDataTexture?a.push(rv(s[r].image)):a.push(rv(s[r]))}else a=rv(s);i.url=a}return n||(t.images[this.uuid]=i),i}};function rv(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap?Mf.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(It("Texture: Unable to serialize Texture."),{})}var jR=0,ov=new z,Wn=class e extends Zi{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,i=_s,s=_s,a=wn,r=nr,o=Pi,l=bi,c=e.DEFAULT_ANISOTROPY,h=na){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:jR++}),this.uuid=$s(),this.name="",this.source=new yl(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=a,this.minFilter=r,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Ut(0,0),this.repeat=new Ut(1,1),this.center=new Ut(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Vt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(ov).x}get height(){return this.source.getSize(ov).y}get depth(){return this.source.getSize(ov).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let n in t){let i=t[n];if(i===void 0){It(`Texture.setValues(): parameter '${n}' has value of undefined.`);continue}let s=this[n];if(s===void 0){It(`Texture.setValues(): property '${n}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[n]=i}}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Zv)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case xf:t.x=t.x-Math.floor(t.x);break;case _s:t.x=t.x<0?0:1;break;case Sf:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case xf:t.y=t.y-Math.floor(t.y);break;case _s:t.y=t.y<0?0:1;break;case Sf:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};Wn.DEFAULT_IMAGE=null;Wn.DEFAULT_MAPPING=Zv;Wn.DEFAULT_ANISOTROPY=1;var Xe=class e{static{e.prototype.isVector4=!0}constructor(t=0,n=0,i=0,s=1){this.x=t,this.y=n,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,n,i,s){return this.x=t,this.y=n,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this.w=t.w+n.w,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this.w+=t.w*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this.w=t.w-n.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let n=this.x,i=this.y,s=this.z,a=this.w,r=t.elements;return this.x=r[0]*n+r[4]*i+r[8]*s+r[12]*a,this.y=r[1]*n+r[5]*i+r[9]*s+r[13]*a,this.z=r[2]*n+r[6]*i+r[10]*s+r[14]*a,this.w=r[3]*n+r[7]*i+r[11]*s+r[15]*a,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let n=Math.sqrt(1-t.w*t.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/n,this.y=t.y/n,this.z=t.z/n),this}setAxisAngleFromRotationMatrix(t){let n,i,s,a,l=t.elements,c=l[0],h=l[4],f=l[8],u=l[1],p=l[5],m=l[9],S=l[2],g=l[6],d=l[10];if(Math.abs(h-u)<.01&&Math.abs(f-S)<.01&&Math.abs(m-g)<.01){if(Math.abs(h+u)<.1&&Math.abs(f+S)<.1&&Math.abs(m+g)<.1&&Math.abs(c+p+d-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;let b=(c+1)/2,x=(p+1)/2,T=(d+1)/2,E=(h+u)/4,w=(f+S)/4,_=(m+g)/4;return b>x&&b>T?b<.01?(i=0,s=.707106781,a=.707106781):(i=Math.sqrt(b),s=E/i,a=w/i):x>T?x<.01?(i=.707106781,s=0,a=.707106781):(s=Math.sqrt(x),i=E/s,a=_/s):T<.01?(i=.707106781,s=.707106781,a=0):(a=Math.sqrt(T),i=w/a,s=_/a),this.set(i,s,a,n),this}let v=Math.sqrt((g-m)*(g-m)+(f-S)*(f-S)+(u-h)*(u-h));return Math.abs(v)<.001&&(v=1),this.x=(g-m)/v,this.y=(f-S)/v,this.z=(u-h)/v,this.w=Math.acos((c+p+d-1)/2),this}setFromMatrixPosition(t){let n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,n){return this.x=Zt(this.x,t.x,n.x),this.y=Zt(this.y,t.y,n.y),this.z=Zt(this.z,t.z,n.z),this.w=Zt(this.w,t.w,n.w),this}clampScalar(t,n){return this.x=Zt(this.x,t,n),this.y=Zt(this.y,t,n),this.z=Zt(this.z,t,n),this.w=Zt(this.w,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(Zt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this.w+=(t.w-this.w)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this.w=t.w+(n.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this.w=t[n+3],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t[n+3]=this.w,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this.w=t.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ef=class extends Zi{constructor(t=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:wn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=n,this.depth=i.depth,this.scissor=new Xe(0,0,t,n),this.scissorTest=!1,this.viewport=new Xe(0,0,t,n),this.textures=[];let s={width:t,height:n,depth:i.depth},a=new Wn(s),r=i.count;for(let o=0;o<r;o++)this.textures[o]=a.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){let n={minFilter:wn,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(n.mapping=t.mapping),t.wrapS!==void 0&&(n.wrapS=t.wrapS),t.wrapT!==void 0&&(n.wrapT=t.wrapT),t.wrapR!==void 0&&(n.wrapR=t.wrapR),t.magFilter!==void 0&&(n.magFilter=t.magFilter),t.minFilter!==void 0&&(n.minFilter=t.minFilter),t.format!==void 0&&(n.format=t.format),t.type!==void 0&&(n.type=t.type),t.anisotropy!==void 0&&(n.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(n.colorSpace=t.colorSpace),t.flipY!==void 0&&(n.flipY=t.flipY),t.generateMipmaps!==void 0&&(n.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(n.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,n,i=1){if(this.width!==t||this.height!==n||this.depth!==i){this.width=t,this.height=n,this.depth=i;for(let s=0,a=this.textures.length;s<a;s++)this.textures[s].image.width=t,this.textures[s].image.height=n,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,n),this.scissor.set(0,0,t,n)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++){this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;let s=Object.assign({},t.textures[n].image);this.textures[n].source=new yl(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let n=t.depthTexture.clone();n.renderTarget=null,this.depthTexture=n}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},ni=class extends Ef{constructor(t=1,n=1,i={}){super(t,n,i),this.isWebGLRenderTarget=!0}},su=class extends Wn{constructor(t=null,n=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=gn,this.minFilter=gn,this.wrapR=_s,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var Tf=class extends Wn{constructor(t=null,n=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=gn,this.minFilter=gn,this.wrapR=_s,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var Be=class e{static{e.prototype.isMatrix4=!0}constructor(t,n,i,s,a,r,o,l,c,h,f,u,p,m,S,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,r,o,l,c,h,f,u,p,m,S,g)}set(t,n,i,s,a,r,o,l,c,h,f,u,p,m,S,g){let d=this.elements;return d[0]=t,d[4]=n,d[8]=i,d[12]=s,d[1]=a,d[5]=r,d[9]=o,d[13]=l,d[2]=c,d[6]=h,d[10]=f,d[14]=u,d[3]=p,d[7]=m,d[11]=S,d[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(t){let n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(t){let n=this.elements,i=t.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(t){let n=t.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(t,n,i){return this.determinantAffine()===0?(t.set(1,0,0),n.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,n,i){return this.set(t.x,n.x,i.x,0,t.y,n.y,i.y,0,t.z,n.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let n=this.elements,i=t.elements,s=1/$o.setFromMatrixColumn(t,0).length(),a=1/$o.setFromMatrixColumn(t,1).length(),r=1/$o.setFromMatrixColumn(t,2).length();return n[0]=i[0]*s,n[1]=i[1]*s,n[2]=i[2]*s,n[3]=0,n[4]=i[4]*a,n[5]=i[5]*a,n[6]=i[6]*a,n[7]=0,n[8]=i[8]*r,n[9]=i[9]*r,n[10]=i[10]*r,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(t){let n=this.elements,i=t.x,s=t.y,a=t.z,r=Math.cos(i),o=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(a),f=Math.sin(a);if(t.order==="XYZ"){let u=r*h,p=r*f,m=o*h,S=o*f;n[0]=l*h,n[4]=-l*f,n[8]=c,n[1]=p+m*c,n[5]=u-S*c,n[9]=-o*l,n[2]=S-u*c,n[6]=m+p*c,n[10]=r*l}else if(t.order==="YXZ"){let u=l*h,p=l*f,m=c*h,S=c*f;n[0]=u+S*o,n[4]=m*o-p,n[8]=r*c,n[1]=r*f,n[5]=r*h,n[9]=-o,n[2]=p*o-m,n[6]=S+u*o,n[10]=r*l}else if(t.order==="ZXY"){let u=l*h,p=l*f,m=c*h,S=c*f;n[0]=u-S*o,n[4]=-r*f,n[8]=m+p*o,n[1]=p+m*o,n[5]=r*h,n[9]=S-u*o,n[2]=-r*c,n[6]=o,n[10]=r*l}else if(t.order==="ZYX"){let u=r*h,p=r*f,m=o*h,S=o*f;n[0]=l*h,n[4]=m*c-p,n[8]=u*c+S,n[1]=l*f,n[5]=S*c+u,n[9]=p*c-m,n[2]=-c,n[6]=o*l,n[10]=r*l}else if(t.order==="YZX"){let u=r*l,p=r*c,m=o*l,S=o*c;n[0]=l*h,n[4]=S-u*f,n[8]=m*f+p,n[1]=f,n[5]=r*h,n[9]=-o*h,n[2]=-c*h,n[6]=p*f+m,n[10]=u-S*f}else if(t.order==="XZY"){let u=r*l,p=r*c,m=o*l,S=o*c;n[0]=l*h,n[4]=-f,n[8]=c*h,n[1]=u*f+S,n[5]=r*h,n[9]=p*f-m,n[2]=m*f-p,n[6]=o*h,n[10]=S*f+u}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(t){return this.compose(KR,t,JR)}lookAt(t,n,i){let s=this.elements;return gi.subVectors(t,n),gi.lengthSq()===0&&(gi.z=1),gi.normalize(),Fa.crossVectors(i,gi),Fa.lengthSq()===0&&(Math.abs(i.z)===1?gi.x+=1e-4:gi.z+=1e-4,gi.normalize(),Fa.crossVectors(i,gi)),Fa.normalize(),zd.crossVectors(gi,Fa),s[0]=Fa.x,s[4]=zd.x,s[8]=gi.x,s[1]=Fa.y,s[5]=zd.y,s[9]=gi.y,s[2]=Fa.z,s[6]=zd.z,s[10]=gi.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){let i=t.elements,s=n.elements,a=this.elements,r=i[0],o=i[4],l=i[8],c=i[12],h=i[1],f=i[5],u=i[9],p=i[13],m=i[2],S=i[6],g=i[10],d=i[14],v=i[3],b=i[7],x=i[11],T=i[15],E=s[0],w=s[4],_=s[8],A=s[12],N=s[1],C=s[5],U=s[9],O=s[13],D=s[2],G=s[6],q=s[10],Z=s[14],nt=s[3],Y=s[7],$=s[11],st=s[15];return a[0]=r*E+o*N+l*D+c*nt,a[4]=r*w+o*C+l*G+c*Y,a[8]=r*_+o*U+l*q+c*$,a[12]=r*A+o*O+l*Z+c*st,a[1]=h*E+f*N+u*D+p*nt,a[5]=h*w+f*C+u*G+p*Y,a[9]=h*_+f*U+u*q+p*$,a[13]=h*A+f*O+u*Z+p*st,a[2]=m*E+S*N+g*D+d*nt,a[6]=m*w+S*C+g*G+d*Y,a[10]=m*_+S*U+g*q+d*$,a[14]=m*A+S*O+g*Z+d*st,a[3]=v*E+b*N+x*D+T*nt,a[7]=v*w+b*C+x*G+T*Y,a[11]=v*_+b*U+x*q+T*$,a[15]=v*A+b*O+x*Z+T*st,this}multiplyScalar(t){let n=this.elements;return n[0]*=t,n[4]*=t,n[8]*=t,n[12]*=t,n[1]*=t,n[5]*=t,n[9]*=t,n[13]*=t,n[2]*=t,n[6]*=t,n[10]*=t,n[14]*=t,n[3]*=t,n[7]*=t,n[11]*=t,n[15]*=t,this}determinant(){let t=this.elements,n=t[0],i=t[4],s=t[8],a=t[12],r=t[1],o=t[5],l=t[9],c=t[13],h=t[2],f=t[6],u=t[10],p=t[14],m=t[3],S=t[7],g=t[11],d=t[15],v=l*p-c*u,b=o*p-c*f,x=o*u-l*f,T=r*p-c*h,E=r*u-l*h,w=r*f-o*h;return n*(S*v-g*b+d*x)-i*(m*v-g*T+d*E)+s*(m*b-S*T+d*w)-a*(m*x-S*E+g*w)}determinantAffine(){let t=this.elements,n=t[0],i=t[4],s=t[8],a=t[1],r=t[5],o=t[9],l=t[2],c=t[6],h=t[10];return n*(r*h-o*c)-i*(a*h-o*l)+s*(a*c-r*l)}transpose(){let t=this.elements,n;return n=t[1],t[1]=t[4],t[4]=n,n=t[2],t[2]=t[8],t[8]=n,n=t[6],t[6]=t[9],t[9]=n,n=t[3],t[3]=t[12],t[12]=n,n=t[7],t[7]=t[13],t[13]=n,n=t[11],t[11]=t[14],t[14]=n,this}setPosition(t,n,i){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=n,s[14]=i),this}invert(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],f=t[9],u=t[10],p=t[11],m=t[12],S=t[13],g=t[14],d=t[15],v=n*o-i*r,b=n*l-s*r,x=n*c-a*r,T=i*l-s*o,E=i*c-a*o,w=s*c-a*l,_=h*S-f*m,A=h*g-u*m,N=h*d-p*m,C=f*g-u*S,U=f*d-p*S,O=u*d-p*g,D=v*O-b*U+x*C+T*N-E*A+w*_;if(D===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let G=1/D;return t[0]=(o*O-l*U+c*C)*G,t[1]=(s*U-i*O-a*C)*G,t[2]=(S*w-g*E+d*T)*G,t[3]=(u*E-f*w-p*T)*G,t[4]=(l*N-r*O-c*A)*G,t[5]=(n*O-s*N+a*A)*G,t[6]=(g*x-m*w-d*b)*G,t[7]=(h*w-u*x+p*b)*G,t[8]=(r*U-o*N+c*_)*G,t[9]=(i*N-n*U-a*_)*G,t[10]=(m*E-S*x+d*v)*G,t[11]=(f*x-h*E-p*v)*G,t[12]=(o*A-r*C-l*_)*G,t[13]=(n*C-i*A+s*_)*G,t[14]=(S*b-m*T-g*v)*G,t[15]=(h*T-f*b+u*v)*G,this}scale(t){let n=this.elements,i=t.x,s=t.y,a=t.z;return n[0]*=i,n[4]*=s,n[8]*=a,n[1]*=i,n[5]*=s,n[9]*=a,n[2]*=i,n[6]*=s,n[10]*=a,n[3]*=i,n[7]*=s,n[11]*=a,this}getMaxScaleOnAxis(){let t=this.elements,n=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(n,i,s))}makeTranslation(t,n,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(t){let n=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,n){let i=Math.cos(n),s=Math.sin(n),a=1-i,r=t.x,o=t.y,l=t.z,c=a*r,h=a*o;return this.set(c*r+i,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+i,h*l-s*r,0,c*l-s*o,h*l+s*r,a*l*l+i,0,0,0,0,1),this}makeScale(t,n,i){return this.set(t,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,n,i,s,a,r){return this.set(1,i,a,0,t,1,r,0,n,s,1,0,0,0,0,1),this}compose(t,n,i){let s=this.elements,a=n._x,r=n._y,o=n._z,l=n._w,c=a+a,h=r+r,f=o+o,u=a*c,p=a*h,m=a*f,S=r*h,g=r*f,d=o*f,v=l*c,b=l*h,x=l*f,T=i.x,E=i.y,w=i.z;return s[0]=(1-(S+d))*T,s[1]=(p+x)*T,s[2]=(m-b)*T,s[3]=0,s[4]=(p-x)*E,s[5]=(1-(u+d))*E,s[6]=(g+v)*E,s[7]=0,s[8]=(m+b)*w,s[9]=(g-v)*w,s[10]=(1-(u+S))*w,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,n,i){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let a=this.determinantAffine();if(a===0)return i.set(1,1,1),n.identity(),this;let r=$o.set(s[0],s[1],s[2]).length(),o=$o.set(s[4],s[5],s[6]).length(),l=$o.set(s[8],s[9],s[10]).length();a<0&&(r=-r),ki.copy(this);let c=1/r,h=1/o,f=1/l;return ki.elements[0]*=c,ki.elements[1]*=c,ki.elements[2]*=c,ki.elements[4]*=h,ki.elements[5]*=h,ki.elements[6]*=h,ki.elements[8]*=f,ki.elements[9]*=f,ki.elements[10]*=f,n.setFromRotationMatrix(ki),i.x=r,i.y=o,i.z=l,this}makePerspective(t,n,i,s,a,r,o=Yi,l=!1){let c=this.elements,h=2*a/(n-t),f=2*a/(i-s),u=(n+t)/(n-t),p=(i+s)/(i-s),m,S;if(l)m=a/(r-a),S=r*a/(r-a);else if(o===Yi)m=-(r+a)/(r-a),S=-2*r*a/(r-a);else if(o===eu)m=-r/(r-a),S=-r*a/(r-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=f,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=m,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,n,i,s,a,r,o=Yi,l=!1){let c=this.elements,h=2/(n-t),f=2/(i-s),u=-(n+t)/(n-t),p=-(i+s)/(i-s),m,S;if(l)m=1/(r-a),S=r/(r-a);else if(o===Yi)m=-2/(r-a),S=-(r+a)/(r-a);else if(o===eu)m=-1/(r-a),S=-a/(r-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=f,c[9]=0,c[13]=p,c[2]=0,c[6]=0,c[10]=m,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let n=this.elements,i=t.elements;for(let s=0;s<16;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<16;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){let i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t[n+9]=i[9],t[n+10]=i[10],t[n+11]=i[11],t[n+12]=i[12],t[n+13]=i[13],t[n+14]=i[14],t[n+15]=i[15],t}},$o=new z,ki=new Be,KR=new z(0,0,0),JR=new z(1,1,1),Fa=new z,zd=new z,gi=new z,M1=new Be,E1=new yi,Xa=class e{constructor(t=0,n=0,i=0,s=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,n,i,s=this._order){return this._x=t,this._y=n,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,n=this._order,i=!0){let s=t.elements,a=s[0],r=s[4],o=s[8],l=s[1],c=s[5],h=s[9],f=s[2],u=s[6],p=s[10];switch(n){case"XYZ":this._y=Math.asin(Zt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-r,a)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-Zt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-f,a),this._z=0);break;case"ZXY":this._x=Math.asin(Zt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-f,p),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-Zt(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(u,p),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(Zt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-f,a)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-Zt(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-h,p),this._y=0);break;default:It("Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,n,i){return M1.makeRotationFromQuaternion(t),this.setFromRotationMatrix(M1,n,i)}setFromVector3(t,n=this._order){return this.set(t.x,t.y,t.z,n)}reorder(t){return E1.setFromEuler(this),this.setFromQuaternion(E1,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Xa.DEFAULT_ORDER="XYZ";var xl=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},QR=0,T1=new z,tl=new yi,qs=new Be,Fd=new z,Vc=new z,$R=new z,t2=new yi,w1=new z(1,0,0),A1=new z(0,1,0),C1=new z(0,0,1),R1={type:"added"},e2={type:"removed"},el={type:"childadded",child:null},lv={type:"childremoved",child:null},qn=class e extends Zi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:QR++}),this.uuid=$s(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new z,n=new Xa,i=new yi,s=new z(1,1,1);function a(){i.setFromEuler(n,!1)}function r(){n.setFromQuaternion(i,void 0,!1)}n._onChange(a),i._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Be},normalMatrix:{value:new Vt}}),this.matrix=new Be,this.matrixWorld=new Be,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new xl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,n){this.quaternion.setFromAxisAngle(t,n)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,n){return tl.setFromAxisAngle(t,n),this.quaternion.multiply(tl),this}rotateOnWorldAxis(t,n){return tl.setFromAxisAngle(t,n),this.quaternion.premultiply(tl),this}rotateX(t){return this.rotateOnAxis(w1,t)}rotateY(t){return this.rotateOnAxis(A1,t)}rotateZ(t){return this.rotateOnAxis(C1,t)}translateOnAxis(t,n){return T1.copy(t).applyQuaternion(this.quaternion),this.position.add(T1.multiplyScalar(n)),this}translateX(t){return this.translateOnAxis(w1,t)}translateY(t){return this.translateOnAxis(A1,t)}translateZ(t){return this.translateOnAxis(C1,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(qs.copy(this.matrixWorld).invert())}lookAt(t,n,i){t.isVector3?Fd.copy(t):Fd.set(t,n,i);let s=this.parent;this.updateWorldMatrix(!0,!1),Vc.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?qs.lookAt(Vc,Fd,this.up):qs.lookAt(Fd,Vc,this.up),this.quaternion.setFromRotationMatrix(qs),s&&(qs.extractRotation(s.matrixWorld),tl.setFromRotationMatrix(qs),this.quaternion.premultiply(tl.invert()))}add(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return t===this?(Pt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(R1),el.child=t,this.dispatchEvent(el),el.child=null):Pt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let n=this.children.indexOf(t);return n!==-1&&(t.parent=null,this.children.splice(n,1),t.dispatchEvent(e2),lv.child=t,this.dispatchEvent(lv),lv.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),qs.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),qs.multiply(t.parent.matrixWorld)),t.applyMatrix4(qs),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(R1),el.child=t,this.dispatchEvent(el),el.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,n){if(this[t]===n)return this;for(let i=0,s=this.children.length;i<s;i++){let r=this.children[i].getObjectByProperty(t,n);if(r!==void 0)return r}}getObjectsByProperty(t,n,i=[]){this[t]===n&&i.push(this);let s=this.children;for(let a=0,r=s.length;a<r;a++)s[a].getObjectsByProperty(t,n,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Vc,t,$R),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Vc,t2,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let n=this.matrixWorld.elements;return t.set(n[8],n[9],n[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverseVisible(t)}traverseAncestors(t){let n=this.parent;n!==null&&(t(n),n.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let n=t.x,i=t.y,s=t.z,a=this.matrix.elements;a[12]+=n-a[0]*n-a[4]*i-a[8]*s,a[13]+=i-a[1]*n-a[5]*i-a[9]*s,a[14]+=s-a[2]*n-a[6]*i-a[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].updateMatrixWorld(t)}updateWorldMatrix(t,n,i=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),n===!0){let a=this.children;for(let r=0,o=a.length;r<o;r++)a[r].updateWorldMatrix(!1,!0,i)}}toJSON(t){let n=t===void 0||typeof t=="string",i={};n&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function a(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=a(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let f=l[c];a(t.shapes,f)}else a(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(a(t.materials,this.material[l]));s.material=o}else s.material=a(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(a(t.animations,l))}}if(n){let o=r(t.geometries),l=r(t.materials),c=r(t.textures),h=r(t.images),f=r(t.shapes),u=r(t.skeletons),p=r(t.animations),m=r(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),f.length>0&&(i.shapes=f),u.length>0&&(i.skeletons=u),p.length>0&&(i.animations=p),m.length>0&&(i.nodes=m)}return i.object=s,i;function r(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,n=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),n===!0)for(let i=0;i<t.children.length;i++){let s=t.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};qn.DEFAULT_UP=new z(0,1,0);qn.DEFAULT_MATRIX_AUTO_UPDATE=!0;qn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Qs=class extends qn{constructor(){super(),this.isGroup=!0,this.type="Group"}},n2={type:"move"},Sl=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Qs,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Qs,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new z,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new z),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Qs,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new z,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new z,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let n=this._hand;if(n)for(let i of t.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,n,i){let s=null,a=null,r=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&n.session.visibilityState!=="visible-blurred"){if(c&&t.hand){r=!0;for(let S of t.hand.values()){let g=n.getJointPose(S,i),d=this._getHandJoint(c,S);g!==null&&(d.matrix.fromArray(g.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=g.radius),d.visible=g!==null}let h=c.joints["index-finger-tip"],f=c.joints["thumb-tip"],u=h.position.distanceTo(f.position),p=.02,m=.005;c.inputState.pinching&&u>p+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=p-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(a=n.getPose(t.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=n.getPose(t.targetRaySpace,i),s===null&&a!==null&&(s=a),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(n2)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(t,n){if(t.joints[n.jointName]===void 0){let i=new Qs;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[n.jointName]=i,t.add(i)}return t.joints[n.jointName]}},RE={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ga={h:0,s:0,l:0},Gd={h:0,s:0,l:0};function cv(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var Xt=class{constructor(t,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,n,i)}set(t,n,i){if(n===void 0&&i===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,n,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,n=Tn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,se.colorSpaceToWorking(this,n),this}setRGB(t,n,i,s=se.workingColorSpace){return this.r=t,this.g=n,this.b=i,se.colorSpaceToWorking(this,s),this}setHSL(t,n,i,s=se.workingColorSpace){if(t=a_(t,1),n=Zt(n,0,1),i=Zt(i,0,1),n===0)this.r=this.g=this.b=i;else{let a=i<=.5?i*(1+n):i+n-i*n,r=2*i-a;this.r=cv(r,a,t+1/3),this.g=cv(r,a,t),this.b=cv(r,a,t-1/3)}return se.colorSpaceToWorking(this,s),this}setStyle(t,n=Tn){function i(a){a!==void 0&&parseFloat(a)<1&&It("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let a,r=s[1],o=s[2];switch(r){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,n);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,n);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,n);break;default:It("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let a=s[1],r=a.length;if(r===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,n);if(r===6)return this.setHex(parseInt(a,16),n);It("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,n);return this}setColorName(t,n=Tn){let i=RE[t.toLowerCase()];return i!==void 0?this.setHex(i,n):It("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=ta(t.r),this.g=ta(t.g),this.b=ta(t.b),this}copyLinearToSRGB(t){return this.r=ml(t.r),this.g=ml(t.g),this.b=ml(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Tn){return se.workingToColorSpace(Ln.copy(this),t),Math.round(Zt(Ln.r*255,0,255))*65536+Math.round(Zt(Ln.g*255,0,255))*256+Math.round(Zt(Ln.b*255,0,255))}getHexString(t=Tn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,n=se.workingColorSpace){se.workingToColorSpace(Ln.copy(this),n);let i=Ln.r,s=Ln.g,a=Ln.b,r=Math.max(i,s,a),o=Math.min(i,s,a),l,c,h=(o+r)/2;if(o===r)l=0,c=0;else{let f=r-o;switch(c=h<=.5?f/(r+o):f/(2-r-o),r){case i:l=(s-a)/f+(s<a?6:0);break;case s:l=(a-i)/f+2;break;case a:l=(i-s)/f+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,n=se.workingColorSpace){return se.workingToColorSpace(Ln.copy(this),n),t.r=Ln.r,t.g=Ln.g,t.b=Ln.b,t}getStyle(t=Tn){se.workingToColorSpace(Ln.copy(this),t);let n=Ln.r,i=Ln.g,s=Ln.b;return t!==Tn?`color(${t} ${n.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,n,i){return this.getHSL(Ga),this.setHSL(Ga.h+t,Ga.s+n,Ga.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,n){return this.r=t.r+n.r,this.g=t.g+n.g,this.b=t.b+n.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,n){return this.r+=(t.r-this.r)*n,this.g+=(t.g-this.g)*n,this.b+=(t.b-this.b)*n,this}lerpColors(t,n,i){return this.r=t.r+(n.r-t.r)*i,this.g=t.g+(n.g-t.g)*i,this.b=t.b+(n.b-t.b)*i,this}lerpHSL(t,n){this.getHSL(Ga),t.getHSL(Gd);let i=Jc(Ga.h,Gd.h,n),s=Jc(Ga.s,Gd.s,n),a=Jc(Ga.l,Gd.l,n);return this.setHSL(i,s,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let n=this.r,i=this.g,s=this.b,a=t.elements;return this.r=a[0]*n+a[3]*i+a[6]*s,this.g=a[1]*n+a[4]*i+a[7]*s,this.b=a[2]*n+a[5]*i+a[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,n=0){return this.r=t[n],this.g=t[n+1],this.b=t[n+2],this}toArray(t=[],n=0){return t[n]=this.r,t[n+1]=this.g,t[n+2]=this.b,t}fromBufferAttribute(t,n){return this.r=t.getX(n),this.g=t.getY(n),this.b=t.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Ln=new Xt;Xt.NAMES=RE;var au=class e{constructor(t,n=25e-5){this.isFogExp2=!0,this.name="",this.color=new Xt(t),this.density=n}clone(){return new e(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var ru=class extends qn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Xa,this.environmentIntensity=1,this.environmentRotation=new Xa,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,n){return super.copy(t,n),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let n=super.toJSON(t);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),n.object.backgroundBlurriness=this.backgroundBlurriness,n.object.backgroundIntensity=this.backgroundIntensity,n.object.backgroundRotation=this.backgroundRotation.toArray(),n.object.environmentIntensity=this.environmentIntensity,n.object.environmentRotation=this.environmentRotation.toArray(),n}},Xi=new z,Ys=new z,uv=new z,Zs=new z,nl=new z,il=new z,N1=new z,hv=new z,dv=new z,fv=new z,pv=new Xe,mv=new Xe,gv=new Xe,Js=class e{constructor(t=new z,n=new z,i=new z){this.a=t,this.b=n,this.c=i}static getNormal(t,n,i,s){s.subVectors(i,n),Xi.subVectors(t,n),s.cross(Xi);let a=s.lengthSq();return a>0?s.multiplyScalar(1/Math.sqrt(a)):s.set(0,0,0)}static getBarycoord(t,n,i,s,a){Xi.subVectors(s,n),Ys.subVectors(i,n),uv.subVectors(t,n);let r=Xi.dot(Xi),o=Xi.dot(Ys),l=Xi.dot(uv),c=Ys.dot(Ys),h=Ys.dot(uv),f=r*c-o*o;if(f===0)return a.set(0,0,0),null;let u=1/f,p=(c*l-o*h)*u,m=(r*h-o*l)*u;return a.set(1-p-m,m,p)}static containsPoint(t,n,i,s){return this.getBarycoord(t,n,i,s,Zs)===null?!1:Zs.x>=0&&Zs.y>=0&&Zs.x+Zs.y<=1}static getInterpolation(t,n,i,s,a,r,o,l){return this.getBarycoord(t,n,i,s,Zs)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,Zs.x),l.addScaledVector(r,Zs.y),l.addScaledVector(o,Zs.z),l)}static getInterpolatedAttribute(t,n,i,s,a,r){return pv.setScalar(0),mv.setScalar(0),gv.setScalar(0),pv.fromBufferAttribute(t,n),mv.fromBufferAttribute(t,i),gv.fromBufferAttribute(t,s),r.setScalar(0),r.addScaledVector(pv,a.x),r.addScaledVector(mv,a.y),r.addScaledVector(gv,a.z),r}static isFrontFacing(t,n,i,s){return Xi.subVectors(i,n),Ys.subVectors(t,n),Xi.cross(Ys).dot(s)<0}set(t,n,i){return this.a.copy(t),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(t,n,i,s){return this.a.copy(t[n]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,n,i,s){return this.a.fromBufferAttribute(t,n),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Xi.subVectors(this.c,this.b),Ys.subVectors(this.a,this.b),Xi.cross(Ys).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,i,s,a){return e.getInterpolation(t,this.a,this.b,this.c,n,i,s,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,n){let i=this.a,s=this.b,a=this.c,r,o;nl.subVectors(s,i),il.subVectors(a,i),hv.subVectors(t,i);let l=nl.dot(hv),c=il.dot(hv);if(l<=0&&c<=0)return n.copy(i);dv.subVectors(t,s);let h=nl.dot(dv),f=il.dot(dv);if(h>=0&&f<=h)return n.copy(s);let u=l*f-h*c;if(u<=0&&l>=0&&h<=0)return r=l/(l-h),n.copy(i).addScaledVector(nl,r);fv.subVectors(t,a);let p=nl.dot(fv),m=il.dot(fv);if(m>=0&&p<=m)return n.copy(a);let S=p*c-l*m;if(S<=0&&c>=0&&m<=0)return o=c/(c-m),n.copy(i).addScaledVector(il,o);let g=h*m-p*f;if(g<=0&&f-h>=0&&p-m>=0)return N1.subVectors(a,s),o=(f-h)/(f-h+(p-m)),n.copy(s).addScaledVector(N1,o);let d=1/(g+S+u);return r=S*d,o=u*d,n.copy(i).addScaledVector(nl,r).addScaledVector(il,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},xs=class{constructor(t=new z(1/0,1/0,1/0),n=new z(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=n}set(t,n){return this.min.copy(t),this.max.copy(n),this}setFromArray(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n+=3)this.expandByPoint(Wi.fromArray(t,n));return this}setFromBufferAttribute(t){this.makeEmpty();for(let n=0,i=t.count;n<i;n++)this.expandByPoint(Wi.fromBufferAttribute(t,n));return this}setFromPoints(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n++)this.expandByPoint(t[n]);return this}setFromCenterAndSize(t,n){let i=Wi.copy(n).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,n=!1){return this.makeEmpty(),this.expandByObject(t,n)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,n=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let a=i.getAttribute("position");if(n===!0&&a!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=a.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,Wi):Wi.fromBufferAttribute(a,r),Wi.applyMatrix4(t.matrixWorld),this.expandByPoint(Wi);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Hd.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Hd.copy(i.boundingBox)),Hd.applyMatrix4(t.matrixWorld),this.union(Hd)}let s=t.children;for(let a=0,r=s.length;a<r;a++)this.expandByObject(s[a],n);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,n){return n.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,Wi),Wi.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let n,i;return t.normal.x>0?(n=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(n=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(n+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(n+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(n+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(n+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),n<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(kc),Vd.subVectors(this.max,kc),sl.subVectors(t.a,kc),al.subVectors(t.b,kc),rl.subVectors(t.c,kc),Ha.subVectors(al,sl),Va.subVectors(rl,al),Or.subVectors(sl,rl);let n=[0,-Ha.z,Ha.y,0,-Va.z,Va.y,0,-Or.z,Or.y,Ha.z,0,-Ha.x,Va.z,0,-Va.x,Or.z,0,-Or.x,-Ha.y,Ha.x,0,-Va.y,Va.x,0,-Or.y,Or.x,0];return!vv(n,sl,al,rl,Vd)||(n=[1,0,0,0,1,0,0,0,1],!vv(n,sl,al,rl,Vd))?!1:(kd.crossVectors(Ha,Va),n=[kd.x,kd.y,kd.z],vv(n,sl,al,rl,Vd))}clampPoint(t,n){return n.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Wi).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(Wi).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(js[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),js[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),js[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),js[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),js[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),js[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),js[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),js[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(js),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},js=[new z,new z,new z,new z,new z,new z,new z,new z],Wi=new z,Hd=new xs,sl=new z,al=new z,rl=new z,Ha=new z,Va=new z,Or=new z,kc=new z,Vd=new z,kd=new z,Pr=new z;function vv(e,t,n,i,s){for(let a=0,r=e.length-3;a<=r;a+=3){Pr.fromArray(e,a);let o=s.x*Math.abs(Pr.x)+s.y*Math.abs(Pr.y)+s.z*Math.abs(Pr.z),l=t.dot(Pr),c=n.dot(Pr),h=i.dot(Pr);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var sn=new z,Xd=new Ut,i2=0,Xn=class extends Zi{constructor(t,n,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:i2++}),this.name="",this.array=t,this.itemSize=n,this.count=t!==void 0?t.length/n:0,this.normalized=i,this.usage=i_,this.updateRanges=[],this.gpuType=Ji,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,n,i){t*=this.itemSize,i*=n.itemSize;for(let s=0,a=this.itemSize;s<a;s++)this.array[t+s]=n.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)Xd.fromBufferAttribute(this,n),Xd.applyMatrix3(t),this.setXY(n,Xd.x,Xd.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)sn.fromBufferAttribute(this,n),sn.applyMatrix3(t),this.setXYZ(n,sn.x,sn.y,sn.z);return this}applyMatrix4(t){for(let n=0,i=this.count;n<i;n++)sn.fromBufferAttribute(this,n),sn.applyMatrix4(t),this.setXYZ(n,sn.x,sn.y,sn.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)sn.fromBufferAttribute(this,n),sn.applyNormalMatrix(t),this.setXYZ(n,sn.x,sn.y,sn.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)sn.fromBufferAttribute(this,n),sn.transformDirection(t),this.setXYZ(n,sn.x,sn.y,sn.z);return this}set(t,n=0){return this.array.set(t,n),this}getComponent(t,n){let i=this.array[t*this.itemSize+n];return this.normalized&&(i=qi(i,this.array)),i}setComponent(t,n,i){return this.normalized&&(i=be(i,this.array)),this.array[t*this.itemSize+n]=i,this}getX(t){let n=this.array[t*this.itemSize];return this.normalized&&(n=qi(n,this.array)),n}setX(t,n){return this.normalized&&(n=be(n,this.array)),this.array[t*this.itemSize]=n,this}getY(t){let n=this.array[t*this.itemSize+1];return this.normalized&&(n=qi(n,this.array)),n}setY(t,n){return this.normalized&&(n=be(n,this.array)),this.array[t*this.itemSize+1]=n,this}getZ(t){let n=this.array[t*this.itemSize+2];return this.normalized&&(n=qi(n,this.array)),n}setZ(t,n){return this.normalized&&(n=be(n,this.array)),this.array[t*this.itemSize+2]=n,this}getW(t){let n=this.array[t*this.itemSize+3];return this.normalized&&(n=qi(n,this.array)),n}setW(t,n){return this.normalized&&(n=be(n,this.array)),this.array[t*this.itemSize+3]=n,this}setXY(t,n,i){return t*=this.itemSize,this.normalized&&(n=be(n,this.array),i=be(i,this.array)),this.array[t+0]=n,this.array[t+1]=i,this}setXYZ(t,n,i,s){return t*=this.itemSize,this.normalized&&(n=be(n,this.array),i=be(i,this.array),s=be(s,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,n,i,s,a){return t*=this.itemSize,this.normalized&&(n=be(n,this.array),i=be(i,this.array),s=be(s,this.array),a=be(a,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var ou=class extends Xn{constructor(t,n,i){super(new Uint16Array(t),n,i)}};var lu=class extends Xn{constructor(t,n,i){super(new Uint32Array(t),n,i)}};var In=class extends Xn{constructor(t,n,i){super(new Float32Array(t),n,i)}},s2=new xs,Xc=new z,_v=new z,Ss=class{constructor(t=new z,n=-1){this.isSphere=!0,this.center=t,this.radius=n}set(t,n){return this.center.copy(t),this.radius=n,this}setFromPoints(t,n){let i=this.center;n!==void 0?i.copy(n):s2.setFromPoints(t).getCenter(i);let s=0;for(let a=0,r=t.length;a<r;a++)s=Math.max(s,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let n=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=n*n}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,n){let i=this.center.distanceToSquared(t);return n.copy(t),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Xc.subVectors(t,this.center);let n=Xc.lengthSq();if(n>this.radius*this.radius){let i=Math.sqrt(n),s=(i-this.radius)*.5;this.center.addScaledVector(Xc,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(_v.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Xc.copy(t.center).add(_v)),this.expandByPoint(Xc.copy(t.center).sub(_v))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},a2=0,Oi=new Be,yv=new qn,ol=new z,vi=new xs,Wc=new xs,mn=new z,vn=class e extends Zi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:a2++}),this.uuid=$s(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(RR(t)?lu:ou)(t,1):this.index=t,this}setIndirect(t,n=0){return this.indirect=t,this.indirectOffset=n,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,n){return this.attributes[t]=n,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,n,i=0){this.groups.push({start:t,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,n){this.drawRange.start=t,this.drawRange.count=n}applyMatrix4(t){let n=this.attributes.position;n!==void 0&&(n.applyMatrix4(t),n.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let a=new Vt().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Oi.makeRotationFromQuaternion(t),this.applyMatrix4(Oi),this}rotateX(t){return Oi.makeRotationX(t),this.applyMatrix4(Oi),this}rotateY(t){return Oi.makeRotationY(t),this.applyMatrix4(Oi),this}rotateZ(t){return Oi.makeRotationZ(t),this.applyMatrix4(Oi),this}translate(t,n,i){return Oi.makeTranslation(t,n,i),this.applyMatrix4(Oi),this}scale(t,n,i){return Oi.makeScale(t,n,i),this.applyMatrix4(Oi),this}lookAt(t){return yv.lookAt(t),yv.updateMatrix(),this.applyMatrix4(yv.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ol).negate(),this.translate(ol.x,ol.y,ol.z),this}setFromPoints(t){let n=this.getAttribute("position");if(n===void 0){let i=[];for(let s=0,a=t.length;s<a;s++){let r=t[s];i.push(r.x,r.y,r.z||0)}this.setAttribute("position",new In(i,3))}else{let i=Math.min(t.length,n.count);for(let s=0;s<i;s++){let a=t[s];n.setXYZ(s,a.x,a.y,a.z||0)}t.length>n.count&&It("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new xs);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Pt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new z(-1/0,-1/0,-1/0),new z(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),n)for(let i=0,s=n.length;i<s;i++){let a=n[i];vi.setFromBufferAttribute(a),this.morphTargetsRelative?(mn.addVectors(this.boundingBox.min,vi.min),this.boundingBox.expandByPoint(mn),mn.addVectors(this.boundingBox.max,vi.max),this.boundingBox.expandByPoint(mn)):(this.boundingBox.expandByPoint(vi.min),this.boundingBox.expandByPoint(vi.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Pt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ss);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Pt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new z,1/0);return}if(t){let i=this.boundingSphere.center;if(vi.setFromBufferAttribute(t),n)for(let a=0,r=n.length;a<r;a++){let o=n[a];Wc.setFromBufferAttribute(o),this.morphTargetsRelative?(mn.addVectors(vi.min,Wc.min),vi.expandByPoint(mn),mn.addVectors(vi.max,Wc.max),vi.expandByPoint(mn)):(vi.expandByPoint(Wc.min),vi.expandByPoint(Wc.max))}vi.getCenter(i);let s=0;for(let a=0,r=t.count;a<r;a++)mn.fromBufferAttribute(t,a),s=Math.max(s,i.distanceToSquared(mn));if(n)for(let a=0,r=n.length;a<r;a++){let o=n[a],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)mn.fromBufferAttribute(o,c),l&&(ol.fromBufferAttribute(t,c),mn.add(ol)),s=Math.max(s,i.distanceToSquared(mn))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Pt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,n=this.attributes;if(t===null||n.position===void 0||n.normal===void 0||n.uv===void 0){Pt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=n.position,s=n.normal,a=n.uv,r=this.getAttribute("tangent");(r===void 0||r.count!==i.count)&&(r=new Xn(new Float32Array(4*i.count),4),this.setAttribute("tangent",r));let o=[],l=[];for(let _=0;_<i.count;_++)o[_]=new z,l[_]=new z;let c=new z,h=new z,f=new z,u=new Ut,p=new Ut,m=new Ut,S=new z,g=new z;function d(_,A,N){c.fromBufferAttribute(i,_),h.fromBufferAttribute(i,A),f.fromBufferAttribute(i,N),u.fromBufferAttribute(a,_),p.fromBufferAttribute(a,A),m.fromBufferAttribute(a,N),h.sub(c),f.sub(c),p.sub(u),m.sub(u);let C=1/(p.x*m.y-m.x*p.y);isFinite(C)&&(S.copy(h).multiplyScalar(m.y).addScaledVector(f,-p.y).multiplyScalar(C),g.copy(f).multiplyScalar(p.x).addScaledVector(h,-m.x).multiplyScalar(C),o[_].add(S),o[A].add(S),o[N].add(S),l[_].add(g),l[A].add(g),l[N].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let _=0,A=v.length;_<A;++_){let N=v[_],C=N.start,U=N.count;for(let O=C,D=C+U;O<D;O+=3)d(t.getX(O+0),t.getX(O+1),t.getX(O+2))}let b=new z,x=new z,T=new z,E=new z;function w(_){T.fromBufferAttribute(s,_),E.copy(T);let A=o[_];b.copy(A),b.sub(T.multiplyScalar(T.dot(A))).normalize(),x.crossVectors(E,A);let C=x.dot(l[_])<0?-1:1;r.setXYZW(_,b.x,b.y,b.z,C)}for(let _=0,A=v.length;_<A;++_){let N=v[_],C=N.start,U=N.count;for(let O=C,D=C+U;O<D;O+=3)w(t.getX(O+0)),w(t.getX(O+1)),w(t.getX(O+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==n.count)i=new Xn(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let u=0,p=i.count;u<p;u++)i.setXYZ(u,0,0,0);let s=new z,a=new z,r=new z,o=new z,l=new z,c=new z,h=new z,f=new z;if(t)for(let u=0,p=t.count;u<p;u+=3){let m=t.getX(u+0),S=t.getX(u+1),g=t.getX(u+2);s.fromBufferAttribute(n,m),a.fromBufferAttribute(n,S),r.fromBufferAttribute(n,g),h.subVectors(r,a),f.subVectors(s,a),h.cross(f),o.fromBufferAttribute(i,m),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,g),o.add(h),l.add(h),c.add(h),i.setXYZ(m,o.x,o.y,o.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let u=0,p=n.count;u<p;u+=3)s.fromBufferAttribute(n,u+0),a.fromBufferAttribute(n,u+1),r.fromBufferAttribute(n,u+2),h.subVectors(r,a),f.subVectors(s,a),h.cross(f),i.setXYZ(u+0,h.x,h.y,h.z),i.setXYZ(u+1,h.x,h.y,h.z),i.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let n=0,i=t.count;n<i;n++)mn.fromBufferAttribute(t,n),mn.normalize(),t.setXYZ(n,mn.x,mn.y,mn.z)}toNonIndexed(){function t(o,l){let c=o.array,h=o.itemSize,f=o.normalized,u=new c.constructor(l.length*h),p=0,m=0;for(let S=0,g=l.length;S<g;S++){o.isInterleavedBufferAttribute?p=l[S]*o.data.stride+o.offset:p=l[S]*h;for(let d=0;d<h;d++)u[m++]=c[p++]}return new Xn(u,h,f)}if(this.index===null)return It("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let n=new e,i=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,i);n.setAttribute(o,c)}let a=this.morphAttributes;for(let o in a){let l=[],c=a[o];for(let h=0,f=c.length;h<f;h++){let u=c[h],p=t(u,i);l.push(p)}n.morphAttributes[o]=l}n.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let o=0,l=r.length;o<l;o++){let c=r[o];n.addGroup(c.start,c.count,c.materialIndex)}return n}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let n=this.index;n!==null&&(t.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});let i=this.attributes;for(let l in i){let c=i[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},a=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let f=0,u=c.length;f<u;f++){let p=c[f];h.push(p.toJSON(t.data))}h.length>0&&(s[l]=h,a=!0)}a&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let n={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone());let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(n))}let a=t.morphAttributes;for(let c in a){let h=[],f=a[c];for(let u=0,p=f.length;u<p;u++)h.push(f[u].clone(n));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let r=t.groups;for(let c=0,h=r.length;c<h;c++){let f=r[c];this.addGroup(f.start,f.count,f.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}},wf=class{constructor(t,n){this.isInterleavedBuffer=!0,this.array=t,this.stride=n,this.count=t!==void 0?t.length/n:0,this.usage=i_,this.updateRanges=[],this.version=0,this.uuid=$s()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,n,i){t*=this.stride,i*=n.stride;for(let s=0,a=this.stride;s<a;s++)this.array[t+s]=n.array[i+s];return this}set(t,n=0){return this.array.set(t,n),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=$s()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let n=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(n,this.stride);return i.setUsage(this.usage),i}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=$s()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let n={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}},kn=new z,cu=class e{constructor(t,n,i,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=n,this.offset=i,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let n=0,i=this.data.count;n<i;n++)kn.fromBufferAttribute(this,n),kn.applyMatrix4(t),this.setXYZ(n,kn.x,kn.y,kn.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)kn.fromBufferAttribute(this,n),kn.applyNormalMatrix(t),this.setXYZ(n,kn.x,kn.y,kn.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)kn.fromBufferAttribute(this,n),kn.transformDirection(t),this.setXYZ(n,kn.x,kn.y,kn.z);return this}getComponent(t,n){let i=this.array[t*this.data.stride+this.offset+n];return this.normalized&&(i=qi(i,this.array)),i}setComponent(t,n,i){return this.normalized&&(i=be(i,this.array)),this.data.array[t*this.data.stride+this.offset+n]=i,this}setX(t,n){return this.normalized&&(n=be(n,this.array)),this.data.array[t*this.data.stride+this.offset]=n,this}setY(t,n){return this.normalized&&(n=be(n,this.array)),this.data.array[t*this.data.stride+this.offset+1]=n,this}setZ(t,n){return this.normalized&&(n=be(n,this.array)),this.data.array[t*this.data.stride+this.offset+2]=n,this}setW(t,n){return this.normalized&&(n=be(n,this.array)),this.data.array[t*this.data.stride+this.offset+3]=n,this}getX(t){let n=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(n=qi(n,this.array)),n}getY(t){let n=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(n=qi(n,this.array)),n}getZ(t){let n=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(n=qi(n,this.array)),n}getW(t){let n=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(n=qi(n,this.array)),n}setXY(t,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(n=be(n,this.array),i=be(i,this.array)),this.data.array[t+0]=n,this.data.array[t+1]=i,this}setXYZ(t,n,i,s){return t=t*this.data.stride+this.offset,this.normalized&&(n=be(n,this.array),i=be(i,this.array),s=be(s,this.array)),this.data.array[t+0]=n,this.data.array[t+1]=i,this.data.array[t+2]=s,this}setXYZW(t,n,i,s,a){return t=t*this.data.stride+this.offset,this.normalized&&(n=be(n,this.array),i=be(i,this.array),s=be(s,this.array),a=be(a,this.array)),this.data.array[t+0]=n,this.data.array[t+1]=i,this.data.array[t+2]=s,this.data.array[t+3]=a,this}clone(t){if(t===void 0){iu("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let n=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)n.push(this.data.array[s+a])}return new Xn(new this.array.constructor(n),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){iu("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let n=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)n.push(this.data.array[s+a])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:n,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},xv=new z,r2=new z,o2=new Vt,_i=class{constructor(t=new z(1,0,0),n=0){this.isPlane=!0,this.normal=t,this.constant=n}set(t,n){return this.normal.copy(t),this.constant=n,this}setComponents(t,n,i,s){return this.normal.set(t,n,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,n){return this.normal.copy(t),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(t,n,i){let s=xv.subVectors(i,n).cross(r2.subVectors(t,n)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,n){return n.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,n,i=!0){let s=t.delta(xv),a=this.normal.dot(s);if(a===0)return this.distanceToPoint(t.start)===0?n.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/a;return i===!0&&(r<0||r>1)?null:n.copy(t.start).addScaledVector(s,r)}intersectsLine(t){let n=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return n<0&&i>0||i<0&&n>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,n){let i=n||o2.getNormalMatrix(t),s=this.coplanarPoint(xv).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},l2=0,bs=class extends Zi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:l2++}),this.uuid=$s(),this.name="",this.type="Material",this.blending=tr,this.side=$a,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=zv,this.blendDst=Fv,this.blendEquation=Vr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Xt(0,0,0),this.blendAlpha=0,this.depthFunc=gl,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=_E,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=df,this.stencilZFail=df,this.stencilZPass=df,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let n in t){let i=t[n];if(i===void 0){It(`Material: parameter '${n}' has value of undefined.`);continue}let s=this[n];if(s===void 0){It(`Material: '${n}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[n]=i}}toJSON(t){let n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(a=>a.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(a){let r=[];for(let o in a){let l=a[o];delete l.metadata,r.push(l)}return r}if(n){let a=s(t.textures),r=s(t.images);a.length>0&&(i.textures=a),r.length>0&&(i.images=r)}return i}fromJSON(t,n){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Xt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new _i().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=n[t.map]||null),t.matcap!==void 0&&(this.matcap=n[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=n[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=n[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=n[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Ut().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=n[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=n[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=n[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=n[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=n[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=n[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=n[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=n[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=n[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=n[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=n[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=n[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=n[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=n[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ut().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=n[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=n[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=n[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=n[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=n[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=n[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=n[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let n=t.clippingPlanes,i=null;if(n!==null){let s=n.length;i=new Array(s);for(let a=0;a!==s;++a)i[a]=n[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}},Wa=class extends bs{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Xt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},ll,qc=new z,cl=new z,ul=new z,hl=new Ut,Yc=new Ut,NE=new Be,Wd=new z,Zc=new z,qd=new z,D1=new Ut,Sv=new Ut,L1=new Ut,Gr=class extends qn{constructor(t=new Wa){if(super(),this.isSprite=!0,this.type="Sprite",ll===void 0){ll=new vn;let n=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new wf(n,5);ll.setIndex([0,1,2,0,2,3]),ll.setAttribute("position",new cu(i,3,0,!1)),ll.setAttribute("uv",new cu(i,2,3,!1))}this.geometry=ll,this.material=t,this.center=new Ut(.5,.5),this.count=1}intersectsFrustum(t){return t.intersectsSprite(this)}raycast(t,n){t.camera===null&&Pt('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),cl.setFromMatrixScale(this.matrixWorld),NE.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),ul.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&cl.multiplyScalar(-ul.z);let i=this.material.rotation,s,a;i!==0&&(a=Math.cos(i),s=Math.sin(i));let r=this.center;Yd(Wd.set(-.5,-.5,0),ul,r,cl,s,a),Yd(Zc.set(.5,-.5,0),ul,r,cl,s,a),Yd(qd.set(.5,.5,0),ul,r,cl,s,a),D1.set(0,0),Sv.set(1,0),L1.set(1,1);let o=t.ray.intersectTriangle(Wd,Zc,qd,!1,qc);if(o===null&&(Yd(Zc.set(-.5,.5,0),ul,r,cl,s,a),Sv.set(0,1),o=t.ray.intersectTriangle(Wd,qd,Zc,!1,qc),o===null))return;let l=t.ray.origin.distanceTo(qc);l<t.near||l>t.far||n.push({distance:l,point:qc.clone(),uv:Js.getInterpolation(qc,Wd,Zc,qd,D1,Sv,L1,new Ut),face:null,object:this})}copy(t,n){return super.copy(t,n),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}};function Yd(e,t,n,i,s,a){hl.subVectors(e,n).addScalar(.5).multiply(i),s!==void 0?(Yc.x=a*hl.x-s*hl.y,Yc.y=s*hl.x+a*hl.y):Yc.copy(hl),e.copy(t),e.x+=Yc.x,e.y+=Yc.y,e.applyMatrix4(NE)}var Ks=new z,bv=new z,Zd=new z,jd=new z,ea=class{constructor(t=new z,n=new z(0,0,-1)){this.origin=t,this.direction=n}set(t,n){return this.origin.copy(t),this.direction.copy(n),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,n){return n.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ks)),this}closestPointToPoint(t,n){n.subVectors(t,this.origin);let i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let n=Ks.subVectors(t,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(t):(Ks.copy(this.origin).addScaledVector(this.direction,n),Ks.distanceToSquared(t))}distanceSqToSegment(t,n,i,s){bv.copy(t).add(n).multiplyScalar(.5),Zd.copy(n).sub(t).normalize(),jd.copy(this.origin).sub(bv);let a=t.distanceTo(n)*.5,r=-this.direction.dot(Zd),o=jd.dot(this.direction),l=-jd.dot(Zd),c=jd.lengthSq(),h=Math.abs(1-r*r),f,u,p,m;if(h>0)if(f=r*l-o,u=r*o-l,m=a*h,f>=0)if(u>=-m)if(u<=m){let S=1/h;f*=S,u*=S,p=f*(f+r*u+2*o)+u*(r*f+u+2*l)+c}else u=a,f=Math.max(0,-(r*u+o)),p=-f*f+u*(u+2*l)+c;else u=-a,f=Math.max(0,-(r*u+o)),p=-f*f+u*(u+2*l)+c;else u<=-m?(f=Math.max(0,-(-r*a+o)),u=f>0?-a:Math.min(Math.max(-a,-l),a),p=-f*f+u*(u+2*l)+c):u<=m?(f=0,u=Math.min(Math.max(-a,-l),a),p=u*(u+2*l)+c):(f=Math.max(0,-(r*a+o)),u=f>0?a:Math.min(Math.max(-a,-l),a),p=-f*f+u*(u+2*l)+c);else u=r>0?-a:a,f=Math.max(0,-(r*u+o)),p=-f*f+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(bv).addScaledVector(Zd,u),p}intersectSphere(t,n){if(t.radius<0)return null;Ks.subVectors(t.center,this.origin);let i=Ks.dot(this.direction),s=Ks.dot(Ks)-i*i,a=t.radius*t.radius;if(s>a)return null;let r=Math.sqrt(a-s),o=i-r,l=i+r;return l<0?null:o<0?this.at(l,n):this.at(o,n)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let n=t.normal.dot(this.direction);if(n===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/n;return i>=0?i:null}intersectPlane(t,n){let i=this.distanceToPlane(t);return i===null?null:this.at(i,n)}intersectsPlane(t){let n=t.distanceToPoint(this.origin);return n===0||t.normal.dot(this.direction)*n<0}intersectBox(t,n){let i,s,a,r,o,l,c=1/this.direction.x,h=1/this.direction.y,f=1/this.direction.z,u=this.origin;return c>=0?(i=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(i=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),h>=0?(a=(t.min.y-u.y)*h,r=(t.max.y-u.y)*h):(a=(t.max.y-u.y)*h,r=(t.min.y-u.y)*h),i>r||a>s||((a>i||isNaN(i))&&(i=a),(r<s||isNaN(s))&&(s=r),f>=0?(o=(t.min.z-u.z)*f,l=(t.max.z-u.z)*f):(o=(t.max.z-u.z)*f,l=(t.min.z-u.z)*f),i>l||o>s)||((o>i||i!==i)&&(i=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,n)}intersectsBox(t){return this.intersectBox(t,Ks)!==null}intersectTriangle(t,n,i,s,a){let r=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,f=t.x-r.x,u=t.y-r.y,p=t.z-r.z,m=n.x-r.x,S=n.y-r.y,g=n.z-r.z,d=i.x-r.x,v=i.y-r.y,b=i.z-r.z,x=Math.abs(l),T=Math.abs(c),E=Math.abs(h),w,_,A,N,C,U,O,D,G,q,Z,nt;if(x>=T&&x>=E?(A=l,U=f,G=m,nt=d,l>=0?(w=c,_=h,N=u,C=p,O=S,D=g,q=v,Z=b):(w=h,_=c,N=p,C=u,O=g,D=S,q=b,Z=v)):T>=E?(A=c,U=u,G=S,nt=v,c>=0?(w=h,_=l,N=p,C=f,O=g,D=m,q=b,Z=d):(w=l,_=h,N=f,C=p,O=m,D=g,q=d,Z=b)):(A=h,U=p,G=g,nt=b,h>=0?(w=l,_=c,N=f,C=u,O=m,D=S,q=d,Z=v):(w=c,_=l,N=u,C=f,O=S,D=m,q=v,Z=d)),A===0)return null;let Y=w/A,$=_/A,st=1/A,Lt=N-Y*U,Nt=C-$*U,he=O-Y*G,ne=D-$*G,oe=q-Y*nt,J=Z-$*nt,it=oe*ne-J*he,St=Lt*J-Nt*oe,zt=he*Nt-ne*Lt;if(s){if(it<0||St<0||zt<0)return null}else if((it<0||St<0||zt<0)&&(it>0||St>0||zt>0))return null;let yt=it+St+zt;if(yt===0)return null;let Ft=st*(it*U+St*G+zt*nt);return(yt>0?Ft<0:Ft>0)?null:this.at(Ft/yt,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},qa=class extends bs{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Xt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Xa,this.combine=Gv,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},U1=new Be,Br=new ea,Kd=new Ss,I1=new z,Jd=new z,Qd=new z,$d=new z,Mv=new z,tf=new z,O1=new z,ef=new z,Yn=class extends qn{constructor(t=new vn,n=new qa){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(t,n){let i=this.geometry,s=i.attributes.position,a=i.morphAttributes.position,r=i.morphTargetsRelative;n.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(a&&o){tf.set(0,0,0);for(let l=0,c=a.length;l<c;l++){let h=o[l],f=a[l];h!==0&&(Mv.fromBufferAttribute(f,t),r?tf.addScaledVector(Mv,h):tf.addScaledVector(Mv.sub(n),h))}n.add(tf)}return n}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.material,a=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Kd.copy(i.boundingSphere),Kd.applyMatrix4(a),Br.copy(t.ray).recast(t.near),!(Kd.containsPoint(Br.origin)===!1&&(Br.intersectSphere(Kd,I1)===null||Br.origin.distanceToSquared(I1)>(t.far-t.near)**2))&&(U1.copy(a).invert(),Br.copy(t.ray).applyMatrix4(U1),!(i.boundingBox!==null&&Br.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,n,Br)))}_computeIntersections(t,n,i){let s,a=this.geometry,r=this.material,o=a.index,l=a.attributes.position,c=a.attributes.uv,h=a.attributes.uv1,f=a.attributes.normal,u=a.groups,p=a.drawRange;if(o!==null)if(Array.isArray(r))for(let m=0,S=u.length;m<S;m++){let g=u[m],d=r[g.materialIndex],v=Math.max(g.start,p.start),b=Math.min(o.count,Math.min(g.start+g.count,p.start+p.count));for(let x=v,T=b;x<T;x+=3){let E=o.getX(x),w=o.getX(x+1),_=o.getX(x+2);s=nf(this,d,t,i,c,h,f,E,w,_),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,n.push(s))}}else{let m=Math.max(0,p.start),S=Math.min(o.count,p.start+p.count);for(let g=m,d=S;g<d;g+=3){let v=o.getX(g),b=o.getX(g+1),x=o.getX(g+2);s=nf(this,r,t,i,c,h,f,v,b,x),s&&(s.faceIndex=Math.floor(g/3),n.push(s))}}else if(l!==void 0)if(Array.isArray(r))for(let m=0,S=u.length;m<S;m++){let g=u[m],d=r[g.materialIndex],v=Math.max(g.start,p.start),b=Math.min(l.count,Math.min(g.start+g.count,p.start+p.count));for(let x=v,T=b;x<T;x+=3){let E=x,w=x+1,_=x+2;s=nf(this,d,t,i,c,h,f,E,w,_),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=g.materialIndex,n.push(s))}}else{let m=Math.max(0,p.start),S=Math.min(l.count,p.start+p.count);for(let g=m,d=S;g<d;g+=3){let v=g,b=g+1,x=g+2;s=nf(this,r,t,i,c,h,f,v,b,x),s&&(s.faceIndex=Math.floor(g/3),n.push(s))}}}};function c2(e,t,n,i,s,a,r,o){let l;if(t.side===Zn?l=i.intersectTriangle(r,a,s,!0,o):l=i.intersectTriangle(s,a,r,t.side===$a,o),l===null)return null;ef.copy(o),ef.applyMatrix4(e.matrixWorld);let c=n.ray.origin.distanceTo(ef);return c<n.near||c>n.far?null:{distance:c,point:ef.clone(),object:e}}function nf(e,t,n,i,s,a,r,o,l,c){e.getVertexPosition(o,Jd),e.getVertexPosition(l,Qd),e.getVertexPosition(c,$d);let h=c2(e,t,n,i,Jd,Qd,$d,O1);if(h){let f=new z;Js.getBarycoord(O1,Jd,Qd,$d,f),s&&(h.uv=Js.getInterpolatedAttribute(s,o,l,c,f,new Ut)),a&&(h.uv1=Js.getInterpolatedAttribute(a,o,l,c,f,new Ut)),r&&(h.normal=Js.getInterpolatedAttribute(r,o,l,c,f,new z),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new z,materialIndex:0};Js.getNormal(Jd,Qd,$d,u.normal),h.face=u,h.barycoord=f}return h}var Af=class extends Wn{constructor(t=null,n=1,i=1,s,a,r,o,l,c=gn,h=gn,f,u){super(null,r,o,l,c,h,s,a,f,u),this.isDataTexture=!0,this.image={data:t,width:n,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var zr=new Ss,u2=new Ut(.5,.5),sf=new z,uu=class{constructor(t=new _i,n=new _i,i=new _i,s=new _i,a=new _i,r=new _i){this.planes=[t,n,i,s,a,r]}set(t,n,i,s,a,r){let o=this.planes;return o[0].copy(t),o[1].copy(n),o[2].copy(i),o[3].copy(s),o[4].copy(a),o[5].copy(r),this}copy(t){let n=this.planes;for(let i=0;i<6;i++)n[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,n=Yi,i=!1){let s=this.planes,a=t.elements,r=a[0],o=a[1],l=a[2],c=a[3],h=a[4],f=a[5],u=a[6],p=a[7],m=a[8],S=a[9],g=a[10],d=a[11],v=a[12],b=a[13],x=a[14],T=a[15];if(s[0].setComponents(c-r,p-h,d-m,T-v).normalize(),s[1].setComponents(c+r,p+h,d+m,T+v).normalize(),s[2].setComponents(c+o,p+f,d+S,T+b).normalize(),s[3].setComponents(c-o,p-f,d-S,T-b).normalize(),i)s[4].setComponents(l,u,g,x).normalize(),s[5].setComponents(c-l,p-u,d-g,T-x).normalize();else if(s[4].setComponents(c-l,p-u,d-g,T-x).normalize(),n===Yi)s[5].setComponents(c+l,p+u,d+g,T+x).normalize();else if(n===eu)s[5].setComponents(l,u,g,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),zr.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let n=t.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),zr.copy(n.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(zr)}intersectsSprite(t){zr.center.set(0,0,0);let n=u2.distanceTo(t.center);return zr.radius=.7071067811865476+n,zr.applyMatrix4(t.matrixWorld),this.intersectsSphere(zr)}intersectsSphere(t){let n=this.planes,i=t.center,s=-t.radius;for(let a=0;a<6;a++)if(n[a].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){let n=this.planes;for(let i=0;i<6;i++){let s=n[i];if(sf.x=s.normal.x>0?t.max.x:t.min.x,sf.y=s.normal.y>0?t.max.y:t.min.y,sf.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(sf)<0)return!1}return!0}containsPoint(t){let n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Hr=class extends bs{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Xt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},Cf=new z,Rf=new z,P1=new Be,jc=new ea,af=new Ss,Ev=new z,B1=new z,bl=class extends qn{constructor(t=new vn,n=new Hr){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let n=t.attributes.position,i=[0];for(let s=1,a=n.count;s<a;s++)Cf.fromBufferAttribute(n,s-1),Rf.fromBufferAttribute(n,s),i[s]=i[s-1],i[s]+=Cf.distanceTo(Rf);t.setAttribute("lineDistance",new In(i,1))}else It("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.matrixWorld,a=t.params.Line.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),af.copy(i.boundingSphere),af.applyMatrix4(s),af.radius+=a,t.ray.intersectsSphere(af)===!1)return;P1.copy(s).invert(),jc.copy(t.ray).applyMatrix4(P1);let o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=i.index,u=i.attributes.position;if(h!==null){let p=Math.max(0,r.start),m=Math.min(h.count,r.start+r.count);for(let S=p,g=m-1;S<g;S+=c){let d=h.getX(S),v=h.getX(S+1),b=rf(this,t,jc,l,d,v,S);b&&n.push(b)}if(this.isLineLoop){let S=h.getX(m-1),g=h.getX(p),d=rf(this,t,jc,l,S,g,m-1);d&&n.push(d)}}else{let p=Math.max(0,r.start),m=Math.min(u.count,r.start+r.count);for(let S=p,g=m-1;S<g;S+=c){let d=rf(this,t,jc,l,S,S+1,S);d&&n.push(d)}if(this.isLineLoop){let S=rf(this,t,jc,l,m-1,p,m-1);S&&n.push(S)}}}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}};function rf(e,t,n,i,s,a,r){let o=e.geometry.attributes.position;if(Cf.fromBufferAttribute(o,s),Rf.fromBufferAttribute(o,a),n.distanceSqToSegment(Cf,Rf,Ev,B1)>i)return;Ev.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(Ev);if(!(c<t.near||c>t.far))return{distance:c,point:B1.clone().applyMatrix4(e.matrixWorld),index:r,face:null,faceIndex:null,barycoord:null,object:e}}var hu=class extends bl{constructor(t,n){super(t,n),this.isLineLoop=!0,this.type="LineLoop"}},Ml=class extends bs{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Xt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},z1=new Be,Dv=new ea,of=new Ss,lf=new z,du=class extends qn{constructor(t=new vn,n=new Ml){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.matrixWorld,a=t.params.Points.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),of.copy(i.boundingSphere),of.applyMatrix4(s),of.radius+=a,t.ray.intersectsSphere(of)===!1)return;z1.copy(s).invert(),Dv.copy(t.ray).applyMatrix4(z1);let o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,f=i.attributes.position;if(c!==null){let u=Math.max(0,r.start),p=Math.min(c.count,r.start+r.count);for(let m=u,S=p;m<S;m++){let g=c.getX(m);lf.fromBufferAttribute(f,g),F1(lf,g,l,s,t,n,this)}}else{let u=Math.max(0,r.start),p=Math.min(f.count,r.start+r.count);for(let m=u,S=p;m<S;m++)lf.fromBufferAttribute(f,m),F1(lf,m,l,s,t,n,this)}}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}};function F1(e,t,n,i,s,a,r){let o=Dv.distanceSqToPoint(e);if(o<n){let l=new z;Dv.closestPointToPoint(e,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;a.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:r})}}var fu=class extends Wn{constructor(t=[],n=er,i,s,a,r,o,l,c,h){super(t,n,i,s,a,r,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},El=class extends Wn{constructor(t,n,i,s,a,r,o,l,c){super(t,n,i,s,a,r,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Ya=class extends Wn{constructor(t,n,i=Ki,s,a,r,o=gn,l=gn,c,h=ys,f=1){if(h!==ys&&h!==ir)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:t,height:n,depth:f};super(u,s,a,r,o,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new yl(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let n=super.toJSON(t);return n.compareFunction=this.compareFunction,n}},Nf=class extends Ya{constructor(t,n=Ki,i=er,s,a,r=gn,o=gn,l,c=ys){let h={width:t,height:t,depth:1},f=[h,h,h,h,h,h];super(t,t,n,i,s,a,r,o,l,c),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},pu=class extends Wn{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},Tl=class e extends vn{constructor(t=1,n=1,i=1,s=1,a=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:n,depth:i,widthSegments:s,heightSegments:a,depthSegments:r};let o=this;s=Math.floor(s),a=Math.floor(a),r=Math.floor(r);let l=[],c=[],h=[],f=[],u=0,p=0;m("z","y","x",-1,-1,i,n,t,r,a,0),m("z","y","x",1,-1,i,n,-t,r,a,1),m("x","z","y",1,1,t,i,n,s,r,2),m("x","z","y",1,-1,t,i,-n,s,r,3),m("x","y","z",1,-1,t,n,i,s,a,4),m("x","y","z",-1,-1,t,n,-i,s,a,5),this.setIndex(l),this.setAttribute("position",new In(c,3)),this.setAttribute("normal",new In(h,3)),this.setAttribute("uv",new In(f,2));function m(S,g,d,v,b,x,T,E,w,_,A){let N=x/w,C=T/_,U=x/2,O=T/2,D=E/2,G=w+1,q=_+1,Z=0,nt=0,Y=new z;for(let $=0;$<q;$++){let st=$*C-O;for(let Lt=0;Lt<G;Lt++){let Nt=Lt*N-U;Y[S]=Nt*v,Y[g]=st*b,Y[d]=D,c.push(Y.x,Y.y,Y.z),Y[S]=0,Y[g]=0,Y[d]=E>0?1:-1,h.push(Y.x,Y.y,Y.z),f.push(Lt/w),f.push(1-$/_),Z+=1}}for(let $=0;$<_;$++)for(let st=0;st<w;st++){let Lt=u+st+G*$,Nt=u+st+G*($+1),he=u+(st+1)+G*($+1),ne=u+(st+1)+G*$;l.push(Lt,Nt,ne),l.push(Nt,he,ne),nt+=6}o.addGroup(p,nt,A),p+=nt,u+=Z}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var Df=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){It("Curve: .getPoint() not implemented.")}getPointAt(t,n){let i=this.getUtoTmapping(t);return this.getPoint(i,n)}getPoints(t=5){let n=[];for(let i=0;i<=t;i++)n.push(this.getPoint(i/t));return n}getSpacedPoints(t=5){let n=[];for(let i=0;i<=t;i++)n.push(this.getPointAt(i/t));return n}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let n=[],i,s=this.getPoint(0),a=0;n.push(0);for(let r=1;r<=t;r++)i=this.getPoint(r/t),a+=i.distanceTo(s),n.push(a),s=i;return this.cacheArcLengths=n,n}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,n=null){let i=this.getLengths(),s=0,a=i.length,r;n?r=n:r=t*i[a-1];let o=0,l=a-1,c;for(;o<=l;)if(s=Math.floor(o+(l-o)/2),c=i[s]-r,c<0)o=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===r)return s/(a-1);let h=i[s],u=i[s+1]-h,p=(r-h)/u;return(s+p)/(a-1)}getTangent(t,n){let s=t-1e-4,a=t+1e-4;s<0&&(s=0),a>1&&(a=1);let r=this.getPoint(s),o=this.getPoint(a),l=n||(r.isVector2?new Ut:new z);return l.copy(o).sub(r).normalize(),l}getTangentAt(t,n){let i=this.getUtoTmapping(t);return this.getTangent(i,n)}computeFrenetFrames(t,n=!1){let i=new z,s=[],a=[],r=[],o=new z,l=new Be;for(let p=0;p<=t;p++){let m=p/t;s[p]=this.getTangentAt(m,new z)}a[0]=new z,r[0]=new z;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),f=Math.abs(s[0].y),u=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),f<=c&&(c=f,i.set(0,1,0)),u<=c&&i.set(0,0,1),o.crossVectors(s[0],i).normalize(),a[0].crossVectors(s[0],o),r[0].crossVectors(s[0],a[0]);for(let p=1;p<=t;p++){if(a[p]=a[p-1].clone(),r[p]=r[p-1].clone(),o.crossVectors(s[p-1],s[p]),o.length()>Number.EPSILON){o.normalize();let m=Math.acos(Zt(s[p-1].dot(s[p]),-1,1));a[p].applyMatrix4(l.makeRotationAxis(o,m))}r[p].crossVectors(s[p],a[p])}if(n===!0){let p=Math.acos(Zt(a[0].dot(a[t]),-1,1));p/=t,s[0].dot(o.crossVectors(a[0],a[t]))>0&&(p=-p);for(let m=1;m<=t;m++)a[m].applyMatrix4(l.makeRotationAxis(s[m],p*m)),r[m].crossVectors(s[m],a[m])}return{tangents:s,normals:a,binormals:r}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){let t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}};function h2(e,t){let n=1-e;return n*n*t}function d2(e,t){return 2*(1-e)*e*t}function f2(e,t){return e*e*t}function Tv(e,t,n,i){return h2(e,t)+d2(e,n)+f2(e,i)}var mu=class extends Df{constructor(t=new z,n=new z,i=new z){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=n,this.v2=i}getPoint(t,n=new z){let i=n,s=this.v0,a=this.v1,r=this.v2;return i.set(Tv(t,s.x,a.x,r.x),Tv(t,s.y,a.y,r.y),Tv(t,s.z,a.z,r.z)),i}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}};var gu=class e extends vn{constructor(t=1,n=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:n,widthSegments:i,heightSegments:s};let a=t/2,r=n/2,o=Math.floor(i),l=Math.floor(s),c=o+1,h=l+1,f=t/o,u=n/l,p=[],m=[],S=[],g=[];for(let d=0;d<h;d++){let v=d*u-r;for(let b=0;b<c;b++){let x=b*f-a;m.push(x,-v,0),S.push(0,0,1),g.push(b/o),g.push(1-d/l)}}for(let d=0;d<l;d++)for(let v=0;v<o;v++){let b=v+c*d,x=v+c*(d+1),T=v+1+c*(d+1),E=v+1+c*d;p.push(b,x,E),p.push(x,T,E)}this.setIndex(p),this.setAttribute("position",new In(m,3)),this.setAttribute("normal",new In(S,3)),this.setAttribute("uv",new In(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};var vu=class e extends vn{constructor(t=1,n=32,i=16,s=0,a=Math.PI*2,r=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:n,heightSegments:i,phiStart:s,phiLength:a,thetaStart:r,thetaLength:o},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));let l=Math.min(r+o,Math.PI),c=0,h=[],f=new z,u=new z,p=[],m=[],S=[],g=[];for(let d=0;d<=i;d++){let v=[],b=d/i,x=r+b*o,T=t*Math.cos(x),E=Math.sqrt(t*t-T*T),w=0;d===0&&r===0?w=.5/n:d===i&&l===Math.PI&&(w=-.5/n);for(let _=0;_<=n;_++){let A=_/n,N=s+A*a;f.x=-E*Math.cos(N),f.y=T,f.z=E*Math.sin(N),m.push(f.x,f.y,f.z),u.copy(f).normalize(),S.push(u.x,u.y,u.z),g.push(A+w,1-b),v.push(c++)}h.push(v)}for(let d=0;d<i;d++)for(let v=0;v<n;v++){let b=h[d][v+1],x=h[d][v],T=h[d+1][v],E=h[d+1][v+1];(d!==0||r>0)&&p.push(b,x,E),(d!==i-1||l<Math.PI)&&p.push(x,T,E)}this.setIndex(p),this.setAttribute("position",new In(m,3)),this.setAttribute("normal",new In(S,3)),this.setAttribute("uv",new In(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};function Xr(e){let t={};for(let n in e){t[n]={};for(let i in e[n]){let s=e[n][i];if(G1(s))s.isRenderTargetTexture?(It("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null):t[n][i]=s.clone();else if(Array.isArray(s))if(G1(s[0])){let a=[];for(let r=0,o=s.length;r<o;r++)a[r]=s[r].clone();t[n][i]=a}else t[n][i]=s.slice();else t[n][i]=s}}return t}function On(e){let t={};for(let n=0;n<e.length;n++){let i=Xr(e[n]);for(let s in i)t[s]=i[s]}return t}function G1(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function p2(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function r_(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:se.workingColorSpace}var DE={clone:Xr,merge:On},m2=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,g2=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,xi=class extends bs{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=m2,this.fragmentShader=g2,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Xr(t.uniforms),this.uniformsGroups=p2(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let n=super.toJSON(t);n.glslVersion=this.glslVersion,n.uniforms={};for(let s in this.uniforms){let r=this.uniforms[s].value;r&&r.isTexture?n.uniforms[s]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?n.uniforms[s]={type:"c",value:r.getHex()}:r&&r.isVector2?n.uniforms[s]={type:"v2",value:r.toArray()}:r&&r.isVector3?n.uniforms[s]={type:"v3",value:r.toArray()}:r&&r.isVector4?n.uniforms[s]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?n.uniforms[s]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?n.uniforms[s]={type:"m4",value:r.toArray()}:n.uniforms[s]={value:r}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}fromJSON(t,n){if(super.fromJSON(t,n),t.uniforms!==void 0)for(let i in t.uniforms){let s=t.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=n[s.value]||null;break;case"c":this.uniforms[i].value=new Xt().setHex(s.value);break;case"v2":this.uniforms[i].value=new Ut().fromArray(s.value);break;case"v3":this.uniforms[i].value=new z().fromArray(s.value);break;case"v4":this.uniforms[i].value=new Xe().fromArray(s.value);break;case"m3":this.uniforms[i].value=new Vt().fromArray(s.value);break;case"m4":this.uniforms[i].value=new Be().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},Lf=class extends xi{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Uf=class extends bs{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=gE,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},If=class extends bs{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function dl(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT=="number"?new t(e):Array.prototype.slice.call(e)}function wv(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var Za=class{constructor(t,n,i,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new n.constructor(i),this.sampleValues=n,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let n=this.parameterPositions,i=this._cachedIndex,s=n[i],a=n[i-1];t:{e:{let r;n:{i:if(!(t<s)){for(let o=i+2;;){if(s===void 0){if(t<a)break i;return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(a=s,s=n[++i],t<s)break e}r=n.length;break n}if(!(t>=a)){let o=n[1];t<o&&(i=2,a=o);for(let l=i-2;;){if(a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=a,a=n[--i-1],t>=a)break e}r=i,i=0;break n}break t}for(;i<r;){let o=i+r>>>1;t<n[o]?r=o:i=o+1}if(s=n[i],a=n[i-1],a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,a,s)}return this.interpolate_(i,a,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let n=this.resultBuffer,i=this.sampleValues,s=this.valueSize,a=t*s;for(let r=0;r!==s;++r)n[r]=i[a+r];return n}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Of=class extends Za{constructor(t,n,i,s){super(t,n,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Cv,endingEnd:Cv}}intervalChanged_(t,n,i){let s=this.parameterPositions,a=t-2,r=t+1,o=s[a],l=s[r];if(o===void 0)switch(this.getSettings_().endingStart){case Rv:a=t,o=2*n-i;break;case Nv:a=s.length-2,o=n+s[a]-s[a+1];break;default:a=t,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case Rv:r=t,l=2*i-n;break;case Nv:r=1,l=i+s[1]-s[0];break;default:r=t-1,l=n}let c=(i-n)*.5,h=this.valueSize;this._weightPrev=c/(n-o),this._weightNext=c/(l-i),this._offsetPrev=a*h,this._offsetNext=r*h}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,f=this._offsetNext,u=this._weightPrev,p=this._weightNext,m=(i-n)/(s-n),S=m*m,g=S*m,d=-u*g+2*u*S-u*m,v=(1+u)*g+(-1.5-2*u)*S+(-.5+u)*m+1,b=(-1-p)*g+(1.5+p)*S+.5*m,x=p*g-p*S;for(let T=0;T!==o;++T)a[T]=d*r[h+T]+v*r[c+T]+b*r[l+T]+x*r[f+T];return a}},Pf=class extends Za{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(i-n)/(s-n),f=1-h;for(let u=0;u!==o;++u)a[u]=r[c+u]*f+r[l+u]*h;return a}},Bf=class extends Za{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t){return this.copySampleValue_(t-1)}},zf=class extends Za{interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this.inTangents,f=this.outTangents;if(!h||!f){let m=(i-n)/(s-n),S=1-m;for(let g=0;g!==o;++g)a[g]=r[c+g]*S+r[l+g]*m;return a}let u=o*2,p=t-1;for(let m=0;m!==o;++m){let S=r[c+m],g=r[l+m],d=p*u+m*2,v=f[d],b=f[d+1],x=t*u+m*2,T=h[x],E=h[x+1],w=_2(i,n,v,T,s);a[m]=LE(w,S,b,E,g)}return a}};function LE(e,t,n,i,s){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*i+e*e*e*s}function v2(e,t,n,i,s){let a=1-e;return 3*a*a*(n-t)+6*a*e*(i-n)+3*e*e*(s-i)}function _2(e,t,n,i,s){let a=(e-t)/(s-t);for(let r=0;r<8;r++){let o=LE(a,t,n,i,s)-e;if(Math.abs(o)<1e-10)break;let l=v2(a,t,n,i,s);if(Math.abs(l)<1e-10)break;a=Math.max(0,Math.min(1,a-o/l))}return a}var Si=class{constructor(t,n,i,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(n===void 0||n.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=dl(n,this.TimeBufferType),this.values=dl(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let n=t.constructor,i;if(n.toJSON!==this.toJSON)i=n.toJSON(t);else{i={name:t.name,times:dl(t.times,Array),values:dl(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(i.interpolation=s),wv(t.settings)&&(i.settings={inTangents:dl(t.settings.inTangents,Array),outTangents:dl(t.settings.outTangents,Array)})}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new Bf(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Pf(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Of(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let n=new zf(this.times,this.values,this.getValueSize(),t);return this.settings&&(n.inTangents=this.settings.inTangents,n.outTangents=this.settings.outTangents),n}setInterpolation(t){let n;switch(t){case Qc:n=this.InterpolantFactoryMethodDiscrete;break;case bf:n=this.InterpolantFactoryMethodLinear;break;case hf:n=this.InterpolantFactoryMethodSmooth;break;case Av:n=this.InterpolantFactoryMethodBezier;break}if(n===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return It("KeyframeTrack:",i),this}return this.createInterpolant=n,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Qc;case this.InterpolantFactoryMethodLinear:return bf;case this.InterpolantFactoryMethodSmooth:return hf;case this.InterpolantFactoryMethodBezier:return Av}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let n=this.times;for(let i=0,s=n.length;i!==s;++i)n[i]+=t}return this}scale(t){if(t!==1){let n=this.times;for(let i=0,s=n.length;i!==s;++i)n[i]*=t;wv(this.settings)&&(H1(this.settings.inTangents,t),H1(this.settings.outTangents,t))}return this}trim(t,n){let i=this.times,s=i.length,a=0,r=s-1;for(;a!==s&&i[a]<t;)++a;for(;r!==-1&&i[r]>n;)--r;if(++r,a!==0||r!==s){a>=r&&(r=Math.max(r,1),a=r-1);let o=this.getValueSize();this.times=i.slice(a,r),this.values=this.values.slice(a*o,r*o)}return this}validate(){let t=!0,n=this.getValueSize();n-Math.floor(n)!==0&&(Pt("KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,s=this.values,a=i.length;a===0&&(Pt("KeyframeTrack: Track is empty.",this),t=!1);let r=null;for(let o=0;o!==a;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){Pt("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(r!==null&&r>l){Pt("KeyframeTrack: Out of order keys.",this,o,l,r),t=!1;break}r=l}if(s!==void 0&&NR(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Pt("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),n=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===hf,a=t.length-1,r=1;for(let o=1;o<a;++o){let l=!1,c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(s)l=!0;else{let f=o*i,u=f-i,p=f+i;for(let m=0;m!==i;++m){let S=n[f+m];if(S!==n[u+m]||S!==n[p+m]){l=!0;break}}}if(l){if(o!==r){t[r]=t[o];let f=o*i,u=r*i;for(let p=0;p!==i;++p)n[u+p]=n[f+p]}++r}}if(a>0){t[r]=t[a];for(let o=a*i,l=r*i,c=0;c!==i;++c)n[l+c]=n[o+c];++r}return r!==t.length?(this.times=t.slice(0,r),this.values=n.slice(0,r*i)):(this.times=t,this.values=n),this}clone(){let t=this.times.slice(),n=this.values.slice(),i=this.constructor,s=new i(this.name,t,n);return s.createInterpolant=this.createInterpolant,wv(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function H1(e,t){for(let n=0,i=e.length;n!==i;n+=2)e[n]*=t}Si.prototype.ValueTypeName="";Si.prototype.TimeBufferType=Float32Array;Si.prototype.ValueBufferType=Float32Array;Si.prototype.DefaultInterpolation=bf;var ja=class extends Si{constructor(t,n,i){super(t,n,i)}};ja.prototype.ValueTypeName="bool";ja.prototype.ValueBufferType=Array;ja.prototype.DefaultInterpolation=Qc;ja.prototype.InterpolantFactoryMethodLinear=void 0;ja.prototype.InterpolantFactoryMethodSmooth=void 0;var Ff=class extends Si{constructor(t,n,i,s){super(t,n,i,s)}};Ff.prototype.ValueTypeName="color";var Gf=class extends Si{constructor(t,n,i,s){super(t,n,i,s)}};Gf.prototype.ValueTypeName="number";var Hf=class extends Za{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=(i-n)/(s-n),c=t*o;for(let h=c+o;c!==h;c+=4)yi.slerpFlat(a,0,r,c-o,r,c,l);return a}},_u=class extends Si{constructor(t,n,i,s){super(t,n,i,s)}InterpolantFactoryMethodLinear(t){return new Hf(this.times,this.values,this.getValueSize(),t)}};_u.prototype.ValueTypeName="quaternion";_u.prototype.InterpolantFactoryMethodSmooth=void 0;var Ka=class extends Si{constructor(t,n,i){super(t,n,i)}};Ka.prototype.ValueTypeName="string";Ka.prototype.ValueBufferType=Array;Ka.prototype.DefaultInterpolation=Qc;Ka.prototype.InterpolantFactoryMethodLinear=void 0;Ka.prototype.InterpolantFactoryMethodSmooth=void 0;var Vf=class extends Si{constructor(t,n,i,s){super(t,n,i,s)}};Vf.prototype.ValueTypeName="vector";var kf=class{constructor(t,n,i){let s=this,a=!1,r=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=n,this.onError=i,this._abortController=null,this.itemStart=function(h){o++,a===!1&&s.onStart!==void 0&&s.onStart(h,r,o),a=!0},this.itemEnd=function(h){r++,s.onProgress!==void 0&&s.onProgress(h,r,o),r===o&&(a=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,f){return c.push(h,f),this},this.removeHandler=function(h){let f=c.indexOf(h);return f!==-1&&c.splice(f,2),this},this.getHandler=function(h){for(let f=0,u=c.length;f<u;f+=2){let p=c[f],m=c[f+1];if(p.global&&(p.lastIndex=0),p.test(h))return m}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},UE=new kf,Xf=class{constructor(t){this.manager=t!==void 0?t:UE,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,n){let i=this;return new Promise(function(s,a){i.load(t,s,n,a)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Xf.DEFAULT_MATERIAL_NAME="__DEFAULT";var cf=new z,uf=new yi,vs=new z,yu=class extends qn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Be,this.projectionMatrix=new Be,this.projectionMatrixInverse=new Be,this.coordinateSystem=Yi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,n){return super.copy(t,n),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(cf,uf,vs),vs.x===1&&vs.y===1&&vs.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(cf,uf,vs.set(1,1,1)).invert()}updateWorldMatrix(t,n,i=!1){super.updateWorldMatrix(t,n,i),this.matrixWorld.decompose(cf,uf,vs),vs.x===1&&vs.y===1&&vs.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(cf,uf,vs.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},ka=new z,V1=new Ut,k1=new Ut,Un=class extends yu{constructor(t=50,n=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let n=.5*this.getFilmHeight()/t;this.fov=_l*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Kc*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return _l*2*Math.atan(Math.tan(Kc*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,n,i){ka.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ka.x,ka.y).multiplyScalar(-t/ka.z),ka.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(ka.x,ka.y).multiplyScalar(-t/ka.z)}getViewSize(t,n){return this.getViewBounds(t,V1,k1),n.subVectors(k1,V1)}setViewOffset(t,n,i,s,a,r){this.aspect=t/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,n=t*Math.tan(Kc*.5*this.fov)/this.zoom,i=2*n,s=this.aspect*i,a=-.5*s,r=this.view;if(this.view!==null&&this.view.enabled){let l=r.fullWidth,c=r.fullHeight;a+=r.offsetX*s/l,n-=r.offsetY*i/c,s*=r.width/l,i*=r.height/c}let o=this.filmOffset;o!==0&&(a+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+s,n,n-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let n=super.toJSON(t);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}};var xu=class extends yu{constructor(t=-1,n=1,i=1,s=-1,a=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=n,this.top=i,this.bottom=s,this.near=a,this.far=r,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,n,i,s,a,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,a=i-t,r=i+t,o=s+n,l=s-n;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,r=a+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(a,r,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let n=super.toJSON(t);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}};var fl=-90,pl=1,Wf=class extends qn{constructor(t,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Un(fl,pl,t,n);s.layers=this.layers,this.add(s);let a=new Un(fl,pl,t,n);a.layers=this.layers,this.add(a);let r=new Un(fl,pl,t,n);r.layers=this.layers,this.add(r);let o=new Un(fl,pl,t,n);o.layers=this.layers,this.add(o);let l=new Un(fl,pl,t,n);l.layers=this.layers,this.add(l);let c=new Un(fl,pl,t,n);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,n=this.children.concat(),[i,s,a,r,o,l]=n;for(let c of n)this.remove(c);if(t===Yi)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===eu)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of n)this.add(c),c.updateMatrixWorld()}update(t,n){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[a,r,o,l,c,h]=this.children,f=t.getRenderTarget(),u=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;let S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let g=!1;t.isWebGLRenderer===!0?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(i,0,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,a),t.setRenderTarget(i,1,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,r),t.setRenderTarget(i,2,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,o),t.setRenderTarget(i,3,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,l),t.setRenderTarget(i,4,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,c),i.texture.generateMipmaps=S,t.setRenderTarget(i,5,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,h),t.setRenderTarget(f,u,p),t.xr.enabled=m,i.texture.needsPMREMUpdate=!0}},qf=class extends Un{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var o_="\\[\\]\\.:\\/",y2=new RegExp("["+o_+"]","g"),l_="[^"+o_+"]",x2="[^"+o_.replace("\\.","")+"]",S2=/((?:WC+[\/:])*)/.source.replace("WC",l_),b2=/(WCOD+)?/.source.replace("WCOD",x2),M2=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",l_),E2=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",l_),T2=new RegExp("^"+S2+b2+M2+E2+"$"),w2=["material","materials","bones","map"],Lv=class{constructor(t,n,i){let s=i||Fe.parseTrackName(n);this._targetGroup=t,this._bindings=t.subscribe_(n,s)}getValue(t,n){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(t,n)}setValue(t,n){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,a=i.length;s!==a;++s)i[s].setValue(t,n)}bind(){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].bind()}unbind(){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].unbind()}},Fe=class e{constructor(t,n,i){this.path=n,this.parsedPath=i||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,i){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,i):new e(t,n,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(y2,"")}static parseTrackName(t){let n=T2.exec(t);if(n===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:n[2],objectName:n[3],objectIndex:n[4],propertyName:n[5],propertyIndex:n[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let a=i.nodeName.substring(s+1);w2.indexOf(a)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=a)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,n){if(n===void 0||n===""||n==="."||n===-1||n===t.name||n===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(n);if(i!==void 0)return i}if(t.children){let i=function(a){for(let r=0;r<a.length;r++){let o=a[r];if(o.name===n||o.uuid===n)return o;let l=i(o.children);if(l)return l}return null},s=i(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,n){t[n]=this.targetObject[this.propertyName]}_getValue_array(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)t[n++]=i[s]}_getValue_arrayElement(t,n){t[n]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,n){this.resolvedProperty.toArray(t,n)}_setValue_direct(t,n){this.targetObject[this.propertyName]=t[n]}_setValue_direct_setNeedsUpdate(t,n){this.targetObject[this.propertyName]=t[n],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,n){this.targetObject[this.propertyName]=t[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++]}_setValue_array_setNeedsUpdate(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,n){this.resolvedProperty[this.propertyIndex]=t[n]}_setValue_arrayElement_setNeedsUpdate(t,n){this.resolvedProperty[this.propertyIndex]=t[n],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,n){this.resolvedProperty[this.propertyIndex]=t[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,n){this.resolvedProperty.fromArray(t,n)}_setValue_fromArray_setNeedsUpdate(t,n){this.resolvedProperty.fromArray(t,n),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,n){this.resolvedProperty.fromArray(t,n),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,n){this.bind(),this.getValue(t,n)}_setValue_unbound(t,n){this.bind(),this.setValue(t,n)}bind(){let t=this.node,n=this.parsedPath,i=n.objectName,s=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){It("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=n.objectIndex;switch(i){case"materials":if(!t.material){Pt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Pt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Pt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Pt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Pt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){Pt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(c!==void 0){if(t[c]===void 0){Pt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let r=t[s];if(r===void 0){let c=n.nodeName;Pt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(a!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Pt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Pt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}l=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=a}else r.fromArray!==void 0&&r.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(l=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Fe.Composite=Lv;Fe.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Fe.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Fe.prototype.GetterByBindingType=[Fe.prototype._getValue_direct,Fe.prototype._getValue_array,Fe.prototype._getValue_arrayElement,Fe.prototype._getValue_toArray];Fe.prototype.SetterByBindingTypeAndVersioning=[[Fe.prototype._setValue_direct,Fe.prototype._setValue_direct_setNeedsUpdate,Fe.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Fe.prototype._setValue_array,Fe.prototype._setValue_array_setNeedsUpdate,Fe.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Fe.prototype._setValue_arrayElement,Fe.prototype._setValue_arrayElement_setNeedsUpdate,Fe.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Fe.prototype._setValue_fromArray,Fe.prototype._setValue_fromArray_setNeedsUpdate,Fe.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var MI=new Float32Array(1);var X1=new Be,Su=class{constructor(t,n,i=0,s=1/0){this.ray=new ea(t,n),this.near=i,this.far=s,this.camera=null,this.layers=new xl,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,n){this.ray.set(t,n)}setFromCamera(t,n){n.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(n.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(n).sub(this.ray.origin).normalize(),this.camera=n):n.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,n.projectionMatrix.elements[14]).unproject(n),this.ray.direction.set(0,0,-1).transformDirection(n.matrixWorld),this.camera=n):Pt("Raycaster: Unsupported camera type: "+n.type)}setFromXRController(t){return X1.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(X1),this}intersectObject(t,n=!0,i=[]){return Uv(t,this,i,n),i.sort(W1),i}intersectObjects(t,n=!0,i=[]){for(let s=0,a=t.length;s<a;s++)Uv(t[s],this,i,n);return i.sort(W1),i}};function W1(e,t){return e.distance-t.distance}function Uv(e,t,n,i){let s=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(s=!1),s===!0&&i===!0){let a=e.children;for(let r=0,o=a.length;r<o;r++)Uv(a[r],t,n,!0)}}var wl=class{constructor(t=1,n=0,i=0){this.radius=t,this.phi=n,this.theta=i}set(t,n,i){return this.radius=t,this.phi=n,this.theta=i,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=Zt(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,n,i){return this.radius=Math.sqrt(t*t+n*n+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,i),this.phi=Math.acos(Zt(n/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Iv=class e{static{e.prototype.isMatrix2=!0}constructor(t,n,i,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,n,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,n=0){for(let i=0;i<4;i++)this.elements[i]=t[i+n];return this}set(t,n,i,s){let a=this.elements;return a[0]=t,a[2]=n,a[1]=i,a[3]=s,this}};var bu=class extends Zi{constructor(t,n=null){super(),this.object=t,this.domElement=n,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}};function c_(e,t,n,i){let s=A2(i);switch(n){case $v:return e*t;case e_:return e*t/s.components*s.byteLength;case $f:return e*t/s.components*s.byteLength;case sr:return e*t*2/s.components*s.byteLength;case tp:return e*t*2/s.components*s.byteLength;case t_:return e*t*3/s.components*s.byteLength;case Pi:return e*t*4/s.components*s.byteLength;case ep:return e*t*4/s.components*s.byteLength;case Au:case Cu:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Ru:case Nu:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case ip:case ap:return Math.max(e,16)*Math.max(t,8)/4;case np:case sp:return Math.max(e,8)*Math.max(t,8)/2;case rp:case op:case cp:case up:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case lp:case Du:case hp:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case dp:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case fp:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case pp:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case mp:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case gp:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case vp:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case _p:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case yp:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case xp:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case Sp:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case bp:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case Mp:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case Ep:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case Tp:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case wp:case Ap:case Cp:return Math.ceil(e/4)*Math.ceil(t/4)*16;case Rp:case Np:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Lu:case Dp:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function A2(e){switch(e){case bi:case jv:return{byteLength:1,components:1};case Cl:case Kv:case Qi:return{byteLength:2,components:1};case Jf:case Qf:return{byteLength:2,components:4};case Ki:case Kf:case Ji:return{byteLength:4,components:1};case Jv:case Qv:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?It("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function eT(){let e=null,t=!1,n=null,i=null;function s(a,r){i=e.requestAnimationFrame(s),n(a,r)}return{start:function(){t!==!0&&n!==null&&e!==null&&(i=e.requestAnimationFrame(s),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){n=a},setContext:function(a){e=a}}}function R2(e){let t=new WeakMap;function n(o,l){let c=o.array,h=o.usage,f=c.byteLength,u=e.createBuffer();e.bindBuffer(l,u),e.bufferData(l,c,h),o.onUploadCallback();let p;if(c instanceof Float32Array)p=e.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)p=e.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=e.HALF_FLOAT:p=e.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=e.SHORT;else if(c instanceof Uint32Array)p=e.UNSIGNED_INT;else if(c instanceof Int32Array)p=e.INT;else if(c instanceof Int8Array)p=e.BYTE;else if(c instanceof Uint8Array)p=e.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:f}}function i(o,l,c){let h=l.array,f=l.updateRanges;if(e.bindBuffer(c,o),f.length===0)e.bufferSubData(c,0,h);else{f.sort((p,m)=>p.start-m.start);let u=0;for(let p=1;p<f.length;p++){let m=f[u],S=f[p];S.start<=m.start+m.count+1?m.count=Math.max(m.count,S.start+S.count-m.start):(++u,f[u]=S)}f.length=u+1;for(let p=0,m=f.length;p<m;p++){let S=f[p];e.bufferSubData(c,S.start*h.BYTES_PER_ELEMENT,h,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function a(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(e.deleteBuffer(l.buffer),t.delete(o))}function r(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,n(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:s,remove:a,update:r}}var N2=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,D2=`#ifdef USE_ALPHAHASH
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
#endif`,L2=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,U2=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,I2=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,O2=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,P2=`#ifdef USE_AOMAP
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
#endif`,B2=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,z2=`#ifdef USE_BATCHING
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
#endif`,F2=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,G2=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,H2=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,V2=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,k2=`#ifdef USE_IRIDESCENCE
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
#endif`,X2=`#ifdef USE_BUMPMAP
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
#endif`,W2=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,q2=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Y2=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Z2=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,j2=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,K2=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,J2=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Q2=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,$2=`#define PI 3.141592653589793
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
} // validated`,t3=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,e3=`vec3 transformedNormal = objectNormal;
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
#endif`,n3=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,i3=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,s3=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,a3=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,r3="gl_FragColor = linearToOutputTexel( gl_FragColor );",o3=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,l3=`#ifdef USE_ENVMAP
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
#endif`,c3=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,u3=`#ifdef USE_ENVMAP
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
#endif`,h3=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,d3=`#ifdef USE_ENVMAP
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
#endif`,f3=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,p3=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,m3=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,g3=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,v3=`#ifdef USE_GRADIENTMAP
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
}`,_3=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,y3=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,x3=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,S3=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,b3=`#ifdef USE_ENVMAP
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
#endif`,M3=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,E3=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,T3=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,w3=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,A3=`PhysicalMaterial material;
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
#endif`,C3=`uniform sampler2D dfgLUT;
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
}`,R3=`
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
#endif`,N3=`#if defined( RE_IndirectDiffuse )
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
#endif`,D3=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,L3=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,U3=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,I3=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,O3=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,P3=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,B3=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,z3=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,F3=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,G3=`#if defined( USE_POINTS_UV )
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
#endif`,H3=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,V3=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,k3=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,X3=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,W3=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,q3=`#ifdef USE_MORPHTARGETS
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
#endif`,Y3=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Z3=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,j3=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,K3=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,J3=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Q3=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,$3=`#ifdef USE_NORMALMAP
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
#endif`,tN=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,eN=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,nN=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,iN=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,sN=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,aN=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,rN=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,oN=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,lN=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,cN=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,uN=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,hN=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,dN=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,fN=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,pN=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,mN=`float getShadowMask() {
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
}`,gN=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,vN=`#ifdef USE_SKINNING
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
#endif`,_N=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,yN=`#ifdef USE_SKINNING
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
#endif`,xN=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,SN=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,bN=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,MN=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,EN=`#ifdef USE_TRANSMISSION
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
#endif`,TN=`#ifdef USE_TRANSMISSION
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
#endif`,wN=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,AN=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,CN=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,RN=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,NN=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,DN=`uniform sampler2D t2D;
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
}`,LN=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,UN=`#ifdef ENVMAP_TYPE_CUBE
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
}`,IN=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ON=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,PN=`#include <common>
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
}`,BN=`#if DEPTH_PACKING == 3200
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
}`,zN=`#define DISTANCE
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
}`,FN=`#define DISTANCE
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
}`,GN=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,HN=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,VN=`uniform float scale;
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
}`,kN=`uniform vec3 diffuse;
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
}`,XN=`#include <common>
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
}`,WN=`uniform vec3 diffuse;
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
}`,qN=`#define LAMBERT
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
}`,YN=`#define LAMBERT
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
}`,ZN=`#define MATCAP
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
}`,jN=`#define MATCAP
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
}`,KN=`#define NORMAL
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
}`,JN=`#define NORMAL
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
}`,QN=`#define PHONG
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
}`,$N=`#define PHONG
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
}`,tD=`#define STANDARD
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
}`,eD=`#define STANDARD
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
}`,nD=`#define TOON
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
}`,iD=`#define TOON
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
}`,sD=`uniform float size;
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
}`,aD=`uniform vec3 diffuse;
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
}`,rD=`#include <common>
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
}`,oD=`uniform vec3 color;
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
}`,lD=`uniform float rotation;
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
}`,cD=`uniform vec3 diffuse;
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
}`,jt={alphahash_fragment:N2,alphahash_pars_fragment:D2,alphamap_fragment:L2,alphamap_pars_fragment:U2,alphatest_fragment:I2,alphatest_pars_fragment:O2,aomap_fragment:P2,aomap_pars_fragment:B2,batching_pars_vertex:z2,batching_vertex:F2,begin_vertex:G2,beginnormal_vertex:H2,bsdfs:V2,iridescence_fragment:k2,bumpmap_pars_fragment:X2,clipping_planes_fragment:W2,clipping_planes_pars_fragment:q2,clipping_planes_pars_vertex:Y2,clipping_planes_vertex:Z2,color_fragment:j2,color_pars_fragment:K2,color_pars_vertex:J2,color_vertex:Q2,common:$2,cube_uv_reflection_fragment:t3,defaultnormal_vertex:e3,displacementmap_pars_vertex:n3,displacementmap_vertex:i3,emissivemap_fragment:s3,emissivemap_pars_fragment:a3,colorspace_fragment:r3,colorspace_pars_fragment:o3,envmap_fragment:l3,envmap_common_pars_fragment:c3,envmap_pars_fragment:u3,envmap_pars_vertex:h3,envmap_physical_pars_fragment:b3,envmap_vertex:d3,fog_vertex:f3,fog_pars_vertex:p3,fog_fragment:m3,fog_pars_fragment:g3,gradientmap_pars_fragment:v3,lightmap_pars_fragment:_3,lights_lambert_fragment:y3,lights_lambert_pars_fragment:x3,lights_pars_begin:S3,lights_toon_fragment:M3,lights_toon_pars_fragment:E3,lights_phong_fragment:T3,lights_phong_pars_fragment:w3,lights_physical_fragment:A3,lights_physical_pars_fragment:C3,lights_fragment_begin:R3,lights_fragment_maps:N3,lights_fragment_end:D3,lightprobes_pars_fragment:L3,logdepthbuf_fragment:U3,logdepthbuf_pars_fragment:I3,logdepthbuf_pars_vertex:O3,logdepthbuf_vertex:P3,map_fragment:B3,map_pars_fragment:z3,map_particle_fragment:F3,map_particle_pars_fragment:G3,metalnessmap_fragment:H3,metalnessmap_pars_fragment:V3,morphinstance_vertex:k3,morphcolor_vertex:X3,morphnormal_vertex:W3,morphtarget_pars_vertex:q3,morphtarget_vertex:Y3,normal_fragment_begin:Z3,normal_fragment_maps:j3,normal_pars_fragment:K3,normal_pars_vertex:J3,normal_vertex:Q3,normalmap_pars_fragment:$3,clearcoat_normal_fragment_begin:tN,clearcoat_normal_fragment_maps:eN,clearcoat_pars_fragment:nN,iridescence_pars_fragment:iN,opaque_fragment:sN,packing:aN,premultiplied_alpha_fragment:rN,project_vertex:oN,dithering_fragment:lN,dithering_pars_fragment:cN,roughnessmap_fragment:uN,roughnessmap_pars_fragment:hN,shadowmap_pars_fragment:dN,shadowmap_pars_vertex:fN,shadowmap_vertex:pN,shadowmask_pars_fragment:mN,skinbase_vertex:gN,skinning_pars_vertex:vN,skinning_vertex:_N,skinnormal_vertex:yN,specularmap_fragment:xN,specularmap_pars_fragment:SN,tonemapping_fragment:bN,tonemapping_pars_fragment:MN,transmission_fragment:EN,transmission_pars_fragment:TN,uv_pars_fragment:wN,uv_pars_vertex:AN,uv_vertex:CN,worldpos_vertex:RN,background_vert:NN,background_frag:DN,backgroundCube_vert:LN,backgroundCube_frag:UN,cube_vert:IN,cube_frag:ON,depth_vert:PN,depth_frag:BN,distance_vert:zN,distance_frag:FN,equirect_vert:GN,equirect_frag:HN,linedashed_vert:VN,linedashed_frag:kN,meshbasic_vert:XN,meshbasic_frag:WN,meshlambert_vert:qN,meshlambert_frag:YN,meshmatcap_vert:ZN,meshmatcap_frag:jN,meshnormal_vert:KN,meshnormal_frag:JN,meshphong_vert:QN,meshphong_frag:$N,meshphysical_vert:tD,meshphysical_frag:eD,meshtoon_vert:nD,meshtoon_frag:iD,points_vert:sD,points_frag:aD,shadow_vert:rD,shadow_frag:oD,sprite_vert:lD,sprite_frag:cD},gt={common:{diffuse:{value:new Xt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Vt}},envmap:{envMap:{value:null},envMapRotation:{value:new Vt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Vt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Vt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Vt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Vt},normalScale:{value:new Ut(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Vt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Vt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Vt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Vt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Xt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new z},probesMax:{value:new z},probesResolution:{value:new z}},points:{diffuse:{value:new Xt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0},uvTransform:{value:new Vt}},sprite:{diffuse:{value:new Xt(16777215)},opacity:{value:1},center:{value:new Ut(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}}},As={basic:{uniforms:On([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.fog]),vertexShader:jt.meshbasic_vert,fragmentShader:jt.meshbasic_frag},lambert:{uniforms:On([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,gt.lights,{emissive:{value:new Xt(0)},envMapIntensity:{value:1}}]),vertexShader:jt.meshlambert_vert,fragmentShader:jt.meshlambert_frag},phong:{uniforms:On([gt.common,gt.specularmap,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,gt.lights,{emissive:{value:new Xt(0)},specular:{value:new Xt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:jt.meshphong_vert,fragmentShader:jt.meshphong_frag},standard:{uniforms:On([gt.common,gt.envmap,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.roughnessmap,gt.metalnessmap,gt.fog,gt.lights,{emissive:{value:new Xt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:jt.meshphysical_vert,fragmentShader:jt.meshphysical_frag},toon:{uniforms:On([gt.common,gt.aomap,gt.lightmap,gt.emissivemap,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.gradientmap,gt.fog,gt.lights,{emissive:{value:new Xt(0)}}]),vertexShader:jt.meshtoon_vert,fragmentShader:jt.meshtoon_frag},matcap:{uniforms:On([gt.common,gt.bumpmap,gt.normalmap,gt.displacementmap,gt.fog,{matcap:{value:null}}]),vertexShader:jt.meshmatcap_vert,fragmentShader:jt.meshmatcap_frag},points:{uniforms:On([gt.points,gt.fog]),vertexShader:jt.points_vert,fragmentShader:jt.points_frag},dashed:{uniforms:On([gt.common,gt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:jt.linedashed_vert,fragmentShader:jt.linedashed_frag},depth:{uniforms:On([gt.common,gt.displacementmap]),vertexShader:jt.depth_vert,fragmentShader:jt.depth_frag},normal:{uniforms:On([gt.common,gt.bumpmap,gt.normalmap,gt.displacementmap,{opacity:{value:1}}]),vertexShader:jt.meshnormal_vert,fragmentShader:jt.meshnormal_frag},sprite:{uniforms:On([gt.sprite,gt.fog]),vertexShader:jt.sprite_vert,fragmentShader:jt.sprite_frag},background:{uniforms:{uvTransform:{value:new Vt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:jt.background_vert,fragmentShader:jt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Vt}},vertexShader:jt.backgroundCube_vert,fragmentShader:jt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:jt.cube_vert,fragmentShader:jt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:jt.equirect_vert,fragmentShader:jt.equirect_frag},distance:{uniforms:On([gt.common,gt.displacementmap,{referencePosition:{value:new z},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:jt.distance_vert,fragmentShader:jt.distance_frag},shadow:{uniforms:On([gt.lights,gt.fog,{color:{value:new Xt(0)},opacity:{value:1}}]),vertexShader:jt.shadow_vert,fragmentShader:jt.shadow_frag}};As.physical={uniforms:On([As.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Vt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Vt},clearcoatNormalScale:{value:new Ut(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Vt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Vt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Vt},sheen:{value:0},sheenColor:{value:new Xt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Vt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Vt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Vt},transmissionSamplerSize:{value:new Ut},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Vt},attenuationDistance:{value:0},attenuationColor:{value:new Xt(0)},specularColor:{value:new Xt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Vt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Vt},anisotropyVector:{value:new Ut},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Vt}}]),vertexShader:jt.meshphysical_vert,fragmentShader:jt.meshphysical_frag};var Ip={r:0,b:0,g:0},uD=new Be,nT=new Vt;nT.set(-1,0,0,0,1,0,0,0,1);function hD(e,t,n,i,s,a){let r=new Xt(0),o=s===!0?0:1,l,c,h=null,f=0,u=null;function p(v){let b=v.isScene===!0?v.background:null;if(b&&b.isTexture){let x=v.backgroundBlurriness>0;b=t.get(b,x)}return b}function m(v){let b=!1,x=p(v);x===null?g(r,o):x&&x.isColor&&(g(x,1),b=!0);let T=e.xr.getEnvironmentBlendMode();T==="additive"?n.buffers.color.setClear(0,0,0,1,a):T==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||b)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function S(v,b){let x=p(b);x&&(x.isCubeTexture||x.mapping===Tu)?(c===void 0&&(c=new Yn(new Tl(1,1,1),new xi({name:"BackgroundCubeMaterial",uniforms:Xr(As.backgroundCube.uniforms),vertexShader:As.backgroundCube.vertexShader,fragmentShader:As.backgroundCube.fragmentShader,side:Zn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,E,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=x,c.material.uniforms.backgroundBlurriness.value=b.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(uD.makeRotationFromEuler(b.backgroundRotation)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(nT),c.material.toneMapped=se.getTransfer(x.colorSpace)!==_e,(h!==x||f!==x.version||u!==e.toneMapping)&&(c.material.needsUpdate=!0,h=x,f=x.version,u=e.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):x&&x.isTexture&&(l===void 0&&(l=new Yn(new gu(2,2),new xi({name:"BackgroundMaterial",uniforms:Xr(As.background.uniforms),vertexShader:As.background.vertexShader,fragmentShader:As.background.fragmentShader,side:$a,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=x,l.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,l.material.toneMapped=se.getTransfer(x.colorSpace)!==_e,x.matrixAutoUpdate===!0&&x.updateMatrix(),l.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||f!==x.version||u!==e.toneMapping)&&(l.material.needsUpdate=!0,h=x,f=x.version,u=e.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function g(v,b){v.getRGB(Ip,r_(e)),n.buffers.color.setClear(Ip.r,Ip.g,Ip.b,b,a)}function d(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return r},setClearColor:function(v,b=1){r.set(v),o=b,g(r,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,g(r,o)},render:m,addToRenderList:S,dispose:d}}function dD(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},s=u(null),a=s,r=!1;function o(C,U,O,D,G){let q=!1,Z=f(C,D,O,U);a!==Z&&(a=Z,c(a.object)),q=p(C,D,O,G),q&&m(C,D,O,G),G!==null&&t.update(G,e.ELEMENT_ARRAY_BUFFER),(q||r)&&(r=!1,x(C,U,O,D),G!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(G).buffer))}function l(){return e.createVertexArray()}function c(C){return e.bindVertexArray(C)}function h(C){return e.deleteVertexArray(C)}function f(C,U,O,D){let G=D.wireframe===!0,q=i[U.id];q===void 0&&(q={},i[U.id]=q);let Z=C.isInstancedMesh===!0?C.id:0,nt=q[Z];nt===void 0&&(nt={},q[Z]=nt);let Y=nt[O.id];Y===void 0&&(Y={},nt[O.id]=Y);let $=Y[G];return $===void 0&&($=u(l()),Y[G]=$),$}function u(C){let U=[],O=[],D=[];for(let G=0;G<n;G++)U[G]=0,O[G]=0,D[G]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:O,attributeDivisors:D,object:C,attributes:{},index:null}}function p(C,U,O,D){let G=a.attributes,q=U.attributes,Z=0,nt=O.getAttributes();for(let Y in nt)if(nt[Y].location>=0){let st=G[Y],Lt=q[Y];if(Lt===void 0&&(Y==="instanceMatrix"&&C.instanceMatrix&&(Lt=C.instanceMatrix),Y==="instanceColor"&&C.instanceColor&&(Lt=C.instanceColor)),st===void 0||st.attribute!==Lt||Lt&&st.data!==Lt.data)return!0;Z++}return a.attributesNum!==Z||a.index!==D}function m(C,U,O,D){let G={},q=U.attributes,Z=0,nt=O.getAttributes();for(let Y in nt)if(nt[Y].location>=0){let st=q[Y];st===void 0&&(Y==="instanceMatrix"&&C.instanceMatrix&&(st=C.instanceMatrix),Y==="instanceColor"&&C.instanceColor&&(st=C.instanceColor));let Lt={};Lt.attribute=st,st&&st.data&&(Lt.data=st.data),G[Y]=Lt,Z++}a.attributes=G,a.attributesNum=Z,a.index=D}function S(){let C=a.newAttributes;for(let U=0,O=C.length;U<O;U++)C[U]=0}function g(C){d(C,0)}function d(C,U){let O=a.newAttributes,D=a.enabledAttributes,G=a.attributeDivisors;O[C]=1,D[C]===0&&(e.enableVertexAttribArray(C),D[C]=1),G[C]!==U&&(e.vertexAttribDivisor(C,U),G[C]=U)}function v(){let C=a.newAttributes,U=a.enabledAttributes;for(let O=0,D=U.length;O<D;O++)U[O]!==C[O]&&(e.disableVertexAttribArray(O),U[O]=0)}function b(C,U,O,D,G,q,Z){Z===!0?e.vertexAttribIPointer(C,U,O,G,q):e.vertexAttribPointer(C,U,O,D,G,q)}function x(C,U,O,D){S();let G=D.attributes,q=O.getAttributes(),Z=U.defaultAttributeValues;for(let nt in q){let Y=q[nt];if(Y.location>=0){let $=G[nt];if($===void 0&&(nt==="instanceMatrix"&&C.instanceMatrix&&($=C.instanceMatrix),nt==="instanceColor"&&C.instanceColor&&($=C.instanceColor)),$!==void 0){let st=$.normalized,Lt=$.itemSize,Nt=t.get($);if(Nt===void 0)continue;let he=Nt.buffer,ne=Nt.type,oe=Nt.bytesPerElement,J=ne===e.INT||ne===e.UNSIGNED_INT||$.gpuType===Kf;if($.isInterleavedBufferAttribute){let it=$.data,St=it.stride,zt=$.offset;if(it.isInstancedInterleavedBuffer){for(let yt=0;yt<Y.locationSize;yt++)d(Y.location+yt,it.meshPerAttribute);C.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=it.meshPerAttribute*it.count)}else for(let yt=0;yt<Y.locationSize;yt++)g(Y.location+yt);e.bindBuffer(e.ARRAY_BUFFER,he);for(let yt=0;yt<Y.locationSize;yt++)b(Y.location+yt,Lt/Y.locationSize,ne,st,St*oe,(zt+Lt/Y.locationSize*yt)*oe,J)}else{if($.isInstancedBufferAttribute){for(let it=0;it<Y.locationSize;it++)d(Y.location+it,$.meshPerAttribute);C.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=$.meshPerAttribute*$.count)}else for(let it=0;it<Y.locationSize;it++)g(Y.location+it);e.bindBuffer(e.ARRAY_BUFFER,he);for(let it=0;it<Y.locationSize;it++)b(Y.location+it,Lt/Y.locationSize,ne,st,Lt*oe,Lt/Y.locationSize*it*oe,J)}}else if(Z!==void 0){let st=Z[nt];if(st!==void 0)switch(st.length){case 2:e.vertexAttrib2fv(Y.location,st);break;case 3:e.vertexAttrib3fv(Y.location,st);break;case 4:e.vertexAttrib4fv(Y.location,st);break;default:e.vertexAttrib1fv(Y.location,st)}}}}v()}function T(){A();for(let C in i){let U=i[C];for(let O in U){let D=U[O];for(let G in D){let q=D[G];for(let Z in q)h(q[Z].object),delete q[Z];delete D[G]}}delete i[C]}}function E(C){if(i[C.id]===void 0)return;let U=i[C.id];for(let O in U){let D=U[O];for(let G in D){let q=D[G];for(let Z in q)h(q[Z].object),delete q[Z];delete D[G]}}delete i[C.id]}function w(C){for(let U in i){let O=i[U];for(let D in O){let G=O[D];if(G[C.id]===void 0)continue;let q=G[C.id];for(let Z in q)h(q[Z].object),delete q[Z];delete G[C.id]}}}function _(C){for(let U in i){let O=i[U],D=C.isInstancedMesh===!0?C.id:0,G=O[D];if(G!==void 0){for(let q in G){let Z=G[q];for(let nt in Z)h(Z[nt].object),delete Z[nt];delete G[q]}delete O[D],Object.keys(O).length===0&&delete i[U]}}}function A(){N(),r=!0,a!==s&&(a=s,c(a.object))}function N(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:A,resetDefaultState:N,dispose:T,releaseStatesOfGeometry:E,releaseStatesOfObject:_,releaseStatesOfProgram:w,initAttributes:S,enableAttribute:g,disableUnusedAttributes:v}}function fD(e,t,n){let i;function s(l){i=l}function a(l,c){e.drawArrays(i,l,c),n.update(c,i,1)}function r(l,c,h){h!==0&&(e.drawArraysInstanced(i,l,c,h),n.update(c,i,h))}function o(l,c,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,h);let u=0;for(let p=0;p<h;p++)u+=c[p];n.update(u,i,1)}this.setMode=s,this.render=a,this.renderInstances=r,this.renderMultiDraw=o}function pD(e,t,n,i){let s;function a(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let w=t.get("EXT_texture_filter_anisotropic");s=e.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function r(w){return!(w!==Pi&&i.convert(w)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(w){let _=w===Qi&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(w!==bi&&w!==Ji&&!_&&i.convert(w)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function l(w){if(w==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=n.precision!==void 0?n.precision:"highp",h=l(c);h!==c&&(It("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let f=n.logarithmicDepthBuffer===!0,u=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control");n.reversedDepthBuffer===!0&&u===!1&&It("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),d=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),b=e.getParameter(e.MAX_VARYING_VECTORS),x=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),T=e.getParameter(e.MAX_SAMPLES),E=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:l,textureFormatReadable:r,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:f,reversedDepthBuffer:u,maxTextures:p,maxVertexTextures:m,maxTextureSize:S,maxCubemapSize:g,maxAttributes:d,maxVertexUniforms:v,maxVaryings:b,maxFragmentUniforms:x,maxSamples:T,samples:E}}function mD(e){let t=this,n=null,i=0,s=!1,a=!1,r=new _i,o=new Vt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(f,u){let p=f.length!==0||u||i!==0||s;return s=u,i=f.length,p},this.beginShadows=function(){a=!0,h(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(f,u){n=h(f,u,0)},this.setState=function(f,u,p){let m=f.clippingPlanes,S=f.clipIntersection,g=f.clipShadows,d=e.get(f);if(!s||m===null||m.length===0||a&&!g)a?h(null):c();else{let v=a?0:i,b=v*4,x=d.clippingState||null;l.value=x,x=h(m,u,b,p);for(let T=0;T!==b;++T)x[T]=n[T];d.clippingState=x,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==n&&(l.value=n,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function h(f,u,p,m){let S=f!==null?f.length:0,g=null;if(S!==0){if(g=l.value,m!==!0||g===null){let d=p+S*4,v=u.matrixWorldInverse;o.getNormalMatrix(v),(g===null||g.length<d)&&(g=new Float32Array(d));for(let b=0,x=p;b!==S;++b,x+=4)r.copy(f[b]).applyMatrix4(v,o),r.normal.toArray(g,x),g[x+3]=r.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=S,t.numIntersection=0,g}}var Dl=4,gD=6,vD=20,_D=256,Uu=new xu,IE=new Xt,u_=null,h_=0,d_=0,f_=!1,yD=new z,Wr=new z,Pp=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,n=0,i=.1,s=100,a={}){let{size:r=256,position:o=yD}=a;u_=this._renderer.getRenderTarget(),h_=this._renderer.getActiveCubeFace(),d_=this._renderer.getActiveMipmapLevel(),f_=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(r);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,i,s,l,o),n>0&&this._blur(l,0,0,n),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,n=null){return this._fromTexture(t,n)}fromCubemap(t,n=null){return this._fromTexture(t,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=BE(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=PE(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(u_,h_,d_),this._renderer.xr.enabled=f_,t.scissorTest=!1,Nl(t,0,0,t.width,t.height)}_fromTexture(t,n){t.mapping===er||t.mapping===kr?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),u_=this._renderer.getRenderTarget(),h_=this._renderer.getActiveCubeFace(),d_=this._renderer.getActiveMipmapLevel(),f_=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=n||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,i={magFilter:wn,minFilter:wn,generateMipmaps:!1,type:Qi,format:Pi,colorSpace:$c,depthBuffer:!1},s=OE(t,n,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==n){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=OE(t,n,i);let{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=xD(a)),this._blurMaterial=bD(a,t,n),this._ggxMaterial=SD(a,t,n)}return s}_compileMaterial(t){let n=new Yn(new vn,t);this._renderer.compile(n,Uu)}_sceneToCubeUV(t,n,i,s,a){let l=new Un(90,1,n,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],f=this._renderer,u=f.autoClear,p=f.toneMapping;f.getClearColor(IE),f.toneMapping=ji,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Yn(new Tl,new qa({name:"PMREM.Background",side:Zn,depthWrite:!1,depthTest:!1})));let S=this._backgroundBox,g=S.material,d=!1,v=t.background;v?v.isColor&&(g.color.copy(v),t.background=null,d=!0):(g.color.copy(IE),d=!0);for(let b=0;b<6;b++){let x=b%3;x===0?(l.up.set(0,c[b],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x+h[b],a.y,a.z)):x===1?(l.up.set(0,0,c[b]),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y+h[b],a.z)):(l.up.set(0,c[b],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y,a.z+h[b]));let T=this._cubeSize;Nl(s,x*T,b>2?T:0,T,T),f.setRenderTarget(s),d&&f.render(S,l),f.render(t,l)}f.toneMapping=p,f.autoClear=u,t.background=v}_textureToCubeUV(t,n){let i=this._renderer,s=t.mapping===er||t.mapping===kr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=BE()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=PE());let a=s?this._cubemapMaterial:this._equirectMaterial,r=this._lodMeshes[0];r.material=a;let o=a.uniforms;o.envMap.value=t;let l=this._cubeSize;Nl(n,0,0,3*l,2*l),i.setRenderTarget(n),i.render(r,Uu)}_applyPMREM(t){let n=this._renderer,i=n.autoClear;n.autoClear=!1;let s=this._lodMeshes.length;for(let a=1;a<s;a++)this._applyGGXFilter(t,a-1,a);n.autoClear=i}_applyGGXFilter(t,n,i){let s=this._renderer,a=this._pingPongRenderTarget,r=this._ggxMaterial,o=this._lodMeshes[i];o.material=r;let l=r.uniforms,c=i/(this._lodMeshes.length-1),h=n/(this._lodMeshes.length-1),f=Math.sqrt(c*c-h*h),u=c*1.25,p=f*u,{_lodMax:m}=this,S=this._sizeLods[i],g=3*S*(i>m-Dl?i-m+Dl:0),d=4*(this._cubeSize-S);l.envMap.value=t.texture,l.roughness.value=p,l.mipInt.value=m-n,Nl(a,g,d,3*S,2*S),s.setRenderTarget(a),s.render(o,Uu),l.envMap.value=a.texture,l.roughness.value=0,l.mipInt.value=m-i,Nl(t,g,d,3*S,2*S),s.setRenderTarget(t),s.render(o,Uu)}_blur(t,n,i,s){let a=this._pingPongRenderTarget,r=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,a,n,i,r),this._blurPass(a,t,i,i,r)}_blurPass(t,n,i,s,a){let r=this._renderer,o=this._blurMaterial,l=this._lodMeshes[s];l.material=o;let c=o.uniforms;c.envMap.value=t.texture,c.sigma.value=a,c.mipInt.value=this._lodMax-i;let h=this._sizeLods[s],f=3*h*(s>this._lodMax-Dl?s-this._lodMax+Dl:0),u=4*(this._cubeSize-h);Nl(n,f,u,3*h,2*h),r.setRenderTarget(n),r.render(l,Uu)}};function xD(e){let t=[],n=[],i=e,s=e-Dl+1+gD;for(let a=0;a<s;a++){let r=Math.pow(2,i);t.push(r);let o=1/(r-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],f=6,u=6,p=3,m=new Float32Array(p*u*f),S=new Float32Array(p*u*f);for(let d=0;d<f;d++){let v=d%3*2/3-1,b=d>2?0:-1,x=[v,b,0,v+2/3,b,0,v+2/3,b+1,0,v,b,0,v+2/3,b+1,0,v,b+1,0];m.set(x,p*u*d);for(let T=0;T<u;T++){let E=h[T*2]*2-1,w=h[T*2+1]*2-1;d===0?Wr.set(1,w,E):d===1?Wr.set(-E,1,-w):d===2?Wr.set(-E,w,1):d===3?Wr.set(-1,w,-E):d===4?Wr.set(-E,-1,w):Wr.set(E,w,-1),Wr.toArray(S,(d*u+T)*p)}}let g=new vn;g.setAttribute("position",new Xn(m,p)),g.setAttribute("outputDirection",new Xn(S,p)),n.push(new Yn(g,null)),i>Dl&&i--}return{lodMeshes:n,sizeLods:t}}function OE(e,t,n){let i=new ni(e,t,n);return i.texture.mapping=Tu,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Nl(e,t,n,i,s){e.viewport.set(t,n,i,s),e.scissor.set(t,n,i,s)}function SD(e,t,n){return new xi({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:_D,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Fp(),fragmentShader:`

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
		`,blending:Es,depthTest:!1,depthWrite:!1})}function bD(e,t,n){return new xi({name:"SphericalGaussianBlur",defines:{SAMPLES:vD,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Fp(),fragmentShader:`

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
		`,blending:Es,depthTest:!1,depthWrite:!1})}function PE(){return new xi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Fp(),fragmentShader:`

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
		`,blending:Es,depthTest:!1,depthWrite:!1})}function BE(){return new xi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Fp(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Es,depthTest:!1,depthWrite:!1})}function Fp(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Bp=class extends ni{constructor(t=1,n={}){super(t,t,n),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new fu(s),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new Tl(5,5,5),a=new xi({name:"CubemapFromEquirect",uniforms:Xr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Zn,blending:Es});a.uniforms.tEquirect.value=n;let r=new Yn(s,a),o=n.minFilter;return n.minFilter===nr&&(n.minFilter=wn),new Wf(1,10,this).update(t,r),n.minFilter=o,r.geometry.dispose(),r.material.dispose(),this}clear(t,n=!0,i=!0,s=!0){let a=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(n,i,s);t.setRenderTarget(a)}};function MD(e){let t=new WeakMap,n=new WeakMap,i=null;function s(u,p=!1){return u==null?null:p?r(u):a(u)}function a(u){if(u&&u.isTexture){let p=u.mapping;if(p===Yf||p===Zf)if(t.has(u)){let m=t.get(u).texture;return o(m,u.mapping)}else{let m=u.image;if(m&&m.height>0){let S=new Bp(m.height);return S.fromEquirectangularTexture(e,u),t.set(u,S),u.addEventListener("dispose",c),o(S.texture,u.mapping)}else return null}}return u}function r(u){if(u&&u.isTexture){let p=u.mapping,m=p===Yf||p===Zf,S=p===er||p===kr;if(m||S){let g=n.get(u),d=g!==void 0?g.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==d)return i===null&&(i=new Pp(e)),g=m?i.fromEquirectangular(u,g):i.fromCubemap(u,g),g.texture.pmremVersion=u.pmremVersion,n.set(u,g),g.texture;if(g!==void 0)return g.texture;{let v=u.image;return m&&v&&v.height>0||S&&v&&l(v)?(i===null&&(i=new Pp(e)),g=m?i.fromEquirectangular(u):i.fromCubemap(u),g.texture.pmremVersion=u.pmremVersion,n.set(u,g),u.addEventListener("dispose",h),g.texture):null}}}return u}function o(u,p){return p===Yf?u.mapping=er:p===Zf&&(u.mapping=kr),u}function l(u){let p=0,m=6;for(let S=0;S<m;S++)u[S]!==void 0&&p++;return p===m}function c(u){let p=u.target;p.removeEventListener("dispose",c);let m=t.get(p);m!==void 0&&(t.delete(p),m.dispose())}function h(u){let p=u.target;p.removeEventListener("dispose",h);let m=n.get(p);m!==void 0&&(n.delete(p),m.dispose())}function f(){t=new WeakMap,n=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:f}}function ED(e){let t={};function n(i){if(t[i]!==void 0)return t[i];let s=e.getExtension(i);return t[i]=s,s}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){let s=n(i);return s===null&&Fr("WebGLRenderer: "+i+" extension not supported."),s}}}function TD(e,t,n,i){let s={},a=new WeakMap;function r(f){let u=f.target;u.index!==null&&t.remove(u.index);for(let m in u.attributes)t.remove(u.attributes[m]);u.removeEventListener("dispose",r),delete s[u.id];let p=a.get(u);p&&(t.remove(p),a.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,n.memory.geometries--}function o(f,u){return s[u.id]===!0||(u.addEventListener("dispose",r),s[u.id]=!0,n.memory.geometries++),u}function l(f){let u=f.attributes;for(let p in u)t.update(u[p],e.ARRAY_BUFFER)}function c(f){let u=[],p=f.index,m=f.attributes.position,S=0;if(m===void 0)return;if(p!==null){let v=p.array;S=p.version;for(let b=0,x=v.length;b<x;b+=3){let T=v[b+0],E=v[b+1],w=v[b+2];u.push(T,E,E,w,w,T)}}else{let v=m.array;S=m.version;for(let b=0,x=v.length/3-1;b<x;b+=3){let T=b+0,E=b+1,w=b+2;u.push(T,E,E,w,w,T)}}let g=new(m.count>=65535?lu:ou)(u,1);g.version=S;let d=a.get(f);d&&t.remove(d),a.set(f,g)}function h(f){let u=a.get(f);if(u){let p=f.index;p!==null&&u.version<p.version&&c(f)}else c(f);return a.get(f)}return{get:o,update:l,getWireframeAttribute:h}}function wD(e,t,n){let i;function s(f){i=f}let a,r;function o(f){a=f.type,r=f.bytesPerElement}function l(f,u){e.drawElements(i,u,a,f*r),n.update(u,i,1)}function c(f,u,p){p!==0&&(e.drawElementsInstanced(i,u,a,f*r,p),n.update(u,i,p))}function h(f,u,p){if(p===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,a,f,0,p);let S=0;for(let g=0;g<p;g++)S+=u[g];n.update(S,i,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function AD(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,r,o){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=o*(a/3);break;case e.LINES:n.lines+=o*(a/2);break;case e.LINE_STRIP:n.lines+=o*(a-1);break;case e.LINE_LOOP:n.lines+=o*a;break;case e.POINTS:n.points+=o*a;break;default:Pt("WebGLInfo: Unknown draw mode:",r);break}}function s(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:s,update:i}}function CD(e,t,n){let i=new WeakMap,s=new Xe;function a(r,o,l){let c=r.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=h!==void 0?h.length:0,u=i.get(o);if(u===void 0||u.count!==f){let A=function(){w.dispose(),i.delete(o),o.removeEventListener("dispose",A)};u!==void 0&&u.texture.dispose();let p=o.morphAttributes.position!==void 0,m=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],d=o.morphAttributes.normal||[],v=o.morphAttributes.color||[],b=0;p===!0&&(b=1),m===!0&&(b=2),S===!0&&(b=3);let x=o.attributes.position.count*b,T=1;x>t.maxTextureSize&&(T=Math.ceil(x/t.maxTextureSize),x=t.maxTextureSize);let E=new Float32Array(x*T*4*f),w=new su(E,x,T,f);w.type=Ji,w.needsUpdate=!0;let _=b*4;for(let N=0;N<f;N++){let C=g[N],U=d[N],O=v[N],D=x*T*4*N;for(let G=0;G<C.count;G++){let q=G*_;p===!0&&(s.fromBufferAttribute(C,G),E[D+q+0]=s.x,E[D+q+1]=s.y,E[D+q+2]=s.z,E[D+q+3]=0),m===!0&&(s.fromBufferAttribute(U,G),E[D+q+4]=s.x,E[D+q+5]=s.y,E[D+q+6]=s.z,E[D+q+7]=0),S===!0&&(s.fromBufferAttribute(O,G),E[D+q+8]=s.x,E[D+q+9]=s.y,E[D+q+10]=s.z,E[D+q+11]=O.itemSize===4?s.w:1)}}u={count:f,texture:w,size:new Ut(x,T)},i.set(o,u),o.addEventListener("dispose",A)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)l.getUniforms().setValue(e,"morphTexture",r.morphTexture,n);else{let p=0;for(let S=0;S<c.length;S++)p+=c[S];let m=o.morphTargetsRelative?1:1-p;l.getUniforms().setValue(e,"morphTargetBaseInfluence",m),l.getUniforms().setValue(e,"morphTargetInfluences",c)}l.getUniforms().setValue(e,"morphTargetsTexture",u.texture,n),l.getUniforms().setValue(e,"morphTargetsTextureSize",u.size)}return{update:a}}function RD(e,t,n,i,s){let a=new WeakMap;function r(c){let h=s.render.frame,f=c.geometry,u=t.get(c,f);if(a.get(u)!==h&&(t.update(u),a.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),a.get(c)!==h&&(n.update(c.instanceMatrix,e.ARRAY_BUFFER),c.instanceColor!==null&&n.update(c.instanceColor,e.ARRAY_BUFFER),a.set(c,h))),c.isSkinnedMesh){let p=c.skeleton;a.get(p)!==h&&(p.update(),a.set(p,h))}return u}function o(){a=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),i.releaseStatesOfObject(h),n.remove(h.instanceMatrix),h.instanceColor!==null&&n.remove(h.instanceColor)}return{update:r,dispose:o}}var ND={[Hv]:"LINEAR_TONE_MAPPING",[Vv]:"REINHARD_TONE_MAPPING",[kv]:"CINEON_TONE_MAPPING",[Xv]:"ACES_FILMIC_TONE_MAPPING",[qv]:"AGX_TONE_MAPPING",[Yv]:"NEUTRAL_TONE_MAPPING",[Wv]:"CUSTOM_TONE_MAPPING"};function DD(e,t,n,i,s,a){let r=new ni(t,n,{type:e,depthBuffer:s,stencilBuffer:a,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=new vn;c.setAttribute("position",new In([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new In([0,2,0,0,2,0],2));let h=new Lf({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),f=new Yn(c,h),u=new xu(-1,1,1,-1,0,1),p=null,m=null,S=!1,g,d=null,v=[],b=!1;this.setSize=function(x,T){r.setSize(x,T),o!==null&&o.setSize(x,T),l!==null&&l.setSize(x,T);for(let E=0;E<v.length;E++){let w=v[E];w.setSize&&w.setSize(x,T)}},this.setEffects=function(x){v=x,b=v.length>0&&v[0].isRenderPass===!0;let T=r.width,E=r.height;v.length>0&&o===null&&(o=new ni(T,E,{type:Qi,depthBuffer:!1,stencilBuffer:!1}),l=new ni(T,E,{type:Qi,depthBuffer:!1,stencilBuffer:!1}));for(let w=0;w<v.length;w++){let _=v[w];_.setSize&&_.setSize(T,E)}},this.begin=function(x,T){if(S||x.toneMapping===ji&&v.length===0)return!1;if(d=T,T!==null){let E=T.width,w=T.height;(r.width!==E||r.height!==w)&&this.setSize(E,w)}return b===!1&&x.setRenderTarget(r),g=x.toneMapping,x.toneMapping=ji,!0},this.hasRenderPass=function(){return b},this.end=function(x,T){x.toneMapping=g,S=!0;let E=r,w=o;for(let _=0;_<v.length;_++){let A=v[_];A.enabled!==!1&&(A.render(x,w,E,T),A.needsSwap!==!1&&(E=w,w=w===o?l:o))}if(p!==x.outputColorSpace||m!==x.toneMapping){p=x.outputColorSpace,m=x.toneMapping,h.defines={},se.getTransfer(p)===_e&&(h.defines.SRGB_TRANSFER="");let _=ND[m];_&&(h.defines[_]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=E.texture,x.setRenderTarget(d),x.render(f,u),d=null,S=!1},this.isCompositing=function(){return S},this.dispose=function(){r.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}var iT=new Wn,g_=new Ya(1,1),sT=new su,aT=new Tf,rT=new fu,zE=[],FE=[],GE=new Float32Array(16),HE=new Float32Array(9),VE=new Float32Array(4);function Ul(e,t,n){let i=e[0];if(i<=0||i>0)return e;let s=t*n,a=zE[s];if(a===void 0&&(a=new Float32Array(s),zE[s]=a),t!==0){i.toArray(a,0);for(let r=1,o=0;r!==t;++r)o+=n,e[r].toArray(a,o)}return a}function ln(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function cn(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function Gp(e,t){let n=FE[t];n===void 0&&(n=new Int32Array(t),FE[t]=n);for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function LD(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function UD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(ln(n,t))return;e.uniform2fv(this.addr,t),cn(n,t)}}function ID(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(ln(n,t))return;e.uniform3fv(this.addr,t),cn(n,t)}}function OD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(ln(n,t))return;e.uniform4fv(this.addr,t),cn(n,t)}}function PD(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(ln(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),cn(n,t)}else{if(ln(n,i))return;VE.set(i),e.uniformMatrix2fv(this.addr,!1,VE),cn(n,i)}}function BD(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(ln(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),cn(n,t)}else{if(ln(n,i))return;HE.set(i),e.uniformMatrix3fv(this.addr,!1,HE),cn(n,i)}}function zD(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(ln(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),cn(n,t)}else{if(ln(n,i))return;GE.set(i),e.uniformMatrix4fv(this.addr,!1,GE),cn(n,i)}}function FD(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function GD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(ln(n,t))return;e.uniform2iv(this.addr,t),cn(n,t)}}function HD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(ln(n,t))return;e.uniform3iv(this.addr,t),cn(n,t)}}function VD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(ln(n,t))return;e.uniform4iv(this.addr,t),cn(n,t)}}function kD(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function XD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(ln(n,t))return;e.uniform2uiv(this.addr,t),cn(n,t)}}function WD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(ln(n,t))return;e.uniform3uiv(this.addr,t),cn(n,t)}}function qD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(ln(n,t))return;e.uniform4uiv(this.addr,t),cn(n,t)}}function YD(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s);let a;this.type===e.SAMPLER_2D_SHADOW?(g_.compareFunction=n.isReversedDepthBuffer()?Up:Lp,a=g_):a=iT,n.setTexture2D(t||a,s)}function ZD(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture3D(t||aT,s)}function jD(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTextureCube(t||rT,s)}function KD(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture2DArray(t||sT,s)}function JD(e){switch(e){case 5126:return LD;case 35664:return UD;case 35665:return ID;case 35666:return OD;case 35674:return PD;case 35675:return BD;case 35676:return zD;case 5124:case 35670:return FD;case 35667:case 35671:return GD;case 35668:case 35672:return HD;case 35669:case 35673:return VD;case 5125:return kD;case 36294:return XD;case 36295:return WD;case 36296:return qD;case 35678:case 36198:case 36298:case 36306:case 35682:return YD;case 35679:case 36299:case 36307:return ZD;case 35680:case 36300:case 36308:case 36293:return jD;case 36289:case 36303:case 36311:case 36292:return KD}}function QD(e,t){e.uniform1fv(this.addr,t)}function $D(e,t){let n=Ul(t,this.size,2);e.uniform2fv(this.addr,n)}function tL(e,t){let n=Ul(t,this.size,3);e.uniform3fv(this.addr,n)}function eL(e,t){let n=Ul(t,this.size,4);e.uniform4fv(this.addr,n)}function nL(e,t){let n=Ul(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function iL(e,t){let n=Ul(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function sL(e,t){let n=Ul(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function aL(e,t){e.uniform1iv(this.addr,t)}function rL(e,t){e.uniform2iv(this.addr,t)}function oL(e,t){e.uniform3iv(this.addr,t)}function lL(e,t){e.uniform4iv(this.addr,t)}function cL(e,t){e.uniform1uiv(this.addr,t)}function uL(e,t){e.uniform2uiv(this.addr,t)}function hL(e,t){e.uniform3uiv(this.addr,t)}function dL(e,t){e.uniform4uiv(this.addr,t)}function fL(e,t,n){let i=this.cache,s=t.length,a=Gp(n,s);ln(i,a)||(e.uniform1iv(this.addr,a),cn(i,a));let r;this.type===e.SAMPLER_2D_SHADOW?r=g_:r=iT;for(let o=0;o!==s;++o)n.setTexture2D(t[o]||r,a[o])}function pL(e,t,n){let i=this.cache,s=t.length,a=Gp(n,s);ln(i,a)||(e.uniform1iv(this.addr,a),cn(i,a));for(let r=0;r!==s;++r)n.setTexture3D(t[r]||aT,a[r])}function mL(e,t,n){let i=this.cache,s=t.length,a=Gp(n,s);ln(i,a)||(e.uniform1iv(this.addr,a),cn(i,a));for(let r=0;r!==s;++r)n.setTextureCube(t[r]||rT,a[r])}function gL(e,t,n){let i=this.cache,s=t.length,a=Gp(n,s);ln(i,a)||(e.uniform1iv(this.addr,a),cn(i,a));for(let r=0;r!==s;++r)n.setTexture2DArray(t[r]||sT,a[r])}function vL(e){switch(e){case 5126:return QD;case 35664:return $D;case 35665:return tL;case 35666:return eL;case 35674:return nL;case 35675:return iL;case 35676:return sL;case 5124:case 35670:return aL;case 35667:case 35671:return rL;case 35668:case 35672:return oL;case 35669:case 35673:return lL;case 5125:return cL;case 36294:return uL;case 36295:return hL;case 36296:return dL;case 35678:case 36198:case 36298:case 36306:case 35682:return fL;case 35679:case 36299:case 36307:return pL;case 35680:case 36300:case 36308:case 36293:return mL;case 36289:case 36303:case 36311:case 36292:return gL}}var v_=class{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.setValue=JD(n.type)}},__=class{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=vL(n.type)}},y_=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,n,i){let s=this.seq;for(let a=0,r=s.length;a!==r;++a){let o=s[a];o.setValue(t,n[o.id],i)}}},p_=/(\w+)(\])?(\[|\.)?/g;function kE(e,t){e.seq.push(t),e.map[t.id]=t}function _L(e,t,n){let i=e.name,s=i.length;for(p_.lastIndex=0;;){let a=p_.exec(i),r=p_.lastIndex,o=a[1],l=a[2]==="]",c=a[3];if(l&&(o=o|0),c===void 0||c==="["&&r+2===s){kE(n,c===void 0?new v_(o,e,t):new __(o,e,t));break}else{let f=n.map[o];f===void 0&&(f=new y_(o),kE(n,f)),n=f}}}var Ll=class{constructor(t,n){this.seq=[],this.map={};let i=t.getProgramParameter(n,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){let o=t.getActiveUniform(n,r),l=t.getUniformLocation(n,o.name);_L(o,l,this)}let s=[],a=[];for(let r of this.seq)r.type===t.SAMPLER_2D_SHADOW||r.type===t.SAMPLER_CUBE_SHADOW||r.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(r):a.push(r);s.length>0&&(this.seq=s.concat(a))}setValue(t,n,i,s){let a=this.map[n];a!==void 0&&a.setValue(t,i,s)}setOptional(t,n,i){let s=n[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,n,i,s){for(let a=0,r=n.length;a!==r;++a){let o=n[a],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,n){let i=[];for(let s=0,a=t.length;s!==a;++s){let r=t[s];r.id in n&&i.push(r)}return i}};function XE(e,t,n){let i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}var yL=37297,xL=0;function SL(e,t){let n=e.split(`
`),i=[],s=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let r=s;r<a;r++){let o=r+1;i.push(`${o===t?">":" "} ${o}: ${n[r]}`)}return i.join(`
`)}var WE=new Vt;function bL(e){se._getMatrix(WE,se.workingColorSpace,e);let t=`mat3( ${WE.elements.map(n=>n.toFixed(4))} )`;switch(se.getTransfer(e)){case tu:return[t,"LinearTransferOETF"];case _e:return[t,"sRGBTransferOETF"];default:return It("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function qE(e,t,n){let i=e.getShaderParameter(t,e.COMPILE_STATUS),a=(e.getShaderInfoLog(t)||"").trim();if(i&&a==="")return"";let r=/ERROR: 0:(\d+)/.exec(a);if(r){let o=parseInt(r[1]);return n.toUpperCase()+`

`+a+`

`+SL(e.getShaderSource(t),o)}else return a}function ML(e,t){let n=bL(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}var EL={[Hv]:"Linear",[Vv]:"Reinhard",[kv]:"Cineon",[Xv]:"ACESFilmic",[qv]:"AgX",[Yv]:"Neutral",[Wv]:"Custom"};function TL(e,t){let n=EL[t];return n===void 0?(It("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}var Op=new z;function wL(){se.getLuminanceCoefficients(Op);let e=Op.x.toFixed(4),t=Op.y.toFixed(4),n=Op.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function AL(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ou).join(`
`)}function CL(e){let t=[];for(let n in e){let i=e[n];i!==!1&&t.push("#define "+n+" "+i)}return t.join(`
`)}function RL(e,t){let n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let a=e.getActiveAttrib(t,s),r=a.name,o=1;a.type===e.FLOAT_MAT2&&(o=2),a.type===e.FLOAT_MAT3&&(o=3),a.type===e.FLOAT_MAT4&&(o=4),n[r]={type:a.type,location:e.getAttribLocation(t,r),locationSize:o}}return n}function Ou(e){return e!==""}function YE(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function ZE(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var NL=/^[ \t]*#include +<([\w\d./]+)>/gm;function x_(e){return e.replace(NL,LL)}var DL=new Map;function LL(e,t){let n=jt[t];if(n===void 0){let i=DL.get(t);if(i!==void 0)n=jt[i],It('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return x_(n)}var UL=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function jE(e){return e.replace(UL,IL)}function IL(e,t,n,i){let s="";for(let a=parseInt(t);a<parseInt(n);a++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return s}function KE(e){let t=`precision ${e.precision} float;
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
#define LOW_PRECISION`),t}var OL={[Mu]:"SHADOWMAP_TYPE_PCF",[Al]:"SHADOWMAP_TYPE_VSM"};function PL(e){return OL[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var BL={[er]:"ENVMAP_TYPE_CUBE",[kr]:"ENVMAP_TYPE_CUBE",[Tu]:"ENVMAP_TYPE_CUBE_UV"};function zL(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":BL[e.envMapMode]||"ENVMAP_TYPE_CUBE"}var FL={[kr]:"ENVMAP_MODE_REFRACTION"};function GL(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":FL[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}var HL={[Gv]:"ENVMAP_BLENDING_MULTIPLY",[fE]:"ENVMAP_BLENDING_MIX",[pE]:"ENVMAP_BLENDING_ADD"};function VL(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":HL[e.combine]||"ENVMAP_BLENDING_NONE"}function kL(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,n),112)),texelHeight:i,maxMip:n}}function XL(e,t,n,i){let s=e.getContext(),a=n.defines,r=n.vertexShader,o=n.fragmentShader,l=PL(n),c=zL(n),h=GL(n),f=VL(n),u=kL(n),p=AL(n),m=CL(a),S=s.createProgram(),g,d,v=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(g=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(Ou).join(`
`),g.length>0&&(g+=`
`),d=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(Ou).join(`
`),d.length>0&&(d+=`
`)):(g=[KE(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+h:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ou).join(`
`),d=[KE(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+c:"",n.envMap?"#define "+h:"",n.envMap?"#define "+f:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==ji?"#define TONE_MAPPING":"",n.toneMapping!==ji?jt.tonemapping_pars_fragment:"",n.toneMapping!==ji?TL("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",jt.colorspace_pars_fragment,ML("linearToOutputTexel",n.outputColorSpace),wL(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(Ou).join(`
`)),r=x_(r),r=YE(r,n),r=ZE(r,n),o=x_(o),o=YE(o,n),o=ZE(o,n),r=jE(r),o=jE(o),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,d=["#define varying in",n.glslVersion===s_?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===s_?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);let b=v+g+r,x=v+d+o,T=XE(s,s.VERTEX_SHADER,b),E=XE(s,s.FRAGMENT_SHADER,x);s.attachShader(S,T),s.attachShader(S,E),n.index0AttributeName!==void 0?s.bindAttribLocation(S,0,n.index0AttributeName):n.hasPositionAttribute===!0&&s.bindAttribLocation(S,0,"position"),s.linkProgram(S);function w(C){if(e.debug.checkShaderErrors){let U=s.getProgramInfoLog(S)||"",O=s.getShaderInfoLog(T)||"",D=s.getShaderInfoLog(E)||"",G=U.trim(),q=O.trim(),Z=D.trim(),nt=!0,Y=!0;if(s.getProgramParameter(S,s.LINK_STATUS)===!1)if(nt=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(s,S,T,E);else{let $=qE(s,T,"vertex"),st=qE(s,E,"fragment");Pt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(S,s.VALIDATE_STATUS)+`

Material Name: `+C.name+`
Material Type: `+C.type+`

Program Info Log: `+G+`
`+$+`
`+st)}else G!==""?It("WebGLProgram: Program Info Log:",G):(q===""||Z==="")&&(Y=!1);Y&&(C.diagnostics={runnable:nt,programLog:G,vertexShader:{log:q,prefix:g},fragmentShader:{log:Z,prefix:d}})}s.deleteShader(T),s.deleteShader(E),_=new Ll(s,S),A=RL(s,S)}let _;this.getUniforms=function(){return _===void 0&&w(this),_};let A;this.getAttributes=function(){return A===void 0&&w(this),A};let N=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return N===!1&&(N=s.getProgramParameter(S,yL)),N},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(S),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=xL++,this.cacheKey=t,this.usedTimes=1,this.program=S,this.vertexShader=T,this.fragmentShader=E,this}var WL=0,S_=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,n,i){let s=this._getShaderCacheForMaterial(t);return s.has(n)===!1&&(s.add(n),n.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(t){let n=this.materialCache.get(t);for(let i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let n=this.materialCache,i=n.get(t);return i===void 0&&(i=new Set,n.set(t,i)),i}_getShaderStage(t){let n=this.shaderCache,i=n.get(t);return i===void 0&&(i=new b_(t),n.set(t,i)),i}},b_=class{constructor(t){this.id=WL++,this.code=t,this.usedTimes=0}};function qL(e){return e===sr||e===Du||e===Lu}function YL(e,t,n,i,s,a){let r=new xl,o=new S_,l=new Set,c=[],h=new Map,f=i.logarithmicDepthBuffer,u=i.precision,p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(_){return l.add(_),_===0?"uv":`uv${_}`}function S(_,A,N,C,U,O){let D=C.fog,G=U.geometry,q=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?C.environment:null,Z=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,nt=t.get(_.envMap||q,Z),Y=nt&&nt.mapping===Tu?nt.image.height:null,$=p[_.type];_.precision!==null&&(u=i.getMaxPrecision(_.precision),u!==_.precision&&It("WebGLProgram.getParameters:",_.precision,"not supported, using",u,"instead."));let st=G.morphAttributes.position||G.morphAttributes.normal||G.morphAttributes.color,Lt=st!==void 0?st.length:0,Nt=0;G.morphAttributes.position!==void 0&&(Nt=1),G.morphAttributes.normal!==void 0&&(Nt=2),G.morphAttributes.color!==void 0&&(Nt=3);let he,ne,oe,J;if($){let me=As[$];he=me.vertexShader,ne=me.fragmentShader}else{he=_.vertexShader,ne=_.fragmentShader;let me=o.getVertexShaderStage(_),le=o.getFragmentShaderStage(_);o.update(_,me,le),oe=me.id,J=le.id}let it=e.getRenderTarget(),St=e.state.buffers.depth.getReversed(),zt=U.isInstancedMesh===!0,yt=U.isBatchedMesh===!0,Ft=!!_.map,We=!!_.matcap,Wt=!!nt,ae=!!_.aoMap,pe=!!_.lightMap,qt=!!_.bumpMap&&_.wireframe===!1,Ee=!!_.normalMap,qe=!!_.displacementMap,Ve=!!_.emissiveMap,Ae=!!_.metalnessMap,re=!!_.roughnessMap,B=_.anisotropy>0,Ye=_.clearcoat>0,Qt=_.dispersion>0,R=_.retroreflectivity>0,y=_.iridescence>0,H=_.sheen>0,X=_.transmission>0,j=B&&!!_.anisotropyMap,rt=Ye&&!!_.clearcoatMap,lt=Ye&&!!_.clearcoatNormalMap,K=Ye&&!!_.clearcoatRoughnessMap,tt=y&&!!_.iridescenceMap,ct=y&&!!_.iridescenceThicknessMap,At=H&&!!_.sheenColorMap,ft=H&&!!_.sheenRoughnessMap,ut=!!_.specularMap,Mt=!!_.specularColorMap,Dt=!!_.specularIntensityMap,Gt=X&&!!_.transmissionMap,P=X&&!!_.thicknessMap,dt=!!_.gradientMap,Q=!!_.alphaMap,ht=_.alphaTest>0,mt=!!_.alphaHash,at=!!_.extensions,Ct=ji;_.toneMapped&&(it===null||it.isXRRenderTarget===!0)&&(Ct=e.toneMapping);let Et={shaderID:$,shaderType:_.type,shaderName:_.name,vertexShader:he,fragmentShader:ne,defines:_.defines,customVertexShaderID:oe,customFragmentShaderID:J,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:u,batching:yt,batchingColor:yt&&U._colorsTexture!==null,instancing:zt,instancingColor:zt&&U.instanceColor!==null,instancingMorph:zt&&U.morphTexture!==null,outputColorSpace:it===null?e.outputColorSpace:it.isXRRenderTarget===!0?it.texture.colorSpace:se.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:Ft,matcap:We,envMap:Wt,envMapMode:Wt&&nt.mapping,envMapCubeUVHeight:Y,aoMap:ae,lightMap:pe,bumpMap:qt,normalMap:Ee,displacementMap:qe,emissiveMap:Ve,normalMapObjectSpace:Ee&&_.normalMapType===vE,normalMapTangentSpace:Ee&&_.normalMapType===n_,packedNormalMap:Ee&&_.normalMapType===n_&&qL(_.normalMap.format),metalnessMap:Ae,roughnessMap:re,anisotropy:B,anisotropyMap:j,clearcoat:Ye,clearcoatMap:rt,clearcoatNormalMap:lt,clearcoatRoughnessMap:K,dispersion:Qt,retroreflection:R,iridescence:y,iridescenceMap:tt,iridescenceThicknessMap:ct,sheen:H,sheenColorMap:At,sheenRoughnessMap:ft,specularMap:ut,specularColorMap:Mt,specularIntensityMap:Dt,transmission:X,transmissionMap:Gt,thicknessMap:P,gradientMap:dt,opaque:_.transparent===!1&&_.blending===tr&&_.alphaToCoverage===!1,alphaMap:Q,alphaTest:ht,alphaHash:mt,combine:_.combine,mapUv:Ft&&m(_.map.channel),aoMapUv:ae&&m(_.aoMap.channel),lightMapUv:pe&&m(_.lightMap.channel),bumpMapUv:qt&&m(_.bumpMap.channel),normalMapUv:Ee&&m(_.normalMap.channel),displacementMapUv:qe&&m(_.displacementMap.channel),emissiveMapUv:Ve&&m(_.emissiveMap.channel),metalnessMapUv:Ae&&m(_.metalnessMap.channel),roughnessMapUv:re&&m(_.roughnessMap.channel),anisotropyMapUv:j&&m(_.anisotropyMap.channel),clearcoatMapUv:rt&&m(_.clearcoatMap.channel),clearcoatNormalMapUv:lt&&m(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:K&&m(_.clearcoatRoughnessMap.channel),iridescenceMapUv:tt&&m(_.iridescenceMap.channel),iridescenceThicknessMapUv:ct&&m(_.iridescenceThicknessMap.channel),sheenColorMapUv:At&&m(_.sheenColorMap.channel),sheenRoughnessMapUv:ft&&m(_.sheenRoughnessMap.channel),specularMapUv:ut&&m(_.specularMap.channel),specularColorMapUv:Mt&&m(_.specularColorMap.channel),specularIntensityMapUv:Dt&&m(_.specularIntensityMap.channel),transmissionMapUv:Gt&&m(_.transmissionMap.channel),thicknessMapUv:P&&m(_.thicknessMap.channel),alphaMapUv:Q&&m(_.alphaMap.channel),vertexTangents:!!G.attributes.tangent&&(Ee||B),vertexNormals:!!G.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!G.attributes.color&&G.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!G.attributes.uv&&(Ft||Q),fog:!!D,useFog:_.fog===!0,fogExp2:!!D&&D.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||G.attributes.normal===void 0&&Ee===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:St,skinning:U.isSkinnedMesh===!0,hasPositionAttribute:G.attributes.position!==void 0,morphTargets:G.morphAttributes.position!==void 0,morphNormals:G.morphAttributes.normal!==void 0,morphColors:G.morphAttributes.color!==void 0,morphTargetsCount:Lt,morphTextureStride:Nt,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:O.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:_.dithering,shadowMapEnabled:e.shadowMap.enabled&&N.length>0,shadowMapType:e.shadowMap.type,toneMapping:Ct,decodeVideoTexture:Ft&&_.map.isVideoTexture===!0&&se.getTransfer(_.map.colorSpace)===_e,decodeVideoTextureEmissive:Ve&&_.emissiveMap.isVideoTexture===!0&&se.getTransfer(_.emissiveMap.colorSpace)===_e,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Ms,flipSided:_.side===Zn,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:at&&_.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(at&&_.extensions.multiDraw===!0||yt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Et.vertexUv1s=l.has(1),Et.vertexUv2s=l.has(2),Et.vertexUv3s=l.has(3),l.clear(),Et}function g(_){let A=[];if(_.shaderID?A.push(_.shaderID):(A.push(_.customVertexShaderID),A.push(_.customFragmentShaderID)),_.defines!==void 0)for(let N in _.defines)A.push(N),A.push(_.defines[N]);return _.isRawShaderMaterial===!1&&(d(A,_),v(A,_),A.push(e.outputColorSpace)),A.push(_.customProgramCacheKey),A.join()}function d(_,A){_.push(A.precision),_.push(A.outputColorSpace),_.push(A.envMapMode),_.push(A.envMapCubeUVHeight),_.push(A.mapUv),_.push(A.alphaMapUv),_.push(A.lightMapUv),_.push(A.aoMapUv),_.push(A.bumpMapUv),_.push(A.normalMapUv),_.push(A.displacementMapUv),_.push(A.emissiveMapUv),_.push(A.metalnessMapUv),_.push(A.roughnessMapUv),_.push(A.anisotropyMapUv),_.push(A.clearcoatMapUv),_.push(A.clearcoatNormalMapUv),_.push(A.clearcoatRoughnessMapUv),_.push(A.iridescenceMapUv),_.push(A.iridescenceThicknessMapUv),_.push(A.sheenColorMapUv),_.push(A.sheenRoughnessMapUv),_.push(A.specularMapUv),_.push(A.specularColorMapUv),_.push(A.specularIntensityMapUv),_.push(A.transmissionMapUv),_.push(A.thicknessMapUv),_.push(A.combine),_.push(A.fogExp2),_.push(A.sizeAttenuation),_.push(A.morphTargetsCount),_.push(A.morphAttributeCount),_.push(A.numSunLights),_.push(A.numDirLights),_.push(A.numPointLights),_.push(A.numSpotLights),_.push(A.numSpotLightMaps),_.push(A.numHemiLights),_.push(A.numRectAreaLights),_.push(A.numSunLightShadows),_.push(A.numDirLightShadows),_.push(A.numPointLightShadows),_.push(A.numSpotLightShadows),_.push(A.numSpotLightShadowsWithMaps),_.push(A.numLightProbes),_.push(A.shadowMapType),_.push(A.toneMapping),_.push(A.numClippingPlanes),_.push(A.numClipIntersection),_.push(A.depthPacking)}function v(_,A){r.disableAll(),A.instancing&&r.enable(0),A.instancingColor&&r.enable(1),A.instancingMorph&&r.enable(2),A.matcap&&r.enable(3),A.envMap&&r.enable(4),A.normalMapObjectSpace&&r.enable(5),A.normalMapTangentSpace&&r.enable(6),A.clearcoat&&r.enable(7),A.iridescence&&r.enable(8),A.alphaTest&&r.enable(9),A.vertexColors&&r.enable(10),A.vertexAlphas&&r.enable(11),A.vertexUv1s&&r.enable(12),A.vertexUv2s&&r.enable(13),A.vertexUv3s&&r.enable(14),A.vertexTangents&&r.enable(15),A.anisotropy&&r.enable(16),A.alphaHash&&r.enable(17),A.batching&&r.enable(18),A.dispersion&&r.enable(19),A.retroreflection&&r.enable(24),A.batchingColor&&r.enable(20),A.gradientMap&&r.enable(21),A.packedNormalMap&&r.enable(22),A.vertexNormals&&r.enable(23),_.push(r.mask),r.disableAll(),A.fog&&r.enable(0),A.useFog&&r.enable(1),A.flatShading&&r.enable(2),A.logarithmicDepthBuffer&&r.enable(3),A.reversedDepthBuffer&&r.enable(4),A.skinning&&r.enable(5),A.morphTargets&&r.enable(6),A.morphNormals&&r.enable(7),A.morphColors&&r.enable(8),A.premultipliedAlpha&&r.enable(9),A.shadowMapEnabled&&r.enable(10),A.doubleSided&&r.enable(11),A.flipSided&&r.enable(12),A.useDepthPacking&&r.enable(13),A.dithering&&r.enable(14),A.transmission&&r.enable(15),A.sheen&&r.enable(16),A.opaque&&r.enable(17),A.pointsUvs&&r.enable(18),A.decodeVideoTexture&&r.enable(19),A.decodeVideoTextureEmissive&&r.enable(20),A.alphaToCoverage&&r.enable(21),A.numLightProbeGrids>0&&r.enable(22),A.hasPositionAttribute&&r.enable(23),_.push(r.mask)}function b(_){let A=p[_.type],N;if(A){let C=As[A];N=DE.clone(C.uniforms)}else N=_.uniforms;return N}function x(_,A){let N=h.get(A);return N!==void 0?++N.usedTimes:(N=new XL(e,A,_,s),c.push(N),h.set(A,N)),N}function T(_){if(--_.usedTimes===0){let A=c.indexOf(_);c[A]=c[c.length-1],c.pop(),h.delete(_.cacheKey),_.destroy()}}function E(_){o.remove(_)}function w(){o.dispose()}return{getParameters:S,getProgramCacheKey:g,getUniforms:b,acquireProgram:x,releaseProgram:T,releaseShaderCache:E,programs:c,dispose:w}}function ZL(){let e=new WeakMap;function t(r){return e.has(r)}function n(r){let o=e.get(r);return o===void 0&&(o={},e.set(r,o)),o}function i(r){e.delete(r)}function s(r,o,l){e.get(r)[o]=l}function a(){e=new WeakMap}return{has:t,get:n,remove:i,update:s,dispose:a}}function jL(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.material.id!==t.material.id?e.material.id-t.material.id:e.materialVariant!==t.materialVariant?e.materialVariant-t.materialVariant:e.z!==t.z?e.z-t.z:e.id-t.id}function JE(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.z!==t.z?t.z-e.z:e.id-t.id}function QE(){let e=[],t=0,n=[],i=[],s=[];function a(){t=0,n.length=0,i.length=0,s.length=0}function r(u){let p=0;return u.isInstancedMesh&&(p+=2),u.isSkinnedMesh&&(p+=1),p}function o(u,p,m,S,g,d){let v=e[t];return v===void 0?(v={id:u.id,object:u,geometry:p,material:m,materialVariant:r(u),groupOrder:S,renderOrder:u.renderOrder,z:g,group:d},e[t]=v):(v.id=u.id,v.object=u,v.geometry=p,v.material=m,v.materialVariant=r(u),v.groupOrder=S,v.renderOrder=u.renderOrder,v.z=g,v.group=d),t++,v}function l(u,p,m,S,g,d,v){v.reversedDepth===!0&&(g=-g);let b=o(u,p,m,S,g,d);m.transmission>0?i.push(b):m.transparent===!0?s.push(b):n.push(b)}function c(u,p,m,S,g,d){let v=o(u,p,m,S,g,d);m.transmission>0?i.unshift(v):m.transparent===!0?s.unshift(v):n.unshift(v)}function h(u,p){n.length>1&&n.sort(u||jL),i.length>1&&i.sort(p||JE),s.length>1&&s.sort(p||JE)}function f(){for(let u=t,p=e.length;u<p;u++){let m=e[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:n,transmissive:i,transparent:s,init:a,push:l,unshift:c,finish:f,sort:h}}function KL(){let e=new WeakMap;function t(i,s){let a=e.get(i),r;return a===void 0?(r=new QE,e.set(i,[r])):s>=a.length?(r=new QE,a.push(r)):r=a[s],r}function n(){e=new WeakMap}return{get:t,dispose:n}}function JL(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={direction:new z,color:new Xt};break;case"SpotLight":n={position:new z,direction:new z,color:new Xt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new z,color:new Xt,distance:0,decay:0};break;case"HemisphereLight":n={direction:new z,skyColor:new Xt,groundColor:new Xt};break;case"RectAreaLight":n={color:new Xt,position:new z,halfWidth:new z,halfHeight:new z};break}return e[t.id]=n,n}}}function QL(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}var $L=0;function tU(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function eU(e){let t=new JL,n=QL(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new z);let s=new z,a=new Be,r=new Be;function o(c){let h=0,f=0,u=0;for(let U=0;U<9;U++)i.probe[U].set(0,0,0);let p=0,m=0,S=0,g=0,d=0,v=0,b=0,x=0,T=0,E=0,w=0,_=0,A=0,N=0;c.sort(tU);for(let U=0,O=c.length;U<O;U++){let D=c[U],G=D.color,q=D.intensity,Z=D.distance,nt=null;if(D.shadow&&D.shadow.map&&(D.shadow.map.texture.format===sr?nt=D.shadow.map.texture:nt=D.shadow.map.depthTexture||D.shadow.map.texture),D.isAmbientLight)h+=G.r*q,f+=G.g*q,u+=G.b*q;else if(D.isLightProbe){for(let Y=0;Y<9;Y++)i.probe[Y].addScaledVector(D.sh.coefficients[Y],q);N++}else if(D.isSunLight){let Y=t.get(D);if(Y.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){let $=D.shadow,st=n.get(D);st.shadowIntensity=$.intensity,st.shadowBias=$.bias,st.shadowNormalBias=$.normalBias,st.shadowRadius=$.radius,st.shadowMapSize.copy($.mapSize).multiply($.getFrameExtents()),i.sunShadow[m]=st,i.sunShadowMap[m]=nt;let Lt=$.getViewportCount();for(let Nt=0;Nt<Lt;Nt++)i.sunShadowMatrix[S+Nt]=$.getMatrix(Nt),i.sunShadowCascade[S+Nt]=$._cascadeData[Nt];S+=Lt,m++}i.sun[p]=Y,p++}else if(D.isDirectionalLight){let Y=t.get(D);if(Y.color.copy(D.color).multiplyScalar(D.intensity),D.castShadow){let $=D.shadow,st=n.get(D);st.shadowIntensity=$.intensity,st.shadowBias=$.bias,st.shadowNormalBias=$.normalBias,st.shadowRadius=$.radius,st.shadowMapSize=$.mapSize,i.directionalShadow[g]=st,i.directionalShadowMap[g]=nt,i.directionalShadowMatrix[g]=D.shadow.matrix,T++}i.directional[g]=Y,g++}else if(D.isSpotLight){let Y=t.get(D);Y.position.setFromMatrixPosition(D.matrixWorld),Y.color.copy(G).multiplyScalar(q),Y.distance=Z,Y.coneCos=Math.cos(D.angle),Y.penumbraCos=Math.cos(D.angle*(1-D.penumbra)),Y.decay=D.decay,i.spot[v]=Y;let $=D.shadow;if(D.map&&(i.spotLightMap[_]=D.map,_++,$.updateMatrices(D),D.castShadow&&A++),i.spotLightMatrix[v]=$.matrix,D.castShadow){let st=n.get(D);st.shadowIntensity=$.intensity,st.shadowBias=$.bias,st.shadowNormalBias=$.normalBias,st.shadowRadius=$.radius,st.shadowMapSize=$.mapSize,i.spotShadow[v]=st,i.spotShadowMap[v]=nt,w++}v++}else if(D.isRectAreaLight){let Y=t.get(D);Y.color.copy(G).multiplyScalar(q),Y.halfWidth.set(D.width*.5,0,0),Y.halfHeight.set(0,D.height*.5,0),i.rectArea[b]=Y,b++}else if(D.isPointLight){let Y=t.get(D);if(Y.color.copy(D.color).multiplyScalar(D.intensity),Y.distance=D.distance,Y.decay=D.decay,D.castShadow){let $=D.shadow,st=n.get(D);st.shadowIntensity=$.intensity,st.shadowBias=$.bias,st.shadowNormalBias=$.normalBias,st.shadowRadius=$.radius,st.shadowMapSize=$.mapSize,st.shadowCameraNear=$.camera.near,st.shadowCameraFar=$.camera.far,i.pointShadow[d]=st,i.pointShadowMap[d]=nt,i.pointShadowMatrix[d]=D.shadow.matrix,E++}i.point[d]=Y,d++}else if(D.isHemisphereLight){let Y=t.get(D);Y.skyColor.copy(D.color).multiplyScalar(q),Y.groundColor.copy(D.groundColor).multiplyScalar(q),i.hemi[x]=Y,x++}}b>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=gt.LTC_FLOAT_1,i.rectAreaLTC2=gt.LTC_FLOAT_2):(i.rectAreaLTC1=gt.LTC_HALF_1,i.rectAreaLTC2=gt.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=f,i.ambient[2]=u;let C=i.hash;(C.sunLength!==p||C.directionalLength!==g||C.pointLength!==d||C.spotLength!==v||C.rectAreaLength!==b||C.hemiLength!==x||C.numSunShadows!==m||C.numDirectionalShadows!==T||C.numPointShadows!==E||C.numSpotShadows!==w||C.numSpotMaps!==_||C.numLightProbes!==N)&&(i.sun.length=p,i.directional.length=g,i.spot.length=v,i.rectArea.length=b,i.point.length=d,i.hemi.length=x,i.sunShadow.length=m,i.sunShadowMap.length=m,i.sunShadowMatrix.length=S,i.sunShadowCascade.length=S,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.directionalShadowMatrix.length=T,i.pointShadow.length=E,i.pointShadowMap.length=E,i.pointShadowMatrix.length=E,i.spotShadow.length=w,i.spotShadowMap.length=w,i.spotLightMatrix.length=w+_-A,i.spotLightMap.length=_,i.numSpotLightShadowsWithMaps=A,i.numLightProbes=N,C.sunLength=p,C.directionalLength=g,C.pointLength=d,C.spotLength=v,C.rectAreaLength=b,C.hemiLength=x,C.numSunShadows=m,C.numDirectionalShadows=T,C.numPointShadows=E,C.numSpotShadows=w,C.numSpotMaps=_,C.numLightProbes=N,i.version=$L++)}function l(c,h){let f=0,u=0,p=0,m=0,S=0,g=0,d=h.matrixWorldInverse;for(let v=0,b=c.length;v<b;v++){let x=c[v];if(x.isSunLight){let T=i.sun[f];T.direction.setFromMatrixPosition(x.matrixWorld),T.direction.transformDirection(d),f++}else if(x.isDirectionalLight){let T=i.directional[u];T.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(d),u++}else if(x.isSpotLight){let T=i.spot[m];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(d),T.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(d),m++}else if(x.isRectAreaLight){let T=i.rectArea[S];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(d),r.identity(),a.copy(x.matrixWorld),a.premultiply(d),r.extractRotation(a),T.halfWidth.set(x.width*.5,0,0),T.halfHeight.set(0,x.height*.5,0),T.halfWidth.applyMatrix4(r),T.halfHeight.applyMatrix4(r),S++}else if(x.isPointLight){let T=i.point[p];T.position.setFromMatrixPosition(x.matrixWorld),T.position.applyMatrix4(d),p++}else if(x.isHemisphereLight){let T=i.hemi[g];T.direction.setFromMatrixPosition(x.matrixWorld),T.direction.transformDirection(d),g++}}}return{setup:o,setupView:l,state:i}}function $E(e){let t=new eU(e),n=[],i=[],s=[];function a(u){f.camera=u,n.length=0,i.length=0,s.length=0}function r(u){n.push(u)}function o(u){i.push(u)}function l(u){s.push(u)}function c(){t.setup(n)}function h(u){t.setupView(n,u)}let f={lightsArray:n,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:f,setupLights:c,setupLightsView:h,pushLight:r,pushShadow:o,pushLightProbeGrid:l}}function nU(e){let t=new WeakMap;function n(s,a=0){let r=t.get(s),o;return r===void 0?(o=new $E(e),t.set(s,[o])):a>=r.length?(o=new $E(e),r.push(o)):o=r[a],o}function i(){t=new WeakMap}return{get:n,dispose:i}}var iU=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,sU=`uniform sampler2D shadow_pass;
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
}`,aU=[new z(1,0,0),new z(-1,0,0),new z(0,1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1)],rU=[new z(0,-1,0),new z(0,-1,0),new z(0,0,1),new z(0,0,-1),new z(0,-1,0),new z(0,-1,0)],tT=new Be,Iu=new z,m_=new z;function oU(e,t,n){let i=new uu,s=new Ut,a=new Ut,r=new Xe,o=new Uf,l=new If,c={},h=n.maxTextureSize,f={[$a]:Zn,[Zn]:$a,[Ms]:Ms},u=new xi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ut},radius:{value:4}},vertexShader:iU,fragmentShader:sU}),p=u.clone();p.defines.HORIZONTAL_PASS=1;let m=new vn;m.setAttribute("position",new Xn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let S=new Yn(m,u),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Mu;let d=this.type;this.render=function(E,w,_){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||E.length===0)return;this.type===Z1&&(It("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Mu);let A=e.getRenderTarget(),N=e.getActiveCubeFace(),C=e.getActiveMipmapLevel(),U=e.state;U.setBlending(Es),U.buffers.depth.getReversed()===!0?U.buffers.color.setClear(0,0,0,0):U.buffers.color.setClear(1,1,1,1),U.buffers.depth.setTest(!0),U.setScissorTest(!1);let O=d!==this.type;O&&w.traverse(function(D){D.material&&(Array.isArray(D.material)?D.material.forEach(G=>G.needsUpdate=!0):D.material.needsUpdate=!0)});for(let D=0,G=E.length;D<G;D++){let q=E[D],Z=q.shadow;if(Z===void 0){It("WebGLShadowMap:",q,"has no shadow.");continue}if(Z.autoUpdate===!1&&Z.needsUpdate===!1)continue;s.copy(Z.mapSize);let nt=Z.getFrameExtents();s.multiply(nt),a.copy(Z.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(a.x=Math.floor(h/nt.x),s.x=a.x*nt.x,Z.mapSize.x=a.x),s.y>h&&(a.y=Math.floor(h/nt.y),s.y=a.y*nt.y,Z.mapSize.y=a.y));let Y=e.state.buffers.depth.getReversed();if(Z.camera._reversedDepth=Y,Z.map===null||O===!0){if(Z.map!==null&&(Z.map.depthTexture!==null&&(Z.map.depthTexture.dispose(),Z.map.depthTexture=null),Z.map.dispose()),this.type===Al){if(q.isPointLight){It("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}Z.map=new ni(s.x,s.y,{format:sr,type:Qi,minFilter:wn,magFilter:wn,generateMipmaps:!1}),Z.map.texture.name=q.name+".shadowMap",Z.map.depthTexture=new Ya(s.x,s.y,Ji),Z.map.depthTexture.name=q.name+".shadowMapDepth",Z.map.depthTexture.format=ys,Z.map.depthTexture.compareFunction=null,Z.map.depthTexture.minFilter=gn,Z.map.depthTexture.magFilter=gn}else q.isPointLight?(Z.map=new Bp(s.x),Z.map.depthTexture=new Nf(s.x,Ki)):(Z.map=new ni(s.x,s.y),Z.map.depthTexture=new Ya(s.x,s.y,Ki)),Z.map.depthTexture.name=q.name+".shadowMap",Z.map.depthTexture.format=ys,this.type===Mu?(Z.map.depthTexture.compareFunction=Y?Up:Lp,Z.map.depthTexture.minFilter=wn,Z.map.depthTexture.magFilter=wn):(Z.map.depthTexture.compareFunction=null,Z.map.depthTexture.minFilter=gn,Z.map.depthTexture.magFilter=gn);Z.camera.updateProjectionMatrix()}Z.map.isWebGLCubeRenderTarget!==!0&&(Z.map.width!==s.x||Z.map.height!==s.y)&&Z.map.setSize(s.x,s.y);let $=Z.map.isWebGLCubeRenderTarget?6:Z.getViewportCount();q.isPointLight!==!0&&Z.updateMatrices(q,_);for(let st=0;st<$;st++){let Lt=Z.getCamera(st);if(q.isPointLight){let Nt=Z.camera,he=Z.matrix,ne=q.distance||Nt.far;ne!==Nt.far&&(Nt.far=ne,Nt.updateProjectionMatrix()),Iu.setFromMatrixPosition(q.matrixWorld),Nt.position.copy(Iu),m_.copy(Nt.position),m_.add(aU[st]),Nt.up.copy(rU[st]),Nt.lookAt(m_),Nt.updateMatrixWorld(),he.makeTranslation(-Iu.x,-Iu.y,-Iu.z),tT.multiplyMatrices(Nt.projectionMatrix,Nt.matrixWorldInverse),Z._frustum.setFromProjectionMatrix(tT,Nt.coordinateSystem,Nt.reversedDepth)}if(Z.map.isWebGLCubeRenderTarget)e.setRenderTarget(Z.map,st),e.clear();else{st===0&&(e.setRenderTarget(Z.map),e.clear());let Nt=Z.getViewport(st);r.set(a.x*Nt.x,a.y*Nt.y,a.x*Nt.z,a.y*Nt.w),U.viewport(r)}i=Z.getFrustum(st),x(w,_,Lt,q,this.type)}Z.isPointLightShadow!==!0&&this.type===Al&&v(Z,_),Z.needsUpdate=!1}d=this.type,g.needsUpdate=!1,e.setRenderTarget(A,N,C)};function v(E,w){let _=t.update(S);u.defines.VSM_SAMPLES!==E.blurSamples&&(u.defines.VSM_SAMPLES=E.blurSamples,p.defines.VSM_SAMPLES=E.blurSamples,u.needsUpdate=!0,p.needsUpdate=!0),E.mapPass===null?E.mapPass=new ni(s.x,s.y,{format:sr,type:Qi}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),u.uniforms.shadow_pass.value=E.map.depthTexture,u.uniforms.resolution.value.set(E.map.width,E.map.height),u.uniforms.radius.value=E.radius,e.setRenderTarget(E.mapPass),e.clear(),e.renderBufferDirect(w,null,_,u,S,null),p.uniforms.shadow_pass.value=E.mapPass.texture,p.uniforms.resolution.value.set(E.map.width,E.map.height),p.uniforms.radius.value=E.radius,e.setRenderTarget(E.map),e.clear(),e.renderBufferDirect(w,null,_,p,S,null)}function b(E,w,_,A){let N=null,C=_.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(C!==void 0)N=C;else if(N=_.isPointLight===!0?l:o,e.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0||w.alphaToCoverage===!0){let U=N.uuid,O=w.uuid,D=c[U];D===void 0&&(D={},c[U]=D);let G=D[O];G===void 0&&(G=N.clone(),D[O]=G,w.addEventListener("dispose",T)),N=G}if(N.visible=w.visible,N.wireframe=w.wireframe,A===Al?N.side=w.shadowSide!==null?w.shadowSide:w.side:N.side=w.shadowSide!==null?w.shadowSide:f[w.side],N.alphaMap=w.alphaMap,N.alphaTest=w.alphaToCoverage===!0?.5:w.alphaTest,N.map=w.map,N.clipShadows=w.clipShadows,N.clippingPlanes=w.clippingPlanes,N.clipIntersection=w.clipIntersection,N.displacementMap=w.displacementMap,N.displacementScale=w.displacementScale,N.displacementBias=w.displacementBias,N.wireframeLinewidth=w.wireframeLinewidth,N.linewidth=w.linewidth,_.isPointLight===!0&&N.isMeshDistanceMaterial===!0){let U=e.properties.get(N);U.light=_}return N}function x(E,w,_,A,N){if(E.visible===!1)return;if(E.layers.test(w.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&N===Al)&&(!E.frustumCulled||E.intersectsFrustum(i))){E.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,E.matrixWorld);let O=t.update(E),D=E.material;if(Array.isArray(D)){let G=O.groups;for(let q=0,Z=G.length;q<Z;q++){let nt=G[q],Y=D[nt.materialIndex];if(Y&&Y.visible){let $=b(E,Y,A,N);E.onBeforeShadow(e,E,w,_,O,$,nt),e.renderBufferDirect(_,null,O,$,E,nt),E.onAfterShadow(e,E,w,_,O,$,nt)}}}else if(D.visible){let G=b(E,D,A,N);E.onBeforeShadow(e,E,w,_,O,G,null),e.renderBufferDirect(_,null,O,G,E,null),E.onAfterShadow(e,E,w,_,O,G,null)}}let U=E.children;for(let O=0,D=U.length;O<D;O++)x(U[O],w,_,A,N)}function T(E){E.target.removeEventListener("dispose",T);for(let _ in c){let A=c[_],N=E.target.uuid;N in A&&(A[N].dispose(),delete A[N])}}}function lU(e,t){function n(){let P=!1,dt=new Xe,Q=null,ht=new Xe(0,0,0,0);return{setMask:function(mt){Q!==mt&&!P&&(e.colorMask(mt,mt,mt,mt),Q=mt)},setLocked:function(mt){P=mt},setClear:function(mt,at,Ct,Et,me){me===!0&&(mt*=Et,at*=Et,Ct*=Et),dt.set(mt,at,Ct,Et),ht.equals(dt)===!1&&(e.clearColor(mt,at,Ct,Et),ht.copy(dt))},reset:function(){P=!1,Q=null,ht.set(-1,0,0,0)}}}function i(){let P=!1,dt=!1,Q=null,ht=null,mt=null;return{setReversed:function(at){if(dt!==at){let Ct=t.get("EXT_clip_control");at?Ct.clipControlEXT(Ct.LOWER_LEFT_EXT,Ct.ZERO_TO_ONE_EXT):Ct.clipControlEXT(Ct.LOWER_LEFT_EXT,Ct.NEGATIVE_ONE_TO_ONE_EXT),dt=at;let Et=mt;mt=null,this.setClear(Et)}},getReversed:function(){return dt},setTest:function(at){at?it(e.DEPTH_TEST):St(e.DEPTH_TEST)},setMask:function(at){Q!==at&&!P&&(e.depthMask(at),Q=at)},setFunc:function(at){if(dt&&(at=CE[at]),ht!==at){switch(at){case ff:e.depthFunc(e.NEVER);break;case pf:e.depthFunc(e.ALWAYS);break;case mf:e.depthFunc(e.LESS);break;case gl:e.depthFunc(e.LEQUAL);break;case gf:e.depthFunc(e.EQUAL);break;case vf:e.depthFunc(e.GEQUAL);break;case _f:e.depthFunc(e.GREATER);break;case yf:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}ht=at}},setLocked:function(at){P=at},setClear:function(at){mt!==at&&(mt=at,dt&&(at=1-at),e.clearDepth(at))},reset:function(){P=!1,Q=null,ht=null,mt=null,dt=!1}}}function s(){let P=!1,dt=null,Q=null,ht=null,mt=null,at=null,Ct=null,Et=null,me=null;return{setTest:function(le){P||(le?it(e.STENCIL_TEST):St(e.STENCIL_TEST))},setMask:function(le){dt!==le&&!P&&(e.stencilMask(le),dt=le)},setFunc:function(le,Pn,Mi){(Q!==le||ht!==Pn||mt!==Mi)&&(e.stencilFunc(le,Pn,Mi),Q=le,ht=Pn,mt=Mi)},setOp:function(le,Pn,Mi){(at!==le||Ct!==Pn||Et!==Mi)&&(e.stencilOp(le,Pn,Mi),at=le,Ct=Pn,Et=Mi)},setLocked:function(le){P=le},setClear:function(le){me!==le&&(e.clearStencil(le),me=le)},reset:function(){P=!1,dt=null,Q=null,ht=null,mt=null,at=null,Ct=null,Et=null,me=null}}}let a=new n,r=new i,o=new s,l=new WeakMap,c=new WeakMap,h={},f={},u={},p=new WeakMap,m=[],S=null,g=!1,d=null,v=null,b=null,x=null,T=null,E=null,w=null,_=new Xt(0,0,0),A=0,N=!1,C=null,U=null,O=null,D=null,G=null,q=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Z=!1,nt=0,Y=e.getParameter(e.VERSION);Y.indexOf("WebGL")!==-1?(nt=parseFloat(/^WebGL (\d)/.exec(Y)[1]),Z=nt>=1):Y.indexOf("OpenGL ES")!==-1&&(nt=parseFloat(/^OpenGL ES (\d)/.exec(Y)[1]),Z=nt>=2);let $=null,st={},Lt=e.getParameter(e.SCISSOR_BOX),Nt=e.getParameter(e.VIEWPORT),he=new Xe().fromArray(Lt),ne=new Xe().fromArray(Nt);function oe(P,dt,Q,ht){let mt=new Uint8Array(4),at=e.createTexture();e.bindTexture(P,at),e.texParameteri(P,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(P,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Ct=0;Ct<Q;Ct++)P===e.TEXTURE_3D||P===e.TEXTURE_2D_ARRAY?e.texImage3D(dt,0,e.RGBA,1,1,ht,0,e.RGBA,e.UNSIGNED_BYTE,mt):e.texImage2D(dt+Ct,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,mt);return at}let J={};J[e.TEXTURE_2D]=oe(e.TEXTURE_2D,e.TEXTURE_2D,1),J[e.TEXTURE_CUBE_MAP]=oe(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),J[e.TEXTURE_2D_ARRAY]=oe(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),J[e.TEXTURE_3D]=oe(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),r.setClear(1),o.setClear(0),it(e.DEPTH_TEST),r.setFunc(gl),qt(!1),Ee(Ov),it(e.CULL_FACE),ae(Es);function it(P){h[P]!==!0&&(e.enable(P),h[P]=!0)}function St(P){h[P]!==!1&&(e.disable(P),h[P]=!1)}function zt(P,dt){return u[P]!==dt?(e.bindFramebuffer(P,dt),u[P]=dt,P===e.DRAW_FRAMEBUFFER&&(u[e.FRAMEBUFFER]=dt),P===e.FRAMEBUFFER&&(u[e.DRAW_FRAMEBUFFER]=dt),!0):!1}function yt(P,dt){let Q=m,ht=!1;if(P){Q=p.get(dt),Q===void 0&&(Q=[],p.set(dt,Q));let mt=P.textures;if(Q.length!==mt.length||Q[0]!==e.COLOR_ATTACHMENT0){for(let at=0,Ct=mt.length;at<Ct;at++)Q[at]=e.COLOR_ATTACHMENT0+at;Q.length=mt.length,ht=!0}}else Q[0]!==e.BACK&&(Q[0]=e.BACK,ht=!0);ht&&e.drawBuffers(Q)}function Ft(P){return S!==P?(e.useProgram(P),S=P,!0):!1}let We={[Vr]:e.FUNC_ADD,[K1]:e.FUNC_SUBTRACT,[J1]:e.FUNC_REVERSE_SUBTRACT};We[Q1]=e.MIN,We[$1]=e.MAX;let Wt={[tE]:e.ZERO,[eE]:e.ONE,[nE]:e.SRC_COLOR,[zv]:e.SRC_ALPHA,[lE]:e.SRC_ALPHA_SATURATE,[rE]:e.DST_COLOR,[sE]:e.DST_ALPHA,[iE]:e.ONE_MINUS_SRC_COLOR,[Fv]:e.ONE_MINUS_SRC_ALPHA,[oE]:e.ONE_MINUS_DST_COLOR,[aE]:e.ONE_MINUS_DST_ALPHA,[cE]:e.CONSTANT_COLOR,[uE]:e.ONE_MINUS_CONSTANT_COLOR,[hE]:e.CONSTANT_ALPHA,[dE]:e.ONE_MINUS_CONSTANT_ALPHA};function ae(P,dt,Q,ht,mt,at,Ct,Et,me,le){if(P===Es){g===!0&&(St(e.BLEND),g=!1);return}if(g===!1&&(it(e.BLEND),g=!0),P!==j1){if(P!==d||le!==N){if((v!==Vr||T!==Vr)&&(e.blendEquation(e.FUNC_ADD),v=Vr,T=Vr),le)switch(P){case tr:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Eu:e.blendFunc(e.ONE,e.ONE);break;case Pv:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case Bv:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:Pt("WebGLState: Invalid blending: ",P);break}else switch(P){case tr:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case Eu:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case Pv:Pt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Bv:Pt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Pt("WebGLState: Invalid blending: ",P);break}b=null,x=null,E=null,w=null,_.set(0,0,0),A=0,d=P,N=le}return}mt=mt||dt,at=at||Q,Ct=Ct||ht,(dt!==v||mt!==T)&&(e.blendEquationSeparate(We[dt],We[mt]),v=dt,T=mt),(Q!==b||ht!==x||at!==E||Ct!==w)&&(e.blendFuncSeparate(Wt[Q],Wt[ht],Wt[at],Wt[Ct]),b=Q,x=ht,E=at,w=Ct),(Et.equals(_)===!1||me!==A)&&(e.blendColor(Et.r,Et.g,Et.b,me),_.copy(Et),A=me),d=P,N=!1}function pe(P,dt){P.side===Ms?St(e.CULL_FACE):it(e.CULL_FACE);let Q=P.side===Zn;dt&&(Q=!Q),qt(Q),P.blending===tr&&P.transparent===!1?ae(Es):ae(P.blending,P.blendEquation,P.blendSrc,P.blendDst,P.blendEquationAlpha,P.blendSrcAlpha,P.blendDstAlpha,P.blendColor,P.blendAlpha,P.premultipliedAlpha),r.setFunc(P.depthFunc),r.setTest(P.depthTest),r.setMask(P.depthWrite),a.setMask(P.colorWrite);let ht=P.stencilWrite;o.setTest(ht),ht&&(o.setMask(P.stencilWriteMask),o.setFunc(P.stencilFunc,P.stencilRef,P.stencilFuncMask),o.setOp(P.stencilFail,P.stencilZFail,P.stencilZPass)),Ve(P.polygonOffset,P.polygonOffsetFactor,P.polygonOffsetUnits),P.alphaToCoverage===!0?it(e.SAMPLE_ALPHA_TO_COVERAGE):St(e.SAMPLE_ALPHA_TO_COVERAGE)}function qt(P){C!==P&&(P?e.frontFace(e.CW):e.frontFace(e.CCW),C=P)}function Ee(P){P!==q1?(it(e.CULL_FACE),P!==U&&(P===Ov?e.cullFace(e.BACK):P===Y1?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):St(e.CULL_FACE),U=P}function qe(P){P!==O&&(Z&&e.lineWidth(P),O=P)}function Ve(P,dt,Q){P?(it(e.POLYGON_OFFSET_FILL),(D!==dt||G!==Q)&&(D=dt,G=Q,r.getReversed()&&(dt=-dt),e.polygonOffset(dt,Q))):St(e.POLYGON_OFFSET_FILL)}function Ae(P){P?it(e.SCISSOR_TEST):St(e.SCISSOR_TEST)}function re(P){P===void 0&&(P=e.TEXTURE0+q-1),$!==P&&(e.activeTexture(P),$=P)}function B(P,dt,Q){Q===void 0&&($===null?Q=e.TEXTURE0+q-1:Q=$);let ht=st[Q];ht===void 0&&(ht={type:void 0,texture:void 0},st[Q]=ht),(ht.type!==P||ht.texture!==dt)&&($!==Q&&(e.activeTexture(Q),$=Q),e.bindTexture(P,dt||J[P]),ht.type=P,ht.texture=dt)}function Ye(){let P=st[$];P!==void 0&&P.type!==void 0&&(e.bindTexture(P.type,null),P.type=void 0,P.texture=void 0)}function Qt(){try{e.compressedTexImage2D(...arguments)}catch(P){Pt("WebGLState:",P)}}function R(){try{e.compressedTexImage3D(...arguments)}catch(P){Pt("WebGLState:",P)}}function y(){try{e.texSubImage2D(...arguments)}catch(P){Pt("WebGLState:",P)}}function H(){try{e.texSubImage3D(...arguments)}catch(P){Pt("WebGLState:",P)}}function X(){try{e.compressedTexSubImage2D(...arguments)}catch(P){Pt("WebGLState:",P)}}function j(){try{e.compressedTexSubImage3D(...arguments)}catch(P){Pt("WebGLState:",P)}}function rt(){try{e.texStorage2D(...arguments)}catch(P){Pt("WebGLState:",P)}}function lt(){try{e.texStorage3D(...arguments)}catch(P){Pt("WebGLState:",P)}}function K(){try{e.texImage2D(...arguments)}catch(P){Pt("WebGLState:",P)}}function tt(){try{e.texImage3D(...arguments)}catch(P){Pt("WebGLState:",P)}}function ct(P){return f[P]!==void 0?f[P]:e.getParameter(P)}function At(P,dt){f[P]!==dt&&(e.pixelStorei(P,dt),f[P]=dt)}function ft(P){he.equals(P)===!1&&(e.scissor(P.x,P.y,P.z,P.w),he.copy(P))}function ut(P){ne.equals(P)===!1&&(e.viewport(P.x,P.y,P.z,P.w),ne.copy(P))}function Mt(P,dt){let Q=c.get(dt);Q===void 0&&(Q=new WeakMap,c.set(dt,Q));let ht=Q.get(P);ht===void 0&&(ht=e.getUniformBlockIndex(dt,P.name),Q.set(P,ht))}function Dt(P,dt){let ht=c.get(dt).get(P);l.get(dt)!==ht&&(e.uniformBlockBinding(dt,ht,P.__bindingPointIndex),l.set(dt,ht))}function Gt(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),r.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),h={},f={},$=null,st={},u={},p=new WeakMap,m=[],S=null,g=!1,d=null,v=null,b=null,x=null,T=null,E=null,w=null,_=new Xt(0,0,0),A=0,N=!1,C=null,U=null,O=null,D=null,G=null,he.set(0,0,e.canvas.width,e.canvas.height),ne.set(0,0,e.canvas.width,e.canvas.height),a.reset(),r.reset(),o.reset()}return{buffers:{color:a,depth:r,stencil:o},enable:it,disable:St,bindFramebuffer:zt,drawBuffers:yt,useProgram:Ft,setBlending:ae,setMaterial:pe,setFlipSided:qt,setCullFace:Ee,setLineWidth:qe,setPolygonOffset:Ve,setScissorTest:Ae,activeTexture:re,bindTexture:B,unbindTexture:Ye,compressedTexImage2D:Qt,compressedTexImage3D:R,texImage2D:K,texImage3D:tt,pixelStorei:At,getParameter:ct,updateUBOMapping:Mt,uniformBlockBinding:Dt,texStorage2D:rt,texStorage3D:lt,texSubImage2D:y,texSubImage3D:H,compressedTexSubImage2D:X,compressedTexSubImage3D:j,scissor:ft,viewport:ut,reset:Gt}}function cU(e,t,n,i,s,a,r){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Ut,h=new WeakMap,f=new Set,u,p=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(R,y){return m?new OffscreenCanvas(R,y):nu("canvas")}function g(R,y,H){let X=1,j=Qt(R);if((j.width>H||j.height>H)&&(X=H/Math.max(j.width,j.height)),X<1)if(typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&R instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&R instanceof ImageBitmap||typeof VideoFrame<"u"&&R instanceof VideoFrame){let rt=Math.floor(X*j.width),lt=Math.floor(X*j.height);u===void 0&&(u=S(rt,lt));let K=y?S(rt,lt):u;return K.width=rt,K.height=lt,K.getContext("2d").drawImage(R,0,0,rt,lt),It("WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+rt+"x"+lt+")."),K}else return"data"in R&&It("WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),R;return R}function d(R){return R.generateMipmaps}function v(R){e.generateMipmap(R)}function b(R){return R.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:R.isWebGL3DRenderTarget?e.TEXTURE_3D:R.isWebGLArrayRenderTarget||R.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function x(R,y,H,X,j,rt=!1){if(R!==null){if(e[R]!==void 0)return e[R];It("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let lt;X&&(lt=t.get("EXT_texture_norm16"),lt||It("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let K=y;if(y===e.RED&&(H===e.FLOAT&&(K=e.R32F),H===e.HALF_FLOAT&&(K=e.R16F),H===e.UNSIGNED_BYTE&&(K=e.R8),H===e.UNSIGNED_SHORT&&lt&&(K=lt.R16_EXT),H===e.SHORT&&lt&&(K=lt.R16_SNORM_EXT)),y===e.RED_INTEGER&&(H===e.UNSIGNED_BYTE&&(K=e.R8UI),H===e.UNSIGNED_SHORT&&(K=e.R16UI),H===e.UNSIGNED_INT&&(K=e.R32UI),H===e.BYTE&&(K=e.R8I),H===e.SHORT&&(K=e.R16I),H===e.INT&&(K=e.R32I)),y===e.RG&&(H===e.FLOAT&&(K=e.RG32F),H===e.HALF_FLOAT&&(K=e.RG16F),H===e.UNSIGNED_BYTE&&(K=e.RG8),H===e.UNSIGNED_SHORT&&lt&&(K=lt.RG16_EXT),H===e.SHORT&&lt&&(K=lt.RG16_SNORM_EXT)),y===e.RG_INTEGER&&(H===e.UNSIGNED_BYTE&&(K=e.RG8UI),H===e.UNSIGNED_SHORT&&(K=e.RG16UI),H===e.UNSIGNED_INT&&(K=e.RG32UI),H===e.BYTE&&(K=e.RG8I),H===e.SHORT&&(K=e.RG16I),H===e.INT&&(K=e.RG32I)),y===e.RGB_INTEGER&&(H===e.UNSIGNED_BYTE&&(K=e.RGB8UI),H===e.UNSIGNED_SHORT&&(K=e.RGB16UI),H===e.UNSIGNED_INT&&(K=e.RGB32UI),H===e.BYTE&&(K=e.RGB8I),H===e.SHORT&&(K=e.RGB16I),H===e.INT&&(K=e.RGB32I)),y===e.RGBA_INTEGER&&(H===e.UNSIGNED_BYTE&&(K=e.RGBA8UI),H===e.UNSIGNED_SHORT&&(K=e.RGBA16UI),H===e.UNSIGNED_INT&&(K=e.RGBA32UI),H===e.BYTE&&(K=e.RGBA8I),H===e.SHORT&&(K=e.RGBA16I),H===e.INT&&(K=e.RGBA32I)),y===e.RGB&&(H===e.UNSIGNED_SHORT&&lt&&(K=lt.RGB16_EXT),H===e.SHORT&&lt&&(K=lt.RGB16_SNORM_EXT),H===e.UNSIGNED_INT_5_9_9_9_REV&&(K=e.RGB9_E5),H===e.UNSIGNED_INT_10F_11F_11F_REV&&(K=e.R11F_G11F_B10F)),y===e.RGBA){let tt=rt?tu:se.getTransfer(j);H===e.FLOAT&&(K=e.RGBA32F),H===e.HALF_FLOAT&&(K=e.RGBA16F),H===e.UNSIGNED_BYTE&&(K=tt===_e?e.SRGB8_ALPHA8:e.RGBA8),H===e.UNSIGNED_SHORT&&lt&&(K=lt.RGBA16_EXT),H===e.SHORT&&lt&&(K=lt.RGBA16_SNORM_EXT),H===e.UNSIGNED_SHORT_4_4_4_4&&(K=e.RGBA4),H===e.UNSIGNED_SHORT_5_5_5_1&&(K=e.RGB5_A1)}return(K===e.R16F||K===e.R32F||K===e.RG16F||K===e.RG32F||K===e.RGBA16F||K===e.RGBA32F)&&t.get("EXT_color_buffer_float"),K}function T(R,y){let H;return R?y===null||y===Ki||y===Rl?H=e.DEPTH24_STENCIL8:y===Ji?H=e.DEPTH32F_STENCIL8:y===Cl&&(H=e.DEPTH24_STENCIL8,It("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):y===null||y===Ki||y===Rl?H=e.DEPTH_COMPONENT24:y===Ji?H=e.DEPTH_COMPONENT32F:y===Cl&&(H=e.DEPTH_COMPONENT16),H}function E(R,y){return d(R)===!0||R.isFramebufferTexture&&R.minFilter!==gn&&R.minFilter!==wn?Math.log2(Math.max(y.width,y.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?y.mipmaps.length:1}function w(R){let y=R.target;y.removeEventListener("dispose",w),A(y),y.isVideoTexture&&h.delete(y),y.isHTMLTexture&&f.delete(y)}function _(R){let y=R.target;y.removeEventListener("dispose",_),C(y)}function A(R){let y=i.get(R);if(y.__webglInit===void 0)return;let H=R.source,X=p.get(H);if(X){let j=X[y.__cacheKey];j.usedTimes--,j.usedTimes===0&&N(R),Object.keys(X).length===0&&p.delete(H)}i.remove(R)}function N(R){let y=i.get(R);e.deleteTexture(y.__webglTexture);let H=R.source,X=p.get(H);delete X[y.__cacheKey],r.memory.textures--}function C(R){let y=i.get(R);if(R.depthTexture&&(R.depthTexture.dispose(),i.remove(R.depthTexture)),R.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(y.__webglFramebuffer[X]))for(let j=0;j<y.__webglFramebuffer[X].length;j++)e.deleteFramebuffer(y.__webglFramebuffer[X][j]);else e.deleteFramebuffer(y.__webglFramebuffer[X]);y.__webglDepthbuffer&&e.deleteRenderbuffer(y.__webglDepthbuffer[X])}else{if(Array.isArray(y.__webglFramebuffer))for(let X=0;X<y.__webglFramebuffer.length;X++)e.deleteFramebuffer(y.__webglFramebuffer[X]);else e.deleteFramebuffer(y.__webglFramebuffer);if(y.__webglDepthbuffer&&e.deleteRenderbuffer(y.__webglDepthbuffer),y.__webglMultisampledFramebuffer&&e.deleteFramebuffer(y.__webglMultisampledFramebuffer),y.__webglColorRenderbuffer)for(let X=0;X<y.__webglColorRenderbuffer.length;X++)y.__webglColorRenderbuffer[X]&&e.deleteRenderbuffer(y.__webglColorRenderbuffer[X]);y.__webglDepthRenderbuffer&&e.deleteRenderbuffer(y.__webglDepthRenderbuffer)}let H=R.textures;for(let X=0,j=H.length;X<j;X++){let rt=i.get(H[X]);rt.__webglTexture&&(e.deleteTexture(rt.__webglTexture),r.memory.textures--),i.remove(H[X])}i.remove(R)}let U=0;function O(){U=0}function D(){return U}function G(R){U=R}function q(){let R=U;return R>=s.maxTextures&&It("WebGLTextures: Trying to use "+(R+1)+" texture units while this GPU supports only "+s.maxTextures),U+=1,R}function Z(R){let y=[];return y.push(R.wrapS),y.push(R.wrapT),y.push(R.wrapR||0),y.push(R.magFilter),y.push(R.minFilter),y.push(R.anisotropy),y.push(R.internalFormat),y.push(R.format),y.push(R.type),y.push(R.generateMipmaps),y.push(R.premultiplyAlpha),y.push(R.flipY),y.push(R.unpackAlignment),y.push(R.colorSpace),y.join()}function nt(R,y){let H=i.get(R);if(R.isVideoTexture&&B(R),R.isRenderTargetTexture===!1&&R.isExternalTexture!==!0&&R.version>0&&H.__version!==R.version){let X=R.image;if(X===null)It("WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)It("WebGLRenderer: Texture marked for update but image is incomplete");else{St(H,R,y);return}}else R.isExternalTexture&&(H.__webglTexture=R.sourceTexture?R.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,H.__webglTexture,e.TEXTURE0+y)}function Y(R,y){let H=i.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&H.__version!==R.version){St(H,R,y);return}else R.isExternalTexture&&(H.__webglTexture=R.sourceTexture?R.sourceTexture:null);n.bindTexture(e.TEXTURE_2D_ARRAY,H.__webglTexture,e.TEXTURE0+y)}function $(R,y){let H=i.get(R);if(R.isRenderTargetTexture===!1&&R.version>0&&H.__version!==R.version){St(H,R,y);return}n.bindTexture(e.TEXTURE_3D,H.__webglTexture,e.TEXTURE0+y)}function st(R,y){let H=i.get(R);if(R.isCubeDepthTexture!==!0&&R.version>0&&H.__version!==R.version){zt(H,R,y);return}n.bindTexture(e.TEXTURE_CUBE_MAP,H.__webglTexture,e.TEXTURE0+y)}let Lt={[xf]:e.REPEAT,[_s]:e.CLAMP_TO_EDGE,[Sf]:e.MIRRORED_REPEAT},Nt={[gn]:e.NEAREST,[mE]:e.NEAREST_MIPMAP_NEAREST,[wu]:e.NEAREST_MIPMAP_LINEAR,[wn]:e.LINEAR,[jf]:e.LINEAR_MIPMAP_NEAREST,[nr]:e.LINEAR_MIPMAP_LINEAR},he={[yE]:e.NEVER,[EE]:e.ALWAYS,[xE]:e.LESS,[Lp]:e.LEQUAL,[SE]:e.EQUAL,[Up]:e.GEQUAL,[bE]:e.GREATER,[ME]:e.NOTEQUAL};function ne(R,y){if(y.type===Ji&&t.has("OES_texture_float_linear")===!1&&(y.magFilter===wn||y.magFilter===jf||y.magFilter===wu||y.magFilter===nr||y.minFilter===wn||y.minFilter===jf||y.minFilter===wu||y.minFilter===nr)&&It("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(R,e.TEXTURE_WRAP_S,Lt[y.wrapS]),e.texParameteri(R,e.TEXTURE_WRAP_T,Lt[y.wrapT]),(R===e.TEXTURE_3D||R===e.TEXTURE_2D_ARRAY)&&e.texParameteri(R,e.TEXTURE_WRAP_R,Lt[y.wrapR]),e.texParameteri(R,e.TEXTURE_MAG_FILTER,Nt[y.magFilter]),e.texParameteri(R,e.TEXTURE_MIN_FILTER,Nt[y.minFilter]),y.compareFunction&&(e.texParameteri(R,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(R,e.TEXTURE_COMPARE_FUNC,he[y.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(y.magFilter===gn||y.minFilter!==wu&&y.minFilter!==nr||y.type===Ji&&t.has("OES_texture_float_linear")===!1)return;if(y.anisotropy>1||i.get(y).__currentAnisotropy){let H=t.get("EXT_texture_filter_anisotropic");e.texParameterf(R,H.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(y.anisotropy,s.getMaxAnisotropy())),i.get(y).__currentAnisotropy=y.anisotropy}}}function oe(R,y){let H=!1;R.__webglInit===void 0&&(R.__webglInit=!0,y.addEventListener("dispose",w));let X=y.source,j=p.get(X);j===void 0&&(j={},p.set(X,j));let rt=Z(y);if(rt!==R.__cacheKey){j[rt]===void 0&&(j[rt]={texture:e.createTexture(),usedTimes:0},r.memory.textures++,H=!0),j[rt].usedTimes++;let lt=j[R.__cacheKey];lt!==void 0&&(j[R.__cacheKey].usedTimes--,lt.usedTimes===0&&N(y)),R.__cacheKey=rt,R.__webglTexture=j[rt].texture}return H}function J(R,y,H){return Math.floor(Math.floor(R/H)/y)}function it(R,y,H,X){let rt=R.updateRanges;if(rt.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,y.width,y.height,H,X,y.data);else{rt.sort((At,ft)=>At.start-ft.start);let lt=0;for(let At=1;At<rt.length;At++){let ft=rt[lt],ut=rt[At],Mt=ft.start+ft.count,Dt=J(ut.start,y.width,4),Gt=J(ft.start,y.width,4);ut.start<=Mt+1&&Dt===Gt&&J(ut.start+ut.count-1,y.width,4)===Dt?ft.count=Math.max(ft.count,ut.start+ut.count-ft.start):(++lt,rt[lt]=ut)}rt.length=lt+1;let K=n.getParameter(e.UNPACK_ROW_LENGTH),tt=n.getParameter(e.UNPACK_SKIP_PIXELS),ct=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,y.width);for(let At=0,ft=rt.length;At<ft;At++){let ut=rt[At],Mt=Math.floor(ut.start/4),Dt=Math.ceil(ut.count/4),Gt=Mt%y.width,P=Math.floor(Mt/y.width),dt=Dt,Q=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,Gt),n.pixelStorei(e.UNPACK_SKIP_ROWS,P),n.texSubImage2D(e.TEXTURE_2D,0,Gt,P,dt,Q,H,X,y.data)}R.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,K),n.pixelStorei(e.UNPACK_SKIP_PIXELS,tt),n.pixelStorei(e.UNPACK_SKIP_ROWS,ct)}}function St(R,y,H){let X=e.TEXTURE_2D;(y.isDataArrayTexture||y.isCompressedArrayTexture)&&(X=e.TEXTURE_2D_ARRAY),y.isData3DTexture&&(X=e.TEXTURE_3D);let j=oe(R,y),rt=y.source;n.bindTexture(X,R.__webglTexture,e.TEXTURE0+H);let lt=i.get(rt);if(rt.version!==lt.__version||j===!0){if(n.activeTexture(e.TEXTURE0+H),(typeof ImageBitmap<"u"&&y.image instanceof ImageBitmap)===!1){let Q=se.getPrimaries(se.workingColorSpace),ht=y.colorSpace===na?null:se.getPrimaries(y.colorSpace),mt=y.colorSpace===na||Q===ht?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,mt)}n.pixelStorei(e.UNPACK_ALIGNMENT,y.unpackAlignment);let tt=g(y.image,!1,s.maxTextureSize);tt=Ye(y,tt);let ct=a.convert(y.format,y.colorSpace),At=a.convert(y.type),ft=x(y.internalFormat,ct,At,y.normalized,y.colorSpace,y.isVideoTexture);ne(X,y);let ut,Mt=y.mipmaps,Dt=y.isVideoTexture!==!0,Gt=lt.__version===void 0||j===!0,P=rt.dataReady,dt=E(y,tt);if(y.isDepthTexture)ft=T(y.format===ir,y.type),Gt&&(Dt?n.texStorage2D(e.TEXTURE_2D,1,ft,tt.width,tt.height):n.texImage2D(e.TEXTURE_2D,0,ft,tt.width,tt.height,0,ct,At,null));else if(y.isDataTexture)if(Mt.length>0){Dt&&Gt&&n.texStorage2D(e.TEXTURE_2D,dt,ft,Mt[0].width,Mt[0].height);for(let Q=0,ht=Mt.length;Q<ht;Q++)ut=Mt[Q],Dt?P&&n.texSubImage2D(e.TEXTURE_2D,Q,0,0,ut.width,ut.height,ct,At,ut.data):n.texImage2D(e.TEXTURE_2D,Q,ft,ut.width,ut.height,0,ct,At,ut.data);y.generateMipmaps=!1}else Dt?(Gt&&n.texStorage2D(e.TEXTURE_2D,dt,ft,tt.width,tt.height),P&&it(y,tt,ct,At)):n.texImage2D(e.TEXTURE_2D,0,ft,tt.width,tt.height,0,ct,At,tt.data);else if(y.isCompressedTexture)if(y.isCompressedArrayTexture){Dt&&Gt&&n.texStorage3D(e.TEXTURE_2D_ARRAY,dt,ft,Mt[0].width,Mt[0].height,tt.depth);for(let Q=0,ht=Mt.length;Q<ht;Q++)if(ut=Mt[Q],y.format!==Pi)if(ct!==null)if(Dt){if(P)if(y.layerUpdates.size>0){let mt=c_(ut.width,ut.height,y.format,y.type);for(let at of y.layerUpdates){let Ct=ut.data.subarray(at*mt/ut.data.BYTES_PER_ELEMENT,(at+1)*mt/ut.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,at,ut.width,ut.height,1,ct,Ct)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,0,ut.width,ut.height,tt.depth,ct,ut.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,Q,ft,ut.width,ut.height,tt.depth,0,ut.data,0,0);else It("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Dt?P&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,0,ut.width,ut.height,tt.depth,ct,At,ut.data):n.texImage3D(e.TEXTURE_2D_ARRAY,Q,ft,ut.width,ut.height,tt.depth,0,ct,At,ut.data);y.layerUpdates.size>0&&y.clearLayerUpdates()}else{Dt&&Gt&&n.texStorage2D(e.TEXTURE_2D,dt,ft,Mt[0].width,Mt[0].height);for(let Q=0,ht=Mt.length;Q<ht;Q++)ut=Mt[Q],y.format!==Pi?ct!==null?Dt?P&&n.compressedTexSubImage2D(e.TEXTURE_2D,Q,0,0,ut.width,ut.height,ct,ut.data):n.compressedTexImage2D(e.TEXTURE_2D,Q,ft,ut.width,ut.height,0,ut.data):It("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Dt?P&&n.texSubImage2D(e.TEXTURE_2D,Q,0,0,ut.width,ut.height,ct,At,ut.data):n.texImage2D(e.TEXTURE_2D,Q,ft,ut.width,ut.height,0,ct,At,ut.data)}else if(y.isDataArrayTexture)if(Dt){if(Gt&&n.texStorage3D(e.TEXTURE_2D_ARRAY,dt,ft,tt.width,tt.height,tt.depth),P)if(y.layerUpdates.size>0){let Q=c_(tt.width,tt.height,y.format,y.type);for(let ht of y.layerUpdates){let mt=tt.data.subarray(ht*Q/tt.data.BYTES_PER_ELEMENT,(ht+1)*Q/tt.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,ht,tt.width,tt.height,1,ct,At,mt)}y.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,tt.width,tt.height,tt.depth,ct,At,tt.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,ft,tt.width,tt.height,tt.depth,0,ct,At,tt.data);else if(y.isData3DTexture)Dt?(Gt&&n.texStorage3D(e.TEXTURE_3D,dt,ft,tt.width,tt.height,tt.depth),P&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,tt.width,tt.height,tt.depth,ct,At,tt.data)):n.texImage3D(e.TEXTURE_3D,0,ft,tt.width,tt.height,tt.depth,0,ct,At,tt.data);else if(y.isFramebufferTexture){if(Gt)if(Dt)n.texStorage2D(e.TEXTURE_2D,dt,ft,tt.width,tt.height);else{let Q=tt.width,ht=tt.height;for(let mt=0;mt<dt;mt++)n.texImage2D(e.TEXTURE_2D,mt,ft,Q,ht,0,ct,At,null),Q>>=1,ht>>=1}}else if(y.isHTMLTexture){if("texElementImage2D"in e){let Q=e.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),tt.parentNode!==Q){Q.appendChild(tt),f.add(y),Q.onpaint=ht=>{let mt=ht.changedElements;for(let at of f)mt.includes(at.image)&&(at.needsUpdate=!0)},Q.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,tt);else{let mt=e.RGBA,at=e.RGBA,Ct=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,mt,at,Ct,tt)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Mt.length>0){if(Dt&&Gt){let Q=Qt(Mt[0]);n.texStorage2D(e.TEXTURE_2D,dt,ft,Q.width,Q.height)}for(let Q=0,ht=Mt.length;Q<ht;Q++)ut=Mt[Q],Dt?P&&n.texSubImage2D(e.TEXTURE_2D,Q,0,0,ct,At,ut):n.texImage2D(e.TEXTURE_2D,Q,ft,ct,At,ut);y.generateMipmaps=!1}else if(Dt){if(Gt){let Q=Qt(tt);n.texStorage2D(e.TEXTURE_2D,dt,ft,Q.width,Q.height)}P&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,ct,At,tt)}else n.texImage2D(e.TEXTURE_2D,0,ft,ct,At,tt);d(y)&&v(X),lt.__version=rt.version,y.onUpdate&&y.onUpdate(y)}R.__version=y.version}function zt(R,y,H){if(y.image.length!==6)return;let X=oe(R,y),j=y.source;n.bindTexture(e.TEXTURE_CUBE_MAP,R.__webglTexture,e.TEXTURE0+H);let rt=i.get(j);if(j.version!==rt.__version||X===!0){n.activeTexture(e.TEXTURE0+H);let lt=se.getPrimaries(se.workingColorSpace),K=y.colorSpace===na?null:se.getPrimaries(y.colorSpace),tt=y.colorSpace===na||lt===K?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,y.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,y.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,y.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,tt);let ct=y.isCompressedTexture||y.image[0].isCompressedTexture,At=y.image[0]&&y.image[0].isDataTexture,ft=[];for(let at=0;at<6;at++)!ct&&!At?ft[at]=g(y.image[at],!0,s.maxCubemapSize):ft[at]=At?y.image[at].image:y.image[at],ft[at]=Ye(y,ft[at]);let ut=ft[0],Mt=a.convert(y.format,y.colorSpace),Dt=a.convert(y.type),Gt=x(y.internalFormat,Mt,Dt,y.normalized,y.colorSpace),P=y.isVideoTexture!==!0,dt=rt.__version===void 0||X===!0,Q=j.dataReady,ht=E(y,ut);ne(e.TEXTURE_CUBE_MAP,y);let mt;if(ct){P&&dt&&n.texStorage2D(e.TEXTURE_CUBE_MAP,ht,Gt,ut.width,ut.height);for(let at=0;at<6;at++){mt=ft[at].mipmaps;for(let Ct=0;Ct<mt.length;Ct++){let Et=mt[Ct];y.format!==Pi?Mt!==null?P?Q&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,Ct,0,0,Et.width,Et.height,Mt,Et.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,Ct,Gt,Et.width,Et.height,0,Et.data):It("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):P?Q&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,Ct,0,0,Et.width,Et.height,Mt,Dt,Et.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,Ct,Gt,Et.width,Et.height,0,Mt,Dt,Et.data)}}}else{if(mt=y.mipmaps,P&&dt){mt.length>0&&ht++;let at=Qt(ft[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,ht,Gt,at.width,at.height)}for(let at=0;at<6;at++)if(At){P?Q&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,ft[at].width,ft[at].height,Mt,Dt,ft[at].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,Gt,ft[at].width,ft[at].height,0,Mt,Dt,ft[at].data);for(let Ct=0;Ct<mt.length;Ct++){let me=mt[Ct].image[at].image;P?Q&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,Ct+1,0,0,me.width,me.height,Mt,Dt,me.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,Ct+1,Gt,me.width,me.height,0,Mt,Dt,me.data)}}else{P?Q&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,0,0,Mt,Dt,ft[at]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,0,Gt,Mt,Dt,ft[at]);for(let Ct=0;Ct<mt.length;Ct++){let Et=mt[Ct];P?Q&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,Ct+1,0,0,Mt,Dt,Et.image[at]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+at,Ct+1,Gt,Mt,Dt,Et.image[at])}}}d(y)&&v(e.TEXTURE_CUBE_MAP),rt.__version=j.version,y.onUpdate&&y.onUpdate(y)}R.__version=y.version}function yt(R,y,H,X,j,rt){let lt=a.convert(H.format,H.colorSpace),K=a.convert(H.type),tt=x(H.internalFormat,lt,K,H.normalized,H.colorSpace),ct=i.get(y),At=i.get(H);if(At.__renderTarget=y,!ct.__hasExternalTextures){let ft=Math.max(1,y.width>>rt),ut=Math.max(1,y.height>>rt);j===e.TEXTURE_3D||j===e.TEXTURE_2D_ARRAY?n.texImage3D(j,rt,tt,ft,ut,y.depth,0,lt,K,null):n.texImage2D(j,rt,tt,ft,ut,0,lt,K,null)}n.bindFramebuffer(e.FRAMEBUFFER,R),re(y)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,X,j,At.__webglTexture,0,Ae(y)):(j===e.TEXTURE_2D||j>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,X,j,At.__webglTexture,rt),n.bindFramebuffer(e.FRAMEBUFFER,null)}function Ft(R,y,H){if(e.bindRenderbuffer(e.RENDERBUFFER,R),y.depthBuffer){let X=y.depthTexture,j=X&&X.isDepthTexture?X.type:null,rt=T(y.stencilBuffer,j),lt=y.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;re(y)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Ae(y),rt,y.width,y.height):H?e.renderbufferStorageMultisample(e.RENDERBUFFER,Ae(y),rt,y.width,y.height):e.renderbufferStorage(e.RENDERBUFFER,rt,y.width,y.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,lt,e.RENDERBUFFER,R)}else{let X=y.textures;for(let j=0;j<X.length;j++){let rt=X[j],lt=a.convert(rt.format,rt.colorSpace),K=a.convert(rt.type),tt=x(rt.internalFormat,lt,K,rt.normalized,rt.colorSpace);re(y)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Ae(y),tt,y.width,y.height):H?e.renderbufferStorageMultisample(e.RENDERBUFFER,Ae(y),tt,y.width,y.height):e.renderbufferStorage(e.RENDERBUFFER,tt,y.width,y.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function We(R,y,H){let X=y.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,R),!(y.depthTexture&&y.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let j=i.get(y.depthTexture);if(j.__renderTarget=y,(!j.__webglTexture||y.depthTexture.image.width!==y.width||y.depthTexture.image.height!==y.height)&&(y.depthTexture.image.width=y.width,y.depthTexture.image.height=y.height,y.depthTexture.needsUpdate=!0),X){if(j.__webglInit===void 0&&(j.__webglInit=!0,y.depthTexture.addEventListener("dispose",w)),j.__webglTexture===void 0){j.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,j.__webglTexture),ne(e.TEXTURE_CUBE_MAP,y.depthTexture);let ct=a.convert(y.depthTexture.format),At=a.convert(y.depthTexture.type),ft;y.depthTexture.format===ys?ft=e.DEPTH_COMPONENT24:y.depthTexture.format===ir&&(ft=e.DEPTH24_STENCIL8);for(let ut=0;ut<6;ut++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+ut,0,ft,y.width,y.height,0,ct,At,null)}}else nt(y.depthTexture,0);let rt=j.__webglTexture,lt=Ae(y),K=X?e.TEXTURE_CUBE_MAP_POSITIVE_X+H:e.TEXTURE_2D,tt=y.depthTexture.format===ir?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(y.depthTexture.format===ys)re(y)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,tt,K,rt,0,lt):e.framebufferTexture2D(e.FRAMEBUFFER,tt,K,rt,0);else if(y.depthTexture.format===ir)re(y)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,tt,K,rt,0,lt):e.framebufferTexture2D(e.FRAMEBUFFER,tt,K,rt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Wt(R){let y=i.get(R),H=R.isWebGLCubeRenderTarget===!0;if(y.__boundDepthTexture!==R.depthTexture){let X=R.depthTexture;if(y.__depthDisposeCallback&&y.__depthDisposeCallback(),X){let j=()=>{delete y.__boundDepthTexture,delete y.__depthDisposeCallback,X.removeEventListener("dispose",j)};X.addEventListener("dispose",j),y.__depthDisposeCallback=j}y.__boundDepthTexture=X}if(R.depthTexture&&!y.__autoAllocateDepthBuffer)if(H)for(let X=0;X<6;X++)We(y.__webglFramebuffer[X],R,X);else{let X=R.texture.mipmaps;X&&X.length>0?We(y.__webglFramebuffer[0],R,0):We(y.__webglFramebuffer,R,0)}else if(H){y.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(n.bindFramebuffer(e.FRAMEBUFFER,y.__webglFramebuffer[X]),y.__webglDepthbuffer[X]===void 0)y.__webglDepthbuffer[X]=e.createRenderbuffer(),Ft(y.__webglDepthbuffer[X],R,!1);else{let j=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,rt=y.__webglDepthbuffer[X];e.bindRenderbuffer(e.RENDERBUFFER,rt),e.framebufferRenderbuffer(e.FRAMEBUFFER,j,e.RENDERBUFFER,rt)}}else{let X=R.texture.mipmaps;if(X&&X.length>0?n.bindFramebuffer(e.FRAMEBUFFER,y.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,y.__webglFramebuffer),y.__webglDepthbuffer===void 0)y.__webglDepthbuffer=e.createRenderbuffer(),Ft(y.__webglDepthbuffer,R,!1);else{let j=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,rt=y.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,rt),e.framebufferRenderbuffer(e.FRAMEBUFFER,j,e.RENDERBUFFER,rt)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function ae(R,y,H){let X=i.get(R);y!==void 0&&yt(X.__webglFramebuffer,R,R.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),H!==void 0&&Wt(R)}function pe(R){let y=R.texture,H=i.get(R),X=i.get(y);R.addEventListener("dispose",_);let j=R.textures,rt=R.isWebGLCubeRenderTarget===!0,lt=j.length>1;if(lt||(X.__webglTexture===void 0&&(X.__webglTexture=e.createTexture()),X.__version=y.version,r.memory.textures++),rt){H.__webglFramebuffer=[];for(let K=0;K<6;K++)if(y.mipmaps&&y.mipmaps.length>0){H.__webglFramebuffer[K]=[];for(let tt=0;tt<y.mipmaps.length;tt++)H.__webglFramebuffer[K][tt]=e.createFramebuffer()}else H.__webglFramebuffer[K]=e.createFramebuffer()}else{if(y.mipmaps&&y.mipmaps.length>0){H.__webglFramebuffer=[];for(let K=0;K<y.mipmaps.length;K++)H.__webglFramebuffer[K]=e.createFramebuffer()}else H.__webglFramebuffer=e.createFramebuffer();if(lt)for(let K=0,tt=j.length;K<tt;K++){let ct=i.get(j[K]);ct.__webglTexture===void 0&&(ct.__webglTexture=e.createTexture(),r.memory.textures++)}if(R.samples>0&&re(R)===!1){H.__webglMultisampledFramebuffer=e.createFramebuffer(),H.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,H.__webglMultisampledFramebuffer);for(let K=0;K<j.length;K++){let tt=j[K];H.__webglColorRenderbuffer[K]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,H.__webglColorRenderbuffer[K]);let ct=a.convert(tt.format,tt.colorSpace),At=a.convert(tt.type),ft=x(tt.internalFormat,ct,At,tt.normalized,tt.colorSpace,R.isXRRenderTarget===!0),ut=Ae(R);e.renderbufferStorageMultisample(e.RENDERBUFFER,ut,ft,R.width,R.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+K,e.RENDERBUFFER,H.__webglColorRenderbuffer[K])}e.bindRenderbuffer(e.RENDERBUFFER,null),R.depthBuffer&&(H.__webglDepthRenderbuffer=e.createRenderbuffer(),Ft(H.__webglDepthRenderbuffer,R,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(rt){n.bindTexture(e.TEXTURE_CUBE_MAP,X.__webglTexture),ne(e.TEXTURE_CUBE_MAP,y);for(let K=0;K<6;K++)if(y.mipmaps&&y.mipmaps.length>0)for(let tt=0;tt<y.mipmaps.length;tt++)yt(H.__webglFramebuffer[K][tt],R,y,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+K,tt);else yt(H.__webglFramebuffer[K],R,y,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+K,0);d(y)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(lt){for(let K=0,tt=j.length;K<tt;K++){let ct=j[K],At=i.get(ct),ft=e.TEXTURE_2D;(R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(ft=R.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(ft,At.__webglTexture),ne(ft,ct),yt(H.__webglFramebuffer,R,ct,e.COLOR_ATTACHMENT0+K,ft,0),d(ct)&&v(ft)}n.unbindTexture()}else{let K=e.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(K=R.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(K,X.__webglTexture),ne(K,y),y.mipmaps&&y.mipmaps.length>0)for(let tt=0;tt<y.mipmaps.length;tt++)yt(H.__webglFramebuffer[tt],R,y,e.COLOR_ATTACHMENT0,K,tt);else yt(H.__webglFramebuffer,R,y,e.COLOR_ATTACHMENT0,K,0);d(y)&&v(K),n.unbindTexture()}R.depthBuffer&&Wt(R)}function qt(R){let y=R.textures;for(let H=0,X=y.length;H<X;H++){let j=y[H];if(d(j)){let rt=b(R),lt=i.get(j).__webglTexture;n.bindTexture(rt,lt),v(rt),n.unbindTexture()}}}let Ee=[],qe=[];function Ve(R){if(R.samples>0){if(re(R)===!1){let y=R.textures,H=R.width,X=R.height,j=e.COLOR_BUFFER_BIT,rt=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,lt=i.get(R),K=y.length>1;if(K)for(let ct=0;ct<y.length;ct++)n.bindFramebuffer(e.FRAMEBUFFER,lt.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ct,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,lt.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ct,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,lt.__webglMultisampledFramebuffer);let tt=R.texture.mipmaps;tt&&tt.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,lt.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,lt.__webglFramebuffer);for(let ct=0;ct<y.length;ct++){if(R.resolveDepthBuffer&&(R.depthBuffer&&(j|=e.DEPTH_BUFFER_BIT),R.stencilBuffer&&R.resolveStencilBuffer&&(j|=e.STENCIL_BUFFER_BIT)),K){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,lt.__webglColorRenderbuffer[ct]);let At=i.get(y[ct]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,At,0)}e.blitFramebuffer(0,0,H,X,0,0,H,X,j,e.NEAREST),l===!0&&(Ee.length=0,qe.length=0,Ee.push(e.COLOR_ATTACHMENT0+ct),R.depthBuffer&&R.storeMultisampledDepthBuffer===!1&&(Ee.push(rt),qe.push(rt),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,qe)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Ee))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),K)for(let ct=0;ct<y.length;ct++){n.bindFramebuffer(e.FRAMEBUFFER,lt.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ct,e.RENDERBUFFER,lt.__webglColorRenderbuffer[ct]);let At=i.get(y[ct]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,lt.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ct,e.TEXTURE_2D,At,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,lt.__webglMultisampledFramebuffer)}else if(R.depthBuffer&&R.storeMultisampledDepthBuffer===!1&&l){let y=R.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[y])}}}function Ae(R){return Math.min(s.maxSamples,R.samples)}function re(R){let y=i.get(R);return R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&y.__useRenderToTexture!==!1}function B(R){let y=r.render.frame;h.get(R)!==y&&(h.set(R,y),R.update())}function Ye(R,y){let H=R.colorSpace,X=R.format,j=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||H!==$c&&H!==na&&(se.getTransfer(H)===_e?(X!==Pi||j!==bi)&&It("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Pt("WebGLTextures: Unsupported texture color space:",H)),y}function Qt(R){return typeof HTMLImageElement<"u"&&R instanceof HTMLImageElement?(c.width=R.naturalWidth||R.width,c.height=R.naturalHeight||R.height):typeof VideoFrame<"u"&&R instanceof VideoFrame?(c.width=R.displayWidth,c.height=R.displayHeight):(c.width=R.width,c.height=R.height),c}this.allocateTextureUnit=q,this.resetTextureUnits=O,this.getTextureUnits=D,this.setTextureUnits=G,this.setTexture2D=nt,this.setTexture2DArray=Y,this.setTexture3D=$,this.setTextureCube=st,this.rebindTextures=ae,this.setupRenderTarget=pe,this.updateRenderTargetMipmap=qt,this.updateMultisampleRenderTarget=Ve,this.setupDepthRenderbuffer=Wt,this.setupFrameBufferTexture=yt,this.useMultisampledRTT=re,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function uU(e,t){function n(i,s=na){let a,r=se.getTransfer(s);if(i===bi)return e.UNSIGNED_BYTE;if(i===Jf)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Qf)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Jv)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===Qv)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===jv)return e.BYTE;if(i===Kv)return e.SHORT;if(i===Cl)return e.UNSIGNED_SHORT;if(i===Kf)return e.INT;if(i===Ki)return e.UNSIGNED_INT;if(i===Ji)return e.FLOAT;if(i===Qi)return e.HALF_FLOAT;if(i===$v)return e.ALPHA;if(i===t_)return e.RGB;if(i===Pi)return e.RGBA;if(i===ys)return e.DEPTH_COMPONENT;if(i===ir)return e.DEPTH_STENCIL;if(i===e_)return e.RED;if(i===$f)return e.RED_INTEGER;if(i===sr)return e.RG;if(i===tp)return e.RG_INTEGER;if(i===ep)return e.RGBA_INTEGER;if(i===Au||i===Cu||i===Ru||i===Nu)if(r===_e)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===Au)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Cu)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ru)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Nu)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===Au)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Cu)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ru)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Nu)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===np||i===ip||i===sp||i===ap)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===np)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ip)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===sp)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===ap)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===rp||i===op||i===lp||i===cp||i===up||i===Du||i===hp)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(i===rp||i===op)return r===_e?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===lp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===cp)return a.COMPRESSED_R11_EAC;if(i===up)return a.COMPRESSED_SIGNED_R11_EAC;if(i===Du)return a.COMPRESSED_RG11_EAC;if(i===hp)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===dp||i===fp||i===pp||i===mp||i===gp||i===vp||i===_p||i===yp||i===xp||i===Sp||i===bp||i===Mp||i===Ep||i===Tp)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(i===dp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===fp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===pp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===mp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===gp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===vp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===_p)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===yp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===xp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Sp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===bp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Mp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ep)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Tp)return r===_e?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===wp||i===Ap||i===Cp)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(i===wp)return r===_e?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Ap)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Cp)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Rp||i===Np||i===Lu||i===Dp)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(i===Rp)return a.COMPRESSED_RED_RGTC1_EXT;if(i===Np)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Lu)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Dp)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Rl?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:n}}var hU=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,dU=`
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

}`,M_=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,n){if(this.texture===null){let i=new pu(t.texture);(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){let n=t.cameras[0].viewport,i=new xi({vertexShader:hU,fragmentShader:dU,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new Yn(new gu(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},E_=class extends Zi{constructor(t,n){super();let i=this,s=null,a=1,r=null,o="local-floor",l=1,c=null,h=null,f=null,u=null,p=null,m=null,S=typeof XRWebGLBinding<"u",g=new M_,d={},v=n.getContextAttributes(),b=null,x=null,T=[],E=[],w=new Ut,_=null,A=null,N=new Un;N.viewport=new Xe;let C=new Un;C.viewport=new Xe;let U=[N,C],O=new qf,D=null,G=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let it=T[J];return it===void 0&&(it=new Sl,T[J]=it),it.getTargetRaySpace()},this.getControllerGrip=function(J){let it=T[J];return it===void 0&&(it=new Sl,T[J]=it),it.getGripSpace()},this.getHand=function(J){let it=T[J];return it===void 0&&(it=new Sl,T[J]=it),it.getHandSpace()};function q(J){let it=E.indexOf(J.inputSource);if(it===-1)return;let St=T[it];St!==void 0&&(St.update(J.inputSource,J.frame,c||r),St.dispatchEvent({type:J.type,data:J.inputSource}))}function Z(){s.removeEventListener("select",q),s.removeEventListener("selectstart",q),s.removeEventListener("selectend",q),s.removeEventListener("squeeze",q),s.removeEventListener("squeezestart",q),s.removeEventListener("squeezeend",q),s.removeEventListener("end",Z),s.removeEventListener("inputsourceschange",nt);for(let J=0;J<T.length;J++){let it=E[J];it!==null&&(E[J]=null,T[J].disconnect(it))}D=null,G=null,g.reset();for(let J in d)delete d[J];if(t.setRenderTarget(b),p=null,u=null,f=null,s=null,x=null,oe.stop(),i.isPresenting=!1,t.setPixelRatio(_),t.setSize(w.width,w.height,!1),A!==null){let J=A.camera;J.fov=A.fov,J.zoom=A.zoom,J.updateProjectionMatrix(),A=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){a=J,i.isPresenting===!0&&It("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){o=J,i.isPresenting===!0&&It("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(J){c=J},this.getBaseLayer=function(){return u!==null?u:p},this.getBinding=function(){return f===null&&S&&(f=new XRWebGLBinding(s,n)),f},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(J){if(s=J,s!==null){if(b=t.getRenderTarget(),s.addEventListener("select",q),s.addEventListener("selectstart",q),s.addEventListener("selectend",q),s.addEventListener("squeeze",q),s.addEventListener("squeezestart",q),s.addEventListener("squeezeend",q),s.addEventListener("end",Z),s.addEventListener("inputsourceschange",nt),v.xrCompatible!==!0&&await n.makeXRCompatible(),_=t.getPixelRatio(),t.getSize(w),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let St=null,zt=null,yt=null;v.depth&&(yt=v.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,St=v.stencil?ir:ys,zt=v.stencil?Rl:Ki);let Ft={colorFormat:n.RGBA8,depthFormat:yt,scaleFactor:a};f=this.getBinding(),u=f.createProjectionLayer(Ft),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),x=new ni(u.textureWidth,u.textureHeight,{format:Pi,type:bi,depthTexture:new Ya(u.textureWidth,u.textureHeight,zt,void 0,void 0,void 0,void 0,void 0,void 0,St),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let St={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:a};p=new XRWebGLLayer(s,n,St),s.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),x=new ni(p.framebufferWidth,p.framebufferHeight,{format:Pi,type:bi,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(l),c=null,r=await s.requestReferenceSpace(o),oe.setContext(s),oe.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function nt(J){for(let it=0;it<J.removed.length;it++){let St=J.removed[it],zt=E.indexOf(St);zt>=0&&(E[zt]=null,T[zt].disconnect(St))}for(let it=0;it<J.added.length;it++){let St=J.added[it],zt=E.indexOf(St);if(zt===-1){for(let Ft=0;Ft<T.length;Ft++)if(Ft>=E.length){E.push(St),zt=Ft;break}else if(E[Ft]===null){E[Ft]=St,zt=Ft;break}if(zt===-1)break}let yt=T[zt];yt&&yt.connect(St)}}let Y=new z,$=new z;function st(J,it,St){Y.setFromMatrixPosition(it.matrixWorld),$.setFromMatrixPosition(St.matrixWorld);let zt=Y.distanceTo($),yt=it.projectionMatrix.elements,Ft=St.projectionMatrix.elements,We=yt[14]/(yt[10]-1),Wt=yt[14]/(yt[10]+1),ae=(yt[9]+1)/yt[5],pe=(yt[9]-1)/yt[5],qt=(yt[8]-1)/yt[0],Ee=(Ft[8]+1)/Ft[0],qe=We*qt,Ve=We*Ee,Ae=zt/(-qt+Ee),re=Ae*-qt;if(it.matrixWorld.decompose(J.position,J.quaternion,J.scale),J.translateX(re),J.translateZ(Ae),J.matrixWorld.compose(J.position,J.quaternion,J.scale),J.matrixWorldInverse.copy(J.matrixWorld).invert(),yt[10]===-1)J.projectionMatrix.copy(it.projectionMatrix),J.projectionMatrixInverse.copy(it.projectionMatrixInverse);else{let B=We+Ae,Ye=Wt+Ae,Qt=qe-re,R=Ve+(zt-re),y=ae*Wt/Ye*B,H=pe*Wt/Ye*B;J.projectionMatrix.makePerspective(Qt,R,y,H,B,Ye),J.projectionMatrixInverse.copy(J.projectionMatrix).invert()}}function Lt(J,it){it===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(it.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(s===null)return;let it=J.near,St=J.far;g.texture!==null&&(g.depthNear>0&&(it=g.depthNear),g.depthFar>0&&(St=g.depthFar)),O.near=C.near=N.near=it,O.far=C.far=N.far=St,(D!==O.near||G!==O.far)&&(s.updateRenderState({depthNear:O.near,depthFar:O.far}),D=O.near,G=O.far),O.layers.mask=J.layers.mask|6,N.layers.mask=O.layers.mask&-5,C.layers.mask=O.layers.mask&-3;let zt=J.parent,yt=O.cameras;Lt(O,zt);for(let Ft=0;Ft<yt.length;Ft++)Lt(yt[Ft],zt);yt.length===2?st(O,N,C):O.projectionMatrix.copy(N.projectionMatrix),A===null&&J.isPerspectiveCamera&&(A={camera:J,fov:J.fov,zoom:J.zoom}),Nt(J,O,zt)};function Nt(J,it,St){St===null?J.matrix.copy(it.matrixWorld):(J.matrix.copy(St.matrixWorld),J.matrix.invert(),J.matrix.multiply(it.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(it.projectionMatrix),J.projectionMatrixInverse.copy(it.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=_l*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return O},this.getFoveation=function(){if(!(u===null&&p===null))return l},this.setFoveation=function(J){l=J,u!==null&&(u.fixedFoveation=J),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=J)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(O)},this.getCameraTexture=function(J){return d[J]};let he=null;function ne(J,it){if(h=it.getViewerPose(c||r),m=it,h!==null){let St=h.views;p!==null&&(t.setRenderTargetFramebuffer(x,p.framebuffer),t.setRenderTarget(x));let zt=!1;St.length!==O.cameras.length&&(O.cameras.length=0,zt=!0);for(let Wt=0;Wt<St.length;Wt++){let ae=St[Wt],pe=null;if(p!==null)pe=p.getViewport(ae);else{let Ee=f.getViewSubImage(u,ae);pe=Ee.viewport,Wt===0&&(t.setRenderTargetTextures(x,Ee.colorTexture,Ee.depthStencilTexture),t.setRenderTarget(x))}let qt=U[Wt];qt===void 0&&(qt=new Un,qt.layers.enable(Wt),qt.viewport=new Xe,U[Wt]=qt),qt.matrix.fromArray(ae.transform.matrix),qt.matrix.decompose(qt.position,qt.quaternion,qt.scale),qt.projectionMatrix.fromArray(ae.projectionMatrix),qt.projectionMatrixInverse.copy(qt.projectionMatrix).invert(),qt.viewport.set(pe.x,pe.y,pe.width,pe.height),Wt===0&&(O.matrix.copy(qt.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale)),zt===!0&&O.cameras.push(qt)}let yt=s.enabledFeatures;if(yt&&yt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&S){f=i.getBinding();let Wt=f.getDepthInformation(St[0]);Wt&&Wt.isValid&&Wt.texture&&g.init(Wt,s.renderState)}if(yt&&yt.includes("camera-access")&&S){t.state.unbindTexture(),f=i.getBinding();for(let Wt=0;Wt<St.length;Wt++){let ae=St[Wt].camera;if(ae){let pe=d[ae];pe||(pe=new pu,d[ae]=pe);let qt=f.getCameraImage(ae);pe.sourceTexture=qt}}}}for(let St=0;St<T.length;St++){let zt=E[St],yt=T[St];zt!==null&&yt!==void 0&&yt.update(zt,it,c||r)}he&&he(J,it),it.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:it}),m=null}let oe=new eT;oe.setAnimationLoop(ne),this.setAnimationLoop=function(J){he=J},this.dispose=function(){}}},fU=new Be,oT=new Vt;oT.set(-1,0,0,0,1,0,0,0,1);function pU(e,t){function n(g,d){g.matrixAutoUpdate===!0&&g.updateMatrix(),d.value.copy(g.matrix)}function i(g,d){d.color.getRGB(g.fogColor.value,r_(e)),d.isFog?(g.fogNear.value=d.near,g.fogFar.value=d.far):d.isFogExp2&&(g.fogDensity.value=d.density)}function s(g,d,v,b,x){d.isNodeMaterial?d.uniformsNeedUpdate=!1:d.isMeshBasicMaterial?a(g,d):d.isMeshLambertMaterial?(a(g,d),d.envMap&&(g.envMapIntensity.value=d.envMapIntensity)):d.isMeshToonMaterial?(a(g,d),f(g,d)):d.isMeshPhongMaterial?(a(g,d),h(g,d),d.envMap&&(g.envMapIntensity.value=d.envMapIntensity)):d.isMeshStandardMaterial?(a(g,d),u(g,d),d.isMeshPhysicalMaterial&&p(g,d,x)):d.isMeshMatcapMaterial?(a(g,d),m(g,d)):d.isMeshDepthMaterial?a(g,d):d.isMeshDistanceMaterial?(a(g,d),S(g,d)):d.isMeshNormalMaterial?a(g,d):d.isLineBasicMaterial?(r(g,d),d.isLineDashedMaterial&&o(g,d)):d.isPointsMaterial?l(g,d,v,b):d.isSpriteMaterial?c(g,d):d.isShadowMaterial?(g.color.value.copy(d.color),g.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function a(g,d){g.opacity.value=d.opacity,d.color&&g.diffuse.value.copy(d.color),d.emissive&&g.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(g.map.value=d.map,n(d.map,g.mapTransform)),d.alphaMap&&(g.alphaMap.value=d.alphaMap,n(d.alphaMap,g.alphaMapTransform)),d.bumpMap&&(g.bumpMap.value=d.bumpMap,n(d.bumpMap,g.bumpMapTransform),g.bumpScale.value=d.bumpScale,d.side===Zn&&(g.bumpScale.value*=-1)),d.normalMap&&(g.normalMap.value=d.normalMap,n(d.normalMap,g.normalMapTransform),g.normalScale.value.copy(d.normalScale),d.side===Zn&&g.normalScale.value.negate()),d.displacementMap&&(g.displacementMap.value=d.displacementMap,n(d.displacementMap,g.displacementMapTransform),g.displacementScale.value=d.displacementScale,g.displacementBias.value=d.displacementBias),d.emissiveMap&&(g.emissiveMap.value=d.emissiveMap,n(d.emissiveMap,g.emissiveMapTransform)),d.specularMap&&(g.specularMap.value=d.specularMap,n(d.specularMap,g.specularMapTransform)),d.alphaTest>0&&(g.alphaTest.value=d.alphaTest);let v=t.get(d),b=v.envMap,x=v.envMapRotation;b&&(g.envMap.value=b,g.envMapRotation.value.setFromMatrix4(fU.makeRotationFromEuler(x)).transpose(),b.isCubeTexture&&b.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(oT),g.reflectivity.value=d.reflectivity,g.ior.value=d.ior,g.refractionRatio.value=d.refractionRatio),d.lightMap&&(g.lightMap.value=d.lightMap,g.lightMapIntensity.value=d.lightMapIntensity,n(d.lightMap,g.lightMapTransform)),d.aoMap&&(g.aoMap.value=d.aoMap,g.aoMapIntensity.value=d.aoMapIntensity,n(d.aoMap,g.aoMapTransform))}function r(g,d){g.diffuse.value.copy(d.color),g.opacity.value=d.opacity,d.map&&(g.map.value=d.map,n(d.map,g.mapTransform))}function o(g,d){g.dashSize.value=d.dashSize,g.totalSize.value=d.dashSize+d.gapSize,g.scale.value=d.scale}function l(g,d,v,b){g.diffuse.value.copy(d.color),g.opacity.value=d.opacity,g.size.value=d.size*v,g.scale.value=b*.5,d.map&&(g.map.value=d.map,n(d.map,g.uvTransform)),d.alphaMap&&(g.alphaMap.value=d.alphaMap,n(d.alphaMap,g.alphaMapTransform)),d.alphaTest>0&&(g.alphaTest.value=d.alphaTest)}function c(g,d){g.diffuse.value.copy(d.color),g.opacity.value=d.opacity,g.rotation.value=d.rotation,d.map&&(g.map.value=d.map,n(d.map,g.mapTransform)),d.alphaMap&&(g.alphaMap.value=d.alphaMap,n(d.alphaMap,g.alphaMapTransform)),d.alphaTest>0&&(g.alphaTest.value=d.alphaTest)}function h(g,d){g.specular.value.copy(d.specular),g.shininess.value=Math.max(d.shininess,1e-4)}function f(g,d){d.gradientMap&&(g.gradientMap.value=d.gradientMap)}function u(g,d){g.metalness.value=d.metalness,d.metalnessMap&&(g.metalnessMap.value=d.metalnessMap,n(d.metalnessMap,g.metalnessMapTransform)),g.roughness.value=d.roughness,d.roughnessMap&&(g.roughnessMap.value=d.roughnessMap,n(d.roughnessMap,g.roughnessMapTransform)),d.envMap&&(g.envMapIntensity.value=d.envMapIntensity)}function p(g,d,v){g.ior.value=d.ior,d.sheen>0&&(g.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),g.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(g.sheenColorMap.value=d.sheenColorMap,n(d.sheenColorMap,g.sheenColorMapTransform)),d.sheenRoughnessMap&&(g.sheenRoughnessMap.value=d.sheenRoughnessMap,n(d.sheenRoughnessMap,g.sheenRoughnessMapTransform))),d.clearcoat>0&&(g.clearcoat.value=d.clearcoat,g.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(g.clearcoatMap.value=d.clearcoatMap,n(d.clearcoatMap,g.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,n(d.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(g.clearcoatNormalMap.value=d.clearcoatNormalMap,n(d.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Zn&&g.clearcoatNormalScale.value.negate())),d.dispersion>0&&(g.dispersion.value=d.dispersion),d.retroreflectivity>0&&(g.retroreflectivity.value=d.retroreflectivity),d.iridescence>0&&(g.iridescence.value=d.iridescence,g.iridescenceIOR.value=d.iridescenceIOR,g.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(g.iridescenceMap.value=d.iridescenceMap,n(d.iridescenceMap,g.iridescenceMapTransform)),d.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=d.iridescenceThicknessMap,n(d.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),d.transmission>0&&(g.transmission.value=d.transmission,g.transmissionSamplerMap.value=v.texture,g.transmissionSamplerSize.value.set(v.width,v.height),d.transmissionMap&&(g.transmissionMap.value=d.transmissionMap,n(d.transmissionMap,g.transmissionMapTransform)),g.thickness.value=d.thickness,d.thicknessMap&&(g.thicknessMap.value=d.thicknessMap,n(d.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=d.attenuationDistance,g.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(g.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(g.anisotropyMap.value=d.anisotropyMap,n(d.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=d.specularIntensity,g.specularColor.value.copy(d.specularColor),d.specularColorMap&&(g.specularColorMap.value=d.specularColorMap,n(d.specularColorMap,g.specularColorMapTransform)),d.specularIntensityMap&&(g.specularIntensityMap.value=d.specularIntensityMap,n(d.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,d){d.matcap&&(g.matcap.value=d.matcap)}function S(g,d){let v=t.get(d).light;g.referencePosition.value.setFromMatrixPosition(v.matrixWorld),g.nearDistance.value=v.shadow.camera.near,g.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function mU(e,t,n,i){let s={},a={},r=[],o=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function l(x,T){let E=T.program;i.uniformBlockBinding(x,E)}function c(x,T){let E=s[x.id];E===void 0&&(g(x),E=h(x),s[x.id]=E,x.addEventListener("dispose",v));let w=T.program;i.updateUBOMapping(x,w);let _=t.render.frame;a[x.id]!==_&&(u(x),a[x.id]=_)}function h(x){let T=f();x.__bindingPointIndex=T;let E=e.createBuffer(),w=x.__size,_=x.usage;return e.bindBuffer(e.UNIFORM_BUFFER,E),e.bufferData(e.UNIFORM_BUFFER,w,_),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,T,E),E}function f(){for(let x=0;x<o;x++)if(r.indexOf(x)===-1)return r.push(x),x;return Pt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(x){let T=s[x.id],E=x.uniforms,w=x.__cache;e.bindBuffer(e.UNIFORM_BUFFER,T);for(let _=0,A=E.length;_<A;_++){let N=E[_];if(Array.isArray(N))for(let C=0,U=N.length;C<U;C++)p(N[C],_,C,w);else p(N,_,0,w)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(x,T,E,w){if(S(x,T,E,w)===!0){let _=x.__offset,A=x.value;if(Array.isArray(A)){let N=0;for(let C=0;C<A.length;C++){let U=A[C],O=d(U);m(U,x.__data,N),typeof U!="number"&&typeof U!="boolean"&&!U.isMatrix3&&!ArrayBuffer.isView(U)&&(N+=O.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(A,x.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,_,x.__data)}}function m(x,T,E){typeof x=="number"||typeof x=="boolean"?T[0]=x:x.isMatrix3?(T[0]=x.elements[0],T[1]=x.elements[1],T[2]=x.elements[2],T[3]=0,T[4]=x.elements[3],T[5]=x.elements[4],T[6]=x.elements[5],T[7]=0,T[8]=x.elements[6],T[9]=x.elements[7],T[10]=x.elements[8],T[11]=0):ArrayBuffer.isView(x)?T.set(new x.constructor(x.buffer,x.byteOffset,T.length)):x.toArray(T,E)}function S(x,T,E,w){let _=x.value,A=T+"_"+E;if(w[A]===void 0)return typeof _=="number"||typeof _=="boolean"?w[A]=_:ArrayBuffer.isView(_)?w[A]=_.slice():w[A]=_.clone(),!0;{let N=w[A];if(typeof _=="number"||typeof _=="boolean"){if(N!==_)return w[A]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(N.equals(_)===!1)return N.copy(_),!0}}return!1}function g(x){let T=x.uniforms,E=0,w=16;for(let A=0,N=T.length;A<N;A++){let C=Array.isArray(T[A])?T[A]:[T[A]];for(let U=0,O=C.length;U<O;U++){let D=C[U],G=Array.isArray(D.value)?D.value:[D.value];for(let q=0,Z=G.length;q<Z;q++){let nt=G[q],Y=d(nt),$=E%w,st=$%Y.boundary,Lt=$+st;E+=st,Lt!==0&&w-Lt<Y.storage&&(E+=w-Lt),D.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),D.__offset=E,E+=Y.storage}}}let _=E%w;return _>0&&(E+=w-_),x.__size=E,x.__cache={},this}function d(x){let T={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(T.boundary=4,T.storage=4):x.isVector2?(T.boundary=8,T.storage=8):x.isVector3||x.isColor?(T.boundary=16,T.storage=12):x.isVector4?(T.boundary=16,T.storage=16):x.isMatrix3?(T.boundary=48,T.storage=48):x.isMatrix4?(T.boundary=64,T.storage=64):x.isTexture?It("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(T.boundary=16,T.storage=x.byteLength):It("WebGLRenderer: Unsupported uniform value type.",x),T}function v(x){let T=x.target;T.removeEventListener("dispose",v);let E=r.indexOf(T.__bindingPointIndex);r.splice(E,1),e.deleteBuffer(s[T.id]),delete s[T.id],delete a[T.id]}function b(){for(let x in s)e.deleteBuffer(s[x]);r=[],s={},a={}}return{bind:l,update:c,dispose:b}}var gU=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),ws=null;function vU(){return ws===null&&(ws=new Af(gU,16,16,sr,Qi),ws.name="DFG_LUT",ws.minFilter=wn,ws.magFilter=wn,ws.wrapS=_s,ws.wrapT=_s,ws.generateMipmaps=!1,ws.needsUpdate=!0),ws}var zp=class{constructor(t={}){let{canvas:n=TE(),context:i=null,depth:s=!0,stencil:a=!1,alpha:r=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:u=!1,outputBufferType:p=bi}=t;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=r;let S=p,g=new Set([ep,tp,$f]),d=new Set([bi,Ki,Cl,Rl,Jf,Qf]),v=new Uint32Array(4),b=new Int32Array(4),x=new z,T=null,E=null,w=[],_=[],A=null;this.domElement=n,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=ji,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let N=this,C=!1,U=null,O=null,D=null,G=null;this._outputColorSpace=Tn;let q=0,Z=0,nt=null,Y=-1,$=null,st=new Xe,Lt=new Xe,Nt=null,he=new Xt(0),ne=0,oe=n.width,J=n.height,it=1,St=null,zt=null,yt=new Xe(0,0,oe,J),Ft=new Xe(0,0,oe,J),We=!1,Wt=new uu,ae=!1,pe=!1,qt=new Be,Ee=new z,qe=new Xe,Ve={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ae=!1;function re(){return nt===null?it:1}let B=i;function Ye(M,I){return n.getContext(M,I)}let Qt,R,y,H,X,j,rt,lt,K,tt,ct,At,ft,ut,Mt,Dt,Gt,P,dt,Q,ht,mt,at;try{let M={alpha:!0,depth:s,stencil:a,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:f};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${"186"}`),n.addEventListener("webglcontextlost",me,!1),n.addEventListener("webglcontextrestored",le,!1),n.addEventListener("webglcontextcreationerror",Pn,!1),B===null){let I="webgl2";if(B=Ye(I,M),B===null)throw Ye(I)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ct()}catch(M){throw n.removeEventListener("webglcontextlost",me,!1),n.removeEventListener("webglcontextrestored",le,!1),n.removeEventListener("webglcontextcreationerror",Pn,!1),Pt("WebGLRenderer: "+M.message),M}function Ct(){Qt=new ED(B),Qt.init(),ht=new uU(B,Qt),R=new pD(B,Qt,t,ht),y=new lU(B,Qt),R.reversedDepthBuffer&&u&&y.buffers.depth.setReversed(!0),O=B.createFramebuffer(),D=B.createFramebuffer(),G=B.createFramebuffer(),H=new AD(B),X=new ZL,j=new cU(B,Qt,y,X,R,ht,H),rt=new MD(N),lt=new R2(B),mt=new dD(B,lt),K=new TD(B,lt,H,mt),tt=new RD(B,K,lt,mt,H),P=new CD(B,R,j),Mt=new mD(X),ct=new YL(N,rt,Qt,R,mt,Mt),At=new pU(N,X),ft=new KL,ut=new nU(Qt),Gt=new hD(N,rt,y,tt,m,l),Dt=new oU(N,tt,R),at=new mU(B,H,R,y),dt=new fD(B,Qt,H),Q=new wD(B,Qt,H),H.programs=ct.programs,N.capabilities=R,N.extensions=Qt,N.properties=X,N.renderLists=ft,N.shadowMap=Dt,N.state=y,N.info=H}S!==bi&&(A=new DD(S,n.width,n.height,o,s,a));let Et=new E_(N,B);this.xr=Et,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let M=Qt.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=Qt.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return it},this.setPixelRatio=function(M){M!==void 0&&(it=M,this.setSize(oe,J,!1))},this.getSize=function(M){return M.set(oe,J)},this.setSize=function(M,I,W=!0){if(Et.isPresenting){It("WebGLRenderer: Can't change size while VR device is presenting.");return}oe=M,J=I,n.width=Math.floor(M*it),n.height=Math.floor(I*it),W===!0&&(n.style.width=M+"px",n.style.height=I+"px"),A!==null&&A.setSize(n.width,n.height),this.setViewport(0,0,M,I)},this.getDrawingBufferSize=function(M){return M.set(oe*it,J*it).floor()},this.setDrawingBufferSize=function(M,I,W){oe=M,J=I,it=W,n.width=Math.floor(M*W),n.height=Math.floor(I*W),this.setViewport(0,0,M,I)},this.setEffects=function(M){if(S===bi){Pt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let I=0;I<M.length;I++)if(M[I].isOutputPass===!0){It("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(st)},this.getViewport=function(M){return M.copy(yt)},this.setViewport=function(M,I,W,V){M.isVector4?yt.set(M.x,M.y,M.z,M.w):yt.set(M,I,W,V),y.viewport(st.copy(yt).multiplyScalar(it).round())},this.getScissor=function(M){return M.copy(Ft)},this.setScissor=function(M,I,W,V){M.isVector4?Ft.set(M.x,M.y,M.z,M.w):Ft.set(M,I,W,V),y.scissor(Lt.copy(Ft).multiplyScalar(it).round())},this.getScissorTest=function(){return We},this.setScissorTest=function(M){y.setScissorTest(We=M)},this.setOpaqueSort=function(M){St=M},this.setTransparentSort=function(M){zt=M},this.getClearColor=function(M){return M.copy(Gt.getClearColor())},this.setClearColor=function(){Gt.setClearColor(...arguments)},this.getClearAlpha=function(){return Gt.getClearAlpha()},this.setClearAlpha=function(){Gt.setClearAlpha(...arguments)},this.clear=function(M=!0,I=!0,W=!0){let V=0;if(M){let k=!1;if(nt!==null){let _t=nt.texture.format;k=g.has(_t)}if(k){let _t=nt.texture.type,bt=d.has(_t),vt=Gt.getClearColor(),Tt=Gt.getClearAlpha(),Rt=vt.r,Yt=vt.g,$t=vt.b;bt?(v[0]=Rt,v[1]=Yt,v[2]=$t,v[3]=Tt,B.clearBufferuiv(B.COLOR,0,v)):(b[0]=Rt,b[1]=Yt,b[2]=$t,b[3]=Tt,B.clearBufferiv(B.COLOR,0,b))}else V|=B.COLOR_BUFFER_BIT}I&&(V|=B.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(V|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),V!==0&&B.clear(V)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),U=M},this.dispose=function(){n.removeEventListener("webglcontextlost",me,!1),n.removeEventListener("webglcontextrestored",le,!1),n.removeEventListener("webglcontextcreationerror",Pn,!1),Gt.dispose(),ft.dispose(),ut.dispose(),X.dispose(),rt.dispose(),tt.dispose(),mt.dispose(),at.dispose(),ct.dispose(),Et.dispose(),Et.removeEventListener("sessionstart",Bu),Et.removeEventListener("sessionend",zu),Rs.stop()};function me(M){M.preventDefault(),iu("WebGLRenderer: Context Lost."),C=!0}function le(){iu("WebGLRenderer: Context Restored."),C=!1;let M=H.autoReset,I=Dt.enabled,W=Dt.autoUpdate,V=Dt.needsUpdate,k=Dt.type;Ct(),H.autoReset=M,Dt.enabled=I,Dt.autoUpdate=W,Dt.needsUpdate=V,Dt.type=k}function Pn(M){Pt("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function Mi(M){let I=M.target;I.removeEventListener("dispose",Mi),Wp(I)}function Wp(M){rr(M),X.remove(M)}function rr(M){let I=X.get(M).programs;I!==void 0&&(I.forEach(function(W){ct.releaseProgram(W)}),M.isShaderMaterial&&ct.releaseShaderCache(M))}this.renderBufferDirect=function(M,I,W,V,k,_t){I===null&&(I=Ve);let bt=k.isMesh&&k.matrixWorld.determinantAffine()<0,vt=Vu(M,I,W,V,k);y.setMaterial(V,bt);let Tt=W.index,Rt=1;if(V.wireframe===!0){if(Tt=K.getWireframeAttribute(W),Tt===void 0)return;Rt=2}let Yt=W.drawRange,$t=W.attributes.position,wt=Yt.start*Rt,ge=(Yt.start+Yt.count)*Rt;_t!==null&&(wt=Math.max(wt,_t.start*Rt),ge=Math.min(ge,(_t.start+_t.count)*Rt)),Tt!==null?(wt=Math.max(wt,0),ge=Math.min(ge,Tt.count)):$t!=null&&(wt=Math.max(wt,0),ge=Math.min(ge,$t.count));let $e=ge-wt;if($e<0||$e===1/0)return;mt.setup(k,V,vt,W,Tt);let ze,Ce=dt;if(Tt!==null&&(ze=lt.get(Tt),Ce=Q,Ce.setIndex(ze)),k.isMesh)V.wireframe===!0?(y.setLineWidth(V.wireframeLinewidth*re()),Ce.setMode(B.LINES)):Ce.setMode(B.TRIANGLES);else if(k.isLine){let An=V.linewidth;An===void 0&&(An=1),y.setLineWidth(An*re()),k.isLineSegments?Ce.setMode(B.LINES):k.isLineLoop?Ce.setMode(B.LINE_LOOP):Ce.setMode(B.LINE_STRIP)}else k.isPoints?Ce.setMode(B.POINTS):k.isSprite&&Ce.setMode(B.TRIANGLES);if(k.isBatchedMesh)if(Qt.get("WEBGL_multi_draw"))Ce.renderMultiDraw(k._multiDrawStarts,k._multiDrawCounts,k._multiDrawCount);else{let An=k._multiDrawStarts,xt=k._multiDrawCounts,Bn=k._multiDrawCount,ce=Tt?lt.get(Tt).bytesPerElement:1,Ei=X.get(V).currentProgram.getUniforms();for(let $i=0;$i<Bn;$i++)Ei.setValue(B,"_gl_DrawID",$i),Ce.render(An[$i]/ce,xt[$i])}else if(k.isInstancedMesh)Ce.renderInstances(wt,$e,k.count);else if(W.isInstancedBufferGeometry){let An=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,xt=Math.min(W.instanceCount,An);Ce.renderInstances(wt,$e,xt)}else Ce.render(wt,$e)};function Pu(M,I,W,V){U!==null&&M.isNodeMaterial&&U.setObject(V,M),ae===!0&&Mt.setState(M,W,!1),M.transparent===!0&&M.side===Ms&&M.forceSinglePass===!1?(M.side=Zn,M.needsUpdate=!0,Yr(M,I,V),M.side=$a,M.needsUpdate=!0,Yr(M,I,V),M.side=Ms):Yr(M,I,V)}this.compile=function(M,I,W=null){W===null&&(W=M),U!==null&&U.renderStart(M,I,W),E=ut.get(W),E.init(I),_.push(E),W.traverseVisible(function(k){k.isLight&&k.layers.test(I.layers)&&(E.pushLight(k),k.castShadow&&E.pushShadow(k))}),M!==W&&M.traverseVisible(function(k){k.isLight&&k.layers.test(I.layers)&&(E.pushLight(k),k.castShadow&&E.pushShadow(k))}),E.setupLights(),U!==null&&U.updateLights(E.state.lightsArray),pe=this.localClippingEnabled,ae=Mt.init(this.clippingPlanes,pe),ae===!0&&Mt.setGlobalState(this.clippingPlanes,I),U!==null&&Dt.render(E.state.shadowsArray,W,I);let V=new Set;return M.traverse(function(k){if(!(k.isMesh||k.isPoints||k.isLine||k.isSprite))return;let _t=k.material;if(_t)if(Array.isArray(_t))for(let bt=0;bt<_t.length;bt++){let vt=_t[bt];Pu(vt,W,I,k),V.add(vt)}else Pu(_t,W,I,k),V.add(_t)}),E=_.pop(),U!==null&&U.renderEnd(),V},this.compileAsync=function(M,I,W=null){let V=this.compile(M,I,W);return new Promise(k=>{function _t(){if(V.forEach(function(bt){let Tt=X.get(bt).currentProgram;(Tt===void 0||Tt.isReady())&&V.delete(bt)}),V.size===0){k(M);return}setTimeout(_t,10)}Qt.get("KHR_parallel_shader_compile")!==null?_t():setTimeout(_t,10)})};let Pl=null;function Bl(M){Pl&&Pl(M)}function Bu(){Rs.stop()}function zu(){Rs.start()}let Rs=new eT;Rs.setAnimationLoop(Bl),typeof self<"u"&&Rs.setContext(self),this.setAnimationLoop=function(M){Pl=M,Et.setAnimationLoop(M),M===null?Rs.stop():Rs.start()},Et.addEventListener("sessionstart",Bu),Et.addEventListener("sessionend",zu),this.render=function(M,I){if(I!==void 0&&I.isCamera!==!0){Pt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(C===!0)return;U!==null&&U.renderStart(M,I);let W=Et.enabled===!0&&Et.isPresenting===!0,V=A!==null&&(nt===null||W)&&A.begin(N,nt);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),I.parent===null&&I.matrixWorldAutoUpdate===!0&&I.updateMatrixWorld(),Et.enabled===!0&&Et.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(Et.cameraAutoUpdate===!0&&Et.updateCamera(I),I=Et.getCamera()),M.isScene===!0&&M.onBeforeRender(N,M,I,nt),E=ut.get(M,_.length),E.init(I),E.state.textureUnits=j.getTextureUnits(),_.push(E),qt.multiplyMatrices(I.projectionMatrix,I.matrixWorldInverse),Wt.setFromProjectionMatrix(qt,Yi,I.reversedDepth),pe=this.localClippingEnabled,ae=Mt.init(this.clippingPlanes,pe),T=ft.get(M,w.length),T.init(),w.push(T),Et.enabled===!0&&Et.isPresenting===!0){let bt=N.xr.getDepthSensingMesh();bt!==null&&zl(bt,I,-1/0,N.sortObjects)}zl(M,I,0,N.sortObjects),T.finish(),U!==null&&U.updateLights(E.state.lightsArray),N.sortObjects===!0&&T.sort(St,zt),Ae=Et.enabled===!1||Et.isPresenting===!1||Et.hasDepthSensing()===!1,Ae&&Gt.addToRenderList(T,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ae===!0&&Mt.beginShadows();let k=E.state.shadowsArray;if(Dt.render(k,M,I),ae===!0&&Mt.endShadows(),(V&&A.hasRenderPass())===!1){let bt=T.opaque,vt=T.transmissive;if(E.setupLights(),I.isArrayCamera){let Tt=I.cameras;if(vt.length>0)for(let Rt=0,Yt=Tt.length;Rt<Yt;Rt++){let $t=Tt[Rt];Gu(bt,vt,M,$t)}Ae&&Gt.render(M);for(let Rt=0,Yt=Tt.length;Rt<Yt;Rt++){let $t=Tt[Rt];Fu(T,M,$t,$t.viewport)}}else vt.length>0&&Gu(bt,vt,M,I),Ae&&Gt.render(M),Fu(T,M,I)}nt!==null&&Z===0&&(j.updateMultisampleRenderTarget(nt),j.updateRenderTargetMipmap(nt)),V&&A.end(N),M.isScene===!0&&M.onAfterRender(N,M,I),mt.resetDefaultState(),Y=-1,$=null,_.pop(),_.length>0?(E=_[_.length-1],j.setTextureUnits(E.state.textureUnits),ae===!0&&Mt.setGlobalState(N.clippingPlanes,E.state.camera)):E=null,w.pop(),w.length>0?T=w[w.length-1]:T=null,U!==null&&U.renderEnd()};function zl(M,I,W,V){if(M.visible===!1)return;if(M.layers.test(I.layers)){if(M.isGroup)W=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(I);else if(M.isLightProbeGrid)E.pushLightProbeGrid(M);else if(M.isLight)E.pushLight(M),M.castShadow&&E.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||M.intersectsFrustum(Wt)){V&&qe.setFromMatrixPosition(M.matrixWorld).applyMatrix4(qt);let bt=tt.update(M),vt=M.material;vt.visible&&T.push(M,bt,vt,W,qe.z,null,I)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||M.intersectsFrustum(Wt))){let bt=tt.update(M),vt=M.material;if(V&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),qe.copy(M.boundingSphere.center)):(bt.boundingSphere===null&&bt.computeBoundingSphere(),qe.copy(bt.boundingSphere.center)),qe.applyMatrix4(M.matrixWorld).applyMatrix4(qt)),Array.isArray(vt)){let Tt=bt.groups;for(let Rt=0,Yt=Tt.length;Rt<Yt;Rt++){let $t=Tt[Rt],wt=vt[$t.materialIndex];wt&&wt.visible&&T.push(M,bt,wt,W,qe.z,$t,I)}}else vt.visible&&T.push(M,bt,vt,W,qe.z,null,I)}}let _t=M.children;for(let bt=0,vt=_t.length;bt<vt;bt++)zl(_t[bt],I,W,V)}function Fu(M,I,W,V){let{opaque:k,transmissive:_t,transparent:bt}=M;E.setupLightsView(W),ae===!0&&Mt.setGlobalState(N.clippingPlanes,W),V&&y.viewport(st.copy(V)),k.length>0&&or(k,I,W),_t.length>0&&or(_t,I,W),bt.length>0&&or(bt,I,W),y.buffers.depth.setTest(!0),y.buffers.depth.setMask(!0),y.buffers.color.setMask(!0),y.setPolygonOffset(!1)}function Gu(M,I,W,V){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[V.id]===void 0){let wt=Qt.has("EXT_color_buffer_half_float")||Qt.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[V.id]=new ni(1,1,{generateMipmaps:!0,type:wt?Qi:bi,minFilter:nr,samples:Math.max(4,R.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:se.workingColorSpace})}let _t=E.state.transmissionRenderTarget[V.id],bt=V.viewport||st;_t.setSize(bt.z*N.transmissionResolutionScale,bt.w*N.transmissionResolutionScale);let vt=N.getRenderTarget(),Tt=N.getActiveCubeFace(),Rt=N.getActiveMipmapLevel();N.setRenderTarget(_t),N.getClearColor(he),ne=N.getClearAlpha(),ne<1&&N.setClearColor(16777215,.5),N.clear(),Ae&&Gt.render(W);let Yt=N.toneMapping;N.toneMapping=ji;let $t=V.viewport;if(V.viewport!==void 0&&(V.viewport=void 0),E.setupLightsView(V),ae===!0&&Mt.setGlobalState(N.clippingPlanes,V),or(M,W,V),j.updateMultisampleRenderTarget(_t),j.updateRenderTargetMipmap(_t),Qt.has("WEBGL_multisampled_render_to_texture")===!1){let wt=!1;for(let ge=0,$e=I.length;ge<$e;ge++){let ze=I[ge],{object:Ce,geometry:An,material:xt,group:Bn}=ze;if(xt.side===Ms&&Ce.layers.test(V.layers)){let ce=xt.side;xt.side=Zn,xt.needsUpdate=!0,Hu(Ce,W,V,An,xt,Bn),xt.side=ce,xt.needsUpdate=!0,wt=!0}}wt===!0&&(j.updateMultisampleRenderTarget(_t),j.updateRenderTargetMipmap(_t))}N.setRenderTarget(vt,Tt,Rt),N.setClearColor(he,ne),$t!==void 0&&(V.viewport=$t),N.toneMapping=Yt}function or(M,I,W){let V=I.isScene===!0?I.overrideMaterial:null;for(let k=0,_t=M.length;k<_t;k++){let bt=M[k],{object:vt,geometry:Tt,group:Rt}=bt,Yt=bt.material;Yt.allowOverride===!0&&V!==null&&(Yt=V),vt.layers.test(W.layers)&&Hu(vt,I,W,Tt,Yt,Rt)}}function Hu(M,I,W,V,k,_t){U!==null&&k.isNodeMaterial&&U.setObject(M,k),M.onBeforeRender(N,I,W,V,k,_t),M.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),k.onBeforeRender(N,I,W,V,M,_t),k.transparent===!0&&k.side===Ms&&k.forceSinglePass===!1?(k.side=Zn,k.needsUpdate=!0,N.renderBufferDirect(W,I,V,k,M,_t),k.side=$a,k.needsUpdate=!0,N.renderBufferDirect(W,I,V,k,M,_t),k.side=Ms):N.renderBufferDirect(W,I,V,k,M,_t),M.onAfterRender(N,I,W,V,k,_t)}function Yr(M,I,W){I.isScene!==!0&&(I=Ve);let V=X.get(M),k=E.state.lights,_t=E.state.shadowsArray,bt=k.state.version,vt=ct.getParameters(M,k.state,_t,I,W,E.state.lightProbeGridArray),Tt=ct.getProgramCacheKey(vt),Rt=V.programs;V.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?I.environment:null,V.fog=I.fog;let Yt=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;V.envMap=rt.get(M.envMap||V.environment,Yt),V.envMapRotation=V.environment!==null&&M.envMap===null?I.environmentRotation:M.envMapRotation,Rt===void 0&&(M.addEventListener("dispose",Mi),Rt=new Map,V.programs=Rt);let $t=Rt.get(Tt);if($t!==void 0){if(V.currentProgram===$t&&V.lightsStateVersion===bt)return lr(M,vt),$t}else vt.uniforms=ct.getUniforms(M),U!==null&&M.isNodeMaterial&&U.build(M,W,vt),M.onBeforeCompile(vt,N),$t=ct.acquireProgram(vt,Tt),Rt.set(Tt,$t),V.uniforms=vt.uniforms;let wt=V.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(wt.clippingPlanes=Mt.uniform),lr(M,vt),V.needsLights=pt(M),V.lightsStateVersion=bt,V.needsLights&&(wt.ambientLightColor.value=k.state.ambient,wt.lightProbe.value=k.state.probe,wt.sunLights.value=k.state.sun,wt.sunLightShadows.value=k.state.sunShadow,wt.directionalLights.value=k.state.directional,wt.directionalLightShadows.value=k.state.directionalShadow,wt.spotLights.value=k.state.spot,wt.spotLightShadows.value=k.state.spotShadow,wt.rectAreaLights.value=k.state.rectArea,wt.ltc_1.value=k.state.rectAreaLTC1,wt.ltc_2.value=k.state.rectAreaLTC2,wt.pointLights.value=k.state.point,wt.pointLightShadows.value=k.state.pointShadow,wt.hemisphereLights.value=k.state.hemi,wt.sunShadowMatrix.value=k.state.sunShadowMatrix,wt.sunShadowCascade.value=k.state.sunShadowCascade,wt.directionalShadowMatrix.value=k.state.directionalShadowMatrix,wt.spotLightMatrix.value=k.state.spotLightMatrix,wt.spotLightMap.value=k.state.spotLightMap,wt.pointShadowMatrix.value=k.state.pointShadowMatrix),V.lightProbeGrid=E.state.lightProbeGridArray.length>0,V.currentProgram=$t,V.uniformsList=null,$t}function Zr(M){if(M.uniformsList===null){let I=M.currentProgram.getUniforms();M.uniformsList=Ll.seqWithValue(I.seq,M.uniforms)}return M.uniformsList}function lr(M,I){let W=X.get(M);W.outputColorSpace=I.outputColorSpace,W.batching=I.batching,W.batchingColor=I.batchingColor,W.instancing=I.instancing,W.instancingColor=I.instancingColor,W.instancingMorph=I.instancingMorph,W.skinning=I.skinning,W.morphTargets=I.morphTargets,W.morphNormals=I.morphNormals,W.morphColors=I.morphColors,W.morphTargetsCount=I.morphTargetsCount,W.numClippingPlanes=I.numClippingPlanes,W.numIntersection=I.numClipIntersection,W.vertexAlphas=I.vertexAlphas,W.vertexTangents=I.vertexTangents,W.toneMapping=I.toneMapping}function sa(M,I){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;x.setFromMatrixPosition(I.matrixWorld);for(let W=0,V=M.length;W<V;W++){let k=M[W];if(k.texture!==null&&k.boundingBox.containsPoint(x))return k}return null}function Vu(M,I,W,V,k){I.isScene!==!0&&(I=Ve),j.resetTextureUnits();let _t=I.fog,bt=V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial?I.environment:null,vt=nt===null?N.outputColorSpace:nt.isXRRenderTarget===!0?nt.texture.colorSpace:se.workingColorSpace,Tt=V.isMeshStandardMaterial||V.isMeshLambertMaterial&&!V.envMap||V.isMeshPhongMaterial&&!V.envMap,Rt=rt.get(V.envMap||bt,Tt),Yt=V.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,$t=!!W.attributes.tangent&&(!!V.normalMap||V.anisotropy>0),wt=!!W.morphAttributes.position,ge=!!W.morphAttributes.normal,$e=!!W.morphAttributes.color,ze=ji;V.toneMapped&&(nt===null||nt.isXRRenderTarget===!0)&&(ze=N.toneMapping);let Ce=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,An=Ce!==void 0?Ce.length:0,xt=X.get(V),Bn=E.state.lights;if(ae===!0&&(pe===!0||M!==$)){let Le=M===$&&V.id===Y;Mt.setState(V,M,Le)}let ce=!1;V.version===xt.__version?(xt.needsLights&&xt.lightsStateVersion!==Bn.state.version||xt.outputColorSpace!==vt||k.isBatchedMesh&&xt.batching===!1||!k.isBatchedMesh&&xt.batching===!0||k.isBatchedMesh&&xt.batchingColor===!0&&k._colorsTexture===null||k.isBatchedMesh&&xt.batchingColor===!1&&k._colorsTexture!==null||k.isInstancedMesh&&xt.instancing===!1||!k.isInstancedMesh&&xt.instancing===!0||k.isSkinnedMesh&&xt.skinning===!1||!k.isSkinnedMesh&&xt.skinning===!0||k.isInstancedMesh&&xt.instancingColor===!0&&k.instanceColor===null||k.isInstancedMesh&&xt.instancingColor===!1&&k.instanceColor!==null||k.isInstancedMesh&&xt.instancingMorph===!0&&k.morphTexture===null||k.isInstancedMesh&&xt.instancingMorph===!1&&k.morphTexture!==null||xt.envMap!==Rt||V.fog===!0&&xt.fog!==_t||xt.numClippingPlanes!==void 0&&(xt.numClippingPlanes!==Mt.numPlanes||xt.numIntersection!==Mt.numIntersection)||xt.vertexAlphas!==Yt||xt.vertexTangents!==$t||xt.morphTargets!==wt||xt.morphNormals!==ge||xt.morphColors!==$e||xt.toneMapping!==ze||xt.morphTargetsCount!==An||!!xt.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(ce=!0):(ce=!0,xt.__version=V.version);let Ei=xt.currentProgram;ce===!0&&(Ei=Yr(V,I,k),U&&V.isNodeMaterial&&U.onUpdateProgram(V,Ei,xt));let $i=!1,aa=!1,jr=!1,Te=Ei.getUniforms(),Je=xt.uniforms;if(y.useProgram(Ei.program)&&($i=!0,aa=!0,jr=!0),V.id!==Y&&(Y=V.id,aa=!0),xt.needsLights){let Le=sa(E.state.lightProbeGridArray,k);xt.lightProbeGrid!==Le&&(xt.lightProbeGrid=Le,aa=!0)}if($i||$!==M){y.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),Te.setValue(B,"projectionMatrix",M.projectionMatrix),Te.setValue(B,"viewMatrix",M.matrixWorldInverse);let oa=Te.map.cameraPosition;oa!==void 0&&oa.setValue(B,Ee.setFromMatrixPosition(M.matrixWorld)),R.logarithmicDepthBuffer&&Te.setValue(B,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(V.isMeshPhongMaterial||V.isMeshToonMaterial||V.isMeshLambertMaterial||V.isMeshBasicMaterial||V.isMeshStandardMaterial||V.isShaderMaterial)&&Te.setValue(B,"isOrthographic",M.isOrthographicCamera===!0),$!==M&&($=M,aa=!0,jr=!0)}if(xt.needsLights&&(Bn.state.sunShadowMap.length>0&&Te.setValue(B,"sunShadowMap",Bn.state.sunShadowMap,j),Bn.state.directionalShadowMap.length>0&&Te.setValue(B,"directionalShadowMap",Bn.state.directionalShadowMap,j),Bn.state.spotShadowMap.length>0&&Te.setValue(B,"spotShadowMap",Bn.state.spotShadowMap,j),Bn.state.pointShadowMap.length>0&&Te.setValue(B,"pointShadowMap",Bn.state.pointShadowMap,j)),k.isSkinnedMesh){Te.setOptional(B,k,"bindMatrix"),Te.setOptional(B,k,"bindMatrixInverse");let Le=k.skeleton;Le&&(Le.boneTexture===null&&Le.computeBoneTexture(),Te.setValue(B,"boneTexture",Le.boneTexture,j))}k.isBatchedMesh&&(Te.setOptional(B,k,"batchingTexture"),Te.setValue(B,"batchingTexture",k._matricesTexture,j),Te.setOptional(B,k,"batchingIdTexture"),Te.setValue(B,"batchingIdTexture",k._indirectTexture,j),Te.setOptional(B,k,"batchingColorTexture"),k._colorsTexture!==null&&Te.setValue(B,"batchingColorTexture",k._colorsTexture,j));let ra=W.morphAttributes;if((ra.position!==void 0||ra.normal!==void 0||ra.color!==void 0)&&P.update(k,W,Ei),(aa||xt.receiveShadow!==k.receiveShadow)&&(xt.receiveShadow=k.receiveShadow,Te.setValue(B,"receiveShadow",k.receiveShadow)),(V.isMeshStandardMaterial||V.isMeshLambertMaterial||V.isMeshPhongMaterial)&&V.envMap===null&&I.environment!==null&&(Je.envMapIntensity.value=I.environmentIntensity),Je.dfgLUT!==void 0&&(Je.dfgLUT.value=vU()),aa){if(Te.setValue(B,"toneMappingExposure",N.toneMappingExposure),xt.needsLights&&L(Je,jr),_t&&V.fog===!0&&At.refreshFogUniforms(Je,_t),At.refreshMaterialUniforms(Je,V,it,J,E.state.transmissionRenderTarget[M.id]),xt.needsLights&&xt.lightProbeGrid){let Le=xt.lightProbeGrid;Je.probesSH.value=Le.texture,Je.probesMin.value.copy(Le.boundingBox.min),Je.probesMax.value.copy(Le.boundingBox.max),Je.probesResolution.value.copy(Le.resolution)}Ll.upload(B,Zr(xt),Je,j)}if(V.isShaderMaterial&&V.uniformsNeedUpdate===!0&&(Ll.upload(B,Zr(xt),Je,j),V.uniformsNeedUpdate=!1),V.isSpriteMaterial&&Te.setValue(B,"center",k.center),Te.setValue(B,"modelViewMatrix",k.modelViewMatrix),Te.setValue(B,"normalMatrix",k.normalMatrix),Te.setValue(B,"modelMatrix",k.matrixWorld),V.uniformsGroups!==void 0){let Le=V.uniformsGroups;for(let oa=0,Kr=Le.length;oa<Kr;oa++){let L_=Le[oa];at.update(L_,Ei),at.bind(L_,Ei)}}return Ei}function L(M,I){M.ambientLightColor.needsUpdate=I,M.lightProbe.needsUpdate=I,M.sunLights.needsUpdate=I,M.sunLightShadows.needsUpdate=I,M.directionalLights.needsUpdate=I,M.directionalLightShadows.needsUpdate=I,M.pointLights.needsUpdate=I,M.pointLightShadows.needsUpdate=I,M.spotLights.needsUpdate=I,M.spotLightShadows.needsUpdate=I,M.rectAreaLights.needsUpdate=I,M.hemisphereLights.needsUpdate=I}function pt(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return q},this.getActiveMipmapLevel=function(){return Z},this.getRenderTarget=function(){return nt},this.setRenderTargetTextures=function(M,I,W){let V=X.get(M);V.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,V.__autoAllocateDepthBuffer===!1&&(V.__useRenderToTexture=!1),X.get(M.texture).__webglTexture=I,X.get(M.depthTexture).__webglTexture=V.__autoAllocateDepthBuffer?void 0:W,V.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,I){let W=X.get(M);W.__webglFramebuffer=I,W.__useDefaultFramebuffer=I===void 0},this.setRenderTarget=function(M,I=0,W=0){nt=M,q=I,Z=W;let V=null,k=!1,_t=!1;if(M){let vt=X.get(M);if(vt.__useDefaultFramebuffer!==void 0){y.bindFramebuffer(B.FRAMEBUFFER,vt.__webglFramebuffer),st.copy(M.viewport),Lt.copy(M.scissor),Nt=M.scissorTest,y.viewport(st),y.scissor(Lt),y.setScissorTest(Nt),Y=-1;return}else if(vt.__webglFramebuffer===void 0)j.setupRenderTarget(M);else if(vt.__hasExternalTextures)j.rebindTextures(M,X.get(M.texture).__webglTexture,X.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let Yt=M.depthTexture;if(vt.__boundDepthTexture!==Yt){if(Yt!==null&&X.has(Yt)&&(M.width!==Yt.image.width||M.height!==Yt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");j.setupDepthRenderbuffer(M)}}let Tt=M.texture;(Tt.isData3DTexture||Tt.isDataArrayTexture||Tt.isCompressedArrayTexture)&&(_t=!0);let Rt=X.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Rt[I])?V=Rt[I][W]:V=Rt[I],k=!0):M.samples>0&&j.useMultisampledRTT(M)===!1?V=X.get(M).__webglMultisampledFramebuffer:Array.isArray(Rt)?V=Rt[W]:V=Rt,st.copy(M.viewport),Lt.copy(M.scissor),Nt=M.scissorTest}else st.copy(yt).multiplyScalar(it).floor(),Lt.copy(Ft).multiplyScalar(it).floor(),Nt=We;if(W!==0&&(V=O),y.bindFramebuffer(B.FRAMEBUFFER,V)&&y.drawBuffers(M,V),y.viewport(st),y.scissor(Lt),y.setScissorTest(Nt),k){let vt=X.get(M.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+I,vt.__webglTexture,W)}else if(_t){let vt=I;for(let Tt=0;Tt<M.textures.length;Tt++){let Rt=X.get(M.textures[Tt]);B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0+Tt,Rt.__webglTexture,W,vt)}}else if(M!==null&&W!==0){let vt=X.get(M.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,vt.__webglTexture,W)}Y=-1};function Kt(M){let I=X.get(M);return(I.__readFormat!==M.format||I.__readType!==M.type)&&(I.__readFormat=M.format,I.__readType=M.type,I.__formatReadable=R.textureFormatReadable(M.format),I.__typeReadable=R.textureTypeReadable(M.type)),I}this.readRenderTargetPixels=function(M,I,W,V,k,_t,bt,vt=0){if(!(M&&M.isWebGLRenderTarget)){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Tt=X.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&bt!==void 0&&(Tt=Tt[bt]),Tt){y.bindFramebuffer(B.FRAMEBUFFER,Tt);try{let Rt=M.textures[vt],Yt=Rt.format,$t=Rt.type;M.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+vt);let wt=Kt(Rt);if(wt.__formatReadable===!1){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(wt.__typeReadable===!1){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}I>=0&&I<=M.width-V&&W>=0&&W<=M.height-k&&B.readPixels(I,W,V,k,ht.convert(Yt),ht.convert($t),_t)}finally{let Rt=nt!==null?X.get(nt).__webglFramebuffer:null;y.bindFramebuffer(B.FRAMEBUFFER,Rt)}}},this.readRenderTargetPixelsAsync=async function(M,I,W,V,k,_t,bt,vt=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Tt=X.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&bt!==void 0&&(Tt=Tt[bt]),Tt)if(I>=0&&I<=M.width-V&&W>=0&&W<=M.height-k){y.bindFramebuffer(B.FRAMEBUFFER,Tt);let Rt=M.textures[vt],Yt=Rt.format,$t=Rt.type;M.textures.length>1&&B.readBuffer(B.COLOR_ATTACHMENT0+vt);let wt=Kt(Rt);if(wt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(wt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let ge=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,ge),B.bufferData(B.PIXEL_PACK_BUFFER,_t.byteLength,B.STREAM_READ),B.readPixels(I,W,V,k,ht.convert(Yt),ht.convert($t),0),B.bindBuffer(B.PIXEL_PACK_BUFFER,null);let $e=nt!==null?X.get(nt).__webglFramebuffer:null;y.bindFramebuffer(B.FRAMEBUFFER,$e);let ze=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await AE(B,ze,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,ge),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,_t),B.bindBuffer(B.PIXEL_PACK_BUFFER,null),B.deleteBuffer(ge),B.deleteSync(ze),_t}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,I=null,W=0){let V=Math.pow(2,-W),k=Math.floor(M.image.width*V),_t=Math.floor(M.image.height*V),bt=I!==null?I.x:0,vt=I!==null?I.y:0;j.setTexture2D(M,0),B.copyTexSubImage2D(B.TEXTURE_2D,W,0,0,bt,vt,k,_t),y.unbindTexture()},this.copyTextureToTexture=function(M,I,W=null,V=null,k=0,_t=0){let bt,vt,Tt,Rt,Yt,$t,wt,ge,$e,ze=M.isCompressedTexture?M.mipmaps[_t]:M.image;if(W!==null)bt=W.max.x-W.min.x,vt=W.max.y-W.min.y,Tt=W.isBox3?W.max.z-W.min.z:1,Rt=W.min.x,Yt=W.min.y,$t=W.isBox3?W.min.z:0;else{let Je=Math.pow(2,-k);bt=Math.floor(ze.width*Je),vt=Math.floor(ze.height*Je),M.isDataArrayTexture?Tt=ze.depth:M.isData3DTexture?Tt=Math.floor(ze.depth*Je):Tt=1,Rt=0,Yt=0,$t=0}V!==null?(wt=V.x,ge=V.y,$e=V.z):(wt=0,ge=0,$e=0);let Ce=ht.convert(I.format),An=ht.convert(I.type),xt;I.isData3DTexture?(j.setTexture3D(I,0),xt=B.TEXTURE_3D):I.isDataArrayTexture||I.isCompressedArrayTexture?(j.setTexture2DArray(I,0),xt=B.TEXTURE_2D_ARRAY):(j.setTexture2D(I,0),xt=B.TEXTURE_2D),y.activeTexture(B.TEXTURE0),y.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,I.flipY),y.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,I.premultiplyAlpha),y.pixelStorei(B.UNPACK_ALIGNMENT,I.unpackAlignment);let Bn=y.getParameter(B.UNPACK_ROW_LENGTH),ce=y.getParameter(B.UNPACK_IMAGE_HEIGHT),Ei=y.getParameter(B.UNPACK_SKIP_PIXELS),$i=y.getParameter(B.UNPACK_SKIP_ROWS),aa=y.getParameter(B.UNPACK_SKIP_IMAGES);y.pixelStorei(B.UNPACK_ROW_LENGTH,ze.width),y.pixelStorei(B.UNPACK_IMAGE_HEIGHT,ze.height),y.pixelStorei(B.UNPACK_SKIP_PIXELS,Rt),y.pixelStorei(B.UNPACK_SKIP_ROWS,Yt),y.pixelStorei(B.UNPACK_SKIP_IMAGES,$t);let jr=M.isDataArrayTexture||M.isData3DTexture,Te=I.isDataArrayTexture||I.isData3DTexture;if(M.isDepthTexture){let Je=X.get(M),ra=X.get(I),Le=X.get(Je.__renderTarget),oa=X.get(ra.__renderTarget);y.bindFramebuffer(B.READ_FRAMEBUFFER,Le.__webglFramebuffer),y.bindFramebuffer(B.DRAW_FRAMEBUFFER,oa.__webglFramebuffer);for(let Kr=0;Kr<Tt;Kr++)jr&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,X.get(M).__webglTexture,k,$t+Kr),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,X.get(I).__webglTexture,_t,$e+Kr)),B.blitFramebuffer(Rt,Yt,bt,vt,wt,ge,bt,vt,B.DEPTH_BUFFER_BIT,B.NEAREST);y.bindFramebuffer(B.READ_FRAMEBUFFER,null),y.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(k!==0||M.isRenderTargetTexture||X.has(M)){let Je=X.get(M),ra=X.get(I);y.bindFramebuffer(B.READ_FRAMEBUFFER,D),y.bindFramebuffer(B.DRAW_FRAMEBUFFER,G);for(let Le=0;Le<Tt;Le++)jr?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,Je.__webglTexture,k,$t+Le):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,Je.__webglTexture,k),Te?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,ra.__webglTexture,_t,$e+Le):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,ra.__webglTexture,_t),k!==0?B.blitFramebuffer(Rt,Yt,bt,vt,wt,ge,bt,vt,B.COLOR_BUFFER_BIT,B.NEAREST):Te?B.copyTexSubImage3D(xt,_t,wt,ge,$e+Le,Rt,Yt,bt,vt):B.copyTexSubImage2D(xt,_t,wt,ge,Rt,Yt,bt,vt);y.bindFramebuffer(B.READ_FRAMEBUFFER,null),y.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else Te?M.isDataTexture||M.isData3DTexture?B.texSubImage3D(xt,_t,wt,ge,$e,bt,vt,Tt,Ce,An,ze.data):I.isCompressedArrayTexture?B.compressedTexSubImage3D(xt,_t,wt,ge,$e,bt,vt,Tt,Ce,ze.data):B.texSubImage3D(xt,_t,wt,ge,$e,bt,vt,Tt,Ce,An,ze):M.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,_t,wt,ge,bt,vt,Ce,An,ze.data):M.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,_t,wt,ge,ze.width,ze.height,Ce,ze.data):B.texSubImage2D(B.TEXTURE_2D,_t,wt,ge,bt,vt,Ce,An,ze);y.pixelStorei(B.UNPACK_ROW_LENGTH,Bn),y.pixelStorei(B.UNPACK_IMAGE_HEIGHT,ce),y.pixelStorei(B.UNPACK_SKIP_PIXELS,Ei),y.pixelStorei(B.UNPACK_SKIP_ROWS,$i),y.pixelStorei(B.UNPACK_SKIP_IMAGES,aa),_t===0&&I.generateMipmaps&&B.generateMipmap(xt),y.unbindTexture()},this.initRenderTarget=function(M){X.get(M).__webglFramebuffer===void 0&&j.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?j.setTextureCube(M,0):M.isData3DTexture?j.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?j.setTexture2DArray(M,0):j.setTexture2D(M,0),y.unbindTexture()},this.resetState=function(){q=0,Z=0,nt=null,y.reset(),mt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Yi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let n=this.getContext();n.drawingBufferColorSpace=se._getDrawingBufferColorSpace(t),n.unpackColorSpace=se._getUnpackColorSpace()}};var lT={type:"change"},w_={type:"start"},uT={type:"end"},Hp=new ea,cT=new _i,yU=Math.cos(70*Ts.DEG2RAD),un=new z,ii=2*Math.PI,Me={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},T_=1e-6,Vp=class extends bu{constructor(t,n=null){super(t,n),this.state=Me.NONE,this.target=new z,this.cursor=new z,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Ja.ROTATE,MIDDLE:Ja.DOLLY,RIGHT:Ja.PAN},this.touches={ONE:Qa.ROTATE,TWO:Qa.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new z,this._lastQuaternion=new yi,this._lastTargetPosition=new z,this._quat=new yi().setFromUnitVectors(t.up,new z(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new wl,this._sphericalDelta=new wl,this._scale=1,this._panOffset=new z,this._rotateStart=new Ut,this._rotateEnd=new Ut,this._rotateDelta=new Ut,this._panStart=new Ut,this._panEnd=new Ut,this._panDelta=new Ut,this._dollyStart=new Ut,this._dollyEnd=new Ut,this._dollyDelta=new Ut,this._dollyDirection=new z,this._mouse=new Ut,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=SU.bind(this),this._onPointerDown=xU.bind(this),this._onPointerUp=bU.bind(this),this._onContextMenu=RU.bind(this),this._onMouseWheel=TU.bind(this),this._onKeyDown=wU.bind(this),this._onTouchStart=AU.bind(this),this._onTouchMove=CU.bind(this),this._onMouseDown=MU.bind(this),this._onMouseMove=EU.bind(this),this._interceptControlDown=NU.bind(this),this._interceptControlUp=DU.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=Me.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let t=this.domElement.getRootNode();t.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),t.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(lT),this.update(),this.state=Me.NONE}pan(t,n){this._pan(t,n),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){let n=this.object.position;un.copy(n).sub(this.target),un.applyQuaternion(this._quat),this._spherical.setFromVector3(un),this.autoRotate&&this.state===Me.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(i)&&isFinite(s)&&(i<-Math.PI?i+=ii:i>Math.PI&&(i-=ii),s<-Math.PI?s+=ii:s>Math.PI&&(s-=ii),i<=s?this._spherical.theta=Math.max(i,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+s)/2?Math.max(i,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let a=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let r=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),a=r!=this._spherical.radius}if(un.setFromSpherical(this._spherical),un.applyQuaternion(this._quatInverse),n.copy(this.target).add(un),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let r=null;if(this.object.isPerspectiveCamera){let o=un.length();r=this._clampDistance(o*this._scale);let l=o-r;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),a=!!l}else if(this.object.isOrthographicCamera){let o=new z(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),a=l!==this.object.zoom;let c=new z(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),r=un.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;r!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(r).add(this.object.position):(Hp.origin.copy(this.object.position),Hp.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Hp.direction))<yU?this.object.lookAt(this.target):(cT.setFromNormalAndCoplanarPoint(this.object.up,this.target),Hp.intersectPlane(cT,this.target))))}else if(this.object.isOrthographicCamera){let r=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),r!==this.object.zoom&&(this.object.updateProjectionMatrix(),a=!0)}return this._scale=1,this._performCursorZoom=!1,a||this._lastPosition.distanceToSquared(this.object.position)>T_||8*(1-this._lastQuaternion.dot(this.object.quaternion))>T_||this._lastTargetPosition.distanceToSquared(this.target)>T_?(this.dispatchEvent(lT),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?ii/60*this.autoRotateSpeed*t:ii/60/60*this.autoRotateSpeed}_getZoomScale(t){let n=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*n)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,n){un.setFromMatrixColumn(n,0),un.multiplyScalar(-t),this._panOffset.add(un)}_panUp(t,n){this.screenSpacePanning===!0?un.setFromMatrixColumn(n,1):(un.setFromMatrixColumn(n,0),un.crossVectors(this.object.up,un)),un.multiplyScalar(t),this._panOffset.add(un)}_pan(t,n){let i=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;un.copy(s).sub(this.target);let a=un.length();a*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*a/i.clientHeight,this.object.matrix),this._panUp(2*n*a/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(n*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,n){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),s=t-i.left,a=n-i.top,r=i.width,o=i.height;this._mouse.x=s/r*2-1,this._mouse.y=-(a/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let n=this.domElement;this._rotateLeft(ii*this._rotateDelta.x/n.clientHeight),this._rotateUp(ii*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let n=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),n=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),n=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),n=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-ii*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),n=!0;break}n&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._rotateStart.set(i,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._panStart.set(i,s)}}_handleTouchStartDolly(t){let n=this._getSecondPointerPosition(t),i=t.pageX-n.x,s=t.pageY-n.y,a=Math.sqrt(i*i+s*s);this._dollyStart.set(0,a)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let i=this._getSecondPointerPosition(t),s=.5*(t.pageX+i.x),a=.5*(t.pageY+i.y);this._rotateEnd.set(s,a)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let n=this.domElement;this._rotateLeft(ii*this._rotateDelta.x/n.clientHeight),this._rotateUp(ii*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._panEnd.set(i,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let n=this._getSecondPointerPosition(t),i=t.pageX-n.x,s=t.pageY-n.y,a=Math.sqrt(i*i+s*s);this._dollyEnd.set(0,a),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let r=(t.pageX+n.x)*.5,o=(t.pageY+n.y)*.5;this._updateZoomParameters(r,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==t.pointerId){this._pointers.splice(n,1);return}}_isTrackingPointer(t){for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==t.pointerId)return!0;return!1}_trackPointer(t){let n=this._pointerPositions[t.pointerId];n===void 0&&(n=new Ut,this._pointerPositions[t.pointerId]=n),n.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let n=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[n]}_customWheelEvent(t){let n=t.deltaMode,i={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(n){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function xU(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType==="touch"?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function SU(e){this.enabled!==!1&&(e.pointerType==="touch"?this._onTouchMove(e):this._onMouseMove(e))}function bU(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(uT),this.state=Me.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y});break}}function MU(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Ja.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=Me.DOLLY;break;case Ja.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=Me.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=Me.ROTATE}break;case Ja.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=Me.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=Me.PAN}break;default:this.state=Me.NONE}this.state!==Me.NONE&&this.dispatchEvent(w_)}function EU(e){switch(this.state){case Me.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case Me.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case Me.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e);break}}function TU(e){this.enabled===!1||this.enableZoom===!1||this.state!==Me.NONE||(e.preventDefault(),this.dispatchEvent(w_),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(uT))}function wU(e){this.enabled!==!1&&this._handleKeyDown(e)}function AU(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case Qa.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=Me.TOUCH_ROTATE;break;case Qa.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=Me.TOUCH_PAN;break;default:this.state=Me.NONE}break;case 2:switch(this.touches.TWO){case Qa.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=Me.TOUCH_DOLLY_PAN;break;case Qa.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=Me.TOUCH_DOLLY_ROTATE;break;default:this.state=Me.NONE}break;default:this.state=Me.NONE}this.state!==Me.NONE&&this.dispatchEvent(w_)}function CU(e){switch(this._trackPointer(e),this.state){case Me.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case Me.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case Me.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case Me.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=Me.NONE}}function RU(e){this.enabled!==!1&&e.preventDefault()}function NU(e){e.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function DU(e){e.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var hT=18,dT=72,kp=["#49d9c5","#6f9cff","#a67cff","#ed9361","#db6f9d","#69c982","#5bbbea","#d8b95f"];function mT(e,t={}){return new A_(e,t)}var A_=class{canvas;callbacks;graph=null;layout=null;selectedId=null;hoveredId=null;nodeObjects=[];edgeObjects=[];communityObjects=[];nodeById=new Map;positionById=new Map;labelObjects=[];activeLabelIds=null;disposables=[];pointerDown=null;focusAnimation=null;lastSignature=null;frameId=0;disposed=!1;eventController=new AbortController;scene=new ru;camera=new Un(48,1,1,5e3);renderer;controls;graphGroup=new Qs;nodeGeometry=new vu(1,hT,Math.max(10,hT-6));glowTexture=IU();raycaster=new Su;pointer=new Ut;resizeObserver;starfield=OU();constructor(t,n){this.canvas=t,this.callbacks=n,this.scene.background=null,this.scene.fog=new au(527120,48e-5),this.camera.position.set(0,0,900),this.renderer=new zp({canvas:t,antialias:!0,alpha:!0,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.setClearColor(527120,0),this.renderer.outputColorSpace=Tn,this.controls=new Vp(this.camera,t),this.controls.enableDamping=!0,this.controls.dampingFactor=.075,this.controls.zoomToCursor=!0,this.controls.minDistance=100,this.controls.maxDistance=2800,this.controls.rotateSpeed=.46,this.controls.panSpeed=.82,this.controls.zoomSpeed=.85,this.controls.target.set(0,0,0),this.graphGroup.name="cgrx-project-graph",this.scene.add(this.graphGroup),this.scene.add(this.starfield),this.raycaster.params.Line.threshold=5,this.resizeObserver=new ResizeObserver(()=>this.resize()),this.resizeObserver.observe(t.parentElement||t),this.bindEvents(),this.resize(),this.animate()}bindEvents(){let t={signal:this.eventController.signal};this.canvas.addEventListener("pointerdown",n=>{this.pointerDown={x:n.clientX,y:n.clientY}},t),this.canvas.addEventListener("pointermove",n=>this.handlePointerMove(n),t),this.canvas.addEventListener("pointerleave",()=>{this.hoveredId=null,this.canvas.style.cursor="grab",this.applyFocus(this.selectedId)},t),this.canvas.addEventListener("click",n=>this.handleClick(n),t),this.canvas.addEventListener("dblclick",n=>this.handleDoubleClick(n),t)}resize(){let t=this.canvas.parentElement,n=Math.max(1,t?.clientWidth||this.canvas.clientWidth||1),i=Math.max(1,t?.clientHeight||this.canvas.clientHeight||1);this.renderer.setSize(n,i,!1),this.camera.aspect=n/i,this.camera.updateProjectionMatrix()}render(t,n,{selectedId:i=null}={}){this.graph=t,this.layout=n,this.selectedId=i==null?null:String(i);let s=`${t.snapshot?.repo_revision||""}:${t.snapshot?.graph_generation||""}:${n.nodes.length}:${t.edges?.length||0}`,a=this.lastSignature!==s;this.lastSignature=s,this.clearGraph();let r=new Map((n.communities||[]).map((c,h)=>[c.id,h])),o=Math.max(1,r.size),l=Math.max(.9,Math.min(1.45,1180/Math.max(980,n.width)));for(let c of n.communities||[])this.addCommunity(c,r.get(c.id)||0,o,n,l);for(let c of n.nodes||[]){let h=LU(c,n,r,o,l);this.positionById.set(String(c.node_id),h),this.addNode(c,h)}for(let c of t.edges||[])this.addEdge(c);this.applyFocus(this.selectedId),a&&this.resetView(!1),this.updateLabelVisibility()}clearGraph(){this.graphGroup.clear();for(let t of this.disposables)t.dispose?.();this.disposables=[],this.nodeObjects=[],this.edgeObjects=[],this.communityObjects=[],this.nodeById.clear(),this.positionById.clear(),this.labelObjects=[],this.activeLabelIds=null}addCommunity(t,n,i,s,a){let r=gT(t.x,t.y,s,a);r.z=vT(n,i)*.72;let o=Math.max(44,t.radius*a),l=new Xt(kp[n%kp.length]),c=new Wa({map:this.glowTexture,color:l,transparent:!0,opacity:.065,depthWrite:!1,depthTest:!1,blending:tr}),h=new Gr(c);h.position.copy(r).add(new z(0,0,-18)),h.scale.set(o*2.75,o*2.2,1),h.renderOrder=-3,h.userData={kind:"community",communityId:t.id,baseOpacity:c.opacity},this.graphGroup.add(h),this.communityObjects.push(h),this.disposables.push(c);let f=[];for(let g=0;g<dT;g+=1){let d=g/dT*Math.PI*2;f.push(new z(r.x+Math.cos(d)*o,r.y+Math.sin(d)*o,r.z))}let u=new vn().setFromPoints(f),p=new Hr({color:l,transparent:!0,opacity:.1,depthWrite:!1}),m=new hu(u,p);m.renderOrder=-1,this.graphGroup.add(m),this.disposables.push(u,p);let S=fT(pT(t.label||`cluster ${n+1}`,28),{color:kp[n%kp.length],opacity:.62,fontSize:12});S.position.set(r.x-o*.72,r.y+o*.72,r.z+4),S.scale.multiplyScalar(.9),this.graphGroup.add(S),this.disposables.push(S.material),S.material.map&&this.disposables.push(S.material.map)}addNode(t,n){let i=new Xt(t.color||"#69d8ff"),s=new qa({color:i,transparent:!0,opacity:.9,depthWrite:!0}),a=new Yn(this.nodeGeometry,s);a.position.copy(n),a.scale.setScalar(Math.max(3.2,t.radius*.64)),a.userData={kind:"node",node:t,baseColor:i.clone()},this.graphGroup.add(a),this.nodeObjects.push(a),this.nodeById.set(String(t.node_id),a),this.disposables.push(s);let r=new Wa({map:this.glowTexture,color:i,transparent:!0,opacity:.11,depthWrite:!1,blending:Eu}),o=new Gr(r),l=Math.max(13,t.radius*3.4);if(o.scale.set(l/a.scale.x,l/a.scale.y,1),o.userData={kind:"halo",nodeId:String(t.node_id),baseOpacity:.11},a.add(o),this.disposables.push(r),t.cycle){let h=new qa({color:15910509,wireframe:!0,transparent:!0,opacity:.72,depthWrite:!1}),f=new Yn(this.nodeGeometry,h);f.scale.setScalar(1.17),a.add(f),this.disposables.push(h)}let c=fT(pT(t.symbol,28),{color:"#dcebf6",opacity:t.showLabel?.88:0,fontSize:13});c.position.copy(n).add(new z(Math.max(12,t.radius+8),0,4)),c.userData={kind:"label",nodeId:String(t.node_id),major:!!t.showLabel},this.graphGroup.add(c),this.labelObjects.push(c),this.disposables.push(c.material),c.material.map&&this.disposables.push(c.material.map)}addEdge(t){let n=this.positionById.get(String(t.source)),i=this.positionById.get(String(t.target));if(!n||!i)return;let s=new vn().setFromPoints(UU(n,i,`${t.source}:${t.target}`)),a=Math.max(1,Number(t.weight||1)),r=Math.max(.045,Math.min(.28,.05+Math.log2(a+1)*.038)),o=new Hr({color:7438482,transparent:!0,opacity:r,depthWrite:!1}),l=new bl(s,o);l.userData={kind:"edge",edge:t,baseOpacity:r},this.graphGroup.add(l),this.edgeObjects.push(l),this.disposables.push(s,o)}setSelected(t){this.selectedId=t==null?null:String(t),this.applyFocus(this.hoveredId||this.selectedId)}focusNode(t){let n=this.nodeById.get(String(t));if(!n)return;let i=n.position.clone(),s=this.camera.position.clone().sub(this.controls.target),a=Ts.clamp(s.length(),260,560);s.lengthSq()<1&&s.set(0,0,1),s.normalize().multiplyScalar(a);let r=i.clone().add(s);this.focusAnimation={startedAt:performance.now(),duration:420,fromTarget:this.controls.target.clone(),toTarget:i,fromCamera:this.camera.position.clone(),toCamera:r}}resetView(t=!0){if(!this.nodeObjects.length)return;let n=new xs;for(let c of this.nodeObjects)n.expandByPoint(c.position);let i=n.getBoundingSphere(new Ss),s=Math.max(90,i.radius+70),a=Ts.degToRad(this.camera.fov),r=Ts.clamp(s/Math.tan(a/2)*1.06,320,2200),o=i.center,l=new z(o.x,o.y+s*.08,o.z+r);if(!t){this.controls.target.copy(o),this.camera.position.copy(l),this.controls.update();return}this.focusAnimation={startedAt:performance.now(),duration:460,fromTarget:this.controls.target.clone(),toTarget:o.clone(),fromCamera:this.camera.position.clone(),toCamera:l}}zoom(t){let n=this.camera.position.clone().sub(this.controls.target),i=Ts.clamp(n.length()/t,this.controls.minDistance,this.controls.maxDistance);n.lengthSq()<1&&n.set(0,0,1),this.camera.position.copy(this.controls.target).add(n.normalize().multiplyScalar(i)),this.controls.update()}handlePointerMove(t){if(!this.layout)return;let n=this.pick(t,!0),i=n?.object?.userData?.kind==="node"?String(n.object.userData.node.node_id):null;i!==this.hoveredId&&(this.hoveredId=i,this.canvas.style.cursor=i?"pointer":"grab",this.applyFocus(this.hoveredId||this.selectedId))}handleClick(t){if(!this.layout||PU(this.pointerDown,t))return;let n=this.pick(t,!1);if(n){if(n.object.userData.kind==="node"){this.callbacks.onNodeSelect?.(n.object.userData.node);return}if(n.object.userData.kind==="edge"){let i=n.object.userData.edge,s=this.layout.nodes.find(r=>String(r.node_id)===String(i.source)),a=this.layout.nodes.find(r=>String(r.node_id)===String(i.target));s&&a&&this.callbacks.onEdgeSelect?.(i,s,a)}}}handleDoubleClick(t){let n=this.pick(t,!0);n?.object?.userData?.kind==="node"&&this.callbacks.onNodeOpen?.(n.object.userData.node)}pick(t,n){let i=this.canvas.getBoundingClientRect();if(!i.width||!i.height)return null;this.pointer.x=(t.clientX-i.left)/i.width*2-1,this.pointer.y=-((t.clientY-i.top)/i.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera);let s=this.raycaster.intersectObjects(this.nodeObjects,!1);return s.length||n?s[0]||null:this.raycaster.intersectObjects(this.edgeObjects,!1)[0]||null}applyFocus(t){let n=t==null?null:String(t),i=new Set(n?[n]:[]);if(n)for(let a of this.graph?.edges||[]){let r=String(a.source),o=String(a.target);r===n&&i.add(o),o===n&&i.add(r)}this.activeLabelIds=n?i:null;let s=n?this.layout?.nodes.find(a=>String(a.node_id)===n)?.community:null;for(let a of this.nodeObjects){let r=String(a.userData.node.node_id),o=!n||i.has(r),l=r===n;a.material.opacity=o?.94:.075,a.material.color.copy(a.userData.baseColor),l&&a.material.color.lerp(new Xt(16777215),.34);let c=a.children.find(h=>h.userData.kind==="halo");c&&(c.material.opacity=l?.48:o?.14:.012)}for(let a of this.edgeObjects){let r=a.userData.edge,o=!!(n&&(String(r.source)===n||String(r.target)===n));a.material.opacity=n?o?.92:.014:Number(a.userData.baseOpacity),a.material.color.setHex(o?15858687:7438482)}for(let a of this.communityObjects){let r=!n||a.userData.communityId===s;a.material.opacity=Number(a.userData.baseOpacity)*(r?1:.24)}this.updateLabelVisibility()}updateLabelVisibility(){let n=this.camera.position.distanceTo(this.controls.target)<650,i=this.hoveredId||this.selectedId;for(let s of this.labelObjects){let a=String(s.userData.nodeId),r=!!(i&&a===String(i)),o=!this.activeLabelIds||this.activeLabelIds.has(a);s.visible=o&&(!!s.userData.major||n||r),s.material.opacity=r?1:s.userData.major?.84:.66}}animate(){this.disposed||(this.frameId=requestAnimationFrame(()=>this.animate()),!this.canvas.hidden&&(this.focusAnimation&&this.stepFocusAnimation(),this.controls.update(),this.updateLabelVisibility(),this.renderer.render(this.scene,this.camera)))}stepFocusAnimation(){let t=this.focusAnimation;if(!t)return;let n=Ts.clamp((performance.now()-t.startedAt)/t.duration,0,1),i=1-Math.pow(1-n,3);this.controls.target.lerpVectors(t.fromTarget,t.toTarget,i),this.camera.position.lerpVectors(t.fromCamera,t.toCamera,i),n>=1&&(this.focusAnimation=null)}dispose(){this.disposed||(this.disposed=!0,cancelAnimationFrame(this.frameId),this.eventController.abort(),this.resizeObserver.disconnect(),this.controls.dispose(),this.clearGraph(),this.nodeGeometry.dispose(),this.glowTexture.dispose(),this.starfield.geometry.dispose(),this.starfield.material.dispose(),this.renderer.dispose())}};function LU(e,t,n,i,s){let a=gT(e.x,e.y,t,s),r=n.get(e.community)||0;return a.z=vT(r,i)+_T(String(e.node_id))*58,a}function UU(e,t,n){let i=e.clone().lerp(t,.5),s=t.clone().sub(e),a=Math.max(1,s.length()),r=new z(-s.y,s.x,0).normalize(),o=Math.min(42,Math.max(8,a*.085))*_T(n);return i.addScaledVector(r,o),i.z+=Math.min(24,a*.035),new mu(e,i,t).getPoints(18)}function gT(e,t,n,i){return new z((Number(e)-n.width/2)*i,-(Number(t)-n.height/2)*i,0)}function vT(e,t){if(t<=1)return 0;let n=e-(t-1)/2;return Ts.clamp(n*26,-150,150)}function _T(e){let t=2166136261;for(let n of String(e))t^=n.charCodeAt(0),t=Math.imul(t,16777619);return(t>>>0)/4294967295*2-1}function IU(){let e=document.createElement("canvas");e.width=96,e.height=96;let t=e.getContext("2d");if(!t)throw new Error("2D canvas context is unavailable");let n=t.createRadialGradient(48,48,0,48,48,48);n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.34,"rgba(255,255,255,.62)"),n.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=n,t.fillRect(0,0,96,96);let i=new El(e);return i.colorSpace=Tn,i}function fT(e,t={}){let n=t.fontSize||13,i=document.createElement("canvas"),s=i.getContext("2d");if(!s)throw new Error("2D canvas context is unavailable");s.font=`600 ${n*2}px ui-monospace, SFMono-Regular, Menlo, monospace`;let a=Math.ceil(s.measureText(e).width+28);i.width=Math.max(64,a),i.height=Math.ceil(n*3.2),s.font=`600 ${n*2}px ui-monospace, SFMono-Regular, Menlo, monospace`,s.textBaseline="middle",s.fillStyle=t.color||"#dcebf6",s.shadowColor="rgba(0,0,0,.94)",s.shadowBlur=7,s.fillText(e,12,i.height/2);let r=new El(i);r.colorSpace=Tn;let o=new Wa({map:r,transparent:!0,opacity:t.opacity??.86,depthWrite:!1,depthTest:!1}),l=new Gr(o),c=18;return l.scale.set(c*i.width/i.height,c,1),l.center.set(0,.5),l.renderOrder=10,l}function OU(){let e=new vn,t=850,n=new Float32Array(t*3),i=2402408747,s=()=>(i=Math.imul(i^i>>>15,1|i),i^=i+Math.imul(i^i>>>7,61|i),((i^i>>>14)>>>0)/4294967296);for(let r=0;r<t;r+=1)n[r*3]=(s()-.5)*2600,n[r*3+1]=(s()-.5)*1800,n[r*3+2]=-250-s()*1200;e.setAttribute("position",new Xn(n,3));let a=new Ml({color:6783125,size:1.7,transparent:!0,opacity:.28,depthWrite:!1});return new du(e,a)}function PU(e,t){return e?Math.hypot(t.clientX-e.x,t.clientY-e.y)>5:!1}function pT(e,t){let n=String(e||"");return n.length<=t?n:`${n.slice(0,t-1)}\u2026`}function yT(e,t=Date.now()*1e6){let n=typeof e.evidence=="string"?e.evidence:"";if(!n.includes("observed"))return null;let i=Math.max(1,Number(e.count)||1),s=Math.max(0,(t-Number(e.last_seen_unix_nanos||t))/864e11),a=Math.max(.35,Math.min(1,1-s/30)),r=Math.min(6,1.7+Math.log2(i+1));return{dash:n==="observed"?"5 5":"2 3",marker:"\u25CF",width:r,opacity:a,label:`${i.toLocaleString("en-US")} calls \xB7 ${(e.environments||[]).join(", ")||"runtime"}`}}function xT(e,t){let n=new URLSearchParams({evidence:e});for(let i of[...new Set(t)].sort())n.append("environment",i);return n.toString()}function ST(e,t=[]){let i=(Array.isArray(e.edges)?e.edges:[]).filter(s=>typeof s.evidence=="string"&&s.evidence.includes("observed"));return JSON.stringify({schema:"cgrx.agent.runtime-overlay.v1",snapshot:e.snapshot,root:e.root,evidence:e.evidence,environment_filter:e.environment_filter||[],observed_edges:i,runtime_gaps:e.runtime_gaps||{unresolved:0,ambiguous:0},deterministic_insights:t,constraints:{llm_used:!1,revalidate_snapshot_before_edit:!0,observed_paths_are_execution_evidence_not_exhaustive_coverage:!0}},null,2)}function bT(e){return JSON.stringify(e.agent_handoff,null,2)}function MT(e){let t=e?.change_plan||e||{},n=(t.missions||[]).map(a=>({...a,title:a.change_paths?.[0]||a.review_paths?.[0]||a.mission_id,evidenceCount:(a.finding_indexes?.length||0)+(a.impact_indexes?.length||0),testCount:a.related_test_indexes?.length||0})),i=new Map(n.map(a=>[a.mission_id,a])),s=(t.execution_order||[]).map((a,r)=>({index:r,missions:a.map(o=>i.get(o)).filter(Boolean)}));return{snapshot:t.snapshot,groups:s,missions:n,dependencies:n.flatMap(a=>(a.depends_on||[]).map(r=>({source:r,target:a.mission_id}))),totals:t.totals||{missions:n.length,parallel_groups:s.length,blocked:0},partial:!!t.partial,agent_handoff:t.agent_handoff}}function ET(e){return JSON.stringify(e.agent_handoff,null,2)}function TT(e,t,n){let i=t.agent_handoff||{};return{...i,schema_version:"cgrx.agent.architecture-future.v1",snapshot:i.snapshot||e,issue:i.issue||(t.kind==="PACKAGE_DEPENDENCY_CYCLE"?{kind:t.kind,packages:t.packages,selected_boundary:t.selected_boundary}:{kind:t.kind,symbol:t.symbol}),strategy_id:n.strategy_id,policy:n.policy,predicted_graph:n.predicted_graph,llm_used:!1,constraints:{...i.constraints||{},llm_used:!1,revalidate_snapshot_before_edit:!0,preserve_proven_edges_unless_listed:!0},verification:i.verification||["Re-index edited source before accepting the predicted graph.","Confirm the targeted cycle or hotspot changed as predicted.","Report remaining coverage gaps separately from proven graph changes."]}}function wT(e){let t=e.candidates?.length||0,n=!!e.partial,i=`${e.total>t?`${t}/${e.total}`:e.total}${n?" \xB7 partial":""}`,s=e.coverage_gap_count||0;return{count:i,note:n?`Bounded result \xB7 ${s} coverage gaps. Destructive paths stay blocked.`:""}}function C_(e,t){let n=new Map;for(let r of e.nodes||[])n.set(Cs(r),{...r});let i=(r,o="entrypoints")=>{if(!r||Cs(r)==="")return;let l=Cs(r);n.has(l)||n.set(l,{...r,node_id:r.node_id??r.id,lane:o,path:r.path||"proposed",span:r.span||{start:0,end:0},source_hash:r.source_hash||"hypothetical",status:r.status||"hypothetical"})};for(let r of t.verification?.review_symbols||[])i(r);let s=(e.edges||[]).map(r=>({...r,status:"preserved"})),a=t.graph_delta||{};for(let r of a.preserve||[]){i(r.source,"callers"),i(r.target,"entrypoints");let o=Cs(r.source),l=Cs(r.target);s.some(h=>String(h.source)===o&&String(h.target)===l&&h.relation===r.relation)||s.push({...r,source:o,target:l,status:"preserved"})}for(let[r,o]of[[a.add,"hypothetical"],[a.redirect,"hypothetical"],[a.move_to_helper,"hypothetical"]])for(let l of r||[])i(l.source,(l.source?.status==="hypothetical","entrypoints")),i(l.target,l.target?.status==="hypothetical"?"entrypoints":"callees"),s.push({...l,source:Cs(l.source),target:Cs(l.target),confidence:o==="hypothetical"?"hypothetical":l.confidence,status:o});for(let r of a.remove||[]){i(r);let o=Cs(r);n.set(o,{...n.get(o),status:"remove"})}return{...e,nodes:[...n.values()],edges:s,projection:t.strategy_id}}function AT(e){let t=new Set((e.cycles||[]).flatMap(s=>s.packages||[])),n=(e.packages||[]).map(s=>({node_id:`package:${s.name}`,symbol:s.name,path:s.name,span:{start:0,end:0},source_hash:"package-projection",lane:"entrypoints",kind:"package",files:s.files,symbols:s.symbols,fan_in:s.fan_in,fan_out:s.fan_out,cycle:t.has(s.name),status:"current"})),i=(e.boundaries||[]).map(s=>({source:`package:${s.source}`,target:`package:${s.target}`,relation:(s.relations||[]).join("+")||"CALLS",confidence:s.confidence,status:"current",evidence:s.evidence?.[0],evidence_count:s.edges}));return{snapshot:e.snapshot,root:{symbol:"Architecture",path:"."},nodes:n,edges:i,containers:[],partial:e.partial,coverage_gap_count:e.coverage_gap_count}}function CT(e){let t=e.packages||[],n=t.map(f=>f.name).sort((f,u)=>u.length-f.length),i=new Map,s=(e.communities||[]).map((f,u)=>{let p=`community:${u}`;for(let m of f.packages||[])i.set(m,p);return{id:p,label:(f.packages||[])[0]||`cluster ${u+1}`,packages:f.packages||[],cohesion:Number(f.cohesion||0),internal_weight:Number(f.internal_weight||0),cut_weight:Number(f.cut_weight||0)}}),a=t.filter(f=>!i.has(f.name)).map(f=>f.name);a.length&&s.push({id:"community:unclustered",label:"unclustered",packages:a,cohesion:0,internal_weight:0,cut_weight:0});let r=new Map(t.map(f=>[f.name,[]])),o=f=>n.find(u=>f===u||f.startsWith(`${u}/`));for(let f of e.symbol_communities||[])for(let u of f.top_nodes||[]){let p=o(u.path||"");if(!p)continue;let m=r.get(p);!m.some(S=>S.node_id===u.node_id)&&m.length<6&&m.push(u)}let l=new Set((e.cycles||[]).flatMap(f=>f.packages||[])),c=t.map(f=>({node_id:`package:${f.name}`,symbol:f.name,path:f.name,kind:"project-package",community:i.get(f.name)||"community:unclustered",files:Number(f.files||0),symbols:Number(f.symbols||0),fan_in:Number(f.fan_in||0),fan_out:Number(f.fan_out||0),degree:Number(f.fan_in||0)+Number(f.fan_out||0),cycle:l.has(f.name),representatives:r.get(f.name)||[],status:"current"})),h=(e.boundaries||[]).map(f=>({source:`package:${f.source}`,target:`package:${f.target}`,relation:(f.relations||[]).join("+")||"DEPENDENCY",confidence:f.confidence||"PROVEN",weight:Number(f.edges||1),status:"current",evidence:f.evidence?.[0]}));return{snapshot:e.snapshot,root:{symbol:"Project map",path:"."},nodes:c,edges:h,communities:s,totals:e.totals||{},partial:!!e.partial,coverage_gap_count:Number(e.coverage_gap_count||0),package_depth:e.package_depth}}function RT(e,t,n){let i=(e.nodes||[]).map(o=>({...o})),s=(e.edges||[]).map(o=>({...o,status:"preserved"})),a=o=>{i.some(l=>Cs(l)===Cs(o))||i.push(o)},r=(o,l,c)=>s.push({source:o,target:l,relation:c,confidence:"hypothetical",status:"hypothetical"});if(t?.kind==="PACKAGE_DEPENDENCY_CYCLE"){let o=`package:${t.selected_boundary?.source}`,l=`package:${t.selected_boundary?.target}`;if(n.policy!=="preserve_and_monitor"&&(s=s.filter(c=>!(String(c.source)===o&&String(c.target)===l))),n.policy==="invert_dependency"&&r(l,o,"INVERTED_DEPENDENCY"),n.policy==="extract_contract"){let c=Xp(`future:contract:${t.issue_id}`,`${t.selected_boundary.source} \u2194 ${t.selected_boundary.target} contract`,"contract");a(c),r(o,c.node_id,"DEPENDS_ON_CONTRACT"),r(l,c.node_id,"DEPENDS_ON_CONTRACT")}}if(t?.kind==="HIGH_FAN_IN_HOTSPOT"){let o=Xp(`hotspot:${t.issue_id}`,t.symbol?.symbol||"hotspot","hotspot",t.symbol?.path||"observed hotspot");if(o.status="current",o.fan_in=t.symbol?.fan_in,a(o),n.policy==="introduce_facade"){let l=Xp(`future:facade:${t.issue_id}`,"stable facade","facade");a(l),r(l.node_id,o.node_id,"DELEGATES_TO")}if(n.policy==="split_by_community")for(let l of[1,2]){let c=Xp(`future:community:${t.issue_id}:${l}`,`caller community ${l}`,"community-split");a(c),r(c.node_id,o.node_id,"PARTITIONED_CALLS")}}return{...e,nodes:i,edges:s,projection:n.strategy_id,architecture_issue:t.issue_id}}function Xp(e,t,n,i="proposed"){return{node_id:e,symbol:t,path:i,span:{start:0,end:0},source_hash:"hypothetical",lane:"entrypoints",kind:n,status:"hypothetical"}}function Cs(e){return e==null?"":String(typeof e=="string"||typeof e=="number"?e:e.node_id??e.id??"")}function R_(e){return e?`${e.repo_revision}:${e.working_tree_digest}:${e.graph_generation}`:""}var F=es(cr(),1),NT={x:0,y:0,scale:1},BU=[{id:"project",label:"Project map"},{id:"current",label:"Current"},{id:"architecture",label:"Architecture"},{id:"changes",label:"Changes"},{id:"preview",label:"Preview"},{id:"compare",label:"Compare"},{id:"history",label:"Git history"}],zU=[{id:"static",label:"Static"},{id:"observed",label:"Runtime"},{id:"all",label:"Combined"}],LT=`cgrx-token:${location.host}`,FU=new URLSearchParams(location.hash.slice(1)),N_=FU.get("token")||sessionStorage.getItem(LT)||"";N_&&sessionStorage.setItem(LT,N_);location.hash&&history.replaceState(null,"",`${location.pathname}${location.search}`);v1();async function ia(e,t){let n=await fetch(e,{headers:{"X-CGRX-Token":N_},cache:"no-store",signal:t}),i=await n.json();if(!n.ok)throw new Error(i?.error?.detail||`Request failed: ${n.status}`);return i}function GU(){let[e,t]=(0,ot.useState)(null),[n,i]=(0,ot.useState)("connecting"),[s,a]=(0,ot.useState)("project"),[r,o]=(0,ot.useState)("2d"),[l,c]=(0,ot.useState)(!0),[h,f]=(0,ot.useState)(!1),[u,p]=(0,ot.useState)(!1),[m,S]=(0,ot.useState)("static"),[g,d]=(0,ot.useState)(""),[v,b]=(0,ot.useState)(NT),[x,T]=(0,ot.useState)({}),[E,w]=(0,ot.useState)(""),[_,A]=(0,ot.useState)([]),[N,C]=(0,ot.useState)(0),[U,O]=(0,ot.useState)(""),[D,G]=(0,ot.useState)(null),[q,Z]=(0,ot.useState)(null),[nt,Y]=(0,ot.useState)(null),[$,st]=(0,ot.useState)([]),[Lt,Nt]=(0,ot.useState)(!1),[he,ne]=(0,ot.useState)(null),[oe,J]=(0,ot.useState)(""),[it,St]=(0,ot.useState)(null),[zt,yt]=(0,ot.useState)(""),[Ft,We]=(0,ot.useState)(null),[Wt,ae]=(0,ot.useState)(""),[pe,qt]=(0,ot.useState)(null),[Ee,qe]=(0,ot.useState)(null),[Ve,Ae]=(0,ot.useState)(null),[re,B]=(0,ot.useState)(null),[Ye,Qt]=(0,ot.useState)({kind:"none",facts:[]}),[R,y]=(0,ot.useState)("Trace evidence, then compare futures."),[H,X]=(0,ot.useState)("");(0,ot.useEffect)(()=>{f(!1)},[Ye]),(0,ot.useEffect)(()=>{let L=pt=>{let Kt=pt.target;Kt.matches("input, textarea, select")||Kt.isContentEditable||(pt.key==="/"&&(pt.preventDefault(),c(!0),requestAnimationFrame(()=>document.getElementById("search-input")?.focus())),pt.key==="?"&&p(M=>!M),pt.key==="Escape"&&(p(!1),f(!0)))};return window.addEventListener("keydown",L),()=>window.removeEventListener("keydown",L)},[Ye]);let j=(0,ot.useRef)(null),rt=(0,ot.useRef)(null),lt=(0,ot.useRef)(m),K=(0,ot.useRef)(g),tt=(0,ot.useRef)(v),ct=(0,ot.useRef)(null),At=(0,ot.useRef)(0),ft=(0,ot.useRef)(null),ut=(0,ot.useRef)(null);(0,ot.useEffect)(()=>{j.current=e},[e]),(0,ot.useEffect)(()=>{rt.current=D},[D]),(0,ot.useEffect)(()=>{lt.current=m},[m]),(0,ot.useEffect)(()=>{K.current=g},[g]),(0,ot.useEffect)(()=>{tt.current=v},[v]);let Mt=(0,ot.useCallback)(async(L,pt)=>{let Kt=++At.current;y("Loading verified neighborhood\u2026");let M=K.current?[K.current]:[],I=await ia(`/api/graph?symbol=${encodeURIComponent(L)}&path=${encodeURIComponent(pt)}&direction=both&depth=1&node_limit=80&edge_limit=160&${xT(lt.current,M)}`);Kt===At.current&&(G(I),rt.current=I,t(I.snapshot),j.current=I.snapshot,qt(W=>I.nodes.some(V=>String(V.node_id)===String(W))?W:null),y(""))},[]),Dt=(0,ot.useCallback)(async(L,pt)=>{a("current"),await Mt(L,pt)},[Mt]),Gt=(0,ot.useCallback)(async()=>{let L=await ia("/api/architecture?scope=**&package_depth=2&limit=300");Z(AT(L)),Y(CT(L)),st(L.architecture_plan?.issues||[]),Nt(!!L.partial)},[]),P=(0,ot.useCallback)(async()=>{try{let L=await ia("/api/refactors?scope=**&min_score=760&limit=8");ne(L),J("")}catch(L){J(ar(L))}},[]),dt=(0,ot.useCallback)(async()=>{try{let L=await ia("/api/runtime-status");St(L),yt("");let pt=L.environments||[];K.current&&!pt.includes(K.current)&&(K.current="",d(""))}catch(L){yt(ar(L))}},[]),Q=(0,ot.useCallback)(async()=>{try{let L=await ia("/api/change-plan?limit=20");We(MT(L)),ae("")}catch(L){We(null),ae(ar(L))}},[]),ht=(0,ot.useCallback)(async()=>{await Promise.all([Q(),dt(),Gt(),P()])},[Gt,Q,P,dt]),mt=(0,ot.useCallback)(async(L=!0)=>{try{let pt=await ia("/api/status"),Kt=R_(j.current),M=R_(pt.snapshot),I=!!(Kt&&Kt!==M);if(t(pt.snapshot),j.current=pt.snapshot,i(I?"refreshing":"live"),I&&L){qe(null),Ae(null),B(null),await ht();let W=rt.current?.root;W&&await Mt(W.symbol,W.path),i("live")}}catch(pt){i("offline"),y(ar(pt))}},[Mt,ht]);(0,ot.useEffect)(()=>{let L=!1;(async()=>{await mt(!1),L||await ht()})();let Kt=window.setInterval(()=>{mt(!0)},2500);return()=>{L=!0,window.clearInterval(Kt)}},[mt,ht]),(0,ot.useEffect)(()=>{let L=Kt=>{let M=ut.current;if(!M)return;let I=Math.max(.1,tt.current.scale);T(W=>({...W,[M.key]:{x:M.origin.x+(Kt.clientX-M.x)/I,y:M.origin.y+(Kt.clientY-M.y)/I}}))},pt=()=>{ut.current=null};return document.addEventListener("pointermove",L),document.addEventListener("pointerup",pt),()=>{document.removeEventListener("pointermove",L),document.removeEventListener("pointerup",pt)}},[]);let at=async L=>{L.preventDefault();let pt=E.trim();if(pt)try{let Kt=await ia(`/api/search?q=${encodeURIComponent(pt)}&scope=**&limit=12`);A(Kt.matches),C(Kt.total),O("")}catch(Kt){O(ar(Kt))}},Ct=L=>{qt(L.node_id),Qt({kind:"package",facts:[["Package",L.symbol],["Community",L.community.replace("community:","")],["Files",L.files],["Symbols",L.symbols],["Incoming",L.fan_in],["Outgoing",L.fan_out],["Cycle",L.cycle?"candidate package cycle":"none detected"]],representatives:L.representatives}),ct.current?.focusNode(L.node_id)},Et=async L=>{qt(L.node_id);let pt=[["Symbol",L.symbol],["Path",L.path],["Span",L.span?`${L.span.start}\u2013${L.span.end}`:"unknown"],["Source hash",L.source_hash],["State",L.status==="hypothetical"?"hypothetical future":L.lane==="tests"?"candidate \xB7 not run":"current \xB7 indexed"]];if(L.kind==="package"&&pt.push(["Files",L.files],["Symbols",L.symbols],["Fan in",L.fan_in],["Fan out",L.fan_out],["Cycle",L.cycle?"candidate package cycle":"none detected"]),Qt({kind:L.lane||"node",facts:pt}),L.kind!=="package")try{let Kt=await ia(`/api/snippet?symbol=${encodeURIComponent(L.symbol)}&path=${encodeURIComponent(L.path)}`);Qt({kind:L.lane||"node",facts:pt,code:Kt.source||Kt.declaration||"Source unavailable."})}catch(Kt){Qt({kind:L.lane||"node",facts:pt,error:ar(Kt)})}},me=(L,pt,Kt)=>{let M=typeof L.evidence=="object"&&L.evidence?L.evidence:{};Qt({kind:"edge",facts:[["Relationship",`${pt.symbol} \u2192 ${Kt.symbol}`],["Kind",L.relation],["Confidence",L.confidence],["Resolver","resolver"in M?M.resolver:"indexed"],["Evidence site","path"in M?`${M.path}:${M.span?.start??"?"}`:"hypothetical"],["Source hash","source_hash"in M?M.source_hash:"not applicable"],...L.count?[["Observed calls",L.count],["Environments",(L.environments||[]).join(", ")],["Last seen",L.last_seen_unix_nanos]]:[]]})},le=L=>{a("changes"),Qt({kind:"mission",facts:[["Mission",L.mission_id],["Kind",L.kind],["Parallel group",L.parallel_group+1],["Depends on",L.depends_on?.join(", ")||"none"],["Change paths",L.change_paths?.join(", ")||"none"],["Review paths",L.review_paths?.join(", ")||"none"],["Evidence",L.evidenceCount],["Candidate tests",L.testCount],["Coverage",L.blocked_by_gaps?"blocked by gaps":"ready for review"],["Steps",L.steps?.join(" \u2192 ")||"inspect"]]})},Pn=(L,pt=Ve)=>{let Kt=pt?{...L,agent_handoff:TT(e,pt,L)}:L;B(Kt)},Mi=L=>{qe(L),Ae(null),a("current"),Pn(L.strategies[0],null),Mt(L.left.symbol,L.left.path)},Wp=L=>{qe(null),Ae(L),a("architecture"),Pn(L.strategies[0],L)},rr=async(L,pt)=>{await navigator.clipboard.writeText(L),X(pt)},Pu=()=>{re&&rr(bT(re),"Agent plan copied")},Pl=()=>{if(Ve){rr(JSON.stringify({tool:"get_architecture",arguments:{scope:"**",package_depth:2,limit:50},selected_issue_id:Ve.issue_id,selected_strategy_id:re?.strategy_id,revalidate_snapshot:e},null,2),"Architecture MCP call copied");return}Ee&&rr(JSON.stringify({tool:"suggest_refactors",arguments:{scope:{include:["**"],exclude:[],relation_kinds:["CALLS","IMPLEMENTS"],max_depth:1},language:Ee.language,min_score:760,limit:8},revalidate_snapshot:e},null,2),"MCP call copied")},Bl=L=>{if(s==="project"){ct.current?.zoom(L);return}b(pt=>({...pt,scale:JU(pt.scale*L,.45,2.4)}))},Bu=()=>{if(T({}),s==="project"){ct.current?.resetView();return}b(NT)},zu=L=>{lt.current=L,S(L);let pt=rt.current?.root;pt&&Mt(pt.symbol,pt.path).catch(Kt=>y(ar(Kt)))},Rs=L=>{K.current=L,d(L);let pt=rt.current?.root;pt&&Mt(pt.symbol,pt.path).catch(Kt=>y(ar(Kt)))},zl=L=>{s==="project"||L.target.closest?.("[data-graph-interactive='true']")||(ft.current={pointerId:L.pointerId,x:L.clientX,y:L.clientY,camera:v},L.currentTarget.setPointerCapture(L.pointerId))},Fu=L=>{let pt=ft.current;!pt||pt.pointerId!==L.pointerId||s==="project"||b({...pt.camera,x:pt.camera.x+L.clientX-pt.x,y:pt.camera.y+L.clientY-pt.y})},Gu=()=>{ft.current=null},or=(0,ot.useMemo)(()=>s==="architecture"?q?Ve&&re?RT(q,Ve,re):q:null:D?s==="preview"&&re?C_(D,re):D:null,[q,D,s,Ve,re]),Hu=s==="project"?"Project map":s==="architecture"?Ve&&re?`Architecture \xB7 ${re.policy.replaceAll("_"," ")}`:"Architecture":s==="changes"?"Change missions":s==="history"?"Git history":D?.root.symbol||"Focused graph",Yr=s==="project"?"Repository topology":s==="architecture"?"Architecture projection":s==="changes"?"Deterministic execution DAG":s==="history"?"Repository history":"Focused neighborhood",Zr=he?wT(he):{count:"0",note:""},lr=$.slice(0,12),sa=it?.insights?.rows||[],Vu=Ve?.strategies||Ee?.strategies||[];return(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)("a",{className:"skip-link",href:"#graph-canvas",children:"Skip to graph"}),(0,F.jsxs)("header",{className:"topbar",children:[(0,F.jsxs)("div",{className:"brand","aria-label":"CGRX Evidence Graph Explorer",children:[(0,F.jsx)("strong",{children:"CGRX"}),(0,F.jsx)("small",{children:"Code atlas"})]}),(0,F.jsxs)("div",{className:"atlas-stats","aria-label":"Repository summary",children:[(0,F.jsxs)("span",{children:[nt?.nodes.length??"\u2014"," packages"]}),(0,F.jsxs)("span",{children:[nt?.edges.length??"\u2014"," connections"]}),nt?.partial&&(0,F.jsx)("span",{className:"atlas-stat--partial",children:"Partial coverage"})]}),(0,F.jsxs)("div",{className:"snapshot","aria-live":"polite",children:[(0,F.jsx)("span",{className:`badge badge--${n==="live"?"live":n==="connecting"?"loading":"stale"}`,children:n}),(0,F.jsx)("code",{title:e?.repo_revision,children:e?e.repo_revision.slice(0,9):"loading snapshot"})]})]}),(0,F.jsxs)("main",{className:`workspace atlas-workspace${s==="project"?" workspace--project":""}`,children:[(0,F.jsx)(sy,{mode:s,modes:BU,onMode:a,discoveryOpen:l,onDiscovery:()=>c(L=>!L)}),(0,F.jsxs)("aside",{id:"discovery-panel",className:"rail floating-panel","aria-label":"Graph discovery",hidden:!l,children:[(0,F.jsx)(Yu,{title:"Explore repository",detail:"Follow the connections in your code",onClose:()=>c(!1)}),(0,F.jsxs)("form",{className:"search",role:"search",onSubmit:L=>{at(L)},children:[(0,F.jsx)("label",{htmlFor:"search-input",children:"Find a symbol"}),(0,F.jsxs)("div",{className:"search__row",children:[(0,F.jsx)("input",{id:"search-input",value:E,onChange:L=>w(L.target.value),autoComplete:"off",placeholder:"Runtime, handler, save\u2026",required:!0}),(0,F.jsx)("button",{type:"submit","aria-label":"Search",children:"\u21B5"})]})]}),s==="project"&&nt&&(0,F.jsx)(Il,{title:"Packages",count:String(nt.nodes.length),defaultOpen:!0,children:nt.nodes.map(L=>(0,F.jsx)(qr,{title:L.symbol,subtitle:`${L.symbols} symbols \xB7 ${L.files} files`,onClick:()=>Ct(L)},String(L.node_id)))}),(0,F.jsx)(Il,{title:"Matches",count:String(N),defaultOpen:N>0||!!U,children:U?(0,F.jsx)("p",{className:"error",children:U}):_.length?_.map(L=>(0,F.jsx)(qr,{title:L.symbol,subtitle:`${L.path}:${L.span.start}`,onClick:()=>{Dt(L.symbol,L.path)}},`${L.path}:${L.span.start}:${L.symbol}`)):(0,F.jsx)("p",{className:"quiet",children:"Search by intent or symbol."})},`matches-${N}-${U}`),(0,F.jsx)(Il,{title:"Runtime intelligence",count:sa.length?`${sa.length}/${it?.insights?.total??sa.length}`:"0",children:zt?(0,F.jsx)("p",{className:"error",children:zt}):sa.length?sa.map(L=>(0,F.jsx)(qr,{title:L.symbol,subtitle:`priority ${L.refactor_priority} \xB7 ${L.observed_count} calls \xB7 ${L.next_action.replaceAll("_"," ")}`,onClick:()=>{Dt(L.symbol,L.path)}},`${L.path}:${L.symbol}`)):(0,F.jsx)("p",{className:"quiet",children:"Import a trace to rank hot paths, divergence and blast radius."})}),(0,F.jsx)(Il,{title:"Architecture futures",count:`${lr.length}${$.length>lr.length?`/${$.length}`:""}${Lt?" \xB7 partial":""}`,maxClass:"architecture-future-list",children:lr.length?lr.map(L=>{let pt=L.strategies.find(I=>I.recommended)||L.strategies[0],Kt=L.kind==="PACKAGE_DEPENDENCY_CYCLE"?(L.packages||[]).join(" \u2194 "):`${L.symbol?.symbol||"hotspot"} \xB7 ${Ol(L.symbol?.path||"unknown path",25)}`,M=L.kind==="PACKAGE_DEPENDENCY_CYCLE"?`${L.selected_boundary?.edges||0} boundary edges`:`${L.symbol?.fan_in||0} proven callers`;return(0,F.jsx)(qr,{title:Kt,subtitle:`${pt?.policy?.replaceAll("_"," ")||"inspect"} \xB7 ${M}`,onClick:()=>Wp(L)},L.issue_id)}):(0,F.jsx)("p",{className:"quiet",children:"No cycle or high fan-in future is available in this scope."})}),(0,F.jsx)(Il,{title:"Change missions",count:Ft?`${Ft.totals.missions}${Ft.partial?" \xB7 partial":""}`:"0",maxClass:"mission-list",children:Wt?(0,F.jsx)("p",{className:"error",children:Wt}):Ft?.missions.length?Ft.missions.slice(0,12).map(L=>(0,F.jsx)(qr,{title:L.title,subtitle:`group ${L.parallel_group+1} \xB7 ${L.kind.replaceAll("_"," ")}${L.blocked_by_gaps?" \xB7 blocked":""}`,onClick:()=>le(L)},L.mission_id)):(0,F.jsx)("p",{className:"quiet",children:"No source changes. The plan will appear as files change."})}),(0,F.jsx)(Il,{title:"Refactor paths",count:Zr.count,grow:!0,children:oe?(0,F.jsx)("p",{className:"error",children:oe}):he?.candidates.length?(0,F.jsxs)(F.Fragment,{children:[he.candidates.map(L=>(0,F.jsx)(qr,{title:`${L.left.symbol} \u2194 ${L.right.symbol}`,subtitle:`${L.language} \xB7 score ${L.similarity.total}`,onClick:()=>Mi(L)},`${L.left.node_id}:${L.right.node_id}`)),Zr.note&&(0,F.jsx)("p",{className:"quiet bounded-note",children:Zr.note})]}):(0,F.jsx)("p",{className:"quiet",children:"No candidate crossed the current threshold."})})]}),(0,F.jsxs)("section",{className:"stage","aria-labelledby":"graph-title",children:[(0,F.jsxs)("div",{className:"stage__toolbar",children:[(0,F.jsxs)("div",{children:[(0,F.jsx)("p",{className:"eyebrow",children:Yr}),(0,F.jsx)("h1",{id:"graph-title",children:Hu})]}),s==="project"&&(0,F.jsxs)("div",{className:"dimension-switch",role:"group","aria-label":"Graph dimensions",children:[(0,F.jsx)("button",{type:"button","aria-pressed":r==="2d",onClick:()=>o("2d"),children:"2D"}),(0,F.jsx)("button",{type:"button","aria-pressed":r==="3d",onClick:()=>o("3d"),children:"3D"})]}),(0,F.jsx)("button",{className:"help-toggle","aria-label":"Graph keyboard help","aria-expanded":u,onClick:()=>p(L=>!L),children:"?"}),s!=="project"&&(0,F.jsxs)(F.Fragment,{children:[(0,F.jsx)("div",{className:"evidence-switch",role:"group","aria-label":"Evidence layer",children:zU.map(L=>(0,F.jsx)("button",{type:"button",className:m===L.id?"is-active":"",onClick:()=>zu(L.id),children:L.label},L.id))}),(0,F.jsxs)("label",{className:"environment-filter",htmlFor:"runtime-environment",children:["Environment",(0,F.jsxs)("select",{id:"runtime-environment",value:g,onChange:L=>Rs(L.target.value),children:[(0,F.jsx)("option",{value:"",children:"All"}),(it?.environments||[]).map(L=>(0,F.jsx)("option",{value:L,children:L},L))]})]})]}),s!=="history"&&s!=="changes"&&(0,F.jsxs)("div",{className:"view-actions",children:[(0,F.jsx)("button",{type:"button",onClick:()=>Bl(1/1.2),"aria-label":"Zoom out",children:"\u2212"}),(0,F.jsx)("button",{type:"button",onClick:Bu,children:"Reset"}),(0,F.jsx)("button",{type:"button",onClick:()=>Bl(1.2),"aria-label":"Zoom in",children:"+"})]})]}),u&&(0,F.jsxs)("div",{className:"keyboard-help floating-panel",role:"region","aria-label":"Graph help",children:[(0,F.jsx)(Yu,{title:"Graph controls",onClose:()=>p(!1)}),(0,F.jsx)("p",{children:"Drag the canvas to move \xB7 Scroll to zoom"}),(0,F.jsx)("p",{children:"Click a package to inspect \xB7 Double-click to open code"}),(0,F.jsx)("p",{children:"2D: drag nodes to arrange \xB7 3D: drag to orbit, right-drag to pan"}),(0,F.jsxs)("p",{children:[(0,F.jsx)("kbd",{children:"/"})," Search \xB7 ",(0,F.jsx)("kbd",{children:"Tab"})," Navigate \xB7 ",(0,F.jsx)("kbd",{children:"Enter"})," Inspect \xB7 ",(0,F.jsx)("kbd",{children:"Esc"})," Close \xB7 ",(0,F.jsx)("kbd",{children:"?"})," Help"]})]}),s==="history"?(0,F.jsx)(ZU,{snapshot:e,onInspect:Qt,onError:y}):s==="changes"?(0,F.jsx)(YU,{projection:Ft,onSelect:le,onCopy:()=>Ft?.agent_handoff&&void rr(ET(Ft),"Change mission handoff copied")}):(0,F.jsx)("div",{id:"graph-canvas",className:`graph-canvas${s==="project"?" graph-canvas--project":""}`,tabIndex:0,"aria-label":"Interactive code relationship graph",onWheel:L=>{s!=="project"&&(L.preventDefault(),Bl(L.deltaY<0?1.08:1/1.08))},onPointerDown:zl,onPointerMove:Fu,onPointerUp:Gu,onKeyDown:L=>{if(s==="project")return;let Kt={ArrowLeft:[-28,0],ArrowRight:[28,0],ArrowUp:[0,-28],ArrowDown:[0,28]}[L.key];Kt&&(L.preventDefault(),b(M=>({...M,x:M.x+Kt[0],y:M.y+Kt[1]})))},children:s==="project"&&nt?(0,F.jsx)(HU,{dimension:r,ref:ct,graph:nt,selectedId:pe,onNodeSelect:Ct,onNodeOpen:L=>{let pt=L.representatives?.[0];pt&&Dt(pt.symbol,pt.path)},onEdgeSelect:me}):s==="compare"&&D&&re?(0,F.jsx)(XU,{current:D,future:C_(D,re),camera:v,selectedNodeId:pe,pins:x,onSelectNode:L=>{Et(L)},onInspectEdge:me,onNodeDrag:(L,pt)=>{ut.current={key:String(pt.node_id??pt.id),x:L.clientX,y:L.clientY,origin:{x:pt.x,y:pt.y}}}}):or?(0,F.jsx)(kU,{graph:or,camera:v,selectedNodeId:pe,pins:x,onSelectNode:L=>{Et(L)},onInspectEdge:me,onNodeDrag:(L,pt)=>{ut.current={key:String(pt.node_id??pt.id),x:L.clientX,y:L.clientY,origin:{x:pt.x,y:pt.y}}}}):(0,F.jsx)("div",{className:"graph-message",children:(0,F.jsx)("strong",{children:R||(s==="project"?"Building repository map\u2026":s==="architecture"?"Loading architecture projection\u2026":"Select a symbol to inspect its neighborhood.")})})}),s!=="history"&&s!=="changes"&&(0,F.jsxs)("footer",{className:"legend","aria-label":"Evidence legend",children:[(0,F.jsxs)("span",{children:[(0,F.jsx)("i",{className:"key key--proven",children:"\u2713"})," proven now"]}),(0,F.jsxs)("span",{children:[(0,F.jsx)("i",{className:"key key--gap",children:"?"})," unresolved gap"]}),(0,F.jsxs)("span",{children:[(0,F.jsx)("i",{className:"key key--future",children:"+"})," proposed future"]}),(0,F.jsxs)("span",{children:[(0,F.jsx)("i",{className:"key key--test",children:"T"})," candidate test \xB7 not run"]}),(0,F.jsxs)("span",{children:[(0,F.jsx)("i",{className:"key key--runtime",children:"\u25CF"})," observed runtime \xB7 width=count \xB7 opacity=age"]}),(0,F.jsx)("button",{className:"legend__action",type:"button",onClick:()=>D&&void rr(ST(D,sa),"Runtime agent context copied"),children:"Copy runtime agent context"})]})]}),(0,F.jsxs)("aside",{className:"inspector floating-panel","aria-label":"Evidence inspector",hidden:Ye.kind==="none"||h,children:[(0,F.jsx)(Yu,{title:"Evidence",detail:Ye.kind,onClose:()=>f(!0)}),(0,F.jsx)(jU,{inspector:Ye,onOpenRepresentative:(L,pt)=>{Dt(L,pt)}}),Vu.length>0&&re&&(0,F.jsx)(KU,{strategies:Vu,selected:re,onSelect:L=>Pn(L),onCopyAgent:Pu,onCopyMcp:Pl})]})]}),(0,F.jsx)("div",{className:"sr-only","aria-live":"polite",children:H})]})}function Il({title:e,count:t,children:n,maxClass:i,defaultOpen:s=!1}){return(0,F.jsxs)("details",{className:"rail__section",open:s||void 0,children:[(0,F.jsxs)("summary",{className:"section-title",children:[(0,F.jsx)("h2",{children:e}),(0,F.jsx)("span",{children:t})]}),(0,F.jsx)("div",{className:"item-list",id:i,children:n})]})}function qr({title:e,subtitle:t,onClick:n}){return(0,F.jsxs)("button",{type:"button",className:"item",onClick:n,children:[(0,F.jsx)("strong",{children:e}),(0,F.jsx)("small",{children:t})]})}var HU=(0,ot.forwardRef)(function({dimension:t,...n},i){return t==="2d"?(0,F.jsx)(ny,{...n,ref:i}):(0,F.jsx)(VU,{...n,ref:i})}),VU=(0,ot.forwardRef)(function(t,n){let i=(0,ot.useRef)(null),s=(0,ot.useRef)(null),a=(0,ot.useRef)(t),[r,o]=(0,ot.useState)({width:980,height:620});a.current=t,(0,ot.useEffect)(()=>{let c=i.current;if(!c)return;s.current=mT(c,{onNodeSelect:f=>a.current.onNodeSelect(f),onNodeOpen:f=>a.current.onNodeOpen(f),onEdgeSelect:(f,u,p)=>a.current.onEdgeSelect(f,u,p)});let h=new ResizeObserver(()=>{let f=c.parentElement;f&&o({width:Math.max(1,f.clientWidth),height:Math.max(1,f.clientHeight)})});return c.parentElement&&h.observe(c.parentElement),()=>{h.disconnect(),s.current?.dispose(),s.current=null}},[]);let l=(0,ot.useMemo)(()=>Fl(t.graph,{width:r.width,height:r.height,pins:{}}),[t.graph,r.height,r.width]);return(0,ot.useEffect)(()=>{s.current?.render(t.graph,l,{selectedId:t.selectedId})},[l,t.graph]),(0,ot.useEffect)(()=>{s.current?.setSelected(t.selectedId)},[t.selectedId]),(0,ot.useImperativeHandle)(n,()=>({zoom:c=>s.current?.zoom(c),resetView:()=>s.current?.resetView(),focusNode:c=>s.current?.focusNode(c)}),[]),(0,F.jsx)("canvas",{ref:i,className:"project-three-canvas","aria-label":"Three-dimensional repository dependency map"})});function kU({graph:e,camera:t,selectedNodeId:n,pins:i,onSelectNode:s,onInspectEdge:a,onNodeDrag:r}){let o=(0,ot.useMemo)(()=>Xu(e,{width:980,height:620,pins:i}),[e,i]);return(0,F.jsx)("svg",{id:"graph-svg",viewBox:"0 0 980 620",preserveAspectRatio:"xMidYMid meet",role:"img","aria-label":"Focused code relationship graph",children:(0,F.jsx)(D_,{graph:e,layout:o,transform:`translate(${t.x} ${t.y}) scale(${t.scale})`,selectedNodeId:n,onSelectNode:s,onInspectEdge:a,onNodeDrag:r})})}function XU({current:e,future:t,camera:n,selectedNodeId:i,pins:s,onSelectNode:a,onInspectEdge:r,onNodeDrag:o}){let l=(0,ot.useMemo)(()=>Xu(e,{width:980,height:620,pins:s}),[e,s]),c=(0,ot.useMemo)(()=>Xu(t,{width:980,height:620,pins:s}),[t,s]);return(0,F.jsx)("svg",{id:"graph-svg",viewBox:"0 0 980 620",preserveAspectRatio:"xMidYMid meet",role:"img","aria-label":"Current and proposed code graphs",children:(0,F.jsxs)("g",{transform:`translate(${n.x} ${n.y}) scale(${n.scale})`,children:[(0,F.jsx)("text",{x:"34",y:"34",className:"comparison-title",children:"CURRENT EVIDENCE"}),(0,F.jsx)("text",{x:"524",y:"34",className:"comparison-title",children:"SELECTED FUTURE"}),(0,F.jsx)(D_,{graph:e,layout:l,transform:"translate(0 46) scale(.5)",selectedNodeId:i,onSelectNode:a,onInspectEdge:r,onNodeDrag:o}),(0,F.jsx)(D_,{graph:t,layout:c,transform:"translate(490 46) scale(.5)",selectedNodeId:i,onSelectNode:a,onInspectEdge:r,onNodeDrag:o})]})})}function D_({graph:e,layout:t,transform:n,selectedNodeId:i,onSelectNode:s,onInspectEdge:a,onNodeDrag:r}){let o=new Map(t.nodes.map(c=>[String(c.node_id),c]));return(0,F.jsxs)("g",{transform:n,children:[[["CALLERS",96,54],["ENTRY POINT",382,54],["CALLEES",668,54],["TESTS \xB7 NOT RUN",382,380]].map(([c,h,f])=>(0,F.jsx)("text",{x:h,y:f,className:"lane-label",children:c},c)),t.containers.map(c=>(0,F.jsxs)(ot.default.Fragment,{children:[(0,F.jsx)("rect",{x:c.x,y:c.y,width:c.width,height:c.height,className:"file-container"}),(0,F.jsx)("text",{x:c.x+10,y:c.y+17,className:"file-label",children:Ol(c.path,46)})]},c.id)),(e.edges||[]).map((c,h)=>{let f=o.get(String(c.source)),u=o.get(String(c.target));return f&&u?(0,F.jsx)(WU,{edge:c,source:f,target:u,onInspect:a},`${c.source}:${c.target}:${c.relation}:${h}`):null}),t.nodes.map(c=>(0,F.jsx)(qU,{node:c,selected:String(i)===String(c.node_id),onSelect:s,onDrag:r},String(c.node_id??c.id)))]})}function WU({edge:e,source:t,target:n,onInspect:i}){let s=t.x+t.width,a=t.y+t.height/2,r=n.x,o=n.y+n.height/2,l=(s+r)/2,c=Wu(e),h=yT(e);return(0,F.jsxs)("g",{"data-graph-interactive":"true",tabIndex:0,role:"button","aria-label":`${t.symbol} ${e.relation} ${n.symbol}, ${e.confidence||"unknown confidence"}`,onClick:()=>i(e,t,n),onKeyDown:f=>{(f.key==="Enter"||f.key===" ")&&(f.preventDefault(),i(e,t,n))},children:[(0,F.jsx)("path",{d:`M ${s} ${a} H ${l} V ${o} H ${r}`,className:c.className,strokeDasharray:h?.dash||c.dash,strokeWidth:h?.width||1.7,opacity:h?.opacity||1}),(0,F.jsx)("text",{x:l+5,y:o-6,className:"edge-label",children:h?.marker||c.marker})]})}function qU({node:e,selected:t,onSelect:n,onDrag:i}){let s=["node",e.lane==="tests"?"node--test":"",e.changed?"node--changed":"",e.status==="hypothetical"?"node--future":"",e.status==="remove"?"node--remove":"",e.pinned?"node--pinned":"",t?"is-selected":""].filter(Boolean).join(" ");return(0,F.jsxs)("g",{"data-graph-interactive":"true",transform:`translate(${e.x} ${e.y})`,className:s,tabIndex:0,role:"button","aria-label":`${e.symbol}, ${e.path}, ${e.lane}`,onClick:()=>n(e),onKeyDown:a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),n(e))},onPointerDown:a=>{a.stopPropagation(),i(a,e)},children:[(0,F.jsx)("rect",{width:e.width,height:e.height}),(0,F.jsx)("circle",{cx:"15",cy:"17",r:"4",className:"node__status"}),(0,F.jsx)("text",{x:"27",y:"21",className:"node__title",children:Ol(e.symbol,27)}),(0,F.jsx)("text",{x:"14",y:"45",className:"node__path",children:Ol(e.path,31)})]})}function YU({projection:e,onSelect:t,onCopy:n}){if(!e)return(0,F.jsx)("div",{className:"mission-panel",children:(0,F.jsx)("p",{className:"quiet",children:"Loading change missions\u2026"})});let i=e.totals;return(0,F.jsxs)("div",{className:"mission-panel","aria-label":"Change mission execution graph",children:[(0,F.jsxs)("div",{className:"mission-panel__header",children:[(0,F.jsxs)("div",{children:[(0,F.jsx)("p",{className:"eyebrow",children:"Deterministic execution DAG"}),(0,F.jsxs)("p",{className:"quiet",children:[i.missions," missions \xB7 ",i.parallel_groups," sequential groups \xB7 ",i.blocked," blocked by coverage gaps"]})]}),(0,F.jsx)("button",{type:"button",className:"mission-copy",onClick:n,children:"Copy agent handoff"})]}),(0,F.jsx)("div",{className:"mission-dag",children:e.groups.map(s=>(0,F.jsxs)("section",{className:"mission-group",children:[(0,F.jsxs)("h2",{children:["Group ",s.index+1]}),(0,F.jsx)("p",{children:s.missions.length>1?`${s.missions.length} missions can run in parallel`:"Run after dependencies"}),s.missions.map(a=>{let r=a.blocked_by_gaps?"blocked \xB7 inspect gaps":a.depends_on?.length?`after ${a.depends_on.length}`:"ready";return(0,F.jsxs)("button",{type:"button",className:`mission-card${a.blocked_by_gaps?" mission-card--blocked":""}`,onClick:()=>t(a),children:[(0,F.jsx)("span",{className:"mission-card__kind",children:a.kind.replaceAll("_"," ")}),(0,F.jsx)("strong",{children:Ol(a.title,38)}),(0,F.jsxs)("small",{children:[a.evidenceCount," evidence \xB7 ",a.testCount," tests"]}),(0,F.jsx)("small",{children:r})]},a.mission_id)})]},s.index))})]})}function ZU({snapshot:e,onInspect:t,onError:n}){let i=(0,ot.useRef)(null);return(0,ot.useEffect)(()=>{let s=i.current;if(!s)return;s.theme="dark",s.density="compact",s.columns="commit",s.dateFormat="relative",s.avatars=!1,s.provider=new Bd(ia);let a=o=>{let c=o.detail.commit,h=(s.data?.refs||[]).filter(f=>f.target===c.oid).map(f=>f.name);t({kind:"commit",facts:[["Commit",c.oid],["Subject",c.message],["Author",c.author?.name],["Authored",c.authoredAt],["Parents",c.parents?.join(", ")||"root"],["Refs",h.join(", ")||"none"]]})},r=o=>n(o.detail?.error?.message||"Git history request failed");return s.addEventListener("gitgraph-commit-select",a),s.addEventListener("gitgraph-error",r),()=>{s.removeEventListener("gitgraph-commit-select",a),s.removeEventListener("gitgraph-error",r)}},[n,t]),(0,ot.useEffect)(()=>{e&&i.current?.refresh?.()},[e]),(0,F.jsx)("div",{className:"git-history-panel",children:ot.default.createElement("web-git-graph",{ref:i,"aria-label":"Git commit history"})})}function jU({inspector:e,onOpenRepresentative:t}){return(0,F.jsxs)("div",{className:"inspector__content",children:[e.facts.length?(0,F.jsx)("dl",{children:e.facts.map(([n,i],s)=>(0,F.jsxs)("div",{className:"fact",children:[(0,F.jsx)("dt",{children:n}),(0,F.jsx)("dd",{children:(0,F.jsx)("code",{children:String(i??"unknown")})})]},`${n}:${s}`))}):(0,F.jsx)("p",{className:"quiet",children:"Select a node or edge to inspect its source identity, resolver and confidence."}),e.representatives?.length?(0,F.jsxs)("div",{className:"project-representatives",children:[(0,F.jsx)("p",{className:"quiet",children:"Representative symbols \xB7 open focused graph"}),e.representatives.map(n=>(0,F.jsx)(qr,{title:n.symbol,subtitle:Ol(n.path,34),onClick:()=>t(n.symbol,n.path)},String(n.node_id)))]}):null,e.code&&(0,F.jsx)("pre",{className:"code",children:e.code}),e.error&&(0,F.jsx)("p",{className:"error",children:e.error})]})}function KU({strategies:e,selected:t,onSelect:n,onCopyAgent:i,onCopyMcp:s}){let a=t.status==="blocked_by_gaps",r=t.summary||`${(t.counterfactual?.reasons||[]).map(o=>o.replaceAll("_"," ")).join(" \xB7 ")} \xB7 graph ${JSON.stringify(t.predicted_graph||{})}`;return(0,F.jsxs)("section",{className:"strategy-panel",children:[(0,F.jsx)("div",{className:"strategy-tabs",role:"tablist","aria-label":"Refactor strategies",children:e.map(o=>(0,F.jsx)("button",{type:"button",role:"tab","aria-selected":o.strategy_id===t.strategy_id,onClick:()=>n(o),children:o.policy.replaceAll("_"," ")},o.strategy_id))}),(0,F.jsxs)("div",{children:[(0,F.jsx)("p",{className:"strategy-summary",children:r}),(0,F.jsx)("span",{className:`risk${a?" risk--blocked":""}`,children:a?"blocked by gaps":`${t.counterfactual?.score??t.risk} \xB7 hypothetical`})]}),(0,F.jsxs)("div",{className:"copy-actions",children:[(0,F.jsx)("button",{type:"button",onClick:i,children:"Copy agent plan"}),(0,F.jsx)("button",{type:"button",className:"button--quiet",onClick:s,children:"Copy MCP call"})]})]})}function ar(e){return e instanceof Error?e.message:String(e)}function Ol(e,t){let n=String(e??"");return n.length<=t?n:`${n.slice(0,t-1)}\u2026`}function JU(e,t,n){return Math.max(t,Math.min(n,e))}var UT=document.getElementById("root");if(!UT)throw new Error("CGRX visualizer root is missing");(0,DT.createRoot)(UT).render((0,F.jsx)(GU,{}));
