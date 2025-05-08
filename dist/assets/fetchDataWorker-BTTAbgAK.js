var CD = Object.defineProperty;
var AD = (n, t, e) => t in n ? CD(n, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : n[t] = e;
var we = (n, t, e) => AD(n, typeof t != "symbol" ? t + "" : t, e);
var eu = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function is(n) {
  return n && n.__esModule && Object.prototype.hasOwnProperty.call(n, "default") ? n.default : n;
}
var Va = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
Va.exports;
(function(n, t) {
  (function() {
    var e, a = "4.17.21", f = 200, s = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", h = "Expected a function", l = "Invalid `variable` option passed into `_.template`", D = "__lodash_hash_undefined__", c = 500, d = "__lodash_placeholder__", x = 1, C = 2, E = 4, I = 1, B = 2, M = 1, T = 2, G = 4, P = 8, $ = 16, L = 32, Q = 64, z = 128, Z = 256, J = 512, ee = 30, K = "...", ie = 800, Ce = 16, be = 1, Pe = 2, Ne = 3, ve = 1 / 0, Fe = 9007199254740991, xn = 17976931348623157e292, mt = NaN, me = 4294967295, et = me - 1, Vt = me >>> 1, Me = [
      ["ary", z],
      ["bind", M],
      ["bindKey", T],
      ["curry", P],
      ["curryRight", $],
      ["flip", J],
      ["partial", L],
      ["partialRight", Q],
      ["rearg", Z]
    ], yt = "[object Arguments]", Xt = "[object Array]", sr = "[object AsyncFunction]", _t = "[object Boolean]", St = "[object Date]", Fr = "[object DOMException]", Fn = "[object Error]", pn = "[object Function]", Kt = "[object GeneratorFunction]", ut = "[object Map]", qn = "[object Number]", gs = "[object Null]", Mt = "[object Object]", Ou = "[object Promise]", _s = "[object Proxy]", or = "[object RegExp]", wt = "[object Set]", bt = "[object String]", fr = "[object Symbol]", ws = "[object Undefined]", It = "[object WeakMap]", bs = "[object WeakSet]", m = "[object ArrayBuffer]", _ = "[object DataView]", w = "[object Float32Array]", F = "[object Float64Array]", R = "[object Int8Array]", U = "[object Int16Array]", H = "[object Int32Array]", ce = "[object Uint8Array]", Ue = "[object Uint8ClampedArray]", Le = "[object Uint16Array]", ze = "[object Uint32Array]", $e = /\b__p \+= '';/g, Z1 = /\b(__p \+=) '' \+/g, V1 = /(__e\(.*?\)|\b__t\)) \+\n'';/g, nl = /&(?:amp|lt|gt|quot|#39);/g, rl = /[&<>"']/g, X1 = RegExp(nl.source), K1 = RegExp(rl.source), Y1 = /<%-([\s\S]+?)%>/g, Q1 = /<%([\s\S]+?)%>/g, il = /<%=([\s\S]+?)%>/g, J1 = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, j1 = /^\w*$/, ep = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, vs = /[\\^$.*+?()[\]{}|]/g, tp = RegExp(vs.source), Ds = /^\s+/, np = /\s/, rp = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, ip = /\{\n\/\* \[wrapped with (.+)\] \*/, up = /,? & /, ap = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, sp = /[()=,{}\[\]\/\s]/, op = /\\(\\)?/g, fp = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, ul = /\w*$/, lp = /^[-+]0x[0-9a-f]+$/i, hp = /^0b[01]+$/i, cp = /^\[object .+?Constructor\]$/, dp = /^0o[0-7]+$/i, pp = /^(?:0|[1-9]\d*)$/, gp = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, Pu = /($^)/, _p = /['\n\r\u2028\u2029\\]/g, Mu = "\\ud800-\\udfff", wp = "\\u0300-\\u036f", bp = "\\ufe20-\\ufe2f", vp = "\\u20d0-\\u20ff", al = wp + bp + vp, sl = "\\u2700-\\u27bf", ol = "a-z\\xdf-\\xf6\\xf8-\\xff", Dp = "\\xac\\xb1\\xd7\\xf7", mp = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", yp = "\\u2000-\\u206f", Ep = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", fl = "A-Z\\xc0-\\xd6\\xd8-\\xde", ll = "\\ufe0e\\ufe0f", hl = Dp + mp + yp + Ep, ms = "['’]", Cp = "[" + Mu + "]", cl = "[" + hl + "]", Uu = "[" + al + "]", dl = "\\d+", Ap = "[" + sl + "]", pl = "[" + ol + "]", gl = "[^" + Mu + hl + dl + sl + ol + fl + "]", ys = "\\ud83c[\\udffb-\\udfff]", xp = "(?:" + Uu + "|" + ys + ")", _l = "[^" + Mu + "]", Es = "(?:\\ud83c[\\udde6-\\uddff]){2}", Cs = "[\\ud800-\\udbff][\\udc00-\\udfff]", ii = "[" + fl + "]", wl = "\\u200d", bl = "(?:" + pl + "|" + gl + ")", Fp = "(?:" + ii + "|" + gl + ")", vl = "(?:" + ms + "(?:d|ll|m|re|s|t|ve))?", Dl = "(?:" + ms + "(?:D|LL|M|RE|S|T|VE))?", ml = xp + "?", yl = "[" + ll + "]?", Bp = "(?:" + wl + "(?:" + [_l, Es, Cs].join("|") + ")" + yl + ml + ")*", Sp = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", Ip = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", El = yl + ml + Bp, kp = "(?:" + [Ap, Es, Cs].join("|") + ")" + El, Tp = "(?:" + [_l + Uu + "?", Uu, Es, Cs, Cp].join("|") + ")", $p = RegExp(ms, "g"), Rp = RegExp(Uu, "g"), As = RegExp(ys + "(?=" + ys + ")|" + Tp + El, "g"), Np = RegExp([
      ii + "?" + pl + "+" + vl + "(?=" + [cl, ii, "$"].join("|") + ")",
      Fp + "+" + Dl + "(?=" + [cl, ii + bl, "$"].join("|") + ")",
      ii + "?" + bl + "+" + vl,
      ii + "+" + Dl,
      Ip,
      Sp,
      dl,
      kp
    ].join("|"), "g"), Lp = RegExp("[" + wl + Mu + al + ll + "]"), Op = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, Pp = [
      "Array",
      "Buffer",
      "DataView",
      "Date",
      "Error",
      "Float32Array",
      "Float64Array",
      "Function",
      "Int8Array",
      "Int16Array",
      "Int32Array",
      "Map",
      "Math",
      "Object",
      "Promise",
      "RegExp",
      "Set",
      "String",
      "Symbol",
      "TypeError",
      "Uint8Array",
      "Uint8ClampedArray",
      "Uint16Array",
      "Uint32Array",
      "WeakMap",
      "_",
      "clearTimeout",
      "isFinite",
      "parseInt",
      "setTimeout"
    ], Mp = -1, He = {};
    He[w] = He[F] = He[R] = He[U] = He[H] = He[ce] = He[Ue] = He[Le] = He[ze] = !0, He[yt] = He[Xt] = He[m] = He[_t] = He[_] = He[St] = He[Fn] = He[pn] = He[ut] = He[qn] = He[Mt] = He[or] = He[wt] = He[bt] = He[It] = !1;
    var qe = {};
    qe[yt] = qe[Xt] = qe[m] = qe[_] = qe[_t] = qe[St] = qe[w] = qe[F] = qe[R] = qe[U] = qe[H] = qe[ut] = qe[qn] = qe[Mt] = qe[or] = qe[wt] = qe[bt] = qe[fr] = qe[ce] = qe[Ue] = qe[Le] = qe[ze] = !0, qe[Fn] = qe[pn] = qe[It] = !1;
    var Up = {
      // Latin-1 Supplement block.
      À: "A",
      Á: "A",
      Â: "A",
      Ã: "A",
      Ä: "A",
      Å: "A",
      à: "a",
      á: "a",
      â: "a",
      ã: "a",
      ä: "a",
      å: "a",
      Ç: "C",
      ç: "c",
      Ð: "D",
      ð: "d",
      È: "E",
      É: "E",
      Ê: "E",
      Ë: "E",
      è: "e",
      é: "e",
      ê: "e",
      ë: "e",
      Ì: "I",
      Í: "I",
      Î: "I",
      Ï: "I",
      ì: "i",
      í: "i",
      î: "i",
      ï: "i",
      Ñ: "N",
      ñ: "n",
      Ò: "O",
      Ó: "O",
      Ô: "O",
      Õ: "O",
      Ö: "O",
      Ø: "O",
      ò: "o",
      ó: "o",
      ô: "o",
      õ: "o",
      ö: "o",
      ø: "o",
      Ù: "U",
      Ú: "U",
      Û: "U",
      Ü: "U",
      ù: "u",
      ú: "u",
      û: "u",
      ü: "u",
      Ý: "Y",
      ý: "y",
      ÿ: "y",
      Æ: "Ae",
      æ: "ae",
      Þ: "Th",
      þ: "th",
      ß: "ss",
      // Latin Extended-A block.
      Ā: "A",
      Ă: "A",
      Ą: "A",
      ā: "a",
      ă: "a",
      ą: "a",
      Ć: "C",
      Ĉ: "C",
      Ċ: "C",
      Č: "C",
      ć: "c",
      ĉ: "c",
      ċ: "c",
      č: "c",
      Ď: "D",
      Đ: "D",
      ď: "d",
      đ: "d",
      Ē: "E",
      Ĕ: "E",
      Ė: "E",
      Ę: "E",
      Ě: "E",
      ē: "e",
      ĕ: "e",
      ė: "e",
      ę: "e",
      ě: "e",
      Ĝ: "G",
      Ğ: "G",
      Ġ: "G",
      Ģ: "G",
      ĝ: "g",
      ğ: "g",
      ġ: "g",
      ģ: "g",
      Ĥ: "H",
      Ħ: "H",
      ĥ: "h",
      ħ: "h",
      Ĩ: "I",
      Ī: "I",
      Ĭ: "I",
      Į: "I",
      İ: "I",
      ĩ: "i",
      ī: "i",
      ĭ: "i",
      į: "i",
      ı: "i",
      Ĵ: "J",
      ĵ: "j",
      Ķ: "K",
      ķ: "k",
      ĸ: "k",
      Ĺ: "L",
      Ļ: "L",
      Ľ: "L",
      Ŀ: "L",
      Ł: "L",
      ĺ: "l",
      ļ: "l",
      ľ: "l",
      ŀ: "l",
      ł: "l",
      Ń: "N",
      Ņ: "N",
      Ň: "N",
      Ŋ: "N",
      ń: "n",
      ņ: "n",
      ň: "n",
      ŋ: "n",
      Ō: "O",
      Ŏ: "O",
      Ő: "O",
      ō: "o",
      ŏ: "o",
      ő: "o",
      Ŕ: "R",
      Ŗ: "R",
      Ř: "R",
      ŕ: "r",
      ŗ: "r",
      ř: "r",
      Ś: "S",
      Ŝ: "S",
      Ş: "S",
      Š: "S",
      ś: "s",
      ŝ: "s",
      ş: "s",
      š: "s",
      Ţ: "T",
      Ť: "T",
      Ŧ: "T",
      ţ: "t",
      ť: "t",
      ŧ: "t",
      Ũ: "U",
      Ū: "U",
      Ŭ: "U",
      Ů: "U",
      Ű: "U",
      Ų: "U",
      ũ: "u",
      ū: "u",
      ŭ: "u",
      ů: "u",
      ű: "u",
      ų: "u",
      Ŵ: "W",
      ŵ: "w",
      Ŷ: "Y",
      ŷ: "y",
      Ÿ: "Y",
      Ź: "Z",
      Ż: "Z",
      Ž: "Z",
      ź: "z",
      ż: "z",
      ž: "z",
      Ĳ: "IJ",
      ĳ: "ij",
      Œ: "Oe",
      œ: "oe",
      ŉ: "'n",
      ſ: "s"
    }, zp = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }, qp = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'"
    }, Gp = {
      "\\": "\\",
      "'": "'",
      "\n": "n",
      "\r": "r",
      "\u2028": "u2028",
      "\u2029": "u2029"
    }, Wp = parseFloat, Hp = parseInt, Cl = typeof eu == "object" && eu && eu.Object === Object && eu, Zp = typeof self == "object" && self && self.Object === Object && self, ct = Cl || Zp || Function("return this")(), xs = t && !t.nodeType && t, Br = xs && !0 && n && !n.nodeType && n, Al = Br && Br.exports === xs, Fs = Al && Cl.process, Yt = function() {
      try {
        var N = Br && Br.require && Br.require("util").types;
        return N || Fs && Fs.binding && Fs.binding("util");
      } catch {
      }
    }(), xl = Yt && Yt.isArrayBuffer, Fl = Yt && Yt.isDate, Bl = Yt && Yt.isMap, Sl = Yt && Yt.isRegExp, Il = Yt && Yt.isSet, kl = Yt && Yt.isTypedArray;
    function Ut(N, W, q) {
      switch (q.length) {
        case 0:
          return N.call(W);
        case 1:
          return N.call(W, q[0]);
        case 2:
          return N.call(W, q[0], q[1]);
        case 3:
          return N.call(W, q[0], q[1], q[2]);
      }
      return N.apply(W, q);
    }
    function Vp(N, W, q, re) {
      for (var fe = -1, Ie = N == null ? 0 : N.length; ++fe < Ie; ) {
        var at = N[fe];
        W(re, at, q(at), N);
      }
      return re;
    }
    function Qt(N, W) {
      for (var q = -1, re = N == null ? 0 : N.length; ++q < re && W(N[q], q, N) !== !1; )
        ;
      return N;
    }
    function Xp(N, W) {
      for (var q = N == null ? 0 : N.length; q-- && W(N[q], q, N) !== !1; )
        ;
      return N;
    }
    function Tl(N, W) {
      for (var q = -1, re = N == null ? 0 : N.length; ++q < re; )
        if (!W(N[q], q, N))
          return !1;
      return !0;
    }
    function lr(N, W) {
      for (var q = -1, re = N == null ? 0 : N.length, fe = 0, Ie = []; ++q < re; ) {
        var at = N[q];
        W(at, q, N) && (Ie[fe++] = at);
      }
      return Ie;
    }
    function zu(N, W) {
      var q = N == null ? 0 : N.length;
      return !!q && ui(N, W, 0) > -1;
    }
    function Bs(N, W, q) {
      for (var re = -1, fe = N == null ? 0 : N.length; ++re < fe; )
        if (q(W, N[re]))
          return !0;
      return !1;
    }
    function Xe(N, W) {
      for (var q = -1, re = N == null ? 0 : N.length, fe = Array(re); ++q < re; )
        fe[q] = W(N[q], q, N);
      return fe;
    }
    function hr(N, W) {
      for (var q = -1, re = W.length, fe = N.length; ++q < re; )
        N[fe + q] = W[q];
      return N;
    }
    function Ss(N, W, q, re) {
      var fe = -1, Ie = N == null ? 0 : N.length;
      for (re && Ie && (q = N[++fe]); ++fe < Ie; )
        q = W(q, N[fe], fe, N);
      return q;
    }
    function Kp(N, W, q, re) {
      var fe = N == null ? 0 : N.length;
      for (re && fe && (q = N[--fe]); fe--; )
        q = W(q, N[fe], fe, N);
      return q;
    }
    function Is(N, W) {
      for (var q = -1, re = N == null ? 0 : N.length; ++q < re; )
        if (W(N[q], q, N))
          return !0;
      return !1;
    }
    var Yp = ks("length");
    function Qp(N) {
      return N.split("");
    }
    function Jp(N) {
      return N.match(ap) || [];
    }
    function $l(N, W, q) {
      var re;
      return q(N, function(fe, Ie, at) {
        if (W(fe, Ie, at))
          return re = Ie, !1;
      }), re;
    }
    function qu(N, W, q, re) {
      for (var fe = N.length, Ie = q + (re ? 1 : -1); re ? Ie-- : ++Ie < fe; )
        if (W(N[Ie], Ie, N))
          return Ie;
      return -1;
    }
    function ui(N, W, q) {
      return W === W ? lg(N, W, q) : qu(N, Rl, q);
    }
    function jp(N, W, q, re) {
      for (var fe = q - 1, Ie = N.length; ++fe < Ie; )
        if (re(N[fe], W))
          return fe;
      return -1;
    }
    function Rl(N) {
      return N !== N;
    }
    function Nl(N, W) {
      var q = N == null ? 0 : N.length;
      return q ? $s(N, W) / q : mt;
    }
    function ks(N) {
      return function(W) {
        return W == null ? e : W[N];
      };
    }
    function Ts(N) {
      return function(W) {
        return N == null ? e : N[W];
      };
    }
    function Ll(N, W, q, re, fe) {
      return fe(N, function(Ie, at, Oe) {
        q = re ? (re = !1, Ie) : W(q, Ie, at, Oe);
      }), q;
    }
    function eg(N, W) {
      var q = N.length;
      for (N.sort(W); q--; )
        N[q] = N[q].value;
      return N;
    }
    function $s(N, W) {
      for (var q, re = -1, fe = N.length; ++re < fe; ) {
        var Ie = W(N[re]);
        Ie !== e && (q = q === e ? Ie : q + Ie);
      }
      return q;
    }
    function Rs(N, W) {
      for (var q = -1, re = Array(N); ++q < N; )
        re[q] = W(q);
      return re;
    }
    function tg(N, W) {
      return Xe(W, function(q) {
        return [q, N[q]];
      });
    }
    function Ol(N) {
      return N && N.slice(0, zl(N) + 1).replace(Ds, "");
    }
    function zt(N) {
      return function(W) {
        return N(W);
      };
    }
    function Ns(N, W) {
      return Xe(W, function(q) {
        return N[q];
      });
    }
    function Mi(N, W) {
      return N.has(W);
    }
    function Pl(N, W) {
      for (var q = -1, re = N.length; ++q < re && ui(W, N[q], 0) > -1; )
        ;
      return q;
    }
    function Ml(N, W) {
      for (var q = N.length; q-- && ui(W, N[q], 0) > -1; )
        ;
      return q;
    }
    function ng(N, W) {
      for (var q = N.length, re = 0; q--; )
        N[q] === W && ++re;
      return re;
    }
    var rg = Ts(Up), ig = Ts(zp);
    function ug(N) {
      return "\\" + Gp[N];
    }
    function ag(N, W) {
      return N == null ? e : N[W];
    }
    function ai(N) {
      return Lp.test(N);
    }
    function sg(N) {
      return Op.test(N);
    }
    function og(N) {
      for (var W, q = []; !(W = N.next()).done; )
        q.push(W.value);
      return q;
    }
    function Ls(N) {
      var W = -1, q = Array(N.size);
      return N.forEach(function(re, fe) {
        q[++W] = [fe, re];
      }), q;
    }
    function Ul(N, W) {
      return function(q) {
        return N(W(q));
      };
    }
    function cr(N, W) {
      for (var q = -1, re = N.length, fe = 0, Ie = []; ++q < re; ) {
        var at = N[q];
        (at === W || at === d) && (N[q] = d, Ie[fe++] = q);
      }
      return Ie;
    }
    function Gu(N) {
      var W = -1, q = Array(N.size);
      return N.forEach(function(re) {
        q[++W] = re;
      }), q;
    }
    function fg(N) {
      var W = -1, q = Array(N.size);
      return N.forEach(function(re) {
        q[++W] = [re, re];
      }), q;
    }
    function lg(N, W, q) {
      for (var re = q - 1, fe = N.length; ++re < fe; )
        if (N[re] === W)
          return re;
      return -1;
    }
    function hg(N, W, q) {
      for (var re = q + 1; re--; )
        if (N[re] === W)
          return re;
      return re;
    }
    function si(N) {
      return ai(N) ? dg(N) : Yp(N);
    }
    function gn(N) {
      return ai(N) ? pg(N) : Qp(N);
    }
    function zl(N) {
      for (var W = N.length; W-- && np.test(N.charAt(W)); )
        ;
      return W;
    }
    var cg = Ts(qp);
    function dg(N) {
      for (var W = As.lastIndex = 0; As.test(N); )
        ++W;
      return W;
    }
    function pg(N) {
      return N.match(As) || [];
    }
    function gg(N) {
      return N.match(Np) || [];
    }
    var _g = function N(W) {
      W = W == null ? ct : oi.defaults(ct.Object(), W, oi.pick(ct, Pp));
      var q = W.Array, re = W.Date, fe = W.Error, Ie = W.Function, at = W.Math, Oe = W.Object, Os = W.RegExp, wg = W.String, Jt = W.TypeError, Wu = q.prototype, bg = Ie.prototype, fi = Oe.prototype, Hu = W["__core-js_shared__"], Zu = bg.toString, Re = fi.hasOwnProperty, vg = 0, ql = function() {
        var i = /[^.]+$/.exec(Hu && Hu.keys && Hu.keys.IE_PROTO || "");
        return i ? "Symbol(src)_1." + i : "";
      }(), Vu = fi.toString, Dg = Zu.call(Oe), mg = ct._, yg = Os(
        "^" + Zu.call(Re).replace(vs, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
      ), Xu = Al ? W.Buffer : e, dr = W.Symbol, Ku = W.Uint8Array, Gl = Xu ? Xu.allocUnsafe : e, Yu = Ul(Oe.getPrototypeOf, Oe), Wl = Oe.create, Hl = fi.propertyIsEnumerable, Qu = Wu.splice, Zl = dr ? dr.isConcatSpreadable : e, Ui = dr ? dr.iterator : e, Sr = dr ? dr.toStringTag : e, Ju = function() {
        try {
          var i = Rr(Oe, "defineProperty");
          return i({}, "", {}), i;
        } catch {
        }
      }(), Eg = W.clearTimeout !== ct.clearTimeout && W.clearTimeout, Cg = re && re.now !== ct.Date.now && re.now, Ag = W.setTimeout !== ct.setTimeout && W.setTimeout, ju = at.ceil, ea = at.floor, Ps = Oe.getOwnPropertySymbols, xg = Xu ? Xu.isBuffer : e, Vl = W.isFinite, Fg = Wu.join, Bg = Ul(Oe.keys, Oe), st = at.max, vt = at.min, Sg = re.now, Ig = W.parseInt, Xl = at.random, kg = Wu.reverse, Ms = Rr(W, "DataView"), zi = Rr(W, "Map"), Us = Rr(W, "Promise"), li = Rr(W, "Set"), qi = Rr(W, "WeakMap"), Gi = Rr(Oe, "create"), ta = qi && new qi(), hi = {}, Tg = Nr(Ms), $g = Nr(zi), Rg = Nr(Us), Ng = Nr(li), Lg = Nr(qi), na = dr ? dr.prototype : e, Wi = na ? na.valueOf : e, Kl = na ? na.toString : e;
      function y(i) {
        if (je(i) && !le(i) && !(i instanceof ye)) {
          if (i instanceof jt)
            return i;
          if (Re.call(i, "__wrapped__"))
            return Yh(i);
        }
        return new jt(i);
      }
      var ci = /* @__PURE__ */ function() {
        function i() {
        }
        return function(u) {
          if (!Je(u))
            return {};
          if (Wl)
            return Wl(u);
          i.prototype = u;
          var o = new i();
          return i.prototype = e, o;
        };
      }();
      function ra() {
      }
      function jt(i, u) {
        this.__wrapped__ = i, this.__actions__ = [], this.__chain__ = !!u, this.__index__ = 0, this.__values__ = e;
      }
      y.templateSettings = {
        /**
         * Used to detect `data` property values to be HTML-escaped.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        escape: Y1,
        /**
         * Used to detect code to be evaluated.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        evaluate: Q1,
        /**
         * Used to detect `data` property values to inject.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        interpolate: il,
        /**
         * Used to reference the data object in the template text.
         *
         * @memberOf _.templateSettings
         * @type {string}
         */
        variable: "",
        /**
         * Used to import variables into the compiled template.
         *
         * @memberOf _.templateSettings
         * @type {Object}
         */
        imports: {
          /**
           * A reference to the `lodash` function.
           *
           * @memberOf _.templateSettings.imports
           * @type {Function}
           */
          _: y
        }
      }, y.prototype = ra.prototype, y.prototype.constructor = y, jt.prototype = ci(ra.prototype), jt.prototype.constructor = jt;
      function ye(i) {
        this.__wrapped__ = i, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = me, this.__views__ = [];
      }
      function Og() {
        var i = new ye(this.__wrapped__);
        return i.__actions__ = kt(this.__actions__), i.__dir__ = this.__dir__, i.__filtered__ = this.__filtered__, i.__iteratees__ = kt(this.__iteratees__), i.__takeCount__ = this.__takeCount__, i.__views__ = kt(this.__views__), i;
      }
      function Pg() {
        if (this.__filtered__) {
          var i = new ye(this);
          i.__dir__ = -1, i.__filtered__ = !0;
        } else
          i = this.clone(), i.__dir__ *= -1;
        return i;
      }
      function Mg() {
        var i = this.__wrapped__.value(), u = this.__dir__, o = le(i), p = u < 0, v = o ? i.length : 0, A = Q2(0, v, this.__views__), S = A.start, k = A.end, O = k - S, V = p ? k : S - 1, X = this.__iteratees__, j = X.length, ne = 0, ue = vt(O, this.__takeCount__);
        if (!o || !p && v == O && ue == O)
          return vh(i, this.__actions__);
        var se = [];
        e:
          for (; O-- && ne < ue; ) {
            V += u;
            for (var pe = -1, oe = i[V]; ++pe < j; ) {
              var De = X[pe], Ae = De.iteratee, Wt = De.type, At = Ae(oe);
              if (Wt == Pe)
                oe = At;
              else if (!At) {
                if (Wt == be)
                  continue e;
                break e;
              }
            }
            se[ne++] = oe;
          }
        return se;
      }
      ye.prototype = ci(ra.prototype), ye.prototype.constructor = ye;
      function Ir(i) {
        var u = -1, o = i == null ? 0 : i.length;
        for (this.clear(); ++u < o; ) {
          var p = i[u];
          this.set(p[0], p[1]);
        }
      }
      function Ug() {
        this.__data__ = Gi ? Gi(null) : {}, this.size = 0;
      }
      function zg(i) {
        var u = this.has(i) && delete this.__data__[i];
        return this.size -= u ? 1 : 0, u;
      }
      function qg(i) {
        var u = this.__data__;
        if (Gi) {
          var o = u[i];
          return o === D ? e : o;
        }
        return Re.call(u, i) ? u[i] : e;
      }
      function Gg(i) {
        var u = this.__data__;
        return Gi ? u[i] !== e : Re.call(u, i);
      }
      function Wg(i, u) {
        var o = this.__data__;
        return this.size += this.has(i) ? 0 : 1, o[i] = Gi && u === e ? D : u, this;
      }
      Ir.prototype.clear = Ug, Ir.prototype.delete = zg, Ir.prototype.get = qg, Ir.prototype.has = Gg, Ir.prototype.set = Wg;
      function Gn(i) {
        var u = -1, o = i == null ? 0 : i.length;
        for (this.clear(); ++u < o; ) {
          var p = i[u];
          this.set(p[0], p[1]);
        }
      }
      function Hg() {
        this.__data__ = [], this.size = 0;
      }
      function Zg(i) {
        var u = this.__data__, o = ia(u, i);
        if (o < 0)
          return !1;
        var p = u.length - 1;
        return o == p ? u.pop() : Qu.call(u, o, 1), --this.size, !0;
      }
      function Vg(i) {
        var u = this.__data__, o = ia(u, i);
        return o < 0 ? e : u[o][1];
      }
      function Xg(i) {
        return ia(this.__data__, i) > -1;
      }
      function Kg(i, u) {
        var o = this.__data__, p = ia(o, i);
        return p < 0 ? (++this.size, o.push([i, u])) : o[p][1] = u, this;
      }
      Gn.prototype.clear = Hg, Gn.prototype.delete = Zg, Gn.prototype.get = Vg, Gn.prototype.has = Xg, Gn.prototype.set = Kg;
      function Wn(i) {
        var u = -1, o = i == null ? 0 : i.length;
        for (this.clear(); ++u < o; ) {
          var p = i[u];
          this.set(p[0], p[1]);
        }
      }
      function Yg() {
        this.size = 0, this.__data__ = {
          hash: new Ir(),
          map: new (zi || Gn)(),
          string: new Ir()
        };
      }
      function Qg(i) {
        var u = _a(this, i).delete(i);
        return this.size -= u ? 1 : 0, u;
      }
      function Jg(i) {
        return _a(this, i).get(i);
      }
      function jg(i) {
        return _a(this, i).has(i);
      }
      function e2(i, u) {
        var o = _a(this, i), p = o.size;
        return o.set(i, u), this.size += o.size == p ? 0 : 1, this;
      }
      Wn.prototype.clear = Yg, Wn.prototype.delete = Qg, Wn.prototype.get = Jg, Wn.prototype.has = jg, Wn.prototype.set = e2;
      function kr(i) {
        var u = -1, o = i == null ? 0 : i.length;
        for (this.__data__ = new Wn(); ++u < o; )
          this.add(i[u]);
      }
      function t2(i) {
        return this.__data__.set(i, D), this;
      }
      function n2(i) {
        return this.__data__.has(i);
      }
      kr.prototype.add = kr.prototype.push = t2, kr.prototype.has = n2;
      function _n(i) {
        var u = this.__data__ = new Gn(i);
        this.size = u.size;
      }
      function r2() {
        this.__data__ = new Gn(), this.size = 0;
      }
      function i2(i) {
        var u = this.__data__, o = u.delete(i);
        return this.size = u.size, o;
      }
      function u2(i) {
        return this.__data__.get(i);
      }
      function a2(i) {
        return this.__data__.has(i);
      }
      function s2(i, u) {
        var o = this.__data__;
        if (o instanceof Gn) {
          var p = o.__data__;
          if (!zi || p.length < f - 1)
            return p.push([i, u]), this.size = ++o.size, this;
          o = this.__data__ = new Wn(p);
        }
        return o.set(i, u), this.size = o.size, this;
      }
      _n.prototype.clear = r2, _n.prototype.delete = i2, _n.prototype.get = u2, _n.prototype.has = a2, _n.prototype.set = s2;
      function Yl(i, u) {
        var o = le(i), p = !o && Lr(i), v = !o && !p && br(i), A = !o && !p && !v && _i(i), S = o || p || v || A, k = S ? Rs(i.length, wg) : [], O = k.length;
        for (var V in i)
          (u || Re.call(i, V)) && !(S && // Safari 9 has enumerable `arguments.length` in strict mode.
          (V == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
          v && (V == "offset" || V == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
          A && (V == "buffer" || V == "byteLength" || V == "byteOffset") || // Skip index properties.
          Xn(V, O))) && k.push(V);
        return k;
      }
      function Ql(i) {
        var u = i.length;
        return u ? i[Qs(0, u - 1)] : e;
      }
      function o2(i, u) {
        return wa(kt(i), Tr(u, 0, i.length));
      }
      function f2(i) {
        return wa(kt(i));
      }
      function zs(i, u, o) {
        (o !== e && !wn(i[u], o) || o === e && !(u in i)) && Hn(i, u, o);
      }
      function Hi(i, u, o) {
        var p = i[u];
        (!(Re.call(i, u) && wn(p, o)) || o === e && !(u in i)) && Hn(i, u, o);
      }
      function ia(i, u) {
        for (var o = i.length; o--; )
          if (wn(i[o][0], u))
            return o;
        return -1;
      }
      function l2(i, u, o, p) {
        return pr(i, function(v, A, S) {
          u(p, v, o(v), S);
        }), p;
      }
      function Jl(i, u) {
        return i && Sn(u, lt(u), i);
      }
      function h2(i, u) {
        return i && Sn(u, $t(u), i);
      }
      function Hn(i, u, o) {
        u == "__proto__" && Ju ? Ju(i, u, {
          configurable: !0,
          enumerable: !0,
          value: o,
          writable: !0
        }) : i[u] = o;
      }
      function qs(i, u) {
        for (var o = -1, p = u.length, v = q(p), A = i == null; ++o < p; )
          v[o] = A ? e : Eo(i, u[o]);
        return v;
      }
      function Tr(i, u, o) {
        return i === i && (o !== e && (i = i <= o ? i : o), u !== e && (i = i >= u ? i : u)), i;
      }
      function en(i, u, o, p, v, A) {
        var S, k = u & x, O = u & C, V = u & E;
        if (o && (S = v ? o(i, p, v, A) : o(i)), S !== e)
          return S;
        if (!Je(i))
          return i;
        var X = le(i);
        if (X) {
          if (S = j2(i), !k)
            return kt(i, S);
        } else {
          var j = Dt(i), ne = j == pn || j == Kt;
          if (br(i))
            return yh(i, k);
          if (j == Mt || j == yt || ne && !v) {
            if (S = O || ne ? {} : zh(i), !k)
              return O ? q2(i, h2(S, i)) : z2(i, Jl(S, i));
          } else {
            if (!qe[j])
              return v ? i : {};
            S = e_(i, j, k);
          }
        }
        A || (A = new _n());
        var ue = A.get(i);
        if (ue)
          return ue;
        A.set(i, S), _c(i) ? i.forEach(function(oe) {
          S.add(en(oe, u, o, oe, i, A));
        }) : pc(i) && i.forEach(function(oe, De) {
          S.set(De, en(oe, u, o, De, i, A));
        });
        var se = V ? O ? oo : so : O ? $t : lt, pe = X ? e : se(i);
        return Qt(pe || i, function(oe, De) {
          pe && (De = oe, oe = i[De]), Hi(S, De, en(oe, u, o, De, i, A));
        }), S;
      }
      function c2(i) {
        var u = lt(i);
        return function(o) {
          return jl(o, i, u);
        };
      }
      function jl(i, u, o) {
        var p = o.length;
        if (i == null)
          return !p;
        for (i = Oe(i); p--; ) {
          var v = o[p], A = u[v], S = i[v];
          if (S === e && !(v in i) || !A(S))
            return !1;
        }
        return !0;
      }
      function eh(i, u, o) {
        if (typeof i != "function")
          throw new Jt(h);
        return Ji(function() {
          i.apply(e, o);
        }, u);
      }
      function Zi(i, u, o, p) {
        var v = -1, A = zu, S = !0, k = i.length, O = [], V = u.length;
        if (!k)
          return O;
        o && (u = Xe(u, zt(o))), p ? (A = Bs, S = !1) : u.length >= f && (A = Mi, S = !1, u = new kr(u));
        e:
          for (; ++v < k; ) {
            var X = i[v], j = o == null ? X : o(X);
            if (X = p || X !== 0 ? X : 0, S && j === j) {
              for (var ne = V; ne--; )
                if (u[ne] === j)
                  continue e;
              O.push(X);
            } else A(u, j, p) || O.push(X);
          }
        return O;
      }
      var pr = Fh(Bn), th = Fh(Ws, !0);
      function d2(i, u) {
        var o = !0;
        return pr(i, function(p, v, A) {
          return o = !!u(p, v, A), o;
        }), o;
      }
      function ua(i, u, o) {
        for (var p = -1, v = i.length; ++p < v; ) {
          var A = i[p], S = u(A);
          if (S != null && (k === e ? S === S && !Gt(S) : o(S, k)))
            var k = S, O = A;
        }
        return O;
      }
      function p2(i, u, o, p) {
        var v = i.length;
        for (o = de(o), o < 0 && (o = -o > v ? 0 : v + o), p = p === e || p > v ? v : de(p), p < 0 && (p += v), p = o > p ? 0 : bc(p); o < p; )
          i[o++] = u;
        return i;
      }
      function nh(i, u) {
        var o = [];
        return pr(i, function(p, v, A) {
          u(p, v, A) && o.push(p);
        }), o;
      }
      function dt(i, u, o, p, v) {
        var A = -1, S = i.length;
        for (o || (o = n_), v || (v = []); ++A < S; ) {
          var k = i[A];
          u > 0 && o(k) ? u > 1 ? dt(k, u - 1, o, p, v) : hr(v, k) : p || (v[v.length] = k);
        }
        return v;
      }
      var Gs = Bh(), rh = Bh(!0);
      function Bn(i, u) {
        return i && Gs(i, u, lt);
      }
      function Ws(i, u) {
        return i && rh(i, u, lt);
      }
      function aa(i, u) {
        return lr(u, function(o) {
          return Kn(i[o]);
        });
      }
      function $r(i, u) {
        u = _r(u, i);
        for (var o = 0, p = u.length; i != null && o < p; )
          i = i[In(u[o++])];
        return o && o == p ? i : e;
      }
      function ih(i, u, o) {
        var p = u(i);
        return le(i) ? p : hr(p, o(i));
      }
      function Et(i) {
        return i == null ? i === e ? ws : gs : Sr && Sr in Oe(i) ? Y2(i) : f_(i);
      }
      function Hs(i, u) {
        return i > u;
      }
      function g2(i, u) {
        return i != null && Re.call(i, u);
      }
      function _2(i, u) {
        return i != null && u in Oe(i);
      }
      function w2(i, u, o) {
        return i >= vt(u, o) && i < st(u, o);
      }
      function Zs(i, u, o) {
        for (var p = o ? Bs : zu, v = i[0].length, A = i.length, S = A, k = q(A), O = 1 / 0, V = []; S--; ) {
          var X = i[S];
          S && u && (X = Xe(X, zt(u))), O = vt(X.length, O), k[S] = !o && (u || v >= 120 && X.length >= 120) ? new kr(S && X) : e;
        }
        X = i[0];
        var j = -1, ne = k[0];
        e:
          for (; ++j < v && V.length < O; ) {
            var ue = X[j], se = u ? u(ue) : ue;
            if (ue = o || ue !== 0 ? ue : 0, !(ne ? Mi(ne, se) : p(V, se, o))) {
              for (S = A; --S; ) {
                var pe = k[S];
                if (!(pe ? Mi(pe, se) : p(i[S], se, o)))
                  continue e;
              }
              ne && ne.push(se), V.push(ue);
            }
          }
        return V;
      }
      function b2(i, u, o, p) {
        return Bn(i, function(v, A, S) {
          u(p, o(v), A, S);
        }), p;
      }
      function Vi(i, u, o) {
        u = _r(u, i), i = Hh(i, u);
        var p = i == null ? i : i[In(nn(u))];
        return p == null ? e : Ut(p, i, o);
      }
      function uh(i) {
        return je(i) && Et(i) == yt;
      }
      function v2(i) {
        return je(i) && Et(i) == m;
      }
      function D2(i) {
        return je(i) && Et(i) == St;
      }
      function Xi(i, u, o, p, v) {
        return i === u ? !0 : i == null || u == null || !je(i) && !je(u) ? i !== i && u !== u : m2(i, u, o, p, Xi, v);
      }
      function m2(i, u, o, p, v, A) {
        var S = le(i), k = le(u), O = S ? Xt : Dt(i), V = k ? Xt : Dt(u);
        O = O == yt ? Mt : O, V = V == yt ? Mt : V;
        var X = O == Mt, j = V == Mt, ne = O == V;
        if (ne && br(i)) {
          if (!br(u))
            return !1;
          S = !0, X = !1;
        }
        if (ne && !X)
          return A || (A = new _n()), S || _i(i) ? Ph(i, u, o, p, v, A) : X2(i, u, O, o, p, v, A);
        if (!(o & I)) {
          var ue = X && Re.call(i, "__wrapped__"), se = j && Re.call(u, "__wrapped__");
          if (ue || se) {
            var pe = ue ? i.value() : i, oe = se ? u.value() : u;
            return A || (A = new _n()), v(pe, oe, o, p, A);
          }
        }
        return ne ? (A || (A = new _n()), K2(i, u, o, p, v, A)) : !1;
      }
      function y2(i) {
        return je(i) && Dt(i) == ut;
      }
      function Vs(i, u, o, p) {
        var v = o.length, A = v, S = !p;
        if (i == null)
          return !A;
        for (i = Oe(i); v--; ) {
          var k = o[v];
          if (S && k[2] ? k[1] !== i[k[0]] : !(k[0] in i))
            return !1;
        }
        for (; ++v < A; ) {
          k = o[v];
          var O = k[0], V = i[O], X = k[1];
          if (S && k[2]) {
            if (V === e && !(O in i))
              return !1;
          } else {
            var j = new _n();
            if (p)
              var ne = p(V, X, O, i, u, j);
            if (!(ne === e ? Xi(X, V, I | B, p, j) : ne))
              return !1;
          }
        }
        return !0;
      }
      function ah(i) {
        if (!Je(i) || i_(i))
          return !1;
        var u = Kn(i) ? yg : cp;
        return u.test(Nr(i));
      }
      function E2(i) {
        return je(i) && Et(i) == or;
      }
      function C2(i) {
        return je(i) && Dt(i) == wt;
      }
      function A2(i) {
        return je(i) && Ea(i.length) && !!He[Et(i)];
      }
      function sh(i) {
        return typeof i == "function" ? i : i == null ? Rt : typeof i == "object" ? le(i) ? lh(i[0], i[1]) : fh(i) : Sc(i);
      }
      function Xs(i) {
        if (!Qi(i))
          return Bg(i);
        var u = [];
        for (var o in Oe(i))
          Re.call(i, o) && o != "constructor" && u.push(o);
        return u;
      }
      function x2(i) {
        if (!Je(i))
          return o_(i);
        var u = Qi(i), o = [];
        for (var p in i)
          p == "constructor" && (u || !Re.call(i, p)) || o.push(p);
        return o;
      }
      function Ks(i, u) {
        return i < u;
      }
      function oh(i, u) {
        var o = -1, p = Tt(i) ? q(i.length) : [];
        return pr(i, function(v, A, S) {
          p[++o] = u(v, A, S);
        }), p;
      }
      function fh(i) {
        var u = lo(i);
        return u.length == 1 && u[0][2] ? Gh(u[0][0], u[0][1]) : function(o) {
          return o === i || Vs(o, i, u);
        };
      }
      function lh(i, u) {
        return co(i) && qh(u) ? Gh(In(i), u) : function(o) {
          var p = Eo(o, i);
          return p === e && p === u ? Co(o, i) : Xi(u, p, I | B);
        };
      }
      function sa(i, u, o, p, v) {
        i !== u && Gs(u, function(A, S) {
          if (v || (v = new _n()), Je(A))
            F2(i, u, S, o, sa, p, v);
          else {
            var k = p ? p(go(i, S), A, S + "", i, u, v) : e;
            k === e && (k = A), zs(i, S, k);
          }
        }, $t);
      }
      function F2(i, u, o, p, v, A, S) {
        var k = go(i, o), O = go(u, o), V = S.get(O);
        if (V) {
          zs(i, o, V);
          return;
        }
        var X = A ? A(k, O, o + "", i, u, S) : e, j = X === e;
        if (j) {
          var ne = le(O), ue = !ne && br(O), se = !ne && !ue && _i(O);
          X = O, ne || ue || se ? le(k) ? X = k : tt(k) ? X = kt(k) : ue ? (j = !1, X = yh(O, !0)) : se ? (j = !1, X = Eh(O, !0)) : X = [] : ji(O) || Lr(O) ? (X = k, Lr(k) ? X = vc(k) : (!Je(k) || Kn(k)) && (X = zh(O))) : j = !1;
        }
        j && (S.set(O, X), v(X, O, p, A, S), S.delete(O)), zs(i, o, X);
      }
      function hh(i, u) {
        var o = i.length;
        if (o)
          return u += u < 0 ? o : 0, Xn(u, o) ? i[u] : e;
      }
      function ch(i, u, o) {
        u.length ? u = Xe(u, function(A) {
          return le(A) ? function(S) {
            return $r(S, A.length === 1 ? A[0] : A);
          } : A;
        }) : u = [Rt];
        var p = -1;
        u = Xe(u, zt(ae()));
        var v = oh(i, function(A, S, k) {
          var O = Xe(u, function(V) {
            return V(A);
          });
          return { criteria: O, index: ++p, value: A };
        });
        return eg(v, function(A, S) {
          return U2(A, S, o);
        });
      }
      function B2(i, u) {
        return dh(i, u, function(o, p) {
          return Co(i, p);
        });
      }
      function dh(i, u, o) {
        for (var p = -1, v = u.length, A = {}; ++p < v; ) {
          var S = u[p], k = $r(i, S);
          o(k, S) && Ki(A, _r(S, i), k);
        }
        return A;
      }
      function S2(i) {
        return function(u) {
          return $r(u, i);
        };
      }
      function Ys(i, u, o, p) {
        var v = p ? jp : ui, A = -1, S = u.length, k = i;
        for (i === u && (u = kt(u)), o && (k = Xe(i, zt(o))); ++A < S; )
          for (var O = 0, V = u[A], X = o ? o(V) : V; (O = v(k, X, O, p)) > -1; )
            k !== i && Qu.call(k, O, 1), Qu.call(i, O, 1);
        return i;
      }
      function ph(i, u) {
        for (var o = i ? u.length : 0, p = o - 1; o--; ) {
          var v = u[o];
          if (o == p || v !== A) {
            var A = v;
            Xn(v) ? Qu.call(i, v, 1) : eo(i, v);
          }
        }
        return i;
      }
      function Qs(i, u) {
        return i + ea(Xl() * (u - i + 1));
      }
      function I2(i, u, o, p) {
        for (var v = -1, A = st(ju((u - i) / (o || 1)), 0), S = q(A); A--; )
          S[p ? A : ++v] = i, i += o;
        return S;
      }
      function Js(i, u) {
        var o = "";
        if (!i || u < 1 || u > Fe)
          return o;
        do
          u % 2 && (o += i), u = ea(u / 2), u && (i += i);
        while (u);
        return o;
      }
      function _e(i, u) {
        return _o(Wh(i, u, Rt), i + "");
      }
      function k2(i) {
        return Ql(wi(i));
      }
      function T2(i, u) {
        var o = wi(i);
        return wa(o, Tr(u, 0, o.length));
      }
      function Ki(i, u, o, p) {
        if (!Je(i))
          return i;
        u = _r(u, i);
        for (var v = -1, A = u.length, S = A - 1, k = i; k != null && ++v < A; ) {
          var O = In(u[v]), V = o;
          if (O === "__proto__" || O === "constructor" || O === "prototype")
            return i;
          if (v != S) {
            var X = k[O];
            V = p ? p(X, O, k) : e, V === e && (V = Je(X) ? X : Xn(u[v + 1]) ? [] : {});
          }
          Hi(k, O, V), k = k[O];
        }
        return i;
      }
      var gh = ta ? function(i, u) {
        return ta.set(i, u), i;
      } : Rt, $2 = Ju ? function(i, u) {
        return Ju(i, "toString", {
          configurable: !0,
          enumerable: !1,
          value: xo(u),
          writable: !0
        });
      } : Rt;
      function R2(i) {
        return wa(wi(i));
      }
      function tn(i, u, o) {
        var p = -1, v = i.length;
        u < 0 && (u = -u > v ? 0 : v + u), o = o > v ? v : o, o < 0 && (o += v), v = u > o ? 0 : o - u >>> 0, u >>>= 0;
        for (var A = q(v); ++p < v; )
          A[p] = i[p + u];
        return A;
      }
      function N2(i, u) {
        var o;
        return pr(i, function(p, v, A) {
          return o = u(p, v, A), !o;
        }), !!o;
      }
      function oa(i, u, o) {
        var p = 0, v = i == null ? p : i.length;
        if (typeof u == "number" && u === u && v <= Vt) {
          for (; p < v; ) {
            var A = p + v >>> 1, S = i[A];
            S !== null && !Gt(S) && (o ? S <= u : S < u) ? p = A + 1 : v = A;
          }
          return v;
        }
        return js(i, u, Rt, o);
      }
      function js(i, u, o, p) {
        var v = 0, A = i == null ? 0 : i.length;
        if (A === 0)
          return 0;
        u = o(u);
        for (var S = u !== u, k = u === null, O = Gt(u), V = u === e; v < A; ) {
          var X = ea((v + A) / 2), j = o(i[X]), ne = j !== e, ue = j === null, se = j === j, pe = Gt(j);
          if (S)
            var oe = p || se;
          else V ? oe = se && (p || ne) : k ? oe = se && ne && (p || !ue) : O ? oe = se && ne && !ue && (p || !pe) : ue || pe ? oe = !1 : oe = p ? j <= u : j < u;
          oe ? v = X + 1 : A = X;
        }
        return vt(A, et);
      }
      function _h(i, u) {
        for (var o = -1, p = i.length, v = 0, A = []; ++o < p; ) {
          var S = i[o], k = u ? u(S) : S;
          if (!o || !wn(k, O)) {
            var O = k;
            A[v++] = S === 0 ? 0 : S;
          }
        }
        return A;
      }
      function wh(i) {
        return typeof i == "number" ? i : Gt(i) ? mt : +i;
      }
      function qt(i) {
        if (typeof i == "string")
          return i;
        if (le(i))
          return Xe(i, qt) + "";
        if (Gt(i))
          return Kl ? Kl.call(i) : "";
        var u = i + "";
        return u == "0" && 1 / i == -1 / 0 ? "-0" : u;
      }
      function gr(i, u, o) {
        var p = -1, v = zu, A = i.length, S = !0, k = [], O = k;
        if (o)
          S = !1, v = Bs;
        else if (A >= f) {
          var V = u ? null : Z2(i);
          if (V)
            return Gu(V);
          S = !1, v = Mi, O = new kr();
        } else
          O = u ? [] : k;
        e:
          for (; ++p < A; ) {
            var X = i[p], j = u ? u(X) : X;
            if (X = o || X !== 0 ? X : 0, S && j === j) {
              for (var ne = O.length; ne--; )
                if (O[ne] === j)
                  continue e;
              u && O.push(j), k.push(X);
            } else v(O, j, o) || (O !== k && O.push(j), k.push(X));
          }
        return k;
      }
      function eo(i, u) {
        return u = _r(u, i), i = Hh(i, u), i == null || delete i[In(nn(u))];
      }
      function bh(i, u, o, p) {
        return Ki(i, u, o($r(i, u)), p);
      }
      function fa(i, u, o, p) {
        for (var v = i.length, A = p ? v : -1; (p ? A-- : ++A < v) && u(i[A], A, i); )
          ;
        return o ? tn(i, p ? 0 : A, p ? A + 1 : v) : tn(i, p ? A + 1 : 0, p ? v : A);
      }
      function vh(i, u) {
        var o = i;
        return o instanceof ye && (o = o.value()), Ss(u, function(p, v) {
          return v.func.apply(v.thisArg, hr([p], v.args));
        }, o);
      }
      function to(i, u, o) {
        var p = i.length;
        if (p < 2)
          return p ? gr(i[0]) : [];
        for (var v = -1, A = q(p); ++v < p; )
          for (var S = i[v], k = -1; ++k < p; )
            k != v && (A[v] = Zi(A[v] || S, i[k], u, o));
        return gr(dt(A, 1), u, o);
      }
      function Dh(i, u, o) {
        for (var p = -1, v = i.length, A = u.length, S = {}; ++p < v; ) {
          var k = p < A ? u[p] : e;
          o(S, i[p], k);
        }
        return S;
      }
      function no(i) {
        return tt(i) ? i : [];
      }
      function ro(i) {
        return typeof i == "function" ? i : Rt;
      }
      function _r(i, u) {
        return le(i) ? i : co(i, u) ? [i] : Kh(ke(i));
      }
      var L2 = _e;
      function wr(i, u, o) {
        var p = i.length;
        return o = o === e ? p : o, !u && o >= p ? i : tn(i, u, o);
      }
      var mh = Eg || function(i) {
        return ct.clearTimeout(i);
      };
      function yh(i, u) {
        if (u)
          return i.slice();
        var o = i.length, p = Gl ? Gl(o) : new i.constructor(o);
        return i.copy(p), p;
      }
      function io(i) {
        var u = new i.constructor(i.byteLength);
        return new Ku(u).set(new Ku(i)), u;
      }
      function O2(i, u) {
        var o = u ? io(i.buffer) : i.buffer;
        return new i.constructor(o, i.byteOffset, i.byteLength);
      }
      function P2(i) {
        var u = new i.constructor(i.source, ul.exec(i));
        return u.lastIndex = i.lastIndex, u;
      }
      function M2(i) {
        return Wi ? Oe(Wi.call(i)) : {};
      }
      function Eh(i, u) {
        var o = u ? io(i.buffer) : i.buffer;
        return new i.constructor(o, i.byteOffset, i.length);
      }
      function Ch(i, u) {
        if (i !== u) {
          var o = i !== e, p = i === null, v = i === i, A = Gt(i), S = u !== e, k = u === null, O = u === u, V = Gt(u);
          if (!k && !V && !A && i > u || A && S && O && !k && !V || p && S && O || !o && O || !v)
            return 1;
          if (!p && !A && !V && i < u || V && o && v && !p && !A || k && o && v || !S && v || !O)
            return -1;
        }
        return 0;
      }
      function U2(i, u, o) {
        for (var p = -1, v = i.criteria, A = u.criteria, S = v.length, k = o.length; ++p < S; ) {
          var O = Ch(v[p], A[p]);
          if (O) {
            if (p >= k)
              return O;
            var V = o[p];
            return O * (V == "desc" ? -1 : 1);
          }
        }
        return i.index - u.index;
      }
      function Ah(i, u, o, p) {
        for (var v = -1, A = i.length, S = o.length, k = -1, O = u.length, V = st(A - S, 0), X = q(O + V), j = !p; ++k < O; )
          X[k] = u[k];
        for (; ++v < S; )
          (j || v < A) && (X[o[v]] = i[v]);
        for (; V--; )
          X[k++] = i[v++];
        return X;
      }
      function xh(i, u, o, p) {
        for (var v = -1, A = i.length, S = -1, k = o.length, O = -1, V = u.length, X = st(A - k, 0), j = q(X + V), ne = !p; ++v < X; )
          j[v] = i[v];
        for (var ue = v; ++O < V; )
          j[ue + O] = u[O];
        for (; ++S < k; )
          (ne || v < A) && (j[ue + o[S]] = i[v++]);
        return j;
      }
      function kt(i, u) {
        var o = -1, p = i.length;
        for (u || (u = q(p)); ++o < p; )
          u[o] = i[o];
        return u;
      }
      function Sn(i, u, o, p) {
        var v = !o;
        o || (o = {});
        for (var A = -1, S = u.length; ++A < S; ) {
          var k = u[A], O = p ? p(o[k], i[k], k, o, i) : e;
          O === e && (O = i[k]), v ? Hn(o, k, O) : Hi(o, k, O);
        }
        return o;
      }
      function z2(i, u) {
        return Sn(i, ho(i), u);
      }
      function q2(i, u) {
        return Sn(i, Mh(i), u);
      }
      function la(i, u) {
        return function(o, p) {
          var v = le(o) ? Vp : l2, A = u ? u() : {};
          return v(o, i, ae(p, 2), A);
        };
      }
      function di(i) {
        return _e(function(u, o) {
          var p = -1, v = o.length, A = v > 1 ? o[v - 1] : e, S = v > 2 ? o[2] : e;
          for (A = i.length > 3 && typeof A == "function" ? (v--, A) : e, S && Ct(o[0], o[1], S) && (A = v < 3 ? e : A, v = 1), u = Oe(u); ++p < v; ) {
            var k = o[p];
            k && i(u, k, p, A);
          }
          return u;
        });
      }
      function Fh(i, u) {
        return function(o, p) {
          if (o == null)
            return o;
          if (!Tt(o))
            return i(o, p);
          for (var v = o.length, A = u ? v : -1, S = Oe(o); (u ? A-- : ++A < v) && p(S[A], A, S) !== !1; )
            ;
          return o;
        };
      }
      function Bh(i) {
        return function(u, o, p) {
          for (var v = -1, A = Oe(u), S = p(u), k = S.length; k--; ) {
            var O = S[i ? k : ++v];
            if (o(A[O], O, A) === !1)
              break;
          }
          return u;
        };
      }
      function G2(i, u, o) {
        var p = u & M, v = Yi(i);
        function A() {
          var S = this && this !== ct && this instanceof A ? v : i;
          return S.apply(p ? o : this, arguments);
        }
        return A;
      }
      function Sh(i) {
        return function(u) {
          u = ke(u);
          var o = ai(u) ? gn(u) : e, p = o ? o[0] : u.charAt(0), v = o ? wr(o, 1).join("") : u.slice(1);
          return p[i]() + v;
        };
      }
      function pi(i) {
        return function(u) {
          return Ss(Fc(xc(u).replace($p, "")), i, "");
        };
      }
      function Yi(i) {
        return function() {
          var u = arguments;
          switch (u.length) {
            case 0:
              return new i();
            case 1:
              return new i(u[0]);
            case 2:
              return new i(u[0], u[1]);
            case 3:
              return new i(u[0], u[1], u[2]);
            case 4:
              return new i(u[0], u[1], u[2], u[3]);
            case 5:
              return new i(u[0], u[1], u[2], u[3], u[4]);
            case 6:
              return new i(u[0], u[1], u[2], u[3], u[4], u[5]);
            case 7:
              return new i(u[0], u[1], u[2], u[3], u[4], u[5], u[6]);
          }
          var o = ci(i.prototype), p = i.apply(o, u);
          return Je(p) ? p : o;
        };
      }
      function W2(i, u, o) {
        var p = Yi(i);
        function v() {
          for (var A = arguments.length, S = q(A), k = A, O = gi(v); k--; )
            S[k] = arguments[k];
          var V = A < 3 && S[0] !== O && S[A - 1] !== O ? [] : cr(S, O);
          if (A -= V.length, A < o)
            return Rh(
              i,
              u,
              ha,
              v.placeholder,
              e,
              S,
              V,
              e,
              e,
              o - A
            );
          var X = this && this !== ct && this instanceof v ? p : i;
          return Ut(X, this, S);
        }
        return v;
      }
      function Ih(i) {
        return function(u, o, p) {
          var v = Oe(u);
          if (!Tt(u)) {
            var A = ae(o, 3);
            u = lt(u), o = function(k) {
              return A(v[k], k, v);
            };
          }
          var S = i(u, o, p);
          return S > -1 ? v[A ? u[S] : S] : e;
        };
      }
      function kh(i) {
        return Vn(function(u) {
          var o = u.length, p = o, v = jt.prototype.thru;
          for (i && u.reverse(); p--; ) {
            var A = u[p];
            if (typeof A != "function")
              throw new Jt(h);
            if (v && !S && ga(A) == "wrapper")
              var S = new jt([], !0);
          }
          for (p = S ? p : o; ++p < o; ) {
            A = u[p];
            var k = ga(A), O = k == "wrapper" ? fo(A) : e;
            O && po(O[0]) && O[1] == (z | P | L | Z) && !O[4].length && O[9] == 1 ? S = S[ga(O[0])].apply(S, O[3]) : S = A.length == 1 && po(A) ? S[k]() : S.thru(A);
          }
          return function() {
            var V = arguments, X = V[0];
            if (S && V.length == 1 && le(X))
              return S.plant(X).value();
            for (var j = 0, ne = o ? u[j].apply(this, V) : X; ++j < o; )
              ne = u[j].call(this, ne);
            return ne;
          };
        });
      }
      function ha(i, u, o, p, v, A, S, k, O, V) {
        var X = u & z, j = u & M, ne = u & T, ue = u & (P | $), se = u & J, pe = ne ? e : Yi(i);
        function oe() {
          for (var De = arguments.length, Ae = q(De), Wt = De; Wt--; )
            Ae[Wt] = arguments[Wt];
          if (ue)
            var At = gi(oe), Ht = ng(Ae, At);
          if (p && (Ae = Ah(Ae, p, v, ue)), A && (Ae = xh(Ae, A, S, ue)), De -= Ht, ue && De < V) {
            var nt = cr(Ae, At);
            return Rh(
              i,
              u,
              ha,
              oe.placeholder,
              o,
              Ae,
              nt,
              k,
              O,
              V - De
            );
          }
          var bn = j ? o : this, Qn = ne ? bn[i] : i;
          return De = Ae.length, k ? Ae = l_(Ae, k) : se && De > 1 && Ae.reverse(), X && O < De && (Ae.length = O), this && this !== ct && this instanceof oe && (Qn = pe || Yi(Qn)), Qn.apply(bn, Ae);
        }
        return oe;
      }
      function Th(i, u) {
        return function(o, p) {
          return b2(o, i, u(p), {});
        };
      }
      function ca(i, u) {
        return function(o, p) {
          var v;
          if (o === e && p === e)
            return u;
          if (o !== e && (v = o), p !== e) {
            if (v === e)
              return p;
            typeof o == "string" || typeof p == "string" ? (o = qt(o), p = qt(p)) : (o = wh(o), p = wh(p)), v = i(o, p);
          }
          return v;
        };
      }
      function uo(i) {
        return Vn(function(u) {
          return u = Xe(u, zt(ae())), _e(function(o) {
            var p = this;
            return i(u, function(v) {
              return Ut(v, p, o);
            });
          });
        });
      }
      function da(i, u) {
        u = u === e ? " " : qt(u);
        var o = u.length;
        if (o < 2)
          return o ? Js(u, i) : u;
        var p = Js(u, ju(i / si(u)));
        return ai(u) ? wr(gn(p), 0, i).join("") : p.slice(0, i);
      }
      function H2(i, u, o, p) {
        var v = u & M, A = Yi(i);
        function S() {
          for (var k = -1, O = arguments.length, V = -1, X = p.length, j = q(X + O), ne = this && this !== ct && this instanceof S ? A : i; ++V < X; )
            j[V] = p[V];
          for (; O--; )
            j[V++] = arguments[++k];
          return Ut(ne, v ? o : this, j);
        }
        return S;
      }
      function $h(i) {
        return function(u, o, p) {
          return p && typeof p != "number" && Ct(u, o, p) && (o = p = e), u = Yn(u), o === e ? (o = u, u = 0) : o = Yn(o), p = p === e ? u < o ? 1 : -1 : Yn(p), I2(u, o, p, i);
        };
      }
      function pa(i) {
        return function(u, o) {
          return typeof u == "string" && typeof o == "string" || (u = rn(u), o = rn(o)), i(u, o);
        };
      }
      function Rh(i, u, o, p, v, A, S, k, O, V) {
        var X = u & P, j = X ? S : e, ne = X ? e : S, ue = X ? A : e, se = X ? e : A;
        u |= X ? L : Q, u &= ~(X ? Q : L), u & G || (u &= -4);
        var pe = [
          i,
          u,
          v,
          ue,
          j,
          se,
          ne,
          k,
          O,
          V
        ], oe = o.apply(e, pe);
        return po(i) && Zh(oe, pe), oe.placeholder = p, Vh(oe, i, u);
      }
      function ao(i) {
        var u = at[i];
        return function(o, p) {
          if (o = rn(o), p = p == null ? 0 : vt(de(p), 292), p && Vl(o)) {
            var v = (ke(o) + "e").split("e"), A = u(v[0] + "e" + (+v[1] + p));
            return v = (ke(A) + "e").split("e"), +(v[0] + "e" + (+v[1] - p));
          }
          return u(o);
        };
      }
      var Z2 = li && 1 / Gu(new li([, -0]))[1] == ve ? function(i) {
        return new li(i);
      } : So;
      function Nh(i) {
        return function(u) {
          var o = Dt(u);
          return o == ut ? Ls(u) : o == wt ? fg(u) : tg(u, i(u));
        };
      }
      function Zn(i, u, o, p, v, A, S, k) {
        var O = u & T;
        if (!O && typeof i != "function")
          throw new Jt(h);
        var V = p ? p.length : 0;
        if (V || (u &= -97, p = v = e), S = S === e ? S : st(de(S), 0), k = k === e ? k : de(k), V -= v ? v.length : 0, u & Q) {
          var X = p, j = v;
          p = v = e;
        }
        var ne = O ? e : fo(i), ue = [
          i,
          u,
          o,
          p,
          v,
          X,
          j,
          A,
          S,
          k
        ];
        if (ne && s_(ue, ne), i = ue[0], u = ue[1], o = ue[2], p = ue[3], v = ue[4], k = ue[9] = ue[9] === e ? O ? 0 : i.length : st(ue[9] - V, 0), !k && u & (P | $) && (u &= -25), !u || u == M)
          var se = G2(i, u, o);
        else u == P || u == $ ? se = W2(i, u, k) : (u == L || u == (M | L)) && !v.length ? se = H2(i, u, o, p) : se = ha.apply(e, ue);
        var pe = ne ? gh : Zh;
        return Vh(pe(se, ue), i, u);
      }
      function Lh(i, u, o, p) {
        return i === e || wn(i, fi[o]) && !Re.call(p, o) ? u : i;
      }
      function Oh(i, u, o, p, v, A) {
        return Je(i) && Je(u) && (A.set(u, i), sa(i, u, e, Oh, A), A.delete(u)), i;
      }
      function V2(i) {
        return ji(i) ? e : i;
      }
      function Ph(i, u, o, p, v, A) {
        var S = o & I, k = i.length, O = u.length;
        if (k != O && !(S && O > k))
          return !1;
        var V = A.get(i), X = A.get(u);
        if (V && X)
          return V == u && X == i;
        var j = -1, ne = !0, ue = o & B ? new kr() : e;
        for (A.set(i, u), A.set(u, i); ++j < k; ) {
          var se = i[j], pe = u[j];
          if (p)
            var oe = S ? p(pe, se, j, u, i, A) : p(se, pe, j, i, u, A);
          if (oe !== e) {
            if (oe)
              continue;
            ne = !1;
            break;
          }
          if (ue) {
            if (!Is(u, function(De, Ae) {
              if (!Mi(ue, Ae) && (se === De || v(se, De, o, p, A)))
                return ue.push(Ae);
            })) {
              ne = !1;
              break;
            }
          } else if (!(se === pe || v(se, pe, o, p, A))) {
            ne = !1;
            break;
          }
        }
        return A.delete(i), A.delete(u), ne;
      }
      function X2(i, u, o, p, v, A, S) {
        switch (o) {
          case _:
            if (i.byteLength != u.byteLength || i.byteOffset != u.byteOffset)
              return !1;
            i = i.buffer, u = u.buffer;
          case m:
            return !(i.byteLength != u.byteLength || !A(new Ku(i), new Ku(u)));
          case _t:
          case St:
          case qn:
            return wn(+i, +u);
          case Fn:
            return i.name == u.name && i.message == u.message;
          case or:
          case bt:
            return i == u + "";
          case ut:
            var k = Ls;
          case wt:
            var O = p & I;
            if (k || (k = Gu), i.size != u.size && !O)
              return !1;
            var V = S.get(i);
            if (V)
              return V == u;
            p |= B, S.set(i, u);
            var X = Ph(k(i), k(u), p, v, A, S);
            return S.delete(i), X;
          case fr:
            if (Wi)
              return Wi.call(i) == Wi.call(u);
        }
        return !1;
      }
      function K2(i, u, o, p, v, A) {
        var S = o & I, k = so(i), O = k.length, V = so(u), X = V.length;
        if (O != X && !S)
          return !1;
        for (var j = O; j--; ) {
          var ne = k[j];
          if (!(S ? ne in u : Re.call(u, ne)))
            return !1;
        }
        var ue = A.get(i), se = A.get(u);
        if (ue && se)
          return ue == u && se == i;
        var pe = !0;
        A.set(i, u), A.set(u, i);
        for (var oe = S; ++j < O; ) {
          ne = k[j];
          var De = i[ne], Ae = u[ne];
          if (p)
            var Wt = S ? p(Ae, De, ne, u, i, A) : p(De, Ae, ne, i, u, A);
          if (!(Wt === e ? De === Ae || v(De, Ae, o, p, A) : Wt)) {
            pe = !1;
            break;
          }
          oe || (oe = ne == "constructor");
        }
        if (pe && !oe) {
          var At = i.constructor, Ht = u.constructor;
          At != Ht && "constructor" in i && "constructor" in u && !(typeof At == "function" && At instanceof At && typeof Ht == "function" && Ht instanceof Ht) && (pe = !1);
        }
        return A.delete(i), A.delete(u), pe;
      }
      function Vn(i) {
        return _o(Wh(i, e, jh), i + "");
      }
      function so(i) {
        return ih(i, lt, ho);
      }
      function oo(i) {
        return ih(i, $t, Mh);
      }
      var fo = ta ? function(i) {
        return ta.get(i);
      } : So;
      function ga(i) {
        for (var u = i.name + "", o = hi[u], p = Re.call(hi, u) ? o.length : 0; p--; ) {
          var v = o[p], A = v.func;
          if (A == null || A == i)
            return v.name;
        }
        return u;
      }
      function gi(i) {
        var u = Re.call(y, "placeholder") ? y : i;
        return u.placeholder;
      }
      function ae() {
        var i = y.iteratee || Fo;
        return i = i === Fo ? sh : i, arguments.length ? i(arguments[0], arguments[1]) : i;
      }
      function _a(i, u) {
        var o = i.__data__;
        return r_(u) ? o[typeof u == "string" ? "string" : "hash"] : o.map;
      }
      function lo(i) {
        for (var u = lt(i), o = u.length; o--; ) {
          var p = u[o], v = i[p];
          u[o] = [p, v, qh(v)];
        }
        return u;
      }
      function Rr(i, u) {
        var o = ag(i, u);
        return ah(o) ? o : e;
      }
      function Y2(i) {
        var u = Re.call(i, Sr), o = i[Sr];
        try {
          i[Sr] = e;
          var p = !0;
        } catch {
        }
        var v = Vu.call(i);
        return p && (u ? i[Sr] = o : delete i[Sr]), v;
      }
      var ho = Ps ? function(i) {
        return i == null ? [] : (i = Oe(i), lr(Ps(i), function(u) {
          return Hl.call(i, u);
        }));
      } : Io, Mh = Ps ? function(i) {
        for (var u = []; i; )
          hr(u, ho(i)), i = Yu(i);
        return u;
      } : Io, Dt = Et;
      (Ms && Dt(new Ms(new ArrayBuffer(1))) != _ || zi && Dt(new zi()) != ut || Us && Dt(Us.resolve()) != Ou || li && Dt(new li()) != wt || qi && Dt(new qi()) != It) && (Dt = function(i) {
        var u = Et(i), o = u == Mt ? i.constructor : e, p = o ? Nr(o) : "";
        if (p)
          switch (p) {
            case Tg:
              return _;
            case $g:
              return ut;
            case Rg:
              return Ou;
            case Ng:
              return wt;
            case Lg:
              return It;
          }
        return u;
      });
      function Q2(i, u, o) {
        for (var p = -1, v = o.length; ++p < v; ) {
          var A = o[p], S = A.size;
          switch (A.type) {
            case "drop":
              i += S;
              break;
            case "dropRight":
              u -= S;
              break;
            case "take":
              u = vt(u, i + S);
              break;
            case "takeRight":
              i = st(i, u - S);
              break;
          }
        }
        return { start: i, end: u };
      }
      function J2(i) {
        var u = i.match(ip);
        return u ? u[1].split(up) : [];
      }
      function Uh(i, u, o) {
        u = _r(u, i);
        for (var p = -1, v = u.length, A = !1; ++p < v; ) {
          var S = In(u[p]);
          if (!(A = i != null && o(i, S)))
            break;
          i = i[S];
        }
        return A || ++p != v ? A : (v = i == null ? 0 : i.length, !!v && Ea(v) && Xn(S, v) && (le(i) || Lr(i)));
      }
      function j2(i) {
        var u = i.length, o = new i.constructor(u);
        return u && typeof i[0] == "string" && Re.call(i, "index") && (o.index = i.index, o.input = i.input), o;
      }
      function zh(i) {
        return typeof i.constructor == "function" && !Qi(i) ? ci(Yu(i)) : {};
      }
      function e_(i, u, o) {
        var p = i.constructor;
        switch (u) {
          case m:
            return io(i);
          case _t:
          case St:
            return new p(+i);
          case _:
            return O2(i, o);
          case w:
          case F:
          case R:
          case U:
          case H:
          case ce:
          case Ue:
          case Le:
          case ze:
            return Eh(i, o);
          case ut:
            return new p();
          case qn:
          case bt:
            return new p(i);
          case or:
            return P2(i);
          case wt:
            return new p();
          case fr:
            return M2(i);
        }
      }
      function t_(i, u) {
        var o = u.length;
        if (!o)
          return i;
        var p = o - 1;
        return u[p] = (o > 1 ? "& " : "") + u[p], u = u.join(o > 2 ? ", " : " "), i.replace(rp, `{
/* [wrapped with ` + u + `] */
`);
      }
      function n_(i) {
        return le(i) || Lr(i) || !!(Zl && i && i[Zl]);
      }
      function Xn(i, u) {
        var o = typeof i;
        return u = u ?? Fe, !!u && (o == "number" || o != "symbol" && pp.test(i)) && i > -1 && i % 1 == 0 && i < u;
      }
      function Ct(i, u, o) {
        if (!Je(o))
          return !1;
        var p = typeof u;
        return (p == "number" ? Tt(o) && Xn(u, o.length) : p == "string" && u in o) ? wn(o[u], i) : !1;
      }
      function co(i, u) {
        if (le(i))
          return !1;
        var o = typeof i;
        return o == "number" || o == "symbol" || o == "boolean" || i == null || Gt(i) ? !0 : j1.test(i) || !J1.test(i) || u != null && i in Oe(u);
      }
      function r_(i) {
        var u = typeof i;
        return u == "string" || u == "number" || u == "symbol" || u == "boolean" ? i !== "__proto__" : i === null;
      }
      function po(i) {
        var u = ga(i), o = y[u];
        if (typeof o != "function" || !(u in ye.prototype))
          return !1;
        if (i === o)
          return !0;
        var p = fo(o);
        return !!p && i === p[0];
      }
      function i_(i) {
        return !!ql && ql in i;
      }
      var u_ = Hu ? Kn : ko;
      function Qi(i) {
        var u = i && i.constructor, o = typeof u == "function" && u.prototype || fi;
        return i === o;
      }
      function qh(i) {
        return i === i && !Je(i);
      }
      function Gh(i, u) {
        return function(o) {
          return o == null ? !1 : o[i] === u && (u !== e || i in Oe(o));
        };
      }
      function a_(i) {
        var u = ma(i, function(p) {
          return o.size === c && o.clear(), p;
        }), o = u.cache;
        return u;
      }
      function s_(i, u) {
        var o = i[1], p = u[1], v = o | p, A = v < (M | T | z), S = p == z && o == P || p == z && o == Z && i[7].length <= u[8] || p == (z | Z) && u[7].length <= u[8] && o == P;
        if (!(A || S))
          return i;
        p & M && (i[2] = u[2], v |= o & M ? 0 : G);
        var k = u[3];
        if (k) {
          var O = i[3];
          i[3] = O ? Ah(O, k, u[4]) : k, i[4] = O ? cr(i[3], d) : u[4];
        }
        return k = u[5], k && (O = i[5], i[5] = O ? xh(O, k, u[6]) : k, i[6] = O ? cr(i[5], d) : u[6]), k = u[7], k && (i[7] = k), p & z && (i[8] = i[8] == null ? u[8] : vt(i[8], u[8])), i[9] == null && (i[9] = u[9]), i[0] = u[0], i[1] = v, i;
      }
      function o_(i) {
        var u = [];
        if (i != null)
          for (var o in Oe(i))
            u.push(o);
        return u;
      }
      function f_(i) {
        return Vu.call(i);
      }
      function Wh(i, u, o) {
        return u = st(u === e ? i.length - 1 : u, 0), function() {
          for (var p = arguments, v = -1, A = st(p.length - u, 0), S = q(A); ++v < A; )
            S[v] = p[u + v];
          v = -1;
          for (var k = q(u + 1); ++v < u; )
            k[v] = p[v];
          return k[u] = o(S), Ut(i, this, k);
        };
      }
      function Hh(i, u) {
        return u.length < 2 ? i : $r(i, tn(u, 0, -1));
      }
      function l_(i, u) {
        for (var o = i.length, p = vt(u.length, o), v = kt(i); p--; ) {
          var A = u[p];
          i[p] = Xn(A, o) ? v[A] : e;
        }
        return i;
      }
      function go(i, u) {
        if (!(u === "constructor" && typeof i[u] == "function") && u != "__proto__")
          return i[u];
      }
      var Zh = Xh(gh), Ji = Ag || function(i, u) {
        return ct.setTimeout(i, u);
      }, _o = Xh($2);
      function Vh(i, u, o) {
        var p = u + "";
        return _o(i, t_(p, h_(J2(p), o)));
      }
      function Xh(i) {
        var u = 0, o = 0;
        return function() {
          var p = Sg(), v = Ce - (p - o);
          if (o = p, v > 0) {
            if (++u >= ie)
              return arguments[0];
          } else
            u = 0;
          return i.apply(e, arguments);
        };
      }
      function wa(i, u) {
        var o = -1, p = i.length, v = p - 1;
        for (u = u === e ? p : u; ++o < u; ) {
          var A = Qs(o, v), S = i[A];
          i[A] = i[o], i[o] = S;
        }
        return i.length = u, i;
      }
      var Kh = a_(function(i) {
        var u = [];
        return i.charCodeAt(0) === 46 && u.push(""), i.replace(ep, function(o, p, v, A) {
          u.push(v ? A.replace(op, "$1") : p || o);
        }), u;
      });
      function In(i) {
        if (typeof i == "string" || Gt(i))
          return i;
        var u = i + "";
        return u == "0" && 1 / i == -1 / 0 ? "-0" : u;
      }
      function Nr(i) {
        if (i != null) {
          try {
            return Zu.call(i);
          } catch {
          }
          try {
            return i + "";
          } catch {
          }
        }
        return "";
      }
      function h_(i, u) {
        return Qt(Me, function(o) {
          var p = "_." + o[0];
          u & o[1] && !zu(i, p) && i.push(p);
        }), i.sort();
      }
      function Yh(i) {
        if (i instanceof ye)
          return i.clone();
        var u = new jt(i.__wrapped__, i.__chain__);
        return u.__actions__ = kt(i.__actions__), u.__index__ = i.__index__, u.__values__ = i.__values__, u;
      }
      function c_(i, u, o) {
        (o ? Ct(i, u, o) : u === e) ? u = 1 : u = st(de(u), 0);
        var p = i == null ? 0 : i.length;
        if (!p || u < 1)
          return [];
        for (var v = 0, A = 0, S = q(ju(p / u)); v < p; )
          S[A++] = tn(i, v, v += u);
        return S;
      }
      function d_(i) {
        for (var u = -1, o = i == null ? 0 : i.length, p = 0, v = []; ++u < o; ) {
          var A = i[u];
          A && (v[p++] = A);
        }
        return v;
      }
      function p_() {
        var i = arguments.length;
        if (!i)
          return [];
        for (var u = q(i - 1), o = arguments[0], p = i; p--; )
          u[p - 1] = arguments[p];
        return hr(le(o) ? kt(o) : [o], dt(u, 1));
      }
      var g_ = _e(function(i, u) {
        return tt(i) ? Zi(i, dt(u, 1, tt, !0)) : [];
      }), __ = _e(function(i, u) {
        var o = nn(u);
        return tt(o) && (o = e), tt(i) ? Zi(i, dt(u, 1, tt, !0), ae(o, 2)) : [];
      }), w_ = _e(function(i, u) {
        var o = nn(u);
        return tt(o) && (o = e), tt(i) ? Zi(i, dt(u, 1, tt, !0), e, o) : [];
      });
      function b_(i, u, o) {
        var p = i == null ? 0 : i.length;
        return p ? (u = o || u === e ? 1 : de(u), tn(i, u < 0 ? 0 : u, p)) : [];
      }
      function v_(i, u, o) {
        var p = i == null ? 0 : i.length;
        return p ? (u = o || u === e ? 1 : de(u), u = p - u, tn(i, 0, u < 0 ? 0 : u)) : [];
      }
      function D_(i, u) {
        return i && i.length ? fa(i, ae(u, 3), !0, !0) : [];
      }
      function m_(i, u) {
        return i && i.length ? fa(i, ae(u, 3), !0) : [];
      }
      function y_(i, u, o, p) {
        var v = i == null ? 0 : i.length;
        return v ? (o && typeof o != "number" && Ct(i, u, o) && (o = 0, p = v), p2(i, u, o, p)) : [];
      }
      function Qh(i, u, o) {
        var p = i == null ? 0 : i.length;
        if (!p)
          return -1;
        var v = o == null ? 0 : de(o);
        return v < 0 && (v = st(p + v, 0)), qu(i, ae(u, 3), v);
      }
      function Jh(i, u, o) {
        var p = i == null ? 0 : i.length;
        if (!p)
          return -1;
        var v = p - 1;
        return o !== e && (v = de(o), v = o < 0 ? st(p + v, 0) : vt(v, p - 1)), qu(i, ae(u, 3), v, !0);
      }
      function jh(i) {
        var u = i == null ? 0 : i.length;
        return u ? dt(i, 1) : [];
      }
      function E_(i) {
        var u = i == null ? 0 : i.length;
        return u ? dt(i, ve) : [];
      }
      function C_(i, u) {
        var o = i == null ? 0 : i.length;
        return o ? (u = u === e ? 1 : de(u), dt(i, u)) : [];
      }
      function A_(i) {
        for (var u = -1, o = i == null ? 0 : i.length, p = {}; ++u < o; ) {
          var v = i[u];
          p[v[0]] = v[1];
        }
        return p;
      }
      function ec(i) {
        return i && i.length ? i[0] : e;
      }
      function x_(i, u, o) {
        var p = i == null ? 0 : i.length;
        if (!p)
          return -1;
        var v = o == null ? 0 : de(o);
        return v < 0 && (v = st(p + v, 0)), ui(i, u, v);
      }
      function F_(i) {
        var u = i == null ? 0 : i.length;
        return u ? tn(i, 0, -1) : [];
      }
      var B_ = _e(function(i) {
        var u = Xe(i, no);
        return u.length && u[0] === i[0] ? Zs(u) : [];
      }), S_ = _e(function(i) {
        var u = nn(i), o = Xe(i, no);
        return u === nn(o) ? u = e : o.pop(), o.length && o[0] === i[0] ? Zs(o, ae(u, 2)) : [];
      }), I_ = _e(function(i) {
        var u = nn(i), o = Xe(i, no);
        return u = typeof u == "function" ? u : e, u && o.pop(), o.length && o[0] === i[0] ? Zs(o, e, u) : [];
      });
      function k_(i, u) {
        return i == null ? "" : Fg.call(i, u);
      }
      function nn(i) {
        var u = i == null ? 0 : i.length;
        return u ? i[u - 1] : e;
      }
      function T_(i, u, o) {
        var p = i == null ? 0 : i.length;
        if (!p)
          return -1;
        var v = p;
        return o !== e && (v = de(o), v = v < 0 ? st(p + v, 0) : vt(v, p - 1)), u === u ? hg(i, u, v) : qu(i, Rl, v, !0);
      }
      function $_(i, u) {
        return i && i.length ? hh(i, de(u)) : e;
      }
      var R_ = _e(tc);
      function tc(i, u) {
        return i && i.length && u && u.length ? Ys(i, u) : i;
      }
      function N_(i, u, o) {
        return i && i.length && u && u.length ? Ys(i, u, ae(o, 2)) : i;
      }
      function L_(i, u, o) {
        return i && i.length && u && u.length ? Ys(i, u, e, o) : i;
      }
      var O_ = Vn(function(i, u) {
        var o = i == null ? 0 : i.length, p = qs(i, u);
        return ph(i, Xe(u, function(v) {
          return Xn(v, o) ? +v : v;
        }).sort(Ch)), p;
      });
      function P_(i, u) {
        var o = [];
        if (!(i && i.length))
          return o;
        var p = -1, v = [], A = i.length;
        for (u = ae(u, 3); ++p < A; ) {
          var S = i[p];
          u(S, p, i) && (o.push(S), v.push(p));
        }
        return ph(i, v), o;
      }
      function wo(i) {
        return i == null ? i : kg.call(i);
      }
      function M_(i, u, o) {
        var p = i == null ? 0 : i.length;
        return p ? (o && typeof o != "number" && Ct(i, u, o) ? (u = 0, o = p) : (u = u == null ? 0 : de(u), o = o === e ? p : de(o)), tn(i, u, o)) : [];
      }
      function U_(i, u) {
        return oa(i, u);
      }
      function z_(i, u, o) {
        return js(i, u, ae(o, 2));
      }
      function q_(i, u) {
        var o = i == null ? 0 : i.length;
        if (o) {
          var p = oa(i, u);
          if (p < o && wn(i[p], u))
            return p;
        }
        return -1;
      }
      function G_(i, u) {
        return oa(i, u, !0);
      }
      function W_(i, u, o) {
        return js(i, u, ae(o, 2), !0);
      }
      function H_(i, u) {
        var o = i == null ? 0 : i.length;
        if (o) {
          var p = oa(i, u, !0) - 1;
          if (wn(i[p], u))
            return p;
        }
        return -1;
      }
      function Z_(i) {
        return i && i.length ? _h(i) : [];
      }
      function V_(i, u) {
        return i && i.length ? _h(i, ae(u, 2)) : [];
      }
      function X_(i) {
        var u = i == null ? 0 : i.length;
        return u ? tn(i, 1, u) : [];
      }
      function K_(i, u, o) {
        return i && i.length ? (u = o || u === e ? 1 : de(u), tn(i, 0, u < 0 ? 0 : u)) : [];
      }
      function Y_(i, u, o) {
        var p = i == null ? 0 : i.length;
        return p ? (u = o || u === e ? 1 : de(u), u = p - u, tn(i, u < 0 ? 0 : u, p)) : [];
      }
      function Q_(i, u) {
        return i && i.length ? fa(i, ae(u, 3), !1, !0) : [];
      }
      function J_(i, u) {
        return i && i.length ? fa(i, ae(u, 3)) : [];
      }
      var j_ = _e(function(i) {
        return gr(dt(i, 1, tt, !0));
      }), ew = _e(function(i) {
        var u = nn(i);
        return tt(u) && (u = e), gr(dt(i, 1, tt, !0), ae(u, 2));
      }), tw = _e(function(i) {
        var u = nn(i);
        return u = typeof u == "function" ? u : e, gr(dt(i, 1, tt, !0), e, u);
      });
      function nw(i) {
        return i && i.length ? gr(i) : [];
      }
      function rw(i, u) {
        return i && i.length ? gr(i, ae(u, 2)) : [];
      }
      function iw(i, u) {
        return u = typeof u == "function" ? u : e, i && i.length ? gr(i, e, u) : [];
      }
      function bo(i) {
        if (!(i && i.length))
          return [];
        var u = 0;
        return i = lr(i, function(o) {
          if (tt(o))
            return u = st(o.length, u), !0;
        }), Rs(u, function(o) {
          return Xe(i, ks(o));
        });
      }
      function nc(i, u) {
        if (!(i && i.length))
          return [];
        var o = bo(i);
        return u == null ? o : Xe(o, function(p) {
          return Ut(u, e, p);
        });
      }
      var uw = _e(function(i, u) {
        return tt(i) ? Zi(i, u) : [];
      }), aw = _e(function(i) {
        return to(lr(i, tt));
      }), sw = _e(function(i) {
        var u = nn(i);
        return tt(u) && (u = e), to(lr(i, tt), ae(u, 2));
      }), ow = _e(function(i) {
        var u = nn(i);
        return u = typeof u == "function" ? u : e, to(lr(i, tt), e, u);
      }), fw = _e(bo);
      function lw(i, u) {
        return Dh(i || [], u || [], Hi);
      }
      function hw(i, u) {
        return Dh(i || [], u || [], Ki);
      }
      var cw = _e(function(i) {
        var u = i.length, o = u > 1 ? i[u - 1] : e;
        return o = typeof o == "function" ? (i.pop(), o) : e, nc(i, o);
      });
      function rc(i) {
        var u = y(i);
        return u.__chain__ = !0, u;
      }
      function dw(i, u) {
        return u(i), i;
      }
      function ba(i, u) {
        return u(i);
      }
      var pw = Vn(function(i) {
        var u = i.length, o = u ? i[0] : 0, p = this.__wrapped__, v = function(A) {
          return qs(A, i);
        };
        return u > 1 || this.__actions__.length || !(p instanceof ye) || !Xn(o) ? this.thru(v) : (p = p.slice(o, +o + (u ? 1 : 0)), p.__actions__.push({
          func: ba,
          args: [v],
          thisArg: e
        }), new jt(p, this.__chain__).thru(function(A) {
          return u && !A.length && A.push(e), A;
        }));
      });
      function gw() {
        return rc(this);
      }
      function _w() {
        return new jt(this.value(), this.__chain__);
      }
      function ww() {
        this.__values__ === e && (this.__values__ = wc(this.value()));
        var i = this.__index__ >= this.__values__.length, u = i ? e : this.__values__[this.__index__++];
        return { done: i, value: u };
      }
      function bw() {
        return this;
      }
      function vw(i) {
        for (var u, o = this; o instanceof ra; ) {
          var p = Yh(o);
          p.__index__ = 0, p.__values__ = e, u ? v.__wrapped__ = p : u = p;
          var v = p;
          o = o.__wrapped__;
        }
        return v.__wrapped__ = i, u;
      }
      function Dw() {
        var i = this.__wrapped__;
        if (i instanceof ye) {
          var u = i;
          return this.__actions__.length && (u = new ye(this)), u = u.reverse(), u.__actions__.push({
            func: ba,
            args: [wo],
            thisArg: e
          }), new jt(u, this.__chain__);
        }
        return this.thru(wo);
      }
      function mw() {
        return vh(this.__wrapped__, this.__actions__);
      }
      var yw = la(function(i, u, o) {
        Re.call(i, o) ? ++i[o] : Hn(i, o, 1);
      });
      function Ew(i, u, o) {
        var p = le(i) ? Tl : d2;
        return o && Ct(i, u, o) && (u = e), p(i, ae(u, 3));
      }
      function Cw(i, u) {
        var o = le(i) ? lr : nh;
        return o(i, ae(u, 3));
      }
      var Aw = Ih(Qh), xw = Ih(Jh);
      function Fw(i, u) {
        return dt(va(i, u), 1);
      }
      function Bw(i, u) {
        return dt(va(i, u), ve);
      }
      function Sw(i, u, o) {
        return o = o === e ? 1 : de(o), dt(va(i, u), o);
      }
      function ic(i, u) {
        var o = le(i) ? Qt : pr;
        return o(i, ae(u, 3));
      }
      function uc(i, u) {
        var o = le(i) ? Xp : th;
        return o(i, ae(u, 3));
      }
      var Iw = la(function(i, u, o) {
        Re.call(i, o) ? i[o].push(u) : Hn(i, o, [u]);
      });
      function kw(i, u, o, p) {
        i = Tt(i) ? i : wi(i), o = o && !p ? de(o) : 0;
        var v = i.length;
        return o < 0 && (o = st(v + o, 0)), Ca(i) ? o <= v && i.indexOf(u, o) > -1 : !!v && ui(i, u, o) > -1;
      }
      var Tw = _e(function(i, u, o) {
        var p = -1, v = typeof u == "function", A = Tt(i) ? q(i.length) : [];
        return pr(i, function(S) {
          A[++p] = v ? Ut(u, S, o) : Vi(S, u, o);
        }), A;
      }), $w = la(function(i, u, o) {
        Hn(i, o, u);
      });
      function va(i, u) {
        var o = le(i) ? Xe : oh;
        return o(i, ae(u, 3));
      }
      function Rw(i, u, o, p) {
        return i == null ? [] : (le(u) || (u = u == null ? [] : [u]), o = p ? e : o, le(o) || (o = o == null ? [] : [o]), ch(i, u, o));
      }
      var Nw = la(function(i, u, o) {
        i[o ? 0 : 1].push(u);
      }, function() {
        return [[], []];
      });
      function Lw(i, u, o) {
        var p = le(i) ? Ss : Ll, v = arguments.length < 3;
        return p(i, ae(u, 4), o, v, pr);
      }
      function Ow(i, u, o) {
        var p = le(i) ? Kp : Ll, v = arguments.length < 3;
        return p(i, ae(u, 4), o, v, th);
      }
      function Pw(i, u) {
        var o = le(i) ? lr : nh;
        return o(i, ya(ae(u, 3)));
      }
      function Mw(i) {
        var u = le(i) ? Ql : k2;
        return u(i);
      }
      function Uw(i, u, o) {
        (o ? Ct(i, u, o) : u === e) ? u = 1 : u = de(u);
        var p = le(i) ? o2 : T2;
        return p(i, u);
      }
      function zw(i) {
        var u = le(i) ? f2 : R2;
        return u(i);
      }
      function qw(i) {
        if (i == null)
          return 0;
        if (Tt(i))
          return Ca(i) ? si(i) : i.length;
        var u = Dt(i);
        return u == ut || u == wt ? i.size : Xs(i).length;
      }
      function Gw(i, u, o) {
        var p = le(i) ? Is : N2;
        return o && Ct(i, u, o) && (u = e), p(i, ae(u, 3));
      }
      var Ww = _e(function(i, u) {
        if (i == null)
          return [];
        var o = u.length;
        return o > 1 && Ct(i, u[0], u[1]) ? u = [] : o > 2 && Ct(u[0], u[1], u[2]) && (u = [u[0]]), ch(i, dt(u, 1), []);
      }), Da = Cg || function() {
        return ct.Date.now();
      };
      function Hw(i, u) {
        if (typeof u != "function")
          throw new Jt(h);
        return i = de(i), function() {
          if (--i < 1)
            return u.apply(this, arguments);
        };
      }
      function ac(i, u, o) {
        return u = o ? e : u, u = i && u == null ? i.length : u, Zn(i, z, e, e, e, e, u);
      }
      function sc(i, u) {
        var o;
        if (typeof u != "function")
          throw new Jt(h);
        return i = de(i), function() {
          return --i > 0 && (o = u.apply(this, arguments)), i <= 1 && (u = e), o;
        };
      }
      var vo = _e(function(i, u, o) {
        var p = M;
        if (o.length) {
          var v = cr(o, gi(vo));
          p |= L;
        }
        return Zn(i, p, u, o, v);
      }), oc = _e(function(i, u, o) {
        var p = M | T;
        if (o.length) {
          var v = cr(o, gi(oc));
          p |= L;
        }
        return Zn(u, p, i, o, v);
      });
      function fc(i, u, o) {
        u = o ? e : u;
        var p = Zn(i, P, e, e, e, e, e, u);
        return p.placeholder = fc.placeholder, p;
      }
      function lc(i, u, o) {
        u = o ? e : u;
        var p = Zn(i, $, e, e, e, e, e, u);
        return p.placeholder = lc.placeholder, p;
      }
      function hc(i, u, o) {
        var p, v, A, S, k, O, V = 0, X = !1, j = !1, ne = !0;
        if (typeof i != "function")
          throw new Jt(h);
        u = rn(u) || 0, Je(o) && (X = !!o.leading, j = "maxWait" in o, A = j ? st(rn(o.maxWait) || 0, u) : A, ne = "trailing" in o ? !!o.trailing : ne);
        function ue(nt) {
          var bn = p, Qn = v;
          return p = v = e, V = nt, S = i.apply(Qn, bn), S;
        }
        function se(nt) {
          return V = nt, k = Ji(De, u), X ? ue(nt) : S;
        }
        function pe(nt) {
          var bn = nt - O, Qn = nt - V, Ic = u - bn;
          return j ? vt(Ic, A - Qn) : Ic;
        }
        function oe(nt) {
          var bn = nt - O, Qn = nt - V;
          return O === e || bn >= u || bn < 0 || j && Qn >= A;
        }
        function De() {
          var nt = Da();
          if (oe(nt))
            return Ae(nt);
          k = Ji(De, pe(nt));
        }
        function Ae(nt) {
          return k = e, ne && p ? ue(nt) : (p = v = e, S);
        }
        function Wt() {
          k !== e && mh(k), V = 0, p = O = v = k = e;
        }
        function At() {
          return k === e ? S : Ae(Da());
        }
        function Ht() {
          var nt = Da(), bn = oe(nt);
          if (p = arguments, v = this, O = nt, bn) {
            if (k === e)
              return se(O);
            if (j)
              return mh(k), k = Ji(De, u), ue(O);
          }
          return k === e && (k = Ji(De, u)), S;
        }
        return Ht.cancel = Wt, Ht.flush = At, Ht;
      }
      var Zw = _e(function(i, u) {
        return eh(i, 1, u);
      }), Vw = _e(function(i, u, o) {
        return eh(i, rn(u) || 0, o);
      });
      function Xw(i) {
        return Zn(i, J);
      }
      function ma(i, u) {
        if (typeof i != "function" || u != null && typeof u != "function")
          throw new Jt(h);
        var o = function() {
          var p = arguments, v = u ? u.apply(this, p) : p[0], A = o.cache;
          if (A.has(v))
            return A.get(v);
          var S = i.apply(this, p);
          return o.cache = A.set(v, S) || A, S;
        };
        return o.cache = new (ma.Cache || Wn)(), o;
      }
      ma.Cache = Wn;
      function ya(i) {
        if (typeof i != "function")
          throw new Jt(h);
        return function() {
          var u = arguments;
          switch (u.length) {
            case 0:
              return !i.call(this);
            case 1:
              return !i.call(this, u[0]);
            case 2:
              return !i.call(this, u[0], u[1]);
            case 3:
              return !i.call(this, u[0], u[1], u[2]);
          }
          return !i.apply(this, u);
        };
      }
      function Kw(i) {
        return sc(2, i);
      }
      var Yw = L2(function(i, u) {
        u = u.length == 1 && le(u[0]) ? Xe(u[0], zt(ae())) : Xe(dt(u, 1), zt(ae()));
        var o = u.length;
        return _e(function(p) {
          for (var v = -1, A = vt(p.length, o); ++v < A; )
            p[v] = u[v].call(this, p[v]);
          return Ut(i, this, p);
        });
      }), Do = _e(function(i, u) {
        var o = cr(u, gi(Do));
        return Zn(i, L, e, u, o);
      }), cc = _e(function(i, u) {
        var o = cr(u, gi(cc));
        return Zn(i, Q, e, u, o);
      }), Qw = Vn(function(i, u) {
        return Zn(i, Z, e, e, e, u);
      });
      function Jw(i, u) {
        if (typeof i != "function")
          throw new Jt(h);
        return u = u === e ? u : de(u), _e(i, u);
      }
      function jw(i, u) {
        if (typeof i != "function")
          throw new Jt(h);
        return u = u == null ? 0 : st(de(u), 0), _e(function(o) {
          var p = o[u], v = wr(o, 0, u);
          return p && hr(v, p), Ut(i, this, v);
        });
      }
      function eb(i, u, o) {
        var p = !0, v = !0;
        if (typeof i != "function")
          throw new Jt(h);
        return Je(o) && (p = "leading" in o ? !!o.leading : p, v = "trailing" in o ? !!o.trailing : v), hc(i, u, {
          leading: p,
          maxWait: u,
          trailing: v
        });
      }
      function tb(i) {
        return ac(i, 1);
      }
      function nb(i, u) {
        return Do(ro(u), i);
      }
      function rb() {
        if (!arguments.length)
          return [];
        var i = arguments[0];
        return le(i) ? i : [i];
      }
      function ib(i) {
        return en(i, E);
      }
      function ub(i, u) {
        return u = typeof u == "function" ? u : e, en(i, E, u);
      }
      function ab(i) {
        return en(i, x | E);
      }
      function sb(i, u) {
        return u = typeof u == "function" ? u : e, en(i, x | E, u);
      }
      function ob(i, u) {
        return u == null || jl(i, u, lt(u));
      }
      function wn(i, u) {
        return i === u || i !== i && u !== u;
      }
      var fb = pa(Hs), lb = pa(function(i, u) {
        return i >= u;
      }), Lr = uh(/* @__PURE__ */ function() {
        return arguments;
      }()) ? uh : function(i) {
        return je(i) && Re.call(i, "callee") && !Hl.call(i, "callee");
      }, le = q.isArray, hb = xl ? zt(xl) : v2;
      function Tt(i) {
        return i != null && Ea(i.length) && !Kn(i);
      }
      function tt(i) {
        return je(i) && Tt(i);
      }
      function cb(i) {
        return i === !0 || i === !1 || je(i) && Et(i) == _t;
      }
      var br = xg || ko, db = Fl ? zt(Fl) : D2;
      function pb(i) {
        return je(i) && i.nodeType === 1 && !ji(i);
      }
      function gb(i) {
        if (i == null)
          return !0;
        if (Tt(i) && (le(i) || typeof i == "string" || typeof i.splice == "function" || br(i) || _i(i) || Lr(i)))
          return !i.length;
        var u = Dt(i);
        if (u == ut || u == wt)
          return !i.size;
        if (Qi(i))
          return !Xs(i).length;
        for (var o in i)
          if (Re.call(i, o))
            return !1;
        return !0;
      }
      function _b(i, u) {
        return Xi(i, u);
      }
      function wb(i, u, o) {
        o = typeof o == "function" ? o : e;
        var p = o ? o(i, u) : e;
        return p === e ? Xi(i, u, e, o) : !!p;
      }
      function mo(i) {
        if (!je(i))
          return !1;
        var u = Et(i);
        return u == Fn || u == Fr || typeof i.message == "string" && typeof i.name == "string" && !ji(i);
      }
      function bb(i) {
        return typeof i == "number" && Vl(i);
      }
      function Kn(i) {
        if (!Je(i))
          return !1;
        var u = Et(i);
        return u == pn || u == Kt || u == sr || u == _s;
      }
      function dc(i) {
        return typeof i == "number" && i == de(i);
      }
      function Ea(i) {
        return typeof i == "number" && i > -1 && i % 1 == 0 && i <= Fe;
      }
      function Je(i) {
        var u = typeof i;
        return i != null && (u == "object" || u == "function");
      }
      function je(i) {
        return i != null && typeof i == "object";
      }
      var pc = Bl ? zt(Bl) : y2;
      function vb(i, u) {
        return i === u || Vs(i, u, lo(u));
      }
      function Db(i, u, o) {
        return o = typeof o == "function" ? o : e, Vs(i, u, lo(u), o);
      }
      function mb(i) {
        return gc(i) && i != +i;
      }
      function yb(i) {
        if (u_(i))
          throw new fe(s);
        return ah(i);
      }
      function Eb(i) {
        return i === null;
      }
      function Cb(i) {
        return i == null;
      }
      function gc(i) {
        return typeof i == "number" || je(i) && Et(i) == qn;
      }
      function ji(i) {
        if (!je(i) || Et(i) != Mt)
          return !1;
        var u = Yu(i);
        if (u === null)
          return !0;
        var o = Re.call(u, "constructor") && u.constructor;
        return typeof o == "function" && o instanceof o && Zu.call(o) == Dg;
      }
      var yo = Sl ? zt(Sl) : E2;
      function Ab(i) {
        return dc(i) && i >= -9007199254740991 && i <= Fe;
      }
      var _c = Il ? zt(Il) : C2;
      function Ca(i) {
        return typeof i == "string" || !le(i) && je(i) && Et(i) == bt;
      }
      function Gt(i) {
        return typeof i == "symbol" || je(i) && Et(i) == fr;
      }
      var _i = kl ? zt(kl) : A2;
      function xb(i) {
        return i === e;
      }
      function Fb(i) {
        return je(i) && Dt(i) == It;
      }
      function Bb(i) {
        return je(i) && Et(i) == bs;
      }
      var Sb = pa(Ks), Ib = pa(function(i, u) {
        return i <= u;
      });
      function wc(i) {
        if (!i)
          return [];
        if (Tt(i))
          return Ca(i) ? gn(i) : kt(i);
        if (Ui && i[Ui])
          return og(i[Ui]());
        var u = Dt(i), o = u == ut ? Ls : u == wt ? Gu : wi;
        return o(i);
      }
      function Yn(i) {
        if (!i)
          return i === 0 ? i : 0;
        if (i = rn(i), i === ve || i === -1 / 0) {
          var u = i < 0 ? -1 : 1;
          return u * xn;
        }
        return i === i ? i : 0;
      }
      function de(i) {
        var u = Yn(i), o = u % 1;
        return u === u ? o ? u - o : u : 0;
      }
      function bc(i) {
        return i ? Tr(de(i), 0, me) : 0;
      }
      function rn(i) {
        if (typeof i == "number")
          return i;
        if (Gt(i))
          return mt;
        if (Je(i)) {
          var u = typeof i.valueOf == "function" ? i.valueOf() : i;
          i = Je(u) ? u + "" : u;
        }
        if (typeof i != "string")
          return i === 0 ? i : +i;
        i = Ol(i);
        var o = hp.test(i);
        return o || dp.test(i) ? Hp(i.slice(2), o ? 2 : 8) : lp.test(i) ? mt : +i;
      }
      function vc(i) {
        return Sn(i, $t(i));
      }
      function kb(i) {
        return i ? Tr(de(i), -9007199254740991, Fe) : i === 0 ? i : 0;
      }
      function ke(i) {
        return i == null ? "" : qt(i);
      }
      var Tb = di(function(i, u) {
        if (Qi(u) || Tt(u)) {
          Sn(u, lt(u), i);
          return;
        }
        for (var o in u)
          Re.call(u, o) && Hi(i, o, u[o]);
      }), Dc = di(function(i, u) {
        Sn(u, $t(u), i);
      }), Aa = di(function(i, u, o, p) {
        Sn(u, $t(u), i, p);
      }), $b = di(function(i, u, o, p) {
        Sn(u, lt(u), i, p);
      }), Rb = Vn(qs);
      function Nb(i, u) {
        var o = ci(i);
        return u == null ? o : Jl(o, u);
      }
      var Lb = _e(function(i, u) {
        i = Oe(i);
        var o = -1, p = u.length, v = p > 2 ? u[2] : e;
        for (v && Ct(u[0], u[1], v) && (p = 1); ++o < p; )
          for (var A = u[o], S = $t(A), k = -1, O = S.length; ++k < O; ) {
            var V = S[k], X = i[V];
            (X === e || wn(X, fi[V]) && !Re.call(i, V)) && (i[V] = A[V]);
          }
        return i;
      }), Ob = _e(function(i) {
        return i.push(e, Oh), Ut(mc, e, i);
      });
      function Pb(i, u) {
        return $l(i, ae(u, 3), Bn);
      }
      function Mb(i, u) {
        return $l(i, ae(u, 3), Ws);
      }
      function Ub(i, u) {
        return i == null ? i : Gs(i, ae(u, 3), $t);
      }
      function zb(i, u) {
        return i == null ? i : rh(i, ae(u, 3), $t);
      }
      function qb(i, u) {
        return i && Bn(i, ae(u, 3));
      }
      function Gb(i, u) {
        return i && Ws(i, ae(u, 3));
      }
      function Wb(i) {
        return i == null ? [] : aa(i, lt(i));
      }
      function Hb(i) {
        return i == null ? [] : aa(i, $t(i));
      }
      function Eo(i, u, o) {
        var p = i == null ? e : $r(i, u);
        return p === e ? o : p;
      }
      function Zb(i, u) {
        return i != null && Uh(i, u, g2);
      }
      function Co(i, u) {
        return i != null && Uh(i, u, _2);
      }
      var Vb = Th(function(i, u, o) {
        u != null && typeof u.toString != "function" && (u = Vu.call(u)), i[u] = o;
      }, xo(Rt)), Xb = Th(function(i, u, o) {
        u != null && typeof u.toString != "function" && (u = Vu.call(u)), Re.call(i, u) ? i[u].push(o) : i[u] = [o];
      }, ae), Kb = _e(Vi);
      function lt(i) {
        return Tt(i) ? Yl(i) : Xs(i);
      }
      function $t(i) {
        return Tt(i) ? Yl(i, !0) : x2(i);
      }
      function Yb(i, u) {
        var o = {};
        return u = ae(u, 3), Bn(i, function(p, v, A) {
          Hn(o, u(p, v, A), p);
        }), o;
      }
      function Qb(i, u) {
        var o = {};
        return u = ae(u, 3), Bn(i, function(p, v, A) {
          Hn(o, v, u(p, v, A));
        }), o;
      }
      var Jb = di(function(i, u, o) {
        sa(i, u, o);
      }), mc = di(function(i, u, o, p) {
        sa(i, u, o, p);
      }), jb = Vn(function(i, u) {
        var o = {};
        if (i == null)
          return o;
        var p = !1;
        u = Xe(u, function(A) {
          return A = _r(A, i), p || (p = A.length > 1), A;
        }), Sn(i, oo(i), o), p && (o = en(o, x | C | E, V2));
        for (var v = u.length; v--; )
          eo(o, u[v]);
        return o;
      });
      function ev(i, u) {
        return yc(i, ya(ae(u)));
      }
      var tv = Vn(function(i, u) {
        return i == null ? {} : B2(i, u);
      });
      function yc(i, u) {
        if (i == null)
          return {};
        var o = Xe(oo(i), function(p) {
          return [p];
        });
        return u = ae(u), dh(i, o, function(p, v) {
          return u(p, v[0]);
        });
      }
      function nv(i, u, o) {
        u = _r(u, i);
        var p = -1, v = u.length;
        for (v || (v = 1, i = e); ++p < v; ) {
          var A = i == null ? e : i[In(u[p])];
          A === e && (p = v, A = o), i = Kn(A) ? A.call(i) : A;
        }
        return i;
      }
      function rv(i, u, o) {
        return i == null ? i : Ki(i, u, o);
      }
      function iv(i, u, o, p) {
        return p = typeof p == "function" ? p : e, i == null ? i : Ki(i, u, o, p);
      }
      var Ec = Nh(lt), Cc = Nh($t);
      function uv(i, u, o) {
        var p = le(i), v = p || br(i) || _i(i);
        if (u = ae(u, 4), o == null) {
          var A = i && i.constructor;
          v ? o = p ? new A() : [] : Je(i) ? o = Kn(A) ? ci(Yu(i)) : {} : o = {};
        }
        return (v ? Qt : Bn)(i, function(S, k, O) {
          return u(o, S, k, O);
        }), o;
      }
      function av(i, u) {
        return i == null ? !0 : eo(i, u);
      }
      function sv(i, u, o) {
        return i == null ? i : bh(i, u, ro(o));
      }
      function ov(i, u, o, p) {
        return p = typeof p == "function" ? p : e, i == null ? i : bh(i, u, ro(o), p);
      }
      function wi(i) {
        return i == null ? [] : Ns(i, lt(i));
      }
      function fv(i) {
        return i == null ? [] : Ns(i, $t(i));
      }
      function lv(i, u, o) {
        return o === e && (o = u, u = e), o !== e && (o = rn(o), o = o === o ? o : 0), u !== e && (u = rn(u), u = u === u ? u : 0), Tr(rn(i), u, o);
      }
      function hv(i, u, o) {
        return u = Yn(u), o === e ? (o = u, u = 0) : o = Yn(o), i = rn(i), w2(i, u, o);
      }
      function cv(i, u, o) {
        if (o && typeof o != "boolean" && Ct(i, u, o) && (u = o = e), o === e && (typeof u == "boolean" ? (o = u, u = e) : typeof i == "boolean" && (o = i, i = e)), i === e && u === e ? (i = 0, u = 1) : (i = Yn(i), u === e ? (u = i, i = 0) : u = Yn(u)), i > u) {
          var p = i;
          i = u, u = p;
        }
        if (o || i % 1 || u % 1) {
          var v = Xl();
          return vt(i + v * (u - i + Wp("1e-" + ((v + "").length - 1))), u);
        }
        return Qs(i, u);
      }
      var dv = pi(function(i, u, o) {
        return u = u.toLowerCase(), i + (o ? Ac(u) : u);
      });
      function Ac(i) {
        return Ao(ke(i).toLowerCase());
      }
      function xc(i) {
        return i = ke(i), i && i.replace(gp, rg).replace(Rp, "");
      }
      function pv(i, u, o) {
        i = ke(i), u = qt(u);
        var p = i.length;
        o = o === e ? p : Tr(de(o), 0, p);
        var v = o;
        return o -= u.length, o >= 0 && i.slice(o, v) == u;
      }
      function gv(i) {
        return i = ke(i), i && K1.test(i) ? i.replace(rl, ig) : i;
      }
      function _v(i) {
        return i = ke(i), i && tp.test(i) ? i.replace(vs, "\\$&") : i;
      }
      var wv = pi(function(i, u, o) {
        return i + (o ? "-" : "") + u.toLowerCase();
      }), bv = pi(function(i, u, o) {
        return i + (o ? " " : "") + u.toLowerCase();
      }), vv = Sh("toLowerCase");
      function Dv(i, u, o) {
        i = ke(i), u = de(u);
        var p = u ? si(i) : 0;
        if (!u || p >= u)
          return i;
        var v = (u - p) / 2;
        return da(ea(v), o) + i + da(ju(v), o);
      }
      function mv(i, u, o) {
        i = ke(i), u = de(u);
        var p = u ? si(i) : 0;
        return u && p < u ? i + da(u - p, o) : i;
      }
      function yv(i, u, o) {
        i = ke(i), u = de(u);
        var p = u ? si(i) : 0;
        return u && p < u ? da(u - p, o) + i : i;
      }
      function Ev(i, u, o) {
        return o || u == null ? u = 0 : u && (u = +u), Ig(ke(i).replace(Ds, ""), u || 0);
      }
      function Cv(i, u, o) {
        return (o ? Ct(i, u, o) : u === e) ? u = 1 : u = de(u), Js(ke(i), u);
      }
      function Av() {
        var i = arguments, u = ke(i[0]);
        return i.length < 3 ? u : u.replace(i[1], i[2]);
      }
      var xv = pi(function(i, u, o) {
        return i + (o ? "_" : "") + u.toLowerCase();
      });
      function Fv(i, u, o) {
        return o && typeof o != "number" && Ct(i, u, o) && (u = o = e), o = o === e ? me : o >>> 0, o ? (i = ke(i), i && (typeof u == "string" || u != null && !yo(u)) && (u = qt(u), !u && ai(i)) ? wr(gn(i), 0, o) : i.split(u, o)) : [];
      }
      var Bv = pi(function(i, u, o) {
        return i + (o ? " " : "") + Ao(u);
      });
      function Sv(i, u, o) {
        return i = ke(i), o = o == null ? 0 : Tr(de(o), 0, i.length), u = qt(u), i.slice(o, o + u.length) == u;
      }
      function Iv(i, u, o) {
        var p = y.templateSettings;
        o && Ct(i, u, o) && (u = e), i = ke(i), u = Aa({}, u, p, Lh);
        var v = Aa({}, u.imports, p.imports, Lh), A = lt(v), S = Ns(v, A), k, O, V = 0, X = u.interpolate || Pu, j = "__p += '", ne = Os(
          (u.escape || Pu).source + "|" + X.source + "|" + (X === il ? fp : Pu).source + "|" + (u.evaluate || Pu).source + "|$",
          "g"
        ), ue = "//# sourceURL=" + (Re.call(u, "sourceURL") ? (u.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++Mp + "]") + `
`;
        i.replace(ne, function(oe, De, Ae, Wt, At, Ht) {
          return Ae || (Ae = Wt), j += i.slice(V, Ht).replace(_p, ug), De && (k = !0, j += `' +
__e(` + De + `) +
'`), At && (O = !0, j += `';
` + At + `;
__p += '`), Ae && (j += `' +
((__t = (` + Ae + `)) == null ? '' : __t) +
'`), V = Ht + oe.length, oe;
        }), j += `';
`;
        var se = Re.call(u, "variable") && u.variable;
        if (!se)
          j = `with (obj) {
` + j + `
}
`;
        else if (sp.test(se))
          throw new fe(l);
        j = (O ? j.replace($e, "") : j).replace(Z1, "$1").replace(V1, "$1;"), j = "function(" + (se || "obj") + `) {
` + (se ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (k ? ", __e = _.escape" : "") + (O ? `, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
` : `;
`) + j + `return __p
}`;
        var pe = Bc(function() {
          return Ie(A, ue + "return " + j).apply(e, S);
        });
        if (pe.source = j, mo(pe))
          throw pe;
        return pe;
      }
      function kv(i) {
        return ke(i).toLowerCase();
      }
      function Tv(i) {
        return ke(i).toUpperCase();
      }
      function $v(i, u, o) {
        if (i = ke(i), i && (o || u === e))
          return Ol(i);
        if (!i || !(u = qt(u)))
          return i;
        var p = gn(i), v = gn(u), A = Pl(p, v), S = Ml(p, v) + 1;
        return wr(p, A, S).join("");
      }
      function Rv(i, u, o) {
        if (i = ke(i), i && (o || u === e))
          return i.slice(0, zl(i) + 1);
        if (!i || !(u = qt(u)))
          return i;
        var p = gn(i), v = Ml(p, gn(u)) + 1;
        return wr(p, 0, v).join("");
      }
      function Nv(i, u, o) {
        if (i = ke(i), i && (o || u === e))
          return i.replace(Ds, "");
        if (!i || !(u = qt(u)))
          return i;
        var p = gn(i), v = Pl(p, gn(u));
        return wr(p, v).join("");
      }
      function Lv(i, u) {
        var o = ee, p = K;
        if (Je(u)) {
          var v = "separator" in u ? u.separator : v;
          o = "length" in u ? de(u.length) : o, p = "omission" in u ? qt(u.omission) : p;
        }
        i = ke(i);
        var A = i.length;
        if (ai(i)) {
          var S = gn(i);
          A = S.length;
        }
        if (o >= A)
          return i;
        var k = o - si(p);
        if (k < 1)
          return p;
        var O = S ? wr(S, 0, k).join("") : i.slice(0, k);
        if (v === e)
          return O + p;
        if (S && (k += O.length - k), yo(v)) {
          if (i.slice(k).search(v)) {
            var V, X = O;
            for (v.global || (v = Os(v.source, ke(ul.exec(v)) + "g")), v.lastIndex = 0; V = v.exec(X); )
              var j = V.index;
            O = O.slice(0, j === e ? k : j);
          }
        } else if (i.indexOf(qt(v), k) != k) {
          var ne = O.lastIndexOf(v);
          ne > -1 && (O = O.slice(0, ne));
        }
        return O + p;
      }
      function Ov(i) {
        return i = ke(i), i && X1.test(i) ? i.replace(nl, cg) : i;
      }
      var Pv = pi(function(i, u, o) {
        return i + (o ? " " : "") + u.toUpperCase();
      }), Ao = Sh("toUpperCase");
      function Fc(i, u, o) {
        return i = ke(i), u = o ? e : u, u === e ? sg(i) ? gg(i) : Jp(i) : i.match(u) || [];
      }
      var Bc = _e(function(i, u) {
        try {
          return Ut(i, e, u);
        } catch (o) {
          return mo(o) ? o : new fe(o);
        }
      }), Mv = Vn(function(i, u) {
        return Qt(u, function(o) {
          o = In(o), Hn(i, o, vo(i[o], i));
        }), i;
      });
      function Uv(i) {
        var u = i == null ? 0 : i.length, o = ae();
        return i = u ? Xe(i, function(p) {
          if (typeof p[1] != "function")
            throw new Jt(h);
          return [o(p[0]), p[1]];
        }) : [], _e(function(p) {
          for (var v = -1; ++v < u; ) {
            var A = i[v];
            if (Ut(A[0], this, p))
              return Ut(A[1], this, p);
          }
        });
      }
      function zv(i) {
        return c2(en(i, x));
      }
      function xo(i) {
        return function() {
          return i;
        };
      }
      function qv(i, u) {
        return i == null || i !== i ? u : i;
      }
      var Gv = kh(), Wv = kh(!0);
      function Rt(i) {
        return i;
      }
      function Fo(i) {
        return sh(typeof i == "function" ? i : en(i, x));
      }
      function Hv(i) {
        return fh(en(i, x));
      }
      function Zv(i, u) {
        return lh(i, en(u, x));
      }
      var Vv = _e(function(i, u) {
        return function(o) {
          return Vi(o, i, u);
        };
      }), Xv = _e(function(i, u) {
        return function(o) {
          return Vi(i, o, u);
        };
      });
      function Bo(i, u, o) {
        var p = lt(u), v = aa(u, p);
        o == null && !(Je(u) && (v.length || !p.length)) && (o = u, u = i, i = this, v = aa(u, lt(u)));
        var A = !(Je(o) && "chain" in o) || !!o.chain, S = Kn(i);
        return Qt(v, function(k) {
          var O = u[k];
          i[k] = O, S && (i.prototype[k] = function() {
            var V = this.__chain__;
            if (A || V) {
              var X = i(this.__wrapped__), j = X.__actions__ = kt(this.__actions__);
              return j.push({ func: O, args: arguments, thisArg: i }), X.__chain__ = V, X;
            }
            return O.apply(i, hr([this.value()], arguments));
          });
        }), i;
      }
      function Kv() {
        return ct._ === this && (ct._ = mg), this;
      }
      function So() {
      }
      function Yv(i) {
        return i = de(i), _e(function(u) {
          return hh(u, i);
        });
      }
      var Qv = uo(Xe), Jv = uo(Tl), jv = uo(Is);
      function Sc(i) {
        return co(i) ? ks(In(i)) : S2(i);
      }
      function eD(i) {
        return function(u) {
          return i == null ? e : $r(i, u);
        };
      }
      var tD = $h(), nD = $h(!0);
      function Io() {
        return [];
      }
      function ko() {
        return !1;
      }
      function rD() {
        return {};
      }
      function iD() {
        return "";
      }
      function uD() {
        return !0;
      }
      function aD(i, u) {
        if (i = de(i), i < 1 || i > Fe)
          return [];
        var o = me, p = vt(i, me);
        u = ae(u), i -= me;
        for (var v = Rs(p, u); ++o < i; )
          u(o);
        return v;
      }
      function sD(i) {
        return le(i) ? Xe(i, In) : Gt(i) ? [i] : kt(Kh(ke(i)));
      }
      function oD(i) {
        var u = ++vg;
        return ke(i) + u;
      }
      var fD = ca(function(i, u) {
        return i + u;
      }, 0), lD = ao("ceil"), hD = ca(function(i, u) {
        return i / u;
      }, 1), cD = ao("floor");
      function dD(i) {
        return i && i.length ? ua(i, Rt, Hs) : e;
      }
      function pD(i, u) {
        return i && i.length ? ua(i, ae(u, 2), Hs) : e;
      }
      function gD(i) {
        return Nl(i, Rt);
      }
      function _D(i, u) {
        return Nl(i, ae(u, 2));
      }
      function wD(i) {
        return i && i.length ? ua(i, Rt, Ks) : e;
      }
      function bD(i, u) {
        return i && i.length ? ua(i, ae(u, 2), Ks) : e;
      }
      var vD = ca(function(i, u) {
        return i * u;
      }, 1), DD = ao("round"), mD = ca(function(i, u) {
        return i - u;
      }, 0);
      function yD(i) {
        return i && i.length ? $s(i, Rt) : 0;
      }
      function ED(i, u) {
        return i && i.length ? $s(i, ae(u, 2)) : 0;
      }
      return y.after = Hw, y.ary = ac, y.assign = Tb, y.assignIn = Dc, y.assignInWith = Aa, y.assignWith = $b, y.at = Rb, y.before = sc, y.bind = vo, y.bindAll = Mv, y.bindKey = oc, y.castArray = rb, y.chain = rc, y.chunk = c_, y.compact = d_, y.concat = p_, y.cond = Uv, y.conforms = zv, y.constant = xo, y.countBy = yw, y.create = Nb, y.curry = fc, y.curryRight = lc, y.debounce = hc, y.defaults = Lb, y.defaultsDeep = Ob, y.defer = Zw, y.delay = Vw, y.difference = g_, y.differenceBy = __, y.differenceWith = w_, y.drop = b_, y.dropRight = v_, y.dropRightWhile = D_, y.dropWhile = m_, y.fill = y_, y.filter = Cw, y.flatMap = Fw, y.flatMapDeep = Bw, y.flatMapDepth = Sw, y.flatten = jh, y.flattenDeep = E_, y.flattenDepth = C_, y.flip = Xw, y.flow = Gv, y.flowRight = Wv, y.fromPairs = A_, y.functions = Wb, y.functionsIn = Hb, y.groupBy = Iw, y.initial = F_, y.intersection = B_, y.intersectionBy = S_, y.intersectionWith = I_, y.invert = Vb, y.invertBy = Xb, y.invokeMap = Tw, y.iteratee = Fo, y.keyBy = $w, y.keys = lt, y.keysIn = $t, y.map = va, y.mapKeys = Yb, y.mapValues = Qb, y.matches = Hv, y.matchesProperty = Zv, y.memoize = ma, y.merge = Jb, y.mergeWith = mc, y.method = Vv, y.methodOf = Xv, y.mixin = Bo, y.negate = ya, y.nthArg = Yv, y.omit = jb, y.omitBy = ev, y.once = Kw, y.orderBy = Rw, y.over = Qv, y.overArgs = Yw, y.overEvery = Jv, y.overSome = jv, y.partial = Do, y.partialRight = cc, y.partition = Nw, y.pick = tv, y.pickBy = yc, y.property = Sc, y.propertyOf = eD, y.pull = R_, y.pullAll = tc, y.pullAllBy = N_, y.pullAllWith = L_, y.pullAt = O_, y.range = tD, y.rangeRight = nD, y.rearg = Qw, y.reject = Pw, y.remove = P_, y.rest = Jw, y.reverse = wo, y.sampleSize = Uw, y.set = rv, y.setWith = iv, y.shuffle = zw, y.slice = M_, y.sortBy = Ww, y.sortedUniq = Z_, y.sortedUniqBy = V_, y.split = Fv, y.spread = jw, y.tail = X_, y.take = K_, y.takeRight = Y_, y.takeRightWhile = Q_, y.takeWhile = J_, y.tap = dw, y.throttle = eb, y.thru = ba, y.toArray = wc, y.toPairs = Ec, y.toPairsIn = Cc, y.toPath = sD, y.toPlainObject = vc, y.transform = uv, y.unary = tb, y.union = j_, y.unionBy = ew, y.unionWith = tw, y.uniq = nw, y.uniqBy = rw, y.uniqWith = iw, y.unset = av, y.unzip = bo, y.unzipWith = nc, y.update = sv, y.updateWith = ov, y.values = wi, y.valuesIn = fv, y.without = uw, y.words = Fc, y.wrap = nb, y.xor = aw, y.xorBy = sw, y.xorWith = ow, y.zip = fw, y.zipObject = lw, y.zipObjectDeep = hw, y.zipWith = cw, y.entries = Ec, y.entriesIn = Cc, y.extend = Dc, y.extendWith = Aa, Bo(y, y), y.add = fD, y.attempt = Bc, y.camelCase = dv, y.capitalize = Ac, y.ceil = lD, y.clamp = lv, y.clone = ib, y.cloneDeep = ab, y.cloneDeepWith = sb, y.cloneWith = ub, y.conformsTo = ob, y.deburr = xc, y.defaultTo = qv, y.divide = hD, y.endsWith = pv, y.eq = wn, y.escape = gv, y.escapeRegExp = _v, y.every = Ew, y.find = Aw, y.findIndex = Qh, y.findKey = Pb, y.findLast = xw, y.findLastIndex = Jh, y.findLastKey = Mb, y.floor = cD, y.forEach = ic, y.forEachRight = uc, y.forIn = Ub, y.forInRight = zb, y.forOwn = qb, y.forOwnRight = Gb, y.get = Eo, y.gt = fb, y.gte = lb, y.has = Zb, y.hasIn = Co, y.head = ec, y.identity = Rt, y.includes = kw, y.indexOf = x_, y.inRange = hv, y.invoke = Kb, y.isArguments = Lr, y.isArray = le, y.isArrayBuffer = hb, y.isArrayLike = Tt, y.isArrayLikeObject = tt, y.isBoolean = cb, y.isBuffer = br, y.isDate = db, y.isElement = pb, y.isEmpty = gb, y.isEqual = _b, y.isEqualWith = wb, y.isError = mo, y.isFinite = bb, y.isFunction = Kn, y.isInteger = dc, y.isLength = Ea, y.isMap = pc, y.isMatch = vb, y.isMatchWith = Db, y.isNaN = mb, y.isNative = yb, y.isNil = Cb, y.isNull = Eb, y.isNumber = gc, y.isObject = Je, y.isObjectLike = je, y.isPlainObject = ji, y.isRegExp = yo, y.isSafeInteger = Ab, y.isSet = _c, y.isString = Ca, y.isSymbol = Gt, y.isTypedArray = _i, y.isUndefined = xb, y.isWeakMap = Fb, y.isWeakSet = Bb, y.join = k_, y.kebabCase = wv, y.last = nn, y.lastIndexOf = T_, y.lowerCase = bv, y.lowerFirst = vv, y.lt = Sb, y.lte = Ib, y.max = dD, y.maxBy = pD, y.mean = gD, y.meanBy = _D, y.min = wD, y.minBy = bD, y.stubArray = Io, y.stubFalse = ko, y.stubObject = rD, y.stubString = iD, y.stubTrue = uD, y.multiply = vD, y.nth = $_, y.noConflict = Kv, y.noop = So, y.now = Da, y.pad = Dv, y.padEnd = mv, y.padStart = yv, y.parseInt = Ev, y.random = cv, y.reduce = Lw, y.reduceRight = Ow, y.repeat = Cv, y.replace = Av, y.result = nv, y.round = DD, y.runInContext = N, y.sample = Mw, y.size = qw, y.snakeCase = xv, y.some = Gw, y.sortedIndex = U_, y.sortedIndexBy = z_, y.sortedIndexOf = q_, y.sortedLastIndex = G_, y.sortedLastIndexBy = W_, y.sortedLastIndexOf = H_, y.startCase = Bv, y.startsWith = Sv, y.subtract = mD, y.sum = yD, y.sumBy = ED, y.template = Iv, y.times = aD, y.toFinite = Yn, y.toInteger = de, y.toLength = bc, y.toLower = kv, y.toNumber = rn, y.toSafeInteger = kb, y.toString = ke, y.toUpper = Tv, y.trim = $v, y.trimEnd = Rv, y.trimStart = Nv, y.truncate = Lv, y.unescape = Ov, y.uniqueId = oD, y.upperCase = Pv, y.upperFirst = Ao, y.each = ic, y.eachRight = uc, y.first = ec, Bo(y, function() {
        var i = {};
        return Bn(y, function(u, o) {
          Re.call(y.prototype, o) || (i[o] = u);
        }), i;
      }(), { chain: !1 }), y.VERSION = a, Qt(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(i) {
        y[i].placeholder = y;
      }), Qt(["drop", "take"], function(i, u) {
        ye.prototype[i] = function(o) {
          o = o === e ? 1 : st(de(o), 0);
          var p = this.__filtered__ && !u ? new ye(this) : this.clone();
          return p.__filtered__ ? p.__takeCount__ = vt(o, p.__takeCount__) : p.__views__.push({
            size: vt(o, me),
            type: i + (p.__dir__ < 0 ? "Right" : "")
          }), p;
        }, ye.prototype[i + "Right"] = function(o) {
          return this.reverse()[i](o).reverse();
        };
      }), Qt(["filter", "map", "takeWhile"], function(i, u) {
        var o = u + 1, p = o == be || o == Ne;
        ye.prototype[i] = function(v) {
          var A = this.clone();
          return A.__iteratees__.push({
            iteratee: ae(v, 3),
            type: o
          }), A.__filtered__ = A.__filtered__ || p, A;
        };
      }), Qt(["head", "last"], function(i, u) {
        var o = "take" + (u ? "Right" : "");
        ye.prototype[i] = function() {
          return this[o](1).value()[0];
        };
      }), Qt(["initial", "tail"], function(i, u) {
        var o = "drop" + (u ? "" : "Right");
        ye.prototype[i] = function() {
          return this.__filtered__ ? new ye(this) : this[o](1);
        };
      }), ye.prototype.compact = function() {
        return this.filter(Rt);
      }, ye.prototype.find = function(i) {
        return this.filter(i).head();
      }, ye.prototype.findLast = function(i) {
        return this.reverse().find(i);
      }, ye.prototype.invokeMap = _e(function(i, u) {
        return typeof i == "function" ? new ye(this) : this.map(function(o) {
          return Vi(o, i, u);
        });
      }), ye.prototype.reject = function(i) {
        return this.filter(ya(ae(i)));
      }, ye.prototype.slice = function(i, u) {
        i = de(i);
        var o = this;
        return o.__filtered__ && (i > 0 || u < 0) ? new ye(o) : (i < 0 ? o = o.takeRight(-i) : i && (o = o.drop(i)), u !== e && (u = de(u), o = u < 0 ? o.dropRight(-u) : o.take(u - i)), o);
      }, ye.prototype.takeRightWhile = function(i) {
        return this.reverse().takeWhile(i).reverse();
      }, ye.prototype.toArray = function() {
        return this.take(me);
      }, Bn(ye.prototype, function(i, u) {
        var o = /^(?:filter|find|map|reject)|While$/.test(u), p = /^(?:head|last)$/.test(u), v = y[p ? "take" + (u == "last" ? "Right" : "") : u], A = p || /^find/.test(u);
        v && (y.prototype[u] = function() {
          var S = this.__wrapped__, k = p ? [1] : arguments, O = S instanceof ye, V = k[0], X = O || le(S), j = function(De) {
            var Ae = v.apply(y, hr([De], k));
            return p && ne ? Ae[0] : Ae;
          };
          X && o && typeof V == "function" && V.length != 1 && (O = X = !1);
          var ne = this.__chain__, ue = !!this.__actions__.length, se = A && !ne, pe = O && !ue;
          if (!A && X) {
            S = pe ? S : new ye(this);
            var oe = i.apply(S, k);
            return oe.__actions__.push({ func: ba, args: [j], thisArg: e }), new jt(oe, ne);
          }
          return se && pe ? i.apply(this, k) : (oe = this.thru(j), se ? p ? oe.value()[0] : oe.value() : oe);
        });
      }), Qt(["pop", "push", "shift", "sort", "splice", "unshift"], function(i) {
        var u = Wu[i], o = /^(?:push|sort|unshift)$/.test(i) ? "tap" : "thru", p = /^(?:pop|shift)$/.test(i);
        y.prototype[i] = function() {
          var v = arguments;
          if (p && !this.__chain__) {
            var A = this.value();
            return u.apply(le(A) ? A : [], v);
          }
          return this[o](function(S) {
            return u.apply(le(S) ? S : [], v);
          });
        };
      }), Bn(ye.prototype, function(i, u) {
        var o = y[u];
        if (o) {
          var p = o.name + "";
          Re.call(hi, p) || (hi[p] = []), hi[p].push({ name: u, func: o });
        }
      }), hi[ha(e, T).name] = [{
        name: "wrapper",
        func: e
      }], ye.prototype.clone = Og, ye.prototype.reverse = Pg, ye.prototype.value = Mg, y.prototype.at = pw, y.prototype.chain = gw, y.prototype.commit = _w, y.prototype.next = ww, y.prototype.plant = vw, y.prototype.reverse = Dw, y.prototype.toJSON = y.prototype.valueOf = y.prototype.value = mw, y.prototype.first = y.prototype.head, Ui && (y.prototype[Ui] = bw), y;
    }, oi = _g();
    Br ? ((Br.exports = oi)._ = oi, xs._ = oi) : ct._ = oi;
  }).call(eu);
})(Va, Va.exports);
var xD = Va.exports, Ot = /* @__PURE__ */ is(xD), FD = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/, BD = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/, SD = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/, To = {
  Space_Separator: FD,
  ID_Start: BD,
  ID_Continue: SD
}, it = {
  isSpaceSeparator(n) {
    return typeof n == "string" && To.Space_Separator.test(n);
  },
  isIdStartChar(n) {
    return typeof n == "string" && (n >= "a" && n <= "z" || n >= "A" && n <= "Z" || n === "$" || n === "_" || To.ID_Start.test(n));
  },
  isIdContinueChar(n) {
    return typeof n == "string" && (n >= "a" && n <= "z" || n >= "A" && n <= "Z" || n >= "0" && n <= "9" || n === "$" || n === "_" || n === "‌" || n === "‍" || To.ID_Continue.test(n));
  },
  isDigit(n) {
    return typeof n == "string" && /[0-9]/.test(n);
  },
  isHexDigit(n) {
    return typeof n == "string" && /[0-9A-Fa-f]/.test(n);
  }
};
let pf, Bt, rr, Xa, xr, mn, ht, $f, fu;
var ID = function(t, e) {
  pf = String(t), Bt = "start", rr = [], Xa = 0, xr = 1, mn = 0, ht = void 0, $f = void 0, fu = void 0;
  do
    ht = kD(), RD[Bt]();
  while (ht.type !== "eof");
  return typeof e == "function" ? gf({ "": fu }, "", e) : fu;
};
function gf(n, t, e) {
  const a = n[t];
  if (a != null && typeof a == "object")
    if (Array.isArray(a))
      for (let f = 0; f < a.length; f++) {
        const s = String(f), h = gf(a, s, e);
        h === void 0 ? delete a[s] : Object.defineProperty(a, s, {
          value: h,
          writable: !0,
          enumerable: !0,
          configurable: !0
        });
      }
    else
      for (const f in a) {
        const s = gf(a, f, e);
        s === void 0 ? delete a[f] : Object.defineProperty(a, f, {
          value: s,
          writable: !0,
          enumerable: !0,
          configurable: !0
        });
      }
  return e.call(n, t, a);
}
let ge, he, uu, er, Ee;
function kD() {
  for (ge = "default", he = "", uu = !1, er = 1; ; ) {
    Ee = ur();
    const n = bd[ge]();
    if (n)
      return n;
  }
}
function ur() {
  if (pf[Xa])
    return String.fromCodePoint(pf.codePointAt(Xa));
}
function Y() {
  const n = ur();
  return n === `
` ? (xr++, mn = 0) : n ? mn += n.length : mn++, n && (Xa += n.length), n;
}
const bd = {
  default() {
    switch (Ee) {
      case "	":
      case "\v":
      case "\f":
      case " ":
      case " ":
      case "\uFEFF":
      case `
`:
      case "\r":
      case "\u2028":
      case "\u2029":
        Y();
        return;
      case "/":
        Y(), ge = "comment";
        return;
      case void 0:
        return Y(), Ze("eof");
    }
    if (it.isSpaceSeparator(Ee)) {
      Y();
      return;
    }
    return bd[Bt]();
  },
  comment() {
    switch (Ee) {
      case "*":
        Y(), ge = "multiLineComment";
        return;
      case "/":
        Y(), ge = "singleLineComment";
        return;
    }
    throw Ve(Y());
  },
  multiLineComment() {
    switch (Ee) {
      case "*":
        Y(), ge = "multiLineCommentAsterisk";
        return;
      case void 0:
        throw Ve(Y());
    }
    Y();
  },
  multiLineCommentAsterisk() {
    switch (Ee) {
      case "*":
        Y();
        return;
      case "/":
        Y(), ge = "default";
        return;
      case void 0:
        throw Ve(Y());
    }
    Y(), ge = "multiLineComment";
  },
  singleLineComment() {
    switch (Ee) {
      case `
`:
      case "\r":
      case "\u2028":
      case "\u2029":
        Y(), ge = "default";
        return;
      case void 0:
        return Y(), Ze("eof");
    }
    Y();
  },
  value() {
    switch (Ee) {
      case "{":
      case "[":
        return Ze("punctuator", Y());
      case "n":
        return Y(), Or("ull"), Ze("null", null);
      case "t":
        return Y(), Or("rue"), Ze("boolean", !0);
      case "f":
        return Y(), Or("alse"), Ze("boolean", !1);
      case "-":
      case "+":
        Y() === "-" && (er = -1), ge = "sign";
        return;
      case ".":
        he = Y(), ge = "decimalPointLeading";
        return;
      case "0":
        he = Y(), ge = "zero";
        return;
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        he = Y(), ge = "decimalInteger";
        return;
      case "I":
        return Y(), Or("nfinity"), Ze("numeric", 1 / 0);
      case "N":
        return Y(), Or("aN"), Ze("numeric", NaN);
      case '"':
      case "'":
        uu = Y() === '"', he = "", ge = "string";
        return;
    }
    throw Ve(Y());
  },
  identifierNameStartEscape() {
    if (Ee !== "u")
      throw Ve(Y());
    Y();
    const n = _f();
    switch (n) {
      case "$":
      case "_":
        break;
      default:
        if (!it.isIdStartChar(n))
          throw kc();
        break;
    }
    he += n, ge = "identifierName";
  },
  identifierName() {
    switch (Ee) {
      case "$":
      case "_":
      case "‌":
      case "‍":
        he += Y();
        return;
      case "\\":
        Y(), ge = "identifierNameEscape";
        return;
    }
    if (it.isIdContinueChar(Ee)) {
      he += Y();
      return;
    }
    return Ze("identifier", he);
  },
  identifierNameEscape() {
    if (Ee !== "u")
      throw Ve(Y());
    Y();
    const n = _f();
    switch (n) {
      case "$":
      case "_":
      case "‌":
      case "‍":
        break;
      default:
        if (!it.isIdContinueChar(n))
          throw kc();
        break;
    }
    he += n, ge = "identifierName";
  },
  sign() {
    switch (Ee) {
      case ".":
        he = Y(), ge = "decimalPointLeading";
        return;
      case "0":
        he = Y(), ge = "zero";
        return;
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        he = Y(), ge = "decimalInteger";
        return;
      case "I":
        return Y(), Or("nfinity"), Ze("numeric", er * (1 / 0));
      case "N":
        return Y(), Or("aN"), Ze("numeric", NaN);
    }
    throw Ve(Y());
  },
  zero() {
    switch (Ee) {
      case ".":
        he += Y(), ge = "decimalPoint";
        return;
      case "e":
      case "E":
        he += Y(), ge = "decimalExponent";
        return;
      case "x":
      case "X":
        he += Y(), ge = "hexadecimal";
        return;
    }
    return Ze("numeric", er * 0);
  },
  decimalInteger() {
    switch (Ee) {
      case ".":
        he += Y(), ge = "decimalPoint";
        return;
      case "e":
      case "E":
        he += Y(), ge = "decimalExponent";
        return;
    }
    if (it.isDigit(Ee)) {
      he += Y();
      return;
    }
    return Ze("numeric", er * Number(he));
  },
  decimalPointLeading() {
    if (it.isDigit(Ee)) {
      he += Y(), ge = "decimalFraction";
      return;
    }
    throw Ve(Y());
  },
  decimalPoint() {
    switch (Ee) {
      case "e":
      case "E":
        he += Y(), ge = "decimalExponent";
        return;
    }
    if (it.isDigit(Ee)) {
      he += Y(), ge = "decimalFraction";
      return;
    }
    return Ze("numeric", er * Number(he));
  },
  decimalFraction() {
    switch (Ee) {
      case "e":
      case "E":
        he += Y(), ge = "decimalExponent";
        return;
    }
    if (it.isDigit(Ee)) {
      he += Y();
      return;
    }
    return Ze("numeric", er * Number(he));
  },
  decimalExponent() {
    switch (Ee) {
      case "+":
      case "-":
        he += Y(), ge = "decimalExponentSign";
        return;
    }
    if (it.isDigit(Ee)) {
      he += Y(), ge = "decimalExponentInteger";
      return;
    }
    throw Ve(Y());
  },
  decimalExponentSign() {
    if (it.isDigit(Ee)) {
      he += Y(), ge = "decimalExponentInteger";
      return;
    }
    throw Ve(Y());
  },
  decimalExponentInteger() {
    if (it.isDigit(Ee)) {
      he += Y();
      return;
    }
    return Ze("numeric", er * Number(he));
  },
  hexadecimal() {
    if (it.isHexDigit(Ee)) {
      he += Y(), ge = "hexadecimalInteger";
      return;
    }
    throw Ve(Y());
  },
  hexadecimalInteger() {
    if (it.isHexDigit(Ee)) {
      he += Y();
      return;
    }
    return Ze("numeric", er * Number(he));
  },
  string() {
    switch (Ee) {
      case "\\":
        Y(), he += TD();
        return;
      case '"':
        if (uu)
          return Y(), Ze("string", he);
        he += Y();
        return;
      case "'":
        if (!uu)
          return Y(), Ze("string", he);
        he += Y();
        return;
      case `
`:
      case "\r":
        throw Ve(Y());
      case "\u2028":
      case "\u2029":
        ND(Ee);
        break;
      case void 0:
        throw Ve(Y());
    }
    he += Y();
  },
  start() {
    switch (Ee) {
      case "{":
      case "[":
        return Ze("punctuator", Y());
    }
    ge = "value";
  },
  beforePropertyName() {
    switch (Ee) {
      case "$":
      case "_":
        he = Y(), ge = "identifierName";
        return;
      case "\\":
        Y(), ge = "identifierNameStartEscape";
        return;
      case "}":
        return Ze("punctuator", Y());
      case '"':
      case "'":
        uu = Y() === '"', ge = "string";
        return;
    }
    if (it.isIdStartChar(Ee)) {
      he += Y(), ge = "identifierName";
      return;
    }
    throw Ve(Y());
  },
  afterPropertyName() {
    if (Ee === ":")
      return Ze("punctuator", Y());
    throw Ve(Y());
  },
  beforePropertyValue() {
    ge = "value";
  },
  afterPropertyValue() {
    switch (Ee) {
      case ",":
      case "}":
        return Ze("punctuator", Y());
    }
    throw Ve(Y());
  },
  beforeArrayValue() {
    if (Ee === "]")
      return Ze("punctuator", Y());
    ge = "value";
  },
  afterArrayValue() {
    switch (Ee) {
      case ",":
      case "]":
        return Ze("punctuator", Y());
    }
    throw Ve(Y());
  },
  end() {
    throw Ve(Y());
  }
};
function Ze(n, t) {
  return {
    type: n,
    value: t,
    line: xr,
    column: mn
  };
}
function Or(n) {
  for (const t of n) {
    if (ur() !== t)
      throw Ve(Y());
    Y();
  }
}
function TD() {
  switch (ur()) {
    case "b":
      return Y(), "\b";
    case "f":
      return Y(), "\f";
    case "n":
      return Y(), `
`;
    case "r":
      return Y(), "\r";
    case "t":
      return Y(), "	";
    case "v":
      return Y(), "\v";
    case "0":
      if (Y(), it.isDigit(ur()))
        throw Ve(Y());
      return "\0";
    case "x":
      return Y(), $D();
    case "u":
      return Y(), _f();
    case `
`:
    case "\u2028":
    case "\u2029":
      return Y(), "";
    case "\r":
      return Y(), ur() === `
` && Y(), "";
    case "1":
    case "2":
    case "3":
    case "4":
    case "5":
    case "6":
    case "7":
    case "8":
    case "9":
      throw Ve(Y());
    case void 0:
      throw Ve(Y());
  }
  return Y();
}
function $D() {
  let n = "", t = ur();
  if (!it.isHexDigit(t) || (n += Y(), t = ur(), !it.isHexDigit(t)))
    throw Ve(Y());
  return n += Y(), String.fromCodePoint(parseInt(n, 16));
}
function _f() {
  let n = "", t = 4;
  for (; t-- > 0; ) {
    const e = ur();
    if (!it.isHexDigit(e))
      throw Ve(Y());
    n += Y();
  }
  return String.fromCodePoint(parseInt(n, 16));
}
const RD = {
  start() {
    if (ht.type === "eof")
      throw Pr();
    $o();
  },
  beforePropertyName() {
    switch (ht.type) {
      case "identifier":
      case "string":
        $f = ht.value, Bt = "afterPropertyName";
        return;
      case "punctuator":
        xa();
        return;
      case "eof":
        throw Pr();
    }
  },
  afterPropertyName() {
    if (ht.type === "eof")
      throw Pr();
    Bt = "beforePropertyValue";
  },
  beforePropertyValue() {
    if (ht.type === "eof")
      throw Pr();
    $o();
  },
  beforeArrayValue() {
    if (ht.type === "eof")
      throw Pr();
    if (ht.type === "punctuator" && ht.value === "]") {
      xa();
      return;
    }
    $o();
  },
  afterPropertyValue() {
    if (ht.type === "eof")
      throw Pr();
    switch (ht.value) {
      case ",":
        Bt = "beforePropertyName";
        return;
      case "}":
        xa();
    }
  },
  afterArrayValue() {
    if (ht.type === "eof")
      throw Pr();
    switch (ht.value) {
      case ",":
        Bt = "beforeArrayValue";
        return;
      case "]":
        xa();
    }
  },
  end() {
  }
};
function $o() {
  let n;
  switch (ht.type) {
    case "punctuator":
      switch (ht.value) {
        case "{":
          n = {};
          break;
        case "[":
          n = [];
          break;
      }
      break;
    case "null":
    case "boolean":
    case "numeric":
    case "string":
      n = ht.value;
      break;
  }
  if (fu === void 0)
    fu = n;
  else {
    const t = rr[rr.length - 1];
    Array.isArray(t) ? t.push(n) : Object.defineProperty(t, $f, {
      value: n,
      writable: !0,
      enumerable: !0,
      configurable: !0
    });
  }
  if (n !== null && typeof n == "object")
    rr.push(n), Array.isArray(n) ? Bt = "beforeArrayValue" : Bt = "beforePropertyName";
  else {
    const t = rr[rr.length - 1];
    t == null ? Bt = "end" : Array.isArray(t) ? Bt = "afterArrayValue" : Bt = "afterPropertyValue";
  }
}
function xa() {
  rr.pop();
  const n = rr[rr.length - 1];
  n == null ? Bt = "end" : Array.isArray(n) ? Bt = "afterArrayValue" : Bt = "afterPropertyValue";
}
function Ve(n) {
  return Ka(n === void 0 ? `JSON5: invalid end of input at ${xr}:${mn}` : `JSON5: invalid character '${vd(n)}' at ${xr}:${mn}`);
}
function Pr() {
  return Ka(`JSON5: invalid end of input at ${xr}:${mn}`);
}
function kc() {
  return mn -= 5, Ka(`JSON5: invalid identifier character at ${xr}:${mn}`);
}
function ND(n) {
  console.warn(`JSON5: '${vd(n)}' in strings is not valid ECMAScript; consider escaping`);
}
function vd(n) {
  const t = {
    "'": "\\'",
    '"': '\\"',
    "\\": "\\\\",
    "\b": "\\b",
    "\f": "\\f",
    "\n": "\\n",
    "\r": "\\r",
    "	": "\\t",
    "\v": "\\v",
    "\0": "\\0",
    "\u2028": "\\u2028",
    "\u2029": "\\u2029"
  };
  if (t[n])
    return t[n];
  if (n < " ") {
    const e = n.charCodeAt(0).toString(16);
    return "\\x" + ("00" + e).substring(e.length);
  }
  return n;
}
function Ka(n) {
  const t = new SyntaxError(n);
  return t.lineNumber = xr, t.columnNumber = mn, t;
}
var LD = function(t, e, a) {
  const f = [];
  let s = "", h, l, D = "", c;
  if (e != null && typeof e == "object" && !Array.isArray(e) && (a = e.space, c = e.quote, e = e.replacer), typeof e == "function")
    l = e;
  else if (Array.isArray(e)) {
    h = [];
    for (const B of e) {
      let M;
      typeof B == "string" ? M = B : (typeof B == "number" || B instanceof String || B instanceof Number) && (M = String(B)), M !== void 0 && h.indexOf(M) < 0 && h.push(M);
    }
  }
  return a instanceof Number ? a = Number(a) : a instanceof String && (a = String(a)), typeof a == "number" ? a > 0 && (a = Math.min(10, Math.floor(a)), D = "          ".substr(0, a)) : typeof a == "string" && (D = a.substr(0, 10)), d("", { "": t });
  function d(B, M) {
    let T = M[B];
    switch (T != null && (typeof T.toJSON5 == "function" ? T = T.toJSON5(B) : typeof T.toJSON == "function" && (T = T.toJSON(B))), l && (T = l.call(M, B, T)), T instanceof Number ? T = Number(T) : T instanceof String ? T = String(T) : T instanceof Boolean && (T = T.valueOf()), T) {
      case null:
        return "null";
      case !0:
        return "true";
      case !1:
        return "false";
    }
    if (typeof T == "string")
      return x(T);
    if (typeof T == "number")
      return String(T);
    if (typeof T == "object")
      return Array.isArray(T) ? I(T) : C(T);
  }
  function x(B) {
    const M = {
      "'": 0.1,
      '"': 0.2
    }, T = {
      "'": "\\'",
      '"': '\\"',
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\v": "\\v",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    let G = "";
    for (let $ = 0; $ < B.length; $++) {
      const L = B[$];
      switch (L) {
        case "'":
        case '"':
          M[L]++, G += L;
          continue;
        case "\0":
          if (it.isDigit(B[$ + 1])) {
            G += "\\x00";
            continue;
          }
      }
      if (T[L]) {
        G += T[L];
        continue;
      }
      if (L < " ") {
        let Q = L.charCodeAt(0).toString(16);
        G += "\\x" + ("00" + Q).substring(Q.length);
        continue;
      }
      G += L;
    }
    const P = c || Object.keys(M).reduce(($, L) => M[$] < M[L] ? $ : L);
    return G = G.replace(new RegExp(P, "g"), T[P]), P + G + P;
  }
  function C(B) {
    if (f.indexOf(B) >= 0)
      throw TypeError("Converting circular structure to JSON5");
    f.push(B);
    let M = s;
    s = s + D;
    let T = h || Object.keys(B), G = [];
    for (const $ of T) {
      const L = d($, B);
      if (L !== void 0) {
        let Q = E($) + ":";
        D !== "" && (Q += " "), Q += L, G.push(Q);
      }
    }
    let P;
    if (G.length === 0)
      P = "{}";
    else {
      let $;
      if (D === "")
        $ = G.join(","), P = "{" + $ + "}";
      else {
        let L = `,
` + s;
        $ = G.join(L), P = `{
` + s + $ + `,
` + M + "}";
      }
    }
    return f.pop(), s = M, P;
  }
  function E(B) {
    if (B.length === 0)
      return x(B);
    const M = String.fromCodePoint(B.codePointAt(0));
    if (!it.isIdStartChar(M))
      return x(B);
    for (let T = M.length; T < B.length; T++)
      if (!it.isIdContinueChar(String.fromCodePoint(B.codePointAt(T))))
        return x(B);
    return B;
  }
  function I(B) {
    if (f.indexOf(B) >= 0)
      throw TypeError("Converting circular structure to JSON5");
    f.push(B);
    let M = s;
    s = s + D;
    let T = [];
    for (let P = 0; P < B.length; P++) {
      const $ = d(String(P), B);
      T.push($ !== void 0 ? $ : "null");
    }
    let G;
    if (T.length === 0)
      G = "[]";
    else if (D === "")
      G = "[" + T.join(",") + "]";
    else {
      let P = `,
` + s, $ = T.join(P);
      G = `[
` + s + $ + `,
` + M + "]";
    }
    return f.pop(), s = M, G;
  }
};
const OD = {
  parse: ID,
  stringify: LD
};
var PD = OD;
class Te {
  /**
   * Makes a new instance.  The input should represent a 0-indexed open interval.
   *
   * @param {number} start - start of the interval, inclusive
   * @param {number} end - end of the interval, exclusive
   * @throws {RangeError} if the end is less than the start
   */
  constructor(t, e) {
    if (this.start = t, this.end = e, e < t)
      throw new RangeError("End cannot be less than start");
    this.start = t, this.end = e;
  }
  /**
   * @returns {IOpenInterval}
   */
  serialize() {
    return this;
  }
  /**
   * Creates an OpenInterval from an object.
   *
   * @param {IOpenInterval} object - object to use
   * @return {OpenInterval} OpenInterval created from the object
   */
  static deserialize(t) {
    return new Te(t.start, t.end);
  }
  /**
   * Enables the spread operator for OpenIntervals.
   */
  *[Symbol.iterator]() {
    yield this.start, yield this.end;
  }
  /**
   * Intersects this and another OpenInterval, and returns the result in as a new OpenInterval.  Returns null if there
   * is no intersection at all.
   *
   * @param {OpenInterval} other - other OpenInterval to intersect
   * @return {OpenInterval} intersection of this and the other interval
   */
  getOverlap(t) {
    const e = Math.max(this.start, t.start), a = Math.min(this.end, t.end);
    return e < a ? new Te(e, a) : null;
  }
  /**
   * @return {number} the length of this interval
   */
  getLength() {
    return this.end - this.start;
  }
  /**
   * @return {string} human-readable representation of this instance
   */
  toString() {
    return `[${this.start}, ${this.end})`;
  }
}
class Qe extends Te {
  /**
   * Makes a new instance.  The input interval should be a 0-indexed open one.
   *
   * @param {string} chr - name of the chromosome
   * @param {number} start - start of the interval, inclusive
   * @param {number} end - end of the interval, exclusive
   */
  constructor(t, e, a) {
    super(e, a), this.chr = t, this.start = e, this.end = a;
  }
  /**
   * Parses a string representing a ChromosomeInterval, such as those produced by the toString() method.  Throws an
   * error if parsing fails.
   *
   * @param {string} str - interval to parse
   * @return {ChromosomeInterval} parsed instance
   * @throws {RangeError} if parsing fails
   */
  static parse(t) {
    const e = t.replace(/,/g, "").match(/([\w:.]+)\W+(\d+)\W+(\d+)/), a = t.includes(":") ? 1 : 0;
    if (e) {
      const f = e[1], s = Math.max(
        Number.parseInt(e[2], 10) - a,
        0
      ), h = Number.parseInt(e[3], 10);
      return new Qe(f, s, h);
    } else
      throw new RangeError("Could not parse interval");
  }
  /**
   * Merges chromosome intervals based on proximity and chromosome name.  Does not mutate any inputs.
   *
   * This function accepts a list of objects of arbitrary type, as long a ChromosomeInterval can be extracted through
   * the `iteratee` callback.  The `mergeDistance` parameter expresses a distance in bases at which two loci are close
   * enough to warrant merging.
   *
   * @param {T[]} objects - objects from which ChromosomeIntervals can be extracted
   * @param {number} mergeDistance - distance in bases at which two intervals are close enough to merge
   * @param {(object: T) => ChromosomeInterval} iteratee - callback that accepts an object and returns a locus
   * @return {object[]}
   */
  static mergeAdvanced(t, e, a) {
    const f = Ot.groupBy(t, (h) => a(h).chr), s = [];
    for (const h in f) {
      const l = f[h];
      l.sort(
        (d, x) => a(d).start - a(x).start
      );
      const D = l.map(a);
      let c = 0;
      for (; c < D.length; ) {
        const d = D[c].start;
        let x = D[c].end, C = c + 1;
        for (; C < D.length; ) {
          const [E, I] = D[C];
          if (E - x > e)
            break;
          I > x && (x = I), C++;
        }
        s.push({
          locus: new Qe(h, d, x),
          sources: l.slice(c, C)
        }), c = C;
      }
    }
    return s;
  }
  /**
   * Merges chromosome intervals based on proximity, by default 2000 bp.  Does not mutate any inputs.
   *
   * @param {ChromosomeInterval[]} intervals - interval list to inspect for overlaps
   * @param {number} [mergeDistance] - distance in bases at which two intervals are close enough to merge
   * @return {ChromosomeInterval[]} - version of input list with intervals merged
   */
  static mergeOverlaps(t, e = 2e3) {
    return Qe.mergeAdvanced(
      t,
      e,
      Ot.identity
    ).map((f) => f.locus);
  }
  serialize() {
    return this;
  }
  static deserialize(t) {
    return new Qe(t.chr, t.start, t.end);
  }
  /**
   * Enables the spread operator for ChromosomeIntervals.
   */
  *[Symbol.iterator]() {
    yield this.start, yield this.end;
  }
  /**
   * @return {number} the length of this interval in base pairs
   */
  getLength() {
    return this.end - this.start;
  }
  /**
   * Intersects this and another ChromosomeInterval, and returns the result in as a new ChromosomeInterval.  Returns
   * null if there is no intersection at all.
   *
   * @param {ChromosomeInterval} other - other ChromosomeInterval to intersect
   * @return {ChromosomeInterval} intersection of this and the other interval, or null if none exists
   */
  getOverlap(t) {
    if (this.chr !== t.chr)
      return null;
    {
      const e = this.toOpenInterval().getOverlap(t);
      return e ? new Qe(this.chr, e.start, e.end) : null;
    }
  }
  /**
   * Checks if the current interval is within the larger interval
   * @param other larger interval
   * @returns true if within
   */
  // isWithin(other: ChromosomeInterval): boolean {
  //     return ;
  // }
  /**
   * @return {string} human-readable representation of this interval
   */
  toString() {
    return `${this.chr}:${this.start}-${this.end}`;
  }
  /**
   * @return {OpenInterval} an OpenInterval version of this instance.
   */
  toOpenInterval() {
    return new Te(this.start, this.end);
  }
  /**
   * Interprets this and another interval as a multi-chromosome interval, with this being the start and the other
   * being the end.  Returns a human-readable representation of that interpretation.
   *
   * @param {ChromosomeInterval} other - the "end" of the multi-chromosome interval
   * @return {string} a human-readable representation of a multi-chromosome interval
   */
  toStringWithOther(t) {
    return `${this.chr}:${this.start}-${t.chr}:${t.end}`;
  }
}
const MD = "+", UD = "-";
class Pn {
  /**
   * Makes a new instance with specified name and locus.  Empty names are valid.  If given `undefined` or `null`, it
   * defaults to the locus as a string.
   *
   * @param {string} [name] - name of the feature
   * @param {ChromosomeInterval} locus - genomic location of the feature
   * @param {Strand} strand - strand info
   */
  constructor(t, e, a = "") {
    we(this, "name");
    // - name of the feature
    we(this, "score");
    we(this, "id");
    we(this, "sequence");
    this.locus = e, this.strand = a, this.name = t === void 0 ? e.toString() : t, this.locus = e, this.strand = a;
  }
  serialize() {
    return {
      name: this.name,
      locus: this.getLocus().serialize(),
      strand: this.strand
    };
  }
  static deserialize(t) {
    return new Pn(
      t.name,
      Qe.deserialize(t.locus),
      t.strand
    );
  }
  /**
   * @return {string} the name of this feature
   */
  getName() {
    return this.name;
  }
  /**
   * @return {ChromosomeInterval} the genomic location of this feature
   */
  getLocus() {
    return this.locus;
  }
  /**
   * @return {number} the length of this feature's locus
   */
  getLength() {
    return this.locus.getLength();
  }
  /**
   * @return {string} raw strand info of this instance
   */
  getStrand() {
    return this.strand;
  }
  /**
   * @return {boolean} whether this feature is on the forward strand
   */
  getIsForwardStrand() {
    return this.strand === MD;
  }
  /**
   * @return {boolean} whether this feature is on the reverse strand
   */
  getIsReverseStrand() {
    return this.strand === UD;
  }
  /**
   * @return {boolean} whether this feature has strand info
   */
  getHasStrand() {
    return this.getIsForwardStrand() || this.getIsReverseStrand();
  }
  /**
   * Shortcut for navContext.convertGenomeIntervalToBases().  Computes nav context coordinates occupied by this
   * instance's locus.
   *
   * @param {NavigationContext} navContext - the navigation context for which to compute coordinates
   * @return {OpenInterval[]} coordinates in the navigation context
   */
  computeNavContextCoordinates(t) {
    return t.convertGenomeIntervalToBases(this.getLocus());
  }
}
const zD = "-";
class qD extends Pn {
  constructor(e) {
    const a = new Qe(e.chr, e.start, e.end);
    super(e[3].id, a, e.strand);
    /**
     * Constructs a new AlignmentRecord, given a record from genomealignment source
     *
     */
    we(this, "queryLocus");
    we(this, "targetSeq");
    we(this, "querySeq");
    we(this, "queryStrand");
    const { chr: f, start: s, stop: h, strand: l, targetseq: D, queryseq: c } = e[3].genomealign;
    this.queryLocus = new Qe(f, s, h), this.querySeq = c || "", this.targetSeq = D || "", this.queryStrand = l;
  }
  getIsReverseStrandQuery() {
    return this.queryStrand === zD;
  }
}
class an {
  // End base of the interval, relative to the feature's start
  /**
   * Makes a new instance, attaching a interval to a Feature.  If start and end are not provided, the interval
   * defaults to the entire length of the feature.  The start and end parameters should express a *0-indexed open
   * interval*.
   *
   * @param {Feature} feature - the interval's feature
   * @param {number} [start] - start base of the interval, relative to the feature's start
   * @param {number} [end] - end base of the interval, relative to the feature's start
   * @throws {RangeError} if end is before start or the interval lies outside the feature
   */
  constructor(t, e = 0, a) {
    we(this, "relativeStart");
    // Start base of the interval, relative to the feature's start
    we(this, "relativeEnd");
    if (this.feature = t, a === void 0 && (a = t.locus.end - t.locus.start), a < e)
      throw new RangeError("End cannot be less than start");
    this.feature = t, this.relativeStart = e, this.relativeEnd = a;
  }
  get start() {
    return console.error(
      "FeatureSegment has no prop `start`.  Use `relativeStart` instead."
    ), this.relativeStart;
  }
  get end() {
    return console.error(
      "FeatureSegment has no prop `end`.  Use `relativeEnd` instead."
    ), this.relativeEnd;
  }
  /**
   * @return {OpenInterval} new OpenInterval containing this segment's relative start and end.
   */
  toOpenInterval() {
    return new Te(this.relativeStart, this.relativeEnd);
  }
  /**
   * @return {string} the attached feature's name
   */
  getName() {
    return this.feature.getName();
  }
  /**
   * @return {number} this interval's length
   */
  getLength() {
    return this.relativeEnd - this.relativeStart;
  }
  /**
   * @return {ChromosomeInterval} the genomic location that this segment covers
   */
  getLocus() {
    const t = this.feature.locus;
    return new Qe(
      t.chr,
      t.start + this.relativeStart,
      t.start + this.relativeEnd
    );
  }
  /**
   * Intersects this and another FeatureSegment, and returns the result as a new FeatureSegment.  Returns `null` if
   * the *segments' features are different* or if there is no overlap.
   *
   * @param {FeatureSegment} other - other FeatureSegment to intersect
   * @return {FeatureSegment} intersection of this segment and the other one, or null if none exists
   */
  getOverlap(t) {
    if (this.feature !== t.feature)
      return null;
    const e = this.toOpenInterval().getOverlap(t.toOpenInterval());
    return e ? new an(this.feature, e.start, e.end) : null;
  }
  /**
   * Intersects this and a genome location, and returns the result as a new FeatureSegment using the same Feature
   * that is attached to this.  Returns null if the genome location does not intersect with this location at all.
   *
   * @param {ChromosomeInterval} chrInterval - input genome location
   * @return {FeatureSegment} intersection of this and the input genomic location
   */
  getGenomeOverlap(t) {
    const e = this.feature.getLocus(), f = this.getLocus().getOverlap(t);
    if (!f)
      return null;
    const s = f.start - e.start, h = f.end - e.start;
    return new an(this.feature, s, h);
  }
  /**
   * @return {string} human-readable representation of this interval
   */
  // toString(): string {
  //   // web 1 based
  //   return `${this.getName()}:${this.relativeStart + 1}-${this.relativeEnd}`;
  // }
  // /**
  //  * Interprets this and another interval as a multi-feature interval, with this being the start and the other being
  //  * the end.  Returns a human-readable representation of that interpretation.
  //  *
  //  * @param {FeatureSegment} other - the end of the multi-feature interval
  //  * @return {string} a human-readable representation of a multi-feature interval
  //  */
  // toStringWithOther(other: FeatureSegment): string {
  //   // web 1 based
  //   return `${this.getName()}:${this.relativeStart + 1}-${other.getName()}:${
  //     other.relativeEnd
  //   }`;
  // }
}
const Tc = "";
class yn {
  /**
   * Makes a new instance.  Features must have non-empty, unique names.  The `isGenome` parameter does not change any
   * of the instance's functionality, but if it is true, it optimizes mapping functions.
   *
   * @param {string} name - name of this context
   * @param {Feature[]} features - list of features
   * @param {boolean} isGenome - whether the context covers the entire genome
   * @throws {Error} if the feature list has a problem
   */
  constructor(t, e) {
    we(this, "_name");
    we(this, "_features");
    we(this, "_sortedFeatureStarts");
    we(this, "_minCoordinateForFeature");
    we(this, "_featuresForChr");
    we(this, "_totalBases");
    this._name = t, this._features = e, this._minCoordinateForFeature = /* @__PURE__ */ new Map(), this._sortedFeatureStarts = [], this._featuresForChr = Ot.groupBy(
      e,
      (a) => a.getLocus().chr
    ), this._totalBases = 0;
    for (const a of e) {
      if (this._minCoordinateForFeature.has(a))
        throw new Error(
          `Duplicate feature "${a.getName()}" detected.  Features must be unique.`
        );
      this._minCoordinateForFeature.set(a, this._totalBases), this._sortedFeatureStarts.push(this._totalBases), this._totalBases += a.getLength();
    }
  }
  /**
   * Makes a special "feature" representing a gap in the genome.  To use, insert such objects into the feature list
   * during NavigationContext construction.
   *
   * @param {number} length - length of the gap in bases
   * @param {string} [name] - custom name of the gap feature
   * @return {Feature} a special "feature" representing a gap in the genome.
   */
  static makeGap(t, e = "Gap") {
    return new Pn(
      e,
      new Qe(Tc, 0, Math.round(t))
    );
  }
  /**
   * @param {Feature} feature - feature to inspect
   * @return {boolean} whether the feature represents a gap in the genome
   */
  static isGapFeature(t) {
    return t.getLocus().chr === Tc;
  }
  /**
   * If the input segment is in a reverse strand feature, returns a new segment that is the same size, but moved to
   * the other end of the feature.  In effect, it rotates a feature segment 180 degrees about the feature's center.
   *
   * Otherwise, returns the input unmodified.
   *
   * @example
   * let feature: Feature; // Pretend it has a length of 10
   * const segment = new FeatureSegment(feature, 2, 4);
   * this._flipIfReverseStrand(segment); // Returns new segment [6, 8)
   *
   * @param {FeatureSegment} segment - the feature segment to flip if on the reverse strand
   * @return {FeatureSegment} flipped feature segment, but only if the input was on the reverse strand
   */
  _flipIfReverseStrand(t) {
    if (t.feature.getIsReverseStrand())
      return new an(
        t.feature,
        e(t.relativeEnd),
        e(t.relativeStart)
      );
    return t;
    function e(a) {
      return t.feature.getLength() - a;
    }
  }
  /**
   * @return {string} this navigation context's name, as specified in the constructor
   */
  getName() {
    return this._name;
  }
  /**
   * Gets the internal feature list.  This list should be treated as read-only; modifying its elements causes
   * undefined behavior.
   *
   * @return {Feature[]} the internal feature list for this context
   */
  getFeatures() {
    return this._features.slice();
  }
  /**
   * @return {number} the total number of bases in this context, i.e. how many bases are navigable
   */
  getTotalBases() {
    return this._totalBases;
  }
  /**
   * Given a context coordinate, gets whether the base is navigable.
   *
   * @param {number} base - context coordinate
   * @return {boolean} whether the base is navigable
   */
  getIsValidBase(t) {
    return 0 <= t && t < this._totalBases;
  }
  /**
   * Gets the lowest context coordinate that the input feature has.  Throws an error if the feature cannot be found.
   *
   * Note that if the feature is on the forward strand, the result will represent the feature's start.  Otherwise, it
   * represents the feature's end.
   *
   * @param {Feature} feature - the feature to find
   * @return {number} the lowest context coordinate of the feature
   * @throws {RangeError} if the feature is not in this context
   */
  getFeatureStart(t) {
    const e = this._minCoordinateForFeature.get(t);
    if (e === void 0)
      throw new RangeError(
        `Feature "${t.getName()}" not in this navigation context`
      );
    return e;
  }
  /**
   * Given a context coordinate, gets the feature in which it is located.  Returns a FeatureSegment that has 1 length,
   * representing a single base number relative to the feature's start.
   *
   * @param {number} base - the context coordinate to look up
   * @return {FeatureSegment} corresponding feature coordinate
   * @throws {RangeError} if the base is not in this context
   */
  convertBaseToFeatureCoordinate(t) {
    if (!this.getIsValidBase(t))
      throw new RangeError(
        `Base number ${t} is invalid.  Valid bases in this context: [0, ${this.getTotalBases()})`
      );
    const e = Ot.sortedLastIndex(this._sortedFeatureStarts, t) - 1, a = this._features[e], f = t - this._sortedFeatureStarts[e];
    return this._flipIfReverseStrand(
      new an(a, f, f + 1)
    );
  }
  /**
   * Given a segment of a feature from this navigation context, gets the context coordinates the segment occupies.
   *
   * @param {FeatureSegment} segment - feature segment from this context
   * @return {OpenInterval} context coordinates the feature segment occupies
   */
  convertFeatureSegmentToContextCoordinates(t) {
    t = this._flipIfReverseStrand(t);
    const e = this.getFeatureStart(t.feature);
    return new Te(
      e + t.relativeStart,
      e + t.relativeEnd
    );
  }
  /**
   * Converts genome coordinates to an interval of context coordinates.  Since coordinates can map
   * to multiple features, or none at all, this method returns a list of OpenInterval.
   *
   * @param {ChromosomeInterval} chrInterval - genome interval
   * @return {OpenInterval[]} intervals of context coordinates
   */
  convertGenomeIntervalToBases(t) {
    const e = this._featuresForChr[t.chr] || [], a = [];
    for (const f of e) {
      const s = new an(f).getGenomeOverlap(t);
      s && a.push(
        this.convertFeatureSegmentToContextCoordinates(s)
      );
    }
    return a;
  }
  /**
   * Converts a context coordinate to one that ignores gaps in this instance.  Or, put another way, if we removed all
   * gaps in this instance, what would be the context coordinate of `base` be?
   *
   * @example
   * navContext = [10bp feature, 10bp gap, 10bp feature]
   * navContext.toGaplessCoordinate(5); // Returns 5
   * navContext.toGaplessCoordinate(15); // Returns 10
   * navContext.toGaplessCoordinate(25); // Returns 15
   *
   * @param {number} base - the context coordinate to convert
   * @return {number} context coordinate if gaps didn't exist
   */
  toGaplessCoordinate(t) {
    const e = this.convertBaseToFeatureCoordinate(t), a = this._features.findIndex(
      (h) => h === e.feature
    ), f = this._features.slice(0, a).filter(yn.isGapFeature);
    let s = Ot.sumBy(
      f,
      (h) => h.getLength()
    );
    return yn.isGapFeature(e.feature) && (s += e.relativeStart), t - s;
  }
  /**
   * Parses an location in this navigation context.  Should be formatted like "$chrName:$startBase-$endBase" OR
   * "$featureName".  We expect 0-indexed intervals.
   *
   * Returns an open interval of context coordinates.  Throws RangeError on parse failure.
   *
   * @param {string} str - the string to parse
   * @return {OpenInterval} the context coordinates represented by the string
   * @throws {RangeError} when parsing an interval outside of the context or something otherwise nonsensical
   */
  parse(t) {
    const e = this._features.find((s) => s.getName() === t);
    if (e) {
      const s = this.convertFeatureSegmentToContextCoordinates(
        new an(e)
      ), h = 0.5 * (s.start + s.end);
      return new Te(h - 3, h + 3);
    }
    const a = Qe.parse(t), f = this.convertGenomeIntervalToBases(a)[0];
    if (f)
      return f;
    throw new RangeError("Location unavailable in this context");
  }
  // below is the version from Vincent
  // parse(str: string): OpenInterval {
  //     const feature = this._features.find(feature => feature.getName() === str);
  //     if (feature) {
  //         const contextCoords = this.convertFeatureSegmentToContextCoordinates(new FeatureSegment(feature));
  //         const center = 0.5 * (contextCoords.start + contextCoords.end);
  //         // This is safe because of setRegion in DisplayedRegionModel
  //         return new OpenInterval(center - 3, center + 3);
  //     }
  //     let start, end;
  //     if (str.split(`:`).length === 3) {
  //         /**
  //          * Support for multi-chr viewRegion str inputs, assuming form: "chra:b-chrc:d"
  //          */
  //         const segments = str.split('-');
  //         const start1 = Number(segments[0].split(`:`)[1]);
  //         const end1 = Number(segments[1].split(`:`)[1]);
  //         const endChr = Number(segments[1].split(`:`)[0].split(`r`)[1]);
  //         const miniIntStart = `${segments[0]}-${start1 + 4}`;
  //         const miniIntEnd = `chr${endChr}:${end1 - 4}-${end1}`;
  //         const startInt = ChromosomeInterval.parse(miniIntStart);
  //         const endInt = ChromosomeInterval.parse(miniIntEnd);
  //         const contextCoordsStart = this.convertGenomeIntervalToBases(startInt)[0];
  //         const contextCoordsEnd = this.convertGenomeIntervalToBases(endInt)[0];
  //         start = contextCoordsStart.start;
  //         end = contextCoordsEnd.end;
  //     } else if (str.split(`:`).length === 2) {
  //         const locus = ChromosomeInterval.parse(str);
  //         const contextCoords = this.convertGenomeIntervalToBases(locus)[0];
  //         start = contextCoords.start;
  //         end = contextCoords.end;
  //     } else {
  //         throw new RangeError('Interval of incorrect formatting');
  //     }
  //     // creates open interval based on the start of the first chr segment and the end of the last chr segment
  //     // can assume no gaps
  //     const contextCoords = new OpenInterval(start, end);
  //     if (!contextCoords) {
  //         throw new RangeError('Location unavailable in this context');
  //     } else {
  //         return contextCoords;
  //     }
  // }
  /**
   * Queries features that overlap an open interval of context coordinates.  Returns a list of FeatureSegment.
   *
   * @param {number} queryStart - (inclusive) start of interval, as a context coordinate
   * @param {number} queryEnd - (exclusive) end of interval, as a context coordinate
   * @param {boolean} [includeGaps] - whether to include gaps in the results.  Default: true
   * @return {FeatureSegment[]} list of feature intervals
   */
  getFeaturesInInterval(t, e, a = !0) {
    const f = new Te(t, e), s = [];
    for (const h of this._features) {
      if (!a && yn.isGapFeature(h))
        continue;
      const l = this.getFeatureStart(h), D = l + h.getLength(), c = new Te(l, D).getOverlap(f);
      if (c) {
        const d = c.start - l, x = c.end - l, C = new an(h, d, x);
        s.push(this._flipIfReverseStrand(C));
      } else if (s.length > 0)
        break;
    }
    return s;
  }
  /**
   * Queries genomic locations that overlap an open interval of context coordinates.  The results are guaranteed to
   * not overlap each other.
   *
   * @param {number} queryStart - (inclusive) start of interval, as a context coordinate
   * @param {number} queryEnd - (exclusive) end of interval, as a context coordinate
   * @return {ChromosomeInterval[]} list of genomic locations
   */
  getLociInInterval(t, e) {
    const f = this.getFeaturesInInterval(
      t,
      e,
      !1
    ).map((s) => s.getLocus());
    return Qe.mergeOverlaps(f);
  }
  /**
   * check if a feature is in current context
   */
  hasFeatureWithName(t) {
    return this._features.some((e) => e.name === t.name);
  }
}
const Fa = 0;
class Ti {
  /**
   * Makes a new instance with specified navigation context, and optionally, initial view region.  If not specified,
   * the view region will be the entire navigation context.
   *
   * @param {NavigationContext} navContext - the context in which navigation will take place
   * @param {number} [start] - initial start of the view region
   * @param {number} [end] - initial end of the view region
   */
  constructor(t, e = Fa, a) {
    we(this, "_navContext");
    we(this, "_startBase");
    we(this, "_endBase");
    this._navContext = t, a === void 0 && (a = t.getTotalBases()), this.setRegion(e, a);
  }
  /**
   * Makes copy of this object such that no methods on the copy will modify the original.
   *
   * @return {DisplayedRegionModel} a copy of this object
   */
  clone() {
    return new Ti(
      this._navContext,
      this._startBase,
      this._endBase
    );
  }
  /**
   * @return {NavigationContext} the navigation context with which this object was created
   */
  getNavigationContext() {
    return this._navContext;
  }
  /**
   * @return {number} the current width of the view, in base pairs
   */
  getWidth() {
    return this._endBase - this._startBase;
  }
  /**
   * Gets a copy of the internally stored 0-indexed open interval that represents this displayed region.
   *
   * @return {OpenInterval} copy of the internally stored region
   */
  getContextCoordinates() {
    return new Te(this._startBase, this._endBase);
  }
  /**
   * Gets the features that overlap this view region in the navigation context.
   *
   * @param {boolean} [includeGaps] - whether to include gaps in the results.  Default: true
   * @return {FeatureSegment[]} list of feature intervals that overlap this view region
   */
  getFeatureSegments(t = !0) {
    return this._navContext.getFeaturesInInterval(
      this._startBase,
      this._endBase,
      t
    );
  }
  /**
   * Gets the genomic locations that overlap this view region.  The results are guaranteed to not overlap each other.
   *
   * @return {ChromosomeInterval[]} list of genomic locations that overlap this view region.
   */
  getGenomeIntervals() {
    return this._navContext.getLociInInterval(this._startBase, this._endBase);
  }
  /**
   * Safely sets the internal display interval, ensuring that it stays within the navigation context and makes sense.
   * `start` and `end` should express a 0-indexed open interval of base numbers, [start, end).  This method will try
   * to preserve the input length as much as possible.
   *
   * Errors if given a nonsensical interval, but does not error for intervals outside the navigation context.
   *
   * Returns this.
   *
   * @param {number} start - the (inclusive) start of the region interval as a base pair number
   * @param {number} end - the (exclusive) end of the region interval as a base pair number
   * @return {this}
   * @throws {RangeError} if end is less than start, or the inputs are undefined/infinite
   */
  setRegion(t, e) {
    if (!Number.isFinite(t) || !Number.isFinite(e))
      throw new RangeError("Start and end must be well-defined");
    if (e < t)
      throw new RangeError("Start must be less than or equal to end");
    const a = e - t, f = this._navContext.getTotalBases();
    return t < Fa ? e = Fa + a : e > f && (t = f - a), this._startBase = Math.round(Math.max(Fa, t)), this._endBase = Math.round(Math.min(e, f)), this;
  }
  /**
   * Pans the current region by a constant number of bases, also ensuring view boundaries stay within the genome.
   * Negative numbers pull regions on the left into view (=pan right); positive numbers pull regions on the right into
   * view (=pan left).
   *
   * Returns `this`.
   *
   * @param {number} numBases - number of base pairs to pan
   * @return {this}
   */
  pan(t) {
    return this.setRegion(this._startBase + t, this._endBase + t), this;
  }
  /**
   * pan same width to left, pan left not same as drag left, coords get smaller
   * @return {this}
   */
  panLeft() {
    const t = this.getWidth();
    return this.pan(-t);
  }
  /**
   * pan same width to right
   * @return {this}
   */
  panRight() {
    const t = this.getWidth();
    return this.pan(t);
  }
  /**
   * Multiplies the size of the current region by a factor, also ensuring view boundaries stay within the genome.
   * Factors less than 1 zoom in (region gets shorter); factors greater than 1 zoom out (region gets longer).
   * Additionally, one can specify the focal point of the zoom as the number of region widths from the left edge.  By
   * default this is 0.5, which is the center of the region.
   *
   * Note that due to rounding, zoom() is approximate; a zoom(2) followed by a zoom(0.5) may still change the region
   * boundaries by a base or two.
   *
   * Returns `this`.
   *
   * @param {number} factor - number by which to multiply this region's width
   * @param {number} [focalPoint] - (optional) measured as number of region widths from the left edge.  Default: 0.5
   * @return {this}
   */
  zoom(t, e = 0.5) {
    if (t <= 0)
      throw new RangeError("Zoom factor must be greater than 0");
    const a = this.getWidth() * t, f = this.getWidth() * e + this._startBase, s = a * e + this._startBase, h = f - s, l = this._startBase + h, D = this._startBase + a + h;
    return this.setRegion(l, D), this;
  }
  /**
   * @return {string} the currently displayed region in human-readable form
   */
  // currentRegionAsString(): string {
  //   const segments = this.getFeatureSegments();
  //   if (segments.length === 1) {
  //     return segments[0].toString();
  //   } else {
  //     const first = segments[0];
  //     const last = segments[segments.length - 1];
  //     return first.toStringWithOther(last);
  //   }
  // }
  /**
   * @return {string} the displayed region according to custom start/end
   * @param start the custom start of the region
   * @param end the custom end of the region
   */
  // customRegionAsString(start: number, end: number): string {
  //   const segments = this._navContext.getFeaturesInInterval(start, end, true);
  //   if (segments.length === 1) {
  //     return segments[0].toString();
  //   } else {
  //     const first = segments[0];
  //     const last = segments[segments.length - 1];
  //     return first.toStringWithOther(last);
  //   }
  // }
}
var $c = Number.isNaN || function(t) {
  return typeof t == "number" && t !== t;
};
function GD(n, t) {
  return !!(n === t || $c(n) && $c(t));
}
function WD(n, t) {
  if (n.length !== t.length)
    return !1;
  for (var e = 0; e < n.length; e++)
    if (!GD(n[e], t[e]))
      return !1;
  return !0;
}
function HD(n, t) {
  t === void 0 && (t = WD);
  var e = null;
  function a() {
    for (var f = [], s = 0; s < arguments.length; s++)
      f[s] = arguments[s];
    if (e && e.lastThis === this && t(f, e.lastArgs))
      return e.lastResult;
    var h = n.apply(this, f);
    return e = {
      lastResult: h,
      lastArgs: f,
      lastThis: this
    }, h;
  }
  return a.clear = function() {
    e = null;
  }, a;
}
const Au = "-";
function Ya(n) {
  return Ot.sumBy(n, (t) => t === Au ? 0 : 1);
}
function Rc(n, t, e = !1) {
  const a = [], f = new RegExp(Au + "+", "g");
  let s;
  for (; (s = f.exec(n)) !== null; )
    D(!0, s.index, s[0].length, t);
  if (e)
    return a;
  let h = 0;
  const l = a.slice();
  for (const c of l)
    D(!1, h, c.index - h), h = c.index + c.length;
  return D(!1, h, n.length - h), a;
  function D(c, d, x, C = 0) {
    x > C && a.push({ isGap: c, index: d, length: x });
  }
}
function Ro(n, t, e = !1) {
  const a = e ? -1 : 1, f = [];
  let s = t;
  for (const h of n)
    f.push(s), h !== Au && (s += a);
  return f;
}
class ZD {
  /**
   * Constructs a new instance that iterates through the specified string.
   *
   * @param {string} sequence - the string through which to iterate
   */
  constructor(t) {
    we(this, "sequence");
    we(this, "_currentIndex");
    this.sequence = t, this._currentIndex = -1;
  }
  /**
   * Resets this instance's index pointer to the beginning of the string
   */
  reset() {
    this._currentIndex = 0;
  }
  /**
   * @return {number} the current index pointer
   */
  getCurrentIndex() {
    return this._currentIndex;
  }
  /**
   * Advances the index pointer and returns it.  If there is no valid base, the return value will be past the end of
   * the string.
   *
   * @return {number} the index of the next valid base
   */
  getIndexOfNextBase() {
    do
      this._currentIndex++;
    while (this.sequence.charAt(this._currentIndex) === Au);
    return this._currentIndex;
  }
  /**
   * @return {boolean} whether there is a next valid base
   */
  hasNextBase() {
    return this._currentIndex < this.sequence.length - 1;
  }
  /**
   * Equivalent to calling getIndexOfNextBase() n times.  Returns the last result.  A negative n will have no effect.
   *
   * @param {number} n - the number of bases to advance
   * @return {number} the index pointer after advancement
   */
  advanceN(t) {
    let e = this._currentIndex;
    for (let a = 0; a < t; a++)
      e = this.getIndexOfNextBase();
    return e;
  }
}
class Rf extends an {
  /**
   * Constructs a new instance.
   *
   * @see {FeatureSegment}
   */
  constructor(e, a, f) {
    super(e, a, f);
    we(this, "feature");
    /**
     * The substring indices in the record's sequence data that this segment covers.
     */
    we(this, "sequenceInterval");
    this.feature = e;
    const s = new ZD(e.targetSeq), h = s.advanceN(this.relativeStart + 1), l = s.advanceN(this.getLength());
    this.sequenceInterval = new Te(h, l);
  }
  /**
   * Creates an AlignmentSegment from a FeatureSegment whose attached feature is an AlignmentRecord.  Works almost
   * like a cast from FeatureSegment to AlignmentSegment.
   *
   * @param {FeatureSegment} segment - a FeatureSegment whose attached feature must be an AlignmentRecord
   * @return {AlignmentSegment} a new AlignmentSegment from the data in the input
   */
  static fromFeatureSegment(e) {
    return new Rf(
      e.feature,
      e.relativeStart,
      e.relativeEnd
    );
  }
  /**
   * @return {string} the part of the primary genome sequence that this segment covers
   */
  getTargetSequence() {
    const [e, a] = this.sequenceInterval;
    return this.feature.targetSeq.substring(e, a);
  }
  /**
   * Gets the approximate location in the query/secondary genome that this segment covers.
   *
   * @return {ChromosomeInterval} the approximate locus in the query/secondary genome represented by this segment.
   */
  getQueryLocus() {
    const { queryStrand: e, queryLocus: a } = this.feature;
    return new Qe(
      a.chr,
      e === "+" ? Math.min(a.start + this.relativeStart, a.end) : Math.max(0, a.end - this.relativeEnd),
      e === "+" ? Math.min(a.start + this.relativeEnd, a.end) : a.end - this.relativeStart
    );
  }
  /**
   * Gets the location in the query/secondary genome that this segment covers.  Unlike `getQueryLocus`, this method
   * uses sequence data, so it will be more accurate, but also somewhat slower.
   *
   * @return {ChromosomeInterval} the locus in the query/secondary genome represented by this segment.
   */
  getQueryLocusFine() {
    const { querySeq: e, queryLocus: a } = this.feature, f = Ya(
      e.substring(0, this.sequenceInterval.start)
    ), s = Ya(this.getQuerySequence());
    if (this.feature.getIsReverseStrandQuery()) {
      const h = a.end - f;
      return new Qe(a.chr, h - s, h);
    } else {
      const h = a.start + f;
      return new Qe(a.chr, h, h + s);
    }
  }
  /**
   * @return {string} the part of the query/secondary genome sequence that this segment covers
   */
  getQuerySequence() {
    const [e, a] = this.sequenceInterval;
    return this.feature.querySeq.substring(e, a);
  }
}
function VD(n, t = !1) {
  const e = n >= 1e3 ? Math.floor(n) : Math.round(n);
  return e >= 75e4 ? `${(e / 1e6).toFixed(1)} Mb` : e >= 1e4 ? `${(e / 1e3).toFixed(1)} Kb` : e > 0 ? `${e} bp` : t ? "<1 bp" : "0 bp";
}
class Nc {
  constructor(t) {
    we(this, "_baseNavContext");
    we(this, "_gaps");
    we(this, "_cumulativeGapBases");
    this._baseNavContext = t, this._cumulativeGapBases = [];
  }
  /**
   * @param gaps
   */
  setGaps(t) {
    this._gaps = t.slice().sort((a, f) => a.contextBase - f.contextBase), this._cumulativeGapBases = [];
    let e = 0;
    for (const a of this._gaps)
      this._cumulativeGapBases.push(e), e += a.length;
    this._cumulativeGapBases.push(e);
  }
  build() {
    const t = this._baseNavContext.getFeatures(), e = /* @__PURE__ */ new Map();
    for (let h = 0; h < t.length; h++)
      e.set(t[h], h);
    const a = [];
    let f = -1, s = 0;
    for (const h of this._gaps) {
      const l = this._baseNavContext.convertBaseToFeatureCoordinate(h.contextBase), D = l.feature, c = e.get(D), d = l.relativeStart;
      a.push(
        ...t.slice(f + 1, c)
      ), c === f && s > 0 && a.pop(), s = s > d ? 0 : s;
      const x = new an(
        D,
        s,
        d
      ).getLocus(), C = new an(
        D,
        d
      ).getLocus();
      x.getLength() > 0 && a.push(
        new Pn(
          D.getName(),
          x,
          D.getStrand()
        )
      ), a.push(
        yn.makeGap(h.length, `${VD(h.length)} gap`)
      ), C.getLength() > 0 && a.push(
        new Pn(
          D.getName(),
          C,
          D.getStrand()
        )
      ), f = c, s = d;
    }
    return a.push(...t.slice(f + 1)), new yn(
      this._baseNavContext.getName(),
      a
    );
  }
  convertOldCoordinates(t) {
    const e = Ot.sortedIndexBy(
      this._gaps,
      { contextBase: t },
      "contextBase"
    ), a = this._cumulativeGapBases[e] || 0;
    return t + a;
  }
}
class qr {
  /**
   * Makes a new instance.
   *
   * @param {DisplayedRegionModel} viewRegion - the displayed region
   * @param {number} drawWidth - the width of the canvas/svg/etc on which to draw
   */
  constructor(t, e) {
    we(this, "_viewRegion");
    we(this, "_drawWidth");
    we(this, "_pixelsPerBase");
    we(this, "_basesPerPixel");
    this._viewRegion = t, this._drawWidth = e, this._pixelsPerBase = e / t.getWidth(), this._basesPerPixel = t.getWidth() / e;
  }
  /**
   * @return {number} the drawing width with which this model was created
   */
  getDrawWidth() {
    return this._drawWidth;
  }
  /**
   * Gets the horizontal width in pixels required to represent a number of bases.
   *
   * @param {number} bases - width in number of bases
   * @return {number} width in pixels
   */
  basesToXWidth(t) {
    return t * this._pixelsPerBase;
  }
  /**
   * Gets how many bases represented by a horizontal span of the SVG.
   *
   * @param {number} pixels - width of a horizontal span
   * @return {number} width in number of bases
   */
  xWidthToBases(t) {
    return t * this._basesPerPixel;
  }
  /**
   * Given an nav context coordinate, gets the X coordinate that represents that base.
   *
   * @param {number} base - nav context coordinate
   * @return {number} X coordinate that represents the input base
   */
  baseToX(t) {
    return (t - this._viewRegion.getContextCoordinates().start) * this._pixelsPerBase;
  }
  /**
   * Given an X coordinate representing a base, gets the nav context coordinate.
   *
   * @param {number} pixel - X coordinate that represents a base
   * @return {number} nav context coordinate
   */
  xToBase(t) {
    return t * this._basesPerPixel + this._viewRegion.getContextCoordinates().start;
  }
  /**
   * Converts an interval of bases to an interval of X coordinates.
   *
   * @param {OpenInterval} baseInterval - interval of bases to convert
   * @return {OpenInterval} x draw interval
   */
  baseSpanToXSpan(t) {
    const e = this.baseToX(t.start), a = this.baseToX(t.end);
    return new Te(e, a);
  }
  /**
   * Converts an interval of bases to an interval of X coordinates, but just the center.
   *
   * @param {OpenInterval} baseInterval - interval of bases to convert
   * @return {OpenInterval} x draw interval
   */
  baseSpanToXCenter(t) {
    const e = this.baseSpanToXSpan(t), a = Math.round((e.start + e.end) / 2);
    return new Te(a, a);
  }
  /**
   * Gets the segment coordinates that a pixel coordinate represents.
   *
   * @param {number} pixel - pixel coordinate that represents a base
   * @return {FeatureSegment} segment coordinate that the pixel represents
   */
  xToSegmentCoordinate(t) {
    const e = Math.floor(this.xToBase(t));
    return this._viewRegion.getNavigationContext().convertBaseToFeatureCoordinate(e);
  }
}
class XD {
  // x span to draw the second region of the interaction
  constructor(t, e, a) {
    we(this, "interaction");
    // The interaction
    /**
     * x span to draw the first region of the interaction.  Guaranteed to have the lower start of both the two spans.
     */
    we(this, "xSpan1");
    we(this, "xSpan2");
    this.interaction = t, e.start <= a.start ? (this.xSpan1 = e, this.xSpan2 = a) : (this.xSpan1 = a, this.xSpan2 = e);
  }
  /**
   * @return {number} the length of the interaction in draw coordinates
   */
  getWidth() {
    const t = this.xSpan1.start;
    return Math.max(this.xSpan1.end, this.xSpan2.end) - t;
  }
  generateKey() {
    return "" + this.xSpan1.start + this.xSpan1.end + this.xSpan2.start + this.xSpan2.end;
  }
}
class KD {
  /**
   * Computes context and draw locations for a list of features.  There may be a different number of placed features
   * than input features, as a feature might map to several different nav context coordinates, or a feature might
   * not map at all.
   *
   * @param {Feature[]} features - features for which to compute draw locations
   * @param {DisplayedRegionModel} viewRegion - region in which to draw
   * @param {number} width - width of visualization
   * @return {PlacedFeature[]} draw info for the features
   */
  placeFeatures(t, e, a, f = !1) {
    const s = new qr(e, a), h = e.getContextCoordinates(), l = e.getNavigationContext(), D = [];
    for (const c of t)
      for (let d of c.computeNavContextCoordinates(
        l
      ))
        if (d = d.getOverlap(h), d) {
          const x = f ? s.baseSpanToXCenter(d) : s.baseSpanToXSpan(d), { visiblePart: C, isReverse: E } = this._locatePlacement(
            c,
            l,
            d
          );
          D.push({
            feature: c,
            visiblePart: C,
            contextLocation: d,
            xSpan: x,
            isReverse: E
          });
        }
    return D;
  }
  /**
   * Gets the visible part of a feature after it has been placed in a navigation context, as well as if was placed
   * into a reversed part of the nav context.
   *
   * @param {Feature} feature - feature placed in a navigation context
   * @param {NavigationContext} contextLocation - navigation context in which the feature was placed
   * @param {OpenInterval} navContext - the feature's visible part in navigation context coordinates
   * @return {object} - placement details of the feature
   */
  _locatePlacement(t, e, a) {
    const f = e.convertBaseToFeatureCoordinate(
      a.start
    ), s = f.getLocus().start, h = f.feature.getIsReverseStrand();
    let l;
    h ? l = s - a.getLength() + 1 : l = s;
    const D = l - t.getLocus().start, c = Math.max(0, D);
    return {
      visiblePart: new an(
        t,
        c,
        c + a.getLength()
      ),
      isReverse: h
    };
  }
  /**
   * Gets draw spans for feature segments, given a parent feature that has already been placed.
   *
   * @param {PlacedFeature} placedFeature
   * @param {FeatureSegment[]} segments
   * @return {PlacedSegment[]}
   */
  placeFeatureSegments(t, e) {
    const a = t.xSpan.getLength() / t.contextLocation.getLength(), f = [];
    for (let s of e)
      if (s = s.getOverlap(t.visiblePart), s) {
        const l = (s.relativeStart - t.visiblePart.relativeStart) * a, D = s.getLength() * a;
        let c;
        t.isReverse ? c = t.xSpan.end - l - D : c = t.xSpan.start + l, f.push({
          segment: s,
          xSpan: new Te(c, c + D)
        });
      }
    return f;
  }
  placeInteractions(t, e, a) {
    const f = new qr(e, a), s = e.getContextCoordinates(), h = e.getNavigationContext(), l = [];
    for (const D of t) {
      let c = h.convertGenomeIntervalToBases(
        D.locus1
      ), d = h.convertGenomeIntervalToBases(
        D.locus2
      );
      c = c.map(
        (x) => x.getOverlap(s)
      ), d = d.map(
        (x) => x.getOverlap(s)
      );
      for (const x of c)
        for (const C of d)
          if (x && C) {
            const E = f.baseSpanToXSpan(x), I = f.baseSpanToXSpan(C);
            l.push(
              new XD(D, E, I)
            );
          }
    }
    return l;
  }
  /**
   * pretty much same as palceFeatures, but return feature not place-able. aka, out of view region
   *
   * @param nodes
   * @param viewRegion
   * @param width
   * @returns
   */
  placeGraphNodes(t, e, a) {
    const f = new qr(e, a), s = e.getContextCoordinates(), h = e.getNavigationContext(), l = [], D = [];
    for (const c of t)
      for (let d of c.computeNavContextCoordinates(
        h
      ))
        if (d = d.getOverlap(s), d) {
          const x = f.baseSpanToXSpan(d), { visiblePart: C, isReverse: E } = this._locatePlacement(
            c,
            h,
            d
          );
          l.push({
            feature: c,
            visiblePart: C,
            contextLocation: d,
            xSpan: x,
            isReverse: E
          });
        } else
          D.push(c);
    return { placements: l, nodesOutOfView: D };
  }
}
var YD = {
  rgb2hsl: xu,
  rgb2hsv: us,
  rgb2hwb: Fu,
  rgb2cmyk: Bu,
  rgb2keyword: Su,
  rgb2xyz: Nf,
  rgb2lab: Lf,
  rgb2lch: QD,
  hsl2rgb: as,
  hsl2hsv: JD,
  hsl2hwb: jD,
  hsl2cmyk: em,
  hsl2keyword: tm,
  hsv2rgb: ss,
  hsv2hsl: nm,
  hsv2hwb: rm,
  hsv2cmyk: im,
  hsv2keyword: um,
  hwb2rgb: Iu,
  hwb2hsl: am,
  hwb2hsv: sm,
  hwb2cmyk: om,
  hwb2keyword: fm,
  cmyk2rgb: ku,
  cmyk2hsl: lm,
  cmyk2hsv: hm,
  cmyk2hwb: cm,
  cmyk2keyword: dm,
  keyword2rgb: jr,
  keyword2hsl: wm,
  keyword2hsv: bm,
  keyword2hwb: vm,
  keyword2cmyk: Dm,
  keyword2lab: mm,
  keyword2xyz: ym,
  xyz2rgb: Dd,
  xyz2lab: md,
  xyz2lch: pm,
  lab2xyz: Of,
  lab2rgb: yd,
  lab2lch: Pf,
  lch2lab: Mf,
  lch2xyz: gm,
  lch2rgb: _m
};
function xu(n) {
  var t = n[0] / 255, e = n[1] / 255, a = n[2] / 255, f = Math.min(t, e, a), s = Math.max(t, e, a), h = s - f, l, D, c;
  return s == f ? l = 0 : t == s ? l = (e - a) / h : e == s ? l = 2 + (a - t) / h : a == s && (l = 4 + (t - e) / h), l = Math.min(l * 60, 360), l < 0 && (l += 360), c = (f + s) / 2, s == f ? D = 0 : c <= 0.5 ? D = h / (s + f) : D = h / (2 - s - f), [l, D * 100, c * 100];
}
function us(n) {
  var t = n[0], e = n[1], a = n[2], f = Math.min(t, e, a), s = Math.max(t, e, a), h = s - f, l, D, c;
  return s == 0 ? D = 0 : D = h / s * 1e3 / 10, s == f ? l = 0 : t == s ? l = (e - a) / h : e == s ? l = 2 + (a - t) / h : a == s && (l = 4 + (t - e) / h), l = Math.min(l * 60, 360), l < 0 && (l += 360), c = s / 255 * 1e3 / 10, [l, D, c];
}
function Fu(n) {
  var t = n[0], e = n[1], s = n[2], a = xu(n)[0], f = 1 / 255 * Math.min(t, Math.min(e, s)), s = 1 - 1 / 255 * Math.max(t, Math.max(e, s));
  return [a, f * 100, s * 100];
}
function Bu(n) {
  var t = n[0] / 255, e = n[1] / 255, a = n[2] / 255, f, s, h, l;
  return l = Math.min(1 - t, 1 - e, 1 - a), f = (1 - t - l) / (1 - l) || 0, s = (1 - e - l) / (1 - l) || 0, h = (1 - a - l) / (1 - l) || 0, [f * 100, s * 100, h * 100, l * 100];
}
function Su(n) {
  return Ed[JSON.stringify(n)];
}
function Nf(n) {
  var t = n[0] / 255, e = n[1] / 255, a = n[2] / 255;
  t = t > 0.04045 ? Math.pow((t + 0.055) / 1.055, 2.4) : t / 12.92, e = e > 0.04045 ? Math.pow((e + 0.055) / 1.055, 2.4) : e / 12.92, a = a > 0.04045 ? Math.pow((a + 0.055) / 1.055, 2.4) : a / 12.92;
  var f = t * 0.4124 + e * 0.3576 + a * 0.1805, s = t * 0.2126 + e * 0.7152 + a * 0.0722, h = t * 0.0193 + e * 0.1192 + a * 0.9505;
  return [f * 100, s * 100, h * 100];
}
function Lf(n) {
  var t = Nf(n), e = t[0], a = t[1], f = t[2], s, h, l;
  return e /= 95.047, a /= 100, f /= 108.883, e = e > 8856e-6 ? Math.pow(e, 1 / 3) : 7.787 * e + 16 / 116, a = a > 8856e-6 ? Math.pow(a, 1 / 3) : 7.787 * a + 16 / 116, f = f > 8856e-6 ? Math.pow(f, 1 / 3) : 7.787 * f + 16 / 116, s = 116 * a - 16, h = 500 * (e - a), l = 200 * (a - f), [s, h, l];
}
function QD(n) {
  return Pf(Lf(n));
}
function as(n) {
  var t = n[0] / 360, e = n[1] / 100, a = n[2] / 100, f, s, h, l, D;
  if (e == 0)
    return D = a * 255, [D, D, D];
  a < 0.5 ? s = a * (1 + e) : s = a + e - a * e, f = 2 * a - s, l = [0, 0, 0];
  for (var c = 0; c < 3; c++)
    h = t + 1 / 3 * -(c - 1), h < 0 && h++, h > 1 && h--, 6 * h < 1 ? D = f + (s - f) * 6 * h : 2 * h < 1 ? D = s : 3 * h < 2 ? D = f + (s - f) * (2 / 3 - h) * 6 : D = f, l[c] = D * 255;
  return l;
}
function JD(n) {
  var t = n[0], e = n[1] / 100, a = n[2] / 100, f, s;
  return a === 0 ? [0, 0, 0] : (a *= 2, e *= a <= 1 ? a : 2 - a, s = (a + e) / 2, f = 2 * e / (a + e), [t, f * 100, s * 100]);
}
function jD(n) {
  return Fu(as(n));
}
function em(n) {
  return Bu(as(n));
}
function tm(n) {
  return Su(as(n));
}
function ss(n) {
  var t = n[0] / 60, e = n[1] / 100, D = n[2] / 100, a = Math.floor(t) % 6, f = t - Math.floor(t), s = 255 * D * (1 - e), h = 255 * D * (1 - e * f), l = 255 * D * (1 - e * (1 - f)), D = 255 * D;
  switch (a) {
    case 0:
      return [D, l, s];
    case 1:
      return [h, D, s];
    case 2:
      return [s, D, l];
    case 3:
      return [s, h, D];
    case 4:
      return [l, s, D];
    case 5:
      return [D, s, h];
  }
}
function nm(n) {
  var t = n[0], e = n[1] / 100, a = n[2] / 100, f, s;
  return s = (2 - e) * a, f = e * a, f /= s <= 1 ? s : 2 - s, f = f || 0, s /= 2, [t, f * 100, s * 100];
}
function rm(n) {
  return Fu(ss(n));
}
function im(n) {
  return Bu(ss(n));
}
function um(n) {
  return Su(ss(n));
}
function Iu(n) {
  var t = n[0] / 360, e = n[1] / 100, a = n[2] / 100, f = e + a, s, h, l, D;
  switch (f > 1 && (e /= f, a /= f), s = Math.floor(6 * t), h = 1 - a, l = 6 * t - s, s & 1 && (l = 1 - l), D = e + l * (h - e), s) {
    default:
    case 6:
    case 0:
      r = h, g = D, b = e;
      break;
    case 1:
      r = D, g = h, b = e;
      break;
    case 2:
      r = e, g = h, b = D;
      break;
    case 3:
      r = e, g = D, b = h;
      break;
    case 4:
      r = D, g = e, b = h;
      break;
    case 5:
      r = h, g = e, b = D;
      break;
  }
  return [r * 255, g * 255, b * 255];
}
function am(n) {
  return xu(Iu(n));
}
function sm(n) {
  return us(Iu(n));
}
function om(n) {
  return Bu(Iu(n));
}
function fm(n) {
  return Su(Iu(n));
}
function ku(n) {
  var t = n[0] / 100, e = n[1] / 100, a = n[2] / 100, f = n[3] / 100, s, h, l;
  return s = 1 - Math.min(1, t * (1 - f) + f), h = 1 - Math.min(1, e * (1 - f) + f), l = 1 - Math.min(1, a * (1 - f) + f), [s * 255, h * 255, l * 255];
}
function lm(n) {
  return xu(ku(n));
}
function hm(n) {
  return us(ku(n));
}
function cm(n) {
  return Fu(ku(n));
}
function dm(n) {
  return Su(ku(n));
}
function Dd(n) {
  var t = n[0] / 100, e = n[1] / 100, a = n[2] / 100, f, s, h;
  return f = t * 3.2406 + e * -1.5372 + a * -0.4986, s = t * -0.9689 + e * 1.8758 + a * 0.0415, h = t * 0.0557 + e * -0.204 + a * 1.057, f = f > 31308e-7 ? 1.055 * Math.pow(f, 1 / 2.4) - 0.055 : f = f * 12.92, s = s > 31308e-7 ? 1.055 * Math.pow(s, 1 / 2.4) - 0.055 : s = s * 12.92, h = h > 31308e-7 ? 1.055 * Math.pow(h, 1 / 2.4) - 0.055 : h = h * 12.92, f = Math.min(Math.max(0, f), 1), s = Math.min(Math.max(0, s), 1), h = Math.min(Math.max(0, h), 1), [f * 255, s * 255, h * 255];
}
function md(n) {
  var t = n[0], e = n[1], a = n[2], f, s, h;
  return t /= 95.047, e /= 100, a /= 108.883, t = t > 8856e-6 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116, e = e > 8856e-6 ? Math.pow(e, 1 / 3) : 7.787 * e + 16 / 116, a = a > 8856e-6 ? Math.pow(a, 1 / 3) : 7.787 * a + 16 / 116, f = 116 * e - 16, s = 500 * (t - e), h = 200 * (e - a), [f, s, h];
}
function pm(n) {
  return Pf(md(n));
}
function Of(n) {
  var t = n[0], e = n[1], a = n[2], f, s, h, l;
  return t <= 8 ? (s = t * 100 / 903.3, l = 7.787 * (s / 100) + 16 / 116) : (s = 100 * Math.pow((t + 16) / 116, 3), l = Math.pow(s / 100, 1 / 3)), f = f / 95.047 <= 8856e-6 ? f = 95.047 * (e / 500 + l - 16 / 116) / 7.787 : 95.047 * Math.pow(e / 500 + l, 3), h = h / 108.883 <= 8859e-6 ? h = 108.883 * (l - a / 200 - 16 / 116) / 7.787 : 108.883 * Math.pow(l - a / 200, 3), [f, s, h];
}
function Pf(n) {
  var t = n[0], e = n[1], a = n[2], f, s, h;
  return f = Math.atan2(a, e), s = f * 360 / 2 / Math.PI, s < 0 && (s += 360), h = Math.sqrt(e * e + a * a), [t, h, s];
}
function yd(n) {
  return Dd(Of(n));
}
function Mf(n) {
  var t = n[0], e = n[1], a = n[2], f, s, h;
  return h = a / 360 * 2 * Math.PI, f = e * Math.cos(h), s = e * Math.sin(h), [t, f, s];
}
function gm(n) {
  return Of(Mf(n));
}
function _m(n) {
  return yd(Mf(n));
}
function jr(n) {
  return wf[n];
}
function wm(n) {
  return xu(jr(n));
}
function bm(n) {
  return us(jr(n));
}
function vm(n) {
  return Fu(jr(n));
}
function Dm(n) {
  return Bu(jr(n));
}
function mm(n) {
  return Lf(jr(n));
}
function ym(n) {
  return Nf(jr(n));
}
var wf = {
  aliceblue: [240, 248, 255],
  antiquewhite: [250, 235, 215],
  aqua: [0, 255, 255],
  aquamarine: [127, 255, 212],
  azure: [240, 255, 255],
  beige: [245, 245, 220],
  bisque: [255, 228, 196],
  black: [0, 0, 0],
  blanchedalmond: [255, 235, 205],
  blue: [0, 0, 255],
  blueviolet: [138, 43, 226],
  brown: [165, 42, 42],
  burlywood: [222, 184, 135],
  cadetblue: [95, 158, 160],
  chartreuse: [127, 255, 0],
  chocolate: [210, 105, 30],
  coral: [255, 127, 80],
  cornflowerblue: [100, 149, 237],
  cornsilk: [255, 248, 220],
  crimson: [220, 20, 60],
  cyan: [0, 255, 255],
  darkblue: [0, 0, 139],
  darkcyan: [0, 139, 139],
  darkgoldenrod: [184, 134, 11],
  darkgray: [169, 169, 169],
  darkgreen: [0, 100, 0],
  darkgrey: [169, 169, 169],
  darkkhaki: [189, 183, 107],
  darkmagenta: [139, 0, 139],
  darkolivegreen: [85, 107, 47],
  darkorange: [255, 140, 0],
  darkorchid: [153, 50, 204],
  darkred: [139, 0, 0],
  darksalmon: [233, 150, 122],
  darkseagreen: [143, 188, 143],
  darkslateblue: [72, 61, 139],
  darkslategray: [47, 79, 79],
  darkslategrey: [47, 79, 79],
  darkturquoise: [0, 206, 209],
  darkviolet: [148, 0, 211],
  deeppink: [255, 20, 147],
  deepskyblue: [0, 191, 255],
  dimgray: [105, 105, 105],
  dimgrey: [105, 105, 105],
  dodgerblue: [30, 144, 255],
  firebrick: [178, 34, 34],
  floralwhite: [255, 250, 240],
  forestgreen: [34, 139, 34],
  fuchsia: [255, 0, 255],
  gainsboro: [220, 220, 220],
  ghostwhite: [248, 248, 255],
  gold: [255, 215, 0],
  goldenrod: [218, 165, 32],
  gray: [128, 128, 128],
  green: [0, 128, 0],
  greenyellow: [173, 255, 47],
  grey: [128, 128, 128],
  honeydew: [240, 255, 240],
  hotpink: [255, 105, 180],
  indianred: [205, 92, 92],
  indigo: [75, 0, 130],
  ivory: [255, 255, 240],
  khaki: [240, 230, 140],
  lavender: [230, 230, 250],
  lavenderblush: [255, 240, 245],
  lawngreen: [124, 252, 0],
  lemonchiffon: [255, 250, 205],
  lightblue: [173, 216, 230],
  lightcoral: [240, 128, 128],
  lightcyan: [224, 255, 255],
  lightgoldenrodyellow: [250, 250, 210],
  lightgray: [211, 211, 211],
  lightgreen: [144, 238, 144],
  lightgrey: [211, 211, 211],
  lightpink: [255, 182, 193],
  lightsalmon: [255, 160, 122],
  lightseagreen: [32, 178, 170],
  lightskyblue: [135, 206, 250],
  lightslategray: [119, 136, 153],
  lightslategrey: [119, 136, 153],
  lightsteelblue: [176, 196, 222],
  lightyellow: [255, 255, 224],
  lime: [0, 255, 0],
  limegreen: [50, 205, 50],
  linen: [250, 240, 230],
  magenta: [255, 0, 255],
  maroon: [128, 0, 0],
  mediumaquamarine: [102, 205, 170],
  mediumblue: [0, 0, 205],
  mediumorchid: [186, 85, 211],
  mediumpurple: [147, 112, 219],
  mediumseagreen: [60, 179, 113],
  mediumslateblue: [123, 104, 238],
  mediumspringgreen: [0, 250, 154],
  mediumturquoise: [72, 209, 204],
  mediumvioletred: [199, 21, 133],
  midnightblue: [25, 25, 112],
  mintcream: [245, 255, 250],
  mistyrose: [255, 228, 225],
  moccasin: [255, 228, 181],
  navajowhite: [255, 222, 173],
  navy: [0, 0, 128],
  oldlace: [253, 245, 230],
  olive: [128, 128, 0],
  olivedrab: [107, 142, 35],
  orange: [255, 165, 0],
  orangered: [255, 69, 0],
  orchid: [218, 112, 214],
  palegoldenrod: [238, 232, 170],
  palegreen: [152, 251, 152],
  paleturquoise: [175, 238, 238],
  palevioletred: [219, 112, 147],
  papayawhip: [255, 239, 213],
  peachpuff: [255, 218, 185],
  peru: [205, 133, 63],
  pink: [255, 192, 203],
  plum: [221, 160, 221],
  powderblue: [176, 224, 230],
  purple: [128, 0, 128],
  rebeccapurple: [102, 51, 153],
  red: [255, 0, 0],
  rosybrown: [188, 143, 143],
  royalblue: [65, 105, 225],
  saddlebrown: [139, 69, 19],
  salmon: [250, 128, 114],
  sandybrown: [244, 164, 96],
  seagreen: [46, 139, 87],
  seashell: [255, 245, 238],
  sienna: [160, 82, 45],
  silver: [192, 192, 192],
  skyblue: [135, 206, 235],
  slateblue: [106, 90, 205],
  slategray: [112, 128, 144],
  slategrey: [112, 128, 144],
  snow: [255, 250, 250],
  springgreen: [0, 255, 127],
  steelblue: [70, 130, 180],
  tan: [210, 180, 140],
  teal: [0, 128, 128],
  thistle: [216, 191, 216],
  tomato: [255, 99, 71],
  turquoise: [64, 224, 208],
  violet: [238, 130, 238],
  wheat: [245, 222, 179],
  white: [255, 255, 255],
  whitesmoke: [245, 245, 245],
  yellow: [255, 255, 0],
  yellowgreen: [154, 205, 50]
}, Ed = {};
for (var Lc in wf)
  Ed[JSON.stringify(wf[Lc])] = Lc;
var No = YD, Ei = function() {
  return new Tu();
};
for (var tu in No) {
  Ei[tu + "Raw"] = /* @__PURE__ */ function(n) {
    return function(t) {
      return typeof t == "number" && (t = Array.prototype.slice.call(arguments)), No[n](t);
    };
  }(tu);
  var Oc = /(\w+)2(\w+)/.exec(tu), Lo = Oc[1], Em = Oc[2];
  Ei[Lo] = Ei[Lo] || {}, Ei[Lo][Em] = Ei[tu] = /* @__PURE__ */ function(n) {
    return function(t) {
      typeof t == "number" && (t = Array.prototype.slice.call(arguments));
      var e = No[n](t);
      if (typeof e == "string" || e === void 0)
        return e;
      for (var a = 0; a < e.length; a++)
        e[a] = Math.round(e[a]);
      return e;
    };
  }(tu);
}
var Tu = function() {
  this.convs = {};
};
Tu.prototype.routeSpace = function(n, t) {
  var e = t[0];
  return e === void 0 ? this.getValues(n) : (typeof e == "number" && (e = Array.prototype.slice.call(t)), this.setValues(n, e));
};
Tu.prototype.setValues = function(n, t) {
  return this.space = n, this.convs = {}, this.convs[n] = t, this;
};
Tu.prototype.getValues = function(n) {
  var t = this.convs[n];
  if (!t) {
    var e = this.space, a = this.convs[e];
    t = Ei[e][n](a), this.convs[n] = t;
  }
  return t;
};
["rgb", "hsl", "hsv", "cmyk", "keyword"].forEach(function(n) {
  Tu.prototype[n] = function(t) {
    return this.routeSpace(n, arguments);
  };
});
var pt = typeof globalThis < "u" && globalThis || typeof self < "u" && self || // eslint-disable-next-line no-undef
typeof global < "u" && global || {}, xt = {
  searchParams: "URLSearchParams" in pt,
  iterable: "Symbol" in pt && "iterator" in Symbol,
  blob: "FileReader" in pt && "Blob" in pt && function() {
    try {
      return new Blob(), !0;
    } catch {
      return !1;
    }
  }(),
  formData: "FormData" in pt,
  arrayBuffer: "ArrayBuffer" in pt
};
function Cm(n) {
  return n && DataView.prototype.isPrototypeOf(n);
}
if (xt.arrayBuffer)
  var Am = [
    "[object Int8Array]",
    "[object Uint8Array]",
    "[object Uint8ClampedArray]",
    "[object Int16Array]",
    "[object Uint16Array]",
    "[object Int32Array]",
    "[object Uint32Array]",
    "[object Float32Array]",
    "[object Float64Array]"
  ], xm = ArrayBuffer.isView || function(n) {
    return n && Am.indexOf(Object.prototype.toString.call(n)) > -1;
  };
function Ri(n) {
  if (typeof n != "string" && (n = String(n)), /[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(n) || n === "")
    throw new TypeError('Invalid character in header field name: "' + n + '"');
  return n.toLowerCase();
}
function Uf(n) {
  return typeof n != "string" && (n = String(n)), n;
}
function zf(n) {
  var t = {
    next: function() {
      var e = n.shift();
      return { done: e === void 0, value: e };
    }
  };
  return xt.iterable && (t[Symbol.iterator] = function() {
    return t;
  }), t;
}
function ft(n) {
  this.map = {}, n instanceof ft ? n.forEach(function(t, e) {
    this.append(e, t);
  }, this) : Array.isArray(n) ? n.forEach(function(t) {
    if (t.length != 2)
      throw new TypeError("Headers constructor: expected name/value pair to be length 2, found" + t.length);
    this.append(t[0], t[1]);
  }, this) : n && Object.getOwnPropertyNames(n).forEach(function(t) {
    this.append(t, n[t]);
  }, this);
}
ft.prototype.append = function(n, t) {
  n = Ri(n), t = Uf(t);
  var e = this.map[n];
  this.map[n] = e ? e + ", " + t : t;
};
ft.prototype.delete = function(n) {
  delete this.map[Ri(n)];
};
ft.prototype.get = function(n) {
  return n = Ri(n), this.has(n) ? this.map[n] : null;
};
ft.prototype.has = function(n) {
  return this.map.hasOwnProperty(Ri(n));
};
ft.prototype.set = function(n, t) {
  this.map[Ri(n)] = Uf(t);
};
ft.prototype.forEach = function(n, t) {
  for (var e in this.map)
    this.map.hasOwnProperty(e) && n.call(t, this.map[e], e, this);
};
ft.prototype.keys = function() {
  var n = [];
  return this.forEach(function(t, e) {
    n.push(e);
  }), zf(n);
};
ft.prototype.values = function() {
  var n = [];
  return this.forEach(function(t) {
    n.push(t);
  }), zf(n);
};
ft.prototype.entries = function() {
  var n = [];
  return this.forEach(function(t, e) {
    n.push([e, t]);
  }), zf(n);
};
xt.iterable && (ft.prototype[Symbol.iterator] = ft.prototype.entries);
function Oo(n) {
  if (!n._noBody) {
    if (n.bodyUsed)
      return Promise.reject(new TypeError("Already read"));
    n.bodyUsed = !0;
  }
}
function Cd(n) {
  return new Promise(function(t, e) {
    n.onload = function() {
      t(n.result);
    }, n.onerror = function() {
      e(n.error);
    };
  });
}
function Fm(n) {
  var t = new FileReader(), e = Cd(t);
  return t.readAsArrayBuffer(n), e;
}
function Bm(n) {
  var t = new FileReader(), e = Cd(t), a = /charset=([A-Za-z0-9_-]+)/.exec(n.type), f = a ? a[1] : "utf-8";
  return t.readAsText(n, f), e;
}
function Sm(n) {
  for (var t = new Uint8Array(n), e = new Array(t.length), a = 0; a < t.length; a++)
    e[a] = String.fromCharCode(t[a]);
  return e.join("");
}
function Pc(n) {
  if (n.slice)
    return n.slice(0);
  var t = new Uint8Array(n.byteLength);
  return t.set(new Uint8Array(n)), t.buffer;
}
function Ad() {
  return this.bodyUsed = !1, this._initBody = function(n) {
    this.bodyUsed = this.bodyUsed, this._bodyInit = n, n ? typeof n == "string" ? this._bodyText = n : xt.blob && Blob.prototype.isPrototypeOf(n) ? this._bodyBlob = n : xt.formData && FormData.prototype.isPrototypeOf(n) ? this._bodyFormData = n : xt.searchParams && URLSearchParams.prototype.isPrototypeOf(n) ? this._bodyText = n.toString() : xt.arrayBuffer && xt.blob && Cm(n) ? (this._bodyArrayBuffer = Pc(n.buffer), this._bodyInit = new Blob([this._bodyArrayBuffer])) : xt.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(n) || xm(n)) ? this._bodyArrayBuffer = Pc(n) : this._bodyText = n = Object.prototype.toString.call(n) : (this._noBody = !0, this._bodyText = ""), this.headers.get("content-type") || (typeof n == "string" ? this.headers.set("content-type", "text/plain;charset=UTF-8") : this._bodyBlob && this._bodyBlob.type ? this.headers.set("content-type", this._bodyBlob.type) : xt.searchParams && URLSearchParams.prototype.isPrototypeOf(n) && this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8"));
  }, xt.blob && (this.blob = function() {
    var n = Oo(this);
    if (n)
      return n;
    if (this._bodyBlob)
      return Promise.resolve(this._bodyBlob);
    if (this._bodyArrayBuffer)
      return Promise.resolve(new Blob([this._bodyArrayBuffer]));
    if (this._bodyFormData)
      throw new Error("could not read FormData body as blob");
    return Promise.resolve(new Blob([this._bodyText]));
  }), this.arrayBuffer = function() {
    if (this._bodyArrayBuffer) {
      var n = Oo(this);
      return n || (ArrayBuffer.isView(this._bodyArrayBuffer) ? Promise.resolve(
        this._bodyArrayBuffer.buffer.slice(
          this._bodyArrayBuffer.byteOffset,
          this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
        )
      ) : Promise.resolve(this._bodyArrayBuffer));
    } else {
      if (xt.blob)
        return this.blob().then(Fm);
      throw new Error("could not read as ArrayBuffer");
    }
  }, this.text = function() {
    var n = Oo(this);
    if (n)
      return n;
    if (this._bodyBlob)
      return Bm(this._bodyBlob);
    if (this._bodyArrayBuffer)
      return Promise.resolve(Sm(this._bodyArrayBuffer));
    if (this._bodyFormData)
      throw new Error("could not read FormData body as text");
    return Promise.resolve(this._bodyText);
  }, xt.formData && (this.formData = function() {
    return this.text().then(Tm);
  }), this.json = function() {
    return this.text().then(JSON.parse);
  }, this;
}
var Im = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];
function km(n) {
  var t = n.toUpperCase();
  return Im.indexOf(t) > -1 ? t : n;
}
function Zr(n, t) {
  if (!(this instanceof Zr))
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
  t = t || {};
  var e = t.body;
  if (n instanceof Zr) {
    if (n.bodyUsed)
      throw new TypeError("Already read");
    this.url = n.url, this.credentials = n.credentials, t.headers || (this.headers = new ft(n.headers)), this.method = n.method, this.mode = n.mode, this.signal = n.signal, !e && n._bodyInit != null && (e = n._bodyInit, n.bodyUsed = !0);
  } else
    this.url = String(n);
  if (this.credentials = t.credentials || this.credentials || "same-origin", (t.headers || !this.headers) && (this.headers = new ft(t.headers)), this.method = km(t.method || this.method || "GET"), this.mode = t.mode || this.mode || null, this.signal = t.signal || this.signal || function() {
    if ("AbortController" in pt) {
      var s = new AbortController();
      return s.signal;
    }
  }(), this.referrer = null, (this.method === "GET" || this.method === "HEAD") && e)
    throw new TypeError("Body not allowed for GET or HEAD requests");
  if (this._initBody(e), (this.method === "GET" || this.method === "HEAD") && (t.cache === "no-store" || t.cache === "no-cache")) {
    var a = /([?&])_=[^&]*/;
    if (a.test(this.url))
      this.url = this.url.replace(a, "$1_=" + (/* @__PURE__ */ new Date()).getTime());
    else {
      var f = /\?/;
      this.url += (f.test(this.url) ? "&" : "?") + "_=" + (/* @__PURE__ */ new Date()).getTime();
    }
  }
}
Zr.prototype.clone = function() {
  return new Zr(this, { body: this._bodyInit });
};
function Tm(n) {
  var t = new FormData();
  return n.trim().split("&").forEach(function(e) {
    if (e) {
      var a = e.split("="), f = a.shift().replace(/\+/g, " "), s = a.join("=").replace(/\+/g, " ");
      t.append(decodeURIComponent(f), decodeURIComponent(s));
    }
  }), t;
}
function $m(n) {
  var t = new ft(), e = n.replace(/\r?\n[\t ]+/g, " ");
  return e.split("\r").map(function(a) {
    return a.indexOf(`
`) === 0 ? a.substr(1, a.length) : a;
  }).forEach(function(a) {
    var f = a.split(":"), s = f.shift().trim();
    if (s) {
      var h = f.join(":").trim();
      try {
        t.append(s, h);
      } catch (l) {
        console.warn("Response " + l.message);
      }
    }
  }), t;
}
Ad.call(Zr.prototype);
function Mn(n, t) {
  if (!(this instanceof Mn))
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
  if (t || (t = {}), this.type = "default", this.status = t.status === void 0 ? 200 : t.status, this.status < 200 || this.status > 599)
    throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
  this.ok = this.status >= 200 && this.status < 300, this.statusText = t.statusText === void 0 ? "" : "" + t.statusText, this.headers = new ft(t.headers), this.url = t.url || "", this._initBody(n);
}
Ad.call(Mn.prototype);
Mn.prototype.clone = function() {
  return new Mn(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new ft(this.headers),
    url: this.url
  });
};
Mn.error = function() {
  var n = new Mn(null, { status: 200, statusText: "" });
  return n.ok = !1, n.status = 0, n.type = "error", n;
};
var Rm = [301, 302, 303, 307, 308];
Mn.redirect = function(n, t) {
  if (Rm.indexOf(t) === -1)
    throw new RangeError("Invalid status code");
  return new Mn(null, { status: t, headers: { location: n } });
};
var zr = pt.DOMException;
try {
  new zr();
} catch {
  zr = function(t, e) {
    this.message = t, this.name = e;
    var a = Error(t);
    this.stack = a.stack;
  }, zr.prototype = Object.create(Error.prototype), zr.prototype.constructor = zr;
}
function xd(n, t) {
  return new Promise(function(e, a) {
    var f = new Zr(n, t);
    if (f.signal && f.signal.aborted)
      return a(new zr("Aborted", "AbortError"));
    var s = new XMLHttpRequest();
    function h() {
      s.abort();
    }
    s.onload = function() {
      var c = {
        statusText: s.statusText,
        headers: $m(s.getAllResponseHeaders() || "")
      };
      f.url.indexOf("file://") === 0 && (s.status < 200 || s.status > 599) ? c.status = 200 : c.status = s.status, c.url = "responseURL" in s ? s.responseURL : c.headers.get("X-Request-URL");
      var d = "response" in s ? s.response : s.responseText;
      setTimeout(function() {
        e(new Mn(d, c));
      }, 0);
    }, s.onerror = function() {
      setTimeout(function() {
        a(new TypeError("Network request failed"));
      }, 0);
    }, s.ontimeout = function() {
      setTimeout(function() {
        a(new TypeError("Network request timed out"));
      }, 0);
    }, s.onabort = function() {
      setTimeout(function() {
        a(new zr("Aborted", "AbortError"));
      }, 0);
    };
    function l(c) {
      try {
        return c === "" && pt.location.href ? pt.location.href : c;
      } catch {
        return c;
      }
    }
    if (s.open(f.method, l(f.url), !0), f.credentials === "include" ? s.withCredentials = !0 : f.credentials === "omit" && (s.withCredentials = !1), "responseType" in s && (xt.blob ? s.responseType = "blob" : xt.arrayBuffer && (s.responseType = "arraybuffer")), t && typeof t.headers == "object" && !(t.headers instanceof ft || pt.Headers && t.headers instanceof pt.Headers)) {
      var D = [];
      Object.getOwnPropertyNames(t.headers).forEach(function(c) {
        D.push(Ri(c)), s.setRequestHeader(c, Uf(t.headers[c]));
      }), f.headers.forEach(function(c, d) {
        D.indexOf(d) === -1 && s.setRequestHeader(d, c);
      });
    } else
      f.headers.forEach(function(c, d) {
        s.setRequestHeader(d, c);
      });
    f.signal && (f.signal.addEventListener("abort", h), s.onreadystatechange = function() {
      s.readyState === 4 && f.signal.removeEventListener("abort", h);
    }), s.send(typeof f._bodyInit > "u" ? null : f._bodyInit);
  });
}
xd.polyfill = !0;
pt.fetch || (pt.fetch = xd, pt.Headers = ft, pt.Request = Zr, pt.Response = Mn);
var Nm = self.fetch.bind(self), _u = /* @__PURE__ */ is(Nm);
function Ci(n, t = !1) {
  const e = n >= 1e3 ? Math.floor(n) : Math.round(n);
  return e >= 75e4 ? `${(e / 1e6).toFixed(1)} Mb` : e >= 1e4 ? `${(e / 1e3).toFixed(1)} Kb` : e > 0 ? `${e} bp` : t ? "<1 bp" : "0 bp";
}
const Lm = 10, Po = 5, Mc = 0.99, Om = 200, Pm = 5, Mm = new KD();
class Um {
  constructor(t) {
    we(this, "primaryGenome");
    this.primaryGenome = t, this.multiAlign = HD(this.multiAlign);
  }
  multiAlign(t, e) {
    const { visRegion: a, visWidth: f, viewWindowRegion: s } = t, l = new qr(a, f).xWidthToBases(1) < Lm;
    let D;
    if (l) {
      const c = e, { newRecordsArray: d, allGaps: x } = this.refineRecordsArray(
        c,
        t
      );
      D = d;
      const C = this.calculatePrimaryVis(x, t);
      return D.reduce(
        (E, I) => ({
          ...E,
          [I.query]: I.isBigChain ? this.alignRough(
            I.id,
            I.query,
            I.records,
            t
          ) : this.alignFine(
            I.id,
            I.query,
            I.records,
            t,
            C,
            x
          )
        }),
        {}
      );
    } else
      return D = e, D.reduce(
        (c, d) => ({
          ...c,
          [d.query]: this.alignRough(
            d.id,
            d.query,
            d.records,
            t
          )
        }),
        {}
      );
  }
  calculatePrimaryVis(t, e) {
    const { visRegion: a, viewWindow: f, viewWindowRegion: s } = e, h = a.getNavigationContext(), l = new Nc(h);
    l.setGaps(t);
    const D = l.build(), c = B(a), d = B(s), x = f.getLength() / d.getWidth(), C = c.getWidth() * x, I = new qr(c, C).baseSpanToXSpan(
      d.getContextCoordinates()
    );
    return {
      visRegion: c,
      visWidth: C,
      viewWindowRegion: d,
      viewWindow: I
    };
    function B(M) {
      const [T, G] = M.getContextCoordinates();
      return new Ti(
        D,
        l.convertOldCoordinates(T),
        l.convertOldCoordinates(G)
      );
    }
  }
  // return a new recordObj array with gaps inserted, and allGap contextBase.
  refineRecordsArray(t, e) {
    const a = Mc, f = [], s = {};
    for (const c of t) {
      const d = this._computeContextLocations(
        c.records,
        e
      ), C = this._getPrimaryGenomeGaps(d, a).reduce((E, I) => ({ ...E, [I.contextBase]: I.length }), {});
      f.push({
        recordsObj: c,
        placements: d,
        primaryGapsObj: C
      });
      for (const E of Object.keys(C))
        E in s ? s[E] = Math.max(
          s[E],
          C[E]
        ) : s[E] = C[E];
    }
    const h = [];
    for (const c of Object.keys(s))
      h.push({
        contextBase: Number(c),
        length: s[c]
      });
    if (h.sort((c, d) => c.contextBase - d.contextBase), f.length > 1)
      for (const c of f) {
        const d = [];
        for (const x of Object.keys(s))
          if (x in c.primaryGapsObj) {
            const C = s[x] - c.primaryGapsObj[x];
            C > 0 && d.push({
              contextBase: Number(x),
              length: C
            });
          } else
            d.push({
              contextBase: Number(x),
              length: s[x]
            });
        d.sort((x, C) => C.contextBase - x.contextBase);
        for (const x of d) {
          const C = "-".repeat(x.length), E = x.contextBase, I = c.placements.filter(
            (B) => B.contextSpan.start < E && B.contextSpan.end > E
          )[0];
          if (I) {
            const B = I.visiblePart.getTargetSequence(), M = D(
              B,
              E - I.contextSpan.start
            ), T = I.visiblePart.sequenceInterval.start + M, G = I.record.targetSeq, P = I.record.querySeq;
            I.record.targetSeq = G.slice(0, T) + C + G.slice(T), I.record.querySeq = P.slice(0, T) + C + P.slice(T);
          }
        }
        c.recordsObj.records = c.placements.map(
          (x) => x.record
        );
      }
    return { newRecordsArray: f.map((c) => c.recordsObj), allGaps: h };
    function D(c, d) {
      let x = 0;
      for (const C of c)
        if (x++, C !== Au && d--, d === 0)
          break;
      return x;
    }
  }
  alignFine(t, e, a, f, s, h) {
    const { visRegion: l, visWidth: D } = s, c = new qr(l, D), d = Mc, x = f.visRegion.getNavigationContext(), C = this._computeContextLocations(a, f), E = new Nc(x);
    E.setGaps(h);
    for (const P of C) {
      const $ = P.contextSpan, L = P.visiblePart, Q = new Te(
        E.convertOldCoordinates($.start),
        E.convertOldCoordinates($.end)
      ), z = c.baseSpanToXSpan(Q), Z = L.getTargetSequence(), J = L.getQuerySequence();
      P.contextSpan = Q, P.targetXSpan = z, P.queryXSpan = z, P.targetSegments = this._placeSequenceSegments(
        Z,
        d,
        z.start,
        c
      ), P.querySegments = this._placeSequenceSegments(
        J,
        d,
        z.start,
        c
      );
    }
    const I = [], B = new Mo(Po), M = new Mo(Po);
    for (let P = 1; P < C.length; P++) {
      const $ = C[P - 1], L = C[P], Q = $.targetXSpan.end, z = L.targetXSpan.start, Z = $.record.locus.chr, J = $.record.locus.end, ee = $.record.queryLocus.chr, K = $.record.queryStrand, ie = K === "+" ? $.record.queryLocus.end : $.record.queryLocus.start, Ce = L.record.locus.chr, be = L.record.locus.start, Pe = L.record.queryLocus.chr, Ne = L.record.queryStrand, ve = Ne === "+" ? L.record.queryLocus.start : L.record.queryLocus.end;
      let Fe;
      ee === Pe ? K === "+" && Ne === "+" ? (Fe = ve >= ie ? "" : "overlap ", Fe += Ci(Math.abs(ve - ie))) : K === "-" && Ne === "-" ? (Fe = ie >= ve ? "" : "overlap ", Fe += Ci(Math.abs(ie - ve))) : Fe = "reverse direction" : Fe = "not connected";
      const xn = (Q + z) / 2, mt = ($.queryXSpan.end + L.queryXSpan.start) / 2, me = Z === Ce ? Ci(be - J) : "not connected", Vt = 0.5 * (me.length * 5), Me = xn - Vt, yt = xn + Vt, Xt = Me <= Q || yt >= z, sr = Xt ? B.place(
        new Te(Me, yt)
      ) : new Te(Me, yt), _t = new Te(Q, z), Fr = 0.5 * (Fe.length * 5), Fn = mt - Fr, pn = mt + Fr, Kt = Fn <= $.queryXSpan.end || pn >= L.queryXSpan.start, ut = Kt ? M.place(
        new Te(Fn, pn)
      ) : new Te(Fn, pn), qn = new Te(
        $.queryXSpan.end,
        L.queryXSpan.start
      );
      I.push({
        targetGapText: me,
        targetXSpan: _t,
        targetTextXSpan: sr,
        queryGapText: Fe,
        queryXSpan: qn,
        queryTextXSpan: ut,
        shiftTarget: Xt,
        shiftQuery: Kt
      });
    }
    const T = this._getQueryPieces(C), G = this._makeQueryGenomeRegion(
      T,
      D,
      c
    );
    return {
      id: t,
      isFineMode: !0,
      primaryVisData: s,
      queryRegion: G,
      drawData: C,
      drawGapText: I,
      primaryGenome: this.primaryGenome,
      queryGenome: e,
      basesPerPixel: c.xWidthToBases(1),
      navContextBuilder: E
    };
  }
  /**
   * Groups and merges alignment records based on their proximity in the query (secondary) genome.  Then, calculates
   * draw positions for all records.
   *
   * @param {AlignmentRecord[]} alignmentRecords - records to process
   * @param {DisplayedRegionModel} viewRegion - view region of the primary genome
   * @param {number} width - view width of the primary genome
   * @return {PlacedMergedAlignment[]} placed merged alignments
   */
  alignRough(t, e, a, f) {
    const { visRegion: s, visWidth: h } = f, l = new qr(s, h), D = l.xWidthToBases(Om), d = a.reduce(
      (B, M) => B + (M.getIsReverseStrandQuery() ? -1 * M.getLength() : M.getLength()),
      0
    ) < 0 ? "-" : "+", x = this._computeContextLocations(
      a,
      f
    );
    let C = Qe.mergeAdvanced(
      // Note that the third parameter gets query loci
      x,
      D,
      (B) => B.visiblePart.getQueryLocus()
    );
    C = C.sort(
      (B, M) => M.locus.getLength() - B.locus.getLength()
    );
    const E = new Mo(Po), I = [];
    for (const B of C) {
      const M = B.locus, T = B.sources, G = l.basesToXWidth(M.getLength()), P = 0.5 * G;
      if (G < Pm)
        continue;
      const $ = zm(
        T.map((be) => be.targetXSpan)
      ), L = Math.min(
        ...T.map((be) => be.targetXSpan.start)
      ), Q = Math.max(
        ...T.map((be) => be.targetXSpan.end)
      ), z = new Te(L, Q), Z = $ - P, J = $ + P, ee = E.place(
        new Te(Z, J)
      ), K = T.map(
        (be) => be.record.queryLocus
      ), ie = d === "-", Ce = this._placeInternalLoci(
        M,
        K,
        ee,
        ie,
        l
      );
      for (let be = 0; be < K.length; be++)
        T[be].queryXSpan = Ce[be];
      I.push({
        queryFeature: new Pn(void 0, M, d),
        targetXSpan: z,
        queryXSpan: ee,
        segments: T
      });
    }
    return {
      id: t,
      isFineMode: !1,
      primaryVisData: f,
      queryRegion: this._makeQueryGenomeRegion(I, h, l),
      drawData: I,
      plotStrand: d,
      primaryGenome: this.primaryGenome,
      queryGenome: e,
      basesPerPixel: l.xWidthToBases(1)
    };
  }
  /**
   * Calculates context coordinates in the *primary* genome for alignment records.  Returns PlacedAlignments with NO x
   * coordinates set.  Make sure you set them before returning them in any public API!
   *
   * @param records
   * @param visData
   */
  _computeContextLocations(t, e) {
    const { visRegion: a, visWidth: f } = e;
    return Mm.placeFeatures(t, a, f).map(
      (s) => ({
        record: s.feature,
        visiblePart: Rf.fromFeatureSegment(
          s.visiblePart
        ),
        contextSpan: s.contextLocation,
        targetXSpan: s.xSpan,
        queryXSpan: null
      })
    );
  }
  /**
   *
   * @param placedAlignment
   * @param minGapLength
   */
  _getPrimaryGenomeGaps(t, e) {
    const a = [];
    for (const f of t) {
      const { visiblePart: s, contextSpan: h } = f, l = Rc(
        s.getTargetSequence(),
        e,
        !0
      ), D = Ro(
        s.getTargetSequence(),
        h.start
      );
      for (const c of l)
        a.push({
          contextBase: D[c.index],
          length: c.length
        });
    }
    return a;
  }
  _placeSequenceSegments(t, e, a, f) {
    const s = Rc(t, e);
    s.sort((l, D) => l.index - D.index);
    let h = a;
    for (const l of s) {
      const D = l.isGap ? l.length : Ya(t.substr(l.index, l.length)), c = f.basesToXWidth(D);
      l.xSpan = new Te(
        h,
        h + c
      ), h += c;
    }
    return s;
  }
  /**
   *
   * @param placements
   * @param minGapLength
   * @param pixelsPerBase
   */
  _getQueryPieces(t) {
    const e = [];
    for (const a of t) {
      const { record: f, visiblePart: s } = a, h = f.getIsReverseStrandQuery(), l = s.getQuerySequence();
      let D;
      h ? D = Ro(
        l,
        s.getQueryLocusFine().end,
        !0
      ) : D = Ro(
        l,
        s.getQueryLocusFine().start
      );
      const c = f.queryLocus.chr;
      for (const d of a.querySegments) {
        const { isGap: x, index: C, length: E, xSpan: I } = d;
        if (x)
          continue;
        const B = D[C], M = Ya(l.substr(C, E));
        let T;
        h ? T = new Qe(
          c,
          B - M,
          B
        ) : T = new Qe(
          c,
          B,
          B + M
        ), e.push({
          queryFeature: new Pn(
            void 0,
            T,
            f.queryStrand
          ),
          queryXSpan: I
        });
      }
    }
    return e;
  }
  _makeQueryGenomeRegion(t, e, a) {
    const f = t.slice().sort((c, d) => c.queryXSpan.start - d.queryXSpan.start), s = [];
    let h = 0, l = new Qe("", -1, -1);
    for (const c of f) {
      const { queryXSpan: d, queryFeature: x } = c, C = x.getLocus(), E = d.start - h, I = Math.round(a.xWidthToBases(E));
      if (I >= 1) {
        const B = qm(C, l) ? `${Ci(I)} gap` : void 0;
        s.push(yn.makeGap(I, B));
      }
      s.push(x), h = d.end, l = C;
    }
    const D = Math.round(a.xWidthToBases(e - h));
    return D > 0 && s.push(yn.makeGap(D)), new Ti(new yn("", s));
  }
  _placeInternalLoci(t, e, a, f, s) {
    const h = [];
    if (f)
      for (const l of e) {
        const D = l.start - t.start, c = s.basesToXWidth(D), d = a.end - c, x = s.basesToXWidth(l.getLength()), C = d < a.end ? d : a.end, E = d - x > a.start ? d - x : a.start;
        h.push(new Te(E, C));
      }
    else
      for (const l of e) {
        const D = l.start - t.start, c = s.basesToXWidth(D), d = a.start + c, x = s.basesToXWidth(l.getLength()), C = d > a.start ? d : a.start, E = d + x < a.end ? d + x : a.end;
        h.push(new Te(C, E));
      }
    return h;
  }
}
class Mo {
  constructor(t = 0) {
    we(this, "leftExtent");
    we(this, "rightExtent");
    we(this, "margin");
    we(this, "_placements");
    this.leftExtent = 1 / 0, this.rightExtent = -1 / 0, this.margin = t, this._placements = [];
  }
  place(t) {
    let e = t;
    if (this._placements.some(
      (a) => a.getOverlap(t) != null
    )) {
      const a = 0.5 * (t.start + t.end);
      e = Math.abs(a - this.leftExtent) < Math.abs(a - this.rightExtent) ? new Te(
        this.leftExtent - t.getLength(),
        this.leftExtent
      ) : new Te(
        this.rightExtent,
        this.rightExtent + t.getLength()
      );
    }
    return this._placements.push(e), e.start < this.leftExtent && (this.leftExtent = e.start - this.margin), e.end > this.rightExtent && (this.rightExtent = e.end + this.margin), e;
  }
  retrievePlacements() {
    return this._placements;
  }
}
function zm(n) {
  const t = Ot.sumBy(
    n,
    (a) => 0.5 * a.getLength() * (a.start + a.end)
  ), e = Ot.sumBy(n, (a) => a.getLength());
  return t / e;
}
function qm(n, t) {
  return n.chr !== t.chr ? !1 : n.end === t.start || t.end === n.start;
}
class Gm {
}
class Wm {
  constructor() {
    this.signals = /* @__PURE__ */ new Set(), this.abortController = new AbortController();
  }
  /**
   * @param {AbortSignal} [signal] optional AbortSignal to add. if falsy,
   *  will be treated as a null-signal, and this abortcontroller will no
   *  longer be abortable.
   */
  //@ts-ignore
  addSignal(t = new Gm()) {
    if (this.signal.aborted)
      throw new Error("cannot add a signal, already aborted!");
    this.signals.add(t), t.aborted ? this.handleAborted(t) : typeof t.addEventListener == "function" && t.addEventListener("abort", () => {
      this.handleAborted(t);
    });
  }
  handleAborted(t) {
    this.signals.delete(t), this.signals.size === 0 && this.abortController.abort();
  }
  get signal() {
    return this.abortController.signal;
  }
  abort() {
    this.abortController.abort();
  }
}
class Hm {
  constructor() {
    this.callbacks = /* @__PURE__ */ new Set();
  }
  addCallback(t = () => {
  }) {
    this.callbacks.add(t), t(this.currentMessage);
  }
  callback(t) {
    this.currentMessage = t;
    for (const e of this.callbacks)
      e(t);
  }
}
class wu {
  constructor({ fill: t, cache: e }) {
    if (typeof t != "function")
      throw new TypeError("must pass a fill function");
    if (typeof e != "object")
      throw new TypeError("must pass a cache object");
    if (typeof e.get != "function" || typeof e.set != "function" || typeof e.delete != "function")
      throw new TypeError("cache must implement get(key), set(key, val), and and delete(key)");
    this.cache = e, this.fillCallback = t;
  }
  static isAbortException(t) {
    return (
      // DOMException
      t.name === "AbortError" || // standard-ish non-DOM abort exception
      //@ts-ignore
      t.code === "ERR_ABORTED" || // stringified DOMException
      t.message === "AbortError: aborted" || // stringified standard-ish exception
      t.message === "Error: aborted"
    );
  }
  evict(t, e) {
    this.cache.get(t) === e && this.cache.delete(t);
  }
  fill(t, e, a, f) {
    const s = new Wm(), h = new Hm();
    h.addCallback(f);
    const l = {
      aborter: s,
      promise: this.fillCallback(e, s.signal, (D) => {
        h.callback(D);
      }),
      settled: !1,
      statusReporter: h,
      get aborted() {
        return this.aborter.signal.aborted;
      }
    };
    l.aborter.addSignal(a), l.aborter.signal.addEventListener("abort", () => {
      l.settled || this.evict(t, l);
    }), l.promise.then(() => {
      l.settled = !0;
    }, () => {
      l.settled = !0, this.evict(t, l);
    }).catch((D) => {
      throw console.error(D), D;
    }), this.cache.set(t, l);
  }
  static checkSinglePromise(t, e) {
    function a() {
      if (e != null && e.aborted)
        throw Object.assign(new Error("aborted"), { code: "ERR_ABORTED" });
    }
    return t.then((f) => (a(), f), (f) => {
      throw a(), f;
    });
  }
  has(t) {
    return this.cache.has(t);
  }
  /**
   * Callback for getting status of the pending async
   *
   * @callback statusCallback
   * @param {any} status, current status string or message object
   */
  /**
   * @param {any} key cache key to use for this request
   * @param {any} data data passed as the first argument to the fill callback
   * @param {AbortSignal} [signal] optional AbortSignal object that aborts the request
   * @param {statusCallback} a callback to get the current status of a pending async operation
   */
  get(t, e, a, f) {
    if (!a && e instanceof AbortSignal)
      throw new TypeError("second get argument appears to be an AbortSignal, perhaps you meant to pass `null` for the fill data?");
    const s = this.cache.get(t);
    return s ? s.aborted && !s.settled ? (this.evict(t, s), this.get(t, e, a, f)) : s.settled ? s.promise : (s.aborter.addSignal(a), s.statusReporter.addCallback(f), wu.checkSinglePromise(s.promise, a)) : (this.fill(t, e, a, f), wu.checkSinglePromise(
      //see https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-
      this.cache.get(t).promise,
      a
    ));
  }
  /**
   * delete the given entry from the cache. if it exists and its fill request has
   * not yet settled, the fill will be signaled to abort.
   *
   * @param {any} key
   */
  delete(t) {
    const e = this.cache.get(t);
    e && (e.settled || e.aborter.abort(), this.cache.delete(t));
  }
  /**
   * Clear all requests from the cache. Aborts any that have not settled.
   * @returns {number} count of entries deleted
   */
  clear() {
    const t = this.cache.keys();
    let e = 0;
    for (let a = t.next(); !a.done; a = t.next())
      this.delete(a.value), e += 1;
    return e;
  }
}
class Zm {
  constructor(t = {}) {
    if (!(t.maxSize && t.maxSize > 0))
      throw new TypeError("`maxSize` must be a number greater than 0");
    this.maxSize = t.maxSize, this.cache = /* @__PURE__ */ new Map(), this.oldCache = /* @__PURE__ */ new Map(), this._size = 0;
  }
  _set(t, e) {
    this.cache.set(t, e), this._size++, this._size >= this.maxSize && (this._size = 0, this.oldCache = this.cache, this.cache = /* @__PURE__ */ new Map());
  }
  get(t) {
    if (this.cache.has(t))
      return this.cache.get(t);
    if (this.oldCache.has(t)) {
      const e = this.oldCache.get(t);
      return this.oldCache.delete(t), this._set(t, e), e;
    }
  }
  set(t, e) {
    return this.cache.has(t) ? this.cache.set(t, e) : this._set(t, e), this;
  }
  has(t) {
    return this.cache.has(t) || this.oldCache.has(t);
  }
  peek(t) {
    if (this.cache.has(t))
      return this.cache.get(t);
    if (this.oldCache.has(t))
      return this.oldCache.get(t);
  }
  delete(t) {
    const e = this.cache.delete(t);
    return e && this._size--, this.oldCache.delete(t) || e;
  }
  clear() {
    this.cache.clear(), this.oldCache.clear(), this._size = 0;
  }
  *keys() {
    for (const [t] of this)
      yield t;
  }
  *values() {
    for (const [, t] of this)
      yield t;
  }
  *[Symbol.iterator]() {
    for (const t of this.cache)
      yield t;
    for (const t of this.oldCache) {
      const [e] = t;
      this.cache.has(e) || (yield t);
    }
  }
  get size() {
    let t = 0;
    for (const e of this.oldCache.keys())
      this.cache.has(e) || t++;
    return this._size + t;
  }
}
var Vm = Zm, Fd = /* @__PURE__ */ is(Vm), Un = {}, os = {};
os.byteLength = Ym;
os.toByteArray = Jm;
os.fromByteArray = ty;
var Rn = [], un = [], Xm = typeof Uint8Array < "u" ? Uint8Array : Array, Uo = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (var bi = 0, Km = Uo.length; bi < Km; ++bi)
  Rn[bi] = Uo[bi], un[Uo.charCodeAt(bi)] = bi;
un[45] = 62;
un[95] = 63;
function Bd(n) {
  var t = n.length;
  if (t % 4 > 0)
    throw new Error("Invalid string. Length must be a multiple of 4");
  var e = n.indexOf("=");
  e === -1 && (e = t);
  var a = e === t ? 0 : 4 - e % 4;
  return [e, a];
}
function Ym(n) {
  var t = Bd(n), e = t[0], a = t[1];
  return (e + a) * 3 / 4 - a;
}
function Qm(n, t, e) {
  return (t + e) * 3 / 4 - e;
}
function Jm(n) {
  var t, e = Bd(n), a = e[0], f = e[1], s = new Xm(Qm(n, a, f)), h = 0, l = f > 0 ? a - 4 : a, D;
  for (D = 0; D < l; D += 4)
    t = un[n.charCodeAt(D)] << 18 | un[n.charCodeAt(D + 1)] << 12 | un[n.charCodeAt(D + 2)] << 6 | un[n.charCodeAt(D + 3)], s[h++] = t >> 16 & 255, s[h++] = t >> 8 & 255, s[h++] = t & 255;
  return f === 2 && (t = un[n.charCodeAt(D)] << 2 | un[n.charCodeAt(D + 1)] >> 4, s[h++] = t & 255), f === 1 && (t = un[n.charCodeAt(D)] << 10 | un[n.charCodeAt(D + 1)] << 4 | un[n.charCodeAt(D + 2)] >> 2, s[h++] = t >> 8 & 255, s[h++] = t & 255), s;
}
function jm(n) {
  return Rn[n >> 18 & 63] + Rn[n >> 12 & 63] + Rn[n >> 6 & 63] + Rn[n & 63];
}
function ey(n, t, e) {
  for (var a, f = [], s = t; s < e; s += 3)
    a = (n[s] << 16 & 16711680) + (n[s + 1] << 8 & 65280) + (n[s + 2] & 255), f.push(jm(a));
  return f.join("");
}
function ty(n) {
  for (var t, e = n.length, a = e % 3, f = [], s = 16383, h = 0, l = e - a; h < l; h += s)
    f.push(ey(n, h, h + s > l ? l : h + s));
  return a === 1 ? (t = n[e - 1], f.push(
    Rn[t >> 2] + Rn[t << 4 & 63] + "=="
  )) : a === 2 && (t = (n[e - 2] << 8) + n[e - 1], f.push(
    Rn[t >> 10] + Rn[t >> 4 & 63] + Rn[t << 2 & 63] + "="
  )), f.join("");
}
var qf = {};
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
qf.read = function(n, t, e, a, f) {
  var s, h, l = f * 8 - a - 1, D = (1 << l) - 1, c = D >> 1, d = -7, x = e ? f - 1 : 0, C = e ? -1 : 1, E = n[t + x];
  for (x += C, s = E & (1 << -d) - 1, E >>= -d, d += l; d > 0; s = s * 256 + n[t + x], x += C, d -= 8)
    ;
  for (h = s & (1 << -d) - 1, s >>= -d, d += a; d > 0; h = h * 256 + n[t + x], x += C, d -= 8)
    ;
  if (s === 0)
    s = 1 - c;
  else {
    if (s === D)
      return h ? NaN : (E ? -1 : 1) * (1 / 0);
    h = h + Math.pow(2, a), s = s - c;
  }
  return (E ? -1 : 1) * h * Math.pow(2, s - a);
};
qf.write = function(n, t, e, a, f, s) {
  var h, l, D, c = s * 8 - f - 1, d = (1 << c) - 1, x = d >> 1, C = f === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, E = a ? 0 : s - 1, I = a ? 1 : -1, B = t < 0 || t === 0 && 1 / t < 0 ? 1 : 0;
  for (t = Math.abs(t), isNaN(t) || t === 1 / 0 ? (l = isNaN(t) ? 1 : 0, h = d) : (h = Math.floor(Math.log(t) / Math.LN2), t * (D = Math.pow(2, -h)) < 1 && (h--, D *= 2), h + x >= 1 ? t += C / D : t += C * Math.pow(2, 1 - x), t * D >= 2 && (h++, D /= 2), h + x >= d ? (l = 0, h = d) : h + x >= 1 ? (l = (t * D - 1) * Math.pow(2, f), h = h + x) : (l = t * Math.pow(2, x - 1) * Math.pow(2, f), h = 0)); f >= 8; n[e + E] = l & 255, E += I, l /= 256, f -= 8)
    ;
  for (h = h << f | l, c += f; c > 0; n[e + E] = h & 255, E += I, h /= 256, c -= 8)
    ;
  n[e + E - I] |= B * 128;
};
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
(function(n) {
  const t = os, e = qf, a = typeof Symbol == "function" && typeof Symbol.for == "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
  n.Buffer = l, n.SlowBuffer = G, n.INSPECT_MAX_BYTES = 50;
  const f = 2147483647;
  n.kMaxLength = f, l.TYPED_ARRAY_SUPPORT = s(), !l.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error(
    "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
  );
  function s() {
    try {
      const m = new Uint8Array(1), _ = { foo: function() {
        return 42;
      } };
      return Object.setPrototypeOf(_, Uint8Array.prototype), Object.setPrototypeOf(m, _), m.foo() === 42;
    } catch {
      return !1;
    }
  }
  Object.defineProperty(l.prototype, "parent", {
    enumerable: !0,
    get: function() {
      if (l.isBuffer(this))
        return this.buffer;
    }
  }), Object.defineProperty(l.prototype, "offset", {
    enumerable: !0,
    get: function() {
      if (l.isBuffer(this))
        return this.byteOffset;
    }
  });
  function h(m) {
    if (m > f)
      throw new RangeError('The value "' + m + '" is invalid for option "size"');
    const _ = new Uint8Array(m);
    return Object.setPrototypeOf(_, l.prototype), _;
  }
  function l(m, _, w) {
    if (typeof m == "number") {
      if (typeof _ == "string")
        throw new TypeError(
          'The "string" argument must be of type string. Received type number'
        );
      return x(m);
    }
    return D(m, _, w);
  }
  l.poolSize = 8192;
  function D(m, _, w) {
    if (typeof m == "string")
      return C(m, _);
    if (ArrayBuffer.isView(m))
      return I(m);
    if (m == null)
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof m
      );
    if (bt(m, ArrayBuffer) || m && bt(m.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (bt(m, SharedArrayBuffer) || m && bt(m.buffer, SharedArrayBuffer)))
      return B(m, _, w);
    if (typeof m == "number")
      throw new TypeError(
        'The "value" argument must not be of type number. Received type number'
      );
    const F = m.valueOf && m.valueOf();
    if (F != null && F !== m)
      return l.from(F, _, w);
    const R = M(m);
    if (R) return R;
    if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof m[Symbol.toPrimitive] == "function")
      return l.from(m[Symbol.toPrimitive]("string"), _, w);
    throw new TypeError(
      "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof m
    );
  }
  l.from = function(m, _, w) {
    return D(m, _, w);
  }, Object.setPrototypeOf(l.prototype, Uint8Array.prototype), Object.setPrototypeOf(l, Uint8Array);
  function c(m) {
    if (typeof m != "number")
      throw new TypeError('"size" argument must be of type number');
    if (m < 0)
      throw new RangeError('The value "' + m + '" is invalid for option "size"');
  }
  function d(m, _, w) {
    return c(m), m <= 0 ? h(m) : _ !== void 0 ? typeof w == "string" ? h(m).fill(_, w) : h(m).fill(_) : h(m);
  }
  l.alloc = function(m, _, w) {
    return d(m, _, w);
  };
  function x(m) {
    return c(m), h(m < 0 ? 0 : T(m) | 0);
  }
  l.allocUnsafe = function(m) {
    return x(m);
  }, l.allocUnsafeSlow = function(m) {
    return x(m);
  };
  function C(m, _) {
    if ((typeof _ != "string" || _ === "") && (_ = "utf8"), !l.isEncoding(_))
      throw new TypeError("Unknown encoding: " + _);
    const w = P(m, _) | 0;
    let F = h(w);
    const R = F.write(m, _);
    return R !== w && (F = F.slice(0, R)), F;
  }
  function E(m) {
    const _ = m.length < 0 ? 0 : T(m.length) | 0, w = h(_);
    for (let F = 0; F < _; F += 1)
      w[F] = m[F] & 255;
    return w;
  }
  function I(m) {
    if (bt(m, Uint8Array)) {
      const _ = new Uint8Array(m);
      return B(_.buffer, _.byteOffset, _.byteLength);
    }
    return E(m);
  }
  function B(m, _, w) {
    if (_ < 0 || m.byteLength < _)
      throw new RangeError('"offset" is outside of buffer bounds');
    if (m.byteLength < _ + (w || 0))
      throw new RangeError('"length" is outside of buffer bounds');
    let F;
    return _ === void 0 && w === void 0 ? F = new Uint8Array(m) : w === void 0 ? F = new Uint8Array(m, _) : F = new Uint8Array(m, _, w), Object.setPrototypeOf(F, l.prototype), F;
  }
  function M(m) {
    if (l.isBuffer(m)) {
      const _ = T(m.length) | 0, w = h(_);
      return w.length === 0 || m.copy(w, 0, 0, _), w;
    }
    if (m.length !== void 0)
      return typeof m.length != "number" || fr(m.length) ? h(0) : E(m);
    if (m.type === "Buffer" && Array.isArray(m.data))
      return E(m.data);
  }
  function T(m) {
    if (m >= f)
      throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + f.toString(16) + " bytes");
    return m | 0;
  }
  function G(m) {
    return +m != m && (m = 0), l.alloc(+m);
  }
  l.isBuffer = function(_) {
    return _ != null && _._isBuffer === !0 && _ !== l.prototype;
  }, l.compare = function(_, w) {
    if (bt(_, Uint8Array) && (_ = l.from(_, _.offset, _.byteLength)), bt(w, Uint8Array) && (w = l.from(w, w.offset, w.byteLength)), !l.isBuffer(_) || !l.isBuffer(w))
      throw new TypeError(
        'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
      );
    if (_ === w) return 0;
    let F = _.length, R = w.length;
    for (let U = 0, H = Math.min(F, R); U < H; ++U)
      if (_[U] !== w[U]) {
        F = _[U], R = w[U];
        break;
      }
    return F < R ? -1 : R < F ? 1 : 0;
  }, l.isEncoding = function(_) {
    switch (String(_).toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "latin1":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return !0;
      default:
        return !1;
    }
  }, l.concat = function(_, w) {
    if (!Array.isArray(_))
      throw new TypeError('"list" argument must be an Array of Buffers');
    if (_.length === 0)
      return l.alloc(0);
    let F;
    if (w === void 0)
      for (w = 0, F = 0; F < _.length; ++F)
        w += _[F].length;
    const R = l.allocUnsafe(w);
    let U = 0;
    for (F = 0; F < _.length; ++F) {
      let H = _[F];
      if (bt(H, Uint8Array))
        U + H.length > R.length ? (l.isBuffer(H) || (H = l.from(H)), H.copy(R, U)) : Uint8Array.prototype.set.call(
          R,
          H,
          U
        );
      else if (l.isBuffer(H))
        H.copy(R, U);
      else
        throw new TypeError('"list" argument must be an Array of Buffers');
      U += H.length;
    }
    return R;
  };
  function P(m, _) {
    if (l.isBuffer(m))
      return m.length;
    if (ArrayBuffer.isView(m) || bt(m, ArrayBuffer))
      return m.byteLength;
    if (typeof m != "string")
      throw new TypeError(
        'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof m
      );
    const w = m.length, F = arguments.length > 2 && arguments[2] === !0;
    if (!F && w === 0) return 0;
    let R = !1;
    for (; ; )
      switch (_) {
        case "ascii":
        case "latin1":
        case "binary":
          return w;
        case "utf8":
        case "utf-8":
          return Mt(m).length;
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return w * 2;
        case "hex":
          return w >>> 1;
        case "base64":
          return or(m).length;
        default:
          if (R)
            return F ? -1 : Mt(m).length;
          _ = ("" + _).toLowerCase(), R = !0;
      }
  }
  l.byteLength = P;
  function $(m, _, w) {
    let F = !1;
    if ((_ === void 0 || _ < 0) && (_ = 0), _ > this.length || ((w === void 0 || w > this.length) && (w = this.length), w <= 0) || (w >>>= 0, _ >>>= 0, w <= _))
      return "";
    for (m || (m = "utf8"); ; )
      switch (m) {
        case "hex":
          return xn(this, _, w);
        case "utf8":
        case "utf-8":
          return be(this, _, w);
        case "ascii":
          return ve(this, _, w);
        case "latin1":
        case "binary":
          return Fe(this, _, w);
        case "base64":
          return Ce(this, _, w);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return mt(this, _, w);
        default:
          if (F) throw new TypeError("Unknown encoding: " + m);
          m = (m + "").toLowerCase(), F = !0;
      }
  }
  l.prototype._isBuffer = !0;
  function L(m, _, w) {
    const F = m[_];
    m[_] = m[w], m[w] = F;
  }
  l.prototype.swap16 = function() {
    const _ = this.length;
    if (_ % 2 !== 0)
      throw new RangeError("Buffer size must be a multiple of 16-bits");
    for (let w = 0; w < _; w += 2)
      L(this, w, w + 1);
    return this;
  }, l.prototype.swap32 = function() {
    const _ = this.length;
    if (_ % 4 !== 0)
      throw new RangeError("Buffer size must be a multiple of 32-bits");
    for (let w = 0; w < _; w += 4)
      L(this, w, w + 3), L(this, w + 1, w + 2);
    return this;
  }, l.prototype.swap64 = function() {
    const _ = this.length;
    if (_ % 8 !== 0)
      throw new RangeError("Buffer size must be a multiple of 64-bits");
    for (let w = 0; w < _; w += 8)
      L(this, w, w + 7), L(this, w + 1, w + 6), L(this, w + 2, w + 5), L(this, w + 3, w + 4);
    return this;
  }, l.prototype.toString = function() {
    const _ = this.length;
    return _ === 0 ? "" : arguments.length === 0 ? be(this, 0, _) : $.apply(this, arguments);
  }, l.prototype.toLocaleString = l.prototype.toString, l.prototype.equals = function(_) {
    if (!l.isBuffer(_)) throw new TypeError("Argument must be a Buffer");
    return this === _ ? !0 : l.compare(this, _) === 0;
  }, l.prototype.inspect = function() {
    let _ = "";
    const w = n.INSPECT_MAX_BYTES;
    return _ = this.toString("hex", 0, w).replace(/(.{2})/g, "$1 ").trim(), this.length > w && (_ += " ... "), "<Buffer " + _ + ">";
  }, a && (l.prototype[a] = l.prototype.inspect), l.prototype.compare = function(_, w, F, R, U) {
    if (bt(_, Uint8Array) && (_ = l.from(_, _.offset, _.byteLength)), !l.isBuffer(_))
      throw new TypeError(
        'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof _
      );
    if (w === void 0 && (w = 0), F === void 0 && (F = _ ? _.length : 0), R === void 0 && (R = 0), U === void 0 && (U = this.length), w < 0 || F > _.length || R < 0 || U > this.length)
      throw new RangeError("out of range index");
    if (R >= U && w >= F)
      return 0;
    if (R >= U)
      return -1;
    if (w >= F)
      return 1;
    if (w >>>= 0, F >>>= 0, R >>>= 0, U >>>= 0, this === _) return 0;
    let H = U - R, ce = F - w;
    const Ue = Math.min(H, ce), Le = this.slice(R, U), ze = _.slice(w, F);
    for (let $e = 0; $e < Ue; ++$e)
      if (Le[$e] !== ze[$e]) {
        H = Le[$e], ce = ze[$e];
        break;
      }
    return H < ce ? -1 : ce < H ? 1 : 0;
  };
  function Q(m, _, w, F, R) {
    if (m.length === 0) return -1;
    if (typeof w == "string" ? (F = w, w = 0) : w > 2147483647 ? w = 2147483647 : w < -2147483648 && (w = -2147483648), w = +w, fr(w) && (w = R ? 0 : m.length - 1), w < 0 && (w = m.length + w), w >= m.length) {
      if (R) return -1;
      w = m.length - 1;
    } else if (w < 0)
      if (R) w = 0;
      else return -1;
    if (typeof _ == "string" && (_ = l.from(_, F)), l.isBuffer(_))
      return _.length === 0 ? -1 : z(m, _, w, F, R);
    if (typeof _ == "number")
      return _ = _ & 255, typeof Uint8Array.prototype.indexOf == "function" ? R ? Uint8Array.prototype.indexOf.call(m, _, w) : Uint8Array.prototype.lastIndexOf.call(m, _, w) : z(m, [_], w, F, R);
    throw new TypeError("val must be string, number or Buffer");
  }
  function z(m, _, w, F, R) {
    let U = 1, H = m.length, ce = _.length;
    if (F !== void 0 && (F = String(F).toLowerCase(), F === "ucs2" || F === "ucs-2" || F === "utf16le" || F === "utf-16le")) {
      if (m.length < 2 || _.length < 2)
        return -1;
      U = 2, H /= 2, ce /= 2, w /= 2;
    }
    function Ue(ze, $e) {
      return U === 1 ? ze[$e] : ze.readUInt16BE($e * U);
    }
    let Le;
    if (R) {
      let ze = -1;
      for (Le = w; Le < H; Le++)
        if (Ue(m, Le) === Ue(_, ze === -1 ? 0 : Le - ze)) {
          if (ze === -1 && (ze = Le), Le - ze + 1 === ce) return ze * U;
        } else
          ze !== -1 && (Le -= Le - ze), ze = -1;
    } else
      for (w + ce > H && (w = H - ce), Le = w; Le >= 0; Le--) {
        let ze = !0;
        for (let $e = 0; $e < ce; $e++)
          if (Ue(m, Le + $e) !== Ue(_, $e)) {
            ze = !1;
            break;
          }
        if (ze) return Le;
      }
    return -1;
  }
  l.prototype.includes = function(_, w, F) {
    return this.indexOf(_, w, F) !== -1;
  }, l.prototype.indexOf = function(_, w, F) {
    return Q(this, _, w, F, !0);
  }, l.prototype.lastIndexOf = function(_, w, F) {
    return Q(this, _, w, F, !1);
  };
  function Z(m, _, w, F) {
    w = Number(w) || 0;
    const R = m.length - w;
    F ? (F = Number(F), F > R && (F = R)) : F = R;
    const U = _.length;
    F > U / 2 && (F = U / 2);
    let H;
    for (H = 0; H < F; ++H) {
      const ce = parseInt(_.substr(H * 2, 2), 16);
      if (fr(ce)) return H;
      m[w + H] = ce;
    }
    return H;
  }
  function J(m, _, w, F) {
    return wt(Mt(_, m.length - w), m, w, F);
  }
  function ee(m, _, w, F) {
    return wt(Ou(_), m, w, F);
  }
  function K(m, _, w, F) {
    return wt(or(_), m, w, F);
  }
  function ie(m, _, w, F) {
    return wt(_s(_, m.length - w), m, w, F);
  }
  l.prototype.write = function(_, w, F, R) {
    if (w === void 0)
      R = "utf8", F = this.length, w = 0;
    else if (F === void 0 && typeof w == "string")
      R = w, F = this.length, w = 0;
    else if (isFinite(w))
      w = w >>> 0, isFinite(F) ? (F = F >>> 0, R === void 0 && (R = "utf8")) : (R = F, F = void 0);
    else
      throw new Error(
        "Buffer.write(string, encoding, offset[, length]) is no longer supported"
      );
    const U = this.length - w;
    if ((F === void 0 || F > U) && (F = U), _.length > 0 && (F < 0 || w < 0) || w > this.length)
      throw new RangeError("Attempt to write outside buffer bounds");
    R || (R = "utf8");
    let H = !1;
    for (; ; )
      switch (R) {
        case "hex":
          return Z(this, _, w, F);
        case "utf8":
        case "utf-8":
          return J(this, _, w, F);
        case "ascii":
        case "latin1":
        case "binary":
          return ee(this, _, w, F);
        case "base64":
          return K(this, _, w, F);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return ie(this, _, w, F);
        default:
          if (H) throw new TypeError("Unknown encoding: " + R);
          R = ("" + R).toLowerCase(), H = !0;
      }
  }, l.prototype.toJSON = function() {
    return {
      type: "Buffer",
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };
  function Ce(m, _, w) {
    return _ === 0 && w === m.length ? t.fromByteArray(m) : t.fromByteArray(m.slice(_, w));
  }
  function be(m, _, w) {
    w = Math.min(m.length, w);
    const F = [];
    let R = _;
    for (; R < w; ) {
      const U = m[R];
      let H = null, ce = U > 239 ? 4 : U > 223 ? 3 : U > 191 ? 2 : 1;
      if (R + ce <= w) {
        let Ue, Le, ze, $e;
        switch (ce) {
          case 1:
            U < 128 && (H = U);
            break;
          case 2:
            Ue = m[R + 1], (Ue & 192) === 128 && ($e = (U & 31) << 6 | Ue & 63, $e > 127 && (H = $e));
            break;
          case 3:
            Ue = m[R + 1], Le = m[R + 2], (Ue & 192) === 128 && (Le & 192) === 128 && ($e = (U & 15) << 12 | (Ue & 63) << 6 | Le & 63, $e > 2047 && ($e < 55296 || $e > 57343) && (H = $e));
            break;
          case 4:
            Ue = m[R + 1], Le = m[R + 2], ze = m[R + 3], (Ue & 192) === 128 && (Le & 192) === 128 && (ze & 192) === 128 && ($e = (U & 15) << 18 | (Ue & 63) << 12 | (Le & 63) << 6 | ze & 63, $e > 65535 && $e < 1114112 && (H = $e));
        }
      }
      H === null ? (H = 65533, ce = 1) : H > 65535 && (H -= 65536, F.push(H >>> 10 & 1023 | 55296), H = 56320 | H & 1023), F.push(H), R += ce;
    }
    return Ne(F);
  }
  const Pe = 4096;
  function Ne(m) {
    const _ = m.length;
    if (_ <= Pe)
      return String.fromCharCode.apply(String, m);
    let w = "", F = 0;
    for (; F < _; )
      w += String.fromCharCode.apply(
        String,
        m.slice(F, F += Pe)
      );
    return w;
  }
  function ve(m, _, w) {
    let F = "";
    w = Math.min(m.length, w);
    for (let R = _; R < w; ++R)
      F += String.fromCharCode(m[R] & 127);
    return F;
  }
  function Fe(m, _, w) {
    let F = "";
    w = Math.min(m.length, w);
    for (let R = _; R < w; ++R)
      F += String.fromCharCode(m[R]);
    return F;
  }
  function xn(m, _, w) {
    const F = m.length;
    (!_ || _ < 0) && (_ = 0), (!w || w < 0 || w > F) && (w = F);
    let R = "";
    for (let U = _; U < w; ++U)
      R += ws[m[U]];
    return R;
  }
  function mt(m, _, w) {
    const F = m.slice(_, w);
    let R = "";
    for (let U = 0; U < F.length - 1; U += 2)
      R += String.fromCharCode(F[U] + F[U + 1] * 256);
    return R;
  }
  l.prototype.slice = function(_, w) {
    const F = this.length;
    _ = ~~_, w = w === void 0 ? F : ~~w, _ < 0 ? (_ += F, _ < 0 && (_ = 0)) : _ > F && (_ = F), w < 0 ? (w += F, w < 0 && (w = 0)) : w > F && (w = F), w < _ && (w = _);
    const R = this.subarray(_, w);
    return Object.setPrototypeOf(R, l.prototype), R;
  };
  function me(m, _, w) {
    if (m % 1 !== 0 || m < 0) throw new RangeError("offset is not uint");
    if (m + _ > w) throw new RangeError("Trying to access beyond buffer length");
  }
  l.prototype.readUintLE = l.prototype.readUIntLE = function(_, w, F) {
    _ = _ >>> 0, w = w >>> 0, F || me(_, w, this.length);
    let R = this[_], U = 1, H = 0;
    for (; ++H < w && (U *= 256); )
      R += this[_ + H] * U;
    return R;
  }, l.prototype.readUintBE = l.prototype.readUIntBE = function(_, w, F) {
    _ = _ >>> 0, w = w >>> 0, F || me(_, w, this.length);
    let R = this[_ + --w], U = 1;
    for (; w > 0 && (U *= 256); )
      R += this[_ + --w] * U;
    return R;
  }, l.prototype.readUint8 = l.prototype.readUInt8 = function(_, w) {
    return _ = _ >>> 0, w || me(_, 1, this.length), this[_];
  }, l.prototype.readUint16LE = l.prototype.readUInt16LE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 2, this.length), this[_] | this[_ + 1] << 8;
  }, l.prototype.readUint16BE = l.prototype.readUInt16BE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 2, this.length), this[_] << 8 | this[_ + 1];
  }, l.prototype.readUint32LE = l.prototype.readUInt32LE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 4, this.length), (this[_] | this[_ + 1] << 8 | this[_ + 2] << 16) + this[_ + 3] * 16777216;
  }, l.prototype.readUint32BE = l.prototype.readUInt32BE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 4, this.length), this[_] * 16777216 + (this[_ + 1] << 16 | this[_ + 2] << 8 | this[_ + 3]);
  }, l.prototype.readBigUInt64LE = It(function(_) {
    _ = _ >>> 0, Kt(_, "offset");
    const w = this[_], F = this[_ + 7];
    (w === void 0 || F === void 0) && ut(_, this.length - 8);
    const R = w + this[++_] * 2 ** 8 + this[++_] * 2 ** 16 + this[++_] * 2 ** 24, U = this[++_] + this[++_] * 2 ** 8 + this[++_] * 2 ** 16 + F * 2 ** 24;
    return BigInt(R) + (BigInt(U) << BigInt(32));
  }), l.prototype.readBigUInt64BE = It(function(_) {
    _ = _ >>> 0, Kt(_, "offset");
    const w = this[_], F = this[_ + 7];
    (w === void 0 || F === void 0) && ut(_, this.length - 8);
    const R = w * 2 ** 24 + this[++_] * 2 ** 16 + this[++_] * 2 ** 8 + this[++_], U = this[++_] * 2 ** 24 + this[++_] * 2 ** 16 + this[++_] * 2 ** 8 + F;
    return (BigInt(R) << BigInt(32)) + BigInt(U);
  }), l.prototype.readIntLE = function(_, w, F) {
    _ = _ >>> 0, w = w >>> 0, F || me(_, w, this.length);
    let R = this[_], U = 1, H = 0;
    for (; ++H < w && (U *= 256); )
      R += this[_ + H] * U;
    return U *= 128, R >= U && (R -= Math.pow(2, 8 * w)), R;
  }, l.prototype.readIntBE = function(_, w, F) {
    _ = _ >>> 0, w = w >>> 0, F || me(_, w, this.length);
    let R = w, U = 1, H = this[_ + --R];
    for (; R > 0 && (U *= 256); )
      H += this[_ + --R] * U;
    return U *= 128, H >= U && (H -= Math.pow(2, 8 * w)), H;
  }, l.prototype.readInt8 = function(_, w) {
    return _ = _ >>> 0, w || me(_, 1, this.length), this[_] & 128 ? (255 - this[_] + 1) * -1 : this[_];
  }, l.prototype.readInt16LE = function(_, w) {
    _ = _ >>> 0, w || me(_, 2, this.length);
    const F = this[_] | this[_ + 1] << 8;
    return F & 32768 ? F | 4294901760 : F;
  }, l.prototype.readInt16BE = function(_, w) {
    _ = _ >>> 0, w || me(_, 2, this.length);
    const F = this[_ + 1] | this[_] << 8;
    return F & 32768 ? F | 4294901760 : F;
  }, l.prototype.readInt32LE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 4, this.length), this[_] | this[_ + 1] << 8 | this[_ + 2] << 16 | this[_ + 3] << 24;
  }, l.prototype.readInt32BE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 4, this.length), this[_] << 24 | this[_ + 1] << 16 | this[_ + 2] << 8 | this[_ + 3];
  }, l.prototype.readBigInt64LE = It(function(_) {
    _ = _ >>> 0, Kt(_, "offset");
    const w = this[_], F = this[_ + 7];
    (w === void 0 || F === void 0) && ut(_, this.length - 8);
    const R = this[_ + 4] + this[_ + 5] * 2 ** 8 + this[_ + 6] * 2 ** 16 + (F << 24);
    return (BigInt(R) << BigInt(32)) + BigInt(w + this[++_] * 2 ** 8 + this[++_] * 2 ** 16 + this[++_] * 2 ** 24);
  }), l.prototype.readBigInt64BE = It(function(_) {
    _ = _ >>> 0, Kt(_, "offset");
    const w = this[_], F = this[_ + 7];
    (w === void 0 || F === void 0) && ut(_, this.length - 8);
    const R = (w << 24) + // Overflow
    this[++_] * 2 ** 16 + this[++_] * 2 ** 8 + this[++_];
    return (BigInt(R) << BigInt(32)) + BigInt(this[++_] * 2 ** 24 + this[++_] * 2 ** 16 + this[++_] * 2 ** 8 + F);
  }), l.prototype.readFloatLE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 4, this.length), e.read(this, _, !0, 23, 4);
  }, l.prototype.readFloatBE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 4, this.length), e.read(this, _, !1, 23, 4);
  }, l.prototype.readDoubleLE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 8, this.length), e.read(this, _, !0, 52, 8);
  }, l.prototype.readDoubleBE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 8, this.length), e.read(this, _, !1, 52, 8);
  };
  function et(m, _, w, F, R, U) {
    if (!l.isBuffer(m)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (_ > R || _ < U) throw new RangeError('"value" argument is out of bounds');
    if (w + F > m.length) throw new RangeError("Index out of range");
  }
  l.prototype.writeUintLE = l.prototype.writeUIntLE = function(_, w, F, R) {
    if (_ = +_, w = w >>> 0, F = F >>> 0, !R) {
      const ce = Math.pow(2, 8 * F) - 1;
      et(this, _, w, F, ce, 0);
    }
    let U = 1, H = 0;
    for (this[w] = _ & 255; ++H < F && (U *= 256); )
      this[w + H] = _ / U & 255;
    return w + F;
  }, l.prototype.writeUintBE = l.prototype.writeUIntBE = function(_, w, F, R) {
    if (_ = +_, w = w >>> 0, F = F >>> 0, !R) {
      const ce = Math.pow(2, 8 * F) - 1;
      et(this, _, w, F, ce, 0);
    }
    let U = F - 1, H = 1;
    for (this[w + U] = _ & 255; --U >= 0 && (H *= 256); )
      this[w + U] = _ / H & 255;
    return w + F;
  }, l.prototype.writeUint8 = l.prototype.writeUInt8 = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || et(this, _, w, 1, 255, 0), this[w] = _ & 255, w + 1;
  }, l.prototype.writeUint16LE = l.prototype.writeUInt16LE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || et(this, _, w, 2, 65535, 0), this[w] = _ & 255, this[w + 1] = _ >>> 8, w + 2;
  }, l.prototype.writeUint16BE = l.prototype.writeUInt16BE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || et(this, _, w, 2, 65535, 0), this[w] = _ >>> 8, this[w + 1] = _ & 255, w + 2;
  }, l.prototype.writeUint32LE = l.prototype.writeUInt32LE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || et(this, _, w, 4, 4294967295, 0), this[w + 3] = _ >>> 24, this[w + 2] = _ >>> 16, this[w + 1] = _ >>> 8, this[w] = _ & 255, w + 4;
  }, l.prototype.writeUint32BE = l.prototype.writeUInt32BE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || et(this, _, w, 4, 4294967295, 0), this[w] = _ >>> 24, this[w + 1] = _ >>> 16, this[w + 2] = _ >>> 8, this[w + 3] = _ & 255, w + 4;
  };
  function Vt(m, _, w, F, R) {
    pn(_, F, R, m, w, 7);
    let U = Number(_ & BigInt(4294967295));
    m[w++] = U, U = U >> 8, m[w++] = U, U = U >> 8, m[w++] = U, U = U >> 8, m[w++] = U;
    let H = Number(_ >> BigInt(32) & BigInt(4294967295));
    return m[w++] = H, H = H >> 8, m[w++] = H, H = H >> 8, m[w++] = H, H = H >> 8, m[w++] = H, w;
  }
  function Me(m, _, w, F, R) {
    pn(_, F, R, m, w, 7);
    let U = Number(_ & BigInt(4294967295));
    m[w + 7] = U, U = U >> 8, m[w + 6] = U, U = U >> 8, m[w + 5] = U, U = U >> 8, m[w + 4] = U;
    let H = Number(_ >> BigInt(32) & BigInt(4294967295));
    return m[w + 3] = H, H = H >> 8, m[w + 2] = H, H = H >> 8, m[w + 1] = H, H = H >> 8, m[w] = H, w + 8;
  }
  l.prototype.writeBigUInt64LE = It(function(_, w = 0) {
    return Vt(this, _, w, BigInt(0), BigInt("0xffffffffffffffff"));
  }), l.prototype.writeBigUInt64BE = It(function(_, w = 0) {
    return Me(this, _, w, BigInt(0), BigInt("0xffffffffffffffff"));
  }), l.prototype.writeIntLE = function(_, w, F, R) {
    if (_ = +_, w = w >>> 0, !R) {
      const Ue = Math.pow(2, 8 * F - 1);
      et(this, _, w, F, Ue - 1, -Ue);
    }
    let U = 0, H = 1, ce = 0;
    for (this[w] = _ & 255; ++U < F && (H *= 256); )
      _ < 0 && ce === 0 && this[w + U - 1] !== 0 && (ce = 1), this[w + U] = (_ / H >> 0) - ce & 255;
    return w + F;
  }, l.prototype.writeIntBE = function(_, w, F, R) {
    if (_ = +_, w = w >>> 0, !R) {
      const Ue = Math.pow(2, 8 * F - 1);
      et(this, _, w, F, Ue - 1, -Ue);
    }
    let U = F - 1, H = 1, ce = 0;
    for (this[w + U] = _ & 255; --U >= 0 && (H *= 256); )
      _ < 0 && ce === 0 && this[w + U + 1] !== 0 && (ce = 1), this[w + U] = (_ / H >> 0) - ce & 255;
    return w + F;
  }, l.prototype.writeInt8 = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || et(this, _, w, 1, 127, -128), _ < 0 && (_ = 255 + _ + 1), this[w] = _ & 255, w + 1;
  }, l.prototype.writeInt16LE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || et(this, _, w, 2, 32767, -32768), this[w] = _ & 255, this[w + 1] = _ >>> 8, w + 2;
  }, l.prototype.writeInt16BE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || et(this, _, w, 2, 32767, -32768), this[w] = _ >>> 8, this[w + 1] = _ & 255, w + 2;
  }, l.prototype.writeInt32LE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || et(this, _, w, 4, 2147483647, -2147483648), this[w] = _ & 255, this[w + 1] = _ >>> 8, this[w + 2] = _ >>> 16, this[w + 3] = _ >>> 24, w + 4;
  }, l.prototype.writeInt32BE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || et(this, _, w, 4, 2147483647, -2147483648), _ < 0 && (_ = 4294967295 + _ + 1), this[w] = _ >>> 24, this[w + 1] = _ >>> 16, this[w + 2] = _ >>> 8, this[w + 3] = _ & 255, w + 4;
  }, l.prototype.writeBigInt64LE = It(function(_, w = 0) {
    return Vt(this, _, w, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  }), l.prototype.writeBigInt64BE = It(function(_, w = 0) {
    return Me(this, _, w, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  });
  function yt(m, _, w, F, R, U) {
    if (w + F > m.length) throw new RangeError("Index out of range");
    if (w < 0) throw new RangeError("Index out of range");
  }
  function Xt(m, _, w, F, R) {
    return _ = +_, w = w >>> 0, R || yt(m, _, w, 4), e.write(m, _, w, F, 23, 4), w + 4;
  }
  l.prototype.writeFloatLE = function(_, w, F) {
    return Xt(this, _, w, !0, F);
  }, l.prototype.writeFloatBE = function(_, w, F) {
    return Xt(this, _, w, !1, F);
  };
  function sr(m, _, w, F, R) {
    return _ = +_, w = w >>> 0, R || yt(m, _, w, 8), e.write(m, _, w, F, 52, 8), w + 8;
  }
  l.prototype.writeDoubleLE = function(_, w, F) {
    return sr(this, _, w, !0, F);
  }, l.prototype.writeDoubleBE = function(_, w, F) {
    return sr(this, _, w, !1, F);
  }, l.prototype.copy = function(_, w, F, R) {
    if (!l.isBuffer(_)) throw new TypeError("argument should be a Buffer");
    if (F || (F = 0), !R && R !== 0 && (R = this.length), w >= _.length && (w = _.length), w || (w = 0), R > 0 && R < F && (R = F), R === F || _.length === 0 || this.length === 0) return 0;
    if (w < 0)
      throw new RangeError("targetStart out of bounds");
    if (F < 0 || F >= this.length) throw new RangeError("Index out of range");
    if (R < 0) throw new RangeError("sourceEnd out of bounds");
    R > this.length && (R = this.length), _.length - w < R - F && (R = _.length - w + F);
    const U = R - F;
    return this === _ && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(w, F, R) : Uint8Array.prototype.set.call(
      _,
      this.subarray(F, R),
      w
    ), U;
  }, l.prototype.fill = function(_, w, F, R) {
    if (typeof _ == "string") {
      if (typeof w == "string" ? (R = w, w = 0, F = this.length) : typeof F == "string" && (R = F, F = this.length), R !== void 0 && typeof R != "string")
        throw new TypeError("encoding must be a string");
      if (typeof R == "string" && !l.isEncoding(R))
        throw new TypeError("Unknown encoding: " + R);
      if (_.length === 1) {
        const H = _.charCodeAt(0);
        (R === "utf8" && H < 128 || R === "latin1") && (_ = H);
      }
    } else typeof _ == "number" ? _ = _ & 255 : typeof _ == "boolean" && (_ = Number(_));
    if (w < 0 || this.length < w || this.length < F)
      throw new RangeError("Out of range index");
    if (F <= w)
      return this;
    w = w >>> 0, F = F === void 0 ? this.length : F >>> 0, _ || (_ = 0);
    let U;
    if (typeof _ == "number")
      for (U = w; U < F; ++U)
        this[U] = _;
    else {
      const H = l.isBuffer(_) ? _ : l.from(_, R), ce = H.length;
      if (ce === 0)
        throw new TypeError('The value "' + _ + '" is invalid for argument "value"');
      for (U = 0; U < F - w; ++U)
        this[U + w] = H[U % ce];
    }
    return this;
  };
  const _t = {};
  function St(m, _, w) {
    _t[m] = class extends w {
      constructor() {
        super(), Object.defineProperty(this, "message", {
          value: _.apply(this, arguments),
          writable: !0,
          configurable: !0
        }), this.name = `${this.name} [${m}]`, this.stack, delete this.name;
      }
      get code() {
        return m;
      }
      set code(R) {
        Object.defineProperty(this, "code", {
          configurable: !0,
          enumerable: !0,
          value: R,
          writable: !0
        });
      }
      toString() {
        return `${this.name} [${m}]: ${this.message}`;
      }
    };
  }
  St(
    "ERR_BUFFER_OUT_OF_BOUNDS",
    function(m) {
      return m ? `${m} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
    },
    RangeError
  ), St(
    "ERR_INVALID_ARG_TYPE",
    function(m, _) {
      return `The "${m}" argument must be of type number. Received type ${typeof _}`;
    },
    TypeError
  ), St(
    "ERR_OUT_OF_RANGE",
    function(m, _, w) {
      let F = `The value of "${m}" is out of range.`, R = w;
      return Number.isInteger(w) && Math.abs(w) > 2 ** 32 ? R = Fr(String(w)) : typeof w == "bigint" && (R = String(w), (w > BigInt(2) ** BigInt(32) || w < -(BigInt(2) ** BigInt(32))) && (R = Fr(R)), R += "n"), F += ` It must be ${_}. Received ${R}`, F;
    },
    RangeError
  );
  function Fr(m) {
    let _ = "", w = m.length;
    const F = m[0] === "-" ? 1 : 0;
    for (; w >= F + 4; w -= 3)
      _ = `_${m.slice(w - 3, w)}${_}`;
    return `${m.slice(0, w)}${_}`;
  }
  function Fn(m, _, w) {
    Kt(_, "offset"), (m[_] === void 0 || m[_ + w] === void 0) && ut(_, m.length - (w + 1));
  }
  function pn(m, _, w, F, R, U) {
    if (m > w || m < _) {
      const H = typeof _ == "bigint" ? "n" : "";
      let ce;
      throw _ === 0 || _ === BigInt(0) ? ce = `>= 0${H} and < 2${H} ** ${(U + 1) * 8}${H}` : ce = `>= -(2${H} ** ${(U + 1) * 8 - 1}${H}) and < 2 ** ${(U + 1) * 8 - 1}${H}`, new _t.ERR_OUT_OF_RANGE("value", ce, m);
    }
    Fn(F, R, U);
  }
  function Kt(m, _) {
    if (typeof m != "number")
      throw new _t.ERR_INVALID_ARG_TYPE(_, "number", m);
  }
  function ut(m, _, w) {
    throw Math.floor(m) !== m ? (Kt(m, w), new _t.ERR_OUT_OF_RANGE("offset", "an integer", m)) : _ < 0 ? new _t.ERR_BUFFER_OUT_OF_BOUNDS() : new _t.ERR_OUT_OF_RANGE(
      "offset",
      `>= 0 and <= ${_}`,
      m
    );
  }
  const qn = /[^+/0-9A-Za-z-_]/g;
  function gs(m) {
    if (m = m.split("=")[0], m = m.trim().replace(qn, ""), m.length < 2) return "";
    for (; m.length % 4 !== 0; )
      m = m + "=";
    return m;
  }
  function Mt(m, _) {
    _ = _ || 1 / 0;
    let w;
    const F = m.length;
    let R = null;
    const U = [];
    for (let H = 0; H < F; ++H) {
      if (w = m.charCodeAt(H), w > 55295 && w < 57344) {
        if (!R) {
          if (w > 56319) {
            (_ -= 3) > -1 && U.push(239, 191, 189);
            continue;
          } else if (H + 1 === F) {
            (_ -= 3) > -1 && U.push(239, 191, 189);
            continue;
          }
          R = w;
          continue;
        }
        if (w < 56320) {
          (_ -= 3) > -1 && U.push(239, 191, 189), R = w;
          continue;
        }
        w = (R - 55296 << 10 | w - 56320) + 65536;
      } else R && (_ -= 3) > -1 && U.push(239, 191, 189);
      if (R = null, w < 128) {
        if ((_ -= 1) < 0) break;
        U.push(w);
      } else if (w < 2048) {
        if ((_ -= 2) < 0) break;
        U.push(
          w >> 6 | 192,
          w & 63 | 128
        );
      } else if (w < 65536) {
        if ((_ -= 3) < 0) break;
        U.push(
          w >> 12 | 224,
          w >> 6 & 63 | 128,
          w & 63 | 128
        );
      } else if (w < 1114112) {
        if ((_ -= 4) < 0) break;
        U.push(
          w >> 18 | 240,
          w >> 12 & 63 | 128,
          w >> 6 & 63 | 128,
          w & 63 | 128
        );
      } else
        throw new Error("Invalid code point");
    }
    return U;
  }
  function Ou(m) {
    const _ = [];
    for (let w = 0; w < m.length; ++w)
      _.push(m.charCodeAt(w) & 255);
    return _;
  }
  function _s(m, _) {
    let w, F, R;
    const U = [];
    for (let H = 0; H < m.length && !((_ -= 2) < 0); ++H)
      w = m.charCodeAt(H), F = w >> 8, R = w % 256, U.push(R), U.push(F);
    return U;
  }
  function or(m) {
    return t.toByteArray(gs(m));
  }
  function wt(m, _, w, F) {
    let R;
    for (R = 0; R < F && !(R + w >= _.length || R >= m.length); ++R)
      _[R + w] = m[R];
    return R;
  }
  function bt(m, _) {
    return m instanceof _ || m != null && m.constructor != null && m.constructor.name != null && m.constructor.name === _.name;
  }
  function fr(m) {
    return m !== m;
  }
  const ws = function() {
    const m = "0123456789abcdef", _ = new Array(256);
    for (let w = 0; w < 16; ++w) {
      const F = w * 16;
      for (let R = 0; R < 16; ++R)
        _[F + R] = m[w] + m[R];
    }
    return _;
  }();
  function It(m) {
    return typeof BigInt > "u" ? bs : m;
  }
  function bs() {
    throw new Error("BigInt not supported");
  }
})(Un);
var au = {};
function Uc(n) {
  return (typeof n == "object" && n !== null && "message" in n ? n.message : `${n}`).replace(/\.$/, "");
}
class ir {
  async getBufferFromResponse(t) {
    const e = await t.arrayBuffer();
    return Un.Buffer.from(e);
  }
  constructor(t, e = {}) {
    this.baseOverrides = {}, this.url = t;
    const a = e.fetch || globalThis.fetch.bind(globalThis);
    if (!a)
      throw new TypeError("no fetch function supplied, and none found in global environment");
    e.overrides && (this.baseOverrides = e.overrides), this.fetchImplementation = a;
  }
  async fetch(t, e) {
    let a;
    try {
      a = await this.fetchImplementation(t, e);
    } catch (f) {
      if (`${f}`.includes("Failed to fetch")) {
        console.warn(`generic-filehandle: refetching ${t} to attempt to work around chrome CORS header caching bug`);
        try {
          a = await this.fetchImplementation(t, {
            ...e,
            cache: "reload"
          });
        } catch (s) {
          throw new Error(`${Uc(s)} fetching ${t}`, { cause: s });
        }
      } else
        throw new Error(`${Uc(f)} fetching ${t}`, { cause: f });
    }
    return a;
  }
  async read(t, e = 0, a, f = 0, s = {}) {
    const { headers: h = {}, signal: l, overrides: D = {} } = s;
    a < 1 / 0 ? h.range = `bytes=${f}-${f + a}` : a === 1 / 0 && f !== 0 && (h.range = `bytes=${f}-`);
    const c = await this.fetch(this.url, {
      ...this.baseOverrides,
      ...D,
      headers: {
        ...h,
        ...D.headers,
        ...this.baseOverrides.headers
      },
      method: "GET",
      redirect: "follow",
      mode: "cors",
      signal: l
    });
    if (!c.ok)
      throw new Error(`HTTP ${c.status} fetching ${this.url}`);
    if (c.status === 200 && f === 0 || c.status === 206) {
      const d = await this.getBufferFromResponse(c), x = d.copy(t, e, 0, Math.min(a, d.length)), C = c.headers.get("content-range"), E = /\/(\d+)$/.exec(C || "");
      return E != null && E[1] && (this._stat = { size: parseInt(E[1], 10) }), { bytesRead: x, buffer: t };
    }
    throw c.status === 200 ? new Error(`${this.url} fetch returned status 200, expected 206`) : new Error(`HTTP ${c.status} fetching ${this.url}`);
  }
  async readFile(t = {}) {
    let e, a;
    typeof t == "string" ? (e = t, a = {}) : (e = t.encoding, a = t, delete a.encoding);
    const { headers: f = {}, signal: s, overrides: h = {} } = a, l = await this.fetch(this.url, {
      headers: f,
      method: "GET",
      redirect: "follow",
      mode: "cors",
      signal: s,
      ...this.baseOverrides,
      ...h
    });
    if (l.status !== 200)
      throw new Error(`HTTP ${l.status} fetching ${this.url}`);
    if (e === "utf8")
      return l.text();
    if (e)
      throw new Error(`unsupported encoding: ${e}`);
    return this.getBufferFromResponse(l);
  }
  async stat() {
    if (!this._stat) {
      const t = Un.Buffer.allocUnsafe(10);
      if (await this.read(t, 0, 10, 0), !this._stat)
        throw new Error(`unable to determine size of file at ${this.url}`);
    }
    return this._stat;
  }
  async close() {
  }
}
var ar = {};
(function(n) {
  var t = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
  function e(s, h) {
    return Object.prototype.hasOwnProperty.call(s, h);
  }
  n.assign = function(s) {
    for (var h = Array.prototype.slice.call(arguments, 1); h.length; ) {
      var l = h.shift();
      if (l) {
        if (typeof l != "object")
          throw new TypeError(l + "must be non-object");
        for (var D in l)
          e(l, D) && (s[D] = l[D]);
      }
    }
    return s;
  }, n.shrinkBuf = function(s, h) {
    return s.length === h ? s : s.subarray ? s.subarray(0, h) : (s.length = h, s);
  };
  var a = {
    arraySet: function(s, h, l, D, c) {
      if (h.subarray && s.subarray) {
        s.set(h.subarray(l, l + D), c);
        return;
      }
      for (var d = 0; d < D; d++)
        s[c + d] = h[l + d];
    },
    // Join array of chunks to single array.
    flattenChunks: function(s) {
      var h, l, D, c, d, x;
      for (D = 0, h = 0, l = s.length; h < l; h++)
        D += s[h].length;
      for (x = new Uint8Array(D), c = 0, h = 0, l = s.length; h < l; h++)
        d = s[h], x.set(d, c), c += d.length;
      return x;
    }
  }, f = {
    arraySet: function(s, h, l, D, c) {
      for (var d = 0; d < D; d++)
        s[c + d] = h[l + d];
    },
    // Join array of chunks to single array.
    flattenChunks: function(s) {
      return [].concat.apply([], s);
    }
  };
  n.setTyped = function(s) {
    s ? (n.Buf8 = Uint8Array, n.Buf16 = Uint16Array, n.Buf32 = Int32Array, n.assign(n, a)) : (n.Buf8 = Array, n.Buf16 = Array, n.Buf32 = Array, n.assign(n, f));
  }, n.setTyped(t);
})(ar);
var $u = {}, zn = {}, Ni = {}, ny = ar, ry = 4, zc = 0, qc = 1, iy = 2;
function Li(n) {
  for (var t = n.length; --t >= 0; )
    n[t] = 0;
}
var uy = 0, Sd = 1, ay = 2, sy = 3, oy = 258, Gf = 29, Ru = 256, bu = Ru + 1 + Gf, Fi = 30, Wf = 19, Id = 2 * bu + 1, Gr = 15, zo = 16, fy = 7, Hf = 256, kd = 16, Td = 17, $d = 18, bf = (
  /* extra bits for each length code */
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
), qa = (
  /* extra bits for each distance code */
  [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
), ly = (
  /* extra bits for each bit length code */
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
), Rd = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], hy = 512, tr = new Array((bu + 2) * 2);
Li(tr);
var lu = new Array(Fi * 2);
Li(lu);
var vu = new Array(hy);
Li(vu);
var Du = new Array(oy - sy + 1);
Li(Du);
var Zf = new Array(Gf);
Li(Zf);
var Qa = new Array(Fi);
Li(Qa);
function qo(n, t, e, a, f) {
  this.static_tree = n, this.extra_bits = t, this.extra_base = e, this.elems = a, this.max_length = f, this.has_stree = n && n.length;
}
var Nd, Ld, Od;
function Go(n, t) {
  this.dyn_tree = n, this.max_code = 0, this.stat_desc = t;
}
function Pd(n) {
  return n < 256 ? vu[n] : vu[256 + (n >>> 7)];
}
function mu(n, t) {
  n.pending_buf[n.pending++] = t & 255, n.pending_buf[n.pending++] = t >>> 8 & 255;
}
function Nt(n, t, e) {
  n.bi_valid > zo - e ? (n.bi_buf |= t << n.bi_valid & 65535, mu(n, n.bi_buf), n.bi_buf = t >> zo - n.bi_valid, n.bi_valid += e - zo) : (n.bi_buf |= t << n.bi_valid & 65535, n.bi_valid += e);
}
function Nn(n, t, e) {
  Nt(
    n,
    e[t * 2],
    e[t * 2 + 1]
    /*.Len*/
  );
}
function Md(n, t) {
  var e = 0;
  do
    e |= n & 1, n >>>= 1, e <<= 1;
  while (--t > 0);
  return e >>> 1;
}
function cy(n) {
  n.bi_valid === 16 ? (mu(n, n.bi_buf), n.bi_buf = 0, n.bi_valid = 0) : n.bi_valid >= 8 && (n.pending_buf[n.pending++] = n.bi_buf & 255, n.bi_buf >>= 8, n.bi_valid -= 8);
}
function dy(n, t) {
  var e = t.dyn_tree, a = t.max_code, f = t.stat_desc.static_tree, s = t.stat_desc.has_stree, h = t.stat_desc.extra_bits, l = t.stat_desc.extra_base, D = t.stat_desc.max_length, c, d, x, C, E, I, B = 0;
  for (C = 0; C <= Gr; C++)
    n.bl_count[C] = 0;
  for (e[n.heap[n.heap_max] * 2 + 1] = 0, c = n.heap_max + 1; c < Id; c++)
    d = n.heap[c], C = e[e[d * 2 + 1] * 2 + 1] + 1, C > D && (C = D, B++), e[d * 2 + 1] = C, !(d > a) && (n.bl_count[C]++, E = 0, d >= l && (E = h[d - l]), I = e[d * 2], n.opt_len += I * (C + E), s && (n.static_len += I * (f[d * 2 + 1] + E)));
  if (B !== 0) {
    do {
      for (C = D - 1; n.bl_count[C] === 0; )
        C--;
      n.bl_count[C]--, n.bl_count[C + 1] += 2, n.bl_count[D]--, B -= 2;
    } while (B > 0);
    for (C = D; C !== 0; C--)
      for (d = n.bl_count[C]; d !== 0; )
        x = n.heap[--c], !(x > a) && (e[x * 2 + 1] !== C && (n.opt_len += (C - e[x * 2 + 1]) * e[x * 2], e[x * 2 + 1] = C), d--);
  }
}
function Ud(n, t, e) {
  var a = new Array(Gr + 1), f = 0, s, h;
  for (s = 1; s <= Gr; s++)
    a[s] = f = f + e[s - 1] << 1;
  for (h = 0; h <= t; h++) {
    var l = n[h * 2 + 1];
    l !== 0 && (n[h * 2] = Md(a[l]++, l));
  }
}
function py() {
  var n, t, e, a, f, s = new Array(Gr + 1);
  for (e = 0, a = 0; a < Gf - 1; a++)
    for (Zf[a] = e, n = 0; n < 1 << bf[a]; n++)
      Du[e++] = a;
  for (Du[e - 1] = a, f = 0, a = 0; a < 16; a++)
    for (Qa[a] = f, n = 0; n < 1 << qa[a]; n++)
      vu[f++] = a;
  for (f >>= 7; a < Fi; a++)
    for (Qa[a] = f << 7, n = 0; n < 1 << qa[a] - 7; n++)
      vu[256 + f++] = a;
  for (t = 0; t <= Gr; t++)
    s[t] = 0;
  for (n = 0; n <= 143; )
    tr[n * 2 + 1] = 8, n++, s[8]++;
  for (; n <= 255; )
    tr[n * 2 + 1] = 9, n++, s[9]++;
  for (; n <= 279; )
    tr[n * 2 + 1] = 7, n++, s[7]++;
  for (; n <= 287; )
    tr[n * 2 + 1] = 8, n++, s[8]++;
  for (Ud(tr, bu + 1, s), n = 0; n < Fi; n++)
    lu[n * 2 + 1] = 5, lu[n * 2] = Md(n, 5);
  Nd = new qo(tr, bf, Ru + 1, bu, Gr), Ld = new qo(lu, qa, 0, Fi, Gr), Od = new qo(new Array(0), ly, 0, Wf, fy);
}
function zd(n) {
  var t;
  for (t = 0; t < bu; t++)
    n.dyn_ltree[t * 2] = 0;
  for (t = 0; t < Fi; t++)
    n.dyn_dtree[t * 2] = 0;
  for (t = 0; t < Wf; t++)
    n.bl_tree[t * 2] = 0;
  n.dyn_ltree[Hf * 2] = 1, n.opt_len = n.static_len = 0, n.last_lit = n.matches = 0;
}
function qd(n) {
  n.bi_valid > 8 ? mu(n, n.bi_buf) : n.bi_valid > 0 && (n.pending_buf[n.pending++] = n.bi_buf), n.bi_buf = 0, n.bi_valid = 0;
}
function gy(n, t, e, a) {
  qd(n), mu(n, e), mu(n, ~e), ny.arraySet(n.pending_buf, n.window, t, e, n.pending), n.pending += e;
}
function Gc(n, t, e, a) {
  var f = t * 2, s = e * 2;
  return n[f] < n[s] || n[f] === n[s] && a[t] <= a[e];
}
function Wo(n, t, e) {
  for (var a = n.heap[e], f = e << 1; f <= n.heap_len && (f < n.heap_len && Gc(t, n.heap[f + 1], n.heap[f], n.depth) && f++, !Gc(t, a, n.heap[f], n.depth)); )
    n.heap[e] = n.heap[f], e = f, f <<= 1;
  n.heap[e] = a;
}
function Wc(n, t, e) {
  var a, f, s = 0, h, l;
  if (n.last_lit !== 0)
    do
      a = n.pending_buf[n.d_buf + s * 2] << 8 | n.pending_buf[n.d_buf + s * 2 + 1], f = n.pending_buf[n.l_buf + s], s++, a === 0 ? Nn(n, f, t) : (h = Du[f], Nn(n, h + Ru + 1, t), l = bf[h], l !== 0 && (f -= Zf[h], Nt(n, f, l)), a--, h = Pd(a), Nn(n, h, e), l = qa[h], l !== 0 && (a -= Qa[h], Nt(n, a, l)));
    while (s < n.last_lit);
  Nn(n, Hf, t);
}
function vf(n, t) {
  var e = t.dyn_tree, a = t.stat_desc.static_tree, f = t.stat_desc.has_stree, s = t.stat_desc.elems, h, l, D = -1, c;
  for (n.heap_len = 0, n.heap_max = Id, h = 0; h < s; h++)
    e[h * 2] !== 0 ? (n.heap[++n.heap_len] = D = h, n.depth[h] = 0) : e[h * 2 + 1] = 0;
  for (; n.heap_len < 2; )
    c = n.heap[++n.heap_len] = D < 2 ? ++D : 0, e[c * 2] = 1, n.depth[c] = 0, n.opt_len--, f && (n.static_len -= a[c * 2 + 1]);
  for (t.max_code = D, h = n.heap_len >> 1; h >= 1; h--)
    Wo(n, e, h);
  c = s;
  do
    h = n.heap[
      1
      /*SMALLEST*/
    ], n.heap[
      1
      /*SMALLEST*/
    ] = n.heap[n.heap_len--], Wo(
      n,
      e,
      1
      /*SMALLEST*/
    ), l = n.heap[
      1
      /*SMALLEST*/
    ], n.heap[--n.heap_max] = h, n.heap[--n.heap_max] = l, e[c * 2] = e[h * 2] + e[l * 2], n.depth[c] = (n.depth[h] >= n.depth[l] ? n.depth[h] : n.depth[l]) + 1, e[h * 2 + 1] = e[l * 2 + 1] = c, n.heap[
      1
      /*SMALLEST*/
    ] = c++, Wo(
      n,
      e,
      1
      /*SMALLEST*/
    );
  while (n.heap_len >= 2);
  n.heap[--n.heap_max] = n.heap[
    1
    /*SMALLEST*/
  ], dy(n, t), Ud(e, D, n.bl_count);
}
function Hc(n, t, e) {
  var a, f = -1, s, h = t[0 * 2 + 1], l = 0, D = 7, c = 4;
  for (h === 0 && (D = 138, c = 3), t[(e + 1) * 2 + 1] = 65535, a = 0; a <= e; a++)
    s = h, h = t[(a + 1) * 2 + 1], !(++l < D && s === h) && (l < c ? n.bl_tree[s * 2] += l : s !== 0 ? (s !== f && n.bl_tree[s * 2]++, n.bl_tree[kd * 2]++) : l <= 10 ? n.bl_tree[Td * 2]++ : n.bl_tree[$d * 2]++, l = 0, f = s, h === 0 ? (D = 138, c = 3) : s === h ? (D = 6, c = 3) : (D = 7, c = 4));
}
function Zc(n, t, e) {
  var a, f = -1, s, h = t[0 * 2 + 1], l = 0, D = 7, c = 4;
  for (h === 0 && (D = 138, c = 3), a = 0; a <= e; a++)
    if (s = h, h = t[(a + 1) * 2 + 1], !(++l < D && s === h)) {
      if (l < c)
        do
          Nn(n, s, n.bl_tree);
        while (--l !== 0);
      else s !== 0 ? (s !== f && (Nn(n, s, n.bl_tree), l--), Nn(n, kd, n.bl_tree), Nt(n, l - 3, 2)) : l <= 10 ? (Nn(n, Td, n.bl_tree), Nt(n, l - 3, 3)) : (Nn(n, $d, n.bl_tree), Nt(n, l - 11, 7));
      l = 0, f = s, h === 0 ? (D = 138, c = 3) : s === h ? (D = 6, c = 3) : (D = 7, c = 4);
    }
}
function _y(n) {
  var t;
  for (Hc(n, n.dyn_ltree, n.l_desc.max_code), Hc(n, n.dyn_dtree, n.d_desc.max_code), vf(n, n.bl_desc), t = Wf - 1; t >= 3 && n.bl_tree[Rd[t] * 2 + 1] === 0; t--)
    ;
  return n.opt_len += 3 * (t + 1) + 5 + 5 + 4, t;
}
function wy(n, t, e, a) {
  var f;
  for (Nt(n, t - 257, 5), Nt(n, e - 1, 5), Nt(n, a - 4, 4), f = 0; f < a; f++)
    Nt(n, n.bl_tree[Rd[f] * 2 + 1], 3);
  Zc(n, n.dyn_ltree, t - 1), Zc(n, n.dyn_dtree, e - 1);
}
function by(n) {
  var t = 4093624447, e;
  for (e = 0; e <= 31; e++, t >>>= 1)
    if (t & 1 && n.dyn_ltree[e * 2] !== 0)
      return zc;
  if (n.dyn_ltree[9 * 2] !== 0 || n.dyn_ltree[10 * 2] !== 0 || n.dyn_ltree[13 * 2] !== 0)
    return qc;
  for (e = 32; e < Ru; e++)
    if (n.dyn_ltree[e * 2] !== 0)
      return qc;
  return zc;
}
var Vc = !1;
function vy(n) {
  Vc || (py(), Vc = !0), n.l_desc = new Go(n.dyn_ltree, Nd), n.d_desc = new Go(n.dyn_dtree, Ld), n.bl_desc = new Go(n.bl_tree, Od), n.bi_buf = 0, n.bi_valid = 0, zd(n);
}
function Gd(n, t, e, a) {
  Nt(n, (uy << 1) + (a ? 1 : 0), 3), gy(n, t, e);
}
function Dy(n) {
  Nt(n, Sd << 1, 3), Nn(n, Hf, tr), cy(n);
}
function my(n, t, e, a) {
  var f, s, h = 0;
  n.level > 0 ? (n.strm.data_type === iy && (n.strm.data_type = by(n)), vf(n, n.l_desc), vf(n, n.d_desc), h = _y(n), f = n.opt_len + 3 + 7 >>> 3, s = n.static_len + 3 + 7 >>> 3, s <= f && (f = s)) : f = s = e + 5, e + 4 <= f && t !== -1 ? Gd(n, t, e, a) : n.strategy === ry || s === f ? (Nt(n, (Sd << 1) + (a ? 1 : 0), 3), Wc(n, tr, lu)) : (Nt(n, (ay << 1) + (a ? 1 : 0), 3), wy(n, n.l_desc.max_code + 1, n.d_desc.max_code + 1, h + 1), Wc(n, n.dyn_ltree, n.dyn_dtree)), zd(n), a && qd(n);
}
function yy(n, t, e) {
  return n.pending_buf[n.d_buf + n.last_lit * 2] = t >>> 8 & 255, n.pending_buf[n.d_buf + n.last_lit * 2 + 1] = t & 255, n.pending_buf[n.l_buf + n.last_lit] = e & 255, n.last_lit++, t === 0 ? n.dyn_ltree[e * 2]++ : (n.matches++, t--, n.dyn_ltree[(Du[e] + Ru + 1) * 2]++, n.dyn_dtree[Pd(t) * 2]++), n.last_lit === n.lit_bufsize - 1;
}
Ni._tr_init = vy;
Ni._tr_stored_block = Gd;
Ni._tr_flush_block = my;
Ni._tr_tally = yy;
Ni._tr_align = Dy;
function Ey(n, t, e, a) {
  for (var f = n & 65535 | 0, s = n >>> 16 & 65535 | 0, h = 0; e !== 0; ) {
    h = e > 2e3 ? 2e3 : e, e -= h;
    do
      f = f + t[a++] | 0, s = s + f | 0;
    while (--h);
    f %= 65521, s %= 65521;
  }
  return f | s << 16 | 0;
}
var Wd = Ey;
function Cy() {
  for (var n, t = [], e = 0; e < 256; e++) {
    n = e;
    for (var a = 0; a < 8; a++)
      n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    t[e] = n;
  }
  return t;
}
var Ay = Cy();
function xy(n, t, e, a) {
  var f = Ay, s = a + e;
  n ^= -1;
  for (var h = a; h < s; h++)
    n = n >>> 8 ^ f[(n ^ t[h]) & 255];
  return n ^ -1;
}
var Hd = xy, Vf = {
  2: "need dictionary",
  /* Z_NEED_DICT       2  */
  1: "stream end",
  /* Z_STREAM_END      1  */
  0: "",
  /* Z_OK              0  */
  "-1": "file error",
  /* Z_ERRNO         (-1) */
  "-2": "stream error",
  /* Z_STREAM_ERROR  (-2) */
  "-3": "data error",
  /* Z_DATA_ERROR    (-3) */
  "-4": "insufficient memory",
  /* Z_MEM_ERROR     (-4) */
  "-5": "buffer error",
  /* Z_BUF_ERROR     (-5) */
  "-6": "incompatible version"
  /* Z_VERSION_ERROR (-6) */
}, Ft = ar, ln = Ni, Zd = Wd, Dr = Hd, Fy = Vf, ei = 0, By = 1, Sy = 3, Ar = 4, Xc = 5, Ln = 0, Kc = 1, hn = -2, Iy = -3, Ho = -5, ky = -1, Ty = 1, Ba = 2, $y = 3, Ry = 4, Ny = 0, Ly = 2, fs = 8, Oy = 9, Py = 15, My = 8, Uy = 29, zy = 256, Df = zy + 1 + Uy, qy = 30, Gy = 19, Wy = 2 * Df + 1, Hy = 15, xe = 3, Er = 258, En = Er + xe + 1, Zy = 32, ls = 42, mf = 69, Ga = 73, Wa = 91, Ha = 103, Wr = 113, su = 666, ot = 1, Nu = 2, Vr = 3, Oi = 4, Vy = 3;
function Cr(n, t) {
  return n.msg = Fy[t], t;
}
function Yc(n) {
  return (n << 1) - (n > 4 ? 9 : 0);
}
function yr(n) {
  for (var t = n.length; --t >= 0; )
    n[t] = 0;
}
function mr(n) {
  var t = n.state, e = t.pending;
  e > n.avail_out && (e = n.avail_out), e !== 0 && (Ft.arraySet(n.output, t.pending_buf, t.pending_out, e, n.next_out), n.next_out += e, t.pending_out += e, n.total_out += e, n.avail_out -= e, t.pending -= e, t.pending === 0 && (t.pending_out = 0));
}
function gt(n, t) {
  ln._tr_flush_block(n, n.block_start >= 0 ? n.block_start : -1, n.strstart - n.block_start, t), n.block_start = n.strstart, mr(n.strm);
}
function Be(n, t) {
  n.pending_buf[n.pending++] = t;
}
function nu(n, t) {
  n.pending_buf[n.pending++] = t >>> 8 & 255, n.pending_buf[n.pending++] = t & 255;
}
function Xy(n, t, e, a) {
  var f = n.avail_in;
  return f > a && (f = a), f === 0 ? 0 : (n.avail_in -= f, Ft.arraySet(t, n.input, n.next_in, f, e), n.state.wrap === 1 ? n.adler = Zd(n.adler, t, f, e) : n.state.wrap === 2 && (n.adler = Dr(n.adler, t, f, e)), n.next_in += f, n.total_in += f, f);
}
function Vd(n, t) {
  var e = n.max_chain_length, a = n.strstart, f, s, h = n.prev_length, l = n.nice_match, D = n.strstart > n.w_size - En ? n.strstart - (n.w_size - En) : 0, c = n.window, d = n.w_mask, x = n.prev, C = n.strstart + Er, E = c[a + h - 1], I = c[a + h];
  n.prev_length >= n.good_match && (e >>= 2), l > n.lookahead && (l = n.lookahead);
  do
    if (f = t, !(c[f + h] !== I || c[f + h - 1] !== E || c[f] !== c[a] || c[++f] !== c[a + 1])) {
      a += 2, f++;
      do
        ;
      while (c[++a] === c[++f] && c[++a] === c[++f] && c[++a] === c[++f] && c[++a] === c[++f] && c[++a] === c[++f] && c[++a] === c[++f] && c[++a] === c[++f] && c[++a] === c[++f] && a < C);
      if (s = Er - (C - a), a = C - Er, s > h) {
        if (n.match_start = t, h = s, s >= l)
          break;
        E = c[a + h - 1], I = c[a + h];
      }
    }
  while ((t = x[t & d]) > D && --e !== 0);
  return h <= n.lookahead ? h : n.lookahead;
}
function Xr(n) {
  var t = n.w_size, e, a, f, s, h;
  do {
    if (s = n.window_size - n.lookahead - n.strstart, n.strstart >= t + (t - En)) {
      Ft.arraySet(n.window, n.window, t, t, 0), n.match_start -= t, n.strstart -= t, n.block_start -= t, a = n.hash_size, e = a;
      do
        f = n.head[--e], n.head[e] = f >= t ? f - t : 0;
      while (--a);
      a = t, e = a;
      do
        f = n.prev[--e], n.prev[e] = f >= t ? f - t : 0;
      while (--a);
      s += t;
    }
    if (n.strm.avail_in === 0)
      break;
    if (a = Xy(n.strm, n.window, n.strstart + n.lookahead, s), n.lookahead += a, n.lookahead + n.insert >= xe)
      for (h = n.strstart - n.insert, n.ins_h = n.window[h], n.ins_h = (n.ins_h << n.hash_shift ^ n.window[h + 1]) & n.hash_mask; n.insert && (n.ins_h = (n.ins_h << n.hash_shift ^ n.window[h + xe - 1]) & n.hash_mask, n.prev[h & n.w_mask] = n.head[n.ins_h], n.head[n.ins_h] = h, h++, n.insert--, !(n.lookahead + n.insert < xe)); )
        ;
  } while (n.lookahead < En && n.strm.avail_in !== 0);
}
function Ky(n, t) {
  var e = 65535;
  for (e > n.pending_buf_size - 5 && (e = n.pending_buf_size - 5); ; ) {
    if (n.lookahead <= 1) {
      if (Xr(n), n.lookahead === 0 && t === ei)
        return ot;
      if (n.lookahead === 0)
        break;
    }
    n.strstart += n.lookahead, n.lookahead = 0;
    var a = n.block_start + e;
    if ((n.strstart === 0 || n.strstart >= a) && (n.lookahead = n.strstart - a, n.strstart = a, gt(n, !1), n.strm.avail_out === 0) || n.strstart - n.block_start >= n.w_size - En && (gt(n, !1), n.strm.avail_out === 0))
      return ot;
  }
  return n.insert = 0, t === Ar ? (gt(n, !0), n.strm.avail_out === 0 ? Vr : Oi) : (n.strstart > n.block_start && (gt(n, !1), n.strm.avail_out === 0), ot);
}
function Zo(n, t) {
  for (var e, a; ; ) {
    if (n.lookahead < En) {
      if (Xr(n), n.lookahead < En && t === ei)
        return ot;
      if (n.lookahead === 0)
        break;
    }
    if (e = 0, n.lookahead >= xe && (n.ins_h = (n.ins_h << n.hash_shift ^ n.window[n.strstart + xe - 1]) & n.hash_mask, e = n.prev[n.strstart & n.w_mask] = n.head[n.ins_h], n.head[n.ins_h] = n.strstart), e !== 0 && n.strstart - e <= n.w_size - En && (n.match_length = Vd(n, e)), n.match_length >= xe)
      if (a = ln._tr_tally(n, n.strstart - n.match_start, n.match_length - xe), n.lookahead -= n.match_length, n.match_length <= n.max_lazy_match && n.lookahead >= xe) {
        n.match_length--;
        do
          n.strstart++, n.ins_h = (n.ins_h << n.hash_shift ^ n.window[n.strstart + xe - 1]) & n.hash_mask, e = n.prev[n.strstart & n.w_mask] = n.head[n.ins_h], n.head[n.ins_h] = n.strstart;
        while (--n.match_length !== 0);
        n.strstart++;
      } else
        n.strstart += n.match_length, n.match_length = 0, n.ins_h = n.window[n.strstart], n.ins_h = (n.ins_h << n.hash_shift ^ n.window[n.strstart + 1]) & n.hash_mask;
    else
      a = ln._tr_tally(n, 0, n.window[n.strstart]), n.lookahead--, n.strstart++;
    if (a && (gt(n, !1), n.strm.avail_out === 0))
      return ot;
  }
  return n.insert = n.strstart < xe - 1 ? n.strstart : xe - 1, t === Ar ? (gt(n, !0), n.strm.avail_out === 0 ? Vr : Oi) : n.last_lit && (gt(n, !1), n.strm.avail_out === 0) ? ot : Nu;
}
function vi(n, t) {
  for (var e, a, f; ; ) {
    if (n.lookahead < En) {
      if (Xr(n), n.lookahead < En && t === ei)
        return ot;
      if (n.lookahead === 0)
        break;
    }
    if (e = 0, n.lookahead >= xe && (n.ins_h = (n.ins_h << n.hash_shift ^ n.window[n.strstart + xe - 1]) & n.hash_mask, e = n.prev[n.strstart & n.w_mask] = n.head[n.ins_h], n.head[n.ins_h] = n.strstart), n.prev_length = n.match_length, n.prev_match = n.match_start, n.match_length = xe - 1, e !== 0 && n.prev_length < n.max_lazy_match && n.strstart - e <= n.w_size - En && (n.match_length = Vd(n, e), n.match_length <= 5 && (n.strategy === Ty || n.match_length === xe && n.strstart - n.match_start > 4096) && (n.match_length = xe - 1)), n.prev_length >= xe && n.match_length <= n.prev_length) {
      f = n.strstart + n.lookahead - xe, a = ln._tr_tally(n, n.strstart - 1 - n.prev_match, n.prev_length - xe), n.lookahead -= n.prev_length - 1, n.prev_length -= 2;
      do
        ++n.strstart <= f && (n.ins_h = (n.ins_h << n.hash_shift ^ n.window[n.strstart + xe - 1]) & n.hash_mask, e = n.prev[n.strstart & n.w_mask] = n.head[n.ins_h], n.head[n.ins_h] = n.strstart);
      while (--n.prev_length !== 0);
      if (n.match_available = 0, n.match_length = xe - 1, n.strstart++, a && (gt(n, !1), n.strm.avail_out === 0))
        return ot;
    } else if (n.match_available) {
      if (a = ln._tr_tally(n, 0, n.window[n.strstart - 1]), a && gt(n, !1), n.strstart++, n.lookahead--, n.strm.avail_out === 0)
        return ot;
    } else
      n.match_available = 1, n.strstart++, n.lookahead--;
  }
  return n.match_available && (a = ln._tr_tally(n, 0, n.window[n.strstart - 1]), n.match_available = 0), n.insert = n.strstart < xe - 1 ? n.strstart : xe - 1, t === Ar ? (gt(n, !0), n.strm.avail_out === 0 ? Vr : Oi) : n.last_lit && (gt(n, !1), n.strm.avail_out === 0) ? ot : Nu;
}
function Yy(n, t) {
  for (var e, a, f, s, h = n.window; ; ) {
    if (n.lookahead <= Er) {
      if (Xr(n), n.lookahead <= Er && t === ei)
        return ot;
      if (n.lookahead === 0)
        break;
    }
    if (n.match_length = 0, n.lookahead >= xe && n.strstart > 0 && (f = n.strstart - 1, a = h[f], a === h[++f] && a === h[++f] && a === h[++f])) {
      s = n.strstart + Er;
      do
        ;
      while (a === h[++f] && a === h[++f] && a === h[++f] && a === h[++f] && a === h[++f] && a === h[++f] && a === h[++f] && a === h[++f] && f < s);
      n.match_length = Er - (s - f), n.match_length > n.lookahead && (n.match_length = n.lookahead);
    }
    if (n.match_length >= xe ? (e = ln._tr_tally(n, 1, n.match_length - xe), n.lookahead -= n.match_length, n.strstart += n.match_length, n.match_length = 0) : (e = ln._tr_tally(n, 0, n.window[n.strstart]), n.lookahead--, n.strstart++), e && (gt(n, !1), n.strm.avail_out === 0))
      return ot;
  }
  return n.insert = 0, t === Ar ? (gt(n, !0), n.strm.avail_out === 0 ? Vr : Oi) : n.last_lit && (gt(n, !1), n.strm.avail_out === 0) ? ot : Nu;
}
function Qy(n, t) {
  for (var e; ; ) {
    if (n.lookahead === 0 && (Xr(n), n.lookahead === 0)) {
      if (t === ei)
        return ot;
      break;
    }
    if (n.match_length = 0, e = ln._tr_tally(n, 0, n.window[n.strstart]), n.lookahead--, n.strstart++, e && (gt(n, !1), n.strm.avail_out === 0))
      return ot;
  }
  return n.insert = 0, t === Ar ? (gt(n, !0), n.strm.avail_out === 0 ? Vr : Oi) : n.last_lit && (gt(n, !1), n.strm.avail_out === 0) ? ot : Nu;
}
function kn(n, t, e, a, f) {
  this.good_length = n, this.max_lazy = t, this.nice_length = e, this.max_chain = a, this.func = f;
}
var Ai;
Ai = [
  /*      good lazy nice chain */
  new kn(0, 0, 0, 0, Ky),
  /* 0 store only */
  new kn(4, 4, 8, 4, Zo),
  /* 1 max speed, no lazy matches */
  new kn(4, 5, 16, 8, Zo),
  /* 2 */
  new kn(4, 6, 32, 32, Zo),
  /* 3 */
  new kn(4, 4, 16, 16, vi),
  /* 4 lazy matches */
  new kn(8, 16, 32, 32, vi),
  /* 5 */
  new kn(8, 16, 128, 128, vi),
  /* 6 */
  new kn(8, 32, 128, 256, vi),
  /* 7 */
  new kn(32, 128, 258, 1024, vi),
  /* 8 */
  new kn(32, 258, 258, 4096, vi)
  /* 9 max compression */
];
function Jy(n) {
  n.window_size = 2 * n.w_size, yr(n.head), n.max_lazy_match = Ai[n.level].max_lazy, n.good_match = Ai[n.level].good_length, n.nice_match = Ai[n.level].nice_length, n.max_chain_length = Ai[n.level].max_chain, n.strstart = 0, n.block_start = 0, n.lookahead = 0, n.insert = 0, n.match_length = n.prev_length = xe - 1, n.match_available = 0, n.ins_h = 0;
}
function jy() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = fs, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Ft.Buf16(Wy * 2), this.dyn_dtree = new Ft.Buf16((2 * qy + 1) * 2), this.bl_tree = new Ft.Buf16((2 * Gy + 1) * 2), yr(this.dyn_ltree), yr(this.dyn_dtree), yr(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Ft.Buf16(Hy + 1), this.heap = new Ft.Buf16(2 * Df + 1), yr(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Ft.Buf16(2 * Df + 1), yr(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
function Xd(n) {
  var t;
  return !n || !n.state ? Cr(n, hn) : (n.total_in = n.total_out = 0, n.data_type = Ly, t = n.state, t.pending = 0, t.pending_out = 0, t.wrap < 0 && (t.wrap = -t.wrap), t.status = t.wrap ? ls : Wr, n.adler = t.wrap === 2 ? 0 : 1, t.last_flush = ei, ln._tr_init(t), Ln);
}
function Kd(n) {
  var t = Xd(n);
  return t === Ln && Jy(n.state), t;
}
function eE(n, t) {
  return !n || !n.state || n.state.wrap !== 2 ? hn : (n.state.gzhead = t, Ln);
}
function Yd(n, t, e, a, f, s) {
  if (!n)
    return hn;
  var h = 1;
  if (t === ky && (t = 6), a < 0 ? (h = 0, a = -a) : a > 15 && (h = 2, a -= 16), f < 1 || f > Oy || e !== fs || a < 8 || a > 15 || t < 0 || t > 9 || s < 0 || s > Ry)
    return Cr(n, hn);
  a === 8 && (a = 9);
  var l = new jy();
  return n.state = l, l.strm = n, l.wrap = h, l.gzhead = null, l.w_bits = a, l.w_size = 1 << l.w_bits, l.w_mask = l.w_size - 1, l.hash_bits = f + 7, l.hash_size = 1 << l.hash_bits, l.hash_mask = l.hash_size - 1, l.hash_shift = ~~((l.hash_bits + xe - 1) / xe), l.window = new Ft.Buf8(l.w_size * 2), l.head = new Ft.Buf16(l.hash_size), l.prev = new Ft.Buf16(l.w_size), l.lit_bufsize = 1 << f + 6, l.pending_buf_size = l.lit_bufsize * 4, l.pending_buf = new Ft.Buf8(l.pending_buf_size), l.d_buf = 1 * l.lit_bufsize, l.l_buf = 3 * l.lit_bufsize, l.level = t, l.strategy = s, l.method = e, Kd(n);
}
function tE(n, t) {
  return Yd(n, t, fs, Py, My, Ny);
}
function nE(n, t) {
  var e, a, f, s;
  if (!n || !n.state || t > Xc || t < 0)
    return n ? Cr(n, hn) : hn;
  if (a = n.state, !n.output || !n.input && n.avail_in !== 0 || a.status === su && t !== Ar)
    return Cr(n, n.avail_out === 0 ? Ho : hn);
  if (a.strm = n, e = a.last_flush, a.last_flush = t, a.status === ls)
    if (a.wrap === 2)
      n.adler = 0, Be(a, 31), Be(a, 139), Be(a, 8), a.gzhead ? (Be(
        a,
        (a.gzhead.text ? 1 : 0) + (a.gzhead.hcrc ? 2 : 0) + (a.gzhead.extra ? 4 : 0) + (a.gzhead.name ? 8 : 0) + (a.gzhead.comment ? 16 : 0)
      ), Be(a, a.gzhead.time & 255), Be(a, a.gzhead.time >> 8 & 255), Be(a, a.gzhead.time >> 16 & 255), Be(a, a.gzhead.time >> 24 & 255), Be(a, a.level === 9 ? 2 : a.strategy >= Ba || a.level < 2 ? 4 : 0), Be(a, a.gzhead.os & 255), a.gzhead.extra && a.gzhead.extra.length && (Be(a, a.gzhead.extra.length & 255), Be(a, a.gzhead.extra.length >> 8 & 255)), a.gzhead.hcrc && (n.adler = Dr(n.adler, a.pending_buf, a.pending, 0)), a.gzindex = 0, a.status = mf) : (Be(a, 0), Be(a, 0), Be(a, 0), Be(a, 0), Be(a, 0), Be(a, a.level === 9 ? 2 : a.strategy >= Ba || a.level < 2 ? 4 : 0), Be(a, Vy), a.status = Wr);
    else {
      var h = fs + (a.w_bits - 8 << 4) << 8, l = -1;
      a.strategy >= Ba || a.level < 2 ? l = 0 : a.level < 6 ? l = 1 : a.level === 6 ? l = 2 : l = 3, h |= l << 6, a.strstart !== 0 && (h |= Zy), h += 31 - h % 31, a.status = Wr, nu(a, h), a.strstart !== 0 && (nu(a, n.adler >>> 16), nu(a, n.adler & 65535)), n.adler = 1;
    }
  if (a.status === mf)
    if (a.gzhead.extra) {
      for (f = a.pending; a.gzindex < (a.gzhead.extra.length & 65535) && !(a.pending === a.pending_buf_size && (a.gzhead.hcrc && a.pending > f && (n.adler = Dr(n.adler, a.pending_buf, a.pending - f, f)), mr(n), f = a.pending, a.pending === a.pending_buf_size)); )
        Be(a, a.gzhead.extra[a.gzindex] & 255), a.gzindex++;
      a.gzhead.hcrc && a.pending > f && (n.adler = Dr(n.adler, a.pending_buf, a.pending - f, f)), a.gzindex === a.gzhead.extra.length && (a.gzindex = 0, a.status = Ga);
    } else
      a.status = Ga;
  if (a.status === Ga)
    if (a.gzhead.name) {
      f = a.pending;
      do {
        if (a.pending === a.pending_buf_size && (a.gzhead.hcrc && a.pending > f && (n.adler = Dr(n.adler, a.pending_buf, a.pending - f, f)), mr(n), f = a.pending, a.pending === a.pending_buf_size)) {
          s = 1;
          break;
        }
        a.gzindex < a.gzhead.name.length ? s = a.gzhead.name.charCodeAt(a.gzindex++) & 255 : s = 0, Be(a, s);
      } while (s !== 0);
      a.gzhead.hcrc && a.pending > f && (n.adler = Dr(n.adler, a.pending_buf, a.pending - f, f)), s === 0 && (a.gzindex = 0, a.status = Wa);
    } else
      a.status = Wa;
  if (a.status === Wa)
    if (a.gzhead.comment) {
      f = a.pending;
      do {
        if (a.pending === a.pending_buf_size && (a.gzhead.hcrc && a.pending > f && (n.adler = Dr(n.adler, a.pending_buf, a.pending - f, f)), mr(n), f = a.pending, a.pending === a.pending_buf_size)) {
          s = 1;
          break;
        }
        a.gzindex < a.gzhead.comment.length ? s = a.gzhead.comment.charCodeAt(a.gzindex++) & 255 : s = 0, Be(a, s);
      } while (s !== 0);
      a.gzhead.hcrc && a.pending > f && (n.adler = Dr(n.adler, a.pending_buf, a.pending - f, f)), s === 0 && (a.status = Ha);
    } else
      a.status = Ha;
  if (a.status === Ha && (a.gzhead.hcrc ? (a.pending + 2 > a.pending_buf_size && mr(n), a.pending + 2 <= a.pending_buf_size && (Be(a, n.adler & 255), Be(a, n.adler >> 8 & 255), n.adler = 0, a.status = Wr)) : a.status = Wr), a.pending !== 0) {
    if (mr(n), n.avail_out === 0)
      return a.last_flush = -1, Ln;
  } else if (n.avail_in === 0 && Yc(t) <= Yc(e) && t !== Ar)
    return Cr(n, Ho);
  if (a.status === su && n.avail_in !== 0)
    return Cr(n, Ho);
  if (n.avail_in !== 0 || a.lookahead !== 0 || t !== ei && a.status !== su) {
    var D = a.strategy === Ba ? Qy(a, t) : a.strategy === $y ? Yy(a, t) : Ai[a.level].func(a, t);
    if ((D === Vr || D === Oi) && (a.status = su), D === ot || D === Vr)
      return n.avail_out === 0 && (a.last_flush = -1), Ln;
    if (D === Nu && (t === By ? ln._tr_align(a) : t !== Xc && (ln._tr_stored_block(a, 0, 0, !1), t === Sy && (yr(a.head), a.lookahead === 0 && (a.strstart = 0, a.block_start = 0, a.insert = 0))), mr(n), n.avail_out === 0))
      return a.last_flush = -1, Ln;
  }
  return t !== Ar ? Ln : a.wrap <= 0 ? Kc : (a.wrap === 2 ? (Be(a, n.adler & 255), Be(a, n.adler >> 8 & 255), Be(a, n.adler >> 16 & 255), Be(a, n.adler >> 24 & 255), Be(a, n.total_in & 255), Be(a, n.total_in >> 8 & 255), Be(a, n.total_in >> 16 & 255), Be(a, n.total_in >> 24 & 255)) : (nu(a, n.adler >>> 16), nu(a, n.adler & 65535)), mr(n), a.wrap > 0 && (a.wrap = -a.wrap), a.pending !== 0 ? Ln : Kc);
}
function rE(n) {
  var t;
  return !n || !n.state ? hn : (t = n.state.status, t !== ls && t !== mf && t !== Ga && t !== Wa && t !== Ha && t !== Wr && t !== su ? Cr(n, hn) : (n.state = null, t === Wr ? Cr(n, Iy) : Ln));
}
function iE(n, t) {
  var e = t.length, a, f, s, h, l, D, c, d;
  if (!n || !n.state || (a = n.state, h = a.wrap, h === 2 || h === 1 && a.status !== ls || a.lookahead))
    return hn;
  for (h === 1 && (n.adler = Zd(n.adler, t, e, 0)), a.wrap = 0, e >= a.w_size && (h === 0 && (yr(a.head), a.strstart = 0, a.block_start = 0, a.insert = 0), d = new Ft.Buf8(a.w_size), Ft.arraySet(d, t, e - a.w_size, a.w_size, 0), t = d, e = a.w_size), l = n.avail_in, D = n.next_in, c = n.input, n.avail_in = e, n.next_in = 0, n.input = t, Xr(a); a.lookahead >= xe; ) {
    f = a.strstart, s = a.lookahead - (xe - 1);
    do
      a.ins_h = (a.ins_h << a.hash_shift ^ a.window[f + xe - 1]) & a.hash_mask, a.prev[f & a.w_mask] = a.head[a.ins_h], a.head[a.ins_h] = f, f++;
    while (--s);
    a.strstart = f, a.lookahead = xe - 1, Xr(a);
  }
  return a.strstart += a.lookahead, a.block_start = a.strstart, a.insert = a.lookahead, a.lookahead = 0, a.match_length = a.prev_length = xe - 1, a.match_available = 0, n.next_in = D, n.input = c, n.avail_in = l, a.wrap = h, Ln;
}
zn.deflateInit = tE;
zn.deflateInit2 = Yd;
zn.deflateReset = Kd;
zn.deflateResetKeep = Xd;
zn.deflateSetHeader = eE;
zn.deflate = nE;
zn.deflateEnd = rE;
zn.deflateSetDictionary = iE;
zn.deflateInfo = "pako deflate (from Nodeca project)";
var ti = {}, hs = ar, Qd = !0, Jd = !0;
try {
  String.fromCharCode.apply(null, [0]);
} catch {
  Qd = !1;
}
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  Jd = !1;
}
var yu = new hs.Buf8(256);
for (var vr = 0; vr < 256; vr++)
  yu[vr] = vr >= 252 ? 6 : vr >= 248 ? 5 : vr >= 240 ? 4 : vr >= 224 ? 3 : vr >= 192 ? 2 : 1;
yu[254] = yu[254] = 1;
ti.string2buf = function(n) {
  var t, e, a, f, s, h = n.length, l = 0;
  for (f = 0; f < h; f++)
    e = n.charCodeAt(f), (e & 64512) === 55296 && f + 1 < h && (a = n.charCodeAt(f + 1), (a & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (a - 56320), f++)), l += e < 128 ? 1 : e < 2048 ? 2 : e < 65536 ? 3 : 4;
  for (t = new hs.Buf8(l), s = 0, f = 0; s < l; f++)
    e = n.charCodeAt(f), (e & 64512) === 55296 && f + 1 < h && (a = n.charCodeAt(f + 1), (a & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (a - 56320), f++)), e < 128 ? t[s++] = e : e < 2048 ? (t[s++] = 192 | e >>> 6, t[s++] = 128 | e & 63) : e < 65536 ? (t[s++] = 224 | e >>> 12, t[s++] = 128 | e >>> 6 & 63, t[s++] = 128 | e & 63) : (t[s++] = 240 | e >>> 18, t[s++] = 128 | e >>> 12 & 63, t[s++] = 128 | e >>> 6 & 63, t[s++] = 128 | e & 63);
  return t;
};
function jd(n, t) {
  if (t < 65534 && (n.subarray && Jd || !n.subarray && Qd))
    return String.fromCharCode.apply(null, hs.shrinkBuf(n, t));
  for (var e = "", a = 0; a < t; a++)
    e += String.fromCharCode(n[a]);
  return e;
}
ti.buf2binstring = function(n) {
  return jd(n, n.length);
};
ti.binstring2buf = function(n) {
  for (var t = new hs.Buf8(n.length), e = 0, a = t.length; e < a; e++)
    t[e] = n.charCodeAt(e);
  return t;
};
ti.buf2string = function(n, t) {
  var e, a, f, s, h = t || n.length, l = new Array(h * 2);
  for (a = 0, e = 0; e < h; ) {
    if (f = n[e++], f < 128) {
      l[a++] = f;
      continue;
    }
    if (s = yu[f], s > 4) {
      l[a++] = 65533, e += s - 1;
      continue;
    }
    for (f &= s === 2 ? 31 : s === 3 ? 15 : 7; s > 1 && e < h; )
      f = f << 6 | n[e++] & 63, s--;
    if (s > 1) {
      l[a++] = 65533;
      continue;
    }
    f < 65536 ? l[a++] = f : (f -= 65536, l[a++] = 55296 | f >> 10 & 1023, l[a++] = 56320 | f & 1023);
  }
  return jd(l, a);
};
ti.utf8border = function(n, t) {
  var e;
  for (t = t || n.length, t > n.length && (t = n.length), e = t - 1; e >= 0 && (n[e] & 192) === 128; )
    e--;
  return e < 0 || e === 0 ? t : e + yu[n[e]] > t ? e : t;
};
function uE() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var e1 = uE, hu = zn, cu = ar, yf = ti, Ef = Vf, aE = e1, t1 = Object.prototype.toString, sE = 0, Vo = 4, Bi = 0, Qc = 1, Jc = 2, oE = -1, fE = 0, lE = 8;
function Kr(n) {
  if (!(this instanceof Kr)) return new Kr(n);
  this.options = cu.assign({
    level: oE,
    method: lE,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: fE,
    to: ""
  }, n || {});
  var t = this.options;
  t.raw && t.windowBits > 0 ? t.windowBits = -t.windowBits : t.gzip && t.windowBits > 0 && t.windowBits < 16 && (t.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new aE(), this.strm.avail_out = 0;
  var e = hu.deflateInit2(
    this.strm,
    t.level,
    t.method,
    t.windowBits,
    t.memLevel,
    t.strategy
  );
  if (e !== Bi)
    throw new Error(Ef[e]);
  if (t.header && hu.deflateSetHeader(this.strm, t.header), t.dictionary) {
    var a;
    if (typeof t.dictionary == "string" ? a = yf.string2buf(t.dictionary) : t1.call(t.dictionary) === "[object ArrayBuffer]" ? a = new Uint8Array(t.dictionary) : a = t.dictionary, e = hu.deflateSetDictionary(this.strm, a), e !== Bi)
      throw new Error(Ef[e]);
    this._dict_set = !0;
  }
}
Kr.prototype.push = function(n, t) {
  var e = this.strm, a = this.options.chunkSize, f, s;
  if (this.ended)
    return !1;
  s = t === ~~t ? t : t === !0 ? Vo : sE, typeof n == "string" ? e.input = yf.string2buf(n) : t1.call(n) === "[object ArrayBuffer]" ? e.input = new Uint8Array(n) : e.input = n, e.next_in = 0, e.avail_in = e.input.length;
  do {
    if (e.avail_out === 0 && (e.output = new cu.Buf8(a), e.next_out = 0, e.avail_out = a), f = hu.deflate(e, s), f !== Qc && f !== Bi)
      return this.onEnd(f), this.ended = !0, !1;
    (e.avail_out === 0 || e.avail_in === 0 && (s === Vo || s === Jc)) && (this.options.to === "string" ? this.onData(yf.buf2binstring(cu.shrinkBuf(e.output, e.next_out))) : this.onData(cu.shrinkBuf(e.output, e.next_out)));
  } while ((e.avail_in > 0 || e.avail_out === 0) && f !== Qc);
  return s === Vo ? (f = hu.deflateEnd(this.strm), this.onEnd(f), this.ended = !0, f === Bi) : (s === Jc && (this.onEnd(Bi), e.avail_out = 0), !0);
};
Kr.prototype.onData = function(n) {
  this.chunks.push(n);
};
Kr.prototype.onEnd = function(n) {
  n === Bi && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = cu.flattenChunks(this.chunks)), this.chunks = [], this.err = n, this.msg = this.strm.msg;
};
function Xf(n, t) {
  var e = new Kr(t);
  if (e.push(n, !0), e.err)
    throw e.msg || Ef[e.err];
  return e.result;
}
function hE(n, t) {
  return t = t || {}, t.raw = !0, Xf(n, t);
}
function cE(n, t) {
  return t = t || {}, t.gzip = !0, Xf(n, t);
}
$u.Deflate = Kr;
$u.deflate = Xf;
$u.deflateRaw = hE;
$u.gzip = cE;
var Lu = {}, Cn = {}, Sa = 30, dE = 12, pE = function(t, e) {
  var a, f, s, h, l, D, c, d, x, C, E, I, B, M, T, G, P, $, L, Q, z, Z, J, ee, K;
  a = t.state, f = t.next_in, ee = t.input, s = f + (t.avail_in - 5), h = t.next_out, K = t.output, l = h - (e - t.avail_out), D = h + (t.avail_out - 257), c = a.dmax, d = a.wsize, x = a.whave, C = a.wnext, E = a.window, I = a.hold, B = a.bits, M = a.lencode, T = a.distcode, G = (1 << a.lenbits) - 1, P = (1 << a.distbits) - 1;
  e:
    do {
      B < 15 && (I += ee[f++] << B, B += 8, I += ee[f++] << B, B += 8), $ = M[I & G];
      t:
        for (; ; ) {
          if (L = $ >>> 24, I >>>= L, B -= L, L = $ >>> 16 & 255, L === 0)
            K[h++] = $ & 65535;
          else if (L & 16) {
            Q = $ & 65535, L &= 15, L && (B < L && (I += ee[f++] << B, B += 8), Q += I & (1 << L) - 1, I >>>= L, B -= L), B < 15 && (I += ee[f++] << B, B += 8, I += ee[f++] << B, B += 8), $ = T[I & P];
            n:
              for (; ; ) {
                if (L = $ >>> 24, I >>>= L, B -= L, L = $ >>> 16 & 255, L & 16) {
                  if (z = $ & 65535, L &= 15, B < L && (I += ee[f++] << B, B += 8, B < L && (I += ee[f++] << B, B += 8)), z += I & (1 << L) - 1, z > c) {
                    t.msg = "invalid distance too far back", a.mode = Sa;
                    break e;
                  }
                  if (I >>>= L, B -= L, L = h - l, z > L) {
                    if (L = z - L, L > x && a.sane) {
                      t.msg = "invalid distance too far back", a.mode = Sa;
                      break e;
                    }
                    if (Z = 0, J = E, C === 0) {
                      if (Z += d - L, L < Q) {
                        Q -= L;
                        do
                          K[h++] = E[Z++];
                        while (--L);
                        Z = h - z, J = K;
                      }
                    } else if (C < L) {
                      if (Z += d + C - L, L -= C, L < Q) {
                        Q -= L;
                        do
                          K[h++] = E[Z++];
                        while (--L);
                        if (Z = 0, C < Q) {
                          L = C, Q -= L;
                          do
                            K[h++] = E[Z++];
                          while (--L);
                          Z = h - z, J = K;
                        }
                      }
                    } else if (Z += C - L, L < Q) {
                      Q -= L;
                      do
                        K[h++] = E[Z++];
                      while (--L);
                      Z = h - z, J = K;
                    }
                    for (; Q > 2; )
                      K[h++] = J[Z++], K[h++] = J[Z++], K[h++] = J[Z++], Q -= 3;
                    Q && (K[h++] = J[Z++], Q > 1 && (K[h++] = J[Z++]));
                  } else {
                    Z = h - z;
                    do
                      K[h++] = K[Z++], K[h++] = K[Z++], K[h++] = K[Z++], Q -= 3;
                    while (Q > 2);
                    Q && (K[h++] = K[Z++], Q > 1 && (K[h++] = K[Z++]));
                  }
                } else if (L & 64) {
                  t.msg = "invalid distance code", a.mode = Sa;
                  break e;
                } else {
                  $ = T[($ & 65535) + (I & (1 << L) - 1)];
                  continue n;
                }
                break;
              }
          } else if (L & 64)
            if (L & 32) {
              a.mode = dE;
              break e;
            } else {
              t.msg = "invalid literal/length code", a.mode = Sa;
              break e;
            }
          else {
            $ = M[($ & 65535) + (I & (1 << L) - 1)];
            continue t;
          }
          break;
        }
    } while (f < s && h < D);
  Q = B >> 3, f -= Q, B -= Q << 3, I &= (1 << B) - 1, t.next_in = f, t.next_out = h, t.avail_in = f < s ? 5 + (s - f) : 5 - (f - s), t.avail_out = h < D ? 257 + (D - h) : 257 - (h - D), a.hold = I, a.bits = B;
}, jc = ar, Di = 15, e0 = 852, t0 = 592, n0 = 0, Xo = 1, r0 = 2, gE = [
  /* Length codes 257..285 base */
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
], _E = [
  /* Length codes 257..285 extra */
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  72,
  78
], wE = [
  /* Distance codes 0..29 base */
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
], bE = [
  /* Distance codes 0..29 extra */
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
], vE = function(t, e, a, f, s, h, l, D) {
  var c = D.bits, d = 0, x = 0, C = 0, E = 0, I = 0, B = 0, M = 0, T = 0, G = 0, P = 0, $, L, Q, z, Z, J = null, ee = 0, K, ie = new jc.Buf16(Di + 1), Ce = new jc.Buf16(Di + 1), be = null, Pe = 0, Ne, ve, Fe;
  for (d = 0; d <= Di; d++)
    ie[d] = 0;
  for (x = 0; x < f; x++)
    ie[e[a + x]]++;
  for (I = c, E = Di; E >= 1 && ie[E] === 0; E--)
    ;
  if (I > E && (I = E), E === 0)
    return s[h++] = 1 << 24 | 64 << 16 | 0, s[h++] = 1 << 24 | 64 << 16 | 0, D.bits = 1, 0;
  for (C = 1; C < E && ie[C] === 0; C++)
    ;
  for (I < C && (I = C), T = 1, d = 1; d <= Di; d++)
    if (T <<= 1, T -= ie[d], T < 0)
      return -1;
  if (T > 0 && (t === n0 || E !== 1))
    return -1;
  for (Ce[1] = 0, d = 1; d < Di; d++)
    Ce[d + 1] = Ce[d] + ie[d];
  for (x = 0; x < f; x++)
    e[a + x] !== 0 && (l[Ce[e[a + x]]++] = x);
  if (t === n0 ? (J = be = l, K = 19) : t === Xo ? (J = gE, ee -= 257, be = _E, Pe -= 257, K = 256) : (J = wE, be = bE, K = -1), P = 0, x = 0, d = C, Z = h, B = I, M = 0, Q = -1, G = 1 << I, z = G - 1, t === Xo && G > e0 || t === r0 && G > t0)
    return 1;
  for (; ; ) {
    Ne = d - M, l[x] < K ? (ve = 0, Fe = l[x]) : l[x] > K ? (ve = be[Pe + l[x]], Fe = J[ee + l[x]]) : (ve = 96, Fe = 0), $ = 1 << d - M, L = 1 << B, C = L;
    do
      L -= $, s[Z + (P >> M) + L] = Ne << 24 | ve << 16 | Fe | 0;
    while (L !== 0);
    for ($ = 1 << d - 1; P & $; )
      $ >>= 1;
    if ($ !== 0 ? (P &= $ - 1, P += $) : P = 0, x++, --ie[d] === 0) {
      if (d === E)
        break;
      d = e[a + l[x]];
    }
    if (d > I && (P & z) !== Q) {
      for (M === 0 && (M = I), Z += C, B = d - M, T = 1 << B; B + M < E && (T -= ie[B + M], !(T <= 0)); )
        B++, T <<= 1;
      if (G += 1 << B, t === Xo && G > e0 || t === r0 && G > t0)
        return 1;
      Q = P & z, s[Q] = I << 24 | B << 16 | Z - h | 0;
    }
  }
  return P !== 0 && (s[Z + P] = d - M << 24 | 64 << 16 | 0), D.bits = I, 0;
}, Zt = ar, Cf = Wd, Tn = Hd, DE = pE, du = vE, mE = 0, n1 = 1, r1 = 2, i0 = 4, yE = 5, Ia = 6, Yr = 0, EE = 1, CE = 2, cn = -2, i1 = -3, u1 = -4, AE = -5, u0 = 8, a1 = 1, a0 = 2, s0 = 3, o0 = 4, f0 = 5, l0 = 6, h0 = 7, c0 = 8, d0 = 9, p0 = 10, Ja = 11, Jn = 12, Ko = 13, g0 = 14, Yo = 15, _0 = 16, w0 = 17, b0 = 18, v0 = 19, ka = 20, Ta = 21, D0 = 22, m0 = 23, y0 = 24, E0 = 25, C0 = 26, Qo = 27, A0 = 28, x0 = 29, Ke = 30, s1 = 31, xE = 32, FE = 852, BE = 592, SE = 15, IE = SE;
function F0(n) {
  return (n >>> 24 & 255) + (n >>> 8 & 65280) + ((n & 65280) << 8) + ((n & 255) << 24);
}
function kE() {
  this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Zt.Buf16(320), this.work = new Zt.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
function o1(n) {
  var t;
  return !n || !n.state ? cn : (t = n.state, n.total_in = n.total_out = t.total = 0, n.msg = "", t.wrap && (n.adler = t.wrap & 1), t.mode = a1, t.last = 0, t.havedict = 0, t.dmax = 32768, t.head = null, t.hold = 0, t.bits = 0, t.lencode = t.lendyn = new Zt.Buf32(FE), t.distcode = t.distdyn = new Zt.Buf32(BE), t.sane = 1, t.back = -1, Yr);
}
function f1(n) {
  var t;
  return !n || !n.state ? cn : (t = n.state, t.wsize = 0, t.whave = 0, t.wnext = 0, o1(n));
}
function l1(n, t) {
  var e, a;
  return !n || !n.state || (a = n.state, t < 0 ? (e = 0, t = -t) : (e = (t >> 4) + 1, t < 48 && (t &= 15)), t && (t < 8 || t > 15)) ? cn : (a.window !== null && a.wbits !== t && (a.window = null), a.wrap = e, a.wbits = t, f1(n));
}
function h1(n, t) {
  var e, a;
  return n ? (a = new kE(), n.state = a, a.window = null, e = l1(n, t), e !== Yr && (n.state = null), e) : cn;
}
function TE(n) {
  return h1(n, IE);
}
var B0 = !0, Jo, jo;
function $E(n) {
  if (B0) {
    var t;
    for (Jo = new Zt.Buf32(512), jo = new Zt.Buf32(32), t = 0; t < 144; )
      n.lens[t++] = 8;
    for (; t < 256; )
      n.lens[t++] = 9;
    for (; t < 280; )
      n.lens[t++] = 7;
    for (; t < 288; )
      n.lens[t++] = 8;
    for (du(n1, n.lens, 0, 288, Jo, 0, n.work, { bits: 9 }), t = 0; t < 32; )
      n.lens[t++] = 5;
    du(r1, n.lens, 0, 32, jo, 0, n.work, { bits: 5 }), B0 = !1;
  }
  n.lencode = Jo, n.lenbits = 9, n.distcode = jo, n.distbits = 5;
}
function c1(n, t, e, a) {
  var f, s = n.state;
  return s.window === null && (s.wsize = 1 << s.wbits, s.wnext = 0, s.whave = 0, s.window = new Zt.Buf8(s.wsize)), a >= s.wsize ? (Zt.arraySet(s.window, t, e - s.wsize, s.wsize, 0), s.wnext = 0, s.whave = s.wsize) : (f = s.wsize - s.wnext, f > a && (f = a), Zt.arraySet(s.window, t, e - a, f, s.wnext), a -= f, a ? (Zt.arraySet(s.window, t, e - a, a, 0), s.wnext = a, s.whave = s.wsize) : (s.wnext += f, s.wnext === s.wsize && (s.wnext = 0), s.whave < s.wsize && (s.whave += f))), 0;
}
function RE(n, t) {
  var e, a, f, s, h, l, D, c, d, x, C, E, I, B, M = 0, T, G, P, $, L, Q, z, Z, J = new Zt.Buf8(4), ee, K, ie = (
    /* permutation of code lengths */
    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
  );
  if (!n || !n.state || !n.output || !n.input && n.avail_in !== 0)
    return cn;
  e = n.state, e.mode === Jn && (e.mode = Ko), h = n.next_out, f = n.output, D = n.avail_out, s = n.next_in, a = n.input, l = n.avail_in, c = e.hold, d = e.bits, x = l, C = D, Z = Yr;
  e:
    for (; ; )
      switch (e.mode) {
        case a1:
          if (e.wrap === 0) {
            e.mode = Ko;
            break;
          }
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if (e.wrap & 2 && c === 35615) {
            e.check = 0, J[0] = c & 255, J[1] = c >>> 8 & 255, e.check = Tn(e.check, J, 2, 0), c = 0, d = 0, e.mode = a0;
            break;
          }
          if (e.flags = 0, e.head && (e.head.done = !1), !(e.wrap & 1) || /* check if zlib header allowed */
          (((c & 255) << 8) + (c >> 8)) % 31) {
            n.msg = "incorrect header check", e.mode = Ke;
            break;
          }
          if ((c & 15) !== u0) {
            n.msg = "unknown compression method", e.mode = Ke;
            break;
          }
          if (c >>>= 4, d -= 4, z = (c & 15) + 8, e.wbits === 0)
            e.wbits = z;
          else if (z > e.wbits) {
            n.msg = "invalid window size", e.mode = Ke;
            break;
          }
          e.dmax = 1 << z, n.adler = e.check = 1, e.mode = c & 512 ? p0 : Jn, c = 0, d = 0;
          break;
        case a0:
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if (e.flags = c, (e.flags & 255) !== u0) {
            n.msg = "unknown compression method", e.mode = Ke;
            break;
          }
          if (e.flags & 57344) {
            n.msg = "unknown header flags set", e.mode = Ke;
            break;
          }
          e.head && (e.head.text = c >> 8 & 1), e.flags & 512 && (J[0] = c & 255, J[1] = c >>> 8 & 255, e.check = Tn(e.check, J, 2, 0)), c = 0, d = 0, e.mode = s0;
        case s0:
          for (; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          e.head && (e.head.time = c), e.flags & 512 && (J[0] = c & 255, J[1] = c >>> 8 & 255, J[2] = c >>> 16 & 255, J[3] = c >>> 24 & 255, e.check = Tn(e.check, J, 4, 0)), c = 0, d = 0, e.mode = o0;
        case o0:
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          e.head && (e.head.xflags = c & 255, e.head.os = c >> 8), e.flags & 512 && (J[0] = c & 255, J[1] = c >>> 8 & 255, e.check = Tn(e.check, J, 2, 0)), c = 0, d = 0, e.mode = f0;
        case f0:
          if (e.flags & 1024) {
            for (; d < 16; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            e.length = c, e.head && (e.head.extra_len = c), e.flags & 512 && (J[0] = c & 255, J[1] = c >>> 8 & 255, e.check = Tn(e.check, J, 2, 0)), c = 0, d = 0;
          } else e.head && (e.head.extra = null);
          e.mode = l0;
        case l0:
          if (e.flags & 1024 && (E = e.length, E > l && (E = l), E && (e.head && (z = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Array(e.head.extra_len)), Zt.arraySet(
            e.head.extra,
            a,
            s,
            // extra field is limited to 65536 bytes
            // - no need for additional size check
            E,
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            z
          )), e.flags & 512 && (e.check = Tn(e.check, a, E, s)), l -= E, s += E, e.length -= E), e.length))
            break e;
          e.length = 0, e.mode = h0;
        case h0:
          if (e.flags & 2048) {
            if (l === 0)
              break e;
            E = 0;
            do
              z = a[s + E++], e.head && z && e.length < 65536 && (e.head.name += String.fromCharCode(z));
            while (z && E < l);
            if (e.flags & 512 && (e.check = Tn(e.check, a, E, s)), l -= E, s += E, z)
              break e;
          } else e.head && (e.head.name = null);
          e.length = 0, e.mode = c0;
        case c0:
          if (e.flags & 4096) {
            if (l === 0)
              break e;
            E = 0;
            do
              z = a[s + E++], e.head && z && e.length < 65536 && (e.head.comment += String.fromCharCode(z));
            while (z && E < l);
            if (e.flags & 512 && (e.check = Tn(e.check, a, E, s)), l -= E, s += E, z)
              break e;
          } else e.head && (e.head.comment = null);
          e.mode = d0;
        case d0:
          if (e.flags & 512) {
            for (; d < 16; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            if (c !== (e.check & 65535)) {
              n.msg = "header crc mismatch", e.mode = Ke;
              break;
            }
            c = 0, d = 0;
          }
          e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), n.adler = e.check = 0, e.mode = Jn;
          break;
        case p0:
          for (; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          n.adler = e.check = F0(c), c = 0, d = 0, e.mode = Ja;
        case Ja:
          if (e.havedict === 0)
            return n.next_out = h, n.avail_out = D, n.next_in = s, n.avail_in = l, e.hold = c, e.bits = d, CE;
          n.adler = e.check = 1, e.mode = Jn;
        case Jn:
          if (t === yE || t === Ia)
            break e;
        case Ko:
          if (e.last) {
            c >>>= d & 7, d -= d & 7, e.mode = Qo;
            break;
          }
          for (; d < 3; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          switch (e.last = c & 1, c >>>= 1, d -= 1, c & 3) {
            case 0:
              e.mode = g0;
              break;
            case 1:
              if ($E(e), e.mode = ka, t === Ia) {
                c >>>= 2, d -= 2;
                break e;
              }
              break;
            case 2:
              e.mode = w0;
              break;
            case 3:
              n.msg = "invalid block type", e.mode = Ke;
          }
          c >>>= 2, d -= 2;
          break;
        case g0:
          for (c >>>= d & 7, d -= d & 7; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if ((c & 65535) !== (c >>> 16 ^ 65535)) {
            n.msg = "invalid stored block lengths", e.mode = Ke;
            break;
          }
          if (e.length = c & 65535, c = 0, d = 0, e.mode = Yo, t === Ia)
            break e;
        case Yo:
          e.mode = _0;
        case _0:
          if (E = e.length, E) {
            if (E > l && (E = l), E > D && (E = D), E === 0)
              break e;
            Zt.arraySet(f, a, s, E, h), l -= E, s += E, D -= E, h += E, e.length -= E;
            break;
          }
          e.mode = Jn;
          break;
        case w0:
          for (; d < 14; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if (e.nlen = (c & 31) + 257, c >>>= 5, d -= 5, e.ndist = (c & 31) + 1, c >>>= 5, d -= 5, e.ncode = (c & 15) + 4, c >>>= 4, d -= 4, e.nlen > 286 || e.ndist > 30) {
            n.msg = "too many length or distance symbols", e.mode = Ke;
            break;
          }
          e.have = 0, e.mode = b0;
        case b0:
          for (; e.have < e.ncode; ) {
            for (; d < 3; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            e.lens[ie[e.have++]] = c & 7, c >>>= 3, d -= 3;
          }
          for (; e.have < 19; )
            e.lens[ie[e.have++]] = 0;
          if (e.lencode = e.lendyn, e.lenbits = 7, ee = { bits: e.lenbits }, Z = du(mE, e.lens, 0, 19, e.lencode, 0, e.work, ee), e.lenbits = ee.bits, Z) {
            n.msg = "invalid code lengths set", e.mode = Ke;
            break;
          }
          e.have = 0, e.mode = v0;
        case v0:
          for (; e.have < e.nlen + e.ndist; ) {
            for (; M = e.lencode[c & (1 << e.lenbits) - 1], T = M >>> 24, G = M >>> 16 & 255, P = M & 65535, !(T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            if (P < 16)
              c >>>= T, d -= T, e.lens[e.have++] = P;
            else {
              if (P === 16) {
                for (K = T + 2; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[s++] << d, d += 8;
                }
                if (c >>>= T, d -= T, e.have === 0) {
                  n.msg = "invalid bit length repeat", e.mode = Ke;
                  break;
                }
                z = e.lens[e.have - 1], E = 3 + (c & 3), c >>>= 2, d -= 2;
              } else if (P === 17) {
                for (K = T + 3; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[s++] << d, d += 8;
                }
                c >>>= T, d -= T, z = 0, E = 3 + (c & 7), c >>>= 3, d -= 3;
              } else {
                for (K = T + 7; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[s++] << d, d += 8;
                }
                c >>>= T, d -= T, z = 0, E = 11 + (c & 127), c >>>= 7, d -= 7;
              }
              if (e.have + E > e.nlen + e.ndist) {
                n.msg = "invalid bit length repeat", e.mode = Ke;
                break;
              }
              for (; E--; )
                e.lens[e.have++] = z;
            }
          }
          if (e.mode === Ke)
            break;
          if (e.lens[256] === 0) {
            n.msg = "invalid code -- missing end-of-block", e.mode = Ke;
            break;
          }
          if (e.lenbits = 9, ee = { bits: e.lenbits }, Z = du(n1, e.lens, 0, e.nlen, e.lencode, 0, e.work, ee), e.lenbits = ee.bits, Z) {
            n.msg = "invalid literal/lengths set", e.mode = Ke;
            break;
          }
          if (e.distbits = 6, e.distcode = e.distdyn, ee = { bits: e.distbits }, Z = du(r1, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, ee), e.distbits = ee.bits, Z) {
            n.msg = "invalid distances set", e.mode = Ke;
            break;
          }
          if (e.mode = ka, t === Ia)
            break e;
        case ka:
          e.mode = Ta;
        case Ta:
          if (l >= 6 && D >= 258) {
            n.next_out = h, n.avail_out = D, n.next_in = s, n.avail_in = l, e.hold = c, e.bits = d, DE(n, C), h = n.next_out, f = n.output, D = n.avail_out, s = n.next_in, a = n.input, l = n.avail_in, c = e.hold, d = e.bits, e.mode === Jn && (e.back = -1);
            break;
          }
          for (e.back = 0; M = e.lencode[c & (1 << e.lenbits) - 1], T = M >>> 24, G = M >>> 16 & 255, P = M & 65535, !(T <= d); ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if (G && !(G & 240)) {
            for ($ = T, L = G, Q = P; M = e.lencode[Q + ((c & (1 << $ + L) - 1) >> $)], T = M >>> 24, G = M >>> 16 & 255, P = M & 65535, !($ + T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            c >>>= $, d -= $, e.back += $;
          }
          if (c >>>= T, d -= T, e.back += T, e.length = P, G === 0) {
            e.mode = C0;
            break;
          }
          if (G & 32) {
            e.back = -1, e.mode = Jn;
            break;
          }
          if (G & 64) {
            n.msg = "invalid literal/length code", e.mode = Ke;
            break;
          }
          e.extra = G & 15, e.mode = D0;
        case D0:
          if (e.extra) {
            for (K = e.extra; d < K; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            e.length += c & (1 << e.extra) - 1, c >>>= e.extra, d -= e.extra, e.back += e.extra;
          }
          e.was = e.length, e.mode = m0;
        case m0:
          for (; M = e.distcode[c & (1 << e.distbits) - 1], T = M >>> 24, G = M >>> 16 & 255, P = M & 65535, !(T <= d); ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if (!(G & 240)) {
            for ($ = T, L = G, Q = P; M = e.distcode[Q + ((c & (1 << $ + L) - 1) >> $)], T = M >>> 24, G = M >>> 16 & 255, P = M & 65535, !($ + T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            c >>>= $, d -= $, e.back += $;
          }
          if (c >>>= T, d -= T, e.back += T, G & 64) {
            n.msg = "invalid distance code", e.mode = Ke;
            break;
          }
          e.offset = P, e.extra = G & 15, e.mode = y0;
        case y0:
          if (e.extra) {
            for (K = e.extra; d < K; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            e.offset += c & (1 << e.extra) - 1, c >>>= e.extra, d -= e.extra, e.back += e.extra;
          }
          if (e.offset > e.dmax) {
            n.msg = "invalid distance too far back", e.mode = Ke;
            break;
          }
          e.mode = E0;
        case E0:
          if (D === 0)
            break e;
          if (E = C - D, e.offset > E) {
            if (E = e.offset - E, E > e.whave && e.sane) {
              n.msg = "invalid distance too far back", e.mode = Ke;
              break;
            }
            E > e.wnext ? (E -= e.wnext, I = e.wsize - E) : I = e.wnext - E, E > e.length && (E = e.length), B = e.window;
          } else
            B = f, I = h - e.offset, E = e.length;
          E > D && (E = D), D -= E, e.length -= E;
          do
            f[h++] = B[I++];
          while (--E);
          e.length === 0 && (e.mode = Ta);
          break;
        case C0:
          if (D === 0)
            break e;
          f[h++] = e.length, D--, e.mode = Ta;
          break;
        case Qo:
          if (e.wrap) {
            for (; d < 32; ) {
              if (l === 0)
                break e;
              l--, c |= a[s++] << d, d += 8;
            }
            if (C -= D, n.total_out += C, e.total += C, C && (n.adler = e.check = /*UPDATE(state.check, put - _out, _out);*/
            e.flags ? Tn(e.check, f, C, h - C) : Cf(e.check, f, C, h - C)), C = D, (e.flags ? c : F0(c)) !== e.check) {
              n.msg = "incorrect data check", e.mode = Ke;
              break;
            }
            c = 0, d = 0;
          }
          e.mode = A0;
        case A0:
          if (e.wrap && e.flags) {
            for (; d < 32; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            if (c !== (e.total & 4294967295)) {
              n.msg = "incorrect length check", e.mode = Ke;
              break;
            }
            c = 0, d = 0;
          }
          e.mode = x0;
        case x0:
          Z = EE;
          break e;
        case Ke:
          Z = i1;
          break e;
        case s1:
          return u1;
        case xE:
        default:
          return cn;
      }
  return n.next_out = h, n.avail_out = D, n.next_in = s, n.avail_in = l, e.hold = c, e.bits = d, (e.wsize || C !== n.avail_out && e.mode < Ke && (e.mode < Qo || t !== i0)) && c1(n, n.output, n.next_out, C - n.avail_out), x -= n.avail_in, C -= n.avail_out, n.total_in += x, n.total_out += C, e.total += C, e.wrap && C && (n.adler = e.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
  e.flags ? Tn(e.check, f, C, n.next_out - C) : Cf(e.check, f, C, n.next_out - C)), n.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === Jn ? 128 : 0) + (e.mode === ka || e.mode === Yo ? 256 : 0), (x === 0 && C === 0 || t === i0) && Z === Yr && (Z = AE), Z;
}
function NE(n) {
  if (!n || !n.state)
    return cn;
  var t = n.state;
  return t.window && (t.window = null), n.state = null, Yr;
}
function LE(n, t) {
  var e;
  return !n || !n.state || (e = n.state, !(e.wrap & 2)) ? cn : (e.head = t, t.done = !1, Yr);
}
function OE(n, t) {
  var e = t.length, a, f, s;
  return !n || !n.state || (a = n.state, a.wrap !== 0 && a.mode !== Ja) ? cn : a.mode === Ja && (f = 1, f = Cf(f, t, e, 0), f !== a.check) ? i1 : (s = c1(n, t, e, e), s ? (a.mode = s1, u1) : (a.havedict = 1, Yr));
}
Cn.inflateReset = f1;
Cn.inflateReset2 = l1;
Cn.inflateResetKeep = o1;
Cn.inflateInit = TE;
Cn.inflateInit2 = h1;
Cn.inflate = RE;
Cn.inflateEnd = NE;
Cn.inflateGetHeader = LE;
Cn.inflateSetDictionary = OE;
Cn.inflateInfo = "pako inflate (from Nodeca project)";
var d1 = {
  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_ERRNO: -1,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR: -5,
  //Z_VERSION_ERROR: -6,
  /* compression levels */
  Z_NO_COMPRESSION: 0,
  Z_BEST_SPEED: 1,
  Z_BEST_COMPRESSION: 9,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY: 0,
  Z_TEXT: 1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN: 2,
  /* The deflate compression method */
  Z_DEFLATED: 8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
function PE() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var ME = PE, Si = Cn, pu = ar, Za = ti, rt = d1, Af = Vf, UE = e1, zE = ME, p1 = Object.prototype.toString;
function Qr(n) {
  if (!(this instanceof Qr)) return new Qr(n);
  this.options = pu.assign({
    chunkSize: 16384,
    windowBits: 0,
    to: ""
  }, n || {});
  var t = this.options;
  t.raw && t.windowBits >= 0 && t.windowBits < 16 && (t.windowBits = -t.windowBits, t.windowBits === 0 && (t.windowBits = -15)), t.windowBits >= 0 && t.windowBits < 16 && !(n && n.windowBits) && (t.windowBits += 32), t.windowBits > 15 && t.windowBits < 48 && (t.windowBits & 15 || (t.windowBits |= 15)), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new UE(), this.strm.avail_out = 0;
  var e = Si.inflateInit2(
    this.strm,
    t.windowBits
  );
  if (e !== rt.Z_OK)
    throw new Error(Af[e]);
  if (this.header = new zE(), Si.inflateGetHeader(this.strm, this.header), t.dictionary && (typeof t.dictionary == "string" ? t.dictionary = Za.string2buf(t.dictionary) : p1.call(t.dictionary) === "[object ArrayBuffer]" && (t.dictionary = new Uint8Array(t.dictionary)), t.raw && (e = Si.inflateSetDictionary(this.strm, t.dictionary), e !== rt.Z_OK)))
    throw new Error(Af[e]);
}
Qr.prototype.push = function(n, t) {
  var e = this.strm, a = this.options.chunkSize, f = this.options.dictionary, s, h, l, D, c, d = !1;
  if (this.ended)
    return !1;
  h = t === ~~t ? t : t === !0 ? rt.Z_FINISH : rt.Z_NO_FLUSH, typeof n == "string" ? e.input = Za.binstring2buf(n) : p1.call(n) === "[object ArrayBuffer]" ? e.input = new Uint8Array(n) : e.input = n, e.next_in = 0, e.avail_in = e.input.length;
  do {
    if (e.avail_out === 0 && (e.output = new pu.Buf8(a), e.next_out = 0, e.avail_out = a), s = Si.inflate(e, rt.Z_NO_FLUSH), s === rt.Z_NEED_DICT && f && (s = Si.inflateSetDictionary(this.strm, f)), s === rt.Z_BUF_ERROR && d === !0 && (s = rt.Z_OK, d = !1), s !== rt.Z_STREAM_END && s !== rt.Z_OK)
      return this.onEnd(s), this.ended = !0, !1;
    e.next_out && (e.avail_out === 0 || s === rt.Z_STREAM_END || e.avail_in === 0 && (h === rt.Z_FINISH || h === rt.Z_SYNC_FLUSH)) && (this.options.to === "string" ? (l = Za.utf8border(e.output, e.next_out), D = e.next_out - l, c = Za.buf2string(e.output, l), e.next_out = D, e.avail_out = a - D, D && pu.arraySet(e.output, e.output, l, D, 0), this.onData(c)) : this.onData(pu.shrinkBuf(e.output, e.next_out))), e.avail_in === 0 && e.avail_out === 0 && (d = !0);
  } while ((e.avail_in > 0 || e.avail_out === 0) && s !== rt.Z_STREAM_END);
  return s === rt.Z_STREAM_END && (h = rt.Z_FINISH), h === rt.Z_FINISH ? (s = Si.inflateEnd(this.strm), this.onEnd(s), this.ended = !0, s === rt.Z_OK) : (h === rt.Z_SYNC_FLUSH && (this.onEnd(rt.Z_OK), e.avail_out = 0), !0);
};
Qr.prototype.onData = function(n) {
  this.chunks.push(n);
};
Qr.prototype.onEnd = function(n) {
  n === rt.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = pu.flattenChunks(this.chunks)), this.chunks = [], this.err = n, this.msg = this.strm.msg;
};
function Kf(n, t) {
  var e = new Qr(t);
  if (e.push(n, !0), e.err)
    throw e.msg || Af[e.err];
  return e.result;
}
function qE(n, t) {
  return t = t || {}, t.raw = !0, Kf(n, t);
}
Lu.Inflate = Qr;
Lu.inflate = Kf;
Lu.inflateRaw = qE;
Lu.ungzip = Kf;
var GE = ar.assign, WE = $u, HE = Lu, ZE = d1, g1 = {};
GE(g1, WE, HE, ZE);
var ja = g1;
async function Yf(n) {
  try {
    let t, e = 0, a = 0;
    const f = [];
    let s = 0, h;
    do {
      const D = n.subarray(e);
      if (h = new ja.Inflate(), { strm: t } = h, h.push(D, ja.Z_SYNC_FLUSH), h.err)
        throw new Error(h.msg);
      e += t.next_in, f[a] = h.result, s += f[a].length, a += 1;
    } while (t.avail_in);
    const l = new Uint8Array(s);
    for (let D = 0, c = 0; D < f.length; D++)
      l.set(f[D], c), c += f[D].length;
    return Un.Buffer.from(l);
  } catch (t) {
    throw /incorrect header check/.exec(`${t}`) ? new Error("problem decompressing block: incorrect gzip header check") : t;
  }
}
async function VE(n, t) {
  try {
    let e;
    const { minv: a, maxv: f } = t;
    let s = a.blockPosition, h = a.dataPosition;
    const l = [], D = [], c = [];
    let d = 0, x = 0;
    do {
      const I = n.subarray(s - a.blockPosition), B = new ja.Inflate();
      if ({ strm: e } = B, B.push(I, ja.Z_SYNC_FLUSH), B.err)
        throw new Error(B.msg);
      const M = B.result;
      l.push(M);
      let T = M.length;
      D.push(s), c.push(h), l.length === 1 && a.dataPosition && (l[0] = l[0].subarray(a.dataPosition), T = l[0].length);
      const G = s;
      if (s += e.next_in, h += T, G >= f.blockPosition) {
        l[x] = l[x].subarray(0, f.blockPosition === a.blockPosition ? f.dataPosition - a.dataPosition + 1 : f.dataPosition + 1), D.push(s), c.push(h), d += l[x].length;
        break;
      }
      d += l[x].length, x++;
    } while (e.avail_in);
    const C = new Uint8Array(d);
    for (let I = 0, B = 0; I < l.length; I++)
      C.set(l[I], B), B += l[I].length;
    return { buffer: Un.Buffer.from(C), cpositions: D, dpositions: c };
  } catch (e) {
    throw /incorrect header check/.exec(`${e}`) ? new Error("problem decompressing block: incorrect gzip header check") : e;
  }
}
var XE = Ge, sn = null;
try {
  sn = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
    0,
    97,
    115,
    109,
    1,
    0,
    0,
    0,
    1,
    13,
    2,
    96,
    0,
    1,
    127,
    96,
    4,
    127,
    127,
    127,
    127,
    1,
    127,
    3,
    7,
    6,
    0,
    1,
    1,
    1,
    1,
    1,
    6,
    6,
    1,
    127,
    1,
    65,
    0,
    11,
    7,
    50,
    6,
    3,
    109,
    117,
    108,
    0,
    1,
    5,
    100,
    105,
    118,
    95,
    115,
    0,
    2,
    5,
    100,
    105,
    118,
    95,
    117,
    0,
    3,
    5,
    114,
    101,
    109,
    95,
    115,
    0,
    4,
    5,
    114,
    101,
    109,
    95,
    117,
    0,
    5,
    8,
    103,
    101,
    116,
    95,
    104,
    105,
    103,
    104,
    0,
    0,
    10,
    191,
    1,
    6,
    4,
    0,
    35,
    0,
    11,
    36,
    1,
    1,
    126,
    32,
    0,
    173,
    32,
    1,
    173,
    66,
    32,
    134,
    132,
    32,
    2,
    173,
    32,
    3,
    173,
    66,
    32,
    134,
    132,
    126,
    34,
    4,
    66,
    32,
    135,
    167,
    36,
    0,
    32,
    4,
    167,
    11,
    36,
    1,
    1,
    126,
    32,
    0,
    173,
    32,
    1,
    173,
    66,
    32,
    134,
    132,
    32,
    2,
    173,
    32,
    3,
    173,
    66,
    32,
    134,
    132,
    127,
    34,
    4,
    66,
    32,
    135,
    167,
    36,
    0,
    32,
    4,
    167,
    11,
    36,
    1,
    1,
    126,
    32,
    0,
    173,
    32,
    1,
    173,
    66,
    32,
    134,
    132,
    32,
    2,
    173,
    32,
    3,
    173,
    66,
    32,
    134,
    132,
    128,
    34,
    4,
    66,
    32,
    135,
    167,
    36,
    0,
    32,
    4,
    167,
    11,
    36,
    1,
    1,
    126,
    32,
    0,
    173,
    32,
    1,
    173,
    66,
    32,
    134,
    132,
    32,
    2,
    173,
    32,
    3,
    173,
    66,
    32,
    134,
    132,
    129,
    34,
    4,
    66,
    32,
    135,
    167,
    36,
    0,
    32,
    4,
    167,
    11,
    36,
    1,
    1,
    126,
    32,
    0,
    173,
    32,
    1,
    173,
    66,
    32,
    134,
    132,
    32,
    2,
    173,
    32,
    3,
    173,
    66,
    32,
    134,
    132,
    130,
    34,
    4,
    66,
    32,
    135,
    167,
    36,
    0,
    32,
    4,
    167,
    11
  ])), {}).exports;
} catch {
}
function Ge(n, t, e) {
  this.low = n | 0, this.high = t | 0, this.unsigned = !!e;
}
Ge.prototype.__isLong__;
Object.defineProperty(Ge.prototype, "__isLong__", { value: !0 });
function Pt(n) {
  return (n && n.__isLong__) === !0;
}
Ge.isLong = Pt;
var S0 = {}, I0 = {};
function ni(n, t) {
  var e, a, f;
  return t ? (n >>>= 0, (f = 0 <= n && n < 256) && (a = I0[n], a) ? a : (e = We(n, (n | 0) < 0 ? -1 : 0, !0), f && (I0[n] = e), e)) : (n |= 0, (f = -128 <= n && n < 128) && (a = S0[n], a) ? a : (e = We(n, n < 0 ? -1 : 0, !1), f && (S0[n] = e), e));
}
Ge.fromInt = ni;
function on(n, t) {
  if (isNaN(n))
    return t ? Hr : fn;
  if (t) {
    if (n < 0)
      return Hr;
    if (n >= _1)
      return v1;
  } else {
    if (n <= -9223372036854776e3)
      return Lt;
    if (n + 1 >= YE)
      return b1;
  }
  return n < 0 ? on(-n, t).neg() : We(n % $i | 0, n / $i | 0, t);
}
Ge.fromNumber = on;
function We(n, t, e) {
  return new Ge(n, t, e);
}
Ge.fromBits = We;
var es = Math.pow;
function Qf(n, t, e) {
  if (n.length === 0)
    throw Error("empty string");
  if (n === "NaN" || n === "Infinity" || n === "+Infinity" || n === "-Infinity")
    return fn;
  if (typeof t == "number" ? (e = t, t = !1) : t = !!t, e = e || 10, e < 2 || 36 < e)
    throw RangeError("radix");
  var a;
  if ((a = n.indexOf("-")) > 0)
    throw Error("interior hyphen");
  if (a === 0)
    return Qf(n.substring(1), t, e).neg();
  for (var f = on(es(e, 8)), s = fn, h = 0; h < n.length; h += 8) {
    var l = Math.min(8, n.length - h), D = parseInt(n.substring(h, h + l), e);
    if (l < 8) {
      var c = on(es(e, l));
      s = s.mul(c).add(on(D));
    } else
      s = s.mul(f), s = s.add(on(D));
  }
  return s.unsigned = t, s;
}
Ge.fromString = Qf;
function An(n, t) {
  return typeof n == "number" ? on(n, t) : typeof n == "string" ? Qf(n, t) : We(n.low, n.high, typeof t == "boolean" ? t : n.unsigned);
}
Ge.fromValue = An;
var k0 = 65536, KE = 1 << 24, $i = k0 * k0, _1 = $i * $i, YE = _1 / 2, T0 = ni(KE), fn = ni(0);
Ge.ZERO = fn;
var Hr = ni(0, !0);
Ge.UZERO = Hr;
var xi = ni(1);
Ge.ONE = xi;
var w1 = ni(1, !0);
Ge.UONE = w1;
var xf = ni(-1);
Ge.NEG_ONE = xf;
var b1 = We(-1, 2147483647, !1);
Ge.MAX_VALUE = b1;
var v1 = We(-1, -1, !0);
Ge.MAX_UNSIGNED_VALUE = v1;
var Lt = We(0, -2147483648, !1);
Ge.MIN_VALUE = Lt;
var te = Ge.prototype;
te.toInt = function() {
  return this.unsigned ? this.low >>> 0 : this.low;
};
te.toNumber = function() {
  return this.unsigned ? (this.high >>> 0) * $i + (this.low >>> 0) : this.high * $i + (this.low >>> 0);
};
te.toString = function(t) {
  if (t = t || 10, t < 2 || 36 < t)
    throw RangeError("radix");
  if (this.isZero())
    return "0";
  if (this.isNegative())
    if (this.eq(Lt)) {
      var e = on(t), a = this.div(e), f = a.mul(e).sub(this);
      return a.toString(t) + f.toInt().toString(t);
    } else
      return "-" + this.neg().toString(t);
  for (var s = on(es(t, 6), this.unsigned), h = this, l = ""; ; ) {
    var D = h.div(s), c = h.sub(D.mul(s)).toInt() >>> 0, d = c.toString(t);
    if (h = D, h.isZero())
      return d + l;
    for (; d.length < 6; )
      d = "0" + d;
    l = "" + d + l;
  }
};
te.getHighBits = function() {
  return this.high;
};
te.getHighBitsUnsigned = function() {
  return this.high >>> 0;
};
te.getLowBits = function() {
  return this.low;
};
te.getLowBitsUnsigned = function() {
  return this.low >>> 0;
};
te.getNumBitsAbs = function() {
  if (this.isNegative())
    return this.eq(Lt) ? 64 : this.neg().getNumBitsAbs();
  for (var t = this.high != 0 ? this.high : this.low, e = 31; e > 0 && !(t & 1 << e); e--)
    ;
  return this.high != 0 ? e + 33 : e + 1;
};
te.isZero = function() {
  return this.high === 0 && this.low === 0;
};
te.eqz = te.isZero;
te.isNegative = function() {
  return !this.unsigned && this.high < 0;
};
te.isPositive = function() {
  return this.unsigned || this.high >= 0;
};
te.isOdd = function() {
  return (this.low & 1) === 1;
};
te.isEven = function() {
  return (this.low & 1) === 0;
};
te.equals = function(t) {
  return Pt(t) || (t = An(t)), this.unsigned !== t.unsigned && this.high >>> 31 === 1 && t.high >>> 31 === 1 ? !1 : this.high === t.high && this.low === t.low;
};
te.eq = te.equals;
te.notEquals = function(t) {
  return !this.eq(
    /* validates */
    t
  );
};
te.neq = te.notEquals;
te.ne = te.notEquals;
te.lessThan = function(t) {
  return this.comp(
    /* validates */
    t
  ) < 0;
};
te.lt = te.lessThan;
te.lessThanOrEqual = function(t) {
  return this.comp(
    /* validates */
    t
  ) <= 0;
};
te.lte = te.lessThanOrEqual;
te.le = te.lessThanOrEqual;
te.greaterThan = function(t) {
  return this.comp(
    /* validates */
    t
  ) > 0;
};
te.gt = te.greaterThan;
te.greaterThanOrEqual = function(t) {
  return this.comp(
    /* validates */
    t
  ) >= 0;
};
te.gte = te.greaterThanOrEqual;
te.ge = te.greaterThanOrEqual;
te.compare = function(t) {
  if (Pt(t) || (t = An(t)), this.eq(t))
    return 0;
  var e = this.isNegative(), a = t.isNegative();
  return e && !a ? -1 : !e && a ? 1 : this.unsigned ? t.high >>> 0 > this.high >>> 0 || t.high === this.high && t.low >>> 0 > this.low >>> 0 ? -1 : 1 : this.sub(t).isNegative() ? -1 : 1;
};
te.comp = te.compare;
te.negate = function() {
  return !this.unsigned && this.eq(Lt) ? Lt : this.not().add(xi);
};
te.neg = te.negate;
te.add = function(t) {
  Pt(t) || (t = An(t));
  var e = this.high >>> 16, a = this.high & 65535, f = this.low >>> 16, s = this.low & 65535, h = t.high >>> 16, l = t.high & 65535, D = t.low >>> 16, c = t.low & 65535, d = 0, x = 0, C = 0, E = 0;
  return E += s + c, C += E >>> 16, E &= 65535, C += f + D, x += C >>> 16, C &= 65535, x += a + l, d += x >>> 16, x &= 65535, d += e + h, d &= 65535, We(C << 16 | E, d << 16 | x, this.unsigned);
};
te.subtract = function(t) {
  return Pt(t) || (t = An(t)), this.add(t.neg());
};
te.sub = te.subtract;
te.multiply = function(t) {
  if (this.isZero())
    return fn;
  if (Pt(t) || (t = An(t)), sn) {
    var e = sn.mul(
      this.low,
      this.high,
      t.low,
      t.high
    );
    return We(e, sn.get_high(), this.unsigned);
  }
  if (t.isZero())
    return fn;
  if (this.eq(Lt))
    return t.isOdd() ? Lt : fn;
  if (t.eq(Lt))
    return this.isOdd() ? Lt : fn;
  if (this.isNegative())
    return t.isNegative() ? this.neg().mul(t.neg()) : this.neg().mul(t).neg();
  if (t.isNegative())
    return this.mul(t.neg()).neg();
  if (this.lt(T0) && t.lt(T0))
    return on(this.toNumber() * t.toNumber(), this.unsigned);
  var a = this.high >>> 16, f = this.high & 65535, s = this.low >>> 16, h = this.low & 65535, l = t.high >>> 16, D = t.high & 65535, c = t.low >>> 16, d = t.low & 65535, x = 0, C = 0, E = 0, I = 0;
  return I += h * d, E += I >>> 16, I &= 65535, E += s * d, C += E >>> 16, E &= 65535, E += h * c, C += E >>> 16, E &= 65535, C += f * d, x += C >>> 16, C &= 65535, C += s * c, x += C >>> 16, C &= 65535, C += h * D, x += C >>> 16, C &= 65535, x += a * d + f * c + s * D + h * l, x &= 65535, We(E << 16 | I, x << 16 | C, this.unsigned);
};
te.mul = te.multiply;
te.divide = function(t) {
  if (Pt(t) || (t = An(t)), t.isZero())
    throw Error("division by zero");
  if (sn) {
    if (!this.unsigned && this.high === -2147483648 && t.low === -1 && t.high === -1)
      return this;
    var e = (this.unsigned ? sn.div_u : sn.div_s)(
      this.low,
      this.high,
      t.low,
      t.high
    );
    return We(e, sn.get_high(), this.unsigned);
  }
  if (this.isZero())
    return this.unsigned ? Hr : fn;
  var a, f, s;
  if (this.unsigned) {
    if (t.unsigned || (t = t.toUnsigned()), t.gt(this))
      return Hr;
    if (t.gt(this.shru(1)))
      return w1;
    s = Hr;
  } else {
    if (this.eq(Lt)) {
      if (t.eq(xi) || t.eq(xf))
        return Lt;
      if (t.eq(Lt))
        return xi;
      var h = this.shr(1);
      return a = h.div(t).shl(1), a.eq(fn) ? t.isNegative() ? xi : xf : (f = this.sub(t.mul(a)), s = a.add(f.div(t)), s);
    } else if (t.eq(Lt))
      return this.unsigned ? Hr : fn;
    if (this.isNegative())
      return t.isNegative() ? this.neg().div(t.neg()) : this.neg().div(t).neg();
    if (t.isNegative())
      return this.div(t.neg()).neg();
    s = fn;
  }
  for (f = this; f.gte(t); ) {
    a = Math.max(1, Math.floor(f.toNumber() / t.toNumber()));
    for (var l = Math.ceil(Math.log(a) / Math.LN2), D = l <= 48 ? 1 : es(2, l - 48), c = on(a), d = c.mul(t); d.isNegative() || d.gt(f); )
      a -= D, c = on(a, this.unsigned), d = c.mul(t);
    c.isZero() && (c = xi), s = s.add(c), f = f.sub(d);
  }
  return s;
};
te.div = te.divide;
te.modulo = function(t) {
  if (Pt(t) || (t = An(t)), sn) {
    var e = (this.unsigned ? sn.rem_u : sn.rem_s)(
      this.low,
      this.high,
      t.low,
      t.high
    );
    return We(e, sn.get_high(), this.unsigned);
  }
  return this.sub(this.div(t).mul(t));
};
te.mod = te.modulo;
te.rem = te.modulo;
te.not = function() {
  return We(~this.low, ~this.high, this.unsigned);
};
te.and = function(t) {
  return Pt(t) || (t = An(t)), We(this.low & t.low, this.high & t.high, this.unsigned);
};
te.or = function(t) {
  return Pt(t) || (t = An(t)), We(this.low | t.low, this.high | t.high, this.unsigned);
};
te.xor = function(t) {
  return Pt(t) || (t = An(t)), We(this.low ^ t.low, this.high ^ t.high, this.unsigned);
};
te.shiftLeft = function(t) {
  return Pt(t) && (t = t.toInt()), (t &= 63) === 0 ? this : t < 32 ? We(this.low << t, this.high << t | this.low >>> 32 - t, this.unsigned) : We(0, this.low << t - 32, this.unsigned);
};
te.shl = te.shiftLeft;
te.shiftRight = function(t) {
  return Pt(t) && (t = t.toInt()), (t &= 63) === 0 ? this : t < 32 ? We(this.low >>> t | this.high << 32 - t, this.high >> t, this.unsigned) : We(this.high >> t - 32, this.high >= 0 ? 0 : -1, this.unsigned);
};
te.shr = te.shiftRight;
te.shiftRightUnsigned = function(t) {
  if (Pt(t) && (t = t.toInt()), t &= 63, t === 0)
    return this;
  var e = this.high;
  if (t < 32) {
    var a = this.low;
    return We(a >>> t | e << 32 - t, e >>> t, this.unsigned);
  } else return t === 32 ? We(e, 0, this.unsigned) : We(e >>> t - 32, 0, this.unsigned);
};
te.shru = te.shiftRightUnsigned;
te.shr_u = te.shiftRightUnsigned;
te.toSigned = function() {
  return this.unsigned ? We(this.low, this.high, !1) : this;
};
te.toUnsigned = function() {
  return this.unsigned ? this : We(this.low, this.high, !0);
};
te.toBytes = function(t) {
  return t ? this.toBytesLE() : this.toBytesBE();
};
te.toBytesLE = function() {
  var t = this.high, e = this.low;
  return [
    e & 255,
    e >>> 8 & 255,
    e >>> 16 & 255,
    e >>> 24,
    t & 255,
    t >>> 8 & 255,
    t >>> 16 & 255,
    t >>> 24
  ];
};
te.toBytesBE = function() {
  var t = this.high, e = this.low;
  return [
    t >>> 24,
    t >>> 16 & 255,
    t >>> 8 & 255,
    t & 255,
    e >>> 24,
    e >>> 16 & 255,
    e >>> 8 & 255,
    e & 255
  ];
};
Ge.fromBytes = function(t, e, a) {
  return a ? Ge.fromBytesLE(t, e) : Ge.fromBytesBE(t, e);
};
Ge.fromBytesLE = function(t, e) {
  return new Ge(
    t[0] | t[1] << 8 | t[2] << 16 | t[3] << 24,
    t[4] | t[5] << 8 | t[6] << 16 | t[7] << 24,
    e
  );
};
Ge.fromBytesBE = function(t, e) {
  return new Ge(
    t[4] << 24 | t[5] << 16 | t[6] << 8 | t[7],
    t[0] << 24 | t[1] << 16 | t[2] << 8 | t[3],
    e
  );
};
var D1 = /* @__PURE__ */ is(XE);
function m1(n) {
  if (n.greaterThan(Number.MAX_SAFE_INTEGER) || n.lessThan(Number.MIN_SAFE_INTEGER))
    throw new Error("integer overflow");
  return n.toNumber();
}
let QE = class extends Error {
};
function ou(n) {
  if (n && n.aborted) {
    if (typeof DOMException < "u")
      throw new DOMException("aborted", "AbortError");
    {
      const t = new QE("aborted");
      throw t.code = "ERR_ABORTED", t;
    }
  }
}
function JE(n, t) {
  return t.minv.blockPosition - n.maxv.blockPosition < 65e3 && t.maxv.blockPosition - n.minv.blockPosition < 5e6;
}
function y1(n, t) {
  const e = [];
  let a = null;
  return n.length === 0 ? n : (n.sort(function(f, s) {
    const h = f.minv.blockPosition - s.minv.blockPosition;
    return h !== 0 ? h : f.minv.dataPosition - s.minv.dataPosition;
  }), n.forEach((f) => {
    (!t || f.maxv.compareTo(t) > 0) && (a === null ? (e.push(f), a = f) : JE(a, f) ? f.maxv.compareTo(a.maxv) > 0 && (a.maxv = f.maxv) : (e.push(f), a = f));
  }), e);
}
class Jf {
  constructor(t, e) {
    this.blockPosition = t, this.dataPosition = e;
  }
  toString() {
    return `${this.blockPosition}:${this.dataPosition}`;
  }
  compareTo(t) {
    return this.blockPosition - t.blockPosition || this.dataPosition - t.dataPosition;
  }
}
function Ii(n, t = 0, e = !1) {
  if (e)
    throw new Error("big-endian virtual file offsets not implemented");
  return new Jf(n[t + 7] * 1099511627776 + n[t + 6] * 4294967296 + n[t + 5] * 16777216 + n[t + 4] * 65536 + n[t + 3] * 256 + n[t + 2], n[t + 1] << 8 | n[t]);
}
class ts {
  constructor(t, e, a, f = void 0) {
    this.minv = t, this.maxv = e, this.bin = a, this._fetchedSize = f;
  }
  toUniqueString() {
    return `${this.minv}..${this.maxv} (bin ${this.bin}, fetchedSize ${this.fetchedSize()})`;
  }
  toString() {
    return this.toUniqueString();
  }
  compareTo(t) {
    return this.minv.compareTo(t.minv) || this.maxv.compareTo(t.maxv) || this.bin - t.bin;
  }
  fetchedSize() {
    return this._fetchedSize !== void 0 ? this._fetchedSize : this.maxv.blockPosition + 65536 - this.minv.blockPosition;
  }
}
class E1 {
  constructor({ filehandle: t, renameRefSeqs: e = (a) => a }) {
    this.filehandle = t, this.renameRefSeq = e;
  }
  async getMetadata(t = {}) {
    const { indices: e, ...a } = await this.parse(t);
    return a;
  }
  _findFirstData(t, e) {
    return t ? t.compareTo(e) > 0 ? e : t : e;
  }
  async parse(t = {}) {
    return this.parseP || (this.parseP = this._parse(t).catch((e) => {
      throw this.parseP = void 0, e;
    })), this.parseP;
  }
  async hasRefSeq(t, e = {}) {
    var a;
    return !!(!((a = (await this.parse(e)).indices[t]) === null || a === void 0) && a.binIndex);
  }
}
const jE = 21578324, $0 = 14;
function eC(n, t) {
  return n += 1, t -= 1, [
    [0, 0],
    [1 + (n >> 26), 1 + (t >> 26)],
    [9 + (n >> 23), 9 + (t >> 23)],
    [73 + (n >> 20), 73 + (t >> 20)],
    [585 + (n >> 17), 585 + (t >> 17)],
    [4681 + (n >> 14), 4681 + (t >> 14)]
  ];
}
class ru extends E1 {
  async lineCount(t, e = {}) {
    const a = await this.parse(e), f = a.refNameToId[t];
    if (f === void 0 || !a.indices[f])
      return -1;
    const { stats: h } = a.indices[f];
    return h ? h.lineCount : -1;
  }
  // fetch and parse the index
  async _parse(t = {}) {
    const e = await this.filehandle.readFile(t), a = await Yf(e);
    if (ou(t.signal), a.readUInt32LE(0) !== jE)
      throw new Error("Not a TBI file");
    const f = a.readInt32LE(4), s = a.readInt32LE(8), h = s & 65536 ? "zero-based-half-open" : "1-based-closed", D = {
      0: "generic",
      1: "SAM",
      2: "VCF"
    }[s & 15];
    if (!D)
      throw new Error(`invalid Tabix preset format flags ${s}`);
    const c = {
      ref: a.readInt32LE(12),
      start: a.readInt32LE(16),
      end: a.readInt32LE(20)
    }, d = a.readInt32LE(24), x = 5, C = ((1 << (x + 1) * 3) - 1) / 7, E = 2 ** (14 + x * 3), I = d ? String.fromCharCode(d) : null, B = a.readInt32LE(28), M = a.readInt32LE(32), { refNameToId: T, refIdToName: G } = this._parseNameBytes(a.slice(36, 36 + M));
    let P = 36 + M, $;
    return {
      indices: new Array(f).fill(0).map(() => {
        const Q = a.readInt32LE(P);
        P += 4;
        const z = {};
        let Z;
        for (let K = 0; K < Q; K += 1) {
          const ie = a.readUInt32LE(P);
          if (P += 4, ie > C + 1)
            throw new Error("tabix index contains too many bins, please use a CSI index");
          if (ie === C + 1) {
            const Ce = a.readInt32LE(P);
            P += 4, Ce === 2 && (Z = this.parsePseudoBin(a, P)), P += 16 * Ce;
          } else {
            const Ce = a.readInt32LE(P);
            P += 4;
            const be = new Array(Ce);
            for (let Pe = 0; Pe < Ce; Pe += 1) {
              const Ne = Ii(a, P), ve = Ii(a, P + 8);
              P += 16, $ = this._findFirstData($, Ne), be[Pe] = new ts(Ne, ve, ie);
            }
            z[ie] = be;
          }
        }
        const J = a.readInt32LE(P);
        P += 4;
        const ee = new Array(J);
        for (let K = 0; K < J; K += 1)
          ee[K] = Ii(a, P), P += 8, $ = this._findFirstData($, ee[K]);
        return { binIndex: z, linearIndex: ee, stats: Z };
      }),
      metaChar: I,
      maxBinNumber: C,
      maxRefLength: E,
      skipLines: B,
      firstDataLine: $,
      columnNumbers: c,
      coordinateType: h,
      format: D,
      refIdToName: G,
      refNameToId: T,
      maxBlockSize: 65536
    };
  }
  parsePseudoBin(t, e) {
    return { lineCount: m1(D1.fromBytesLE(t.slice(e + 16, e + 24), !0)) };
  }
  _parseNameBytes(t) {
    let e = 0, a = 0;
    const f = [], s = {};
    for (let h = 0; h < t.length; h += 1)
      if (!t[h]) {
        if (a < h) {
          let l = t.toString("utf8", a, h);
          l = this.renameRefSeq(l), f[e] = l, s[l] = e;
        }
        a = h + 1, e += 1;
      }
    return { refNameToId: s, refIdToName: f };
  }
  async blocksForRange(t, e, a, f = {}) {
    e < 0 && (e = 0);
    const s = await this.parse(f), h = s.refNameToId[t];
    if (h === void 0)
      return [];
    const l = s.indices[h];
    if (!l)
      return [];
    (l.linearIndex.length ? l.linearIndex[e >> $0 >= l.linearIndex.length ? l.linearIndex.length - 1 : e >> $0] : new Jf(0, 0)) || console.warn("querying outside of possible tabix range");
    const c = eC(e, a), d = [];
    for (const [B, M] of c)
      for (let T = B; T <= M; T++)
        if (l.binIndex[T])
          for (const G of l.binIndex[T])
            d.push(new ts(G.minv, G.maxv, T));
    const x = l.linearIndex.length;
    let C = null;
    const E = Math.min(e >> 14, x - 1), I = Math.min(a >> 14, x - 1);
    for (let B = E; B <= I; ++B) {
      const M = l.linearIndex[B];
      M && (!C || M.compareTo(C) < 0) && (C = M);
    }
    return y1(d, C);
  }
}
const tC = 21582659, nC = 38359875;
function rC(n, t) {
  return n * 2 ** t;
}
function R0(n, t) {
  return Math.floor(n / 2 ** t);
}
class ef extends E1 {
  constructor(t) {
    super(t), this.maxBinNumber = 0, this.depth = 0, this.minShift = 0;
  }
  async lineCount(t, e = {}) {
    const a = await this.parse(e), f = a.refNameToId[t];
    if (f === void 0 || !a.indices[f])
      return -1;
    const { stats: h } = a.indices[f];
    return h ? h.lineCount : -1;
  }
  indexCov() {
    throw new Error("CSI indexes do not support indexcov");
  }
  parseAuxData(t, e) {
    const a = t.readInt32LE(e), f = a & 65536 ? "zero-based-half-open" : "1-based-closed", s = { 0: "generic", 1: "SAM", 2: "VCF" }[a & 15];
    if (!s)
      throw new Error(`invalid Tabix preset format flags ${a}`);
    const h = {
      ref: t.readInt32LE(e + 4),
      start: t.readInt32LE(e + 8),
      end: t.readInt32LE(e + 12)
    }, l = t.readInt32LE(e + 16), D = l ? String.fromCharCode(l) : null, c = t.readInt32LE(e + 20), d = t.readInt32LE(e + 24), { refIdToName: x, refNameToId: C } = this._parseNameBytes(t.slice(e + 28, e + 28 + d));
    return {
      refIdToName: x,
      refNameToId: C,
      skipLines: c,
      metaChar: D,
      columnNumbers: h,
      format: s,
      coordinateType: f
    };
  }
  _parseNameBytes(t) {
    let e = 0, a = 0;
    const f = [], s = {};
    for (let h = 0; h < t.length; h += 1)
      if (!t[h]) {
        if (a < h) {
          let l = t.toString("utf8", a, h);
          l = this.renameRefSeq(l), f[e] = l, s[l] = e;
        }
        a = h + 1, e += 1;
      }
    return { refNameToId: s, refIdToName: f };
  }
  // fetch and parse the index
  async _parse(t = {}) {
    const e = await Yf(await this.filehandle.readFile(t));
    let a;
    if (e.readUInt32LE(0) === tC)
      a = 1;
    else if (e.readUInt32LE(0) === nC)
      a = 2;
    else
      throw new Error("Not a CSI file");
    this.minShift = e.readInt32LE(4), this.depth = e.readInt32LE(8), this.maxBinNumber = ((1 << (this.depth + 1) * 3) - 1) / 7;
    const f = 2 ** (this.minShift + this.depth * 3), s = e.readInt32LE(12), h = s && s >= 30 ? this.parseAuxData(e, 16) : {
      refIdToName: [],
      refNameToId: {},
      metaChar: null,
      columnNumbers: { ref: 0, start: 1, end: 2 },
      coordinateType: "zero-based-half-open",
      format: "generic"
    }, l = e.readInt32LE(16 + s);
    let D, c = 16 + s + 4;
    const d = new Array(l).fill(0).map(() => {
      const x = e.readInt32LE(c);
      c += 4;
      const C = {};
      let E;
      for (let I = 0; I < x; I += 1) {
        const B = e.readUInt32LE(c);
        if (B > this.maxBinNumber)
          E = this.parsePseudoBin(e, c + 4), c += 48;
        else {
          const M = Ii(e, c + 4);
          D = this._findFirstData(D, M);
          const T = e.readInt32LE(c + 12);
          c += 16;
          const G = new Array(T);
          for (let P = 0; P < T; P += 1) {
            const $ = Ii(e, c), L = Ii(e, c + 8);
            c += 16, G[P] = new ts($, L, B);
          }
          C[B] = G;
        }
      }
      return { binIndex: C, stats: E };
    });
    return {
      ...h,
      csi: !0,
      refCount: l,
      maxBlockSize: 65536,
      firstDataLine: D,
      csiVersion: a,
      indices: d,
      depth: this.depth,
      maxBinNumber: this.maxBinNumber,
      maxRefLength: f
    };
  }
  parsePseudoBin(t, e) {
    return { lineCount: m1(D1.fromBytesLE(t.slice(e + 28, e + 36), !0)) };
  }
  async blocksForRange(t, e, a, f = {}) {
    e < 0 && (e = 0);
    const s = await this.parse(f), h = s.refNameToId[t];
    if (h === void 0)
      return [];
    const l = s.indices[h];
    if (!l)
      return [];
    const D = this.reg2bins(e, a), c = [];
    for (const [d, x] of D)
      for (let C = d; C <= x; C++)
        if (l.binIndex[C])
          for (const E of l.binIndex[C])
            c.push(new ts(E.minv, E.maxv, C));
    return y1(c, new Jf(0, 0));
  }
  /**
   * calculate the list of bins that may overlap with region [beg,end) (zero-based half-open)
   */
  reg2bins(t, e) {
    t -= 1, t < 1 && (t = 1), e > 2 ** 50 && (e = 2 ** 34), e -= 1;
    let a = 0, f = 0, s = this.minShift + this.depth * 3;
    const h = [];
    for (; a <= this.depth; s -= 3, f += rC(1, a * 3), a += 1) {
      const l = f + R0(t, s), D = f + R0(e, s);
      if (D - l + h.length > this.maxBinNumber)
        throw new Error(`query ${t}-${e} is too large for current binning scheme (shift ${this.minShift}, depth ${this.depth}), try a smaller query or a coarser index binning scheme`);
      h.push([l, D]);
    }
    return h;
  }
}
function iC(n) {
  return /^[\u0000-\u007F]*$/.test(n);
}
const mi = typeof TextDecoder < "u" ? new TextDecoder("utf8") : void 0;
class uC {
  /**
   * @param {object} args
   *
   * @param {string} [args.path]
   *
   * @param {filehandle} [args.filehandle]
   *
   * @param {string} [args.tbiPath]
   *
   * @param {filehandle} [args.tbiFilehandle]
   *
   * @param {string} [args.csiPath]
   *
   * @param {filehandle} [args.csiFilehandle]
   *
   * @param {url} [args.url]
   *
   * @param {csiUrl} [args.csiUrl]
   *
   * @param {tbiUrl} [args.tbiUrl]
   *
   * @param {function} [args.renameRefSeqs] optional function with sig `string
   * => string` to transform reference sequence names for the purpose of
   * indexing and querying. note that the data that is returned is not altered,
   * just the names of the reference sequences that are used for querying.
   */
  constructor({ path: t, filehandle: e, url: a, tbiPath: f, tbiUrl: s, tbiFilehandle: h, csiPath: l, csiUrl: D, csiFilehandle: c, renameRefSeqs: d = (C) => C, chunkCacheSize: x = 5 * 2 ** 20 }) {
    if (e)
      this.filehandle = e;
    else if (t)
      this.filehandle = new au(t);
    else if (a)
      this.filehandle = new ir(a);
    else
      throw new TypeError("must provide either filehandle or path");
    if (h)
      this.index = new ru({
        filehandle: h,
        renameRefSeqs: d
      });
    else if (c)
      this.index = new ef({
        filehandle: c,
        renameRefSeqs: d
      });
    else if (f)
      this.index = new ru({
        filehandle: new au(f),
        renameRefSeqs: d
      });
    else if (l)
      this.index = new ef({
        filehandle: new au(l),
        renameRefSeqs: d
      });
    else if (t)
      this.index = new ru({
        filehandle: new au(`${t}.tbi`),
        renameRefSeqs: d
      });
    else if (D)
      this.index = new ef({
        filehandle: new ir(D)
      });
    else if (s)
      this.index = new ru({
        filehandle: new ir(s)
      });
    else if (a)
      this.index = new ru({
        filehandle: new ir(`${a}.tbi`)
      });
    else
      throw new TypeError("must provide one of tbiFilehandle, tbiPath, csiFilehandle, csiPath, tbiUrl, csiUrl");
    this.renameRefSeq = d, this.chunkCache = new wu({
      cache: new Fd({ maxSize: Math.floor(x / 65536) }),
      fill: (C, E) => this.readChunk(C, { signal: E })
    });
  }
  /**
   * @param refName name of the reference sequence
   *
   * @param start start of the region (in 0-based half-open coordinates)
   *
   * @param end end of the region (in 0-based half-open coordinates)
   *
   * @param opts callback called for each line in the region. can also pass a
   * object param containing obj.lineCallback, obj.signal, etc
   *
   * @returns promise that is resolved when the whole read is finished,
   * rejected on error
   */
  async getLines(t, e, a, f) {
    var s, h;
    let l, D = {}, c;
    typeof f == "function" ? c = f : (D = f, c = f.lineCallback, l = f.signal);
    const d = await this.index.getMetadata(D);
    ou(l);
    const x = e ?? 0, C = a ?? d.maxRefLength;
    if (!(x <= C))
      throw new TypeError("invalid start and end coordinates. start must be less than or equal to end");
    if (x === C)
      return;
    const E = await this.index.blocksForRange(t, x, C, D);
    ou(l);
    for (const I of E) {
      const { buffer: B, cpositions: M, dpositions: T } = await this.chunkCache.get(I.toString(), I, l);
      ou(l);
      let G = 0, P = 0;
      const $ = (s = mi == null ? void 0 : mi.decode(B)) !== null && s !== void 0 ? s : B.toString(), L = B.length < 5e8 && iC($);
      for (; G < $.length; ) {
        let Q, z;
        if (L) {
          if (z = $.indexOf(`
`, G), z === -1)
            break;
          Q = $.slice(G, z);
        } else {
          if (z = B.indexOf(`
`, G), z === -1)
            break;
          const ee = B.slice(G, z);
          Q = (h = mi == null ? void 0 : mi.decode(ee)) !== null && h !== void 0 ? h : ee.toString();
        }
        if (T) {
          for (; G + I.minv.dataPosition >= T[P++]; )
            ;
          P--;
        }
        const { startCoordinate: Z, overlaps: J } = this.checkLine(d, t, x, C, Q);
        if (J)
          c(
            Q,
            // cpositions[pos] refers to actual file offset of a bgzip block
            // boundaries
            //
            // we multiply by (1 <<8) in order to make sure each block has a
            // "unique" address space so that data in that block could never
            // overlap
            //
            // then the blockStart-dpositions is an uncompressed file offset
            // from that bgzip block boundary, and since the cpositions are
            // multiplied by (1 << 8) these uncompressed offsets get a unique
            // space
            M[P] * 256 + (G - T[P]) + I.minv.dataPosition + 1
          );
        else if (Z !== void 0 && Z >= C)
          return;
        G = z + 1;
      }
    }
  }
  async getMetadata(t = {}) {
    return this.index.getMetadata(t);
  }
  /**
   * get a buffer containing the "header" region of the file, which are the
   * bytes up to the first non-meta line
   */
  async getHeaderBuffer(t = {}) {
    const { firstDataLine: e, metaChar: a, maxBlockSize: f } = await this.getMetadata(t);
    ou(t.signal);
    const s = ((e == null ? void 0 : e.blockPosition) || 0) + f, h = await this._readRegion(0, s, t), l = await Yf(h);
    if (a) {
      let D = -1;
      const c = 10, d = a.charCodeAt(0);
      for (let x = 0; x < l.length && !(x === D + 1 && l[x] !== d); x += 1)
        l[x] === c && (D = x);
      return l.subarray(0, D + 1);
    }
    return l;
  }
  /**
   * get a string containing the "header" region of the file, is the portion up
   * to the first non-meta line
   *
   * @returns {Promise} for a string
   */
  async getHeader(t = {}) {
    return (await this.getHeaderBuffer(t)).toString("utf8");
  }
  /**
   * get an array of reference sequence names, in the order in which they occur
   * in the file. reference sequence renaming is not applied to these names.
   */
  async getReferenceSequenceNames(t = {}) {
    return (await this.getMetadata(t)).refIdToName;
  }
  /**
   * @param {object} metadata metadata object from the parsed index, containing
   * columnNumbers, metaChar, and format
   *
   * @param {string} regionRefName
   *
   * @param {number} regionStart region start coordinate (0-based-half-open)
   *
   * @param {number} regionEnd region end coordinate (0-based-half-open)
   *
   * @param {array[string]} line
   *
   * @returns {object} like `{startCoordinate, overlaps}`. overlaps is boolean,
   * true if line is a data line that overlaps the given region
   */
  checkLine(t, e, a, f, s) {
    const { columnNumbers: h, metaChar: l, coordinateType: D, format: c } = t;
    if (l && s.startsWith(l))
      return { overlaps: !1 };
    let { ref: d, start: x, end: C } = h;
    d || (d = 0), x || (x = 0), C || (C = 0), c === "VCF" && (C = 8);
    const E = Math.max(d, x, C);
    let I = 1, B = 0, M = "", T = -1 / 0;
    const G = s.length;
    for (let P = 0; P < G + 1; P++)
      if (s[P] === "	" || P === G) {
        if (I === d) {
          if (this.renameRefSeq(s.slice(B, P)) !== e)
            return {
              overlaps: !1
            };
        } else if (I === x) {
          if (T = parseInt(s.slice(B, P), 10), D === "1-based-closed" && (T -= 1), T >= f)
            return {
              startCoordinate: T,
              overlaps: !1
            };
          if ((C === 0 || C === x) && T + 1 <= a)
            return {
              startCoordinate: T,
              overlaps: !1
            };
        } else if (c === "VCF" && I === 4)
          M = s.slice(B, P);
        else if (I === C && (c === "VCF" ? this._getVcfEnd(T, M, s.slice(B, P)) : Number.parseInt(s.slice(B, P), 10)) <= a)
          return {
            overlaps: !1
          };
        if (B = P + 1, I += 1, I > E)
          break;
      }
    return {
      startCoordinate: T,
      overlaps: !0
    };
  }
  _getVcfEnd(t, e, a) {
    let f = t + e.length;
    const s = a.includes("SVTYPE=TRA");
    if (a[0] !== "." && !s) {
      let h = ";";
      for (let l = 0; l < a.length; l += 1) {
        if (h === ";" && a.slice(l, l + 4) === "END=") {
          let D = a.indexOf(";", l);
          D === -1 && (D = a.length), f = parseInt(a.slice(l + 4, D), 10);
          break;
        }
        h = a[l];
      }
    } else if (s)
      return t + 1;
    return f;
  }
  /**
   * return the approximate number of data lines in the given reference
   * sequence
   *
   * @param refSeq reference sequence name
   *
   * @returns number of data lines present on that reference sequence
   */
  async lineCount(t, e = {}) {
    return this.index.lineCount(t, e);
  }
  async _readRegion(t, e, a = {}) {
    const f = Un.Buffer.alloc(e), { bytesRead: s, buffer: h } = await this.filehandle.read(f, 0, e, t, a);
    return h.subarray(0, s);
  }
  /**
   * read and uncompress the data in a chunk (composed of one or more
   * contiguous bgzip blocks) of the file
   */
  async readChunk(t, e = {}) {
    const a = await this._readRegion(t.minv.blockPosition, t.fetchedSize(), e);
    return VE(a, t);
  }
}
function Mr(n, t, e) {
  let a = 1e5, f = new uC({
    filehandle: new ir(e, { fetch: _u }),
    tbiFilehandle: new ir(e + ".tbi", {
      fetch: _u
    })
  });
  function s(c, d) {
    if (c.length <= d)
      return c;
    const x = [];
    for (let C = 0; C < d; C++) {
      const E = C / d, I = Math.ceil(E * c.length);
      x.push(c[I]);
    }
    return x;
  }
  async function h(c, d) {
    const x = c.map((E) => {
      let I = d && d.ensemblStyle ? E.chr.replace("chr", "") : E.chr;
      return I === "M" && (I = "MT"), l(I, E.start, E.end);
    }), C = await Promise.all(x);
    return Ot.flatten(C);
  }
  async function l(c, d, x) {
    const C = [];
    await f.getLines(c, d, x, (I) => C.push(I));
    let E;
    return C.length > a ? E = s(C, a) : E = C, E.map(D);
  }
  function D(c) {
    const d = c.split("	");
    if (d.length < 3)
      return;
    let x = {
      chr: d[0],
      start: Number.parseInt(d[1], 10),
      end: Number.parseInt(d[2], 10),
      n: d.length
      // number of columns in initial data row
    };
    for (let C = 3; C < d.length; C++)
      x[C] = d[C];
    return x;
  }
  return h(n, t);
}
const cs = BigInt(32);
function aC(n, t, e) {
  const a = +!!e, f = +!e;
  return BigInt(n.getInt32(t, e) * f + n.getInt32(t + 4, e) * a) << cs | BigInt(n.getUint32(t, e) * a + n.getUint32(t + 4, e) * f);
}
function sC(n, t, e) {
  const a = n.getUint32(t, e), f = n.getUint32(t + 4, e), s = +!!e, h = +!e;
  return BigInt(a * h + f * s) << cs | BigInt(a * s + f * h);
}
function oC(n, t, e, a) {
  const f = Number(e >> cs), s = Number(e & BigInt(4294967295));
  a ? (n.setInt32(t + 4, f, a), n.setUint32(t, s, a)) : (n.setInt32(t, f, a), n.setUint32(t + 4, s, a));
}
function fC(n, t, e, a) {
  const f = Number(e >> cs), s = Number(e & BigInt(4294967295));
  a ? (n.setUint32(t + 4, f, a), n.setUint32(t, s, a)) : (n.setUint32(t, f, a), n.setUint32(t + 4, s, a));
}
"getBigInt64" in DataView || (DataView.prototype.getBigInt64 = function(n, t) {
  return aC(this, n, t);
});
"getBigUint64" in DataView || (DataView.prototype.getBigUint64 = function(n, t) {
  return sC(this, n, t);
});
"setBigInt64" in DataView || (DataView.prototype.setBigInt64 = function(n, t, e) {
  oC(this, n, t, e);
});
"setBigUint64" in DataView || (DataView.prototype.setBigUint64 = function(n, t, e) {
  fC(this, n, t, e);
});
class lC {
  constructor(t, e) {
    this.code = "", this.scopes = [["vars"]], this.bitFields = [], this.tmpVariableCount = 0, this.references = /* @__PURE__ */ new Map(), this.imports = [], this.reverseImports = /* @__PURE__ */ new Map(), this.useContextVariables = !1, this.importPath = t, this.useContextVariables = e;
  }
  generateVariable(t) {
    const e = [...this.scopes[this.scopes.length - 1]];
    return t && e.push(t), e.join(".");
  }
  generateOption(t) {
    switch (typeof t) {
      case "number":
        return t.toString();
      case "string":
        return this.generateVariable(t);
      case "function":
        return `${this.addImport(t)}.call(${this.generateVariable()}, vars)`;
    }
  }
  generateError(t) {
    this.pushCode(`throw new Error(${t});`);
  }
  generateTmpVariable() {
    return "$tmp" + this.tmpVariableCount++;
  }
  pushCode(t) {
    this.code += t + `
`;
  }
  pushPath(t) {
    t && this.scopes[this.scopes.length - 1].push(t);
  }
  popPath(t) {
    t && this.scopes[this.scopes.length - 1].pop();
  }
  pushScope(t) {
    this.scopes.push([t]);
  }
  popScope() {
    this.scopes.pop();
  }
  addImport(t) {
    if (!this.importPath)
      return `(${t})`;
    let e = this.reverseImports.get(t);
    return e || (e = this.imports.push(t) - 1, this.reverseImports.set(t, e)), `${this.importPath}[${e}]`;
  }
  addReference(t) {
    this.references.has(t) || this.references.set(t, { resolved: !1, requested: !1 });
  }
  markResolved(t) {
    const e = this.references.get(t);
    e && (e.resolved = !0);
  }
  markRequested(t) {
    t.forEach((e) => {
      const a = this.references.get(e);
      a && (a.requested = !0);
    });
  }
  getUnresolvedReferences() {
    return Array.from(this.references).filter(([t, e]) => !e.resolved && !e.requested).map(([t, e]) => t);
  }
}
const vn = /* @__PURE__ */ new Map(), Ur = "___parser_", Dn = {
  uint8: 1,
  uint16le: 2,
  uint16be: 2,
  uint32le: 4,
  uint32be: 4,
  int8: 1,
  int16le: 2,
  int16be: 2,
  int32le: 4,
  int32be: 4,
  int64be: 8,
  int64le: 8,
  uint64be: 8,
  uint64le: 8,
  floatle: 4,
  floatbe: 4,
  doublele: 8,
  doublebe: 8
}, $a = {
  uint8: "Uint8",
  uint16le: "Uint16",
  uint16be: "Uint16",
  uint32le: "Uint32",
  uint32be: "Uint32",
  int8: "Int8",
  int16le: "Int16",
  int16be: "Int16",
  int32le: "Int32",
  int32be: "Int32",
  int64be: "BigInt64",
  int64le: "BigInt64",
  uint64be: "BigUint64",
  uint64le: "BigUint64",
  floatle: "Float32",
  floatbe: "Float32",
  doublele: "Float64",
  doublebe: "Float64"
}, Ra = {
  uint8: !1,
  uint16le: !0,
  uint16be: !1,
  uint32le: !0,
  uint32be: !1,
  int8: !1,
  int16le: !0,
  int16be: !1,
  int32le: !0,
  int32be: !1,
  int64be: !1,
  int64le: !0,
  uint64be: !1,
  uint64le: !0,
  floatle: !0,
  floatbe: !1,
  doublele: !0,
  doublebe: !1
};
class Se {
  constructor() {
    this.varName = "", this.type = "", this.options = {}, this.endian = "be", this.useContextVariables = !1;
  }
  static start() {
    return new Se();
  }
  primitiveGenerateN(t, e) {
    const a = $a[t], f = Ra[t];
    e.pushCode(`${e.generateVariable(this.varName)} = dataView.get${a}(offset, ${f});`), e.pushCode(`offset += ${Dn[t]};`);
  }
  primitiveN(t, e, a) {
    return this.setNextParser(t, e, a);
  }
  useThisEndian(t) {
    return t + this.endian.toLowerCase();
  }
  uint8(t, e = {}) {
    return this.primitiveN("uint8", t, e);
  }
  uint16(t, e = {}) {
    return this.primitiveN(this.useThisEndian("uint16"), t, e);
  }
  uint16le(t, e = {}) {
    return this.primitiveN("uint16le", t, e);
  }
  uint16be(t, e = {}) {
    return this.primitiveN("uint16be", t, e);
  }
  uint32(t, e = {}) {
    return this.primitiveN(this.useThisEndian("uint32"), t, e);
  }
  uint32le(t, e = {}) {
    return this.primitiveN("uint32le", t, e);
  }
  uint32be(t, e = {}) {
    return this.primitiveN("uint32be", t, e);
  }
  int8(t, e = {}) {
    return this.primitiveN("int8", t, e);
  }
  int16(t, e = {}) {
    return this.primitiveN(this.useThisEndian("int16"), t, e);
  }
  int16le(t, e = {}) {
    return this.primitiveN("int16le", t, e);
  }
  int16be(t, e = {}) {
    return this.primitiveN("int16be", t, e);
  }
  int32(t, e = {}) {
    return this.primitiveN(this.useThisEndian("int32"), t, e);
  }
  int32le(t, e = {}) {
    return this.primitiveN("int32le", t, e);
  }
  int32be(t, e = {}) {
    return this.primitiveN("int32be", t, e);
  }
  bigIntVersionCheck() {
    if (!DataView.prototype.getBigInt64)
      throw new Error("BigInt64 is unsupported on this runtime");
  }
  int64(t, e = {}) {
    return this.bigIntVersionCheck(), this.primitiveN(this.useThisEndian("int64"), t, e);
  }
  int64be(t, e = {}) {
    return this.bigIntVersionCheck(), this.primitiveN("int64be", t, e);
  }
  int64le(t, e = {}) {
    return this.bigIntVersionCheck(), this.primitiveN("int64le", t, e);
  }
  uint64(t, e = {}) {
    return this.bigIntVersionCheck(), this.primitiveN(this.useThisEndian("uint64"), t, e);
  }
  uint64be(t, e = {}) {
    return this.bigIntVersionCheck(), this.primitiveN("uint64be", t, e);
  }
  uint64le(t, e = {}) {
    return this.bigIntVersionCheck(), this.primitiveN("uint64le", t, e);
  }
  floatle(t, e = {}) {
    return this.primitiveN("floatle", t, e);
  }
  floatbe(t, e = {}) {
    return this.primitiveN("floatbe", t, e);
  }
  doublele(t, e = {}) {
    return this.primitiveN("doublele", t, e);
  }
  doublebe(t, e = {}) {
    return this.primitiveN("doublebe", t, e);
  }
  bitN(t, e, a) {
    return a.length = t, this.setNextParser("bit", e, a);
  }
  bit1(t, e = {}) {
    return this.bitN(1, t, e);
  }
  bit2(t, e = {}) {
    return this.bitN(2, t, e);
  }
  bit3(t, e = {}) {
    return this.bitN(3, t, e);
  }
  bit4(t, e = {}) {
    return this.bitN(4, t, e);
  }
  bit5(t, e = {}) {
    return this.bitN(5, t, e);
  }
  bit6(t, e = {}) {
    return this.bitN(6, t, e);
  }
  bit7(t, e = {}) {
    return this.bitN(7, t, e);
  }
  bit8(t, e = {}) {
    return this.bitN(8, t, e);
  }
  bit9(t, e = {}) {
    return this.bitN(9, t, e);
  }
  bit10(t, e = {}) {
    return this.bitN(10, t, e);
  }
  bit11(t, e = {}) {
    return this.bitN(11, t, e);
  }
  bit12(t, e = {}) {
    return this.bitN(12, t, e);
  }
  bit13(t, e = {}) {
    return this.bitN(13, t, e);
  }
  bit14(t, e = {}) {
    return this.bitN(14, t, e);
  }
  bit15(t, e = {}) {
    return this.bitN(15, t, e);
  }
  bit16(t, e = {}) {
    return this.bitN(16, t, e);
  }
  bit17(t, e = {}) {
    return this.bitN(17, t, e);
  }
  bit18(t, e = {}) {
    return this.bitN(18, t, e);
  }
  bit19(t, e = {}) {
    return this.bitN(19, t, e);
  }
  bit20(t, e = {}) {
    return this.bitN(20, t, e);
  }
  bit21(t, e = {}) {
    return this.bitN(21, t, e);
  }
  bit22(t, e = {}) {
    return this.bitN(22, t, e);
  }
  bit23(t, e = {}) {
    return this.bitN(23, t, e);
  }
  bit24(t, e = {}) {
    return this.bitN(24, t, e);
  }
  bit25(t, e = {}) {
    return this.bitN(25, t, e);
  }
  bit26(t, e = {}) {
    return this.bitN(26, t, e);
  }
  bit27(t, e = {}) {
    return this.bitN(27, t, e);
  }
  bit28(t, e = {}) {
    return this.bitN(28, t, e);
  }
  bit29(t, e = {}) {
    return this.bitN(29, t, e);
  }
  bit30(t, e = {}) {
    return this.bitN(30, t, e);
  }
  bit31(t, e = {}) {
    return this.bitN(31, t, e);
  }
  bit32(t, e = {}) {
    return this.bitN(32, t, e);
  }
  namely(t) {
    return vn.set(t, this), this.alias = t, this;
  }
  skip(t, e = {}) {
    return this.seek(t, e);
  }
  seek(t, e = {}) {
    if (e.assert)
      throw new Error("assert option on seek is not allowed.");
    return this.setNextParser("seek", "", { length: t });
  }
  string(t, e) {
    if (!e.zeroTerminated && !e.length && !e.greedy)
      throw new Error("One of length, zeroTerminated, or greedy must be defined for string.");
    if ((e.zeroTerminated || e.length) && e.greedy)
      throw new Error("greedy is mutually exclusive with length and zeroTerminated for string.");
    if (e.stripNull && !(e.length || e.greedy))
      throw new Error("length or greedy must be defined if stripNull is enabled.");
    return e.encoding = e.encoding || "utf8", this.setNextParser("string", t, e);
  }
  buffer(t, e) {
    if (!e.length && !e.readUntil)
      throw new Error("length or readUntil must be defined for buffer.");
    return this.setNextParser("buffer", t, e);
  }
  wrapped(t, e) {
    if (typeof e != "object" && typeof t == "object" && (e = t, t = ""), !e || !e.wrapper || !e.type)
      throw new Error("Both wrapper and type must be defined for wrapped.");
    if (!e.length && !e.readUntil)
      throw new Error("length or readUntil must be defined for wrapped.");
    return this.setNextParser("wrapper", t, e);
  }
  array(t, e) {
    if (!e.readUntil && !e.length && !e.lengthInBytes)
      throw new Error("One of readUntil, length and lengthInBytes must be defined for array.");
    if (!e.type)
      throw new Error("type is required for array.");
    if (typeof e.type == "string" && !vn.has(e.type) && !(e.type in Dn))
      throw new Error(`Array element type "${e.type}" is unkown.`);
    return this.setNextParser("array", t, e);
  }
  choice(t, e) {
    if (typeof e != "object" && typeof t == "object" && (e = t, t = ""), !e)
      throw new Error("tag and choices are are required for choice.");
    if (!e.tag)
      throw new Error("tag is requird for choice.");
    if (!e.choices)
      throw new Error("choices is required for choice.");
    for (const a in e.choices) {
      const f = parseInt(a, 10), s = e.choices[f];
      if (isNaN(f))
        throw new Error(`Choice key "${a}" is not a number.`);
      if (typeof s == "string" && !vn.has(s) && !(s in Dn))
        throw new Error(`Choice type "${s}" is unkown.`);
    }
    return this.setNextParser("choice", t, e);
  }
  nest(t, e) {
    if (typeof e != "object" && typeof t == "object" && (e = t, t = ""), !e || !e.type)
      throw new Error("type is required for nest.");
    if (!(e.type instanceof Se) && !vn.has(e.type))
      throw new Error("type must be a known parser name or a Parser object.");
    if (!(e.type instanceof Se) && !t)
      throw new Error("type must be a Parser object if the variable name is omitted.");
    return this.setNextParser("nest", t, e);
  }
  pointer(t, e) {
    if (!e.offset)
      throw new Error("offset is required for pointer.");
    if (!e.type)
      throw new Error("type is required for pointer.");
    if (typeof e.type == "string" && !(e.type in Dn) && !vn.has(e.type))
      throw new Error(`Pointer type "${e.type}" is unkown.`);
    return this.setNextParser("pointer", t, e);
  }
  saveOffset(t, e = {}) {
    return this.setNextParser("saveOffset", t, e);
  }
  endianness(t) {
    switch (t.toLowerCase()) {
      case "little":
        this.endian = "le";
        break;
      case "big":
        this.endian = "be";
        break;
      default:
        throw new Error('endianness must be one of "little" or "big"');
    }
    return this;
  }
  endianess(t) {
    return this.endianness(t);
  }
  useContextVars(t = !0) {
    return this.useContextVariables = t, this;
  }
  create(t) {
    if (!(t instanceof Function))
      throw new Error("Constructor must be a Function object.");
    return this.constructorFn = t, this;
  }
  getContext(t) {
    const e = new lC(t, this.useContextVariables);
    return e.pushCode("var dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);"), this.alias ? (this.addAliasedCode(e), e.pushCode(`return ${Ur + this.alias}(0).result;`)) : this.addRawCode(e), e;
  }
  getCode() {
    return this.getContext("imports").code;
  }
  addRawCode(t) {
    t.pushCode("var offset = 0;"), t.pushCode(`var vars = ${this.constructorFn ? "new constructorFn()" : "{}"};`), t.pushCode("vars.$parent = null;"), t.pushCode("vars.$root = vars;"), this.generate(t), this.resolveReferences(t), t.pushCode("delete vars.$parent;"), t.pushCode("delete vars.$root;"), t.pushCode("return vars;");
  }
  addAliasedCode(t) {
    return t.pushCode(`function ${Ur + this.alias}(offset, context) {`), t.pushCode(`var vars = ${this.constructorFn ? "new constructorFn()" : "{}"};`), t.pushCode("var ctx = Object.assign({$parent: null, $root: vars}, context || {});"), t.pushCode("vars = Object.assign(vars, ctx);"), this.generate(t), t.markResolved(this.alias), this.resolveReferences(t), t.pushCode("Object.keys(ctx).forEach(function (item) { delete vars[item]; });"), t.pushCode("return { offset: offset, result: vars };"), t.pushCode("}"), t;
  }
  resolveReferences(t) {
    const e = t.getUnresolvedReferences();
    t.markRequested(e), e.forEach((a) => {
      var f;
      (f = vn.get(a)) === null || f === void 0 || f.addAliasedCode(t);
    });
  }
  compile() {
    const t = "imports", e = this.getContext(t);
    this.compiled = new Function(t, "TextDecoder", `return function (buffer, constructorFn) { ${e.code} };`)(e.imports, TextDecoder);
  }
  sizeOf() {
    let t = NaN;
    if (Object.keys(Dn).indexOf(this.type) >= 0)
      t = Dn[this.type];
    else if (this.type === "string" && typeof this.options.length == "number")
      t = this.options.length;
    else if (this.type === "buffer" && typeof this.options.length == "number")
      t = this.options.length;
    else if (this.type === "array" && typeof this.options.length == "number") {
      let e = NaN;
      typeof this.options.type == "string" ? e = Dn[this.options.type] : this.options.type instanceof Se && (e = this.options.type.sizeOf()), t = this.options.length * e;
    } else this.type === "seek" ? t = this.options.length : this.type === "nest" ? t = this.options.type.sizeOf() : this.type || (t = 0);
    return this.next && (t += this.next.sizeOf()), t;
  }
  // Follow the parser chain till the root and start parsing from there
  parse(t) {
    return this.compiled || this.compile(), this.compiled(t, this.constructorFn);
  }
  setNextParser(t, e, a) {
    const f = new Se();
    return f.type = t, f.varName = e, f.options = a, f.endian = this.endian, this.head ? this.head.next = f : this.next = f, this.head = f, this;
  }
  // Call code generator for this parser
  generate(t) {
    if (this.type) {
      switch (this.type) {
        case "uint8":
        case "uint16le":
        case "uint16be":
        case "uint32le":
        case "uint32be":
        case "int8":
        case "int16le":
        case "int16be":
        case "int32le":
        case "int32be":
        case "int64be":
        case "int64le":
        case "uint64be":
        case "uint64le":
        case "floatle":
        case "floatbe":
        case "doublele":
        case "doublebe":
          this.primitiveGenerateN(this.type, t);
          break;
        case "bit":
          this.generateBit(t);
          break;
        case "string":
          this.generateString(t);
          break;
        case "buffer":
          this.generateBuffer(t);
          break;
        case "seek":
          this.generateSeek(t);
          break;
        case "nest":
          this.generateNest(t);
          break;
        case "array":
          this.generateArray(t);
          break;
        case "choice":
          this.generateChoice(t);
          break;
        case "pointer":
          this.generatePointer(t);
          break;
        case "saveOffset":
          this.generateSaveOffset(t);
          break;
        case "wrapper":
          this.generateWrapper(t);
          break;
      }
      this.type !== "bit" && this.generateAssert(t);
    }
    const e = t.generateVariable(this.varName);
    return this.options.formatter && this.type !== "bit" && this.generateFormatter(t, e, this.options.formatter), this.generateNext(t);
  }
  generateAssert(t) {
    if (!this.options.assert)
      return;
    const e = t.generateVariable(this.varName);
    switch (typeof this.options.assert) {
      case "function":
        {
          const a = t.addImport(this.options.assert);
          t.pushCode(`if (!${a}.call(vars, ${e})) {`);
        }
        break;
      case "number":
        t.pushCode(`if (${this.options.assert} !== ${e}) {`);
        break;
      case "string":
        t.pushCode(`if (${JSON.stringify(this.options.assert)} !== ${e}) {`);
        break;
      default:
        throw new Error("assert option must be a string, number or a function.");
    }
    t.generateError(`"Assertion error: ${e} is " + ${JSON.stringify(this.options.assert.toString())}`), t.pushCode("}");
  }
  // Recursively call code generators and append results
  generateNext(t) {
    return this.next && (t = this.next.generate(t)), t;
  }
  generateBit(t) {
    const e = JSON.parse(JSON.stringify(this));
    if (e.options = this.options, e.generateAssert = this.generateAssert.bind(this), e.generateFormatter = this.generateFormatter.bind(this), e.varName = t.generateVariable(e.varName), t.bitFields.push(e), !this.next || this.next && ["bit", "nest"].indexOf(this.next.type) < 0) {
      const a = t.generateTmpVariable();
      t.pushCode(`var ${a} = 0;`);
      const f = (d = 0) => {
        let x = 0;
        for (let C = d; C < t.bitFields.length; C++) {
          const E = t.bitFields[C].options.length;
          if (x + E > 32)
            break;
          x += E;
        }
        return x;
      }, s = (d) => (d <= 8 ? (t.pushCode(`${a} = dataView.getUint8(offset);`), d = 8) : d <= 16 ? (t.pushCode(`${a} = dataView.getUint16(offset);`), d = 16) : d <= 24 ? (t.pushCode(`${a} = (dataView.getUint16(offset) << 8) | dataView.getUint8(offset + 2);`), d = 24) : (t.pushCode(`${a} = dataView.getUint32(offset);`), d = 32), t.pushCode(`offset += ${d / 8};`), d);
      let h = 0;
      const l = this.endian === "be";
      let D = 0, c = 0;
      t.bitFields.forEach((d, x) => {
        let C = d.options.length;
        if (C > c) {
          if (c) {
            const B = -1 >>> 32 - c;
            t.pushCode(`${d.varName} = (${a} & 0x${B.toString(16)}) << ${C - c};`), C -= c;
          }
          h = 0, c = D = s(f(x) - c);
        }
        const E = l ? D - h - C : h, I = -1 >>> 32 - C;
        t.pushCode(`${d.varName} ${C < d.options.length ? "|=" : "="} ${a} >> ${E} & 0x${I.toString(16)};`), d.options.length === 32 && t.pushCode(`${d.varName} >>>= 0`), d.options.assert && d.generateAssert(t), d.options.formatter && d.generateFormatter(t, d.varName, d.options.formatter), h += C, c -= C;
      }), t.bitFields = [];
    }
  }
  generateSeek(t) {
    const e = t.generateOption(this.options.length);
    t.pushCode(`offset += ${e};`);
  }
  generateString(t) {
    const e = t.generateVariable(this.varName), a = t.generateTmpVariable(), f = this.options.encoding, s = f.toLowerCase() === "hex", h = 'b => b.toString(16).padStart(2, "0")';
    if (this.options.length && this.options.zeroTerminated) {
      const l = this.options.length;
      t.pushCode(`var ${a} = offset;`), t.pushCode(`while(dataView.getUint8(offset++) !== 0 && offset - ${a} < ${l});`);
      const D = `offset - ${a} < ${l} ? offset - 1 : offset`;
      t.pushCode(s ? `${e} = Array.from(buffer.subarray(${a}, ${D}), ${h}).join('');` : `${e} = new TextDecoder('${f}').decode(buffer.subarray(${a}, ${D}));`);
    } else if (this.options.length) {
      const l = t.generateOption(this.options.length);
      t.pushCode(s ? `${e} = Array.from(buffer.subarray(offset, offset + ${l}), ${h}).join('');` : `${e} = new TextDecoder('${f}').decode(buffer.subarray(offset, offset + ${l}));`), t.pushCode(`offset += ${l};`);
    } else this.options.zeroTerminated ? (t.pushCode(`var ${a} = offset;`), t.pushCode("while(dataView.getUint8(offset++) !== 0);"), t.pushCode(s ? `${e} = Array.from(buffer.subarray(${a}, offset - 1), ${h}).join('');` : `${e} = new TextDecoder('${f}').decode(buffer.subarray(${a}, offset - 1));`)) : this.options.greedy && (t.pushCode(`var ${a} = offset;`), t.pushCode("while(buffer.length > offset++);"), t.pushCode(s ? `${e} = Array.from(buffer.subarray(${a}, offset), ${h}).join('');` : `${e} = new TextDecoder('${f}').decode(buffer.subarray(${a}, offset));`));
    this.options.stripNull && t.pushCode(`${e} = ${e}.replace(/\\x00+$/g, '')`);
  }
  generateBuffer(t) {
    const e = t.generateVariable(this.varName);
    if (typeof this.options.readUntil == "function") {
      const a = this.options.readUntil, f = t.generateTmpVariable(), s = t.generateTmpVariable();
      t.pushCode(`var ${f} = offset;`), t.pushCode(`var ${s} = 0;`), t.pushCode("while (offset < buffer.length) {"), t.pushCode(`${s} = dataView.getUint8(offset);`);
      const h = t.addImport(a);
      t.pushCode(`if (${h}.call(${t.generateVariable()}, ${s}, buffer.subarray(offset))) break;`), t.pushCode("offset += 1;"), t.pushCode("}"), t.pushCode(`${e} = buffer.subarray(${f}, offset);`);
    } else if (this.options.readUntil === "eof")
      t.pushCode(`${e} = buffer.subarray(offset);`);
    else {
      const a = t.generateOption(this.options.length);
      t.pushCode(`${e} = buffer.subarray(offset, offset + ${a});`), t.pushCode(`offset += ${a};`);
    }
    this.options.clone && t.pushCode(`${e} = buffer.constructor.from(${e});`);
  }
  generateArray(t) {
    const e = t.generateOption(this.options.length), a = t.generateOption(this.options.lengthInBytes), f = this.options.type, s = t.generateTmpVariable(), h = t.generateVariable(this.varName), l = t.generateTmpVariable(), D = this.options.key, c = typeof D == "string";
    if (c ? t.pushCode(`${h} = {};`) : t.pushCode(`${h} = [];`), typeof this.options.readUntil == "function" ? t.pushCode("do {") : this.options.readUntil === "eof" ? t.pushCode(`for (var ${s} = 0; offset < buffer.length; ${s}++) {`) : a !== void 0 ? t.pushCode(`for (var ${s} = offset + ${a}; offset < ${s}; ) {`) : t.pushCode(`for (var ${s} = ${e}; ${s} > 0; ${s}--) {`), typeof f == "string")
      if (vn.get(f)) {
        const d = t.generateTmpVariable();
        if (t.pushCode(`var ${d} = ${Ur + f}(offset, {`), t.useContextVariables) {
          const x = t.generateVariable();
          t.pushCode(`$parent: ${x},`), t.pushCode(`$root: ${x}.$root,`), !this.options.readUntil && a === void 0 && t.pushCode(`$index: ${e} - ${s},`);
        }
        t.pushCode("});"), t.pushCode(`var ${l} = ${d}.result; offset = ${d}.offset;`), f !== this.alias && t.addReference(f);
      } else {
        const d = $a[f], x = Ra[f];
        t.pushCode(`var ${l} = dataView.get${d}(offset, ${x});`), t.pushCode(`offset += ${Dn[f]};`);
      }
    else if (f instanceof Se) {
      t.pushCode(`var ${l} = {};`);
      const d = t.generateVariable();
      t.pushScope(l), t.useContextVariables && (t.pushCode(`${l}.$parent = ${d};`), t.pushCode(`${l}.$root = ${d}.$root;`), !this.options.readUntil && a === void 0 && t.pushCode(`${l}.$index = ${e} - ${s};`)), f.generate(t), t.useContextVariables && (t.pushCode(`delete ${l}.$parent;`), t.pushCode(`delete ${l}.$root;`), t.pushCode(`delete ${l}.$index;`)), t.popScope();
    }
    if (c ? t.pushCode(`${h}[${l}.${D}] = ${l};`) : t.pushCode(`${h}.push(${l});`), t.pushCode("}"), typeof this.options.readUntil == "function") {
      const d = this.options.readUntil, x = t.addImport(d);
      t.pushCode(`while (!${x}.call(${t.generateVariable()}, ${l}, buffer.subarray(offset)));`);
    }
  }
  generateChoiceCase(t, e, a) {
    if (typeof a == "string") {
      const f = t.generateVariable(this.varName);
      if (vn.has(a)) {
        const s = t.generateTmpVariable();
        t.pushCode(`var ${s} = ${Ur + a}(offset, {`), t.useContextVariables && (t.pushCode(`$parent: ${f}.$parent,`), t.pushCode(`$root: ${f}.$root,`)), t.pushCode("});"), t.pushCode(`${f} = ${s}.result; offset = ${s}.offset;`), a !== this.alias && t.addReference(a);
      } else {
        const s = $a[a], h = Ra[a];
        t.pushCode(`${f} = dataView.get${s}(offset, ${h});`), t.pushCode(`offset += ${Dn[a]}`);
      }
    } else a instanceof Se && (t.pushPath(e), a.generate(t), t.popPath(e));
  }
  generateChoice(t) {
    const e = t.generateOption(this.options.tag), a = t.generateVariable(this.varName);
    if (this.varName && (t.pushCode(`${a} = {};`), t.useContextVariables)) {
      const f = t.generateVariable();
      t.pushCode(`${a}.$parent = ${f};`), t.pushCode(`${a}.$root = ${f}.$root;`);
    }
    t.pushCode(`switch(${e}) {`);
    for (const f in this.options.choices) {
      const s = parseInt(f, 10), h = this.options.choices[s];
      t.pushCode(`case ${s}:`), this.generateChoiceCase(t, this.varName, h), t.pushCode("break;");
    }
    t.pushCode("default:"), this.options.defaultChoice ? this.generateChoiceCase(t, this.varName, this.options.defaultChoice) : t.generateError(`"Met undefined tag value " + ${e} + " at choice"`), t.pushCode("}"), this.varName && t.useContextVariables && (t.pushCode(`delete ${a}.$parent;`), t.pushCode(`delete ${a}.$root;`));
  }
  generateNest(t) {
    const e = t.generateVariable(this.varName);
    if (this.options.type instanceof Se) {
      if (this.varName && (t.pushCode(`${e} = {};`), t.useContextVariables)) {
        const a = t.generateVariable();
        t.pushCode(`${e}.$parent = ${a};`), t.pushCode(`${e}.$root = ${a}.$root;`);
      }
      t.pushPath(this.varName), this.options.type.generate(t), t.popPath(this.varName), this.varName && t.useContextVariables && t.useContextVariables && (t.pushCode(`delete ${e}.$parent;`), t.pushCode(`delete ${e}.$root;`));
    } else if (vn.has(this.options.type)) {
      const a = t.generateTmpVariable();
      if (t.pushCode(`var ${a} = ${Ur + this.options.type}(offset, {`), t.useContextVariables) {
        const f = t.generateVariable();
        t.pushCode(`$parent: ${f},`), t.pushCode(`$root: ${f}.$root,`);
      }
      t.pushCode("});"), t.pushCode(`${e} = ${a}.result; offset = ${a}.offset;`), this.options.type !== this.alias && t.addReference(this.options.type);
    }
  }
  generateWrapper(t) {
    const e = t.generateVariable(this.varName), a = t.generateTmpVariable();
    if (typeof this.options.readUntil == "function") {
      const D = this.options.readUntil, c = t.generateTmpVariable(), d = t.generateTmpVariable();
      t.pushCode(`var ${c} = offset;`), t.pushCode(`var ${d} = 0;`), t.pushCode("while (offset < buffer.length) {"), t.pushCode(`${d} = dataView.getUint8(offset);`);
      const x = t.addImport(D);
      t.pushCode(`if (${x}.call(${t.generateVariable()}, ${d}, buffer.subarray(offset))) break;`), t.pushCode("offset += 1;"), t.pushCode("}"), t.pushCode(`${a} = buffer.subarray(${c}, offset);`);
    } else if (this.options.readUntil === "eof")
      t.pushCode(`${a} = buffer.subarray(offset);`);
    else {
      const D = t.generateOption(this.options.length);
      t.pushCode(`${a} = buffer.subarray(offset, offset + ${D});`), t.pushCode(`offset += ${D};`);
    }
    this.options.clone && t.pushCode(`${a} = buffer.constructor.from(${a});`);
    const f = t.generateTmpVariable(), s = t.generateTmpVariable(), h = t.generateTmpVariable(), l = t.addImport(this.options.wrapper);
    if (t.pushCode(`${a} = ${l}.call(this, ${a}).subarray(0);`), t.pushCode(`var ${f} = buffer;`), t.pushCode(`var ${s} = offset;`), t.pushCode(`var ${h} = dataView;`), t.pushCode(`buffer = ${a};`), t.pushCode("offset = 0;"), t.pushCode("dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);"), this.options.type instanceof Se)
      this.varName && t.pushCode(`${e} = {};`), t.pushPath(this.varName), this.options.type.generate(t), t.popPath(this.varName);
    else if (vn.has(this.options.type)) {
      const D = t.generateTmpVariable();
      t.pushCode(`var ${D} = ${Ur + this.options.type}(0);`), t.pushCode(`${e} = ${D}.result;`), this.options.type !== this.alias && t.addReference(this.options.type);
    }
    t.pushCode(`buffer = ${f};`), t.pushCode(`dataView = ${h};`), t.pushCode(`offset = ${s};`);
  }
  generateFormatter(t, e, a) {
    if (typeof a == "function") {
      const f = t.addImport(a);
      t.pushCode(`${e} = ${f}.call(${t.generateVariable()}, ${e});`);
    }
  }
  generatePointer(t) {
    const e = this.options.type, a = t.generateOption(this.options.offset), f = t.generateTmpVariable(), s = t.generateVariable(this.varName);
    if (t.pushCode(`var ${f} = offset;`), t.pushCode(`offset = ${a};`), this.options.type instanceof Se) {
      if (t.pushCode(`${s} = {};`), t.useContextVariables) {
        const h = t.generateVariable();
        t.pushCode(`${s}.$parent = ${h};`), t.pushCode(`${s}.$root = ${h}.$root;`);
      }
      t.pushPath(this.varName), this.options.type.generate(t), t.popPath(this.varName), t.useContextVariables && (t.pushCode(`delete ${s}.$parent;`), t.pushCode(`delete ${s}.$root;`));
    } else if (vn.has(this.options.type)) {
      const h = t.generateTmpVariable();
      if (t.pushCode(`var ${h} = ${Ur + this.options.type}(offset, {`), t.useContextVariables) {
        const l = t.generateVariable();
        t.pushCode(`$parent: ${l},`), t.pushCode(`$root: ${l}.$root,`);
      }
      t.pushCode("});"), t.pushCode(`${s} = ${h}.result; offset = ${h}.offset;`), this.options.type !== this.alias && t.addReference(this.options.type);
    } else if (Object.keys(Dn).indexOf(this.options.type) >= 0) {
      const h = $a[e], l = Ra[e];
      t.pushCode(`${s} = dataView.get${h}(offset, ${l});`), t.pushCode(`offset += ${Dn[e]};`);
    }
    t.pushCode(`offset = ${f};`);
  }
  generateSaveOffset(t) {
    const e = t.generateVariable(this.varName);
    t.pushCode(`${e} = offset`);
  }
}
class ki {
  constructor(t) {
    this.ranges = t;
  }
  get min() {
    return this.ranges[0].min;
  }
  get max() {
    return this.ranges[this.ranges.length - 1].max;
  }
  contains(t) {
    for (const e of this.ranges)
      if (e.min <= t && e.max >= t)
        return !0;
    return !1;
  }
  isContiguous() {
    return this.ranges.length > 1;
  }
  getRanges() {
    return this.ranges.map((t) => new ki([{ min: t.min, max: t.max }]));
  }
  toString() {
    return this.ranges.map((t) => `[${t.min}-${t.max}]`).join(",");
  }
  union(t) {
    const e = [...this.getRanges(), ...t.getRanges()].sort((s, h) => s.min < h.min ? -1 : s.min > h.min ? 1 : s.max < h.max ? -1 : h.max > s.max ? 1 : 0), a = [];
    let f = e[0];
    for (const s of e)
      s.min > f.max + 1 ? (a.push(f), f = s) : s.max > f.max && (f = new ki([{ min: f.min, max: s.max }]));
    return a.push(f), a.length === 1 ? a[0] : new ki(a);
  }
}
function Pi(n) {
  let t = n.length;
  for (; --t >= 0; )
    n[t] = 0;
}
const hC = 3, cC = 258, C1 = 29, dC = 256, pC = dC + 1 + C1, A1 = 30, gC = 512, _C = new Array((pC + 2) * 2);
Pi(_C);
const wC = new Array(A1 * 2);
Pi(wC);
const bC = new Array(gC);
Pi(bC);
const vC = new Array(cC - hC + 1);
Pi(vC);
const DC = new Array(C1);
Pi(DC);
const mC = new Array(A1);
Pi(mC);
const yC = (n, t, e, a) => {
  let f = n & 65535 | 0, s = n >>> 16 & 65535 | 0, h = 0;
  for (; e !== 0; ) {
    h = e > 2e3 ? 2e3 : e, e -= h;
    do
      f = f + t[a++] | 0, s = s + f | 0;
    while (--h);
    f %= 65521, s %= 65521;
  }
  return f | s << 16 | 0;
};
var Ff = yC;
const EC = () => {
  let n, t = [];
  for (var e = 0; e < 256; e++) {
    n = e;
    for (var a = 0; a < 8; a++)
      n = n & 1 ? 3988292384 ^ n >>> 1 : n >>> 1;
    t[e] = n;
  }
  return t;
}, CC = new Uint32Array(EC()), AC = (n, t, e, a) => {
  const f = CC, s = a + e;
  n ^= -1;
  for (let h = a; h < s; h++)
    n = n >>> 8 ^ f[(n ^ t[h]) & 255];
  return n ^ -1;
};
var $n = AC, Bf = {
  2: "need dictionary",
  /* Z_NEED_DICT       2  */
  1: "stream end",
  /* Z_STREAM_END      1  */
  0: "",
  /* Z_OK              0  */
  "-1": "file error",
  /* Z_ERRNO         (-1) */
  "-2": "stream error",
  /* Z_STREAM_ERROR  (-2) */
  "-3": "data error",
  /* Z_DATA_ERROR    (-3) */
  "-4": "insufficient memory",
  /* Z_MEM_ERROR     (-4) */
  "-5": "buffer error",
  /* Z_BUF_ERROR     (-5) */
  "-6": "incompatible version"
  /* Z_VERSION_ERROR (-6) */
}, x1 = {
  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH: 0,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  /* The deflate compression method */
  Z_DEFLATED: 8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
const xC = (n, t) => Object.prototype.hasOwnProperty.call(n, t);
var FC = function(n) {
  const t = Array.prototype.slice.call(arguments, 1);
  for (; t.length; ) {
    const e = t.shift();
    if (e) {
      if (typeof e != "object")
        throw new TypeError(e + "must be non-object");
      for (const a in e)
        xC(e, a) && (n[a] = e[a]);
    }
  }
  return n;
}, BC = (n) => {
  let t = 0;
  for (let a = 0, f = n.length; a < f; a++)
    t += n[a].length;
  const e = new Uint8Array(t);
  for (let a = 0, f = 0, s = n.length; a < s; a++) {
    let h = n[a];
    e.set(h, f), f += h.length;
  }
  return e;
}, F1 = {
  assign: FC,
  flattenChunks: BC
};
let B1 = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  B1 = !1;
}
const Eu = new Uint8Array(256);
for (let n = 0; n < 256; n++)
  Eu[n] = n >= 252 ? 6 : n >= 248 ? 5 : n >= 240 ? 4 : n >= 224 ? 3 : n >= 192 ? 2 : 1;
Eu[254] = Eu[254] = 1;
var SC = (n) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(n);
  let t, e, a, f, s, h = n.length, l = 0;
  for (f = 0; f < h; f++)
    e = n.charCodeAt(f), (e & 64512) === 55296 && f + 1 < h && (a = n.charCodeAt(f + 1), (a & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (a - 56320), f++)), l += e < 128 ? 1 : e < 2048 ? 2 : e < 65536 ? 3 : 4;
  for (t = new Uint8Array(l), s = 0, f = 0; s < l; f++)
    e = n.charCodeAt(f), (e & 64512) === 55296 && f + 1 < h && (a = n.charCodeAt(f + 1), (a & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (a - 56320), f++)), e < 128 ? t[s++] = e : e < 2048 ? (t[s++] = 192 | e >>> 6, t[s++] = 128 | e & 63) : e < 65536 ? (t[s++] = 224 | e >>> 12, t[s++] = 128 | e >>> 6 & 63, t[s++] = 128 | e & 63) : (t[s++] = 240 | e >>> 18, t[s++] = 128 | e >>> 12 & 63, t[s++] = 128 | e >>> 6 & 63, t[s++] = 128 | e & 63);
  return t;
};
const IC = (n, t) => {
  if (t < 65534 && n.subarray && B1)
    return String.fromCharCode.apply(null, n.length === t ? n : n.subarray(0, t));
  let e = "";
  for (let a = 0; a < t; a++)
    e += String.fromCharCode(n[a]);
  return e;
};
var kC = (n, t) => {
  const e = t || n.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode)
    return new TextDecoder().decode(n.subarray(0, t));
  let a, f;
  const s = new Array(e * 2);
  for (f = 0, a = 0; a < e; ) {
    let h = n[a++];
    if (h < 128) {
      s[f++] = h;
      continue;
    }
    let l = Eu[h];
    if (l > 4) {
      s[f++] = 65533, a += l - 1;
      continue;
    }
    for (h &= l === 2 ? 31 : l === 3 ? 15 : 7; l > 1 && a < e; )
      h = h << 6 | n[a++] & 63, l--;
    if (l > 1) {
      s[f++] = 65533;
      continue;
    }
    h < 65536 ? s[f++] = h : (h -= 65536, s[f++] = 55296 | h >> 10 & 1023, s[f++] = 56320 | h & 1023);
  }
  return IC(s, f);
}, TC = (n, t) => {
  t = t || n.length, t > n.length && (t = n.length);
  let e = t - 1;
  for (; e >= 0 && (n[e] & 192) === 128; )
    e--;
  return e < 0 || e === 0 ? t : e + Eu[n[e]] > t ? e : t;
}, Sf = {
  string2buf: SC,
  buf2string: kC,
  utf8border: TC
};
function $C() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var RC = $C;
const Na = 16209, NC = 16191;
var LC = function(t, e) {
  let a, f, s, h, l, D, c, d, x, C, E, I, B, M, T, G, P, $, L, Q, z, Z, J, ee;
  const K = t.state;
  a = t.next_in, J = t.input, f = a + (t.avail_in - 5), s = t.next_out, ee = t.output, h = s - (e - t.avail_out), l = s + (t.avail_out - 257), D = K.dmax, c = K.wsize, d = K.whave, x = K.wnext, C = K.window, E = K.hold, I = K.bits, B = K.lencode, M = K.distcode, T = (1 << K.lenbits) - 1, G = (1 << K.distbits) - 1;
  e:
    do {
      I < 15 && (E += J[a++] << I, I += 8, E += J[a++] << I, I += 8), P = B[E & T];
      t:
        for (; ; ) {
          if ($ = P >>> 24, E >>>= $, I -= $, $ = P >>> 16 & 255, $ === 0)
            ee[s++] = P & 65535;
          else if ($ & 16) {
            L = P & 65535, $ &= 15, $ && (I < $ && (E += J[a++] << I, I += 8), L += E & (1 << $) - 1, E >>>= $, I -= $), I < 15 && (E += J[a++] << I, I += 8, E += J[a++] << I, I += 8), P = M[E & G];
            n:
              for (; ; ) {
                if ($ = P >>> 24, E >>>= $, I -= $, $ = P >>> 16 & 255, $ & 16) {
                  if (Q = P & 65535, $ &= 15, I < $ && (E += J[a++] << I, I += 8, I < $ && (E += J[a++] << I, I += 8)), Q += E & (1 << $) - 1, Q > D) {
                    t.msg = "invalid distance too far back", K.mode = Na;
                    break e;
                  }
                  if (E >>>= $, I -= $, $ = s - h, Q > $) {
                    if ($ = Q - $, $ > d && K.sane) {
                      t.msg = "invalid distance too far back", K.mode = Na;
                      break e;
                    }
                    if (z = 0, Z = C, x === 0) {
                      if (z += c - $, $ < L) {
                        L -= $;
                        do
                          ee[s++] = C[z++];
                        while (--$);
                        z = s - Q, Z = ee;
                      }
                    } else if (x < $) {
                      if (z += c + x - $, $ -= x, $ < L) {
                        L -= $;
                        do
                          ee[s++] = C[z++];
                        while (--$);
                        if (z = 0, x < L) {
                          $ = x, L -= $;
                          do
                            ee[s++] = C[z++];
                          while (--$);
                          z = s - Q, Z = ee;
                        }
                      }
                    } else if (z += x - $, $ < L) {
                      L -= $;
                      do
                        ee[s++] = C[z++];
                      while (--$);
                      z = s - Q, Z = ee;
                    }
                    for (; L > 2; )
                      ee[s++] = Z[z++], ee[s++] = Z[z++], ee[s++] = Z[z++], L -= 3;
                    L && (ee[s++] = Z[z++], L > 1 && (ee[s++] = Z[z++]));
                  } else {
                    z = s - Q;
                    do
                      ee[s++] = ee[z++], ee[s++] = ee[z++], ee[s++] = ee[z++], L -= 3;
                    while (L > 2);
                    L && (ee[s++] = ee[z++], L > 1 && (ee[s++] = ee[z++]));
                  }
                } else if ($ & 64) {
                  t.msg = "invalid distance code", K.mode = Na;
                  break e;
                } else {
                  P = M[(P & 65535) + (E & (1 << $) - 1)];
                  continue n;
                }
                break;
              }
          } else if ($ & 64)
            if ($ & 32) {
              K.mode = NC;
              break e;
            } else {
              t.msg = "invalid literal/length code", K.mode = Na;
              break e;
            }
          else {
            P = B[(P & 65535) + (E & (1 << $) - 1)];
            continue t;
          }
          break;
        }
    } while (a < f && s < l);
  L = I >> 3, a -= L, I -= L << 3, E &= (1 << I) - 1, t.next_in = a, t.next_out = s, t.avail_in = a < f ? 5 + (f - a) : 5 - (a - f), t.avail_out = s < l ? 257 + (l - s) : 257 - (s - l), K.hold = E, K.bits = I;
};
const yi = 15, N0 = 852, L0 = 592, O0 = 0, tf = 1, P0 = 2, OC = new Uint16Array([
  /* Length codes 257..285 base */
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
]), PC = new Uint8Array([
  /* Length codes 257..285 extra */
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  72,
  78
]), MC = new Uint16Array([
  /* Distance codes 0..29 base */
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
]), UC = new Uint8Array([
  /* Distance codes 0..29 extra */
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
]), zC = (n, t, e, a, f, s, h, l) => {
  const D = l.bits;
  let c = 0, d = 0, x = 0, C = 0, E = 0, I = 0, B = 0, M = 0, T = 0, G = 0, P, $, L, Q, z, Z = null, J;
  const ee = new Uint16Array(yi + 1), K = new Uint16Array(yi + 1);
  let ie = null, Ce, be, Pe;
  for (c = 0; c <= yi; c++)
    ee[c] = 0;
  for (d = 0; d < a; d++)
    ee[t[e + d]]++;
  for (E = D, C = yi; C >= 1 && ee[C] === 0; C--)
    ;
  if (E > C && (E = C), C === 0)
    return f[s++] = 1 << 24 | 64 << 16 | 0, f[s++] = 1 << 24 | 64 << 16 | 0, l.bits = 1, 0;
  for (x = 1; x < C && ee[x] === 0; x++)
    ;
  for (E < x && (E = x), M = 1, c = 1; c <= yi; c++)
    if (M <<= 1, M -= ee[c], M < 0)
      return -1;
  if (M > 0 && (n === O0 || C !== 1))
    return -1;
  for (K[1] = 0, c = 1; c < yi; c++)
    K[c + 1] = K[c] + ee[c];
  for (d = 0; d < a; d++)
    t[e + d] !== 0 && (h[K[t[e + d]]++] = d);
  if (n === O0 ? (Z = ie = h, J = 20) : n === tf ? (Z = OC, ie = PC, J = 257) : (Z = MC, ie = UC, J = 0), G = 0, d = 0, c = x, z = s, I = E, B = 0, L = -1, T = 1 << E, Q = T - 1, n === tf && T > N0 || n === P0 && T > L0)
    return 1;
  for (; ; ) {
    Ce = c - B, h[d] + 1 < J ? (be = 0, Pe = h[d]) : h[d] >= J ? (be = ie[h[d] - J], Pe = Z[h[d] - J]) : (be = 96, Pe = 0), P = 1 << c - B, $ = 1 << I, x = $;
    do
      $ -= P, f[z + (G >> B) + $] = Ce << 24 | be << 16 | Pe | 0;
    while ($ !== 0);
    for (P = 1 << c - 1; G & P; )
      P >>= 1;
    if (P !== 0 ? (G &= P - 1, G += P) : G = 0, d++, --ee[c] === 0) {
      if (c === C)
        break;
      c = t[e + h[d]];
    }
    if (c > E && (G & Q) !== L) {
      for (B === 0 && (B = E), z += x, I = c - B, M = 1 << I; I + B < C && (M -= ee[I + B], !(M <= 0)); )
        I++, M <<= 1;
      if (T += 1 << I, n === tf && T > N0 || n === P0 && T > L0)
        return 1;
      L = G & Q, f[L] = E << 24 | I << 16 | z - s | 0;
    }
  }
  return G !== 0 && (f[z + G] = c - B << 24 | 64 << 16 | 0), l.bits = E, 0;
};
var gu = zC;
const qC = 0, S1 = 1, I1 = 2, {
  Z_FINISH: M0,
  Z_BLOCK: GC,
  Z_TREES: La,
  Z_OK: Jr,
  Z_STREAM_END: WC,
  Z_NEED_DICT: HC,
  Z_STREAM_ERROR: dn,
  Z_DATA_ERROR: k1,
  Z_MEM_ERROR: T1,
  Z_BUF_ERROR: ZC,
  Z_DEFLATED: U0
} = x1, ds = 16180, z0 = 16181, q0 = 16182, G0 = 16183, W0 = 16184, H0 = 16185, Z0 = 16186, V0 = 16187, X0 = 16188, K0 = 16189, ns = 16190, jn = 16191, nf = 16192, Y0 = 16193, rf = 16194, Q0 = 16195, J0 = 16196, j0 = 16197, ed = 16198, Oa = 16199, Pa = 16200, td = 16201, nd = 16202, rd = 16203, id = 16204, ud = 16205, uf = 16206, ad = 16207, sd = 16208, Ye = 16209, $1 = 16210, R1 = 16211, VC = 852, XC = 592, KC = 15, YC = KC, od = (n) => (n >>> 24 & 255) + (n >>> 8 & 65280) + ((n & 65280) << 8) + ((n & 255) << 24);
function QC() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const ri = (n) => {
  if (!n)
    return 1;
  const t = n.state;
  return !t || t.strm !== n || t.mode < ds || t.mode > R1 ? 1 : 0;
}, N1 = (n) => {
  if (ri(n))
    return dn;
  const t = n.state;
  return n.total_in = n.total_out = t.total = 0, n.msg = "", t.wrap && (n.adler = t.wrap & 1), t.mode = ds, t.last = 0, t.havedict = 0, t.flags = -1, t.dmax = 32768, t.head = null, t.hold = 0, t.bits = 0, t.lencode = t.lendyn = new Int32Array(VC), t.distcode = t.distdyn = new Int32Array(XC), t.sane = 1, t.back = -1, Jr;
}, L1 = (n) => {
  if (ri(n))
    return dn;
  const t = n.state;
  return t.wsize = 0, t.whave = 0, t.wnext = 0, N1(n);
}, O1 = (n, t) => {
  let e;
  if (ri(n))
    return dn;
  const a = n.state;
  return t < 0 ? (e = 0, t = -t) : (e = (t >> 4) + 5, t < 48 && (t &= 15)), t && (t < 8 || t > 15) ? dn : (a.window !== null && a.wbits !== t && (a.window = null), a.wrap = e, a.wbits = t, L1(n));
}, P1 = (n, t) => {
  if (!n)
    return dn;
  const e = new QC();
  n.state = e, e.strm = n, e.window = null, e.mode = ds;
  const a = O1(n, t);
  return a !== Jr && (n.state = null), a;
}, JC = (n) => P1(n, YC);
let fd = !0, af, sf;
const jC = (n) => {
  if (fd) {
    af = new Int32Array(512), sf = new Int32Array(32);
    let t = 0;
    for (; t < 144; )
      n.lens[t++] = 8;
    for (; t < 256; )
      n.lens[t++] = 9;
    for (; t < 280; )
      n.lens[t++] = 7;
    for (; t < 288; )
      n.lens[t++] = 8;
    for (gu(S1, n.lens, 0, 288, af, 0, n.work, { bits: 9 }), t = 0; t < 32; )
      n.lens[t++] = 5;
    gu(I1, n.lens, 0, 32, sf, 0, n.work, { bits: 5 }), fd = !1;
  }
  n.lencode = af, n.lenbits = 9, n.distcode = sf, n.distbits = 5;
}, M1 = (n, t, e, a) => {
  let f;
  const s = n.state;
  return s.window === null && (s.wsize = 1 << s.wbits, s.wnext = 0, s.whave = 0, s.window = new Uint8Array(s.wsize)), a >= s.wsize ? (s.window.set(t.subarray(e - s.wsize, e), 0), s.wnext = 0, s.whave = s.wsize) : (f = s.wsize - s.wnext, f > a && (f = a), s.window.set(t.subarray(e - a, e - a + f), s.wnext), a -= f, a ? (s.window.set(t.subarray(e - a, e), 0), s.wnext = a, s.whave = s.wsize) : (s.wnext += f, s.wnext === s.wsize && (s.wnext = 0), s.whave < s.wsize && (s.whave += f))), 0;
}, eA = (n, t) => {
  let e, a, f, s, h, l, D, c, d, x, C, E, I, B, M = 0, T, G, P, $, L, Q, z, Z;
  const J = new Uint8Array(4);
  let ee, K;
  const ie = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (ri(n) || !n.output || !n.input && n.avail_in !== 0)
    return dn;
  e = n.state, e.mode === jn && (e.mode = nf), h = n.next_out, f = n.output, D = n.avail_out, s = n.next_in, a = n.input, l = n.avail_in, c = e.hold, d = e.bits, x = l, C = D, Z = Jr;
  e:
    for (; ; )
      switch (e.mode) {
        case ds:
          if (e.wrap === 0) {
            e.mode = nf;
            break;
          }
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if (e.wrap & 2 && c === 35615) {
            e.wbits === 0 && (e.wbits = 15), e.check = 0, J[0] = c & 255, J[1] = c >>> 8 & 255, e.check = $n(e.check, J, 2, 0), c = 0, d = 0, e.mode = z0;
            break;
          }
          if (e.head && (e.head.done = !1), !(e.wrap & 1) || /* check if zlib header allowed */
          (((c & 255) << 8) + (c >> 8)) % 31) {
            n.msg = "incorrect header check", e.mode = Ye;
            break;
          }
          if ((c & 15) !== U0) {
            n.msg = "unknown compression method", e.mode = Ye;
            break;
          }
          if (c >>>= 4, d -= 4, z = (c & 15) + 8, e.wbits === 0 && (e.wbits = z), z > 15 || z > e.wbits) {
            n.msg = "invalid window size", e.mode = Ye;
            break;
          }
          e.dmax = 1 << e.wbits, e.flags = 0, n.adler = e.check = 1, e.mode = c & 512 ? K0 : jn, c = 0, d = 0;
          break;
        case z0:
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if (e.flags = c, (e.flags & 255) !== U0) {
            n.msg = "unknown compression method", e.mode = Ye;
            break;
          }
          if (e.flags & 57344) {
            n.msg = "unknown header flags set", e.mode = Ye;
            break;
          }
          e.head && (e.head.text = c >> 8 & 1), e.flags & 512 && e.wrap & 4 && (J[0] = c & 255, J[1] = c >>> 8 & 255, e.check = $n(e.check, J, 2, 0)), c = 0, d = 0, e.mode = q0;
        case q0:
          for (; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          e.head && (e.head.time = c), e.flags & 512 && e.wrap & 4 && (J[0] = c & 255, J[1] = c >>> 8 & 255, J[2] = c >>> 16 & 255, J[3] = c >>> 24 & 255, e.check = $n(e.check, J, 4, 0)), c = 0, d = 0, e.mode = G0;
        case G0:
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          e.head && (e.head.xflags = c & 255, e.head.os = c >> 8), e.flags & 512 && e.wrap & 4 && (J[0] = c & 255, J[1] = c >>> 8 & 255, e.check = $n(e.check, J, 2, 0)), c = 0, d = 0, e.mode = W0;
        case W0:
          if (e.flags & 1024) {
            for (; d < 16; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            e.length = c, e.head && (e.head.extra_len = c), e.flags & 512 && e.wrap & 4 && (J[0] = c & 255, J[1] = c >>> 8 & 255, e.check = $n(e.check, J, 2, 0)), c = 0, d = 0;
          } else e.head && (e.head.extra = null);
          e.mode = H0;
        case H0:
          if (e.flags & 1024 && (E = e.length, E > l && (E = l), E && (e.head && (z = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Uint8Array(e.head.extra_len)), e.head.extra.set(
            a.subarray(
              s,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              s + E
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            z
          )), e.flags & 512 && e.wrap & 4 && (e.check = $n(e.check, a, E, s)), l -= E, s += E, e.length -= E), e.length))
            break e;
          e.length = 0, e.mode = Z0;
        case Z0:
          if (e.flags & 2048) {
            if (l === 0)
              break e;
            E = 0;
            do
              z = a[s + E++], e.head && z && e.length < 65536 && (e.head.name += String.fromCharCode(z));
            while (z && E < l);
            if (e.flags & 512 && e.wrap & 4 && (e.check = $n(e.check, a, E, s)), l -= E, s += E, z)
              break e;
          } else e.head && (e.head.name = null);
          e.length = 0, e.mode = V0;
        case V0:
          if (e.flags & 4096) {
            if (l === 0)
              break e;
            E = 0;
            do
              z = a[s + E++], e.head && z && e.length < 65536 && (e.head.comment += String.fromCharCode(z));
            while (z && E < l);
            if (e.flags & 512 && e.wrap & 4 && (e.check = $n(e.check, a, E, s)), l -= E, s += E, z)
              break e;
          } else e.head && (e.head.comment = null);
          e.mode = X0;
        case X0:
          if (e.flags & 512) {
            for (; d < 16; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            if (e.wrap & 4 && c !== (e.check & 65535)) {
              n.msg = "header crc mismatch", e.mode = Ye;
              break;
            }
            c = 0, d = 0;
          }
          e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), n.adler = e.check = 0, e.mode = jn;
          break;
        case K0:
          for (; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          n.adler = e.check = od(c), c = 0, d = 0, e.mode = ns;
        case ns:
          if (e.havedict === 0)
            return n.next_out = h, n.avail_out = D, n.next_in = s, n.avail_in = l, e.hold = c, e.bits = d, HC;
          n.adler = e.check = 1, e.mode = jn;
        case jn:
          if (t === GC || t === La)
            break e;
        case nf:
          if (e.last) {
            c >>>= d & 7, d -= d & 7, e.mode = uf;
            break;
          }
          for (; d < 3; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          switch (e.last = c & 1, c >>>= 1, d -= 1, c & 3) {
            case 0:
              e.mode = Y0;
              break;
            case 1:
              if (jC(e), e.mode = Oa, t === La) {
                c >>>= 2, d -= 2;
                break e;
              }
              break;
            case 2:
              e.mode = J0;
              break;
            case 3:
              n.msg = "invalid block type", e.mode = Ye;
          }
          c >>>= 2, d -= 2;
          break;
        case Y0:
          for (c >>>= d & 7, d -= d & 7; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if ((c & 65535) !== (c >>> 16 ^ 65535)) {
            n.msg = "invalid stored block lengths", e.mode = Ye;
            break;
          }
          if (e.length = c & 65535, c = 0, d = 0, e.mode = rf, t === La)
            break e;
        case rf:
          e.mode = Q0;
        case Q0:
          if (E = e.length, E) {
            if (E > l && (E = l), E > D && (E = D), E === 0)
              break e;
            f.set(a.subarray(s, s + E), h), l -= E, s += E, D -= E, h += E, e.length -= E;
            break;
          }
          e.mode = jn;
          break;
        case J0:
          for (; d < 14; ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if (e.nlen = (c & 31) + 257, c >>>= 5, d -= 5, e.ndist = (c & 31) + 1, c >>>= 5, d -= 5, e.ncode = (c & 15) + 4, c >>>= 4, d -= 4, e.nlen > 286 || e.ndist > 30) {
            n.msg = "too many length or distance symbols", e.mode = Ye;
            break;
          }
          e.have = 0, e.mode = j0;
        case j0:
          for (; e.have < e.ncode; ) {
            for (; d < 3; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            e.lens[ie[e.have++]] = c & 7, c >>>= 3, d -= 3;
          }
          for (; e.have < 19; )
            e.lens[ie[e.have++]] = 0;
          if (e.lencode = e.lendyn, e.lenbits = 7, ee = { bits: e.lenbits }, Z = gu(qC, e.lens, 0, 19, e.lencode, 0, e.work, ee), e.lenbits = ee.bits, Z) {
            n.msg = "invalid code lengths set", e.mode = Ye;
            break;
          }
          e.have = 0, e.mode = ed;
        case ed:
          for (; e.have < e.nlen + e.ndist; ) {
            for (; M = e.lencode[c & (1 << e.lenbits) - 1], T = M >>> 24, G = M >>> 16 & 255, P = M & 65535, !(T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            if (P < 16)
              c >>>= T, d -= T, e.lens[e.have++] = P;
            else {
              if (P === 16) {
                for (K = T + 2; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[s++] << d, d += 8;
                }
                if (c >>>= T, d -= T, e.have === 0) {
                  n.msg = "invalid bit length repeat", e.mode = Ye;
                  break;
                }
                z = e.lens[e.have - 1], E = 3 + (c & 3), c >>>= 2, d -= 2;
              } else if (P === 17) {
                for (K = T + 3; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[s++] << d, d += 8;
                }
                c >>>= T, d -= T, z = 0, E = 3 + (c & 7), c >>>= 3, d -= 3;
              } else {
                for (K = T + 7; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[s++] << d, d += 8;
                }
                c >>>= T, d -= T, z = 0, E = 11 + (c & 127), c >>>= 7, d -= 7;
              }
              if (e.have + E > e.nlen + e.ndist) {
                n.msg = "invalid bit length repeat", e.mode = Ye;
                break;
              }
              for (; E--; )
                e.lens[e.have++] = z;
            }
          }
          if (e.mode === Ye)
            break;
          if (e.lens[256] === 0) {
            n.msg = "invalid code -- missing end-of-block", e.mode = Ye;
            break;
          }
          if (e.lenbits = 9, ee = { bits: e.lenbits }, Z = gu(S1, e.lens, 0, e.nlen, e.lencode, 0, e.work, ee), e.lenbits = ee.bits, Z) {
            n.msg = "invalid literal/lengths set", e.mode = Ye;
            break;
          }
          if (e.distbits = 6, e.distcode = e.distdyn, ee = { bits: e.distbits }, Z = gu(I1, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, ee), e.distbits = ee.bits, Z) {
            n.msg = "invalid distances set", e.mode = Ye;
            break;
          }
          if (e.mode = Oa, t === La)
            break e;
        case Oa:
          e.mode = Pa;
        case Pa:
          if (l >= 6 && D >= 258) {
            n.next_out = h, n.avail_out = D, n.next_in = s, n.avail_in = l, e.hold = c, e.bits = d, LC(n, C), h = n.next_out, f = n.output, D = n.avail_out, s = n.next_in, a = n.input, l = n.avail_in, c = e.hold, d = e.bits, e.mode === jn && (e.back = -1);
            break;
          }
          for (e.back = 0; M = e.lencode[c & (1 << e.lenbits) - 1], T = M >>> 24, G = M >>> 16 & 255, P = M & 65535, !(T <= d); ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if (G && !(G & 240)) {
            for ($ = T, L = G, Q = P; M = e.lencode[Q + ((c & (1 << $ + L) - 1) >> $)], T = M >>> 24, G = M >>> 16 & 255, P = M & 65535, !($ + T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            c >>>= $, d -= $, e.back += $;
          }
          if (c >>>= T, d -= T, e.back += T, e.length = P, G === 0) {
            e.mode = ud;
            break;
          }
          if (G & 32) {
            e.back = -1, e.mode = jn;
            break;
          }
          if (G & 64) {
            n.msg = "invalid literal/length code", e.mode = Ye;
            break;
          }
          e.extra = G & 15, e.mode = td;
        case td:
          if (e.extra) {
            for (K = e.extra; d < K; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            e.length += c & (1 << e.extra) - 1, c >>>= e.extra, d -= e.extra, e.back += e.extra;
          }
          e.was = e.length, e.mode = nd;
        case nd:
          for (; M = e.distcode[c & (1 << e.distbits) - 1], T = M >>> 24, G = M >>> 16 & 255, P = M & 65535, !(T <= d); ) {
            if (l === 0)
              break e;
            l--, c += a[s++] << d, d += 8;
          }
          if (!(G & 240)) {
            for ($ = T, L = G, Q = P; M = e.distcode[Q + ((c & (1 << $ + L) - 1) >> $)], T = M >>> 24, G = M >>> 16 & 255, P = M & 65535, !($ + T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            c >>>= $, d -= $, e.back += $;
          }
          if (c >>>= T, d -= T, e.back += T, G & 64) {
            n.msg = "invalid distance code", e.mode = Ye;
            break;
          }
          e.offset = P, e.extra = G & 15, e.mode = rd;
        case rd:
          if (e.extra) {
            for (K = e.extra; d < K; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            e.offset += c & (1 << e.extra) - 1, c >>>= e.extra, d -= e.extra, e.back += e.extra;
          }
          if (e.offset > e.dmax) {
            n.msg = "invalid distance too far back", e.mode = Ye;
            break;
          }
          e.mode = id;
        case id:
          if (D === 0)
            break e;
          if (E = C - D, e.offset > E) {
            if (E = e.offset - E, E > e.whave && e.sane) {
              n.msg = "invalid distance too far back", e.mode = Ye;
              break;
            }
            E > e.wnext ? (E -= e.wnext, I = e.wsize - E) : I = e.wnext - E, E > e.length && (E = e.length), B = e.window;
          } else
            B = f, I = h - e.offset, E = e.length;
          E > D && (E = D), D -= E, e.length -= E;
          do
            f[h++] = B[I++];
          while (--E);
          e.length === 0 && (e.mode = Pa);
          break;
        case ud:
          if (D === 0)
            break e;
          f[h++] = e.length, D--, e.mode = Pa;
          break;
        case uf:
          if (e.wrap) {
            for (; d < 32; ) {
              if (l === 0)
                break e;
              l--, c |= a[s++] << d, d += 8;
            }
            if (C -= D, n.total_out += C, e.total += C, e.wrap & 4 && C && (n.adler = e.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            e.flags ? $n(e.check, f, C, h - C) : Ff(e.check, f, C, h - C)), C = D, e.wrap & 4 && (e.flags ? c : od(c)) !== e.check) {
              n.msg = "incorrect data check", e.mode = Ye;
              break;
            }
            c = 0, d = 0;
          }
          e.mode = ad;
        case ad:
          if (e.wrap && e.flags) {
            for (; d < 32; ) {
              if (l === 0)
                break e;
              l--, c += a[s++] << d, d += 8;
            }
            if (e.wrap & 4 && c !== (e.total & 4294967295)) {
              n.msg = "incorrect length check", e.mode = Ye;
              break;
            }
            c = 0, d = 0;
          }
          e.mode = sd;
        case sd:
          Z = WC;
          break e;
        case Ye:
          Z = k1;
          break e;
        case $1:
          return T1;
        case R1:
        default:
          return dn;
      }
  return n.next_out = h, n.avail_out = D, n.next_in = s, n.avail_in = l, e.hold = c, e.bits = d, (e.wsize || C !== n.avail_out && e.mode < Ye && (e.mode < uf || t !== M0)) && M1(n, n.output, n.next_out, C - n.avail_out), x -= n.avail_in, C -= n.avail_out, n.total_in += x, n.total_out += C, e.total += C, e.wrap & 4 && C && (n.adler = e.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  e.flags ? $n(e.check, f, C, n.next_out - C) : Ff(e.check, f, C, n.next_out - C)), n.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === jn ? 128 : 0) + (e.mode === Oa || e.mode === rf ? 256 : 0), (x === 0 && C === 0 || t === M0) && Z === Jr && (Z = ZC), Z;
}, tA = (n) => {
  if (ri(n))
    return dn;
  let t = n.state;
  return t.window && (t.window = null), n.state = null, Jr;
}, nA = (n, t) => {
  if (ri(n))
    return dn;
  const e = n.state;
  return e.wrap & 2 ? (e.head = t, t.done = !1, Jr) : dn;
}, rA = (n, t) => {
  const e = t.length;
  let a, f, s;
  return ri(n) || (a = n.state, a.wrap !== 0 && a.mode !== ns) ? dn : a.mode === ns && (f = 1, f = Ff(f, t, e, 0), f !== a.check) ? k1 : (s = M1(n, t, e, e), s ? (a.mode = $1, T1) : (a.havedict = 1, Jr));
};
var iA = L1, uA = O1, aA = N1, sA = JC, oA = P1, fA = eA, lA = tA, hA = nA, cA = rA, dA = "pako inflate (from Nodeca project)", nr = {
  inflateReset: iA,
  inflateReset2: uA,
  inflateResetKeep: aA,
  inflateInit: sA,
  inflateInit2: oA,
  inflate: fA,
  inflateEnd: lA,
  inflateGetHeader: hA,
  inflateSetDictionary: cA,
  inflateInfo: dA
};
function pA() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var gA = pA;
const U1 = Object.prototype.toString, {
  Z_NO_FLUSH: _A,
  Z_FINISH: wA,
  Z_OK: Cu,
  Z_STREAM_END: of,
  Z_NEED_DICT: ff,
  Z_STREAM_ERROR: bA,
  Z_DATA_ERROR: ld,
  Z_MEM_ERROR: vA
} = x1;
function ps(n) {
  this.options = F1.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, n || {});
  const t = this.options;
  t.raw && t.windowBits >= 0 && t.windowBits < 16 && (t.windowBits = -t.windowBits, t.windowBits === 0 && (t.windowBits = -15)), t.windowBits >= 0 && t.windowBits < 16 && !(n && n.windowBits) && (t.windowBits += 32), t.windowBits > 15 && t.windowBits < 48 && (t.windowBits & 15 || (t.windowBits |= 15)), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new RC(), this.strm.avail_out = 0;
  let e = nr.inflateInit2(
    this.strm,
    t.windowBits
  );
  if (e !== Cu)
    throw new Error(Bf[e]);
  if (this.header = new gA(), nr.inflateGetHeader(this.strm, this.header), t.dictionary && (typeof t.dictionary == "string" ? t.dictionary = Sf.string2buf(t.dictionary) : U1.call(t.dictionary) === "[object ArrayBuffer]" && (t.dictionary = new Uint8Array(t.dictionary)), t.raw && (e = nr.inflateSetDictionary(this.strm, t.dictionary), e !== Cu)))
    throw new Error(Bf[e]);
}
ps.prototype.push = function(n, t) {
  const e = this.strm, a = this.options.chunkSize, f = this.options.dictionary;
  let s, h, l;
  if (this.ended) return !1;
  for (t === ~~t ? h = t : h = t === !0 ? wA : _A, U1.call(n) === "[object ArrayBuffer]" ? e.input = new Uint8Array(n) : e.input = n, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    for (e.avail_out === 0 && (e.output = new Uint8Array(a), e.next_out = 0, e.avail_out = a), s = nr.inflate(e, h), s === ff && f && (s = nr.inflateSetDictionary(e, f), s === Cu ? s = nr.inflate(e, h) : s === ld && (s = ff)); e.avail_in > 0 && s === of && e.state.wrap > 0 && n[e.next_in] !== 0; )
      nr.inflateReset(e), s = nr.inflate(e, h);
    switch (s) {
      case bA:
      case ld:
      case ff:
      case vA:
        return this.onEnd(s), this.ended = !0, !1;
    }
    if (l = e.avail_out, e.next_out && (e.avail_out === 0 || s === of))
      if (this.options.to === "string") {
        let D = Sf.utf8border(e.output, e.next_out), c = e.next_out - D, d = Sf.buf2string(e.output, D);
        e.next_out = c, e.avail_out = a - c, c && e.output.set(e.output.subarray(D, D + c), 0), this.onData(d);
      } else
        this.onData(e.output.length === e.next_out ? e.output : e.output.subarray(0, e.next_out));
    if (!(s === Cu && l === 0)) {
      if (s === of)
        return s = nr.inflateEnd(this.strm), this.onEnd(s), this.ended = !0, !0;
      if (e.avail_in === 0) break;
    }
  }
  return !0;
};
ps.prototype.onData = function(n) {
  this.chunks.push(n);
};
ps.prototype.onEnd = function(n) {
  n === Cu && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = F1.flattenChunks(this.chunks)), this.chunks = [], this.err = n, this.msg = this.strm.msg;
};
function DA(n, t) {
  const e = new ps(t);
  if (e.push(n), e.err) throw e.msg || Bf[e.err];
  return e.result;
}
function mA(n, t) {
  return t = t || {}, t.raw = !0, DA(n, t);
}
var yA = mA, EA = {
  inflateRaw: yA
};
const { inflateRaw: CA } = EA;
var AA = CA;
function xA(n) {
  return AA(n.subarray(2));
}
class FA extends Error {
  constructor(t) {
    super(t), this.code = "ERR_ABORTED";
  }
}
function BA(n) {
  n.sort((f, s) => Number(f.offset) - Number(s.offset));
  const t = [];
  let e, a;
  for (const f of n)
    e && a && Number(f.offset) - a <= 2e3 ? (e.length = BigInt(Number(e.length) + Number(f.length) - a + Number(f.offset)), e.blocks.push(f)) : t.push(e = {
      blocks: [f],
      length: f.length,
      offset: f.offset
    }), a = Number(e.offset) + Number(e.length);
  return t;
}
function Ma(n) {
  if (n && n.aborted)
    if (typeof DOMException > "u") {
      const t = new FA("aborted");
      throw t.code = "ERR_ABORTED", t;
    } else
      throw new DOMException("aborted", "AbortError");
}
const SA = 1, IA = 2, kA = 3;
function lf(n, t, e, a) {
  return n < a && t >= e;
}
function TA(n) {
  const t = n ? "big" : "little", e = new Se().endianess(t).uint32("chromId").uint32("start").uint32("end").uint32("validCnt").floatle("minScore").floatle("maxScore").floatle("sumData").floatle("sumSqData").saveOffset("offset"), a = new Se().endianess(t).uint8("isLeaf").skip(1).uint16("cnt").choice({
    tag: "isLeaf",
    choices: {
      1: new Se().endianess(t).array("blocksToFetch", {
        length: "cnt",
        type: new Se().endianess(t).uint32("startChrom").uint32("startBase").uint32("endChrom").uint32("endBase").uint64("blockOffset").uint64("blockSize").saveOffset("offset")
      }),
      0: new Se().array("recurOffsets", {
        length: "cnt",
        type: new Se().endianess(t).uint32("startChrom").uint32("startBase").uint32("endChrom").uint32("endBase").uint64("blockOffset").saveOffset("offset")
      })
    }
  }), f = new Se().endianess(t).uint32("chromId").int32("start").int32("end").string("rest", {
    zeroTerminated: !0
  }).saveOffset("offset");
  return {
    bigWigParser: new Se().endianess(t).skip(4).int32("blockStart").skip(4).uint32("itemStep").uint32("itemSpan").uint8("blockType").skip(1).uint16("itemCount").choice({
      tag: "blockType",
      choices: {
        [kA]: new Se().array("items", {
          length: "itemCount",
          type: new Se().floatle("score")
        }),
        [IA]: new Se().array("items", {
          length: "itemCount",
          type: new Se().endianess(t).int32("start").floatle("score")
        }),
        [SA]: new Se().array("items", {
          length: "itemCount",
          type: new Se().endianess(t).int32("start").int32("end").floatle("score")
        })
      }
    }),
    bigBedParser: f,
    summaryParser: e,
    leafParser: a
  };
}
class z1 {
  constructor(t, e, a, f, s, h) {
    if (this.bbi = t, this.refsByName = e, this.cirTreeOffset = a, this.isBigEndian = f, this.isCompressed = s, this.blockType = h, this.featureCache = new wu({
      cache: new Fd({ maxSize: 1e3 }),
      fill: async (D, c) => {
        const d = Number(D.length), x = Number(D.offset), { buffer: C } = await this.bbi.read(Un.Buffer.alloc(d), 0, d, x, {
          signal: c
        });
        return C;
      }
    }), !(a >= 0))
      throw new Error("invalid cirTreeOffset!");
    const l = TA(f);
    this.leafParser = l.leafParser, this.bigBedParser = l.bigBedParser;
  }
  async readWigData(t, e, a, f, s) {
    try {
      const { refsByName: h, bbi: l, cirTreeOffset: D, isBigEndian: c } = this, d = h[t];
      d === void 0 && f.complete();
      const x = { chrId: d, start: e, end: a };
      this.cirTreePromise || (this.cirTreePromise = l.read(Un.Buffer.alloc(48), 0, 48, Number(D), s));
      const { buffer: C } = await this.cirTreePromise, E = c ? C.readUInt32BE(4) : C.readUInt32LE(4);
      let I = [], B = 0;
      const M = ($, L, Q) => {
        try {
          const z = $.subarray(L), Z = this.leafParser.parse(z);
          if (Z.blocksToFetch && (I = I.concat(Z.blocksToFetch.filter((J) => T(J)).map((J) => ({
            offset: J.blockOffset,
            length: J.blockSize
          })))), Z.recurOffsets) {
            const J = Z.recurOffsets.filter((ee) => T(ee)).map((ee) => Number(ee.blockOffset));
            J.length > 0 && P(J, Q + 1);
          }
        } catch (z) {
          f.error(z);
        }
      }, T = ($) => {
        const { startChrom: L, startBase: Q, endChrom: z, endBase: Z } = $;
        return (L < d || L === d && Q <= a) && (z > d || z === d && Z >= e);
      }, G = async ($, L, Q) => {
        try {
          const z = L.max - L.min, Z = L.min, J = await this.featureCache.get(`${z}_${Z}`, { length: z, offset: Z }, s == null ? void 0 : s.signal);
          for (const ee of $)
            L.contains(ee) && (M(J, ee - Z, Q), B -= 1, B === 0 && this.readFeatures(f, I, {
              ...s,
              request: x
            }).catch((K) => f.error(K)));
        } catch (z) {
          f.error(z);
        }
      }, P = ($, L) => {
        try {
          B += $.length;
          const Q = 4 + Number(E) * 32;
          let z = new ki([
            { min: $[0], max: $[0] + Q }
          ]);
          for (let Z = 1; Z < $.length; Z += 1) {
            const J = new ki([
              { min: $[Z], max: $[Z] + Q }
            ]);
            z = z.union(J);
          }
          z.getRanges().map((Z) => G($, Z, L));
        } catch (Q) {
          f.error(Q);
        }
      };
      return P([Number(D) + 48], 1);
    } catch (h) {
      f.error(h);
    }
  }
  parseSummaryBlock(t, e, a) {
    const f = [];
    let s = e;
    const h = new DataView(t.buffer, t.byteOffset, t.length);
    for (; s < t.byteLength; ) {
      const l = h.getUint32(s, !0);
      s += 4;
      const D = h.getUint32(s, !0);
      s += 4;
      const c = h.getUint32(s, !0);
      s += 4;
      const d = h.getUint32(s, !0);
      s += 4;
      const x = h.getFloat32(s, !0);
      s += 4;
      const C = h.getFloat32(s, !0);
      s += 4;
      const E = h.getFloat32(s, !0);
      s += 4, s += 4, (!a || l === a.chrId && lf(D, c, a.start, a.end)) && f.push({
        start: D,
        end: c,
        maxScore: C,
        minScore: x,
        summary: !0,
        score: E / (d || 1)
      });
    }
    return f;
  }
  parseBigBedBlock(t, e, a, f) {
    const s = [];
    let h = e;
    for (; h < t.byteLength; ) {
      const l = this.bigBedParser.parse(t.subarray(h));
      l.uniqueId = `bb-${a + h}`, s.push(l), h += l.offset;
    }
    return f ? s.filter((l) => lf(l.start, l.end, f.start, f.end)) : s;
  }
  parseBigWigBlock(t, e, a) {
    const f = t.subarray(e), s = new DataView(f.buffer, f.byteOffset, f.length);
    let h = 0;
    h += 4;
    const l = s.getInt32(h, !0);
    h += 8;
    const D = s.getUint32(h, !0);
    h += 4;
    const c = s.getUint32(h, !0);
    h += 4;
    const d = s.getUint8(h);
    h += 2;
    const x = s.getUint16(h, !0);
    h += 2;
    const C = new Array(x);
    switch (d) {
      case 1: {
        for (let E = 0; E < x; E++) {
          const I = s.getInt32(h, !0);
          h += 4;
          const B = s.getInt32(h, !0);
          h += 4;
          const M = s.getFloat32(h, !0);
          h += 4, C[E] = { start: I, end: B, score: M };
        }
        break;
      }
      case 2: {
        for (let E = 0; E < x; E++) {
          const I = s.getInt32(h, !0);
          h += 4;
          const B = s.getFloat32(h, !0);
          h += 4, C[E] = { score: B, start: I, end: I + c };
        }
        break;
      }
      case 3: {
        for (let E = 0; E < x; E++) {
          const I = s.getFloat32(h, !0);
          h += 4;
          const B = l + E * D;
          C[E] = { score: I, start: B, end: B + c };
        }
        break;
      }
    }
    return a ? C.filter((E) => lf(E.start, E.end, a.start, a.end)) : C;
  }
  async readFeatures(t, e, a = {}) {
    try {
      const { blockType: f, isCompressed: s } = this, { signal: h, request: l } = a, D = BA(e);
      Ma(h), await Promise.all(D.map(async (c) => {
        Ma(h);
        const { length: d, offset: x } = c, C = await this.featureCache.get(`${d}_${x}`, c, h);
        for (const E of c.blocks) {
          Ma(h);
          let I = Number(E.offset) - Number(c.offset), B = C;
          switch (s && (B = xA(C.subarray(I)), I = 0), Ma(h), f) {
            case "summary": {
              t.next(this.parseSummaryBlock(B, I, l));
              break;
            }
            case "bigwig": {
              t.next(this.parseBigWigBlock(B, I, l));
              break;
            }
            case "bigbed": {
              t.next(this.parseBigBedBlock(B, I, Number(E.offset) * 256, l));
              break;
            }
            default:
              console.warn(`Don't know what to do with ${f}`);
          }
        }
      })), t.complete();
    } catch (f) {
      t.error(f);
    }
  }
}
var If = function(n, t) {
  return If = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(e, a) {
    e.__proto__ = a;
  } || function(e, a) {
    for (var f in a) Object.prototype.hasOwnProperty.call(a, f) && (e[f] = a[f]);
  }, If(n, t);
};
function jf(n, t) {
  if (typeof t != "function" && t !== null)
    throw new TypeError("Class extends value " + String(t) + " is not a constructor or null");
  If(n, t);
  function e() {
    this.constructor = n;
  }
  n.prototype = t === null ? Object.create(t) : (e.prototype = t.prototype, new e());
}
function hd(n) {
  var t = typeof Symbol == "function" && Symbol.iterator, e = t && n[t], a = 0;
  if (e) return e.call(n);
  if (n && typeof n.length == "number") return {
    next: function() {
      return n && a >= n.length && (n = void 0), { value: n && n[a++], done: !n };
    }
  };
  throw new TypeError(t ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function kf(n, t) {
  var e = typeof Symbol == "function" && n[Symbol.iterator];
  if (!e) return n;
  var a = e.call(n), f, s = [], h;
  try {
    for (; (t === void 0 || t-- > 0) && !(f = a.next()).done; ) s.push(f.value);
  } catch (l) {
    h = { error: l };
  } finally {
    try {
      f && !f.done && (e = a.return) && e.call(a);
    } finally {
      if (h) throw h.error;
    }
  }
  return s;
}
function Tf(n, t, e) {
  if (e || arguments.length === 2) for (var a = 0, f = t.length, s; a < f; a++)
    (s || !(a in t)) && (s || (s = Array.prototype.slice.call(t, 0, a)), s[a] = t[a]);
  return n.concat(s || Array.prototype.slice.call(t));
}
function On(n) {
  return typeof n == "function";
}
function q1(n) {
  var t = function(a) {
    Error.call(a), a.stack = new Error().stack;
  }, e = n(t);
  return e.prototype = Object.create(Error.prototype), e.prototype.constructor = e, e;
}
var hf = q1(function(n) {
  return function(e) {
    n(this), this.message = e ? e.length + ` errors occurred during unsubscription:
` + e.map(function(a, f) {
      return f + 1 + ") " + a.toString();
    }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = e;
  };
});
function cd(n, t) {
  if (n) {
    var e = n.indexOf(t);
    0 <= e && n.splice(e, 1);
  }
}
var el = function() {
  function n(t) {
    this.initialTeardown = t, this.closed = !1, this._parentage = null, this._finalizers = null;
  }
  return n.prototype.unsubscribe = function() {
    var t, e, a, f, s;
    if (!this.closed) {
      this.closed = !0;
      var h = this._parentage;
      if (h)
        if (this._parentage = null, Array.isArray(h))
          try {
            for (var l = hd(h), D = l.next(); !D.done; D = l.next()) {
              var c = D.value;
              c.remove(this);
            }
          } catch (B) {
            t = { error: B };
          } finally {
            try {
              D && !D.done && (e = l.return) && e.call(l);
            } finally {
              if (t) throw t.error;
            }
          }
        else
          h.remove(this);
      var d = this.initialTeardown;
      if (On(d))
        try {
          d();
        } catch (B) {
          s = B instanceof hf ? B.errors : [B];
        }
      var x = this._finalizers;
      if (x) {
        this._finalizers = null;
        try {
          for (var C = hd(x), E = C.next(); !E.done; E = C.next()) {
            var I = E.value;
            try {
              dd(I);
            } catch (B) {
              s = s ?? [], B instanceof hf ? s = Tf(Tf([], kf(s)), kf(B.errors)) : s.push(B);
            }
          }
        } catch (B) {
          a = { error: B };
        } finally {
          try {
            E && !E.done && (f = C.return) && f.call(C);
          } finally {
            if (a) throw a.error;
          }
        }
      }
      if (s)
        throw new hf(s);
    }
  }, n.prototype.add = function(t) {
    var e;
    if (t && t !== this)
      if (this.closed)
        dd(t);
      else {
        if (t instanceof n) {
          if (t.closed || t._hasParent(this))
            return;
          t._addParent(this);
        }
        (this._finalizers = (e = this._finalizers) !== null && e !== void 0 ? e : []).push(t);
      }
  }, n.prototype._hasParent = function(t) {
    var e = this._parentage;
    return e === t || Array.isArray(e) && e.includes(t);
  }, n.prototype._addParent = function(t) {
    var e = this._parentage;
    this._parentage = Array.isArray(e) ? (e.push(t), e) : e ? [e, t] : t;
  }, n.prototype._removeParent = function(t) {
    var e = this._parentage;
    e === t ? this._parentage = null : Array.isArray(e) && cd(e, t);
  }, n.prototype.remove = function(t) {
    var e = this._finalizers;
    e && cd(e, t), t instanceof n && t._removeParent(this);
  }, n.EMPTY = function() {
    var t = new n();
    return t.closed = !0, t;
  }(), n;
}();
el.EMPTY;
function G1(n) {
  return n instanceof el || n && "closed" in n && On(n.remove) && On(n.add) && On(n.unsubscribe);
}
function dd(n) {
  On(n) ? n() : n.unsubscribe();
}
var $A = {
  Promise: void 0
}, RA = {
  setTimeout: function(n, t) {
    for (var e = [], a = 2; a < arguments.length; a++)
      e[a - 2] = arguments[a];
    return setTimeout.apply(void 0, Tf([n, t], kf(e)));
  },
  clearTimeout: function(n) {
    return clearTimeout(n);
  },
  delegate: void 0
};
function NA(n) {
  RA.setTimeout(function() {
    throw n;
  });
}
function pd() {
}
function LA(n) {
  n();
}
var tl = function(n) {
  jf(t, n);
  function t(e) {
    var a = n.call(this) || this;
    return a.isStopped = !1, e ? (a.destination = e, G1(e) && e.add(a)) : a.destination = MA, a;
  }
  return t.create = function(e, a, f) {
    return new rs(e, a, f);
  }, t.prototype.next = function(e) {
    this.isStopped || this._next(e);
  }, t.prototype.error = function(e) {
    this.isStopped || (this.isStopped = !0, this._error(e));
  }, t.prototype.complete = function() {
    this.isStopped || (this.isStopped = !0, this._complete());
  }, t.prototype.unsubscribe = function() {
    this.closed || (this.isStopped = !0, n.prototype.unsubscribe.call(this), this.destination = null);
  }, t.prototype._next = function(e) {
    this.destination.next(e);
  }, t.prototype._error = function(e) {
    try {
      this.destination.error(e);
    } finally {
      this.unsubscribe();
    }
  }, t.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  }, t;
}(el), OA = function() {
  function n(t) {
    this.partialObserver = t;
  }
  return n.prototype.next = function(t) {
    var e = this.partialObserver;
    if (e.next)
      try {
        e.next(t);
      } catch (a) {
        Ua(a);
      }
  }, n.prototype.error = function(t) {
    var e = this.partialObserver;
    if (e.error)
      try {
        e.error(t);
      } catch (a) {
        Ua(a);
      }
    else
      Ua(t);
  }, n.prototype.complete = function() {
    var t = this.partialObserver;
    if (t.complete)
      try {
        t.complete();
      } catch (e) {
        Ua(e);
      }
  }, n;
}(), rs = function(n) {
  jf(t, n);
  function t(e, a, f) {
    var s = n.call(this) || this, h;
    return On(e) || !e ? h = {
      next: e ?? void 0,
      error: a ?? void 0,
      complete: f ?? void 0
    } : h = e, s.destination = new OA(h), s;
  }
  return t;
}(tl);
function Ua(n) {
  NA(n);
}
function PA(n) {
  throw n;
}
var MA = {
  closed: !0,
  next: pd,
  error: PA,
  complete: pd
}, UA = function() {
  return typeof Symbol == "function" && Symbol.observable || "@@observable";
}();
function zA(n) {
  return n;
}
function qA(n) {
  return n.length === 0 ? zA : n.length === 1 ? n[0] : function(e) {
    return n.reduce(function(a, f) {
      return f(a);
    }, e);
  };
}
var GA = function() {
  function n(t) {
    t && (this._subscribe = t);
  }
  return n.prototype.lift = function(t) {
    var e = new n();
    return e.source = this, e.operator = t, e;
  }, n.prototype.subscribe = function(t, e, a) {
    var f = this, s = HA(t) ? t : new rs(t, e, a);
    return LA(function() {
      var h = f, l = h.operator, D = h.source;
      s.add(l ? l.call(s, D) : D ? f._subscribe(s) : f._trySubscribe(s));
    }), s;
  }, n.prototype._trySubscribe = function(t) {
    try {
      return this._subscribe(t);
    } catch (e) {
      t.error(e);
    }
  }, n.prototype.forEach = function(t, e) {
    var a = this;
    return e = gd(e), new e(function(f, s) {
      var h = new rs({
        next: function(l) {
          try {
            t(l);
          } catch (D) {
            s(D), h.unsubscribe();
          }
        },
        error: s,
        complete: f
      });
      a.subscribe(h);
    });
  }, n.prototype._subscribe = function(t) {
    var e;
    return (e = this.source) === null || e === void 0 ? void 0 : e.subscribe(t);
  }, n.prototype[UA] = function() {
    return this;
  }, n.prototype.pipe = function() {
    for (var t = [], e = 0; e < arguments.length; e++)
      t[e] = arguments[e];
    return qA(t)(this);
  }, n.prototype.toPromise = function(t) {
    var e = this;
    return t = gd(t), new t(function(a, f) {
      var s;
      e.subscribe(function(h) {
        return s = h;
      }, function(h) {
        return f(h);
      }, function() {
        return a(s);
      });
    });
  }, n.create = function(t) {
    return new n(t);
  }, n;
}();
function gd(n) {
  var t;
  return (t = n ?? $A.Promise) !== null && t !== void 0 ? t : Promise;
}
function WA(n) {
  return n && On(n.next) && On(n.error) && On(n.complete);
}
function HA(n) {
  return n && n instanceof tl || WA(n) && G1(n);
}
function ZA(n) {
  return On(n == null ? void 0 : n.lift);
}
function W1(n) {
  return function(t) {
    if (ZA(t))
      return t.lift(function(e) {
        try {
          return n(e, this);
        } catch (a) {
          this.error(a);
        }
      });
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
function VA(n, t, e, a, f) {
  return new XA(n, t, e, a, f);
}
var XA = function(n) {
  jf(t, n);
  function t(e, a, f, s, h, l) {
    var D = n.call(this, e) || this;
    return D.onFinalize = h, D.shouldUnsubscribe = l, D._next = a ? function(c) {
      try {
        a(c);
      } catch (d) {
        e.error(d);
      }
    } : n.prototype._next, D._error = s ? function(c) {
      try {
        s(c);
      } catch (d) {
        e.error(d);
      } finally {
        this.unsubscribe();
      }
    } : n.prototype._error, D._complete = f ? function() {
      try {
        f();
      } catch (c) {
        e.error(c);
      } finally {
        this.unsubscribe();
      }
    } : n.prototype._complete, D;
  }
  return t.prototype.unsubscribe = function() {
    var e;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var a = this.closed;
      n.prototype.unsubscribe.call(this), !a && ((e = this.onFinalize) === null || e === void 0 || e.call(this));
    }
  }, t;
}(tl), KA = q1(function(n) {
  return function() {
    n(this), this.name = "EmptyError", this.message = "no elements in sequence";
  };
});
function YA(n, t) {
  return new Promise(function(e, a) {
    var f = new rs({
      next: function(s) {
        e(s), f.unsubscribe();
      },
      error: a,
      complete: function() {
        a(new KA());
      }
    });
    n.subscribe(f);
  });
}
function QA(n, t, e, a, f) {
  return function(s, h) {
    var l = e, D = t, c = 0;
    s.subscribe(VA(h, function(d) {
      var x = c++;
      D = l ? n(D, d, x) : (l = !0, d);
    }, function() {
      l && h.next(D), h.complete();
    }));
  };
}
function JA(n, t) {
  return W1(QA(n, t, arguments.length >= 2, !1, !0));
}
var jA = function(n, t) {
  return n.push(t), n;
};
function e3() {
  return W1(function(n, t) {
    JA(jA, [])(n).subscribe(t);
  });
}
const _d = -2003829722, cf = -2021002517;
function t3(n) {
  return new TextDecoder().decode(n);
}
function wd(n) {
  const t = n ? "big" : "little", e = new Se().endianess(t).int32("magic").uint16("version").uint16("numZoomLevels").uint64("chromTreeOffset").uint64("unzoomedDataOffset").uint64("unzoomedIndexOffset").uint16("fieldCount").uint16("definedFieldCount").uint64("asOffset").uint64("totalSummaryOffset").uint32("uncompressBufSize").uint64("extHeaderOffset").array("zoomLevels", {
    length: "numZoomLevels",
    type: new Se().endianess(t).uint32("reductionLevel").uint32("reserved").uint64("dataOffset").uint64("indexOffset")
  }), a = new Se().endianess(t).uint64("basesCovered").doublele("scoreMin").doublele("scoreMax").doublele("scoreSum").doublele("scoreSumSquares"), f = new Se().endianess(t).uint32("magic").uint32("blockSize").uint32("keySize").uint32("valSize").uint64("itemCount"), s = new Se().endianess(t).uint8("isLeafNode").skip(1).uint16("cnt").saveOffset("offset");
  return {
    chromTreeParser: f,
    totalSummaryParser: a,
    headerParser: e,
    isLeafNode: s
  };
}
class n3 {
  getHeader(t) {
    return this.headerP || (this.headerP = this._getHeader(t).catch((e) => {
      throw this.headerP = void 0, e;
    })), this.headerP;
  }
  /*
   * @param filehandle - a filehandle from generic-filehandle or implementing something similar to the node10 fs.promises API
   *
   * @param path - a Local file path as a string
   *
   * @param url - a URL string
   *
   * @param renameRefSeqs - an optional method to rename the internal reference
   * sequences using a mapping function
   */
  constructor(t) {
    const { filehandle: e, renameRefSeqs: a = (h) => h, path: f, url: s } = t;
    if (this.renameRefSeqs = a, e)
      this.bbi = e;
    else if (s)
      this.bbi = new ir(s);
    else if (f)
      this.bbi = new au(f);
    else
      throw new Error("no file given");
  }
  async _getHeader(t) {
    const e = await this._getMainHeader(t), a = await this._readChromTree(e, t);
    return { ...e, ...a };
  }
  async _getMainHeader(t, e = 2e3) {
    const { buffer: a } = await this.bbi.read(Un.Buffer.alloc(e), 0, e, 0, t), f = this._isBigEndian(a), s = wd(f), h = s.headerParser.parse(a), { magic: l, asOffset: D, totalSummaryOffset: c } = h;
    if (h.fileType = l === cf ? "bigbed" : "bigwig", D > e || c > e)
      return this._getMainHeader(t, e * 2);
    if (D) {
      const d = Number(h.asOffset);
      h.autoSql = t3(a.subarray(d, a.indexOf(0, d)));
    }
    if (h.totalSummaryOffset > e - 8 * 5)
      return this._getMainHeader(t, e * 2);
    if (h.totalSummaryOffset) {
      const d = a.subarray(Number(h.totalSummaryOffset)), x = s.totalSummaryParser.parse(d);
      h.totalSummary = { ...x, basesCovered: Number(x.basesCovered) };
    }
    return { ...h, isBigEndian: f };
  }
  _isBigEndian(t) {
    let e = t.readInt32LE(0);
    if (e === _d || e === cf)
      return !1;
    if (e = t.readInt32BE(0), e === _d || e === cf)
      return !0;
    throw new Error("not a BigWig/BigBed file");
  }
  // todo: add progress if long running
  async _readChromTree(t, e) {
    const a = t.isBigEndian, f = a ? "big" : "little", s = [], h = {};
    let l = Number(t.unzoomedDataOffset);
    const D = Number(t.chromTreeOffset);
    for (; l % 4 !== 0; )
      l += 1;
    const c = l - D, { buffer: d } = await this.bbi.read(Un.Buffer.alloc(c), 0, c, Number(D), e), x = wd(a), { keySize: C } = x.chromTreeParser.parse(d), E = new Se().endianess(f).string("key", { stripNull: !0, length: C }).uint32("refId").uint32("refSize").saveOffset("offset"), I = new Se().endianess(f).skip(C).uint64("childOffset").saveOffset("offset"), B = 32, M = async (T) => {
      let G = T;
      if (G >= d.length)
        throw new Error("reading beyond end of buffer");
      const P = x.isLeafNode.parse(d.subarray(G)), { isLeafNode: $, cnt: L } = P;
      if (G += P.offset, $)
        for (let Q = 0; Q < L; Q += 1) {
          const z = E.parse(d.subarray(G));
          G += z.offset;
          const { key: Z, refId: J, refSize: ee } = z, K = { name: Z, id: J, length: ee };
          h[this.renameRefSeqs(Z)] = J, s[J] = K;
        }
      else {
        const Q = [];
        for (let z = 0; z < L; z += 1) {
          const Z = I.parse(d.subarray(G)), { childOffset: J } = Z;
          G += Z.offset, Q.push(M(Number(J) - Number(D)));
        }
        await Promise.all(Q);
      }
    };
    return await M(B), {
      refsByName: h,
      refsByNumber: s
    };
  }
  /*
   * fetches the "unzoomed" view of the bigwig data. this is the default for bigbed
   * @param abortSignal - a signal to optionally abort this operation
   */
  async getUnzoomedView(t) {
    const { unzoomedIndexOffset: e, refsByName: a, uncompressBufSize: f, isBigEndian: s, fileType: h } = await this.getHeader(t);
    return new z1(this.bbi, a, e, s, f > 0, h);
  }
  /**
   * Gets features from a BigWig file
   *
   * @param refName - The chromosome name
   * @param start - The start of a region
   * @param end - The end of a region
   * @param opts - An object containing basesPerSpan (e.g. pixels per basepair) or scale used to infer the zoomLevel to use
   */
  async getFeatureStream(t, e, a, f) {
    await this.getHeader(f);
    const s = this.renameRefSeqs(t);
    let h;
    const { basesPerSpan: l, scale: D } = f || {};
    return l ? h = await this.getView(1 / l, f) : D ? h = await this.getView(D, f) : h = await this.getView(1, f), new GA((c) => {
      h.readWigData(s, e, a, c, f).catch((d) => c.error(d));
    });
  }
  async getFeatures(t, e, a, f) {
    const s = await this.getFeatureStream(t, e, a, f);
    return (await YA(s.pipe(e3()))).flat();
  }
}
class H1 extends n3 {
  /**
   * Retrieves a BlockView of a specific zoomLevel
   *
   * @param scale - number
   *
   * @param opts - An object containing basesPerSpan (e.g. pixels per basepair)
   * or scale used to infer the zoomLevel to use
   */
  async getView(t, e) {
    const { zoomLevels: a, refsByName: f, fileSize: s, isBigEndian: h, uncompressBufSize: l } = await this.getHeader(e), D = 1 / t;
    let c = a.length;
    s || (c -= 1);
    for (let d = c; d >= 0; d -= 1) {
      const x = a[d];
      if (x && x.reductionLevel <= 2 * D) {
        const C = Number(x.indexOffset);
        return new z1(this.bbi, f, C, h, l > 0, "summary");
      }
    }
    return this.getUnzoomedView(e);
  }
}
function za(n, t, e) {
  let a = new H1({
    filehandle: new ir(e, { fetch: _u })
  });
  async function f(h, l) {
    const D = h.map((d) => {
      let x = l.ensemblStyle ? d.chr.replace("chr", "") : d.chr;
      return x === "M" && (x = "MT"), a.getFeatures(x, d.start, d.end);
    }), c = await Promise.all(D);
    return h.forEach((d, x) => {
      c[x].forEach((C) => C.chr = d.chr);
    }), Ot.flatten(c);
  }
  function s() {
    return f(n, t);
  }
  return s();
}
class r3 {
  constructor(t, e, a = 0, f = "", s = "") {
    this.locus1 = t, this.locus2 = e, this.score = a, this.name = f, this.color = s, this.locus1 = t, this.locus2 = e, this.score = a, this.name = f, this.color = s;
  }
  getDistance() {
    return Math.round(Math.abs(this.locus1.start - this.locus2.start));
  }
}
const i3 = "https://higlass.io/api/v1/fragments_by_loci/", iu = 50;
function u3(n, t, e) {
  async function a(h, l) {
    const c = await (await _u(i3, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        [
          h.chr,
          h.start,
          h.end,
          l.chr,
          l.start,
          l.end,
          e,
          -1
        ]
      ]),
      params: {
        precision: 3,
        dims: iu
      }
    })).json(), d = Math.round(
      h.end - h.start / iu
    ), x = Math.round(
      l.end - l.start / iu
    ), C = [];
    for (let E = 0; E < iu; E++)
      for (let I = E; I < iu; I++) {
        const B = new Qe(
          h.chr,
          h.start + E * d,
          h.start + (E + 1) * d
        ), M = new Qe(
          l.chr,
          l.start + I * x,
          l.start + (I + 1) * x
        );
        C.push(
          new r3(
            B,
            M,
            c.data.fragments[0][E][I]
          )
        );
      }
    return C;
  }
  async function f(h, l = {}) {
    const D = [];
    for (let d = 0; d < h.length; d++)
      for (let x = d; x < h.length; x++)
        h[d].chr === h[x].chr && D.push(await a(h[d], h[x]));
    const c = await Promise.all(D);
    return Ot.flatMap(c);
  }
  function s() {
    return f(n, t);
  }
  return s();
}
const a3 = 1e3;
function s3(n, t, e, a) {
  let f = a3, s = new H1({
    filehandle: new ir(e, { fetch: _u })
  });
  async function h(D, c) {
    if (a > f)
      return Promise.resolve([]);
    {
      const d = D.map((C) => {
        let E = c.ensemblStyle ? C.chr.replace("chr", "") : C.chr;
        return E === "M" && (E = "MT"), s.getFeatures(E, C.start, C.end);
      }), x = await Promise.all(d);
      return D.forEach((C, E) => {
        x[E].forEach((I) => I.chr = C.chr);
      }), Ot.flatten(x);
    }
  }
  function l() {
    return h(n, t);
  }
  return l();
}
const o3 = "https://lambda.epigenomegateway.org/v2", df = {
  geneannotation: async function(t) {
    return await (await fetch(
      `${o3}/${t.genomeName}/genes/${t.name}/queryRegion?chr=${t.chr}&start=${t.start}&end=${t.end}`,
      { method: "GET" }
    )).json();
  },
  bed: async function(t) {
    return Mr(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  bigbed: async function(t) {
    return za(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  refbed: async function(t) {
    return Mr(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  matplot: async function(t) {
    return Mr(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  bigwig: async function(t) {
    return za(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  cool: async function(t) {
    return u3(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  categorical: async function(t) {
    return Mr(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  longrange: async function(t) {
    return Mr(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  dynseq: async function(t) {
    return za(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  repeatmasker: async function(t) {
    return s3(
      t.nav,
      t.trackModel.options,
      t.trackModel.url,
      t.basesPerPixel
    );
  },
  biginteract: async function(t) {
    return za(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  methylc: async function(t) {
    return Mr(
      t.nav,
      t.trackModel.options,
      t.trackModel.url
    );
  },
  hic: function(t, e, a, f) {
    return t.getData(a, f, e);
  },
  genomealign: function(t, e, a) {
    return Mr(t, e, a);
  }
};
self.onmessage = async (n) => {
  let t = n.data.primaryGenName, e = [], a = n.data.genomicLoci, f = n.data.expandedGenLoci, s = n.data.initGenomicLoci, h = n.data.trackModelArr, l = {}, D = n.data.initNavLoci, c = n.data.useFineModeNav;
  l[`${t}`] = {
    genomicLoci: a,
    expandGenomicLoci: f,
    initGenomicLoci: s,
    curFetchRegionNav: n.data.curFetchRegionNav,
    initNavLoci: D
  };
  let d = h.filter((B, M) => B.type === "genomealign");
  d.length > 0 ? (l[`${t}`].primaryVisData = [], (await x(n.data.visData.visRegion, d)).map((B) => {
    l[`${t}`].primaryVisData = B.result.primaryVisData, l[`${B.queryName}`] = {
      queryGenomicCoord: new Array(B.queryGenomicCoord),
      id: B.id,
      queryRegion: B.result.queryRegion
    }, e.push(B);
  })) : l[`${t}`].primaryVisData = n.data.visData;
  async function x(B, M) {
    let T = [], G = [];
    for (let ie of n.data.visData.visRegion._navContext._features) {
      let Ce = new Qe(
        ie.locus.chr,
        ie.locus.start,
        ie.locus.end
      );
      T.push(new Pn(ie.name, Ce));
    }
    let P = new yn(
      n.data.visData.visRegion._navContext._name,
      T
    ), $ = new Ti(
      P,
      B._startBase,
      B._endBase
    ), L = [];
    for (let ie of n.data.visData.viewWindowRegion._navContext._features) {
      let Ce = new Qe(
        ie.locus.chr,
        ie.locus.start,
        ie.locus.end
      );
      L.push(new Pn(ie.name, Ce));
    }
    let Q = new yn(
      n.data.visData.viewWindowRegion._navContext._name,
      L
    ), z = new Ti(
      Q,
      B._startBase + n.data.bpRegionSize,
      B._endBase - n.data.bpRegionSize
    ), Z = {
      visWidth: n.data.windowWidth * 3,
      visRegion: $,
      viewWindow: new Te(
        n.data.windowWidth,
        n.data.windowWidth * 2
      ),
      viewWindowRegion: z
    };
    const J = await Promise.all(
      M.map(async (ie, Ce) => {
        let be = await df.genomealign(
          f,
          {
            height: 40,
            isCombineStrands: !1,
            colorsForContext: {
              CG: {
                color: "rgb(100,139,216)",
                background: "#d9d9d9"
              },
              CHG: {
                color: "rgb(255,148,77)",
                background: "#ffe0cc"
              },
              CHH: {
                color: "rgb(255,0,255)",
                background: "#ffe5ff"
              }
            },
            depthColor: "#525252",
            depthFilter: 0,
            maxMethyl: 1,
            label: ""
          },
          ie.url
        ), Pe = [], Ne = be;
        for (const ve of Ne) {
          let Fe = PD.parse("{" + ve[3] + "}");
          ve[3] = Fe, Pe.push(new qD(ve));
        }
        return {
          query: ie.querygenome,
          records: Pe,
          isBigChain: !1,
          id: ie.id
        };
      })
    );
    let K = new Um(
      n.data.primaryGenName
    ).multiAlign(Z, J);
    for (let ie in K) {
      let Ce;
      if (!c) {
        Ce = [].concat.apply(
          [],
          K[`${ie}`].drawData.map(
            (Me) => Me.segments
          )
        );
        const Ne = Ce.map(
          (Me) => Me.record.queryStrand
        ), ve = Ce.map(
          (Me) => Me.targetXSpan
        ), Fe = Ce.map(
          (Me) => Me.queryXSpan
        ), xn = Ce.map(
          (Me) => Me.visiblePart.getLocus().toString()
        ), mt = Ce.map(
          (Me) => Me.visiblePart.getQueryLocus().toString()
        ), me = Ce.map(
          (Me) => Ci(Me.visiblePart.getLength())
        ), et = Ce.map(
          (Me) => Ci(Me.visiblePart.getQueryLocus().getLength())
        );
        let Vt = {};
        Vt = {
          strandList: Ne,
          targetXSpanList: ve,
          queryXSpanList: Fe,
          targetLocusList: xn,
          queryLocusList: mt,
          lengthList: me,
          queryLengthList: et
        }, K[`${ie}`] = { ...K[`${ie}`], ...Vt };
      }
      for (let Ne = 0; Ne < K[`${ie}`].drawData.length; Ne++) {
        let ve = K[`${ie}`].drawData[Ne], Fe = {};
        const { targetXSpan: xn } = ve;
        if (c) {
          const mt = ve.visiblePart.getTargetSequence(), me = ve.visiblePart.getQuerySequence(), et = xn.getLength() / mt.length, Vt = ve.visiblePart.getLocus().toString(), Me = ve.visiblePart.getQueryLocus().toString(), yt = ve.visiblePart.getQueryLocusFine(), Xt = ve.targetSegments.filter(
            (St) => !St.isGap
          ), sr = ve.querySegments.filter(
            (St) => !St.isGap
          ), _t = ve.record.getIsReverseStrandQuery();
          Fe = {
            targetSequence: mt,
            querySequence: me,
            nonGapsQuery: sr,
            baseWidth: et,
            targetLocus: Vt,
            queryLocus: Me,
            nonGapsTarget: Xt,
            isReverseStrandQuery: _t,
            queryLocusFine: yt
          };
        } else
          Fe = { estimatedLabelWidth: ve.queryFeature.toString().length };
        K[`${ie}`].drawData[Ne] = {
          ...ve,
          ...Fe
        };
      }
      let be = [], Pe = K[`${ie}`].queryRegion._navContext._featuresForChr;
      for (let Ne in Pe)
        if (Ne !== "") {
          let ve = I(
            Pe[`${Ne}`][0].name
          ).start, Fe = I(
            Pe[`${Ne}`][Pe[`${Ne}`].length - 1].name
          ).end;
          be.push({ chr: Ne, start: ve, end: Fe });
        }
      G.push({
        queryName: ie,
        result: K[`${ie}`],
        id: K[`${ie}`].id,
        name: "genomealign",
        queryGenomicCoord: be
      });
    }
    return G;
  }
  let C = h.filter((B, M) => B.type !== "genomealign");
  await Promise.all(
    C.map(async (B, M) => {
      const T = B.type, G = B.genome, P = B.id;
      if (B.url, T === "hic" || T === "ruler")
        e.push({
          name: T,
          id: P,
          metadata: B.metadata
        });
      else if (T === "geneannotation") {
        let $ = await E(B, G);
        e.push({
          name: T,
          // I fetch three sections so I need to have an array with 3 different section data [{},{},{}]
          // when moving left and right get only 1 region so [{}] I just sent {}
          result: n.data.initial !== 1 ? $[0] : $,
          id: P,
          metadata: B.metadata
        });
      } else if (T === "matplot") {
        let $ = await Promise.all(
          B.tracks.map(async (L, Q) => n.data.initial !== 1 ? (await E(L, G)).flat(1) : E(L, G))
        );
        e.push({
          name: T,
          result: $,
          id: P,
          metadata: B.metadata
        });
      } else {
        let $ = await E(B, G);
        e.push({
          name: T,
          result: n.data.initial !== 1 ? $[0] : $,
          id: P,
          metadata: B.metadata
        });
      }
    })
  );
  async function E(B, M, T) {
    let G = [], P;
    "genome" in B.metadata ? P = l[`${B.metadata.genome}`].queryGenomicCoord : c || B.type === "longrange" || B.type === "biginteract" ? P = new Array(f) : n.data.initial === 1 ? P = s : P = new Array(a);
    for (let $ = 0; $ < P.length; $++) {
      let L;
      B.type === "geneannotation" ? L = await Promise.all(
        await P[$].map((Q, z) => df[B.type]({
          genomeName: M,
          name: B.name,
          chr: Q.chr,
          start: Q.start,
          end: Q.end,
          nav: Q,
          trackModel: B,
          trackType: B.type
        }))
      ) : L = await Promise.all(
        await df[B.type]({
          genomeName: M,
          name: B.name,
          basesPerPixel: n.data.bpRegionSize / n.data.windowWidth,
          nav: P[$],
          trackModel: B,
          trackType: B.type
        })
      ), G.push(Ot.flatten(L));
    }
    return G;
  }
  function I(B) {
    const [M, T] = B.split(":"), [G, P] = T.split("-"), $ = M.slice(3), L = parseInt(G, 10), Q = parseInt(P, 10);
    return { chr: $, start: L, end: Q };
  }
  postMessage({
    fetchResults: e,
    side: n.data.trackSide,
    xDist: n.data.xDist,
    initial: n.data.initial,
    curFetchRegionNav: n.data.curFetchRegionNav,
    genomicFetchCoord: l,
    bpX: n.data.bpX,
    useFineModeNav: c,
    genomicLoci: a,
    expandGenomicLoci: f
  });
};
