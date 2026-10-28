# PureEraser

A free, open-source web application for removing backgrounds from images directly in your browser. PureEraser provides a simple yet powerful interface for color-based background removal, image cropping, and transparent PNG export.

## Overview

PureEraser is a client-side application that processes images entirely in your browser. No server uploads, no data collection, and no privacy concerns. The tool uses color-based background removal algorithms to detect and eliminate backgrounds, making it ideal for product photography, profile pictures, and graphic design work.

## Features

### Background Removal

- Automatic background color detection on image upload
- Manual color picker for precise color selection
- Adjustable tolerance slider for fine-tuning removal accuracy
- Real-time preview of processed images
- Support for JPG, PNG, and WEBP formats

### Image Cropping

- Interactive crop tool with drag-and-drop functionality
- Free aspect ratio cropping
- High-quality image rendering with device pixel ratio support
- Smooth transitions between editing stages

### Export Options

- Export as transparent PNG
- High-resolution output preserving original image quality
- One-click download functionality

### User Experience

- Responsive design for desktop and mobile devices
- Dark mode interface optimized for extended use
- Step-by-step workflow with clear visual feedback
- Tutorial modal for first-time users
- Processing indicators and status messages

## Technology Stack

PureEraser is built with modern web technologies:

- **React 19** - Component-based UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first styling framework
- **Ant Design** - UI component library with dark theme
- **react-image-crop** - Interactive cropping functionality
- **Lucide React** - Icon library
- **Framer Motion** - Animation library

## Getting Started

### Prerequisites

Ensure you have the following installed on your system:

- Node.js (version 16 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/bmessaoudi/pure-eraser.git
cd pure-eraser
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building for Production

To create a production-ready build:

```bash
npm run build
```

The optimized files will be generated in the `dist` directory, ready for deployment to any static hosting service.

### Preview Production Build

To preview the production build locally:

```bash
npm run preview
```

## Usage Guide

### Step 1: Upload Image

Drag and drop an image onto the upload area, or click to browse your files. Supported formats include JPG, PNG, and WEBP.

### Step 2: Remove Background

The application automatically samples the background color from the top-left corner of your image. You can:

- Use the color picker tool to manually select a different background color
- Adjust the tolerance slider to control how strictly the algorithm matches colors
- Preview the result in real-time as you make adjustments

### Step 3: Crop (Optional)

After background removal, you can refine the image boundaries:

- Drag the crop handles to select your desired area
- Click "Apply Crop" to finalize the selection
- Skip this step if you want to keep the entire image

### Step 4: Export

Download your processed image as a transparent PNG file. The exported image maintains the original resolution and quality.

## Project Structure

```
pure-eraser/
├── public/              # Static assets and metadata
│   ├── favicon files
│   ├── robots.txt
│   ├── sitemap.xml
│   └── site.webmanifest
├── src/
│   ├── App.tsx          # Main application component
│   ├── App.css          # Component-specific styles
│   ├── index.css        # Global styles and Tailwind imports
│   ├── main.tsx         # Application entry point
│   └── assets/          # Additional assets
├── index.html           # HTML template with SEO metadata
├── package.json         # Project dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.ts       # Vite build configuration
└── README.md            # Project documentation
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot module replacement
- `npm run build` - Build for production with TypeScript compilation
- `npm run lint` - Run ESLint to check code quality
- `npm run preview` - Preview production build locally

### Code Quality

The project uses ESLint with TypeScript support to maintain code quality. Configuration includes:

- React Hooks linting rules
- React Refresh plugin for fast refresh
- TypeScript ESLint parser and rules

## Browser Compatibility

PureEraser works on all modern browsers that support:

- HTML5 Canvas API
- ES6+ JavaScript features
- CSS Grid and Flexbox
- File API and FileReader

Tested and confirmed working on:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

The application processes images entirely in the browser using the Canvas API. Performance depends on:

- Image resolution (larger images take longer to process)
- Device processing power
- Browser performance characteristics

For optimal performance, consider resizing very large images before processing.

## Privacy and Security

PureEraser processes all images locally in your browser. No data is transmitted to external servers. The application:

- Does not collect user data
- Does not store images on any server
- Does not use analytics or tracking
- Operates entirely offline after initial page load

## Contributing

Contributions are welcome and appreciated. To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature-name`)
5. Open a Pull Request

Please ensure your code follows the existing style and passes all linting checks.

## License

This project is open source and available under the MIT License. See the LICENSE file for more details.

## Acknowledgments

Built with modern web technologies and inspired by the need for a simple, privacy-focused background removal tool that works entirely in the browser.

## Author

Created by Bilel Messaoudi

- Instagram: [@bilel.it](https://www.instagram.com/bilel.it)
- GitHub: [@bmessaoudi](https://github.com/bmessaoudi)

## Support

If you find this project useful, consider:

- Starring the repository on GitHub
- Sharing it with others who might benefit
- Contributing improvements or bug fixes
- Reporting issues or suggesting features

## Roadmap

Future enhancements under consideration:

- Batch processing for multiple images
- Additional export formats (JPEG, SVG)
- Advanced edge refinement algorithms
- Preset tolerance settings for common use cases
- Undo/redo functionality
- Keyboard shortcuts for power users

## Changelog

### Version 1.1.0

- Responsive design improvements for mobile devices
- Enhanced SEO metadata and social sharing tags
- Tutorial modal for new users
- Open source information modal
- Performance optimizations for large images
- UI/UX refinements and animations

### Version 1.0.0

- Initial release
- Basic background removal functionality
- Color picker and tolerance adjustment
- Image cropping capability
- PNG export functionality
