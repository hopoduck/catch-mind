export default class CanvasUtil {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;

  private static readonly SIZE = 700;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = CanvasUtil.SIZE;
    canvas.height = CanvasUtil.SIZE;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context is not available");
    this.context = context;
  }

  public get canvasRatio() {
    return CanvasUtil.SIZE / this.canvas.clientWidth;
  }

  public localToCanvas<T extends number[]>(...numbers: T): T {
    return numbers.map((x) => x * this.canvasRatio) as T;
  }

  public canvasToLocal<T extends number[]>(...numbers: T): T {
    return numbers.map((x) => x / this.canvasRatio) as T;
  }

  public start(x: number, y: number) {
    [x, y] = this.localToCanvas(x, y);
    this.context.beginPath();
    this.context.moveTo(x, y);
    return { x, y };
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
    [x, y] = this.localToCanvas(x, y);
    this.context.lineWidth = lineWidth;
    this.context.fillStyle = color;
    this.context.strokeStyle = color;
    this.context.lineTo(x, y);
    this.context.stroke();
    return { x, y, lineWidth, color };
  }

  public fill(color: string) {
    this.context.beginPath();
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, CanvasUtil.SIZE, CanvasUtil.SIZE);
    return { color };
  }

  public clear() {
    this.context.clearRect(0, 0, CanvasUtil.SIZE, CanvasUtil.SIZE);
    return { color: "#ffffff" };
  }
}
