#!/usr/bin/env python3
"""
Math Racing – Smart Classroom Edition
WebSocket Bridge: ESP32 Serial <-> Browser

Usage:
    pip install websockets pyserial
    python bridge.py [--port COM3] [--baud 115200] [--ws-port 8765]

When no ESP32 is connected, the bridge still runs and you can test by
connecting any WebSocket client and sending raw messages.
"""

import asyncio
import json
import logging
import argparse
import sys
import time
from typing import Set, Optional

try:
    import websockets
    from websockets.server import WebSocketServerProtocol
except ImportError:
    print("ERROR: websockets library not found.  Run:  pip install websockets")
    sys.exit(1)

try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False
    print("WARNING: pyserial not found. Running in no-hardware mode. Run: pip install pyserial")

# ─────────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
log = logging.getLogger("MathRacingBridge")

# Global state
connected_clients: Set = set()
serial_port: Optional[object] = None

# ─────────────────────────────────────────────────────────────────────────────
async def broadcast(message: str) -> None:
    """Send a message to all connected browser clients."""
    if not connected_clients:
        return
    websockets_to_remove = set()
    for ws in connected_clients.copy():
        try:
            await ws.send(message)
            log.info(f"→ Browser: {message}")
        except Exception:
            websockets_to_remove.add(ws)
    connected_clients -= websockets_to_remove


async def send_to_esp32(command: str) -> None:
    """Write a command string to the serial port (ESP32)."""
    global serial_port
    if serial_port and serial_port.is_open:
        try:
            serial_port.write((command + "\n").encode("utf-8"))
            log.info(f"→ ESP32: {command}")
        except Exception as e:
            log.error(f"Serial write error: {e}")
    else:
        log.info(f"[NO-HW] → ESP32: {command}")


async def ws_handler(websocket: "WebSocketServerProtocol") -> None:
    """Handle a single browser WebSocket connection."""
    remote = websocket.remote_address
    log.info(f"Browser connected: {remote}")
    connected_clients.add(websocket)
    try:
        async for message in websocket:
            message = message.strip()
            log.info(f"← Browser: {message}")
            # Browser sends commands; relay to ESP32
            valid_commands = {"MOVE_A", "MOVE_B", "BUZZ_A", "BUZZ_B", "RESET"}
            if message in valid_commands:
                await send_to_esp32(message)
            else:
                log.warning(f"Unknown browser command: {message}")
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.discard(websocket)
        log.info(f"Browser disconnected: {remote}")


async def serial_reader(port: str, baud: int) -> None:
    """Continuously read lines from the ESP32 serial port and broadcast them."""
    global serial_port
    while True:
        try:
            log.info(f"Opening serial port {port} at {baud} baud …")
            serial_port = serial.Serial(port, baud, timeout=1)
            log.info("Serial port opened successfully.")
            while True:
                if serial_port.in_waiting:
                    raw = serial_port.readline().decode("utf-8", errors="ignore").strip()
                    if raw:
                        log.info(f"← ESP32: {raw}")
                        # Expected format: "A:24" or "B:15"
                        await broadcast(raw)
                await asyncio.sleep(0.01)
        except Exception as e:
            log.error(f"Serial error: {e}. Retrying in 3 s …")
            serial_port = None
            await asyncio.sleep(3)


async def main(args) -> None:
    log.info("=" * 60)
    log.info("  Math Racing – Smart Classroom Edition  |  WebSocket Bridge")
    log.info("=" * 60)
    log.info(f"WebSocket server starting on ws://localhost:{args.ws_port}")

    # Start WebSocket server
    server = await websockets.serve(ws_handler, "0.0.0.0", args.ws_port)

    tasks = [asyncio.ensure_future(server.wait_closed())]

    if SERIAL_AVAILABLE and args.port:
        log.info(f"ESP32 serial: {args.port} @ {args.baud} baud")
        tasks.append(asyncio.ensure_future(serial_reader(args.port, args.baud)))
    else:
        if not SERIAL_AVAILABLE:
            log.warning("pyserial unavailable – running in software-only mode.")
        elif not args.port:
            log.warning("No --port given – running without hardware. Use --port COMx to connect ESP32.")
        log.info("You can still test by connecting with a WebSocket client and sending 'A:24' format messages.")

    log.info("Bridge is ready. Waiting for connections …\n")
    await asyncio.gather(*tasks)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Math Racing WebSocket Bridge")
    parser.add_argument("--port", type=str, default=None, help="Serial port for ESP32 (e.g. COM3 or /dev/ttyUSB0)")
    parser.add_argument("--baud", type=int, default=115200, help="Serial baud rate (default: 115200)")
    parser.add_argument("--ws-port", type=int, default=8765, help="WebSocket server port (default: 8765)")
    args = parser.parse_args()

    try:
        asyncio.run(main(args))
    except KeyboardInterrupt:
        log.info("Bridge stopped by user.")
