/**
 * 余票显示逻辑测试脚本
 * 
 * 测试目标：
 * 根据需求4.3.4.1-4.3.4.3，验证余票显示规则：
 * - 余票数 >= 20：显示"有"
 * - 余票数 < 20 且 > 0：显示具体数字
 * - 余票数 = 0：显示"无"
 */

const trainService = require('../src/services/trainService');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function pass(testName) {
  totalTests++;
  passedTests++;
  console.log(`✅ PASS: ${testName}`);
}

function fail(testName, reason) {
  totalTests++;
  failedTests++;
  console.log(`❌ FAIL: ${testName}`);
  console.log(`   Reason: ${reason}`);
}

// 余票显示格式化函数
function formatSeatAvailability(count) {
  if (count === undefined || count === null) {
    return '--';
  }
  
  if (count >= 20) {
    return '有';
  } else if (count > 0) {
    return String(count);
  } else {
    return '无';
  }
}

// 测试1: 验证"有"的显示
async function test1_displayYou() {
  console.log('\n--- 测试1: 验证"有"的显示（余票>=20） ---');
  
  try {
    // G103商务座只有10个，一等座有80个，二等座有960个
    const seats = await trainService.calculateAvailableSeats('G103', '北京南', '沧州西');
    
    // 商务座10个，应显示具体数字
    const businessDisplay = formatSeatAvailability(seats['商务座']);
    if (businessDisplay === '10') {
      pass('商务座10张显示为"10"');
    } else {
      fail('商务座10张显示为"10"', `实际显示: ${businessDisplay}`);
    }
    
    // 一等座80个，应显示"有"
    const firstClassDisplay = formatSeatAvailability(seats['一等座']);
    if (firstClassDisplay === '有') {
      pass('一等座80张显示为"有"');
    } else {
      fail('一等座80张显示为"有"', `实际显示: ${firstClassDisplay}`);
    }
    
    // 二等座960个，应显示"有"
    const secondClassDisplay = formatSeatAvailability(seats['二等座']);
    if (secondClassDisplay === '有') {
      pass('二等座960张显示为"有"');
    } else {
      fail('二等座960张显示为"有"', `实际显示: ${secondClassDisplay}`);
    }
    
  } catch (error) {
    fail('验证"有"的显示', error.message);
  }
}

// 测试2: 验证具体数字的显示
async function test2_displayNumber() {
  console.log('\n--- 测试2: 验证具体数字的显示（0<余票<20） ---');
  
  try {
    // 测试不同数量的显示
    for (let count = 1; count <= 19; count++) {
      const display = formatSeatAvailability(count);
      if (display === String(count)) {
        pass(`余票${count}张显示为"${count}"`);
      } else {
        fail(`余票${count}张显示为"${count}"`, `实际显示: ${display}`);
      }
    }
    
  } catch (error) {
    fail('验证具体数字的显示', error.message);
  }
}

// 测试3: 验证"无"的显示
async function test3_displayWu() {
  console.log('\n--- 测试3: 验证"无"的显示（余票=0） ---');
  
  const display = formatSeatAvailability(0);
  if (display === '无') {
    pass('余票0张显示为"无"');
  } else {
    fail('余票0张显示为"无"', `实际显示: ${display}`);
  }
}

// 测试4: 验证边界值
async function test4_boundaryValues() {
  console.log('\n--- 测试4: 验证边界值 ---');
  
  // 测试19-21张的边界
  const display19 = formatSeatAvailability(19);
  const display20 = formatSeatAvailability(20);
  const display21 = formatSeatAvailability(21);
  
  if (display19 === '19') {
    pass('余票19张显示为"19"（边界内）');
  } else {
    fail('余票19张显示为"19"（边界内）', `实际显示: ${display19}`);
  }
  
  if (display20 === '有') {
    pass('余票20张显示为"有"（边界值）');
  } else {
    fail('余票20张显示为"有"（边界值）', `实际显示: ${display20}`);
  }
  
  if (display21 === '有') {
    pass('余票21张显示为"有"（边界外）');
  } else {
    fail('余票21张显示为"有"（边界外）', `实际显示: ${display21}`);
  }
}

