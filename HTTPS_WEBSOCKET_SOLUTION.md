# HTTPS + WebSocket Mixed Content Issue - Solutions

## 🔒 The Problem

Your website is deployed on Vercel with HTTPS (`https://eduplay-phi.vercel.app`), but the Raspberry Pi WebSocket uses insecure `ws://` protocol. Browsers block this "Mixed Content" for security.

**Error Message:**
```
Mixed Content: The page at 'https://...' was loaded over HTTPS, 
but attempted to connect to the insecure WebSocket endpoint 'ws://172.21.7.4:8765/'. 
This request has been blocked; this endpoint must be available over WSS.
```

---

## ✅ SOLUTION 1: Test Locally with HTTP (EASIEST)

### For Classroom/Lab Use (Recommended)

1. **Download your site files** from Vercel or use local copy
2. **Run a local HTTP server** (not HTTPS):

```bash
# Option A: Python
python -m http.server 8000

# Option B: Node.js
npx serve -p 8000

# Option C: PHP
php -S localhost:8000
```

3. **Access via HTTP**:
   - Open: `http://localhost:8000/tug.html`
   - Or: `http://YOUR_COMPUTER_IP:8000/tug.html`

4. **WebSocket will work** because both are insecure (HTTP + WS)

### Advantages:
- ✅ No SSL certificate needed
- ✅ Works immediately
- ✅ Perfect for local classroom setup
- ✅ All devices on same network can access

### Setup for Classroom:
1. Find your computer's local IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. Run HTTP server on that computer
3. Students access: `http://YOUR_IP:8000/game.html`
4. Raspberry Pi connects to same network

---

## ✅ SOLUTION 2: Use Secure WebSocket (WSS) - Production

### For Internet/Remote Access

You need to set up SSL/TLS on your Raspberry Pi:

### Step 1: Generate SSL Certificate

```bash
# On Raspberry Pi
sudo apt-get install openssl

# Generate self-signed certificate (for testing)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# For production, use Let's Encrypt:
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com
```

### Step 2: Update WebSocket Server to Use SSL

**Python Example:**
```python
import asyncio
import websockets
import ssl

async def handler(websocket, path):
    async for message in websocket:
        await websocket.send(message)

async def main():
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain('cert.pem', 'key.pem')
    
    async with websockets.serve(handler, "0.0.0.0", 8765, ssl=ssl_context):
        await asyncio.Future()

asyncio.run(main())
```

### Step 3: Update Website Code

Change in all HTML files:
```javascript
// From:
const wsUrl = `ws://${WS_HOST}:${WS_PORT}`;

// To:
const wsUrl = `wss://${WS_HOST}:${WS_PORT}`;
```

### Step 4: Port Forward (if accessing from internet)
- Router: Forward port 8765 to Raspberry Pi
- Use your public IP or domain name

### Advantages:
- ✅ Works with HTTPS sites
- ✅ Secure connection
- ✅ Can access from anywhere

### Disadvantages:
- ❌ Requires SSL certificate setup
- ❌ More complex configuration
- ❌ Self-signed certs show browser warnings

---

## ✅ SOLUTION 3: Hybrid Deployment

### Use Both HTTP and HTTPS Versions

**Current Setup (Automatic):**
- The code now detects HTTPS and shows a warning
- WebSocket only connects on HTTP pages
- No errors on HTTPS pages

**Deployment Strategy:**

1. **Vercel (HTTPS)**: For public access, demos, portfolio
   - URL: `https://eduplay-phi.vercel.app`
   - Keypad: Disabled (shows warning)
   - Use: Keyboard input only

2. **Local HTTP Server**: For classroom with Raspberry Pi
   - URL: `http://192.168.1.100:8000` (your local IP)
   - Keypad: Enabled and working
   - Use: Full hardware integration

### Advantages:
- ✅ Best of both worlds
- ✅ No SSL complexity
- ✅ Public demo available
- ✅ Full features in classroom

---

