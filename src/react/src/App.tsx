import { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import init, { exec_mosaic_face } from "./pkg/wasm";
import styles from "./App.module.css";

const videoConstraints = {
  width: 640,
  height: 360,
  facingMode: "user",
};

export const App = () => {
  const [isWasmLoaded, setIsWasmLoaded] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [mosaicCoarseness, setMosaicCoarseness] = useState(30);

  const [deviceId, setDeviceId] = useState({});
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const handleDevices = useCallback(
    (mediaDevices: MediaDeviceInfo[]) => {
      const devices = mediaDevices.filter(({ kind }) => kind === "videoinput");
      setDeviceId(devices[0].deviceId);
      setDevices(devices);
    },
    [setDevices]
  );

  useEffect(() => {
    void navigator.mediaDevices.enumerateDevices().then(handleDevices);
  }, [handleDevices]);

  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    const newImage = new Image();
    if (typeof imageSrc !== "string") {
      return;
    }
    newImage.src = imageSrc;
    newImage.onload = function () {
      setImage(newImage);
    };
  }, [webcamRef]);

  useEffect(() => {
    void init().then(
      () => {
        setIsWasmLoaded(true);
        console.log("WASMの読み込みに成功しました。");
      },
      (err) => {
        console.error("WASMの読み込みに失敗しました。", err);
      }
    );

    const intervalId = setInterval(() => {
      capture();
    }, 500);

    return () => {
      clearTimeout(intervalId);
    };
  }, []);

  useEffect(() => {
    if (!image || !isWasmLoaded) return;
    const canvasRenderingContext = canvasRef.current?.getContext("2d");
    if (!canvasRenderingContext) {
      console.log("canvasが見つかりませんでした。");
      return;
    }
    canvasRenderingContext.drawImage(image, 0, 0, image.width, image.height);
    const imageData = canvasRenderingContext.getImageData(
      0,
      0,
      image.width,
      image.height
    );

    const mosaicResult = exec_mosaic_face(
      imageData.data,
      image.width,
      image.height,
      mosaicCoarseness
    );

    const imagedata = new ImageData(
      new Uint8ClampedArray(mosaicResult.buffer),
      image.width
    );
    canvasRef.current?.getContext("2d")?.putImageData(imagedata, 0, 0);
  }, [image, isWasmLoaded, mosaicCoarseness]);

  return (
    <>
      <header className={styles.header}>
        <h1>モザイク</h1>
      </header>
      <div className={styles.cameraSelect}>
        <span>カメラを選択：</span>
        <select onChange={(e) => setDeviceId(e.target.value)}>
          {devices.map((device) => {
            return (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            );
          })}
        </select>
      </div>
      <div className={styles.mosaicSettings}>
        <span>モザイクの粗さ：</span>
        <select
          value={mosaicCoarseness}
          onChange={(e) => {
            setMosaicCoarseness(Number(e.target.value));
          }}
        >
          <option value="10">Lv1（細かい）</option>
          <option value="20">Lv2（やや細かい）</option>
          <option value="30">Lv3（ふつー）</option>
          <option value="40">Lv4（やや粗い）</option>
          <option value="50">Lv5（粗い）</option>
        </select>
      </div>

      <div className={styles.webcamContainer}>
        <Webcam
          audio={false}
          width={720}
          height={360}
          ref={webcamRef}
          screenshotFormat="image/png"
          videoConstraints={{ ...videoConstraints, deviceId: deviceId }}
        />
        <canvas
          ref={canvasRef}
          width={image?.width}
          height={image?.height}
          className={styles.canvas}
        />
      </div>
    </>
  );
};


export default App;
