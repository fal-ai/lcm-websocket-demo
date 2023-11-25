import * as fal from '@fal-ai/serverless-client';
import { useEffect, useRef, useState } from 'react';

const APP_ID = '110602490-lcm-plexed-sd15-i2i';
const PROMPT = 'A moon in a starry night sky';
const CIRCLE_RADIUS = 80; // Radius of the circle

function App() {
  const canvasRef = useRef(null);
  const [receivedImage, setReceivedImage] = useState(null);

  const { send: sendCurrentData } = fal.realtime.connect(APP_ID, {
    connectionKey: 'fal-realtime-example',
    onResult: (result) => {
      if (result.images && result.images[0]) {
        setReceivedImage(result.images[0].url);
      }
    },
  });

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
      sendCurrentData({
        prompt: PROMPT,
        seed: 11252023,
        image_url: imageData,
        sync_mode: true,
        strength: 0.5,
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="App">
      <canvas
        ref={canvasRef}
        style={{ border: '1px solid black' }}
        width={512}
        height={512}
      />
      <div style={{ border: '1px solid black', width: 512, height: 512 }}>
        {receivedImage && (
          <img src={receivedImage} alt="Received from server" />
        )}
      </div>
    </div>
  );
}

export default App;
