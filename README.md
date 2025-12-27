# Amelia AI - Intelligent Assistant Interface

A responsive AI chat interface inspired by Google's Gemini, branded as "Amelia AI" with modern design integration.

## Features

- 🎨 **Modern Design**: Clean, professional interface with gradient branding
- 📱 **Fully Responsive**: Optimized for mobile, tablet, and desktop devices
- 🌓 **Dark/Light Theme**: Toggle between themes with system preference detection
- 🤖 **AI Chat Interface**: Interactive chat bubbles with typing animations
- ⚡ **Puter.js Integration**: Ready for advanced AI capabilities
- 💾 **Chat Persistence**: Local storage for conversation history
- ⌨️ **Keyboard Shortcuts**: Ctrl/Cmd + Enter to send, Ctrl/Cmd + / to focus input
- 🎯 **Suggestion Chips**: Quick-start conversation starters
- ♿ **Accessibility**: WCAG compliant with focus management and screen reader support

## File Structure

```
amelia-ai/
├── index.html          # Main HTML file with Puter.js
├── styles/
│   └── main.css        # Responsive styling and themes
├── scripts/
│   └── chat.js         # Chat functionality and interactions
└── assets/             # Directory for future assets (logos, etc.)
```

## Quick Start

1. Open `index.html` in a web browser
2. Start chatting by typing a message or clicking suggestion chips
3. Toggle themes using the theme switcher in the header
4. Enjoy the responsive design across all devices

## Puter.js Integration

The website includes the Puter.js library:
```html
<script src="https://js.puter.com/v2/"></script>
```

Current implementation includes:
- Fallback responses when Puter.js AI is unavailable
- Ready for advanced AI chat integration
- Error handling and graceful degradation

## Responsive Breakpoints

- **Desktop**: 1200px+ (full layout)
- **Tablet**: 768px - 1199px (optimized spacing)
- **Mobile**: 320px - 767px (compact layout)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Customization

### Colors
Modify CSS custom properties in `styles/main.css`:
```css
:root {
    --accent-primary: #667eea;
    --accent-secondary: #764ba2;
    /* ... other variables */
}
```

### Chat Responses
Update the fallback responses in `scripts/chat.js`:
```javascript
getFallbackResponse(message) {
    // Customize responses here
}
```

## Performance Features

- Lazy loading animations
- Debounced resize handlers
- Efficient DOM updates
- Local storage optimization
- Minimal bundle size

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- High contrast mode support
- Reduced motion preferences

## Future Enhancements

- Voice input/output
- File sharing capabilities
- Multi-language support
- Real-time collaboration
- Advanced AI model integration
- Offline functionality

---

Built with modern web technologies for optimal performance and user experience.
