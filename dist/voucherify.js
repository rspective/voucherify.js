window.Voucherify = (function (window, document, $) {
  "use strict";

  var API_BASE = "https://api.voucherify.io";

  var API = {
      validate: API_BASE + "/client/v1/validate",
      redeem:   API_BASE + "/client/v1/redeem",
      publish:  API_BASE + "/client/v1/publish",
      list:     API_BASE + "/client/v1/vouchers",
      track:    API_BASE + "/client/v1/events",
      validatePromotion: API_BASE + "/client/v1/promotions/validation"
  };

  var OPTIONS = {};

  // Error keys returned from voucherify API
  var INVALID_AMOUNT = "invalid_amount";
  var INVALID_NUMBER = "invalid_number";
  var MISSING_AMOUNT = "missing_amount";
  var INVALID_CUSTOMER_PHONE = "invalid_customer_phone";

  var EMAIL_PATTERN = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  function isValidResponseStructure(data) {
    return data && (typeof(data.valid) === "boolean" // validate
       || typeof(data.result) === "string" // redeem
       || typeof(data.voucher) === "object" // publish
       || typeof(data.vouchers) === "object" // list
       || (data.object === "event" && typeof(data.type) === "string") // track
    );
  }

  var xhrImplementation = null;

  if (!!$ && typeof($.ajax) === "function" && !!$.Deferred) {
    xhrImplementation = function (method, url, payload, callback) {
      var deferred = null;

      if (typeof(callback) !== "function") {
        deferred = $.Deferred();
      }

      $.ajax({
        type: method,

        url: url,

        data: JSON.stringify(payload),

        xhrFields: {
          withCredentials: true
        },

        dataType: "json",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "X-Client-Application-Id": OPTIONS.applicationId,
          "X-Client-Token": OPTIONS.token,
          "X-Voucherify-Channel": "Voucherify.js"
        },
        timeout: OPTIONS.timeout,

        success: function (data) {
          var result = null;

          if (isValidResponseStructure(data)) {
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
    xhrImplementation = function (method, url, payload, callback) {
      var request = new window.XMLHttpRequest();

      request.withCredentials = true;
      request.open(method, url, true);
      request.timeout = OPTIONS.timeout;

      request.setRequestHeader("Accept", "application/json");
      request.setRequestHeader("Content-Type", "application/json");
      request.setRequestHeader("X-Client-Application-Id", OPTIONS.applicationId);
      request.setRequestHeader("X-Client-Token", OPTIONS.token);
      request.setRequestHeader("X-Voucherify-Channel", "Voucherify.js");

      request.onload = function() {
        var result = null;

        if (request.status >= 200 && request.status < 400) {
          var data = JSON.parse(request.responseText);

          if (isValidResponseStructure(data)) {
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

      request.send(JSON.stringify(payload));
    };
  }

  function roundMoney(value) {
    return Math.round(value * (100 + 0.001)) / 100;
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

  function validateUnitDiscount(discount) {
    if (!discount || discount < 0) {
      throw new Error("Invalid voucher, unit discount must be higher than zero.");
    }
  }

  function isValidInit(options) {
    if (!options.applicationId) {
      console.error("Voucherify.js ERROR: Missing Client Application ID.");
      return false;
    }
    if (!options.applicationId) {
      console.error("Voucherify.js ERROR: Missing Client Token (Secret Key).");
      return false;
    }
    return true;
  }

  var voucherify = {
    initialize: function (clientAppId, token, timeout) {
      OPTIONS.applicationId = clientAppId;
      OPTIONS.token = token;
      OPTIONS.timeout = timeout || 5000;
    },

    setIdentity: function (trackingId) {
      OPTIONS.trackingId = trackingId;
    },

    validate: function (code, callback) {
      if (!isValidInit(OPTIONS)) {
        return null;
      }

      var isPromotion = false;
      var amount;
      var items;
      var metadata;
      var customer;

      if (typeof(code) === "object") {
        amount = code.amount;
        items = code.items;
        metadata = code.metadata;
        customer = code.customer;
        code = code.code;
      }

      if (!!code) {
        code = code.replace(/[\s\r\n]/g, "");
      }

      var queryString = "?";
      if (!code) {
        isPromotion = true;
        if(amount) {
          queryString += "amount=" + parseInt(amount);
        }
      } else {
        queryString += "code=" + encodeURIComponent(code);
        if (amount) {
          queryString += "&amount=" + parseInt(amount); // in cents, amount=1000 means $10
        }
      }

      if (items) {
        queryString += "&" + items.map(function(item, index) {
          return Object.keys(item).map(function(key) {
            return encodeURIComponent("item[" + index + "][" + key + "]") + "=" + encodeURIComponent(item[key]);
          }).join("&");
        }).join("&");
      }

      if (metadata) {
        queryString += "&" + Object.keys(metadata).map(function(key) {
          return encodeURIComponent("metadata[" + key + "]") + "=" + encodeURIComponent(metadata[key]);
        }).join("&");
      }

      if (customer) {
        if(typeof(customer) !== "object") {
          console.error("Customer must be an object - please use instead { source_id: 'your_user' }");
          return null;
        }

        queryString += "&" + Object.keys(customer).map(function (key) {
          return encodeURIComponent("customer[" + key + "]") + "=" + encodeURIComponent(customer[ key ]);
        }).join("&");
      }

      if (OPTIONS.trackingId) {
        queryString += "&tracking_id=" + encodeURIComponent(OPTIONS.trackingId);
      }

      return xhrImplementation("GET", (isPromotion ? API.validatePromotion : API.validate) + queryString, undefined, callback);
    },

    redeem: function (code, payload, callback) {
      if (!isValidInit(OPTIONS)) {
        return null;
      }

      if (!code) {
        console.error("Voucherify client could not verify code, because it is missing - please provide Voucher Code.");
        return null;
      }

      var queryString = "?code=" + encodeURIComponent(code.replace(/[\s\r\n]/g, ""));

      // -- Tracking ID fallback
      payload = payload || {};
      payload.customer = payload.customer || {};
      payload.customer.source_id = payload.customer.source_id || OPTIONS.trackingId;

      return xhrImplementation("POST", API.redeem + queryString, payload, callback);
    },

    publish: function (campaign, payload, callback) {
      if (!isValidInit(OPTIONS)) {
        return null;
      }

      if (!campaign) {
        console.error("Voucherify.js ERROR: campaign is required to publish a voucher.");
        return null;
      }

      var queryString = "?campaign=" + encodeURIComponent(campaign);

      // -- Tracking ID fallback
      payload = payload || {};
      payload.customer = payload.customer || {};
      payload.customer.source_id = payload.customer.source_id || OPTIONS.trackingId;
      // -- Default channel
      payload.channel = payload.channel || "Voucherify.js";

      return xhrImplementation("POST", API.publish + queryString, payload, callback);
    },

    listVouchers: function (filters, callback) {
      if (!isValidInit(OPTIONS)) {
        return null;
      }

      if (typeof filters === "function" && !callback) {
        callback = filters;
        filters = {};
      }

      var queryString = "?" + $.param(filters);

      return xhrImplementation("GET", API.list + queryString, undefined, callback);
    },

    track: function (event_name, metadata, customer, callback) {
      if (!isValidInit(OPTIONS)) {
        return null;
      }

      if (typeof customer === "function" && !callback) {
        callback = customer;
        customer = {};
      }

      var payload = {};
      payload.event = event_name;
      payload.metadata = metadata;
      payload.customer = payload.customer || customer || {};
      payload.customer.source_id = payload.customer.source_id || OPTIONS.trackingId;

      return xhrImplementation("POST", API.track, payload, callback);
    },

    utils: {
      calculatePrice: function (basePrice, voucher, unitPrice) {
        var e = 100; // Number of digits after the decimal separator.
        var discount;

        if (voucher.gift) {
          discount = Math.min(voucher.gift.balance / e, basePrice);
          return roundMoney(basePrice - discount);
        }

        if (!voucher.discount) {
          throw new Error("Unsupported voucher type.");
        }

        if (voucher.discount.type === 'PERCENT') {
          discount = voucher.discount.percent_off;
          validatePercentDiscount(discount);
          var priceDiscount = basePrice * (discount / 100);

          if (voucher.discount.amount_limit) {
            priceDiscount = Math.min(voucher.discount.amount_limit / e, priceDiscount);
          }

          return roundMoney(basePrice - priceDiscount);

        } else if (voucher.discount.type === 'AMOUNT') {
          discount = voucher.discount.amount_off / e;
          validateAmountDiscount(discount);
          var newPrice = basePrice - discount;
          return roundMoney(newPrice > 0 ? newPrice : 0);

        } else if (voucher.discount.type === 'UNIT') {
          discount = voucher.discount.unit_off;
          validateUnitDiscount(discount);
          var newPrice = basePrice - unitPrice * discount;
          return roundMoney(newPrice > 0 ? newPrice : 0);

        } else {
          throw new Error("Unsupported discount type.");
        }
      },

      calculateDiscount: function(basePrice, voucher, unitPrice) {
        var e = 100; // Number of digits after the decimal separator.
        var discount;

        if (voucher.gift) {
          discount = Math.min(voucher.gift.balance / e, basePrice);
          return roundMoney(discount);
        }

        if (!voucher.discount) {
          throw new Error("Unsupported voucher type.");
        }

        if (voucher.discount.type === 'PERCENT') {
          discount = voucher.discount.percent_off;
          validatePercentDiscount(discount);
          var priceDiscount = basePrice * (discount / e);

          if (voucher.discount.amount_limit) {
            priceDiscount = Math.min(voucher.discount.amount_limit / e, priceDiscount);
          }

          return roundMoney(priceDiscount);
        } else if (voucher.discount.type === 'AMOUNT') {
          discount = voucher.discount.amount_off / e;
          validateAmountDiscount(discount);
          var newPrice = basePrice - discount;
          return roundMoney(newPrice > 0 ? discount : basePrice);

        } else if (voucher.discount.type === 'UNIT') {
          discount = voucher.discount.unit_off;
          validateUnitDiscount(discount);
          var priceDiscount = unitPrice * discount;
          return roundMoney(priceDiscount > basePrice ? basePrice : priceDiscount);

        } else {
          throw new Error("Unsupported discount type.");
        }
      }
    },
    render: function(selector, options) {
      var $element = $(selector);
      if (!$element || !$element.length) {
        throw new Error("Element '" + selector + "' cannot be found");
      }
      options = options || {};

      function getCapitalizedName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }

      function getPropertyName(prefix, name) {
        return prefix + getCapitalizedName(name);
      }

      function getConfigProperty(prefix, name) {
        return options[getPropertyName(prefix, name)];
      }

      function create$control(type, name, $container, config) {
        config = config || {};
        var $control = null;
        var configured$control = getConfigProperty("selector", name);

        if (config.configurable && configured$control) {
          $control = $(configured$control);
        }

        if (!$control || !$control.length) {
          $control = $(document.createElement(type));
          $container.append($control);

          for (var attribute in config) {
            if (attribute !== "configurable" && config.hasOwnProperty(attribute)) {
              $control.attr(attribute, config[attribute]);
            }
          }

          if (type === "input") {
            $control.attr("name", getPropertyName("voucherify", name));
          }

          if (type === "span" && config.text) {
            $control.text(config.text);
          }
        }

        $control.addClass(typeof getConfigProperty("class", name) === "string" ? getConfigProperty("class", name) : getPropertyName("voucherify", name));
        return $control;
      }

      var $container     = create$control("div", "container", $element);
      var $logoContainer = create$control("figure", "logo", $container);
      var $logo          = create$control("img", "logo", $logoContainer, { src: typeof options.logoSrc === "string" ? options.logoSrc : "https://app.voucherify.io/images/favicon.png" });
      var $code          = create$control("input", "code", $container, { type: "text", placeholder: typeof options.textPlaceholder === "string" ? options.textPlaceholder : "e.g. abc-123" });
      var $amount        = create$control("input", "amount", $container, { type: options.amount ? "text" : "hidden", placeholder: typeof options.amountPlaceholder === "string" ? options.amountPlaceholder : "e.g. 52.22" });
      var $discountType  = create$control("input", "discountType", $container, { type: "hidden", configurable: true });
      var $percentOff    = create$control("input", "percentOff", $container, { type: "hidden", configurable: true });
      var $amountOff     = create$control("input", "amountOff", $container, { type: "hidden", configurable: true });
      var $unitOff       = create$control("input", "unitOff", $container, { type: "hidden", configurable: true });
      var $tracking      = create$control("input", "tracking", $container, { type: "hidden", configurable: true });
      var $validate      = create$control("button", "validate", $container, {});
      var $validateText  = create$control("span", "validateText", $validate, { text: typeof options.textValidate === "string" ? options.textValidate : "Validate" });

      var self = this;
      var classInvalid = options.classInvalid === "string" ? options.classInvalid : "voucherifyInvalid";
      var classValid = typeof options.classValid === "string" ? options.classValid : "voucherifyValid";
      var classInvalidAnimation = options.classInvalidAnimation === "string" ? options.classInvalidAnimation : "voucherifyAnimationShake";
      var classValidAnimation = options.classValidAnimation === "string" ? options.classValidAnimation : "voucherifyAnimationTada";

      $code.on("keyup", function(event) {
        $code.toggleClass(classInvalidAnimation, false);
      });

      $amount.on("keyup", function(event) {
        $amount.toggleClass(classInvalidAnimation, false);
      });

      $validate.on("click", function(event) {
        $discountType.val("");
        $amountOff.val("");
        $unitOff.val("");
        $percentOff.val("");
        $tracking.val("");

        $validate.toggleClass(classInvalid, false);
        $validate.toggleClass(classValid, false);

        if (!$code.val()) {
          $code.toggleClass(classInvalidAnimation, true)
            .delay(1000)
            .queue(function(){
              $code.toggleClass(classInvalidAnimation, false);
              $code.dequeue();
            });
          return;
        }

        var payload = {
          code: $code.val(),
          amount: parseInt(parseFloat($amount.val().replace(/\,/, ".")) * 100)
        };

        self.validate(payload, function(response) {
          if (!response || !response.valid) {

            var setFieldInvalid = function ($field) {
              $field.toggleClass(classInvalid, true);
              $field.toggleClass(classValid, false);
              $field.toggleClass(classInvalidAnimation, true)
              .delay(1000)
              .queue(function(){
                $field.toggleClass(classInvalidAnimation, false);
                $field.dequeue();
              });
            };

            $validate.toggleClass(classInvalid, true);
            $validate.toggleClass(classValid, false);

            var context         = response.context || {};
            var responseJSON    = context.responseJSON || {};
            var error_key       = responseJSON.key;

            if (options.amount && (
                error_key === INVALID_AMOUNT ||
                error_key === INVALID_NUMBER ||
                error_key === MISSING_AMOUNT)) {
              setFieldInvalid($amount);
            } else {
              setFieldInvalid($code);
            }
            return;
          }

          if ($amount.val() >= 0) {
            $amount.val(parseFloat($amount.val().replace(/\,/, ".")))
          } else {
            $amount.hide(100);
          }

          $code.toggleClass(classInvalid, false);
          $amount.toggleClass(classInvalid, false);
          $discountType.val(response.discount && response.discount.type || "");
          $amountOff.val(response.discount && response.discount.amount_off || 0);
          $unitOff.val(response.discount && response.discount.unit_off || 0);
          $percentOff.val(response.discount && response.discount.percent_off || 0);
          $tracking.val(response.tracking_id || "");

          $code.prop("disabled", true);
          $amount.prop("disabled", true);
          $validate.prop("disabled", true);

          $code.toggleClass(classValid, true);
          $amount.toggleClass(classValid, true);
          $validate.toggleClass(classValid, true);
          $validate.toggleClass(classInvalid, false);
          $code.toggleClass(classInvalid, false);

          $code.toggleClass(classValidAnimation, true);
          $amount.toggleClass(classValidAnimation, true);

          if (options && options.onValidated && typeof options.onValidated === "function") {
            options.onValidated(response);
          }
        });
      });
    },

    renderRedeem: function(selector, options) {
      var $element = $(selector);
      if (!$element || !$element.length) {
        throw new Error("Element '" + selector + "' cannot be found");
      }
      options = options || {};

      function getCapitalizedName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }

      function getPropertyName(prefix, name) {
        return prefix + getCapitalizedName(name);
      }

      function getConfigProperty(prefix, name) {
        return options[getPropertyName(prefix, name)];
      }

      function create$control(type, name, $container, config) {
        config = config || {};
        var $control = null;
        var configured$control = getConfigProperty("selector", name);

        if (config.configurable && configured$control) {
          $control = $(configured$control);
        }

        if (!$control || !$control.length) {
          $control = $(document.createElement(type));
          $container.append($control);

          for (var attribute in config) {
            if (attribute !== "configurable" && config.hasOwnProperty(attribute)) {
              $control.attr(attribute, config[attribute]);
            }
          }

          if (type === "input") {
            $control.attr("name", getPropertyName("voucherify", name));
          }

          if (type === "span" && config.text) {
            $control.text(config.text);
          }
        }

        $control.addClass(typeof getConfigProperty("class", name) === "string" ? getConfigProperty("class", name) : getPropertyName("voucherify", name));
        return $control;
      }

      var $container     = create$control("div", "container", $element);
      var $logoContainer = create$control("figure", "logo", $container);
      var $logo          = create$control("img", "logo", $logoContainer, { src: typeof options.logoSrc === "string" ? options.logoSrc : "https://app.voucherify.io/images/favicon.png" });
      var $code          = create$control("input", "code", $container, { type: "text", placeholder: typeof options.textPlaceholder === "string" ? options.textPlaceholder : "e.g. abc-123" });
      var $amount        = create$control("input", "amount", $container, { type: options.amount ? "text" : "hidden", placeholder: typeof options.amountPlaceholder === "string" ? options.amountPlaceholder : "e.g. 52.22" });
      var $tracking      = create$control("input", "tracking", $container, { type: "hidden", configurable: true });
      var $redeem      = create$control("button", "redeem", $container, {});
      var $redeemText  = create$control("span", "redeemText", $redeem, { text: typeof options.textRedeem === "string" ? options.textRedeem : "Redeem" });

      var self = this;
      var classInvalid = options.classInvalid === "string" ? options.classInvalid : "voucherifyInvalid";
      var classValid = typeof options.classValid === "string" ? options.classValid : "voucherifyValid";
      var classInvalidAnimation = options.classInvalidAnimation === "string" ? options.classInvalidAnimation : "voucherifyAnimationShake";
      var classValidAnimation = options.classValidAnimation === "string" ? options.classValidAnimation : "voucherifyAnimationTada";

      $code.on("keyup", function(event) {
        $code.toggleClass(classInvalidAnimation, false);
      });

      $amount.on("keyup", function(event) {
        $amount.toggleClass(classInvalidAnimation, false);
      });

      $redeem.on("click", function(event) {
        $tracking.val("");

        $redeem.toggleClass(classInvalid, false);
        $redeem.toggleClass(classValid, false);

        if (!$code.val()) {
          $code.toggleClass(classInvalidAnimation, true)
            .delay(1000)
            .queue(function(){
              $code.toggleClass(classInvalidAnimation, false);
              $code.dequeue();
            });
          return;
        }

        var payload = {
          order: {
            amount: parseInt(parseFloat($amount.val().replace(/\,/, ".")) * 100)
          }
        };

        self.redeem($code.val(), payload, function(response) {
          if (!response || response.result !== 'SUCCESS') {

            var setFieldInvalid = function ($field) {
              $field.toggleClass(classInvalid, true);
              $field.toggleClass(classValid, false);
              $field.toggleClass(classInvalidAnimation, true)
                .delay(1000)
                .queue(function(){
                  $field.toggleClass(classInvalidAnimation, false);
                  $field.dequeue();
                });
            };

            $redeem.toggleClass(classInvalid, true);
            $redeem.toggleClass(classValid, false);

            var context         = response.context || {};
            var responseJSON    = context.responseJSON || {};
            var error_key       = responseJSON.key;

            if (options.amount && (
                error_key === INVALID_AMOUNT ||
                error_key === INVALID_NUMBER ||
                error_key === MISSING_AMOUNT)) {
              setFieldInvalid($amount);
            } else {
              setFieldInvalid($code);
            }
            return;
          }

          if ($amount.val() >= 0) {
            $amount.val(parseFloat($amount.val().replace(/\,/, ".")))
          } else {
            $amount.hide(100);
          }

          $code.toggleClass(classInvalid, false);
          $amount.toggleClass(classInvalid, false);
          $tracking.val(response.tracking_id || "");

          $code.prop("disabled", true);
          $amount.prop("disabled", true);
          $redeem.prop("disabled", true);

          $code.toggleClass(classValid, true);
          $amount.toggleClass(classValid, true);
          $redeem.toggleClass(classValid, true);
          $redeem.toggleClass(classInvalid, false);
          $code.toggleClass(classInvalid, false);

          $code.toggleClass(classValidAnimation, true);
          $amount.toggleClass(classValidAnimation, true);

          if (options && options.onRedeem && typeof options.onRedeem === "function") {
            options.onRedeem(response);
          }
        });
      });
    },

    renderPublish : function (selector, options) {
      var $element = $(selector);
      if (!$element || !$element.length) {
        throw new Error("Element '" + selector + "' cannot be found");
      }

      options = options || {};

      if (!options.campaignName) {
        throw new Error("Option campaignName is not specified");
      }

      function contains(arr, prop) {
        return Array.prototype.some.call(arr || [], function (field) {
          return field.name === prop;
        });
      }

      function containsCustomer(prop) {
          return contains(options.customerFields, prop);
      }

      function isRequired(prop) {
          var field = Array.prototype.find.call(options.customerFields || [], function (field) {
              return field.name === prop;
          });

          return field && field.required || false;
      }

      function getCapitalizedName(name) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }

      function getPropertyName(prefix, name) {
        return prefix + getCapitalizedName(name);
      }

      function getConfigProperty(prefix, name) {
        return options[getPropertyName(prefix, name)];
      }

      function create$control(type, name, $container, config) {
        config = config || {};
        var $control = null;
        var configured$control = getConfigProperty("selector", name);

        if (config.configurable && configured$control) {
          $control = $(configured$control);
        }

        if (!$control || !$control.length) {
          $control = $(document.createElement(type));
          $container.append($control);

          for (var attribute in config) {
            if (attribute !== "configurable" && config.hasOwnProperty(attribute)) {
              $control.attr(attribute, config[attribute]);
            }
          }

          if (type === "input") {
            $control.attr("name", getPropertyName("voucherify", name));
          }

          if (type === "span" && config.text) {
            $control.text(config.text);
          }
        }

        $control.addClass(typeof getConfigProperty("class", name) === "string" ? getConfigProperty("class", name) : getPropertyName("voucherify", name));
        return $control;
      }

      var $container     = create$control("div", "container", $element);
      $container.addClass("wide");
      var $logoContainer = create$control("figure", "logo", $container);
      var $logo          = create$control("img", "logo", $logoContainer, { src: typeof options.logoSrc === "string" ? options.logoSrc : "https://app.voucherify.io/images/favicon.png" });

      var $customerName  = containsCustomer("name") && create$control("input", "customerName", $container, { type: "text", placeholder: typeof options.customerNamePlaceholder === "string" ? options.customerNamePlaceholder : "Name" });
      var $row1          = create$control("div", "row", $container);
      var $customerEmail = containsCustomer("email") && create$control("input", "customerEmail", $row1, { type: "email", placeholder: typeof options.customerEmailPlaceholder === "string" ? options.customerEmailPlaceholder : "Email" });
      var $customerPhone = containsCustomer("phone") && create$control("input", "customerPhone", $row1, { type: "text", placeholder: typeof options.customerPhonePlaceholder === "string" ? options.customerPhonePlaceholder : "Phone" });
      var $customerLine1 = containsCustomer("line_1") && create$control("input", "customerLine1", $container, { type: "text", placeholder: typeof options.customerLine1Placeholder === "string" ? options.customerLine1Placeholder : "Address line 1" });
      var $customerLine2 = containsCustomer("line_2") && create$control("input", "customerLine2", $container, { type: "text", placeholder: typeof options.customerLine2Placeholder === "string" ? options.customerLine2Placeholder : "Address line 2" });
      var $row3          = create$control("div", "row", $container);
      var $customerPostalCode = containsCustomer("postal_code") && create$control("input", "customerPostalCode", $row3, { type: "text", placeholder: typeof options.customerPostalCodePlaceholder === "string" ? options.customerPostalCodePlaceholder : "Postal Code" });
      var $customerCity = containsCustomer("city") && create$control("input", "customerCity", $row3, { type: "text", placeholder: typeof options.customerCityPlaceholder === "string" ? options.customerCityPlaceholder : "City" });
      var $row4          = create$control("div", "row", $container);
      var $customerState = containsCustomer("state") && create$control("input", "customerState", $row4, { type: "text", placeholder: typeof options.customerStatePlaceholder === "string" ? options.customerStatePlaceholder : "State" });
      var $customerCountry = containsCustomer("country") && create$control("input", "customerCountry", $row4, { type: "text", placeholder: typeof options.customerCountryPlaceholder === "string" ? options.customerCountryPlaceholder : "Country" });

      var $tracking      = create$control("input", "tracking", $container, { type: "hidden", configurable: true });

      var $publishStatus = create$control("input", "publishStatus", $container, { type: "text" });

      var $publish       = create$control("button", "publish", $container, {});
      var $publishText   = create$control("span", "publishText", $publish, { text: typeof options.textPublish === "string" ? options.textPublish : "Get voucher" });

      $publishStatus.prop("readonly", true).hide();

      var self = this;
      var classInvalid = options.classInvalid === "string" ? options.classInvalid : "voucherifyInvalid";
      var classValid = typeof options.classValid === "string" ? options.classValid : "voucherifyValid";
      var classInvalidAnimation = options.classInvalidAnimation === "string" ? options.classInvalidAnimation : "voucherifyAnimationShake";
      var classValidAnimation = options.classValidAnimation === "string" ? options.classValidAnimation : "voucherifyAnimationTada";

      function error$control($control) {
        $control.toggleClass(classInvalid, true);
        $control.toggleClass(classValid, false);
        $control.toggleClass(classInvalidAnimation, true)
          .delay(1000)
          .queue(function(){
            $control.toggleClass(classInvalidAnimation, false);
            $control.toggleClass(classInvalid, false);
            $control.toggleClass(classValid, false);
            $control.dequeue();
          });
      }

      $publish.on("click", function(event) {
        $tracking.val("");

        $publish.toggleClass(classInvalid, false);
        $publish.toggleClass(classValid, false);

        var payload = {
          customer: {}
        };

        if (containsCustomer("name")) {
          if (!$customerName.val() && isRequired("name")) {
            return error$control($customerName);
          }
          payload.customer["name"] = $customerName.val();
        }

        if (containsCustomer("email")) {
          if (!$customerEmail.val() && isRequired("email")) {
              return error$control($customerEmail);
          }
          if ($customerEmail.val() && !EMAIL_PATTERN.test($customerEmail.val())) {
              return error$control($customerEmail);
          }
          payload.customer["email"] = $customerEmail.val();
          payload.customer["source_id"] = payload.customer["email"];
        }

        if (containsCustomer("phone") ) {
          if (!$customerPhone.val() && isRequired("phone")) {
              return error$control($customerPhone);
          }
          if ($customerPhone.val()) {
            payload.customer["phone"] = $customerPhone.val();
          }
        }

        if (containsCustomer("line_1") ||
            containsCustomer("line_2") ||
            containsCustomer("postal_code") ||
            containsCustomer("city") ||
            containsCustomer("state") ||
            containsCustomer("country")) {
          payload.customer["address"] = {};
        }

        if (containsCustomer("line_1")) {
          if (!$customerLine1.val() && isRequired("line_1")) {
            return error$control($customerLine1);
          }
          payload.customer["address"]["line_1"] = $customerLine1.val();
        }

        if (containsCustomer("line_2")) {
          if (!$customerLine2.val() && isRequired("line_2")) {
            return error$control($customerLine2);
          }
          payload.customer["address"]["line_2"] = $customerLine2.val();
        }

        if (containsCustomer("postal_code")) {
          if (!$customerPostalCode.val() && isRequired("postal_code")) {
            return error$control($customerPostalCode);
          }
          payload.customer["address"]["postal_code"] = $customerPostalCode.val();
        }

        if (containsCustomer("city")) {
          if (!$customerCity.val() && isRequired("city")) {
            return error$control($customerCity);
          }
          payload.customer["address"]["city"] = $customerCity.val();
        }

        if (containsCustomer("state")) {
          if (!$customerState.val() && isRequired("state")) {
            return error$control($customerState);
          }
          payload.customer["address"]["state"] = $customerState.val();
        }

        if (containsCustomer("country")) {
          if (!$customerCountry.val() && isRequired("country")) {
            return error$control($customerCountry);
          }
          payload.customer["address"]["country"] = $customerCountry.val()
        }

        self.publish(options.campaignName, payload, function(response) {
          if (!response || !response.voucher || !response.voucher.code) {
            var context         = response.context || {};
            var responseJSON    = context.responseJSON || {};
            var error_key       = responseJSON.key;

            error$control($publish);

            if (containsCustomer("phone") && error_key === INVALID_CUSTOMER_PHONE) {
              error$control($customerPhone);
            }

            return;
          }

          $customerName && $customerName.hide();
          $customerEmail && $customerEmail.hide();
          $customerPhone && $customerPhone.hide();
          $customerLine1 && $customerLine1.hide();
          $customerLine2 && $customerLine2.hide();
          $customerPostalCode && $customerPostalCode.hide();
          $customerCity && $customerCity.hide();
          $customerState && $customerState.hide();
          $customerCountry && $customerCountry.hide();

          $publishStatus
              .toggleClass(classValidAnimation, true)
              .val(response.voucher.code).show(100);

          $tracking.val(response.tracking_id || "");

          $publish.prop("disabled", true);

          $publish
              .toggleClass(classInvalid, false)
              .hide();

          if (options && options.onPublished && typeof options.onPublished === "function") {
            options.onPublished(response);
          }
        });
      });
    },
    refreshIframes: function () {
      window.docReady(function () {
        console.info("Re-render voucherify iframes.");
        renderIframes();
      });
    }
  };

  (function(funcName, baseObj) {
    "use strict";

    if (!baseObj) {
      return;
    }

    funcName = funcName || "docReady";
    baseObj = baseObj || window;
    var readyList = [];
    var readyFired = false;
    var readyEventHandlersInstalled = false;

    function ready() {
      if (!readyFired) {
        readyFired = true;
        for (var i = 0; i < readyList.length; i++) {
          readyList[i].fn.call(window, readyList[i].ctx);
        }
        readyList = [];
      }
    }

    function readyStateChange() {
      if ( document.readyState === "complete" ) {
        ready();
      }
    }

    baseObj[funcName] = function(callback, context) {
      if (typeof callback !== "function") {
        throw new TypeError("callback for docReady(fn) must be a function");
      }
      if (readyFired) {
        setTimeout(function() {callback(context);}, 1);
        return;
      } else {
        readyList.push({fn: callback, ctx: context});
      }
      if (document.readyState === "complete" || (!document.attachEvent && document.readyState === "interactive")) {
        setTimeout(ready, 1);
      } else if (!readyEventHandlersInstalled) {
        if (document.addEventListener) {
          document.addEventListener("DOMContentLoaded", ready, false);
          window.addEventListener("load", ready, false);
        } else {
          document.attachEvent("onreadystatechange", readyStateChange);
          window.attachEvent("onload", ready);
        }
        readyEventHandlersInstalled = true;
      }
    }
  })("docReady", window);

  function renderIframes() {
    var host = "https://app.voucherify.io";
    var common_attributes = [
      "client-app-id",
      "client-token",

      "logo",

      "widget-id",
      "height"
    ];

    var customer_attributes = [
      "name-field",
      "name-field-required",
      "name-field-label",

      "email-field",
      "email-field-required",
      "email-field-label",

      "phone-field",
      "phone-field-required",
      "phone-field-label",

      "address-line-1-field",
      "address-line-1-field-required",
      "address-line-1-field-label",

      "address-line-2-field",
      "address-line-2-field-required",
      "address-line-2-field-label",

      "city-field",
      "city-field-required",
      "city-field-label",

      "postal-code-field",
      "postal-code-field-required",
      "postal-code-field-label",

      "state-field",
      "state-field-required",
      "state-field-label",

      "country-field",
      "country-field-required",
      "country-field-label",
    ];

    var gdpr_fields = [
      "consent-label",
      "consent-description",
      "consent-options",
      "consent-options-required",
      "consent-legal",
    ];

    var iframes_widgets = {
      "voucher-redeem": {
        "path": "/widgets/redeem",
        "defaults": {
          "height": "480px"
        },
        "attributes": [
          "code",

          "code-field",
          "code-field-required",
          "code-field-label",

          "amount-field",
          "amount-field-required",
          "amount-field-label",

          "button-label"
        ]
      },
      "get-voucher": {
        "path": "/widgets/publish",
        "defaults": {
          "height": "430px"
        },
        "attributes": [
          "campaign",

          "metadata",
          "source",

          "button-label"
        ]
      },
      "subscribe": {
        "path": "/widgets/subscribe",
        "defaults": {
          "height": "220px"
        },
        "attributes": [
          "metadata",
          "source",

          "subscribe-label"
        ].concat(gdpr_fields)
      }
    };

    var helpers = {
      bind: function (element, name, callback) {
        if (element.addEventListener) {
          return element.addEventListener(name, callback, false)
        } else {
          return element.attachEvent("on" + name, callback)
        }
      },
      readOptions: function (element, allowed_options, defaults) {
        return Array.prototype.reduce.call(allowed_options, function (options, allowed_option) {
          var option_value = element.getAttribute("data-" + allowed_option);

          if (option_value) {
            options[allowed_option] = option_value;
          } else if (defaults[allowed_option]) { // check if the default value is provided
            options[allowed_option] = defaults[allowed_option];
          }

          return options;
        }, {});
      },
      encodeOptions: function (options) {
        var query_parameters = [];

        Object.keys(options).forEach(function(option_key) {
          query_parameters.push("[options]["+option_key+"]="+encodeURIComponent(options[option_key]));
        });

        return "?" + query_parameters.join("&");
      }
    };


    function RenderIframe(element, options) {
      var self = this;

      self._element = element;

      self._path = options.path;

      self._options = helpers.readOptions(self._element, common_attributes.concat(customer_attributes).concat(options.attributes), options.defaults);

      self._iframe = null;

      return this.renderIframe();
    }

    RenderIframe.prototype.renderIframe = function () {
      var self = this;

      if (self._iframe) {
        return self;
      }

      // -- set custom height or fallback
      var widget_height = self._options.height;
      // -- remove custom height from options to prevent before sending it
      self._options.height = undefined;

      var css_props = [
        "width:400px;",
        "height:" + widget_height + ";",
        "background: transparent;",
        "border: 0px none transparent;",
        "overflow-x: hidden;",
        "overflow-y: auto;",
        "visibility: hidden;",
        "margin: 0;",
        "padding: 0;",
        "-webkit-tap-highlight-color: transparent;",
        "-webkit-touch-callout: none;"
      ];

      self._iframe = document.createElement("iframe");
      self._iframe.setAttribute("frameBorder", "0");
      self._iframe.setAttribute("allowtransparency", "true");
      self._iframe.style.cssText = css_props.join("\n");

      helpers.bind(self._iframe, "load", function () {
        return self._iframe.style.visibility = "visible"
      });

      self._iframe.src = host + self._path + helpers.encodeOptions(self._options);

      self._element.appendChild(self._iframe);

      return self;
    };

    var widgets = [];

    Object.keys(iframes_widgets).forEach(function (widget_name) {
      var elements = window.document.querySelectorAll(".voucherify-" + widget_name);

      Array.prototype.forEach.call(elements, function (element) {
        widgets.push(new RenderIframe(element, iframes_widgets[widget_name]));
      })
    });

    return widgets;
  }

  if (window) {
    window.docReady(function () {
      console.info("Document ready. Render voucherify iframes.");
      renderIframes();
    });
  }


  if (typeof module !== "undefined" && module.exports) {
    module.exports = voucherify;
  }

  return voucherify;
} (window, window.document, window.jQuery));
