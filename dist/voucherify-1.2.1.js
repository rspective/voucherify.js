window.Voucherify = (function (window, document, $) {
  "use strict";

  var OPTIONS = {
    url: "https://voucherify-bouncer.herokuapp.com/client/v1/validate"
  };

  var xhrImplementation = null;

  if (!!$ && typeof($.ajax) === "function" && !!$.Deferred) {
    xhrImplementation = function (queryString, callback) {
      var deferred = null;

      if (typeof(callback) !== "function") {
        deferred = $.Deferred();
      }

      $.ajax({
        type: "GET",

        url: OPTIONS.url + queryString,

        xhrFields: {
          withCredentials: true
        },

        dataType: "json",
        headers: {
          "X-Client-Application-Id": OPTIONS.applicationId,
          "X-Client-Token": OPTIONS.token,
          "X-Voucherify-Channel": "Voucherify.js"
        },
        timeout: OPTIONS.timeout,

        success: function (data) {
          var result = null;

          if (data && typeof(data.valid) === "boolean") {
            if (typeof(callback) === "function") {
              callback(data);
            } else {
              deferred.resolve(data);
            }
          } else {
            result = {
              type: "error",
              message: "Unexpected response structure.",
              context: data
            };

            if (typeof(callback) === "function") {
              callback(result);
            } else {
              deferred.reject(result);
            }
          }
        },

        error: function (error) {
          var result = {
            type: "error",
            message: "XHR error happened.",
            context: error
          };

          if (typeof(callback) === "function") {
            callback(result);
          } else {
            deferred.reject(result);
          }
        }
      });

      if (typeof(callback) !== "function") {
        return deferred.promise();
      } else {
        return undefined;
      }
    };
  } else {
    xhrImplementation = function (queryString, callback) {
      var request = new window.XMLHttpRequest();

      request.timeout = OPTIONS.timeout;
      request.withCredentials = true;
      request.open("GET", OPTIONS.url + queryString, true);

      request.setRequestHeader("X-Client-Application-Id", OPTIONS.applicationId);
      request.setRequestHeader("X-Client-Token", OPTIONS.token);

      request.onload = function() {
        var result = null;

        if (request.status >= 200 && request.status < 400) {
          var data = JSON.parse(request.responseText);

          if (data && typeof(data.valid) === "boolean") {
            if (typeof(callback) === "function") {
              callback(data);
            }
          } else {
            result = {
              type: "error",
              message: "Unexpected response structure.",
              context: data
            };

            if (typeof(callback) === "function") {
              callback(result);
            }
          }
        } else {
          result = {
            type: "error",
            message: "Unexpected status code.",
            context: request.status
          };

          if (typeof(callback) === "function") {
            callback(result);
          }
        }
      };

      request.onerror = function (error) {
        var result = {
          type: "error",
          message: "XHR error happened.",
          context: error
        };

        if (typeof(callback) === "function") {
          callback(result);
        }
      };

      request.send();
    };
  }

  function roundValue(value, e) {
    return Math.round(value * (e + 0.001)) / e;
  }

  function validatePercentDiscount(discount) {
    if (!discount || discount < 0 || discount > 100) {
      throw new Error('Invalid voucher, percent discount should be between 0-100.');
    }
  }

  function validateAmountDiscount(discount) {
    if (!discount || discount < 0) {
      throw new Error("Invalid voucher, amount discount must be higher than zero.");
    }
  }

  var voucherify = {
    initialize: function (appId, token, timeout) {
      OPTIONS.applicationId = appId;
      OPTIONS.token = token;
      OPTIONS.timeout = timeout || 5000;
    },

    setIdentity: function (trackingId) {
      OPTIONS.trackingId = trackingId;
    },

    validate: function (code, callback) {
      if (!OPTIONS.applicationId && !OPTIONS.token) {
        console.error("Voucherify client could not verify coupon - Lack of configuration - Missing Application ID or Token.");
        return null;
      }

      if (!!code) {
        code = code.replace(/[\s\r\n]/g, "");
      }

      if (!code) {
        console.error("Voucherify client could not verify code, because it is missing - please provide Voucher Code.");
        return null;
      }

      var queryString = "?code=" + encodeURIComponent(code);

      if (OPTIONS.trackingId) {
        queryString += "&tracking_id=" + encodeURIComponent(OPTIONS.trackingId);
      }

      return xhrImplementation(queryString, callback);
    },

    utils: {
      calculatePrice: function (basePrice, voucher) {
        var e = 100; // Number of digits after the decimal separator.
        var discount = voucher.discount / e;

        if (voucher.discount_type === 'PERCENT') {
          validatePercentDiscount(discount);
          var priceDiscount = basePrice * (discount/100);
          return roundValue(basePrice - priceDiscount, e);

        } else if (voucher.discount_type === 'AMOUNT') {
          validateAmountDiscount(discount);
          var newPrice = basePrice - discount;
          return roundValue(newPrice > 0 ? newPrice : 0, e);

        } else {
          throw new Error("Unsupported voucher type.");
        }
      },

      calculateDiscount: function(basePrice, voucher) {
        var e = 100; // Number of digits after the decimal separator.
        var discount = voucher.discount / e;

        if (voucher.discount_type === 'PERCENT') {
          validatePercentDiscount(discount);
          return roundValue(basePrice * (discount/100), e);

        } else if (voucher.discount_type === 'AMOUNT') {
          validateAmountDiscount(discount);
          var newPrice = basePrice - discount;
          return roundValue(newPrice > 0 ? discount : basePrice, e);

        } else {
          throw new Error("Unsupported voucher type.");
        }
      }
    }
  };

  return voucherify;
} (window, window.document, window.jQuery));
