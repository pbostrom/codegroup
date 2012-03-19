var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.evalWorksForGlobals_ = null;
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.getObjectByName(name) && !goog.implicitNamespaces_[name]) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.require = function(rule) {
  if(!COMPILED) {
    if(goog.getObjectByName(rule)) {
      return
    }
    var path = goog.getPathFromDeps_(rule);
    if(path) {
      goog.included_[path] = true;
      goog.writeScripts_()
    }else {
      var errorMessage = "goog.require could not find: " + rule;
      if(goog.global.console) {
        goog.global.console["error"](errorMessage)
      }
      throw Error(errorMessage);
    }
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(requireName in deps.nameToPath) {
            visitNode(deps.nameToPath[requireName])
          }else {
            if(!goog.getObjectByName(requireName)) {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  var context = selfObj || goog.global;
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(context, newArgs)
    }
  }else {
    return function() {
      return fn.apply(context, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = style
};
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global && !goog.string.contains(str, "<")) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var el = goog.global["document"]["createElement"]("div");
  el["innerHTML"] = "<pre>x" + str + "</pre>";
  if(el["firstChild"][goog.string.NORMALIZE_FN_]) {
    el["firstChild"][goog.string.NORMALIZE_FN_]()
  }
  str = el["firstChild"]["firstChild"]["nodeValue"].slice(1);
  el["innerHTML"] = "";
  return goog.string.canonicalizeNewlines(str)
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.NORMALIZE_FN_ = "normalize";
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\u000b":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isVersion("9"), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.disposeInternal = function() {
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
MESSAGE:"message", CONNECT:"connect"};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = new Function("a", "return a");
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      try {
        goog.reflect.sinkValue(relatedTarget.nodeName)
      }catch(err) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.structs.SimplePool");
goog.require("goog.Disposable");
goog.structs.SimplePool = function(initialCount, maxCount) {
  goog.Disposable.call(this);
  this.maxCount_ = maxCount;
  this.freeQueue_ = [];
  this.createInitial_(initialCount)
};
goog.inherits(goog.structs.SimplePool, goog.Disposable);
goog.structs.SimplePool.prototype.createObjectFn_ = null;
goog.structs.SimplePool.prototype.disposeObjectFn_ = null;
goog.structs.SimplePool.prototype.setCreateObjectFn = function(createObjectFn) {
  this.createObjectFn_ = createObjectFn
};
goog.structs.SimplePool.prototype.setDisposeObjectFn = function(disposeObjectFn) {
  this.disposeObjectFn_ = disposeObjectFn
};
goog.structs.SimplePool.prototype.getObject = function() {
  if(this.freeQueue_.length) {
    return this.freeQueue_.pop()
  }
  return this.createObject()
};
goog.structs.SimplePool.prototype.releaseObject = function(obj) {
  if(this.freeQueue_.length < this.maxCount_) {
    this.freeQueue_.push(obj)
  }else {
    this.disposeObject(obj)
  }
};
goog.structs.SimplePool.prototype.createInitial_ = function(initialCount) {
  if(initialCount > this.maxCount_) {
    throw Error("[goog.structs.SimplePool] Initial cannot be greater than max");
  }
  for(var i = 0;i < initialCount;i++) {
    this.freeQueue_.push(this.createObject())
  }
};
goog.structs.SimplePool.prototype.createObject = function() {
  if(this.createObjectFn_) {
    return this.createObjectFn_()
  }else {
    return{}
  }
};
goog.structs.SimplePool.prototype.disposeObject = function(obj) {
  if(this.disposeObjectFn_) {
    this.disposeObjectFn_(obj)
  }else {
    if(goog.isObject(obj)) {
      if(goog.isFunction(obj.dispose)) {
        obj.dispose()
      }else {
        for(var i in obj) {
          delete obj[i]
        }
      }
    }
  }
};
goog.structs.SimplePool.prototype.disposeInternal = function() {
  goog.structs.SimplePool.superClass_.disposeInternal.call(this);
  var freeQueue = this.freeQueue_;
  while(freeQueue.length) {
    this.disposeObject(freeQueue.pop())
  }
  delete this.freeQueue_
};
goog.provide("goog.events.pools");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Listener");
goog.require("goog.structs.SimplePool");
goog.require("goog.userAgent.jscript");
goog.events.ASSUME_GOOD_GC = false;
goog.events.pools.getObject;
goog.events.pools.releaseObject;
goog.events.pools.getArray;
goog.events.pools.releaseArray;
goog.events.pools.getProxy;
goog.events.pools.setProxyCallbackFunction;
goog.events.pools.releaseProxy;
goog.events.pools.getListener;
goog.events.pools.releaseListener;
goog.events.pools.getEvent;
goog.events.pools.releaseEvent;
(function() {
  var BAD_GC = !goog.events.ASSUME_GOOD_GC && goog.userAgent.jscript.HAS_JSCRIPT && !goog.userAgent.jscript.isVersion("5.7");
  function getObject() {
    return{count_:0, remaining_:0}
  }
  function getArray() {
    return[]
  }
  var proxyCallbackFunction;
  goog.events.pools.setProxyCallbackFunction = function(cb) {
    proxyCallbackFunction = cb
  };
  function getProxy() {
    var f = function(eventObject) {
      return proxyCallbackFunction.call(f.src, f.key, eventObject)
    };
    return f
  }
  function getListener() {
    return new goog.events.Listener
  }
  function getEvent() {
    return new goog.events.BrowserEvent
  }
  if(!BAD_GC) {
    goog.events.pools.getObject = getObject;
    goog.events.pools.releaseObject = goog.nullFunction;
    goog.events.pools.getArray = getArray;
    goog.events.pools.releaseArray = goog.nullFunction;
    goog.events.pools.getProxy = getProxy;
    goog.events.pools.releaseProxy = goog.nullFunction;
    goog.events.pools.getListener = getListener;
    goog.events.pools.releaseListener = goog.nullFunction;
    goog.events.pools.getEvent = getEvent;
    goog.events.pools.releaseEvent = goog.nullFunction
  }else {
    goog.events.pools.getObject = function() {
      return objectPool.getObject()
    };
    goog.events.pools.releaseObject = function(obj) {
      objectPool.releaseObject(obj)
    };
    goog.events.pools.getArray = function() {
      return arrayPool.getObject()
    };
    goog.events.pools.releaseArray = function(obj) {
      arrayPool.releaseObject(obj)
    };
    goog.events.pools.getProxy = function() {
      return proxyPool.getObject()
    };
    goog.events.pools.releaseProxy = function(obj) {
      proxyPool.releaseObject(getProxy())
    };
    goog.events.pools.getListener = function() {
      return listenerPool.getObject()
    };
    goog.events.pools.releaseListener = function(obj) {
      listenerPool.releaseObject(obj)
    };
    goog.events.pools.getEvent = function() {
      return eventPool.getObject()
    };
    goog.events.pools.releaseEvent = function(obj) {
      eventPool.releaseObject(obj)
    };
    var OBJECT_POOL_INITIAL_COUNT = 0;
    var OBJECT_POOL_MAX_COUNT = 600;
    var objectPool = new goog.structs.SimplePool(OBJECT_POOL_INITIAL_COUNT, OBJECT_POOL_MAX_COUNT);
    objectPool.setCreateObjectFn(getObject);
    var ARRAY_POOL_INITIAL_COUNT = 0;
    var ARRAY_POOL_MAX_COUNT = 600;
    var arrayPool = new goog.structs.SimplePool(ARRAY_POOL_INITIAL_COUNT, ARRAY_POOL_MAX_COUNT);
    arrayPool.setCreateObjectFn(getArray);
    var HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT = 0;
    var HANDLE_EVENT_PROXY_POOL_MAX_COUNT = 600;
    var proxyPool = new goog.structs.SimplePool(HANDLE_EVENT_PROXY_POOL_INITIAL_COUNT, HANDLE_EVENT_PROXY_POOL_MAX_COUNT);
    proxyPool.setCreateObjectFn(getProxy);
    var LISTENER_POOL_INITIAL_COUNT = 0;
    var LISTENER_POOL_MAX_COUNT = 600;
    var listenerPool = new goog.structs.SimplePool(LISTENER_POOL_INITIAL_COUNT, LISTENER_POOL_MAX_COUNT);
    listenerPool.setCreateObjectFn(getListener);
    var EVENT_POOL_INITIAL_COUNT = 0;
    var EVENT_POOL_MAX_COUNT = 600;
    var eventPool = new goog.structs.SimplePool(EVENT_POOL_INITIAL_COUNT, EVENT_POOL_MAX_COUNT);
    eventPool.setCreateObjectFn(getEvent)
  }
})();
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.pools");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.requiresSyntheticEventPropagation_;
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = goog.events.pools.getObject()
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = goog.events.pools.getObject();
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = goog.events.pools.getArray();
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.pools.getProxy();
      proxy.src = src;
      listenerObj = goog.events.pools.getListener();
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = goog.events.pools.getArray()
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          goog.events.pools.releaseProxy(proxy);
          goog.events.pools.releaseListener(listenerArray[oldIndex]);
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        goog.events.pools.releaseArray(listenerArray);
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type][capture]);
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          goog.events.pools.releaseObject(goog.events.listenerTree_[type]);
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(goog.events.synthesizeEventPropagation_()) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = goog.events.pools.getEvent();
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = goog.events.pools.getArray();
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0;
        goog.events.pools.releaseArray(ancestors)
      }
      evt.dispose();
      goog.events.pools.releaseEvent(evt)
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_);
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.events.synthesizeEventPropagation_ = function() {
  if(goog.events.requiresSyntheticEventPropagation_ === undefined) {
    goog.events.requiresSyntheticEventPropagation_ = goog.userAgent.IE && !goog.global["addEventListener"]
  }
  return goog.events.requiresSyntheticEventPropagation_
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_);
  goog.events.pools.setProxyCallbackFunction(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var or__3548__auto____9897 = p[goog.typeOf.call(null, x)];
  if(cljs.core.truth_(or__3548__auto____9897)) {
    return or__3548__auto____9897
  }else {
    var or__3548__auto____9898 = p["_"];
    if(cljs.core.truth_(or__3548__auto____9898)) {
      return or__3548__auto____9898
    }else {
      return false
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error.call(null, "No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.aget = function aget(array, i) {
  return array[i]
};
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__9962 = function(this$) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9899 = this$;
      if(cljs.core.truth_(and__3546__auto____9899)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9899
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$)
    }else {
      return function() {
        var or__3548__auto____9900 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9900)) {
          return or__3548__auto____9900
        }else {
          var or__3548__auto____9901 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9901)) {
            return or__3548__auto____9901
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__9963 = function(this$, a) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9902 = this$;
      if(cljs.core.truth_(and__3546__auto____9902)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9902
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a)
    }else {
      return function() {
        var or__3548__auto____9903 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9903)) {
          return or__3548__auto____9903
        }else {
          var or__3548__auto____9904 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9904)) {
            return or__3548__auto____9904
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__9964 = function(this$, a, b) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9905 = this$;
      if(cljs.core.truth_(and__3546__auto____9905)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9905
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____9906 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9906)) {
          return or__3548__auto____9906
        }else {
          var or__3548__auto____9907 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9907)) {
            return or__3548__auto____9907
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__9965 = function(this$, a, b, c) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9908 = this$;
      if(cljs.core.truth_(and__3546__auto____9908)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9908
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____9909 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9909)) {
          return or__3548__auto____9909
        }else {
          var or__3548__auto____9910 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9910)) {
            return or__3548__auto____9910
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__9966 = function(this$, a, b, c, d) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9911 = this$;
      if(cljs.core.truth_(and__3546__auto____9911)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9911
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____9912 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9912)) {
          return or__3548__auto____9912
        }else {
          var or__3548__auto____9913 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9913)) {
            return or__3548__auto____9913
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__9967 = function(this$, a, b, c, d, e) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9914 = this$;
      if(cljs.core.truth_(and__3546__auto____9914)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9914
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____9915 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9915)) {
          return or__3548__auto____9915
        }else {
          var or__3548__auto____9916 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9916)) {
            return or__3548__auto____9916
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__9968 = function(this$, a, b, c, d, e, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9917 = this$;
      if(cljs.core.truth_(and__3546__auto____9917)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9917
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____9918 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9918)) {
          return or__3548__auto____9918
        }else {
          var or__3548__auto____9919 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9919)) {
            return or__3548__auto____9919
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__9969 = function(this$, a, b, c, d, e, f, g) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9920 = this$;
      if(cljs.core.truth_(and__3546__auto____9920)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9920
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____9921 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9921)) {
          return or__3548__auto____9921
        }else {
          var or__3548__auto____9922 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9922)) {
            return or__3548__auto____9922
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9970 = function(this$, a, b, c, d, e, f, g, h) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9923 = this$;
      if(cljs.core.truth_(and__3546__auto____9923)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9923
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____9924 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9924)) {
          return or__3548__auto____9924
        }else {
          var or__3548__auto____9925 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9925)) {
            return or__3548__auto____9925
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__9971 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9926 = this$;
      if(cljs.core.truth_(and__3546__auto____9926)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9926
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____9927 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9927)) {
          return or__3548__auto____9927
        }else {
          var or__3548__auto____9928 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9928)) {
            return or__3548__auto____9928
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__9972 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9929 = this$;
      if(cljs.core.truth_(and__3546__auto____9929)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9929
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____9930 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9930)) {
          return or__3548__auto____9930
        }else {
          var or__3548__auto____9931 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9931)) {
            return or__3548__auto____9931
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__9973 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9932 = this$;
      if(cljs.core.truth_(and__3546__auto____9932)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9932
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____9933 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9933)) {
          return or__3548__auto____9933
        }else {
          var or__3548__auto____9934 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9934)) {
            return or__3548__auto____9934
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__9974 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9935 = this$;
      if(cljs.core.truth_(and__3546__auto____9935)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9935
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____9936 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9936)) {
          return or__3548__auto____9936
        }else {
          var or__3548__auto____9937 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9937)) {
            return or__3548__auto____9937
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__9975 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9938 = this$;
      if(cljs.core.truth_(and__3546__auto____9938)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9938
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____9939 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9939)) {
          return or__3548__auto____9939
        }else {
          var or__3548__auto____9940 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9940)) {
            return or__3548__auto____9940
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__9976 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9941 = this$;
      if(cljs.core.truth_(and__3546__auto____9941)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9941
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____9942 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9942)) {
          return or__3548__auto____9942
        }else {
          var or__3548__auto____9943 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9943)) {
            return or__3548__auto____9943
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__9977 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9944 = this$;
      if(cljs.core.truth_(and__3546__auto____9944)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9944
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____9945 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9945)) {
          return or__3548__auto____9945
        }else {
          var or__3548__auto____9946 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9946)) {
            return or__3548__auto____9946
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__9978 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9947 = this$;
      if(cljs.core.truth_(and__3546__auto____9947)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9947
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____9948 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9948)) {
          return or__3548__auto____9948
        }else {
          var or__3548__auto____9949 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9949)) {
            return or__3548__auto____9949
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__9979 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9950 = this$;
      if(cljs.core.truth_(and__3546__auto____9950)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9950
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____9951 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9951)) {
          return or__3548__auto____9951
        }else {
          var or__3548__auto____9952 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9952)) {
            return or__3548__auto____9952
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__9980 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9953 = this$;
      if(cljs.core.truth_(and__3546__auto____9953)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9953
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____9954 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9954)) {
          return or__3548__auto____9954
        }else {
          var or__3548__auto____9955 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9955)) {
            return or__3548__auto____9955
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__9981 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9956 = this$;
      if(cljs.core.truth_(and__3546__auto____9956)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9956
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____9957 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9957)) {
          return or__3548__auto____9957
        }else {
          var or__3548__auto____9958 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9958)) {
            return or__3548__auto____9958
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__9982 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9959 = this$;
      if(cljs.core.truth_(and__3546__auto____9959)) {
        return this$.cljs$core$IFn$_invoke
      }else {
        return and__3546__auto____9959
      }
    }())) {
      return this$.cljs$core$IFn$_invoke(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____9960 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(cljs.core.truth_(or__3548__auto____9960)) {
          return or__3548__auto____9960
        }else {
          var or__3548__auto____9961 = cljs.core._invoke["_"];
          if(cljs.core.truth_(or__3548__auto____9961)) {
            return or__3548__auto____9961
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__9962.call(this, this$);
      case 2:
        return _invoke__9963.call(this, this$, a);
      case 3:
        return _invoke__9964.call(this, this$, a, b);
      case 4:
        return _invoke__9965.call(this, this$, a, b, c);
      case 5:
        return _invoke__9966.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__9967.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__9968.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__9969.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9970.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__9971.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__9972.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__9973.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__9974.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__9975.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__9976.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__9977.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__9978.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__9979.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__9980.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__9981.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__9982.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____9984 = coll;
    if(cljs.core.truth_(and__3546__auto____9984)) {
      return coll.cljs$core$ICounted$_count
    }else {
      return and__3546__auto____9984
    }
  }())) {
    return coll.cljs$core$ICounted$_count(coll)
  }else {
    return function() {
      var or__3548__auto____9985 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____9985)) {
        return or__3548__auto____9985
      }else {
        var or__3548__auto____9986 = cljs.core._count["_"];
        if(cljs.core.truth_(or__3548__auto____9986)) {
          return or__3548__auto____9986
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____9987 = coll;
    if(cljs.core.truth_(and__3546__auto____9987)) {
      return coll.cljs$core$IEmptyableCollection$_empty
    }else {
      return and__3546__auto____9987
    }
  }())) {
    return coll.cljs$core$IEmptyableCollection$_empty(coll)
  }else {
    return function() {
      var or__3548__auto____9988 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____9988)) {
        return or__3548__auto____9988
      }else {
        var or__3548__auto____9989 = cljs.core._empty["_"];
        if(cljs.core.truth_(or__3548__auto____9989)) {
          return or__3548__auto____9989
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____9990 = coll;
    if(cljs.core.truth_(and__3546__auto____9990)) {
      return coll.cljs$core$ICollection$_conj
    }else {
      return and__3546__auto____9990
    }
  }())) {
    return coll.cljs$core$ICollection$_conj(coll, o)
  }else {
    return function() {
      var or__3548__auto____9991 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____9991)) {
        return or__3548__auto____9991
      }else {
        var or__3548__auto____9992 = cljs.core._conj["_"];
        if(cljs.core.truth_(or__3548__auto____9992)) {
          return or__3548__auto____9992
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__9999 = function(coll, n) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9993 = coll;
      if(cljs.core.truth_(and__3546__auto____9993)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____9993
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n)
    }else {
      return function() {
        var or__3548__auto____9994 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____9994)) {
          return or__3548__auto____9994
        }else {
          var or__3548__auto____9995 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____9995)) {
            return or__3548__auto____9995
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__10000 = function(coll, n, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____9996 = coll;
      if(cljs.core.truth_(and__3546__auto____9996)) {
        return coll.cljs$core$IIndexed$_nth
      }else {
        return and__3546__auto____9996
      }
    }())) {
      return coll.cljs$core$IIndexed$_nth(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____9997 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____9997)) {
          return or__3548__auto____9997
        }else {
          var or__3548__auto____9998 = cljs.core._nth["_"];
          if(cljs.core.truth_(or__3548__auto____9998)) {
            return or__3548__auto____9998
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__9999.call(this, coll, n);
      case 3:
        return _nth__10000.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _nth
}();
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10002 = coll;
    if(cljs.core.truth_(and__3546__auto____10002)) {
      return coll.cljs$core$ISeq$_first
    }else {
      return and__3546__auto____10002
    }
  }())) {
    return coll.cljs$core$ISeq$_first(coll)
  }else {
    return function() {
      var or__3548__auto____10003 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____10003)) {
        return or__3548__auto____10003
      }else {
        var or__3548__auto____10004 = cljs.core._first["_"];
        if(cljs.core.truth_(or__3548__auto____10004)) {
          return or__3548__auto____10004
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10005 = coll;
    if(cljs.core.truth_(and__3546__auto____10005)) {
      return coll.cljs$core$ISeq$_rest
    }else {
      return and__3546__auto____10005
    }
  }())) {
    return coll.cljs$core$ISeq$_rest(coll)
  }else {
    return function() {
      var or__3548__auto____10006 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____10006)) {
        return or__3548__auto____10006
      }else {
        var or__3548__auto____10007 = cljs.core._rest["_"];
        if(cljs.core.truth_(or__3548__auto____10007)) {
          return or__3548__auto____10007
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__10014 = function(o, k) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____10008 = o;
      if(cljs.core.truth_(and__3546__auto____10008)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____10008
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k)
    }else {
      return function() {
        var or__3548__auto____10009 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____10009)) {
          return or__3548__auto____10009
        }else {
          var or__3548__auto____10010 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____10010)) {
            return or__3548__auto____10010
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__10015 = function(o, k, not_found) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____10011 = o;
      if(cljs.core.truth_(and__3546__auto____10011)) {
        return o.cljs$core$ILookup$_lookup
      }else {
        return and__3546__auto____10011
      }
    }())) {
      return o.cljs$core$ILookup$_lookup(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____10012 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(cljs.core.truth_(or__3548__auto____10012)) {
          return or__3548__auto____10012
        }else {
          var or__3548__auto____10013 = cljs.core._lookup["_"];
          if(cljs.core.truth_(or__3548__auto____10013)) {
            return or__3548__auto____10013
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__10014.call(this, o, k);
      case 3:
        return _lookup__10015.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10017 = coll;
    if(cljs.core.truth_(and__3546__auto____10017)) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_
    }else {
      return and__3546__auto____10017
    }
  }())) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_(coll, k)
  }else {
    return function() {
      var or__3548__auto____10018 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____10018)) {
        return or__3548__auto____10018
      }else {
        var or__3548__auto____10019 = cljs.core._contains_key_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____10019)) {
          return or__3548__auto____10019
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10020 = coll;
    if(cljs.core.truth_(and__3546__auto____10020)) {
      return coll.cljs$core$IAssociative$_assoc
    }else {
      return and__3546__auto____10020
    }
  }())) {
    return coll.cljs$core$IAssociative$_assoc(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____10021 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____10021)) {
        return or__3548__auto____10021
      }else {
        var or__3548__auto____10022 = cljs.core._assoc["_"];
        if(cljs.core.truth_(or__3548__auto____10022)) {
          return or__3548__auto____10022
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10023 = coll;
    if(cljs.core.truth_(and__3546__auto____10023)) {
      return coll.cljs$core$IMap$_dissoc
    }else {
      return and__3546__auto____10023
    }
  }())) {
    return coll.cljs$core$IMap$_dissoc(coll, k)
  }else {
    return function() {
      var or__3548__auto____10024 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____10024)) {
        return or__3548__auto____10024
      }else {
        var or__3548__auto____10025 = cljs.core._dissoc["_"];
        if(cljs.core.truth_(or__3548__auto____10025)) {
          return or__3548__auto____10025
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10026 = coll;
    if(cljs.core.truth_(and__3546__auto____10026)) {
      return coll.cljs$core$ISet$_disjoin
    }else {
      return and__3546__auto____10026
    }
  }())) {
    return coll.cljs$core$ISet$_disjoin(coll, v)
  }else {
    return function() {
      var or__3548__auto____10027 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____10027)) {
        return or__3548__auto____10027
      }else {
        var or__3548__auto____10028 = cljs.core._disjoin["_"];
        if(cljs.core.truth_(or__3548__auto____10028)) {
          return or__3548__auto____10028
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10029 = coll;
    if(cljs.core.truth_(and__3546__auto____10029)) {
      return coll.cljs$core$IStack$_peek
    }else {
      return and__3546__auto____10029
    }
  }())) {
    return coll.cljs$core$IStack$_peek(coll)
  }else {
    return function() {
      var or__3548__auto____10030 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____10030)) {
        return or__3548__auto____10030
      }else {
        var or__3548__auto____10031 = cljs.core._peek["_"];
        if(cljs.core.truth_(or__3548__auto____10031)) {
          return or__3548__auto____10031
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10032 = coll;
    if(cljs.core.truth_(and__3546__auto____10032)) {
      return coll.cljs$core$IStack$_pop
    }else {
      return and__3546__auto____10032
    }
  }())) {
    return coll.cljs$core$IStack$_pop(coll)
  }else {
    return function() {
      var or__3548__auto____10033 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____10033)) {
        return or__3548__auto____10033
      }else {
        var or__3548__auto____10034 = cljs.core._pop["_"];
        if(cljs.core.truth_(or__3548__auto____10034)) {
          return or__3548__auto____10034
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10035 = coll;
    if(cljs.core.truth_(and__3546__auto____10035)) {
      return coll.cljs$core$IVector$_assoc_n
    }else {
      return and__3546__auto____10035
    }
  }())) {
    return coll.cljs$core$IVector$_assoc_n(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____10036 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(cljs.core.truth_(or__3548__auto____10036)) {
        return or__3548__auto____10036
      }else {
        var or__3548__auto____10037 = cljs.core._assoc_n["_"];
        if(cljs.core.truth_(or__3548__auto____10037)) {
          return or__3548__auto____10037
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10038 = o;
    if(cljs.core.truth_(and__3546__auto____10038)) {
      return o.cljs$core$IDeref$_deref
    }else {
      return and__3546__auto____10038
    }
  }())) {
    return o.cljs$core$IDeref$_deref(o)
  }else {
    return function() {
      var or__3548__auto____10039 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____10039)) {
        return or__3548__auto____10039
      }else {
        var or__3548__auto____10040 = cljs.core._deref["_"];
        if(cljs.core.truth_(or__3548__auto____10040)) {
          return or__3548__auto____10040
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10041 = o;
    if(cljs.core.truth_(and__3546__auto____10041)) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout
    }else {
      return and__3546__auto____10041
    }
  }())) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____10042 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____10042)) {
        return or__3548__auto____10042
      }else {
        var or__3548__auto____10043 = cljs.core._deref_with_timeout["_"];
        if(cljs.core.truth_(or__3548__auto____10043)) {
          return or__3548__auto____10043
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10044 = o;
    if(cljs.core.truth_(and__3546__auto____10044)) {
      return o.cljs$core$IMeta$_meta
    }else {
      return and__3546__auto____10044
    }
  }())) {
    return o.cljs$core$IMeta$_meta(o)
  }else {
    return function() {
      var or__3548__auto____10045 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____10045)) {
        return or__3548__auto____10045
      }else {
        var or__3548__auto____10046 = cljs.core._meta["_"];
        if(cljs.core.truth_(or__3548__auto____10046)) {
          return or__3548__auto____10046
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10047 = o;
    if(cljs.core.truth_(and__3546__auto____10047)) {
      return o.cljs$core$IWithMeta$_with_meta
    }else {
      return and__3546__auto____10047
    }
  }())) {
    return o.cljs$core$IWithMeta$_with_meta(o, meta)
  }else {
    return function() {
      var or__3548__auto____10048 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____10048)) {
        return or__3548__auto____10048
      }else {
        var or__3548__auto____10049 = cljs.core._with_meta["_"];
        if(cljs.core.truth_(or__3548__auto____10049)) {
          return or__3548__auto____10049
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__10056 = function(coll, f) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____10050 = coll;
      if(cljs.core.truth_(and__3546__auto____10050)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____10050
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f)
    }else {
      return function() {
        var or__3548__auto____10051 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____10051)) {
          return or__3548__auto____10051
        }else {
          var or__3548__auto____10052 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____10052)) {
            return or__3548__auto____10052
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__10057 = function(coll, f, start) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____10053 = coll;
      if(cljs.core.truth_(and__3546__auto____10053)) {
        return coll.cljs$core$IReduce$_reduce
      }else {
        return and__3546__auto____10053
      }
    }())) {
      return coll.cljs$core$IReduce$_reduce(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____10054 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(cljs.core.truth_(or__3548__auto____10054)) {
          return or__3548__auto____10054
        }else {
          var or__3548__auto____10055 = cljs.core._reduce["_"];
          if(cljs.core.truth_(or__3548__auto____10055)) {
            return or__3548__auto____10055
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__10056.call(this, coll, f);
      case 3:
        return _reduce__10057.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return _reduce
}();
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10059 = o;
    if(cljs.core.truth_(and__3546__auto____10059)) {
      return o.cljs$core$IEquiv$_equiv
    }else {
      return and__3546__auto____10059
    }
  }())) {
    return o.cljs$core$IEquiv$_equiv(o, other)
  }else {
    return function() {
      var or__3548__auto____10060 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____10060)) {
        return or__3548__auto____10060
      }else {
        var or__3548__auto____10061 = cljs.core._equiv["_"];
        if(cljs.core.truth_(or__3548__auto____10061)) {
          return or__3548__auto____10061
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10062 = o;
    if(cljs.core.truth_(and__3546__auto____10062)) {
      return o.cljs$core$IHash$_hash
    }else {
      return and__3546__auto____10062
    }
  }())) {
    return o.cljs$core$IHash$_hash(o)
  }else {
    return function() {
      var or__3548__auto____10063 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____10063)) {
        return or__3548__auto____10063
      }else {
        var or__3548__auto____10064 = cljs.core._hash["_"];
        if(cljs.core.truth_(or__3548__auto____10064)) {
          return or__3548__auto____10064
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10065 = o;
    if(cljs.core.truth_(and__3546__auto____10065)) {
      return o.cljs$core$ISeqable$_seq
    }else {
      return and__3546__auto____10065
    }
  }())) {
    return o.cljs$core$ISeqable$_seq(o)
  }else {
    return function() {
      var or__3548__auto____10066 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____10066)) {
        return or__3548__auto____10066
      }else {
        var or__3548__auto____10067 = cljs.core._seq["_"];
        if(cljs.core.truth_(or__3548__auto____10067)) {
          return or__3548__auto____10067
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IRecord = {};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10068 = o;
    if(cljs.core.truth_(and__3546__auto____10068)) {
      return o.cljs$core$IPrintable$_pr_seq
    }else {
      return and__3546__auto____10068
    }
  }())) {
    return o.cljs$core$IPrintable$_pr_seq(o, opts)
  }else {
    return function() {
      var or__3548__auto____10069 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(cljs.core.truth_(or__3548__auto____10069)) {
        return or__3548__auto____10069
      }else {
        var or__3548__auto____10070 = cljs.core._pr_seq["_"];
        if(cljs.core.truth_(or__3548__auto____10070)) {
          return or__3548__auto____10070
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10071 = d;
    if(cljs.core.truth_(and__3546__auto____10071)) {
      return d.cljs$core$IPending$_realized_QMARK_
    }else {
      return and__3546__auto____10071
    }
  }())) {
    return d.cljs$core$IPending$_realized_QMARK_(d)
  }else {
    return function() {
      var or__3548__auto____10072 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(cljs.core.truth_(or__3548__auto____10072)) {
        return or__3548__auto____10072
      }else {
        var or__3548__auto____10073 = cljs.core._realized_QMARK_["_"];
        if(cljs.core.truth_(or__3548__auto____10073)) {
          return or__3548__auto____10073
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10074 = this$;
    if(cljs.core.truth_(and__3546__auto____10074)) {
      return this$.cljs$core$IWatchable$_notify_watches
    }else {
      return and__3546__auto____10074
    }
  }())) {
    return this$.cljs$core$IWatchable$_notify_watches(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____10075 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____10075)) {
        return or__3548__auto____10075
      }else {
        var or__3548__auto____10076 = cljs.core._notify_watches["_"];
        if(cljs.core.truth_(or__3548__auto____10076)) {
          return or__3548__auto____10076
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10077 = this$;
    if(cljs.core.truth_(and__3546__auto____10077)) {
      return this$.cljs$core$IWatchable$_add_watch
    }else {
      return and__3546__auto____10077
    }
  }())) {
    return this$.cljs$core$IWatchable$_add_watch(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____10078 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____10078)) {
        return or__3548__auto____10078
      }else {
        var or__3548__auto____10079 = cljs.core._add_watch["_"];
        if(cljs.core.truth_(or__3548__auto____10079)) {
          return or__3548__auto____10079
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10080 = this$;
    if(cljs.core.truth_(and__3546__auto____10080)) {
      return this$.cljs$core$IWatchable$_remove_watch
    }else {
      return and__3546__auto____10080
    }
  }())) {
    return this$.cljs$core$IWatchable$_remove_watch(this$, key)
  }else {
    return function() {
      var or__3548__auto____10081 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____10081)) {
        return or__3548__auto____10081
      }else {
        var or__3548__auto____10082 = cljs.core._remove_watch["_"];
        if(cljs.core.truth_(or__3548__auto____10082)) {
          return or__3548__auto____10082
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function _EQ_(x, y) {
  return cljs.core._equiv.call(null, x, y)
};
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x === null
};
cljs.core.type = function type(x) {
  return x.constructor
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__10083 = null;
  var G__10083__10084 = function(o, k) {
    return null
  };
  var G__10083__10085 = function(o, k, not_found) {
    return not_found
  };
  G__10083 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10083__10084.call(this, o, k);
      case 3:
        return G__10083__10085.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10083
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__10087 = null;
  var G__10087__10088 = function(_, f) {
    return f.call(null)
  };
  var G__10087__10089 = function(_, f, start) {
    return start
  };
  G__10087 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10087__10088.call(this, _, f);
      case 3:
        return G__10087__10089.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10087
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o === null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__10091 = null;
  var G__10091__10092 = function(_, n) {
    return null
  };
  var G__10091__10093 = function(_, n, not_found) {
    return not_found
  };
  G__10091 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10091__10092.call(this, _, n);
      case 3:
        return G__10091__10093.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10091
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__10101 = function(cicoll, f) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, cljs.core._count.call(null, cicoll)))) {
      return f.call(null)
    }else {
      var val__10095 = cljs.core._nth.call(null, cicoll, 0);
      var n__10096 = 1;
      while(true) {
        if(cljs.core.truth_(n__10096 < cljs.core._count.call(null, cicoll))) {
          var G__10105 = f.call(null, val__10095, cljs.core._nth.call(null, cicoll, n__10096));
          var G__10106 = n__10096 + 1;
          val__10095 = G__10105;
          n__10096 = G__10106;
          continue
        }else {
          return val__10095
        }
        break
      }
    }
  };
  var ci_reduce__10102 = function(cicoll, f, val) {
    var val__10097 = val;
    var n__10098 = 0;
    while(true) {
      if(cljs.core.truth_(n__10098 < cljs.core._count.call(null, cicoll))) {
        var G__10107 = f.call(null, val__10097, cljs.core._nth.call(null, cicoll, n__10098));
        var G__10108 = n__10098 + 1;
        val__10097 = G__10107;
        n__10098 = G__10108;
        continue
      }else {
        return val__10097
      }
      break
    }
  };
  var ci_reduce__10103 = function(cicoll, f, val, idx) {
    var val__10099 = val;
    var n__10100 = idx;
    while(true) {
      if(cljs.core.truth_(n__10100 < cljs.core._count.call(null, cicoll))) {
        var G__10109 = f.call(null, val__10099, cljs.core._nth.call(null, cicoll, n__10100));
        var G__10110 = n__10100 + 1;
        val__10099 = G__10109;
        n__10100 = G__10110;
        continue
      }else {
        return val__10099
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__10101.call(this, cicoll, f);
      case 3:
        return ci_reduce__10102.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__10103.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ci_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i
};
cljs.core.IndexedSeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__10111 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce = function() {
  var G__10124 = null;
  var G__10124__10125 = function(_, f) {
    var this__10112 = this;
    return cljs.core.ci_reduce.call(null, this__10112.a, f, this__10112.a[this__10112.i], this__10112.i + 1)
  };
  var G__10124__10126 = function(_, f, start) {
    var this__10113 = this;
    return cljs.core.ci_reduce.call(null, this__10113.a, f, start, this__10113.i)
  };
  G__10124 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10124__10125.call(this, _, f);
      case 3:
        return G__10124__10126.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10124
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__10114 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__10115 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth = function() {
  var G__10128 = null;
  var G__10128__10129 = function(coll, n) {
    var this__10116 = this;
    var i__10117 = n + this__10116.i;
    if(cljs.core.truth_(i__10117 < this__10116.a.length)) {
      return this__10116.a[i__10117]
    }else {
      return null
    }
  };
  var G__10128__10130 = function(coll, n, not_found) {
    var this__10118 = this;
    var i__10119 = n + this__10118.i;
    if(cljs.core.truth_(i__10119 < this__10118.a.length)) {
      return this__10118.a[i__10119]
    }else {
      return not_found
    }
  };
  G__10128 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10128__10129.call(this, coll, n);
      case 3:
        return G__10128__10130.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10128
}();
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count = function(_) {
  var this__10120 = this;
  return this__10120.a.length - this__10120.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first = function(_) {
  var this__10121 = this;
  return this__10121.a[this__10121.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest = function(_) {
  var this__10122 = this;
  if(cljs.core.truth_(this__10122.i + 1 < this__10122.a.length)) {
    return new cljs.core.IndexedSeq(this__10122.a, this__10122.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq = function(this$) {
  var this__10123 = this;
  return this$
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function prim_seq(prim, i) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, 0, prim.length))) {
    return null
  }else {
    return new cljs.core.IndexedSeq(prim, i)
  }
};
cljs.core.array_seq = function array_seq(array, i) {
  return cljs.core.prim_seq.call(null, array, i)
};
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__10132 = null;
  var G__10132__10133 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__10132__10134 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__10132 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10132__10133.call(this, array, f);
      case 3:
        return G__10132__10134.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10132
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__10136 = null;
  var G__10136__10137 = function(array, k) {
    return array[k]
  };
  var G__10136__10138 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__10136 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10136__10137.call(this, array, k);
      case 3:
        return G__10136__10138.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10136
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__10140 = null;
  var G__10140__10141 = function(array, n) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return null
    }
  };
  var G__10140__10142 = function(array, n, not_found) {
    if(cljs.core.truth_(n < array.length)) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__10140 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10140__10141.call(this, array, n);
      case 3:
        return G__10140__10142.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10140
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core._seq.call(null, coll)
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  var temp__3698__auto____10144 = cljs.core.seq.call(null, coll);
  if(cljs.core.truth_(temp__3698__auto____10144)) {
    var s__10145 = temp__3698__auto____10144;
    return cljs.core._first.call(null, s__10145)
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  return cljs.core._rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.next = function next(coll) {
  if(cljs.core.truth_(coll)) {
    return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__10146 = cljs.core.next.call(null, s);
      s = G__10146;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.ICounted["_"] = true;
cljs.core._count["_"] = function(x) {
  var s__10147 = cljs.core.seq.call(null, x);
  var n__10148 = 0;
  while(true) {
    if(cljs.core.truth_(s__10147)) {
      var G__10149 = cljs.core.next.call(null, s__10147);
      var G__10150 = n__10148 + 1;
      s__10147 = G__10149;
      n__10148 = G__10150;
      continue
    }else {
      return n__10148
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__10151 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__10152 = function() {
    var G__10154__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__10155 = conj.call(null, coll, x);
          var G__10156 = cljs.core.first.call(null, xs);
          var G__10157 = cljs.core.next.call(null, xs);
          coll = G__10155;
          x = G__10156;
          xs = G__10157;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__10154 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10154__delegate.call(this, coll, x, xs)
    };
    G__10154.cljs$lang$maxFixedArity = 2;
    G__10154.cljs$lang$applyTo = function(arglist__10158) {
      var coll = cljs.core.first(arglist__10158);
      var x = cljs.core.first(cljs.core.next(arglist__10158));
      var xs = cljs.core.rest(cljs.core.next(arglist__10158));
      return G__10154__delegate.call(this, coll, x, xs)
    };
    return G__10154
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__10151.call(this, coll, x);
      default:
        return conj__10152.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__10152.cljs$lang$applyTo;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.count = function count(coll) {
  return cljs.core._count.call(null, coll)
};
cljs.core.nth = function() {
  var nth = null;
  var nth__10159 = function(coll, n) {
    return cljs.core._nth.call(null, coll, Math.floor(n))
  };
  var nth__10160 = function(coll, n, not_found) {
    return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__10159.call(this, coll, n);
      case 3:
        return nth__10160.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__10162 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__10163 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__10162.call(this, o, k);
      case 3:
        return get__10163.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__10166 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__10167 = function() {
    var G__10169__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__10165 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__10170 = ret__10165;
          var G__10171 = cljs.core.first.call(null, kvs);
          var G__10172 = cljs.core.second.call(null, kvs);
          var G__10173 = cljs.core.nnext.call(null, kvs);
          coll = G__10170;
          k = G__10171;
          v = G__10172;
          kvs = G__10173;
          continue
        }else {
          return ret__10165
        }
        break
      }
    };
    var G__10169 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10169__delegate.call(this, coll, k, v, kvs)
    };
    G__10169.cljs$lang$maxFixedArity = 3;
    G__10169.cljs$lang$applyTo = function(arglist__10174) {
      var coll = cljs.core.first(arglist__10174);
      var k = cljs.core.first(cljs.core.next(arglist__10174));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10174)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10174)));
      return G__10169__delegate.call(this, coll, k, v, kvs)
    };
    return G__10169
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__10166.call(this, coll, k, v);
      default:
        return assoc__10167.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__10167.cljs$lang$applyTo;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__10176 = function(coll) {
    return coll
  };
  var dissoc__10177 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__10178 = function() {
    var G__10180__delegate = function(coll, k, ks) {
      while(true) {
        var ret__10175 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__10181 = ret__10175;
          var G__10182 = cljs.core.first.call(null, ks);
          var G__10183 = cljs.core.next.call(null, ks);
          coll = G__10181;
          k = G__10182;
          ks = G__10183;
          continue
        }else {
          return ret__10175
        }
        break
      }
    };
    var G__10180 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10180__delegate.call(this, coll, k, ks)
    };
    G__10180.cljs$lang$maxFixedArity = 2;
    G__10180.cljs$lang$applyTo = function(arglist__10184) {
      var coll = cljs.core.first(arglist__10184);
      var k = cljs.core.first(cljs.core.next(arglist__10184));
      var ks = cljs.core.rest(cljs.core.next(arglist__10184));
      return G__10180__delegate.call(this, coll, k, ks)
    };
    return G__10180
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__10176.call(this, coll);
      case 2:
        return dissoc__10177.call(this, coll, k);
      default:
        return dissoc__10178.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__10178.cljs$lang$applyTo;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(cljs.core.truth_(function() {
    var x__450__auto____10185 = o;
    if(cljs.core.truth_(function() {
      var and__3546__auto____10186 = x__450__auto____10185;
      if(cljs.core.truth_(and__3546__auto____10186)) {
        var and__3546__auto____10187 = x__450__auto____10185.cljs$core$IMeta$;
        if(cljs.core.truth_(and__3546__auto____10187)) {
          return cljs.core.not.call(null, x__450__auto____10185.hasOwnProperty("cljs$core$IMeta$"))
        }else {
          return and__3546__auto____10187
        }
      }else {
        return and__3546__auto____10186
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____10185)
    }
  }())) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__10189 = function(coll) {
    return coll
  };
  var disj__10190 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__10191 = function() {
    var G__10193__delegate = function(coll, k, ks) {
      while(true) {
        var ret__10188 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__10194 = ret__10188;
          var G__10195 = cljs.core.first.call(null, ks);
          var G__10196 = cljs.core.next.call(null, ks);
          coll = G__10194;
          k = G__10195;
          ks = G__10196;
          continue
        }else {
          return ret__10188
        }
        break
      }
    };
    var G__10193 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10193__delegate.call(this, coll, k, ks)
    };
    G__10193.cljs$lang$maxFixedArity = 2;
    G__10193.cljs$lang$applyTo = function(arglist__10197) {
      var coll = cljs.core.first(arglist__10197);
      var k = cljs.core.first(cljs.core.next(arglist__10197));
      var ks = cljs.core.rest(cljs.core.next(arglist__10197));
      return G__10193__delegate.call(this, coll, k, ks)
    };
    return G__10193
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__10189.call(this, coll);
      case 2:
        return disj__10190.call(this, coll, k);
      default:
        return disj__10191.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__10191.cljs$lang$applyTo;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____10198 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____10199 = x__450__auto____10198;
      if(cljs.core.truth_(and__3546__auto____10199)) {
        var and__3546__auto____10200 = x__450__auto____10198.cljs$core$ICollection$;
        if(cljs.core.truth_(and__3546__auto____10200)) {
          return cljs.core.not.call(null, x__450__auto____10198.hasOwnProperty("cljs$core$ICollection$"))
        }else {
          return and__3546__auto____10200
        }
      }else {
        return and__3546__auto____10199
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, x__450__auto____10198)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____10201 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____10202 = x__450__auto____10201;
      if(cljs.core.truth_(and__3546__auto____10202)) {
        var and__3546__auto____10203 = x__450__auto____10201.cljs$core$ISet$;
        if(cljs.core.truth_(and__3546__auto____10203)) {
          return cljs.core.not.call(null, x__450__auto____10201.hasOwnProperty("cljs$core$ISet$"))
        }else {
          return and__3546__auto____10203
        }
      }else {
        return and__3546__auto____10202
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, x__450__auto____10201)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var x__450__auto____10204 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____10205 = x__450__auto____10204;
    if(cljs.core.truth_(and__3546__auto____10205)) {
      var and__3546__auto____10206 = x__450__auto____10204.cljs$core$IAssociative$;
      if(cljs.core.truth_(and__3546__auto____10206)) {
        return cljs.core.not.call(null, x__450__auto____10204.hasOwnProperty("cljs$core$IAssociative$"))
      }else {
        return and__3546__auto____10206
      }
    }else {
      return and__3546__auto____10205
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, x__450__auto____10204)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var x__450__auto____10207 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____10208 = x__450__auto____10207;
    if(cljs.core.truth_(and__3546__auto____10208)) {
      var and__3546__auto____10209 = x__450__auto____10207.cljs$core$ISequential$;
      if(cljs.core.truth_(and__3546__auto____10209)) {
        return cljs.core.not.call(null, x__450__auto____10207.hasOwnProperty("cljs$core$ISequential$"))
      }else {
        return and__3546__auto____10209
      }
    }else {
      return and__3546__auto____10208
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, x__450__auto____10207)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var x__450__auto____10210 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____10211 = x__450__auto____10210;
    if(cljs.core.truth_(and__3546__auto____10211)) {
      var and__3546__auto____10212 = x__450__auto____10210.cljs$core$ICounted$;
      if(cljs.core.truth_(and__3546__auto____10212)) {
        return cljs.core.not.call(null, x__450__auto____10210.hasOwnProperty("cljs$core$ICounted$"))
      }else {
        return and__3546__auto____10212
      }
    }else {
      return and__3546__auto____10211
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, x__450__auto____10210)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(cljs.core.truth_(x === null)) {
    return false
  }else {
    var x__450__auto____10213 = x;
    if(cljs.core.truth_(function() {
      var and__3546__auto____10214 = x__450__auto____10213;
      if(cljs.core.truth_(and__3546__auto____10214)) {
        var and__3546__auto____10215 = x__450__auto____10213.cljs$core$IMap$;
        if(cljs.core.truth_(and__3546__auto____10215)) {
          return cljs.core.not.call(null, x__450__auto____10213.hasOwnProperty("cljs$core$IMap$"))
        }else {
          return and__3546__auto____10215
        }
      }else {
        return and__3546__auto____10214
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, x__450__auto____10213)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var x__450__auto____10216 = x;
  if(cljs.core.truth_(function() {
    var and__3546__auto____10217 = x__450__auto____10216;
    if(cljs.core.truth_(and__3546__auto____10217)) {
      var and__3546__auto____10218 = x__450__auto____10216.cljs$core$IVector$;
      if(cljs.core.truth_(and__3546__auto____10218)) {
        return cljs.core.not.call(null, x__450__auto____10216.hasOwnProperty("cljs$core$IVector$"))
      }else {
        return and__3546__auto____10218
      }
    }else {
      return and__3546__auto____10217
    }
  }())) {
    return true
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, x__450__auto____10216)
  }
};
cljs.core.js_obj = function js_obj() {
  return{}
};
cljs.core.js_keys = function js_keys(obj) {
  var keys__10219 = cljs.core.array.call(null);
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__10219.push(key)
  });
  return keys__10219
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.lookup_sentinel = cljs.core.js_obj.call(null);
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(cljs.core.truth_(s === null)) {
    return false
  }else {
    var x__450__auto____10220 = s;
    if(cljs.core.truth_(function() {
      var and__3546__auto____10221 = x__450__auto____10220;
      if(cljs.core.truth_(and__3546__auto____10221)) {
        var and__3546__auto____10222 = x__450__auto____10220.cljs$core$ISeq$;
        if(cljs.core.truth_(and__3546__auto____10222)) {
          return cljs.core.not.call(null, x__450__auto____10220.hasOwnProperty("cljs$core$ISeq$"))
        }else {
          return and__3546__auto____10222
        }
      }else {
        return and__3546__auto____10221
      }
    }())) {
      return true
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, x__450__auto____10220)
    }
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____10223 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____10223)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____10224 = cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0");
      if(cljs.core.truth_(or__3548__auto____10224)) {
        return or__3548__auto____10224
      }else {
        return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
      }
    }())
  }else {
    return and__3546__auto____10223
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____10225 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____10225)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd0")
  }else {
    return and__3546__auto____10225
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____10226 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____10226)) {
    return cljs.core._EQ_.call(null, x.charAt(0), "\ufdd1")
  }else {
    return and__3546__auto____10226
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____10227 = cljs.core.number_QMARK_.call(null, n);
  if(cljs.core.truth_(and__3546__auto____10227)) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____10227
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core.truth_(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____10228 = coll;
    if(cljs.core.truth_(and__3546__auto____10228)) {
      var and__3546__auto____10229 = cljs.core.associative_QMARK_.call(null, coll);
      if(cljs.core.truth_(and__3546__auto____10229)) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____10229
      }
    }else {
      return and__3546__auto____10228
    }
  }())) {
    return cljs.core.Vector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___10234 = function(x) {
    return true
  };
  var distinct_QMARK___10235 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___10236 = function() {
    var G__10238__delegate = function(x, y, more) {
      if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y)))) {
        var s__10230 = cljs.core.set([y, x]);
        var xs__10231 = more;
        while(true) {
          var x__10232 = cljs.core.first.call(null, xs__10231);
          var etc__10233 = cljs.core.next.call(null, xs__10231);
          if(cljs.core.truth_(xs__10231)) {
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, s__10230, x__10232))) {
              return false
            }else {
              var G__10239 = cljs.core.conj.call(null, s__10230, x__10232);
              var G__10240 = etc__10233;
              s__10230 = G__10239;
              xs__10231 = G__10240;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__10238 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10238__delegate.call(this, x, y, more)
    };
    G__10238.cljs$lang$maxFixedArity = 2;
    G__10238.cljs$lang$applyTo = function(arglist__10241) {
      var x = cljs.core.first(arglist__10241);
      var y = cljs.core.first(cljs.core.next(arglist__10241));
      var more = cljs.core.rest(cljs.core.next(arglist__10241));
      return G__10238__delegate.call(this, x, y, more)
    };
    return G__10238
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___10234.call(this, x);
      case 2:
        return distinct_QMARK___10235.call(this, x, y);
      default:
        return distinct_QMARK___10236.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___10236.cljs$lang$applyTo;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  return goog.array.defaultCompare.call(null, x, y)
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, f, cljs.core.compare))) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__10242 = f.call(null, x, y);
      if(cljs.core.truth_(cljs.core.number_QMARK_.call(null, r__10242))) {
        return r__10242
      }else {
        if(cljs.core.truth_(r__10242)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__10244 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__10245 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__10243 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__10243, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__10243)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__10244.call(this, comp);
      case 2:
        return sort__10245.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__10247 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__10248 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__10247.call(this, keyfn, comp);
      case 3:
        return sort_by__10248.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return sort_by
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__10250 = function(f, coll) {
    return cljs.core._reduce.call(null, coll, f)
  };
  var reduce__10251 = function(f, val, coll) {
    return cljs.core._reduce.call(null, coll, f, val)
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__10250.call(this, f, val);
      case 3:
        return reduce__10251.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reduce
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__10257 = function(f, coll) {
    var temp__3695__auto____10253 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____10253)) {
      var s__10254 = temp__3695__auto____10253;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__10254), cljs.core.next.call(null, s__10254))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__10258 = function(f, val, coll) {
    var val__10255 = val;
    var coll__10256 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__10256)) {
        var G__10260 = f.call(null, val__10255, cljs.core.first.call(null, coll__10256));
        var G__10261 = cljs.core.next.call(null, coll__10256);
        val__10255 = G__10260;
        coll__10256 = G__10261;
        continue
      }else {
        return val__10255
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__10257.call(this, f, val);
      case 3:
        return seq_reduce__10258.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return seq_reduce
}();
cljs.core.IReduce["_"] = true;
cljs.core._reduce["_"] = function() {
  var G__10262 = null;
  var G__10262__10263 = function(coll, f) {
    return cljs.core.seq_reduce.call(null, f, coll)
  };
  var G__10262__10264 = function(coll, f, start) {
    return cljs.core.seq_reduce.call(null, f, start, coll)
  };
  G__10262 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10262__10263.call(this, coll, f);
      case 3:
        return G__10262__10264.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10262
}();
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___10266 = function() {
    return 0
  };
  var _PLUS___10267 = function(x) {
    return x
  };
  var _PLUS___10268 = function(x, y) {
    return x + y
  };
  var _PLUS___10269 = function() {
    var G__10271__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__10271 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10271__delegate.call(this, x, y, more)
    };
    G__10271.cljs$lang$maxFixedArity = 2;
    G__10271.cljs$lang$applyTo = function(arglist__10272) {
      var x = cljs.core.first(arglist__10272);
      var y = cljs.core.first(cljs.core.next(arglist__10272));
      var more = cljs.core.rest(cljs.core.next(arglist__10272));
      return G__10271__delegate.call(this, x, y, more)
    };
    return G__10271
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___10266.call(this);
      case 1:
        return _PLUS___10267.call(this, x);
      case 2:
        return _PLUS___10268.call(this, x, y);
      default:
        return _PLUS___10269.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___10269.cljs$lang$applyTo;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___10273 = function(x) {
    return-x
  };
  var ___10274 = function(x, y) {
    return x - y
  };
  var ___10275 = function() {
    var G__10277__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__10277 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10277__delegate.call(this, x, y, more)
    };
    G__10277.cljs$lang$maxFixedArity = 2;
    G__10277.cljs$lang$applyTo = function(arglist__10278) {
      var x = cljs.core.first(arglist__10278);
      var y = cljs.core.first(cljs.core.next(arglist__10278));
      var more = cljs.core.rest(cljs.core.next(arglist__10278));
      return G__10277__delegate.call(this, x, y, more)
    };
    return G__10277
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___10273.call(this, x);
      case 2:
        return ___10274.call(this, x, y);
      default:
        return ___10275.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___10275.cljs$lang$applyTo;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___10279 = function() {
    return 1
  };
  var _STAR___10280 = function(x) {
    return x
  };
  var _STAR___10281 = function(x, y) {
    return x * y
  };
  var _STAR___10282 = function() {
    var G__10284__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__10284 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10284__delegate.call(this, x, y, more)
    };
    G__10284.cljs$lang$maxFixedArity = 2;
    G__10284.cljs$lang$applyTo = function(arglist__10285) {
      var x = cljs.core.first(arglist__10285);
      var y = cljs.core.first(cljs.core.next(arglist__10285));
      var more = cljs.core.rest(cljs.core.next(arglist__10285));
      return G__10284__delegate.call(this, x, y, more)
    };
    return G__10284
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___10279.call(this);
      case 1:
        return _STAR___10280.call(this, x);
      case 2:
        return _STAR___10281.call(this, x, y);
      default:
        return _STAR___10282.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___10282.cljs$lang$applyTo;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___10286 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___10287 = function(x, y) {
    return x / y
  };
  var _SLASH___10288 = function() {
    var G__10290__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__10290 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10290__delegate.call(this, x, y, more)
    };
    G__10290.cljs$lang$maxFixedArity = 2;
    G__10290.cljs$lang$applyTo = function(arglist__10291) {
      var x = cljs.core.first(arglist__10291);
      var y = cljs.core.first(cljs.core.next(arglist__10291));
      var more = cljs.core.rest(cljs.core.next(arglist__10291));
      return G__10290__delegate.call(this, x, y, more)
    };
    return G__10290
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___10286.call(this, x);
      case 2:
        return _SLASH___10287.call(this, x, y);
      default:
        return _SLASH___10288.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___10288.cljs$lang$applyTo;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___10292 = function(x) {
    return true
  };
  var _LT___10293 = function(x, y) {
    return x < y
  };
  var _LT___10294 = function() {
    var G__10296__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x < y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__10297 = y;
            var G__10298 = cljs.core.first.call(null, more);
            var G__10299 = cljs.core.next.call(null, more);
            x = G__10297;
            y = G__10298;
            more = G__10299;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__10296 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10296__delegate.call(this, x, y, more)
    };
    G__10296.cljs$lang$maxFixedArity = 2;
    G__10296.cljs$lang$applyTo = function(arglist__10300) {
      var x = cljs.core.first(arglist__10300);
      var y = cljs.core.first(cljs.core.next(arglist__10300));
      var more = cljs.core.rest(cljs.core.next(arglist__10300));
      return G__10296__delegate.call(this, x, y, more)
    };
    return G__10296
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___10292.call(this, x);
      case 2:
        return _LT___10293.call(this, x, y);
      default:
        return _LT___10294.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___10294.cljs$lang$applyTo;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___10301 = function(x) {
    return true
  };
  var _LT__EQ___10302 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___10303 = function() {
    var G__10305__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x <= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__10306 = y;
            var G__10307 = cljs.core.first.call(null, more);
            var G__10308 = cljs.core.next.call(null, more);
            x = G__10306;
            y = G__10307;
            more = G__10308;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__10305 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10305__delegate.call(this, x, y, more)
    };
    G__10305.cljs$lang$maxFixedArity = 2;
    G__10305.cljs$lang$applyTo = function(arglist__10309) {
      var x = cljs.core.first(arglist__10309);
      var y = cljs.core.first(cljs.core.next(arglist__10309));
      var more = cljs.core.rest(cljs.core.next(arglist__10309));
      return G__10305__delegate.call(this, x, y, more)
    };
    return G__10305
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___10301.call(this, x);
      case 2:
        return _LT__EQ___10302.call(this, x, y);
      default:
        return _LT__EQ___10303.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___10303.cljs$lang$applyTo;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___10310 = function(x) {
    return true
  };
  var _GT___10311 = function(x, y) {
    return x > y
  };
  var _GT___10312 = function() {
    var G__10314__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x > y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__10315 = y;
            var G__10316 = cljs.core.first.call(null, more);
            var G__10317 = cljs.core.next.call(null, more);
            x = G__10315;
            y = G__10316;
            more = G__10317;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__10314 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10314__delegate.call(this, x, y, more)
    };
    G__10314.cljs$lang$maxFixedArity = 2;
    G__10314.cljs$lang$applyTo = function(arglist__10318) {
      var x = cljs.core.first(arglist__10318);
      var y = cljs.core.first(cljs.core.next(arglist__10318));
      var more = cljs.core.rest(cljs.core.next(arglist__10318));
      return G__10314__delegate.call(this, x, y, more)
    };
    return G__10314
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___10310.call(this, x);
      case 2:
        return _GT___10311.call(this, x, y);
      default:
        return _GT___10312.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___10312.cljs$lang$applyTo;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___10319 = function(x) {
    return true
  };
  var _GT__EQ___10320 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___10321 = function() {
    var G__10323__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(x >= y)) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__10324 = y;
            var G__10325 = cljs.core.first.call(null, more);
            var G__10326 = cljs.core.next.call(null, more);
            x = G__10324;
            y = G__10325;
            more = G__10326;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__10323 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10323__delegate.call(this, x, y, more)
    };
    G__10323.cljs$lang$maxFixedArity = 2;
    G__10323.cljs$lang$applyTo = function(arglist__10327) {
      var x = cljs.core.first(arglist__10327);
      var y = cljs.core.first(cljs.core.next(arglist__10327));
      var more = cljs.core.rest(cljs.core.next(arglist__10327));
      return G__10323__delegate.call(this, x, y, more)
    };
    return G__10323
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___10319.call(this, x);
      case 2:
        return _GT__EQ___10320.call(this, x, y);
      default:
        return _GT__EQ___10321.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___10321.cljs$lang$applyTo;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__10328 = function(x) {
    return x
  };
  var max__10329 = function(x, y) {
    return x > y ? x : y
  };
  var max__10330 = function() {
    var G__10332__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__10332 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10332__delegate.call(this, x, y, more)
    };
    G__10332.cljs$lang$maxFixedArity = 2;
    G__10332.cljs$lang$applyTo = function(arglist__10333) {
      var x = cljs.core.first(arglist__10333);
      var y = cljs.core.first(cljs.core.next(arglist__10333));
      var more = cljs.core.rest(cljs.core.next(arglist__10333));
      return G__10332__delegate.call(this, x, y, more)
    };
    return G__10332
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__10328.call(this, x);
      case 2:
        return max__10329.call(this, x, y);
      default:
        return max__10330.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__10330.cljs$lang$applyTo;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__10334 = function(x) {
    return x
  };
  var min__10335 = function(x, y) {
    return x < y ? x : y
  };
  var min__10336 = function() {
    var G__10338__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__10338 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10338__delegate.call(this, x, y, more)
    };
    G__10338.cljs$lang$maxFixedArity = 2;
    G__10338.cljs$lang$applyTo = function(arglist__10339) {
      var x = cljs.core.first(arglist__10339);
      var y = cljs.core.first(cljs.core.next(arglist__10339));
      var more = cljs.core.rest(cljs.core.next(arglist__10339));
      return G__10338__delegate.call(this, x, y, more)
    };
    return G__10338
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__10334.call(this, x);
      case 2:
        return min__10335.call(this, x, y);
      default:
        return min__10336.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__10336.cljs$lang$applyTo;
  return min
}();
cljs.core.fix = function fix(q) {
  if(cljs.core.truth_(q >= 0)) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__10340 = n % d;
  return cljs.core.fix.call(null, (n - rem__10340) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__10341 = cljs.core.quot.call(null, n, d);
  return n - d * q__10341
};
cljs.core.rand = function() {
  var rand = null;
  var rand__10342 = function() {
    return Math.random.call(null)
  };
  var rand__10343 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__10342.call(this);
      case 1:
        return rand__10343.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___10345 = function(x) {
    return true
  };
  var _EQ__EQ___10346 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___10347 = function() {
    var G__10349__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__10350 = y;
            var G__10351 = cljs.core.first.call(null, more);
            var G__10352 = cljs.core.next.call(null, more);
            x = G__10350;
            y = G__10351;
            more = G__10352;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__10349 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10349__delegate.call(this, x, y, more)
    };
    G__10349.cljs$lang$maxFixedArity = 2;
    G__10349.cljs$lang$applyTo = function(arglist__10353) {
      var x = cljs.core.first(arglist__10353);
      var y = cljs.core.first(cljs.core.next(arglist__10353));
      var more = cljs.core.rest(cljs.core.next(arglist__10353));
      return G__10349__delegate.call(this, x, y, more)
    };
    return G__10349
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___10345.call(this, x);
      case 2:
        return _EQ__EQ___10346.call(this, x, y);
      default:
        return _EQ__EQ___10347.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___10347.cljs$lang$applyTo;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__10354 = n;
  var xs__10355 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____10356 = xs__10355;
      if(cljs.core.truth_(and__3546__auto____10356)) {
        return n__10354 > 0
      }else {
        return and__3546__auto____10356
      }
    }())) {
      var G__10357 = n__10354 - 1;
      var G__10358 = cljs.core.next.call(null, xs__10355);
      n__10354 = G__10357;
      xs__10355 = G__10358;
      continue
    }else {
      return xs__10355
    }
    break
  }
};
cljs.core.IIndexed["_"] = true;
cljs.core._nth["_"] = function() {
  var G__10363 = null;
  var G__10363__10364 = function(coll, n) {
    var temp__3695__auto____10359 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____10359)) {
      var xs__10360 = temp__3695__auto____10359;
      return cljs.core.first.call(null, xs__10360)
    }else {
      throw new Error("Index out of bounds");
    }
  };
  var G__10363__10365 = function(coll, n, not_found) {
    var temp__3695__auto____10361 = cljs.core.nthnext.call(null, coll, n);
    if(cljs.core.truth_(temp__3695__auto____10361)) {
      var xs__10362 = temp__3695__auto____10361;
      return cljs.core.first.call(null, xs__10362)
    }else {
      return not_found
    }
  };
  G__10363 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10363__10364.call(this, coll, n);
      case 3:
        return G__10363__10365.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10363
}();
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___10367 = function() {
    return""
  };
  var str_STAR___10368 = function(x) {
    if(cljs.core.truth_(x === null)) {
      return""
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___10369 = function() {
    var G__10371__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__10372 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__10373 = cljs.core.next.call(null, more);
            sb = G__10372;
            more = G__10373;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__10371 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10371__delegate.call(this, x, ys)
    };
    G__10371.cljs$lang$maxFixedArity = 1;
    G__10371.cljs$lang$applyTo = function(arglist__10374) {
      var x = cljs.core.first(arglist__10374);
      var ys = cljs.core.rest(arglist__10374);
      return G__10371__delegate.call(this, x, ys)
    };
    return G__10371
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___10367.call(this);
      case 1:
        return str_STAR___10368.call(this, x);
      default:
        return str_STAR___10369.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___10369.cljs$lang$applyTo;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__10375 = function() {
    return""
  };
  var str__10376 = function(x) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, x))) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, x))) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(cljs.core.truth_(x === null)) {
          return""
        }else {
          if(cljs.core.truth_("\ufdd0'else")) {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__10377 = function() {
    var G__10379__delegate = function(x, ys) {
      return cljs.core.apply.call(null, cljs.core.str_STAR_, x, ys)
    };
    var G__10379 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__10379__delegate.call(this, x, ys)
    };
    G__10379.cljs$lang$maxFixedArity = 1;
    G__10379.cljs$lang$applyTo = function(arglist__10380) {
      var x = cljs.core.first(arglist__10380);
      var ys = cljs.core.rest(arglist__10380);
      return G__10379__delegate.call(this, x, ys)
    };
    return G__10379
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__10375.call(this);
      case 1:
        return str__10376.call(this, x);
      default:
        return str__10377.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__10377.cljs$lang$applyTo;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__10381 = function(s, start) {
    return s.substring(start)
  };
  var subs__10382 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__10381.call(this, s, start);
      case 3:
        return subs__10382.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__10384 = function(name) {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
      name
    }else {
      if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__10385 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__10384.call(this, ns);
      case 2:
        return symbol__10385.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__10387 = function(name) {
    if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, name))) {
      return name
    }else {
      if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, name))) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__10388 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__10387.call(this, ns);
      case 2:
        return keyword__10388.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.sequential_QMARK_.call(null, y)) ? function() {
    var xs__10390 = cljs.core.seq.call(null, x);
    var ys__10391 = cljs.core.seq.call(null, y);
    while(true) {
      if(cljs.core.truth_(xs__10390 === null)) {
        return ys__10391 === null
      }else {
        if(cljs.core.truth_(ys__10391 === null)) {
          return false
        }else {
          if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__10390), cljs.core.first.call(null, ys__10391)))) {
            var G__10392 = cljs.core.next.call(null, xs__10390);
            var G__10393 = cljs.core.next.call(null, ys__10391);
            xs__10390 = G__10392;
            ys__10391 = G__10393;
            continue
          }else {
            if(cljs.core.truth_("\ufdd0'else")) {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__10394_SHARP_, p2__10395_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__10394_SHARP_, cljs.core.hash.call(null, p2__10395_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__10396__10397 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__10396__10397)) {
    var G__10399__10401 = cljs.core.first.call(null, G__10396__10397);
    var vec__10400__10402 = G__10399__10401;
    var key_name__10403 = cljs.core.nth.call(null, vec__10400__10402, 0, null);
    var f__10404 = cljs.core.nth.call(null, vec__10400__10402, 1, null);
    var G__10396__10405 = G__10396__10397;
    var G__10399__10406 = G__10399__10401;
    var G__10396__10407 = G__10396__10405;
    while(true) {
      var vec__10408__10409 = G__10399__10406;
      var key_name__10410 = cljs.core.nth.call(null, vec__10408__10409, 0, null);
      var f__10411 = cljs.core.nth.call(null, vec__10408__10409, 1, null);
      var G__10396__10412 = G__10396__10407;
      var str_name__10413 = cljs.core.name.call(null, key_name__10410);
      obj[str_name__10413] = f__10411;
      var temp__3698__auto____10414 = cljs.core.next.call(null, G__10396__10412);
      if(cljs.core.truth_(temp__3698__auto____10414)) {
        var G__10396__10415 = temp__3698__auto____10414;
        var G__10416 = cljs.core.first.call(null, G__10396__10415);
        var G__10417 = G__10396__10415;
        G__10399__10406 = G__10416;
        G__10396__10407 = G__10417;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count
};
cljs.core.List.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__10418 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__10419 = this;
  return new cljs.core.List(this__10419.meta, o, coll, this__10419.count + 1)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__10420 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__10421 = this;
  return this__10421.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__10422 = this;
  return this__10422.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__10423 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__10424 = this;
  return this__10424.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__10425 = this;
  return this__10425.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__10426 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__10427 = this;
  return new cljs.core.List(meta, this__10427.first, this__10427.rest, this__10427.count)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__10428 = this;
  return this__10428.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__10429 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta
};
cljs.core.EmptyList.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__10430 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__10431 = this;
  return new cljs.core.List(this__10431.meta, o, null, 1)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__10432 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__10433 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__10434 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__10435 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__10436 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__10437 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__10438 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__10439 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__10440 = this;
  return this__10440.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__10441 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__10442) {
    var items = cljs.core.seq(arglist__10442);
    return list__delegate.call(this, items)
  };
  return list
}();
cljs.core.Cons = function(meta, first, rest) {
  this.meta = meta;
  this.first = first;
  this.rest = rest
};
cljs.core.Cons.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__10443 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__10444 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__10445 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__10446 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10446.meta)
};
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__10447 = this;
  return new cljs.core.Cons(null, o, coll)
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__10448 = this;
  return this__10448.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__10449 = this;
  if(cljs.core.truth_(this__10449.rest === null)) {
    return cljs.core.List.EMPTY
  }else {
    return this__10449.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__10450 = this;
  return this__10450.meta
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__10451 = this;
  return new cljs.core.Cons(meta, this__10451.first, this__10451.rest)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, seq) {
  return new cljs.core.Cons(null, x, seq)
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__10452 = null;
  var G__10452__10453 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__10452__10454 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__10452 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10452__10453.call(this, string, f);
      case 3:
        return G__10452__10454.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10452
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__10456 = null;
  var G__10456__10457 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__10456__10458 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__10456 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10456__10457.call(this, string, k);
      case 3:
        return G__10456__10458.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10456
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__10460 = null;
  var G__10460__10461 = function(string, n) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__10460__10462 = function(string, n, not_found) {
    if(cljs.core.truth_(n < cljs.core._count.call(null, string))) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__10460 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10460__10461.call(this, string, n);
      case 3:
        return G__10460__10462.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10460
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__10470 = null;
  var G__10470__10471 = function(tsym10464, coll) {
    var tsym10464__10466 = this;
    var this$__10467 = tsym10464__10466;
    return cljs.core.get.call(null, coll, this$__10467.toString())
  };
  var G__10470__10472 = function(tsym10465, coll, not_found) {
    var tsym10465__10468 = this;
    var this$__10469 = tsym10465__10468;
    return cljs.core.get.call(null, coll, this$__10469.toString(), not_found)
  };
  G__10470 = function(tsym10465, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10470__10471.call(this, tsym10465, coll);
      case 3:
        return G__10470__10472.call(this, tsym10465, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10470
}();
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.truth_(cljs.core.count.call(null, args) < 2)) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__10474 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__10474
  }else {
    lazy_seq.x = x__10474.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x) {
  this.meta = meta;
  this.realized = realized;
  this.x = x
};
cljs.core.LazySeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__10475 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__10476 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__10477 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__10478 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__10478.meta)
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__10479 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__10480 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__10481 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__10482 = this;
  return this__10482.meta
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__10483 = this;
  return new cljs.core.LazySeq(meta, this__10483.realized, this__10483.x)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__10484 = cljs.core.array.call(null);
  var s__10485 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__10485))) {
      ary__10484.push(cljs.core.first.call(null, s__10485));
      var G__10486 = cljs.core.next.call(null, s__10485);
      s__10485 = G__10486;
      continue
    }else {
      return ary__10484
    }
    break
  }
};
cljs.core.bounded_count = function bounded_count(s, n) {
  var s__10487 = s;
  var i__10488 = n;
  var sum__10489 = 0;
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____10490 = i__10488 > 0;
      if(cljs.core.truth_(and__3546__auto____10490)) {
        return cljs.core.seq.call(null, s__10487)
      }else {
        return and__3546__auto____10490
      }
    }())) {
      var G__10491 = cljs.core.next.call(null, s__10487);
      var G__10492 = i__10488 - 1;
      var G__10493 = sum__10489 + 1;
      s__10487 = G__10491;
      i__10488 = G__10492;
      sum__10489 = G__10493;
      continue
    }else {
      return sum__10489
    }
    break
  }
};
cljs.core.spread = function spread(arglist) {
  if(cljs.core.truth_(arglist === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core.next.call(null, arglist) === null)) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__10497 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__10498 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__10499 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__10494 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__10494)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10494), concat.call(null, cljs.core.rest.call(null, s__10494), y))
      }else {
        return y
      }
    })
  };
  var concat__10500 = function() {
    var G__10502__delegate = function(x, y, zs) {
      var cat__10496 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__10495 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__10495)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__10495), cat.call(null, cljs.core.rest.call(null, xys__10495), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__10496.call(null, concat.call(null, x, y), zs)
    };
    var G__10502 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10502__delegate.call(this, x, y, zs)
    };
    G__10502.cljs$lang$maxFixedArity = 2;
    G__10502.cljs$lang$applyTo = function(arglist__10503) {
      var x = cljs.core.first(arglist__10503);
      var y = cljs.core.first(cljs.core.next(arglist__10503));
      var zs = cljs.core.rest(cljs.core.next(arglist__10503));
      return G__10502__delegate.call(this, x, y, zs)
    };
    return G__10502
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__10497.call(this);
      case 1:
        return concat__10498.call(this, x);
      case 2:
        return concat__10499.call(this, x, y);
      default:
        return concat__10500.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__10500.cljs$lang$applyTo;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___10504 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___10505 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___10506 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___10507 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___10508 = function() {
    var G__10510__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__10510 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__10510__delegate.call(this, a, b, c, d, more)
    };
    G__10510.cljs$lang$maxFixedArity = 4;
    G__10510.cljs$lang$applyTo = function(arglist__10511) {
      var a = cljs.core.first(arglist__10511);
      var b = cljs.core.first(cljs.core.next(arglist__10511));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10511)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10511))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10511))));
      return G__10510__delegate.call(this, a, b, c, d, more)
    };
    return G__10510
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___10504.call(this, a);
      case 2:
        return list_STAR___10505.call(this, a, b);
      case 3:
        return list_STAR___10506.call(this, a, b, c);
      case 4:
        return list_STAR___10507.call(this, a, b, c, d);
      default:
        return list_STAR___10508.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___10508.cljs$lang$applyTo;
  return list_STAR_
}();
cljs.core.apply = function() {
  var apply = null;
  var apply__10521 = function(f, args) {
    var fixed_arity__10512 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, args, fixed_arity__10512 + 1) <= fixed_arity__10512)) {
        return f.apply(f, cljs.core.to_array.call(null, args))
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__10522 = function(f, x, args) {
    var arglist__10513 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__10514 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__10513, fixed_arity__10514) <= fixed_arity__10514)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__10513))
      }else {
        return f.cljs$lang$applyTo(arglist__10513)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__10513))
    }
  };
  var apply__10523 = function(f, x, y, args) {
    var arglist__10515 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__10516 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__10515, fixed_arity__10516) <= fixed_arity__10516)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__10515))
      }else {
        return f.cljs$lang$applyTo(arglist__10515)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__10515))
    }
  };
  var apply__10524 = function(f, x, y, z, args) {
    var arglist__10517 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__10518 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__10517, fixed_arity__10518) <= fixed_arity__10518)) {
        return f.apply(f, cljs.core.to_array.call(null, arglist__10517))
      }else {
        return f.cljs$lang$applyTo(arglist__10517)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__10517))
    }
  };
  var apply__10525 = function() {
    var G__10527__delegate = function(f, a, b, c, d, args) {
      var arglist__10519 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__10520 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        if(cljs.core.truth_(cljs.core.bounded_count.call(null, arglist__10519, fixed_arity__10520) <= fixed_arity__10520)) {
          return f.apply(f, cljs.core.to_array.call(null, arglist__10519))
        }else {
          return f.cljs$lang$applyTo(arglist__10519)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__10519))
      }
    };
    var G__10527 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__10527__delegate.call(this, f, a, b, c, d, args)
    };
    G__10527.cljs$lang$maxFixedArity = 5;
    G__10527.cljs$lang$applyTo = function(arglist__10528) {
      var f = cljs.core.first(arglist__10528);
      var a = cljs.core.first(cljs.core.next(arglist__10528));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10528)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10528))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10528)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10528)))));
      return G__10527__delegate.call(this, f, a, b, c, d, args)
    };
    return G__10527
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__10521.call(this, f, a);
      case 3:
        return apply__10522.call(this, f, a, b);
      case 4:
        return apply__10523.call(this, f, a, b, c);
      case 5:
        return apply__10524.call(this, f, a, b, c, d);
      default:
        return apply__10525.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__10525.cljs$lang$applyTo;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__10529) {
    var obj = cljs.core.first(arglist__10529);
    var f = cljs.core.first(cljs.core.next(arglist__10529));
    var args = cljs.core.rest(cljs.core.next(arglist__10529));
    return vary_meta__delegate.call(this, obj, f, args)
  };
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___10530 = function(x) {
    return false
  };
  var not_EQ___10531 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___10532 = function() {
    var G__10534__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__10534 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10534__delegate.call(this, x, y, more)
    };
    G__10534.cljs$lang$maxFixedArity = 2;
    G__10534.cljs$lang$applyTo = function(arglist__10535) {
      var x = cljs.core.first(arglist__10535);
      var y = cljs.core.first(cljs.core.next(arglist__10535));
      var more = cljs.core.rest(cljs.core.next(arglist__10535));
      return G__10534__delegate.call(this, x, y, more)
    };
    return G__10534
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___10530.call(this, x);
      case 2:
        return not_EQ___10531.call(this, x, y);
      default:
        return not_EQ___10532.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___10532.cljs$lang$applyTo;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll) === null)) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__10536 = pred;
        var G__10537 = cljs.core.next.call(null, coll);
        pred = G__10536;
        coll = G__10537;
        continue
      }else {
        if(cljs.core.truth_("\ufdd0'else")) {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____10538 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____10538)) {
        return or__3548__auto____10538
      }else {
        var G__10539 = pred;
        var G__10540 = cljs.core.next.call(null, coll);
        pred = G__10539;
        coll = G__10540;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.truth_(cljs.core.integer_QMARK_.call(null, n))) {
    return(n & 1) === 0
  }else {
    throw new Error(cljs.core.str.call(null, "Argument must be an integer: ", n));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__10541 = null;
    var G__10541__10542 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__10541__10543 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__10541__10544 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__10541__10545 = function() {
      var G__10547__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__10547 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__10547__delegate.call(this, x, y, zs)
      };
      G__10547.cljs$lang$maxFixedArity = 2;
      G__10547.cljs$lang$applyTo = function(arglist__10548) {
        var x = cljs.core.first(arglist__10548);
        var y = cljs.core.first(cljs.core.next(arglist__10548));
        var zs = cljs.core.rest(cljs.core.next(arglist__10548));
        return G__10547__delegate.call(this, x, y, zs)
      };
      return G__10547
    }();
    G__10541 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__10541__10542.call(this);
        case 1:
          return G__10541__10543.call(this, x);
        case 2:
          return G__10541__10544.call(this, x, y);
        default:
          return G__10541__10545.apply(this, arguments)
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__10541.cljs$lang$maxFixedArity = 2;
    G__10541.cljs$lang$applyTo = G__10541__10545.cljs$lang$applyTo;
    return G__10541
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__10549__delegate = function(args) {
      return x
    };
    var G__10549 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__10549__delegate.call(this, args)
    };
    G__10549.cljs$lang$maxFixedArity = 0;
    G__10549.cljs$lang$applyTo = function(arglist__10550) {
      var args = cljs.core.seq(arglist__10550);
      return G__10549__delegate.call(this, args)
    };
    return G__10549
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__10554 = function() {
    return cljs.core.identity
  };
  var comp__10555 = function(f) {
    return f
  };
  var comp__10556 = function(f, g) {
    return function() {
      var G__10560 = null;
      var G__10560__10561 = function() {
        return f.call(null, g.call(null))
      };
      var G__10560__10562 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__10560__10563 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__10560__10564 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__10560__10565 = function() {
        var G__10567__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__10567 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10567__delegate.call(this, x, y, z, args)
        };
        G__10567.cljs$lang$maxFixedArity = 3;
        G__10567.cljs$lang$applyTo = function(arglist__10568) {
          var x = cljs.core.first(arglist__10568);
          var y = cljs.core.first(cljs.core.next(arglist__10568));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10568)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10568)));
          return G__10567__delegate.call(this, x, y, z, args)
        };
        return G__10567
      }();
      G__10560 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10560__10561.call(this);
          case 1:
            return G__10560__10562.call(this, x);
          case 2:
            return G__10560__10563.call(this, x, y);
          case 3:
            return G__10560__10564.call(this, x, y, z);
          default:
            return G__10560__10565.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10560.cljs$lang$maxFixedArity = 3;
      G__10560.cljs$lang$applyTo = G__10560__10565.cljs$lang$applyTo;
      return G__10560
    }()
  };
  var comp__10557 = function(f, g, h) {
    return function() {
      var G__10569 = null;
      var G__10569__10570 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__10569__10571 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__10569__10572 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__10569__10573 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__10569__10574 = function() {
        var G__10576__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__10576 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10576__delegate.call(this, x, y, z, args)
        };
        G__10576.cljs$lang$maxFixedArity = 3;
        G__10576.cljs$lang$applyTo = function(arglist__10577) {
          var x = cljs.core.first(arglist__10577);
          var y = cljs.core.first(cljs.core.next(arglist__10577));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10577)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10577)));
          return G__10576__delegate.call(this, x, y, z, args)
        };
        return G__10576
      }();
      G__10569 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__10569__10570.call(this);
          case 1:
            return G__10569__10571.call(this, x);
          case 2:
            return G__10569__10572.call(this, x, y);
          case 3:
            return G__10569__10573.call(this, x, y, z);
          default:
            return G__10569__10574.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10569.cljs$lang$maxFixedArity = 3;
      G__10569.cljs$lang$applyTo = G__10569__10574.cljs$lang$applyTo;
      return G__10569
    }()
  };
  var comp__10558 = function() {
    var G__10578__delegate = function(f1, f2, f3, fs) {
      var fs__10551 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__10579__delegate = function(args) {
          var ret__10552 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__10551), args);
          var fs__10553 = cljs.core.next.call(null, fs__10551);
          while(true) {
            if(cljs.core.truth_(fs__10553)) {
              var G__10580 = cljs.core.first.call(null, fs__10553).call(null, ret__10552);
              var G__10581 = cljs.core.next.call(null, fs__10553);
              ret__10552 = G__10580;
              fs__10553 = G__10581;
              continue
            }else {
              return ret__10552
            }
            break
          }
        };
        var G__10579 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__10579__delegate.call(this, args)
        };
        G__10579.cljs$lang$maxFixedArity = 0;
        G__10579.cljs$lang$applyTo = function(arglist__10582) {
          var args = cljs.core.seq(arglist__10582);
          return G__10579__delegate.call(this, args)
        };
        return G__10579
      }()
    };
    var G__10578 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10578__delegate.call(this, f1, f2, f3, fs)
    };
    G__10578.cljs$lang$maxFixedArity = 3;
    G__10578.cljs$lang$applyTo = function(arglist__10583) {
      var f1 = cljs.core.first(arglist__10583);
      var f2 = cljs.core.first(cljs.core.next(arglist__10583));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10583)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10583)));
      return G__10578__delegate.call(this, f1, f2, f3, fs)
    };
    return G__10578
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__10554.call(this);
      case 1:
        return comp__10555.call(this, f1);
      case 2:
        return comp__10556.call(this, f1, f2);
      case 3:
        return comp__10557.call(this, f1, f2, f3);
      default:
        return comp__10558.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__10558.cljs$lang$applyTo;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__10584 = function(f, arg1) {
    return function() {
      var G__10589__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__10589 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__10589__delegate.call(this, args)
      };
      G__10589.cljs$lang$maxFixedArity = 0;
      G__10589.cljs$lang$applyTo = function(arglist__10590) {
        var args = cljs.core.seq(arglist__10590);
        return G__10589__delegate.call(this, args)
      };
      return G__10589
    }()
  };
  var partial__10585 = function(f, arg1, arg2) {
    return function() {
      var G__10591__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__10591 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__10591__delegate.call(this, args)
      };
      G__10591.cljs$lang$maxFixedArity = 0;
      G__10591.cljs$lang$applyTo = function(arglist__10592) {
        var args = cljs.core.seq(arglist__10592);
        return G__10591__delegate.call(this, args)
      };
      return G__10591
    }()
  };
  var partial__10586 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__10593__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__10593 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__10593__delegate.call(this, args)
      };
      G__10593.cljs$lang$maxFixedArity = 0;
      G__10593.cljs$lang$applyTo = function(arglist__10594) {
        var args = cljs.core.seq(arglist__10594);
        return G__10593__delegate.call(this, args)
      };
      return G__10593
    }()
  };
  var partial__10587 = function() {
    var G__10595__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__10596__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__10596 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__10596__delegate.call(this, args)
        };
        G__10596.cljs$lang$maxFixedArity = 0;
        G__10596.cljs$lang$applyTo = function(arglist__10597) {
          var args = cljs.core.seq(arglist__10597);
          return G__10596__delegate.call(this, args)
        };
        return G__10596
      }()
    };
    var G__10595 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__10595__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__10595.cljs$lang$maxFixedArity = 4;
    G__10595.cljs$lang$applyTo = function(arglist__10598) {
      var f = cljs.core.first(arglist__10598);
      var arg1 = cljs.core.first(cljs.core.next(arglist__10598));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10598)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10598))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10598))));
      return G__10595__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    return G__10595
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__10584.call(this, f, arg1);
      case 3:
        return partial__10585.call(this, f, arg1, arg2);
      case 4:
        return partial__10586.call(this, f, arg1, arg2, arg3);
      default:
        return partial__10587.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__10587.cljs$lang$applyTo;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__10599 = function(f, x) {
    return function() {
      var G__10603 = null;
      var G__10603__10604 = function(a) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a)
      };
      var G__10603__10605 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b)
      };
      var G__10603__10606 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, b, c)
      };
      var G__10603__10607 = function() {
        var G__10609__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, b, c, ds)
        };
        var G__10609 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10609__delegate.call(this, a, b, c, ds)
        };
        G__10609.cljs$lang$maxFixedArity = 3;
        G__10609.cljs$lang$applyTo = function(arglist__10610) {
          var a = cljs.core.first(arglist__10610);
          var b = cljs.core.first(cljs.core.next(arglist__10610));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10610)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10610)));
          return G__10609__delegate.call(this, a, b, c, ds)
        };
        return G__10609
      }();
      G__10603 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__10603__10604.call(this, a);
          case 2:
            return G__10603__10605.call(this, a, b);
          case 3:
            return G__10603__10606.call(this, a, b, c);
          default:
            return G__10603__10607.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10603.cljs$lang$maxFixedArity = 3;
      G__10603.cljs$lang$applyTo = G__10603__10607.cljs$lang$applyTo;
      return G__10603
    }()
  };
  var fnil__10600 = function(f, x, y) {
    return function() {
      var G__10611 = null;
      var G__10611__10612 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__10611__10613 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c)
      };
      var G__10611__10614 = function() {
        var G__10616__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, c, ds)
        };
        var G__10616 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10616__delegate.call(this, a, b, c, ds)
        };
        G__10616.cljs$lang$maxFixedArity = 3;
        G__10616.cljs$lang$applyTo = function(arglist__10617) {
          var a = cljs.core.first(arglist__10617);
          var b = cljs.core.first(cljs.core.next(arglist__10617));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10617)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10617)));
          return G__10616__delegate.call(this, a, b, c, ds)
        };
        return G__10616
      }();
      G__10611 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__10611__10612.call(this, a, b);
          case 3:
            return G__10611__10613.call(this, a, b, c);
          default:
            return G__10611__10614.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10611.cljs$lang$maxFixedArity = 3;
      G__10611.cljs$lang$applyTo = G__10611__10614.cljs$lang$applyTo;
      return G__10611
    }()
  };
  var fnil__10601 = function(f, x, y, z) {
    return function() {
      var G__10618 = null;
      var G__10618__10619 = function(a, b) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b)
      };
      var G__10618__10620 = function(a, b, c) {
        return f.call(null, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c)
      };
      var G__10618__10621 = function() {
        var G__10623__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, cljs.core.truth_(a === null) ? x : a, cljs.core.truth_(b === null) ? y : b, cljs.core.truth_(c === null) ? z : c, ds)
        };
        var G__10623 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10623__delegate.call(this, a, b, c, ds)
        };
        G__10623.cljs$lang$maxFixedArity = 3;
        G__10623.cljs$lang$applyTo = function(arglist__10624) {
          var a = cljs.core.first(arglist__10624);
          var b = cljs.core.first(cljs.core.next(arglist__10624));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10624)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10624)));
          return G__10623__delegate.call(this, a, b, c, ds)
        };
        return G__10623
      }();
      G__10618 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__10618__10619.call(this, a, b);
          case 3:
            return G__10618__10620.call(this, a, b, c);
          default:
            return G__10618__10621.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__10618.cljs$lang$maxFixedArity = 3;
      G__10618.cljs$lang$applyTo = G__10618__10621.cljs$lang$applyTo;
      return G__10618
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__10599.call(this, f, x);
      case 3:
        return fnil__10600.call(this, f, x, y);
      case 4:
        return fnil__10601.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__10627 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____10625 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____10625)) {
        var s__10626 = temp__3698__auto____10625;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__10626)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__10626)))
      }else {
        return null
      }
    })
  };
  return mapi__10627.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____10628 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____10628)) {
      var s__10629 = temp__3698__auto____10628;
      var x__10630 = f.call(null, cljs.core.first.call(null, s__10629));
      if(cljs.core.truth_(x__10630 === null)) {
        return keep.call(null, f, cljs.core.rest.call(null, s__10629))
      }else {
        return cljs.core.cons.call(null, x__10630, keep.call(null, f, cljs.core.rest.call(null, s__10629)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__10640 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____10637 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____10637)) {
        var s__10638 = temp__3698__auto____10637;
        var x__10639 = f.call(null, idx, cljs.core.first.call(null, s__10638));
        if(cljs.core.truth_(x__10639 === null)) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__10638))
        }else {
          return cljs.core.cons.call(null, x__10639, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__10638)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__10640.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__10685 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__10690 = function() {
        return true
      };
      var ep1__10691 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__10692 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____10647 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____10647)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____10647
          }
        }())
      };
      var ep1__10693 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____10648 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____10648)) {
            var and__3546__auto____10649 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____10649)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____10649
            }
          }else {
            return and__3546__auto____10648
          }
        }())
      };
      var ep1__10694 = function() {
        var G__10696__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____10650 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____10650)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____10650
            }
          }())
        };
        var G__10696 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10696__delegate.call(this, x, y, z, args)
        };
        G__10696.cljs$lang$maxFixedArity = 3;
        G__10696.cljs$lang$applyTo = function(arglist__10697) {
          var x = cljs.core.first(arglist__10697);
          var y = cljs.core.first(cljs.core.next(arglist__10697));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10697)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10697)));
          return G__10696__delegate.call(this, x, y, z, args)
        };
        return G__10696
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__10690.call(this);
          case 1:
            return ep1__10691.call(this, x);
          case 2:
            return ep1__10692.call(this, x, y);
          case 3:
            return ep1__10693.call(this, x, y, z);
          default:
            return ep1__10694.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__10694.cljs$lang$applyTo;
      return ep1
    }()
  };
  var every_pred__10686 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__10698 = function() {
        return true
      };
      var ep2__10699 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____10651 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____10651)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____10651
          }
        }())
      };
      var ep2__10700 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____10652 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____10652)) {
            var and__3546__auto____10653 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____10653)) {
              var and__3546__auto____10654 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____10654)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____10654
              }
            }else {
              return and__3546__auto____10653
            }
          }else {
            return and__3546__auto____10652
          }
        }())
      };
      var ep2__10701 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____10655 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____10655)) {
            var and__3546__auto____10656 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____10656)) {
              var and__3546__auto____10657 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____10657)) {
                var and__3546__auto____10658 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____10658)) {
                  var and__3546__auto____10659 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____10659)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____10659
                  }
                }else {
                  return and__3546__auto____10658
                }
              }else {
                return and__3546__auto____10657
              }
            }else {
              return and__3546__auto____10656
            }
          }else {
            return and__3546__auto____10655
          }
        }())
      };
      var ep2__10702 = function() {
        var G__10704__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____10660 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____10660)) {
              return cljs.core.every_QMARK_.call(null, function(p1__10631_SHARP_) {
                var and__3546__auto____10661 = p1.call(null, p1__10631_SHARP_);
                if(cljs.core.truth_(and__3546__auto____10661)) {
                  return p2.call(null, p1__10631_SHARP_)
                }else {
                  return and__3546__auto____10661
                }
              }, args)
            }else {
              return and__3546__auto____10660
            }
          }())
        };
        var G__10704 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10704__delegate.call(this, x, y, z, args)
        };
        G__10704.cljs$lang$maxFixedArity = 3;
        G__10704.cljs$lang$applyTo = function(arglist__10705) {
          var x = cljs.core.first(arglist__10705);
          var y = cljs.core.first(cljs.core.next(arglist__10705));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10705)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10705)));
          return G__10704__delegate.call(this, x, y, z, args)
        };
        return G__10704
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__10698.call(this);
          case 1:
            return ep2__10699.call(this, x);
          case 2:
            return ep2__10700.call(this, x, y);
          case 3:
            return ep2__10701.call(this, x, y, z);
          default:
            return ep2__10702.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__10702.cljs$lang$applyTo;
      return ep2
    }()
  };
  var every_pred__10687 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__10706 = function() {
        return true
      };
      var ep3__10707 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____10662 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____10662)) {
            var and__3546__auto____10663 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____10663)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____10663
            }
          }else {
            return and__3546__auto____10662
          }
        }())
      };
      var ep3__10708 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____10664 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____10664)) {
            var and__3546__auto____10665 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____10665)) {
              var and__3546__auto____10666 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____10666)) {
                var and__3546__auto____10667 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____10667)) {
                  var and__3546__auto____10668 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____10668)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____10668
                  }
                }else {
                  return and__3546__auto____10667
                }
              }else {
                return and__3546__auto____10666
              }
            }else {
              return and__3546__auto____10665
            }
          }else {
            return and__3546__auto____10664
          }
        }())
      };
      var ep3__10709 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____10669 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____10669)) {
            var and__3546__auto____10670 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____10670)) {
              var and__3546__auto____10671 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____10671)) {
                var and__3546__auto____10672 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____10672)) {
                  var and__3546__auto____10673 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____10673)) {
                    var and__3546__auto____10674 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____10674)) {
                      var and__3546__auto____10675 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____10675)) {
                        var and__3546__auto____10676 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____10676)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____10676
                        }
                      }else {
                        return and__3546__auto____10675
                      }
                    }else {
                      return and__3546__auto____10674
                    }
                  }else {
                    return and__3546__auto____10673
                  }
                }else {
                  return and__3546__auto____10672
                }
              }else {
                return and__3546__auto____10671
              }
            }else {
              return and__3546__auto____10670
            }
          }else {
            return and__3546__auto____10669
          }
        }())
      };
      var ep3__10710 = function() {
        var G__10712__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____10677 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____10677)) {
              return cljs.core.every_QMARK_.call(null, function(p1__10632_SHARP_) {
                var and__3546__auto____10678 = p1.call(null, p1__10632_SHARP_);
                if(cljs.core.truth_(and__3546__auto____10678)) {
                  var and__3546__auto____10679 = p2.call(null, p1__10632_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____10679)) {
                    return p3.call(null, p1__10632_SHARP_)
                  }else {
                    return and__3546__auto____10679
                  }
                }else {
                  return and__3546__auto____10678
                }
              }, args)
            }else {
              return and__3546__auto____10677
            }
          }())
        };
        var G__10712 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10712__delegate.call(this, x, y, z, args)
        };
        G__10712.cljs$lang$maxFixedArity = 3;
        G__10712.cljs$lang$applyTo = function(arglist__10713) {
          var x = cljs.core.first(arglist__10713);
          var y = cljs.core.first(cljs.core.next(arglist__10713));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10713)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10713)));
          return G__10712__delegate.call(this, x, y, z, args)
        };
        return G__10712
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__10706.call(this);
          case 1:
            return ep3__10707.call(this, x);
          case 2:
            return ep3__10708.call(this, x, y);
          case 3:
            return ep3__10709.call(this, x, y, z);
          default:
            return ep3__10710.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__10710.cljs$lang$applyTo;
      return ep3
    }()
  };
  var every_pred__10688 = function() {
    var G__10714__delegate = function(p1, p2, p3, ps) {
      var ps__10680 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__10715 = function() {
          return true
        };
        var epn__10716 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__10633_SHARP_) {
            return p1__10633_SHARP_.call(null, x)
          }, ps__10680)
        };
        var epn__10717 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__10634_SHARP_) {
            var and__3546__auto____10681 = p1__10634_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____10681)) {
              return p1__10634_SHARP_.call(null, y)
            }else {
              return and__3546__auto____10681
            }
          }, ps__10680)
        };
        var epn__10718 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__10635_SHARP_) {
            var and__3546__auto____10682 = p1__10635_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____10682)) {
              var and__3546__auto____10683 = p1__10635_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____10683)) {
                return p1__10635_SHARP_.call(null, z)
              }else {
                return and__3546__auto____10683
              }
            }else {
              return and__3546__auto____10682
            }
          }, ps__10680)
        };
        var epn__10719 = function() {
          var G__10721__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____10684 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____10684)) {
                return cljs.core.every_QMARK_.call(null, function(p1__10636_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__10636_SHARP_, args)
                }, ps__10680)
              }else {
                return and__3546__auto____10684
              }
            }())
          };
          var G__10721 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10721__delegate.call(this, x, y, z, args)
          };
          G__10721.cljs$lang$maxFixedArity = 3;
          G__10721.cljs$lang$applyTo = function(arglist__10722) {
            var x = cljs.core.first(arglist__10722);
            var y = cljs.core.first(cljs.core.next(arglist__10722));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10722)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10722)));
            return G__10721__delegate.call(this, x, y, z, args)
          };
          return G__10721
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__10715.call(this);
            case 1:
              return epn__10716.call(this, x);
            case 2:
              return epn__10717.call(this, x, y);
            case 3:
              return epn__10718.call(this, x, y, z);
            default:
              return epn__10719.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__10719.cljs$lang$applyTo;
        return epn
      }()
    };
    var G__10714 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10714__delegate.call(this, p1, p2, p3, ps)
    };
    G__10714.cljs$lang$maxFixedArity = 3;
    G__10714.cljs$lang$applyTo = function(arglist__10723) {
      var p1 = cljs.core.first(arglist__10723);
      var p2 = cljs.core.first(cljs.core.next(arglist__10723));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10723)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10723)));
      return G__10714__delegate.call(this, p1, p2, p3, ps)
    };
    return G__10714
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__10685.call(this, p1);
      case 2:
        return every_pred__10686.call(this, p1, p2);
      case 3:
        return every_pred__10687.call(this, p1, p2, p3);
      default:
        return every_pred__10688.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__10688.cljs$lang$applyTo;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__10763 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__10768 = function() {
        return null
      };
      var sp1__10769 = function(x) {
        return p.call(null, x)
      };
      var sp1__10770 = function(x, y) {
        var or__3548__auto____10725 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____10725)) {
          return or__3548__auto____10725
        }else {
          return p.call(null, y)
        }
      };
      var sp1__10771 = function(x, y, z) {
        var or__3548__auto____10726 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____10726)) {
          return or__3548__auto____10726
        }else {
          var or__3548__auto____10727 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____10727)) {
            return or__3548__auto____10727
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__10772 = function() {
        var G__10774__delegate = function(x, y, z, args) {
          var or__3548__auto____10728 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____10728)) {
            return or__3548__auto____10728
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__10774 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10774__delegate.call(this, x, y, z, args)
        };
        G__10774.cljs$lang$maxFixedArity = 3;
        G__10774.cljs$lang$applyTo = function(arglist__10775) {
          var x = cljs.core.first(arglist__10775);
          var y = cljs.core.first(cljs.core.next(arglist__10775));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10775)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10775)));
          return G__10774__delegate.call(this, x, y, z, args)
        };
        return G__10774
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__10768.call(this);
          case 1:
            return sp1__10769.call(this, x);
          case 2:
            return sp1__10770.call(this, x, y);
          case 3:
            return sp1__10771.call(this, x, y, z);
          default:
            return sp1__10772.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__10772.cljs$lang$applyTo;
      return sp1
    }()
  };
  var some_fn__10764 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__10776 = function() {
        return null
      };
      var sp2__10777 = function(x) {
        var or__3548__auto____10729 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____10729)) {
          return or__3548__auto____10729
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__10778 = function(x, y) {
        var or__3548__auto____10730 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____10730)) {
          return or__3548__auto____10730
        }else {
          var or__3548__auto____10731 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____10731)) {
            return or__3548__auto____10731
          }else {
            var or__3548__auto____10732 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____10732)) {
              return or__3548__auto____10732
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__10779 = function(x, y, z) {
        var or__3548__auto____10733 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____10733)) {
          return or__3548__auto____10733
        }else {
          var or__3548__auto____10734 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____10734)) {
            return or__3548__auto____10734
          }else {
            var or__3548__auto____10735 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____10735)) {
              return or__3548__auto____10735
            }else {
              var or__3548__auto____10736 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____10736)) {
                return or__3548__auto____10736
              }else {
                var or__3548__auto____10737 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____10737)) {
                  return or__3548__auto____10737
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__10780 = function() {
        var G__10782__delegate = function(x, y, z, args) {
          var or__3548__auto____10738 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____10738)) {
            return or__3548__auto____10738
          }else {
            return cljs.core.some.call(null, function(p1__10641_SHARP_) {
              var or__3548__auto____10739 = p1.call(null, p1__10641_SHARP_);
              if(cljs.core.truth_(or__3548__auto____10739)) {
                return or__3548__auto____10739
              }else {
                return p2.call(null, p1__10641_SHARP_)
              }
            }, args)
          }
        };
        var G__10782 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10782__delegate.call(this, x, y, z, args)
        };
        G__10782.cljs$lang$maxFixedArity = 3;
        G__10782.cljs$lang$applyTo = function(arglist__10783) {
          var x = cljs.core.first(arglist__10783);
          var y = cljs.core.first(cljs.core.next(arglist__10783));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10783)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10783)));
          return G__10782__delegate.call(this, x, y, z, args)
        };
        return G__10782
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__10776.call(this);
          case 1:
            return sp2__10777.call(this, x);
          case 2:
            return sp2__10778.call(this, x, y);
          case 3:
            return sp2__10779.call(this, x, y, z);
          default:
            return sp2__10780.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__10780.cljs$lang$applyTo;
      return sp2
    }()
  };
  var some_fn__10765 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__10784 = function() {
        return null
      };
      var sp3__10785 = function(x) {
        var or__3548__auto____10740 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____10740)) {
          return or__3548__auto____10740
        }else {
          var or__3548__auto____10741 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____10741)) {
            return or__3548__auto____10741
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__10786 = function(x, y) {
        var or__3548__auto____10742 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____10742)) {
          return or__3548__auto____10742
        }else {
          var or__3548__auto____10743 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____10743)) {
            return or__3548__auto____10743
          }else {
            var or__3548__auto____10744 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____10744)) {
              return or__3548__auto____10744
            }else {
              var or__3548__auto____10745 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____10745)) {
                return or__3548__auto____10745
              }else {
                var or__3548__auto____10746 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____10746)) {
                  return or__3548__auto____10746
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__10787 = function(x, y, z) {
        var or__3548__auto____10747 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____10747)) {
          return or__3548__auto____10747
        }else {
          var or__3548__auto____10748 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____10748)) {
            return or__3548__auto____10748
          }else {
            var or__3548__auto____10749 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____10749)) {
              return or__3548__auto____10749
            }else {
              var or__3548__auto____10750 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____10750)) {
                return or__3548__auto____10750
              }else {
                var or__3548__auto____10751 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____10751)) {
                  return or__3548__auto____10751
                }else {
                  var or__3548__auto____10752 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____10752)) {
                    return or__3548__auto____10752
                  }else {
                    var or__3548__auto____10753 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____10753)) {
                      return or__3548__auto____10753
                    }else {
                      var or__3548__auto____10754 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____10754)) {
                        return or__3548__auto____10754
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__10788 = function() {
        var G__10790__delegate = function(x, y, z, args) {
          var or__3548__auto____10755 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____10755)) {
            return or__3548__auto____10755
          }else {
            return cljs.core.some.call(null, function(p1__10642_SHARP_) {
              var or__3548__auto____10756 = p1.call(null, p1__10642_SHARP_);
              if(cljs.core.truth_(or__3548__auto____10756)) {
                return or__3548__auto____10756
              }else {
                var or__3548__auto____10757 = p2.call(null, p1__10642_SHARP_);
                if(cljs.core.truth_(or__3548__auto____10757)) {
                  return or__3548__auto____10757
                }else {
                  return p3.call(null, p1__10642_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__10790 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__10790__delegate.call(this, x, y, z, args)
        };
        G__10790.cljs$lang$maxFixedArity = 3;
        G__10790.cljs$lang$applyTo = function(arglist__10791) {
          var x = cljs.core.first(arglist__10791);
          var y = cljs.core.first(cljs.core.next(arglist__10791));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10791)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10791)));
          return G__10790__delegate.call(this, x, y, z, args)
        };
        return G__10790
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__10784.call(this);
          case 1:
            return sp3__10785.call(this, x);
          case 2:
            return sp3__10786.call(this, x, y);
          case 3:
            return sp3__10787.call(this, x, y, z);
          default:
            return sp3__10788.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__10788.cljs$lang$applyTo;
      return sp3
    }()
  };
  var some_fn__10766 = function() {
    var G__10792__delegate = function(p1, p2, p3, ps) {
      var ps__10758 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__10793 = function() {
          return null
        };
        var spn__10794 = function(x) {
          return cljs.core.some.call(null, function(p1__10643_SHARP_) {
            return p1__10643_SHARP_.call(null, x)
          }, ps__10758)
        };
        var spn__10795 = function(x, y) {
          return cljs.core.some.call(null, function(p1__10644_SHARP_) {
            var or__3548__auto____10759 = p1__10644_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____10759)) {
              return or__3548__auto____10759
            }else {
              return p1__10644_SHARP_.call(null, y)
            }
          }, ps__10758)
        };
        var spn__10796 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__10645_SHARP_) {
            var or__3548__auto____10760 = p1__10645_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____10760)) {
              return or__3548__auto____10760
            }else {
              var or__3548__auto____10761 = p1__10645_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____10761)) {
                return or__3548__auto____10761
              }else {
                return p1__10645_SHARP_.call(null, z)
              }
            }
          }, ps__10758)
        };
        var spn__10797 = function() {
          var G__10799__delegate = function(x, y, z, args) {
            var or__3548__auto____10762 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____10762)) {
              return or__3548__auto____10762
            }else {
              return cljs.core.some.call(null, function(p1__10646_SHARP_) {
                return cljs.core.some.call(null, p1__10646_SHARP_, args)
              }, ps__10758)
            }
          };
          var G__10799 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__10799__delegate.call(this, x, y, z, args)
          };
          G__10799.cljs$lang$maxFixedArity = 3;
          G__10799.cljs$lang$applyTo = function(arglist__10800) {
            var x = cljs.core.first(arglist__10800);
            var y = cljs.core.first(cljs.core.next(arglist__10800));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10800)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10800)));
            return G__10799__delegate.call(this, x, y, z, args)
          };
          return G__10799
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__10793.call(this);
            case 1:
              return spn__10794.call(this, x);
            case 2:
              return spn__10795.call(this, x, y);
            case 3:
              return spn__10796.call(this, x, y, z);
            default:
              return spn__10797.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__10797.cljs$lang$applyTo;
        return spn
      }()
    };
    var G__10792 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__10792__delegate.call(this, p1, p2, p3, ps)
    };
    G__10792.cljs$lang$maxFixedArity = 3;
    G__10792.cljs$lang$applyTo = function(arglist__10801) {
      var p1 = cljs.core.first(arglist__10801);
      var p2 = cljs.core.first(cljs.core.next(arglist__10801));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10801)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10801)));
      return G__10792__delegate.call(this, p1, p2, p3, ps)
    };
    return G__10792
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__10763.call(this, p1);
      case 2:
        return some_fn__10764.call(this, p1, p2);
      case 3:
        return some_fn__10765.call(this, p1, p2, p3);
      default:
        return some_fn__10766.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__10766.cljs$lang$applyTo;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__10814 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____10802 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____10802)) {
        var s__10803 = temp__3698__auto____10802;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__10803)), map.call(null, f, cljs.core.rest.call(null, s__10803)))
      }else {
        return null
      }
    })
  };
  var map__10815 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__10804 = cljs.core.seq.call(null, c1);
      var s2__10805 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____10806 = s1__10804;
        if(cljs.core.truth_(and__3546__auto____10806)) {
          return s2__10805
        }else {
          return and__3546__auto____10806
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__10804), cljs.core.first.call(null, s2__10805)), map.call(null, f, cljs.core.rest.call(null, s1__10804), cljs.core.rest.call(null, s2__10805)))
      }else {
        return null
      }
    })
  };
  var map__10816 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__10807 = cljs.core.seq.call(null, c1);
      var s2__10808 = cljs.core.seq.call(null, c2);
      var s3__10809 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____10810 = s1__10807;
        if(cljs.core.truth_(and__3546__auto____10810)) {
          var and__3546__auto____10811 = s2__10808;
          if(cljs.core.truth_(and__3546__auto____10811)) {
            return s3__10809
          }else {
            return and__3546__auto____10811
          }
        }else {
          return and__3546__auto____10810
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__10807), cljs.core.first.call(null, s2__10808), cljs.core.first.call(null, s3__10809)), map.call(null, f, cljs.core.rest.call(null, s1__10807), cljs.core.rest.call(null, s2__10808), cljs.core.rest.call(null, s3__10809)))
      }else {
        return null
      }
    })
  };
  var map__10817 = function() {
    var G__10819__delegate = function(f, c1, c2, c3, colls) {
      var step__10813 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__10812 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__10812))) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__10812), step.call(null, map.call(null, cljs.core.rest, ss__10812)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__10724_SHARP_) {
        return cljs.core.apply.call(null, f, p1__10724_SHARP_)
      }, step__10813.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__10819 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__10819__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__10819.cljs$lang$maxFixedArity = 4;
    G__10819.cljs$lang$applyTo = function(arglist__10820) {
      var f = cljs.core.first(arglist__10820);
      var c1 = cljs.core.first(cljs.core.next(arglist__10820));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10820)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10820))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__10820))));
      return G__10819__delegate.call(this, f, c1, c2, c3, colls)
    };
    return G__10819
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__10814.call(this, f, c1);
      case 3:
        return map__10815.call(this, f, c1, c2);
      case 4:
        return map__10816.call(this, f, c1, c2, c3);
      default:
        return map__10817.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__10817.cljs$lang$applyTo;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(cljs.core.truth_(n > 0)) {
      var temp__3698__auto____10821 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____10821)) {
        var s__10822 = temp__3698__auto____10821;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__10822), take.call(null, n - 1, cljs.core.rest.call(null, s__10822)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__10825 = function(n, coll) {
    while(true) {
      var s__10823 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____10824 = n > 0;
        if(cljs.core.truth_(and__3546__auto____10824)) {
          return s__10823
        }else {
          return and__3546__auto____10824
        }
      }())) {
        var G__10826 = n - 1;
        var G__10827 = cljs.core.rest.call(null, s__10823);
        n = G__10826;
        coll = G__10827;
        continue
      }else {
        return s__10823
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__10825.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__10828 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__10829 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__10828.call(this, n);
      case 2:
        return drop_last__10829.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__10831 = cljs.core.seq.call(null, coll);
  var lead__10832 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__10832)) {
      var G__10833 = cljs.core.next.call(null, s__10831);
      var G__10834 = cljs.core.next.call(null, lead__10832);
      s__10831 = G__10833;
      lead__10832 = G__10834;
      continue
    }else {
      return s__10831
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__10837 = function(pred, coll) {
    while(true) {
      var s__10835 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____10836 = s__10835;
        if(cljs.core.truth_(and__3546__auto____10836)) {
          return pred.call(null, cljs.core.first.call(null, s__10835))
        }else {
          return and__3546__auto____10836
        }
      }())) {
        var G__10838 = pred;
        var G__10839 = cljs.core.rest.call(null, s__10835);
        pred = G__10838;
        coll = G__10839;
        continue
      }else {
        return s__10835
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__10837.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____10840 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____10840)) {
      var s__10841 = temp__3698__auto____10840;
      return cljs.core.concat.call(null, s__10841, cycle.call(null, s__10841))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__10842 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__10843 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__10842.call(this, n);
      case 2:
        return repeat__10843.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__10845 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__10846 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__10845.call(this, n);
      case 2:
        return repeatedly__10846.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__10852 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__10848 = cljs.core.seq.call(null, c1);
      var s2__10849 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____10850 = s1__10848;
        if(cljs.core.truth_(and__3546__auto____10850)) {
          return s2__10849
        }else {
          return and__3546__auto____10850
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__10848), cljs.core.cons.call(null, cljs.core.first.call(null, s2__10849), interleave.call(null, cljs.core.rest.call(null, s1__10848), cljs.core.rest.call(null, s2__10849))))
      }else {
        return null
      }
    })
  };
  var interleave__10853 = function() {
    var G__10855__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__10851 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.truth_(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__10851))) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__10851), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__10851)))
        }else {
          return null
        }
      })
    };
    var G__10855 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10855__delegate.call(this, c1, c2, colls)
    };
    G__10855.cljs$lang$maxFixedArity = 2;
    G__10855.cljs$lang$applyTo = function(arglist__10856) {
      var c1 = cljs.core.first(arglist__10856);
      var c2 = cljs.core.first(cljs.core.next(arglist__10856));
      var colls = cljs.core.rest(cljs.core.next(arglist__10856));
      return G__10855__delegate.call(this, c1, c2, colls)
    };
    return G__10855
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__10852.call(this, c1, c2);
      default:
        return interleave__10853.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__10853.cljs$lang$applyTo;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__10859 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____10857 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____10857)) {
        var coll__10858 = temp__3695__auto____10857;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__10858), cat.call(null, cljs.core.rest.call(null, coll__10858), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__10859.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__10860 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__10861 = function() {
    var G__10863__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__10863 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__10863__delegate.call(this, f, coll, colls)
    };
    G__10863.cljs$lang$maxFixedArity = 2;
    G__10863.cljs$lang$applyTo = function(arglist__10864) {
      var f = cljs.core.first(arglist__10864);
      var coll = cljs.core.first(cljs.core.next(arglist__10864));
      var colls = cljs.core.rest(cljs.core.next(arglist__10864));
      return G__10863__delegate.call(this, f, coll, colls)
    };
    return G__10863
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__10860.call(this, f, coll);
      default:
        return mapcat__10861.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__10861.cljs$lang$applyTo;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____10865 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____10865)) {
      var s__10866 = temp__3698__auto____10865;
      var f__10867 = cljs.core.first.call(null, s__10866);
      var r__10868 = cljs.core.rest.call(null, s__10866);
      if(cljs.core.truth_(pred.call(null, f__10867))) {
        return cljs.core.cons.call(null, f__10867, filter.call(null, pred, r__10868))
      }else {
        return filter.call(null, pred, r__10868)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__10870 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__10870.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__10869_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__10869_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  return cljs.core.reduce.call(null, cljs.core._conj, to, from)
};
cljs.core.partition = function() {
  var partition = null;
  var partition__10877 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__10878 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____10871 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____10871)) {
        var s__10872 = temp__3698__auto____10871;
        var p__10873 = cljs.core.take.call(null, n, s__10872);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__10873)))) {
          return cljs.core.cons.call(null, p__10873, partition.call(null, n, step, cljs.core.drop.call(null, step, s__10872)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__10879 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____10874 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____10874)) {
        var s__10875 = temp__3698__auto____10874;
        var p__10876 = cljs.core.take.call(null, n, s__10875);
        if(cljs.core.truth_(cljs.core._EQ_.call(null, n, cljs.core.count.call(null, p__10876)))) {
          return cljs.core.cons.call(null, p__10876, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__10875)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__10876, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__10877.call(this, n, step);
      case 3:
        return partition__10878.call(this, n, step, pad);
      case 4:
        return partition__10879.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__10885 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__10886 = function(m, ks, not_found) {
    var sentinel__10881 = cljs.core.lookup_sentinel;
    var m__10882 = m;
    var ks__10883 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__10883)) {
        var m__10884 = cljs.core.get.call(null, m__10882, cljs.core.first.call(null, ks__10883), sentinel__10881);
        if(cljs.core.truth_(sentinel__10881 === m__10884)) {
          return not_found
        }else {
          var G__10888 = sentinel__10881;
          var G__10889 = m__10884;
          var G__10890 = cljs.core.next.call(null, ks__10883);
          sentinel__10881 = G__10888;
          m__10882 = G__10889;
          ks__10883 = G__10890;
          continue
        }
      }else {
        return m__10882
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__10885.call(this, m, ks);
      case 3:
        return get_in__10886.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__10891, v) {
  var vec__10892__10893 = p__10891;
  var k__10894 = cljs.core.nth.call(null, vec__10892__10893, 0, null);
  var ks__10895 = cljs.core.nthnext.call(null, vec__10892__10893, 1);
  if(cljs.core.truth_(ks__10895)) {
    return cljs.core.assoc.call(null, m, k__10894, assoc_in.call(null, cljs.core.get.call(null, m, k__10894), ks__10895, v))
  }else {
    return cljs.core.assoc.call(null, m, k__10894, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__10896, f, args) {
    var vec__10897__10898 = p__10896;
    var k__10899 = cljs.core.nth.call(null, vec__10897__10898, 0, null);
    var ks__10900 = cljs.core.nthnext.call(null, vec__10897__10898, 1);
    if(cljs.core.truth_(ks__10900)) {
      return cljs.core.assoc.call(null, m, k__10899, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__10899), ks__10900, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__10899, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__10899), args))
    }
  };
  var update_in = function(m, p__10896, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__10896, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__10901) {
    var m = cljs.core.first(arglist__10901);
    var p__10896 = cljs.core.first(cljs.core.next(arglist__10901));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__10901)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__10901)));
    return update_in__delegate.call(this, m, p__10896, f, args)
  };
  return update_in
}();
cljs.core.Vector = function(meta, array) {
  this.meta = meta;
  this.array = array
};
cljs.core.Vector.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__10902 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup = function() {
  var G__10935 = null;
  var G__10935__10936 = function(coll, k) {
    var this__10903 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__10935__10937 = function(coll, k, not_found) {
    var this__10904 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__10935 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10935__10936.call(this, coll, k);
      case 3:
        return G__10935__10937.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10935
}();
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__10905 = this;
  var new_array__10906 = cljs.core.aclone.call(null, this__10905.array);
  new_array__10906[k] = v;
  return new cljs.core.Vector(this__10905.meta, new_array__10906)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__10939 = null;
  var G__10939__10940 = function(tsym10907, k) {
    var this__10909 = this;
    var tsym10907__10910 = this;
    var coll__10911 = tsym10907__10910;
    return cljs.core._lookup.call(null, coll__10911, k)
  };
  var G__10939__10941 = function(tsym10908, k, not_found) {
    var this__10912 = this;
    var tsym10908__10913 = this;
    var coll__10914 = tsym10908__10913;
    return cljs.core._lookup.call(null, coll__10914, k, not_found)
  };
  G__10939 = function(tsym10908, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10939__10940.call(this, tsym10908, k);
      case 3:
        return G__10939__10941.call(this, tsym10908, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10939
}();
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__10915 = this;
  var new_array__10916 = cljs.core.aclone.call(null, this__10915.array);
  new_array__10916.push(o);
  return new cljs.core.Vector(this__10915.meta, new_array__10916)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce = function() {
  var G__10943 = null;
  var G__10943__10944 = function(v, f) {
    var this__10917 = this;
    return cljs.core.ci_reduce.call(null, this__10917.array, f)
  };
  var G__10943__10945 = function(v, f, start) {
    var this__10918 = this;
    return cljs.core.ci_reduce.call(null, this__10918.array, f, start)
  };
  G__10943 = function(v, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10943__10944.call(this, v, f);
      case 3:
        return G__10943__10945.call(this, v, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10943
}();
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__10919 = this;
  if(cljs.core.truth_(this__10919.array.length > 0)) {
    var vector_seq__10920 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(cljs.core.truth_(i < this__10919.array.length)) {
          return cljs.core.cons.call(null, this__10919.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__10920.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__10921 = this;
  return this__10921.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__10922 = this;
  var count__10923 = this__10922.array.length;
  if(cljs.core.truth_(count__10923 > 0)) {
    return this__10922.array[count__10923 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__10924 = this;
  if(cljs.core.truth_(this__10924.array.length > 0)) {
    var new_array__10925 = cljs.core.aclone.call(null, this__10924.array);
    new_array__10925.pop();
    return new cljs.core.Vector(this__10924.meta, new_array__10925)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__10926 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__10927 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__10928 = this;
  return new cljs.core.Vector(meta, this__10928.array)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__10929 = this;
  return this__10929.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth = function() {
  var G__10947 = null;
  var G__10947__10948 = function(coll, n) {
    var this__10930 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____10931 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____10931)) {
        return n < this__10930.array.length
      }else {
        return and__3546__auto____10931
      }
    }())) {
      return this__10930.array[n]
    }else {
      return null
    }
  };
  var G__10947__10949 = function(coll, n, not_found) {
    var this__10932 = this;
    if(cljs.core.truth_(function() {
      var and__3546__auto____10933 = 0 <= n;
      if(cljs.core.truth_(and__3546__auto____10933)) {
        return n < this__10932.array.length
      }else {
        return and__3546__auto____10933
      }
    }())) {
      return this__10932.array[n]
    }else {
      return not_found
    }
  };
  G__10947 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10947__10948.call(this, coll, n);
      case 3:
        return G__10947__10949.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10947
}();
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__10934 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__10934.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, cljs.core.array.call(null));
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs)
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.Vector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__10951) {
    var args = cljs.core.seq(arglist__10951);
    return vector__delegate.call(this, args)
  };
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end
};
cljs.core.Subvec.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__10952 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup = function() {
  var G__10980 = null;
  var G__10980__10981 = function(coll, k) {
    var this__10953 = this;
    return cljs.core._nth.call(null, coll, k, null)
  };
  var G__10980__10982 = function(coll, k, not_found) {
    var this__10954 = this;
    return cljs.core._nth.call(null, coll, k, not_found)
  };
  G__10980 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10980__10981.call(this, coll, k);
      case 3:
        return G__10980__10982.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10980
}();
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc = function(coll, key, val) {
  var this__10955 = this;
  var v_pos__10956 = this__10955.start + key;
  return new cljs.core.Subvec(this__10955.meta, cljs.core._assoc.call(null, this__10955.v, v_pos__10956, val), this__10955.start, this__10955.end > v_pos__10956 + 1 ? this__10955.end : v_pos__10956 + 1)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__10984 = null;
  var G__10984__10985 = function(tsym10957, k) {
    var this__10959 = this;
    var tsym10957__10960 = this;
    var coll__10961 = tsym10957__10960;
    return cljs.core._lookup.call(null, coll__10961, k)
  };
  var G__10984__10986 = function(tsym10958, k, not_found) {
    var this__10962 = this;
    var tsym10958__10963 = this;
    var coll__10964 = tsym10958__10963;
    return cljs.core._lookup.call(null, coll__10964, k, not_found)
  };
  G__10984 = function(tsym10958, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10984__10985.call(this, tsym10958, k);
      case 3:
        return G__10984__10986.call(this, tsym10958, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10984
}();
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__10965 = this;
  return new cljs.core.Subvec(this__10965.meta, cljs.core._assoc_n.call(null, this__10965.v, this__10965.end, o), this__10965.start, this__10965.end + 1)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce = function() {
  var G__10988 = null;
  var G__10988__10989 = function(coll, f) {
    var this__10966 = this;
    return cljs.core.ci_reduce.call(null, coll, f)
  };
  var G__10988__10990 = function(coll, f, start) {
    var this__10967 = this;
    return cljs.core.ci_reduce.call(null, coll, f, start)
  };
  G__10988 = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return G__10988__10989.call(this, coll, f);
      case 3:
        return G__10988__10990.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10988
}();
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__10968 = this;
  var subvec_seq__10969 = function subvec_seq(i) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, i, this__10968.end))) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__10968.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__10969.call(null, this__10968.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__10970 = this;
  return this__10970.end - this__10970.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__10971 = this;
  return cljs.core._nth.call(null, this__10971.v, this__10971.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__10972 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, this__10972.start, this__10972.end))) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__10972.meta, this__10972.v, this__10972.start, this__10972.end - 1)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n = function(coll, n, val) {
  var this__10973 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__10974 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__10975 = this;
  return new cljs.core.Subvec(meta, this__10975.v, this__10975.start, this__10975.end)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__10976 = this;
  return this__10976.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth = function() {
  var G__10992 = null;
  var G__10992__10993 = function(coll, n) {
    var this__10977 = this;
    return cljs.core._nth.call(null, this__10977.v, this__10977.start + n)
  };
  var G__10992__10994 = function(coll, n, not_found) {
    var this__10978 = this;
    return cljs.core._nth.call(null, this__10978.v, this__10978.start + n, not_found)
  };
  G__10992 = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__10992__10993.call(this, coll, n);
      case 3:
        return G__10992__10994.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__10992
}();
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__10979 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__10979.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__10996 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__10997 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__10996.call(this, v, start);
      case 3:
        return subvec__10997.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return subvec
}();
cljs.core.PersistentQueueSeq = function(meta, front, rear) {
  this.meta = meta;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueueSeq.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__10999 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__11000 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11001 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11002 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__11002.meta)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11003 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__11004 = this;
  return cljs.core._first.call(null, this__11004.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__11005 = this;
  var temp__3695__auto____11006 = cljs.core.next.call(null, this__11005.front);
  if(cljs.core.truth_(temp__3695__auto____11006)) {
    var f1__11007 = temp__3695__auto____11006;
    return new cljs.core.PersistentQueueSeq(this__11005.meta, f1__11007, this__11005.rear)
  }else {
    if(cljs.core.truth_(this__11005.rear === null)) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__11005.meta, this__11005.rear, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11008 = this;
  return this__11008.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11009 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__11009.front, this__11009.rear)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear
};
cljs.core.PersistentQueue.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__11010 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11011 = this;
  if(cljs.core.truth_(this__11011.front)) {
    return new cljs.core.PersistentQueue(this__11011.meta, this__11011.count + 1, this__11011.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____11012 = this__11011.rear;
      if(cljs.core.truth_(or__3548__auto____11012)) {
        return or__3548__auto____11012
      }else {
        return cljs.core.Vector.fromArray([])
      }
    }(), o))
  }else {
    return new cljs.core.PersistentQueue(this__11011.meta, this__11011.count + 1, cljs.core.conj.call(null, this__11011.front, o), cljs.core.Vector.fromArray([]))
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11013 = this;
  var rear__11014 = cljs.core.seq.call(null, this__11013.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____11015 = this__11013.front;
    if(cljs.core.truth_(or__3548__auto____11015)) {
      return or__3548__auto____11015
    }else {
      return rear__11014
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__11013.front, cljs.core.seq.call(null, rear__11014))
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11016 = this;
  return this__11016.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek = function(coll) {
  var this__11017 = this;
  return cljs.core._first.call(null, this__11017.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop = function(coll) {
  var this__11018 = this;
  if(cljs.core.truth_(this__11018.front)) {
    var temp__3695__auto____11019 = cljs.core.next.call(null, this__11018.front);
    if(cljs.core.truth_(temp__3695__auto____11019)) {
      var f1__11020 = temp__3695__auto____11019;
      return new cljs.core.PersistentQueue(this__11018.meta, this__11018.count - 1, f1__11020, this__11018.rear)
    }else {
      return new cljs.core.PersistentQueue(this__11018.meta, this__11018.count - 1, cljs.core.seq.call(null, this__11018.rear), cljs.core.Vector.fromArray([]))
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first = function(coll) {
  var this__11021 = this;
  return cljs.core.first.call(null, this__11021.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest = function(coll) {
  var this__11022 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11023 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11024 = this;
  return new cljs.core.PersistentQueue(meta, this__11024.count, this__11024.front, this__11024.rear)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11025 = this;
  return this__11025.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11026 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.Vector.fromArray([]));
cljs.core.NeverEquiv = function() {
};
cljs.core.NeverEquiv.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__11027 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.truth_(cljs.core.map_QMARK_.call(null, y)) ? cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, x), cljs.core.count.call(null, y))) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__11028 = array.length;
  var i__11029 = 0;
  while(true) {
    if(cljs.core.truth_(i__11029 < len__11028)) {
      if(cljs.core.truth_(cljs.core._EQ_.call(null, k, array[i__11029]))) {
        return i__11029
      }else {
        var G__11030 = i__11029 + incr;
        i__11029 = G__11030;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___11032 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___11033 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____11031 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____11031)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____11031
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___11032.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___11033.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__11036 = cljs.core.hash.call(null, a);
  var b__11037 = cljs.core.hash.call(null, b);
  if(cljs.core.truth_(a__11036 < b__11037)) {
    return-1
  }else {
    if(cljs.core.truth_(a__11036 > b__11037)) {
      return 1
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.ObjMap = function(meta, keys, strobj) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj
};
cljs.core.ObjMap.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__11038 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__11065 = null;
  var G__11065__11066 = function(coll, k) {
    var this__11039 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__11065__11067 = function(coll, k, not_found) {
    var this__11040 = this;
    return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__11040.strobj, this__11040.strobj[k], not_found)
  };
  G__11065 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11065__11066.call(this, coll, k);
      case 3:
        return G__11065__11067.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11065
}();
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__11041 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var new_strobj__11042 = goog.object.clone.call(null, this__11041.strobj);
    var overwrite_QMARK___11043 = new_strobj__11042.hasOwnProperty(k);
    new_strobj__11042[k] = v;
    if(cljs.core.truth_(overwrite_QMARK___11043)) {
      return new cljs.core.ObjMap(this__11041.meta, this__11041.keys, new_strobj__11042)
    }else {
      var new_keys__11044 = cljs.core.aclone.call(null, this__11041.keys);
      new_keys__11044.push(k);
      return new cljs.core.ObjMap(this__11041.meta, new_keys__11044, new_strobj__11042)
    }
  }else {
    return cljs.core.with_meta.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null, k, v), cljs.core.seq.call(null, coll)), this__11041.meta)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__11045 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__11045.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__11069 = null;
  var G__11069__11070 = function(tsym11046, k) {
    var this__11048 = this;
    var tsym11046__11049 = this;
    var coll__11050 = tsym11046__11049;
    return cljs.core._lookup.call(null, coll__11050, k)
  };
  var G__11069__11071 = function(tsym11047, k, not_found) {
    var this__11051 = this;
    var tsym11047__11052 = this;
    var coll__11053 = tsym11047__11052;
    return cljs.core._lookup.call(null, coll__11053, k, not_found)
  };
  G__11069 = function(tsym11047, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11069__11070.call(this, tsym11047, k);
      case 3:
        return G__11069__11071.call(this, tsym11047, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11069
}();
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__11054 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11055 = this;
  if(cljs.core.truth_(this__11055.keys.length > 0)) {
    return cljs.core.map.call(null, function(p1__11035_SHARP_) {
      return cljs.core.vector.call(null, p1__11035_SHARP_, this__11055.strobj[p1__11035_SHARP_])
    }, this__11055.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11056 = this;
  return this__11056.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11057 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11058 = this;
  return new cljs.core.ObjMap(meta, this__11058.keys, this__11058.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11059 = this;
  return this__11059.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11060 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__11060.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__11061 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____11062 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____11062)) {
      return this__11061.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____11062
    }
  }())) {
    var new_keys__11063 = cljs.core.aclone.call(null, this__11061.keys);
    var new_strobj__11064 = goog.object.clone.call(null, this__11061.strobj);
    new_keys__11063.splice(cljs.core.scan_array.call(null, 1, k, new_keys__11063), 1);
    cljs.core.js_delete.call(null, new_strobj__11064, k);
    return new cljs.core.ObjMap(this__11061.meta, new_keys__11063, new_strobj__11064)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, cljs.core.array.call(null), cljs.core.js_obj.call(null));
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj)
};
cljs.core.HashMap = function(meta, count, hashobj) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj
};
cljs.core.HashMap.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__11074 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup = function() {
  var G__11112 = null;
  var G__11112__11113 = function(coll, k) {
    var this__11075 = this;
    return cljs.core._lookup.call(null, coll, k, null)
  };
  var G__11112__11114 = function(coll, k, not_found) {
    var this__11076 = this;
    var bucket__11077 = this__11076.hashobj[cljs.core.hash.call(null, k)];
    var i__11078 = cljs.core.truth_(bucket__11077) ? cljs.core.scan_array.call(null, 2, k, bucket__11077) : null;
    if(cljs.core.truth_(i__11078)) {
      return bucket__11077[i__11078 + 1]
    }else {
      return not_found
    }
  };
  G__11112 = function(coll, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11112__11113.call(this, coll, k);
      case 3:
        return G__11112__11114.call(this, coll, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11112
}();
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc = function(coll, k, v) {
  var this__11079 = this;
  var h__11080 = cljs.core.hash.call(null, k);
  var bucket__11081 = this__11079.hashobj[h__11080];
  if(cljs.core.truth_(bucket__11081)) {
    var new_bucket__11082 = cljs.core.aclone.call(null, bucket__11081);
    var new_hashobj__11083 = goog.object.clone.call(null, this__11079.hashobj);
    new_hashobj__11083[h__11080] = new_bucket__11082;
    var temp__3695__auto____11084 = cljs.core.scan_array.call(null, 2, k, new_bucket__11082);
    if(cljs.core.truth_(temp__3695__auto____11084)) {
      var i__11085 = temp__3695__auto____11084;
      new_bucket__11082[i__11085 + 1] = v;
      return new cljs.core.HashMap(this__11079.meta, this__11079.count, new_hashobj__11083)
    }else {
      new_bucket__11082.push(k, v);
      return new cljs.core.HashMap(this__11079.meta, this__11079.count + 1, new_hashobj__11083)
    }
  }else {
    var new_hashobj__11086 = goog.object.clone.call(null, this__11079.hashobj);
    new_hashobj__11086[h__11080] = cljs.core.array.call(null, k, v);
    return new cljs.core.HashMap(this__11079.meta, this__11079.count + 1, new_hashobj__11086)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_ = function(coll, k) {
  var this__11087 = this;
  var bucket__11088 = this__11087.hashobj[cljs.core.hash.call(null, k)];
  var i__11089 = cljs.core.truth_(bucket__11088) ? cljs.core.scan_array.call(null, 2, k, bucket__11088) : null;
  if(cljs.core.truth_(i__11089)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__11116 = null;
  var G__11116__11117 = function(tsym11090, k) {
    var this__11092 = this;
    var tsym11090__11093 = this;
    var coll__11094 = tsym11090__11093;
    return cljs.core._lookup.call(null, coll__11094, k)
  };
  var G__11116__11118 = function(tsym11091, k, not_found) {
    var this__11095 = this;
    var tsym11091__11096 = this;
    var coll__11097 = tsym11091__11096;
    return cljs.core._lookup.call(null, coll__11097, k, not_found)
  };
  G__11116 = function(tsym11091, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11116__11117.call(this, tsym11091, k);
      case 3:
        return G__11116__11118.call(this, tsym11091, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11116
}();
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj = function(coll, entry) {
  var this__11098 = this;
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, entry))) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11099 = this;
  if(cljs.core.truth_(this__11099.count > 0)) {
    var hashes__11100 = cljs.core.js_keys.call(null, this__11099.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__11073_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__11099.hashobj[p1__11073_SHARP_]))
    }, hashes__11100)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11101 = this;
  return this__11101.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11102 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11103 = this;
  return new cljs.core.HashMap(meta, this__11103.count, this__11103.hashobj)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11104 = this;
  return this__11104.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11105 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__11105.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc = function(coll, k) {
  var this__11106 = this;
  var h__11107 = cljs.core.hash.call(null, k);
  var bucket__11108 = this__11106.hashobj[h__11107];
  var i__11109 = cljs.core.truth_(bucket__11108) ? cljs.core.scan_array.call(null, 2, k, bucket__11108) : null;
  if(cljs.core.truth_(cljs.core.not.call(null, i__11109))) {
    return coll
  }else {
    var new_hashobj__11110 = goog.object.clone.call(null, this__11106.hashobj);
    if(cljs.core.truth_(3 > bucket__11108.length)) {
      cljs.core.js_delete.call(null, new_hashobj__11110, h__11107)
    }else {
      var new_bucket__11111 = cljs.core.aclone.call(null, bucket__11108);
      new_bucket__11111.splice(i__11109, 2);
      new_hashobj__11110[h__11107] = new_bucket__11111
    }
    return new cljs.core.HashMap(this__11106.meta, this__11106.count - 1, new_hashobj__11110)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, cljs.core.js_obj.call(null));
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__11120 = ks.length;
  var i__11121 = 0;
  var out__11122 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(cljs.core.truth_(i__11121 < len__11120)) {
      var G__11123 = i__11121 + 1;
      var G__11124 = cljs.core.assoc.call(null, out__11122, ks[i__11121], vs[i__11121]);
      i__11121 = G__11123;
      out__11122 = G__11124;
      continue
    }else {
      return out__11122
    }
    break
  }
};
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__11125 = cljs.core.seq.call(null, keyvals);
    var out__11126 = cljs.core.HashMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__11125)) {
        var G__11127 = cljs.core.nnext.call(null, in$__11125);
        var G__11128 = cljs.core.assoc.call(null, out__11126, cljs.core.first.call(null, in$__11125), cljs.core.second.call(null, in$__11125));
        in$__11125 = G__11127;
        out__11126 = G__11128;
        continue
      }else {
        return out__11126
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__11129) {
    var keyvals = cljs.core.seq(arglist__11129);
    return hash_map__delegate.call(this, keyvals)
  };
  return hash_map
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__11130_SHARP_, p2__11131_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____11132 = p1__11130_SHARP_;
          if(cljs.core.truth_(or__3548__auto____11132)) {
            return or__3548__auto____11132
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__11131_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__11133) {
    var maps = cljs.core.seq(arglist__11133);
    return merge__delegate.call(this, maps)
  };
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__11136 = function(m, e) {
        var k__11134 = cljs.core.first.call(null, e);
        var v__11135 = cljs.core.second.call(null, e);
        if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, m, k__11134))) {
          return cljs.core.assoc.call(null, m, k__11134, f.call(null, cljs.core.get.call(null, m, k__11134), v__11135))
        }else {
          return cljs.core.assoc.call(null, m, k__11134, v__11135)
        }
      };
      var merge2__11138 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__11136, function() {
          var or__3548__auto____11137 = m1;
          if(cljs.core.truth_(or__3548__auto____11137)) {
            return or__3548__auto____11137
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__11138, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__11139) {
    var f = cljs.core.first(arglist__11139);
    var maps = cljs.core.rest(arglist__11139);
    return merge_with__delegate.call(this, f, maps)
  };
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__11141 = cljs.core.ObjMap.fromObject([], {});
  var keys__11142 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__11142)) {
      var key__11143 = cljs.core.first.call(null, keys__11142);
      var entry__11144 = cljs.core.get.call(null, map, key__11143, "\ufdd0'user/not-found");
      var G__11145 = cljs.core.truth_(cljs.core.not_EQ_.call(null, entry__11144, "\ufdd0'user/not-found")) ? cljs.core.assoc.call(null, ret__11141, key__11143, entry__11144) : ret__11141;
      var G__11146 = cljs.core.next.call(null, keys__11142);
      ret__11141 = G__11145;
      keys__11142 = G__11146;
      continue
    }else {
      return ret__11141
    }
    break
  }
};
cljs.core.Set = function(meta, hash_map) {
  this.meta = meta;
  this.hash_map = hash_map
};
cljs.core.Set.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Set")
};
cljs.core.Set.prototype.cljs$core$IHash$ = true;
cljs.core.Set.prototype.cljs$core$IHash$_hash = function(coll) {
  var this__11147 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.Set.prototype.cljs$core$ILookup$ = true;
cljs.core.Set.prototype.cljs$core$ILookup$_lookup = function() {
  var G__11168 = null;
  var G__11168__11169 = function(coll, v) {
    var this__11148 = this;
    return cljs.core._lookup.call(null, coll, v, null)
  };
  var G__11168__11170 = function(coll, v, not_found) {
    var this__11149 = this;
    if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__11149.hash_map, v))) {
      return v
    }else {
      return not_found
    }
  };
  G__11168 = function(coll, v, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11168__11169.call(this, coll, v);
      case 3:
        return G__11168__11170.call(this, coll, v, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11168
}();
cljs.core.Set.prototype.cljs$core$IFn$ = true;
cljs.core.Set.prototype.call = function() {
  var G__11172 = null;
  var G__11172__11173 = function(tsym11150, k) {
    var this__11152 = this;
    var tsym11150__11153 = this;
    var coll__11154 = tsym11150__11153;
    return cljs.core._lookup.call(null, coll__11154, k)
  };
  var G__11172__11174 = function(tsym11151, k, not_found) {
    var this__11155 = this;
    var tsym11151__11156 = this;
    var coll__11157 = tsym11151__11156;
    return cljs.core._lookup.call(null, coll__11157, k, not_found)
  };
  G__11172 = function(tsym11151, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11172__11173.call(this, tsym11151, k);
      case 3:
        return G__11172__11174.call(this, tsym11151, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11172
}();
cljs.core.Set.prototype.cljs$core$ICollection$ = true;
cljs.core.Set.prototype.cljs$core$ICollection$_conj = function(coll, o) {
  var this__11158 = this;
  return new cljs.core.Set(this__11158.meta, cljs.core.assoc.call(null, this__11158.hash_map, o, null))
};
cljs.core.Set.prototype.cljs$core$ISeqable$ = true;
cljs.core.Set.prototype.cljs$core$ISeqable$_seq = function(coll) {
  var this__11159 = this;
  return cljs.core.keys.call(null, this__11159.hash_map)
};
cljs.core.Set.prototype.cljs$core$ISet$ = true;
cljs.core.Set.prototype.cljs$core$ISet$_disjoin = function(coll, v) {
  var this__11160 = this;
  return new cljs.core.Set(this__11160.meta, cljs.core.dissoc.call(null, this__11160.hash_map, v))
};
cljs.core.Set.prototype.cljs$core$ICounted$ = true;
cljs.core.Set.prototype.cljs$core$ICounted$_count = function(coll) {
  var this__11161 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.Set.prototype.cljs$core$IEquiv$ = true;
cljs.core.Set.prototype.cljs$core$IEquiv$_equiv = function(coll, other) {
  var this__11162 = this;
  var and__3546__auto____11163 = cljs.core.set_QMARK_.call(null, other);
  if(cljs.core.truth_(and__3546__auto____11163)) {
    var and__3546__auto____11164 = cljs.core._EQ_.call(null, cljs.core.count.call(null, coll), cljs.core.count.call(null, other));
    if(cljs.core.truth_(and__3546__auto____11164)) {
      return cljs.core.every_QMARK_.call(null, function(p1__11140_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__11140_SHARP_)
      }, other)
    }else {
      return and__3546__auto____11164
    }
  }else {
    return and__3546__auto____11163
  }
};
cljs.core.Set.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Set.prototype.cljs$core$IWithMeta$_with_meta = function(coll, meta) {
  var this__11165 = this;
  return new cljs.core.Set(meta, this__11165.hash_map)
};
cljs.core.Set.prototype.cljs$core$IMeta$ = true;
cljs.core.Set.prototype.cljs$core$IMeta$_meta = function(coll) {
  var this__11166 = this;
  return this__11166.meta
};
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Set.prototype.cljs$core$IEmptyableCollection$_empty = function(coll) {
  var this__11167 = this;
  return cljs.core.with_meta.call(null, cljs.core.Set.EMPTY, this__11167.meta)
};
cljs.core.Set;
cljs.core.Set.EMPTY = new cljs.core.Set(null, cljs.core.hash_map.call(null));
cljs.core.set = function set(coll) {
  var in$__11177 = cljs.core.seq.call(null, coll);
  var out__11178 = cljs.core.Set.EMPTY;
  while(true) {
    if(cljs.core.truth_(cljs.core.not.call(null, cljs.core.empty_QMARK_.call(null, in$__11177)))) {
      var G__11179 = cljs.core.rest.call(null, in$__11177);
      var G__11180 = cljs.core.conj.call(null, out__11178, cljs.core.first.call(null, in$__11177));
      in$__11177 = G__11179;
      out__11178 = G__11180;
      continue
    }else {
      return out__11178
    }
    break
  }
};
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.truth_(cljs.core.vector_QMARK_.call(null, coll))) {
    var n__11181 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____11182 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____11182)) {
        var e__11183 = temp__3695__auto____11182;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__11183))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__11181, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__11176_SHARP_) {
      var temp__3695__auto____11184 = cljs.core.find.call(null, smap, p1__11176_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____11184)) {
        var e__11185 = temp__3695__auto____11184;
        return cljs.core.second.call(null, e__11185)
      }else {
        return p1__11176_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__11193 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__11186, seen) {
        while(true) {
          var vec__11187__11188 = p__11186;
          var f__11189 = cljs.core.nth.call(null, vec__11187__11188, 0, null);
          var xs__11190 = vec__11187__11188;
          var temp__3698__auto____11191 = cljs.core.seq.call(null, xs__11190);
          if(cljs.core.truth_(temp__3698__auto____11191)) {
            var s__11192 = temp__3698__auto____11191;
            if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, seen, f__11189))) {
              var G__11194 = cljs.core.rest.call(null, s__11192);
              var G__11195 = seen;
              p__11186 = G__11194;
              seen = G__11195;
              continue
            }else {
              return cljs.core.cons.call(null, f__11189, step.call(null, cljs.core.rest.call(null, s__11192), cljs.core.conj.call(null, seen, f__11189)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__11193.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__11196 = cljs.core.Vector.fromArray([]);
  var s__11197 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__11197))) {
      var G__11198 = cljs.core.conj.call(null, ret__11196, cljs.core.first.call(null, s__11197));
      var G__11199 = cljs.core.next.call(null, s__11197);
      ret__11196 = G__11198;
      s__11197 = G__11199;
      continue
    }else {
      return cljs.core.seq.call(null, ret__11196)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.truth_(cljs.core.string_QMARK_.call(null, x))) {
    return x
  }else {
    if(cljs.core.truth_(function() {
      var or__3548__auto____11200 = cljs.core.keyword_QMARK_.call(null, x);
      if(cljs.core.truth_(or__3548__auto____11200)) {
        return or__3548__auto____11200
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }())) {
      var i__11201 = x.lastIndexOf("/");
      if(cljs.core.truth_(i__11201 < 0)) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__11201 + 1)
      }
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        throw new Error(cljs.core.str.call(null, "Doesn't support name: ", x));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(cljs.core.truth_(function() {
    var or__3548__auto____11202 = cljs.core.keyword_QMARK_.call(null, x);
    if(cljs.core.truth_(or__3548__auto____11202)) {
      return or__3548__auto____11202
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }())) {
    var i__11203 = x.lastIndexOf("/");
    if(cljs.core.truth_(i__11203 > -1)) {
      return cljs.core.subs.call(null, x, 2, i__11203)
    }else {
      return null
    }
  }else {
    throw new Error(cljs.core.str.call(null, "Doesn't support namespace: ", x));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__11206 = cljs.core.ObjMap.fromObject([], {});
  var ks__11207 = cljs.core.seq.call(null, keys);
  var vs__11208 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____11209 = ks__11207;
      if(cljs.core.truth_(and__3546__auto____11209)) {
        return vs__11208
      }else {
        return and__3546__auto____11209
      }
    }())) {
      var G__11210 = cljs.core.assoc.call(null, map__11206, cljs.core.first.call(null, ks__11207), cljs.core.first.call(null, vs__11208));
      var G__11211 = cljs.core.next.call(null, ks__11207);
      var G__11212 = cljs.core.next.call(null, vs__11208);
      map__11206 = G__11210;
      ks__11207 = G__11211;
      vs__11208 = G__11212;
      continue
    }else {
      return map__11206
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__11215 = function(k, x) {
    return x
  };
  var max_key__11216 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) > k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var max_key__11217 = function() {
    var G__11219__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11204_SHARP_, p2__11205_SHARP_) {
        return max_key.call(null, k, p1__11204_SHARP_, p2__11205_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__11219 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11219__delegate.call(this, k, x, y, more)
    };
    G__11219.cljs$lang$maxFixedArity = 3;
    G__11219.cljs$lang$applyTo = function(arglist__11220) {
      var k = cljs.core.first(arglist__11220);
      var x = cljs.core.first(cljs.core.next(arglist__11220));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11220)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11220)));
      return G__11219__delegate.call(this, k, x, y, more)
    };
    return G__11219
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__11215.call(this, k, x);
      case 3:
        return max_key__11216.call(this, k, x, y);
      default:
        return max_key__11217.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__11217.cljs$lang$applyTo;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__11221 = function(k, x) {
    return x
  };
  var min_key__11222 = function(k, x, y) {
    if(cljs.core.truth_(k.call(null, x) < k.call(null, y))) {
      return x
    }else {
      return y
    }
  };
  var min_key__11223 = function() {
    var G__11225__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__11213_SHARP_, p2__11214_SHARP_) {
        return min_key.call(null, k, p1__11213_SHARP_, p2__11214_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__11225 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11225__delegate.call(this, k, x, y, more)
    };
    G__11225.cljs$lang$maxFixedArity = 3;
    G__11225.cljs$lang$applyTo = function(arglist__11226) {
      var k = cljs.core.first(arglist__11226);
      var x = cljs.core.first(cljs.core.next(arglist__11226));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11226)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11226)));
      return G__11225__delegate.call(this, k, x, y, more)
    };
    return G__11225
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__11221.call(this, k, x);
      case 3:
        return min_key__11222.call(this, k, x, y);
      default:
        return min_key__11223.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__11223.cljs$lang$applyTo;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__11229 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__11230 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____11227 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____11227)) {
        var s__11228 = temp__3698__auto____11227;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__11228), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__11228)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__11229.call(this, n, step);
      case 3:
        return partition_all__11230.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____11232 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____11232)) {
      var s__11233 = temp__3698__auto____11232;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__11233)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__11233), take_while.call(null, pred, cljs.core.rest.call(null, s__11233)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.Range = function(meta, start, end, step) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step
};
cljs.core.Range.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash = function(rng) {
  var this__11234 = this;
  return cljs.core.hash_coll.call(null, rng)
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj = function(rng, o) {
  var this__11235 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce = function() {
  var G__11251 = null;
  var G__11251__11252 = function(rng, f) {
    var this__11236 = this;
    return cljs.core.ci_reduce.call(null, rng, f)
  };
  var G__11251__11253 = function(rng, f, s) {
    var this__11237 = this;
    return cljs.core.ci_reduce.call(null, rng, f, s)
  };
  G__11251 = function(rng, f, s) {
    switch(arguments.length) {
      case 2:
        return G__11251__11252.call(this, rng, f);
      case 3:
        return G__11251__11253.call(this, rng, f, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11251
}();
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq = function(rng) {
  var this__11238 = this;
  var comp__11239 = cljs.core.truth_(this__11238.step > 0) ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__11239.call(null, this__11238.start, this__11238.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count = function(rng) {
  var this__11240 = this;
  if(cljs.core.truth_(cljs.core.not.call(null, cljs.core._seq.call(null, rng)))) {
    return 0
  }else {
    return Math["ceil"].call(null, (this__11240.end - this__11240.start) / this__11240.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first = function(rng) {
  var this__11241 = this;
  return this__11241.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest = function(rng) {
  var this__11242 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__11242.meta, this__11242.start + this__11242.step, this__11242.end, this__11242.step)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv = function(rng, other) {
  var this__11243 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta = function(rng, meta) {
  var this__11244 = this;
  return new cljs.core.Range(meta, this__11244.start, this__11244.end, this__11244.step)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta = function(rng) {
  var this__11245 = this;
  return this__11245.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth = function() {
  var G__11255 = null;
  var G__11255__11256 = function(rng, n) {
    var this__11246 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__11246.start + n * this__11246.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____11247 = this__11246.start > this__11246.end;
        if(cljs.core.truth_(and__3546__auto____11247)) {
          return cljs.core._EQ_.call(null, this__11246.step, 0)
        }else {
          return and__3546__auto____11247
        }
      }())) {
        return this__11246.start
      }else {
        throw new Error("Index out of bounds");
      }
    }
  };
  var G__11255__11257 = function(rng, n, not_found) {
    var this__11248 = this;
    if(cljs.core.truth_(n < cljs.core._count.call(null, rng))) {
      return this__11248.start + n * this__11248.step
    }else {
      if(cljs.core.truth_(function() {
        var and__3546__auto____11249 = this__11248.start > this__11248.end;
        if(cljs.core.truth_(and__3546__auto____11249)) {
          return cljs.core._EQ_.call(null, this__11248.step, 0)
        }else {
          return and__3546__auto____11249
        }
      }())) {
        return this__11248.start
      }else {
        return not_found
      }
    }
  };
  G__11255 = function(rng, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__11255__11256.call(this, rng, n);
      case 3:
        return G__11255__11257.call(this, rng, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__11255
}();
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty = function(rng) {
  var this__11250 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__11250.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__11259 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__11260 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__11261 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__11262 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__11259.call(this);
      case 1:
        return range__11260.call(this, start);
      case 2:
        return range__11261.call(this, start, end);
      case 3:
        return range__11262.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____11264 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____11264)) {
      var s__11265 = temp__3698__auto____11264;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__11265), take_nth.call(null, n, cljs.core.drop.call(null, n, s__11265)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.Vector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____11267 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____11267)) {
      var s__11268 = temp__3698__auto____11267;
      var fst__11269 = cljs.core.first.call(null, s__11268);
      var fv__11270 = f.call(null, fst__11269);
      var run__11271 = cljs.core.cons.call(null, fst__11269, cljs.core.take_while.call(null, function(p1__11266_SHARP_) {
        return cljs.core._EQ_.call(null, fv__11270, f.call(null, p1__11266_SHARP_))
      }, cljs.core.next.call(null, s__11268)));
      return cljs.core.cons.call(null, run__11271, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__11271), s__11268))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__11286 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____11282 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____11282)) {
        var s__11283 = temp__3695__auto____11282;
        return reductions.call(null, f, cljs.core.first.call(null, s__11283), cljs.core.rest.call(null, s__11283))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__11287 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____11284 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____11284)) {
        var s__11285 = temp__3698__auto____11284;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__11285)), cljs.core.rest.call(null, s__11285))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__11286.call(this, f, init);
      case 3:
        return reductions__11287.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__11290 = function(f) {
    return function() {
      var G__11295 = null;
      var G__11295__11296 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__11295__11297 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__11295__11298 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__11295__11299 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__11295__11300 = function() {
        var G__11302__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__11302 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11302__delegate.call(this, x, y, z, args)
        };
        G__11302.cljs$lang$maxFixedArity = 3;
        G__11302.cljs$lang$applyTo = function(arglist__11303) {
          var x = cljs.core.first(arglist__11303);
          var y = cljs.core.first(cljs.core.next(arglist__11303));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11303)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11303)));
          return G__11302__delegate.call(this, x, y, z, args)
        };
        return G__11302
      }();
      G__11295 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11295__11296.call(this);
          case 1:
            return G__11295__11297.call(this, x);
          case 2:
            return G__11295__11298.call(this, x, y);
          case 3:
            return G__11295__11299.call(this, x, y, z);
          default:
            return G__11295__11300.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11295.cljs$lang$maxFixedArity = 3;
      G__11295.cljs$lang$applyTo = G__11295__11300.cljs$lang$applyTo;
      return G__11295
    }()
  };
  var juxt__11291 = function(f, g) {
    return function() {
      var G__11304 = null;
      var G__11304__11305 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__11304__11306 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__11304__11307 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__11304__11308 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__11304__11309 = function() {
        var G__11311__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__11311 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11311__delegate.call(this, x, y, z, args)
        };
        G__11311.cljs$lang$maxFixedArity = 3;
        G__11311.cljs$lang$applyTo = function(arglist__11312) {
          var x = cljs.core.first(arglist__11312);
          var y = cljs.core.first(cljs.core.next(arglist__11312));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11312)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11312)));
          return G__11311__delegate.call(this, x, y, z, args)
        };
        return G__11311
      }();
      G__11304 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11304__11305.call(this);
          case 1:
            return G__11304__11306.call(this, x);
          case 2:
            return G__11304__11307.call(this, x, y);
          case 3:
            return G__11304__11308.call(this, x, y, z);
          default:
            return G__11304__11309.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11304.cljs$lang$maxFixedArity = 3;
      G__11304.cljs$lang$applyTo = G__11304__11309.cljs$lang$applyTo;
      return G__11304
    }()
  };
  var juxt__11292 = function(f, g, h) {
    return function() {
      var G__11313 = null;
      var G__11313__11314 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__11313__11315 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__11313__11316 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__11313__11317 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__11313__11318 = function() {
        var G__11320__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__11320 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__11320__delegate.call(this, x, y, z, args)
        };
        G__11320.cljs$lang$maxFixedArity = 3;
        G__11320.cljs$lang$applyTo = function(arglist__11321) {
          var x = cljs.core.first(arglist__11321);
          var y = cljs.core.first(cljs.core.next(arglist__11321));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11321)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11321)));
          return G__11320__delegate.call(this, x, y, z, args)
        };
        return G__11320
      }();
      G__11313 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__11313__11314.call(this);
          case 1:
            return G__11313__11315.call(this, x);
          case 2:
            return G__11313__11316.call(this, x, y);
          case 3:
            return G__11313__11317.call(this, x, y, z);
          default:
            return G__11313__11318.apply(this, arguments)
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__11313.cljs$lang$maxFixedArity = 3;
      G__11313.cljs$lang$applyTo = G__11313__11318.cljs$lang$applyTo;
      return G__11313
    }()
  };
  var juxt__11293 = function() {
    var G__11322__delegate = function(f, g, h, fs) {
      var fs__11289 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__11323 = null;
        var G__11323__11324 = function() {
          return cljs.core.reduce.call(null, function(p1__11272_SHARP_, p2__11273_SHARP_) {
            return cljs.core.conj.call(null, p1__11272_SHARP_, p2__11273_SHARP_.call(null))
          }, cljs.core.Vector.fromArray([]), fs__11289)
        };
        var G__11323__11325 = function(x) {
          return cljs.core.reduce.call(null, function(p1__11274_SHARP_, p2__11275_SHARP_) {
            return cljs.core.conj.call(null, p1__11274_SHARP_, p2__11275_SHARP_.call(null, x))
          }, cljs.core.Vector.fromArray([]), fs__11289)
        };
        var G__11323__11326 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__11276_SHARP_, p2__11277_SHARP_) {
            return cljs.core.conj.call(null, p1__11276_SHARP_, p2__11277_SHARP_.call(null, x, y))
          }, cljs.core.Vector.fromArray([]), fs__11289)
        };
        var G__11323__11327 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__11278_SHARP_, p2__11279_SHARP_) {
            return cljs.core.conj.call(null, p1__11278_SHARP_, p2__11279_SHARP_.call(null, x, y, z))
          }, cljs.core.Vector.fromArray([]), fs__11289)
        };
        var G__11323__11328 = function() {
          var G__11330__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__11280_SHARP_, p2__11281_SHARP_) {
              return cljs.core.conj.call(null, p1__11280_SHARP_, cljs.core.apply.call(null, p2__11281_SHARP_, x, y, z, args))
            }, cljs.core.Vector.fromArray([]), fs__11289)
          };
          var G__11330 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__11330__delegate.call(this, x, y, z, args)
          };
          G__11330.cljs$lang$maxFixedArity = 3;
          G__11330.cljs$lang$applyTo = function(arglist__11331) {
            var x = cljs.core.first(arglist__11331);
            var y = cljs.core.first(cljs.core.next(arglist__11331));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11331)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11331)));
            return G__11330__delegate.call(this, x, y, z, args)
          };
          return G__11330
        }();
        G__11323 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__11323__11324.call(this);
            case 1:
              return G__11323__11325.call(this, x);
            case 2:
              return G__11323__11326.call(this, x, y);
            case 3:
              return G__11323__11327.call(this, x, y, z);
            default:
              return G__11323__11328.apply(this, arguments)
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__11323.cljs$lang$maxFixedArity = 3;
        G__11323.cljs$lang$applyTo = G__11323__11328.cljs$lang$applyTo;
        return G__11323
      }()
    };
    var G__11322 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__11322__delegate.call(this, f, g, h, fs)
    };
    G__11322.cljs$lang$maxFixedArity = 3;
    G__11322.cljs$lang$applyTo = function(arglist__11332) {
      var f = cljs.core.first(arglist__11332);
      var g = cljs.core.first(cljs.core.next(arglist__11332));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11332)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__11332)));
      return G__11322__delegate.call(this, f, g, h, fs)
    };
    return G__11322
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__11290.call(this, f);
      case 2:
        return juxt__11291.call(this, f, g);
      case 3:
        return juxt__11292.call(this, f, g, h);
      default:
        return juxt__11293.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__11293.cljs$lang$applyTo;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__11334 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__11337 = cljs.core.next.call(null, coll);
        coll = G__11337;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__11335 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____11333 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____11333)) {
          return n > 0
        }else {
          return and__3546__auto____11333
        }
      }())) {
        var G__11338 = n - 1;
        var G__11339 = cljs.core.next.call(null, coll);
        n = G__11338;
        coll = G__11339;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__11334.call(this, n);
      case 2:
        return dorun__11335.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__11340 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__11341 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__11340.call(this, n);
      case 2:
        return doall__11341.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__11343 = re.exec(s);
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__11343), s))) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__11343), 1))) {
      return cljs.core.first.call(null, matches__11343)
    }else {
      return cljs.core.vec.call(null, matches__11343)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__11344 = re.exec(s);
  if(cljs.core.truth_(matches__11344 === null)) {
    return null
  }else {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.count.call(null, matches__11344), 1))) {
      return cljs.core.first.call(null, matches__11344)
    }else {
      return cljs.core.vec.call(null, matches__11344)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__11345 = cljs.core.re_find.call(null, re, s);
  var match_idx__11346 = s.search(re);
  var match_str__11347 = cljs.core.truth_(cljs.core.coll_QMARK_.call(null, match_data__11345)) ? cljs.core.first.call(null, match_data__11345) : match_data__11345;
  var post_match__11348 = cljs.core.subs.call(null, s, match_idx__11346 + cljs.core.count.call(null, match_str__11347));
  if(cljs.core.truth_(match_data__11345)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__11345, re_seq.call(null, re, post_match__11348))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__11350__11351 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___11352 = cljs.core.nth.call(null, vec__11350__11351, 0, null);
  var flags__11353 = cljs.core.nth.call(null, vec__11350__11351, 1, null);
  var pattern__11354 = cljs.core.nth.call(null, vec__11350__11351, 2, null);
  return new RegExp(pattern__11354, flags__11353)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.Vector.fromArray([sep]), cljs.core.map.call(null, function(p1__11349_SHARP_) {
    return print_one.call(null, p1__11349_SHARP_, opts)
  }, coll))), cljs.core.Vector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(cljs.core.truth_(obj === null)) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(cljs.core.truth_(void 0 === obj)) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____11355 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____11355)) {
            var and__3546__auto____11359 = function() {
              var x__450__auto____11356 = obj;
              if(cljs.core.truth_(function() {
                var and__3546__auto____11357 = x__450__auto____11356;
                if(cljs.core.truth_(and__3546__auto____11357)) {
                  var and__3546__auto____11358 = x__450__auto____11356.cljs$core$IMeta$;
                  if(cljs.core.truth_(and__3546__auto____11358)) {
                    return cljs.core.not.call(null, x__450__auto____11356.hasOwnProperty("cljs$core$IMeta$"))
                  }else {
                    return and__3546__auto____11358
                  }
                }else {
                  return and__3546__auto____11357
                }
              }())) {
                return true
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, x__450__auto____11356)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____11359)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____11359
            }
          }else {
            return and__3546__auto____11355
          }
        }()) ? cljs.core.concat.call(null, cljs.core.Vector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.Vector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var x__450__auto____11360 = obj;
          if(cljs.core.truth_(function() {
            var and__3546__auto____11361 = x__450__auto____11360;
            if(cljs.core.truth_(and__3546__auto____11361)) {
              var and__3546__auto____11362 = x__450__auto____11360.cljs$core$IPrintable$;
              if(cljs.core.truth_(and__3546__auto____11362)) {
                return cljs.core.not.call(null, x__450__auto____11360.hasOwnProperty("cljs$core$IPrintable$"))
              }else {
                return and__3546__auto____11362
              }
            }else {
              return and__3546__auto____11361
            }
          }())) {
            return true
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, x__450__auto____11360)
          }
        }()) ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.list.call(null, "#<", cljs.core.str.call(null, obj), ">"))
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  var first_obj__11363 = cljs.core.first.call(null, objs);
  var sb__11364 = new goog.string.StringBuffer;
  var G__11365__11366 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__11365__11366)) {
    var obj__11367 = cljs.core.first.call(null, G__11365__11366);
    var G__11365__11368 = G__11365__11366;
    while(true) {
      if(cljs.core.truth_(obj__11367 === first_obj__11363)) {
      }else {
        sb__11364.append(" ")
      }
      var G__11369__11370 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__11367, opts));
      if(cljs.core.truth_(G__11369__11370)) {
        var string__11371 = cljs.core.first.call(null, G__11369__11370);
        var G__11369__11372 = G__11369__11370;
        while(true) {
          sb__11364.append(string__11371);
          var temp__3698__auto____11373 = cljs.core.next.call(null, G__11369__11372);
          if(cljs.core.truth_(temp__3698__auto____11373)) {
            var G__11369__11374 = temp__3698__auto____11373;
            var G__11377 = cljs.core.first.call(null, G__11369__11374);
            var G__11378 = G__11369__11374;
            string__11371 = G__11377;
            G__11369__11372 = G__11378;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____11375 = cljs.core.next.call(null, G__11365__11368);
      if(cljs.core.truth_(temp__3698__auto____11375)) {
        var G__11365__11376 = temp__3698__auto____11375;
        var G__11379 = cljs.core.first.call(null, G__11365__11376);
        var G__11380 = G__11365__11376;
        obj__11367 = G__11379;
        G__11365__11368 = G__11380;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return cljs.core.str.call(null, sb__11364)
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__11381 = cljs.core.first.call(null, objs);
  var G__11382__11383 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__11382__11383)) {
    var obj__11384 = cljs.core.first.call(null, G__11382__11383);
    var G__11382__11385 = G__11382__11383;
    while(true) {
      if(cljs.core.truth_(obj__11384 === first_obj__11381)) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__11386__11387 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__11384, opts));
      if(cljs.core.truth_(G__11386__11387)) {
        var string__11388 = cljs.core.first.call(null, G__11386__11387);
        var G__11386__11389 = G__11386__11387;
        while(true) {
          cljs.core.string_print.call(null, string__11388);
          var temp__3698__auto____11390 = cljs.core.next.call(null, G__11386__11389);
          if(cljs.core.truth_(temp__3698__auto____11390)) {
            var G__11386__11391 = temp__3698__auto____11390;
            var G__11394 = cljs.core.first.call(null, G__11386__11391);
            var G__11395 = G__11386__11391;
            string__11388 = G__11394;
            G__11386__11389 = G__11395;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____11392 = cljs.core.next.call(null, G__11382__11385);
      if(cljs.core.truth_(temp__3698__auto____11392)) {
        var G__11382__11393 = temp__3698__auto____11392;
        var G__11396 = cljs.core.first.call(null, G__11382__11393);
        var G__11397 = G__11382__11393;
        obj__11384 = G__11396;
        G__11382__11385 = G__11397;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__11398) {
    var objs = cljs.core.seq(arglist__11398);
    return pr_str__delegate.call(this, objs)
  };
  return pr_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__11399) {
    var objs = cljs.core.seq(arglist__11399);
    return pr__delegate.call(this, objs)
  };
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__11400) {
    var objs = cljs.core.seq(arglist__11400);
    return cljs_core_print__delegate.call(this, objs)
  };
  return cljs_core_print
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__11401) {
    var objs = cljs.core.seq(arglist__11401);
    return println__delegate.call(this, objs)
  };
  return println
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__11402) {
    var objs = cljs.core.seq(arglist__11402);
    return prn__delegate.call(this, objs)
  };
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__11403 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11403, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, n))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, cljs.core.str.call(null, bool))
};
cljs.core.Set.prototype.cljs$core$IPrintable$ = true;
cljs.core.Set.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.truth_(cljs.core.keyword_QMARK_.call(null, obj))) {
    return cljs.core.list.call(null, cljs.core.str.call(null, ":", function() {
      var temp__3698__auto____11404 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____11404)) {
        var nspc__11405 = temp__3698__auto____11404;
        return cljs.core.str.call(null, nspc__11405, "/")
      }else {
        return null
      }
    }(), cljs.core.name.call(null, obj)))
  }else {
    if(cljs.core.truth_(cljs.core.symbol_QMARK_.call(null, obj))) {
      return cljs.core.list.call(null, cljs.core.str.call(null, function() {
        var temp__3698__auto____11406 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____11406)) {
          var nspc__11407 = temp__3698__auto____11406;
          return cljs.core.str.call(null, nspc__11407, "/")
        }else {
          return null
        }
      }(), cljs.core.name.call(null, obj)))
    }else {
      if(cljs.core.truth_("\ufdd0'else")) {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", cljs.core.str.call(null, this$), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq = function(coll, opts) {
  var pr_pair__11408 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__11408, "{", ", ", "}", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches
};
cljs.core.Atom.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__11409 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches = function(this$, oldval, newval) {
  var this__11410 = this;
  var G__11411__11412 = cljs.core.seq.call(null, this__11410.watches);
  if(cljs.core.truth_(G__11411__11412)) {
    var G__11414__11416 = cljs.core.first.call(null, G__11411__11412);
    var vec__11415__11417 = G__11414__11416;
    var key__11418 = cljs.core.nth.call(null, vec__11415__11417, 0, null);
    var f__11419 = cljs.core.nth.call(null, vec__11415__11417, 1, null);
    var G__11411__11420 = G__11411__11412;
    var G__11414__11421 = G__11414__11416;
    var G__11411__11422 = G__11411__11420;
    while(true) {
      var vec__11423__11424 = G__11414__11421;
      var key__11425 = cljs.core.nth.call(null, vec__11423__11424, 0, null);
      var f__11426 = cljs.core.nth.call(null, vec__11423__11424, 1, null);
      var G__11411__11427 = G__11411__11422;
      f__11426.call(null, key__11425, this$, oldval, newval);
      var temp__3698__auto____11428 = cljs.core.next.call(null, G__11411__11427);
      if(cljs.core.truth_(temp__3698__auto____11428)) {
        var G__11411__11429 = temp__3698__auto____11428;
        var G__11436 = cljs.core.first.call(null, G__11411__11429);
        var G__11437 = G__11411__11429;
        G__11414__11421 = G__11436;
        G__11411__11422 = G__11437;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch = function(this$, key, f) {
  var this__11430 = this;
  return this$.watches = cljs.core.assoc.call(null, this__11430.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch = function(this$, key) {
  var this__11431 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__11431.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq = function(a, opts) {
  var this__11432 = this;
  return cljs.core.concat.call(null, cljs.core.Vector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__11432.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta = function(_) {
  var this__11433 = this;
  return this__11433.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__11434 = this;
  return this__11434.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv = function(o, other) {
  var this__11435 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__11444 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__11445 = function() {
    var G__11447__delegate = function(x, p__11438) {
      var map__11439__11440 = p__11438;
      var map__11439__11441 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__11439__11440)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11439__11440) : map__11439__11440;
      var validator__11442 = cljs.core.get.call(null, map__11439__11441, "\ufdd0'validator");
      var meta__11443 = cljs.core.get.call(null, map__11439__11441, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__11443, validator__11442, null)
    };
    var G__11447 = function(x, var_args) {
      var p__11438 = null;
      if(goog.isDef(var_args)) {
        p__11438 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11447__delegate.call(this, x, p__11438)
    };
    G__11447.cljs$lang$maxFixedArity = 1;
    G__11447.cljs$lang$applyTo = function(arglist__11448) {
      var x = cljs.core.first(arglist__11448);
      var p__11438 = cljs.core.rest(arglist__11448);
      return G__11447__delegate.call(this, x, p__11438)
    };
    return G__11447
  }();
  atom = function(x, var_args) {
    var p__11438 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__11444.call(this, x);
      default:
        return atom__11445.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__11445.cljs$lang$applyTo;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____11449 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____11449)) {
    var validate__11450 = temp__3698__auto____11449;
    if(cljs.core.truth_(validate__11450.call(null, new_value))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", "Validator rejected reference state", "\n", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 3073)))));
    }
  }else {
  }
  var old_value__11451 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__11451, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___11452 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___11453 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___11454 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___11455 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___11456 = function() {
    var G__11458__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__11458 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__11458__delegate.call(this, a, f, x, y, z, more)
    };
    G__11458.cljs$lang$maxFixedArity = 5;
    G__11458.cljs$lang$applyTo = function(arglist__11459) {
      var a = cljs.core.first(arglist__11459);
      var f = cljs.core.first(cljs.core.next(arglist__11459));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__11459)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11459))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11459)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__11459)))));
      return G__11458__delegate.call(this, a, f, x, y, z, more)
    };
    return G__11458
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___11452.call(this, a, f);
      case 3:
        return swap_BANG___11453.call(this, a, f, x);
      case 4:
        return swap_BANG___11454.call(this, a, f, x, y);
      case 5:
        return swap_BANG___11455.call(this, a, f, x, y, z);
      default:
        return swap_BANG___11456.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___11456.cljs$lang$applyTo;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, a.state, oldval))) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__11460) {
    var iref = cljs.core.first(arglist__11460);
    var f = cljs.core.first(cljs.core.next(arglist__11460));
    var args = cljs.core.rest(cljs.core.next(arglist__11460));
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__11461 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__11462 = function(prefix_string) {
    if(cljs.core.truth_(cljs.core.gensym_counter === null)) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, cljs.core.str.call(null, prefix_string, cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc)))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__11461.call(this);
      case 1:
        return gensym__11462.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(f, state) {
  this.f = f;
  this.state = state
};
cljs.core.Delay.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_ = function(d) {
  var this__11464 = this;
  return cljs.core.not.call(null, cljs.core.deref.call(null, this__11464.state) === null)
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref = function(_) {
  var this__11465 = this;
  if(cljs.core.truth_(cljs.core.deref.call(null, this__11465.state))) {
  }else {
    cljs.core.swap_BANG_.call(null, this__11465.state, this__11465.f)
  }
  return cljs.core.deref.call(null, this__11465.state)
};
cljs.core.Delay;
cljs.core.delay = function() {
  var delay__delegate = function(body) {
    return new cljs.core.Delay(function() {
      return cljs.core.apply.call(null, cljs.core.identity, body)
    }, cljs.core.atom.call(null, null))
  };
  var delay = function(var_args) {
    var body = null;
    if(goog.isDef(var_args)) {
      body = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return delay__delegate.call(this, body)
  };
  delay.cljs$lang$maxFixedArity = 0;
  delay.cljs$lang$applyTo = function(arglist__11466) {
    var body = cljs.core.seq(arglist__11466);
    return delay__delegate.call(this, body)
  };
  return delay
}();
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.truth_(cljs.core.delay_QMARK_.call(null, x))) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__11467__11468 = options;
    var map__11467__11469 = cljs.core.truth_(cljs.core.seq_QMARK_.call(null, map__11467__11468)) ? cljs.core.apply.call(null, cljs.core.hash_map, map__11467__11468) : map__11467__11468;
    var keywordize_keys__11470 = cljs.core.get.call(null, map__11467__11469, "\ufdd0'keywordize-keys");
    var keyfn__11471 = cljs.core.truth_(keywordize_keys__11470) ? cljs.core.keyword : cljs.core.str;
    var f__11477 = function thisfn(x) {
      if(cljs.core.truth_(cljs.core.seq_QMARK_.call(null, x))) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.truth_(cljs.core.coll_QMARK_.call(null, x))) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.truth_(goog.isObject.call(null, x))) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__514__auto____11476 = function iter__11472(s__11473) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__11473__11474 = s__11473;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__11473__11474))) {
                        var k__11475 = cljs.core.first.call(null, s__11473__11474);
                        return cljs.core.cons.call(null, cljs.core.Vector.fromArray([keyfn__11471.call(null, k__11475), thisfn.call(null, x[k__11475])]), iter__11472.call(null, cljs.core.rest.call(null, s__11473__11474)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__514__auto____11476.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if(cljs.core.truth_("\ufdd0'else")) {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__11477.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__11478) {
    var x = cljs.core.first(arglist__11478);
    var options = cljs.core.rest(arglist__11478);
    return js__GT_clj__delegate.call(this, x, options)
  };
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__11479 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__11483__delegate = function(args) {
      var temp__3695__auto____11480 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__11479), args);
      if(cljs.core.truth_(temp__3695__auto____11480)) {
        var v__11481 = temp__3695__auto____11480;
        return v__11481
      }else {
        var ret__11482 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__11479, cljs.core.assoc, args, ret__11482);
        return ret__11482
      }
    };
    var G__11483 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__11483__delegate.call(this, args)
    };
    G__11483.cljs$lang$maxFixedArity = 0;
    G__11483.cljs$lang$applyTo = function(arglist__11484) {
      var args = cljs.core.seq(arglist__11484);
      return G__11483__delegate.call(this, args)
    };
    return G__11483
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__11486 = function(f) {
    while(true) {
      var ret__11485 = f.call(null);
      if(cljs.core.truth_(cljs.core.fn_QMARK_.call(null, ret__11485))) {
        var G__11489 = ret__11485;
        f = G__11489;
        continue
      }else {
        return ret__11485
      }
      break
    }
  };
  var trampoline__11487 = function() {
    var G__11490__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__11490 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__11490__delegate.call(this, f, args)
    };
    G__11490.cljs$lang$maxFixedArity = 1;
    G__11490.cljs$lang$applyTo = function(arglist__11491) {
      var f = cljs.core.first(arglist__11491);
      var args = cljs.core.rest(arglist__11491);
      return G__11490__delegate.call(this, f, args)
    };
    return G__11490
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__11486.call(this, f);
      default:
        return trampoline__11487.apply(this, arguments)
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__11487.cljs$lang$applyTo;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__11492 = function() {
    return rand.call(null, 1)
  };
  var rand__11493 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__11492.call(this);
      case 1:
        return rand__11493.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__11495 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__11495, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__11495, cljs.core.Vector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___11504 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___11505 = function(h, child, parent) {
    var or__3548__auto____11496 = cljs.core._EQ_.call(null, child, parent);
    if(cljs.core.truth_(or__3548__auto____11496)) {
      return or__3548__auto____11496
    }else {
      var or__3548__auto____11497 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(cljs.core.truth_(or__3548__auto____11497)) {
        return or__3548__auto____11497
      }else {
        var and__3546__auto____11498 = cljs.core.vector_QMARK_.call(null, parent);
        if(cljs.core.truth_(and__3546__auto____11498)) {
          var and__3546__auto____11499 = cljs.core.vector_QMARK_.call(null, child);
          if(cljs.core.truth_(and__3546__auto____11499)) {
            var and__3546__auto____11500 = cljs.core._EQ_.call(null, cljs.core.count.call(null, parent), cljs.core.count.call(null, child));
            if(cljs.core.truth_(and__3546__auto____11500)) {
              var ret__11501 = true;
              var i__11502 = 0;
              while(true) {
                if(cljs.core.truth_(function() {
                  var or__3548__auto____11503 = cljs.core.not.call(null, ret__11501);
                  if(cljs.core.truth_(or__3548__auto____11503)) {
                    return or__3548__auto____11503
                  }else {
                    return cljs.core._EQ_.call(null, i__11502, cljs.core.count.call(null, parent))
                  }
                }())) {
                  return ret__11501
                }else {
                  var G__11507 = isa_QMARK_.call(null, h, child.call(null, i__11502), parent.call(null, i__11502));
                  var G__11508 = i__11502 + 1;
                  ret__11501 = G__11507;
                  i__11502 = G__11508;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____11500
            }
          }else {
            return and__3546__auto____11499
          }
        }else {
          return and__3546__auto____11498
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___11504.call(this, h, child);
      case 3:
        return isa_QMARK___11505.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__11509 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__11510 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__11509.call(this, h);
      case 2:
        return parents__11510.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__11512 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__11513 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__11512.call(this, h);
      case 2:
        return ancestors__11513.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__11515 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__11516 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__11515.call(this, h);
      case 2:
        return descendants__11516.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__11526 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3365)))));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__11527 = function(h, tag, parent) {
    if(cljs.core.truth_(cljs.core.not_EQ_.call(null, tag, parent))) {
    }else {
      throw new Error(cljs.core.str.call(null, "Assert failed: ", cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 3369)))));
    }
    var tp__11521 = "\ufdd0'parents".call(null, h);
    var td__11522 = "\ufdd0'descendants".call(null, h);
    var ta__11523 = "\ufdd0'ancestors".call(null, h);
    var tf__11524 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____11525 = cljs.core.truth_(cljs.core.contains_QMARK_.call(null, tp__11521.call(null, tag), parent)) ? null : function() {
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__11523.call(null, tag), parent))) {
        throw new Error(cljs.core.str.call(null, tag, "already has", parent, "as ancestor"));
      }else {
      }
      if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, ta__11523.call(null, parent), tag))) {
        throw new Error(cljs.core.str.call(null, "Cyclic derivation:", parent, "has", tag, "as ancestor"));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__11521, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__11524.call(null, "\ufdd0'ancestors".call(null, h), tag, td__11522, parent, ta__11523), "\ufdd0'descendants":tf__11524.call(null, "\ufdd0'descendants".call(null, h), parent, ta__11523, tag, td__11522)})
    }();
    if(cljs.core.truth_(or__3548__auto____11525)) {
      return or__3548__auto____11525
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__11526.call(this, h, tag);
      case 3:
        return derive__11527.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__11533 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__11534 = function(h, tag, parent) {
    var parentMap__11529 = "\ufdd0'parents".call(null, h);
    var childsParents__11530 = cljs.core.truth_(parentMap__11529.call(null, tag)) ? cljs.core.disj.call(null, parentMap__11529.call(null, tag), parent) : cljs.core.set([]);
    var newParents__11531 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__11530)) ? cljs.core.assoc.call(null, parentMap__11529, tag, childsParents__11530) : cljs.core.dissoc.call(null, parentMap__11529, tag);
    var deriv_seq__11532 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__11518_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__11518_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__11518_SHARP_), cljs.core.second.call(null, p1__11518_SHARP_)))
    }, cljs.core.seq.call(null, newParents__11531)));
    if(cljs.core.truth_(cljs.core.contains_QMARK_.call(null, parentMap__11529.call(null, tag), parent))) {
      return cljs.core.reduce.call(null, function(p1__11519_SHARP_, p2__11520_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__11519_SHARP_, p2__11520_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__11532))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__11533.call(this, h, tag);
      case 3:
        return underive__11534.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__11536 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____11538 = cljs.core.truth_(function() {
    var and__3546__auto____11537 = xprefs__11536;
    if(cljs.core.truth_(and__3546__auto____11537)) {
      return xprefs__11536.call(null, y)
    }else {
      return and__3546__auto____11537
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____11538)) {
    return or__3548__auto____11538
  }else {
    var or__3548__auto____11540 = function() {
      var ps__11539 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.truth_(cljs.core.count.call(null, ps__11539) > 0)) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__11539), prefer_table))) {
          }else {
          }
          var G__11543 = cljs.core.rest.call(null, ps__11539);
          ps__11539 = G__11543;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____11540)) {
      return or__3548__auto____11540
    }else {
      var or__3548__auto____11542 = function() {
        var ps__11541 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.truth_(cljs.core.count.call(null, ps__11541) > 0)) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__11541), y, prefer_table))) {
            }else {
            }
            var G__11544 = cljs.core.rest.call(null, ps__11541);
            ps__11541 = G__11544;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____11542)) {
        return or__3548__auto____11542
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____11545 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____11545)) {
    return or__3548__auto____11545
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__11554 = cljs.core.reduce.call(null, function(be, p__11546) {
    var vec__11547__11548 = p__11546;
    var k__11549 = cljs.core.nth.call(null, vec__11547__11548, 0, null);
    var ___11550 = cljs.core.nth.call(null, vec__11547__11548, 1, null);
    var e__11551 = vec__11547__11548;
    if(cljs.core.truth_(cljs.core.isa_QMARK_.call(null, dispatch_val, k__11549))) {
      var be2__11553 = cljs.core.truth_(function() {
        var or__3548__auto____11552 = be === null;
        if(cljs.core.truth_(or__3548__auto____11552)) {
          return or__3548__auto____11552
        }else {
          return cljs.core.dominates.call(null, k__11549, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__11551 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__11553), k__11549, prefer_table))) {
      }else {
        throw new Error(cljs.core.str.call(null, "Multiple methods in multimethod '", name, "' match dispatch value: ", dispatch_val, " -> ", k__11549, " and ", cljs.core.first.call(null, be2__11553), ", and neither is preferred"));
      }
      return be2__11553
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__11554)) {
    if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy)))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__11554));
      return cljs.core.second.call(null, best_entry__11554)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____11555 = mf;
    if(cljs.core.truth_(and__3546__auto____11555)) {
      return mf.cljs$core$IMultiFn$_reset
    }else {
      return and__3546__auto____11555
    }
  }())) {
    return mf.cljs$core$IMultiFn$_reset(mf)
  }else {
    return function() {
      var or__3548__auto____11556 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____11556)) {
        return or__3548__auto____11556
      }else {
        var or__3548__auto____11557 = cljs.core._reset["_"];
        if(cljs.core.truth_(or__3548__auto____11557)) {
          return or__3548__auto____11557
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____11558 = mf;
    if(cljs.core.truth_(and__3546__auto____11558)) {
      return mf.cljs$core$IMultiFn$_add_method
    }else {
      return and__3546__auto____11558
    }
  }())) {
    return mf.cljs$core$IMultiFn$_add_method(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____11559 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____11559)) {
        return or__3548__auto____11559
      }else {
        var or__3548__auto____11560 = cljs.core._add_method["_"];
        if(cljs.core.truth_(or__3548__auto____11560)) {
          return or__3548__auto____11560
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____11561 = mf;
    if(cljs.core.truth_(and__3546__auto____11561)) {
      return mf.cljs$core$IMultiFn$_remove_method
    }else {
      return and__3546__auto____11561
    }
  }())) {
    return mf.cljs$core$IMultiFn$_remove_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____11562 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____11562)) {
        return or__3548__auto____11562
      }else {
        var or__3548__auto____11563 = cljs.core._remove_method["_"];
        if(cljs.core.truth_(or__3548__auto____11563)) {
          return or__3548__auto____11563
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____11564 = mf;
    if(cljs.core.truth_(and__3546__auto____11564)) {
      return mf.cljs$core$IMultiFn$_prefer_method
    }else {
      return and__3546__auto____11564
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefer_method(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____11565 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____11565)) {
        return or__3548__auto____11565
      }else {
        var or__3548__auto____11566 = cljs.core._prefer_method["_"];
        if(cljs.core.truth_(or__3548__auto____11566)) {
          return or__3548__auto____11566
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____11567 = mf;
    if(cljs.core.truth_(and__3546__auto____11567)) {
      return mf.cljs$core$IMultiFn$_get_method
    }else {
      return and__3546__auto____11567
    }
  }())) {
    return mf.cljs$core$IMultiFn$_get_method(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____11568 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____11568)) {
        return or__3548__auto____11568
      }else {
        var or__3548__auto____11569 = cljs.core._get_method["_"];
        if(cljs.core.truth_(or__3548__auto____11569)) {
          return or__3548__auto____11569
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____11570 = mf;
    if(cljs.core.truth_(and__3546__auto____11570)) {
      return mf.cljs$core$IMultiFn$_methods
    }else {
      return and__3546__auto____11570
    }
  }())) {
    return mf.cljs$core$IMultiFn$_methods(mf)
  }else {
    return function() {
      var or__3548__auto____11571 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____11571)) {
        return or__3548__auto____11571
      }else {
        var or__3548__auto____11572 = cljs.core._methods["_"];
        if(cljs.core.truth_(or__3548__auto____11572)) {
          return or__3548__auto____11572
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____11573 = mf;
    if(cljs.core.truth_(and__3546__auto____11573)) {
      return mf.cljs$core$IMultiFn$_prefers
    }else {
      return and__3546__auto____11573
    }
  }())) {
    return mf.cljs$core$IMultiFn$_prefers(mf)
  }else {
    return function() {
      var or__3548__auto____11574 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____11574)) {
        return or__3548__auto____11574
      }else {
        var or__3548__auto____11575 = cljs.core._prefers["_"];
        if(cljs.core.truth_(or__3548__auto____11575)) {
          return or__3548__auto____11575
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____11576 = mf;
    if(cljs.core.truth_(and__3546__auto____11576)) {
      return mf.cljs$core$IMultiFn$_dispatch
    }else {
      return and__3546__auto____11576
    }
  }())) {
    return mf.cljs$core$IMultiFn$_dispatch(mf, args)
  }else {
    return function() {
      var or__3548__auto____11577 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(cljs.core.truth_(or__3548__auto____11577)) {
        return or__3548__auto____11577
      }else {
        var or__3548__auto____11578 = cljs.core._dispatch["_"];
        if(cljs.core.truth_(or__3548__auto____11578)) {
          return or__3548__auto____11578
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__11579 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__11580 = cljs.core._get_method.call(null, mf, dispatch_val__11579);
  if(cljs.core.truth_(target_fn__11580)) {
  }else {
    throw new Error(cljs.core.str.call(null, "No method in multimethod '", cljs.core.name, "' for dispatch value: ", dispatch_val__11579));
  }
  return cljs.core.apply.call(null, target_fn__11580, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy
};
cljs.core.MultiFn.cljs$core$IPrintable$_pr_seq = function(this__365__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash = function(this$) {
  var this__11581 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset = function(mf) {
  var this__11582 = this;
  cljs.core.swap_BANG_.call(null, this__11582.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11582.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11582.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__11582.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method = function(mf, dispatch_val, method) {
  var this__11583 = this;
  cljs.core.swap_BANG_.call(null, this__11583.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__11583.method_cache, this__11583.method_table, this__11583.cached_hierarchy, this__11583.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method = function(mf, dispatch_val) {
  var this__11584 = this;
  cljs.core.swap_BANG_.call(null, this__11584.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__11584.method_cache, this__11584.method_table, this__11584.cached_hierarchy, this__11584.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method = function(mf, dispatch_val) {
  var this__11585 = this;
  if(cljs.core.truth_(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__11585.cached_hierarchy), cljs.core.deref.call(null, this__11585.hierarchy)))) {
  }else {
    cljs.core.reset_cache.call(null, this__11585.method_cache, this__11585.method_table, this__11585.cached_hierarchy, this__11585.hierarchy)
  }
  var temp__3695__auto____11586 = cljs.core.deref.call(null, this__11585.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____11586)) {
    var target_fn__11587 = temp__3695__auto____11586;
    return target_fn__11587
  }else {
    var temp__3695__auto____11588 = cljs.core.find_and_cache_best_method.call(null, this__11585.name, dispatch_val, this__11585.hierarchy, this__11585.method_table, this__11585.prefer_table, this__11585.method_cache, this__11585.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____11588)) {
      var target_fn__11589 = temp__3695__auto____11588;
      return target_fn__11589
    }else {
      return cljs.core.deref.call(null, this__11585.method_table).call(null, this__11585.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__11590 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__11590.prefer_table))) {
    throw new Error(cljs.core.str.call(null, "Preference conflict in multimethod '", this__11590.name, "': ", dispatch_val_y, " is already preferred to ", dispatch_val_x));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__11590.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__11590.method_cache, this__11590.method_table, this__11590.cached_hierarchy, this__11590.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods = function(mf) {
  var this__11591 = this;
  return cljs.core.deref.call(null, this__11591.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers = function(mf) {
  var this__11592 = this;
  return cljs.core.deref.call(null, this__11592.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch = function(mf, args) {
  var this__11593 = this;
  return cljs.core.do_dispatch.call(null, mf, this__11593.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__11594__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__11594 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__11594__delegate.call(this, _, args)
  };
  G__11594.cljs$lang$maxFixedArity = 1;
  G__11594.cljs$lang$applyTo = function(arglist__11595) {
    var _ = cljs.core.first(arglist__11595);
    var args = cljs.core.rest(arglist__11595);
    return G__11594__delegate.call(this, _, args)
  };
  return G__11594
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____9875 = this$;
    if(cljs.core.truth_(and__3546__auto____9875)) {
      return this$.clojure$browser$event$EventType$event_types
    }else {
      return and__3546__auto____9875
    }
  }())) {
    return this$.clojure$browser$event$EventType$event_types(this$)
  }else {
    return function() {
      var or__3548__auto____9876 = clojure.browser.event.event_types[goog.typeOf.call(null, this$)];
      if(cljs.core.truth_(or__3548__auto____9876)) {
        return or__3548__auto____9876
      }else {
        var or__3548__auto____9877 = clojure.browser.event.event_types["_"];
        if(cljs.core.truth_(or__3548__auto____9877)) {
          return or__3548__auto____9877
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__9878) {
    var vec__9879__9880 = p__9878;
    var k__9881 = cljs.core.nth.call(null, vec__9879__9880, 0, null);
    var v__9882 = cljs.core.nth.call(null, vec__9879__9880, 1, null);
    return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__9881.toLowerCase()), v__9882])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__9883) {
    var vec__9884__9885 = p__9883;
    var k__9886 = cljs.core.nth.call(null, vec__9884__9885, 0, null);
    var v__9887 = cljs.core.nth.call(null, vec__9884__9885, 1, null);
    return cljs.core.Vector.fromArray([cljs.core.keyword.call(null, k__9886.toLowerCase()), v__9887])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__9888 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__9889 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__9888.call(this, src, type, fn);
      case 4:
        return listen__9889.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__9891 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__9892 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__9891.call(this, src, type, fn);
      case 4:
        return listen_once__9892.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__9894 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__9895 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__9894.call(this, src, type, fn);
      case 4:
        return unlisten__9895.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey.call(null, key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent.call(null, src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose.call(null, e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount.call(null)
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("codegroup.app");
goog.require("cljs.core");
goog.require("clojure.browser.event");
codegroup.app.add_msg = function add_msg(msg_el) {
  return gdom.append.call(null, codegroup.app.sel.call(null, "#chatLog"), msg_el)
};
clojure.browser.event.listen.call(null, codegroup.app.sel.call(null, "#text"), "\ufdd0'keypress", function(e) {
  if(cljs.core.truth_(cljs.core._EQ_.call(null, e.keyCode, "13"))) {
    return codegroup.app.send.call(null)
  }else {
    return null
  }
});
alert.call(null, "Hello from ClojureScript!");
codegroup.app.ws_url = "ws://localhost:8080/socket";
codegroup.app.socket = new WebSocket(codegroup.app.ws_url);
