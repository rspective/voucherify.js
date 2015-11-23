## Voucherify - JavaScript SDK

### Usage

### 1. Install script

Attach `voucherify-${VERSION}.min.js` to your page, somewhere near `</body>`:

```html
<script type="text/javascript" src="/js/voucherify-${VERSION}.min.js"></script>
```

### 2. Initialize settings

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
        "type": "amount",
        "discount": 9.99,
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR

    {
        "valid": true,
        "type": "percent",
        "discount": 15,
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR

    {
        "valid": false,
        "type": null,
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
        "type": "unit",
        "discount": 25.23,
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR

    {
        "valid": true,
        "type": "percentage",
        "discount": 10,
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR

    {
        "valid": false,
        "type": null,
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

- **2015-11-23** - `1.2.1` - Added `X-Voucherify-Channel` header.
- **2015-11-10** - `1.2.0` - Add util for computing retrieved discount.
- **2015-11-10** - `1.1.0` - Add util for computing price after discount (supports PERCENT and AMOUNT vouchers).
- **2015-11-05** - `1.0.2` - Updated readme - trackingId renamed to tracking_id.
- **2015-09-11** - `1.0.1` - Updated backend URL.
- **2015-08-10** - `1.0.0` - Official stable release.
- **2015-08-10** - `0.0.1` - Initial version of the SDK.
