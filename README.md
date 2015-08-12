## Voucherify - JavaScript SDK

### Usage

### 1. Install script

Attach `voucherify-${VERSION}.min.js` to your page, somewhere near `</body>`:

```html
<script type="text/javascript" src="/js/voucherify-0.0.1.min.js"></script>
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

### 3. Profit! Validate vouchers.

Now you can validate vouchers, by this simple *API*:

```javascript
Voucherify.validate("VOUCHER-CODE", function callback (response) {
    /*
    {
        "valid": true,
        "type": "amount",
        "discount": 9.99
    }

    OR

    {
        "valid": true,
        "type": "percent",
        "discount": 15
    }

    OR

    {
        "valid": false,
        "type": null,
        "discount": null
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
        "discount": 25.23
    }

    OR

    {
        "valid": true,
        "type": "percentage",
        "discount": 10
    }

    OR

    {
        "valid": false,
        "type": null,
        "discount": null
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

- **2015-08-10** - `0.0.1` - Initial version of the SDK.