## 🎯 RECOMMENDED SETUP FOR YOUR USE CASE

### For Classroom/Lab Environment:

```
┌─────────────────────────────────────────────────────┐
│  Teacher's Computer (HTTP Server)                   │
│  IP: 192.168.1.100                                  │
│  Running: python -m http.server 8000                │
│  URL: http://192.168.1.100:8000                     │
└─────────────────────────────────────────────────────┘
                    │
                    │ Local Network (WiFi)
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌────────▼────────┐
│  Raspberry Pi  │    │  Student Tablets│
│  172.21.7.4    │    │  Access via:    │
│  WS Server     │    │  http://192...  │
│  Port 8765     │    │                 │
└────────────────┘    └─────────────────┘
```

### Setup Steps:

1. **On Teacher's Computer:**
   ```bash
   cd /path/to/eduplay
   python -m http.server 8000
   ```

2. **Find Computer IP:**
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

3. **On Raspberry Pi:**
   - Run WebSocket server on port 8765
   - Ensure IP is 172.21.7.4 (or update in code)

4. **Students Access:**
   - Open: `http://TEACHER_IP:8000/game.html`
   - Keypad works automatically

---

## 🔧 CURRENT CODE BEHAVIOR

The updated code now:

1. **Detects HTTPS**: Checks `window.location.protocol`
2. **Shows Warning**: If HTTPS, displays helpful message
3. **Prevents Connection**: Doesn't attempt WS connection on HTTPS
4. **Works on HTTP**: Full functionality on HTTP pages

**Console Output on HTTPS:**
```
⚠️ HTTPS detected - WebSocket connection to ws:// is blocked by browser
💡 Solutions:
   1. Test locally: http://localhost:8000/game.html
   2. Set up WSS (secure WebSocket) on Raspberry Pi
```

**Status Indicator:**
- HTTPS: Shows "HTTPS blocks WS - Use HTTP or WSS"
- HTTP: Shows normal connection status

---

## 📋 QUICK REFERENCE

| Scenario | Protocol | WebSocket | Works? | Best For |
|----------|----------|-----------|--------|----------|
| Vercel (Production) | HTTPS | ws:// | ❌ No | Public demos (keyboard only) |
| Vercel (Production) | HTTPS | wss:// | ✅ Yes | Production with SSL setup |
| Local Server | HTTP | ws:// | ✅ Yes | **Classroom (RECOMMENDED)** |
| Localhost | HTTP | ws:// | ✅ Yes | Development/Testing |

---

## 🚀 NEXT STEPS

### For Immediate Testing:
1. Run local HTTP server
2. Access via `http://localhost:8000`
3. Test keypad connection

### For Production (Optional):
1. Set up SSL on Raspberry Pi
2. Change `ws://` to `wss://` in code
3. Deploy updated code to Vercel

### For Classroom Use:
1. Use HTTP server on teacher's computer
2. Students connect via local network
3. No SSL needed - everything works!

---

## 💡 TIPS

- **Browser Console**: Always check for helpful error messages
- **Network Tab**: Monitor WebSocket connection attempts
- **Mixed Content**: Only affects HTTPS pages
- **Local Network**: HTTP is fine for classroom use
- **Security**: Only use HTTPS/WSS for internet-facing deployments

---

## ❓ FAQ

**Q: Can I force the browser to allow ws:// on HTTPS?**
A: Not recommended. Browser flags exist but are insecure and don't work on all devices.

**Q: Do I need to change Vercel settings?**
A: No. Vercel only hosts static files. WebSocket is separate.

**Q: Will keyboard input still work on HTTPS?**
A: Yes! Only the Raspberry Pi keypad is affected.

**Q: Can students use the HTTPS version?**
A: Yes, but without Raspberry Pi keypad. They can use keyboard input.

**Q: Is HTTP secure enough for classroom?**
A: Yes, for local network use. No sensitive data is transmitted.

---

**Status**: ✅ Code Updated | 🧪 Ready for HTTP Testing | 📚 Documentation Complete
