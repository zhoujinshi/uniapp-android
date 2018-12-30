var isFn = function isFn(v) {
  return typeof v === 'function';
};

var handlePromise = function handlePromise(promise) {
  return promise.then(function (data) {
    return [null, data];
  }).catch(function (err) {
    return [err];
  });
};

var REGEX = /^on|^create|Sync$|Manager$|^pause/;
var API_NORMAL_LIST = ['os', 'stopRecord', 'stopVoice', 'stopBackgroundAudio', 'stopPullDownRefresh', 'hideKeyboard', 'hideToast', 'hideLoading', 'showNavigationBarLoading', 'hideNavigationBarLoading', 'canIUse', 'navigateBack', 'closeSocket', 'pageScrollTo', 'drawCanvas'];

var shouldPromise = function shouldPromise(name) {
  if (REGEX.test(name) && name !== 'createBLEConnection') {
    return false;
  }
  if (~API_NORMAL_LIST.indexOf(name)) {
    return false;
  }
  return true;
};

var promisify = function promisify(api) {
  return function () {
    for (var _len = arguments.length, params = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      params[_key - 1] = arguments[_key];
    }

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (isFn(options.success) || isFn(options.fail) || isFn(options.complete)) {
      return api.apply(undefined, [options].concat(params));
    }
    return handlePromise(new Promise(function (resolve, reject) {
      api.apply(undefined, [Object.assign({}, options, {
        success: resolve,
        fail: reject
      })].concat(params));
      /* eslint-disable no-extend-native */
      Promise.prototype.finally = function (callback) {
        var promise = this.constructor;
        return this.then(function (value) {
          return promise.resolve(callback()).then(function () {
            return value;
          });
        }, function (reason) {
          return promise.resolve(callback()).then(function () {
            throw reason;
          });
        });
      };
    }));
  };
};

var EPS = 1e-4;
var BASE_DEVICE_WIDTH = 750;
var isIOS = false;
var deviceWidth = 0;
var deviceDPR = 0;

function checkDeviceWidth() {
  var _wx$getSystemInfoSync = wx.getSystemInfoSync(),
      platform = _wx$getSystemInfoSync.platform,
      pixelRatio = _wx$getSystemInfoSync.pixelRatio,
      windowWidth = _wx$getSystemInfoSync.windowWidth;

  deviceWidth = windowWidth;
  deviceDPR = pixelRatio;
  isIOS = platform === 'ios';
}

function transformUpx(number, newDeviceWidth) {
  if (deviceWidth === 0) {
    checkDeviceWidth();
  }

  if (number === 0) {
    return 0;
  }

  number = number / BASE_DEVICE_WIDTH * (newDeviceWidth || deviceWidth);
  number = Math.floor(number + EPS);

  if (number === 0) {
    if (deviceDPR === 1 || !isIOS) {
      return 1;
    } else {
      return 0.5;
    }
  }
  return number;
}

function subscribePush(_ref) {
  var fail = _ref.fail,
      complete = _ref.complete;

  var res = {
    errMsg: 'subscribePush:fail:微信小程序不支持 subscribePush 方法'
  };
  isFn(fail) && fail(res);
  isFn(complete) && complete(res);
}
function unsubscribePush(_ref2) {
  var fail = _ref2.fail,
      complete = _ref2.complete;

  var res = {
    errMsg: 'unsubscribePush:fail:微信小程序不支持 unsubscribePush 方法'
  };
  isFn(fail) && fail(res);
  isFn(complete) && complete(res);
}
function onPush(_ref3) {
  var fail = _ref3.fail,
      complete = _ref3.complete;

  var res = {
    errMsg: 'onPush:fail:微信小程序不支持 onPush 方法'
  };
  isFn(fail) && fail(res);
  isFn(complete) && complete(res);
}
function offPush(_ref4) {
  var fail = _ref4.fail,
      complete = _ref4.complete;

  var res = {
    errMsg: 'offPush:fail:微信小程序不支持 offPush 方法'
  };
  isFn(fail) && fail(res);
  isFn(complete) && complete(res);
}

function share(_ref) {
  var fail = _ref.fail,
      complete = _ref.complete;

  var res = {
    errMsg: 'share:fail:微信小程序不支持 share 方法'
  };
  isFn(fail) && fail(res);
  isFn(complete) && complete(res);
}

var providers = {
  oauth: ['weixin'],
  share: ['weixin'],
  payment: ['wxpay'],
  push: ['weixin']
};

function getProvider(_ref) {
  var service = _ref.service,
      success = _ref.success,
      fail = _ref.fail,
      complete = _ref.complete;

  var res = false;
  if (providers[service]) {
    res = {
      errMsg: 'getProvider:ok',
      service: service,
      provider: providers[service]
    };
    isFn(success) && success(res);
  } else {
    res = {
      errMsg: 'getProvider:fail:服务[' + service + ']不存在'
    };
    isFn(fail) && fail(res);
  }
  isFn(complete) && complete(res);
}

var api = /*#__PURE__*/Object.freeze({
  getProvider: getProvider,
  subscribePush: subscribePush,
  unsubscribePush: unsubscribePush,
  onPush: onPush,
  offPush: offPush,
  share: share
});

var uni = {};

var baseUni = {
  os: {
    wx: true
  }
};

if (typeof Proxy !== 'undefined') {
  uni = new Proxy({}, {
    get: function get(target, name) {
      if (baseUni.hasOwnProperty(name)) {
        return baseUni[name];
      }
      if (name === 'upx2px') {
        return transformUpx;
      }
      if (api[name]) {
        if (shouldPromise(name)) {
          return promisify(api[name]);
        }
        return api[name];
      }
      if (!wx.hasOwnProperty(name)) {
        return;
      }
      if (shouldPromise(name)) {
        return promisify(wx[name]);
      }
      return wx[name];
    }
  });
} else {
  uni.upx2px = transformUpx;

  Object.keys(baseUni).forEach(function (key) {
    uni[key] = baseUni[key];
  });

  Object.keys(api).forEach(function (key) {
    if (!shouldPromise(key)) {
      uni[key] = promisify(api[key]);
    } else {
      uni[key] = api[key];
    }
  });

  Object.keys(wx).forEach(function (key) {
    if (wx.hasOwnProperty(key)) {
      if (shouldPromise(key)) {
        uni[key] = promisify(wx[key]);
      } else {
        uni[key] = wx[key];
      }
    }
  });
}

var uni$1 = uni;

export default uni$1;
