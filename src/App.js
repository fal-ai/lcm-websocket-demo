import React, { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { debounce } from 'lodash';

const DEBOUNCE_TIME = 500; // Adjust as needed
const URL = "wss://110602490-lcm-sd15-i2i.gateway.alpha.fal.ai/ws";
const CIRCLE_RADIUS = 80; // Radius of the circle

function App() {
  const canvasRef = useRef(null);
  const webSocketRef = useRef(null);
  const isReconnecting = useRef(false);
  const [receivedImage, setReceivedImage] = useState(null);

  const connect = useCallback(() => {
    webSocketRef.current = new WebSocket(URL);
    webSocketRef.current.onopen = () => {
      console.log('WebSocket Open');
    };

    webSocketRef.current.onclose = () => {
      console.log('WebSocket Close');
    };

    webSocketRef.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    webSocketRef.current.onmessage = (message) => {
      try {
        const data = JSON.parse(message.data);
        console.log("WebSocket Message:", data);
        if (data.images && data.images.length > 0) {
          setReceivedImage(data.images[0].url);
        }
      } catch (e) {
        console.error("Error parsing the WebSocket response:", e);
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    webSocketRef.current?.close();
  }, []);

  const sendMessage = useCallback(async (message) => {
    if (!isReconnecting.current && webSocketRef.current?.readyState !== WebSocket.OPEN) {
      isReconnecting.current = true;
      connect();
    }

    if (isReconnecting.current && webSocketRef.current?.readyState !== WebSocket.OPEN) {
      await new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (webSocketRef.current?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
      });
      isReconnecting.current = false;
    }
    webSocketRef.current?.send(message);
  }, [connect]);

  const sendCurrentData = useMemo(() => {
    return debounce(sendMessage, DEBOUNCE_TIME);
  }, [sendMessage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    context.fillStyle = 'white'; // Set the background to white
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fill();

    const drawCircle = (x, y) => {
      context.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
      context.beginPath();
      context.arc(x, y, CIRCLE_RADIUS, 0, 2 * Math.PI, false);
      context.fillStyle = 'yellow';
      context.fill();
    };

    const handleMouseMove = (event) => {
      const x = event.clientX - canvas.offsetLeft;
      const y = event.clientY - canvas.offsetTop;
      drawCircle(x, y);
      
      const imageData = canvas.toDataURL('image/png');
      const req = {
        prompt: 'A moon in a starry night sky',
        seed: Math.floor(Math.random() * 100),
        image_url: imageData,
        sync_mode: true,
        strength: 0.5,
      };
      sendCurrentData(JSON.stringify(req));
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [connect, disconnect, sendCurrentData]);

  return (
    <div className="App">
      <canvas ref={canvasRef} style={{border: "1px solid black"}} width={700} height={500} />
      {receivedImage && <img style={{border: "1px solid black"}} src={receivedImage} alt="Received from server" />}
    </div>
  );
}

export default App;
