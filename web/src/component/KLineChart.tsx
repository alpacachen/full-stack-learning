import { useEffect, useRef } from 'react';
import { ColorType, createChart } from 'lightweight-charts';
import type { KLineData } from '../utils/stockService';

interface KLineChartProps {
  data: KLineData[];
  height?: number;
  splitIndex?: number; // 分割点索引，用于标记历史数据和未来数据的分界
}

/**
 * K线图组件
 * 使用 lightweight-charts 实现蜡烛图
 * 红涨绿跌，展示上下影线
 */
export const KLineChart = ({ data, height = 400, splitIndex }: KLineChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // 创建图表
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: height,
      layout: {
        background: {
          type: ColorType.Solid,
          color: '#ffffff',
        },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: false, // 隐藏日期信息
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#cccccc',
      },
    });

    chartRef.current = chart;

    // 创建蜡烛图系列
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ef5350', // 红色表示上涨（中国习惯）
      downColor: '#26a69a', // 绿色表示下跌（中国习惯）
      borderVisible: false,
      wickUpColor: '#ef5350',
      wickDownColor: '#26a69a',
    });

    seriesRef.current = candlestickSeries;

    // 处理窗口大小变化
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [height]);

  // 更新数据
  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) return;

    // 转换数据格式为 lightweight-charts 需要的格式
    const chartData = data.map((item) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      time: item.time as any,
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
    }));

    seriesRef.current.setData(chartData);

    // 添加分割线标记（如果有splitIndex）
    if (splitIndex !== undefined && splitIndex > 0 && splitIndex < data.length) {
      const splitTime = data[splitIndex - 1].time;

      // 创建一个垂直线标记
      seriesRef.current.createPriceLine({
        price: data[splitIndex - 1].close,
        color: '#FF6B00',
        lineWidth: 2,
        lineStyle: 2, // 虚线
        axisLabelVisible: false,
        title: '未来走势',
      });

      // 添加时间标记
      const markers = [
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          time: splitTime as any,
          position: 'aboveBar' as const,
          color: '#FF6B00',
          shape: 'arrowDown' as const,
          text: '未来5天开始',
        },
      ];
      seriesRef.current.setMarkers(markers);
    }

    // 自动缩放以适应数据
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data, splitIndex]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full"
      style={{ position: 'relative' }}
    />
  );
};
