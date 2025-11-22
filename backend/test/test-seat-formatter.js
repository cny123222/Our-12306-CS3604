/**
 * 座位号格式化测试
 */

const {
  formatSeatNumber,
  formatFullSeatNumber,
  parseSeatNumber,
  parseFullSeatNumber,
  formatSeatInfoForDisplay
} = require('../src/utils/seatNumberFormatter');

console.log('='.repeat(80));
console.log('座位号格式化测试');
console.log('='.repeat(80));

// 测试用例
const testCases = [
  // 二等座测试
  {
    type: '二等座',
    tests: [
      { input: '01', expected: '01A', description: '第1个座位 (第1排A座)' },
      { input: '05', expected: '01F', description: '第5个座位 (第1排F座)' },
      { input: '06', expected: '02A', description: '第6个座位 (第2排A座)' },
      { input: '80', expected: '16F', description: '第80个座位 (第16排F座)' },
      { input: '1-01', fullExpected: '01车01A号', description: '完整格式：1车01号' },
      { input: '1-80', fullExpected: '01车16F号', description: '完整格式：1车80号' }
    ]
  },
  // 一等座测试
  {
    type: '一等座',
    tests: [
      { input: '01', expected: '01A', description: '第1个座位 (第1排A座)' },
      { input: '04', expected: '01F', description: '第4个座位 (第1排F座)' },
      { input: '05', expected: '02A', description: '第5个座位 (第2排A座)' },
      { input: '40', expected: '10F', description: '第40个座位 (第10排F座)' },
      { input: '1-01', fullExpected: '01车01A号', description: '完整格式：1车01号' },
      { input: '1-40', fullExpected: '01车10F号', description: '完整格式：1车40号' }
    ]
  },
  // 商务座测试
  {
    type: '商务座',
    tests: [
      { input: '01', expected: '01A', description: '第1个座位 (第1排A座)' },
      { input: '02', expected: '01F', description: '第2个座位 (第1排F座)' },
      { input: '03', expected: '02A', description: '第3个座位 (第2排A座)' },
      { input: '10', expected: '05F', description: '第10个座位 (第5排F座)' },
      { input: '1-01', fullExpected: '01车01A号', description: '完整格式：1车01号' },
      { input: '1-10', fullExpected: '01车05F号', description: '完整格式：1车10号' }
    ]
  },
  // 软卧测试
  {
    type: '软卧',
    tests: [
      { input: '01', expected: '01号上铺', description: '第1个座位 (上铺)' },
      { input: '02', expected: '02号下铺', description: '第2个座位 (下铺)' },
      { input: '11', expected: '11号上铺', description: '第11个座位 (上铺)' },
      { input: '30', expected: '30号下铺', description: '第30个座位 (下铺)' },
      { input: '1-01', fullExpected: '01车01号上铺号', description: '完整格式：1车01号' },
      { input: '1-30', fullExpected: '01车30号下铺号', description: '完整格式：1车30号' }
    ]
  },
  // 硬卧测试
  {
    type: '硬卧',
    tests: [
      { input: '01', expected: '01号上铺', description: '第1个座位 (隔间1上铺)' },
      { input: '02', expected: '01号中铺', description: '第2个座位 (隔间1中铺)' },
      { input: '03', expected: '01号下铺', description: '第3个座位 (隔间1下铺)' },
      { input: '04', expected: '02号上铺', description: '第4个座位 (隔间1上铺)' },
      { input: '07', expected: '03号上铺', description: '第7个座位 (隔间2上铺)' },
      { input: '12', expected: '04号下铺', description: '第12个座位 (隔间2下铺)' },
      { input: '30', expected: '10号下铺', description: '第30个座位 (隔间5下铺)' },
      { input: '1-01', fullExpected: '01车01号上铺号', description: '完整格式：1车01号' },
      { input: '1-30', fullExpected: '01车10号下铺号', description: '完整格式：1车30号' }
    ]
  }
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// 运行测试
testCases.forEach(testCase => {
  console.log('\n' + '='.repeat(80));
  console.log(`测试席别：${testCase.type}`);
  console.log('='.repeat(80));
  
  testCase.tests.forEach(test => {
    totalTests++;
    
    if (test.fullExpected) {
      // 测试完整格式化
      const result = formatFullSeatNumber(test.input, testCase.type);
      const passed = result === test.fullExpected;
      
      if (passed) {
        passedTests++;
        console.log(`✅ PASS: ${test.description}`);
        console.log(`   输入: ${test.input} → 输出: ${result}`);
      } else {
        failedTests++;
        console.log(`❌ FAIL: ${test.description}`);
        console.log(`   输入: ${test.input}`);
        console.log(`   期望: ${test.fullExpected}`);
        console.log(`   实际: ${result}`);
      }
    } else {
      // 测试座位号格式化
      const result = formatSeatNumber(test.input, testCase.type);
      const passed = result === test.expected;
      
      if (passed) {
        passedTests++;
        console.log(`✅ PASS: ${test.description}`);
        console.log(`   输入: ${test.input} → 输出: ${result}`);
      } else {
        failedTests++;
        console.log(`❌ FAIL: ${test.description}`);
        console.log(`   输入: ${test.input}`);
        console.log(`   期望: ${test.expected}`);
        console.log(`   实际: ${result}`);
      }
    }
  });
});

// 测试反向解析
console.log('\n' + '='.repeat(80));
console.log('测试反向解析（格式化 → 原始）');
console.log('='.repeat(80));

const reverseTests = [
  { formatted: '01A', seatType: '二等座', expected: '01' },
  { formatted: '16F', seatType: '二等座', expected: '80' },
  { formatted: '01A', seatType: '一等座', expected: '01' },
  { formatted: '10F', seatType: '一等座', expected: '40' },
  { formatted: '01A', seatType: '商务座', expected: '01' },
  { formatted: '05F', seatType: '商务座', expected: '10' },
  { formatted: '01号上铺', seatType: '软卧', expected: '01' },
  { formatted: '30号下铺', seatType: '软卧', expected: '30' },
  { formatted: '01号上铺', seatType: '硬卧', expected: '01' },
  { formatted: '01号中铺', seatType: '硬卧', expected: '02' },
  { formatted: '01号下铺', seatType: '硬卧', expected: '03' },
  { formatted: '10号下铺', seatType: '硬卧', expected: '30' }
];

reverseTests.forEach(test => {
  totalTests++;
  const result = parseSeatNumber(test.formatted, test.seatType);
  const passed = result === test.expected;
  
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${test.seatType} ${test.formatted} → ${result}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${test.seatType} ${test.formatted}`);
    console.log(`   期望: ${test.expected}`);
    console.log(`   实际: ${result}`);
  }
});

// 测试双向转换一致性
console.log('\n' + '='.repeat(80));
console.log('测试双向转换一致性');
console.log('='.repeat(80));

const consistencyTests = [
  { original: '01', seatType: '二等座' },
  { original: '80', seatType: '二等座' },
  { original: '01', seatType: '一等座' },
  { original: '40', seatType: '一等座' },
  { original: '01', seatType: '商务座' },
  { original: '10', seatType: '商务座' },
  { original: '01', seatType: '软卧' },
  { original: '30', seatType: '软卧' },
  { original: '01', seatType: '硬卧' },
  { original: '02', seatType: '硬卧' },
  { original: '03', seatType: '硬卧' },
  { original: '30', seatType: '硬卧' },
  { original: '60', seatType: '硬卧' }
];

consistencyTests.forEach(test => {
  totalTests++;
  const formatted = formatSeatNumber(test.original, test.seatType);
  const parsed = parseSeatNumber(formatted, test.seatType);
  const passed = parsed === test.original;
  
  if (passed) {
    passedTests++;
    console.log(`✅ PASS: ${test.seatType} ${test.original} → ${formatted} → ${parsed}`);
  } else {
    failedTests++;
    console.log(`❌ FAIL: ${test.seatType} ${test.original} → ${formatted} → ${parsed}`);
    console.log(`   原始: ${test.original}`);
    console.log(`   格式化: ${formatted}`);
    console.log(`   解析回: ${parsed}`);
  }
});

// 打印测试结果摘要
console.log('\n' + '='.repeat(80));
console.log('测试结果摘要');
console.log('='.repeat(80));
console.log(`总测试数: ${totalTests}`);
console.log(`通过: ${passedTests} (${(passedTests / totalTests * 100).toFixed(1)}%)`);
console.log(`失败: ${failedTests} (${(failedTests / totalTests * 100).toFixed(1)}%)`);

if (failedTests === 0) {
  console.log('\n🎉 所有测试通过！');
  process.exit(0);
} else {
  console.log(`\n❌ ${failedTests} 个测试失败`);
  process.exit(1);
}

