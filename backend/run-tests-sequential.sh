#!/bin/bash
# 顺序运行所有测试以避免数据库并发问题

echo "开始顺序运行后端测试..."
echo "================================"
echo ""

PASSED=0
FAILED=0
TOTAL_TESTS=0
FAILED_SUITES=""

# 测试文件列表
TEST_FILES=(
  "test/routes/orders.test.js"
  "test/routes/passengers.test.js"
  "test/routes/auth.test.js"
  "test/routes/register.test.js"
  "test/routes/trains.test.js"
  "test/routes/stations.test.js"
  "test/routes/tickets.test.js"
  "test/routes/userProfile.test.js"
  "test/services/authService.test.js"
  "test/services/passengerService.test.js"
  "test/services/orderService.test.js"
  "test/services/registrationDbService.test.js"
  "test/integration/login.integration.test.js"
)

for test_file in "${TEST_FILES[@]}"; do
  echo "运行: $test_file"
  
  # 删除测试数据库
  rm -f test/test.db 2>/dev/null
  
  # 运行测试
  output=$(npm test -- "$test_file" --forceExit 2>&1)
  exit_code=$?
  
  # 提取测试统计
  if echo "$output" | grep -q "Tests:"; then
    stats=$(echo "$output" | grep "Tests:" | tail -1)
    echo "  结果: $stats"
    
    # 提取通过的测试数
    passed=$(echo "$stats" | grep -oE '[0-9]+ passed' | grep -oE '[0-9]+')
    failed=$(echo "$stats" | grep -oE '[0-9]+ failed' | grep -oE '[0-9]+')
    
    if [ ! -z "$passed" ]; then
      PASSED=$((PASSED + passed))
      TOTAL_TESTS=$((TOTAL_TESTS + passed))
    fi
    
    if [ ! -z "$failed" ]; then
      FAILED=$((FAILED + failed))
      TOTAL_TESTS=$((TOTAL_TESTS + failed))
      FAILED_SUITES="$FAILED_SUITES\n  - $test_file ($failed failed)"
    fi
  fi
  
  if [ $exit_code -eq 0 ]; then
    echo "  ✅ 通过"
  else
    echo "  ❌ 失败"
  fi
  
  echo ""
done

echo "================================"
echo "测试总结:"
echo "  总测试数: $TOTAL_TESTS"
echo "  通过: $PASSED"
echo "  失败: $FAILED"
echo "  通过率: $(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL_TESTS)*100}")%"

if [ ! -z "$FAILED_SUITES" ]; then
  echo ""
  echo "失败的测试套件:"
  echo -e "$FAILED_SUITES"
fi

echo ""
echo "详细报告已保存到: backend/TEST_REPORT.md"

