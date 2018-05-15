## Voucherify - JavaScript SDK

[Voucherify](https://voucherify.io/?utm_campaign=sdk&utm_medium=docs&utm_source=github) is an API-first platform for software developers who are dissatisfied with high-maintenance custom coupon software. Our product is a coupon infrastructure through API that provides a quicker way to build coupon generation, distribution and tracking. Unlike legacy coupon software we have:

* an API-first SaaS platform that enables customisation of every aspect of coupon campaigns
* a management console that helps cut down maintenance and reporting overhead
* an infrastructure to scale up coupon activity in no time

This is a library to facilitate coupon codes validation and redemption on your website.

You can find the full API documentation on [docs.voucherify.io](https://docs.voucherify.io).

Contents:

* [1](https://github.com/rspective/voucherify.js#initialize-settings) - Installation and client-side authentication
* [2](https://github.com/rspective/voucherify.js#validation) - How to validate [vouchers](https://docs.voucherify.io/reference/#vouchers-validate) and [promotions](https://docs.voucherify.io/reference/#validate-promotions-1)
* [3](https://github.com/rspective/voucherify.js#redeem-vouchers) - How to call [redemption](https://docs.voucherify.io/reference/#redeem-voucher-client-side)
* [4](https://github.com/rspective/voucherify.js#publish-vouchers) - How to call [publish](https://docs.voucherify.io/reference/#publish-voucher) coupons
* [5](https://github.com/rspective/voucherify.js#list-vouchers) - How to call [list](https://docs.voucherify.io/reference/#list-vouchers) coupons
* [6](https://github.com/rspective/voucherify.js#validation-widget) - Configuring validation widget 
* [7](https://github.com/rspective/voucherify.js#redeem-widget) - Configuring redemption widget
* [8](https://github.com/rspective/voucherify.js#publish-widget) - Configuring publish widget 
* [9](https://github.com/rspective/voucherify.js#subscribe-widget---iframe) - Configuring customer profile widget 

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

### Validation 

Reference: 
[vouchers](https://docs.voucherify.io/reference/#vouchers-validate)
[promotions](https://docs.voucherify.io/reference/#validate-promotions-1)

You validate by invoking:

`Voucherify.validate(params, function callback (response) { })`

where params is an object including: 

- `code` *(required)* - voucher's code
- `amount` *(required for gift vouchers, integer, value in cents)* - order's amount that is going to be paid by voucher (entirely or partially)
- `items` *(required for order validation rules)* - order items, an array of objects with following properties `product_id`, `sku_id` and `quantity`
- `customer` *(optional)* - an object including `id` and/or `source_id` of a customer, if provided then it has higher precedence than `tracking_id`
- `metadata` *(required for metadata validation rules)* - on object containing values of any type (boolean, number, string)

or (only voucher validation)

`Voucherify.validate("VOUCHER-CODE", function callback (response) { })`

Example - check if one can redeem $50 from 'gift100' voucher:

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
 
Valid promotion response:
 
 
```javascript
  {
      "valid": true,
      "promotions": [
          {
              "object": "PROMO_TIER",
              "id": "PROMO_ID",
              "banner": "PROMO BANNER",
              "discount_amount": 1000,
              "discount": {
                  "type": "amount",
                  "amount_off": 1000
              },
              "metadata": {}
          }
      ]
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

There are several reasons why validation may fail (`valid: false` response). You'll find the actual cause in the `reason` field. For more details, visit [error reference](https://docs.voucherify.io/reference#errors) section.

### Redeem vouchers

Next to validation, the library allows you to [redeem](https://docs.voucherify.io/reference/#redeem-voucher-client-side) vouchers. 
Note: you have to enable **client-side redemptions** in your project's configuration.

Reference: [redemption object](http://docs.voucherify.io/reference#the-redemption-object), [client-side redeem](https://docs.voucherify.io/reference/#redeem-voucher-client-side)

How to use it:


`Voucherify.redeem("VOUCHER-CODE", payload, function callback (response) { })`

where `payload` is an object which can include: 

- `customer` - voucher customer object
    - `source_id` - if not set, `tracking_id` will be used (if `tracking_id` is set)
- `order` - with at least
    - `amount`

Example:

`Voucherify.redeem("gfct5ZWI1nL", { order: { amount: 5000 } }, function callback (response) { })`


Success response 

```javascript
{
  "object": "redemption",
  "customer_id": "cust_vAZ0M5nQUDv3zDoAcT6QSYhb",
  "tracking_id": "(tracking_id not set)"
  "result": "SUCCESS",
  "amount": 30,
  "order": {
    "amount": 30,
    "discount_amount": 30,
    "items": null,
    "customer": {
      "id": "cust_vAZ0M5nQUDv3zDoAcT6QSYhb",
      "object": "customer"
    },
    "referrer": null,
    "status": "CREATED",
    "metadata": null
  },
  "voucher": {
    "code": "gfct5ZWI1nL",
    "campaign": "Gift Card Campaign",
    "category": null,
    "type": "GIFT_VOUCHER",
    "discount": null,
    "gift": {
      "amount": 1000,
      "balance": 970
    },
    "publish": {
      "object": "list",
      "count": 0
    },
    "redemption": {
      "object": "list",
      "quantity": 1,
      "redeemed_quantity" :1,
      "redeemed_amount": 30
    },
    "active": true,
    "additional_info": null,
    "metadata": null,
    "is_referral_code": false,
    "object":"voucher"
  }
}
```

If you are using *jQuery* in version higher than *1.5*, you can use its implementation of promises (remember to load `voucherify.js` script after loading *jQuery*):

```javascript
Voucherify.redeem("VOUCHER-CODE", payload)
  .done(function (data) {
      /* response above */
  }
  .fail(function (error) {
       /*
       {
            "code":400,
            "message":"quantity exceeded",
            "details":"gfct5ZWI1nL",
            "key":"quantity_exceeded"
        }
       */
  });
 ```
 
### Publish vouchers

There is an option to publish vouchers through the client API. In order to do that
you have to enable client-side publication in your project's configuration.

`Voucherify.publish(campaignName, context, function callback (response) { })`

- `campaignName` - required, name of a campaign from which a voucher should be published
- `context` - optional, an object consisting of
  - `customer` - customer profile
  - `channel` - publication channel (`Voucherify.js` by default)
  - `metadata` - an object containing any additional data related with publication

### List vouchers

Use the `listVouchers` method if you want to show a list of vouchers from a specific campaign on category.
If you want to use this method you have to enable it in your project's configuration.

`Voucherify.listVouchers(filters, function callback (response) { })`

- `filters` - optional, an object consisting of
  - `campaign` - limit vouchers to the ones that belong to the specified campaign
  - `category` - limit vouchers to the ones that are within the specified category
  - `page` - a number greater than or equal to 1
  - `limit` - a number between 1 and 100
  
### Track custom events

Custom events are actions taken by your customers. Those events are best suited for tracking high-value interactions with your app. Logging a custom event can trigger any number of subsequent operations (e.g.: email distribution). It is enabled by default. There is no need for changing project configuration.

`Voucherify.track(eventName, metadata, customer, function callback (response) { })`

- `eventName` - required, an identifier of event 
- `metadata` - required, an object containing data describing an event
- `customer` - optional, customer details, by default Voucherify takes profile declared with method Voucherify.setIdentity()

### Use utils to calculate discount and price after discount

`Voucherify.utils.calculatePrice(productPrice, voucher, unitPrice [optional])`
`Voucherify.utils.calculateDiscount(productPrice, voucher, unitPrice [optional])`

### Validation widget

If you need a quick UI to validate vouchers on your website then use `Voucherify.render(selector, options)`:
  
   - `selector` - identifies an HTML element that will be used as a container for the widget
   - `options`:
       - `classInvalid` - CSS class applied to the input when entered code is invalid
       - `classInvalidAnimation` - CSS class describing animation of the input field when entered code is invalid
       - `classValid` - CSS class applied to the input when entered code is valid
       - `classValidAnimation` - CSS class describing animation of the input field when entered code valid
       - `logoSrc` - source of the image appearing in the circle at the top
       - **`onValidated`** - a callback function invoked when the entered code is valid, it takes the validation response as a parameter
       - `amount` - flag enables the amount input field
       - `textPlaceholder` - text displayed as a placeholder in the code input field
       - `amountPlaceholder` - text displayed as a placeholder in the amount input field (`amount: true` is required)
       - `textValidate` - a text displayed on the button (default: "Validate")

The widget requires jQuery to work and `voucherify.css` to display properly.

This is how the widget looks like:

![Voucherify Widget](https://www.filepicker.io/api/file/rnJNaWbpSVu2MNkdbuo2)

You can find a working example in [example/discount-widget.html](example/discount-widget.html) or [jsfiddle](https://jsfiddle.net/voucherify/25709bxo)

### Redeem widget

If you need a quick way to redeem vouchers on your website, you can use `Voucherify.renderRedeem(selector, options)`:

   - `selector` - identifies an HTML element that will be used as a container for the widget
      - `options`:
          - `classInvalid` - CSS class applied to the input when entered code is invalid
          - `classInvalidAnimation` - CSS class describing animation of the input field when entered code is invalid
          - `classValid` - CSS class applied to the input when entered code is valid
          - `classValidAnimation` - CSS class describing animation of the input field when entered code valid
          - `logoSrc` - source of the image appearing in the circle at the top
          - **`onRedeem`** - a callback function invoked when the entered code is redeemed, it takes the redemption response as a parameter
          - `amount` - flag enables the amount input field
          - `textPlaceholder` - text displayed as a placeholder in the code input field
          - `amountPlaceholder` - text displayed as a placeholder in the amount input field (`amount: true` is required)
          - `textRedeem` - a text displayed on the button (default: "Redeem")

#### iframe 

The iframe renders the redeem widget 

```html
<div class="voucherify-voucher-redeem"
     data-client-app-id="YOUR-CLIENT-APPLICATION-ID-FROM-SETTINGS"
     data-client-token="YOUR-CLIENT-TOKEN-FROM-SETTINGS"

     data-code-field="true"
     data-code-field-label="Label"

     data-amount-field="true"
     data-amount-field-required="true"
     data-amount-field-label="Amount"

     data-button-label="Redeem voucher"

     data-logo="Logo"
     data-metadata="{'example': true, 'lang': 'eng'}"></div>
```

The widget is fully configurable. You can decide which fields are visible and required. Moreover, you can change the standard labels displayed in the input fields as placeholders. Configuration: 
  
- `data-code-field="BOOLEAN"`
- `data-code-field-label="Field label"`
- `data-amount-field="BOOLEAN"`
- `data-amount-field-required="BOOLEAN"`
- `data-amount-field-label="Field label"`
- `data-button-label="Button label"`
- `data-email-field="BOOLEAN"`
- `data-email-field-required="BOOLEAN"`
- `data-email-field-label="Field label"`
- `data-phone-field="BOOLEAN"`
- `data-phone-field-required="BOOLEAN"`
- `data-phone-field-label="Field label"`
- `data-address-line-1-field="BOOLEAN"`
- `data-address-line-1-field-required="BOOLEAN"`
- `data-address-line-1-field-label="Field label"`
- `data-address-line-2-field="BOOLEAN"`
- `data-address-line-2-field-required="BOOLEAN"`
- `data-address-line-2-field-label="Field label"`
- `data-city-field="BOOLEAN"`
- `data-city-field-required="BOOLEAN"`
- `data-city-field-label="Field label"`
- `data-postal-code-field="BOOLEAN"`
- `data-postal-code-field-required="BOOLEAN"`
- `data-postal-code-field-label="Field label"`
- `data-state-field="BOOLEAN"`
- `data-state-field-required="BOOLEAN"`
- `data-state-field-label="Field label"`
- `data-country-field="BOOLEAN"`
- `data-country-field-required="BOOLEAN"`
- `data-country-field-label="Field label"`


### Publish widget

If you need to [publish](https://docs.voucherify.io/reference/#publish-voucher) coupons from a particular campaign on your website, use `Voucherify.renderPublish(selector, options)`:
  
   - `selector` - identifies an HTML element that will be used as a container for the widget
   - `options`:
       - **`campaignName`** - identifier of a [campaign object](https://docs.voucherify.io/reference#the-campaign-object) which will provide unique codes
       - `classInvalid` - CSS class applied to the input when entered data are invalid
       - `classInvalidAnimation` - CSS class describing animation of the input field when entered data are invalid
       - `classValid` - CSS class applied to the input when entered code is valid
       - `classValidAnimation` - CSS class describing animation of the input field when entered data valid
       - `logoSrc` - source of the image appearing in the circle at the top
       - **`onPublished`** - a callback function invoked when getting voucher will succeed, it takes  response as a parameter
       - `customerFields` - list of the customer input fields that are displayed in widget
       - `textPublish` - a text displayed on the button (default: "Get voucher")
       - `customerNamePlaceholder` - text displayed as a placeholder in the name input field
       - `customerEmailPlaceholder` - text displayed as a placeholder in the email input field
       - `customerPhonePlaceholder` - text displayed as a placeholder in the phone input field
       - `customerLine1Placeholder` - text displayed as a placeholder in the first address line input field
       - `customerLine2Placeholder` - text displayed as a placeholder in the second address line input field
       - `customerPostalCodePlaceholder` - text displayed as a placeholder in the postal code input field
       - `customerCityPlaceholder` - text displayed as a placeholder in the city input field
       - `customerStatePlaceholder` - text displayed as a placeholder in the state input field
       - `customerCountryPlaceholder` - text displayed as a placeholder in the country input field
       
The widget requires jQuery to work and `voucherify.css` to display properly.

You can find a working example in [example/publish-widget.html](example/publish-widget.html)

#### iframe

You can also embed the "get voucher" widget as an iframe

```html
<div class="voucherify-get-voucher"
     data-client-app-id="YOUR-CLIENT-APPLICATION-ID-FROM-SETTINGS"
     data-client-token="YOUR-CLIENT-TOKEN-FROM-SETTINGS"
     
     data-campaign="Campaign name"
     
     data-name-field="true"
     data-name-field-required="false"
     data-name-field-label="Name"

     data-email-field="true"
     data-email-field-required="true"
     data-email-field-label="Email"

     data-subscribe-label="Subscribe to the list"

     data-source="Landing_Page_1"
     data-metadata="{'example': true, 'lang': 'eng'}"></div>
```

The widget is fully configurable. You can decide which fields are visible and required. Moreover, you can change the standard labels displayed in the input fields as placeholders. Configuration: 
  
- `data-campaign="STRING"`
- `data-email-field="BOOLEAN"`
- `data-email-field-required="BOOLEAN"`
- `data-email-field-label="Field label"`
- `data-phone-field="BOOLEAN"`
- `data-phone-field-required="BOOLEAN"`
- `data-phone-field-label="Field label"`
- `data-address-line-1-field="BOOLEAN"`
- `data-address-line-1-field-required="BOOLEAN"`
- `data-address-line-1-field-label="Field label"`
- `data-address-line-2-field="BOOLEAN"`
- `data-address-line-2-field-required="BOOLEAN"`
- `data-address-line-2-field-label="Field label"`
- `data-city-field="BOOLEAN"`
- `data-city-field-required="BOOLEAN"`
- `data-city-field-label="Field label"`
- `data-postal-code-field="BOOLEAN"`
- `data-postal-code-field-required="BOOLEAN"`
- `data-postal-code-field-label="Field label"`
- `data-state-field="BOOLEAN"`
- `data-state-field-required="BOOLEAN"`
- `data-state-field-label="Field label"`
- `data-country-field="BOOLEAN"`
- `data-country-field-required="BOOLEAN"`
- `data-country-field-label="Field label"`

### Subscribe widget - iframe 

The iframe redners a widget which creates a customer a profile in Voucherify

```html
<div class="voucherify-subscribe"
     data-client-app-id="YOUR-CLIENT-APPLICATION-ID-FROM-SETTINGS"
     data-client-token="YOUR-CLIENT-TOKEN-FROM-SETTINGS"

     data-name-field="true"
     data-name-field-required="false"
     data-name-field-label="Name"

     data-email-field="true"
     data-email-field-required="true"
     data-email-field-label="Email"

     data-subscribe-label="Subscribe to the list"

     data-source="Landing_Page_1"
     data-metadata="{'example': true, 'lang': 'eng'}"
     
     data-consent-label="Marketing Permissions"
     data-consent-description="The Company Name will use the information you provide on this form to be in touch with you and to provide updates and marketing. Please let us know all the ways you would like to hear from us:"
     data-consent-options="Email;Phone"
     data-consent-legal="You can change your mind at any time by clicking the unsubscribe link in the footer of any email you receive from us, or by contacting us at [support@comapny.com](mailto:support@comapny.com). We will treat your information with respect. For more information about our privacy practices please visit our website. By clicking below, you agree that we may process your information in accordance with these terms."></div>
```

The widget is fully configurable. You can decide which fields are visible and required. Moreover, you can change the standard labels displayed in the input fields as placeholders. Configuration: 
  
- `data-phone-field="BOOLEAN"`
- `data-phone-field-required="BOOLEAN"`
- `data-phone-field-label="Field label"`
- `data-address-line-1-field="BOOLEAN"`
- `data-address-line-1-field-required="BOOLEAN"`
- `data-address-line-1-field-label="Field label"`
- `data-address-line-2-field="BOOLEAN"`
- `data-address-line-2-field-required="BOOLEAN"`
- `data-address-line-2-field-label="Field label"`
- `data-city-field="BOOLEAN"`
- `data-city-field-required="BOOLEAN"`
- `data-city-field-label="Field label"`
- `data-postal-code-field="BOOLEAN"`
- `data-postal-code-field-required="BOOLEAN"`
- `data-postal-code-field-label="Field label"`
- `data-state-field="BOOLEAN"`
- `data-state-field-required="BOOLEAN"`
- `data-state-field-label="Field label"`
- `data-country-field="BOOLEAN"`
- `data-country-field-required="BOOLEAN"`
- `data-country-field-label="Field label"`
- `data-consent-label="Section label"`
- `data-consent-description="Markdown text"`
- `data-consent-options="Option 1;Option 2"`
- `data-consent-legal="Markdown text"`

Note: 
The privacy preferences attributes are available only for iframes.
Description and legal fields do support markdown syntax. It means that you can user markdown to define the links to the external pages or format text, and by that improve experience for your users.


### Changelog

- **2018-05-15** - `1.20.0` - Add support for the privacy preferences to the subscribe iframe widget
- **2018-05-15** - `1.19.0` - Add method to refresh the iframe widgets
- **2018-04-24** - `1.18.0` - Add client side method for promotion validation
- **2017-12-12** - `1.17.0` - Add redeem iframe widget
- **2017-10-23** - `1.16.1` - Fix tracking custom events
- **2017-10-23** - `1.16.0` - Add client side method for tracking custom events
- **2017-06-02** - `1.15.0` - Add attributes to personalize the get voucher widget
- **2017-06-02** - `1.14.0` - Add the custom logo url attribute
- **2017-06-02** - `1.13.1` - Render iframes when document is ready
- **2017-06-02** - `1.13.0` - Implementation of widget which acts as a subscribe form
- **2017-06-02** - `1.12.1` - Add required flag for customer email
- **2017-05-31** - `1.12.0` - Add support for the get voucher iframe
- **2017-05-26** - `1.11.1` - Add normalize styles 
- **2017-05-26** - `1.11.0` - Add widget to get voucher for given customer
- **2017-05-19** - `1.10.0` - Add the amount input field
- **2017-05-19** - `1.9.0` 
  - Add client side publish method,
  - Add a method to list vouchers
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
