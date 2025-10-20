import { useState } from 'react';
import { Button, Card, Spin, message, Modal } from 'antd';
import { KLineChart } from '../component/KLineChart';
import { generateTrainingData, getRandomStock } from '../utils/stockService';
import type { StockTrainingData, KLineData } from '../utils/stockService';

const INITIAL_AMOUNT = 10000; // 初始金额1万元

export const StocksTest = () => {
  const [loading, setLoading] = useState(false);
  const [trainingData, setTrainingData] = useState<StockTrainingData | null>(null);
  const [displayData, setDisplayData] = useState<KLineData[]>([]);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [totalAmount, setTotalAmount] = useState(INITIAL_AMOUNT); // 当前总金额

  // 开始新的训练
  const startNewTraining = async () => {
    setLoading(true);
    setHasRevealed(false);
    setTrainingData(null);
    setDisplayData([]);

    try {
      // 随机选择一只股票
      const stockCode = getRandomStock();
      const data = await generateTrainingData(stockCode);
      setTrainingData(data);
      setDisplayData(data.displayData);
      message.success('股票数据加载成功！');
    } catch (error) {
      console.error('Failed to load stock data:', error);
      message.error('加载股票数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 买入操作
  const handleBuy = () => {
    if (!trainingData || hasRevealed) return;

    // 显示完整数据（30天+5天）
    setDisplayData(trainingData.allData);
    setHasRevealed(true);

    // 计算涨跌幅
    // 买入价格：第30天收盘价，卖出价格：第35天收盘价
    const buyPrice = trainingData.displayData[trainingData.displayData.length - 1].close;
    const sellPrice = trainingData.futureData[trainingData.futureData.length - 1].close;
    const changePercent = ((sellPrice - buyPrice) / buyPrice) * 100;

    // 获取日期信息
    const buyDate = trainingData.displayData[trainingData.displayData.length - 1].time;
    const sellDate = trainingData.futureData[trainingData.futureData.length - 1].time;

    // 计算盈亏金额
    const profitAmount = totalAmount * (changePercent / 100);
    const newAmount = totalAmount + profitAmount;

    // 更新总金额
    setTotalAmount(newAmount);

    // 显示弹窗反馈
    const isProfit = changePercent > 0;
    Modal[isProfit ? 'success' : 'error']({
      title: isProfit ? '买入决策正确！' : '买入决策失误',
      content: (
        <div className="space-y-2">
          <p><strong>股票名称：</strong>{trainingData.stockName}</p>
          <p><strong>股票代码：</strong>{trainingData.stockCode}</p>
          <p><strong>买入日期：</strong>{buyDate}</p>
          <p><strong>买入价格：</strong>¥{buyPrice.toFixed(2)}</p>
          <p><strong>卖出日期：</strong>{sellDate}</p>
          <p><strong>卖出价格：</strong>¥{sellPrice.toFixed(2)}</p>
          <p><strong>收益率：</strong>
            <span style={{ color: isProfit ? '#ef5350' : '#26a69a', fontWeight: 'bold' }}>
              {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </p>
          <hr className="my-2" />
          <p><strong>本金：</strong>¥{totalAmount.toFixed(2)}</p>
          <p><strong>盈亏：</strong>
            <span style={{ color: isProfit ? '#ef5350' : '#26a69a', fontWeight: 'bold' }}>
              {profitAmount > 0 ? '+' : ''}¥{profitAmount.toFixed(2)}
            </span>
          </p>
          <p><strong>新余额：</strong>
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
              ¥{newAmount.toFixed(2)}
            </span>
          </p>
        </div>
      ),
      okText: '知道了',
    });
  };

  // 卖出/不买操作
  const handleSell = () => {
    if (!trainingData || hasRevealed) return;

    // 显示完整数据（30天+5天）
    setDisplayData(trainingData.allData);
    setHasRevealed(true);

    // 计算涨跌幅
    // 买入价格：第30天收盘价，卖出价格：第35天收盘价
    const buyPrice = trainingData.displayData[trainingData.displayData.length - 1].close;
    const sellPrice = trainingData.futureData[trainingData.futureData.length - 1].close;
    const changePercent = ((sellPrice - buyPrice) / buyPrice) * 100;

    // 获取日期信息
    const startDate = trainingData.displayData[trainingData.displayData.length - 1].time;
    const endDate = trainingData.futureData[trainingData.futureData.length - 1].time;

    // 显示弹窗反馈
    const isCorrect = changePercent <= 0;
    Modal[isCorrect ? 'success' : 'warning']({
      title: isCorrect ? '不买决策正确！' : '错过了盈利机会',
      content: (
        <div className="space-y-2">
          <p><strong>股票名称：</strong>{trainingData.stockName}</p>
          <p><strong>股票代码：</strong>{trainingData.stockCode}</p>
          <p><strong>观察起始日期：</strong>{startDate}</p>
          <p><strong>观察结束日期：</strong>{endDate}</p>
          <p><strong>期间价格：</strong>¥{buyPrice.toFixed(2)} → ¥{sellPrice.toFixed(2)}</p>
          <p><strong>涨跌幅：</strong>
            <span style={{ color: changePercent > 0 ? '#ef5350' : '#26a69a', fontWeight: 'bold' }}>
              {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </p>
          {isCorrect ? (
            <p className="text-gray-600 mt-2">不买入是明智的选择，避免了损失！</p>
          ) : (
            <p className="text-gray-600 mt-2">如果买入可以获得 {changePercent.toFixed(2)}% 的收益。</p>
          )}
        </div>
      ),
      okText: '知道了',
    });
  };

  // 重置金额
  const handleReset = () => {
    Modal.confirm({
      title: '确认重置',
      content: '确定要重置金额到初始的 ¥10,000.00 吗？',
      onOk: () => {
        setTotalAmount(INITIAL_AMOUNT);
        setTrainingData(null);
        setDisplayData([]);
        setHasRevealed(false);
        message.success('已重置金额');
      },
    });
  };

  // 计算收益率
  const profitRate = ((totalAmount - INITIAL_AMOUNT) / INITIAL_AMOUNT) * 100;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Card
        title={
          <div className="flex items-center justify-between">
            <span>短线训练营</span>
            <div className="flex items-center gap-4">
              <div className="text-base font-normal">
                <span className="text-gray-500">当前资金：</span>
                <span className="font-bold text-lg" style={{
                  color: totalAmount >= INITIAL_AMOUNT ? '#ef5350' : '#26a69a'
                }}>
                  ¥{totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-sm ml-2" style={{
                  color: profitRate >= 0 ? '#ef5350' : '#26a69a'
                }}>
                  ({profitRate >= 0 ? '+' : ''}{profitRate.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        }
        extra={
          <div className="flex gap-2">
            <Button onClick={handleReset} size="small">
              重置金额
            </Button>
            <Button type="primary" onClick={startNewTraining} loading={loading}>
              {trainingData ? '换一只股票' : '开始训练'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 说明文案 */}
          {!trainingData && !loading && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg mb-2">点击"开始训练"按钮，开始你的短线交易训练</p>
              <p className="text-sm">系统将随机展示一只股票30天的K线走势</p>
              <p className="text-sm">根据走势判断，做出买入或不买入的决策</p>
            </div>
          )}

          {/* 加载状态 */}
          {loading && (
            <div className="text-center py-12">
              <Spin size="large" tip="正在加载股票数据..." />
            </div>
          )}

          {/* K线图 */}
          {trainingData && displayData.length > 0 && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-white">
                <div className="mb-4">
                  <p className="text-sm text-gray-500">
                    {hasRevealed
                      ? '完整走势（30天历史 + 5天未来）'
                      : '历史走势（30天）- 请根据走势做出判断'}
                  </p>
                </div>
                <KLineChart
                  data={displayData}
                  height={500}
                  splitIndex={hasRevealed ? trainingData.displayData.length : undefined}
                />
              </div>

              {/* 操作按钮 */}
              {!hasRevealed && (
                <div className="space-y-3">
                  <div className="flex justify-center gap-4">
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleBuy}
                      className="w-32"
                      style={{ backgroundColor: '#ef5350', borderColor: '#ef5350' }}
                    >
                      买入
                    </Button>
                    <Button
                      size="large"
                      onClick={handleSell}
                      className="w-32"
                      style={{ backgroundColor: '#26a69a', borderColor: '#26a69a', color: 'white' }}
                    >
                      不买
                    </Button>
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    买卖时机：假设在第30天收盘价买入，持有5个交易日后在第35天收盘价卖出
                  </p>
                </div>
              )}

              {/* 揭晓后的操作 */}
              {hasRevealed && (
                <div className="text-center pt-4">
                  <Button type="primary" size="large" onClick={startNewTraining}>
                    再来一局
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
