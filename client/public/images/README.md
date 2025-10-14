# Images Directory

यह folder आपकी सभी static images के लिए है। यहाँ आप अपनी सभी images organize कर सकते हैं।

## Folder Structure

```
images/
├── categories/     # Category related images
├── products/       # Product images  
├── banners/        # Banner और promotional images
└── README.md       # यह file
```

## कैसे Use करें

1. **Images Add करना**: बस अपनी image files को appropriate folder में copy करें
2. **Code में Reference**: `/images/folder-name/image-name.jpg` format use करें

### Example:
```jsx
// Category image
<img src="/images/categories/machinery.jpg" alt="Machinery" />

// Product image
<img src="/images/products/product1.png" alt="Product" />

// Banner image
<img src="/images/banners/hero-banner.jpg" alt="Banner" />
```

## Supported Formats
- .jpg, .jpeg
- .png
- .gif
- .svg
- .webp

## Tips
- Image names में spaces avoid करें, underscore या dash use करें
- File size optimize करें web के लिए
- Descriptive names use करें