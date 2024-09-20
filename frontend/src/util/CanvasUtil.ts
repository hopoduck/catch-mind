export default class CanvasUtil {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context is not available");
    this.context = context;
  }

  public start(x: number, y: number) {
    this.context.beginPath();
    this.context.moveTo(x, y);
  }

  public stroke({
    x,
    y,
    lineWidth,
    color,
  }: {
    x: number;
    y: number;
    lineWidth: number;
    color: string;
  }) {
    this.context.lineWidth = lineWidth;
    this.context.fillStyle = color;
    this.context.strokeStyle = color;
    this.context.lineTo(x, y);
    this.context.stroke();
  }

  public fill(color: string) {
    this.context.beginPath();
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