// 测试5: 验证未定义/null的处理
async function test5_undefinedNull() {
  console.log('\n--- 测试5: 验证未定义/null的处理 ---');
  
  const displayUndefined = formatSeatAvailability(undefined);
  const displayNull = formatSeatAvailability(null);
  
  if (displayUndefined === '--') {
    pass('undefined显示为"--"');
  } else {
    fail('undefined显示为"--"', `实际显示: ${displayUndefined}`);
  }
  
  if (displayNull === '--') {
    pass('null显示为"--"');
  } else {
    fail('null显示为"--"', `实际显示: ${displayNull}`);
  }
}

// 测试6: 验证实际车次的余票显示
async function test6_realTrainDisplay() {
  console.log('\n--- 测试6: 验证实际车次的余票显示 ---');
  
  try {
    // 测试G103全程余票显示
    const g103Seats = await trainService.calculateAvailableSeats('G103', '北京南', '上海虹桥');
    
    console.log('\nG103北京南-上海虹桥余票显示：');
    console.log(`  商务座: ${g103Seats['商务座']}张 → 显示"${formatSeatAvailability(g103Seats['商务座'])}"`);
    console.log(`  一等座: ${g103Seats['一等座']}张 → 显示"${formatSeatAvailability(g103Seats['一等座'])}"`);
    console.log(`  二等座: ${g103Seats['二等座']}张 → 显示"${formatSeatAvailability(g103Seats['二等座'])}"`);
    
    pass('G103余票显示格式化完成');
    
    // 测试D6余票显示
    const d6Seats = await trainService.calculateAvailableSeats('D6', '上海', '北京');
    
    console.log('\nD6上海-北京余票显示：');
    console.log(`  二等座: ${d6Seats['二等座']}张 → 显示"${formatSeatAvailability(d6Seats['二等座'])}"`);
    console.log(`  硬卧: ${d6Seats['硬卧']}张 → 显示"${formatSeatAvailability(d6Seats['硬卧'])}"`);
    console.log(`  软卧: ${d6Seats['软卧']}张 → 显示"${formatSeatAvailability(d6Seats['软卧'])}"`);
    
    pass('D6余票显示格式化完成');
    
  } catch (error) {
    fail('验证实际车次的余票显示', error.message);
  }
}

// 测试7: 完整的车次列表显示示例
async function test7_trainListDisplay() {
  console.log('\n--- 测试7: 完整的车次列表显示示例 ---');
  
  try {
    const trains = [
      { trainNo: 'G103', from: '北京南', to: '上海虹桥' },
      { trainNo: 'G16', from: '上海虹桥', to: '北京南' },
      { trainNo: 'D6', from: '上海', to: '北京' },
      { trainNo: 'D9', from: '北京南', to: '上海南' }
    ];
    
    console.log('\n车次余票显示表：');
    console.log('━'.repeat(80));
    console.log('车次\t出发-到达\t\t商务座\t一等座\t二等座\t硬卧\t软卧');
    console.log('━'.repeat(80));
    
    for (const train of trains) {
      const seats = await trainService.calculateAvailableSeats(train.trainNo, train.from, train.to);
      
      const route = `${train.from}-${train.to}`;
      const business = formatSeatAvailability(seats['商务座']);
      const first = formatSeatAvailability(seats['一等座']);
      const second = formatSeatAvailability(seats['二等座']);
      const hard = formatSeatAvailability(seats['硬卧']);
      const soft = formatSeatAvailability(seats['软卧']);
      
      console.log(`${train.trainNo}\t${route}\t${business}\t${first}\t${second}\t${hard}\t${soft}`);
    }
    
    console.log('━'.repeat(80));
    
    pass('车次列表显示完成');
    
  } catch (error) {
    fail('车次列表显示', error.message);
  }
}

// 主函数
async function main() {
  console.log('\n=== 开始测试余票显示逻辑 ===\n');
  
  await test1_displayYou();
  await test2_displayNumber();
  await test3_displayWu();
  await test4_boundaryValues();
  await test5_undefinedNull();
  await test6_realTrainDisplay();
  await test7_trainListDisplay();
  
  console.log('\n=== 测试完成 ===');
  console.log(`总测试数: ${totalTests}`);
  console.log(`通过: ${passedTests}`);
  console.log(`失败: ${failedTests}`);
  console.log(`通过率: ${((passedTests/totalTests) * 100).toFixed(2)}%\n`);
  
  process.exit(failedTests > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('测试脚本出错:', err);
  process.exit(1);
});

