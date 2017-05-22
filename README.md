## Voucherify - JavaScript SDK

[Voucherify](http://voucherify.io?utm_source=github&utm_medium=sdk&utm_campaign=acq) is an API-first platform for software developers who are dissatisfied with high-maintenance custom coupon software. Our product is a coupon infrastructure through API that provides a quicker way to build coupon generation, distribution and tracking. Unlike legacy coupon software we have:

* an API-first SaaS platform that enables customisation of every aspect of coupon campaigns
* a management console that helps cut down maintenance and reporting overhead
* an infrastructure to scale up coupon activity in no time

This is a library to facilitate voucher codes validation on your web page.

You can find full documentation on [voucherify.readme.io](https://voucherify.readme.io).

### Usage

### Install script

Attach `voucherify.min.js` to your page, somewhere near `</body>`:

```html
<script type="text/javascript" src="/libs/voucherify/voucherify.min.js"></script>
```

You can also link it from [jsdelivr CDN](http://www.jsdelivr.com/projects/voucherify.js):

```html
<script type="text/javascript" src="https://cdn.jsdelivr.net/gh/rspective/voucherify.js@latest/dist/voucherify.min.js"></script>
```

Attach `voucherify.min.css` to your page, somewhere between `<head>` and `</head>`:

```html
<link type="text/css" rel="stylesheet" href="/libs/voucherify/voucherify.min.css" />
```

You can also link it from [jsdelivr CDN](http://www.jsdelivr.com/projects/voucherify.js):

```html
<link type="text/css" rel="stylesheet" href="https://cdn.jsdelivr.net/gh/rspective/voucherify.js@latest/dist/voucherify.min.css" />
```

### Initialize settings

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

### Validate vouchers

Now you can validate vouchers, by this simple *API*:

`Voucherify.validate("VOUCHER-CODE", function callback (response) { })`

or 

`Voucherify.validate(params, function callback (response) { })`

where params is an object including: 

- `code` *(required)* - voucher's code
- `amount` *(required for gift vouchers, integer, value in cents)* - order's amount that is going to be paid by voucher (entirely or partially)
- `items` *(required for order validation rules)* - order items, an array of objects with following properties `product_id`, `sku_id` and `quantity`
- `customer` *(optional)* - an object including `id` and/or `source_id` of a customer, if provided then it has higher precedence than `tracking_id`
- `metadata` *(required for metadata validation rules)* - on object containing values of any type (boolean, number, string)

Example - check if can redeem $50 from 'gift100' voucher:

`Voucherify.validate({code: "gift100", amount: 5000}, function callback (response) { })`

Example responses:

Valid amount discount response:


```javascript
{
    "code": "VOUCHER_CODE",
    "valid": true,
    "discount": {
        "type": "AMOUNT",
        "amount_off": 999,
    }
    "tracking_id": "generated-or-passed-tracking-id"
}
```

Valid percentage discount response:

```javascript
{
    "code": "VOUCHER_CODE",
    "valid": true,
    "discount": {
        "type": "PERCENT",
        "percent_off": 15.0,
    }
    "tracking_id": "generated-or-passed-tracking-id"
}
```

Valid unit discount response:


```javascript
{
    "code": "VOUCHER_CODE",
    "valid": true,
    "discount": {
        "type": "UNIT",
        "unit_off": 1.0,
    }
    "tracking_id": "generated-or-passed-tracking-id"
}
```

Valid gift voucher response:


```javascript
   {
       "code": "VOUCHER_CODE",
       "valid": true,
       "gift": {
           "amount": 10000,
           "balance": 7500
       }
       "tracking_id": "generated-or-passed-tracking-id"
   }
   ```

Invalid voucher response:

```javascript
{
    "code": "VOUCHER_CODE",
    "valid": false,
    "reason": "voucher expired",
    "tracking_id": "generated-or-passed-tracking-id"
}
```

Error response:

```javascript
{
    "type": "error",
    "message": "XHR error happened.",
    "context": {
        "readyState":4,
        "responseJSON":{
            "code": 400,
            "message": "Missing amount",
            "details": "Amount is required when redeeming a GIFT_VOUCHER"
        },
        "responseText": "...",
        "status": 400,
        "statusText": "Bad Request"
    }
}
```

If you are using *jQuery* in version higher than *1.5*, you can use its implementation of promises (remember to load `voucherify.js` script after loading *jQuery*):

```javascript
Voucherify.validate("VOUCHER-CODE")
  .done(function (data) {
    /*
    {
        "code": "VOUCHER_CODE",
        "valid": true,
        "discount": {
            "type": "AMOUNT",
            "amount_off": 2523
        }
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR

    {
        "code": "VOUCHER_CODE",
        "valid": true,
        "discount": {
            "type": "PERCENT",
            "percent_off": 10.0
        }
        "tracking_id": "generated-or-passed-tracking-id"
    }
    
    OR
    
    {
        "code": "VOUCHER_CODE",
        "valid": true,
        "discount": {
            "type": "UNIT",
            "unit_off": 1.0
        }
        "tracking_id": "generated-or-passed-tracking-id"
    }

    OR
    
   {
       "code": "VOUCHER_CODE",
       "valid": true,
       "gift": {
           "amount": 10000,
           "balance": 7500
       }
       "tracking_id": "generated-or-passed-tracking-id"
   }

    OR

    {
        "code": "VOUCHER_CODE",
        "valid": false,
        "reason": "voucher expired",
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

There are several reasons why validation may fail (`valid: false` response). 
You can find the actual cause in the `reason` field:

- `voucher is disabled`
- `voucher not active yet`
- `voucher expired`
- `quantity exceeded`
- `gift amount exceeded`
- `customer does not match segment rules`
- `order does not match validation rules`


### Publish vouchers

There is an option to publish vouchers through the client API. In order to do that
you have to enable client-side publication in your project's configuration.

`Voucherify.publish(campaignName, context, function callback (response) { })`

- `campaignName` - required, name of a campaign from which a voucher should be published
- `context` - optional, an object consisting of
  - `customer` - customer profile
  - `channel` - publication channel (`Voucherify.js` by default)
  - `metadata` - an object containing any additional data related with publication

### Use utils to calculate discount and price after discount

`Voucherify.utils.calculatePrice(productPrice, voucher, unitPrice [optional])`
`Voucherify.utils.calculateDiscount(productPrice, voucher, unitPrice [optional])`

### Discount widget

If you need a quick UI to validate vouchers on your website then use `Voucherify.render(selector, options)`:
  
   - `selector` - identifies an HTML element that will be used as a container for the widget
   - `options`:
       - `classInvalid` - CSS class applied to the input when entered code is invalid
       - `classInvalidAnimation` - CSS class describing animation of the input field when entered code is invalid
       - `classValid` - CSS class applied to the input when entered code is valid
       - `classValidAnimation` - CSS class describing animation of the input field when entered code valid
       - `logoSrc` - source of the image appearing in the circle at the top
       - **`onValidated`** - a callback function invoked when the entered code is valid, it takes the validation response as a parameter
       - `textPlaceholder` - text displayed as a placeholder in the input field
       - `textValidate` - a text displayed on the button (default: "Validate")

The widget requires jQuery to work and voucherify.css to display properly.

This is how the widget looks like:

![Discount Widget](https://www.filepicker.io/api/file/rnJNaWbpSVu2MNkdbuo2)

You can find a working example in [example/discount-widget.html](example/discount-widget.html) or [jsfiddle](https://jsfiddle.net/voucherify/25709bxo)

### Changelog

- **2017-05-19** - `1.9.0` - Add client side publish method.
- **2017-05-12** - `1.8.0` - Enable validation of metadata. Pass customer id and/or source_id.
- **2017-05-10** - `1.7.0` - Add client side redeem method
- **2017-05-09** - `1.6.4` - Fix undefined module in a browser.
- **2017-04-18** - `1.6.3` - Make possible to include voucherify.js as an npm dependency.
- **2017-01-23** - `1.6.2` - Fix XHR InvalidStateError in IE11 (#22). 
- **2016-12-01** - `1.6.1` - Extend utils to support gift vouchers. 
- **2016-08-31** - `1.6.0` - Pass order items (required for validation rules). 
- **2016-06-22** - `1.5.0` - Added support for gift vouchers. 
- **2016-04-14** - `1.4.5` - Prepared for CDN hosting:
   - removed version number from dist files
   - added source maps
- **2016-04-04** - `1.4.4` - Updated API URL.
- **2016-03-31** - `1.4.3` - Fixed logo.
- **2016-03-31** - `1.4.2` - Fixed input names.
- **2016-03-18** - `1.4.1` - Fixed voucher checkout input style.
- **2016-03-11** - `1.4.0` - Added sample checkout form to validating vouchers.
- **2015-12-10** - `1.3.0` - New discount model. Added UNIT - a new discount type.
- **2015-11-23** - `1.2.1` - Added `X-Voucherify-Channel` header.
- **2015-11-10** - `1.2.0` - Added util for computing retrieved discount.
- **2015-11-10** - `1.1.0` - Added util for computing price after discount (supports PERCENT and AMOUNT vouchers).
- **2015-11-05** - `1.0.2` - Updated readme - trackingId renamed to tracking_id.
- **2015-09-11** - `1.0.1` - Updated backend URL.
- **2015-08-10** - `1.0.0` - Official stable release.
- **2015-08-10** - `0.0.1` - Initial version of the SDK.
