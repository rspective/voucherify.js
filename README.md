## Voucherify - JavaScript SDK

[Voucherify](http://voucherify.io?utm_source=inbound&utm_medium=github&utm_campaign=voucherify-js) has a new platform that will help your team automate voucher campaigns. It does this by providing composable API and the marketer-friendly interface that increases teams' productivity:

- **roll-out thousands** of vouchers **in minutes** instead of weeks,
- **check status** or disable **every single** promo code in real time, 
- **track redemption** history and build reports on the fly.

This is a library to facilitate voucher codes validation on your web page.

You can find full documentation on [voucherify.readme.io](https://voucherify.readme.io).

### Usage

### 1. Install script

Attach `voucherify-${VERSION}.min.js` to your page, somewhere near `</body>`:

```html
<script type="text/javascript" src="/js/voucherify-${VERSION}.min.js"></script>
```

### 2. Initialize settings

[Log-in](http://app.voucherify.io/#/login) to Voucherify web interace and obtain your Client-side Keys from [Configuration](https://app.voucherify.io/#/app/configuration):

![](https://www.filepicker.io/api/file/uOLcUZuSwaJFgIOvBpJA)

Invoke `Voucherify.initialize(...)` when your application starts up:

```javascript
$(function () {
    Voucherify.initialize(
        "YOUR-CLIENT-APPLICATION-ID-FROM-SETTINGS",
        "YOUR-CLIENT-TOKEN-FROM-SETTINGS"
    );
});
```

As a third argument you can specify a timeout setting (in *milliseconds*):

```javascript
$(function () {
    Voucherify.initialize(
        "YOUR-CLIENT-APPLICATION-ID-FROM-SETTINGS",
        "YOUR-CLIENT-TOKEN-FROM-SETTINGS",
        2000
    );
});
```

We are tracking users which are validating vouchers with those who consume them, by a `tracking_id`. By that we are setting up an identity for the user. If you want to provide your custom value for `tracking_id`, you can do it with this simple function:

```javascript
$(function () {
    Voucherify.setIdentity("Your format of tracking_id e.g. Phone number or Email address.");
});
```

You will receive assigned value in the validation response. If you don't pass it, we will generate an ID on the server side, and also we will attach it to the response.

### 3. Profit! Validate vouchers.

Now you can validate vouchers, by this simple *API*:

```javascript
Voucherify.validate("VOUCHER-CODE", function callback (response) {
    /*
    {
        "valid": true,
        "discount": {
            "type": "AMOUNT",
            "amount_off": 999
        }
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR

    {
        "valid": true,
        "discount": {
            "type": "PERCENT",
            "percent_off": 15.0
        }
        "tracking_id": "generated-or-passed-tracking-id"
    }
    
    OR

    {
        "valid": true,
        "discount": {
            "type": "UNIT",
            "unit_off": 1.0
        }
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR

    {
        "valid": false,
        "discount": null,
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR

    {
        "type": "error",
        "message": "More details will be here.",
        "context": "Here you will receive context of that error."
    }
    */
});
```

If you are using *jQuery* in version higher than *1.5*, you can use its implementation of promises (remember to load `voucherify.js` script after loading *jQuery*):

```javascript
Voucherify.validate("VOUCHER-CODE")
  .done(function (data) {
    /*
    {
        "valid": true,
        "discount": {
            "type": "AMOUNT",
            "amount_off": 2523
        }
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR

    {
        "valid": true,
        "discount": {
            "type": "PERCENT",
            "percent_off": 10.0
        }
        "tracking_id": "generated-or-passed-tracking-id"
    }
    
    OR
    
    {
        "valid": true,
        "discount": {
            "type": "UNIT",
            "unit_off": 1.0
        }
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR

    {
        "valid": false,
        "discount": null,
        "tracking_id": "generated-or-passed-tracking-id"
    }
    */
  })
  .fail(function (error) {
    /*
    {
        "type": "error",
        "message": "More details will be here.",
        "context": "Here you will receive context of that error."
    }
    */
  });
```

### Changelog

- **2016-03-18** - `1.4.1` - Fix voucher checkout input style.
- **2016-03-11** - `1.4.0` - Add sample checkout form to validating vouchers.
- **2015-12-10** - `1.3.0` - New discount model. Added UNIT - a new discount type.
- **2015-11-23** - `1.2.1` - Added `X-Voucherify-Channel` header.
- **2015-11-10** - `1.2.0` - Add util for computing retrieved discount.
- **2015-11-10** - `1.1.0` - Add util for computing price after discount (supports PERCENT and AMOUNT vouchers).
- **2015-11-05** - `1.0.2` - Updated readme - trackingId renamed to tracking_id.
- **2015-09-11** - `1.0.1` - Updated backend URL.
- **2015-08-10** - `1.0.0` - Official stable release.
- **2015-08-10** - `0.0.1` - Initial version of the SDK.
