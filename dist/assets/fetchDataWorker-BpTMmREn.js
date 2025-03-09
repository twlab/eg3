var gy = Object.defineProperty;
var _y = (e, n, t) => n in e ? gy(e, n, { enumerable: !0, configurable: !0, writable: !0, value: t }) : e[n] = t;
var be = (e, n, t) => _y(e, typeof n != "symbol" ? n + "" : n, t);
var Sa = typeof globalThis < "u" ? globalThis : typeof window < "u" ? window : typeof global < "u" ? global : typeof self < "u" ? self : {};
function Jo(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Uo = { exports: {} };
/**
 * @license
 * Lodash <https://lodash.com/>
 * Copyright OpenJS Foundation and other contributors <https://openjsf.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */
Uo.exports;
(function(e, n) {
  (function() {
    var t, a = "4.17.21", s = 200, o = "Unsupported core-js use. Try https://npms.io/search?q=ponyfill.", h = "Expected a function", l = "Invalid `variable` option passed into `_.template`", v = "__lodash_hash_undefined__", c = 500, d = "__lodash_placeholder__", A = 1, C = 2, y = 4, k = 1, B = 2, P = 1, T = 2, Z = 4, U = 8, $ = 16, L = 32, Q = 64, q = 128, G = 256, J = 512, ee = 30, K = "...", ie = 800, Ce = 16, ve = 1, Me = 2, Oe = 3, ce = 1 / 0, Be = 9007199254740991, Nn = 17976931348623157e292, xt = NaN, me = 4294967295, nt = me - 1, tn = me >>> 1, ze = [
      ["ary", q],
      ["bind", P],
      ["bindKey", T],
      ["curry", U],
      ["curryRight", $],
      ["flip", J],
      ["partial", L],
      ["partialRight", Q],
      ["rearg", G]
    ], At = "[object Arguments]", nn = "[object Array]", Dr = "[object AsyncFunction]", Dt = "[object Boolean]", Rt = "[object Date]", Gr = "[object DOMException]", Ln = "[object Error]", En = "[object Function]", rn = "[object GeneratorFunction]", ot = "[object Map]", er = "[object Number]", ls = "[object Null]", Gt = "[object Object]", Au = "[object Promise]", hs = "[object Proxy]", mr = "[object RegExp]", mt = "[object Set]", yt = "[object String]", yr = "[object Symbol]", cs = "[object Undefined]", Nt = "[object WeakMap]", ds = "[object WeakSet]", m = "[object ArrayBuffer]", _ = "[object DataView]", w = "[object Float32Array]", F = "[object Float64Array]", R = "[object Int8Array]", M = "[object Int16Array]", W = "[object Int32Array]", de = "[object Uint8Array]", Ze = "[object Uint8ClampedArray]", Pe = "[object Uint16Array]", qe = "[object Uint32Array]", Ne = /\b__p \+= '';/g, Og = /\b(__p \+=) '' \+/g, Pg = /(__e\(.*?\)|\b__t\)) \+\n'';/g, wh = /&(?:amp|lt|gt|quot|#39);/g, bh = /[&<>"']/g, Ug = RegExp(wh.source), Mg = RegExp(bh.source), zg = /<%-([\s\S]+?)%>/g, Zg = /<%([\s\S]+?)%>/g, vh = /<%=([\s\S]+?)%>/g, qg = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, Hg = /^\w*$/, Gg = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g, ps = /[\\^$.*+?()[\]{}|]/g, Wg = RegExp(ps.source), gs = /^\s+/, Vg = /\s/, Xg = /\{(?:\n\/\* \[wrapped with .+\] \*\/)?\n?/, Kg = /\{\n\/\* \[wrapped with (.+)\] \*/, Yg = /,? & /, Qg = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g, Jg = /[()=,{}\[\]\/\s]/, jg = /\\(\\)?/g, e_ = /\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g, Dh = /\w*$/, t_ = /^[-+]0x[0-9a-f]+$/i, n_ = /^0b[01]+$/i, r_ = /^\[object .+?Constructor\]$/, i_ = /^0o[0-7]+$/i, a_ = /^(?:0|[1-9]\d*)$/, u_ = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g, Fu = /($^)/, o_ = /['\n\r\u2028\u2029\\]/g, Bu = "\\ud800-\\udfff", s_ = "\\u0300-\\u036f", f_ = "\\ufe20-\\ufe2f", l_ = "\\u20d0-\\u20ff", mh = s_ + f_ + l_, yh = "\\u2700-\\u27bf", Eh = "a-z\\xdf-\\xf6\\xf8-\\xff", h_ = "\\xac\\xb1\\xd7\\xf7", c_ = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf", d_ = "\\u2000-\\u206f", p_ = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000", Ch = "A-Z\\xc0-\\xd6\\xd8-\\xde", xh = "\\ufe0e\\ufe0f", Ah = h_ + c_ + d_ + p_, _s = "['’]", g_ = "[" + Bu + "]", Fh = "[" + Ah + "]", Su = "[" + mh + "]", Bh = "\\d+", __ = "[" + yh + "]", Sh = "[" + Eh + "]", kh = "[^" + Bu + Ah + Bh + yh + Eh + Ch + "]", ws = "\\ud83c[\\udffb-\\udfff]", w_ = "(?:" + Su + "|" + ws + ")", Ih = "[^" + Bu + "]", bs = "(?:\\ud83c[\\udde6-\\uddff]){2}", vs = "[\\ud800-\\udbff][\\udc00-\\udfff]", Ai = "[" + Ch + "]", Th = "\\u200d", $h = "(?:" + Sh + "|" + kh + ")", b_ = "(?:" + Ai + "|" + kh + ")", Rh = "(?:" + _s + "(?:d|ll|m|re|s|t|ve))?", Nh = "(?:" + _s + "(?:D|LL|M|RE|S|T|VE))?", Lh = w_ + "?", Oh = "[" + xh + "]?", v_ = "(?:" + Th + "(?:" + [Ih, bs, vs].join("|") + ")" + Oh + Lh + ")*", D_ = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])", m_ = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])", Ph = Oh + Lh + v_, y_ = "(?:" + [__, bs, vs].join("|") + ")" + Ph, E_ = "(?:" + [Ih + Su + "?", Su, bs, vs, g_].join("|") + ")", C_ = RegExp(_s, "g"), x_ = RegExp(Su, "g"), Ds = RegExp(ws + "(?=" + ws + ")|" + E_ + Ph, "g"), A_ = RegExp([
      Ai + "?" + Sh + "+" + Rh + "(?=" + [Fh, Ai, "$"].join("|") + ")",
      b_ + "+" + Nh + "(?=" + [Fh, Ai + $h, "$"].join("|") + ")",
      Ai + "?" + $h + "+" + Rh,
      Ai + "+" + Nh,
      m_,
      D_,
      Bh,
      y_
    ].join("|"), "g"), F_ = RegExp("[" + Th + Bu + mh + xh + "]"), B_ = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/, S_ = [
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
    ], k_ = -1, Ve = {};
    Ve[w] = Ve[F] = Ve[R] = Ve[M] = Ve[W] = Ve[de] = Ve[Ze] = Ve[Pe] = Ve[qe] = !0, Ve[At] = Ve[nn] = Ve[m] = Ve[Dt] = Ve[_] = Ve[Rt] = Ve[Ln] = Ve[En] = Ve[ot] = Ve[er] = Ve[Gt] = Ve[mr] = Ve[mt] = Ve[yt] = Ve[Nt] = !1;
    var He = {};
    He[At] = He[nn] = He[m] = He[_] = He[Dt] = He[Rt] = He[w] = He[F] = He[R] = He[M] = He[W] = He[ot] = He[er] = He[Gt] = He[mr] = He[mt] = He[yt] = He[yr] = He[de] = He[Ze] = He[Pe] = He[qe] = !0, He[Ln] = He[En] = He[Nt] = !1;
    var I_ = {
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
    }, T_ = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }, $_ = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'"
    }, R_ = {
      "\\": "\\",
      "'": "'",
      "\n": "n",
      "\r": "r",
      "\u2028": "u2028",
      "\u2029": "u2029"
    }, N_ = parseFloat, L_ = parseInt, Uh = typeof Sa == "object" && Sa && Sa.Object === Object && Sa, O_ = typeof self == "object" && self && self.Object === Object && self, gt = Uh || O_ || Function("return this")(), ms = n && !n.nodeType && n, Wr = ms && !0 && e && !e.nodeType && e, Mh = Wr && Wr.exports === ms, ys = Mh && Uh.process, an = function() {
      try {
        var N = Wr && Wr.require && Wr.require("util").types;
        return N || ys && ys.binding && ys.binding("util");
      } catch {
      }
    }(), zh = an && an.isArrayBuffer, Zh = an && an.isDate, qh = an && an.isMap, Hh = an && an.isRegExp, Gh = an && an.isSet, Wh = an && an.isTypedArray;
    function Wt(N, H, z) {
      switch (z.length) {
        case 0:
          return N.call(H);
        case 1:
          return N.call(H, z[0]);
        case 2:
          return N.call(H, z[0], z[1]);
        case 3:
          return N.call(H, z[0], z[1], z[2]);
      }
      return N.apply(H, z);
    }
    function P_(N, H, z, re) {
      for (var fe = -1, Ie = N == null ? 0 : N.length; ++fe < Ie; ) {
        var st = N[fe];
        H(re, st, z(st), N);
      }
      return re;
    }
    function un(N, H) {
      for (var z = -1, re = N == null ? 0 : N.length; ++z < re && H(N[z], z, N) !== !1; )
        ;
      return N;
    }
    function U_(N, H) {
      for (var z = N == null ? 0 : N.length; z-- && H(N[z], z, N) !== !1; )
        ;
      return N;
    }
    function Vh(N, H) {
      for (var z = -1, re = N == null ? 0 : N.length; ++z < re; )
        if (!H(N[z], z, N))
          return !1;
      return !0;
    }
    function Er(N, H) {
      for (var z = -1, re = N == null ? 0 : N.length, fe = 0, Ie = []; ++z < re; ) {
        var st = N[z];
        H(st, z, N) && (Ie[fe++] = st);
      }
      return Ie;
    }
    function ku(N, H) {
      var z = N == null ? 0 : N.length;
      return !!z && Fi(N, H, 0) > -1;
    }
    function Es(N, H, z) {
      for (var re = -1, fe = N == null ? 0 : N.length; ++re < fe; )
        if (z(H, N[re]))
          return !0;
      return !1;
    }
    function Ye(N, H) {
      for (var z = -1, re = N == null ? 0 : N.length, fe = Array(re); ++z < re; )
        fe[z] = H(N[z], z, N);
      return fe;
    }
    function Cr(N, H) {
      for (var z = -1, re = H.length, fe = N.length; ++z < re; )
        N[fe + z] = H[z];
      return N;
    }
    function Cs(N, H, z, re) {
      var fe = -1, Ie = N == null ? 0 : N.length;
      for (re && Ie && (z = N[++fe]); ++fe < Ie; )
        z = H(z, N[fe], fe, N);
      return z;
    }
    function M_(N, H, z, re) {
      var fe = N == null ? 0 : N.length;
      for (re && fe && (z = N[--fe]); fe--; )
        z = H(z, N[fe], fe, N);
      return z;
    }
    function xs(N, H) {
      for (var z = -1, re = N == null ? 0 : N.length; ++z < re; )
        if (H(N[z], z, N))
          return !0;
      return !1;
    }
    var z_ = As("length");
    function Z_(N) {
      return N.split("");
    }
    function q_(N) {
      return N.match(Qg) || [];
    }
    function Xh(N, H, z) {
      var re;
      return z(N, function(fe, Ie, st) {
        if (H(fe, Ie, st))
          return re = Ie, !1;
      }), re;
    }
    function Iu(N, H, z, re) {
      for (var fe = N.length, Ie = z + (re ? 1 : -1); re ? Ie-- : ++Ie < fe; )
        if (H(N[Ie], Ie, N))
          return Ie;
      return -1;
    }
    function Fi(N, H, z) {
      return H === H ? t2(N, H, z) : Iu(N, Kh, z);
    }
    function H_(N, H, z, re) {
      for (var fe = z - 1, Ie = N.length; ++fe < Ie; )
        if (re(N[fe], H))
          return fe;
      return -1;
    }
    function Kh(N) {
      return N !== N;
    }
    function Yh(N, H) {
      var z = N == null ? 0 : N.length;
      return z ? Bs(N, H) / z : xt;
    }
    function As(N) {
      return function(H) {
        return H == null ? t : H[N];
      };
    }
    function Fs(N) {
      return function(H) {
        return N == null ? t : N[H];
      };
    }
    function Qh(N, H, z, re, fe) {
      return fe(N, function(Ie, st, Ue) {
        z = re ? (re = !1, Ie) : H(z, Ie, st, Ue);
      }), z;
    }
    function G_(N, H) {
      var z = N.length;
      for (N.sort(H); z--; )
        N[z] = N[z].value;
      return N;
    }
    function Bs(N, H) {
      for (var z, re = -1, fe = N.length; ++re < fe; ) {
        var Ie = H(N[re]);
        Ie !== t && (z = z === t ? Ie : z + Ie);
      }
      return z;
    }
    function Ss(N, H) {
      for (var z = -1, re = Array(N); ++z < N; )
        re[z] = H(z);
      return re;
    }
    function W_(N, H) {
      return Ye(H, function(z) {
        return [z, N[z]];
      });
    }
    function Jh(N) {
      return N && N.slice(0, nc(N) + 1).replace(gs, "");
    }
    function Vt(N) {
      return function(H) {
        return N(H);
      };
    }
    function ks(N, H) {
      return Ye(H, function(z) {
        return N[z];
      });
    }
    function pa(N, H) {
      return N.has(H);
    }
    function jh(N, H) {
      for (var z = -1, re = N.length; ++z < re && Fi(H, N[z], 0) > -1; )
        ;
      return z;
    }
    function ec(N, H) {
      for (var z = N.length; z-- && Fi(H, N[z], 0) > -1; )
        ;
      return z;
    }
    function V_(N, H) {
      for (var z = N.length, re = 0; z--; )
        N[z] === H && ++re;
      return re;
    }
    var X_ = Fs(I_), K_ = Fs(T_);
    function Y_(N) {
      return "\\" + R_[N];
    }
    function Q_(N, H) {
      return N == null ? t : N[H];
    }
    function Bi(N) {
      return F_.test(N);
    }
    function J_(N) {
      return B_.test(N);
    }
    function j_(N) {
      for (var H, z = []; !(H = N.next()).done; )
        z.push(H.value);
      return z;
    }
    function Is(N) {
      var H = -1, z = Array(N.size);
      return N.forEach(function(re, fe) {
        z[++H] = [fe, re];
      }), z;
    }
    function tc(N, H) {
      return function(z) {
        return N(H(z));
      };
    }
    function xr(N, H) {
      for (var z = -1, re = N.length, fe = 0, Ie = []; ++z < re; ) {
        var st = N[z];
        (st === H || st === d) && (N[z] = d, Ie[fe++] = z);
      }
      return Ie;
    }
    function Tu(N) {
      var H = -1, z = Array(N.size);
      return N.forEach(function(re) {
        z[++H] = re;
      }), z;
    }
    function e2(N) {
      var H = -1, z = Array(N.size);
      return N.forEach(function(re) {
        z[++H] = [re, re];
      }), z;
    }
    function t2(N, H, z) {
      for (var re = z - 1, fe = N.length; ++re < fe; )
        if (N[re] === H)
          return re;
      return -1;
    }
    function n2(N, H, z) {
      for (var re = z + 1; re--; )
        if (N[re] === H)
          return re;
      return re;
    }
    function Si(N) {
      return Bi(N) ? i2(N) : z_(N);
    }
    function Cn(N) {
      return Bi(N) ? a2(N) : Z_(N);
    }
    function nc(N) {
      for (var H = N.length; H-- && Vg.test(N.charAt(H)); )
        ;
      return H;
    }
    var r2 = Fs($_);
    function i2(N) {
      for (var H = Ds.lastIndex = 0; Ds.test(N); )
        ++H;
      return H;
    }
    function a2(N) {
      return N.match(Ds) || [];
    }
    function u2(N) {
      return N.match(A_) || [];
    }
    var o2 = function N(H) {
      H = H == null ? gt : ki.defaults(gt.Object(), H, ki.pick(gt, S_));
      var z = H.Array, re = H.Date, fe = H.Error, Ie = H.Function, st = H.Math, Ue = H.Object, Ts = H.RegExp, s2 = H.String, on = H.TypeError, $u = z.prototype, f2 = Ie.prototype, Ii = Ue.prototype, Ru = H["__core-js_shared__"], Nu = f2.toString, Le = Ii.hasOwnProperty, l2 = 0, rc = function() {
        var i = /[^.]+$/.exec(Ru && Ru.keys && Ru.keys.IE_PROTO || "");
        return i ? "Symbol(src)_1." + i : "";
      }(), Lu = Ii.toString, h2 = Nu.call(Ue), c2 = gt._, d2 = Ts(
        "^" + Nu.call(Le).replace(ps, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
      ), Ou = Mh ? H.Buffer : t, Ar = H.Symbol, Pu = H.Uint8Array, ic = Ou ? Ou.allocUnsafe : t, Uu = tc(Ue.getPrototypeOf, Ue), ac = Ue.create, uc = Ii.propertyIsEnumerable, Mu = $u.splice, oc = Ar ? Ar.isConcatSpreadable : t, ga = Ar ? Ar.iterator : t, Vr = Ar ? Ar.toStringTag : t, zu = function() {
        try {
          var i = Jr(Ue, "defineProperty");
          return i({}, "", {}), i;
        } catch {
        }
      }(), p2 = H.clearTimeout !== gt.clearTimeout && H.clearTimeout, g2 = re && re.now !== gt.Date.now && re.now, _2 = H.setTimeout !== gt.setTimeout && H.setTimeout, Zu = st.ceil, qu = st.floor, $s = Ue.getOwnPropertySymbols, w2 = Ou ? Ou.isBuffer : t, sc = H.isFinite, b2 = $u.join, v2 = tc(Ue.keys, Ue), ft = st.max, Et = st.min, D2 = re.now, m2 = H.parseInt, fc = st.random, y2 = $u.reverse, Rs = Jr(H, "DataView"), _a = Jr(H, "Map"), Ns = Jr(H, "Promise"), Ti = Jr(H, "Set"), wa = Jr(H, "WeakMap"), ba = Jr(Ue, "create"), Hu = wa && new wa(), $i = {}, E2 = jr(Rs), C2 = jr(_a), x2 = jr(Ns), A2 = jr(Ti), F2 = jr(wa), Gu = Ar ? Ar.prototype : t, va = Gu ? Gu.valueOf : t, lc = Gu ? Gu.toString : t;
      function E(i) {
        if (tt(i) && !le(i) && !(i instanceof ye)) {
          if (i instanceof sn)
            return i;
          if (Le.call(i, "__wrapped__"))
            return h0(i);
        }
        return new sn(i);
      }
      var Ri = /* @__PURE__ */ function() {
        function i() {
        }
        return function(u) {
          if (!et(u))
            return {};
          if (ac)
            return ac(u);
          i.prototype = u;
          var f = new i();
          return i.prototype = t, f;
        };
      }();
      function Wu() {
      }
      function sn(i, u) {
        this.__wrapped__ = i, this.__actions__ = [], this.__chain__ = !!u, this.__index__ = 0, this.__values__ = t;
      }
      E.templateSettings = {
        /**
         * Used to detect `data` property values to be HTML-escaped.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        escape: zg,
        /**
         * Used to detect code to be evaluated.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        evaluate: Zg,
        /**
         * Used to detect `data` property values to inject.
         *
         * @memberOf _.templateSettings
         * @type {RegExp}
         */
        interpolate: vh,
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
          _: E
        }
      }, E.prototype = Wu.prototype, E.prototype.constructor = E, sn.prototype = Ri(Wu.prototype), sn.prototype.constructor = sn;
      function ye(i) {
        this.__wrapped__ = i, this.__actions__ = [], this.__dir__ = 1, this.__filtered__ = !1, this.__iteratees__ = [], this.__takeCount__ = me, this.__views__ = [];
      }
      function B2() {
        var i = new ye(this.__wrapped__);
        return i.__actions__ = Lt(this.__actions__), i.__dir__ = this.__dir__, i.__filtered__ = this.__filtered__, i.__iteratees__ = Lt(this.__iteratees__), i.__takeCount__ = this.__takeCount__, i.__views__ = Lt(this.__views__), i;
      }
      function S2() {
        if (this.__filtered__) {
          var i = new ye(this);
          i.__dir__ = -1, i.__filtered__ = !0;
        } else
          i = this.clone(), i.__dir__ *= -1;
        return i;
      }
      function k2() {
        var i = this.__wrapped__.value(), u = this.__dir__, f = le(i), p = u < 0, D = f ? i.length : 0, x = Zw(0, D, this.__views__), S = x.start, I = x.end, O = I - S, V = p ? I : S - 1, X = this.__iteratees__, j = X.length, ne = 0, ae = Et(O, this.__takeCount__);
        if (!f || !p && D == O && ae == O)
          return Rc(i, this.__actions__);
        var oe = [];
        e:
          for (; O-- && ne < ae; ) {
            V += u;
            for (var ge = -1, se = i[V]; ++ge < j; ) {
              var De = X[ge], xe = De.iteratee, Yt = De.type, St = xe(se);
              if (Yt == Me)
                se = St;
              else if (!St) {
                if (Yt == ve)
                  continue e;
                break e;
              }
            }
            oe[ne++] = se;
          }
        return oe;
      }
      ye.prototype = Ri(Wu.prototype), ye.prototype.constructor = ye;
      function Xr(i) {
        var u = -1, f = i == null ? 0 : i.length;
        for (this.clear(); ++u < f; ) {
          var p = i[u];
          this.set(p[0], p[1]);
        }
      }
      function I2() {
        this.__data__ = ba ? ba(null) : {}, this.size = 0;
      }
      function T2(i) {
        var u = this.has(i) && delete this.__data__[i];
        return this.size -= u ? 1 : 0, u;
      }
      function $2(i) {
        var u = this.__data__;
        if (ba) {
          var f = u[i];
          return f === v ? t : f;
        }
        return Le.call(u, i) ? u[i] : t;
      }
      function R2(i) {
        var u = this.__data__;
        return ba ? u[i] !== t : Le.call(u, i);
      }
      function N2(i, u) {
        var f = this.__data__;
        return this.size += this.has(i) ? 0 : 1, f[i] = ba && u === t ? v : u, this;
      }
      Xr.prototype.clear = I2, Xr.prototype.delete = T2, Xr.prototype.get = $2, Xr.prototype.has = R2, Xr.prototype.set = N2;
      function tr(i) {
        var u = -1, f = i == null ? 0 : i.length;
        for (this.clear(); ++u < f; ) {
          var p = i[u];
          this.set(p[0], p[1]);
        }
      }
      function L2() {
        this.__data__ = [], this.size = 0;
      }
      function O2(i) {
        var u = this.__data__, f = Vu(u, i);
        if (f < 0)
          return !1;
        var p = u.length - 1;
        return f == p ? u.pop() : Mu.call(u, f, 1), --this.size, !0;
      }
      function P2(i) {
        var u = this.__data__, f = Vu(u, i);
        return f < 0 ? t : u[f][1];
      }
      function U2(i) {
        return Vu(this.__data__, i) > -1;
      }
      function M2(i, u) {
        var f = this.__data__, p = Vu(f, i);
        return p < 0 ? (++this.size, f.push([i, u])) : f[p][1] = u, this;
      }
      tr.prototype.clear = L2, tr.prototype.delete = O2, tr.prototype.get = P2, tr.prototype.has = U2, tr.prototype.set = M2;
      function nr(i) {
        var u = -1, f = i == null ? 0 : i.length;
        for (this.clear(); ++u < f; ) {
          var p = i[u];
          this.set(p[0], p[1]);
        }
      }
      function z2() {
        this.size = 0, this.__data__ = {
          hash: new Xr(),
          map: new (_a || tr)(),
          string: new Xr()
        };
      }
      function Z2(i) {
        var u = ao(this, i).delete(i);
        return this.size -= u ? 1 : 0, u;
      }
      function q2(i) {
        return ao(this, i).get(i);
      }
      function H2(i) {
        return ao(this, i).has(i);
      }
      function G2(i, u) {
        var f = ao(this, i), p = f.size;
        return f.set(i, u), this.size += f.size == p ? 0 : 1, this;
      }
      nr.prototype.clear = z2, nr.prototype.delete = Z2, nr.prototype.get = q2, nr.prototype.has = H2, nr.prototype.set = G2;
      function Kr(i) {
        var u = -1, f = i == null ? 0 : i.length;
        for (this.__data__ = new nr(); ++u < f; )
          this.add(i[u]);
      }
      function W2(i) {
        return this.__data__.set(i, v), this;
      }
      function V2(i) {
        return this.__data__.has(i);
      }
      Kr.prototype.add = Kr.prototype.push = W2, Kr.prototype.has = V2;
      function xn(i) {
        var u = this.__data__ = new tr(i);
        this.size = u.size;
      }
      function X2() {
        this.__data__ = new tr(), this.size = 0;
      }
      function K2(i) {
        var u = this.__data__, f = u.delete(i);
        return this.size = u.size, f;
      }
      function Y2(i) {
        return this.__data__.get(i);
      }
      function Q2(i) {
        return this.__data__.has(i);
      }
      function J2(i, u) {
        var f = this.__data__;
        if (f instanceof tr) {
          var p = f.__data__;
          if (!_a || p.length < s - 1)
            return p.push([i, u]), this.size = ++f.size, this;
          f = this.__data__ = new nr(p);
        }
        return f.set(i, u), this.size = f.size, this;
      }
      xn.prototype.clear = X2, xn.prototype.delete = K2, xn.prototype.get = Y2, xn.prototype.has = Q2, xn.prototype.set = J2;
      function hc(i, u) {
        var f = le(i), p = !f && ei(i), D = !f && !p && Ir(i), x = !f && !p && !D && Pi(i), S = f || p || D || x, I = S ? Ss(i.length, s2) : [], O = I.length;
        for (var V in i)
          (u || Le.call(i, V)) && !(S && // Safari 9 has enumerable `arguments.length` in strict mode.
          (V == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
          D && (V == "offset" || V == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
          x && (V == "buffer" || V == "byteLength" || V == "byteOffset") || // Skip index properties.
          ur(V, O))) && I.push(V);
        return I;
      }
      function cc(i) {
        var u = i.length;
        return u ? i[Ws(0, u - 1)] : t;
      }
      function j2(i, u) {
        return uo(Lt(i), Yr(u, 0, i.length));
      }
      function ew(i) {
        return uo(Lt(i));
      }
      function Ls(i, u, f) {
        (f !== t && !An(i[u], f) || f === t && !(u in i)) && rr(i, u, f);
      }
      function Da(i, u, f) {
        var p = i[u];
        (!(Le.call(i, u) && An(p, f)) || f === t && !(u in i)) && rr(i, u, f);
      }
      function Vu(i, u) {
        for (var f = i.length; f--; )
          if (An(i[f][0], u))
            return f;
        return -1;
      }
      function tw(i, u, f, p) {
        return Fr(i, function(D, x, S) {
          u(p, D, f(D), S);
        }), p;
      }
      function dc(i, u) {
        return i && Pn(u, ct(u), i);
      }
      function nw(i, u) {
        return i && Pn(u, Pt(u), i);
      }
      function rr(i, u, f) {
        u == "__proto__" && zu ? zu(i, u, {
          configurable: !0,
          enumerable: !0,
          value: f,
          writable: !0
        }) : i[u] = f;
      }
      function Os(i, u) {
        for (var f = -1, p = u.length, D = z(p), x = i == null; ++f < p; )
          D[f] = x ? t : bf(i, u[f]);
        return D;
      }
      function Yr(i, u, f) {
        return i === i && (f !== t && (i = i <= f ? i : f), u !== t && (i = i >= u ? i : u)), i;
      }
      function fn(i, u, f, p, D, x) {
        var S, I = u & A, O = u & C, V = u & y;
        if (f && (S = D ? f(i, p, D, x) : f(i)), S !== t)
          return S;
        if (!et(i))
          return i;
        var X = le(i);
        if (X) {
          if (S = Hw(i), !I)
            return Lt(i, S);
        } else {
          var j = Ct(i), ne = j == En || j == rn;
          if (Ir(i))
            return Oc(i, I);
          if (j == Gt || j == At || ne && !D) {
            if (S = O || ne ? {} : n0(i), !I)
              return O ? $w(i, nw(S, i)) : Tw(i, dc(S, i));
          } else {
            if (!He[j])
              return D ? i : {};
            S = Gw(i, j, I);
          }
        }
        x || (x = new xn());
        var ae = x.get(i);
        if (ae)
          return ae;
        x.set(i, S), I0(i) ? i.forEach(function(se) {
          S.add(fn(se, u, f, se, i, x));
        }) : S0(i) && i.forEach(function(se, De) {
          S.set(De, fn(se, u, f, De, i, x));
        });
        var oe = V ? O ? rf : nf : O ? Pt : ct, ge = X ? t : oe(i);
        return un(ge || i, function(se, De) {
          ge && (De = se, se = i[De]), Da(S, De, fn(se, u, f, De, i, x));
        }), S;
      }
      function rw(i) {
        var u = ct(i);
        return function(f) {
          return pc(f, i, u);
        };
      }
      function pc(i, u, f) {
        var p = f.length;
        if (i == null)
          return !p;
        for (i = Ue(i); p--; ) {
          var D = f[p], x = u[D], S = i[D];
          if (S === t && !(D in i) || !x(S))
            return !1;
        }
        return !0;
      }
      function gc(i, u, f) {
        if (typeof i != "function")
          throw new on(h);
        return Fa(function() {
          i.apply(t, f);
        }, u);
      }
      function ma(i, u, f, p) {
        var D = -1, x = ku, S = !0, I = i.length, O = [], V = u.length;
        if (!I)
          return O;
        f && (u = Ye(u, Vt(f))), p ? (x = Es, S = !1) : u.length >= s && (x = pa, S = !1, u = new Kr(u));
        e:
          for (; ++D < I; ) {
            var X = i[D], j = f == null ? X : f(X);
            if (X = p || X !== 0 ? X : 0, S && j === j) {
              for (var ne = V; ne--; )
                if (u[ne] === j)
                  continue e;
              O.push(X);
            } else x(u, j, p) || O.push(X);
          }
        return O;
      }
      var Fr = Zc(On), _c = Zc(Us, !0);
      function iw(i, u) {
        var f = !0;
        return Fr(i, function(p, D, x) {
          return f = !!u(p, D, x), f;
        }), f;
      }
      function Xu(i, u, f) {
        for (var p = -1, D = i.length; ++p < D; ) {
          var x = i[p], S = u(x);
          if (S != null && (I === t ? S === S && !Kt(S) : f(S, I)))
            var I = S, O = x;
        }
        return O;
      }
      function aw(i, u, f, p) {
        var D = i.length;
        for (f = pe(f), f < 0 && (f = -f > D ? 0 : D + f), p = p === t || p > D ? D : pe(p), p < 0 && (p += D), p = f > p ? 0 : $0(p); f < p; )
          i[f++] = u;
        return i;
      }
      function wc(i, u) {
        var f = [];
        return Fr(i, function(p, D, x) {
          u(p, D, x) && f.push(p);
        }), f;
      }
      function _t(i, u, f, p, D) {
        var x = -1, S = i.length;
        for (f || (f = Vw), D || (D = []); ++x < S; ) {
          var I = i[x];
          u > 0 && f(I) ? u > 1 ? _t(I, u - 1, f, p, D) : Cr(D, I) : p || (D[D.length] = I);
        }
        return D;
      }
      var Ps = qc(), bc = qc(!0);
      function On(i, u) {
        return i && Ps(i, u, ct);
      }
      function Us(i, u) {
        return i && bc(i, u, ct);
      }
      function Ku(i, u) {
        return Er(u, function(f) {
          return or(i[f]);
        });
      }
      function Qr(i, u) {
        u = Sr(u, i);
        for (var f = 0, p = u.length; i != null && f < p; )
          i = i[Un(u[f++])];
        return f && f == p ? i : t;
      }
      function vc(i, u, f) {
        var p = u(i);
        return le(i) ? p : Cr(p, f(i));
      }
      function Ft(i) {
        return i == null ? i === t ? cs : ls : Vr && Vr in Ue(i) ? zw(i) : eb(i);
      }
      function Ms(i, u) {
        return i > u;
      }
      function uw(i, u) {
        return i != null && Le.call(i, u);
      }
      function ow(i, u) {
        return i != null && u in Ue(i);
      }
      function sw(i, u, f) {
        return i >= Et(u, f) && i < ft(u, f);
      }
      function zs(i, u, f) {
        for (var p = f ? Es : ku, D = i[0].length, x = i.length, S = x, I = z(x), O = 1 / 0, V = []; S--; ) {
          var X = i[S];
          S && u && (X = Ye(X, Vt(u))), O = Et(X.length, O), I[S] = !f && (u || D >= 120 && X.length >= 120) ? new Kr(S && X) : t;
        }
        X = i[0];
        var j = -1, ne = I[0];
        e:
          for (; ++j < D && V.length < O; ) {
            var ae = X[j], oe = u ? u(ae) : ae;
            if (ae = f || ae !== 0 ? ae : 0, !(ne ? pa(ne, oe) : p(V, oe, f))) {
              for (S = x; --S; ) {
                var ge = I[S];
                if (!(ge ? pa(ge, oe) : p(i[S], oe, f)))
                  continue e;
              }
              ne && ne.push(oe), V.push(ae);
            }
          }
        return V;
      }
      function fw(i, u, f, p) {
        return On(i, function(D, x, S) {
          u(p, f(D), x, S);
        }), p;
      }
      function ya(i, u, f) {
        u = Sr(u, i), i = u0(i, u);
        var p = i == null ? i : i[Un(hn(u))];
        return p == null ? t : Wt(p, i, f);
      }
      function Dc(i) {
        return tt(i) && Ft(i) == At;
      }
      function lw(i) {
        return tt(i) && Ft(i) == m;
      }
      function hw(i) {
        return tt(i) && Ft(i) == Rt;
      }
      function Ea(i, u, f, p, D) {
        return i === u ? !0 : i == null || u == null || !tt(i) && !tt(u) ? i !== i && u !== u : cw(i, u, f, p, Ea, D);
      }
      function cw(i, u, f, p, D, x) {
        var S = le(i), I = le(u), O = S ? nn : Ct(i), V = I ? nn : Ct(u);
        O = O == At ? Gt : O, V = V == At ? Gt : V;
        var X = O == Gt, j = V == Gt, ne = O == V;
        if (ne && Ir(i)) {
          if (!Ir(u))
            return !1;
          S = !0, X = !1;
        }
        if (ne && !X)
          return x || (x = new xn()), S || Pi(i) ? jc(i, u, f, p, D, x) : Uw(i, u, O, f, p, D, x);
        if (!(f & k)) {
          var ae = X && Le.call(i, "__wrapped__"), oe = j && Le.call(u, "__wrapped__");
          if (ae || oe) {
            var ge = ae ? i.value() : i, se = oe ? u.value() : u;
            return x || (x = new xn()), D(ge, se, f, p, x);
          }
        }
        return ne ? (x || (x = new xn()), Mw(i, u, f, p, D, x)) : !1;
      }
      function dw(i) {
        return tt(i) && Ct(i) == ot;
      }
      function Zs(i, u, f, p) {
        var D = f.length, x = D, S = !p;
        if (i == null)
          return !x;
        for (i = Ue(i); D--; ) {
          var I = f[D];
          if (S && I[2] ? I[1] !== i[I[0]] : !(I[0] in i))
            return !1;
        }
        for (; ++D < x; ) {
          I = f[D];
          var O = I[0], V = i[O], X = I[1];
          if (S && I[2]) {
            if (V === t && !(O in i))
              return !1;
          } else {
            var j = new xn();
            if (p)
              var ne = p(V, X, O, i, u, j);
            if (!(ne === t ? Ea(X, V, k | B, p, j) : ne))
              return !1;
          }
        }
        return !0;
      }
      function mc(i) {
        if (!et(i) || Kw(i))
          return !1;
        var u = or(i) ? d2 : r_;
        return u.test(jr(i));
      }
      function pw(i) {
        return tt(i) && Ft(i) == mr;
      }
      function gw(i) {
        return tt(i) && Ct(i) == mt;
      }
      function _w(i) {
        return tt(i) && co(i.length) && !!Ve[Ft(i)];
      }
      function yc(i) {
        return typeof i == "function" ? i : i == null ? Ut : typeof i == "object" ? le(i) ? xc(i[0], i[1]) : Cc(i) : H0(i);
      }
      function qs(i) {
        if (!Aa(i))
          return v2(i);
        var u = [];
        for (var f in Ue(i))
          Le.call(i, f) && f != "constructor" && u.push(f);
        return u;
      }
      function ww(i) {
        if (!et(i))
          return jw(i);
        var u = Aa(i), f = [];
        for (var p in i)
          p == "constructor" && (u || !Le.call(i, p)) || f.push(p);
        return f;
      }
      function Hs(i, u) {
        return i < u;
      }
      function Ec(i, u) {
        var f = -1, p = Ot(i) ? z(i.length) : [];
        return Fr(i, function(D, x, S) {
          p[++f] = u(D, x, S);
        }), p;
      }
      function Cc(i) {
        var u = uf(i);
        return u.length == 1 && u[0][2] ? i0(u[0][0], u[0][1]) : function(f) {
          return f === i || Zs(f, i, u);
        };
      }
      function xc(i, u) {
        return sf(i) && r0(u) ? i0(Un(i), u) : function(f) {
          var p = bf(f, i);
          return p === t && p === u ? vf(f, i) : Ea(u, p, k | B);
        };
      }
      function Yu(i, u, f, p, D) {
        i !== u && Ps(u, function(x, S) {
          if (D || (D = new xn()), et(x))
            bw(i, u, S, f, Yu, p, D);
          else {
            var I = p ? p(lf(i, S), x, S + "", i, u, D) : t;
            I === t && (I = x), Ls(i, S, I);
          }
        }, Pt);
      }
      function bw(i, u, f, p, D, x, S) {
        var I = lf(i, f), O = lf(u, f), V = S.get(O);
        if (V) {
          Ls(i, f, V);
          return;
        }
        var X = x ? x(I, O, f + "", i, u, S) : t, j = X === t;
        if (j) {
          var ne = le(O), ae = !ne && Ir(O), oe = !ne && !ae && Pi(O);
          X = O, ne || ae || oe ? le(I) ? X = I : rt(I) ? X = Lt(I) : ae ? (j = !1, X = Oc(O, !0)) : oe ? (j = !1, X = Pc(O, !0)) : X = [] : Ba(O) || ei(O) ? (X = I, ei(I) ? X = R0(I) : (!et(I) || or(I)) && (X = n0(O))) : j = !1;
        }
        j && (S.set(O, X), D(X, O, p, x, S), S.delete(O)), Ls(i, f, X);
      }
      function Ac(i, u) {
        var f = i.length;
        if (f)
          return u += u < 0 ? f : 0, ur(u, f) ? i[u] : t;
      }
      function Fc(i, u, f) {
        u.length ? u = Ye(u, function(x) {
          return le(x) ? function(S) {
            return Qr(S, x.length === 1 ? x[0] : x);
          } : x;
        }) : u = [Ut];
        var p = -1;
        u = Ye(u, Vt(ue()));
        var D = Ec(i, function(x, S, I) {
          var O = Ye(u, function(V) {
            return V(x);
          });
          return { criteria: O, index: ++p, value: x };
        });
        return G_(D, function(x, S) {
          return Iw(x, S, f);
        });
      }
      function vw(i, u) {
        return Bc(i, u, function(f, p) {
          return vf(i, p);
        });
      }
      function Bc(i, u, f) {
        for (var p = -1, D = u.length, x = {}; ++p < D; ) {
          var S = u[p], I = Qr(i, S);
          f(I, S) && Ca(x, Sr(S, i), I);
        }
        return x;
      }
      function Dw(i) {
        return function(u) {
          return Qr(u, i);
        };
      }
      function Gs(i, u, f, p) {
        var D = p ? H_ : Fi, x = -1, S = u.length, I = i;
        for (i === u && (u = Lt(u)), f && (I = Ye(i, Vt(f))); ++x < S; )
          for (var O = 0, V = u[x], X = f ? f(V) : V; (O = D(I, X, O, p)) > -1; )
            I !== i && Mu.call(I, O, 1), Mu.call(i, O, 1);
        return i;
      }
      function Sc(i, u) {
        for (var f = i ? u.length : 0, p = f - 1; f--; ) {
          var D = u[f];
          if (f == p || D !== x) {
            var x = D;
            ur(D) ? Mu.call(i, D, 1) : Ks(i, D);
          }
        }
        return i;
      }
      function Ws(i, u) {
        return i + qu(fc() * (u - i + 1));
      }
      function mw(i, u, f, p) {
        for (var D = -1, x = ft(Zu((u - i) / (f || 1)), 0), S = z(x); x--; )
          S[p ? x : ++D] = i, i += f;
        return S;
      }
      function Vs(i, u) {
        var f = "";
        if (!i || u < 1 || u > Be)
          return f;
        do
          u % 2 && (f += i), u = qu(u / 2), u && (i += i);
        while (u);
        return f;
      }
      function we(i, u) {
        return hf(a0(i, u, Ut), i + "");
      }
      function yw(i) {
        return cc(Ui(i));
      }
      function Ew(i, u) {
        var f = Ui(i);
        return uo(f, Yr(u, 0, f.length));
      }
      function Ca(i, u, f, p) {
        if (!et(i))
          return i;
        u = Sr(u, i);
        for (var D = -1, x = u.length, S = x - 1, I = i; I != null && ++D < x; ) {
          var O = Un(u[D]), V = f;
          if (O === "__proto__" || O === "constructor" || O === "prototype")
            return i;
          if (D != S) {
            var X = I[O];
            V = p ? p(X, O, I) : t, V === t && (V = et(X) ? X : ur(u[D + 1]) ? [] : {});
          }
          Da(I, O, V), I = I[O];
        }
        return i;
      }
      var kc = Hu ? function(i, u) {
        return Hu.set(i, u), i;
      } : Ut, Cw = zu ? function(i, u) {
        return zu(i, "toString", {
          configurable: !0,
          enumerable: !1,
          value: mf(u),
          writable: !0
        });
      } : Ut;
      function xw(i) {
        return uo(Ui(i));
      }
      function ln(i, u, f) {
        var p = -1, D = i.length;
        u < 0 && (u = -u > D ? 0 : D + u), f = f > D ? D : f, f < 0 && (f += D), D = u > f ? 0 : f - u >>> 0, u >>>= 0;
        for (var x = z(D); ++p < D; )
          x[p] = i[p + u];
        return x;
      }
      function Aw(i, u) {
        var f;
        return Fr(i, function(p, D, x) {
          return f = u(p, D, x), !f;
        }), !!f;
      }
      function Qu(i, u, f) {
        var p = 0, D = i == null ? p : i.length;
        if (typeof u == "number" && u === u && D <= tn) {
          for (; p < D; ) {
            var x = p + D >>> 1, S = i[x];
            S !== null && !Kt(S) && (f ? S <= u : S < u) ? p = x + 1 : D = x;
          }
          return D;
        }
        return Xs(i, u, Ut, f);
      }
      function Xs(i, u, f, p) {
        var D = 0, x = i == null ? 0 : i.length;
        if (x === 0)
          return 0;
        u = f(u);
        for (var S = u !== u, I = u === null, O = Kt(u), V = u === t; D < x; ) {
          var X = qu((D + x) / 2), j = f(i[X]), ne = j !== t, ae = j === null, oe = j === j, ge = Kt(j);
          if (S)
            var se = p || oe;
          else V ? se = oe && (p || ne) : I ? se = oe && ne && (p || !ae) : O ? se = oe && ne && !ae && (p || !ge) : ae || ge ? se = !1 : se = p ? j <= u : j < u;
          se ? D = X + 1 : x = X;
        }
        return Et(x, nt);
      }
      function Ic(i, u) {
        for (var f = -1, p = i.length, D = 0, x = []; ++f < p; ) {
          var S = i[f], I = u ? u(S) : S;
          if (!f || !An(I, O)) {
            var O = I;
            x[D++] = S === 0 ? 0 : S;
          }
        }
        return x;
      }
      function Tc(i) {
        return typeof i == "number" ? i : Kt(i) ? xt : +i;
      }
      function Xt(i) {
        if (typeof i == "string")
          return i;
        if (le(i))
          return Ye(i, Xt) + "";
        if (Kt(i))
          return lc ? lc.call(i) : "";
        var u = i + "";
        return u == "0" && 1 / i == -ce ? "-0" : u;
      }
      function Br(i, u, f) {
        var p = -1, D = ku, x = i.length, S = !0, I = [], O = I;
        if (f)
          S = !1, D = Es;
        else if (x >= s) {
          var V = u ? null : Ow(i);
          if (V)
            return Tu(V);
          S = !1, D = pa, O = new Kr();
        } else
          O = u ? [] : I;
        e:
          for (; ++p < x; ) {
            var X = i[p], j = u ? u(X) : X;
            if (X = f || X !== 0 ? X : 0, S && j === j) {
              for (var ne = O.length; ne--; )
                if (O[ne] === j)
                  continue e;
              u && O.push(j), I.push(X);
            } else D(O, j, f) || (O !== I && O.push(j), I.push(X));
          }
        return I;
      }
      function Ks(i, u) {
        return u = Sr(u, i), i = u0(i, u), i == null || delete i[Un(hn(u))];
      }
      function $c(i, u, f, p) {
        return Ca(i, u, f(Qr(i, u)), p);
      }
      function Ju(i, u, f, p) {
        for (var D = i.length, x = p ? D : -1; (p ? x-- : ++x < D) && u(i[x], x, i); )
          ;
        return f ? ln(i, p ? 0 : x, p ? x + 1 : D) : ln(i, p ? x + 1 : 0, p ? D : x);
      }
      function Rc(i, u) {
        var f = i;
        return f instanceof ye && (f = f.value()), Cs(u, function(p, D) {
          return D.func.apply(D.thisArg, Cr([p], D.args));
        }, f);
      }
      function Ys(i, u, f) {
        var p = i.length;
        if (p < 2)
          return p ? Br(i[0]) : [];
        for (var D = -1, x = z(p); ++D < p; )
          for (var S = i[D], I = -1; ++I < p; )
            I != D && (x[D] = ma(x[D] || S, i[I], u, f));
        return Br(_t(x, 1), u, f);
      }
      function Nc(i, u, f) {
        for (var p = -1, D = i.length, x = u.length, S = {}; ++p < D; ) {
          var I = p < x ? u[p] : t;
          f(S, i[p], I);
        }
        return S;
      }
      function Qs(i) {
        return rt(i) ? i : [];
      }
      function Js(i) {
        return typeof i == "function" ? i : Ut;
      }
      function Sr(i, u) {
        return le(i) ? i : sf(i, u) ? [i] : l0($e(i));
      }
      var Fw = we;
      function kr(i, u, f) {
        var p = i.length;
        return f = f === t ? p : f, !u && f >= p ? i : ln(i, u, f);
      }
      var Lc = p2 || function(i) {
        return gt.clearTimeout(i);
      };
      function Oc(i, u) {
        if (u)
          return i.slice();
        var f = i.length, p = ic ? ic(f) : new i.constructor(f);
        return i.copy(p), p;
      }
      function js(i) {
        var u = new i.constructor(i.byteLength);
        return new Pu(u).set(new Pu(i)), u;
      }
      function Bw(i, u) {
        var f = u ? js(i.buffer) : i.buffer;
        return new i.constructor(f, i.byteOffset, i.byteLength);
      }
      function Sw(i) {
        var u = new i.constructor(i.source, Dh.exec(i));
        return u.lastIndex = i.lastIndex, u;
      }
      function kw(i) {
        return va ? Ue(va.call(i)) : {};
      }
      function Pc(i, u) {
        var f = u ? js(i.buffer) : i.buffer;
        return new i.constructor(f, i.byteOffset, i.length);
      }
      function Uc(i, u) {
        if (i !== u) {
          var f = i !== t, p = i === null, D = i === i, x = Kt(i), S = u !== t, I = u === null, O = u === u, V = Kt(u);
          if (!I && !V && !x && i > u || x && S && O && !I && !V || p && S && O || !f && O || !D)
            return 1;
          if (!p && !x && !V && i < u || V && f && D && !p && !x || I && f && D || !S && D || !O)
            return -1;
        }
        return 0;
      }
      function Iw(i, u, f) {
        for (var p = -1, D = i.criteria, x = u.criteria, S = D.length, I = f.length; ++p < S; ) {
          var O = Uc(D[p], x[p]);
          if (O) {
            if (p >= I)
              return O;
            var V = f[p];
            return O * (V == "desc" ? -1 : 1);
          }
        }
        return i.index - u.index;
      }
      function Mc(i, u, f, p) {
        for (var D = -1, x = i.length, S = f.length, I = -1, O = u.length, V = ft(x - S, 0), X = z(O + V), j = !p; ++I < O; )
          X[I] = u[I];
        for (; ++D < S; )
          (j || D < x) && (X[f[D]] = i[D]);
        for (; V--; )
          X[I++] = i[D++];
        return X;
      }
      function zc(i, u, f, p) {
        for (var D = -1, x = i.length, S = -1, I = f.length, O = -1, V = u.length, X = ft(x - I, 0), j = z(X + V), ne = !p; ++D < X; )
          j[D] = i[D];
        for (var ae = D; ++O < V; )
          j[ae + O] = u[O];
        for (; ++S < I; )
          (ne || D < x) && (j[ae + f[S]] = i[D++]);
        return j;
      }
      function Lt(i, u) {
        var f = -1, p = i.length;
        for (u || (u = z(p)); ++f < p; )
          u[f] = i[f];
        return u;
      }
      function Pn(i, u, f, p) {
        var D = !f;
        f || (f = {});
        for (var x = -1, S = u.length; ++x < S; ) {
          var I = u[x], O = p ? p(f[I], i[I], I, f, i) : t;
          O === t && (O = i[I]), D ? rr(f, I, O) : Da(f, I, O);
        }
        return f;
      }
      function Tw(i, u) {
        return Pn(i, of(i), u);
      }
      function $w(i, u) {
        return Pn(i, e0(i), u);
      }
      function ju(i, u) {
        return function(f, p) {
          var D = le(f) ? P_ : tw, x = u ? u() : {};
          return D(f, i, ue(p, 2), x);
        };
      }
      function Ni(i) {
        return we(function(u, f) {
          var p = -1, D = f.length, x = D > 1 ? f[D - 1] : t, S = D > 2 ? f[2] : t;
          for (x = i.length > 3 && typeof x == "function" ? (D--, x) : t, S && Bt(f[0], f[1], S) && (x = D < 3 ? t : x, D = 1), u = Ue(u); ++p < D; ) {
            var I = f[p];
            I && i(u, I, p, x);
          }
          return u;
        });
      }
      function Zc(i, u) {
        return function(f, p) {
          if (f == null)
            return f;
          if (!Ot(f))
            return i(f, p);
          for (var D = f.length, x = u ? D : -1, S = Ue(f); (u ? x-- : ++x < D) && p(S[x], x, S) !== !1; )
            ;
          return f;
        };
      }
      function qc(i) {
        return function(u, f, p) {
          for (var D = -1, x = Ue(u), S = p(u), I = S.length; I--; ) {
            var O = S[i ? I : ++D];
            if (f(x[O], O, x) === !1)
              break;
          }
          return u;
        };
      }
      function Rw(i, u, f) {
        var p = u & P, D = xa(i);
        function x() {
          var S = this && this !== gt && this instanceof x ? D : i;
          return S.apply(p ? f : this, arguments);
        }
        return x;
      }
      function Hc(i) {
        return function(u) {
          u = $e(u);
          var f = Bi(u) ? Cn(u) : t, p = f ? f[0] : u.charAt(0), D = f ? kr(f, 1).join("") : u.slice(1);
          return p[i]() + D;
        };
      }
      function Li(i) {
        return function(u) {
          return Cs(Z0(z0(u).replace(C_, "")), i, "");
        };
      }
      function xa(i) {
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
          var f = Ri(i.prototype), p = i.apply(f, u);
          return et(p) ? p : f;
        };
      }
      function Nw(i, u, f) {
        var p = xa(i);
        function D() {
          for (var x = arguments.length, S = z(x), I = x, O = Oi(D); I--; )
            S[I] = arguments[I];
          var V = x < 3 && S[0] !== O && S[x - 1] !== O ? [] : xr(S, O);
          if (x -= V.length, x < f)
            return Kc(
              i,
              u,
              eo,
              D.placeholder,
              t,
              S,
              V,
              t,
              t,
              f - x
            );
          var X = this && this !== gt && this instanceof D ? p : i;
          return Wt(X, this, S);
        }
        return D;
      }
      function Gc(i) {
        return function(u, f, p) {
          var D = Ue(u);
          if (!Ot(u)) {
            var x = ue(f, 3);
            u = ct(u), f = function(I) {
              return x(D[I], I, D);
            };
          }
          var S = i(u, f, p);
          return S > -1 ? D[x ? u[S] : S] : t;
        };
      }
      function Wc(i) {
        return ar(function(u) {
          var f = u.length, p = f, D = sn.prototype.thru;
          for (i && u.reverse(); p--; ) {
            var x = u[p];
            if (typeof x != "function")
              throw new on(h);
            if (D && !S && io(x) == "wrapper")
              var S = new sn([], !0);
          }
          for (p = S ? p : f; ++p < f; ) {
            x = u[p];
            var I = io(x), O = I == "wrapper" ? af(x) : t;
            O && ff(O[0]) && O[1] == (q | U | L | G) && !O[4].length && O[9] == 1 ? S = S[io(O[0])].apply(S, O[3]) : S = x.length == 1 && ff(x) ? S[I]() : S.thru(x);
          }
          return function() {
            var V = arguments, X = V[0];
            if (S && V.length == 1 && le(X))
              return S.plant(X).value();
            for (var j = 0, ne = f ? u[j].apply(this, V) : X; ++j < f; )
              ne = u[j].call(this, ne);
            return ne;
          };
        });
      }
      function eo(i, u, f, p, D, x, S, I, O, V) {
        var X = u & q, j = u & P, ne = u & T, ae = u & (U | $), oe = u & J, ge = ne ? t : xa(i);
        function se() {
          for (var De = arguments.length, xe = z(De), Yt = De; Yt--; )
            xe[Yt] = arguments[Yt];
          if (ae)
            var St = Oi(se), Qt = V_(xe, St);
          if (p && (xe = Mc(xe, p, D, ae)), x && (xe = zc(xe, x, S, ae)), De -= Qt, ae && De < V) {
            var it = xr(xe, St);
            return Kc(
              i,
              u,
              eo,
              se.placeholder,
              f,
              xe,
              it,
              I,
              O,
              V - De
            );
          }
          var Fn = j ? f : this, fr = ne ? Fn[i] : i;
          return De = xe.length, I ? xe = tb(xe, I) : oe && De > 1 && xe.reverse(), X && O < De && (xe.length = O), this && this !== gt && this instanceof se && (fr = ge || xa(fr)), fr.apply(Fn, xe);
        }
        return se;
      }
      function Vc(i, u) {
        return function(f, p) {
          return fw(f, i, u(p), {});
        };
      }
      function to(i, u) {
        return function(f, p) {
          var D;
          if (f === t && p === t)
            return u;
          if (f !== t && (D = f), p !== t) {
            if (D === t)
              return p;
            typeof f == "string" || typeof p == "string" ? (f = Xt(f), p = Xt(p)) : (f = Tc(f), p = Tc(p)), D = i(f, p);
          }
          return D;
        };
      }
      function ef(i) {
        return ar(function(u) {
          return u = Ye(u, Vt(ue())), we(function(f) {
            var p = this;
            return i(u, function(D) {
              return Wt(D, p, f);
            });
          });
        });
      }
      function no(i, u) {
        u = u === t ? " " : Xt(u);
        var f = u.length;
        if (f < 2)
          return f ? Vs(u, i) : u;
        var p = Vs(u, Zu(i / Si(u)));
        return Bi(u) ? kr(Cn(p), 0, i).join("") : p.slice(0, i);
      }
      function Lw(i, u, f, p) {
        var D = u & P, x = xa(i);
        function S() {
          for (var I = -1, O = arguments.length, V = -1, X = p.length, j = z(X + O), ne = this && this !== gt && this instanceof S ? x : i; ++V < X; )
            j[V] = p[V];
          for (; O--; )
            j[V++] = arguments[++I];
          return Wt(ne, D ? f : this, j);
        }
        return S;
      }
      function Xc(i) {
        return function(u, f, p) {
          return p && typeof p != "number" && Bt(u, f, p) && (f = p = t), u = sr(u), f === t ? (f = u, u = 0) : f = sr(f), p = p === t ? u < f ? 1 : -1 : sr(p), mw(u, f, p, i);
        };
      }
      function ro(i) {
        return function(u, f) {
          return typeof u == "string" && typeof f == "string" || (u = cn(u), f = cn(f)), i(u, f);
        };
      }
      function Kc(i, u, f, p, D, x, S, I, O, V) {
        var X = u & U, j = X ? S : t, ne = X ? t : S, ae = X ? x : t, oe = X ? t : x;
        u |= X ? L : Q, u &= ~(X ? Q : L), u & Z || (u &= ~(P | T));
        var ge = [
          i,
          u,
          D,
          ae,
          j,
          oe,
          ne,
          I,
          O,
          V
        ], se = f.apply(t, ge);
        return ff(i) && o0(se, ge), se.placeholder = p, s0(se, i, u);
      }
      function tf(i) {
        var u = st[i];
        return function(f, p) {
          if (f = cn(f), p = p == null ? 0 : Et(pe(p), 292), p && sc(f)) {
            var D = ($e(f) + "e").split("e"), x = u(D[0] + "e" + (+D[1] + p));
            return D = ($e(x) + "e").split("e"), +(D[0] + "e" + (+D[1] - p));
          }
          return u(f);
        };
      }
      var Ow = Ti && 1 / Tu(new Ti([, -0]))[1] == ce ? function(i) {
        return new Ti(i);
      } : Cf;
      function Yc(i) {
        return function(u) {
          var f = Ct(u);
          return f == ot ? Is(u) : f == mt ? e2(u) : W_(u, i(u));
        };
      }
      function ir(i, u, f, p, D, x, S, I) {
        var O = u & T;
        if (!O && typeof i != "function")
          throw new on(h);
        var V = p ? p.length : 0;
        if (V || (u &= ~(L | Q), p = D = t), S = S === t ? S : ft(pe(S), 0), I = I === t ? I : pe(I), V -= D ? D.length : 0, u & Q) {
          var X = p, j = D;
          p = D = t;
        }
        var ne = O ? t : af(i), ae = [
          i,
          u,
          f,
          p,
          D,
          X,
          j,
          x,
          S,
          I
        ];
        if (ne && Jw(ae, ne), i = ae[0], u = ae[1], f = ae[2], p = ae[3], D = ae[4], I = ae[9] = ae[9] === t ? O ? 0 : i.length : ft(ae[9] - V, 0), !I && u & (U | $) && (u &= ~(U | $)), !u || u == P)
          var oe = Rw(i, u, f);
        else u == U || u == $ ? oe = Nw(i, u, I) : (u == L || u == (P | L)) && !D.length ? oe = Lw(i, u, f, p) : oe = eo.apply(t, ae);
        var ge = ne ? kc : o0;
        return s0(ge(oe, ae), i, u);
      }
      function Qc(i, u, f, p) {
        return i === t || An(i, Ii[f]) && !Le.call(p, f) ? u : i;
      }
      function Jc(i, u, f, p, D, x) {
        return et(i) && et(u) && (x.set(u, i), Yu(i, u, t, Jc, x), x.delete(u)), i;
      }
      function Pw(i) {
        return Ba(i) ? t : i;
      }
      function jc(i, u, f, p, D, x) {
        var S = f & k, I = i.length, O = u.length;
        if (I != O && !(S && O > I))
          return !1;
        var V = x.get(i), X = x.get(u);
        if (V && X)
          return V == u && X == i;
        var j = -1, ne = !0, ae = f & B ? new Kr() : t;
        for (x.set(i, u), x.set(u, i); ++j < I; ) {
          var oe = i[j], ge = u[j];
          if (p)
            var se = S ? p(ge, oe, j, u, i, x) : p(oe, ge, j, i, u, x);
          if (se !== t) {
            if (se)
              continue;
            ne = !1;
            break;
          }
          if (ae) {
            if (!xs(u, function(De, xe) {
              if (!pa(ae, xe) && (oe === De || D(oe, De, f, p, x)))
                return ae.push(xe);
            })) {
              ne = !1;
              break;
            }
          } else if (!(oe === ge || D(oe, ge, f, p, x))) {
            ne = !1;
            break;
          }
        }
        return x.delete(i), x.delete(u), ne;
      }
      function Uw(i, u, f, p, D, x, S) {
        switch (f) {
          case _:
            if (i.byteLength != u.byteLength || i.byteOffset != u.byteOffset)
              return !1;
            i = i.buffer, u = u.buffer;
          case m:
            return !(i.byteLength != u.byteLength || !x(new Pu(i), new Pu(u)));
          case Dt:
          case Rt:
          case er:
            return An(+i, +u);
          case Ln:
            return i.name == u.name && i.message == u.message;
          case mr:
          case yt:
            return i == u + "";
          case ot:
            var I = Is;
          case mt:
            var O = p & k;
            if (I || (I = Tu), i.size != u.size && !O)
              return !1;
            var V = S.get(i);
            if (V)
              return V == u;
            p |= B, S.set(i, u);
            var X = jc(I(i), I(u), p, D, x, S);
            return S.delete(i), X;
          case yr:
            if (va)
              return va.call(i) == va.call(u);
        }
        return !1;
      }
      function Mw(i, u, f, p, D, x) {
        var S = f & k, I = nf(i), O = I.length, V = nf(u), X = V.length;
        if (O != X && !S)
          return !1;
        for (var j = O; j--; ) {
          var ne = I[j];
          if (!(S ? ne in u : Le.call(u, ne)))
            return !1;
        }
        var ae = x.get(i), oe = x.get(u);
        if (ae && oe)
          return ae == u && oe == i;
        var ge = !0;
        x.set(i, u), x.set(u, i);
        for (var se = S; ++j < O; ) {
          ne = I[j];
          var De = i[ne], xe = u[ne];
          if (p)
            var Yt = S ? p(xe, De, ne, u, i, x) : p(De, xe, ne, i, u, x);
          if (!(Yt === t ? De === xe || D(De, xe, f, p, x) : Yt)) {
            ge = !1;
            break;
          }
          se || (se = ne == "constructor");
        }
        if (ge && !se) {
          var St = i.constructor, Qt = u.constructor;
          St != Qt && "constructor" in i && "constructor" in u && !(typeof St == "function" && St instanceof St && typeof Qt == "function" && Qt instanceof Qt) && (ge = !1);
        }
        return x.delete(i), x.delete(u), ge;
      }
      function ar(i) {
        return hf(a0(i, t, p0), i + "");
      }
      function nf(i) {
        return vc(i, ct, of);
      }
      function rf(i) {
        return vc(i, Pt, e0);
      }
      var af = Hu ? function(i) {
        return Hu.get(i);
      } : Cf;
      function io(i) {
        for (var u = i.name + "", f = $i[u], p = Le.call($i, u) ? f.length : 0; p--; ) {
          var D = f[p], x = D.func;
          if (x == null || x == i)
            return D.name;
        }
        return u;
      }
      function Oi(i) {
        var u = Le.call(E, "placeholder") ? E : i;
        return u.placeholder;
      }
      function ue() {
        var i = E.iteratee || yf;
        return i = i === yf ? yc : i, arguments.length ? i(arguments[0], arguments[1]) : i;
      }
      function ao(i, u) {
        var f = i.__data__;
        return Xw(u) ? f[typeof u == "string" ? "string" : "hash"] : f.map;
      }
      function uf(i) {
        for (var u = ct(i), f = u.length; f--; ) {
          var p = u[f], D = i[p];
          u[f] = [p, D, r0(D)];
        }
        return u;
      }
      function Jr(i, u) {
        var f = Q_(i, u);
        return mc(f) ? f : t;
      }
      function zw(i) {
        var u = Le.call(i, Vr), f = i[Vr];
        try {
          i[Vr] = t;
          var p = !0;
        } catch {
        }
        var D = Lu.call(i);
        return p && (u ? i[Vr] = f : delete i[Vr]), D;
      }
      var of = $s ? function(i) {
        return i == null ? [] : (i = Ue(i), Er($s(i), function(u) {
          return uc.call(i, u);
        }));
      } : xf, e0 = $s ? function(i) {
        for (var u = []; i; )
          Cr(u, of(i)), i = Uu(i);
        return u;
      } : xf, Ct = Ft;
      (Rs && Ct(new Rs(new ArrayBuffer(1))) != _ || _a && Ct(new _a()) != ot || Ns && Ct(Ns.resolve()) != Au || Ti && Ct(new Ti()) != mt || wa && Ct(new wa()) != Nt) && (Ct = function(i) {
        var u = Ft(i), f = u == Gt ? i.constructor : t, p = f ? jr(f) : "";
        if (p)
          switch (p) {
            case E2:
              return _;
            case C2:
              return ot;
            case x2:
              return Au;
            case A2:
              return mt;
            case F2:
              return Nt;
          }
        return u;
      });
      function Zw(i, u, f) {
        for (var p = -1, D = f.length; ++p < D; ) {
          var x = f[p], S = x.size;
          switch (x.type) {
            case "drop":
              i += S;
              break;
            case "dropRight":
              u -= S;
              break;
            case "take":
              u = Et(u, i + S);
              break;
            case "takeRight":
              i = ft(i, u - S);
              break;
          }
        }
        return { start: i, end: u };
      }
      function qw(i) {
        var u = i.match(Kg);
        return u ? u[1].split(Yg) : [];
      }
      function t0(i, u, f) {
        u = Sr(u, i);
        for (var p = -1, D = u.length, x = !1; ++p < D; ) {
          var S = Un(u[p]);
          if (!(x = i != null && f(i, S)))
            break;
          i = i[S];
        }
        return x || ++p != D ? x : (D = i == null ? 0 : i.length, !!D && co(D) && ur(S, D) && (le(i) || ei(i)));
      }
      function Hw(i) {
        var u = i.length, f = new i.constructor(u);
        return u && typeof i[0] == "string" && Le.call(i, "index") && (f.index = i.index, f.input = i.input), f;
      }
      function n0(i) {
        return typeof i.constructor == "function" && !Aa(i) ? Ri(Uu(i)) : {};
      }
      function Gw(i, u, f) {
        var p = i.constructor;
        switch (u) {
          case m:
            return js(i);
          case Dt:
          case Rt:
            return new p(+i);
          case _:
            return Bw(i, f);
          case w:
          case F:
          case R:
          case M:
          case W:
          case de:
          case Ze:
          case Pe:
          case qe:
            return Pc(i, f);
          case ot:
            return new p();
          case er:
          case yt:
            return new p(i);
          case mr:
            return Sw(i);
          case mt:
            return new p();
          case yr:
            return kw(i);
        }
      }
      function Ww(i, u) {
        var f = u.length;
        if (!f)
          return i;
        var p = f - 1;
        return u[p] = (f > 1 ? "& " : "") + u[p], u = u.join(f > 2 ? ", " : " "), i.replace(Xg, `{
/* [wrapped with ` + u + `] */
`);
      }
      function Vw(i) {
        return le(i) || ei(i) || !!(oc && i && i[oc]);
      }
      function ur(i, u) {
        var f = typeof i;
        return u = u ?? Be, !!u && (f == "number" || f != "symbol" && a_.test(i)) && i > -1 && i % 1 == 0 && i < u;
      }
      function Bt(i, u, f) {
        if (!et(f))
          return !1;
        var p = typeof u;
        return (p == "number" ? Ot(f) && ur(u, f.length) : p == "string" && u in f) ? An(f[u], i) : !1;
      }
      function sf(i, u) {
        if (le(i))
          return !1;
        var f = typeof i;
        return f == "number" || f == "symbol" || f == "boolean" || i == null || Kt(i) ? !0 : Hg.test(i) || !qg.test(i) || u != null && i in Ue(u);
      }
      function Xw(i) {
        var u = typeof i;
        return u == "string" || u == "number" || u == "symbol" || u == "boolean" ? i !== "__proto__" : i === null;
      }
      function ff(i) {
        var u = io(i), f = E[u];
        if (typeof f != "function" || !(u in ye.prototype))
          return !1;
        if (i === f)
          return !0;
        var p = af(f);
        return !!p && i === p[0];
      }
      function Kw(i) {
        return !!rc && rc in i;
      }
      var Yw = Ru ? or : Af;
      function Aa(i) {
        var u = i && i.constructor, f = typeof u == "function" && u.prototype || Ii;
        return i === f;
      }
      function r0(i) {
        return i === i && !et(i);
      }
      function i0(i, u) {
        return function(f) {
          return f == null ? !1 : f[i] === u && (u !== t || i in Ue(f));
        };
      }
      function Qw(i) {
        var u = lo(i, function(p) {
          return f.size === c && f.clear(), p;
        }), f = u.cache;
        return u;
      }
      function Jw(i, u) {
        var f = i[1], p = u[1], D = f | p, x = D < (P | T | q), S = p == q && f == U || p == q && f == G && i[7].length <= u[8] || p == (q | G) && u[7].length <= u[8] && f == U;
        if (!(x || S))
          return i;
        p & P && (i[2] = u[2], D |= f & P ? 0 : Z);
        var I = u[3];
        if (I) {
          var O = i[3];
          i[3] = O ? Mc(O, I, u[4]) : I, i[4] = O ? xr(i[3], d) : u[4];
        }
        return I = u[5], I && (O = i[5], i[5] = O ? zc(O, I, u[6]) : I, i[6] = O ? xr(i[5], d) : u[6]), I = u[7], I && (i[7] = I), p & q && (i[8] = i[8] == null ? u[8] : Et(i[8], u[8])), i[9] == null && (i[9] = u[9]), i[0] = u[0], i[1] = D, i;
      }
      function jw(i) {
        var u = [];
        if (i != null)
          for (var f in Ue(i))
            u.push(f);
        return u;
      }
      function eb(i) {
        return Lu.call(i);
      }
      function a0(i, u, f) {
        return u = ft(u === t ? i.length - 1 : u, 0), function() {
          for (var p = arguments, D = -1, x = ft(p.length - u, 0), S = z(x); ++D < x; )
            S[D] = p[u + D];
          D = -1;
          for (var I = z(u + 1); ++D < u; )
            I[D] = p[D];
          return I[u] = f(S), Wt(i, this, I);
        };
      }
      function u0(i, u) {
        return u.length < 2 ? i : Qr(i, ln(u, 0, -1));
      }
      function tb(i, u) {
        for (var f = i.length, p = Et(u.length, f), D = Lt(i); p--; ) {
          var x = u[p];
          i[p] = ur(x, f) ? D[x] : t;
        }
        return i;
      }
      function lf(i, u) {
        if (!(u === "constructor" && typeof i[u] == "function") && u != "__proto__")
          return i[u];
      }
      var o0 = f0(kc), Fa = _2 || function(i, u) {
        return gt.setTimeout(i, u);
      }, hf = f0(Cw);
      function s0(i, u, f) {
        var p = u + "";
        return hf(i, Ww(p, nb(qw(p), f)));
      }
      function f0(i) {
        var u = 0, f = 0;
        return function() {
          var p = D2(), D = Ce - (p - f);
          if (f = p, D > 0) {
            if (++u >= ie)
              return arguments[0];
          } else
            u = 0;
          return i.apply(t, arguments);
        };
      }
      function uo(i, u) {
        var f = -1, p = i.length, D = p - 1;
        for (u = u === t ? p : u; ++f < u; ) {
          var x = Ws(f, D), S = i[x];
          i[x] = i[f], i[f] = S;
        }
        return i.length = u, i;
      }
      var l0 = Qw(function(i) {
        var u = [];
        return i.charCodeAt(0) === 46 && u.push(""), i.replace(Gg, function(f, p, D, x) {
          u.push(D ? x.replace(jg, "$1") : p || f);
        }), u;
      });
      function Un(i) {
        if (typeof i == "string" || Kt(i))
          return i;
        var u = i + "";
        return u == "0" && 1 / i == -ce ? "-0" : u;
      }
      function jr(i) {
        if (i != null) {
          try {
            return Nu.call(i);
          } catch {
          }
          try {
            return i + "";
          } catch {
          }
        }
        return "";
      }
      function nb(i, u) {
        return un(ze, function(f) {
          var p = "_." + f[0];
          u & f[1] && !ku(i, p) && i.push(p);
        }), i.sort();
      }
      function h0(i) {
        if (i instanceof ye)
          return i.clone();
        var u = new sn(i.__wrapped__, i.__chain__);
        return u.__actions__ = Lt(i.__actions__), u.__index__ = i.__index__, u.__values__ = i.__values__, u;
      }
      function rb(i, u, f) {
        (f ? Bt(i, u, f) : u === t) ? u = 1 : u = ft(pe(u), 0);
        var p = i == null ? 0 : i.length;
        if (!p || u < 1)
          return [];
        for (var D = 0, x = 0, S = z(Zu(p / u)); D < p; )
          S[x++] = ln(i, D, D += u);
        return S;
      }
      function ib(i) {
        for (var u = -1, f = i == null ? 0 : i.length, p = 0, D = []; ++u < f; ) {
          var x = i[u];
          x && (D[p++] = x);
        }
        return D;
      }
      function ab() {
        var i = arguments.length;
        if (!i)
          return [];
        for (var u = z(i - 1), f = arguments[0], p = i; p--; )
          u[p - 1] = arguments[p];
        return Cr(le(f) ? Lt(f) : [f], _t(u, 1));
      }
      var ub = we(function(i, u) {
        return rt(i) ? ma(i, _t(u, 1, rt, !0)) : [];
      }), ob = we(function(i, u) {
        var f = hn(u);
        return rt(f) && (f = t), rt(i) ? ma(i, _t(u, 1, rt, !0), ue(f, 2)) : [];
      }), sb = we(function(i, u) {
        var f = hn(u);
        return rt(f) && (f = t), rt(i) ? ma(i, _t(u, 1, rt, !0), t, f) : [];
      });
      function fb(i, u, f) {
        var p = i == null ? 0 : i.length;
        return p ? (u = f || u === t ? 1 : pe(u), ln(i, u < 0 ? 0 : u, p)) : [];
      }
      function lb(i, u, f) {
        var p = i == null ? 0 : i.length;
        return p ? (u = f || u === t ? 1 : pe(u), u = p - u, ln(i, 0, u < 0 ? 0 : u)) : [];
      }
      function hb(i, u) {
        return i && i.length ? Ju(i, ue(u, 3), !0, !0) : [];
      }
      function cb(i, u) {
        return i && i.length ? Ju(i, ue(u, 3), !0) : [];
      }
      function db(i, u, f, p) {
        var D = i == null ? 0 : i.length;
        return D ? (f && typeof f != "number" && Bt(i, u, f) && (f = 0, p = D), aw(i, u, f, p)) : [];
      }
      function c0(i, u, f) {
        var p = i == null ? 0 : i.length;
        if (!p)
          return -1;
        var D = f == null ? 0 : pe(f);
        return D < 0 && (D = ft(p + D, 0)), Iu(i, ue(u, 3), D);
      }
      function d0(i, u, f) {
        var p = i == null ? 0 : i.length;
        if (!p)
          return -1;
        var D = p - 1;
        return f !== t && (D = pe(f), D = f < 0 ? ft(p + D, 0) : Et(D, p - 1)), Iu(i, ue(u, 3), D, !0);
      }
      function p0(i) {
        var u = i == null ? 0 : i.length;
        return u ? _t(i, 1) : [];
      }
      function pb(i) {
        var u = i == null ? 0 : i.length;
        return u ? _t(i, ce) : [];
      }
      function gb(i, u) {
        var f = i == null ? 0 : i.length;
        return f ? (u = u === t ? 1 : pe(u), _t(i, u)) : [];
      }
      function _b(i) {
        for (var u = -1, f = i == null ? 0 : i.length, p = {}; ++u < f; ) {
          var D = i[u];
          p[D[0]] = D[1];
        }
        return p;
      }
      function g0(i) {
        return i && i.length ? i[0] : t;
      }
      function wb(i, u, f) {
        var p = i == null ? 0 : i.length;
        if (!p)
          return -1;
        var D = f == null ? 0 : pe(f);
        return D < 0 && (D = ft(p + D, 0)), Fi(i, u, D);
      }
      function bb(i) {
        var u = i == null ? 0 : i.length;
        return u ? ln(i, 0, -1) : [];
      }
      var vb = we(function(i) {
        var u = Ye(i, Qs);
        return u.length && u[0] === i[0] ? zs(u) : [];
      }), Db = we(function(i) {
        var u = hn(i), f = Ye(i, Qs);
        return u === hn(f) ? u = t : f.pop(), f.length && f[0] === i[0] ? zs(f, ue(u, 2)) : [];
      }), mb = we(function(i) {
        var u = hn(i), f = Ye(i, Qs);
        return u = typeof u == "function" ? u : t, u && f.pop(), f.length && f[0] === i[0] ? zs(f, t, u) : [];
      });
      function yb(i, u) {
        return i == null ? "" : b2.call(i, u);
      }
      function hn(i) {
        var u = i == null ? 0 : i.length;
        return u ? i[u - 1] : t;
      }
      function Eb(i, u, f) {
        var p = i == null ? 0 : i.length;
        if (!p)
          return -1;
        var D = p;
        return f !== t && (D = pe(f), D = D < 0 ? ft(p + D, 0) : Et(D, p - 1)), u === u ? n2(i, u, D) : Iu(i, Kh, D, !0);
      }
      function Cb(i, u) {
        return i && i.length ? Ac(i, pe(u)) : t;
      }
      var xb = we(_0);
      function _0(i, u) {
        return i && i.length && u && u.length ? Gs(i, u) : i;
      }
      function Ab(i, u, f) {
        return i && i.length && u && u.length ? Gs(i, u, ue(f, 2)) : i;
      }
      function Fb(i, u, f) {
        return i && i.length && u && u.length ? Gs(i, u, t, f) : i;
      }
      var Bb = ar(function(i, u) {
        var f = i == null ? 0 : i.length, p = Os(i, u);
        return Sc(i, Ye(u, function(D) {
          return ur(D, f) ? +D : D;
        }).sort(Uc)), p;
      });
      function Sb(i, u) {
        var f = [];
        if (!(i && i.length))
          return f;
        var p = -1, D = [], x = i.length;
        for (u = ue(u, 3); ++p < x; ) {
          var S = i[p];
          u(S, p, i) && (f.push(S), D.push(p));
        }
        return Sc(i, D), f;
      }
      function cf(i) {
        return i == null ? i : y2.call(i);
      }
      function kb(i, u, f) {
        var p = i == null ? 0 : i.length;
        return p ? (f && typeof f != "number" && Bt(i, u, f) ? (u = 0, f = p) : (u = u == null ? 0 : pe(u), f = f === t ? p : pe(f)), ln(i, u, f)) : [];
      }
      function Ib(i, u) {
        return Qu(i, u);
      }
      function Tb(i, u, f) {
        return Xs(i, u, ue(f, 2));
      }
      function $b(i, u) {
        var f = i == null ? 0 : i.length;
        if (f) {
          var p = Qu(i, u);
          if (p < f && An(i[p], u))
            return p;
        }
        return -1;
      }
      function Rb(i, u) {
        return Qu(i, u, !0);
      }
      function Nb(i, u, f) {
        return Xs(i, u, ue(f, 2), !0);
      }
      function Lb(i, u) {
        var f = i == null ? 0 : i.length;
        if (f) {
          var p = Qu(i, u, !0) - 1;
          if (An(i[p], u))
            return p;
        }
        return -1;
      }
      function Ob(i) {
        return i && i.length ? Ic(i) : [];
      }
      function Pb(i, u) {
        return i && i.length ? Ic(i, ue(u, 2)) : [];
      }
      function Ub(i) {
        var u = i == null ? 0 : i.length;
        return u ? ln(i, 1, u) : [];
      }
      function Mb(i, u, f) {
        return i && i.length ? (u = f || u === t ? 1 : pe(u), ln(i, 0, u < 0 ? 0 : u)) : [];
      }
      function zb(i, u, f) {
        var p = i == null ? 0 : i.length;
        return p ? (u = f || u === t ? 1 : pe(u), u = p - u, ln(i, u < 0 ? 0 : u, p)) : [];
      }
      function Zb(i, u) {
        return i && i.length ? Ju(i, ue(u, 3), !1, !0) : [];
      }
      function qb(i, u) {
        return i && i.length ? Ju(i, ue(u, 3)) : [];
      }
      var Hb = we(function(i) {
        return Br(_t(i, 1, rt, !0));
      }), Gb = we(function(i) {
        var u = hn(i);
        return rt(u) && (u = t), Br(_t(i, 1, rt, !0), ue(u, 2));
      }), Wb = we(function(i) {
        var u = hn(i);
        return u = typeof u == "function" ? u : t, Br(_t(i, 1, rt, !0), t, u);
      });
      function Vb(i) {
        return i && i.length ? Br(i) : [];
      }
      function Xb(i, u) {
        return i && i.length ? Br(i, ue(u, 2)) : [];
      }
      function Kb(i, u) {
        return u = typeof u == "function" ? u : t, i && i.length ? Br(i, t, u) : [];
      }
      function df(i) {
        if (!(i && i.length))
          return [];
        var u = 0;
        return i = Er(i, function(f) {
          if (rt(f))
            return u = ft(f.length, u), !0;
        }), Ss(u, function(f) {
          return Ye(i, As(f));
        });
      }
      function w0(i, u) {
        if (!(i && i.length))
          return [];
        var f = df(i);
        return u == null ? f : Ye(f, function(p) {
          return Wt(u, t, p);
        });
      }
      var Yb = we(function(i, u) {
        return rt(i) ? ma(i, u) : [];
      }), Qb = we(function(i) {
        return Ys(Er(i, rt));
      }), Jb = we(function(i) {
        var u = hn(i);
        return rt(u) && (u = t), Ys(Er(i, rt), ue(u, 2));
      }), jb = we(function(i) {
        var u = hn(i);
        return u = typeof u == "function" ? u : t, Ys(Er(i, rt), t, u);
      }), ev = we(df);
      function tv(i, u) {
        return Nc(i || [], u || [], Da);
      }
      function nv(i, u) {
        return Nc(i || [], u || [], Ca);
      }
      var rv = we(function(i) {
        var u = i.length, f = u > 1 ? i[u - 1] : t;
        return f = typeof f == "function" ? (i.pop(), f) : t, w0(i, f);
      });
      function b0(i) {
        var u = E(i);
        return u.__chain__ = !0, u;
      }
      function iv(i, u) {
        return u(i), i;
      }
      function oo(i, u) {
        return u(i);
      }
      var av = ar(function(i) {
        var u = i.length, f = u ? i[0] : 0, p = this.__wrapped__, D = function(x) {
          return Os(x, i);
        };
        return u > 1 || this.__actions__.length || !(p instanceof ye) || !ur(f) ? this.thru(D) : (p = p.slice(f, +f + (u ? 1 : 0)), p.__actions__.push({
          func: oo,
          args: [D],
          thisArg: t
        }), new sn(p, this.__chain__).thru(function(x) {
          return u && !x.length && x.push(t), x;
        }));
      });
      function uv() {
        return b0(this);
      }
      function ov() {
        return new sn(this.value(), this.__chain__);
      }
      function sv() {
        this.__values__ === t && (this.__values__ = T0(this.value()));
        var i = this.__index__ >= this.__values__.length, u = i ? t : this.__values__[this.__index__++];
        return { done: i, value: u };
      }
      function fv() {
        return this;
      }
      function lv(i) {
        for (var u, f = this; f instanceof Wu; ) {
          var p = h0(f);
          p.__index__ = 0, p.__values__ = t, u ? D.__wrapped__ = p : u = p;
          var D = p;
          f = f.__wrapped__;
        }
        return D.__wrapped__ = i, u;
      }
      function hv() {
        var i = this.__wrapped__;
        if (i instanceof ye) {
          var u = i;
          return this.__actions__.length && (u = new ye(this)), u = u.reverse(), u.__actions__.push({
            func: oo,
            args: [cf],
            thisArg: t
          }), new sn(u, this.__chain__);
        }
        return this.thru(cf);
      }
      function cv() {
        return Rc(this.__wrapped__, this.__actions__);
      }
      var dv = ju(function(i, u, f) {
        Le.call(i, f) ? ++i[f] : rr(i, f, 1);
      });
      function pv(i, u, f) {
        var p = le(i) ? Vh : iw;
        return f && Bt(i, u, f) && (u = t), p(i, ue(u, 3));
      }
      function gv(i, u) {
        var f = le(i) ? Er : wc;
        return f(i, ue(u, 3));
      }
      var _v = Gc(c0), wv = Gc(d0);
      function bv(i, u) {
        return _t(so(i, u), 1);
      }
      function vv(i, u) {
        return _t(so(i, u), ce);
      }
      function Dv(i, u, f) {
        return f = f === t ? 1 : pe(f), _t(so(i, u), f);
      }
      function v0(i, u) {
        var f = le(i) ? un : Fr;
        return f(i, ue(u, 3));
      }
      function D0(i, u) {
        var f = le(i) ? U_ : _c;
        return f(i, ue(u, 3));
      }
      var mv = ju(function(i, u, f) {
        Le.call(i, f) ? i[f].push(u) : rr(i, f, [u]);
      });
      function yv(i, u, f, p) {
        i = Ot(i) ? i : Ui(i), f = f && !p ? pe(f) : 0;
        var D = i.length;
        return f < 0 && (f = ft(D + f, 0)), po(i) ? f <= D && i.indexOf(u, f) > -1 : !!D && Fi(i, u, f) > -1;
      }
      var Ev = we(function(i, u, f) {
        var p = -1, D = typeof u == "function", x = Ot(i) ? z(i.length) : [];
        return Fr(i, function(S) {
          x[++p] = D ? Wt(u, S, f) : ya(S, u, f);
        }), x;
      }), Cv = ju(function(i, u, f) {
        rr(i, f, u);
      });
      function so(i, u) {
        var f = le(i) ? Ye : Ec;
        return f(i, ue(u, 3));
      }
      function xv(i, u, f, p) {
        return i == null ? [] : (le(u) || (u = u == null ? [] : [u]), f = p ? t : f, le(f) || (f = f == null ? [] : [f]), Fc(i, u, f));
      }
      var Av = ju(function(i, u, f) {
        i[f ? 0 : 1].push(u);
      }, function() {
        return [[], []];
      });
      function Fv(i, u, f) {
        var p = le(i) ? Cs : Qh, D = arguments.length < 3;
        return p(i, ue(u, 4), f, D, Fr);
      }
      function Bv(i, u, f) {
        var p = le(i) ? M_ : Qh, D = arguments.length < 3;
        return p(i, ue(u, 4), f, D, _c);
      }
      function Sv(i, u) {
        var f = le(i) ? Er : wc;
        return f(i, ho(ue(u, 3)));
      }
      function kv(i) {
        var u = le(i) ? cc : yw;
        return u(i);
      }
      function Iv(i, u, f) {
        (f ? Bt(i, u, f) : u === t) ? u = 1 : u = pe(u);
        var p = le(i) ? j2 : Ew;
        return p(i, u);
      }
      function Tv(i) {
        var u = le(i) ? ew : xw;
        return u(i);
      }
      function $v(i) {
        if (i == null)
          return 0;
        if (Ot(i))
          return po(i) ? Si(i) : i.length;
        var u = Ct(i);
        return u == ot || u == mt ? i.size : qs(i).length;
      }
      function Rv(i, u, f) {
        var p = le(i) ? xs : Aw;
        return f && Bt(i, u, f) && (u = t), p(i, ue(u, 3));
      }
      var Nv = we(function(i, u) {
        if (i == null)
          return [];
        var f = u.length;
        return f > 1 && Bt(i, u[0], u[1]) ? u = [] : f > 2 && Bt(u[0], u[1], u[2]) && (u = [u[0]]), Fc(i, _t(u, 1), []);
      }), fo = g2 || function() {
        return gt.Date.now();
      };
      function Lv(i, u) {
        if (typeof u != "function")
          throw new on(h);
        return i = pe(i), function() {
          if (--i < 1)
            return u.apply(this, arguments);
        };
      }
      function m0(i, u, f) {
        return u = f ? t : u, u = i && u == null ? i.length : u, ir(i, q, t, t, t, t, u);
      }
      function y0(i, u) {
        var f;
        if (typeof u != "function")
          throw new on(h);
        return i = pe(i), function() {
          return --i > 0 && (f = u.apply(this, arguments)), i <= 1 && (u = t), f;
        };
      }
      var pf = we(function(i, u, f) {
        var p = P;
        if (f.length) {
          var D = xr(f, Oi(pf));
          p |= L;
        }
        return ir(i, p, u, f, D);
      }), E0 = we(function(i, u, f) {
        var p = P | T;
        if (f.length) {
          var D = xr(f, Oi(E0));
          p |= L;
        }
        return ir(u, p, i, f, D);
      });
      function C0(i, u, f) {
        u = f ? t : u;
        var p = ir(i, U, t, t, t, t, t, u);
        return p.placeholder = C0.placeholder, p;
      }
      function x0(i, u, f) {
        u = f ? t : u;
        var p = ir(i, $, t, t, t, t, t, u);
        return p.placeholder = x0.placeholder, p;
      }
      function A0(i, u, f) {
        var p, D, x, S, I, O, V = 0, X = !1, j = !1, ne = !0;
        if (typeof i != "function")
          throw new on(h);
        u = cn(u) || 0, et(f) && (X = !!f.leading, j = "maxWait" in f, x = j ? ft(cn(f.maxWait) || 0, u) : x, ne = "trailing" in f ? !!f.trailing : ne);
        function ae(it) {
          var Fn = p, fr = D;
          return p = D = t, V = it, S = i.apply(fr, Fn), S;
        }
        function oe(it) {
          return V = it, I = Fa(De, u), X ? ae(it) : S;
        }
        function ge(it) {
          var Fn = it - O, fr = it - V, G0 = u - Fn;
          return j ? Et(G0, x - fr) : G0;
        }
        function se(it) {
          var Fn = it - O, fr = it - V;
          return O === t || Fn >= u || Fn < 0 || j && fr >= x;
        }
        function De() {
          var it = fo();
          if (se(it))
            return xe(it);
          I = Fa(De, ge(it));
        }
        function xe(it) {
          return I = t, ne && p ? ae(it) : (p = D = t, S);
        }
        function Yt() {
          I !== t && Lc(I), V = 0, p = O = D = I = t;
        }
        function St() {
          return I === t ? S : xe(fo());
        }
        function Qt() {
          var it = fo(), Fn = se(it);
          if (p = arguments, D = this, O = it, Fn) {
            if (I === t)
              return oe(O);
            if (j)
              return Lc(I), I = Fa(De, u), ae(O);
          }
          return I === t && (I = Fa(De, u)), S;
        }
        return Qt.cancel = Yt, Qt.flush = St, Qt;
      }
      var Ov = we(function(i, u) {
        return gc(i, 1, u);
      }), Pv = we(function(i, u, f) {
        return gc(i, cn(u) || 0, f);
      });
      function Uv(i) {
        return ir(i, J);
      }
      function lo(i, u) {
        if (typeof i != "function" || u != null && typeof u != "function")
          throw new on(h);
        var f = function() {
          var p = arguments, D = u ? u.apply(this, p) : p[0], x = f.cache;
          if (x.has(D))
            return x.get(D);
          var S = i.apply(this, p);
          return f.cache = x.set(D, S) || x, S;
        };
        return f.cache = new (lo.Cache || nr)(), f;
      }
      lo.Cache = nr;
      function ho(i) {
        if (typeof i != "function")
          throw new on(h);
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
      function Mv(i) {
        return y0(2, i);
      }
      var zv = Fw(function(i, u) {
        u = u.length == 1 && le(u[0]) ? Ye(u[0], Vt(ue())) : Ye(_t(u, 1), Vt(ue()));
        var f = u.length;
        return we(function(p) {
          for (var D = -1, x = Et(p.length, f); ++D < x; )
            p[D] = u[D].call(this, p[D]);
          return Wt(i, this, p);
        });
      }), gf = we(function(i, u) {
        var f = xr(u, Oi(gf));
        return ir(i, L, t, u, f);
      }), F0 = we(function(i, u) {
        var f = xr(u, Oi(F0));
        return ir(i, Q, t, u, f);
      }), Zv = ar(function(i, u) {
        return ir(i, G, t, t, t, u);
      });
      function qv(i, u) {
        if (typeof i != "function")
          throw new on(h);
        return u = u === t ? u : pe(u), we(i, u);
      }
      function Hv(i, u) {
        if (typeof i != "function")
          throw new on(h);
        return u = u == null ? 0 : ft(pe(u), 0), we(function(f) {
          var p = f[u], D = kr(f, 0, u);
          return p && Cr(D, p), Wt(i, this, D);
        });
      }
      function Gv(i, u, f) {
        var p = !0, D = !0;
        if (typeof i != "function")
          throw new on(h);
        return et(f) && (p = "leading" in f ? !!f.leading : p, D = "trailing" in f ? !!f.trailing : D), A0(i, u, {
          leading: p,
          maxWait: u,
          trailing: D
        });
      }
      function Wv(i) {
        return m0(i, 1);
      }
      function Vv(i, u) {
        return gf(Js(u), i);
      }
      function Xv() {
        if (!arguments.length)
          return [];
        var i = arguments[0];
        return le(i) ? i : [i];
      }
      function Kv(i) {
        return fn(i, y);
      }
      function Yv(i, u) {
        return u = typeof u == "function" ? u : t, fn(i, y, u);
      }
      function Qv(i) {
        return fn(i, A | y);
      }
      function Jv(i, u) {
        return u = typeof u == "function" ? u : t, fn(i, A | y, u);
      }
      function jv(i, u) {
        return u == null || pc(i, u, ct(u));
      }
      function An(i, u) {
        return i === u || i !== i && u !== u;
      }
      var eD = ro(Ms), tD = ro(function(i, u) {
        return i >= u;
      }), ei = Dc(/* @__PURE__ */ function() {
        return arguments;
      }()) ? Dc : function(i) {
        return tt(i) && Le.call(i, "callee") && !uc.call(i, "callee");
      }, le = z.isArray, nD = zh ? Vt(zh) : lw;
      function Ot(i) {
        return i != null && co(i.length) && !or(i);
      }
      function rt(i) {
        return tt(i) && Ot(i);
      }
      function rD(i) {
        return i === !0 || i === !1 || tt(i) && Ft(i) == Dt;
      }
      var Ir = w2 || Af, iD = Zh ? Vt(Zh) : hw;
      function aD(i) {
        return tt(i) && i.nodeType === 1 && !Ba(i);
      }
      function uD(i) {
        if (i == null)
          return !0;
        if (Ot(i) && (le(i) || typeof i == "string" || typeof i.splice == "function" || Ir(i) || Pi(i) || ei(i)))
          return !i.length;
        var u = Ct(i);
        if (u == ot || u == mt)
          return !i.size;
        if (Aa(i))
          return !qs(i).length;
        for (var f in i)
          if (Le.call(i, f))
            return !1;
        return !0;
      }
      function oD(i, u) {
        return Ea(i, u);
      }
      function sD(i, u, f) {
        f = typeof f == "function" ? f : t;
        var p = f ? f(i, u) : t;
        return p === t ? Ea(i, u, t, f) : !!p;
      }
      function _f(i) {
        if (!tt(i))
          return !1;
        var u = Ft(i);
        return u == Ln || u == Gr || typeof i.message == "string" && typeof i.name == "string" && !Ba(i);
      }
      function fD(i) {
        return typeof i == "number" && sc(i);
      }
      function or(i) {
        if (!et(i))
          return !1;
        var u = Ft(i);
        return u == En || u == rn || u == Dr || u == hs;
      }
      function B0(i) {
        return typeof i == "number" && i == pe(i);
      }
      function co(i) {
        return typeof i == "number" && i > -1 && i % 1 == 0 && i <= Be;
      }
      function et(i) {
        var u = typeof i;
        return i != null && (u == "object" || u == "function");
      }
      function tt(i) {
        return i != null && typeof i == "object";
      }
      var S0 = qh ? Vt(qh) : dw;
      function lD(i, u) {
        return i === u || Zs(i, u, uf(u));
      }
      function hD(i, u, f) {
        return f = typeof f == "function" ? f : t, Zs(i, u, uf(u), f);
      }
      function cD(i) {
        return k0(i) && i != +i;
      }
      function dD(i) {
        if (Yw(i))
          throw new fe(o);
        return mc(i);
      }
      function pD(i) {
        return i === null;
      }
      function gD(i) {
        return i == null;
      }
      function k0(i) {
        return typeof i == "number" || tt(i) && Ft(i) == er;
      }
      function Ba(i) {
        if (!tt(i) || Ft(i) != Gt)
          return !1;
        var u = Uu(i);
        if (u === null)
          return !0;
        var f = Le.call(u, "constructor") && u.constructor;
        return typeof f == "function" && f instanceof f && Nu.call(f) == h2;
      }
      var wf = Hh ? Vt(Hh) : pw;
      function _D(i) {
        return B0(i) && i >= -Be && i <= Be;
      }
      var I0 = Gh ? Vt(Gh) : gw;
      function po(i) {
        return typeof i == "string" || !le(i) && tt(i) && Ft(i) == yt;
      }
      function Kt(i) {
        return typeof i == "symbol" || tt(i) && Ft(i) == yr;
      }
      var Pi = Wh ? Vt(Wh) : _w;
      function wD(i) {
        return i === t;
      }
      function bD(i) {
        return tt(i) && Ct(i) == Nt;
      }
      function vD(i) {
        return tt(i) && Ft(i) == ds;
      }
      var DD = ro(Hs), mD = ro(function(i, u) {
        return i <= u;
      });
      function T0(i) {
        if (!i)
          return [];
        if (Ot(i))
          return po(i) ? Cn(i) : Lt(i);
        if (ga && i[ga])
          return j_(i[ga]());
        var u = Ct(i), f = u == ot ? Is : u == mt ? Tu : Ui;
        return f(i);
      }
      function sr(i) {
        if (!i)
          return i === 0 ? i : 0;
        if (i = cn(i), i === ce || i === -ce) {
          var u = i < 0 ? -1 : 1;
          return u * Nn;
        }
        return i === i ? i : 0;
      }
      function pe(i) {
        var u = sr(i), f = u % 1;
        return u === u ? f ? u - f : u : 0;
      }
      function $0(i) {
        return i ? Yr(pe(i), 0, me) : 0;
      }
      function cn(i) {
        if (typeof i == "number")
          return i;
        if (Kt(i))
          return xt;
        if (et(i)) {
          var u = typeof i.valueOf == "function" ? i.valueOf() : i;
          i = et(u) ? u + "" : u;
        }
        if (typeof i != "string")
          return i === 0 ? i : +i;
        i = Jh(i);
        var f = n_.test(i);
        return f || i_.test(i) ? L_(i.slice(2), f ? 2 : 8) : t_.test(i) ? xt : +i;
      }
      function R0(i) {
        return Pn(i, Pt(i));
      }
      function yD(i) {
        return i ? Yr(pe(i), -Be, Be) : i === 0 ? i : 0;
      }
      function $e(i) {
        return i == null ? "" : Xt(i);
      }
      var ED = Ni(function(i, u) {
        if (Aa(u) || Ot(u)) {
          Pn(u, ct(u), i);
          return;
        }
        for (var f in u)
          Le.call(u, f) && Da(i, f, u[f]);
      }), N0 = Ni(function(i, u) {
        Pn(u, Pt(u), i);
      }), go = Ni(function(i, u, f, p) {
        Pn(u, Pt(u), i, p);
      }), CD = Ni(function(i, u, f, p) {
        Pn(u, ct(u), i, p);
      }), xD = ar(Os);
      function AD(i, u) {
        var f = Ri(i);
        return u == null ? f : dc(f, u);
      }
      var FD = we(function(i, u) {
        i = Ue(i);
        var f = -1, p = u.length, D = p > 2 ? u[2] : t;
        for (D && Bt(u[0], u[1], D) && (p = 1); ++f < p; )
          for (var x = u[f], S = Pt(x), I = -1, O = S.length; ++I < O; ) {
            var V = S[I], X = i[V];
            (X === t || An(X, Ii[V]) && !Le.call(i, V)) && (i[V] = x[V]);
          }
        return i;
      }), BD = we(function(i) {
        return i.push(t, Jc), Wt(L0, t, i);
      });
      function SD(i, u) {
        return Xh(i, ue(u, 3), On);
      }
      function kD(i, u) {
        return Xh(i, ue(u, 3), Us);
      }
      function ID(i, u) {
        return i == null ? i : Ps(i, ue(u, 3), Pt);
      }
      function TD(i, u) {
        return i == null ? i : bc(i, ue(u, 3), Pt);
      }
      function $D(i, u) {
        return i && On(i, ue(u, 3));
      }
      function RD(i, u) {
        return i && Us(i, ue(u, 3));
      }
      function ND(i) {
        return i == null ? [] : Ku(i, ct(i));
      }
      function LD(i) {
        return i == null ? [] : Ku(i, Pt(i));
      }
      function bf(i, u, f) {
        var p = i == null ? t : Qr(i, u);
        return p === t ? f : p;
      }
      function OD(i, u) {
        return i != null && t0(i, u, uw);
      }
      function vf(i, u) {
        return i != null && t0(i, u, ow);
      }
      var PD = Vc(function(i, u, f) {
        u != null && typeof u.toString != "function" && (u = Lu.call(u)), i[u] = f;
      }, mf(Ut)), UD = Vc(function(i, u, f) {
        u != null && typeof u.toString != "function" && (u = Lu.call(u)), Le.call(i, u) ? i[u].push(f) : i[u] = [f];
      }, ue), MD = we(ya);
      function ct(i) {
        return Ot(i) ? hc(i) : qs(i);
      }
      function Pt(i) {
        return Ot(i) ? hc(i, !0) : ww(i);
      }
      function zD(i, u) {
        var f = {};
        return u = ue(u, 3), On(i, function(p, D, x) {
          rr(f, u(p, D, x), p);
        }), f;
      }
      function ZD(i, u) {
        var f = {};
        return u = ue(u, 3), On(i, function(p, D, x) {
          rr(f, D, u(p, D, x));
        }), f;
      }
      var qD = Ni(function(i, u, f) {
        Yu(i, u, f);
      }), L0 = Ni(function(i, u, f, p) {
        Yu(i, u, f, p);
      }), HD = ar(function(i, u) {
        var f = {};
        if (i == null)
          return f;
        var p = !1;
        u = Ye(u, function(x) {
          return x = Sr(x, i), p || (p = x.length > 1), x;
        }), Pn(i, rf(i), f), p && (f = fn(f, A | C | y, Pw));
        for (var D = u.length; D--; )
          Ks(f, u[D]);
        return f;
      });
      function GD(i, u) {
        return O0(i, ho(ue(u)));
      }
      var WD = ar(function(i, u) {
        return i == null ? {} : vw(i, u);
      });
      function O0(i, u) {
        if (i == null)
          return {};
        var f = Ye(rf(i), function(p) {
          return [p];
        });
        return u = ue(u), Bc(i, f, function(p, D) {
          return u(p, D[0]);
        });
      }
      function VD(i, u, f) {
        u = Sr(u, i);
        var p = -1, D = u.length;
        for (D || (D = 1, i = t); ++p < D; ) {
          var x = i == null ? t : i[Un(u[p])];
          x === t && (p = D, x = f), i = or(x) ? x.call(i) : x;
        }
        return i;
      }
      function XD(i, u, f) {
        return i == null ? i : Ca(i, u, f);
      }
      function KD(i, u, f, p) {
        return p = typeof p == "function" ? p : t, i == null ? i : Ca(i, u, f, p);
      }
      var P0 = Yc(ct), U0 = Yc(Pt);
      function YD(i, u, f) {
        var p = le(i), D = p || Ir(i) || Pi(i);
        if (u = ue(u, 4), f == null) {
          var x = i && i.constructor;
          D ? f = p ? new x() : [] : et(i) ? f = or(x) ? Ri(Uu(i)) : {} : f = {};
        }
        return (D ? un : On)(i, function(S, I, O) {
          return u(f, S, I, O);
        }), f;
      }
      function QD(i, u) {
        return i == null ? !0 : Ks(i, u);
      }
      function JD(i, u, f) {
        return i == null ? i : $c(i, u, Js(f));
      }
      function jD(i, u, f, p) {
        return p = typeof p == "function" ? p : t, i == null ? i : $c(i, u, Js(f), p);
      }
      function Ui(i) {
        return i == null ? [] : ks(i, ct(i));
      }
      function em(i) {
        return i == null ? [] : ks(i, Pt(i));
      }
      function tm(i, u, f) {
        return f === t && (f = u, u = t), f !== t && (f = cn(f), f = f === f ? f : 0), u !== t && (u = cn(u), u = u === u ? u : 0), Yr(cn(i), u, f);
      }
      function nm(i, u, f) {
        return u = sr(u), f === t ? (f = u, u = 0) : f = sr(f), i = cn(i), sw(i, u, f);
      }
      function rm(i, u, f) {
        if (f && typeof f != "boolean" && Bt(i, u, f) && (u = f = t), f === t && (typeof u == "boolean" ? (f = u, u = t) : typeof i == "boolean" && (f = i, i = t)), i === t && u === t ? (i = 0, u = 1) : (i = sr(i), u === t ? (u = i, i = 0) : u = sr(u)), i > u) {
          var p = i;
          i = u, u = p;
        }
        if (f || i % 1 || u % 1) {
          var D = fc();
          return Et(i + D * (u - i + N_("1e-" + ((D + "").length - 1))), u);
        }
        return Ws(i, u);
      }
      var im = Li(function(i, u, f) {
        return u = u.toLowerCase(), i + (f ? M0(u) : u);
      });
      function M0(i) {
        return Df($e(i).toLowerCase());
      }
      function z0(i) {
        return i = $e(i), i && i.replace(u_, X_).replace(x_, "");
      }
      function am(i, u, f) {
        i = $e(i), u = Xt(u);
        var p = i.length;
        f = f === t ? p : Yr(pe(f), 0, p);
        var D = f;
        return f -= u.length, f >= 0 && i.slice(f, D) == u;
      }
      function um(i) {
        return i = $e(i), i && Mg.test(i) ? i.replace(bh, K_) : i;
      }
      function om(i) {
        return i = $e(i), i && Wg.test(i) ? i.replace(ps, "\\$&") : i;
      }
      var sm = Li(function(i, u, f) {
        return i + (f ? "-" : "") + u.toLowerCase();
      }), fm = Li(function(i, u, f) {
        return i + (f ? " " : "") + u.toLowerCase();
      }), lm = Hc("toLowerCase");
      function hm(i, u, f) {
        i = $e(i), u = pe(u);
        var p = u ? Si(i) : 0;
        if (!u || p >= u)
          return i;
        var D = (u - p) / 2;
        return no(qu(D), f) + i + no(Zu(D), f);
      }
      function cm(i, u, f) {
        i = $e(i), u = pe(u);
        var p = u ? Si(i) : 0;
        return u && p < u ? i + no(u - p, f) : i;
      }
      function dm(i, u, f) {
        i = $e(i), u = pe(u);
        var p = u ? Si(i) : 0;
        return u && p < u ? no(u - p, f) + i : i;
      }
      function pm(i, u, f) {
        return f || u == null ? u = 0 : u && (u = +u), m2($e(i).replace(gs, ""), u || 0);
      }
      function gm(i, u, f) {
        return (f ? Bt(i, u, f) : u === t) ? u = 1 : u = pe(u), Vs($e(i), u);
      }
      function _m() {
        var i = arguments, u = $e(i[0]);
        return i.length < 3 ? u : u.replace(i[1], i[2]);
      }
      var wm = Li(function(i, u, f) {
        return i + (f ? "_" : "") + u.toLowerCase();
      });
      function bm(i, u, f) {
        return f && typeof f != "number" && Bt(i, u, f) && (u = f = t), f = f === t ? me : f >>> 0, f ? (i = $e(i), i && (typeof u == "string" || u != null && !wf(u)) && (u = Xt(u), !u && Bi(i)) ? kr(Cn(i), 0, f) : i.split(u, f)) : [];
      }
      var vm = Li(function(i, u, f) {
        return i + (f ? " " : "") + Df(u);
      });
      function Dm(i, u, f) {
        return i = $e(i), f = f == null ? 0 : Yr(pe(f), 0, i.length), u = Xt(u), i.slice(f, f + u.length) == u;
      }
      function mm(i, u, f) {
        var p = E.templateSettings;
        f && Bt(i, u, f) && (u = t), i = $e(i), u = go({}, u, p, Qc);
        var D = go({}, u.imports, p.imports, Qc), x = ct(D), S = ks(D, x), I, O, V = 0, X = u.interpolate || Fu, j = "__p += '", ne = Ts(
          (u.escape || Fu).source + "|" + X.source + "|" + (X === vh ? e_ : Fu).source + "|" + (u.evaluate || Fu).source + "|$",
          "g"
        ), ae = "//# sourceURL=" + (Le.call(u, "sourceURL") ? (u.sourceURL + "").replace(/\s/g, " ") : "lodash.templateSources[" + ++k_ + "]") + `
`;
        i.replace(ne, function(se, De, xe, Yt, St, Qt) {
          return xe || (xe = Yt), j += i.slice(V, Qt).replace(o_, Y_), De && (I = !0, j += `' +
__e(` + De + `) +
'`), St && (O = !0, j += `';
` + St + `;
__p += '`), xe && (j += `' +
((__t = (` + xe + `)) == null ? '' : __t) +
'`), V = Qt + se.length, se;
        }), j += `';
`;
        var oe = Le.call(u, "variable") && u.variable;
        if (!oe)
          j = `with (obj) {
` + j + `
}
`;
        else if (Jg.test(oe))
          throw new fe(l);
        j = (O ? j.replace(Ne, "") : j).replace(Og, "$1").replace(Pg, "$1;"), j = "function(" + (oe || "obj") + `) {
` + (oe ? "" : `obj || (obj = {});
`) + "var __t, __p = ''" + (I ? ", __e = _.escape" : "") + (O ? `, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
` : `;
`) + j + `return __p
}`;
        var ge = q0(function() {
          return Ie(x, ae + "return " + j).apply(t, S);
        });
        if (ge.source = j, _f(ge))
          throw ge;
        return ge;
      }
      function ym(i) {
        return $e(i).toLowerCase();
      }
      function Em(i) {
        return $e(i).toUpperCase();
      }
      function Cm(i, u, f) {
        if (i = $e(i), i && (f || u === t))
          return Jh(i);
        if (!i || !(u = Xt(u)))
          return i;
        var p = Cn(i), D = Cn(u), x = jh(p, D), S = ec(p, D) + 1;
        return kr(p, x, S).join("");
      }
      function xm(i, u, f) {
        if (i = $e(i), i && (f || u === t))
          return i.slice(0, nc(i) + 1);
        if (!i || !(u = Xt(u)))
          return i;
        var p = Cn(i), D = ec(p, Cn(u)) + 1;
        return kr(p, 0, D).join("");
      }
      function Am(i, u, f) {
        if (i = $e(i), i && (f || u === t))
          return i.replace(gs, "");
        if (!i || !(u = Xt(u)))
          return i;
        var p = Cn(i), D = jh(p, Cn(u));
        return kr(p, D).join("");
      }
      function Fm(i, u) {
        var f = ee, p = K;
        if (et(u)) {
          var D = "separator" in u ? u.separator : D;
          f = "length" in u ? pe(u.length) : f, p = "omission" in u ? Xt(u.omission) : p;
        }
        i = $e(i);
        var x = i.length;
        if (Bi(i)) {
          var S = Cn(i);
          x = S.length;
        }
        if (f >= x)
          return i;
        var I = f - Si(p);
        if (I < 1)
          return p;
        var O = S ? kr(S, 0, I).join("") : i.slice(0, I);
        if (D === t)
          return O + p;
        if (S && (I += O.length - I), wf(D)) {
          if (i.slice(I).search(D)) {
            var V, X = O;
            for (D.global || (D = Ts(D.source, $e(Dh.exec(D)) + "g")), D.lastIndex = 0; V = D.exec(X); )
              var j = V.index;
            O = O.slice(0, j === t ? I : j);
          }
        } else if (i.indexOf(Xt(D), I) != I) {
          var ne = O.lastIndexOf(D);
          ne > -1 && (O = O.slice(0, ne));
        }
        return O + p;
      }
      function Bm(i) {
        return i = $e(i), i && Ug.test(i) ? i.replace(wh, r2) : i;
      }
      var Sm = Li(function(i, u, f) {
        return i + (f ? " " : "") + u.toUpperCase();
      }), Df = Hc("toUpperCase");
      function Z0(i, u, f) {
        return i = $e(i), u = f ? t : u, u === t ? J_(i) ? u2(i) : q_(i) : i.match(u) || [];
      }
      var q0 = we(function(i, u) {
        try {
          return Wt(i, t, u);
        } catch (f) {
          return _f(f) ? f : new fe(f);
        }
      }), km = ar(function(i, u) {
        return un(u, function(f) {
          f = Un(f), rr(i, f, pf(i[f], i));
        }), i;
      });
      function Im(i) {
        var u = i == null ? 0 : i.length, f = ue();
        return i = u ? Ye(i, function(p) {
          if (typeof p[1] != "function")
            throw new on(h);
          return [f(p[0]), p[1]];
        }) : [], we(function(p) {
          for (var D = -1; ++D < u; ) {
            var x = i[D];
            if (Wt(x[0], this, p))
              return Wt(x[1], this, p);
          }
        });
      }
      function Tm(i) {
        return rw(fn(i, A));
      }
      function mf(i) {
        return function() {
          return i;
        };
      }
      function $m(i, u) {
        return i == null || i !== i ? u : i;
      }
      var Rm = Wc(), Nm = Wc(!0);
      function Ut(i) {
        return i;
      }
      function yf(i) {
        return yc(typeof i == "function" ? i : fn(i, A));
      }
      function Lm(i) {
        return Cc(fn(i, A));
      }
      function Om(i, u) {
        return xc(i, fn(u, A));
      }
      var Pm = we(function(i, u) {
        return function(f) {
          return ya(f, i, u);
        };
      }), Um = we(function(i, u) {
        return function(f) {
          return ya(i, f, u);
        };
      });
      function Ef(i, u, f) {
        var p = ct(u), D = Ku(u, p);
        f == null && !(et(u) && (D.length || !p.length)) && (f = u, u = i, i = this, D = Ku(u, ct(u)));
        var x = !(et(f) && "chain" in f) || !!f.chain, S = or(i);
        return un(D, function(I) {
          var O = u[I];
          i[I] = O, S && (i.prototype[I] = function() {
            var V = this.__chain__;
            if (x || V) {
              var X = i(this.__wrapped__), j = X.__actions__ = Lt(this.__actions__);
              return j.push({ func: O, args: arguments, thisArg: i }), X.__chain__ = V, X;
            }
            return O.apply(i, Cr([this.value()], arguments));
          });
        }), i;
      }
      function Mm() {
        return gt._ === this && (gt._ = c2), this;
      }
      function Cf() {
      }
      function zm(i) {
        return i = pe(i), we(function(u) {
          return Ac(u, i);
        });
      }
      var Zm = ef(Ye), qm = ef(Vh), Hm = ef(xs);
      function H0(i) {
        return sf(i) ? As(Un(i)) : Dw(i);
      }
      function Gm(i) {
        return function(u) {
          return i == null ? t : Qr(i, u);
        };
      }
      var Wm = Xc(), Vm = Xc(!0);
      function xf() {
        return [];
      }
      function Af() {
        return !1;
      }
      function Xm() {
        return {};
      }
      function Km() {
        return "";
      }
      function Ym() {
        return !0;
      }
      function Qm(i, u) {
        if (i = pe(i), i < 1 || i > Be)
          return [];
        var f = me, p = Et(i, me);
        u = ue(u), i -= me;
        for (var D = Ss(p, u); ++f < i; )
          u(f);
        return D;
      }
      function Jm(i) {
        return le(i) ? Ye(i, Un) : Kt(i) ? [i] : Lt(l0($e(i)));
      }
      function jm(i) {
        var u = ++l2;
        return $e(i) + u;
      }
      var ey = to(function(i, u) {
        return i + u;
      }, 0), ty = tf("ceil"), ny = to(function(i, u) {
        return i / u;
      }, 1), ry = tf("floor");
      function iy(i) {
        return i && i.length ? Xu(i, Ut, Ms) : t;
      }
      function ay(i, u) {
        return i && i.length ? Xu(i, ue(u, 2), Ms) : t;
      }
      function uy(i) {
        return Yh(i, Ut);
      }
      function oy(i, u) {
        return Yh(i, ue(u, 2));
      }
      function sy(i) {
        return i && i.length ? Xu(i, Ut, Hs) : t;
      }
      function fy(i, u) {
        return i && i.length ? Xu(i, ue(u, 2), Hs) : t;
      }
      var ly = to(function(i, u) {
        return i * u;
      }, 1), hy = tf("round"), cy = to(function(i, u) {
        return i - u;
      }, 0);
      function dy(i) {
        return i && i.length ? Bs(i, Ut) : 0;
      }
      function py(i, u) {
        return i && i.length ? Bs(i, ue(u, 2)) : 0;
      }
      return E.after = Lv, E.ary = m0, E.assign = ED, E.assignIn = N0, E.assignInWith = go, E.assignWith = CD, E.at = xD, E.before = y0, E.bind = pf, E.bindAll = km, E.bindKey = E0, E.castArray = Xv, E.chain = b0, E.chunk = rb, E.compact = ib, E.concat = ab, E.cond = Im, E.conforms = Tm, E.constant = mf, E.countBy = dv, E.create = AD, E.curry = C0, E.curryRight = x0, E.debounce = A0, E.defaults = FD, E.defaultsDeep = BD, E.defer = Ov, E.delay = Pv, E.difference = ub, E.differenceBy = ob, E.differenceWith = sb, E.drop = fb, E.dropRight = lb, E.dropRightWhile = hb, E.dropWhile = cb, E.fill = db, E.filter = gv, E.flatMap = bv, E.flatMapDeep = vv, E.flatMapDepth = Dv, E.flatten = p0, E.flattenDeep = pb, E.flattenDepth = gb, E.flip = Uv, E.flow = Rm, E.flowRight = Nm, E.fromPairs = _b, E.functions = ND, E.functionsIn = LD, E.groupBy = mv, E.initial = bb, E.intersection = vb, E.intersectionBy = Db, E.intersectionWith = mb, E.invert = PD, E.invertBy = UD, E.invokeMap = Ev, E.iteratee = yf, E.keyBy = Cv, E.keys = ct, E.keysIn = Pt, E.map = so, E.mapKeys = zD, E.mapValues = ZD, E.matches = Lm, E.matchesProperty = Om, E.memoize = lo, E.merge = qD, E.mergeWith = L0, E.method = Pm, E.methodOf = Um, E.mixin = Ef, E.negate = ho, E.nthArg = zm, E.omit = HD, E.omitBy = GD, E.once = Mv, E.orderBy = xv, E.over = Zm, E.overArgs = zv, E.overEvery = qm, E.overSome = Hm, E.partial = gf, E.partialRight = F0, E.partition = Av, E.pick = WD, E.pickBy = O0, E.property = H0, E.propertyOf = Gm, E.pull = xb, E.pullAll = _0, E.pullAllBy = Ab, E.pullAllWith = Fb, E.pullAt = Bb, E.range = Wm, E.rangeRight = Vm, E.rearg = Zv, E.reject = Sv, E.remove = Sb, E.rest = qv, E.reverse = cf, E.sampleSize = Iv, E.set = XD, E.setWith = KD, E.shuffle = Tv, E.slice = kb, E.sortBy = Nv, E.sortedUniq = Ob, E.sortedUniqBy = Pb, E.split = bm, E.spread = Hv, E.tail = Ub, E.take = Mb, E.takeRight = zb, E.takeRightWhile = Zb, E.takeWhile = qb, E.tap = iv, E.throttle = Gv, E.thru = oo, E.toArray = T0, E.toPairs = P0, E.toPairsIn = U0, E.toPath = Jm, E.toPlainObject = R0, E.transform = YD, E.unary = Wv, E.union = Hb, E.unionBy = Gb, E.unionWith = Wb, E.uniq = Vb, E.uniqBy = Xb, E.uniqWith = Kb, E.unset = QD, E.unzip = df, E.unzipWith = w0, E.update = JD, E.updateWith = jD, E.values = Ui, E.valuesIn = em, E.without = Yb, E.words = Z0, E.wrap = Vv, E.xor = Qb, E.xorBy = Jb, E.xorWith = jb, E.zip = ev, E.zipObject = tv, E.zipObjectDeep = nv, E.zipWith = rv, E.entries = P0, E.entriesIn = U0, E.extend = N0, E.extendWith = go, Ef(E, E), E.add = ey, E.attempt = q0, E.camelCase = im, E.capitalize = M0, E.ceil = ty, E.clamp = tm, E.clone = Kv, E.cloneDeep = Qv, E.cloneDeepWith = Jv, E.cloneWith = Yv, E.conformsTo = jv, E.deburr = z0, E.defaultTo = $m, E.divide = ny, E.endsWith = am, E.eq = An, E.escape = um, E.escapeRegExp = om, E.every = pv, E.find = _v, E.findIndex = c0, E.findKey = SD, E.findLast = wv, E.findLastIndex = d0, E.findLastKey = kD, E.floor = ry, E.forEach = v0, E.forEachRight = D0, E.forIn = ID, E.forInRight = TD, E.forOwn = $D, E.forOwnRight = RD, E.get = bf, E.gt = eD, E.gte = tD, E.has = OD, E.hasIn = vf, E.head = g0, E.identity = Ut, E.includes = yv, E.indexOf = wb, E.inRange = nm, E.invoke = MD, E.isArguments = ei, E.isArray = le, E.isArrayBuffer = nD, E.isArrayLike = Ot, E.isArrayLikeObject = rt, E.isBoolean = rD, E.isBuffer = Ir, E.isDate = iD, E.isElement = aD, E.isEmpty = uD, E.isEqual = oD, E.isEqualWith = sD, E.isError = _f, E.isFinite = fD, E.isFunction = or, E.isInteger = B0, E.isLength = co, E.isMap = S0, E.isMatch = lD, E.isMatchWith = hD, E.isNaN = cD, E.isNative = dD, E.isNil = gD, E.isNull = pD, E.isNumber = k0, E.isObject = et, E.isObjectLike = tt, E.isPlainObject = Ba, E.isRegExp = wf, E.isSafeInteger = _D, E.isSet = I0, E.isString = po, E.isSymbol = Kt, E.isTypedArray = Pi, E.isUndefined = wD, E.isWeakMap = bD, E.isWeakSet = vD, E.join = yb, E.kebabCase = sm, E.last = hn, E.lastIndexOf = Eb, E.lowerCase = fm, E.lowerFirst = lm, E.lt = DD, E.lte = mD, E.max = iy, E.maxBy = ay, E.mean = uy, E.meanBy = oy, E.min = sy, E.minBy = fy, E.stubArray = xf, E.stubFalse = Af, E.stubObject = Xm, E.stubString = Km, E.stubTrue = Ym, E.multiply = ly, E.nth = Cb, E.noConflict = Mm, E.noop = Cf, E.now = fo, E.pad = hm, E.padEnd = cm, E.padStart = dm, E.parseInt = pm, E.random = rm, E.reduce = Fv, E.reduceRight = Bv, E.repeat = gm, E.replace = _m, E.result = VD, E.round = hy, E.runInContext = N, E.sample = kv, E.size = $v, E.snakeCase = wm, E.some = Rv, E.sortedIndex = Ib, E.sortedIndexBy = Tb, E.sortedIndexOf = $b, E.sortedLastIndex = Rb, E.sortedLastIndexBy = Nb, E.sortedLastIndexOf = Lb, E.startCase = vm, E.startsWith = Dm, E.subtract = cy, E.sum = dy, E.sumBy = py, E.template = mm, E.times = Qm, E.toFinite = sr, E.toInteger = pe, E.toLength = $0, E.toLower = ym, E.toNumber = cn, E.toSafeInteger = yD, E.toString = $e, E.toUpper = Em, E.trim = Cm, E.trimEnd = xm, E.trimStart = Am, E.truncate = Fm, E.unescape = Bm, E.uniqueId = jm, E.upperCase = Sm, E.upperFirst = Df, E.each = v0, E.eachRight = D0, E.first = g0, Ef(E, function() {
        var i = {};
        return On(E, function(u, f) {
          Le.call(E.prototype, f) || (i[f] = u);
        }), i;
      }(), { chain: !1 }), E.VERSION = a, un(["bind", "bindKey", "curry", "curryRight", "partial", "partialRight"], function(i) {
        E[i].placeholder = E;
      }), un(["drop", "take"], function(i, u) {
        ye.prototype[i] = function(f) {
          f = f === t ? 1 : ft(pe(f), 0);
          var p = this.__filtered__ && !u ? new ye(this) : this.clone();
          return p.__filtered__ ? p.__takeCount__ = Et(f, p.__takeCount__) : p.__views__.push({
            size: Et(f, me),
            type: i + (p.__dir__ < 0 ? "Right" : "")
          }), p;
        }, ye.prototype[i + "Right"] = function(f) {
          return this.reverse()[i](f).reverse();
        };
      }), un(["filter", "map", "takeWhile"], function(i, u) {
        var f = u + 1, p = f == ve || f == Oe;
        ye.prototype[i] = function(D) {
          var x = this.clone();
          return x.__iteratees__.push({
            iteratee: ue(D, 3),
            type: f
          }), x.__filtered__ = x.__filtered__ || p, x;
        };
      }), un(["head", "last"], function(i, u) {
        var f = "take" + (u ? "Right" : "");
        ye.prototype[i] = function() {
          return this[f](1).value()[0];
        };
      }), un(["initial", "tail"], function(i, u) {
        var f = "drop" + (u ? "" : "Right");
        ye.prototype[i] = function() {
          return this.__filtered__ ? new ye(this) : this[f](1);
        };
      }), ye.prototype.compact = function() {
        return this.filter(Ut);
      }, ye.prototype.find = function(i) {
        return this.filter(i).head();
      }, ye.prototype.findLast = function(i) {
        return this.reverse().find(i);
      }, ye.prototype.invokeMap = we(function(i, u) {
        return typeof i == "function" ? new ye(this) : this.map(function(f) {
          return ya(f, i, u);
        });
      }), ye.prototype.reject = function(i) {
        return this.filter(ho(ue(i)));
      }, ye.prototype.slice = function(i, u) {
        i = pe(i);
        var f = this;
        return f.__filtered__ && (i > 0 || u < 0) ? new ye(f) : (i < 0 ? f = f.takeRight(-i) : i && (f = f.drop(i)), u !== t && (u = pe(u), f = u < 0 ? f.dropRight(-u) : f.take(u - i)), f);
      }, ye.prototype.takeRightWhile = function(i) {
        return this.reverse().takeWhile(i).reverse();
      }, ye.prototype.toArray = function() {
        return this.take(me);
      }, On(ye.prototype, function(i, u) {
        var f = /^(?:filter|find|map|reject)|While$/.test(u), p = /^(?:head|last)$/.test(u), D = E[p ? "take" + (u == "last" ? "Right" : "") : u], x = p || /^find/.test(u);
        D && (E.prototype[u] = function() {
          var S = this.__wrapped__, I = p ? [1] : arguments, O = S instanceof ye, V = I[0], X = O || le(S), j = function(De) {
            var xe = D.apply(E, Cr([De], I));
            return p && ne ? xe[0] : xe;
          };
          X && f && typeof V == "function" && V.length != 1 && (O = X = !1);
          var ne = this.__chain__, ae = !!this.__actions__.length, oe = x && !ne, ge = O && !ae;
          if (!x && X) {
            S = ge ? S : new ye(this);
            var se = i.apply(S, I);
            return se.__actions__.push({ func: oo, args: [j], thisArg: t }), new sn(se, ne);
          }
          return oe && ge ? i.apply(this, I) : (se = this.thru(j), oe ? p ? se.value()[0] : se.value() : se);
        });
      }), un(["pop", "push", "shift", "sort", "splice", "unshift"], function(i) {
        var u = $u[i], f = /^(?:push|sort|unshift)$/.test(i) ? "tap" : "thru", p = /^(?:pop|shift)$/.test(i);
        E.prototype[i] = function() {
          var D = arguments;
          if (p && !this.__chain__) {
            var x = this.value();
            return u.apply(le(x) ? x : [], D);
          }
          return this[f](function(S) {
            return u.apply(le(S) ? S : [], D);
          });
        };
      }), On(ye.prototype, function(i, u) {
        var f = E[u];
        if (f) {
          var p = f.name + "";
          Le.call($i, p) || ($i[p] = []), $i[p].push({ name: u, func: f });
        }
      }), $i[eo(t, T).name] = [{
        name: "wrapper",
        func: t
      }], ye.prototype.clone = B2, ye.prototype.reverse = S2, ye.prototype.value = k2, E.prototype.at = av, E.prototype.chain = uv, E.prototype.commit = ov, E.prototype.next = sv, E.prototype.plant = lv, E.prototype.reverse = hv, E.prototype.toJSON = E.prototype.valueOf = E.prototype.value = cv, E.prototype.first = E.prototype.head, ga && (E.prototype[ga] = fv), E;
    }, ki = o2();
    Wr ? ((Wr.exports = ki)._ = ki, ms._ = ki) : gt._ = ki;
  }).call(Sa);
})(Uo, Uo.exports);
var wy = Uo.exports, qt = /* @__PURE__ */ Jo(wy), by = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/, vy = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/, Dy = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/, Ff = {
  Space_Separator: by,
  ID_Start: vy,
  ID_Continue: Dy
}, ut = {
  isSpaceSeparator(e) {
    return typeof e == "string" && Ff.Space_Separator.test(e);
  },
  isIdStartChar(e) {
    return typeof e == "string" && (e >= "a" && e <= "z" || e >= "A" && e <= "Z" || e === "$" || e === "_" || Ff.ID_Start.test(e));
  },
  isIdContinueChar(e) {
    return typeof e == "string" && (e >= "a" && e <= "z" || e >= "A" && e <= "Z" || e >= "0" && e <= "9" || e === "$" || e === "_" || e === "‌" || e === "‍" || Ff.ID_Continue.test(e));
  },
  isDigit(e) {
    return typeof e == "string" && /[0-9]/.test(e);
  },
  isHexDigit(e) {
    return typeof e == "string" && /[0-9A-Fa-f]/.test(e);
  }
};
let _l, Tt, _r, Mo, Hr, kn, dt, zl, Ma;
var my = function(n, t) {
  _l = String(n), Tt = "start", _r = [], Mo = 0, Hr = 1, kn = 0, dt = void 0, zl = void 0, Ma = void 0;
  do
    dt = yy(), xy[Tt]();
  while (dt.type !== "eof");
  return typeof t == "function" ? wl({ "": Ma }, "", t) : Ma;
};
function wl(e, n, t) {
  const a = e[n];
  if (a != null && typeof a == "object")
    if (Array.isArray(a))
      for (let s = 0; s < a.length; s++) {
        const o = String(s), h = wl(a, o, t);
        h === void 0 ? delete a[o] : Object.defineProperty(a, o, {
          value: h,
          writable: !0,
          enumerable: !0,
          configurable: !0
        });
      }
    else
      for (const s in a) {
        const o = wl(a, s, t);
        o === void 0 ? delete a[s] : Object.defineProperty(a, s, {
          value: o,
          writable: !0,
          enumerable: !0,
          configurable: !0
        });
      }
  return t.call(e, n, a);
}
let _e, he, Na, cr, Ee;
function yy() {
  for (_e = "default", he = "", Na = !1, cr = 1; ; ) {
    Ee = br();
    const e = H1[_e]();
    if (e)
      return e;
  }
}
function br() {
  if (_l[Mo])
    return String.fromCodePoint(_l.codePointAt(Mo));
}
function Y() {
  const e = br();
  return e === `
` ? (Hr++, kn = 0) : e ? kn += e.length : kn++, e && (Mo += e.length), e;
}
const H1 = {
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
        Y(), _e = "comment";
        return;
      case void 0:
        return Y(), Xe("eof");
    }
    if (ut.isSpaceSeparator(Ee)) {
      Y();
      return;
    }
    return H1[Tt]();
  },
  comment() {
    switch (Ee) {
      case "*":
        Y(), _e = "multiLineComment";
        return;
      case "/":
        Y(), _e = "singleLineComment";
        return;
    }
    throw Ke(Y());
  },
  multiLineComment() {
    switch (Ee) {
      case "*":
        Y(), _e = "multiLineCommentAsterisk";
        return;
      case void 0:
        throw Ke(Y());
    }
    Y();
  },
  multiLineCommentAsterisk() {
    switch (Ee) {
      case "*":
        Y();
        return;
      case "/":
        Y(), _e = "default";
        return;
      case void 0:
        throw Ke(Y());
    }
    Y(), _e = "multiLineComment";
  },
  singleLineComment() {
    switch (Ee) {
      case `
`:
      case "\r":
      case "\u2028":
      case "\u2029":
        Y(), _e = "default";
        return;
      case void 0:
        return Y(), Xe("eof");
    }
    Y();
  },
  value() {
    switch (Ee) {
      case "{":
      case "[":
        return Xe("punctuator", Y());
      case "n":
        return Y(), ti("ull"), Xe("null", null);
      case "t":
        return Y(), ti("rue"), Xe("boolean", !0);
      case "f":
        return Y(), ti("alse"), Xe("boolean", !1);
      case "-":
      case "+":
        Y() === "-" && (cr = -1), _e = "sign";
        return;
      case ".":
        he = Y(), _e = "decimalPointLeading";
        return;
      case "0":
        he = Y(), _e = "zero";
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
        he = Y(), _e = "decimalInteger";
        return;
      case "I":
        return Y(), ti("nfinity"), Xe("numeric", 1 / 0);
      case "N":
        return Y(), ti("aN"), Xe("numeric", NaN);
      case '"':
      case "'":
        Na = Y() === '"', he = "", _e = "string";
        return;
    }
    throw Ke(Y());
  },
  identifierNameStartEscape() {
    if (Ee !== "u")
      throw Ke(Y());
    Y();
    const e = bl();
    switch (e) {
      case "$":
      case "_":
        break;
      default:
        if (!ut.isIdStartChar(e))
          throw W0();
        break;
    }
    he += e, _e = "identifierName";
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
        Y(), _e = "identifierNameEscape";
        return;
    }
    if (ut.isIdContinueChar(Ee)) {
      he += Y();
      return;
    }
    return Xe("identifier", he);
  },
  identifierNameEscape() {
    if (Ee !== "u")
      throw Ke(Y());
    Y();
    const e = bl();
    switch (e) {
      case "$":
      case "_":
      case "‌":
      case "‍":
        break;
      default:
        if (!ut.isIdContinueChar(e))
          throw W0();
        break;
    }
    he += e, _e = "identifierName";
  },
  sign() {
    switch (Ee) {
      case ".":
        he = Y(), _e = "decimalPointLeading";
        return;
      case "0":
        he = Y(), _e = "zero";
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
        he = Y(), _e = "decimalInteger";
        return;
      case "I":
        return Y(), ti("nfinity"), Xe("numeric", cr * (1 / 0));
      case "N":
        return Y(), ti("aN"), Xe("numeric", NaN);
    }
    throw Ke(Y());
  },
  zero() {
    switch (Ee) {
      case ".":
        he += Y(), _e = "decimalPoint";
        return;
      case "e":
      case "E":
        he += Y(), _e = "decimalExponent";
        return;
      case "x":
      case "X":
        he += Y(), _e = "hexadecimal";
        return;
    }
    return Xe("numeric", cr * 0);
  },
  decimalInteger() {
    switch (Ee) {
      case ".":
        he += Y(), _e = "decimalPoint";
        return;
      case "e":
      case "E":
        he += Y(), _e = "decimalExponent";
        return;
    }
    if (ut.isDigit(Ee)) {
      he += Y();
      return;
    }
    return Xe("numeric", cr * Number(he));
  },
  decimalPointLeading() {
    if (ut.isDigit(Ee)) {
      he += Y(), _e = "decimalFraction";
      return;
    }
    throw Ke(Y());
  },
  decimalPoint() {
    switch (Ee) {
      case "e":
      case "E":
        he += Y(), _e = "decimalExponent";
        return;
    }
    if (ut.isDigit(Ee)) {
      he += Y(), _e = "decimalFraction";
      return;
    }
    return Xe("numeric", cr * Number(he));
  },
  decimalFraction() {
    switch (Ee) {
      case "e":
      case "E":
        he += Y(), _e = "decimalExponent";
        return;
    }
    if (ut.isDigit(Ee)) {
      he += Y();
      return;
    }
    return Xe("numeric", cr * Number(he));
  },
  decimalExponent() {
    switch (Ee) {
      case "+":
      case "-":
        he += Y(), _e = "decimalExponentSign";
        return;
    }
    if (ut.isDigit(Ee)) {
      he += Y(), _e = "decimalExponentInteger";
      return;
    }
    throw Ke(Y());
  },
  decimalExponentSign() {
    if (ut.isDigit(Ee)) {
      he += Y(), _e = "decimalExponentInteger";
      return;
    }
    throw Ke(Y());
  },
  decimalExponentInteger() {
    if (ut.isDigit(Ee)) {
      he += Y();
      return;
    }
    return Xe("numeric", cr * Number(he));
  },
  hexadecimal() {
    if (ut.isHexDigit(Ee)) {
      he += Y(), _e = "hexadecimalInteger";
      return;
    }
    throw Ke(Y());
  },
  hexadecimalInteger() {
    if (ut.isHexDigit(Ee)) {
      he += Y();
      return;
    }
    return Xe("numeric", cr * Number(he));
  },
  string() {
    switch (Ee) {
      case "\\":
        Y(), he += Ey();
        return;
      case '"':
        if (Na)
          return Y(), Xe("string", he);
        he += Y();
        return;
      case "'":
        if (!Na)
          return Y(), Xe("string", he);
        he += Y();
        return;
      case `
`:
      case "\r":
        throw Ke(Y());
      case "\u2028":
      case "\u2029":
        Ay(Ee);
        break;
      case void 0:
        throw Ke(Y());
    }
    he += Y();
  },
  start() {
    switch (Ee) {
      case "{":
      case "[":
        return Xe("punctuator", Y());
    }
    _e = "value";
  },
  beforePropertyName() {
    switch (Ee) {
      case "$":
      case "_":
        he = Y(), _e = "identifierName";
        return;
      case "\\":
        Y(), _e = "identifierNameStartEscape";
        return;
      case "}":
        return Xe("punctuator", Y());
      case '"':
      case "'":
        Na = Y() === '"', _e = "string";
        return;
    }
    if (ut.isIdStartChar(Ee)) {
      he += Y(), _e = "identifierName";
      return;
    }
    throw Ke(Y());
  },
  afterPropertyName() {
    if (Ee === ":")
      return Xe("punctuator", Y());
    throw Ke(Y());
  },
  beforePropertyValue() {
    _e = "value";
  },
  afterPropertyValue() {
    switch (Ee) {
      case ",":
      case "}":
        return Xe("punctuator", Y());
    }
    throw Ke(Y());
  },
  beforeArrayValue() {
    if (Ee === "]")
      return Xe("punctuator", Y());
    _e = "value";
  },
  afterArrayValue() {
    switch (Ee) {
      case ",":
      case "]":
        return Xe("punctuator", Y());
    }
    throw Ke(Y());
  },
  end() {
    throw Ke(Y());
  }
};
function Xe(e, n) {
  return {
    type: e,
    value: n,
    line: Hr,
    column: kn
  };
}
function ti(e) {
  for (const n of e) {
    if (br() !== n)
      throw Ke(Y());
    Y();
  }
}
function Ey() {
  switch (br()) {
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
      if (Y(), ut.isDigit(br()))
        throw Ke(Y());
      return "\0";
    case "x":
      return Y(), Cy();
    case "u":
      return Y(), bl();
    case `
`:
    case "\u2028":
    case "\u2029":
      return Y(), "";
    case "\r":
      return Y(), br() === `
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
      throw Ke(Y());
    case void 0:
      throw Ke(Y());
  }
  return Y();
}
function Cy() {
  let e = "", n = br();
  if (!ut.isHexDigit(n) || (e += Y(), n = br(), !ut.isHexDigit(n)))
    throw Ke(Y());
  return e += Y(), String.fromCodePoint(parseInt(e, 16));
}
function bl() {
  let e = "", n = 4;
  for (; n-- > 0; ) {
    const t = br();
    if (!ut.isHexDigit(t))
      throw Ke(Y());
    e += Y();
  }
  return String.fromCodePoint(parseInt(e, 16));
}
const xy = {
  start() {
    if (dt.type === "eof")
      throw ni();
    Bf();
  },
  beforePropertyName() {
    switch (dt.type) {
      case "identifier":
      case "string":
        zl = dt.value, Tt = "afterPropertyName";
        return;
      case "punctuator":
        _o();
        return;
      case "eof":
        throw ni();
    }
  },
  afterPropertyName() {
    if (dt.type === "eof")
      throw ni();
    Tt = "beforePropertyValue";
  },
  beforePropertyValue() {
    if (dt.type === "eof")
      throw ni();
    Bf();
  },
  beforeArrayValue() {
    if (dt.type === "eof")
      throw ni();
    if (dt.type === "punctuator" && dt.value === "]") {
      _o();
      return;
    }
    Bf();
  },
  afterPropertyValue() {
    if (dt.type === "eof")
      throw ni();
    switch (dt.value) {
      case ",":
        Tt = "beforePropertyName";
        return;
      case "}":
        _o();
    }
  },
  afterArrayValue() {
    if (dt.type === "eof")
      throw ni();
    switch (dt.value) {
      case ",":
        Tt = "beforeArrayValue";
        return;
      case "]":
        _o();
    }
  },
  end() {
  }
};
function Bf() {
  let e;
  switch (dt.type) {
    case "punctuator":
      switch (dt.value) {
        case "{":
          e = {};
          break;
        case "[":
          e = [];
          break;
      }
      break;
    case "null":
    case "boolean":
    case "numeric":
    case "string":
      e = dt.value;
      break;
  }
  if (Ma === void 0)
    Ma = e;
  else {
    const n = _r[_r.length - 1];
    Array.isArray(n) ? n.push(e) : Object.defineProperty(n, zl, {
      value: e,
      writable: !0,
      enumerable: !0,
      configurable: !0
    });
  }
  if (e !== null && typeof e == "object")
    _r.push(e), Array.isArray(e) ? Tt = "beforeArrayValue" : Tt = "beforePropertyName";
  else {
    const n = _r[_r.length - 1];
    n == null ? Tt = "end" : Array.isArray(n) ? Tt = "afterArrayValue" : Tt = "afterPropertyValue";
  }
}
function _o() {
  _r.pop();
  const e = _r[_r.length - 1];
  e == null ? Tt = "end" : Array.isArray(e) ? Tt = "afterArrayValue" : Tt = "afterPropertyValue";
}
function Ke(e) {
  return zo(e === void 0 ? `JSON5: invalid end of input at ${Hr}:${kn}` : `JSON5: invalid character '${G1(e)}' at ${Hr}:${kn}`);
}
function ni() {
  return zo(`JSON5: invalid end of input at ${Hr}:${kn}`);
}
function W0() {
  return kn -= 5, zo(`JSON5: invalid identifier character at ${Hr}:${kn}`);
}
function Ay(e) {
  console.warn(`JSON5: '${G1(e)}' in strings is not valid ECMAScript; consider escaping`);
}
function G1(e) {
  const n = {
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
  if (n[e])
    return n[e];
  if (e < " ") {
    const t = e.charCodeAt(0).toString(16);
    return "\\x" + ("00" + t).substring(t.length);
  }
  return e;
}
function zo(e) {
  const n = new SyntaxError(e);
  return n.lineNumber = Hr, n.columnNumber = kn, n;
}
var Fy = function(n, t, a) {
  const s = [];
  let o = "", h, l, v = "", c;
  if (t != null && typeof t == "object" && !Array.isArray(t) && (a = t.space, c = t.quote, t = t.replacer), typeof t == "function")
    l = t;
  else if (Array.isArray(t)) {
    h = [];
    for (const B of t) {
      let P;
      typeof B == "string" ? P = B : (typeof B == "number" || B instanceof String || B instanceof Number) && (P = String(B)), P !== void 0 && h.indexOf(P) < 0 && h.push(P);
    }
  }
  return a instanceof Number ? a = Number(a) : a instanceof String && (a = String(a)), typeof a == "number" ? a > 0 && (a = Math.min(10, Math.floor(a)), v = "          ".substr(0, a)) : typeof a == "string" && (v = a.substr(0, 10)), d("", { "": n });
  function d(B, P) {
    let T = P[B];
    switch (T != null && (typeof T.toJSON5 == "function" ? T = T.toJSON5(B) : typeof T.toJSON == "function" && (T = T.toJSON(B))), l && (T = l.call(P, B, T)), T instanceof Number ? T = Number(T) : T instanceof String ? T = String(T) : T instanceof Boolean && (T = T.valueOf()), T) {
      case null:
        return "null";
      case !0:
        return "true";
      case !1:
        return "false";
    }
    if (typeof T == "string")
      return A(T);
    if (typeof T == "number")
      return String(T);
    if (typeof T == "object")
      return Array.isArray(T) ? k(T) : C(T);
  }
  function A(B) {
    const P = {
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
    let Z = "";
    for (let $ = 0; $ < B.length; $++) {
      const L = B[$];
      switch (L) {
        case "'":
        case '"':
          P[L]++, Z += L;
          continue;
        case "\0":
          if (ut.isDigit(B[$ + 1])) {
            Z += "\\x00";
            continue;
          }
      }
      if (T[L]) {
        Z += T[L];
        continue;
      }
      if (L < " ") {
        let Q = L.charCodeAt(0).toString(16);
        Z += "\\x" + ("00" + Q).substring(Q.length);
        continue;
      }
      Z += L;
    }
    const U = c || Object.keys(P).reduce(($, L) => P[$] < P[L] ? $ : L);
    return Z = Z.replace(new RegExp(U, "g"), T[U]), U + Z + U;
  }
  function C(B) {
    if (s.indexOf(B) >= 0)
      throw TypeError("Converting circular structure to JSON5");
    s.push(B);
    let P = o;
    o = o + v;
    let T = h || Object.keys(B), Z = [];
    for (const $ of T) {
      const L = d($, B);
      if (L !== void 0) {
        let Q = y($) + ":";
        v !== "" && (Q += " "), Q += L, Z.push(Q);
      }
    }
    let U;
    if (Z.length === 0)
      U = "{}";
    else {
      let $;
      if (v === "")
        $ = Z.join(","), U = "{" + $ + "}";
      else {
        let L = `,
` + o;
        $ = Z.join(L), U = `{
` + o + $ + `,
` + P + "}";
      }
    }
    return s.pop(), o = P, U;
  }
  function y(B) {
    if (B.length === 0)
      return A(B);
    const P = String.fromCodePoint(B.codePointAt(0));
    if (!ut.isIdStartChar(P))
      return A(B);
    for (let T = P.length; T < B.length; T++)
      if (!ut.isIdContinueChar(String.fromCodePoint(B.codePointAt(T))))
        return A(B);
    return B;
  }
  function k(B) {
    if (s.indexOf(B) >= 0)
      throw TypeError("Converting circular structure to JSON5");
    s.push(B);
    let P = o;
    o = o + v;
    let T = [];
    for (let U = 0; U < B.length; U++) {
      const $ = d(String(U), B);
      T.push($ !== void 0 ? $ : "null");
    }
    let Z;
    if (T.length === 0)
      Z = "[]";
    else if (v === "")
      Z = "[" + T.join(",") + "]";
    else {
      let U = `,
` + o, $ = T.join(U);
      Z = `[
` + o + $ + `,
` + P + "]";
    }
    return s.pop(), o = P, Z;
  }
};
const By = {
  parse: my,
  stringify: Fy
};
var Sy = By;
class Re {
  /**
   * Makes a new instance.  The input should represent a 0-indexed open interval.
   *
   * @param {number} start - start of the interval, inclusive
   * @param {number} end - end of the interval, exclusive
   * @throws {RangeError} if the end is less than the start
   */
  constructor(n, t) {
    if (this.start = n, this.end = t, t < n)
      throw new RangeError("End cannot be less than start");
    this.start = n, this.end = t;
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
  static deserialize(n) {
    return new Re(n.start, n.end);
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
  getOverlap(n) {
    const t = Math.max(this.start, n.start), a = Math.min(this.end, n.end);
    return t < a ? new Re(t, a) : null;
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
class je extends Re {
  /**
   * Makes a new instance.  The input interval should be a 0-indexed open one.
   *
   * @param {string} chr - name of the chromosome
   * @param {number} start - start of the interval, inclusive
   * @param {number} end - end of the interval, exclusive
   */
  constructor(n, t, a) {
    super(t, a), this.chr = n, this.start = t, this.end = a;
  }
  /**
   * Parses a string representing a ChromosomeInterval, such as those produced by the toString() method.  Throws an
   * error if parsing fails.
   *
   * @param {string} str - interval to parse
   * @return {ChromosomeInterval} parsed instance
   * @throws {RangeError} if parsing fails
   */
  static parse(n) {
    const t = n.replace(/,/g, "").match(/([\w:.]+)\W+(\d+)\W+(\d+)/), a = n.includes(":") ? 1 : 0;
    if (t) {
      const s = t[1], o = Math.max(
        Number.parseInt(t[2], 10) - a,
        0
      ), h = Number.parseInt(t[3], 10);
      return new je(s, o, h);
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
  static mergeAdvanced(n, t, a) {
    const s = qt.groupBy(n, (h) => a(h).chr), o = [];
    for (const h in s) {
      const l = s[h];
      l.sort(
        (d, A) => a(d).start - a(A).start
      );
      const v = l.map(a);
      let c = 0;
      for (; c < v.length; ) {
        const d = v[c].start;
        let A = v[c].end, C = c + 1;
        for (; C < v.length; ) {
          const [y, k] = v[C];
          if (y - A > t)
            break;
          k > A && (A = k), C++;
        }
        o.push({
          locus: new je(h, d, A),
          sources: l.slice(c, C)
        }), c = C;
      }
    }
    return o;
  }
  /**
   * Merges chromosome intervals based on proximity, by default 2000 bp.  Does not mutate any inputs.
   *
   * @param {ChromosomeInterval[]} intervals - interval list to inspect for overlaps
   * @param {number} [mergeDistance] - distance in bases at which two intervals are close enough to merge
   * @return {ChromosomeInterval[]} - version of input list with intervals merged
   */
  static mergeOverlaps(n, t = 2e3) {
    return je.mergeAdvanced(
      n,
      t,
      qt.identity
    ).map((s) => s.locus);
  }
  serialize() {
    return this;
  }
  static deserialize(n) {
    return new je(n.chr, n.start, n.end);
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
  getOverlap(n) {
    if (this.chr !== n.chr)
      return null;
    {
      const t = this.toOpenInterval().getOverlap(n);
      return t ? new je(this.chr, t.start, t.end) : null;
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
    return new Re(this.start, this.end);
  }
  /**
   * Interprets this and another interval as a multi-chromosome interval, with this being the start and the other
   * being the end.  Returns a human-readable representation of that interpretation.
   *
   * @param {ChromosomeInterval} other - the "end" of the multi-chromosome interval
   * @return {string} a human-readable representation of a multi-chromosome interval
   */
  toStringWithOther(n) {
    return `${this.chr}:${this.start}-${n.chr}:${n.end}`;
  }
}
const ky = "+", Iy = "-";
class Yn {
  /**
   * Makes a new instance with specified name and locus.  Empty names are valid.  If given `undefined` or `null`, it
   * defaults to the locus as a string.
   *
   * @param {string} [name] - name of the feature
   * @param {ChromosomeInterval} locus - genomic location of the feature
   * @param {Strand} strand - strand info
   */
  constructor(n, t, a = "") {
    be(this, "name");
    // - name of the feature
    be(this, "score");
    be(this, "id");
    be(this, "sequence");
    this.locus = t, this.strand = a, this.name = n === void 0 ? t.toString() : n, this.locus = t, this.strand = a;
  }
  serialize() {
    return {
      name: this.name,
      locus: this.getLocus().serialize(),
      strand: this.strand
    };
  }
  static deserialize(n) {
    return new Yn(
      n.name,
      je.deserialize(n.locus),
      n.strand
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
    return this.strand === ky;
  }
  /**
   * @return {boolean} whether this feature is on the reverse strand
   */
  getIsReverseStrand() {
    return this.strand === Iy;
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
  computeNavContextCoordinates(n) {
    return n.convertGenomeIntervalToBases(this.getLocus());
  }
}
const Ty = "-";
class $y extends Yn {
  constructor(t) {
    const a = new je(t.chr, t.start, t.end);
    super(t[3].id, a, t.strand);
    /**
     * Constructs a new AlignmentRecord, given a record from genomealignment source
     *
     */
    be(this, "queryLocus");
    be(this, "targetSeq");
    be(this, "querySeq");
    be(this, "queryStrand");
    const { chr: s, start: o, stop: h, strand: l, targetseq: v, queryseq: c } = t[3].genomealign;
    this.queryLocus = new je(s, o, h), this.querySeq = c || "", this.targetSeq = v || "", this.queryStrand = l;
  }
  getIsReverseStrandQuery() {
    return this.queryStrand === Ty;
  }
}
class pn {
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
  constructor(n, t = 0, a) {
    be(this, "relativeStart");
    // Start base of the interval, relative to the feature's start
    be(this, "relativeEnd");
    if (this.feature = n, a === void 0 && (a = n.locus.end - n.locus.start), a < t)
      throw new RangeError("End cannot be less than start");
    this.feature = n, this.relativeStart = t, this.relativeEnd = a;
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
    return new Re(this.relativeStart, this.relativeEnd);
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
    const n = this.feature.locus;
    return new je(
      n.chr,
      n.start + this.relativeStart,
      n.start + this.relativeEnd
    );
  }
  /**
   * Intersects this and another FeatureSegment, and returns the result as a new FeatureSegment.  Returns `null` if
   * the *segments' features are different* or if there is no overlap.
   *
   * @param {FeatureSegment} other - other FeatureSegment to intersect
   * @return {FeatureSegment} intersection of this segment and the other one, or null if none exists
   */
  getOverlap(n) {
    if (this.feature !== n.feature)
      return null;
    const t = this.toOpenInterval().getOverlap(n.toOpenInterval());
    return t ? new pn(this.feature, t.start, t.end) : null;
  }
  /**
   * Intersects this and a genome location, and returns the result as a new FeatureSegment using the same Feature
   * that is attached to this.  Returns null if the genome location does not intersect with this location at all.
   *
   * @param {ChromosomeInterval} chrInterval - input genome location
   * @return {FeatureSegment} intersection of this and the input genomic location
   */
  getGenomeOverlap(n) {
    const t = this.feature.getLocus(), s = this.getLocus().getOverlap(n);
    if (!s)
      return null;
    const o = s.start - t.start, h = s.end - t.start;
    return new pn(this.feature, o, h);
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
const V0 = "";
class In {
  /**
   * Makes a new instance.  Features must have non-empty, unique names.  The `isGenome` parameter does not change any
   * of the instance's functionality, but if it is true, it optimizes mapping functions.
   *
   * @param {string} name - name of this context
   * @param {Feature[]} features - list of features
   * @param {boolean} isGenome - whether the context covers the entire genome
   * @throws {Error} if the feature list has a problem
   */
  constructor(n, t) {
    be(this, "_name");
    be(this, "_features");
    be(this, "_sortedFeatureStarts");
    be(this, "_minCoordinateForFeature");
    be(this, "_featuresForChr");
    be(this, "_totalBases");
    this._name = n, this._features = t, this._minCoordinateForFeature = /* @__PURE__ */ new Map(), this._sortedFeatureStarts = [], this._featuresForChr = qt.groupBy(
      t,
      (a) => a.getLocus().chr
    ), this._totalBases = 0;
    for (const a of t) {
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
  static makeGap(n, t = "Gap") {
    return new Yn(
      t,
      new je(V0, 0, Math.round(n))
    );
  }
  /**
   * @param {Feature} feature - feature to inspect
   * @return {boolean} whether the feature represents a gap in the genome
   */
  static isGapFeature(n) {
    return n.getLocus().chr === V0;
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
  _flipIfReverseStrand(n) {
    if (n.feature.getIsReverseStrand())
      return new pn(
        n.feature,
        t(n.relativeEnd),
        t(n.relativeStart)
      );
    return n;
    function t(a) {
      return n.feature.getLength() - a;
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
  getIsValidBase(n) {
    return 0 <= n && n < this._totalBases;
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
  getFeatureStart(n) {
    const t = this._minCoordinateForFeature.get(n);
    if (t === void 0)
      throw new RangeError(
        `Feature "${n.getName()}" not in this navigation context`
      );
    return t;
  }
  /**
   * Given a context coordinate, gets the feature in which it is located.  Returns a FeatureSegment that has 1 length,
   * representing a single base number relative to the feature's start.
   *
   * @param {number} base - the context coordinate to look up
   * @return {FeatureSegment} corresponding feature coordinate
   * @throws {RangeError} if the base is not in this context
   */
  convertBaseToFeatureCoordinate(n) {
    if (!this.getIsValidBase(n))
      throw new RangeError(
        `Base number ${n} is invalid.  Valid bases in this context: [0, ${this.getTotalBases()})`
      );
    const t = qt.sortedLastIndex(this._sortedFeatureStarts, n) - 1, a = this._features[t], s = n - this._sortedFeatureStarts[t];
    return this._flipIfReverseStrand(
      new pn(a, s, s + 1)
    );
  }
  /**
   * Given a segment of a feature from this navigation context, gets the context coordinates the segment occupies.
   *
   * @param {FeatureSegment} segment - feature segment from this context
   * @return {OpenInterval} context coordinates the feature segment occupies
   */
  convertFeatureSegmentToContextCoordinates(n) {
    n = this._flipIfReverseStrand(n);
    const t = this.getFeatureStart(n.feature);
    return new Re(
      t + n.relativeStart,
      t + n.relativeEnd
    );
  }
  /**
   * Converts genome coordinates to an interval of context coordinates.  Since coordinates can map
   * to multiple features, or none at all, this method returns a list of OpenInterval.
   *
   * @param {ChromosomeInterval} chrInterval - genome interval
   * @return {OpenInterval[]} intervals of context coordinates
   */
  convertGenomeIntervalToBases(n) {
    const t = this._featuresForChr[n.chr] || [], a = [];
    for (const s of t) {
      const o = new pn(s).getGenomeOverlap(n);
      o && a.push(
        this.convertFeatureSegmentToContextCoordinates(o)
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
  toGaplessCoordinate(n) {
    const t = this.convertBaseToFeatureCoordinate(n), a = this._features.findIndex(
      (h) => h === t.feature
    ), s = this._features.slice(0, a).filter(In.isGapFeature);
    let o = qt.sumBy(
      s,
      (h) => h.getLength()
    );
    return In.isGapFeature(t.feature) && (o += t.relativeStart), n - o;
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
  parse(n) {
    const t = this._features.find((o) => o.getName() === n);
    if (t) {
      const o = this.convertFeatureSegmentToContextCoordinates(
        new pn(t)
      ), h = 0.5 * (o.start + o.end);
      return new Re(h - 3, h + 3);
    }
    const a = je.parse(n), s = this.convertGenomeIntervalToBases(a)[0];
    if (s)
      return s;
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
  getFeaturesInInterval(n, t, a = !0) {
    const s = new Re(n, t), o = [];
    for (const h of this._features) {
      if (!a && In.isGapFeature(h))
        continue;
      const l = this.getFeatureStart(h), v = l + h.getLength(), c = new Re(l, v).getOverlap(s);
      if (c) {
        const d = c.start - l, A = c.end - l, C = new pn(h, d, A);
        o.push(this._flipIfReverseStrand(C));
      } else if (o.length > 0)
        break;
    }
    return o;
  }
  /**
   * Queries genomic locations that overlap an open interval of context coordinates.  The results are guaranteed to
   * not overlap each other.
   *
   * @param {number} queryStart - (inclusive) start of interval, as a context coordinate
   * @param {number} queryEnd - (exclusive) end of interval, as a context coordinate
   * @return {ChromosomeInterval[]} list of genomic locations
   */
  getLociInInterval(n, t) {
    const s = this.getFeaturesInInterval(
      n,
      t,
      !1
    ).map((o) => o.getLocus());
    return je.mergeOverlaps(s);
  }
  /**
   * check if a feature is in current context
   */
  hasFeatureWithName(n) {
    return this._features.some((t) => t.name === n.name);
  }
}
const wo = 0;
class na {
  /**
   * Makes a new instance with specified navigation context, and optionally, initial view region.  If not specified,
   * the view region will be the entire navigation context.
   *
   * @param {NavigationContext} navContext - the context in which navigation will take place
   * @param {number} [start] - initial start of the view region
   * @param {number} [end] - initial end of the view region
   */
  constructor(n, t = wo, a) {
    be(this, "_navContext");
    be(this, "_startBase");
    be(this, "_endBase");
    this._navContext = n, a === void 0 && (a = n.getTotalBases()), this.setRegion(t, a);
  }
  /**
   * Makes copy of this object such that no methods on the copy will modify the original.
   *
   * @return {DisplayedRegionModel} a copy of this object
   */
  clone() {
    return new na(
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
    return new Re(this._startBase, this._endBase);
  }
  /**
   * Gets the features that overlap this view region in the navigation context.
   *
   * @param {boolean} [includeGaps] - whether to include gaps in the results.  Default: true
   * @return {FeatureSegment[]} list of feature intervals that overlap this view region
   */
  getFeatureSegments(n = !0) {
    return this._navContext.getFeaturesInInterval(
      this._startBase,
      this._endBase,
      n
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
  setRegion(n, t) {
    if (!Number.isFinite(n) || !Number.isFinite(t))
      throw new RangeError("Start and end must be well-defined");
    if (t < n)
      throw new RangeError("Start must be less than or equal to end");
    const a = t - n, s = this._navContext.getTotalBases();
    return n < wo ? t = wo + a : t > s && (n = s - a), this._startBase = Math.round(Math.max(wo, n)), this._endBase = Math.round(Math.min(t, s)), this;
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
  pan(n) {
    return this.setRegion(this._startBase + n, this._endBase + n), this;
  }
  /**
   * pan same width to left, pan left not same as drag left, coords get smaller
   * @return {this}
   */
  panLeft() {
    const n = this.getWidth();
    return this.pan(-n);
  }
  /**
   * pan same width to right
   * @return {this}
   */
  panRight() {
    const n = this.getWidth();
    return this.pan(n);
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
  zoom(n, t = 0.5) {
    if (n <= 0)
      throw new RangeError("Zoom factor must be greater than 0");
    const a = this.getWidth() * n, s = this.getWidth() * t + this._startBase, o = a * t + this._startBase, h = s - o, l = this._startBase + h, v = this._startBase + a + h;
    return this.setRegion(l, v), this;
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
var X0 = Number.isNaN || function(n) {
  return typeof n == "number" && n !== n;
};
function Ry(e, n) {
  return !!(e === n || X0(e) && X0(n));
}
function Ny(e, n) {
  if (e.length !== n.length)
    return !1;
  for (var t = 0; t < e.length; t++)
    if (!Ry(e[t], n[t]))
      return !1;
  return !0;
}
function Ly(e, n) {
  n === void 0 && (n = Ny);
  var t = null;
  function a() {
    for (var s = [], o = 0; o < arguments.length; o++)
      s[o] = arguments[o];
    if (t && t.lastThis === this && n(s, t.lastArgs))
      return t.lastResult;
    var h = e.apply(this, s);
    return t = {
      lastResult: h,
      lastArgs: s,
      lastThis: this
    }, h;
  }
  return a.clear = function() {
    t = null;
  }, a;
}
const lu = "-";
function Zo(e) {
  return qt.sumBy(e, (n) => n === lu ? 0 : 1);
}
function K0(e, n, t = !1) {
  const a = [], s = new RegExp(lu + "+", "g");
  let o;
  for (; (o = s.exec(e)) !== null; )
    v(!0, o.index, o[0].length, n);
  if (t)
    return a;
  let h = 0;
  const l = a.slice();
  for (const c of l)
    v(!1, h, c.index - h), h = c.index + c.length;
  return v(!1, h, e.length - h), a;
  function v(c, d, A, C = 0) {
    A > C && a.push({ isGap: c, index: d, length: A });
  }
}
function Sf(e, n, t = !1) {
  const a = t ? -1 : 1, s = [];
  let o = n;
  for (const h of e)
    s.push(o), h !== lu && (o += a);
  return s;
}
class Oy {
  /**
   * Constructs a new instance that iterates through the specified string.
   *
   * @param {string} sequence - the string through which to iterate
   */
  constructor(n) {
    be(this, "sequence");
    be(this, "_currentIndex");
    this.sequence = n, this._currentIndex = -1;
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
    while (this.sequence.charAt(this._currentIndex) === lu);
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
  advanceN(n) {
    let t = this._currentIndex;
    for (let a = 0; a < n; a++)
      t = this.getIndexOfNextBase();
    return t;
  }
}
class Zl extends pn {
  /**
   * Constructs a new instance.
   *
   * @see {FeatureSegment}
   */
  constructor(t, a, s) {
    super(t, a, s);
    be(this, "feature");
    /**
     * The substring indices in the record's sequence data that this segment covers.
     */
    be(this, "sequenceInterval");
    this.feature = t;
    const o = new Oy(t.targetSeq), h = o.advanceN(this.relativeStart + 1), l = o.advanceN(this.getLength());
    this.sequenceInterval = new Re(h, l);
  }
  /**
   * Creates an AlignmentSegment from a FeatureSegment whose attached feature is an AlignmentRecord.  Works almost
   * like a cast from FeatureSegment to AlignmentSegment.
   *
   * @param {FeatureSegment} segment - a FeatureSegment whose attached feature must be an AlignmentRecord
   * @return {AlignmentSegment} a new AlignmentSegment from the data in the input
   */
  static fromFeatureSegment(t) {
    return new Zl(
      t.feature,
      t.relativeStart,
      t.relativeEnd
    );
  }
  /**
   * @return {string} the part of the primary genome sequence that this segment covers
   */
  getTargetSequence() {
    const [t, a] = this.sequenceInterval;
    return this.feature.targetSeq.substring(t, a);
  }
  /**
   * Gets the approximate location in the query/secondary genome that this segment covers.
   *
   * @return {ChromosomeInterval} the approximate locus in the query/secondary genome represented by this segment.
   */
  getQueryLocus() {
    const { queryStrand: t, queryLocus: a } = this.feature;
    return new je(
      a.chr,
      t === "+" ? Math.min(a.start + this.relativeStart, a.end) : Math.max(0, a.end - this.relativeEnd),
      t === "+" ? Math.min(a.start + this.relativeEnd, a.end) : a.end - this.relativeStart
    );
  }
  /**
   * Gets the location in the query/secondary genome that this segment covers.  Unlike `getQueryLocus`, this method
   * uses sequence data, so it will be more accurate, but also somewhat slower.
   *
   * @return {ChromosomeInterval} the locus in the query/secondary genome represented by this segment.
   */
  getQueryLocusFine() {
    const { querySeq: t, queryLocus: a } = this.feature, s = Zo(
      t.substring(0, this.sequenceInterval.start)
    ), o = Zo(this.getQuerySequence());
    if (this.feature.getIsReverseStrandQuery()) {
      const h = a.end - s;
      return new je(a.chr, h - o, h);
    } else {
      const h = a.start + s;
      return new je(a.chr, h, h + o);
    }
  }
  /**
   * @return {string} the part of the query/secondary genome sequence that this segment covers
   */
  getQuerySequence() {
    const [t, a] = this.sequenceInterval;
    return this.feature.querySeq.substring(t, a);
  }
}
function Py(e, n = !1) {
  const t = e >= 1e3 ? Math.floor(e) : Math.round(e);
  return t >= 75e4 ? `${(t / 1e6).toFixed(1)} Mb` : t >= 1e4 ? `${(t / 1e3).toFixed(1)} Kb` : t > 0 ? `${t} bp` : n ? "<1 bp" : "0 bp";
}
class Y0 {
  constructor(n) {
    be(this, "_baseNavContext");
    be(this, "_gaps");
    be(this, "_cumulativeGapBases");
    this._baseNavContext = n, this._cumulativeGapBases = [];
  }
  /**
   * @param gaps
   */
  setGaps(n) {
    this._gaps = n.slice().sort((a, s) => a.contextBase - s.contextBase), this._cumulativeGapBases = [];
    let t = 0;
    for (const a of this._gaps)
      this._cumulativeGapBases.push(t), t += a.length;
    this._cumulativeGapBases.push(t);
  }
  build() {
    const n = this._baseNavContext.getFeatures(), t = /* @__PURE__ */ new Map();
    for (let h = 0; h < n.length; h++)
      t.set(n[h], h);
    const a = [];
    let s = -1, o = 0;
    for (const h of this._gaps) {
      const l = this._baseNavContext.convertBaseToFeatureCoordinate(h.contextBase), v = l.feature, c = t.get(v), d = l.relativeStart;
      a.push(
        ...n.slice(s + 1, c)
      ), c === s && o > 0 && a.pop(), o = o > d ? 0 : o;
      const A = new pn(
        v,
        o,
        d
      ).getLocus(), C = new pn(
        v,
        d
      ).getLocus();
      A.getLength() > 0 && a.push(
        new Yn(
          v.getName(),
          A,
          v.getStrand()
        )
      ), a.push(
        In.makeGap(h.length, `${Py(h.length)} gap`)
      ), C.getLength() > 0 && a.push(
        new Yn(
          v.getName(),
          C,
          v.getStrand()
        )
      ), s = c, o = d;
    }
    return a.push(...n.slice(s + 1)), new In(
      this._baseNavContext.getName(),
      a
    );
  }
  convertOldCoordinates(n) {
    const t = qt.sortedIndexBy(
      this._gaps,
      { contextBase: n },
      "contextBase"
    ), a = this._cumulativeGapBases[t] || 0;
    return n + a;
  }
}
class ui {
  /**
   * Makes a new instance.
   *
   * @param {DisplayedRegionModel} viewRegion - the displayed region
   * @param {number} drawWidth - the width of the canvas/svg/etc on which to draw
   */
  constructor(n, t) {
    be(this, "_viewRegion");
    be(this, "_drawWidth");
    be(this, "_pixelsPerBase");
    be(this, "_basesPerPixel");
    this._viewRegion = n, this._drawWidth = t, this._pixelsPerBase = t / n.getWidth(), this._basesPerPixel = n.getWidth() / t;
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
  basesToXWidth(n) {
    return n * this._pixelsPerBase;
  }
  /**
   * Gets how many bases represented by a horizontal span of the SVG.
   *
   * @param {number} pixels - width of a horizontal span
   * @return {number} width in number of bases
   */
  xWidthToBases(n) {
    return n * this._basesPerPixel;
  }
  /**
   * Given an nav context coordinate, gets the X coordinate that represents that base.
   *
   * @param {number} base - nav context coordinate
   * @return {number} X coordinate that represents the input base
   */
  baseToX(n) {
    return (n - this._viewRegion.getContextCoordinates().start) * this._pixelsPerBase;
  }
  /**
   * Given an X coordinate representing a base, gets the nav context coordinate.
   *
   * @param {number} pixel - X coordinate that represents a base
   * @return {number} nav context coordinate
   */
  xToBase(n) {
    return n * this._basesPerPixel + this._viewRegion.getContextCoordinates().start;
  }
  /**
   * Converts an interval of bases to an interval of X coordinates.
   *
   * @param {OpenInterval} baseInterval - interval of bases to convert
   * @return {OpenInterval} x draw interval
   */
  baseSpanToXSpan(n) {
    const t = this.baseToX(n.start), a = this.baseToX(n.end);
    return new Re(t, a);
  }
  /**
   * Converts an interval of bases to an interval of X coordinates, but just the center.
   *
   * @param {OpenInterval} baseInterval - interval of bases to convert
   * @return {OpenInterval} x draw interval
   */
  baseSpanToXCenter(n) {
    const t = this.baseSpanToXSpan(n), a = Math.round((t.start + t.end) / 2);
    return new Re(a, a);
  }
  /**
   * Gets the segment coordinates that a pixel coordinate represents.
   *
   * @param {number} pixel - pixel coordinate that represents a base
   * @return {FeatureSegment} segment coordinate that the pixel represents
   */
  xToSegmentCoordinate(n) {
    const t = Math.floor(this.xToBase(n));
    return this._viewRegion.getNavigationContext().convertBaseToFeatureCoordinate(t);
  }
}
class Uy {
  // x span to draw the second region of the interaction
  constructor(n, t, a) {
    be(this, "interaction");
    // The interaction
    /**
     * x span to draw the first region of the interaction.  Guaranteed to have the lower start of both the two spans.
     */
    be(this, "xSpan1");
    be(this, "xSpan2");
    this.interaction = n, t.start <= a.start ? (this.xSpan1 = t, this.xSpan2 = a) : (this.xSpan1 = a, this.xSpan2 = t);
  }
  /**
   * @return {number} the length of the interaction in draw coordinates
   */
  getWidth() {
    const n = this.xSpan1.start;
    return Math.max(this.xSpan1.end, this.xSpan2.end) - n;
  }
  generateKey() {
    return "" + this.xSpan1.start + this.xSpan1.end + this.xSpan2.start + this.xSpan2.end;
  }
}
class My {
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
  placeFeatures(n, t, a, s = !1) {
    const o = new ui(t, a), h = t.getContextCoordinates(), l = t.getNavigationContext(), v = [];
    for (const c of n)
      for (let d of c.computeNavContextCoordinates(
        l
      ))
        if (d = d.getOverlap(h), d) {
          const A = s ? o.baseSpanToXCenter(d) : o.baseSpanToXSpan(d), { visiblePart: C, isReverse: y } = this._locatePlacement(
            c,
            l,
            d
          );
          v.push({
            feature: c,
            visiblePart: C,
            contextLocation: d,
            xSpan: A,
            isReverse: y
          });
        }
    return v;
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
  _locatePlacement(n, t, a) {
    const s = t.convertBaseToFeatureCoordinate(
      a.start
    ), o = s.getLocus().start, h = s.feature.getIsReverseStrand();
    let l;
    h ? l = o - a.getLength() + 1 : l = o;
    const v = l - n.getLocus().start, c = Math.max(0, v);
    return {
      visiblePart: new pn(
        n,
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
  placeFeatureSegments(n, t) {
    const a = n.xSpan.getLength() / n.contextLocation.getLength(), s = [];
    for (let o of t)
      if (o = o.getOverlap(n.visiblePart), o) {
        const l = (o.relativeStart - n.visiblePart.relativeStart) * a, v = o.getLength() * a;
        let c;
        n.isReverse ? c = n.xSpan.end - l - v : c = n.xSpan.start + l, s.push({
          segment: o,
          xSpan: new Re(c, c + v)
        });
      }
    return s;
  }
  placeInteractions(n, t, a) {
    const s = new ui(t, a), o = t.getContextCoordinates(), h = t.getNavigationContext(), l = [];
    for (const v of n) {
      let c = h.convertGenomeIntervalToBases(
        v.locus1
      ), d = h.convertGenomeIntervalToBases(
        v.locus2
      );
      c = c.map(
        (A) => A.getOverlap(o)
      ), d = d.map(
        (A) => A.getOverlap(o)
      );
      for (const A of c)
        for (const C of d)
          if (A && C) {
            const y = s.baseSpanToXSpan(A), k = s.baseSpanToXSpan(C);
            l.push(
              new Uy(v, y, k)
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
  placeGraphNodes(n, t, a) {
    const s = new ui(t, a), o = t.getContextCoordinates(), h = t.getNavigationContext(), l = [], v = [];
    for (const c of n)
      for (let d of c.computeNavContextCoordinates(
        h
      ))
        if (d = d.getOverlap(o), d) {
          const A = s.baseSpanToXSpan(d), { visiblePart: C, isReverse: y } = this._locatePlacement(
            c,
            h,
            d
          );
          l.push({
            feature: c,
            visiblePart: C,
            contextLocation: d,
            xSpan: A,
            isReverse: y
          });
        } else
          v.push(c);
    return { placements: l, nodesOutOfView: v };
  }
}
var zy = {
  rgb2hsl: hu,
  rgb2hsv: jo,
  rgb2hwb: cu,
  rgb2cmyk: du,
  rgb2keyword: pu,
  rgb2xyz: ql,
  rgb2lab: Hl,
  rgb2lch: Zy,
  hsl2rgb: es,
  hsl2hsv: qy,
  hsl2hwb: Hy,
  hsl2cmyk: Gy,
  hsl2keyword: Wy,
  hsv2rgb: ts,
  hsv2hsl: Vy,
  hsv2hwb: Xy,
  hsv2cmyk: Ky,
  hsv2keyword: Yy,
  hwb2rgb: gu,
  hwb2hsl: Qy,
  hwb2hsv: Jy,
  hwb2cmyk: jy,
  hwb2keyword: eE,
  cmyk2rgb: _u,
  cmyk2hsl: tE,
  cmyk2hsv: nE,
  cmyk2hwb: rE,
  cmyk2keyword: iE,
  keyword2rgb: mi,
  keyword2hsl: sE,
  keyword2hsv: fE,
  keyword2hwb: lE,
  keyword2cmyk: hE,
  keyword2lab: cE,
  keyword2xyz: dE,
  xyz2rgb: W1,
  xyz2lab: V1,
  xyz2lch: aE,
  lab2xyz: Gl,
  lab2rgb: X1,
  lab2lch: Wl,
  lch2lab: Vl,
  lch2xyz: uE,
  lch2rgb: oE
};
function hu(e) {
  var n = e[0] / 255, t = e[1] / 255, a = e[2] / 255, s = Math.min(n, t, a), o = Math.max(n, t, a), h = o - s, l, v, c;
  return o == s ? l = 0 : n == o ? l = (t - a) / h : t == o ? l = 2 + (a - n) / h : a == o && (l = 4 + (n - t) / h), l = Math.min(l * 60, 360), l < 0 && (l += 360), c = (s + o) / 2, o == s ? v = 0 : c <= 0.5 ? v = h / (o + s) : v = h / (2 - o - s), [l, v * 100, c * 100];
}
function jo(e) {
  var n = e[0], t = e[1], a = e[2], s = Math.min(n, t, a), o = Math.max(n, t, a), h = o - s, l, v, c;
  return o == 0 ? v = 0 : v = h / o * 1e3 / 10, o == s ? l = 0 : n == o ? l = (t - a) / h : t == o ? l = 2 + (a - n) / h : a == o && (l = 4 + (n - t) / h), l = Math.min(l * 60, 360), l < 0 && (l += 360), c = o / 255 * 1e3 / 10, [l, v, c];
}
function cu(e) {
  var n = e[0], t = e[1], o = e[2], a = hu(e)[0], s = 1 / 255 * Math.min(n, Math.min(t, o)), o = 1 - 1 / 255 * Math.max(n, Math.max(t, o));
  return [a, s * 100, o * 100];
}
function du(e) {
  var n = e[0] / 255, t = e[1] / 255, a = e[2] / 255, s, o, h, l;
  return l = Math.min(1 - n, 1 - t, 1 - a), s = (1 - n - l) / (1 - l) || 0, o = (1 - t - l) / (1 - l) || 0, h = (1 - a - l) / (1 - l) || 0, [s * 100, o * 100, h * 100, l * 100];
}
function pu(e) {
  return K1[JSON.stringify(e)];
}
function ql(e) {
  var n = e[0] / 255, t = e[1] / 255, a = e[2] / 255;
  n = n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92, t = t > 0.04045 ? Math.pow((t + 0.055) / 1.055, 2.4) : t / 12.92, a = a > 0.04045 ? Math.pow((a + 0.055) / 1.055, 2.4) : a / 12.92;
  var s = n * 0.4124 + t * 0.3576 + a * 0.1805, o = n * 0.2126 + t * 0.7152 + a * 0.0722, h = n * 0.0193 + t * 0.1192 + a * 0.9505;
  return [s * 100, o * 100, h * 100];
}
function Hl(e) {
  var n = ql(e), t = n[0], a = n[1], s = n[2], o, h, l;
  return t /= 95.047, a /= 100, s /= 108.883, t = t > 8856e-6 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116, a = a > 8856e-6 ? Math.pow(a, 1 / 3) : 7.787 * a + 16 / 116, s = s > 8856e-6 ? Math.pow(s, 1 / 3) : 7.787 * s + 16 / 116, o = 116 * a - 16, h = 500 * (t - a), l = 200 * (a - s), [o, h, l];
}
function Zy(e) {
  return Wl(Hl(e));
}
function es(e) {
  var n = e[0] / 360, t = e[1] / 100, a = e[2] / 100, s, o, h, l, v;
  if (t == 0)
    return v = a * 255, [v, v, v];
  a < 0.5 ? o = a * (1 + t) : o = a + t - a * t, s = 2 * a - o, l = [0, 0, 0];
  for (var c = 0; c < 3; c++)
    h = n + 1 / 3 * -(c - 1), h < 0 && h++, h > 1 && h--, 6 * h < 1 ? v = s + (o - s) * 6 * h : 2 * h < 1 ? v = o : 3 * h < 2 ? v = s + (o - s) * (2 / 3 - h) * 6 : v = s, l[c] = v * 255;
  return l;
}
function qy(e) {
  var n = e[0], t = e[1] / 100, a = e[2] / 100, s, o;
  return a === 0 ? [0, 0, 0] : (a *= 2, t *= a <= 1 ? a : 2 - a, o = (a + t) / 2, s = 2 * t / (a + t), [n, s * 100, o * 100]);
}
function Hy(e) {
  return cu(es(e));
}
function Gy(e) {
  return du(es(e));
}
function Wy(e) {
  return pu(es(e));
}
function ts(e) {
  var n = e[0] / 60, t = e[1] / 100, v = e[2] / 100, a = Math.floor(n) % 6, s = n - Math.floor(n), o = 255 * v * (1 - t), h = 255 * v * (1 - t * s), l = 255 * v * (1 - t * (1 - s)), v = 255 * v;
  switch (a) {
    case 0:
      return [v, l, o];
    case 1:
      return [h, v, o];
    case 2:
      return [o, v, l];
    case 3:
      return [o, h, v];
    case 4:
      return [l, o, v];
    case 5:
      return [v, o, h];
  }
}
function Vy(e) {
  var n = e[0], t = e[1] / 100, a = e[2] / 100, s, o;
  return o = (2 - t) * a, s = t * a, s /= o <= 1 ? o : 2 - o, s = s || 0, o /= 2, [n, s * 100, o * 100];
}
function Xy(e) {
  return cu(ts(e));
}
function Ky(e) {
  return du(ts(e));
}
function Yy(e) {
  return pu(ts(e));
}
function gu(e) {
  var n = e[0] / 360, t = e[1] / 100, a = e[2] / 100, s = t + a, o, h, l, v;
  switch (s > 1 && (t /= s, a /= s), o = Math.floor(6 * n), h = 1 - a, l = 6 * n - o, o & 1 && (l = 1 - l), v = t + l * (h - t), o) {
    default:
    case 6:
    case 0:
      r = h, g = v, b = t;
      break;
    case 1:
      r = v, g = h, b = t;
      break;
    case 2:
      r = t, g = h, b = v;
      break;
    case 3:
      r = t, g = v, b = h;
      break;
    case 4:
      r = v, g = t, b = h;
      break;
    case 5:
      r = h, g = t, b = v;
      break;
  }
  return [r * 255, g * 255, b * 255];
}
function Qy(e) {
  return hu(gu(e));
}
function Jy(e) {
  return jo(gu(e));
}
function jy(e) {
  return du(gu(e));
}
function eE(e) {
  return pu(gu(e));
}
function _u(e) {
  var n = e[0] / 100, t = e[1] / 100, a = e[2] / 100, s = e[3] / 100, o, h, l;
  return o = 1 - Math.min(1, n * (1 - s) + s), h = 1 - Math.min(1, t * (1 - s) + s), l = 1 - Math.min(1, a * (1 - s) + s), [o * 255, h * 255, l * 255];
}
function tE(e) {
  return hu(_u(e));
}
function nE(e) {
  return jo(_u(e));
}
function rE(e) {
  return cu(_u(e));
}
function iE(e) {
  return pu(_u(e));
}
function W1(e) {
  var n = e[0] / 100, t = e[1] / 100, a = e[2] / 100, s, o, h;
  return s = n * 3.2406 + t * -1.5372 + a * -0.4986, o = n * -0.9689 + t * 1.8758 + a * 0.0415, h = n * 0.0557 + t * -0.204 + a * 1.057, s = s > 31308e-7 ? 1.055 * Math.pow(s, 1 / 2.4) - 0.055 : s = s * 12.92, o = o > 31308e-7 ? 1.055 * Math.pow(o, 1 / 2.4) - 0.055 : o = o * 12.92, h = h > 31308e-7 ? 1.055 * Math.pow(h, 1 / 2.4) - 0.055 : h = h * 12.92, s = Math.min(Math.max(0, s), 1), o = Math.min(Math.max(0, o), 1), h = Math.min(Math.max(0, h), 1), [s * 255, o * 255, h * 255];
}
function V1(e) {
  var n = e[0], t = e[1], a = e[2], s, o, h;
  return n /= 95.047, t /= 100, a /= 108.883, n = n > 8856e-6 ? Math.pow(n, 1 / 3) : 7.787 * n + 16 / 116, t = t > 8856e-6 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116, a = a > 8856e-6 ? Math.pow(a, 1 / 3) : 7.787 * a + 16 / 116, s = 116 * t - 16, o = 500 * (n - t), h = 200 * (t - a), [s, o, h];
}
function aE(e) {
  return Wl(V1(e));
}
function Gl(e) {
  var n = e[0], t = e[1], a = e[2], s, o, h, l;
  return n <= 8 ? (o = n * 100 / 903.3, l = 7.787 * (o / 100) + 16 / 116) : (o = 100 * Math.pow((n + 16) / 116, 3), l = Math.pow(o / 100, 1 / 3)), s = s / 95.047 <= 8856e-6 ? s = 95.047 * (t / 500 + l - 16 / 116) / 7.787 : 95.047 * Math.pow(t / 500 + l, 3), h = h / 108.883 <= 8859e-6 ? h = 108.883 * (l - a / 200 - 16 / 116) / 7.787 : 108.883 * Math.pow(l - a / 200, 3), [s, o, h];
}
function Wl(e) {
  var n = e[0], t = e[1], a = e[2], s, o, h;
  return s = Math.atan2(a, t), o = s * 360 / 2 / Math.PI, o < 0 && (o += 360), h = Math.sqrt(t * t + a * a), [n, h, o];
}
function X1(e) {
  return W1(Gl(e));
}
function Vl(e) {
  var n = e[0], t = e[1], a = e[2], s, o, h;
  return h = a / 360 * 2 * Math.PI, s = t * Math.cos(h), o = t * Math.sin(h), [n, s, o];
}
function uE(e) {
  return Gl(Vl(e));
}
function oE(e) {
  return X1(Vl(e));
}
function mi(e) {
  return vl[e];
}
function sE(e) {
  return hu(mi(e));
}
function fE(e) {
  return jo(mi(e));
}
function lE(e) {
  return cu(mi(e));
}
function hE(e) {
  return du(mi(e));
}
function cE(e) {
  return Hl(mi(e));
}
function dE(e) {
  return ql(mi(e));
}
var vl = {
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
}, K1 = {};
for (var Q0 in vl)
  K1[JSON.stringify(vl[Q0])] = Q0;
var kf = zy, Gi = function() {
  return new wu();
};
for (var ka in kf) {
  Gi[ka + "Raw"] = /* @__PURE__ */ function(e) {
    return function(n) {
      return typeof n == "number" && (n = Array.prototype.slice.call(arguments)), kf[e](n);
    };
  }(ka);
  var J0 = /(\w+)2(\w+)/.exec(ka), If = J0[1], pE = J0[2];
  Gi[If] = Gi[If] || {}, Gi[If][pE] = Gi[ka] = /* @__PURE__ */ function(e) {
    return function(n) {
      typeof n == "number" && (n = Array.prototype.slice.call(arguments));
      var t = kf[e](n);
      if (typeof t == "string" || t === void 0)
        return t;
      for (var a = 0; a < t.length; a++)
        t[a] = Math.round(t[a]);
      return t;
    };
  }(ka);
}
var wu = function() {
  this.convs = {};
};
wu.prototype.routeSpace = function(e, n) {
  var t = n[0];
  return t === void 0 ? this.getValues(e) : (typeof t == "number" && (t = Array.prototype.slice.call(n)), this.setValues(e, t));
};
wu.prototype.setValues = function(e, n) {
  return this.space = e, this.convs = {}, this.convs[e] = n, this;
};
wu.prototype.getValues = function(e) {
  var n = this.convs[e];
  if (!n) {
    var t = this.space, a = this.convs[t];
    n = Gi[t][e](a), this.convs[e] = n;
  }
  return n;
};
["rgb", "hsl", "hsv", "cmyk", "keyword"].forEach(function(e) {
  wu.prototype[e] = function(n) {
    return this.routeSpace(e, arguments);
  };
});
var bt = typeof globalThis < "u" && globalThis || typeof self < "u" && self || // eslint-disable-next-line no-undef
typeof global < "u" && global || {}, kt = {
  searchParams: "URLSearchParams" in bt,
  iterable: "Symbol" in bt && "iterator" in Symbol,
  blob: "FileReader" in bt && "Blob" in bt && function() {
    try {
      return new Blob(), !0;
    } catch {
      return !1;
    }
  }(),
  formData: "FormData" in bt,
  arrayBuffer: "ArrayBuffer" in bt
};
function gE(e) {
  return e && DataView.prototype.isPrototypeOf(e);
}
if (kt.arrayBuffer)
  var _E = [
    "[object Int8Array]",
    "[object Uint8Array]",
    "[object Uint8ClampedArray]",
    "[object Int16Array]",
    "[object Uint16Array]",
    "[object Int32Array]",
    "[object Uint32Array]",
    "[object Float32Array]",
    "[object Float64Array]"
  ], wE = ArrayBuffer.isView || function(e) {
    return e && _E.indexOf(Object.prototype.toString.call(e)) > -1;
  };
function oa(e) {
  if (typeof e != "string" && (e = String(e)), /[^a-z0-9\-#$%&'*+.^_`|~!]/i.test(e) || e === "")
    throw new TypeError('Invalid character in header field name: "' + e + '"');
  return e.toLowerCase();
}
function Xl(e) {
  return typeof e != "string" && (e = String(e)), e;
}
function Kl(e) {
  var n = {
    next: function() {
      var t = e.shift();
      return { done: t === void 0, value: t };
    }
  };
  return kt.iterable && (n[Symbol.iterator] = function() {
    return n;
  }), n;
}
function ht(e) {
  this.map = {}, e instanceof ht ? e.forEach(function(n, t) {
    this.append(t, n);
  }, this) : Array.isArray(e) ? e.forEach(function(n) {
    if (n.length != 2)
      throw new TypeError("Headers constructor: expected name/value pair to be length 2, found" + n.length);
    this.append(n[0], n[1]);
  }, this) : e && Object.getOwnPropertyNames(e).forEach(function(n) {
    this.append(n, e[n]);
  }, this);
}
ht.prototype.append = function(e, n) {
  e = oa(e), n = Xl(n);
  var t = this.map[e];
  this.map[e] = t ? t + ", " + n : n;
};
ht.prototype.delete = function(e) {
  delete this.map[oa(e)];
};
ht.prototype.get = function(e) {
  return e = oa(e), this.has(e) ? this.map[e] : null;
};
ht.prototype.has = function(e) {
  return this.map.hasOwnProperty(oa(e));
};
ht.prototype.set = function(e, n) {
  this.map[oa(e)] = Xl(n);
};
ht.prototype.forEach = function(e, n) {
  for (var t in this.map)
    this.map.hasOwnProperty(t) && e.call(n, this.map[t], t, this);
};
ht.prototype.keys = function() {
  var e = [];
  return this.forEach(function(n, t) {
    e.push(t);
  }), Kl(e);
};
ht.prototype.values = function() {
  var e = [];
  return this.forEach(function(n) {
    e.push(n);
  }), Kl(e);
};
ht.prototype.entries = function() {
  var e = [];
  return this.forEach(function(n, t) {
    e.push([t, n]);
  }), Kl(e);
};
kt.iterable && (ht.prototype[Symbol.iterator] = ht.prototype.entries);
function Tf(e) {
  if (!e._noBody) {
    if (e.bodyUsed)
      return Promise.reject(new TypeError("Already read"));
    e.bodyUsed = !0;
  }
}
function Y1(e) {
  return new Promise(function(n, t) {
    e.onload = function() {
      n(e.result);
    }, e.onerror = function() {
      t(e.error);
    };
  });
}
function bE(e) {
  var n = new FileReader(), t = Y1(n);
  return n.readAsArrayBuffer(e), t;
}
function vE(e) {
  var n = new FileReader(), t = Y1(n), a = /charset=([A-Za-z0-9_-]+)/.exec(e.type), s = a ? a[1] : "utf-8";
  return n.readAsText(e, s), t;
}
function DE(e) {
  for (var n = new Uint8Array(e), t = new Array(n.length), a = 0; a < n.length; a++)
    t[a] = String.fromCharCode(n[a]);
  return t.join("");
}
function j0(e) {
  if (e.slice)
    return e.slice(0);
  var n = new Uint8Array(e.byteLength);
  return n.set(new Uint8Array(e)), n.buffer;
}
function Q1() {
  return this.bodyUsed = !1, this._initBody = function(e) {
    this.bodyUsed = this.bodyUsed, this._bodyInit = e, e ? typeof e == "string" ? this._bodyText = e : kt.blob && Blob.prototype.isPrototypeOf(e) ? this._bodyBlob = e : kt.formData && FormData.prototype.isPrototypeOf(e) ? this._bodyFormData = e : kt.searchParams && URLSearchParams.prototype.isPrototypeOf(e) ? this._bodyText = e.toString() : kt.arrayBuffer && kt.blob && gE(e) ? (this._bodyArrayBuffer = j0(e.buffer), this._bodyInit = new Blob([this._bodyArrayBuffer])) : kt.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(e) || wE(e)) ? this._bodyArrayBuffer = j0(e) : this._bodyText = e = Object.prototype.toString.call(e) : (this._noBody = !0, this._bodyText = ""), this.headers.get("content-type") || (typeof e == "string" ? this.headers.set("content-type", "text/plain;charset=UTF-8") : this._bodyBlob && this._bodyBlob.type ? this.headers.set("content-type", this._bodyBlob.type) : kt.searchParams && URLSearchParams.prototype.isPrototypeOf(e) && this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8"));
  }, kt.blob && (this.blob = function() {
    var e = Tf(this);
    if (e)
      return e;
    if (this._bodyBlob)
      return Promise.resolve(this._bodyBlob);
    if (this._bodyArrayBuffer)
      return Promise.resolve(new Blob([this._bodyArrayBuffer]));
    if (this._bodyFormData)
      throw new Error("could not read FormData body as blob");
    return Promise.resolve(new Blob([this._bodyText]));
  }), this.arrayBuffer = function() {
    if (this._bodyArrayBuffer) {
      var e = Tf(this);
      return e || (ArrayBuffer.isView(this._bodyArrayBuffer) ? Promise.resolve(
        this._bodyArrayBuffer.buffer.slice(
          this._bodyArrayBuffer.byteOffset,
          this._bodyArrayBuffer.byteOffset + this._bodyArrayBuffer.byteLength
        )
      ) : Promise.resolve(this._bodyArrayBuffer));
    } else {
      if (kt.blob)
        return this.blob().then(bE);
      throw new Error("could not read as ArrayBuffer");
    }
  }, this.text = function() {
    var e = Tf(this);
    if (e)
      return e;
    if (this._bodyBlob)
      return vE(this._bodyBlob);
    if (this._bodyArrayBuffer)
      return Promise.resolve(DE(this._bodyArrayBuffer));
    if (this._bodyFormData)
      throw new Error("could not read FormData body as text");
    return Promise.resolve(this._bodyText);
  }, kt.formData && (this.formData = function() {
    return this.text().then(EE);
  }), this.json = function() {
    return this.text().then(JSON.parse);
  }, this;
}
var mE = ["CONNECT", "DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT", "TRACE"];
function yE(e) {
  var n = e.toUpperCase();
  return mE.indexOf(n) > -1 ? n : e;
}
function di(e, n) {
  if (!(this instanceof di))
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
  n = n || {};
  var t = n.body;
  if (e instanceof di) {
    if (e.bodyUsed)
      throw new TypeError("Already read");
    this.url = e.url, this.credentials = e.credentials, n.headers || (this.headers = new ht(e.headers)), this.method = e.method, this.mode = e.mode, this.signal = e.signal, !t && e._bodyInit != null && (t = e._bodyInit, e.bodyUsed = !0);
  } else
    this.url = String(e);
  if (this.credentials = n.credentials || this.credentials || "same-origin", (n.headers || !this.headers) && (this.headers = new ht(n.headers)), this.method = yE(n.method || this.method || "GET"), this.mode = n.mode || this.mode || null, this.signal = n.signal || this.signal || function() {
    if ("AbortController" in bt) {
      var o = new AbortController();
      return o.signal;
    }
  }(), this.referrer = null, (this.method === "GET" || this.method === "HEAD") && t)
    throw new TypeError("Body not allowed for GET or HEAD requests");
  if (this._initBody(t), (this.method === "GET" || this.method === "HEAD") && (n.cache === "no-store" || n.cache === "no-cache")) {
    var a = /([?&])_=[^&]*/;
    if (a.test(this.url))
      this.url = this.url.replace(a, "$1_=" + (/* @__PURE__ */ new Date()).getTime());
    else {
      var s = /\?/;
      this.url += (s.test(this.url) ? "&" : "?") + "_=" + (/* @__PURE__ */ new Date()).getTime();
    }
  }
}
di.prototype.clone = function() {
  return new di(this, { body: this._bodyInit });
};
function EE(e) {
  var n = new FormData();
  return e.trim().split("&").forEach(function(t) {
    if (t) {
      var a = t.split("="), s = a.shift().replace(/\+/g, " "), o = a.join("=").replace(/\+/g, " ");
      n.append(decodeURIComponent(s), decodeURIComponent(o));
    }
  }), n;
}
function CE(e) {
  var n = new ht(), t = e.replace(/\r?\n[\t ]+/g, " ");
  return t.split("\r").map(function(a) {
    return a.indexOf(`
`) === 0 ? a.substr(1, a.length) : a;
  }).forEach(function(a) {
    var s = a.split(":"), o = s.shift().trim();
    if (o) {
      var h = s.join(":").trim();
      try {
        n.append(o, h);
      } catch (l) {
        console.warn("Response " + l.message);
      }
    }
  }), n;
}
Q1.call(di.prototype);
function Qn(e, n) {
  if (!(this instanceof Qn))
    throw new TypeError('Please use the "new" operator, this DOM object constructor cannot be called as a function.');
  if (n || (n = {}), this.type = "default", this.status = n.status === void 0 ? 200 : n.status, this.status < 200 || this.status > 599)
    throw new RangeError("Failed to construct 'Response': The status provided (0) is outside the range [200, 599].");
  this.ok = this.status >= 200 && this.status < 300, this.statusText = n.statusText === void 0 ? "" : "" + n.statusText, this.headers = new ht(n.headers), this.url = n.url || "", this._initBody(e);
}
Q1.call(Qn.prototype);
Qn.prototype.clone = function() {
  return new Qn(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new ht(this.headers),
    url: this.url
  });
};
Qn.error = function() {
  var e = new Qn(null, { status: 200, statusText: "" });
  return e.ok = !1, e.status = 0, e.type = "error", e;
};
var xE = [301, 302, 303, 307, 308];
Qn.redirect = function(e, n) {
  if (xE.indexOf(n) === -1)
    throw new RangeError("Invalid status code");
  return new Qn(null, { status: n, headers: { location: e } });
};
var ai = bt.DOMException;
try {
  new ai();
} catch {
  ai = function(n, t) {
    this.message = n, this.name = t;
    var a = Error(n);
    this.stack = a.stack;
  }, ai.prototype = Object.create(Error.prototype), ai.prototype.constructor = ai;
}
function J1(e, n) {
  return new Promise(function(t, a) {
    var s = new di(e, n);
    if (s.signal && s.signal.aborted)
      return a(new ai("Aborted", "AbortError"));
    var o = new XMLHttpRequest();
    function h() {
      o.abort();
    }
    o.onload = function() {
      var c = {
        statusText: o.statusText,
        headers: CE(o.getAllResponseHeaders() || "")
      };
      s.url.indexOf("file://") === 0 && (o.status < 200 || o.status > 599) ? c.status = 200 : c.status = o.status, c.url = "responseURL" in o ? o.responseURL : c.headers.get("X-Request-URL");
      var d = "response" in o ? o.response : o.responseText;
      setTimeout(function() {
        t(new Qn(d, c));
      }, 0);
    }, o.onerror = function() {
      setTimeout(function() {
        a(new TypeError("Network request failed"));
      }, 0);
    }, o.ontimeout = function() {
      setTimeout(function() {
        a(new TypeError("Network request timed out"));
      }, 0);
    }, o.onabort = function() {
      setTimeout(function() {
        a(new ai("Aborted", "AbortError"));
      }, 0);
    };
    function l(c) {
      try {
        return c === "" && bt.location.href ? bt.location.href : c;
      } catch {
        return c;
      }
    }
    if (o.open(s.method, l(s.url), !0), s.credentials === "include" ? o.withCredentials = !0 : s.credentials === "omit" && (o.withCredentials = !1), "responseType" in o && (kt.blob ? o.responseType = "blob" : kt.arrayBuffer && (o.responseType = "arraybuffer")), n && typeof n.headers == "object" && !(n.headers instanceof ht || bt.Headers && n.headers instanceof bt.Headers)) {
      var v = [];
      Object.getOwnPropertyNames(n.headers).forEach(function(c) {
        v.push(oa(c)), o.setRequestHeader(c, Xl(n.headers[c]));
      }), s.headers.forEach(function(c, d) {
        v.indexOf(d) === -1 && o.setRequestHeader(d, c);
      });
    } else
      s.headers.forEach(function(c, d) {
        o.setRequestHeader(d, c);
      });
    s.signal && (s.signal.addEventListener("abort", h), o.onreadystatechange = function() {
      o.readyState === 4 && s.signal.removeEventListener("abort", h);
    }), o.send(typeof s._bodyInit > "u" ? null : s._bodyInit);
  });
}
J1.polyfill = !0;
bt.fetch || (bt.fetch = J1, bt.Headers = ht, bt.Request = di, bt.Response = Qn);
var AE = self.fetch.bind(self), Ka = /* @__PURE__ */ Jo(AE);
function Vi(e, n = !1) {
  const t = e >= 1e3 ? Math.floor(e) : Math.round(e);
  return t >= 75e4 ? `${(t / 1e6).toFixed(1)} Mb` : t >= 1e4 ? `${(t / 1e3).toFixed(1)} Kb` : t > 0 ? `${t} bp` : n ? "<1 bp" : "0 bp";
}
const FE = 10, $f = 5, ed = 0.99, BE = 200, SE = 5, kE = new My();
class IE {
  constructor(n) {
    be(this, "primaryGenome");
    this.primaryGenome = n, this.multiAlign = Ly(this.multiAlign);
  }
  multiAlign(n, t) {
    const { visRegion: a, visWidth: s, viewWindowRegion: o } = n, l = new ui(a, s).xWidthToBases(1) < FE;
    let v;
    if (l) {
      const c = t, { newRecordsArray: d, allGaps: A } = this.refineRecordsArray(
        c,
        n
      );
      v = d;
      const C = this.calculatePrimaryVis(A, n);
      return v.reduce(
        (y, k) => ({
          ...y,
          [k.query]: k.isBigChain ? this.alignRough(
            k.id,
            k.query,
            k.records,
            n
          ) : this.alignFine(
            k.id,
            k.query,
            k.records,
            n,
            C,
            A
          )
        }),
        {}
      );
    } else
      return v = t, v.reduce(
        (c, d) => ({
          ...c,
          [d.query]: this.alignRough(
            d.id,
            d.query,
            d.records,
            n
          )
        }),
        {}
      );
  }
  calculatePrimaryVis(n, t) {
    const { visRegion: a, viewWindow: s, viewWindowRegion: o } = t, h = a.getNavigationContext(), l = new Y0(h);
    l.setGaps(n);
    const v = l.build(), c = B(a), d = B(o), A = s.getLength() / d.getWidth(), C = c.getWidth() * A, k = new ui(c, C).baseSpanToXSpan(
      d.getContextCoordinates()
    );
    return {
      visRegion: c,
      visWidth: C,
      viewWindowRegion: d,
      viewWindow: k
    };
    function B(P) {
      const [T, Z] = P.getContextCoordinates();
      return new na(
        v,
        l.convertOldCoordinates(T),
        l.convertOldCoordinates(Z)
      );
    }
  }
  // return a new recordObj array with gaps inserted, and allGap contextBase.
  refineRecordsArray(n, t) {
    const a = ed, s = [], o = {};
    for (const c of n) {
      const d = this._computeContextLocations(
        c.records,
        t
      ), C = this._getPrimaryGenomeGaps(d, a).reduce((y, k) => ({ ...y, [k.contextBase]: k.length }), {});
      s.push({
        recordsObj: c,
        placements: d,
        primaryGapsObj: C
      });
      for (const y of Object.keys(C))
        y in o ? o[y] = Math.max(
          o[y],
          C[y]
        ) : o[y] = C[y];
    }
    const h = [];
    for (const c of Object.keys(o))
      h.push({
        contextBase: Number(c),
        length: o[c]
      });
    if (h.sort((c, d) => c.contextBase - d.contextBase), s.length > 1)
      for (const c of s) {
        const d = [];
        for (const A of Object.keys(o))
          if (A in c.primaryGapsObj) {
            const C = o[A] - c.primaryGapsObj[A];
            C > 0 && d.push({
              contextBase: Number(A),
              length: C
            });
          } else
            d.push({
              contextBase: Number(A),
              length: o[A]
            });
        d.sort((A, C) => C.contextBase - A.contextBase);
        for (const A of d) {
          const C = "-".repeat(A.length), y = A.contextBase, k = c.placements.filter(
            (B) => B.contextSpan.start < y && B.contextSpan.end > y
          )[0];
          if (k) {
            const B = k.visiblePart.getTargetSequence(), P = v(
              B,
              y - k.contextSpan.start
            ), T = k.visiblePart.sequenceInterval.start + P, Z = k.record.targetSeq, U = k.record.querySeq;
            k.record.targetSeq = Z.slice(0, T) + C + Z.slice(T), k.record.querySeq = U.slice(0, T) + C + U.slice(T);
          }
        }
        c.recordsObj.records = c.placements.map(
          (A) => A.record
        );
      }
    return { newRecordsArray: s.map((c) => c.recordsObj), allGaps: h };
    function v(c, d) {
      let A = 0;
      for (const C of c)
        if (A++, C !== lu && d--, d === 0)
          break;
      return A;
    }
  }
  alignFine(n, t, a, s, o, h) {
    const { visRegion: l, visWidth: v } = o, c = new ui(l, v), d = ed, A = s.visRegion.getNavigationContext(), C = this._computeContextLocations(a, s), y = new Y0(A);
    y.setGaps(h);
    for (const U of C) {
      const $ = U.contextSpan, L = U.visiblePart, Q = new Re(
        y.convertOldCoordinates($.start),
        y.convertOldCoordinates($.end)
      ), q = c.baseSpanToXSpan(Q), G = L.getTargetSequence(), J = L.getQuerySequence();
      U.contextSpan = Q, U.targetXSpan = q, U.queryXSpan = q, U.targetSegments = this._placeSequenceSegments(
        G,
        d,
        q.start,
        c
      ), U.querySegments = this._placeSequenceSegments(
        J,
        d,
        q.start,
        c
      );
    }
    const k = [], B = new Rf($f), P = new Rf($f);
    for (let U = 1; U < C.length; U++) {
      const $ = C[U - 1], L = C[U], Q = $.targetXSpan.end, q = L.targetXSpan.start, G = $.record.locus.chr, J = $.record.locus.end, ee = $.record.queryLocus.chr, K = $.record.queryStrand, ie = K === "+" ? $.record.queryLocus.end : $.record.queryLocus.start, Ce = L.record.locus.chr, ve = L.record.locus.start, Me = L.record.queryLocus.chr, Oe = L.record.queryStrand, ce = Oe === "+" ? L.record.queryLocus.start : L.record.queryLocus.end;
      let Be;
      ee === Me ? K === "+" && Oe === "+" ? (Be = ce >= ie ? "" : "overlap ", Be += Vi(Math.abs(ce - ie))) : K === "-" && Oe === "-" ? (Be = ie >= ce ? "" : "overlap ", Be += Vi(Math.abs(ie - ce))) : Be = "reverse direction" : Be = "not connected";
      const Nn = (Q + q) / 2, xt = ($.queryXSpan.end + L.queryXSpan.start) / 2, me = G === Ce ? Vi(ve - J) : "not connected", tn = 0.5 * (me.length * 5), ze = Nn - tn, At = Nn + tn, nn = ze <= Q || At >= q, Dr = nn ? B.place(
        new Re(ze, At)
      ) : new Re(ze, At), Dt = new Re(Q, q), Gr = 0.5 * (Be.length * 5), Ln = xt - Gr, En = xt + Gr, rn = Ln <= $.queryXSpan.end || En >= L.queryXSpan.start, ot = rn ? P.place(
        new Re(Ln, En)
      ) : new Re(Ln, En), er = new Re(
        $.queryXSpan.end,
        L.queryXSpan.start
      );
      k.push({
        targetGapText: me,
        targetXSpan: Dt,
        targetTextXSpan: Dr,
        queryGapText: Be,
        queryXSpan: er,
        queryTextXSpan: ot,
        shiftTarget: nn,
        shiftQuery: rn
      });
    }
    const T = this._getQueryPieces(C), Z = this._makeQueryGenomeRegion(
      T,
      v,
      c
    );
    return {
      id: n,
      isFineMode: !0,
      primaryVisData: o,
      queryRegion: Z,
      drawData: C,
      drawGapText: k,
      primaryGenome: this.primaryGenome,
      queryGenome: t,
      basesPerPixel: c.xWidthToBases(1),
      navContextBuilder: y
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
  alignRough(n, t, a, s) {
    const { visRegion: o, visWidth: h } = s, l = new ui(o, h), v = l.xWidthToBases(BE), d = a.reduce(
      (B, P) => B + (P.getIsReverseStrandQuery() ? -1 * P.getLength() : P.getLength()),
      0
    ) < 0 ? "-" : "+", A = this._computeContextLocations(
      a,
      s
    );
    let C = je.mergeAdvanced(
      // Note that the third parameter gets query loci
      A,
      v,
      (B) => B.visiblePart.getQueryLocus()
    );
    C = C.sort(
      (B, P) => P.locus.getLength() - B.locus.getLength()
    );
    const y = new Rf($f), k = [];
    for (const B of C) {
      const P = B.locus, T = B.sources, Z = l.basesToXWidth(P.getLength()), U = 0.5 * Z;
      if (Z < SE)
        continue;
      const $ = TE(
        T.map((ve) => ve.targetXSpan)
      ), L = Math.min(
        ...T.map((ve) => ve.targetXSpan.start)
      ), Q = Math.max(
        ...T.map((ve) => ve.targetXSpan.end)
      ), q = new Re(L, Q), G = $ - U, J = $ + U, ee = y.place(
        new Re(G, J)
      ), K = T.map(
        (ve) => ve.record.queryLocus
      ), ie = d === "-", Ce = this._placeInternalLoci(
        P,
        K,
        ee,
        ie,
        l
      );
      for (let ve = 0; ve < K.length; ve++)
        T[ve].queryXSpan = Ce[ve];
      k.push({
        queryFeature: new Yn(void 0, P, d),
        targetXSpan: q,
        queryXSpan: ee,
        segments: T
      });
    }
    return {
      id: n,
      isFineMode: !1,
      primaryVisData: s,
      queryRegion: this._makeQueryGenomeRegion(k, h, l),
      drawData: k,
      plotStrand: d,
      primaryGenome: this.primaryGenome,
      queryGenome: t,
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
  _computeContextLocations(n, t) {
    const { visRegion: a, visWidth: s } = t;
    return kE.placeFeatures(n, a, s).map(
      (o) => ({
        record: o.feature,
        visiblePart: Zl.fromFeatureSegment(
          o.visiblePart
        ),
        contextSpan: o.contextLocation,
        targetXSpan: o.xSpan,
        queryXSpan: null
      })
    );
  }
  /**
   *
   * @param placedAlignment
   * @param minGapLength
   */
  _getPrimaryGenomeGaps(n, t) {
    const a = [];
    for (const s of n) {
      const { visiblePart: o, contextSpan: h } = s, l = K0(
        o.getTargetSequence(),
        t,
        !0
      ), v = Sf(
        o.getTargetSequence(),
        h.start
      );
      for (const c of l)
        a.push({
          contextBase: v[c.index],
          length: c.length
        });
    }
    return a;
  }
  _placeSequenceSegments(n, t, a, s) {
    const o = K0(n, t);
    o.sort((l, v) => l.index - v.index);
    let h = a;
    for (const l of o) {
      const v = l.isGap ? l.length : Zo(n.substr(l.index, l.length)), c = s.basesToXWidth(v);
      l.xSpan = new Re(
        h,
        h + c
      ), h += c;
    }
    return o;
  }
  /**
   *
   * @param placements
   * @param minGapLength
   * @param pixelsPerBase
   */
  _getQueryPieces(n) {
    const t = [];
    for (const a of n) {
      const { record: s, visiblePart: o } = a, h = s.getIsReverseStrandQuery(), l = o.getQuerySequence();
      let v;
      h ? v = Sf(
        l,
        o.getQueryLocusFine().end,
        !0
      ) : v = Sf(
        l,
        o.getQueryLocusFine().start
      );
      const c = s.queryLocus.chr;
      for (const d of a.querySegments) {
        const { isGap: A, index: C, length: y, xSpan: k } = d;
        if (A)
          continue;
        const B = v[C], P = Zo(l.substr(C, y));
        let T;
        h ? T = new je(
          c,
          B - P,
          B
        ) : T = new je(
          c,
          B,
          B + P
        ), t.push({
          queryFeature: new Yn(
            void 0,
            T,
            s.queryStrand
          ),
          queryXSpan: k
        });
      }
    }
    return t;
  }
  _makeQueryGenomeRegion(n, t, a) {
    const s = n.slice().sort((c, d) => c.queryXSpan.start - d.queryXSpan.start), o = [];
    let h = 0, l = new je("", -1, -1);
    for (const c of s) {
      const { queryXSpan: d, queryFeature: A } = c, C = A.getLocus(), y = d.start - h, k = Math.round(a.xWidthToBases(y));
      if (k >= 1) {
        const B = $E(C, l) ? `${Vi(k)} gap` : void 0;
        o.push(In.makeGap(k, B));
      }
      o.push(A), h = d.end, l = C;
    }
    const v = Math.round(a.xWidthToBases(t - h));
    return v > 0 && o.push(In.makeGap(v)), new na(new In("", o));
  }
  _placeInternalLoci(n, t, a, s, o) {
    const h = [];
    if (s)
      for (const l of t) {
        const v = l.start - n.start, c = o.basesToXWidth(v), d = a.end - c, A = o.basesToXWidth(l.getLength()), C = d < a.end ? d : a.end, y = d - A > a.start ? d - A : a.start;
        h.push(new Re(y, C));
      }
    else
      for (const l of t) {
        const v = l.start - n.start, c = o.basesToXWidth(v), d = a.start + c, A = o.basesToXWidth(l.getLength()), C = d > a.start ? d : a.start, y = d + A < a.end ? d + A : a.end;
        h.push(new Re(C, y));
      }
    return h;
  }
}
class Rf {
  constructor(n = 0) {
    be(this, "leftExtent");
    be(this, "rightExtent");
    be(this, "margin");
    be(this, "_placements");
    this.leftExtent = 1 / 0, this.rightExtent = -1 / 0, this.margin = n, this._placements = [];
  }
  place(n) {
    let t = n;
    if (this._placements.some(
      (a) => a.getOverlap(n) != null
    )) {
      const a = 0.5 * (n.start + n.end);
      t = Math.abs(a - this.leftExtent) < Math.abs(a - this.rightExtent) ? new Re(
        this.leftExtent - n.getLength(),
        this.leftExtent
      ) : new Re(
        this.rightExtent,
        this.rightExtent + n.getLength()
      );
    }
    return this._placements.push(t), t.start < this.leftExtent && (this.leftExtent = t.start - this.margin), t.end > this.rightExtent && (this.rightExtent = t.end + this.margin), t;
  }
  retrievePlacements() {
    return this._placements;
  }
}
function TE(e) {
  const n = qt.sumBy(
    e,
    (a) => 0.5 * a.getLength() * (a.start + a.end)
  ), t = qt.sumBy(e, (a) => a.getLength());
  return n / t;
}
function $E(e, n) {
  return e.chr !== n.chr ? !1 : e.end === n.start || n.end === e.start;
}
class RE {
}
class NE {
  constructor() {
    this.signals = /* @__PURE__ */ new Set(), this.abortController = new AbortController();
  }
  /**
   * @param {AbortSignal} [signal] optional AbortSignal to add. if falsy,
   *  will be treated as a null-signal, and this abortcontroller will no
   *  longer be abortable.
   */
  //@ts-ignore
  addSignal(n = new RE()) {
    if (this.signal.aborted)
      throw new Error("cannot add a signal, already aborted!");
    this.signals.add(n), n.aborted ? this.handleAborted(n) : typeof n.addEventListener == "function" && n.addEventListener("abort", () => {
      this.handleAborted(n);
    });
  }
  handleAborted(n) {
    this.signals.delete(n), this.signals.size === 0 && this.abortController.abort();
  }
  get signal() {
    return this.abortController.signal;
  }
  abort() {
    this.abortController.abort();
  }
}
class LE {
  constructor() {
    this.callbacks = /* @__PURE__ */ new Set();
  }
  addCallback(n = () => {
  }) {
    this.callbacks.add(n), n(this.currentMessage);
  }
  callback(n) {
    this.currentMessage = n;
    for (const t of this.callbacks)
      t(n);
  }
}
class Ya {
  constructor({ fill: n, cache: t }) {
    if (typeof n != "function")
      throw new TypeError("must pass a fill function");
    if (typeof t != "object")
      throw new TypeError("must pass a cache object");
    if (typeof t.get != "function" || typeof t.set != "function" || typeof t.delete != "function")
      throw new TypeError("cache must implement get(key), set(key, val), and and delete(key)");
    this.cache = t, this.fillCallback = n;
  }
  static isAbortException(n) {
    return (
      // DOMException
      n.name === "AbortError" || // standard-ish non-DOM abort exception
      //@ts-ignore
      n.code === "ERR_ABORTED" || // stringified DOMException
      n.message === "AbortError: aborted" || // stringified standard-ish exception
      n.message === "Error: aborted"
    );
  }
  evict(n, t) {
    this.cache.get(n) === t && this.cache.delete(n);
  }
  fill(n, t, a, s) {
    const o = new NE(), h = new LE();
    h.addCallback(s);
    const l = {
      aborter: o,
      promise: this.fillCallback(t, o.signal, (v) => {
        h.callback(v);
      }),
      settled: !1,
      statusReporter: h,
      get aborted() {
        return this.aborter.signal.aborted;
      }
    };
    l.aborter.addSignal(a), l.aborter.signal.addEventListener("abort", () => {
      l.settled || this.evict(n, l);
    }), l.promise.then(() => {
      l.settled = !0;
    }, () => {
      l.settled = !0, this.evict(n, l);
    }).catch((v) => {
      throw console.error(v), v;
    }), this.cache.set(n, l);
  }
  static checkSinglePromise(n, t) {
    function a() {
      if (t != null && t.aborted)
        throw Object.assign(new Error("aborted"), { code: "ERR_ABORTED" });
    }
    return n.then((s) => (a(), s), (s) => {
      throw a(), s;
    });
  }
  has(n) {
    return this.cache.has(n);
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
  get(n, t, a, s) {
    if (!a && t instanceof AbortSignal)
      throw new TypeError("second get argument appears to be an AbortSignal, perhaps you meant to pass `null` for the fill data?");
    const o = this.cache.get(n);
    return o ? o.aborted && !o.settled ? (this.evict(n, o), this.get(n, t, a, s)) : o.settled ? o.promise : (o.aborter.addSignal(a), o.statusReporter.addCallback(s), Ya.checkSinglePromise(o.promise, a)) : (this.fill(n, t, a, s), Ya.checkSinglePromise(
      //see https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#non-null-assertion-operator-postfix-
      this.cache.get(n).promise,
      a
    ));
  }
  /**
   * delete the given entry from the cache. if it exists and its fill request has
   * not yet settled, the fill will be signaled to abort.
   *
   * @param {any} key
   */
  delete(n) {
    const t = this.cache.get(n);
    t && (t.settled || t.aborter.abort(), this.cache.delete(n));
  }
  /**
   * Clear all requests from the cache. Aborts any that have not settled.
   * @returns {number} count of entries deleted
   */
  clear() {
    const n = this.cache.keys();
    let t = 0;
    for (let a = n.next(); !a.done; a = n.next())
      this.delete(a.value), t += 1;
    return t;
  }
}
class OE {
  constructor(n = {}) {
    if (!(n.maxSize && n.maxSize > 0))
      throw new TypeError("`maxSize` must be a number greater than 0");
    this.maxSize = n.maxSize, this.cache = /* @__PURE__ */ new Map(), this.oldCache = /* @__PURE__ */ new Map(), this._size = 0;
  }
  _set(n, t) {
    this.cache.set(n, t), this._size++, this._size >= this.maxSize && (this._size = 0, this.oldCache = this.cache, this.cache = /* @__PURE__ */ new Map());
  }
  get(n) {
    if (this.cache.has(n))
      return this.cache.get(n);
    if (this.oldCache.has(n)) {
      const t = this.oldCache.get(n);
      return this.oldCache.delete(n), this._set(n, t), t;
    }
  }
  set(n, t) {
    return this.cache.has(n) ? this.cache.set(n, t) : this._set(n, t), this;
  }
  has(n) {
    return this.cache.has(n) || this.oldCache.has(n);
  }
  peek(n) {
    if (this.cache.has(n))
      return this.cache.get(n);
    if (this.oldCache.has(n))
      return this.oldCache.get(n);
  }
  delete(n) {
    const t = this.cache.delete(n);
    return t && this._size--, this.oldCache.delete(n) || t;
  }
  clear() {
    this.cache.clear(), this.oldCache.clear(), this._size = 0;
  }
  *keys() {
    for (const [n] of this)
      yield n;
  }
  *values() {
    for (const [, n] of this)
      yield n;
  }
  *[Symbol.iterator]() {
    for (const n of this.cache)
      yield n;
    for (const n of this.oldCache) {
      const [t] = n;
      this.cache.has(t) || (yield n);
    }
  }
  get size() {
    let n = 0;
    for (const t of this.oldCache.keys())
      this.cache.has(t) || n++;
    return this._size + n;
  }
}
var PE = OE, j1 = /* @__PURE__ */ Jo(PE), Jn = {}, ns = {};
ns.byteLength = zE;
ns.toByteArray = qE;
ns.fromByteArray = WE;
var qn = [], dn = [], UE = typeof Uint8Array < "u" ? Uint8Array : Array, Nf = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
for (var Mi = 0, ME = Nf.length; Mi < ME; ++Mi)
  qn[Mi] = Nf[Mi], dn[Nf.charCodeAt(Mi)] = Mi;
dn[45] = 62;
dn[95] = 63;
function ep(e) {
  var n = e.length;
  if (n % 4 > 0)
    throw new Error("Invalid string. Length must be a multiple of 4");
  var t = e.indexOf("=");
  t === -1 && (t = n);
  var a = t === n ? 0 : 4 - t % 4;
  return [t, a];
}
function zE(e) {
  var n = ep(e), t = n[0], a = n[1];
  return (t + a) * 3 / 4 - a;
}
function ZE(e, n, t) {
  return (n + t) * 3 / 4 - t;
}
function qE(e) {
  var n, t = ep(e), a = t[0], s = t[1], o = new UE(ZE(e, a, s)), h = 0, l = s > 0 ? a - 4 : a, v;
  for (v = 0; v < l; v += 4)
    n = dn[e.charCodeAt(v)] << 18 | dn[e.charCodeAt(v + 1)] << 12 | dn[e.charCodeAt(v + 2)] << 6 | dn[e.charCodeAt(v + 3)], o[h++] = n >> 16 & 255, o[h++] = n >> 8 & 255, o[h++] = n & 255;
  return s === 2 && (n = dn[e.charCodeAt(v)] << 2 | dn[e.charCodeAt(v + 1)] >> 4, o[h++] = n & 255), s === 1 && (n = dn[e.charCodeAt(v)] << 10 | dn[e.charCodeAt(v + 1)] << 4 | dn[e.charCodeAt(v + 2)] >> 2, o[h++] = n >> 8 & 255, o[h++] = n & 255), o;
}
function HE(e) {
  return qn[e >> 18 & 63] + qn[e >> 12 & 63] + qn[e >> 6 & 63] + qn[e & 63];
}
function GE(e, n, t) {
  for (var a, s = [], o = n; o < t; o += 3)
    a = (e[o] << 16 & 16711680) + (e[o + 1] << 8 & 65280) + (e[o + 2] & 255), s.push(HE(a));
  return s.join("");
}
function WE(e) {
  for (var n, t = e.length, a = t % 3, s = [], o = 16383, h = 0, l = t - a; h < l; h += o)
    s.push(GE(e, h, h + o > l ? l : h + o));
  return a === 1 ? (n = e[t - 1], s.push(
    qn[n >> 2] + qn[n << 4 & 63] + "=="
  )) : a === 2 && (n = (e[t - 2] << 8) + e[t - 1], s.push(
    qn[n >> 10] + qn[n >> 4 & 63] + qn[n << 2 & 63] + "="
  )), s.join("");
}
var Yl = {};
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
Yl.read = function(e, n, t, a, s) {
  var o, h, l = s * 8 - a - 1, v = (1 << l) - 1, c = v >> 1, d = -7, A = t ? s - 1 : 0, C = t ? -1 : 1, y = e[n + A];
  for (A += C, o = y & (1 << -d) - 1, y >>= -d, d += l; d > 0; o = o * 256 + e[n + A], A += C, d -= 8)
    ;
  for (h = o & (1 << -d) - 1, o >>= -d, d += a; d > 0; h = h * 256 + e[n + A], A += C, d -= 8)
    ;
  if (o === 0)
    o = 1 - c;
  else {
    if (o === v)
      return h ? NaN : (y ? -1 : 1) * (1 / 0);
    h = h + Math.pow(2, a), o = o - c;
  }
  return (y ? -1 : 1) * h * Math.pow(2, o - a);
};
Yl.write = function(e, n, t, a, s, o) {
  var h, l, v, c = o * 8 - s - 1, d = (1 << c) - 1, A = d >> 1, C = s === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, y = a ? 0 : o - 1, k = a ? 1 : -1, B = n < 0 || n === 0 && 1 / n < 0 ? 1 : 0;
  for (n = Math.abs(n), isNaN(n) || n === 1 / 0 ? (l = isNaN(n) ? 1 : 0, h = d) : (h = Math.floor(Math.log(n) / Math.LN2), n * (v = Math.pow(2, -h)) < 1 && (h--, v *= 2), h + A >= 1 ? n += C / v : n += C * Math.pow(2, 1 - A), n * v >= 2 && (h++, v /= 2), h + A >= d ? (l = 0, h = d) : h + A >= 1 ? (l = (n * v - 1) * Math.pow(2, s), h = h + A) : (l = n * Math.pow(2, A - 1) * Math.pow(2, s), h = 0)); s >= 8; e[t + y] = l & 255, y += k, l /= 256, s -= 8)
    ;
  for (h = h << s | l, c += s; c > 0; e[t + y] = h & 255, y += k, h /= 256, c -= 8)
    ;
  e[t + y - k] |= B * 128;
};
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
(function(e) {
  const n = ns, t = Yl, a = typeof Symbol == "function" && typeof Symbol.for == "function" ? Symbol.for("nodejs.util.inspect.custom") : null;
  e.Buffer = l, e.SlowBuffer = Z, e.INSPECT_MAX_BYTES = 50;
  const s = 2147483647;
  e.kMaxLength = s, l.TYPED_ARRAY_SUPPORT = o(), !l.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error(
    "This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."
  );
  function o() {
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
    if (m > s)
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
      return A(m);
    }
    return v(m, _, w);
  }
  l.poolSize = 8192;
  function v(m, _, w) {
    if (typeof m == "string")
      return C(m, _);
    if (ArrayBuffer.isView(m))
      return k(m);
    if (m == null)
      throw new TypeError(
        "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof m
      );
    if (yt(m, ArrayBuffer) || m && yt(m.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (yt(m, SharedArrayBuffer) || m && yt(m.buffer, SharedArrayBuffer)))
      return B(m, _, w);
    if (typeof m == "number")
      throw new TypeError(
        'The "value" argument must not be of type number. Received type number'
      );
    const F = m.valueOf && m.valueOf();
    if (F != null && F !== m)
      return l.from(F, _, w);
    const R = P(m);
    if (R) return R;
    if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof m[Symbol.toPrimitive] == "function")
      return l.from(m[Symbol.toPrimitive]("string"), _, w);
    throw new TypeError(
      "The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof m
    );
  }
  l.from = function(m, _, w) {
    return v(m, _, w);
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
  function A(m) {
    return c(m), h(m < 0 ? 0 : T(m) | 0);
  }
  l.allocUnsafe = function(m) {
    return A(m);
  }, l.allocUnsafeSlow = function(m) {
    return A(m);
  };
  function C(m, _) {
    if ((typeof _ != "string" || _ === "") && (_ = "utf8"), !l.isEncoding(_))
      throw new TypeError("Unknown encoding: " + _);
    const w = U(m, _) | 0;
    let F = h(w);
    const R = F.write(m, _);
    return R !== w && (F = F.slice(0, R)), F;
  }
  function y(m) {
    const _ = m.length < 0 ? 0 : T(m.length) | 0, w = h(_);
    for (let F = 0; F < _; F += 1)
      w[F] = m[F] & 255;
    return w;
  }
  function k(m) {
    if (yt(m, Uint8Array)) {
      const _ = new Uint8Array(m);
      return B(_.buffer, _.byteOffset, _.byteLength);
    }
    return y(m);
  }
  function B(m, _, w) {
    if (_ < 0 || m.byteLength < _)
      throw new RangeError('"offset" is outside of buffer bounds');
    if (m.byteLength < _ + (w || 0))
      throw new RangeError('"length" is outside of buffer bounds');
    let F;
    return _ === void 0 && w === void 0 ? F = new Uint8Array(m) : w === void 0 ? F = new Uint8Array(m, _) : F = new Uint8Array(m, _, w), Object.setPrototypeOf(F, l.prototype), F;
  }
  function P(m) {
    if (l.isBuffer(m)) {
      const _ = T(m.length) | 0, w = h(_);
      return w.length === 0 || m.copy(w, 0, 0, _), w;
    }
    if (m.length !== void 0)
      return typeof m.length != "number" || yr(m.length) ? h(0) : y(m);
    if (m.type === "Buffer" && Array.isArray(m.data))
      return y(m.data);
  }
  function T(m) {
    if (m >= s)
      throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + s.toString(16) + " bytes");
    return m | 0;
  }
  function Z(m) {
    return +m != m && (m = 0), l.alloc(+m);
  }
  l.isBuffer = function(_) {
    return _ != null && _._isBuffer === !0 && _ !== l.prototype;
  }, l.compare = function(_, w) {
    if (yt(_, Uint8Array) && (_ = l.from(_, _.offset, _.byteLength)), yt(w, Uint8Array) && (w = l.from(w, w.offset, w.byteLength)), !l.isBuffer(_) || !l.isBuffer(w))
      throw new TypeError(
        'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
      );
    if (_ === w) return 0;
    let F = _.length, R = w.length;
    for (let M = 0, W = Math.min(F, R); M < W; ++M)
      if (_[M] !== w[M]) {
        F = _[M], R = w[M];
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
    let M = 0;
    for (F = 0; F < _.length; ++F) {
      let W = _[F];
      if (yt(W, Uint8Array))
        M + W.length > R.length ? (l.isBuffer(W) || (W = l.from(W)), W.copy(R, M)) : Uint8Array.prototype.set.call(
          R,
          W,
          M
        );
      else if (l.isBuffer(W))
        W.copy(R, M);
      else
        throw new TypeError('"list" argument must be an Array of Buffers');
      M += W.length;
    }
    return R;
  };
  function U(m, _) {
    if (l.isBuffer(m))
      return m.length;
    if (ArrayBuffer.isView(m) || yt(m, ArrayBuffer))
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
          return Gt(m).length;
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return w * 2;
        case "hex":
          return w >>> 1;
        case "base64":
          return mr(m).length;
        default:
          if (R)
            return F ? -1 : Gt(m).length;
          _ = ("" + _).toLowerCase(), R = !0;
      }
  }
  l.byteLength = U;
  function $(m, _, w) {
    let F = !1;
    if ((_ === void 0 || _ < 0) && (_ = 0), _ > this.length || ((w === void 0 || w > this.length) && (w = this.length), w <= 0) || (w >>>= 0, _ >>>= 0, w <= _))
      return "";
    for (m || (m = "utf8"); ; )
      switch (m) {
        case "hex":
          return Nn(this, _, w);
        case "utf8":
        case "utf-8":
          return ve(this, _, w);
        case "ascii":
          return ce(this, _, w);
        case "latin1":
        case "binary":
          return Be(this, _, w);
        case "base64":
          return Ce(this, _, w);
        case "ucs2":
        case "ucs-2":
        case "utf16le":
        case "utf-16le":
          return xt(this, _, w);
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
    return _ === 0 ? "" : arguments.length === 0 ? ve(this, 0, _) : $.apply(this, arguments);
  }, l.prototype.toLocaleString = l.prototype.toString, l.prototype.equals = function(_) {
    if (!l.isBuffer(_)) throw new TypeError("Argument must be a Buffer");
    return this === _ ? !0 : l.compare(this, _) === 0;
  }, l.prototype.inspect = function() {
    let _ = "";
    const w = e.INSPECT_MAX_BYTES;
    return _ = this.toString("hex", 0, w).replace(/(.{2})/g, "$1 ").trim(), this.length > w && (_ += " ... "), "<Buffer " + _ + ">";
  }, a && (l.prototype[a] = l.prototype.inspect), l.prototype.compare = function(_, w, F, R, M) {
    if (yt(_, Uint8Array) && (_ = l.from(_, _.offset, _.byteLength)), !l.isBuffer(_))
      throw new TypeError(
        'The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof _
      );
    if (w === void 0 && (w = 0), F === void 0 && (F = _ ? _.length : 0), R === void 0 && (R = 0), M === void 0 && (M = this.length), w < 0 || F > _.length || R < 0 || M > this.length)
      throw new RangeError("out of range index");
    if (R >= M && w >= F)
      return 0;
    if (R >= M)
      return -1;
    if (w >= F)
      return 1;
    if (w >>>= 0, F >>>= 0, R >>>= 0, M >>>= 0, this === _) return 0;
    let W = M - R, de = F - w;
    const Ze = Math.min(W, de), Pe = this.slice(R, M), qe = _.slice(w, F);
    for (let Ne = 0; Ne < Ze; ++Ne)
      if (Pe[Ne] !== qe[Ne]) {
        W = Pe[Ne], de = qe[Ne];
        break;
      }
    return W < de ? -1 : de < W ? 1 : 0;
  };
  function Q(m, _, w, F, R) {
    if (m.length === 0) return -1;
    if (typeof w == "string" ? (F = w, w = 0) : w > 2147483647 ? w = 2147483647 : w < -2147483648 && (w = -2147483648), w = +w, yr(w) && (w = R ? 0 : m.length - 1), w < 0 && (w = m.length + w), w >= m.length) {
      if (R) return -1;
      w = m.length - 1;
    } else if (w < 0)
      if (R) w = 0;
      else return -1;
    if (typeof _ == "string" && (_ = l.from(_, F)), l.isBuffer(_))
      return _.length === 0 ? -1 : q(m, _, w, F, R);
    if (typeof _ == "number")
      return _ = _ & 255, typeof Uint8Array.prototype.indexOf == "function" ? R ? Uint8Array.prototype.indexOf.call(m, _, w) : Uint8Array.prototype.lastIndexOf.call(m, _, w) : q(m, [_], w, F, R);
    throw new TypeError("val must be string, number or Buffer");
  }
  function q(m, _, w, F, R) {
    let M = 1, W = m.length, de = _.length;
    if (F !== void 0 && (F = String(F).toLowerCase(), F === "ucs2" || F === "ucs-2" || F === "utf16le" || F === "utf-16le")) {
      if (m.length < 2 || _.length < 2)
        return -1;
      M = 2, W /= 2, de /= 2, w /= 2;
    }
    function Ze(qe, Ne) {
      return M === 1 ? qe[Ne] : qe.readUInt16BE(Ne * M);
    }
    let Pe;
    if (R) {
      let qe = -1;
      for (Pe = w; Pe < W; Pe++)
        if (Ze(m, Pe) === Ze(_, qe === -1 ? 0 : Pe - qe)) {
          if (qe === -1 && (qe = Pe), Pe - qe + 1 === de) return qe * M;
        } else
          qe !== -1 && (Pe -= Pe - qe), qe = -1;
    } else
      for (w + de > W && (w = W - de), Pe = w; Pe >= 0; Pe--) {
        let qe = !0;
        for (let Ne = 0; Ne < de; Ne++)
          if (Ze(m, Pe + Ne) !== Ze(_, Ne)) {
            qe = !1;
            break;
          }
        if (qe) return Pe;
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
  function G(m, _, w, F) {
    w = Number(w) || 0;
    const R = m.length - w;
    F ? (F = Number(F), F > R && (F = R)) : F = R;
    const M = _.length;
    F > M / 2 && (F = M / 2);
    let W;
    for (W = 0; W < F; ++W) {
      const de = parseInt(_.substr(W * 2, 2), 16);
      if (yr(de)) return W;
      m[w + W] = de;
    }
    return W;
  }
  function J(m, _, w, F) {
    return mt(Gt(_, m.length - w), m, w, F);
  }
  function ee(m, _, w, F) {
    return mt(Au(_), m, w, F);
  }
  function K(m, _, w, F) {
    return mt(mr(_), m, w, F);
  }
  function ie(m, _, w, F) {
    return mt(hs(_, m.length - w), m, w, F);
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
    const M = this.length - w;
    if ((F === void 0 || F > M) && (F = M), _.length > 0 && (F < 0 || w < 0) || w > this.length)
      throw new RangeError("Attempt to write outside buffer bounds");
    R || (R = "utf8");
    let W = !1;
    for (; ; )
      switch (R) {
        case "hex":
          return G(this, _, w, F);
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
          if (W) throw new TypeError("Unknown encoding: " + R);
          R = ("" + R).toLowerCase(), W = !0;
      }
  }, l.prototype.toJSON = function() {
    return {
      type: "Buffer",
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };
  function Ce(m, _, w) {
    return _ === 0 && w === m.length ? n.fromByteArray(m) : n.fromByteArray(m.slice(_, w));
  }
  function ve(m, _, w) {
    w = Math.min(m.length, w);
    const F = [];
    let R = _;
    for (; R < w; ) {
      const M = m[R];
      let W = null, de = M > 239 ? 4 : M > 223 ? 3 : M > 191 ? 2 : 1;
      if (R + de <= w) {
        let Ze, Pe, qe, Ne;
        switch (de) {
          case 1:
            M < 128 && (W = M);
            break;
          case 2:
            Ze = m[R + 1], (Ze & 192) === 128 && (Ne = (M & 31) << 6 | Ze & 63, Ne > 127 && (W = Ne));
            break;
          case 3:
            Ze = m[R + 1], Pe = m[R + 2], (Ze & 192) === 128 && (Pe & 192) === 128 && (Ne = (M & 15) << 12 | (Ze & 63) << 6 | Pe & 63, Ne > 2047 && (Ne < 55296 || Ne > 57343) && (W = Ne));
            break;
          case 4:
            Ze = m[R + 1], Pe = m[R + 2], qe = m[R + 3], (Ze & 192) === 128 && (Pe & 192) === 128 && (qe & 192) === 128 && (Ne = (M & 15) << 18 | (Ze & 63) << 12 | (Pe & 63) << 6 | qe & 63, Ne > 65535 && Ne < 1114112 && (W = Ne));
        }
      }
      W === null ? (W = 65533, de = 1) : W > 65535 && (W -= 65536, F.push(W >>> 10 & 1023 | 55296), W = 56320 | W & 1023), F.push(W), R += de;
    }
    return Oe(F);
  }
  const Me = 4096;
  function Oe(m) {
    const _ = m.length;
    if (_ <= Me)
      return String.fromCharCode.apply(String, m);
    let w = "", F = 0;
    for (; F < _; )
      w += String.fromCharCode.apply(
        String,
        m.slice(F, F += Me)
      );
    return w;
  }
  function ce(m, _, w) {
    let F = "";
    w = Math.min(m.length, w);
    for (let R = _; R < w; ++R)
      F += String.fromCharCode(m[R] & 127);
    return F;
  }
  function Be(m, _, w) {
    let F = "";
    w = Math.min(m.length, w);
    for (let R = _; R < w; ++R)
      F += String.fromCharCode(m[R]);
    return F;
  }
  function Nn(m, _, w) {
    const F = m.length;
    (!_ || _ < 0) && (_ = 0), (!w || w < 0 || w > F) && (w = F);
    let R = "";
    for (let M = _; M < w; ++M)
      R += cs[m[M]];
    return R;
  }
  function xt(m, _, w) {
    const F = m.slice(_, w);
    let R = "";
    for (let M = 0; M < F.length - 1; M += 2)
      R += String.fromCharCode(F[M] + F[M + 1] * 256);
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
    let R = this[_], M = 1, W = 0;
    for (; ++W < w && (M *= 256); )
      R += this[_ + W] * M;
    return R;
  }, l.prototype.readUintBE = l.prototype.readUIntBE = function(_, w, F) {
    _ = _ >>> 0, w = w >>> 0, F || me(_, w, this.length);
    let R = this[_ + --w], M = 1;
    for (; w > 0 && (M *= 256); )
      R += this[_ + --w] * M;
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
  }, l.prototype.readBigUInt64LE = Nt(function(_) {
    _ = _ >>> 0, rn(_, "offset");
    const w = this[_], F = this[_ + 7];
    (w === void 0 || F === void 0) && ot(_, this.length - 8);
    const R = w + this[++_] * 2 ** 8 + this[++_] * 2 ** 16 + this[++_] * 2 ** 24, M = this[++_] + this[++_] * 2 ** 8 + this[++_] * 2 ** 16 + F * 2 ** 24;
    return BigInt(R) + (BigInt(M) << BigInt(32));
  }), l.prototype.readBigUInt64BE = Nt(function(_) {
    _ = _ >>> 0, rn(_, "offset");
    const w = this[_], F = this[_ + 7];
    (w === void 0 || F === void 0) && ot(_, this.length - 8);
    const R = w * 2 ** 24 + this[++_] * 2 ** 16 + this[++_] * 2 ** 8 + this[++_], M = this[++_] * 2 ** 24 + this[++_] * 2 ** 16 + this[++_] * 2 ** 8 + F;
    return (BigInt(R) << BigInt(32)) + BigInt(M);
  }), l.prototype.readIntLE = function(_, w, F) {
    _ = _ >>> 0, w = w >>> 0, F || me(_, w, this.length);
    let R = this[_], M = 1, W = 0;
    for (; ++W < w && (M *= 256); )
      R += this[_ + W] * M;
    return M *= 128, R >= M && (R -= Math.pow(2, 8 * w)), R;
  }, l.prototype.readIntBE = function(_, w, F) {
    _ = _ >>> 0, w = w >>> 0, F || me(_, w, this.length);
    let R = w, M = 1, W = this[_ + --R];
    for (; R > 0 && (M *= 256); )
      W += this[_ + --R] * M;
    return M *= 128, W >= M && (W -= Math.pow(2, 8 * w)), W;
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
  }, l.prototype.readBigInt64LE = Nt(function(_) {
    _ = _ >>> 0, rn(_, "offset");
    const w = this[_], F = this[_ + 7];
    (w === void 0 || F === void 0) && ot(_, this.length - 8);
    const R = this[_ + 4] + this[_ + 5] * 2 ** 8 + this[_ + 6] * 2 ** 16 + (F << 24);
    return (BigInt(R) << BigInt(32)) + BigInt(w + this[++_] * 2 ** 8 + this[++_] * 2 ** 16 + this[++_] * 2 ** 24);
  }), l.prototype.readBigInt64BE = Nt(function(_) {
    _ = _ >>> 0, rn(_, "offset");
    const w = this[_], F = this[_ + 7];
    (w === void 0 || F === void 0) && ot(_, this.length - 8);
    const R = (w << 24) + // Overflow
    this[++_] * 2 ** 16 + this[++_] * 2 ** 8 + this[++_];
    return (BigInt(R) << BigInt(32)) + BigInt(this[++_] * 2 ** 24 + this[++_] * 2 ** 16 + this[++_] * 2 ** 8 + F);
  }), l.prototype.readFloatLE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 4, this.length), t.read(this, _, !0, 23, 4);
  }, l.prototype.readFloatBE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 4, this.length), t.read(this, _, !1, 23, 4);
  }, l.prototype.readDoubleLE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 8, this.length), t.read(this, _, !0, 52, 8);
  }, l.prototype.readDoubleBE = function(_, w) {
    return _ = _ >>> 0, w || me(_, 8, this.length), t.read(this, _, !1, 52, 8);
  };
  function nt(m, _, w, F, R, M) {
    if (!l.isBuffer(m)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (_ > R || _ < M) throw new RangeError('"value" argument is out of bounds');
    if (w + F > m.length) throw new RangeError("Index out of range");
  }
  l.prototype.writeUintLE = l.prototype.writeUIntLE = function(_, w, F, R) {
    if (_ = +_, w = w >>> 0, F = F >>> 0, !R) {
      const de = Math.pow(2, 8 * F) - 1;
      nt(this, _, w, F, de, 0);
    }
    let M = 1, W = 0;
    for (this[w] = _ & 255; ++W < F && (M *= 256); )
      this[w + W] = _ / M & 255;
    return w + F;
  }, l.prototype.writeUintBE = l.prototype.writeUIntBE = function(_, w, F, R) {
    if (_ = +_, w = w >>> 0, F = F >>> 0, !R) {
      const de = Math.pow(2, 8 * F) - 1;
      nt(this, _, w, F, de, 0);
    }
    let M = F - 1, W = 1;
    for (this[w + M] = _ & 255; --M >= 0 && (W *= 256); )
      this[w + M] = _ / W & 255;
    return w + F;
  }, l.prototype.writeUint8 = l.prototype.writeUInt8 = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || nt(this, _, w, 1, 255, 0), this[w] = _ & 255, w + 1;
  }, l.prototype.writeUint16LE = l.prototype.writeUInt16LE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || nt(this, _, w, 2, 65535, 0), this[w] = _ & 255, this[w + 1] = _ >>> 8, w + 2;
  }, l.prototype.writeUint16BE = l.prototype.writeUInt16BE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || nt(this, _, w, 2, 65535, 0), this[w] = _ >>> 8, this[w + 1] = _ & 255, w + 2;
  }, l.prototype.writeUint32LE = l.prototype.writeUInt32LE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || nt(this, _, w, 4, 4294967295, 0), this[w + 3] = _ >>> 24, this[w + 2] = _ >>> 16, this[w + 1] = _ >>> 8, this[w] = _ & 255, w + 4;
  }, l.prototype.writeUint32BE = l.prototype.writeUInt32BE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || nt(this, _, w, 4, 4294967295, 0), this[w] = _ >>> 24, this[w + 1] = _ >>> 16, this[w + 2] = _ >>> 8, this[w + 3] = _ & 255, w + 4;
  };
  function tn(m, _, w, F, R) {
    En(_, F, R, m, w, 7);
    let M = Number(_ & BigInt(4294967295));
    m[w++] = M, M = M >> 8, m[w++] = M, M = M >> 8, m[w++] = M, M = M >> 8, m[w++] = M;
    let W = Number(_ >> BigInt(32) & BigInt(4294967295));
    return m[w++] = W, W = W >> 8, m[w++] = W, W = W >> 8, m[w++] = W, W = W >> 8, m[w++] = W, w;
  }
  function ze(m, _, w, F, R) {
    En(_, F, R, m, w, 7);
    let M = Number(_ & BigInt(4294967295));
    m[w + 7] = M, M = M >> 8, m[w + 6] = M, M = M >> 8, m[w + 5] = M, M = M >> 8, m[w + 4] = M;
    let W = Number(_ >> BigInt(32) & BigInt(4294967295));
    return m[w + 3] = W, W = W >> 8, m[w + 2] = W, W = W >> 8, m[w + 1] = W, W = W >> 8, m[w] = W, w + 8;
  }
  l.prototype.writeBigUInt64LE = Nt(function(_, w = 0) {
    return tn(this, _, w, BigInt(0), BigInt("0xffffffffffffffff"));
  }), l.prototype.writeBigUInt64BE = Nt(function(_, w = 0) {
    return ze(this, _, w, BigInt(0), BigInt("0xffffffffffffffff"));
  }), l.prototype.writeIntLE = function(_, w, F, R) {
    if (_ = +_, w = w >>> 0, !R) {
      const Ze = Math.pow(2, 8 * F - 1);
      nt(this, _, w, F, Ze - 1, -Ze);
    }
    let M = 0, W = 1, de = 0;
    for (this[w] = _ & 255; ++M < F && (W *= 256); )
      _ < 0 && de === 0 && this[w + M - 1] !== 0 && (de = 1), this[w + M] = (_ / W >> 0) - de & 255;
    return w + F;
  }, l.prototype.writeIntBE = function(_, w, F, R) {
    if (_ = +_, w = w >>> 0, !R) {
      const Ze = Math.pow(2, 8 * F - 1);
      nt(this, _, w, F, Ze - 1, -Ze);
    }
    let M = F - 1, W = 1, de = 0;
    for (this[w + M] = _ & 255; --M >= 0 && (W *= 256); )
      _ < 0 && de === 0 && this[w + M + 1] !== 0 && (de = 1), this[w + M] = (_ / W >> 0) - de & 255;
    return w + F;
  }, l.prototype.writeInt8 = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || nt(this, _, w, 1, 127, -128), _ < 0 && (_ = 255 + _ + 1), this[w] = _ & 255, w + 1;
  }, l.prototype.writeInt16LE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || nt(this, _, w, 2, 32767, -32768), this[w] = _ & 255, this[w + 1] = _ >>> 8, w + 2;
  }, l.prototype.writeInt16BE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || nt(this, _, w, 2, 32767, -32768), this[w] = _ >>> 8, this[w + 1] = _ & 255, w + 2;
  }, l.prototype.writeInt32LE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || nt(this, _, w, 4, 2147483647, -2147483648), this[w] = _ & 255, this[w + 1] = _ >>> 8, this[w + 2] = _ >>> 16, this[w + 3] = _ >>> 24, w + 4;
  }, l.prototype.writeInt32BE = function(_, w, F) {
    return _ = +_, w = w >>> 0, F || nt(this, _, w, 4, 2147483647, -2147483648), _ < 0 && (_ = 4294967295 + _ + 1), this[w] = _ >>> 24, this[w + 1] = _ >>> 16, this[w + 2] = _ >>> 8, this[w + 3] = _ & 255, w + 4;
  }, l.prototype.writeBigInt64LE = Nt(function(_, w = 0) {
    return tn(this, _, w, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  }), l.prototype.writeBigInt64BE = Nt(function(_, w = 0) {
    return ze(this, _, w, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  });
  function At(m, _, w, F, R, M) {
    if (w + F > m.length) throw new RangeError("Index out of range");
    if (w < 0) throw new RangeError("Index out of range");
  }
  function nn(m, _, w, F, R) {
    return _ = +_, w = w >>> 0, R || At(m, _, w, 4), t.write(m, _, w, F, 23, 4), w + 4;
  }
  l.prototype.writeFloatLE = function(_, w, F) {
    return nn(this, _, w, !0, F);
  }, l.prototype.writeFloatBE = function(_, w, F) {
    return nn(this, _, w, !1, F);
  };
  function Dr(m, _, w, F, R) {
    return _ = +_, w = w >>> 0, R || At(m, _, w, 8), t.write(m, _, w, F, 52, 8), w + 8;
  }
  l.prototype.writeDoubleLE = function(_, w, F) {
    return Dr(this, _, w, !0, F);
  }, l.prototype.writeDoubleBE = function(_, w, F) {
    return Dr(this, _, w, !1, F);
  }, l.prototype.copy = function(_, w, F, R) {
    if (!l.isBuffer(_)) throw new TypeError("argument should be a Buffer");
    if (F || (F = 0), !R && R !== 0 && (R = this.length), w >= _.length && (w = _.length), w || (w = 0), R > 0 && R < F && (R = F), R === F || _.length === 0 || this.length === 0) return 0;
    if (w < 0)
      throw new RangeError("targetStart out of bounds");
    if (F < 0 || F >= this.length) throw new RangeError("Index out of range");
    if (R < 0) throw new RangeError("sourceEnd out of bounds");
    R > this.length && (R = this.length), _.length - w < R - F && (R = _.length - w + F);
    const M = R - F;
    return this === _ && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(w, F, R) : Uint8Array.prototype.set.call(
      _,
      this.subarray(F, R),
      w
    ), M;
  }, l.prototype.fill = function(_, w, F, R) {
    if (typeof _ == "string") {
      if (typeof w == "string" ? (R = w, w = 0, F = this.length) : typeof F == "string" && (R = F, F = this.length), R !== void 0 && typeof R != "string")
        throw new TypeError("encoding must be a string");
      if (typeof R == "string" && !l.isEncoding(R))
        throw new TypeError("Unknown encoding: " + R);
      if (_.length === 1) {
        const W = _.charCodeAt(0);
        (R === "utf8" && W < 128 || R === "latin1") && (_ = W);
      }
    } else typeof _ == "number" ? _ = _ & 255 : typeof _ == "boolean" && (_ = Number(_));
    if (w < 0 || this.length < w || this.length < F)
      throw new RangeError("Out of range index");
    if (F <= w)
      return this;
    w = w >>> 0, F = F === void 0 ? this.length : F >>> 0, _ || (_ = 0);
    let M;
    if (typeof _ == "number")
      for (M = w; M < F; ++M)
        this[M] = _;
    else {
      const W = l.isBuffer(_) ? _ : l.from(_, R), de = W.length;
      if (de === 0)
        throw new TypeError('The value "' + _ + '" is invalid for argument "value"');
      for (M = 0; M < F - w; ++M)
        this[M + w] = W[M % de];
    }
    return this;
  };
  const Dt = {};
  function Rt(m, _, w) {
    Dt[m] = class extends w {
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
  Rt(
    "ERR_BUFFER_OUT_OF_BOUNDS",
    function(m) {
      return m ? `${m} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
    },
    RangeError
  ), Rt(
    "ERR_INVALID_ARG_TYPE",
    function(m, _) {
      return `The "${m}" argument must be of type number. Received type ${typeof _}`;
    },
    TypeError
  ), Rt(
    "ERR_OUT_OF_RANGE",
    function(m, _, w) {
      let F = `The value of "${m}" is out of range.`, R = w;
      return Number.isInteger(w) && Math.abs(w) > 2 ** 32 ? R = Gr(String(w)) : typeof w == "bigint" && (R = String(w), (w > BigInt(2) ** BigInt(32) || w < -(BigInt(2) ** BigInt(32))) && (R = Gr(R)), R += "n"), F += ` It must be ${_}. Received ${R}`, F;
    },
    RangeError
  );
  function Gr(m) {
    let _ = "", w = m.length;
    const F = m[0] === "-" ? 1 : 0;
    for (; w >= F + 4; w -= 3)
      _ = `_${m.slice(w - 3, w)}${_}`;
    return `${m.slice(0, w)}${_}`;
  }
  function Ln(m, _, w) {
    rn(_, "offset"), (m[_] === void 0 || m[_ + w] === void 0) && ot(_, m.length - (w + 1));
  }
  function En(m, _, w, F, R, M) {
    if (m > w || m < _) {
      const W = typeof _ == "bigint" ? "n" : "";
      let de;
      throw _ === 0 || _ === BigInt(0) ? de = `>= 0${W} and < 2${W} ** ${(M + 1) * 8}${W}` : de = `>= -(2${W} ** ${(M + 1) * 8 - 1}${W}) and < 2 ** ${(M + 1) * 8 - 1}${W}`, new Dt.ERR_OUT_OF_RANGE("value", de, m);
    }
    Ln(F, R, M);
  }
  function rn(m, _) {
    if (typeof m != "number")
      throw new Dt.ERR_INVALID_ARG_TYPE(_, "number", m);
  }
  function ot(m, _, w) {
    throw Math.floor(m) !== m ? (rn(m, w), new Dt.ERR_OUT_OF_RANGE("offset", "an integer", m)) : _ < 0 ? new Dt.ERR_BUFFER_OUT_OF_BOUNDS() : new Dt.ERR_OUT_OF_RANGE(
      "offset",
      `>= 0 and <= ${_}`,
      m
    );
  }
  const er = /[^+/0-9A-Za-z-_]/g;
  function ls(m) {
    if (m = m.split("=")[0], m = m.trim().replace(er, ""), m.length < 2) return "";
    for (; m.length % 4 !== 0; )
      m = m + "=";
    return m;
  }
  function Gt(m, _) {
    _ = _ || 1 / 0;
    let w;
    const F = m.length;
    let R = null;
    const M = [];
    for (let W = 0; W < F; ++W) {
      if (w = m.charCodeAt(W), w > 55295 && w < 57344) {
        if (!R) {
          if (w > 56319) {
            (_ -= 3) > -1 && M.push(239, 191, 189);
            continue;
          } else if (W + 1 === F) {
            (_ -= 3) > -1 && M.push(239, 191, 189);
            continue;
          }
          R = w;
          continue;
        }
        if (w < 56320) {
          (_ -= 3) > -1 && M.push(239, 191, 189), R = w;
          continue;
        }
        w = (R - 55296 << 10 | w - 56320) + 65536;
      } else R && (_ -= 3) > -1 && M.push(239, 191, 189);
      if (R = null, w < 128) {
        if ((_ -= 1) < 0) break;
        M.push(w);
      } else if (w < 2048) {
        if ((_ -= 2) < 0) break;
        M.push(
          w >> 6 | 192,
          w & 63 | 128
        );
      } else if (w < 65536) {
        if ((_ -= 3) < 0) break;
        M.push(
          w >> 12 | 224,
          w >> 6 & 63 | 128,
          w & 63 | 128
        );
      } else if (w < 1114112) {
        if ((_ -= 4) < 0) break;
        M.push(
          w >> 18 | 240,
          w >> 12 & 63 | 128,
          w >> 6 & 63 | 128,
          w & 63 | 128
        );
      } else
        throw new Error("Invalid code point");
    }
    return M;
  }
  function Au(m) {
    const _ = [];
    for (let w = 0; w < m.length; ++w)
      _.push(m.charCodeAt(w) & 255);
    return _;
  }
  function hs(m, _) {
    let w, F, R;
    const M = [];
    for (let W = 0; W < m.length && !((_ -= 2) < 0); ++W)
      w = m.charCodeAt(W), F = w >> 8, R = w % 256, M.push(R), M.push(F);
    return M;
  }
  function mr(m) {
    return n.toByteArray(ls(m));
  }
  function mt(m, _, w, F) {
    let R;
    for (R = 0; R < F && !(R + w >= _.length || R >= m.length); ++R)
      _[R + w] = m[R];
    return R;
  }
  function yt(m, _) {
    return m instanceof _ || m != null && m.constructor != null && m.constructor.name != null && m.constructor.name === _.name;
  }
  function yr(m) {
    return m !== m;
  }
  const cs = function() {
    const m = "0123456789abcdef", _ = new Array(256);
    for (let w = 0; w < 16; ++w) {
      const F = w * 16;
      for (let R = 0; R < 16; ++R)
        _[F + R] = m[w] + m[R];
    }
    return _;
  }();
  function Nt(m) {
    return typeof BigInt > "u" ? ds : m;
  }
  function ds() {
    throw new Error("BigInt not supported");
  }
})(Jn);
var La = {};
function td(e) {
  return (typeof e == "object" && e !== null && "message" in e ? e.message : `${e}`).replace(/\.$/, "");
}
class wr {
  async getBufferFromResponse(n) {
    const t = await n.arrayBuffer();
    return Jn.Buffer.from(t);
  }
  constructor(n, t = {}) {
    this.baseOverrides = {}, this.url = n;
    const a = t.fetch || globalThis.fetch.bind(globalThis);
    if (!a)
      throw new TypeError("no fetch function supplied, and none found in global environment");
    t.overrides && (this.baseOverrides = t.overrides), this.fetchImplementation = a;
  }
  async fetch(n, t) {
    let a;
    try {
      a = await this.fetchImplementation(n, t);
    } catch (s) {
      if (`${s}`.includes("Failed to fetch")) {
        console.warn(`generic-filehandle: refetching ${n} to attempt to work around chrome CORS header caching bug`);
        try {
          a = await this.fetchImplementation(n, {
            ...t,
            cache: "reload"
          });
        } catch (o) {
          throw new Error(`${td(o)} fetching ${n}`, { cause: o });
        }
      } else
        throw new Error(`${td(s)} fetching ${n}`, { cause: s });
    }
    return a;
  }
  async read(n, t = 0, a, s = 0, o = {}) {
    const { headers: h = {}, signal: l, overrides: v = {} } = o;
    a < 1 / 0 ? h.range = `bytes=${s}-${s + a}` : a === 1 / 0 && s !== 0 && (h.range = `bytes=${s}-`);
    const c = await this.fetch(this.url, {
      ...this.baseOverrides,
      ...v,
      headers: {
        ...h,
        ...v.headers,
        ...this.baseOverrides.headers
      },
      method: "GET",
      redirect: "follow",
      mode: "cors",
      signal: l
    });
    if (!c.ok)
      throw new Error(`HTTP ${c.status} fetching ${this.url}`);
    if (c.status === 200 && s === 0 || c.status === 206) {
      const d = await this.getBufferFromResponse(c), A = d.copy(n, t, 0, Math.min(a, d.length)), C = c.headers.get("content-range"), y = /\/(\d+)$/.exec(C || "");
      return y != null && y[1] && (this._stat = { size: parseInt(y[1], 10) }), { bytesRead: A, buffer: n };
    }
    throw c.status === 200 ? new Error(`${this.url} fetch returned status 200, expected 206`) : new Error(`HTTP ${c.status} fetching ${this.url}`);
  }
  async readFile(n = {}) {
    let t, a;
    typeof n == "string" ? (t = n, a = {}) : (t = n.encoding, a = n, delete a.encoding);
    const { headers: s = {}, signal: o, overrides: h = {} } = a, l = await this.fetch(this.url, {
      headers: s,
      method: "GET",
      redirect: "follow",
      mode: "cors",
      signal: o,
      ...this.baseOverrides,
      ...h
    });
    if (l.status !== 200)
      throw new Error(`HTTP ${l.status} fetching ${this.url}`);
    if (t === "utf8")
      return l.text();
    if (t)
      throw new Error(`unsupported encoding: ${t}`);
    return this.getBufferFromResponse(l);
  }
  async stat() {
    if (!this._stat) {
      const n = Jn.Buffer.allocUnsafe(10);
      if (await this.read(n, 0, 10, 0), !this._stat)
        throw new Error(`unable to determine size of file at ${this.url}`);
    }
    return this._stat;
  }
  async close() {
  }
}
var vr = {};
(function(e) {
  var n = typeof Uint8Array < "u" && typeof Uint16Array < "u" && typeof Int32Array < "u";
  function t(o, h) {
    return Object.prototype.hasOwnProperty.call(o, h);
  }
  e.assign = function(o) {
    for (var h = Array.prototype.slice.call(arguments, 1); h.length; ) {
      var l = h.shift();
      if (l) {
        if (typeof l != "object")
          throw new TypeError(l + "must be non-object");
        for (var v in l)
          t(l, v) && (o[v] = l[v]);
      }
    }
    return o;
  }, e.shrinkBuf = function(o, h) {
    return o.length === h ? o : o.subarray ? o.subarray(0, h) : (o.length = h, o);
  };
  var a = {
    arraySet: function(o, h, l, v, c) {
      if (h.subarray && o.subarray) {
        o.set(h.subarray(l, l + v), c);
        return;
      }
      for (var d = 0; d < v; d++)
        o[c + d] = h[l + d];
    },
    // Join array of chunks to single array.
    flattenChunks: function(o) {
      var h, l, v, c, d, A;
      for (v = 0, h = 0, l = o.length; h < l; h++)
        v += o[h].length;
      for (A = new Uint8Array(v), c = 0, h = 0, l = o.length; h < l; h++)
        d = o[h], A.set(d, c), c += d.length;
      return A;
    }
  }, s = {
    arraySet: function(o, h, l, v, c) {
      for (var d = 0; d < v; d++)
        o[c + d] = h[l + d];
    },
    // Join array of chunks to single array.
    flattenChunks: function(o) {
      return [].concat.apply([], o);
    }
  };
  e.setTyped = function(o) {
    o ? (e.Buf8 = Uint8Array, e.Buf16 = Uint16Array, e.Buf32 = Int32Array, e.assign(e, a)) : (e.Buf8 = Array, e.Buf16 = Array, e.Buf32 = Array, e.assign(e, s));
  }, e.setTyped(n);
})(vr);
var bu = {}, jn = {}, sa = {}, VE = vr, XE = 4, nd = 0, rd = 1, KE = 2;
function fa(e) {
  for (var n = e.length; --n >= 0; )
    e[n] = 0;
}
var YE = 0, tp = 1, QE = 2, JE = 3, jE = 258, Ql = 29, vu = 256, Qa = vu + 1 + Ql, Yi = 30, Jl = 19, np = 2 * Qa + 1, oi = 15, Lf = 16, eC = 7, jl = 256, rp = 16, ip = 17, ap = 18, Dl = (
  /* extra bits for each length code */
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
), $o = (
  /* extra bits for each distance code */
  [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
), tC = (
  /* extra bits for each bit length code */
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7]
), up = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], nC = 512, dr = new Array((Qa + 2) * 2);
fa(dr);
var za = new Array(Yi * 2);
fa(za);
var Ja = new Array(nC);
fa(Ja);
var ja = new Array(jE - JE + 1);
fa(ja);
var eh = new Array(Ql);
fa(eh);
var qo = new Array(Yi);
fa(qo);
function Of(e, n, t, a, s) {
  this.static_tree = e, this.extra_bits = n, this.extra_base = t, this.elems = a, this.max_length = s, this.has_stree = e && e.length;
}
var op, sp, fp;
function Pf(e, n) {
  this.dyn_tree = e, this.max_code = 0, this.stat_desc = n;
}
function lp(e) {
  return e < 256 ? Ja[e] : Ja[256 + (e >>> 7)];
}
function eu(e, n) {
  e.pending_buf[e.pending++] = n & 255, e.pending_buf[e.pending++] = n >>> 8 & 255;
}
function Mt(e, n, t) {
  e.bi_valid > Lf - t ? (e.bi_buf |= n << e.bi_valid & 65535, eu(e, e.bi_buf), e.bi_buf = n >> Lf - e.bi_valid, e.bi_valid += t - Lf) : (e.bi_buf |= n << e.bi_valid & 65535, e.bi_valid += t);
}
function Hn(e, n, t) {
  Mt(
    e,
    t[n * 2],
    t[n * 2 + 1]
    /*.Len*/
  );
}
function hp(e, n) {
  var t = 0;
  do
    t |= e & 1, e >>>= 1, t <<= 1;
  while (--n > 0);
  return t >>> 1;
}
function rC(e) {
  e.bi_valid === 16 ? (eu(e, e.bi_buf), e.bi_buf = 0, e.bi_valid = 0) : e.bi_valid >= 8 && (e.pending_buf[e.pending++] = e.bi_buf & 255, e.bi_buf >>= 8, e.bi_valid -= 8);
}
function iC(e, n) {
  var t = n.dyn_tree, a = n.max_code, s = n.stat_desc.static_tree, o = n.stat_desc.has_stree, h = n.stat_desc.extra_bits, l = n.stat_desc.extra_base, v = n.stat_desc.max_length, c, d, A, C, y, k, B = 0;
  for (C = 0; C <= oi; C++)
    e.bl_count[C] = 0;
  for (t[e.heap[e.heap_max] * 2 + 1] = 0, c = e.heap_max + 1; c < np; c++)
    d = e.heap[c], C = t[t[d * 2 + 1] * 2 + 1] + 1, C > v && (C = v, B++), t[d * 2 + 1] = C, !(d > a) && (e.bl_count[C]++, y = 0, d >= l && (y = h[d - l]), k = t[d * 2], e.opt_len += k * (C + y), o && (e.static_len += k * (s[d * 2 + 1] + y)));
  if (B !== 0) {
    do {
      for (C = v - 1; e.bl_count[C] === 0; )
        C--;
      e.bl_count[C]--, e.bl_count[C + 1] += 2, e.bl_count[v]--, B -= 2;
    } while (B > 0);
    for (C = v; C !== 0; C--)
      for (d = e.bl_count[C]; d !== 0; )
        A = e.heap[--c], !(A > a) && (t[A * 2 + 1] !== C && (e.opt_len += (C - t[A * 2 + 1]) * t[A * 2], t[A * 2 + 1] = C), d--);
  }
}
function cp(e, n, t) {
  var a = new Array(oi + 1), s = 0, o, h;
  for (o = 1; o <= oi; o++)
    a[o] = s = s + t[o - 1] << 1;
  for (h = 0; h <= n; h++) {
    var l = e[h * 2 + 1];
    l !== 0 && (e[h * 2] = hp(a[l]++, l));
  }
}
function aC() {
  var e, n, t, a, s, o = new Array(oi + 1);
  for (t = 0, a = 0; a < Ql - 1; a++)
    for (eh[a] = t, e = 0; e < 1 << Dl[a]; e++)
      ja[t++] = a;
  for (ja[t - 1] = a, s = 0, a = 0; a < 16; a++)
    for (qo[a] = s, e = 0; e < 1 << $o[a]; e++)
      Ja[s++] = a;
  for (s >>= 7; a < Yi; a++)
    for (qo[a] = s << 7, e = 0; e < 1 << $o[a] - 7; e++)
      Ja[256 + s++] = a;
  for (n = 0; n <= oi; n++)
    o[n] = 0;
  for (e = 0; e <= 143; )
    dr[e * 2 + 1] = 8, e++, o[8]++;
  for (; e <= 255; )
    dr[e * 2 + 1] = 9, e++, o[9]++;
  for (; e <= 279; )
    dr[e * 2 + 1] = 7, e++, o[7]++;
  for (; e <= 287; )
    dr[e * 2 + 1] = 8, e++, o[8]++;
  for (cp(dr, Qa + 1, o), e = 0; e < Yi; e++)
    za[e * 2 + 1] = 5, za[e * 2] = hp(e, 5);
  op = new Of(dr, Dl, vu + 1, Qa, oi), sp = new Of(za, $o, 0, Yi, oi), fp = new Of(new Array(0), tC, 0, Jl, eC);
}
function dp(e) {
  var n;
  for (n = 0; n < Qa; n++)
    e.dyn_ltree[n * 2] = 0;
  for (n = 0; n < Yi; n++)
    e.dyn_dtree[n * 2] = 0;
  for (n = 0; n < Jl; n++)
    e.bl_tree[n * 2] = 0;
  e.dyn_ltree[jl * 2] = 1, e.opt_len = e.static_len = 0, e.last_lit = e.matches = 0;
}
function pp(e) {
  e.bi_valid > 8 ? eu(e, e.bi_buf) : e.bi_valid > 0 && (e.pending_buf[e.pending++] = e.bi_buf), e.bi_buf = 0, e.bi_valid = 0;
}
function uC(e, n, t, a) {
  pp(e), eu(e, t), eu(e, ~t), VE.arraySet(e.pending_buf, e.window, n, t, e.pending), e.pending += t;
}
function id(e, n, t, a) {
  var s = n * 2, o = t * 2;
  return e[s] < e[o] || e[s] === e[o] && a[n] <= a[t];
}
function Uf(e, n, t) {
  for (var a = e.heap[t], s = t << 1; s <= e.heap_len && (s < e.heap_len && id(n, e.heap[s + 1], e.heap[s], e.depth) && s++, !id(n, a, e.heap[s], e.depth)); )
    e.heap[t] = e.heap[s], t = s, s <<= 1;
  e.heap[t] = a;
}
function ad(e, n, t) {
  var a, s, o = 0, h, l;
  if (e.last_lit !== 0)
    do
      a = e.pending_buf[e.d_buf + o * 2] << 8 | e.pending_buf[e.d_buf + o * 2 + 1], s = e.pending_buf[e.l_buf + o], o++, a === 0 ? Hn(e, s, n) : (h = ja[s], Hn(e, h + vu + 1, n), l = Dl[h], l !== 0 && (s -= eh[h], Mt(e, s, l)), a--, h = lp(a), Hn(e, h, t), l = $o[h], l !== 0 && (a -= qo[h], Mt(e, a, l)));
    while (o < e.last_lit);
  Hn(e, jl, n);
}
function ml(e, n) {
  var t = n.dyn_tree, a = n.stat_desc.static_tree, s = n.stat_desc.has_stree, o = n.stat_desc.elems, h, l, v = -1, c;
  for (e.heap_len = 0, e.heap_max = np, h = 0; h < o; h++)
    t[h * 2] !== 0 ? (e.heap[++e.heap_len] = v = h, e.depth[h] = 0) : t[h * 2 + 1] = 0;
  for (; e.heap_len < 2; )
    c = e.heap[++e.heap_len] = v < 2 ? ++v : 0, t[c * 2] = 1, e.depth[c] = 0, e.opt_len--, s && (e.static_len -= a[c * 2 + 1]);
  for (n.max_code = v, h = e.heap_len >> 1; h >= 1; h--)
    Uf(e, t, h);
  c = o;
  do
    h = e.heap[
      1
      /*SMALLEST*/
    ], e.heap[
      1
      /*SMALLEST*/
    ] = e.heap[e.heap_len--], Uf(
      e,
      t,
      1
      /*SMALLEST*/
    ), l = e.heap[
      1
      /*SMALLEST*/
    ], e.heap[--e.heap_max] = h, e.heap[--e.heap_max] = l, t[c * 2] = t[h * 2] + t[l * 2], e.depth[c] = (e.depth[h] >= e.depth[l] ? e.depth[h] : e.depth[l]) + 1, t[h * 2 + 1] = t[l * 2 + 1] = c, e.heap[
      1
      /*SMALLEST*/
    ] = c++, Uf(
      e,
      t,
      1
      /*SMALLEST*/
    );
  while (e.heap_len >= 2);
  e.heap[--e.heap_max] = e.heap[
    1
    /*SMALLEST*/
  ], iC(e, n), cp(t, v, e.bl_count);
}
function ud(e, n, t) {
  var a, s = -1, o, h = n[0 * 2 + 1], l = 0, v = 7, c = 4;
  for (h === 0 && (v = 138, c = 3), n[(t + 1) * 2 + 1] = 65535, a = 0; a <= t; a++)
    o = h, h = n[(a + 1) * 2 + 1], !(++l < v && o === h) && (l < c ? e.bl_tree[o * 2] += l : o !== 0 ? (o !== s && e.bl_tree[o * 2]++, e.bl_tree[rp * 2]++) : l <= 10 ? e.bl_tree[ip * 2]++ : e.bl_tree[ap * 2]++, l = 0, s = o, h === 0 ? (v = 138, c = 3) : o === h ? (v = 6, c = 3) : (v = 7, c = 4));
}
function od(e, n, t) {
  var a, s = -1, o, h = n[0 * 2 + 1], l = 0, v = 7, c = 4;
  for (h === 0 && (v = 138, c = 3), a = 0; a <= t; a++)
    if (o = h, h = n[(a + 1) * 2 + 1], !(++l < v && o === h)) {
      if (l < c)
        do
          Hn(e, o, e.bl_tree);
        while (--l !== 0);
      else o !== 0 ? (o !== s && (Hn(e, o, e.bl_tree), l--), Hn(e, rp, e.bl_tree), Mt(e, l - 3, 2)) : l <= 10 ? (Hn(e, ip, e.bl_tree), Mt(e, l - 3, 3)) : (Hn(e, ap, e.bl_tree), Mt(e, l - 11, 7));
      l = 0, s = o, h === 0 ? (v = 138, c = 3) : o === h ? (v = 6, c = 3) : (v = 7, c = 4);
    }
}
function oC(e) {
  var n;
  for (ud(e, e.dyn_ltree, e.l_desc.max_code), ud(e, e.dyn_dtree, e.d_desc.max_code), ml(e, e.bl_desc), n = Jl - 1; n >= 3 && e.bl_tree[up[n] * 2 + 1] === 0; n--)
    ;
  return e.opt_len += 3 * (n + 1) + 5 + 5 + 4, n;
}
function sC(e, n, t, a) {
  var s;
  for (Mt(e, n - 257, 5), Mt(e, t - 1, 5), Mt(e, a - 4, 4), s = 0; s < a; s++)
    Mt(e, e.bl_tree[up[s] * 2 + 1], 3);
  od(e, e.dyn_ltree, n - 1), od(e, e.dyn_dtree, t - 1);
}
function fC(e) {
  var n = 4093624447, t;
  for (t = 0; t <= 31; t++, n >>>= 1)
    if (n & 1 && e.dyn_ltree[t * 2] !== 0)
      return nd;
  if (e.dyn_ltree[9 * 2] !== 0 || e.dyn_ltree[10 * 2] !== 0 || e.dyn_ltree[13 * 2] !== 0)
    return rd;
  for (t = 32; t < vu; t++)
    if (e.dyn_ltree[t * 2] !== 0)
      return rd;
  return nd;
}
var sd = !1;
function lC(e) {
  sd || (aC(), sd = !0), e.l_desc = new Pf(e.dyn_ltree, op), e.d_desc = new Pf(e.dyn_dtree, sp), e.bl_desc = new Pf(e.bl_tree, fp), e.bi_buf = 0, e.bi_valid = 0, dp(e);
}
function gp(e, n, t, a) {
  Mt(e, (YE << 1) + (a ? 1 : 0), 3), uC(e, n, t);
}
function hC(e) {
  Mt(e, tp << 1, 3), Hn(e, jl, dr), rC(e);
}
function cC(e, n, t, a) {
  var s, o, h = 0;
  e.level > 0 ? (e.strm.data_type === KE && (e.strm.data_type = fC(e)), ml(e, e.l_desc), ml(e, e.d_desc), h = oC(e), s = e.opt_len + 3 + 7 >>> 3, o = e.static_len + 3 + 7 >>> 3, o <= s && (s = o)) : s = o = t + 5, t + 4 <= s && n !== -1 ? gp(e, n, t, a) : e.strategy === XE || o === s ? (Mt(e, (tp << 1) + (a ? 1 : 0), 3), ad(e, dr, za)) : (Mt(e, (QE << 1) + (a ? 1 : 0), 3), sC(e, e.l_desc.max_code + 1, e.d_desc.max_code + 1, h + 1), ad(e, e.dyn_ltree, e.dyn_dtree)), dp(e), a && pp(e);
}
function dC(e, n, t) {
  return e.pending_buf[e.d_buf + e.last_lit * 2] = n >>> 8 & 255, e.pending_buf[e.d_buf + e.last_lit * 2 + 1] = n & 255, e.pending_buf[e.l_buf + e.last_lit] = t & 255, e.last_lit++, n === 0 ? e.dyn_ltree[t * 2]++ : (e.matches++, n--, e.dyn_ltree[(ja[t] + vu + 1) * 2]++, e.dyn_dtree[lp(n) * 2]++), e.last_lit === e.lit_bufsize - 1;
}
sa._tr_init = lC;
sa._tr_stored_block = gp;
sa._tr_flush_block = cC;
sa._tr_tally = dC;
sa._tr_align = hC;
function pC(e, n, t, a) {
  for (var s = e & 65535 | 0, o = e >>> 16 & 65535 | 0, h = 0; t !== 0; ) {
    h = t > 2e3 ? 2e3 : t, t -= h;
    do
      s = s + n[a++] | 0, o = o + s | 0;
    while (--h);
    s %= 65521, o %= 65521;
  }
  return s | o << 16 | 0;
}
var _p = pC;
function gC() {
  for (var e, n = [], t = 0; t < 256; t++) {
    e = t;
    for (var a = 0; a < 8; a++)
      e = e & 1 ? 3988292384 ^ e >>> 1 : e >>> 1;
    n[t] = e;
  }
  return n;
}
var _C = gC();
function wC(e, n, t, a) {
  var s = _C, o = a + t;
  e ^= -1;
  for (var h = a; h < o; h++)
    e = e >>> 8 ^ s[(e ^ n[h]) & 255];
  return e ^ -1;
}
var wp = wC, th = {
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
}, It = vr, vn = sa, bp = _p, $r = wp, bC = th, yi = 0, vC = 1, DC = 3, Mr = 4, fd = 5, Gn = 0, ld = 1, Dn = -2, mC = -3, Mf = -5, yC = -1, EC = 1, bo = 2, CC = 3, xC = 4, AC = 0, FC = 2, rs = 8, BC = 9, SC = 15, kC = 8, IC = 29, TC = 256, yl = TC + 1 + IC, $C = 30, RC = 19, NC = 2 * yl + 1, LC = 15, Ae = 3, Or = 258, Tn = Or + Ae + 1, OC = 32, is = 42, El = 69, Ro = 73, No = 91, Lo = 103, si = 113, Oa = 666, lt = 1, Du = 2, pi = 3, la = 4, PC = 3;
function Pr(e, n) {
  return e.msg = bC[n], n;
}
function hd(e) {
  return (e << 1) - (e > 4 ? 9 : 0);
}
function Nr(e) {
  for (var n = e.length; --n >= 0; )
    e[n] = 0;
}
function Rr(e) {
  var n = e.state, t = n.pending;
  t > e.avail_out && (t = e.avail_out), t !== 0 && (It.arraySet(e.output, n.pending_buf, n.pending_out, t, e.next_out), e.next_out += t, n.pending_out += t, e.total_out += t, e.avail_out -= t, n.pending -= t, n.pending === 0 && (n.pending_out = 0));
}
function vt(e, n) {
  vn._tr_flush_block(e, e.block_start >= 0 ? e.block_start : -1, e.strstart - e.block_start, n), e.block_start = e.strstart, Rr(e.strm);
}
function Se(e, n) {
  e.pending_buf[e.pending++] = n;
}
function Ia(e, n) {
  e.pending_buf[e.pending++] = n >>> 8 & 255, e.pending_buf[e.pending++] = n & 255;
}
function UC(e, n, t, a) {
  var s = e.avail_in;
  return s > a && (s = a), s === 0 ? 0 : (e.avail_in -= s, It.arraySet(n, e.input, e.next_in, s, t), e.state.wrap === 1 ? e.adler = bp(e.adler, n, s, t) : e.state.wrap === 2 && (e.adler = $r(e.adler, n, s, t)), e.next_in += s, e.total_in += s, s);
}
function vp(e, n) {
  var t = e.max_chain_length, a = e.strstart, s, o, h = e.prev_length, l = e.nice_match, v = e.strstart > e.w_size - Tn ? e.strstart - (e.w_size - Tn) : 0, c = e.window, d = e.w_mask, A = e.prev, C = e.strstart + Or, y = c[a + h - 1], k = c[a + h];
  e.prev_length >= e.good_match && (t >>= 2), l > e.lookahead && (l = e.lookahead);
  do
    if (s = n, !(c[s + h] !== k || c[s + h - 1] !== y || c[s] !== c[a] || c[++s] !== c[a + 1])) {
      a += 2, s++;
      do
        ;
      while (c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && a < C);
      if (o = Or - (C - a), a = C - Or, o > h) {
        if (e.match_start = n, h = o, o >= l)
          break;
        y = c[a + h - 1], k = c[a + h];
      }
    }
  while ((n = A[n & d]) > v && --t !== 0);
  return h <= e.lookahead ? h : e.lookahead;
}
function gi(e) {
  var n = e.w_size, t, a, s, o, h;
  do {
    if (o = e.window_size - e.lookahead - e.strstart, e.strstart >= n + (n - Tn)) {
      It.arraySet(e.window, e.window, n, n, 0), e.match_start -= n, e.strstart -= n, e.block_start -= n, a = e.hash_size, t = a;
      do
        s = e.head[--t], e.head[t] = s >= n ? s - n : 0;
      while (--a);
      a = n, t = a;
      do
        s = e.prev[--t], e.prev[t] = s >= n ? s - n : 0;
      while (--a);
      o += n;
    }
    if (e.strm.avail_in === 0)
      break;
    if (a = UC(e.strm, e.window, e.strstart + e.lookahead, o), e.lookahead += a, e.lookahead + e.insert >= Ae)
      for (h = e.strstart - e.insert, e.ins_h = e.window[h], e.ins_h = (e.ins_h << e.hash_shift ^ e.window[h + 1]) & e.hash_mask; e.insert && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[h + Ae - 1]) & e.hash_mask, e.prev[h & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = h, h++, e.insert--, !(e.lookahead + e.insert < Ae)); )
        ;
  } while (e.lookahead < Tn && e.strm.avail_in !== 0);
}
function MC(e, n) {
  var t = 65535;
  for (t > e.pending_buf_size - 5 && (t = e.pending_buf_size - 5); ; ) {
    if (e.lookahead <= 1) {
      if (gi(e), e.lookahead === 0 && n === yi)
        return lt;
      if (e.lookahead === 0)
        break;
    }
    e.strstart += e.lookahead, e.lookahead = 0;
    var a = e.block_start + t;
    if ((e.strstart === 0 || e.strstart >= a) && (e.lookahead = e.strstart - a, e.strstart = a, vt(e, !1), e.strm.avail_out === 0) || e.strstart - e.block_start >= e.w_size - Tn && (vt(e, !1), e.strm.avail_out === 0))
      return lt;
  }
  return e.insert = 0, n === Mr ? (vt(e, !0), e.strm.avail_out === 0 ? pi : la) : (e.strstart > e.block_start && (vt(e, !1), e.strm.avail_out === 0), lt);
}
function zf(e, n) {
  for (var t, a; ; ) {
    if (e.lookahead < Tn) {
      if (gi(e), e.lookahead < Tn && n === yi)
        return lt;
      if (e.lookahead === 0)
        break;
    }
    if (t = 0, e.lookahead >= Ae && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + Ae - 1]) & e.hash_mask, t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), t !== 0 && e.strstart - t <= e.w_size - Tn && (e.match_length = vp(e, t)), e.match_length >= Ae)
      if (a = vn._tr_tally(e, e.strstart - e.match_start, e.match_length - Ae), e.lookahead -= e.match_length, e.match_length <= e.max_lazy_match && e.lookahead >= Ae) {
        e.match_length--;
        do
          e.strstart++, e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + Ae - 1]) & e.hash_mask, t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart;
        while (--e.match_length !== 0);
        e.strstart++;
      } else
        e.strstart += e.match_length, e.match_length = 0, e.ins_h = e.window[e.strstart], e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + 1]) & e.hash_mask;
    else
      a = vn._tr_tally(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++;
    if (a && (vt(e, !1), e.strm.avail_out === 0))
      return lt;
  }
  return e.insert = e.strstart < Ae - 1 ? e.strstart : Ae - 1, n === Mr ? (vt(e, !0), e.strm.avail_out === 0 ? pi : la) : e.last_lit && (vt(e, !1), e.strm.avail_out === 0) ? lt : Du;
}
function zi(e, n) {
  for (var t, a, s; ; ) {
    if (e.lookahead < Tn) {
      if (gi(e), e.lookahead < Tn && n === yi)
        return lt;
      if (e.lookahead === 0)
        break;
    }
    if (t = 0, e.lookahead >= Ae && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + Ae - 1]) & e.hash_mask, t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), e.prev_length = e.match_length, e.prev_match = e.match_start, e.match_length = Ae - 1, t !== 0 && e.prev_length < e.max_lazy_match && e.strstart - t <= e.w_size - Tn && (e.match_length = vp(e, t), e.match_length <= 5 && (e.strategy === EC || e.match_length === Ae && e.strstart - e.match_start > 4096) && (e.match_length = Ae - 1)), e.prev_length >= Ae && e.match_length <= e.prev_length) {
      s = e.strstart + e.lookahead - Ae, a = vn._tr_tally(e, e.strstart - 1 - e.prev_match, e.prev_length - Ae), e.lookahead -= e.prev_length - 1, e.prev_length -= 2;
      do
        ++e.strstart <= s && (e.ins_h = (e.ins_h << e.hash_shift ^ e.window[e.strstart + Ae - 1]) & e.hash_mask, t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart);
      while (--e.prev_length !== 0);
      if (e.match_available = 0, e.match_length = Ae - 1, e.strstart++, a && (vt(e, !1), e.strm.avail_out === 0))
        return lt;
    } else if (e.match_available) {
      if (a = vn._tr_tally(e, 0, e.window[e.strstart - 1]), a && vt(e, !1), e.strstart++, e.lookahead--, e.strm.avail_out === 0)
        return lt;
    } else
      e.match_available = 1, e.strstart++, e.lookahead--;
  }
  return e.match_available && (a = vn._tr_tally(e, 0, e.window[e.strstart - 1]), e.match_available = 0), e.insert = e.strstart < Ae - 1 ? e.strstart : Ae - 1, n === Mr ? (vt(e, !0), e.strm.avail_out === 0 ? pi : la) : e.last_lit && (vt(e, !1), e.strm.avail_out === 0) ? lt : Du;
}
function zC(e, n) {
  for (var t, a, s, o, h = e.window; ; ) {
    if (e.lookahead <= Or) {
      if (gi(e), e.lookahead <= Or && n === yi)
        return lt;
      if (e.lookahead === 0)
        break;
    }
    if (e.match_length = 0, e.lookahead >= Ae && e.strstart > 0 && (s = e.strstart - 1, a = h[s], a === h[++s] && a === h[++s] && a === h[++s])) {
      o = e.strstart + Or;
      do
        ;
      while (a === h[++s] && a === h[++s] && a === h[++s] && a === h[++s] && a === h[++s] && a === h[++s] && a === h[++s] && a === h[++s] && s < o);
      e.match_length = Or - (o - s), e.match_length > e.lookahead && (e.match_length = e.lookahead);
    }
    if (e.match_length >= Ae ? (t = vn._tr_tally(e, 1, e.match_length - Ae), e.lookahead -= e.match_length, e.strstart += e.match_length, e.match_length = 0) : (t = vn._tr_tally(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++), t && (vt(e, !1), e.strm.avail_out === 0))
      return lt;
  }
  return e.insert = 0, n === Mr ? (vt(e, !0), e.strm.avail_out === 0 ? pi : la) : e.last_lit && (vt(e, !1), e.strm.avail_out === 0) ? lt : Du;
}
function ZC(e, n) {
  for (var t; ; ) {
    if (e.lookahead === 0 && (gi(e), e.lookahead === 0)) {
      if (n === yi)
        return lt;
      break;
    }
    if (e.match_length = 0, t = vn._tr_tally(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++, t && (vt(e, !1), e.strm.avail_out === 0))
      return lt;
  }
  return e.insert = 0, n === Mr ? (vt(e, !0), e.strm.avail_out === 0 ? pi : la) : e.last_lit && (vt(e, !1), e.strm.avail_out === 0) ? lt : Du;
}
function Mn(e, n, t, a, s) {
  this.good_length = e, this.max_lazy = n, this.nice_length = t, this.max_chain = a, this.func = s;
}
var Xi;
Xi = [
  /*      good lazy nice chain */
  new Mn(0, 0, 0, 0, MC),
  /* 0 store only */
  new Mn(4, 4, 8, 4, zf),
  /* 1 max speed, no lazy matches */
  new Mn(4, 5, 16, 8, zf),
  /* 2 */
  new Mn(4, 6, 32, 32, zf),
  /* 3 */
  new Mn(4, 4, 16, 16, zi),
  /* 4 lazy matches */
  new Mn(8, 16, 32, 32, zi),
  /* 5 */
  new Mn(8, 16, 128, 128, zi),
  /* 6 */
  new Mn(8, 32, 128, 256, zi),
  /* 7 */
  new Mn(32, 128, 258, 1024, zi),
  /* 8 */
  new Mn(32, 258, 258, 4096, zi)
  /* 9 max compression */
];
function qC(e) {
  e.window_size = 2 * e.w_size, Nr(e.head), e.max_lazy_match = Xi[e.level].max_lazy, e.good_match = Xi[e.level].good_length, e.nice_match = Xi[e.level].nice_length, e.max_chain_length = Xi[e.level].max_chain, e.strstart = 0, e.block_start = 0, e.lookahead = 0, e.insert = 0, e.match_length = e.prev_length = Ae - 1, e.match_available = 0, e.ins_h = 0;
}
function HC() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = rs, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new It.Buf16(NC * 2), this.dyn_dtree = new It.Buf16((2 * $C + 1) * 2), this.bl_tree = new It.Buf16((2 * RC + 1) * 2), Nr(this.dyn_ltree), Nr(this.dyn_dtree), Nr(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new It.Buf16(LC + 1), this.heap = new It.Buf16(2 * yl + 1), Nr(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new It.Buf16(2 * yl + 1), Nr(this.depth), this.l_buf = 0, this.lit_bufsize = 0, this.last_lit = 0, this.d_buf = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
function Dp(e) {
  var n;
  return !e || !e.state ? Pr(e, Dn) : (e.total_in = e.total_out = 0, e.data_type = FC, n = e.state, n.pending = 0, n.pending_out = 0, n.wrap < 0 && (n.wrap = -n.wrap), n.status = n.wrap ? is : si, e.adler = n.wrap === 2 ? 0 : 1, n.last_flush = yi, vn._tr_init(n), Gn);
}
function mp(e) {
  var n = Dp(e);
  return n === Gn && qC(e.state), n;
}
function GC(e, n) {
  return !e || !e.state || e.state.wrap !== 2 ? Dn : (e.state.gzhead = n, Gn);
}
function yp(e, n, t, a, s, o) {
  if (!e)
    return Dn;
  var h = 1;
  if (n === yC && (n = 6), a < 0 ? (h = 0, a = -a) : a > 15 && (h = 2, a -= 16), s < 1 || s > BC || t !== rs || a < 8 || a > 15 || n < 0 || n > 9 || o < 0 || o > xC)
    return Pr(e, Dn);
  a === 8 && (a = 9);
  var l = new HC();
  return e.state = l, l.strm = e, l.wrap = h, l.gzhead = null, l.w_bits = a, l.w_size = 1 << l.w_bits, l.w_mask = l.w_size - 1, l.hash_bits = s + 7, l.hash_size = 1 << l.hash_bits, l.hash_mask = l.hash_size - 1, l.hash_shift = ~~((l.hash_bits + Ae - 1) / Ae), l.window = new It.Buf8(l.w_size * 2), l.head = new It.Buf16(l.hash_size), l.prev = new It.Buf16(l.w_size), l.lit_bufsize = 1 << s + 6, l.pending_buf_size = l.lit_bufsize * 4, l.pending_buf = new It.Buf8(l.pending_buf_size), l.d_buf = 1 * l.lit_bufsize, l.l_buf = 3 * l.lit_bufsize, l.level = n, l.strategy = o, l.method = t, mp(e);
}
function WC(e, n) {
  return yp(e, n, rs, SC, kC, AC);
}
function VC(e, n) {
  var t, a, s, o;
  if (!e || !e.state || n > fd || n < 0)
    return e ? Pr(e, Dn) : Dn;
  if (a = e.state, !e.output || !e.input && e.avail_in !== 0 || a.status === Oa && n !== Mr)
    return Pr(e, e.avail_out === 0 ? Mf : Dn);
  if (a.strm = e, t = a.last_flush, a.last_flush = n, a.status === is)
    if (a.wrap === 2)
      e.adler = 0, Se(a, 31), Se(a, 139), Se(a, 8), a.gzhead ? (Se(
        a,
        (a.gzhead.text ? 1 : 0) + (a.gzhead.hcrc ? 2 : 0) + (a.gzhead.extra ? 4 : 0) + (a.gzhead.name ? 8 : 0) + (a.gzhead.comment ? 16 : 0)
      ), Se(a, a.gzhead.time & 255), Se(a, a.gzhead.time >> 8 & 255), Se(a, a.gzhead.time >> 16 & 255), Se(a, a.gzhead.time >> 24 & 255), Se(a, a.level === 9 ? 2 : a.strategy >= bo || a.level < 2 ? 4 : 0), Se(a, a.gzhead.os & 255), a.gzhead.extra && a.gzhead.extra.length && (Se(a, a.gzhead.extra.length & 255), Se(a, a.gzhead.extra.length >> 8 & 255)), a.gzhead.hcrc && (e.adler = $r(e.adler, a.pending_buf, a.pending, 0)), a.gzindex = 0, a.status = El) : (Se(a, 0), Se(a, 0), Se(a, 0), Se(a, 0), Se(a, 0), Se(a, a.level === 9 ? 2 : a.strategy >= bo || a.level < 2 ? 4 : 0), Se(a, PC), a.status = si);
    else {
      var h = rs + (a.w_bits - 8 << 4) << 8, l = -1;
      a.strategy >= bo || a.level < 2 ? l = 0 : a.level < 6 ? l = 1 : a.level === 6 ? l = 2 : l = 3, h |= l << 6, a.strstart !== 0 && (h |= OC), h += 31 - h % 31, a.status = si, Ia(a, h), a.strstart !== 0 && (Ia(a, e.adler >>> 16), Ia(a, e.adler & 65535)), e.adler = 1;
    }
  if (a.status === El)
    if (a.gzhead.extra) {
      for (s = a.pending; a.gzindex < (a.gzhead.extra.length & 65535) && !(a.pending === a.pending_buf_size && (a.gzhead.hcrc && a.pending > s && (e.adler = $r(e.adler, a.pending_buf, a.pending - s, s)), Rr(e), s = a.pending, a.pending === a.pending_buf_size)); )
        Se(a, a.gzhead.extra[a.gzindex] & 255), a.gzindex++;
      a.gzhead.hcrc && a.pending > s && (e.adler = $r(e.adler, a.pending_buf, a.pending - s, s)), a.gzindex === a.gzhead.extra.length && (a.gzindex = 0, a.status = Ro);
    } else
      a.status = Ro;
  if (a.status === Ro)
    if (a.gzhead.name) {
      s = a.pending;
      do {
        if (a.pending === a.pending_buf_size && (a.gzhead.hcrc && a.pending > s && (e.adler = $r(e.adler, a.pending_buf, a.pending - s, s)), Rr(e), s = a.pending, a.pending === a.pending_buf_size)) {
          o = 1;
          break;
        }
        a.gzindex < a.gzhead.name.length ? o = a.gzhead.name.charCodeAt(a.gzindex++) & 255 : o = 0, Se(a, o);
      } while (o !== 0);
      a.gzhead.hcrc && a.pending > s && (e.adler = $r(e.adler, a.pending_buf, a.pending - s, s)), o === 0 && (a.gzindex = 0, a.status = No);
    } else
      a.status = No;
  if (a.status === No)
    if (a.gzhead.comment) {
      s = a.pending;
      do {
        if (a.pending === a.pending_buf_size && (a.gzhead.hcrc && a.pending > s && (e.adler = $r(e.adler, a.pending_buf, a.pending - s, s)), Rr(e), s = a.pending, a.pending === a.pending_buf_size)) {
          o = 1;
          break;
        }
        a.gzindex < a.gzhead.comment.length ? o = a.gzhead.comment.charCodeAt(a.gzindex++) & 255 : o = 0, Se(a, o);
      } while (o !== 0);
      a.gzhead.hcrc && a.pending > s && (e.adler = $r(e.adler, a.pending_buf, a.pending - s, s)), o === 0 && (a.status = Lo);
    } else
      a.status = Lo;
  if (a.status === Lo && (a.gzhead.hcrc ? (a.pending + 2 > a.pending_buf_size && Rr(e), a.pending + 2 <= a.pending_buf_size && (Se(a, e.adler & 255), Se(a, e.adler >> 8 & 255), e.adler = 0, a.status = si)) : a.status = si), a.pending !== 0) {
    if (Rr(e), e.avail_out === 0)
      return a.last_flush = -1, Gn;
  } else if (e.avail_in === 0 && hd(n) <= hd(t) && n !== Mr)
    return Pr(e, Mf);
  if (a.status === Oa && e.avail_in !== 0)
    return Pr(e, Mf);
  if (e.avail_in !== 0 || a.lookahead !== 0 || n !== yi && a.status !== Oa) {
    var v = a.strategy === bo ? ZC(a, n) : a.strategy === CC ? zC(a, n) : Xi[a.level].func(a, n);
    if ((v === pi || v === la) && (a.status = Oa), v === lt || v === pi)
      return e.avail_out === 0 && (a.last_flush = -1), Gn;
    if (v === Du && (n === vC ? vn._tr_align(a) : n !== fd && (vn._tr_stored_block(a, 0, 0, !1), n === DC && (Nr(a.head), a.lookahead === 0 && (a.strstart = 0, a.block_start = 0, a.insert = 0))), Rr(e), e.avail_out === 0))
      return a.last_flush = -1, Gn;
  }
  return n !== Mr ? Gn : a.wrap <= 0 ? ld : (a.wrap === 2 ? (Se(a, e.adler & 255), Se(a, e.adler >> 8 & 255), Se(a, e.adler >> 16 & 255), Se(a, e.adler >> 24 & 255), Se(a, e.total_in & 255), Se(a, e.total_in >> 8 & 255), Se(a, e.total_in >> 16 & 255), Se(a, e.total_in >> 24 & 255)) : (Ia(a, e.adler >>> 16), Ia(a, e.adler & 65535)), Rr(e), a.wrap > 0 && (a.wrap = -a.wrap), a.pending !== 0 ? Gn : ld);
}
function XC(e) {
  var n;
  return !e || !e.state ? Dn : (n = e.state.status, n !== is && n !== El && n !== Ro && n !== No && n !== Lo && n !== si && n !== Oa ? Pr(e, Dn) : (e.state = null, n === si ? Pr(e, mC) : Gn));
}
function KC(e, n) {
  var t = n.length, a, s, o, h, l, v, c, d;
  if (!e || !e.state || (a = e.state, h = a.wrap, h === 2 || h === 1 && a.status !== is || a.lookahead))
    return Dn;
  for (h === 1 && (e.adler = bp(e.adler, n, t, 0)), a.wrap = 0, t >= a.w_size && (h === 0 && (Nr(a.head), a.strstart = 0, a.block_start = 0, a.insert = 0), d = new It.Buf8(a.w_size), It.arraySet(d, n, t - a.w_size, a.w_size, 0), n = d, t = a.w_size), l = e.avail_in, v = e.next_in, c = e.input, e.avail_in = t, e.next_in = 0, e.input = n, gi(a); a.lookahead >= Ae; ) {
    s = a.strstart, o = a.lookahead - (Ae - 1);
    do
      a.ins_h = (a.ins_h << a.hash_shift ^ a.window[s + Ae - 1]) & a.hash_mask, a.prev[s & a.w_mask] = a.head[a.ins_h], a.head[a.ins_h] = s, s++;
    while (--o);
    a.strstart = s, a.lookahead = Ae - 1, gi(a);
  }
  return a.strstart += a.lookahead, a.block_start = a.strstart, a.insert = a.lookahead, a.lookahead = 0, a.match_length = a.prev_length = Ae - 1, a.match_available = 0, e.next_in = v, e.input = c, e.avail_in = l, a.wrap = h, Gn;
}
jn.deflateInit = WC;
jn.deflateInit2 = yp;
jn.deflateReset = mp;
jn.deflateResetKeep = Dp;
jn.deflateSetHeader = GC;
jn.deflate = VC;
jn.deflateEnd = XC;
jn.deflateSetDictionary = KC;
jn.deflateInfo = "pako deflate (from Nodeca project)";
var Ei = {}, as = vr, Ep = !0, Cp = !0;
try {
  String.fromCharCode.apply(null, [0]);
} catch {
  Ep = !1;
}
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  Cp = !1;
}
var tu = new as.Buf8(256);
for (var Tr = 0; Tr < 256; Tr++)
  tu[Tr] = Tr >= 252 ? 6 : Tr >= 248 ? 5 : Tr >= 240 ? 4 : Tr >= 224 ? 3 : Tr >= 192 ? 2 : 1;
tu[254] = tu[254] = 1;
Ei.string2buf = function(e) {
  var n, t, a, s, o, h = e.length, l = 0;
  for (s = 0; s < h; s++)
    t = e.charCodeAt(s), (t & 64512) === 55296 && s + 1 < h && (a = e.charCodeAt(s + 1), (a & 64512) === 56320 && (t = 65536 + (t - 55296 << 10) + (a - 56320), s++)), l += t < 128 ? 1 : t < 2048 ? 2 : t < 65536 ? 3 : 4;
  for (n = new as.Buf8(l), o = 0, s = 0; o < l; s++)
    t = e.charCodeAt(s), (t & 64512) === 55296 && s + 1 < h && (a = e.charCodeAt(s + 1), (a & 64512) === 56320 && (t = 65536 + (t - 55296 << 10) + (a - 56320), s++)), t < 128 ? n[o++] = t : t < 2048 ? (n[o++] = 192 | t >>> 6, n[o++] = 128 | t & 63) : t < 65536 ? (n[o++] = 224 | t >>> 12, n[o++] = 128 | t >>> 6 & 63, n[o++] = 128 | t & 63) : (n[o++] = 240 | t >>> 18, n[o++] = 128 | t >>> 12 & 63, n[o++] = 128 | t >>> 6 & 63, n[o++] = 128 | t & 63);
  return n;
};
function xp(e, n) {
  if (n < 65534 && (e.subarray && Cp || !e.subarray && Ep))
    return String.fromCharCode.apply(null, as.shrinkBuf(e, n));
  for (var t = "", a = 0; a < n; a++)
    t += String.fromCharCode(e[a]);
  return t;
}
Ei.buf2binstring = function(e) {
  return xp(e, e.length);
};
Ei.binstring2buf = function(e) {
  for (var n = new as.Buf8(e.length), t = 0, a = n.length; t < a; t++)
    n[t] = e.charCodeAt(t);
  return n;
};
Ei.buf2string = function(e, n) {
  var t, a, s, o, h = n || e.length, l = new Array(h * 2);
  for (a = 0, t = 0; t < h; ) {
    if (s = e[t++], s < 128) {
      l[a++] = s;
      continue;
    }
    if (o = tu[s], o > 4) {
      l[a++] = 65533, t += o - 1;
      continue;
    }
    for (s &= o === 2 ? 31 : o === 3 ? 15 : 7; o > 1 && t < h; )
      s = s << 6 | e[t++] & 63, o--;
    if (o > 1) {
      l[a++] = 65533;
      continue;
    }
    s < 65536 ? l[a++] = s : (s -= 65536, l[a++] = 55296 | s >> 10 & 1023, l[a++] = 56320 | s & 1023);
  }
  return xp(l, a);
};
Ei.utf8border = function(e, n) {
  var t;
  for (n = n || e.length, n > e.length && (n = e.length), t = n - 1; t >= 0 && (e[t] & 192) === 128; )
    t--;
  return t < 0 || t === 0 ? n : t + tu[e[t]] > n ? t : n;
};
function YC() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var Ap = YC, Za = jn, qa = vr, Cl = Ei, xl = th, QC = Ap, Fp = Object.prototype.toString, JC = 0, Zf = 4, Qi = 0, cd = 1, dd = 2, jC = -1, ex = 0, tx = 8;
function _i(e) {
  if (!(this instanceof _i)) return new _i(e);
  this.options = qa.assign({
    level: jC,
    method: tx,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: ex,
    to: ""
  }, e || {});
  var n = this.options;
  n.raw && n.windowBits > 0 ? n.windowBits = -n.windowBits : n.gzip && n.windowBits > 0 && n.windowBits < 16 && (n.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new QC(), this.strm.avail_out = 0;
  var t = Za.deflateInit2(
    this.strm,
    n.level,
    n.method,
    n.windowBits,
    n.memLevel,
    n.strategy
  );
  if (t !== Qi)
    throw new Error(xl[t]);
  if (n.header && Za.deflateSetHeader(this.strm, n.header), n.dictionary) {
    var a;
    if (typeof n.dictionary == "string" ? a = Cl.string2buf(n.dictionary) : Fp.call(n.dictionary) === "[object ArrayBuffer]" ? a = new Uint8Array(n.dictionary) : a = n.dictionary, t = Za.deflateSetDictionary(this.strm, a), t !== Qi)
      throw new Error(xl[t]);
    this._dict_set = !0;
  }
}
_i.prototype.push = function(e, n) {
  var t = this.strm, a = this.options.chunkSize, s, o;
  if (this.ended)
    return !1;
  o = n === ~~n ? n : n === !0 ? Zf : JC, typeof e == "string" ? t.input = Cl.string2buf(e) : Fp.call(e) === "[object ArrayBuffer]" ? t.input = new Uint8Array(e) : t.input = e, t.next_in = 0, t.avail_in = t.input.length;
  do {
    if (t.avail_out === 0 && (t.output = new qa.Buf8(a), t.next_out = 0, t.avail_out = a), s = Za.deflate(t, o), s !== cd && s !== Qi)
      return this.onEnd(s), this.ended = !0, !1;
    (t.avail_out === 0 || t.avail_in === 0 && (o === Zf || o === dd)) && (this.options.to === "string" ? this.onData(Cl.buf2binstring(qa.shrinkBuf(t.output, t.next_out))) : this.onData(qa.shrinkBuf(t.output, t.next_out)));
  } while ((t.avail_in > 0 || t.avail_out === 0) && s !== cd);
  return o === Zf ? (s = Za.deflateEnd(this.strm), this.onEnd(s), this.ended = !0, s === Qi) : (o === dd && (this.onEnd(Qi), t.avail_out = 0), !0);
};
_i.prototype.onData = function(e) {
  this.chunks.push(e);
};
_i.prototype.onEnd = function(e) {
  e === Qi && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = qa.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
function nh(e, n) {
  var t = new _i(n);
  if (t.push(e, !0), t.err)
    throw t.msg || xl[t.err];
  return t.result;
}
function nx(e, n) {
  return n = n || {}, n.raw = !0, nh(e, n);
}
function rx(e, n) {
  return n = n || {}, n.gzip = !0, nh(e, n);
}
bu.Deflate = _i;
bu.deflate = nh;
bu.deflateRaw = nx;
bu.gzip = rx;
var mu = {}, $n = {}, vo = 30, ix = 12, ax = function(n, t) {
  var a, s, o, h, l, v, c, d, A, C, y, k, B, P, T, Z, U, $, L, Q, q, G, J, ee, K;
  a = n.state, s = n.next_in, ee = n.input, o = s + (n.avail_in - 5), h = n.next_out, K = n.output, l = h - (t - n.avail_out), v = h + (n.avail_out - 257), c = a.dmax, d = a.wsize, A = a.whave, C = a.wnext, y = a.window, k = a.hold, B = a.bits, P = a.lencode, T = a.distcode, Z = (1 << a.lenbits) - 1, U = (1 << a.distbits) - 1;
  e:
    do {
      B < 15 && (k += ee[s++] << B, B += 8, k += ee[s++] << B, B += 8), $ = P[k & Z];
      t:
        for (; ; ) {
          if (L = $ >>> 24, k >>>= L, B -= L, L = $ >>> 16 & 255, L === 0)
            K[h++] = $ & 65535;
          else if (L & 16) {
            Q = $ & 65535, L &= 15, L && (B < L && (k += ee[s++] << B, B += 8), Q += k & (1 << L) - 1, k >>>= L, B -= L), B < 15 && (k += ee[s++] << B, B += 8, k += ee[s++] << B, B += 8), $ = T[k & U];
            n:
              for (; ; ) {
                if (L = $ >>> 24, k >>>= L, B -= L, L = $ >>> 16 & 255, L & 16) {
                  if (q = $ & 65535, L &= 15, B < L && (k += ee[s++] << B, B += 8, B < L && (k += ee[s++] << B, B += 8)), q += k & (1 << L) - 1, q > c) {
                    n.msg = "invalid distance too far back", a.mode = vo;
                    break e;
                  }
                  if (k >>>= L, B -= L, L = h - l, q > L) {
                    if (L = q - L, L > A && a.sane) {
                      n.msg = "invalid distance too far back", a.mode = vo;
                      break e;
                    }
                    if (G = 0, J = y, C === 0) {
                      if (G += d - L, L < Q) {
                        Q -= L;
                        do
                          K[h++] = y[G++];
                        while (--L);
                        G = h - q, J = K;
                      }
                    } else if (C < L) {
                      if (G += d + C - L, L -= C, L < Q) {
                        Q -= L;
                        do
                          K[h++] = y[G++];
                        while (--L);
                        if (G = 0, C < Q) {
                          L = C, Q -= L;
                          do
                            K[h++] = y[G++];
                          while (--L);
                          G = h - q, J = K;
                        }
                      }
                    } else if (G += C - L, L < Q) {
                      Q -= L;
                      do
                        K[h++] = y[G++];
                      while (--L);
                      G = h - q, J = K;
                    }
                    for (; Q > 2; )
                      K[h++] = J[G++], K[h++] = J[G++], K[h++] = J[G++], Q -= 3;
                    Q && (K[h++] = J[G++], Q > 1 && (K[h++] = J[G++]));
                  } else {
                    G = h - q;
                    do
                      K[h++] = K[G++], K[h++] = K[G++], K[h++] = K[G++], Q -= 3;
                    while (Q > 2);
                    Q && (K[h++] = K[G++], Q > 1 && (K[h++] = K[G++]));
                  }
                } else if (L & 64) {
                  n.msg = "invalid distance code", a.mode = vo;
                  break e;
                } else {
                  $ = T[($ & 65535) + (k & (1 << L) - 1)];
                  continue n;
                }
                break;
              }
          } else if (L & 64)
            if (L & 32) {
              a.mode = ix;
              break e;
            } else {
              n.msg = "invalid literal/length code", a.mode = vo;
              break e;
            }
          else {
            $ = P[($ & 65535) + (k & (1 << L) - 1)];
            continue t;
          }
          break;
        }
    } while (s < o && h < v);
  Q = B >> 3, s -= Q, B -= Q << 3, k &= (1 << B) - 1, n.next_in = s, n.next_out = h, n.avail_in = s < o ? 5 + (o - s) : 5 - (s - o), n.avail_out = h < v ? 257 + (v - h) : 257 - (h - v), a.hold = k, a.bits = B;
}, pd = vr, Zi = 15, gd = 852, _d = 592, wd = 0, qf = 1, bd = 2, ux = [
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
], ox = [
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
], sx = [
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
], fx = [
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
], lx = function(n, t, a, s, o, h, l, v) {
  var c = v.bits, d = 0, A = 0, C = 0, y = 0, k = 0, B = 0, P = 0, T = 0, Z = 0, U = 0, $, L, Q, q, G, J = null, ee = 0, K, ie = new pd.Buf16(Zi + 1), Ce = new pd.Buf16(Zi + 1), ve = null, Me = 0, Oe, ce, Be;
  for (d = 0; d <= Zi; d++)
    ie[d] = 0;
  for (A = 0; A < s; A++)
    ie[t[a + A]]++;
  for (k = c, y = Zi; y >= 1 && ie[y] === 0; y--)
    ;
  if (k > y && (k = y), y === 0)
    return o[h++] = 1 << 24 | 64 << 16 | 0, o[h++] = 1 << 24 | 64 << 16 | 0, v.bits = 1, 0;
  for (C = 1; C < y && ie[C] === 0; C++)
    ;
  for (k < C && (k = C), T = 1, d = 1; d <= Zi; d++)
    if (T <<= 1, T -= ie[d], T < 0)
      return -1;
  if (T > 0 && (n === wd || y !== 1))
    return -1;
  for (Ce[1] = 0, d = 1; d < Zi; d++)
    Ce[d + 1] = Ce[d] + ie[d];
  for (A = 0; A < s; A++)
    t[a + A] !== 0 && (l[Ce[t[a + A]]++] = A);
  if (n === wd ? (J = ve = l, K = 19) : n === qf ? (J = ux, ee -= 257, ve = ox, Me -= 257, K = 256) : (J = sx, ve = fx, K = -1), U = 0, A = 0, d = C, G = h, B = k, P = 0, Q = -1, Z = 1 << k, q = Z - 1, n === qf && Z > gd || n === bd && Z > _d)
    return 1;
  for (; ; ) {
    Oe = d - P, l[A] < K ? (ce = 0, Be = l[A]) : l[A] > K ? (ce = ve[Me + l[A]], Be = J[ee + l[A]]) : (ce = 96, Be = 0), $ = 1 << d - P, L = 1 << B, C = L;
    do
      L -= $, o[G + (U >> P) + L] = Oe << 24 | ce << 16 | Be | 0;
    while (L !== 0);
    for ($ = 1 << d - 1; U & $; )
      $ >>= 1;
    if ($ !== 0 ? (U &= $ - 1, U += $) : U = 0, A++, --ie[d] === 0) {
      if (d === y)
        break;
      d = t[a + l[A]];
    }
    if (d > k && (U & q) !== Q) {
      for (P === 0 && (P = k), G += C, B = d - P, T = 1 << B; B + P < y && (T -= ie[B + P], !(T <= 0)); )
        B++, T <<= 1;
      if (Z += 1 << B, n === qf && Z > gd || n === bd && Z > _d)
        return 1;
      Q = U & q, o[Q] = k << 24 | B << 16 | G - h | 0;
    }
  }
  return U !== 0 && (o[G + U] = d - P << 24 | 64 << 16 | 0), v.bits = k, 0;
}, jt = vr, Al = _p, zn = wp, hx = ax, Ha = lx, cx = 0, Bp = 1, Sp = 2, vd = 4, dx = 5, Do = 6, wi = 0, px = 1, gx = 2, mn = -2, kp = -3, Ip = -4, _x = -5, Dd = 8, Tp = 1, md = 2, yd = 3, Ed = 4, Cd = 5, xd = 6, Ad = 7, Fd = 8, Bd = 9, Sd = 10, Ho = 11, lr = 12, Hf = 13, kd = 14, Gf = 15, Id = 16, Td = 17, $d = 18, Rd = 19, mo = 20, yo = 21, Nd = 22, Ld = 23, Od = 24, Pd = 25, Ud = 26, Wf = 27, Md = 28, zd = 29, Qe = 30, $p = 31, wx = 32, bx = 852, vx = 592, Dx = 15, mx = Dx;
function Zd(e) {
  return (e >>> 24 & 255) + (e >>> 8 & 65280) + ((e & 65280) << 8) + ((e & 255) << 24);
}
function yx() {
  this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new jt.Buf16(320), this.work = new jt.Buf16(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
function Rp(e) {
  var n;
  return !e || !e.state ? mn : (n = e.state, e.total_in = e.total_out = n.total = 0, e.msg = "", n.wrap && (e.adler = n.wrap & 1), n.mode = Tp, n.last = 0, n.havedict = 0, n.dmax = 32768, n.head = null, n.hold = 0, n.bits = 0, n.lencode = n.lendyn = new jt.Buf32(bx), n.distcode = n.distdyn = new jt.Buf32(vx), n.sane = 1, n.back = -1, wi);
}
function Np(e) {
  var n;
  return !e || !e.state ? mn : (n = e.state, n.wsize = 0, n.whave = 0, n.wnext = 0, Rp(e));
}
function Lp(e, n) {
  var t, a;
  return !e || !e.state || (a = e.state, n < 0 ? (t = 0, n = -n) : (t = (n >> 4) + 1, n < 48 && (n &= 15)), n && (n < 8 || n > 15)) ? mn : (a.window !== null && a.wbits !== n && (a.window = null), a.wrap = t, a.wbits = n, Np(e));
}
function Op(e, n) {
  var t, a;
  return e ? (a = new yx(), e.state = a, a.window = null, t = Lp(e, n), t !== wi && (e.state = null), t) : mn;
}
function Ex(e) {
  return Op(e, mx);
}
var qd = !0, Vf, Xf;
function Cx(e) {
  if (qd) {
    var n;
    for (Vf = new jt.Buf32(512), Xf = new jt.Buf32(32), n = 0; n < 144; )
      e.lens[n++] = 8;
    for (; n < 256; )
      e.lens[n++] = 9;
    for (; n < 280; )
      e.lens[n++] = 7;
    for (; n < 288; )
      e.lens[n++] = 8;
    for (Ha(Bp, e.lens, 0, 288, Vf, 0, e.work, { bits: 9 }), n = 0; n < 32; )
      e.lens[n++] = 5;
    Ha(Sp, e.lens, 0, 32, Xf, 0, e.work, { bits: 5 }), qd = !1;
  }
  e.lencode = Vf, e.lenbits = 9, e.distcode = Xf, e.distbits = 5;
}
function Pp(e, n, t, a) {
  var s, o = e.state;
  return o.window === null && (o.wsize = 1 << o.wbits, o.wnext = 0, o.whave = 0, o.window = new jt.Buf8(o.wsize)), a >= o.wsize ? (jt.arraySet(o.window, n, t - o.wsize, o.wsize, 0), o.wnext = 0, o.whave = o.wsize) : (s = o.wsize - o.wnext, s > a && (s = a), jt.arraySet(o.window, n, t - a, s, o.wnext), a -= s, a ? (jt.arraySet(o.window, n, t - a, a, 0), o.wnext = a, o.whave = o.wsize) : (o.wnext += s, o.wnext === o.wsize && (o.wnext = 0), o.whave < o.wsize && (o.whave += s))), 0;
}
function xx(e, n) {
  var t, a, s, o, h, l, v, c, d, A, C, y, k, B, P = 0, T, Z, U, $, L, Q, q, G, J = new jt.Buf8(4), ee, K, ie = (
    /* permutation of code lengths */
    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]
  );
  if (!e || !e.state || !e.output || !e.input && e.avail_in !== 0)
    return mn;
  t = e.state, t.mode === lr && (t.mode = Hf), h = e.next_out, s = e.output, v = e.avail_out, o = e.next_in, a = e.input, l = e.avail_in, c = t.hold, d = t.bits, A = l, C = v, G = wi;
  e:
    for (; ; )
      switch (t.mode) {
        case Tp:
          if (t.wrap === 0) {
            t.mode = Hf;
            break;
          }
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if (t.wrap & 2 && c === 35615) {
            t.check = 0, J[0] = c & 255, J[1] = c >>> 8 & 255, t.check = zn(t.check, J, 2, 0), c = 0, d = 0, t.mode = md;
            break;
          }
          if (t.flags = 0, t.head && (t.head.done = !1), !(t.wrap & 1) || /* check if zlib header allowed */
          (((c & 255) << 8) + (c >> 8)) % 31) {
            e.msg = "incorrect header check", t.mode = Qe;
            break;
          }
          if ((c & 15) !== Dd) {
            e.msg = "unknown compression method", t.mode = Qe;
            break;
          }
          if (c >>>= 4, d -= 4, q = (c & 15) + 8, t.wbits === 0)
            t.wbits = q;
          else if (q > t.wbits) {
            e.msg = "invalid window size", t.mode = Qe;
            break;
          }
          t.dmax = 1 << q, e.adler = t.check = 1, t.mode = c & 512 ? Sd : lr, c = 0, d = 0;
          break;
        case md:
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if (t.flags = c, (t.flags & 255) !== Dd) {
            e.msg = "unknown compression method", t.mode = Qe;
            break;
          }
          if (t.flags & 57344) {
            e.msg = "unknown header flags set", t.mode = Qe;
            break;
          }
          t.head && (t.head.text = c >> 8 & 1), t.flags & 512 && (J[0] = c & 255, J[1] = c >>> 8 & 255, t.check = zn(t.check, J, 2, 0)), c = 0, d = 0, t.mode = yd;
        case yd:
          for (; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          t.head && (t.head.time = c), t.flags & 512 && (J[0] = c & 255, J[1] = c >>> 8 & 255, J[2] = c >>> 16 & 255, J[3] = c >>> 24 & 255, t.check = zn(t.check, J, 4, 0)), c = 0, d = 0, t.mode = Ed;
        case Ed:
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          t.head && (t.head.xflags = c & 255, t.head.os = c >> 8), t.flags & 512 && (J[0] = c & 255, J[1] = c >>> 8 & 255, t.check = zn(t.check, J, 2, 0)), c = 0, d = 0, t.mode = Cd;
        case Cd:
          if (t.flags & 1024) {
            for (; d < 16; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            t.length = c, t.head && (t.head.extra_len = c), t.flags & 512 && (J[0] = c & 255, J[1] = c >>> 8 & 255, t.check = zn(t.check, J, 2, 0)), c = 0, d = 0;
          } else t.head && (t.head.extra = null);
          t.mode = xd;
        case xd:
          if (t.flags & 1024 && (y = t.length, y > l && (y = l), y && (t.head && (q = t.head.extra_len - t.length, t.head.extra || (t.head.extra = new Array(t.head.extra_len)), jt.arraySet(
            t.head.extra,
            a,
            o,
            // extra field is limited to 65536 bytes
            // - no need for additional size check
            y,
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            q
          )), t.flags & 512 && (t.check = zn(t.check, a, y, o)), l -= y, o += y, t.length -= y), t.length))
            break e;
          t.length = 0, t.mode = Ad;
        case Ad:
          if (t.flags & 2048) {
            if (l === 0)
              break e;
            y = 0;
            do
              q = a[o + y++], t.head && q && t.length < 65536 && (t.head.name += String.fromCharCode(q));
            while (q && y < l);
            if (t.flags & 512 && (t.check = zn(t.check, a, y, o)), l -= y, o += y, q)
              break e;
          } else t.head && (t.head.name = null);
          t.length = 0, t.mode = Fd;
        case Fd:
          if (t.flags & 4096) {
            if (l === 0)
              break e;
            y = 0;
            do
              q = a[o + y++], t.head && q && t.length < 65536 && (t.head.comment += String.fromCharCode(q));
            while (q && y < l);
            if (t.flags & 512 && (t.check = zn(t.check, a, y, o)), l -= y, o += y, q)
              break e;
          } else t.head && (t.head.comment = null);
          t.mode = Bd;
        case Bd:
          if (t.flags & 512) {
            for (; d < 16; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            if (c !== (t.check & 65535)) {
              e.msg = "header crc mismatch", t.mode = Qe;
              break;
            }
            c = 0, d = 0;
          }
          t.head && (t.head.hcrc = t.flags >> 9 & 1, t.head.done = !0), e.adler = t.check = 0, t.mode = lr;
          break;
        case Sd:
          for (; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          e.adler = t.check = Zd(c), c = 0, d = 0, t.mode = Ho;
        case Ho:
          if (t.havedict === 0)
            return e.next_out = h, e.avail_out = v, e.next_in = o, e.avail_in = l, t.hold = c, t.bits = d, gx;
          e.adler = t.check = 1, t.mode = lr;
        case lr:
          if (n === dx || n === Do)
            break e;
        case Hf:
          if (t.last) {
            c >>>= d & 7, d -= d & 7, t.mode = Wf;
            break;
          }
          for (; d < 3; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          switch (t.last = c & 1, c >>>= 1, d -= 1, c & 3) {
            case 0:
              t.mode = kd;
              break;
            case 1:
              if (Cx(t), t.mode = mo, n === Do) {
                c >>>= 2, d -= 2;
                break e;
              }
              break;
            case 2:
              t.mode = Td;
              break;
            case 3:
              e.msg = "invalid block type", t.mode = Qe;
          }
          c >>>= 2, d -= 2;
          break;
        case kd:
          for (c >>>= d & 7, d -= d & 7; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if ((c & 65535) !== (c >>> 16 ^ 65535)) {
            e.msg = "invalid stored block lengths", t.mode = Qe;
            break;
          }
          if (t.length = c & 65535, c = 0, d = 0, t.mode = Gf, n === Do)
            break e;
        case Gf:
          t.mode = Id;
        case Id:
          if (y = t.length, y) {
            if (y > l && (y = l), y > v && (y = v), y === 0)
              break e;
            jt.arraySet(s, a, o, y, h), l -= y, o += y, v -= y, h += y, t.length -= y;
            break;
          }
          t.mode = lr;
          break;
        case Td:
          for (; d < 14; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if (t.nlen = (c & 31) + 257, c >>>= 5, d -= 5, t.ndist = (c & 31) + 1, c >>>= 5, d -= 5, t.ncode = (c & 15) + 4, c >>>= 4, d -= 4, t.nlen > 286 || t.ndist > 30) {
            e.msg = "too many length or distance symbols", t.mode = Qe;
            break;
          }
          t.have = 0, t.mode = $d;
        case $d:
          for (; t.have < t.ncode; ) {
            for (; d < 3; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            t.lens[ie[t.have++]] = c & 7, c >>>= 3, d -= 3;
          }
          for (; t.have < 19; )
            t.lens[ie[t.have++]] = 0;
          if (t.lencode = t.lendyn, t.lenbits = 7, ee = { bits: t.lenbits }, G = Ha(cx, t.lens, 0, 19, t.lencode, 0, t.work, ee), t.lenbits = ee.bits, G) {
            e.msg = "invalid code lengths set", t.mode = Qe;
            break;
          }
          t.have = 0, t.mode = Rd;
        case Rd:
          for (; t.have < t.nlen + t.ndist; ) {
            for (; P = t.lencode[c & (1 << t.lenbits) - 1], T = P >>> 24, Z = P >>> 16 & 255, U = P & 65535, !(T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            if (U < 16)
              c >>>= T, d -= T, t.lens[t.have++] = U;
            else {
              if (U === 16) {
                for (K = T + 2; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[o++] << d, d += 8;
                }
                if (c >>>= T, d -= T, t.have === 0) {
                  e.msg = "invalid bit length repeat", t.mode = Qe;
                  break;
                }
                q = t.lens[t.have - 1], y = 3 + (c & 3), c >>>= 2, d -= 2;
              } else if (U === 17) {
                for (K = T + 3; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[o++] << d, d += 8;
                }
                c >>>= T, d -= T, q = 0, y = 3 + (c & 7), c >>>= 3, d -= 3;
              } else {
                for (K = T + 7; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[o++] << d, d += 8;
                }
                c >>>= T, d -= T, q = 0, y = 11 + (c & 127), c >>>= 7, d -= 7;
              }
              if (t.have + y > t.nlen + t.ndist) {
                e.msg = "invalid bit length repeat", t.mode = Qe;
                break;
              }
              for (; y--; )
                t.lens[t.have++] = q;
            }
          }
          if (t.mode === Qe)
            break;
          if (t.lens[256] === 0) {
            e.msg = "invalid code -- missing end-of-block", t.mode = Qe;
            break;
          }
          if (t.lenbits = 9, ee = { bits: t.lenbits }, G = Ha(Bp, t.lens, 0, t.nlen, t.lencode, 0, t.work, ee), t.lenbits = ee.bits, G) {
            e.msg = "invalid literal/lengths set", t.mode = Qe;
            break;
          }
          if (t.distbits = 6, t.distcode = t.distdyn, ee = { bits: t.distbits }, G = Ha(Sp, t.lens, t.nlen, t.ndist, t.distcode, 0, t.work, ee), t.distbits = ee.bits, G) {
            e.msg = "invalid distances set", t.mode = Qe;
            break;
          }
          if (t.mode = mo, n === Do)
            break e;
        case mo:
          t.mode = yo;
        case yo:
          if (l >= 6 && v >= 258) {
            e.next_out = h, e.avail_out = v, e.next_in = o, e.avail_in = l, t.hold = c, t.bits = d, hx(e, C), h = e.next_out, s = e.output, v = e.avail_out, o = e.next_in, a = e.input, l = e.avail_in, c = t.hold, d = t.bits, t.mode === lr && (t.back = -1);
            break;
          }
          for (t.back = 0; P = t.lencode[c & (1 << t.lenbits) - 1], T = P >>> 24, Z = P >>> 16 & 255, U = P & 65535, !(T <= d); ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if (Z && !(Z & 240)) {
            for ($ = T, L = Z, Q = U; P = t.lencode[Q + ((c & (1 << $ + L) - 1) >> $)], T = P >>> 24, Z = P >>> 16 & 255, U = P & 65535, !($ + T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            c >>>= $, d -= $, t.back += $;
          }
          if (c >>>= T, d -= T, t.back += T, t.length = U, Z === 0) {
            t.mode = Ud;
            break;
          }
          if (Z & 32) {
            t.back = -1, t.mode = lr;
            break;
          }
          if (Z & 64) {
            e.msg = "invalid literal/length code", t.mode = Qe;
            break;
          }
          t.extra = Z & 15, t.mode = Nd;
        case Nd:
          if (t.extra) {
            for (K = t.extra; d < K; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            t.length += c & (1 << t.extra) - 1, c >>>= t.extra, d -= t.extra, t.back += t.extra;
          }
          t.was = t.length, t.mode = Ld;
        case Ld:
          for (; P = t.distcode[c & (1 << t.distbits) - 1], T = P >>> 24, Z = P >>> 16 & 255, U = P & 65535, !(T <= d); ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if (!(Z & 240)) {
            for ($ = T, L = Z, Q = U; P = t.distcode[Q + ((c & (1 << $ + L) - 1) >> $)], T = P >>> 24, Z = P >>> 16 & 255, U = P & 65535, !($ + T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            c >>>= $, d -= $, t.back += $;
          }
          if (c >>>= T, d -= T, t.back += T, Z & 64) {
            e.msg = "invalid distance code", t.mode = Qe;
            break;
          }
          t.offset = U, t.extra = Z & 15, t.mode = Od;
        case Od:
          if (t.extra) {
            for (K = t.extra; d < K; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            t.offset += c & (1 << t.extra) - 1, c >>>= t.extra, d -= t.extra, t.back += t.extra;
          }
          if (t.offset > t.dmax) {
            e.msg = "invalid distance too far back", t.mode = Qe;
            break;
          }
          t.mode = Pd;
        case Pd:
          if (v === 0)
            break e;
          if (y = C - v, t.offset > y) {
            if (y = t.offset - y, y > t.whave && t.sane) {
              e.msg = "invalid distance too far back", t.mode = Qe;
              break;
            }
            y > t.wnext ? (y -= t.wnext, k = t.wsize - y) : k = t.wnext - y, y > t.length && (y = t.length), B = t.window;
          } else
            B = s, k = h - t.offset, y = t.length;
          y > v && (y = v), v -= y, t.length -= y;
          do
            s[h++] = B[k++];
          while (--y);
          t.length === 0 && (t.mode = yo);
          break;
        case Ud:
          if (v === 0)
            break e;
          s[h++] = t.length, v--, t.mode = yo;
          break;
        case Wf:
          if (t.wrap) {
            for (; d < 32; ) {
              if (l === 0)
                break e;
              l--, c |= a[o++] << d, d += 8;
            }
            if (C -= v, e.total_out += C, t.total += C, C && (e.adler = t.check = /*UPDATE(state.check, put - _out, _out);*/
            t.flags ? zn(t.check, s, C, h - C) : Al(t.check, s, C, h - C)), C = v, (t.flags ? c : Zd(c)) !== t.check) {
              e.msg = "incorrect data check", t.mode = Qe;
              break;
            }
            c = 0, d = 0;
          }
          t.mode = Md;
        case Md:
          if (t.wrap && t.flags) {
            for (; d < 32; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            if (c !== (t.total & 4294967295)) {
              e.msg = "incorrect length check", t.mode = Qe;
              break;
            }
            c = 0, d = 0;
          }
          t.mode = zd;
        case zd:
          G = px;
          break e;
        case Qe:
          G = kp;
          break e;
        case $p:
          return Ip;
        case wx:
        default:
          return mn;
      }
  return e.next_out = h, e.avail_out = v, e.next_in = o, e.avail_in = l, t.hold = c, t.bits = d, (t.wsize || C !== e.avail_out && t.mode < Qe && (t.mode < Wf || n !== vd)) && Pp(e, e.output, e.next_out, C - e.avail_out), A -= e.avail_in, C -= e.avail_out, e.total_in += A, e.total_out += C, t.total += C, t.wrap && C && (e.adler = t.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
  t.flags ? zn(t.check, s, C, e.next_out - C) : Al(t.check, s, C, e.next_out - C)), e.data_type = t.bits + (t.last ? 64 : 0) + (t.mode === lr ? 128 : 0) + (t.mode === mo || t.mode === Gf ? 256 : 0), (A === 0 && C === 0 || n === vd) && G === wi && (G = _x), G;
}
function Ax(e) {
  if (!e || !e.state)
    return mn;
  var n = e.state;
  return n.window && (n.window = null), e.state = null, wi;
}
function Fx(e, n) {
  var t;
  return !e || !e.state || (t = e.state, !(t.wrap & 2)) ? mn : (t.head = n, n.done = !1, wi);
}
function Bx(e, n) {
  var t = n.length, a, s, o;
  return !e || !e.state || (a = e.state, a.wrap !== 0 && a.mode !== Ho) ? mn : a.mode === Ho && (s = 1, s = Al(s, n, t, 0), s !== a.check) ? kp : (o = Pp(e, n, t, t), o ? (a.mode = $p, Ip) : (a.havedict = 1, wi));
}
$n.inflateReset = Np;
$n.inflateReset2 = Lp;
$n.inflateResetKeep = Rp;
$n.inflateInit = Ex;
$n.inflateInit2 = Op;
$n.inflate = xx;
$n.inflateEnd = Ax;
$n.inflateGetHeader = Fx;
$n.inflateSetDictionary = Bx;
$n.inflateInfo = "pako inflate (from Nodeca project)";
var Up = {
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
function Sx() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var kx = Sx, Ji = $n, Ga = vr, Oo = Ei, at = Up, Fl = th, Ix = Ap, Tx = kx, Mp = Object.prototype.toString;
function bi(e) {
  if (!(this instanceof bi)) return new bi(e);
  this.options = Ga.assign({
    chunkSize: 16384,
    windowBits: 0,
    to: ""
  }, e || {});
  var n = this.options;
  n.raw && n.windowBits >= 0 && n.windowBits < 16 && (n.windowBits = -n.windowBits, n.windowBits === 0 && (n.windowBits = -15)), n.windowBits >= 0 && n.windowBits < 16 && !(e && e.windowBits) && (n.windowBits += 32), n.windowBits > 15 && n.windowBits < 48 && (n.windowBits & 15 || (n.windowBits |= 15)), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Ix(), this.strm.avail_out = 0;
  var t = Ji.inflateInit2(
    this.strm,
    n.windowBits
  );
  if (t !== at.Z_OK)
    throw new Error(Fl[t]);
  if (this.header = new Tx(), Ji.inflateGetHeader(this.strm, this.header), n.dictionary && (typeof n.dictionary == "string" ? n.dictionary = Oo.string2buf(n.dictionary) : Mp.call(n.dictionary) === "[object ArrayBuffer]" && (n.dictionary = new Uint8Array(n.dictionary)), n.raw && (t = Ji.inflateSetDictionary(this.strm, n.dictionary), t !== at.Z_OK)))
    throw new Error(Fl[t]);
}
bi.prototype.push = function(e, n) {
  var t = this.strm, a = this.options.chunkSize, s = this.options.dictionary, o, h, l, v, c, d = !1;
  if (this.ended)
    return !1;
  h = n === ~~n ? n : n === !0 ? at.Z_FINISH : at.Z_NO_FLUSH, typeof e == "string" ? t.input = Oo.binstring2buf(e) : Mp.call(e) === "[object ArrayBuffer]" ? t.input = new Uint8Array(e) : t.input = e, t.next_in = 0, t.avail_in = t.input.length;
  do {
    if (t.avail_out === 0 && (t.output = new Ga.Buf8(a), t.next_out = 0, t.avail_out = a), o = Ji.inflate(t, at.Z_NO_FLUSH), o === at.Z_NEED_DICT && s && (o = Ji.inflateSetDictionary(this.strm, s)), o === at.Z_BUF_ERROR && d === !0 && (o = at.Z_OK, d = !1), o !== at.Z_STREAM_END && o !== at.Z_OK)
      return this.onEnd(o), this.ended = !0, !1;
    t.next_out && (t.avail_out === 0 || o === at.Z_STREAM_END || t.avail_in === 0 && (h === at.Z_FINISH || h === at.Z_SYNC_FLUSH)) && (this.options.to === "string" ? (l = Oo.utf8border(t.output, t.next_out), v = t.next_out - l, c = Oo.buf2string(t.output, l), t.next_out = v, t.avail_out = a - v, v && Ga.arraySet(t.output, t.output, l, v, 0), this.onData(c)) : this.onData(Ga.shrinkBuf(t.output, t.next_out))), t.avail_in === 0 && t.avail_out === 0 && (d = !0);
  } while ((t.avail_in > 0 || t.avail_out === 0) && o !== at.Z_STREAM_END);
  return o === at.Z_STREAM_END && (h = at.Z_FINISH), h === at.Z_FINISH ? (o = Ji.inflateEnd(this.strm), this.onEnd(o), this.ended = !0, o === at.Z_OK) : (h === at.Z_SYNC_FLUSH && (this.onEnd(at.Z_OK), t.avail_out = 0), !0);
};
bi.prototype.onData = function(e) {
  this.chunks.push(e);
};
bi.prototype.onEnd = function(e) {
  e === at.Z_OK && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = Ga.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
function rh(e, n) {
  var t = new bi(n);
  if (t.push(e, !0), t.err)
    throw t.msg || Fl[t.err];
  return t.result;
}
function $x(e, n) {
  return n = n || {}, n.raw = !0, rh(e, n);
}
mu.Inflate = bi;
mu.inflate = rh;
mu.inflateRaw = $x;
mu.ungzip = rh;
var Rx = vr.assign, Nx = bu, Lx = mu, Ox = Up, zp = {};
Rx(zp, Nx, Lx, Ox);
var Go = zp;
async function ih(e) {
  try {
    let n, t = 0, a = 0;
    const s = [];
    let o = 0, h;
    do {
      const v = e.subarray(t);
      if (h = new Go.Inflate(), { strm: n } = h, h.push(v, Go.Z_SYNC_FLUSH), h.err)
        throw new Error(h.msg);
      t += n.next_in, s[a] = h.result, o += s[a].length, a += 1;
    } while (n.avail_in);
    const l = new Uint8Array(o);
    for (let v = 0, c = 0; v < s.length; v++)
      l.set(s[v], c), c += s[v].length;
    return Jn.Buffer.from(l);
  } catch (n) {
    throw `${n}`.match(/incorrect header check/) ? new Error("problem decompressing block: incorrect gzip header check") : n;
  }
}
async function Px(e, n) {
  try {
    let t;
    const { minv: a, maxv: s } = n;
    let o = a.blockPosition, h = a.dataPosition;
    const l = [], v = [], c = [];
    let d = 0, A = 0;
    do {
      const k = e.subarray(o - a.blockPosition), B = new Go.Inflate();
      if ({ strm: t } = B, B.push(k, Go.Z_SYNC_FLUSH), B.err)
        throw new Error(B.msg);
      const P = B.result;
      l.push(P);
      let T = P.length;
      v.push(o), c.push(h), l.length === 1 && a.dataPosition && (l[0] = l[0].subarray(a.dataPosition), T = l[0].length);
      const Z = o;
      if (o += t.next_in, h += T, Z >= s.blockPosition) {
        l[A] = l[A].subarray(0, s.blockPosition === a.blockPosition ? s.dataPosition - a.dataPosition + 1 : s.dataPosition + 1), v.push(o), c.push(h), d += l[A].length;
        break;
      }
      d += l[A].length, A++;
    } while (t.avail_in);
    const C = new Uint8Array(d);
    for (let k = 0, B = 0; k < l.length; k++)
      C.set(l[k], B), B += l[k].length;
    return { buffer: Jn.Buffer.from(C), cpositions: v, dpositions: c };
  } catch (t) {
    throw `${t}`.match(/incorrect header check/) ? new Error("problem decompressing block: incorrect gzip header check") : t;
  }
}
var Ux = Ge, _n = null;
try {
  _n = new WebAssembly.Instance(new WebAssembly.Module(new Uint8Array([
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
function Ge(e, n, t) {
  this.low = e | 0, this.high = n | 0, this.unsigned = !!t;
}
Ge.prototype.__isLong__;
Object.defineProperty(Ge.prototype, "__isLong__", { value: !0 });
function Ht(e) {
  return (e && e.__isLong__) === !0;
}
Ge.isLong = Ht;
var Hd = {}, Gd = {};
function Ci(e, n) {
  var t, a, s;
  return n ? (e >>>= 0, (s = 0 <= e && e < 256) && (a = Gd[e], a) ? a : (t = We(e, (e | 0) < 0 ? -1 : 0, !0), s && (Gd[e] = t), t)) : (e |= 0, (s = -128 <= e && e < 128) && (a = Hd[e], a) ? a : (t = We(e, e < 0 ? -1 : 0, !1), s && (Hd[e] = t), t));
}
Ge.fromInt = Ci;
function wn(e, n) {
  if (isNaN(e))
    return n ? fi : bn;
  if (n) {
    if (e < 0)
      return fi;
    if (e >= Zp)
      return Gp;
  } else {
    if (e <= -Vd)
      return zt;
    if (e + 1 >= Vd)
      return Hp;
  }
  return e < 0 ? wn(-e, n).neg() : We(e % ra | 0, e / ra | 0, n);
}
Ge.fromNumber = wn;
function We(e, n, t) {
  return new Ge(e, n, t);
}
Ge.fromBits = We;
var Wo = Math.pow;
function ah(e, n, t) {
  if (e.length === 0)
    throw Error("empty string");
  if (e === "NaN" || e === "Infinity" || e === "+Infinity" || e === "-Infinity")
    return bn;
  if (typeof n == "number" ? (t = n, n = !1) : n = !!n, t = t || 10, t < 2 || 36 < t)
    throw RangeError("radix");
  var a;
  if ((a = e.indexOf("-")) > 0)
    throw Error("interior hyphen");
  if (a === 0)
    return ah(e.substring(1), n, t).neg();
  for (var s = wn(Wo(t, 8)), o = bn, h = 0; h < e.length; h += 8) {
    var l = Math.min(8, e.length - h), v = parseInt(e.substring(h, h + l), t);
    if (l < 8) {
      var c = wn(Wo(t, l));
      o = o.mul(c).add(wn(v));
    } else
      o = o.mul(s), o = o.add(wn(v));
  }
  return o.unsigned = n, o;
}
Ge.fromString = ah;
function Rn(e, n) {
  return typeof e == "number" ? wn(e, n) : typeof e == "string" ? ah(e, n) : We(e.low, e.high, typeof n == "boolean" ? n : e.unsigned);
}
Ge.fromValue = Rn;
var Wd = 65536, Mx = 1 << 24, ra = Wd * Wd, Zp = ra * ra, Vd = Zp / 2, Xd = Ci(Mx), bn = Ci(0);
Ge.ZERO = bn;
var fi = Ci(0, !0);
Ge.UZERO = fi;
var Ki = Ci(1);
Ge.ONE = Ki;
var qp = Ci(1, !0);
Ge.UONE = qp;
var Bl = Ci(-1);
Ge.NEG_ONE = Bl;
var Hp = We(-1, 2147483647, !1);
Ge.MAX_VALUE = Hp;
var Gp = We(-1, -1, !0);
Ge.MAX_UNSIGNED_VALUE = Gp;
var zt = We(0, -2147483648, !1);
Ge.MIN_VALUE = zt;
var te = Ge.prototype;
te.toInt = function() {
  return this.unsigned ? this.low >>> 0 : this.low;
};
te.toNumber = function() {
  return this.unsigned ? (this.high >>> 0) * ra + (this.low >>> 0) : this.high * ra + (this.low >>> 0);
};
te.toString = function(n) {
  if (n = n || 10, n < 2 || 36 < n)
    throw RangeError("radix");
  if (this.isZero())
    return "0";
  if (this.isNegative())
    if (this.eq(zt)) {
      var t = wn(n), a = this.div(t), s = a.mul(t).sub(this);
      return a.toString(n) + s.toInt().toString(n);
    } else
      return "-" + this.neg().toString(n);
  for (var o = wn(Wo(n, 6), this.unsigned), h = this, l = ""; ; ) {
    var v = h.div(o), c = h.sub(v.mul(o)).toInt() >>> 0, d = c.toString(n);
    if (h = v, h.isZero())
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
    return this.eq(zt) ? 64 : this.neg().getNumBitsAbs();
  for (var n = this.high != 0 ? this.high : this.low, t = 31; t > 0 && !(n & 1 << t); t--)
    ;
  return this.high != 0 ? t + 33 : t + 1;
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
te.equals = function(n) {
  return Ht(n) || (n = Rn(n)), this.unsigned !== n.unsigned && this.high >>> 31 === 1 && n.high >>> 31 === 1 ? !1 : this.high === n.high && this.low === n.low;
};
te.eq = te.equals;
te.notEquals = function(n) {
  return !this.eq(
    /* validates */
    n
  );
};
te.neq = te.notEquals;
te.ne = te.notEquals;
te.lessThan = function(n) {
  return this.comp(
    /* validates */
    n
  ) < 0;
};
te.lt = te.lessThan;
te.lessThanOrEqual = function(n) {
  return this.comp(
    /* validates */
    n
  ) <= 0;
};
te.lte = te.lessThanOrEqual;
te.le = te.lessThanOrEqual;
te.greaterThan = function(n) {
  return this.comp(
    /* validates */
    n
  ) > 0;
};
te.gt = te.greaterThan;
te.greaterThanOrEqual = function(n) {
  return this.comp(
    /* validates */
    n
  ) >= 0;
};
te.gte = te.greaterThanOrEqual;
te.ge = te.greaterThanOrEqual;
te.compare = function(n) {
  if (Ht(n) || (n = Rn(n)), this.eq(n))
    return 0;
  var t = this.isNegative(), a = n.isNegative();
  return t && !a ? -1 : !t && a ? 1 : this.unsigned ? n.high >>> 0 > this.high >>> 0 || n.high === this.high && n.low >>> 0 > this.low >>> 0 ? -1 : 1 : this.sub(n).isNegative() ? -1 : 1;
};
te.comp = te.compare;
te.negate = function() {
  return !this.unsigned && this.eq(zt) ? zt : this.not().add(Ki);
};
te.neg = te.negate;
te.add = function(n) {
  Ht(n) || (n = Rn(n));
  var t = this.high >>> 16, a = this.high & 65535, s = this.low >>> 16, o = this.low & 65535, h = n.high >>> 16, l = n.high & 65535, v = n.low >>> 16, c = n.low & 65535, d = 0, A = 0, C = 0, y = 0;
  return y += o + c, C += y >>> 16, y &= 65535, C += s + v, A += C >>> 16, C &= 65535, A += a + l, d += A >>> 16, A &= 65535, d += t + h, d &= 65535, We(C << 16 | y, d << 16 | A, this.unsigned);
};
te.subtract = function(n) {
  return Ht(n) || (n = Rn(n)), this.add(n.neg());
};
te.sub = te.subtract;
te.multiply = function(n) {
  if (this.isZero())
    return bn;
  if (Ht(n) || (n = Rn(n)), _n) {
    var t = _n.mul(
      this.low,
      this.high,
      n.low,
      n.high
    );
    return We(t, _n.get_high(), this.unsigned);
  }
  if (n.isZero())
    return bn;
  if (this.eq(zt))
    return n.isOdd() ? zt : bn;
  if (n.eq(zt))
    return this.isOdd() ? zt : bn;
  if (this.isNegative())
    return n.isNegative() ? this.neg().mul(n.neg()) : this.neg().mul(n).neg();
  if (n.isNegative())
    return this.mul(n.neg()).neg();
  if (this.lt(Xd) && n.lt(Xd))
    return wn(this.toNumber() * n.toNumber(), this.unsigned);
  var a = this.high >>> 16, s = this.high & 65535, o = this.low >>> 16, h = this.low & 65535, l = n.high >>> 16, v = n.high & 65535, c = n.low >>> 16, d = n.low & 65535, A = 0, C = 0, y = 0, k = 0;
  return k += h * d, y += k >>> 16, k &= 65535, y += o * d, C += y >>> 16, y &= 65535, y += h * c, C += y >>> 16, y &= 65535, C += s * d, A += C >>> 16, C &= 65535, C += o * c, A += C >>> 16, C &= 65535, C += h * v, A += C >>> 16, C &= 65535, A += a * d + s * c + o * v + h * l, A &= 65535, We(y << 16 | k, A << 16 | C, this.unsigned);
};
te.mul = te.multiply;
te.divide = function(n) {
  if (Ht(n) || (n = Rn(n)), n.isZero())
    throw Error("division by zero");
  if (_n) {
    if (!this.unsigned && this.high === -2147483648 && n.low === -1 && n.high === -1)
      return this;
    var t = (this.unsigned ? _n.div_u : _n.div_s)(
      this.low,
      this.high,
      n.low,
      n.high
    );
    return We(t, _n.get_high(), this.unsigned);
  }
  if (this.isZero())
    return this.unsigned ? fi : bn;
  var a, s, o;
  if (this.unsigned) {
    if (n.unsigned || (n = n.toUnsigned()), n.gt(this))
      return fi;
    if (n.gt(this.shru(1)))
      return qp;
    o = fi;
  } else {
    if (this.eq(zt)) {
      if (n.eq(Ki) || n.eq(Bl))
        return zt;
      if (n.eq(zt))
        return Ki;
      var h = this.shr(1);
      return a = h.div(n).shl(1), a.eq(bn) ? n.isNegative() ? Ki : Bl : (s = this.sub(n.mul(a)), o = a.add(s.div(n)), o);
    } else if (n.eq(zt))
      return this.unsigned ? fi : bn;
    if (this.isNegative())
      return n.isNegative() ? this.neg().div(n.neg()) : this.neg().div(n).neg();
    if (n.isNegative())
      return this.div(n.neg()).neg();
    o = bn;
  }
  for (s = this; s.gte(n); ) {
    a = Math.max(1, Math.floor(s.toNumber() / n.toNumber()));
    for (var l = Math.ceil(Math.log(a) / Math.LN2), v = l <= 48 ? 1 : Wo(2, l - 48), c = wn(a), d = c.mul(n); d.isNegative() || d.gt(s); )
      a -= v, c = wn(a, this.unsigned), d = c.mul(n);
    c.isZero() && (c = Ki), o = o.add(c), s = s.sub(d);
  }
  return o;
};
te.div = te.divide;
te.modulo = function(n) {
  if (Ht(n) || (n = Rn(n)), _n) {
    var t = (this.unsigned ? _n.rem_u : _n.rem_s)(
      this.low,
      this.high,
      n.low,
      n.high
    );
    return We(t, _n.get_high(), this.unsigned);
  }
  return this.sub(this.div(n).mul(n));
};
te.mod = te.modulo;
te.rem = te.modulo;
te.not = function() {
  return We(~this.low, ~this.high, this.unsigned);
};
te.and = function(n) {
  return Ht(n) || (n = Rn(n)), We(this.low & n.low, this.high & n.high, this.unsigned);
};
te.or = function(n) {
  return Ht(n) || (n = Rn(n)), We(this.low | n.low, this.high | n.high, this.unsigned);
};
te.xor = function(n) {
  return Ht(n) || (n = Rn(n)), We(this.low ^ n.low, this.high ^ n.high, this.unsigned);
};
te.shiftLeft = function(n) {
  return Ht(n) && (n = n.toInt()), (n &= 63) === 0 ? this : n < 32 ? We(this.low << n, this.high << n | this.low >>> 32 - n, this.unsigned) : We(0, this.low << n - 32, this.unsigned);
};
te.shl = te.shiftLeft;
te.shiftRight = function(n) {
  return Ht(n) && (n = n.toInt()), (n &= 63) === 0 ? this : n < 32 ? We(this.low >>> n | this.high << 32 - n, this.high >> n, this.unsigned) : We(this.high >> n - 32, this.high >= 0 ? 0 : -1, this.unsigned);
};
te.shr = te.shiftRight;
te.shiftRightUnsigned = function(n) {
  if (Ht(n) && (n = n.toInt()), n &= 63, n === 0)
    return this;
  var t = this.high;
  if (n < 32) {
    var a = this.low;
    return We(a >>> n | t << 32 - n, t >>> n, this.unsigned);
  } else return n === 32 ? We(t, 0, this.unsigned) : We(t >>> n - 32, 0, this.unsigned);
};
te.shru = te.shiftRightUnsigned;
te.shr_u = te.shiftRightUnsigned;
te.toSigned = function() {
  return this.unsigned ? We(this.low, this.high, !1) : this;
};
te.toUnsigned = function() {
  return this.unsigned ? this : We(this.low, this.high, !0);
};
te.toBytes = function(n) {
  return n ? this.toBytesLE() : this.toBytesBE();
};
te.toBytesLE = function() {
  var n = this.high, t = this.low;
  return [
    t & 255,
    t >>> 8 & 255,
    t >>> 16 & 255,
    t >>> 24,
    n & 255,
    n >>> 8 & 255,
    n >>> 16 & 255,
    n >>> 24
  ];
};
te.toBytesBE = function() {
  var n = this.high, t = this.low;
  return [
    n >>> 24,
    n >>> 16 & 255,
    n >>> 8 & 255,
    n & 255,
    t >>> 24,
    t >>> 16 & 255,
    t >>> 8 & 255,
    t & 255
  ];
};
Ge.fromBytes = function(n, t, a) {
  return a ? Ge.fromBytesLE(n, t) : Ge.fromBytesBE(n, t);
};
Ge.fromBytesLE = function(n, t) {
  return new Ge(
    n[0] | n[1] << 8 | n[2] << 16 | n[3] << 24,
    n[4] | n[5] << 8 | n[6] << 16 | n[7] << 24,
    t
  );
};
Ge.fromBytesBE = function(n, t) {
  return new Ge(
    n[4] << 24 | n[5] << 16 | n[6] << 8 | n[7],
    n[0] << 24 | n[1] << 16 | n[2] << 8 | n[3],
    t
  );
};
var Wp = /* @__PURE__ */ Jo(Ux);
function Vp(e) {
  if (e.greaterThan(Number.MAX_SAFE_INTEGER) || e.lessThan(Number.MIN_SAFE_INTEGER))
    throw new Error("integer overflow");
  return e.toNumber();
}
let zx = class extends Error {
};
function Wi(e) {
  if (e && e.aborted) {
    if (typeof DOMException < "u")
      throw new DOMException("aborted", "AbortError");
    {
      const n = new zx("aborted");
      throw n.code = "ERR_ABORTED", n;
    }
  }
}
function Zx(e, n) {
  return n.minv.blockPosition - e.maxv.blockPosition < 65e3 && n.maxv.blockPosition - e.minv.blockPosition < 5e6;
}
function Xp(e, n) {
  const t = [];
  let a = null;
  return e.length === 0 ? e : (e.sort(function(s, o) {
    const h = s.minv.blockPosition - o.minv.blockPosition;
    return h !== 0 ? h : s.minv.dataPosition - o.minv.dataPosition;
  }), e.forEach((s) => {
    (!n || s.maxv.compareTo(n) > 0) && (a === null ? (t.push(s), a = s) : Zx(a, s) ? s.maxv.compareTo(a.maxv) > 0 && (a.maxv = s.maxv) : (t.push(s), a = s));
  }), t);
}
class uh {
  constructor(n, t) {
    this.blockPosition = n, this.dataPosition = t;
  }
  toString() {
    return `${this.blockPosition}:${this.dataPosition}`;
  }
  compareTo(n) {
    return this.blockPosition - n.blockPosition || this.dataPosition - n.dataPosition;
  }
}
function ji(e, n = 0, t = !1) {
  if (t)
    throw new Error("big-endian virtual file offsets not implemented");
  return new uh(e[n + 7] * 1099511627776 + e[n + 6] * 4294967296 + e[n + 5] * 16777216 + e[n + 4] * 65536 + e[n + 3] * 256 + e[n + 2], e[n + 1] << 8 | e[n]);
}
class Vo {
  constructor(n, t, a, s = void 0) {
    this.minv = n, this.maxv = t, this.bin = a, this._fetchedSize = s;
  }
  toUniqueString() {
    return `${this.minv}..${this.maxv} (bin ${this.bin}, fetchedSize ${this.fetchedSize()})`;
  }
  toString() {
    return this.toUniqueString();
  }
  compareTo(n) {
    return this.minv.compareTo(n.minv) || this.maxv.compareTo(n.maxv) || this.bin - n.bin;
  }
  fetchedSize() {
    return this._fetchedSize !== void 0 ? this._fetchedSize : this.maxv.blockPosition + 65536 - this.minv.blockPosition;
  }
}
class Kp {
  constructor({ filehandle: n, renameRefSeqs: t = (a) => a }) {
    this.filehandle = n, this.renameRefSeq = t;
  }
  async getMetadata(n = {}) {
    const { indices: t, ...a } = await this.parse(n);
    return a;
  }
  _findFirstData(n, t) {
    return n ? n.compareTo(t) > 0 ? t : n : t;
  }
  async parse(n = {}) {
    return this.parseP || (this.parseP = this._parse(n).catch((t) => {
      throw this.parseP = void 0, t;
    })), this.parseP;
  }
  async hasRefSeq(n, t = {}) {
    var a;
    return !!(!((a = (await this.parse(t)).indices[n]) === null || a === void 0) && a.binIndex);
  }
}
const qx = 21578324, Kd = 14;
function Hx(e, n) {
  return e += 1, n -= 1, [
    [0, 0],
    [1 + (e >> 26), 1 + (n >> 26)],
    [9 + (e >> 23), 9 + (n >> 23)],
    [73 + (e >> 20), 73 + (n >> 20)],
    [585 + (e >> 17), 585 + (n >> 17)],
    [4681 + (e >> 14), 4681 + (n >> 14)]
  ];
}
class Ta extends Kp {
  async lineCount(n, t = {}) {
    const a = await this.parse(t), s = a.refNameToId[n];
    if (s === void 0 || !a.indices[s])
      return -1;
    const { stats: h } = a.indices[s];
    return h ? h.lineCount : -1;
  }
  // fetch and parse the index
  async _parse(n = {}) {
    const t = await this.filehandle.readFile(n), a = await ih(t);
    if (Wi(n.signal), a.readUInt32LE(0) !== qx)
      throw new Error("Not a TBI file");
    const s = a.readInt32LE(4), o = a.readInt32LE(8), h = o & 65536 ? "zero-based-half-open" : "1-based-closed", v = {
      0: "generic",
      1: "SAM",
      2: "VCF"
    }[o & 15];
    if (!v)
      throw new Error(`invalid Tabix preset format flags ${o}`);
    const c = {
      ref: a.readInt32LE(12),
      start: a.readInt32LE(16),
      end: a.readInt32LE(20)
    }, d = a.readInt32LE(24), A = 5, C = ((1 << (A + 1) * 3) - 1) / 7, y = 2 ** (14 + A * 3), k = d ? String.fromCharCode(d) : null, B = a.readInt32LE(28), P = a.readInt32LE(32), { refNameToId: T, refIdToName: Z } = this._parseNameBytes(a.slice(36, 36 + P));
    let U = 36 + P, $;
    return {
      indices: new Array(s).fill(0).map(() => {
        const Q = a.readInt32LE(U);
        U += 4;
        const q = {};
        let G;
        for (let K = 0; K < Q; K += 1) {
          const ie = a.readUInt32LE(U);
          if (U += 4, ie > C + 1)
            throw new Error("tabix index contains too many bins, please use a CSI index");
          if (ie === C + 1) {
            const Ce = a.readInt32LE(U);
            U += 4, Ce === 2 && (G = this.parsePseudoBin(a, U)), U += 16 * Ce;
          } else {
            const Ce = a.readInt32LE(U);
            U += 4;
            const ve = new Array(Ce);
            for (let Me = 0; Me < Ce; Me += 1) {
              const Oe = ji(a, U), ce = ji(a, U + 8);
              U += 16, $ = this._findFirstData($, Oe), ve[Me] = new Vo(Oe, ce, ie);
            }
            q[ie] = ve;
          }
        }
        const J = a.readInt32LE(U);
        U += 4;
        const ee = new Array(J);
        for (let K = 0; K < J; K += 1)
          ee[K] = ji(a, U), U += 8, $ = this._findFirstData($, ee[K]);
        return { binIndex: q, linearIndex: ee, stats: G };
      }),
      metaChar: k,
      maxBinNumber: C,
      maxRefLength: y,
      skipLines: B,
      firstDataLine: $,
      columnNumbers: c,
      coordinateType: h,
      format: v,
      refIdToName: Z,
      refNameToId: T,
      maxBlockSize: 65536
    };
  }
  parsePseudoBin(n, t) {
    return { lineCount: Vp(Wp.fromBytesLE(n.slice(t + 16, t + 24), !0)) };
  }
  _parseNameBytes(n) {
    let t = 0, a = 0;
    const s = [], o = {};
    for (let h = 0; h < n.length; h += 1)
      if (!n[h]) {
        if (a < h) {
          let l = n.toString("utf8", a, h);
          l = this.renameRefSeq(l), s[t] = l, o[l] = t;
        }
        a = h + 1, t += 1;
      }
    return { refNameToId: o, refIdToName: s };
  }
  async blocksForRange(n, t, a, s = {}) {
    t < 0 && (t = 0);
    const o = await this.parse(s), h = o.refNameToId[n];
    if (h === void 0)
      return [];
    const l = o.indices[h];
    if (!l)
      return [];
    (l.linearIndex.length ? l.linearIndex[t >> Kd >= l.linearIndex.length ? l.linearIndex.length - 1 : t >> Kd] : new uh(0, 0)) || console.warn("querying outside of possible tabix range");
    const c = Hx(t, a), d = [];
    for (const [B, P] of c)
      for (let T = B; T <= P; T++)
        if (l.binIndex[T])
          for (const Z of l.binIndex[T])
            d.push(new Vo(Z.minv, Z.maxv, T));
    const A = l.linearIndex.length;
    let C = null;
    const y = Math.min(t >> 14, A - 1), k = Math.min(a >> 14, A - 1);
    for (let B = y; B <= k; ++B) {
      const P = l.linearIndex[B];
      P && (!C || P.compareTo(C) < 0) && (C = P);
    }
    return Xp(d, C);
  }
}
const Gx = 21582659, Wx = 38359875;
function Vx(e, n) {
  return e * 2 ** n;
}
function Yd(e, n) {
  return Math.floor(e / 2 ** n);
}
class Kf extends Kp {
  constructor(n) {
    super(n), this.maxBinNumber = 0, this.depth = 0, this.minShift = 0;
  }
  async lineCount(n, t = {}) {
    const a = await this.parse(t), s = a.refNameToId[n];
    if (s === void 0 || !a.indices[s])
      return -1;
    const { stats: h } = a.indices[s];
    return h ? h.lineCount : -1;
  }
  indexCov() {
    throw new Error("CSI indexes do not support indexcov");
  }
  parseAuxData(n, t) {
    const a = n.readInt32LE(t), s = a & 65536 ? "zero-based-half-open" : "1-based-closed", o = { 0: "generic", 1: "SAM", 2: "VCF" }[a & 15];
    if (!o)
      throw new Error(`invalid Tabix preset format flags ${a}`);
    const h = {
      ref: n.readInt32LE(t + 4),
      start: n.readInt32LE(t + 8),
      end: n.readInt32LE(t + 12)
    }, l = n.readInt32LE(t + 16), v = l ? String.fromCharCode(l) : null, c = n.readInt32LE(t + 20), d = n.readInt32LE(t + 24), { refIdToName: A, refNameToId: C } = this._parseNameBytes(n.slice(t + 28, t + 28 + d));
    return {
      refIdToName: A,
      refNameToId: C,
      skipLines: c,
      metaChar: v,
      columnNumbers: h,
      format: o,
      coordinateType: s
    };
  }
  _parseNameBytes(n) {
    let t = 0, a = 0;
    const s = [], o = {};
    for (let h = 0; h < n.length; h += 1)
      if (!n[h]) {
        if (a < h) {
          let l = n.toString("utf8", a, h);
          l = this.renameRefSeq(l), s[t] = l, o[l] = t;
        }
        a = h + 1, t += 1;
      }
    return { refNameToId: o, refIdToName: s };
  }
  // fetch and parse the index
  async _parse(n = {}) {
    const t = await ih(await this.filehandle.readFile(n));
    let a;
    if (t.readUInt32LE(0) === Gx)
      a = 1;
    else if (t.readUInt32LE(0) === Wx)
      a = 2;
    else
      throw new Error("Not a CSI file");
    this.minShift = t.readInt32LE(4), this.depth = t.readInt32LE(8), this.maxBinNumber = ((1 << (this.depth + 1) * 3) - 1) / 7;
    const s = 2 ** (this.minShift + this.depth * 3), o = t.readInt32LE(12), h = o && o >= 30 ? this.parseAuxData(t, 16) : {
      refIdToName: [],
      refNameToId: {},
      metaChar: null,
      columnNumbers: { ref: 0, start: 1, end: 2 },
      coordinateType: "zero-based-half-open",
      format: "generic"
    }, l = t.readInt32LE(16 + o);
    let v, c = 16 + o + 4;
    const d = new Array(l).fill(0).map(() => {
      const A = t.readInt32LE(c);
      c += 4;
      const C = {};
      let y;
      for (let k = 0; k < A; k += 1) {
        const B = t.readUInt32LE(c);
        if (B > this.maxBinNumber)
          y = this.parsePseudoBin(t, c + 4), c += 48;
        else {
          const P = ji(t, c + 4);
          v = this._findFirstData(v, P);
          const T = t.readInt32LE(c + 12);
          c += 16;
          const Z = new Array(T);
          for (let U = 0; U < T; U += 1) {
            const $ = ji(t, c), L = ji(t, c + 8);
            c += 16, Z[U] = new Vo($, L, B);
          }
          C[B] = Z;
        }
      }
      return { binIndex: C, stats: y };
    });
    return {
      ...h,
      csi: !0,
      refCount: l,
      maxBlockSize: 65536,
      firstDataLine: v,
      csiVersion: a,
      indices: d,
      depth: this.depth,
      maxBinNumber: this.maxBinNumber,
      maxRefLength: s
    };
  }
  parsePseudoBin(n, t) {
    return { lineCount: Vp(Wp.fromBytesLE(n.slice(t + 28, t + 36), !0)) };
  }
  async blocksForRange(n, t, a, s = {}) {
    t < 0 && (t = 0);
    const o = await this.parse(s), h = o.refNameToId[n];
    if (h === void 0)
      return [];
    const l = o.indices[h];
    if (!l)
      return [];
    const v = this.reg2bins(t, a), c = [];
    for (const [d, A] of v)
      for (let C = d; C <= A; C++)
        if (l.binIndex[C])
          for (const y of l.binIndex[C])
            c.push(new Vo(y.minv, y.maxv, C));
    return Xp(c, new uh(0, 0));
  }
  /**
   * calculate the list of bins that may overlap with region [beg,end) (zero-based half-open)
   */
  reg2bins(n, t) {
    n -= 1, n < 1 && (n = 1), t > 2 ** 50 && (t = 2 ** 34), t -= 1;
    let a = 0, s = 0, o = this.minShift + this.depth * 3;
    const h = [];
    for (; a <= this.depth; o -= 3, s += Vx(1, a * 3), a += 1) {
      const l = s + Yd(n, o), v = s + Yd(t, o);
      if (v - l + h.length > this.maxBinNumber)
        throw new Error(`query ${n}-${t} is too large for current binning scheme (shift ${this.minShift}, depth ${this.depth}), try a smaller query or a coarser index binning scheme`);
      h.push([l, v]);
    }
    return h;
  }
}
const Yf = typeof TextDecoder < "u" ? new TextDecoder("utf8") : void 0;
function Xx(e) {
  return new Promise((n) => setTimeout(n, e));
}
class Kx {
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
   * @param {number} [args.yieldTime] yield to main thread after N milliseconds
   * if reading features is taking a long time to avoid hanging main thread
   *
   * @param {function} [args.renameRefSeqs] optional function with sig `string
   * => string` to transform reference sequence names for the purpose of
   * indexing and querying. note that the data that is returned is not altered,
   * just the names of the reference sequences that are used for querying.
   */
  constructor({ path: n, filehandle: t, url: a, tbiPath: s, tbiUrl: o, tbiFilehandle: h, csiPath: l, csiUrl: v, csiFilehandle: c, yieldTime: d = 500, renameRefSeqs: A = (y) => y, chunkCacheSize: C = 5 * 2 ** 20 }) {
    if (t)
      this.filehandle = t;
    else if (n)
      this.filehandle = new La(n);
    else if (a)
      this.filehandle = new wr(a);
    else
      throw new TypeError("must provide either filehandle or path");
    if (h)
      this.index = new Ta({
        filehandle: h,
        renameRefSeqs: A
      });
    else if (c)
      this.index = new Kf({
        filehandle: c,
        renameRefSeqs: A
      });
    else if (s)
      this.index = new Ta({
        filehandle: new La(s),
        renameRefSeqs: A
      });
    else if (l)
      this.index = new Kf({
        filehandle: new La(l),
        renameRefSeqs: A
      });
    else if (n)
      this.index = new Ta({
        filehandle: new La(`${n}.tbi`),
        renameRefSeqs: A
      });
    else if (v)
      this.index = new Kf({
        filehandle: new wr(v)
      });
    else if (o)
      this.index = new Ta({
        filehandle: new wr(o)
      });
    else if (a)
      this.index = new Ta({
        filehandle: new wr(`${a}.tbi`)
      });
    else
      throw new TypeError("must provide one of tbiFilehandle, tbiPath, csiFilehandle, csiPath, tbiUrl, csiUrl");
    this.renameRefSeq = A, this.yieldTime = d, this.chunkCache = new Ya({
      cache: new j1({ maxSize: Math.floor(C / 65536) }),
      fill: (y, k) => this.readChunk(y, { signal: k })
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
  async getLines(n, t, a, s) {
    var o;
    let h, l = {}, v;
    typeof s == "function" ? v = s : (l = s, v = s.lineCallback, h = s.signal);
    const c = await this.index.getMetadata(l);
    Wi(h);
    const d = t ?? 0, A = a ?? c.maxRefLength;
    if (!(d <= A))
      throw new TypeError("invalid start and end coordinates. start must be less than or equal to end");
    if (d === A)
      return;
    const C = await this.index.blocksForRange(n, d, A, l);
    Wi(h);
    let y = Date.now();
    for (const k of C) {
      let B;
      const { buffer: P, cpositions: T, dpositions: Z } = await this.chunkCache.get(k.toString(), k, h);
      Wi(h);
      let U = 0, $ = 0;
      for (; U < P.length; ) {
        const L = P.indexOf(`
`, U);
        if (L === -1)
          break;
        const Q = P.slice(U, L), q = (o = Yf == null ? void 0 : Yf.decode(Q)) !== null && o !== void 0 ? o : Q.toString();
        if (Z) {
          for (; U + k.minv.dataPosition >= Z[$++]; )
            ;
          $--;
        }
        const { startCoordinate: G, overlaps: J } = this.checkLine(c, n, d, A, q);
        if (B !== void 0 && G !== void 0 && B > G)
          throw new Error(`Lines not sorted by start coordinate (${B} > ${G}), this file is not usable with Tabix.`);
        if (B = G, J)
          v(
            q.trim(),
            // cpositions[pos] refers to actual file offset of a bgzip block boundaries
            //
            // we multiply by (1 <<8) in order to make sure each block has a "unique"
            // address space so that data in that block could never overlap
            //
            // then the blockStart-dpositions is an uncompressed file offset from
            // that bgzip block boundary, and since the cpositions are multiplied by
            // (1 << 8) these uncompressed offsets get a unique space
            T[$] * 256 + (U - Z[$]) + k.minv.dataPosition + 1
          );
        else if (G !== void 0 && G >= A)
          return;
        this.yieldTime && y - Date.now() > this.yieldTime && (y = Date.now(), Wi(h), await Xx(1)), U = L + 1;
      }
    }
  }
  async getMetadata(n = {}) {
    return this.index.getMetadata(n);
  }
  /**
   * get a buffer containing the "header" region of the file, which are the
   * bytes up to the first non-meta line
   */
  async getHeaderBuffer(n = {}) {
    const { firstDataLine: t, metaChar: a, maxBlockSize: s } = await this.getMetadata(n);
    Wi(n.signal);
    const o = ((t == null ? void 0 : t.blockPosition) || 0) + s, h = await this._readRegion(0, o, n), l = await ih(h);
    if (a) {
      let v = -1;
      const c = 10, d = a.charCodeAt(0);
      for (let A = 0; A < l.length && !(A === v + 1 && l[A] !== d); A += 1)
        l[A] === c && (v = A);
      return l.slice(0, v + 1);
    }
    return l;
  }
  /**
   * get a string containing the "header" region of the file, is the portion up
   * to the first non-meta line
   *
   * @returns {Promise} for a string
   */
  async getHeader(n = {}) {
    return (await this.getHeaderBuffer(n)).toString("utf8");
  }
  /**
   * get an array of reference sequence names, in the order in which they occur
   * in the file. reference sequence renaming is not applied to these names.
   */
  async getReferenceSequenceNames(n = {}) {
    return (await this.getMetadata(n)).refIdToName;
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
  checkLine(n, t, a, s, o) {
    const { columnNumbers: h, metaChar: l, coordinateType: v, format: c } = n;
    if (l && o.startsWith(l))
      return { overlaps: !1 };
    let { ref: d, start: A, end: C } = h;
    d || (d = 0), A || (A = 0), C || (C = 0), c === "VCF" && (C = 8);
    const y = Math.max(d, A, C);
    let k = 1, B = 0, P = "", T = -1 / 0;
    for (let Z = 0; Z < o.length + 1; Z += 1)
      if (o[Z] === "	" || Z === o.length) {
        if (k === d) {
          if (this.renameRefSeq(o.slice(B, Z)) !== t)
            return { overlaps: !1 };
        } else if (k === A) {
          if (T = parseInt(o.slice(B, Z), 10), v === "1-based-closed" && (T -= 1), T >= s)
            return { startCoordinate: T, overlaps: !1 };
          if ((C === 0 || C === A) && T + 1 <= a)
            return { startCoordinate: T, overlaps: !1 };
        } else if (c === "VCF" && k === 4)
          P = o.slice(B, Z);
        else if (k === C && (c === "VCF" ? this._getVcfEnd(T, P, o.slice(B, Z)) : parseInt(o.slice(B, Z), 10)) <= a)
          return { overlaps: !1 };
        if (B = Z + 1, k += 1, k > y)
          break;
      }
    return { startCoordinate: T, overlaps: !0 };
  }
  _getVcfEnd(n, t, a) {
    let s = n + t.length;
    const o = a.includes("SVTYPE=TRA");
    if (a[0] !== "." && !o) {
      let h = ";";
      for (let l = 0; l < a.length; l += 1) {
        if (h === ";" && a.slice(l, l + 4) === "END=") {
          let v = a.indexOf(";", l);
          v === -1 && (v = a.length), s = parseInt(a.slice(l + 4, v), 10);
          break;
        }
        h = a[l];
      }
    } else if (o)
      return n + 1;
    return s;
  }
  /**
   * return the approximate number of data lines in the given reference
   * sequence
   *
   * @param refSeq reference sequence name
   *
   * @returns number of data lines present on that reference sequence
   */
  async lineCount(n, t = {}) {
    return this.index.lineCount(n, t);
  }
  async _readRegion(n, t, a = {}) {
    const s = Jn.Buffer.alloc(t), { bytesRead: o, buffer: h } = await this.filehandle.read(s, 0, t, n, a);
    return h.slice(0, o);
  }
  /**
   * read and uncompress the data in a chunk (composed of one or more
   * contiguous bgzip blocks) of the file
   */
  async readChunk(n, t = {}) {
    const a = await this._readRegion(n.minv.blockPosition, n.fetchedSize(), t);
    return Px(a, n);
  }
}
function ri(e, n, t) {
  let a = 1e5, s = new Kx({
    filehandle: new wr(t, { fetch: Ka }),
    tbiFilehandle: new wr(t + ".tbi", {
      fetch: Ka
    })
  });
  function o(c, d) {
    if (c.length <= d)
      return c;
    const A = [];
    for (let C = 0; C < d; C++) {
      const y = C / d, k = Math.ceil(y * c.length);
      A.push(c[k]);
    }
    return A;
  }
  async function h(c, d) {
    const A = c.map((y) => {
      let k = d && d.ensemblStyle ? y.chr.replace("chr", "") : y.chr;
      return k === "M" && (k = "MT"), l(k, y.start, y.end);
    }), C = await Promise.all(A);
    return qt.flatten(C);
  }
  async function l(c, d, A) {
    const C = [];
    await s.getLines(c, d, A, (k) => C.push(k));
    let y;
    return C.length > a ? y = o(C, a) : y = C, y.map(v);
  }
  function v(c) {
    const d = c.split("	");
    if (d.length < 3)
      return;
    let A = {
      chr: d[0],
      start: Number.parseInt(d[1], 10),
      end: Number.parseInt(d[2], 10),
      n: d.length
      // number of columns in initial data row
    };
    for (let C = 3; C < d.length; C++)
      A[C] = d[C];
    return A;
  }
  return h(e, n);
}
const us = BigInt(32);
function Yx(e, n, t) {
  const a = +!!t, s = +!t;
  return BigInt(e.getInt32(n, t) * s + e.getInt32(n + 4, t) * a) << us | BigInt(e.getUint32(n, t) * a + e.getUint32(n + 4, t) * s);
}
function Qx(e, n, t) {
  const a = e.getUint32(n, t), s = e.getUint32(n + 4, t), o = +!!t, h = +!t;
  return BigInt(a * h + s * o) << us | BigInt(a * o + s * h);
}
function Jx(e, n, t, a) {
  const s = Number(t >> us), o = Number(t & BigInt(4294967295));
  a ? (e.setInt32(n + 4, s, a), e.setUint32(n, o, a)) : (e.setInt32(n, s, a), e.setUint32(n + 4, o, a));
}
function jx(e, n, t, a) {
  const s = Number(t >> us), o = Number(t & BigInt(4294967295));
  a ? (e.setUint32(n + 4, s, a), e.setUint32(n, o, a)) : (e.setUint32(n, s, a), e.setUint32(n + 4, o, a));
}
"getBigInt64" in DataView || (DataView.prototype.getBigInt64 = function(e, n) {
  return Yx(this, e, n);
});
"getBigUint64" in DataView || (DataView.prototype.getBigUint64 = function(e, n) {
  return Qx(this, e, n);
});
"setBigInt64" in DataView || (DataView.prototype.setBigInt64 = function(e, n, t) {
  Jx(this, e, n, t);
});
"setBigUint64" in DataView || (DataView.prototype.setBigUint64 = function(e, n, t) {
  jx(this, e, n, t);
});
class eA {
  constructor(n, t) {
    this.code = "", this.scopes = [["vars"]], this.bitFields = [], this.tmpVariableCount = 0, this.references = /* @__PURE__ */ new Map(), this.imports = [], this.reverseImports = /* @__PURE__ */ new Map(), this.useContextVariables = !1, this.importPath = n, this.useContextVariables = t;
  }
  generateVariable(n) {
    const t = [...this.scopes[this.scopes.length - 1]];
    return n && t.push(n), t.join(".");
  }
  generateOption(n) {
    switch (typeof n) {
      case "number":
        return n.toString();
      case "string":
        return this.generateVariable(n);
      case "function":
        return `${this.addImport(n)}.call(${this.generateVariable()}, vars)`;
    }
  }
  generateError(n) {
    this.pushCode(`throw new Error(${n});`);
  }
  generateTmpVariable() {
    return "$tmp" + this.tmpVariableCount++;
  }
  pushCode(n) {
    this.code += n + `
`;
  }
  pushPath(n) {
    n && this.scopes[this.scopes.length - 1].push(n);
  }
  popPath(n) {
    n && this.scopes[this.scopes.length - 1].pop();
  }
  pushScope(n) {
    this.scopes.push([n]);
  }
  popScope() {
    this.scopes.pop();
  }
  addImport(n) {
    if (!this.importPath)
      return `(${n})`;
    let t = this.reverseImports.get(n);
    return t || (t = this.imports.push(n) - 1, this.reverseImports.set(n, t)), `${this.importPath}[${t}]`;
  }
  addReference(n) {
    this.references.has(n) || this.references.set(n, { resolved: !1, requested: !1 });
  }
  markResolved(n) {
    const t = this.references.get(n);
    t && (t.resolved = !0);
  }
  markRequested(n) {
    n.forEach((t) => {
      const a = this.references.get(t);
      a && (a.requested = !0);
    });
  }
  getUnresolvedReferences() {
    return Array.from(this.references).filter(([n, t]) => !t.resolved && !t.requested).map(([n, t]) => n);
  }
}
const Bn = /* @__PURE__ */ new Map(), ii = "___parser_", Sn = {
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
}, Eo = {
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
}, Co = {
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
class ke {
  constructor() {
    this.varName = "", this.type = "", this.options = {}, this.endian = "be", this.useContextVariables = !1;
  }
  static start() {
    return new ke();
  }
  primitiveGenerateN(n, t) {
    const a = Eo[n], s = Co[n];
    t.pushCode(`${t.generateVariable(this.varName)} = dataView.get${a}(offset, ${s});`), t.pushCode(`offset += ${Sn[n]};`);
  }
  primitiveN(n, t, a) {
    return this.setNextParser(n, t, a);
  }
  useThisEndian(n) {
    return n + this.endian.toLowerCase();
  }
  uint8(n, t = {}) {
    return this.primitiveN("uint8", n, t);
  }
  uint16(n, t = {}) {
    return this.primitiveN(this.useThisEndian("uint16"), n, t);
  }
  uint16le(n, t = {}) {
    return this.primitiveN("uint16le", n, t);
  }
  uint16be(n, t = {}) {
    return this.primitiveN("uint16be", n, t);
  }
  uint32(n, t = {}) {
    return this.primitiveN(this.useThisEndian("uint32"), n, t);
  }
  uint32le(n, t = {}) {
    return this.primitiveN("uint32le", n, t);
  }
  uint32be(n, t = {}) {
    return this.primitiveN("uint32be", n, t);
  }
  int8(n, t = {}) {
    return this.primitiveN("int8", n, t);
  }
  int16(n, t = {}) {
    return this.primitiveN(this.useThisEndian("int16"), n, t);
  }
  int16le(n, t = {}) {
    return this.primitiveN("int16le", n, t);
  }
  int16be(n, t = {}) {
    return this.primitiveN("int16be", n, t);
  }
  int32(n, t = {}) {
    return this.primitiveN(this.useThisEndian("int32"), n, t);
  }
  int32le(n, t = {}) {
    return this.primitiveN("int32le", n, t);
  }
  int32be(n, t = {}) {
    return this.primitiveN("int32be", n, t);
  }
  bigIntVersionCheck() {
    if (!DataView.prototype.getBigInt64)
      throw new Error("BigInt64 is unsupported on this runtime");
  }
  int64(n, t = {}) {
    return this.bigIntVersionCheck(), this.primitiveN(this.useThisEndian("int64"), n, t);
  }
  int64be(n, t = {}) {
    return this.bigIntVersionCheck(), this.primitiveN("int64be", n, t);
  }
  int64le(n, t = {}) {
    return this.bigIntVersionCheck(), this.primitiveN("int64le", n, t);
  }
  uint64(n, t = {}) {
    return this.bigIntVersionCheck(), this.primitiveN(this.useThisEndian("uint64"), n, t);
  }
  uint64be(n, t = {}) {
    return this.bigIntVersionCheck(), this.primitiveN("uint64be", n, t);
  }
  uint64le(n, t = {}) {
    return this.bigIntVersionCheck(), this.primitiveN("uint64le", n, t);
  }
  floatle(n, t = {}) {
    return this.primitiveN("floatle", n, t);
  }
  floatbe(n, t = {}) {
    return this.primitiveN("floatbe", n, t);
  }
  doublele(n, t = {}) {
    return this.primitiveN("doublele", n, t);
  }
  doublebe(n, t = {}) {
    return this.primitiveN("doublebe", n, t);
  }
  bitN(n, t, a) {
    return a.length = n, this.setNextParser("bit", t, a);
  }
  bit1(n, t = {}) {
    return this.bitN(1, n, t);
  }
  bit2(n, t = {}) {
    return this.bitN(2, n, t);
  }
  bit3(n, t = {}) {
    return this.bitN(3, n, t);
  }
  bit4(n, t = {}) {
    return this.bitN(4, n, t);
  }
  bit5(n, t = {}) {
    return this.bitN(5, n, t);
  }
  bit6(n, t = {}) {
    return this.bitN(6, n, t);
  }
  bit7(n, t = {}) {
    return this.bitN(7, n, t);
  }
  bit8(n, t = {}) {
    return this.bitN(8, n, t);
  }
  bit9(n, t = {}) {
    return this.bitN(9, n, t);
  }
  bit10(n, t = {}) {
    return this.bitN(10, n, t);
  }
  bit11(n, t = {}) {
    return this.bitN(11, n, t);
  }
  bit12(n, t = {}) {
    return this.bitN(12, n, t);
  }
  bit13(n, t = {}) {
    return this.bitN(13, n, t);
  }
  bit14(n, t = {}) {
    return this.bitN(14, n, t);
  }
  bit15(n, t = {}) {
    return this.bitN(15, n, t);
  }
  bit16(n, t = {}) {
    return this.bitN(16, n, t);
  }
  bit17(n, t = {}) {
    return this.bitN(17, n, t);
  }
  bit18(n, t = {}) {
    return this.bitN(18, n, t);
  }
  bit19(n, t = {}) {
    return this.bitN(19, n, t);
  }
  bit20(n, t = {}) {
    return this.bitN(20, n, t);
  }
  bit21(n, t = {}) {
    return this.bitN(21, n, t);
  }
  bit22(n, t = {}) {
    return this.bitN(22, n, t);
  }
  bit23(n, t = {}) {
    return this.bitN(23, n, t);
  }
  bit24(n, t = {}) {
    return this.bitN(24, n, t);
  }
  bit25(n, t = {}) {
    return this.bitN(25, n, t);
  }
  bit26(n, t = {}) {
    return this.bitN(26, n, t);
  }
  bit27(n, t = {}) {
    return this.bitN(27, n, t);
  }
  bit28(n, t = {}) {
    return this.bitN(28, n, t);
  }
  bit29(n, t = {}) {
    return this.bitN(29, n, t);
  }
  bit30(n, t = {}) {
    return this.bitN(30, n, t);
  }
  bit31(n, t = {}) {
    return this.bitN(31, n, t);
  }
  bit32(n, t = {}) {
    return this.bitN(32, n, t);
  }
  namely(n) {
    return Bn.set(n, this), this.alias = n, this;
  }
  skip(n, t = {}) {
    return this.seek(n, t);
  }
  seek(n, t = {}) {
    if (t.assert)
      throw new Error("assert option on seek is not allowed.");
    return this.setNextParser("seek", "", { length: n });
  }
  string(n, t) {
    if (!t.zeroTerminated && !t.length && !t.greedy)
      throw new Error("One of length, zeroTerminated, or greedy must be defined for string.");
    if ((t.zeroTerminated || t.length) && t.greedy)
      throw new Error("greedy is mutually exclusive with length and zeroTerminated for string.");
    if (t.stripNull && !(t.length || t.greedy))
      throw new Error("length or greedy must be defined if stripNull is enabled.");
    return t.encoding = t.encoding || "utf8", this.setNextParser("string", n, t);
  }
  buffer(n, t) {
    if (!t.length && !t.readUntil)
      throw new Error("length or readUntil must be defined for buffer.");
    return this.setNextParser("buffer", n, t);
  }
  wrapped(n, t) {
    if (typeof t != "object" && typeof n == "object" && (t = n, n = ""), !t || !t.wrapper || !t.type)
      throw new Error("Both wrapper and type must be defined for wrapped.");
    if (!t.length && !t.readUntil)
      throw new Error("length or readUntil must be defined for wrapped.");
    return this.setNextParser("wrapper", n, t);
  }
  array(n, t) {
    if (!t.readUntil && !t.length && !t.lengthInBytes)
      throw new Error("One of readUntil, length and lengthInBytes must be defined for array.");
    if (!t.type)
      throw new Error("type is required for array.");
    if (typeof t.type == "string" && !Bn.has(t.type) && !(t.type in Sn))
      throw new Error(`Array element type "${t.type}" is unkown.`);
    return this.setNextParser("array", n, t);
  }
  choice(n, t) {
    if (typeof t != "object" && typeof n == "object" && (t = n, n = ""), !t)
      throw new Error("tag and choices are are required for choice.");
    if (!t.tag)
      throw new Error("tag is requird for choice.");
    if (!t.choices)
      throw new Error("choices is required for choice.");
    for (const a in t.choices) {
      const s = parseInt(a, 10), o = t.choices[s];
      if (isNaN(s))
        throw new Error(`Choice key "${a}" is not a number.`);
      if (typeof o == "string" && !Bn.has(o) && !(o in Sn))
        throw new Error(`Choice type "${o}" is unkown.`);
    }
    return this.setNextParser("choice", n, t);
  }
  nest(n, t) {
    if (typeof t != "object" && typeof n == "object" && (t = n, n = ""), !t || !t.type)
      throw new Error("type is required for nest.");
    if (!(t.type instanceof ke) && !Bn.has(t.type))
      throw new Error("type must be a known parser name or a Parser object.");
    if (!(t.type instanceof ke) && !n)
      throw new Error("type must be a Parser object if the variable name is omitted.");
    return this.setNextParser("nest", n, t);
  }
  pointer(n, t) {
    if (!t.offset)
      throw new Error("offset is required for pointer.");
    if (!t.type)
      throw new Error("type is required for pointer.");
    if (typeof t.type == "string" && !(t.type in Sn) && !Bn.has(t.type))
      throw new Error(`Pointer type "${t.type}" is unkown.`);
    return this.setNextParser("pointer", n, t);
  }
  saveOffset(n, t = {}) {
    return this.setNextParser("saveOffset", n, t);
  }
  endianness(n) {
    switch (n.toLowerCase()) {
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
  endianess(n) {
    return this.endianness(n);
  }
  useContextVars(n = !0) {
    return this.useContextVariables = n, this;
  }
  create(n) {
    if (!(n instanceof Function))
      throw new Error("Constructor must be a Function object.");
    return this.constructorFn = n, this;
  }
  getContext(n) {
    const t = new eA(n, this.useContextVariables);
    return t.pushCode("var dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);"), this.alias ? (this.addAliasedCode(t), t.pushCode(`return ${ii + this.alias}(0).result;`)) : this.addRawCode(t), t;
  }
  getCode() {
    return this.getContext("imports").code;
  }
  addRawCode(n) {
    n.pushCode("var offset = 0;"), n.pushCode(`var vars = ${this.constructorFn ? "new constructorFn()" : "{}"};`), n.pushCode("vars.$parent = null;"), n.pushCode("vars.$root = vars;"), this.generate(n), this.resolveReferences(n), n.pushCode("delete vars.$parent;"), n.pushCode("delete vars.$root;"), n.pushCode("return vars;");
  }
  addAliasedCode(n) {
    return n.pushCode(`function ${ii + this.alias}(offset, context) {`), n.pushCode(`var vars = ${this.constructorFn ? "new constructorFn()" : "{}"};`), n.pushCode("var ctx = Object.assign({$parent: null, $root: vars}, context || {});"), n.pushCode("vars = Object.assign(vars, ctx);"), this.generate(n), n.markResolved(this.alias), this.resolveReferences(n), n.pushCode("Object.keys(ctx).forEach(function (item) { delete vars[item]; });"), n.pushCode("return { offset: offset, result: vars };"), n.pushCode("}"), n;
  }
  resolveReferences(n) {
    const t = n.getUnresolvedReferences();
    n.markRequested(t), t.forEach((a) => {
      var s;
      (s = Bn.get(a)) === null || s === void 0 || s.addAliasedCode(n);
    });
  }
  compile() {
    const n = "imports", t = this.getContext(n);
    this.compiled = new Function(n, "TextDecoder", `return function (buffer, constructorFn) { ${t.code} };`)(t.imports, TextDecoder);
  }
  sizeOf() {
    let n = NaN;
    if (Object.keys(Sn).indexOf(this.type) >= 0)
      n = Sn[this.type];
    else if (this.type === "string" && typeof this.options.length == "number")
      n = this.options.length;
    else if (this.type === "buffer" && typeof this.options.length == "number")
      n = this.options.length;
    else if (this.type === "array" && typeof this.options.length == "number") {
      let t = NaN;
      typeof this.options.type == "string" ? t = Sn[this.options.type] : this.options.type instanceof ke && (t = this.options.type.sizeOf()), n = this.options.length * t;
    } else this.type === "seek" ? n = this.options.length : this.type === "nest" ? n = this.options.type.sizeOf() : this.type || (n = 0);
    return this.next && (n += this.next.sizeOf()), n;
  }
  // Follow the parser chain till the root and start parsing from there
  parse(n) {
    return this.compiled || this.compile(), this.compiled(n, this.constructorFn);
  }
  setNextParser(n, t, a) {
    const s = new ke();
    return s.type = n, s.varName = t, s.options = a, s.endian = this.endian, this.head ? this.head.next = s : this.next = s, this.head = s, this;
  }
  // Call code generator for this parser
  generate(n) {
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
          this.primitiveGenerateN(this.type, n);
          break;
        case "bit":
          this.generateBit(n);
          break;
        case "string":
          this.generateString(n);
          break;
        case "buffer":
          this.generateBuffer(n);
          break;
        case "seek":
          this.generateSeek(n);
          break;
        case "nest":
          this.generateNest(n);
          break;
        case "array":
          this.generateArray(n);
          break;
        case "choice":
          this.generateChoice(n);
          break;
        case "pointer":
          this.generatePointer(n);
          break;
        case "saveOffset":
          this.generateSaveOffset(n);
          break;
        case "wrapper":
          this.generateWrapper(n);
          break;
      }
      this.type !== "bit" && this.generateAssert(n);
    }
    const t = n.generateVariable(this.varName);
    return this.options.formatter && this.type !== "bit" && this.generateFormatter(n, t, this.options.formatter), this.generateNext(n);
  }
  generateAssert(n) {
    if (!this.options.assert)
      return;
    const t = n.generateVariable(this.varName);
    switch (typeof this.options.assert) {
      case "function":
        {
          const a = n.addImport(this.options.assert);
          n.pushCode(`if (!${a}.call(vars, ${t})) {`);
        }
        break;
      case "number":
        n.pushCode(`if (${this.options.assert} !== ${t}) {`);
        break;
      case "string":
        n.pushCode(`if (${JSON.stringify(this.options.assert)} !== ${t}) {`);
        break;
      default:
        throw new Error("assert option must be a string, number or a function.");
    }
    n.generateError(`"Assertion error: ${t} is " + ${JSON.stringify(this.options.assert.toString())}`), n.pushCode("}");
  }
  // Recursively call code generators and append results
  generateNext(n) {
    return this.next && (n = this.next.generate(n)), n;
  }
  generateBit(n) {
    const t = JSON.parse(JSON.stringify(this));
    if (t.options = this.options, t.generateAssert = this.generateAssert.bind(this), t.generateFormatter = this.generateFormatter.bind(this), t.varName = n.generateVariable(t.varName), n.bitFields.push(t), !this.next || this.next && ["bit", "nest"].indexOf(this.next.type) < 0) {
      const a = n.generateTmpVariable();
      n.pushCode(`var ${a} = 0;`);
      const s = (d = 0) => {
        let A = 0;
        for (let C = d; C < n.bitFields.length; C++) {
          const y = n.bitFields[C].options.length;
          if (A + y > 32)
            break;
          A += y;
        }
        return A;
      }, o = (d) => (d <= 8 ? (n.pushCode(`${a} = dataView.getUint8(offset);`), d = 8) : d <= 16 ? (n.pushCode(`${a} = dataView.getUint16(offset);`), d = 16) : d <= 24 ? (n.pushCode(`${a} = (dataView.getUint16(offset) << 8) | dataView.getUint8(offset + 2);`), d = 24) : (n.pushCode(`${a} = dataView.getUint32(offset);`), d = 32), n.pushCode(`offset += ${d / 8};`), d);
      let h = 0;
      const l = this.endian === "be";
      let v = 0, c = 0;
      n.bitFields.forEach((d, A) => {
        let C = d.options.length;
        if (C > c) {
          if (c) {
            const B = -1 >>> 32 - c;
            n.pushCode(`${d.varName} = (${a} & 0x${B.toString(16)}) << ${C - c};`), C -= c;
          }
          h = 0, c = v = o(s(A) - c);
        }
        const y = l ? v - h - C : h, k = -1 >>> 32 - C;
        n.pushCode(`${d.varName} ${C < d.options.length ? "|=" : "="} ${a} >> ${y} & 0x${k.toString(16)};`), d.options.length === 32 && n.pushCode(`${d.varName} >>>= 0`), d.options.assert && d.generateAssert(n), d.options.formatter && d.generateFormatter(n, d.varName, d.options.formatter), h += C, c -= C;
      }), n.bitFields = [];
    }
  }
  generateSeek(n) {
    const t = n.generateOption(this.options.length);
    n.pushCode(`offset += ${t};`);
  }
  generateString(n) {
    const t = n.generateVariable(this.varName), a = n.generateTmpVariable(), s = this.options.encoding, o = s.toLowerCase() === "hex", h = 'b => b.toString(16).padStart(2, "0")';
    if (this.options.length && this.options.zeroTerminated) {
      const l = this.options.length;
      n.pushCode(`var ${a} = offset;`), n.pushCode(`while(dataView.getUint8(offset++) !== 0 && offset - ${a} < ${l});`);
      const v = `offset - ${a} < ${l} ? offset - 1 : offset`;
      n.pushCode(o ? `${t} = Array.from(buffer.subarray(${a}, ${v}), ${h}).join('');` : `${t} = new TextDecoder('${s}').decode(buffer.subarray(${a}, ${v}));`);
    } else if (this.options.length) {
      const l = n.generateOption(this.options.length);
      n.pushCode(o ? `${t} = Array.from(buffer.subarray(offset, offset + ${l}), ${h}).join('');` : `${t} = new TextDecoder('${s}').decode(buffer.subarray(offset, offset + ${l}));`), n.pushCode(`offset += ${l};`);
    } else this.options.zeroTerminated ? (n.pushCode(`var ${a} = offset;`), n.pushCode("while(dataView.getUint8(offset++) !== 0);"), n.pushCode(o ? `${t} = Array.from(buffer.subarray(${a}, offset - 1), ${h}).join('');` : `${t} = new TextDecoder('${s}').decode(buffer.subarray(${a}, offset - 1));`)) : this.options.greedy && (n.pushCode(`var ${a} = offset;`), n.pushCode("while(buffer.length > offset++);"), n.pushCode(o ? `${t} = Array.from(buffer.subarray(${a}, offset), ${h}).join('');` : `${t} = new TextDecoder('${s}').decode(buffer.subarray(${a}, offset));`));
    this.options.stripNull && n.pushCode(`${t} = ${t}.replace(/\\x00+$/g, '')`);
  }
  generateBuffer(n) {
    const t = n.generateVariable(this.varName);
    if (typeof this.options.readUntil == "function") {
      const a = this.options.readUntil, s = n.generateTmpVariable(), o = n.generateTmpVariable();
      n.pushCode(`var ${s} = offset;`), n.pushCode(`var ${o} = 0;`), n.pushCode("while (offset < buffer.length) {"), n.pushCode(`${o} = dataView.getUint8(offset);`);
      const h = n.addImport(a);
      n.pushCode(`if (${h}.call(${n.generateVariable()}, ${o}, buffer.subarray(offset))) break;`), n.pushCode("offset += 1;"), n.pushCode("}"), n.pushCode(`${t} = buffer.subarray(${s}, offset);`);
    } else if (this.options.readUntil === "eof")
      n.pushCode(`${t} = buffer.subarray(offset);`);
    else {
      const a = n.generateOption(this.options.length);
      n.pushCode(`${t} = buffer.subarray(offset, offset + ${a});`), n.pushCode(`offset += ${a};`);
    }
    this.options.clone && n.pushCode(`${t} = buffer.constructor.from(${t});`);
  }
  generateArray(n) {
    const t = n.generateOption(this.options.length), a = n.generateOption(this.options.lengthInBytes), s = this.options.type, o = n.generateTmpVariable(), h = n.generateVariable(this.varName), l = n.generateTmpVariable(), v = this.options.key, c = typeof v == "string";
    if (c ? n.pushCode(`${h} = {};`) : n.pushCode(`${h} = [];`), typeof this.options.readUntil == "function" ? n.pushCode("do {") : this.options.readUntil === "eof" ? n.pushCode(`for (var ${o} = 0; offset < buffer.length; ${o}++) {`) : a !== void 0 ? n.pushCode(`for (var ${o} = offset + ${a}; offset < ${o}; ) {`) : n.pushCode(`for (var ${o} = ${t}; ${o} > 0; ${o}--) {`), typeof s == "string")
      if (Bn.get(s)) {
        const d = n.generateTmpVariable();
        if (n.pushCode(`var ${d} = ${ii + s}(offset, {`), n.useContextVariables) {
          const A = n.generateVariable();
          n.pushCode(`$parent: ${A},`), n.pushCode(`$root: ${A}.$root,`), !this.options.readUntil && a === void 0 && n.pushCode(`$index: ${t} - ${o},`);
        }
        n.pushCode("});"), n.pushCode(`var ${l} = ${d}.result; offset = ${d}.offset;`), s !== this.alias && n.addReference(s);
      } else {
        const d = Eo[s], A = Co[s];
        n.pushCode(`var ${l} = dataView.get${d}(offset, ${A});`), n.pushCode(`offset += ${Sn[s]};`);
      }
    else if (s instanceof ke) {
      n.pushCode(`var ${l} = {};`);
      const d = n.generateVariable();
      n.pushScope(l), n.useContextVariables && (n.pushCode(`${l}.$parent = ${d};`), n.pushCode(`${l}.$root = ${d}.$root;`), !this.options.readUntil && a === void 0 && n.pushCode(`${l}.$index = ${t} - ${o};`)), s.generate(n), n.useContextVariables && (n.pushCode(`delete ${l}.$parent;`), n.pushCode(`delete ${l}.$root;`), n.pushCode(`delete ${l}.$index;`)), n.popScope();
    }
    if (c ? n.pushCode(`${h}[${l}.${v}] = ${l};`) : n.pushCode(`${h}.push(${l});`), n.pushCode("}"), typeof this.options.readUntil == "function") {
      const d = this.options.readUntil, A = n.addImport(d);
      n.pushCode(`while (!${A}.call(${n.generateVariable()}, ${l}, buffer.subarray(offset)));`);
    }
  }
  generateChoiceCase(n, t, a) {
    if (typeof a == "string") {
      const s = n.generateVariable(this.varName);
      if (Bn.has(a)) {
        const o = n.generateTmpVariable();
        n.pushCode(`var ${o} = ${ii + a}(offset, {`), n.useContextVariables && (n.pushCode(`$parent: ${s}.$parent,`), n.pushCode(`$root: ${s}.$root,`)), n.pushCode("});"), n.pushCode(`${s} = ${o}.result; offset = ${o}.offset;`), a !== this.alias && n.addReference(a);
      } else {
        const o = Eo[a], h = Co[a];
        n.pushCode(`${s} = dataView.get${o}(offset, ${h});`), n.pushCode(`offset += ${Sn[a]}`);
      }
    } else a instanceof ke && (n.pushPath(t), a.generate(n), n.popPath(t));
  }
  generateChoice(n) {
    const t = n.generateOption(this.options.tag), a = n.generateVariable(this.varName);
    if (this.varName && (n.pushCode(`${a} = {};`), n.useContextVariables)) {
      const s = n.generateVariable();
      n.pushCode(`${a}.$parent = ${s};`), n.pushCode(`${a}.$root = ${s}.$root;`);
    }
    n.pushCode(`switch(${t}) {`);
    for (const s in this.options.choices) {
      const o = parseInt(s, 10), h = this.options.choices[o];
      n.pushCode(`case ${o}:`), this.generateChoiceCase(n, this.varName, h), n.pushCode("break;");
    }
    n.pushCode("default:"), this.options.defaultChoice ? this.generateChoiceCase(n, this.varName, this.options.defaultChoice) : n.generateError(`"Met undefined tag value " + ${t} + " at choice"`), n.pushCode("}"), this.varName && n.useContextVariables && (n.pushCode(`delete ${a}.$parent;`), n.pushCode(`delete ${a}.$root;`));
  }
  generateNest(n) {
    const t = n.generateVariable(this.varName);
    if (this.options.type instanceof ke) {
      if (this.varName && (n.pushCode(`${t} = {};`), n.useContextVariables)) {
        const a = n.generateVariable();
        n.pushCode(`${t}.$parent = ${a};`), n.pushCode(`${t}.$root = ${a}.$root;`);
      }
      n.pushPath(this.varName), this.options.type.generate(n), n.popPath(this.varName), this.varName && n.useContextVariables && n.useContextVariables && (n.pushCode(`delete ${t}.$parent;`), n.pushCode(`delete ${t}.$root;`));
    } else if (Bn.has(this.options.type)) {
      const a = n.generateTmpVariable();
      if (n.pushCode(`var ${a} = ${ii + this.options.type}(offset, {`), n.useContextVariables) {
        const s = n.generateVariable();
        n.pushCode(`$parent: ${s},`), n.pushCode(`$root: ${s}.$root,`);
      }
      n.pushCode("});"), n.pushCode(`${t} = ${a}.result; offset = ${a}.offset;`), this.options.type !== this.alias && n.addReference(this.options.type);
    }
  }
  generateWrapper(n) {
    const t = n.generateVariable(this.varName), a = n.generateTmpVariable();
    if (typeof this.options.readUntil == "function") {
      const v = this.options.readUntil, c = n.generateTmpVariable(), d = n.generateTmpVariable();
      n.pushCode(`var ${c} = offset;`), n.pushCode(`var ${d} = 0;`), n.pushCode("while (offset < buffer.length) {"), n.pushCode(`${d} = dataView.getUint8(offset);`);
      const A = n.addImport(v);
      n.pushCode(`if (${A}.call(${n.generateVariable()}, ${d}, buffer.subarray(offset))) break;`), n.pushCode("offset += 1;"), n.pushCode("}"), n.pushCode(`${a} = buffer.subarray(${c}, offset);`);
    } else if (this.options.readUntil === "eof")
      n.pushCode(`${a} = buffer.subarray(offset);`);
    else {
      const v = n.generateOption(this.options.length);
      n.pushCode(`${a} = buffer.subarray(offset, offset + ${v});`), n.pushCode(`offset += ${v};`);
    }
    this.options.clone && n.pushCode(`${a} = buffer.constructor.from(${a});`);
    const s = n.generateTmpVariable(), o = n.generateTmpVariable(), h = n.generateTmpVariable(), l = n.addImport(this.options.wrapper);
    if (n.pushCode(`${a} = ${l}.call(this, ${a}).subarray(0);`), n.pushCode(`var ${s} = buffer;`), n.pushCode(`var ${o} = offset;`), n.pushCode(`var ${h} = dataView;`), n.pushCode(`buffer = ${a};`), n.pushCode("offset = 0;"), n.pushCode("dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.length);"), this.options.type instanceof ke)
      this.varName && n.pushCode(`${t} = {};`), n.pushPath(this.varName), this.options.type.generate(n), n.popPath(this.varName);
    else if (Bn.has(this.options.type)) {
      const v = n.generateTmpVariable();
      n.pushCode(`var ${v} = ${ii + this.options.type}(0);`), n.pushCode(`${t} = ${v}.result;`), this.options.type !== this.alias && n.addReference(this.options.type);
    }
    n.pushCode(`buffer = ${s};`), n.pushCode(`dataView = ${h};`), n.pushCode(`offset = ${o};`);
  }
  generateFormatter(n, t, a) {
    if (typeof a == "function") {
      const s = n.addImport(a);
      n.pushCode(`${t} = ${s}.call(${n.generateVariable()}, ${t});`);
    }
  }
  generatePointer(n) {
    const t = this.options.type, a = n.generateOption(this.options.offset), s = n.generateTmpVariable(), o = n.generateVariable(this.varName);
    if (n.pushCode(`var ${s} = offset;`), n.pushCode(`offset = ${a};`), this.options.type instanceof ke) {
      if (n.pushCode(`${o} = {};`), n.useContextVariables) {
        const h = n.generateVariable();
        n.pushCode(`${o}.$parent = ${h};`), n.pushCode(`${o}.$root = ${h}.$root;`);
      }
      n.pushPath(this.varName), this.options.type.generate(n), n.popPath(this.varName), n.useContextVariables && (n.pushCode(`delete ${o}.$parent;`), n.pushCode(`delete ${o}.$root;`));
    } else if (Bn.has(this.options.type)) {
      const h = n.generateTmpVariable();
      if (n.pushCode(`var ${h} = ${ii + this.options.type}(offset, {`), n.useContextVariables) {
        const l = n.generateVariable();
        n.pushCode(`$parent: ${l},`), n.pushCode(`$root: ${l}.$root,`);
      }
      n.pushCode("});"), n.pushCode(`${o} = ${h}.result; offset = ${h}.offset;`), this.options.type !== this.alias && n.addReference(this.options.type);
    } else if (Object.keys(Sn).indexOf(this.options.type) >= 0) {
      const h = Eo[t], l = Co[t];
      n.pushCode(`${o} = dataView.get${h}(offset, ${l});`), n.pushCode(`offset += ${Sn[t]};`);
    }
    n.pushCode(`offset = ${s};`);
  }
  generateSaveOffset(n) {
    const t = n.generateVariable(this.varName);
    n.pushCode(`${t} = offset`);
  }
}
class ea {
  constructor(n) {
    this.ranges = n;
  }
  get min() {
    return this.ranges[0].min;
  }
  get max() {
    return this.ranges[this.ranges.length - 1].max;
  }
  contains(n) {
    for (const t of this.ranges)
      if (t.min <= n && t.max >= n)
        return !0;
    return !1;
  }
  isContiguous() {
    return this.ranges.length > 1;
  }
  getRanges() {
    return this.ranges.map((n) => new ea([{ min: n.min, max: n.max }]));
  }
  toString() {
    return this.ranges.map((n) => `[${n.min}-${n.max}]`).join(",");
  }
  union(n) {
    const t = [...this.getRanges(), ...n.getRanges()].sort((o, h) => o.min < h.min ? -1 : o.min > h.min ? 1 : o.max < h.max ? -1 : h.max > o.max ? 1 : 0), a = [];
    let s = t[0];
    for (const o of t)
      o.min > s.max + 1 ? (a.push(s), s = o) : o.max > s.max && (s = new ea([{ min: s.min, max: o.max }]));
    return a.push(s), a.length === 1 ? a[0] : new ea(a);
  }
}
/*! pako 2.1.0 https://github.com/nodeca/pako @license (MIT AND Zlib) */
const tA = 4, Qd = 0, Jd = 1, nA = 2;
function ha(e) {
  let n = e.length;
  for (; --n >= 0; )
    e[n] = 0;
}
const rA = 0, Yp = 1, iA = 2, aA = 3, uA = 258, oh = 29, yu = 256, nu = yu + 1 + oh, ta = 30, sh = 19, Qp = 2 * nu + 1, li = 15, Qf = 16, oA = 7, fh = 256, Jp = 16, jp = 17, eg = 18, Sl = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
), Po = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
), sA = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
), tg = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), fA = 512, pr = new Array((nu + 2) * 2);
ha(pr);
const Wa = new Array(ta * 2);
ha(Wa);
const ru = new Array(fA);
ha(ru);
const iu = new Array(uA - aA + 1);
ha(iu);
const lh = new Array(oh);
ha(lh);
const Xo = new Array(ta);
ha(Xo);
function Jf(e, n, t, a, s) {
  this.static_tree = e, this.extra_bits = n, this.extra_base = t, this.elems = a, this.max_length = s, this.has_stree = e && e.length;
}
let ng, rg, ig;
function jf(e, n) {
  this.dyn_tree = e, this.max_code = 0, this.stat_desc = n;
}
const ag = (e) => e < 256 ? ru[e] : ru[256 + (e >>> 7)], au = (e, n) => {
  e.pending_buf[e.pending++] = n & 255, e.pending_buf[e.pending++] = n >>> 8 & 255;
}, Zt = (e, n, t) => {
  e.bi_valid > Qf - t ? (e.bi_buf |= n << e.bi_valid & 65535, au(e, e.bi_buf), e.bi_buf = n >> Qf - e.bi_valid, e.bi_valid += t - Qf) : (e.bi_buf |= n << e.bi_valid & 65535, e.bi_valid += t);
}, Wn = (e, n, t) => {
  Zt(
    e,
    t[n * 2],
    t[n * 2 + 1]
    /*.Len*/
  );
}, ug = (e, n) => {
  let t = 0;
  do
    t |= e & 1, e >>>= 1, t <<= 1;
  while (--n > 0);
  return t >>> 1;
}, lA = (e) => {
  e.bi_valid === 16 ? (au(e, e.bi_buf), e.bi_buf = 0, e.bi_valid = 0) : e.bi_valid >= 8 && (e.pending_buf[e.pending++] = e.bi_buf & 255, e.bi_buf >>= 8, e.bi_valid -= 8);
}, hA = (e, n) => {
  const t = n.dyn_tree, a = n.max_code, s = n.stat_desc.static_tree, o = n.stat_desc.has_stree, h = n.stat_desc.extra_bits, l = n.stat_desc.extra_base, v = n.stat_desc.max_length;
  let c, d, A, C, y, k, B = 0;
  for (C = 0; C <= li; C++)
    e.bl_count[C] = 0;
  for (t[e.heap[e.heap_max] * 2 + 1] = 0, c = e.heap_max + 1; c < Qp; c++)
    d = e.heap[c], C = t[t[d * 2 + 1] * 2 + 1] + 1, C > v && (C = v, B++), t[d * 2 + 1] = C, !(d > a) && (e.bl_count[C]++, y = 0, d >= l && (y = h[d - l]), k = t[d * 2], e.opt_len += k * (C + y), o && (e.static_len += k * (s[d * 2 + 1] + y)));
  if (B !== 0) {
    do {
      for (C = v - 1; e.bl_count[C] === 0; )
        C--;
      e.bl_count[C]--, e.bl_count[C + 1] += 2, e.bl_count[v]--, B -= 2;
    } while (B > 0);
    for (C = v; C !== 0; C--)
      for (d = e.bl_count[C]; d !== 0; )
        A = e.heap[--c], !(A > a) && (t[A * 2 + 1] !== C && (e.opt_len += (C - t[A * 2 + 1]) * t[A * 2], t[A * 2 + 1] = C), d--);
  }
}, og = (e, n, t) => {
  const a = new Array(li + 1);
  let s = 0, o, h;
  for (o = 1; o <= li; o++)
    s = s + t[o - 1] << 1, a[o] = s;
  for (h = 0; h <= n; h++) {
    let l = e[h * 2 + 1];
    l !== 0 && (e[h * 2] = ug(a[l]++, l));
  }
}, cA = () => {
  let e, n, t, a, s;
  const o = new Array(li + 1);
  for (t = 0, a = 0; a < oh - 1; a++)
    for (lh[a] = t, e = 0; e < 1 << Sl[a]; e++)
      iu[t++] = a;
  for (iu[t - 1] = a, s = 0, a = 0; a < 16; a++)
    for (Xo[a] = s, e = 0; e < 1 << Po[a]; e++)
      ru[s++] = a;
  for (s >>= 7; a < ta; a++)
    for (Xo[a] = s << 7, e = 0; e < 1 << Po[a] - 7; e++)
      ru[256 + s++] = a;
  for (n = 0; n <= li; n++)
    o[n] = 0;
  for (e = 0; e <= 143; )
    pr[e * 2 + 1] = 8, e++, o[8]++;
  for (; e <= 255; )
    pr[e * 2 + 1] = 9, e++, o[9]++;
  for (; e <= 279; )
    pr[e * 2 + 1] = 7, e++, o[7]++;
  for (; e <= 287; )
    pr[e * 2 + 1] = 8, e++, o[8]++;
  for (og(pr, nu + 1, o), e = 0; e < ta; e++)
    Wa[e * 2 + 1] = 5, Wa[e * 2] = ug(e, 5);
  ng = new Jf(pr, Sl, yu + 1, nu, li), rg = new Jf(Wa, Po, 0, ta, li), ig = new Jf(new Array(0), sA, 0, sh, oA);
}, sg = (e) => {
  let n;
  for (n = 0; n < nu; n++)
    e.dyn_ltree[n * 2] = 0;
  for (n = 0; n < ta; n++)
    e.dyn_dtree[n * 2] = 0;
  for (n = 0; n < sh; n++)
    e.bl_tree[n * 2] = 0;
  e.dyn_ltree[fh * 2] = 1, e.opt_len = e.static_len = 0, e.sym_next = e.matches = 0;
}, fg = (e) => {
  e.bi_valid > 8 ? au(e, e.bi_buf) : e.bi_valid > 0 && (e.pending_buf[e.pending++] = e.bi_buf), e.bi_buf = 0, e.bi_valid = 0;
}, jd = (e, n, t, a) => {
  const s = n * 2, o = t * 2;
  return e[s] < e[o] || e[s] === e[o] && a[n] <= a[t];
}, el = (e, n, t) => {
  const a = e.heap[t];
  let s = t << 1;
  for (; s <= e.heap_len && (s < e.heap_len && jd(n, e.heap[s + 1], e.heap[s], e.depth) && s++, !jd(n, a, e.heap[s], e.depth)); )
    e.heap[t] = e.heap[s], t = s, s <<= 1;
  e.heap[t] = a;
}, e1 = (e, n, t) => {
  let a, s, o = 0, h, l;
  if (e.sym_next !== 0)
    do
      a = e.pending_buf[e.sym_buf + o++] & 255, a += (e.pending_buf[e.sym_buf + o++] & 255) << 8, s = e.pending_buf[e.sym_buf + o++], a === 0 ? Wn(e, s, n) : (h = iu[s], Wn(e, h + yu + 1, n), l = Sl[h], l !== 0 && (s -= lh[h], Zt(e, s, l)), a--, h = ag(a), Wn(e, h, t), l = Po[h], l !== 0 && (a -= Xo[h], Zt(e, a, l)));
    while (o < e.sym_next);
  Wn(e, fh, n);
}, kl = (e, n) => {
  const t = n.dyn_tree, a = n.stat_desc.static_tree, s = n.stat_desc.has_stree, o = n.stat_desc.elems;
  let h, l, v = -1, c;
  for (e.heap_len = 0, e.heap_max = Qp, h = 0; h < o; h++)
    t[h * 2] !== 0 ? (e.heap[++e.heap_len] = v = h, e.depth[h] = 0) : t[h * 2 + 1] = 0;
  for (; e.heap_len < 2; )
    c = e.heap[++e.heap_len] = v < 2 ? ++v : 0, t[c * 2] = 1, e.depth[c] = 0, e.opt_len--, s && (e.static_len -= a[c * 2 + 1]);
  for (n.max_code = v, h = e.heap_len >> 1; h >= 1; h--)
    el(e, t, h);
  c = o;
  do
    h = e.heap[
      1
      /*SMALLEST*/
    ], e.heap[
      1
      /*SMALLEST*/
    ] = e.heap[e.heap_len--], el(
      e,
      t,
      1
      /*SMALLEST*/
    ), l = e.heap[
      1
      /*SMALLEST*/
    ], e.heap[--e.heap_max] = h, e.heap[--e.heap_max] = l, t[c * 2] = t[h * 2] + t[l * 2], e.depth[c] = (e.depth[h] >= e.depth[l] ? e.depth[h] : e.depth[l]) + 1, t[h * 2 + 1] = t[l * 2 + 1] = c, e.heap[
      1
      /*SMALLEST*/
    ] = c++, el(
      e,
      t,
      1
      /*SMALLEST*/
    );
  while (e.heap_len >= 2);
  e.heap[--e.heap_max] = e.heap[
    1
    /*SMALLEST*/
  ], hA(e, n), og(t, v, e.bl_count);
}, t1 = (e, n, t) => {
  let a, s = -1, o, h = n[0 * 2 + 1], l = 0, v = 7, c = 4;
  for (h === 0 && (v = 138, c = 3), n[(t + 1) * 2 + 1] = 65535, a = 0; a <= t; a++)
    o = h, h = n[(a + 1) * 2 + 1], !(++l < v && o === h) && (l < c ? e.bl_tree[o * 2] += l : o !== 0 ? (o !== s && e.bl_tree[o * 2]++, e.bl_tree[Jp * 2]++) : l <= 10 ? e.bl_tree[jp * 2]++ : e.bl_tree[eg * 2]++, l = 0, s = o, h === 0 ? (v = 138, c = 3) : o === h ? (v = 6, c = 3) : (v = 7, c = 4));
}, n1 = (e, n, t) => {
  let a, s = -1, o, h = n[0 * 2 + 1], l = 0, v = 7, c = 4;
  for (h === 0 && (v = 138, c = 3), a = 0; a <= t; a++)
    if (o = h, h = n[(a + 1) * 2 + 1], !(++l < v && o === h)) {
      if (l < c)
        do
          Wn(e, o, e.bl_tree);
        while (--l !== 0);
      else o !== 0 ? (o !== s && (Wn(e, o, e.bl_tree), l--), Wn(e, Jp, e.bl_tree), Zt(e, l - 3, 2)) : l <= 10 ? (Wn(e, jp, e.bl_tree), Zt(e, l - 3, 3)) : (Wn(e, eg, e.bl_tree), Zt(e, l - 11, 7));
      l = 0, s = o, h === 0 ? (v = 138, c = 3) : o === h ? (v = 6, c = 3) : (v = 7, c = 4);
    }
}, dA = (e) => {
  let n;
  for (t1(e, e.dyn_ltree, e.l_desc.max_code), t1(e, e.dyn_dtree, e.d_desc.max_code), kl(e, e.bl_desc), n = sh - 1; n >= 3 && e.bl_tree[tg[n] * 2 + 1] === 0; n--)
    ;
  return e.opt_len += 3 * (n + 1) + 5 + 5 + 4, n;
}, pA = (e, n, t, a) => {
  let s;
  for (Zt(e, n - 257, 5), Zt(e, t - 1, 5), Zt(e, a - 4, 4), s = 0; s < a; s++)
    Zt(e, e.bl_tree[tg[s] * 2 + 1], 3);
  n1(e, e.dyn_ltree, n - 1), n1(e, e.dyn_dtree, t - 1);
}, gA = (e) => {
  let n = 4093624447, t;
  for (t = 0; t <= 31; t++, n >>>= 1)
    if (n & 1 && e.dyn_ltree[t * 2] !== 0)
      return Qd;
  if (e.dyn_ltree[9 * 2] !== 0 || e.dyn_ltree[10 * 2] !== 0 || e.dyn_ltree[13 * 2] !== 0)
    return Jd;
  for (t = 32; t < yu; t++)
    if (e.dyn_ltree[t * 2] !== 0)
      return Jd;
  return Qd;
};
let r1 = !1;
const _A = (e) => {
  r1 || (cA(), r1 = !0), e.l_desc = new jf(e.dyn_ltree, ng), e.d_desc = new jf(e.dyn_dtree, rg), e.bl_desc = new jf(e.bl_tree, ig), e.bi_buf = 0, e.bi_valid = 0, sg(e);
}, lg = (e, n, t, a) => {
  Zt(e, (rA << 1) + (a ? 1 : 0), 3), fg(e), au(e, t), au(e, ~t), t && e.pending_buf.set(e.window.subarray(n, n + t), e.pending), e.pending += t;
}, wA = (e) => {
  Zt(e, Yp << 1, 3), Wn(e, fh, pr), lA(e);
}, bA = (e, n, t, a) => {
  let s, o, h = 0;
  e.level > 0 ? (e.strm.data_type === nA && (e.strm.data_type = gA(e)), kl(e, e.l_desc), kl(e, e.d_desc), h = dA(e), s = e.opt_len + 3 + 7 >>> 3, o = e.static_len + 3 + 7 >>> 3, o <= s && (s = o)) : s = o = t + 5, t + 4 <= s && n !== -1 ? lg(e, n, t, a) : e.strategy === tA || o === s ? (Zt(e, (Yp << 1) + (a ? 1 : 0), 3), e1(e, pr, Wa)) : (Zt(e, (iA << 1) + (a ? 1 : 0), 3), pA(e, e.l_desc.max_code + 1, e.d_desc.max_code + 1, h + 1), e1(e, e.dyn_ltree, e.dyn_dtree)), sg(e), a && fg(e);
}, vA = (e, n, t) => (e.pending_buf[e.sym_buf + e.sym_next++] = n, e.pending_buf[e.sym_buf + e.sym_next++] = n >> 8, e.pending_buf[e.sym_buf + e.sym_next++] = t, n === 0 ? e.dyn_ltree[t * 2]++ : (e.matches++, n--, e.dyn_ltree[(iu[t] + yu + 1) * 2]++, e.dyn_dtree[ag(n) * 2]++), e.sym_next === e.sym_end);
var DA = _A, mA = lg, yA = bA, EA = vA, CA = wA, xA = {
  _tr_init: DA,
  _tr_stored_block: mA,
  _tr_flush_block: yA,
  _tr_tally: EA,
  _tr_align: CA
};
const AA = (e, n, t, a) => {
  let s = e & 65535 | 0, o = e >>> 16 & 65535 | 0, h = 0;
  for (; t !== 0; ) {
    h = t > 2e3 ? 2e3 : t, t -= h;
    do
      s = s + n[a++] | 0, o = o + s | 0;
    while (--h);
    s %= 65521, o %= 65521;
  }
  return s | o << 16 | 0;
};
var uu = AA;
const FA = () => {
  let e, n = [];
  for (var t = 0; t < 256; t++) {
    e = t;
    for (var a = 0; a < 8; a++)
      e = e & 1 ? 3988292384 ^ e >>> 1 : e >>> 1;
    n[t] = e;
  }
  return n;
}, BA = new Uint32Array(FA()), SA = (e, n, t, a) => {
  const s = BA, o = a + t;
  e ^= -1;
  for (let h = a; h < o; h++)
    e = e >>> 8 ^ s[(e ^ n[h]) & 255];
  return e ^ -1;
};
var pt = SA, ia = {
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
}, Eu = {
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
  Z_MEM_ERROR: -4,
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
const { _tr_init: kA, _tr_stored_block: Il, _tr_flush_block: IA, _tr_tally: zr, _tr_align: TA } = xA, {
  Z_NO_FLUSH: Zr,
  Z_PARTIAL_FLUSH: $A,
  Z_FULL_FLUSH: RA,
  Z_FINISH: gn,
  Z_BLOCK: i1,
  Z_OK: wt,
  Z_STREAM_END: a1,
  Z_STREAM_ERROR: Vn,
  Z_DATA_ERROR: NA,
  Z_BUF_ERROR: tl,
  Z_DEFAULT_COMPRESSION: LA,
  Z_FILTERED: OA,
  Z_HUFFMAN_ONLY: xo,
  Z_RLE: PA,
  Z_FIXED: UA,
  Z_DEFAULT_STRATEGY: MA,
  Z_UNKNOWN: zA,
  Z_DEFLATED: os
} = Eu, ZA = 9, qA = 15, HA = 8, GA = 29, WA = 256, Tl = WA + 1 + GA, VA = 30, XA = 19, KA = 2 * Tl + 1, YA = 15, Fe = 3, Ur = 258, Xn = Ur + Fe + 1, QA = 32, aa = 42, hh = 57, $l = 69, Rl = 73, Nl = 91, Ll = 103, hi = 113, Pa = 666, $t = 1, ca = 2, vi = 3, da = 4, JA = 3, ci = (e, n) => (e.msg = ia[n], n), u1 = (e) => e * 2 - (e > 4 ? 9 : 0), Lr = (e) => {
  let n = e.length;
  for (; --n >= 0; )
    e[n] = 0;
}, jA = (e) => {
  let n, t, a, s = e.w_size;
  n = e.hash_size, a = n;
  do
    t = e.head[--a], e.head[a] = t >= s ? t - s : 0;
  while (--n);
  n = s, a = n;
  do
    t = e.prev[--a], e.prev[a] = t >= s ? t - s : 0;
  while (--n);
};
let e3 = (e, n, t) => (n << e.hash_shift ^ t) & e.hash_mask, qr = e3;
const Jt = (e) => {
  const n = e.state;
  let t = n.pending;
  t > e.avail_out && (t = e.avail_out), t !== 0 && (e.output.set(n.pending_buf.subarray(n.pending_out, n.pending_out + t), e.next_out), e.next_out += t, n.pending_out += t, e.total_out += t, e.avail_out -= t, n.pending -= t, n.pending === 0 && (n.pending_out = 0));
}, en = (e, n) => {
  IA(e, e.block_start >= 0 ? e.block_start : -1, e.strstart - e.block_start, n), e.block_start = e.strstart, Jt(e.strm);
}, Te = (e, n) => {
  e.pending_buf[e.pending++] = n;
}, $a = (e, n) => {
  e.pending_buf[e.pending++] = n >>> 8 & 255, e.pending_buf[e.pending++] = n & 255;
}, Ol = (e, n, t, a) => {
  let s = e.avail_in;
  return s > a && (s = a), s === 0 ? 0 : (e.avail_in -= s, n.set(e.input.subarray(e.next_in, e.next_in + s), t), e.state.wrap === 1 ? e.adler = uu(e.adler, n, s, t) : e.state.wrap === 2 && (e.adler = pt(e.adler, n, s, t)), e.next_in += s, e.total_in += s, s);
}, hg = (e, n) => {
  let t = e.max_chain_length, a = e.strstart, s, o, h = e.prev_length, l = e.nice_match;
  const v = e.strstart > e.w_size - Xn ? e.strstart - (e.w_size - Xn) : 0, c = e.window, d = e.w_mask, A = e.prev, C = e.strstart + Ur;
  let y = c[a + h - 1], k = c[a + h];
  e.prev_length >= e.good_match && (t >>= 2), l > e.lookahead && (l = e.lookahead);
  do
    if (s = n, !(c[s + h] !== k || c[s + h - 1] !== y || c[s] !== c[a] || c[++s] !== c[a + 1])) {
      a += 2, s++;
      do
        ;
      while (c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && c[++a] === c[++s] && a < C);
      if (o = Ur - (C - a), a = C - Ur, o > h) {
        if (e.match_start = n, h = o, o >= l)
          break;
        y = c[a + h - 1], k = c[a + h];
      }
    }
  while ((n = A[n & d]) > v && --t !== 0);
  return h <= e.lookahead ? h : e.lookahead;
}, ua = (e) => {
  const n = e.w_size;
  let t, a, s;
  do {
    if (a = e.window_size - e.lookahead - e.strstart, e.strstart >= n + (n - Xn) && (e.window.set(e.window.subarray(n, n + n - a), 0), e.match_start -= n, e.strstart -= n, e.block_start -= n, e.insert > e.strstart && (e.insert = e.strstart), jA(e), a += n), e.strm.avail_in === 0)
      break;
    if (t = Ol(e.strm, e.window, e.strstart + e.lookahead, a), e.lookahead += t, e.lookahead + e.insert >= Fe)
      for (s = e.strstart - e.insert, e.ins_h = e.window[s], e.ins_h = qr(e, e.ins_h, e.window[s + 1]); e.insert && (e.ins_h = qr(e, e.ins_h, e.window[s + Fe - 1]), e.prev[s & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = s, s++, e.insert--, !(e.lookahead + e.insert < Fe)); )
        ;
  } while (e.lookahead < Xn && e.strm.avail_in !== 0);
}, cg = (e, n) => {
  let t = e.pending_buf_size - 5 > e.w_size ? e.w_size : e.pending_buf_size - 5, a, s, o, h = 0, l = e.strm.avail_in;
  do {
    if (a = 65535, o = e.bi_valid + 42 >> 3, e.strm.avail_out < o || (o = e.strm.avail_out - o, s = e.strstart - e.block_start, a > s + e.strm.avail_in && (a = s + e.strm.avail_in), a > o && (a = o), a < t && (a === 0 && n !== gn || n === Zr || a !== s + e.strm.avail_in)))
      break;
    h = n === gn && a === s + e.strm.avail_in ? 1 : 0, Il(e, 0, 0, h), e.pending_buf[e.pending - 4] = a, e.pending_buf[e.pending - 3] = a >> 8, e.pending_buf[e.pending - 2] = ~a, e.pending_buf[e.pending - 1] = ~a >> 8, Jt(e.strm), s && (s > a && (s = a), e.strm.output.set(e.window.subarray(e.block_start, e.block_start + s), e.strm.next_out), e.strm.next_out += s, e.strm.avail_out -= s, e.strm.total_out += s, e.block_start += s, a -= s), a && (Ol(e.strm, e.strm.output, e.strm.next_out, a), e.strm.next_out += a, e.strm.avail_out -= a, e.strm.total_out += a);
  } while (h === 0);
  return l -= e.strm.avail_in, l && (l >= e.w_size ? (e.matches = 2, e.window.set(e.strm.input.subarray(e.strm.next_in - e.w_size, e.strm.next_in), 0), e.strstart = e.w_size, e.insert = e.strstart) : (e.window_size - e.strstart <= l && (e.strstart -= e.w_size, e.window.set(e.window.subarray(e.w_size, e.w_size + e.strstart), 0), e.matches < 2 && e.matches++, e.insert > e.strstart && (e.insert = e.strstart)), e.window.set(e.strm.input.subarray(e.strm.next_in - l, e.strm.next_in), e.strstart), e.strstart += l, e.insert += l > e.w_size - e.insert ? e.w_size - e.insert : l), e.block_start = e.strstart), e.high_water < e.strstart && (e.high_water = e.strstart), h ? da : n !== Zr && n !== gn && e.strm.avail_in === 0 && e.strstart === e.block_start ? ca : (o = e.window_size - e.strstart, e.strm.avail_in > o && e.block_start >= e.w_size && (e.block_start -= e.w_size, e.strstart -= e.w_size, e.window.set(e.window.subarray(e.w_size, e.w_size + e.strstart), 0), e.matches < 2 && e.matches++, o += e.w_size, e.insert > e.strstart && (e.insert = e.strstart)), o > e.strm.avail_in && (o = e.strm.avail_in), o && (Ol(e.strm, e.window, e.strstart, o), e.strstart += o, e.insert += o > e.w_size - e.insert ? e.w_size - e.insert : o), e.high_water < e.strstart && (e.high_water = e.strstart), o = e.bi_valid + 42 >> 3, o = e.pending_buf_size - o > 65535 ? 65535 : e.pending_buf_size - o, t = o > e.w_size ? e.w_size : o, s = e.strstart - e.block_start, (s >= t || (s || n === gn) && n !== Zr && e.strm.avail_in === 0 && s <= o) && (a = s > o ? o : s, h = n === gn && e.strm.avail_in === 0 && a === s ? 1 : 0, Il(e, e.block_start, a, h), e.block_start += a, Jt(e.strm)), h ? vi : $t);
}, nl = (e, n) => {
  let t, a;
  for (; ; ) {
    if (e.lookahead < Xn) {
      if (ua(e), e.lookahead < Xn && n === Zr)
        return $t;
      if (e.lookahead === 0)
        break;
    }
    if (t = 0, e.lookahead >= Fe && (e.ins_h = qr(e, e.ins_h, e.window[e.strstart + Fe - 1]), t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), t !== 0 && e.strstart - t <= e.w_size - Xn && (e.match_length = hg(e, t)), e.match_length >= Fe)
      if (a = zr(e, e.strstart - e.match_start, e.match_length - Fe), e.lookahead -= e.match_length, e.match_length <= e.max_lazy_match && e.lookahead >= Fe) {
        e.match_length--;
        do
          e.strstart++, e.ins_h = qr(e, e.ins_h, e.window[e.strstart + Fe - 1]), t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart;
        while (--e.match_length !== 0);
        e.strstart++;
      } else
        e.strstart += e.match_length, e.match_length = 0, e.ins_h = e.window[e.strstart], e.ins_h = qr(e, e.ins_h, e.window[e.strstart + 1]);
    else
      a = zr(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++;
    if (a && (en(e, !1), e.strm.avail_out === 0))
      return $t;
  }
  return e.insert = e.strstart < Fe - 1 ? e.strstart : Fe - 1, n === gn ? (en(e, !0), e.strm.avail_out === 0 ? vi : da) : e.sym_next && (en(e, !1), e.strm.avail_out === 0) ? $t : ca;
}, qi = (e, n) => {
  let t, a, s;
  for (; ; ) {
    if (e.lookahead < Xn) {
      if (ua(e), e.lookahead < Xn && n === Zr)
        return $t;
      if (e.lookahead === 0)
        break;
    }
    if (t = 0, e.lookahead >= Fe && (e.ins_h = qr(e, e.ins_h, e.window[e.strstart + Fe - 1]), t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart), e.prev_length = e.match_length, e.prev_match = e.match_start, e.match_length = Fe - 1, t !== 0 && e.prev_length < e.max_lazy_match && e.strstart - t <= e.w_size - Xn && (e.match_length = hg(e, t), e.match_length <= 5 && (e.strategy === OA || e.match_length === Fe && e.strstart - e.match_start > 4096) && (e.match_length = Fe - 1)), e.prev_length >= Fe && e.match_length <= e.prev_length) {
      s = e.strstart + e.lookahead - Fe, a = zr(e, e.strstart - 1 - e.prev_match, e.prev_length - Fe), e.lookahead -= e.prev_length - 1, e.prev_length -= 2;
      do
        ++e.strstart <= s && (e.ins_h = qr(e, e.ins_h, e.window[e.strstart + Fe - 1]), t = e.prev[e.strstart & e.w_mask] = e.head[e.ins_h], e.head[e.ins_h] = e.strstart);
      while (--e.prev_length !== 0);
      if (e.match_available = 0, e.match_length = Fe - 1, e.strstart++, a && (en(e, !1), e.strm.avail_out === 0))
        return $t;
    } else if (e.match_available) {
      if (a = zr(e, 0, e.window[e.strstart - 1]), a && en(e, !1), e.strstart++, e.lookahead--, e.strm.avail_out === 0)
        return $t;
    } else
      e.match_available = 1, e.strstart++, e.lookahead--;
  }
  return e.match_available && (a = zr(e, 0, e.window[e.strstart - 1]), e.match_available = 0), e.insert = e.strstart < Fe - 1 ? e.strstart : Fe - 1, n === gn ? (en(e, !0), e.strm.avail_out === 0 ? vi : da) : e.sym_next && (en(e, !1), e.strm.avail_out === 0) ? $t : ca;
}, t3 = (e, n) => {
  let t, a, s, o;
  const h = e.window;
  for (; ; ) {
    if (e.lookahead <= Ur) {
      if (ua(e), e.lookahead <= Ur && n === Zr)
        return $t;
      if (e.lookahead === 0)
        break;
    }
    if (e.match_length = 0, e.lookahead >= Fe && e.strstart > 0 && (s = e.strstart - 1, a = h[s], a === h[++s] && a === h[++s] && a === h[++s])) {
      o = e.strstart + Ur;
      do
        ;
      while (a === h[++s] && a === h[++s] && a === h[++s] && a === h[++s] && a === h[++s] && a === h[++s] && a === h[++s] && a === h[++s] && s < o);
      e.match_length = Ur - (o - s), e.match_length > e.lookahead && (e.match_length = e.lookahead);
    }
    if (e.match_length >= Fe ? (t = zr(e, 1, e.match_length - Fe), e.lookahead -= e.match_length, e.strstart += e.match_length, e.match_length = 0) : (t = zr(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++), t && (en(e, !1), e.strm.avail_out === 0))
      return $t;
  }
  return e.insert = 0, n === gn ? (en(e, !0), e.strm.avail_out === 0 ? vi : da) : e.sym_next && (en(e, !1), e.strm.avail_out === 0) ? $t : ca;
}, n3 = (e, n) => {
  let t;
  for (; ; ) {
    if (e.lookahead === 0 && (ua(e), e.lookahead === 0)) {
      if (n === Zr)
        return $t;
      break;
    }
    if (e.match_length = 0, t = zr(e, 0, e.window[e.strstart]), e.lookahead--, e.strstart++, t && (en(e, !1), e.strm.avail_out === 0))
      return $t;
  }
  return e.insert = 0, n === gn ? (en(e, !0), e.strm.avail_out === 0 ? vi : da) : e.sym_next && (en(e, !1), e.strm.avail_out === 0) ? $t : ca;
};
function Zn(e, n, t, a, s) {
  this.good_length = e, this.max_lazy = n, this.nice_length = t, this.max_chain = a, this.func = s;
}
const Ua = [
  /*      good lazy nice chain */
  new Zn(0, 0, 0, 0, cg),
  /* 0 store only */
  new Zn(4, 4, 8, 4, nl),
  /* 1 max speed, no lazy matches */
  new Zn(4, 5, 16, 8, nl),
  /* 2 */
  new Zn(4, 6, 32, 32, nl),
  /* 3 */
  new Zn(4, 4, 16, 16, qi),
  /* 4 lazy matches */
  new Zn(8, 16, 32, 32, qi),
  /* 5 */
  new Zn(8, 16, 128, 128, qi),
  /* 6 */
  new Zn(8, 32, 128, 256, qi),
  /* 7 */
  new Zn(32, 128, 258, 1024, qi),
  /* 8 */
  new Zn(32, 258, 258, 4096, qi)
  /* 9 max compression */
], r3 = (e) => {
  e.window_size = 2 * e.w_size, Lr(e.head), e.max_lazy_match = Ua[e.level].max_lazy, e.good_match = Ua[e.level].good_length, e.nice_match = Ua[e.level].nice_length, e.max_chain_length = Ua[e.level].max_chain, e.strstart = 0, e.block_start = 0, e.lookahead = 0, e.insert = 0, e.match_length = e.prev_length = Fe - 1, e.match_available = 0, e.ins_h = 0;
};
function i3() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = os, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(KA * 2), this.dyn_dtree = new Uint16Array((2 * VA + 1) * 2), this.bl_tree = new Uint16Array((2 * XA + 1) * 2), Lr(this.dyn_ltree), Lr(this.dyn_dtree), Lr(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(YA + 1), this.heap = new Uint16Array(2 * Tl + 1), Lr(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * Tl + 1), Lr(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const Cu = (e) => {
  if (!e)
    return 1;
  const n = e.state;
  return !n || n.strm !== e || n.status !== aa && //#ifdef GZIP
  n.status !== hh && //#endif
  n.status !== $l && n.status !== Rl && n.status !== Nl && n.status !== Ll && n.status !== hi && n.status !== Pa ? 1 : 0;
}, dg = (e) => {
  if (Cu(e))
    return ci(e, Vn);
  e.total_in = e.total_out = 0, e.data_type = zA;
  const n = e.state;
  return n.pending = 0, n.pending_out = 0, n.wrap < 0 && (n.wrap = -n.wrap), n.status = //#ifdef GZIP
  n.wrap === 2 ? hh : (
    //#endif
    n.wrap ? aa : hi
  ), e.adler = n.wrap === 2 ? 0 : 1, n.last_flush = -2, kA(n), wt;
}, pg = (e) => {
  const n = dg(e);
  return n === wt && r3(e.state), n;
}, a3 = (e, n) => Cu(e) || e.state.wrap !== 2 ? Vn : (e.state.gzhead = n, wt), gg = (e, n, t, a, s, o) => {
  if (!e)
    return Vn;
  let h = 1;
  if (n === LA && (n = 6), a < 0 ? (h = 0, a = -a) : a > 15 && (h = 2, a -= 16), s < 1 || s > ZA || t !== os || a < 8 || a > 15 || n < 0 || n > 9 || o < 0 || o > UA || a === 8 && h !== 1)
    return ci(e, Vn);
  a === 8 && (a = 9);
  const l = new i3();
  return e.state = l, l.strm = e, l.status = aa, l.wrap = h, l.gzhead = null, l.w_bits = a, l.w_size = 1 << l.w_bits, l.w_mask = l.w_size - 1, l.hash_bits = s + 7, l.hash_size = 1 << l.hash_bits, l.hash_mask = l.hash_size - 1, l.hash_shift = ~~((l.hash_bits + Fe - 1) / Fe), l.window = new Uint8Array(l.w_size * 2), l.head = new Uint16Array(l.hash_size), l.prev = new Uint16Array(l.w_size), l.lit_bufsize = 1 << s + 6, l.pending_buf_size = l.lit_bufsize * 4, l.pending_buf = new Uint8Array(l.pending_buf_size), l.sym_buf = l.lit_bufsize, l.sym_end = (l.lit_bufsize - 1) * 3, l.level = n, l.strategy = o, l.method = t, pg(e);
}, u3 = (e, n) => gg(e, n, os, qA, HA, MA), o3 = (e, n) => {
  if (Cu(e) || n > i1 || n < 0)
    return e ? ci(e, Vn) : Vn;
  const t = e.state;
  if (!e.output || e.avail_in !== 0 && !e.input || t.status === Pa && n !== gn)
    return ci(e, e.avail_out === 0 ? tl : Vn);
  const a = t.last_flush;
  if (t.last_flush = n, t.pending !== 0) {
    if (Jt(e), e.avail_out === 0)
      return t.last_flush = -1, wt;
  } else if (e.avail_in === 0 && u1(n) <= u1(a) && n !== gn)
    return ci(e, tl);
  if (t.status === Pa && e.avail_in !== 0)
    return ci(e, tl);
  if (t.status === aa && t.wrap === 0 && (t.status = hi), t.status === aa) {
    let s = os + (t.w_bits - 8 << 4) << 8, o = -1;
    if (t.strategy >= xo || t.level < 2 ? o = 0 : t.level < 6 ? o = 1 : t.level === 6 ? o = 2 : o = 3, s |= o << 6, t.strstart !== 0 && (s |= QA), s += 31 - s % 31, $a(t, s), t.strstart !== 0 && ($a(t, e.adler >>> 16), $a(t, e.adler & 65535)), e.adler = 1, t.status = hi, Jt(e), t.pending !== 0)
      return t.last_flush = -1, wt;
  }
  if (t.status === hh) {
    if (e.adler = 0, Te(t, 31), Te(t, 139), Te(t, 8), t.gzhead)
      Te(
        t,
        (t.gzhead.text ? 1 : 0) + (t.gzhead.hcrc ? 2 : 0) + (t.gzhead.extra ? 4 : 0) + (t.gzhead.name ? 8 : 0) + (t.gzhead.comment ? 16 : 0)
      ), Te(t, t.gzhead.time & 255), Te(t, t.gzhead.time >> 8 & 255), Te(t, t.gzhead.time >> 16 & 255), Te(t, t.gzhead.time >> 24 & 255), Te(t, t.level === 9 ? 2 : t.strategy >= xo || t.level < 2 ? 4 : 0), Te(t, t.gzhead.os & 255), t.gzhead.extra && t.gzhead.extra.length && (Te(t, t.gzhead.extra.length & 255), Te(t, t.gzhead.extra.length >> 8 & 255)), t.gzhead.hcrc && (e.adler = pt(e.adler, t.pending_buf, t.pending, 0)), t.gzindex = 0, t.status = $l;
    else if (Te(t, 0), Te(t, 0), Te(t, 0), Te(t, 0), Te(t, 0), Te(t, t.level === 9 ? 2 : t.strategy >= xo || t.level < 2 ? 4 : 0), Te(t, JA), t.status = hi, Jt(e), t.pending !== 0)
      return t.last_flush = -1, wt;
  }
  if (t.status === $l) {
    if (t.gzhead.extra) {
      let s = t.pending, o = (t.gzhead.extra.length & 65535) - t.gzindex;
      for (; t.pending + o > t.pending_buf_size; ) {
        let l = t.pending_buf_size - t.pending;
        if (t.pending_buf.set(t.gzhead.extra.subarray(t.gzindex, t.gzindex + l), t.pending), t.pending = t.pending_buf_size, t.gzhead.hcrc && t.pending > s && (e.adler = pt(e.adler, t.pending_buf, t.pending - s, s)), t.gzindex += l, Jt(e), t.pending !== 0)
          return t.last_flush = -1, wt;
        s = 0, o -= l;
      }
      let h = new Uint8Array(t.gzhead.extra);
      t.pending_buf.set(h.subarray(t.gzindex, t.gzindex + o), t.pending), t.pending += o, t.gzhead.hcrc && t.pending > s && (e.adler = pt(e.adler, t.pending_buf, t.pending - s, s)), t.gzindex = 0;
    }
    t.status = Rl;
  }
  if (t.status === Rl) {
    if (t.gzhead.name) {
      let s = t.pending, o;
      do {
        if (t.pending === t.pending_buf_size) {
          if (t.gzhead.hcrc && t.pending > s && (e.adler = pt(e.adler, t.pending_buf, t.pending - s, s)), Jt(e), t.pending !== 0)
            return t.last_flush = -1, wt;
          s = 0;
        }
        t.gzindex < t.gzhead.name.length ? o = t.gzhead.name.charCodeAt(t.gzindex++) & 255 : o = 0, Te(t, o);
      } while (o !== 0);
      t.gzhead.hcrc && t.pending > s && (e.adler = pt(e.adler, t.pending_buf, t.pending - s, s)), t.gzindex = 0;
    }
    t.status = Nl;
  }
  if (t.status === Nl) {
    if (t.gzhead.comment) {
      let s = t.pending, o;
      do {
        if (t.pending === t.pending_buf_size) {
          if (t.gzhead.hcrc && t.pending > s && (e.adler = pt(e.adler, t.pending_buf, t.pending - s, s)), Jt(e), t.pending !== 0)
            return t.last_flush = -1, wt;
          s = 0;
        }
        t.gzindex < t.gzhead.comment.length ? o = t.gzhead.comment.charCodeAt(t.gzindex++) & 255 : o = 0, Te(t, o);
      } while (o !== 0);
      t.gzhead.hcrc && t.pending > s && (e.adler = pt(e.adler, t.pending_buf, t.pending - s, s));
    }
    t.status = Ll;
  }
  if (t.status === Ll) {
    if (t.gzhead.hcrc) {
      if (t.pending + 2 > t.pending_buf_size && (Jt(e), t.pending !== 0))
        return t.last_flush = -1, wt;
      Te(t, e.adler & 255), Te(t, e.adler >> 8 & 255), e.adler = 0;
    }
    if (t.status = hi, Jt(e), t.pending !== 0)
      return t.last_flush = -1, wt;
  }
  if (e.avail_in !== 0 || t.lookahead !== 0 || n !== Zr && t.status !== Pa) {
    let s = t.level === 0 ? cg(t, n) : t.strategy === xo ? n3(t, n) : t.strategy === PA ? t3(t, n) : Ua[t.level].func(t, n);
    if ((s === vi || s === da) && (t.status = Pa), s === $t || s === vi)
      return e.avail_out === 0 && (t.last_flush = -1), wt;
    if (s === ca && (n === $A ? TA(t) : n !== i1 && (Il(t, 0, 0, !1), n === RA && (Lr(t.head), t.lookahead === 0 && (t.strstart = 0, t.block_start = 0, t.insert = 0))), Jt(e), e.avail_out === 0))
      return t.last_flush = -1, wt;
  }
  return n !== gn ? wt : t.wrap <= 0 ? a1 : (t.wrap === 2 ? (Te(t, e.adler & 255), Te(t, e.adler >> 8 & 255), Te(t, e.adler >> 16 & 255), Te(t, e.adler >> 24 & 255), Te(t, e.total_in & 255), Te(t, e.total_in >> 8 & 255), Te(t, e.total_in >> 16 & 255), Te(t, e.total_in >> 24 & 255)) : ($a(t, e.adler >>> 16), $a(t, e.adler & 65535)), Jt(e), t.wrap > 0 && (t.wrap = -t.wrap), t.pending !== 0 ? wt : a1);
}, s3 = (e) => {
  if (Cu(e))
    return Vn;
  const n = e.state.status;
  return e.state = null, n === hi ? ci(e, NA) : wt;
}, f3 = (e, n) => {
  let t = n.length;
  if (Cu(e))
    return Vn;
  const a = e.state, s = a.wrap;
  if (s === 2 || s === 1 && a.status !== aa || a.lookahead)
    return Vn;
  if (s === 1 && (e.adler = uu(e.adler, n, t, 0)), a.wrap = 0, t >= a.w_size) {
    s === 0 && (Lr(a.head), a.strstart = 0, a.block_start = 0, a.insert = 0);
    let v = new Uint8Array(a.w_size);
    v.set(n.subarray(t - a.w_size, t), 0), n = v, t = a.w_size;
  }
  const o = e.avail_in, h = e.next_in, l = e.input;
  for (e.avail_in = t, e.next_in = 0, e.input = n, ua(a); a.lookahead >= Fe; ) {
    let v = a.strstart, c = a.lookahead - (Fe - 1);
    do
      a.ins_h = qr(a, a.ins_h, a.window[v + Fe - 1]), a.prev[v & a.w_mask] = a.head[a.ins_h], a.head[a.ins_h] = v, v++;
    while (--c);
    a.strstart = v, a.lookahead = Fe - 1, ua(a);
  }
  return a.strstart += a.lookahead, a.block_start = a.strstart, a.insert = a.lookahead, a.lookahead = 0, a.match_length = a.prev_length = Fe - 1, a.match_available = 0, e.next_in = h, e.input = l, e.avail_in = o, a.wrap = s, wt;
};
var l3 = u3, h3 = gg, c3 = pg, d3 = dg, p3 = a3, g3 = o3, _3 = s3, w3 = f3, b3 = "pako deflate (from Nodeca project)", Va = {
  deflateInit: l3,
  deflateInit2: h3,
  deflateReset: c3,
  deflateResetKeep: d3,
  deflateSetHeader: p3,
  deflate: g3,
  deflateEnd: _3,
  deflateSetDictionary: w3,
  deflateInfo: b3
};
const v3 = (e, n) => Object.prototype.hasOwnProperty.call(e, n);
var D3 = function(e) {
  const n = Array.prototype.slice.call(arguments, 1);
  for (; n.length; ) {
    const t = n.shift();
    if (t) {
      if (typeof t != "object")
        throw new TypeError(t + "must be non-object");
      for (const a in t)
        v3(t, a) && (e[a] = t[a]);
    }
  }
  return e;
}, m3 = (e) => {
  let n = 0;
  for (let a = 0, s = e.length; a < s; a++)
    n += e[a].length;
  const t = new Uint8Array(n);
  for (let a = 0, s = 0, o = e.length; a < o; a++) {
    let h = e[a];
    t.set(h, s), s += h.length;
  }
  return t;
}, ss = {
  assign: D3,
  flattenChunks: m3
};
let _g = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  _g = !1;
}
const ou = new Uint8Array(256);
for (let e = 0; e < 256; e++)
  ou[e] = e >= 252 ? 6 : e >= 248 ? 5 : e >= 240 ? 4 : e >= 224 ? 3 : e >= 192 ? 2 : 1;
ou[254] = ou[254] = 1;
var y3 = (e) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(e);
  let n, t, a, s, o, h = e.length, l = 0;
  for (s = 0; s < h; s++)
    t = e.charCodeAt(s), (t & 64512) === 55296 && s + 1 < h && (a = e.charCodeAt(s + 1), (a & 64512) === 56320 && (t = 65536 + (t - 55296 << 10) + (a - 56320), s++)), l += t < 128 ? 1 : t < 2048 ? 2 : t < 65536 ? 3 : 4;
  for (n = new Uint8Array(l), o = 0, s = 0; o < l; s++)
    t = e.charCodeAt(s), (t & 64512) === 55296 && s + 1 < h && (a = e.charCodeAt(s + 1), (a & 64512) === 56320 && (t = 65536 + (t - 55296 << 10) + (a - 56320), s++)), t < 128 ? n[o++] = t : t < 2048 ? (n[o++] = 192 | t >>> 6, n[o++] = 128 | t & 63) : t < 65536 ? (n[o++] = 224 | t >>> 12, n[o++] = 128 | t >>> 6 & 63, n[o++] = 128 | t & 63) : (n[o++] = 240 | t >>> 18, n[o++] = 128 | t >>> 12 & 63, n[o++] = 128 | t >>> 6 & 63, n[o++] = 128 | t & 63);
  return n;
};
const E3 = (e, n) => {
  if (n < 65534 && e.subarray && _g)
    return String.fromCharCode.apply(null, e.length === n ? e : e.subarray(0, n));
  let t = "";
  for (let a = 0; a < n; a++)
    t += String.fromCharCode(e[a]);
  return t;
};
var C3 = (e, n) => {
  const t = n || e.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode)
    return new TextDecoder().decode(e.subarray(0, n));
  let a, s;
  const o = new Array(t * 2);
  for (s = 0, a = 0; a < t; ) {
    let h = e[a++];
    if (h < 128) {
      o[s++] = h;
      continue;
    }
    let l = ou[h];
    if (l > 4) {
      o[s++] = 65533, a += l - 1;
      continue;
    }
    for (h &= l === 2 ? 31 : l === 3 ? 15 : 7; l > 1 && a < t; )
      h = h << 6 | e[a++] & 63, l--;
    if (l > 1) {
      o[s++] = 65533;
      continue;
    }
    h < 65536 ? o[s++] = h : (h -= 65536, o[s++] = 55296 | h >> 10 & 1023, o[s++] = 56320 | h & 1023);
  }
  return E3(o, s);
}, x3 = (e, n) => {
  n = n || e.length, n > e.length && (n = e.length);
  let t = n - 1;
  for (; t >= 0 && (e[t] & 192) === 128; )
    t--;
  return t < 0 || t === 0 ? n : t + ou[e[t]] > n ? t : n;
}, su = {
  string2buf: y3,
  buf2string: C3,
  utf8border: x3
};
function A3() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var wg = A3;
const bg = Object.prototype.toString, {
  Z_NO_FLUSH: F3,
  Z_SYNC_FLUSH: B3,
  Z_FULL_FLUSH: S3,
  Z_FINISH: k3,
  Z_OK: Ko,
  Z_STREAM_END: I3,
  Z_DEFAULT_COMPRESSION: T3,
  Z_DEFAULT_STRATEGY: $3,
  Z_DEFLATED: R3
} = Eu;
function ch(e) {
  this.options = ss.assign({
    level: T3,
    method: R3,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: $3
  }, e || {});
  let n = this.options;
  n.raw && n.windowBits > 0 ? n.windowBits = -n.windowBits : n.gzip && n.windowBits > 0 && n.windowBits < 16 && (n.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new wg(), this.strm.avail_out = 0;
  let t = Va.deflateInit2(
    this.strm,
    n.level,
    n.method,
    n.windowBits,
    n.memLevel,
    n.strategy
  );
  if (t !== Ko)
    throw new Error(ia[t]);
  if (n.header && Va.deflateSetHeader(this.strm, n.header), n.dictionary) {
    let a;
    if (typeof n.dictionary == "string" ? a = su.string2buf(n.dictionary) : bg.call(n.dictionary) === "[object ArrayBuffer]" ? a = new Uint8Array(n.dictionary) : a = n.dictionary, t = Va.deflateSetDictionary(this.strm, a), t !== Ko)
      throw new Error(ia[t]);
    this._dict_set = !0;
  }
}
ch.prototype.push = function(e, n) {
  const t = this.strm, a = this.options.chunkSize;
  let s, o;
  if (this.ended)
    return !1;
  for (n === ~~n ? o = n : o = n === !0 ? k3 : F3, typeof e == "string" ? t.input = su.string2buf(e) : bg.call(e) === "[object ArrayBuffer]" ? t.input = new Uint8Array(e) : t.input = e, t.next_in = 0, t.avail_in = t.input.length; ; ) {
    if (t.avail_out === 0 && (t.output = new Uint8Array(a), t.next_out = 0, t.avail_out = a), (o === B3 || o === S3) && t.avail_out <= 6) {
      this.onData(t.output.subarray(0, t.next_out)), t.avail_out = 0;
      continue;
    }
    if (s = Va.deflate(t, o), s === I3)
      return t.next_out > 0 && this.onData(t.output.subarray(0, t.next_out)), s = Va.deflateEnd(this.strm), this.onEnd(s), this.ended = !0, s === Ko;
    if (t.avail_out === 0) {
      this.onData(t.output);
      continue;
    }
    if (o > 0 && t.next_out > 0) {
      this.onData(t.output.subarray(0, t.next_out)), t.avail_out = 0;
      continue;
    }
    if (t.avail_in === 0) break;
  }
  return !0;
};
ch.prototype.onData = function(e) {
  this.chunks.push(e);
};
ch.prototype.onEnd = function(e) {
  e === Ko && (this.result = ss.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
const Ao = 16209, N3 = 16191;
var L3 = function(n, t) {
  let a, s, o, h, l, v, c, d, A, C, y, k, B, P, T, Z, U, $, L, Q, q, G, J, ee;
  const K = n.state;
  a = n.next_in, J = n.input, s = a + (n.avail_in - 5), o = n.next_out, ee = n.output, h = o - (t - n.avail_out), l = o + (n.avail_out - 257), v = K.dmax, c = K.wsize, d = K.whave, A = K.wnext, C = K.window, y = K.hold, k = K.bits, B = K.lencode, P = K.distcode, T = (1 << K.lenbits) - 1, Z = (1 << K.distbits) - 1;
  e:
    do {
      k < 15 && (y += J[a++] << k, k += 8, y += J[a++] << k, k += 8), U = B[y & T];
      t:
        for (; ; ) {
          if ($ = U >>> 24, y >>>= $, k -= $, $ = U >>> 16 & 255, $ === 0)
            ee[o++] = U & 65535;
          else if ($ & 16) {
            L = U & 65535, $ &= 15, $ && (k < $ && (y += J[a++] << k, k += 8), L += y & (1 << $) - 1, y >>>= $, k -= $), k < 15 && (y += J[a++] << k, k += 8, y += J[a++] << k, k += 8), U = P[y & Z];
            n:
              for (; ; ) {
                if ($ = U >>> 24, y >>>= $, k -= $, $ = U >>> 16 & 255, $ & 16) {
                  if (Q = U & 65535, $ &= 15, k < $ && (y += J[a++] << k, k += 8, k < $ && (y += J[a++] << k, k += 8)), Q += y & (1 << $) - 1, Q > v) {
                    n.msg = "invalid distance too far back", K.mode = Ao;
                    break e;
                  }
                  if (y >>>= $, k -= $, $ = o - h, Q > $) {
                    if ($ = Q - $, $ > d && K.sane) {
                      n.msg = "invalid distance too far back", K.mode = Ao;
                      break e;
                    }
                    if (q = 0, G = C, A === 0) {
                      if (q += c - $, $ < L) {
                        L -= $;
                        do
                          ee[o++] = C[q++];
                        while (--$);
                        q = o - Q, G = ee;
                      }
                    } else if (A < $) {
                      if (q += c + A - $, $ -= A, $ < L) {
                        L -= $;
                        do
                          ee[o++] = C[q++];
                        while (--$);
                        if (q = 0, A < L) {
                          $ = A, L -= $;
                          do
                            ee[o++] = C[q++];
                          while (--$);
                          q = o - Q, G = ee;
                        }
                      }
                    } else if (q += A - $, $ < L) {
                      L -= $;
                      do
                        ee[o++] = C[q++];
                      while (--$);
                      q = o - Q, G = ee;
                    }
                    for (; L > 2; )
                      ee[o++] = G[q++], ee[o++] = G[q++], ee[o++] = G[q++], L -= 3;
                    L && (ee[o++] = G[q++], L > 1 && (ee[o++] = G[q++]));
                  } else {
                    q = o - Q;
                    do
                      ee[o++] = ee[q++], ee[o++] = ee[q++], ee[o++] = ee[q++], L -= 3;
                    while (L > 2);
                    L && (ee[o++] = ee[q++], L > 1 && (ee[o++] = ee[q++]));
                  }
                } else if ($ & 64) {
                  n.msg = "invalid distance code", K.mode = Ao;
                  break e;
                } else {
                  U = P[(U & 65535) + (y & (1 << $) - 1)];
                  continue n;
                }
                break;
              }
          } else if ($ & 64)
            if ($ & 32) {
              K.mode = N3;
              break e;
            } else {
              n.msg = "invalid literal/length code", K.mode = Ao;
              break e;
            }
          else {
            U = B[(U & 65535) + (y & (1 << $) - 1)];
            continue t;
          }
          break;
        }
    } while (a < s && o < l);
  L = k >> 3, a -= L, k -= L << 3, y &= (1 << k) - 1, n.next_in = a, n.next_out = o, n.avail_in = a < s ? 5 + (s - a) : 5 - (a - s), n.avail_out = o < l ? 257 + (l - o) : 257 - (o - l), K.hold = y, K.bits = k;
};
const Hi = 15, o1 = 852, s1 = 592, f1 = 0, rl = 1, l1 = 2, O3 = new Uint16Array([
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
]), P3 = new Uint8Array([
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
]), U3 = new Uint16Array([
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
]), M3 = new Uint8Array([
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
]), z3 = (e, n, t, a, s, o, h, l) => {
  const v = l.bits;
  let c = 0, d = 0, A = 0, C = 0, y = 0, k = 0, B = 0, P = 0, T = 0, Z = 0, U, $, L, Q, q, G = null, J;
  const ee = new Uint16Array(Hi + 1), K = new Uint16Array(Hi + 1);
  let ie = null, Ce, ve, Me;
  for (c = 0; c <= Hi; c++)
    ee[c] = 0;
  for (d = 0; d < a; d++)
    ee[n[t + d]]++;
  for (y = v, C = Hi; C >= 1 && ee[C] === 0; C--)
    ;
  if (y > C && (y = C), C === 0)
    return s[o++] = 1 << 24 | 64 << 16 | 0, s[o++] = 1 << 24 | 64 << 16 | 0, l.bits = 1, 0;
  for (A = 1; A < C && ee[A] === 0; A++)
    ;
  for (y < A && (y = A), P = 1, c = 1; c <= Hi; c++)
    if (P <<= 1, P -= ee[c], P < 0)
      return -1;
  if (P > 0 && (e === f1 || C !== 1))
    return -1;
  for (K[1] = 0, c = 1; c < Hi; c++)
    K[c + 1] = K[c] + ee[c];
  for (d = 0; d < a; d++)
    n[t + d] !== 0 && (h[K[n[t + d]]++] = d);
  if (e === f1 ? (G = ie = h, J = 20) : e === rl ? (G = O3, ie = P3, J = 257) : (G = U3, ie = M3, J = 0), Z = 0, d = 0, c = A, q = o, k = y, B = 0, L = -1, T = 1 << y, Q = T - 1, e === rl && T > o1 || e === l1 && T > s1)
    return 1;
  for (; ; ) {
    Ce = c - B, h[d] + 1 < J ? (ve = 0, Me = h[d]) : h[d] >= J ? (ve = ie[h[d] - J], Me = G[h[d] - J]) : (ve = 96, Me = 0), U = 1 << c - B, $ = 1 << k, A = $;
    do
      $ -= U, s[q + (Z >> B) + $] = Ce << 24 | ve << 16 | Me | 0;
    while ($ !== 0);
    for (U = 1 << c - 1; Z & U; )
      U >>= 1;
    if (U !== 0 ? (Z &= U - 1, Z += U) : Z = 0, d++, --ee[c] === 0) {
      if (c === C)
        break;
      c = n[t + h[d]];
    }
    if (c > y && (Z & Q) !== L) {
      for (B === 0 && (B = y), q += A, k = c - B, P = 1 << k; k + B < C && (P -= ee[k + B], !(P <= 0)); )
        k++, P <<= 1;
      if (T += 1 << k, e === rl && T > o1 || e === l1 && T > s1)
        return 1;
      L = Z & Q, s[L] = y << 24 | k << 16 | q - o | 0;
    }
  }
  return Z !== 0 && (s[q + Z] = c - B << 24 | 64 << 16 | 0), l.bits = y, 0;
};
var Xa = z3;
const Z3 = 0, vg = 1, Dg = 2, {
  Z_FINISH: h1,
  Z_BLOCK: q3,
  Z_TREES: Fo,
  Z_OK: Di,
  Z_STREAM_END: H3,
  Z_NEED_DICT: G3,
  Z_STREAM_ERROR: yn,
  Z_DATA_ERROR: mg,
  Z_MEM_ERROR: yg,
  Z_BUF_ERROR: W3,
  Z_DEFLATED: c1
} = Eu, fs = 16180, d1 = 16181, p1 = 16182, g1 = 16183, _1 = 16184, w1 = 16185, b1 = 16186, v1 = 16187, D1 = 16188, m1 = 16189, Yo = 16190, hr = 16191, il = 16192, y1 = 16193, al = 16194, E1 = 16195, C1 = 16196, x1 = 16197, A1 = 16198, Bo = 16199, So = 16200, F1 = 16201, B1 = 16202, S1 = 16203, k1 = 16204, I1 = 16205, ul = 16206, T1 = 16207, $1 = 16208, Je = 16209, Eg = 16210, Cg = 16211, V3 = 852, X3 = 592, K3 = 15, Y3 = K3, R1 = (e) => (e >>> 24 & 255) + (e >>> 8 & 65280) + ((e & 65280) << 8) + ((e & 255) << 24);
function Q3() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const xi = (e) => {
  if (!e)
    return 1;
  const n = e.state;
  return !n || n.strm !== e || n.mode < fs || n.mode > Cg ? 1 : 0;
}, xg = (e) => {
  if (xi(e))
    return yn;
  const n = e.state;
  return e.total_in = e.total_out = n.total = 0, e.msg = "", n.wrap && (e.adler = n.wrap & 1), n.mode = fs, n.last = 0, n.havedict = 0, n.flags = -1, n.dmax = 32768, n.head = null, n.hold = 0, n.bits = 0, n.lencode = n.lendyn = new Int32Array(V3), n.distcode = n.distdyn = new Int32Array(X3), n.sane = 1, n.back = -1, Di;
}, Ag = (e) => {
  if (xi(e))
    return yn;
  const n = e.state;
  return n.wsize = 0, n.whave = 0, n.wnext = 0, xg(e);
}, Fg = (e, n) => {
  let t;
  if (xi(e))
    return yn;
  const a = e.state;
  return n < 0 ? (t = 0, n = -n) : (t = (n >> 4) + 5, n < 48 && (n &= 15)), n && (n < 8 || n > 15) ? yn : (a.window !== null && a.wbits !== n && (a.window = null), a.wrap = t, a.wbits = n, Ag(e));
}, Bg = (e, n) => {
  if (!e)
    return yn;
  const t = new Q3();
  e.state = t, t.strm = e, t.window = null, t.mode = fs;
  const a = Fg(e, n);
  return a !== Di && (e.state = null), a;
}, J3 = (e) => Bg(e, Y3);
let N1 = !0, ol, sl;
const j3 = (e) => {
  if (N1) {
    ol = new Int32Array(512), sl = new Int32Array(32);
    let n = 0;
    for (; n < 144; )
      e.lens[n++] = 8;
    for (; n < 256; )
      e.lens[n++] = 9;
    for (; n < 280; )
      e.lens[n++] = 7;
    for (; n < 288; )
      e.lens[n++] = 8;
    for (Xa(vg, e.lens, 0, 288, ol, 0, e.work, { bits: 9 }), n = 0; n < 32; )
      e.lens[n++] = 5;
    Xa(Dg, e.lens, 0, 32, sl, 0, e.work, { bits: 5 }), N1 = !1;
  }
  e.lencode = ol, e.lenbits = 9, e.distcode = sl, e.distbits = 5;
}, Sg = (e, n, t, a) => {
  let s;
  const o = e.state;
  return o.window === null && (o.wsize = 1 << o.wbits, o.wnext = 0, o.whave = 0, o.window = new Uint8Array(o.wsize)), a >= o.wsize ? (o.window.set(n.subarray(t - o.wsize, t), 0), o.wnext = 0, o.whave = o.wsize) : (s = o.wsize - o.wnext, s > a && (s = a), o.window.set(n.subarray(t - a, t - a + s), o.wnext), a -= s, a ? (o.window.set(n.subarray(t - a, t), 0), o.wnext = a, o.whave = o.wsize) : (o.wnext += s, o.wnext === o.wsize && (o.wnext = 0), o.whave < o.wsize && (o.whave += s))), 0;
}, eF = (e, n) => {
  let t, a, s, o, h, l, v, c, d, A, C, y, k, B, P = 0, T, Z, U, $, L, Q, q, G;
  const J = new Uint8Array(4);
  let ee, K;
  const ie = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (xi(e) || !e.output || !e.input && e.avail_in !== 0)
    return yn;
  t = e.state, t.mode === hr && (t.mode = il), h = e.next_out, s = e.output, v = e.avail_out, o = e.next_in, a = e.input, l = e.avail_in, c = t.hold, d = t.bits, A = l, C = v, G = Di;
  e:
    for (; ; )
      switch (t.mode) {
        case fs:
          if (t.wrap === 0) {
            t.mode = il;
            break;
          }
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if (t.wrap & 2 && c === 35615) {
            t.wbits === 0 && (t.wbits = 15), t.check = 0, J[0] = c & 255, J[1] = c >>> 8 & 255, t.check = pt(t.check, J, 2, 0), c = 0, d = 0, t.mode = d1;
            break;
          }
          if (t.head && (t.head.done = !1), !(t.wrap & 1) || /* check if zlib header allowed */
          (((c & 255) << 8) + (c >> 8)) % 31) {
            e.msg = "incorrect header check", t.mode = Je;
            break;
          }
          if ((c & 15) !== c1) {
            e.msg = "unknown compression method", t.mode = Je;
            break;
          }
          if (c >>>= 4, d -= 4, q = (c & 15) + 8, t.wbits === 0 && (t.wbits = q), q > 15 || q > t.wbits) {
            e.msg = "invalid window size", t.mode = Je;
            break;
          }
          t.dmax = 1 << t.wbits, t.flags = 0, e.adler = t.check = 1, t.mode = c & 512 ? m1 : hr, c = 0, d = 0;
          break;
        case d1:
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if (t.flags = c, (t.flags & 255) !== c1) {
            e.msg = "unknown compression method", t.mode = Je;
            break;
          }
          if (t.flags & 57344) {
            e.msg = "unknown header flags set", t.mode = Je;
            break;
          }
          t.head && (t.head.text = c >> 8 & 1), t.flags & 512 && t.wrap & 4 && (J[0] = c & 255, J[1] = c >>> 8 & 255, t.check = pt(t.check, J, 2, 0)), c = 0, d = 0, t.mode = p1;
        case p1:
          for (; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          t.head && (t.head.time = c), t.flags & 512 && t.wrap & 4 && (J[0] = c & 255, J[1] = c >>> 8 & 255, J[2] = c >>> 16 & 255, J[3] = c >>> 24 & 255, t.check = pt(t.check, J, 4, 0)), c = 0, d = 0, t.mode = g1;
        case g1:
          for (; d < 16; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          t.head && (t.head.xflags = c & 255, t.head.os = c >> 8), t.flags & 512 && t.wrap & 4 && (J[0] = c & 255, J[1] = c >>> 8 & 255, t.check = pt(t.check, J, 2, 0)), c = 0, d = 0, t.mode = _1;
        case _1:
          if (t.flags & 1024) {
            for (; d < 16; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            t.length = c, t.head && (t.head.extra_len = c), t.flags & 512 && t.wrap & 4 && (J[0] = c & 255, J[1] = c >>> 8 & 255, t.check = pt(t.check, J, 2, 0)), c = 0, d = 0;
          } else t.head && (t.head.extra = null);
          t.mode = w1;
        case w1:
          if (t.flags & 1024 && (y = t.length, y > l && (y = l), y && (t.head && (q = t.head.extra_len - t.length, t.head.extra || (t.head.extra = new Uint8Array(t.head.extra_len)), t.head.extra.set(
            a.subarray(
              o,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              o + y
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            q
          )), t.flags & 512 && t.wrap & 4 && (t.check = pt(t.check, a, y, o)), l -= y, o += y, t.length -= y), t.length))
            break e;
          t.length = 0, t.mode = b1;
        case b1:
          if (t.flags & 2048) {
            if (l === 0)
              break e;
            y = 0;
            do
              q = a[o + y++], t.head && q && t.length < 65536 && (t.head.name += String.fromCharCode(q));
            while (q && y < l);
            if (t.flags & 512 && t.wrap & 4 && (t.check = pt(t.check, a, y, o)), l -= y, o += y, q)
              break e;
          } else t.head && (t.head.name = null);
          t.length = 0, t.mode = v1;
        case v1:
          if (t.flags & 4096) {
            if (l === 0)
              break e;
            y = 0;
            do
              q = a[o + y++], t.head && q && t.length < 65536 && (t.head.comment += String.fromCharCode(q));
            while (q && y < l);
            if (t.flags & 512 && t.wrap & 4 && (t.check = pt(t.check, a, y, o)), l -= y, o += y, q)
              break e;
          } else t.head && (t.head.comment = null);
          t.mode = D1;
        case D1:
          if (t.flags & 512) {
            for (; d < 16; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            if (t.wrap & 4 && c !== (t.check & 65535)) {
              e.msg = "header crc mismatch", t.mode = Je;
              break;
            }
            c = 0, d = 0;
          }
          t.head && (t.head.hcrc = t.flags >> 9 & 1, t.head.done = !0), e.adler = t.check = 0, t.mode = hr;
          break;
        case m1:
          for (; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          e.adler = t.check = R1(c), c = 0, d = 0, t.mode = Yo;
        case Yo:
          if (t.havedict === 0)
            return e.next_out = h, e.avail_out = v, e.next_in = o, e.avail_in = l, t.hold = c, t.bits = d, G3;
          e.adler = t.check = 1, t.mode = hr;
        case hr:
          if (n === q3 || n === Fo)
            break e;
        case il:
          if (t.last) {
            c >>>= d & 7, d -= d & 7, t.mode = ul;
            break;
          }
          for (; d < 3; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          switch (t.last = c & 1, c >>>= 1, d -= 1, c & 3) {
            case 0:
              t.mode = y1;
              break;
            case 1:
              if (j3(t), t.mode = Bo, n === Fo) {
                c >>>= 2, d -= 2;
                break e;
              }
              break;
            case 2:
              t.mode = C1;
              break;
            case 3:
              e.msg = "invalid block type", t.mode = Je;
          }
          c >>>= 2, d -= 2;
          break;
        case y1:
          for (c >>>= d & 7, d -= d & 7; d < 32; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if ((c & 65535) !== (c >>> 16 ^ 65535)) {
            e.msg = "invalid stored block lengths", t.mode = Je;
            break;
          }
          if (t.length = c & 65535, c = 0, d = 0, t.mode = al, n === Fo)
            break e;
        case al:
          t.mode = E1;
        case E1:
          if (y = t.length, y) {
            if (y > l && (y = l), y > v && (y = v), y === 0)
              break e;
            s.set(a.subarray(o, o + y), h), l -= y, o += y, v -= y, h += y, t.length -= y;
            break;
          }
          t.mode = hr;
          break;
        case C1:
          for (; d < 14; ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if (t.nlen = (c & 31) + 257, c >>>= 5, d -= 5, t.ndist = (c & 31) + 1, c >>>= 5, d -= 5, t.ncode = (c & 15) + 4, c >>>= 4, d -= 4, t.nlen > 286 || t.ndist > 30) {
            e.msg = "too many length or distance symbols", t.mode = Je;
            break;
          }
          t.have = 0, t.mode = x1;
        case x1:
          for (; t.have < t.ncode; ) {
            for (; d < 3; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            t.lens[ie[t.have++]] = c & 7, c >>>= 3, d -= 3;
          }
          for (; t.have < 19; )
            t.lens[ie[t.have++]] = 0;
          if (t.lencode = t.lendyn, t.lenbits = 7, ee = { bits: t.lenbits }, G = Xa(Z3, t.lens, 0, 19, t.lencode, 0, t.work, ee), t.lenbits = ee.bits, G) {
            e.msg = "invalid code lengths set", t.mode = Je;
            break;
          }
          t.have = 0, t.mode = A1;
        case A1:
          for (; t.have < t.nlen + t.ndist; ) {
            for (; P = t.lencode[c & (1 << t.lenbits) - 1], T = P >>> 24, Z = P >>> 16 & 255, U = P & 65535, !(T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            if (U < 16)
              c >>>= T, d -= T, t.lens[t.have++] = U;
            else {
              if (U === 16) {
                for (K = T + 2; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[o++] << d, d += 8;
                }
                if (c >>>= T, d -= T, t.have === 0) {
                  e.msg = "invalid bit length repeat", t.mode = Je;
                  break;
                }
                q = t.lens[t.have - 1], y = 3 + (c & 3), c >>>= 2, d -= 2;
              } else if (U === 17) {
                for (K = T + 3; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[o++] << d, d += 8;
                }
                c >>>= T, d -= T, q = 0, y = 3 + (c & 7), c >>>= 3, d -= 3;
              } else {
                for (K = T + 7; d < K; ) {
                  if (l === 0)
                    break e;
                  l--, c += a[o++] << d, d += 8;
                }
                c >>>= T, d -= T, q = 0, y = 11 + (c & 127), c >>>= 7, d -= 7;
              }
              if (t.have + y > t.nlen + t.ndist) {
                e.msg = "invalid bit length repeat", t.mode = Je;
                break;
              }
              for (; y--; )
                t.lens[t.have++] = q;
            }
          }
          if (t.mode === Je)
            break;
          if (t.lens[256] === 0) {
            e.msg = "invalid code -- missing end-of-block", t.mode = Je;
            break;
          }
          if (t.lenbits = 9, ee = { bits: t.lenbits }, G = Xa(vg, t.lens, 0, t.nlen, t.lencode, 0, t.work, ee), t.lenbits = ee.bits, G) {
            e.msg = "invalid literal/lengths set", t.mode = Je;
            break;
          }
          if (t.distbits = 6, t.distcode = t.distdyn, ee = { bits: t.distbits }, G = Xa(Dg, t.lens, t.nlen, t.ndist, t.distcode, 0, t.work, ee), t.distbits = ee.bits, G) {
            e.msg = "invalid distances set", t.mode = Je;
            break;
          }
          if (t.mode = Bo, n === Fo)
            break e;
        case Bo:
          t.mode = So;
        case So:
          if (l >= 6 && v >= 258) {
            e.next_out = h, e.avail_out = v, e.next_in = o, e.avail_in = l, t.hold = c, t.bits = d, L3(e, C), h = e.next_out, s = e.output, v = e.avail_out, o = e.next_in, a = e.input, l = e.avail_in, c = t.hold, d = t.bits, t.mode === hr && (t.back = -1);
            break;
          }
          for (t.back = 0; P = t.lencode[c & (1 << t.lenbits) - 1], T = P >>> 24, Z = P >>> 16 & 255, U = P & 65535, !(T <= d); ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if (Z && !(Z & 240)) {
            for ($ = T, L = Z, Q = U; P = t.lencode[Q + ((c & (1 << $ + L) - 1) >> $)], T = P >>> 24, Z = P >>> 16 & 255, U = P & 65535, !($ + T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            c >>>= $, d -= $, t.back += $;
          }
          if (c >>>= T, d -= T, t.back += T, t.length = U, Z === 0) {
            t.mode = I1;
            break;
          }
          if (Z & 32) {
            t.back = -1, t.mode = hr;
            break;
          }
          if (Z & 64) {
            e.msg = "invalid literal/length code", t.mode = Je;
            break;
          }
          t.extra = Z & 15, t.mode = F1;
        case F1:
          if (t.extra) {
            for (K = t.extra; d < K; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            t.length += c & (1 << t.extra) - 1, c >>>= t.extra, d -= t.extra, t.back += t.extra;
          }
          t.was = t.length, t.mode = B1;
        case B1:
          for (; P = t.distcode[c & (1 << t.distbits) - 1], T = P >>> 24, Z = P >>> 16 & 255, U = P & 65535, !(T <= d); ) {
            if (l === 0)
              break e;
            l--, c += a[o++] << d, d += 8;
          }
          if (!(Z & 240)) {
            for ($ = T, L = Z, Q = U; P = t.distcode[Q + ((c & (1 << $ + L) - 1) >> $)], T = P >>> 24, Z = P >>> 16 & 255, U = P & 65535, !($ + T <= d); ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            c >>>= $, d -= $, t.back += $;
          }
          if (c >>>= T, d -= T, t.back += T, Z & 64) {
            e.msg = "invalid distance code", t.mode = Je;
            break;
          }
          t.offset = U, t.extra = Z & 15, t.mode = S1;
        case S1:
          if (t.extra) {
            for (K = t.extra; d < K; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            t.offset += c & (1 << t.extra) - 1, c >>>= t.extra, d -= t.extra, t.back += t.extra;
          }
          if (t.offset > t.dmax) {
            e.msg = "invalid distance too far back", t.mode = Je;
            break;
          }
          t.mode = k1;
        case k1:
          if (v === 0)
            break e;
          if (y = C - v, t.offset > y) {
            if (y = t.offset - y, y > t.whave && t.sane) {
              e.msg = "invalid distance too far back", t.mode = Je;
              break;
            }
            y > t.wnext ? (y -= t.wnext, k = t.wsize - y) : k = t.wnext - y, y > t.length && (y = t.length), B = t.window;
          } else
            B = s, k = h - t.offset, y = t.length;
          y > v && (y = v), v -= y, t.length -= y;
          do
            s[h++] = B[k++];
          while (--y);
          t.length === 0 && (t.mode = So);
          break;
        case I1:
          if (v === 0)
            break e;
          s[h++] = t.length, v--, t.mode = So;
          break;
        case ul:
          if (t.wrap) {
            for (; d < 32; ) {
              if (l === 0)
                break e;
              l--, c |= a[o++] << d, d += 8;
            }
            if (C -= v, e.total_out += C, t.total += C, t.wrap & 4 && C && (e.adler = t.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            t.flags ? pt(t.check, s, C, h - C) : uu(t.check, s, C, h - C)), C = v, t.wrap & 4 && (t.flags ? c : R1(c)) !== t.check) {
              e.msg = "incorrect data check", t.mode = Je;
              break;
            }
            c = 0, d = 0;
          }
          t.mode = T1;
        case T1:
          if (t.wrap && t.flags) {
            for (; d < 32; ) {
              if (l === 0)
                break e;
              l--, c += a[o++] << d, d += 8;
            }
            if (t.wrap & 4 && c !== (t.total & 4294967295)) {
              e.msg = "incorrect length check", t.mode = Je;
              break;
            }
            c = 0, d = 0;
          }
          t.mode = $1;
        case $1:
          G = H3;
          break e;
        case Je:
          G = mg;
          break e;
        case Eg:
          return yg;
        case Cg:
        default:
          return yn;
      }
  return e.next_out = h, e.avail_out = v, e.next_in = o, e.avail_in = l, t.hold = c, t.bits = d, (t.wsize || C !== e.avail_out && t.mode < Je && (t.mode < ul || n !== h1)) && Sg(e, e.output, e.next_out, C - e.avail_out), A -= e.avail_in, C -= e.avail_out, e.total_in += A, e.total_out += C, t.total += C, t.wrap & 4 && C && (e.adler = t.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  t.flags ? pt(t.check, s, C, e.next_out - C) : uu(t.check, s, C, e.next_out - C)), e.data_type = t.bits + (t.last ? 64 : 0) + (t.mode === hr ? 128 : 0) + (t.mode === Bo || t.mode === al ? 256 : 0), (A === 0 && C === 0 || n === h1) && G === Di && (G = W3), G;
}, tF = (e) => {
  if (xi(e))
    return yn;
  let n = e.state;
  return n.window && (n.window = null), e.state = null, Di;
}, nF = (e, n) => {
  if (xi(e))
    return yn;
  const t = e.state;
  return t.wrap & 2 ? (t.head = n, n.done = !1, Di) : yn;
}, rF = (e, n) => {
  const t = n.length;
  let a, s, o;
  return xi(e) || (a = e.state, a.wrap !== 0 && a.mode !== Yo) ? yn : a.mode === Yo && (s = 1, s = uu(s, n, t, 0), s !== a.check) ? mg : (o = Sg(e, n, t, t), o ? (a.mode = Eg, yg) : (a.havedict = 1, Di));
};
var iF = Ag, aF = Fg, uF = xg, oF = J3, sF = Bg, fF = eF, lF = tF, hF = nF, cF = rF, dF = "pako inflate (from Nodeca project)", gr = {
  inflateReset: iF,
  inflateReset2: aF,
  inflateResetKeep: uF,
  inflateInit: oF,
  inflateInit2: sF,
  inflate: fF,
  inflateEnd: lF,
  inflateGetHeader: hF,
  inflateSetDictionary: cF,
  inflateInfo: dF
};
function pF() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var gF = pF;
const kg = Object.prototype.toString, {
  Z_NO_FLUSH: _F,
  Z_FINISH: wF,
  Z_OK: fu,
  Z_STREAM_END: fl,
  Z_NEED_DICT: ll,
  Z_STREAM_ERROR: bF,
  Z_DATA_ERROR: L1,
  Z_MEM_ERROR: vF
} = Eu;
function xu(e) {
  this.options = ss.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, e || {});
  const n = this.options;
  n.raw && n.windowBits >= 0 && n.windowBits < 16 && (n.windowBits = -n.windowBits, n.windowBits === 0 && (n.windowBits = -15)), n.windowBits >= 0 && n.windowBits < 16 && !(e && e.windowBits) && (n.windowBits += 32), n.windowBits > 15 && n.windowBits < 48 && (n.windowBits & 15 || (n.windowBits |= 15)), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new wg(), this.strm.avail_out = 0;
  let t = gr.inflateInit2(
    this.strm,
    n.windowBits
  );
  if (t !== fu)
    throw new Error(ia[t]);
  if (this.header = new gF(), gr.inflateGetHeader(this.strm, this.header), n.dictionary && (typeof n.dictionary == "string" ? n.dictionary = su.string2buf(n.dictionary) : kg.call(n.dictionary) === "[object ArrayBuffer]" && (n.dictionary = new Uint8Array(n.dictionary)), n.raw && (t = gr.inflateSetDictionary(this.strm, n.dictionary), t !== fu)))
    throw new Error(ia[t]);
}
xu.prototype.push = function(e, n) {
  const t = this.strm, a = this.options.chunkSize, s = this.options.dictionary;
  let o, h, l;
  if (this.ended) return !1;
  for (n === ~~n ? h = n : h = n === !0 ? wF : _F, kg.call(e) === "[object ArrayBuffer]" ? t.input = new Uint8Array(e) : t.input = e, t.next_in = 0, t.avail_in = t.input.length; ; ) {
    for (t.avail_out === 0 && (t.output = new Uint8Array(a), t.next_out = 0, t.avail_out = a), o = gr.inflate(t, h), o === ll && s && (o = gr.inflateSetDictionary(t, s), o === fu ? o = gr.inflate(t, h) : o === L1 && (o = ll)); t.avail_in > 0 && o === fl && t.state.wrap > 0 && e[t.next_in] !== 0; )
      gr.inflateReset(t), o = gr.inflate(t, h);
    switch (o) {
      case bF:
      case L1:
      case ll:
      case vF:
        return this.onEnd(o), this.ended = !0, !1;
    }
    if (l = t.avail_out, t.next_out && (t.avail_out === 0 || o === fl))
      if (this.options.to === "string") {
        let v = su.utf8border(t.output, t.next_out), c = t.next_out - v, d = su.buf2string(t.output, v);
        t.next_out = c, t.avail_out = a - c, c && t.output.set(t.output.subarray(v, v + c), 0), this.onData(d);
      } else
        this.onData(t.output.length === t.next_out ? t.output : t.output.subarray(0, t.next_out));
    if (!(o === fu && l === 0)) {
      if (o === fl)
        return o = gr.inflateEnd(this.strm), this.onEnd(o), this.ended = !0, !0;
      if (t.avail_in === 0) break;
    }
  }
  return !0;
};
xu.prototype.onData = function(e) {
  this.chunks.push(e);
};
xu.prototype.onEnd = function(e) {
  e === fu && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = ss.flattenChunks(this.chunks)), this.chunks = [], this.err = e, this.msg = this.strm.msg;
};
function dh(e, n) {
  const t = new xu(n);
  if (t.push(e), t.err) throw t.msg || ia[t.err];
  return t.result;
}
function DF(e, n) {
  return n = n || {}, n.raw = !0, dh(e, n);
}
var mF = xu, yF = dh, EF = DF, CF = dh, xF = Eu, AF = {
  Inflate: mF,
  inflate: yF,
  inflateRaw: EF,
  ungzip: CF,
  constants: xF
};
const { Inflate: g8, inflate: _8, inflateRaw: FF, ungzip: w8 } = AF;
var BF = FF;
function SF(e) {
  return BF(e.subarray(2));
}
class kF extends Error {
  constructor(n) {
    super(n), this.code = "ERR_ABORTED";
  }
}
function IF(e) {
  e.sort((s, o) => Number(s.offset) - Number(o.offset));
  const n = [];
  let t, a;
  for (const s of e)
    t && a && Number(s.offset) - a <= 2e3 ? (t.length = BigInt(Number(t.length) + Number(s.length) - a + Number(s.offset)), t.blocks.push(s)) : n.push(t = {
      blocks: [s],
      length: s.length,
      offset: s.offset
    }), a = Number(t.offset) + Number(t.length);
  return n;
}
function ko(e) {
  if (e && e.aborted)
    if (typeof DOMException > "u") {
      const n = new kF("aborted");
      throw n.code = "ERR_ABORTED", n;
    } else
      throw new DOMException("aborted", "AbortError");
}
const TF = 1, $F = 2, RF = 3;
function hl(e, n, t, a) {
  return e < a && n >= t;
}
function NF(e) {
  const n = e ? "big" : "little", t = new ke().endianess(n).uint32("chromId").uint32("start").uint32("end").uint32("validCnt").floatle("minScore").floatle("maxScore").floatle("sumData").floatle("sumSqData").saveOffset("offset"), a = new ke().endianess(n).uint8("isLeaf").skip(1).uint16("cnt").choice({
    tag: "isLeaf",
    choices: {
      1: new ke().endianess(n).array("blocksToFetch", {
        length: "cnt",
        type: new ke().endianess(n).uint32("startChrom").uint32("startBase").uint32("endChrom").uint32("endBase").uint64("blockOffset").uint64("blockSize").saveOffset("offset")
      }),
      0: new ke().array("recurOffsets", {
        length: "cnt",
        type: new ke().endianess(n).uint32("startChrom").uint32("startBase").uint32("endChrom").uint32("endBase").uint64("blockOffset").saveOffset("offset")
      })
    }
  }), s = new ke().endianess(n).uint32("chromId").int32("start").int32("end").string("rest", {
    zeroTerminated: !0
  }).saveOffset("offset");
  return {
    bigWigParser: new ke().endianess(n).skip(4).int32("blockStart").skip(4).uint32("itemStep").uint32("itemSpan").uint8("blockType").skip(1).uint16("itemCount").choice({
      tag: "blockType",
      choices: {
        [RF]: new ke().array("items", {
          length: "itemCount",
          type: new ke().floatle("score")
        }),
        [$F]: new ke().array("items", {
          length: "itemCount",
          type: new ke().endianess(n).int32("start").floatle("score")
        }),
        [TF]: new ke().array("items", {
          length: "itemCount",
          type: new ke().endianess(n).int32("start").int32("end").floatle("score")
        })
      }
    }),
    bigBedParser: s,
    summaryParser: t,
    leafParser: a
  };
}
class Ig {
  constructor(n, t, a, s, o, h) {
    if (this.bbi = n, this.refsByName = t, this.cirTreeOffset = a, this.isBigEndian = s, this.isCompressed = o, this.blockType = h, this.featureCache = new Ya({
      cache: new j1({ maxSize: 1e3 }),
      fill: async (v, c) => {
        const d = Number(v.length), A = Number(v.offset), { buffer: C } = await this.bbi.read(Jn.Buffer.alloc(d), 0, d, A, {
          signal: c
        });
        return C;
      }
    }), !(a >= 0))
      throw new Error("invalid cirTreeOffset!");
    const l = NF(s);
    this.leafParser = l.leafParser, this.bigBedParser = l.bigBedParser;
  }
  async readWigData(n, t, a, s, o) {
    try {
      const { refsByName: h, bbi: l, cirTreeOffset: v, isBigEndian: c } = this, d = h[n];
      d === void 0 && s.complete();
      const A = { chrId: d, start: t, end: a };
      this.cirTreePromise || (this.cirTreePromise = l.read(Jn.Buffer.alloc(48), 0, 48, Number(v), o));
      const { buffer: C } = await this.cirTreePromise, y = c ? C.readUInt32BE(4) : C.readUInt32LE(4);
      let k = [], B = 0;
      const P = ($, L, Q) => {
        try {
          const q = $.subarray(L), G = this.leafParser.parse(q);
          if (G.blocksToFetch && (k = k.concat(G.blocksToFetch.filter((J) => T(J)).map((J) => ({
            offset: J.blockOffset,
            length: J.blockSize
          })))), G.recurOffsets) {
            const J = G.recurOffsets.filter((ee) => T(ee)).map((ee) => Number(ee.blockOffset));
            J.length > 0 && U(J, Q + 1);
          }
        } catch (q) {
          s.error(q);
        }
      }, T = ($) => {
        const { startChrom: L, startBase: Q, endChrom: q, endBase: G } = $;
        return (L < d || L === d && Q <= a) && (q > d || q === d && G >= t);
      }, Z = async ($, L, Q) => {
        try {
          const q = L.max - L.min, G = L.min, J = await this.featureCache.get(`${q}_${G}`, { length: q, offset: G }, o == null ? void 0 : o.signal);
          for (const ee of $)
            L.contains(ee) && (P(J, ee - G, Q), B -= 1, B === 0 && this.readFeatures(s, k, {
              ...o,
              request: A
            }).catch((K) => s.error(K)));
        } catch (q) {
          s.error(q);
        }
      }, U = ($, L) => {
        try {
          B += $.length;
          const Q = 4 + Number(y) * 32;
          let q = new ea([
            { min: $[0], max: $[0] + Q }
          ]);
          for (let G = 1; G < $.length; G += 1) {
            const J = new ea([
              { min: $[G], max: $[G] + Q }
            ]);
            q = q.union(J);
          }
          q.getRanges().map((G) => Z($, G, L));
        } catch (Q) {
          s.error(Q);
        }
      };
      return U([Number(v) + 48], 1);
    } catch (h) {
      s.error(h);
    }
  }
  parseSummaryBlock(n, t, a) {
    const s = [];
    let o = t;
    const h = new DataView(n.buffer, n.byteOffset, n.length);
    for (; o < n.byteLength; ) {
      const l = h.getUint32(o, !0);
      o += 4;
      const v = h.getUint32(o, !0);
      o += 4;
      const c = h.getUint32(o, !0);
      o += 4;
      const d = h.getUint32(o, !0);
      o += 4;
      const A = h.getFloat32(o, !0);
      o += 4;
      const C = h.getFloat32(o, !0);
      o += 4;
      const y = h.getFloat32(o, !0);
      o += 4, o += 4, (!a || l === a.chrId && hl(v, c, a.start, a.end)) && s.push({
        start: v,
        end: c,
        maxScore: C,
        minScore: A,
        summary: !0,
        score: y / (d || 1)
      });
    }
    return s;
  }
  parseBigBedBlock(n, t, a, s) {
    const o = [];
    let h = t;
    for (; h < n.byteLength; ) {
      const l = this.bigBedParser.parse(n.subarray(h));
      l.uniqueId = `bb-${a + h}`, o.push(l), h += l.offset;
    }
    return s ? o.filter((l) => hl(l.start, l.end, s.start, s.end)) : o;
  }
  parseBigWigBlock(n, t, a) {
    const s = n.subarray(t), o = new DataView(s.buffer, s.byteOffset, s.length);
    let h = 0;
    h += 4;
    const l = o.getInt32(h, !0);
    h += 8;
    const v = o.getUint32(h, !0);
    h += 4;
    const c = o.getUint32(h, !0);
    h += 4;
    const d = o.getUint8(h);
    h += 2;
    const A = o.getUint16(h, !0);
    h += 2;
    const C = new Array(A);
    switch (d) {
      case 1: {
        for (let y = 0; y < A; y++) {
          const k = o.getInt32(h, !0);
          h += 4;
          const B = o.getInt32(h, !0);
          h += 4;
          const P = o.getFloat32(h, !0);
          h += 4, C[y] = { start: k, end: B, score: P };
        }
        break;
      }
      case 2: {
        for (let y = 0; y < A; y++) {
          const k = o.getInt32(h, !0);
          h += 4;
          const B = o.getFloat32(h, !0);
          h += 4, C[y] = { score: B, start: k, end: k + c };
        }
        break;
      }
      case 3: {
        for (let y = 0; y < A; y++) {
          const k = o.getFloat32(h, !0);
          h += 4;
          const B = l + y * v;
          C[y] = { score: k, start: B, end: B + c };
        }
        break;
      }
    }
    return a ? C.filter((y) => hl(y.start, y.end, a.start, a.end)) : C;
  }
  async readFeatures(n, t, a = {}) {
    try {
      const { blockType: s, isCompressed: o } = this, { signal: h, request: l } = a, v = IF(t);
      ko(h), await Promise.all(v.map(async (c) => {
        ko(h);
        const { length: d, offset: A } = c, C = await this.featureCache.get(`${d}_${A}`, c, h);
        for (const y of c.blocks) {
          ko(h);
          let k = Number(y.offset) - Number(c.offset), B = C;
          switch (o && (B = SF(C.subarray(k)), k = 0), ko(h), s) {
            case "summary": {
              n.next(this.parseSummaryBlock(B, k, l));
              break;
            }
            case "bigwig": {
              n.next(this.parseBigWigBlock(B, k, l));
              break;
            }
            case "bigbed": {
              n.next(this.parseBigBedBlock(B, k, Number(y.offset) * 256, l));
              break;
            }
            default:
              console.warn(`Don't know what to do with ${s}`);
          }
        }
      })), n.complete();
    } catch (s) {
      n.error(s);
    }
  }
}
var Pl = function(e, n) {
  return Pl = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(t, a) {
    t.__proto__ = a;
  } || function(t, a) {
    for (var s in a) Object.prototype.hasOwnProperty.call(a, s) && (t[s] = a[s]);
  }, Pl(e, n);
};
function ph(e, n) {
  if (typeof n != "function" && n !== null)
    throw new TypeError("Class extends value " + String(n) + " is not a constructor or null");
  Pl(e, n);
  function t() {
    this.constructor = e;
  }
  e.prototype = n === null ? Object.create(n) : (t.prototype = n.prototype, new t());
}
function O1(e) {
  var n = typeof Symbol == "function" && Symbol.iterator, t = n && e[n], a = 0;
  if (t) return t.call(e);
  if (e && typeof e.length == "number") return {
    next: function() {
      return e && a >= e.length && (e = void 0), { value: e && e[a++], done: !e };
    }
  };
  throw new TypeError(n ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function Ul(e, n) {
  var t = typeof Symbol == "function" && e[Symbol.iterator];
  if (!t) return e;
  var a = t.call(e), s, o = [], h;
  try {
    for (; (n === void 0 || n-- > 0) && !(s = a.next()).done; ) o.push(s.value);
  } catch (l) {
    h = { error: l };
  } finally {
    try {
      s && !s.done && (t = a.return) && t.call(a);
    } finally {
      if (h) throw h.error;
    }
  }
  return o;
}
function Ml(e, n, t) {
  if (t || arguments.length === 2) for (var a = 0, s = n.length, o; a < s; a++)
    (o || !(a in n)) && (o || (o = Array.prototype.slice.call(n, 0, a)), o[a] = n[a]);
  return e.concat(o || Array.prototype.slice.call(n));
}
function Kn(e) {
  return typeof e == "function";
}
function Tg(e) {
  var n = function(a) {
    Error.call(a), a.stack = new Error().stack;
  }, t = e(n);
  return t.prototype = Object.create(Error.prototype), t.prototype.constructor = t, t;
}
var cl = Tg(function(e) {
  return function(t) {
    e(this), this.message = t ? t.length + ` errors occurred during unsubscription:
` + t.map(function(a, s) {
      return s + 1 + ") " + a.toString();
    }).join(`
  `) : "", this.name = "UnsubscriptionError", this.errors = t;
  };
});
function P1(e, n) {
  if (e) {
    var t = e.indexOf(n);
    0 <= t && e.splice(t, 1);
  }
}
var gh = function() {
  function e(n) {
    this.initialTeardown = n, this.closed = !1, this._parentage = null, this._finalizers = null;
  }
  return e.prototype.unsubscribe = function() {
    var n, t, a, s, o;
    if (!this.closed) {
      this.closed = !0;
      var h = this._parentage;
      if (h)
        if (this._parentage = null, Array.isArray(h))
          try {
            for (var l = O1(h), v = l.next(); !v.done; v = l.next()) {
              var c = v.value;
              c.remove(this);
            }
          } catch (B) {
            n = { error: B };
          } finally {
            try {
              v && !v.done && (t = l.return) && t.call(l);
            } finally {
              if (n) throw n.error;
            }
          }
        else
          h.remove(this);
      var d = this.initialTeardown;
      if (Kn(d))
        try {
          d();
        } catch (B) {
          o = B instanceof cl ? B.errors : [B];
        }
      var A = this._finalizers;
      if (A) {
        this._finalizers = null;
        try {
          for (var C = O1(A), y = C.next(); !y.done; y = C.next()) {
            var k = y.value;
            try {
              U1(k);
            } catch (B) {
              o = o ?? [], B instanceof cl ? o = Ml(Ml([], Ul(o)), Ul(B.errors)) : o.push(B);
            }
          }
        } catch (B) {
          a = { error: B };
        } finally {
          try {
            y && !y.done && (s = C.return) && s.call(C);
          } finally {
            if (a) throw a.error;
          }
        }
      }
      if (o)
        throw new cl(o);
    }
  }, e.prototype.add = function(n) {
    var t;
    if (n && n !== this)
      if (this.closed)
        U1(n);
      else {
        if (n instanceof e) {
          if (n.closed || n._hasParent(this))
            return;
          n._addParent(this);
        }
        (this._finalizers = (t = this._finalizers) !== null && t !== void 0 ? t : []).push(n);
      }
  }, e.prototype._hasParent = function(n) {
    var t = this._parentage;
    return t === n || Array.isArray(t) && t.includes(n);
  }, e.prototype._addParent = function(n) {
    var t = this._parentage;
    this._parentage = Array.isArray(t) ? (t.push(n), t) : t ? [t, n] : n;
  }, e.prototype._removeParent = function(n) {
    var t = this._parentage;
    t === n ? this._parentage = null : Array.isArray(t) && P1(t, n);
  }, e.prototype.remove = function(n) {
    var t = this._finalizers;
    t && P1(t, n), n instanceof e && n._removeParent(this);
  }, e.EMPTY = function() {
    var n = new e();
    return n.closed = !0, n;
  }(), e;
}();
gh.EMPTY;
function $g(e) {
  return e instanceof gh || e && "closed" in e && Kn(e.remove) && Kn(e.add) && Kn(e.unsubscribe);
}
function U1(e) {
  Kn(e) ? e() : e.unsubscribe();
}
var Rg = {
  onUnhandledError: null,
  onStoppedNotification: null,
  Promise: void 0,
  useDeprecatedSynchronousErrorHandling: !1,
  useDeprecatedNextContext: !1
}, LF = {
  setTimeout: function(e, n) {
    for (var t = [], a = 2; a < arguments.length; a++)
      t[a - 2] = arguments[a];
    return setTimeout.apply(void 0, Ml([e, n], Ul(t)));
  },
  clearTimeout: function(e) {
    return clearTimeout(e);
  },
  delegate: void 0
};
function OF(e) {
  LF.setTimeout(function() {
    throw e;
  });
}
function M1() {
}
function PF(e) {
  e();
}
var _h = function(e) {
  ph(n, e);
  function n(t) {
    var a = e.call(this) || this;
    return a.isStopped = !1, t ? (a.destination = t, $g(t) && t.add(a)) : a.destination = ZF, a;
  }
  return n.create = function(t, a, s) {
    return new Qo(t, a, s);
  }, n.prototype.next = function(t) {
    this.isStopped || this._next(t);
  }, n.prototype.error = function(t) {
    this.isStopped || (this.isStopped = !0, this._error(t));
  }, n.prototype.complete = function() {
    this.isStopped || (this.isStopped = !0, this._complete());
  }, n.prototype.unsubscribe = function() {
    this.closed || (this.isStopped = !0, e.prototype.unsubscribe.call(this), this.destination = null);
  }, n.prototype._next = function(t) {
    this.destination.next(t);
  }, n.prototype._error = function(t) {
    try {
      this.destination.error(t);
    } finally {
      this.unsubscribe();
    }
  }, n.prototype._complete = function() {
    try {
      this.destination.complete();
    } finally {
      this.unsubscribe();
    }
  }, n;
}(gh), UF = Function.prototype.bind;
function dl(e, n) {
  return UF.call(e, n);
}
var MF = function() {
  function e(n) {
    this.partialObserver = n;
  }
  return e.prototype.next = function(n) {
    var t = this.partialObserver;
    if (t.next)
      try {
        t.next(n);
      } catch (a) {
        Io(a);
      }
  }, e.prototype.error = function(n) {
    var t = this.partialObserver;
    if (t.error)
      try {
        t.error(n);
      } catch (a) {
        Io(a);
      }
    else
      Io(n);
  }, e.prototype.complete = function() {
    var n = this.partialObserver;
    if (n.complete)
      try {
        n.complete();
      } catch (t) {
        Io(t);
      }
  }, e;
}(), Qo = function(e) {
  ph(n, e);
  function n(t, a, s) {
    var o = e.call(this) || this, h;
    if (Kn(t) || !t)
      h = {
        next: t ?? void 0,
        error: a ?? void 0,
        complete: s ?? void 0
      };
    else {
      var l;
      o && Rg.useDeprecatedNextContext ? (l = Object.create(t), l.unsubscribe = function() {
        return o.unsubscribe();
      }, h = {
        next: t.next && dl(t.next, l),
        error: t.error && dl(t.error, l),
        complete: t.complete && dl(t.complete, l)
      }) : h = t;
    }
    return o.destination = new MF(h), o;
  }
  return n;
}(_h);
function Io(e) {
  OF(e);
}
function zF(e) {
  throw e;
}
var ZF = {
  closed: !0,
  next: M1,
  error: zF,
  complete: M1
}, qF = function() {
  return typeof Symbol == "function" && Symbol.observable || "@@observable";
}();
function HF(e) {
  return e;
}
function GF(e) {
  return e.length === 0 ? HF : e.length === 1 ? e[0] : function(t) {
    return e.reduce(function(a, s) {
      return s(a);
    }, t);
  };
}
var WF = function() {
  function e(n) {
    n && (this._subscribe = n);
  }
  return e.prototype.lift = function(n) {
    var t = new e();
    return t.source = this, t.operator = n, t;
  }, e.prototype.subscribe = function(n, t, a) {
    var s = this, o = XF(n) ? n : new Qo(n, t, a);
    return PF(function() {
      var h = s, l = h.operator, v = h.source;
      o.add(l ? l.call(o, v) : v ? s._subscribe(o) : s._trySubscribe(o));
    }), o;
  }, e.prototype._trySubscribe = function(n) {
    try {
      return this._subscribe(n);
    } catch (t) {
      n.error(t);
    }
  }, e.prototype.forEach = function(n, t) {
    var a = this;
    return t = z1(t), new t(function(s, o) {
      var h = new Qo({
        next: function(l) {
          try {
            n(l);
          } catch (v) {
            o(v), h.unsubscribe();
          }
        },
        error: o,
        complete: s
      });
      a.subscribe(h);
    });
  }, e.prototype._subscribe = function(n) {
    var t;
    return (t = this.source) === null || t === void 0 ? void 0 : t.subscribe(n);
  }, e.prototype[qF] = function() {
    return this;
  }, e.prototype.pipe = function() {
    for (var n = [], t = 0; t < arguments.length; t++)
      n[t] = arguments[t];
    return GF(n)(this);
  }, e.prototype.toPromise = function(n) {
    var t = this;
    return n = z1(n), new n(function(a, s) {
      var o;
      t.subscribe(function(h) {
        return o = h;
      }, function(h) {
        return s(h);
      }, function() {
        return a(o);
      });
    });
  }, e.create = function(n) {
    return new e(n);
  }, e;
}();
function z1(e) {
  var n;
  return (n = e ?? Rg.Promise) !== null && n !== void 0 ? n : Promise;
}
function VF(e) {
  return e && Kn(e.next) && Kn(e.error) && Kn(e.complete);
}
function XF(e) {
  return e && e instanceof _h || VF(e) && $g(e);
}
function KF(e) {
  return Kn(e == null ? void 0 : e.lift);
}
function Ng(e) {
  return function(n) {
    if (KF(n))
      return n.lift(function(t) {
        try {
          return e(t, this);
        } catch (a) {
          this.error(a);
        }
      });
    throw new TypeError("Unable to lift unknown Observable type");
  };
}
function YF(e, n, t, a, s) {
  return new QF(e, n, t, a, s);
}
var QF = function(e) {
  ph(n, e);
  function n(t, a, s, o, h, l) {
    var v = e.call(this, t) || this;
    return v.onFinalize = h, v.shouldUnsubscribe = l, v._next = a ? function(c) {
      try {
        a(c);
      } catch (d) {
        t.error(d);
      }
    } : e.prototype._next, v._error = o ? function(c) {
      try {
        o(c);
      } catch (d) {
        t.error(d);
      } finally {
        this.unsubscribe();
      }
    } : e.prototype._error, v._complete = s ? function() {
      try {
        s();
      } catch (c) {
        t.error(c);
      } finally {
        this.unsubscribe();
      }
    } : e.prototype._complete, v;
  }
  return n.prototype.unsubscribe = function() {
    var t;
    if (!this.shouldUnsubscribe || this.shouldUnsubscribe()) {
      var a = this.closed;
      e.prototype.unsubscribe.call(this), !a && ((t = this.onFinalize) === null || t === void 0 || t.call(this));
    }
  }, n;
}(_h), JF = Tg(function(e) {
  return function() {
    e(this), this.name = "EmptyError", this.message = "no elements in sequence";
  };
});
function jF(e, n) {
  return new Promise(function(t, a) {
    var s = new Qo({
      next: function(o) {
        t(o), s.unsubscribe();
      },
      error: a,
      complete: function() {
        a(new JF());
      }
    });
    e.subscribe(s);
  });
}
function e8(e, n, t, a, s) {
  return function(o, h) {
    var l = t, v = n, c = 0;
    o.subscribe(YF(h, function(d) {
      var A = c++;
      v = l ? e(v, d, A) : (l = !0, d);
    }, function() {
      l && h.next(v), h.complete();
    }));
  };
}
function t8(e, n) {
  return Ng(e8(e, n, arguments.length >= 2, !1, !0));
}
var n8 = function(e, n) {
  return e.push(n), e;
};
function r8() {
  return Ng(function(e, n) {
    t8(n8, [])(e).subscribe(n);
  });
}
const Z1 = -2003829722, pl = -2021002517;
function i8(e) {
  return new TextDecoder().decode(e);
}
function q1(e) {
  const n = e ? "big" : "little", t = new ke().endianess(n).int32("magic").uint16("version").uint16("numZoomLevels").uint64("chromTreeOffset").uint64("unzoomedDataOffset").uint64("unzoomedIndexOffset").uint16("fieldCount").uint16("definedFieldCount").uint64("asOffset").uint64("totalSummaryOffset").uint32("uncompressBufSize").uint64("extHeaderOffset").array("zoomLevels", {
    length: "numZoomLevels",
    type: new ke().endianess(n).uint32("reductionLevel").uint32("reserved").uint64("dataOffset").uint64("indexOffset")
  }), a = new ke().endianess(n).uint64("basesCovered").doublele("scoreMin").doublele("scoreMax").doublele("scoreSum").doublele("scoreSumSquares"), s = new ke().endianess(n).uint32("magic").uint32("blockSize").uint32("keySize").uint32("valSize").uint64("itemCount"), o = new ke().endianess(n).uint8("isLeafNode").skip(1).uint16("cnt").saveOffset("offset");
  return {
    chromTreeParser: s,
    totalSummaryParser: a,
    headerParser: t,
    isLeafNode: o
  };
}
class a8 {
  getHeader(n) {
    return this.headerP || (this.headerP = this._getHeader(n).catch((t) => {
      throw this.headerP = void 0, t;
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
  constructor(n) {
    const { filehandle: t, renameRefSeqs: a = (h) => h, path: s, url: o } = n;
    if (this.renameRefSeqs = a, t)
      this.bbi = t;
    else if (o)
      this.bbi = new wr(o);
    else if (s)
      this.bbi = new La(s);
    else
      throw new Error("no file given");
  }
  async _getHeader(n) {
    const t = await this._getMainHeader(n), a = await this._readChromTree(t, n);
    return { ...t, ...a };
  }
  async _getMainHeader(n, t = 2e3) {
    const { buffer: a } = await this.bbi.read(Jn.Buffer.alloc(t), 0, t, 0, n), s = this._isBigEndian(a), o = q1(s), h = o.headerParser.parse(a), { magic: l, asOffset: v, totalSummaryOffset: c } = h;
    if (h.fileType = l === pl ? "bigbed" : "bigwig", v > t || c > t)
      return this._getMainHeader(n, t * 2);
    if (v) {
      const d = Number(h.asOffset);
      h.autoSql = i8(a.subarray(d, a.indexOf(0, d)));
    }
    if (h.totalSummaryOffset > t - 8 * 5)
      return this._getMainHeader(n, t * 2);
    if (h.totalSummaryOffset) {
      const d = a.subarray(Number(h.totalSummaryOffset)), A = o.totalSummaryParser.parse(d);
      h.totalSummary = { ...A, basesCovered: Number(A.basesCovered) };
    }
    return { ...h, isBigEndian: s };
  }
  _isBigEndian(n) {
    let t = n.readInt32LE(0);
    if (t === Z1 || t === pl)
      return !1;
    if (t = n.readInt32BE(0), t === Z1 || t === pl)
      return !0;
    throw new Error("not a BigWig/BigBed file");
  }
  // todo: add progress if long running
  async _readChromTree(n, t) {
    const a = n.isBigEndian, s = a ? "big" : "little", o = [], h = {};
    let l = Number(n.unzoomedDataOffset);
    const v = Number(n.chromTreeOffset);
    for (; l % 4 !== 0; )
      l += 1;
    const c = l - v, { buffer: d } = await this.bbi.read(Jn.Buffer.alloc(c), 0, c, Number(v), t), A = q1(a), { keySize: C } = A.chromTreeParser.parse(d), y = new ke().endianess(s).string("key", { stripNull: !0, length: C }).uint32("refId").uint32("refSize").saveOffset("offset"), k = new ke().endianess(s).skip(C).uint64("childOffset").saveOffset("offset"), B = 32, P = async (T) => {
      let Z = T;
      if (Z >= d.length)
        throw new Error("reading beyond end of buffer");
      const U = A.isLeafNode.parse(d.subarray(Z)), { isLeafNode: $, cnt: L } = U;
      if (Z += U.offset, $)
        for (let Q = 0; Q < L; Q += 1) {
          const q = y.parse(d.subarray(Z));
          Z += q.offset;
          const { key: G, refId: J, refSize: ee } = q, K = { name: G, id: J, length: ee };
          h[this.renameRefSeqs(G)] = J, o[J] = K;
        }
      else {
        const Q = [];
        for (let q = 0; q < L; q += 1) {
          const G = k.parse(d.subarray(Z)), { childOffset: J } = G;
          Z += G.offset, Q.push(P(Number(J) - Number(v)));
        }
        await Promise.all(Q);
      }
    };
    return await P(B), {
      refsByName: h,
      refsByNumber: o
    };
  }
  /*
   * fetches the "unzoomed" view of the bigwig data. this is the default for bigbed
   * @param abortSignal - a signal to optionally abort this operation
   */
  async getUnzoomedView(n) {
    const { unzoomedIndexOffset: t, refsByName: a, uncompressBufSize: s, isBigEndian: o, fileType: h } = await this.getHeader(n);
    return new Ig(this.bbi, a, t, o, s > 0, h);
  }
  /**
   * Gets features from a BigWig file
   *
   * @param refName - The chromosome name
   * @param start - The start of a region
   * @param end - The end of a region
   * @param opts - An object containing basesPerSpan (e.g. pixels per basepair) or scale used to infer the zoomLevel to use
   */
  async getFeatureStream(n, t, a, s) {
    await this.getHeader(s);
    const o = this.renameRefSeqs(n);
    let h;
    const { basesPerSpan: l, scale: v } = s || {};
    return l ? h = await this.getView(1 / l, s) : v ? h = await this.getView(v, s) : h = await this.getView(1, s), new WF((c) => {
      h.readWigData(o, t, a, c, s).catch((d) => c.error(d));
    });
  }
  async getFeatures(n, t, a, s) {
    const o = await this.getFeatureStream(n, t, a, s);
    return (await jF(o.pipe(r8()))).flat();
  }
}
class Lg extends a8 {
  /**
   * Retrieves a BlockView of a specific zoomLevel
   *
   * @param scale - number
   *
   * @param opts - An object containing basesPerSpan (e.g. pixels per basepair)
   * or scale used to infer the zoomLevel to use
   */
  async getView(n, t) {
    const { zoomLevels: a, refsByName: s, fileSize: o, isBigEndian: h, uncompressBufSize: l } = await this.getHeader(t), v = 1 / n;
    let c = a.length;
    o || (c -= 1);
    for (let d = c; d >= 0; d -= 1) {
      const A = a[d];
      if (A && A.reductionLevel <= 2 * v) {
        const C = Number(A.indexOffset);
        return new Ig(this.bbi, s, C, h, l > 0, "summary");
      }
    }
    return this.getUnzoomedView(t);
  }
}
function To(e, n, t) {
  let a = new Lg({
    filehandle: new wr(t, { fetch: Ka })
  });
  async function s(h, l) {
    const v = h.map((d) => {
      let A = l.ensemblStyle ? d.chr.replace("chr", "") : d.chr;
      return A === "M" && (A = "MT"), a.getFeatures(A, d.start, d.end);
    }), c = await Promise.all(v);
    return h.forEach((d, A) => {
      c[A].forEach((C) => C.chr = d.chr);
    }), qt.flatten(c);
  }
  function o() {
    return s(e, n);
  }
  return o();
}
class u8 {
  constructor(n, t, a = 0, s = "", o = "") {
    this.locus1 = n, this.locus2 = t, this.score = a, this.name = s, this.color = o, this.locus1 = n, this.locus2 = t, this.score = a, this.name = s, this.color = o;
  }
  getDistance() {
    return Math.round(Math.abs(this.locus1.start - this.locus2.start));
  }
}
const o8 = "https://higlass.io/api/v1/fragments_by_loci/", Ra = 50;
function s8(e, n, t) {
  async function a(h, l) {
    const c = await (await Ka(o8, {
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
          t,
          -1
        ]
      ]),
      params: {
        precision: 3,
        dims: Ra
      }
    })).json(), d = Math.round(
      h.end - h.start / Ra
    ), A = Math.round(
      l.end - l.start / Ra
    ), C = [];
    for (let y = 0; y < Ra; y++)
      for (let k = y; k < Ra; k++) {
        const B = new je(
          h.chr,
          h.start + y * d,
          h.start + (y + 1) * d
        ), P = new je(
          l.chr,
          l.start + k * A,
          l.start + (k + 1) * A
        );
        C.push(
          new u8(
            B,
            P,
            c.data.fragments[0][y][k]
          )
        );
      }
    return C;
  }
  async function s(h, l = {}) {
    const v = [];
    for (let d = 0; d < h.length; d++)
      for (let A = d; A < h.length; A++)
        h[d].chr === h[A].chr && v.push(await a(h[d], h[A]));
    const c = await Promise.all(v);
    return qt.flatMap(c);
  }
  function o() {
    return s(e, n);
  }
  return o();
}
const f8 = 1e3;
function l8(e, n, t, a) {
  let s = f8, o = new Lg({
    filehandle: new wr(t, { fetch: Ka })
  });
  async function h(v, c) {
    if (a > s)
      return Promise.resolve([]);
    {
      const d = v.map((C) => {
        let y = c.ensemblStyle ? C.chr.replace("chr", "") : C.chr;
        return y === "M" && (y = "MT"), o.getFeatures(y, C.start, C.end);
      }), A = await Promise.all(d);
      return v.forEach((C, y) => {
        A[y].forEach((k) => k.chr = C.chr);
      }), qt.flatten(A);
    }
  }
  function l() {
    return h(e, n);
  }
  return l();
}
const h8 = "https://lambda.epigenomegateway.org/v2", gl = {
  geneannotation: async function(n) {
    return await (await fetch(
      `${h8}/${n.genomeName}/genes/${n.name}/queryRegion?chr=${n.chr}&start=${n.start}&end=${n.end}`,
      { method: "GET" }
    )).json();
  },
  bed: async function(n) {
    return ri(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  bigbed: async function(n) {
    return To(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  refbed: async function(n) {
    return ri(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  matplot: async function(n) {
    return ri(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  bigwig: async function(n) {
    return To(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  cool: async function(n) {
    return s8(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  categorical: async function(n) {
    return ri(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  longrange: async function(n) {
    return ri(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  dynseq: async function(n) {
    return To(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  repeatmasker: async function(n) {
    return l8(
      n.nav,
      n.trackModel.options,
      n.trackModel.url,
      n.basesPerPixel
    );
  },
  biginteract: async function(n) {
    return To(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  methylc: async function(n) {
    return ri(
      n.nav,
      n.trackModel.options,
      n.trackModel.url
    );
  },
  hic: function(n, t, a, s) {
    return n.getData(a, s, t);
  },
  genomealign: function(n, t, a) {
    return ri(n, t, a);
  }
};
self.onmessage = async (e) => {
  let n = e.data.primaryGenName, t = [], a = e.data.genomicLoci, s = e.data.expandedGenLoci, o = e.data.initGenomicLoci, h = e.data.trackModelArr, l = {}, v = e.data.initNavLoci, c = e.data.useFineModeNav;
  l[`${n}`] = {
    genomicLoci: a,
    expandGenomicLoci: s,
    initGenomicLoci: o,
    curFetchRegionNav: e.data.curFetchRegionNav,
    initNavLoci: v
  };
  let d = h.filter((B, P) => B.type === "genomealign");
  d.length > 0 ? (l[`${n}`].primaryVisData = [], (await A(e.data.visData.visRegion, d)).map((B) => {
    l[`${n}`].primaryVisData = B.result.primaryVisData, l[`${B.queryName}`] = {
      queryGenomicCoord: new Array(B.queryGenomicCoord),
      id: B.id,
      queryRegion: B.result.queryRegion
    }, t.push(B);
  })) : l[`${n}`].primaryVisData = e.data.visData;
  async function A(B, P) {
    let T = [], Z = [];
    for (let ie of e.data.visData.visRegion._navContext._features) {
      let Ce = new je(
        ie.locus.chr,
        ie.locus.start,
        ie.locus.end
      );
      T.push(new Yn(ie.name, Ce));
    }
    let U = new In(
      e.data.visData.visRegion._navContext._name,
      T
    ), $ = new na(
      U,
      B._startBase,
      B._endBase
    ), L = [];
    for (let ie of e.data.visData.viewWindowRegion._navContext._features) {
      let Ce = new je(
        ie.locus.chr,
        ie.locus.start,
        ie.locus.end
      );
      L.push(new Yn(ie.name, Ce));
    }
    let Q = new In(
      e.data.visData.viewWindowRegion._navContext._name,
      L
    ), q = new na(
      Q,
      B._startBase + e.data.bpRegionSize,
      B._endBase - e.data.bpRegionSize
    ), G = {
      visWidth: e.data.windowWidth * 3,
      visRegion: $,
      viewWindow: new Re(
        e.data.windowWidth,
        e.data.windowWidth * 2
      ),
      viewWindowRegion: q
    };
    const J = await Promise.all(
      P.map(async (ie, Ce) => {
        let ve = await gl.genomealign(
          s,
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
        ), Me = [], Oe = ve;
        for (const ce of Oe) {
          let Be = Sy.parse("{" + ce[3] + "}");
          ce[3] = Be, Me.push(new $y(ce));
        }
        return {
          query: ie.querygenome,
          records: Me,
          isBigChain: !1,
          id: ie.id
        };
      })
    );
    let K = new IE(
      e.data.primaryGenName
    ).multiAlign(G, J);
    for (let ie in K) {
      let Ce;
      if (!c) {
        Ce = [].concat.apply(
          [],
          K[`${ie}`].drawData.map(
            (ze) => ze.segments
          )
        );
        const Oe = Ce.map(
          (ze) => ze.record.queryStrand
        ), ce = Ce.map(
          (ze) => ze.targetXSpan
        ), Be = Ce.map(
          (ze) => ze.queryXSpan
        ), Nn = Ce.map(
          (ze) => ze.visiblePart.getLocus().toString()
        ), xt = Ce.map(
          (ze) => ze.visiblePart.getQueryLocus().toString()
        ), me = Ce.map(
          (ze) => Vi(ze.visiblePart.getLength())
        ), nt = Ce.map(
          (ze) => Vi(ze.visiblePart.getQueryLocus().getLength())
        );
        let tn = {};
        tn = {
          strandList: Oe,
          targetXSpanList: ce,
          queryXSpanList: Be,
          targetLocusList: Nn,
          queryLocusList: xt,
          lengthList: me,
          queryLengthList: nt
        }, K[`${ie}`] = { ...K[`${ie}`], ...tn };
      }
      for (let Oe = 0; Oe < K[`${ie}`].drawData.length; Oe++) {
        let ce = K[`${ie}`].drawData[Oe], Be = {};
        const { targetXSpan: Nn } = ce;
        if (c) {
          const xt = ce.visiblePart.getTargetSequence(), me = ce.visiblePart.getQuerySequence(), nt = Nn.getLength() / xt.length, tn = ce.visiblePart.getLocus().toString(), ze = ce.visiblePart.getQueryLocus().toString(), At = ce.visiblePart.getQueryLocusFine(), nn = ce.targetSegments.filter(
            (Rt) => !Rt.isGap
          ), Dr = ce.querySegments.filter(
            (Rt) => !Rt.isGap
          ), Dt = ce.record.getIsReverseStrandQuery();
          Be = {
            targetSequence: xt,
            querySequence: me,
            nonGapsQuery: Dr,
            baseWidth: nt,
            targetLocus: tn,
            queryLocus: ze,
            nonGapsTarget: nn,
            isReverseStrandQuery: Dt,
            queryLocusFine: At
          };
        } else
          Be = { estimatedLabelWidth: ce.queryFeature.toString().length };
        K[`${ie}`].drawData[Oe] = {
          ...ce,
          ...Be
        };
      }
      let ve = [], Me = K[`${ie}`].queryRegion._navContext._featuresForChr;
      for (let Oe in Me)
        if (Oe !== "") {
          let ce = k(
            Me[`${Oe}`][0].name
          ).start, Be = k(
            Me[`${Oe}`][Me[`${Oe}`].length - 1].name
          ).end;
          ve.push({ chr: Oe, start: ce, end: Be });
        }
      Z.push({
        queryName: ie,
        result: K[`${ie}`],
        id: K[`${ie}`].id,
        name: "genomealign",
        queryGenomicCoord: ve
      });
    }
    return Z;
  }
  let C = h.filter((B, P) => B.type !== "genomealign");
  await Promise.all(
    C.map(async (B, P) => {
      const T = B.type, Z = B.genome, U = B.id;
      if (B.url, T === "hic" || T === "ruler")
        t.push({
          name: T,
          id: U,
          metadata: B.metadata
        });
      else if (T === "geneannotation") {
        let $ = await y(B, Z);
        t.push({
          name: T,
          // I fetch three sections so I need to have an array with 3 different section data [{},{},{}]
          // when moving left and right get only 1 region so [{}] I just sent {}
          result: e.data.initial !== 1 ? $[0] : $,
          id: U,
          metadata: B.metadata
        });
      } else if (T === "matplot") {
        let $ = await Promise.all(
          B.tracks.map(async (L, Q) => e.data.initial !== 1 ? (await y(L, Z)).flat(1) : y(L, Z))
        );
        t.push({
          name: T,
          result: $,
          id: U,
          metadata: B.metadata
        });
      } else {
        let $ = await y(B, Z);
        t.push({
          name: T,
          result: e.data.initial !== 1 ? $[0] : $,
          id: U,
          metadata: B.metadata
        });
      }
    })
  );
  async function y(B, P, T) {
    let Z = [], U;
    "genome" in B.metadata ? U = l[`${B.metadata.genome}`].queryGenomicCoord : c || B.type === "longrange" || B.type === "biginteract" ? U = new Array(s) : e.data.initial === 1 ? U = o : U = new Array(a);
    for (let $ = 0; $ < U.length; $++) {
      let L;
      B.type === "geneannotation" ? L = await Promise.all(
        await U[$].map((Q, q) => gl[B.type]({
          genomeName: P,
          name: B.name,
          chr: Q.chr,
          start: Q.start,
          end: Q.end,
          nav: Q,
          trackModel: B,
          trackType: B.type
        }))
      ) : L = await Promise.all(
        await gl[B.type]({
          genomeName: P,
          name: B.name,
          basesPerPixel: e.data.bpRegionSize / e.data.windowWidth,
          nav: U[$],
          trackModel: B,
          trackType: B.type
        })
      ), Z.push(qt.flatten(L));
    }
    return Z;
  }
  function k(B) {
    const [P, T] = B.split(":"), [Z, U] = T.split("-"), $ = P.slice(3), L = parseInt(Z, 10), Q = parseInt(U, 10);
    return { chr: $, start: L, end: Q };
  }
  postMessage({
    fetchResults: t,
    side: e.data.trackSide,
    xDist: e.data.xDist,
    initial: e.data.initial,
    curFetchRegionNav: e.data.curFetchRegionNav,
    genomicFetchCoord: l,
    bpX: e.data.bpX,
    useFineModeNav: c,
    genomicLoci: a,
    expandGenomicLoci: s
  });
};
