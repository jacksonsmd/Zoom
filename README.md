# Zoom Image

## Set up your HTML

```html
<div class="zoom-image">
	<img src="images/image01.jpg" data-zoom-image="images/image01.jpg" height="200" width="285" alt="image description">
</div>
```

## Call the plugin

```js
$(document).ready(function() {
	$('.zoom-image').zoomImage();
});
```