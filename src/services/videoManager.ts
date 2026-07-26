export class VideoManager {
  private _stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private intervalId: number | null = null;

  public onStreamChange: ((stream: MediaStream | null) => void) | null = null;

  get stream(): MediaStream | null {
    return this._stream;
  }

  async startCamera(onFrameCaptured: (base64JPEG: string) => void) {
    if (this._stream) return; // Already started

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { max: 640 }, 
            height: { max: 480 },
            facingMode: 'user'
        } 
      });

      if (this.onStreamChange) {
        this.onStreamChange(this._stream);
      }

      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = this._stream;
      this.videoElement.autoplay = true;
      this.videoElement.muted = true;
      
      await new Promise((resolve) => {
          this.videoElement!.onloadedmetadata = () => {
              this.videoElement!.play();
              resolve(true);
          }
      });

      this.canvasElement = document.createElement('canvas');
      let w = this.videoElement.videoWidth || 640;
      let h = this.videoElement.videoHeight || 480;
      
      // Scale down if resolution is too large (prevents bandwidth saturation causing audio crackling)
      const MAX_WIDTH = 640;
      if (w > MAX_WIDTH) {
          h = Math.floor(h * (MAX_WIDTH / w));
          w = MAX_WIDTH;
      }
      
      this.canvasElement.width = w;
      this.canvasElement.height = h;
      this.ctx = this.canvasElement.getContext('2d');

      // Send a frame every 1 second (1 fps is usually enough to give AI context without overwhelming socket)
      this.intervalId = window.setInterval(() => {
          this.captureFrame(onFrameCaptured);
      }, 1000);

    } catch (e) {
      console.error("Camera access Error:", e);
      throw e;
    }
  }

  private captureFrame(onFrameCaptured: (base64JPEG: string) => void) {
      if (!this.videoElement || !this.ctx || !this.canvasElement) return;
      
      this.ctx.drawImage(this.videoElement, 0, 0, this.canvasElement.width, this.canvasElement.height);
      const dataUrl = this.canvasElement.toDataURL('image/jpeg', 0.5); // 50% quality jpeg
      
      // Strip out the data url prefix "data:image/jpeg;base64,"
      const base64Data = dataUrl.split(',')[1];
      if (base64Data) {
          onFrameCaptured(base64Data);
      }
  }

  stopCamera() {
      if (this.intervalId) {
          clearInterval(this.intervalId);
          this.intervalId = null;
      }
      if (this._stream) {
          this._stream.getTracks().forEach(track => track.stop());
          this._stream = null;
      }
      this.videoElement = null;
      this.canvasElement = null;
      this.ctx = null;
      
      if (this.onStreamChange) {
         this.onStreamChange(null);
      }
  }
}

export const videoManager = new VideoManager();
