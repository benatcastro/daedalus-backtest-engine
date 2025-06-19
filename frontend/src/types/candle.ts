interface Candle {
  data: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
}

export default Candle;
