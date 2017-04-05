// browser

var pf = (navigator.platform || "").toLowerCase(),
    ua = navigator.userAgent.toLowerCase(),
    s;
function toFixedVersion(ver, floatLength) {
    ver = ("" + ver).replace(/_/g, ".");
    floatLength = floatLength || 1;
    ver = String(ver).split(".");
    ver = ver[0] + "." + (ver[1] || "0");
    ver = Number(ver).toFixed(floatLength);
    return ver;
}
function updateProperty(target, name, ver) {
    target = ui[target];
    target.name = name;
    target.version = ver;
    target[name] = ver;
}

// 提供三个对象,每个对象都有name, version(version必然为字符串)
// 取得用户操作系统名字与版本号，如果是0表示不是此操作系统

// 平台
ui.platform = {
    name: (window.orientation !== undefined) ? 'iPod' : (pf.match(/mac|win|linux/i) || ['unknown'])[0],
    version: 0,
    iPod: 0,
    iPad: 0,
    iPhone: 0,
    ios: 0,
    android: 0,
    windowsPhone: 0,
    win: 0,
    linux: 0,
    mac: 0
};
(s = ua.match(/windows ([\d.]+)/)) ? updateProperty("platform", "win", toFixedVersion(s[1])) :
        (s = ua.match(/windows nt ([\d.]+)/)) ? updateProperty("platform", "win", toFixedVersion(s[1])) :
        (s = ua.match(/linux ([\d.]+)/)) ? updateProperty("platform", "linux", toFixedVersion(s[1])) :
        (s = ua.match(/mac ([\d.]+)/)) ? updateProperty("platform", "mac", toFixedVersion(s[1])) :
        (s = ua.match(/ipod ([\d.]+)/)) ? updateProperty("platform", "iPod", toFixedVersion(s[1])) :
        (s = ua.match(/ipad[\D]*os ([\d_]+)/)) ? updateProperty("platform", "iPad", toFixedVersion(s[1])) :
        (s = ua.match(/iphone[\D]*os ([\d_]+)/)) ? updateProperty("platform", "iPhone", toFixedVersion(s[1])) :
        (s = ua.match(/android ([\d.]+)/)) ? updateProperty("platform", "android", toFixedVersion(s[1])) : 
        (s = ua.match(/windows phone ([\d.]+)/)) ? updateProperty("platform", "windowsPhone", toFixedVersion(s[1])) : 0;
if(ui.platform.iphone || ui.platform.iPad) {
    ui.platform.ios = ui.platform.iphone || ui.platform.iPad;
}

//============================================
//取得用户的浏览器名与版本,如果是0表示不是此浏览器
ui.browser = {
    name: "unknown",
    version: 0,
    ie: 0,
    edge: 0,
    firefox: 0,
    chrome: 0,
    opera: 0,
    safari: 0,
    mobileSafari: 0,
    //adobe 的air内嵌浏览器
    adobeAir: 0
};
//IE11的UA改变了没有MSIE
(s = ua.match(/edge\/([\d.]+)/)) ? updateProperty("browser", "edge", toFixedVersion(s[1])) :
        (s = ua.match(/trident.*; rv\:([\d.]+)/)) ? updateProperty("browser", "ie", toFixedVersion(s[1])) : 
        (s = ua.match(/msie ([\d.]+)/)) ? updateProperty("browser", "ie", toFixedVersion(s[1])) :
        (s = ua.match(/firefox\/([\d.]+)/)) ? updateProperty("browser", "firefox", toFixedVersion(s[1])) :
        (s = ua.match(/chrome\/([\d.]+)/)) ? updateProperty("browser", "chrome", toFixedVersion(s[1])) :
        (s = ua.match(/opera.([\d.]+)/)) ? updateProperty("browser", "opera", toFixedVersion(s[1])) :
        (s = ua.match(/adobeair\/([\d.]+)/)) ? updateProperty("browser", "adobeAir", toFixedVersion(s[1])) :
        (s = ua.match(/version\/([\d.]+).*safari/)) ? updateProperty("browser", "safari", toFixedVersion(s[1])) : 0;
//下面是各种微调
//mobile safari 判断，可与safari字段并存
(s = ua.match(/version\/([\d.]+).*mobile.*safari/)) ? updateProperty("browser", "mobileSafari", toFixedVersion(s[1])) : 0;

if (ui.platform.iPad) {
    updateProperty("browser", 'mobileSafari', '0.0');
}

if (ui.browser.ie) {
    if (!document.documentMode) {
        document.documentMode = Math.floor(ui.browser.ie);
        //http://msdn.microsoft.com/zh-cn/library/cc817574.aspx
        //IE下可以通过设置 <meta http-equiv="X-UA-Compatible" content="IE=8"/>改变渲染模式
        //一切以实际渲染效果为准
    } else if (document.documentMode !== Math.floor(ui.browser.ie)) {
        updateProperty("browser", "ie", toFixedVersion(document.documentMode));
    }
}

//============================================
//取得用户浏览器的渲染引擎名与版本,如果是0表示不是此浏览器
ui.engine = {
    name: 'unknown',
    version: 0,
    trident: 0,
    gecko: 0,
    webkit: 0,
    presto: 0
};

(s = ua.match(/trident\/([\d.]+)/)) ? updateProperty("engine", "trident", toFixedVersion(s[1])) :
        (s = ua.match(/gecko\/([\d.]+)/)) ? updateProperty("engine", "gecko", toFixedVersion(s[1])) :
        (s = ua.match(/applewebkit\/([\d.]+)/)) ? updateProperty("engine", "webkit", toFixedVersion(s[1])) :
        (s = ua.match(/presto\/([\d.]+)/)) ? updateProperty("engine", "presto", toFixedVersion(s[1])) : 0;

if (ui.browser.ie) {
    if (ui.browser.ie == 6) {
        updateProperty("engine", "trident", toFixedVersion("4"));
    } else if (ui.browser.ie == 7 || ui.browser.ie == 8) {
        updateProperty("engine", "trident", toFixedVersion("5"));
    }
}