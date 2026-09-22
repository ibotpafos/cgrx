var _T=Object.create;var y_=Object.defineProperty;var yT=Object.getOwnPropertyDescriptor;var xT=Object.getOwnPropertyNames;var ST=Object.getPrototypeOf,bT=Object.prototype.hasOwnProperty;var ns=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var MT=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let s of xT(t))!bT.call(e,s)&&s!==n&&y_(e,s,{get:()=>t[s],enumerable:!(i=yT(t,s))||i.enumerable});return e};var Cu=(e,t,n)=>(n=e!=null?_T(ST(e)):{},MT(t||!e||!e.__esModule?y_(n,"default",{value:e,enumerable:!0}):n,e));var L_=ns(Ht=>{"use strict";var Ip=Symbol.for("react.transitional.element"),ET=Symbol.for("react.portal"),TT=Symbol.for("react.fragment"),wT=Symbol.for("react.strict_mode"),AT=Symbol.for("react.profiler"),CT=Symbol.for("react.consumer"),RT=Symbol.for("react.context"),NT=Symbol.for("react.forward_ref"),DT=Symbol.for("react.suspense"),LT=Symbol.for("react.memo"),E_=Symbol.for("react.lazy"),UT=Symbol.for("react.activity"),IT=Symbol.for("react.view_transition"),x_=Symbol.iterator;function OT(e){return e===null||typeof e!="object"?null:(e=x_&&e[x_]||e["@@iterator"],typeof e=="function"?e:null)}var T_={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},w_=Object.assign,A_={};function Xr(e,t,n){this.props=e,this.context=t,this.refs=A_,this.updater=n||T_}Xr.prototype.isReactComponent={};Xr.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};Xr.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function C_(){}C_.prototype=Xr.prototype;function Op(e,t,n){this.props=e,this.context=t,this.refs=A_,this.updater=n||T_}var Pp=Op.prototype=new C_;Pp.constructor=Op;w_(Pp,Xr.prototype);Pp.isPureReactComponent=!0;var S_=Array.isArray;function Up(){}var Ne={H:null,A:null,T:null,S:null},R_=Object.prototype.hasOwnProperty;function Bp(e,t,n){var i=n.ref;return{$$typeof:Ip,type:e,key:t,ref:i!==void 0?i:null,props:n}}function PT(e,t){return Bp(e.type,t,e.props)}function zp(e){return typeof e=="object"&&e!==null&&e.$$typeof===Ip}function BT(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var b_=/\/+/g;function Lp(e,t){return typeof e=="object"&&e!==null&&e.key!=null?BT(""+e.key):t.toString(36)}function zT(e){switch(e.status){case"fulfilled":return e.value;case"rejected":throw e.reason;default:switch(typeof e.status=="string"?e.then(Up,Up):(e.status="pending",e.then(function(t){e.status==="pending"&&(e.status="fulfilled",e.value=t)},function(t){e.status==="pending"&&(e.status="rejected",e.reason=t)})),e.status){case"fulfilled":return e.value;case"rejected":throw e.reason}}throw e}function kr(e,t,n,i,s){var a=typeof e;(a==="undefined"||a==="boolean")&&(e=null);var r=!1;if(e===null)r=!0;else switch(a){case"bigint":case"string":case"number":r=!0;break;case"object":switch(e.$$typeof){case Ip:case ET:r=!0;break;case E_:return r=e._init,kr(r(e._payload),t,n,i,s)}}if(r)return s=s(e),r=i===""?"."+Lp(e,0):i,S_(s)?(n="",r!=null&&(n=r.replace(b_,"$&/")+"/"),kr(s,t,n,"",function(c){return c})):s!=null&&(zp(s)&&(s=PT(s,n+(s.key==null||e&&e.key===s.key?"":(""+s.key).replace(b_,"$&/")+"/")+r)),t.push(s)),1;r=0;var o=i===""?".":i+":";if(S_(e))for(var l=0;l<e.length;l++)i=e[l],a=o+Lp(i,l),r+=kr(i,t,n,a,s);else if(l=OT(e),typeof l=="function")for(e=l.call(e),l=0;!(i=e.next()).done;)i=i.value,a=o+Lp(i,l++),r+=kr(i,t,n,a,s);else if(a==="object"){if(typeof e.then=="function")return kr(zT(e),t,n,i,s);throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.")}return r}function Ru(e,t,n){if(e==null)return e;var i=[],s=0;return kr(e,i,"","",function(a){return t.call(n,a,s++)}),i}function FT(e){if(e._status===-1){var t=e._result,n=t();n.then(function(i){(e._status===0||e._status===-1)&&(e._status=1,e._result=i,n.status===void 0&&(n.status="fulfilled",n.value=i))},function(i){(e._status===0||e._status===-1)&&(e._status=2,e._result=i,n.status===void 0&&(n.status="rejected",n.reason=i))}),e._status===-1&&(e._status=0,e._result=n)}if(e._status===1)return e._result.default;throw e._result}var M_=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)};function N_(e){var t=Ne.T,n={};n.types=t!==null?t.types:null,Ne.T=n;try{var i=e(),s=Ne.S;s!==null&&s(n,i),typeof i=="object"&&i!==null&&typeof i.then=="function"&&i.then(Up,M_)}catch(a){M_(a)}finally{t!==null&&n.types!==null&&(t.types=n.types),Ne.T=t}}function D_(e){var t=Ne.T;if(t!==null){var n=t.types;n===null?t.types=[e]:n.indexOf(e)===-1&&n.push(e)}else N_(D_.bind(null,e))}var GT={map:Ru,forEach:function(e,t,n){Ru(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return Ru(e,function(){t++}),t},toArray:function(e){return Ru(e,function(t){return t})||[]},only:function(e){if(!zp(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};Ht.Activity=UT;Ht.Children=GT;Ht.Component=Xr;Ht.Fragment=TT;Ht.Profiler=AT;Ht.PureComponent=Op;Ht.StrictMode=wT;Ht.Suspense=DT;Ht.ViewTransition=IT;Ht.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=Ne;Ht.__COMPILER_RUNTIME={__proto__:null,c:function(e){return Ne.H.useMemoCache(e)}};Ht.addTransitionType=D_;Ht.cache=function(e){return function(){return e.apply(null,arguments)}};Ht.cacheSignal=function(){return null};Ht.cloneElement=function(e,t,n){if(e==null)throw Error("The argument must be a React element, but you passed "+e+".");var i=w_({},e.props),s=e.key;if(t!=null)for(a in t.key!==void 0&&(s=""+t.key),t)!R_.call(t,a)||a==="key"||a==="__self"||a==="__source"||a==="ref"&&t.ref===void 0||(i[a]=t[a]);var a=arguments.length-2;if(a===1)i.children=n;else if(1<a){for(var r=Array(a),o=0;o<a;o++)r[o]=arguments[o+2];i.children=r}return Bp(e.type,s,i)};Ht.createContext=function(e){return e={$$typeof:RT,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null},e.Provider=e,e.Consumer={$$typeof:CT,_context:e},e};Ht.createElement=function(e,t,n){var i,s={},a=null;if(t!=null)for(i in t.key!==void 0&&(a=""+t.key),t)R_.call(t,i)&&i!=="key"&&i!=="__self"&&i!=="__source"&&(s[i]=t[i]);var r=arguments.length-2;if(r===1)s.children=n;else if(1<r){for(var o=Array(r),l=0;l<r;l++)o[l]=arguments[l+2];s.children=o}if(e&&e.defaultProps)for(i in r=e.defaultProps,r)s[i]===void 0&&(s[i]=r[i]);return Bp(e,a,s)};Ht.createRef=function(){return{current:null}};Ht.forwardRef=function(e){return{$$typeof:NT,render:e}};Ht.isValidElement=zp;Ht.lazy=function(e){return{$$typeof:E_,_payload:{_status:-1,_result:e},_init:FT}};Ht.memo=function(e,t){return{$$typeof:LT,type:e,compare:t===void 0?null:t}};Ht.startTransition=N_;Ht.unstable_useCacheRefresh=function(){return Ne.H.useCacheRefresh()};Ht.use=function(e){return Ne.H.use(e)};Ht.useActionState=function(e,t,n){return Ne.H.useActionState(e,t,n)};Ht.useCallback=function(e,t){return Ne.H.useCallback(e,t)};Ht.useContext=function(e){return Ne.H.useContext(e)};Ht.useDebugValue=function(){};Ht.useDeferredValue=function(e,t){return Ne.H.useDeferredValue(e,t)};Ht.useEffect=function(e,t){return Ne.H.useEffect(e,t)};Ht.useEffectEvent=function(e){return Ne.H.useEffectEvent(e)};Ht.useId=function(){return Ne.H.useId()};Ht.useImperativeHandle=function(e,t,n){return Ne.H.useImperativeHandle(e,t,n)};Ht.useInsertionEffect=function(e,t){return Ne.H.useInsertionEffect(e,t)};Ht.useLayoutEffect=function(e,t){return Ne.H.useLayoutEffect(e,t)};Ht.useMemo=function(e,t){return Ne.H.useMemo(e,t)};Ht.useOptimistic=function(e,t){return Ne.H.useOptimistic(e,t)};Ht.useReducer=function(e,t,n){return Ne.H.useReducer(e,t,n)};Ht.useRef=function(e){return Ne.H.useRef(e)};Ht.useState=function(e){return Ne.H.useState(e)};Ht.useSyncExternalStore=function(e,t,n){return Ne.H.useSyncExternalStore(e,t,n)};Ht.useTransition=function(){return Ne.H.useTransition()};Ht.version="19.3.0"});var Nu=ns((DU,U_)=>{"use strict";U_.exports=L_()});var k_=ns(Ge=>{"use strict";function Vp(e,t){var n=e.length;e.push(t);t:for(;0<n;){var i=n-1>>>1,s=e[i];if(0<Du(s,t))e[i]=t,e[n]=s,n=i;else break t}}function is(e){return e.length===0?null:e[0]}function Uu(e){if(e.length===0)return null;var t=e[0],n=e.pop();if(n!==t){e[0]=n;t:for(var i=0,s=e.length,a=s>>>1;i<a;){var r=2*(i+1)-1,o=e[r],l=r+1,c=e[l];if(0>Du(o,n))l<s&&0>Du(c,o)?(e[i]=c,e[l]=n,i=l):(e[i]=o,e[r]=n,i=r);else if(l<s&&0>Du(c,n))e[i]=c,e[l]=n,i=l;else break t}}return t}function Du(e,t){var n=e.sortIndex-t.sortIndex;return n!==0?n:e.id-t.id}Ge.unstable_now=void 0;typeof performance=="object"&&typeof performance.now=="function"?(I_=performance,Ge.unstable_now=function(){return I_.now()}):(Fp=Date,O_=Fp.now(),Ge.unstable_now=function(){return Fp.now()-O_});var I_,Fp,O_,Ns=[],oa=[],HT=1,Ti=null,An=3,kp=!1,Nl=!1,Dl=!1,Xp=!1,z_=typeof setTimeout=="function"?setTimeout:null,F_=typeof clearTimeout=="function"?clearTimeout:null,P_=typeof setImmediate<"u"?setImmediate:null;function Lu(e){for(var t=is(oa);t!==null;){if(t.callback===null)Uu(oa);else if(t.startTime<=e)Uu(oa),t.sortIndex=t.expirationTime,Vp(Ns,t);else break;t=is(oa)}}function Wp(e){if(Dl=!1,Lu(e),!Nl)if(is(Ns)!==null)Nl=!0,qr||(qr=!0,Wr());else{var t=is(oa);t!==null&&qp(Wp,t.startTime-e)}}var qr=!1,Ll=-1,G_=5,H_=-1;function V_(){return Xp?!0:!(Ge.unstable_now()-H_<G_)}function Gp(){if(Xp=!1,qr){var e=Ge.unstable_now();H_=e;var t=!0;try{t:{Nl=!1,Dl&&(Dl=!1,F_(Ll),Ll=-1),kp=!0;var n=An;try{e:{for(Lu(e),Ti=is(Ns);Ti!==null&&!(Ti.expirationTime>e&&V_());){var i=Ti.callback;if(typeof i=="function"){Ti.callback=null,An=Ti.priorityLevel;var s=i(Ti.expirationTime<=e);if(e=Ge.unstable_now(),typeof s=="function"){Ti.callback=s,Lu(e),t=!0;break e}Ti===is(Ns)&&Uu(Ns),Lu(e)}else Uu(Ns);Ti=is(Ns)}if(Ti!==null)t=!0;else{var a=is(oa);a!==null&&qp(Wp,a.startTime-e),t=!1}}break t}finally{Ti=null,An=n,kp=!1}t=void 0}}finally{t?Wr():qr=!1}}}var Wr;typeof P_=="function"?Wr=function(){P_(Gp)}:typeof MessageChannel<"u"?(Hp=new MessageChannel,B_=Hp.port2,Hp.port1.onmessage=Gp,Wr=function(){B_.postMessage(null)}):Wr=function(){z_(Gp,0)};var Hp,B_;function qp(e,t){Ll=z_(function(){e(Ge.unstable_now())},t)}Ge.unstable_IdlePriority=5;Ge.unstable_ImmediatePriority=1;Ge.unstable_LowPriority=4;Ge.unstable_NormalPriority=3;Ge.unstable_Profiling=null;Ge.unstable_UserBlockingPriority=2;Ge.unstable_cancelCallback=function(e){e.callback=null};Ge.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):G_=0<e?Math.floor(1e3/e):5};Ge.unstable_getCurrentPriorityLevel=function(){return An};Ge.unstable_next=function(e){switch(An){case 1:case 2:case 3:var t=3;break;default:t=An}var n=An;An=t;try{return e()}finally{An=n}};Ge.unstable_requestPaint=function(){Xp=!0};Ge.unstable_runWithPriority=function(e,t){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var n=An;An=e;try{return t()}finally{An=n}};Ge.unstable_scheduleCallback=function(e,t,n){var i=Ge.unstable_now();switch(typeof n=="object"&&n!==null?(n=n.delay,n=typeof n=="number"&&0<n?i+n:i):n=i,e){case 1:var s=-1;break;case 2:s=250;break;case 5:s=1073741823;break;case 4:s=1e4;break;default:s=5e3}return s=n+s,e={id:HT++,callback:t,priorityLevel:e,startTime:n,expirationTime:s,sortIndex:-1},n>i?(e.sortIndex=n,Vp(oa,e),is(Ns)===null&&e===is(oa)&&(Dl?(F_(Ll),Ll=-1):Dl=!0,qp(Wp,n-i))):(e.sortIndex=s,Vp(Ns,e),Nl||kp||(Nl=!0,qr||(qr=!0,Wr()))),e};Ge.unstable_shouldYield=V_;Ge.unstable_wrapCallback=function(e){var t=An;return function(){var n=An;An=t;try{return e.apply(this,arguments)}finally{An=n}}}});var W_=ns((UU,X_)=>{"use strict";X_.exports=k_()});var Z_=ns(Cn=>{"use strict";var VT=Nu();function Y_(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function la(){}var Pn={d:{f:la,r:function(){throw Error(Y_(522))},D:la,C:la,L:la,m:la,X:la,S:la,M:la},p:0,findDOMNode:null},kT=Symbol.for("react.portal"),XT=Symbol.for("react.recoverable"),q_=Symbol.for("react.optimistic_key");function WT(e,t,n){var i=3<arguments.length&&arguments[3]!==void 0?arguments[3]:null;return{$$typeof:kT,key:i==null?null:i===q_?q_:""+i,children:e,containerInfo:t,implementation:n}}var Ul=VT.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;function Iu(e,t){if(e==="font")return"";if(typeof t=="string")return t==="use-credentials"?t:""}Cn.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE=Pn;Cn.browser=function(e){return{$$typeof:XT,_reason:e}};Cn.createPortal=function(e,t){var n=2<arguments.length&&arguments[2]!==void 0?arguments[2]:null;if(!t||t.nodeType!==1&&t.nodeType!==9&&t.nodeType!==11)throw Error(Y_(299));return WT(e,t,null,n)};Cn.flushSync=function(e){var t=Ul.T,n=Pn.p;try{if(Ul.T=null,Pn.p=2,e)return e()}finally{Ul.T=t,Pn.p=n,Pn.d.f()}};Cn.preconnect=function(e,t){typeof e=="string"&&(t?(t=t.crossOrigin,t=typeof t=="string"?t==="use-credentials"?t:"":void 0):t=null,Pn.d.C(e,t))};Cn.prefetchDNS=function(e){typeof e=="string"&&Pn.d.D(e)};Cn.preinit=function(e,t){if(typeof e=="string"&&t&&typeof t.as=="string"){var n=t.as,i=Iu(n,t.crossOrigin),s=typeof t.integrity=="string"?t.integrity:void 0,a=typeof t.fetchPriority=="string"?t.fetchPriority:void 0;n==="style"?Pn.d.S(e,typeof t.precedence=="string"?t.precedence:void 0,{crossOrigin:i,integrity:s,fetchPriority:a}):n==="script"&&Pn.d.X(e,{crossOrigin:i,integrity:s,fetchPriority:a,nonce:typeof t.nonce=="string"?t.nonce:void 0})}};Cn.preinitModule=function(e,t){if(typeof e=="string")if(typeof t=="object"&&t!==null){if(t.as==null||t.as==="script"){var n=Iu(t.as,t.crossOrigin);Pn.d.M(e,{crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0})}}else t==null&&Pn.d.M(e)};Cn.preload=function(e,t){if(typeof e=="string"&&typeof t=="object"&&t!==null&&typeof t.as=="string"){var n=t.as,i=Iu(n,t.crossOrigin);Pn.d.L(e,n,{crossOrigin:i,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,type:typeof t.type=="string"?t.type:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0,referrerPolicy:typeof t.referrerPolicy=="string"?t.referrerPolicy:void 0,imageSrcSet:typeof t.imageSrcSet=="string"?t.imageSrcSet:void 0,imageSizes:typeof t.imageSizes=="string"?t.imageSizes:void 0,media:typeof t.media=="string"?t.media:void 0})}};Cn.preloadModule=function(e,t){if(typeof e=="string")if(t){var n=Iu(t.as,t.crossOrigin);Pn.d.m(e,{as:typeof t.as=="string"&&t.as!=="script"?t.as:void 0,crossOrigin:n,integrity:typeof t.integrity=="string"?t.integrity:void 0,nonce:typeof t.nonce=="string"?t.nonce:void 0,fetchPriority:typeof t.fetchPriority=="string"?t.fetchPriority:void 0})}else Pn.d.m(e)};Cn.requestFormReset=function(e){Pn.d.r(e)};Cn.unstable_batchedUpdates=function(e,t){return e(t)};Cn.useFormState=function(e,t,n){return Ul.H.useFormState(e,t,n)};Cn.useFormStatus=function(){return Ul.H.useHostTransitionStatus()};Cn.version="19.3.0"});var J_=ns((OU,K_)=>{"use strict";function j_(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(j_)}catch(e){console.error(e)}}j_(),K_.exports=Z_()});var BM=ns(md=>{"use strict";var sn=W_(),Px=Nu(),qT=J_();function tt(e){var t="https://react.dev/errors/"+e;if(1<arguments.length){t+="?args[]="+encodeURIComponent(arguments[1]);for(var n=2;n<arguments.length;n++)t+="&args[]="+encodeURIComponent(arguments[n])}return"Minified React error #"+e+"; visit "+t+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}function Bx(e){return!(!e||e.nodeType!==1&&e.nodeType!==9&&e.nodeType!==11)}function xc(e){for(var t=e,n=t;n&&!n.alternate;)t=n,(t.flags&4098)!==0&&(e=t.return),n=t.return;for(;t.return;)t=t.return;return t.tag===3?e:null}function zx(e){if(e.tag===13){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function Fx(e){if(e.tag===31){var t=e.memoizedState;if(t===null&&(e=e.alternate,e!==null&&(t=e.memoizedState)),t!==null)return t.dehydrated}return null}function Q_(e){if(xc(e)!==e)throw Error(tt(188))}function YT(e){var t=e.alternate;if(!t){if(t=xc(e),t===null)throw Error(tt(188));return t!==e?null:e}for(var n=e,i=t;;){var s=n.return;if(s===null)break;var a=s.alternate;if(a===null){if(i=s.return,i!==null){n=i;continue}break}if(s.child===a.child){for(a=s.child;a;){if(a===n)return Q_(s),e;if(a===i)return Q_(s),t;a=a.sibling}throw Error(tt(188))}if(n.return!==i.return)n=s,i=a;else{for(var r=!1,o=s.child;o;){if(o===n){r=!0,n=s,i=a;break}if(o===i){r=!0,i=s,n=a;break}o=o.sibling}if(!r){for(o=a.child;o;){if(o===n){r=!0,n=a,i=s;break}if(o===i){r=!0,i=a,n=s;break}o=o.sibling}if(!r)throw Error(tt(189))}}if(n.alternate!==i)throw Error(tt(190))}if(n.tag!==3)throw Error(tt(188));return n.stateNode.current===n?e:t}function Gx(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e;for(e=e.child;e!==null;){if(t=Gx(e),t!==null)return t;e=e.sibling}return null}function Qn(e,t,n,i,s,a){for(;e!==null;){if((e.tag===5||e.tag===27||e.tag===6)&&n(e,i,s,a)||(e.tag!==22||e.memoizedState===null)&&(t||e.tag!==5&&e.tag!==27)&&Qn(e.child,t,n,i,s,a))return!0;e=e.sibling}return!1}function Mr(e){for(e=e.return;e!==null;){if(e.tag===3||e.tag===5||e.tag===27)return e;e=e.return}return null}function $_(e){var t=!1;for(e=e.return;e!==null&&(e.tag===4&&(t=!0),!(e.tag===3||e.tag===5||e.tag===27));)e=e.return;return t}function Hx(e){var t=[null,null],n=Mr(e);return n===null||Vx(t,e,n.child,{foundSelf:!1}),t}function Vx(e,t,n,i){for(;n!==null;){if(n===t)i.foundSelf=!0;else if(n.tag===5||n.tag===27||n.tag===6){if(i.foundSelf)return e[1]=n,!0;e[0]=n}else if((n.tag!==22||n.memoizedState===null)&&Vx(e,t,n.child,i))return!0;n=n.sibling}return!1}function nn(e){switch(e.tag){case 5:case 27:case 6:return e.stateNode;case 3:return e.stateNode.containerInfo;default:throw Error(tt(559))}}var $r=null,Em=null;function ZT(e,t,n){return e===n?!0:e===t?($r=e,!0):!1}function jT(e,t,n){return e===n?(Em=e,!1):e===t?(Em!==null&&($r=e),!0):!1}function ty(e){if(e===null)return null;do e=e===null?null:e.return;while(e&&e.tag!==5&&e.tag!==27&&e.tag!==3);return e||null}function Tm(e,t,n){for(var i=0,s=e;s;s=n(s))i++;s=0;for(var a=t;a;a=n(a))s++;for(;0<i-s;)e=n(e),i--;for(;0<s-i;)t=n(t),s--;for(;i--;){if(e===t||t!==null&&e===t.alternate)return e;e=n(e),t=n(t)}return null}var Ae=Object.assign,KT=Symbol.for("react.element"),Ou=Symbol.for("react.transitional.element"),Gl=Symbol.for("react.portal"),to=Symbol.for("react.fragment"),kx=Symbol.for("react.strict_mode"),wm=Symbol.for("react.profiler"),Xx=Symbol.for("react.consumer"),cs=Symbol.for("react.context"),Og=Symbol.for("react.forward_ref"),Am=Symbol.for("react.suspense"),Cm=Symbol.for("react.suspense_list"),Pg=Symbol.for("react.memo"),da=Symbol.for("react.lazy");Symbol.for("react.scope");var Rm=Symbol.for("react.activity"),JT=Symbol.for("react.legacy_hidden");Symbol.for("react.tracing_marker");var QT=Symbol.for("react.memo_cache_sentinel"),Nm=Symbol.for("react.view_transition"),$T=Symbol.for("react.recoverable"),ey=Symbol.iterator;function Il(e){return e===null||typeof e!="object"?null:(e=ey&&e[ey]||e["@@iterator"],typeof e=="function"?e:null)}var tw=Symbol.for("react.client.reference");function Dm(e){if(e==null)return null;if(typeof e=="function")return e.$$typeof===tw?null:e.displayName||e.name||null;if(typeof e=="string")return e;switch(e){case to:return"Fragment";case wm:return"Profiler";case kx:return"StrictMode";case Am:return"Suspense";case Cm:return"SuspenseList";case Rm:return"Activity";case Nm:return"ViewTransition"}if(typeof e=="object")switch(e.$$typeof){case Gl:return"Portal";case cs:return e.displayName||"Context";case Xx:return(e._context.displayName||"Context")+".Consumer";case Og:var t=e.render;return e=e.displayName,e||(e=t.displayName||t.name||"",e=e!==""?"ForwardRef("+e+")":"ForwardRef"),e;case Pg:return t=e.displayName||null,t!==null?t:Dm(e.type)||"Memo";case da:t=e._payload,e=e._init;try{return Dm(e(t))}catch{}}return null}var Hl=Array.isArray,zt=Px.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,he=qT.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,ur={pending:!1,data:null,method:null,action:null},Lm=[],eo=-1;function gs(e){return{current:e}}function _n(e){0>eo||(e.current=Lm[eo],Lm[eo]=null,eo--)}function Ue(e,t){eo++,Lm[eo]=e.current,e.current=t}var fs=gs(null),sc=gs(null),Sa=gs(null),Sh=gs(null);function bh(e,t){switch(Ue(Sa,t),Ue(sc,e),Ue(fs,null),t.nodeType){case 9:case 11:e=(e=t.documentElement)&&(e=e.namespaceURI)?mx(e):0;break;default:if(e=t.tagName,t=t.namespaceURI)t=mx(t),e=dM(t,e);else switch(e){case"svg":e=1;break;case"math":e=2;break;default:e=0}}_n(fs),Ue(fs,e)}function bo(){_n(fs),_n(sc),_n(Sa)}function Um(e){var t=e.memoizedState;t!==null&&(Lo._currentValue=t.memoizedState,Ue(Sh,e)),t=fs.current;var n=dM(t,e.type);t!==n&&(Ue(sc,e),Ue(fs,n))}function Mh(e){sc.current===e&&(_n(fs),_n(sc)),Sh.current===e&&(_n(Sh),Lo._currentValue=ur)}var Yp,ny;function ua(e){if(Yp===void 0)try{throw Error()}catch(n){var t=n.stack.trim().match(/\n( *(at )?)/);Yp=t&&t[1]||"",ny=-1<n.stack.indexOf(`
    at`)?" (<anonymous>)":-1<n.stack.indexOf("@")?"@unknown:0:0":""}return`
`+Yp+e+ny}var Zp=!1;function jp(e,t){if(!e||Zp)return"";Zp=!0;var n=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{var i={DetermineComponentFrameRoot:function(){try{if(t){var d=function(){throw Error()};if(Object.defineProperty(d.prototype,"props",{set:function(){throw Error()}}),typeof Reflect=="object"&&Reflect.construct){try{Reflect.construct(d,[])}catch(m){var u=m}Reflect.construct(e,[],d)}else{try{d.call()}catch(m){u=m}d=!1;try{var p=Object.getOwnPropertyDescriptor(e.prototype,"props");Object.defineProperty(e.prototype,"props",{configurable:!0,set:function(){throw Error()}}),d=!0,new e}finally{d&&(p!==void 0?Object.defineProperty(e.prototype,"props",p):delete e.prototype.props)}}}else{try{throw Error()}catch(m){u=m}(d=e())&&typeof d.catch=="function"&&d.catch(function(){})}}catch(m){if(m&&u&&typeof m.stack=="string")return[m.stack,u.stack]}return[null,null]}};i.DetermineComponentFrameRoot.displayName="DetermineComponentFrameRoot";var s=Object.getOwnPropertyDescriptor(i.DetermineComponentFrameRoot,"name");s&&s.configurable&&Object.defineProperty(i.DetermineComponentFrameRoot,"name",{value:"DetermineComponentFrameRoot"});var a=i.DetermineComponentFrameRoot(),r=a[0],o=a[1];if(r&&o){var l=r.split(`
`),c=o.split(`
`);for(s=i=0;i<l.length&&!l[i].includes("DetermineComponentFrameRoot");)i++;for(;s<c.length&&!c[s].includes("DetermineComponentFrameRoot");)s++;if(i===l.length||s===c.length)for(i=l.length-1,s=c.length-1;1<=i&&0<=s&&l[i]!==c[s];)s--;for(;1<=i&&0<=s;i--,s--)if(l[i]!==c[s]){if(i!==1||s!==1)do if(i--,s--,0>s||l[i]!==c[s]){var h=`
`+l[i].replace(" at new "," at ");return e.displayName&&h.includes("<anonymous>")&&(h=h.replace("<anonymous>",e.displayName)),h}while(1<=i&&0<=s);break}}}finally{Zp=!1,Error.prepareStackTrace=n}return(n=e?e.displayName||e.name:"")?ua(n):""}function ew(e,t){switch(e.tag){case 26:case 27:case 5:return ua(e.type);case 16:return ua("Lazy");case 13:return e.child!==t&&t!==null?ua("Suspense Fallback"):ua("Suspense");case 19:return ua("SuspenseList");case 0:case 15:return jp(e.type,!1);case 11:return jp(e.type.render,!1);case 1:return jp(e.type,!0);case 31:return ua("Activity");case 30:return ua("ViewTransition");default:return""}}function iy(e){try{var t="",n=null;do t+=ew(e,n),n=e,e=e.return;while(e);return t}catch(i){return`
Error generating stack: `+i.message+`
`+i.stack}}var Im=Object.prototype.hasOwnProperty,Bg=sn.unstable_scheduleCallback,Kp=sn.unstable_cancelCallback,nw=sn.unstable_shouldYield,iw=sn.unstable_requestPaint,li=sn.unstable_now,sw=sn.unstable_getCurrentPriorityLevel,Wx=sn.unstable_ImmediatePriority,qx=sn.unstable_UserBlockingPriority,Eh=sn.unstable_NormalPriority,aw=sn.unstable_LowPriority,Yx=sn.unstable_IdlePriority,rw=sn.log,ow=sn.unstable_setDisableYieldValue,Sc=null,ci=null;function ma(e){if(typeof rw=="function"&&ow(e),ci&&typeof ci.setStrictMode=="function")try{ci.setStrictMode(Sc,e)}catch{}}var ui=Math.clz32?Math.clz32:uw,lw=Math.log,cw=Math.LN2;function uw(e){return e>>>=0,e===0?32:31-(lw(e)/cw|0)|0}var Pu=256,Bu=262144,zu=4194304;function ar(e){var t=e&42;if(t!==0)return t;switch(e&-e){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:return 64;case 128:return 128;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:return e&-e;case 262144:case 524288:case 1048576:case 2097152:return e&3932160;case 4194304:case 8388608:case 16777216:case 33554432:return e&62914560;case 67108864:return 67108864;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 0;default:return e}}function Kh(e,t,n){var i=e.pendingLanes;if(i===0)return 0;var s=0,a=e.suspendedLanes,r=e.pingedLanes;e=e.warmLanes;var o=i&134217727;return o!==0?(i=o&~a,i!==0?s=ar(i):(r&=o,r!==0?s=ar(r):n||(n=o&~e,n!==0&&(s=ar(n))))):(o=i&~a,o!==0?s=ar(o):r!==0?s=ar(r):n||(n=i&~e,n!==0&&(s=ar(n)))),s===0?0:t!==0&&t!==s&&(t&a)===0&&(a=s&-s,n=t&-t,a>=n||a===32&&(n&4194048)!==0)?t:s}function bc(e,t){return(e.pendingLanes&~(e.suspendedLanes&~e.pingedLanes)&t)===0}function Zx(e,t){(t&8)!==0&&(t|=t&32);var n=e.entangledLanes;if(n!==0)for(e=e.entanglements,n&=t;0<n;){var i=31-ui(n),s=1<<i;t|=e[i],n&=~s}return t}function hw(e,t){switch(e){case 1:case 2:case 4:case 8:case 64:return t+250;case 16:case 32:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return t+5e3;case 4194304:case 8388608:case 16777216:case 33554432:return-1;case 67108864:case 134217728:case 268435456:case 536870912:case 1073741824:return-1;default:return-1}}function jx(){var e=zu;return zu<<=1,(zu&62914560)===0&&(zu=4194304),e}function Jp(e){for(var t=[],n=0;31>n;n++)t.push(e);return t}function Mc(e,t){e.pendingLanes|=t,t!==268435456&&(e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0)}function dw(e,t,n,i,s,a){var r=e.pendingLanes;e.pendingLanes=n,e.suspendedLanes=0,e.pingedLanes=0,e.warmLanes=0,e.expiredLanes&=n,e.entangledLanes&=n,e.errorRecoveryDisabledLanes&=n,e.shellSuspendCounter=0;var o=e.entanglements,l=e.expirationTimes,c=e.hiddenUpdates;for(n=r&~n;0<n;){var h=31-ui(n),d=1<<h;o[h]=0,l[h]=-1;var u=c[h];if(u!==null)for(c[h]=null,h=0;h<u.length;h++){var p=u[h];p!==null&&(p.lane&=-536870913)}n&=~d}i!==0&&Kx(e,i,0),a!==0&&s===0&&e.tag!==0&&(e.suspendedLanes|=a&~(r&~t))}function Kx(e,t,n){e.pendingLanes|=t,e.suspendedLanes&=~t;var i=31-ui(t);e.entangledLanes|=t,e.entanglements[i]=e.entanglements[i]|1073741824|n&261930}function Jx(e,t){var n=e.entangledLanes|=t;for(e=e.entanglements;n;){var i=31-ui(n),s=1<<i;s&t|e[i]&t&&(e[i]|=t),n&=~s}}function Qx(e,t){var n=t&-t;return n=(n&42)!==0?1:zg(n),(n&(e.suspendedLanes|t))!==0?0:n}function zg(e){switch(e){case 2:e=1;break;case 8:e=4;break;case 32:e=16;break;case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:e=128;break;case 268435456:e=134217728;break;default:e=0}return e}function Fg(e){return e&=-e,2<e?8<e?(e&134217727)!==0?32:268435456:8:2}function $x(){var e=he.p;return e!==0?e:(e=window.event,e===void 0?32:IM(e.type))}function sy(e,t){var n=he.p;try{return he.p=e,t()}finally{he.p=n}}var ks=Math.random().toString(36).slice(2),gn="__reactFiber$"+ks,$n="__reactProps$"+ks,Oo="__reactContainer$"+ks,ay="__reactEvents$"+ks,fw="__reactListeners$"+ks,pw="__reactHandles$"+ks,ry="__reactResources$"+ks,Ec="__reactMarker$"+ks,Th="__reactLoad$"+ks;function Jh(e){delete e[gn],delete e[$n],delete e[fw],delete e[pw]}function lr(e){var t;if(t=e[gn])return t;for(var n=e.parentNode;n;){if(t=n[Oo]||n[gn]){if(n=t.alternate,t.child!==null||n!==null&&n.child!==null)for(e=Mx(e);e!==null;){if(n=e[gn])return n;e=Mx(e)}return t}e=n,n=e.parentNode}return null}function Po(e){if(e=e[gn]||e[Oo]){var t=e.tag;if(t===5||t===6||t===13||t===31||t===26||t===27||t===3)return e}return null}function Vl(e){var t=e.tag;if(t===5||t===26||t===27||t===6)return e.stateNode;throw Error(tt(33))}function ho(e){var t=e[ry];return t||(t=e[ry]={hoistableStyles:new Map,hoistableScripts:new Map}),t}function un(e){e[Ec]=!0}function tS(e){e[Th]=void 0}var eS=new Set,nS={};function Er(e,t){Mo(e,t),Mo(e+"Capture",t)}function Mo(e,t){for(nS[e]=t,e=0;e<t.length;e++)eS.add(t[e])}var mw=RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"),oy={},ly={};function gw(e){return Im.call(ly,e)?!0:Im.call(oy,e)?!1:mw.test(e)?ly[e]=!0:(oy[e]=!0,!1)}var ce=!1;function cy(){var e=ce;return ce=!1,e}function nh(e,t,n){if(gw(t))if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":e.removeAttribute(t);return;case"boolean":var i=t.toLowerCase().slice(0,5);if(i!=="data-"&&i!=="aria-"){e.removeAttribute(t);return}}e.setAttribute(t,n)}}function Fu(e,t,n){if(n===null)e.removeAttribute(t);else{switch(typeof n){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(t);return}e.setAttribute(t,n)}}function Ds(e,t,n,i){if(i===null)e.removeAttribute(n);else{switch(typeof i){case"undefined":case"function":case"symbol":case"boolean":e.removeAttribute(n);return}e.setAttributeNS(t,n,i)}}function si(e){switch(typeof e){case"bigint":case"boolean":case"number":case"string":case"undefined":return e;case"object":return e;default:return""}}function iS(e){var t=e.type;return(e=e.nodeName)&&e.toLowerCase()==="input"&&(t==="checkbox"||t==="radio")}function vw(e,t,n){var i=Object.getOwnPropertyDescriptor(e.constructor.prototype,t);if(!e.hasOwnProperty(t)&&typeof i<"u"&&typeof i.get=="function"&&typeof i.set=="function"){var s=i.get,a=i.set;return Object.defineProperty(e,t,{configurable:!0,get:function(){return s.call(this)},set:function(r){n=""+r,a.call(this,r)}}),Object.defineProperty(e,t,{enumerable:i.enumerable}),{getValue:function(){return n},setValue:function(r){n=""+r},stopTracking:function(){e._valueTracker=null,delete e[t]}}}}function Om(e){if(!e._valueTracker){var t=iS(e)?"checked":"value";e._valueTracker=vw(e,t,""+e[t])}}function sS(e){if(!e)return!1;var t=e._valueTracker;if(!t)return!0;var n=t.getValue(),i="";return e&&(i=iS(e)?e.checked?"true":"false":e.value),e=i,e!==n?(t.setValue(e),!0):!1}var _w=/[\n"\\]/g;function Ni(e){return e.replace(_w,function(t){return"\\"+t.charCodeAt(0).toString(16)+" "})}function Pm(e,t,n,i,s,a,r,o){e.name="",r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"?e.type=r:e.removeAttribute("type"),t!=null?r==="number"?(t===0&&e.value===""||e.value!=t)&&(e.value=""+si(t)):e.value!==""+si(t)&&(e.value=""+si(t)):r!=="submit"&&r!=="reset"||e.removeAttribute("value"),t!=null?r==="number"&&e.value==t?Qp(e,si(e.value)):Qp(e,si(t)):n!=null?Qp(e,si(n)):i!=null&&e.removeAttribute("value"),s==null&&a!=null&&(e.defaultChecked=!!a),s!=null&&(e.checked=s&&typeof s!="function"&&typeof s!="symbol"),o!=null&&typeof o!="function"&&typeof o!="symbol"&&typeof o!="boolean"?e.name=""+si(o):e.removeAttribute("name")}function aS(e,t,n,i,s,a,r,o){if(a!=null&&typeof a!="function"&&typeof a!="symbol"&&typeof a!="boolean"&&(e.type=a),t!=null||n!=null){if(!(a!=="submit"&&a!=="reset"||t!=null)){Om(e);return}n=n!=null?""+si(n):"",t=t!=null?""+si(t):n,o||t===e.value||(e.value=t),e.defaultValue=t}i=i??s,i=typeof i!="function"&&typeof i!="symbol"&&!!i,e.checked=o?e.checked:!!i,e.defaultChecked=!!i,r!=null&&typeof r!="function"&&typeof r!="symbol"&&typeof r!="boolean"&&(e.name=r),Om(e)}function Qp(e,t){e.defaultValue!==""+t&&(e.defaultValue=""+t)}function fo(e,t,n,i){if(e=e.options,t){t={};for(var s=0;s<n.length;s++)t["$"+n[s]]=!0;for(n=0;n<e.length;n++)s=t.hasOwnProperty("$"+e[n].value),e[n].selected!==s&&(e[n].selected=s),s&&i&&(e[n].defaultSelected=!0)}else{for(n=""+si(n),t=null,s=0;s<e.length;s++){if(e[s].value===n){e[s].selected=!0,i&&(e[s].defaultSelected=!0);return}t!==null||e[s].disabled||(t=e[s])}t!==null&&(t.selected=!0)}}function rS(e,t,n){if(t!=null&&(t=""+si(t),t!==e.value&&(e.value=t),n==null)){e.defaultValue!==t&&(e.defaultValue=t);return}e.defaultValue=n!=null?""+si(n):""}function oS(e,t,n,i){if(t==null){if(i!=null){if(n!=null)throw Error(tt(92));if(Hl(i)){if(1<i.length)throw Error(tt(93));i=i[0]}n=i}n==null&&(n=""),t=n}n=si(t),e.defaultValue=n,i=e.textContent,i===n&&i!==""&&i!==null&&(e.value=i),Om(e)}function Eo(e,t){if(t){var n=e.firstChild;if(n&&n===e.lastChild&&n.nodeType===3){n.nodeValue=t;return}}e.textContent=t}var yw=new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));function uy(e,t,n){var i=t.indexOf("--")===0;n==null||typeof n=="boolean"||n===""?i?e.setProperty(t,""):t==="float"?e.cssFloat="":e[t]="":i?e.setProperty(t,n):typeof n!="number"||n===0||yw.has(t)?t==="float"?e.cssFloat=n:e[t]=(""+n).trim():e[t]=n+"px"}function lS(e,t,n){if(t!=null&&typeof t!="object")throw Error(tt(62));if(e=e.style,n!=null){for(var i in n)!n.hasOwnProperty(i)||t!=null&&t.hasOwnProperty(i)||(i.indexOf("--")===0?e.setProperty(i,""):i==="float"?e.cssFloat="":e[i]="",ce=!0);for(var s in t)i=t[s],t.hasOwnProperty(s)&&n[s]!==i&&(uy(e,s,i),ce=!0)}else for(var a in t)t.hasOwnProperty(a)&&uy(e,a,t[a])}function Gg(e){if(e.indexOf("-")===-1)return!1;switch(e){case"annotation-xml":case"color-profile":case"font-face":case"font-face-src":case"font-face-uri":case"font-face-format":case"font-face-name":case"missing-glyph":return!1;default:return!0}}var xw=new Map([["acceptCharset","accept-charset"],["htmlFor","for"],["httpEquiv","http-equiv"],["crossOrigin","crossorigin"],["accentHeight","accent-height"],["alignmentBaseline","alignment-baseline"],["arabicForm","arabic-form"],["baselineShift","baseline-shift"],["capHeight","cap-height"],["clipPath","clip-path"],["clipRule","clip-rule"],["colorInterpolation","color-interpolation"],["colorInterpolationFilters","color-interpolation-filters"],["colorProfile","color-profile"],["colorRendering","color-rendering"],["dominantBaseline","dominant-baseline"],["enableBackground","enable-background"],["fillOpacity","fill-opacity"],["fillRule","fill-rule"],["floodColor","flood-color"],["floodOpacity","flood-opacity"],["fontFamily","font-family"],["fontSize","font-size"],["fontSizeAdjust","font-size-adjust"],["fontStretch","font-stretch"],["fontStyle","font-style"],["fontVariant","font-variant"],["fontWeight","font-weight"],["glyphName","glyph-name"],["glyphOrientationHorizontal","glyph-orientation-horizontal"],["glyphOrientationVertical","glyph-orientation-vertical"],["horizAdvX","horiz-adv-x"],["horizOriginX","horiz-origin-x"],["imageRendering","image-rendering"],["letterSpacing","letter-spacing"],["lightingColor","lighting-color"],["markerEnd","marker-end"],["markerMid","marker-mid"],["markerStart","marker-start"],["maskType","mask-type"],["overlinePosition","overline-position"],["overlineThickness","overline-thickness"],["paintOrder","paint-order"],["panose-1","panose-1"],["pointerEvents","pointer-events"],["renderingIntent","rendering-intent"],["shapeRendering","shape-rendering"],["stopColor","stop-color"],["stopOpacity","stop-opacity"],["strikethroughPosition","strikethrough-position"],["strikethroughThickness","strikethrough-thickness"],["strokeDasharray","stroke-dasharray"],["strokeDashoffset","stroke-dashoffset"],["strokeLinecap","stroke-linecap"],["strokeLinejoin","stroke-linejoin"],["strokeMiterlimit","stroke-miterlimit"],["strokeOpacity","stroke-opacity"],["strokeWidth","stroke-width"],["textAnchor","text-anchor"],["textDecoration","text-decoration"],["textRendering","text-rendering"],["transformOrigin","transform-origin"],["underlinePosition","underline-position"],["underlineThickness","underline-thickness"],["unicodeBidi","unicode-bidi"],["unicodeRange","unicode-range"],["unitsPerEm","units-per-em"],["vAlphabetic","v-alphabetic"],["vHanging","v-hanging"],["vIdeographic","v-ideographic"],["vMathematical","v-mathematical"],["vectorEffect","vector-effect"],["vertAdvY","vert-adv-y"],["vertOriginX","vert-origin-x"],["vertOriginY","vert-origin-y"],["wordSpacing","word-spacing"],["writingMode","writing-mode"],["xmlnsXlink","xmlns:xlink"],["xHeight","x-height"]]),Sw=/^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;function ih(e){return Sw.test(""+e)?"javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')":e}function us(){}var Bm=null;function Hg(e){return e=e.target||e.srcElement||window,e.correspondingUseElement&&(e=e.correspondingUseElement),e.nodeType===3?e.parentNode:e}var no=null,po=null;function hy(e){var t=Po(e);if(t&&(e=t.stateNode)){var n=e[$n]||null;t:switch(e=t.stateNode,t.type){case"input":if(Pm(e,n.value,n.defaultValue,n.defaultValue,n.checked,n.defaultChecked,n.type,n.name),t=n.name,n.type==="radio"&&t!=null){for(n=e;n.parentNode;)n=n.parentNode;for(n=n.querySelectorAll('input[name="'+Ni(""+t)+'"][type="radio"]'),t=0;t<n.length;t++){var i=n[t];if(i!==e&&i.form===e.form){var s=i[$n]||null;if(!s)throw Error(tt(90));Pm(i,s.value,s.defaultValue,s.defaultValue,s.checked,s.defaultChecked,s.type,s.name)}}for(t=0;t<n.length;t++)i=n[t],i.form===e.form&&sS(i)}break t;case"textarea":rS(e,n.value,n.defaultValue);break t;case"select":t=n.value,t!=null&&fo(e,!!n.multiple,t,!1)}}}var $p=!1;function cS(e,t,n){if($p)return e(t,n);$p=!0;try{var i=e(t);return i}finally{if($p=!1,(no!==null||po!==null)&&(hd(),no&&(t=no,e=po,po=no=null,hy(t),e)))for(t=0;t<e.length;t++)hy(e[t])}}function ac(e,t){var n=e.stateNode;if(n===null)return null;var i=n[$n]||null;if(i===null)return null;n=i[t];t:switch(t){case"onClick":case"onClickCapture":case"onDoubleClick":case"onDoubleClickCapture":case"onMouseDown":case"onMouseDownCapture":case"onMouseMove":case"onMouseMoveCapture":case"onMouseUp":case"onMouseUpCapture":case"onMouseEnter":(i=!i.disabled)||(e=e.type,i=!(e==="button"||e==="input"||e==="select"||e==="textarea")),e=!i;break t;default:e=!1}if(e)return null;if(n&&typeof n!="function")throw Error(tt(231,t,typeof n));return n}var Bs=!(typeof window>"u"||typeof window.document>"u"||typeof window.document.createElement>"u"),zm=!1;if(Bs)try{Yr={},Object.defineProperty(Yr,"passive",{get:function(){zm=!0}}),window.addEventListener("test",Yr,Yr),window.removeEventListener("test",Yr,Yr)}catch{zm=!1}var Yr,ga=null,Vg=null,sh=null;function uS(){if(sh)return sh;var e,t=Vg,n=t.length,i,s="value"in ga?ga.value:ga.textContent,a=s.length;for(e=0;e<n&&t[e]===s[e];e++);var r=n-e;for(i=1;i<=r&&t[n-i]===s[a-i];i++);return sh=s.slice(e,1<i?1-i:void 0)}function ah(e){var t=e.keyCode;return"charCode"in e?(e=e.charCode,e===0&&t===13&&(e=13)):e=t,e===10&&(e=13),32<=e||e===13?e:0}function Gu(){return!0}function dy(){return!1}function Gn(e){function t(n,i,s,a,r){this._reactName=n,this._targetInst=s,this.type=i,this.nativeEvent=a,this.target=r,this.currentTarget=null;for(var o in e)e.hasOwnProperty(o)&&(n=e[o],this[o]=n?n(a):a[o]);return this.isDefaultPrevented=(a.defaultPrevented!=null?a.defaultPrevented:a.returnValue===!1)?Gu:dy,this.isPropagationStopped=dy,this}return Ae(t.prototype,{preventDefault:function(){this.defaultPrevented=!0;var n=this.nativeEvent;n&&(n.preventDefault?n.preventDefault():typeof n.returnValue!="unknown"&&(n.returnValue=!1),this.isDefaultPrevented=Gu)},stopPropagation:function(){var n=this.nativeEvent;n&&(n.stopPropagation?n.stopPropagation():typeof n.cancelBubble!="unknown"&&(n.cancelBubble=!0),this.isPropagationStopped=Gu)},persist:function(){},isPersistent:Gu}),t}var Pa={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(e){return e.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},Qh=Gn(Pa),Tc=Ae({},Pa,{view:0,detail:0}),bw=Gn(Tc),tm,em,Ol,$h=Ae({},Tc,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:kg,button:0,buttons:0,relatedTarget:function(e){return e.relatedTarget===void 0?e.fromElement===e.srcElement?e.toElement:e.fromElement:e.relatedTarget},movementX:function(e){return"movementX"in e?e.movementX:(e!==Ol&&(Ol&&e.type==="mousemove"?(tm=e.screenX-Ol.screenX,em=e.screenY-Ol.screenY):em=tm=0,Ol=e),tm)},movementY:function(e){return"movementY"in e?e.movementY:em}}),fy=Gn($h),Mw=Ae({},$h,{dataTransfer:0}),Ew=Gn(Mw),Tw=Ae({},Tc,{relatedTarget:0}),nm=Gn(Tw),ww=Ae({},Pa,{animationName:0,elapsedTime:0,pseudoElement:0}),Aw=Gn(ww),Cw=Ae({},Pa,{clipboardData:function(e){return"clipboardData"in e?e.clipboardData:window.clipboardData}}),Rw=Gn(Cw),Nw=Ae({},Pa,{data:0}),py=Gn(Nw),Dw={Esc:"Escape",Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Lw={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Uw={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Iw(e){var t=this.nativeEvent;return t.getModifierState?t.getModifierState(e):(e=Uw[e])?!!t[e]:!1}function kg(){return Iw}var Ow=Ae({},Tc,{key:function(e){if(e.key){var t=Dw[e.key]||e.key;if(t!=="Unidentified")return t}return e.type==="keypress"?(e=ah(e),e===13?"Enter":String.fromCharCode(e)):e.type==="keydown"||e.type==="keyup"?Lw[e.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:kg,charCode:function(e){return e.type==="keypress"?ah(e):0},keyCode:function(e){return e.type==="keydown"||e.type==="keyup"?e.keyCode:0},which:function(e){return e.type==="keypress"?ah(e):e.type==="keydown"||e.type==="keyup"?e.keyCode:0}}),Pw=Gn(Ow),Bw=Ae({},$h,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),my=Gn(Bw),zw=Ae({},Pa,{submitter:0}),Fw=Gn(zw),Gw=Ae({},Tc,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:kg}),Hw=Gn(Gw),Vw=Ae({},Pa,{propertyName:0,elapsedTime:0,pseudoElement:0}),kw=Gn(Vw),Xw=Ae({},$h,{deltaX:function(e){return"deltaX"in e?e.deltaX:"wheelDeltaX"in e?-e.wheelDeltaX:0},deltaY:function(e){return"deltaY"in e?e.deltaY:"wheelDeltaY"in e?-e.wheelDeltaY:"wheelDelta"in e?-e.wheelDelta:0},deltaZ:0,deltaMode:0}),Ww=Gn(Xw),qw=Ae({},Pa,{newState:0,oldState:0,source:0}),Yw=Gn(qw),Zw=[9,13,27,32],Xg=Bs&&"CompositionEvent"in window,Wl=null;Bs&&"documentMode"in document&&(Wl=document.documentMode);var jw=Bs&&"TextEvent"in window&&!Wl,hS=Bs&&(!Xg||Wl&&8<Wl&&11>=Wl),gy=" ",vy=!1;function dS(e,t){switch(e){case"keyup":return Zw.indexOf(t.keyCode)!==-1;case"keydown":return t.keyCode!==229;case"keypress":case"mousedown":case"focusout":return!0;default:return!1}}function fS(e){return e=e.detail,typeof e=="object"&&"data"in e?e.data:null}var io=!1;function Kw(e,t){switch(e){case"compositionend":return fS(t);case"keypress":return t.which!==32?null:(vy=!0,gy);case"textInput":return e=t.data,e===gy&&vy?null:e;default:return null}}function Jw(e,t){if(io)return e==="compositionend"||!Xg&&dS(e,t)?(e=uS(),sh=Vg=ga=null,io=!1,e):null;switch(e){case"paste":return null;case"keypress":if(!(t.ctrlKey||t.altKey||t.metaKey)||t.ctrlKey&&t.altKey){if(t.char&&1<t.char.length)return t.char;if(t.which)return String.fromCharCode(t.which)}return null;case"compositionend":return hS&&t.locale!=="ko"?null:t.data;default:return null}}var Qw={color:!0,date:!0,datetime:!0,"datetime-local":!0,email:!0,month:!0,number:!0,password:!0,range:!0,search:!0,tel:!0,text:!0,time:!0,url:!0,week:!0};function _y(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t==="input"?!!Qw[e.type]:t==="textarea"}function pS(e,t,n,i){no?po?po.push(i):po=[i]:no=i,t=Yh(t,"onChange"),0<t.length&&(n=new Qh("onChange","change",null,n,i),e.push({event:n,listeners:t}))}var ql=null,rc=null;function $w(e){cM(e,0)}function td(e){var t=Vl(e);if(sS(t))return e}function yy(e,t){if(e==="change")return t}var mS=!1;Bs&&(Bs?(Vu="oninput"in document,Vu||(im=document.createElement("div"),im.setAttribute("oninput","return;"),Vu=typeof im.oninput=="function"),Hu=Vu):Hu=!1,mS=Hu&&(!document.documentMode||9<document.documentMode));var Hu,Vu,im;function xy(){ql&&(ql.detachEvent("onpropertychange",gS),rc=ql=null)}function gS(e){if(e.propertyName==="value"&&td(rc)){var t=[];pS(t,rc,e,Hg(e)),cS($w,t)}}function tA(e,t,n){e==="focusin"?(xy(),ql=t,rc=n,ql.attachEvent("onpropertychange",gS)):e==="focusout"&&xy()}function eA(e){if(e==="selectionchange"||e==="keyup"||e==="keydown")return td(rc)}function nA(e,t){if(e==="click")return td(t)}function iA(e,t){if(e==="input"||e==="change")return td(t)}function sA(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}var di=typeof Object.is=="function"?Object.is:sA;function oc(e,t){if(di(e,t))return!0;if(typeof e!="object"||e===null||typeof t!="object"||t===null)return!1;var n=Object.keys(e),i=Object.keys(t);if(n.length!==i.length)return!1;for(i=0;i<n.length;i++){var s=n[i];if(!Im.call(t,s)||!di(e[s],t[s]))return!1}return!0}function Fm(e){if(e=e||(typeof document<"u"?document:void 0),typeof e>"u")return null;try{return e.activeElement||e.body}catch{return e.body}}function Sy(e){for(;e&&e.firstChild;)e=e.firstChild;return e}function by(e,t){var n=Sy(e);e=0;for(var i;n;){if(n.nodeType===3){if(i=e+n.textContent.length,e<=t&&i>=t)return{node:n,offset:t-e};e=i}t:{for(;n;){if(n.nextSibling){n=n.nextSibling;break t}n=n.parentNode}n=void 0}n=Sy(n)}}function vS(e,t){return e&&t?e===t?!0:e&&e.nodeType===3?!1:t&&t.nodeType===3?vS(e,t.parentNode):"contains"in e?e.contains(t):e.compareDocumentPosition?!!(e.compareDocumentPosition(t)&16):!1:!1}function _S(e){e=e!=null&&e.ownerDocument!=null&&e.ownerDocument.defaultView!=null?e.ownerDocument.defaultView:window;for(var t=Fm(e.document);t instanceof e.HTMLIFrameElement;){try{var n=typeof t.contentWindow.location.href=="string"}catch{n=!1}if(n)e=t.contentWindow;else break;t=Fm(e.document)}return t}function Wg(e){var t=e&&e.nodeName&&e.nodeName.toLowerCase();return t&&(t==="input"&&(e.type==="text"||e.type==="search"||e.type==="tel"||e.type==="url"||e.type==="password")||t==="textarea"||e.contentEditable==="true")}var aA=Bs&&"documentMode"in document&&11>=document.documentMode,so=null,Gm=null,Yl=null,Hm=!1;function My(e,t,n){var i=n.window===n?n.document:n.nodeType===9?n:n.ownerDocument;Hm||so==null||so!==Fm(i)||(i=so,"selectionStart"in i&&Wg(i)?i={start:i.selectionStart,end:i.selectionEnd}:(i=(i.ownerDocument&&i.ownerDocument.defaultView||window).getSelection(),i={anchorNode:i.anchorNode,anchorOffset:i.anchorOffset,focusNode:i.focusNode,focusOffset:i.focusOffset}),Yl&&oc(Yl,i)||(Yl=i,i=Yh(Gm,"onSelect"),0<i.length&&(t=new Qh("onSelect","select",null,t,n),e.push({event:t,listeners:i}),t.target=so)))}function ir(e,t){var n={};return n[e.toLowerCase()]=t.toLowerCase(),n["Webkit"+e]="webkit"+t,n["Moz"+e]="moz"+t,n}var ao={animationend:ir("Animation","AnimationEnd"),animationiteration:ir("Animation","AnimationIteration"),animationstart:ir("Animation","AnimationStart"),transitionrun:ir("Transition","TransitionRun"),transitionstart:ir("Transition","TransitionStart"),transitioncancel:ir("Transition","TransitionCancel"),transitionend:ir("Transition","TransitionEnd")},sm={},yS={};Bs&&(yS=document.createElement("div").style,"AnimationEvent"in window||(delete ao.animationend.animation,delete ao.animationiteration.animation,delete ao.animationstart.animation),"TransitionEvent"in window||delete ao.transitionend.transition);function Tr(e){if(sm[e])return sm[e];if(!ao[e])return e;var t=ao[e],n;for(n in t)if(t.hasOwnProperty(n)&&n in yS)return sm[e]=t[n];return e}var xS=Tr("animationend"),SS=Tr("animationiteration"),bS=Tr("animationstart"),rA=Tr("transitionrun"),oA=Tr("transitionstart"),lA=Tr("transitioncancel"),MS=Tr("transitionend"),ES=new Map,Vm="abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error fullscreenChange fullscreenError gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");Vm.push("scrollEnd");function ki(e,t){ES.set(e,t),Er(t,[e])}var cA=0;function zs(e,t){if(e.name!=null&&e.name!=="auto")return e.name;if(t.autoName!==null)return t.autoName;e=Vi.identifierPrefix;var n=cA++;return e="_"+e+"t_"+n.toString(32)+"_",t.autoName=e}function Ey(e){if(e==null||typeof e=="string")return e;var t=null,n=So;if(n!==null)for(var i=0;i<n.length;i++){var s=e[n[i]];if(s!=null){if(s==="none")return"none";t=t==null?s:t+(" "+s)}}return t??e.default}function Xs(e,t){return e=Ey(e),t=Ey(t),t==null?e==="auto"?null:e:t==="auto"?null:t}var wh=typeof reportError=="function"?reportError:function(e){if(typeof window=="object"&&typeof window.ErrorEvent=="function"){var t=new window.ErrorEvent("error",{bubbles:!0,cancelable:!0,message:typeof e=="object"&&e!==null&&typeof e.message=="string"?String(e.message):String(e),error:e});if(!window.dispatchEvent(t))return}else if(typeof process=="object"&&typeof process.emit=="function"){process.emit("uncaughtException",e);return}console.error(e)},Ai=[],ro=0,qg=0;function ed(){for(var e=ro,t=qg=ro=0;t<e;){var n=Ai[t];Ai[t++]=null;var i=Ai[t];Ai[t++]=null;var s=Ai[t];Ai[t++]=null;var a=Ai[t];if(Ai[t++]=null,i!==null&&s!==null){var r=i.pending;r===null?s.next=s:(s.next=r.next,r.next=s),i.pending=s}a!==0&&TS(n,s,a)}}function nd(e,t,n,i){Ai[ro++]=e,Ai[ro++]=t,Ai[ro++]=n,Ai[ro++]=i,qg|=i,e.lanes|=i,e=e.alternate,e!==null&&(e.lanes|=i)}function Yg(e,t,n,i){return nd(e,t,n,i),Ah(e)}function wr(e,t){return nd(e,null,null,t),Ah(e)}function TS(e,t,n){e.lanes|=n;var i=e.alternate;i!==null&&(i.lanes|=n);for(var s=!1,a=e.return;a!==null;)a.childLanes|=n,i=a.alternate,i!==null&&(i.childLanes|=n),a.tag===22&&(e=a.stateNode,e===null||e._visibility&1||(s=!0)),e=a,a=a.return;return e.tag===3?(a=e.stateNode,s&&t!==null&&(s=31-ui(n),e=a.hiddenUpdates,i=e[s],i===null?e[s]=[t]:i.push(t),t.lane=n|536870912),a):null}function Ah(e){if(50<ic)throw ic=0,mh=null,Error(tt(185));for(var t=e.return;t!==null;)e=t,t=e.return;return e.tag===3?e.stateNode:null}var oo={};function uA(e,t,n,i){this.tag=e,this.key=n,this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null,this.index=0,this.refCleanup=this.ref=null,this.pendingProps=t,this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null,this.mode=i,this.subtreeFlags=this.flags=0,this.deletions=null,this.childLanes=this.lanes=0,this.alternate=null}function Kn(e,t,n,i){return new uA(e,t,n,i)}function Zg(e){return e=e.prototype,!(!e||!e.isReactComponent)}function Os(e,t){var n=e.alternate;return n===null?(n=Kn(e.tag,t,e.key,e.mode),n.elementType=e.elementType,n.type=e.type,n.stateNode=e.stateNode,n.alternate=e,e.alternate=n):(n.pendingProps=t,n.type=e.type,n.flags=0,n.subtreeFlags=0,n.deletions=null),n.flags=e.flags&1206910976,n.childLanes=e.childLanes,n.lanes=e.lanes,n.child=e.child,n.memoizedProps=e.memoizedProps,n.memoizedState=e.memoizedState,n.updateQueue=e.updateQueue,t=e.dependencies,n.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext},n.sibling=e.sibling,n.index=e.index,n.ref=e.ref,n.refCleanup=e.refCleanup,n}function wS(e,t){e.flags&=1206910978;var n=e.alternate;return n===null?(e.childLanes=0,e.lanes=t,e.child=null,e.subtreeFlags=0,e.memoizedProps=null,e.memoizedState=null,e.updateQueue=null,e.dependencies=null,e.stateNode=null):(e.childLanes=n.childLanes,e.lanes=n.lanes,e.child=n.child,e.subtreeFlags=0,e.deletions=null,e.memoizedProps=n.memoizedProps,e.memoizedState=n.memoizedState,e.updateQueue=n.updateQueue,e.type=n.type,t=n.dependencies,e.dependencies=t===null?null:{lanes:t.lanes,firstContext:t.firstContext}),e}function rh(e,t,n,i,s,a){var r=0;if(i=e,typeof i=="function")Zg(i)&&(r=1);else if(typeof i=="string")r=PC(e,n,fs.current)?26:e==="html"||e==="head"||e==="body"?27:5;else t:switch(i){case Rm:return e=Kn(31,n,t,s),e.elementType=Rm,e.lanes=a,e;case to:return hr(n.children,s,a,t);case kx:r=8,s|=24;break;case wm:return e=Kn(12,n,t,s|2),e.elementType=wm,e.lanes=a,e;case Am:return e=Kn(13,n,t,s),e.elementType=Am,e.lanes=a,e;case Cm:return e=Kn(19,n,t,s),e.elementType=Cm,e.lanes=a,e;case JT:case Nm:return e=s|32,e=Kn(30,n,t,e),e.elementType=Nm,e.lanes=a,e.stateNode={autoName:null,paired:null,clones:null,ref:null},e;default:if(typeof i=="object"&&i!==null)switch(i.$$typeof){case cs:r=10;break t;case Xx:r=9;break t;case Og:r=11;break t;case Pg:r=14;break t;case da:r=16,i=null;break t}r=29,n=Error(tt(130,e===null?"null":typeof e,"")),i=null}return t=Kn(r,n,t,s),t.elementType=e,t.type=i,t.lanes=a,t}function hr(e,t,n,i){return e=Kn(7,e,i,t),e.lanes=n,e}function am(e,t,n){return e=Kn(6,e,null,t),e.lanes=n,e}function AS(e){var t=Kn(18,null,null,0);return t.stateNode=e,t}function rm(e,t,n){return t=Kn(4,e.children!==null?e.children:[],e.key,t),t.lanes=n,t.stateNode={containerInfo:e.containerInfo,pendingChildren:null,implementation:e.implementation},t}var Ty=new WeakMap;function Di(e,t){if(typeof e=="object"&&e!==null){var n=Ty.get(e);return n!==void 0?n:(t={value:e,source:t,stack:iy(t)},Ty.set(e,t),t)}return{value:e,source:t,stack:iy(t)}}var lo=[],co=0,Ch=null,lc=0,Ci=[],Ri=0,Da=null,hs=1,ds="";function Us(e,t){lo[co++]=lc,lo[co++]=Ch,Ch=e,lc=t}function CS(e,t,n){Ci[Ri++]=hs,Ci[Ri++]=ds,Ci[Ri++]=Da,Da=e;var i=hs;e=ds;var s=32-ui(i)-1;i&=~(1<<s),n+=1;var a=32-ui(t)+s;if(30<a){var r=s-s%5;a=(i&(1<<r)-1).toString(32),i>>=r,s-=r,hs=1<<32-ui(t)+s|n<<s|i,ds=a+e}else hs=1<<a|n<<s|i,ds=e}function id(e){e.return!==null&&(Us(e,1),CS(e,1,0))}function jg(e){for(;e===Ch;)Ch=lo[--co],lo[co]=null,lc=lo[--co],lo[co]=null;for(;e===Da;)Da=Ci[--Ri],Ci[Ri]=null,ds=Ci[--Ri],Ci[Ri]=null,hs=Ci[--Ri],Ci[Ri]=null}function RS(e,t){Ci[Ri++]=hs,Ci[Ri++]=ds,Ci[Ri++]=Da,hs=t.id,ds=t.overflow,Da=e}var hn=null,Le=null,Zt=!1,ba=null,Li=!1,km=Error(tt(519));function La(e){var t=Error(tt(418,1<arguments.length&&arguments[1]!==void 0&&arguments[1]?"text":"HTML",""));throw cc(Di(t,e)),km}function wy(e){var t=e.stateNode,n=e.type,i=e.memoizedProps;switch(t[gn]=e,t[$n]=i,n){case"dialog":$t("cancel",t),$t("close",t);break;case"iframe":case"object":case"embed":$t("load",t);break;case"video":case"audio":for(n=0;n<fc.length;n++)$t(fc[n],t);break;case"source":$t("error",t);break;case"img":case"image":case"link":$t("error",t),$t("load",t);break;case"details":$t("toggle",t);break;case"input":$t("invalid",t),aS(t,i.value,i.defaultValue,i.checked,i.defaultChecked,i.type,i.name,!0);break;case"select":$t("invalid",t);break;case"textarea":$t("invalid",t),oS(t,i.value,i.defaultValue,i.children)}n=i.children,typeof n!="string"&&typeof n!="number"&&typeof n!="bigint"||t.textContent===""+n||i.suppressHydrationWarning===!0||hM(t.textContent,n)?(i.popover!=null&&($t("beforetoggle",t),$t("toggle",t)),i.onScroll!=null&&$t("scroll",t),i.onScrollEnd!=null&&$t("scrollend",t),i.onClick!=null&&(t.onclick=us),t=!0):t=!1,t||La(e,!0)}function Rh(e){for(hn=e.return;hn;)switch(hn.tag){case 5:case 31:case 13:Li=!1;return;case 27:case 3:Li=!0;return;default:hn=hn.return}}function Zr(e){if(e!==hn)return!1;if(!Zt)return Rh(e),Zt=!0,!1;var t=e.tag,n;if((n=t!==3&&t!==27)&&((n=t===5)&&(n=e.type,n=!(n!=="form"&&n!=="button")||Ag(e.type,e.memoizedProps)),n=!n),n&&Le&&La(e),Rh(e),t===13){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(tt(317));Le=bx(e)}else if(t===31){if(e=e.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(tt(317));Le=bx(e)}else t===27?(t=Le,Ba(e.type)?(e=Dg,Dg=null,Le=e):Le=t):Le=hn?Ui(e.stateNode.nextSibling):null;return!0}function mr(){Le=hn=null,Zt=!1}function om(){var e=ba;return e!==null&&(Zn===null?Zn=e:Zn.push.apply(Zn,e),ba=null),e}function cc(e){ba===null?ba=[e]:ba.push(e)}var Xm=gs(null),Ar=null,Is=null;function va(e,t,n){Ue(Xm,t._currentValue),t._currentValue=n}function Ps(e){e._currentValue=Xm.current,_n(Xm)}function oh(e,t,n){for(;e!==null;){var i=e.alternate;if((e.childLanes&t)!==t?(e.childLanes|=t,i!==null&&(i.childLanes|=t)):i!==null&&(i.childLanes&t)!==t&&(i.childLanes|=t),e===n)break;e=e.return}}function Wm(e,t,n,i){var s=e.child;for(s!==null&&(s.return=e);s!==null;){var a=s.dependencies;if(a!==null){var r=s.child;a=a.firstContext;t:for(;a!==null;){var o=a;a=s;for(var l=0;l<t.length;l++)if(o.context===t[l]){a.lanes|=n,o=a.alternate,o!==null&&(o.lanes|=n),oh(a.return,n,e),i||(r=null);break t}a=o.next}}else if(s.tag===18){if(r=s.return,r===null)throw Error(tt(341));r.lanes|=n,a=r.alternate,a!==null&&(a.lanes|=n),oh(r,n,e),r=null}else s.tag===13&&s.memoizedState!==null&&s.memoizedState.dehydrated===null?(s.lanes|=n,r=s.alternate,r!==null&&(r.lanes|=n),oh(s.return,n,e),r=s.child,r=r!==null?r.sibling:null):r=s.child;if(r!==null)r.return=s;else for(r=s;r!==null;){if(r===e){r=null;break}if(s=r.sibling,s!==null){s.return=r.return,r=s;break}r=r.return}s=r}}function gr(e,t,n,i){e=null;for(var s=t,a=!1;s!==null;){if(!a){if((s.flags&524288)!==0)a=!0;else if((s.flags&262144)!==0)break}if(s.tag===10){var r=s.alternate;if(r===null)throw Error(tt(387));if(r=r.memoizedProps,r!==null){var o=s.type;di(s.pendingProps.value,r.value)||(e!==null?e.push(o):e=[o])}}else if(s===Sh.current){if(r=s.alternate,r===null)throw Error(tt(387));r.memoizedState.memoizedState!==s.memoizedState.memoizedState&&(e!==null?e.push(Lo):e=[Lo])}s=s.return}return e!==null&&Wm(t,e,n,i),t.flags|=262144,e!==null}function Nh(e){for(e=e.firstContext;e!==null;){if(!di(e.context._currentValue,e.memoizedValue))return!0;e=e.next}return!1}function vr(e){Ar=e,Is=null,e=e.dependencies,e!==null&&(e.firstContext=null)}function vn(e){return NS(Ar,e)}function ku(e,t){return Ar===null&&vr(e),NS(e,t)}function NS(e,t){var n=t._currentValue;if(t={context:t,memoizedValue:n,next:null},Is===null){if(e===null)throw Error(tt(308));Is=t,e.dependencies={lanes:0,firstContext:t},e.flags|=524288}else Is=Is.next=t;return n}var hA=typeof AbortController<"u"?AbortController:function(){var e=[],t=this.signal={aborted:!1,addEventListener:function(n,i){e.push(i)}};this.abort=function(){t.aborted=!0,e.forEach(function(n){return n()})}},dA=sn.unstable_scheduleCallback,fA=sn.unstable_NormalPriority,Qe={$$typeof:cs,Consumer:null,Provider:null,_currentValue:null,_currentValue2:null,_threadCount:0};function Kg(){return{controller:new hA,data:new Map,refCount:0}}function wc(e){e.refCount--,e.refCount===0&&dA(fA,function(){e.controller.abort()})}function Ay(e,t){if((e.pendingLanes&4194048)!==0){var n=e.transitionTypes;for(n===null&&(n=e.transitionTypes=[]),e=0;e<t.length;e++){var i=t[e];n.indexOf(i)===-1&&n.push(i)}}}var kl=null;function pA(e){var t=e.transitionTypes;return e.transitionTypes=null,t}var Zl=null,qm=0,_r=0,mo=null;function mA(e,t){if(Zl===null){var n=Zl=[];qm=0,_r=E0(),mo={status:"pending",value:void 0,then:function(i){n.push(i)}}}return qm++,t.then(Cy,Cy),t}function Cy(){if(--qm===0&&(kl=null,Zl!==null)){mo!==null&&(mo.status="fulfilled");var e=Zl;Zl=null,_r=0,mo=null;for(var t=0;t<e.length;t++)(0,e[t])()}}function gA(e,t){var n=[],i={status:"pending",value:null,reason:null,then:function(s){n.push(s)}};return e.then(function(){i.status="fulfilled",i.value=t;for(var s=0;s<n.length;s++)(0,n[s])(t)},function(s){for(i.status="rejected",i.reason=s,s=0;s<n.length;s++)(0,n[s])(void 0)}),i}var Ry=zt.S;zt.S=function(e,t){if(Zb=li(),typeof t=="object"&&t!==null&&typeof t.then=="function"&&mA(e,t),kl!==null)for(var n=Ro;n!==null;)Ay(n,kl),n=n.next;if(n=e.types,n!==null){for(var i=Ro;i!==null;)Ay(i,n),i=i.next;if(_r!==0){i=kl,i===null&&(i=kl=[]);for(var s=0;s<n.length;s++){var a=n[s];i.indexOf(a)===-1&&i.push(a)}}}Ry!==null&&Ry(e,t)};var dr=gs(null);function Jg(){var e=dr.current;return e!==null?e:we.pooledCache}function lh(e,t){t===null?Ue(dr,dr.current):Ue(dr,t.pool)}function DS(){var e=Jg();return e===null?null:{parent:Qe._currentValue,pool:e}}var Bo=Error(tt(460)),Qg=Error(tt(474)),sd=Error(tt(542)),Dh={then:function(){}};function Ny(e){return e=e.status,e==="fulfilled"||e==="rejected"}function LS(e,t,n){switch(n=e[n],n===void 0?e.push(t):n!==t&&(t.then(us,us),t=n),t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Ly(e),e===void 0&&!("reason"in t)?Error(tt(600)):e;default:if(typeof t.status=="string")t.then(us,us);else{if(e=we,e!==null&&100<e.shellSuspendCounter)throw Error(tt(482));e=t,e.status="pending",e.then(function(i){if(t.status==="pending"){var s=t;s.status="fulfilled",s.value=i}},function(i){if(t.status==="pending"){var s=t;s.status="rejected",s.reason=i}})}switch(t.status){case"fulfilled":return t.value;case"rejected":throw e=t.reason,Ly(e),e}throw fr=t,Bo}}function rr(e){try{var t=e._init;return t(e._payload)}catch(n){throw n!==null&&typeof n=="object"&&typeof n.then=="function"?(fr=n,Bo):n}}var fr=null;function Dy(){if(fr===null)throw Error(tt(459));var e=fr;return fr=null,e}function Ly(e){if(e===Bo||e===sd)throw Error(tt(483))}var go=null,uc=0;function Xu(e){var t=uc;return uc+=1,go===null&&(go=[]),LS(go,e,t)}function ca(e,t){t=t.props.ref,e.ref=t!==void 0?t:null}function Wu(e,t){throw t.$$typeof===KT?Error(tt(525)):(e=Object.prototype.toString.call(t),Error(tt(31,e==="[object Object]"?"object with keys {"+Object.keys(t).join(", ")+"}":e)))}function US(e){function t(f,v){if(e){var b=f.deletions;b===null?(f.deletions=[v],f.flags|=16):b.push(v)}}function n(f,v){if(!e)return null;for(;v!==null;)t(f,v),v=v.sibling;return null}function i(f){for(var v=new Map;f!==null;)f.key===null?v.set(f.index,f):v.set(f.key,f),f=f.sibling;return v}function s(f,v){return f=Os(f,v),f.index=0,f.sibling=null,f}function a(f,v,b){return f.index=b,e?(b=f.alternate,b!==null?(b=b.index,b<v?(f.flags|=2,v):b):(f.flags|=134217730,v)):(f.flags|=1048576,v)}function r(f){return e&&f.alternate===null&&(f.flags|=134217730),f}function o(f,v,b,y){return v===null||v.tag!==6?(v=am(b,f.mode,y),v.return=f,v):(v=s(v,b),v.return=f,v)}function l(f,v,b,y){var T=b.type;return T===to?(f=h(f,v,b.props.children,y,b.key),ca(f,b),f):v!==null&&(v.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===da&&rr(T)===v.type)?(v=s(v,b.props),ca(v,b),v.return=f,v):(v=rh(b.type,b.key,b.props,null,f.mode,y),ca(v,b),v.return=f,v)}function c(f,v,b,y){return v===null||v.tag!==4||v.stateNode.containerInfo!==b.containerInfo||v.stateNode.implementation!==b.implementation?(v=rm(b,f.mode,y),v.return=f,v):(v=s(v,b.children||[]),v.return=f,v)}function h(f,v,b,y,T){return v===null||v.tag!==7?(v=hr(b,f.mode,y,T),v.return=f,v):(v=s(v,b),v.return=f,v)}function d(f,v,b){if(typeof v=="string"&&v!==""||typeof v=="number"||typeof v=="bigint")return v=am(""+v,f.mode,b),v.return=f,v;if(typeof v=="object"&&v!==null){switch(v.$$typeof){case Ou:return b=rh(v.type,v.key,v.props,null,f.mode,b),ca(b,v),b.return=f,b;case Gl:return v=rm(v,f.mode,b),v.return=f,v;case da:return v=rr(v),d(f,v,b)}if(Hl(v)||Il(v))return v=hr(v,f.mode,b,null),v.return=f,v;if(typeof v.then=="function")return d(f,Xu(v),b);if(v.$$typeof===cs)return d(f,ku(f,v),b);Wu(f,v)}return null}function u(f,v,b,y){var T=v!==null?v.key:null;if(typeof b=="string"&&b!==""||typeof b=="number"||typeof b=="bigint")return T!==null?null:o(f,v,""+b,y);if(typeof b=="object"&&b!==null){switch(b.$$typeof){case Ou:return b.key===T?l(f,v,b,y):null;case Gl:return b.key===T?c(f,v,b,y):null;case da:return b=rr(b),u(f,v,b,y)}if(Hl(b)||Il(b))return T!==null?null:h(f,v,b,y,null);if(typeof b.then=="function")return u(f,v,Xu(b),y);if(b.$$typeof===cs)return u(f,v,ku(f,b),y);Wu(f,b)}return null}function p(f,v,b,y,T){if(typeof y=="string"&&y!==""||typeof y=="number"||typeof y=="bigint")return f=f.get(b)||null,o(v,f,""+y,T);if(typeof y=="object"&&y!==null){switch(y.$$typeof){case Ou:return f=f.get(y.key===null?b:y.key)||null,l(v,f,y,T);case Gl:return f=f.get(y.key===null?b:y.key)||null,c(v,f,y,T);case da:return y=rr(y),p(f,v,b,y,T)}if(Hl(y)||Il(y))return f=f.get(b)||null,h(v,f,y,T,null);if(typeof y.then=="function")return p(f,v,b,Xu(y),T);if(y.$$typeof===cs)return p(f,v,b,ku(v,y),T);Wu(v,y)}return null}function m(f,v,b,y){for(var T=null,E=null,w=v,_=v=0,A=null;w!==null&&_<b.length;_++){w.index>_?(A=w,w=null):A=w.sibling;var R=u(f,w,b[_],y);if(R===null){w===null&&(w=A);break}e&&w&&R.alternate===null&&t(f,w),v=a(R,v,_),E===null?T=R:E.sibling=R,E=R,w=A}if(_===b.length)return n(f,w),Zt&&Us(f,_),T;if(w===null){for(;_<b.length;_++)w=d(f,b[_],y),w!==null&&(v=a(w,v,_),E===null?T=w:E.sibling=w,E=w);return Zt&&Us(f,_),T}for(w=i(w);_<b.length;_++)A=p(w,f,_,b[_],y),A!==null&&(e&&(R=A.alternate,R!==null&&w.delete(R.key===null?_:R.key)),v=a(A,v,_),E===null?T=A:E.sibling=A,E=A);return e&&w.forEach(function(O){return t(f,O)}),Zt&&Us(f,_),T}function S(f,v,b,y){if(b==null)throw Error(tt(151));for(var T=null,E=null,w=v,_=v=0,A=null,R=b.next();w!==null&&!R.done;_++,R=b.next()){w.index>_?(A=w,w=null):A=w.sibling;var O=u(f,w,R.value,y);if(O===null){w===null&&(w=A);break}e&&w&&O.alternate===null&&t(f,w),v=a(O,v,_),E===null?T=O:E.sibling=O,E=O,w=A}if(R.done)return n(f,w),Zt&&Us(f,_),T;if(w===null){for(;!R.done;_++,R=b.next())R=d(f,R.value,y),R!==null&&(v=a(R,v,_),E===null?T=R:E.sibling=R,E=R);return Zt&&Us(f,_),T}for(w=i(w);!R.done;_++,R=b.next())R=p(w,f,_,R.value,y),R!==null&&(e&&(A=R.alternate,A!==null&&w.delete(A.key===null?_:A.key)),v=a(R,v,_),E===null?T=R:E.sibling=R,E=R);return e&&w.forEach(function(F){return t(f,F)}),Zt&&Us(f,_),T}function g(f,v,b,y){if(typeof b=="object"&&b!==null&&b.type===to&&b.key===null&&b.props.ref===void 0&&(b=b.props.children),typeof b=="object"&&b!==null){switch(b.$$typeof){case Ou:t:{for(var T=b.key;v!==null;){if(v.key===T){if(T=b.type,T===to){if(v.tag===7){n(f,v.sibling),y=s(v,b.props.children),ca(y,b),y.return=f,f=y;break t}}else if(v.elementType===T||typeof T=="object"&&T!==null&&T.$$typeof===da&&rr(T)===v.type){n(f,v.sibling),y=s(v,b.props),ca(y,b),y.return=f,f=y;break t}n(f,v);break}else t(f,v);v=v.sibling}b.type===to?(y=hr(b.props.children,f.mode,y,b.key),ca(y,b),y.return=f,f=y):(y=rh(b.type,b.key,b.props,null,f.mode,y),ca(y,b),y.return=f,f=y)}return r(f);case Gl:t:{for(T=b.key;v!==null;){if(v.key===T)if(v.tag===4&&v.stateNode.containerInfo===b.containerInfo&&v.stateNode.implementation===b.implementation){n(f,v.sibling),y=s(v,b.children||[]),y.return=f,f=y;break t}else{n(f,v);break}else t(f,v);v=v.sibling}y=rm(b,f.mode,y),y.return=f,f=y}return r(f);case da:return b=rr(b),g(f,v,b,y)}if(Hl(b))return m(f,v,b,y);if(Il(b)){if(T=Il(b),typeof T!="function")throw Error(tt(150));return b=T.call(b),S(f,v,b,y)}if(typeof b.then=="function")return g(f,v,Xu(b),y);if(b.$$typeof===cs)return g(f,v,ku(f,b),y);Wu(f,b)}return typeof b=="string"&&b!==""||typeof b=="number"||typeof b=="bigint"?(b=""+b,v!==null&&v.tag===6?(n(f,v.sibling),y=s(v,b),y.return=f,f=y):(n(f,v),y=am(b,f.mode,y),y.return=f,f=y),r(f)):n(f,v)}return function(f,v,b,y){try{uc=0;var T=g(f,v,b,y);return go=null,T}catch(w){if(w===Bo||w===sd)throw w;var E=Kn(29,w,null,f.mode);return E.lanes=y,E.return=f,E}finally{}}}var yr=US(!0),IS=US(!1),fa=!1;function $g(e){e.updateQueue={baseState:e.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,lanes:0,hiddenCallbacks:null},callbacks:null}}function Ym(e,t){e=e.updateQueue,t.updateQueue===e&&(t.updateQueue={baseState:e.baseState,firstBaseUpdate:e.firstBaseUpdate,lastBaseUpdate:e.lastBaseUpdate,shared:e.shared,callbacks:null})}function Ma(e){return{lane:e,tag:0,payload:null,callback:null,next:null}}function Ea(e,t,n){var i=e.updateQueue;if(i===null)return null;if(i=i.shared,(ue&2)!==0){var s=i.pending;return s===null?t.next=t:(t.next=s.next,s.next=t),i.pending=t,t=Ah(e),TS(e,null,n),t}return nd(e,i,t,n),Ah(e)}function jl(e,t,n){if(t=t.updateQueue,t!==null&&(t=t.shared,(n&4194048)!==0)){var i=t.lanes;i&=e.pendingLanes,n|=i,t.lanes=n,Jx(e,n)}}function lm(e,t){var n=e.updateQueue,i=e.alternate;if(i!==null&&(i=i.updateQueue,n===i)){var s=null,a=null;if(n=n.firstBaseUpdate,n!==null){do{var r={lane:n.lane,tag:n.tag,payload:n.payload,callback:null,next:null};a===null?s=a=r:a=a.next=r,n=n.next}while(n!==null);a===null?s=a=t:a=a.next=t}else s=a=t;n={baseState:i.baseState,firstBaseUpdate:s,lastBaseUpdate:a,shared:i.shared,callbacks:i.callbacks},e.updateQueue=n;return}e=n.lastBaseUpdate,e===null?n.firstBaseUpdate=t:e.next=t,n.lastBaseUpdate=t}var Zm=!1;function Kl(){if(Zm){var e=mo;if(e!==null)throw e}}function Jl(e,t,n,i){Zm=!1;var s=e.updateQueue;fa=!1;var a=s.firstBaseUpdate,r=s.lastBaseUpdate,o=s.shared.pending;if(o!==null){s.shared.pending=null;var l=o,c=l.next;l.next=null,r===null?a=c:r.next=c,r=l;var h=e.alternate;h!==null&&(h=h.updateQueue,o=h.lastBaseUpdate,o!==r&&(o===null?h.firstBaseUpdate=c:o.next=c,h.lastBaseUpdate=l))}if(a!==null){var d=s.baseState;r=0,h=c=l=null,o=a;do{var u=o.lane&-536870913,p=u!==o.lane;if(p?(ne&u)===u:(i&u)===u){u!==0&&u===_r&&(Zm=!0),h!==null&&(h=h.next={lane:0,tag:o.tag,payload:o.payload,callback:null,next:null});t:{var m=e,S=o;u=t;var g=n;switch(S.tag){case 1:if(m=S.payload,typeof m=="function"){d=m.call(g,d,u);break t}d=m;break t;case 3:m.flags=m.flags&-65537|128;case 0:if(m=S.payload,u=typeof m=="function"?m.call(g,d,u):m,u==null)break t;d=Ae({},d,u);break t;case 2:fa=!0}}u=o.callback,u!==null&&(e.flags|=64,p&&(e.flags|=8192),p=s.callbacks,p===null?s.callbacks=[u]:p.push(u))}else p={lane:u,tag:o.tag,payload:o.payload,callback:o.callback,next:null},h===null?(c=h=p,l=d):h=h.next=p,r|=u;if(o=o.next,o===null){if(o=s.shared.pending,o===null)break;p=o,o=p.next,p.next=null,s.lastBaseUpdate=p,s.shared.pending=null}}while(!0);h===null&&(l=d),s.baseState=l,s.firstBaseUpdate=c,s.lastBaseUpdate=h,a===null&&(s.shared.lanes=0),Oa|=r,e.lanes=r,e.memoizedState=d}}function OS(e,t){if(typeof e!="function")throw Error(tt(191,e));e.call(t)}function PS(e,t){var n=e.callbacks;if(n!==null)for(e.callbacks=null,e=0;e<n.length;e++)OS(n[e],t)}var Ua=gs(null),Lh=gs(0);function Uy(e,t){e=Vs,Ue(Lh,e),Ue(Ua,t),Vs=e|t.baseLanes}function jm(){Ue(Lh,Vs),Ue(Ua,Ua.current)}function t0(){Vs=Lh.current,_n(Ua),_n(Lh)}var Sn=gs(null),Rn=null;function Ta(e){var t=e.alternate;Ue(yn,yn.current&1),Ue(Sn,e),Rn===null&&(t===null||Ua.current!==null||t.memoizedState!==null)&&(Rn=e)}function Km(e){Ue(yn,yn.current),Ue(Sn,e),Rn===null&&(Rn=e)}function BS(e){e.tag===22?(Ue(yn,yn.current),Ue(Sn,e),Rn===null&&(Rn=e)):wa()}function wa(){Ue(yn,yn.current),Ue(Sn,Sn.current)}function ai(e){_n(Sn),Rn===e&&(Rn=null),_n(yn)}var yn=gs(0);function hc(e,t){Ue(Sn,Sn.current),Ue(yn,t)}function e0(e){_n(yn),_n(Sn),Rn===e&&(Rn=null)}function Uh(e){for(var t=e;t!==null;){if(t.tag===13){var n=t.memoizedState;if(n!==null&&(n=n.dehydrated,n===null||Ng(n)||C0(n)))return t}else if(t.tag===19&&t.memoizedProps.revealOrder!=="independent"){if((t.flags&128)!==0)return t}else if(t.child!==null){t.child.return=t,t=t.child;continue}if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return null;t=t.return}t.sibling.return=t.return,t=t.sibling}return null}var Fs=0,Xt=null,Ee=null,Je=null,Ih=!1,vo=!1,xr=!1,Oh=0,dc=0,_o=null,vA=0;function We(){throw Error(tt(321))}function n0(e,t){if(t===null)return!1;for(var n=0;n<t.length&&n<e.length;n++)if(!di(e[n],t[n]))return!1;return!0}function i0(e,t,n,i,s,a){return Fs=a,Xt=t,t.memoizedState=null,t.updateQueue=null,t.lanes=0,zt.H=e===null||e.memoizedState===null?pb:mb,xr=!1,a=n(i,s),xr=!1,vo&&(a=FS(t,n,i,s)),zS(e),a}function zS(e){zt.H=Ph;var t=Ee!==null&&Ee.next!==null;if(Fs=0,Je=Ee=Xt=null,Ih=!1,dc=0,_o=null,t)throw Error(tt(300));e===null||$e||(e=e.dependencies,e!==null&&Nh(e)&&($e=!0))}function FS(e,t,n,i){Xt=e;var s=0;do{if(vo&&(_o=null),dc=0,vo=!1,25<=s)throw Error(tt(301));if(s+=1,Je=Ee=null,e.updateQueue!=null){var a=e.updateQueue;a.lastEffect=null,a.events=null,a.stores=null,a.memoCache!=null&&(a.memoCache.index=0)}zt.H=TA,a=t(n,i)}while(vo);return a}function _A(){var e=zt.H,t=e.useState()[0];return t=typeof t.then=="function"?Ac(t):t,e=e.useState()[0],(Ee!==null?Ee.memoizedState:null)!==e&&(Xt.flags|=1024),t}function s0(){var e=Oh!==0;return Oh=0,e}function a0(e,t,n){t.updateQueue=e.updateQueue,t.flags&=-2053,e.lanes&=~n}function r0(e){if(Ih){for(e=e.memoizedState;e!==null;){var t=e.queue;t!==null&&(t.pending=null),e=e.next}Ih=!1}Fs=0,Je=Ee=Xt=null,vo=!1,dc=Oh=0,_o=null}function Fn(){var e={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};return Je===null?Xt.memoizedState=Je=e:Je=Je.next=e,Je}function Ze(){if(Ee===null){var e=Xt.alternate;e=e!==null?e.memoizedState:null}else e=Ee.next;var t=Je===null?Xt.memoizedState:Je.next;if(t!==null)Je=t,Ee=e;else{if(e===null)throw Xt.alternate===null?Error(tt(467)):Error(tt(310));Ee=e,e={memoizedState:Ee.memoizedState,baseState:Ee.baseState,baseQueue:Ee.baseQueue,queue:Ee.queue,next:null},Je===null?Xt.memoizedState=Je=e:Je=Je.next=e}return Je}function ad(){return{lastEffect:null,events:null,stores:null,memoCache:null}}function Ac(e){var t=dc;return dc+=1,_o===null&&(_o=[]),e=LS(_o,e,t),t=Xt,(Je===null?t.memoizedState:Je.next)===null&&(t=t.alternate,zt.H=t===null||t.memoizedState===null?pb:mb),e}function rd(e){if(e!==null&&typeof e=="object"){if(typeof e.then=="function")return Ac(e);if(e.$$typeof===$T)return;if(e.$$typeof===cs)return vn(e)}throw Error(tt(438,String(e)))}function o0(e){var t=null,n=Xt.updateQueue;if(n!==null&&(t=n.memoCache),t==null){var i=Xt.alternate;i!==null&&(i=i.updateQueue,i!==null&&(i=i.memoCache,i!=null&&(t={data:i.data.map(function(s){return s.slice()}),index:0})))}if(t==null&&(t={data:[],index:0}),n===null&&(n=ad(),Xt.updateQueue=n),n.memoCache=t,n=t.data[t.index],n===void 0)for(n=t.data[t.index]=Array(e),i=0;i<e;i++)n[i]=QT;return t.index++,n}function Gs(e,t){return typeof t=="function"?t(e):t}function ch(e){var t=Ze();return l0(t,Ee,e)}function l0(e,t,n){var i=e.queue;if(i===null)throw Error(tt(311));i.lastRenderedReducer=n;var s=e.baseQueue,a=i.pending;if(a!==null){if(s!==null){var r=s.next;s.next=a.next,a.next=r}t.baseQueue=s=a,i.pending=null}if(a=e.baseState,s===null)e.memoizedState=a;else{t=s.next;var o=r=null,l=null,c=t,h=!1;do{var d=c.lane&-536870913;if(d!==c.lane?(ne&d)===d:(Fs&d)===d){var u=c.revertLane;if(u===0)l!==null&&(l=l.next={lane:0,revertLane:0,gesture:null,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null}),d===_r&&(h=!0);else if((Fs&u)===u){c=c.next,u===_r&&(h=!0);continue}else d={lane:0,revertLane:c.revertLane,gesture:null,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null},l===null?(o=l=d,r=a):l=l.next=d,Xt.lanes|=u,Oa|=u;d=c.action,xr&&n(a,d),a=c.hasEagerState?c.eagerState:n(a,d)}else u={lane:d,revertLane:c.revertLane,gesture:c.gesture,action:c.action,hasEagerState:c.hasEagerState,eagerState:c.eagerState,next:null},l===null?(o=l=u,r=a):l=l.next=u,Xt.lanes|=d,Oa|=d;c=c.next}while(c!==null&&c!==t);if(l===null?r=a:l.next=o,!di(a,e.memoizedState)&&($e=!0,h&&(n=mo,n!==null)))throw n;e.memoizedState=a,e.baseState=r,e.baseQueue=l,i.lastRenderedState=a}return s===null&&(i.lanes=0),[e.memoizedState,i.dispatch]}function cm(e){var t=Ze(),n=t.queue;if(n===null)throw Error(tt(311));n.lastRenderedReducer=e;var i=n.dispatch,s=n.pending,a=t.memoizedState;if(s!==null){n.pending=null;var r=s=s.next;do a=e(a,r.action),r=r.next;while(r!==s);di(a,t.memoizedState)||($e=!0),t.memoizedState=a,t.baseQueue===null&&(t.baseState=a),n.lastRenderedState=a}return[a,i]}function GS(e,t,n){var i=Xt,s=Ze(),a=Zt;if(a){if(n===void 0)throw Error(tt(407));n=n()}else n=t();var r=!di((Ee||s).memoizedState,n);if(r&&(s.memoizedState=n,$e=!0),s=s.queue,c0(kS.bind(null,i,s,e),[e]),e=s.getSnapshot!==t||r||Je!==null&&(Je.memoizedState.tag&1)!==0,To(e?9:8,{destroy:void 0},VS.bind(null,i,s,n,t),null),e){if(i.flags|=2048,we===null)throw Error(tt(349));a||(Fs&127)!==0||HS(i,t,n)}return n}function HS(e,t,n){e.flags|=16384,e={getSnapshot:t,value:n},t=Xt.updateQueue,t===null?(t=ad(),Xt.updateQueue=t,t.stores=[e]):(n=t.stores,n===null?t.stores=[e]:n.push(e))}function VS(e,t,n,i){t.value=n,t.getSnapshot=i,XS(t)&&WS(e)}function kS(e,t,n){return n(function(){XS(t)&&WS(e)})}function XS(e){var t=e.getSnapshot;e=e.value;try{var n=t();return!di(e,n)}catch{return!0}}function WS(e){var t=wr(e,2);t!==null&&Jn(t,e,2)}function Jm(e){var t=Fn();if(typeof e=="function"){var n=e;if(e=n(),xr){ma(!0);try{n()}finally{ma(!1)}}}return t.memoizedState=t.baseState=e,t.queue={pending:null,lanes:0,dispatch:null,lastRenderedReducer:Gs,lastRenderedState:e},t}function qS(e,t,n,i){return e.baseState=n,l0(e,Ee,typeof i=="function"?i:Gs)}function yA(e,t,n,i,s){if(ld(e))throw Error(tt(485));if(e=t.action,e!==null){var a={payload:s,action:e,next:null,isTransition:!0,status:"pending",value:null,reason:null,listeners:[],then:function(r){a.listeners.push(r)}};zt.T!==null?n(!0):a.isTransition=!1,i(a),n=t.pending,n===null?(a.next=t.pending=a,YS(t,a)):(a.next=n.next,t.pending=n.next=a)}}function YS(e,t){var n=t.action,i=t.payload,s=e.state;if(t.isTransition){var a=zt.T,r={};r.types=a!==null?a.types:null,zt.T=r;try{var o=n(s,i),l=zt.S;l!==null&&l(r,o),Iy(e,t,o)}catch(c){Qm(e,t,c)}finally{a!==null&&r.types!==null&&(a.types=r.types),zt.T=a}}else try{a=n(s,i),Iy(e,t,a)}catch(c){Qm(e,t,c)}}function Iy(e,t,n){n!==null&&typeof n=="object"&&typeof n.then=="function"?n.then(function(i){Oy(e,t,i)},function(i){return Qm(e,t,i)}):Oy(e,t,n)}function Oy(e,t,n){t.status="fulfilled",t.value=n,ZS(t),e.state=n,t=e.pending,t!==null&&(n=t.next,n===t?e.pending=null:(n=n.next,t.next=n,YS(e,n)))}function Qm(e,t,n){var i=e.pending;if(e.pending=null,i!==null){i=i.next;do t.status="rejected",t.reason=n,ZS(t),t=t.next;while(t!==i)}e.action=null}function ZS(e){e=e.listeners;for(var t=0;t<e.length;t++)(0,e[t])()}function jS(e,t){return t}function Py(e,t){if(Zt){var n=we.formState;if(n!==null){t:{var i=Xt;if(Zt){if(Le){e:{for(var s=Le,a=Li;s.nodeType!==8;){if(!a){s=null;break e}if(s=Ui(s.nextSibling),s===null){s=null;break e}}a=s.data,s=a==="F!"||a==="F"?s:null}if(s){Le=Ui(s.nextSibling),i=s.data==="F!";break t}}La(i)}i=!1}i&&(t=n[0])}}return n=Fn(),n.memoizedState=n.baseState=t,i={pending:null,lanes:0,dispatch:null,lastRenderedReducer:jS,lastRenderedState:t},n.queue=i,n=hb.bind(null,Xt,i),i.dispatch=n,i=Jm(!1),a=f0.bind(null,Xt,!1,i.queue),i=Fn(),s={state:t,dispatch:null,action:e,pending:null},i.queue=s,n=yA.bind(null,Xt,s,a,n),s.dispatch=n,i.memoizedState=e,[t,n,!1]}function By(e){var t=Ze();return KS(t,Ee,e)}function KS(e,t,n){if(t=l0(e,t,jS)[0],e=ch(Gs)[0],typeof t=="object"&&t!==null&&typeof t.then=="function")try{var i=Ac(t)}catch(r){throw r===Bo?sd:r}else i=t;t=Ze();var s=t.queue,a=s.dispatch;return n!==t.memoizedState&&(Xt.flags|=2048,To(9,{destroy:void 0},xA.bind(null,s,n),null)),[i,a,e]}function xA(e,t){e.action=t}function zy(e){var t=Ze(),n=Ee;if(n!==null)return KS(t,n,e);Ze(),t=t.memoizedState,n=Ze();var i=n.queue.dispatch;return n.memoizedState=e,[t,i,!1]}function To(e,t,n,i){return e={tag:e,create:n,deps:i,inst:t,next:null},t=Xt.updateQueue,t===null&&(t=ad(),Xt.updateQueue=t),n=t.lastEffect,n===null?t.lastEffect=e.next=e:(i=n.next,n.next=e,e.next=i,t.lastEffect=e),e}function JS(){return Ze().memoizedState}function uh(e,t,n,i){var s=Fn();Xt.flags|=e,s.memoizedState=To(1|t,{destroy:void 0},n,i===void 0?null:i)}function od(e,t,n,i){var s=Ze();i=i===void 0?null:i;var a=s.memoizedState.inst;Ee!==null&&i!==null&&n0(i,Ee.memoizedState.deps)?s.memoizedState=To(t,a,n,i):(Xt.flags|=e,s.memoizedState=To(1|t,a,n,i))}function Fy(e,t){uh(8390656,8,e,t)}function c0(e,t){od(2048,8,e,t)}function SA(e){Xt.flags|=4;var t=Xt.updateQueue;if(t===null)t=ad(),Xt.updateQueue=t,t.events=[e];else{var n=t.events;n===null?t.events=[e]:n.push(e)}}function QS(e){var t=Ze().memoizedState;return SA({ref:t,nextImpl:e}),function(){if((ue&2)!==0)throw Error(tt(440));return t.impl.apply(void 0,arguments)}}function $S(e,t){return od(4,2,e,t)}function tb(e,t){return od(4,4,e,t)}function eb(e,t){if(typeof t=="function"){e=e();var n=t(e);return function(){typeof n=="function"?n():t(null)}}if(t!=null)return e=e(),t.current=e,function(){t.current=null}}function nb(e,t,n){n=n!=null?n.concat([e]):null,od(4,4,eb.bind(null,t,e),n)}function u0(){}function ib(e,t){var n=Ze();t=t===void 0?null:t;var i=n.memoizedState;return t!==null&&n0(t,i[1])?i[0]:(n.memoizedState=[e,t],e)}function sb(e,t){var n=Ze();t=t===void 0?null:t;var i=n.memoizedState;if(t!==null&&n0(t,i[1]))return i[0];if(i=e(),xr){ma(!0);try{e()}finally{ma(!1)}}return n.memoizedState=[i,t],i}function h0(e,t,n){return n===void 0||(Fs&1073741824)!==0&&(ne&261930)===0?e.memoizedState=t:(e.memoizedState=n,e=Kb(),Xt.lanes|=e,Oa|=e,n)}function ab(e,t,n,i){return di(n,t)?n:Ua.current!==null?(e=h0(e,n,i),di(e,t)||($e=!0),e):(Fs&106)===0||(Fs&1073741824)!==0&&(ne&261930)===0?($e=!0,e.memoizedState=n):(e=Kb(),Xt.lanes|=e,Oa|=e,t)}function rb(e,t,n,i,s){var a=he.p;he.p=a!==0&&8>a?a:8;var r=zt.T,o={};o.types=r!==null?r.types:null,zt.T=o,f0(e,!1,t,n);try{var l=s(),c=zt.S;if(c!==null&&c(o,l),l!==null&&typeof l=="object"&&typeof l.then=="function"){var h=gA(l,i);Ql(e,t,h,hi(e))}else Ql(e,t,i,hi(e))}catch(d){Ql(e,t,{then:function(){},status:"rejected",reason:d},hi())}finally{he.p=a,r!==null&&o.types!==null&&(r.types=o.types),zt.T=r}}function bA(){}function $m(e,t,n,i){if(e.tag!==5)throw Error(tt(476));var s=ob(e).queue;rb(e,s,t,ur,n===null?bA:function(){return lb(e),n(i)})}function ob(e){var t=e.memoizedState;if(t!==null)return t;t={memoizedState:ur,baseState:ur,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Gs,lastRenderedState:ur},next:null};var n={};return t.next={memoizedState:n,baseState:n,baseQueue:null,queue:{pending:null,lanes:0,dispatch:null,lastRenderedReducer:Gs,lastRenderedState:n},next:null},e.memoizedState=t,e=e.alternate,e!==null&&(e.memoizedState=t),t}function lb(e){var t=ob(e);t.next===null&&(t=e.alternate.memoizedState),Ql(e,t.next.queue,{},hi())}function d0(){return vn(Lo)}function cb(){return Ze().memoizedState}function ub(){return Ze().memoizedState}function MA(e){for(var t=e.return;t!==null;){switch(t.tag){case 24:case 3:var n=hi();e=Ma(n);var i=Ea(t,e,n);i!==null&&(Jn(i,t,n),jl(i,t,n)),t={cache:Kg()},e.payload=t;return}t=t.return}}function EA(e,t,n){var i=hi();n={lane:i,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null},ld(e)?db(t,n):(n=Yg(e,t,n,i),n!==null&&(Jn(n,e,i),fb(n,t,i)))}function hb(e,t,n){var i=hi();Ql(e,t,n,i)}function Ql(e,t,n,i){var s={lane:i,revertLane:0,gesture:null,action:n,hasEagerState:!1,eagerState:null,next:null};if(ld(e))db(t,s);else{var a=e.alternate;if(e.lanes===0&&(a===null||a.lanes===0)&&(a=t.lastRenderedReducer,a!==null))try{var r=t.lastRenderedState,o=a(r,n);if(s.hasEagerState=!0,s.eagerState=o,di(o,r))return nd(e,t,s,0),we===null&&ed(),!1}catch{}finally{}if(n=Yg(e,t,s,i),n!==null)return Jn(n,e,i),fb(n,t,i),!0}return!1}function f0(e,t,n,i){if(i={lane:2,revertLane:E0(),gesture:null,action:i,hasEagerState:!1,eagerState:null,next:null},ld(e)){if(t)throw Error(tt(479))}else t=Yg(e,n,i,2),t!==null&&Jn(t,e,2)}function ld(e){var t=e.alternate;return e===Xt||t!==null&&t===Xt}function db(e,t){vo=Ih=!0;var n=e.pending;n===null?t.next=t:(t.next=n.next,n.next=t),e.pending=t}function fb(e,t,n){if((n&4194048)!==0){var i=t.lanes;i&=e.pendingLanes,n|=i,t.lanes=n,Jx(e,n)}}var Ph={readContext:vn,use:rd,useCallback:We,useContext:We,useEffect:We,useImperativeHandle:We,useLayoutEffect:We,useInsertionEffect:We,useMemo:We,useReducer:We,useRef:We,useState:We,useDebugValue:We,useDeferredValue:We,useTransition:We,useSyncExternalStore:We,useId:We,useHostTransitionStatus:We,useFormState:We,useActionState:We,useOptimistic:We,useMemoCache:We,useCacheRefresh:We,useEffectEvent:We},pb={readContext:vn,use:rd,useCallback:function(e,t){return Fn().memoizedState=[e,t===void 0?null:t],e},useContext:vn,useEffect:Fy,useImperativeHandle:function(e,t,n){n=n!=null?n.concat([e]):null,uh(4194308,4,eb.bind(null,t,e),n)},useLayoutEffect:function(e,t){return uh(4194308,4,e,t)},useInsertionEffect:function(e,t){uh(4,2,e,t)},useMemo:function(e,t){var n=Fn();t=t===void 0?null:t;var i=e();if(xr){ma(!0);try{e()}finally{ma(!1)}}return n.memoizedState=[i,t],i},useReducer:function(e,t,n){var i=Fn();if(n!==void 0){var s=n(t);if(xr){ma(!0);try{n(t)}finally{ma(!1)}}}else s=t;return i.memoizedState=i.baseState=s,e={pending:null,lanes:0,dispatch:null,lastRenderedReducer:e,lastRenderedState:s},i.queue=e,e=e.dispatch=EA.bind(null,Xt,e),[i.memoizedState,e]},useRef:function(e){var t=Fn();return e={current:e},t.memoizedState=e},useState:function(e){e=Jm(e);var t=e.queue,n=hb.bind(null,Xt,t);return t.dispatch=n,[e.memoizedState,n]},useDebugValue:u0,useDeferredValue:function(e,t){var n=Fn();return h0(n,e,t)},useTransition:function(){var e=Jm(!1);return e=rb.bind(null,Xt,e.queue,!0,!1),Fn().memoizedState=e,[!1,e]},useSyncExternalStore:function(e,t,n){var i=Xt,s=Fn();if(Zt){if(n===void 0)throw Error(tt(407));n=n()}else{if(n=t(),we===null)throw Error(tt(349));(ne&127)!==0||HS(i,t,n)}s.memoizedState=n;var a={value:n,getSnapshot:t};return s.queue=a,Fy(kS.bind(null,i,a,e),[e]),i.flags|=2048,To(9,{destroy:void 0},VS.bind(null,i,a,n,t),null),n},useId:function(){var e=Fn(),t=we.identifierPrefix;if(Zt){var n=ds,i=hs;n=(i&~(1<<32-ui(i)-1)).toString(32)+n,t="_"+t+"R_"+n,n=Oh++,0<n&&(t+="H"+n.toString(32)),t+="_"}else n=vA++,t="_"+t+"r_"+n.toString(32)+"_";return e.memoizedState=t},useHostTransitionStatus:d0,useFormState:Py,useActionState:Py,useOptimistic:function(e){var t=Fn();t.memoizedState=t.baseState=e;var n={pending:null,lanes:0,dispatch:null,lastRenderedReducer:null,lastRenderedState:null};return t.queue=n,t=f0.bind(null,Xt,!0,n),n.dispatch=t,[e,t]},useMemoCache:o0,useCacheRefresh:function(){return Fn().memoizedState=MA.bind(null,Xt)},useEffectEvent:function(e){var t=Fn(),n={impl:e};return t.memoizedState=n,function(){if((ue&2)!==0)throw Error(tt(440));return n.impl.apply(void 0,arguments)}}},mb={readContext:vn,use:rd,useCallback:ib,useContext:vn,useEffect:c0,useImperativeHandle:nb,useInsertionEffect:$S,useLayoutEffect:tb,useMemo:sb,useReducer:ch,useRef:JS,useState:function(){return ch(Gs)},useDebugValue:u0,useDeferredValue:function(e,t){var n=Ze();return ab(n,Ee.memoizedState,e,t)},useTransition:function(){var e=ch(Gs)[0],t=Ze().memoizedState;return[typeof e=="boolean"?e:Ac(e),t]},useSyncExternalStore:GS,useId:cb,useHostTransitionStatus:d0,useFormState:By,useActionState:By,useOptimistic:function(e,t){var n=Ze();return qS(n,Ee,e,t)},useMemoCache:o0,useCacheRefresh:ub,useEffectEvent:QS},TA={readContext:vn,use:rd,useCallback:ib,useContext:vn,useEffect:c0,useImperativeHandle:nb,useInsertionEffect:$S,useLayoutEffect:tb,useMemo:sb,useReducer:cm,useRef:JS,useState:function(){return cm(Gs)},useDebugValue:u0,useDeferredValue:function(e,t){var n=Ze();return Ee===null?h0(n,e,t):ab(n,Ee.memoizedState,e,t)},useTransition:function(){var e=cm(Gs)[0],t=Ze().memoizedState;return[typeof e=="boolean"?e:Ac(e),t]},useSyncExternalStore:GS,useId:cb,useHostTransitionStatus:d0,useFormState:zy,useActionState:zy,useOptimistic:function(e,t){var n=Ze();return Ee!==null?qS(n,Ee,e,t):(n.baseState=e,[e,n.queue.dispatch])},useMemoCache:o0,useCacheRefresh:ub,useEffectEvent:QS};function um(e,t,n,i){t=e.memoizedState,n=n(i,t),n=n==null?t:Ae({},t,n),e.memoizedState=n,e.lanes===0&&(e.updateQueue.baseState=n)}var tg={enqueueSetState:function(e,t,n){e=e._reactInternals;var i=hi(),s=Ma(i);s.payload=t,n!=null&&(s.callback=n),t=Ea(e,s,i),t!==null&&(Jn(t,e,i),jl(t,e,i))},enqueueReplaceState:function(e,t,n){e=e._reactInternals;var i=hi(),s=Ma(i);s.tag=1,s.payload=t,n!=null&&(s.callback=n),t=Ea(e,s,i),t!==null&&(Jn(t,e,i),jl(t,e,i))},enqueueForceUpdate:function(e,t){e=e._reactInternals;var n=hi(),i=Ma(n);i.tag=2,t!=null&&(i.callback=t),t=Ea(e,i,n),t!==null&&(Jn(t,e,n),jl(t,e,n))}};function Gy(e,t,n,i,s,a,r){return e=e.stateNode,typeof e.shouldComponentUpdate=="function"?e.shouldComponentUpdate(i,a,r):t.prototype&&t.prototype.isPureReactComponent?!oc(n,i)||!oc(s,a):!0}function Hy(e,t,n,i){e=t.state,typeof t.componentWillReceiveProps=="function"&&t.componentWillReceiveProps(n,i),typeof t.UNSAFE_componentWillReceiveProps=="function"&&t.UNSAFE_componentWillReceiveProps(n,i),t.state!==e&&tg.enqueueReplaceState(t,t.state,null)}function Sr(e,t){var n=t;if("ref"in t){n={};for(var i in t)i!=="ref"&&(n[i]=t[i])}if(e=e.defaultProps){n===t&&(n=Ae({},n));for(var s in e)n[s]===void 0&&(n[s]=e[s])}return n}function gb(e){wh(e)}function vb(e){console.error(e)}function _b(e){wh(e)}function Bh(e,t){try{var n=e.onUncaughtError;n(t.value,{componentStack:t.stack})}catch(i){setTimeout(function(){throw i})}}function Vy(e,t,n){try{var i=e.onCaughtError;i(n.value,{componentStack:n.stack,errorBoundary:t.tag===1?t.stateNode:null})}catch(s){setTimeout(function(){throw s})}}function eg(e,t,n){return n=Ma(n),n.tag=3,n.payload={element:null},n.callback=function(){Bh(e,t)},n}function yb(e){return e=Ma(e),e.tag=3,e}function xb(e,t,n,i){var s=n.type.getDerivedStateFromError;if(typeof s=="function"){var a=i.value;e.payload=function(){return s(a)},e.callback=function(){Vy(t,n,i)}}var r=n.stateNode;r!==null&&typeof r.componentDidCatch=="function"&&(e.callback=function(){Vy(t,n,i),typeof s!="function"&&(Aa===null?Aa=new Set([this]):Aa.add(this));var o=i.stack;this.componentDidCatch(i.value,{componentStack:o!==null?o:""})})}function wA(e,t,n,i,s){if(n.flags|=32768,i!==null&&typeof i=="object"&&typeof i.then=="function"){if(t=n.alternate,t!==null&&gr(t,n,s,!0),n=Sn.current,n!==null){switch(n.tag){case 31:case 13:case 19:return Rn===null?Wh():n.alternate===null&&qe===0&&(qe=3),n.flags&=-257,n.flags|=65536,n.lanes=s,i===Dh?n.flags|=16384:(t=n.updateQueue,t===null?n.updateQueue=new Set([i]):t.add(i),vm(e,i,s)),!1;case 22:return n.flags|=65536,i===Dh?n.flags|=16384:(t=n.updateQueue,t===null?(t={transitions:null,markerInstances:null,retryQueue:new Set([i])},n.updateQueue=t):(n=t.retryQueue,n===null?t.retryQueue=new Set([i]):n.add(i)),vm(e,i,s)),!1}throw Error(tt(435,n.tag))}return vm(e,i,s),Wh(),!1}if(Zt)return t=Sn.current,t!==null?((t.flags&65536)===0&&(t.flags|=256),t.flags|=65536,t.lanes=s,i!==km&&(e=Error(tt(422),{cause:i}),cc(Di(e,n)))):(i!==km&&(t=Error(tt(423),{cause:i}),cc(Di(t,n))),e=e.current.alternate,e.flags|=65536,s&=-s,e.lanes|=s,i=Di(i,n),s=eg(e.stateNode,i,s),lm(e,s),qe!==4&&(qe=2)),!1;var a=Error(tt(520),{cause:i});if(a=Di(a,n),nc===null?nc=[a]:nc.push(a),qe!==4&&(qe=2),t===null)return!0;i=Di(i,n),n=t;do{switch(n.tag){case 3:return n.flags|=65536,e=s&-s,n.lanes|=e,e=eg(n.stateNode,i,e),lm(n,e),!1;case 1:if(t=n.type,a=n.stateNode,(n.flags&128)===0&&(typeof t.getDerivedStateFromError=="function"||a!==null&&typeof a.componentDidCatch=="function"&&(Aa===null||!Aa.has(a))))return n.flags|=65536,s&=-s,n.lanes|=s,s=yb(s),xb(s,e,n,i),lm(n,s),!1;break;case 22:if(n.memoizedState!==null)return n.flags|=65536,!1}n=n.return}while(n!==null);return!1}var p0=Error(tt(461)),$e=!1;function en(e,t,n,i){t.child=e===null?IS(t,null,n,i):yr(t,e.child,n,i)}function ky(e,t,n,i,s){n=n.render;var a=t.ref;if("ref"in i){var r={};for(var o in i)o!=="ref"&&(r[o]=i[o])}else r=i;return vr(t),i=i0(e,t,n,r,a,s),o=s0(),e!==null&&!$e?(a0(e,t,s),Hs(e,t,s)):(Zt&&o&&id(t),t.flags|=1,en(e,t,i,s),t.child)}function Xy(e,t,n,i,s){if(e===null){var a=n.type;return typeof a=="function"&&!Zg(a)&&a.defaultProps===void 0&&n.compare===null?(t.tag=15,t.type=a,Sb(e,t,a,i,s)):(e=rh(n.type,null,i,t,t.mode,s),e.ref=t.ref,e.return=t,t.child=e)}if(a=e.child,!g0(e,s)){var r=a.memoizedProps;if(n=n.compare,n=n!==null?n:oc,n(r,i)&&e.ref===t.ref)return Hs(e,t,s)}return t.flags|=1,e=Os(a,i),e.ref=t.ref,e.return=t,t.child=e}function Sb(e,t,n,i,s){if(e!==null){var a=e.memoizedProps;if(oc(a,i)&&e.ref===t.ref)if($e=!1,t.pendingProps=i=a,g0(e,s))(e.flags&131072)!==0&&($e=!0);else return t.lanes=e.lanes,Hs(e,t,s)}return ng(e,t,n,i,s)}function bb(e,t,n,i){var s=i.children,a=e!==null?e.memoizedState:null;if(e===null&&t.stateNode===null&&(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),i.mode==="hidden"){if((t.flags&128)!==0){if(a=a!==null?a.baseLanes|n:n,e!==null){for(i=t.child=e.child,s=0;i!==null;)s=s|i.lanes|i.childLanes,i=i.sibling;i=s&~a}else i=0,t.child=null;return Wy(e,t,a,n,i)}if((n&536870912)!==0)t.memoizedState={baseLanes:0,cachePool:null},e!==null&&lh(t,a!==null?a.cachePool:null),a!==null?Uy(t,a):jm(),BS(t);else return i=t.lanes=536870912,Wy(e,t,a!==null?a.baseLanes|n:n,n,i)}else a!==null?(lh(t,a.cachePool),Uy(t,a),wa(),t.memoizedState=null):(e!==null&&lh(t,null),jm(),wa());return en(e,t,s,n),t.child}function $l(e,t){return e!==null&&e.tag===22||t.stateNode!==null||(t.stateNode={_visibility:1,_pendingMarkers:null,_retryCache:null,_transitions:null}),t.sibling}function Wy(e,t,n,i,s){var a=Jg();return a=a===null?null:{parent:Qe._currentValue,pool:a},t.memoizedState={baseLanes:n,cachePool:a},e!==null&&lh(t,null),jm(),BS(t),e!==null&&gr(e,t,i,!0),t.childLanes=s,null}function hh(e,t){return t=cd({mode:t.mode,children:t.children},e.mode),t.ref=e.ref,e.child=t,t.return=e,t}function qy(e,t,n){return yr(t,e.child,null,n),e=hh(t,t.pendingProps),e.flags|=2,ai(t),t.memoizedState=null,e}function AA(e,t,n){var i=t.pendingProps,s=(t.flags&128)!==0;if(t.flags&=-129,e===null){if(Zt){if(i.mode==="hidden")return e=hh(t,i),t.lanes=536870912,e.memoizedState={baseLanes:0,cachePool:null},$l(null,e);if(Km(t),(e=Le)?(e=bM(e,Li),e=e!==null&&e.data==="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Da!==null?{id:hs,overflow:ds}:null,retryLane:536870912,hydrationErrors:null},n=AS(e),n.return=t,t.child=n,hn=t,Le=null)):e=null,e===null)throw La(t);return t.lanes=536870912,null}return hh(t,i)}var a=e.memoizedState;if(a!==null){var r=a.dehydrated;if(Km(t),s)if(t.flags&256)t.flags&=-257,t=qy(e,t,n);else if(t.memoizedState!==null)t.child=e.child,t.flags|=128,t=null;else throw Error(tt(558));else if($e||gr(e,t,n,!1),s=(n&e.childLanes)!==0,$e||s){if(Ua.current===null){if(i=we,i!==null&&(r=Qx(i,n),r!==0&&r!==a.retryLane))throw a.retryLane=r,wr(e,r),Jn(i,e,r),p0;Wh()}t=qy(e,t,n)}else e=a.treeContext,Le=Ui(r.nextSibling),hn=t,Zt=!0,ba=null,Li=!1,e!==null&&RS(t,e),t=hh(t,i),t.flags|=134221824;return t}return e=Os(e.child,{mode:i.mode,children:i.children}),e.ref=t.ref,t.child=e,e.return=t,e}function Kr(e,t){var n=t.ref;if(n===null)e!==null&&e.ref!==null&&(t.flags|=4194816);else{if(typeof n!="function"&&typeof n!="object")throw Error(tt(284));(e===null||e.ref!==n)&&(t.flags|=4194816)}}function ng(e,t,n,i,s){return vr(t),n=i0(e,t,n,i,void 0,s),i=s0(),e!==null&&!$e?(a0(e,t,s),Hs(e,t,s)):(Zt&&i&&id(t),t.flags|=1,en(e,t,n,s),t.child)}function Yy(e,t,n,i,s,a){return vr(t),t.updateQueue=null,n=FS(t,i,n,s),zS(e),i=s0(),e!==null&&!$e?(a0(e,t,a),Hs(e,t,a)):(Zt&&i&&id(t),t.flags|=1,en(e,t,n,a),t.child)}function Zy(e,t,n,i,s){if(vr(t),t.stateNode===null){var a=oo,r=n.contextType;typeof r=="object"&&r!==null&&(a=vn(r)),a=new n(i,a),t.memoizedState=a.state!==null&&a.state!==void 0?a.state:null,a.updater=tg,t.stateNode=a,a._reactInternals=t,a=t.stateNode,a.props=i,a.state=t.memoizedState,a.refs={},$g(t),r=n.contextType,a.context=typeof r=="object"&&r!==null?vn(r):oo,a.state=t.memoizedState,r=n.getDerivedStateFromProps,typeof r=="function"&&(um(t,n,r,i),a.state=t.memoizedState),typeof n.getDerivedStateFromProps=="function"||typeof a.getSnapshotBeforeUpdate=="function"||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(r=a.state,typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount(),r!==a.state&&tg.enqueueReplaceState(a,a.state,null),Jl(t,i,a,s),Kl(),a.state=t.memoizedState),typeof a.componentDidMount=="function"&&(t.flags|=4194308),i=!0}else if(e===null){a=t.stateNode;var o=t.memoizedProps,l=Sr(n,o);a.props=l;var c=a.context,h=n.contextType;r=oo,typeof h=="object"&&h!==null&&(r=vn(h));var d=n.getDerivedStateFromProps;h=typeof d=="function"||typeof a.getSnapshotBeforeUpdate=="function",o=t.pendingProps!==o,h||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(o||c!==r)&&Hy(t,a,i,r),fa=!1;var u=t.memoizedState;a.state=u,Jl(t,i,a,s),Kl(),c=t.memoizedState,o||u!==c||fa?(typeof d=="function"&&(um(t,n,d,i),c=t.memoizedState),(l=fa||Gy(t,n,l,i,u,c,r))?(h||typeof a.UNSAFE_componentWillMount!="function"&&typeof a.componentWillMount!="function"||(typeof a.componentWillMount=="function"&&a.componentWillMount(),typeof a.UNSAFE_componentWillMount=="function"&&a.UNSAFE_componentWillMount()),typeof a.componentDidMount=="function"&&(t.flags|=4194308)):(typeof a.componentDidMount=="function"&&(t.flags|=4194308),t.memoizedProps=i,t.memoizedState=c),a.props=i,a.state=c,a.context=r,i=l):(typeof a.componentDidMount=="function"&&(t.flags|=4194308),i=!1)}else{a=t.stateNode,Ym(e,t),r=t.memoizedProps,h=Sr(n,r),a.props=h,d=t.pendingProps,u=a.context,c=n.contextType,l=oo,typeof c=="object"&&c!==null&&(l=vn(c)),o=n.getDerivedStateFromProps,(c=typeof o=="function"||typeof a.getSnapshotBeforeUpdate=="function")||typeof a.UNSAFE_componentWillReceiveProps!="function"&&typeof a.componentWillReceiveProps!="function"||(r!==d||u!==l)&&Hy(t,a,i,l),fa=!1,u=t.memoizedState,a.state=u,Jl(t,i,a,s),Kl();var p=t.memoizedState;r!==d||u!==p||fa||e!==null&&e.dependencies!==null&&Nh(e.dependencies)?(typeof o=="function"&&(um(t,n,o,i),p=t.memoizedState),(h=fa||Gy(t,n,h,i,u,p,l)||e!==null&&e.dependencies!==null&&Nh(e.dependencies))?(c||typeof a.UNSAFE_componentWillUpdate!="function"&&typeof a.componentWillUpdate!="function"||(typeof a.componentWillUpdate=="function"&&a.componentWillUpdate(i,p,l),typeof a.UNSAFE_componentWillUpdate=="function"&&a.UNSAFE_componentWillUpdate(i,p,l)),typeof a.componentDidUpdate=="function"&&(t.flags|=4),typeof a.getSnapshotBeforeUpdate=="function"&&(t.flags|=1024)):(typeof a.componentDidUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=1024),t.memoizedProps=i,t.memoizedState=p),a.props=i,a.state=p,a.context=l,i=h):(typeof a.componentDidUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=4),typeof a.getSnapshotBeforeUpdate!="function"||r===e.memoizedProps&&u===e.memoizedState||(t.flags|=1024),i=!1)}return a=i,Kr(e,t),i=(t.flags&128)!==0,a||i?(a=t.stateNode,n=i&&typeof n.getDerivedStateFromError!="function"?null:a.render(),t.flags|=1,e!==null&&i?(t.child=yr(t,e.child,null,s),t.child=yr(t,null,n,s)):en(e,t,n,s),t.memoizedState=a.state,e=t.child):e=Hs(e,t,s),e}function jy(e,t,n,i){return mr(),t.flags|=256,en(e,t,n,i),t.child}var ig={dehydrated:null,treeContext:null,retryLane:0,hydrationErrors:null};function sg(e){return{baseLanes:e,cachePool:DS()}}function ag(e,t,n){return e=e!==null?e.childLanes&~n:0,t&&(e|=oi),e}function Mb(e,t,n){var i=t.pendingProps,s=!1,a=(t.flags&128)!==0,r;if((r=a)||(r=e!==null&&e.memoizedState===null?!1:(yn.current&2)!==0),r&&(s=!0,t.flags&=-129),r=(t.flags&32)!==0,t.flags&=-33,e===null){if(Zt){if(s?Ta(t):wa(),(e=Le)?(e=bM(e,Li),e=e!==null&&e.data!=="&"?e:null,e!==null&&(t.memoizedState={dehydrated:e,treeContext:Da!==null?{id:hs,overflow:ds}:null,retryLane:536870912,hydrationErrors:null},n=AS(e),n.return=t,t.child=n,hn=t,Le=null)):e=null,e===null)throw La(t);return C0(e)?t.lanes=32:t.lanes=536870912,null}return a=i.children,i=i.fallback,s?(wa(),s=t.mode,a=cd({mode:"hidden",children:a},s),i=hr(i,s,n,null),a.return=t,i.return=t,a.sibling=i,t.child=a,i=t.child,i.memoizedState=sg(n),i.childLanes=ag(e,r,n),t.memoizedState=ig,$l(null,i)):(Ta(t),m0(t,a))}var o=e.memoizedState;if(o!==null){var l=o.dehydrated;if(l!==null)return CA(e,t,a,r,i,l,o,n)}return s?(wa(),s=i.fallback,a=t.mode,o=e.child,l=o.sibling,i=Os(o,{mode:"hidden",children:i.children}),i.subtreeFlags=o.subtreeFlags&1206910976,l!==null?s=Os(l,s):(s=hr(s,a,n,null),s.flags|=2),s.return=t,i.return=t,i.sibling=s,t.child=i,$l(null,i),i=t.child,s=e.child.memoizedState,s===null?s=sg(n):(a=s.cachePool,a!==null?(o=Qe._currentValue,a=a.parent!==o?{parent:o,pool:o}:a):a=DS(),s={baseLanes:s.baseLanes|n,cachePool:a}),i.memoizedState=s,i.childLanes=ag(e,r,n),t.memoizedState=ig,$l(e.child,i)):(Ta(t),n=e.child,e=n.sibling,n=Os(n,{mode:"visible",children:i.children}),n.return=t,n.sibling=null,e!==null&&(r=t.deletions,r===null?(t.deletions=[e],t.flags|=16):r.push(e)),t.child=n,t.memoizedState=null,n)}function m0(e,t){return t=cd({mode:"visible",children:t},e.mode),t.return=e,e.child=t}function cd(e,t){return e=Kn(22,e,null,t),e.lanes=0,e}function qu(e,t,n){return yr(t,e.child,null,n),e=m0(t,t.pendingProps.children),e.flags|=2,t.memoizedState=null,e}function CA(e,t,n,i,s,a,r,o){if(n)return t.flags&256?(Ta(t),t.flags&=-257,qu(e,t,o)):t.memoizedState!==null?(wa(),t.child=e.child,t.flags|=128,null):(wa(),a=s.fallback,r=t.mode,s=cd({mode:"visible",children:s.children},r),a=hr(a,r,o,null),a.flags|=2,s.return=t,a.return=t,s.sibling=a,t.child=s,yr(t,e.child,null,o),s=t.child,s.memoizedState=sg(o),s.childLanes=ag(e,i,o),t.memoizedState=ig,$l(null,s));if(Ta(t),C0(a)){if(i=a.nextSibling&&a.nextSibling.dataset,i)var l=i.dgst;return i=l,i!==""&&(s=Error(tt(419)),s.stack="",s.digest=i,cc({value:s,source:null,stack:null})),qu(e,t,o)}if($e||gr(e,t,o,!1),i=(o&e.childLanes)!==0,$e||i){if(Ua.current!==null)return qu(e,t,o);if(i=we,i!==null&&(s=Qx(i,o),s!==0&&s!==r.retryLane))throw r.retryLane=s,wr(e,s),Jn(i,e,s),p0;return Ng(a)||Wh(),qu(e,t,o)}return Ng(a)?(t.flags|=192,t.child=e.child,null):(e=r.treeContext,Le=Ui(a.nextSibling),hn=t,Zt=!0,ba=null,Li=!1,e!==null&&RS(t,e),t=m0(t,s.children),t.flags|=134221824,t)}function Ky(e,t,n){e.lanes|=t;var i=e.alternate;i!==null&&(i.lanes|=t),oh(e.return,t,n)}function Jy(e){for(var t=null;e!==null;){var n=e.alternate;n!==null&&Uh(n)===null&&(t=e),e=e.sibling}return t}function Yu(e,t,n,i,s,a){var r=e.memoizedState;r===null?e.memoizedState={isBackwards:t,rendering:null,renderingStartTime:0,last:i,tail:n,tailMode:s,treeForkCount:a}:(r.isBackwards=t,r.rendering=null,r.renderingStartTime=0,r.last=i,r.tail=n,r.tailMode=s,r.treeForkCount=a)}function hm(e){var t=e.child;for(e.child=null;t!==null;){var n=t.sibling;t.sibling=e.child,e.child=t,t=n}}function rg(e,t,n){var i=t.pendingProps,s=i.revealOrder,a=i.tail;i=i.children;var r=yn.current;if(t.flags&128)return hc(t,r),null;var o=(r&2)!==0;if(o?(r=r&1|2,t.flags|=128):r&=1,hc(t,r),s==="backwards"&&e!==null?(hm(e),en(e,t,i,n),hm(e)):en(e,t,i,n),i=Zt?lc:0,!o&&e!==null&&(e.flags&128)!==0)t:for(e=t.child;e!==null;){if(e.tag===13)e.memoizedState!==null&&Ky(e,n,t);else if(e.tag===19)Ky(e,n,t);else if(e.child!==null){e.child.return=e,e=e.child;continue}if(e===t)break t;for(;e.sibling===null;){if(e.return===null||e.return===t)break t;e=e.return}e.sibling.return=e.return,e=e.sibling}switch(s){case"backwards":n=Jy(t.child),n===null?(s=t.child,t.child=null):(s=n.sibling,n.sibling=null,hm(t)),Yu(t,!0,s,null,a,i);break;case"unstable_legacy-backwards":for(n=null,s=t.child,t.child=null;s!==null;){if(e=s.alternate,e!==null&&Uh(e)===null){t.child=s;break}e=s.sibling,s.sibling=n,n=s,s=e}Yu(t,!0,n,null,a,i);break;case"together":Yu(t,!1,null,null,void 0,i);break;case"independent":t.memoizedState=null;break;default:n=Jy(t.child),n===null?(s=t.child,t.child=null):(s=n.sibling,n.sibling=null),Yu(t,!1,s,n,a,i)}return t.child}function Qy(e,t,n){var i=t.pendingProps;return va(t,t.type,i.value),en(e,t,i.children,n),t.child}function Hs(e,t,n){if(e!==null&&(t.dependencies=e.dependencies),Oa|=t.lanes,(n&t.childLanes)===0)if(e!==null){if(gr(e,t,n,!1),(n&t.childLanes)===0)return null}else return null;if(e!==null&&t.child!==e.child)throw Error(tt(153));if(t.child!==null){for(e=t.child,n=Os(e,e.pendingProps),t.child=n,n.return=t;e.sibling!==null;)e=e.sibling,n=n.sibling=Os(e,e.pendingProps),n.return=t;n.sibling=null}return t.child}function g0(e,t){return(e.lanes&t)!==0?!0:(e=e.dependencies,!!(e!==null&&Nh(e)))}function RA(e,t,n){switch(t.tag){case 3:bh(t,t.stateNode.containerInfo),va(t,Qe,e.memoizedState.cache),mr();break;case 27:case 5:Um(t);break;case 4:bh(t,t.stateNode.containerInfo);break;case 10:va(t,t.type,t.memoizedProps.value);break;case 31:if(t.memoizedState!==null)return t.flags|=128,Km(t),null;break;case 13:var i=t.memoizedState;if(i!==null){if(i.dehydrated!==null)return Ta(t),t.flags|=128,null;i=gr(e,t,n,!1);var s=t.child.childLanes;return i||(n&s)!==0?Mb(e,t,n):(Ta(t),e=Hs(e,t,n),e!==null?e.sibling:null)}Ta(t);break;case 19:if(t.flags&128)return rg(e,t,n);if(s=(e.flags&128)!==0,i=(n&t.childLanes)!==0,i||(gr(e,t,n,!1),i=(n&t.childLanes)!==0),s){if(i)return rg(e,t,n);t.flags|=128}if(s=t.memoizedState,s!==null&&(s.rendering=null,s.tail=null,s.lastEffect=null),hc(t,yn.current),i)break;return null;case 22:return t.lanes=0,bb(e,t,n,t.pendingProps);case 24:va(t,Qe,e.memoizedState.cache)}return Hs(e,t,n)}function Eb(e,t,n){if(e!==null)if(e.memoizedProps!==t.pendingProps)$e=!0;else{if(!g0(e,n)&&(t.flags&128)===0)return $e=!1,RA(e,t,n);$e=(e.flags&131072)!==0}else $e=!1,Zt&&(t.flags&1048576)!==0&&CS(t,lc,t.index);switch(t.lanes=0,t.tag){case 16:t:{var i=t.pendingProps;if(e=rr(t.elementType),t.type=e,typeof e=="function")Zg(e)?(i=Sr(e,i),t.tag=1,t=Zy(null,t,e,i,n)):(t.tag=0,t=ng(null,t,e,i,n));else{if(e!=null){var s=e.$$typeof;if(s===Og){t.tag=11,t=ky(null,t,e,i,n);break t}else if(s===Pg){t.tag=14,t=Xy(null,t,e,i,n);break t}else if(s===cs){t.tag=10,t.type=e,t=Qy(null,t,n);break t}}throw t=Dm(e)||e,Error(tt(306,t,""))}}return t;case 0:return ng(e,t,t.type,t.pendingProps,n);case 1:return i=t.type,s=Sr(i,t.pendingProps),Zy(e,t,i,s,n);case 3:t:{if(bh(t,t.stateNode.containerInfo),e===null)throw Error(tt(387));i=t.pendingProps;var a=t.memoizedState;s=a.element,Ym(e,t),Jl(t,i,null,n);var r=t.memoizedState;if(i=r.cache,va(t,Qe,i),i!==a.cache&&Wm(t,[Qe],n,!0),Kl(),i=r.element,a.isDehydrated)if(a={element:i,isDehydrated:!1,cache:r.cache},t.updateQueue.baseState=a,t.memoizedState=a,t.flags&256){t=jy(e,t,i,n);break t}else if(i!==s){s=Di(Error(tt(424)),t),cc(s),t=jy(e,t,i,n);break t}else{switch(e=t.stateNode.containerInfo,e.nodeType){case 9:e=e.body;break;default:e=e.nodeName==="HTML"?e.ownerDocument.body:e}for(Le=Ui(e.firstChild),hn=t,Zt=!0,ba=null,Li=!0,n=IS(t,null,i,n),t.child=n;n;)n.flags=n.flags&-3|134221824,n=n.sibling}else{if(mr(),i===s){t=Hs(e,t,n);break t}en(e,t,i,n)}t=t.child}return t;case 26:return Kr(e,t),e===null?(n=Tx(t.type,null,t.pendingProps,null))?t.memoizedState=n:Zt||(t.stateNode=fM(t.type,t.pendingProps,Sa.current,t)):t.memoizedState=Tx(t.type,e.memoizedProps,t.pendingProps,e.memoizedState),null;case 27:return Um(t),e===null&&Zt&&(i=t.stateNode=MM(t.type,t.pendingProps,Sa.current),hn=t,Li=!0,s=Le,Ba(t.type)?(Dg=s,Le=Ui(i.firstChild)):Le=s),en(e,t,t.pendingProps.children,n),Kr(e,t),e===null&&(t.flags|=4194304),t.child;case 5:return e===null&&Zt&&((s=i=Le)&&(i=SC(i,t.type,t.pendingProps,Li),i!==null?(t.stateNode=i,hn=t,Le=Ui(i.firstChild),Li=!1,s=!0):s=!1),s||La(t)),Um(t),s=t.type,a=t.pendingProps,r=e!==null?e.memoizedProps:null,i=a.children,Ag(s,a)?i=null:r!==null&&Ag(s,r)&&(t.flags|=32),t.memoizedState!==null&&(s=i0(e,t,_A,null,null,n),Lo._currentValue=s),Kr(e,t),en(e,t,i,n),t.child;case 6:return e===null&&Zt&&((e=n=Le)&&(n=bC(n,t.pendingProps,Li),n!==null?(t.stateNode=n,hn=t,Le=null,e=!0):e=!1),e||La(t)),null;case 13:return Mb(e,t,n);case 4:return bh(t,t.stateNode.containerInfo),i=t.pendingProps,e===null?t.child=yr(t,null,i,n):en(e,t,i,n),t.child;case 11:return ky(e,t,t.type,t.pendingProps,n);case 7:return i=t.pendingProps,Kr(e,t),en(e,t,i,n),t.child;case 8:return en(e,t,t.pendingProps.children,n),t.child;case 12:return en(e,t,t.pendingProps.children,n),t.child;case 10:return Qy(e,t,n);case 9:return s=t.type._context,i=t.pendingProps.children,vr(t),s=vn(s),i=i(s),t.flags|=1,en(e,t,i,n),t.child;case 14:return Xy(e,t,t.type,t.pendingProps,n);case 15:return Sb(e,t,t.type,t.pendingProps,n);case 19:return rg(e,t,n);case 31:return AA(e,t,n);case 22:return bb(e,t,n,t.pendingProps);case 24:return vr(t),i=vn(Qe),e===null?(s=Jg(),s===null&&(s=we,a=Kg(),s.pooledCache=a,a.refCount++,a!==null&&(s.pooledCacheLanes|=n),s=a),t.memoizedState={parent:i,cache:s},$g(t),va(t,Qe,s)):((e.lanes&n)!==0&&(Ym(e,t),Jl(t,null,null,n),Kl()),s=e.memoizedState,a=t.memoizedState,s.parent!==i?(s={parent:i,cache:i},t.memoizedState=s,t.lanes===0&&(t.memoizedState=t.updateQueue.baseState=s),va(t,Qe,i)):(i=a.cache,va(t,Qe,i),i!==s.cache&&Wm(t,[Qe],n,!0))),en(e,t,t.pendingProps.children,n),t.child;case 30:return t.stateNode===null&&(t.stateNode={autoName:null,paired:null,clones:null,ref:null}),i=t.pendingProps,i.name!=null&&i.name!=="auto"?t.flags|=e===null?18882560:18874368:Zt&&id(t),e!==null&&e.memoizedProps.name!==i.name?t.flags|=4194816:Kr(e,t),en(e,t,i.children,n),t.child;case 29:throw t.pendingProps}throw Error(tt(156,t.tag))}function Ls(e){e.flags|=4}function dm(e,t,n,i,s){var a;if((a=(e.mode&32)!==0)&&(a=n===null?Cx(t,i):Cx(t,i)&&(i.src!==n.src||i.srcSet!==n.srcSet)),a){if(e.flags|=16777216,(s&335544128)===s)if(e.stateNode.complete)e.flags|=8192;else if($b())e.flags|=8192;else throw fr=Dh,Qg}else e.flags&=-16777217}function $y(e,t){if(t.type!=="stylesheet"||(t.state.loading&4)!==0)e.flags&=-16777217;else if(e.flags|=16777216,!AM(t))if($b())e.flags|=8192;else throw fr=Dh,Qg}function Zu(e,t){t!==null&&(e.flags|=4),e.flags&16384&&(t=e.tag!==22?jx():536870912,e.lanes|=t,wo|=t)}function Pl(e,t){if(!Zt)switch(e.tailMode){case"visible":break;case"collapsed":for(var n=e.tail,i=null;n!==null;)n.alternate!==null&&(i=n),n=n.sibling;i===null?t||e.tail===null?e.tail=null:e.tail.sibling=null:i.sibling=null;break;default:for(t=e.tail,n=null;t!==null;)t.alternate!==null&&(n=t),t=t.sibling;n===null?e.tail=null:n.sibling=null}}function De(e){var t=e.alternate!==null&&e.alternate.child===e.child,n=0,i=0;if(t)for(var s=e.child;s!==null;)n|=s.lanes|s.childLanes,i|=s.subtreeFlags&1206910976,i|=s.flags&1206910976,s.return=e,s=s.sibling;else for(s=e.child;s!==null;)n|=s.lanes|s.childLanes,i|=s.subtreeFlags,i|=s.flags,s.return=e,s=s.sibling;return e.subtreeFlags|=i,e.childLanes=n,t}function NA(e,t,n){var i=t.pendingProps;switch(jg(t),t.tag){case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return De(t),null;case 1:return De(t),null;case 3:return n=t.stateNode,i=null,e!==null&&(i=e.memoizedState.cache),t.memoizedState.cache!==i&&(t.flags|=2048),Ps(Qe),bo(),n.pendingContext&&(n.context=n.pendingContext,n.pendingContext=null),(e===null||e.child===null)&&(Zr(t)?Ls(t):e===null||e.memoizedState.isDehydrated&&(t.flags&256)===0||(t.flags|=1024,om())),De(t),null;case 26:var s=t.type,a=t.memoizedState;return e===null?(Ls(t),a!==null?(De(t),$y(t,a)):(De(t),dm(t,s,null,i,n))):a?a!==e.memoizedState?(Ls(t),De(t),$y(t,a)):(De(t),t.flags&=-16777217):(e=e.memoizedProps,e!==i&&Ls(t),De(t),dm(t,s,e,i,n)),null;case 27:if(Mh(t),n=Sa.current,s=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&Ls(t);else{if(!i){if(t.stateNode===null)throw Error(tt(166));return De(t),t.subtreeFlags&=-33554433,null}e=fs.current,Zr(t)?wy(t,e):(e=MM(s,i,n),t.stateNode=e,Ls(t))}return De(t),t.subtreeFlags&=-33554433,null;case 5:if(Mh(t),s=t.type,e!==null&&t.stateNode!=null)e.memoizedProps!==i&&Ls(t);else{if(!i){if(t.stateNode===null)throw Error(tt(166));return De(t),t.subtreeFlags&=-33554433,null}if(a=fs.current,Zr(t))wy(t,a);else{var r=mc(Sa.current);switch(a){case 1:a=r.createElementNS("http://www.w3.org/2000/svg",s);break;case 2:a=r.createElementNS("http://www.w3.org/1998/Math/MathML",s);break;default:switch(s){case"svg":a=r.createElementNS("http://www.w3.org/2000/svg",s);break;case"math":a=r.createElementNS("http://www.w3.org/1998/Math/MathML",s);break;case"script":a=r.createElement("div"),a.innerHTML="<script><\/script>",a=a.removeChild(a.firstChild);break;case"select":a=typeof i.is=="string"?r.createElement("select",{is:i.is}):r.createElement("select"),i.multiple?a.multiple=!0:i.size&&(a.size=i.size);break;default:a=typeof i.is=="string"?r.createElement(s,{is:i.is}):r.createElement(s)}}a[gn]=t,a[$n]=i;t:for(r=t.child;r!==null;){if(r.tag===5||r.tag===6)a.appendChild(r.stateNode);else if(r.tag!==4&&r.tag!==27&&r.child!==null){r.child.return=r,r=r.child;continue}if(r===t)break t;for(;r.sibling===null;){if(r.return===null||r.return===t)break t;r=r.return}r.sibling.return=r.return,r=r.sibling}t.stateNode=a;t:switch(xn(a,s,i),s){case"button":case"input":case"select":case"textarea":i=!!i.autoFocus;break t;case"img":i=!0;break t;default:i=!1}i&&Ls(t)}}return De(t),t.subtreeFlags&=-33554433,dm(t,t.type,e===null?null:e.memoizedProps,t.pendingProps,n),null;case 6:if(e&&t.stateNode!=null)e.memoizedProps!==i&&Ls(t);else{if(typeof i!="string"&&t.stateNode===null)throw Error(tt(166));if(e=Sa.current,Zr(t)){if(e=t.stateNode,n=t.memoizedProps,i=null,s=hn,s!==null)switch(s.tag){case 27:case 5:i=s.memoizedProps}e[gn]=t,e=!!(e.nodeValue===n||i!==null&&i.suppressHydrationWarning===!0||hM(e.nodeValue,n)),e||La(t,!0)}else e=mc(e).createTextNode(i),e[gn]=t,t.stateNode=e}return De(t),null;case 31:if(n=t.memoizedState,e===null||e.memoizedState!==null){if(i=Zr(t),n!==null){if(e===null){if(!i)throw Error(tt(318));if(e=t.memoizedState,e=e!==null?e.dehydrated:null,!e)throw Error(tt(557));e[gn]=t}else mr(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;De(t),e=!1}else n=om(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=n),e=!0;if(!e)return t.flags&256?(ai(t),t):(ai(t),null);if((t.flags&128)!==0)throw Error(tt(558))}return De(t),null;case 13:if(i=t.memoizedState,e===null||e.memoizedState!==null&&e.memoizedState.dehydrated!==null){if(s=Zr(t),i!==null&&i.dehydrated!==null){if(e===null){if(!s)throw Error(tt(318));if(s=t.memoizedState,s=s!==null?s.dehydrated:null,!s)throw Error(tt(317));s[gn]=t}else mr(),(t.flags&128)===0&&(t.memoizedState=null),t.flags|=4;De(t),s=!1}else s=om(),e!==null&&e.memoizedState!==null&&(e.memoizedState.hydrationErrors=s),s=!0;if(!s)return t.flags&256?(ai(t),t):(ai(t),null)}return ai(t),(t.flags&128)!==0?(t.lanes=n,t):(n=i!==null,e=e!==null&&e.memoizedState!==null,n&&(i=t.child,s=null,i.alternate!==null&&i.alternate.memoizedState!==null&&i.alternate.memoizedState.cachePool!==null&&(s=i.alternate.memoizedState.cachePool.pool),a=null,i.memoizedState!==null&&i.memoizedState.cachePool!==null&&(a=i.memoizedState.cachePool.pool),a!==s&&(i.flags|=2048)),n!==e&&n&&(t.child.flags|=8192),Zu(t,t.updateQueue),De(t),null);case 4:return bo(),e===null&&T0(t.stateNode.containerInfo),t.flags|=67108864,De(t),null;case 10:return Ps(t.type),De(t),null;case 19:if(e0(t),i=t.memoizedState,i===null)return De(t),null;if(s=(t.flags&128)!==0,a=i.rendering,a===null)if(s)Pl(i,!1);else{if(qe!==0||e!==null&&(e.flags&128)!==0)for(e=t.child;e!==null;){if(a=Uh(e),a!==null){for(t.flags|=128,Pl(i,!1),e=a.updateQueue,t.updateQueue=e,Zu(t,e),t.subtreeFlags=0,e=n,n=t.child;n!==null;)wS(n,e),n=n.sibling;return hc(t,yn.current&1|2),Zt&&Us(t,i.treeForkCount),t.child}e=e.sibling}i.tail!==null&&li()>kh&&(t.flags|=128,s=!0,Pl(i,!1),t.lanes=4194304)}else{if(!s)if(e=Uh(a),e!==null){if(t.flags|=128,s=!0,e=e.updateQueue,t.updateQueue=e,Zu(t,e),Pl(i,!0),i.tail===null&&i.tailMode!=="collapsed"&&i.tailMode!=="visible"&&!a.alternate&&!Zt)return De(t),null}else 2*li()-i.renderingStartTime>kh&&n!==536870912&&(t.flags|=128,s=!0,Pl(i,!1),t.lanes=4194304);i.isBackwards?(a.sibling=t.child,t.child=a):(e=i.last,e!==null?e.sibling=a:t.child=a,i.last=a)}if(i.tail!==null){e=i.tail;t:{for(n=e;n!==null;){if(n.alternate!==null){n=!1;break t}n=n.sibling}n=!0}return i.rendering=e,i.tail=e.sibling,i.renderingStartTime=li(),e.sibling=null,a=yn.current,a=s?a&1|2:a&1,i.tailMode==="visible"||i.tailMode==="collapsed"||!n||Zt?hc(t,a):(n=a,Ue(Sn,t),Ue(yn,n),Rn===null&&(Rn=t)),Zt&&Us(t,i.treeForkCount),e}return De(t),null;case 22:case 23:return ai(t),t0(),i=t.memoizedState!==null,e!==null?e.memoizedState!==null!==i&&(t.flags|=8192):i&&(t.flags|=8192),i?(n&536870912)!==0&&(t.flags&128)===0&&(De(t),t.subtreeFlags&6&&(t.flags|=8192)):De(t),n=t.updateQueue,n!==null&&Zu(t,n.retryQueue),n=null,e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),i=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(i=t.memoizedState.cachePool.pool),i!==n&&(t.flags|=2048),e!==null&&_n(dr),null;case 24:return n=null,e!==null&&(n=e.memoizedState.cache),t.memoizedState.cache!==n&&(t.flags|=2048),Ps(Qe),De(t),null;case 25:return null;case 30:return t.flags|=33554432,De(t),null}throw Error(tt(156,t.tag))}function DA(e,t){switch(jg(t),t.tag){case 1:return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 3:return Ps(Qe),bo(),e=t.flags,(e&65536)!==0&&(e&128)===0?(t.flags=e&-65537|128,t):null;case 26:case 27:case 5:return Mh(t),null;case 31:if(t.memoizedState!==null){if(ai(t),t.alternate===null)throw Error(tt(340));mr()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 13:if(ai(t),e=t.memoizedState,e!==null&&e.dehydrated!==null){if(t.alternate===null)throw Error(tt(340));mr()}return e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 19:return e0(t),e=t.flags,e&65536?(t.flags=e&-65537|128,e=t.memoizedState,e!==null&&(e.rendering=null,e.tail=null),t.flags|=4,t):null;case 4:return bo(),null;case 10:return Ps(t.type),null;case 22:case 23:return ai(t),t0(),e!==null&&_n(dr),e=t.flags,e&65536?(t.flags=e&-65537|128,t):null;case 24:return Ps(Qe),null;case 25:return null;default:return null}}function Tb(e,t){switch(jg(t),t.tag){case 3:Ps(Qe),bo();break;case 26:case 27:case 5:Mh(t);break;case 4:bo();break;case 31:t.memoizedState!==null&&ai(t);break;case 13:ai(t);break;case 19:e0(t);break;case 10:Ps(t.type);break;case 22:case 23:ai(t),t0(),e!==null&&_n(dr);break;case 24:Ps(Qe)}}function Cc(e,t){try{var n=t.updateQueue,i=n!==null?n.lastEffect:null;if(i!==null){var s=i.next;n=s;do{if((n.tag&e)===e){i=void 0;var a=n.create,r=n.inst;i=a(),r.destroy=i}n=n.next}while(n!==s)}}catch(o){xe(t,t.return,o)}}function Ia(e,t,n){try{var i=t.updateQueue,s=i!==null?i.lastEffect:null;if(s!==null){var a=s.next;i=a;do{if((i.tag&e)===e){var r=i.inst,o=r.destroy;if(o!==void 0){r.destroy=void 0,s=t;var l=n,c=o;try{c()}catch(h){xe(s,l,h)}}}i=i.next}while(i!==a)}}catch(h){xe(t,t.return,h)}}function wb(e){var t=e.updateQueue;if(t!==null){var n=e.stateNode;try{PS(t,n)}catch(i){xe(e,e.return,i)}}}function Ab(e,t,n){n.props=Sr(e.type,e.memoizedProps),n.state=e.memoizedState;try{n.componentWillUnmount()}catch(i){xe(e,t,i)}}function os(e,t){try{var n=e.ref;if(n!==null){switch(e.tag){case 26:case 27:case 5:var i=e.stateNode;break;case 30:var s=e.stateNode,a=zs(e.memoizedProps,s);(s.ref===null||s.ref.name!==a)&&(s.ref=vM(a)),i=s.ref;break;case 7:if(e.stateNode===null){var r=new fi(e);Qn(e.child,!1,yC,r,void 0,void 0),e.stateNode=r}i=e.stateNode;break;default:i=e.stateNode}typeof n=="function"?e.refCleanup=n(i):n.current=i}}catch(o){xe(e,t,o)}}function mn(e,t){var n=e.ref,i=e.refCleanup;if(n!==null)if(typeof i=="function")try{i()}catch(s){xe(e,t,s)}finally{e.refCleanup=null,e=e.alternate,e!=null&&(e.refCleanup=null)}else if(typeof n=="function")try{n(null)}catch(s){xe(e,t,s)}else n.current=null}function zh(e,t){if((e.tag===5||e.tag===27||e.tag===6)&&e.alternate===null&&t!==null)for(var n=0;n<t.length;n++)SM(e.stateNode,t[n])}function tx(e){for(var t=e.return;t!==null&&(_0(t)&&SM(e.stateNode,t.stateNode),!v0(t));)t=t.return}function tc(e){for(var t=e.return;t!==null&&(_0(t)&&xC(e.stateNode,t.stateNode),!v0(t));)t=t.return}function v0(e){return e.tag===5||e.tag===3||e.tag===27}function _0(e){return e&&e.tag===7&&e.stateNode!==null}function og(e){var t=e.type,n=e.memoizedProps,i=e.stateNode;try{t:switch(t){case"button":case"input":case"select":case"textarea":n.autoFocus&&i.focus();break t;case"img":n.src?i.src=n.src:n.srcSet&&(i.srcset=n.srcSet)}}catch(s){xe(e,e.return,s)}}function fm(e,t,n){try{var i=e.stateNode;eC(i,e.type,n,t),i[$n]=t}catch(s){xe(e,e.return,s)}}function Cb(e){return e.tag===5||e.tag===3||e.tag===26||e.tag===27&&Ba(e.type)||e.tag===4}function pm(e){t:for(;;){for(;e.sibling===null;){if(e.return===null||Cb(e.return))return null;e=e.return}for(e.sibling.return=e.return,e=e.sibling;e.tag!==5&&e.tag!==6&&e.tag!==18;){if(e.tag===27&&Ba(e.type)||e.flags&2||e.child===null||e.tag===4)continue t;e.child.return=e,e=e.child}if(!(e.flags&2))return e.stateNode}}function lg(e,t,n,i){var s=e.tag;if(s===5||s===6)s=e.stateNode,t?(n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n).insertBefore(s,t):(t=n.nodeType===9?n.body:n.nodeName==="HTML"?n.ownerDocument.body:n,t.appendChild(s),n=n._reactRootContainer,n!=null||t.onclick!==null||(t.onclick=us)),zh(e,i),ce=!0;else if(s!==4&&(s===27&&(zh(e,i),i=null,Ba(e.type)&&(n=e.stateNode,t=null)),e=e.child,e!==null))for(lg(e,t,n,i),e=e.sibling;e!==null;)lg(e,t,n,i),e=e.sibling}function Fh(e,t,n,i){var s=e.tag;if(s===5||s===6)s=e.stateNode,t?n.insertBefore(s,t):n.appendChild(s),zh(e,i),ce=!0;else if(s!==4&&(s===27&&(zh(e,i),i=null,Ba(e.type)&&(n=e.stateNode)),e=e.child,e!==null))for(Fh(e,t,n,i),e=e.sibling;e!==null;)Fh(e,t,n,i),e=e.sibling}function Rb(e){var t=e.stateNode,n=e.memoizedProps;try{for(var i=e.type,s=t.attributes;s.length;)t.removeAttributeNode(s[0]);xn(t,i,n),t[gn]=e,t[$n]=n}catch(a){xe(e,e.return,a)}}var Gh=!1,ri=null;function ex(e){(e.tag===30||(e.subtreeFlags&33554432)!==0)&&(Gh=!0)}var ls=null;function nx(){var e=ls;return ls=null,e}var jn=0;function zo(e,t,n,i,s){return jn=0,Nb(e.child,t,n,i,s)}function Nb(e,t,n,i,s){for(var a=!1;e!==null;){if(e.tag===5){var r=e.stateNode;if(i!==null){var o=Cg(r);i.push(o),o.view&&(a=!0)}else a||Cg(r).view&&(a=!0);Gh=!0,pM(r,jn===0?t:t+"_"+jn,n),jn++}else(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&s||Nb(e.child,t,n,i,s)&&(a=!0));e=e.sibling}return a}function ms(e,t){for(;e!==null;)e.tag===5?mM(e.stateNode,e.memoizedProps):(e.tag!==22||e.memoizedState===null)&&(e.tag===30&&t||ms(e.child,t)),e=e.sibling}function dh(e){if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if((e.tag!==22||e.memoizedState===null)&&(dh(e),e.tag===30&&(e.flags&18874368)!==0&&e.stateNode.paired)){var t=e.memoizedProps;if(t.name==null||t.name==="auto")throw Error(tt(544));var n=t.name;t=Xs(t.default,t.share),t!=="none"&&(zo(e,n,t,null,!1)||ms(e.child,!1))}e=e.sibling}}function cg(e,t){if(e.tag===30){var n=e.stateNode,i=e.memoizedProps,s=zs(i,n),a=Xs(i.default,n.paired?i.share:i.enter);a!=="none"?zo(e,s,a,null,!1)?(dh(e),n.paired||t||Ao(e,i.onEnter)):ms(e.child,!1):dh(e)}else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)cg(e,t),e=e.sibling;else dh(e)}function ug(e){if(ri!==null&&ri.size!==0){var t=ri;if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&(e.flags&18874368)!==0){var n=e.memoizedProps,i=n.name;if(i!=null&&i!=="auto"){var s=t.get(i);if(s!==void 0){var a=Xs(n.default,n.share);if(a!=="none"&&(zo(e,i,a,null,!1)?(a=e.stateNode,s.paired=a,a.paired=s,Ao(e,n.onShare)):ms(e.child,!1)),t.delete(i),t.size===0)break}}}ug(e)}e=e.sibling}}}function hg(e){if(e.tag===30){var t=e.memoizedProps,n=zs(t,e.stateNode),i=ri!==null?ri.get(n):void 0,s=Xs(t.default,i!==void 0?t.share:t.exit);s!=="none"&&(zo(e,n,s,null,!1)?i!==void 0?(s=e.stateNode,i.paired=s,s.paired=i,ri.delete(n),Ao(e,t.onShare)):Ao(e,t.onExit):ms(e.child,!1)),ri!==null&&ug(e)}else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)hg(e),e=e.sibling;else ri!==null&&ug(e)}function Db(e){for(e=e.child;e!==null;){if(e.tag===30){var t=e.memoizedProps,n=zs(t,e.stateNode);t=Xs(t.default,t.update),e.flags&=-5,t!=="none"&&zo(e,n,t,e.memoizedState=[],!1)}else(e.subtreeFlags&33554432)!==0&&Db(e);e=e.sibling}}function dg(e){if((e.subtreeFlags&18874368)!==0)for(e=e.child;e!==null;){if(e.tag!==22||e.memoizedState===null){if(e.tag===30&&(e.flags&18874368)!==0){var t=e.stateNode;t.paired!==null&&(t.paired=null,ms(e.child,!1))}dg(e)}e=e.sibling}}function fh(e){if(e.tag===30)e.stateNode.paired=null,ms(e.child,!1),dg(e);else if((e.subtreeFlags&33554432)!==0)for(e=e.child;e!==null;)fh(e),e=e.sibling;else dg(e)}function Lb(e){for(e=e.child;e!==null;)e.tag===30?ms(e.child,!1):(e.subtreeFlags&33554432)!==0&&Lb(e),e=e.sibling}function y0(e,t,n,i,s,a,r){for(var o=!1;t!==null;){if(t.tag===5){var l=t.stateNode;if(a!==null&&jn<a.length){var c=a[jn],h=Cg(l);(c.view||h.view)&&(o=!0);var d;if(d=(e.flags&4)===0)if(h.clip)d=!0;else{d=c.rect;var u=h.rect;d=d.y!==u.y||d.x!==u.x||d.height!==u.height||d.width!==u.width}d&&(e.flags|=4),h.abs?h=!c.abs:(c=c.rect,h=h.rect,h=c.height!==h.height||c.width!==h.width),h&&(e.flags|=32)}else e.flags|=32;(e.flags&4)!==0&&pM(l,jn===0?n:n+"_"+jn,s),o&&(e.flags&4)!==0||(ls===null&&(ls=[]),ls.push(l,jn===0?i:i+"_"+jn,t.memoizedProps)),jn++}else(t.tag!==22||t.memoizedState===null)&&(t.tag===30&&r?e.flags|=t.flags&32:y0(e,t.child,n,i,s,a,r)&&(o=!0));t=t.sibling}return o}function Ub(e,t){for(e=e.child;e!==null;){if(e.tag===30){var n=e.memoizedProps,i=e.stateNode,s=zs(n,i),a=Xs(n.default,n.update);if(t){i=i.clones;var r=i===null?null:i.map(oC)}else r=e.memoizedState,e.memoizedState=null;i=e;var o=e.child;jn=0,s=y0(i,o,s,s,a,r,!1),(e.flags&4)!==0&&s&&(t||Ao(e,n.onUpdate))}else(e.subtreeFlags&33554432)!==0&&Ub(e,t);e=e.sibling}}var ln=!1,pe=!1,ss=!1,mm=!1,ix=typeof WeakSet=="function"?WeakSet:Set,cn=null,as=!1,Xl=!1,Hh=!1,fg=!1;function LA(e,t,n){if(e=e.containerInfo,Tg=Uo,e=_S(e),Wg(e)){if("selectionStart"in e)var i={start:e.selectionStart,end:e.selectionEnd};else t:{i=(i=e.ownerDocument)&&i.defaultView||window;var s=i.getSelection&&i.getSelection();if(s&&s.rangeCount!==0){i=s.anchorNode;var a=s.anchorOffset,r=s.focusNode;s=s.focusOffset;try{i.nodeType,r.nodeType}catch{i=null;break t}var o=0,l=-1,c=-1,h=0,d=0,u=e,p=null;e:for(;;){for(var m;u!==i||a!==0&&u.nodeType!==3||(l=o+a),u!==r||s!==0&&u.nodeType!==3||(c=o+s),u.nodeType===3&&(o+=u.nodeValue.length),(m=u.firstChild)!==null;)p=u,u=m;for(;;){if(u===e)break e;if(p===i&&++h===a&&(l=o),p===r&&++d===s&&(c=o),(m=u.nextSibling)!==null)break;u=p,p=u.parentNode}u=m}i=l===-1||c===-1?null:{start:l,end:c}}else i=null}i=i||{start:0,end:0}}else i=null;for(wg={focusedElem:e,selectionRange:i},Uo=!1,n=(n&335544064)===n,cn=t,t=n?9270:1024;cn!==null;){if(e=cn,n&&(i=e.deletions,i!==null))for(a=0;a<i.length;a++)n&&hg(i[a]);if(e.alternate===null&&(e.flags&2)!==0)n&&ex(e),ju(n);else{if(e.tag===22){if(i=e.alternate,e.memoizedState!==null){i!==null&&i.memoizedState===null&&n&&hg(i),ju(n);continue}else if(i!==null&&i.memoizedState!==null){n&&ex(e),ju(n);continue}}i=e.child,(e.subtreeFlags&t)!==0&&i!==null?(i.return=e,cn=i):(n&&Db(e),ju(n))}}ri=null}function ju(e){for(;cn!==null;){var t=cn,n=e,i=t.alternate,s=t.flags;switch(t.tag){case 0:case 11:case 15:break;case 1:if((s&1024)!==0&&i!==null){n=void 0,s=i.memoizedProps,i=i.memoizedState;var a=t.stateNode;try{var r=Sr(t.type,s);n=a.getSnapshotBeforeUpdate(r,i),a.__reactInternalSnapshotBeforeUpdate=n}catch(o){xe(t,t.return,o)}}break;case 3:if((s&1024)!==0){if(i=t.stateNode.containerInfo,n=i.nodeType,n===9)Rg(i);else if(n===1)switch(i.nodeName){case"HEAD":case"HTML":case"BODY":Rg(i);break;default:i.textContent=""}}break;case 5:case 26:case 27:case 6:case 4:case 17:break;case 30:n&&i!==null&&(n=zs(i.memoizedProps,i.stateNode),s=t.memoizedProps,s=Xs(s.default,s.update),s!=="none"&&zo(i,n,s,i.memoizedState=[],!0));break;default:if((s&1024)!==0)throw Error(tt(163))}if(i=t.sibling,i!==null){i.return=t.return,cn=i;break}cn=t.return}}function Ib(e,t,n){var i=n.flags;switch(n.tag){case 0:case 11:case 15:rs(e,n),i&4&&Cc(5,n);break;case 1:if(rs(e,n),i&4)if(e=n.stateNode,t===null)try{e.componentDidMount()}catch(r){xe(n,n.return,r)}else{var s=Sr(n.type,t.memoizedProps);t=t.memoizedState;try{e.componentDidUpdate(s,t,e.__reactInternalSnapshotBeforeUpdate)}catch(r){xe(n,n.return,r)}}i&64&&wb(n),i&512&&os(n,n.return);break;case 3:if(rs(e,n),i&64&&(e=n.updateQueue,e!==null)){if(t=null,n.child!==null)switch(n.child.tag){case 27:case 5:t=n.child.stateNode;break;case 1:t=n.child.stateNode}try{PS(e,t)}catch(r){xe(n,n.return,r)}}break;case 27:t===null&&i&4&&Rb(n);case 26:case 5:rs(e,n),t===null&&i&4&&og(n),i&512&&os(n,n.return);break;case 12:rs(e,n);break;case 31:rs(e,n),i&4&&zb(e,n);break;case 13:rs(e,n),i&4&&Fb(e,n),i&64&&(e=n.memoizedState,e!==null&&(e=e.dehydrated,e!==null&&(n=XA.bind(null,n),MC(e,n))));break;case 22:if(i=n.memoizedState!==null||ln,!i){var a=t!==null&&t.memoizedState!==null||pe;t=ln,s=pe,ln=i,(pe=a)&&!s?(i=2,(n.subtreeFlags&8772)!==0&&(i|=1),Fi(e,n,i)):rs(e,n),ln=t,pe=s}break;case 30:rs(e,n),i&512&&os(n,n.return);break;case 7:i&512&&os(n,n.return);default:rs(e,n)}}function pg(e,t){for(e=e.child;e!==null;)Ob(e,t),e=e.sibling}function Ob(e,t){switch(e.tag){case 5:case 26:try{var n=e.stateNode;if(t){var i=n.style;typeof i.setProperty=="function"?i.setProperty("display","none","important"):i.display="none"}else{var s=e.stateNode,a=e.memoizedProps.style,r=a!=null&&a.hasOwnProperty("display")?a.display:null;s.style.display=r==null||typeof r=="boolean"?"":(""+r).trim()}}catch(l){xe(e,e.return,l)}mg(e,t);break;case 6:try{e.stateNode.nodeValue=t?"":e.memoizedProps,ce=!0}catch(l){xe(e,e.return,l)}break;case 18:try{var o=e.stateNode;t?yx(o,!0):yx(e.stateNode,!1)}catch(l){xe(e,e.return,l)}break;case 22:case 23:e.memoizedState===null&&pg(e,t);break;default:pg(e,t)}}function mg(e,t){if(e.subtreeFlags&67108864)for(e=e.child;e!==null;){t:{var n=e,i=t;switch(n.tag){case 4:Ob(n,i);break t;case 22:n.memoizedState===null&&mg(n,i);break t;default:mg(n,i)}}e=e.sibling}}function Pb(e){var t=e.alternate;t!==null&&(e.alternate=null,Pb(t)),e.child=null,e.deletions=null,e.sibling=null,e.tag===5&&(t=e.stateNode,t!==null&&Jh(t)),e.stateNode=null,e.return=null,e.dependencies=null,e.memoizedProps=null,e.memoizedState=null,e.pendingProps=null,e.stateNode=null,e.updateQueue=null}var He=null,Yn=!1;function zi(e,t,n){for(n=n.child;n!==null;)Bb(e,t,n),n=n.sibling}function Bb(e,t,n){if(ci&&typeof ci.onCommitFiberUnmount=="function")try{ci.onCommitFiberUnmount(Sc,n)}catch{}switch(n.tag){case 26:pe||mn(n,t),zi(e,t,n),n.memoizedState?n.memoizedState.count--:n.stateNode&&!pe&&(n=n.stateNode,n.parentNode.removeChild(n));break;case 27:pe||mn(n,t),tc(n);var i=He,s=Yn;Ba(n.type)&&(He=n.stateNode,Yn=!1),zi(e,t,n),EM(n.stateNode,n.type,n.memoizedProps),He=i,Yn=s;break;case 5:pe||mn(n,t),tc(n);case 6:if(n.tag===6&&tc(n),i=He,s=Yn,He=null,zi(e,t,n),He=i,Yn=s,He!==null)if(Yn)try{(He.nodeType===9?He.body:He.nodeName==="HTML"?He.ownerDocument.body:He).removeChild(n.stateNode),ce=!0}catch(a){xe(n,t,a)}else try{He.removeChild(n.stateNode),ce=!0}catch(a){xe(n,t,a)}break;case 18:He!==null&&(Yn?(e=He,_x(e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,n.stateNode),Io(e)):_x(He,n.stateNode));break;case 4:i=He,s=Yn,He=n.stateNode.containerInfo,Yn=!0,zi(e,t,n),He=i,Yn=s;break;case 0:case 11:case 14:case 15:Ia(2,n,t),pe||Ia(4,n,t),zi(e,t,n);break;case 1:pe||(mn(n,t),i=n.stateNode,typeof i.componentWillUnmount=="function"&&Ab(n,t,i)),zi(e,t,n);break;case 21:zi(e,t,n);break;case 22:pe=(i=pe)||n.memoizedState!==null,zi(e,t,n),pe=i;break;case 30:mn(n,t),zi(e,t,n);break;case 7:pe||mn(n,t),zi(e,t,n);break;default:zi(e,t,n)}}function zb(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null))){e=e.dehydrated;try{Io(e)}catch(n){xe(t,t.return,n)}}}function Fb(e,t){if(t.memoizedState===null&&(e=t.alternate,e!==null&&(e=e.memoizedState,e!==null&&(e=e.dehydrated,e!==null))))try{Io(e)}catch(n){xe(t,t.return,n)}}function UA(e){switch(e.tag){case 31:case 13:case 19:var t=e.stateNode;return t===null&&(t=e.stateNode=new ix),t;case 22:return e=e.stateNode,t=e._retryCache,t===null&&(t=e._retryCache=new ix),t;default:throw Error(tt(435,e.tag))}}function Ku(e,t){var n=UA(e);t.forEach(function(i){if(!n.has(i)){n.add(i);var s=WA.bind(null,e,i);i.then(s,s)}})}function Bn(e,t,n){var i=t.deletions;if(i!==null)for(var s=0;s<i.length;s++){var a=i[s],r=e,o=t,l=o;t:for(;l!==null;){switch(l.tag){case 27:if(Ba(l.type)){He=l.stateNode,Yn=!1;break t}break;case 5:He=l.stateNode,Yn=!1;break t;case 3:case 4:He=l.stateNode.containerInfo,Yn=!0;break t}l=l.return}if(He===null)throw Error(tt(160));Bb(r,o,a),He=null,Yn=!1,r=a.alternate,r!==null&&(r.return=null),a.return=null}if(t.subtreeFlags&13886)for(t=t.child;t!==null;)Gb(t,e,n),t=t.sibling}var Gi=null;function Gb(e,t,n){var i=e.alternate,s=e.flags;switch(e.tag){case 0:case 11:case 14:case 15:if(s&4&&(i=e.updateQueue,i=i!==null?i.events:null,i!==null))for(var a=0;a<i.length;a++){var r=i[a];r.ref.impl=r.nextImpl}Bn(t,e,n),zn(e),s&4&&(Ia(3,e,e.return),Cc(3,e),Ia(5,e,e.return));break;case 1:Bn(t,e,n),zn(e),s&512&&(pe||i===null||mn(i,i.return)),s&64&&ln&&(e=e.updateQueue,e!==null&&(t=e.callbacks,t!==null&&(n=e.shared.hiddenCallbacks,e.shared.hiddenCallbacks=n===null?t:n.concat(t))));break;case 26:if(a=Gi,Bn(t,e,n),zn(e),s&512&&(pe||i===null||mn(i,i.return)),s&4)if(s=i!==null?i.memoizedState:null,n=e.memoizedState,i===null)if(n===null)if(e.stateNode===null)if(ln)e.stateNode=fM(e.type,e.memoizedProps,t.containerInfo,e);else{t:{t=e.type,n=e.memoizedProps,s=a.ownerDocument||a;e:switch(t){case"title":i=s.getElementsByTagName("title")[0],(!i||i[Ec]||i[gn]||i.namespaceURI==="http://www.w3.org/2000/svg"||i.hasAttribute("itemprop"))&&(i=s.createElement(t),s.head.insertBefore(i,s.querySelector("head > title"))),xn(i,t,n),i[gn]=e,un(i),t=i;break t;case"link":if(a=Ax("link","href",s).get(t+(n.href||""))){for(r=0;r<a.length;r++)if(i=a[r],i.getAttribute("href")===(n.href==null||n.href===""?null:n.href)&&i.getAttribute("rel")===(n.rel==null?null:n.rel)&&i.getAttribute("title")===(n.title==null?null:n.title)&&i.getAttribute("crossorigin")===(n.crossOrigin==null?null:n.crossOrigin)){a.splice(r,1);break e}}i=s.createElement(t),xn(i,t,n),s.head.appendChild(i);break;case"meta":if(a=Ax("meta","content",s).get(t+(n.content||""))){for(r=0;r<a.length;r++)if(i=a[r],i.getAttribute("content")===(n.content==null?null:""+n.content)&&i.getAttribute("name")===(n.name==null?null:n.name)&&i.getAttribute("property")===(n.property==null?null:n.property)&&i.getAttribute("http-equiv")===(n.httpEquiv==null?null:n.httpEquiv)&&i.getAttribute("charset")===(n.charSet==null?null:n.charSet)){a.splice(r,1);break e}}i=s.createElement(t),xn(i,t,n),s.head.appendChild(i);break;default:throw Error(tt(468,t))}i[gn]=e,un(i),t=i}e.stateNode=t}else ln||Lg(a,e.type,e.stateNode);else e.stateNode=wx(a,n,e.memoizedProps);else s!==n?(s===null?(t=i.stateNode,t===null||pe||t.parentNode.removeChild(t)):s.count--,n===null?ln||Lg(a,e.type,e.stateNode):wx(a,n,e.memoizedProps)):n===null&&e.stateNode!==null&&fm(e,e.memoizedProps,i.memoizedProps);break;case 27:Bn(t,e,n),zn(e),s&512&&(pe||i===null||mn(i,i.return)),i!==null&&s&4&&fm(e,e.memoizedProps,i.memoizedProps);break;case 5:if(a=ss,ss=!1,Bn(t,e,n),ss=a,zn(e),s&512&&(pe||i===null||mn(i,i.return)),e.flags&32){t=e.stateNode;try{Eo(t,""),ce=!0}catch(h){xe(e,e.return,h)}}s&4&&e.stateNode!=null&&(t=e.memoizedProps,fm(e,t,i!==null?i.memoizedProps:t)),s&1024&&(mm=!0);break;case 6:if(Bn(t,e,n),zn(e),s&4){if(e.stateNode===null)throw Error(tt(162));t=e.memoizedProps,n=e.stateNode;try{n.nodeValue=t,ce=!0}catch(h){xe(e,e.return,h)}}break;case 3:if(ce=!1,vh=null,a=Gi,Gi=gc(t.containerInfo),Bn(t,e,n),Gi=a,zn(e),s&4&&i!==null&&i.memoizedState.isDehydrated)try{Io(t.containerInfo)}catch(h){xe(e,e.return,h)}mm&&(mm=!1,Hb(e)),ce=!1;break;case 4:s=ss,ss=ln,i=cy(),a=Gi,Gi=gc(e.stateNode.containerInfo),Bn(t,e,n),zn(e),Gi=a,ce&&Xl&&(Hh=!0),ce=i,ss=s;break;case 12:Bn(t,e,n),zn(e);break;case 31:Bn(t,e,n),zn(e),s&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,Ku(e,t)));break;case 13:Bn(t,e,n),zn(e),e.child.flags&8192&&e.memoizedState!==null!=(i!==null&&i.memoizedState!==null)&&(ud=li()),s&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,Ku(e,t)));break;case 22:a=e.memoizedState!==null,r=i!==null&&i.memoizedState!==null;var o=ln,l=pe,c=ss;ln=o||a,ss=c||a,pe=l||r,Bn(t,e,n),pe=l,ss=c,ln=o,zn(e),s&8192&&(t=e.stateNode,t._visibility=a?t._visibility&-2:t._visibility|1,!a||i===null||r||ln||pe||(t=r||pe,n=ln,i=pe,ln=a||ln,pe=t,ha(e,2),ln=n,pe=i),!a&&ss||pg(e,a)),s&4&&(t=e.updateQueue,t!==null&&(n=t.retryQueue,n!==null&&(t.retryQueue=null,Ku(e,n))));break;case 19:Bn(t,e,n),zn(e),s&4&&(t=e.updateQueue,t!==null&&(e.updateQueue=null,Ku(e,t)));break;case 30:s&512&&(pe||i===null||mn(i,i.return)),s=cy(),a=Xl,r=(n&335544064)===n,o=e.memoizedProps,Xl=r&&Xs(o.default,o.update)!=="none",Bn(t,e,n),zn(e),r&&i!==null&&ce&&(e.flags|=4),Xl=a,ce=s;break;case 21:break;case 7:s&512&&(pe||i===null||mn(i,i.return)),i&&i.stateNode!==null&&(i.stateNode._fragmentFiber=e);default:Bn(t,e,n),zn(e)}}function zn(e){var t=e.flags;if(t&2){try{for(var n,i=e.return;i!==null;){if(Cb(i)){n=i;break}i=i.return}i=null;for(var s=e.return;s!==null;){if(_0(s)){var a=s.stateNode;i===null?i=[a]:i.push(a)}if(v0(s))break;s=s.return}var r=i;if(n==null)throw Error(tt(160));switch(n.tag){case 27:var o=n.stateNode,l=pm(e);Fh(e,l,o,r);break;case 5:var c=n.stateNode;n.flags&32&&(Eo(c,""),n.flags&=-33);var h=pm(e);Fh(e,h,c,r);break;case 3:case 4:var d=n.stateNode.containerInfo,u=pm(e);lg(e,u,d,r);break;default:throw Error(tt(161))}}catch(p){xe(e,e.return,p)}e.flags&=-3}t&4096&&(e.flags&=-4097)}function Hb(e){if(e.subtreeFlags&1024)for(e=e.child;e!==null;){var t=e;Hb(t),t.tag===5&&t.flags&1024&&(t=t.stateNode,Uo=!0,t.reset(),Uo=!1),e=e.sibling}}function jr(e,t){if(t.subtreeFlags&9270)for(t=t.child;t!==null;)Vb(t,e),t=t.sibling;else Ub(t,!1)}function Vb(e,t){var n=e.alternate;if(n===null)cg(e,!1);else switch(e.tag){case 3:if(fg=as=!1,nx(),jr(t,e),!as&&!Hh){if(e=ls,e!==null)for(var i=0;i<e.length;i+=3){n=e[i];var s=e[i+1];mM(n,e[i+2]),n=n.ownerDocument.documentElement,n!==null&&n.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group("+s+")"})}e=t.containerInfo,e=e.nodeType===9?e.documentElement:e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName===""&&(e.style.viewTransitionName="none",e.animate({opacity:[0,0],pointerEvents:["none","none"]},{duration:0,fill:"forwards",pseudoElement:"::view-transition-group(root)"}),e.animate({width:[0,0],height:[0,0]},{duration:0,fill:"forwards",pseudoElement:"::view-transition"})),fg=!0}ls=null;break;case 5:jr(t,e);break;case 4:i=as,as=!1,jr(t,e),as&&(Hh=!0),as=i;break;case 22:e.memoizedState===null&&(n.memoizedState!==null?cg(e,!1):jr(t,e));break;case 30:i=as,s=nx(),as=!1,jr(t,e),as&&(e.flags|=4);var a=e.memoizedProps,r=e.stateNode;t=zs(a,r),r=zs(n.memoizedProps,r);var o=Xs(a.default,a.update);o==="none"?t=!1:(a=n.memoizedState,n.memoizedState=null,n=e.child,jn=0,t=y0(e,n,t,r,o,a,!0),jn!==(a===null?0:a.length)&&(e.flags|=32)),(e.flags&4)!==0&&t?(Ao(e,e.memoizedProps.onUpdate),ls=s):s!==null&&(s.push.apply(s,ls),ls=s),as=(e.flags&32)!==0?!0:i;break;default:jr(t,e)}}function rs(e,t){if(t.subtreeFlags&8772)for(t=t.child;t!==null;)Ib(e,t.alternate,t),t=t.sibling}function ha(e,t){for(e=e.child;e!==null;){var n=e,i=t;switch(n.tag){case 0:case 11:case 14:case 15:Ia(4,n,n.return),ha(n,i);break;case 1:mn(n,n.return);var s=n.stateNode;typeof s.componentWillUnmount=="function"&&Ab(n,n.return,s),ha(n,i);break;case 27:(i&2)!==0&&EM(n.stateNode,n.type,n.memoizedProps);case 5:mn(n,n.return),n.tag!==5&&n.tag!==27||tc(n),ha(n,i);break;case 6:tc(n);break;case 26:mn(n,n.return),s=n.stateNode,n.memoizedState!==null||s===null||pe||s.parentNode.removeChild(s),ha(n,i);break;case 22:n.memoizedState===null&&ha(n,i);break;case 30:mn(n,n.return),ha(n,i);break;case 7:mn(n,n.return);default:ha(n,i)}e=e.sibling}}function Fi(e,t,n){for(n=(t.subtreeFlags&8772)!==0?n:n&-2,t=t.child;t!==null;){var i=t.alternate,s=e,a=t,r=a.flags,o=(n&1)!==0;switch(a.tag){case 0:case 11:case 15:Fi(s,a,n),Cc(4,a);break;case 1:if(Fi(s,a,n),i=a,s=i.stateNode,typeof s.componentDidMount=="function")try{s.componentDidMount()}catch(h){xe(i,i.return,h)}if(i=a,s=i.updateQueue,s!==null){var l=i.stateNode;try{var c=s.shared.hiddenCallbacks;if(c!==null)for(s.shared.hiddenCallbacks=null,s=0;s<c.length;s++)OS(c[s],l)}catch(h){xe(i,i.return,h)}}o&&r&64&&wb(a),os(a,a.return);break;case 27:(n&2)!==0&&Rb(a);case 5:a.tag!==5&&a.tag!==27||tx(a),Fi(s,a,n),o&&i===null&&r&4&&og(a),os(a,a.return);break;case 6:tx(a);break;case 26:l=a.stateNode,a.memoizedState!==null||l===null||ln||Lg(gc(l.ownerDocument),a.type,l),Fi(s,a,n),o&&i===null&&r&4&&og(a),os(a,a.return);break;case 12:Fi(s,a,n);break;case 31:Fi(s,a,n),o&&r&4&&zb(s,a);break;case 13:Fi(s,a,n),o&&r&4&&Fb(s,a);break;case 22:a.memoizedState===null&&Fi(s,a,n),os(a,a.return);break;case 30:Fi(s,a,n),os(a,a.return);break;case 7:os(a,a.return);default:Fi(s,a,n)}t=t.sibling}}function x0(e,t){var n=null;e!==null&&e.memoizedState!==null&&e.memoizedState.cachePool!==null&&(n=e.memoizedState.cachePool.pool),e=null,t.memoizedState!==null&&t.memoizedState.cachePool!==null&&(e=t.memoizedState.cachePool.pool),e!==n&&(e!=null&&e.refCount++,n!=null&&wc(n))}function S0(e,t){e=null,t.alternate!==null&&(e=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==e&&(t.refCount++,e!=null&&wc(e))}function wi(e,t,n,i){var s=(n&335544064)===n;if(t.subtreeFlags&(s?10262:10256))for(t=t.child;t!==null;)kb(e,t,n,i),t=t.sibling;else s&&Lb(t)}function kb(e,t,n,i){var s=(n&335544064)===n;s&&t.alternate===null&&t.return!==null&&t.return.alternate!==null&&fh(t);var a=t.flags;switch(t.tag){case 0:case 11:case 15:wi(e,t,n,i),a&2048&&Cc(9,t);break;case 1:wi(e,t,n,i);break;case 3:wi(e,t,n,i),s&&fg&&(e=e.containerInfo,e=e.nodeType===9?e.body:e.nodeName==="HTML"?e.ownerDocument.body:e,e.style.viewTransitionName==="root"&&(e.style.viewTransitionName=""),e=e.ownerDocument.documentElement,e!==null&&e.style.viewTransitionName==="none"&&(e.style.viewTransitionName="")),a&2048&&(a=null,t.alternate!==null&&(a=t.alternate.memoizedState.cache),t=t.memoizedState.cache,t!==a&&(t.refCount++,a!=null&&wc(a)));break;case 12:if(a&2048){wi(e,t,n,i),a=t.stateNode;try{var r=t.memoizedProps,o=r.id,l=r.onPostCommit;typeof l=="function"&&l(o,t.alternate===null?"mount":"update",a.passiveEffectDuration,-0)}catch(c){xe(t,t.return,c)}}else wi(e,t,n,i);break;case 31:wi(e,t,n,i);break;case 13:wi(e,t,n,i);break;case 23:break;case 22:r=t.stateNode,o=t.alternate,t.memoizedState!==null?(s&&o!==null&&o.memoizedState===null&&fh(o),r._visibility&2?wi(e,t,n,i):ec(e,t)):(s&&o!==null&&o.memoizedState!==null&&fh(t),r._visibility&2?wi(e,t,n,i):(r._visibility|=2,Jr(e,t,n,i,(t.subtreeFlags&10256)!==0||!1))),a&2048&&x0(o,t);break;case 24:wi(e,t,n,i),a&2048&&S0(t.alternate,t);break;case 30:s&&(a=t.alternate,a!==null&&(ms(a.child,!0),ms(t.child,!0))),wi(e,t,n,i);break;default:wi(e,t,n,i)}}function Jr(e,t,n,i,s){for(s=s&&((t.subtreeFlags&10256)!==0||!1),t=t.child;t!==null;){var a=e,r=t,o=n,l=i,c=r.flags;switch(r.tag){case 0:case 11:case 15:Jr(a,r,o,l,s),Cc(8,r);break;case 23:break;case 22:var h=r.stateNode;r.memoizedState!==null?h._visibility&2?Jr(a,r,o,l,s):ec(a,r):(h._visibility|=2,Jr(a,r,o,l,s)),s&&c&2048&&x0(r.alternate,r);break;case 24:Jr(a,r,o,l,s),s&&c&2048&&S0(r.alternate,r);break;default:Jr(a,r,o,l,s)}t=t.sibling}}function ec(e,t){if(t.subtreeFlags&10256)for(t=t.child;t!==null;){var n=e,i=t,s=i.flags;switch(i.tag){case 22:ec(n,i),s&2048&&x0(i.alternate,i);break;case 24:ec(n,i),s&2048&&S0(i.alternate,i);break;default:ec(n,i)}t=t.sibling}}var or=8192;function sr(e,t,n){if(e.subtreeFlags&or)for(e=e.child;e!==null;)Xb(e,t,n),e=e.sibling}function Xb(e,t,n){switch(e.tag){case 26:sr(e,t,n),e.flags&or&&(e.memoizedState!==null?BC(n,Gi,e.memoizedState,e.memoizedProps):(e=e.stateNode,(t&335544128)===t&&Rx(n,e)));break;case 5:sr(e,t,n),e.flags&or&&(e=e.stateNode,(t&335544128)===t&&Rx(n,e));break;case 3:case 4:var i=Gi;Gi=gc(e.stateNode.containerInfo),sr(e,t,n),Gi=i;break;case 22:e.memoizedState===null&&(i=e.alternate,i!==null&&i.memoizedState!==null?(i=or,or=16777216,sr(e,t,n),or=i):sr(e,t,n));break;case 30:if((e.flags&or)!==0&&(i=e.memoizedProps.name,i!=null&&i!=="auto")){var s=e.stateNode;s.paired=null,ri===null&&(ri=new Map),ri.set(i,s)}sr(e,t,n);break;default:sr(e,t,n)}}function Wb(e){var t=e.alternate;if(t!==null&&(e=t.child,e!==null)){t.child=null;do t=e.sibling,e.sibling=null,e=t;while(e!==null)}}function Bl(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var i=t[n];cn=i,Yb(i,e)}Wb(e)}if(e.subtreeFlags&10256)for(e=e.child;e!==null;)qb(e),e=e.sibling}function qb(e){switch(e.tag){case 0:case 11:case 15:Bl(e),e.flags&2048&&Ia(9,e,e.return);break;case 3:Bl(e);break;case 12:Bl(e);break;case 22:var t=e.stateNode;e.memoizedState!==null&&t._visibility&2&&(e.return===null||e.return.tag!==13)?(t._visibility&=-3,ph(e)):Bl(e);break;default:Bl(e)}}function ph(e){var t=e.deletions;if((e.flags&16)!==0){if(t!==null)for(var n=0;n<t.length;n++){var i=t[n];cn=i,Yb(i,e)}Wb(e)}for(e=e.child;e!==null;){switch(t=e,t.tag){case 0:case 11:case 15:Ia(8,t,t.return),ph(t);break;case 22:n=t.stateNode,n._visibility&2&&(n._visibility&=-3,ph(t));break;default:ph(t)}e=e.sibling}}function Yb(e,t){for(;cn!==null;){var n=cn;switch(n.tag){case 0:case 11:case 15:Ia(8,n,t);break;case 23:case 22:if(n.memoizedState!==null&&n.memoizedState.cachePool!==null){var i=n.memoizedState.cachePool.pool;i!=null&&i.refCount++}break;case 24:wc(n.memoizedState.cache)}if(i=n.child,i!==null)i.return=n,cn=i;else t:for(n=e;cn!==null;){i=cn;var s=i.sibling,a=i.return;if(Pb(i),i===n){cn=null;break t}if(s!==null){s.return=a,cn=s;break t}cn=a}}}var IA={getCacheForType:function(e){var t=vn(Qe),n=t.data.get(e);return n===void 0&&(n=e(),t.data.set(e,n)),n},cacheSignal:function(){return vn(Qe).controller.signal}},OA=typeof WeakMap=="function"?WeakMap:Map,ue=0,we=null,te=null,ne=0,_e=0,ii=null,_a=!1,Fo=!1,b0=!1,Vs=0,qe=0,Oa=0,pr=0,Vh=0,oi=0,wo=0,nc=null,Zn=null,gg=!1,ud=0,Zb=0,kh=1/0,Xh=null,Aa=null,ke=0,Vi=null,br=null,ps=0,vg=0,_g=null,jb=null,yo=null,xo=null,So=null,ic=0,mh=null;function hi(){return(ue&2)!==0&&ne!==0?ne&-ne:zt.T!==null?E0():$x()}function Kb(){if(oi===0)if((ne&536870912)===0||Zt){var e=Bu;Bu<<=1,(Bu&3932160)===0&&(Bu=262144),oi=e}else oi=536870912;return e=Sn.current,e!==null&&(e.flags|=32),oi}function Ao(e,t){if(t!=null){var n=e.stateNode,i=n.ref;i===null&&(i=n.ref=vM(zs(e.memoizedProps,n))),xo===null&&(xo=[]),xo.push(t.bind(null,i))}}function Jn(e,t,n){(e===we&&(_e===2||_e===9)||e.cancelPendingCommit!==null)&&(Co(e,0),ya(e,ne,oi,!1)),Mc(e,n),((ue&2)===0||e!==we)&&(e===we&&((ue&2)===0&&(pr|=n),qe===4&&ya(e,ne,oi,!1)),vs(e))}function Jb(e,t,n){if((ue&6)!==0)throw Error(tt(327));var i=!n&&(t&127)===0&&(t&e.expiredLanes)===0||bc(e,t),s=i?zA(e,t):gm(e,t,!0),a=i;do{if(s===0){Fo&&!i&&ya(e,t,0,!1);break}else{if(n=e.current.alternate,a&&!PA(n)){s=gm(e,t,!1),a=!1;continue}if(s===2){if(a=t,e.errorRecoveryDisabledLanes&a)var r=0;else r=e.pendingLanes&-536870913,r=r!==0?r:r&536870912?536870912:0;if(r!==0){t=r;t:{var o=e;s=nc;var l=o.current.memoizedState.isDehydrated;if(l&&(Co(o,r).flags|=256),r=gm(o,r,!1),r!==2&&r!==6){if(b0&&!l){o.errorRecoveryDisabledLanes|=a,pr|=a,s=4;break t}a=Zn,Zn=s,a!==null&&(Zn===null?Zn=a:Zn.push.apply(Zn,a))}s=r}if(a=!1,s!==2)continue}}if(s===1){Co(e,0),ya(e,t,0,!0);break}t:{switch(i=e,a=s,a){case 0:case 1:throw Error(tt(345));case 4:if((t&4194048)!==t&&(t&62914560)!==t)break;case 6:ya(i,t,oi,!_a);break t;case 2:Zn=null;break;case 3:case 5:break;default:throw Error(tt(329))}if((t&62914560)===t&&(s=ud+300-li(),10<s)){if(ya(i,t,oi,!_a),Kh(i,0,!0)!==0)break t;ps=t,i.timeoutHandle=w0(sx.bind(null,i,n,Zn,Xh,gg,t,oi,pr,wo,_a,a,"Throttled",-0,0),s);break t}sx(i,n,Zn,Xh,gg,t,oi,pr,wo,_a,a,null,-0,0)}}break}while(!0);vs(e)}function sx(e,t,n,i,s,a,r,o,l,c,h,d,u,p){e.timeoutHandle=-1;var m=t.subtreeFlags,S=(a&335544064)===a;if(d=null,(S||m&8192||(m&16785408)===16785408)&&(d={stylesheets:null,count:0,imgCount:0,imgBytes:0,suspenseyImages:[],waitingForImages:!0,waitingForViewTransition:!1,unsuspend:us},ri=null,Xb(t,a,d),S&&(m=d,S=e.containerInfo,S=(S.nodeType===9?S:S.ownerDocument).__reactViewTransition,S!=null&&(m.count++,m.waitingForViewTransition=!0,m=vc.bind(m),S.finished.then(m,m))),m=(a&62914560)===a?ud-li():(a&4194048)===a?Zb-li():0,m=zC(d,m),m!==null)){ps=a,e.cancelPendingCommit=m(rx.bind(null,e,t,a,n,i,s,r,o,l,c,h,d,null,u,p)),ya(e,a,r,!c);return}rx(e,t,a,n,i,s,r,o,l,c,h,d)}function PA(e){for(var t=e;;){var n=t.tag;if((n===0||n===11||n===15)&&t.flags&16384&&(n=t.updateQueue,n!==null&&(n=n.stores,n!==null)))for(var i=0;i<n.length;i++){var s=n[i],a=s.getSnapshot;s=s.value;try{if(!di(a(),s))return!1}catch{return!1}}if(n=t.child,t.subtreeFlags&16384&&n!==null)n.return=t,t=n;else{if(t===e)break;for(;t.sibling===null;){if(t.return===null||t.return===e)return!0;t=t.return}t.sibling.return=t.return,t=t.sibling}}return!0}function ya(e,t,n,i){t=Zx(e,t),t&=~Vh,t&=~pr,e.suspendedLanes|=t,e.pingedLanes&=~t,i&&(e.warmLanes|=t),i=e.expirationTimes;for(var s=t;0<s;){var a=31-ui(s),r=1<<a;i[a]=-1,s&=~r}n!==0&&Kx(e,n,t)}function hd(){return(ue&6)===0?(Rc(0,!1),!1):!0}function M0(){if(te!==null){if(_e===0)var e=te.return;else e=te,Is=Ar=null,r0(e),go=null,uc=0,e=te;for(;e!==null;)Tb(e.alternate,e),e=e.return;te=null}}function Co(e,t){var n=e.timeoutHandle;return n!==-1&&(e.timeoutHandle=-1,sC(n)),n=e.cancelPendingCommit,n!==null&&(e.cancelPendingCommit=null,n()),ps=0,M0(),we=e,te=n=Os(e.current,null),ne=t,_e=0,ii=null,_a=!1,Fo=bc(e,t),b0=!1,wo=oi=Vh=pr=Oa=qe=0,Zn=nc=null,gg=!1,Vs=Zx(e,t),ed(),n}function Qb(e,t){Xt=null,zt.H=Ph,t===Bo||t===sd?(t=Dy(),_e=3):t===Qg?(t=Dy(),_e=4):_e=t===p0?8:t!==null&&typeof t=="object"&&typeof t.then=="function"?6:1,ii=t,te===null&&(qe=1,Bh(e,Di(t,e.current)))}function $b(){var e=Sn.current;return e===null?!0:(ne&4194048)===ne?Rn===null:(ne&62914560)===ne||(ne&536870912)!==0?e===Rn:!1}function tM(){var e=zt.H;return zt.H=Ph,e===null?Ph:e}function eM(){var e=zt.A;return zt.A=IA,e}function Wh(){qe=4,_a||(ne&4194048)!==ne&&Sn.current!==null||(Fo=!0),(Oa&134217727)===0&&(pr&134217727)===0||we===null||ya(we,ne,oi,!1)}function gm(e,t,n){var i=ue;ue|=2;var s=tM(),a=eM();(we!==e||ne!==t)&&(Xh=null,Co(e,t)),t=!1;var r=qe;t:do try{if(_e!==0&&te!==null){var o=te,l=ii;switch(_e){case 8:M0(),r=6;break t;case 3:case 2:case 9:case 6:Sn.current===null&&(t=!0);var c=_e;if(_e=0,ii=null,uo(e,o,l,c),n&&Fo){r=0;break t}break;default:c=_e,_e=0,ii=null,uo(e,o,l,c)}}BA(),r=qe;break}catch(h){Qb(e,h)}while(!0);return t&&e.shellSuspendCounter++,Is=Ar=null,ue=i,zt.H=s,zt.A=a,te===null&&(we=null,ne=0,ed()),r}function BA(){for(;te!==null;)nM(te)}function zA(e,t){var n=ue;ue|=2;var i=tM(),s=eM();we!==e||ne!==t?(Xh=null,kh=li()+500,Co(e,t)):Fo=bc(e,t);t:do try{if(_e!==0&&te!==null){t=te;var a=ii;e:switch(_e){case 1:_e=0,ii=null,uo(e,t,a,1);break;case 2:case 9:if(Ny(a)){_e=0,ii=null,ax(t);break}t=function(){_e!==2&&_e!==9||we!==e||(_e=7),vs(e)},a.then(t,t);break t;case 3:_e=7;break t;case 4:_e=5;break t;case 7:Ny(a)?(_e=0,ii=null,ax(t)):(_e=0,ii=null,uo(e,t,a,7));break;case 5:var r=null;switch(te.tag){case 26:r=te.memoizedState;case 5:case 27:var o=te;if(r?AM(r):o.stateNode.complete){_e=0,ii=null;var l=o.sibling;if(l!==null)te=l;else{var c=o.return;c!==null?(te=c,dd(c)):te=null}break e}}_e=0,ii=null,uo(e,t,a,5);break;case 6:_e=0,ii=null,uo(e,t,a,6);break;case 8:M0(),qe=6;break t;default:throw Error(tt(462))}}FA();break}catch(h){Qb(e,h)}while(!0);return Is=Ar=null,zt.H=i,zt.A=s,ue=n,te!==null?0:(we=null,ne=0,ed(),qe)}function FA(){for(;te!==null&&!nw();)nM(te)}function nM(e){var t=Eb(e.alternate,e,Vs);e.memoizedProps=e.pendingProps,t===null?dd(e):te=t}function ax(e){var t=e,n=t.alternate;switch(t.tag){case 15:case 0:t=Yy(n,t,t.pendingProps,t.type,void 0,ne);break;case 11:t=Yy(n,t,t.pendingProps,t.type.render,t.ref,ne);break;case 5:r0(t);var i=t;i===hn&&(Zt?(Rh(i),i.tag===5&&i.stateNode!=null&&(Le=i.stateNode)):(Rh(i),Zt=!0));default:Tb(n,t),t=te=wS(t,Vs),t=Eb(n,t,Vs)}e.memoizedProps=e.pendingProps,t===null?dd(e):te=t}function uo(e,t,n,i){Is=Ar=null,r0(t),go=null,uc=0;var s=t.return;try{if(wA(e,s,t,n,ne)){qe=1,Bh(e,Di(n,e.current)),te=null;return}}catch(a){if(s!==null)throw te=s,a;qe=1,Bh(e,Di(n,e.current)),te=null;return}t.flags&32768?(Zt||i===1?e=!0:Fo||(ne&536870912)!==0?e=!1:(_a=e=!0,(i===2||i===9||i===3||i===6)&&(i=Sn.current,i!==null&&i.tag===13&&(i.flags|=16384))),iM(t,e)):dd(t)}function dd(e){var t=e;do{if((t.flags&32768)!==0){iM(t,_a);return}e=t.return;var n=NA(t.alternate,t,Vs);if(n!==null){te=n;return}if(t=t.sibling,t!==null){te=t;return}te=t=e}while(t!==null);qe===0&&(qe=5)}function iM(e,t){do{var n=DA(e.alternate,e);if(n!==null){n.flags&=32767,te=n;return}if(n=e.return,n!==null&&(n.flags|=32768,n.subtreeFlags=0,n.deletions=null),!t&&(e=e.sibling,e!==null)){te=e;return}te=e=n}while(e!==null);qe=6,te=null}function rx(e,t,n,i,s,a,r,o,l,c,h,d){e.cancelPendingCommit=null;do fd();while(ke!==0);if((ue&6)!==0)throw Error(tt(327));if(t!==null){if(t===e.current)throw Error(tt(177));e===we&&(te=we=null,ne=0),br=t,Vi=e,ps=n,_g=s,jb=i,GA(e,t,n,r,o,l,d)}}function GA(e,t,n,i,s,a,r){var o=t.lanes|t.childLanes;if(vg=o,o|=qg,dw(e,n,o,i,s,a),xo=null,(n&335544064)===n?(So=pA(e),i=10262):(So=null,i=10256),(t.subtreeFlags&i)!==0||(t.flags&i)!==0?(e.callbackNode=null,e.callbackPriority=0,qA(Eh,function(){return bg(),null})):(e.callbackNode=null,e.callbackPriority=0),Gh=!1,i=(t.flags&13878)!==0,(t.subtreeFlags&13878)!==0||i){i=zt.T,zt.T=null,s=he.p,he.p=2,a=ue,ue|=4;try{LA(e,t,n)}finally{ue=a,he.p=s,zt.T=i}}ke=1,Gh?yo=uC(r,e.containerInfo,So,yg,xg,VA,Sg,bg,HA,null,null):(yg(),xg(),Sg())}function HA(e){if(ke!==0){var t=Vi.onRecoverableError;t(e,{componentStack:null})}}function VA(){ke===3&&(ke=0,Vb(br,Vi),ke=4)}function yg(){if(ke===1){ke=0;var e=Vi,t=br,n=ps,i=(t.flags&13878)!==0;if((t.subtreeFlags&13878)!==0||i){i=zt.T,zt.T=null;var s=he.p;he.p=2;var a=ue;ue|=4;try{Xl=Hh=!1,Gb(t,e,n),n=wg;var r=_S(e.containerInfo),o=n.focusedElem,l=n.selectionRange;if(r!==o&&o&&o.ownerDocument&&vS(o.ownerDocument.documentElement,o)){if(l!==null&&Wg(o)){var c=l.start,h=l.end;if(h===void 0&&(h=c),"selectionStart"in o)o.selectionStart=c,o.selectionEnd=Math.min(h,o.value.length);else{var d=o.ownerDocument||document,u=d&&d.defaultView||window;if(u.getSelection){var p=u.getSelection(),m=o.textContent.length,S=Math.min(l.start,m),g=l.end===void 0?S:Math.min(l.end,m);!p.extend&&S>g&&(r=g,g=S,S=r);var f=by(o,S),v=by(o,g);if(f&&v&&(p.rangeCount!==1||p.anchorNode!==f.node||p.anchorOffset!==f.offset||p.focusNode!==v.node||p.focusOffset!==v.offset)){var b=d.createRange();b.setStart(f.node,f.offset),p.removeAllRanges(),S>g?(p.addRange(b),p.extend(v.node,v.offset)):(b.setEnd(v.node,v.offset),p.addRange(b))}}}}for(d=[],p=o;p=p.parentNode;)p.nodeType===1&&d.push({element:p,left:p.scrollLeft,top:p.scrollTop});for(typeof o.focus=="function"&&o.focus(),o=0;o<d.length;o++){var y=d[o];y.element.scrollLeft=y.left,y.element.scrollTop=y.top}}Uo=!!Tg,wg=Tg=null}finally{ue=a,he.p=s,zt.T=i}}e.current=t,ke=2}}function xg(){if(ke===2){ke=0;var e=Vi,t=br,n=(t.flags&8772)!==0;if((t.subtreeFlags&8772)!==0||n){n=zt.T,zt.T=null;var i=he.p;he.p=2;var s=ue;ue|=4;try{Ib(e,t.alternate,t)}finally{ue=s,he.p=i,zt.T=n}}ke=3}}function Sg(){if(ke===4||ke===3){ke=0;var e=yo;yo=null,iw();var t=Vi,n=br,i=ps,s=jb,a=(i&335544064)===i?10262:10256;if((n.subtreeFlags&a)!==0||(n.flags&a)!==0?ke=5:(ke=0,br=Vi=null,sM(t,t.pendingLanes)),a=t.pendingLanes,a===0&&(Aa=null),Fg(i),n=n.stateNode,ci&&typeof ci.onCommitFiberRoot=="function")try{ci.onCommitFiberRoot(Sc,n,void 0,(n.current.flags&128)===128)}catch{}if(s!==null){n=zt.T,a=he.p,he.p=2,zt.T=null;try{for(var r=t.onRecoverableError,o=0;o<s.length;o++){var l=s[o];r(l.value,{componentStack:l.stack})}}finally{zt.T=n,he.p=a}}if(s=xo,r=So,So=null,s!==null&&(xo=null,r===null&&(r=[]),e!==null))for(l=0;l<s.length;l++)n=(0,s[l])(r),n!==void 0&&e.finished.finally(n);(ps&3)!==0&&fd(),vs(t),a=t.pendingLanes,(i&261930)!==0&&(a&42)!==0?t===mh?ic++:(ic=0,mh=t):(ic=0,mh=null),Rc(0,!1)}}function sM(e,t){(e.pooledCacheLanes&=t)===0&&(t=e.pooledCache,t!=null&&(e.pooledCache=null,wc(t)))}function fd(){return yo!==null&&(yo.skipTransition(),yo=null),yg(),xg(),Sg(),bg()}function bg(){if(ke!==5)return!1;var e=Vi,t=vg;vg=0;var n=Fg(ps),i=zt.T,s=he.p;try{he.p=32>n?32:n,zt.T=null,n=_g,_g=null;var a=Vi,r=ps;if(ke=0,br=Vi=null,ps=0,(ue&6)!==0)throw Error(tt(331));var o=ue;if(ue|=4,qb(a.current),kb(a,a.current,r,n),ue=o,Rc(0,!1),ci&&typeof ci.onPostCommitFiberRoot=="function")try{ci.onPostCommitFiberRoot(Sc,a)}catch{}return!0}finally{he.p=s,zt.T=i,sM(e,t)}}function ox(e,t,n){t=Di(n,t),t=eg(e.stateNode,t,2),e=Ea(e,t,2),e!==null&&(Mc(e,2),vs(e))}function xe(e,t,n){if(e.tag===3)ox(e,e,n);else for(;t!==null;){if(t.tag===3){ox(t,e,n);break}else if(t.tag===1){var i=t.stateNode;if(typeof t.type.getDerivedStateFromError=="function"||typeof i.componentDidCatch=="function"&&(Aa===null||!Aa.has(i))){e=Di(n,e),n=yb(2),i=Ea(t,n,2),i!==null&&(xb(n,i,t,e),Mc(i,2),vs(i));break}}t=t.return}}function vm(e,t,n){var i=e.pingCache;if(i===null){i=e.pingCache=new OA;var s=new Set;i.set(t,s)}else s=i.get(t),s===void 0&&(s=new Set,i.set(t,s));s.has(n)||(b0=!0,s.add(n),e=kA.bind(null,e,t,n),t.then(e,e))}function kA(e,t,n){var i=e.pingCache;i!==null&&i.delete(t),e.pingedLanes|=e.suspendedLanes&n,e.warmLanes&=~n,we===e&&(ne&n)===n&&((qe===4||qe===3&&(ne&62914560)===ne&&300>li()-ud)&&(ue&2)===0?Co(e,0):Vh|=n,wo===ne&&(wo=0)),vs(e)}function aM(e,t){t===0&&(t=jx()),e=wr(e,t),e!==null&&(Mc(e,t),vs(e))}function XA(e){var t=e.memoizedState,n=0;t!==null&&(n=t.retryLane),aM(e,n)}function WA(e,t){var n=0;switch(e.tag){case 31:case 13:var i=e.stateNode,s=e.memoizedState;s!==null&&(n=s.retryLane);break;case 19:i=e.stateNode;break;case 22:i=e.stateNode._retryCache;break;default:throw Error(tt(314))}i!==null&&i.delete(t),aM(e,n)}function qA(e,t){return Bg(e,t)}var Ro=null,Qr=null,Mg=!1,qh=!1,_m=!1,xa=0;function vs(e){e!==Qr&&e.next===null&&(Qr===null?Ro=Qr=e:Qr=Qr.next=e),qh=!0,Mg||(Mg=!0,ZA())}function Rc(e,t){if(!_m&&qh){_m=!0;do for(var n=!1,i=Ro;i!==null;){if(!t)if(e!==0){var s=i.pendingLanes;if(s===0)var a=0;else{var r=i.suspendedLanes,o=i.pingedLanes;a=(1<<31-ui(42|e)+1)-1,a&=s&~(r&~o),a=a&201326741?a&201326741|1:a?a|2:0}a!==0&&(n=!0,lx(i,a))}else a=ne,a=Kh(i,i===we?a:0,i.cancelPendingCommit!==null||i.timeoutHandle!==-1),(a&3)===0||bc(i,a)||(n=!0,lx(i,a));i=i.next}while(n);_m=!1}}function YA(){rM()}function rM(){qh=Mg=!1;var e=0;xa!==0&&iC()&&(e=xa);for(var t=li(),n=null,i=Ro;i!==null;){var s=i.next,a=oM(i,t);a===0?(i.next=null,n===null?Ro=s:n.next=s,s===null&&(Qr=n)):(n=i,(e!==0||(a&3)!==0)&&(qh=!0)),i=s}ke!==0&&ke!==5||Rc(e,!1),xa!==0&&(xa=0)}function oM(e,t){for(var n=e.suspendedLanes,i=e.pingedLanes,s=e.expirationTimes,a=e.pendingLanes&-62914561;0<a;){var r=31-ui(a),o=1<<r,l=s[r];l===-1?((o&n)===0||(o&i)!==0)&&(s[r]=hw(o,t)):l<=t&&(e.expiredLanes|=o),a&=~o}if(t=we,n=ne,n=Kh(e,e===t?n:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i=e.callbackNode,n===0||e===t&&(_e===2||_e===9)||e.cancelPendingCommit!==null)return i!==null&&i!==null&&Kp(i),e.callbackNode=null,e.callbackPriority=0;if((n&3)===0||bc(e,n)){if(t=n&-n,t===e.callbackPriority)return t;switch(i!==null&&Kp(i),Fg(n)){case 2:case 8:n=qx;break;case 32:n=Eh;break;case 268435456:n=Yx;break;default:n=Eh}return i=lM.bind(null,e),n=Bg(n,i),e.callbackPriority=t,e.callbackNode=n,t}return i!==null&&i!==null&&Kp(i),e.callbackPriority=2,e.callbackNode=null,2}function lM(e,t){if(ke!==0&&ke!==5)return e.callbackNode=null,e.callbackPriority=0,null;var n=e.callbackNode;if(fd()&&e.callbackNode!==n)return null;var i=ne;return i=Kh(e,e===we?i:0,e.cancelPendingCommit!==null||e.timeoutHandle!==-1),i===0?null:(Jb(e,i,t),oM(e,li()),e.callbackNode!=null&&e.callbackNode===n?lM.bind(null,e):null)}function lx(e,t){if(fd())return null;Jb(e,t,!0)}function ZA(){aC(function(){(ue&6)!==0?Bg(Wx,YA):rM()})}function E0(){if(xa===0){var e=_r;e===0&&(e=Pu,Pu<<=1,(Pu&261888)===0&&(Pu=256)),xa=e}return xa}function cx(e){return e==null||typeof e=="symbol"||typeof e=="boolean"?null:typeof e=="function"?e:ih(e)}function jA(e,t,n,i,s){if(t==="submit"&&n&&n.stateNode===s){var a=cx((s[$n]||null).action),r=i.submitter;r&&(t=(t=r[$n]||null)?cx(t.formAction):r.getAttribute("formAction"),t!==null&&(a=t,r=null));var o=new Qh("action","action",null,i,s);e.push({event:o,listeners:[{instance:null,listener:function(){if(i.defaultPrevented){if(xa!==0){var l=new FormData(s,r);$m(n,{pending:!0,data:l,method:s.method,action:a},null,l)}}else typeof a=="function"&&(o.preventDefault(),l=new FormData(s,r),$m(n,{pending:!0,data:l,method:s.method,action:a},a,l))},currentTarget:s}]})}}for(Ju=0;Ju<Vm.length;Ju++)Qu=Vm[Ju],ux=Qu.toLowerCase(),hx=Qu[0].toUpperCase()+Qu.slice(1),ki(ux,"on"+hx);var Qu,ux,hx,Ju;ki(xS,"onAnimationEnd");ki(SS,"onAnimationIteration");ki(bS,"onAnimationStart");ki("dblclick","onDoubleClick");ki("focusin","onFocus");ki("focusout","onBlur");ki(rA,"onTransitionRun");ki(oA,"onTransitionStart");ki(lA,"onTransitionCancel");ki(MS,"onTransitionEnd");Mo("onMouseEnter",["mouseout","mouseover"]);Mo("onMouseLeave",["mouseout","mouseover"]);Mo("onPointerEnter",["pointerout","pointerover"]);Mo("onPointerLeave",["pointerout","pointerover"]);Er("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));Er("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));Er("onBeforeInput",["compositionend","keypress","textInput","paste"]);Er("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));Er("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));Er("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var fc="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),KA=new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(fc));function cM(e,t){t=(t&4)!==0;for(var n=0;n<e.length;n++){var i=e[n],s=i.event;i=i.listeners;t:{var a=void 0;if(t)for(var r=i.length-1;0<=r;r--){var o=i[r],l=o.instance,c=o.currentTarget;if(o=o.listener,l!==a&&s.isPropagationStopped())break t;a=o,s.currentTarget=c;try{a(s)}catch(h){wh(h)}s.currentTarget=null,a=l}else for(r=0;r<i.length;r++){if(o=i[r],l=o.instance,c=o.currentTarget,o=o.listener,l!==a&&s.isPropagationStopped())break t;a=o,s.currentTarget=c;try{a(s)}catch(h){wh(h)}s.currentTarget=null,a=l}}}}function $t(e,t){var n=t[ay];n===void 0&&(n=t[ay]=new Set);var i=e+"__bubble";n.has(i)||(uM(t,e,2,!1),n.add(i))}function ym(e,t,n){var i=0;t&&(i|=4),uM(n,e,i,t)}var $u="_reactListening"+Math.random().toString(36).slice(2);function T0(e){if(!e[$u]){e[$u]=!0,eS.forEach(function(n){n!=="selectionchange"&&(KA.has(n)||ym(n,!1,e),ym(n,!0,e))});var t=e.nodeType===9?e:e.ownerDocument;t===null||t[$u]||(t[$u]=!0,ym("selectionchange",!1,t))}}function uM(e,t,n,i){switch(IM(t)){case 2:var s=VC;break;case 8:s=kC;break;default:s=L0}n=s.bind(null,t,n,e),s=void 0,!zm||t!=="touchstart"&&t!=="touchmove"&&t!=="wheel"||(s=!0),i?s!==void 0?e.addEventListener(t,n,{capture:!0,passive:s}):e.addEventListener(t,n,!0):s!==void 0?e.addEventListener(t,n,{passive:s}):e.addEventListener(t,n,!1)}function xm(e,t,n,i,s){var a=i;if((t&1)===0&&(t&2)===0&&i!==null)t:for(;;){if(i===null)return;var r=i.tag;if(r===3||r===4){var o=i.stateNode.containerInfo;if(o===s)break;if(r===4)for(r=i.return;r!==null;){var l=r.tag;if((l===3||l===4)&&r.stateNode.containerInfo===s)return;r=r.return}for(;o!==null;){if(r=lr(o),r===null)return;if(l=r.tag,l===5||l===6||l===26||l===27){i=a=r;continue t}o=o.parentNode}}i=i.return}cS(function(){var c=a,h=Hg(n),d=[];t:{var u=ES.get(e);if(u!==void 0){var p=Qh,m=e;switch(e){case"keypress":if(ah(n)===0)break t;case"keydown":case"keyup":p=Pw;break;case"focusin":m="focus",p=nm;break;case"focusout":m="blur",p=nm;break;case"beforeblur":case"afterblur":p=nm;break;case"click":if(n.button===2)break t;case"auxclick":case"dblclick":case"mousedown":case"mousemove":case"mouseup":case"mouseout":case"mouseover":case"contextmenu":p=fy;break;case"drag":case"dragend":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"dragstart":case"drop":p=Ew;break;case"touchcancel":case"touchend":case"touchmove":case"touchstart":p=Hw;break;case xS:case SS:case bS:p=Aw;break;case MS:p=kw;break;case"scroll":case"scrollend":p=bw;break;case"wheel":p=Ww;break;case"copy":case"cut":case"paste":p=Rw;break;case"gotpointercapture":case"lostpointercapture":case"pointercancel":case"pointerdown":case"pointermove":case"pointerout":case"pointerover":case"pointerup":p=my;break;case"submit":p=Fw;break;case"toggle":case"beforetoggle":p=Yw}var S=(t&4)!==0,g=!S&&(e==="scroll"||e==="scrollend"),f=S?u!==null?u+"Capture":null:u;S=[];for(var v=c,b;v!==null;){var y=v;if(b=y.stateNode,y=y.tag,y!==5&&y!==26&&y!==27||b===null||f===null||(y=ac(v,f),y!=null&&S.push(pc(v,y,b))),g)break;v=v.return}0<S.length&&(u=new p(u,m,null,n,h),d.push({event:u,listeners:S}))}}if((t&7)===0){t:{if(p=e==="mouseover"||e==="pointerover",u=e==="mouseout"||e==="pointerout",p&&n!==Bm&&(m=n.relatedTarget||n.fromElement)&&(lr(m)||m[Oo]))break t;(u||p)&&(m=h.window===h?h:(p=h.ownerDocument)?p.defaultView||p.parentWindow:window,u?(p=n.relatedTarget||n.toElement,u=c,p=p?lr(p):null,p!==null&&(g=xc(p),S=p.tag,p!==g||S!==5&&S!==27&&S!==6)&&(p=null)):(u=null,p=c),u!==p&&(S=fy,y="onMouseLeave",f="onMouseEnter",v="mouse",(e==="pointerout"||e==="pointerover")&&(S=my,y="onPointerLeave",f="onPointerEnter",v="pointer"),g=u==null?m:Vl(u),b=p==null?m:Vl(p),m=new S(y,v+"leave",u,n,h),m.target=g,m.relatedTarget=b,y=null,lr(h)===c&&(S=new S(f,v+"enter",p,n,h),S.target=b,S.relatedTarget=g,y=S),g=y,S=u&&p?Tm(u,p,JA):null,u!==null&&dx(d,m,u,S,!1),p!==null&&g!==null&&dx(d,g,p,S,!0)))}t:{if(u=c?Vl(c):window,p=u.nodeName&&u.nodeName.toLowerCase(),p==="select"||p==="input"&&u.type==="file")var T=yy;else if(_y(u))if(mS)T=iA;else{T=eA;var E=tA}else p=u.nodeName,!p||p.toLowerCase()!=="input"||u.type!=="checkbox"&&u.type!=="radio"?c&&Gg(c.elementType)&&(T=yy):T=nA;if(T&&(T=T(e,c))){pS(d,T,n,h);break t}E&&E(e,u,c)}switch(E=c?Vl(c):window,e){case"focusin":(_y(E)||E.contentEditable==="true")&&(so=E,Gm=c,Yl=null);break;case"focusout":Yl=Gm=so=null;break;case"mousedown":Hm=!0;break;case"contextmenu":case"mouseup":case"dragend":Hm=!1,My(d,n,h);break;case"selectionchange":if(aA)break;case"keydown":case"keyup":My(d,n,h)}var w;if(Xg)t:{switch(e){case"compositionstart":var _="onCompositionStart";break t;case"compositionend":_="onCompositionEnd";break t;case"compositionupdate":_="onCompositionUpdate";break t}_=void 0}else io?dS(e,n)&&(_="onCompositionEnd"):e==="keydown"&&n.keyCode===229&&(_="onCompositionStart");_&&(hS&&n.locale!=="ko"&&(io||_!=="onCompositionStart"?_==="onCompositionEnd"&&io&&(w=uS()):(ga=h,Vg="value"in ga?ga.value:ga.textContent,io=!0)),E=Yh(c,_),0<E.length&&(_=new py(_,e,null,n,h),d.push({event:_,listeners:E}),w?_.data=w:(w=fS(n),w!==null&&(_.data=w)))),(w=jw?Kw(e,n):Jw(e,n))&&(_=Yh(c,"onBeforeInput"),0<_.length&&(E=new py("onBeforeInput","beforeinput",null,n,h),d.push({event:E,listeners:_}),E.data=w)),jA(d,e,c,n,h)}cM(d,t)})}function pc(e,t,n){return{instance:e,listener:t,currentTarget:n}}function Yh(e,t){for(var n=t+"Capture",i=[];e!==null;){var s=e,a=s.stateNode;if(s=s.tag,s!==5&&s!==26&&s!==27||a===null||(s=ac(e,n),s!=null&&i.unshift(pc(e,s,a)),s=ac(e,t),s!=null&&i.push(pc(e,s,a))),e.tag===3)return i;e=e.return}return[]}function JA(e){if(e===null)return null;do e=e.return;while(e&&e.tag!==5&&e.tag!==27);return e||null}function dx(e,t,n,i,s){for(var a=t._reactName,r=[];n!==null&&n!==i;){var o=n,l=o.alternate,c=o.stateNode;if(o=o.tag,l!==null&&l===i)break;o!==5&&o!==26&&o!==27||c===null||(l=c,s?(c=ac(n,a),c!=null&&r.unshift(pc(n,c,l))):s||(c=ac(n,a),c!=null&&r.push(pc(n,c,l)))),n=n.return}r.length!==0&&e.push({event:t,listeners:r})}var QA=/\r\n?/g,$A=/\u0000|\uFFFD/g;function fx(e){return(typeof e=="string"?e:""+e).replace(QA,`
`).replace($A,"")}function hM(e,t){return t=fx(t),fx(e)===t}function ye(e,t,n,i,s,a){switch(n){case"children":if(typeof i=="string")t==="body"||t==="textarea"&&i===""||Eo(e,i);else if(typeof i=="number"||typeof i=="bigint")t!=="body"&&Eo(e,""+i);else return;break;case"className":Fu(e,"class",i);break;case"tabIndex":Fu(e,"tabindex",i);break;case"dir":case"role":case"viewBox":case"width":case"height":Fu(e,n,i);break;case"style":lS(e,i,a);return;case"data":if(t!=="object"){Fu(e,"data",i);break}case"src":case"href":if(i===""&&(t!=="a"||n!=="href")){e.removeAttribute(n);break}if(i==null||typeof i=="function"||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(n);break}i=ih(i),e.setAttribute(n,i);break;case"action":case"formAction":if(typeof i=="function"){e.setAttribute(n,"javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");break}else typeof a=="function"&&(n==="formAction"?(t!=="input"&&ye(e,t,"name",s.name,s,null),ye(e,t,"formEncType",s.formEncType,s,null),ye(e,t,"formMethod",s.formMethod,s,null),ye(e,t,"formTarget",s.formTarget,s,null)):(ye(e,t,"encType",s.encType,s,null),ye(e,t,"method",s.method,s,null),ye(e,t,"target",s.target,s,null)));if(i==null||typeof i=="symbol"||typeof i=="boolean"){e.removeAttribute(n);break}i=ih(i),e.setAttribute(n,i);break;case"onClick":i!=null&&(e.onclick=us);return;case"onScroll":i!=null&&$t("scroll",e);return;case"onScrollEnd":i!=null&&$t("scrollend",e);return;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(tt(61));if(n=i.__html,n!=null){if(s.children!=null)throw Error(tt(60));a?.__html!==n&&(e.innerHTML=n)}}break;case"multiple":e.multiple=i&&typeof i!="function"&&typeof i!="symbol";break;case"muted":e.muted=i&&typeof i!="function"&&typeof i!="symbol";break;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"defaultValue":case"defaultChecked":case"innerHTML":case"ref":break;case"autoFocus":break;case"xlinkHref":if(i==null||typeof i=="function"||typeof i=="boolean"||typeof i=="symbol"){e.removeAttribute("xlink:href");break}n=ih(i),e.setAttributeNS("http://www.w3.org/1999/xlink","xlink:href",n);break;case"contentEditable":case"spellCheck":case"draggable":case"value":case"autoReverse":case"externalResourcesRequired":case"focusable":case"preserveAlpha":i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,i):e.removeAttribute(n);break;case"inert":case"allowFullScreen":case"async":case"autoPlay":case"controls":case"credentialless":case"default":case"defer":case"disabled":case"disablePictureInPicture":case"disableRemotePlayback":case"formNoValidate":case"hidden":case"loop":case"noModule":case"noValidate":case"open":case"playsInline":case"readOnly":case"required":case"reversed":case"scoped":case"seamless":case"itemScope":i&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,""):e.removeAttribute(n);break;case"capture":case"download":i===!0?e.setAttribute(n,""):i!==!1&&i!=null&&typeof i!="function"&&typeof i!="symbol"?e.setAttribute(n,i):e.removeAttribute(n);break;case"cols":case"rows":case"size":case"span":i!=null&&typeof i!="function"&&typeof i!="symbol"&&!isNaN(i)&&1<=i?e.setAttribute(n,i):e.removeAttribute(n);break;case"rowSpan":case"start":i==null||typeof i=="function"||typeof i=="symbol"||isNaN(i)?e.removeAttribute(n):e.setAttribute(n,i);break;case"popover":$t("beforetoggle",e),$t("toggle",e),nh(e,"popover",i);break;case"xlinkActuate":Ds(e,"http://www.w3.org/1999/xlink","xlink:actuate",i);break;case"xlinkArcrole":Ds(e,"http://www.w3.org/1999/xlink","xlink:arcrole",i);break;case"xlinkRole":Ds(e,"http://www.w3.org/1999/xlink","xlink:role",i);break;case"xlinkShow":Ds(e,"http://www.w3.org/1999/xlink","xlink:show",i);break;case"xlinkTitle":Ds(e,"http://www.w3.org/1999/xlink","xlink:title",i);break;case"xlinkType":Ds(e,"http://www.w3.org/1999/xlink","xlink:type",i);break;case"xmlBase":Ds(e,"http://www.w3.org/XML/1998/namespace","xml:base",i);break;case"xmlLang":Ds(e,"http://www.w3.org/XML/1998/namespace","xml:lang",i);break;case"xmlSpace":Ds(e,"http://www.w3.org/XML/1998/namespace","xml:space",i);break;case"is":nh(e,"is",i);break;case"innerText":case"textContent":return;default:if(!(2<n.length)||n[0]!=="o"&&n[0]!=="O"||n[1]!=="n"&&n[1]!=="N")n=xw.get(n)||n,nh(e,n,i);else return}ce=!0}function Eg(e,t,n,i,s,a){switch(n){case"style":lS(e,i,a);return;case"dangerouslySetInnerHTML":if(i!=null){if(typeof i!="object"||!("__html"in i))throw Error(tt(61));if(n=i.__html,n!=null){if(s.children!=null)throw Error(tt(60));a?.__html!==n&&(e.innerHTML=n)}}break;case"children":if(typeof i=="string")Eo(e,i);else if(typeof i=="number"||typeof i=="bigint")Eo(e,""+i);else return;break;case"onScroll":i!=null&&$t("scroll",e);return;case"onScrollEnd":i!=null&&$t("scrollend",e);return;case"onClick":i!=null&&(e.onclick=us);return;case"suppressContentEditableWarning":case"suppressHydrationWarning":case"innerHTML":case"ref":return;case"innerText":case"textContent":return;default:if(!nS.hasOwnProperty(n))t:{if(n[0]==="o"&&n[1]==="n"&&(s=n.endsWith("Capture"),a=n.slice(2,s?n.length-7:void 0),t=e[$n]||null,t=t!=null?t[n]:null,typeof t=="function"&&e.removeEventListener(a,t,s),typeof i=="function")){typeof t!="function"&&t!==null&&(n in e?e[n]=null:e.hasAttribute(n)&&e.removeAttribute(n)),e.addEventListener(a,i,s);break t}ce=!0,n in e?e[n]=i:i===!0?e.setAttribute(n,""):nh(e,n,i)}return}ce=!0}function xn(e,t,n){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"img":$t("error",e),$t("load",e);var i=!1,s=!1,a;for(a in n)if(n.hasOwnProperty(a)){var r=n[a];if(r!=null)switch(a){case"src":i=!0;break;case"srcSet":s=!0;break;case"children":case"dangerouslySetInnerHTML":throw Error(tt(137,t));default:ye(e,t,a,r,n,null)}}s&&ye(e,t,"srcSet",n.srcSet,n,null),i&&ye(e,t,"src",n.src,n,null);return;case"input":$t("invalid",e);var o=a=r=s=null,l=null,c=null;for(i in n)if(n.hasOwnProperty(i)){var h=n[i];if(h!=null)switch(i){case"name":s=h;break;case"type":r=h;break;case"checked":l=h;break;case"defaultChecked":c=h;break;case"value":a=h;break;case"defaultValue":o=h;break;case"children":case"dangerouslySetInnerHTML":if(h!=null)throw Error(tt(137,t));break;default:ye(e,t,i,h,n,null)}}aS(e,a,o,l,c,r,s,!1);return;case"select":$t("invalid",e),i=r=a=null;for(s in n)if(n.hasOwnProperty(s)&&(o=n[s],o!=null))switch(s){case"value":a=o;break;case"defaultValue":r=o;break;case"multiple":i=o;default:ye(e,t,s,o,n,null)}t=a,n=r,e.multiple=!!i,t!=null?fo(e,!!i,t,!1):n!=null&&fo(e,!!i,n,!0);return;case"textarea":$t("invalid",e),a=s=i=null;for(r in n)if(n.hasOwnProperty(r)&&(o=n[r],o!=null))switch(r){case"value":i=o;break;case"defaultValue":s=o;break;case"children":a=o;break;case"dangerouslySetInnerHTML":if(o!=null)throw Error(tt(91));break;default:ye(e,t,r,o,n,null)}oS(e,i,s,a);return;case"option":for(l in n)if(n.hasOwnProperty(l)&&(i=n[l],i!=null))switch(l){case"selected":e.selected=i&&typeof i!="function"&&typeof i!="symbol";break;default:ye(e,t,l,i,n,null)}return;case"dialog":$t("beforetoggle",e),$t("toggle",e),$t("cancel",e),$t("close",e);break;case"iframe":case"object":$t("load",e);break;case"video":case"audio":for(i=0;i<fc.length;i++)$t(fc[i],e);break;case"image":$t("error",e),$t("load",e);break;case"details":$t("toggle",e);break;case"embed":case"source":case"link":$t("error",e),$t("load",e);case"area":case"base":case"br":case"col":case"hr":case"keygen":case"meta":case"param":case"track":case"wbr":case"menuitem":for(c in n)if(n.hasOwnProperty(c)&&(i=n[c],i!=null))switch(c){case"children":case"dangerouslySetInnerHTML":throw Error(tt(137,t));default:ye(e,t,c,i,n,null)}return;default:if(Gg(t)){for(h in n)n.hasOwnProperty(h)&&(i=n[h],i!==void 0&&Eg(e,t,h,i,n,void 0));return}}for(o in n)n.hasOwnProperty(o)&&(i=n[o],i!=null&&ye(e,t,o,i,n,null))}var tC={};function eC(e,t,n,i){switch(t){case"div":case"span":case"svg":case"path":case"a":case"g":case"p":case"li":break;case"input":var s=null,a=null,r=null,o=null,l=null,c=null,h=null;for(p in n){var d=n[p];if(n.hasOwnProperty(p)&&d!=null)switch(p){case"checked":break;case"value":break;case"defaultValue":l=d;default:i.hasOwnProperty(p)||ye(e,t,p,null,i,d)}}for(var u in i){var p=i[u];if(d=n[u],i.hasOwnProperty(u)&&(p!=null||d!=null))switch(u){case"type":p!==d&&(ce=!0),a=p;break;case"name":p!==d&&(ce=!0),s=p;break;case"checked":p!==d&&(ce=!0),c=p;break;case"defaultChecked":p!==d&&(ce=!0),h=p;break;case"value":p!==d&&(ce=!0),r=p;break;case"defaultValue":p!==d&&(ce=!0),o=p;break;case"children":case"dangerouslySetInnerHTML":if(p!=null)throw Error(tt(137,t));break;default:p!==d&&ye(e,t,u,p,i,d)}}Pm(e,r,o,l,c,h,a,s);return;case"select":p=r=o=u=null;for(a in n)if(l=n[a],n.hasOwnProperty(a)&&l!=null)switch(a){case"value":break;case"multiple":p=l;default:i.hasOwnProperty(a)||ye(e,t,a,null,i,l)}for(s in i)if(a=i[s],l=n[s],i.hasOwnProperty(s)&&(a!=null||l!=null))switch(s){case"value":a!==l&&(ce=!0),u=a;break;case"defaultValue":a!==l&&(ce=!0),o=a;break;case"multiple":a!==l&&(ce=!0),r=a;default:a!==l&&ye(e,t,s,a,i,l)}t=o,n=r,i=p,u!=null?fo(e,!!n,u,!1):!!i!=!!n&&(t!=null?fo(e,!!n,t,!0):fo(e,!!n,n?[]:"",!1));return;case"textarea":p=u=null;for(o in n)if(s=n[o],n.hasOwnProperty(o)&&s!=null&&!i.hasOwnProperty(o))switch(o){case"value":break;case"children":break;default:ye(e,t,o,null,i,s)}for(r in i)if(s=i[r],a=n[r],i.hasOwnProperty(r)&&(s!=null||a!=null))switch(r){case"value":s!==a&&(ce=!0),u=s;break;case"defaultValue":s!==a&&(ce=!0),p=s;break;case"children":break;case"dangerouslySetInnerHTML":if(s!=null)throw Error(tt(91));break;default:s!==a&&ye(e,t,r,s,i,a)}rS(e,u,p);return;case"option":for(var m in n)if(u=n[m],n.hasOwnProperty(m)&&u!=null&&!i.hasOwnProperty(m))switch(m){case"selected":e.selected=!1;break;default:ye(e,t,m,null,i,u)}for(l in i)if(u=i[l],p=n[l],i.hasOwnProperty(l)&&u!==p&&(u!=null||p!=null))switch(l){case"selected":u!==p&&(ce=!0),e.selected=u&&typeof u!="function"&&typeof u!="symbol";break;default:ye(e,t,l,u,i,p)}return;case"img":case"link":case"area":case"base":case"br":case"col":case"embed":case"hr":case"keygen":case"meta":case"param":case"source":case"track":case"wbr":case"menuitem":for(var S in n)u=n[S],n.hasOwnProperty(S)&&u!=null&&!i.hasOwnProperty(S)&&ye(e,t,S,null,i,u);for(c in i)if(u=i[c],p=n[c],i.hasOwnProperty(c)&&u!==p&&(u!=null||p!=null))switch(c){case"children":case"dangerouslySetInnerHTML":if(u!=null)throw Error(tt(137,t));break;default:ye(e,t,c,u,i,p)}return;default:if(Gg(t)){for(var g in n)u=n[g],n.hasOwnProperty(g)&&u!==void 0&&!i.hasOwnProperty(g)&&Eg(e,t,g,void 0,i,u);for(h in i)u=i[h],p=n[h],!i.hasOwnProperty(h)||u===p||u===void 0&&p===void 0||Eg(e,t,h,u,i,p);return}}for(var f in n)u=n[f],n.hasOwnProperty(f)&&u!=null&&!i.hasOwnProperty(f)&&ye(e,t,f,null,i,u);for(d in i)u=i[d],p=n[d],!i.hasOwnProperty(d)||u===p||u==null&&p==null||ye(e,t,d,u,i,p)}function px(e){switch(e){case"css":case"script":case"font":case"img":case"image":case"input":case"link":return!0;default:return!1}}function nC(){if(typeof performance.getEntriesByType=="function"){for(var e=0,t=0,n=performance.getEntriesByType("resource"),i=0;i<n.length;i++){var s=n[i],a=s.transferSize,r=s.initiatorType,o=s.duration;if(a&&o&&px(r)){for(r=0,o=s.responseEnd,i+=1;i<n.length;i++){var l=n[i],c=l.startTime;if(c>o)break;var h=l.transferSize,d=l.initiatorType;h&&px(d)&&(l=l.responseEnd,r+=h*(l<o?1:(o-c)/(l-c)))}if(--i,t+=8*(a+r)/(s.duration/1e3),e++,10<e)break}}if(0<e)return t/e/1e6}return navigator.connection&&(e=navigator.connection.downlink,typeof e=="number")?e:5}var Tg=null,wg=null;function mc(e){return e.nodeType===9?e:e.ownerDocument}function mx(e){switch(e){case"http://www.w3.org/2000/svg":return 1;case"http://www.w3.org/1998/Math/MathML":return 2;default:return 0}}function dM(e,t){if(e===0)switch(t){case"svg":return 1;case"math":return 2;default:return 0}return e===1&&t==="foreignObject"?0:e}function fM(e,t,n,i){return n=mc(n).createElement(e),n[gn]=i,n[$n]=t,xn(n,e,t),un(n),n}function Ag(e,t){return e==="textarea"||e==="noscript"||typeof t.children=="string"||typeof t.children=="number"||typeof t.children=="bigint"||typeof t.dangerouslySetInnerHTML=="object"&&t.dangerouslySetInnerHTML!==null&&t.dangerouslySetInnerHTML.__html!=null}var Sm=null;function iC(){var e=window.event;return e&&e.type==="popstate"?e===Sm?!1:(Sm=e,!0):(Sm=null,!1)}var w0=typeof setTimeout=="function"?setTimeout:void 0,sC=typeof clearTimeout=="function"?clearTimeout:void 0,gx=typeof Promise=="function"?Promise:void 0,vx=typeof requestAnimationFrame=="function"?requestAnimationFrame:w0,aC=typeof queueMicrotask=="function"?queueMicrotask:typeof gx<"u"?function(e){return gx.resolve(null).then(e).catch(rC)}:w0;function rC(e){setTimeout(function(){throw e})}function Ba(e){return e==="head"}function _x(e,t){var n=t,i=0;do{var s=n.nextSibling;if(e.removeChild(n),s&&s.nodeType===8)if(n=s.data,n==="/$"||n==="/&"){if(i===0){e.removeChild(s),Io(t);return}i--}else if(n==="$"||n==="$?"||n==="$~"||n==="$!"||n==="&")i++;else if(n==="html")Mm(e.ownerDocument.documentElement);else if(n==="head"){n=e.ownerDocument.head,Mm(n);for(var a=n.firstChild;a;){var r=a.nextSibling,o=a.nodeName;a[Ec]||o==="SCRIPT"||o==="STYLE"||o==="LINK"&&a.rel.toLowerCase()==="stylesheet"||n.removeChild(a),a=r}}else n==="body"&&Mm(e.ownerDocument.body);n=s}while(n);Io(t)}function yx(e,t){var n=e;e=0;do{var i=n.nextSibling;if(n.nodeType===1?t?(n._stashedDisplay=n.style.display,n.style.display="none"):(n.style.display=n._stashedDisplay||"",n.getAttribute("style")===""&&n.removeAttribute("style")):n.nodeType===3&&(t?(n._stashedText=n.nodeValue,n.nodeValue=""):n.nodeValue=n._stashedText||""),i&&i.nodeType===8)if(n=i.data,n==="/$"){if(e===0)break;e--}else n!=="$"&&n!=="$?"&&n!=="$~"&&n!=="$!"||e++;n=i}while(n)}function pM(e,t,n){if(t=CSS.escape(t)!==t?"r-"+btoa(t).replace(/=/g,""):t,e.style.viewTransitionName=t,n!=null&&(e.style.viewTransitionClass=n),n=getComputedStyle(e),n.display==="inline"){if(t=e.getClientRects(),t.length===1)var i=1;else for(var s=i=0;s<t.length;s++){var a=t[s];0<a.width&&0<a.height&&i++}i===1&&(e=e.style,e.display=t.length===1?"inline-block":"block",e.marginTop="-"+n.paddingTop,e.marginBottom="-"+n.paddingBottom)}}function mM(e,t){e=e.style,t=t.style;var n=t!=null?t.hasOwnProperty("viewTransitionName")?t.viewTransitionName:t.hasOwnProperty("view-transition-name")?t["view-transition-name"]:null:null;e.viewTransitionName=n==null||typeof n=="boolean"?"":(""+n).trim(),n=t!=null?t.hasOwnProperty("viewTransitionClass")?t.viewTransitionClass:t.hasOwnProperty("view-transition-class")?t["view-transition-class"]:null:null,e.viewTransitionClass=n==null||typeof n=="boolean"?"":(""+n).trim(),e.display==="inline-block"&&(t==null?e.display=e.margin="":(n=t.display,e.display=n==null||typeof n=="boolean"?"":n,n=t.margin,n!=null?e.margin=n:(n=t.hasOwnProperty("marginTop")?t.marginTop:t["margin-top"],e.marginTop=n==null||typeof n=="boolean"?"":n,t=t.hasOwnProperty("marginBottom")?t.marginBottom:t["margin-bottom"],e.marginBottom=t==null||typeof t=="boolean"?"":t)))}function gM(e,t,n){return n=n.ownerDocument.defaultView,{rect:e,abs:t.position==="absolute"||t.position==="fixed",clip:t.clipPath!=="none"||t.overflow!=="visible"||t.filter!=="none"||t.mask!=="none"||t.mask!=="none"||t.borderRadius!=="0px",view:0<=e.bottom&&0<=e.right&&e.top<=n.innerHeight&&e.left<=n.innerWidth}}function Cg(e){var t=e.getBoundingClientRect(),n=getComputedStyle(e);return gM(t,n,e)}function oC(e){var t=e.getBoundingClientRect();t=new DOMRect(t.x+2e4,t.y+2e4,t.width,t.height);var n=getComputedStyle(e);return gM(t,n,e)}function lC(e){return e.documentElement.clientHeight}function cC(e){this.addEventListener("load",e),this.addEventListener("error",e)}function uC(e,t,n,i,s,a,r,o,l){var c=t.nodeType===9?t:t.ownerDocument;try{var h=c.startViewTransition({update:function(){var u=c.defaultView,p=u.navigation&&u.navigation.transition,m=c.fonts.status;i();var S=[];if(m==="loaded"&&(lC(c),c.fonts.status==="loading"&&S.push(c.fonts.ready)),m=S.length,e!==null)for(var g=e.suspenseyImages,f=0,v=0;v<g.length;v++){var b=g[v];if(!b.complete){var y=b.getBoundingClientRect();if(0<y.bottom&&0<y.right&&y.top<u.innerHeight&&y.left<u.innerWidth){if(f+=CM(b),f>_h){S.length=m;break}b=new Promise(cC.bind(b)),S.push(b)}}}if(0<S.length)return u=Promise.race([Promise.all(S),new Promise(function(T){return setTimeout(T,500)})]).then(s,s),(p?Promise.allSettled([p.finished,u]):u).then(a,a);if(s(),p)return p.finished.then(a,a);a()},types:n});c.__reactViewTransition=h;var d=[];return h.ready.then(function(){for(var u=c.documentElement.getAnimations({subtree:!0}),p=0;p<u.length;p++){var m=u[p],S=m.effect,g=S.pseudoElement;if(g!=null&&g.startsWith("::view-transition")){d.push(m),m=S.getKeyframes();for(var f=g=void 0,v=!0,b=0;b<m.length;b++){var y=m[b],T=y.width;if(g===void 0)g=T;else if(g!==T){v=!1;break}if(T=y.height,f===void 0)f=T;else if(f!==T){v=!1;break}delete y.width,delete y.height,y.transform==="none"&&delete y.transform}v&&g!==void 0&&f!==void 0&&(S.setKeyframes(m),v=getComputedStyle(S.target,S.pseudoElement),v.width!==g||v.height!==f)&&(v=m[0],v.width=g,v.height=f,v=m[m.length-1],v.width=g,v.height=f,S.setKeyframes(m))}}r()},function(u){c.__reactViewTransition===h&&(c.__reactViewTransition=null);try{if(typeof u=="object"&&u!==null)switch(u.name){case"InvalidStateError":(u.message==="View transition was skipped because document visibility state is hidden."||u.message==="Skipping view transition because document visibility state has become hidden."||u.message==="Skipping view transition because viewport size changed."||u.message==="Transition was aborted because of invalid state")&&(u=null)}u!==null&&l(u)}finally{i(),s(),r()}}),h.finished.finally(function(){for(var u=0;u<d.length;u++)d[u].cancel();c.__reactViewTransition===h&&(c.__reactViewTransition=null),o()}),h}catch{return i(),s(),r(),null}}function cr(e,t){this._scope=document.documentElement,this._selector="::view-transition-"+e+"("+t+")"}cr.prototype.animate=function(e,t){return t=typeof t=="number"?{duration:t}:Ae({},t),t.pseudoElement=this._selector,this._scope.animate(e,t)};cr.prototype.getAnimations=function(){for(var e=this._scope,t=this._selector,n=e.getAnimations({subtree:!0}),i=[],s=0;s<n.length;s++){var a=n[s].effect;a!==null&&a.target===e&&a.pseudoElement===t&&i.push(n[s])}return i};cr.prototype.getComputedStyle=function(){return getComputedStyle(this._scope,this._selector)};function vM(e){return{name:e,group:new cr("group",e),imagePair:new cr("image-pair",e),old:new cr("old",e),new:new cr("new",e)}}function fi(e){this._fragmentFiber=e,this._observers=this._eventListeners=null}fi.prototype.addEventListener=function(e,t,n){var i=null,s=null;if(!(n!=null&&typeof n!="boolean"&&(i=n.signal||null,i!==null&&i.aborted))){this._eventListeners===null&&(this._eventListeners=[]);var a=this._eventListeners;if(_M(a,e,t,n)===-1){var r=this,o=t;n!=null&&typeof n!="boolean"&&n.once===!0&&(o=function(l){r.removeEventListener(e,t,n),typeof t=="function"?t.call(this,l):t.handleEvent(l)}),i!==null&&(s=r.removeEventListener.bind(r,e,t,n),i.addEventListener("abort",s,{once:!0}),s=i.removeEventListener.bind(i,"abort",s)),i=No(n),a.push({type:e,listener:t,optionsOrUseCapture:n,attachedListener:o,cleanup:s}),Qn(this._fragmentFiber.child,!1,hC,e,o,i)}this._eventListeners=a}};function hC(e,t,n,i){return nn(e).addEventListener(t,n,i),!1}fi.prototype.removeEventListener=function(e,t,n){var i=this._eventListeners;if(i!==null&&(t=_M(i,e,t,n),t!==-1)){var s=i[t];n=s.attachedListener;var a=s.cleanup;s=No(s.optionsOrUseCapture),Qn(this._fragmentFiber.child,!1,dC,e,n,s),i.splice(t,1),a!==null&&a()}};function dC(e,t,n,i){return nn(e).removeEventListener(t,n,i),!1}function No(e){return e!=null&&typeof e!="boolean"&&(e.once===!0||e.signal instanceof AbortSignal)?{capture:e.capture,passive:e.passive}:e}function xx(e){return e==null?"c=0":typeof e=="boolean"?"c="+(e?"1":"0"):"c="+(e.capture?"1":"0")}function _M(e,t,n,i){if(e.length===0)return-1;i=xx(i);for(var s=0;s<e.length;s++){var a=e[s];if(a.type===t&&a.listener===n&&xx(a.optionsOrUseCapture)===i)return s}return-1}fi.prototype.dispatchEvent=function(e){var t=Mr(this._fragmentFiber);if(t===null)return!0;t=nn(t);var n=this._eventListeners;if(n!==null&&0<n.length||!e.bubbles){var i=t.nodeType===9?t.createComment(""):document.createTextNode("");if(n)for(var s=0;s<n.length;s++){var a=n[s];i.addEventListener(a.type,a.attachedListener,No(a.optionsOrUseCapture))}if(t.appendChild(i),e=i.dispatchEvent(e),n)for(s=0;s<n.length;s++)a=n[s],i.removeEventListener(a.type,a.attachedListener,No(a.optionsOrUseCapture));return t.removeChild(i),e}return t.dispatchEvent(e)};fi.prototype.focus=function(e){Qn(this._fragmentFiber.child,!0,yM,e,void 0,void 0)};function yM(e,t){return e.tag===6?!1:(e=nn(e),EC(e,t))}fi.prototype.focusLast=function(e){var t=[];Qn(this._fragmentFiber.child,!0,A0,t,void 0,void 0);for(var n=t.length-1;0<=n&&!yM(t[n],e);n--);};function A0(e,t){return t.push(e),!1}fi.prototype.blur=function(){var e=Mr(this._fragmentFiber);e!==null&&(e=nn(e),e=mc(e).activeElement,e!==null&&Qn(this._fragmentFiber.child,!1,fC,e,void 0,void 0))};function fC(e,t){return e.tag===6?!1:(e=nn(e),e===t||e.contains(t)?(t.blur(),!0):!1)}fi.prototype.observeUsing=function(e){this._observers===null&&(this._observers=new Set),this._observers.add(e),Qn(this._fragmentFiber.child,!1,pC,e,void 0,void 0)};function pC(e,t){return e.tag===6||(e=nn(e),t.observe(e)),!1}fi.prototype.unobserveUsing=function(e){var t=this._observers;if(t!==null&&t.has(e)){t.delete(e),Qn(this._fragmentFiber.child,!1,mC,e,void 0,void 0);for(var n=t=0;n<Hi.length;n++){var i=Hi[n];i.fragmentInstance===this&&i.observer===e?e.unobserve(i.instance):Hi[t++]=i}Hi.length=t}};function mC(e,t){return e.tag===6||(e=nn(e),t.unobserve(e)),!1}var Hi=[],bm=!1;function gC(e,t,n){Hi.push({fragmentInstance:e,observer:t,instance:n}),bm||(bm=!0,TC(function(){bm=!1;var i=Hi;Hi=[];for(var s=0;s<i.length;s++){var a=i[s];a.observer.unobserve(a.instance)}}))}fi.prototype.getClientRects=function(){var e=[];return Qn(this._fragmentFiber.child,!1,vC,e,void 0,void 0),e};function vC(e,t){if(e.tag===6){e=e.stateNode;var n=e.ownerDocument.createRange();n.selectNodeContents(e),t.push.apply(t,n.getClientRects())}else e=nn(e),t.push.apply(t,e.getClientRects());return!1}fi.prototype.getRootNode=function(e){var t=Mr(this._fragmentFiber);return t===null?this:nn(t).getRootNode(e)};fi.prototype.compareDocumentPosition=function(e){var t=Mr(this._fragmentFiber);if(t===null)return Node.DOCUMENT_POSITION_DISCONNECTED;var n=[];Qn(this._fragmentFiber.child,!1,A0,n,void 0,void 0);var i=nn(t);if(n.length===0){if(n=i,$_(this._fragmentFiber)){t:{for(t=this._fragmentFiber.return;t!==null;){if(t.tag===4){t=t.stateNode.containerInfo;break t}if(t.tag===3||t.tag===5||t.tag===27)break;t=t.return}t=null}t!=null&&(n=t)}t=this._fragmentFiber;var s=i=n.compareDocumentPosition(e);return n===e?s=Node.DOCUMENT_POSITION_CONTAINS:i&Node.DOCUMENT_POSITION_CONTAINED_BY&&(n=Hx(t)[1],n===null?s=Node.DOCUMENT_POSITION_PRECEDING:(e=nn(n).compareDocumentPosition(e),s=e===0||e&Node.DOCUMENT_POSITION_FOLLOWING?Node.DOCUMENT_POSITION_FOLLOWING:Node.DOCUMENT_POSITION_PRECEDING)),s|=Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC}t=nn(n[0]),s=nn(n[n.length-1]);var a=$_(this._fragmentFiber)?t.parentElement:i;if(a==null)return Node.DOCUMENT_POSITION_DISCONNECTED;i=a.compareDocumentPosition(t)&Node.DOCUMENT_POSITION_CONTAINED_BY,a=a.compareDocumentPosition(s)&Node.DOCUMENT_POSITION_CONTAINED_BY;var r=t.compareDocumentPosition(e),o=s.compareDocumentPosition(e),l=r&Node.DOCUMENT_POSITION_CONTAINED_BY||o&Node.DOCUMENT_POSITION_CONTAINED_BY;return o=i&&a&&r&Node.DOCUMENT_POSITION_FOLLOWING&&o&Node.DOCUMENT_POSITION_PRECEDING,t=i&&t===e||a&&s===e||l||o?Node.DOCUMENT_POSITION_CONTAINED_BY:!i&&t===e||!a&&s===e?Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC:r,t&Node.DOCUMENT_POSITION_DISCONNECTED||t&Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC||_C(t,this._fragmentFiber,n[0],n[n.length-1],e)?t:Node.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC};function _C(e,t,n,i,s){var a=lr(s);if(e&Node.DOCUMENT_POSITION_CONTAINED_BY){if(n=!!a)t:{for(;a!==null;){if(a.tag===7&&(a===t||a.alternate===t)){n=!0;break t}a=a.return}n=!1}return n}if(e&Node.DOCUMENT_POSITION_CONTAINS){if(a===null)return a=s.ownerDocument,s===a||s===a.documentElement||s===a.body;t:{for(a=t,t=Mr(t);a!==null;){if(!(a.tag!==5&&a.tag!==3&&a.tag!==27||a!==t&&a.alternate!==t)){a=!0;break t}a=a.return}a=!1}return a}return e&Node.DOCUMENT_POSITION_PRECEDING?((t=!!a)&&!(t=a===n)&&(t=Tm(n,a,ty),t===null?t=!1:(Qn(t,!0,ZT,a,n),a=$r,$r=null,t=a!==null)),t):e&Node.DOCUMENT_POSITION_FOLLOWING?((t=!!a)&&!(t=a===i)&&(t=Tm(i,a,ty),t===null?t=!1:(Qn(t,!0,jT,a,i),a=$r,Em=$r=null,t=a!==null)),t):!1}function Sx(e,t){var n=e.ownerDocument.createRange();n.selectNodeContents(e),e=n.getBoundingClientRect(),window.scrollTo(window.scrollX+e.left,t?window.scrollY+e.top:window.scrollY+e.bottom-window.innerHeight)}fi.prototype.scrollIntoView=function(e){if(typeof e=="object")throw Error(tt(566));var t=[];Qn(this._fragmentFiber.child,!1,A0,t,void 0,void 0);var n=e!==!1;if(t.length===0){var i=Hx(this._fragmentFiber);if(i=n?i[1]||i[0]||Mr(this._fragmentFiber):i[0]||i[1],i===null)return;if(i.tag===6){e=nn(i),Sx(e,n);return}if(i=nn(i),i.nodeType!==9){if(i.nodeType===11){n="host"in i?i.host:null,n!==null&&n.scrollIntoView(e);return}i.scrollIntoView(e)}}for(i=n?t.length-1:0;i!==(n?-1:t.length);){var s=t[i];s.tag===6?(s=nn(s),Sx(s,n)):nn(s).scrollIntoView(e),i+=n?-1:1}};function yC(e,t){return e=nn(e),xM(e,t),!1}function xM(e,t){e.reactFragments==null&&(e.reactFragments=new Set),e.reactFragments.add(t)}function SM(e,t){var n=t._eventListeners;if(n!==null)for(var i=0;i<n.length;i++){var s=n[i];e.addEventListener(s.type,s.attachedListener,No(s.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(a){for(var r=0,o=0;o<Hi.length;o++){var l=Hi[o];(l.fragmentInstance!==t||l.observer!==a||l.instance!==e)&&(Hi[r++]=l)}Hi.length=r,a.observe(e)}),xM(e,t))}function xC(e,t){var n=t._eventListeners;if(n!==null)for(var i=0;i<n.length;i++){var s=n[i];e.removeEventListener(s.type,s.attachedListener,No(s.optionsOrUseCapture))}e.nodeType!==3&&(n=t._observers,n!==null&&n.forEach(function(a){typeof a.rootMargin=="string"?gC(t,a,e):a.unobserve(e)}),e.reactFragments!=null&&e.reactFragments.delete(t))}function Rg(e){var t=e.firstChild;for(t&&t.nodeType===10&&(t=t.nextSibling);t;){var n=t;switch(t=t.nextSibling,n.nodeName){case"HTML":case"HEAD":case"BODY":Rg(n),Jh(n);continue;case"SCRIPT":case"STYLE":continue;case"LINK":if(n.rel.toLowerCase()==="stylesheet")continue}e.removeChild(n)}}function SC(e,t,n,i){for(;e.nodeType===1;){var s=n;if(e.nodeName.toLowerCase()!==t.toLowerCase()){if(!i&&(e.nodeName!=="INPUT"||e.type!=="hidden"))break}else if(i){if(!e[Ec])switch(t){case"meta":if(!e.hasAttribute("itemprop"))break;return e;case"link":if(a=e.getAttribute("rel"),a==="stylesheet"&&e.hasAttribute("data-precedence"))break;if(a!==s.rel||e.getAttribute("href")!==(s.href==null||s.href===""?null:s.href)||e.getAttribute("crossorigin")!==(s.crossOrigin==null?null:s.crossOrigin)||e.getAttribute("title")!==(s.title==null?null:s.title))break;return e;case"style":if(e.hasAttribute("data-precedence"))break;return e;case"script":if(a=e.getAttribute("src"),(a!==(s.src==null?null:s.src)||e.getAttribute("type")!==(s.type==null?null:s.type)||e.getAttribute("crossorigin")!==(s.crossOrigin==null?null:s.crossOrigin))&&a&&e.hasAttribute("async")&&!e.hasAttribute("itemprop"))break;return e;default:return e}}else if(t==="input"&&e.type==="hidden"){var a=s.name==null?null:""+s.name;if(s.type==="hidden"&&e.getAttribute("name")===a)return e}else return e;if(e=Ui(e.nextSibling),e===null)break}return null}function bC(e,t,n){if(t==="")return null;for(;e.nodeType!==3;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!n||(e=Ui(e.nextSibling),e===null))return null;return e}function bM(e,t){for(;e.nodeType!==8;)if((e.nodeType!==1||e.nodeName!=="INPUT"||e.type!=="hidden")&&!t||(e=Ui(e.nextSibling),e===null))return null;return e}function Ng(e){return e.data==="$?"||e.data==="$~"}function C0(e){return e.data==="$!"||e.data==="$?"&&e.ownerDocument.readyState!=="loading"}function MC(e,t){var n=e.ownerDocument;if(e.data==="$~")e._reactRetry=t;else if(e.data!=="$?"||n.readyState!=="loading")t();else{var i=function(){t(),n.removeEventListener("DOMContentLoaded",i)};n.addEventListener("DOMContentLoaded",i),e._reactRetry=i}}function Ui(e){for(;e!=null;e=e.nextSibling){var t=e.nodeType;if(t===1||t===3)break;if(t===8){if(t=e.data,t==="$"||t==="$!"||t==="$?"||t==="$~"||t==="&"||t==="F!"||t==="F")break;if(t==="/$"||t==="/&")return null}}return e}var Dg=null;function bx(e){e=e.nextSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="/$"||n==="/&"){if(t===0)return Ui(e.nextSibling);t--}else n!=="$"&&n!=="$!"&&n!=="$?"&&n!=="$~"&&n!=="&"||t++}e=e.nextSibling}return null}function Mx(e){e=e.previousSibling;for(var t=0;e;){if(e.nodeType===8){var n=e.data;if(n==="$"||n==="$!"||n==="$?"||n==="$~"||n==="&"){if(t===0)return e;t--}else n!=="/$"&&n!=="/&"||t++}e=e.previousSibling}return null}function EC(e,t){function n(){i=!0}if(e.ownerDocument.activeElement===e)return!0;var i=!1;try{e.ownerDocument.addEventListener("focus",n,!0),(e.focus||HTMLElement.prototype.focus).call(e,t)}finally{e.ownerDocument.removeEventListener("focus",n,!0)}return i}function TC(e){vx(function(){vx(function(t){return e(t)})})}function MM(e,t,n){switch(t=mc(n),e){case"html":if(e=t.documentElement,!e)throw Error(tt(452));return e;case"head":if(e=t.head,!e)throw Error(tt(453));return e;case"body":if(e=t.body,!e)throw Error(tt(454));return e;default:throw Error(tt(451))}}function EM(e,t,n){for(var i in n){var s=n[i];n.hasOwnProperty(i)&&s!=null&&ye(e,t,i,null,tC,s)}n.dangerouslySetInnerHTML!=null&&(e.textContent=""),e.onclick===us&&(e.onclick=null),Jh(e)}function Mm(e){for(var t=e.attributes;t.length;)e.removeAttributeNode(t[0]);Jh(e)}var Ii=new Map,Ex=new Set;function gc(e){if(typeof e.getRootNode=="function"){var t=e.getRootNode();if(t.nodeType===9||t.nodeType===11)return t}return e.nodeType===9?e:e.ownerDocument}var Ws=he.d;he.d={f:wC,r:AC,D:CC,C:RC,L:NC,m:DC,X:UC,S:LC,M:IC};function wC(){var e=Ws.f(),t=hd();return e||t}function AC(e){var t=Po(e);t!==null&&t.tag===5&&t.type==="form"?lb(t):Ws.r(e)}var Go=typeof document>"u"?null:document;function TM(e,t,n){var i=Go;if(i&&typeof t=="string"&&t){var s=Ni(t);s='link[rel="'+e+'"][href="'+s+'"]',typeof n=="string"&&(s+='[crossorigin="'+n+'"]'),Ex.has(s)||(Ex.add(s),e={rel:e,crossOrigin:n,href:t},i.querySelector(s)===null&&(t=i.createElement("link"),xn(t,"link",e),un(t),i.head.appendChild(t)))}}function CC(e){Ws.D(e),TM("dns-prefetch",e,null)}function RC(e,t){Ws.C(e,t),TM("preconnect",e,t)}function NC(e,t,n){Ws.L(e,t,n);var i=Go;if(i&&e&&t){var s='link[rel="preload"][as="'+Ni(t)+'"]';t==="image"&&n&&n.imageSrcSet?(s+='[imagesrcset="'+Ni(n.imageSrcSet)+'"]',typeof n.imageSizes=="string"&&(s+='[imagesizes="'+Ni(n.imageSizes)+'"]')):s+='[href="'+Ni(e)+'"]';var a=s;switch(t){case"style":a=Do(e);break;case"script":a=Ho(e)}if(!(Ii.has(a)||(e=Ae({rel:"preload",href:t==="image"&&n&&n.imageSrcSet?void 0:e,as:t},n),Ii.set(a,e),i.querySelector(s)!==null||t==="style"&&i.querySelector(Nc(a))||t==="script"&&i.querySelector(Dc(a))))){var r=i.createElement("link");xn(r,"link",e),t==="style"&&(r[Th]=!0,r.onload=r.onerror=function(){tS(r)}),un(r),i.head.appendChild(r)}}}function DC(e,t){Ws.m(e,t);var n=Go;if(n&&e){var i=t&&typeof t.as=="string"?t.as:"script",s='link[rel="modulepreload"][as="'+Ni(i)+'"][href="'+Ni(e)+'"]',a=s;switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":a=Ho(e)}if(!Ii.has(a)&&(e=Ae({rel:"modulepreload",href:e},t),Ii.set(a,e),n.querySelector(s)===null)){switch(i){case"audioworklet":case"paintworklet":case"serviceworker":case"sharedworker":case"worker":case"script":if(n.querySelector(Dc(a)))return}i=n.createElement("link"),xn(i,"link",e),un(i),n.head.appendChild(i)}}}function LC(e,t,n){Ws.S(e,t,n);var i=Go;if(i&&e){var s=ho(i).hoistableStyles,a=Do(e);t=t||"default";var r=s.get(a);if(!r){var o={loading:0,preload:null};if(r=i.querySelector(Nc(a)))o.loading=5;else{e=Ae({rel:"stylesheet",href:e,"data-precedence":t},n),(n=Ii.get(a))&&R0(e,n);var l=r=i.createElement("link");un(l),xn(l,"link",e),l._p=new Promise(function(c,h){l.onload=c,l.onerror=h}),l.addEventListener("load",function(){o.loading|=1}),l.addEventListener("error",function(){o.loading|=2}),o.loading|=4,gh(r,t,i)}r={type:"stylesheet",instance:r,count:1,state:o},s.set(a,r)}}}function UC(e,t){Ws.X(e,t);var n=Go;if(n&&e){var i=ho(n).hoistableScripts,s=Ho(e),a=i.get(s);a||(a=n.querySelector(Dc(s)),a||(e=Ae({src:e,async:!0},t),(t=Ii.get(s))&&N0(e,t),a=n.createElement("script"),un(a),xn(a,"link",e),n.head.appendChild(a)),a={type:"script",instance:a,count:1,state:null},i.set(s,a))}}function IC(e,t){Ws.M(e,t);var n=Go;if(n&&e){var i=ho(n).hoistableScripts,s=Ho(e),a=i.get(s);a||(a=n.querySelector(Dc(s)),a||(e=Ae({src:e,async:!0,type:"module"},t),(t=Ii.get(s))&&N0(e,t),a=n.createElement("script"),un(a),xn(a,"link",e),n.head.appendChild(a)),a={type:"script",instance:a,count:1,state:null},i.set(s,a))}}function Tx(e,t,n,i){var s=(s=Sa.current)?gc(s):null;if(!s)throw Error(tt(446));switch(e){case"meta":case"title":return null;case"style":return typeof n.precedence=="string"&&typeof n.href=="string"?(n=Do(n.href),t=ho(s).hoistableStyles,i=t.get(n),i||(i={type:"style",instance:null,count:0,state:null},t.set(n,i)),i):{type:"void",instance:null,count:0,state:null};case"link":if(n.rel==="stylesheet"&&typeof n.href=="string"&&typeof n.precedence=="string"){e=Do(n.href);var a=ho(s).hoistableStyles,r=a.get(e);if(r||(s=s.ownerDocument||s,r={type:"stylesheet",instance:null,count:0,state:{loading:0,preload:null}},a.set(e,r),(a=s.querySelector(Nc(e)))?a._p||(r.instance=a,r.state.loading=5):(a=Ii.get(e),a||(a={rel:"preload",as:"style",href:n.href,crossOrigin:n.crossOrigin,integrity:n.integrity,media:n.media,hrefLang:n.hrefLang,referrerPolicy:n.referrerPolicy},Ii.set(e,a)),OC(s,e,a,r.state))),t&&i===null)throw Error(tt(528,""));return r}if(t&&i!==null)throw Error(tt(529,""));return null;case"script":return t=n.async,n=n.src,typeof n=="string"&&t&&typeof t!="function"&&typeof t!="symbol"?(n=Ho(n),t=ho(s).hoistableScripts,i=t.get(n),i||(i={type:"script",instance:null,count:0,state:null},t.set(n,i)),i):{type:"void",instance:null,count:0,state:null};default:throw Error(tt(444,e))}}function Do(e){return'href="'+Ni(e)+'"'}function Nc(e){return'link[rel="stylesheet"]['+e+"]"}function wM(e){return Ae({},e,{"data-precedence":e.precedence,precedence:null})}function OC(e,t,n,i){if(t=e.querySelector('link[rel="preload"][as="style"]['+t+"]")){if(t[Th]!==!0){i.loading=1;return}}else t=e.createElement("link"),t[Th]=!0,t.onload=t.onerror=tS.bind(null,t),xn(t,"link",n),un(t),e.head.appendChild(t);i.preload=t,t.addEventListener("load",function(){return i.loading|=1}),t.addEventListener("error",function(){return i.loading|=2})}function Ho(e){return'[src="'+Ni(e)+'"]'}function Dc(e){return"script[async]"+e}function wx(e,t,n){if(t.count++,t.instance===null)switch(t.type){case"style":var i=e.querySelector('style[data-href~="'+Ni(n.href)+'"]');if(i)return t.instance=i,un(i),i;var s=Ae({},n,{"data-href":n.href,"data-precedence":n.precedence,href:null,precedence:null});return i=(e.ownerDocument||e).createElement("style"),un(i),xn(i,"style",s),gh(i,n.precedence,e),t.instance=i;case"stylesheet":s=Do(n.href);var a=e.querySelector(Nc(s));if(a)return t.state.loading|=4,t.instance=a,un(a),a;i=wM(n),(s=Ii.get(s))&&R0(i,s),a=(e.ownerDocument||e).createElement("link"),un(a);var r=a;return r._p=new Promise(function(o,l){r.onload=o,r.onerror=l}),xn(a,"link",i),t.state.loading|=4,gh(a,n.precedence,e),t.instance=a;case"script":return a=Ho(n.src),(s=e.querySelector(Dc(a)))?(t.instance=s,un(s),s):(i=n,(s=Ii.get(a))&&(i=Ae({},n),N0(i,s)),e=e.ownerDocument||e,s=e.createElement("script"),un(s),xn(s,"link",i),e.head.appendChild(s),t.instance=s);case"void":return null;default:throw Error(tt(443,t.type))}else t.type==="stylesheet"&&(t.state.loading&4)===0&&(i=t.instance,t.state.loading|=4,gh(i,n.precedence,e));return t.instance}function gh(e,t,n){for(var i=n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'),s=i.length?i[i.length-1]:null,a=s,r=0;r<i.length;r++){var o=i[r];if(o.dataset.precedence===t)a=o;else if(a!==s)break}a?a.parentNode.insertBefore(e,a.nextSibling):(t=n.nodeType===9?n.head:n,t.insertBefore(e,t.firstChild))}function R0(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.title==null&&(e.title=t.title)}function N0(e,t){e.crossOrigin==null&&(e.crossOrigin=t.crossOrigin),e.referrerPolicy==null&&(e.referrerPolicy=t.referrerPolicy),e.integrity==null&&(e.integrity=t.integrity)}var vh=null;function Ax(e,t,n){if(vh===null){var i=new Map,s=vh=new Map;s.set(n,i)}else s=vh,i=s.get(n),i||(i=new Map,s.set(n,i));if(i.has(e))return i;for(i.set(e,null),n=n.getElementsByTagName(e),s=0;s<n.length;s++){var a=n[s];if(!(a[Ec]||a[gn]||e==="link"&&a.getAttribute("rel")==="stylesheet")&&a.namespaceURI!=="http://www.w3.org/2000/svg"){var r=a.getAttribute(t)||"";r=e+r;var o=i.get(r);o?o.push(a):i.set(r,[a])}}return i}function Lg(e,t,n){e=e.ownerDocument||e,e.head.insertBefore(n,t==="title"?e.querySelector("head > title"):null)}function PC(e,t,n){if(n===1||t.itemProp!=null)return!1;switch(e){case"meta":case"title":return!0;case"style":if(typeof t.precedence!="string"||typeof t.href!="string"||t.href==="")break;return!0;case"link":if(typeof t.rel!="string"||typeof t.href!="string"||t.href===""||t.onLoad||t.onError)break;switch(t.rel){case"stylesheet":return e=t.disabled,typeof t.precedence=="string"&&e==null;default:return!0}case"script":if(t.async&&typeof t.async!="function"&&typeof t.async!="symbol"&&!t.onLoad&&!t.onError&&t.src&&typeof t.src=="string")return!0}return!1}function Cx(e,t){return e==="img"&&t.src!=null&&t.src!==""&&t.onLoad==null&&t.loading!=="lazy"}function AM(e){return!(e.type==="stylesheet"&&(e.state.loading&3)===0)}function CM(e){return(e.width||100)*(e.height||100)*(typeof devicePixelRatio=="number"?devicePixelRatio:1)*.25}function Rx(e,t){typeof t.decode=="function"&&(e.imgCount++,t.complete||(e.imgBytes+=CM(t),e.suspenseyImages.push(t)),e=FC.bind(e),t.decode().then(e,e))}function BC(e,t,n,i){if(n.type==="stylesheet"&&(typeof i.media!="string"||matchMedia(i.media).matches!==!1)&&(n.state.loading&4)===0){if(n.instance===null){var s=Do(i.href),a=t.querySelector(Nc(s));if(a){t=a._p,t!==null&&typeof t=="object"&&typeof t.then=="function"&&(e.count++,e=vc.bind(e),t.then(e,e)),n.state.loading|=4,n.instance=a,un(a);return}a=t.ownerDocument||t,i=wM(i),(s=Ii.get(s))&&R0(i,s),a=a.createElement("link"),un(a);var r=a;r._p=new Promise(function(o,l){r.onload=o,r.onerror=l}),xn(a,"link",i),n.instance=a}e.stylesheets===null&&(e.stylesheets=new Map),e.stylesheets.set(n,t),(t=n.state.preload)&&(n.state.loading&3)===0&&(e.count++,n=vc.bind(e),t.addEventListener("load",n),t.addEventListener("error",n))}}var _h=0;function zC(e,t){return e.stylesheets&&e.count===0&&yh(e,e.stylesheets),0<e.count||0<e.imgCount?function(n){var i=setTimeout(function(){if(e.stylesheets&&yh(e,e.stylesheets),e.unsuspend){var a=e.unsuspend;e.unsuspend=null,a()}},6e4+t);0<e.imgBytes&&_h===0&&(_h=62500*nC());var s=setTimeout(function(){if(e.waitingForImages=!1,e.count===0&&(e.stylesheets&&yh(e,e.stylesheets),e.unsuspend)){var a=e.unsuspend;e.unsuspend=null,a()}},(e.imgBytes>_h?50:800)+t);return e.unsuspend=n,function(){e.unsuspend=null,clearTimeout(i),clearTimeout(s)}}:null}function RM(e){if(e.count===0&&(e.imgCount===0||!e.waitingForImages)){if(e.stylesheets)yh(e,e.stylesheets);else if(e.unsuspend){var t=e.unsuspend;e.unsuspend=null,t()}}}function vc(){this.count--,RM(this)}function FC(){this.imgCount--,RM(this)}var Zh=null;function yh(e,t){e.stylesheets=null,e.unsuspend!==null&&(e.count++,Zh=new Map,t.forEach(GC,e),Zh=null,vc.call(e))}function GC(e,t){if(!(t.state.loading&4)){var n=Zh.get(e);if(n)var i=n.get(null);else{n=new Map,Zh.set(e,n);for(var s=e.querySelectorAll("link[data-precedence],style[data-precedence]"),a=0;a<s.length;a++){var r=s[a];(r.nodeName==="LINK"||r.getAttribute("media")!=="not all")&&(n.set(r.dataset.precedence,r),i=r)}i&&n.set(null,i)}s=t.instance,r=s.getAttribute("data-precedence"),a=n.get(r)||i,a===i&&n.set(null,s),n.set(r,s),this.count++,i=vc.bind(this),s.addEventListener("load",i),s.addEventListener("error",i),a?a.parentNode.insertBefore(s,a.nextSibling):(e=e.nodeType===9?e.head:e,e.insertBefore(s,e.firstChild)),t.state.loading|=4}}var Lo={$$typeof:cs,Provider:null,Consumer:null,_currentValue:ur,_currentValue2:ur,_threadCount:0};function HC(e,t,n,i,s,a,r,o,l){this.tag=1,this.containerInfo=e,this.pingCache=this.current=this.pendingChildren=null,this.timeoutHandle=-1,this.callbackNode=this.next=this.pendingContext=this.context=this.cancelPendingCommit=null,this.callbackPriority=0,this.expirationTimes=Jp(-1),this.entangledLanes=this.shellSuspendCounter=this.errorRecoveryDisabledLanes=this.expiredLanes=this.warmLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0,this.entanglements=Jp(0),this.hiddenUpdates=Jp(null),this.identifierPrefix=i,this.onUncaughtError=s,this.onCaughtError=a,this.onRecoverableError=r,this.pooledCache=null,this.pooledCacheLanes=0,this.formState=l,this.transitionTypes=null,this.incompleteTransitions=new Map}function NM(e,t,n,i,s,a,r,o,l,c,h,d){return e=new HC(e,t,n,r,l,c,h,d,o),t=1,a===!0&&(t|=24),a=Kn(3,null,null,t),e.current=a,a.stateNode=e,t=Kg(),t.refCount++,e.pooledCache=t,t.refCount++,a.memoizedState={element:i,isDehydrated:n,cache:t},$g(a),e}function DM(e){return e?(e=oo,e):oo}function LM(e,t,n,i,s,a){s=DM(s),i.context===null?i.context=s:i.pendingContext=s,i=Ma(t),i.payload={element:n},a=a===void 0?null:a,a!==null&&(i.callback=a),n=Ea(e,i,t),n!==null&&(Jn(n,e,t),jl(n,e,t))}function Nx(e,t){if(e=e.memoizedState,e!==null&&e.dehydrated!==null){var n=e.retryLane;e.retryLane=n!==0&&n<t?n:t}}function D0(e,t){Nx(e,t),(e=e.alternate)&&Nx(e,t)}function UM(e){if(e.tag===13||e.tag===31){var t=wr(e,67108864);t!==null&&Jn(t,e,67108864),D0(e,67108864)}}function Dx(e){if(e.tag===13||e.tag===31){var t=hi();t=zg(t);var n=wr(e,t);n!==null&&Jn(n,e,t),D0(e,t)}}var Uo=!0;function VC(e,t,n,i){var s=zt.T;zt.T=null;var a=he.p;try{he.p=2,L0(e,t,n,i)}finally{he.p=a,zt.T=s}}function kC(e,t,n,i){var s=zt.T;zt.T=null;var a=he.p;try{he.p=8,L0(e,t,n,i)}finally{he.p=a,zt.T=s}}function L0(e,t,n,i){if(Uo){var s=Ug(i);if(s===null)xm(e,t,i,jh,n),Lx(e,i);else if(WC(s,e,t,n,i))i.stopPropagation();else if(Lx(e,i),t&4&&-1<XC.indexOf(e)){for(;s!==null;){var a=Po(s);if(a!==null)switch(a.tag){case 3:if(a=a.stateNode,a.current.memoizedState.isDehydrated){var r=ar(a.pendingLanes);if(r!==0){var o=a;for(o.pendingLanes|=2,o.entangledLanes|=2;r;){var l=1<<31-ui(r);o.entanglements[1]|=l,r&=~l}vs(a),(ue&6)===0&&(kh=li()+500,Rc(0,!1))}}break;case 31:case 13:o=wr(a,2),o!==null&&Jn(o,a,2),hd(),D0(a,2)}if(a=Ug(i),a===null&&xm(e,t,i,jh,n),a===s)break;s=a}s!==null&&i.stopPropagation()}else xm(e,t,i,null,n)}}function Ug(e){return e=Hg(e),U0(e)}var jh=null;function U0(e){if(jh=null,e=lr(e),e!==null){var t=xc(e);if(t===null)e=null;else{var n=t.tag;if(n===13){if(e=zx(t),e!==null)return e;e=null}else if(n===31){if(e=Fx(t),e!==null)return e;e=null}else if(n===3){if(t.stateNode.current.memoizedState.isDehydrated)return t.tag===3?t.stateNode.containerInfo:null;e=null}else t!==e&&(e=null)}}return jh=e,null}function IM(e){switch(e){case"beforetoggle":case"cancel":case"click":case"close":case"contextmenu":case"copy":case"cut":case"auxclick":case"dblclick":case"dragend":case"dragstart":case"drop":case"focusin":case"focusout":case"input":case"invalid":case"keydown":case"keypress":case"keyup":case"mousedown":case"mouseup":case"paste":case"pause":case"play":case"pointercancel":case"pointerdown":case"pointerup":case"ratechange":case"reset":case"seeked":case"submit":case"toggle":case"touchcancel":case"touchend":case"touchstart":case"volumechange":case"change":case"selectionchange":case"textInput":case"compositionstart":case"compositionend":case"compositionupdate":case"beforeblur":case"afterblur":case"beforeinput":case"blur":case"fullscreenchange":case"fullscreenerror":case"focus":case"hashchange":case"popstate":case"select":case"selectstart":return 2;case"drag":case"dragenter":case"dragexit":case"dragleave":case"dragover":case"mousemove":case"mouseout":case"mouseover":case"pointermove":case"pointerout":case"pointerover":case"resize":case"scroll":case"touchmove":case"wheel":case"mouseenter":case"mouseleave":case"pointerenter":case"pointerleave":return 8;case"message":switch(sw()){case Wx:return 2;case qx:return 8;case Eh:case aw:return 32;case Yx:return 268435456;default:return 32}default:return 32}}var Ig=!1,Ca=null,Ra=null,Na=null,_c=new Map,yc=new Map,pa=[],XC="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");function Lx(e,t){switch(e){case"focusin":case"focusout":Ca=null;break;case"dragenter":case"dragleave":Ra=null;break;case"mouseover":case"mouseout":Na=null;break;case"pointerover":case"pointerout":_c.delete(t.pointerId);break;case"gotpointercapture":case"lostpointercapture":yc.delete(t.pointerId)}}function zl(e,t,n,i,s,a){return e===null||e.nativeEvent!==a?(e={blockedOn:t,domEventName:n,eventSystemFlags:i,nativeEvent:a,targetContainers:[s]},t!==null&&(t=Po(t),t!==null&&UM(t)),e):(e.eventSystemFlags|=i,t=e.targetContainers,s!==null&&t.indexOf(s)===-1&&t.push(s),e)}function WC(e,t,n,i,s){switch(t){case"focusin":return Ca=zl(Ca,e,t,n,i,s),!0;case"dragenter":return Ra=zl(Ra,e,t,n,i,s),!0;case"mouseover":return Na=zl(Na,e,t,n,i,s),!0;case"pointerover":var a=s.pointerId;return _c.set(a,zl(_c.get(a)||null,e,t,n,i,s)),!0;case"gotpointercapture":return a=s.pointerId,yc.set(a,zl(yc.get(a)||null,e,t,n,i,s)),!0}return!1}function OM(e){var t=lr(e.target);if(t!==null){var n=xc(t);if(n!==null){if(t=n.tag,t===13){if(t=zx(n),t!==null){e.blockedOn=t,sy(e.priority,function(){Dx(n)});return}}else if(t===31){if(t=Fx(n),t!==null){e.blockedOn=t,sy(e.priority,function(){Dx(n)});return}}else if(t===3&&n.stateNode.current.memoizedState.isDehydrated){e.blockedOn=n.tag===3?n.stateNode.containerInfo:null;return}}}e.blockedOn=null}function xh(e){if(e.blockedOn!==null)return!1;for(var t=e.targetContainers;0<t.length;){var n=Ug(e.nativeEvent);if(n===null){n=e.nativeEvent;var i=new n.constructor(n.type,n);Bm=i,n.target.dispatchEvent(i),Bm=null}else return t=Po(n),t!==null&&UM(t),e.blockedOn=n,!1;t.shift()}return!0}function Ux(e,t,n){xh(e)&&n.delete(t)}function qC(){Ig=!1,Ca!==null&&xh(Ca)&&(Ca=null),Ra!==null&&xh(Ra)&&(Ra=null),Na!==null&&xh(Na)&&(Na=null),_c.forEach(Ux),yc.forEach(Ux)}function th(e,t){e.blockedOn===t&&(e.blockedOn=null,Ig||(Ig=!0,sn.unstable_scheduleCallback(sn.unstable_NormalPriority,qC)))}var eh=null;function Ix(e){eh!==e&&(eh=e,sn.unstable_scheduleCallback(sn.unstable_NormalPriority,function(){eh===e&&(eh=null);for(var t=0;t<e.length;t+=3){var n=e[t],i=e[t+1],s=e[t+2];if(typeof i!="function"){if(U0(i||n)===null)continue;break}var a=Po(n);a!==null&&(e.splice(t,3),t-=3,$m(a,{pending:!0,data:s,method:n.method,action:i},i,s))}}))}function Io(e){function t(l){return th(l,e)}Ca!==null&&th(Ca,e),Ra!==null&&th(Ra,e),Na!==null&&th(Na,e),_c.forEach(t),yc.forEach(t);for(var n=0;n<pa.length;n++){var i=pa[n];i.blockedOn===e&&(i.blockedOn=null)}for(;0<pa.length&&(n=pa[0],n.blockedOn===null);)OM(n),n.blockedOn===null&&pa.shift();if(n=(e.ownerDocument||e).$$reactFormReplay,n!=null)for(i=0;i<n.length;i+=3){var s=n[i],a=n[i+1],r=s[$n]||null;if(typeof a=="function")r||Ix(n);else if(r){var o=null;if(a&&a.hasAttribute("formAction")){if(s=a,r=a[$n]||null)o=r.formAction;else if(U0(s)!==null)continue}else o=r.action;typeof o=="function"?n[i+1]=o:(n.splice(i,3),i-=3),Ix(n)}}}function PM(){function e(a){a.canIntercept&&a.info==="react-transition"&&a.intercept({handler:function(){return new Promise(function(r){return s=r})},focusReset:"manual",scroll:"manual"})}function t(){s!==null&&(s(),s=null),i||setTimeout(n,20)}function n(){if(!i&&!navigation.transition){var a=navigation.currentEntry;a&&a.url!=null&&navigation.navigate(a.url,{state:a.getState(),info:"react-transition",history:"replace"})}}if(typeof navigation=="object"){var i=!1,s=null;return navigation.addEventListener("navigate",e),navigation.addEventListener("navigatesuccess",t),navigation.addEventListener("navigateerror",t),setTimeout(n,100),function(){i=!0,navigation.removeEventListener("navigate",e),navigation.removeEventListener("navigatesuccess",t),navigation.removeEventListener("navigateerror",t),s!==null&&(s(),s=null)}}}function I0(e){this._internalRoot=e}pd.prototype.render=I0.prototype.render=function(e){var t=this._internalRoot;if(t===null)throw Error(tt(409));var n=t.current,i=hi();LM(n,i,e,t,null,null)};pd.prototype.unmount=I0.prototype.unmount=function(){var e=this._internalRoot;if(e!==null){this._internalRoot=null;var t=e.containerInfo;LM(e.current,2,null,e,null,null),hd(),t[Oo]=null}};function pd(e){this._internalRoot=e}pd.prototype.unstable_scheduleHydration=function(e){if(e){var t=$x();e={blockedOn:null,target:e,priority:t};for(var n=0;n<pa.length&&t!==0&&t<pa[n].priority;n++);pa.splice(n,0,e),n===0&&OM(e)}};var Ox=Px.version;if(Ox!=="19.3.0")throw Error(tt(527,Ox,"19.3.0"));he.findDOMNode=function(e){var t=e._reactInternals;if(t===void 0)throw typeof e.render=="function"?Error(tt(188)):(e=Object.keys(e).join(","),Error(tt(268,e)));return e=YT(t),e=e!==null?Gx(e):null,e=e===null?null:e.stateNode,e};var YC={bundleType:0,version:"19.3.0",rendererPackageName:"react-dom",currentDispatcherRef:zt,reconcilerVersion:"19.3.0"};if(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__<"u"&&(Fl=__REACT_DEVTOOLS_GLOBAL_HOOK__,!Fl.isDisabled&&Fl.supportsFiber))try{Sc=Fl.inject(YC),ci=Fl}catch{}var Fl;md.createRoot=function(e,t){if(!Bx(e))throw Error(tt(299));var n=!1,i="",s=gb,a=vb,r=_b;return t!=null&&(t.unstable_strictMode===!0&&(n=!0),t.identifierPrefix!==void 0&&(i=t.identifierPrefix),t.onUncaughtError!==void 0&&(s=t.onUncaughtError),t.onCaughtError!==void 0&&(a=t.onCaughtError),t.onRecoverableError!==void 0&&(r=t.onRecoverableError)),t=NM(e,1,!1,null,null,n,i,null,s,a,r,PM),e[Oo]=t.current,T0(e),new I0(t)};md.hydrateRoot=function(e,t,n){if(!Bx(e))throw Error(tt(299));var i=!1,s="",a=gb,r=vb,o=_b,l=null;return n!=null&&(n.unstable_strictMode===!0&&(i=!0),n.identifierPrefix!==void 0&&(s=n.identifierPrefix),n.onUncaughtError!==void 0&&(a=n.onUncaughtError),n.onCaughtError!==void 0&&(r=n.onCaughtError),n.onRecoverableError!==void 0&&(o=n.onRecoverableError),n.formState!==void 0&&(l=n.formState)),t=NM(e,1,!0,t,n??null,i,s,l,a,r,o,PM),t.context=DM(null),n=t.current,i=hi(),i=zg(i),s=Ma(i),s.callback=null,Ea(n,s,i),n=i,t.current.lanes=n,Mc(t,n),vs(t),e[Oo]=t.current,T0(e),new pd(t)};md.version="19.3.0"});var GM=ns((BU,FM)=>{"use strict";function zM(){if(!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__>"u"||typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE!="function"))try{__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(zM)}catch(e){console.error(e)}}zM(),FM.exports=BM()});var cT=ns(Ap=>{"use strict";var fU=Symbol.for("react.transitional.element"),pU=Symbol.for("react.fragment");function lT(e,t,n){var i=null;if(n!==void 0&&(i=""+n),t.key!==void 0&&(i=""+t.key),"key"in t){n={};for(var s in t)s!=="key"&&(n[s]=t[s])}else n=t;return t=n.ref,{$$typeof:fU,type:e,key:i,ref:t!==void 0?t:null,props:n}}Ap.Fragment=pU;Ap.jsx=lT;Ap.jsxs=lT});var p_=ns((MB,uT)=>{"use strict";uT.exports=cT()});var dt=Cu(Nu(),1),dT=Cu(GM(),1);function HM(e,t){let n=new Set(e.map(s=>s.lane)),i=0;for(;n.has(i)||t.has(i);)i+=1;return i}function VM(e,t={}){let n=t.previous?.rowOffset??0,i=(t.previous?.lanes??[]).map(c=>({...c})),s=t.previous?.nextColour??0,a=[],r=[],o=i.reduce((c,h)=>Math.max(c,h.lane),-1);for(let c=0;c<e.length;c+=1){let h=e[c],d=n+c,u=i.filter(f=>f.target===h.oid).sort((f,v)=>f.lane-v.lane),p=new Set,m=u[0]??{lane:HM(i,p),target:h.oid,colour:s++};o=Math.max(o,m.lane),a.push({oid:h.oid,lane:m.lane,row:d,colour:m.colour,kind:h.kind});for(let f of i)f.target!==h.oid&&(r.push({from:{lane:f.lane,row:f.fromRow},to:{lane:f.lane,row:d},colour:f.colour}),f.fromRow=d);for(let f of u)r.push({from:{lane:f.lane,row:f.fromRow},to:{lane:m.lane,row:d},colour:f.colour,anchor:"to"});for(let f=i.length-1;f>=0;f-=1)i[f].target===h.oid&&i.splice(f,1);let S=h.parents.filter(Boolean),g=S[0];g&&(i.push({lane:m.lane,target:g,colour:m.colour,fromRow:d}),p.add(m.lane));for(let f of S.slice(1)){let v=i.find(T=>T.target===f);if(v){r.push({from:{lane:m.lane,row:d},to:{lane:v.lane,row:d+1},colour:v.colour,anchor:"from"});continue}let b=HM(i,p);p.add(b),o=Math.max(o,b);let y=s++;i.push({lane:b,target:f,colour:y,fromRow:d+1}),r.push({from:{lane:m.lane,row:d},to:{lane:b,row:d+1},colour:y,anchor:"from"})}}let l=n+e.length;for(let c of i)c.fromRow<l&&(r.push({from:{lane:c.lane,row:c.fromRow},to:{lane:c.lane,row:l},colour:c.colour,dangling:!0}),c.fromRow=l);return{nodes:a,segments:r,state:{lanes:i.map(c=>({...c})),nextColour:s,rowOffset:l},laneCount:Math.max(1,o+1)}}var ZC="web-git-graph",Vo=["#e3008c","#007acc","#00c853","#ff8c00","#b180d7","#00b7c3","#dcdcaa"],jC=new Set(["current","head"]),kM=typeof navigator<"u"&&/mac|iphone|ipad|ipod/i.test(navigator.userAgent??""),KC=[78,54,88,41,69,82,47,61],gd=[64,88,45,73,52],JC=`
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
`;function vd(e){return e.kind==="working-tree"?{kind:"working-tree"}:e.kind==="stash"?{kind:"stash",oid:e.oid}:{kind:"commit",oid:e.oid}}function O0(e){return e.startsWith("__")?e.replaceAll("_",""):e.slice(0,8)}function P0(e){return e.replace(/^refs\/(heads|tags|remotes)\//,"")}var QC=[["year",31536e6],["month",2592e6],["week",6048e5],["day",864e5],["hour",36e5],["minute",6e4]];function _d(e){return String(e).padStart(2,"0")}function XM(e,t="datetime"){if(!e)return"\u2014";let n=new Date(e);if(Number.isNaN(n.valueOf()))return e;if(t==="relative"){let s=n.valueOf()-Date.now(),a=new Intl.RelativeTimeFormat(void 0,{numeric:"auto"});for(let[r,o]of QC)if(Math.abs(s)>=o)return a.format(Math.round(s/o),r);return a.format(Math.round(s/1e3),"second")}let i=`${n.getFullYear()}/${_d(n.getMonth()+1)}/${_d(n.getDate())}`;return t==="date"?i:`${i} ${_d(n.getHours())}:${_d(n.getMinutes())}`}var B0=new Map,z0=new Set;function $C(e){let t=0;for(let n=0;n<e.length;n+=1)t=(t*31+e.charCodeAt(n))%360;return`hsl(${t} 44% 40%)`}async function tR(e){if(typeof crypto>"u"||!crypto.subtle)return;let t=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(e));return`https://www.gravatar.com/avatar/${[...new Uint8Array(t)].map(i=>i.toString(16).padStart(2,"0")).join("")}?s=48&d=404`}function eR(e){let t={dirs:new Map,files:[]};for(let n of e){let i=n.path.split("/"),s=t;for(let a of i.slice(0,-1)){let r=s.dirs.get(a);r||(r={dirs:new Map,files:[]},s.dirs.set(a,r)),s=r}s.files.push(n)}return t}function F0(e){return e.split("/").pop()??e}function yd(e){let t=document.createElement("div");return t.className="pending details-pending",t.setAttribute("aria-hidden","true"),t.innerHTML=e.map(n=>`<span class="pending-bar" style="width:${n}%"></span>`).join(""),t}function G0(e,t){let n=document.createElementNS("http://www.w3.org/2000/svg",e);for(let[i,s]of Object.entries(t))n.setAttribute(i,s);return n}var nR=typeof HTMLElement>"u"?class{}:HTMLElement,WM=class extends nR{static observedAttributes=["theme","density","columns","date-format","date-type","avatars"];#s;#t={commits:[],refs:[],hasMore:!1};#x=VM([]);#S="";#u=[];#d=-1;#h=[];#D;#L;#U;#T;#n;#f;#r;#p;#o;#m=new Set;#w;#b;#g=!1;#I=!1;#M=!1;#E;#O;#a=24;#V=8;#P=240;#A=!0;#e;addEventListener(e,t,n){super.addEventListener(e,t,n)}removeEventListener(e,t,n){super.removeEventListener(e,t,n)}ongitgraphcommitsselect=null;ongitgraphcommitsopen=null;ongitgraphcompare=null;ongitgraphfileopen=null;ongitgraphloadmore=null;ongitgrapherror=null;ongitgraphrefresh=null;ongitgraphcontextmenu=null;constructor(){super(),this.#e=this.attachShadow({mode:"open"}),this.#e.innerHTML=`<style>${JC}</style><div class="shell"></div>`}connectedCallback(){this.#X(),this.#s&&this.#t.commits.length===0&&this.#y(!1)}disconnectedCallback(){this.#l()}attributeChangedCallback(){this.#a=this.getAttribute("density")==="compact"?20:24,this.#W(),this.#j(),this.#i()}get provider(){return this.#s}set provider(e){this.#s=e,e&&(this.#h=[],this.#t={...this.#t,repositoryId:void 0,repositoryName:void 0,cursor:void 0,hasMore:!1},this.isConnected&&this.#y(!1))}get data(){return this.#t}set data(e){this.setData(e)}get theme(){return this.getAttribute("theme")??"dark"}set theme(e){this.setAttribute("theme",e)}get density(){return this.getAttribute("density")??"comfortable"}set density(e){this.setAttribute("density",e)}get columns(){return this.getAttribute("columns")??"date,author,commit"}set columns(e){this.setAttribute("columns",e)}get dateFormat(){let e=this.getAttribute("date-format");return e==="date"||e==="relative"?e:"datetime"}set dateFormat(e){this.setAttribute("date-format",e)}get dateType(){return this.getAttribute("date-type")==="authored"?"authored":"committed"}set dateType(e){this.setAttribute("date-type",e)}get avatars(){let e=this.getAttribute("avatars");return e!==null&&e!=="false"&&e!=="off"}set avatars(e){e?this.setAttribute("avatars",""):this.removeAttribute("avatars")}get refs(){return this.#h}set refs(e){this.#B([...e])}refresh(){let e=new CustomEvent("gitgraph-refresh",{bubbles:!0,composed:!0,cancelable:!0,detail:{repositoryId:this.#t.repositoryId}});this.dispatchEvent(e)&&this.#s&&this.#y(!1,!0)}setData(e){this.#t={...e,commits:[...e.commits],refs:[...e.refs]},this.#n=void 0,this.#f=void 0,this.#r=void 0,this.#g=!1,this.#p=void 0,this.#E=void 0,this.#m.clear(),this.#k(),this.#e.querySelector(".scroller")?.scrollTo({top:0})}appendPage(e){let t=this.#e.querySelector(".scroller")?.scrollTop??0,n=new Set(this.#t.commits.map(i=>i.oid));this.#t={...this.#t,...e,commits:[...this.#t.commits,...e.commits.filter(i=>!n.has(i.oid))],refs:this.#st(this.#t.refs,e.refs)},this.#k(),queueMicrotask(()=>{let i=this.#e.querySelector(".scroller");i&&(i.scrollTop=t,this.#i())})}selectCommit(e){let t=this.#t.commits.find(n=>n.oid===e);t&&(this.#n=e,this.#f=void 0,this.#p=void 0,this.#o=void 0,this.#m.clear(),this.dispatchEvent(new CustomEvent("gitgraph-commit-select",{bubbles:!0,composed:!0,detail:{commit:t}})),this.#Q(t),this.#i(),this.#c(),queueMicrotask(()=>this.#ft(t.oid)))}async compareCommits(e,t){let n=this.#t.commits.find(s=>s.oid===e),i=this.#t.commits.find(s=>s.oid===t);if(!(!n||!i||!this.#s?.compare)){this.#n=e,this.#f=t,this.#o=void 0,this.#p=void 0,this.#g=!0,this.#m.clear(),this.#i(),this.#c();try{this.#p=await this.#s.compare(this.#t.repositoryId,vd(n),vd(i)),this.dispatchEvent(new CustomEvent("gitgraph-compare",{bubbles:!0,composed:!0,detail:this.#p}))}catch(s){this.#N(s)}this.#c()}}focusCommit(e){let t=this.#t.commits.findIndex(i=>i.oid===e);if(t<0)return;this.#e.querySelector(".scroller")?.scrollTo({top:this.#v(t,this.#R()),behavior:"smooth"}),queueMicrotask(()=>{this.#e.querySelector(`.row[data-oid="${CSS.escape(e)}"]`)?.focus()})}#st(e,t){let n=new Map(e.map(i=>[`${i.kind}:${i.name}`,i]));for(let i of t)n.set(`${i.kind}:${i.name}`,i);return[...n.values()]}#k(){this.#x=VM(this.#t.commits),this.#F(!1),this.#X(),this.#W(),this.#C(),this.#j(),this.#i()}#X(){let e=this.#e.querySelector(".shell");if(!e||e.querySelector(".toolbar"))return;e.innerHTML=`
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
      </div>`;let t=e.querySelector(".search");t.value=this.#S,t.addEventListener("input",()=>{this.#S=t.value,this.#F(!0),this.#C(),this.#i(),this.#J()}),t.addEventListener("keydown",a=>{a.key==="Enter"?(a.preventDefault(),this.#G(a.shiftKey?-1:1)):a.key==="Escape"&&t.value&&(a.stopPropagation(),t.value="",this.#S="",this.#F(!0),this.#C(),this.#i())}),e.querySelector(".search-prev")?.addEventListener("click",()=>this.#G(-1)),e.querySelector(".search-next")?.addEventListener("click",()=>this.#G(1)),e.querySelector(".refresh")?.addEventListener("click",()=>this.refresh()),e.querySelector(".theme-toggle")?.addEventListener("click",()=>{this.theme=this.theme==="light"?"dark":"light"});let n=e.querySelector(".remote-toggle");n.checked=this.#A,n.addEventListener("change",()=>{this.#A=n.checked,this.#l(),this.#i()});let i=e.querySelector(".ref-select");i.addEventListener("click",()=>{this.#D?.dataset.menu==="refs"?this.#l():this.#at(i)});let s=e.querySelector(".scroller");s.addEventListener("scroll",()=>{this.#i(),this.#t.hasMore&&!this.#M&&s.scrollTop+s.clientHeight>s.scrollHeight-this.#a*4&&this.#y(!0)}),s.addEventListener("keydown",a=>this.#ht(a)),this.#i()}#C(){let e=this.#e.querySelector(".shell");if(!e||!e.querySelector(".toolbar"))return;e.querySelector(".repository-name").textContent=this.#t.repositoryName??this.#t.repositoryId??"data provider";let t=this.#h;e.querySelector(".ref-select-label").textContent=t.length===0?"Show All":t.length===1?P0(t[0]):`${t.length} selected`,this.#K()}#W(){let e=this.#e.querySelector(".shell");if(!e)return;let t=this.getAttribute("columns"),n=t===null?void 0:new Set(t.split(",").map(i=>i.trim().toLowerCase()).filter(Boolean));for(let i of["date","author","commit"])e.toggleAttribute(`data-hide-${i}`,n!==void 0&&!n.has(i))}#q(e,t){this.#l();let n=this.#e.querySelector(".shell"),i=document.createElement("div");i.className="menu",i.dataset.menu=e,i.setAttribute("role","menu"),n.append(i),this.#D=i;let s=l=>{let c=l.composedPath();!c.includes(i)&&!(t&&c.includes(t))&&this.#l()},a=l=>{l.key==="Escape"&&(l.stopPropagation(),this.#l())},r=()=>this.#l(),o=this.#e.querySelector(".scroller");return document.addEventListener("pointerdown",s,!0),document.addEventListener("keydown",a,!0),o?.addEventListener("scroll",r),window.addEventListener("resize",r),this.#L=()=>{document.removeEventListener("pointerdown",s,!0),document.removeEventListener("keydown",a,!0),o?.removeEventListener("scroll",r),window.removeEventListener("resize",r),i.remove()},t?.setAttribute("aria-expanded","true"),i}#l(){let e=this.#L;this.#D=void 0,this.#L=void 0,this.#U=void 0,this.#T=void 0,e?.(),this.#Y(),this.#e.querySelector(".ref-select")?.setAttribute("aria-expanded","false")}#Y(){for(let e of this.#e.querySelectorAll(".row"))e.classList.toggle("context-active",e.dataset.oid===this.#T)}#Z(e,t,n){e.style.left="0px",e.style.top="0px";let i=this.getBoundingClientRect(),s=e.getBoundingClientRect();e.style.left=`${Math.min(Math.max(4,t),Math.max(4,i.width-s.width-4))}px`,e.style.top=`${Math.min(Math.max(4,n),Math.max(4,i.height-s.height-4))}px`}#_(e,t){let n=document.createElement("button");if(n.className="menu-item",n.type="button",n.setAttribute("role","menuitem"),n.disabled=t.enabled===!1,t.checked!==void 0){let s=document.createElement("span");s.className="menu-check",s.textContent=t.checked?"\u2713":"",n.append(s)}let i=document.createElement("span");return i.className="menu-label",i.textContent=e,n.append(i),n.addEventListener("click",t.onSelect),n}#at(e){let t=this.#q("refs",e),n=[["Local Branches","head"],["Remote Branches","remote"],["Tags","tag"]],i=new Map,s=()=>new Set(this.#h),a=this.#_("Show All",{checked:this.#h.length===0,onSelect:()=>this.#B([])});t.append(a);let r=document.createElement("div");r.className="menu-scroll";let o=0;for(let[h,d]of n){let u=this.#t.refs.filter(m=>m.kind===d&&(d!=="remote"||this.#A));if(u.length===0)continue;let p=document.createElement("div");p.className="menu-group",p.textContent=h,r.append(p);for(let m of u){let S=this.#_(P0(m.name),{checked:this.#h.includes(m.name),onSelect:()=>this.#rt(m.name)});i.set(m.name,S.querySelector(".menu-check")),r.append(S),o+=1}}o>0&&t.append(Object.assign(document.createElement("div"),{className:"menu-separator"}),r),this.#U=()=>{let h=s();a.querySelector(".menu-check").textContent=h.size===0?"\u2713":"";for(let[d,u]of i)u.textContent=h.has(d)?"\u2713":""};let l=e.getBoundingClientRect(),c=this.getBoundingClientRect();this.#Z(t,l.left-c.left,l.bottom-c.top+2)}#rt(e){let t=new Set(this.#h);t.has(e)?t.delete(e):t.add(e),this.#B([...t])}#B(e){this.#h=e,this.#C(),this.#U?.(),this.#s&&this.#y(!1)}#ot(e,t,n){if(!this.dispatchEvent(new CustomEvent("gitgraph-context-menu",{bubbles:!0,composed:!0,cancelable:!0,detail:{commit:e,clientX:t,clientY:n}})))return;let s=this.#q("commit");this.#T=e.oid,this.#Y();let a=e.message.split(`
`,1)[0]??"";if(s.append(this.#_("Copy Commit Hash",{enabled:e.kind!=="working-tree",onSelect:()=>{this.#l(),this.#z(e.oid)}}),this.#_("Copy Commit Subject",{enabled:a.length>0,onSelect:()=>{this.#l(),this.#z(a)}}),this.#_("Compare with Selected Commit",{enabled:!!(this.#n&&this.#n!==e.oid&&this.#s?.compare),onSelect:()=>{let o=this.#n;this.#l(),o&&this.compareCommits(o,e.oid)}})),e.url){let o=e.url;s.append(this.#_("Open in Remote \u2197",{onSelect:()=>{this.#l(),window.open(o,"_blank","noopener,noreferrer")}}))}let r=this.getBoundingClientRect();this.#Z(s,t-r.left,n-r.top)}async#z(e){try{await navigator.clipboard.writeText(e)}catch{let t=document.createElement("textarea");t.value=e,t.setAttribute("aria-hidden","true"),t.style.position="fixed",t.style.opacity="0",document.body.append(t),t.select(),document.execCommand("copy"),t.remove()}}#lt(e){let t=e.author?.email?.trim().toLowerCase()??"",n=document.createElement("span");n.className="avatar",n.setAttribute("aria-hidden","true");let i=document.createElement("span");i.textContent=(e.author?.name??"?").trim().slice(0,1).toUpperCase()||"?",n.append(i),t&&n.style.setProperty("--avatar-color",$C(t));let s=e.author?.avatarUrl??(t?B0.get(t):void 0);if(s){let a=document.createElement("img");a.src=s,a.alt="",a.loading="lazy",a.decoding="async",a.addEventListener("error",()=>a.remove()),n.append(a)}return n}async#j(){if(!this.avatars)return;let e=new Set;for(let t of this.#t.commits){let n=t.author?.email?.trim().toLowerCase();n&&!t.author?.avatarUrl&&!B0.has(n)&&!z0.has(n)&&e.add(n)}if(e.size!==0){for(let t of e)z0.add(t);await Promise.all([...e].map(async t=>{let n=await tR(t).catch(()=>{});n&&B0.set(t,n),z0.delete(t)})),this.#i()}}#F(e){let t=this.#S.trim().toLocaleLowerCase();if(!t){this.#u=[],this.#d=-1;return}let n=[];this.#t.commits.forEach((i,s)=>{let a=`${i.author?.name??""} ${i.author?.email??""}`;`${i.oid} ${i.message} ${a}`.toLocaleLowerCase().includes(t)&&n.push(s)}),this.#u=n,this.#d=n.length===0?-1:e?0:Math.min(Math.max(this.#d,0),n.length-1)}#K(){let e=this.#e.querySelector(".search-count");if(!e)return;let t=this.#S.trim().length>0;e.hidden=!t,e.textContent=t?`${this.#d+1}/${this.#u.length}`:"";let n=this.#u.length===0;this.#e.querySelector(".search-prev").disabled=n,this.#e.querySelector(".search-next").disabled=n}#G(e){this.#u.length!==0&&(this.#d=(this.#d+e+this.#u.length)%this.#u.length,this.#K(),this.#i(),this.#J())}#J(){let e=this.#u[this.#d];if(e===void 0)return;let t=this.#e.querySelector(".scroller");if(!t)return;let n=this.#v(e,this.#R());(n<t.scrollTop||n+this.#a>t.scrollTop+t.clientHeight)&&t.scrollTo({top:Math.max(0,n-t.clientHeight/2)})}#i(){let e=this.#e.querySelector(".scroller"),t=this.#e.querySelector(".spacer"),n=this.#e.querySelector(".window");if(!e||!t||!n)return;if(this.#t.commits.length===0&&(this.#w=void 0,this.#b=void 0),this.#I&&this.#t.commits.length===0){t.style.height="100%",n.innerHTML=`
        <div class="loading-view">
          <div class="pending pending-rows" aria-hidden="true">${KC.map(E=>`<div class="pending-row"><span class="pending-dot"></span><span class="pending-bar" style="width:${E}%"></span></div>`).join("")}</div>
          <p class="pending-label"><slot name="loading">Reading the commit DAG\u2026</slot></p>
        </div>`;return}if(this.#E&&this.#t.commits.length===0){t.style.height="100%",n.innerHTML='<div class="error"><slot name="error"></slot></div>';let E=n.querySelector("slot");E&&(E.textContent=this.#E);return}if(this.#t.commits.length===0){t.style.height="100%",n.innerHTML='<div class="empty"><slot name="empty">No commits match this view.</slot></div>';return}let i=Math.max(56,this.#x.laneCount*16+24);this.#e.querySelector(".shell")?.style.setProperty("--wgg-graph-width",`${i}px`);let s=this.#R(),a=s>=0?this.#P:0,r=(s+1)*this.#a,o=this.#t.commits.length*this.#a+a;t.style.height=`${o+(this.#t.hasMore?42:0)}px`;let l=Math.ceil(Math.max(e.clientHeight,420)/this.#a),c=E=>s<0||E<r?Math.floor(E/this.#a):E<r+a?s:Math.floor((E-a)/this.#a),h=Math.max(0,c(e.scrollTop)-this.#V),d=Math.min(this.#t.commits.length,Math.max(h+l,c(e.scrollTop+e.clientHeight)+1)+this.#V);n.style.transform="";let u=this.#w;for(let E of[...n.children])E!==u&&E.remove();let p=this.#v(h,s),m=Math.max(this.#a,this.#v(d,s)-p),S=G0("svg",{class:"graph",width:`${i}`,height:`${m}`,"aria-hidden":"true"});S.style.top=`${p}px`,this.#ct(S,h,d,s),n.append(S);let g=new Map;for(let E of this.#t.refs){if(!this.#A&&E.kind==="remote")continue;let w=g.get(E.target)??[];w.push(E),g.set(E.target,w)}let f=new Map(this.#x.nodes.map(E=>[E.oid,E])),v=new Set(this.#u),b=this.#d>=0?this.#u[this.#d]:-1,y=this.avatars,T=this.dateFormat;for(let E=h;E<d;E+=1){let w=this.#t.commits[E],_=document.createElement("div");_.className="row",_.classList.toggle("merge",w.parents.length>1),_.classList.toggle("working-tree",w.kind==="working-tree"),_.classList.toggle("match",v.has(E)),_.classList.toggle("match-current",E===b),_.classList.toggle("context-active",w.oid===this.#T),w.oid===this.#n&&_.classList.add("selected"),w.oid===this.#f&&_.classList.add("compare"),_.dataset.oid=w.oid,_.dataset.index=String(E),_.setAttribute("role","row"),_.tabIndex=w.oid===this.#n||!this.#n&&E===0?0:-1,_.style.top=`${this.#v(E,s)}px`,_.innerHTML=`
        <div class="graph-cell" role="gridcell"></div>
        <div class="subject" role="gridcell"><div class="refs"></div><span class="message"></span></div>
        <div class="date" role="gridcell"></div>
        <div class="author" role="gridcell"></div>
        <div class="oid" role="gridcell"></div>`,_.querySelector(".message").textContent=w.message.split(`
`,1)[0]??"";let A=_.querySelector(".author");y&&w.kind!=="working-tree"&&A.append(this.#lt(w));let R=document.createElement("span");R.className="author-name",R.textContent=w.author?.name??"\u2014",A.append(R),_.querySelector(".date").textContent=XM(this.#nt(w),T),_.querySelector(".oid").textContent=O0(w.oid);let O=_.querySelector(".refs"),F=new Set;for(let z of g.get(w.oid)??[]){let I=P0(z.name),X=z.kind==="current"||z.kind==="head"?`branch:${I}`:`${z.kind}:${I}`;if(F.has(X))continue;F.add(X);let Y=document.createElement("span");Y.className=`ref ${z.kind}`;let j=z.kind==="tag"?"\u25C7":z.kind==="stash"?"\u224B":z.kind==="remote"?"\u2197":"\u2442";Y.textContent=`${j} ${I}`,Y.title=I;let at=f.get(w.oid);if(at&&jC.has(z.kind)&&Y.style.setProperty("--ref-color",Vo[at.colour%Vo.length]),O.append(Y),F.size>=4)break}_.addEventListener("click",z=>{z.button!==0||kM&&z.ctrlKey||((z.metaKey||z.ctrlKey)&&this.#n&&this.#n!==w.oid?this.compareCommits(this.#n,w.oid):w.oid===this.#n&&!this.#f?this.#H():this.selectCommit(w.oid))}),_.addEventListener("mousedown",z=>{z.button===2&&z.preventDefault()}),_.addEventListener("contextmenu",z=>{z.preventDefault(),z.stopPropagation(),this.#ot(w,z.clientX,z.clientY)}),_.addEventListener("dblclick",()=>{w.url&&window.open(w.url,"_blank","noopener,noreferrer"),this.dispatchEvent(new CustomEvent("gitgraph-commit-open",{bubbles:!0,composed:!0,detail:{commit:w}}))}),n.append(_)}if(s>=0){let E=u??document.createElement("aside");E.className="inline-details",E.setAttribute("aria-label",this.#f?"Commit comparison":"Commit details"),E.style.top=`${r}px`,E.style.height=`${a}px`,E.parentNode!==n&&n.append(E),this.#w=E}else u?.remove(),this.#w=void 0,this.#b=void 0;if(this.#t.hasMore&&d===this.#t.commits.length){let E=document.createElement("button");E.className="action load-more",E.type="button",E.style.top=`${o}px`,E.textContent=this.#M?"Loading\u2026":"Load more commits",E.disabled=this.#M,E.addEventListener("click",()=>{let w=new CustomEvent("gitgraph-load-more",{bubbles:!0,composed:!0,cancelable:!0,detail:{cursor:this.#t.cursor}});this.dispatchEvent(w)&&this.#s&&this.#y(!0)}),n.append(E)}this.#c()}#ct(e,t,n,i){let s=r=>16+r*16,a=r=>this.#v(r,i)-this.#v(t,i)+this.#a*.5;for(let r of this.#x.segments){if(r.to.row<t||r.from.row>=n)continue;let o=Math.max(t,r.from.row),l=Math.min(n,r.to.row),c=s(r.from.lane),h=s(r.to.lane),d=a(o),u=a(l),p=r.anchor==="from";e.append(G0("path",{d:this.#ut(c,h,d,u,p),stroke:Vo[r.colour%Vo.length],...r.dangling?{"stroke-dasharray":"3 4"}:{}}))}for(let r of this.#x.nodes){if(r.row<t||r.row>=n)continue;let o=r.kind==="working-tree"?"var(--wgg-faint)":Vo[r.colour%Vo.length];e.append(G0("circle",{cx:`${s(r.lane)}`,cy:`${a(r.row)}`,r:r.kind==="working-tree"?"4.5":r.kind==="stash"?"4":"3.5",fill:r.oid===this.#t.head||r.kind==="working-tree"?"var(--wgg-bg)":o,stroke:o}))}}#ut(e,t,n,i,s){if(e===t)return`M ${e} ${n} L ${t} ${i}`;let a=this.#a*.55;if(i-n<=this.#a)return`M ${e} ${n} C ${e} ${n+a}, ${t} ${i-a}, ${t} ${i}`;if(s){let o=n+this.#a;return`M ${e} ${n} C ${e} ${n+a}, ${t} ${o-a}, ${t} ${o} L ${t} ${i}`}let r=i-this.#a;return`M ${e} ${n} L ${e} ${r} C ${e} ${r+a}, ${t} ${i-a}, ${t} ${i}`}#ht(e){let t=[...this.#e.querySelectorAll(".row")],n=this.#e.activeElement,i=t.indexOf(n),s=i;if(e.key==="ArrowDown")s=Math.min(t.length-1,Math.max(0,i+1));else if(e.key==="ArrowUp")s=Math.max(0,i-1);else if(e.key==="Home")s=0;else if(e.key==="End")s=t.length-1;else if(e.key==="Enter"&&n?.dataset.oid){this.selectCommit(n.dataset.oid);return}else if(e.key==="Escape"){this.#H();return}else return;e.preventDefault(),t[s]?.focus()}async#Q(e){if(!this.#s?.getCommitDetails){this.#g=!1,this.#r={commit:e,refs:this.#t.refs.filter(n=>n.target===e.oid),changes:[]},this.#c();return}this.#r?.commit.oid===e.oid||(this.#r=void 0,this.#g=!0,this.#c());try{let n=await this.#s.getCommitDetails(this.#t.repositoryId,vd(e));if(this.#n!==e.oid)return;this.#r=n}catch(n){if(this.#n!==e.oid)return;this.#N(n)}this.#g=!1,this.#c()}#c(e=!1){let t=e||this.#g,n=this.#e.querySelector(".inline-details");if(!n||!this.#n)return;let i=JSON.stringify([this.#n,this.#f,t,this.#r?.commit.oid,this.#r?.changes.length,!!this.#p,this.#o?.path,this.#o?.patch?.length,[...this.#m].sort()]);if(i===this.#b&&n.firstChild)return;this.#b=i,n.innerHTML=`
      <button class="details-close" type="button" aria-label="Close details">\xD7</button>
      <div class="details-summary"></div>
      <div class="details-files"></div>`,n.querySelector(".details-close")?.addEventListener("click",()=>this.#H());let s=n.querySelector(".details-summary"),a=n.querySelector(".details-files");if(this.#f){if(t||!this.#p){s.innerHTML='<p class="pending-label">Calculating tree difference\u2026</p>',s.append(yd(gd.slice(0,3))),a.append(yd(gd));return}this.#dt(s,a,this.#p);return}let r=this.#r?.commit??this.#t.commits.find(m=>m.oid===this.#n);if(!r){s.innerHTML='<p class="pending-label">Reading commit object\u2026</p>',s.append(yd(gd.slice(0,3)));return}let o=document.createElement("dl");o.className="meta";let l=[["Commit",r.kind==="working-tree"?"uncommitted changes":r.oid,!0],["Parents",r.parents.map(O0).join(", ")||"root commit",!0],["Author",`${r.author?.name??"Unknown"}${r.author?.email?` <${r.author.email}>`:""}`],["Date",XM(this.#nt(r))]];for(let[m,S,g]of l){let f=document.createElement("dt"),v=document.createElement("dd");f.textContent=m,v.textContent=S,g&&(v.className="oid-value"),o.append(f,v)}s.append(o);let c=document.createElement("p");c.className="commit-body",c.textContent=(this.#r?.body??r.message).trim(),s.append(c);let h=document.createElement("div");if(h.className="actions",h.innerHTML='<button class="action primary copy" type="button">Copy SHA</button>',h.querySelector(".copy")?.addEventListener("click",()=>void this.#z(r.oid)),this.#s?.compare){let m=document.createElement("button");m.className="action compare-action",m.type="button",m.textContent="Compare with\u2026",m.addEventListener("click",()=>{m.textContent=kM?"Cmd-click another commit":"Ctrl-click another commit",m.disabled=!0,this.#e.querySelector(".scroller")?.focus()}),h.append(m)}if(r.url){let m=document.createElement("button");m.className="action",m.textContent="Open remote \u2197",m.addEventListener("click",()=>window.open(r.url,"_blank","noopener,noreferrer")),h.append(m)}if(s.append(h),t){a.append(yd(gd));return}let d=this.#r?.changes??[],u=r.parents[0],p=u&&this.#s?.getFileDiff?{base:{kind:"commit",oid:u},head:vd(r)}:void 0;if(this.#o)s.append(this.#$());else if(p&&d.length>0){let m=document.createElement("p");m.className="no-changes",m.textContent="Select a file to view its diff.",s.append(m)}this.#tt(a,d,p)}#$(){let e=document.createElement("pre");return e.className="patch",e.textContent=this.#o?.patch??this.#o?.unavailableReason??(this.#o?.binary?"Binary file \u2014 patch unavailable.":"No textual patch."),e}#dt(e,t,n){let i=document.createElement("h2");i.className="details-heading",i.textContent=`${this.#it(n.base)} \u2192 ${this.#it(n.head)}`,e.append(i);let s=document.createElement("p");if(s.className="stats",s.textContent=`${n.changes.length} files \xB7 +${n.additions} \u2212${n.deletions}${n.truncated?" \xB7 truncated":""}`,e.append(s),this.#o)e.append(this.#$());else if(n.changes.length>0){let a=document.createElement("p");a.className="no-changes",a.textContent="Select a file to view its diff.",e.append(a)}this.#tt(t,n.changes,{base:n.base,head:n.head,comparison:n})}#tt(e,t,n){if(t.length===0){e.innerHTML='<p class="no-changes">No file changes.</p>';return}let i=document.createElement("ul");i.className="tree",this.#et(i,eR(t),"",n),e.append(i)}#et(e,t,n,i){for(let[s,a]of[...t.dirs.entries()].sort((r,o)=>r[0].localeCompare(o[0]))){for(;a.files.length===0&&a.dirs.size===1;){let[u]=a.dirs;s=`${s}/${u[0]}`,a=u[1]}let r=n?`${n}/${s}`:s,o=this.#m.has(r),l=document.createElement("li"),c=document.createElement("button");c.className="tree-dir",c.type="button",c.setAttribute("aria-expanded",String(!o));let h=document.createElement("span");h.className="twistie",h.textContent=o?"\u25B8":"\u25BE";let d=document.createElement("span");if(d.className="dir-name",d.textContent=s,c.append(h,d),c.addEventListener("click",()=>{o?this.#m.delete(r):this.#m.add(r),this.#c()}),l.append(c),!o){let u=document.createElement("ul");this.#et(u,a,r,i),l.append(u)}e.append(l)}for(let s of[...t.files].sort((a,r)=>a.path.localeCompare(r.path))){let a=document.createElement("li"),r=document.createElement("button");r.className="tree-file",r.type="button",this.#o?.path===s.path&&r.classList.add("active"),r.title=s.previousPath?`${s.previousPath} \u2192 ${s.path}`:s.path;let o=document.createElement("span");o.className=`change-code ${s.kind}`,o.textContent=s.kind.slice(0,1).toUpperCase();let l=document.createElement("span");l.className="change-path",l.textContent=s.previousPath?`${F0(s.previousPath)} \u2192 ${F0(s.path)}`:F0(s.path);let c=document.createElement("span");c.className="stats",c.textContent=s.binary?"binary":`${s.additions===void 0?"":`+${s.additions}`} ${s.deletions===void 0?"":`\u2212${s.deletions}`}`.trim(),r.append(o,l,c),r.addEventListener("click",async()=>{if(!(!this.dispatchEvent(new CustomEvent("gitgraph-file-open",{bubbles:!0,composed:!0,cancelable:!0,detail:{change:s,base:i?.base,head:i?.head,comparison:i?.comparison}}))||!i||!this.#s?.getFileDiff)){if(s.unavailableReason){this.#o={base:i.base,head:i.head,path:s.path,unavailableReason:s.unavailableReason},this.#c();return}try{this.#o=await this.#s.getFileDiff(this.#t.repositoryId,i.base,i.head,s.path,3)}catch(d){this.#N(d)}this.#c()}}),a.append(r),e.append(a)}}#nt(e){return this.dateType==="authored"?e.authoredAt??e.committedAt:e.committedAt??e.authoredAt}#it(e){return e.kind==="working-tree"?"working tree":O0(e.oid)}#H(){this.#n=void 0,this.#f=void 0,this.#r=void 0,this.#g=!1,this.#p=void 0,this.#o=void 0,this.#m.clear(),this.#b=void 0,this.#i(),this.#c()}#R(){return this.#n?this.#t.commits.findIndex(e=>e.oid===this.#n):-1}#v(e,t){return e*this.#a+(t>=0&&e>t?this.#P:0)}#ft(e){if(this.#n!==e)return;let t=this.#R(),n=this.#e.querySelector(".scroller");if(t<0||!n)return;let i=t*this.#a,s=i+this.#a+this.#P,a=n.scrollTop;s>a+n.clientHeight&&(a=s-n.clientHeight),i<a&&(a=i),a!==n.scrollTop&&n.scrollTo({top:a,behavior:"smooth"})}async#y(e,t=!1){if(!this.#s||e&&!this.#t.hasMore)return;this.#O?.abort();let n=new AbortController;this.#O=n;let i=t?{scrollTop:this.#e.querySelector(".scroller")?.scrollTop??0,selectedOid:this.#n,details:this.#r}:void 0;this.#I=!e&&!t,this.#M=e,this.#E=void 0,this.setAttribute("aria-busy","true"),this.#i();try{let s=await this.#s.getHistory({repositoryId:this.#t.repositoryId,refs:this.#h.length?this.#h:void 0,cursor:e?this.#t.cursor:void 0,limit:200,includeWorkingTree:!0,signal:n.signal});e?this.appendPage(s):(this.setData(s),i&&this.#pt(i))}catch(s){if(n.signal.aborted)return;this.#N(s)}finally{this.#I=!1,this.#M=!1,this.#O===n&&this.setAttribute("aria-busy","false"),this.#i()}}#pt(e){let t=e.selectedOid?this.#t.commits.find(i=>i.oid===e.selectedOid):void 0;t&&(this.#n=t.oid,e.details?.commit.oid===t.oid&&(this.#r=e.details),this.#Q(t)),this.#i();let n=this.#e.querySelector(".scroller");n&&e.scrollTop!==n.scrollTop&&(n.scrollTop=e.scrollTop,this.#i())}#N(e){this.#E=e instanceof Error?e.message:String(e),this.dispatchEvent(new CustomEvent("gitgraph-error",{bubbles:!0,composed:!0,detail:{error:e}})),this.#i()}};function qM(e=ZC){return typeof customElements<"u"&&!customElements.get(e)&&customElements.define(e,WM),WM}var H0=["callers","entrypoints","callees","tests"],iR={callers:96,entrypoints:382,callees:668,tests:382};function xd(e,t={}){let n=Math.max(820,Number(t.width)||980),i=Math.max(480,Number(t.height)||620),s=new Map,a=[...e.nodes||[]].sort((o,l)=>YM(o.lane)-YM(l.lane)||String(o.path).localeCompare(String(l.path))||Number(o.span?.start||0)-Number(l.span?.start||0)||pi(o).localeCompare(pi(l))).map(o=>{let l=H0.includes(o.lane)?o.lane:"entrypoints",c=s.get(l)||0;s.set(l,c+1);let h=l==="tests"?448+c*92:152+c*92,d=t.pins?.[pi(o)];return{...o,lane:l,x:d?.x??iR[l],y:d?.y??h,pinned:!!d,width:216,height:64}}),r=aR(a);return{width:n,height:Math.max(i,rR(a)),nodes:a,containers:r}}function ZM(e,t={}){let n=Math.max(980,Number(t.width)||1180),i=Math.max(620,Number(t.height)||760),s=[...e.nodes||[]].sort((S,g)=>String(S.community).localeCompare(String(g.community))||Number(g.degree||0)-Number(S.degree||0)||pi(S).localeCompare(pi(g))),a=[...e.communities||[]].map(S=>({...S,members:s.filter(g=>g.community===S.id)})).filter(S=>S.members.length).sort((S,g)=>g.members.length-S.members.length||S.id.localeCompare(g.id)),r=n/2,o=i/2,l=Math.max(96,Math.min(n,i)*.27),c=new Map;a.forEach((S,g)=>{if(a.length===1){c.set(S.id,{x:r,y:o});return}let f=Math.sqrt((g+.7)/Math.max(1,a.length)),v=g*2.399963229728653-Math.PI/2;c.set(S.id,{x:r+Math.cos(v)*l*f,y:o+Math.sin(v)*l*f})});let h=[],d=["#58d6c7","#7aa7ff","#b999ff","#f0a36b","#e27fa8","#80d68a","#73c7ff","#d9bd6d"];for(let S of a){let g=c.get(S.id),f=S.members;f.forEach((v,b)=>{let y=Math.max(5,Math.min(17,5+Math.log2(Number(v.degree||0)+1)*1.9)),T=t.pins?.[pi(v)],E=jM(pi(v)),w=f.length===1?0:24+Math.sqrt(b+1)*27;h.push({...v,x:T?.x??g.x+Math.cos(E)*w,y:T?.y??g.y+Math.sin(E)*w,vx:0,vy:0,radius:y,color:d[Math.max(0,a.findIndex(_=>_.id===S.id))%d.length],pinned:!!T})})}sR(h,e.edges||[],c,n,i,t.pins||{});let u=a.map(S=>{let g=h.filter(y=>y.community===S.id),f=g.reduce((y,T)=>y+T.x,0)/Math.max(1,g.length),v=g.reduce((y,T)=>y+T.y,0)/Math.max(1,g.length),b=Math.max(38,...g.map(y=>Math.hypot(y.x-f,y.y-v)+y.radius+22));return{...S,x:f,y:v,radius:b}}),p=[...h].sort((S,g)=>Number(g.degree||0)-Number(S.degree||0)),m=new Set(p.slice(0,Math.min(24,p.length)).map(pi));return{width:n,height:i,communities:u,nodes:h.map(({vx:S,vy:g,...f})=>({...f,showLabel:m.has(pi(f))}))}}function sR(e,t,n,i,s,a){if(e.length<2)return;let r=new Map(e.map((c,h)=>[pi(c),h])),o=t.map(c=>({source:r.get(String(c.source)),target:r.get(String(c.target)),weight:Math.max(1,Number(c.weight||1))})).filter(c=>c.source!==void 0&&c.target!==void 0&&c.source!==c.target),l=32;for(let c=0;c<180;c+=1){let h=1-c/180;for(let d=0;d<e.length;d+=1){let u=e[d];for(let p=d+1;p<e.length;p+=1){let m=e[p],S=m.x-u.x,g=m.y-u.y,f=S*S+g*g;if(f<.01){let w=jM(`${pi(u)}:${pi(m)}`);S=Math.cos(w)*.1,g=Math.sin(w)*.1,f=.01}let v=Math.sqrt(f),b=(u.community===m.community?980:1420)*h/f,y=S/v*b,T=g/v*b;u.vx-=y,u.vy-=T,m.vx+=y,m.vy+=T;let E=u.radius+m.radius+10;if(v<E){let w=(E-v)*.08*h,_=S/v*w,A=g/v*w;u.vx-=_,u.vy-=A,m.vx+=_,m.vy+=A}}}for(let d of o){let u=e[d.source],p=e[d.target],m=p.x-u.x,S=p.y-u.y,g=Math.max(1,Math.hypot(m,S)),f=u.community===p.community?76:132,v=Math.min(.09,.018+Math.log2(d.weight+1)*.009)*h,b=(g-f)*v,y=m/g*b,T=S/g*b;u.vx+=y,u.vy+=T,p.vx-=y,p.vy-=T}for(let d of e){let u=a[pi(d)];if(u){d.x=u.x,d.y=u.y,d.vx=0,d.vy=0;continue}let p=n.get(d.community)||{x:i/2,y:s/2};d.vx+=(p.x-d.x)*.0048*h,d.vy+=(p.y-d.y)*.0048*h,d.vx+=(i/2-d.x)*55e-5*h,d.vy+=(s/2-d.y)*55e-5*h,d.vx*=.78,d.vy*=.78,d.x=Math.max(l,Math.min(i-l,d.x+d.vx)),d.y=Math.max(l,Math.min(s-l,d.y+d.vy))}}}function jM(e){let t=2166136261;for(let n of String(e))t^=n.charCodeAt(0),t=Math.imul(t,16777619);return(t>>>0)/4294967296*Math.PI*2}function KM(e){return e.status==="remove"?{className:"edge edge--remove",marker:"\xD7",dash:"6 6"}:e.status==="hypothetical"?{className:"edge edge--hypothetical",marker:"+",dash:"3 7"}:e.status==="gap"||e.confidence==="UNKNOWN"?{className:"edge edge--gap",marker:"?",dash:"9 7"}:e.status==="preserved"?{className:"edge edge--preserved",marker:"=",dash:""}:{className:"edge edge--proven",marker:"\u2713",dash:""}}function YM(e){let t=H0.indexOf(e);return t===-1?H0.length:t}function aR(e){let t=new Map;for(let n of e){let i=t.get(n.path)||[];i.push(n),t.set(n.path,i)}return[...t.entries()].sort(([n],[i])=>n.localeCompare(i)).map(([n,i])=>{let s=Math.min(...i.map(l=>l.x)),a=Math.max(...i.map(l=>l.x+l.width)),r=Math.min(...i.map(l=>l.y)),o=Math.max(...i.map(l=>l.y+l.height));return{id:`file:${n}`,path:n,x:s-18,y:r-32,width:a-s+36,height:o-r+50}})}function rR(e){return Math.max(480,...e.map(t=>t.y+t.height+48))}function pi(e){return String(e.node_id??e.id??"")}function oR(e){return{commits:e.commits??[],refs:e.refs??[],head:e.head,hasMore:!!e.hasMore,repositoryId:e.repositoryId,repositoryName:e.repositoryName}}var Sd=class{api;constructor(t){this.api=t}async getCapabilities(){return{protocolVersion:"1",history:!0,details:!0,compare:!1,diff:!0,workingTree:!1,stashes:!1,maxPageSize:200,maxDiffBytes:256*1024}}async getHistory(t={}){let n=new URLSearchParams;n.set("limit",String(Math.min(200,Math.max(1,t.limit??200)))),t.cursor&&n.set("cursor",t.cursor);for(let s of t.refs??[])n.append("ref",s);let i=await this.api(`/api/git-history?${n}`,t.signal);return oR(i)}async getCommitDetails(t,n,i){let s=V0(n);return await this.api(`/api/git-commit?oid=${encodeURIComponent(s)}`,i)}async getFileDiff(t,n,i,s,a=3,r){let o=new URLSearchParams({base:V0(n),head:V0(i),path:s,context:String(a)});return await this.api(`/api/git-diff?${o}`,r)}};function V0(e){if(e.kind!=="commit")throw new Error("CGRX Git history supports commit revisions only");return e.oid}var ja={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Ka={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},T1=0,yv=1,w1=2;var du=1,A1=2,yl=3,Ja=0,qn=1,Es=2,Ts=0,xl=1,fu=2,xv=3,Sv=4,C1=5;var Or=100,R1=101,N1=102,D1=103,L1=104,U1=200,I1=201,O1=202,P1=203,bv=204,Mv=205,B1=206,z1=207,F1=208,G1=209,H1=210,V1=211,k1=212,X1=213,W1=214,Kd=0,Jd=1,Qd=2,ol=3,$d=4,tf=5,ef=6,nf=7,Ev=0,q1=1,Y1=2,Ki=0,Tv=1,wv=2,Av=3,Cv=4,Rv=5,Nv=6,Dv=7;var Lv=300,Qa=301,Pr=302,Nf=303,Df=304,pu=306,sf=1e3,ys=1001,af=1002,fn=1003,Z1=1004;var mu=1005;var Mn=1006,Lf=1007;var $a=1008;var Si=1009,Uv=1010,Iv=1011,Sl=1012,Uf=1013,Ji=1014,Qi=1015,$i=1016,If=1017,Of=1018,bl=1020,Ov=35902,Pv=35899,Bv=1021,zv=1022,Pi=1023,xs=1026,tr=1027,Fv=1028,Pf=1029,er=1030,Bf=1031;var zf=1033,gu=33776,vu=33777,_u=33778,yu=33779,Ff=35840,Gf=35841,Hf=35842,Vf=35843,kf=36196,Xf=37492,Wf=37496,qf=37488,Yf=37489,xu=37490,Zf=37491,jf=37808,Kf=37809,Jf=37810,Qf=37811,$f=37812,tp=37813,ep=37814,np=37815,ip=37816,sp=37817,ap=37818,rp=37819,op=37820,lp=37821,cp=36492,up=36494,hp=36495,dp=36283,fp=36284,Su=36285,pp=36286;var Vc=2300,rf=2301,Zd=2302,hv=2303,dv=2400,fv=2401,pv=2402;var j1=3200;var Gv=0,K1=1,na="",bn="srgb",kc="srgb-linear",Xc="linear",me="srgb";var jd=7680;var J1=519,Q1=512,$1=513,tE=514,mp=515,eE=516,nE=517,gp=518,iE=519,Hv=35044;var Vv="300 es",Zi=2e3,Wc=2001;function lR(e){for(let t=e.length-1;t>=0;--t)if(e[t]>=65535)return!0;return!1}function cR(e){return ArrayBuffer.isView(e)&&!(e instanceof DataView)}function qc(e){return document.createElementNS("http://www.w3.org/1999/xhtml",e)}function sE(){let e=qc("canvas");return e.style.display="block",e}var JM={},ll=null;function Yc(...e){let t="THREE."+e.shift();ll?ll("log",t,...e):console.log(t,...e)}function aE(e){let t=e[0];if(typeof t=="string"&&t.startsWith("TSL:")){let n=e[1];n&&n.isStackTrace?e[0]+=" "+n.getLocation():e[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return e}function Ot(...e){e=aE(e);let t="THREE."+e.shift();if(ll)ll("warn",t,...e);else{let n=e[0];n&&n.isStackTrace?console.warn(n.getError(t)):console.warn(t,...e)}}function Pt(...e){e=aE(e);let t="THREE."+e.shift();if(ll)ll("error",t,...e);else{let n=e[0];n&&n.isStackTrace?console.error(n.getError(t)):console.error(t,...e)}}function Lr(...e){let t=e.join(" ");t in JM||(JM[t]=!0,Ot(...e))}function rE(e,t,n){return new Promise(function(i,s){function a(){switch(e.clientWaitSync(t,e.SYNC_FLUSH_COMMANDS_BIT,0)){case e.WAIT_FAILED:s();break;case e.TIMEOUT_EXPIRED:setTimeout(a,n);break;default:i()}}setTimeout(a,n)})}var oE={[Kd]:Jd,[Qd]:ef,[$d]:nf,[ol]:tf,[Jd]:Kd,[ef]:Qd,[nf]:$d,[tf]:ol},ji=class{addEventListener(t,n){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[t]===void 0&&(i[t]=[]),i[t].indexOf(n)===-1&&i[t].push(n)}hasEventListener(t,n){let i=this._listeners;return i===void 0?!1:i[t]!==void 0&&i[t].indexOf(n)!==-1}removeEventListener(t,n){let i=this._listeners;if(i===void 0)return;let s=i[t];if(s!==void 0){let a=s.indexOf(n);a!==-1&&s.splice(a,1)}}dispatchEvent(t){let n=this._listeners;if(n===void 0)return;let i=n[t.type];if(i!==void 0){t.target=this;let s=i.slice(0);for(let a=0,r=s.length;a<r;a++)s[a].call(this,t);t.target=null}}},Nn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],QM=1234567,Gc=Math.PI/180,cl=180/Math.PI;function $s(){let e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Nn[e&255]+Nn[e>>8&255]+Nn[e>>16&255]+Nn[e>>24&255]+"-"+Nn[t&255]+Nn[t>>8&255]+"-"+Nn[t>>16&15|64]+Nn[t>>24&255]+"-"+Nn[n&63|128]+Nn[n>>8&255]+"-"+Nn[n>>16&255]+Nn[n>>24&255]+Nn[i&255]+Nn[i>>8&255]+Nn[i>>16&255]+Nn[i>>24&255]).toLowerCase()}function jt(e,t,n){return Math.max(t,Math.min(n,e))}function kv(e,t){return(e%t+t)%t}function uR(e,t,n,i,s){return i+(e-t)*(s-i)/(n-t)}function hR(e,t,n){return e!==t?(n-e)/(t-e):0}function Hc(e,t,n){return(1-n)*e+n*t}function dR(e,t,n,i){return Hc(e,t,1-Math.exp(-n*i))}function fR(e,t=1){return t-Math.abs(kv(e,t*2)-t)}function pR(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*(3-2*e))}function mR(e,t,n){return e<=t?0:e>=n?1:(e=(e-t)/(n-t),e*e*e*(e*(e*6-15)+10))}function gR(e,t){return e+Math.floor(Math.random()*(t-e+1))}function vR(e,t){return e+Math.random()*(t-e)}function _R(e){return e*(.5-Math.random())}function yR(e){e!==void 0&&(QM=e);let t=QM+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function xR(e){return e*Gc}function SR(e){return e*cl}function bR(e){return e>0&&Number.isInteger(e)&&2**Math.round(Math.log2(e))===e}function MR(e){return Math.pow(2,Math.ceil(Math.log(e)/Math.LN2))}function ER(e){return Math.pow(2,Math.floor(Math.log(e)/Math.LN2))}function TR(e,t,n,i,s){let a=Math.cos,r=Math.sin,o=a(n/2),l=r(n/2),c=a((t+i)/2),h=r((t+i)/2),d=a((t-i)/2),u=r((t-i)/2),p=a((i-t)/2),m=r((i-t)/2);switch(s){case"XYX":e.set(o*h,l*d,l*u,o*c);break;case"YZY":e.set(l*u,o*h,l*d,o*c);break;case"ZXZ":e.set(l*d,l*u,o*h,o*c);break;case"XZX":e.set(o*h,l*m,l*p,o*c);break;case"YXY":e.set(l*p,o*h,l*m,o*c);break;case"ZYZ":e.set(l*m,l*p,o*h,o*c);break;default:Ot("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Yi(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return e/4294967295;case Uint16Array:return e/65535;case Uint8Array:case Uint8ClampedArray:return e/255;case Int32Array:return Math.max(e/2147483647,-1);case Int16Array:return Math.max(e/32767,-1);case Int8Array:return Math.max(e/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Se(e,t){switch(t.constructor){case Float32Array:return e;case Uint32Array:return Math.round(e*4294967295);case Uint16Array:return Math.round(e*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(e*255);case Int32Array:return Math.round(e*2147483647);case Int16Array:return Math.round(e*32767);case Int8Array:return Math.round(e*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var ws={DEG2RAD:Gc,RAD2DEG:cl,generateUUID:$s,clamp:jt,euclideanModulo:kv,mapLinear:uR,inverseLerp:hR,lerp:Hc,damp:dR,pingpong:fR,smoothstep:pR,smootherstep:mR,randInt:gR,randFloat:vR,randFloatSpread:_R,seededRandom:yR,degToRad:xR,radToDeg:SR,isPowerOfTwo:bR,ceilPowerOfTwo:MR,floorPowerOfTwo:ER,setQuaternionFromProperEuler:TR,normalize:Se,denormalize:Yi},Ut=class e{static{e.prototype.isVector2=!0}constructor(t=0,n=0){this.x=t,this.y=n}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,n){return this.x=t,this.y=n,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let n=this.x,i=this.y,s=t.elements;return this.x=s[0]*n+s[3]*i+s[6],this.y=s[1]*n+s[4]*i+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,n){return this.x=jt(this.x,t.x,n.x),this.y=jt(this.y,t.y,n.y),this}clampScalar(t,n){return this.x=jt(this.x,t,n),this.y=jt(this.y,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(jt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(t)/n;return Math.acos(jt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let n=this.x-t.x,i=this.y-t.y;return n*n+i*i}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this}rotateAround(t,n){let i=Math.cos(n),s=Math.sin(n),a=this.x-t.x,r=this.y-t.y;return this.x=a*i-r*s+t.x,this.y=a*s+r*i+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},_i=class{constructor(t=0,n=0,i=0,s=1){this.isQuaternion=!0,this._x=t,this._y=n,this._z=i,this._w=s}static slerpFlat(t,n,i,s,a,r,o){let l=i[s+0],c=i[s+1],h=i[s+2],d=i[s+3],u=a[r+0],p=a[r+1],m=a[r+2],S=a[r+3];if(d!==S||l!==u||c!==p||h!==m){let g=l*u+c*p+h*m+d*S;g<0&&(u=-u,p=-p,m=-m,S=-S,g=-g);let f=1-o;if(g<.9995){let v=Math.acos(g),b=Math.sin(v);f=Math.sin(f*v)/b,o=Math.sin(o*v)/b,l=l*f+u*o,c=c*f+p*o,h=h*f+m*o,d=d*f+S*o}else{l=l*f+u*o,c=c*f+p*o,h=h*f+m*o,d=d*f+S*o;let v=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=v,c*=v,h*=v,d*=v}}t[n]=l,t[n+1]=c,t[n+2]=h,t[n+3]=d}static multiplyQuaternionsFlat(t,n,i,s,a,r){let o=i[s],l=i[s+1],c=i[s+2],h=i[s+3],d=a[r],u=a[r+1],p=a[r+2],m=a[r+3];return t[n]=o*m+h*d+l*p-c*u,t[n+1]=l*m+h*u+c*d-o*p,t[n+2]=c*m+h*p+o*u-l*d,t[n+3]=h*m-o*d-l*u-c*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,n,i,s){return this._x=t,this._y=n,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,n=!0){let i=t._x,s=t._y,a=t._z,r=t._order,o=Math.cos,l=Math.sin,c=o(i/2),h=o(s/2),d=o(a/2),u=l(i/2),p=l(s/2),m=l(a/2);switch(r){case"XYZ":this._x=u*h*d+c*p*m,this._y=c*p*d-u*h*m,this._z=c*h*m+u*p*d,this._w=c*h*d-u*p*m;break;case"YXZ":this._x=u*h*d+c*p*m,this._y=c*p*d-u*h*m,this._z=c*h*m-u*p*d,this._w=c*h*d+u*p*m;break;case"ZXY":this._x=u*h*d-c*p*m,this._y=c*p*d+u*h*m,this._z=c*h*m+u*p*d,this._w=c*h*d-u*p*m;break;case"ZYX":this._x=u*h*d-c*p*m,this._y=c*p*d+u*h*m,this._z=c*h*m-u*p*d,this._w=c*h*d+u*p*m;break;case"YZX":this._x=u*h*d+c*p*m,this._y=c*p*d+u*h*m,this._z=c*h*m-u*p*d,this._w=c*h*d-u*p*m;break;case"XZY":this._x=u*h*d-c*p*m,this._y=c*p*d-u*h*m,this._z=c*h*m+u*p*d,this._w=c*h*d+u*p*m;break;default:Ot("Quaternion: .setFromEuler() encountered an unknown order: "+r)}return n===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,n){let i=n/2,s=Math.sin(i);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(t){let n=t.elements,i=n[0],s=n[4],a=n[8],r=n[1],o=n[5],l=n[9],c=n[2],h=n[6],d=n[10],u=i+o+d;if(u>0){let p=.5/Math.sqrt(u+1);this._w=.25/p,this._x=(h-l)*p,this._y=(a-c)*p,this._z=(r-s)*p}else if(i>o&&i>d){let p=2*Math.sqrt(1+i-o-d);this._w=(h-l)/p,this._x=.25*p,this._y=(s+r)/p,this._z=(a+c)/p}else if(o>d){let p=2*Math.sqrt(1+o-i-d);this._w=(a-c)/p,this._x=(s+r)/p,this._y=.25*p,this._z=(l+h)/p}else{let p=2*Math.sqrt(1+d-i-o);this._w=(r-s)/p,this._x=(a+c)/p,this._y=(l+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,n){let i=t.dot(n)+1;return i<1e-8?(i=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=i):(this._x=0,this._y=-t.z,this._z=t.y,this._w=i)):(this._x=t.y*n.z-t.z*n.y,this._y=t.z*n.x-t.x*n.z,this._z=t.x*n.y-t.y*n.x,this._w=i),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(jt(this.dot(t),-1,1)))}rotateTowards(t,n){let i=this.angleTo(t);if(i===0)return this;let s=Math.min(1,n/i);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,n){let i=t._x,s=t._y,a=t._z,r=t._w,o=n._x,l=n._y,c=n._z,h=n._w;return this._x=i*h+r*o+s*c-a*l,this._y=s*h+r*l+a*o-i*c,this._z=a*h+r*c+i*l-s*o,this._w=r*h-i*o-s*l-a*c,this._onChangeCallback(),this}slerp(t,n){let i=t._x,s=t._y,a=t._z,r=t._w,o=this.dot(t);o<0&&(i=-i,s=-s,a=-a,r=-r,o=-o);let l=1-n;if(o<.9995){let c=Math.acos(o),h=Math.sin(c);l=Math.sin(l*c)/h,n=Math.sin(n*c)/h,this._x=this._x*l+i*n,this._y=this._y*l+s*n,this._z=this._z*l+a*n,this._w=this._w*l+r*n,this._onChangeCallback()}else this._x=this._x*l+i*n,this._y=this._y*l+s*n,this._z=this._z*l+a*n,this._w=this._w*l+r*n,this.normalize();return this}slerpQuaternions(t,n,i){return this.copy(t).slerp(n,i)}random(){let t=2*Math.PI*Math.random(),n=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),a=Math.sqrt(i);return this.set(s*Math.sin(t),s*Math.cos(t),a*Math.sin(n),a*Math.cos(n))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,n=0){return this._x=t[n],this._y=t[n+1],this._z=t[n+2],this._w=t[n+3],this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._w,t}fromBufferAttribute(t,n){return this._x=t.getX(n),this._y=t.getY(n),this._z=t.getZ(n),this._w=t.getW(n),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},P=class e{static{e.prototype.isVector3=!0}constructor(t=0,n=0,i=0){this.x=t,this.y=n,this.z=i}set(t,n,i){return i===void 0&&(i=this.z),this.x=t,this.y=n,this.z=i,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,n){return this.x=t.x*n.x,this.y=t.y*n.y,this.z=t.z*n.z,this}applyEuler(t){return this.applyQuaternion($M.setFromEuler(t))}applyAxisAngle(t,n){return this.applyQuaternion($M.setFromAxisAngle(t,n))}applyMatrix3(t){let n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[3]*i+a[6]*s,this.y=a[1]*n+a[4]*i+a[7]*s,this.z=a[2]*n+a[5]*i+a[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let n=this.x,i=this.y,s=this.z,a=t.elements,r=1/(a[3]*n+a[7]*i+a[11]*s+a[15]);return this.x=(a[0]*n+a[4]*i+a[8]*s+a[12])*r,this.y=(a[1]*n+a[5]*i+a[9]*s+a[13])*r,this.z=(a[2]*n+a[6]*i+a[10]*s+a[14])*r,this}applyQuaternion(t){let n=this.x,i=this.y,s=this.z,a=t.x,r=t.y,o=t.z,l=t.w,c=2*(r*s-o*i),h=2*(o*n-a*s),d=2*(a*i-r*n);return this.x=n+l*c+r*d-o*h,this.y=i+l*h+o*c-a*d,this.z=s+l*d+a*h-r*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let n=this.x,i=this.y,s=this.z,a=t.elements;return this.x=a[0]*n+a[4]*i+a[8]*s,this.y=a[1]*n+a[5]*i+a[9]*s,this.z=a[2]*n+a[6]*i+a[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,n){return this.x=jt(this.x,t.x,n.x),this.y=jt(this.y,t.y,n.y),this.z=jt(this.z,t.z,n.z),this}clampScalar(t,n){return this.x=jt(this.x,t,n),this.y=jt(this.y,t,n),this.z=jt(this.z,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(jt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,n){let i=t.x,s=t.y,a=t.z,r=n.x,o=n.y,l=n.z;return this.x=s*l-a*o,this.y=a*r-i*l,this.z=i*o-s*r,this}projectOnVector(t){let n=t.lengthSq();if(n===0)return this.set(0,0,0);let i=t.dot(this)/n;return this.copy(t).multiplyScalar(i)}projectOnPlane(t){return k0.copy(this).projectOnVector(t),this.sub(k0)}reflect(t){return this.sub(k0.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let n=Math.sqrt(this.lengthSq()*t.lengthSq());if(n===0)return Math.PI/2;let i=this.dot(t)/n;return Math.acos(jt(i,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let n=this.x-t.x,i=this.y-t.y,s=this.z-t.z;return n*n+i*i+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,n,i){let s=Math.sin(n)*t;return this.x=s*Math.sin(i),this.y=Math.cos(n)*t,this.z=s*Math.cos(i),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,n,i){return this.x=t*Math.sin(n),this.y=i,this.z=t*Math.cos(n),this}setFromMatrixPosition(t){let n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this}setFromMatrixScale(t){let n=this.setFromMatrixColumn(t,0).length(),i=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=n,this.y=i,this.z=s,this}setFromMatrixColumn(t,n){return this.fromArray(t.elements,n*4)}setFromMatrix3Column(t,n){return this.fromArray(t.elements,n*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,n=Math.random()*2-1,i=Math.sqrt(1-n*n);return this.x=i*Math.cos(t),this.y=n,this.z=i*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},k0=new P,$M=new _i,Vt=class e{static{e.prototype.isMatrix3=!0}constructor(t,n,i,s,a,r,o,l,c){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,r,o,l,c)}set(t,n,i,s,a,r,o,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=n,h[4]=a,h[5]=l,h[6]=i,h[7]=r,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],this}extractBasis(t,n,i){return t.setFromMatrix3Column(this,0),n.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let n=t.elements;return this.set(n[0],n[4],n[8],n[1],n[5],n[9],n[2],n[6],n[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){let i=t.elements,s=n.elements,a=this.elements,r=i[0],o=i[3],l=i[6],c=i[1],h=i[4],d=i[7],u=i[2],p=i[5],m=i[8],S=s[0],g=s[3],f=s[6],v=s[1],b=s[4],y=s[7],T=s[2],E=s[5],w=s[8];return a[0]=r*S+o*v+l*T,a[3]=r*g+o*b+l*E,a[6]=r*f+o*y+l*w,a[1]=c*S+h*v+d*T,a[4]=c*g+h*b+d*E,a[7]=c*f+h*y+d*w,a[2]=u*S+p*v+m*T,a[5]=u*g+p*b+m*E,a[8]=u*f+p*y+m*w,this}multiplyScalar(t){let n=this.elements;return n[0]*=t,n[3]*=t,n[6]*=t,n[1]*=t,n[4]*=t,n[7]*=t,n[2]*=t,n[5]*=t,n[8]*=t,this}determinant(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return n*r*h-n*o*c-i*a*h+i*o*l+s*a*c-s*r*l}invert(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=h*r-o*c,u=o*l-h*a,p=c*a-r*l,m=n*d+i*u+s*p;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let S=1/m;return t[0]=d*S,t[1]=(s*c-h*i)*S,t[2]=(o*i-s*r)*S,t[3]=u*S,t[4]=(h*n-s*l)*S,t[5]=(s*a-o*n)*S,t[6]=p*S,t[7]=(i*l-c*n)*S,t[8]=(r*n-i*a)*S,this}transpose(){let t,n=this.elements;return t=n[1],n[1]=n[3],n[3]=t,t=n[2],n[2]=n[6],n[6]=t,t=n[5],n[5]=n[7],n[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let n=this.elements;return t[0]=n[0],t[1]=n[3],t[2]=n[6],t[3]=n[1],t[4]=n[4],t[5]=n[7],t[6]=n[2],t[7]=n[5],t[8]=n[8],this}setUvTransform(t,n,i,s,a,r,o){let l=Math.cos(a),c=Math.sin(a);return this.set(i*l,i*c,-i*(l*r+c*o)+r+t,-s*c,s*l,-s*(-c*r+l*o)+o+n,0,0,1),this}scale(t,n){return Lr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(X0.makeScale(t,n)),this}rotate(t){return Lr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(X0.makeRotation(-t)),this}translate(t,n){return Lr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(X0.makeTranslation(t,n)),this}makeTranslation(t,n){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,n,0,0,1),this}makeRotation(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,i,n,0,0,0,1),this}makeScale(t,n){return this.set(t,0,0,0,n,0,0,0,1),this}equals(t){let n=this.elements,i=t.elements;for(let s=0;s<9;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<9;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){let i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t}clone(){return new this.constructor().fromArray(this.elements)}},X0=new Vt,t1=new Vt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),e1=new Vt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function wR(){let e={enabled:!0,workingColorSpace:kc,spaces:{},convert:function(s,a,r){return this.enabled===!1||a===r||!a||!r||(this.spaces[a].transfer===me&&(s.r=ta(s.r),s.g=ta(s.g),s.b=ta(s.b)),this.spaces[a].primaries!==this.spaces[r].primaries&&(s.applyMatrix3(this.spaces[a].toXYZ),s.applyMatrix3(this.spaces[r].fromXYZ)),this.spaces[r].transfer===me&&(s.r=rl(s.r),s.g=rl(s.g),s.b=rl(s.b))),s},workingToColorSpace:function(s,a){return this.convert(s,this.workingColorSpace,a)},colorSpaceToWorking:function(s,a){return this.convert(s,a,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===na?Xc:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,a=this.workingColorSpace){return s.fromArray(this.spaces[a].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,a,r){return s.copy(this.spaces[a].toXYZ).multiply(this.spaces[r].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,a){return Lr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),e.workingToColorSpace(s,a)},toWorkingColorSpace:function(s,a){return Lr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),e.colorSpaceToWorking(s,a)}},t=[.64,.33,.3,.6,.15,.06],n=[.2126,.7152,.0722],i=[.3127,.329];return e.define({[kc]:{primaries:t,whitePoint:i,transfer:Xc,toXYZ:t1,fromXYZ:e1,luminanceCoefficients:n,workingColorSpaceConfig:{unpackColorSpace:bn},outputColorSpaceConfig:{drawingBufferColorSpace:bn}},[bn]:{primaries:t,whitePoint:i,transfer:me,toXYZ:t1,fromXYZ:e1,luminanceCoefficients:n,outputColorSpaceConfig:{drawingBufferColorSpace:bn}}}),e}var ie=wR();function ta(e){return e<.04045?e*.0773993808:Math.pow(e*.9478672986+.0521327014,2.4)}function rl(e){return e<.0031308?e*12.92:1.055*Math.pow(e,.41666)-.055}var ko,of=class{static getDataURL(t,n="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let i;if(t instanceof HTMLCanvasElement)i=t;else{ko===void 0&&(ko=qc("canvas")),ko.width=t.width,ko.height=t.height;let s=ko.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),i=ko}return i.toDataURL(n)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let n=qc("canvas");n.width=t.width,n.height=t.height;let i=n.getContext("2d");i.drawImage(t,0,0,t.width,t.height);let s=i.getImageData(0,0,t.width,t.height),a=s.data;for(let r=0;r<a.length;r++)a[r]=ta(a[r]/255)*255;return i.putImageData(s,0,0),n}else if(t.data){let n=t.data.slice(0);for(let i=0;i<n.length;i++)n instanceof Uint8Array||n instanceof Uint8ClampedArray?n[i]=Math.floor(ta(n[i]/255)*255):n[i]=ta(n[i]);return{data:n,width:t.width,height:t.height}}else return Ot("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},AR=0,ul=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:AR++}),this.uuid=$s(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let n=this.data;return typeof HTMLVideoElement<"u"&&n instanceof HTMLVideoElement?t.set(n.videoWidth,n.videoHeight,0):typeof VideoFrame<"u"&&n instanceof VideoFrame?t.set(n.displayWidth,n.displayHeight,0):n!==null?t.set(n.width,n.height,n.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let a;if(Array.isArray(s)){a=[];for(let r=0,o=s.length;r<o;r++)s[r].isDataTexture?a.push(W0(s[r].image)):a.push(W0(s[r]))}else a=W0(s);i.url=a}return n||(t.images[this.uuid]=i),i}};function W0(e){return typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap?of.getDataURL(e):e.data?{data:Array.from(e.data),width:e.width,height:e.height,type:e.data.constructor.name}:(Ot("Texture: Unable to serialize Texture."),{})}var CR=0,q0=new P,kn=class e extends ji{constructor(t=e.DEFAULT_IMAGE,n=e.DEFAULT_MAPPING,i=ys,s=ys,a=Mn,r=$a,o=Pi,l=Si,c=e.DEFAULT_ANISOTROPY,h=na){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:CR++}),this.uuid=$s(),this.name="",this.source=new ul(t),this.mipmaps=[],this.mapping=n,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=a,this.minFilter=r,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new Ut(0,0),this.repeat=new Ut(1,1),this.center=new Ut(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Vt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(q0).x}get height(){return this.source.getSize(q0).y}get depth(){return this.source.getSize(q0).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let n in t){let i=t[n];if(i===void 0){Ot(`Texture.setValues(): parameter '${n}' has value of undefined.`);continue}let s=this[n];if(s===void 0){Ot(`Texture.setValues(): property '${n}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[n]=i}}toJSON(t){let n=t===void 0||typeof t=="string";if(!n&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),n||(t.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==Lv)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case sf:t.x=t.x-Math.floor(t.x);break;case ys:t.x=t.x<0?0:1;break;case af:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case sf:t.y=t.y-Math.floor(t.y);break;case ys:t.y=t.y<0?0:1;break;case af:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};kn.DEFAULT_IMAGE=null;kn.DEFAULT_MAPPING=Lv;kn.DEFAULT_ANISOTROPY=1;var Xe=class e{static{e.prototype.isVector4=!0}constructor(t=0,n=0,i=0,s=1){this.x=t,this.y=n,this.z=i,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,n,i,s){return this.x=t,this.y=n,this.z=i,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,n){switch(t){case 0:this.x=n;break;case 1:this.y=n;break;case 2:this.z=n;break;case 3:this.w=n;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,n){return this.x=t.x+n.x,this.y=t.y+n.y,this.z=t.z+n.z,this.w=t.w+n.w,this}addScaledVector(t,n){return this.x+=t.x*n,this.y+=t.y*n,this.z+=t.z*n,this.w+=t.w*n,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,n){return this.x=t.x-n.x,this.y=t.y-n.y,this.z=t.z-n.z,this.w=t.w-n.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let n=this.x,i=this.y,s=this.z,a=this.w,r=t.elements;return this.x=r[0]*n+r[4]*i+r[8]*s+r[12]*a,this.y=r[1]*n+r[5]*i+r[9]*s+r[13]*a,this.z=r[2]*n+r[6]*i+r[10]*s+r[14]*a,this.w=r[3]*n+r[7]*i+r[11]*s+r[15]*a,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let n=Math.sqrt(1-t.w*t.w);return n<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/n,this.y=t.y/n,this.z=t.z/n),this}setAxisAngleFromRotationMatrix(t){let n,i,s,a,l=t.elements,c=l[0],h=l[4],d=l[8],u=l[1],p=l[5],m=l[9],S=l[2],g=l[6],f=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-S)<.01&&Math.abs(m-g)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+S)<.1&&Math.abs(m+g)<.1&&Math.abs(c+p+f-3)<.1)return this.set(1,0,0,0),this;n=Math.PI;let b=(c+1)/2,y=(p+1)/2,T=(f+1)/2,E=(h+u)/4,w=(d+S)/4,_=(m+g)/4;return b>y&&b>T?b<.01?(i=0,s=.707106781,a=.707106781):(i=Math.sqrt(b),s=E/i,a=w/i):y>T?y<.01?(i=.707106781,s=0,a=.707106781):(s=Math.sqrt(y),i=E/s,a=_/s):T<.01?(i=.707106781,s=.707106781,a=0):(a=Math.sqrt(T),i=w/a,s=_/a),this.set(i,s,a,n),this}let v=Math.sqrt((g-m)*(g-m)+(d-S)*(d-S)+(u-h)*(u-h));return Math.abs(v)<.001&&(v=1),this.x=(g-m)/v,this.y=(d-S)/v,this.z=(u-h)/v,this.w=Math.acos((c+p+f-1)/2),this}setFromMatrixPosition(t){let n=t.elements;return this.x=n[12],this.y=n[13],this.z=n[14],this.w=n[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,n){return this.x=jt(this.x,t.x,n.x),this.y=jt(this.y,t.y,n.y),this.z=jt(this.z,t.z,n.z),this.w=jt(this.w,t.w,n.w),this}clampScalar(t,n){return this.x=jt(this.x,t,n),this.y=jt(this.y,t,n),this.z=jt(this.z,t,n),this.w=jt(this.w,t,n),this}clampLength(t,n){let i=this.length();return this.divideScalar(i||1).multiplyScalar(jt(i,t,n))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,n){return this.x+=(t.x-this.x)*n,this.y+=(t.y-this.y)*n,this.z+=(t.z-this.z)*n,this.w+=(t.w-this.w)*n,this}lerpVectors(t,n,i){return this.x=t.x+(n.x-t.x)*i,this.y=t.y+(n.y-t.y)*i,this.z=t.z+(n.z-t.z)*i,this.w=t.w+(n.w-t.w)*i,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,n=0){return this.x=t[n],this.y=t[n+1],this.z=t[n+2],this.w=t[n+3],this}toArray(t=[],n=0){return t[n]=this.x,t[n+1]=this.y,t[n+2]=this.z,t[n+3]=this.w,t}fromBufferAttribute(t,n){return this.x=t.getX(n),this.y=t.getY(n),this.z=t.getZ(n),this.w=t.getW(n),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},lf=class extends ji{constructor(t=1,n=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Mn,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=t,this.height=n,this.depth=i.depth,this.scissor=new Xe(0,0,t,n),this.scissorTest=!1,this.viewport=new Xe(0,0,t,n),this.textures=[];let s={width:t,height:n,depth:i.depth},a=new kn(s),r=i.count;for(let o=0;o<r;o++)this.textures[o]=a.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(t={}){let n={minFilter:Mn,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(n.mapping=t.mapping),t.wrapS!==void 0&&(n.wrapS=t.wrapS),t.wrapT!==void 0&&(n.wrapT=t.wrapT),t.wrapR!==void 0&&(n.wrapR=t.wrapR),t.magFilter!==void 0&&(n.magFilter=t.magFilter),t.minFilter!==void 0&&(n.minFilter=t.minFilter),t.format!==void 0&&(n.format=t.format),t.type!==void 0&&(n.type=t.type),t.anisotropy!==void 0&&(n.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(n.colorSpace=t.colorSpace),t.flipY!==void 0&&(n.flipY=t.flipY),t.generateMipmaps!==void 0&&(n.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(n.internalFormat=t.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(n)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,n,i=1){if(this.width!==t||this.height!==n||this.depth!==i){this.width=t,this.height=n,this.depth=i;for(let s=0,a=this.textures.length;s<a;s++)this.textures[s].image.width=t,this.textures[s].image.height=n,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,n),this.scissor.set(0,0,t,n)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,i=t.textures.length;n<i;n++){this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;let s=Object.assign({},t.textures[n].image);this.textures[n].source=new ul(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let n=t.depthTexture.clone();n.renderTarget=null,this.depthTexture=n}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},ti=class extends lf{constructor(t=1,n=1,i={}){super(t,n,i),this.isWebGLRenderTarget=!0}},Zc=class extends kn{constructor(t=null,n=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=fn,this.minFilter=fn,this.wrapR=ys,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var cf=class extends kn{constructor(t=null,n=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:n,height:i,depth:s},this.magFilter=fn,this.minFilter=fn,this.wrapR=ys,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var Fe=class e{static{e.prototype.isMatrix4=!0}constructor(t,n,i,s,a,r,o,l,c,h,d,u,p,m,S,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,n,i,s,a,r,o,l,c,h,d,u,p,m,S,g)}set(t,n,i,s,a,r,o,l,c,h,d,u,p,m,S,g){let f=this.elements;return f[0]=t,f[4]=n,f[8]=i,f[12]=s,f[1]=a,f[5]=r,f[9]=o,f[13]=l,f[2]=c,f[6]=h,f[10]=d,f[14]=u,f[3]=p,f[7]=m,f[11]=S,f[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new e().fromArray(this.elements)}copy(t){let n=this.elements,i=t.elements;return n[0]=i[0],n[1]=i[1],n[2]=i[2],n[3]=i[3],n[4]=i[4],n[5]=i[5],n[6]=i[6],n[7]=i[7],n[8]=i[8],n[9]=i[9],n[10]=i[10],n[11]=i[11],n[12]=i[12],n[13]=i[13],n[14]=i[14],n[15]=i[15],this}copyPosition(t){let n=this.elements,i=t.elements;return n[12]=i[12],n[13]=i[13],n[14]=i[14],this}setFromMatrix3(t){let n=t.elements;return this.set(n[0],n[3],n[6],0,n[1],n[4],n[7],0,n[2],n[5],n[8],0,0,0,0,1),this}extractBasis(t,n,i){return this.determinantAffine()===0?(t.set(1,0,0),n.set(0,1,0),i.set(0,0,1),this):(t.setFromMatrixColumn(this,0),n.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(t,n,i){return this.set(t.x,n.x,i.x,0,t.y,n.y,i.y,0,t.z,n.z,i.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let n=this.elements,i=t.elements,s=1/Xo.setFromMatrixColumn(t,0).length(),a=1/Xo.setFromMatrixColumn(t,1).length(),r=1/Xo.setFromMatrixColumn(t,2).length();return n[0]=i[0]*s,n[1]=i[1]*s,n[2]=i[2]*s,n[3]=0,n[4]=i[4]*a,n[5]=i[5]*a,n[6]=i[6]*a,n[7]=0,n[8]=i[8]*r,n[9]=i[9]*r,n[10]=i[10]*r,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromEuler(t){let n=this.elements,i=t.x,s=t.y,a=t.z,r=Math.cos(i),o=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(a),d=Math.sin(a);if(t.order==="XYZ"){let u=r*h,p=r*d,m=o*h,S=o*d;n[0]=l*h,n[4]=-l*d,n[8]=c,n[1]=p+m*c,n[5]=u-S*c,n[9]=-o*l,n[2]=S-u*c,n[6]=m+p*c,n[10]=r*l}else if(t.order==="YXZ"){let u=l*h,p=l*d,m=c*h,S=c*d;n[0]=u+S*o,n[4]=m*o-p,n[8]=r*c,n[1]=r*d,n[5]=r*h,n[9]=-o,n[2]=p*o-m,n[6]=S+u*o,n[10]=r*l}else if(t.order==="ZXY"){let u=l*h,p=l*d,m=c*h,S=c*d;n[0]=u-S*o,n[4]=-r*d,n[8]=m+p*o,n[1]=p+m*o,n[5]=r*h,n[9]=S-u*o,n[2]=-r*c,n[6]=o,n[10]=r*l}else if(t.order==="ZYX"){let u=r*h,p=r*d,m=o*h,S=o*d;n[0]=l*h,n[4]=m*c-p,n[8]=u*c+S,n[1]=l*d,n[5]=S*c+u,n[9]=p*c-m,n[2]=-c,n[6]=o*l,n[10]=r*l}else if(t.order==="YZX"){let u=r*l,p=r*c,m=o*l,S=o*c;n[0]=l*h,n[4]=S-u*d,n[8]=m*d+p,n[1]=d,n[5]=r*h,n[9]=-o*h,n[2]=-c*h,n[6]=p*d+m,n[10]=u-S*d}else if(t.order==="XZY"){let u=r*l,p=r*c,m=o*l,S=o*c;n[0]=l*h,n[4]=-d,n[8]=c*h,n[1]=u*d+S,n[5]=r*h,n[9]=p*d-m,n[2]=m*d-p,n[6]=o*h,n[10]=S*d+u}return n[3]=0,n[7]=0,n[11]=0,n[12]=0,n[13]=0,n[14]=0,n[15]=1,this}makeRotationFromQuaternion(t){return this.compose(RR,t,NR)}lookAt(t,n,i){let s=this.elements;return mi.subVectors(t,n),mi.lengthSq()===0&&(mi.z=1),mi.normalize(),za.crossVectors(i,mi),za.lengthSq()===0&&(Math.abs(i.z)===1?mi.x+=1e-4:mi.z+=1e-4,mi.normalize(),za.crossVectors(i,mi)),za.normalize(),bd.crossVectors(mi,za),s[0]=za.x,s[4]=bd.x,s[8]=mi.x,s[1]=za.y,s[5]=bd.y,s[9]=mi.y,s[2]=za.z,s[6]=bd.z,s[10]=mi.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,n){let i=t.elements,s=n.elements,a=this.elements,r=i[0],o=i[4],l=i[8],c=i[12],h=i[1],d=i[5],u=i[9],p=i[13],m=i[2],S=i[6],g=i[10],f=i[14],v=i[3],b=i[7],y=i[11],T=i[15],E=s[0],w=s[4],_=s[8],A=s[12],R=s[1],O=s[5],F=s[9],z=s[13],I=s[2],X=s[6],Y=s[10],j=s[14],at=s[3],Z=s[7],nt=s[11],st=s[15];return a[0]=r*E+o*R+l*I+c*at,a[4]=r*w+o*O+l*X+c*Z,a[8]=r*_+o*F+l*Y+c*nt,a[12]=r*A+o*z+l*j+c*st,a[1]=h*E+d*R+u*I+p*at,a[5]=h*w+d*O+u*X+p*Z,a[9]=h*_+d*F+u*Y+p*nt,a[13]=h*A+d*z+u*j+p*st,a[2]=m*E+S*R+g*I+f*at,a[6]=m*w+S*O+g*X+f*Z,a[10]=m*_+S*F+g*Y+f*nt,a[14]=m*A+S*z+g*j+f*st,a[3]=v*E+b*R+y*I+T*at,a[7]=v*w+b*O+y*X+T*Z,a[11]=v*_+b*F+y*Y+T*nt,a[15]=v*A+b*z+y*j+T*st,this}multiplyScalar(t){let n=this.elements;return n[0]*=t,n[4]*=t,n[8]*=t,n[12]*=t,n[1]*=t,n[5]*=t,n[9]*=t,n[13]*=t,n[2]*=t,n[6]*=t,n[10]*=t,n[14]*=t,n[3]*=t,n[7]*=t,n[11]*=t,n[15]*=t,this}determinant(){let t=this.elements,n=t[0],i=t[4],s=t[8],a=t[12],r=t[1],o=t[5],l=t[9],c=t[13],h=t[2],d=t[6],u=t[10],p=t[14],m=t[3],S=t[7],g=t[11],f=t[15],v=l*p-c*u,b=o*p-c*d,y=o*u-l*d,T=r*p-c*h,E=r*u-l*h,w=r*d-o*h;return n*(S*v-g*b+f*y)-i*(m*v-g*T+f*E)+s*(m*b-S*T+f*w)-a*(m*y-S*E+g*w)}determinantAffine(){let t=this.elements,n=t[0],i=t[4],s=t[8],a=t[1],r=t[5],o=t[9],l=t[2],c=t[6],h=t[10];return n*(r*h-o*c)-i*(a*h-o*l)+s*(a*c-r*l)}transpose(){let t=this.elements,n;return n=t[1],t[1]=t[4],t[4]=n,n=t[2],t[2]=t[8],t[8]=n,n=t[6],t[6]=t[9],t[9]=n,n=t[3],t[3]=t[12],t[12]=n,n=t[7],t[7]=t[13],t[13]=n,n=t[11],t[11]=t[14],t[14]=n,this}setPosition(t,n,i){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=n,s[14]=i),this}invert(){let t=this.elements,n=t[0],i=t[1],s=t[2],a=t[3],r=t[4],o=t[5],l=t[6],c=t[7],h=t[8],d=t[9],u=t[10],p=t[11],m=t[12],S=t[13],g=t[14],f=t[15],v=n*o-i*r,b=n*l-s*r,y=n*c-a*r,T=i*l-s*o,E=i*c-a*o,w=s*c-a*l,_=h*S-d*m,A=h*g-u*m,R=h*f-p*m,O=d*g-u*S,F=d*f-p*S,z=u*f-p*g,I=v*z-b*F+y*O+T*R-E*A+w*_;if(I===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let X=1/I;return t[0]=(o*z-l*F+c*O)*X,t[1]=(s*F-i*z-a*O)*X,t[2]=(S*w-g*E+f*T)*X,t[3]=(u*E-d*w-p*T)*X,t[4]=(l*R-r*z-c*A)*X,t[5]=(n*z-s*R+a*A)*X,t[6]=(g*y-m*w-f*b)*X,t[7]=(h*w-u*y+p*b)*X,t[8]=(r*F-o*R+c*_)*X,t[9]=(i*R-n*F-a*_)*X,t[10]=(m*E-S*y+f*v)*X,t[11]=(d*y-h*E-p*v)*X,t[12]=(o*A-r*O-l*_)*X,t[13]=(n*O-i*A+s*_)*X,t[14]=(S*b-m*T-g*v)*X,t[15]=(h*T-d*b+u*v)*X,this}scale(t){let n=this.elements,i=t.x,s=t.y,a=t.z;return n[0]*=i,n[4]*=s,n[8]*=a,n[1]*=i,n[5]*=s,n[9]*=a,n[2]*=i,n[6]*=s,n[10]*=a,n[3]*=i,n[7]*=s,n[11]*=a,this}getMaxScaleOnAxis(){let t=this.elements,n=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],i=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(n,i,s))}makeTranslation(t,n,i){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,n,0,0,1,i,0,0,0,1),this}makeRotationX(t){let n=Math.cos(t),i=Math.sin(t);return this.set(1,0,0,0,0,n,-i,0,0,i,n,0,0,0,0,1),this}makeRotationY(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,0,i,0,0,1,0,0,-i,0,n,0,0,0,0,1),this}makeRotationZ(t){let n=Math.cos(t),i=Math.sin(t);return this.set(n,-i,0,0,i,n,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,n){let i=Math.cos(n),s=Math.sin(n),a=1-i,r=t.x,o=t.y,l=t.z,c=a*r,h=a*o;return this.set(c*r+i,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+i,h*l-s*r,0,c*l-s*o,h*l+s*r,a*l*l+i,0,0,0,0,1),this}makeScale(t,n,i){return this.set(t,0,0,0,0,n,0,0,0,0,i,0,0,0,0,1),this}makeShear(t,n,i,s,a,r){return this.set(1,i,a,0,t,1,r,0,n,s,1,0,0,0,0,1),this}compose(t,n,i){let s=this.elements,a=n._x,r=n._y,o=n._z,l=n._w,c=a+a,h=r+r,d=o+o,u=a*c,p=a*h,m=a*d,S=r*h,g=r*d,f=o*d,v=l*c,b=l*h,y=l*d,T=i.x,E=i.y,w=i.z;return s[0]=(1-(S+f))*T,s[1]=(p+y)*T,s[2]=(m-b)*T,s[3]=0,s[4]=(p-y)*E,s[5]=(1-(u+f))*E,s[6]=(g+v)*E,s[7]=0,s[8]=(m+b)*w,s[9]=(g-v)*w,s[10]=(1-(u+S))*w,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,n,i){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let a=this.determinantAffine();if(a===0)return i.set(1,1,1),n.identity(),this;let r=Xo.set(s[0],s[1],s[2]).length(),o=Xo.set(s[4],s[5],s[6]).length(),l=Xo.set(s[8],s[9],s[10]).length();a<0&&(r=-r),Xi.copy(this);let c=1/r,h=1/o,d=1/l;return Xi.elements[0]*=c,Xi.elements[1]*=c,Xi.elements[2]*=c,Xi.elements[4]*=h,Xi.elements[5]*=h,Xi.elements[6]*=h,Xi.elements[8]*=d,Xi.elements[9]*=d,Xi.elements[10]*=d,n.setFromRotationMatrix(Xi),i.x=r,i.y=o,i.z=l,this}makePerspective(t,n,i,s,a,r,o=Zi,l=!1){let c=this.elements,h=2*a/(n-t),d=2*a/(i-s),u=(n+t)/(n-t),p=(i+s)/(i-s),m,S;if(l)m=a/(r-a),S=r*a/(r-a);else if(o===Zi)m=-(r+a)/(r-a),S=-2*r*a/(r-a);else if(o===Wc)m=-r/(r-a),S=-r*a/(r-a);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=d,c[9]=p,c[13]=0,c[2]=0,c[6]=0,c[10]=m,c[14]=S,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(t,n,i,s,a,r,o=Zi,l=!1){let c=this.elements,h=2/(n-t),d=2/(i-s),u=-(n+t)/(n-t),p=-(i+s)/(i-s),m,S;if(l)m=1/(r-a),S=r/(r-a);else if(o===Zi)m=-2/(r-a),S=-(r+a)/(r-a);else if(o===Wc)m=-1/(r-a),S=-a/(r-a);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=d,c[9]=0,c[13]=p,c[2]=0,c[6]=0,c[10]=m,c[14]=S,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(t){let n=this.elements,i=t.elements;for(let s=0;s<16;s++)if(n[s]!==i[s])return!1;return!0}fromArray(t,n=0){for(let i=0;i<16;i++)this.elements[i]=t[i+n];return this}toArray(t=[],n=0){let i=this.elements;return t[n]=i[0],t[n+1]=i[1],t[n+2]=i[2],t[n+3]=i[3],t[n+4]=i[4],t[n+5]=i[5],t[n+6]=i[6],t[n+7]=i[7],t[n+8]=i[8],t[n+9]=i[9],t[n+10]=i[10],t[n+11]=i[11],t[n+12]=i[12],t[n+13]=i[13],t[n+14]=i[14],t[n+15]=i[15],t}},Xo=new P,Xi=new Fe,RR=new P(0,0,0),NR=new P(1,1,1),za=new P,bd=new P,mi=new P,n1=new Fe,i1=new _i,ka=class e{constructor(t=0,n=0,i=0,s=e.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=n,this._z=i,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,n,i,s=this._order){return this._x=t,this._y=n,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,n=this._order,i=!0){let s=t.elements,a=s[0],r=s[4],o=s[8],l=s[1],c=s[5],h=s[9],d=s[2],u=s[6],p=s[10];switch(n){case"XYZ":this._y=Math.asin(jt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-r,a)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-jt(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,a),this._z=0);break;case"ZXY":this._x=Math.asin(jt(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-r,c)):(this._y=0,this._z=Math.atan2(l,a));break;case"ZYX":this._y=Math.asin(-jt(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,p),this._z=Math.atan2(l,a)):(this._x=0,this._z=Math.atan2(-r,c));break;case"YZX":this._z=Math.asin(jt(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,a)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-jt(r,-1,1)),Math.abs(r)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(o,a)):(this._x=Math.atan2(-h,p),this._y=0);break;default:Ot("Euler: .setFromRotationMatrix() encountered an unknown order: "+n)}return this._order=n,i===!0&&this._onChangeCallback(),this}setFromQuaternion(t,n,i){return n1.makeRotationFromQuaternion(t),this.setFromRotationMatrix(n1,n,i)}setFromVector3(t,n=this._order){return this.set(t.x,t.y,t.z,n)}reorder(t){return i1.setFromEuler(this),this.setFromQuaternion(i1,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],n=0){return t[n]=this._x,t[n+1]=this._y,t[n+2]=this._z,t[n+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ka.DEFAULT_ORDER="XYZ";var hl=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},DR=0,s1=new P,Wo=new _i,qs=new Fe,Md=new P,Lc=new P,LR=new P,UR=new _i,a1=new P(1,0,0),r1=new P(0,1,0),o1=new P(0,0,1),l1={type:"added"},IR={type:"removed"},qo={type:"childadded",child:null},Y0={type:"childremoved",child:null},Xn=class e extends ji{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:DR++}),this.uuid=$s(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=e.DEFAULT_UP.clone();let t=new P,n=new ka,i=new _i,s=new P(1,1,1);function a(){i.setFromEuler(n,!1)}function r(){n.setFromQuaternion(i,void 0,!1)}n._onChange(a),i._onChange(r),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:n},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Fe},normalMatrix:{value:new Vt}}),this.matrix=new Fe,this.matrixWorld=new Fe,this.matrixAutoUpdate=e.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=e.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new hl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,n){this.quaternion.setFromAxisAngle(t,n)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,n){return Wo.setFromAxisAngle(t,n),this.quaternion.multiply(Wo),this}rotateOnWorldAxis(t,n){return Wo.setFromAxisAngle(t,n),this.quaternion.premultiply(Wo),this}rotateX(t){return this.rotateOnAxis(a1,t)}rotateY(t){return this.rotateOnAxis(r1,t)}rotateZ(t){return this.rotateOnAxis(o1,t)}translateOnAxis(t,n){return s1.copy(t).applyQuaternion(this.quaternion),this.position.add(s1.multiplyScalar(n)),this}translateX(t){return this.translateOnAxis(a1,t)}translateY(t){return this.translateOnAxis(r1,t)}translateZ(t){return this.translateOnAxis(o1,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(qs.copy(this.matrixWorld).invert())}lookAt(t,n,i){t.isVector3?Md.copy(t):Md.set(t,n,i);let s=this.parent;this.updateWorldMatrix(!0,!1),Lc.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?qs.lookAt(Lc,Md,this.up):qs.lookAt(Md,Lc,this.up),this.quaternion.setFromRotationMatrix(qs),s&&(qs.extractRotation(s.matrixWorld),Wo.setFromRotationMatrix(qs),this.quaternion.premultiply(Wo.invert()))}add(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.add(arguments[n]);return this}return t===this?(Pt("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(l1),qo.child=t,this.dispatchEvent(qo),qo.child=null):Pt("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let n=this.children.indexOf(t);return n!==-1&&(t.parent=null,this.children.splice(n,1),t.dispatchEvent(IR),Y0.child=t,this.dispatchEvent(Y0),Y0.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),qs.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),qs.multiply(t.parent.matrixWorld)),t.applyMatrix4(qs),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(l1),qo.child=t,this.dispatchEvent(qo),qo.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,n){if(this[t]===n)return this;for(let i=0,s=this.children.length;i<s;i++){let r=this.children[i].getObjectByProperty(t,n);if(r!==void 0)return r}}getObjectsByProperty(t,n,i=[]){this[t]===n&&i.push(this);let s=this.children;for(let a=0,r=s.length;a<r;a++)s[a].getObjectsByProperty(t,n,i);return i}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Lc,t,LR),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Lc,UR,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let n=this.matrixWorld.elements;return t.set(n[8],n[9],n[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].traverseVisible(t)}traverseAncestors(t){let n=this.parent;n!==null&&(t(n),n.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let n=t.x,i=t.y,s=t.z,a=this.matrix.elements;a[12]+=n-a[0]*n-a[4]*i-a[8]*s,a[13]+=i-a[1]*n-a[5]*i-a[9]*s,a[14]+=s-a[2]*n-a[6]*i-a[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let n=this.children;for(let i=0,s=n.length;i<s;i++)n[i].updateMatrixWorld(t)}updateWorldMatrix(t,n,i=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),n===!0){let a=this.children;for(let r=0,o=a.length;r<o;r++)a[r].updateWorldMatrix(!1,!0,i)}}toJSON(t){let n=t===void 0||typeof t=="string",i={};n&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function a(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=a(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];a(t.shapes,d)}else a(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(a(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(a(t.materials,this.material[l]));s.material=o}else s.material=a(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(a(t.animations,l))}}if(n){let o=r(t.geometries),l=r(t.materials),c=r(t.textures),h=r(t.images),d=r(t.shapes),u=r(t.skeletons),p=r(t.animations),m=r(t.nodes);o.length>0&&(i.geometries=o),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),d.length>0&&(i.shapes=d),u.length>0&&(i.skeletons=u),p.length>0&&(i.animations=p),m.length>0&&(i.nodes=m)}return i.object=s,i;function r(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,n=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),n===!0)for(let i=0;i<t.children.length;i++){let s=t.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Xn.DEFAULT_UP=new P(0,1,0);Xn.DEFAULT_MATRIX_AUTO_UPDATE=!0;Xn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Qs=class extends Xn{constructor(){super(),this.isGroup=!0,this.type="Group"}},OR={type:"move"},dl=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Qs,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Qs,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Qs,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let n=this._hand;if(n)for(let i of t.hand.values())this._getHandJoint(n,i)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,n,i){let s=null,a=null,r=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&n.session.visibilityState!=="visible-blurred"){if(c&&t.hand){r=!0;for(let S of t.hand.values()){let g=n.getJointPose(S,i),f=this._getHandJoint(c,S);g!==null&&(f.matrix.fromArray(g.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=g.radius),f.visible=g!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),p=.02,m=.005;c.inputState.pinching&&u>p+m?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&u<=p-m&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(a=n.getPose(t.gripSpace,i),a!==null&&(l.matrix.fromArray(a.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,a.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(a.linearVelocity)):l.hasLinearVelocity=!1,a.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(a.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=n.getPose(t.targetRaySpace,i),s===null&&a!==null&&(s=a),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(OR)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=a!==null),c!==null&&(c.visible=r!==null),this}_getHandJoint(t,n){if(t.joints[n.jointName]===void 0){let i=new Qs;i.matrixAutoUpdate=!1,i.visible=!1,t.joints[n.jointName]=i,t.add(i)}return t.joints[n.jointName]}},lE={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Fa={h:0,s:0,l:0},Ed={h:0,s:0,l:0};function Z0(e,t,n){return n<0&&(n+=1),n>1&&(n-=1),n<1/6?e+(t-e)*6*n:n<1/2?t:n<2/3?e+(t-e)*6*(2/3-n):e}var Wt=class{constructor(t,n,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,n,i)}set(t,n,i){if(n===void 0&&i===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,n,i);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,n=bn){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,ie.colorSpaceToWorking(this,n),this}setRGB(t,n,i,s=ie.workingColorSpace){return this.r=t,this.g=n,this.b=i,ie.colorSpaceToWorking(this,s),this}setHSL(t,n,i,s=ie.workingColorSpace){if(t=kv(t,1),n=jt(n,0,1),i=jt(i,0,1),n===0)this.r=this.g=this.b=i;else{let a=i<=.5?i*(1+n):i+n-i*n,r=2*i-a;this.r=Z0(r,a,t+1/3),this.g=Z0(r,a,t),this.b=Z0(r,a,t-1/3)}return ie.colorSpaceToWorking(this,s),this}setStyle(t,n=bn){function i(a){a!==void 0&&parseFloat(a)<1&&Ot("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let a,r=s[1],o=s[2];switch(r){case"rgb":case"rgba":if(a=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(255,parseInt(a[1],10))/255,Math.min(255,parseInt(a[2],10))/255,Math.min(255,parseInt(a[3],10))/255,n);if(a=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setRGB(Math.min(100,parseInt(a[1],10))/100,Math.min(100,parseInt(a[2],10))/100,Math.min(100,parseInt(a[3],10))/100,n);break;case"hsl":case"hsla":if(a=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return i(a[4]),this.setHSL(parseFloat(a[1])/360,parseFloat(a[2])/100,parseFloat(a[3])/100,n);break;default:Ot("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let a=s[1],r=a.length;if(r===3)return this.setRGB(parseInt(a.charAt(0),16)/15,parseInt(a.charAt(1),16)/15,parseInt(a.charAt(2),16)/15,n);if(r===6)return this.setHex(parseInt(a,16),n);Ot("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,n);return this}setColorName(t,n=bn){let i=lE[t.toLowerCase()];return i!==void 0?this.setHex(i,n):Ot("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=ta(t.r),this.g=ta(t.g),this.b=ta(t.b),this}copyLinearToSRGB(t){return this.r=rl(t.r),this.g=rl(t.g),this.b=rl(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=bn){return ie.workingToColorSpace(Dn.copy(this),t),Math.round(jt(Dn.r*255,0,255))*65536+Math.round(jt(Dn.g*255,0,255))*256+Math.round(jt(Dn.b*255,0,255))}getHexString(t=bn){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,n=ie.workingColorSpace){ie.workingToColorSpace(Dn.copy(this),n);let i=Dn.r,s=Dn.g,a=Dn.b,r=Math.max(i,s,a),o=Math.min(i,s,a),l,c,h=(o+r)/2;if(o===r)l=0,c=0;else{let d=r-o;switch(c=h<=.5?d/(r+o):d/(2-r-o),r){case i:l=(s-a)/d+(s<a?6:0);break;case s:l=(a-i)/d+2;break;case a:l=(i-s)/d+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,n=ie.workingColorSpace){return ie.workingToColorSpace(Dn.copy(this),n),t.r=Dn.r,t.g=Dn.g,t.b=Dn.b,t}getStyle(t=bn){ie.workingToColorSpace(Dn.copy(this),t);let n=Dn.r,i=Dn.g,s=Dn.b;return t!==bn?`color(${t} ${n.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(n*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(t,n,i){return this.getHSL(Fa),this.setHSL(Fa.h+t,Fa.s+n,Fa.l+i)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,n){return this.r=t.r+n.r,this.g=t.g+n.g,this.b=t.b+n.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,n){return this.r+=(t.r-this.r)*n,this.g+=(t.g-this.g)*n,this.b+=(t.b-this.b)*n,this}lerpColors(t,n,i){return this.r=t.r+(n.r-t.r)*i,this.g=t.g+(n.g-t.g)*i,this.b=t.b+(n.b-t.b)*i,this}lerpHSL(t,n){this.getHSL(Fa),t.getHSL(Ed);let i=Hc(Fa.h,Ed.h,n),s=Hc(Fa.s,Ed.s,n),a=Hc(Fa.l,Ed.l,n);return this.setHSL(i,s,a),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let n=this.r,i=this.g,s=this.b,a=t.elements;return this.r=a[0]*n+a[3]*i+a[6]*s,this.g=a[1]*n+a[4]*i+a[7]*s,this.b=a[2]*n+a[5]*i+a[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,n=0){return this.r=t[n],this.g=t[n+1],this.b=t[n+2],this}toArray(t=[],n=0){return t[n]=this.r,t[n+1]=this.g,t[n+2]=this.b,t}fromBufferAttribute(t,n){return this.r=t.getX(n),this.g=t.getY(n),this.b=t.getZ(n),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},Dn=new Wt;Wt.NAMES=lE;var jc=class e{constructor(t,n=25e-5){this.isFogExp2=!0,this.name="",this.color=new Wt(t),this.density=n}clone(){return new e(this.color,this.density)}toJSON(){return{type:"FogExp2",name:this.name,color:this.color.getHex(),density:this.density}}};var Kc=class extends Xn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ka,this.environmentIntensity=1,this.environmentRotation=new ka,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,n){return super.copy(t,n),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let n=super.toJSON(t);return this.fog!==null&&(n.object.fog=this.fog.toJSON()),n.object.backgroundBlurriness=this.backgroundBlurriness,n.object.backgroundIntensity=this.backgroundIntensity,n.object.backgroundRotation=this.backgroundRotation.toArray(),n.object.environmentIntensity=this.environmentIntensity,n.object.environmentRotation=this.environmentRotation.toArray(),n}},Wi=new P,Ys=new P,j0=new P,Zs=new P,Yo=new P,Zo=new P,c1=new P,K0=new P,J0=new P,Q0=new P,$0=new Xe,tv=new Xe,ev=new Xe,Js=class e{constructor(t=new P,n=new P,i=new P){this.a=t,this.b=n,this.c=i}static getNormal(t,n,i,s){s.subVectors(i,n),Wi.subVectors(t,n),s.cross(Wi);let a=s.lengthSq();return a>0?s.multiplyScalar(1/Math.sqrt(a)):s.set(0,0,0)}static getBarycoord(t,n,i,s,a){Wi.subVectors(s,n),Ys.subVectors(i,n),j0.subVectors(t,n);let r=Wi.dot(Wi),o=Wi.dot(Ys),l=Wi.dot(j0),c=Ys.dot(Ys),h=Ys.dot(j0),d=r*c-o*o;if(d===0)return a.set(0,0,0),null;let u=1/d,p=(c*l-o*h)*u,m=(r*h-o*l)*u;return a.set(1-p-m,m,p)}static containsPoint(t,n,i,s){return this.getBarycoord(t,n,i,s,Zs)===null?!1:Zs.x>=0&&Zs.y>=0&&Zs.x+Zs.y<=1}static getInterpolation(t,n,i,s,a,r,o,l){return this.getBarycoord(t,n,i,s,Zs)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(a,Zs.x),l.addScaledVector(r,Zs.y),l.addScaledVector(o,Zs.z),l)}static getInterpolatedAttribute(t,n,i,s,a,r){return $0.setScalar(0),tv.setScalar(0),ev.setScalar(0),$0.fromBufferAttribute(t,n),tv.fromBufferAttribute(t,i),ev.fromBufferAttribute(t,s),r.setScalar(0),r.addScaledVector($0,a.x),r.addScaledVector(tv,a.y),r.addScaledVector(ev,a.z),r}static isFrontFacing(t,n,i,s){return Wi.subVectors(i,n),Ys.subVectors(t,n),Wi.cross(Ys).dot(s)<0}set(t,n,i){return this.a.copy(t),this.b.copy(n),this.c.copy(i),this}setFromPointsAndIndices(t,n,i,s){return this.a.copy(t[n]),this.b.copy(t[i]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,n,i,s){return this.a.fromBufferAttribute(t,n),this.b.fromBufferAttribute(t,i),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Wi.subVectors(this.c,this.b),Ys.subVectors(this.a,this.b),Wi.cross(Ys).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return e.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,n){return e.getBarycoord(t,this.a,this.b,this.c,n)}getInterpolation(t,n,i,s,a){return e.getInterpolation(t,this.a,this.b,this.c,n,i,s,a)}containsPoint(t){return e.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return e.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,n){let i=this.a,s=this.b,a=this.c,r,o;Yo.subVectors(s,i),Zo.subVectors(a,i),K0.subVectors(t,i);let l=Yo.dot(K0),c=Zo.dot(K0);if(l<=0&&c<=0)return n.copy(i);J0.subVectors(t,s);let h=Yo.dot(J0),d=Zo.dot(J0);if(h>=0&&d<=h)return n.copy(s);let u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return r=l/(l-h),n.copy(i).addScaledVector(Yo,r);Q0.subVectors(t,a);let p=Yo.dot(Q0),m=Zo.dot(Q0);if(m>=0&&p<=m)return n.copy(a);let S=p*c-l*m;if(S<=0&&c>=0&&m<=0)return o=c/(c-m),n.copy(i).addScaledVector(Zo,o);let g=h*m-p*d;if(g<=0&&d-h>=0&&p-m>=0)return c1.subVectors(a,s),o=(d-h)/(d-h+(p-m)),n.copy(s).addScaledVector(c1,o);let f=1/(g+S+u);return r=S*f,o=u*f,n.copy(i).addScaledVector(Yo,r).addScaledVector(Zo,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Ss=class{constructor(t=new P(1/0,1/0,1/0),n=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=n}set(t,n){return this.min.copy(t),this.max.copy(n),this}setFromArray(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n+=3)this.expandByPoint(qi.fromArray(t,n));return this}setFromBufferAttribute(t){this.makeEmpty();for(let n=0,i=t.count;n<i;n++)this.expandByPoint(qi.fromBufferAttribute(t,n));return this}setFromPoints(t){this.makeEmpty();for(let n=0,i=t.length;n<i;n++)this.expandByPoint(t[n]);return this}setFromCenterAndSize(t,n){let i=qi.copy(n).multiplyScalar(.5);return this.min.copy(t).sub(i),this.max.copy(t).add(i),this}setFromObject(t,n=!1){return this.makeEmpty(),this.expandByObject(t,n)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,n=!1){t.updateWorldMatrix(!1,!1);let i=t.geometry;if(i!==void 0){let a=i.getAttribute("position");if(n===!0&&a!==void 0&&t.isInstancedMesh!==!0)for(let r=0,o=a.count;r<o;r++)t.isMesh===!0?t.getVertexPosition(r,qi):qi.fromBufferAttribute(a,r),qi.applyMatrix4(t.matrixWorld),this.expandByPoint(qi);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),Td.copy(t.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Td.copy(i.boundingBox)),Td.applyMatrix4(t.matrixWorld),this.union(Td)}let s=t.children;for(let a=0,r=s.length;a<r;a++)this.expandByObject(s[a],n);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,n){return n.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,qi),qi.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let n,i;return t.normal.x>0?(n=t.normal.x*this.min.x,i=t.normal.x*this.max.x):(n=t.normal.x*this.max.x,i=t.normal.x*this.min.x),t.normal.y>0?(n+=t.normal.y*this.min.y,i+=t.normal.y*this.max.y):(n+=t.normal.y*this.max.y,i+=t.normal.y*this.min.y),t.normal.z>0?(n+=t.normal.z*this.min.z,i+=t.normal.z*this.max.z):(n+=t.normal.z*this.max.z,i+=t.normal.z*this.min.z),n<=-t.constant&&i>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(Uc),wd.subVectors(this.max,Uc),jo.subVectors(t.a,Uc),Ko.subVectors(t.b,Uc),Jo.subVectors(t.c,Uc),Ga.subVectors(Ko,jo),Ha.subVectors(Jo,Ko),Cr.subVectors(jo,Jo);let n=[0,-Ga.z,Ga.y,0,-Ha.z,Ha.y,0,-Cr.z,Cr.y,Ga.z,0,-Ga.x,Ha.z,0,-Ha.x,Cr.z,0,-Cr.x,-Ga.y,Ga.x,0,-Ha.y,Ha.x,0,-Cr.y,Cr.x,0];return!nv(n,jo,Ko,Jo,wd)||(n=[1,0,0,0,1,0,0,0,1],!nv(n,jo,Ko,Jo,wd))?!1:(Ad.crossVectors(Ga,Ha),n=[Ad.x,Ad.y,Ad.z],nv(n,jo,Ko,Jo,wd))}clampPoint(t,n){return n.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,qi).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(qi).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(js[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),js[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),js[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),js[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),js[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),js[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),js[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),js[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(js),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},js=[new P,new P,new P,new P,new P,new P,new P,new P],qi=new P,Td=new Ss,jo=new P,Ko=new P,Jo=new P,Ga=new P,Ha=new P,Cr=new P,Uc=new P,wd=new P,Ad=new P,Rr=new P;function nv(e,t,n,i,s){for(let a=0,r=e.length-3;a<=r;a+=3){Rr.fromArray(e,a);let o=s.x*Math.abs(Rr.x)+s.y*Math.abs(Rr.y)+s.z*Math.abs(Rr.z),l=t.dot(Rr),c=n.dot(Rr),h=i.dot(Rr);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var tn=new P,Cd=new Ut,PR=0,Vn=class extends ji{constructor(t,n,i=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:PR++}),this.name="",this.array=t,this.itemSize=n,this.count=t!==void 0?t.length/n:0,this.normalized=i,this.usage=Hv,this.updateRanges=[],this.gpuType=Qi,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,n,i){t*=this.itemSize,i*=n.itemSize;for(let s=0,a=this.itemSize;s<a;s++)this.array[t+s]=n.array[i+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let n=0,i=this.count;n<i;n++)Cd.fromBufferAttribute(this,n),Cd.applyMatrix3(t),this.setXY(n,Cd.x,Cd.y);else if(this.itemSize===3)for(let n=0,i=this.count;n<i;n++)tn.fromBufferAttribute(this,n),tn.applyMatrix3(t),this.setXYZ(n,tn.x,tn.y,tn.z);return this}applyMatrix4(t){for(let n=0,i=this.count;n<i;n++)tn.fromBufferAttribute(this,n),tn.applyMatrix4(t),this.setXYZ(n,tn.x,tn.y,tn.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)tn.fromBufferAttribute(this,n),tn.applyNormalMatrix(t),this.setXYZ(n,tn.x,tn.y,tn.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)tn.fromBufferAttribute(this,n),tn.transformDirection(t),this.setXYZ(n,tn.x,tn.y,tn.z);return this}set(t,n=0){return this.array.set(t,n),this}getComponent(t,n){let i=this.array[t*this.itemSize+n];return this.normalized&&(i=Yi(i,this.array)),i}setComponent(t,n,i){return this.normalized&&(i=Se(i,this.array)),this.array[t*this.itemSize+n]=i,this}getX(t){let n=this.array[t*this.itemSize];return this.normalized&&(n=Yi(n,this.array)),n}setX(t,n){return this.normalized&&(n=Se(n,this.array)),this.array[t*this.itemSize]=n,this}getY(t){let n=this.array[t*this.itemSize+1];return this.normalized&&(n=Yi(n,this.array)),n}setY(t,n){return this.normalized&&(n=Se(n,this.array)),this.array[t*this.itemSize+1]=n,this}getZ(t){let n=this.array[t*this.itemSize+2];return this.normalized&&(n=Yi(n,this.array)),n}setZ(t,n){return this.normalized&&(n=Se(n,this.array)),this.array[t*this.itemSize+2]=n,this}getW(t){let n=this.array[t*this.itemSize+3];return this.normalized&&(n=Yi(n,this.array)),n}setW(t,n){return this.normalized&&(n=Se(n,this.array)),this.array[t*this.itemSize+3]=n,this}setXY(t,n,i){return t*=this.itemSize,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array)),this.array[t+0]=n,this.array[t+1]=i,this}setXYZ(t,n,i,s){return t*=this.itemSize,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array),s=Se(s,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this}setXYZW(t,n,i,s,a){return t*=this.itemSize,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array),s=Se(s,this.array),a=Se(a,this.array)),this.array[t+0]=n,this.array[t+1]=i,this.array[t+2]=s,this.array[t+3]=a,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var Jc=class extends Vn{constructor(t,n,i){super(new Uint16Array(t),n,i)}};var Qc=class extends Vn{constructor(t,n,i){super(new Uint32Array(t),n,i)}};var Un=class extends Vn{constructor(t,n,i){super(new Float32Array(t),n,i)}},BR=new Ss,Ic=new P,iv=new P,bs=class{constructor(t=new P,n=-1){this.isSphere=!0,this.center=t,this.radius=n}set(t,n){return this.center.copy(t),this.radius=n,this}setFromPoints(t,n){let i=this.center;n!==void 0?i.copy(n):BR.setFromPoints(t).getCenter(i);let s=0;for(let a=0,r=t.length;a<r;a++)s=Math.max(s,i.distanceToSquared(t[a]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let n=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=n*n}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,n){let i=this.center.distanceToSquared(t);return n.copy(t),i>this.radius*this.radius&&(n.sub(this.center).normalize(),n.multiplyScalar(this.radius).add(this.center)),n}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ic.subVectors(t,this.center);let n=Ic.lengthSq();if(n>this.radius*this.radius){let i=Math.sqrt(n),s=(i-this.radius)*.5;this.center.addScaledVector(Ic,s/i),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(iv.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ic.copy(t.center).add(iv)),this.expandByPoint(Ic.copy(t.center).sub(iv))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},zR=0,Oi=new Fe,sv=new Xn,Qo=new P,gi=new Ss,Oc=new Ss,dn=new P,pn=class e extends ji{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:zR++}),this.uuid=$s(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(lR(t)?Qc:Jc)(t,1):this.index=t,this}setIndirect(t,n=0){return this.indirect=t,this.indirectOffset=n,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,n){return this.attributes[t]=n,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,n,i=0){this.groups.push({start:t,count:n,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(t,n){this.drawRange.start=t,this.drawRange.count=n}applyMatrix4(t){let n=this.attributes.position;n!==void 0&&(n.applyMatrix4(t),n.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let a=new Vt().getNormalMatrix(t);i.applyNormalMatrix(a),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Oi.makeRotationFromQuaternion(t),this.applyMatrix4(Oi),this}rotateX(t){return Oi.makeRotationX(t),this.applyMatrix4(Oi),this}rotateY(t){return Oi.makeRotationY(t),this.applyMatrix4(Oi),this}rotateZ(t){return Oi.makeRotationZ(t),this.applyMatrix4(Oi),this}translate(t,n,i){return Oi.makeTranslation(t,n,i),this.applyMatrix4(Oi),this}scale(t,n,i){return Oi.makeScale(t,n,i),this.applyMatrix4(Oi),this}lookAt(t){return sv.lookAt(t),sv.updateMatrix(),this.applyMatrix4(sv.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Qo).negate(),this.translate(Qo.x,Qo.y,Qo.z),this}setFromPoints(t){let n=this.getAttribute("position");if(n===void 0){let i=[];for(let s=0,a=t.length;s<a;s++){let r=t[s];i.push(r.x,r.y,r.z||0)}this.setAttribute("position",new Un(i,3))}else{let i=Math.min(t.length,n.count);for(let s=0;s<i;s++){let a=t[s];n.setXYZ(s,a.x,a.y,a.z||0)}t.length>n.count&&Ot("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),n.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ss);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Pt("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),n)for(let i=0,s=n.length;i<s;i++){let a=n[i];gi.setFromBufferAttribute(a),this.morphTargetsRelative?(dn.addVectors(this.boundingBox.min,gi.min),this.boundingBox.expandByPoint(dn),dn.addVectors(this.boundingBox.max,gi.max),this.boundingBox.expandByPoint(dn)):(this.boundingBox.expandByPoint(gi.min),this.boundingBox.expandByPoint(gi.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Pt('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new bs);let t=this.attributes.position,n=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){Pt("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new P,1/0);return}if(t){let i=this.boundingSphere.center;if(gi.setFromBufferAttribute(t),n)for(let a=0,r=n.length;a<r;a++){let o=n[a];Oc.setFromBufferAttribute(o),this.morphTargetsRelative?(dn.addVectors(gi.min,Oc.min),gi.expandByPoint(dn),dn.addVectors(gi.max,Oc.max),gi.expandByPoint(dn)):(gi.expandByPoint(Oc.min),gi.expandByPoint(Oc.max))}gi.getCenter(i);let s=0;for(let a=0,r=t.count;a<r;a++)dn.fromBufferAttribute(t,a),s=Math.max(s,i.distanceToSquared(dn));if(n)for(let a=0,r=n.length;a<r;a++){let o=n[a],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)dn.fromBufferAttribute(o,c),l&&(Qo.fromBufferAttribute(t,c),dn.add(Qo)),s=Math.max(s,i.distanceToSquared(dn))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&Pt('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,n=this.attributes;if(t===null||n.position===void 0||n.normal===void 0||n.uv===void 0){Pt("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=n.position,s=n.normal,a=n.uv,r=this.getAttribute("tangent");(r===void 0||r.count!==i.count)&&(r=new Vn(new Float32Array(4*i.count),4),this.setAttribute("tangent",r));let o=[],l=[];for(let _=0;_<i.count;_++)o[_]=new P,l[_]=new P;let c=new P,h=new P,d=new P,u=new Ut,p=new Ut,m=new Ut,S=new P,g=new P;function f(_,A,R){c.fromBufferAttribute(i,_),h.fromBufferAttribute(i,A),d.fromBufferAttribute(i,R),u.fromBufferAttribute(a,_),p.fromBufferAttribute(a,A),m.fromBufferAttribute(a,R),h.sub(c),d.sub(c),p.sub(u),m.sub(u);let O=1/(p.x*m.y-m.x*p.y);isFinite(O)&&(S.copy(h).multiplyScalar(m.y).addScaledVector(d,-p.y).multiplyScalar(O),g.copy(d).multiplyScalar(p.x).addScaledVector(h,-m.x).multiplyScalar(O),o[_].add(S),o[A].add(S),o[R].add(S),l[_].add(g),l[A].add(g),l[R].add(g))}let v=this.groups;v.length===0&&(v=[{start:0,count:t.count}]);for(let _=0,A=v.length;_<A;++_){let R=v[_],O=R.start,F=R.count;for(let z=O,I=O+F;z<I;z+=3)f(t.getX(z+0),t.getX(z+1),t.getX(z+2))}let b=new P,y=new P,T=new P,E=new P;function w(_){T.fromBufferAttribute(s,_),E.copy(T);let A=o[_];b.copy(A),b.sub(T.multiplyScalar(T.dot(A))).normalize(),y.crossVectors(E,A);let O=y.dot(l[_])<0?-1:1;r.setXYZW(_,b.x,b.y,b.z,O)}for(let _=0,A=v.length;_<A;++_){let R=v[_],O=R.start,F=R.count;for(let z=O,I=O+F;z<I;z+=3)w(t.getX(z+0)),w(t.getX(z+1)),w(t.getX(z+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,n=this.getAttribute("position");if(n!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==n.count)i=new Vn(new Float32Array(n.count*3),3),this.setAttribute("normal",i);else for(let u=0,p=i.count;u<p;u++)i.setXYZ(u,0,0,0);let s=new P,a=new P,r=new P,o=new P,l=new P,c=new P,h=new P,d=new P;if(t)for(let u=0,p=t.count;u<p;u+=3){let m=t.getX(u+0),S=t.getX(u+1),g=t.getX(u+2);s.fromBufferAttribute(n,m),a.fromBufferAttribute(n,S),r.fromBufferAttribute(n,g),h.subVectors(r,a),d.subVectors(s,a),h.cross(d),o.fromBufferAttribute(i,m),l.fromBufferAttribute(i,S),c.fromBufferAttribute(i,g),o.add(h),l.add(h),c.add(h),i.setXYZ(m,o.x,o.y,o.z),i.setXYZ(S,l.x,l.y,l.z),i.setXYZ(g,c.x,c.y,c.z)}else for(let u=0,p=n.count;u<p;u+=3)s.fromBufferAttribute(n,u+0),a.fromBufferAttribute(n,u+1),r.fromBufferAttribute(n,u+2),h.subVectors(r,a),d.subVectors(s,a),h.cross(d),i.setXYZ(u+0,h.x,h.y,h.z),i.setXYZ(u+1,h.x,h.y,h.z),i.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let n=0,i=t.count;n<i;n++)dn.fromBufferAttribute(t,n),dn.normalize(),t.setXYZ(n,dn.x,dn.y,dn.z)}toNonIndexed(){function t(o,l){let c=o.array,h=o.itemSize,d=o.normalized,u=new c.constructor(l.length*h),p=0,m=0;for(let S=0,g=l.length;S<g;S++){o.isInterleavedBufferAttribute?p=l[S]*o.data.stride+o.offset:p=l[S]*h;for(let f=0;f<h;f++)u[m++]=c[p++]}return new Vn(u,h,d)}if(this.index===null)return Ot("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let n=new e,i=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,i);n.setAttribute(o,c)}let a=this.morphAttributes;for(let o in a){let l=[],c=a[o];for(let h=0,d=c.length;h<d;h++){let u=c[h],p=t(u,i);l.push(p)}n.morphAttributes[o]=l}n.morphTargetsRelative=this.morphTargetsRelative;let r=this.groups;for(let o=0,l=r.length;o<l;o++){let c=r[o];n.addGroup(c.start,c.count,c.materialIndex)}return n}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let n=this.index;n!==null&&(t.data.index={type:n.array.constructor.name,array:Array.prototype.slice.call(n.array)});let i=this.attributes;for(let l in i){let c=i[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},a=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){let p=c[d];h.push(p.toJSON(t.data))}h.length>0&&(s[l]=h,a=!0)}a&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let r=this.groups;r.length>0&&(t.data.groups=JSON.parse(JSON.stringify(r)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let n={};this.name=t.name;let i=t.index;i!==null&&this.setIndex(i.clone());let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(n))}let a=t.morphAttributes;for(let c in a){let h=[],d=a[c];for(let u=0,p=d.length;u<p;u++)h.push(d[u].clone(n));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let r=t.groups;for(let c=0,h=r.length;c<h;c++){let d=r[c];this.addGroup(d.start,d.count,d.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}},uf=class{constructor(t,n){this.isInterleavedBuffer=!0,this.array=t,this.stride=n,this.count=t!==void 0?t.length/n:0,this.usage=Hv,this.updateRanges=[],this.version=0,this.uuid=$s()}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,n){this.updateRanges.push({start:t,count:n})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.array=new t.array.constructor(t.array),this.count=t.count,this.stride=t.stride,this.usage=t.usage,this}copyAt(t,n,i){t*=this.stride,i*=n.stride;for(let s=0,a=this.stride;s<a;s++)this.array[t+s]=n.array[i+s];return this}set(t,n=0){return this.array.set(t,n),this}clone(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=$s()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let n=new this.array.constructor(t.arrayBuffers[this.array.buffer._uuid]),i=new this.constructor(n,this.stride);return i.setUsage(this.usage),i}onUpload(t){return this.onUploadCallback=t,this}toJSON(t){t.arrayBuffers===void 0&&(t.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=$s()),t.arrayBuffers[this.array.buffer._uuid]===void 0&&(t.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer)));let n={uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride};return n.usage=this.usage,n}},Hn=new P,$c=class e{constructor(t,n,i,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=t,this.itemSize=n,this.offset=i,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(t){this.data.needsUpdate=t}applyMatrix4(t){for(let n=0,i=this.data.count;n<i;n++)Hn.fromBufferAttribute(this,n),Hn.applyMatrix4(t),this.setXYZ(n,Hn.x,Hn.y,Hn.z);return this}applyNormalMatrix(t){for(let n=0,i=this.count;n<i;n++)Hn.fromBufferAttribute(this,n),Hn.applyNormalMatrix(t),this.setXYZ(n,Hn.x,Hn.y,Hn.z);return this}transformDirection(t){for(let n=0,i=this.count;n<i;n++)Hn.fromBufferAttribute(this,n),Hn.transformDirection(t),this.setXYZ(n,Hn.x,Hn.y,Hn.z);return this}getComponent(t,n){let i=this.array[t*this.data.stride+this.offset+n];return this.normalized&&(i=Yi(i,this.array)),i}setComponent(t,n,i){return this.normalized&&(i=Se(i,this.array)),this.data.array[t*this.data.stride+this.offset+n]=i,this}setX(t,n){return this.normalized&&(n=Se(n,this.array)),this.data.array[t*this.data.stride+this.offset]=n,this}setY(t,n){return this.normalized&&(n=Se(n,this.array)),this.data.array[t*this.data.stride+this.offset+1]=n,this}setZ(t,n){return this.normalized&&(n=Se(n,this.array)),this.data.array[t*this.data.stride+this.offset+2]=n,this}setW(t,n){return this.normalized&&(n=Se(n,this.array)),this.data.array[t*this.data.stride+this.offset+3]=n,this}getX(t){let n=this.data.array[t*this.data.stride+this.offset];return this.normalized&&(n=Yi(n,this.array)),n}getY(t){let n=this.data.array[t*this.data.stride+this.offset+1];return this.normalized&&(n=Yi(n,this.array)),n}getZ(t){let n=this.data.array[t*this.data.stride+this.offset+2];return this.normalized&&(n=Yi(n,this.array)),n}getW(t){let n=this.data.array[t*this.data.stride+this.offset+3];return this.normalized&&(n=Yi(n,this.array)),n}setXY(t,n,i){return t=t*this.data.stride+this.offset,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array)),this.data.array[t+0]=n,this.data.array[t+1]=i,this}setXYZ(t,n,i,s){return t=t*this.data.stride+this.offset,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array),s=Se(s,this.array)),this.data.array[t+0]=n,this.data.array[t+1]=i,this.data.array[t+2]=s,this}setXYZW(t,n,i,s,a){return t=t*this.data.stride+this.offset,this.normalized&&(n=Se(n,this.array),i=Se(i,this.array),s=Se(s,this.array),a=Se(a,this.array)),this.data.array[t+0]=n,this.data.array[t+1]=i,this.data.array[t+2]=s,this.data.array[t+3]=a,this}clone(t){if(t===void 0){Yc("InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let n=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)n.push(this.data.array[s+a])}return new Vn(new this.array.constructor(n),this.itemSize,this.normalized)}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.clone(t)),new e(t.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(t){if(t===void 0){Yc("InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let n=[];for(let i=0;i<this.count;i++){let s=i*this.data.stride+this.offset;for(let a=0;a<this.itemSize;a++)n.push(this.data.array[s+a])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:n,normalized:this.normalized}}else return t.interleavedBuffers===void 0&&(t.interleavedBuffers={}),t.interleavedBuffers[this.data.uuid]===void 0&&(t.interleavedBuffers[this.data.uuid]=this.data.toJSON(t)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}},av=new P,FR=new P,GR=new Vt,vi=class{constructor(t=new P(1,0,0),n=0){this.isPlane=!0,this.normal=t,this.constant=n}set(t,n){return this.normal.copy(t),this.constant=n,this}setComponents(t,n,i,s){return this.normal.set(t,n,i),this.constant=s,this}setFromNormalAndCoplanarPoint(t,n){return this.normal.copy(t),this.constant=-n.dot(this.normal),this}setFromCoplanarPoints(t,n,i){let s=av.subVectors(i,n).cross(FR.subVectors(t,n)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,n){return n.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,n,i=!0){let s=t.delta(av),a=this.normal.dot(s);if(a===0)return this.distanceToPoint(t.start)===0?n.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/a;return i===!0&&(r<0||r>1)?null:n.copy(t.start).addScaledVector(s,r)}intersectsLine(t){let n=this.distanceToPoint(t.start),i=this.distanceToPoint(t.end);return n<0&&i>0||i<0&&n>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,n){let i=n||GR.getNormalMatrix(t),s=this.coplanarPoint(av).applyMatrix4(t),a=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(a),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},HR=0,Ms=class extends ji{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:HR++}),this.uuid=$s(),this.name="",this.type="Material",this.blending=xl,this.side=Ja,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=bv,this.blendDst=Mv,this.blendEquation=Or,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Wt(0,0,0),this.blendAlpha=0,this.depthFunc=ol,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=J1,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=jd,this.stencilZFail=jd,this.stencilZPass=jd,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let n in t){let i=t[n];if(i===void 0){Ot(`Material: parameter '${n}' has value of undefined.`);continue}let s=this[n];if(s===void 0){Ot(`Material: '${n}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[n]=i}}toJSON(t){let n=t===void 0||typeof t=="string";n&&(t={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(t).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(t).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(t).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(t).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(t).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(a=>a.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(a){let r=[];for(let o in a){let l=a[o];delete l.metadata,r.push(l)}return r}if(n){let a=s(t.textures),r=s(t.images);a.length>0&&(i.textures=a),r.length>0&&(i.images=r)}return i}fromJSON(t,n){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new Wt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(i=>new vi().fromJSON(i))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=n[t.map]||null),t.matcap!==void 0&&(this.matcap=n[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=n[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=n[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=n[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let i=t.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new Ut().fromArray(i)}return t.displacementMap!==void 0&&(this.displacementMap=n[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=n[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=n[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=n[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=n[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=n[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=n[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=n[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=n[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=n[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=n[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=n[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=n[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=n[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ut().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=n[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=n[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=n[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=n[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=n[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=n[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=n[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let n=t.clippingPlanes,i=null;if(n!==null){let s=n.length;i=new Array(s);for(let a=0;a!==s;++a)i[a]=n[a].clone()}return this.clippingPlanes=i,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}},Ur=class extends Ms{constructor(t){super(),this.isSpriteMaterial=!0,this.type="SpriteMaterial",this.color=new Wt(16777215),this.map=null,this.alphaMap=null,this.rotation=0,this.sizeAttenuation=!0,this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.rotation=t.rotation,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},$o,Pc=new P,tl=new P,el=new P,nl=new Ut,Bc=new Ut,cE=new Fe,Rd=new P,zc=new P,Nd=new P,u1=new Ut,rv=new Ut,h1=new Ut,fl=class extends Xn{constructor(t=new Ur){if(super(),this.isSprite=!0,this.type="Sprite",$o===void 0){$o=new pn;let n=new Float32Array([-.5,-.5,0,0,0,.5,-.5,0,1,0,.5,.5,0,1,1,-.5,.5,0,0,1]),i=new uf(n,5);$o.setIndex([0,1,2,0,2,3]),$o.setAttribute("position",new $c(i,3,0,!1)),$o.setAttribute("uv",new $c(i,2,3,!1))}this.geometry=$o,this.material=t,this.center=new Ut(.5,.5),this.count=1}intersectsFrustum(t){return t.intersectsSprite(this)}raycast(t,n){t.camera===null&&Pt('Sprite: "Raycaster.camera" needs to be set in order to raycast against sprites.'),tl.setFromMatrixScale(this.matrixWorld),cE.copy(t.camera.matrixWorld),this.modelViewMatrix.multiplyMatrices(t.camera.matrixWorldInverse,this.matrixWorld),el.setFromMatrixPosition(this.modelViewMatrix),t.camera.isPerspectiveCamera&&this.material.sizeAttenuation===!1&&tl.multiplyScalar(-el.z);let i=this.material.rotation,s,a;i!==0&&(a=Math.cos(i),s=Math.sin(i));let r=this.center;Dd(Rd.set(-.5,-.5,0),el,r,tl,s,a),Dd(zc.set(.5,-.5,0),el,r,tl,s,a),Dd(Nd.set(.5,.5,0),el,r,tl,s,a),u1.set(0,0),rv.set(1,0),h1.set(1,1);let o=t.ray.intersectTriangle(Rd,zc,Nd,!1,Pc);if(o===null&&(Dd(zc.set(-.5,.5,0),el,r,tl,s,a),rv.set(0,1),o=t.ray.intersectTriangle(Rd,Nd,zc,!1,Pc),o===null))return;let l=t.ray.origin.distanceTo(Pc);l<t.near||l>t.far||n.push({distance:l,point:Pc.clone(),uv:Js.getInterpolation(Pc,Rd,zc,Nd,u1,rv,h1,new Ut),face:null,object:this})}copy(t,n){return super.copy(t,n),t.center!==void 0&&this.center.copy(t.center),this.material=t.material,this}};function Dd(e,t,n,i,s,a){nl.subVectors(e,n).addScalar(.5).multiply(i),s!==void 0?(Bc.x=a*nl.x-s*nl.y,Bc.y=s*nl.x+a*nl.y):Bc.copy(nl),e.copy(t),e.x+=Bc.x,e.y+=Bc.y,e.applyMatrix4(cE)}var Ks=new P,ov=new P,Ld=new P,Ud=new P,ea=class{constructor(t=new P,n=new P(0,0,-1)){this.origin=t,this.direction=n}set(t,n){return this.origin.copy(t),this.direction.copy(n),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,n){return n.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ks)),this}closestPointToPoint(t,n){n.subVectors(t,this.origin);let i=n.dot(this.direction);return i<0?n.copy(this.origin):n.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let n=Ks.subVectors(t,this.origin).dot(this.direction);return n<0?this.origin.distanceToSquared(t):(Ks.copy(this.origin).addScaledVector(this.direction,n),Ks.distanceToSquared(t))}distanceSqToSegment(t,n,i,s){ov.copy(t).add(n).multiplyScalar(.5),Ld.copy(n).sub(t).normalize(),Ud.copy(this.origin).sub(ov);let a=t.distanceTo(n)*.5,r=-this.direction.dot(Ld),o=Ud.dot(this.direction),l=-Ud.dot(Ld),c=Ud.lengthSq(),h=Math.abs(1-r*r),d,u,p,m;if(h>0)if(d=r*l-o,u=r*o-l,m=a*h,d>=0)if(u>=-m)if(u<=m){let S=1/h;d*=S,u*=S,p=d*(d+r*u+2*o)+u*(r*d+u+2*l)+c}else u=a,d=Math.max(0,-(r*u+o)),p=-d*d+u*(u+2*l)+c;else u=-a,d=Math.max(0,-(r*u+o)),p=-d*d+u*(u+2*l)+c;else u<=-m?(d=Math.max(0,-(-r*a+o)),u=d>0?-a:Math.min(Math.max(-a,-l),a),p=-d*d+u*(u+2*l)+c):u<=m?(d=0,u=Math.min(Math.max(-a,-l),a),p=u*(u+2*l)+c):(d=Math.max(0,-(r*a+o)),u=d>0?a:Math.min(Math.max(-a,-l),a),p=-d*d+u*(u+2*l)+c);else u=r>0?-a:a,d=Math.max(0,-(r*u+o)),p=-d*d+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(ov).addScaledVector(Ld,u),p}intersectSphere(t,n){if(t.radius<0)return null;Ks.subVectors(t.center,this.origin);let i=Ks.dot(this.direction),s=Ks.dot(Ks)-i*i,a=t.radius*t.radius;if(s>a)return null;let r=Math.sqrt(a-s),o=i-r,l=i+r;return l<0?null:o<0?this.at(l,n):this.at(o,n)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let n=t.normal.dot(this.direction);if(n===0)return t.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(t.normal)+t.constant)/n;return i>=0?i:null}intersectPlane(t,n){let i=this.distanceToPlane(t);return i===null?null:this.at(i,n)}intersectsPlane(t){let n=t.distanceToPoint(this.origin);return n===0||t.normal.dot(this.direction)*n<0}intersectBox(t,n){let i,s,a,r,o,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(i=(t.min.x-u.x)*c,s=(t.max.x-u.x)*c):(i=(t.max.x-u.x)*c,s=(t.min.x-u.x)*c),h>=0?(a=(t.min.y-u.y)*h,r=(t.max.y-u.y)*h):(a=(t.max.y-u.y)*h,r=(t.min.y-u.y)*h),i>r||a>s||((a>i||isNaN(i))&&(i=a),(r<s||isNaN(s))&&(s=r),d>=0?(o=(t.min.z-u.z)*d,l=(t.max.z-u.z)*d):(o=(t.max.z-u.z)*d,l=(t.min.z-u.z)*d),i>l||o>s)||((o>i||i!==i)&&(i=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,n)}intersectsBox(t){return this.intersectBox(t,Ks)!==null}intersectTriangle(t,n,i,s,a){let r=this.origin,o=this.direction,l=o.x,c=o.y,h=o.z,d=t.x-r.x,u=t.y-r.y,p=t.z-r.z,m=n.x-r.x,S=n.y-r.y,g=n.z-r.z,f=i.x-r.x,v=i.y-r.y,b=i.z-r.z,y=Math.abs(l),T=Math.abs(c),E=Math.abs(h),w,_,A,R,O,F,z,I,X,Y,j,at;if(y>=T&&y>=E?(A=l,F=d,X=m,at=f,l>=0?(w=c,_=h,R=u,O=p,z=S,I=g,Y=v,j=b):(w=h,_=c,R=p,O=u,z=g,I=S,Y=b,j=v)):T>=E?(A=c,F=u,X=S,at=v,c>=0?(w=h,_=l,R=p,O=d,z=g,I=m,Y=b,j=f):(w=l,_=h,R=d,O=p,z=m,I=g,Y=f,j=b)):(A=h,F=p,X=g,at=b,h>=0?(w=l,_=c,R=d,O=u,z=m,I=S,Y=f,j=v):(w=c,_=l,R=u,O=d,z=S,I=m,Y=v,j=f)),A===0)return null;let Z=w/A,nt=_/A,st=1/A,Dt=R-Z*F,At=O-nt*F,se=z-Z*X,Kt=I-nt*X,re=Y-Z*at,K=j-nt*at,et=re*Kt-K*se,xt=Dt*K-At*re,Bt=se*At-Kt*Dt;if(s){if(et<0||xt<0||Bt<0)return null}else if((et<0||xt<0||Bt<0)&&(et>0||xt>0||Bt>0))return null;let yt=et+xt+Bt;if(yt===0)return null;let Ft=st*(et*F+xt*X+Bt*at);return(yt>0?Ft<0:Ft>0)?null:this.at(Ft/yt,a)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Xa=class extends Ms{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Wt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ka,this.combine=Ev,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},d1=new Fe,Nr=new ea,Id=new bs,f1=new P,Od=new P,Pd=new P,Bd=new P,lv=new P,zd=new P,p1=new P,Fd=new P,Wn=class extends Xn{constructor(t=new pn,n=new Xa){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}getVertexPosition(t,n){let i=this.geometry,s=i.attributes.position,a=i.morphAttributes.position,r=i.morphTargetsRelative;n.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(a&&o){zd.set(0,0,0);for(let l=0,c=a.length;l<c;l++){let h=o[l],d=a[l];h!==0&&(lv.fromBufferAttribute(d,t),r?zd.addScaledVector(lv,h):zd.addScaledVector(lv.sub(n),h))}n.add(zd)}return n}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.material,a=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Id.copy(i.boundingSphere),Id.applyMatrix4(a),Nr.copy(t.ray).recast(t.near),!(Id.containsPoint(Nr.origin)===!1&&(Nr.intersectSphere(Id,f1)===null||Nr.origin.distanceToSquared(f1)>(t.far-t.near)**2))&&(d1.copy(a).invert(),Nr.copy(t.ray).applyMatrix4(d1),!(i.boundingBox!==null&&Nr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(t,n,Nr)))}_computeIntersections(t,n,i){let s,a=this.geometry,r=this.material,o=a.index,l=a.attributes.position,c=a.attributes.uv,h=a.attributes.uv1,d=a.attributes.normal,u=a.groups,p=a.drawRange;if(o!==null)if(Array.isArray(r))for(let m=0,S=u.length;m<S;m++){let g=u[m],f=r[g.materialIndex],v=Math.max(g.start,p.start),b=Math.min(o.count,Math.min(g.start+g.count,p.start+p.count));for(let y=v,T=b;y<T;y+=3){let E=o.getX(y),w=o.getX(y+1),_=o.getX(y+2);s=Gd(this,f,t,i,c,h,d,E,w,_),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=g.materialIndex,n.push(s))}}else{let m=Math.max(0,p.start),S=Math.min(o.count,p.start+p.count);for(let g=m,f=S;g<f;g+=3){let v=o.getX(g),b=o.getX(g+1),y=o.getX(g+2);s=Gd(this,r,t,i,c,h,d,v,b,y),s&&(s.faceIndex=Math.floor(g/3),n.push(s))}}else if(l!==void 0)if(Array.isArray(r))for(let m=0,S=u.length;m<S;m++){let g=u[m],f=r[g.materialIndex],v=Math.max(g.start,p.start),b=Math.min(l.count,Math.min(g.start+g.count,p.start+p.count));for(let y=v,T=b;y<T;y+=3){let E=y,w=y+1,_=y+2;s=Gd(this,f,t,i,c,h,d,E,w,_),s&&(s.faceIndex=Math.floor(y/3),s.face.materialIndex=g.materialIndex,n.push(s))}}else{let m=Math.max(0,p.start),S=Math.min(l.count,p.start+p.count);for(let g=m,f=S;g<f;g+=3){let v=g,b=g+1,y=g+2;s=Gd(this,r,t,i,c,h,d,v,b,y),s&&(s.faceIndex=Math.floor(g/3),n.push(s))}}}};function VR(e,t,n,i,s,a,r,o){let l;if(t.side===qn?l=i.intersectTriangle(r,a,s,!0,o):l=i.intersectTriangle(s,a,r,t.side===Ja,o),l===null)return null;Fd.copy(o),Fd.applyMatrix4(e.matrixWorld);let c=n.ray.origin.distanceTo(Fd);return c<n.near||c>n.far?null:{distance:c,point:Fd.clone(),object:e}}function Gd(e,t,n,i,s,a,r,o,l,c){e.getVertexPosition(o,Od),e.getVertexPosition(l,Pd),e.getVertexPosition(c,Bd);let h=VR(e,t,n,i,Od,Pd,Bd,p1);if(h){let d=new P;Js.getBarycoord(p1,Od,Pd,Bd,d),s&&(h.uv=Js.getInterpolatedAttribute(s,o,l,c,d,new Ut)),a&&(h.uv1=Js.getInterpolatedAttribute(a,o,l,c,d,new Ut)),r&&(h.normal=Js.getInterpolatedAttribute(r,o,l,c,d,new P),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new P,materialIndex:0};Js.getNormal(Od,Pd,Bd,u.normal),h.face=u,h.barycoord=d}return h}var hf=class extends kn{constructor(t=null,n=1,i=1,s,a,r,o,l,c=fn,h=fn,d,u){super(null,r,o,l,c,h,s,a,d,u),this.isDataTexture=!0,this.image={data:t,width:n,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Dr=new bs,kR=new Ut(.5,.5),Hd=new P,tu=class{constructor(t=new vi,n=new vi,i=new vi,s=new vi,a=new vi,r=new vi){this.planes=[t,n,i,s,a,r]}set(t,n,i,s,a,r){let o=this.planes;return o[0].copy(t),o[1].copy(n),o[2].copy(i),o[3].copy(s),o[4].copy(a),o[5].copy(r),this}copy(t){let n=this.planes;for(let i=0;i<6;i++)n[i].copy(t.planes[i]);return this}setFromProjectionMatrix(t,n=Zi,i=!1){let s=this.planes,a=t.elements,r=a[0],o=a[1],l=a[2],c=a[3],h=a[4],d=a[5],u=a[6],p=a[7],m=a[8],S=a[9],g=a[10],f=a[11],v=a[12],b=a[13],y=a[14],T=a[15];if(s[0].setComponents(c-r,p-h,f-m,T-v).normalize(),s[1].setComponents(c+r,p+h,f+m,T+v).normalize(),s[2].setComponents(c+o,p+d,f+S,T+b).normalize(),s[3].setComponents(c-o,p-d,f-S,T-b).normalize(),i)s[4].setComponents(l,u,g,y).normalize(),s[5].setComponents(c-l,p-u,f-g,T-y).normalize();else if(s[4].setComponents(c-l,p-u,f-g,T-y).normalize(),n===Zi)s[5].setComponents(c+l,p+u,f+g,T+y).normalize();else if(n===Wc)s[5].setComponents(l,u,g,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+n);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Dr.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let n=t.geometry;n.boundingSphere===null&&n.computeBoundingSphere(),Dr.copy(n.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Dr)}intersectsSprite(t){Dr.center.set(0,0,0);let n=kR.distanceTo(t.center);return Dr.radius=.7071067811865476+n,Dr.applyMatrix4(t.matrixWorld),this.intersectsSphere(Dr)}intersectsSphere(t){let n=this.planes,i=t.center,s=-t.radius;for(let a=0;a<6;a++)if(n[a].distanceToPoint(i)<s)return!1;return!0}intersectsBox(t){let n=this.planes;for(let i=0;i<6;i++){let s=n[i];if(Hd.x=s.normal.x>0?t.max.x:t.min.x,Hd.y=s.normal.y>0?t.max.y:t.min.y,Hd.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Hd)<0)return!1}return!0}containsPoint(t){let n=this.planes;for(let i=0;i<6;i++)if(n[i].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ir=class extends Ms{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Wt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},df=new P,ff=new P,m1=new Fe,Fc=new ea,Vd=new bs,cv=new P,g1=new P,pl=class extends Xn{constructor(t=new pn,n=new Ir){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let n=t.attributes.position,i=[0];for(let s=1,a=n.count;s<a;s++)df.fromBufferAttribute(n,s-1),ff.fromBufferAttribute(n,s),i[s]=i[s-1],i[s]+=df.distanceTo(ff);t.setAttribute("lineDistance",new Un(i,1))}else Ot("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.matrixWorld,a=t.params.Line.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Vd.copy(i.boundingSphere),Vd.applyMatrix4(s),Vd.radius+=a,t.ray.intersectsSphere(Vd)===!1)return;m1.copy(s).invert(),Fc.copy(t.ray).applyMatrix4(m1);let o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=this.isLineSegments?2:1,h=i.index,u=i.attributes.position;if(h!==null){let p=Math.max(0,r.start),m=Math.min(h.count,r.start+r.count);for(let S=p,g=m-1;S<g;S+=c){let f=h.getX(S),v=h.getX(S+1),b=kd(this,t,Fc,l,f,v,S);b&&n.push(b)}if(this.isLineLoop){let S=h.getX(m-1),g=h.getX(p),f=kd(this,t,Fc,l,S,g,m-1);f&&n.push(f)}}else{let p=Math.max(0,r.start),m=Math.min(u.count,r.start+r.count);for(let S=p,g=m-1;S<g;S+=c){let f=kd(this,t,Fc,l,S,S+1,S);f&&n.push(f)}if(this.isLineLoop){let S=kd(this,t,Fc,l,m-1,p,m-1);S&&n.push(S)}}}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}};function kd(e,t,n,i,s,a,r){let o=e.geometry.attributes.position;if(df.fromBufferAttribute(o,s),ff.fromBufferAttribute(o,a),n.distanceSqToSegment(df,ff,cv,g1)>i)return;cv.applyMatrix4(e.matrixWorld);let c=t.ray.origin.distanceTo(cv);if(!(c<t.near||c>t.far))return{distance:c,point:g1.clone().applyMatrix4(e.matrixWorld),index:r,face:null,faceIndex:null,barycoord:null,object:e}}var eu=class extends pl{constructor(t,n){super(t,n),this.isLineLoop=!0,this.type="LineLoop"}},ml=class extends Ms{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Wt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},v1=new Fe,mv=new ea,Xd=new bs,Wd=new P,nu=class extends Xn{constructor(t=new pn,n=new ml){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=n,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,n){return super.copy(t,n),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,n){let i=this.geometry,s=this.matrixWorld,a=t.params.Points.threshold,r=i.drawRange;if(i.boundingSphere===null&&i.computeBoundingSphere(),Xd.copy(i.boundingSphere),Xd.applyMatrix4(s),Xd.radius+=a,t.ray.intersectsSphere(Xd)===!1)return;v1.copy(s).invert(),mv.copy(t.ray).applyMatrix4(v1);let o=a/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=i.index,d=i.attributes.position;if(c!==null){let u=Math.max(0,r.start),p=Math.min(c.count,r.start+r.count);for(let m=u,S=p;m<S;m++){let g=c.getX(m);Wd.fromBufferAttribute(d,g),_1(Wd,g,l,s,t,n,this)}}else{let u=Math.max(0,r.start),p=Math.min(d.count,r.start+r.count);for(let m=u,S=p;m<S;m++)Wd.fromBufferAttribute(d,m),_1(Wd,m,l,s,t,n,this)}}updateMorphTargets(){let n=this.geometry.morphAttributes,i=Object.keys(n);if(i.length>0){let s=n[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let a=0,r=s.length;a<r;a++){let o=s[a].name||String(a);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=a}}}}};function _1(e,t,n,i,s,a,r){let o=mv.distanceSqToPoint(e);if(o<n){let l=new P;mv.closestPointToPoint(e,l),l.applyMatrix4(i);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;a.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,faceIndex:null,barycoord:null,object:r})}}var iu=class extends kn{constructor(t=[],n=Qa,i,s,a,r,o,l,c,h){super(t,n,i,s,a,r,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},gl=class extends kn{constructor(t,n,i,s,a,r,o,l,c){super(t,n,i,s,a,r,o,l,c),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Wa=class extends kn{constructor(t,n,i=Ji,s,a,r,o=fn,l=fn,c,h=xs,d=1){if(h!==xs&&h!==tr)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:t,height:n,depth:d};super(u,s,a,r,o,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new ul(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let n=super.toJSON(t);return n.compareFunction=this.compareFunction,n}},pf=class extends Wa{constructor(t,n=Ji,i=Qa,s,a,r=fn,o=fn,l,c=xs){let h={width:t,height:t,depth:1},d=[h,h,h,h,h,h];super(t,t,n,i,s,a,r,o,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},su=class extends kn{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},vl=class e extends pn{constructor(t=1,n=1,i=1,s=1,a=1,r=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:n,depth:i,widthSegments:s,heightSegments:a,depthSegments:r};let o=this;s=Math.floor(s),a=Math.floor(a),r=Math.floor(r);let l=[],c=[],h=[],d=[],u=0,p=0;m("z","y","x",-1,-1,i,n,t,r,a,0),m("z","y","x",1,-1,i,n,-t,r,a,1),m("x","z","y",1,1,t,i,n,s,r,2),m("x","z","y",1,-1,t,i,-n,s,r,3),m("x","y","z",1,-1,t,n,i,s,a,4),m("x","y","z",-1,-1,t,n,-i,s,a,5),this.setIndex(l),this.setAttribute("position",new Un(c,3)),this.setAttribute("normal",new Un(h,3)),this.setAttribute("uv",new Un(d,2));function m(S,g,f,v,b,y,T,E,w,_,A){let R=y/w,O=T/_,F=y/2,z=T/2,I=E/2,X=w+1,Y=_+1,j=0,at=0,Z=new P;for(let nt=0;nt<Y;nt++){let st=nt*O-z;for(let Dt=0;Dt<X;Dt++){let At=Dt*R-F;Z[S]=At*v,Z[g]=st*b,Z[f]=I,c.push(Z.x,Z.y,Z.z),Z[S]=0,Z[g]=0,Z[f]=E>0?1:-1,h.push(Z.x,Z.y,Z.z),d.push(Dt/w),d.push(1-nt/_),j+=1}}for(let nt=0;nt<_;nt++)for(let st=0;st<w;st++){let Dt=u+st+X*nt,At=u+st+X*(nt+1),se=u+(st+1)+X*(nt+1),Kt=u+(st+1)+X*nt;l.push(Dt,At,Kt),l.push(At,se,Kt),at+=6}o.addGroup(p,at,A),p+=at,u+=j}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var au=class e extends pn{constructor(t=1,n=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:n,widthSegments:i,heightSegments:s};let a=t/2,r=n/2,o=Math.floor(i),l=Math.floor(s),c=o+1,h=l+1,d=t/o,u=n/l,p=[],m=[],S=[],g=[];for(let f=0;f<h;f++){let v=f*u-r;for(let b=0;b<c;b++){let y=b*d-a;m.push(y,-v,0),S.push(0,0,1),g.push(b/o),g.push(1-f/l)}}for(let f=0;f<l;f++)for(let v=0;v<o;v++){let b=v+c*f,y=v+c*(f+1),T=v+1+c*(f+1),E=v+1+c*f;p.push(b,y,E),p.push(y,T,E)}this.setIndex(p),this.setAttribute("position",new Un(m,3)),this.setAttribute("normal",new Un(S,3)),this.setAttribute("uv",new Un(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.width,t.height,t.widthSegments,t.heightSegments)}};var ru=class e extends pn{constructor(t=1,n=32,i=16,s=0,a=Math.PI*2,r=0,o=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:n,heightSegments:i,phiStart:s,phiLength:a,thetaStart:r,thetaLength:o},n=Math.max(3,Math.floor(n)),i=Math.max(2,Math.floor(i));let l=Math.min(r+o,Math.PI),c=0,h=[],d=new P,u=new P,p=[],m=[],S=[],g=[];for(let f=0;f<=i;f++){let v=[],b=f/i,y=r+b*o,T=t*Math.cos(y),E=Math.sqrt(t*t-T*T),w=0;f===0&&r===0?w=.5/n:f===i&&l===Math.PI&&(w=-.5/n);for(let _=0;_<=n;_++){let A=_/n,R=s+A*a;d.x=-E*Math.cos(R),d.y=T,d.z=E*Math.sin(R),m.push(d.x,d.y,d.z),u.copy(d).normalize(),S.push(u.x,u.y,u.z),g.push(A+w,1-b),v.push(c++)}h.push(v)}for(let f=0;f<i;f++)for(let v=0;v<n;v++){let b=h[f][v+1],y=h[f][v],T=h[f+1][v],E=h[f+1][v+1];(f!==0||r>0)&&p.push(b,y,E),(f!==i-1||l<Math.PI)&&p.push(y,T,E)}this.setIndex(p),this.setAttribute("position",new Un(m,3)),this.setAttribute("normal",new Un(S,3)),this.setAttribute("uv",new Un(g,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new e(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};function Br(e){let t={};for(let n in e){t[n]={};for(let i in e[n]){let s=e[n][i];if(y1(s))s.isRenderTargetTexture?(Ot("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[n][i]=null):t[n][i]=s.clone();else if(Array.isArray(s))if(y1(s[0])){let a=[];for(let r=0,o=s.length;r<o;r++)a[r]=s[r].clone();t[n][i]=a}else t[n][i]=s.slice();else t[n][i]=s}}return t}function In(e){let t={};for(let n=0;n<e.length;n++){let i=Br(e[n]);for(let s in i)t[s]=i[s]}return t}function y1(e){return e&&(e.isColor||e.isMatrix3||e.isMatrix4||e.isVector2||e.isVector3||e.isVector4||e.isTexture||e.isQuaternion)}function XR(e){let t=[];for(let n=0;n<e.length;n++)t.push(e[n].clone());return t}function Xv(e){let t=e.getRenderTarget();return t===null?e.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:ie.workingColorSpace}var uE={clone:Br,merge:In},WR=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,qR=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,yi=class extends Ms{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=WR,this.fragmentShader=qR,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=Br(t.uniforms),this.uniformsGroups=XR(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let n=super.toJSON(t);n.glslVersion=this.glslVersion,n.uniforms={};for(let s in this.uniforms){let r=this.uniforms[s].value;r&&r.isTexture?n.uniforms[s]={type:"t",value:r.toJSON(t).uuid}:r&&r.isColor?n.uniforms[s]={type:"c",value:r.getHex()}:r&&r.isVector2?n.uniforms[s]={type:"v2",value:r.toArray()}:r&&r.isVector3?n.uniforms[s]={type:"v3",value:r.toArray()}:r&&r.isVector4?n.uniforms[s]={type:"v4",value:r.toArray()}:r&&r.isMatrix3?n.uniforms[s]={type:"m3",value:r.toArray()}:r&&r.isMatrix4?n.uniforms[s]={type:"m4",value:r.toArray()}:n.uniforms[s]={value:r}}Object.keys(this.defines).length>0&&(n.defines=this.defines),n.vertexShader=this.vertexShader,n.fragmentShader=this.fragmentShader,n.lights=this.lights,n.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(n.extensions=i),n}fromJSON(t,n){if(super.fromJSON(t,n),t.uniforms!==void 0)for(let i in t.uniforms){let s=t.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=n[s.value]||null;break;case"c":this.uniforms[i].value=new Wt().setHex(s.value);break;case"v2":this.uniforms[i].value=new Ut().fromArray(s.value);break;case"v3":this.uniforms[i].value=new P().fromArray(s.value);break;case"v4":this.uniforms[i].value=new Xe().fromArray(s.value);break;case"m3":this.uniforms[i].value=new Vt().fromArray(s.value);break;case"m4":this.uniforms[i].value=new Fe().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let i in t.extensions)this.extensions[i]=t.extensions[i];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},mf=class extends yi{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var gf=class extends Ms{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=j1,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},vf=class extends Ms{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function il(e,t){return!e||e.constructor===t?e:typeof t.BYTES_PER_ELEMENT=="number"?new t(e):Array.prototype.slice.call(e)}function uv(e){return e!==void 0&&e.inTangents!==void 0&&e.outTangents!==void 0}var qa=class{constructor(t,n,i,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new n.constructor(i),this.sampleValues=n,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(t){let n=this.parameterPositions,i=this._cachedIndex,s=n[i],a=n[i-1];t:{e:{let r;n:{i:if(!(t<s)){for(let o=i+2;;){if(s===void 0){if(t<a)break i;return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===o)break;if(a=s,s=n[++i],t<s)break e}r=n.length;break n}if(!(t>=a)){let o=n[1];t<o&&(i=2,a=o);for(let l=i-2;;){if(a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=a,a=n[--i-1],t>=a)break e}r=i,i=0;break n}break t}for(;i<r;){let o=i+r>>>1;t<n[o]?r=o:i=o+1}if(s=n[i],a=n[i-1],a===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=n.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,a,s)}return this.interpolate_(i,a,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let n=this.resultBuffer,i=this.sampleValues,s=this.valueSize,a=t*s;for(let r=0;r!==s;++r)n[r]=i[a+r];return n}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},_f=class extends qa{constructor(t,n,i,s){super(t,n,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:dv,endingEnd:dv}}intervalChanged_(t,n,i){let s=this.parameterPositions,a=t-2,r=t+1,o=s[a],l=s[r];if(o===void 0)switch(this.getSettings_().endingStart){case fv:a=t,o=2*n-i;break;case pv:a=s.length-2,o=n+s[a]-s[a+1];break;default:a=t,o=i}if(l===void 0)switch(this.getSettings_().endingEnd){case fv:r=t,l=2*i-n;break;case pv:r=1,l=i+s[1]-s[0];break;default:r=t-1,l=n}let c=(i-n)*.5,h=this.valueSize;this._weightPrev=c/(n-o),this._weightNext=c/(l-i),this._offsetPrev=a*h,this._offsetNext=r*h}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,p=this._weightNext,m=(i-n)/(s-n),S=m*m,g=S*m,f=-u*g+2*u*S-u*m,v=(1+u)*g+(-1.5-2*u)*S+(-.5+u)*m+1,b=(-1-p)*g+(1.5+p)*S+.5*m,y=p*g-p*S;for(let T=0;T!==o;++T)a[T]=f*r[h+T]+v*r[c+T]+b*r[l+T]+y*r[d+T];return a}},yf=class extends qa{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(i-n)/(s-n),d=1-h;for(let u=0;u!==o;++u)a[u]=r[c+u]*d+r[l+u]*h;return a}},xf=class extends qa{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t){return this.copySampleValue_(t-1)}},Sf=class extends qa{interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this.inTangents,d=this.outTangents;if(!h||!d){let m=(i-n)/(s-n),S=1-m;for(let g=0;g!==o;++g)a[g]=r[c+g]*S+r[l+g]*m;return a}let u=o*2,p=t-1;for(let m=0;m!==o;++m){let S=r[c+m],g=r[l+m],f=p*u+m*2,v=d[f],b=d[f+1],y=t*u+m*2,T=h[y],E=h[y+1],w=ZR(i,n,v,T,s);a[m]=hE(w,S,b,E,g)}return a}};function hE(e,t,n,i,s){let a=1-e;return a*a*a*t+3*a*a*e*n+3*a*e*e*i+e*e*e*s}function YR(e,t,n,i,s){let a=1-e;return 3*a*a*(n-t)+6*a*e*(i-n)+3*e*e*(s-i)}function ZR(e,t,n,i,s){let a=(e-t)/(s-t);for(let r=0;r<8;r++){let o=hE(a,t,n,i,s)-e;if(Math.abs(o)<1e-10)break;let l=YR(a,t,n,i,s);if(Math.abs(l)<1e-10)break;a=Math.max(0,Math.min(1,a-o/l))}return a}var xi=class{constructor(t,n,i,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(n===void 0||n.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=il(n,this.TimeBufferType),this.values=il(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let n=t.constructor,i;if(n.toJSON!==this.toJSON)i=n.toJSON(t);else{i={name:t.name,times:il(t.times,Array),values:il(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(i.interpolation=s),uv(t.settings)&&(i.settings={inTangents:il(t.settings.inTangents,Array),outTangents:il(t.settings.outTangents,Array)})}return i.type=t.ValueTypeName,i}InterpolantFactoryMethodDiscrete(t){return new xf(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new yf(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new _f(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let n=new Sf(this.times,this.values,this.getValueSize(),t);return this.settings&&(n.inTangents=this.settings.inTangents,n.outTangents=this.settings.outTangents),n}setInterpolation(t){let n;switch(t){case Vc:n=this.InterpolantFactoryMethodDiscrete;break;case rf:n=this.InterpolantFactoryMethodLinear;break;case Zd:n=this.InterpolantFactoryMethodSmooth;break;case hv:n=this.InterpolantFactoryMethodBezier;break}if(n===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Ot("KeyframeTrack:",i),this}return this.createInterpolant=n,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Vc;case this.InterpolantFactoryMethodLinear:return rf;case this.InterpolantFactoryMethodSmooth:return Zd;case this.InterpolantFactoryMethodBezier:return hv}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let n=this.times;for(let i=0,s=n.length;i!==s;++i)n[i]+=t}return this}scale(t){if(t!==1){let n=this.times;for(let i=0,s=n.length;i!==s;++i)n[i]*=t;uv(this.settings)&&(x1(this.settings.inTangents,t),x1(this.settings.outTangents,t))}return this}trim(t,n){let i=this.times,s=i.length,a=0,r=s-1;for(;a!==s&&i[a]<t;)++a;for(;r!==-1&&i[r]>n;)--r;if(++r,a!==0||r!==s){a>=r&&(r=Math.max(r,1),a=r-1);let o=this.getValueSize();this.times=i.slice(a,r),this.values=this.values.slice(a*o,r*o)}return this}validate(){let t=!0,n=this.getValueSize();n-Math.floor(n)!==0&&(Pt("KeyframeTrack: Invalid value size in track.",this),t=!1);let i=this.times,s=this.values,a=i.length;a===0&&(Pt("KeyframeTrack: Track is empty.",this),t=!1);let r=null;for(let o=0;o!==a;o++){let l=i[o];if(typeof l=="number"&&isNaN(l)){Pt("KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(r!==null&&r>l){Pt("KeyframeTrack: Out of order keys.",this,o,l,r),t=!1;break}r=l}if(s!==void 0&&cR(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){Pt("KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),n=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===Zd,a=t.length-1,r=1;for(let o=1;o<a;++o){let l=!1,c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(s)l=!0;else{let d=o*i,u=d-i,p=d+i;for(let m=0;m!==i;++m){let S=n[d+m];if(S!==n[u+m]||S!==n[p+m]){l=!0;break}}}if(l){if(o!==r){t[r]=t[o];let d=o*i,u=r*i;for(let p=0;p!==i;++p)n[u+p]=n[d+p]}++r}}if(a>0){t[r]=t[a];for(let o=a*i,l=r*i,c=0;c!==i;++c)n[l+c]=n[o+c];++r}return r!==t.length?(this.times=t.slice(0,r),this.values=n.slice(0,r*i)):(this.times=t,this.values=n),this}clone(){let t=this.times.slice(),n=this.values.slice(),i=this.constructor,s=new i(this.name,t,n);return s.createInterpolant=this.createInterpolant,uv(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function x1(e,t){for(let n=0,i=e.length;n!==i;n+=2)e[n]*=t}xi.prototype.ValueTypeName="";xi.prototype.TimeBufferType=Float32Array;xi.prototype.ValueBufferType=Float32Array;xi.prototype.DefaultInterpolation=rf;var Ya=class extends xi{constructor(t,n,i){super(t,n,i)}};Ya.prototype.ValueTypeName="bool";Ya.prototype.ValueBufferType=Array;Ya.prototype.DefaultInterpolation=Vc;Ya.prototype.InterpolantFactoryMethodLinear=void 0;Ya.prototype.InterpolantFactoryMethodSmooth=void 0;var bf=class extends xi{constructor(t,n,i,s){super(t,n,i,s)}};bf.prototype.ValueTypeName="color";var Mf=class extends xi{constructor(t,n,i,s){super(t,n,i,s)}};Mf.prototype.ValueTypeName="number";var Ef=class extends qa{constructor(t,n,i,s){super(t,n,i,s)}interpolate_(t,n,i,s){let a=this.resultBuffer,r=this.sampleValues,o=this.valueSize,l=(i-n)/(s-n),c=t*o;for(let h=c+o;c!==h;c+=4)_i.slerpFlat(a,0,r,c-o,r,c,l);return a}},ou=class extends xi{constructor(t,n,i,s){super(t,n,i,s)}InterpolantFactoryMethodLinear(t){return new Ef(this.times,this.values,this.getValueSize(),t)}};ou.prototype.ValueTypeName="quaternion";ou.prototype.InterpolantFactoryMethodSmooth=void 0;var Za=class extends xi{constructor(t,n,i){super(t,n,i)}};Za.prototype.ValueTypeName="string";Za.prototype.ValueBufferType=Array;Za.prototype.DefaultInterpolation=Vc;Za.prototype.InterpolantFactoryMethodLinear=void 0;Za.prototype.InterpolantFactoryMethodSmooth=void 0;var Tf=class extends xi{constructor(t,n,i,s){super(t,n,i,s)}};Tf.prototype.ValueTypeName="vector";var wf=class{constructor(t,n,i){let s=this,a=!1,r=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=n,this.onError=i,this._abortController=null,this.itemStart=function(h){o++,a===!1&&s.onStart!==void 0&&s.onStart(h,r,o),a=!0},this.itemEnd=function(h){r++,s.onProgress!==void 0&&s.onProgress(h,r,o),r===o&&(a=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){let p=c[d],m=c[d+1];if(p.global&&(p.lastIndex=0),p.test(h))return m}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},dE=new wf,Af=class{constructor(t){this.manager=t!==void 0?t:dE,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,n){let i=this;return new Promise(function(s,a){i.load(t,s,n,a)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Af.DEFAULT_MATERIAL_NAME="__DEFAULT";var qd=new P,Yd=new _i,_s=new P,lu=class extends Xn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Fe,this.projectionMatrix=new Fe,this.projectionMatrixInverse=new Fe,this.coordinateSystem=Zi,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,n){return super.copy(t,n),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(qd,Yd,_s),_s.x===1&&_s.y===1&&_s.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(qd,Yd,_s.set(1,1,1)).invert()}updateWorldMatrix(t,n,i=!1){super.updateWorldMatrix(t,n,i),this.matrixWorld.decompose(qd,Yd,_s),_s.x===1&&_s.y===1&&_s.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(qd,Yd,_s.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Va=new P,S1=new Ut,b1=new Ut,Ln=class extends lu{constructor(t=50,n=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=n,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let n=.5*this.getFilmHeight()/t;this.fov=cl*2*Math.atan(n),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(Gc*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return cl*2*Math.atan(Math.tan(Gc*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,n,i){Va.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Va.x,Va.y).multiplyScalar(-t/Va.z),Va.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Va.x,Va.y).multiplyScalar(-t/Va.z)}getViewSize(t,n){return this.getViewBounds(t,S1,b1),n.subVectors(b1,S1)}setViewOffset(t,n,i,s,a,r){this.aspect=t/n,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,n=t*Math.tan(Gc*.5*this.fov)/this.zoom,i=2*n,s=this.aspect*i,a=-.5*s,r=this.view;if(this.view!==null&&this.view.enabled){let l=r.fullWidth,c=r.fullHeight;a+=r.offsetX*s/l,n-=r.offsetY*i/c,s*=r.width/l,i*=r.height/c}let o=this.filmOffset;o!==0&&(a+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(a,a+s,n,n-i,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let n=super.toJSON(t);return n.object.fov=this.fov,n.object.zoom=this.zoom,n.object.near=this.near,n.object.far=this.far,n.object.focus=this.focus,n.object.aspect=this.aspect,this.view!==null&&(n.object.view=Object.assign({},this.view)),n.object.filmGauge=this.filmGauge,n.object.filmOffset=this.filmOffset,n}};var cu=class extends lu{constructor(t=-1,n=1,i=1,s=-1,a=.1,r=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=n,this.top=i,this.bottom=s,this.near=a,this.far=r,this.updateProjectionMatrix()}copy(t,n){return super.copy(t,n),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,n,i,s,a,r){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=n,this.view.offsetX=i,this.view.offsetY=s,this.view.width=a,this.view.height=r,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),n=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,a=i-t,r=i+t,o=s+n,l=s-n;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;a+=c*this.view.offsetX,r=a+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(a,r,o,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let n=super.toJSON(t);return n.object.zoom=this.zoom,n.object.left=this.left,n.object.right=this.right,n.object.top=this.top,n.object.bottom=this.bottom,n.object.near=this.near,n.object.far=this.far,this.view!==null&&(n.object.view=Object.assign({},this.view)),n}};var sl=-90,al=1,Cf=class extends Xn{constructor(t,n,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Ln(sl,al,t,n);s.layers=this.layers,this.add(s);let a=new Ln(sl,al,t,n);a.layers=this.layers,this.add(a);let r=new Ln(sl,al,t,n);r.layers=this.layers,this.add(r);let o=new Ln(sl,al,t,n);o.layers=this.layers,this.add(o);let l=new Ln(sl,al,t,n);l.layers=this.layers,this.add(l);let c=new Ln(sl,al,t,n);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,n=this.children.concat(),[i,s,a,r,o,l]=n;for(let c of n)this.remove(c);if(t===Zi)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),a.up.set(0,0,-1),a.lookAt(0,1,0),r.up.set(0,0,1),r.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===Wc)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),a.up.set(0,0,1),a.lookAt(0,1,0),r.up.set(0,0,-1),r.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of n)this.add(c),c.updateMatrixWorld()}update(t,n){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[a,r,o,l,c,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),m=t.xr.enabled;t.xr.enabled=!1;let S=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let g=!1;t.isWebGLRenderer===!0?g=t.state.buffers.depth.getReversed():g=t.reversedDepthBuffer,t.setRenderTarget(i,0,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,a),t.setRenderTarget(i,1,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,r),t.setRenderTarget(i,2,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,o),t.setRenderTarget(i,3,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,l),t.setRenderTarget(i,4,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,c),i.texture.generateMipmaps=S,t.setRenderTarget(i,5,s),g&&t.autoClear===!1&&t.clearDepth(),t.render(n,h),t.setRenderTarget(d,u,p),t.xr.enabled=m,i.texture.needsPMREMUpdate=!0}},Rf=class extends Ln{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var Wv="\\[\\]\\.:\\/",jR=new RegExp("["+Wv+"]","g"),qv="[^"+Wv+"]",KR="[^"+Wv.replace("\\.","")+"]",JR=/((?:WC+[\/:])*)/.source.replace("WC",qv),QR=/(WCOD+)?/.source.replace("WCOD",KR),$R=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",qv),t2=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",qv),e2=new RegExp("^"+JR+QR+$R+t2+"$"),n2=["material","materials","bones","map"],gv=class{constructor(t,n,i){let s=i||ze.parseTrackName(n);this._targetGroup=t,this._bindings=t.subscribe_(n,s)}getValue(t,n){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(t,n)}setValue(t,n){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,a=i.length;s!==a;++s)i[s].setValue(t,n)}bind(){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].bind()}unbind(){let t=this._bindings;for(let n=this._targetGroup.nCachedObjects_,i=t.length;n!==i;++n)t[n].unbind()}},ze=class e{constructor(t,n,i){this.path=n,this.parsedPath=i||e.parseTrackName(n),this.node=e.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,n,i){return t&&t.isAnimationObjectGroup?new e.Composite(t,n,i):new e(t,n,i)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(jR,"")}static parseTrackName(t){let n=e2.exec(t);if(n===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let i={nodeName:n[2],objectName:n[3],objectIndex:n[4],propertyName:n[5],propertyIndex:n[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let a=i.nodeName.substring(s+1);n2.indexOf(a)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=a)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return i}static findNode(t,n){if(n===void 0||n===""||n==="."||n===-1||n===t.name||n===t.uuid)return t;if(t.skeleton){let i=t.skeleton.getBoneByName(n);if(i!==void 0)return i}if(t.children){let i=function(a){for(let r=0;r<a.length;r++){let o=a[r];if(o.name===n||o.uuid===n)return o;let l=i(o.children);if(l)return l}return null},s=i(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,n){t[n]=this.targetObject[this.propertyName]}_getValue_array(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)t[n++]=i[s]}_getValue_arrayElement(t,n){t[n]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,n){this.resolvedProperty.toArray(t,n)}_setValue_direct(t,n){this.targetObject[this.propertyName]=t[n]}_setValue_direct_setNeedsUpdate(t,n){this.targetObject[this.propertyName]=t[n],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,n){this.targetObject[this.propertyName]=t[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++]}_setValue_array_setNeedsUpdate(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,n){let i=this.resolvedProperty;for(let s=0,a=i.length;s!==a;++s)i[s]=t[n++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,n){this.resolvedProperty[this.propertyIndex]=t[n]}_setValue_arrayElement_setNeedsUpdate(t,n){this.resolvedProperty[this.propertyIndex]=t[n],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,n){this.resolvedProperty[this.propertyIndex]=t[n],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,n){this.resolvedProperty.fromArray(t,n)}_setValue_fromArray_setNeedsUpdate(t,n){this.resolvedProperty.fromArray(t,n),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,n){this.resolvedProperty.fromArray(t,n),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,n){this.bind(),this.getValue(t,n)}_setValue_unbound(t,n){this.bind(),this.setValue(t,n)}bind(){let t=this.node,n=this.parsedPath,i=n.objectName,s=n.propertyName,a=n.propertyIndex;if(t||(t=e.findNode(this.rootNode,n.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){Ot("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=n.objectIndex;switch(i){case"materials":if(!t.material){Pt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){Pt("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){Pt("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){Pt("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){Pt("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[i]===void 0){Pt("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[i]}if(c!==void 0){if(t[c]===void 0){Pt("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let r=t[s];if(r===void 0){let c=n.nodeName;Pt("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?o=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(a!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){Pt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){Pt("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[a]!==void 0&&(a=t.morphTargetDictionary[a])}l=this.BindingType.ArrayElement,this.resolvedProperty=r,this.propertyIndex=a}else r.fromArray!==void 0&&r.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=r):Array.isArray(r)?(l=this.BindingType.EntireArray,this.resolvedProperty=r):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ze.Composite=gv;ze.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ze.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ze.prototype.GetterByBindingType=[ze.prototype._getValue_direct,ze.prototype._getValue_array,ze.prototype._getValue_arrayElement,ze.prototype._getValue_toArray];ze.prototype.SetterByBindingTypeAndVersioning=[[ze.prototype._setValue_direct,ze.prototype._setValue_direct_setNeedsUpdate,ze.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ze.prototype._setValue_array,ze.prototype._setValue_array_setNeedsUpdate,ze.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ze.prototype._setValue_arrayElement,ze.prototype._setValue_arrayElement_setNeedsUpdate,ze.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ze.prototype._setValue_fromArray,ze.prototype._setValue_fromArray_setNeedsUpdate,ze.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var kU=new Float32Array(1);var M1=new Fe,uu=class{constructor(t,n,i=0,s=1/0){this.ray=new ea(t,n),this.near=i,this.far=s,this.camera=null,this.layers=new hl,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,n){this.ray.set(t,n)}setFromCamera(t,n){n.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(n.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(n).sub(this.ray.origin).normalize(),this.camera=n):n.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,n.projectionMatrix.elements[14]).unproject(n),this.ray.direction.set(0,0,-1).transformDirection(n.matrixWorld),this.camera=n):Pt("Raycaster: Unsupported camera type: "+n.type)}setFromXRController(t){return M1.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(M1),this}intersectObject(t,n=!0,i=[]){return vv(t,this,i,n),i.sort(E1),i}intersectObjects(t,n=!0,i=[]){for(let s=0,a=t.length;s<a;s++)vv(t[s],this,i,n);return i.sort(E1),i}};function E1(e,t){return e.distance-t.distance}function vv(e,t,n,i){let s=!0;if(e.layers.test(t.layers)&&e.raycast(t,n)===!1&&(s=!1),s===!0&&i===!0){let a=e.children;for(let r=0,o=a.length;r<o;r++)vv(a[r],t,n,!0)}}var _l=class{constructor(t=1,n=0,i=0){this.radius=t,this.phi=n,this.theta=i}set(t,n,i){return this.radius=t,this.phi=n,this.theta=i,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=jt(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,n,i){return this.radius=Math.sqrt(t*t+n*n+i*i),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,i),this.phi=Math.acos(jt(n/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var _v=class e{static{e.prototype.isMatrix2=!0}constructor(t,n,i,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,n,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,n=0){for(let i=0;i<4;i++)this.elements[i]=t[i+n];return this}set(t,n,i,s){let a=this.elements;return a[0]=t,a[2]=n,a[1]=i,a[3]=s,this}};var hu=class extends ji{constructor(t,n=null){super(),this.object=t,this.domElement=n,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}};function Yv(e,t,n,i){let s=i2(i);switch(n){case Bv:return e*t;case Fv:return e*t/s.components*s.byteLength;case Pf:return e*t/s.components*s.byteLength;case er:return e*t*2/s.components*s.byteLength;case Bf:return e*t*2/s.components*s.byteLength;case zv:return e*t*3/s.components*s.byteLength;case Pi:return e*t*4/s.components*s.byteLength;case zf:return e*t*4/s.components*s.byteLength;case gu:case vu:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case _u:case yu:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Gf:case Vf:return Math.max(e,16)*Math.max(t,8)/4;case Ff:case Hf:return Math.max(e,8)*Math.max(t,8)/2;case kf:case Xf:case qf:case Yf:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*8;case Wf:case xu:case Zf:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case jf:return Math.floor((e+3)/4)*Math.floor((t+3)/4)*16;case Kf:return Math.floor((e+4)/5)*Math.floor((t+3)/4)*16;case Jf:return Math.floor((e+4)/5)*Math.floor((t+4)/5)*16;case Qf:return Math.floor((e+5)/6)*Math.floor((t+4)/5)*16;case $f:return Math.floor((e+5)/6)*Math.floor((t+5)/6)*16;case tp:return Math.floor((e+7)/8)*Math.floor((t+4)/5)*16;case ep:return Math.floor((e+7)/8)*Math.floor((t+5)/6)*16;case np:return Math.floor((e+7)/8)*Math.floor((t+7)/8)*16;case ip:return Math.floor((e+9)/10)*Math.floor((t+4)/5)*16;case sp:return Math.floor((e+9)/10)*Math.floor((t+5)/6)*16;case ap:return Math.floor((e+9)/10)*Math.floor((t+7)/8)*16;case rp:return Math.floor((e+9)/10)*Math.floor((t+9)/10)*16;case op:return Math.floor((e+11)/12)*Math.floor((t+9)/10)*16;case lp:return Math.floor((e+11)/12)*Math.floor((t+11)/12)*16;case cp:case up:case hp:return Math.ceil(e/4)*Math.ceil(t/4)*16;case dp:case fp:return Math.ceil(e/4)*Math.ceil(t/4)*8;case Su:case pp:return Math.ceil(e/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${n} format.`)}function i2(e){switch(e){case Si:case Uv:return{byteLength:1,components:1};case Sl:case Iv:case $i:return{byteLength:2,components:1};case If:case Of:return{byteLength:2,components:4};case Ji:case Uf:case Qi:return{byteLength:4,components:1};case Ov:case Pv:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${e}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Ot("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function IE(){let e=null,t=!1,n=null,i=null;function s(a,r){i=e.requestAnimationFrame(s),n(a,r)}return{start:function(){t!==!0&&n!==null&&e!==null&&(i=e.requestAnimationFrame(s),t=!0)},stop:function(){e!==null&&e.cancelAnimationFrame(i),t=!1},setAnimationLoop:function(a){n=a},setContext:function(a){e=a}}}function a2(e){let t=new WeakMap;function n(o,l){let c=o.array,h=o.usage,d=c.byteLength,u=e.createBuffer();e.bindBuffer(l,u),e.bufferData(l,c,h),o.onUploadCallback();let p;if(c instanceof Float32Array)p=e.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)p=e.HALF_FLOAT;else if(c instanceof Uint16Array)o.isFloat16BufferAttribute?p=e.HALF_FLOAT:p=e.UNSIGNED_SHORT;else if(c instanceof Int16Array)p=e.SHORT;else if(c instanceof Uint32Array)p=e.UNSIGNED_INT;else if(c instanceof Int32Array)p=e.INT;else if(c instanceof Int8Array)p=e.BYTE;else if(c instanceof Uint8Array)p=e.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)p=e.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:p,bytesPerElement:c.BYTES_PER_ELEMENT,version:o.version,size:d}}function i(o,l,c){let h=l.array,d=l.updateRanges;if(e.bindBuffer(c,o),d.length===0)e.bufferSubData(c,0,h);else{d.sort((p,m)=>p.start-m.start);let u=0;for(let p=1;p<d.length;p++){let m=d[u],S=d[p];S.start<=m.start+m.count+1?m.count=Math.max(m.count,S.start+S.count-m.start):(++u,d[u]=S)}d.length=u+1;for(let p=0,m=d.length;p<m;p++){let S=d[p];e.bufferSubData(c,S.start*h.BYTES_PER_ELEMENT,h,S.start,S.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function a(o){o.isInterleavedBufferAttribute&&(o=o.data);let l=t.get(o);l&&(e.deleteBuffer(l.buffer),t.delete(o))}function r(o,l){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){let h=t.get(o);(!h||h.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}let c=t.get(o);if(c===void 0)t.set(o,n(o,l));else if(c.version<o.version){if(c.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,o,l),c.version=o.version}}return{get:s,remove:a,update:r}}var r2=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,o2=`#ifdef USE_ALPHAHASH
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
#endif`,l2=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,c2=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,u2=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,h2=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,d2=`#ifdef USE_AOMAP
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
#endif`,f2=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,p2=`#ifdef USE_BATCHING
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
#endif`,m2=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,g2=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,v2=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,_2=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,y2=`#ifdef USE_IRIDESCENCE
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
#endif`,x2=`#ifdef USE_BUMPMAP
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
#endif`,S2=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,b2=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,M2=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,E2=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,T2=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,w2=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,A2=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,C2=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,R2=`#define PI 3.141592653589793
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
} // validated`,N2=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,D2=`vec3 transformedNormal = objectNormal;
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
#endif`,L2=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,U2=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,I2=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,O2=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,P2="gl_FragColor = linearToOutputTexel( gl_FragColor );",B2=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,z2=`#ifdef USE_ENVMAP
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
#endif`,F2=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,G2=`#ifdef USE_ENVMAP
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
#endif`,H2=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS

		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,V2=`#ifdef USE_ENVMAP
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
#endif`,k2=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,X2=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,W2=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,q2=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Y2=`#ifdef USE_GRADIENTMAP
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
}`,Z2=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,j2=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,K2=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,J2=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,Q2=`#ifdef USE_ENVMAP
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
#endif`,$2=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,t3=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,e3=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,n3=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,i3=`PhysicalMaterial material;
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
#endif`,s3=`uniform sampler2D dfgLUT;
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
}`,a3=`
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
#endif`,r3=`#if defined( RE_IndirectDiffuse )
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
#endif`,o3=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,l3=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,c3=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,u3=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,h3=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,d3=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,f3=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,p3=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,m3=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,g3=`#if defined( USE_POINTS_UV )
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
#endif`,v3=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,_3=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,y3=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,x3=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,S3=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,b3=`#ifdef USE_MORPHTARGETS
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
#endif`,M3=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,E3=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,T3=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,w3=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,A3=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,C3=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,R3=`#ifdef USE_NORMALMAP
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
#endif`,N3=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,D3=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,L3=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,U3=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,I3=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,O3=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,P3=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,B3=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,z3=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,F3=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,G3=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,H3=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,V3=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,k3=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,X3=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,W3=`float getShadowMask() {
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
}`,q3=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Y3=`#ifdef USE_SKINNING
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
#endif`,Z3=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,j3=`#ifdef USE_SKINNING
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
#endif`,K3=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,J3=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Q3=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,$3=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,tN=`#ifdef USE_TRANSMISSION
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
#endif`,eN=`#ifdef USE_TRANSMISSION
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
#endif`,nN=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,iN=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,sN=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,aN=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,rN=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,oN=`uniform sampler2D t2D;
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
}`,lN=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,cN=`#ifdef ENVMAP_TYPE_CUBE
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
}`,uN=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,hN=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,dN=`#include <common>
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
}`,fN=`#if DEPTH_PACKING == 3200
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
}`,pN=`#define DISTANCE
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
}`,mN=`#define DISTANCE
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
}`,gN=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,vN=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,_N=`uniform float scale;
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
}`,yN=`uniform vec3 diffuse;
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
}`,xN=`#include <common>
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
}`,SN=`uniform vec3 diffuse;
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
}`,bN=`#define LAMBERT
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
}`,MN=`#define LAMBERT
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
}`,EN=`#define MATCAP
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
}`,TN=`#define MATCAP
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
}`,wN=`#define NORMAL
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
}`,AN=`#define NORMAL
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
}`,CN=`#define PHONG
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
}`,RN=`#define PHONG
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
}`,NN=`#define STANDARD
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
}`,DN=`#define STANDARD
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
}`,LN=`#define TOON
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
}`,UN=`#define TOON
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
}`,IN=`uniform float size;
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
}`,ON=`uniform vec3 diffuse;
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
}`,PN=`#include <common>
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
}`,BN=`uniform vec3 color;
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
}`,zN=`uniform float rotation;
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
}`,FN=`uniform vec3 diffuse;
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
}`,Yt={alphahash_fragment:r2,alphahash_pars_fragment:o2,alphamap_fragment:l2,alphamap_pars_fragment:c2,alphatest_fragment:u2,alphatest_pars_fragment:h2,aomap_fragment:d2,aomap_pars_fragment:f2,batching_pars_vertex:p2,batching_vertex:m2,begin_vertex:g2,beginnormal_vertex:v2,bsdfs:_2,iridescence_fragment:y2,bumpmap_pars_fragment:x2,clipping_planes_fragment:S2,clipping_planes_pars_fragment:b2,clipping_planes_pars_vertex:M2,clipping_planes_vertex:E2,color_fragment:T2,color_pars_fragment:w2,color_pars_vertex:A2,color_vertex:C2,common:R2,cube_uv_reflection_fragment:N2,defaultnormal_vertex:D2,displacementmap_pars_vertex:L2,displacementmap_vertex:U2,emissivemap_fragment:I2,emissivemap_pars_fragment:O2,colorspace_fragment:P2,colorspace_pars_fragment:B2,envmap_fragment:z2,envmap_common_pars_fragment:F2,envmap_pars_fragment:G2,envmap_pars_vertex:H2,envmap_physical_pars_fragment:Q2,envmap_vertex:V2,fog_vertex:k2,fog_pars_vertex:X2,fog_fragment:W2,fog_pars_fragment:q2,gradientmap_pars_fragment:Y2,lightmap_pars_fragment:Z2,lights_lambert_fragment:j2,lights_lambert_pars_fragment:K2,lights_pars_begin:J2,lights_toon_fragment:$2,lights_toon_pars_fragment:t3,lights_phong_fragment:e3,lights_phong_pars_fragment:n3,lights_physical_fragment:i3,lights_physical_pars_fragment:s3,lights_fragment_begin:a3,lights_fragment_maps:r3,lights_fragment_end:o3,lightprobes_pars_fragment:l3,logdepthbuf_fragment:c3,logdepthbuf_pars_fragment:u3,logdepthbuf_pars_vertex:h3,logdepthbuf_vertex:d3,map_fragment:f3,map_pars_fragment:p3,map_particle_fragment:m3,map_particle_pars_fragment:g3,metalnessmap_fragment:v3,metalnessmap_pars_fragment:_3,morphinstance_vertex:y3,morphcolor_vertex:x3,morphnormal_vertex:S3,morphtarget_pars_vertex:b3,morphtarget_vertex:M3,normal_fragment_begin:E3,normal_fragment_maps:T3,normal_pars_fragment:w3,normal_pars_vertex:A3,normal_vertex:C3,normalmap_pars_fragment:R3,clearcoat_normal_fragment_begin:N3,clearcoat_normal_fragment_maps:D3,clearcoat_pars_fragment:L3,iridescence_pars_fragment:U3,opaque_fragment:I3,packing:O3,premultiplied_alpha_fragment:P3,project_vertex:B3,dithering_fragment:z3,dithering_pars_fragment:F3,roughnessmap_fragment:G3,roughnessmap_pars_fragment:H3,shadowmap_pars_fragment:V3,shadowmap_pars_vertex:k3,shadowmap_vertex:X3,shadowmask_pars_fragment:W3,skinbase_vertex:q3,skinning_pars_vertex:Y3,skinning_vertex:Z3,skinnormal_vertex:j3,specularmap_fragment:K3,specularmap_pars_fragment:J3,tonemapping_fragment:Q3,tonemapping_pars_fragment:$3,transmission_fragment:tN,transmission_pars_fragment:eN,uv_pars_fragment:nN,uv_pars_vertex:iN,uv_vertex:sN,worldpos_vertex:aN,background_vert:rN,background_frag:oN,backgroundCube_vert:lN,backgroundCube_frag:cN,cube_vert:uN,cube_frag:hN,depth_vert:dN,depth_frag:fN,distance_vert:pN,distance_frag:mN,equirect_vert:gN,equirect_frag:vN,linedashed_vert:_N,linedashed_frag:yN,meshbasic_vert:xN,meshbasic_frag:SN,meshlambert_vert:bN,meshlambert_frag:MN,meshmatcap_vert:EN,meshmatcap_frag:TN,meshnormal_vert:wN,meshnormal_frag:AN,meshphong_vert:CN,meshphong_frag:RN,meshphysical_vert:NN,meshphysical_frag:DN,meshtoon_vert:LN,meshtoon_frag:UN,points_vert:IN,points_frag:ON,shadow_vert:PN,shadow_frag:BN,sprite_vert:zN,sprite_frag:FN},pt={common:{diffuse:{value:new Wt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Vt}},envmap:{envMap:{value:null},envMapRotation:{value:new Vt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Vt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Vt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Vt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Vt},normalScale:{value:new Ut(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Vt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Vt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Vt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Vt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Wt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new P},probesMax:{value:new P},probesResolution:{value:new P}},points:{diffuse:{value:new Wt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0},uvTransform:{value:new Vt}},sprite:{diffuse:{value:new Wt(16777215)},opacity:{value:1},center:{value:new Ut(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Vt},alphaMap:{value:null},alphaMapTransform:{value:new Vt},alphaTest:{value:0}}},Cs={basic:{uniforms:In([pt.common,pt.specularmap,pt.envmap,pt.aomap,pt.lightmap,pt.fog]),vertexShader:Yt.meshbasic_vert,fragmentShader:Yt.meshbasic_frag},lambert:{uniforms:In([pt.common,pt.specularmap,pt.envmap,pt.aomap,pt.lightmap,pt.emissivemap,pt.bumpmap,pt.normalmap,pt.displacementmap,pt.fog,pt.lights,{emissive:{value:new Wt(0)},envMapIntensity:{value:1}}]),vertexShader:Yt.meshlambert_vert,fragmentShader:Yt.meshlambert_frag},phong:{uniforms:In([pt.common,pt.specularmap,pt.envmap,pt.aomap,pt.lightmap,pt.emissivemap,pt.bumpmap,pt.normalmap,pt.displacementmap,pt.fog,pt.lights,{emissive:{value:new Wt(0)},specular:{value:new Wt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Yt.meshphong_vert,fragmentShader:Yt.meshphong_frag},standard:{uniforms:In([pt.common,pt.envmap,pt.aomap,pt.lightmap,pt.emissivemap,pt.bumpmap,pt.normalmap,pt.displacementmap,pt.roughnessmap,pt.metalnessmap,pt.fog,pt.lights,{emissive:{value:new Wt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Yt.meshphysical_vert,fragmentShader:Yt.meshphysical_frag},toon:{uniforms:In([pt.common,pt.aomap,pt.lightmap,pt.emissivemap,pt.bumpmap,pt.normalmap,pt.displacementmap,pt.gradientmap,pt.fog,pt.lights,{emissive:{value:new Wt(0)}}]),vertexShader:Yt.meshtoon_vert,fragmentShader:Yt.meshtoon_frag},matcap:{uniforms:In([pt.common,pt.bumpmap,pt.normalmap,pt.displacementmap,pt.fog,{matcap:{value:null}}]),vertexShader:Yt.meshmatcap_vert,fragmentShader:Yt.meshmatcap_frag},points:{uniforms:In([pt.points,pt.fog]),vertexShader:Yt.points_vert,fragmentShader:Yt.points_frag},dashed:{uniforms:In([pt.common,pt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Yt.linedashed_vert,fragmentShader:Yt.linedashed_frag},depth:{uniforms:In([pt.common,pt.displacementmap]),vertexShader:Yt.depth_vert,fragmentShader:Yt.depth_frag},normal:{uniforms:In([pt.common,pt.bumpmap,pt.normalmap,pt.displacementmap,{opacity:{value:1}}]),vertexShader:Yt.meshnormal_vert,fragmentShader:Yt.meshnormal_frag},sprite:{uniforms:In([pt.sprite,pt.fog]),vertexShader:Yt.sprite_vert,fragmentShader:Yt.sprite_frag},background:{uniforms:{uvTransform:{value:new Vt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Yt.background_vert,fragmentShader:Yt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Vt}},vertexShader:Yt.backgroundCube_vert,fragmentShader:Yt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Yt.cube_vert,fragmentShader:Yt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Yt.equirect_vert,fragmentShader:Yt.equirect_frag},distance:{uniforms:In([pt.common,pt.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Yt.distance_vert,fragmentShader:Yt.distance_frag},shadow:{uniforms:In([pt.lights,pt.fog,{color:{value:new Wt(0)},opacity:{value:1}}]),vertexShader:Yt.shadow_vert,fragmentShader:Yt.shadow_frag}};Cs.physical={uniforms:In([Cs.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Vt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Vt},clearcoatNormalScale:{value:new Ut(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Vt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Vt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Vt},sheen:{value:0},sheenColor:{value:new Wt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Vt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Vt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Vt},transmissionSamplerSize:{value:new Ut},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Vt},attenuationDistance:{value:0},attenuationColor:{value:new Wt(0)},specularColor:{value:new Wt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Vt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Vt},anisotropyVector:{value:new Ut},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Vt}}]),vertexShader:Yt.meshphysical_vert,fragmentShader:Yt.meshphysical_frag};var vp={r:0,b:0,g:0},GN=new Fe,OE=new Vt;OE.set(-1,0,0,0,1,0,0,0,1);function HN(e,t,n,i,s,a){let r=new Wt(0),o=s===!0?0:1,l,c,h=null,d=0,u=null;function p(v){let b=v.isScene===!0?v.background:null;if(b&&b.isTexture){let y=v.backgroundBlurriness>0;b=t.get(b,y)}return b}function m(v){let b=!1,y=p(v);y===null?g(r,o):y&&y.isColor&&(g(y,1),b=!0);let T=e.xr.getEnvironmentBlendMode();T==="additive"?n.buffers.color.setClear(0,0,0,1,a):T==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(e.autoClear||b)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil))}function S(v,b){let y=p(b);y&&(y.isCubeTexture||y.mapping===pu)?(c===void 0&&(c=new Wn(new vl(1,1,1),new yi({name:"BackgroundCubeMaterial",uniforms:Br(Cs.backgroundCube.uniforms),vertexShader:Cs.backgroundCube.vertexShader,fragmentShader:Cs.backgroundCube.fragmentShader,side:qn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(T,E,w){this.matrixWorld.copyPosition(w.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=y,c.material.uniforms.backgroundBlurriness.value=b.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(GN.makeRotationFromEuler(b.backgroundRotation)).transpose(),y.isCubeTexture&&y.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(OE),c.material.toneMapped=ie.getTransfer(y.colorSpace)!==me,(h!==y||d!==y.version||u!==e.toneMapping)&&(c.material.needsUpdate=!0,h=y,d=y.version,u=e.toneMapping),c.layers.enableAll(),v.unshift(c,c.geometry,c.material,0,0,null)):y&&y.isTexture&&(l===void 0&&(l=new Wn(new au(2,2),new yi({name:"BackgroundMaterial",uniforms:Br(Cs.background.uniforms),vertexShader:Cs.background.vertexShader,fragmentShader:Cs.background.fragmentShader,side:Ja,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=y,l.material.uniforms.backgroundIntensity.value=b.backgroundIntensity,l.material.toneMapped=ie.getTransfer(y.colorSpace)!==me,y.matrixAutoUpdate===!0&&y.updateMatrix(),l.material.uniforms.uvTransform.value.copy(y.matrix),(h!==y||d!==y.version||u!==e.toneMapping)&&(l.material.needsUpdate=!0,h=y,d=y.version,u=e.toneMapping),l.layers.enableAll(),v.unshift(l,l.geometry,l.material,0,0,null))}function g(v,b){v.getRGB(vp,Xv(e)),n.buffers.color.setClear(vp.r,vp.g,vp.b,b,a)}function f(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return r},setClearColor:function(v,b=1){r.set(v),o=b,g(r,o)},getClearAlpha:function(){return o},setClearAlpha:function(v){o=v,g(r,o)},render:m,addToRenderList:S,dispose:f}}function VN(e,t){let n=e.getParameter(e.MAX_VERTEX_ATTRIBS),i={},s=u(null),a=s,r=!1;function o(O,F,z,I,X){let Y=!1,j=d(O,I,z,F);a!==j&&(a=j,c(a.object)),Y=p(O,I,z,X),Y&&m(O,I,z,X),X!==null&&t.update(X,e.ELEMENT_ARRAY_BUFFER),(Y||r)&&(r=!1,y(O,F,z,I),X!==null&&e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,t.get(X).buffer))}function l(){return e.createVertexArray()}function c(O){return e.bindVertexArray(O)}function h(O){return e.deleteVertexArray(O)}function d(O,F,z,I){let X=I.wireframe===!0,Y=i[F.id];Y===void 0&&(Y={},i[F.id]=Y);let j=O.isInstancedMesh===!0?O.id:0,at=Y[j];at===void 0&&(at={},Y[j]=at);let Z=at[z.id];Z===void 0&&(Z={},at[z.id]=Z);let nt=Z[X];return nt===void 0&&(nt=u(l()),Z[X]=nt),nt}function u(O){let F=[],z=[],I=[];for(let X=0;X<n;X++)F[X]=0,z[X]=0,I[X]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:F,enabledAttributes:z,attributeDivisors:I,object:O,attributes:{},index:null}}function p(O,F,z,I){let X=a.attributes,Y=F.attributes,j=0,at=z.getAttributes();for(let Z in at)if(at[Z].location>=0){let st=X[Z],Dt=Y[Z];if(Dt===void 0&&(Z==="instanceMatrix"&&O.instanceMatrix&&(Dt=O.instanceMatrix),Z==="instanceColor"&&O.instanceColor&&(Dt=O.instanceColor)),st===void 0||st.attribute!==Dt||Dt&&st.data!==Dt.data)return!0;j++}return a.attributesNum!==j||a.index!==I}function m(O,F,z,I){let X={},Y=F.attributes,j=0,at=z.getAttributes();for(let Z in at)if(at[Z].location>=0){let st=Y[Z];st===void 0&&(Z==="instanceMatrix"&&O.instanceMatrix&&(st=O.instanceMatrix),Z==="instanceColor"&&O.instanceColor&&(st=O.instanceColor));let Dt={};Dt.attribute=st,st&&st.data&&(Dt.data=st.data),X[Z]=Dt,j++}a.attributes=X,a.attributesNum=j,a.index=I}function S(){let O=a.newAttributes;for(let F=0,z=O.length;F<z;F++)O[F]=0}function g(O){f(O,0)}function f(O,F){let z=a.newAttributes,I=a.enabledAttributes,X=a.attributeDivisors;z[O]=1,I[O]===0&&(e.enableVertexAttribArray(O),I[O]=1),X[O]!==F&&(e.vertexAttribDivisor(O,F),X[O]=F)}function v(){let O=a.newAttributes,F=a.enabledAttributes;for(let z=0,I=F.length;z<I;z++)F[z]!==O[z]&&(e.disableVertexAttribArray(z),F[z]=0)}function b(O,F,z,I,X,Y,j){j===!0?e.vertexAttribIPointer(O,F,z,X,Y):e.vertexAttribPointer(O,F,z,I,X,Y)}function y(O,F,z,I){S();let X=I.attributes,Y=z.getAttributes(),j=F.defaultAttributeValues;for(let at in Y){let Z=Y[at];if(Z.location>=0){let nt=X[at];if(nt===void 0&&(at==="instanceMatrix"&&O.instanceMatrix&&(nt=O.instanceMatrix),at==="instanceColor"&&O.instanceColor&&(nt=O.instanceColor)),nt!==void 0){let st=nt.normalized,Dt=nt.itemSize,At=t.get(nt);if(At===void 0)continue;let se=At.buffer,Kt=At.type,re=At.bytesPerElement,K=Kt===e.INT||Kt===e.UNSIGNED_INT||nt.gpuType===Uf;if(nt.isInterleavedBufferAttribute){let et=nt.data,xt=et.stride,Bt=nt.offset;if(et.isInstancedInterleavedBuffer){for(let yt=0;yt<Z.locationSize;yt++)f(Z.location+yt,et.meshPerAttribute);O.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=et.meshPerAttribute*et.count)}else for(let yt=0;yt<Z.locationSize;yt++)g(Z.location+yt);e.bindBuffer(e.ARRAY_BUFFER,se);for(let yt=0;yt<Z.locationSize;yt++)b(Z.location+yt,Dt/Z.locationSize,Kt,st,xt*re,(Bt+Dt/Z.locationSize*yt)*re,K)}else{if(nt.isInstancedBufferAttribute){for(let et=0;et<Z.locationSize;et++)f(Z.location+et,nt.meshPerAttribute);O.isInstancedMesh!==!0&&I._maxInstanceCount===void 0&&(I._maxInstanceCount=nt.meshPerAttribute*nt.count)}else for(let et=0;et<Z.locationSize;et++)g(Z.location+et);e.bindBuffer(e.ARRAY_BUFFER,se);for(let et=0;et<Z.locationSize;et++)b(Z.location+et,Dt/Z.locationSize,Kt,st,Dt*re,Dt/Z.locationSize*et*re,K)}}else if(j!==void 0){let st=j[at];if(st!==void 0)switch(st.length){case 2:e.vertexAttrib2fv(Z.location,st);break;case 3:e.vertexAttrib3fv(Z.location,st);break;case 4:e.vertexAttrib4fv(Z.location,st);break;default:e.vertexAttrib1fv(Z.location,st)}}}}v()}function T(){A();for(let O in i){let F=i[O];for(let z in F){let I=F[z];for(let X in I){let Y=I[X];for(let j in Y)h(Y[j].object),delete Y[j];delete I[X]}}delete i[O]}}function E(O){if(i[O.id]===void 0)return;let F=i[O.id];for(let z in F){let I=F[z];for(let X in I){let Y=I[X];for(let j in Y)h(Y[j].object),delete Y[j];delete I[X]}}delete i[O.id]}function w(O){for(let F in i){let z=i[F];for(let I in z){let X=z[I];if(X[O.id]===void 0)continue;let Y=X[O.id];for(let j in Y)h(Y[j].object),delete Y[j];delete X[O.id]}}}function _(O){for(let F in i){let z=i[F],I=O.isInstancedMesh===!0?O.id:0,X=z[I];if(X!==void 0){for(let Y in X){let j=X[Y];for(let at in j)h(j[at].object),delete j[at];delete X[Y]}delete z[I],Object.keys(z).length===0&&delete i[F]}}}function A(){R(),r=!0,a!==s&&(a=s,c(a.object))}function R(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:A,resetDefaultState:R,dispose:T,releaseStatesOfGeometry:E,releaseStatesOfObject:_,releaseStatesOfProgram:w,initAttributes:S,enableAttribute:g,disableUnusedAttributes:v}}function kN(e,t,n){let i;function s(l){i=l}function a(l,c){e.drawArrays(i,l,c),n.update(c,i,1)}function r(l,c,h){h!==0&&(e.drawArraysInstanced(i,l,c,h),n.update(c,i,h))}function o(l,c,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,h);let u=0;for(let p=0;p<h;p++)u+=c[p];n.update(u,i,1)}this.setMode=s,this.render=a,this.renderInstances=r,this.renderMultiDraw=o}function XN(e,t,n,i){let s;function a(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let w=t.get("EXT_texture_filter_anisotropic");s=e.getParameter(w.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function r(w){return!(w!==Pi&&i.convert(w)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(w){let _=w===$i&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(w!==Si&&w!==Qi&&!_&&i.convert(w)!==e.getParameter(e.IMPLEMENTATION_COLOR_READ_TYPE))}function l(w){if(w==="highp"){if(e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.HIGH_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.HIGH_FLOAT).precision>0)return"highp";w="mediump"}return w==="mediump"&&e.getShaderPrecisionFormat(e.VERTEX_SHADER,e.MEDIUM_FLOAT).precision>0&&e.getShaderPrecisionFormat(e.FRAGMENT_SHADER,e.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=n.precision!==void 0?n.precision:"highp",h=l(c);h!==c&&(Ot("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=n.logarithmicDepthBuffer===!0,u=n.reversedDepthBuffer===!0&&t.has("EXT_clip_control");n.reversedDepthBuffer===!0&&u===!1&&Ot("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let p=e.getParameter(e.MAX_TEXTURE_IMAGE_UNITS),m=e.getParameter(e.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=e.getParameter(e.MAX_TEXTURE_SIZE),g=e.getParameter(e.MAX_CUBE_MAP_TEXTURE_SIZE),f=e.getParameter(e.MAX_VERTEX_ATTRIBS),v=e.getParameter(e.MAX_VERTEX_UNIFORM_VECTORS),b=e.getParameter(e.MAX_VARYING_VECTORS),y=e.getParameter(e.MAX_FRAGMENT_UNIFORM_VECTORS),T=e.getParameter(e.MAX_SAMPLES),E=e.getParameter(e.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:a,getMaxPrecision:l,textureFormatReadable:r,textureTypeReadable:o,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:p,maxVertexTextures:m,maxTextureSize:S,maxCubemapSize:g,maxAttributes:f,maxVertexUniforms:v,maxVaryings:b,maxFragmentUniforms:y,maxSamples:T,samples:E}}function WN(e){let t=this,n=null,i=0,s=!1,a=!1,r=new vi,o=new Vt,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let p=d.length!==0||u||i!==0||s;return s=u,i=d.length,p},this.beginShadows=function(){a=!0,h(null)},this.endShadows=function(){a=!1},this.setGlobalState=function(d,u){n=h(d,u,0)},this.setState=function(d,u,p){let m=d.clippingPlanes,S=d.clipIntersection,g=d.clipShadows,f=e.get(d);if(!s||m===null||m.length===0||a&&!g)a?h(null):c();else{let v=a?0:i,b=v*4,y=f.clippingState||null;l.value=y,y=h(m,u,b,p);for(let T=0;T!==b;++T)y[T]=n[T];f.clippingState=y,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=v}};function c(){l.value!==n&&(l.value=n,l.needsUpdate=i>0),t.numPlanes=i,t.numIntersection=0}function h(d,u,p,m){let S=d!==null?d.length:0,g=null;if(S!==0){if(g=l.value,m!==!0||g===null){let f=p+S*4,v=u.matrixWorldInverse;o.getNormalMatrix(v),(g===null||g.length<f)&&(g=new Float32Array(f));for(let b=0,y=p;b!==S;++b,y+=4)r.copy(d[b]).applyMatrix4(v,o),r.normal.toArray(g,y),g[y+3]=r.constant}l.value=g,l.needsUpdate=!0}return t.numPlanes=S,t.numIntersection=0,g}}var El=4,qN=6,YN=20,ZN=256,bu=new cu,fE=new Wt,Zv=null,jv=0,Kv=0,Jv=!1,jN=new P,zr=new P,yp=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,n=0,i=.1,s=100,a={}){let{size:r=256,position:o=jN}=a;Zv=this._renderer.getRenderTarget(),jv=this._renderer.getActiveCubeFace(),Kv=this._renderer.getActiveMipmapLevel(),Jv=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(r);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(t,i,s,l,o),n>0&&this._blur(l,0,0,n),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(t,n=null){return this._fromTexture(t,n)}fromCubemap(t,n=null){return this._fromTexture(t,n)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=gE(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=mE(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(Zv,jv,Kv),this._renderer.xr.enabled=Jv,t.scissorTest=!1,Ml(t,0,0,t.width,t.height)}_fromTexture(t,n){t.mapping===Qa||t.mapping===Pr?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Zv=this._renderer.getRenderTarget(),jv=this._renderer.getActiveCubeFace(),Kv=this._renderer.getActiveMipmapLevel(),Jv=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=n||this._allocateTargets();return this._textureToCubeUV(t,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),n=4*this._cubeSize,i={magFilter:Mn,minFilter:Mn,generateMipmaps:!1,type:$i,format:Pi,colorSpace:kc,depthBuffer:!1},s=pE(t,n,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==n){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=pE(t,n,i);let{_lodMax:a}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=KN(a)),this._blurMaterial=QN(a,t,n),this._ggxMaterial=JN(a,t,n)}return s}_compileMaterial(t){let n=new Wn(new pn,t);this._renderer.compile(n,bu)}_sceneToCubeUV(t,n,i,s,a){let l=new Ln(90,1,n,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,p=d.toneMapping;d.getClearColor(fE),d.toneMapping=Ki,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Wn(new vl,new Xa({name:"PMREM.Background",side:qn,depthWrite:!1,depthTest:!1})));let S=this._backgroundBox,g=S.material,f=!1,v=t.background;v?v.isColor&&(g.color.copy(v),t.background=null,f=!0):(g.color.copy(fE),f=!0);for(let b=0;b<6;b++){let y=b%3;y===0?(l.up.set(0,c[b],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x+h[b],a.y,a.z)):y===1?(l.up.set(0,0,c[b]),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y+h[b],a.z)):(l.up.set(0,c[b],0),l.position.set(a.x,a.y,a.z),l.lookAt(a.x,a.y,a.z+h[b]));let T=this._cubeSize;Ml(s,y*T,b>2?T:0,T,T),d.setRenderTarget(s),f&&d.render(S,l),d.render(t,l)}d.toneMapping=p,d.autoClear=u,t.background=v}_textureToCubeUV(t,n){let i=this._renderer,s=t.mapping===Qa||t.mapping===Pr;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=gE()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=mE());let a=s?this._cubemapMaterial:this._equirectMaterial,r=this._lodMeshes[0];r.material=a;let o=a.uniforms;o.envMap.value=t;let l=this._cubeSize;Ml(n,0,0,3*l,2*l),i.setRenderTarget(n),i.render(r,bu)}_applyPMREM(t){let n=this._renderer,i=n.autoClear;n.autoClear=!1;let s=this._lodMeshes.length;for(let a=1;a<s;a++)this._applyGGXFilter(t,a-1,a);n.autoClear=i}_applyGGXFilter(t,n,i){let s=this._renderer,a=this._pingPongRenderTarget,r=this._ggxMaterial,o=this._lodMeshes[i];o.material=r;let l=r.uniforms,c=i/(this._lodMeshes.length-1),h=n/(this._lodMeshes.length-1),d=Math.sqrt(c*c-h*h),u=c*1.25,p=d*u,{_lodMax:m}=this,S=this._sizeLods[i],g=3*S*(i>m-El?i-m+El:0),f=4*(this._cubeSize-S);l.envMap.value=t.texture,l.roughness.value=p,l.mipInt.value=m-n,Ml(a,g,f,3*S,2*S),s.setRenderTarget(a),s.render(o,bu),l.envMap.value=a.texture,l.roughness.value=0,l.mipInt.value=m-i,Ml(t,g,f,3*S,2*S),s.setRenderTarget(t),s.render(o,bu)}_blur(t,n,i,s){let a=this._pingPongRenderTarget,r=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,a,n,i,r),this._blurPass(a,t,i,i,r)}_blurPass(t,n,i,s,a){let r=this._renderer,o=this._blurMaterial,l=this._lodMeshes[s];l.material=o;let c=o.uniforms;c.envMap.value=t.texture,c.sigma.value=a,c.mipInt.value=this._lodMax-i;let h=this._sizeLods[s],d=3*h*(s>this._lodMax-El?s-this._lodMax+El:0),u=4*(this._cubeSize-h);Ml(n,d,u,3*h,2*h),r.setRenderTarget(n),r.render(l,bu)}};function KN(e){let t=[],n=[],i=e,s=e-El+1+qN;for(let a=0;a<s;a++){let r=Math.pow(2,i);t.push(r);let o=1/(r-2),l=-o,c=1+o,h=[l,l,c,l,c,c,l,l,c,c,l,c],d=6,u=6,p=3,m=new Float32Array(p*u*d),S=new Float32Array(p*u*d);for(let f=0;f<d;f++){let v=f%3*2/3-1,b=f>2?0:-1,y=[v,b,0,v+2/3,b,0,v+2/3,b+1,0,v,b,0,v+2/3,b+1,0,v,b+1,0];m.set(y,p*u*f);for(let T=0;T<u;T++){let E=h[T*2]*2-1,w=h[T*2+1]*2-1;f===0?zr.set(1,w,E):f===1?zr.set(-E,1,-w):f===2?zr.set(-E,w,1):f===3?zr.set(-1,w,-E):f===4?zr.set(-E,-1,w):zr.set(E,w,-1),zr.toArray(S,(f*u+T)*p)}}let g=new pn;g.setAttribute("position",new Vn(m,p)),g.setAttribute("outputDirection",new Vn(S,p)),n.push(new Wn(g,null)),i>El&&i--}return{lodMeshes:n,sizeLods:t}}function pE(e,t,n){let i=new ti(e,t,n);return i.texture.mapping=pu,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ml(e,t,n,i,s){e.viewport.set(t,n,i,s),e.scissor.set(t,n,i,s)}function JN(e,t,n){return new yi({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:ZN,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:bp(),fragmentShader:`

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
		`,blending:Ts,depthTest:!1,depthWrite:!1})}function QN(e,t,n){return new yi({name:"SphericalGaussianBlur",defines:{SAMPLES:YN,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/n,CUBEUV_MAX_MIP:`${e}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:bp(),fragmentShader:`

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
		`,blending:Ts,depthTest:!1,depthWrite:!1})}function mE(){return new yi({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:bp(),fragmentShader:`

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
		`,blending:Ts,depthTest:!1,depthWrite:!1})}function gE(){return new yi({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:bp(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Ts,depthTest:!1,depthWrite:!1})}function bp(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var xp=class extends ti{constructor(t=1,n={}){super(t,t,n),this.isWebGLCubeRenderTarget=!0;let i={width:t,height:t,depth:1},s=[i,i,i,i,i,i];this.texture=new iu(s),this._setTextureOptions(n),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,n){this.texture.type=n.type,this.texture.colorSpace=n.colorSpace,this.texture.generateMipmaps=n.generateMipmaps,this.texture.minFilter=n.minFilter,this.texture.magFilter=n.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},s=new vl(5,5,5),a=new yi({name:"CubemapFromEquirect",uniforms:Br(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:qn,blending:Ts});a.uniforms.tEquirect.value=n;let r=new Wn(s,a),o=n.minFilter;return n.minFilter===$a&&(n.minFilter=Mn),new Cf(1,10,this).update(t,r),n.minFilter=o,r.geometry.dispose(),r.material.dispose(),this}clear(t,n=!0,i=!0,s=!0){let a=t.getRenderTarget();for(let r=0;r<6;r++)t.setRenderTarget(this,r),t.clear(n,i,s);t.setRenderTarget(a)}};function $N(e){let t=new WeakMap,n=new WeakMap,i=null;function s(u,p=!1){return u==null?null:p?r(u):a(u)}function a(u){if(u&&u.isTexture){let p=u.mapping;if(p===Nf||p===Df)if(t.has(u)){let m=t.get(u).texture;return o(m,u.mapping)}else{let m=u.image;if(m&&m.height>0){let S=new xp(m.height);return S.fromEquirectangularTexture(e,u),t.set(u,S),u.addEventListener("dispose",c),o(S.texture,u.mapping)}else return null}}return u}function r(u){if(u&&u.isTexture){let p=u.mapping,m=p===Nf||p===Df,S=p===Qa||p===Pr;if(m||S){let g=n.get(u),f=g!==void 0?g.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==f)return i===null&&(i=new yp(e)),g=m?i.fromEquirectangular(u,g):i.fromCubemap(u,g),g.texture.pmremVersion=u.pmremVersion,n.set(u,g),g.texture;if(g!==void 0)return g.texture;{let v=u.image;return m&&v&&v.height>0||S&&v&&l(v)?(i===null&&(i=new yp(e)),g=m?i.fromEquirectangular(u):i.fromCubemap(u),g.texture.pmremVersion=u.pmremVersion,n.set(u,g),u.addEventListener("dispose",h),g.texture):null}}}return u}function o(u,p){return p===Nf?u.mapping=Qa:p===Df&&(u.mapping=Pr),u}function l(u){let p=0,m=6;for(let S=0;S<m;S++)u[S]!==void 0&&p++;return p===m}function c(u){let p=u.target;p.removeEventListener("dispose",c);let m=t.get(p);m!==void 0&&(t.delete(p),m.dispose())}function h(u){let p=u.target;p.removeEventListener("dispose",h);let m=n.get(p);m!==void 0&&(n.delete(p),m.dispose())}function d(){t=new WeakMap,n=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:d}}function tD(e){let t={};function n(i){if(t[i]!==void 0)return t[i];let s=e.getExtension(i);return t[i]=s,s}return{has:function(i){return n(i)!==null},init:function(){n("EXT_color_buffer_float"),n("WEBGL_clip_cull_distance"),n("OES_texture_float_linear"),n("EXT_color_buffer_half_float"),n("WEBGL_multisampled_render_to_texture"),n("WEBGL_render_shared_exponent")},get:function(i){let s=n(i);return s===null&&Lr("WebGLRenderer: "+i+" extension not supported."),s}}}function eD(e,t,n,i){let s={},a=new WeakMap;function r(d){let u=d.target;u.index!==null&&t.remove(u.index);for(let m in u.attributes)t.remove(u.attributes[m]);u.removeEventListener("dispose",r),delete s[u.id];let p=a.get(u);p&&(t.remove(p),a.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,n.memory.geometries--}function o(d,u){return s[u.id]===!0||(u.addEventListener("dispose",r),s[u.id]=!0,n.memory.geometries++),u}function l(d){let u=d.attributes;for(let p in u)t.update(u[p],e.ARRAY_BUFFER)}function c(d){let u=[],p=d.index,m=d.attributes.position,S=0;if(m===void 0)return;if(p!==null){let v=p.array;S=p.version;for(let b=0,y=v.length;b<y;b+=3){let T=v[b+0],E=v[b+1],w=v[b+2];u.push(T,E,E,w,w,T)}}else{let v=m.array;S=m.version;for(let b=0,y=v.length/3-1;b<y;b+=3){let T=b+0,E=b+1,w=b+2;u.push(T,E,E,w,w,T)}}let g=new(m.count>=65535?Qc:Jc)(u,1);g.version=S;let f=a.get(d);f&&t.remove(f),a.set(d,g)}function h(d){let u=a.get(d);if(u){let p=d.index;p!==null&&u.version<p.version&&c(d)}else c(d);return a.get(d)}return{get:o,update:l,getWireframeAttribute:h}}function nD(e,t,n){let i;function s(d){i=d}let a,r;function o(d){a=d.type,r=d.bytesPerElement}function l(d,u){e.drawElements(i,u,a,d*r),n.update(u,i,1)}function c(d,u,p){p!==0&&(e.drawElementsInstanced(i,u,a,d*r,p),n.update(u,i,p))}function h(d,u,p){if(p===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,a,d,0,p);let S=0;for(let g=0;g<p;g++)S+=u[g];n.update(S,i,1)}this.setMode=s,this.setIndex=o,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function iD(e){let t={geometries:0,textures:0},n={frame:0,calls:0,triangles:0,points:0,lines:0};function i(a,r,o){switch(n.calls++,r){case e.TRIANGLES:n.triangles+=o*(a/3);break;case e.LINES:n.lines+=o*(a/2);break;case e.LINE_STRIP:n.lines+=o*(a-1);break;case e.LINE_LOOP:n.lines+=o*a;break;case e.POINTS:n.points+=o*a;break;default:Pt("WebGLInfo: Unknown draw mode:",r);break}}function s(){n.calls=0,n.triangles=0,n.points=0,n.lines=0}return{memory:t,render:n,programs:null,autoReset:!0,reset:s,update:i}}function sD(e,t,n){let i=new WeakMap,s=new Xe;function a(r,o,l){let c=r.morphTargetInfluences,h=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,d=h!==void 0?h.length:0,u=i.get(o);if(u===void 0||u.count!==d){let A=function(){w.dispose(),i.delete(o),o.removeEventListener("dispose",A)};u!==void 0&&u.texture.dispose();let p=o.morphAttributes.position!==void 0,m=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,g=o.morphAttributes.position||[],f=o.morphAttributes.normal||[],v=o.morphAttributes.color||[],b=0;p===!0&&(b=1),m===!0&&(b=2),S===!0&&(b=3);let y=o.attributes.position.count*b,T=1;y>t.maxTextureSize&&(T=Math.ceil(y/t.maxTextureSize),y=t.maxTextureSize);let E=new Float32Array(y*T*4*d),w=new Zc(E,y,T,d);w.type=Qi,w.needsUpdate=!0;let _=b*4;for(let R=0;R<d;R++){let O=g[R],F=f[R],z=v[R],I=y*T*4*R;for(let X=0;X<O.count;X++){let Y=X*_;p===!0&&(s.fromBufferAttribute(O,X),E[I+Y+0]=s.x,E[I+Y+1]=s.y,E[I+Y+2]=s.z,E[I+Y+3]=0),m===!0&&(s.fromBufferAttribute(F,X),E[I+Y+4]=s.x,E[I+Y+5]=s.y,E[I+Y+6]=s.z,E[I+Y+7]=0),S===!0&&(s.fromBufferAttribute(z,X),E[I+Y+8]=s.x,E[I+Y+9]=s.y,E[I+Y+10]=s.z,E[I+Y+11]=z.itemSize===4?s.w:1)}}u={count:d,texture:w,size:new Ut(y,T)},i.set(o,u),o.addEventListener("dispose",A)}if(r.isInstancedMesh===!0&&r.morphTexture!==null)l.getUniforms().setValue(e,"morphTexture",r.morphTexture,n);else{let p=0;for(let S=0;S<c.length;S++)p+=c[S];let m=o.morphTargetsRelative?1:1-p;l.getUniforms().setValue(e,"morphTargetBaseInfluence",m),l.getUniforms().setValue(e,"morphTargetInfluences",c)}l.getUniforms().setValue(e,"morphTargetsTexture",u.texture,n),l.getUniforms().setValue(e,"morphTargetsTextureSize",u.size)}return{update:a}}function aD(e,t,n,i,s){let a=new WeakMap;function r(c){let h=s.render.frame,d=c.geometry,u=t.get(c,d);if(a.get(u)!==h&&(t.update(u),a.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),a.get(c)!==h&&(n.update(c.instanceMatrix,e.ARRAY_BUFFER),c.instanceColor!==null&&n.update(c.instanceColor,e.ARRAY_BUFFER),a.set(c,h))),c.isSkinnedMesh){let p=c.skeleton;a.get(p)!==h&&(p.update(),a.set(p,h))}return u}function o(){a=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),i.releaseStatesOfObject(h),n.remove(h.instanceMatrix),h.instanceColor!==null&&n.remove(h.instanceColor)}return{update:r,dispose:o}}var rD={[Tv]:"LINEAR_TONE_MAPPING",[wv]:"REINHARD_TONE_MAPPING",[Av]:"CINEON_TONE_MAPPING",[Cv]:"ACES_FILMIC_TONE_MAPPING",[Nv]:"AGX_TONE_MAPPING",[Dv]:"NEUTRAL_TONE_MAPPING",[Rv]:"CUSTOM_TONE_MAPPING"};function oD(e,t,n,i,s,a){let r=new ti(t,n,{type:e,depthBuffer:s,stencilBuffer:a,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),o=null,l=null,c=new pn;c.setAttribute("position",new Un([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new Un([0,2,0,0,2,0],2));let h=new mf({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),d=new Wn(c,h),u=new cu(-1,1,1,-1,0,1),p=null,m=null,S=!1,g,f=null,v=[],b=!1;this.setSize=function(y,T){r.setSize(y,T),o!==null&&o.setSize(y,T),l!==null&&l.setSize(y,T);for(let E=0;E<v.length;E++){let w=v[E];w.setSize&&w.setSize(y,T)}},this.setEffects=function(y){v=y,b=v.length>0&&v[0].isRenderPass===!0;let T=r.width,E=r.height;v.length>0&&o===null&&(o=new ti(T,E,{type:$i,depthBuffer:!1,stencilBuffer:!1}),l=new ti(T,E,{type:$i,depthBuffer:!1,stencilBuffer:!1}));for(let w=0;w<v.length;w++){let _=v[w];_.setSize&&_.setSize(T,E)}},this.begin=function(y,T){if(S||y.toneMapping===Ki&&v.length===0)return!1;if(f=T,T!==null){let E=T.width,w=T.height;(r.width!==E||r.height!==w)&&this.setSize(E,w)}return b===!1&&y.setRenderTarget(r),g=y.toneMapping,y.toneMapping=Ki,!0},this.hasRenderPass=function(){return b},this.end=function(y,T){y.toneMapping=g,S=!0;let E=r,w=o;for(let _=0;_<v.length;_++){let A=v[_];A.enabled!==!1&&(A.render(y,w,E,T),A.needsSwap!==!1&&(E=w,w=w===o?l:o))}if(p!==y.outputColorSpace||m!==y.toneMapping){p=y.outputColorSpace,m=y.toneMapping,h.defines={},ie.getTransfer(p)===me&&(h.defines.SRGB_TRANSFER="");let _=rD[m];_&&(h.defines[_]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=E.texture,y.setRenderTarget(f),y.render(d,u),f=null,S=!1},this.isCompositing=function(){return S},this.dispose=function(){r.dispose(),o!==null&&o.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}var PE=new kn,t_=new Wa(1,1),BE=new Zc,zE=new cf,FE=new iu,vE=[],_E=[],yE=new Float32Array(16),xE=new Float32Array(9),SE=new Float32Array(4);function wl(e,t,n){let i=e[0];if(i<=0||i>0)return e;let s=t*n,a=vE[s];if(a===void 0&&(a=new Float32Array(s),vE[s]=a),t!==0){i.toArray(a,0);for(let r=1,o=0;r!==t;++r)o+=n,e[r].toArray(a,o)}return a}function an(e,t){if(e.length!==t.length)return!1;for(let n=0,i=e.length;n<i;n++)if(e[n]!==t[n])return!1;return!0}function rn(e,t){for(let n=0,i=t.length;n<i;n++)e[n]=t[n]}function Mp(e,t){let n=_E[t];n===void 0&&(n=new Int32Array(t),_E[t]=n);for(let i=0;i!==t;++i)n[i]=e.allocateTextureUnit();return n}function lD(e,t){let n=this.cache;n[0]!==t&&(e.uniform1f(this.addr,t),n[0]=t)}function cD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2f(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(an(n,t))return;e.uniform2fv(this.addr,t),rn(n,t)}}function uD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3f(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else if(t.r!==void 0)(n[0]!==t.r||n[1]!==t.g||n[2]!==t.b)&&(e.uniform3f(this.addr,t.r,t.g,t.b),n[0]=t.r,n[1]=t.g,n[2]=t.b);else{if(an(n,t))return;e.uniform3fv(this.addr,t),rn(n,t)}}function hD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4f(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(an(n,t))return;e.uniform4fv(this.addr,t),rn(n,t)}}function dD(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(an(n,t))return;e.uniformMatrix2fv(this.addr,!1,t),rn(n,t)}else{if(an(n,i))return;SE.set(i),e.uniformMatrix2fv(this.addr,!1,SE),rn(n,i)}}function fD(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(an(n,t))return;e.uniformMatrix3fv(this.addr,!1,t),rn(n,t)}else{if(an(n,i))return;xE.set(i),e.uniformMatrix3fv(this.addr,!1,xE),rn(n,i)}}function pD(e,t){let n=this.cache,i=t.elements;if(i===void 0){if(an(n,t))return;e.uniformMatrix4fv(this.addr,!1,t),rn(n,t)}else{if(an(n,i))return;yE.set(i),e.uniformMatrix4fv(this.addr,!1,yE),rn(n,i)}}function mD(e,t){let n=this.cache;n[0]!==t&&(e.uniform1i(this.addr,t),n[0]=t)}function gD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2i(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(an(n,t))return;e.uniform2iv(this.addr,t),rn(n,t)}}function vD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3i(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(an(n,t))return;e.uniform3iv(this.addr,t),rn(n,t)}}function _D(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4i(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(an(n,t))return;e.uniform4iv(this.addr,t),rn(n,t)}}function yD(e,t){let n=this.cache;n[0]!==t&&(e.uniform1ui(this.addr,t),n[0]=t)}function xD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y)&&(e.uniform2ui(this.addr,t.x,t.y),n[0]=t.x,n[1]=t.y);else{if(an(n,t))return;e.uniform2uiv(this.addr,t),rn(n,t)}}function SD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z)&&(e.uniform3ui(this.addr,t.x,t.y,t.z),n[0]=t.x,n[1]=t.y,n[2]=t.z);else{if(an(n,t))return;e.uniform3uiv(this.addr,t),rn(n,t)}}function bD(e,t){let n=this.cache;if(t.x!==void 0)(n[0]!==t.x||n[1]!==t.y||n[2]!==t.z||n[3]!==t.w)&&(e.uniform4ui(this.addr,t.x,t.y,t.z,t.w),n[0]=t.x,n[1]=t.y,n[2]=t.z,n[3]=t.w);else{if(an(n,t))return;e.uniform4uiv(this.addr,t),rn(n,t)}}function MD(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s);let a;this.type===e.SAMPLER_2D_SHADOW?(t_.compareFunction=n.isReversedDepthBuffer()?gp:mp,a=t_):a=PE,n.setTexture2D(t||a,s)}function ED(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture3D(t||zE,s)}function TD(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTextureCube(t||FE,s)}function wD(e,t,n){let i=this.cache,s=n.allocateTextureUnit();i[0]!==s&&(e.uniform1i(this.addr,s),i[0]=s),n.setTexture2DArray(t||BE,s)}function AD(e){switch(e){case 5126:return lD;case 35664:return cD;case 35665:return uD;case 35666:return hD;case 35674:return dD;case 35675:return fD;case 35676:return pD;case 5124:case 35670:return mD;case 35667:case 35671:return gD;case 35668:case 35672:return vD;case 35669:case 35673:return _D;case 5125:return yD;case 36294:return xD;case 36295:return SD;case 36296:return bD;case 35678:case 36198:case 36298:case 36306:case 35682:return MD;case 35679:case 36299:case 36307:return ED;case 35680:case 36300:case 36308:case 36293:return TD;case 36289:case 36303:case 36311:case 36292:return wD}}function CD(e,t){e.uniform1fv(this.addr,t)}function RD(e,t){let n=wl(t,this.size,2);e.uniform2fv(this.addr,n)}function ND(e,t){let n=wl(t,this.size,3);e.uniform3fv(this.addr,n)}function DD(e,t){let n=wl(t,this.size,4);e.uniform4fv(this.addr,n)}function LD(e,t){let n=wl(t,this.size,4);e.uniformMatrix2fv(this.addr,!1,n)}function UD(e,t){let n=wl(t,this.size,9);e.uniformMatrix3fv(this.addr,!1,n)}function ID(e,t){let n=wl(t,this.size,16);e.uniformMatrix4fv(this.addr,!1,n)}function OD(e,t){e.uniform1iv(this.addr,t)}function PD(e,t){e.uniform2iv(this.addr,t)}function BD(e,t){e.uniform3iv(this.addr,t)}function zD(e,t){e.uniform4iv(this.addr,t)}function FD(e,t){e.uniform1uiv(this.addr,t)}function GD(e,t){e.uniform2uiv(this.addr,t)}function HD(e,t){e.uniform3uiv(this.addr,t)}function VD(e,t){e.uniform4uiv(this.addr,t)}function kD(e,t,n){let i=this.cache,s=t.length,a=Mp(n,s);an(i,a)||(e.uniform1iv(this.addr,a),rn(i,a));let r;this.type===e.SAMPLER_2D_SHADOW?r=t_:r=PE;for(let o=0;o!==s;++o)n.setTexture2D(t[o]||r,a[o])}function XD(e,t,n){let i=this.cache,s=t.length,a=Mp(n,s);an(i,a)||(e.uniform1iv(this.addr,a),rn(i,a));for(let r=0;r!==s;++r)n.setTexture3D(t[r]||zE,a[r])}function WD(e,t,n){let i=this.cache,s=t.length,a=Mp(n,s);an(i,a)||(e.uniform1iv(this.addr,a),rn(i,a));for(let r=0;r!==s;++r)n.setTextureCube(t[r]||FE,a[r])}function qD(e,t,n){let i=this.cache,s=t.length,a=Mp(n,s);an(i,a)||(e.uniform1iv(this.addr,a),rn(i,a));for(let r=0;r!==s;++r)n.setTexture2DArray(t[r]||BE,a[r])}function YD(e){switch(e){case 5126:return CD;case 35664:return RD;case 35665:return ND;case 35666:return DD;case 35674:return LD;case 35675:return UD;case 35676:return ID;case 5124:case 35670:return OD;case 35667:case 35671:return PD;case 35668:case 35672:return BD;case 35669:case 35673:return zD;case 5125:return FD;case 36294:return GD;case 36295:return HD;case 36296:return VD;case 35678:case 36198:case 36298:case 36306:case 35682:return kD;case 35679:case 36299:case 36307:return XD;case 35680:case 36300:case 36308:case 36293:return WD;case 36289:case 36303:case 36311:case 36292:return qD}}var e_=class{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.setValue=AD(n.type)}},n_=class{constructor(t,n,i){this.id=t,this.addr=i,this.cache=[],this.type=n.type,this.size=n.size,this.setValue=YD(n.type)}},i_=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,n,i){let s=this.seq;for(let a=0,r=s.length;a!==r;++a){let o=s[a];o.setValue(t,n[o.id],i)}}},Qv=/(\w+)(\])?(\[|\.)?/g;function bE(e,t){e.seq.push(t),e.map[t.id]=t}function ZD(e,t,n){let i=e.name,s=i.length;for(Qv.lastIndex=0;;){let a=Qv.exec(i),r=Qv.lastIndex,o=a[1],l=a[2]==="]",c=a[3];if(l&&(o=o|0),c===void 0||c==="["&&r+2===s){bE(n,c===void 0?new e_(o,e,t):new n_(o,e,t));break}else{let d=n.map[o];d===void 0&&(d=new i_(o),bE(n,d)),n=d}}}var Tl=class{constructor(t,n){this.seq=[],this.map={};let i=t.getProgramParameter(n,t.ACTIVE_UNIFORMS);for(let r=0;r<i;++r){let o=t.getActiveUniform(n,r),l=t.getUniformLocation(n,o.name);ZD(o,l,this)}let s=[],a=[];for(let r of this.seq)r.type===t.SAMPLER_2D_SHADOW||r.type===t.SAMPLER_CUBE_SHADOW||r.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(r):a.push(r);s.length>0&&(this.seq=s.concat(a))}setValue(t,n,i,s){let a=this.map[n];a!==void 0&&a.setValue(t,i,s)}setOptional(t,n,i){let s=n[i];s!==void 0&&this.setValue(t,i,s)}static upload(t,n,i,s){for(let a=0,r=n.length;a!==r;++a){let o=n[a],l=i[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,n){let i=[];for(let s=0,a=t.length;s!==a;++s){let r=t[s];r.id in n&&i.push(r)}return i}};function ME(e,t,n){let i=e.createShader(t);return e.shaderSource(i,n),e.compileShader(i),i}var jD=37297,KD=0;function JD(e,t){let n=e.split(`
`),i=[],s=Math.max(t-6,0),a=Math.min(t+6,n.length);for(let r=s;r<a;r++){let o=r+1;i.push(`${o===t?">":" "} ${o}: ${n[r]}`)}return i.join(`
`)}var EE=new Vt;function QD(e){ie._getMatrix(EE,ie.workingColorSpace,e);let t=`mat3( ${EE.elements.map(n=>n.toFixed(4))} )`;switch(ie.getTransfer(e)){case Xc:return[t,"LinearTransferOETF"];case me:return[t,"sRGBTransferOETF"];default:return Ot("WebGLProgram: Unsupported color space: ",e),[t,"LinearTransferOETF"]}}function TE(e,t,n){let i=e.getShaderParameter(t,e.COMPILE_STATUS),a=(e.getShaderInfoLog(t)||"").trim();if(i&&a==="")return"";let r=/ERROR: 0:(\d+)/.exec(a);if(r){let o=parseInt(r[1]);return n.toUpperCase()+`

`+a+`

`+JD(e.getShaderSource(t),o)}else return a}function $D(e,t){let n=QD(t);return[`vec4 ${e}( vec4 value ) {`,`	return ${n[1]}( vec4( value.rgb * ${n[0]}, value.a ) );`,"}"].join(`
`)}var tL={[Tv]:"Linear",[wv]:"Reinhard",[Av]:"Cineon",[Cv]:"ACESFilmic",[Nv]:"AgX",[Dv]:"Neutral",[Rv]:"Custom"};function eL(e,t){let n=tL[t];return n===void 0?(Ot("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+e+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+e+"( vec3 color ) { return "+n+"ToneMapping( color ); }"}var _p=new P;function nL(){ie.getLuminanceCoefficients(_p);let e=_p.x.toFixed(4),t=_p.y.toFixed(4),n=_p.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${e}, ${t}, ${n} );`,"	return dot( weights, rgb );","}"].join(`
`)}function iL(e){return[e.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",e.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Eu).join(`
`)}function sL(e){let t=[];for(let n in e){let i=e[n];i!==!1&&t.push("#define "+n+" "+i)}return t.join(`
`)}function aL(e,t){let n={},i=e.getProgramParameter(t,e.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let a=e.getActiveAttrib(t,s),r=a.name,o=1;a.type===e.FLOAT_MAT2&&(o=2),a.type===e.FLOAT_MAT3&&(o=3),a.type===e.FLOAT_MAT4&&(o=4),n[r]={type:a.type,location:e.getAttribLocation(t,r),locationSize:o}}return n}function Eu(e){return e!==""}function wE(e,t){let n=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return e.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,n).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function AE(e,t){return e.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var rL=/^[ \t]*#include +<([\w\d./]+)>/gm;function s_(e){return e.replace(rL,lL)}var oL=new Map;function lL(e,t){let n=Yt[t];if(n===void 0){let i=oL.get(t);if(i!==void 0)n=Yt[i],Ot('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return s_(n)}var cL=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function CE(e){return e.replace(cL,uL)}function uL(e,t,n,i){let s="";for(let a=parseInt(t);a<parseInt(n);a++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+a+" ]").replace(/UNROLLED_LOOP_INDEX/g,a);return s}function RE(e){let t=`precision ${e.precision} float;
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
#define LOW_PRECISION`),t}var hL={[du]:"SHADOWMAP_TYPE_PCF",[yl]:"SHADOWMAP_TYPE_VSM"};function dL(e){return hL[e.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var fL={[Qa]:"ENVMAP_TYPE_CUBE",[Pr]:"ENVMAP_TYPE_CUBE",[pu]:"ENVMAP_TYPE_CUBE_UV"};function pL(e){return e.envMap===!1?"ENVMAP_TYPE_CUBE":fL[e.envMapMode]||"ENVMAP_TYPE_CUBE"}var mL={[Pr]:"ENVMAP_MODE_REFRACTION"};function gL(e){return e.envMap===!1?"ENVMAP_MODE_REFLECTION":mL[e.envMapMode]||"ENVMAP_MODE_REFLECTION"}var vL={[Ev]:"ENVMAP_BLENDING_MULTIPLY",[q1]:"ENVMAP_BLENDING_MIX",[Y1]:"ENVMAP_BLENDING_ADD"};function _L(e){return e.envMap===!1?"ENVMAP_BLENDING_NONE":vL[e.combine]||"ENVMAP_BLENDING_NONE"}function yL(e){let t=e.envMapCubeUVHeight;if(t===null)return null;let n=Math.log2(t)-2,i=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,n),112)),texelHeight:i,maxMip:n}}function xL(e,t,n,i){let s=e.getContext(),a=n.defines,r=n.vertexShader,o=n.fragmentShader,l=dL(n),c=pL(n),h=gL(n),d=_L(n),u=yL(n),p=iL(n),m=sL(a),S=s.createProgram(),g,f,v=n.glslVersion?"#version "+n.glslVersion+`
`:"";n.isRawShaderMaterial?(g=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(Eu).join(`
`),g.length>0&&(g+=`
`),f=["#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m].filter(Eu).join(`
`),f.length>0&&(f+=`
`)):(g=[RE(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",n.batching?"#define USE_BATCHING":"",n.batchingColor?"#define USE_BATCHING_COLOR":"",n.instancing?"#define USE_INSTANCING":"",n.instancingColor?"#define USE_INSTANCING_COLOR":"",n.instancingMorph?"#define USE_INSTANCING_MORPH":"",n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.map?"#define USE_MAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+h:"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.displacementMap?"#define USE_DISPLACEMENTMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.mapUv?"#define MAP_UV "+n.mapUv:"",n.alphaMapUv?"#define ALPHAMAP_UV "+n.alphaMapUv:"",n.lightMapUv?"#define LIGHTMAP_UV "+n.lightMapUv:"",n.aoMapUv?"#define AOMAP_UV "+n.aoMapUv:"",n.emissiveMapUv?"#define EMISSIVEMAP_UV "+n.emissiveMapUv:"",n.bumpMapUv?"#define BUMPMAP_UV "+n.bumpMapUv:"",n.normalMapUv?"#define NORMALMAP_UV "+n.normalMapUv:"",n.displacementMapUv?"#define DISPLACEMENTMAP_UV "+n.displacementMapUv:"",n.metalnessMapUv?"#define METALNESSMAP_UV "+n.metalnessMapUv:"",n.roughnessMapUv?"#define ROUGHNESSMAP_UV "+n.roughnessMapUv:"",n.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+n.anisotropyMapUv:"",n.clearcoatMapUv?"#define CLEARCOATMAP_UV "+n.clearcoatMapUv:"",n.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+n.clearcoatNormalMapUv:"",n.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+n.clearcoatRoughnessMapUv:"",n.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+n.iridescenceMapUv:"",n.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+n.iridescenceThicknessMapUv:"",n.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+n.sheenColorMapUv:"",n.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+n.sheenRoughnessMapUv:"",n.specularMapUv?"#define SPECULARMAP_UV "+n.specularMapUv:"",n.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+n.specularColorMapUv:"",n.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+n.specularIntensityMapUv:"",n.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+n.transmissionMapUv:"",n.thicknessMapUv?"#define THICKNESSMAP_UV "+n.thicknessMapUv:"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexNormals?"#define HAS_NORMAL":"",n.vertexColors?"#define USE_COLOR":"",n.vertexAlphas?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.flatShading?"#define FLAT_SHADED":"",n.skinning?"#define USE_SKINNING":"",n.morphTargets?"#define USE_MORPHTARGETS":"",n.morphNormals&&n.flatShading===!1?"#define USE_MORPHNORMALS":"",n.morphColors?"#define USE_MORPHCOLORS":"",n.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+n.morphTextureStride:"",n.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+n.morphTargetsCount:"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.sizeAttenuation?"#define USE_SIZEATTENUATION":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Eu).join(`
`),f=[RE(n),"#define SHADER_TYPE "+n.shaderType,"#define SHADER_NAME "+n.shaderName,m,n.useFog&&n.fog?"#define USE_FOG":"",n.useFog&&n.fogExp2?"#define FOG_EXP2":"",n.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",n.map?"#define USE_MAP":"",n.matcap?"#define USE_MATCAP":"",n.envMap?"#define USE_ENVMAP":"",n.envMap?"#define "+c:"",n.envMap?"#define "+h:"",n.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",n.lightMap?"#define USE_LIGHTMAP":"",n.aoMap?"#define USE_AOMAP":"",n.bumpMap?"#define USE_BUMPMAP":"",n.normalMap?"#define USE_NORMALMAP":"",n.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",n.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",n.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",n.emissiveMap?"#define USE_EMISSIVEMAP":"",n.anisotropy?"#define USE_ANISOTROPY":"",n.anisotropyMap?"#define USE_ANISOTROPYMAP":"",n.clearcoat?"#define USE_CLEARCOAT":"",n.clearcoatMap?"#define USE_CLEARCOATMAP":"",n.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",n.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",n.dispersion?"#define USE_DISPERSION":"",n.retroreflection?"#define USE_RETROREFLECTION":"",n.iridescence?"#define USE_IRIDESCENCE":"",n.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",n.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",n.specularMap?"#define USE_SPECULARMAP":"",n.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",n.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",n.roughnessMap?"#define USE_ROUGHNESSMAP":"",n.metalnessMap?"#define USE_METALNESSMAP":"",n.alphaMap?"#define USE_ALPHAMAP":"",n.alphaTest?"#define USE_ALPHATEST":"",n.alphaHash?"#define USE_ALPHAHASH":"",n.sheen?"#define USE_SHEEN":"",n.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",n.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",n.transmission?"#define USE_TRANSMISSION":"",n.transmissionMap?"#define USE_TRANSMISSIONMAP":"",n.thicknessMap?"#define USE_THICKNESSMAP":"",n.vertexTangents&&n.flatShading===!1?"#define USE_TANGENT":"",n.vertexColors||n.instancingColor?"#define USE_COLOR":"",n.vertexAlphas||n.batchingColor?"#define USE_COLOR_ALPHA":"",n.vertexUv1s?"#define USE_UV1":"",n.vertexUv2s?"#define USE_UV2":"",n.vertexUv3s?"#define USE_UV3":"",n.pointsUvs?"#define USE_POINTS_UV":"",n.gradientMap?"#define USE_GRADIENTMAP":"",n.flatShading?"#define FLAT_SHADED":"",n.doubleSided?"#define DOUBLE_SIDED":"",n.flipSided?"#define FLIP_SIDED":"",n.shadowMapEnabled?"#define USE_SHADOWMAP":"",n.shadowMapEnabled?"#define "+l:"",n.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",n.numLightProbes>0?"#define USE_LIGHT_PROBES":"",n.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",n.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",n.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",n.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",n.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",n.toneMapping!==Ki?"#define TONE_MAPPING":"",n.toneMapping!==Ki?Yt.tonemapping_pars_fragment:"",n.toneMapping!==Ki?eL("toneMapping",n.toneMapping):"",n.dithering?"#define DITHERING":"",n.opaque?"#define OPAQUE":"",Yt.colorspace_pars_fragment,$D("linearToOutputTexel",n.outputColorSpace),nL(),n.useDepthPacking?"#define DEPTH_PACKING "+n.depthPacking:"",`
`].filter(Eu).join(`
`)),r=s_(r),r=wE(r,n),r=AE(r,n),o=s_(o),o=wE(o,n),o=AE(o,n),r=CE(r),o=CE(o),n.isRawShaderMaterial!==!0&&(v=`#version 300 es
`,g=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,f=["#define varying in",n.glslVersion===Vv?"":"layout(location = 0) out highp vec4 pc_fragColor;",n.glslVersion===Vv?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+f);let b=v+g+r,y=v+f+o,T=ME(s,s.VERTEX_SHADER,b),E=ME(s,s.FRAGMENT_SHADER,y);s.attachShader(S,T),s.attachShader(S,E),n.index0AttributeName!==void 0?s.bindAttribLocation(S,0,n.index0AttributeName):n.hasPositionAttribute===!0&&s.bindAttribLocation(S,0,"position"),s.linkProgram(S);function w(O){if(e.debug.checkShaderErrors){let F=s.getProgramInfoLog(S)||"",z=s.getShaderInfoLog(T)||"",I=s.getShaderInfoLog(E)||"",X=F.trim(),Y=z.trim(),j=I.trim(),at=!0,Z=!0;if(s.getProgramParameter(S,s.LINK_STATUS)===!1)if(at=!1,typeof e.debug.onShaderError=="function")e.debug.onShaderError(s,S,T,E);else{let nt=TE(s,T,"vertex"),st=TE(s,E,"fragment");Pt("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(S,s.VALIDATE_STATUS)+`

Material Name: `+O.name+`
Material Type: `+O.type+`

Program Info Log: `+X+`
`+nt+`
`+st)}else X!==""?Ot("WebGLProgram: Program Info Log:",X):(Y===""||j==="")&&(Z=!1);Z&&(O.diagnostics={runnable:at,programLog:X,vertexShader:{log:Y,prefix:g},fragmentShader:{log:j,prefix:f}})}s.deleteShader(T),s.deleteShader(E),_=new Tl(s,S),A=aL(s,S)}let _;this.getUniforms=function(){return _===void 0&&w(this),_};let A;this.getAttributes=function(){return A===void 0&&w(this),A};let R=n.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return R===!1&&(R=s.getProgramParameter(S,jD)),R},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(S),this.program=void 0},this.type=n.shaderType,this.name=n.shaderName,this.id=KD++,this.cacheKey=t,this.usedTimes=1,this.program=S,this.vertexShader=T,this.fragmentShader=E,this}var SL=0,a_=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,n,i){let s=this._getShaderCacheForMaterial(t);return s.has(n)===!1&&(s.add(n),n.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(t){let n=this.materialCache.get(t);for(let i of n)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let n=this.materialCache,i=n.get(t);return i===void 0&&(i=new Set,n.set(t,i)),i}_getShaderStage(t){let n=this.shaderCache,i=n.get(t);return i===void 0&&(i=new r_(t),n.set(t,i)),i}},r_=class{constructor(t){this.id=SL++,this.code=t,this.usedTimes=0}};function bL(e){return e===er||e===xu||e===Su}function ML(e,t,n,i,s,a){let r=new hl,o=new a_,l=new Set,c=[],h=new Map,d=i.logarithmicDepthBuffer,u=i.precision,p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(_){return l.add(_),_===0?"uv":`uv${_}`}function S(_,A,R,O,F,z){let I=O.fog,X=F.geometry,Y=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?O.environment:null,j=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,at=t.get(_.envMap||Y,j),Z=at&&at.mapping===pu?at.image.height:null,nt=p[_.type];_.precision!==null&&(u=i.getMaxPrecision(_.precision),u!==_.precision&&Ot("WebGLProgram.getParameters:",_.precision,"not supported, using",u,"instead."));let st=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,Dt=st!==void 0?st.length:0,At=0;X.morphAttributes.position!==void 0&&(At=1),X.morphAttributes.normal!==void 0&&(At=2),X.morphAttributes.color!==void 0&&(At=3);let se,Kt,re,K;if(nt){let de=Cs[nt];se=de.vertexShader,Kt=de.fragmentShader}else{se=_.vertexShader,Kt=_.fragmentShader;let de=o.getVertexShaderStage(_),le=o.getFragmentShaderStage(_);o.update(_,de,le),re=de.id,K=le.id}let et=e.getRenderTarget(),xt=e.state.buffers.depth.getReversed(),Bt=F.isInstancedMesh===!0,yt=F.isBatchedMesh===!0,Ft=!!_.map,Ve=!!_.matcap,It=!!at,ae=!!_.aoMap,ge=!!_.lightMap,kt=!!_.bumpMap&&_.wireframe===!1,Ce=!!_.normalMap,Ie=!!_.displacementMap,En=!!_.emissiveMap,Oe=!!_.metalnessMap,Pe=!!_.roughnessMap,U=_.anisotropy>0,je=_.clearcoat>0,Jt=_.dispersion>0,C=_.retroreflectivity>0,x=_.iridescence>0,B=_.sheen>0,k=_.transmission>0,q=U&&!!_.anisotropyMap,rt=je&&!!_.clearcoatMap,ot=je&&!!_.clearcoatNormalMap,J=je&&!!_.clearcoatRoughnessMap,$=x&&!!_.iridescenceMap,ct=x&&!!_.iridescenceThicknessMap,wt=B&&!!_.sheenColorMap,ut=B&&!!_.sheenRoughnessMap,lt=!!_.specularMap,Ct=!!_.specularColorMap,Lt=!!_.specularIntensityMap,Gt=k&&!!_.transmissionMap,L=k&&!!_.thicknessMap,ht=!!_.gradientMap,Q=!!_.alphaMap,ft=_.alphaTest>0,vt=!!_.alphaHash,it=!!_.extensions,Nt=Ki;_.toneMapped&&(et===null||et.isXRRenderTarget===!0)&&(Nt=e.toneMapping);let Mt={shaderID:nt,shaderType:_.type,shaderName:_.name,vertexShader:se,fragmentShader:Kt,defines:_.defines,customVertexShaderID:re,customFragmentShaderID:K,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:u,batching:yt,batchingColor:yt&&F._colorsTexture!==null,instancing:Bt,instancingColor:Bt&&F.instanceColor!==null,instancingMorph:Bt&&F.morphTexture!==null,outputColorSpace:et===null?e.outputColorSpace:et.isXRRenderTarget===!0?et.texture.colorSpace:ie.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:Ft,matcap:Ve,envMap:It,envMapMode:It&&at.mapping,envMapCubeUVHeight:Z,aoMap:ae,lightMap:ge,bumpMap:kt,normalMap:Ce,displacementMap:Ie,emissiveMap:En,normalMapObjectSpace:Ce&&_.normalMapType===K1,normalMapTangentSpace:Ce&&_.normalMapType===Gv,packedNormalMap:Ce&&_.normalMapType===Gv&&bL(_.normalMap.format),metalnessMap:Oe,roughnessMap:Pe,anisotropy:U,anisotropyMap:q,clearcoat:je,clearcoatMap:rt,clearcoatNormalMap:ot,clearcoatRoughnessMap:J,dispersion:Jt,retroreflection:C,iridescence:x,iridescenceMap:$,iridescenceThicknessMap:ct,sheen:B,sheenColorMap:wt,sheenRoughnessMap:ut,specularMap:lt,specularColorMap:Ct,specularIntensityMap:Lt,transmission:k,transmissionMap:Gt,thicknessMap:L,gradientMap:ht,opaque:_.transparent===!1&&_.blending===xl&&_.alphaToCoverage===!1,alphaMap:Q,alphaTest:ft,alphaHash:vt,combine:_.combine,mapUv:Ft&&m(_.map.channel),aoMapUv:ae&&m(_.aoMap.channel),lightMapUv:ge&&m(_.lightMap.channel),bumpMapUv:kt&&m(_.bumpMap.channel),normalMapUv:Ce&&m(_.normalMap.channel),displacementMapUv:Ie&&m(_.displacementMap.channel),emissiveMapUv:En&&m(_.emissiveMap.channel),metalnessMapUv:Oe&&m(_.metalnessMap.channel),roughnessMapUv:Pe&&m(_.roughnessMap.channel),anisotropyMapUv:q&&m(_.anisotropyMap.channel),clearcoatMapUv:rt&&m(_.clearcoatMap.channel),clearcoatNormalMapUv:ot&&m(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:J&&m(_.clearcoatRoughnessMap.channel),iridescenceMapUv:$&&m(_.iridescenceMap.channel),iridescenceThicknessMapUv:ct&&m(_.iridescenceThicknessMap.channel),sheenColorMapUv:wt&&m(_.sheenColorMap.channel),sheenRoughnessMapUv:ut&&m(_.sheenRoughnessMap.channel),specularMapUv:lt&&m(_.specularMap.channel),specularColorMapUv:Ct&&m(_.specularColorMap.channel),specularIntensityMapUv:Lt&&m(_.specularIntensityMap.channel),transmissionMapUv:Gt&&m(_.transmissionMap.channel),thicknessMapUv:L&&m(_.thicknessMap.channel),alphaMapUv:Q&&m(_.alphaMap.channel),vertexTangents:!!X.attributes.tangent&&(Ce||U),vertexNormals:!!X.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!X.attributes.uv&&(Ft||Q),fog:!!I,useFog:_.fog===!0,fogExp2:!!I&&I.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||X.attributes.normal===void 0&&Ce===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:xt,skinning:F.isSkinnedMesh===!0,hasPositionAttribute:X.attributes.position!==void 0,morphTargets:X.morphAttributes.position!==void 0,morphNormals:X.morphAttributes.normal!==void 0,morphColors:X.morphAttributes.color!==void 0,morphTargetsCount:Dt,morphTextureStride:At,numSunLights:A.sun.length,numDirLights:A.directional.length,numPointLights:A.point.length,numSpotLights:A.spot.length,numSpotLightMaps:A.spotLightMap.length,numRectAreaLights:A.rectArea.length,numHemiLights:A.hemi.length,numSunLightShadows:A.sunShadowMap.length,numDirLightShadows:A.directionalShadowMap.length,numPointLightShadows:A.pointShadowMap.length,numSpotLightShadows:A.spotShadowMap.length,numSpotLightShadowsWithMaps:A.numSpotLightShadowsWithMaps,numLightProbes:A.numLightProbes,numLightProbeGrids:z.length,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:_.dithering,shadowMapEnabled:e.shadowMap.enabled&&R.length>0,shadowMapType:e.shadowMap.type,toneMapping:Nt,decodeVideoTexture:Ft&&_.map.isVideoTexture===!0&&ie.getTransfer(_.map.colorSpace)===me,decodeVideoTextureEmissive:En&&_.emissiveMap.isVideoTexture===!0&&ie.getTransfer(_.emissiveMap.colorSpace)===me,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===Es,flipSided:_.side===qn,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:it&&_.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(it&&_.extensions.multiDraw===!0||yt)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Mt.vertexUv1s=l.has(1),Mt.vertexUv2s=l.has(2),Mt.vertexUv3s=l.has(3),l.clear(),Mt}function g(_){let A=[];if(_.shaderID?A.push(_.shaderID):(A.push(_.customVertexShaderID),A.push(_.customFragmentShaderID)),_.defines!==void 0)for(let R in _.defines)A.push(R),A.push(_.defines[R]);return _.isRawShaderMaterial===!1&&(f(A,_),v(A,_),A.push(e.outputColorSpace)),A.push(_.customProgramCacheKey),A.join()}function f(_,A){_.push(A.precision),_.push(A.outputColorSpace),_.push(A.envMapMode),_.push(A.envMapCubeUVHeight),_.push(A.mapUv),_.push(A.alphaMapUv),_.push(A.lightMapUv),_.push(A.aoMapUv),_.push(A.bumpMapUv),_.push(A.normalMapUv),_.push(A.displacementMapUv),_.push(A.emissiveMapUv),_.push(A.metalnessMapUv),_.push(A.roughnessMapUv),_.push(A.anisotropyMapUv),_.push(A.clearcoatMapUv),_.push(A.clearcoatNormalMapUv),_.push(A.clearcoatRoughnessMapUv),_.push(A.iridescenceMapUv),_.push(A.iridescenceThicknessMapUv),_.push(A.sheenColorMapUv),_.push(A.sheenRoughnessMapUv),_.push(A.specularMapUv),_.push(A.specularColorMapUv),_.push(A.specularIntensityMapUv),_.push(A.transmissionMapUv),_.push(A.thicknessMapUv),_.push(A.combine),_.push(A.fogExp2),_.push(A.sizeAttenuation),_.push(A.morphTargetsCount),_.push(A.morphAttributeCount),_.push(A.numSunLights),_.push(A.numDirLights),_.push(A.numPointLights),_.push(A.numSpotLights),_.push(A.numSpotLightMaps),_.push(A.numHemiLights),_.push(A.numRectAreaLights),_.push(A.numSunLightShadows),_.push(A.numDirLightShadows),_.push(A.numPointLightShadows),_.push(A.numSpotLightShadows),_.push(A.numSpotLightShadowsWithMaps),_.push(A.numLightProbes),_.push(A.shadowMapType),_.push(A.toneMapping),_.push(A.numClippingPlanes),_.push(A.numClipIntersection),_.push(A.depthPacking)}function v(_,A){r.disableAll(),A.instancing&&r.enable(0),A.instancingColor&&r.enable(1),A.instancingMorph&&r.enable(2),A.matcap&&r.enable(3),A.envMap&&r.enable(4),A.normalMapObjectSpace&&r.enable(5),A.normalMapTangentSpace&&r.enable(6),A.clearcoat&&r.enable(7),A.iridescence&&r.enable(8),A.alphaTest&&r.enable(9),A.vertexColors&&r.enable(10),A.vertexAlphas&&r.enable(11),A.vertexUv1s&&r.enable(12),A.vertexUv2s&&r.enable(13),A.vertexUv3s&&r.enable(14),A.vertexTangents&&r.enable(15),A.anisotropy&&r.enable(16),A.alphaHash&&r.enable(17),A.batching&&r.enable(18),A.dispersion&&r.enable(19),A.retroreflection&&r.enable(24),A.batchingColor&&r.enable(20),A.gradientMap&&r.enable(21),A.packedNormalMap&&r.enable(22),A.vertexNormals&&r.enable(23),_.push(r.mask),r.disableAll(),A.fog&&r.enable(0),A.useFog&&r.enable(1),A.flatShading&&r.enable(2),A.logarithmicDepthBuffer&&r.enable(3),A.reversedDepthBuffer&&r.enable(4),A.skinning&&r.enable(5),A.morphTargets&&r.enable(6),A.morphNormals&&r.enable(7),A.morphColors&&r.enable(8),A.premultipliedAlpha&&r.enable(9),A.shadowMapEnabled&&r.enable(10),A.doubleSided&&r.enable(11),A.flipSided&&r.enable(12),A.useDepthPacking&&r.enable(13),A.dithering&&r.enable(14),A.transmission&&r.enable(15),A.sheen&&r.enable(16),A.opaque&&r.enable(17),A.pointsUvs&&r.enable(18),A.decodeVideoTexture&&r.enable(19),A.decodeVideoTextureEmissive&&r.enable(20),A.alphaToCoverage&&r.enable(21),A.numLightProbeGrids>0&&r.enable(22),A.hasPositionAttribute&&r.enable(23),_.push(r.mask)}function b(_){let A=p[_.type],R;if(A){let O=Cs[A];R=uE.clone(O.uniforms)}else R=_.uniforms;return R}function y(_,A){let R=h.get(A);return R!==void 0?++R.usedTimes:(R=new xL(e,A,_,s),c.push(R),h.set(A,R)),R}function T(_){if(--_.usedTimes===0){let A=c.indexOf(_);c[A]=c[c.length-1],c.pop(),h.delete(_.cacheKey),_.destroy()}}function E(_){o.remove(_)}function w(){o.dispose()}return{getParameters:S,getProgramCacheKey:g,getUniforms:b,acquireProgram:y,releaseProgram:T,releaseShaderCache:E,programs:c,dispose:w}}function EL(){let e=new WeakMap;function t(r){return e.has(r)}function n(r){let o=e.get(r);return o===void 0&&(o={},e.set(r,o)),o}function i(r){e.delete(r)}function s(r,o,l){e.get(r)[o]=l}function a(){e=new WeakMap}return{has:t,get:n,remove:i,update:s,dispose:a}}function TL(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.material.id!==t.material.id?e.material.id-t.material.id:e.materialVariant!==t.materialVariant?e.materialVariant-t.materialVariant:e.z!==t.z?e.z-t.z:e.id-t.id}function NE(e,t){return e.groupOrder!==t.groupOrder?e.groupOrder-t.groupOrder:e.renderOrder!==t.renderOrder?e.renderOrder-t.renderOrder:e.z!==t.z?t.z-e.z:e.id-t.id}function DE(){let e=[],t=0,n=[],i=[],s=[];function a(){t=0,n.length=0,i.length=0,s.length=0}function r(u){let p=0;return u.isInstancedMesh&&(p+=2),u.isSkinnedMesh&&(p+=1),p}function o(u,p,m,S,g,f){let v=e[t];return v===void 0?(v={id:u.id,object:u,geometry:p,material:m,materialVariant:r(u),groupOrder:S,renderOrder:u.renderOrder,z:g,group:f},e[t]=v):(v.id=u.id,v.object=u,v.geometry=p,v.material=m,v.materialVariant=r(u),v.groupOrder=S,v.renderOrder=u.renderOrder,v.z=g,v.group=f),t++,v}function l(u,p,m,S,g,f,v){v.reversedDepth===!0&&(g=-g);let b=o(u,p,m,S,g,f);m.transmission>0?i.push(b):m.transparent===!0?s.push(b):n.push(b)}function c(u,p,m,S,g,f){let v=o(u,p,m,S,g,f);m.transmission>0?i.unshift(v):m.transparent===!0?s.unshift(v):n.unshift(v)}function h(u,p){n.length>1&&n.sort(u||TL),i.length>1&&i.sort(p||NE),s.length>1&&s.sort(p||NE)}function d(){for(let u=t,p=e.length;u<p;u++){let m=e[u];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:n,transmissive:i,transparent:s,init:a,push:l,unshift:c,finish:d,sort:h}}function wL(){let e=new WeakMap;function t(i,s){let a=e.get(i),r;return a===void 0?(r=new DE,e.set(i,[r])):s>=a.length?(r=new DE,a.push(r)):r=a[s],r}function n(){e=new WeakMap}return{get:t,dispose:n}}function AL(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={direction:new P,color:new Wt};break;case"SpotLight":n={position:new P,direction:new P,color:new Wt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":n={position:new P,color:new Wt,distance:0,decay:0};break;case"HemisphereLight":n={direction:new P,skyColor:new Wt,groundColor:new Wt};break;case"RectAreaLight":n={color:new Wt,position:new P,halfWidth:new P,halfHeight:new P};break}return e[t.id]=n,n}}}function CL(){let e={};return{get:function(t){if(e[t.id]!==void 0)return e[t.id];let n;switch(t.type){case"SunLight":case"DirectionalLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"SpotLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut};break;case"PointLight":n={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ut,shadowCameraNear:1,shadowCameraFar:1e3};break}return e[t.id]=n,n}}}var RL=0;function NL(e,t){return(t.castShadow?2:0)-(e.castShadow?2:0)+(t.map?1:0)-(e.map?1:0)}function DL(e){let t=new AL,n=CL(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new P);let s=new P,a=new Fe,r=new Fe;function o(c){let h=0,d=0,u=0;for(let F=0;F<9;F++)i.probe[F].set(0,0,0);let p=0,m=0,S=0,g=0,f=0,v=0,b=0,y=0,T=0,E=0,w=0,_=0,A=0,R=0;c.sort(NL);for(let F=0,z=c.length;F<z;F++){let I=c[F],X=I.color,Y=I.intensity,j=I.distance,at=null;if(I.shadow&&I.shadow.map&&(I.shadow.map.texture.format===er?at=I.shadow.map.texture:at=I.shadow.map.depthTexture||I.shadow.map.texture),I.isAmbientLight)h+=X.r*Y,d+=X.g*Y,u+=X.b*Y;else if(I.isLightProbe){for(let Z=0;Z<9;Z++)i.probe[Z].addScaledVector(I.sh.coefficients[Z],Y);R++}else if(I.isSunLight){let Z=t.get(I);if(Z.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let nt=I.shadow,st=n.get(I);st.shadowIntensity=nt.intensity,st.shadowBias=nt.bias,st.shadowNormalBias=nt.normalBias,st.shadowRadius=nt.radius,st.shadowMapSize.copy(nt.mapSize).multiply(nt.getFrameExtents()),i.sunShadow[m]=st,i.sunShadowMap[m]=at;let Dt=nt.getViewportCount();for(let At=0;At<Dt;At++)i.sunShadowMatrix[S+At]=nt.getMatrix(At),i.sunShadowCascade[S+At]=nt._cascadeData[At];S+=Dt,m++}i.sun[p]=Z,p++}else if(I.isDirectionalLight){let Z=t.get(I);if(Z.color.copy(I.color).multiplyScalar(I.intensity),I.castShadow){let nt=I.shadow,st=n.get(I);st.shadowIntensity=nt.intensity,st.shadowBias=nt.bias,st.shadowNormalBias=nt.normalBias,st.shadowRadius=nt.radius,st.shadowMapSize=nt.mapSize,i.directionalShadow[g]=st,i.directionalShadowMap[g]=at,i.directionalShadowMatrix[g]=I.shadow.matrix,T++}i.directional[g]=Z,g++}else if(I.isSpotLight){let Z=t.get(I);Z.position.setFromMatrixPosition(I.matrixWorld),Z.color.copy(X).multiplyScalar(Y),Z.distance=j,Z.coneCos=Math.cos(I.angle),Z.penumbraCos=Math.cos(I.angle*(1-I.penumbra)),Z.decay=I.decay,i.spot[v]=Z;let nt=I.shadow;if(I.map&&(i.spotLightMap[_]=I.map,_++,nt.updateMatrices(I),I.castShadow&&A++),i.spotLightMatrix[v]=nt.matrix,I.castShadow){let st=n.get(I);st.shadowIntensity=nt.intensity,st.shadowBias=nt.bias,st.shadowNormalBias=nt.normalBias,st.shadowRadius=nt.radius,st.shadowMapSize=nt.mapSize,i.spotShadow[v]=st,i.spotShadowMap[v]=at,w++}v++}else if(I.isRectAreaLight){let Z=t.get(I);Z.color.copy(X).multiplyScalar(Y),Z.halfWidth.set(I.width*.5,0,0),Z.halfHeight.set(0,I.height*.5,0),i.rectArea[b]=Z,b++}else if(I.isPointLight){let Z=t.get(I);if(Z.color.copy(I.color).multiplyScalar(I.intensity),Z.distance=I.distance,Z.decay=I.decay,I.castShadow){let nt=I.shadow,st=n.get(I);st.shadowIntensity=nt.intensity,st.shadowBias=nt.bias,st.shadowNormalBias=nt.normalBias,st.shadowRadius=nt.radius,st.shadowMapSize=nt.mapSize,st.shadowCameraNear=nt.camera.near,st.shadowCameraFar=nt.camera.far,i.pointShadow[f]=st,i.pointShadowMap[f]=at,i.pointShadowMatrix[f]=I.shadow.matrix,E++}i.point[f]=Z,f++}else if(I.isHemisphereLight){let Z=t.get(I);Z.skyColor.copy(I.color).multiplyScalar(Y),Z.groundColor.copy(I.groundColor).multiplyScalar(Y),i.hemi[y]=Z,y++}}b>0&&(e.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=pt.LTC_FLOAT_1,i.rectAreaLTC2=pt.LTC_FLOAT_2):(i.rectAreaLTC1=pt.LTC_HALF_1,i.rectAreaLTC2=pt.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=d,i.ambient[2]=u;let O=i.hash;(O.sunLength!==p||O.directionalLength!==g||O.pointLength!==f||O.spotLength!==v||O.rectAreaLength!==b||O.hemiLength!==y||O.numSunShadows!==m||O.numDirectionalShadows!==T||O.numPointShadows!==E||O.numSpotShadows!==w||O.numSpotMaps!==_||O.numLightProbes!==R)&&(i.sun.length=p,i.directional.length=g,i.spot.length=v,i.rectArea.length=b,i.point.length=f,i.hemi.length=y,i.sunShadow.length=m,i.sunShadowMap.length=m,i.sunShadowMatrix.length=S,i.sunShadowCascade.length=S,i.directionalShadow.length=T,i.directionalShadowMap.length=T,i.directionalShadowMatrix.length=T,i.pointShadow.length=E,i.pointShadowMap.length=E,i.pointShadowMatrix.length=E,i.spotShadow.length=w,i.spotShadowMap.length=w,i.spotLightMatrix.length=w+_-A,i.spotLightMap.length=_,i.numSpotLightShadowsWithMaps=A,i.numLightProbes=R,O.sunLength=p,O.directionalLength=g,O.pointLength=f,O.spotLength=v,O.rectAreaLength=b,O.hemiLength=y,O.numSunShadows=m,O.numDirectionalShadows=T,O.numPointShadows=E,O.numSpotShadows=w,O.numSpotMaps=_,O.numLightProbes=R,i.version=RL++)}function l(c,h){let d=0,u=0,p=0,m=0,S=0,g=0,f=h.matrixWorldInverse;for(let v=0,b=c.length;v<b;v++){let y=c[v];if(y.isSunLight){let T=i.sun[d];T.direction.setFromMatrixPosition(y.matrixWorld),T.direction.transformDirection(f),d++}else if(y.isDirectionalLight){let T=i.directional[u];T.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(f),u++}else if(y.isSpotLight){let T=i.spot[m];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(f),T.direction.setFromMatrixPosition(y.matrixWorld),s.setFromMatrixPosition(y.target.matrixWorld),T.direction.sub(s),T.direction.transformDirection(f),m++}else if(y.isRectAreaLight){let T=i.rectArea[S];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(f),r.identity(),a.copy(y.matrixWorld),a.premultiply(f),r.extractRotation(a),T.halfWidth.set(y.width*.5,0,0),T.halfHeight.set(0,y.height*.5,0),T.halfWidth.applyMatrix4(r),T.halfHeight.applyMatrix4(r),S++}else if(y.isPointLight){let T=i.point[p];T.position.setFromMatrixPosition(y.matrixWorld),T.position.applyMatrix4(f),p++}else if(y.isHemisphereLight){let T=i.hemi[g];T.direction.setFromMatrixPosition(y.matrixWorld),T.direction.transformDirection(f),g++}}}return{setup:o,setupView:l,state:i}}function LE(e){let t=new DL(e),n=[],i=[],s=[];function a(u){d.camera=u,n.length=0,i.length=0,s.length=0}function r(u){n.push(u)}function o(u){i.push(u)}function l(u){s.push(u)}function c(){t.setup(n)}function h(u){t.setupView(n,u)}let d={lightsArray:n,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:a,state:d,setupLights:c,setupLightsView:h,pushLight:r,pushShadow:o,pushLightProbeGrid:l}}function LL(e){let t=new WeakMap;function n(s,a=0){let r=t.get(s),o;return r===void 0?(o=new LE(e),t.set(s,[o])):a>=r.length?(o=new LE(e),r.push(o)):o=r[a],o}function i(){t=new WeakMap}return{get:n,dispose:i}}var UL=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,IL=`uniform sampler2D shadow_pass;
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
}`,OL=[new P(1,0,0),new P(-1,0,0),new P(0,1,0),new P(0,-1,0),new P(0,0,1),new P(0,0,-1)],PL=[new P(0,-1,0),new P(0,-1,0),new P(0,0,1),new P(0,0,-1),new P(0,-1,0),new P(0,-1,0)],UE=new Fe,Mu=new P,$v=new P;function BL(e,t,n){let i=new tu,s=new Ut,a=new Ut,r=new Xe,o=new gf,l=new vf,c={},h=n.maxTextureSize,d={[Ja]:qn,[qn]:Ja,[Es]:Es},u=new yi({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ut},radius:{value:4}},vertexShader:UL,fragmentShader:IL}),p=u.clone();p.defines.HORIZONTAL_PASS=1;let m=new pn;m.setAttribute("position",new Vn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let S=new Wn(m,u),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=du;let f=this.type;this.render=function(E,w,_){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||E.length===0)return;this.type===A1&&(Ot("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=du);let A=e.getRenderTarget(),R=e.getActiveCubeFace(),O=e.getActiveMipmapLevel(),F=e.state;F.setBlending(Ts),F.buffers.depth.getReversed()===!0?F.buffers.color.setClear(0,0,0,0):F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);let z=f!==this.type;z&&w.traverse(function(I){I.material&&(Array.isArray(I.material)?I.material.forEach(X=>X.needsUpdate=!0):I.material.needsUpdate=!0)});for(let I=0,X=E.length;I<X;I++){let Y=E[I],j=Y.shadow;if(j===void 0){Ot("WebGLShadowMap:",Y,"has no shadow.");continue}if(j.autoUpdate===!1&&j.needsUpdate===!1)continue;s.copy(j.mapSize);let at=j.getFrameExtents();s.multiply(at),a.copy(j.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(a.x=Math.floor(h/at.x),s.x=a.x*at.x,j.mapSize.x=a.x),s.y>h&&(a.y=Math.floor(h/at.y),s.y=a.y*at.y,j.mapSize.y=a.y));let Z=e.state.buffers.depth.getReversed();if(j.camera._reversedDepth=Z,j.map===null||z===!0){if(j.map!==null&&(j.map.depthTexture!==null&&(j.map.depthTexture.dispose(),j.map.depthTexture=null),j.map.dispose()),this.type===yl){if(Y.isPointLight){Ot("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}j.map=new ti(s.x,s.y,{format:er,type:$i,minFilter:Mn,magFilter:Mn,generateMipmaps:!1}),j.map.texture.name=Y.name+".shadowMap",j.map.depthTexture=new Wa(s.x,s.y,Qi),j.map.depthTexture.name=Y.name+".shadowMapDepth",j.map.depthTexture.format=xs,j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=fn,j.map.depthTexture.magFilter=fn}else Y.isPointLight?(j.map=new xp(s.x),j.map.depthTexture=new pf(s.x,Ji)):(j.map=new ti(s.x,s.y),j.map.depthTexture=new Wa(s.x,s.y,Ji)),j.map.depthTexture.name=Y.name+".shadowMap",j.map.depthTexture.format=xs,this.type===du?(j.map.depthTexture.compareFunction=Z?gp:mp,j.map.depthTexture.minFilter=Mn,j.map.depthTexture.magFilter=Mn):(j.map.depthTexture.compareFunction=null,j.map.depthTexture.minFilter=fn,j.map.depthTexture.magFilter=fn);j.camera.updateProjectionMatrix()}j.map.isWebGLCubeRenderTarget!==!0&&(j.map.width!==s.x||j.map.height!==s.y)&&j.map.setSize(s.x,s.y);let nt=j.map.isWebGLCubeRenderTarget?6:j.getViewportCount();Y.isPointLight!==!0&&j.updateMatrices(Y,_);for(let st=0;st<nt;st++){let Dt=j.getCamera(st);if(Y.isPointLight){let At=j.camera,se=j.matrix,Kt=Y.distance||At.far;Kt!==At.far&&(At.far=Kt,At.updateProjectionMatrix()),Mu.setFromMatrixPosition(Y.matrixWorld),At.position.copy(Mu),$v.copy(At.position),$v.add(OL[st]),At.up.copy(PL[st]),At.lookAt($v),At.updateMatrixWorld(),se.makeTranslation(-Mu.x,-Mu.y,-Mu.z),UE.multiplyMatrices(At.projectionMatrix,At.matrixWorldInverse),j._frustum.setFromProjectionMatrix(UE,At.coordinateSystem,At.reversedDepth)}if(j.map.isWebGLCubeRenderTarget)e.setRenderTarget(j.map,st),e.clear();else{st===0&&(e.setRenderTarget(j.map),e.clear());let At=j.getViewport(st);r.set(a.x*At.x,a.y*At.y,a.x*At.z,a.y*At.w),F.viewport(r)}i=j.getFrustum(st),y(w,_,Dt,Y,this.type)}j.isPointLightShadow!==!0&&this.type===yl&&v(j,_),j.needsUpdate=!1}f=this.type,g.needsUpdate=!1,e.setRenderTarget(A,R,O)};function v(E,w){let _=t.update(S);u.defines.VSM_SAMPLES!==E.blurSamples&&(u.defines.VSM_SAMPLES=E.blurSamples,p.defines.VSM_SAMPLES=E.blurSamples,u.needsUpdate=!0,p.needsUpdate=!0),E.mapPass===null?E.mapPass=new ti(s.x,s.y,{format:er,type:$i}):(E.mapPass.width!==E.map.width||E.mapPass.height!==E.map.height)&&E.mapPass.setSize(E.map.width,E.map.height),u.uniforms.shadow_pass.value=E.map.depthTexture,u.uniforms.resolution.value.set(E.map.width,E.map.height),u.uniforms.radius.value=E.radius,e.setRenderTarget(E.mapPass),e.clear(),e.renderBufferDirect(w,null,_,u,S,null),p.uniforms.shadow_pass.value=E.mapPass.texture,p.uniforms.resolution.value.set(E.map.width,E.map.height),p.uniforms.radius.value=E.radius,e.setRenderTarget(E.map),e.clear(),e.renderBufferDirect(w,null,_,p,S,null)}function b(E,w,_,A){let R=null,O=_.isPointLight===!0?E.customDistanceMaterial:E.customDepthMaterial;if(O!==void 0)R=O;else if(R=_.isPointLight===!0?l:o,e.localClippingEnabled&&w.clipShadows===!0&&Array.isArray(w.clippingPlanes)&&w.clippingPlanes.length!==0||w.displacementMap&&w.displacementScale!==0||w.alphaMap&&w.alphaTest>0||w.map&&w.alphaTest>0||w.alphaToCoverage===!0){let F=R.uuid,z=w.uuid,I=c[F];I===void 0&&(I={},c[F]=I);let X=I[z];X===void 0&&(X=R.clone(),I[z]=X,w.addEventListener("dispose",T)),R=X}if(R.visible=w.visible,R.wireframe=w.wireframe,A===yl?R.side=w.shadowSide!==null?w.shadowSide:w.side:R.side=w.shadowSide!==null?w.shadowSide:d[w.side],R.alphaMap=w.alphaMap,R.alphaTest=w.alphaToCoverage===!0?.5:w.alphaTest,R.map=w.map,R.clipShadows=w.clipShadows,R.clippingPlanes=w.clippingPlanes,R.clipIntersection=w.clipIntersection,R.displacementMap=w.displacementMap,R.displacementScale=w.displacementScale,R.displacementBias=w.displacementBias,R.wireframeLinewidth=w.wireframeLinewidth,R.linewidth=w.linewidth,_.isPointLight===!0&&R.isMeshDistanceMaterial===!0){let F=e.properties.get(R);F.light=_}return R}function y(E,w,_,A,R){if(E.visible===!1)return;if(E.layers.test(w.layers)&&(E.isMesh||E.isLine||E.isPoints)&&(E.castShadow||E.receiveShadow&&R===yl)&&(!E.frustumCulled||E.intersectsFrustum(i))){E.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,E.matrixWorld);let z=t.update(E),I=E.material;if(Array.isArray(I)){let X=z.groups;for(let Y=0,j=X.length;Y<j;Y++){let at=X[Y],Z=I[at.materialIndex];if(Z&&Z.visible){let nt=b(E,Z,A,R);E.onBeforeShadow(e,E,w,_,z,nt,at),e.renderBufferDirect(_,null,z,nt,E,at),E.onAfterShadow(e,E,w,_,z,nt,at)}}}else if(I.visible){let X=b(E,I,A,R);E.onBeforeShadow(e,E,w,_,z,X,null),e.renderBufferDirect(_,null,z,X,E,null),E.onAfterShadow(e,E,w,_,z,X,null)}}let F=E.children;for(let z=0,I=F.length;z<I;z++)y(F[z],w,_,A,R)}function T(E){E.target.removeEventListener("dispose",T);for(let _ in c){let A=c[_],R=E.target.uuid;R in A&&(A[R].dispose(),delete A[R])}}}function zL(e,t){function n(){let L=!1,ht=new Xe,Q=null,ft=new Xe(0,0,0,0);return{setMask:function(vt){Q!==vt&&!L&&(e.colorMask(vt,vt,vt,vt),Q=vt)},setLocked:function(vt){L=vt},setClear:function(vt,it,Nt,Mt,de){de===!0&&(vt*=Mt,it*=Mt,Nt*=Mt),ht.set(vt,it,Nt,Mt),ft.equals(ht)===!1&&(e.clearColor(vt,it,Nt,Mt),ft.copy(ht))},reset:function(){L=!1,Q=null,ft.set(-1,0,0,0)}}}function i(){let L=!1,ht=!1,Q=null,ft=null,vt=null;return{setReversed:function(it){if(ht!==it){let Nt=t.get("EXT_clip_control");it?Nt.clipControlEXT(Nt.LOWER_LEFT_EXT,Nt.ZERO_TO_ONE_EXT):Nt.clipControlEXT(Nt.LOWER_LEFT_EXT,Nt.NEGATIVE_ONE_TO_ONE_EXT),ht=it;let Mt=vt;vt=null,this.setClear(Mt)}},getReversed:function(){return ht},setTest:function(it){it?et(e.DEPTH_TEST):xt(e.DEPTH_TEST)},setMask:function(it){Q!==it&&!L&&(e.depthMask(it),Q=it)},setFunc:function(it){if(ht&&(it=oE[it]),ft!==it){switch(it){case Kd:e.depthFunc(e.NEVER);break;case Jd:e.depthFunc(e.ALWAYS);break;case Qd:e.depthFunc(e.LESS);break;case ol:e.depthFunc(e.LEQUAL);break;case $d:e.depthFunc(e.EQUAL);break;case tf:e.depthFunc(e.GEQUAL);break;case ef:e.depthFunc(e.GREATER);break;case nf:e.depthFunc(e.NOTEQUAL);break;default:e.depthFunc(e.LEQUAL)}ft=it}},setLocked:function(it){L=it},setClear:function(it){vt!==it&&(vt=it,ht&&(it=1-it),e.clearDepth(it))},reset:function(){L=!1,Q=null,ft=null,vt=null,ht=!1}}}function s(){let L=!1,ht=null,Q=null,ft=null,vt=null,it=null,Nt=null,Mt=null,de=null;return{setTest:function(le){L||(le?et(e.STENCIL_TEST):xt(e.STENCIL_TEST))},setMask:function(le){ht!==le&&!L&&(e.stencilMask(le),ht=le)},setFunc:function(le,ni,bi){(Q!==le||ft!==ni||vt!==bi)&&(e.stencilFunc(le,ni,bi),Q=le,ft=ni,vt=bi)},setOp:function(le,ni,bi){(it!==le||Nt!==ni||Mt!==bi)&&(e.stencilOp(le,ni,bi),it=le,Nt=ni,Mt=bi)},setLocked:function(le){L=le},setClear:function(le){de!==le&&(e.clearStencil(le),de=le)},reset:function(){L=!1,ht=null,Q=null,ft=null,vt=null,it=null,Nt=null,Mt=null,de=null}}}let a=new n,r=new i,o=new s,l=new WeakMap,c=new WeakMap,h={},d={},u={},p=new WeakMap,m=[],S=null,g=!1,f=null,v=null,b=null,y=null,T=null,E=null,w=null,_=new Wt(0,0,0),A=0,R=!1,O=null,F=null,z=null,I=null,X=null,Y=e.getParameter(e.MAX_COMBINED_TEXTURE_IMAGE_UNITS),j=!1,at=0,Z=e.getParameter(e.VERSION);Z.indexOf("WebGL")!==-1?(at=parseFloat(/^WebGL (\d)/.exec(Z)[1]),j=at>=1):Z.indexOf("OpenGL ES")!==-1&&(at=parseFloat(/^OpenGL ES (\d)/.exec(Z)[1]),j=at>=2);let nt=null,st={},Dt=e.getParameter(e.SCISSOR_BOX),At=e.getParameter(e.VIEWPORT),se=new Xe().fromArray(Dt),Kt=new Xe().fromArray(At);function re(L,ht,Q,ft){let vt=new Uint8Array(4),it=e.createTexture();e.bindTexture(L,it),e.texParameteri(L,e.TEXTURE_MIN_FILTER,e.NEAREST),e.texParameteri(L,e.TEXTURE_MAG_FILTER,e.NEAREST);for(let Nt=0;Nt<Q;Nt++)L===e.TEXTURE_3D||L===e.TEXTURE_2D_ARRAY?e.texImage3D(ht,0,e.RGBA,1,1,ft,0,e.RGBA,e.UNSIGNED_BYTE,vt):e.texImage2D(ht+Nt,0,e.RGBA,1,1,0,e.RGBA,e.UNSIGNED_BYTE,vt);return it}let K={};K[e.TEXTURE_2D]=re(e.TEXTURE_2D,e.TEXTURE_2D,1),K[e.TEXTURE_CUBE_MAP]=re(e.TEXTURE_CUBE_MAP,e.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[e.TEXTURE_2D_ARRAY]=re(e.TEXTURE_2D_ARRAY,e.TEXTURE_2D_ARRAY,1,1),K[e.TEXTURE_3D]=re(e.TEXTURE_3D,e.TEXTURE_3D,1,1),a.setClear(0,0,0,1),r.setClear(1),o.setClear(0),et(e.DEPTH_TEST),r.setFunc(ol),kt(!1),Ce(yv),et(e.CULL_FACE),ae(Ts);function et(L){h[L]!==!0&&(e.enable(L),h[L]=!0)}function xt(L){h[L]!==!1&&(e.disable(L),h[L]=!1)}function Bt(L,ht){return u[L]!==ht?(e.bindFramebuffer(L,ht),u[L]=ht,L===e.DRAW_FRAMEBUFFER&&(u[e.FRAMEBUFFER]=ht),L===e.FRAMEBUFFER&&(u[e.DRAW_FRAMEBUFFER]=ht),!0):!1}function yt(L,ht){let Q=m,ft=!1;if(L){Q=p.get(ht),Q===void 0&&(Q=[],p.set(ht,Q));let vt=L.textures;if(Q.length!==vt.length||Q[0]!==e.COLOR_ATTACHMENT0){for(let it=0,Nt=vt.length;it<Nt;it++)Q[it]=e.COLOR_ATTACHMENT0+it;Q.length=vt.length,ft=!0}}else Q[0]!==e.BACK&&(Q[0]=e.BACK,ft=!0);ft&&e.drawBuffers(Q)}function Ft(L){return S!==L?(e.useProgram(L),S=L,!0):!1}let Ve={[Or]:e.FUNC_ADD,[R1]:e.FUNC_SUBTRACT,[N1]:e.FUNC_REVERSE_SUBTRACT};Ve[D1]=e.MIN,Ve[L1]=e.MAX;let It={[U1]:e.ZERO,[I1]:e.ONE,[O1]:e.SRC_COLOR,[bv]:e.SRC_ALPHA,[H1]:e.SRC_ALPHA_SATURATE,[F1]:e.DST_COLOR,[B1]:e.DST_ALPHA,[P1]:e.ONE_MINUS_SRC_COLOR,[Mv]:e.ONE_MINUS_SRC_ALPHA,[G1]:e.ONE_MINUS_DST_COLOR,[z1]:e.ONE_MINUS_DST_ALPHA,[V1]:e.CONSTANT_COLOR,[k1]:e.ONE_MINUS_CONSTANT_COLOR,[X1]:e.CONSTANT_ALPHA,[W1]:e.ONE_MINUS_CONSTANT_ALPHA};function ae(L,ht,Q,ft,vt,it,Nt,Mt,de,le){if(L===Ts){g===!0&&(xt(e.BLEND),g=!1);return}if(g===!1&&(et(e.BLEND),g=!0),L!==C1){if(L!==f||le!==R){if((v!==Or||T!==Or)&&(e.blendEquation(e.FUNC_ADD),v=Or,T=Or),le)switch(L){case xl:e.blendFuncSeparate(e.ONE,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case fu:e.blendFunc(e.ONE,e.ONE);break;case xv:e.blendFuncSeparate(e.ZERO,e.ONE_MINUS_SRC_COLOR,e.ZERO,e.ONE);break;case Sv:e.blendFuncSeparate(e.DST_COLOR,e.ONE_MINUS_SRC_ALPHA,e.ZERO,e.ONE);break;default:Pt("WebGLState: Invalid blending: ",L);break}else switch(L){case xl:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA,e.ONE,e.ONE_MINUS_SRC_ALPHA);break;case fu:e.blendFuncSeparate(e.SRC_ALPHA,e.ONE,e.ONE,e.ONE);break;case xv:Pt("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Sv:Pt("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Pt("WebGLState: Invalid blending: ",L);break}b=null,y=null,E=null,w=null,_.set(0,0,0),A=0,f=L,R=le}return}vt=vt||ht,it=it||Q,Nt=Nt||ft,(ht!==v||vt!==T)&&(e.blendEquationSeparate(Ve[ht],Ve[vt]),v=ht,T=vt),(Q!==b||ft!==y||it!==E||Nt!==w)&&(e.blendFuncSeparate(It[Q],It[ft],It[it],It[Nt]),b=Q,y=ft,E=it,w=Nt),(Mt.equals(_)===!1||de!==A)&&(e.blendColor(Mt.r,Mt.g,Mt.b,de),_.copy(Mt),A=de),f=L,R=!1}function ge(L,ht){L.side===Es?xt(e.CULL_FACE):et(e.CULL_FACE);let Q=L.side===qn;ht&&(Q=!Q),kt(Q),L.blending===xl&&L.transparent===!1?ae(Ts):ae(L.blending,L.blendEquation,L.blendSrc,L.blendDst,L.blendEquationAlpha,L.blendSrcAlpha,L.blendDstAlpha,L.blendColor,L.blendAlpha,L.premultipliedAlpha),r.setFunc(L.depthFunc),r.setTest(L.depthTest),r.setMask(L.depthWrite),a.setMask(L.colorWrite);let ft=L.stencilWrite;o.setTest(ft),ft&&(o.setMask(L.stencilWriteMask),o.setFunc(L.stencilFunc,L.stencilRef,L.stencilFuncMask),o.setOp(L.stencilFail,L.stencilZFail,L.stencilZPass)),En(L.polygonOffset,L.polygonOffsetFactor,L.polygonOffsetUnits),L.alphaToCoverage===!0?et(e.SAMPLE_ALPHA_TO_COVERAGE):xt(e.SAMPLE_ALPHA_TO_COVERAGE)}function kt(L){O!==L&&(L?e.frontFace(e.CW):e.frontFace(e.CCW),O=L)}function Ce(L){L!==T1?(et(e.CULL_FACE),L!==F&&(L===yv?e.cullFace(e.BACK):L===w1?e.cullFace(e.FRONT):e.cullFace(e.FRONT_AND_BACK))):xt(e.CULL_FACE),F=L}function Ie(L){L!==z&&(j&&e.lineWidth(L),z=L)}function En(L,ht,Q){L?(et(e.POLYGON_OFFSET_FILL),(I!==ht||X!==Q)&&(I=ht,X=Q,r.getReversed()&&(ht=-ht),e.polygonOffset(ht,Q))):xt(e.POLYGON_OFFSET_FILL)}function Oe(L){L?et(e.SCISSOR_TEST):xt(e.SCISSOR_TEST)}function Pe(L){L===void 0&&(L=e.TEXTURE0+Y-1),nt!==L&&(e.activeTexture(L),nt=L)}function U(L,ht,Q){Q===void 0&&(nt===null?Q=e.TEXTURE0+Y-1:Q=nt);let ft=st[Q];ft===void 0&&(ft={type:void 0,texture:void 0},st[Q]=ft),(ft.type!==L||ft.texture!==ht)&&(nt!==Q&&(e.activeTexture(Q),nt=Q),e.bindTexture(L,ht||K[L]),ft.type=L,ft.texture=ht)}function je(){let L=st[nt];L!==void 0&&L.type!==void 0&&(e.bindTexture(L.type,null),L.type=void 0,L.texture=void 0)}function Jt(){try{e.compressedTexImage2D(...arguments)}catch(L){Pt("WebGLState:",L)}}function C(){try{e.compressedTexImage3D(...arguments)}catch(L){Pt("WebGLState:",L)}}function x(){try{e.texSubImage2D(...arguments)}catch(L){Pt("WebGLState:",L)}}function B(){try{e.texSubImage3D(...arguments)}catch(L){Pt("WebGLState:",L)}}function k(){try{e.compressedTexSubImage2D(...arguments)}catch(L){Pt("WebGLState:",L)}}function q(){try{e.compressedTexSubImage3D(...arguments)}catch(L){Pt("WebGLState:",L)}}function rt(){try{e.texStorage2D(...arguments)}catch(L){Pt("WebGLState:",L)}}function ot(){try{e.texStorage3D(...arguments)}catch(L){Pt("WebGLState:",L)}}function J(){try{e.texImage2D(...arguments)}catch(L){Pt("WebGLState:",L)}}function $(){try{e.texImage3D(...arguments)}catch(L){Pt("WebGLState:",L)}}function ct(L){return d[L]!==void 0?d[L]:e.getParameter(L)}function wt(L,ht){d[L]!==ht&&(e.pixelStorei(L,ht),d[L]=ht)}function ut(L){se.equals(L)===!1&&(e.scissor(L.x,L.y,L.z,L.w),se.copy(L))}function lt(L){Kt.equals(L)===!1&&(e.viewport(L.x,L.y,L.z,L.w),Kt.copy(L))}function Ct(L,ht){let Q=c.get(ht);Q===void 0&&(Q=new WeakMap,c.set(ht,Q));let ft=Q.get(L);ft===void 0&&(ft=e.getUniformBlockIndex(ht,L.name),Q.set(L,ft))}function Lt(L,ht){let ft=c.get(ht).get(L);l.get(ht)!==ft&&(e.uniformBlockBinding(ht,ft,L.__bindingPointIndex),l.set(ht,ft))}function Gt(){e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.disable(e.POLYGON_OFFSET_FILL),e.disable(e.SCISSOR_TEST),e.disable(e.STENCIL_TEST),e.disable(e.SAMPLE_ALPHA_TO_COVERAGE),e.blendEquation(e.FUNC_ADD),e.blendFunc(e.ONE,e.ZERO),e.blendFuncSeparate(e.ONE,e.ZERO,e.ONE,e.ZERO),e.blendColor(0,0,0,0),e.colorMask(!0,!0,!0,!0),e.clearColor(0,0,0,0),e.depthMask(!0),e.depthFunc(e.LESS),r.setReversed(!1),e.clearDepth(1),e.stencilMask(4294967295),e.stencilFunc(e.ALWAYS,0,4294967295),e.stencilOp(e.KEEP,e.KEEP,e.KEEP),e.clearStencil(0),e.cullFace(e.BACK),e.frontFace(e.CCW),e.polygonOffset(0,0),e.activeTexture(e.TEXTURE0),e.bindFramebuffer(e.FRAMEBUFFER,null),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),e.bindFramebuffer(e.READ_FRAMEBUFFER,null),e.useProgram(null),e.lineWidth(1),e.scissor(0,0,e.canvas.width,e.canvas.height),e.viewport(0,0,e.canvas.width,e.canvas.height),e.pixelStorei(e.PACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_ALIGNMENT,4),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!1),e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),e.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,e.BROWSER_DEFAULT_WEBGL),e.pixelStorei(e.PACK_ROW_LENGTH,0),e.pixelStorei(e.PACK_SKIP_PIXELS,0),e.pixelStorei(e.PACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_ROW_LENGTH,0),e.pixelStorei(e.UNPACK_IMAGE_HEIGHT,0),e.pixelStorei(e.UNPACK_SKIP_PIXELS,0),e.pixelStorei(e.UNPACK_SKIP_ROWS,0),e.pixelStorei(e.UNPACK_SKIP_IMAGES,0),h={},d={},nt=null,st={},u={},p=new WeakMap,m=[],S=null,g=!1,f=null,v=null,b=null,y=null,T=null,E=null,w=null,_=new Wt(0,0,0),A=0,R=!1,O=null,F=null,z=null,I=null,X=null,se.set(0,0,e.canvas.width,e.canvas.height),Kt.set(0,0,e.canvas.width,e.canvas.height),a.reset(),r.reset(),o.reset()}return{buffers:{color:a,depth:r,stencil:o},enable:et,disable:xt,bindFramebuffer:Bt,drawBuffers:yt,useProgram:Ft,setBlending:ae,setMaterial:ge,setFlipSided:kt,setCullFace:Ce,setLineWidth:Ie,setPolygonOffset:En,setScissorTest:Oe,activeTexture:Pe,bindTexture:U,unbindTexture:je,compressedTexImage2D:Jt,compressedTexImage3D:C,texImage2D:J,texImage3D:$,pixelStorei:wt,getParameter:ct,updateUBOMapping:Ct,uniformBlockBinding:Lt,texStorage2D:rt,texStorage3D:ot,texSubImage2D:x,texSubImage3D:B,compressedTexSubImage2D:k,compressedTexSubImage3D:q,scissor:ut,viewport:lt,reset:Gt}}function FL(e,t,n,i,s,a,r){let o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new Ut,h=new WeakMap,d=new Set,u,p=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function S(C,x){return m?new OffscreenCanvas(C,x):qc("canvas")}function g(C,x,B){let k=1,q=Jt(C);if((q.width>B||q.height>B)&&(k=B/Math.max(q.width,q.height)),k<1)if(typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&C instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&C instanceof ImageBitmap||typeof VideoFrame<"u"&&C instanceof VideoFrame){let rt=Math.floor(k*q.width),ot=Math.floor(k*q.height);u===void 0&&(u=S(rt,ot));let J=x?S(rt,ot):u;return J.width=rt,J.height=ot,J.getContext("2d").drawImage(C,0,0,rt,ot),Ot("WebGLRenderer: Texture has been resized from ("+q.width+"x"+q.height+") to ("+rt+"x"+ot+")."),J}else return"data"in C&&Ot("WebGLRenderer: Image in DataTexture is too big ("+q.width+"x"+q.height+")."),C;return C}function f(C){return C.generateMipmaps}function v(C){e.generateMipmap(C)}function b(C){return C.isWebGLCubeRenderTarget?e.TEXTURE_CUBE_MAP:C.isWebGL3DRenderTarget?e.TEXTURE_3D:C.isWebGLArrayRenderTarget||C.isCompressedArrayTexture?e.TEXTURE_2D_ARRAY:e.TEXTURE_2D}function y(C,x,B,k,q,rt=!1){if(C!==null){if(e[C]!==void 0)return e[C];Ot("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+C+"'")}let ot;k&&(ot=t.get("EXT_texture_norm16"),ot||Ot("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let J=x;if(x===e.RED&&(B===e.FLOAT&&(J=e.R32F),B===e.HALF_FLOAT&&(J=e.R16F),B===e.UNSIGNED_BYTE&&(J=e.R8),B===e.UNSIGNED_SHORT&&ot&&(J=ot.R16_EXT),B===e.SHORT&&ot&&(J=ot.R16_SNORM_EXT)),x===e.RED_INTEGER&&(B===e.UNSIGNED_BYTE&&(J=e.R8UI),B===e.UNSIGNED_SHORT&&(J=e.R16UI),B===e.UNSIGNED_INT&&(J=e.R32UI),B===e.BYTE&&(J=e.R8I),B===e.SHORT&&(J=e.R16I),B===e.INT&&(J=e.R32I)),x===e.RG&&(B===e.FLOAT&&(J=e.RG32F),B===e.HALF_FLOAT&&(J=e.RG16F),B===e.UNSIGNED_BYTE&&(J=e.RG8),B===e.UNSIGNED_SHORT&&ot&&(J=ot.RG16_EXT),B===e.SHORT&&ot&&(J=ot.RG16_SNORM_EXT)),x===e.RG_INTEGER&&(B===e.UNSIGNED_BYTE&&(J=e.RG8UI),B===e.UNSIGNED_SHORT&&(J=e.RG16UI),B===e.UNSIGNED_INT&&(J=e.RG32UI),B===e.BYTE&&(J=e.RG8I),B===e.SHORT&&(J=e.RG16I),B===e.INT&&(J=e.RG32I)),x===e.RGB_INTEGER&&(B===e.UNSIGNED_BYTE&&(J=e.RGB8UI),B===e.UNSIGNED_SHORT&&(J=e.RGB16UI),B===e.UNSIGNED_INT&&(J=e.RGB32UI),B===e.BYTE&&(J=e.RGB8I),B===e.SHORT&&(J=e.RGB16I),B===e.INT&&(J=e.RGB32I)),x===e.RGBA_INTEGER&&(B===e.UNSIGNED_BYTE&&(J=e.RGBA8UI),B===e.UNSIGNED_SHORT&&(J=e.RGBA16UI),B===e.UNSIGNED_INT&&(J=e.RGBA32UI),B===e.BYTE&&(J=e.RGBA8I),B===e.SHORT&&(J=e.RGBA16I),B===e.INT&&(J=e.RGBA32I)),x===e.RGB&&(B===e.UNSIGNED_SHORT&&ot&&(J=ot.RGB16_EXT),B===e.SHORT&&ot&&(J=ot.RGB16_SNORM_EXT),B===e.UNSIGNED_INT_5_9_9_9_REV&&(J=e.RGB9_E5),B===e.UNSIGNED_INT_10F_11F_11F_REV&&(J=e.R11F_G11F_B10F)),x===e.RGBA){let $=rt?Xc:ie.getTransfer(q);B===e.FLOAT&&(J=e.RGBA32F),B===e.HALF_FLOAT&&(J=e.RGBA16F),B===e.UNSIGNED_BYTE&&(J=$===me?e.SRGB8_ALPHA8:e.RGBA8),B===e.UNSIGNED_SHORT&&ot&&(J=ot.RGBA16_EXT),B===e.SHORT&&ot&&(J=ot.RGBA16_SNORM_EXT),B===e.UNSIGNED_SHORT_4_4_4_4&&(J=e.RGBA4),B===e.UNSIGNED_SHORT_5_5_5_1&&(J=e.RGB5_A1)}return(J===e.R16F||J===e.R32F||J===e.RG16F||J===e.RG32F||J===e.RGBA16F||J===e.RGBA32F)&&t.get("EXT_color_buffer_float"),J}function T(C,x){let B;return C?x===null||x===Ji||x===bl?B=e.DEPTH24_STENCIL8:x===Qi?B=e.DEPTH32F_STENCIL8:x===Sl&&(B=e.DEPTH24_STENCIL8,Ot("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===Ji||x===bl?B=e.DEPTH_COMPONENT24:x===Qi?B=e.DEPTH_COMPONENT32F:x===Sl&&(B=e.DEPTH_COMPONENT16),B}function E(C,x){return f(C)===!0||C.isFramebufferTexture&&C.minFilter!==fn&&C.minFilter!==Mn?Math.log2(Math.max(x.width,x.height))+1:C.mipmaps!==void 0&&C.mipmaps.length>0?C.mipmaps.length:C.isCompressedTexture&&Array.isArray(C.image)?x.mipmaps.length:1}function w(C){let x=C.target;x.removeEventListener("dispose",w),A(x),x.isVideoTexture&&h.delete(x),x.isHTMLTexture&&d.delete(x)}function _(C){let x=C.target;x.removeEventListener("dispose",_),O(x)}function A(C){let x=i.get(C);if(x.__webglInit===void 0)return;let B=C.source,k=p.get(B);if(k){let q=k[x.__cacheKey];q.usedTimes--,q.usedTimes===0&&R(C),Object.keys(k).length===0&&p.delete(B)}i.remove(C)}function R(C){let x=i.get(C);e.deleteTexture(x.__webglTexture);let B=C.source,k=p.get(B);delete k[x.__cacheKey],r.memory.textures--}function O(C){let x=i.get(C);if(C.depthTexture&&(C.depthTexture.dispose(),i.remove(C.depthTexture)),C.isWebGLCubeRenderTarget)for(let k=0;k<6;k++){if(Array.isArray(x.__webglFramebuffer[k]))for(let q=0;q<x.__webglFramebuffer[k].length;q++)e.deleteFramebuffer(x.__webglFramebuffer[k][q]);else e.deleteFramebuffer(x.__webglFramebuffer[k]);x.__webglDepthbuffer&&e.deleteRenderbuffer(x.__webglDepthbuffer[k])}else{if(Array.isArray(x.__webglFramebuffer))for(let k=0;k<x.__webglFramebuffer.length;k++)e.deleteFramebuffer(x.__webglFramebuffer[k]);else e.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&e.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&e.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let k=0;k<x.__webglColorRenderbuffer.length;k++)x.__webglColorRenderbuffer[k]&&e.deleteRenderbuffer(x.__webglColorRenderbuffer[k]);x.__webglDepthRenderbuffer&&e.deleteRenderbuffer(x.__webglDepthRenderbuffer)}let B=C.textures;for(let k=0,q=B.length;k<q;k++){let rt=i.get(B[k]);rt.__webglTexture&&(e.deleteTexture(rt.__webglTexture),r.memory.textures--),i.remove(B[k])}i.remove(C)}let F=0;function z(){F=0}function I(){return F}function X(C){F=C}function Y(){let C=F;return C>=s.maxTextures&&Ot("WebGLTextures: Trying to use "+(C+1)+" texture units while this GPU supports only "+s.maxTextures),F+=1,C}function j(C){let x=[];return x.push(C.wrapS),x.push(C.wrapT),x.push(C.wrapR||0),x.push(C.magFilter),x.push(C.minFilter),x.push(C.anisotropy),x.push(C.internalFormat),x.push(C.format),x.push(C.type),x.push(C.generateMipmaps),x.push(C.premultiplyAlpha),x.push(C.flipY),x.push(C.unpackAlignment),x.push(C.colorSpace),x.join()}function at(C,x){let B=i.get(C);if(C.isVideoTexture&&U(C),C.isRenderTargetTexture===!1&&C.isExternalTexture!==!0&&C.version>0&&B.__version!==C.version){let k=C.image;if(k===null)Ot("WebGLRenderer: Texture marked for update but no image data found.");else if(k.complete===!1)Ot("WebGLRenderer: Texture marked for update but image is incomplete");else{xt(B,C,x);return}}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);n.bindTexture(e.TEXTURE_2D,B.__webglTexture,e.TEXTURE0+x)}function Z(C,x){let B=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){xt(B,C,x);return}else C.isExternalTexture&&(B.__webglTexture=C.sourceTexture?C.sourceTexture:null);n.bindTexture(e.TEXTURE_2D_ARRAY,B.__webglTexture,e.TEXTURE0+x)}function nt(C,x){let B=i.get(C);if(C.isRenderTargetTexture===!1&&C.version>0&&B.__version!==C.version){xt(B,C,x);return}n.bindTexture(e.TEXTURE_3D,B.__webglTexture,e.TEXTURE0+x)}function st(C,x){let B=i.get(C);if(C.isCubeDepthTexture!==!0&&C.version>0&&B.__version!==C.version){Bt(B,C,x);return}n.bindTexture(e.TEXTURE_CUBE_MAP,B.__webglTexture,e.TEXTURE0+x)}let Dt={[sf]:e.REPEAT,[ys]:e.CLAMP_TO_EDGE,[af]:e.MIRRORED_REPEAT},At={[fn]:e.NEAREST,[Z1]:e.NEAREST_MIPMAP_NEAREST,[mu]:e.NEAREST_MIPMAP_LINEAR,[Mn]:e.LINEAR,[Lf]:e.LINEAR_MIPMAP_NEAREST,[$a]:e.LINEAR_MIPMAP_LINEAR},se={[Q1]:e.NEVER,[iE]:e.ALWAYS,[$1]:e.LESS,[mp]:e.LEQUAL,[tE]:e.EQUAL,[gp]:e.GEQUAL,[eE]:e.GREATER,[nE]:e.NOTEQUAL};function Kt(C,x){if(x.type===Qi&&t.has("OES_texture_float_linear")===!1&&(x.magFilter===Mn||x.magFilter===Lf||x.magFilter===mu||x.magFilter===$a||x.minFilter===Mn||x.minFilter===Lf||x.minFilter===mu||x.minFilter===$a)&&Ot("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),e.texParameteri(C,e.TEXTURE_WRAP_S,Dt[x.wrapS]),e.texParameteri(C,e.TEXTURE_WRAP_T,Dt[x.wrapT]),(C===e.TEXTURE_3D||C===e.TEXTURE_2D_ARRAY)&&e.texParameteri(C,e.TEXTURE_WRAP_R,Dt[x.wrapR]),e.texParameteri(C,e.TEXTURE_MAG_FILTER,At[x.magFilter]),e.texParameteri(C,e.TEXTURE_MIN_FILTER,At[x.minFilter]),x.compareFunction&&(e.texParameteri(C,e.TEXTURE_COMPARE_MODE,e.COMPARE_REF_TO_TEXTURE),e.texParameteri(C,e.TEXTURE_COMPARE_FUNC,se[x.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===fn||x.minFilter!==mu&&x.minFilter!==$a||x.type===Qi&&t.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||i.get(x).__currentAnisotropy){let B=t.get("EXT_texture_filter_anisotropic");e.texParameterf(C,B.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,s.getMaxAnisotropy())),i.get(x).__currentAnisotropy=x.anisotropy}}}function re(C,x){let B=!1;C.__webglInit===void 0&&(C.__webglInit=!0,x.addEventListener("dispose",w));let k=x.source,q=p.get(k);q===void 0&&(q={},p.set(k,q));let rt=j(x);if(rt!==C.__cacheKey){q[rt]===void 0&&(q[rt]={texture:e.createTexture(),usedTimes:0},r.memory.textures++,B=!0),q[rt].usedTimes++;let ot=q[C.__cacheKey];ot!==void 0&&(q[C.__cacheKey].usedTimes--,ot.usedTimes===0&&R(x)),C.__cacheKey=rt,C.__webglTexture=q[rt].texture}return B}function K(C,x,B){return Math.floor(Math.floor(C/B)/x)}function et(C,x,B,k){let rt=C.updateRanges;if(rt.length===0)n.texSubImage2D(e.TEXTURE_2D,0,0,0,x.width,x.height,B,k,x.data);else{rt.sort((wt,ut)=>wt.start-ut.start);let ot=0;for(let wt=1;wt<rt.length;wt++){let ut=rt[ot],lt=rt[wt],Ct=ut.start+ut.count,Lt=K(lt.start,x.width,4),Gt=K(ut.start,x.width,4);lt.start<=Ct+1&&Lt===Gt&&K(lt.start+lt.count-1,x.width,4)===Lt?ut.count=Math.max(ut.count,lt.start+lt.count-ut.start):(++ot,rt[ot]=lt)}rt.length=ot+1;let J=n.getParameter(e.UNPACK_ROW_LENGTH),$=n.getParameter(e.UNPACK_SKIP_PIXELS),ct=n.getParameter(e.UNPACK_SKIP_ROWS);n.pixelStorei(e.UNPACK_ROW_LENGTH,x.width);for(let wt=0,ut=rt.length;wt<ut;wt++){let lt=rt[wt],Ct=Math.floor(lt.start/4),Lt=Math.ceil(lt.count/4),Gt=Ct%x.width,L=Math.floor(Ct/x.width),ht=Lt,Q=1;n.pixelStorei(e.UNPACK_SKIP_PIXELS,Gt),n.pixelStorei(e.UNPACK_SKIP_ROWS,L),n.texSubImage2D(e.TEXTURE_2D,0,Gt,L,ht,Q,B,k,x.data)}C.clearUpdateRanges(),n.pixelStorei(e.UNPACK_ROW_LENGTH,J),n.pixelStorei(e.UNPACK_SKIP_PIXELS,$),n.pixelStorei(e.UNPACK_SKIP_ROWS,ct)}}function xt(C,x,B){let k=e.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(k=e.TEXTURE_2D_ARRAY),x.isData3DTexture&&(k=e.TEXTURE_3D);let q=re(C,x),rt=x.source;n.bindTexture(k,C.__webglTexture,e.TEXTURE0+B);let ot=i.get(rt);if(rt.version!==ot.__version||q===!0){if(n.activeTexture(e.TEXTURE0+B),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){let Q=ie.getPrimaries(ie.workingColorSpace),ft=x.colorSpace===na?null:ie.getPrimaries(x.colorSpace),vt=x.colorSpace===na||Q===ft?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,x.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,vt)}n.pixelStorei(e.UNPACK_ALIGNMENT,x.unpackAlignment);let $=g(x.image,!1,s.maxTextureSize);$=je(x,$);let ct=a.convert(x.format,x.colorSpace),wt=a.convert(x.type),ut=y(x.internalFormat,ct,wt,x.normalized,x.colorSpace,x.isVideoTexture);Kt(k,x);let lt,Ct=x.mipmaps,Lt=x.isVideoTexture!==!0,Gt=ot.__version===void 0||q===!0,L=rt.dataReady,ht=E(x,$);if(x.isDepthTexture)ut=T(x.format===tr,x.type),Gt&&(Lt?n.texStorage2D(e.TEXTURE_2D,1,ut,$.width,$.height):n.texImage2D(e.TEXTURE_2D,0,ut,$.width,$.height,0,ct,wt,null));else if(x.isDataTexture)if(Ct.length>0){Lt&&Gt&&n.texStorage2D(e.TEXTURE_2D,ht,ut,Ct[0].width,Ct[0].height);for(let Q=0,ft=Ct.length;Q<ft;Q++)lt=Ct[Q],Lt?L&&n.texSubImage2D(e.TEXTURE_2D,Q,0,0,lt.width,lt.height,ct,wt,lt.data):n.texImage2D(e.TEXTURE_2D,Q,ut,lt.width,lt.height,0,ct,wt,lt.data);x.generateMipmaps=!1}else Lt?(Gt&&n.texStorage2D(e.TEXTURE_2D,ht,ut,$.width,$.height),L&&et(x,$,ct,wt)):n.texImage2D(e.TEXTURE_2D,0,ut,$.width,$.height,0,ct,wt,$.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Lt&&Gt&&n.texStorage3D(e.TEXTURE_2D_ARRAY,ht,ut,Ct[0].width,Ct[0].height,$.depth);for(let Q=0,ft=Ct.length;Q<ft;Q++)if(lt=Ct[Q],x.format!==Pi)if(ct!==null)if(Lt){if(L)if(x.layerUpdates.size>0){let vt=Yv(lt.width,lt.height,x.format,x.type);for(let it of x.layerUpdates){let Nt=lt.data.subarray(it*vt/lt.data.BYTES_PER_ELEMENT,(it+1)*vt/lt.data.BYTES_PER_ELEMENT);n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,it,lt.width,lt.height,1,ct,Nt)}}else n.compressedTexSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,0,lt.width,lt.height,$.depth,ct,lt.data)}else n.compressedTexImage3D(e.TEXTURE_2D_ARRAY,Q,ut,lt.width,lt.height,$.depth,0,lt.data,0,0);else Ot("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Lt?L&&n.texSubImage3D(e.TEXTURE_2D_ARRAY,Q,0,0,0,lt.width,lt.height,$.depth,ct,wt,lt.data):n.texImage3D(e.TEXTURE_2D_ARRAY,Q,ut,lt.width,lt.height,$.depth,0,ct,wt,lt.data);x.layerUpdates.size>0&&x.clearLayerUpdates()}else{Lt&&Gt&&n.texStorage2D(e.TEXTURE_2D,ht,ut,Ct[0].width,Ct[0].height);for(let Q=0,ft=Ct.length;Q<ft;Q++)lt=Ct[Q],x.format!==Pi?ct!==null?Lt?L&&n.compressedTexSubImage2D(e.TEXTURE_2D,Q,0,0,lt.width,lt.height,ct,lt.data):n.compressedTexImage2D(e.TEXTURE_2D,Q,ut,lt.width,lt.height,0,lt.data):Ot("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Lt?L&&n.texSubImage2D(e.TEXTURE_2D,Q,0,0,lt.width,lt.height,ct,wt,lt.data):n.texImage2D(e.TEXTURE_2D,Q,ut,lt.width,lt.height,0,ct,wt,lt.data)}else if(x.isDataArrayTexture)if(Lt){if(Gt&&n.texStorage3D(e.TEXTURE_2D_ARRAY,ht,ut,$.width,$.height,$.depth),L)if(x.layerUpdates.size>0){let Q=Yv($.width,$.height,x.format,x.type);for(let ft of x.layerUpdates){let vt=$.data.subarray(ft*Q/$.data.BYTES_PER_ELEMENT,(ft+1)*Q/$.data.BYTES_PER_ELEMENT);n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,ft,$.width,$.height,1,ct,wt,vt)}x.clearLayerUpdates()}else n.texSubImage3D(e.TEXTURE_2D_ARRAY,0,0,0,0,$.width,$.height,$.depth,ct,wt,$.data)}else n.texImage3D(e.TEXTURE_2D_ARRAY,0,ut,$.width,$.height,$.depth,0,ct,wt,$.data);else if(x.isData3DTexture)Lt?(Gt&&n.texStorage3D(e.TEXTURE_3D,ht,ut,$.width,$.height,$.depth),L&&n.texSubImage3D(e.TEXTURE_3D,0,0,0,0,$.width,$.height,$.depth,ct,wt,$.data)):n.texImage3D(e.TEXTURE_3D,0,ut,$.width,$.height,$.depth,0,ct,wt,$.data);else if(x.isFramebufferTexture){if(Gt)if(Lt)n.texStorage2D(e.TEXTURE_2D,ht,ut,$.width,$.height);else{let Q=$.width,ft=$.height;for(let vt=0;vt<ht;vt++)n.texImage2D(e.TEXTURE_2D,vt,ut,Q,ft,0,ct,wt,null),Q>>=1,ft>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in e){let Q=e.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),$.parentNode!==Q){Q.appendChild($),d.add(x),Q.onpaint=ft=>{let vt=ft.changedElements;for(let it of d)vt.includes(it.image)&&(it.needsUpdate=!0)},Q.requestPaint();return}if(e.texElementImage2D.length===3)e.texElementImage2D(e.TEXTURE_2D,e.RGBA8,$);else{let vt=e.RGBA,it=e.RGBA,Nt=e.UNSIGNED_BYTE;e.texElementImage2D(e.TEXTURE_2D,0,vt,it,Nt,$)}e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)}}else if(Ct.length>0){if(Lt&&Gt){let Q=Jt(Ct[0]);n.texStorage2D(e.TEXTURE_2D,ht,ut,Q.width,Q.height)}for(let Q=0,ft=Ct.length;Q<ft;Q++)lt=Ct[Q],Lt?L&&n.texSubImage2D(e.TEXTURE_2D,Q,0,0,ct,wt,lt):n.texImage2D(e.TEXTURE_2D,Q,ut,ct,wt,lt);x.generateMipmaps=!1}else if(Lt){if(Gt){let Q=Jt($);n.texStorage2D(e.TEXTURE_2D,ht,ut,Q.width,Q.height)}L&&n.texSubImage2D(e.TEXTURE_2D,0,0,0,ct,wt,$)}else n.texImage2D(e.TEXTURE_2D,0,ut,ct,wt,$);f(x)&&v(k),ot.__version=rt.version,x.onUpdate&&x.onUpdate(x)}C.__version=x.version}function Bt(C,x,B){if(x.image.length!==6)return;let k=re(C,x),q=x.source;n.bindTexture(e.TEXTURE_CUBE_MAP,C.__webglTexture,e.TEXTURE0+B);let rt=i.get(q);if(q.version!==rt.__version||k===!0){n.activeTexture(e.TEXTURE0+B);let ot=ie.getPrimaries(ie.workingColorSpace),J=x.colorSpace===na?null:ie.getPrimaries(x.colorSpace),$=x.colorSpace===na||ot===J?e.NONE:e.BROWSER_DEFAULT_WEBGL;n.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,x.flipY),n.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),n.pixelStorei(e.UNPACK_ALIGNMENT,x.unpackAlignment),n.pixelStorei(e.UNPACK_COLORSPACE_CONVERSION_WEBGL,$);let ct=x.isCompressedTexture||x.image[0].isCompressedTexture,wt=x.image[0]&&x.image[0].isDataTexture,ut=[];for(let it=0;it<6;it++)!ct&&!wt?ut[it]=g(x.image[it],!0,s.maxCubemapSize):ut[it]=wt?x.image[it].image:x.image[it],ut[it]=je(x,ut[it]);let lt=ut[0],Ct=a.convert(x.format,x.colorSpace),Lt=a.convert(x.type),Gt=y(x.internalFormat,Ct,Lt,x.normalized,x.colorSpace),L=x.isVideoTexture!==!0,ht=rt.__version===void 0||k===!0,Q=q.dataReady,ft=E(x,lt);Kt(e.TEXTURE_CUBE_MAP,x);let vt;if(ct){L&&ht&&n.texStorage2D(e.TEXTURE_CUBE_MAP,ft,Gt,lt.width,lt.height);for(let it=0;it<6;it++){vt=ut[it].mipmaps;for(let Nt=0;Nt<vt.length;Nt++){let Mt=vt[Nt];x.format!==Pi?Ct!==null?L?Q&&n.compressedTexSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,Nt,0,0,Mt.width,Mt.height,Ct,Mt.data):n.compressedTexImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,Nt,Gt,Mt.width,Mt.height,0,Mt.data):Ot("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):L?Q&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,Nt,0,0,Mt.width,Mt.height,Ct,Lt,Mt.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,Nt,Gt,Mt.width,Mt.height,0,Ct,Lt,Mt.data)}}}else{if(vt=x.mipmaps,L&&ht){vt.length>0&&ft++;let it=Jt(ut[0]);n.texStorage2D(e.TEXTURE_CUBE_MAP,ft,Gt,it.width,it.height)}for(let it=0;it<6;it++)if(wt){L?Q&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,0,0,ut[it].width,ut[it].height,Ct,Lt,ut[it].data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,Gt,ut[it].width,ut[it].height,0,Ct,Lt,ut[it].data);for(let Nt=0;Nt<vt.length;Nt++){let de=vt[Nt].image[it].image;L?Q&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,Nt+1,0,0,de.width,de.height,Ct,Lt,de.data):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,Nt+1,Gt,de.width,de.height,0,Ct,Lt,de.data)}}else{L?Q&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,0,0,Ct,Lt,ut[it]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,0,Gt,Ct,Lt,ut[it]);for(let Nt=0;Nt<vt.length;Nt++){let Mt=vt[Nt];L?Q&&n.texSubImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,Nt+1,0,0,Ct,Lt,Mt.image[it]):n.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+it,Nt+1,Gt,Ct,Lt,Mt.image[it])}}}f(x)&&v(e.TEXTURE_CUBE_MAP),rt.__version=q.version,x.onUpdate&&x.onUpdate(x)}C.__version=x.version}function yt(C,x,B,k,q,rt){let ot=a.convert(B.format,B.colorSpace),J=a.convert(B.type),$=y(B.internalFormat,ot,J,B.normalized,B.colorSpace),ct=i.get(x),wt=i.get(B);if(wt.__renderTarget=x,!ct.__hasExternalTextures){let ut=Math.max(1,x.width>>rt),lt=Math.max(1,x.height>>rt);q===e.TEXTURE_3D||q===e.TEXTURE_2D_ARRAY?n.texImage3D(q,rt,$,ut,lt,x.depth,0,ot,J,null):n.texImage2D(q,rt,$,ut,lt,0,ot,J,null)}n.bindFramebuffer(e.FRAMEBUFFER,C),Pe(x)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,k,q,wt.__webglTexture,0,Oe(x)):(q===e.TEXTURE_2D||q>=e.TEXTURE_CUBE_MAP_POSITIVE_X&&q<=e.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&e.framebufferTexture2D(e.FRAMEBUFFER,k,q,wt.__webglTexture,rt),n.bindFramebuffer(e.FRAMEBUFFER,null)}function Ft(C,x,B){if(e.bindRenderbuffer(e.RENDERBUFFER,C),x.depthBuffer){let k=x.depthTexture,q=k&&k.isDepthTexture?k.type:null,rt=T(x.stencilBuffer,q),ot=x.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;Pe(x)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Oe(x),rt,x.width,x.height):B?e.renderbufferStorageMultisample(e.RENDERBUFFER,Oe(x),rt,x.width,x.height):e.renderbufferStorage(e.RENDERBUFFER,rt,x.width,x.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,ot,e.RENDERBUFFER,C)}else{let k=x.textures;for(let q=0;q<k.length;q++){let rt=k[q],ot=a.convert(rt.format,rt.colorSpace),J=a.convert(rt.type),$=y(rt.internalFormat,ot,J,rt.normalized,rt.colorSpace);Pe(x)?o.renderbufferStorageMultisampleEXT(e.RENDERBUFFER,Oe(x),$,x.width,x.height):B?e.renderbufferStorageMultisample(e.RENDERBUFFER,Oe(x),$,x.width,x.height):e.renderbufferStorage(e.RENDERBUFFER,$,x.width,x.height)}}e.bindRenderbuffer(e.RENDERBUFFER,null)}function Ve(C,x,B){let k=x.isWebGLCubeRenderTarget===!0;if(n.bindFramebuffer(e.FRAMEBUFFER,C),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let q=i.get(x.depthTexture);if(q.__renderTarget=x,(!q.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),k){if(q.__webglInit===void 0&&(q.__webglInit=!0,x.depthTexture.addEventListener("dispose",w)),q.__webglTexture===void 0){q.__webglTexture=e.createTexture(),n.bindTexture(e.TEXTURE_CUBE_MAP,q.__webglTexture),Kt(e.TEXTURE_CUBE_MAP,x.depthTexture);let ct=a.convert(x.depthTexture.format),wt=a.convert(x.depthTexture.type),ut;x.depthTexture.format===xs?ut=e.DEPTH_COMPONENT24:x.depthTexture.format===tr&&(ut=e.DEPTH24_STENCIL8);for(let lt=0;lt<6;lt++)e.texImage2D(e.TEXTURE_CUBE_MAP_POSITIVE_X+lt,0,ut,x.width,x.height,0,ct,wt,null)}}else at(x.depthTexture,0);let rt=q.__webglTexture,ot=Oe(x),J=k?e.TEXTURE_CUBE_MAP_POSITIVE_X+B:e.TEXTURE_2D,$=x.depthTexture.format===tr?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;if(x.depthTexture.format===xs)Pe(x)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,$,J,rt,0,ot):e.framebufferTexture2D(e.FRAMEBUFFER,$,J,rt,0);else if(x.depthTexture.format===tr)Pe(x)?o.framebufferTexture2DMultisampleEXT(e.FRAMEBUFFER,$,J,rt,0,ot):e.framebufferTexture2D(e.FRAMEBUFFER,$,J,rt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function It(C){let x=i.get(C),B=C.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==C.depthTexture){let k=C.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),k){let q=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,k.removeEventListener("dispose",q)};k.addEventListener("dispose",q),x.__depthDisposeCallback=q}x.__boundDepthTexture=k}if(C.depthTexture&&!x.__autoAllocateDepthBuffer)if(B)for(let k=0;k<6;k++)Ve(x.__webglFramebuffer[k],C,k);else{let k=C.texture.mipmaps;k&&k.length>0?Ve(x.__webglFramebuffer[0],C,0):Ve(x.__webglFramebuffer,C,0)}else if(B){x.__webglDepthbuffer=[];for(let k=0;k<6;k++)if(n.bindFramebuffer(e.FRAMEBUFFER,x.__webglFramebuffer[k]),x.__webglDepthbuffer[k]===void 0)x.__webglDepthbuffer[k]=e.createRenderbuffer(),Ft(x.__webglDepthbuffer[k],C,!1);else{let q=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,rt=x.__webglDepthbuffer[k];e.bindRenderbuffer(e.RENDERBUFFER,rt),e.framebufferRenderbuffer(e.FRAMEBUFFER,q,e.RENDERBUFFER,rt)}}else{let k=C.texture.mipmaps;if(k&&k.length>0?n.bindFramebuffer(e.FRAMEBUFFER,x.__webglFramebuffer[0]):n.bindFramebuffer(e.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=e.createRenderbuffer(),Ft(x.__webglDepthbuffer,C,!1);else{let q=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,rt=x.__webglDepthbuffer;e.bindRenderbuffer(e.RENDERBUFFER,rt),e.framebufferRenderbuffer(e.FRAMEBUFFER,q,e.RENDERBUFFER,rt)}}n.bindFramebuffer(e.FRAMEBUFFER,null)}function ae(C,x,B){let k=i.get(C);x!==void 0&&yt(k.__webglFramebuffer,C,C.texture,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,0),B!==void 0&&It(C)}function ge(C){let x=C.texture,B=i.get(C),k=i.get(x);C.addEventListener("dispose",_);let q=C.textures,rt=C.isWebGLCubeRenderTarget===!0,ot=q.length>1;if(ot||(k.__webglTexture===void 0&&(k.__webglTexture=e.createTexture()),k.__version=x.version,r.memory.textures++),rt){B.__webglFramebuffer=[];for(let J=0;J<6;J++)if(x.mipmaps&&x.mipmaps.length>0){B.__webglFramebuffer[J]=[];for(let $=0;$<x.mipmaps.length;$++)B.__webglFramebuffer[J][$]=e.createFramebuffer()}else B.__webglFramebuffer[J]=e.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){B.__webglFramebuffer=[];for(let J=0;J<x.mipmaps.length;J++)B.__webglFramebuffer[J]=e.createFramebuffer()}else B.__webglFramebuffer=e.createFramebuffer();if(ot)for(let J=0,$=q.length;J<$;J++){let ct=i.get(q[J]);ct.__webglTexture===void 0&&(ct.__webglTexture=e.createTexture(),r.memory.textures++)}if(C.samples>0&&Pe(C)===!1){B.__webglMultisampledFramebuffer=e.createFramebuffer(),B.__webglColorRenderbuffer=[],n.bindFramebuffer(e.FRAMEBUFFER,B.__webglMultisampledFramebuffer);for(let J=0;J<q.length;J++){let $=q[J];B.__webglColorRenderbuffer[J]=e.createRenderbuffer(),e.bindRenderbuffer(e.RENDERBUFFER,B.__webglColorRenderbuffer[J]);let ct=a.convert($.format,$.colorSpace),wt=a.convert($.type),ut=y($.internalFormat,ct,wt,$.normalized,$.colorSpace,C.isXRRenderTarget===!0),lt=Oe(C);e.renderbufferStorageMultisample(e.RENDERBUFFER,lt,ut,C.width,C.height),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+J,e.RENDERBUFFER,B.__webglColorRenderbuffer[J])}e.bindRenderbuffer(e.RENDERBUFFER,null),C.depthBuffer&&(B.__webglDepthRenderbuffer=e.createRenderbuffer(),Ft(B.__webglDepthRenderbuffer,C,!0)),n.bindFramebuffer(e.FRAMEBUFFER,null)}}if(rt){n.bindTexture(e.TEXTURE_CUBE_MAP,k.__webglTexture),Kt(e.TEXTURE_CUBE_MAP,x);for(let J=0;J<6;J++)if(x.mipmaps&&x.mipmaps.length>0)for(let $=0;$<x.mipmaps.length;$++)yt(B.__webglFramebuffer[J][$],C,x,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+J,$);else yt(B.__webglFramebuffer[J],C,x,e.COLOR_ATTACHMENT0,e.TEXTURE_CUBE_MAP_POSITIVE_X+J,0);f(x)&&v(e.TEXTURE_CUBE_MAP),n.unbindTexture()}else if(ot){for(let J=0,$=q.length;J<$;J++){let ct=q[J],wt=i.get(ct),ut=e.TEXTURE_2D;(C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(ut=C.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(ut,wt.__webglTexture),Kt(ut,ct),yt(B.__webglFramebuffer,C,ct,e.COLOR_ATTACHMENT0+J,ut,0),f(ct)&&v(ut)}n.unbindTexture()}else{let J=e.TEXTURE_2D;if((C.isWebGL3DRenderTarget||C.isWebGLArrayRenderTarget)&&(J=C.isWebGL3DRenderTarget?e.TEXTURE_3D:e.TEXTURE_2D_ARRAY),n.bindTexture(J,k.__webglTexture),Kt(J,x),x.mipmaps&&x.mipmaps.length>0)for(let $=0;$<x.mipmaps.length;$++)yt(B.__webglFramebuffer[$],C,x,e.COLOR_ATTACHMENT0,J,$);else yt(B.__webglFramebuffer,C,x,e.COLOR_ATTACHMENT0,J,0);f(x)&&v(J),n.unbindTexture()}C.depthBuffer&&It(C)}function kt(C){let x=C.textures;for(let B=0,k=x.length;B<k;B++){let q=x[B];if(f(q)){let rt=b(C),ot=i.get(q).__webglTexture;n.bindTexture(rt,ot),v(rt),n.unbindTexture()}}}let Ce=[],Ie=[];function En(C){if(C.samples>0){if(Pe(C)===!1){let x=C.textures,B=C.width,k=C.height,q=e.COLOR_BUFFER_BIT,rt=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT,ot=i.get(C),J=x.length>1;if(J)for(let ct=0;ct<x.length;ct++)n.bindFramebuffer(e.FRAMEBUFFER,ot.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ct,e.RENDERBUFFER,null),n.bindFramebuffer(e.FRAMEBUFFER,ot.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ct,e.TEXTURE_2D,null,0);n.bindFramebuffer(e.READ_FRAMEBUFFER,ot.__webglMultisampledFramebuffer);let $=C.texture.mipmaps;$&&$.length>0?n.bindFramebuffer(e.DRAW_FRAMEBUFFER,ot.__webglFramebuffer[0]):n.bindFramebuffer(e.DRAW_FRAMEBUFFER,ot.__webglFramebuffer);for(let ct=0;ct<x.length;ct++){if(C.resolveDepthBuffer&&(C.depthBuffer&&(q|=e.DEPTH_BUFFER_BIT),C.stencilBuffer&&C.resolveStencilBuffer&&(q|=e.STENCIL_BUFFER_BIT)),J){e.framebufferRenderbuffer(e.READ_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,ot.__webglColorRenderbuffer[ct]);let wt=i.get(x[ct]).__webglTexture;e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,wt,0)}e.blitFramebuffer(0,0,B,k,0,0,B,k,q,e.NEAREST),l===!0&&(Ce.length=0,Ie.length=0,Ce.push(e.COLOR_ATTACHMENT0+ct),C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&(Ce.push(rt),Ie.push(rt),e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,Ie)),e.invalidateFramebuffer(e.READ_FRAMEBUFFER,Ce))}if(n.bindFramebuffer(e.READ_FRAMEBUFFER,null),n.bindFramebuffer(e.DRAW_FRAMEBUFFER,null),J)for(let ct=0;ct<x.length;ct++){n.bindFramebuffer(e.FRAMEBUFFER,ot.__webglMultisampledFramebuffer),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0+ct,e.RENDERBUFFER,ot.__webglColorRenderbuffer[ct]);let wt=i.get(x[ct]).__webglTexture;n.bindFramebuffer(e.FRAMEBUFFER,ot.__webglFramebuffer),e.framebufferTexture2D(e.DRAW_FRAMEBUFFER,e.COLOR_ATTACHMENT0+ct,e.TEXTURE_2D,wt,0)}n.bindFramebuffer(e.DRAW_FRAMEBUFFER,ot.__webglMultisampledFramebuffer)}else if(C.depthBuffer&&C.storeMultisampledDepthBuffer===!1&&l){let x=C.stencilBuffer?e.DEPTH_STENCIL_ATTACHMENT:e.DEPTH_ATTACHMENT;e.invalidateFramebuffer(e.DRAW_FRAMEBUFFER,[x])}}}function Oe(C){return Math.min(s.maxSamples,C.samples)}function Pe(C){let x=i.get(C);return C.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function U(C){let x=r.render.frame;h.get(C)!==x&&(h.set(C,x),C.update())}function je(C,x){let B=C.colorSpace,k=C.format,q=C.type;return C.isCompressedTexture===!0||C.isVideoTexture===!0||B!==kc&&B!==na&&(ie.getTransfer(B)===me?(k!==Pi||q!==Si)&&Ot("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Pt("WebGLTextures: Unsupported texture color space:",B)),x}function Jt(C){return typeof HTMLImageElement<"u"&&C instanceof HTMLImageElement?(c.width=C.naturalWidth||C.width,c.height=C.naturalHeight||C.height):typeof VideoFrame<"u"&&C instanceof VideoFrame?(c.width=C.displayWidth,c.height=C.displayHeight):(c.width=C.width,c.height=C.height),c}this.allocateTextureUnit=Y,this.resetTextureUnits=z,this.getTextureUnits=I,this.setTextureUnits=X,this.setTexture2D=at,this.setTexture2DArray=Z,this.setTexture3D=nt,this.setTextureCube=st,this.rebindTextures=ae,this.setupRenderTarget=ge,this.updateRenderTargetMipmap=kt,this.updateMultisampleRenderTarget=En,this.setupDepthRenderbuffer=It,this.setupFrameBufferTexture=yt,this.useMultisampledRTT=Pe,this.isReversedDepthBuffer=function(){return n.buffers.depth.getReversed()}}function GL(e,t){function n(i,s=na){let a,r=ie.getTransfer(s);if(i===Si)return e.UNSIGNED_BYTE;if(i===If)return e.UNSIGNED_SHORT_4_4_4_4;if(i===Of)return e.UNSIGNED_SHORT_5_5_5_1;if(i===Ov)return e.UNSIGNED_INT_5_9_9_9_REV;if(i===Pv)return e.UNSIGNED_INT_10F_11F_11F_REV;if(i===Uv)return e.BYTE;if(i===Iv)return e.SHORT;if(i===Sl)return e.UNSIGNED_SHORT;if(i===Uf)return e.INT;if(i===Ji)return e.UNSIGNED_INT;if(i===Qi)return e.FLOAT;if(i===$i)return e.HALF_FLOAT;if(i===Bv)return e.ALPHA;if(i===zv)return e.RGB;if(i===Pi)return e.RGBA;if(i===xs)return e.DEPTH_COMPONENT;if(i===tr)return e.DEPTH_STENCIL;if(i===Fv)return e.RED;if(i===Pf)return e.RED_INTEGER;if(i===er)return e.RG;if(i===Bf)return e.RG_INTEGER;if(i===zf)return e.RGBA_INTEGER;if(i===gu||i===vu||i===_u||i===yu)if(r===me)if(a=t.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(i===gu)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===vu)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===_u)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===yu)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=t.get("WEBGL_compressed_texture_s3tc"),a!==null){if(i===gu)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===vu)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===_u)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===yu)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Ff||i===Gf||i===Hf||i===Vf)if(a=t.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(i===Ff)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Gf)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===Hf)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Vf)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===kf||i===Xf||i===Wf||i===qf||i===Yf||i===xu||i===Zf)if(a=t.get("WEBGL_compressed_texture_etc"),a!==null){if(i===kf||i===Xf)return r===me?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(i===Wf)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC;if(i===qf)return a.COMPRESSED_R11_EAC;if(i===Yf)return a.COMPRESSED_SIGNED_R11_EAC;if(i===xu)return a.COMPRESSED_RG11_EAC;if(i===Zf)return a.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===jf||i===Kf||i===Jf||i===Qf||i===$f||i===tp||i===ep||i===np||i===ip||i===sp||i===ap||i===rp||i===op||i===lp)if(a=t.get("WEBGL_compressed_texture_astc"),a!==null){if(i===jf)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Kf)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Jf)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Qf)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===$f)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===tp)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===ep)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===np)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===ip)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===sp)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===ap)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===rp)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===op)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===lp)return r===me?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===cp||i===up||i===hp)if(a=t.get("EXT_texture_compression_bptc"),a!==null){if(i===cp)return r===me?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===up)return a.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===hp)return a.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===dp||i===fp||i===Su||i===pp)if(a=t.get("EXT_texture_compression_rgtc"),a!==null){if(i===dp)return a.COMPRESSED_RED_RGTC1_EXT;if(i===fp)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Su)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===pp)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===bl?e.UNSIGNED_INT_24_8:e[i]!==void 0?e[i]:null}return{convert:n}}var HL=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,VL=`
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

}`,o_=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,n){if(this.texture===null){let i=new su(t.texture);(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=i}}getMesh(t){if(this.texture!==null&&this.mesh===null){let n=t.cameras[0].viewport,i=new yi({vertexShader:HL,fragmentShader:VL,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new Wn(new au(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},l_=class extends ji{constructor(t,n){super();let i=this,s=null,a=1,r=null,o="local-floor",l=1,c=null,h=null,d=null,u=null,p=null,m=null,S=typeof XRWebGLBinding<"u",g=new o_,f={},v=n.getContextAttributes(),b=null,y=null,T=[],E=[],w=new Ut,_=null,A=null,R=new Ln;R.viewport=new Xe;let O=new Ln;O.viewport=new Xe;let F=[R,O],z=new Rf,I=null,X=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let et=T[K];return et===void 0&&(et=new dl,T[K]=et),et.getTargetRaySpace()},this.getControllerGrip=function(K){let et=T[K];return et===void 0&&(et=new dl,T[K]=et),et.getGripSpace()},this.getHand=function(K){let et=T[K];return et===void 0&&(et=new dl,T[K]=et),et.getHandSpace()};function Y(K){let et=E.indexOf(K.inputSource);if(et===-1)return;let xt=T[et];xt!==void 0&&(xt.update(K.inputSource,K.frame,c||r),xt.dispatchEvent({type:K.type,data:K.inputSource}))}function j(){s.removeEventListener("select",Y),s.removeEventListener("selectstart",Y),s.removeEventListener("selectend",Y),s.removeEventListener("squeeze",Y),s.removeEventListener("squeezestart",Y),s.removeEventListener("squeezeend",Y),s.removeEventListener("end",j),s.removeEventListener("inputsourceschange",at);for(let K=0;K<T.length;K++){let et=E[K];et!==null&&(E[K]=null,T[K].disconnect(et))}I=null,X=null,g.reset();for(let K in f)delete f[K];if(t.setRenderTarget(b),p=null,u=null,d=null,s=null,y=null,re.stop(),i.isPresenting=!1,t.setPixelRatio(_),t.setSize(w.width,w.height,!1),A!==null){let K=A.camera;K.fov=A.fov,K.zoom=A.zoom,K.updateProjectionMatrix(),A=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){a=K,i.isPresenting===!0&&Ot("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){o=K,i.isPresenting===!0&&Ot("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||r},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return u!==null?u:p},this.getBinding=function(){return d===null&&S&&(d=new XRWebGLBinding(s,n)),d},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(b=t.getRenderTarget(),s.addEventListener("select",Y),s.addEventListener("selectstart",Y),s.addEventListener("selectend",Y),s.addEventListener("squeeze",Y),s.addEventListener("squeezestart",Y),s.addEventListener("squeezeend",Y),s.addEventListener("end",j),s.addEventListener("inputsourceschange",at),v.xrCompatible!==!0&&await n.makeXRCompatible(),_=t.getPixelRatio(),t.getSize(w),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let xt=null,Bt=null,yt=null;v.depth&&(yt=v.stencil?n.DEPTH24_STENCIL8:n.DEPTH_COMPONENT24,xt=v.stencil?tr:xs,Bt=v.stencil?bl:Ji);let Ft={colorFormat:n.RGBA8,depthFormat:yt,scaleFactor:a};d=this.getBinding(),u=d.createProjectionLayer(Ft),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),y=new ti(u.textureWidth,u.textureHeight,{format:Pi,type:Si,depthTexture:new Wa(u.textureWidth,u.textureHeight,Bt,void 0,void 0,void 0,void 0,void 0,void 0,xt),stencilBuffer:v.stencil,colorSpace:t.outputColorSpace,samples:v.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let xt={antialias:v.antialias,alpha:!0,depth:v.depth,stencil:v.stencil,framebufferScaleFactor:a};p=new XRWebGLLayer(s,n,xt),s.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),y=new ti(p.framebufferWidth,p.framebufferHeight,{format:Pi,type:Si,colorSpace:t.outputColorSpace,stencilBuffer:v.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}y.isXRRenderTarget=!0,this.setFoveation(l),c=null,r=await s.requestReferenceSpace(o),re.setContext(s),re.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function at(K){for(let et=0;et<K.removed.length;et++){let xt=K.removed[et],Bt=E.indexOf(xt);Bt>=0&&(E[Bt]=null,T[Bt].disconnect(xt))}for(let et=0;et<K.added.length;et++){let xt=K.added[et],Bt=E.indexOf(xt);if(Bt===-1){for(let Ft=0;Ft<T.length;Ft++)if(Ft>=E.length){E.push(xt),Bt=Ft;break}else if(E[Ft]===null){E[Ft]=xt,Bt=Ft;break}if(Bt===-1)break}let yt=T[Bt];yt&&yt.connect(xt)}}let Z=new P,nt=new P;function st(K,et,xt){Z.setFromMatrixPosition(et.matrixWorld),nt.setFromMatrixPosition(xt.matrixWorld);let Bt=Z.distanceTo(nt),yt=et.projectionMatrix.elements,Ft=xt.projectionMatrix.elements,Ve=yt[14]/(yt[10]-1),It=yt[14]/(yt[10]+1),ae=(yt[9]+1)/yt[5],ge=(yt[9]-1)/yt[5],kt=(yt[8]-1)/yt[0],Ce=(Ft[8]+1)/Ft[0],Ie=Ve*kt,En=Ve*Ce,Oe=Bt/(-kt+Ce),Pe=Oe*-kt;if(et.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(Pe),K.translateZ(Oe),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),yt[10]===-1)K.projectionMatrix.copy(et.projectionMatrix),K.projectionMatrixInverse.copy(et.projectionMatrixInverse);else{let U=Ve+Oe,je=It+Oe,Jt=Ie-Pe,C=En+(Bt-Pe),x=ae*It/je*U,B=ge*It/je*U;K.projectionMatrix.makePerspective(Jt,C,x,B,U,je),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function Dt(K,et){et===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(et.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let et=K.near,xt=K.far;g.texture!==null&&(g.depthNear>0&&(et=g.depthNear),g.depthFar>0&&(xt=g.depthFar)),z.near=O.near=R.near=et,z.far=O.far=R.far=xt,(I!==z.near||X!==z.far)&&(s.updateRenderState({depthNear:z.near,depthFar:z.far}),I=z.near,X=z.far),z.layers.mask=K.layers.mask|6,R.layers.mask=z.layers.mask&-5,O.layers.mask=z.layers.mask&-3;let Bt=K.parent,yt=z.cameras;Dt(z,Bt);for(let Ft=0;Ft<yt.length;Ft++)Dt(yt[Ft],Bt);yt.length===2?st(z,R,O):z.projectionMatrix.copy(R.projectionMatrix),A===null&&K.isPerspectiveCamera&&(A={camera:K,fov:K.fov,zoom:K.zoom}),At(K,z,Bt)};function At(K,et,xt){xt===null?K.matrix.copy(et.matrixWorld):(K.matrix.copy(xt.matrixWorld),K.matrix.invert(),K.matrix.multiply(et.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(et.projectionMatrix),K.projectionMatrixInverse.copy(et.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=cl*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return z},this.getFoveation=function(){if(!(u===null&&p===null))return l},this.setFoveation=function(K){l=K,u!==null&&(u.fixedFoveation=K),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=K)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(z)},this.getCameraTexture=function(K){return f[K]};let se=null;function Kt(K,et){if(h=et.getViewerPose(c||r),m=et,h!==null){let xt=h.views;p!==null&&(t.setRenderTargetFramebuffer(y,p.framebuffer),t.setRenderTarget(y));let Bt=!1;xt.length!==z.cameras.length&&(z.cameras.length=0,Bt=!0);for(let It=0;It<xt.length;It++){let ae=xt[It],ge=null;if(p!==null)ge=p.getViewport(ae);else{let Ce=d.getViewSubImage(u,ae);ge=Ce.viewport,It===0&&(t.setRenderTargetTextures(y,Ce.colorTexture,Ce.depthStencilTexture),t.setRenderTarget(y))}let kt=F[It];kt===void 0&&(kt=new Ln,kt.layers.enable(It),kt.viewport=new Xe,F[It]=kt),kt.matrix.fromArray(ae.transform.matrix),kt.matrix.decompose(kt.position,kt.quaternion,kt.scale),kt.projectionMatrix.fromArray(ae.projectionMatrix),kt.projectionMatrixInverse.copy(kt.projectionMatrix).invert(),kt.viewport.set(ge.x,ge.y,ge.width,ge.height),It===0&&(z.matrix.copy(kt.matrix),z.matrix.decompose(z.position,z.quaternion,z.scale)),Bt===!0&&z.cameras.push(kt)}let yt=s.enabledFeatures;if(yt&&yt.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&S){d=i.getBinding();let It=d.getDepthInformation(xt[0]);It&&It.isValid&&It.texture&&g.init(It,s.renderState)}if(yt&&yt.includes("camera-access")&&S){t.state.unbindTexture(),d=i.getBinding();for(let It=0;It<xt.length;It++){let ae=xt[It].camera;if(ae){let ge=f[ae];ge||(ge=new su,f[ae]=ge);let kt=d.getCameraImage(ae);ge.sourceTexture=kt}}}}for(let xt=0;xt<T.length;xt++){let Bt=E[xt],yt=T[xt];Bt!==null&&yt!==void 0&&yt.update(Bt,et,c||r)}se&&se(K,et),et.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:et}),m=null}let re=new IE;re.setAnimationLoop(Kt),this.setAnimationLoop=function(K){se=K},this.dispose=function(){}}},kL=new Fe,GE=new Vt;GE.set(-1,0,0,0,1,0,0,0,1);function XL(e,t){function n(g,f){g.matrixAutoUpdate===!0&&g.updateMatrix(),f.value.copy(g.matrix)}function i(g,f){f.color.getRGB(g.fogColor.value,Xv(e)),f.isFog?(g.fogNear.value=f.near,g.fogFar.value=f.far):f.isFogExp2&&(g.fogDensity.value=f.density)}function s(g,f,v,b,y){f.isNodeMaterial?f.uniformsNeedUpdate=!1:f.isMeshBasicMaterial?a(g,f):f.isMeshLambertMaterial?(a(g,f),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)):f.isMeshToonMaterial?(a(g,f),d(g,f)):f.isMeshPhongMaterial?(a(g,f),h(g,f),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)):f.isMeshStandardMaterial?(a(g,f),u(g,f),f.isMeshPhysicalMaterial&&p(g,f,y)):f.isMeshMatcapMaterial?(a(g,f),m(g,f)):f.isMeshDepthMaterial?a(g,f):f.isMeshDistanceMaterial?(a(g,f),S(g,f)):f.isMeshNormalMaterial?a(g,f):f.isLineBasicMaterial?(r(g,f),f.isLineDashedMaterial&&o(g,f)):f.isPointsMaterial?l(g,f,v,b):f.isSpriteMaterial?c(g,f):f.isShadowMaterial?(g.color.value.copy(f.color),g.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function a(g,f){g.opacity.value=f.opacity,f.color&&g.diffuse.value.copy(f.color),f.emissive&&g.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(g.map.value=f.map,n(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,n(f.alphaMap,g.alphaMapTransform)),f.bumpMap&&(g.bumpMap.value=f.bumpMap,n(f.bumpMap,g.bumpMapTransform),g.bumpScale.value=f.bumpScale,f.side===qn&&(g.bumpScale.value*=-1)),f.normalMap&&(g.normalMap.value=f.normalMap,n(f.normalMap,g.normalMapTransform),g.normalScale.value.copy(f.normalScale),f.side===qn&&g.normalScale.value.negate()),f.displacementMap&&(g.displacementMap.value=f.displacementMap,n(f.displacementMap,g.displacementMapTransform),g.displacementScale.value=f.displacementScale,g.displacementBias.value=f.displacementBias),f.emissiveMap&&(g.emissiveMap.value=f.emissiveMap,n(f.emissiveMap,g.emissiveMapTransform)),f.specularMap&&(g.specularMap.value=f.specularMap,n(f.specularMap,g.specularMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest);let v=t.get(f),b=v.envMap,y=v.envMapRotation;b&&(g.envMap.value=b,g.envMapRotation.value.setFromMatrix4(kL.makeRotationFromEuler(y)).transpose(),b.isCubeTexture&&b.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(GE),g.reflectivity.value=f.reflectivity,g.ior.value=f.ior,g.refractionRatio.value=f.refractionRatio),f.lightMap&&(g.lightMap.value=f.lightMap,g.lightMapIntensity.value=f.lightMapIntensity,n(f.lightMap,g.lightMapTransform)),f.aoMap&&(g.aoMap.value=f.aoMap,g.aoMapIntensity.value=f.aoMapIntensity,n(f.aoMap,g.aoMapTransform))}function r(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,f.map&&(g.map.value=f.map,n(f.map,g.mapTransform))}function o(g,f){g.dashSize.value=f.dashSize,g.totalSize.value=f.dashSize+f.gapSize,g.scale.value=f.scale}function l(g,f,v,b){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.size.value=f.size*v,g.scale.value=b*.5,f.map&&(g.map.value=f.map,n(f.map,g.uvTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,n(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function c(g,f){g.diffuse.value.copy(f.color),g.opacity.value=f.opacity,g.rotation.value=f.rotation,f.map&&(g.map.value=f.map,n(f.map,g.mapTransform)),f.alphaMap&&(g.alphaMap.value=f.alphaMap,n(f.alphaMap,g.alphaMapTransform)),f.alphaTest>0&&(g.alphaTest.value=f.alphaTest)}function h(g,f){g.specular.value.copy(f.specular),g.shininess.value=Math.max(f.shininess,1e-4)}function d(g,f){f.gradientMap&&(g.gradientMap.value=f.gradientMap)}function u(g,f){g.metalness.value=f.metalness,f.metalnessMap&&(g.metalnessMap.value=f.metalnessMap,n(f.metalnessMap,g.metalnessMapTransform)),g.roughness.value=f.roughness,f.roughnessMap&&(g.roughnessMap.value=f.roughnessMap,n(f.roughnessMap,g.roughnessMapTransform)),f.envMap&&(g.envMapIntensity.value=f.envMapIntensity)}function p(g,f,v){g.ior.value=f.ior,f.sheen>0&&(g.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),g.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(g.sheenColorMap.value=f.sheenColorMap,n(f.sheenColorMap,g.sheenColorMapTransform)),f.sheenRoughnessMap&&(g.sheenRoughnessMap.value=f.sheenRoughnessMap,n(f.sheenRoughnessMap,g.sheenRoughnessMapTransform))),f.clearcoat>0&&(g.clearcoat.value=f.clearcoat,g.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(g.clearcoatMap.value=f.clearcoatMap,n(f.clearcoatMap,g.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,n(f.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(g.clearcoatNormalMap.value=f.clearcoatNormalMap,n(f.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===qn&&g.clearcoatNormalScale.value.negate())),f.dispersion>0&&(g.dispersion.value=f.dispersion),f.retroreflectivity>0&&(g.retroreflectivity.value=f.retroreflectivity),f.iridescence>0&&(g.iridescence.value=f.iridescence,g.iridescenceIOR.value=f.iridescenceIOR,g.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(g.iridescenceMap.value=f.iridescenceMap,n(f.iridescenceMap,g.iridescenceMapTransform)),f.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=f.iridescenceThicknessMap,n(f.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),f.transmission>0&&(g.transmission.value=f.transmission,g.transmissionSamplerMap.value=v.texture,g.transmissionSamplerSize.value.set(v.width,v.height),f.transmissionMap&&(g.transmissionMap.value=f.transmissionMap,n(f.transmissionMap,g.transmissionMapTransform)),g.thickness.value=f.thickness,f.thicknessMap&&(g.thicknessMap.value=f.thicknessMap,n(f.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=f.attenuationDistance,g.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(g.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(g.anisotropyMap.value=f.anisotropyMap,n(f.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=f.specularIntensity,g.specularColor.value.copy(f.specularColor),f.specularColorMap&&(g.specularColorMap.value=f.specularColorMap,n(f.specularColorMap,g.specularColorMapTransform)),f.specularIntensityMap&&(g.specularIntensityMap.value=f.specularIntensityMap,n(f.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,f){f.matcap&&(g.matcap.value=f.matcap)}function S(g,f){let v=t.get(f).light;g.referencePosition.value.setFromMatrixPosition(v.matrixWorld),g.nearDistance.value=v.shadow.camera.near,g.farDistance.value=v.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function WL(e,t,n,i){let s={},a={},r=[],o=e.getParameter(e.MAX_UNIFORM_BUFFER_BINDINGS);function l(y,T){let E=T.program;i.uniformBlockBinding(y,E)}function c(y,T){let E=s[y.id];E===void 0&&(g(y),E=h(y),s[y.id]=E,y.addEventListener("dispose",v));let w=T.program;i.updateUBOMapping(y,w);let _=t.render.frame;a[y.id]!==_&&(u(y),a[y.id]=_)}function h(y){let T=d();y.__bindingPointIndex=T;let E=e.createBuffer(),w=y.__size,_=y.usage;return e.bindBuffer(e.UNIFORM_BUFFER,E),e.bufferData(e.UNIFORM_BUFFER,w,_),e.bindBuffer(e.UNIFORM_BUFFER,null),e.bindBufferBase(e.UNIFORM_BUFFER,T,E),E}function d(){for(let y=0;y<o;y++)if(r.indexOf(y)===-1)return r.push(y),y;return Pt("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(y){let T=s[y.id],E=y.uniforms,w=y.__cache;e.bindBuffer(e.UNIFORM_BUFFER,T);for(let _=0,A=E.length;_<A;_++){let R=E[_];if(Array.isArray(R))for(let O=0,F=R.length;O<F;O++)p(R[O],_,O,w);else p(R,_,0,w)}e.bindBuffer(e.UNIFORM_BUFFER,null)}function p(y,T,E,w){if(S(y,T,E,w)===!0){let _=y.__offset,A=y.value;if(Array.isArray(A)){let R=0;for(let O=0;O<A.length;O++){let F=A[O],z=f(F);m(F,y.__data,R),typeof F!="number"&&typeof F!="boolean"&&!F.isMatrix3&&!ArrayBuffer.isView(F)&&(R+=z.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(A,y.__data,0);e.bufferSubData(e.UNIFORM_BUFFER,_,y.__data)}}function m(y,T,E){typeof y=="number"||typeof y=="boolean"?T[0]=y:y.isMatrix3?(T[0]=y.elements[0],T[1]=y.elements[1],T[2]=y.elements[2],T[3]=0,T[4]=y.elements[3],T[5]=y.elements[4],T[6]=y.elements[5],T[7]=0,T[8]=y.elements[6],T[9]=y.elements[7],T[10]=y.elements[8],T[11]=0):ArrayBuffer.isView(y)?T.set(new y.constructor(y.buffer,y.byteOffset,T.length)):y.toArray(T,E)}function S(y,T,E,w){let _=y.value,A=T+"_"+E;if(w[A]===void 0)return typeof _=="number"||typeof _=="boolean"?w[A]=_:ArrayBuffer.isView(_)?w[A]=_.slice():w[A]=_.clone(),!0;{let R=w[A];if(typeof _=="number"||typeof _=="boolean"){if(R!==_)return w[A]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(R.equals(_)===!1)return R.copy(_),!0}}return!1}function g(y){let T=y.uniforms,E=0,w=16;for(let A=0,R=T.length;A<R;A++){let O=Array.isArray(T[A])?T[A]:[T[A]];for(let F=0,z=O.length;F<z;F++){let I=O[F],X=Array.isArray(I.value)?I.value:[I.value];for(let Y=0,j=X.length;Y<j;Y++){let at=X[Y],Z=f(at),nt=E%w,st=nt%Z.boundary,Dt=nt+st;E+=st,Dt!==0&&w-Dt<Z.storage&&(E+=w-Dt),I.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=E,E+=Z.storage}}}let _=E%w;return _>0&&(E+=w-_),y.__size=E,y.__cache={},this}function f(y){let T={boundary:0,storage:0};return typeof y=="number"||typeof y=="boolean"?(T.boundary=4,T.storage=4):y.isVector2?(T.boundary=8,T.storage=8):y.isVector3||y.isColor?(T.boundary=16,T.storage=12):y.isVector4?(T.boundary=16,T.storage=16):y.isMatrix3?(T.boundary=48,T.storage=48):y.isMatrix4?(T.boundary=64,T.storage=64):y.isTexture?Ot("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(y)?(T.boundary=16,T.storage=y.byteLength):Ot("WebGLRenderer: Unsupported uniform value type.",y),T}function v(y){let T=y.target;T.removeEventListener("dispose",v);let E=r.indexOf(T.__bindingPointIndex);r.splice(E,1),e.deleteBuffer(s[T.id]),delete s[T.id],delete a[T.id]}function b(){for(let y in s)e.deleteBuffer(s[y]);r=[],s={},a={}}return{bind:l,update:c,dispose:b}}var qL=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),As=null;function YL(){return As===null&&(As=new hf(qL,16,16,er,$i),As.name="DFG_LUT",As.minFilter=Mn,As.magFilter=Mn,As.wrapS=ys,As.wrapT=ys,As.generateMipmaps=!1,As.needsUpdate=!0),As}var Sp=class{constructor(t={}){let{canvas:n=sE(),context:i=null,depth:s=!0,stencil:a=!1,alpha:r=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:p=Si}=t;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=r;let S=p,g=new Set([zf,Bf,Pf]),f=new Set([Si,Ji,Sl,bl,If,Of]),v=new Uint32Array(4),b=new Int32Array(4),y=new P,T=null,E=null,w=[],_=[],A=null;this.domElement=n,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Ki,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let R=this,O=!1,F=null,z=null,I=null,X=null;this._outputColorSpace=bn;let Y=0,j=0,at=null,Z=-1,nt=null,st=new Xe,Dt=new Xe,At=null,se=new Wt(0),Kt=0,re=n.width,K=n.height,et=1,xt=null,Bt=null,yt=new Xe(0,0,re,K),Ft=new Xe(0,0,re,K),Ve=!1,It=new tu,ae=!1,ge=!1,kt=new Fe,Ce=new P,Ie=new Xe,En={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Oe=!1;function Pe(){return at===null?et:1}let U=i;function je(M,D){return n.getContext(M,D)}let Jt,C,x,B,k,q,rt,ot,J,$,ct,wt,ut,lt,Ct,Lt,Gt,L,ht,Q,ft,vt,it;try{let M={alpha:!0,depth:s,stencil:a,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in n&&n.setAttribute("data-engine",`three.js r${"186"}`),n.addEventListener("webglcontextlost",de,!1),n.addEventListener("webglcontextrestored",le,!1),n.addEventListener("webglcontextcreationerror",ni,!1),U===null){let D="webgl2";if(U=je(D,M),U===null)throw je(D)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Nt()}catch(M){throw n.removeEventListener("webglcontextlost",de,!1),n.removeEventListener("webglcontextrestored",le,!1),n.removeEventListener("webglcontextcreationerror",ni,!1),Pt("WebGLRenderer: "+M.message),M}function Nt(){Jt=new tD(U),Jt.init(),ft=new GL(U,Jt),C=new XN(U,Jt,t,ft),x=new zL(U,Jt),C.reversedDepthBuffer&&u&&x.buffers.depth.setReversed(!0),z=U.createFramebuffer(),I=U.createFramebuffer(),X=U.createFramebuffer(),B=new iD(U),k=new EL,q=new FL(U,Jt,x,k,C,ft,B),rt=new $N(R),ot=new a2(U),vt=new VN(U,ot),J=new eD(U,ot,B,vt),$=new aD(U,J,ot,vt,B),L=new sD(U,C,q),Ct=new WN(k),ct=new ML(R,rt,Jt,C,vt,Ct),wt=new XL(R,k),ut=new wL,lt=new LL(Jt),Gt=new HN(R,rt,x,$,m,l),Lt=new BL(R,$,C),it=new WL(U,B,C,x),ht=new kN(U,Jt,B),Q=new nD(U,Jt,B),B.programs=ct.programs,R.capabilities=C,R.extensions=Jt,R.properties=k,R.renderLists=ut,R.shadowMap=Lt,R.state=x,R.info=B}S!==Si&&(A=new oD(S,n.width,n.height,o,s,a));let Mt=new l_(R,U);this.xr=Mt,this.getContext=function(){return U},this.getContextAttributes=function(){return U.getContextAttributes()},this.forceContextLoss=function(){let M=Jt.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){let M=Jt.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return et},this.setPixelRatio=function(M){M!==void 0&&(et=M,this.setSize(re,K,!1))},this.getSize=function(M){return M.set(re,K)},this.setSize=function(M,D,W=!0){if(Mt.isPresenting){Ot("WebGLRenderer: Can't change size while VR device is presenting.");return}re=M,K=D,n.width=Math.floor(M*et),n.height=Math.floor(D*et),W===!0&&(n.style.width=M+"px",n.style.height=D+"px"),A!==null&&A.setSize(n.width,n.height),this.setViewport(0,0,M,D)},this.getDrawingBufferSize=function(M){return M.set(re*et,K*et).floor()},this.setDrawingBufferSize=function(M,D,W){re=M,K=D,et=W,n.width=Math.floor(M*W),n.height=Math.floor(D*W),this.setViewport(0,0,M,D)},this.setEffects=function(M){if(S===Si){Pt("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let D=0;D<M.length;D++)if(M[D].isOutputPass===!0){Ot("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}A.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(st)},this.getViewport=function(M){return M.copy(yt)},this.setViewport=function(M,D,W,G){M.isVector4?yt.set(M.x,M.y,M.z,M.w):yt.set(M,D,W,G),x.viewport(st.copy(yt).multiplyScalar(et).round())},this.getScissor=function(M){return M.copy(Ft)},this.setScissor=function(M,D,W,G){M.isVector4?Ft.set(M.x,M.y,M.z,M.w):Ft.set(M,D,W,G),x.scissor(Dt.copy(Ft).multiplyScalar(et).round())},this.getScissorTest=function(){return Ve},this.setScissorTest=function(M){x.setScissorTest(Ve=M)},this.setOpaqueSort=function(M){xt=M},this.setTransparentSort=function(M){Bt=M},this.getClearColor=function(M){return M.copy(Gt.getClearColor())},this.setClearColor=function(){Gt.setClearColor(...arguments)},this.getClearAlpha=function(){return Gt.getClearAlpha()},this.setClearAlpha=function(){Gt.setClearAlpha(...arguments)},this.clear=function(M=!0,D=!0,W=!0){let G=0;if(M){let H=!1;if(at!==null){let _t=at.texture.format;H=g.has(_t)}if(H){let _t=at.texture.type,bt=f.has(_t),gt=Gt.getClearColor(),Et=Gt.getClearAlpha(),Rt=gt.r,qt=gt.g,Qt=gt.b;bt?(v[0]=Rt,v[1]=qt,v[2]=Qt,v[3]=Et,U.clearBufferuiv(U.COLOR,0,v)):(b[0]=Rt,b[1]=qt,b[2]=Qt,b[3]=Et,U.clearBufferiv(U.COLOR,0,b))}else G|=U.COLOR_BUFFER_BIT}D&&(G|=U.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(G|=U.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),G!==0&&U.clear(G)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),F=M},this.dispose=function(){n.removeEventListener("webglcontextlost",de,!1),n.removeEventListener("webglcontextrestored",le,!1),n.removeEventListener("webglcontextcreationerror",ni,!1),Gt.dispose(),ut.dispose(),lt.dispose(),k.dispose(),rt.dispose(),$.dispose(),vt.dispose(),it.dispose(),ct.dispose(),Mt.dispose(),Mt.removeEventListener("sessionstart",Au),Mt.removeEventListener("sessionend",Gr),Mi.stop()};function de(M){M.preventDefault(),Yc("WebGLRenderer: Context Lost."),O=!0}function le(){Yc("WebGLRenderer: Context Restored."),O=!1;let M=B.autoReset,D=Lt.enabled,W=Lt.autoUpdate,G=Lt.needsUpdate,H=Lt.type;Nt(),B.autoReset=M,Lt.enabled=D,Lt.autoUpdate=W,Lt.needsUpdate=G,Lt.type=H}function ni(M){Pt("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function bi(M){let D=M.target;D.removeEventListener("dispose",bi),Cp(D)}function Cp(M){Rp(M),k.remove(M)}function Rp(M){let D=k.get(M).programs;D!==void 0&&(D.forEach(function(W){ct.releaseProgram(W)}),M.isShaderMaterial&&ct.releaseShaderCache(M))}this.renderBufferDirect=function(M,D,W,G,H,_t){D===null&&(D=En);let bt=H.isMesh&&H.matrixWorld.determinantAffine()<0,gt=mT(M,D,W,G,H);x.setMaterial(G,bt);let Et=W.index,Rt=1;if(G.wireframe===!0){if(Et=J.getWireframeAttribute(W),Et===void 0)return;Rt=2}let qt=W.drawRange,Qt=W.attributes.position,Tt=qt.start*Rt,fe=(qt.start+qt.count)*Rt;_t!==null&&(Tt=Math.max(Tt,_t.start*Rt),fe=Math.min(fe,(_t.start+_t.count)*Rt)),Et!==null?(Tt=Math.max(Tt,0),fe=Math.min(fe,Et.count)):Qt!=null&&(Tt=Math.max(Tt,0),fe=Math.min(fe,Qt.count));let Ke=fe-Tt;if(Ke<0||Ke===1/0)return;vt.setup(H,G,gt,W,Et);let Be,Te=ht;if(Et!==null&&(Be=ot.get(Et),Te=Q,Te.setIndex(Be)),H.isMesh)G.wireframe===!0?(x.setLineWidth(G.wireframeLinewidth*Pe()),Te.setMode(U.LINES)):Te.setMode(U.TRIANGLES);else if(H.isLine){let wn=G.linewidth;wn===void 0&&(wn=1),x.setLineWidth(wn*Pe()),H.isLineSegments?Te.setMode(U.LINES):H.isLineLoop?Te.setMode(U.LINE_LOOP):Te.setMode(U.LINE_STRIP)}else H.isPoints?Te.setMode(U.POINTS):H.isSprite&&Te.setMode(U.TRIANGLES);if(H.isBatchedMesh)if(Jt.get("WEBGL_multi_draw"))Te.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else{let wn=H._multiDrawStarts,St=H._multiDrawCounts,On=H._multiDrawCount,oe=Et?ot.get(Et).bytesPerElement:1,Ei=k.get(G).currentProgram.getUniforms();for(let es=0;es<On;es++)Ei.setValue(U,"_gl_DrawID",es),Te.render(wn[es]/oe,St[es])}else if(H.isInstancedMesh)Te.renderInstances(Tt,Ke,H.count);else if(W.isInstancedBufferGeometry){let wn=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,St=Math.min(W.instanceCount,wn);Te.renderInstances(Tt,Ke,St)}else Te.render(Tt,Ke)};function wu(M,D,W,G){F!==null&&M.isNodeMaterial&&F.setObject(G,M),ae===!0&&Ct.setState(M,W,!1),M.transparent===!0&&M.side===Es&&M.forceSinglePass===!1?(M.side=qn,M.needsUpdate=!0,ve(M,D,G),M.side=Ja,M.needsUpdate=!0,ve(M,D,G),M.side=Es):ve(M,D,G)}this.compile=function(M,D,W=null){W===null&&(W=M),F!==null&&F.renderStart(M,D,W),E=lt.get(W),E.init(D),_.push(E),W.traverseVisible(function(H){H.isLight&&H.layers.test(D.layers)&&(E.pushLight(H),H.castShadow&&E.pushShadow(H))}),M!==W&&M.traverseVisible(function(H){H.isLight&&H.layers.test(D.layers)&&(E.pushLight(H),H.castShadow&&E.pushShadow(H))}),E.setupLights(),F!==null&&F.updateLights(E.state.lightsArray),ge=this.localClippingEnabled,ae=Ct.init(this.clippingPlanes,ge),ae===!0&&Ct.setGlobalState(this.clippingPlanes,D),F!==null&&Lt.render(E.state.shadowsArray,W,D);let G=new Set;return M.traverse(function(H){if(!(H.isMesh||H.isPoints||H.isLine||H.isSprite))return;let _t=H.material;if(_t)if(Array.isArray(_t))for(let bt=0;bt<_t.length;bt++){let gt=_t[bt];wu(gt,W,D,H),G.add(gt)}else wu(_t,W,D,H),G.add(_t)}),E=_.pop(),F!==null&&F.renderEnd(),G},this.compileAsync=function(M,D,W=null){let G=this.compile(M,D,W);return new Promise(H=>{function _t(){if(G.forEach(function(bt){let Et=k.get(bt).currentProgram;(Et===void 0||Et.isReady())&&G.delete(bt)}),G.size===0){H(M);return}setTimeout(_t,10)}Jt.get("KHR_parallel_shader_compile")!==null?_t():setTimeout(_t,10)})};let Fr=null;function Np(M){Fr&&Fr(M)}function Au(){Mi.stop()}function Gr(){Mi.start()}let Mi=new IE;Mi.setAnimationLoop(Np),typeof self<"u"&&Mi.setContext(self),this.setAnimationLoop=function(M){Fr=M,Mt.setAnimationLoop(M),M===null?Mi.stop():Mi.start()},Mt.addEventListener("sessionstart",Au),Mt.addEventListener("sessionend",Gr),this.render=function(M,D){if(D!==void 0&&D.isCamera!==!0){Pt("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(O===!0)return;F!==null&&F.renderStart(M,D);let W=Mt.enabled===!0&&Mt.isPresenting===!0,G=A!==null&&(at===null||W)&&A.begin(R,at);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),D.parent===null&&D.matrixWorldAutoUpdate===!0&&D.updateMatrixWorld(),Mt.enabled===!0&&Mt.isPresenting===!0&&(A===null||A.isCompositing()===!1)&&(Mt.cameraAutoUpdate===!0&&Mt.updateCamera(D),D=Mt.getCamera()),M.isScene===!0&&M.onBeforeRender(R,M,D,at),E=lt.get(M,_.length),E.init(D),E.state.textureUnits=q.getTextureUnits(),_.push(E),kt.multiplyMatrices(D.projectionMatrix,D.matrixWorldInverse),It.setFromProjectionMatrix(kt,Zi,D.reversedDepth),ge=this.localClippingEnabled,ae=Ct.init(this.clippingPlanes,ge),T=ut.get(M,w.length),T.init(),w.push(T),Mt.enabled===!0&&Mt.isPresenting===!0){let bt=R.xr.getDepthSensingMesh();bt!==null&&ts(bt,D,-1/0,R.sortObjects)}ts(M,D,0,R.sortObjects),T.finish(),F!==null&&F.updateLights(E.state.lightsArray),R.sortObjects===!0&&T.sort(xt,Bt),Oe=Mt.enabled===!1||Mt.isPresenting===!1||Mt.hasDepthSensing()===!1,Oe&&Gt.addToRenderList(T,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),ae===!0&&Ct.beginShadows();let H=E.state.shadowsArray;if(Lt.render(H,M,D),ae===!0&&Ct.endShadows(),(G&&A.hasRenderPass())===!1){let bt=T.opaque,gt=T.transmissive;if(E.setupLights(),D.isArrayCamera){let Et=D.cameras;if(gt.length>0)for(let Rt=0,qt=Et.length;Rt<qt;Rt++){let Qt=Et[Rt];N(bt,gt,M,Qt)}Oe&&Gt.render(M);for(let Rt=0,qt=Et.length;Rt<qt;Rt++){let Qt=Et[Rt];Rl(T,M,Qt,Qt.viewport)}}else gt.length>0&&N(bt,gt,M,D),Oe&&Gt.render(M),Rl(T,M,D)}at!==null&&j===0&&(q.updateMultisampleRenderTarget(at),q.updateRenderTargetMipmap(at)),G&&A.end(R),M.isScene===!0&&M.onAfterRender(R,M,D),vt.resetDefaultState(),Z=-1,nt=null,_.pop(),_.length>0?(E=_[_.length-1],q.setTextureUnits(E.state.textureUnits),ae===!0&&Ct.setGlobalState(R.clippingPlanes,E.state.camera)):E=null,w.pop(),w.length>0?T=w[w.length-1]:T=null,F!==null&&F.renderEnd()};function ts(M,D,W,G){if(M.visible===!1)return;if(M.layers.test(D.layers)){if(M.isGroup)W=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(D);else if(M.isLightProbeGrid)E.pushLightProbeGrid(M);else if(M.isLight)E.pushLight(M),M.castShadow&&E.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||M.intersectsFrustum(It)){G&&Ie.setFromMatrixPosition(M.matrixWorld).applyMatrix4(kt);let bt=$.update(M),gt=M.material;gt.visible&&T.push(M,bt,gt,W,Ie.z,null,D)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||M.intersectsFrustum(It))){let bt=$.update(M),gt=M.material;if(G&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),Ie.copy(M.boundingSphere.center)):(bt.boundingSphere===null&&bt.computeBoundingSphere(),Ie.copy(bt.boundingSphere.center)),Ie.applyMatrix4(M.matrixWorld).applyMatrix4(kt)),Array.isArray(gt)){let Et=bt.groups;for(let Rt=0,qt=Et.length;Rt<qt;Rt++){let Qt=Et[Rt],Tt=gt[Qt.materialIndex];Tt&&Tt.visible&&T.push(M,bt,Tt,W,Ie.z,Qt,D)}}else gt.visible&&T.push(M,bt,gt,W,Ie.z,null,D)}}let _t=M.children;for(let bt=0,gt=_t.length;bt<gt;bt++)ts(_t[bt],D,W,G)}function Rl(M,D,W,G){let{opaque:H,transmissive:_t,transparent:bt}=M;E.setupLightsView(W),ae===!0&&Ct.setGlobalState(R.clippingPlanes,W),G&&x.viewport(st.copy(G)),H.length>0&&mt(H,D,W),_t.length>0&&mt(_t,D,W),bt.length>0&&mt(bt,D,W),x.buffers.depth.setTest(!0),x.buffers.depth.setMask(!0),x.buffers.color.setMask(!0),x.setPolygonOffset(!1)}function N(M,D,W,G){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(E.state.transmissionRenderTarget[G.id]===void 0){let Tt=Jt.has("EXT_color_buffer_half_float")||Jt.has("EXT_color_buffer_float");E.state.transmissionRenderTarget[G.id]=new ti(1,1,{generateMipmaps:!0,type:Tt?$i:Si,minFilter:$a,samples:Math.max(4,C.samples),stencilBuffer:a,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ie.workingColorSpace})}let _t=E.state.transmissionRenderTarget[G.id],bt=G.viewport||st;_t.setSize(bt.z*R.transmissionResolutionScale,bt.w*R.transmissionResolutionScale);let gt=R.getRenderTarget(),Et=R.getActiveCubeFace(),Rt=R.getActiveMipmapLevel();R.setRenderTarget(_t),R.getClearColor(se),Kt=R.getClearAlpha(),Kt<1&&R.setClearColor(16777215,.5),R.clear(),Oe&&Gt.render(W);let qt=R.toneMapping;R.toneMapping=Ki;let Qt=G.viewport;if(G.viewport!==void 0&&(G.viewport=void 0),E.setupLightsView(G),ae===!0&&Ct.setGlobalState(R.clippingPlanes,G),mt(M,W,G),q.updateMultisampleRenderTarget(_t),q.updateRenderTargetMipmap(_t),Jt.has("WEBGL_multisampled_render_to_texture")===!1){let Tt=!1;for(let fe=0,Ke=D.length;fe<Ke;fe++){let Be=D[fe],{object:Te,geometry:wn,material:St,group:On}=Be;if(St.side===Es&&Te.layers.test(G.layers)){let oe=St.side;St.side=qn,St.needsUpdate=!0,ee(Te,W,G,wn,St,On),St.side=oe,St.needsUpdate=!0,Tt=!0}}Tt===!0&&(q.updateMultisampleRenderTarget(_t),q.updateRenderTargetMipmap(_t))}R.setRenderTarget(gt,Et,Rt),R.setClearColor(se,Kt),Qt!==void 0&&(G.viewport=Qt),R.toneMapping=qt}function mt(M,D,W){let G=D.isScene===!0?D.overrideMaterial:null;for(let H=0,_t=M.length;H<_t;H++){let bt=M[H],{object:gt,geometry:Et,group:Rt}=bt,qt=bt.material;qt.allowOverride===!0&&G!==null&&(qt=G),gt.layers.test(W.layers)&&ee(gt,D,W,Et,qt,Rt)}}function ee(M,D,W,G,H,_t){F!==null&&H.isNodeMaterial&&F.setObject(M,H),M.onBeforeRender(R,D,W,G,H,_t),M.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),H.onBeforeRender(R,D,W,G,M,_t),H.transparent===!0&&H.side===Es&&H.forceSinglePass===!1?(H.side=qn,H.needsUpdate=!0,R.renderBufferDirect(W,D,G,H,M,_t),H.side=Ja,H.needsUpdate=!0,R.renderBufferDirect(W,D,G,H,M,_t),H.side=Es):R.renderBufferDirect(W,D,G,H,M,_t),M.onAfterRender(R,D,W,G,H,_t)}function ve(M,D,W){D.isScene!==!0&&(D=En);let G=k.get(M),H=E.state.lights,_t=E.state.shadowsArray,bt=H.state.version,gt=ct.getParameters(M,H.state,_t,D,W,E.state.lightProbeGridArray),Et=ct.getProgramCacheKey(gt),Rt=G.programs;G.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?D.environment:null,G.fog=D.fog;let qt=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;G.envMap=rt.get(M.envMap||G.environment,qt),G.envMapRotation=G.environment!==null&&M.envMap===null?D.environmentRotation:M.envMapRotation,Rt===void 0&&(M.addEventListener("dispose",bi),Rt=new Map,G.programs=Rt);let Qt=Rt.get(Et);if(Qt!==void 0){if(G.currentProgram===Qt&&G.lightsStateVersion===bt)return Bi(M,gt),Qt}else gt.uniforms=ct.getUniforms(M),F!==null&&M.isNodeMaterial&&F.build(M,W,gt),M.onBeforeCompile(gt,R),Qt=ct.acquireProgram(gt,Et),Rt.set(Et,Qt),G.uniforms=gt.uniforms;let Tt=G.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Tt.clippingPlanes=Ct.uniform),Bi(M,gt),G.needsLights=vT(M),G.lightsStateVersion=bt,G.needsLights&&(Tt.ambientLightColor.value=H.state.ambient,Tt.lightProbe.value=H.state.probe,Tt.sunLights.value=H.state.sun,Tt.sunLightShadows.value=H.state.sunShadow,Tt.directionalLights.value=H.state.directional,Tt.directionalLightShadows.value=H.state.directionalShadow,Tt.spotLights.value=H.state.spot,Tt.spotLightShadows.value=H.state.spotShadow,Tt.rectAreaLights.value=H.state.rectArea,Tt.ltc_1.value=H.state.rectAreaLTC1,Tt.ltc_2.value=H.state.rectAreaLTC2,Tt.pointLights.value=H.state.point,Tt.pointLightShadows.value=H.state.pointShadow,Tt.hemisphereLights.value=H.state.hemi,Tt.sunShadowMatrix.value=H.state.sunShadowMatrix,Tt.sunShadowCascade.value=H.state.sunShadowCascade,Tt.directionalShadowMatrix.value=H.state.directionalShadowMatrix,Tt.spotLightMatrix.value=H.state.spotLightMatrix,Tt.spotLightMap.value=H.state.spotLightMap,Tt.pointShadowMatrix.value=H.state.pointShadowMatrix),G.lightProbeGrid=E.state.lightProbeGridArray.length>0,G.currentProgram=Qt,G.uniformsList=null,Qt}function Tn(M){if(M.uniformsList===null){let D=M.currentProgram.getUniforms();M.uniformsList=Tl.seqWithValue(D.seq,M.uniforms)}return M.uniformsList}function Bi(M,D){let W=k.get(M);W.outputColorSpace=D.outputColorSpace,W.batching=D.batching,W.batchingColor=D.batchingColor,W.instancing=D.instancing,W.instancingColor=D.instancingColor,W.instancingMorph=D.instancingMorph,W.skinning=D.skinning,W.morphTargets=D.morphTargets,W.morphNormals=D.morphNormals,W.morphColors=D.morphColors,W.morphTargetsCount=D.morphTargetsCount,W.numClippingPlanes=D.numClippingPlanes,W.numIntersection=D.numClipIntersection,W.vertexAlphas=D.vertexAlphas,W.vertexTangents=D.vertexTangents,W.toneMapping=D.toneMapping}function Dp(M,D){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;y.setFromMatrixPosition(D.matrixWorld);for(let W=0,G=M.length;W<G;W++){let H=M[W];if(H.texture!==null&&H.boundingBox.containsPoint(y))return H}return null}function mT(M,D,W,G,H){D.isScene!==!0&&(D=En),q.resetTextureUnits();let _t=D.fog,bt=G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial?D.environment:null,gt=at===null?R.outputColorSpace:at.isXRRenderTarget===!0?at.texture.colorSpace:ie.workingColorSpace,Et=G.isMeshStandardMaterial||G.isMeshLambertMaterial&&!G.envMap||G.isMeshPhongMaterial&&!G.envMap,Rt=rt.get(G.envMap||bt,Et),qt=G.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Qt=!!W.attributes.tangent&&(!!G.normalMap||G.anisotropy>0),Tt=!!W.morphAttributes.position,fe=!!W.morphAttributes.normal,Ke=!!W.morphAttributes.color,Be=Ki;G.toneMapped&&(at===null||at.isXRRenderTarget===!0)&&(Be=R.toneMapping);let Te=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,wn=Te!==void 0?Te.length:0,St=k.get(G),On=E.state.lights;if(ae===!0&&(ge===!0||M!==nt)){let Re=M===nt&&G.id===Z;Ct.setState(G,M,Re)}let oe=!1;G.version===St.__version?(St.needsLights&&St.lightsStateVersion!==On.state.version||St.outputColorSpace!==gt||H.isBatchedMesh&&St.batching===!1||!H.isBatchedMesh&&St.batching===!0||H.isBatchedMesh&&St.batchingColor===!0&&H._colorsTexture===null||H.isBatchedMesh&&St.batchingColor===!1&&H._colorsTexture!==null||H.isInstancedMesh&&St.instancing===!1||!H.isInstancedMesh&&St.instancing===!0||H.isSkinnedMesh&&St.skinning===!1||!H.isSkinnedMesh&&St.skinning===!0||H.isInstancedMesh&&St.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&St.instancingColor===!1&&H.instanceColor!==null||H.isInstancedMesh&&St.instancingMorph===!0&&H.morphTexture===null||H.isInstancedMesh&&St.instancingMorph===!1&&H.morphTexture!==null||St.envMap!==Rt||G.fog===!0&&St.fog!==_t||St.numClippingPlanes!==void 0&&(St.numClippingPlanes!==Ct.numPlanes||St.numIntersection!==Ct.numIntersection)||St.vertexAlphas!==qt||St.vertexTangents!==Qt||St.morphTargets!==Tt||St.morphNormals!==fe||St.morphColors!==Ke||St.toneMapping!==Be||St.morphTargetsCount!==wn||!!St.lightProbeGrid!=E.state.lightProbeGridArray.length>0)&&(oe=!0):(oe=!0,St.__version=G.version);let Ei=St.currentProgram;oe===!0&&(Ei=ve(G,D,H),F&&G.isNodeMaterial&&F.onUpdateProgram(G,Ei,St));let es=!1,sa=!1,Hr=!1,Me=Ei.getUniforms(),Ye=St.uniforms;if(x.useProgram(Ei.program)&&(es=!0,sa=!0,Hr=!0),G.id!==Z&&(Z=G.id,sa=!0),St.needsLights){let Re=Dp(E.state.lightProbeGridArray,H);St.lightProbeGrid!==Re&&(St.lightProbeGrid=Re,sa=!0)}if(es||nt!==M){x.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),Me.setValue(U,"projectionMatrix",M.projectionMatrix),Me.setValue(U,"viewMatrix",M.matrixWorldInverse);let ra=Me.map.cameraPosition;ra!==void 0&&ra.setValue(U,Ce.setFromMatrixPosition(M.matrixWorld)),C.logarithmicDepthBuffer&&Me.setValue(U,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(G.isMeshPhongMaterial||G.isMeshToonMaterial||G.isMeshLambertMaterial||G.isMeshBasicMaterial||G.isMeshStandardMaterial||G.isShaderMaterial)&&Me.setValue(U,"isOrthographic",M.isOrthographicCamera===!0),nt!==M&&(nt=M,sa=!0,Hr=!0)}if(St.needsLights&&(On.state.sunShadowMap.length>0&&Me.setValue(U,"sunShadowMap",On.state.sunShadowMap,q),On.state.directionalShadowMap.length>0&&Me.setValue(U,"directionalShadowMap",On.state.directionalShadowMap,q),On.state.spotShadowMap.length>0&&Me.setValue(U,"spotShadowMap",On.state.spotShadowMap,q),On.state.pointShadowMap.length>0&&Me.setValue(U,"pointShadowMap",On.state.pointShadowMap,q)),H.isSkinnedMesh){Me.setOptional(U,H,"bindMatrix"),Me.setOptional(U,H,"bindMatrixInverse");let Re=H.skeleton;Re&&(Re.boneTexture===null&&Re.computeBoneTexture(),Me.setValue(U,"boneTexture",Re.boneTexture,q))}H.isBatchedMesh&&(Me.setOptional(U,H,"batchingTexture"),Me.setValue(U,"batchingTexture",H._matricesTexture,q),Me.setOptional(U,H,"batchingIdTexture"),Me.setValue(U,"batchingIdTexture",H._indirectTexture,q),Me.setOptional(U,H,"batchingColorTexture"),H._colorsTexture!==null&&Me.setValue(U,"batchingColorTexture",H._colorsTexture,q));let aa=W.morphAttributes;if((aa.position!==void 0||aa.normal!==void 0||aa.color!==void 0)&&L.update(H,W,Ei),(sa||St.receiveShadow!==H.receiveShadow)&&(St.receiveShadow=H.receiveShadow,Me.setValue(U,"receiveShadow",H.receiveShadow)),(G.isMeshStandardMaterial||G.isMeshLambertMaterial||G.isMeshPhongMaterial)&&G.envMap===null&&D.environment!==null&&(Ye.envMapIntensity.value=D.environmentIntensity),Ye.dfgLUT!==void 0&&(Ye.dfgLUT.value=YL()),sa){if(Me.setValue(U,"toneMappingExposure",R.toneMappingExposure),St.needsLights&&gT(Ye,Hr),_t&&G.fog===!0&&wt.refreshFogUniforms(Ye,_t),wt.refreshMaterialUniforms(Ye,G,et,K,E.state.transmissionRenderTarget[M.id]),St.needsLights&&St.lightProbeGrid){let Re=St.lightProbeGrid;Ye.probesSH.value=Re.texture,Ye.probesMin.value.copy(Re.boundingBox.min),Ye.probesMax.value.copy(Re.boundingBox.max),Ye.probesResolution.value.copy(Re.resolution)}Tl.upload(U,Tn(St),Ye,q)}if(G.isShaderMaterial&&G.uniformsNeedUpdate===!0&&(Tl.upload(U,Tn(St),Ye,q),G.uniformsNeedUpdate=!1),G.isSpriteMaterial&&Me.setValue(U,"center",H.center),Me.setValue(U,"modelViewMatrix",H.modelViewMatrix),Me.setValue(U,"normalMatrix",H.normalMatrix),Me.setValue(U,"modelMatrix",H.matrixWorld),G.uniformsGroups!==void 0){let Re=G.uniformsGroups;for(let ra=0,Vr=Re.length;ra<Vr;ra++){let __=Re[ra];it.update(__,Ei),it.bind(__,Ei)}}return Ei}function gT(M,D){M.ambientLightColor.needsUpdate=D,M.lightProbe.needsUpdate=D,M.sunLights.needsUpdate=D,M.sunLightShadows.needsUpdate=D,M.directionalLights.needsUpdate=D,M.directionalLightShadows.needsUpdate=D,M.pointLights.needsUpdate=D,M.pointLightShadows.needsUpdate=D,M.spotLights.needsUpdate=D,M.spotLightShadows.needsUpdate=D,M.rectAreaLights.needsUpdate=D,M.hemisphereLights.needsUpdate=D}function vT(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return Y},this.getActiveMipmapLevel=function(){return j},this.getRenderTarget=function(){return at},this.setRenderTargetTextures=function(M,D,W){let G=k.get(M);G.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,G.__autoAllocateDepthBuffer===!1&&(G.__useRenderToTexture=!1),k.get(M.texture).__webglTexture=D,k.get(M.depthTexture).__webglTexture=G.__autoAllocateDepthBuffer?void 0:W,G.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,D){let W=k.get(M);W.__webglFramebuffer=D,W.__useDefaultFramebuffer=D===void 0},this.setRenderTarget=function(M,D=0,W=0){at=M,Y=D,j=W;let G=null,H=!1,_t=!1;if(M){let gt=k.get(M);if(gt.__useDefaultFramebuffer!==void 0){x.bindFramebuffer(U.FRAMEBUFFER,gt.__webglFramebuffer),st.copy(M.viewport),Dt.copy(M.scissor),At=M.scissorTest,x.viewport(st),x.scissor(Dt),x.setScissorTest(At),Z=-1;return}else if(gt.__webglFramebuffer===void 0)q.setupRenderTarget(M);else if(gt.__hasExternalTextures)q.rebindTextures(M,k.get(M.texture).__webglTexture,k.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){let qt=M.depthTexture;if(gt.__boundDepthTexture!==qt){if(qt!==null&&k.has(qt)&&(M.width!==qt.image.width||M.height!==qt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");q.setupDepthRenderbuffer(M)}}let Et=M.texture;(Et.isData3DTexture||Et.isDataArrayTexture||Et.isCompressedArrayTexture)&&(_t=!0);let Rt=k.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(Rt[D])?G=Rt[D][W]:G=Rt[D],H=!0):M.samples>0&&q.useMultisampledRTT(M)===!1?G=k.get(M).__webglMultisampledFramebuffer:Array.isArray(Rt)?G=Rt[W]:G=Rt,st.copy(M.viewport),Dt.copy(M.scissor),At=M.scissorTest}else st.copy(yt).multiplyScalar(et).floor(),Dt.copy(Ft).multiplyScalar(et).floor(),At=Ve;if(W!==0&&(G=z),x.bindFramebuffer(U.FRAMEBUFFER,G)&&x.drawBuffers(M,G),x.viewport(st),x.scissor(Dt),x.setScissorTest(At),H){let gt=k.get(M.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_CUBE_MAP_POSITIVE_X+D,gt.__webglTexture,W)}else if(_t){let gt=D;for(let Et=0;Et<M.textures.length;Et++){let Rt=k.get(M.textures[Et]);U.framebufferTextureLayer(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0+Et,Rt.__webglTexture,W,gt)}}else if(M!==null&&W!==0){let gt=k.get(M.texture);U.framebufferTexture2D(U.FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,gt.__webglTexture,W)}Z=-1};function v_(M){let D=k.get(M);return(D.__readFormat!==M.format||D.__readType!==M.type)&&(D.__readFormat=M.format,D.__readType=M.type,D.__formatReadable=C.textureFormatReadable(M.format),D.__typeReadable=C.textureTypeReadable(M.type)),D}this.readRenderTargetPixels=function(M,D,W,G,H,_t,bt,gt=0){if(!(M&&M.isWebGLRenderTarget)){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Et=k.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&bt!==void 0&&(Et=Et[bt]),Et){x.bindFramebuffer(U.FRAMEBUFFER,Et);try{let Rt=M.textures[gt],qt=Rt.format,Qt=Rt.type;M.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+gt);let Tt=v_(Rt);if(Tt.__formatReadable===!1){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Tt.__typeReadable===!1){Pt("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}D>=0&&D<=M.width-G&&W>=0&&W<=M.height-H&&U.readPixels(D,W,G,H,ft.convert(qt),ft.convert(Qt),_t)}finally{let Rt=at!==null?k.get(at).__webglFramebuffer:null;x.bindFramebuffer(U.FRAMEBUFFER,Rt)}}},this.readRenderTargetPixelsAsync=async function(M,D,W,G,H,_t,bt,gt=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Et=k.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&bt!==void 0&&(Et=Et[bt]),Et)if(D>=0&&D<=M.width-G&&W>=0&&W<=M.height-H){x.bindFramebuffer(U.FRAMEBUFFER,Et);let Rt=M.textures[gt],qt=Rt.format,Qt=Rt.type;M.textures.length>1&&U.readBuffer(U.COLOR_ATTACHMENT0+gt);let Tt=v_(Rt);if(Tt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Tt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let fe=U.createBuffer();U.bindBuffer(U.PIXEL_PACK_BUFFER,fe),U.bufferData(U.PIXEL_PACK_BUFFER,_t.byteLength,U.STREAM_READ),U.readPixels(D,W,G,H,ft.convert(qt),ft.convert(Qt),0),U.bindBuffer(U.PIXEL_PACK_BUFFER,null);let Ke=at!==null?k.get(at).__webglFramebuffer:null;x.bindFramebuffer(U.FRAMEBUFFER,Ke);let Be=U.fenceSync(U.SYNC_GPU_COMMANDS_COMPLETE,0);return U.flush(),await rE(U,Be,4),U.bindBuffer(U.PIXEL_PACK_BUFFER,fe),U.getBufferSubData(U.PIXEL_PACK_BUFFER,0,_t),U.bindBuffer(U.PIXEL_PACK_BUFFER,null),U.deleteBuffer(fe),U.deleteSync(Be),_t}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,D=null,W=0){let G=Math.pow(2,-W),H=Math.floor(M.image.width*G),_t=Math.floor(M.image.height*G),bt=D!==null?D.x:0,gt=D!==null?D.y:0;q.setTexture2D(M,0),U.copyTexSubImage2D(U.TEXTURE_2D,W,0,0,bt,gt,H,_t),x.unbindTexture()},this.copyTextureToTexture=function(M,D,W=null,G=null,H=0,_t=0){let bt,gt,Et,Rt,qt,Qt,Tt,fe,Ke,Be=M.isCompressedTexture?M.mipmaps[_t]:M.image;if(W!==null)bt=W.max.x-W.min.x,gt=W.max.y-W.min.y,Et=W.isBox3?W.max.z-W.min.z:1,Rt=W.min.x,qt=W.min.y,Qt=W.isBox3?W.min.z:0;else{let Ye=Math.pow(2,-H);bt=Math.floor(Be.width*Ye),gt=Math.floor(Be.height*Ye),M.isDataArrayTexture?Et=Be.depth:M.isData3DTexture?Et=Math.floor(Be.depth*Ye):Et=1,Rt=0,qt=0,Qt=0}G!==null?(Tt=G.x,fe=G.y,Ke=G.z):(Tt=0,fe=0,Ke=0);let Te=ft.convert(D.format),wn=ft.convert(D.type),St;D.isData3DTexture?(q.setTexture3D(D,0),St=U.TEXTURE_3D):D.isDataArrayTexture||D.isCompressedArrayTexture?(q.setTexture2DArray(D,0),St=U.TEXTURE_2D_ARRAY):(q.setTexture2D(D,0),St=U.TEXTURE_2D),x.activeTexture(U.TEXTURE0),x.pixelStorei(U.UNPACK_FLIP_Y_WEBGL,D.flipY),x.pixelStorei(U.UNPACK_PREMULTIPLY_ALPHA_WEBGL,D.premultiplyAlpha),x.pixelStorei(U.UNPACK_ALIGNMENT,D.unpackAlignment);let On=x.getParameter(U.UNPACK_ROW_LENGTH),oe=x.getParameter(U.UNPACK_IMAGE_HEIGHT),Ei=x.getParameter(U.UNPACK_SKIP_PIXELS),es=x.getParameter(U.UNPACK_SKIP_ROWS),sa=x.getParameter(U.UNPACK_SKIP_IMAGES);x.pixelStorei(U.UNPACK_ROW_LENGTH,Be.width),x.pixelStorei(U.UNPACK_IMAGE_HEIGHT,Be.height),x.pixelStorei(U.UNPACK_SKIP_PIXELS,Rt),x.pixelStorei(U.UNPACK_SKIP_ROWS,qt),x.pixelStorei(U.UNPACK_SKIP_IMAGES,Qt);let Hr=M.isDataArrayTexture||M.isData3DTexture,Me=D.isDataArrayTexture||D.isData3DTexture;if(M.isDepthTexture){let Ye=k.get(M),aa=k.get(D),Re=k.get(Ye.__renderTarget),ra=k.get(aa.__renderTarget);x.bindFramebuffer(U.READ_FRAMEBUFFER,Re.__webglFramebuffer),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,ra.__webglFramebuffer);for(let Vr=0;Vr<Et;Vr++)Hr&&(U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,k.get(M).__webglTexture,H,Qt+Vr),U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,k.get(D).__webglTexture,_t,Ke+Vr)),U.blitFramebuffer(Rt,qt,bt,gt,Tt,fe,bt,gt,U.DEPTH_BUFFER_BIT,U.NEAREST);x.bindFramebuffer(U.READ_FRAMEBUFFER,null),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else if(H!==0||M.isRenderTargetTexture||k.has(M)){let Ye=k.get(M),aa=k.get(D);x.bindFramebuffer(U.READ_FRAMEBUFFER,I),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,X);for(let Re=0;Re<Et;Re++)Hr?U.framebufferTextureLayer(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,Ye.__webglTexture,H,Qt+Re):U.framebufferTexture2D(U.READ_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,Ye.__webglTexture,H),Me?U.framebufferTextureLayer(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,aa.__webglTexture,_t,Ke+Re):U.framebufferTexture2D(U.DRAW_FRAMEBUFFER,U.COLOR_ATTACHMENT0,U.TEXTURE_2D,aa.__webglTexture,_t),H!==0?U.blitFramebuffer(Rt,qt,bt,gt,Tt,fe,bt,gt,U.COLOR_BUFFER_BIT,U.NEAREST):Me?U.copyTexSubImage3D(St,_t,Tt,fe,Ke+Re,Rt,qt,bt,gt):U.copyTexSubImage2D(St,_t,Tt,fe,Rt,qt,bt,gt);x.bindFramebuffer(U.READ_FRAMEBUFFER,null),x.bindFramebuffer(U.DRAW_FRAMEBUFFER,null)}else Me?M.isDataTexture||M.isData3DTexture?U.texSubImage3D(St,_t,Tt,fe,Ke,bt,gt,Et,Te,wn,Be.data):D.isCompressedArrayTexture?U.compressedTexSubImage3D(St,_t,Tt,fe,Ke,bt,gt,Et,Te,Be.data):U.texSubImage3D(St,_t,Tt,fe,Ke,bt,gt,Et,Te,wn,Be):M.isDataTexture?U.texSubImage2D(U.TEXTURE_2D,_t,Tt,fe,bt,gt,Te,wn,Be.data):M.isCompressedTexture?U.compressedTexSubImage2D(U.TEXTURE_2D,_t,Tt,fe,Be.width,Be.height,Te,Be.data):U.texSubImage2D(U.TEXTURE_2D,_t,Tt,fe,bt,gt,Te,wn,Be);x.pixelStorei(U.UNPACK_ROW_LENGTH,On),x.pixelStorei(U.UNPACK_IMAGE_HEIGHT,oe),x.pixelStorei(U.UNPACK_SKIP_PIXELS,Ei),x.pixelStorei(U.UNPACK_SKIP_ROWS,es),x.pixelStorei(U.UNPACK_SKIP_IMAGES,sa),_t===0&&D.generateMipmaps&&U.generateMipmap(St),x.unbindTexture()},this.initRenderTarget=function(M){k.get(M).__webglFramebuffer===void 0&&q.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?q.setTextureCube(M,0):M.isData3DTexture?q.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?q.setTexture2DArray(M,0):q.setTexture2D(M,0),x.unbindTexture()},this.resetState=function(){Y=0,j=0,at=null,x.reset(),vt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Zi}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let n=this.getContext();n.drawingBufferColorSpace=ie._getDrawingBufferColorSpace(t),n.unpackColorSpace=ie._getUnpackColorSpace()}};var HE={type:"change"},u_={type:"start"},kE={type:"end"},Ep=new ea,VE=new vi,jL=Math.cos(70*ws.DEG2RAD),on=new P,ei=2*Math.PI,be={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},c_=1e-6,Tp=class extends hu{constructor(t,n=null){super(t,n),this.state=be.NONE,this.target=new P,this.cursor=new P,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:ja.ROTATE,MIDDLE:ja.DOLLY,RIGHT:ja.PAN},this.touches={ONE:Ka.ROTATE,TWO:Ka.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new P,this._lastQuaternion=new _i,this._lastTargetPosition=new P,this._quat=new _i().setFromUnitVectors(t.up,new P(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new _l,this._sphericalDelta=new _l,this._scale=1,this._panOffset=new P,this._rotateStart=new Ut,this._rotateEnd=new Ut,this._rotateDelta=new Ut,this._panStart=new Ut,this._panEnd=new Ut,this._panDelta=new Ut,this._dollyStart=new Ut,this._dollyEnd=new Ut,this._dollyDelta=new Ut,this._dollyDirection=new P,this._mouse=new Ut,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=JL.bind(this),this._onPointerDown=KL.bind(this),this._onPointerUp=QL.bind(this),this._onContextMenu=aU.bind(this),this._onMouseWheel=eU.bind(this),this._onKeyDown=nU.bind(this),this._onTouchStart=iU.bind(this),this._onTouchMove=sU.bind(this),this._onMouseDown=$L.bind(this),this._onMouseMove=tU.bind(this),this._interceptControlDown=rU.bind(this),this._interceptControlUp=oU.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=be.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let t=this.domElement.getRootNode();t.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),t.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(HE),this.update(),this.state=be.NONE}pan(t,n){this._pan(t,n),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){let n=this.object.position;on.copy(n).sub(this.target),on.applyQuaternion(this._quat),this._spherical.setFromVector3(on),this.autoRotate&&this.state===be.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let i=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(i)&&isFinite(s)&&(i<-Math.PI?i+=ei:i>Math.PI&&(i-=ei),s<-Math.PI?s+=ei:s>Math.PI&&(s-=ei),i<=s?this._spherical.theta=Math.max(i,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(i+s)/2?Math.max(i,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let a=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let r=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),a=r!=this._spherical.radius}if(on.setFromSpherical(this._spherical),on.applyQuaternion(this._quatInverse),n.copy(this.target).add(on),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let r=null;if(this.object.isPerspectiveCamera){let o=on.length();r=this._clampDistance(o*this._scale);let l=o-r;this.object.position.addScaledVector(this._dollyDirection,l),this.object.updateMatrixWorld(),a=!!l}else if(this.object.isOrthographicCamera){let o=new P(this._mouse.x,this._mouse.y,0);o.unproject(this.object);let l=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),a=l!==this.object.zoom;let c=new P(this._mouse.x,this._mouse.y,0);c.unproject(this.object),this.object.position.sub(c).add(o),this.object.updateMatrixWorld(),r=on.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;r!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(r).add(this.object.position):(Ep.origin.copy(this.object.position),Ep.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Ep.direction))<jL?this.object.lookAt(this.target):(VE.setFromNormalAndCoplanarPoint(this.object.up,this.target),Ep.intersectPlane(VE,this.target))))}else if(this.object.isOrthographicCamera){let r=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),r!==this.object.zoom&&(this.object.updateProjectionMatrix(),a=!0)}return this._scale=1,this._performCursorZoom=!1,a||this._lastPosition.distanceToSquared(this.object.position)>c_||8*(1-this._lastQuaternion.dot(this.object.quaternion))>c_||this._lastTargetPosition.distanceToSquared(this.target)>c_?(this.dispatchEvent(HE),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?ei/60*this.autoRotateSpeed*t:ei/60/60*this.autoRotateSpeed}_getZoomScale(t){let n=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*n)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,n){on.setFromMatrixColumn(n,0),on.multiplyScalar(-t),this._panOffset.add(on)}_panUp(t,n){this.screenSpacePanning===!0?on.setFromMatrixColumn(n,1):(on.setFromMatrixColumn(n,0),on.crossVectors(this.object.up,on)),on.multiplyScalar(t),this._panOffset.add(on)}_pan(t,n){let i=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;on.copy(s).sub(this.target);let a=on.length();a*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*a/i.clientHeight,this.object.matrix),this._panUp(2*n*a/i.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/i.clientWidth,this.object.matrix),this._panUp(n*(this.object.top-this.object.bottom)/this.object.zoom/i.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,n){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let i=this.domElement.getBoundingClientRect(),s=t-i.left,a=n-i.top,r=i.width,o=i.height;this._mouse.x=s/r*2-1,this._mouse.y=-(a/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let n=this.domElement;this._rotateLeft(ei*this._rotateDelta.x/n.clientHeight),this._rotateUp(ei*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let n=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(ei*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),n=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-ei*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),n=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(ei*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),n=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-ei*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),n=!0;break}n&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._rotateStart.set(i,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._panStart.set(i,s)}}_handleTouchStartDolly(t){let n=this._getSecondPointerPosition(t),i=t.pageX-n.x,s=t.pageY-n.y,a=Math.sqrt(i*i+s*s);this._dollyStart.set(0,a)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let i=this._getSecondPointerPosition(t),s=.5*(t.pageX+i.x),a=.5*(t.pageY+i.y);this._rotateEnd.set(s,a)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let n=this.domElement;this._rotateLeft(ei*this._rotateDelta.x/n.clientHeight),this._rotateUp(ei*this._rotateDelta.y/n.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),i=.5*(t.pageX+n.x),s=.5*(t.pageY+n.y);this._panEnd.set(i,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let n=this._getSecondPointerPosition(t),i=t.pageX-n.x,s=t.pageY-n.y,a=Math.sqrt(i*i+s*s);this._dollyEnd.set(0,a),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let r=(t.pageX+n.x)*.5,o=(t.pageY+n.y)*.5;this._updateZoomParameters(r,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==t.pointerId){this._pointers.splice(n,1);return}}_isTrackingPointer(t){for(let n=0;n<this._pointers.length;n++)if(this._pointers[n]==t.pointerId)return!0;return!1}_trackPointer(t){let n=this._pointerPositions[t.pointerId];n===void 0&&(n=new Ut,this._pointerPositions[t.pointerId]=n),n.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let n=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[n]}_customWheelEvent(t){let n=t.deltaMode,i={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(n){case 1:i.deltaY*=16;break;case 2:i.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(i.deltaY*=10),i}};function KL(e){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(e.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(e)&&(this._addPointer(e),e.pointerType==="touch"?this._onTouchStart(e):this._onMouseDown(e),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function JL(e){this.enabled!==!1&&(e.pointerType==="touch"?this._onTouchMove(e):this._onMouseMove(e))}function QL(e){switch(this._removePointer(e),this._pointers.length){case 0:this.domElement.releasePointerCapture(e.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(kE),this.state=be.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let t=this._pointers[0],n=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:n.x,pageY:n.y});break}}function $L(e){let t;switch(e.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case ja.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(e),this.state=be.DOLLY;break;case ja.ROTATE:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=be.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=be.ROTATE}break;case ja.PAN:if(e.ctrlKey||e.metaKey||e.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(e),this.state=be.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(e),this.state=be.PAN}break;default:this.state=be.NONE}this.state!==be.NONE&&this.dispatchEvent(u_)}function tU(e){switch(this.state){case be.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(e);break;case be.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(e);break;case be.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(e);break}}function eU(e){this.enabled===!1||this.enableZoom===!1||this.state!==be.NONE||(e.preventDefault(),this.dispatchEvent(u_),this._handleMouseWheel(this._customWheelEvent(e)),this.dispatchEvent(kE))}function nU(e){this.enabled!==!1&&this._handleKeyDown(e)}function iU(e){switch(this._trackPointer(e),this._pointers.length){case 1:switch(this.touches.ONE){case Ka.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(e),this.state=be.TOUCH_ROTATE;break;case Ka.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(e),this.state=be.TOUCH_PAN;break;default:this.state=be.NONE}break;case 2:switch(this.touches.TWO){case Ka.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(e),this.state=be.TOUCH_DOLLY_PAN;break;case Ka.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(e),this.state=be.TOUCH_DOLLY_ROTATE;break;default:this.state=be.NONE}break;default:this.state=be.NONE}this.state!==be.NONE&&this.dispatchEvent(u_)}function sU(e){switch(this._trackPointer(e),this.state){case be.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(e),this.update();break;case be.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(e),this.update();break;case be.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(e),this.update();break;case be.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(e),this.update();break;default:this.state=be.NONE}}function aU(e){this.enabled!==!1&&e.preventDefault()}function rU(e){e.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function oU(e){e.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var XE=18,WE=72;function ZE(e,t={}){return new h_(e,t)}var h_=class{canvas;callbacks;graph=null;layout=null;selectedId=null;hoveredId=null;nodeObjects=[];edgeObjects=[];nodeById=new Map;positionById=new Map;labelObjects=[];disposables=[];pointerDown=null;focusAnimation=null;lastSignature=null;frameId=0;disposed=!1;eventController=new AbortController;scene=new Kc;camera=new Ln(48,1,1,5e3);renderer;controls;graphGroup=new Qs;nodeGeometry=new ru(1,XE,Math.max(10,XE-6));glowTexture=uU();raycaster=new uu;pointer=new Ut;resizeObserver;starfield=hU();constructor(t,n){this.canvas=t,this.callbacks=n,this.scene.background=new Wt(527120),this.scene.fog=new jc(527120,55e-5),this.camera.position.set(0,0,900),this.renderer=new Sp({canvas:t,antialias:!0,alpha:!1,powerPreference:"high-performance"}),this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),this.renderer.outputColorSpace=bn,this.controls=new Tp(this.camera,t),this.controls.enableDamping=!0,this.controls.dampingFactor=.075,this.controls.zoomToCursor=!0,this.controls.minDistance=100,this.controls.maxDistance=2800,this.controls.rotateSpeed=.46,this.controls.panSpeed=.82,this.controls.zoomSpeed=.85,this.controls.target.set(0,0,0),this.graphGroup.name="cgrx-project-graph",this.scene.add(this.graphGroup),this.scene.add(this.starfield),this.raycaster.params.Line.threshold=5,this.resizeObserver=new ResizeObserver(()=>this.resize()),this.resizeObserver.observe(t.parentElement||t),this.bindEvents(),this.resize(),this.animate()}bindEvents(){let t={signal:this.eventController.signal};this.canvas.addEventListener("pointerdown",n=>{this.pointerDown={x:n.clientX,y:n.clientY}},t),this.canvas.addEventListener("pointermove",n=>this.handlePointerMove(n),t),this.canvas.addEventListener("pointerleave",()=>{this.hoveredId=null,this.canvas.style.cursor="grab",this.applyFocus(this.selectedId)},t),this.canvas.addEventListener("click",n=>this.handleClick(n),t),this.canvas.addEventListener("dblclick",n=>this.handleDoubleClick(n),t)}resize(){let t=this.canvas.parentElement,n=Math.max(1,t?.clientWidth||this.canvas.clientWidth||1),i=Math.max(1,t?.clientHeight||this.canvas.clientHeight||1);this.renderer.setSize(n,i,!1),this.camera.aspect=n/i,this.camera.updateProjectionMatrix()}render(t,n,{selectedId:i=null}={}){this.graph=t,this.layout=n,this.selectedId=i==null?null:String(i);let s=`${t.snapshot?.repo_revision||""}:${t.snapshot?.graph_generation||""}:${n.nodes.length}:${t.edges?.length||0}`,a=this.lastSignature!==s;this.lastSignature=s,this.clearGraph();let r=new Map((n.communities||[]).map((c,h)=>[c.id,h])),o=Math.max(1,r.size),l=Math.max(.9,Math.min(1.45,1180/Math.max(980,n.width)));for(let c of n.communities||[])this.addCommunity(c,r.get(c.id)||0,o,n,l);for(let c of n.nodes||[]){let h=lU(c,n,r,o,l);this.positionById.set(String(c.node_id),h),this.addNode(c,h)}for(let c of t.edges||[])this.addEdge(c);this.applyFocus(this.selectedId),a&&this.resetView(!1),this.updateLabelVisibility()}clearGraph(){this.graphGroup.clear();for(let t of this.disposables)t.dispose?.();this.disposables=[],this.nodeObjects=[],this.edgeObjects=[],this.nodeById.clear(),this.positionById.clear(),this.labelObjects=[]}addCommunity(t,n,i,s,a){let r=jE(t.x,t.y,s,a);r.z=KE(n,i)*.72;let o=Math.max(44,t.radius*a),l=[];for(let p=0;p<WE;p+=1){let m=p/WE*Math.PI*2;l.push(new P(r.x+Math.cos(m)*o,r.y+Math.sin(m)*o,r.z))}let c=new pn().setFromPoints(l),h=new Ir({color:3229528,transparent:!0,opacity:.22,depthWrite:!1}),d=new eu(c,h);d.renderOrder=-1,this.graphGroup.add(d),this.disposables.push(c,h);let u=qE(YE(t.label||`cluster ${n+1}`,28),{color:"#71879a",opacity:.54,fontSize:13});u.position.set(r.x-o*.72,r.y+o*.72,r.z+4),u.scale.multiplyScalar(.9),this.graphGroup.add(u),this.disposables.push(u.material),u.material.map&&this.disposables.push(u.material.map)}addNode(t,n){let i=new Wt(t.color||"#69d8ff"),s=new Xa({color:i,transparent:!0,opacity:.96,depthWrite:!0}),a=new Wn(this.nodeGeometry,s);a.position.copy(n),a.scale.setScalar(Math.max(4,t.radius*.92)),a.userData={kind:"node",node:t,baseColor:i.clone()},this.graphGroup.add(a),this.nodeObjects.push(a),this.nodeById.set(String(t.node_id),a),this.disposables.push(s);let r=new Ur({map:this.glowTexture,color:i,transparent:!0,opacity:.2,depthWrite:!1,blending:fu}),o=new fl(r),l=Math.max(18,t.radius*4.7);if(o.scale.set(l,l,1),o.userData={kind:"halo",nodeId:String(t.node_id),baseOpacity:.2},a.add(o),this.disposables.push(r),t.cycle){let h=new Xa({color:15910509,wireframe:!0,transparent:!0,opacity:.72,depthWrite:!1}),d=new Wn(this.nodeGeometry,h);d.scale.setScalar(1.17),a.add(d),this.disposables.push(h)}let c=qE(YE(t.symbol,28),{color:"#dcebf6",opacity:t.showLabel?.88:0,fontSize:13});c.position.copy(n).add(new P(Math.max(12,t.radius+8),0,4)),c.userData={kind:"label",nodeId:String(t.node_id),major:!!t.showLabel},this.graphGroup.add(c),this.labelObjects.push(c),this.disposables.push(c.material),c.material.map&&this.disposables.push(c.material.map)}addEdge(t){let n=this.positionById.get(String(t.source)),i=this.positionById.get(String(t.target));if(!n||!i)return;let s=new pn().setFromPoints([n,i]),a=Math.max(1,Number(t.weight||1)),r=Math.max(.08,Math.min(.42,.09+Math.log2(a+1)*.055)),o=new Ir({color:5795974,transparent:!0,opacity:r,depthWrite:!1}),l=new pl(s,o);l.userData={kind:"edge",edge:t,baseOpacity:r},this.graphGroup.add(l),this.edgeObjects.push(l),this.disposables.push(s,o)}setSelected(t){this.selectedId=t==null?null:String(t),this.applyFocus(this.hoveredId||this.selectedId)}focusNode(t){let n=this.nodeById.get(String(t));if(!n)return;let i=n.position.clone(),s=this.camera.position.clone().sub(this.controls.target),a=ws.clamp(s.length(),260,560);s.lengthSq()<1&&s.set(0,0,1),s.normalize().multiplyScalar(a);let r=i.clone().add(s);this.focusAnimation={startedAt:performance.now(),duration:420,fromTarget:this.controls.target.clone(),toTarget:i,fromCamera:this.camera.position.clone(),toCamera:r}}resetView(t=!0){if(!this.nodeObjects.length)return;let n=new Ss;for(let c of this.nodeObjects)n.expandByPoint(c.position);let i=n.getBoundingSphere(new bs),s=Math.max(90,i.radius+70),a=ws.degToRad(this.camera.fov),r=ws.clamp(s/Math.tan(a/2)*1.06,320,2200),o=i.center,l=new P(o.x,o.y+s*.08,o.z+r);if(!t){this.controls.target.copy(o),this.camera.position.copy(l),this.controls.update();return}this.focusAnimation={startedAt:performance.now(),duration:460,fromTarget:this.controls.target.clone(),toTarget:o.clone(),fromCamera:this.camera.position.clone(),toCamera:l}}zoom(t){let n=this.camera.position.clone().sub(this.controls.target),i=ws.clamp(n.length()/t,this.controls.minDistance,this.controls.maxDistance);n.lengthSq()<1&&n.set(0,0,1),this.camera.position.copy(this.controls.target).add(n.normalize().multiplyScalar(i)),this.controls.update()}handlePointerMove(t){if(!this.layout)return;let n=this.pick(t,!0),i=n?.object?.userData?.kind==="node"?String(n.object.userData.node.node_id):null;i!==this.hoveredId&&(this.hoveredId=i,this.canvas.style.cursor=i?"pointer":"grab",this.applyFocus(this.hoveredId||this.selectedId))}handleClick(t){if(!this.layout||dU(this.pointerDown,t))return;let n=this.pick(t,!1);if(n){if(n.object.userData.kind==="node"){this.callbacks.onNodeSelect?.(n.object.userData.node);return}if(n.object.userData.kind==="edge"){let i=n.object.userData.edge,s=this.layout.nodes.find(r=>String(r.node_id)===String(i.source)),a=this.layout.nodes.find(r=>String(r.node_id)===String(i.target));s&&a&&this.callbacks.onEdgeSelect?.(i,s,a)}}}handleDoubleClick(t){let n=this.pick(t,!0);n?.object?.userData?.kind==="node"&&this.callbacks.onNodeOpen?.(n.object.userData.node)}pick(t,n){let i=this.canvas.getBoundingClientRect();if(!i.width||!i.height)return null;this.pointer.x=(t.clientX-i.left)/i.width*2-1,this.pointer.y=-((t.clientY-i.top)/i.height)*2+1,this.raycaster.setFromCamera(this.pointer,this.camera);let s=this.raycaster.intersectObjects(this.nodeObjects,!1);return s.length||n?s[0]||null:this.raycaster.intersectObjects(this.edgeObjects,!1)[0]||null}applyFocus(t){let n=t==null?null:String(t),i=new Set(n?[n]:[]);if(n)for(let s of this.graph?.edges||[]){let a=String(s.source),r=String(s.target);a===n&&i.add(r),r===n&&i.add(a)}for(let s of this.nodeObjects){let a=String(s.userData.node.node_id),r=!n||i.has(a),o=a===n;s.material.opacity=r?.98:.12,s.material.color.copy(s.userData.baseColor),o&&s.material.color.lerp(new Wt(16777215),.34);let l=s.children.find(c=>c.userData.kind==="halo");l&&(l.material.opacity=o?.56:r?.24:.025)}for(let s of this.edgeObjects){let a=s.userData.edge,r=!!(n&&(String(a.source)===n||String(a.target)===n));s.material.opacity=n?r?.9:.025:Number(s.userData.baseOpacity),s.material.color.setHex(r?7530193:5795974)}this.updateLabelVisibility()}updateLabelVisibility(){let n=this.camera.position.distanceTo(this.controls.target)<650,i=this.hoveredId||this.selectedId;for(let s of this.labelObjects){let a=!!(i&&String(s.userData.nodeId)===String(i));s.visible=!!s.userData.major||n||a,s.material.opacity=a?1:s.userData.major?.84:.66}}animate(){this.disposed||(this.frameId=requestAnimationFrame(()=>this.animate()),!this.canvas.hidden&&(this.focusAnimation&&this.stepFocusAnimation(),this.controls.update(),this.updateLabelVisibility(),this.renderer.render(this.scene,this.camera)))}stepFocusAnimation(){let t=this.focusAnimation;if(!t)return;let n=ws.clamp((performance.now()-t.startedAt)/t.duration,0,1),i=1-Math.pow(1-n,3);this.controls.target.lerpVectors(t.fromTarget,t.toTarget,i),this.camera.position.lerpVectors(t.fromCamera,t.toCamera,i),n>=1&&(this.focusAnimation=null)}dispose(){this.disposed||(this.disposed=!0,cancelAnimationFrame(this.frameId),this.eventController.abort(),this.resizeObserver.disconnect(),this.controls.dispose(),this.clearGraph(),this.nodeGeometry.dispose(),this.glowTexture.dispose(),this.starfield.geometry.dispose(),this.starfield.material.dispose(),this.renderer.dispose())}};function lU(e,t,n,i,s){let a=jE(e.x,e.y,t,s),r=n.get(e.community)||0;return a.z=KE(r,i)+cU(String(e.node_id))*58,a}function jE(e,t,n,i){return new P((Number(e)-n.width/2)*i,-(Number(t)-n.height/2)*i,0)}function KE(e,t){if(t<=1)return 0;let n=e-(t-1)/2;return ws.clamp(n*26,-150,150)}function cU(e){let t=2166136261;for(let n of String(e))t^=n.charCodeAt(0),t=Math.imul(t,16777619);return(t>>>0)/4294967295*2-1}function uU(){let e=document.createElement("canvas");e.width=96,e.height=96;let t=e.getContext("2d");if(!t)throw new Error("2D canvas context is unavailable");let n=t.createRadialGradient(48,48,0,48,48,48);n.addColorStop(0,"rgba(255,255,255,1)"),n.addColorStop(.34,"rgba(255,255,255,.62)"),n.addColorStop(1,"rgba(255,255,255,0)"),t.fillStyle=n,t.fillRect(0,0,96,96);let i=new gl(e);return i.colorSpace=bn,i}function qE(e,t={}){let n=t.fontSize||13,i=document.createElement("canvas"),s=i.getContext("2d");if(!s)throw new Error("2D canvas context is unavailable");s.font=`600 ${n*2}px ui-monospace, SFMono-Regular, Menlo, monospace`;let a=Math.ceil(s.measureText(e).width+28);i.width=Math.max(64,a),i.height=Math.ceil(n*3.2),s.font=`600 ${n*2}px ui-monospace, SFMono-Regular, Menlo, monospace`,s.textBaseline="middle",s.fillStyle=t.color||"#dcebf6",s.shadowColor="rgba(0,0,0,.94)",s.shadowBlur=7,s.fillText(e,12,i.height/2);let r=new gl(i);r.colorSpace=bn;let o=new Ur({map:r,transparent:!0,opacity:t.opacity??.86,depthWrite:!1,depthTest:!1}),l=new fl(o),c=18;return l.scale.set(c*i.width/i.height,c,1),l.center.set(0,.5),l.renderOrder=10,l}function hU(){let e=new pn,t=850,n=new Float32Array(t*3),i=2402408747,s=()=>(i=Math.imul(i^i>>>15,1|i),i^=i+Math.imul(i^i>>>7,61|i),((i^i>>>14)>>>0)/4294967296);for(let r=0;r<t;r+=1)n[r*3]=(s()-.5)*2600,n[r*3+1]=(s()-.5)*1800,n[r*3+2]=-250-s()*1200;e.setAttribute("position",new Vn(n,3));let a=new ml({color:6783125,size:1.7,transparent:!0,opacity:.28,depthWrite:!1});return new nu(e,a)}function dU(e,t){return e?Math.hypot(t.clientX-e.x,t.clientY-e.y)>5:!1}function YE(e,t){let n=String(e||"");return n.length<=t?n:`${n.slice(0,t-1)}\u2026`}function JE(e,t=Date.now()*1e6){let n=typeof e.evidence=="string"?e.evidence:"";if(!n.includes("observed"))return null;let i=Math.max(1,Number(e.count)||1),s=Math.max(0,(t-Number(e.last_seen_unix_nanos||t))/864e11),a=Math.max(.35,Math.min(1,1-s/30)),r=Math.min(6,1.7+Math.log2(i+1));return{dash:n==="observed"?"5 5":"2 3",marker:"\u25CF",width:r,opacity:a,label:`${i.toLocaleString("en-US")} calls \xB7 ${(e.environments||[]).join(", ")||"runtime"}`}}function QE(e,t){let n=new URLSearchParams({evidence:e});for(let i of[...new Set(t)].sort())n.append("environment",i);return n.toString()}function $E(e,t=[]){let i=(Array.isArray(e.edges)?e.edges:[]).filter(s=>typeof s.evidence=="string"&&s.evidence.includes("observed"));return JSON.stringify({schema:"cgrx.agent.runtime-overlay.v1",snapshot:e.snapshot,root:e.root,evidence:e.evidence,environment_filter:e.environment_filter||[],observed_edges:i,runtime_gaps:e.runtime_gaps||{unresolved:0,ambiguous:0},deterministic_insights:t,constraints:{llm_used:!1,revalidate_snapshot_before_edit:!0,observed_paths_are_execution_evidence_not_exhaustive_coverage:!0}},null,2)}function tT(e){return JSON.stringify(e.agent_handoff,null,2)}function eT(e){let t=e?.change_plan||e||{},n=(t.missions||[]).map(a=>({...a,title:a.change_paths?.[0]||a.review_paths?.[0]||a.mission_id,evidenceCount:(a.finding_indexes?.length||0)+(a.impact_indexes?.length||0),testCount:a.related_test_indexes?.length||0})),i=new Map(n.map(a=>[a.mission_id,a])),s=(t.execution_order||[]).map((a,r)=>({index:r,missions:a.map(o=>i.get(o)).filter(Boolean)}));return{snapshot:t.snapshot,groups:s,missions:n,dependencies:n.flatMap(a=>(a.depends_on||[]).map(r=>({source:r,target:a.mission_id}))),totals:t.totals||{missions:n.length,parallel_groups:s.length,blocked:0},partial:!!t.partial,agent_handoff:t.agent_handoff}}function nT(e){return JSON.stringify(e.agent_handoff,null,2)}function iT(e,t,n){let i=t.agent_handoff||{};return{...i,schema_version:"cgrx.agent.architecture-future.v1",snapshot:i.snapshot||e,issue:i.issue||(t.kind==="PACKAGE_DEPENDENCY_CYCLE"?{kind:t.kind,packages:t.packages,selected_boundary:t.selected_boundary}:{kind:t.kind,symbol:t.symbol}),strategy_id:n.strategy_id,policy:n.policy,predicted_graph:n.predicted_graph,llm_used:!1,constraints:{...i.constraints||{},llm_used:!1,revalidate_snapshot_before_edit:!0,preserve_proven_edges_unless_listed:!0},verification:i.verification||["Re-index edited source before accepting the predicted graph.","Confirm the targeted cycle or hotspot changed as predicted.","Report remaining coverage gaps separately from proven graph changes."]}}function sT(e){let t=e.candidates?.length||0,n=!!e.partial,i=`${e.total>t?`${t}/${e.total}`:e.total}${n?" \xB7 partial":""}`,s=e.coverage_gap_count||0;return{count:i,note:n?`Bounded result \xB7 ${s} coverage gaps. Destructive paths stay blocked.`:""}}function d_(e,t){let n=new Map;for(let r of e.nodes||[])n.set(Rs(r),{...r});let i=(r,o="entrypoints")=>{if(!r||Rs(r)==="")return;let l=Rs(r);n.has(l)||n.set(l,{...r,node_id:r.node_id??r.id,lane:o,path:r.path||"proposed",span:r.span||{start:0,end:0},source_hash:r.source_hash||"hypothetical",status:r.status||"hypothetical"})};for(let r of t.verification?.review_symbols||[])i(r);let s=(e.edges||[]).map(r=>({...r,status:"preserved"})),a=t.graph_delta||{};for(let r of a.preserve||[]){i(r.source,"callers"),i(r.target,"entrypoints");let o=Rs(r.source),l=Rs(r.target);s.some(h=>String(h.source)===o&&String(h.target)===l&&h.relation===r.relation)||s.push({...r,source:o,target:l,status:"preserved"})}for(let[r,o]of[[a.add,"hypothetical"],[a.redirect,"hypothetical"],[a.move_to_helper,"hypothetical"]])for(let l of r||[])i(l.source,(l.source?.status==="hypothetical","entrypoints")),i(l.target,l.target?.status==="hypothetical"?"entrypoints":"callees"),s.push({...l,source:Rs(l.source),target:Rs(l.target),confidence:o==="hypothetical"?"hypothetical":l.confidence,status:o});for(let r of a.remove||[]){i(r);let o=Rs(r);n.set(o,{...n.get(o),status:"remove"})}return{...e,nodes:[...n.values()],edges:s,projection:t.strategy_id}}function aT(e){let t=new Set((e.cycles||[]).flatMap(s=>s.packages||[])),n=(e.packages||[]).map(s=>({node_id:`package:${s.name}`,symbol:s.name,path:s.name,span:{start:0,end:0},source_hash:"package-projection",lane:"entrypoints",kind:"package",files:s.files,symbols:s.symbols,fan_in:s.fan_in,fan_out:s.fan_out,cycle:t.has(s.name),status:"current"})),i=(e.boundaries||[]).map(s=>({source:`package:${s.source}`,target:`package:${s.target}`,relation:(s.relations||[]).join("+")||"CALLS",confidence:s.confidence,status:"current",evidence:s.evidence?.[0],evidence_count:s.edges}));return{snapshot:e.snapshot,root:{symbol:"Architecture",path:"."},nodes:n,edges:i,containers:[],partial:e.partial,coverage_gap_count:e.coverage_gap_count}}function rT(e){let t=e.packages||[],n=t.map(d=>d.name).sort((d,u)=>u.length-d.length),i=new Map,s=(e.communities||[]).map((d,u)=>{let p=`community:${u}`;for(let m of d.packages||[])i.set(m,p);return{id:p,label:(d.packages||[])[0]||`cluster ${u+1}`,packages:d.packages||[],cohesion:Number(d.cohesion||0),internal_weight:Number(d.internal_weight||0),cut_weight:Number(d.cut_weight||0)}}),a=t.filter(d=>!i.has(d.name)).map(d=>d.name);a.length&&s.push({id:"community:unclustered",label:"unclustered",packages:a,cohesion:0,internal_weight:0,cut_weight:0});let r=new Map(t.map(d=>[d.name,[]])),o=d=>n.find(u=>d===u||d.startsWith(`${u}/`));for(let d of e.symbol_communities||[])for(let u of d.top_nodes||[]){let p=o(u.path||"");if(!p)continue;let m=r.get(p);!m.some(S=>S.node_id===u.node_id)&&m.length<6&&m.push(u)}let l=new Set((e.cycles||[]).flatMap(d=>d.packages||[])),c=t.map(d=>({node_id:`package:${d.name}`,symbol:d.name,path:d.name,kind:"project-package",community:i.get(d.name)||"community:unclustered",files:Number(d.files||0),symbols:Number(d.symbols||0),fan_in:Number(d.fan_in||0),fan_out:Number(d.fan_out||0),degree:Number(d.fan_in||0)+Number(d.fan_out||0),cycle:l.has(d.name),representatives:r.get(d.name)||[],status:"current"})),h=(e.boundaries||[]).map(d=>({source:`package:${d.source}`,target:`package:${d.target}`,relation:(d.relations||[]).join("+")||"DEPENDENCY",confidence:d.confidence||"PROVEN",weight:Number(d.edges||1),status:"current",evidence:d.evidence?.[0]}));return{snapshot:e.snapshot,root:{symbol:"Project map",path:"."},nodes:c,edges:h,communities:s,totals:e.totals||{},partial:!!e.partial,coverage_gap_count:Number(e.coverage_gap_count||0),package_depth:e.package_depth}}function oT(e,t,n){let i=(e.nodes||[]).map(o=>({...o})),s=(e.edges||[]).map(o=>({...o,status:"preserved"})),a=o=>{i.some(l=>Rs(l)===Rs(o))||i.push(o)},r=(o,l,c)=>s.push({source:o,target:l,relation:c,confidence:"hypothetical",status:"hypothetical"});if(t?.kind==="PACKAGE_DEPENDENCY_CYCLE"){let o=`package:${t.selected_boundary?.source}`,l=`package:${t.selected_boundary?.target}`;if(n.policy!=="preserve_and_monitor"&&(s=s.filter(c=>!(String(c.source)===o&&String(c.target)===l))),n.policy==="invert_dependency"&&r(l,o,"INVERTED_DEPENDENCY"),n.policy==="extract_contract"){let c=wp(`future:contract:${t.issue_id}`,`${t.selected_boundary.source} \u2194 ${t.selected_boundary.target} contract`,"contract");a(c),r(o,c.node_id,"DEPENDS_ON_CONTRACT"),r(l,c.node_id,"DEPENDS_ON_CONTRACT")}}if(t?.kind==="HIGH_FAN_IN_HOTSPOT"){let o=wp(`hotspot:${t.issue_id}`,t.symbol?.symbol||"hotspot","hotspot",t.symbol?.path||"observed hotspot");if(o.status="current",o.fan_in=t.symbol?.fan_in,a(o),n.policy==="introduce_facade"){let l=wp(`future:facade:${t.issue_id}`,"stable facade","facade");a(l),r(l.node_id,o.node_id,"DELEGATES_TO")}if(n.policy==="split_by_community")for(let l of[1,2]){let c=wp(`future:community:${t.issue_id}:${l}`,`caller community ${l}`,"community-split");a(c),r(c.node_id,o.node_id,"PARTITIONED_CALLS")}}return{...e,nodes:i,edges:s,projection:n.strategy_id,architecture_issue:t.issue_id}}function wp(e,t,n,i="proposed"){return{node_id:e,symbol:t,path:i,span:{start:0,end:0},source_hash:"hypothetical",lane:"entrypoints",kind:n,status:"hypothetical"}}function Rs(e){return e==null?"":String(typeof e=="string"||typeof e=="number"?e:e.node_id??e.id??"")}function f_(e){return e?`${e.repo_revision}:${e.working_tree_digest}:${e.graph_generation}`:""}var V=Cu(p_(),1),hT={x:0,y:0,scale:1},mU=[{id:"project",label:"Project map"},{id:"current",label:"Current"},{id:"architecture",label:"Architecture"},{id:"changes",label:"Changes"},{id:"preview",label:"Preview"},{id:"compare",label:"Compare"},{id:"history",label:"Git history"}],gU=[{id:"static",label:"Static"},{id:"observed",label:"Runtime"},{id:"all",label:"Combined"}],fT=`cgrx-token:${location.host}`,vU=new URLSearchParams(location.hash.slice(1)),m_=vU.get("token")||sessionStorage.getItem(fT)||"";m_&&sessionStorage.setItem(fT,m_);location.hash&&history.replaceState(null,"",`${location.pathname}${location.search}`);qM();async function ia(e,t){let n=await fetch(e,{headers:{"X-CGRX-Token":m_},cache:"no-store",signal:t}),i=await n.json();if(!n.ok)throw new Error(i?.error?.detail||`Request failed: ${n.status}`);return i}function _U(){let[e,t]=(0,dt.useState)(null),[n,i]=(0,dt.useState)("connecting"),[s,a]=(0,dt.useState)("project"),[r,o]=(0,dt.useState)("static"),[l,c]=(0,dt.useState)(""),[h,d]=(0,dt.useState)(hT),[u,p]=(0,dt.useState)({}),[m,S]=(0,dt.useState)(""),[g,f]=(0,dt.useState)([]),[v,b]=(0,dt.useState)(0),[y,T]=(0,dt.useState)(""),[E,w]=(0,dt.useState)(null),[_,A]=(0,dt.useState)(null),[R,O]=(0,dt.useState)(null),[F,z]=(0,dt.useState)([]),[I,X]=(0,dt.useState)(!1),[Y,j]=(0,dt.useState)(null),[at,Z]=(0,dt.useState)(""),[nt,st]=(0,dt.useState)(null),[Dt,At]=(0,dt.useState)(""),[se,Kt]=(0,dt.useState)(null),[re,K]=(0,dt.useState)(""),[et,xt]=(0,dt.useState)(null),[Bt,yt]=(0,dt.useState)(null),[Ft,Ve]=(0,dt.useState)(null),[It,ae]=(0,dt.useState)(null),[ge,kt]=(0,dt.useState)({kind:"none",facts:[]}),[Ce,Ie]=(0,dt.useState)("Trace evidence, then compare futures."),[En,Oe]=(0,dt.useState)(""),Pe=(0,dt.useRef)(null),U=(0,dt.useRef)(null),je=(0,dt.useRef)(r),Jt=(0,dt.useRef)(l),C=(0,dt.useRef)(h),x=(0,dt.useRef)(null),B=(0,dt.useRef)(0),k=(0,dt.useRef)(null),q=(0,dt.useRef)(null);(0,dt.useEffect)(()=>{Pe.current=e},[e]),(0,dt.useEffect)(()=>{U.current=E},[E]),(0,dt.useEffect)(()=>{je.current=r},[r]),(0,dt.useEffect)(()=>{Jt.current=l},[l]),(0,dt.useEffect)(()=>{C.current=h},[h]);let rt=(0,dt.useCallback)(async(N,mt)=>{let ee=++B.current;Ie("Loading verified neighborhood\u2026");let ve=Jt.current?[Jt.current]:[],Tn=await ia(`/api/graph?symbol=${encodeURIComponent(N)}&path=${encodeURIComponent(mt)}&direction=both&depth=1&node_limit=80&edge_limit=160&${QE(je.current,ve)}`);ee===B.current&&(w(Tn),U.current=Tn,t(Tn.snapshot),Pe.current=Tn.snapshot,xt(Bi=>Tn.nodes.some(Dp=>String(Dp.node_id)===String(Bi))?Bi:null),Ie(""))},[]),ot=(0,dt.useCallback)(async(N,mt)=>{a("current"),await rt(N,mt)},[rt]),J=(0,dt.useCallback)(async()=>{let N=await ia("/api/architecture?scope=**&package_depth=2&limit=300");A(aT(N)),O(rT(N)),z(N.architecture_plan?.issues||[]),X(!!N.partial)},[]),$=(0,dt.useCallback)(async()=>{try{let N=await ia("/api/refactors?scope=**&min_score=760&limit=8");j(N),Z("")}catch(N){Z(nr(N))}},[]),ct=(0,dt.useCallback)(async()=>{try{let N=await ia("/api/runtime-status");st(N),At("");let mt=N.environments||[];Jt.current&&!mt.includes(Jt.current)&&(Jt.current="",c(""))}catch(N){At(nr(N))}},[]),wt=(0,dt.useCallback)(async()=>{try{let N=await ia("/api/change-plan?limit=20");Kt(eT(N)),K("")}catch(N){Kt(null),K(nr(N))}},[]),ut=(0,dt.useCallback)(async()=>{await Promise.all([wt(),ct(),J(),$()])},[J,wt,$,ct]),lt=(0,dt.useCallback)(async(N=!0)=>{try{let mt=await ia("/api/status"),ee=f_(Pe.current),ve=f_(mt.snapshot),Tn=!!(ee&&ee!==ve);if(t(mt.snapshot),Pe.current=mt.snapshot,i(Tn?"refreshing":"live"),Tn&&N){yt(null),Ve(null),ae(null),await ut();let Bi=U.current?.root;Bi&&await rt(Bi.symbol,Bi.path),i("live")}}catch(mt){i("offline"),Ie(nr(mt))}},[rt,ut]);(0,dt.useEffect)(()=>{let N=!1;(async()=>{await lt(!1),N||await ut()})();let ee=window.setInterval(()=>{lt(!0)},2500);return()=>{N=!0,window.clearInterval(ee)}},[lt,ut]),(0,dt.useEffect)(()=>{let N=ee=>{let ve=q.current;if(!ve)return;let Tn=Math.max(.1,C.current.scale);p(Bi=>({...Bi,[ve.key]:{x:ve.origin.x+(ee.clientX-ve.x)/Tn,y:ve.origin.y+(ee.clientY-ve.y)/Tn}}))},mt=()=>{q.current=null};return document.addEventListener("pointermove",N),document.addEventListener("pointerup",mt),()=>{document.removeEventListener("pointermove",N),document.removeEventListener("pointerup",mt)}},[]);let Ct=async N=>{N.preventDefault();let mt=m.trim();if(mt)try{let ee=await ia(`/api/search?q=${encodeURIComponent(mt)}&scope=**&limit=12`);f(ee.matches),b(ee.total),T("")}catch(ee){T(nr(ee))}},Lt=N=>{xt(N.node_id),kt({kind:"package",facts:[["Package",N.symbol],["Community",N.community.replace("community:","")],["Files",N.files],["Symbols",N.symbols],["Incoming",N.fan_in],["Outgoing",N.fan_out],["Cycle",N.cycle?"candidate package cycle":"none detected"]],representatives:N.representatives}),x.current?.focusNode(N.node_id)},Gt=async N=>{xt(N.node_id);let mt=[["Symbol",N.symbol],["Path",N.path],["Span",N.span?`${N.span.start}\u2013${N.span.end}`:"unknown"],["Source hash",N.source_hash],["State",N.status==="hypothetical"?"hypothetical future":N.lane==="tests"?"candidate \xB7 not run":"current \xB7 indexed"]];if(N.kind==="package"&&mt.push(["Files",N.files],["Symbols",N.symbols],["Fan in",N.fan_in],["Fan out",N.fan_out],["Cycle",N.cycle?"candidate package cycle":"none detected"]),kt({kind:N.lane||"node",facts:mt}),N.kind!=="package")try{let ee=await ia(`/api/snippet?symbol=${encodeURIComponent(N.symbol)}&path=${encodeURIComponent(N.path)}`);kt({kind:N.lane||"node",facts:mt,code:ee.source||ee.declaration||"Source unavailable."})}catch(ee){kt({kind:N.lane||"node",facts:mt,error:nr(ee)})}},L=(N,mt,ee)=>{let ve=typeof N.evidence=="object"&&N.evidence?N.evidence:{};kt({kind:"edge",facts:[["Relationship",`${mt.symbol} \u2192 ${ee.symbol}`],["Kind",N.relation],["Confidence",N.confidence],["Resolver","resolver"in ve?ve.resolver:"indexed"],["Evidence site","path"in ve?`${ve.path}:${ve.span?.start??"?"}`:"hypothetical"],["Source hash","source_hash"in ve?ve.source_hash:"not applicable"],...N.count?[["Observed calls",N.count],["Environments",(N.environments||[]).join(", ")],["Last seen",N.last_seen_unix_nanos]]:[]]})},ht=N=>{a("changes"),kt({kind:"mission",facts:[["Mission",N.mission_id],["Kind",N.kind],["Parallel group",N.parallel_group+1],["Depends on",N.depends_on?.join(", ")||"none"],["Change paths",N.change_paths?.join(", ")||"none"],["Review paths",N.review_paths?.join(", ")||"none"],["Evidence",N.evidenceCount],["Candidate tests",N.testCount],["Coverage",N.blocked_by_gaps?"blocked by gaps":"ready for review"],["Steps",N.steps?.join(" \u2192 ")||"inspect"]]})},Q=(N,mt=Ft)=>{let ee=mt?{...N,agent_handoff:iT(e,mt,N)}:N;ae(ee)},ft=N=>{yt(N),Ve(null),a("current"),Q(N.strategies[0],null),rt(N.left.symbol,N.left.path)},vt=N=>{yt(null),Ve(N),a("architecture"),Q(N.strategies[0],N)},it=async(N,mt)=>{await navigator.clipboard.writeText(N),Oe(mt)},Nt=()=>{It&&it(tT(It),"Agent plan copied")},Mt=()=>{if(Ft){it(JSON.stringify({tool:"get_architecture",arguments:{scope:"**",package_depth:2,limit:50},selected_issue_id:Ft.issue_id,selected_strategy_id:It?.strategy_id,revalidate_snapshot:e},null,2),"Architecture MCP call copied");return}Bt&&it(JSON.stringify({tool:"suggest_refactors",arguments:{scope:{include:["**"],exclude:[],relation_kinds:["CALLS","IMPLEMENTS"],max_depth:1},language:Bt.language,min_score:760,limit:8},revalidate_snapshot:e},null,2),"MCP call copied")},de=N=>{if(s==="project"){x.current?.zoom(N);return}d(mt=>({...mt,scale:CU(mt.scale*N,.45,2.4)}))},le=()=>{if(p({}),s==="project"){x.current?.resetView();return}d(hT)},ni=N=>{je.current=N,o(N);let mt=U.current?.root;mt&&rt(mt.symbol,mt.path).catch(ee=>Ie(nr(ee)))},bi=N=>{Jt.current=N,c(N);let mt=U.current?.root;mt&&rt(mt.symbol,mt.path).catch(ee=>Ie(nr(ee)))},Cp=N=>{s==="project"||N.target.closest?.("[data-graph-interactive='true']")||(k.current={pointerId:N.pointerId,x:N.clientX,y:N.clientY,camera:h},N.currentTarget.setPointerCapture(N.pointerId))},Rp=N=>{let mt=k.current;!mt||mt.pointerId!==N.pointerId||s==="project"||d({...mt.camera,x:mt.camera.x+N.clientX-mt.x,y:mt.camera.y+N.clientY-mt.y})},wu=()=>{k.current=null},Fr=(0,dt.useMemo)(()=>s==="architecture"?_?Ft&&It?oT(_,Ft,It):_:null:E?s==="preview"&&It?d_(E,It):E:null,[_,E,s,Ft,It]),Np=s==="project"?"Project map":s==="architecture"?Ft&&It?`Architecture \xB7 ${It.policy.replaceAll("_"," ")}`:"Architecture":s==="changes"?"Change missions":s==="history"?"Git history":E?.root.symbol||"Focused graph",Au=s==="project"?"Repository topology":s==="architecture"?"Architecture projection":s==="changes"?"Deterministic execution DAG":s==="history"?"Repository history":"Focused neighborhood",Gr=Y?sT(Y):{count:"0",note:""},Mi=F.slice(0,12),ts=nt?.insights?.rows||[],Rl=Ft?.strategies||Bt?.strategies||[];return(0,V.jsxs)(V.Fragment,{children:[(0,V.jsx)("a",{className:"skip-link",href:"#graph-canvas",children:"Skip to graph"}),(0,V.jsxs)("header",{className:"topbar",children:[(0,V.jsxs)("div",{className:"brand","aria-label":"CGRX Evidence Graph Explorer",children:[(0,V.jsx)("span",{className:"brand__mark","aria-hidden":"true",children:"CX"}),(0,V.jsxs)("span",{children:[(0,V.jsx)("strong",{children:"CGRX"}),(0,V.jsx)("small",{children:"Evidence Graph"})]})]}),(0,V.jsxs)("div",{className:"snapshot","aria-live":"polite",children:[(0,V.jsx)("span",{className:`badge badge--${n==="live"?"live":n==="connecting"?"loading":"stale"}`,children:n}),(0,V.jsx)("code",{children:e?`${e.repo_revision.slice(0,9)} \xB7 g${e.graph_generation}`:"loading snapshot"})]})]}),(0,V.jsxs)("main",{className:"workspace",children:[(0,V.jsxs)("aside",{className:"rail","aria-label":"Graph discovery",children:[(0,V.jsxs)("form",{className:"search",role:"search",onSubmit:N=>{Ct(N)},children:[(0,V.jsx)("label",{htmlFor:"search-input",children:"Find a symbol"}),(0,V.jsxs)("div",{className:"search__row",children:[(0,V.jsx)("input",{id:"search-input",value:m,onChange:N=>S(N.target.value),autoComplete:"off",placeholder:"Runtime, handler, save\u2026",required:!0}),(0,V.jsx)("button",{type:"submit","aria-label":"Search",children:"\u21B5"})]})]}),(0,V.jsx)(Tu,{title:"Matches",count:String(v),children:y?(0,V.jsx)("p",{className:"error",children:y}):g.length?g.map(N=>(0,V.jsx)(Al,{title:N.symbol,subtitle:`${N.path}:${N.span.start}`,onClick:()=>{ot(N.symbol,N.path)}},`${N.path}:${N.span.start}:${N.symbol}`)):(0,V.jsx)("p",{className:"quiet",children:"Search by intent or symbol."})}),(0,V.jsx)(Tu,{title:"Runtime intelligence",count:ts.length?`${ts.length}/${nt?.insights?.total??ts.length}`:"0",children:Dt?(0,V.jsx)("p",{className:"error",children:Dt}):ts.length?ts.map(N=>(0,V.jsx)(Al,{title:N.symbol,subtitle:`priority ${N.refactor_priority} \xB7 ${N.observed_count} calls \xB7 ${N.next_action.replaceAll("_"," ")}`,onClick:()=>{ot(N.symbol,N.path)}},`${N.path}:${N.symbol}`)):(0,V.jsx)("p",{className:"quiet",children:"Import a trace to rank hot paths, divergence and blast radius."})}),(0,V.jsx)(Tu,{title:"Architecture futures",count:`${Mi.length}${F.length>Mi.length?`/${F.length}`:""}${I?" \xB7 partial":""}`,maxClass:"architecture-future-list",children:Mi.length?Mi.map(N=>{let mt=N.strategies.find(Tn=>Tn.recommended)||N.strategies[0],ee=N.kind==="PACKAGE_DEPENDENCY_CYCLE"?(N.packages||[]).join(" \u2194 "):`${N.symbol?.symbol||"hotspot"} \xB7 ${Cl(N.symbol?.path||"unknown path",25)}`,ve=N.kind==="PACKAGE_DEPENDENCY_CYCLE"?`${N.selected_boundary?.edges||0} boundary edges`:`${N.symbol?.fan_in||0} proven callers`;return(0,V.jsx)(Al,{title:ee,subtitle:`${mt?.policy?.replaceAll("_"," ")||"inspect"} \xB7 ${ve}`,onClick:()=>vt(N)},N.issue_id)}):(0,V.jsx)("p",{className:"quiet",children:"No cycle or high fan-in future is available in this scope."})}),(0,V.jsx)(Tu,{title:"Change missions",count:se?`${se.totals.missions}${se.partial?" \xB7 partial":""}`:"0",maxClass:"mission-list",children:re?(0,V.jsx)("p",{className:"error",children:re}):se?.missions.length?se.missions.slice(0,12).map(N=>(0,V.jsx)(Al,{title:N.title,subtitle:`group ${N.parallel_group+1} \xB7 ${N.kind.replaceAll("_"," ")}${N.blocked_by_gaps?" \xB7 blocked":""}`,onClick:()=>ht(N)},N.mission_id)):(0,V.jsx)("p",{className:"quiet",children:"No source changes. The plan will appear as files change."})}),(0,V.jsx)(Tu,{title:"Refactor paths",count:Gr.count,grow:!0,children:at?(0,V.jsx)("p",{className:"error",children:at}):Y?.candidates.length?(0,V.jsxs)(V.Fragment,{children:[Y.candidates.map(N=>(0,V.jsx)(Al,{title:`${N.left.symbol} \u2194 ${N.right.symbol}`,subtitle:`${N.language} \xB7 score ${N.similarity.total}`,onClick:()=>ft(N)},`${N.left.node_id}:${N.right.node_id}`)),Gr.note&&(0,V.jsx)("p",{className:"quiet bounded-note",children:Gr.note})]}):(0,V.jsx)("p",{className:"quiet",children:"No candidate crossed the current threshold."})})]}),(0,V.jsxs)("section",{className:"stage","aria-labelledby":"graph-title",children:[(0,V.jsxs)("div",{className:"stage__toolbar",children:[(0,V.jsxs)("div",{children:[(0,V.jsx)("p",{className:"eyebrow",children:Au}),(0,V.jsx)("h1",{id:"graph-title",children:Np})]}),(0,V.jsx)("div",{className:"mode-switch",role:"group","aria-label":"Graph mode",children:mU.map(N=>(0,V.jsx)("button",{type:"button",className:s===N.id?"is-active":"",onClick:()=>a(N.id),children:N.label},N.id))}),(0,V.jsx)("div",{className:"evidence-switch",role:"group","aria-label":"Evidence layer",children:gU.map(N=>(0,V.jsx)("button",{type:"button",className:r===N.id?"is-active":"",onClick:()=>ni(N.id),children:N.label},N.id))}),(0,V.jsxs)("label",{className:"environment-filter",htmlFor:"runtime-environment",children:["Environment",(0,V.jsxs)("select",{id:"runtime-environment",value:l,onChange:N=>bi(N.target.value),children:[(0,V.jsx)("option",{value:"",children:"All"}),(nt?.environments||[]).map(N=>(0,V.jsx)("option",{value:N,children:N},N))]})]}),s!=="history"&&s!=="changes"&&(0,V.jsxs)("div",{className:"view-actions",children:[(0,V.jsx)("button",{type:"button",onClick:()=>de(1/1.2),"aria-label":"Zoom out",children:"\u2212"}),(0,V.jsx)("button",{type:"button",onClick:le,children:"Reset"}),(0,V.jsx)("button",{type:"button",onClick:()=>de(1.2),"aria-label":"Zoom in",children:"+"})]})]}),s==="history"?(0,V.jsx)(TU,{snapshot:e,onInspect:kt,onError:Ie}):s==="changes"?(0,V.jsx)(EU,{projection:se,onSelect:ht,onCopy:()=>se?.agent_handoff&&void it(nT(se),"Change mission handoff copied")}):(0,V.jsx)("div",{id:"graph-canvas",className:`graph-canvas${s==="project"?" graph-canvas--project":""}`,tabIndex:0,"aria-label":"Interactive code relationship graph",onWheel:N=>{s!=="project"&&(N.preventDefault(),de(N.deltaY<0?1.08:1/1.08))},onPointerDown:Cp,onPointerMove:Rp,onPointerUp:wu,onKeyDown:N=>{if(s==="project")return;let ee={ArrowLeft:[-28,0],ArrowRight:[28,0],ArrowUp:[0,-28],ArrowDown:[0,28]}[N.key];ee&&(N.preventDefault(),d(ve=>({...ve,x:ve.x+ee[0],y:ve.y+ee[1]})))},children:s==="project"&&R?(0,V.jsx)(yU,{ref:x,graph:R,selectedId:et,onNodeSelect:Lt,onNodeOpen:N=>{let mt=N.representatives?.[0];mt&&ot(mt.symbol,mt.path)},onEdgeSelect:L}):s==="compare"&&E&&It?(0,V.jsx)(SU,{current:E,future:d_(E,It),camera:h,selectedNodeId:et,pins:u,onSelectNode:N=>{Gt(N)},onInspectEdge:L,onNodeDrag:(N,mt)=>{q.current={key:String(mt.node_id??mt.id),x:N.clientX,y:N.clientY,origin:{x:mt.x,y:mt.y}}}}):Fr?(0,V.jsx)(xU,{graph:Fr,camera:h,selectedNodeId:et,pins:u,onSelectNode:N=>{Gt(N)},onInspectEdge:L,onNodeDrag:(N,mt)=>{q.current={key:String(mt.node_id??mt.id),x:N.clientX,y:N.clientY,origin:{x:mt.x,y:mt.y}}}}):(0,V.jsx)("div",{className:"graph-message",children:(0,V.jsx)("strong",{children:Ce||(s==="project"?"Building repository map\u2026":s==="architecture"?"Loading architecture projection\u2026":"Select a symbol to inspect its neighborhood.")})})}),s!=="history"&&s!=="changes"&&(0,V.jsxs)("footer",{className:"legend","aria-label":"Evidence legend",children:[(0,V.jsxs)("span",{children:[(0,V.jsx)("i",{className:"key key--proven",children:"\u2713"})," proven now"]}),(0,V.jsxs)("span",{children:[(0,V.jsx)("i",{className:"key key--gap",children:"?"})," unresolved gap"]}),(0,V.jsxs)("span",{children:[(0,V.jsx)("i",{className:"key key--future",children:"+"})," proposed future"]}),(0,V.jsxs)("span",{children:[(0,V.jsx)("i",{className:"key key--test",children:"T"})," candidate test \xB7 not run"]}),(0,V.jsxs)("span",{children:[(0,V.jsx)("i",{className:"key key--runtime",children:"\u25CF"})," observed runtime \xB7 width=count \xB7 opacity=age"]}),(0,V.jsx)("button",{className:"legend__action",type:"button",onClick:()=>E&&void it($E(E,ts),"Runtime agent context copied"),children:"Copy runtime agent context"})]})]}),(0,V.jsxs)("aside",{className:"inspector","aria-label":"Evidence inspector",children:[(0,V.jsxs)("div",{className:"section-title",children:[(0,V.jsx)("h2",{children:"Evidence"}),(0,V.jsx)("span",{children:ge.kind})]}),(0,V.jsx)(wU,{inspector:ge,onOpenRepresentative:(N,mt)=>{ot(N,mt)}}),Rl.length>0&&It&&(0,V.jsx)(AU,{strategies:Rl,selected:It,onSelect:N=>Q(N),onCopyAgent:Nt,onCopyMcp:Mt})]})]}),(0,V.jsx)("div",{className:"sr-only","aria-live":"polite",children:En})]})}function Tu({title:e,count:t,children:n,grow:i=!1,maxClass:s}){return(0,V.jsxs)("section",{className:`rail__section${i?" rail__section--grow":""}`,children:[(0,V.jsxs)("div",{className:"section-title",children:[(0,V.jsx)("h2",{children:e}),(0,V.jsx)("span",{children:t})]}),(0,V.jsx)("div",{className:"item-list",id:s,children:n})]})}function Al({title:e,subtitle:t,onClick:n}){return(0,V.jsxs)("button",{type:"button",className:"item",onClick:n,children:[(0,V.jsx)("strong",{children:e}),(0,V.jsx)("small",{children:t})]})}var yU=(0,dt.forwardRef)(function(t,n){let i=(0,dt.useRef)(null),s=(0,dt.useRef)(null),a=(0,dt.useRef)(t),[r,o]=(0,dt.useState)({width:980,height:620});a.current=t,(0,dt.useEffect)(()=>{let c=i.current;if(!c)return;s.current=ZE(c,{onNodeSelect:d=>a.current.onNodeSelect(d),onNodeOpen:d=>a.current.onNodeOpen(d),onEdgeSelect:(d,u,p)=>a.current.onEdgeSelect(d,u,p)});let h=new ResizeObserver(()=>{let d=c.parentElement;d&&o({width:Math.max(1,d.clientWidth),height:Math.max(1,d.clientHeight)})});return c.parentElement&&h.observe(c.parentElement),()=>{h.disconnect(),s.current?.dispose(),s.current=null}},[]);let l=(0,dt.useMemo)(()=>ZM(t.graph,{width:r.width,height:r.height,pins:{}}),[t.graph,r.height,r.width]);return(0,dt.useEffect)(()=>{s.current?.render(t.graph,l,{selectedId:t.selectedId})},[l,t.graph]),(0,dt.useEffect)(()=>{s.current?.setSelected(t.selectedId)},[t.selectedId]),(0,dt.useImperativeHandle)(n,()=>({zoom:c=>s.current?.zoom(c),resetView:()=>s.current?.resetView(),focusNode:c=>s.current?.focusNode(c)}),[]),(0,V.jsx)("canvas",{ref:i,className:"project-three-canvas","aria-label":"Three-dimensional repository dependency map"})});function xU({graph:e,camera:t,selectedNodeId:n,pins:i,onSelectNode:s,onInspectEdge:a,onNodeDrag:r}){let o=(0,dt.useMemo)(()=>xd(e,{width:980,height:620,pins:i}),[e,i]);return(0,V.jsx)("svg",{id:"graph-svg",viewBox:"0 0 980 620",preserveAspectRatio:"xMidYMid meet",role:"img","aria-label":"Focused code relationship graph",children:(0,V.jsx)(g_,{graph:e,layout:o,transform:`translate(${t.x} ${t.y}) scale(${t.scale})`,selectedNodeId:n,onSelectNode:s,onInspectEdge:a,onNodeDrag:r})})}function SU({current:e,future:t,camera:n,selectedNodeId:i,pins:s,onSelectNode:a,onInspectEdge:r,onNodeDrag:o}){let l=(0,dt.useMemo)(()=>xd(e,{width:980,height:620,pins:s}),[e,s]),c=(0,dt.useMemo)(()=>xd(t,{width:980,height:620,pins:s}),[t,s]);return(0,V.jsx)("svg",{id:"graph-svg",viewBox:"0 0 980 620",preserveAspectRatio:"xMidYMid meet",role:"img","aria-label":"Current and proposed code graphs",children:(0,V.jsxs)("g",{transform:`translate(${n.x} ${n.y}) scale(${n.scale})`,children:[(0,V.jsx)("text",{x:"34",y:"34",className:"comparison-title",children:"CURRENT EVIDENCE"}),(0,V.jsx)("text",{x:"524",y:"34",className:"comparison-title",children:"SELECTED FUTURE"}),(0,V.jsx)(g_,{graph:e,layout:l,transform:"translate(0 46) scale(.5)",selectedNodeId:i,onSelectNode:a,onInspectEdge:r,onNodeDrag:o}),(0,V.jsx)(g_,{graph:t,layout:c,transform:"translate(490 46) scale(.5)",selectedNodeId:i,onSelectNode:a,onInspectEdge:r,onNodeDrag:o})]})})}function g_({graph:e,layout:t,transform:n,selectedNodeId:i,onSelectNode:s,onInspectEdge:a,onNodeDrag:r}){let o=new Map(t.nodes.map(c=>[String(c.node_id),c]));return(0,V.jsxs)("g",{transform:n,children:[[["CALLERS",96,54],["ENTRY POINT",382,54],["CALLEES",668,54],["TESTS \xB7 NOT RUN",382,380]].map(([c,h,d])=>(0,V.jsx)("text",{x:h,y:d,className:"lane-label",children:c},c)),t.containers.map(c=>(0,V.jsxs)(dt.default.Fragment,{children:[(0,V.jsx)("rect",{x:c.x,y:c.y,width:c.width,height:c.height,className:"file-container"}),(0,V.jsx)("text",{x:c.x+10,y:c.y+17,className:"file-label",children:Cl(c.path,46)})]},c.id)),(e.edges||[]).map((c,h)=>{let d=o.get(String(c.source)),u=o.get(String(c.target));return d&&u?(0,V.jsx)(bU,{edge:c,source:d,target:u,onInspect:a},`${c.source}:${c.target}:${c.relation}:${h}`):null}),t.nodes.map(c=>(0,V.jsx)(MU,{node:c,selected:String(i)===String(c.node_id),onSelect:s,onDrag:r},String(c.node_id??c.id)))]})}function bU({edge:e,source:t,target:n,onInspect:i}){let s=t.x+t.width,a=t.y+t.height/2,r=n.x,o=n.y+n.height/2,l=(s+r)/2,c=KM(e),h=JE(e);return(0,V.jsxs)("g",{"data-graph-interactive":"true",tabIndex:0,role:"button","aria-label":`${t.symbol} ${e.relation} ${n.symbol}, ${e.confidence||"unknown confidence"}`,onClick:()=>i(e,t,n),onKeyDown:d=>{(d.key==="Enter"||d.key===" ")&&(d.preventDefault(),i(e,t,n))},children:[(0,V.jsx)("path",{d:`M ${s} ${a} H ${l} V ${o} H ${r}`,className:c.className,strokeDasharray:h?.dash||c.dash,strokeWidth:h?.width||1.7,opacity:h?.opacity||1}),(0,V.jsx)("text",{x:l+5,y:o-6,className:"edge-label",children:h?.marker||c.marker})]})}function MU({node:e,selected:t,onSelect:n,onDrag:i}){let s=["node",e.lane==="tests"?"node--test":"",e.changed?"node--changed":"",e.status==="hypothetical"?"node--future":"",e.status==="remove"?"node--remove":"",e.pinned?"node--pinned":"",t?"is-selected":""].filter(Boolean).join(" ");return(0,V.jsxs)("g",{"data-graph-interactive":"true",transform:`translate(${e.x} ${e.y})`,className:s,tabIndex:0,role:"button","aria-label":`${e.symbol}, ${e.path}, ${e.lane}`,onClick:()=>n(e),onKeyDown:a=>{(a.key==="Enter"||a.key===" ")&&(a.preventDefault(),n(e))},onPointerDown:a=>{a.stopPropagation(),i(a,e)},children:[(0,V.jsx)("rect",{width:e.width,height:e.height}),(0,V.jsx)("circle",{cx:"15",cy:"17",r:"4",className:"node__status"}),(0,V.jsx)("text",{x:"27",y:"21",className:"node__title",children:Cl(e.symbol,27)}),(0,V.jsx)("text",{x:"14",y:"45",className:"node__path",children:Cl(e.path,31)})]})}function EU({projection:e,onSelect:t,onCopy:n}){if(!e)return(0,V.jsx)("div",{className:"mission-panel",children:(0,V.jsx)("p",{className:"quiet",children:"Loading change missions\u2026"})});let i=e.totals;return(0,V.jsxs)("div",{className:"mission-panel","aria-label":"Change mission execution graph",children:[(0,V.jsxs)("div",{className:"mission-panel__header",children:[(0,V.jsxs)("div",{children:[(0,V.jsx)("p",{className:"eyebrow",children:"Deterministic execution DAG"}),(0,V.jsxs)("p",{className:"quiet",children:[i.missions," missions \xB7 ",i.parallel_groups," sequential groups \xB7 ",i.blocked," blocked by coverage gaps"]})]}),(0,V.jsx)("button",{type:"button",className:"mission-copy",onClick:n,children:"Copy agent handoff"})]}),(0,V.jsx)("div",{className:"mission-dag",children:e.groups.map(s=>(0,V.jsxs)("section",{className:"mission-group",children:[(0,V.jsxs)("h2",{children:["Group ",s.index+1]}),(0,V.jsx)("p",{children:s.missions.length>1?`${s.missions.length} missions can run in parallel`:"Run after dependencies"}),s.missions.map(a=>{let r=a.blocked_by_gaps?"blocked \xB7 inspect gaps":a.depends_on?.length?`after ${a.depends_on.length}`:"ready";return(0,V.jsxs)("button",{type:"button",className:`mission-card${a.blocked_by_gaps?" mission-card--blocked":""}`,onClick:()=>t(a),children:[(0,V.jsx)("span",{className:"mission-card__kind",children:a.kind.replaceAll("_"," ")}),(0,V.jsx)("strong",{children:Cl(a.title,38)}),(0,V.jsxs)("small",{children:[a.evidenceCount," evidence \xB7 ",a.testCount," tests"]}),(0,V.jsx)("small",{children:r})]},a.mission_id)})]},s.index))})]})}function TU({snapshot:e,onInspect:t,onError:n}){let i=(0,dt.useRef)(null);return(0,dt.useEffect)(()=>{let s=i.current;if(!s)return;s.theme="dark",s.density="compact",s.columns="commit",s.dateFormat="relative",s.avatars=!1,s.provider=new Sd(ia);let a=o=>{let c=o.detail.commit,h=(s.data?.refs||[]).filter(d=>d.target===c.oid).map(d=>d.name);t({kind:"commit",facts:[["Commit",c.oid],["Subject",c.message],["Author",c.author?.name],["Authored",c.authoredAt],["Parents",c.parents?.join(", ")||"root"],["Refs",h.join(", ")||"none"]]})},r=o=>n(o.detail?.error?.message||"Git history request failed");return s.addEventListener("gitgraph-commit-select",a),s.addEventListener("gitgraph-error",r),()=>{s.removeEventListener("gitgraph-commit-select",a),s.removeEventListener("gitgraph-error",r)}},[n,t]),(0,dt.useEffect)(()=>{e&&i.current?.refresh?.()},[e]),(0,V.jsx)("div",{className:"git-history-panel",children:dt.default.createElement("web-git-graph",{ref:i,"aria-label":"Git commit history"})})}function wU({inspector:e,onOpenRepresentative:t}){return(0,V.jsxs)("div",{className:"inspector__content",children:[e.facts.length?(0,V.jsx)("dl",{children:e.facts.map(([n,i],s)=>(0,V.jsxs)("div",{className:"fact",children:[(0,V.jsx)("dt",{children:n}),(0,V.jsx)("dd",{children:(0,V.jsx)("code",{children:String(i??"unknown")})})]},`${n}:${s}`))}):(0,V.jsx)("p",{className:"quiet",children:"Select a node or edge to inspect its source identity, resolver and confidence."}),e.representatives?.length?(0,V.jsxs)("div",{className:"project-representatives",children:[(0,V.jsx)("p",{className:"quiet",children:"Representative symbols \xB7 open focused graph"}),e.representatives.map(n=>(0,V.jsx)(Al,{title:n.symbol,subtitle:Cl(n.path,34),onClick:()=>t(n.symbol,n.path)},String(n.node_id)))]}):null,e.code&&(0,V.jsx)("pre",{className:"code",children:e.code}),e.error&&(0,V.jsx)("p",{className:"error",children:e.error})]})}function AU({strategies:e,selected:t,onSelect:n,onCopyAgent:i,onCopyMcp:s}){let a=t.status==="blocked_by_gaps",r=t.summary||`${(t.counterfactual?.reasons||[]).map(o=>o.replaceAll("_"," ")).join(" \xB7 ")} \xB7 graph ${JSON.stringify(t.predicted_graph||{})}`;return(0,V.jsxs)("section",{className:"strategy-panel",children:[(0,V.jsx)("div",{className:"strategy-tabs",role:"tablist","aria-label":"Refactor strategies",children:e.map(o=>(0,V.jsx)("button",{type:"button",role:"tab","aria-selected":o.strategy_id===t.strategy_id,onClick:()=>n(o),children:o.policy.replaceAll("_"," ")},o.strategy_id))}),(0,V.jsxs)("div",{children:[(0,V.jsx)("p",{className:"strategy-summary",children:r}),(0,V.jsx)("span",{className:`risk${a?" risk--blocked":""}`,children:a?"blocked by gaps":`${t.counterfactual?.score??t.risk} \xB7 hypothetical`})]}),(0,V.jsxs)("div",{className:"copy-actions",children:[(0,V.jsx)("button",{type:"button",onClick:i,children:"Copy agent plan"}),(0,V.jsx)("button",{type:"button",className:"button--quiet",onClick:s,children:"Copy MCP call"})]})]})}function nr(e){return e instanceof Error?e.message:String(e)}function Cl(e,t){let n=String(e??"");return n.length<=t?n:`${n.slice(0,t-1)}\u2026`}function CU(e,t,n){return Math.max(t,Math.min(n,e))}var pT=document.getElementById("root");if(!pT)throw new Error("CGRX visualizer root is missing");(0,dT.createRoot)(pT).render((0,V.jsx)(_U,{}));
