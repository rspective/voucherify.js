window.Voucherify = (function (window, document, $) {
  "use strict";

  var API_BASE = "https://api.voucherify.io";

  var API = {
      validate: API_BASE + "/client/v1/validate",
      redeem:   API_BASE + "/client/v1/redeem",
      publish:  API_BASE + "/client/v1/publish",
      list:     API_BASE + "/client/v1/vouchers"
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

      if (!code) {
        console.error("Voucherify client could not verify code, because it is missing - please provide Voucher Code.");
        return null;
      }

      var queryString = "?code=" + encodeURIComponent(code);

      if (amount) {
        queryString += "&amount=" + parseInt(amount); // in cents, amount=1000 means $10
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
        queryString += "&" + Object.keys(customer).map(function(key) {
          return encodeURIComponent("customer[" + key + "]") + "=" + encodeURIComponent(customer[key]);
        }).join("&");
      }

      if (OPTIONS.trackingId) {
        queryString += "&tracking_id=" + encodeURIComponent(OPTIONS.trackingId);
      }

      return xhrImplementation("GET", API.validate + queryString, undefined, callback);
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

      var queryString = "?" + Object.keys(filters)
              .map(function(key) {
                return encodeURIComponent(key) + "=" + encodeURIComponent(filters[key])
              })
              .join("&");

      return xhrImplementation("GET", API.list + queryString, undefined, callback);
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
          return roundMoney(basePrice * (discount / 100));

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

    renderListVouchers: function (selector, options) {
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

      var self = this;

      var possible_filters = ["campaign", "category", "limit"];

      var filters = Array.prototype.reduce.call(Object.keys(options), function (filters, field) {
        if (possible_filters.indexOf(field) > -1 && options[field]) {
          filters[field] = options[field];
        }
        return filters;
      }, {});

      var $container     = create$control("div", "container", $element);
      $container.addClass("sticky wide");
      var $logoContainer = create$control("figure", "logo", $container);
      var $logo          = create$control("img", "logo", $logoContainer, { src: typeof options.logoSrc === "string" ? options.logoSrc : "https://app.voucherify.io/images/favicon.png" });
      var $vouchersList  = create$control("ul", "vouchersList", $container);

      self.listVouchers(filters, function (response) {
        if (!response && !response.vouchers) {
          var context = response.context || {};
          var responseJSON = context.responseJSON || {};

          var error_key = responseJSON.key;
          return;
        }

        Array.prototype.forEach.call(response.vouchers || [], function (voucher) {
          var $voucherItem = create$control("li", "voucherItem", $vouchersList);
          create$control("span", "voucherCode", $voucherItem, { text: voucher.code });
        });

        if (options && options.onListed && typeof options.onListed === "function") {
          options.onListed(response);
        }
      });
    }
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = voucherify;
  }

  return voucherify;
} (window, window.document, window.jQuery));
