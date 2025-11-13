import React from 'react';
import './WarmTipsSection.css';

interface WarmTipsSectionProps {
  onTermsClick: () => void;
}

/**
 * 温馨提示区域组件
 */
const WarmTipsSection: React.FC<WarmTipsSectionProps> = ({ onTermsClick }) => {
  const tips = [
    '一张有效身份证件同一乘车日期同一车次只能购买一张车票，高铁动卧列车除外。',
    '购买铁路乘意险的注册用户年龄须在18周岁以上，使用非中国居民身份证注册的用户如购买铁路乘意险，须在我的12306——个人信息 如实填写"出生日期"。',
    '父母为未成年子女投保，须在我的乘车人 登记未成年子女的有效身份证件信息。',
    '未尽事宜详见《铁路旅客运输规程》等有关规定和车站公告。'
  ];
  
  return (
    <div className="warm-tips-section">
      <h3 className="tips-title">温馨提示</h3>
      <ol className="tips-list">
        {tips.map((tip, index) => (
          <li key={index} className="tip-item">{tip}</li>
        ))}
      </ol>
    </div>
  );
};

export default WarmTipsSection;

